import './test-env.mjs';
// 0.3.2 SP29 (the split, finish: B-280, B-286; mcp/work/SP29.md). A characterisation suite: the design engine's layout
// geometry, typography and saved designs give, for 12 made-up designs, 400 seeded random layouts and 20 broken saves,
// exactly what they gave on the base (integration/0.3.2 at 39c46bb, before they moved to assets/js/design-metrics.js
// and assets/js/design-state.js). Recorded on the base in fixtures/sp29-design.json (sha256 and length of each result);
// SP29_RECORD=1 records them again (only on the base, never to make a run pass). B1 compares the same results with the
// base engine itself (its four files saved in mcp/fixtures/hk1/sp29, 39c46bb's bytes) in the same process.
//   D1-D12  a design's page, sizes, slots (every option), report pages, panel, rail fit, text sizes, theme, background
//   G1      the geometry on 400 seeded random layouts;  S1  repairState on 20 broken saves, upgrade, fresh, SCHEMA
//   I1      imageSize on made-up bytes;  B1  the base engine, live;  K1  the facade's names
//   F1, M1  (after the first move) the metrics are DAMetrics' own; design-metrics.js has no DOM, storage or locale global
//   F2, M2  (after the second move) the same for design-state.js
//   node test-0.3.2-sp29.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 24) + ':' + b.length;
const js = (x) => sha(Buffer.from(JSON.stringify(x === undefined ? null : x), 'utf8'));
const GOLD = path.join(HERE, 'fixtures', 'sp29-design.json');
const E = require('../assets/js/design-engine.js');
// (HK1, 0.3.3) the base's four files are saved copies (mcp/fixtures/hk1/sp29, the commit 39c46bb's bytes), not git reads
const BASE = '39c46bb';

