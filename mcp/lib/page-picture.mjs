// (0.3.1 MP1, the owner, 29 Oct: "I want all the pages to be mirrored rtl", D-1029-03) a page drawn on a picture, in the
// Arabic twin: its picture read (PNG or JPEG, by DataArcus's own readers below: no new package), flipped left to right
// and written as a PNG, so the visuals mirrored onto it (x' = W - x - w) sit on the same panels.
// The rule (Codex's research, 29 Oct): a picture iw x ih drawn at scale sx from ox lands its column u at x = ox + sx*u;
// flipping it and mirroring the visuals agree when 2*ox + sx*iw = W. Desktop 2.159 places a page picture (laptop part
// 6 block B, 29 Oct; scripts/tests/DESKTOP-TESTS.md, "where Desktop places a page picture"): Normal centred at scale
// 1, Fit stretched to the whole page, Fill centred at the larger scale. All three agree for any picture size, so the
// picture is flipped as it is, its own size and fit kept (MP1's padding of a Normal picture, from a model that put it
// at 0,0, is gone).
// What a picture holds is never returned to Claude: only its size, whether it may hold words, and which visuals leave
// their panel (names and places).
import zlib from 'node:zlib';
import crypto from 'node:crypto';

export const MAX_SIDE = 8192, MAX_PIXELS = 16 * 1024 * 1024;
const u32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const u16 = (b, i) => (b[i] << 8) | b[i + 1];
const tooBig = (w, h) => !w || !h || w > MAX_SIDE || h > MAX_SIDE || w * h > MAX_PIXELS;

// ---------- PNG: every colour type and depth the format has, interlaced too ----------
function readPng(b) {
  let w = 0, h = 0, depth = 0, type = 0, interlace = 0, palette = null, trns = null; const parts = [];
  for (let i = 8; i + 8 <= b.length;) {
    const n = u32(b, i), t = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]), d = b.subarray(i + 8, i + 8 + n);
    if (t === 'IHDR') { w = u32(d, 0); h = u32(d, 4); depth = d[8]; type = d[9]; interlace = d[12]; }
    else if (t === 'PLTE') palette = d; else if (t === 'tRNS') trns = d; else if (t === 'IDAT') parts.push(d); else if (t === 'IEND') break;
    i += 12 + n;
  }
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  if (!ch || ![1, 2, 4, 8, 16].includes(depth) || (type === 3 && !palette)) return { why: 'a PNG of a kind not expected' };
  if (tooBig(w, h)) return { why: `too large to read (${w} x ${h}; at most ${MAX_SIDE} a side)` };
  // (the data can't inflate past what the picture needs: a crafted file is refused, not let fill the memory)
  const most = h * (1 + Math.ceil((w * ch * depth) / 8)) + 8 * h + 64;
  let raw; try { raw = zlib.inflateSync(Buffer.concat(parts.map((p) => Buffer.from(p))), { maxOutputLength: most }); } catch (e) { return { why: 'its PNG data could not be read' }; }
  const rgba = new Uint8Array(w * h * 4), bpp = Math.max(1, (ch * depth) >> 3), max = (1 << Math.min(depth, 8)) - 1;
  const key = trns && type === 0 ? u16(trns, 0) : null, keyRgb = trns && type === 2 ? [u16(trns, 0), u16(trns, 2), u16(trns, 4)] : null;
  let at = 0;
  // one pass (the whole picture, or one of Adam7's seven): its rows unfiltered, then each pixel into rgba
  const pass = (x0, y0, dx, dy) => {
    const pw = Math.ceil((w - x0) / dx), ph = Math.ceil((h - y0) / dy); if (pw <= 0 || ph <= 0) return true;
    const row = Math.ceil((pw * ch * depth) / 8); let prev = new Uint8Array(row);
    for (let y = 0; y < ph; y++) {
      if (at + 1 + row > raw.length) return false;
      const f = raw[at], cur = new Uint8Array(raw.subarray(at + 1, at + 1 + row)); at += 1 + row;
      for (let x = 0; x < row; x++) {
        const a = x >= bpp ? cur[x - bpp] : 0, up = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
        if (f === 1) cur[x] = (cur[x] + a) & 255; else if (f === 2) cur[x] = (cur[x] + up) & 255; else if (f === 3) cur[x] = (cur[x] + ((a + up) >> 1)) & 255;
        else if (f === 4) { const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); cur[x] = (cur[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? up : c)) & 255; } else if (f !== 0) return false;
      }
      // the samples of this row: 16 bits keep their high byte; under 8 bits scaled to 0..255 (a palette index kept)
      const sample = (k) => { if (depth === 16) return cur[k * 2]; if (depth === 8) return cur[k]; const bit = k * depth, v = (cur[bit >> 3] >> (8 - depth - (bit & 7))) & max; return type === 3 ? v : Math.round((v * 255) / max); };
      const full = (k) => (depth === 16 ? u16(cur, k * 2) : depth === 8 ? cur[k] : (cur[(k * depth) >> 3] >> (8 - depth - ((k * depth) & 7))) & max);
      for (let x = 0; x < pw; x++) {
        const o = (((y0 + y * dy) * w) + x0 + x * dx) * 4, s0 = x * ch;
        if (type === 3) { const v = sample(s0); rgba[o] = palette[v * 3] || 0; rgba[o + 1] = palette[v * 3 + 1] || 0; rgba[o + 2] = palette[v * 3 + 2] || 0; rgba[o + 3] = trns && v < trns.length ? trns[v] : 255; }
        else if (type === 0 || type === 4) { const g = sample(s0); rgba[o] = rgba[o + 1] = rgba[o + 2] = g; rgba[o + 3] = type === 4 ? sample(s0 + 1) : key != null && full(s0) === key ? 0 : 255; }
        else { rgba[o] = sample(s0); rgba[o + 1] = sample(s0 + 1); rgba[o + 2] = sample(s0 + 2); rgba[o + 3] = type === 6 ? sample(s0 + 3) : keyRgb && full(s0) === keyRgb[0] && full(s0 + 1) === keyRgb[1] && full(s0 + 2) === keyRgb[2] ? 0 : 255; }
      }
      prev = cur;
    }
    return true;
  };
  const passes = interlace ? [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]] : [[0, 0, 1, 1]];
  for (const p of passes) if (!pass(...p)) return { why: 'its PNG data is cut short or not as expected' };
  return { w, h, rgba };
}

