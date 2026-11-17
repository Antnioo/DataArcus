// Decides whether a weekly bot pull request may merge itself (BA1 0.3.3, BA2 0.3.3; the owner's D-1109-10, then D-1116-06).
// The one place that lists the files each bot may change alone, per bot:
//   outlines: the two exam-outline files
//   prices:   the price file, plus exactly the 7 files its own workflow regenerates from it (the calculator page and its
//             Arabic copy, the loader, its translations, the two .min.js, and sitemap.xml for its lastmod lines)
// Anything else (another bot's file, a script, a look-alike path) waits for the owner. No wildcard.
// A price PR that touches a generated file is "auto" only when the content guard agrees: those files are what the
// generator writes from the new price file, byte for byte (sitemap.xml: only <lastmod> lines may differ).
//   gh pr diff <branch> --name-only | node scripts/bot-pr-files.mjs prices     prints "auto", or "owner <first path not allowed>"
//   ... | node scripts/bot-pr-files.mjs prices [--base origin/main --head HEAD]   (the price guard is always on; these are its defaults)
//   ... | node scripts/bot-pr-files.mjs outlines                               (no generated files, no guard)
// Exact string match: no trimming, no case folding, no slash conversion.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { syncChecked } from './update-powerbi-prices.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const PRICE_FILE = 'assets/data/powerbi-prices.json';
export const SITEMAP = 'sitemap.xml';
// regenerated from the price file, compared byte for byte (the order is the workflow's `git add` order)
export const GENERATED = [
  'tools/power-bi-licensing-cost-calculator.html',
  'ar/tools/power-bi-licensing-cost-calculator.html',
  'assets/js/licensing-calculator.js',
  'assets/js/licensing-calculator.min.js',
  'assets/js/translations/licensing-calculator.js',
  'assets/js/translations/licensing-calculator.min.js',
];
export const ALLOWED = {
  prices: [PRICE_FILE, ...GENERATED, SITEMAP],
  outlines: ['assets/data/pl300-outline.json', 'assets/data/dp600-outline.json'],
};

export function classify(paths, bot) {
  const list = Object.prototype.hasOwnProperty.call(ALLOWED, bot) ? ALLOWED[bot] : null;
  if (!list || !Array.isArray(paths) || paths.length === 0) return { verdict: 'owner', path: '' };
  const bad = paths.find((p) => typeof p !== 'string' || !list.includes(p));
  return bad === undefined ? { verdict: 'auto' } : { verdict: 'owner', path: String(bad) };
}

const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
const show = (root, ref, file) => { try { return git(root, ['show', `${ref}:${file}`]); } catch { return null; } };
const lf = (s) => s.replace(/\r\n/g, '\n');

// What the price workflow writes from a price file: the date into the four places (syncChecked), then npm run build:min
// (the .min.js files and the ?v= stamps). Writes into `root`, a tree that already holds the new price file.
export function generate(root, iso) {
  syncChecked(root, iso);
  for (const step of ['check-min.mjs', 'stamps.mjs']) {
    const r = spawnSync(process.execPath, [path.join(root, 'scripts', step), '--write'], { cwd: root, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`${step} --write failed: ${(r.stderr || r.stdout).trim().split('\n').pop()}`);
  }
}

// sitemap.xml may differ from the base only in <lastmod> dates
const LASTMOD = /<lastmod>([^<]*)<\/lastmod>/g;
export function sitemapOnlyLastmod(base, head) {
  if (typeof base !== 'string' || typeof head !== 'string') return false;
  const dates = [...head.matchAll(LASTMOD)].map((m) => m[1]);
  if (!dates.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))) return false;
  return lf(base).replace(LASTMOD, '<lastmod></lastmod>') === lf(head).replace(LASTMOD, '<lastmod></lastmod>');
}

// The content guard. `root` is a git checkout holding both refs (and node_modules for terser). Returns { ok: true } or
// { ok: false, path } for the first generated file that is not what the generator writes from the head's price file.
// A pull request that touches none of the generated files and not the sitemap needs no regeneration.
export function guardPrices({ root = ROOT, base = 'origin/main', head = 'HEAD', paths }) {
  const touched = (f) => paths.includes(f);
  const gen = GENERATED.filter(touched);
  if (!gen.length && !touched(SITEMAP)) return { ok: true };
  if (touched(SITEMAP) && !sitemapOnlyLastmod(show(root, base, SITEMAP), show(root, head, SITEMAP))) return { ok: false, path: SITEMAP };
  if (!gen.length) return { ok: true };
  let iso;
  try { iso = JSON.parse(show(root, head, PRICE_FILE)).checked; } catch { return { ok: false, path: PRICE_FILE }; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bot-guard-'));
  const wt = path.join(tmp, 'tree');
  try {
    git(root, ['worktree', 'add', '--detach', wt, base]);
    fs.writeFileSync(path.join(wt, PRICE_FILE), show(root, head, PRICE_FILE));
    const nm = path.join(root, 'node_modules');
    if (fs.existsSync(nm) && !fs.existsSync(path.join(wt, 'node_modules'))) fs.symlinkSync(nm, path.join(wt, 'node_modules'), 'junction');
    generate(wt, iso);
    // every generated file in the PR (touched or not: an untouched one must equal the base's, which the regenerated one then is too)
    for (const f of GENERATED) {
      const want = fs.readFileSync(path.join(wt, f), 'utf8');
      const got = touched(f) ? show(root, head, f) : show(root, base, f);
      if (got === null || lf(got) !== lf(want)) return { ok: false, path: f };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, path: gen[0], error: e.message };   // a failed regeneration never answers "auto"
  } finally {
    try { git(root, ['worktree', 'remove', '--force', wt]); } catch { /* the temp folder goes next */ }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

export function decide(paths, bot, opts = {}) {
  const r = classify(paths, bot);
  if (r.verdict !== 'auto' || bot !== 'prices' || !opts.guard) return r;
  const g = guardPrices({ ...opts.guard, paths });
  return g.ok ? r : { verdict: 'owner', path: g.path };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const bot = args[0];
  if (!Object.prototype.hasOwnProperty.call(ALLOWED, bot)) {
    console.error('usage: node scripts/bot-pr-files.mjs <prices|outlines> [--base <ref> --head <ref>] < paths');
    process.exit(2);
  }
  const opt = (n) => { const i = args.indexOf(n); return i > 0 ? args[i + 1] : undefined; };
  const lines = fs.readFileSync(0, 'utf8').split('\n').filter((l) => l !== '');
  const guard = bot === 'prices' ? { base: opt('--base') || 'origin/main', head: opt('--head') || 'HEAD' } : undefined;   // the price bot's guard is always on
  const r = decide(lines, bot, { guard });
  console.log(r.verdict === 'auto' ? 'auto' : `owner${r.path ? ' ' + r.path : ''}`);
}
