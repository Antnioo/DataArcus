// (0.3.1 LC1, PF1's Seen 1: the engine's glassPng deflated in JavaScript, 0.6 s a new picture, 8.5 s under coverage)
// in Node the design engine's encodePng deflates with node:zlib; the browser keeps its JavaScript deflate.
//   Z   encodePng in Node calls zlib.deflateSync (counted), once a picture
//   P   the pixels are identical to the JavaScript encoder's (decoded by pngjs, pixel by pixel, never the bytes), for
//       glass pictures of three designs and sizes and for a picture of random pixels (every filter used)
//   M   the picture keeps its mark (isGlassPng) and its layout: signature, IHDR RGB 8 bits, the tEXt mark right after it
//   T   the time of one new 1920 x 1080 picture (said, never a threshold on the wall clock)
//   node test-0.3.1-lc1.mjs
import './test-env.mjs';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../assets/js/design-engine.js'), { PNG } = require('pngjs');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

const count = { deflate: 0 }, deflate0 = zlib.deflateSync;
zlib.deflateSync = (...a) => { count.deflate++; return deflate0(...a); };

const design = (theme) => Object.assign({}, E.PRESETS[theme], { chart: { look: 'glass' } });
const same = (a, b) => { const x = PNG.sync.read(Buffer.from(a)), y = PNG.sync.read(Buffer.from(b)); return x.width === y.width && x.height === y.height && Buffer.compare(x.data, y.data) === 0; };
const CASES = [['Corporate', 1280, 720], ['Desert Gulf', 1920, 1080], ['Midnight', 641, 359]];
for (const [theme, w, h] of CASES) {
  const px = E.glassPixels(design(theme), w, h), n0 = count.deflate;
  const fast = E.encodePng(w, h, px, E.GLASS_MARK), slow = E.encodePng(w, h, px, E.GLASS_MARK, { deflate: 'js' });
  chk(() => count.deflate - n0 === 1, () => `Z (${theme} ${w} x ${h}): encodePng in Node deflates by node:zlib once (${count.deflate - n0} calls; the JavaScript path none)`);
  chk(() => same(fast, slow), () => `P (${theme} ${w} x ${h}): the node:zlib picture's pixels differ from the JavaScript encoder's`);
  chk(() => E.isGlassPng(fast) && Buffer.from(fast.subarray(12, 16)).toString('latin1') === 'IHDR' && fast[24] === 8 && fast[25] === 2 && Buffer.from(fast.subarray(37, 41)).toString('latin1') === 'tEXt',
    () => `M (${theme} ${w} x ${h}): the mark right after IHDR, RGB 8 bits`);
}
// random pixels: every PNG filter is chosen somewhere, and nothing compresses
{
  let s = 7; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) & 255, w = 97, h = 61, px = new Uint8Array(w * h * 3);
  for (let i = 0; i < px.length; i++) px[i] = i % 5 ? rnd() : (i >> 4) & 255;
  chk(() => same(E.encodePng(w, h, px), E.encodePng(w, h, px, null, { deflate: 'js' })), () => 'P (random 97 x 61): the pixels differ between node:zlib and the JavaScript encoder');
}
// the engine's glassPng (what create_report and the twin call) goes the same way
{
  const n0 = count.deflate, b = E.glassPng(design('Earthy'), 333, 187);
  chk(() => count.deflate - n0 === 1 && E.isGlassPng(b) && same(b, E.encodePng(333, 187, E.glassPixels(design('Earthy'), 333, 187), E.GLASS_MARK, { deflate: 'js' })), () => `Z (glassPng): a new picture by node:zlib, the pixels the JavaScript encoder's (${count.deflate - n0} calls)`);
}
// T: one new 1920 x 1080 picture (the colours not seen before: no cache)
const t0 = performance.now(); E.glassPng(Object.assign(design('Colorblind safe'), { ui: Object.assign({}, E.PRESETS['Colorblind safe'].ui, { background: '#123456' }) }), 1920, 1080); const ms = performance.now() - t0;
console.log(`lc1: one new 1920 x 1080 glass picture ${Math.round(ms)} ms${process.env.NODE_V8_COVERAGE ? ' (under coverage)' : ''}`);

if (problems.length) { console.log(problems.map((p) => '  - ' + p).join('\n')); console.log(`FAIL  lc1  ${checks - problems.length}/${checks} checks`); process.exit(1); }
console.log(`PASS  lc1  ${checks} checks`);
