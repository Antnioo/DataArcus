// The design engine (assets/js/design-engine.js): the Theme & Layout Generator's theme and layout logic, shared by the
// website and the DataArcus MCP. It must give what the generator gave before the move, byte for byte, for every case in
// fixtures/design-engine (captured from the unchanged page by capture-design-fixtures.mjs):
//   in Node: the saved design after the repairs a returning visitor gets, the theme JSON, the slot table, the background
//   SVG and the file name; the fonts and chart choices both pages offer are the engine's lists;
//   in the browser: both generator pages (lab = the engine, live = the old script) make exactly the fixtures.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, visitor } from './lib.mjs';
import { FILE, PAGES_TO_CHECK, unpack, captureAll, compare, PROJECT_FILE, unpackProjects, captureProjects, compareProjects } from './capture-design-fixtures.mjs';

// the engine exactly as the lab page loads it (minified)
const load = (file) => { const m = { exports: {} }; new Function('module', 'exports', 'self', fs.readFileSync(path.join(ROOT, 'assets/js', file), 'utf8'))(m, m.exports, undefined); return m.exports; };
const copy = (o) => JSON.parse(JSON.stringify(o));

// the saved design the page had before the reload that captured a case (the capture script's own steps, replayed):
// the design after the preset click, then the case's changes
function before(c, all) {
  const base = copy((all.find((x) => x.id === (c.setup.preset ? `preset-${['DataArcus', 'Corporate', 'Colorblind safe', 'Desert Gulf', 'Midnight', 'Earthy'].indexOf(c.setup.preset) + 1}` : 'preset-1')) || {}).state);
  let s = c.setup.raw ? copy(c.setup.raw) : base;
  Object.assign(s, copy(c.setup.set || {}));
  if (c.setup.rawLayout) s.layout = copy(c.setup.rawLayout);
  if (c.setup.layout) s.layout = Object.assign({}, s.layout, copy(c.setup.layout));
  return s;
}

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  let E;
  try { E = load('design-engine.min.js'); } catch (e) { return { checks: 1, problems: ['assets/js/design-engine.min.js: ' + e.message] }; }
  const all = unpack(JSON.parse(fs.readFileSync(FILE, 'utf8')));
  check(all.length === 54, `fixtures: ${all.length} cases, expected 54`);

  for (const c of all) {
    const nm = (pair) => (c.lang === 'ar' ? pair[1] : pair[0]);
    // the repairs on load: from the design before the reload, and a design already repaired stays as it is
    if (c.setup.set || c.setup.layout || c.setup.rawLayout || c.setup.raw) {
      const got = E.repairState(before(c, all));
      check(JSON.stringify(got) === JSON.stringify(c.state), `${c.id}: repaired design differs\n        got  ${JSON.stringify(got).slice(0, 300)}\n        want ${JSON.stringify(c.state).slice(0, 300)}`);
    }
    check(JSON.stringify(E.repairState(copy(c.state))) === JSON.stringify(c.state), `${c.id}: repairing a repaired design changed it`);
    const d = c.state, l = d.layout;
    // theme JSON, as the page shows and downloads it
    check(JSON.stringify(E.buildTheme(d, c.lang), null, 2) === c.theme, `${c.id}: theme JSON differs`);
    // slot table: name, suggested visual, X, Y, width, height in page units
    const slots = E.computeSlots(l, c.lang);
    const rows = slots.map((s) => { const b = E.boxOf(s, l); return [nm(s.role), nm(E.KINDS[s.kind]), b.x, b.y, b.w, b.h].map(String); });
    check(JSON.stringify(rows) === JSON.stringify(c.slots), `${c.id}: slot table differs\n        got  ${JSON.stringify(rows).slice(0, 300)}\n        want ${JSON.stringify(c.slots).slice(0, 300)}`);
    // the preview's size label on each panel is the slot table's width x height (what visitors type into Power BI);
    // title and logo have no label
    const labels = [...c.preview.matchAll(/font-family="Consolas, monospace"[^>]*>([^<]*)</g)].map((m) => m[1]);
    const want = c.slots.filter((row, i) => slots[i].kind !== 'title' && slots[i].kind !== 'logo').map((row) => `${row[4]}×${row[5]}`);
    const off = want.map((w, i) => (labels[i] === w ? null : `${w} in the table, ${labels[i]} on the preview`)).filter(Boolean);
    check(labels.length === want.length && !off.length, `${c.id}: preview size labels differ from the slot table (${off.length} of ${want.length}): ${off.slice(0, 3).join('; ')}`);
    // the readability checks (the page's formulas: text, labels and text on page 4.5:1, colour 1 on visuals 3:1, and any
    // data colour below 1.6:1 on the visual background)
    const u = d.ui, sec = E.mix(u.text, u.card, 0.35);
    const wantC = { checks: [['textOnVisuals', E.contrast(u.text, u.card), 4.5], ['labelsOnVisuals', E.contrast(sec, u.card), 4.5],
      ['textOnPage', E.contrast(u.text, u.background), 4.5], ['color1OnVisuals', E.contrast(d.data[0], u.card), 3]].map(([id, ratio, min]) => ({ id, ratio, min, pass: ratio >= min })),
    weak: d.data.map((x, i) => [i + 1, E.contrast(x, u.card)]).filter(([, r]) => r < 1.6).map(([i]) => i) };
    const gotC = typeof E.contrastChecks === 'function' ? E.contrastChecks(d) : 'no contrastChecks';
    check(JSON.stringify(gotC) === JSON.stringify(wantC), `${c.id}: contrast checks ${JSON.stringify(gotC).slice(0, 200)}, want ${JSON.stringify(wantC).slice(0, 200)}`);
    // background SVG, at the PNG's size
    const [w, h] = E.pngSize(l);
    check(E.bgSvg(d, slots, { w, h }, c.lang) === c.bg, `${c.id}: background SVG differs`);
    // file name of the PNG download
    check(`${E.fileBase(d.name)}-background-${l.preset}.png` === c.file, `${c.id}: file name ${E.fileBase(d.name)} does not give ${c.file}`);
  }

  // the header and the top filter rail are never too short for their text on the page (heights measured in Power BI
  // Desktop, DESKTOP-TESTS.md 2026-10-01: an 8pt text box needs 25 page units, a dropdown slicer 16 + 4 x its points):
  // a saved design with the smallest header (44) on a 960 x 720 page comes back with the header raised to the page's
  // minimum (49), through every route (sizes, the slots, the slider's range); 1920 x 1080 keeps the old minimum (44)
  {
    const saved = E.repairState({ data: E.PRESETS.DataArcus.data, ui: E.PRESETS.DataArcus.ui, name: 'Saved', font: 'Segoe UI',
      layout: { v: 3, preset: 'analysis', page: '960x720', header: true, hh: 44, filters: true, fpos: 'top', fh: 56, kpis: 3 } });
    const l = saved.layout, PW = E.pw(l), z = E.sizes(l, PW), slots = E.computeSlots(l, 'en');
    const title = E.boxOf(slots.find((s) => s.kind === 'title'), l), rail = E.boxOf(slots.find((s) => s.rail), l);
    check(l.hh === 44 && z.hh === 49 && E.rangeOf('hh', PW, l)[0] === 49 && E.clampTo('hh', 44, PW, l) === 49 && title.h >= 25,
      `saved hh 44 on 960 x 720: kept ${l.hh}, sizes ${z.hh}, slider from ${E.rangeOf('hh', PW, l)[0]}, title box ${title.h} (want 49 and 25+)`);
    check(z.fh === 70 && E.rangeOf('fh', PW, l)[0] === 70 && rail.h >= 16 + 4 * 10 + 13, `saved fh 56 on 960 x 720: sizes ${z.fh}, slider from ${E.rangeOf('fh', PW, l)[0]}, rail ${rail.h} (want 70)`);
    const big = Object.assign({}, l, { page: '1920x1080' });
    check(E.sizes(big, E.pw(big)).hh === 44 && E.rangeOf('hh', E.pw(big), big)[0] === 44 && E.rangeOf('fh', E.pw(big), big)[0] === 64,
      `1920 x 1080: header from ${E.rangeOf('hh', E.pw(big), big)[0]} (want 44), top rail from ${E.rangeOf('fh', E.pw(big), big)[0]} (want 64)`);
    const small = Object.assign({}, l, { page: 'custom', pageW: 640, pageH: 360, hh: undefined, fh: undefined });
    check(E.sizes(small, E.pw(small)).hh === 74 && E.sizes(small, E.pw(small)).fh === 110, `640 x 360 defaults: header ${E.sizes(small, E.pw(small)).hh} (want 74), top rail ${E.sizes(small, E.pw(small)).fh} (want 110)`);
  }

  // an attached logo (round 0, 2026-10-01): the engine reads an image's size from its bytes (PNG and JPG), and with the
  // logo's ratio the logo slot keeps the designed height and takes the logo's width (no minimum, 360 at most on the 720
  // grid), its far edge where it was; the title keeps its box. Without a ratio nothing changes (the fixtures above).
  {
    const LOGOS = path.join(ROOT, 'scripts/tests/fixtures/logos'), size = (f) => (typeof E.imageSize === 'function' ? E.imageSize(new Uint8Array(fs.readFileSync(path.join(LOGOS, f)))) : 'no imageSize');
    const got = ['wide.png', 'square.png', 'tall.png', 'wide.jpg'].map((f) => JSON.stringify(size(f))).join(' ');
    check(got === '{"w":400,"h":100} {"w":200,"h":200} {"w":100,"h":250} {"w":600,"h":50}', `imageSize: ${got}`);
    check(typeof E.imageSize === 'function' && E.imageSize(new Uint8Array([1, 2, 3, 4])) === null && E.imageSize(new Uint8Array(0)) === null, 'imageSize of something that is not an image must be null');
    const base0 = all.find((x) => x.id === 'preset-1').state;
    const lay = (page) => Object.assign({}, base0.layout, { preset: 'exec', page, header: true, kpis: 4, filters: false, hh: undefined, logoW: undefined });
    const box = (page, lang, ratio) => { const p = E.projectPages(lay(page), lang, { second: false, panel: false, logoRatio: ratio })[0].slots, l = p.find((s) => s.kind === 'logo'), t = p.find((s) => s.kind === 'title'); return [l.x, l.w, l.h, t.w, t.h].join(' '); };
    const WANT = [[4, '1692 192 48 840 48', '1128 128 32 560 32', '36 192 48 840 48'], [1, '1836 48 48 840 48', '1224 32 32 560 32', '36 48 48 840 48'],
      [0.4, '1865 19 48 840 48', '1243 13 32 560 32', '36 19 48 840 48'], [12, '1344 540 48 840 48', '896 360 32 560 32', '36 540 48 840 48'], [undefined, '1659 225 48 840 48', '1106 150 32 560 32', '36 225 48 840 48']];
    for (const [ratio, a, b, c] of WANT) {
      const g = [box('1920x1080', 'en', ratio), box('1280x720', 'en', ratio), box('1920x1080', 'ar', ratio)];
      check(g[0] === a && g[1] === b && g[2] === c, `logo ratio ${ratio}: logo x, w, h and title w, h on 1080, 720, Arabic 1080: ${g.join(' | ')}, want ${[a, b, c].join(' | ')}`);
    }
    // the side accent bar's end plus round(5k): where a KPI card's title can start (26 on 1080, 17 on 720); 0 without a side bar
    const ins = typeof E.kpiInset === 'function' ? [E.kpiInset(Object.assign(lay('1920x1080'), { kpiBar: 'start' })), E.kpiInset(Object.assign(lay('1280x720'), { kpiBar: 'start' })), E.kpiInset(Object.assign(lay('1920x1080'), { kpiBar: 'top' })), E.kpiInset(Object.assign(lay('1920x1080'), { kpiBar: 'none' }))] : 'no kpiInset';
    check(JSON.stringify(ins) === '[26,17,0,0]', `kpiInset: ${JSON.stringify(ins)}, want [26,17,0,0]`);
  }

  // an empty or blank theme name: the theme JSON and the files get the same default name, the one the name box shows
  const base = all.find((x) => x.id === 'preset-1').state;
  for (const n of ['', '   ']) {
    const t = E.buildTheme(Object.assign(copy(base), { name: n }));
    check(t.name === 'My Brand Theme' && E.fileBase(n) === 'my-brand-theme' && E.fileBase(n) === E.fileBase(t.name),
      `name ${JSON.stringify(n)}: theme named ${JSON.stringify(t.name)}, files ${E.fileBase(n)}`);
  }
  // a name of only symbols keeps its own name in the theme; its files fall back to power-bi-theme
  check(E.buildTheme(Object.assign(copy(base), { name: '***' })).name === '***' && E.fileBase('***') === 'power-bi-theme', 'name "***" changed');

  // the legend's "Side" (Right) follows the reading direction like the rest of the layout: Left in right-to-left designs
  // (the chosen direction, or the page's language when none is chosen), on every visual type that has a legend
  const LEGEND_TYPES = E.AXIS_CHARTS.concat('scatterChart', 'pieChart', 'donutChart', 'treemap');
  const legendOf = (dir, lang, legend) => {
    const d = copy(base); d.chart = { legend }; d.layout = Object.assign({}, d.layout, { dir });
    const vs = E.buildTheme(d, lang).visualStyles;
    return [...new Set(LEGEND_TYPES.map((t) => vs[t]['*'].legend[0].position))].join(',');
  };
  for (const [dir, lang, want] of [['rtl', 'en', 'Left'], ['rtl', 'ar', 'Left'], ['', 'ar', 'Left'], ['ltr', 'en', 'Right'], ['ltr', 'ar', 'Right'], ['', 'en', 'Right']])
    check(legendOf(dir, lang, 'Right') === want, `legend "Side", direction ${JSON.stringify(dir)}, page ${lang}: ${legendOf(dir, lang, 'Right')}, want ${want}`);
  check(legendOf('rtl', 'ar', 'Top') === 'Top' && legendOf('rtl', 'ar', 'Bottom') === 'Bottom', 'legend Top/Bottom changed in a right-to-left design');

  // the Power BI project download: the engine gives exactly the pages the lab page hands pbip-export (page names, sizes,
  // slots, the second page's layout, the slide-in panel) and the report's labels, for every project case
  const projects = unpackProjects(JSON.parse(fs.readFileSync(PROJECT_FILE, 'utf8')));
  check(projects.length === 60, `project fixtures: ${projects.length} cases, expected 60`);
  for (const pc of projects) {
    const dc = all.find((x) => x.id === pc.id.replace(/-plain$/, ''));
    if (typeof E.projectPages !== 'function' || !E.REPORT_TEXTS) { check(false, `${pc.id}: no projectPages / REPORT_TEXTS in the engine`); continue; }
    const got = E.projectPages(dc.state.layout, pc.lang, pc.opts).map((p) => ({ name: p.name, page: p.page, slots: p.slots, panel: p.panel }));
    check(JSON.stringify(got) === JSON.stringify(pc.build.pages), `${pc.id}: project pages differ\n        got  ${JSON.stringify(got).slice(0, 250)}\n        want ${JSON.stringify(pc.build.pages).slice(0, 250)}`);
    check(JSON.stringify(E.REPORT_TEXTS[pc.lang]) === JSON.stringify(pc.build.texts), `${pc.id}: report labels differ: ${JSON.stringify(E.REPORT_TEXTS[pc.lang]).slice(0, 150)}`);
  }

  // the fonts and chart choices on both pages are the engine's own lists (the repairs rely on them)
  for (const page of Object.values(PAGES_TO_CHECK)) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const options = (id) => { const m = html.match(new RegExp(`<select[^>]*id="${id}"[^>]*>([\\s\\S]*?)</select>`)); return m ? [...m[1].matchAll(/<option([^>]*)>([^<]*)<\/option>/g)].map((o) => ((o[1].match(/value="([^"]*)"/) || [])[1] ?? o[2])) : null; };
    check(JSON.stringify(options('font')) === JSON.stringify(E.FONTS), `${page}: fonts ${JSON.stringify(options('font'))} are not the engine's ${JSON.stringify(E.FONTS)}`);
    for (const [k, id] of Object.entries({ labels: 'csLabels', grid: 'csGrid', legend: 'csLegend', axis: 'csAxis', table: 'csTable' }))
      check(JSON.stringify(options(id)) === JSON.stringify(E.CHART_OPTIONS[k]), `${page}: chart ${k} choices ${JSON.stringify(options(id))} are not the engine's ${JSON.stringify(E.CHART_OPTIONS[k])}`);
  }

  // on both pages: empty the name box (or leave only spaces), and the theme download is named after the theme JSON's name
  for (const [name, page] of Object.entries(PAGES_TO_CHECK)) {
    const v = await visitor(browser);
    await v.pg.goto(`${url}${page}?lang=en`, { waitUntil: 'networkidle' });
    for (const n of ['', '   ']) {
      await v.pg.fill('#themeName', n);
      const r = await v.pg.evaluate(() => {
        let file = null; const click = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () { file = this.download; };
        try { document.getElementById('dlBtn').click(); } finally { HTMLAnchorElement.prototype.click = click; }
        return { file, theme: JSON.parse(document.getElementById('json').textContent).name };
      });
      check(r.theme === 'My Brand Theme' && r.file === 'my-brand-theme.json', `${name} page, name ${JSON.stringify(n)}: theme named ${JSON.stringify(r.theme)}, downloaded as ${r.file}`);
    }
    if (v.errs.length) problems.push(`${name} page (names): ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  // on both pages: legend "Side" is Left in the theme on the Arabic page (no direction chosen) and with Right to left
  // chosen on the English page, and Right with Left to right
  for (const [name, page] of Object.entries(PAGES_TO_CHECK)) {
    for (const [lang, dir, want] of [['ar', null, 'Left'], ['en', 'rtl', 'Left'], ['en', 'ltr', 'Right']]) {
      const v = await visitor(browser);
      await v.pg.goto(`${url}${page}?lang=${lang}`, { waitUntil: 'networkidle' });
      if (dir) await v.pg.click(`#layout button[data-l="dir"][data-v="${dir}"]`);
      await v.pg.selectOption('#csLegend', 'Right');
      const got = await v.pg.evaluate(() => JSON.parse(document.getElementById('json').textContent).visualStyles.columnChart['*'].legend[0].position);
      check(got === want && !v.errs.length, `${name} page, ${lang}, direction ${dir || '(page)'}: legend "Side" is ${got}, want ${want} ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
  }

  // on both pages: the colour step's preview puts the "Side" legend on the same side as the theme, whatever the page's
  // own writing direction (English or Arabic page, with the design read left to right or right to left)
  for (const [name, page] of Object.entries(PAGES_TO_CHECK)) {
    for (const [lang, dir, want] of [['en', 'rtl', 'Left'], ['en', 'ltr', 'Right'], ['ar', null, 'Left'], ['ar', 'ltr', 'Right']]) {
      const v = await visitor(browser);
      await v.pg.goto(`${url}${page}?lang=${lang}`, { waitUntil: 'networkidle' });
      if (dir) await v.pg.click(`#layout button[data-l="dir"][data-v="${dir}"]`);
      await v.pg.selectOption('#csLegend', 'Right');
      const r = await v.pg.evaluate(() => {
        const box = (e) => { const b = e.getBoundingClientRect(); return b.left + b.width / 2; };
        const legend = document.querySelector('#preview .tg-legend'), chart = document.querySelector('#preview svg[aria-label="Clustered bar chart preview"]');
        return { side: legend && chart ? (box(legend) < box(chart) ? 'Left' : 'Right') : null,
          theme: JSON.parse(document.getElementById('json').textContent).visualStyles.columnChart['*'].legend[0].position };
      });
      check(r.side === want && r.theme === want && !v.errs.length, `${name} page, ${lang}, direction ${dir || '(page)'}: preview legend on the ${r.side}, theme ${r.theme}, want ${want} ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
  }

  // each page runs the code it should: both pages the engine and theme-generator.js on it
  for (const [name, page] of Object.entries(PAGES_TO_CHECK)) {
    const v = await visitor(browser);
    const seen = [];
    v.pg.on('request', (rq) => { const m = rq.url().match(/assets\/js\/((?:design-engine|theme-generator(?:-next)?)\.min\.js)/); if (m) seen.push(m[1]); });
    await v.pg.goto(`${url}${page}`, { waitUntil: 'networkidle' });
    const engine = await v.pg.evaluate(() => !!window.DAEngine && document.getElementById('json').textContent.length > 100);
    const want = ['design-engine.min.js', 'theme-generator.min.js'];
    check(JSON.stringify(seen.sort()) === JSON.stringify(want) && engine && !v.errs.length, `${name} page loads ${JSON.stringify(seen)}, engine ${engine}, errors ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  // the lab page's project download hands pbip-export exactly what the fixtures recorded, backgrounds included
  {
    const p = compareProjects(await captureProjects(browser, url), 'lab page project: ');
    check(!p.length, p.slice(0, 10).join('\n        ') + (p.length > 10 ? `\n        ... and ${p.length - 10} more` : ''));
  }

  // both pages in the browser make exactly the fixtures: preview, theme, slots, background, file name, saved design
  for (const [name, page] of Object.entries(PAGES_TO_CHECK)) {
    const res = await captureAll(browser, url, page), p = compare(res, `${name} page: `);
    check(!p.length, p.slice(0, 10).join('\n        ') + (p.length > 10 ? `\n        ... and ${p.length - 10} more` : ''));
  }
  return { checks, problems };
}
