// 0.3.2 SP33 (the split, finish: svg-kpi-designer.js -> svg-editor-pointer.js, then svg-editor-panels.js;
// mcp/work/SP33.md): the SVG KPI Designer characterised on the base (integration/0.3.2 6511900, before any move) and
// the same after each move. Rendered ?lang=en and ?lang=ar (1440 x 900), 15 scripted sessions, each on a fresh page:
// SP25's 10 (imported from sp25.mjs, one place) and 5 for the risks the split map names (listener cleanup, history
// grouping) and for the panels: a snapping drag read while the button is still down, the pointer's edge cases (a right
// click, a move under 3 px, a cancelled drag, a click on the empty card, a resize and a drag of a layer linked to data), every
// layer type's properties panel, the data panel, and the tutorial (it places the layers the add bar makes).
// After every step: SP25's state, plus the HTML of the layer list, the properties and the values panels, the guides
// shown, the toast, the tutorial panel, the errors and warnings. Recorded in fixtures/sp33-editor.json; SP33_RECORD=1
// records again (only on the base, never to make a run pass).
//   E1..E15  EN sessions as recorded;  A1..A15  AR sessions as recorded
//   M1  (after the moves) both designer pages load store, pointer, panels, then the designer, each once
//   M2  (after the moves) svg-editor-pointer.js and svg-editor-panels.js hold no storage, timer, fetch or eval
//   M3  (after the pointer move) in Node: one drag of many moves is one checkpoint; a move under 3 px, a right click
//       and a cancelled press make none; detach() removes every listener attach() added
//   M4  (after the moves) each new module states its interface at its top
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { visitor, ROOT } from './lib.mjs';
import { SESSIONS as SP25_SESSIONS, h, HOOKS, frame, sha, state as sp25State } from './sp25.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLD = path.join(HERE, 'fixtures', 'sp33-editor.json');
const JS = (n) => path.join(ROOT, 'assets/js', n + '.js');
const hasPointer = fs.existsSync(JS('svg-editor-pointer')), hasPanels = fs.existsSync(JS('svg-editor-panels'));

// the press of a drag that is still held (the guides show only then), and its release
const press = async (pg, what, dx, dy, steps = 4, alt = false) => {
  const g = await h.geo(pg, what);
  if (alt) await pg.keyboard.down('Alt');
  await pg.mouse.move(g.x, g.y); await pg.mouse.down();
  for (let i = 1; i <= steps; i++) await pg.mouse.move(g.x + dx * g.k * i / steps, g.y + dy * g.k * i / steps);
};
const release = async (pg) => { await pg.mouse.up(); await pg.keyboard.up('Alt'); };
// a screen move in pixels (not design units), Alt held
const nudge = async (pg, what, px) => { const g = await h.geo(pg, what); await pg.keyboard.down('Alt'); await pg.mouse.move(g.x, g.y); await pg.mouse.down(); await pg.mouse.move(g.x + px, g.y); await pg.mouse.up(); await pg.keyboard.up('Alt'); };
// pressed and moved, then the browser cancels the gesture (pointercancel), then the button comes up
const cancelled = async (pg, what, dx, dy) => {
  await press(pg, what, dx, dy, 3, true);
  await pg.evaluate(() => document.getElementById('stage').dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 })));
  await release(pg);
};
const rightClick = async (pg, what) => { const g = await h.geo(pg, what); await pg.mouse.click(g.x, g.y, { button: 'right' }); };
const emptyCard = (pg) => pg.evaluate(() => { const r = document.querySelector('#stage svg.kd-svg').getBoundingClientRect(); return { x: r.left + 3, y: r.top + 3 }; }).then((p) => pg.mouse.click(p.x, p.y));
const choose = (pg, sel, o) => pg.selectOption(sel, o);
// a slider moved to a value (an input event, as a drag of it sends)
const slide = (pg, sel, v) => pg.evaluate(([q, x]) => { const e = document.querySelector(q); e.focus(); e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); }, [sel, v]);
const wait = (ms) => () => new Promise((r) => setTimeout(r, ms));
const tourStep = (act) => async (pg) => { await act(pg); await frame(pg); await wait(1300)(); };

