// 0.3.2 DD2D (mcp/work/DD2D.md): one place for reading a model file's bytes. assets/js/model-file.js holds decodeText
// (a Power BI file's bytes -> its text: UTF-16LE or UTF-8, a byte order mark or none) and LIMITS (the sizes over which
// a model file is refused). Made-up bytes only, never a real model. Each answer is pinned as the base (59877ed) gave it.
//   U1-U13  decodeText on the contracts probe's 10 byte strings and 3 more (a UTF-16BE mark, Arabic UTF-16LE with its
//           mark, half a UTF-8 mark); a Buffer gives the same text as a Uint8Array
//   L1-L8   LIMITS on the probe's 8 kinds; F1 LIMITS and the module are frozen, the five kinds exactly
//   P1-P13  parity: every place that answered before (the health worker run in a vm as it ships, its importScripts
//           read; the website's import in Node and as shipped, .min.js; the MCP's model.mjs decode) and the module
//           itself, as source and .min.js: one answer per byte string, the pinned one
//   Q1-Q8   parity of the limits: the worker's, the import's and PBIT_LIMITS on the 8 kinds, the pinned one
//   S1-S5   one place: the callers hold no decoder or limit of their own and read the module, loaded first
//   node test-0.3.2-dd2d.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { decode, PBIT_LIMITS } from './lib/model.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const JS = path.join(HERE, '..', 'assets', 'js');
const require = createRequire(import.meta.url);
const ModelFile = require('../assets/js/model-file.js');
const Import = require('../assets/js/model-import-browser.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

const B = (s, enc) => [...Buffer.from(s, enc)];
const JSON1 = '{"a":1}', AR = 'مبيعات', R = '\uFFFD';
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

// ---------- parity: every place, one answer ----------
const src = (f) => fs.readFileSync(path.join(JS, f), 'utf8');
// a browser or worker global scope in a vm: self is the scope, importScripts reads the named files (their stamps off)
const scope = (min) => {
  const ctx = { console, TextDecoder, TextEncoder, Blob, Response, setTimeout, clearTimeout };
  ctx.self = ctx; vm.createContext(ctx);
  ctx.importScripts = (...names) => names.forEach((n) => { const f = n.replace(/\?.*$/, ''); vm.runInContext(src(min ? f : f.replace(/\.min\.js$/, '.js')), ctx, { filename: f }); });
  return ctx;
};
// the worker as it ships (the .min.js and the .min.js files it imports) and as its source; its top-level names read
const worker = (min) => { const ctx = scope(min); vm.runInContext(src(min ? 'model-health-worker.min.js' : 'model-health-worker.js'), ctx, { filename: 'worker' }); return ctx; };
const W = worker(false), Wmin = worker(true);
// the website's import as the page loads it: model-file.min.js, then model-import-browser.min.js (theme-generator.js's order)
const Page = scope(true); Page.importScripts('model-file.min.js', 'model-nearest.min.js', 'model-import-browser.min.js');
const FileMin = scope(true); FileMin.importScripts('model-file.min.js');
const places = {
  'the worker (source)': (u8) => vm.runInContext('decodeText', W)(u8),
  'the worker (.min.js)': (u8) => vm.runInContext('decodeText', Wmin)(u8),
  'the import (Node)': (u8) => Import.decodeText(u8),
  'the import (.min.js)': (u8) => Page.DAModelImport.decodeText(u8),
  'model.mjs decode': (u8) => decode(Buffer.from(u8)),
  'model-file.js': (u8) => ModelFile.decodeText(u8),
  'model-file.min.js': (u8) => FileMin.DAModelFile.decodeText(u8),
};
BYTES.forEach(([id, label, bytes, want], i) => {
  const got = Object.entries(places).map(([n, f]) => { try { return [n, f(Uint8Array.from(bytes))]; } catch (e) { return [n, 'throws ' + e.message]; } });
  chk(() => got.every(([, g]) => g === want), () => `P${i + 1} (${id}) ${label}: not one answer: ${got.filter(([, g]) => g !== want).map(([n, g]) => n + ' ' + show(g)).join('; ')} (the base ${show(want)})`);
});
const limits = { 'the worker (source)': vm.runInContext('LIMITS', W), 'the worker (.min.js)': vm.runInContext('LIMITS', Wmin), 'the import (Node)': Import.LIMITS, 'the import (.min.js)': Page.DAModelImport.LIMITS, 'model.mjs PBIT_LIMITS': PBIT_LIMITS };
KINDS.forEach(([k, want], i) => {
  const off = Object.entries(limits).filter(([, L]) => L[k] !== want);
  chk(() => !off.length, () => `Q${i + 1} ${show(k)}: ${off.map(([n, L]) => n + ' ' + L[k]).join('; ')} (the base ${want})`);
});

// ---------- one place ----------
const mcpModel = fs.readFileSync(path.join(HERE, 'lib', 'model.mjs'), 'utf8');
const own = /'utf-16le'|0xef|\b64 \* MB\b|\b300 \* MB\b|\b20000\b/;
chk(() => [src('model-health-worker.js'), src('model-import-browser.js'), mcpModel].every((s) => !own.test(s)),
  () => 'S1 a caller holds its own decoder or limits again (a utf-16le decoder, a BOM byte or a limit number in model-health-worker.js, model-import-browser.js or mcp/lib/model.mjs): read assets/js/model-file.js');
chk(() => PBIT_LIMITS === ModelFile.LIMITS && Import.LIMITS === ModelFile.LIMITS && Import.decodeText === ModelFile.decodeText && /require\('\.\.\/\.\.\/assets\/js\/model-file\.js'\)/.test(mcpModel) && /ModelFile\.decodeText\(/.test(mcpModel),
  () => 'S2 model.mjs PBIT_LIMITS, the import\'s LIMITS and decodeText must be model-file.js\'s own (the same object), model.mjs decode must call it');
{ const imp = (s) => ((s.match(/importScripts\(([^)]*)\)/) || [])[1] || '').split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, '').replace(/\?.*$/, ''));
  chk(() => imp(src('model-health-worker.js'))[0] === 'model-file.min.js' && imp(src('model-health-worker.min.js'))[0] === 'model-file.min.js' && /self\.DAModelFile\.decodeText/.test(src('model-health-worker.js')) && /self\.DAModelFile\.LIMITS/.test(src('model-health-worker.js')),
    () => `S3 the health worker must import model-file.min.js first and read decodeText and LIMITS from self.DAModelFile: ${imp(src('model-health-worker.js'))}`); }
{ const g = src('theme-generator.js'), a = g.indexOf('/assets/js/model-file.min.js?v='), b = g.indexOf('/assets/js/model-import-browser.min.js?v=');
  chk(() => a > g.indexOf('const loadBind') && a < b && g.split('/assets/js/model-file.min.js?v=').length === 2,
    () => 'S4 theme-generator.js must load model-file.min.js once, before model-import-browser.min.js'); }
chk(() => /require\('\.\/model-file\.js'\)/.test(src('model-import-browser.js')) && /root\.DAModelFile/.test(src('model-import-browser.js')) && fs.existsSync(path.join(JS, 'model-file.min.js')),
  () => 'S5 model-import-browser.js must read model-file.js (require in Node, DAModelFile in the browser); model-file.min.js must be there');

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2d  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2d  ${checks} checks`);