// ---------- JPEG: baseline and progressive (Huffman), any sampling, restart markers ----------
const ZZ = new Int32Array([0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63]);
const COS = (() => { const t = new Float64Array(64); for (let x = 0; x < 8; x++) for (let u = 0; u < 8; u++) t[x * 8 + u] = (u ? 1 : Math.SQRT1_2) * Math.cos(((2 * x + 1) * u * Math.PI) / 16) / 2; return t; })();
function huffman(lengths, values) {
  // canonical codes: per length, the first code and where its values start (read bit by bit)
  const maxcode = new Int32Array(18).fill(-1), valptr = new Int32Array(17), mincode = new Int32Array(17);
  let code = 0, k = 0;
  for (let l = 1; l <= 16; l++) { valptr[l] = k; mincode[l] = code; code += lengths[l - 1]; k += lengths[l - 1]; maxcode[l] = lengths[l - 1] ? code - 1 : -1; code <<= 1; }
  return { maxcode, valptr, mincode, values };
}
function readJpeg(b) {
  const q = [], dc = [], ac = []; let frame = null, adobe = null, resetInterval = 0, eobrun = 0, scans = 0;
  let i = 2;
  const segment = () => { const n = u16(b, i); const d = b.subarray(i + 2, i + n); i += n; return d; };
  const decodeScan = (comps, ss, se, ah, al) => {
    // the bits: 0xFF 0x00 is a 0xFF byte; a marker ends the data (zeros after it)
    let pos = i, bits = 0, nb = 0;
    const bit = () => { if (nb === 0) { if (pos >= b.length) return 0; let c = b[pos]; if (c === 0xff) { const n2 = b[pos + 1]; if (n2 === 0) pos += 2; else if (n2 >= 0xd0 && n2 <= 0xd7) { return 0; } else { return 0; } } else pos++; bits = c; nb = 8; } nb--; return (bits >> nb) & 1; };
    const receive = (n) => { let v = 0; for (let k = 0; k < n; k++) v = (v << 1) | bit(); return v; };
    const extend = (v, n) => (n && v < 1 << (n - 1) ? v - (1 << n) + 1 : v);
    const decode = (t) => { let code = 0; for (let l = 1; l <= 16; l++) { code = (code << 1) | bit(); if (t.maxcode[l] >= 0 && code <= t.maxcode[l] && code >= t.mincode[l]) return t.values[t.valptr[l] + code - t.mincode[l]]; } return 0; };
    const prog = frame.progressive;
    const block = (c, blk) => {
      const z = c.coef, o = blk * 64;
      if (!prog) {
        const t = decode(c.dcT), d = t ? extend(receive(t), t) : 0; c.pred += d; z[o] = c.pred;
        for (let k = 1; k < 64;) { const rs = decode(c.acT), r = rs >> 4, s = rs & 15; if (!s) { if (r !== 15) break; k += 16; continue; } k += r; if (k > 63) break; z[o + ZZ[k]] = extend(receive(s), s); k++; }
        return;
      }
      if (ss === 0) {   // DC: first pass or refinement
        if (ah === 0) { const t = decode(c.dcT), d = t ? extend(receive(t), t) : 0; c.pred += d; z[o] = c.pred * (1 << al); } else if (bit()) z[o] |= 1 << al;
        return;
      }
      if (ah === 0) {   // AC first pass
        if (eobrun > 0) { eobrun--; return; }
        for (let k = ss; k <= se;) { const rs = decode(c.acT), r = rs >> 4, s = rs & 15;
          if (!s) { if (r < 15) { eobrun = (1 << r) - 1 + (r ? receive(r) : 0); break; } k += 16; continue; }
          k += r; if (k > 63) break; z[o + ZZ[k]] = extend(receive(s), s) * (1 << al); k++; }
        return;
      }
      // AC refinement (libjpeg's decode_mcu_AC_refine, step for step)
      let k = ss; const p1 = 1 << al, m1 = -1 << al;
      const fix = (zi) => { if (bit() && (z[zi] & p1) === 0) z[zi] += z[zi] >= 0 ? p1 : m1; };
      if (eobrun <= 0) {
        for (; k <= se; k++) {
          const rs = decode(c.acT); let r = rs >> 4, s = rs & 15;
          if (s) s = bit() ? p1 : m1;
          else if (r !== 15) { eobrun = (1 << r) + (r ? receive(r) : 0); break; }
          do { const zi = o + ZZ[k]; if (z[zi] !== 0) fix(zi); else if (--r < 0) break; k++; } while (k <= se);
          if (s && k <= se) z[o + ZZ[k]] = s;
        }
      }
      if (eobrun > 0) { for (; k <= se; k++) { const zi = o + ZZ[k]; if (z[zi] !== 0) fix(zi); } eobrun--; }
    };
    const one = comps.length === 1;
    const mcusX = one ? Math.ceil(Math.ceil((frame.x * comps[0].h) / frame.hmax) / 8) : frame.mcusX, mcusY = one ? Math.ceil(Math.ceil((frame.y * comps[0].v) / frame.vmax) / 8) : frame.mcusY;
    const total = mcusX * mcusY;
    comps.forEach((c) => { c.pred = 0; }); eobrun = 0;
    for (let m = 0; m < total; m++) {
      if (resetInterval && m && m % resetInterval === 0) {
        // the restart marker: the bits left are dropped, the predictions start again
        nb = 0; while (pos < b.length && !(b[pos] === 0xff && b[pos + 1] >= 0xd0 && b[pos + 1] <= 0xd7)) pos++; if (pos < b.length) pos += 2;
        comps.forEach((c) => { c.pred = 0; }); eobrun = 0;
      }
      if (one) { const c = comps[0], bx = m % mcusX, by = (m / mcusX) | 0; block(c, by * c.bw + bx); }
      else { const mx = m % mcusX, my = (m / mcusX) | 0; comps.forEach((c) => { for (let v = 0; v < c.v; v++) for (let h = 0; h < c.h; h++) block(c, (my * c.v + v) * c.bw + mx * c.h + h); }); }
    }
    // to the next marker
    while (pos < b.length && !(b[pos] === 0xff && b[pos + 1] !== 0 && !(b[pos + 1] >= 0xd0 && b[pos + 1] <= 0xd7))) pos++;
    i = pos;
  };
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1]; i += 2;
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7) || m === 0xff) { if (m === 0xff) i--; continue; }
    if (m === 0xd9) break;
    if (m === 0xdb) { const d = segment(); for (let k = 0; k < d.length;) { const pq = d[k] >> 4, tq = d[k] & 15, t = new Int32Array(64); for (let j = 0; j < 64; j++) t[ZZ[j]] = pq ? u16(d, k + 1 + j * 2) : d[k + 1 + j]; q[tq] = t; k += 1 + (pq ? 128 : 64); } }
    else if (m === 0xc4) { const d = segment(); for (let k = 0; k < d.length;) { const tc = d[k] >> 4, th = d[k] & 15, lens = d.subarray(k + 1, k + 17), n = lens.reduce((s, x) => s + x, 0); (tc ? ac : dc)[th] = huffman(lens, d.subarray(k + 17, k + 17 + n)); k += 17 + n; } }
    else if (m === 0xdd) { const d = segment(); resetInterval = u16(d, 0); }
    else if (m === 0xee) { const d = segment(); if (String.fromCharCode(...d.subarray(0, 5)) === 'Adobe') adobe = { transform: d[11] }; }
    else if (m === 0xc0 || m === 0xc1 || m === 0xc2) {
      const d = segment(), y = u16(d, 1), x = u16(d, 3), n = d[5];
      if (d[0] !== 8) return { why: 'a JPEG of 12 bits a sample, which DataArcus does not read' };
      if (tooBig(x, y)) return { why: `too large to read (${x} x ${y}; at most ${MAX_SIDE} a side)` };
      const comps = []; for (let k = 0; k < n; k++) comps.push({ id: d[6 + k * 3], h: d[7 + k * 3] >> 4, v: d[7 + k * 3] & 15, tq: d[8 + k * 3] });
      if (![1, 3].includes(n)) return { why: 'a JPEG with four colour channels (CMYK), which DataArcus does not read' };
      const hmax = Math.max(...comps.map((c) => c.h)), vmax = Math.max(...comps.map((c) => c.v)), mcusX = Math.ceil(x / (8 * hmax)), mcusY = Math.ceil(y / (8 * vmax));
      comps.forEach((c) => { c.bw = mcusX * c.h; c.bh = mcusY * c.v; c.coef = new Int32Array(c.bw * c.bh * 64); });
      frame = { x, y, comps, hmax, vmax, mcusX, mcusY, progressive: m === 0xc2 };
    } else if (m >= 0xc3 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { why: 'a JPEG of a kind DataArcus does not read (lossless or arithmetic coding)' };
    else if (m === 0xda) {
      if (!frame) return { why: 'a JPEG with no frame' };
      // (a progressive JPEG has about 10 scans; a crafted one with thousands would take minutes)
      if (++scans > 64) return { why: 'a JPEG with more scans than a picture has (over 64)' };
      const d = segment(), n = d[0], comps = [];
      for (let k = 0; k < n; k++) { const c = frame.comps.find((x) => x.id === d[1 + k * 2]); if (!c) return { why: 'a JPEG not as expected' }; c.dcT = dc[d[2 + k * 2] >> 4]; c.acT = ac[d[2 + k * 2] & 15]; comps.push(c); }
      const ss = d[1 + n * 2], se = d[2 + n * 2], ah = d[3 + n * 2] >> 4, al = d[3 + n * 2] & 15;
      if (comps.some((c) => (ss === 0 && ah === 0 && !c.dcT) || (se > 0 && !c.acT))) return { why: 'a JPEG with a missing Huffman table' };
      decodeScan(comps, ss, se, ah, al);
    } else segment();
  }
  if (!frame) return { why: 'not a JPEG DataArcus can read' };
  // each component's samples: dequantised, IDCT, clamped
  const planes = frame.comps.map((c) => {
    const qt = q[c.tq]; if (!qt) return null; const pw = c.bw * 8, plane = new Uint8ClampedArray(pw * c.bh * 8), tmp = new Float64Array(64);
    for (let by = 0; by < c.bh; by++) for (let bx = 0; bx < c.bw; bx++) {
      const o = (by * c.bw + bx) * 64;
      for (let y = 0; y < 8; y++) for (let u = 0; u < 8; u++) { let s = 0; for (let v = 0; v < 8; v++) s += COS[y * 8 + v] * c.coef[o + v * 8 + u] * qt[v * 8 + u]; tmp[y * 8 + u] = s; }
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { let s = 0; for (let u = 0; u < 8; u++) s += COS[x * 8 + u] * tmp[y * 8 + u]; plane[(by * 8 + y) * pw + bx * 8 + x] = Math.round(s + 128); }
    }
    return { plane, pw, ph: c.bh * 8, sx: c.h / frame.hmax, sy: c.v / frame.vmax };
  });
  if (planes.some((p) => !p)) return { why: 'a JPEG with a missing quantisation table' };
  const { x: w, y: h } = frame, rgba = new Uint8Array(w * h * 4);
  // a sample of a smaller plane: between its four nearest, centre on centre (as libjpeg's smooth upsampling)
  const at = (p, x, y) => {
    if (p.sx === 1 && p.sy === 1) return p.plane[y * p.pw + x];
    const fx = Math.min(p.pw - 1, Math.max(0, (x + 0.5) * p.sx - 0.5)), fy = Math.min(p.ph - 1, Math.max(0, (y + 0.5) * p.sy - 0.5)), x0 = fx | 0, y0 = fy | 0, x1 = Math.min(p.pw - 1, x0 + 1), y1 = Math.min(p.ph - 1, y0 + 1), ax = fx - x0, ay = fy - y0;
    return (p.plane[y0 * p.pw + x0] * (1 - ax) + p.plane[y0 * p.pw + x1] * ax) * (1 - ay) + (p.plane[y1 * p.pw + x0] * (1 - ax) + p.plane[y1 * p.pw + x1] * ax) * ay;
  };
  const rgb = planes.length === 3 && adobe && adobe.transform === 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4;
    if (planes.length === 1) { rgba[o] = rgba[o + 1] = rgba[o + 2] = planes[0].plane[y * planes[0].pw + x]; }
    else { const Y = at(planes[0], x, y), cb = at(planes[1], x, y) - 128, cr = at(planes[2], x, y) - 128;
      if (rgb) { rgba[o] = Y; rgba[o + 1] = cb + 128; rgba[o + 2] = cr + 128; }
      else { rgba[o] = clamp(Y + 1.402 * cr); rgba[o + 1] = clamp(Y - 0.344136 * cb - 0.714136 * cr); rgba[o + 2] = clamp(Y + 1.772 * cb); } }
    rgba[o + 3] = 255;
  }
  return { w, h, rgba };
}
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/** A picture's pixels: { w, h, rgba } (rows top to bottom, 4 bytes a pixel), or { why } (a sentence: why it can't be
 *  read). PNG and JPEG only, at most MAX_SIDE a side and MAX_PIXELS in all. */
