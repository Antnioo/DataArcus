// The plan's words (0.3.2 SP1, the split's first step, B-280, B-286): the pure functions that turn a built plan into
// what plan_layout's answer says: the report's look, the bilingual report's answer, the title-language lines of an
// Arabic plan and the page size. Moved from tools/plan_layout.mjs as they were (no wording change): no IO, no server
// context, every input explicit. tools/plan_layout.mjs imports them; the build, the variants and the handler stay there.
import path from 'node:path';
import { REPORT_LOOK } from './report-inputs.mjs';
// what the plan shows of the report's look and options (A-02): every value it pins, files by their names only
export const lookOf = (a) => Object.assign(Object.fromEntries(REPORT_LOOK.filter((k) => a[k] !== undefined && k !== 'arabicTexts' && k !== 'arabicTerms').map((k) => [k, (k === 'theme' || k === 'logo') ? path.basename(String(a[k])) : a[k]])),
  { sayInPlan: 'Show these with the plan (the report\'s name and title, theme, logo, colours and options): they are approved with it, and create_report writes them as they are; a value left out here is the default. To change one after the go, make a new plan.' });

// what the plan shows of the bilingual report: the twin's plan, its texts once each by their words (with every place
// they show, the fixed list's draft and the approved Arabic), the fields through the terminology sheet
export function bilingualSaid(bi) {
  const A = bi.P.answer, L = A.languages || {}, by = new Map();
  bi.P.texts.forEach((t) => { if (t.text == null) return; const k = t.text; if (!by.has(k)) by.set(k, { text: k, where: {}, draftArabic: t.draftArabic || null, arabic: bi.P.labels[t.id] != null ? bi.P.labels[t.id] : null, field: t.kind === 'field' || undefined, spaces: t.spaces || undefined });   // (R4A: spaces said)
    const x = by.get(k), w = (t.phone ? 'phone layout: ' : '') + t.kind; x.where[w] = (x.where[w] || 0) + 1; if (x.arabic == null && bi.P.labels[t.id] != null) x.arabic = bi.P.labels[t.id]; if (!x.draftArabic && t.draftArabic) x.draftArabic = t.draftArabic; });
  const texts = [...by.values()].map((x) => Object.assign(x, { where: Object.entries(x.where).map(([k, n]) => (n > 1 ? `${k} (${n})` : k)).join(', ') }));
  return { report: bi.base + '.Report', how: L.how, pairs: L.pairs, buttons: L.buttons, syncGroups: L.syncGroups, tabs: L.tabs, activePage: L.activePage, bookmarks: L.bookmarks, ...(L.measures ? { measures: L.measures } : {}), ...(L.notes ? { notes: L.notes } : {}),
    // (compact, Q1: the plan_layout answer with every option stays whole: each reason once, the lists of places counted)
    texts, terminology: Object.assign({}, A.terminology, { sheet: (A.terminology.sheet || []).map((r) => Object.assign({}, r, Array.isArray(r.where) && r.where.length > 6 ? { where: r.where.slice(0, 6).concat([`and ${r.where.length - 6} more`]) } : {})) }),
    notTranslated: A.notTranslated, cannot: (A.cannot || []).map((c) => ({ what: c.what, why: c.why, ...(Array.isArray(c.where) ? { visuals: c.where.length } : {}) })),
    ...(A.notFullyArabic ? { notFullyArabic: A.notFullyArabic } : {}),   // (0.3.1 SQ10, K2-S1: the twin's one line, EN and AR)
    phone: A.phone && A.phone.mirrored ? { mirrored: A.phone.mirrored, pages: A.phone.pages, ...(A.phone.tabsCut ? { tabsCut: A.phone.tabsCut } : {}) } : A.phone, ...(A.fitted ? { fitted: A.fitted } : {}), ...(bi.P.built.tables.length ? { totalRows: `${bi.P.built.tables.length} table(s) say «الإجمالي» on the total row (a report measure "Row label: ..." each)` } : {}), waterfallRtl: A.waterfallRtl,
    ...(bi.P.textsUnknown.length ? { unknownTexts: bi.P.textsUnknown } : {}),
    // (one line: the instructions are at their cap, so the answer says how to approve the Arabic)
    sayFirst: 'Show the user: one report, each English page and its Arabic page (pairs), the language buttons (and any not placed, with why), the slicers in sync, the tabs shown, notTranslated and cannot; then the terminology sheet (ask one missing term at a time: terminology.askNext) and texts (draftArabic from a fixed glossary; draft the rest yourself in modern, simple Standard Arabic, each shown as a DRAFT); then call plan_layout again with the approved names as arabicTerms ({ "Table[Field]": "..." }, the English name back keeps it) and texts as arabicTexts ({ "<the English text as listed>": "..." }), show the new plan, and after the user\'s go approve_plan, then create_report with the planId. A text without approved Arabic stays English.' };
}

