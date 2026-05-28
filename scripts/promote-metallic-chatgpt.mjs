import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const expectedCount = 49;
const sourceDir = path.join(root, "public", "catalog", "source", "metallic");
const generatedDir = path.join(root, "public", "catalog", "hd", "pilot", "metallic-chatgpt", "metallic");
const backupsRoot = path.join(root, "public", "catalog", "source-backups");

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function isoStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listPngFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".png")
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function diffSets(aList, bList) {
  const a = new Set(aList);
  const b = new Set(bList);
  const onlyInA = aList.filter((item) => !b.has(item));
  const onlyInB = bList.filter((item) => !a.has(item));
  return { onlyInA, onlyInB };
}

async function backupSourceMetallics(fileNames) {
  const backupDir = path.join(backupsRoot, `metallic-${isoStamp()}`);
  await ensureDir(backupDir);
  await Promise.all(
    fileNames.map((name) =>
      fs.copyFile(path.join(sourceDir, name), path.join(backupDir, name)),
    ),
  );
  return backupDir;
}

async function promoteGeneratedMetallics(fileNames) {
  await Promise.all(
    fileNames.map((name) =>
      fs.copyFile(path.join(generatedDir, name), path.join(sourceDir, name)),
    ),
  );
}

async function main() {
  const [sourceFiles, generatedFiles] = await Promise.all([
    listPngFiles(sourceDir),
    listPngFiles(generatedDir),
  ]);

  if (sourceFiles.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} source metallic files, found ${sourceFiles.length}.`);
  }

  if (generatedFiles.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} generated metallic files, found ${generatedFiles.length}.`);
  }

  const { onlyInA, onlyInB } = diffSets(sourceFiles, generatedFiles);
  if (onlyInA.length || onlyInB.length) {
    throw new Error(
      [
        "Metallic filename mismatch between source and generated sets.",
        onlyInA.length ? `Only in source: ${onlyInA.join(", ")}` : "",
        onlyInB.length ? `Only in generated: ${onlyInB.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const backupDir = await backupSourceMetallics(sourceFiles);
  await promoteGeneratedMetallics(generatedFiles);

  console.log("Metallic promotion complete.");
  console.log(`- Replaced files: ${generatedFiles.length}`);
  console.log(`- Source target: ${toPosix(path.relative(root, sourceDir))}`);
  console.log(`- Backup saved: ${toPosix(path.relative(root, backupDir))}`);
  console.log("");
  console.log(
    "Note: Running `npm run catalog:sync` will overwrite these metallic source files with the external marketing source.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
