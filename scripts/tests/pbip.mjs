// Power BI project download with the user's own model (theme generator lab page):
//  - a local project: the fixture's Sales.SemanticModel folder is picked, the download is a report that points at it
//    and would not replace anything in their folder (own report name, no .gitignore or README)
//  - a published model: a live connection in the form Microsoft documents, fields loaded from a .pbit
//  - every field a visual uses exists in the model, as the right kind (measure or column)
//  - the sample-data download still has its own model
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { visitor } from './lib.mjs';
import { layoutProblems, phoneTextProblems, navProblems, headerAndRail, headerProblems, tooltipProblems, tooltipPageProblems, tableProblems, cardStyleProblems, projectProblems, panelProblems, isMessageCard } from './report-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.join(HERE, 'fixtures', 'bridge-project');
const PBIT = path.join(HERE, '..', '..', 'assets', 'data', 'model-health-sample.pbit');
const PAGE = '/tools/power-bi-theme-generator-lab.html';

// the exporter writes stored (uncompressed) zips, so reading one is only walking its headers
function unzip(buf) {
  const out = {}; let p = 0;
  while (buf.readUInt32LE(p) === 0x04034b50) {
    const size = buf.readUInt32LE(p + 18), nlen = buf.readUInt16LE(p + 26), xlen = buf.readUInt16LE(p + 28);
    const name = buf.toString('utf8', p + 30, p + 30 + nlen), start = p + 30 + nlen + xlen;
    out[name] = buf.subarray(start, start + size); p = start + size;
  }
  return out;
}
// the fields each visual uses, as "Measure Table[Name]" / "Column Table[Name]"
const refs = (files) => Object.entries(files).filter(([n]) => n.endsWith('/visual.json')).flatMap(([, b]) => {
  const out = [];
  JSON.stringify(JSON.parse(b.toString('utf8')), (k, v) => {
    // (round 22: a report-level measure, Schema 'extension', is the report's own, e.g. the "No data" text of a chart: not a field of the model)
    if (v && (v.Column || v.Measure) && (v.Column || v.Measure).Expression && !(v.Column || v.Measure).Expression.SourceRef.Schema) { const x = v.Column || v.Measure; out.push({ kind: v.Column ? 'c' : 'm', t: x.Expression.SourceRef.Entity, n: x.Property }); }
    return v;
  });
  return out;
});

// cards are cardVisual (Microsoft deprecates the legacy card): field role Data; value size and centring, no label and
// no inner outline, each on the "default" selector; padding set; the height they need fits their box (Microsoft's card
// sizing: text takes 1.5 x its size); the title follows the reading direction; on the phone, their own sizes.
// files: { path: bytes } of a project. Returns the number of cards and what is wrong.
function cardProblems(files, rtl) {
  const bad = [], lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined), n = (p) => parseFloat(lit(p));
  const def = (list) => (list || []).find((x) => x.selector && x.selector.id === 'default'), props = (list) => ((list || [])[0] || {}).properties || {};
  let cards = 0;
  Object.keys(files).filter((f) => f.endsWith('/visual.json')).forEach((f) => {
    const j = JSON.parse(String(files[f])), v = j.visual, id = j.name;
    if (!v) return;
    if (v.visualType === 'card' || v.visualType === 'multiRowCard') { bad.push(`${id}: legacy ${v.visualType}`); return; }
    if (v.visualType !== 'cardVisual' || isMessageCard(v)) return;   // (round 22: a "No data" message card is not a KPI card)
    cards++;
    const o = v.objects || {}, c = v.visualContainerObjects || {}, val = def(o.value), pad = def(o.padding), lay = def(o.layout);
    const roles = Object.keys((v.query || {}).queryState || {});
    if (roles.length && roles.join() !== 'Data') bad.push(`${id}: role ${roles}`);
    // (changed 5 Oct, the owner's design choice 1: a KPI card's value sits at the reading start under its title; other
    //  cards, such as the tooltip's, stay centred)
    const side = j.parentGroupName ? (rtl ? "'right'" : "'left'") : "'center'";
    if (!val || !(n(val.properties.fontSize) >= 8) || lit(val.properties.horizontalAlignment) !== side) bad.push(`${id}: value ${JSON.stringify(val)}`);
    if (lit((def(o.label) || { properties: {} }).properties.show) !== 'false') bad.push(`${id}: label not hidden`);
    if (lit((def(o.outline) || { properties: {} }).properties.show) !== 'false') bad.push(`${id}: inner outline not off`);
    const t = props(c.title), vp = props(c.padding), sp = props(c.spacing);
    if (lit(t.alignment) !== (rtl ? "'right'" : "'left'")) bad.push(`${id}: title alignment ${lit(t.alignment)}`);
    if (lit(sp.customizeSpacing) !== 'true' || n(sp.spaceBelowTitleArea) !== 0) bad.push(`${id}: spacing ${JSON.stringify(sp)}`);
    // (5 Oct: a KPI title too long for one line at 8pt may wrap to two, titleWrap; then it needs two lines)
    const need = n(vp.top) + n(vp.bottom) + (lit(t.show) === 'true' ? (lit(t.titleWrap) === 'true' ? 2 : 1) * Math.ceil(1.5 * n(t.fontSize)) : 0) + 2 * n(pad && pad.properties.paddingUniform) + 2 * n(lay && lay.properties.paddingUniform) + Math.ceil(1.5 * n(val && val.properties.fontSize));
    if (!(need <= j.position.height)) bad.push(`${id}: needs ${need} high, box ${j.position.height}`);
    const mf = f.replace(/visual\.json$/, 'mobile.json');
    if (files[mf]) {
      const m = JSON.parse(String(files[mf]));
      if (n((def((m.objects || {}).value) || { properties: {} }).properties.fontSize) !== 20 || n(props((m.visualContainerObjects || {}).title).fontSize) !== 10) bad.push(`${id}: phone sizes ${JSON.stringify(m.objects)} ${JSON.stringify(m.visualContainerObjects)}`);
    }
  });
  return { cards, bad };
}