const MORE = [
  ['a snapping drag (no Alt), read while held', '__blank', [['add rect', (pg) => h.add(pg, 'rect')], ['add circle', (pg) => h.add(pg, 'circle')],
    ['press the circle and move it near the centre lines (held)', (pg) => press(pg, { layer: 1 }, 7, 1, 5)], ['release', release],
    ['press the rect and move it far (held)', (pg) => press(pg, { layer: 0 }, 37, 13, 6)], ['release', release], ['undo (the rect drag)', h.undo], ['undo (the circle drag)', h.undo], ['redo', h.redo]]],
  ['pointer edge cases', '__blank', [['add rect', (pg) => h.add(pg, 'rect')], ['add circle', (pg) => h.add(pg, 'circle')], ['right click the circle (nothing)', (pg) => rightClick(pg, { layer: 1 })],
    ['a 2 px move (no step)', (pg) => nudge(pg, { layer: 1 }, 2)], ['a cancelled drag (pointercancel)', (pg) => cancelled(pg, { layer: 0 }, 20, 10)], ['undo', h.undo],
    ['a click on the empty card', emptyCard], ['the bar starter', (pg) => h.starter(pg, 'bar')], ['pick layer 3 (the bar, its width linked)', (pg) => h.pick(pg, 3)],
    ['resize the linked bar by s (no e handle)', (pg) => h.drag(pg, { handle: 's' }, 0, 6, 3)], ['drag the linked bar', (pg) => h.drag(pg, { layer: 3 }, 10, 5, 3)], ['undo', h.undo], ['undo', h.undo], ['Escape then a right click on the card', async (pg) => { await h.key(pg, 'Escape'); await emptyCard(pg); }]]],
  ['every layer type in the properties panel', '__blank', [['add rect', (pg) => h.add(pg, 'rect')], ['add circle', (pg) => h.add(pg, 'circle')], ['add line', (pg) => h.add(pg, 'line')],
    ['add text', (pg) => h.add(pg, 'text')], ['add ring', (pg) => h.add(pg, 'ring')], ['add arrow', (pg) => h.add(pg, 'arrow')], ['add spark', (pg) => h.add(pg, 'spark')],
    ['area off (the panel redraws)', (pg) => pg.click('#props [data-p="area"]')], ['type 99 points (60 at most)', (pg) => h.type(pg, '#props [data-p="n"]', '99')],
    ['each point is a week', (pg) => choose(pg, '#props [data-p="grain"]', 'week')], ['the series', (pg) => choose(pg, '#props [data-p="bind.series.v"]', 'target')],
    ['pick the arrow', (pg) => h.pick(pg, 5)], ['direction from Growth', (pg) => choose(pg, '#props [data-p="bind.dir.v"]', 'growth')], ['good when down', (pg) => choose(pg, '#props [data-p="goodWhen"]', 'down')],
    ['pick the text', (pg) => h.pick(pg, 3)], ['weight 800', (pg) => choose(pg, '#props [data-p="weight"]', '800')], ['ending at X', (pg) => choose(pg, '#props [data-p="anchor"]', 'end')],
    ['show a value', (pg) => pg.click('#props [data-bind-toggle="text"]')], ['format 82.7%', (pg) => choose(pg, '#props [data-p="bind.text.fmt"]', 'p1')], ['type a prefix', (pg) => h.type(pg, '#props [data-p="bind.text.prefix"]', 'AED ')],
    ['plus sign', (pg) => pg.click('#props [data-p="bind.text.sign"]')], ['the value: Achievement', (pg) => choose(pg, '#props [data-p="bind.text.v"]', 'ach')],
    ['pick the ring', (pg) => h.pick(pg, 4)], ['progress from a value', (pg) => pg.click('#props [data-bind-toggle="p"]')], ['type up to', (pg) => h.type(pg, '#props [data-p="bind.p.d1"]', '2')],
    ['only show if', (pg) => pg.click('#props [data-bind-toggle="show"]')], ['type the threshold', (pg) => h.type(pg, '#props [data-p="bind.show.t"]', '0.5')],
    ['pick the line', (pg) => h.pick(pg, 2)], ['round ends off', (pg) => choose(pg, '#props [data-p="cap"]', 'butt')], ['end X from a value', (pg) => pg.click('#props [data-bind-toggle="x2"]')],
    ['pick the circle', (pg) => h.pick(pg, 1)], ['type the opacity', (pg) => h.type(pg, '#props [data-p="opacity"]', '0.4')], ['undo', h.undo], ['undo', h.undo], ['redo', h.redo]]],
  ['the data panel and the card', '__blank', [['add a measure', (pg) => pg.click('#addMeasure')], ['add a formula', (pg) => pg.click('#addFormula')],
    ['its kind: % change', (pg) => choose(pg, '#values select[data-v="6"][data-vk="kind"]', 'pct')], ['its first value', (pg) => choose(pg, '#values select[data-v="6"][data-vk="a"]', 'ly')],
    ['type its label and leave it', async (pg) => { await h.type(pg, '#values .kd-vlabel[data-v="6"]', 'Change'); await pg.keyboard.press('Tab'); }],
    ['remove Sales (still used)', (pg) => pg.click('#values [data-vdel="0"]')], ['remove the new formula', (pg) => pg.click('#values [data-vdel="6"]')],
    ['the slider of Target', (pg) => slide(pg, '#values input[type="range"][data-v="1"]', '1800000')], ['add spark', (pg) => h.add(pg, 'spark')],
    ['test shape: up and down', (pg) => choose(pg, '#testShape', 'wave')], ['the card (Escape)', (pg) => h.key(pg, 'Escape')],
    ['hide when Target is blank', (pg) => choose(pg, '#props [data-p="card.hideIfBlank"]', 'target')], ['right to left', (pg) => pg.click('#props [data-p="card.mirror"]')],
    ['type the height', (pg) => h.type(pg, '#props [data-p="card.h"]', '64')], ['type the date column', (pg) => h.type(pg, '#props [data-p="card.dateCol"]', "'Cal'[Day]")],
    ['undo', h.undo], ['undo', h.undo], ['undo', h.undo]]],
  ['the tutorial places the layers', '__blank', [['start the tutorial', tourStep((pg) => pg.click('.kd-tour-btn'))], ['blank card', tourStep((pg) => h.starter(pg, '__blank'))],
    ['add text', tourStep((pg) => h.add(pg, 'text'))], ['type the title', tourStep((pg) => h.type(pg, '#props [data-p="text"]', 'Sales'))],
    ['add text again', tourStep((pg) => h.add(pg, 'text'))], ['show a value', tourStep((pg) => pg.click('#props [data-bind-toggle="text"]'))],
    ['add rect', tourStep((pg) => h.add(pg, 'rect'))], ['width from a value', tourStep((pg) => pg.click('#props [data-bind-toggle="w"]'))], ['undo', tourStep(h.undo)]]]
];
const SESSIONS = SP25_SESSIONS.concat(MORE);

