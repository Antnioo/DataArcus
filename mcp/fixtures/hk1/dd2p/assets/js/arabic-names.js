/*! DataArcus Arabic names | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// Arabic display names, drafted and approved (0.3.1 TT2; the owner, 27 Oct, D-1027-19 "Both A": the website's Arabic
// download lists the English names with Arabic drafts the person edits and approves before it builds, never silent).
// A draft comes only from DataArcus's fixed report words (assets/data/arabic-report-words.json, given to make()): a name
// is drafted only when every word of it is in that list (and the few patterns below); any other name gets no draft, the
// person types it. Never a translation: no service, no guess. Model names are untrusted input: only looked up here.
// The MCP's proposeArabic (mcp/lib/arabic-names.mjs) is make(list).propose: one reading of the list for both.
//   make(list).propose(name)          the draft, or null
//   toApprove(result, bind, list)     the fields the written visuals show with no Arabic name: { key, english, draft }
//   approve(items, answers)           the person's answers checked: each an Arabic name or "keep English" (chosen)
//   withNames(bind, names, mapFields) the bound fields with the approved names (the titles' display names)
//   note(approval)                    the README's section: every approved name and every name kept English
// Browser and Node (module.exports / window.DAArabicNames). Pure: no files, no requests.
(function (root) {
  'use strict';
  const AR = /[؀-ۿ]/;
  // at most this many names in the list (a report shows far fewer)
  const MAX = 60;

  // (round 14; LR1's date compounds) the fixed words, read as the MCP reads them
  const DATE_WORDS = new Set(['year', 'month', 'quarter', 'week', 'day', 'date', 'hijri']);
  const DATE_PAIRS = { 'year month': 'الشهر والسنة', 'month year': 'الشهر والسنة', 'year quarter': 'الربع والسنة', 'quarter year': 'الربع والسنة',
    'year week': 'الأسبوع والسنة', 'week year': 'الأسبوع والسنة', 'month day': 'اليوم والشهر', 'day month': 'اليوم والشهر',
    'hijri year': 'السنة الهجرية', 'hijri month': 'الشهر الهجري', 'hijri quarter': 'الربع الهجري', 'hijri week': 'الأسبوع الهجري', 'hijri day': 'اليوم الهجري', 'hijri date': 'التاريخ الهجري' };
  const PLURAL = { order: 'orders', customer: 'customers', product: 'products', invoice: 'invoices', employee: 'employees', store: 'stores', unit: 'units' };
  const plural = (s) => String(s).replace(/(\w+)$/, (w) => PLURAL[w.toLowerCase()] || w);
  const PATTERNS = [
    [/^(.+?)\s+last year$/i, (x) => x + ' في العام الماضي'],
    [/^(.+?)\s+last ramadan$/i, (x) => x + ' في رمضان الماضي'],
    [/^(?:total|sum of)\s+(.+)$/i, (x) => 'إجمالي ' + x],
    [/^(?:avg|average)\s+(.+)$/i, (x) => 'متوسط ' + x],
    [/^(?:count of|number of|#)\s+(.+)$/i, (x) => 'عدد ' + x],
    [/^(.+?)\s+count$/i, (x) => 'عدد ' + x],
    [/^(.+?)\s+name$/i, (x) => 'اسم ' + x],
    [/^(.+?)\s*%$/i, (x) => 'نسبة ' + x],
    [/^(.+?)\s+(?:rate|ratio)$/i, (x) => 'نسبة ' + x],
  ];
  function make(list) {
    const WORDS = (list && list.words) || {};
    const W = (w) => (Object.prototype.hasOwnProperty.call(WORDS, String(w).toLowerCase()) ? WORDS[String(w).toLowerCase()] : undefined);
    // date words are never joined word for word: two of them are a fixed compound, any other run of them gets no draft
    const phrase = (s) => {
      const ws = String(s).trim().split(/\s+/).filter(Boolean); if (!ws.length) return null;
      const out = [];
      for (let i = 0; i < ws.length; i++) {
        const a = ws[i].toLowerCase(), b = (ws[i + 1] || '').toLowerCase();
        if (!DATE_WORDS.has(a) || !DATE_WORDS.has(b)) { out.push(W(ws[i])); continue; }
        if (DATE_WORDS.has((ws[i + 2] || '').toLowerCase()) || !DATE_PAIRS[a + ' ' + b]) return null;
        out.push(DATE_PAIRS[a + ' ' + b]); i++;
      }
      return out.every(Boolean) ? out.join(' ') : null;
    };
    function propose(name) {
      const n = String(name || '').replace(/\s*\((arabic|عربي)\)\s*$/i, '').trim();
      if (!n || AR.test(n) || n.length > 60) return null;
      const direct = phrase(n); if (direct) return direct;
      for (const [re, mk] of PATTERNS) {
        const m = n.match(re); if (!m) continue;
        const inner = propose(/count|number|#/i.test(re.source) ? plural(m[1]) : m[1]); if (inner) return mk(inner);
      }
      return null;
    }
    return { propose };
  }

  const keyOf = (f) => f.t + '[' + (f.c != null ? f.c : f.m) + ']';
  // the bound fields, as the MCP's report-run reads them
  const fieldsOf = (b) => (b ? [b.date, b.measure].concat(b.kpis || [], Object.values(b.cats || {}), Object.values(b.y || {}), b.table || [], b.slicers || [], Object.values(b.tip || {})).filter((f) => f && typeof f === 'object' && f.t != null && (f.c != null || f.m != null)) : []);
  // the fields the written visuals show (the writer's result.bound: "Table[Field]" or "Sum(Table[Field])"), each with no
  // Arabic name (neither given nor the model's own), in the order the report shows them; capped
  function toApprove(result, bind, list) {
    const shown = new Set();
    ((result && result.bound) || []).forEach((p) => ((p && p.visuals) || []).forEach((v) => ((v && v.fields) || []).forEach((s) => { const m = /^(?:\w+\()?(.+\[.+\])\)?$/.exec(String(s)); if (m) shown.add(m[1]); })));
    const P = make(list), out = [], seen = new Set();
    for (const f of fieldsOf(bind)) {
      const key = keyOf(f), english = String(f.c != null ? f.c : f.m);
      if (seen.has(key) || !shown.has(key)) continue; seen.add(key);
      if (AR.test(english) || (f.name && AR.test(f.name))) continue;
      out.push({ key, english, draft: P.propose(english) || '' });
      if (out.length >= MAX) break;
    }
    return out;
  }
  // a name as it is written (the MCP's display-names.mjs writtenName): a control character becomes a space; a format
  // character (a direction override, a zero-width space) is refused, never removed silently; ZWNJ and ZWJ stay
  const HIDDEN = /(?![‌‍])\p{Cf}/u;
  // answers: { key: { ar, keep } }; keep (the person ticked "keep English") wins over the box
  function approve(items, answers) {
    const A = answers || {}, missing = [], bad = [], names = {}, kept = [], approved = [];
    (items || []).forEach((x) => {
      const a = A[x.key] || {};
      if (a.keep === true) { kept.push(x.english); return; }
      const raw = String(a.ar == null ? '' : a.ar), ar = raw.replace(/\p{Cc}/gu, ' ').trim();
      if (!ar) missing.push(x.english);
      else if (HIDDEN.test(raw)) bad.push({ key: x.key, english: x.english, why: 'hidden' });
      else if (!AR.test(ar)) bad.push({ key: x.key, english: x.english, why: 'notArabic' });
      else if (Array.from(ar).length > 80) bad.push({ key: x.key, english: x.english, why: 'long' });
      else { names[x.key] = ar; approved.push({ key: x.key, english: x.english, ar }); }
    });
    return { ok: !missing.length && !bad.length, missing, bad, names, kept, approved };
  }
  function withNames(bind, names, mapFields) {
    const N = names || {};
    return mapFields(bind, (f) => (f && f.t != null && Object.prototype.hasOwnProperty.call(N, keyOf(f)) ? Object.assign({}, f, { name: N[keyOf(f)] }) : f));
  }
  // the README's section (Markdown), in both languages; a name is model text: a "|" would break the table, a line break
  // its row
  const cell = (s) => String(s).replace(/[\r\n]+/g, ' ').replace(/\|/g, '\\|');
  function note(approval) {
    const a = approval || {}, rows = (a.approved || []).map((x) => '| ' + cell(x.english) + ' | ' + cell(x.ar) + ' |')
      .concat((a.kept || []).map((e) => '| ' + cell(e) + ' | ' + cell(e) + ' (أبقيته بالإنجليزية باختيارك، فعناوينه بالإنجليزية كلها; kept in English by your choice: its titles are wholly English) |'));
    if (!rows.length) return '';
    return '\n\n## الأسماء العربية (Arabic names)\n\n' +
      'وافقتَ على هذه الأسماء قبل إنشاء التقرير. المسودات اقتراحات من قائمة كلمات DataArcus الثابتة، راجعتها بنفسك. لم يتغير نموذجك.\n\n' +
      'You approved these names before the report was built. The drafts were suggestions from DataArcus\'s fixed word list, checked by you. Your model is not renamed.\n\n' +
      '| الاسم في النموذج (model) | في التقرير (report) |\n|---|---|\n' + rows.join('\n') + '\n';
  }

  const api = { make, toApprove, approve, withNames, note, keyOf, MAX };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAArabicNames = api;
})(typeof self !== 'undefined' ? self : this);