export function readPicture(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : null;
  if (!b || b.length < 12) return { why: 'the picture file is empty' };
  try {
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return readPng(b);
    if (b[0] === 0xff && b[1] === 0xd8) return readJpeg(b);
  } catch (e) { return { why: 'the picture could not be read' }; }
  return { why: 'not a PNG or a JPEG (DataArcus reads those two)' };
}

// ---------- PNG written: RGBA (RGB when every pixel is opaque), each row filtered Sub ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const be = (v) => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
const chunk = (type, body) => { const c = Buffer.alloc(12 + body.length); c.set(be(body.length)); c.write(type, 4, 'latin1'); c.set(body, 8); c.set(be(crc32(c.subarray(4, 8 + body.length))), 8 + body.length); return c; };
export function writePng(w, h, rgba) {
  let opaque = true; for (let i = 3; i < rgba.length; i += 4) if (rgba[i] !== 255) { opaque = false; break; }
  const ch = opaque ? 3 : 4, row = w * ch, raw = new Uint8Array(h * (row + 1));
  for (let y = 0; y < h; y++) {
    const q = y * (row + 1); raw[q] = 1;
    for (let x = 0; x < w; x++) for (let c = 0; c < ch; c++) { const v = rgba[(y * w + x) * 4 + c], left = x ? rgba[(y * w + x - 1) * 4 + c] : 0; raw[q + 1 + x * ch + c] = (v - left) & 255; }
  }
  return new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', Buffer.from(be(w).concat(be(h), [8, opaque ? 2 : 6, 0, 0, 0]))), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
/** (tests only) a PNG of rgba written another way than writePng: a palette (with tRNS) or Adam7-interlaced RGBA, so the
 *  reader is checked on both (pngjs writes neither) */
export function testPng(w, h, rgba, o) {
  const opts = o || {}, out = [];
  if (opts.palette) {
    const colours = new Map(), idx = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) { const k = rgba.subarray(i * 4, i * 4 + 4).join(','); if (!colours.has(k)) colours.set(k, colours.size); idx[i] = colours.get(k); }
    if (colours.size > 256) return null;
    const pl = [...colours.keys()].map((k) => k.split(',').map(Number)), raw = new Uint8Array(h * (w + 1));
    for (let y = 0; y < h; y++) raw.set(idx.subarray(y * w, y * w + w), y * (w + 1) + 1);
    out.push(chunk('IHDR', Buffer.from(be(w).concat(be(h), [8, 3, 0, 0, 0]))), chunk('PLTE', Buffer.from(pl.flatMap((c) => c.slice(0, 3)))), chunk('tRNS', Buffer.from(pl.map((c) => c[3]))), chunk('IDAT', zlib.deflateSync(raw)));
  } else {
    const parts = [];
    [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]].forEach(([x0, y0, dx, dy]) => {
      const pw = Math.ceil((w - x0) / dx), ph = Math.ceil((h - y0) / dy); if (pw <= 0 || ph <= 0) return;
      for (let y = 0; y < ph; y++) { parts.push(0); for (let x = 0; x < pw; x++) { const s = ((y0 + y * dy) * w + x0 + x * dx) * 4; parts.push(rgba[s], rgba[s + 1], rgba[s + 2], rgba[s + 3]); } }
    });
    out.push(chunk('IHDR', Buffer.from(be(w).concat(be(h), [8, 6, 0, 0, 1]))), chunk('IDAT', zlib.deflateSync(Buffer.from(parts))));
  }
  return new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ...out, chunk('IEND', Buffer.alloc(0))]));
}