// a seeded random source (mulberry32): the same 400 layouts on every machine
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---------- the facts, for any engine (this one, or the base's in B1) ----------
const ADDED_SINCE = ['pageFill'];
// (0.3.3 FB1, changed on purpose) a page whose row of KPI cards lies over its shortened rail (fitSlots keeps that
// arrangement where pageFill measures the page better filled, mcp/work/FB1.md) is placed differently from the base on
// purpose: by the engine of today (never the base's), such a fit is this one line in G1, for the base's facts too, so
// every other layout is still the base's byte for byte; the arrangement itself is pinned by test-0.3.3-fb1.mjs and L1
// (0.3.3 FB3, changed on purpose, the same way) a page whose text box lies under its shortened rail (fitSlots' tuckText,
// kept where pageFill measures a smaller hole, mcp/work/FB3.md) and whose cards are not over the rail is one line too,
// counted by L2; a page with both is counted as lifted, as before
const LIFTED = 'the cards over the rail (0.3.3 FB1)', LIFTED_FITS = 122, TUCKED = 'the text box under the rail (0.3.3 FB3)', TUCKED_FITS = 21;
const lifted = (slots, opt) => { const f = E.fitSlots(slots, opt).slots, rail = f.find((x) => x.kind === 'slicer' && x.stack), k = f.find((x) => x.kind === 'kpi'), t = f.find((x) => x.kind === 'text'); if (rail && k && rail.y >= k.y + k.h) { liftedCount++; return LIFTED; }
  if (rail && t && Math.abs(t.x - rail.x) <= 1 && t.y >= rail.y + rail.h) { tuckedCount++; return TUCKED; } return null; };
let liftedCount = 0, tuckedCount = 0;   // counted over one facts() run: reset before each
const facts = (E) => {
  const design = (preset, chart, layout) => { const d = E.fresh(); d.preset = preset; d.data = E.PRESETS[preset].data.slice(); d.ui = Object.assign({}, E.PRESETS[preset].ui); d.chart = chart; d.name = 'SP29 ' + preset; E.repairState(d); Object.assign(d.layout, layout); return d; };
  const DESIGNS = [
    ['D1 DataArcus glass EN 1920', () => design('DataArcus', { look: 'glass' }, { page: '1920x1080' }), 'en'],
    ['D2 DataArcus plain AR 1280', () => design('DataArcus', { look: 'auto' }, { page: '1280x720', preset: 'analysis', filters: true }), 'ar'],
    ['D3 Corporate glass AR 1920 banded', () => design('Corporate', { look: 'glass', table: 'banded' }, { page: '1920x1080', preset: 'ops', kpis: 6 }), 'ar'],
    ['D4 Corporate plain EN 960', () => design('Corporate', { table: 'minimal', grid: 'dotted' }, { page: '960x720', preset: 'focus', shadow: false }), 'en'],
    ['D5 Midnight glass EN 1280', () => design('Midnight', { look: 'glass', legend: 'Bottom' }, { page: '1280x720', radius: 16 }), 'en'],
    ['D6 Midnight glass AR 1920 rtl', () => design('Midnight', { look: 'glass', labels: 'on' }, { page: '1920x1080', dir: 'rtl', preset: 'analysis', filters: true, fpos: 'top' }), 'ar'],
    ['D7 Desert Gulf plain AR 1920', () => design('Desert Gulf', { look: 'auto', table: 'banded' }, { page: '1920x1080', kpiBar: 'top', headLine: 'full' }), 'ar'],
    ['D8 Desert Gulf glass EN custom', () => design('Desert Gulf', { look: 'glass' }, { page: 'custom', pageW: 1600, pageH: 900, transparent: true }), 'en'],
    ['D9 Colorblind glass EN 960 no shadow', () => design('Colorblind safe', { look: 'glass', table: 'banded' }, { page: '960x720', shadow: false, kpis: 2 }), 'en'],
    ['D10 a broken saved design, glass AR', () => E.repairState({ data: ['#zz', '#123', 'red', '#00ff00', '#abc', '#ffffff', '#000000', '#808080'], ui: { background: 'nope', card: '#fafafa', text: '#111' }, chart: { look: 'glass' }, layout: { page: '1280x720' } }), 'ar'],
    ['D11 Earthy small 700 x 400 exec, filters end, fa', () => design('Earthy', { look: 'auto', axis: 'off' }, { page: 'custom', pageW: 700, pageH: 400, preset: 'exec', filters: true, fpos: 'end', kpis: 1, kpiBar: 'bottom' }), 'fa-IR'],
    ['D12 a v1 save at 3840 x 2160', () => E.repairState({ data: E.PRESETS.Midnight.data.slice(), ui: Object.assign({}, E.PRESETS.Midnight.ui), name: 'Old save', font: 'Tahoma', chart: { look: 'auto', legend: 'Right' }, layout: { radius: 12, accentBar: false, page: 'custom', pageW: 3840, pageH: 2160, kpiCards: 2, kpis: 4, preset: 'exec', filters: true, fpos: 'start', hh: 90, fw: 300, kpiH: 150, mainW: 70, split: 35, kpiBarW: 8, headLineW: 2 } }), 'en']
  ];
  const RAIL = { n: 3, minH: 40, maxH: 64, resetH: 30, pad: 10, gap: 8 };
  const geometry = (c, lang, r) => {
    const PW = E.pw(c), slots = E.computeSlots(c, lang), proj = E.projectSlots(c, lang, { tableFields: 6 });
    return {
      page: E.page(c), pw: PW, pngSize: E.pngSize(c), sizes: E.sizes(c, PW), rtl: E.rtl(c, lang), small: E.smallPage(c), isSmall: E.isSmall(c), fit: E.fitLayout(c), preview: E.isPreview(c),
      slots, slotsLogo: E.computeSlots(c, lang, { logoRatio: r ? 0.5 + r() * 4 : 2.5 }), slotsTable: E.computeSlots(c, lang, { tableFields: 7 }), slotsNoTime: E.computeSlots(c, lang, { noTime: true }),
      proj, boxes: slots.map((s) => E.boxOf(s, c)), toPage: [0, 1, 13, 359.5, 720].map((v) => E.toPage(v, c)),
      pages: E.projectPages(c, lang, { second: true, panel: true, maxKpis: 2, logoRatio: 3, tableFields: 5 }), pagesPlain: E.projectPages(c, lang, {}), pagesNoTime: E.projectPages(c, lang, { second: true, noTime: true }),
      panel: E.slidePanel(c, lang), second: E.secondLayout(c),
      kpi: [E.kpiInset(c), E.barW('kpiBarW', c), E.barW('headLineW', c), E.c0(c)],
      ranges: Object.keys(E.RANGE).map((k) => [k, E.rangeOf(k, PW, c), E.clampTo(k, 1e6, PW, c), E.clampTo(k, -5, PW, c), E.clampTo(k, '33.4', PW, c)]),
      fitDrop: E.fitSlots(proj, { dropKinds: ['line', 'text'] }), fitHead: E.fitSlots(proj, { headerRows: 40 }), fitRail: lifted(proj, { railItems: RAIL, dropKinds: ['donut'] }) || E.fitSlots(proj, { railItems: RAIL, dropKinds: ['donut'] }),
      fitGrid: lifted(slots, E.fitScale({ headerRows: 30, railItems: RAIL }, 1 / E.page(c).s)) || E.fitSlots(slots, E.fitScale({ headerRows: 30, railItems: RAIL }, 1 / E.page(c).s)),
      text: [8, 10, 12, 18, 28, 60].map((n) => [E.fs(n, c), E.sizeAt(n, E.page(c).h)]), scale: E.textScale(E.page(c).h)
    };
  };
  const out = {};
  for (const [name, make, lang] of DESIGNS) {
    const d = make(), th = E.buildTheme(d, lang), slots = E.computeSlots(d.layout, lang);
    const g = geometry(d.layout, lang, null);
    out[name] = Object.assign({}, Object.fromEntries(Object.entries(g).map(([k, v]) => [k, js(v)])), {
      design: js(d), theme: js(th), themeScale: js(E.themeScaleOf(th)), scaled: js(E.scaleTheme(th, 0.8)), scaledUp: js(E.scaleTheme(th, 1.7)),
      svg: js(E.bgSvg(d, slots, { preview: true, overlay: (s) => `<g data-n="${s.length}"/>` }, lang)), svgPlain: js(E.bgSvg(d, slots, {}, lang)), checks: js(E.contrastChecks(d))
    });
  }
  // G1: 400 seeded random layouts, the geometry of each
  {
    const r = rng(29), pick = (a) => a[Math.floor(r() * a.length)], maybe = (v, p) => (r() < (p || 0.5) ? v : undefined);
    const all = [];
    for (let i = 0; i < 400; i++) {
      const page = pick(['1280x720', '1920x1080', '960x720', 'custom', 'custom', 'nope']);
      const c = { v: 3, page, pageW: Math.round(500 + r() * 3600), pageH: Math.round(300 + r() * 2000), preset: pick(Object.keys(E.LAYOUTS)), kpis: Math.floor(r() * 8) - 1, filters: r() < 0.5,
        fpos: pick(['start', 'end', 'top', 'side']), dir: pick(['', 'ltr', 'rtl']), radius: Math.round(r() * 24), shadow: r() < 0.5, header: r() < 0.8, kpiBar: pick(['start', 'top', 'bottom', 'none']),
        headLine: pick(['short', 'full', 'none']), transparent: r() < 0.2, wideTable: maybe(false, 0.3), noTime: maybe(true, 0.3), detail: maybe(true, 0.2),
        hh: maybe(Math.round(20 + r() * 100)), logoW: maybe(Math.round(50 + r() * 400)), fw: maybe(Math.round(100 + r() * 300)), fh: maybe(Math.round(30 + r() * 120)), kpiH: maybe(Math.round(40 + r() * 160)),
        mainW: maybe(Math.round(20 + r() * 70)), split: maybe(Math.round(20 + r() * 60)), kpiBarW: maybe(Math.round(r() * 10)), headLineW: maybe(Math.round(r() * 10)) };
      Object.keys(c).forEach((k) => { if (c[k] === undefined) delete c[k]; });
      all.push(geometry(c, pick(['en', 'ar', 'ar-AE', 'fa', 'he', 'fr', '']), r));
    }
    out.G1 = { all: js(all), each: all.map((x, i) => (i % 50 === 0 ? js(all.slice(i, i + 50)) : null)).filter(Boolean),
      layouts: js(Object.keys(E.LAYOUTS).map((k) => [k, E.LAYOUTS[k], E.noTimeOf(E.LAYOUTS[k]), E.hasMain(E.LAYOUTS[k]), E.hasSplit(E.LAYOUTS[k])])),
      fits: js(['bar', 'column', 'donut', 'line'].flatMap((k) => [[200, 150], [600, 400], [1200, 700], [90, 60]].map(([w, h]) => E.categoryFit(k, w, h)))),
      weights: js([undefined, null, 0, 3, 4, 5, 6, 8, 12, '7', 'x'].map((n) => E.tableWeight(n))), custom: js([[0, 0], [100, 100], [5000, 500], [640, 1000], [1366, 768], ['a', null], [3840, 2160]].map(([w, h]) => E.fitCustom(w, h))),
      label: js([['en', 'ar', 'ar-SA', 'AR_ae', 'fr', null].map((l) => [E.label(E.LAYOUTS.exec.name, l), E.label(['A', 'B'], l), E.label('plain', l), E.label({ en: 'x' }, l)])]),
      consts: js([E.M, E.G, E.HH, E.PAGES, E.DEFAULT_PAGE, E.LIM, E.RANGE, E.SMALL_PAGE, E.TABLE_NEED, E.CATEGORY_KINDS, E.CATEGORY_FIT, E.LAYOUT_PREVIEW, E.SLOT_GAP, E.REFLOW_KEEP, E.FHD_TEXT, E.TEXT_BASES, E.RTL_LANGS, E.KINDS]),
      scaleOf: js([null, {}, { visualStyles: {} }, { visualStyles: { tableEx: { '*': { values: [{ fontSize: 13 }] } } } }].map((t) => E.themeScaleOf(t))) };
  }
  // S1: saved designs: 20 broken saves, what the repair says and returns; upgrade; fresh; the schema
  {
    const big = 'ن'.repeat(70) + 'x'.repeat(5000);
    const saves = [
      () => null, () => 7, () => ({}), () => ({ data: [] }), () => ({ data: new Array(8).fill('#fff') }),
      () => ({ data: E.PRESETS.Earthy.data.slice(), ui: 'red', name: 42, font: 'Comic Sans', preset: 'Nope' }),
      () => ({ data: E.PRESETS.Earthy.data.slice(), name: big, chart: { look: 'shiny', labels: 'on', colour: 'x' }, layout: { v: 2, preset: 'grid', kpis: 9, dir: 'up', radius: 99, page: '4k' } }),
      () => ({ data: E.PRESETS.Corporate.data.slice(), chart: 'bad', layout: { kpiCards: 2, kpis: 4, filters: 'yes', shadow: 1, header: null, samples: 'no', transparent: 0 } }),
      () => ({ data: E.PRESETS.Corporate.data.slice(), layout: { hh: 'tall', logoW: NaN, fw: '200', fh: Infinity, kpiH: null, mainW: 'x', split: [], kpiBarW: {}, headLineW: '3', pageW: 'w', pageH: 900 } }),
      () => ({ data: E.PRESETS.Midnight.data.slice(), layout: { kpiBarC: 'pink', headLineC: 'good', fpos: 'middle', wideTable: 'no', phoneLayout: 1, kpiBar: 'left', headLine: 'thick' } }),
      () => ({ data: E.PRESETS.Midnight.data.slice(), layout: { radius: 12, accentBar: false } }),
      () => ({ data: E.PRESETS.Midnight.data.slice(), layout: { radius: 14, accentBar: true, v: 0 } }),
      () => ({ data: E.PRESETS.Midnight.data.slice(), layout: { v: 2, kpiBar: 'top' } }),
      () => ({ data: E.PRESETS.Midnight.data.slice(), layout: { v: 3, page: 'custom', pageW: 1000, pageH: 1000 } }),
      () => ({ data: E.PRESETS.Midnight.data.slice(), layout: { kpiCards: 'x', kpis: 3 } }),
      () => ({ data: E.PRESETS.Midnight.data.slice(), layout: { kpiCards: 5, kpis: 3, preset: 'ops' } }),
      () => ({ data: ['#0f0', '#00FF00', ' #abcdef ', 'rgb(1,2,3)', null, 5, '#12345', '#a1b2c3'], ui: { background: '#000', card: null, text: 'white', accent: '#ABC', good: '', neutral: '#123456', bad: '#zzzzzz', extra: '#fff' }, preset: null, name: '  ' }),
      () => ({ data: E.PRESETS.DataArcus.data.slice(), name: 'café ☕ دمج', font: 'Segoe UI Semibold', preset: 'Desert Gulf', chart: { look: 'glass', table: 'banded', grid: 'off', legend: 'TopCenter', axis: 'off' } }),
      () => ({ data: E.PRESETS.DataArcus.data.slice(), layout: [] }),
      () => ({ data: E.PRESETS.DataArcus.data.slice(), layout: { preset: 'focus', kpis: '2', radius: '8' } })
    ];
    const rows = saves.map((s) => { const said = []; const got = E.repairState(s(), (x) => said.push(x)); return [got, said, E.repairState(s())]; });
    const ups = [undefined, null, {}, { radius: 12 }, { radius: 14, accentBar: false }, { v: 1, radius: 12 }, { v: 2 }, { v: 2, page: '960x720' }, { v: 3, page: 'x' }, { v: 4 }].map((l) => E.upgrade(l === undefined || l === null ? l : JSON.parse(JSON.stringify(l))));
    out.S1 = { rows: js(rows), each: rows.map((x) => js(x)), upgrade: js(ups), fresh: js(E.fresh()), schema: js([E.SCHEMA, E.DESIGN_KEYS, E.LAYOUT_KEYS, E.OLD_LAYOUT_KEYS, E.NAME_MAX, E.DEFAULT_NAME, E.BAR_COLORS, E.CHART_OPTIONS]),
      names: js(['', '  ', 'Brand', 'CON', 'lpt1', 'نظرة عامة', '***', null].map((n) => [E.themeName(n), E.fileBase(n)])) };
  }
  // I1: imageSize on made-up bytes: a PNG header, a JPG with a frame after other markers, short and odd bytes
  {
    const png = (w, h) => Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, w >>> 24, (w >>> 16) & 255, (w >>> 8) & 255, w & 255, h >>> 24, (h >>> 16) & 255, (h >>> 8) & 255, h & 255, 8, 2, 0, 0, 0]);
    const jpg = (w, h, pre) => Uint8Array.from([0xff, 0xd8].concat(pre || [], [0xff, 0xc0, 0, 17, 8, h >> 8, h & 255, w >> 8, w & 255, 3], new Array(20).fill(0)));
    out.I1 = js([png(400, 100), png(0, 100), png(65536, 3), jpg(640, 480), jpg(300, 120, [0xff, 0xe0, 0, 4, 1, 2, 0xff, 0xff, 0xff, 0xc4, 0, 3, 9, 0xff, 0x01, 0xff, 0xd0]), jpg(0, 9), jpg(320, 200, [0xff, 0xe0, 0, 5, 1, 2, 0xff, 0xc1, 0, 17, 8, 0, 9, 0, 9]), new Uint8Array(10), null, Uint8Array.from(new Array(40).fill(7))].map((b) => E.imageSize(b)));
  }
  // (0.3.3 FB1) the names the engine got on purpose after the base are not the split's: each is listed here, must be
  // there now and is left out of the comparison with the base (pageFill: how well a page is filled, mcp/work/FB1.md)
  out.K1 = js(Object.keys(E).filter((k) => !ADDED_SINCE.includes(k)).sort());
  return out;
};

