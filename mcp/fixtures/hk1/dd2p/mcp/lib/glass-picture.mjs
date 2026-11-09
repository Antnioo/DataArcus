// (0.3.1 GD2, the owner, 27 Oct: "i want the twin to be identical") DataArcus's glass page picture, read back in Node: the
// twin's Arabic pages get it flipped left to right, and the approval page draws a small copy behind a glass page. Only the
// engine's own pictures are read (assets/js/design-engine.js: glassPng, marked by isGlassPng: RGB, 8 bits, not
// interlaced); anything else is left alone (null). The pictures written are marked as the engine's own (encodePng's
// layout: the GLASS_MARK tEXt chunk right after the header), deflated by node:zlib.
// (0.3.1 PF1, D-1027-21: glass is the default, so every report pays this) a picture is decoded once, however many figures
// show it: the last few decoded pictures, previews and flips are kept by their bytes (an LRU keyed by a hash); each
// caller gets its own copy, so no caller can change a cached picture.
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../../assets/js/design-engine.js');

const u32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
// the last few results, by the bytes' hash (the oldest out first)
const lru = (max) => { const m = new Map(); return { get: (k) => { if (!m.has(k)) return undefined; const v = m.get(k); m.delete(k); m.set(k, v); return v; },
  set: (k, v) => { m.delete(k); if (m.size >= max) m.delete(m.keys().next().value); m.set(k, v); } }; };
const keyOf = (b) => crypto.createHash('sha1').update(b).digest('hex') + ':' + b.length;
const pixelsKept = lru(4), previewsKept = lru(16), flipsKept = lru(8);   // (a 1920 x 1080 picture is 6.2 MB decoded)

