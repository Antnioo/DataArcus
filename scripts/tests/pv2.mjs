// 0.3.2 PV2 (the owner's D-1105-15 "Go"; mcp/work/PV2.md; AR3's finding, mcp/work/AR3.md and lab/rd/ar3/): the page
// preview (assets/js/page-preview.js) draws mixed Arabic and English labels in the order the report writes them. On a
// right-to-left page the writer writes each text with text-measure.js isolateLatin (U+2067 ... U+2069 round a text
// with a Latin letter); the preview took that text, removed its marks (clean(), a safety rule) and laid it out left to
// right, so 8 of AR3's 14 labels were drawn in another order. Here every order is measured in Chromium: the preview's
// own SVG, each character's box read back (getExtentOfChar), against Chromium's order of the written text in a
// right-to-left box in the same font. Made-up labels only.
//   P1..P14  AR3's 14 labels (a made-up Gulf calendar page), each in a text box and as a chart's title on an Arabic page:
//            drawn in the written order
//   G1  an English page: the shown texts carry no mark (unchanged)
//   G2  an English-only title on an Arabic page: no mark added, drawn left to right
//   G3  a name that carries its own marks (U+202E): drawn without them (clean() stays), in the order of the clean text
//   G4  a title cut with "…" on an Arabic page: the "…" inside the isolate, the text inside its box, in the written order
//   G5  the MCP's approval page (approval-view.mjs askPage, Arabic): a mixed chart title drawn in the written order
//   G6  the theme generator lab page's Arabic preview of its download: every text drawn in the written order
import { createRequire } from 'node:module';
import { visitor } from './lib.mjs';
import { askPage } from '../../mcp/lib/approval-view.mjs';

const require = createRequire(import.meta.url);
const Preview = require('../../assets/js/page-preview.js');
const Measure = require('../../assets/js/text-measure.js');
const PAGE = '/tools/power-bi-theme-generator-lab.html';

// AR3's 14 labels (lab/rd/ar3/proof.mjs LABELS), made up
const LABELS = [
  'الربع الأول 2026', 'رمضان', 'Q1 / الربع 1', '05/11/2026', '٪12', 'المبيعات حسب الشهر - Q1 2026', 'رمضان 1447 (Feb 2026)',
  'Sales YTD الإجمالي', 'الهدف 12% مقابل الفعلي 9.5%', 'عيد الفطر 20/03/2026', 'Revenue (AED) الإيرادات', 'الربع 2 - Q2',
  'الأسبوع 45 من 52', 'KPI: نسبة الإنجاز ٪87',
];
// the writer's text on an Arabic page: isolateLatin (a text with a Latin letter wrapped); the preview's reference
const written = (s) => Measure.isolateLatin(s);
const MARKS = '[\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]';

// in the page: a text's visual order as indices of its characters without marks (left to right on screen); a tie in x
// (a ligature's parts) ordered by direction. From an SVG text (getExtentOfChar) or a string in a dir="rtl" box (ranges).
const MEASURE = (MARKS_SRC) => {
  const mark = new RegExp(MARKS_SRC), ar = /[؀-ۿ]/;
  const order = (s, boxes) => {
    const map = []; let k = 0; for (const ch of s) map.push(mark.test(ch) ? -1 : k++);
    return boxes.map((b, i) => ({ i, c: b ? b.x + b.w / 2 : null, w: b ? b.w : 0 })).filter((b) => b.c != null && b.w > 0.01 && map[b.i] >= 0)
      .sort((a, b) => (Math.abs(a.c - b.c) > 0.01 ? a.c - b.c : (ar.test(s[a.i]) ? b.i - a.i : a.i - b.i))).map((b) => map[b.i]);
  };
  window.__svgOrder = (t) => { const s = t.textContent, boxes = []; for (let i = 0; i < t.getNumberOfChars(); i++) { try { const e = t.getExtentOfChar(i); boxes.push({ x: e.x, w: e.width }); } catch (err) { boxes.push(null); } } return order(s, boxes); };
  window.__rtlOrder = (s, font, px, weight) => {
    const d = document.createElement('div'); d.dir = 'rtl'; d.style.cssText = `font-family:${font};font-size:${px}px;font-weight:${weight};white-space:pre;display:inline-block;position:absolute;top:0`;
    d.textContent = s; document.body.appendChild(d);
    const node = d.firstChild, boxes = [];
    for (let i = 0; i < s.length; i++) { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1); const b = r.getBoundingClientRect(); boxes.push({ x: b.x, w: b.width }); }
    d.remove(); return order(s, boxes);
  };
  // every drawn text of the pictures in the page: its text, its order, the written order of its clean text, its box
  window.__texts = (root) => [...root.querySelectorAll('svg text.t')].map((t) => {
    const s = t.textContent, bare = s.replace(new RegExp(MARKS_SRC, 'g'), '');
    const box = t.closest('g.v') && t.closest('g.v').querySelector('rect.box'), b = t.getBBox(), B = box ? box.getBBox() : null;
    return { s, bare, got: window.__svgOrder(t), font: t.getAttribute('font-family'), px: +t.getAttribute('font-size'), weight: t.getAttribute('font-weight') || 'normal',
      inside: B ? b.x >= B.x - 4 && b.x + b.width <= B.x + B.width + 4 : true };
  });
};
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

