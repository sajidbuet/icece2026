import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const OUTPUT_FILE = path.join(REPO_ROOT, "sitemap.xml");
const SITE_ORIGIN = "https://icece.org.bd";

// folders to include in sitemap
const SITE_SECTIONS = ["2026", "2024"];

// exclude non-public or utility pages if needed
const EXCLUDED_FILES = new Set([
  "404.html",
]);

const EXCLUDED_DIRS = new Set([
  "assets",
]);

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      files = files.concat(walk(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function toPosixRelative(baseDir, filePath) {
  return path.relative(baseDir, filePath).split(path.sep).join("/");
}

function buildUrl(section, relativePath) {
  if (EXCLUDED_FILES.has(relativePath)) return null;

  if (relativePath === "index.html") {
    return `${SITE_ORIGIN}/${section}/`;
  }

  if (relativePath.endsWith("/index.html")) {
    const dirPart = relativePath.slice(0, -"/index.html".length);
    return `${SITE_ORIGIN}/${section}/${dirPart}/`;
  }

  return `${SITE_ORIGIN}/${section}/${relativePath}`;
}

function getLastMod(filePath) {
  const stat = fs.statSync(filePath);
  return stat.mtime.toISOString().split("T")[0];
}

let urls = [];

for (const section of SITE_SECTIONS) {
  const baseDir = path.join(REPO_ROOT, section);

  if (!fs.existsSync(baseDir) || !fs.statSync(baseDir).isDirectory()) {
    console.warn(`Skipping missing folder: ${baseDir}`);
    continue;
  }

  const htmlFiles = walk(baseDir);

  const sectionUrls = htmlFiles
    .map((filePath) => {
      const relativePath = toPosixRelative(baseDir, filePath);
      const loc = buildUrl(section, relativePath);
      if (!loc) return null;

      return {
        loc,
        lastmod: getLastMod(filePath),
      };
    })
    .filter(Boolean);

  urls.push(...sectionUrls);
}

urls = urls.sort((a, b) => a.loc.localeCompare(b.loc));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;

fs.writeFileSync(OUTPUT_FILE, xml, "utf8");
console.log(`Generated ${OUTPUT_FILE} with ${urls.length} URLs.`);