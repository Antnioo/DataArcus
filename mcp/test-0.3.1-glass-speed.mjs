// (0.3.1 PF1, the owner, 27 Oct, D-1027-21: "if it works that needs to go live asap") the glass pictures read back fast:
// mcp/lib/glass-picture.mjs decodes a picture once, however many figures show it, and writes with node:zlib.
//   S   the approval page (page-preview.js fromFiles, as plan-lint and twin-preview call it): 1 decode per distinct
//       picture, not 1 per figure (zlib.inflateSync counted: never a wall-clock threshold)
//   F   the flip: the same picture flipped 3 times (the twin, the EN-AR copy, the bilingual report) is decoded once
//   Z   the pictures written here are deflated by node:zlib (zlib.deflateSync counted)
//   P   the pixels are identical to the old encoder's (the engine's encodePng): the bytes differ (another deflate), so the
//       check compares decoded pixels (pngjs), pixel by pixel, never bytes
//   C   a cached picture can not be changed by a caller (its pixels, its flipped bytes)
//   node test-0.3.1-glass-speed.mjs
import './test-env.mjs';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { glassPixels, glassPreviewUrl, flipGlassPng, PREVIEW_W } from './lib/glass-picture.mjs';

const require = createRequire(import.meta.url);
const E = require('../assets/js/design-engine.js'), Preview = require('../assets/js/page-preview.js'), { PNG } = require('pngjs');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

// zlib's inflate and deflate counted (glass-picture.mjs calls them on node:zlib's own object)
const count = { inflate: 0, deflate: 0 }, inflate0 = zlib.inflateSync, deflate0 = zlib.deflateSync;
zlib.inflateSync = (...a) => { count.inflate++; return inflate0(...a); };
zlib.deflateSync = (...a) => { count.deflate++; return deflate0(...a); };
const counted = (k, f) => { const n0 = count[k]; const r = f(); return [count[k] - n0, r]; };

const design = (theme) => Object.assign({}, E.PRESETS[theme], { look: 'glass' });
const pic = (theme, w, h) => E.glassPng(design(theme), w, h);
const A = pic('Corporate', 400, 225), B = pic('Desert Gulf', 400, 225), C = pic('Corporate', 360, 200), D = pic('Midnight', 300, 170);
chk(() => [A, B, C, D].every((b) => E.isGlassPng(b)) && new Set([A, B, C, D].map((b) => Buffer.from(b).toString('base64'))).size === 4, () => 'S0. four distinct glass pictures made by the engine');

// the approval page's files: 12 pages on picture A, 12 on picture B, a glass theme
const lit = (v) => ({ expr: { Literal: { Value: `'${v}'` } } });
const files = [], order = [];
for (let i = 0; i < 24; i++) {
  const id = 'p' + i, nm = i < 12 ? 'a.png' : 'b.png'; order.push(id);
  files.push({ path: `definition/pages/${id}/page.json`, data: JSON.stringify({ name: id, displayName: 'Page ' + i, width: 1280, height: 720, objects: { background: [{ properties: { image: { image: { name: lit(nm), url: lit(nm) } } } }] } }) });
}
files.push({ path: 'definition/pages/pages.json', data: JSON.stringify({ pageOrder: order }) });
files.push({ path: 'StaticResources/RegisteredResources/theme.json', data: JSON.stringify({ name: 't', textClasses: { label: { fontSize: 10 } }, visualStyles: { '*': { '*': { background: [{ transparency: 30 }] } } } }) });
files.push({ path: 'StaticResources/RegisteredResources/a.png', data: A }, { path: 'StaticResources/RegisteredResources/b.png', data: B });
const [nDec, pages] = counted('inflate', () => Preview.fromFiles(files, { picture: (bytes) => glassPreviewUrl(bytes) }));
chk(() => pages.length === 24 && pages.every((p) => p.glass && /^data:image\/png;base64,/.test(p.glass.url)), () => `S1. the 24 pages drawn on their picture: ${pages.length}, ${pages.filter((p) => p.glass).length} with glass`);
chk(() => nDec === 2, () => `S2. the approval page decodes each distinct picture once (2 pictures, 24 figures): ${nDec} decodes`);
const [nAgain] = counted('inflate', () => Preview.fromFiles(files, { picture: (bytes) => glassPreviewUrl(bytes) }));
chk(() => nAgain === 0, () => `S3. the same approval page drawn again decodes nothing: ${nAgain} decodes`);
chk(() => pages[0].glass.url === pages[11].glass.url && pages[0].glass.url !== pages[12].glass.url, () => 'S4. one preview per picture, the same for each figure on it');

// the flip: C flipped three times, decoded once; each call its own bytes
const [nFlip, flips] = counted('inflate', () => [flipGlassPng(C), flipGlassPng(new Uint8Array(C)), flipGlassPng(Buffer.from(C))]);
chk(() => nFlip === 1, () => `F1. the same picture flipped 3 times is decoded once: ${nFlip} decodes`);
chk(() => flips.every((f) => f && E.isGlassPng(f)) && flips[0] !== flips[1] && Buffer.from(flips[0]).equals(Buffer.from(flips[2])), () => 'F2. each flip a marked glass PNG of its own (a copy), the same bytes');

// node:zlib writes the pictures (a picture not seen before: D)
const [nZ, fD] = counted('deflate', () => flipGlassPng(D));
const [nZp] = counted('deflate', () => glassPreviewUrl(D, 100));
chk(() => nZ === 1 && nZp === 1, () => `Z1. the flip and the preview are deflated by node:zlib: ${nZ}, ${nZp} deflateSync calls`);

