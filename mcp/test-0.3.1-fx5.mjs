import './test-env.mjs';
// 0.3.1 FX5 (the owner, 28 Oct, D-1028-06: "why would i have a bar chart with three bars same length we need to apply
// some kind of sizing to display them in the right way and also not make the bars that wide or columns in case of column
// chart"; mcp/work/FX5.md; written red first on 84596b9): a bar or column is never thicker than the measured maximum
// (pbip-sizing.js BAR_MAX_720, x the text factor), by Microsoft's catalog's categoryAxis innerPadding and outerPadding,
// where the count of categories is known; the previews draw the same thickness; the value axis is never touched.
//   R  the rule (pbip-sizing.js barBand)        W  the writer (pbip-page.js), English and Arabic, the twin's mirror
//   P  the phone layout                          V  Microsoft's catalog and validator
//   D  the previews (page-preview.js, the Theme Generator's canvas)
// Made-up models only (no model read, no values); metadata only.
//   node test-0.3.1-fx5.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const J = (x) => JSON.stringify(x).slice(0, 500);
const Z = require('../assets/js/pbip-sizing.js'), Zmin = require('../assets/js/pbip-sizing.min.js'), Px = require('../assets/js/pbip-export.js'), E = require('../assets/js/design-engine.js');
const PV = require('../assets/js/page-preview.js'), Mirror = require('../assets/js/report-mirror.js');
const src = (f) => fs.readFileSync(path.join(REPO, f), 'utf8');
const litOf = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : undefined);

// ---------- R: the rule ----------
{
  chk(() => Z.BAR_MAX_720 === 36 && typeof Z.barBand === 'function' && typeof Z.barSpan === 'function' && typeof Z.barCountOf === 'function' && Zmin.BAR_MAX_720 === 36 && typeof Zmin.barBand === 'function',
    () => `R1. pbip-sizing.js (and its .min.js) export BAR_MAX_720 = 36, barSpan, barBand, barCountOf: ${J([Z.BAR_MAX_720, typeof Z.barBand, Zmin.BAR_MAX_720])}`);
  const b720 = get(() => Z.barBand(3, Z.barSpan(true, 600, 277, 720), 720)), b1080 = get(() => Z.barBand(3, Z.barSpan(true, 900, 416, 1080), 1080));
  chk(() => b720.pct === 36 && Math.abs(b720.bar - 35.43) < 0.01 && b720.max === 36, () => `R2. 3 bars in a 277-high bar chart at 1280 x 720 (span 186): padding 36, bars 35.4 (Desktop's default 49.6): ${J(b720)}`);
  chk(() => b1080.pct === 45 && Math.abs(b1080.bar - 44.56) < 0.01 && b1080.max === 45, () => `R3. the same at 1920 x 1080 (416 high, span 279.5, the maximum 36 x 1.25 = 45): padding 45, bars 44.6: ${J(b1080)}`);
  chk(() => get(() => Z.barBand(12, 186, 720)) === null && get(() => Z.barBand(0, 186, 720)) === null && get(() => Z.barBand(null, 186, 720)) === null,
    () => 'R4. guard: 12 bars in the same chart (12.4 each by default) and an unknown count: nothing (Desktop\'s default)');
  // every count 1-12 on a full-width column chart at 1080: never over the maximum, and the reverse finds the count
  const all = get(() => Array.from({ length: 12 }, (x, i) => { const b = Z.barBand(i + 1, 1800, 1080); return b && [b.pct, b.bar, Z.barCountOf(b.pct, 1800, 1080)]; }));
  chk(() => all.every((x, i) => x && x[1] <= 45 && x[1] > 36 && x[2] === i + 1), () => `R5. 1-12 columns over 1,800 at 1080: each under 45 (and over 36: the gaps take only what they must), the count read back: ${J(all)}`);
}

