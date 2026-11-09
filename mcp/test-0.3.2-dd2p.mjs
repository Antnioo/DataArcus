// DD2P (0.3.2; the owner, D-1104-12, 4 Nov: "a library of functions where a place calls them so if we need to fix
// something we fix it at the source"; D-1104-18; D-1104-15: equal copies, one copy, no answer changes; D-1016-01): one
// place for the picture bytes. The CRC-32, the big-endian four bytes, the PNG chunk and the read live in
// assets/js/png-bytes.js only; the MCP's small cache in mcp/lib/small-cache.mjs only (docs/CONTRACTS.md families crc,
// png-chunk, u32, lru).
//   U1-U32   the module on the contract probe's inputs, each answer pinned: 8 byte strings (0xCBF43926 for
//            '123456789'), 8 chunks, 8 reads (16908288 for 01 02 at 0), 8 cache step lists (32 checks)
//   H1-H15   every PNG the website and the MCP write (the theme background, the glass flipped and its preview, the twin's
//            page pictures), the theme generator's text chunks and three ZIPs of made-up reports: their SHA-256 as on the
//            base deff19e (measured before DD2P, mcp/work/DD2P.md), pinned. node:zlib's own bytes for a fixed input are
//            compared first: on a platform whose zlib writes other bytes the pictures it deflates are checked by B only
//            (15 checks)
//   P1-P40   the parity: every old place, run from the base's source (saved in mcp/fixtures/hk1/dd2p, deff19e's bytes: each definition and the names it
//            needs, read from the file as scripts/contracts-probe.mjs reads a nested name), and the one place on every
//            input: one answer each. crc: design-engine, pbip-zip, glass-picture, page-picture, theme-download-ui and
//            png-bytes crc32 (8 byte strings); png-chunk: design-engine chunk (in pngOf), glass-picture chunk (in
//            encode), page-picture chunk and pngChunk (8 chunks); u32: glass-picture, page-picture and png-bytes (8
//            reads); lru: glass-picture, page-picture and small-cache (8 step lists); theme-download-ui textChunk, the
//            old and the new (8 keys and texts) (40 checks)
//   P41      pbip-zip.js exports png-bytes.js crc32 itself (its callers change nothing) (1 check)
//   B1-B15   the 15 outputs of H written by the base's own engines (every assets/js file and glass-picture.mjs,
//            page-picture.mjs at deff19e, in a temporary folder, in a child process with the same clock and seed): the
//            same bytes as now, on any platform (15 checks)
//   S1-S9    one job, one place: the CRC table is in png-bytes.js only and the cache in small-cache.mjs only (in
//            assets/js and mcp/lib); each of the five callers loads png-bytes.js, the two MCP ones small-cache.mjs
//            (9 checks)
// Made-up data only; the clock fixed and the random seeded in this process.   node test-0.3.2-dd2p.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

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
// the engines of a tree (this repository, or the base's files in a temporary folder)
async function enginesOf(tree, root) {
  const req = createRequire(path.join(tree, 'mcp', 'x.mjs')), at = (f) => pathToFileURL(path.join(tree, ...f.split('/'))).href;
  return { E: req('../assets/js/design-engine.js'), Pbip: req('../assets/js/pbip-export.js'), Zip: req('../assets/js/pbip-zip.js'),
    G: await import(at('mcp/lib/glass-picture.mjs')), PP: await import(at('mcp/lib/page-picture.mjs')),
    textChunk: textChunkFrom(fs.readFileSync(path.join(tree, 'assets', 'js', 'theme-download-ui.js'), 'utf8'), root) };
}
const designOf = (E, preset) => { const d = E.fresh(); d.preset = preset; d.data = E.PRESETS[preset].data.slice(); d.ui = Object.assign({}, E.PRESETS[preset].ui); E.repairState(d); return d; };
const rgbOf = (w, h) => Uint8Array.from({ length: w * h * 3 }, (_, i) => (i * 37 + (i >> 5)) & 255);
const rgbaOf = (w, h, alpha) => Uint8Array.from({ length: w * h * 4 }, (_, i) => (i % 4 === 3 ? (alpha ? (i * 11) & 255 : 255) : (i * 53 + (i >> 4)) & 255));
// the theme generator's text chunks (a browser page script): its block from the comment to withCredits, run as it is
const textChunkFrom = (src, root) => { const s = src.replace(/\r\n/g, '\n'), a = s.indexOf('    // PNG text metadata'), z = s.indexOf('    const withCredits');
  if (a < 0 || z < a) throw new Error('theme-download-ui.js: the text chunk block was not found'); return new Function('root', 'window', s.slice(a, z) + '\nreturn textChunk;')(root, root); };
