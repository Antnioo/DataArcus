// 0.3.2 DD2D (mcp/work/DD2D.md): one place for reading a model file's bytes. assets/js/model-file.js holds decodeText
// (a Power BI file's bytes -> its text: UTF-16LE or UTF-8, a byte order mark or none) and LIMITS (the sizes over which
// a model file is refused). Made-up bytes only, never a real model. Each answer is pinned as the base (59877ed) gave it.
//   U1-U13  decodeText on the contracts probe's 10 byte strings and 3 more (a UTF-16BE mark, Arabic UTF-16LE with its
//           mark, half a UTF-8 mark); a Buffer gives the same text as a Uint8Array
//   L1-L8   LIMITS on the probe's 8 kinds; F1 LIMITS and the module are frozen, the five kinds exactly
//   node test-0.3.2-dd2d.mjs
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ModelFile = require('../assets/js/model-file.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

const B = (s, enc) => [...Buffer.from(s, enc)];
const JSON1 = '{"a":1}', AR = 'مبيعات', R = '�';
const be = (s) => [...Buffer.from(s, 'utf16le').swap16()];
// [id, label, bytes, the text the base gave]
export const BYTES = [
  ['U1', 'UTF-8, no BOM', B(JSON1, 'utf8'), JSON1],
  ['U2', 'UTF-8 with BOM', [0xef, 0xbb, 0xbf, ...B(JSON1, 'utf8')], JSON1],
  ['U3', 'UTF-16LE with BOM', [0xff, 0xfe, ...B(JSON1, 'utf16le')], JSON1],
  ['U4', 'UTF-16LE, no BOM', B(JSON1, 'utf16le'), JSON1],
  ['U5', 'Arabic UTF-8', B(AR, 'utf8'), AR],
  ['U6', 'empty', [], ''],
  ['U7', 'one byte (a)', [0x61], 'a'],
  ['U8', 'one byte 0xFF', [0xff], R],
  ['U9', 'the BOM 0xFF 0xFE alone', [0xff, 0xfe], ''],
  ['U10', 'a, then a zero byte', [0x61, 0x00], 'a'],
  // not in the probe: a UTF-16BE mark is no mark Power BI writes, so it is read as UTF-8 (the red proof's input)
  ['U11', 'UTF-16BE with BOM', [0xfe, 0xff, ...be(JSON1)], R + R + '\u0000{\u0000"\u0000a\u0000"\u0000:\u00001\u0000}'],
  ['U12', 'Arabic UTF-16LE with BOM', [0xff, 0xfe, ...B(AR, 'utf16le')], AR],
  ['U13', 'half a UTF-8 BOM (EF BB)', [0xef, 0xbb], R],
];
const MB = 1024 * 1024;
// [kind, the limit the base gave]
export const KINDS = [['model', 64 * MB], ['entry', 32 * MB], ['total', 128 * MB], ['file', 300 * MB], ['entries', 20000], ['pbix', undefined], ['', undefined], ['MODEL', undefined]];
const show = (s) => JSON.stringify(s);

for (const [id, label, bytes, want] of BYTES) {
  const u8 = Uint8Array.from(bytes), got = ModelFile.decodeText(u8), fromBuf = ModelFile.decodeText(Buffer.from(bytes));
  chk(() => got === want && fromBuf === want, () => `${id} ${label}: decodeText gave ${show(got)} (a Buffer ${show(fromBuf)}), the base ${show(want)}`);
}
KINDS.forEach(([k, want], i) => chk(() => ModelFile.LIMITS[k] === want, () => `L${i + 1} LIMITS[${show(k)}] is ${ModelFile.LIMITS[k]}, the base ${want}`));
chk(() => Object.isFrozen(ModelFile.LIMITS) && Object.isFrozen(ModelFile) && Object.keys(ModelFile.LIMITS).join() === 'model,entry,total,file,entries' && Object.keys(ModelFile).join() === 'decodeText,LIMITS',
  () => `F1 LIMITS and the module must be frozen, LIMITS the five kinds: ${Object.keys(ModelFile.LIMITS)}; ${Object.keys(ModelFile)}`);

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2d  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2d  ${checks} checks`);
