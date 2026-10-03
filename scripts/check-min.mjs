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
