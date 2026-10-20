// "Please confirm" answers remembered (B-148, 0.3): an answer to one of the Health Check's questions (the engine's
// confirm[]) is reused while the metadata the question was based on is unchanged, and the question comes back when it
// changes. Shared by the website (answers in the visitor's browser only) and the MCP (a file next to the model, written
// only through the approval gate). A record holds hashes, the answer and its date, never a name, DAX text or data:
//   { questionHash, objectHash, answer, evidenceSignature, at, by: 'user' }
// (R5, 0.3.0: the question's id and its object are hashed too; a record written before, with them in plain text, is read
// and held hashed from then on. A stale answer is kept, not applied, until the person forgets their answers.)
// (0.3.0 J18) The terminology sheet's confirmed terms are records of their own (termRecord below): hashes, and the Arabic
// name the person approved for a field. (0.3.0 J17) The Gulf date questions' answers too (dateRecord below): hashes and
// the answer. No network: nothing here sends or loads anything.
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
   *  relationship's: its four columns, the candidate column and their types. An unrelated table's (R5): the table, the
   *  key column and the other table's key with their types; a date table's date columns. The texts are hashed, never kept. */
  function signature(q, rawTables) {
    let parts;
    if (q.table) {
      const t = q.table, raw = (rawTables || []).find((x) => lc(x.name) === lc(t.name));
      const dates = raw ? (raw.columns || []).filter((c) => String(c.dataType) === 'dateTime').map((c) => String(c.name)).sort() : ['missing'];
      parts = ['table', q.id, q.obj, t.looksLike, t.name, t.column || '', t.column ? columnType(rawTables, t.name, t.column) : '',
        t.otherTable || '', t.otherColumn || '', t.otherColumn ? columnType(rawTables, t.otherTable, t.otherColumn) : ''].concat(t.looksLike === 'date' ? dates : []);
      return sha256(JSON.stringify(['b148-table-v1'].concat(parts)));
    }
    // (0.3.0 J19) an axis question (axis-units.js): may two measures share one chart axis; both measures' DAX and
    // format strings, so a confirmation stops applying when either changes
    if (q.axis) {
      parts = ['axis', q.id, q.obj].concat(...(q.axis.measures || []).map((x) => { const hit = measureOf({ obj: x.name }, rawTables);
        return [x.table, x.name, hit && lc(hit.table) === lc(x.table) ? sha256(text(hit.m.expression)) : 'missing', hit && lc(hit.table) === lc(x.table) ? text(hit.m.formatString) : '']; }));
      return sha256(JSON.stringify(['b148-axis-v1'].concat(parts)));
    }
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

  // the question's id and its object, hashed (R5): a record names nothing of the model
  const questionHash = (id) => sha256(JSON.stringify(['b148-question', String(id)]));
  const objectHash = (obj) => sha256(JSON.stringify(['b148-object', String(obj)]));

  /** A new answer record for a question. answer: 'intended' or 'mistake'; at: an ISO date (default now). */
  function record(q, answer, rawTables, at) {
    if (!ANSWERS.includes(answer)) throw new Error('An answer is "intended" or "mistake".');
    return { questionHash: questionHash(q.id), objectHash: objectHash(q.obj), answer, evidenceSignature: signature(q, rawTables), at: at || new Date().toISOString(), by: 'user' };
  }

  const HEX = /^[0-9a-f]{64}$/;
  const keysAre = (r, k) => JSON.stringify(Object.keys(r).sort()) === JSON.stringify(k);
  /** A record as this module writes it, nothing more (a file or the browser's storage can hold anything). */
  function valid(r) {
    return !!r && typeof r === 'object' && !Array.isArray(r) && keysAre(r, ['answer', 'at', 'by', 'evidenceSignature', 'objectHash', 'questionHash'])
      && HEX.test(r.questionHash) && HEX.test(r.objectHash) && ANSWERS.includes(r.answer) && HEX.test(r.evidenceSignature)
      && typeof r.at === 'string' && r.at.length <= 40 && r.by === 'user';
  }
  /** A record written before R5 (questionId and object in plain text), as it is held now: hashed. Anything else as it is. */
  function upgrade(r) {
    if (!r || typeof r !== 'object' || Array.isArray(r) || !keysAre(r, ['answer', 'at', 'by', 'evidenceSignature', 'object', 'questionId'])
      || typeof r.questionId !== 'string' || typeof r.object !== 'string') return r;
    return { questionHash: questionHash(r.questionId), objectHash: objectHash(r.object), answer: r.answer, evidenceSignature: r.evidenceSignature, at: r.at, by: r.by };
  }

  /** The questions with the answers given before. ask: the questions still to ask (each with its signature);
   *  answered: [{ question, record }] whose signature matches; keep: the records still good; stale: the records no
   *  question of this model matches now (its metadata changed, or the object is gone): not applied, and kept until the
   *  person forgets their answers (kept(a) is both). */
  function apply(questions, records, rawTables) {
    const recs = (records || []).map(upgrade).filter(valid), used = new Set(), ask = [], answered = [];
    for (const q of questions || []) {
      const sig = signature(q, rawTables), qh = questionHash(q.id), oh = objectHash(q.obj);
      const i = recs.findIndex((r, k) => !used.has(k) && r.evidenceSignature === sig && r.questionHash === qh && r.objectHash === oh);
      if (i >= 0) { used.add(i); answered.push({ question: Object.assign({}, q, { signature: sig }), record: recs[i] }); }
      else ask.push(Object.assign({}, q, { signature: sig }));
    }
    return { ask, answered, keep: recs.filter((r, k) => used.has(k)), stale: recs.filter((r, k) => !used.has(k)) };
  }
  /** Every record an apply() result holds: the ones in use and the stale ones (nothing is dropped but by forget()). */
  const kept = (a) => a.keep.concat(a.stale);

  // ---- (0.3.0 J18, B-171) the terminology sheet's confirmed terms: the Arabic display name a person approved for one
  // field (or the model's own name they kept), reused only for the same model (modelKey, given by the caller), the same
  // field (objectKey: its table and name, hashed), the same scope (the language) and the same metadata: its kind, type
  // and description (evidenceHash) and what it is computed from (dependencyHashes: its DAX, its source column, its
  // sort-by column). A renamed field, a changed description or DAX, another model: the term is asked again. A record
  // holds hashes, the alias the person approved and its date, never the field's name, its DAX or data.
  //   { modelKey, objectKey, scope, evidenceHash, dependencyHashes, alias, decision, at, by: 'user' }
  const TERM_SCOPES = ['ar'], DECISIONS = ['approved', 'kept'];
  const termKeyOf = (key) => { const m = /^'?(.+?)'?\[(.+)\]$/.exec(String(key == null ? '' : key).trim()); return m ? { table: m[1], field: m[2] } : null; };
  const termObject = (k) => sha256(JSON.stringify(['term-object', k.table, k.field]));
  const dep = (what, v) => sha256(JSON.stringify(['term-dep-v1', what, text(v)]));
  /** The evidence of a field ("Table[Field]", its names exactly as the model has them) in the model's tables (model.bim
   *  JSON): { evidenceHash, dependencyHashes }, or null when the model has no such field. */
  function termEvidence(rawTables, key) {
    const k = termKeyOf(key); if (!k) return null;
    const t = (rawTables || []).find((x) => String(x.name) === k.table); if (!t) return null;
    const c = (t.columns || []).find((x) => String(x.name) === k.field), m = c ? null : (t.measures || []).find((x) => String(x.name) === k.field), o = c || m;
    if (!o) return null;
    const deps = [];
    if (o.expression != null) deps.push(dep('expression', o.expression));
    if (c && c.sourceColumn != null) deps.push(dep('source', c.sourceColumn));
    if (c && c.sortByColumn != null) deps.push(dep('sortBy', c.sortByColumn));
    if (!deps.length) deps.push(dep('none', ''));
    return { evidenceHash: sha256(JSON.stringify(['term-evidence-v1', k.table, k.field, c ? 'column' : 'measure', String(o.dataType || ''), text(o.description)])), dependencyHashes: deps.sort() };
  }
  /** A term record: { modelKey (64 hex), key ("Table[Field]"), scope ('ar'), evidence (termEvidence's), alias (the
   *  approved text; null when kept), decision ('approved' | 'kept'), at (ISO date, default now) }. */
  function termRecord(o) {
    const k = termKeyOf(o && o.key), ev = o && o.evidence;
    if (!k || !ev || !HEX.test(String(o.modelKey)) || !TERM_SCOPES.includes(o.scope) || !DECISIONS.includes(o.decision)) throw new Error('A term needs a model key, a field (Table[Field]) the model has, a scope and a decision.');
    const alias = o.decision === 'kept' ? null : String(o.alias == null ? '' : o.alias);
    if (alias !== null && (!alias.trim() || alias.length > 200)) throw new Error('An approved term has an alias of 1-200 characters.');
    return { modelKey: o.modelKey, objectKey: termObject(k), scope: o.scope, evidenceHash: ev.evidenceHash, dependencyHashes: ev.dependencyHashes.slice().sort(), alias, decision: o.decision, at: o.at || new Date().toISOString(), by: 'user' };
  }
  function validTerm(r) {
    return !!r && typeof r === 'object' && !Array.isArray(r) && keysAre(r, ['alias', 'at', 'by', 'decision', 'dependencyHashes', 'evidenceHash', 'modelKey', 'objectKey', 'scope'])
      && HEX.test(r.modelKey) && HEX.test(r.objectKey) && HEX.test(r.evidenceHash) && TERM_SCOPES.includes(r.scope) && DECISIONS.includes(r.decision)
      && Array.isArray(r.dependencyHashes) && r.dependencyHashes.length > 0 && r.dependencyHashes.length <= 8 && r.dependencyHashes.every((h) => HEX.test(h))
      && (r.decision === 'kept' ? r.alias === null : typeof r.alias === 'string' && r.alias.length > 0 && r.alias.length <= 200)
      && typeof r.at === 'string' && r.at.length <= 40 && r.by === 'user';
  }
  /** The confirmed term of each item ({ key, evidence }): a Map key -> record, only where a record matches the model
   *  key, the field, the scope, the evidence and every dependency; the latest record wins. */
  function applyTerms(items, records, modelKey, scope) {
    const out = new Map(), recs = (records || []).filter(validTerm);
    for (const it of items || []) {
      const k = termKeyOf(it && it.key), ev = it && it.evidence; if (!k || !ev) continue;
      const ok = termObject(k), deps = JSON.stringify(ev.dependencyHashes.slice().sort());
      for (const r of recs) if (r.modelKey === modelKey && r.scope === scope && r.objectKey === ok && r.evidenceHash === ev.evidenceHash && JSON.stringify(r.dependencyHashes) === deps) out.set(it.key, r);
    }
    return out;
  }

  // ---- (0.3.0 J17, B-170) the Gulf date questions' answers: which date the report follows, its grain, its seasonal
  // scope, the Hijri year and the Hijri-year column, as the person answered them. Reused only for the same model
  // (modelKey, given by the caller), the same question and the same metadata (evidenceHash: each field the question is
  // about, its type and sort-by column, and the relationships that start at it with their active flags). A flipped
  // relationship or a changed column: asked again. A record holds hashes and the answer (a field hashed, a grain or scope
  // word, a year the person gave), never a name or data:
  //   { modelKey, questionHash, evidenceHash, answer, at, by: 'user' }
  const DATE_QUESTIONS = ['dateRole', 'grain', 'scope', 'year', 'hijriYearColumn'];
  const DATE_ANSWER = /^(gregorian|hijri|seasonDay|all|year|\d{3,4}|field:[0-9a-f]{64})$/;
  const dateQuestion = (q) => sha256(JSON.stringify(['date-question', String(q)]));
  /** A field as a date answer holds it: hashed ("Table[Field]", its names exactly as the model has them). */
  const dateField = (key) => { const k = termKeyOf(key); return 'field:' + sha256(JSON.stringify(['date-field', k ? k.table : String(key), k ? k.field : ''])); };
  /** The evidence of a date question: a SHA-256 of each field it is about (model.bim's model: tables and relationships):
   *  its type and sort-by column, and every relationship from it with its target and active flag. */
  function dateEvidence(model, question, keys) {
    const tables = (model && model.tables) || [], rels = (model && model.relationships) || [];
    const parts = (keys || []).map(String).slice().sort().map((key) => {
      const k = termKeyOf(key), t = k && tables.find((x) => String(x.name) === k.table), c = t && (t.columns || []).find((x) => String(x.name) === k.field);
      if (!c) return [key, 'missing'];
      const from = rels.filter((r) => String(r.fromTable) === k.table && String(r.fromColumn) === k.field)
        .map((r) => [String(r.toTable), String(r.toColumn), r.isActive === false ? 'inactive' : 'active']).sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
      return [key, String(c.dataType || 'unknown'), String(c.sortByColumn || ''), from];
    });
    return sha256(JSON.stringify(['date-evidence-v1', String(question)].concat(parts)));
  }
  /** A date answer record: { modelKey (64 hex), question (one of DATE_QUESTIONS), evidence (dateEvidence's), answer
   *  (a grain or scope word, a year, or dateField's), at (ISO date, default now) }. */
  function dateRecord(o) {
    if (!o || !HEX.test(String(o.modelKey)) || !DATE_QUESTIONS.includes(o.question) || !HEX.test(String(o.evidence)) || !DATE_ANSWER.test(String(o.answer))) throw new Error('A date answer needs a model key, a question, its evidence and an answer.');
    return { modelKey: o.modelKey, questionHash: dateQuestion(o.question), evidenceHash: o.evidence, answer: String(o.answer), at: o.at || new Date().toISOString(), by: 'user' };
  }
  function validDate(r) {
    return !!r && typeof r === 'object' && !Array.isArray(r) && keysAre(r, ['answer', 'at', 'by', 'evidenceHash', 'modelKey', 'questionHash'])
      && HEX.test(r.modelKey) && HEX.test(r.questionHash) && HEX.test(r.evidenceHash) && typeof r.answer === 'string' && DATE_ANSWER.test(r.answer)
      && typeof r.at === 'string' && r.at.length <= 40 && r.by === 'user';
  }
  /** The answers given before for these questions ({ question, evidence }): a Map question -> answer, only where a
   *  record matches the model key, the question and the evidence; the latest record wins. */
  function applyDates(items, records, modelKey) {
    const out = new Map(), recs = (records || []).filter(validDate);
    for (const it of items || []) {
      if (!it || !DATE_QUESTIONS.includes(it.question)) continue;
      const qh = dateQuestion(it.question);
      for (const r of recs) if (r.modelKey === modelKey && r.questionHash === qh && r.evidenceHash === it.evidence) out.set(it.question, r.answer);
    }
    return out;
  }

  // The browser's own storage, one entry per model fingerprint. Nothing leaves the browser. Every read and write is
  // guarded (a private window, blocked storage): without storage the answers last until the page is closed.
  const PREFIX = 'dataarcus-mh-answers:';
  const store = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } };
  const memory = {};
  function load(fp) {
    const s = store();
    try { const v = s ? JSON.parse(s.getItem(PREFIX + fp) || '[]') : memory[fp] || []; return Array.isArray(v) ? v.map(upgrade).filter(valid) : []; } catch (e) { return memory[fp] || []; }
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

  return { ANSWERS, PREFIX, sha256, signature, fingerprint, record, valid, upgrade, apply, kept, load, save, forget, termEvidence, termRecord, validTerm, applyTerms,
    DATE_QUESTIONS, dateField, dateEvidence, dateRecord, validDate, applyDates };
});