// ---------- W: the writer ----------
const T = 'Sales', M = (m) => ({ t: T, m }), C = (c, x) => Object.assign({ t: T, c }, x || {});
const build = (lang, W, H, slots, cats) => {
  const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma'; E.repairState(d);
  const bind = { kpis: [M('Total Sales')], measure: M('Total Sales'), date: null, cats: Object.assign({ bar: C('Region', { few: 3 }), column: C('Channel', { few: 3 }), donut: C('Channel') }, cats || {}), y: {}, table: [C('City'), M('Total Sales')], slicers: [null, null, null] };
  return Px.build({ name: 'FX5', title: 'FX5', pageName: 'P', lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false, model: { byPath: 'M.SemanticModel' }, bind, texts: E.REPORT_TEXTS[lang], pages: [{ name: 'P', page: { w: W, h: H }, slots, panel: null, hand: true, png: new Uint8Array([1]) }] });
};
const charts = (r) => r.files.filter((f) => /\/visual\.json$/.test(f.path)).map((f) => ({ path: f.path, j: JSON.parse(String(f.data)) })).filter((x) => x.j.visual && /^(clustered)?(Bar|Column)Chart$|^(clusteredBarChart|clusteredColumnChart)$/.test(x.j.visual.visualType));
const ofType = (r, t) => charts(r).find((x) => x.j.visual.visualType === t);
const pads = (x) => { const p = (((x && x.j.visual.objects || {}).categoryAxis || [])[0] || { properties: {} }).properties; return [litOf(p.innerPadding), litOf(p.outerPadding)]; };
const thick = (x, n, H) => { const pos = x.j.position, horizontal = /Bar/.test(x.j.visual.visualType), span = Z.barSpan(horizontal, pos.width, pos.height, H), p = parseInt(pads(x)[0], 10) / 100; return span * (1 - p) / (n + p); };
const s720 = [{ kind: 'bar', x: 20, y: 20, w: 600, h: 277 }, { kind: 'column', x: 640, y: 20, w: 600, h: 277 }];
const s1080 = [{ kind: 'bar', x: 20, y: 20, w: 900, h: 416 }, { kind: 'column', x: 24, y: 450, w: 1872, h: 291 }];
const r720 = get(() => build('en', 1280, 720, s720)), r1080 = get(() => build('en', 1920, 1080, s1080));
{
  const bar = get(() => ofType(r720, 'clusteredBarChart')), col = get(() => ofType(r720, 'clusteredColumnChart'));
  chk(() => J(pads(bar)) === '["36L","36L"]' && thick(bar, 3, 720) <= 36, () => `W1. 3 categories, a 277-high bar chart at 1280 x 720: innerPadding = outerPadding = 36, bars 35.4 (under 36; was no padding, 49.6): ${J(get(() => [pads(bar), thick(bar, 3, 720)]))}`);
  chk(() => J(pads(col)) === '["75L","75L"]' && thick(col, 3, 720) <= 36, () => `W2. 3 categories, a 600-wide column chart at 1280 x 720: padding 75, columns 35.9 (was 143.5): ${J(get(() => [pads(col), thick(col, 3, 720)]))}`);
  const bar2 = get(() => ofType(r1080, 'clusteredBarChart')), col2 = get(() => ofType(r1080, 'clusteredColumnChart'));
  chk(() => J(pads(bar2)) === '["45L","45L"]' && thick(bar2, 3, 1080) <= 45, () => `W3. 3 categories, a 416-high bar chart at 1920 x 1080: padding 45, bars 44.6 (under 45; was 74.5): ${J(get(() => [pads(bar2), thick(bar2, 3, 1080)]))}`);
  chk(() => J(pads(col2)) === '["91L","91L"]' && thick(col2, 3, 1080) <= 45, () => `W4. 3 categories, the Details page's 1,872-wide column chart at 1920 x 1080: padding 91, columns 41.4 (was 480): ${J(get(() => [pads(col2), thick(col2, 3, 1080)]))}`);
  // guards: 12 known categories already fit (unchanged); a count not known (a text column with its own sort order: no Top N)
  const m12 = get(() => build('en', 1280, 720, [s720[0]], { bar: C('Month Name', { kind: 'month' }) })), un = get(() => build('en', 1280, 720, s720, { bar: C('Segment', { sortBy: 'Segment Order' }), column: C('Tier', { sortBy: 'Tier Order' }) }));
  chk(() => J(pads(ofType(m12, 'clusteredBarChart'))) === '[null,null]', () => `W5. guard: 12 months in the same bar chart (12.4 each): no padding written: ${J(get(() => pads(ofType(m12, 'clusteredBarChart'))))}`);
  chk(() => charts(un).length === 2 && charts(un).every((x) => J(pads(x)) === '[null,null]'), () => `W6. guard: the count not known: nothing written, Desktop's default: ${J(get(() => charts(un).map(pads)))}`);
  // the Top N is a known count: a text category on the full-width column chart, kept to the N its slot shows
  const top = get(() => build('en', 1920, 1080, [s1080[1]], { column: C('City') })), tc = get(() => ofType(top, 'clusteredColumnChart')), N = get(() => (top.topCharts || []).find((x) => x.kind === 'column').top);
  chk(() => N > 0 && /L$/.test(pads(tc)[0]) && thick(tc, N, 1080) <= 45, () => `W7. a text category kept to its Top ${N}: the gaps follow N, each column at most 45: ${J(get(() => [N, pads(tc), thick(tc, N, 1080)]))}`);
  // never the value axis (three equal bars are equal values)
  chk(() => [r720, r1080].every((r) => charts(r).every((x) => { const va = ((x.j.visual.objects.valueAxis || [])[0] || { properties: {} }).properties; return !['start', 'end', 'logAxisScale', 'axisScale'].some((k) => k in va); })),
    () => 'W8. the value axis untouched: no start, end or scale written on any chart');
  // Arabic: the same thickness (create_report's Arabic and the twin, D-1027-12)
  const ar = get(() => build('ar', 1280, 720, s720)), arb = get(() => ofType(ar, 'clusteredBarChart')), arc = get(() => ofType(ar, 'clusteredColumnChart'));
  chk(() => J(pads(arb)) === '["36L","36L"]' && J(pads(arc)) === '["75L","75L"]', () => `W9. the Arabic report: the same padding (36, 75): ${J(get(() => [pads(arb), pads(arc)]))}`);
  const mb = get(() => Mirror.mirrorVisual(JSON.parse(JSON.stringify(bar.j)), 1280, {}).json), mc = get(() => Mirror.mirrorVisual(JSON.parse(JSON.stringify(col.j)), 1280, {}).json);
  chk(() => J(pads({ j: mb })) === '["36L","36L"]' && J(pads({ j: mc })) === '["75L","75L"]', () => `W10. the twin's mirror keeps the English chart's padding (identical): ${J(get(() => [pads({ j: mb }), pads({ j: mc })]))}`);
}

