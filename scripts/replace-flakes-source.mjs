import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const flakesDir = path.join(root, "public", "catalog", "source", "flakes");
const backupsRoot = path.join(root, "public", "catalog", "source-backups");
const expectedCount = 15;

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function splitCamelCase(input) {
  return input.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function normalizeName(input) {
  return splitCamelCase(input)
    .toLowerCase()
    .replace(/^\d+[_-]?/, "")
    .replace(/[^a-z0-9]+/g, "");
}

function isNumbered(fileName) {
  return /^\d+[_-]/.test(path.parse(fileName).name);
}

async function listPngFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".png")
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function backupFolder(sourceDir, backupDir) {
  await ensureDir(backupDir);
  const files = await listPngFiles(sourceDir);
  await Promise.all(
    files.map((file) =>
      fs.copyFile(path.join(sourceDir, file), path.join(backupDir, file)),
    ),
  );
}

async function main() {
  await ensureDir(flakesDir);

  const allFiles = await listPngFiles(flakesDir);
  const numbered = allFiles.filter(isNumbered);
  const unnumbered = allFiles.filter((name) => !isNumbered(name));

  if (numbered.length !== expectedCount || unnumbered.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} numbered and ${expectedCount} unnumbered flake files. Found numbered=${numbered.length}, unnumbered=${unnumbered.length}.`,
    );
  }

  const numberedByKey = new Map(
    numbered.map((file) => [normalizeName(path.parse(file).name), file]),
  );
  const unnumberedByKey = new Map(
    unnumbered.map((file) => [normalizeName(path.parse(file).name), file]),
  );

  const missingInNew = [];
  const missingInOld = [];

  for (const [key, file] of numberedByKey) {
    if (!unnumberedByKey.has(key)) missingInNew.push(file);
  }

  for (const [key, file] of unnumberedByKey) {
    if (!numberedByKey.has(key)) missingInOld.push(file);
  }

  if (missingInNew.length || missingInOld.length) {
    throw new Error(
      [
        "Strict 1:1 title match failed for flake replacement.",
        missingInNew.length ? `Missing new counterparts for: ${missingInNew.join(", ")}` : "",
        missingInOld.length ? `Unmatched new files: ${missingInOld.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const mapping = numbered.map((numberedFile) => {
    const key = normalizeName(path.parse(numberedFile).name);
    return {
      key,
      target: numberedFile,
      replacement: unnumberedByKey.get(key),
    };
  });

  const backupDir = path.join(backupsRoot, `flakes-${timestamp()}`);
  await backupFolder(flakesDir, backupDir);

  for (const pair of mapping) {
    await fs.copyFile(
      path.join(flakesDir, pair.replacement),
      path.join(flakesDir, pair.target),
    );
  }

  await Promise.all(
    unnumbered.map((file) => fs.rm(path.join(flakesDir, file), { force: true })),
  );

  const finalFiles = await listPngFiles(flakesDir);
  if (finalFiles.length !== expectedCount || finalFiles.some((file) => !isNumbered(file))) {
    throw new Error(
      `Post-replacement validation failed. Expected ${expectedCount} numbered files, got ${finalFiles.length}.`,
    );
  }

  console.log("Flakes replacement complete.");
  console.log(`- Backup: ${path.relative(root, backupDir)}`);
  console.log(`- Replaced numbered files: ${mapping.length}`);
  console.log(`- Removed unnumbered duplicates: ${unnumbered.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