const more = (pg) => pg.evaluate(() => {
  const t = (id) => { const e = document.getElementById(id); return e ? e.innerHTML : null; };
  const tour = document.querySelector('.kd-tour');
  return {
    layersHtml: t('layers'), propsHtml: t('props'), valuesHtml: t('values'),
    guides: [...document.querySelectorAll('#stage .kd-guide')].map((g) => ['x1', 'y1', 'x2', 'y2'].map((k) => g.getAttribute(k)).join(',')).join(' '),
    toast: document.getElementById('toast').textContent, tour: tour ? tour.className + ': ' + tour.textContent.replace(/\s+/g, ' ').trim() : null,
    errors: (document.getElementById('errors').hidden ? '(hidden) ' : '') + document.getElementById('errors').textContent,
    warn: (document.getElementById('valWarn').hidden ? '(hidden) ' : '') + document.getElementById('valWarn').textContent, blank: !document.getElementById('blankNote').hidden
  };
});

// M3: the pointer in Node, with a made-up stage, store and viewport (no browser)
function pointerInNode() {
  const bad = [], listeners = new Map();
  const stage = {
    addEventListener: (k, fn) => listeners.set(k, (listeners.get(k) || []).concat(fn)),
    removeEventListener: (k, fn) => listeners.set(k, (listeners.get(k) || []).filter((f) => f !== fn)),
    setPointerCapture: () => {}
  };
  const design = { w: 100, h: 50, layers: [{ type: 'rect', x: 10, y: 10, w: 20, h: 10 }] };
  let sel = -1, checkpoints = 0, frames = 0;
  const store = { get design() { return design; }, get sel() { return sel; }, select: (i) => { sel = i; }, checkpoint: () => { checkpoints++; } };
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(JS('svg-editor-pointer'), 'utf8'), ctx);
  const P = ctx.window.SVGEditorPointer;
  if (!P || typeof P.attach !== 'function') return ['window.SVGEditorPointer.attach is missing'];
  const target = (l) => ({ closest: (q) => (q === '[data-l]' && l != null ? { dataset: { l: String(l) } } : null) });
  const ev = (x, y, o) => Object.assign({ clientX: x, clientY: y, button: 0, pointerId: 1, altKey: true, target: target(0), preventDefault: () => {} }, o || {});
  const fire = (k, e) => (listeners.get(k) || []).forEach((fn) => fn(e));
  const p = P.attach({
    stage, store, pos: { rect: [['x', 'y']] }, r1: (n) => Math.round(n * 10) / 10, clone: (x) => JSON.parse(JSON.stringify(x)),
    view: { hasCanvas: () => true, zoom: () => 1, toDesign: (e) => ({ x: e.clientX, y: e.clientY }), bboxOf: (i) => ({ x: design.layers[i].x, y: design.layers[i].y, width: 20, height: 10 }) },
    on: { picked: () => {}, canvas: () => { frames++; }, moved: () => {}, dropped: () => {} }
  });
  const added = [...listeners.values()].reduce((n, a) => n + a.length, 0);
  fire('pointerdown', ev(15, 15)); for (let i = 1; i <= 6; i++) fire('pointermove', ev(15 + i * 2, 15)); fire('pointerup', ev(27, 15));
  if (checkpoints !== 1 || design.layers[0].x !== 22) bad.push(`a 6-move drag must be one checkpoint and move x to 22: ${checkpoints} checkpoints, x ${design.layers[0].x}`);
  fire('pointerdown', ev(22, 15)); fire('pointermove', ev(24, 15)); fire('pointerup', ev(24, 15));
  fire('pointerdown', ev(22, 15, { button: 2 })); fire('pointermove', ev(40, 15));
  fire('pointerdown', ev(22, 15)); fire('pointercancel', ev(22, 15)); fire('pointermove', ev(40, 15));
  if (checkpoints !== 1 || design.layers[0].x !== 22) bad.push(`a 2 px move, a right click and a cancelled press must make no step: ${checkpoints} checkpoints, x ${design.layers[0].x}`);
  if (!(frames > 0)) bad.push('the pointer must ask for a canvas frame');
  p.detach();
  const left = [...listeners.values()].reduce((n, a) => n + a.length, 0);
  if (added !== 4 || left !== 0) bad.push(`attach() must add the 4 pointer listeners and detach() remove them all: added ${added}, left ${left}`);
  return bad;
}

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const record = process.env.SP33_RECORD === '1';
  const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
  const loaded = [];
  for (const lang of ['en', 'ar']) {
    got[lang] = {};
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.ctx.addInitScript(HOOKS);
    for (const [k, [name, start, steps]] of SESSIONS.entries()) {
      const id = (lang === 'en' ? 'E' : 'A') + (k + 1), bad = [];
      const pg = k === 0 ? v.pg : await v.ctx.newPage();
      if (k) { pg.on('pageerror', (e) => v.errs.push(e.message)); }
      await pg.goto(lang === 'en' ? `${url}/tools/svg-kpi-designer.html?lang=en` : `${url}/ar/tools/svg-kpi-designer.html`, { waitUntil: 'networkidle' });
      await pg.evaluate(() => localStorage.removeItem('dataarcus-svg-kpi-v2'));
      await pg.reload({ waitUntil: 'networkidle' });
      await pg.waitForFunction(() => document.querySelector('#stage svg.kd-svg') && document.getElementById('dax').textContent.length > 0, null, { timeout: 30000 });
      if (k === 0) loaded.push(lang + ': ' + await pg.evaluate(() => [...document.scripts].map((s) => s.src).filter((x) => /svg-(editor-\w+|kpi-designer)\.min\.js/.test(x)).map((x) => x.replace(/^.*\/([\w-]+)\.min\.js.*$/, '$1')).join(' ')));
      await h.starter(pg, start); await frame(pg);
      const rec = [];
      const errs0 = v.errs.length;
      for (const [label, act] of [['start ' + start, null]].concat(steps)) {
        let out;
        try { if (act) out = await act(pg); await frame(pg); } catch (e) { bad.push(`${label}: ${e.message.split('\n')[0]}`); break; }
        const st = await sp25State(pg), mo = await more(pg);
        const r = { step: label, layers: st.layers, sel: st.sel, title: st.title, undo: st.undo, redo: st.redo, handles: st.handles, selbox: st.selbox, layer: st.layer, saved: sha(st.saved), svg: sha(st.svg), dax: sha(st.dax),
          layersHtml: sha(mo.layersHtml), propsHtml: sha(mo.propsHtml), valuesHtml: sha(mo.valuesHtml), guides: mo.guides, toast: mo.toast, tour: mo.tour, errors: mo.errors, warn: mo.warn, blank: mo.blank };
        if (out && typeof out === 'object' && 'text' in out) { r.export = out.name; r.exportText = sha(out.text); }
        rec.push(r);
      }
      if (v.errs.length > errs0) bad.push('page errors: ' + v.errs.slice(errs0).join(' | '));
      if (k) await pg.close();
      got[lang][id] = { session: name, steps: rec };
      if (record) { if (bad.length) throw new Error(`${id} cannot be recorded: ${bad.join('; ')}`); continue; }
      const g = (gold[lang] || {})[id];
      if (!g) bad.push('no record'); else {
        const diff = [];
        for (let i = 0; i < Math.max(g.steps.length, rec.length); i++) {
          const a = g.steps[i] || {}, b = rec[i] || {};
          const keys = [...new Set(Object.keys(a).concat(Object.keys(b)))].filter((x) => JSON.stringify(a[x]) !== JSON.stringify(b[x]));
          if (keys.length) diff.push(`step ${i} "${a.step || b.step}": ${keys.map((x) => `${x} ${JSON.stringify(a[x])} -> ${JSON.stringify(b[x])}`).join(', ')}`);
        }
        if (diff.length) bad.push(`${diff.length} steps differ from the base: ${diff.slice(0, 3).join('; ')}`);
      }
      check(!bad.length, `${id} ${lang} "${name}": ${bad.join('; ')}`);
    }
    await v.ctx.close();
  }
  if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); return { checks: checks + SESSIONS.length * 2, problems }; }
  const mods = ['svg-editor-pointer', 'svg-editor-panels'].filter((n, i) => [hasPointer, hasPanels][i]);
  if (hasPointer && hasPanels) {
    // M1: deferred scripts run in document order: store, pointer, panels, then the designer, each once
    const order = ['svg-editor-store', 'svg-editor-pointer', 'svg-editor-panels', 'svg-kpi-designer'];
    const pagesOk = ['tools/svg-kpi-designer.html', 'ar/tools/svg-kpi-designer.html'].map((p) => {
      const t = fs.readFileSync(path.join(ROOT, p), 'utf8'), at = order.map((s) => t.indexOf(s + '.min.js?v='));
      return order.every((s) => t.split(s + '.min.js?v=').length === 2) && at.every((x, i) => x > 0 && (i === 0 || x > at[i - 1]));
    });
    check(pagesOk.every(Boolean) && loaded.every((l) => l.endsWith(': ' + order.join(' '))), `M1 both designer pages must load ${order.join(', ')} once each, in that order: ${loaded.join(' | ')}`);
  }
  if (mods.length) {
    // M2 and M4: no storage, timers, fetch or eval in a new module; its interface at its top (comments left out for M2)
    const banned = [], noTop = [];
    for (const n of mods) {
      const src = fs.readFileSync(JS(n), 'utf8'), code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      ['localStorage', 'sessionStorage', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'eval(', 'Function(', 'fetch('].filter((w) => code.includes(w)).forEach((w) => banned.push(n + ': ' + w));
      const top = (/^\/\*[\s\S]*?\*\//.exec(src) || [''])[0], api = n === 'svg-editor-pointer' ? ['attach(', 'detach()', 'guides'] : ['create(', 'renderLayers', 'renderProps', 'renderValues', 'layerAction'];
      if (!api.every((w) => top.includes(w))) noTop.push(n);
    }
    check(!banned.length, `M2 the new modules must hold no storage, timer, fetch or eval (found: ${banned.join(', ')})`);
    check(!noTop.length, `M4 each new module must state its interface at its top: ${noTop.join(', ')}`);
  }
  if (hasPointer) { const bad = pointerInNode(); check(!bad.length, `M3 the pointer in Node: ${bad.join('; ')}`); }
  return { checks, problems };
}
