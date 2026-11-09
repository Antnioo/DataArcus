/* DataArcus model-file (0.3.2 DD2D): reading a Power BI model file's bytes, the parts every reader shares. Two
 * answers, each in one place (the owner, D-1104-12 and D-1016-01):
 *   decodeText(u8)  a file's bytes (a Uint8Array or a Buffer) -> its text. Power BI writes some files as UTF-16LE,
 *                   others as UTF-8, with a byte order mark or none: FF FE is UTF-16LE (the mark dropped), EF BB BF is
 *                   UTF-8 (the mark dropped), a zero second byte is UTF-16LE without a mark, anything else UTF-8.
 *   LIMITS          the sizes (bytes) and the count over which a model file or a part of it is refused before it is
 *                   read: model (a model.bim or DataModelSchema), entry (one other part or TMDL file), total (the parts
 *                   read, together), file (a whole .pbit), entries (a ZIP directory's count). Frozen. Why these numbers:
 *                   mcp/lib/model.mjs, above PBIT_LIMITS (what real templates hold).
 * Pure: nothing is read, written or kept. Read by mcp/lib/model.mjs (decode, PBIT_LIMITS), the Model Health Check's
 * worker (model-health-worker.js) and the website's model import (model-import-browser.js).
 * Browser, worker and Node (module.exports / window.DAModelFile / self.DAModelFile). */
(function (root) {
  'use strict';
  function decodeText(u8) {
    if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8.subarray(2));
    if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) return new TextDecoder('utf-8').decode(u8.subarray(3));
    if (u8.length >= 2 && u8[1] === 0x00) return new TextDecoder('utf-16le').decode(u8);
    return new TextDecoder('utf-8').decode(u8);
  }
  const MB = 1024 * 1024;
  const LIMITS = Object.freeze({ model: 64 * MB, entry: 32 * MB, total: 128 * MB, file: 300 * MB, entries: 20000 });
  const api = Object.freeze({ decodeText, LIMITS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAModelFile = api;
})(typeof self !== 'undefined' ? self : this);