const credits = (textChunk) => Buffer.concat([textChunk('Software', 'DataArcus Power BI Theme & Layout Generator'), textChunk('Source', 'https://dataarcus.com/tools/power-bi-theme-generator.html')].map((x) => Buffer.from(x)));
const png = (i) => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, i]);
// a made-up report (the writer's sample model): the glass picture behind its first page
function outputs(m) {
  const design = (preset) => designOf(m.E, preset);
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
const shasOf = (m) => Object.fromEntries(outputs(m).map(([label, , make]) => { let got; try { got = sha(make()); } catch (e) { got = 'throws ' + e.message; } return [label, got]; }));
// a child process (B below): the base's engines in the tree it is given, the SHA-256 of each output as one JSON line
if (process.env.DD2P_TREE) { console.log(JSON.stringify(shasOf(await enginesOf(process.env.DD2P_TREE, {})))); process.exit(0); }
const zlibSame = zlibHere === ZLIB_PIN;
if (!zlibSame) notes.push(`node:zlib here writes other bytes (${zlibHere.slice(0, 16)}): the pictures it deflates are checked against the base's own engines (B) only`);
const engines = await enginesOf(REPO, { DAPngBytes: P }), now = outputs(engines);
const shasNow = {};
now.forEach(([label, usesZlib, make], i) => {
  let got = null; try { got = sha(make()); } catch (e) { got = 'throws ' + e.message; }
  shasNow[label] = got;
  chk(() => (usesZlib && !zlibSame) || got === BASE_SHAS[label], () => `H${i + 1}. ${label}: the base's bytes (${BASE_SHAS[label].slice(0, 16)}): ${String(got).slice(0, 80)}`);
});

// ---------- P: every old place (the base's source) and the one place, one answer per input ----------
// (HK1, 0.3.3) the base's files are saved copies (mcp/fixtures/hk1/dd2p, the commit deff19e's bytes), not git reads
const BASE_FIX = path.join(HERE, 'fixtures', 'hk1', 'dd2p');
const baseSrc = new Map();
const baseOf = (f) => { if (!baseSrc.has(f)) baseSrc.set(f, fs.readFileSync(path.join(BASE_FIX, ...f.split('/')), 'utf8').replace(/\r\n/g, '\n')); return baseSrc.get(f); };
// one definition `const name = ...;` read from a source: from its name to the ';' where its brackets close (the one
// inside `within` when given); the old copies are one-line helpers with no brackets inside strings but balanced ones
function definition(src, name, within) {
  let from = 0;
  if (within) { from = src.search(new RegExp(`(?:const|function)\\s+${within}\\b`)); if (from < 0) throw new Error(`${within} is not in the base's source`); }
  const at = src.indexOf(`const ${name} =`, from);
  if (at < 0) throw new Error(`${name} is not in the base's source`);
  let depth = 0;
  for (let i = at; i < src.length; i++) {
    const c = src[i];
    if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) depth--; else if (c === ';' && depth === 0) return src.slice(at, i + 1);
  }
  throw new Error(`${name}: no end`);
}
// an old place: its definition and the names it needs (in order), run as they were
const oldPlace = (file, names, within) => { const src = baseOf(file); return new Function('"use strict";\n' + names.map((n) => definition(src, n, within)).join('\n') + `\nreturn ${names[names.length - 1]};`)(); };
const old = (file, names, within) => { try { return { file, f: oldPlace(file, names, within) }; } catch (e) { return { file, f: () => { throw e; } }; } };
const CRC_OLD = [old('assets/js/design-engine.js', ['CRC', 'crc32']), old('assets/js/pbip-zip.js', ['CRC', 'crc32']), old('mcp/lib/glass-picture.mjs', ['CRC', 'crc32']),
  old('mcp/lib/page-picture.mjs', ['CRC', 'crc32']), old('assets/js/theme-download-ui.js', ['CRC', 'crc32'])];
