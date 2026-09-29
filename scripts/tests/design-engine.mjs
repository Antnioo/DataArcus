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
  check(all.length === 53, `fixtures: ${all.length} cases, expected 53`);

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
    check(JSON.stringify(E.buildTheme(d), null, 2) === c.theme, `${c.id}: theme JSON differs`);
    // slot table: name, suggested visual, X, Y, width, height in page units
    const slots = E.computeSlots(l, c.lang);
    const rows = slots.map((s) => { const b = E.boxOf(s, l); return [nm(s.role), nm(E.KINDS[s.kind]), b.x, b.y, b.w, b.h].map(String); });
    check(JSON.stringify(rows) === JSON.stringify(c.slots), `${c.id}: slot table differs\n        got  ${JSON.stringify(rows).slice(0, 300)}\n        want ${JSON.stringify(c.slots).slice(0, 300)}`);
    // background SVG, at the PNG's size
    const [w, h] = E.pngSize(l);
    check(E.bgSvg(d, slots, { w, h }, c.lang) === c.bg, `${c.id}: background SVG differs`);
    // file name of the PNG download
    check(`${E.fileBase(d.name)}-background-${l.preset}.png` === c.file, `${c.id}: file name ${E.fileBase(d.name)} does not give ${c.file}`);
  }

  // the fonts and chart choices on both pages are the engine's own lists (the repairs rely on them)
  for (const page of Object.values(PAGES_TO_CHECK)) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const options = (id) => { const m = html.match(new RegExp(`<select[^>]*id="${id}"[^>]*>([\\s\\S]*?)</select>`)); return m ? [...m[1].matchAll(/<option([^>]*)>([^<]*)<\/option>/g)].map((o) => ((o[1].match(/value="([^"]*)"/) || [])[1] ?? o[2])) : null; };
    check(JSON.stringify(options('font')) === JSON.stringify(E.FONTS), `${page}: fonts ${JSON.stringify(options('font'))} are not the engine's ${JSON.stringify(E.FONTS)}`);
    for (const [k, id] of Object.entries({ labels: 'csLabels', grid: 'csGrid', legend: 'csLegend', axis: 'csAxis', table: 'csTable' }))
      check(JSON.stringify(options(id)) === JSON.stringify(E.CHART_OPTIONS[k]), `${page}: chart ${k} choices ${JSON.stringify(options(id))} are not the engine's ${JSON.stringify(E.CHART_OPTIONS[k])}`);
  }

  // each page runs the code it should: the lab page the engine and theme-generator-next, the live page the old script
  for (const [name, page] of Object.entries(PAGES_TO_CHECK)) {
    const v = await visitor(browser);
    const seen = [];
    v.pg.on('request', (rq) => { const m = rq.url().match(/assets\/js\/((?:design-engine|theme-generator(?:-next)?)\.min\.js)/); if (m) seen.push(m[1]); });
    await v.pg.goto(`${url}${page}`, { waitUntil: 'networkidle' });
    const engine = await v.pg.evaluate(() => !!window.DAEngine && document.getElementById('json').textContent.length > 100);
    const want = name === 'lab' ? ['design-engine.min.js', 'theme-generator-next.min.js'] : ['theme-generator.min.js'];
    check(JSON.stringify(seen.sort()) === JSON.stringify(want) && engine === (name === 'lab') && !v.errs.length, `${name} page loads ${JSON.stringify(seen)}, engine ${engine}, errors ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  // both pages in the browser make exactly the fixtures: preview, theme, slots, background, file name, saved design
  for (const [name, page] of Object.entries(PAGES_TO_CHECK)) {
    const res = await captureAll(browser, url, page), p = compare(res, `${name} page: `);
    check(!p.length, p.slice(0, 10).join('\n        ') + (p.length > 10 ? `\n        ... and ${p.length - 10} more` : ''));
  }
  return { checks, problems };
}
