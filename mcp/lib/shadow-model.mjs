// R1 prototype (20 Oct 2026, mcp/research/SEE-THE-RESULT.md, option (a)): a SHADOW of a model, to let Power BI Desktop
// draw a written report without the model's data. Not a tool and not loaded by the server: research code.
// The shadow keeps what a report binds to and what decides how Desktop draws it (tables, columns and their types,
// formats, sort-by columns, hierarchies, relationships, measures and calculated columns with their DAX), and replaces
// every row by MADE-UP rows: one Power Query partition a table, a typed #table (the owner's measured rule, 6-7 Oct:
// an untyped row set loads every column as text and every SUM fails). The model's own partitions (its sources, its
// DATATABLE and "Enter data" rows), roles, translations, shared expressions, descriptions and annotations are left out.
// The rows are deterministic (seeded by the model's names): the same model gives the same copy, so two renders of the
// same plan are the same picture. Keys match (one pool a connected key group), a date table gets a year of days and
// its year, month and day columns follow the date, every sort-by column gives one sort value per value.
// The copy is written to a temporary folder on the user's machine and opened there; nothing of it goes to the AI app.
import { createRequire } from 'node:module';

// ---- sizes (chosen, not measured: small enough for Desktop to load in a second, big enough for a chart's shape) ----
export const ROWS = { dim: 8, fact: 120, date: 365, alone: 120, max: 400 };
const YEAR = 2025, DAY = 86400000, BASE = Date.UTC(YEAR, 0, 1), TODAY = Date.UTC(YEAR, 11, 31);

// ---- the words: neutral, of mixed lengths (a long label shows where a label is cut); none is a word of the fixtures ----
const WORDS = ['Amber', 'Birch', 'Cedar Point', 'Dune', 'Ember Valley', 'Fjord', 'Granite Ridge', 'Harbor', 'Indigo', 'Juniper Coast', 'Kestrel',
  'Lumen', 'Meadow North', 'Nimbus', 'Orchard', 'Pebble Bay', 'Quartz', 'Riverside West', 'Saffron', 'Tundra', 'Upland', 'Willow Creek'];
