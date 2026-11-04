// DD2P (0.3.2; the owner, D-1104-12, 4 Nov: "a library of functions where a place calls them so if we need to fix
// something we fix it at the source"; D-1104-18; D-1104-15: equal copies, one copy, no answer changes; D-1016-01): one
// place for the picture bytes. The CRC-32, the big-endian four bytes, the PNG chunk and the read live in
// assets/js/png-bytes.js only; the MCP's small cache in mcp/lib/small-cache.mjs only (docs/CONTRACTS.md families crc,
// png-chunk, u32, lru).
//   U1-U32   the module on the contract probe's inputs, each answer pinned: 8 byte strings (0xCBF43926 for
//            '123456789'), 8 chunks, 8 reads (16908288 for 01 02 at 0), 8 cache step lists (32 checks)
//   H1-H15   every PNG the website and the MCP write (the theme background, the glass flipped and its preview, the twin's
//            page pictures), the theme generator's text chunks and three ZIPs of made-up reports: their SHA-256 as on the
//            base deff19e (measured before DD2P, mcp/work/DD2P.md), pinned. node:zlib's own bytes for a fixed input are compared first: on
//            a platform whose zlib writes other bytes the pictures it deflates are checked by P below only (15 checks)
// Made-up data only; the clock fixed and the random seeded in this process.   node test-0.3.2-dd2p.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (b) => crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
const notes = [];

// the fixed clock (a ZIP entry carries the time of the call) and the seeded random ids (the writer's), in this process
const RealDate = Date, FIXED = new RealDate(2026, 10, 4, 9, 30, 0).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(FIXED); } static now() { return FIXED; } };
await import(pathToFileURL(path.join(HERE, 'fixtures', 'sp1', 'seeded-random.mjs')).href);

const P = require('../assets/js/png-bytes.js');
const { lru } = await import('./lib/small-cache.mjs');

