// Decides whether a weekly bot pull request may merge itself (BA1, 0.3.3, owner's D-1109-10).
// The one place that lists the files a bot may change alone: the price file and the two exam-outline files.
// Anything else (a page, a script, sitemap.xml, a look-alike path) waits for the owner.
//   git diff --name-only origin/main...HEAD | node scripts/bot-pr-files.mjs     prints "auto", or "owner <first path not allowed>"
//   gh pr diff <branch> --name-only | node scripts/bot-pr-files.mjs             (what the workflows do)
// Exact string match: no trimming, no case folding, no slash conversion.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ALLOWED = ['assets/data/powerbi-prices.json', 'assets/data/pl300-outline.json', 'assets/data/dp600-outline.json'];

export function classify(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return { verdict: 'owner', path: '' };
  const bad = paths.find((p) => typeof p !== 'string' || !ALLOWED.includes(p));
  return bad === undefined ? { verdict: 'auto' } : { verdict: 'owner', path: String(bad) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const lines = fs.readFileSync(0, 'utf8').split('\n').filter((l) => l !== '');
  const r = classify(lines);
  console.log(r.verdict === 'auto' ? 'auto' : `owner${r.path ? ' ' + r.path : ''}`);
}
