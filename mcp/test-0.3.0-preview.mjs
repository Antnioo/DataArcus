// 0.3.0 step 1, "Preview before Approve" (the owner's go, 18 Oct 2026), written red first. The shared renderer
// assets/js/page-preview.js draws a planned page as an SVG picture from the PLAN only (visual types, positions, sizes,
// titles, field names, theme colours): never a data value, never a made-up number (grey placeholder shapes, the page
// labelled "preview"). The same drawing is the approval window's preview (test-approval.mjs, W-09..W-11) and the lab
// page's preview of its download (scripts/tests/theme-generator.mjs).
//   P-01: the engine loads in Node (and as window.DAPagePreview in the browser) with render, check, fromFiles, fromSlots
//   P-02: identical input gives identical SVG (no clock, no random)
//   P-03: every name is escaped: a title or page name can't add markup, attributes or links
//   P-04: every visual's box at its real position and size, in the page's own units (the picture is scaled as a whole)
//   P-05: each visual has its type's shape and its title; the placeholders hold no text and no number; "preview" is said
//   P-06: right to left: titles start at the right edge and bars grow from the right; positions are not mirrored again
//   P-07: the layout check's flags (overlap, cut off, too small) drawn in a calm style, with their words; none on a clean page
//   P-08: the golden test models (mcp/test-models, mcp/fixtures/health-project): the writer's planned pages, every box
//         inside the page unless flagged, deterministic, right to left for the Arabic model
//   node test-0.3.0-preview.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; msg = ((m) => () => m() + ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')')(msg); } check(ok, ok ? '' : (() => { try { return msg(); } catch (e) { return 'unexpected shape'; } })()); };

let P = null;
try { P = require('../assets/js/page-preview.js'); } catch (e) { P = null; }
chk(() => P && typeof P.render === 'function' && typeof P.check === 'function' && typeof P.fromFiles === 'function' && typeof P.fromSlots === 'function', () => 'P-01. assets/js/page-preview.js loads with render, check, fromFiles, fromSlots');
if (!P) { report(); }