// ---------- the inputs (the contract probe's, scripts/contracts-probe.mjs: BYTES, CHUNKS, U32, LRUS) ----------
const BYTES = [
  { label: 'empty', b: [] }, { label: "'a'", b: [0x61] }, { label: "'123456789' (the check value)", b: [...'123456789'].map((c) => c.charCodeAt(0)) },
  { label: 'المبيعات in UTF-8', b: [...Buffer.from('المبيعات', 'utf8')] }, { label: 'one zero byte', b: [0] }, { label: 'four 0xFF bytes', b: [255, 255, 255, 255] },
  { label: '256 bytes 0..255', b: Array.from({ length: 256 }, (_, i) => i) }, { label: 'IHDR and a 1x1 header', b: [73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0] },
];
const CRCS = [0x00000000, 0xE8B7BE43, 0xCBF43926, 0x7E102E3C, 0xD202EF8D, 0xFFFFFFFF, 0x29058C73, 0x907753DE];
const CHUNKS = [
  { label: 'IEND, empty', t: 'IEND', b: [] }, { label: 'IHDR 1x1 RGB', t: 'IHDR', b: [0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0] },
  { label: 'tEXt Comment', t: 'tEXt', b: [...Buffer.from('Comment\0made up', 'latin1')] }, { label: 'IDAT one byte', t: 'IDAT', b: [0] },
  { label: 'a 300-byte body', t: 'IDAT', b: Array.from({ length: 300 }, (_, i) => i & 255) }, { label: 'a lower-case type', t: 'abcd', b: [1, 2, 3] },
  { label: 'a body of 0xFF', t: 'IDAT', b: [255, 255, 255] }, { label: 'a 256-byte body', t: 'IDAT', b: Array.from({ length: 256 }, () => 7) },
];
// each chunk: its length and the first 16 hex digits of its SHA-256 (the whole of it for the first: 12 bytes)
const CHUNK_SHAS = ['12:819e72ef0050676b', '25:6f0c0cbc6d6510d5', '27:cfbeca5f1e13c2c8', '13:2bcb40d741cc728d', '312:2bb55085cee7abc9', '15:50f7bc0def9c1237', '15:d52015c2583ce030', '268:2f3ee8f09853dcc2'];
const U32 = [
  { label: '00 00 00 01 at 0', b: [0, 0, 0, 1], i: 0 }, { label: 'FF FF FF FF at 0', b: [255, 255, 255, 255], i: 0 },
  { label: '80 00 00 00 at 0 (the top bit)', b: [128, 0, 0, 0], i: 0 }, { label: '12 34 56 78 at 0', b: [0x12, 0x34, 0x56, 0x78], i: 0 },
  { label: 'at offset 2', b: [9, 9, 0, 0, 1, 0], i: 2 }, { label: 'past the end', b: [1, 2], i: 0 },
  { label: 'a 1x1 IHDR width', b: [0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1], i: 8 }, { label: 'an empty buffer', b: [], i: 0 },
];
const READS = [1, 4294967295, 2147483648, 305419896, 256, 16908288, 1, 0];
const LRUS = [
  { label: 'set a, get a', max: 2, ops: [['set', 'a', 1], ['get', 'a']] },
  { label: 'get a missing key', max: 2, ops: [['get', 'x']] },
  { label: 'three sets in a cache of two', max: 2, ops: [['set', 'a', 1], ['set', 'b', 2], ['set', 'c', 3], ['get', 'a'], ['get', 'b'], ['get', 'c']] },
  { label: 'a get keeps a key', max: 2, ops: [['set', 'a', 1], ['set', 'b', 2], ['get', 'a'], ['set', 'c', 3], ['get', 'a'], ['get', 'b']] },
  { label: 'a set again replaces', max: 2, ops: [['set', 'a', 1], ['set', 'a', 5], ['get', 'a']] },
  { label: 'a cache of one', max: 1, ops: [['set', 'a', 1], ['set', 'b', 2], ['get', 'a'], ['get', 'b']] },
  { label: 'undefined as a value', max: 2, ops: [['set', 'a', undefined], ['get', 'a']] },
  { label: 'a set again keeps the other', max: 2, ops: [['set', 'a', 1], ['set', 'b', 2], ['set', 'a', 3], ['set', 'c', 4], ['get', 'a'], ['get', 'b']] },
];
const KEPT = ['1', 'undefined', 'undefined 2 3', '1 1 undefined', '5', 'undefined 2', 'undefined', '3 undefined'];
// the answers in one form for every place (old and new): a number, the chunk's hex, the gets' answers
const crcOf = (f, x) => f(Uint8Array.from(x.b)) >>> 0;
const chunkOf = (f, x) => { const c = f(x.t, Uint8Array.from(x.b)); return c.length + ':' + sha(c).slice(0, 16); };
const readOf = (f, x) => f(Uint8Array.from(x.b), x.i);
const lruOf = (make, x) => { const c = make(x.max), out = []; for (const [op, k, v] of x.ops) { if (op === 'set') c.set(k, v); else out.push(c.get(k)); } return out.map((v) => (v === undefined ? 'undefined' : v)).join(' '); };

// ---------- U: the module, each answer pinned ----------
BYTES.forEach((x, i) => chk(() => crcOf(P.crc32, x) === CRCS[i], () => `U${i + 1}. crc32(${x.label}) is 0x${CRCS[i].toString(16)}: ${crcOf(P.crc32, x).toString(16)}`));
CHUNKS.forEach((x, i) => chk(() => chunkOf(P.pngChunk, x) === CHUNK_SHAS[i], () => `U${i + 9}. pngChunk(${x.label}) is ${CHUNK_SHAS[i]}: ${chunkOf(P.pngChunk, x)}`));
U32.forEach((x, i) => chk(() => readOf(P.u32, x) === READS[i], () => `U${i + 17}. u32(${x.label}) is ${READS[i]}: ${readOf(P.u32, x)}`));
LRUS.forEach((x, i) => chk(() => lruOf(lru, x) === KEPT[i], () => `U${i + 25}. lru (${x.label}) answers "${KEPT[i]}": "${lruOf(lru, x)}"`));

