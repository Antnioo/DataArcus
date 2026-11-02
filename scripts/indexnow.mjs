// IndexNow: tells Bing (and the other engines that share IndexNow) which pages changed, so they are crawled within hours
// instead of days. Bing's index also feeds Copilot and ChatGPT search. The key is public by design: the file
// <key>.txt at the site root proves the site owns the addresses it sends.
//   node scripts/indexnow.mjs <from-commit> <to-commit>   send the sitemap pages changed between two commits
//   node scripts/indexnow.mjs --all                       send every page in the sitemap (first run, or after a big change)
// Run by .github/workflows/indexnow.yml after a push to main, once GitHub Pages has published it.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'dataarcus.com', SITE = `https://${HOST}/`;

// the sitemap addresses of the changed files (a folder's index.html is the folder's address)
export function urlsFor(files, locs) {
  const inMap = new Set(locs);
  const urls = files.map((f) => SITE + f.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '$1')).filter((u) => inMap.has(u));
  return [...new Set(urls)];
}

export const payload = (urlList, key) => ({ host: HOST, key, keyLocation: `${SITE}${key}.txt`, urlList });

// the key file at the site root: <32 hex>.txt
export function keyFile(root = ROOT) {
  const found = fs.readdirSync(root).filter((f) => /^[a-f0-9]{32}\.txt$/.test(f));
  return found.length === 1 ? { key: found[0].slice(0, -4) } : null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const locs = [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const [from, to] = process.argv.slice(2);
  const urls = from === '--all' ? locs
    : urlsFor(execFileSync('git', ['diff', '--name-only', from, to || 'HEAD'], { cwd: ROOT }).toString().trim().split(/\r?\n/).filter(Boolean), locs);
  if (!urls.length) { console.log('No sitemap page changed: nothing to send.'); process.exit(0); }
  const k = keyFile();
  if (!k) { console.log('No IndexNow key file at the site root.'); process.exit(1); }
  const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(payload(urls, k.key)) });
  console.log(`IndexNow ${res.status} for ${urls.length} page(s):\n${urls.join('\n')}`);
  // 200 sent, 202 accepted (key still being checked); anything else is a real problem
  process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
}