// ---------- the rule ----------
export const FITS = ['Normal', 'Fit', 'Fill'];
/** Where a picture of iw x ih lands on a W x H page: { sx, sy, ox, oy }, as Desktop 2.159 was measured to place it
 *  (DESKTOP-TESTS.md, 2026-10-29, "where Desktop places a page picture"): Normal centred at scale 1; Fit stretched to
 *  the page (its proportions not kept); Fill centred at the larger scale. A fit that is none of these is read as Normal. */
export function placement(iw, ih, fit, W, H) {
  if (fit === 'Fit') return { sx: W / iw, sy: H / ih, ox: 0, oy: 0 };
  const s = fit === 'Fill' ? Math.max(W / iw, H / ih) : 1;
  return { sx: s, sy: s, ox: (W - s * iw) / 2, oy: (H - s * ih) / 2 };
}
/** The picture the Arabic page is drawn on: the English one flipped left to right, its own size (every fit is placed
 *  symmetrically about the page's centre line). { w, h, rgba } */
export function flippedFor(img) {
  const { w, h } = img, out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (y * w + x) * 4, d = (y * w + (w - 1 - x)) * 4; out[d] = img.rgba[s]; out[d + 1] = img.rgba[s + 1]; out[d + 2] = img.rgba[s + 2]; out[d + 3] = img.rgba[s + 3]; }
  return { w, h, rgba: out };
}