const got = facts(E), liftedNow = liftedCount, tuckedNow = tuckedCount;
if (process.env.SP29_RECORD === '1') { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); console.log('recorded ' + path.relative(REPO, GOLD)); }
const gold = fs.existsSync(GOLD) ? JSON.parse(fs.readFileSync(GOLD, 'utf8')) : {};
const diff = (a, b) => (typeof a === 'string' || typeof b === 'string' ? (a === b ? [] : ['the value']) : Object.keys(Object.assign({}, a, b)).filter((k) => JSON.stringify((a || {})[k]) !== JSON.stringify((b || {})[k])));

// ---------- D1-D12, G1, S1, I1, K1: byte for byte the base's ----------
for (const name of Object.keys(got)) chk(() => gold[name] && !diff(got[name], gold[name]).length, () => `${name}: differs from the base in ${gold[name] ? diff(got[name], gold[name]).join(', ') : '(not recorded)'}`);

chk(() => ADDED_SINCE.every((k) => typeof E[k] === 'function' && E[k] === require('../assets/js/design-metrics.js')[k]), () => `K2 a name added on purpose since the base (${ADDED_SINCE.join(', ')}) is not the engine's and the metrics' own`);

{ // L1: how many of G1's 400 layouts are lifted in either fit (a number that moves says the rule moved)
  const n = liftedNow;
  chk(() => n === LIFTED_FITS, () => `L1 the fits with the cards over the rail among the suite's fits (two a layout): ${n} (pinned ${LIFTED_FITS})`);
  chk(() => tuckedNow === TUCKED_FITS, () => `L2 the fits with the text box under the rail and the cards not over it: ${tuckedNow} (pinned ${TUCKED_FITS})`);
}

