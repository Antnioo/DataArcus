// Each page's language (0.3.2 SP20, the split of lib/check-report.mjs: B-280, B-286; mcp/work/SP20.md): pure functions,
// the reading layer's inventory (lib/read-report.mjs) and rulesInput's R in, { pages: { id: lang }, by } out. A report's
// text is untrusted input: its texts are counted here, never returned. check_report, the Arabic lens and the native copy
// read it through check-report.mjs, which re-exports pageLanguages and filledLanguages. The helpers litOf, plainObj and
// arr are check-report.mjs's (one copy): this module and check-report.mjs import each other, and neither calls the
// other's functions while it loads.
import { litOf, plainObj, arr } from './check-impact.mjs';   // (0.3.2 SP41, B-320: no longer check-report.mjs's: the cycle broken)
import { createRequire } from 'node:module';
// a literal's text, number and true or false, a column's set width: assets/js/pbir-values.js, their one home (DD1B)
const { litText } = createRequire(import.meta.url)('../../assets/js/pbir-values.js');

// ---- each page's language (0.3.1 S1: an EN-AR copy, the English pages and their hidden Arabic copies with language
// buttons, was judged all Arabic: its English pages were told to put their titles right and their Tab order right to
// left) ----
// a list of texts: 'ar' or 'he' when most of its letters are Arabic or Hebrew, 'en' when most are Latin, else null
// (counted only, never returned)
const AR_LETTERS = /[؀-ۿݐ-ݿﭐ-﻿]/g, HE_LETTERS = /[֐-׿יִ-ﭏ]/g, LAT_LETTERS = /[A-Za-z]/g;
export const langOfTexts = (list, latin) => { const l = list.join(' '), ar = (l.match(AR_LETTERS) || []).length, he = (l.match(HE_LETTERS) || []).length, lat = (l.match(LAT_LETTERS) || []).length;
  return ar > lat && ar >= he ? 'ar' : he > lat ? 'he' : latin && lat > ar + he ? 'en' : null; };
const litOfS = litText;
const plainOf = (list) => arr(list).filter((e) => plainObj(e) && !e.selector && plainObj(e.properties)).reduce((a, e) => Object.assign(a, e.properties), {});
const linkTo = (x) => { const l = plainOf((((x.json || {}).visual || {}).visualContainerObjects || {}).visualLink); return litOfS(l.type) === 'PageNavigation' ? litOfS(l.navigationSection) : null; };
const buttonText = (x) => { const es = arr((((x.json || {}).visual || {}).objects || {}).text).filter((e) => plainObj(e) && plainObj(e.properties));
  const d = es.find((e) => plainObj(e.selector) && e.selector.id === 'default') || es.find((e) => !e.selector); return d ? litOfS(d.properties.text) || '' : ''; };
const titleOf = (x) => { const t = plainOf((((x.json || {}).visual || {}).visualContainerObjects || {}).title); return typeof litOf(t.text) === 'string' ? litOfS(t.text) : null; };
/** Each page's language, told in this order: (1) a pair of page buttons going to each other's page (the language
 *  buttons of an EN-AR copy): the page whose button reads in Arabic (or Hebrew) letters is the Latin one, its counterpart
 *  the right-to-left one; (2) a page reached only from pages of one language (a tooltip or drillthrough page, a page
 *  button) takes it; (3) the page's own texts: its name and text boxes, and its visuals' titles, when they agree; (2) again; (4) else
 *  the report's language. inv: the reading layer's inventory; R: rulesInput's; fallback: the report's language.
 *  Returns { pages: { id: lang }, by: { buttons, links, texts, report } } (counts). The texts are counted, never returned. */
export function pageLanguages(inv, R, fallback) {
  const lang = {}, how = {}, set = (id, l, by) => { if (lang[id] == null && l) { lang[id] = l; how[id] = by; } };
  const ids = new Set(R.pages.map((p) => String(p.id)));
  // (1) the language buttons: reciprocal page buttons whose texts are in different scripts
  const btns = R.visuals.filter((x) => x.type === 'actionButton' && x.page).map((x) => ({ from: String(x.page.id), to: linkTo(x), text: buttonText(x) })).filter((b) => b.to && ids.has(b.to) && b.to !== b.from);
  const votes = {}, vote = (id, l) => { (votes[id] = votes[id] || new Set()).add(l); };
  btns.forEach((b) => { const back = btns.find((c) => c.from === b.to && c.to === b.from); if (!back) return;
    const mine = langOfTexts([b.text], true), theirs = langOfTexts([back.text], true);
    if (!mine || !theirs || (mine === 'en') === (theirs === 'en')) return;
    // the button names the other page's language
    vote(b.from, mine === 'en' ? theirs : 'en'); vote(b.to, mine); });
  Object.entries(votes).forEach(([id, v]) => { if (v.size === 1) set(id, [...v][0], 'buttons'); });
  // (2) the pages that link to a page (tooltip, drillthrough, page buttons): all of one known language
  const sources = {};
  R.visuals.forEach((x) => { if (!x.page) return; const vco = ((x.json || {}).visual || {}).visualContainerObjects || {};
    [linkTo(x), litOfS(plainOf(vco.visualTooltip).section), litOfS(plainOf(vco.visualLink).drillthroughSection)].forEach((to) => { if (to && ids.has(to) && to !== String(x.page.id)) (sources[to] = sources[to] || new Set()).add(String(x.page.id)); }); });
  const byLinks = () => Object.entries(sources).forEach(([id, from]) => { if (lang[id] != null) return; const ls = new Set([...from].map((f) => lang[f]));
    if (ls.size === 1 && !ls.has(undefined)) set(id, [...ls][0], 'links'); });
  byLinks();
  // (3) the page's own texts
  inv.pages.forEach((pg) => { const id = String(pg.id); if (lang[id] != null) return;
    const own = [pg.rawName].concat(pg.visuals.map((x) => x.rawText).filter((t) => typeof t === 'string'));
    const page = R.pages.find((p) => String(p.id) === id), titles = page ? page.visuals.map(titleOf).filter(Boolean) : [];
    // (its name and text boxes, and its titles, each on its own: when they disagree, as an English page name over Arabic
    // titles, the report's language stands)
    const a = langOfTexts(own, true), b = langOfTexts(titles, true);
    set(id, a && b && a !== b ? null : a || b, 'texts'); });
  byLinks();
  // (4) the report's language
  R.pages.forEach((p) => set(String(p.id), fallback, 'report'));
  const by = {}; Object.values(how).forEach((k) => { by[k] = (by[k] || 0) + 1; });
  return { pages: lang, by };
}
/** (0.3.1 SQ2) Every page's language: pageLanguages, and a page none of its signs tell takes the language most told
 *  pages have (right to left when more than half), else English. Returns { pages: { id: lang }, by } (the lens and
 *  the native copy). */
export function filledLanguages(inv, R) {
  const PL = pageLanguages(inv, R, null), told = Object.values(PL.pages), most = told.filter((l) => l === 'ar' || l === 'he').length > told.length / 2 ? 'ar' : 'en';
  const pages = Object.assign({}, PL.pages); R.pages.forEach((pg) => { if (!pages[pg.id]) pages[pg.id] = most; });
  return { pages, by: PL.by };
}
