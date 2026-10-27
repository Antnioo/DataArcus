// (0.3.1 GD2, the owner, 27 Oct: "i want the twin to be identical") DataArcus's glass page picture, read back in Node: the
// twin's Arabic pages get it flipped left to right, and the approval page draws a small copy behind a glass page. Only the
// engine's own pictures are read (assets/js/design-engine.js: glassPng, marked by isGlassPng: RGB, 8 bits, not
// interlaced); anything else is left alone (null). The pictures written are the engine's own PNGs (encodePng, marked).
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../../assets/js/design-engine.js');

const u32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
// A glass picture's pixels: { w, h, rgb } (rows top to bottom), or null for any other bytes
export function glassPixels(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : null;
  if (!b || !E.isGlassPng(b)) return null;
  const w = u32(b, 16), h = u32(b, 20);
  if (b[24] !== 8 || b[25] !== 2 || b[28] !== 0 || !w || !h || w > 8192 || h > 8192) return null;
  const parts = [];
  for (let i = 8; i + 8 <= b.length;) { const n = u32(b, i), t = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]); if (t === 'IDAT') parts.push(b.subarray(i + 8, i + 8 + n)); if (t === 'IEND') break; i += 12 + n; }
  let raw; try { raw = zlib.inflateSync(Buffer.concat(parts.map((p) => Buffer.from(p)))); } catch (e) { return null; }
  const row = w * 3; if (raw.length < h * (row + 1)) return null;
  const rgb = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (row + 1)], src = y * (row + 1) + 1, p = y * row;
    for (let x = 0; x < row; x++) {
      const a = x >= 3 ? rgb[p + x - 3] : 0, up = y ? rgb[p + x - row] : 0, c = x >= 3 && y ? rgb[p + x - row - 3] : 0;
      const pr = f === 1 ? a : f === 2 ? up : f === 3 ? (a + up) >> 1 : f === 4 ? ((q) => { const pa = Math.abs(q - a), pb = Math.abs(q - up), pc = Math.abs(q - c); return pa <= pb && pa <= pc ? a : pb <= pc ? up : c; })(a + up - c) : 0;
      rgb[p + x] = (raw[src + x] + pr) & 255;
    }
  }
  return { w, h, rgb };
}
// The glass picture flipped left to right (the Arabic page of a glass page: the English page's picture mirrored, pixel by
// pixel), as the engine's own marked PNG; null for any other bytes
export function flipGlassPng(bytes) {
  const g = glassPixels(bytes); if (!g) return null;
  const out = new Uint8Array(g.rgb.length), row = g.w * 3;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const s = y * row + x * 3, d = y * row + (g.w - 1 - x) * 3; out[d] = g.rgb[s]; out[d + 1] = g.rgb[s + 1]; out[d + 2] = g.rgb[s + 2]; }
  return E.encodePng(g.w, g.h, out, E.GLASS_MARK);
}
// A small copy (w wide at most) of a glass picture as a data URL, for the approval page's preview only (never an answer to
// Claude); the soft picture loses nothing at that size. null for any other bytes
export const PREVIEW_W = 320;
export function glassPreviewUrl(bytes, maxW = PREVIEW_W) {
  const g = glassPixels(bytes); if (!g) return null;
  const k = Math.max(1, Math.ceil(g.w / maxW)), w = Math.max(1, Math.floor(g.w / k)), h = Math.max(1, Math.floor(g.h / k)), out = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (y * k * g.w + x * k) * 3, d = (y * w + x) * 3; out[d] = g.rgb[s]; out[d + 1] = g.rgb[s + 1]; out[d + 2] = g.rgb[s + 2]; }
  return 'data:image/png;base64,' + Buffer.from(E.encodePng(w, h, out, E.GLASS_MARK)).toString('base64');
}