const CHUNK_OLD = [old('assets/js/design-engine.js', ['CRC', 'crc32', 'u32', 'chunk']), old('mcp/lib/glass-picture.mjs', ['CRC', 'crc32', 'be', 'chunk']), old('mcp/lib/page-picture.mjs', ['CRC', 'crc32', 'be', 'chunk'])];
const U32_OLD = [old('mcp/lib/glass-picture.mjs', ['u32']), old('mcp/lib/page-picture.mjs', ['u32'])];
const LRU_OLD = [old('mcp/lib/glass-picture.mjs', ['lru']), old('mcp/lib/page-picture.mjs', ['lru'])];
const TEXT_OLD = old('assets/js/theme-download-ui.js', ['CRC', 'crc32', 'textChunk']);
const answer = (run) => { try { return String(run()); } catch (e) { return 'throws ' + e.message; } };
const parity = (id, x, label, places) => {
  const got = places.map(([who, run]) => [who, answer(run)]), one = new Set(got.map((g) => g[1])).size === 1;
  chk(() => one, () => `${id}. ${label}: one answer from every place: ${got.map(([w, a]) => w + ' ' + a.slice(0, 40)).join('; ')}`);
};
let pn = 0;
BYTES.forEach((x) => parity('P' + ++pn, x, 'crc ' + x.label, CRC_OLD.map((o) => [o.file, () => crcOf(o.f, x)]).concat([['png-bytes.js', () => crcOf(P.crc32, x)], ['pbip-zip.js now', () => crcOf(engines.Zip.crc32, x)]])));
CHUNKS.forEach((x) => parity('P' + ++pn, x, 'png-chunk ' + x.label, CHUNK_OLD.map((o) => [o.file, () => chunkOf(o.f, x)]).concat([['png-bytes.js', () => chunkOf(P.pngChunk, x)]])));
U32.forEach((x) => parity('P' + ++pn, x, 'u32 ' + x.label, U32_OLD.map((o) => [o.file, () => readOf(o.f, x)]).concat([['png-bytes.js', () => readOf(P.u32, x)]])));
LRUS.forEach((x) => parity('P' + ++pn, x, 'lru ' + x.label, LRU_OLD.map((o) => [o.file, () => lruOf(o.f, x)]).concat([['small-cache.mjs', () => lruOf(lru, x)]])));
const TEXTS = [['Software', 'DataArcus Power BI Theme & Layout Generator'], ['Source', 'https://dataarcus.com/tools/power-bi-theme-generator.html'], ['Comment', 'made up'], ['a', ''],
  ['', 'x'], ['Title', 'المبيعات 2026'], ['Title', 'café'], ['k', '\u0000\u00ff\u0100']];
TEXTS.forEach(([k, v]) => parity('P' + ++pn, null, `textChunk(${JSON.stringify(k)}, ${JSON.stringify(v)})`, [['theme-download-ui.js (base)', () => sha(TEXT_OLD.f(k, v))], ['theme-download-ui.js (now)', () => sha(engines.textChunk(k, v))]]));
chk(() => engines.Zip.crc32 === P.crc32, () => 'P41. pbip-zip.js exports png-bytes.js crc32 itself (the same function)');

