// Every committed .min.js that has a source next to it must be what terser (pinned in package.json) makes from it.
//   node scripts/check-min.mjs           check; exit code 1 and the list when a file is stale
//   node scripts/check-min.mjs --write   rebuild the stale ones
// The same as `npx terser file.js -c -m -o file.min.js`. Line endings are compared as LF (the laptop checks out CRLF).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');
const lf = (s) => s.replace(/\r\n/g, '\n');
const files = execSync('git ls-files "*.min.js"', { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
let checked = 0;
const stale = [];
for (const min of files) {
  const src = path.join(ROOT, min.replace(/\.min\.js$/, '.js'));
  if (!fs.existsSync(src)) continue;
  const out = (await minify(lf(fs.readFileSync(src, 'utf8')), { compress: true, mangle: true })).code;
  const cur = lf(fs.readFileSync(path.join(ROOT, min), 'utf8'));
  checked++;
  if (out === cur || out + '\n' === cur) continue;
  stale.push(min);
  if (write) fs.writeFileSync(path.join(ROOT, min), out);
}
if (!stale.length) console.log(`All ${checked} .min.js files match their sources.`);
else if (write) console.log(`Rebuilt ${stale.length} of ${checked}:\n  ${stale.join('\n  ')}`);
else { console.error(`${stale.length} of ${checked} .min.js files differ from what terser makes of their source (run: npm run build:min):\n  ${stale.join('\n  ')}`); process.exit(1); }

// Round 22b (the review of round 22, item 7: pbip-bind.min.js changed but its ?v= stamp did not, so a browser keeps the
// old file): every .min.js that differs from main's must be loaded with a ?v= stamp main does not use for it. Compared
// with origin/main (CI checks out the whole history); without it, or on main itself, there is nothing to compare.
// (--write rebuilds and only warns: the stamps are bumped by hand on the pages)
{
  const git = (args) => { try { return execSync('git ' + args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return null; } };
  const base = git('rev-parse --verify --quiet origin/main') && git('merge-base HEAD origin/main');
  if (!base) console.log('?v= stamps: origin/main not found, not compared.');
  else {
    const stampsIn = (text) => { const out = {}; for (const m of text.matchAll(/([\w.-]+\.min\.js)\?v=([\w.-]+)/g)) (out[m[1]] = out[m[1]] || new Set()).add(m[2]); return out; };
    const pages = execSync('git ls-files "*.html" "*.js"', { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter((f) => f && !/\.min\.js$/.test(f));
    const now = {}, before = {};
    for (const f of pages) { const add = (to, t) => Object.entries(stampsIn(t)).forEach(([k, s]) => s.forEach((v) => (to[k] = to[k] || new Set()).add(v)));
      add(now, fs.readFileSync(path.join(ROOT, f), 'utf8')); const old = git(`show ${base.trim()}:"${f}"`); if (old) add(before, old); }
    const unbumped = files.filter((min) => { const name = path.basename(min), old = git(`show ${base.trim()}:"${min}"`);
      return old != null && lf(old) !== lf(fs.readFileSync(path.join(ROOT, min), 'utf8')) && now[name] && [...now[name]].some((v) => before[name] && before[name].has(v)); });
    if (unbumped.length) { console.error(`${unbumped.length} changed .min.js file${unbumped.length === 1 ? ' is' : 's are'} still loaded with main's ?v= stamp (bump it on every page that loads it):\n  ${unbumped.map((m) => `${m} (${[...now[path.basename(m)]].join(', ')})`).join('\n  ')}`); if (!write) process.exit(1); }
    else console.log('?v= stamps: every .min.js changed since main has a new stamp.');
  }
}