// ---------- H: every picture and ZIP written, byte for byte the base's ----------
// node:zlib's own bytes for a fixed input (Linux and Windows x64, Node 22): the pictures it deflates are pinned only where
// it writes these
const ZLIB_PIN = '90c2aad4bfa0cd6d089568a4b186e7fd0d681f3d60351d8ac03fe1a4551212cc';
const zlibHere = sha(zlib.deflateSync(Uint8Array.from({ length: 65536 }, (_, i) => ((i * 7919) >> 3) & (i % 97 ? 255 : 15))));
const E = require('../assets/js/design-engine.js'), Pbip = require('../assets/js/pbip-export.js'), Zip = require('../assets/js/pbip-zip.js');
const G = await import('./lib/glass-picture.mjs'), PP = await import('./lib/page-picture.mjs');
const design = (preset) => { const d = E.fresh(); d.preset = preset; d.data = E.PRESETS[preset].data.slice(); d.ui = Object.assign({}, E.PRESETS[preset].ui); E.repairState(d); return d; };
const rgbOf = (w, h) => Uint8Array.from({ length: w * h * 3 }, (_, i) => (i * 37 + (i >> 5)) & 255);
const rgbaOf = (w, h, alpha) => Uint8Array.from({ length: w * h * 4 }, (_, i) => (i % 4 === 3 ? (alpha ? (i * 11) & 255 : 255) : (i * 53 + (i >> 4)) & 255));
// the theme generator's text chunks (a browser page script): its block from the comment to withCredits, run as it is
const textChunkFrom = (src, root) => { const s = src.replace(/\r\n/g, '\n'), a = s.indexOf('    // PNG text metadata'), z = s.indexOf('    const withCredits');
  if (a < 0 || z < a) throw new Error('theme-download-ui.js: the text chunk block was not found'); return new Function('root', 'window', s.slice(a, z) + '\nreturn textChunk;')(root, root); };