const WORDS_AR = ['العنبر', 'الأرز', 'وادي الندى', 'الكثبان', 'المرجان', 'الفيروز', 'سهل الزيتون', 'المرفأ', 'النخيل', 'الساحل الشرقي', 'اللؤلؤ',
  'الواحة', 'المنارة', 'الربوة الخضراء', 'السوسن', 'القمة'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_AR = createRequire(import.meta.url)('../../assets/js/arabic-calendar.js').MONTHS;   // (0.3.1 SQ14) the one Arabic month list
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR = /[؀-ۿ]/;

// ---- a seeded random: FNV-1a of a name, then mulberry32 ----
const hash = (s) => { let h = 0x811c9dc5; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
const rng = (seed) => { let a = hash(seed); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
// a skewed pick (some categories much bigger than others: bars of different lengths)
const skew = (r, n) => Math.min(n - 1, Math.floor(n * Math.pow(r(), 1.4)));

// ---- types ----
const TYPES = new Set(['int64', 'double', 'decimal', 'dateTime', 'string', 'boolean']);
const M_TYPE = { int64: 'Int64.Type', double: 'number', decimal: 'Currency.Type', dateTime: 'datetime', string: 'text', boolean: 'logical' };
const low = (s) => String(s || '').toLowerCase().trim();
// a column with no type in the model (a DAX table's: Power BI works it out from the DAX), by its name; listed in `guessed`
export function guessType(name) {
  const s = low(name);
  if (/\bdate\b|\bdatetime\b|تاريخ/.test(s)) return 'dateTime';
  if (/^(is|has)\b|\bflag\b|^هل\b/.test(s)) return 'boolean';
  if (/\bname\b|اسم/.test(s)) return 'string';
  if (/\b(quarter|qtr)\b|ربع/.test(s)) return 'string';
  if (/\b(year|number|num|no|id|key|count|qty|quantity|index|order|rank|week|day|days|offset|sort|month)\b|رقم|عدد|سنة/.test(s)) return 'int64';
  if (/amount|price|cost|sales|revenue|value|rate|pct|percent|margin|ratio|%|total|budget|balance|مبلغ|قيمة|نسبة/.test(s)) return 'double';
  return 'string';
}
const isRate = (c) => /rate|ratio|pct|percent|margin|share|%|نسبة/i.test(c.name) || /%/.test(String(c.formatString || ''));
const isCode = (n) => /\b(id|code|key|sku|ref|guid)\b|رمز/.test(low(n));

// ---- a date table's columns, from the date (by name, English and Arabic); { type, of(ms) } or null ----
const ymd = (ms) => { const d = new Date(ms); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), w: d.getUTCDay() }; };
const isoWeek = (ms) => { const d = new Date(ms), day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day + 3); const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return 1 + Math.round(((d - first) / DAY - 3 + ((first.getUTCDay() + 6) % 7)) / 7); };
function derive(name, weekendFriSat) {
  const s = low(name), ar = AR.test(String(name)), MN = ar ? MONTHS_AR : MONTHS, DN = ar ? DAYS_AR : DAYS;
  const rules = [
    [/hijri|هجري/, null],
    [/ramadan|رمضان/, { type: 'boolean', of: (t) => { const x = ymd(t); return x.m === 3 && x.d <= 29; } }],   // (Ramadan 1446: 1-29 March 2025, near enough)
    [/\b(month|year)\s*start\b|start of (month|year)/, { type: 'dateTime', of: (t) => { const x = ymd(t); return /year/.test(s) && !/month/.test(s) ? Date.UTC(x.y, 0, 1) : Date.UTC(x.y, x.m - 1, 1); } }],
    [/\bday offset\b/, { type: 'int64', of: (t) => Math.round((t - TODAY) / DAY) }],
    [/\bmonth offset\b/, { type: 'int64', of: (t) => { const x = ymd(t); return x.m - 12; } }],
    [/\byear offset\b/, { type: 'int64', of: () => 0 }],
    [/\bis past\b/, { type: 'boolean', of: (t) => t < TODAY }],
    [/weekend|عطلة/, { type: 'boolean', of: (t) => { const w = ymd(t).w; return weekendFriSat ? w === 5 || w === 6 : w === 0 || w === 6; } }],
    [/\bfiscal year\b/, { type: 'string', of: (t) => 'FY' + ymd(t).y, int: (t) => ymd(t).y }],
    [/\bfiscal quarter\b/, { type: 'string', of: (t) => 'FQ' + Math.ceil(ymd(t).m / 3), int: (t) => Math.ceil(ymd(t).m / 3) }],
    [/\bfiscal month\b/, { type: 'int64', of: (t) => ymd(t).m }],
    [/\byear quarter\b/, { type: 'string', of: (t) => { const x = ymd(t); return `${x.y} Q${Math.ceil(x.m / 3)}`; }, int: (t) => { const x = ymd(t); return x.y * 10 + Math.ceil(x.m / 3); } }],
    [/\byear\s*month\s*(sort|number|key|no)\b|\byearmonth\b/, { type: 'int64', of: (t) => { const x = ymd(t); return x.y * 100 + x.m; } }],
    [/\byear\s*month\b/, { type: 'string', of: (t) => { const x = ymd(t); return `${x.y}-${String(x.m).padStart(2, '0')}`; }, int: (t) => { const x = ymd(t); return x.y * 100 + x.m; } }],
    [/\b(quarter|qtr)\b|ربع/, { type: 'string', of: (t) => 'Q' + Math.ceil(ymd(t).m / 3), int: (t) => Math.ceil(ymd(t).m / 3) }],
    [/\bmonth\s*(number|num|no|index|sort)\b|رقم الشهر/, { type: 'int64', of: (t) => ymd(t).m }],
    [/\bmonth\b.*\b(short|abbr)\b|\b(short|abbr)\b.*\bmonth\b/, { type: 'string', of: (t) => MN[ymd(t).m - 1].slice(0, 3), int: (t) => ymd(t).m }],
    [/\bmonth\b|الشهر/, { type: 'string', of: (t) => MN[ymd(t).m - 1], int: (t) => ymd(t).m }],
    [/\bday\s*of\s*(the\s*)?week\b|\bweekday\s*(number|num|no)\b|\bdow\b|رقم اليوم في الأسبوع/, { type: 'int64', of: (t) => ymd(t).w + 1 }],
    [/\bday\s*name\b|\bweekday\b|اسم اليوم/, { type: 'string', of: (t) => DN[ymd(t).w], int: (t) => ymd(t).w + 1 }],
    [/\bweek\b|أسبوع/, { type: 'int64', of: (t) => isoWeek(t) }],
    [/\bday\b|اليوم/, { type: 'int64', of: (t) => ymd(t).d }],
    [/\byear\b|السنة|العام/, { type: 'int64', of: (t) => ymd(t).y, str: (t) => String(ymd(t).y) }]
  ];
  const hit = rules.find(([re]) => re.test(s));
  return hit ? hit[1] : null;
}
// a derived rule for a column of a known type: the rule's own values when they are of that type, its number form for a
// number column, its text form for a text one; null when it can't give that type
function derivedFor(rule, type) {
  if (!rule) return null;
  if (!type || rule.type === type) return { type: rule.type, of: rule.of };
  if ((type === 'int64' || type === 'double' || type === 'decimal') && (rule.int || rule.type === 'int64')) return { type, of: rule.int || rule.of };
  if (type === 'string' && (rule.str || rule.type === 'int64')) return { type, of: rule.str || ((t) => String(rule.of(t))) };
  return null;
}