// the visuals' boxes as drawn: <g class="v" data-i data-kind> with its <rect class="box" x y width height>
const boxes = (svg) => [...svg.matchAll(/<g class="v" data-i="(\d+)" data-kind="([a-z]+)"[^>]*>\s*<rect class="box" x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map((m) => ({ i: +m[1], kind: m[2], x: +m[3], y: +m[4], w: +m[5], h: +m[6] }));
const flagsOf = (svg) => [...svg.matchAll(/<g class="flag" data-i="(\d+)" data-flag="([a-z]+)"/g)].map((m) => ({ i: +m[1], kind: m[2] }));
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const near = (a, b) => Math.abs(a - b) <= 0.051;

const base = { name: 'Overview', w: 1280, h: 720, rtl: false, colors: { background: '#F4F6FA', card: '#FFFFFF', ink: '#14213D', accent: '#0F7C90' }, visuals: [
  { type: 'textbox', x: 16, y: 12, w: 600, h: 40, title: 'Sales report' },
  { type: 'cardVisual', x: 16, y: 70, w: 300, h: 96, title: 'Total Sales' },
  { type: 'lineChart', x: 16, y: 184, w: 820, h: 300, title: 'Total Sales by Month' },
  { type: 'clusteredBarChart', x: 852, y: 184, w: 412, h: 300, title: 'Total Sales by Region' },
  { type: 'clusteredColumnChart', x: 16, y: 500, w: 600, h: 204, title: 'Total Sales by Channel' },
  { type: 'tableEx', x: 632, y: 500, w: 632, h: 204, title: 'Detail' },
  { type: 'slicer', x: 640, y: 12, w: 200, h: 44, title: 'Year' },
  { type: 'donutChart', x: 340, y: 64, w: 200, h: 110, title: 'Share' }
] };

if (P) {
  // ---------- P-02: deterministic ----------
  const a = P.render(base), b = P.render(JSON.parse(JSON.stringify(base)));
  chk(() => typeof a === 'string' && a === b && /^<svg\b/.test(a) && /<\/svg>$/.test(a), () => 'P-02. identical input gives identical SVG');

  // ---------- P-03: escaping ----------
  const evil = '<script>alert(1)</script>" onload="x" & <a href="javascript:1">';
  const bad = P.render(Object.assign({}, base, { name: evil, visuals: base.visuals.map((v, i) => Object.assign({}, v, { title: i === 2 ? evil : v.title, type: i === 3 ? '"><script>x</script>' : v.type })) }));
  chk(() => !/<script/i.test(bad) && !/<a\b/i.test(bad) && !/\son[a-z]+="/i.test(bad), () => 'P-03. no markup or event attribute from a name: ' + bad.slice(0, 300));
  chk(() => bad.includes('&lt;script&gt;') && !/<foreignObject|<image|\shref="/i.test(bad), () => 'P-03. names shown as text (escaped), no foreignObject, image or link in the picture');

  // ---------- P-04: boxes ----------
  const bx = boxes(a);
  chk(() => bx.length === base.visuals.length && base.visuals.every((v, i) => { const q = bx.find((x) => x.i === i); return q && near(q.x, v.x) && near(q.y, v.y) && near(q.w, v.w) && near(q.h, v.h); }), () => `P-04. every visual's box at its position and size: ${JSON.stringify(bx)}`);
  chk(() => /viewBox="0 0 1280 720"/.test(a) && (() => { const w = +/\swidth="(\d+)"/.exec(a)[1], h = +/\sheight="(\d+)"/.exec(a)[1]; return Math.abs(w / h - 1280 / 720) < 0.01; })(), () => 'P-04. the picture is the page scaled as a whole (viewBox in page units, its shape kept)');

  // ---------- P-05: shapes, titles, no values ----------
  const kinds = bx.map((x) => x.kind).join();
  chk(() => kinds === 'text,card,line,bar,column,table,slicer,donut', () => `P-05. each visual drawn as its type: ${kinds}`);
  chk(() => ['Total Sales by Month', 'Total Sales by Region', 'Detail', 'Total Sales'].every((t) => texts(a).includes(t)), () => `P-05. the titles are shown: ${texts(a).join(' | ')}`);
  const ph = [...a.matchAll(/<g class="ph"[^>]*>([\s\S]*?)<\/g>/g)].map((m) => m[1]);
  chk(() => ph.length >= 6 && ph.every((x) => !/<text/.test(x)), () => `P-05. the placeholder shapes hold no text or number (${ph.length} placeholders)`);
  chk(() => texts(a).every((t) => !/\d/.test(t)), () => `P-05. no number anywhere in a page whose names have none: ${texts(a).join(' | ')}`);
  chk(() => texts(a).includes('preview') && texts(P.render(Object.assign({}, base, { rtl: true }), { lang: 'ar' })).includes('معاينة'), () => 'P-05. the picture says "preview" (Arabic: معاينة)');

  // ---------- P-06: right to left ----------
  const rtlPage = Object.assign({}, base, { rtl: true, visuals: base.visuals.map((v) => Object.assign({}, v, { x: base.w - v.x - v.w })) });
  const r = P.render(rtlPage, { lang: 'ar' }), rb = boxes(r);
  chk(() => rtlPage.visuals.every((v, i) => { const q = rb.find((x) => x.i === i); return q && near(q.x, v.x) && near(q.w, v.w); }), () => 'P-06. right to left: the boxes stay where the page puts them (not mirrored twice)');
  const titleAt = (svg, i) => { const g = new RegExp(`<g class="v" data-i="${i}"[\\s\\S]*?<text class="t" x="([\\d.]+)"[^>]*text-anchor="(start|end)"`).exec(svg); return g ? { x: +g[1], anchor: g[2] } : null; };
  chk(() => { const t = titleAt(r, 3), v = rtlPage.visuals[3]; return t && t.anchor === 'end' && t.x > v.x + v.w / 2; }, () => `P-06. right to left: a title ends at the box's right edge: ${JSON.stringify(titleAt(r, 3))}`);
  chk(() => { const t = titleAt(a, 3), v = base.visuals[3]; return t && t.anchor === 'start' && t.x < v.x + v.w / 2; }, () => `P-06. left to right: a title starts at the box's left edge: ${JSON.stringify(titleAt(a, 3))}`);
  const barsOf = (svg, i) => { const g = new RegExp(`<g class="v" data-i="${i}"[\\s\\S]*?<g class="ph"[^>]*>([\\s\\S]*?)</g>`).exec(svg); return g ? [...g[1].matchAll(/<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/g)].map((m) => ({ x: +m[1], w: +m[2] })) : []; };
  chk(() => { const v = rtlPage.visuals[3], bars = barsOf(r, 3); return bars.length >= 3 && bars.every((q) => near(q.x + q.w, bars[0].x + bars[0].w)) && bars[0].x + bars[0].w > v.x + v.w / 2; }, () => `P-06. right to left: the bars grow from the right: ${JSON.stringify(barsOf(r, 3))}`);
  chk(() => { const v = base.visuals[3], bars = barsOf(a, 3); return bars.length >= 3 && bars.every((q) => near(q.x, bars[0].x)) && bars[0].x < v.x + v.w / 2; }, () => `P-06. left to right: the bars grow from the left: ${JSON.stringify(barsOf(a, 3))}`);

  // ---------- P-07: flags ----------
  chk(() => P.check(base).length === 0 && flagsOf(a).length === 0, () => `P-07. a clean page has no flag: ${JSON.stringify(P.check(base))}`);
  const messy = Object.assign({}, base, { visuals: base.visuals.concat([
    { type: 'clusteredBarChart', x: 900, y: 200, w: 300, h: 250, title: 'Overlapping' },     // over the bar chart (i 3)
    { type: 'lineChart', x: 1100, y: 600, w: 300, h: 200, title: 'Off the page' },          // past the right and bottom edges
    { type: 'lineChart', x: 560, y: 70, w: 60, h: 40, title: 'Tiny' }                       // a chart too small to read
  ]) });
  const fl = P.check(messy), drawn = P.render(messy), df = flagsOf(drawn);
  const has = (list, i, k) => list.some((f) => f.i === i && f.kind === k);
  chk(() => has(fl, 8, 'overlap') && has(fl, 3, 'overlap') && has(fl, 9, 'cut') && has(fl, 10, 'small'), () => `P-07. check() finds the overlap, the visual off the page and the tiny chart: ${JSON.stringify(fl)}`);
  chk(() => has(df, 8, 'overlap') && has(df, 9, 'cut') && has(df, 10, 'small') && !has(df, 0, 'overlap'), () => `P-07. the flags are drawn on their visuals: ${JSON.stringify(df)}`);
  chk(() => ['overlap', 'cut off', 'too small'].every((w) => texts(drawn).includes(w)) && /class="flag"[^>]*>\s*<rect[^>]*stroke-dasharray/.test(drawn) && !/fill="#?(red|ff0000|f00)"/i.test(drawn), () => 'P-07. each flag is a dashed outline with its word (overlap, cut off, too small), calm (no red fill)');
  const given = P.render(base, { flags: [{ i: 3, kind: 'cut', why: 'labels may be cut' }] });
  chk(() => has(flagsOf(given), 3, 'cut') && texts(given).includes('cut off'), () => 'P-07. a flag given by the layout check (the lint) is drawn too');
  chk(() => texts(P.render(messy, { lang: 'ar' })).some((t) => /تداخل/.test(t)), () => 'P-07. the flags have their Arabic words in an Arabic preview');
}

// ---------- P-08: the golden test models ----------
if (P) {
  const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-preview-'));
  try {
    const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
    cp('test-models/arabic-long-names', 'arabic'); cp('test-models/no-measures', 'plain'); cp('fixtures/health-project', 'health');
    cp('test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');
    process.env.DATAARCUS_ROOT = ROOT;
    const { loadModel } = await import('./lib/model.mjs');
    const { planLayout } = await import('./lib/design.mjs');
    const { scopeOf } = await import('./lib/scope.mjs');
    let planPreview = null;
    try { ({ planPreview } = await import('./lib/plan-lint.mjs')); } catch (e) { planPreview = null; }
    chk(() => typeof planPreview === 'function', () => 'P-08. lib/plan-lint.mjs exports planPreview (the writer\'s planned pages, for the preview)');
    const cases = [
      { model: 'arabic', lang: 'ar', layout: 'exec', pages: 2 },
      { model: 'health', lang: 'en', layout: 'analysis', pages: 2 },
      { model: 'large', lang: 'en', layout: 'ops', focus: 'logistics', pages: 1, second: false },   // (the golden task's focus)
      { model: 'plain', lang: 'en', layout: 'focus', pages: 2 }
    ];
    for (const c of planPreview ? cases : []) {
      const m = loadModel(c.model, { root: ROOT }), sc = scopeOf(m, c.focus ? { focus: c.focus } : {});
      chk(() => !sc.needsFocus && sc.tables.length, () => `P-08 ${c.model}. the model's part to plan from: ${JSON.stringify(sc.why || '')}`);
      const design = planLayout({ layout: c.layout, lang: c.lang }).design;
      const pv = planPreview({ m, tables: sc.tables, design, lang: c.lang, second: c.second !== false });
      const pv2 = planPreview({ m, tables: sc.tables, design, lang: c.lang, second: c.second !== false });
      chk(() => pv && Array.isArray(pv.pages) && pv.pages.length === c.pages, () => `P-08 ${c.model}. ${c.pages} planned page(s) to preview: ${JSON.stringify(pv && pv.pages && pv.pages.map((p) => p.name))}`);
      if (!pv || !pv.pages) continue;
      const svgs = pv.pages.map((p) => P.render(p, { lang: c.lang })), svgs2 = pv2.pages.map((p) => P.render(p, { lang: c.lang }));
      chk(() => svgs.join() === svgs2.join(), () => `P-08 ${c.model}. the same plan gives the same pictures`);
      pv.pages.forEach((p, k) => {
        const s = svgs[k], bx = boxes(s), fl = flagsOf(s);
        chk(() => p.visuals.length >= 4 && bx.length === p.visuals.length, () => `P-08 ${c.model} page ${k + 1}. every visual drawn: ${bx.length} of ${p.visuals.length}`);
        chk(() => bx.every((q) => (q.x >= -1 && q.y >= -1 && q.x + q.w <= p.w + 1 && q.y + q.h <= p.h + 1) || fl.some((f) => f.i === q.i && f.kind === 'cut')), () => `P-08 ${c.model} page ${k + 1}. every box inside the ${p.w}x${p.h} page unless flagged "cut off": ${JSON.stringify(bx.filter((q) => q.x < -1 || q.y < -1 || q.x + q.w > p.w + 1 || q.y + q.h > p.h + 1))}`);
        chk(() => !!p.rtl === (c.lang === 'ar'), () => `P-08 ${c.model} page ${k + 1}. right to left only for the Arabic plan`);
        chk(() => bx.some((q) => /^(line|bar|column|table|donut)$/.test(q.kind)) && bx.some((q) => q.kind === 'card' || c.model === 'plain'), () => `P-08 ${c.model} page ${k + 1}. the charts and cards are drawn as their types: ${bx.map((q) => q.kind).join()}`);
        chk(() => !/<script|\son[a-z]+="/i.test(s), () => `P-08 ${c.model} page ${k + 1}. no markup from the model's names`);
      });
      if (c.lang === 'ar') chk(() => /[؀-ۿ]/.test(texts(svgs[0]).join(' ')), () => 'P-08 arabic. the Arabic titles are shown');
    }
  } finally { fs.rmSync(ROOT, { recursive: true, force: true }); }
}

report();
function report() {
  console.log(problems.length ? `FAIL  preview  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  preview  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