// ---------- P: the phone layout ----------
{
  const mob = (r, t) => { const v = ofType(r, t), dir = path.posix.dirname(v.path), f = r.files.find((x) => x.path === dir + '/mobile.json'); return f ? JSON.parse(String(f.data)) : null; };
  const mp = (m) => { const p = (((m || {}).objects || {}).categoryAxis || [{ properties: {} }])[0].properties; return [litOf(p.innerPadding), litOf(p.outerPadding), litOf(p.fontSize)]; };
  const pc = get(() => mob(r720, 'clusteredColumnChart')), pb = get(() => mob(r720, 'clusteredBarChart'));
  chk(() => J(mp(pc)) === '["52L","52L","8D"]', () => `P1. the phone's 323 x 190 column chart with 3: padding 52 (its own box, 720 units), the phone's 8pt kept: ${J(get(() => mp(pc)))}`);
  chk(() => J(mp(pb)) === '[null,null,"8D"]', () => `P2. guard: the phone's 190-high bar chart with 3 (26.4 each by default): nothing more written: ${J(get(() => mp(pb)))}`);
}

// ---------- V: Microsoft's catalog and validator ----------
{
  const caps = JSON.parse(fs.readFileSync(path.join(HERE, 'node_modules/@microsoft/powerbi-core-visual-schema/data/capabilities.json'), 'utf8'));
  const types = ['clusteredBarChart', 'barChart', 'hundredPercentStackedBarChart', 'clusteredColumnChart', 'columnChart', 'hundredPercentStackedColumnChart', 'lineClusteredColumnComboChart', 'lineStackedColumnComboChart'];
  chk(() => types.every((t) => { const p = caps[t].objects.categoryAxis.properties; return p.innerPadding.type.integer && p.outerPadding.type.integer; }) && /BAND_TYPES = \/\^\(clusteredBarChart\|barChart\|hundredPercentStackedBarChart\|clusteredColumnChart\|columnChart\|hundredPercentStackedColumnChart\|lineClusteredColumnComboChart\|lineStackedColumnComboChart\)\$\//.test(src('assets/js/pbip-page.js')),
    () => 'V1. every kind the writer pads has categoryAxis innerPadding and outerPadding (integers) in Microsoft\'s catalog');
  const { runReportValidation, getMetadataProvider } = await import('@microsoft/powerbi-report-authoring-cli');
  for (const [name, r] of [['1280 x 720', r720], ['1920 x 1080', r1080]]) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx5-'));
    try {
      r.files.forEach((f) => { const p = path.join(dir, ...f.path.split('/')); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
      const reportDir = path.join(dir, 'FX5.Report'), s = await runReportValidation({ reportDir, defDir: path.join(reportDir, 'definition'), provider: await getMetadataProvider(), skipSchema: true });
      const codes = Object.entries(s.diagnostics || {}).filter(([, d]) => d.severity === 'error').map(([c]) => c);
      chk(() => s.errorCount === 0, () => `V2 (${name}). Microsoft's validator: 0 errors on the padded charts: ${s.errorCount} ${J(codes)}`);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
}

// ---------- D: the previews draw the same thickness ----------
{
  const page = get(() => PV.fromFiles(r720.files, {})[0]), bands = get(() => page.visuals.filter((v) => v.band).map((v) => [v.type, v.band]));
  chk(() => J(bands) === '[["clusteredBarChart",36],["clusteredColumnChart",75]]', () => `D1. the preview reads the written padding of each chart: ${J(bands)}`);
  const svg = get(() => PV.render(page, { width: 1280 })), groups = typeof svg === 'string' ? svg.split('<g class="v"').filter((g) => /data-kind="(bar|column)"/.test(g)) : [];
  const rects = (g, attr) => [...g.split('<g class="ph">')[1].matchAll(new RegExp(`<rect [^>]*${attr}="([0-9.]+)"[^>]*fill="#A3ACBB"`, 'g'))].map((m) => +m[1]);
  const bh = get(() => rects(groups.find((g) => /data-kind="bar"/.test(g)), 'height')), cw = get(() => rects(groups.find((g) => /data-kind="column"/.test(g)), 'width'));
  chk(() => bh.length === 3 && bh.every((h) => Math.abs(h - 35.4) < 0.1), () => `D2. the preview's bar chart: 3 bars 35.4 high, as written (was 5 placeholder bars, 11% of the box each): ${J(bh)}`);
  chk(() => cw.length === 3 && cw.every((w) => Math.abs(w - 35.9) < 0.1), () => `D3. the preview's column chart: 3 columns 35.9 wide, as written: ${J(cw)}`);
  const un = get(() => PV.fromFiles(build('en', 1280, 720, s720, { bar: C('Segment', { sortBy: 'Segment Order' }), column: C('Tier', { sortBy: 'Tier Order' }) }).files, {})[0]), svg2 = get(() => PV.render(un, { width: 1280 }));
  const n2 = get(() => svg2.split('<g class="v"').filter((g) => /data-kind="bar"/.test(g)).map((g) => (g.split('<g class="ph">')[1].match(/<rect /g) || []).length));
  chk(() => J(n2) === '[5]', () => `D4. guard: a chart with no padding keeps the preview's own five bars: ${J(n2)}`);
  // the Theme Generator's canvas: its sample bars by the same rule, the sizes loaded with the page (EN, AR and the lab)
  const tg = src('assets/js/theme-generator.js');
  chk(() => /const barThick = \(n, horizontal, s\) => \{\s*const Z = window\.DAPbipSizing;[^]*Z\.barBand\(n, span, PH\)/.test(tg) && (tg.match(/barThick\(n, (true|false), s\)/g) || []).length === 2,
    () => 'D5. the Theme Generator\'s canvas draws its sample bars and columns by barBand (the writer\'s rule)');
  const pages = ['tools/power-bi-theme-generator.html', 'ar/tools/power-bi-theme-generator.html', 'tools/power-bi-theme-generator-lab.html'];
  chk(() => pages.every((p) => { const h = src(p), at = (re) => h.search(re); return at(/pbip-sizing\.min\.js\?v=/) > 0 && at(/pbip-query\.min\.js\?v=/) < at(/pbip-sizing\.min\.js\?v=/) && at(/text-measure\.min\.js\?v=/) < at(/pbip-sizing\.min\.js\?v=/) && at(/pbip-sizing\.min\.js\?v=/) < at(/js\/theme-generator\.min\.js\?v=/); }),
    () => 'D6. each Theme Generator page loads text-measure, pbip-query and pbip-sizing before theme-generator.min.js');
  chk(() => (fs.readdirSync(path.join(REPO, 'assets/js')).filter((f) => /\.js$/.test(f) && !/\.min\.js$/.test(f)).map((f) => (src('assets/js/' + f).match(/BAR_MAX_720 = /g) || []).length).reduce((a, b) => a + b, 0)) === 1,
    () => 'D7. the maximum is set in one place (pbip-sizing.js)');
}

if (problems.length) { console.log(`FAIL script=test-0.3.1-fx5.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  fx5  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  fx5  ${checks} checks`);
process.exit(0);