// the fields of the fixture's model
const LOCAL = { m: { Sales: ['Total Sales', 'Orders', 'Sales YoY %'] }, c: { Sales: ['CustomerKey', 'Sales Channel'], Customer: ["Customer's City", 'المنطقة'], Calendar: ['Date', 'Year', 'Month Name'] } };
// a copy of the fixture project in a temporary folder named proj, changed by edit(dir)
const project = (edit) => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pbip-')), 'proj');
  fs.cpSync(PROJECT, dir, { recursive: true }); edit(dir);
  return dir;
};

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

  // 0. A .pbit is read by the Model Health Check's engine: it keeps hidden tables and the date-table mark, so the
  //    picker sees the same model as from the model.bim
  {
    const require = createRequire(import.meta.url);
    const E = require('../../assets/js/model-health-engine.js'), DB = require('../../assets/js/pbip-bind.js');
    const bim = { model: { tables: [
      { name: 'Sales', columns: [{ name: 'Amount', dataType: 'double' }, { name: 'Region', dataType: 'string' }], measures: [{ name: 'Total', expression: 'SUM(Sales[Amount])' }] },
      { name: 'Helpers', isHidden: true, columns: [{ name: 'X', dataType: 'string' }], measures: [{ name: 'Hidden One', expression: '1' }] },
      { name: 'Dim', dataCategory: 'Time', columns: [{ name: 'Day', dataType: 'dateTime' }, { name: 'Mon', dataType: 'string' }] }] } };
    const viaPbit = DB.fromTmsl({ tables: E.analyze(bim).rawTables }), direct = DB.fromTmsl(bim);
    check(JSON.stringify(viaPbit) === JSON.stringify(direct), `pbit: the model differs from the model.bim: ${JSON.stringify(viaPbit.map((t) => [t.name, t.hidden, t.date]))}`);
  }

  // 9. File and folder names from any design name: whole characters only (an emoji is never cut in half)
  {
    const require = createRequire(import.meta.url), P = require('../../assets/js/pbip-export.js');
    const names = (name) => P.build({ name, lang: 'en', font: 'Segoe UI', ui: { text: '#111111', card: '#ffffff', background: '#eeeeee', accent: '#0077ff' }, theme: {}, sample: true, texts: {},
      pages: [{ name: 'P', page: { w: 1280, h: 720 }, slots: [{ kind: 'kpi', title: 'K', x: 0, y: 0, w: 100, h: 50 }], png: new Uint8Array([1]) }] }).files.map((f) => f.path);
    const emoji = names('x'.repeat(59) + '\u{1F4CA} Sales');
    for (const n of ['..', '.', ' .. ', 'Sales.', '.hidden']) {
      const ps = names(n);
      check(ps.every((p) => !p.split('/').some((seg) => seg === '..' || seg === '.' || (seg !== '.gitignore' && seg !== '.platform' && /^[.\s]|[.\s]$/.test(seg.replace(/\.(pbip|Report|SemanticModel)$/, ''))))), `names: "${n}" gives ${ps.find((p) => /(^|\/)\.|\.\//.test(p)) || ps[0]}`);
    }
    // the longest path stays well under Windows' 260 characters after "Extract all" into C:\Users\<name>\Downloads\<zip name>\
    const longest = Math.max(...names('A'.repeat(60)).map((p) => p.length));
    check(longest <= 160, `names: longest path in the zip is ${longest} characters`);
    check(emoji.every((n) => !/[\uD800-\uDFFF]/.test(n.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')) && !n.includes('\uFFFD')), `names: an emoji cut in half: ${emoji[0]}`);
  }

  // 10. Cards on every design fixture (54 designs: every layout on 9 page sizes, 640 x 360 to 3840 x 2160, English and
  //     Arabic, the smallest and largest KPI heights), built the way the page builds its download: every KPI card and the
  //     tooltip card is a cardVisual that fits its box (see cardProblems)
  {
    const require = createRequire(import.meta.url), P = require('../../assets/js/pbip-export.js'), E = require('../../assets/js/design-engine.js');
    const { cases } = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'design-engine', 'cases.json'), 'utf8'));
    const bad = []; let designs = 0;
    for (const c of cases) {
      const d = c.state, pages = E.projectPages(d.layout, c.lang, { second: true, panel: true }), rtl = E.rtl(d.layout, c.lang);
      const { files } = P.build({ name: 'Cards', title: 'Cards', pageName: pages[0].name, lang: c.lang, rtl, font: d.font, ui: d.ui, theme: E.buildTheme(d, c.lang), sample: true, logo: null,
        texts: E.REPORT_TEXTS[c.lang], pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, png: new Uint8Array([1]), panel: p.panel })) });
      const r = cardProblems(Object.fromEntries(files.map((f) => [f.path, typeof f.data === 'string' ? f.data : Buffer.from(f.data)])), rtl);
      // (round 1: two tooltip pages, the monthly trend and the bar chart by category, each with its card)
      const want = pages.reduce((a, p) => a + p.slots.filter((s) => s.kind === 'kpi').length, 0) + 2;
      if (r.cards !== want || r.bad.length) bad.push(`${c.id}: ${r.cards} cardVisual of ${want}; ${r.bad.slice(0, 3).join('; ')}`);
      designs++;
    }
    check(designs === 54 && !bad.length, `cards on the design fixtures (${designs}): ${bad.length} wrong, e.g. ${bad.slice(0, 3).join(' | ')}`);
  }

  // 11. Phone layout and sizes on every design fixture (see report-check.mjs), with and without the slide-in panel:
  //     no visual on top of another on the phone, and the header, page buttons, slicers and buttons fit on every page size
  {
    const require = createRequire(import.meta.url), P = require('../../assets/js/pbip-export.js'), E = require('../../assets/js/design-engine.js');
    const { cases } = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'design-engine', 'cases.json'), 'utf8'));
    const build = (d, lang, opts) => {
      const pages = E.projectPages(d.layout, lang, opts);
      const { files } = P.build({ name: 'Sizes', title: 'Sizes', pageName: pages[0].name, lang, rtl: E.rtl(d.layout, lang), font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: true, logo: null,
        texts: E.REPORT_TEXTS[lang], pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, png: new Uint8Array([1]), panel: p.panel })) });
      return Object.fromEntries(files.map((f) => [f.path, typeof f.data === 'string' ? f.data : Buffer.from(f.data)]));
    };
    const phone = [], sizes = [], ptext = [];
    // the fixtures' small and large pages use other header heights; add every layout with its defaults on the smallest
    // and largest pages, as the Desktop checks build them (the header title is 16 high on 640 x 360)
    const base0 = cases.find((c) => c.id === 'preset-1').state;
    const extra = ['exec', 'analysis', 'ops', 'focus'].flatMap((preset) => [[640, 360], [3840, 2160]].flatMap(([w, h]) => ['en', 'ar'].map((lang) => ({
      id: `default-${preset}-${w}x${h}-${lang}`, lang,
      state: Object.assign({}, base0, { layout: { v: 3, preset, page: 'custom', pageW: w, pageH: h, header: true, kpis: E.LAYOUTS[preset].kpis, filters: E.LAYOUTS[preset].filters, fpos: 'end' } }) }))));
    for (const c of cases.concat(extra)) for (const panel of [false, true]) {
      const files1 = build(c.state, c.lang, { second: true, panel }), r = layoutProblems(files1), tag = `${c.id}${panel ? ' (panel)' : ''}`;
      if (r.phone.length) phone.push(`${tag}: ${r.phone[0]}${r.phone.length > 1 ? ` (+${r.phone.length - 1})` : ''}`);
      if (r.sizes.length) sizes.push(`${tag}: ${r.sizes[0]}${r.sizes.length > 1 ? ` (+${r.sizes.length - 1})` : ''}`);
      const pt = phoneTextProblems(files1);
      if (pt.bad.length || !pt.visuals) ptext.push(`${tag}: ${pt.bad[0] || 'no phone layout'}${pt.bad.length > 1 ? ` (+${pt.bad.length - 1})` : ''}`);
    }
    check(!phone.length, `phone layout overlaps on ${phone.length} of ${2 * (cases.length + extra.length)} designs, e.g. ${phone.slice(0, 3).join(' | ')}`);
    check(!sizes.length, `sizes that don't fit on ${sizes.length} of ${2 * (cases.length + extra.length)} designs, e.g. ${sizes.slice(0, 3).join(' | ')}`);
    // round 1: every text in the phone layout has a size that fits its phone box (mobile.json, with the selector that works)
    check(!ptext.length, `phone text that doesn't fit on ${ptext.length} of ${2 * (cases.length + extra.length)} designs, e.g. ${ptext.slice(0, 3).join(' | ')}`);
    // the guard: 1920 x 1080 keeps today's sizes; 1280 x 720 scaled (2/3) and fitted to the measured heights (owner-confirmed
    // 2026-10-01: title 12, page buttons on one line, slicers 56); exec layout, second page with the filter rail
    const base = cases.find((c) => c.id === 'preset-1').state;
    // (round 1: the 1080 page buttons are one line each and as wide as "Executive summary" needs, 422 for the two:
    // Segoe UI can't put 14pt on two lines in the 48-high header, so the 320 of before cut the name; measured in Desktop 2.158)
    // (round 10, the owner's design note R10.6a: the page navigator is tab buttons now, each as wide as its own name, so
    // "nav" is no longer one box's width (422 and 299 before) but the tabs' text size: 14pt and 10pt, the sizes the
    // navigator's text had)
    for (const [page, want] of [['1920x1080', { title: 20, logo: 14, nav: 14, slicer: 76, reset: 40 }], ['1280x720', { title: 12, logo: 10, nav: 10, slicer: 56, reset: 27 }]]) {
      const d = Object.assign({}, base, { layout: Object.assign({}, base.layout, { preset: 'exec', page, header: true, kpis: 4, filters: false }) });
      const got = headerAndRail(build(d, 'en', { second: true, panel: false }));
      check(JSON.stringify(got) === JSON.stringify(want), `sizes on ${page}: ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    }
  }

  // 12. Round 0 (measured in Power BI Desktop 2.158, DESKTOP-TESTS.md): on every design fixture, built as the page
  //     builds its download (each page with its accent-bar inset from the engine): every chart linked to the tooltip
  //     page with type Canvas; the tooltip page 320 x 284 with a bar chart of 6 rows; every table column aligned with
  //     its header; cards without their own fill, padding and spacing without a selector, the title's top margin and
  //     the side that clears the accent bar; the theme under one name; a .platform file
  {
    const require = createRequire(import.meta.url), P = require('../../assets/js/pbip-export.js'), E = require('../../assets/js/design-engine.js');
    const { cases } = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'design-engine', 'cases.json'), 'utf8'));
    const inset = (l) => (typeof E.kpiInset === 'function' ? E.kpiInset(l) : 0);
    const build = (d, lang, opts, more) => {
      const pages = E.projectPages(d.layout, lang, opts);
      const { files } = P.build(Object.assign({ name: 'Round0', title: 'Round0', pageName: pages[0].name, lang, rtl: E.rtl(d.layout, lang), font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: true, logo: null,
        texts: E.REPORT_TEXTS[lang], pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, png: new Uint8Array([1]), panel: p.panel, kpiInset: inset(p.layout) })) }, more || {}));
      return { files: Object.fromEntries(files.map((f) => [f.path, typeof f.data === 'string' ? f.data : Buffer.from(f.data)])), insets: pages.map((p) => inset(p.layout)), pages };
    };
    const bad = { link: [], tip: [], table: [], card: [], shell: [], header: [], nav: [] }; let navButtons = 0;
    for (const c of cases) {
      const rtl = E.rtl(c.state.layout, c.lang), b = build(c.state, c.lang, { second: true, panel: false });
      const a = tooltipProblems(b.files), t = tooltipPageProblems(b.files), tb = tableProblems(b.files, rtl), cd = cardStyleProblems(b.files, rtl, b.insets), sh = projectProblems(b.files), hd = headerProblems(b.files), nv = navProblems(b.files, rtl);
      navButtons += nv.buttons;
      if (nv.bad.length) bad.nav.push(`${c.id} (${c.lang}): ${nv.bad[0]}`);
      if (hd.bad.length) bad.header.push(`${c.id}: ${hd.bad[0]}`);
      if (a.bad.length) bad.link.push(`${c.id}: ${a.bad.length} of ${a.charts} charts, ${a.bad[0]}`);
      // (round 1: the sample has a month, so two tooltip pages: the monthly trend, and the bar chart by category for the
      // charts that are themselves by month; of the page's charts at least one is linked to the trend)
      if (t.bad.length || t.pages !== 2 || t.charts !== 2 || t.trend !== 1 || !a.trend) bad.tip.push(`${c.id}: ${t.bad[0] || `${t.pages} tooltip pages, ${t.charts} charts, ${t.trend} trend, ${a.trend} charts linked to it`}`);
      if (tb.bad.length) bad.table.push(`${c.id}: ${tb.bad.length} of ${tb.columns} columns, ${tb.bad[0]}`);
      if (cd.bad.length) bad.card.push(`${c.id}: ${cd.bad[0]} (+${cd.bad.length - 1} on ${cd.cards} cards)`);
      if (sh.length) bad.shell.push(`${c.id}: ${sh.join('; ')}`);
    }
    check(!bad.link.length, `tooltip link wrong on ${bad.link.length} of ${cases.length} designs, e.g. ${bad.link.slice(0, 2).join(' | ')}`);
    check(!bad.tip.length, `tooltip page wrong on ${bad.tip.length} of ${cases.length} designs, e.g. ${bad.tip.slice(0, 2).join(' | ')}`);
    check(!bad.table.length, `table header alignment wrong on ${bad.table.length} of ${cases.length} designs, e.g. ${bad.table.slice(0, 2).join(' | ')}`);
    check(!bad.card.length, `card fill or padding wrong on ${bad.card.length} of ${cases.length} designs, e.g. ${bad.card.slice(0, 2).join(' | ')}`);
    check(!bad.shell.length, `theme name or .platform wrong on ${bad.shell.length} of ${cases.length} designs, e.g. ${bad.shell.slice(0, 2).join(' | ')}`);
    // round 1: the header's text boxes are centred in the header's height ("Your logo" sat high; DESKTOP-TESTS.md round 1)
    // round 2: in a right-to-left report the page buttons are single buttons, the first page's rightmost
    check(!bad.nav.length && navButtons > 0, `page buttons not in reading order on ${bad.nav.length} of ${cases.length} designs (${navButtons} single buttons in all), e.g. ${bad.nav.slice(0, 2).join(' | ')}`);
    check(!bad.header.length, `header text not centred on ${bad.header.length} of ${cases.length} designs, e.g. ${bad.header.slice(0, 2).join(' | ')}`);
    // who draws the panels (fix/mcp-visual-style): with a solid theme the cards, charts and tables are left to the
    // theme and the KPI group draws no band; with a transparent theme every visual stays off, as the page's download
    // needs it (its background image draws the panels). Each design with its own theme, with and without the slide-in
    // panel, and each design again with the transparent theme the page's download always uses.
    {
      const wrong = [], counts = { solid: 0, transparent: 0 };
      for (const c of cases) for (const panel of [false, true]) for (const forced of [false, true]) {
        const d = forced ? Object.assign({}, c.state, { layout: Object.assign({}, c.state.layout, { transparent: true }) }) : c.state;
        const pp = panelProblems(build(d, c.lang, { second: true, panel }).files), want = !d.layout.transparent;
        counts[pp.solid ? 'solid' : 'transparent']++;
        if (pp.solid !== want || pp.bad.length || (want && !pp.panels)) wrong.push(`${c.id}${panel ? ' (panel)' : ''}${forced ? ' (transparent theme)' : ''}: ${pp.solid ? 'solid' : 'transparent'}, ${pp.bad.length} wrong of ${pp.panels} panels, ${pp.bad[0] || ''}`);
      }
      check(!wrong.length && counts.solid === 82 && counts.transparent === 134, `panels wrong on ${wrong.length} of ${4 * cases.length} builds (${counts.solid} solid, ${counts.transparent} transparent; 82 and 134 expected), e.g. ${wrong.slice(0, 2).join(' | ')}`);
    }

    // the default two-page report (exec, 4 KPI cards; second page analysis), counted: 4 charts, 8 table columns, 8 cards
    const base = cases.find((c) => c.id === 'preset-1').state;
    const std = (page, more) => Object.assign({}, base, { layout: Object.assign({}, base.layout, { preset: 'exec', page, header: true, kpis: 4, filters: false, hh: undefined, logoW: undefined }, more || {}) });
    {
      const b = build(std('1920x1080'), 'en', { second: true, panel: false });
      const a = tooltipProblems(b.files), tb = tableProblems(b.files, false), cd = cardStyleProblems(b.files, false, b.insets), cardsBad = new Set(cd.bad.map((x) => x.split(':')[0])).size;
      check(a.charts === 4 && !a.bad.length, `default report: ${a.bad.length} of ${a.charts} charts without the Canvas link (4 charts expected)`);
      // round 1: the bar chart and the two column charts show the monthly trend on hover, the line chart (by month) the bar chart by category
      check(a.trend === 3, `default report: ${a.trend} of 4 charts linked to the monthly trend tooltip (3 expected: all but the line chart)`);
      check(tb.columns === 8 && !tb.bad.length, `default report: ${tb.bad.length} of ${tb.columns} table columns without header alignment (8 columns expected)`);
      check(cd.cards === 9 && !cd.bad.length, `default report: ${cardsBad} of ${cd.cards} cards with their own fill or ignored padding (9 cards expected: 7 KPI cards and the two tooltip cards)`);
      // value sizes: the default cards keep 42 (1080) and 28 (720); the tooltip card 20
      const sizes = (files) => [...new Set(Object.keys(files).filter((f) => f.endsWith('/visual.json')).map((f) => JSON.parse(String(files[f]))).filter((v) => v.visual && v.visual.visualType === 'cardVisual' && !isMessageCard(v)).map((v) => parseFloat(v.visual.objects.value[0].properties.fontSize.expr.Literal.Value)))].sort((x, y) => x - y).join(',');
      const s720 = sizes(build(std('1280x720'), 'en', { second: true, panel: false }).files);
      check(sizes(b.files) === '20,42' && s720 === '20,28', `card value sizes: 1080 ${sizes(b.files)} (want 20,42), 720 ${s720} (want 20,28)`);
      // a side accent bar: the title's side padding clears it (26 on 1080, 17 on 720); a bar on top needs none
      const ins = ['1920x1080', '1280x720'].map((pg) => inset(std(pg, { kpiBar: 'start' }).layout)).concat(inset(std('1920x1080', { kpiBar: 'top' }).layout));
      check(JSON.stringify(ins) === '[26,17,0]', `accent bar inset: ${JSON.stringify(ins)}, want [26,17,0]`);
    }
    // a number column in a table sits on the number side, like a measure (the bound field says so)
    {
      const d = std('1920x1080'), pages = E.projectPages(d.layout, 'en', { second: false, panel: false });
      const C = (c, num) => ({ t: 'T', c, num }), M = (m) => ({ t: 'T', m });
      const { files } = P.build({ name: 'Own', title: 'Own', pageName: pages[0].name, lang: 'en', rtl: false, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), sample: false, logo: null, texts: E.REPORT_TEXTS.en,
        model: { byPath: 'T.SemanticModel' }, bind: { kpis: [M('A')], measure: M('A'), date: C('Month'), cats: { bar: C('Cat'), column: C('Cat') }, y: {}, table: [C('Cat'), C('Qty', true), M('A')], slicers: [], tip: null },
        pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, png: new Uint8Array([1]), panel: p.panel })) });
      const tb = tableProblems(Object.fromEntries(files.map((f) => [f.path, typeof f.data === 'string' ? f.data : Buffer.from(f.data)])), false, ['T.Qty']);
      check(tb.columns === 3 && !tb.bad.length, `number column in a table: ${tb.bad.join('; ') || tb.columns + ' columns'}`);
    }
    // an attached logo: its box has the logo's own shape (designed height, width from the ratio, 360 at most on the
    // 720 grid), at the header's far edge; the image is never stretched (image.fit Fit); the page buttons end 24k before it
    {
      const LOGOS = path.join(HERE, 'fixtures', 'logos'), abs = (files) => {
        const vs = Object.keys(files).filter((f) => f.endsWith('/visual.json')).map((f) => JSON.parse(String(files[f]))), by = Object.fromEntries(vs.map((v) => [v.name, v]));
        return vs.map((v) => { const g = v.parentGroupName ? by[v.parentGroupName].position : { x: 0, y: 0 }; return { v, x: v.position.x + g.x, y: v.position.y + g.y, w: v.position.width, h: v.position.height }; });
      };
      const WANT = { 'wide.png': { '1920x1080': [1692, 192, 48], '1280x720': [1128, 128, 32] }, 'square.png': { '1920x1080': [1836, 48, 48], '1280x720': [1224, 32, 32] },
        'tall.png': { '1920x1080': [1865, 19, 48], '1280x720': [1243, 13, 32] }, 'wide.jpg': { '1920x1080': [1344, 540, 48], '1280x720': [896, 360, 32] } };
      const off = [];
      for (const [file, boxes] of Object.entries(WANT)) for (const [pg, [x, w0, h]] of Object.entries(boxes)) for (const lang of ['en', 'ar']) {
        // mirrored for Arabic; the engine rounds a box's edges, not its size, so the tall logo's 19.5 is 20 wide there
        const w = lang === 'ar' && file === 'tall.png' && pg === '1920x1080' ? 20 : w0;
        const bytes = new Uint8Array(fs.readFileSync(path.join(LOGOS, file))), size = typeof E.imageSize === 'function' ? E.imageSize(bytes) : null;
        const d = std(pg), k = E.page(d.layout).h / 1080, PW = E.page(d.layout).w;
        const b = build(d, lang, { second: true, panel: false, logoRatio: size ? size.w / size.h : undefined }, { logo: { bytes, ext: file.slice(-3) } });
        const first = Object.keys(b.files).filter((f) => f.endsWith('/visual.json')).map((f) => f.split('/pages/')[1].split('/')[0])[0];
        const all = abs(Object.fromEntries(Object.entries(b.files).filter(([f]) => f.includes('/pages/' + first + '/'))));
        const img = all.find((a) => a.v.visual && a.v.visual.visualType === 'image'), tag = `${file} ${pg} ${lang}`;
        // the page buttons' box: the navigator, or (round 2, right to left) the single page buttons together
        const pb = all.filter((a) => a.v.visual && (a.v.visual.visualType === 'pageNavigator' || (a.v.visual.visualType === 'actionButton' && /PageNavigation/.test(JSON.stringify(a.v.visual.visualContainerObjects.visualLink || '')))));
        const nav = pb.length ? { x: Math.min(...pb.map((a) => a.x)), w: Math.max(...pb.map((a) => a.x + a.w)) - Math.min(...pb.map((a) => a.x)) } : null;
        if (!img) { off.push(`${tag}: no image visual`); continue; }
        const wantX = lang === 'ar' ? PW - x - w0 : x, o = img.v.visual.objects || {};
        if (img.x !== wantX || img.w !== w || img.h !== h) off.push(`${tag}: logo box ${img.x}, ${img.w} x ${img.h}, want ${wantX}, ${w} x ${h}`);
        if (((o.image || [])[0] || { properties: {} }).properties.fit?.expr.Literal.Value !== "'Fit'" || o.imageScaling) off.push(`${tag}: scaling ${JSON.stringify(o.image || o.imageScaling)}, want image.fit 'Fit' only`);
        if (!nav || Math.abs((lang === 'ar' ? nav.x - (img.x + img.w) : img.x - (nav.x + nav.w)) - 24 * k) > 1) off.push(`${tag}: page buttons ${nav ? nav.x + ', ' + nav.w + ' wide' : 'missing'} are not 24k from the logo at ${img.x}`);
        const lp = layoutProblems(b.files); if (lp.sizes.length || lp.phone.length) off.push(`${tag}: ${lp.sizes[0] || lp.phone[0]}`);
      }
      check(!off.length, `logo boxes wrong in ${off.length} of 16 builds, e.g. ${off.slice(0, 3).join(' | ')}`);
    }
  }

  const run = async (lang, name, setup) => {
    const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
    await v.pg.goto(`${url}${PAGE}?lang=${lang}`, { waitUntil: 'networkidle' });
    await v.pg.evaluate((n) => { const s = JSON.parse(localStorage.getItem('dataarcus-theme-generator') || '{}'); s.name = n;
      s.layout = { v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', headLine: 'full', samples: true, transparent: true, preset: 'exec', kpis: 4, filters: true, fpos: 'top', page: '1920x1080' };
      localStorage.setItem('dataarcus-theme-generator', JSON.stringify(s)); }, name);
    await v.pg.reload({ waitUntil: 'networkidle' });
    const picked = await setup(v.pg);
    const [dl] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('#pbipBtn')]);
    const files = unzip(fs.readFileSync(await dl.path()));
    const msg = await v.pg.$eval('#pbipOwnMsg', (e) => e.textContent).catch(() => '');
    if (v.errs.length) problems.push(`${lang} ${name}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
    return { files, picked, msg };
  };
  // the round 0 checks on a download from the page (run's layout has the accent bar on top, so no side inset; a new
  // visitor's default design has it at the side: insets 26 on 1920 x 1080)
  const round0 = (files, rtl, insets) => {
    const a = tooltipProblems(files), t = tooltipPageProblems(files), tb = tableProblems(files, rtl), cd = cardStyleProblems(files, rtl, insets);
    // the page's download always has a transparent theme and a background image that draws the panels: no visual
    // may leave its panel to the theme there
    const pp = panelProblems(files);
    return a.bad.slice(0, 1).map((x) => `tooltip link (${a.bad.length} of ${a.charts}): ${x}`).concat(t.bad.slice(0, 1), tb.bad.slice(0, 1).map((x) => `table (${tb.bad.length} of ${tb.columns}): ${x}`),
      cd.bad.slice(0, 1).map((x) => `cards (${cd.bad.length} on ${cd.cards}): ${x}`), projectProblems(files),
      pp.solid || pp.bad.length ? [`panels: the download's theme is ${pp.solid ? 'solid' : 'transparent'}, ${pp.bad.length} visuals wrong: ${pp.bad[0] || ''}`] : []);
  };
  // each bar, column or line chart of a download: mirrored (round 13's mirrorChart: a bar's value axis inverted, a column
  // or line chart's value axis switched to the right) or not
  const mirrorOf = (files) => Object.entries(files).filter(([n]) => /\/visual\.json$/.test(n)).map(([, t]) => { try { return JSON.parse(t); } catch (e) { return null; } })
    .filter((v) => v && v.visual && /^(clusteredBarChart|clusteredColumnChart|lineChart)$/.test(v.visual.visualType))
    .map((v) => { const va = (((v.visual.objects || {}).valueAxis || [])[0] || {}).properties || {}, on = (x) => !!x && x.expr && x.expr.Literal && x.expr.Literal.Value === 'true';
      return { type: v.visual.visualType, mirrored: v.visual.visualType === 'clusteredBarChart' ? on(va.invertAxis) : on(va.switchAxisPosition) }; });
  const picker = async (pg) => {
    await pg.waitForFunction(() => document.querySelectorAll('#pbipMap select').length > 0, null, { timeout: 15000 });
    return pg.$$eval('#pbipMap select', (ss) => ss.map((s) => (s.value ? s.options[s.selectedIndex].text.replace(/[\u2068\u2069]/g, '') : '')));
  };

  // 1. Local project, named like their model: the new report gets its own name, next to their folder
  {
    const { files, picked, msg } = await run('en', 'Sales', async (pg) => {
      await pg.selectOption('#pbipData', 'local');
      check(await pg.isVisible('#pbipFolder >> xpath=..') && !(await pg.isVisible('#pbipWs')), 'local: the folder picker is not the one shown');
      await pg.setInputFiles('#pbipFolder', PROJECT);
      return picker(pg);
    });
    const names = Object.keys(files);
    check(names.includes('Sales - New design.pbip') && names.every((n) => n.startsWith('Sales - New design.')), `local: files outside the new report: ${names.filter((n) => !n.startsWith('Sales - New design.')).join(', ')}`);
    check(!names.some((n) => /^Sales\.(Report|SemanticModel)\//.test(n) || n === '.gitignore' || n === 'README.md'), 'local: the download would replace something in their project');
    const pbir = JSON.parse(files['Sales - New design.Report/definition.pbir'] || '{}');
    check(pbir.datasetReference?.byPath?.path === '../Sales.SemanticModel', `local: report points at ${JSON.stringify(pbir.datasetReference)}`);
    check(/Sales\.SemanticModel\u2069?: 3 tables, 3 measures/.test(msg) || /Unzip it into the folder that holds Sales\.SemanticModel/.test(msg), `local: message "${msg}"`);
    // suggestions: base measures before variants, the hidden helper and the automatic date table left out,
    // the month from the date table on the trend, keys never offered as categories
    check(picked[0] === 'Total Sales' && picked[1] === 'Orders' && picked[4] === 'Total Sales' && picked[5] === 'Month Name', `local: suggestions ${picked.join(' | ')}`);
    check(picked[3] === '', `local: a 4th KPI card with only 3 measures should stay empty, got "${picked[3]}"`);
    check(!picked.some((p) => /Helper|Key|LocalDate/.test(p)), `local: hidden or key fields suggested: ${picked.join(' | ')}`);
    const sl = picked.slice(-3).filter(Boolean);
    check(sl.length === 3 && new Set(sl).size === 3, `local: slicers should be three different fields: ${sl.join(' | ')}`);
    check(picked.includes("Customer's City") || picked.includes('المنطقة'), `local: no category column suggested: ${picked.join(' | ')}`);
    const rs = refs(files);
    check(rs.length > 20, `local: only ${rs.length} fields bound`);
    const bad = rs.filter((r) => !(LOCAL[r.kind][r.t] || []).includes(r.n));
    check(!bad.length, `local: fields not in the model: ${bad.map((r) => `${r.kind} ${r.t}[${r.n}]`).join(', ')}`);
    const cr = cardProblems(files, false);
    check(cr.cards >= 5 && !cr.bad.length, `local: ${cr.cards} cardVisual; ${cr.bad.slice(0, 4).join('; ')}`);
    const lp = layoutProblems(files);
    check(!lp.phone.length && !lp.sizes.length, `local: phone ${lp.phone.slice(0, 2).join('; ')} | sizes ${lp.sizes.slice(0, 2).join('; ')}`);
    // round 0, on the page's own download: chart tooltips, the tooltip page, table headers, cards, the project shell
    const r0 = round0(files, false);
    check(!r0.length, `local, round 0: ${r0.slice(0, 4).join(' | ')}`);
    const charts = mirrorOf(files);
    check(charts.length >= 2 && charts.every((c) => !c.mirrored), `local (English): charts mirrored ${JSON.stringify(charts)}`);
  }

  // 2. Published model, Arabic page: live connection, fields read from a .pbit
  {
    const { files, picked } = await run('ar', 'Exec Board', async (pg) => {
      await pg.selectOption('#pbipData', 'service');
      await pg.fill('#pbipWs', 'Sales "EU"'); await pg.fill('#pbipModelName', 'Contoso Model');
      await pg.setInputFiles('#pbipModelFile', PBIT);
      return picker(pg);
    });
    const pbir = JSON.parse(files['Exec Board/Exec Board.Report/definition.pbir'] || '{}');
    check(pbir.datasetReference?.byConnection?.connectionString === 'Data Source="powerbi://api.powerbi.com/v1.0/myorg/Sales ""EU""";initial catalog="Contoso Model";access mode=readonly;integrated security=ClaimsToken',
      `service: connection ${JSON.stringify(pbir.datasetReference)}`);
    check(!Object.keys(files).some((n) => /\.SemanticModel\//.test(n)), 'service: a live report must not carry a model of its own');
    check(picked.filter(Boolean).length >= 10, `service: few suggestions ${picked.join(' | ')}`);
    check(refs(files).length > 20, 'service: fields not bound');
    const cr = cardProblems(files, true);
    check(cr.cards >= 5 && !cr.bad.length, `service (Arabic): ${cr.cards} cardVisual; ${cr.bad.slice(0, 4).join('; ')}`);
    const lp = layoutProblems(files);
    check(!lp.phone.length && !lp.sizes.length, `service (Arabic): phone ${lp.phone.slice(0, 2).join('; ')} | sizes ${lp.sizes.slice(0, 2).join('; ')}`);
    const r0 = round0(files, true);
    check(!r0.length, `service (Arabic), round 0: ${r0.slice(0, 4).join(' | ')}`);
    // round 15 (the owner's go on round 13's recommendation 2b): the Arabic download's charts are mirrored too (the
    // engine's chartAxes "mirrored": value axis at the right, bars from the right)
    const charts = mirrorOf(files);
    check(charts.length >= 2 && charts.every((c) => c.mirrored), `service (Arabic): charts not mirrored ${JSON.stringify(charts)}`);
  }

  // 4. A copy of the model with the same name further down (a backup): the report and its fields come from the
  //    model at the top of the chosen folder, not a mix of the two
  {
    const dir = project((d) => {
      fs.mkdirSync(path.join(d, 'backup', 'Sales.SemanticModel'), { recursive: true });
      fs.writeFileSync(path.join(d, 'backup', 'Sales.SemanticModel', 'model.bim'), JSON.stringify({ model: { tables: [{ name: 'Old Sales', measures: [{ name: 'Legacy Revenue' }, { name: 'Legacy Orders' }], columns: [{ name: 'Old Region', dataType: 'string' }, { name: 'Old Date', dataType: 'dateTime' }] }] } }));
    });
    let note = '';
    const { files, picked, msg } = await run('en', 'Board', async (pg) => {
      await pg.selectOption('#pbipData', 'local'); await pg.setInputFiles('#pbipFolder', dir);
      const p = await picker(pg); note = await pg.$eval('#pbipOwnMsg', (e) => e.textContent); return p;
    });
    const bad = refs(files).filter((r) => !(LOCAL[r.kind][r.t] || []).includes(r.n));
    check(!bad.length && !picked.some((p) => /Legacy|Old /.test(p)), `backup copy: fields from the other model: ${bad.map((r) => `${r.kind} ${r.t}[${r.n}]`).concat(picked.filter((p) => /Legacy|Old /.test(p))).join(', ')}`);
    check(/proj\/Sales\.SemanticModel\u2069? \(2 models/.test(note), `backup copy: the message does not say which model is used: "${note}"`);
    check(JSON.parse(files['Board.Report/definition.pbir'] || '{}').datasetReference?.byPath?.path === '../Sales.SemanticModel' && /holds Sales\.SemanticModel \(proj\)/.test(msg), `backup copy: report or message "${msg}"`);
  }

  // 5. Their folder already has reports with the name of the design (Exec.Report, Exec.pbip, and even
  //    "Exec - New design.Report"): the download takes a free name, so unzipping it replaces nothing
  {
    const dir = project((d) => {
      for (const r of ['Exec', 'exec - new design']) {
        fs.mkdirSync(path.join(d, r + '.Report'), { recursive: true });
        fs.writeFileSync(path.join(d, r + '.Report', 'definition.pbir'), fs.readFileSync(path.join(d, 'Sales.Report', 'definition.pbir')));
      }
      fs.writeFileSync(path.join(d, 'Exec.pbip'), '{}');
    });
    const { files } = await run('en', 'Exec', async (pg) => { await pg.selectOption('#pbipData', 'local'); await pg.setInputFiles('#pbipFolder', dir); return picker(pg); });
    const names = Object.keys(files), clash = names.filter((n) => fs.existsSync(path.join(dir, n)) || /^(exec|exec - new design|sales)\.(pbip$|report\/)/i.test(n));
    check(!clash.length && names.includes('Exec - New design 2.pbip'), `existing reports: the download would replace ${clash.slice(0, 3).join(', ') || 'nothing, but is named ' + names.find((n) => n.endsWith('.pbip'))}`);
  }

  // 6. Local project, then a published model's .pbit, then back to local: the download uses the local model's
  //    fields again (not the .pbit's), and each choice keeps its own
  {
    let back = [];
    const { files } = await run('en', 'Switch', async (pg) => {
      await pg.selectOption('#pbipData', 'local'); await pg.setInputFiles('#pbipFolder', PROJECT); const first = await picker(pg);
      await pg.selectOption('#pbipData', 'service'); await pg.setInputFiles('#pbipModelFile', PBIT);
      await pg.waitForFunction(() => /\.pbit/.test(document.getElementById('pbipOwnMsg').textContent), null, { timeout: 15000 });
      await pg.selectOption('#pbipData', 'local'); back = await picker(pg);
      check(back.join() === first.join(), `switching: the local picker came back as ${back.join(' | ')}`);
      return back;
    });
    const bad = refs(files).filter((r) => !(LOCAL[r.kind][r.t] || []).includes(r.n));
    check(!bad.length, `switching: the local report uses fields of the other model: ${bad.slice(0, 5).map((r) => `${r.kind} ${r.t}[${r.n}]`).join(', ')}`);
  }

  // 7. More KPI cards after the model is loaded (4 -> 6): the picker gets a row per card, and no card repeats another's KPI
  {
    let rows = 0;
    const { files } = await run('en', 'Cards', async (pg) => {
      await pg.selectOption('#pbipData', 'local'); await pg.setInputFiles('#pbipFolder', PROJECT); await picker(pg);
      await pg.click('#layControls button[data-l="kpis"][data-v="6"]');
      rows = await pg.$$eval('#pbipMap select[data-path^="kpis."]', (ss) => ss.length);
      return picker(pg);
    });
    check(rows === 6, `more KPI cards: the picker has ${rows} KPI rows for 6 cards`);
    const pages = {};
    Object.entries(files).filter(([n]) => n.endsWith('/visual.json')).forEach(([n, b]) => {
      const v = JSON.parse(b.toString('utf8')), t = v.visual && v.visual.visualContainerObjects && v.visual.visualContainerObjects.title;
      if (!(t && t[0].properties.bold)) return;   // KPI cards are the visuals with a bold title
      const m = JSON.stringify(v.visual.query || null), pgName = n.split('/pages/')[1].split('/')[0];
      if (v.visual.query) (pages[pgName] = pages[pgName] || []).push(m);
    });
    const rep = Object.values(pages).filter((l) => new Set(l).size !== l.length);
    check(Object.keys(pages).length && !rep.length, `more KPI cards: a KPI repeats on a page (${Object.values(pages).map((l) => l.length).join(', ')} bound cards)`);
  }

  // 8. An older project whose model folder is Sales.Dataset: read, and the report points at it
  {
    const dir = project((d) => fs.renameSync(path.join(d, 'Sales.SemanticModel'), path.join(d, 'Sales.Dataset')));
    const { files } = await run('en', 'Sales', async (pg) => { await pg.selectOption('#pbipData', 'local'); await pg.setInputFiles('#pbipFolder', dir); return picker(pg); });
    const pbir = JSON.parse(files['Sales - New design.Report/definition.pbir'] || '{}');
    check(pbir.datasetReference?.byPath?.path === '../Sales.Dataset', `.Dataset folder: report points at ${JSON.stringify(pbir.datasetReference)}`);
  }

  // 3. Missing inputs stop the download with a message instead of a broken project
  {
    const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
    await v.pg.goto(`${url}${PAGE}?lang=en`, { waitUntil: 'networkidle' });
    let got = false; v.pg.on('download', () => { got = true; });
    for (const m of ['local', 'service']) {
      await v.pg.selectOption('#pbipData', m); await v.pg.click('#pbipBtn'); await v.pg.waitForTimeout(300);
      check(!got && /first|Type the/.test(await v.pg.$eval('#toast', (e) => e.textContent)), `${m} with nothing filled in: downloaded ${got}`);
    }
    // the sample download still carries its own model with data
    await v.pg.selectOption('#pbipData', 'sample');
    const [dl] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('#pbipBtn')]);
    const files = unzip(fs.readFileSync(await dl.path())), bim = Object.keys(files).find((n) => n.endsWith('.SemanticModel/model.bim'));
    check(!!bim && JSON.parse(files[bim]).model.tables.length === 1, 'sample: no sample model in the download');
    // the README says how to check the report in Power BI, pointing at this project's own theme folder
    const readme = Object.keys(files).find((n) => n.endsWith('/README.md'));
    const rt = readme ? files[readme].toString('utf8') : '', base = readme ? readme.split('/')[0] : '';
    check(/## Check it in Power BI/.test(rt) && rt.includes(base + '.Report/StaticResources/RegisteredResources'), 'sample: README has no Power BI check steps');
    check(/Hover any chart/.test(rt) && !/Hover the main chart/.test(rt), 'sample: the README should say every chart shows the tooltip page');
    const r0 = round0(files, false, [26, 26]);
    check(!r0.length, `sample, round 0: ${r0.slice(0, 4).join(' | ')}`);
    // a tall logo attached on the page: its box takes the logo's shape (19 x 48 at the header's far edge), the image is
    // not stretched, and the page says a horizontal logo would read better; a wide logo gets no such note
    if (v.errs.length) problems.push(`inputs: ${v.errs.join(' | ')}`);
    await v.ctx.close();
    for (const [file, w, tall] of [['tall.png', 19, true], ['wide.png', 192, false]]) {
      let note = '';
      const { files: f2 } = await run('en', 'Logo', async (pg) => {
        await pg.selectOption('#pbipData', 'sample');
        await pg.setInputFiles('#pbipLogo', path.join(HERE, 'fixtures', 'logos', file));
        await pg.waitForFunction((f) => document.getElementById('pbipLogoName').textContent.includes(f), file, { timeout: 15000 });
        note = await pg.$eval('#pbipLogoName', (e) => e.textContent);
        return [];
      });
      const img = Object.keys(f2).filter((n) => n.endsWith('/visual.json')).map((n) => JSON.parse(f2[n].toString('utf8'))).filter((x) => x.visual && x.visual.visualType === 'image');
      const fit = img.length ? JSON.stringify(img[0].visual.objects.image || img[0].visual.objects.imageScaling) : '';
      check(img.length >= 1 && img.every((x) => x.position.width === w && x.position.height === 48) && /'Fit'/.test(fit) && !img[0].visual.objects.imageScaling,
        `${file} on the page: ${img.length} image visuals ${img.map((x) => x.position.width + ' x ' + x.position.height).join(', ')} (want ${w} x 48), scaling ${fit}`);
      check(/horizontal version will read much better/.test(note) === tall, `${file} on the page: note "${note}"`);
    }
  }
  return { checks, problems };
}