export default async function ({ browser, url }) {
  let checks = 0; const problems = [];
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const v = await visitor(browser, { viewport: [1400, 900] });
  // each text's written order: Chromium on isolateLatin of its clean text, right to left, in the SVG's font and size
  const withWant = (texts, wr) => v.pg.evaluate(({ texts, wr }) => texts.map((t, i) => Object.assign(t, { want: window.__rtlOrder(wr[i], t.font, t.px, t.weight) })), { texts, wr });
  const draw = async (svgs, dir) => {
    await v.pg.setContent(`<!doctype html><html dir="${dir || 'ltr'}"><head><meta charset="utf-8"></head><body style="margin:0">${svgs.join('')}</body></html>`);
    await v.pg.evaluate(MEASURE, MARKS);
    const texts = await v.pg.evaluate(() => window.__texts(document));
    return withWant(texts, texts.map((t) => written(t.bare)));
  };
  const visual = (title, i, o) => Object.assign({ type: 'textbox', x: 40, y: 10 + i * 50, w: 1200, h: 40, z: i, title, textSize: 14, textAlign: 'right' }, o || {});

  // P1..P14: each label as the writer writes it, in a text box and as a chart's title, on an Arabic page
  const boxes = LABELS.map((l, i) => visual(written(l), i));
  const charts = LABELS.map((l, i) => visual(written(l), i, { type: 'clusteredColumnChart', titleAlign: 'right', titleSize: 12, h: 48 }));
  const ar = await draw([Preview.render({ name: 'تقويم', w: 1280, h: 720, rtl: true, visuals: boxes }, { width: 1280, lang: 'ar' }),
    Preview.render({ name: 'تقويم', w: 1280, h: 720, rtl: true, visuals: charts }, { width: 1280, lang: 'ar' })], 'rtl');
  LABELS.forEach((l, i) => {
    const a = ar[i], c = ar[LABELS.length + i];
    check(a && c && a.bare === l && c.bare === l && same(a.got, a.want) && same(c.got, c.want),
      `P${i + 1} «${l}» on an Arabic page is drawn in the written order: text box ${a ? JSON.stringify(a.got) : '-'} vs ${a ? JSON.stringify(a.want) : '-'}; chart title ${c ? JSON.stringify(c.got) : '-'} vs ${c ? JSON.stringify(c.want) : '-'}`);
  });

  // G1: an English page: no mark in any shown text
  const en = await draw([Preview.render({ name: 'Calendar', w: 1280, h: 720, rtl: false, visuals: LABELS.map((l, i) => visual(l, i, { textAlign: 'left' })) }, { width: 1280, lang: 'en' })]);
  check(en.length === LABELS.length && en.every((t) => t.s === t.bare), `G1 an English page: no mark added to a shown text (${en.filter((t) => t.s !== t.bare).length} of ${en.length} with one)`);

  // G2: an English-only title on an Arabic page: no mark, drawn left to right (the same order as its characters)
  const eng = 'Revenue by Region (AED)';
  const g2 = await draw([Preview.render({ name: 'ص', w: 1280, h: 720, rtl: true, visuals: [visual(eng, 0, { type: 'clusteredBarChart', titleSize: 12, h: 200 })] }, { width: 1280, lang: 'ar' })], 'rtl');
  check(g2.length === 1 && g2[0].s === eng && same(g2[0].got, [...eng].map((x, i) => i)), `G2 an English-only title on an Arabic page: unchanged, left to right: ${JSON.stringify(g2[0] && g2[0].s)} ${JSON.stringify(g2[0] && g2[0].got)}`);

  // G3: a name carrying its own marks (U+202E, U+2066): drawn without them, in the written order of the clean text
  const marked = 'المبيعات ‮Q1 2026‬ ⁦حسب⁩ الشهر';
  const g3 = await draw([Preview.render({ name: 'ص', w: 1280, h: 720, rtl: true, visuals: [visual(marked, 0, { type: 'lineChart', titleSize: 12, h: 200 })] }, { width: 1280, lang: 'ar' })], 'rtl');
  const clean3 = 'المبيعات Q1 2026 حسب الشهر';
  check(g3.length === 1 && g3[0].bare === clean3 && !/[‪-‮⁦]/.test(g3[0].s) && same(g3[0].got, g3[0].want), `G3 a name with its own marks is drawn without them, in the written order: ${JSON.stringify(g3[0] && g3[0].s)}`);

  // G4: a title cut with "…" (one line) on an Arabic page: the "…" inside the isolate (the U+2069 last), inside its box
  const long = 'Sales YTD الإجمالي حسب المنطقة والشهر والفئة والقناة';
  const g4 = await draw([Preview.render({ name: 'ص', w: 1280, h: 720, rtl: true, visuals: [visual(written(long), 0, { type: 'clusteredColumnChart', titleWrap: false, titleSize: 12, w: 260, h: 200, x: 900 })] }, { width: 1280, lang: 'ar' })], 'rtl');
  check(g4.length === 1 && /…/.test(g4[0].s) && /…⁩$/.test(g4[0].s) && g4[0].inside && same(g4[0].got, g4[0].want), `G4 a cut title on an Arabic page keeps its "…" inside the isolate, inside its box, in the written order: ${JSON.stringify(g4[0] && g4[0].s)} inside ${g4[0] && g4[0].inside}`);

  // G5: the MCP's approval page in Arabic (askPage, as the approval window serves it): a mixed title in the written order
  const plan = { id: 'pv2-made-up', writes: [] };
  const pg5 = { name: 'المبيعات', w: 1280, h: 720, rtl: true, visuals: [visual(written('Sales YTD الإجمالي'), 0, { type: 'clusteredColumnChart', titleSize: 12, w: 600, h: 300, x: 640 }), visual(written('الربع 2 - Q2'), 1, { type: 'card', w: 300, h: 120, x: 300, y: 10 })] };
  const html5 = askPage({ plan, show: { lang: 'ar', title: 'Report', sections: [], files: [], previews: { lang: 'ar', pages: [pg5] } } });
  await v.pg.setContent(html5);
  await v.pg.evaluate(MEASURE, MARKS);
  const t5 = await v.pg.evaluate(() => window.__texts(document));
  const g5 = await withWant(t5, t5.map((t) => written(t.bare)));
  check(g5.length === 2 && g5.every((t) => same(t.got, t.want) && t.inside), `G5 the approval page (Arabic): ${g5.length} titles, each in the written order and inside its box: ${g5.map((t) => `${JSON.stringify(t.bare)} ${same(t.got, t.want)}`).join('; ')}`);

  // G6: the theme generator lab page's Arabic preview of its sample download: every text in the written order
  await v.pg.goto(`${url}${PAGE}?lang=ar`, { waitUntil: 'networkidle' });
  await v.pg.selectOption('#pbipData', 'sample');
  await v.pg.click('#pbipPreviewBtn');
  await v.pg.waitForFunction(() => { const b = document.getElementById('pbipPreview'); return b && !b.hidden && b.querySelectorAll('svg text.t').length; }, null, { timeout: 15000 }).catch(() => null);
  await v.pg.evaluate(MEASURE, MARKS);
  const t6 = await v.pg.evaluate(() => window.__texts(document.getElementById('pbipPreview')));
  const g6 = await withWant(t6, t6.map((t) => written(t.bare)));
  const off6 = g6.filter((t) => !same(t.got, t.want));
  check(g6.length >= 20 && !off6.length, `G6 the theme generator's Arabic preview: ${g6.length - off6.length} of ${g6.length} texts in the written order; off: ${off6.slice(0, 4).map((t) => JSON.stringify(t.bare)).join(', ')}`);
  if (v.errs.length) problems.push(`page errors: ${v.errs.join(' | ')}`);
  await v.ctx.close();
  return { checks, problems };
}
