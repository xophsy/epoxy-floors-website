import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "public", "gallery", "source");
const outputDir = path.join(root, "public", "gallery", "generated");
const manifestPath = path.join(root, "data", "gallery-manifest.json");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif"]);
const extensionPriority = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif"];
const widths = [480, 768, 1080, 1440, 1920];
const thumbWidth = 520;
const args = new Set(process.argv.slice(2));
const verifyMode = args.has("--verify");

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function titleFromFileName(value) {
  return value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(targetPath) {
  try {
    return JSON.parse(await fs.readFile(targetPath, "utf8"));
  } catch {
    return null;
  }
}

async function hashFile(filePath) {
  const bytes = await fs.readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

function chooseFiles(entries) {
  const grouped = new Map();

  for (const entry of entries) {
    const ext = path.extname(entry.name).toLowerCase();
    if (!supportedExtensions.has(ext)) continue;

    const basename = path.parse(entry.name).name.toLowerCase();
    const current = grouped.get(basename);

    if (!current) {
      grouped.set(basename, entry);
      continue;
    }

    const currentRank = extensionPriority.indexOf(path.extname(current.name).toLowerCase());
    const nextRank = extensionPriority.indexOf(ext);

    if (nextRank !== -1 && (currentRank === -1 || nextRank < currentRank)) {
      grouped.set(basename, entry);
    }
  }

  return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

async function writeVariant(inputPath, outputPath, width, format) {
  const image = sharp(inputPath).rotate().resize({ width, withoutEnlargement: true });

  if (format === "avif") {
    await image.avif({ quality: 58 }).toFile(outputPath);
    return;
  }

  await image.webp({ quality: 76 }).toFile(outputPath);
}

async function getSourceFingerprint(files) {
  const stats = await Promise.all(
    files.map(async (file) => {
      const fileStat = await fs.stat(file.inputPath);
      const contentHash = await hashFile(file.inputPath);
      return {
        relativePath: toPosix(path.relative(root, file.inputPath)),
        name: file.name,
        size: fileStat.size,
        sha256: contentHash,
      };
    }),
  );

  return JSON.stringify(stats);
}

function generatedPathToAbsolute(webPath) {
  if (!webPath?.startsWith("/")) return null;
  return path.join(root, "public", webPath.slice(1));
}

async function hasAllGeneratedAssets(images) {
  const generatedFiles = new Set();

  for (const image of images) {
    const paths = [
      image?.thumbnail?.avif,
      image?.thumbnail?.webp,
      ...(Array.isArray(image?.responsive)
        ? image.responsive.flatMap((item) => [item?.avif, item?.webp])
        : []),
      image?.lightbox?.src,
    ];

    for (const webPath of paths) {
      const absolutePath = generatedPathToAbsolute(webPath);
      if (!absolutePath) continue;
      generatedFiles.add(absolutePath);
    }
  }

  const checks = await Promise.all(
    Array.from(generatedFiles).map(async (absolutePath) => {
      try {
        await fs.access(absolutePath);
        return true;
      } catch {
        return false;
      }
    }),
  );

  return checks.every(Boolean);
}

async function canReuseExistingBuild(files, sourceFingerprint, options = { verifyAssets: false }) {
  const [existingManifest, outputDirExists] = await Promise.all([
    readJson(manifestPath),
    pathExists(outputDir),
  ]);

  if (!existingManifest || !Array.isArray(existingManifest.images) || !outputDirExists) {
    return false;
  }

  if (existingManifest.images.length !== files.length) {
    return false;
  }

  const manifestTitles = existingManifest.images.map((image) => image.title);
  const sourceTitles = files.map((file) => titleFromFileName(path.parse(file.name).name));

  if (manifestTitles.join("\n") !== sourceTitles.join("\n")) {
    return false;
  }

  if (files.length > 0) {
    const generatedEntries = await fs.readdir(outputDir, { withFileTypes: true });
    if (!generatedEntries.some((entry) => entry.isDirectory())) {
      return false;
    }
  }

  if (existingManifest.sourceFingerprint !== sourceFingerprint) {
    return false;
  }

  if (options.verifyAssets) {
    return hasAllGeneratedAssets(existingManifest.images);
  }

  return true;
}

async function canReuseCheckedInBuildWithoutSourceFiles() {
  const [existingManifest, outputDirExists] = await Promise.all([
    readJson(manifestPath),
    pathExists(outputDir),
  ]);

  if (
    !existingManifest ||
    !Array.isArray(existingManifest.images) ||
    existingManifest.images.length === 0 ||
    !outputDirExists
  ) {
    return false;
  }

  const generatedEntries = await fs.readdir(outputDir, { withFileTypes: true });
  return generatedEntries.some((entry) => entry.isDirectory());
}

async function main() {
  await ensureDir(sourceDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const files = chooseFiles(
    entries.filter((entry) => entry.isFile()).map((entry) => ({
      name: entry.name,
      inputPath: path.join(sourceDir, entry.name),
    })),
  );

  if (
    files.length === 0 &&
    (process.env.CI === "true" || Boolean(process.env.VERCEL)) &&
    await canReuseCheckedInBuildWithoutSourceFiles()
  ) {
    console.log("Gallery source files are unavailable in CI; reusing checked-in generated assets.");
    return;
  }

  const sourceFingerprint = await getSourceFingerprint(files);
  const upToDate = await canReuseExistingBuild(files, sourceFingerprint, { verifyAssets: verifyMode });

  if (verifyMode) {
    if (!upToDate) {
      throw new Error(
        "Gallery generated assets are stale. Run `npm run gallery:build` and commit updated `public/gallery/generated` + `data/gallery-manifest.json`.",
      );
    }
    console.log(`Gallery assets verified (${files.length} source image${files.length === 1 ? "" : "s"}).`);
    return;
  }

  if (upToDate) {
    console.log(`Gallery assets are up to date (${files.length} source image${files.length === 1 ? "" : "s"}).`);
    return;
  }

  console.log(`Generating gallery assets for ${files.length} source image${files.length === 1 ? "" : "s"}...`);
  await fs.rm(outputDir, { recursive: true, force: true });
  await ensureDir(outputDir);

  const usedSlugs = new Set();
  const images = [];

  const slugEntries = files.map((file, index) => {
    const parsed = path.parse(file.name);
    const baseSlug = slugify(parsed.name) || `image-${index + 1}`;
    let slug = baseSlug;
    let counter = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    usedSlugs.add(slug);
    return { file, index, slug };
  });

  const results = await Promise.all(
    slugEntries.map(async ({ file, index, slug }) => {
      const parsed = path.parse(file.name);
      const metadata = await sharp(file.inputPath).rotate().metadata();
      if (!metadata.width || !metadata.height) return null;

      const itemDir = path.join(outputDir, slug);
      await ensureDir(itemDir);

      const targetWidths = Array.from(new Set([...widths, metadata.width]))
        .filter((width) => width <= metadata.width)
        .sort((a, b) => a - b);

      const safeThumbWidth = Math.min(thumbWidth, metadata.width);
      await Promise.all([
        writeVariant(file.inputPath, path.join(itemDir, `thumb-${safeThumbWidth}.avif`), safeThumbWidth, "avif"),
        writeVariant(file.inputPath, path.join(itemDir, `thumb-${safeThumbWidth}.webp`), safeThumbWidth, "webp"),
      ]);

      const thumbnail = {
        width: safeThumbWidth,
        height: Math.round((metadata.height / metadata.width) * safeThumbWidth),
        avif: `/gallery/generated/${slug}/thumb-${safeThumbWidth}.avif`,
        webp: `/gallery/generated/${slug}/thumb-${safeThumbWidth}.webp`,
      };

      const responsive = await Promise.all(
        targetWidths.map(async (width) => {
          const height = Math.round((metadata.height / metadata.width) * width);
          await Promise.all([
            writeVariant(file.inputPath, path.join(itemDir, `${width}.avif`), width, "avif"),
            writeVariant(file.inputPath, path.join(itemDir, `${width}.webp`), width, "webp"),
          ]);
          return {
            width,
            height,
            avif: `/gallery/generated/${slug}/${width}.avif`,
            webp: `/gallery/generated/${slug}/${width}.webp`,
          };
        }),
      );

      const lightbox = responsive[responsive.length - 1] ?? {
        width: thumbnail.width,
        height: thumbnail.height,
        webp: thumbnail.webp,
      };

      return {
        id: `${index + 1}`,
        slug,
        title: titleFromFileName(parsed.name),
        alt: titleFromFileName(parsed.name),
        width: metadata.width,
        height: metadata.height,
        thumbnail,
        responsive,
        lightbox: {
          src: lightbox.webp,
          width: lightbox.width,
          height: lightbox.height,
        },
      };
    }),
  );

  for (const result of results) {
    if (result) images.push(result);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDir: toPosix(path.relative(root, sourceDir)),
    sourceFingerprint,
    images,
  };

  await ensureDir(path.dirname(manifestPath));
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
