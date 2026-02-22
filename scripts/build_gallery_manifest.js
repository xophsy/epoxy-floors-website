// Usage: node scripts/build_gallery_manifest.js
// Scans images/gallery and writes gallery.json

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const galleryDir = path.join(root, 'images', 'gallery');
const outPath = path.join(root, 'gallery.json');

const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function isImage(file) {
  return exts.has(path.extname(file).toLowerCase());
}

function titleFromFilename(file) {
  const base = path.basename(file, path.extname(file));
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

if (!fs.existsSync(galleryDir)) {
  console.error('Missing directory:', galleryDir);
  process.exit(1);
}

const files = fs.readdirSync(galleryDir)
  .filter(isImage)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const items = files.map(f => ({
  src: `images/gallery/${f}`,
  alt: titleFromFilename(f) || 'Project photo'
}));

const payload = { items };
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');

console.log(`Wrote ${items.length} item(s) to ${outPath}`);
