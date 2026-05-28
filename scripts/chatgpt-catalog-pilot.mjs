import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { spawn, spawnSync } from "node:child_process";
import { stdin as input, stdout as output } from "node:process";

const root = process.cwd();
const runUrl = "https://chatgpt.com";
const maxAttempts = 3;
const promptVersion = "v3-assisted-texture";
const categoryOrder = ["metallic", "flakes", "neon"];
const expectedCounts = {
  metallic: 49,
  flakes: 15,
  neon: 10,
};

const sourceRoot = path.join(root, "public", "catalog", "source");
const outputRoot = path.join(root, "public", "catalog", "hd", "pilot", "metallic-chatgpt");
const manifestPath = path.join(root, "data", "catalog-chatgpt-pilot-manifest.json");
const downloadsDir =
  process.env.CHATGPT_DOWNLOADS_DIR?.trim() || path.join(os.homedir(), "Downloads");

const limitOverrideRaw = process.env.SWATCH_PILOT_LIMIT?.trim();
const limitOverride = limitOverrideRaw ? Number.parseInt(limitOverrideRaw, 10) : null;

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function parseNumber(name) {
  const match = name.match(/^(\d+)/);
  return match ? Number.parseInt(match[1], 10) : Number.POSITIVE_INFINITY;
}

function safeError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return JSON.stringify(error);
}

function normalizePromptName(sourceName) {
  return sourceName.replace(/\.png$/i, "").replace(/_/g, " ");
}

function buildCategoryPrompt(category, sourceName) {
  const label = normalizePromptName(sourceName);
  const universal = [
    `Use the uploaded swatch "${label}" as the only color reference.`,
    "Generate one 1:1 square epoxy flooring swatch.",
    "Top priority: accurate real-world color fidelity to the reference.",
    "Full-bleed only: no border, no frame, no margins.",
    "No text, logos, watermarks, objects, or background scene.",
    "Avoid artifacts, banding, repeating seams, and unnatural blotches.",
  ];

  if (category === "metallic") {
    return [
      ...universal,
      "Render as metallic epoxy with pearlescent sheen and directional reflectivity.",
      "Include soft depth variation and controlled highlight rolloff typical of cured metallic resin.",
      "Keep movement elegant and subtle, with realistic pigment flow and no dramatic marbling.",
    ].join(" ");
  }

  if (category === "flakes") {
    return [
      ...universal,
      "Render as flake epoxy with visible multi-chip aggregate embedded under clear resin.",
      "Use realistic chip size variance and random natural distribution across the surface.",
      "Maintain a clean, sealed finish with gentle depth and no heavy glare.",
    ].join(" ");
  }

  return [
    ...universal,
    "Render as neon epoxy with saturated fluorescent pigment behavior from real coatings.",
    "Keep finish smooth and premium with subtle resin movement, not flat paint.",
    "Do not add glow effects, neon lighting, bloom, or stylized luminescence.",
  ].join(" ");
}

