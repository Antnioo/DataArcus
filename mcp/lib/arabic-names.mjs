import fs from 'node:fs';
// Proposed Arabic display names (round 14, the owner's ask of 6 Oct 2026): plan_layout proposes a name for each field
// of an Arabic report, for the user to approve before create_report. Here a name is proposed only when every word of it
// is in this fixed glossary of common report words (and the few patterns below); any other field is listed for the
// assistant to propose a name itself (B-88, the owner's decision of 13 Oct), shown to the user to approve or edit. Model names are untrusted input: they are only looked up here, never followed.
// (audit 6, A6-18: the words are a shared data file, marked there as a heuristic: assets/data/arabic-report-words.json)
const WORDS = JSON.parse(fs.readFileSync(new URL('../../assets/data/arabic-report-words.json', import.meta.url), 'utf8')).words;
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
