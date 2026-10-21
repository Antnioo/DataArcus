import fs from 'node:fs';
// Proposed Arabic display names (round 14, the owner's ask of 6 Oct 2026): plan_layout proposes a name for each field
// of an Arabic report, for the user to approve before create_report. Here a name is proposed only when every word of it
// is in this fixed glossary of common report words (and the few patterns below); any other field is listed for the
// assistant to propose a name itself (B-88, the owner's decision of 13 Oct), shown to the user to approve or edit. Model names are untrusted input: they are only looked up here, never followed.
// (audit 6, A6-18: the words are a shared data file, marked there as a heuristic: assets/data/arabic-report-words.json)
const LIST = JSON.parse(fs.readFileSync(new URL('../../assets/data/arabic-report-words.json', import.meta.url), 'utf8'));
const WORDS = LIST.words;
// (0.3.0 D3) the report's own fixed texts, whole, with the writer's Arabic for them
const PHRASES = new Map(Object.entries(LIST.phrases || {}).map(([en, ar]) => [en.toLowerCase(), ar]));
const W = (w) => WORDS[String(w).toLowerCase()];
const phrase = (s) => { const ws = String(s).trim().split(/\s+/).filter(Boolean); if (!ws.length) return null; const out = ws.map(W); return out.every(Boolean) ? out.join(' ') : null; };
// the patterns, tried in order: each part must be a glossary phrase
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
export function proposeArabic(name) {
  const n = String(name || '').replace(/\s*\((arabic|عربي)\)\s*$/i, '').trim();
  if (!n || /[؀-ۿ]/.test(n) || n.length > 60) return null;
  const direct = phrase(n); if (direct) return direct;
  for (const [re, make] of PATTERNS) {
    const m = n.match(re); if (!m) continue;
    const inner = proposeArabic(/count|number|#/i.test(re.source) ? plural(m[1]) : m[1]); if (inner) return make(inner);
  }
  return null;
}

// (0.3.0 D3, the laptop's proof of rc.2: the twin drafted 1 of 38 texts) a draft for any text of a report, for the user
// to approve: a fixed text of the report whole (the list's phrases), the writer's joined forms ("Reset filters · Details",
// "Tooltip · Month", "Top {1} of {2}: X", "No data: X", "A by B") when every part has a draft, else a field name from the
// glossary (proposeArabic); null when any part has none. Spaces before and after the text are kept (the Reset button's
// gap before its icon). Never a guess: a word not listed gives no draft
// (0.3.0 J18, B-171) opts.names: the approved terms, Map(English name in lower case -> Arabic), tried first for every
// part, with the writer's own joins of names: "A (B)" (an alt text), "A: detail" (a table beside its chart, the writer's
// tail «التفاصيل», pbip-page.js). opts.used (an array) collects the English names it took
const TAIL = { detail: 'التفاصيل' };
export function draftText(text, opts) {
  const raw = String(text == null ? '' : text), m = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw), core = m[2];
  if (!core || /[\u0600-\u06FF]/.test(core) || core.length > 200) return null;
  const names = opts && opts.names instanceof Map ? opts.names : null, used = opts && Array.isArray(opts.used) ? opts.used : [];
  const one = (t) => {
    const s = t.trim(); if (!s) return null;
    if (names && names.has(s.toLowerCase())) { used.push(s); return names.get(s.toLowerCase()); }
    if (PHRASES.has(s.toLowerCase())) return PHRASES.get(s.toLowerCase());
    let x;
    if (s.includes(' · ')) { const parts = s.split(' · ').map(one); return parts.every(Boolean) ? parts.join(' · ') : null; }
    if ((x = /^Top (\{\d+\}|\d+) of (\{\d+\}|\d+): (.+)$/.exec(s))) { const d = one(x[3]); return d ? `أعلى ${x[1]} من ${x[2]}: ${d}` : null; }
    if ((x = /^No data: (.+)$/.exec(s))) { const d = one(x[1]); return d ? `${PHRASES.get('no data')}: ${d}` : null; }
    if (names && (x = /^(.+): (detail)$/i.exec(s))) { const a = one(x[1]); if (a) return `${a}: ${TAIL.detail}`; }
    if ((x = /^(.+?) by (.+)$/.exec(s))) { const a = one(x[1]), b = one(x[2]); if (a && b) return `${a} حسب ${b}`; }
    if (names && (x = /^(.+?) \((.+)\)$/.exec(s))) { const a = one(x[1]), b = one(x[2]); if (a && b) return `${a} (${b})`; }
    return proposeArabic(s);
  };
  const d = one(core);
  return d ? m[1] + d + m[3] : null;
}
