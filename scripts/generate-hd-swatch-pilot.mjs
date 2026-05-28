import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "public", "catalog", "source", "metallic");
const outputDir = path.join(root, "public", "catalog", "hd", "pilot", "metallic");
const manifestPath = path.join(root, "data", "catalog-hd-pilot-manifest.json");
const OUTPUT_SIZE = 2048;
const PILOT_MAX = 12;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rgbToHex(rgb) {
  return `#${rgb
    .map((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function colorDistanceSq(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function parseNumber(name) {
  const match = name.match(/^(\d+)/);
  return match ? Number.parseInt(match[1], 10) : Number.POSITIVE_INFINITY;
}

function makeSeedFromName(name) {
  let seed = 2166136261;
  for (let i = 0; i < name.length; i += 1) {
    seed ^= name.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function createRng(seedInput) {
  let seed = seedInput >>> 0;
  if (seed === 0) seed = 0x6d2b79f5;
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) & 0xffffffff) / 4294967295;
  };
}

async function readRgbPixels(filePath) {
  const image = sharp(filePath).removeAlpha();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Unable to read image dimensions for: ${filePath}`);
  }

  const width = metadata.width;
  const height = metadata.height;
  const raw = await image.raw().toBuffer();
  return { width, height, raw };
}

function getPixel(raw, width, x, y) {
  const idx = (y * width + x) * 3;
  return [raw[idx], raw[idx + 1], raw[idx + 2]];
}

function detectContentBounds(raw, width, height) {
  const border = Math.max(4, Math.floor(Math.min(width, height) * 0.03));
  const edgeSamples = [];

  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < border; y += 1) {
      edgeSamples.push(getPixel(raw, width, x, y));
      edgeSamples.push(getPixel(raw, width, x, height - 1 - y));
    }
  }
  for (let y = border; y < height - border; y += 1) {
    for (let x = 0; x < border; x += 1) {
      edgeSamples.push(getPixel(raw, width, x, y));
      edgeSamples.push(getPixel(raw, width, width - 1 - x, y));
    }
  }

  const edgeMedian = [0, 0, 0].map((_, c) => {
    const channel = edgeSamples.map((pixel) => pixel[c]).sort((a, b) => a - b);
    return channel[Math.floor(channel.length / 2)];
  });

  const thresholdSq = 6 * 6;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = getPixel(raw, width, x, y);
      if (colorDistanceSq(pixel, edgeMedian) > thresholdSq) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const hasContent = maxX >= minX && maxY >= minY;
  if (!hasContent) {
    return {
      x0: Math.floor(width * 0.1),
      y0: Math.floor(height * 0.1),
      x1: Math.ceil(width * 0.9),
      y1: Math.ceil(height * 0.9),
    };
  }

  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  if (contentWidth < width * 0.35 || contentHeight < height * 0.35) {
    return {
      x0: Math.floor(width * 0.1),
      y0: Math.floor(height * 0.1),
      x1: Math.ceil(width * 0.9),
      y1: Math.ceil(height * 0.9),
    };
  }

  return {
    x0: minX,
    y0: minY,
    x1: maxX + 1,
    y1: maxY + 1,
  };
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.floor((sorted.length - 1) * p);
  return sorted[index];
}

function extractTargetColor(raw, width, height, bounds) {
  const bw = bounds.x1 - bounds.x0;
  const bh = bounds.y1 - bounds.y0;
  const cx = bounds.x0 + bw / 2;
  const cy = bounds.y0 + bh / 2;
  const sigmaX = bw * 0.32;
  const sigmaY = bh * 0.32;

  const lums = [];
  for (let y = bounds.y0; y < bounds.y1; y += 2) {
    for (let x = bounds.x0; x < bounds.x1; x += 2) {
      const [r, g, b] = getPixel(raw, width, x, y);
      lums.push(luminance(r, g, b));
    }
  }
  const p10 = percentile(lums, 0.1);
  const p90 = percentile(lums, 0.9);

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let wSum = 0;

  for (let y = bounds.y0; y < bounds.y1; y += 1) {
    for (let x = bounds.x0; x < bounds.x1; x += 1) {
      const [r, g, b] = getPixel(raw, width, x, y);
      const lum = luminance(r, g, b);
      const dx = (x - cx) / sigmaX;
      const dy = (y - cy) / sigmaY;
      let weight = Math.exp(-0.5 * (dx * dx + dy * dy));

      if (lum > p90) {
        weight *= 0.55;
      } else if (lum < p10) {
        weight *= 0.85;
      }

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
      weight *= 1 + sat * 0.25;

      rSum += r * weight;
      gSum += g * weight;
      bSum += b * weight;
      wSum += weight;
    }
  }

  if (wSum === 0) {
    return [180, 180, 180];
  }
  return [rSum / wSum, gSum / wSum, bSum / wSum];
}

function createNoiseBuffer(width, height, seed, granularity = 1) {
  const rng = createRng(seed);
  const buffer = Buffer.alloc(width * height);
  for (let i = 0; i < buffer.length; i += 1) {
    const base = 127 + (rng() - 0.5) * 110 * granularity;
    buffer[i] = Math.round(clamp(base, 0, 255));
  }
  return buffer;
}