// ---- TMDL text ----
const q = (n) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(String(n)) ? String(n) : "'" + String(n).replace(/'/g, "''") + "'");
const ref = (t, c) => q(t) + '.' + q(c);
const val = (v) => { const s = String(v); return /"/.test(s) || s !== s.trim() || /^'/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const T1 = '\t', T2 = '\t\t', T3 = '\t\t\t', T4 = '\t\t\t\t';
const textOf = (e) => (Array.isArray(e) ? e.join('\n') : e == null ? '' : String(e));
const fenced = (head, expr, depth) => { const pad = '\t'.repeat(depth + 2); return [head + ' = ```', ...textOf(expr).replace(/\r/g, '').split('\n').map((l) => (l.trim() ? pad + l : '')), pad + '```']; };
// an M text literal and an identifier
const mText = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const mName = (s) => '#' + mText(s);
const mValue = (v, type) => {
  if (v == null) return 'null';
  if (type === 'dateTime') { const x = new Date(v); return `#datetime(${x.getUTCFullYear()}, ${x.getUTCMonth() + 1}, ${x.getUTCDate()}, 0, 0, 0)`; }
  if (type === 'string') return mText(v);
  if (type === 'boolean') return v ? 'true' : 'false';
  if (type === 'int64') return String(Math.round(v));
  return (Math.round(v * 1000) / 1000).toFixed(Number.isInteger(v) ? 0 : v < 1 && v > -1 ? 3 : 2).replace(/\.?0+$/, (m) => (m.startsWith('.') ? '' : m)) || '0';
};

// the DAX form's types and literals (DATATABLE)
const DAX_TYPE = { int64: 'INTEGER', double: 'DOUBLE', decimal: 'CURRENCY', dateTime: 'DATETIME', string: 'STRING', boolean: 'BOOLEAN' };
const daxText = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const daxValue = (v, type) => {
  if (v == null) return 'BLANK ()';
  if (type === 'dateTime') { const x = new Date(v); return `"${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}-${String(x.getUTCDate()).padStart(2, '0')}"`; }
  if (type === 'string') return daxText(v);
  if (type === 'boolean') return v ? 'TRUE' : 'FALSE';
  return mValue(v, type);
};
const modelOf = (tmsl) => (tmsl && (tmsl.model || tmsl)) || {};
const isFieldParameter = (t) => (t.partitions || []).length === 1 && /\bNAMEOF\s*\(/i.test(textOf(((t.partitions[0] || {}).source || {}).expression)) && ((t.partitions[0] || {}).source || {}).type === 'calculated';
const isCalcGroup = (t) => !!t.calculationGroup;

/** The shadow of a model: { files: [{ path, text }] (relative to the SemanticModel folder), tables: [{ name, rows, kept }],
 *  guessed: [{ table, column, as }], notes: [string] }. tmsl: the model's JSON as loadModel reads it (TMDL, model.bim,
 *  or a .pbit's schema). opts: { rows (ROWS overrides), form: 'm' (default: a typed Power Query #table a table; a
 *  project opens it empty until a refresh) | 'dax' (a DATATABLE a table: computed when the project opens) }. Nothing here is a value of the model. */
export function shadowModel(tmsl, opts) {
  const o = opts || {}, R = Object.assign({}, ROWS, o.rows || {}), src = modelOf(tmsl), notes = [], guessed = [], dax = o.form === 'dax';
  const tables = (src.tables || []).filter((t) => t && t.name != null);
  const kept = new Set(tables.filter((t) => isFieldParameter(t) || isCalcGroup(t)).map((t) => t.name));
  const weekendFriSat = /^ar\b/i.test(String(src.culture || '')) || tables.some((t) => AR.test(t.name));
  // the columns that hold made-up rows: every column but a calculated one (its DAX is kept), and a calculated column a
  // relationship or a sort-by needs (the keys and sort values must be ours to match)
  const rels = (src.relationships || []).filter((r) => r && !kept.has(r.fromTable) && !kept.has(r.toTable) && tables.some((t) => t.name === r.fromTable) && tables.some((t) => t.name === r.toTable));
  const needed = new Set();
  rels.forEach((r) => { needed.add(r.fromTable + '\0' + r.fromColumn); needed.add(r.toTable + '\0' + r.toColumn); });
  tables.forEach((t) => (t.columns || []).forEach((c) => { if (c.sortByColumn) { needed.add(t.name + '\0' + c.name); needed.add(t.name + '\0' + c.sortByColumn); } }));
  const plan = new Map();   // table -> { rows, cols: [{ c, type, data, derived }] }
  tables.filter((t) => !kept.has(t.name)).forEach((t) => {
    const cols = (t.columns || []).filter((c) => c && c.type !== 'rowNumber').map((c) => {
      const calc = c.type === 'calculated', data = !calc || needed.has(t.name + '\0' + c.name);
      if (calc && data) notes.push(`${t.name}[${c.name}]: a calculated column a relationship or a sort-by uses is made-up rows here, not its DAX`);
      let type = TYPES.has(c.dataType) ? c.dataType : null;
      if (!type && c.dataType && c.dataType !== 'unknown' && data) notes.push(`${t.name}[${c.name}]: type ${c.dataType} is written as text`);
      return { c, type, data, calc };
    });
    plan.set(t.name, { t, cols, rows: 0 });
  });
  // ---- the keys: one pool a connected group (union-find over the relationships) ----
  const parent = new Map(), find = (k) => { while (parent.get(k) !== k) { parent.set(k, parent.get(parent.get(k))); k = parent.get(k); } return k; };
  const node = (t, c) => { const k = t + '\0' + c; if (!parent.has(k)) parent.set(k, k); return k; };
  const unique = new Set();
  rels.forEach((r) => {
    const a = node(r.fromTable, r.fromColumn), b = node(r.toTable, r.toColumn); parent.set(find(a), find(b));
    if ((r.toCardinality || 'one') === 'one') unique.add(b);
    if (r.fromCardinality === 'one') unique.add(a);
  });
  const colOf = (k) => { const [tn, cn] = k.split('\0'), p = plan.get(tn); return p && p.cols.find((x) => x.c.name === cn); };
  const groups = new Map(); [...parent.keys()].forEach((k) => { const g = find(k); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(k); });
  // a key's type: the model's, else (no type) the type of another column of its group, else a guess
  groups.forEach((ks) => {
    const known = ks.map(colOf).find((x) => x && x.type);
    ks.map(colOf).filter((x) => x && !x.type).forEach((x) => { x.type = known ? known.type : guessType(x.c.name); x.keyGuess = true; });
  });
  // ---- each table: a date table (a unique date key, or the date table's key column), its row count ----
  plan.forEach((p) => {
    const key = p.cols.find((x) => (x.type || (x.c.dataType === 'unknown' ? guessType(x.c.name) : null)) === 'dateTime' && (unique.has(p.t.name + '\0' + x.c.name) || (low(p.t.dataCategory) === 'time' && x.c.isKey)));
    p.dateKey = key || null;
    const one = p.cols.some((x) => unique.has(p.t.name + '\0' + x.c.name)), many = p.cols.some((x) => parent.has(p.t.name + '\0' + x.c.name) && !unique.has(p.t.name + '\0' + x.c.name));
    p.rows = key ? R.date : one ? R.dim : many ? R.fact : R.alone;
  });
  // ---- the types of the rest: the model's, else from the date (a date table), else a guess by name ----
  plan.forEach((p) => p.cols.filter((x) => x.data).forEach((x) => {
    if (p.dateKey && x !== p.dateKey) { const r = derive(x.c.name, weekendFriSat), d = derivedFor(r, x.type); if (d) { x.derived = d; if (!x.type) x.type = d.type; } }
    if (!x.type) x.type = x === p.dateKey ? 'dateTime' : guessType(x.c.name);
    if ((!TYPES.has(x.c.dataType) || x.keyGuess) && !x.calc) guessed.push({ table: p.t.name, column: x.c.name, as: x.type });
  }));
  // ---- the pools of the key groups ----
  const pools = new Map();
  groups.forEach((ks, g) => {
    const cols = ks.map((k) => [k, colOf(k)]).filter(([, x]) => x && x.data), type = (cols.find(([k]) => unique.has(k)) || cols[0] || [0, { type: 'string' }])[1].type;
    const uniq = cols.filter(([k]) => unique.has(k)), sizes = uniq.map(([k]) => plan.get(k.split('\0')[0]).rows);
    const size = Math.max(R.dim, ...sizes), shared = sizes.length ? Math.min(...sizes) : R.dim, r = rng('pool\0' + g), names = cols.map(([, x]) => x.c.name).join(' ');
    const ar = cols.some(([, x]) => AR.test(x.c.name)), words = ar ? WORDS_AR : WORDS;
    const pool = Array.from({ length: size }, (z, i) => (type === 'dateTime' ? BASE + i * DAY : type === 'string' ? (isCode(names) ? `K-${String(101 + i).padStart(4, '0')}` : words[i % words.length] + (i >= words.length ? ' ' + (1 + Math.floor(i / words.length)) : ''))
      : type === 'boolean' ? i % 2 === 0 : i + 1));
    if (type === 'boolean' && sizes.some((n) => n > 2)) notes.push(`a true/false key (${names}) has two values: its "one" side keeps two rows`);
    pools.set(g, { pool, shared: type === 'boolean' ? 2 : shared, r });
  });
  // ---- the rows ----
  plan.forEach((p) => {
    const tn = p.t.name, n = p.rows;
    if (p.cols.some((x) => x.data && x.type === 'boolean' && unique.has(tn + '\0' + x.c.name))) p.rows = Math.min(p.rows, 2);
    const N = p.rows;
    // the date key first (the other columns of a date table follow it)
    const at = new Map();
    const make = (x) => {
      const k = tn + '\0' + x.c.name, r = rng('col\0' + k), ar = AR.test(x.c.name) || AR.test(tn), words = ar ? WORDS_AR : WORDS;
      if (parent.has(k)) {
        const g = pools.get(find(k));
        return unique.has(k) ? g.pool.slice(0, N) : Array.from({ length: N }, () => g.pool[skew(r, g.shared)]);
      }
      if (x.derived) { const d = at.get(p.dateKey); return d.map((t) => x.derived.of(t)); }
      if (x === p.dateKey) return Array.from({ length: N }, (z, i) => BASE + i * DAY);
      const nm = low(x.c.name);
      switch (x.type) {
        case 'dateTime': return Array.from({ length: N }, () => BASE + Math.floor(r() * 365) * DAY);
        case 'boolean': return Array.from({ length: N }, () => r() < 0.35);
        case 'int64':
          if (isCode(nm) || /\b(number|no|num)\b|رقم/.test(nm)) return Array.from({ length: N }, (z, i) => 1001 + i);
          if (/\byear\b|السنة|العام/.test(nm)) return Array.from({ length: N }, () => YEAR - (r() < 0.3 ? 1 : 0));
          return Array.from({ length: N }, () => 1 + skew(r, 60));
        case 'double': case 'decimal':
          if (isRate(x.c)) return Array.from({ length: N }, () => Math.round(r() * 1000) / 1000);
          return Array.from({ length: N }, () => Math.round(20 * Math.pow(250, r()) * 100) / 100);
        default: {
          if (isCode(nm)) return Array.from({ length: N }, (z, i) => `C-${String(1001 + i)}`);
          // a dimension's name column: one word a row; anything else: a few categories, some bigger than others
          if (N <= R.dim && /\bname\b|اسم/.test(nm)) { const off = hash(k) % words.length; return Array.from({ length: N }, (z, i) => words[(off + i) % words.length]); }
          const kk = Math.min(words.length, 3 + (hash(k) % 5)), off = hash(k + '\0o') % words.length;
          return Array.from({ length: N }, () => words[(off + skew(r, kk)) % words.length]);
        }
      }
    };
    const order = p.cols.filter((x) => x.data).sort((a, b) => (a === p.dateKey ? -1 : b === p.dateKey ? 1 : 0));
    order.forEach((x) => at.set(x, make(x)));
    // sort-by: the sort column follows the sorted one (the order a value first shows; a date table's rows are in date
    // order, so months sort by the calendar), unless it is a key or both follow the date already
    p.cols.filter((x) => x.data && x.c.sortByColumn).forEach((x) => {
      const by = p.cols.find((y) => y.c.name === x.c.sortByColumn);
      if (!by || !by.data) return;
      if (x.derived && by.derived) {
        const a = at.get(x), b = at.get(by), seen = new Map();
        if (a.every((v, i) => { const k2 = String(v); if (seen.has(k2) && seen.get(k2) !== String(b[i])) return false; seen.set(k2, String(b[i])); return true; })) return;
      }
      if (parent.has(tn + '\0' + by.c.name)) { notes.push(`${tn}[${x.c.name}] sorts by a key column (${by.c.name}): left as made`); return; }
      const a = at.get(x), first = new Map(); a.forEach((v) => { if (!first.has(String(v))) first.set(String(v), first.size); });
      const rank = (v) => first.get(String(v));
      at.set(by, a.map((v) => (by.type === 'string' ? String(rank(v) + 1).padStart(3, '0') : by.type === 'dateTime' ? BASE + rank(v) * DAY : by.type === 'boolean' ? rank(v) > 0 : rank(v) + 1)));
    });
    p.values = at;
    p.n = n;
  });
  // ---- the files ----
  const files = [], out = [];
  const used = new Set();
  const fileName = (n) => { let b = String(n).replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').replace(/[. ]+$/, '_') || '_', f = b, i = 2; while (used.has(f.toLowerCase())) f = `${b} (${i++})`; used.add(f.toLowerCase()); return f; };
  const flag = (k, v, pad, lines) => { if (v === true) lines.push(pad + k); else if (v === false) lines.push(pad + k + ': false'); };
  tables.forEach((t) => {
    const lines = ['table ' + q(t.name)];
    flag('isHidden', t.isHidden, T1, lines);
    if (t.dataCategory) lines.push(T1 + 'dataCategory: ' + val(t.dataCategory));
    if (isCalcGroup(t)) {
      lines.push('', T1 + 'calculationGroup');
      if (t.calculationGroup.precedence != null) lines.push(T2 + 'precedence: ' + t.calculationGroup.precedence);
      (t.calculationGroup.calculationItems || []).forEach((it) => { lines.push(''); lines.push(...fenced(T2 + 'calculationItem ' + q(it.name), it.expression, 2)); if (it.ordinal != null) lines.push(T3 + 'ordinal: ' + it.ordinal); if (it.formatStringDefinition) lines.push(...fenced(T3 + 'formatStringDefinition', it.formatStringDefinition.expression, 3)); });
    }
    (t.measures || []).forEach((m) => {
      lines.push('', ...fenced(T1 + 'measure ' + q(m.name), m.expression, 1));
      if (m.formatString != null) lines.push(T2 + 'formatString: ' + val(m.formatString));
      flag('isHidden', m.isHidden, T2, lines);
      if (m.displayFolder) lines.push(T2 + 'displayFolder: ' + val(m.displayFolder));
      if (m.formatStringDefinition) lines.push(...fenced(T2 + 'formatStringDefinition', m.formatStringDefinition.expression, 2));
    });
    const p = plan.get(t.name);
    (t.columns || []).filter((c) => c && c.type !== 'rowNumber').forEach((c) => {
      const x = p && p.cols.find((y) => y.c === c), type = x ? x.type : TYPES.has(c.dataType) ? c.dataType : null;
      lines.push('');
      if (x && !x.data) lines.push(...fenced(T1 + 'column ' + q(c.name), c.expression, 1));
      else lines.push(T1 + 'column ' + q(c.name));
      if (type && (!x || x.data || TYPES.has(c.dataType))) lines.push(T2 + 'dataType: ' + (x && x.data ? (M_TYPE[type] ? type : 'string') : type));
      if (c.formatString != null) lines.push(T2 + 'formatString: ' + val(c.formatString));
      flag('isHidden', c.isHidden, T2, lines);
      flag('isKey', c.isKey, T2, lines);
      if (c.dataCategory) lines.push(T2 + 'dataCategory: ' + val(c.dataCategory));
      if (c.displayFolder) lines.push(T2 + 'displayFolder: ' + val(c.displayFolder));
      if (c.summarizeBy) lines.push(T2 + 'summarizeBy: ' + c.summarizeBy);
      if (!x || x.data) lines.push(T2 + 'sourceColumn: ' + val(x ? (dax ? '[' + c.name + ']' : c.name) : c.sourceColumn != null ? c.sourceColumn : c.name));
      if (c.sortByColumn) lines.push(T2 + 'sortByColumn: ' + q(c.sortByColumn));
      if (!x) {   // (a field parameter's own settings)
        const rd = c.relatedColumnDetails; if (rd && rd.groupByColumns) { lines.push('', T2 + 'relatedColumnDetails'); rd.groupByColumns.forEach((g) => lines.push(T3 + 'groupByColumn: ' + q(g.groupingColumn))); }
        (c.extendedProperties || []).forEach((e) => lines.push('', T2 + 'extendedProperty ' + q(e.name) + ' = ' + (e.type === 'json' ? JSON.stringify(e.value) : String(e.value))));
      }
    });
    (t.hierarchies || []).forEach((h) => {
      lines.push('', T1 + 'hierarchy ' + q(h.name)); flag('isHidden', h.isHidden, T2, lines);
      (h.levels || []).slice().sort((a, b) => (+a.ordinal || 0) - (+b.ordinal || 0)).forEach((l) => lines.push('', T2 + 'level ' + q(l.name), T3 + 'column: ' + q(l.column)));
    });
    if (p && dax) {
      // the DAX form: a DATATABLE (Desktop computes it when the project opens, with no refresh; the owner's 6-7 Oct
      // measure: a DATATABLE's own types load, dates written "yyyy-mm-dd")
      const data = p.cols.filter((x) => x.data);
      const head = data.map((x) => `${daxText(x.c.name)}, ${DAX_TYPE[x.type] || 'STRING'}`).join(', ');
      const rows = Array.from({ length: p.rows }, (z, i) => '{ ' + data.map((x) => daxValue(p.values.get(x)[i], DAX_TYPE[x.type] ? x.type : 'string')).join(', ') + ' }');
      lines.push('', T1 + 'partition ' + q(t.name) + ' = calculated', T2 + 'mode: import', T2 + 'source = ```', T4 + 'DATATABLE ( ' + head + ',', T4 + '    {',
        ...rows.map((r, i) => T4 + '        ' + r + (i < rows.length - 1 ? ',' : '')), T4 + '    }', T4 + ')', T4 + '```');
      out.push({ name: t.name, rows: p.rows, kept: false });
    } else if (p) {
      const data = p.cols.filter((x) => x.data);
      const head = data.map((x) => `${mName(x.c.name)} = ${M_TYPE[x.type] || 'text'}`).join(', ');
      const rows = Array.from({ length: p.rows }, (z, i) => '{' + data.map((x) => mValue(p.values.get(x)[i], M_TYPE[x.type] ? x.type : 'string')).join(', ') + '}');
      lines.push('', T1 + 'partition ' + q(t.name) + ' = m', T2 + 'mode: import', T2 + 'source = ```', T4 + 'let', T4 + '    Source = #table(type table [' + head + '], {',
        ...rows.map((r, i) => T4 + '        ' + r + (i < rows.length - 1 ? ',' : '')), T4 + '    })', T4 + 'in', T4 + '    Source', T4 + '```');
      out.push({ name: t.name, rows: p.rows, kept: false });
    } else {
      const part = (t.partitions || [])[0] || {}, kind = isCalcGroup(t) ? 'calculationGroup' : 'calculated';
      lines.push('', T1 + 'partition ' + q(part.name || t.name) + ' = ' + kind, T2 + 'mode: import');
      if (kind === 'calculated') lines.push(...fenced(T2 + 'source', part.source.expression, 2));
      out.push({ name: t.name, rows: null, kept: isFieldParameter(t) ? 'field parameter' : 'calculation group' });
    }
    files.push({ path: `definition/tables/${fileName(t.name)}.tmdl`, text: lines.join('\n') + '\n' });
  });
  // relationships
  const rl = [];
  (src.relationships || []).filter((r) => r && tables.some((t) => t.name === r.fromTable) && tables.some((t) => t.name === r.toTable)).forEach((r, i) => {
    rl.push('relationship ' + q(r.name || `r${i + 1}`));
    if (r.isActive === false) rl.push(T1 + 'isActive: false');
    if (r.crossFilteringBehavior && r.crossFilteringBehavior !== 'oneDirection') rl.push(T1 + 'crossFilteringBehavior: ' + r.crossFilteringBehavior);
    if (r.fromCardinality && r.fromCardinality !== 'many') rl.push(T1 + 'fromCardinality: ' + r.fromCardinality);
    if (r.toCardinality && r.toCardinality !== 'one') rl.push(T1 + 'toCardinality: ' + r.toCardinality);
    rl.push(T1 + 'fromColumn: ' + ref(r.fromTable, r.fromColumn), T1 + 'toColumn: ' + ref(r.toTable, r.toColumn), '');
  });
  if (rl.length) files.push({ path: 'definition/relationships.tmdl', text: rl.join('\n') });
  const ml = ['model Model', T1 + 'culture: ' + val(src.culture || 'en-US'), T1 + 'defaultPowerBIDataSourceVersion: powerBI_V3'];
  flag('discourageImplicitMeasures', src.discourageImplicitMeasures, T1, ml);
  ml.push('', ...tables.map((t) => 'ref table ' + q(t.name)), '');
  files.unshift({ path: 'definition/model.tmdl', text: ml.join('\n') });
  const level = Math.max(1600, +((tmsl && tmsl.compatibilityLevel) || 0));
  files.unshift({ path: 'definition/database.tmdl', text: `database\n${T1}compatibilityLevel: ${level}\n` });
  files.unshift({ path: 'definition.pbism', text: JSON.stringify({ version: '4.0', settings: {} }, null, 2) + '\n' });
  // what is left out, said once
  [['roles', 'roles (row-level security: Desktop applies none while you design)'], ['perspectives', 'perspectives'], ['cultures', 'cultures (translations)'],
    ['expressions', 'expressions (shared queries and parameters: the copy reads no source)'], ['dataSources', 'dataSources'], ['functions', 'functions (DAX user-defined functions)']].forEach(([k, why]) => {
    if ((src[k] || []).length) notes.push(`left out: ${(src[k] || []).length} ${why}`);
  });
  if (tables.some((t) => (t.columns || []).some((c) => c.description) || (t.measures || []).some((m) => m.description) || t.description)) notes.push('left out: descriptions');
  return { files, tables: out, guessed, notes };
}

/** The project the laptop opens: { files: [{ path, text } | { path, data }] }: `<name>.pbip`, the shadow model in
 *  `<name>.SemanticModel/`, and the written report's files (report: [{ path, data }], paths inside the .Report folder)
 *  in `<name>.Report/`, every one as it is but definition.pbir, which points at the shadow model. */
export function shadowProject(tmsl, opts) {
  const o = opts || {}, name = String(o.name || 'Shadow').replace(/[\\/:*?"<>|.\u0000-\u001F]/g, '_'), sh = shadowModel(tmsl, o);
  const files = [{ path: name + '.pbip', text: JSON.stringify({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: name + '.Report' } }], settings: { enableAutoRecovery: false } }, null, 2) + '\n' }];
  sh.files.forEach((f) => files.push({ path: `${name}.SemanticModel/${f.path}`, text: f.text }));
  const pbir = { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json', version: '4.0', datasetReference: { byPath: { path: `../${name}.SemanticModel` } } };
  (o.report || []).forEach((f) => {
    const p = String(f.path).replace(/\\/g, '/');
    if (/(^|\/)\.\.(\/|$)|^\//.test(p)) throw new Error('a report path leaves its folder: ' + p);
    files.push(p === 'definition.pbir' ? { path: `${name}.Report/definition.pbir`, text: JSON.stringify(pbir, null, 2) + '\n' } : { path: `${name}.Report/${p}`, data: f.data });
  });
  if (o.report && !o.report.some((f) => String(f.path) === 'definition.pbir')) files.push({ path: `${name}.Report/definition.pbir`, text: JSON.stringify(pbir, null, 2) + '\n' });
  return { files, tables: sh.tables, guessed: sh.guessed, notes: sh.notes };
}