// ---------- what the picture shows: its regions of one colour (panels), and words ----------
// The picture looked at no wider than LOOK_W (each pixel taken, never blended, so no new colour appears); a region: the
// pixels joined to a first one (4 neighbours) within TOL of its colour on every channel, alpha included
const LOOK_W = 1280, TOL = 28;
function regions(img) {
  const k = Math.max(1, Math.ceil(Math.max(img.w, img.h * 16 / 9) / LOOK_W)), w = Math.ceil(img.w / k), h = Math.ceil(img.h / k), n = w * h;
  const px = new Uint8Array(n * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (Math.min(img.h - 1, y * k) * img.w + Math.min(img.w - 1, x * k)) * 4; px.set(img.rgba.subarray(s, s + 4), (y * w + x) * 4); }
  const label = new Int32Array(n).fill(-1), list = [], stack = new Int32Array(n);
  for (let p0 = 0; p0 < n; p0++) {
    if (label[p0] >= 0) continue;
    const id = list.length, r = px[p0 * 4], g = px[p0 * 4 + 1], b = px[p0 * 4 + 2], a = px[p0 * 4 + 3];
    let sp = 0, area = 0, x0 = w, y0 = h, x1 = -1, y1 = -1; stack[sp++] = p0; label[p0] = id;
    while (sp) {
      const p = stack[--sp], x = p % w, y = (p / w) | 0; area++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nb) { if (q < 0 || label[q] >= 0) continue; const o = q * 4; if (Math.abs(px[o] - r) <= TOL && Math.abs(px[o + 1] - g) <= TOL && Math.abs(px[o + 2] - b) <= TOL && Math.abs(px[o + 3] - a) <= TOL) { label[q] = id; stack[sp++] = q; } }
    }
    list.push({ id, area, x0, y0, x1: x1 + 1, y1: y1 + 1, lum: (r * 299 + g * 587 + b * 114) / 1000, a });
  }
  return { k, w, h, label, list };
}
/** Words painted in the picture, the cheap way: a line of small regions of one colour (4 or more, about one height, one
 *  baseline, close to each other). It can only warn: a picture it fires on is asked before it is flipped. */
