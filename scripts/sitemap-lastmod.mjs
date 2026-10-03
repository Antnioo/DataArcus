// Sets every <lastmod> in sitemap.xml to the date of the page's last commit: the page's HTML and the translation
// scripts it loads (its text lives there too), whichever changed last. Google uses lastmod only when it is accurate.
//   node scripts/sitemap-lastmod.mjs           check; exit code 1 and the list when a date is out of step
//   node scripts/sitemap-lastmod.mjs --write   rewrite the stale dates
// Run after committing page changes (uncommitted edits don't count: the date is the commit's).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://dataarcus.com/';
const write = process.argv.includes('--write');
const lastCommit = (files) => {
  const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], { cwd: ROOT, encoding: 'utf8' }).trim();
  return out || null;
};
// the page file for a sitemap URL ("" -> index.html, "tools/" -> tools/index.html)
const pageFile = (loc) => { const p = loc.slice(SITE.length); return !p ? 'index.html' : p.endsWith('/') ? p + 'index.html' : p; };
// the page's own translation sources (translations/x.min.js -> translations/x.js); common.js (menu and footer on
// every page) is left out: a menu change is not a change to the page's content
const translations = (file) => {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dir = path.dirname(file);
  return [...html.matchAll(/src="([^"?]*translations\/[^"?]+?)(?:\.min)?\.js(?:\?[^"]*)?"/g)]
    .map((m) => path.normalize(path.join(dir, m[1] + '.js')))
    .filter((f) => !/translations[\\/]common\.js$/.test(f) && fs.existsSync(path.join(ROOT, f)));
};

const file = path.join(ROOT, 'sitemap.xml');
let xml = fs.readFileSync(file, 'utf8');
const stale = [];
xml = xml.replace(/(<loc>([^<]+)<\/loc>\s*<lastmod>)([^<]+)(<\/lastmod>)/g, (all, head, loc, old, tail) => {
  const page = pageFile(loc);
  if (!fs.existsSync(path.join(ROOT, page))) { stale.push(`${loc}: no file ${page}`); return all; }
  const date = lastCommit([page, ...translations(page)]);
  if (!date || date === old) return all;
  stale.push(`${loc}: ${old} -> ${date}`);
  return head + date + tail;
});
if (write) {
  if (stale.length) fs.writeFileSync(file, xml);
  console.log(stale.length ? `Updated ${stale.length} dates:\n  ${stale.join('\n  ')}` : 'All lastmod dates match the last commits.');
} else if (stale.length) {
  console.log(`${stale.length} lastmod dates out of step (node scripts/sitemap-lastmod.mjs --write):\n  ${stale.join('\n  ')}`);
  process.exit(1);
} else console.log('All lastmod dates match the last commits.');
