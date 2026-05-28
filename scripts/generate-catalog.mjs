import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "public", "catalog", "source");
const outputDir = path.join(root, "public", "catalog", "generated");
const manifestPath = path.join(root, "data", "catalog-manifest.json");
const categories = ["metallic", "flakes", "neon"];
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif"]);
const extensionPriority = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif"];
const widths = [360, 520, 768, 1080];
const thumbWidth = 340;

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

function parseName(name) {
  const baseName = path.parse(name).name;
  const match = baseName.match(/^(\d+)[_-]?(.*)$/);
  const number = match ? Number.parseInt(match[1], 10) : null;
  const rawTitle = (match?.[2] ?? baseName).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  const title =
    rawTitle.length > 0
      ? rawTitle
          .split(" ")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(" ")
      : baseName;

  return {
    number,
    title,
    slugBase: slugify(baseName),
  };
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

  return Array.from(grouped.values());
}

function sortByNumberAndName(a, b) {
  if (a.number !== null && b.number !== null && a.number !== b.number) {
    return a.number - b.number;
  }
  if (a.number !== null && b.number === null) return -1;
  if (a.number === null && b.number !== null) return 1;
  return a.name.localeCompare(b.name, undefined, { numeric: true });
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
      return {
        category: file.category,
        name: file.name,
        size: fileStat.size,
        mtimeMs: fileStat.mtimeMs,
      };
    }),
  );

  return JSON.stringify(stats);
}

async function canReuseExistingBuild(files, sourceFingerprint) {
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

  if (existingManifest.sourceFingerprint === sourceFingerprint) {
    return true;
  }

  const manifestStat = await fs.stat(manifestPath);
  const sourceStats = await Promise.all(files.map((file) => fs.stat(file.inputPath)));
  const latestSourceMtimeMs = Math.max(0, ...sourceStats.map((stat) => stat.mtimeMs));

  return latestSourceMtimeMs <= manifestStat.mtimeMs;
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

async function collectFiles() {
  const collected = [];

  for (const category of categories) {
    const categoryDir = path.join(sourceDir, category);
    await ensureDir(categoryDir);
    const entries = await fs.readdir(categoryDir, { withFileTypes: true });

    const chosen = chooseFiles(
      entries.filter((entry) => entry.isFile()).map((entry) => ({
        name: entry.name,
        inputPath: path.join(categoryDir, entry.name),
      })),
    );

    for (const file of chosen) {
      const parsed = parseName(file.name);
      collected.push({
        ...file,
        category,
        number: parsed.number,
        parsedTitle: parsed.title,
        slugBase: parsed.slugBase,
      });
    }
  }

  collected.sort((a, b) => {
    const categoryDelta = categories.indexOf(a.category) - categories.indexOf(b.category);
    if (categoryDelta !== 0) return categoryDelta;
    return sortByNumberAndName(a, b);
  });

  return collected;
}

async function main() {
  await ensureDir(sourceDir);
  const files = await collectFiles();

  if (
    files.length === 0 &&
    (process.env.CI === "true" || Boolean(process.env.VERCEL)) &&
    await canReuseCheckedInBuildWithoutSourceFiles()
  ) {
    console.log("Catalog source files are unavailable in CI; reusing checked-in generated assets.");
    return;
  }

  const sourceFingerprint = await getSourceFingerprint(files);
  if (await canReuseExistingBuild(files, sourceFingerprint)) {
    console.log(`Catalog assets are up to date (${files.length} source image${files.length === 1 ? "" : "s"}).`);
    return;
  }

  console.log(`Generating catalog assets for ${files.length} source image${files.length === 1 ? "" : "s"}...`);
  await fs.rm(outputDir, { recursive: true, force: true });
  await ensureDir(outputDir);

  const usedSlugs = new Set();
  const images = [];

  const slugEntries = files.map((file, index) => {
    const categoryPrefix = `${file.category}-${file.slugBase}`;
    const fallbackSlug = `${file.category}-${index + 1}`;
    const baseSlug = categoryPrefix || fallbackSlug;
    let slug = baseSlug;
    let counter = 2;

    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    usedSlugs.add(slug);
    return { file, slug, index };
  });

  const results = await Promise.all(
    slugEntries.map(async ({ file, slug, index }) => {
      const metadata = await sharp(file.inputPath).rotate().metadata();
      if (!metadata.width || !metadata.height) return null;

      const itemDir = path.join(outputDir, file.category, slug);
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
        avif: `/catalog/generated/${file.category}/${slug}/thumb-${safeThumbWidth}.avif`,
        webp: `/catalog/generated/${file.category}/${slug}/thumb-${safeThumbWidth}.webp`,
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
            avif: `/catalog/generated/${file.category}/${slug}/${width}.avif`,
            webp: `/catalog/generated/${file.category}/${slug}/${width}.webp`,
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
        category: file.category,
        number: file.number,
        title: file.parsedTitle,
        alt: `${file.parsedTitle} ${file.category} epoxy color swatch`.trim(),
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
