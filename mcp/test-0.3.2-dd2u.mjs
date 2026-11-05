// DD2U (0.3.2; the owner, D-1104-12, D-1104-18): the last big-endian read reads png-bytes.js. design-metrics.js
// imageSize had its own 4-byte read; it now takes u32 from png-bytes.js (docs/CONTRACTS.md family u32).
//   I1-I8  imageSize on made-up headers, each answer pinned (measured on the base a02f6f00 before the change): a PNG
//          640 x 360, the largest width, a zero width, a header one byte short, a width past 2^31, a 5-byte buffer, null,
//          a made-up JPG (100 x 50)
//   S1-S4  design-metrics.js has no 4-byte read of its own (no `<< 24`), requires png-bytes.js (Node) and reads
//          root.DAPngBytes (browser); the three theme generator pages load png-bytes before design-metrics
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

const Mx = require('../assets/js/design-metrics.js');
const png = (w, h, n = 24) => { const b = new Uint8Array(n); b.set([0x89, 0x50, 0x4e, 0x47]); if (n >= 24) { const dv = new DataView(b.buffer); dv.setUint32(16, w); dv.setUint32(20, h); } return b; };
const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xc0, 0, 17, 8, 0, 50, 0, 100, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const CASES = [
  ['a PNG 640 x 360', png(640, 360), { w: 640, h: 360 }],
  ['the largest width', png(4294967295, 1), { w: 4294967295, h: 1 }],
  ['a zero width', png(0, 5), null],
  ['a header one byte short', png(24, 9, 23), null],
  ['a width past 2^31', png(2147483648, 2147483649), { w: 2147483648, h: 2147483649 }],
  ['a 5-byte buffer', new Uint8Array(5), null],
  ['null', null, null],
  ['a made-up JPG', jpg, { w: 100, h: 50 }],
];
CASES.forEach(([label, b, want], i) => chk(() => JSON.stringify(Mx.imageSize(b)) === JSON.stringify(want), () => `I${i + 1}. imageSize(${label}) is ${JSON.stringify(want)}: ${JSON.stringify(Mx.imageSize(b))}`));

const text = (f) => fs.readFileSync(path.join(REPO, ...f.split('/')), 'utf8').replace(/\r\n/g, '\n');
const code = text('assets/js/design-metrics.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
chk(() => !/<<\s*24/.test(code), () => 'S1. design-metrics.js has a 4-byte read of its own (<< 24)');
chk(() => /require\('\.\/png-bytes\.js'\)/.test(code), () => "S2. design-metrics.js does not require('./png-bytes.js')");
chk(() => /root\.DAPngBytes/.test(code), () => 'S3. design-metrics.js does not read root.DAPngBytes in the browser');
['tools/power-bi-theme-generator.html', 'tools/power-bi-theme-generator-lab.html', 'ar/tools/power-bi-theme-generator.html'].forEach((f, i) => {
  const t = text(f), a = t.indexOf('png-bytes.min.js'), b = t.indexOf('design-metrics.min.js');
  chk(() => a > 0 && b > 0 && a < b, () => `S${i + 4}. ${f} loads png-bytes.min.js before design-metrics.min.js`);
});

if (problems.length) { console.log(`FAIL script=test-0.3.2-dd2u.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2u  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2u  ${checks} checks`);
