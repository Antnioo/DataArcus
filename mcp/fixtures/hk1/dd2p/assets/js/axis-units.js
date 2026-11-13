/*! DataArcus axis units | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// Which measures may share one value axis (0.3.0 J19, B-172; the outside review's card C13). Finance and operations
// models hold measures that look comparable on one axis and are not: an amount next to a percentage, SAR next to AED,
// minutes next to hours. The rule, one place for every writer that puts two or more measures on a chart (the gallery's
// combo, visual-gallery.js; the native copy of a custom visual, mcp/lib/visual-meaning.mjs + visual-replace.js):
//   1. Each measure's identity from its metadata only (its format string, else its name): a dimension (currency,
//      percent, ratio, duration, count, another unit), its code (an ISO 4217 currency, a time unit) and its display
//      scale (thousands, millions). The same unit written differently gets one identity ("min", "mins", "minutes"; a
//      Gulf currency sign and its ISO code). Nothing is converted: no measure or format is changed, minutes and hours
//      stay two units, and there is no exchange rate anywhere in the code.
//   2. Two measures share an axis only when dimension, code and scale are known and the same AND the person confirmed
//      they compare (a record of the confirmation memory, confirm-memory.js; "currency" alone is not enough).
//   3. Two percentages also need a comparable denominator: the question names theirs (from the DAX text: the second
//      argument of DIVIDE, or what follows "/"), the same, different or not known.
//   4. Anything unknown, different or not yet confirmed: separate visuals. There is never a secondary axis.
// Never: a currency converted, an exchange rate inferred, equal units taken as equal meaning, axis limits from values
// (the tools never read data). Browser and Node (module.exports / window.DAAxisUnits). Pure: no files, no network.
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const FM = node ? require('./field-meaning.js') : root.DataArcusFieldMeaning;
  const Memory = node ? require('./confirm-memory.js') : root.DataArcusConfirmMemory;

  // ---- the identity of one measure ----
  // a Gulf (and a few common) currency signs to their ISO code; "$", "¥", "kr" and the named format "Currency" name no
  // one currency, so they give none (not known)
  const SIGN_ISO = [['د.إ', 'AED'], ['ر.س', 'SAR'], ['ر.ق', 'QAR'], ['د.ك', 'KWD'], ['د.ب', 'BHD'], ['ر.ع', 'OMR'], ['ج.م', 'EGP'], ['€', 'EUR'], ['£', 'GBP'], ['₹', 'INR'], ['﷼', null]];
  const ISO = new Set(FM.ISO4217);
  // time units, from a format's quoted unit or the name's words (English and Arabic); one code each
  const DURATION = [
    ['second', /^(s|sec|secs|second|seconds|ثانية|ثوان|ثواني|ثوانٍ)$/i], ['minute', /^(m|min|mins|minute|minutes|دقيقة|دقائق|دقيقه)$/i],
    ['hour', /^(h|hr|hrs|hour|hours|ساعة|ساعات|ساعه)$/i], ['day', /^(d|day|days|يوم|أيام|ايام)$/i], ['week', /^(wk|wks|week|weeks|أسبوع|أسابيع)$/i],
    ['month', /^(mo|mos|month|months|شهر|أشهر|شهور)$/i], ['year', /^(yr|yrs|year|years|سنة|سنوات|عام|أعوام)$/i]
  ];
  const durationOf = (w) => { const s = String(w || '').trim(); const d = DURATION.find(([, re]) => re.test(s)); return d ? d[0] : null; };
  // a name's words: "Avg Handle Time (min)" -> avg, handle, time, min
  const wordsOf = (n) => String(n || '').replace(/([a-z])([A-Z])/g, '$1 $2').split(/[^A-Za-z؀-ۿ]+/).filter(Boolean);
  // the display scale: trailing commas after the last digit of the format's first section (#,0, = thousands, #,0,, =
  // millions), or a quoted K / M / B (English or Arabic) after the number
  const SCALE_WORDS = [[1e3, /^(k|thousands?|ألف|آلاف|الف)$/i], [1e6, /^(m|mn|mm|millions?|مليون|ملايين)$/i], [1e9, /^(b|bn|billions?|مليار|مليارات)$/i]];
  function scaleOf(fmt) {
    const first = String(fmt || '').split(';')[0], plain = FM.unquoted(first), m = /[0#](,+)[^0#,]*$/.exec(plain);
    if (m) return Math.pow(1000, m[1].length);
    const q = (first.match(/"[^"]*"/g) || []).map((x) => x.slice(1, -1).trim());
    for (const w of q) { const hit = SCALE_WORDS.find(([, re]) => re.test(w)); if (hit) return hit[0]; }
    return 1;
  }
  const quoted = (fmt) => (String(fmt || '').split(';')[0].match(/"[^"]*"|\\./g) || []).map((x) => x.replace(/^"|"$/g, '').replace(/^\\/, '').trim()).filter(Boolean);
  function currencyOf(fmt, name) {
    const f = String(fmt || '');
    const bracket = /\[\$([A-Z]{3})\b/.exec(f); if (bracket && ISO.has(bracket[1])) return { code: bracket[1] };
    for (const q of quoted(f)) for (const w of q.split(/[\s.]+/)) if (ISO.has(w.toUpperCase())) return { code: w.toUpperCase() };
    for (const [s, code] of SIGN_ISO) if (f.includes(s)) return { code };
    if (FM.hasCurrency(f)) return { code: null };
    // the name, only when the format names no currency: "Revenue (AED)" or its last word, "Revenue AED" (never a rate's
    // name: "USD Rate"); a code inside a name ("TOP 10") is not one
    const n = String(name || ''), w = wordsOf(n), p = /\(([A-Z]{3})\)/.exec(n), last = w[w.length - 1];
    if (!FM.PCT_HARD.test(n) && !FM.NOT_PCT.test(n)) { const iso = p ? p[1] : /^[A-Z]{3}$/.test(last || '') ? last : null; if (iso && ISO.has(iso)) return { code: iso, from: 'name' }; }
    return null;
  }
  /** One measure's identity from its metadata: { dim, code, scale, known, from }. f: { name, formatString | cardFormat |
   *  fullFormat | tableFormat | pctFormat, pct, expression, agg } (a field of the picker, or a model measure). */
  function identityOf(f) {
    const x = f || {}, fmt = String(x.formatString || x.fullFormat || x.cardFormat || x.tableFormat || x.pctFormat || ''), name = String(x.name != null ? x.name : x.m != null ? x.m : x.c != null ? x.c : '');
    const scale = scaleOf(fmt), out = (dim, code, from) => ({ dim, code: code == null ? null : code, scale, known: !!dim && (code != null || dim === 'percent' || dim === 'ratio' || dim === 'count'), from });
    if (x.pct || FM.formatHasPercent(fmt)) return out('percent', '%', x.pct ? 'picker' : 'format');
    const q = quoted(fmt);
    if (q.some((w) => /^[x×]$/i.test(w)) || /[0#][xX×]\s*$/.test(FM.unquoted(fmt.split(';')[0]))) return out('ratio', '×', 'format');
    const cur = currencyOf(fmt, name);
    if (cur) return out('currency', cur.code, cur.from || 'format');
    const qd = q.map(durationOf).find(Boolean);
    if (qd) return out('duration', qd, 'format');
    const unit = q.find((w) => /[A-Za-z؀-ۿ]/.test(w) && !SCALE_WORDS.some(([, re]) => re.test(w)));
    if (unit) return out('unit', unit.toLowerCase(), 'format');
    // the name's time unit ("Handle Minutes", "Avg Time (min)", "Hours Worked"), never after "per" ("Sales per Day")
    const w = wordsOf(name), per = w.findIndex((t) => /^(per|لكل)$/i.test(t));
    const nd = (per >= 0 ? w.slice(0, per) : w).filter((t) => t.length > 1).map(durationOf).find(Boolean);
    if (nd) return out('duration', nd, 'name');
    const expr = Array.isArray(x.expression) ? x.expression.join('\n') : String(x.expression || '');
    if (FM.COUNT_EXPR.test(expr.trim()) || x.agg === 2 || x.agg === 5) return out('count', null, expr ? 'dax' : 'role');
    return { dim: null, code: null, scale, known: false, from: null };
  }

  // a percentage's denominator, from its DAX: DIVIDE ( a, b ) -> b, "a / b" -> b (spaces and case ignored); null when not found
  function denominatorOf(expr) {
    const s = (Array.isArray(expr) ? expr.join('\n') : String(expr || '')).replace(/\/\/[^\n]*|--[^\n]*/g, '');
    const d = /\bDIVIDE\s*\(/i.exec(s);
    if (d) {
      let depth = 0, args = [], cur = '';
      for (let i = d.index + d[0].length; i < s.length; i++) {
        const ch = s[i];
        if (ch === '(') depth++;
        if (ch === ')') { if (!depth) { args.push(cur); break; } depth--; }
        if (ch === ',' && !depth) { args.push(cur); cur = ''; continue; }
        cur += ch;
      }
      return args[1] ? norm(args[1]) : null;
    }
    const m = /[^/]\/\s*([^/]+)$/.exec(s.trim());
    return m ? norm(m[1]) : null;
  }
  const norm = (t) => String(t).replace(/\s+/g, '').toUpperCase() || null;

  // ---- the labels: the same token in both languages (AED, %, ×); in Arabic every Latin or digit run isolated ----
  const AR_DUR = { second: 'ثوانٍ', minute: 'دقائق', hour: 'ساعات', day: 'أيام', week: 'أسابيع', month: 'أشهر', year: 'سنوات' };
  const AR_SCALE = { 1e3: 'بالآلاف', 1e6: 'بالملايين', 1e9: 'بالمليارات' }, EN_SCALE = { 1e3: 'thousands', 1e6: 'millions', 1e9: 'billions' };
  // FSI ... PDI around every run of Latin letters, digits and unit signs, so "AED" and "1,000" keep their own direction
  const FSI = '\u2068', PDI = '\u2069';
  const isolate = (s) => String(s).replace(/[A-Za-z0-9%×$€£.,]+(?:\s+[A-Za-z0-9%×$€£.,]+)*/g, (m) => '⁨' + m + '⁩');
  function labelOf(id, lang) {
    const ar = lang === 'ar';
    if (!id || !id.dim) return null;
    let t = id.dim === 'percent' ? '%' : id.dim === 'ratio' ? '×' : id.dim === 'currency' ? id.code || (ar ? 'عملة' : 'currency')
      : id.dim === 'duration' ? (ar ? AR_DUR[id.code] : id.code + 's') : id.dim === 'count' ? (ar ? 'العدد' : 'count') : id.code;
    if (id.scale > 1) t += ar ? ' (' + AR_SCALE[id.scale] + ')' : ' (' + EN_SCALE[id.scale] + ')';
    return ar ? isolate(t) : t;
  }
  const both = (id) => ({ en: labelOf(id, 'en'), ar: labelOf(id, 'ar') });

  // ---- the question for the person, as a question of the confirmation memory ----
  // a measure for the question: { t, m } (a model measure) or { t, c } (a column); its key "T[M]"
  const keyOf = (f) => String(f.t) + '[' + String(f.m != null ? f.m : f.c) + ']';
  /** The confirmation memory's question for a pair (order does not matter): { id: 'axis-share', obj, axis: { measures } }.
   *  Its answer: 'intended' = they compare (one axis may be shared), 'mistake' = separate visuals. */
  function question(a, b) {
    const ms = [a, b].map((f) => ({ table: String(f.t), name: String(f.m != null ? f.m : f.c) })).sort((x, y) => (x.table + '\u0000' + x.name < y.table + '\u0000' + y.name ? -1 : 1));
    return { id: 'axis-share', obj: ms.map((x) => x.table + '[' + x.name + ']').join('|'), axis: { measures: ms } };
  }
  const ANSWER = { comparable: 'intended', separate: 'mistake' };
  /** A record of the person's own answer for a pair (answer: 'comparable' or 'separate'), in the memory's format. */
  const record = (a, b, answer, tables, at) => Memory.record(question(a, b), ANSWER[answer] || answer, tables, at);

  // ---- the decision ----
  // the model's own measure (format, DAX) where the tables hold it; else the field as given
  const lc = (s) => String(s == null ? '' : s).toLowerCase();
  function resolved(f, tables) {
    const t = (tables || []).find((x) => lc(x.name) === lc(f.t));
    const own = t && f.m != null ? (t.measures || []).find((x) => lc(x.name) === lc(f.m)) : t && f.c != null ? (t.columns || []).find((x) => lc(x.name) === lc(f.c)) : null;
    return own ? Object.assign({}, f, { name: own.name, formatString: own.formatString != null ? own.formatString : f.formatString, expression: own.expression != null ? own.expression : f.expression }) : f;
  }
  const say = {
    unknown: () => ({ en: 'a unit is not known from the formats: separate visuals, never a second axis', ar: 'وحدة غير معروفة من التنسيق: مخططات منفصلة، دون محور ثانوي' }),
    dims: (a, b) => ({ en: `different units (${a.en}, ${b.en}): separate visuals, never a second axis`, ar: `وحدتان مختلفتان (${a.ar}، ${b.ar}): مخططات منفصلة، دون محور ثانوي` }),
    currency: (a, b) => ({ en: `different currencies (${a.en}, ${b.en}): separate visuals; no currency is converted`, ar: `عملتان مختلفتان (${a.ar}، ${b.ar}): مخططات منفصلة، دون تحويل أي عملة` }),
    codes: (a, b) => ({ en: `different units (${a.en}, ${b.en}): separate visuals; nothing is converted`, ar: `وحدتان مختلفتان (${a.ar}، ${b.ar}): مخططات منفصلة، دون أي تحويل` }),
    scale: (a, b) => ({ en: `different display scales (${a.en}, ${b.en}): separate visuals`, ar: `مقياسا عرض مختلفان (${a.ar}، ${b.ar}): مخططات منفصلة` }),
    ask: (a, d) => ({ en: `the same unit (${a.en})${d ? `, ${d.en}` : ''}, not yet confirmed comparable by the person: separate visuals until they confirm`, ar: `الوحدة نفسها (${a.ar})${d ? `، ${d.ar}` : ''}، ولم يؤكد الشخص بعد أنهما قابلان للمقارنة: مخططات منفصلة حتى يؤكد` }),
    no: () => ({ en: 'the person said they do not compare: separate visuals', ar: 'قال الشخص إنهما غير قابلين للمقارنة: مخططات منفصلة' }),
    share: (a) => ({ en: `the same unit (${a.en}) and scale, confirmed comparable by the person: one shared axis`, ar: `الوحدة نفسها (${a.ar}) والمقياس نفسه، وأكد الشخص أنهما قابلان للمقارنة: محور واحد مشترك` })
  };
  const DEN = { same: { en: 'the same denominator', ar: 'المقام نفسه' }, differ: { en: 'different denominators', ar: 'مقامان مختلفان' }, unknown: { en: 'denominators not known', ar: 'المقامان غير معروفين' } };
  // one pair: { verdict: share | ask | separate, why, ask }
  function pair(A, B, opts) {
    const ia = identityOf(A), ib = identityOf(B), la = both(ia), lb = both(ib);
    if (!ia.known || !ib.known) return { verdict: 'separate', why: say.unknown() };
    if (ia.dim !== ib.dim) return { verdict: 'separate', why: say.dims(la, lb) };
    if (ia.code !== ib.code) return { verdict: 'separate', why: ia.dim === 'currency' ? say.currency(la, lb) : say.codes(la, lb) };
    if (ia.scale !== ib.scale) return { verdict: 'separate', why: say.scale(la, lb) };
    let den = null, kind = 'comparable';
    if (ia.dim === 'percent') { const da = denominatorOf(A.expression), db = denominatorOf(B.expression); den = !da || !db ? DEN.unknown : da === db ? DEN.same : DEN.differ; kind = 'denominator'; }
    const q = question(A, B), applied = Memory.apply([q], (opts && opts.confirmed) || [], (opts && opts.tables) || []);
    const answer = applied.answered.length ? applied.answered[0].record.answer : null;
    if (answer === 'intended') return { verdict: 'share', why: say.share(la) };
    if (answer === 'mistake') return { verdict: 'separate', why: say.no() };
    const ka = keyOf(A), kb = keyOf(B);
    return { verdict: 'ask', why: say.ask(la, den), ask: { measures: [ka, kb], unit: la, kind, denominators: den ? (den === DEN.same ? 'same' : den === DEN.differ ? 'different' : 'not known') : undefined,
      question: kind === 'denominator'
        ? { en: `${ka} and ${kb} are both percentages (${den.en}): do they mean comparable things, so they may share one axis? Answer with sharedAxes: comparable or separate.`, ar: `${FSI}${ka}${PDI} و${FSI}${kb}${PDI} نسبتان مئويتان (${den.ar}): هل معناهما قابل للمقارنة فيتشاركان محورًا واحدًا؟ الجواب في sharedAxes: comparable أو separate.` }
        : { en: `${ka} and ${kb} are both in ${la.en}: do they compare, so they may share one axis? Answer with sharedAxes: comparable or separate.`, ar: `${FSI}${ka}${PDI} و${FSI}${kb}${PDI} كلاهما بوحدة ${la.ar}: هل هما قابلان للمقارنة فيتشاركان محورًا واحدًا؟ الجواب في sharedAxes: comparable أو separate.` } } };
  }
  /** One field's identity, read from the model's own measure where the tables hold it. */
  const identityIn = (f, tables) => identityOf(resolved(f || {}, tables));
  /** The decision for measures proposed on one axis. ms: [{ t, m } | { t, c, agg }] (with formats where no tables hold
   *  them); opts: { tables (the model's: names, formatString, expression), confirmed (memory records) }.
   *  Returns { share, groups: [[index]], why: { en, ar }, splits: [{ measures, why }], ask: [question], labels: [{ en, ar }] }.
   *  Nothing in ms is changed. */
  function decide(ms, opts) {
    const o = opts || {}, list = (ms || []).filter(Boolean).map((f) => resolved(f, o.tables));
    const labels = list.map((f) => both(identityOf(f)));
    if (list.length < 2) return { share: true, groups: [list.map((f, i) => i)], why: null, splits: [], ask: [], labels };
    const P = {}, at = (i, j) => (P[i + ',' + j] = P[i + ',' + j] || pair(list[i], list[j], o));
    const groups = [];
    list.forEach((f, i) => { const g = groups.find((gr) => gr.every((j) => at(j, i).verdict === 'share')); if (g) g.push(i); else groups.push([i]); });
    const splits = [], asks = [], seen = new Set();
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      if (groups.some((g) => g.includes(i) && g.includes(j))) continue;
      const p = at(i, j), k = p.why.en;
      splits.push({ measures: [keyOf(list[i]), keyOf(list[j])], why: p.why });
      if (p.ask) asks.push(p.ask);
      if (!seen.has(k)) seen.add(k);
    }
    const share = groups.length === 1;
    const why = share ? at(0, 1).why : { en: Array.from(new Set(splits.map((s) => s.why.en))).join('; '), ar: Array.from(new Set(splits.map((s) => s.why.ar))).join('؛ ') };
    return { share, groups, why, splits, ask: asks, labels };
  }

  const api = { identityOf, identityIn, denominatorOf, scaleOf, labelOf, isolate, question, record, decide, keyOf, ANSWER };
  if (node) module.exports = api; else root.DAAxisUnits = api;
})(typeof self !== 'undefined' ? self : this);