// ---------- B1: the base engine itself, live, on the same facts ----------
{
  let B = null, why = '';
  try {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp29-base-'));
    for (const f of ['design-engine.js', 'text-measure.js', 'design-colours.js', 'design-glass.js']) fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(HERE, 'fixtures', 'hk1', 'sp29', 'assets', 'js', f)));
    B = require(path.join(dir, 'design-engine.js'));
  } catch (e) { why = String(e && e.message || e).slice(0, 200); }
  const was = B ? facts(B) : null, differ = was ? Object.keys(Object.assign({}, got, was)).filter((k) => diff(got[k], was[k]).length) : [];
  chk(() => was && !differ.length, () => `B1 the base engine (${BASE}), live: ${was ? 'differs in ' + differ.map((k) => k + ' (' + diff(got[k], was[k]).slice(0, 4).join(', ') + ')').join('; ') : 'not loaded: ' + why}`);
}

// ---------- F1, M1 (after the first move): the metrics are design-metrics.js's own; the file is pure ----------
const code = (f) => fs.readFileSync(path.join(REPO, 'assets/js', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const engine = code('design-engine.js');
// no page, no storage, no language from the browser; no module-level let (no hidden state); root only to import and export
const pure = (src, own) => { const bad = [];
  if (/\b(document|window|localStorage|sessionStorage|navigator|location|indexedDB|fetch|XMLHttpRequest|setTimeout|Date\.now|Math\.random)\b/.test(src)) bad.push('a browser or clock global');
  if (/^ {2}let /m.test(src)) bad.push('a module-level let');
  const roots = (src.match(/\broot\.\w+/g) || []).filter((r) => r !== own && !/^root\.(DataArcusTextMeasure|DAColours|DAMetrics|DAPngBytes)$/.test(r)); if (roots.length) bad.push('reads ' + roots.join(', '));
  return bad; };
const METRICS = ['M', 'G', 'HH', 'PAGES', 'DEFAULT_PAGE', 'LIM', 'within', 'fitCustom', 'page', 'pw', 'toPage', 'boxOf', 'T', 'label', 'LAYOUTS', 'RTL_LANGS', 'rtl', 'SMALL_PAGE', 'smallPage', 'isSmall', 'fitLayout',
  'TABLE_NEED', 'tableWeight', 'RANGE', 'rangeOf', 'clampTo', 'CATEGORY_KINDS', 'CATEGORY_FIT', 'categoryFit', 'noTimeOf', 'LAYOUT_PREVIEW', 'isPreview', 'hasMain', 'hasSplit', 'sizes', 'computeSlots', 'imageSize', 'pngSize',
  'FHD_TEXT', 'textScale', 'sizeAt', 'fs', 'TEXT_BASES', 'themeScaleOf', 'scaleTheme', 'barW', 'c0', 'kpiInset', 'projectSlots', 'secondLayout', 'slidePanel', 'absorb', 'SLOT_GAP', 'REFLOW_KEEP', 'fitSlots', 'fitScale', 'projectPages'];
if (fs.existsSync(path.join(REPO, 'assets/js/design-metrics.js'))) {
  const Mx = require('../assets/js/design-metrics.js');
  const wrong = METRICS.filter((k) => E[k] === undefined || E[k] !== Mx[k]);
  const still = ['computeSlots', 'fitSlots', 'projectPages', 'sizes', 'themeScaleOf', 'scaleTheme', 'textScale', 'sizeAt', 'minOf', 'noTimeOf', 'layoutOf', 'fitCustom', 'imageSize'].filter((k) => new RegExp(`(const|function) ${k}\\b`).test(engine));
  chk(() => !wrong.length && !still.length && !/FHD_TEXT = |const LAYOUTS = |const PAGES = /.test(engine),
    () => `F1 the facade: ${wrong.length ? 'not design-metrics.js\'s own: ' + wrong.join(', ') : 'still written in design-engine.js: ' + still.join(', ')}`);
  const bad = pure(code('design-metrics.js'), 'root.DAMetrics');
  chk(() => !bad.length, () => `M1 design-metrics.js is pure (layout in, numbers out): ${bad.join('; ')}`);
}

// ---------- F2, M2 (after the second move): the saved designs are design-state.js's ----------
if (fs.existsSync(path.join(REPO, 'assets/js/design-state.js'))) {
  const S = require('../assets/js/design-state.js');
  const cfg = { PRESETS: E.PRESETS, FONTS: E.FONTS, CHART_OPTIONS: E.CHART_OPTIONS, BAR_COLORS: E.BAR_COLORS, DEFAULT_NAME: E.DEFAULT_NAME, NAME_MAX: E.NAME_MAX };
  const made = S.make(cfg), s = () => ({ data: ['#zz'].concat(E.PRESETS.Earthy.data.slice(1)), name: 'x'.repeat(80), layout: { radius: 12, kpiCards: 1, kpis: 4, page: 'nope' } });
  const said = [], saidE = [];
  chk(() => E.upgrade === S.upgrade && E.OLD_LAYOUT_KEYS === S.OLD_LAYOUT_KEYS && typeof S.make === 'function'
    && JSON.stringify([made.repairState(s(), (x) => said.push(x)), said, made.fresh(), made.SCHEMA, made.DESIGN_KEYS, made.LAYOUT_KEYS]) === JSON.stringify([E.repairState(s(), (x) => saidE.push(x)), saidE, E.fresh(), E.SCHEMA, E.DESIGN_KEYS, E.LAYOUT_KEYS])
    && !/function repairState|const SCHEMA = |const upgrade = |const fresh = /.test(engine),
  () => 'F2 the facade: upgrade and OLD_LAYOUT_KEYS are design-state.js\'s own, make() gives the engine\'s repair, schema and fresh, and design-engine.js writes none of them');
  const bad = pure(code('design-state.js'), 'root.DAState');
  chk(() => !bad.length, () => `M2 design-state.js is pure (a save in, a design and its notes out): ${bad.join('; ')}`);
}

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp29.mjs cause=${problems.length} of ${checks} checks`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp29  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp29  ${checks} checks`);