function wordsIn(R) {
  const small = R.list.filter((r) => { const rh = r.y1 - r.y0, rw = r.x1 - r.x0; return rh >= 4 && rh <= 48 && rw >= 1 && rw <= 48 && r.area >= 4 && r.area <= rh * rw && r.a > 128; });
  small.sort((p, q) => p.y1 - q.y1 || p.x0 - q.x0);
  let lines = 0; const used = new Set();
  small.forEach((r) => {
    if (used.has(r)) return;
    const rh = r.y1 - r.y0, same = small.filter((o) => !used.has(o) && Math.abs(o.y1 - r.y1) <= 2 && (o.y1 - o.y0) <= rh * 2 + 2 && (o.y1 - o.y0) * 2 + 2 >= rh && Math.abs(o.lum - r.lum) <= 40).sort((p, q) => p.x0 - q.x0);
    // the longest run of them, each close to the one before
    let run = [same[0]]; const runs = [];
    for (let k = 1; k < same.length; k++) { if (same[k].x0 - run[run.length - 1].x1 <= rh * 1.5) run.push(same[k]); else { runs.push(run); run = [same[k]]; } }
    runs.push(run);
    const best = runs.reduce((m, x) => (x.length > m.length ? x : m), []);
    if (best.length >= 4) { lines++; best.forEach((o) => used.add(o)); } else used.add(r);
  });
  return lines;
}

