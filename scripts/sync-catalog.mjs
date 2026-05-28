import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir =
  process.env.CATALOG_SOURCE_DIR ??
  "C:/Users/softsea/Desktop/Marketing/GoldenEpoxy/colors";
const targetRoot = path.join(root, "public", "catalog", "source");
const supportedExtensions = new Set([".png"]);

function inferCategory(folderName) {
  const name = folderName.toLowerCase();
  if (name.includes("metallic")) return "metallic";
  if (name.includes("flake")) return "flakes";
  if (name.includes("neon")) return "neon";
  return null;
}

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

async function removeDir(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true });
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const resolvedSource = path.resolve(sourceDir);
  const stat = await fs.stat(resolvedSource).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new Error(`Catalog source directory not found: ${resolvedSource}`);
  }

  await removeDir(targetRoot);
  await Promise.all([
    ensureDir(path.join(targetRoot, "metallic")),
    ensureDir(path.join(targetRoot, "flakes")),
    ensureDir(path.join(targetRoot, "neon")),
  ]);

  const files = await listFiles(resolvedSource);
  const copyQueue = files
    .map((filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (!supportedExtensions.has(ext)) return null;

      const parentFolder = path.basename(path.dirname(filePath));
      const category = inferCategory(parentFolder);
      if (!category) return null;

      return {
        source: filePath,
        target: path.join(targetRoot, category, path.basename(filePath)),
        category,
      };
    })
    .filter(Boolean);

  const seenTargets = new Set();
  for (const item of copyQueue) {
    const duplicateKey = `${item.category}/${path.basename(item.target).toLowerCase()}`;
    if (seenTargets.has(duplicateKey)) {
      throw new Error(`Duplicate filename in category "${item.category}": ${path.basename(item.target)}`);
    }
    seenTargets.add(duplicateKey);
  }

  await Promise.all(copyQueue.map((item) => fs.copyFile(item.source, item.target)));

  const counts = copyQueue.reduce(
    (acc, item) => {
      acc[item.category] += 1;
      return acc;
    },
    { metallic: 0, flakes: 0, neon: 0 },
  );

  const total = counts.metallic + counts.flakes + counts.neon;
  console.log(`Catalog sync complete: ${total} files copied.`);
  console.log(`- Metallic: ${counts.metallic}`);
  console.log(`- Flakes: ${counts.flakes}`);
  console.log(`- Neon: ${counts.neon}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