function categoryPromptType(category) {
  return `${category}-real-world`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listCategoryFiles(category) {
  const categoryDir = path.join(sourceRoot, category);
  const files = (await fs.readdir(categoryDir))
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .sort((a, b) => {
      const numDiff = parseNumber(a) - parseNumber(b);
      if (numDiff !== 0) return numDiff;
      return a.localeCompare(b);
    });

  return files.map((sourceName) => ({
    category,
    sourceName,
    sourcePath: path.join(categoryDir, sourceName),
    number: parseNumber(sourceName),
  }));
}

async function getAllSwatches() {
  const grouped = {};
  for (const category of categoryOrder) {
    grouped[category] = await listCategoryFiles(category);
  }

  const counts = Object.fromEntries(
    categoryOrder.map((category) => [category, grouped[category].length]),
  );

  let all = categoryOrder.flatMap((category) => grouped[category]);
  if (Number.isInteger(limitOverride) && limitOverride > 0) {
    all = all.slice(0, limitOverride);
  }

  return { all, counts };
}

async function preflight(swatches, counts) {
  await ensureDir(outputRoot);

  const downloadsStat = await fs.stat(downloadsDir).catch(() => null);
  if (!downloadsStat || !downloadsStat.isDirectory()) {
    throw new Error(`Downloads directory not found: ${downloadsDir}`);
  }

  for (const category of categoryOrder) {
    const expected = expectedCounts[category];
    const actual = counts[category] ?? 0;
    if (actual !== expected) {
      throw new Error(`Expected ${expected} ${category} files, found ${actual}`);
    }
  }

  const total = categoryOrder.reduce((sum, category) => sum + (counts[category] ?? 0), 0);
  if (total !== 74) {
    throw new Error(`Expected total 74 swatches, found ${total}`);
  }

  if (!swatches.length) {
    throw new Error("No swatches available for processing.");
  }
}

function makeKey(category, sourceName) {
  return `${category}::${sourceName}`;
}

function inferLegacyCategory(entry, sourceLookup) {
  if (entry?.category && categoryOrder.includes(entry.category)) {
    return entry.category;
  }

  const fromPath = String(entry?.savedPath ?? "");
  for (const category of categoryOrder) {
    if (fromPath.includes(`/${category}/`) || fromPath.includes(`\\${category}\\`)) {
      return category;
    }
  }

  const matched = sourceLookup.get(entry?.sourceName ?? "");
  if (matched?.length === 1) return matched[0];

  const oldSourceDir = String(entry?.sourceDir ?? "");
  if (oldSourceDir.includes("metallic")) return "metallic";
  if (oldSourceDir.includes("flakes")) return "flakes";
  if (oldSourceDir.includes("neon")) return "neon";
  return null;
}

function migrateEntries(entries, sourceLookup) {
  const migrated = [];
  const seen = new Set();

  for (const rawEntry of entries ?? []) {
    const category = inferLegacyCategory(rawEntry, sourceLookup);
    if (!category) {
      migrated.push(rawEntry);
      continue;
    }

    const sourceName = rawEntry.sourceName;
    const key = makeKey(category, sourceName);
    const normalized = {
      ...rawEntry,
      category,
      sourceName,
      promptType: rawEntry.promptType ?? categoryPromptType(category),
      promptVersion: rawEntry.promptVersion ?? promptVersion,
    };

    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    migrated.push(normalized);
  }

  return migrated;
}

async function readManifestOrCreate(runId, counts, sourceLookup) {
  const fallback = {
    runId,
    generatedAt: new Date().toISOString(),
    collection: "all",
    categories: counts,
    count: 0,
    promptVersion,
    sourceDir: path.posix.join("public", "catalog", "source"),
    outputDir: path.posix.join("public", "catalog", "hd", "pilot", "metallic-chatgpt"),
    entries: [],
  };

  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw);
    const entries = migrateEntries(parsed?.entries ?? [], sourceLookup);

    return {
      ...fallback,
      ...parsed,
      runId: parsed?.runId ?? runId,
      collection: "all",
      categories: counts,
      promptVersion,
      sourceDir: path.posix.join("public", "catalog", "source"),
      outputDir: path.posix.join("public", "catalog", "hd", "pilot", "metallic-chatgpt"),
      entries,
    };
  } catch {
    return fallback;
  }
}