// ---------- the last few pictures looked at, by their bytes ----------
const lru = (max) => { const m = new Map(); return { get: (k) => { if (!m.has(k)) return undefined; const v = m.get(k); m.delete(k); m.set(k, v); return v; }, set: (k, v) => { m.delete(k); if (m.size >= max) m.delete(m.keys().next().value); m.set(k, v); } }; };
const kept = lru(32);
const keyOf = (b) => crypto.createHash('sha256').update(b).digest('hex') + ':' + b.length;
/** A page picture for the Arabic page: { why } when it can't be read, else { iw, ih, png (the Arabic page's picture,
 *  the caller's own copy), words (lines that look like words), same (the flip is the picture itself),
 *  panels: { at(box, mirrored) } }. fit: the page's scaling; W x H: the page. */
export function pagePicture(bytes, fit, W, H) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), key = keyOf(b) + '|' + fit + '|' + W + 'x' + H, hit = kept.get(key);
  if (hit) return hit.why ? hit : Object.assign({}, hit, { png: hit.png.slice() });
  const img = readPicture(b);
  if (img.why) { kept.set(key, img); return img; }
  const f = flippedFor(img), R = regions(img), words = wordsIn(R);
  let same = true; if (same) for (let i = 0; i < f.rgba.length; i++) if (f.rgba[i] !== img.rgba[i]) { same = false; break; }
  // (kept: the panels' bounds only, never the label of every pixel; a 14-picture report stays in the cache)
  const big = R.w * R.h / 1000, regionsKept = { k: R.k, w: R.w, h: R.h, list: R.list.filter((x) => x.area >= big && x.x1 - x.x0 >= 8 && x.y1 - x.y0 >= 8) };
  const r = { iw: img.w, ih: img.h, w: f.w, h: f.h, words, same, png: writePng(f.w, f.h, f.rgba), regions: regionsKept };
  kept.set(key, r);
  return Object.assign({}, r, { png: r.png.slice() });
}