// ---------- B: the 15 outputs written by the base's own engines, in a child process ----------
{
  let base = null, why = '';
  try {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-dd2p-base-'));
    const files = fs.readdirSync(path.join(BASE_FIX, 'assets', 'js')).map((n) => 'assets/js/' + n).filter((f) => /^assets\/js\/[^/]+\.js$/.test(f) && !/\.min\.js$/.test(f))
      .concat(['mcp/lib/glass-picture.mjs', 'mcp/lib/page-picture.mjs']);
    for (const f of files) { const to = path.join(dir, ...f.split('/')); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.writeFileSync(to, baseOf(f)); }
    const out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { cwd: HERE, env: Object.assign({}, process.env, { DD2P_TREE: dir }), maxBuffer: 1 << 24 }).toString('utf8').trim().split('\n').pop();
    base = JSON.parse(out);
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) { why = String(e.message || e).slice(0, 300); }
  Object.keys(BASE_SHAS).forEach((label, i) => chk(() => base && base[label] === shasNow[label] && /^[0-9a-f]{64}$/.test(shasNow[label]),
    () => `B${i + 1}. ${label}: the base's engines write the same bytes as now: base ${base ? String(base[label]).slice(0, 16) : why}, now ${String(shasNow[label]).slice(0, 16)}`));
}

// ---------- S: one job, one place ----------
{
  const list = (dir, re) => fs.readdirSync(path.join(REPO, ...dir.split('/'))).filter((f) => re.test(f) && !/\.min\.js$/.test(f)).map((f) => dir + '/' + f);
  const sources = list('assets/js', /\.js$/).concat(list('mcp/lib', /\.mjs$/), list('mcp/tools', /\.mjs$/)), text = (f) => fs.readFileSync(path.join(REPO, ...f.split('/')), 'utf8');
  const withTable = sources.filter((f) => /0xedb88320/i.test(text(f))), withCache = sources.filter((f) => /m\.keys\(\)\.next\(\)\.value/.test(text(f)));
  chk(() => withTable.length === 1 && withTable[0] === 'assets/js/png-bytes.js', () => `S1. the CRC table (0xedb88320) is in png-bytes.js only: ${withTable.join(', ')}`);
  chk(() => withCache.length === 1 && withCache[0] === 'mcp/lib/small-cache.mjs', () => `S2. the small cache is in small-cache.mjs only: ${withCache.join(', ')}`);
  [['assets/js/design-engine.js', /require\('\.\/png-bytes\.js'\)[^\n]*root\.DAPngBytes/], ['assets/js/pbip-zip.js', /require\('\.\/png-bytes\.js'\)[^\n]*root\.DAPngBytes/], ['assets/js/theme-download-ui.js', /root\.DAPngBytes/],
    ['mcp/lib/glass-picture.mjs', /assets\/js\/png-bytes\.js/], ['mcp/lib/page-picture.mjs', /assets\/js\/png-bytes\.js/]]
    .forEach(([f, re], i) => chk(() => re.test(text(f)), () => `S${i + 3}. ${f} loads png-bytes.js`));
  ['mcp/lib/glass-picture.mjs', 'mcp/lib/page-picture.mjs'].forEach((f, i) => chk(() => /import \{ lru \} from '\.\/small-cache\.mjs'/.test(text(f)), () => `S${i + 8}. ${f} imports small-cache.mjs`));
}

if (process.env.DD2P_PRINT === '1') { console.log('zlib ' + zlibHere); Object.entries(shasNow).forEach(([k, v]) => console.log(k + ': ' + v)); }
notes.forEach((n) => console.log('  note: ' + n));
if (problems.length) { console.log(`FAIL script=test-0.3.2-dd2p.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2p  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2p  ${checks} checks`);