async function buildTextureLayers(baseColor, seedName) {
  const baseSeed = makeSeedFromName(seedName);

  const cloudBase = await sharp(
    createNoiseBuffer(320, 320, baseSeed ^ 0x8f1d5b79, 1),
    { raw: { width: 320, height: 320, channels: 1 } },
  )
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { kernel: sharp.kernel.cubic })
    .blur(7.2)
    .raw()
    .toBuffer();

  const veilBase = await sharp(
    createNoiseBuffer(220, 220, baseSeed ^ 0x4a3f2c11, 1),
    { raw: { width: 220, height: 220, channels: 1 } },
  )
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { kernel: sharp.kernel.cubic })
    .blur(12.5)
    .raw()
    .toBuffer();

  const grainBase = await sharp(
    createNoiseBuffer(640, 640, baseSeed ^ 0xb13fd2a7, 0.65),
    { raw: { width: 640, height: 640, channels: 1 } },
  )
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { kernel: sharp.kernel.cubic })
    .blur(0.55)
    .raw()
    .toBuffer();

  const highlightRgb = baseColor.map((v) => clamp(v + 14, 0, 255));
  const shadowRgb = baseColor.map((v) => clamp(v - 11, 0, 255));
  const grainRgb = baseColor.map((v) => clamp(v + 4, 0, 255));

  const cloudRgba = Buffer.alloc(OUTPUT_SIZE * OUTPUT_SIZE * 4);
  const shadowRgba = Buffer.alloc(OUTPUT_SIZE * OUTPUT_SIZE * 4);
  const grainRgba = Buffer.alloc(OUTPUT_SIZE * OUTPUT_SIZE * 4);

  for (let i = 0; i < OUTPUT_SIZE * OUTPUT_SIZE; i += 1) {
    const c = cloudBase[i];
    const v = veilBase[i];
    const g = grainBase[i];

    const hiAlpha = clamp(Math.round((c - 124) * 0.34), 0, 36);
    const shAlpha = clamp(Math.round((130 - v) * 0.28), 0, 28);
    const grAlpha = clamp(Math.round(Math.abs(g - 127) * 0.1), 0, 8);

    const px = i * 4;

    cloudRgba[px] = highlightRgb[0];
    cloudRgba[px + 1] = highlightRgb[1];
    cloudRgba[px + 2] = highlightRgb[2];
    cloudRgba[px + 3] = hiAlpha;

    shadowRgba[px] = shadowRgb[0];
    shadowRgba[px + 1] = shadowRgb[1];
    shadowRgba[px + 2] = shadowRgb[2];
    shadowRgba[px + 3] = shAlpha;

    grainRgba[px] = grainRgb[0];
    grainRgba[px + 1] = grainRgb[1];
    grainRgba[px + 2] = grainRgb[2];
    grainRgba[px + 3] = grAlpha;
  }

  return [
    { input: cloudRgba, raw: { width: OUTPUT_SIZE, height: OUTPUT_SIZE, channels: 4 }, blend: "over" },
    { input: shadowRgba, raw: { width: OUTPUT_SIZE, height: OUTPUT_SIZE, channels: 4 }, blend: "over" },
    { input: grainRgba, raw: { width: OUTPUT_SIZE, height: OUTPUT_SIZE, channels: 4 }, blend: "overlay" },
  ];
}

async function generateSwatch(sourceName) {
  const sourcePath = path.join(sourceDir, sourceName);
  const outputName = `${path.parse(sourceName).name}_hd_2048.png`;
  const outputPath = path.join(outputDir, outputName);

  const { width, height, raw } = await readRgbPixels(sourcePath);
  const bounds = detectContentBounds(raw, width, height);
  const targetColor = extractTargetColor(raw, width, height, bounds);
  const rounded = targetColor.map((v) => Math.round(v));
  const layers = await buildTextureLayers(rounded, sourceName);

  await sharp({
    create: {
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      channels: 3,
      background: { r: rounded[0], g: rounded[1], b: rounded[2] },
    },
  })
    .composite(layers)
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
    .toFile(outputPath);

  return {
    id: path.parse(sourceName).name,
    name: path.parse(sourceName).name.replace(/[_-]+/g, " ").trim(),
    sourcePath: path.posix.join("public", "catalog", "source", "metallic", sourceName),
    outputPath: path.posix.join("public", "catalog", "hd", "pilot", "metallic", outputName),
    targetRgb: rounded,
    targetHex: rgbToHex(rounded),
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
    generatedAt: new Date().toISOString(),
  };
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const sourceEntries = (await fs.readdir(sourceDir))
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .sort((a, b) => parseNumber(a) - parseNumber(b))
    .slice(0, PILOT_MAX);

  if (sourceEntries.length !== PILOT_MAX) {
    throw new Error(`Expected ${PILOT_MAX} source files, found ${sourceEntries.length}`);
  }

  const manifestEntries = [];
  for (const sourceName of sourceEntries) {
    const entry = await generateSwatch(sourceName);
    manifestEntries.push(entry);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    collection: "metallic-pilot-01-12",
    count: manifestEntries.length,
    entries: manifestEntries,
  };

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Generated ${manifestEntries.length} HD pilot swatches.`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