const credits = (textChunk) => Buffer.concat([textChunk('Software', 'DataArcus Power BI Theme & Layout Generator'), textChunk('Source', 'https://dataarcus.com/tools/power-bi-theme-generator.html')].map((x) => Buffer.from(x)));
const png = (i) => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, i]);
// a made-up report (the writer's sample model): the glass picture behind its first page
function outputs(m) {
  const glass = m.E.glassPng(design('DataArcus'), 1280, 720);
  const input = (lang, preset) => { const d = design(preset), pages = m.E.projectPages(d.layout, lang, { second: true });
    return { name: 'DD2P ' + lang, title: lang === 'ar' ? 'لوحة المبيعات 2026' : 'Sales 2026', pageName: pages[0].name, lang, rtl: lang === 'ar', font: d.font, sample: true, logo: null, theme: m.E.buildTheme(d, lang), ui: d.ui,
      texts: m.E.REPORT_TEXTS[lang], pages: pages.map((p, i) => ({ name: p.name, page: p.page, slots: p.slots, png: i ? png(i) : glass, panel: p.panel, kpiInset: p.kpiInset })) }; };
  return [
    ['theme background (glassPng 1280x720, the DataArcus preset)', true, () => glass],
    ['theme background (glassPng 1920x1080, Desert Gulf)', true, () => m.E.glassPng(design('Desert Gulf'), 1920, 1080)],
    ['encodePng 24x9 with a comment, the browser deflate', false, () => m.E.encodePng(24, 9, rgbOf(24, 9), 'made up', { deflate: 'js' })],
    ['encodePng 24x9, node:zlib', true, () => m.E.encodePng(24, 9, rgbOf(24, 9))],
    ['glass flipped (flipGlassPng)', true, () => m.G.flipGlassPng(glass)],
    ['glass preview (glassPreviewUrl)', true, () => Buffer.from(m.G.glassPreviewUrl(glass), 'utf8')],
    ['page picture opaque (writePng 17x5)', true, () => m.PP.writePng(17, 5, rgbaOf(17, 5, false))],
    ['page picture with alpha (writePng 17x5)', true, () => m.PP.writePng(17, 5, rgbaOf(17, 5, true))],
    ['page picture palette (testPng)', true, () => m.PP.testPng(6, 4, Uint8Array.from({ length: 96 }, (_, i) => (i % 4 === 3 ? 200 : ((i >> 3) * 40) & 255)), { palette: true })],
    ['page picture interlaced (testPng)', true, () => m.PP.testPng(9, 9, rgbaOf(9, 9, true), {})],
    ['page picture flipped (pagePicture, Normal)', true, () => m.PP.pagePicture(m.PP.writePng(17, 5, rgbaOf(17, 5, false)), 'Normal', 1280, 720).png],
    ['theme generator text chunks (textChunk x2)', false, () => credits(m.textChunk)],
    ['ZIP of a made-up report (pbip-export build, en)', true, () => m.Pbip.build(input('en', 'DataArcus')).zip()],
    ['ZIP of a made-up report (pbip-export build, ar)', true, () => m.Pbip.build(input('ar', 'Desert Gulf')).zip()],
    ['ZIP of three made-up entries (pbip-zip zip)', true, () => m.Zip.zip([{ path: 'a.txt', data: 'made up' }, { path: 'المبيعات/b.json', data: '{"x":1}' }, { path: 'c.png', data: glass }])],
  ];
}
// measured on the base deff19e (mcp/work/DD2P.md, "How the hashes were measured")
const BASE_SHAS = {
  'theme background (glassPng 1280x720, the DataArcus preset)': '9648460bb93684035181ca0c7febda485486c3c31a040f20f8410b4761d1c684',
  'theme background (glassPng 1920x1080, Desert Gulf)': '68dd99c823a45be4c54f17a479480680e482a3d906d7cfdf01768fd64c327b37',
  'encodePng 24x9 with a comment, the browser deflate': '4ffb815ac861ebd3705000da434be259c894160532061cc99a91e71b1a6df21a',
  'encodePng 24x9, node:zlib': 'eaa48acd7e492ff5160cde254d47ad690425e27c2796ef941ac47b76c7aa2153',
  'glass flipped (flipGlassPng)': '1008ffb464bf9149cf8d063bc2bb1caeddee7055fc34c7a92e31f030f097b06e',
  'glass preview (glassPreviewUrl)': 'daa679edb3a6220f2bdb5f8f9ef5597f3fa656fc1b5edb3ff7d34e53580016a8',
  'page picture opaque (writePng 17x5)': 'e6153d7c3b33408b282690f7bccddbb472f1b5b2957bc9dbd11ea91635018b70',
  'page picture with alpha (writePng 17x5)': '7bc52d7a198afb40e0a6764be508b609045df039d7987745d54613e916c22e8f',
  'page picture palette (testPng)': '540223cb624a1ff835a376336934483afe35ecd9d781f98db4a00b5b23ddf691',
  'page picture interlaced (testPng)': '8f2fe12287a189a5cb414437f161d5aafaedbf39cf75bb1c68f0ef29f0ff9f09',
  'page picture flipped (pagePicture, Normal)': '72311c4312473a493767b1a0ded12b117dd34244a283e136f9afb93a25423157',
  'theme generator text chunks (textChunk x2)': 'b657f58e0bc1408e6facd01aeb43114fff1c6c4d1a8a5655bd53b302b080c4d5',
  'ZIP of a made-up report (pbip-export build, en)': '522a03df9d598fb2afa863b6d5ef3a642e844802eaa4d6c97bb2dfc336c84bd8',
  'ZIP of a made-up report (pbip-export build, ar)': 'a27b9650da281fcfcd45e2d4103e269f7d6d9721aca83248743a24ec9d2ab4f2',
  'ZIP of three made-up entries (pbip-zip zip)': 'd38b248badeb359367d4d1e9b9199eb23b044835ef490436becc1cf67139f992',
};
const zlibSame = zlibHere === ZLIB_PIN;
if (!zlibSame) notes.push(`node:zlib here writes other bytes (${zlibHere.slice(0, 16)}): the pictures it deflates are checked against the base's own source (P) only`);
const now = outputs({ E, G, PP, Pbip, Zip, textChunk: textChunkFrom(fs.readFileSync(path.join(REPO, 'assets', 'js', 'theme-download-ui.js'), 'utf8'), { DAPngBytes: P }) });
const shasNow = {};
now.forEach(([label, usesZlib, make], i) => {
  let got = null; try { got = sha(make()); } catch (e) { got = 'throws ' + e.message; }
  shasNow[label] = got;
  chk(() => (usesZlib && !zlibSame) || got === BASE_SHAS[label], () => `H${i + 1}. ${label}: the base's bytes (${BASE_SHAS[label].slice(0, 16)}): ${String(got).slice(0, 80)}`);
});

if (process.env.DD2P_PRINT === '1') { console.log('zlib ' + zlibHere); Object.entries(shasNow).forEach(([k, v]) => console.log(k + ': ' + v)); }
notes.forEach((n) => console.log('  note: ' + n));
if (problems.length) { console.log(`FAIL script=test-0.3.2-dd2p.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2p  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2p  ${checks} checks`);