// the pixels: identical to the old encoder's (the engine's encodePng of the same pixels), compared decoded
const px = (b) => { const p = PNG.sync.read(Buffer.from(b)); return { w: p.width, h: p.height, d: p.data }; };
const same = (a, b) => a.w === b.w && a.h === b.h && Buffer.compare(a.d, b.d) === 0;
const mirror = (g) => { const o = new Uint8Array(g.rgb.length), r = g.w * 3; for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) for (let c = 0; c < 3; c++) o[y * r + (g.w - 1 - x) * 3 + c] = g.rgb[y * r + x * 3 + c]; return o; };
const small = (g, maxW) => { const k = Math.max(1, Math.ceil(g.w / maxW)), w = Math.max(1, Math.floor(g.w / k)), h = Math.max(1, Math.floor(g.h / k)), o = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) o[(y * w + x) * 3 + c] = g.rgb[(y * k * g.w + x * k) * 3 + c]; return { w, h, o }; };
[['A', A], ['C', C], ['D', D]].forEach(([n, b]) => {
  const src = px(b), g = glassPixels(b);
  chk(() => g && g.w === src.w && g.h === src.h && g.rgb.every((v, i) => v === src.d[(i / 3 | 0) * 4 + i % 3]), () => `P1-${n}. glassPixels reads the picture's own pixels (pngjs agrees)`);
  chk(() => same(px(flipGlassPng(b)), px(E.encodePng(g.w, g.h, mirror(g), E.GLASS_MARK))), () => `P2-${n}. the flipped picture's pixels are the old encoder's, pixel by pixel`);
  const s = small(g, PREVIEW_W), u = glassPreviewUrl(b), pb = Buffer.from(u.slice(u.indexOf(',') + 1), 'base64');
  chk(() => E.isGlassPng(pb) && same(px(pb), px(E.encodePng(s.w, s.h, s.o, E.GLASS_MARK))), () => `P3-${n}. the preview's pixels are the old encoder's, pixel by pixel, still marked as glass`);
});
chk(() => same(px(fD), px(E.encodePng(glassPixels(D).w, glassPixels(D).h, mirror(glassPixels(D)), E.GLASS_MARK))), () => 'P4. a fresh picture flipped: the old encoder\'s pixels');
// every row filter read back (None, Sub, Up, Average, Paeth: row y filtered y % 5), in the marked layout; pngjs the oracle
{ const w = 37, h = 23, row = w * 3, rgb = new Uint8Array(w * h * 3); let r = 7; for (let i = 0; i < rgb.length; i++) { r = (r * 1103515245 + 12345) >>> 0; rgb[i] = i % 7 < 3 ? (i * 5) & 255 : r >>> 24; }
  const raw = new Uint8Array(h * (row + 1));
  for (let y = 0; y < h; y++) { const f = y % 5; raw[y * (row + 1)] = f;
    for (let x = 0; x < row; x++) { const v = rgb[y * row + x], a = x >= 3 ? rgb[y * row + x - 3] : 0, u = y ? rgb[(y - 1) * row + x] : 0, c = x >= 3 && y ? rgb[(y - 1) * row + x - 3] : 0, q = a + u - c, pa = Math.abs(q - a), pb = Math.abs(q - u), pc = Math.abs(q - c);
      const pr = [0, a, u, (a + u) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? u : c][f]; raw[y * (row + 1) + 1 + x] = (v - pr) & 255; } }
  const T = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const v of b) c = T[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const be = (v) => Buffer.from([v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
  const chunk = (t, body) => { const tb = Buffer.concat([Buffer.from(t, 'latin1'), body]); return Buffer.concat([be(body.length), tb, be(crc(tb))]); };
  const b = new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', Buffer.concat([be(w), be(h), Buffer.from([8, 2, 0, 0, 0])])),
    chunk('tEXt', Buffer.from('Comment\0' + E.GLASS_MARK, 'latin1')), chunk('IDAT', deflate0(raw)), chunk('IEND', Buffer.alloc(0))]));
  const g = glassPixels(b), o = px(b);
  chk(() => E.isGlassPng(b) && o.d.every((v, i) => i % 4 === 3 || v === rgb[(i >> 2) * 3 + i % 4]) && g && g.rgb.every((v, i) => v === rgb[i]), () => 'P6. a picture using every row filter (None, Sub, Up, Average, Paeth) is read back exactly (pngjs agrees)');
  chk(() => same(px(flipGlassPng(b)), px(E.encodePng(w, h, mirror(g), E.GLASS_MARK))), () => 'P7. that picture flipped: the old encoder\'s pixels'); }
chk(() => glassPixels(new Uint8Array([1, 2, 3])) === null && flipGlassPng(E.encodePng(4, 4, new Uint8Array(48))) === null && glassPreviewUrl('x') === null, () => 'P5. anything that is not a glass picture is left alone (null)');

// a cached picture can not be changed by a caller
const g1 = glassPixels(A), v0 = g1.rgb[0]; g1.rgb.fill(7); g1.w = 1;
const g2 = glassPixels(A);
chk(() => g2.w === 400 && g2.rgb[0] === v0 && Buffer.from(g2.rgb).equals(Buffer.from(glassPixels(A).rgb)) && g2.rgb.some((v) => v !== 7), () => 'C1. changing the pixels returned leaves the cached picture as it was');
const f1 = flipGlassPng(A), keep = Buffer.from(f1); f1.fill(0);
chk(() => Buffer.from(flipGlassPng(A)).equals(keep), () => 'C2. changing a flipped picture returned leaves the cached one as it was');

zlib.inflateSync = inflate0; zlib.deflateSync = deflate0;
if (problems.length) { console.log(`FAIL script=test-0.3.1-glass-speed.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  glass-speed  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  glass-speed  ${checks} checks`);
process.exit(0);
