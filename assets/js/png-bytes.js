/* DataArcus PNG bytes (0.3.2 DD2P; the owner, D-1104-12, 4 Nov: "a library of functions where a place calls them so if
 * we need to fix something we fix it at the source"; D-1016-01): the CRC-32, the big-endian four bytes and the PNG
 * chunk, written once. Before DD2P the CRC-32 was written five times (design-engine.js, pbip-zip.js,
 * theme-download-ui.js, mcp/lib/glass-picture.mjs, mcp/lib/page-picture.mjs, each with its own table), the chunk four
 * times and the read twice; every copy answered the same (docs/CONTRACTS.md families crc, png-chunk, u32), so the
 * answers here are today's, byte for byte (test mcp/test-0.3.2-dd2p.mjs).
 *   crc32(bytes)          the CRC-32 (PNG chunks, ZIP entries) of a Uint8Array or any array of bytes, unsigned
 *   be32(n)               n as 4 bytes, big-endian: an Array of 4 numbers (callers concat it or set it)
 *   u32(bytes, i)         the big-endian unsigned 32-bit number at i (past the end the missing bytes read as 0:
 *                         16908288 for 01 02 at 0)
 *   pngChunk(type, body)  a Uint8Array: the body's length, the 4-letter type, the body, the CRC-32 of type and body
 * Pure: nothing kept but the table, built once. Browser and Node (module.exports / window.DAPngBytes). */
(function (root) {
  'use strict';
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const be32 = (v) => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
  const u32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const pngChunk = (type, body) => {
    const c = new Uint8Array(12 + body.length);
    c.set(be32(body.length)); c.set([...type].map((ch) => ch.charCodeAt(0)), 4); c.set(body, 8); c.set(be32(crc32(c.subarray(4, 8 + body.length))), 8 + body.length);
    return c;
  };
  const api = Object.freeze({ crc32, be32, u32, pngChunk });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPngBytes = api;
})(typeof self !== 'undefined' ? self : this);