// ---------- the boxes ----------
const boxIn = (v) => { const p = v && v.position; return p && [p.x, p.y, p.width, p.height].every(Number.isFinite) ? { x: p.x, y: p.y, w: p.width, h: p.height } : null; };
/** Each visual's box on the page (a visual in a group: the group's place added), by name; groups themselves and hidden
 *  visuals left out */
export function pageBoxes(visuals) {
  const by = new Map((visuals || []).filter((v) => v && v.name != null).map((v) => [String(v.name), v])), out = new Map();
  by.forEach((v, n) => {
    if (v.visualGroup || v.isHidden) return; const b = boxIn(v); if (!b) return;
    let g = v.parentGroupName, d = 0; while (g != null && by.has(String(g)) && d++ < 10) { const q = by.get(String(g)), qb = boxIn(q); if (!qb || q.isHidden) return; b.x += qb.x; b.y += qb.y; g = q.parentGroupName; }
    out.set(n, b);
  });
  return out;
}
const meets = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
/** Pairs of visuals that overlap on the Arabic page and did not on the English one: [{ visuals: [a, b] }] */
export function newOverlaps(enVisuals, arVisuals) {
  const en = pageBoxes(enVisuals), ar = pageBoxes(arVisuals), names = [...ar.keys()].filter((n) => en.has(n)).sort(), out = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const a = names[i], b = names[j];
    if (meets(ar.get(a), ar.get(b)) > 4 && meets(en.get(a), en.get(b)) <= 0) out.push({ visuals: [a, b] });
  }
  return out;
}
/** The panel of the picture a box sits in: the smallest region of one colour whose bounds hold the box (2 points of
 *  slack), among those of 0.1 % of the picture or more (a KPI tile on a 1280 x 720 page is about 1 %) and 8 wide and high; null when only the whole picture holds it. The box is in page
 *  points; P: pagePicture's result; place: where that picture lands; mirrored: the Arabic page (its picture flipped:
 *  each region's bounds taken mirrored) */
function panelAt(P, box, place, mirrored) {
  const R = P.regions, k = R.k, slack = 2;
  const x0 = (box.x - place.ox) / place.sx / k, x1 = (box.x + box.w - place.ox) / place.sx / k, y0 = (box.y - place.oy) / place.sy / k, y1 = (box.y + box.h - place.oy) / place.sy / k;
  let best = null;
  R.list.forEach((r) => {
    if ((r.x0 === 0 && r.y0 === 0 && r.x1 === R.w && r.y1 === R.h)) return;
    const rx0 = mirrored ? R.w - r.x1 : r.x0, rx1 = mirrored ? R.w - r.x0 : r.x1;
    if (x0 >= rx0 - slack && x1 <= rx1 + slack && y0 >= r.y0 - slack && y1 <= r.y1 + slack && (!best || (r.x1 - r.x0) * (r.y1 - r.y0) < (best.x1 - best.x0) * (best.y1 - best.y0))) best = r;
  });
  return best ? best.id : null;
}
/** The check after mirroring (and the text fitting): each visual that sat in a panel of the English picture and does not
 *  sit in the same panel of the flipped one: [names]. P: pagePicture's result for the page; enFit: the English page's
 *  scaling; W x H: the page. The flipped picture is P's own regions mirrored (the PNG written is exactly that flip). */
export function offPanel(P, enVisuals, arVisuals, enFit, W, H) {
  // (the regions are the English picture's; both pages place their picture alike, as Desktop does: placement)
  const en = pageBoxes(enVisuals), ar = pageBoxes(arVisuals), at = placement(P.w, P.h, enFit, W, H), out = [];
  en.forEach((b, n) => { const was = panelAt(P, b, at, false); if (was == null || !ar.has(n)) return; if (panelAt(P, ar.get(n), at, true) !== was) out.push(n); });
  return out.sort();
}
