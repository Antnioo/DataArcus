// "Please confirm" answers remembered (B-148, 0.3): an answer to one of the Health Check's questions (the engine's
// confirm[]) is reused while the metadata the question was based on is unchanged, and the question comes back when it
// changes. Shared by the website (answers in the visitor's browser only) and the MCP (a file next to the model, written
// only through the approval gate). A record holds hashes and the answer, never DAX text or data:
//   { questionId, object, answer, evidenceSignature, at, by: 'user' }
// No network: nothing here sends or loads anything.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DataArcusConfirmMemory = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const ANSWERS = ['intended', 'mistake'];

  // SHA-256 of a text (UTF-8), in plain JavaScript: the same in the browser and in Node, and synchronous
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function utf8(s) {
    const out = [];
    for (const ch of String(s)) {
      const c = ch.codePointAt(0);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }
  function sha256(text) {
    const b = utf8(text), n = b.length;
    b.push(0x80);
    while (b.length % 64 !== 56) b.push(0);
    const bits = n * 8;
    for (let i = 7; i >= 0; i--) b.push(i > 3 ? Math.floor(bits / Math.pow(2, 8 * i)) & 255 : (bits >>> (8 * i)) & 255);
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], W = new Array(64);
    const rot = (x, r) => (x >>> r) | (x << (32 - r));
    for (let o = 0; o < b.length; o += 64) {
      for (let i = 0; i < 16; i++) W[i] = (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = rot(W[i - 15], 7) ^ rot(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = rot(W[i - 2], 17) ^ rot(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      let [a, bb, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
        const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      [a, bb, c, d, e, f, g, h].forEach((x, i) => { H[i] = (H[i] + x) | 0; });
    }
    return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }

  const text = (x) => (Array.isArray(x) ? x.join('\n') : x == null ? '' : String(x));
  const lc = (s) => String(s == null ? '' : s).toLowerCase();
  // the measure a question is about ("[Name]"): measure names are unique in a model
  function measureOf(q, rawTables) {
    const name = String(q.obj || '').replace(/^\[|\]$/g, '');
    for (const t of rawTables || []) for (const m of t.measures || []) if (lc(m.name) === lc(name)) return { table: t.name, m };
    return null;
  }
  const columnType = (rawTables, table, column) => { const t = (rawTables || []).find((x) => lc(x.name) === lc(table)), c = t && (t.columns || []).find((x) => lc(x.name) === lc(column)); return c ? String(c.dataType || 'unknown') : 'missing'; };

  /** The evidence signature of a question: a SHA-256 of the metadata it was based on. A measure's question: its id and
   *  object, a hash of its DAX piece, the measure's DAX text hash, format string, table and measure names. A
   *  relationship's: its four columns, the candidate column and their types. The texts are hashed, never kept. */
  function signature(q, rawTables) {
    let parts;
    if (q.relationship) {
      const r = q.relationship;
      parts = ['rel', q.id, q.obj, r.fromTable, r.fromColumn, r.toTable, r.toColumn, r.candidateColumn,
        columnType(rawTables, r.fromTable, r.fromColumn), columnType(rawTables, r.toTable, r.toColumn), columnType(rawTables, r.fromTable, r.candidateColumn)];
    } else {
      const hit = measureOf(q, rawTables);
      parts = ['measure', q.id, q.obj, sha256(text(q.evidence)), hit ? sha256(text(hit.m.expression)) : 'missing', hit ? text(hit.m.formatString) : '', hit ? hit.table : '', hit ? hit.m.name : ''];
    }
    return sha256(JSON.stringify(['b148-v1'].concat(parts)));
  }

  /** The model's fingerprint, where the browser keeps its answers: its table names (a DAX change keeps the model). */
  function fingerprint(rawTables) {
    return sha256(JSON.stringify(['b148-model-v1'].concat((rawTables || []).map((t) => String(t.name)).sort())));
  }

  /** A new answer record for a question. answer: 'intended' or 'mistake'; at: an ISO date (default now). */
  function record(q, answer, rawTables, at) {
    if (!ANSWERS.includes(answer)) throw new Error('An answer is "intended" or "mistake".');
    return { questionId: String(q.id), object: String(q.obj), answer, evidenceSignature: signature(q, rawTables), at: at || new Date().toISOString(), by: 'user' };
  }

  /** A record as this module writes it, nothing more (a file or the browser's storage can hold anything). */
  function valid(r) {
    return !!r && typeof r === 'object' && !Array.isArray(r) && JSON.stringify(Object.keys(r).sort()) === '["answer","at","by","evidenceSignature","object","questionId"]'
      && typeof r.questionId === 'string' && typeof r.object === 'string' && ANSWERS.includes(r.answer) && /^[0-9a-f]{64}$/.test(r.evidenceSignature)
      && typeof r.at === 'string' && r.at.length <= 40 && r.by === 'user';
  }

  /** The questions with the answers given before. ask: the questions still to ask (each with its signature);
   *  answered: [{ question, record }] whose signature matches; keep: the records still good; stale: the records no
   *  question of this model matches now (its metadata changed, or the object is gone), to drop. */
  function apply(questions, records, rawTables) {
    const recs = (records || []).filter(valid), used = new Set(), ask = [], answered = [];
    for (const q of questions || []) {
      const sig = signature(q, rawTables), i = recs.findIndex((r, k) => !used.has(k) && r.evidenceSignature === sig && r.questionId === q.id && r.object === q.obj);
      if (i >= 0) { used.add(i); answered.push({ question: Object.assign({}, q, { signature: sig }), record: recs[i] }); }
      else ask.push(Object.assign({}, q, { signature: sig }));
    }
    return { ask, answered, keep: recs.filter((r, k) => used.has(k)), stale: recs.filter((r, k) => !used.has(k)) };
  }

  // The browser's own storage, one entry per model fingerprint. Nothing leaves the browser. Every read and write is
  // guarded (a private window, blocked storage): without storage the answers last until the page is closed.
  const PREFIX = 'dataarcus-mh-answers:';
  const store = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } };
  const memory = {};
  function load(fp) {
    const s = store();
    try { const v = s ? JSON.parse(s.getItem(PREFIX + fp) || '[]') : memory[fp] || []; return Array.isArray(v) ? v.filter(valid) : []; } catch (e) { return memory[fp] || []; }
  }
  function save(fp, records) {
    const list = (records || []).filter(valid), s = store();
    memory[fp] = list;
    try { if (!s) return; if (list.length) s.setItem(PREFIX + fp, JSON.stringify(list)); else s.removeItem(PREFIX + fp); } catch (e) { /* kept in memory for this page */ }
  }
  /** Removes every answer this browser holds, for every model. */
  function forget() {
    Object.keys(memory).forEach((k) => delete memory[k]);
    const s = store();
    try { if (!s) return; const keys = []; for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k && k.startsWith(PREFIX)) keys.push(k); } keys.forEach((k) => s.removeItem(k)); } catch (e) { /* nothing stored */ }
  }

  return { ANSWERS, PREFIX, sha256, signature, fingerprint, record, valid, apply, load, save, forget };
});