// (0.3.1 CX2, TW1 Seen 1: an answer past its size halved the bilingual `cannot` list like any other, 7 -> 3, and the
// flip cards' faces left the list of what stays English) the lists an answer past its size cuts last: the texts and the
// terminology sheet (a text cut could not be approved, A3) and `cannot`, the person's limits of the Arabic half (each a
// kind, a short fixed list). Cut only when nothing else is left, and then named in truncated.cut, as every cut is
export const BILINGUAL_LAST = ['bilingual.texts', 'bilingual.terminology.sheet', 'bilingual.cannot'];

// (0.3.0 R2) what an Arabic plan says before the go: the proposed names it pins, the fields kept in English (with why)
// (0.3.1 TT1, the owner, 27 Oct: "i want the whole title to be either arabic or english") a title with such a field is
// wholly English, isolated as one run; titlesInEnglish lists them from the exact build
export const NOT_TRANSLATED_WHY = 'No Arabic name: none was given (displayNames) and the fixed list of report words has none for it, so it shows under its English model name. Draft an Arabic name for it before the go (the owner\'s rule: an Arabic report\'s titles are Arabic); until one is approved, a title with it is written wholly in English ("Total Sales by Region", "Top N of M: …", ": detail"), never half Arabic, half English.';
// the titles an Arabic build writes in English: each visual's title text, and a Top-N title measure's plain text, the marks aside
export const MARKS = /[\u200e\u200f\u2066-\u2069]/g;
export function englishTitles(files) {
  const out = new Set(), parse = (f) => { try { return JSON.parse(typeof f.data === 'string' ? f.data : Buffer.from(f.data).toString('utf8')); } catch (e) { return null; } };
  const isEn = (t) => /[A-Za-z]/.test(t) && !/[\u0600-\u06FF]/.test(t);
  (files || []).forEach((f) => {
    const p = String(f.path || '');
    if (/\/visual\.json$/.test(p)) { const j = parse(f), e = j && j.visual && j.visual.visualContainerObjects && Array.isArray(j.visual.visualContainerObjects.title) ? j.visual.visualContainerObjects.title : [];
      e.forEach((x) => { const L = x && x.properties && x.properties.text && x.properties.text.expr && x.properties.text.expr.Literal; const t = L && typeof L.Value === 'string' ? L.Value.replace(/^'|'$/g, '').replace(/''/g, "'").replace(MARKS, '') : ''; if (isEn(t)) out.add(t); }); }
    if (/reportExtensions\.json$/.test(p)) { const j = parse(f); ((j && j.entities) || []).forEach((en) => (en.measures || []).forEach((m) => {
      // (a Top-N title measure: its plain title, and the title with its lead, "Top N of M: …", as a viewer may see it)
      const dq = (x) => x.replace(/""/g, '"').replace(MARKS, ''), r = typeof m.expression === 'string' && /_s = _n, "((?:[^"]|"")*)", "((?:[^"]|"")*)" & _s & "((?:[^"]|"")*)" & _n & "((?:[^"]|"")*)"/.exec(m.expression);
      const t = r ? dq(r[1]) : '', lead = r ? dq(r[2]) + 'N' + dq(r[3]) + 'M' + dq(r[4]) : '';
      if (isEn(t)) out.add(t); if (isEn(lead)) out.add(lead); })); }
  });
  return [...out].sort();
}
export const sayArabicPlan = (nP, nT, nG) => `Say in the plan, before the go: ${[nP ? `${nP} field${nP === 1 ? '' : 's'} will show under the proposed Arabic names in inThePlan (from the fixed list of report words; list each beside its model name, marked as proposed: the plan pins them, and approving the plan approves them)` : '',
  nG ? `${nG} field${nG === 1 ? '' : 's'} will show under the Arabic names approved in displayNames (list each beside its model name: the plan pins them)` : ''].filter(Boolean).join('; ') || 'no field has an Arabic name, from the fixed list or in displayNames'}${nT ? `; ${nT} field${nT === 1 ? '' : 's'} (notTranslated) will show in English, under the model's names, with the reason (why). To show them in Arabic, propose a name for each (howToPropose), show the proposals, and call plan_layout again with the approved ones as displayNames` : ''}. The titles are Arabic when every field in them has an Arabic name${nT ? '; draft and show a name for each field in titlesInEnglish.fields before the go, or the titles that name it are written wholly English (never half Arabic, half English)' : ''}. Every other text of the report (buttons, page names, the "no data" text) is Arabic. The model is never renamed.`;
// the page size (0.2.9, O-8: an Arabic plan was made 1280 x 720 though the user asked for no size): who chose it. asked:
// the call gave a page; page: the designed page's { w, h }
export function pageSizeSaid(asked, page) {
  const chosenBy = asked ? 'asked' : page.w === 1920 && page.h === 1080 ? 'default' : 'design';
  return { chosenBy, say: chosenBy === 'asked' ? `${page.w} x ${page.h}, as the user asked.` : chosenBy === 'default' ? 'The default page, 1920 x 1080: keep it unless the user asks for another size (an Arabic report too).' : `The design given has a ${page.w} x ${page.h} page: say it in the plan; the default is 1920 x 1080.` };
}