// the decoded picture, cached: { w, h, rgb } or null; never handed to a caller as it is
function decoded(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : null;
  if (!b || !E.isGlassPng(b)) return { key: null, g: null };
  const key = keyOf(b), hit = pixelsKept.get(key); if (hit !== undefined) return { key, g: hit };
  const g = decode(b); pixelsKept.set(key, g); return { key, g };
}
function decode(b) {
  const w = u32(b, 16), h = u32(b, 20);
  if (b[24] !== 8 || b[25] !== 2 || b[28] !== 0 || !w || !h || w > 8192 || h > 8192) return null;
  const parts = [];
  for (let i = 8; i + 8 <= b.length;) { const n = u32(b, i), t = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]); if (t === 'IDAT') parts.push(b.subarray(i + 8, i + 8 + n)); if (t === 'IEND') break; i += 12 + n; }
  let raw; try { raw = zlib.inflateSync(Buffer.concat(parts.map((p) => Buffer.from(p)))); } catch (e) { return null; }
  const row = w * 3; if (raw.length < h * (row + 1)) return null;
  // one loop per row's filter (no branch, no function per byte): None, Sub, Up, Average, Paeth
  const rgb = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (row + 1)], s = y * (row + 1) + 1, p = y * row, u = p - row;
    if (f === 0 || (f === 2 && !y)) rgb.set(raw.subarray(s, s + row), p);
    else if (f === 1 || (f === 4 && !y)) { for (let x = 0; x < 3; x++) rgb[p + x] = raw[s + x]; for (let x = 3; x < row; x++) rgb[p + x] = (raw[s + x] + rgb[p + x - 3]) & 255; }
    else if (f === 2) for (let x = 0; x < row; x++) rgb[p + x] = (raw[s + x] + rgb[u + x]) & 255;
    else if (f === 3) { for (let x = 0; x < 3; x++) rgb[p + x] = (raw[s + x] + (y ? rgb[u + x] >> 1 : 0)) & 255; for (let x = 3; x < row; x++) rgb[p + x] = (raw[s + x] + (((y ? rgb[u + x] : 0) + rgb[p + x - 3]) >> 1)) & 255; }
    else if (f === 4) {
      for (let x = 0; x < 3; x++) rgb[p + x] = (raw[s + x] + rgb[u + x]) & 255;   // (Paeth with no left neighbour: the one above)
      for (let x = 3; x < row; x++) {
        const a = rgb[p + x - 3], b = rgb[u + x], c = rgb[u + x - 3], pa = b > c ? b - c : c - b, pb = a > c ? a - c : c - a, q = a + b - c - c, pc = q < 0 ? -q : q;
        rgb[p + x] = (raw[s + x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
    } else return null;
  }
  return { w, h, rgb };
}

// A PNG of rgb (w x h, RGB 8 bits) in the engine's marked layout (encodePng with GLASS_MARK: signature, IHDR, the tEXt
// "Comment\0<GLASS_MARK>" chunk right after the header, as isGlassPng reads it, IDAT, IEND), deflated by node:zlib; every
// row filtered Up (the row above taken away: one pass, the soft picture's rows close to each other)
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function encode(w, h, rgb) {
  const row = w * 3, raw = new Uint8Array(h * (row + 1));
  for (let y = 0; y < h; y++) {
    const p = y * row, q = y * (row + 1) + 1, u = p - row;
    raw[q - 1] = 2;
    if (!y) raw.set(rgb.subarray(0, row), q); else for (let x = 0; x < row; x++) raw[q + x] = (rgb[p + x] - rgb[u + x]) & 255;
  }
  const be = (v) => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
  const chunk = (type, body) => { const c = Buffer.alloc(12 + body.length); c.set(be(body.length)); c.write(type, 4, 'latin1'); c.set(body, 8); c.set(be(crc32(c.subarray(4, 8 + body.length))), 8 + body.length); return c; };
  return new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', Buffer.from(be(w).concat(be(h), [8, 2, 0, 0, 0]))),
    chunk('tEXt', Buffer.from('Comment\0' + E.GLASS_MARK, 'latin1')), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

// A glass picture's pixels: { w, h, rgb } (rows top to bottom; the caller's own copy), or null for any other bytes
export function glassPixels(bytes) {
  const { g } = decoded(bytes);
  return g ? { w: g.w, h: g.h, rgb: g.rgb.slice() } : null;
}
// The glass picture flipped left to right (the Arabic page of a glass page: the English page's picture mirrored, pixel by
// pixel), as a marked glass PNG (the caller's own copy); null for any other bytes
export function flipGlassPng(bytes) {
  const { key, g } = decoded(bytes); if (!g) return null;
  let png = flipsKept.get(key);
  if (png === undefined) {
    const out = new Uint8Array(g.rgb.length), row = g.w * 3, src = g.rgb;
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const s = y * row + x * 3, d = y * row + (g.w - 1 - x) * 3; out[d] = src[s]; out[d + 1] = src[s + 1]; out[d + 2] = src[s + 2]; }
    png = encode(g.w, g.h, out); flipsKept.set(key, png);
  }
  return png.slice();
}
// A small copy (w wide at most) of a glass picture as a data URL, for the approval page's preview only (never an answer to
// Claude); the soft picture loses nothing at that size. null for any other bytes
export const PREVIEW_W = 320;
export function glassPreviewUrl(bytes, maxW = PREVIEW_W) {
  const { key, g } = decoded(bytes); if (!g) return null;
  const k = Math.max(1, Math.ceil(g.w / maxW)), w = Math.max(1, Math.floor(g.w / k)), h = Math.max(1, Math.floor(g.h / k)), pk = key + ':' + w + 'x' + h;
  const hit = previewsKept.get(pk); if (hit !== undefined) return hit;
  const out = new Uint8Array(w * h * 3), src = g.rgb;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (y * k * g.w + x * k) * 3, d = (y * w + x) * 3; out[d] = src[s]; out[d + 1] = src[s + 1]; out[d + 2] = src[s + 2]; }
  const url = 'data:image/png;base64,' + Buffer.from(encode(w, h, out)).toString('base64');
  previewsKept.set(pk, url); return url;
}