async function saveManifest(manifest) {
  manifest.count = manifest.entries.length;
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function isExistingFile(filePath) {
  if (!filePath) return false;
  const stat = await fs.stat(filePath).catch(() => null);
  return Boolean(stat?.isFile());
}

function resolveSavedPathToAbsolute(savedPath) {
  if (typeof savedPath !== "string" || !savedPath.trim()) return null;
  const normalized = path.normalize(savedPath.trim());
  return path.isAbsolute(normalized) ? normalized : path.join(root, normalized);
}

async function reconcileManifestWithDisk(manifest) {
  let changed = false;
  const reconciledEntries = [];

  for (const entry of manifest.entries ?? []) {
    if (entry?.status !== "success" || !entry?.category || !entry?.sourceName) {
      reconciledEntries.push(entry);
      continue;
    }

    const savedPathAbs = resolveSavedPathToAbsolute(entry.savedPath);
    const expectedPathAbs = path.join(outputRoot, entry.category, entry.sourceName);

    let outputExists = false;
    if (await isExistingFile(expectedPathAbs)) {
      outputExists = true;
    } else if (savedPathAbs && await isExistingFile(savedPathAbs)) {
      outputExists = true;
    }

    if (outputExists) {
      reconciledEntries.push(entry);
      continue;
    }

    changed = true;
    reconciledEntries.push({
      ...entry,
      status: "missing",
      error: "Output missing on disk",
      reconciledAt: new Date().toISOString(),
    });
  }

  if (changed) {
    manifest.entries = reconciledEntries;
  }

  return changed;
}

async function listImageFiles(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const candidates = [];

  for (const file of files) {
    if (!file.isFile()) continue;
    const ext = path.extname(file.name).toLowerCase();
    if (!imageExtensions.has(ext)) continue;
    if (file.name.endsWith(".crdownload") || file.name.endsWith(".tmp")) continue;
    const fullPath = path.join(dir, file.name);
    const stat = await fs.stat(fullPath);
    candidates.push({
      fullPath,
      name: file.name,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
    });
  }
  return candidates;
}

function snapshotKey(item) {
  return `${item.name}|${Math.round(item.mtimeMs)}|${item.size}`;
}

async function takeDownloadSnapshot() {
  const items = await listImageFiles(downloadsDir);
  return new Set(items.map(snapshotKey));
}

async function detectNewestDownloadedImage(beforeSnapshot) {
  const items = await listImageFiles(downloadsDir);
  const newOnes = items.filter((item) => !beforeSnapshot.has(snapshotKey(item)));
  if (newOnes.length > 0) {
    return newOnes.sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
  }
  return items.sort((a, b) => b.mtimeMs - a.mtimeMs)[0] ?? null;
}

async function moveWithReplace(sourcePath, outputPath) {
  await ensureDir(path.dirname(outputPath));
  await fs.rm(outputPath, { force: true });
  try {
    await fs.rename(sourcePath, outputPath);
    return;
  } catch (error) {
    if (error?.code !== "EXDEV") throw error;
  }
  const bytes = await fs.readFile(sourcePath);
  await fs.writeFile(outputPath, bytes);
  await fs.rm(sourcePath, { force: true });
}

function copyPromptToClipboard(promptText) {
  if (process.platform !== "win32") return false;
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-Command", "Set-Clipboard -Value ([Console]::In.ReadToEnd())"],
    { input: promptText, encoding: "utf8" },
  );
  return result.status === 0;
}

