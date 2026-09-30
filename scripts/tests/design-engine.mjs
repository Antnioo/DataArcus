// The design engine (assets/js/design-engine.js): the Theme & Layout Generator's theme and layout logic, shared by the
// website and the DataArcus MCP. It must give what the generator gave before the move, byte for byte, for every case in
// fixtures/design-engine (captured from the unchanged page by capture-design-fixtures.mjs):
//   in Node: the saved design after the repairs a returning visitor gets, the theme JSON, the slot table, the background
//   SVG and the file name; the fonts and chart choices both pages offer are the engine's lists;
//   in the browser: both generator pages (lab = the engine, live = the old script) make exactly the fixtures.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, visitor } from './lib.mjs';
import { FILE, PAGES_TO_CHECK, unpack, captureAll, compare } from './capture-design-fixtures.mjs';

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
    // background SVG, at the PNG's size
    const [w, h] = E.pngSize(l);
    check(E.bgSvg(d, slots, { w, h }, c.lang) === c.bg, `${c.id}: background SVG differs`);
    // file name of the PNG download
    check(`${E.fileBase(d.name)}-background-${l.preset}.png` === c.file, `${c.id}: file name ${E.fileBase(d.name)} does not give ${c.file}`);
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

  // both pages in the browser make exactly the fixtures: preview, theme, slots, background, file name, saved design
  for (const [name, page] of Object.entries(PAGES_TO_CHECK)) {
    const res = await captureAll(browser, url, page), p = compare(res, `${name} page: `);
    check(!p.length, p.slice(0, 10).join('\n        ') + (p.length > 10 ? `\n        ... and ${p.length - 10} more` : ''));
  }
  return { checks, problems };
}
