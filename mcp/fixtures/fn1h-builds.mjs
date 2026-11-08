// FN1H's report builds (mcp/work/FN1H.md): hand-placed pages of every visual kind on made-up models, made by a seeded
// generator and written by the shared writer (assets/js/pbip-export.js build, as the website and the MCP call it), so
// a pin over every written file reaches each part of pbip-visuals.js's visual: the header's title and logo, text boxes,
// cards, charts and tables, their story titles (Top N, the detail word, English and Arabic), subtitles, fitted titles,
// the "No data" measure and the panel behind a table. Made-up names only.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Px = require('../../assets/js/pbip-export.js'), E = require('../../assets/js/design-engine.js');

// a small seeded generator (mulberry32): the same builds on every run
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const T = 'Sales', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x, t) => Object.assign({ t: t || T, c }, x || {});
const NAMES = {
  en: { m: ['Total Sales', 'Orders', 'Total Sales Amount Including Every Regional Adjustment', 'Margin %', 'Ret\turns'], c: ['City', 'Channel', 'Segment', 'Product Category Long Name', 'Store'] },
  ar: { m: ['إجمالي المبيعات', 'الطلبات', 'إجمالي المبيعات بعد كل التعديلات الإقليمية والخصومات', 'الهامش', 'المرتجعات'], c: ['المدينة', 'القناة', 'الشريحة', 'فئة المنتج الطويلة', 'المتجر'] }
};
const KINDS = ['kpi', 'card', 'bar', 'column', 'line', 'donut', 'table', 'matrix', 'gauge', 'funnel', 'treemap', 'map', 'text', 'bar', 'column', 'table'];

// one build's inputs: a language, a page, its slots and the options; the bind names the model's fields
function caseOf(r, i) {
  const pick = (a) => a[Math.floor(r() * a.length)], lang = r() < 0.4 ? 'ar' : 'en', N = NAMES[r() < 0.15 ? (lang === 'ar' ? 'en' : 'ar') : lang];
  const [w, h] = pick([[1280, 720], [1920, 1080], [1280, 720], [960, 540]]);
  const ms = N.m.map((m, k) => M(m, k === 3 ? { pct: true, pctFormat: '0.0%' } : k === 1 ? { wholeFormat: '#,0' } : {}));
  const cs = N.c.map((c) => C(c));
  const bind = { kpis: [ms[0], ms[1], ms[3], ms[2]].slice(0, 2 + Math.floor(r() * 3)), measure: pick([ms[0], ms[2], ms[4], ms[0]]), date: C(lang === 'ar' ? 'اسم الشهر' : 'Month Name', { sortBy: { t: 'Calendar', c: 'Month Number' } }, 'Calendar'),
    cats: { bar: pick(cs), column: pick(cs), donut: pick(cs), funnel: cs[2], treemap: cs[3], map: cs[0] }, y: { funnel: ms[1], gauge: ms[3] }, catPool: cs.slice(0, 4),
    table: [pick(cs), pick([ms[0], ms[2]]), ms[1], ms[3]].slice(0, 2 + Math.floor(r() * 3)), slicers: [cs[0], cs[1], lang === 'ar' ? null : cs[2]], tip: { card: ms[0], cat: cs[2], y: ms[1], date: C('Month Name', {}, 'Calendar') } };
  const rtl = lang === 'ar', slots = [];
  if (r() < 0.8) { const tw = Math.round(w * (0.2 + r() * 0.3)), th = Math.round(h * (0.05 + r() * 0.06)); slots.push({ kind: 'title', x: rtl ? w - 24 - tw : 24, y: 12, w: tw, h: th }); if (r() < 0.85) slots.push({ kind: 'logo', x: rtl ? 24 : w - 24 - 120, y: 12, w: 120, h: th }); }
  const top = Math.round(h * 0.13), cols = 2 + Math.floor(r() * 3), rows = 2 + Math.floor(r() * 2), gw = Math.floor((w - 48) / cols), gh = Math.floor((h - top - 16) / rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { if (r() < 0.15) continue; const kind = pick(KINDS), span = x < cols - 1 && r() < 0.25 ? 2 : 1;
    const s = { kind, x: 24 + x * gw, y: top + y * gh, w: gw * span - 12, h: gh - 12 };
    if (r() < 0.35) s.title = pick([lang === 'ar' ? 'ملاحظات' : 'Notes', 'Margin gauge', lang === 'ar' ? 'تفاصيل المبيعات' : 'Sales detail', 'mix']);
    if (kind === 'text' && r() < 0.6) s.text = lang === 'ar' ? 'ارتفعت المبيعات في الشمال.' : 'Sales rose in the north.';
    if ((kind === 'bar' || kind === 'column') && r() < 0.3) s.topN = 3 + Math.floor(r() * 5);
    if (r() < 0.2) s.role = pick(['mix', 'trend', 'detail']);
    slots.push(s); if (span === 2) x++; }
  const o = { lang, pages: [{ name: rtl ? 'نظرة عامة' : 'Overview', page: { w, h }, slots, panel: null, hand: true, png: new Uint8Array([3]) }] };
  if (r() < 0.3) o.logo = { ext: pick(['png', 'jpg']), bytes: new Uint8Array([9, 9, i & 255]) };
  if (r() < 0.25) o.logoPlaceholder = false;
  if (r() < 0.3) o.noDataMessage = false;
  if (r() < 0.3) o.subtitles = { mix: lang === 'ar' ? 'المنتجات حسب المبيعات' : 'Products by sales', 'Margin gauge': 'Against the target', trend: 'Over time' };
  if (rtl && r() < 0.6) o.chartAxes = 'mirrored';
  if (r() < 0.25) o.kpiValues = 'full';
  if (r() < 0.2) o.transparent = true;
  if (r() < 0.3) o.title = pick(['A very long report title for the header that goes on and on', 'تقرير المبيعات الشهري المفصل لكل المناطق', 'Sales']);
  return { bind, o };
}

// the build the way the MCP calls the writer on a user's model (test-0.3.2-sp28.mjs's hand-placed pages)
function buildOf({ bind, o }) {
  const lang = o.lang, d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma';
  if (o.transparent) d.layout = Object.assign({}, d.layout, { transparent: true });
  E.repairState(d);
  const extra = Object.assign({}, o); ['lang', 'pages', 'transparent'].forEach((k) => delete extra[k]);
  return Px.build(Object.assign({ name: 'FN1H', title: 'FN1H report', pageName: o.pages[0].name, lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang),
    sample: false, model: { byPath: 'M.SemanticModel' }, bind, texts: E.REPORT_TEXTS[lang], pages: o.pages }, extra));
}

/** The seeded builds: [name, () => the writer's result]. */
export const BUILDS = (n = 120, seed = 20261108) => { const r = rng(seed); return Array.from({ length: n }, (_, i) => { const c = caseOf(r, i); return ['G' + (i + 1), () => buildOf(c)]; }); };
