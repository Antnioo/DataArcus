// Every committed .min.js that has a source next to it must be what terser (pinned in package.json) makes from it.
//   node scripts/check-min.mjs           check; exit code 1 and the list when a file is stale; then the ?v= stamps
//   node scripts/check-min.mjs --write   rebuild the stale ones (npm run build:min, which then writes the stamps)
// The same as `npx terser file.js -c -m -o file.min.js`. Line endings are compared as LF (the laptop checks out CRLF).
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lf = (s) => s.replace(/\r\n/g, '\n');
// the one minifier (scripts/stamps.mjs rebuilds a loader's .min.js with it after writing the loader's stamps)
export const minOf = async (text) => (await minify(lf(text), { compress: true, mangle: true })).code;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const write = process.argv.includes('--write');
const files = execSync('git ls-files "*.min.js"', { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
let checked = 0;
const stale = [];
for (const min of files) {
  const src = path.join(ROOT, min.replace(/\.min\.js$/, '.js'));
  if (!fs.existsSync(src)) continue;
  const out = await minOf(fs.readFileSync(src, 'utf8'));
  const cur = lf(fs.readFileSync(path.join(ROOT, min), 'utf8'));
  checked++;
  if (out === cur || out + '\n' === cur) continue;
  stale.push(min);
  if (write) fs.writeFileSync(path.join(ROOT, min), out);
}
if (!stale.length) console.log(`All ${checked} .min.js files match their sources.`);
else if (write) console.log(`Rebuilt ${stale.length} of ${checked}:\n  ${stale.join('\n  ')}`);
else { console.error(`${stale.length} of ${checked} .min.js files differ from what terser makes of their source (run: npm run build:min):\n  ${stale.join('\n  ')}`); process.exit(1); }

// The ?v= stamps (ST1, 0.3.2; it retired round 22b's "a changed .min.js keeps main's stamp" block, whose job this
// does better): every reference holds its target's current content stamp, checked by scripts/stamps.mjs (one FAIL line
// per stale reference, the fix: npm run build:min). With --write the stamps are written by `npm run build:min`'s
// second step, `node scripts/stamps.mjs --write`, after this rebuild.
if (!write) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'stamps.mjs')], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(1);
}
}
