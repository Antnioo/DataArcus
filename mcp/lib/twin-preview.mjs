// The Arabic twin, step 7: its pages drawn on the approval page, from the plan's own build (0.3.1 V1).
// (0.3.1 S9: moved out of lib/arabic-twin.mjs as it was, no change of behaviour; arabic-twin.mjs re-exports what others import)
import { json, isObj } from './twin-read.mjs';
import { glassPreviewUrl } from './glass-picture.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

/** (0.3.1 V1, the owner, 25 Oct: "in the approval page I couldn't find the preview sketch") the twin's pages as the
 *  approval page draws them: the shared renderer's pages (assets/js/page-preview.js fromFiles, as the report's preview),
 *  read from the exact files the plan keeps and writeTwin writes (0.3.1 K2: kept, twinTree's files, or the bilingual report's
 *  exact files; paths from the project folder). A page hidden in the tabs is drawn too (the copy hides one language);
 *  tooltip pages are not, as on the report's page. Each Arabic page is drawn right to left (a page kept left to right for
 *  its picture stays so), the copy's English pages left to right. From the plan only: types, positions, sizes, titles,
 *  field names, the theme's colours; never a value.
 *  Returns { lang: 'ar', pages, pairs? ([[english, arabic]] indexes into pages, the copy's) } or null. */
export function twinPreview(P, kept) {
  // (the renderer is loaded here, not at the top, to keep this block apart from the lines the twin's writers change)
  const Preview = require('../../assets/js/page-preview.js');
  try {
    const { R } = P, PJ = 'definition/pages/pages.json', files = [];
    const shown = (rel, data) => { if (!/\/page\.json$/.test(rel)) return data; try { const j = JSON.parse(typeof data === 'string' ? data : data.toString('utf8')); if (isObj(j) && j.visibility === 'HiddenInViewMode') { delete j.visibility; return json(j); } } catch (e) { /* not JSON: as it is */ } return data; };
    // (0.3.1 K2) the exact files the plan keeps and the write writes: the pages drawn are those bytes
    const pre = P.outBase + '.Report/';
    if (!Array.isArray(kept)) return null;
    kept.filter((f) => f.path.startsWith(pre)).map((f) => ({ rel: f.path.slice(pre.length), data: f.data })).filter((f) => /^definition\/(pages\/|reportExtensions\.json$)/.test(f.rel)).forEach((f) => files.push({ path: f.rel, data: shown(f.rel, f.data) }));
    // (0.3.1 GD2) the pages' pictures (the Arabic pages' flipped), so a glass page is drawn as written
    kept.filter((f) => f.path.startsWith(pre + 'StaticResources/RegisteredResources/') && /\.png$/i.test(f.path) && f.data && typeof f.data !== 'string').forEach((f) => files.push({ path: f.path.slice(pre.length), data: f.data }));
    if (!files.some((f) => f.path === PJ)) files.push({ path: PJ, data: json({ pageOrder: R.pages.map((pg) => String(pg.id)) }) });
    if (R.theme) files.push({ path: 'StaticResources/RegisteredResources/theme.json', data: json(R.theme) });
    const T = R.theme || {}, pg0 = isObj(T.visualStyles) && isObj(T.visualStyles.page) && isObj(T.visualStyles.page['*']) && Array.isArray(T.visualStyles.page['*'].background) ? T.visualStyles.page['*'].background[0] : null;
    const colors = { background: pg0 && pg0.color && pg0.color.solid ? pg0.color.solid.color : undefined, card: T.background, ink: T.foreground, accent: Array.isArray(T.dataColors) ? T.dataColors[0] : undefined };
    const pages = Preview.fromFiles(files, { colors, picture: (bytes) => glassPreviewUrl(bytes) });
    // which pages are Arabic: the twin's all (but those kept left to right), the copy's its pairs' Arabic pages
    const ltrIds = new Set(R.pages.filter((pg) => P.keepLtr(pg)).map((pg) => String(pg.id)));
    const arIds = P.copy ? new Map(P.copy.pairs.map((x) => [String(x.arabic.id), String(x.english.id)])) : null;
    pages.forEach((p) => { p.rtl = arIds ? arIds.has(p.id) && !ltrIds.has(arIds.get(p.id)) : !ltrIds.has(p.id); });
    if (!P.copy) return { lang: 'ar', pages };
    const at = new Map(pages.map((p, i) => [p.id, i]));
    const pairs = P.copy.pairs.filter((x) => at.has(String(x.english.id)) && at.has(String(x.arabic.id))).map((x) => [at.get(String(x.english.id)), at.get(String(x.arabic.id))]);
    return { lang: 'ar', pages, pairs };
  } catch (e) { return null; }   // (a shape not expected: the approval page shows the plan without its pictures)
}