function openInBrowser(url) {
  if (process.platform === "win32") {
    spawn("cmd.exe", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}

async function processOne(rl, swatch, attempt) {
  const { category, sourceName, sourcePath } = swatch;
  const prompt = buildCategoryPrompt(category, sourceName);
  const outputPath = path.join(outputRoot, category, sourceName);
  const outputRel = path.posix.join(
    "public",
    "catalog",
    "hd",
    "pilot",
    "metallic-chatgpt",
    category,
    sourceName,
  );

  const copied = copyPromptToClipboard(prompt);
  const beforeSnapshot = await takeDownloadSnapshot();

  console.log("");
  console.log(`Category: ${category}`);
  console.log(`Source: ${sourcePath}`);
  console.log(`Save as: ${outputPath}`);
  console.log(`Attempt: ${attempt}/${maxAttempts}`);
  if (copied) {
    console.log("Prompt copied to clipboard.");
  } else {
    console.log("Could not copy prompt to clipboard automatically.");
  }
  console.log("Prompt:");
  console.log(prompt);
  console.log("");

  const answer = (
    await rl.question("After you upload, generate, and download, press Enter. Type 'skip' to skip: ")
  ).trim().toLowerCase();

  if (answer === "skip") {
    return {
      category,
      sourceName,
      savedPath: null,
      status: "skipped",
      attempts: attempt,
      error: "Skipped by user",
      promptType: categoryPromptType(category),
      promptVersion,
      generatedAt: new Date().toISOString(),
    };
  }

  const newest = await detectNewestDownloadedImage(beforeSnapshot);
  if (!newest) {
    throw new Error(`No image files found in downloads directory: ${downloadsDir}`);
  }

  await moveWithReplace(newest.fullPath, outputPath);
  const meta = await fs.stat(outputPath);
  if (!meta.size) {
    throw new Error(`Output file is empty: ${outputPath}`);
  }

  return {
    category,
    sourceName,
    savedPath: outputRel,
    status: "success",
    attempts: attempt,
    error: null,
    promptType: categoryPromptType(category),
    promptVersion,
    generatedAt: new Date().toISOString(),
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const { all: swatches, counts } = await getAllSwatches();
  await preflight(swatches, counts);

  if (args.has("--preflight")) {
    const total = categoryOrder.reduce((sum, category) => sum + (counts[category] ?? 0), 0);
    console.log(`Preflight OK: metallic=${counts.metallic}, flakes=${counts.flakes}, neon=${counts.neon}, total=${total}`);
    if (Number.isInteger(limitOverride) && limitOverride > 0) {
      console.log(`Processing limit override active: ${limitOverride}`);
    }
    console.log(`Downloads directory: ${downloadsDir}`);
    for (const swatch of swatches) {
      console.log(`${swatch.category}/${swatch.sourceName}`);
    }
    return;
  }

  const sourceLookup = new Map();
  for (const swatch of swatches) {
    const current = sourceLookup.get(swatch.sourceName) ?? [];
    current.push(swatch.category);
    sourceLookup.set(swatch.sourceName, current);
  }

  const runId = `chatgpt-all-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const manifest = await readManifestOrCreate(runId, counts, sourceLookup);
  const reconciled = await reconcileManifestWithDisk(manifest);
  if (reconciled) {
    await saveManifest(manifest);
  }

  const completed = new Set(
    manifest.entries
      .filter((entry) => entry.status === "success" && entry.category && entry.sourceName)
      .map((entry) => makeKey(entry.category, entry.sourceName)),
  );

  const remaining = swatches.filter((swatch) => !completed.has(makeKey(swatch.category, swatch.sourceName)));

  if (!remaining.length) {
    console.log("All swatches are already marked successful in manifest.");
    return;
  }

  const rl = readline.createInterface({ input, output });

  try {
    console.log("Opening ChatGPT in your default browser...");
    openInBrowser(runUrl);
    console.log("Complete login and any human verification in that browser tab.");
    console.log(`Downloads folder being watched: ${downloadsDir}`);
    console.log(`Run scope: ${remaining.length} pending swatches`);
    console.log("");

    const startAnswer = (
      await rl.question("Press Enter when ready to begin, or type 'q' to quit: ")
    ).trim().toLowerCase();
    if (startAnswer === "q") {
      console.log("Exited before processing files.");
      return;
    }

    for (const swatch of remaining) {
      const { category, sourceName } = swatch;
      let success = false;
      let lastError = null;

      console.log("");
      console.log(`Processing ${category}/${sourceName}`);

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const entry = await processOne(rl, swatch, attempt);
          manifest.entries = manifest.entries.filter(
            (item) => makeKey(item.category, item.sourceName) !== makeKey(category, sourceName),
          );
          manifest.entries.push(entry);
          await saveManifest(manifest);
          if (entry.status === "skipped") {
            console.log(`Skipped ${category}/${sourceName}.`);
          } else {
            console.log(`Saved ${category}/${sourceName} to output folder.`);
          }
          success = true;
          break;
        } catch (error) {
          lastError = safeError(error);
          console.log(`Attempt failed: ${lastError}`);
          if (attempt < maxAttempts) {
            const retryAnswer = (
              await rl.question("Press Enter to retry, type 'skip' to skip, or 'q' to quit: ")
            ).trim().toLowerCase();

            if (retryAnswer === "q") {
              manifest.entries = manifest.entries.filter(
                (item) => makeKey(item.category, item.sourceName) !== makeKey(category, sourceName),
              );
              manifest.entries.push({
                category,
                sourceName,
                savedPath: null,
                status: "failed",
                attempts: attempt,
                error: "Run stopped by user",
                promptType: categoryPromptType(category),
                promptVersion,
                generatedAt: new Date().toISOString(),
              });
              await saveManifest(manifest);
              console.log("Run stopped by user.");
              return;
            }

            if (retryAnswer === "skip") {
              manifest.entries = manifest.entries.filter(
                (item) => makeKey(item.category, item.sourceName) !== makeKey(category, sourceName),
              );
              manifest.entries.push({
                category,
                sourceName,
                savedPath: null,
                status: "skipped",
                attempts: attempt,
                error: lastError,
                promptType: categoryPromptType(category),
                promptVersion,
                generatedAt: new Date().toISOString(),
              });
              await saveManifest(manifest);
              success = true;
              break;
            }
          }
        }
      }

      if (!success) {
        manifest.entries = manifest.entries.filter(
          (item) => makeKey(item.category, item.sourceName) !== makeKey(category, sourceName),
        );
        manifest.entries.push({
          category,
          sourceName,
          savedPath: null,
          status: "failed",
          attempts: maxAttempts,
          error: lastError ?? "Unknown failure",
          promptType: categoryPromptType(category),
          promptVersion,
          generatedAt: new Date().toISOString(),
        });
        await saveManifest(manifest);
      }
    }

    console.log("");
    console.log("Run complete. Manifest written to:");
    console.log(path.relative(root, manifestPath));
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
