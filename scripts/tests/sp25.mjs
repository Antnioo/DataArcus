// 0.3.2 SP25 (the split: svg-kpi-designer.js -> svg-editor-store.js; mcp/work/SP25.md): the SVG KPI Designer's
// editing, characterised on the base (integration/0.3.2 fe4cc82, before the move) and the same after. Rendered
// ?lang=en and ?lang=ar (1440 x 900), 10 scripted edit sessions, each on a fresh page: add layers, change properties by
// typing (one undo step per field visit), drag (Alt held: no snapping, so no font moves a number), resize by a handle,
// delete, keyboard moves and duplicate, undo, undo, redo, a 4-move drag that undoes in one step, an import, a bad
// import, an export, data links and rules, the card's fields. After every step: the layer list as shown, the
// selection, the Undo and Redo buttons, the handles shown, the selected layer, the saved design, the canvas SVG (its
// layers and viewBox; the editor's overlay and zoom are not the design) and the DAX text; an export's file name and
// text. Recorded in fixtures/sp25-editor.json; SP25_RECORD=1 records again (only on the base, never to make a run pass).
//   E1..E10  EN sessions as recorded;  A1..A10  AR sessions as recorded
//   M1       (after the move) both designer pages load svg-editor-store.min.js once, before svg-kpi-designer.min.js
//   M2       (after the move) svg-editor-store.js has no DOM, no listeners, no timers, no storage
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { visitor, ROOT } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLD = path.join(HERE, 'fixtures', 'sp25-editor.json');
const STORE_JS = path.join(ROOT, 'assets/js/svg-editor-store.js');
const moved = fs.existsSync(STORE_JS);
const sha = (s) => (s == null ? null : crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex').slice(0, 24) + ':' + Buffer.byteLength(s, 'utf8'));

// made-up designs only
const IMPORTED = { name: 'Imported KPI', w: 200, h: 60, values: [{ id: 'm1', label: 'Orders', kind: 'measure', measure: 'Orders', sample: 420 }, { id: 'm2', label: 'Goal', kind: 'measure', measure: 'Goal', sample: 500 }, { id: 'f1', label: 'Share', kind: 'ratio', a: 'm1', b: 'm2' }],
  layers: [{ type: 'rect', name: 'Back', x: 0, y: 0, w: 200, h: 60, rx: 6, fill: '#223344' }, { type: 'rect', name: 'Bar', x: 10, y: 40, w: 100, h: 8, fill: '#00d4ff', bind: { w: { v: 'f1', d0: 0, d1: 1, r0: 0, r1: 180 } } },
    { type: 'text', name: 'Value', x: 10, y: 28, size: 18, weight: 700, anchor: 'start', fill: '#ffffff', text: 'x', bind: { text: { v: 'm1', fmt: 'n0' } } }] };

// the page's hooks: an export's blob and file name are kept instead of downloaded
const HOOKS = () => {
  const oc = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (b) => { window.__blob = b; return oc(b); };
  HTMLAnchorElement.prototype.click = function () { window.__dl = this.download; };
  try { localStorage.setItem('dataarcus-svg-kpi-tour', '{"seen":true}'); } catch (e) { /* ignore */ }
};

const frame = (pg) => pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
const h = {
  starter: (pg, id) => pg.click(`#starters [data-t="${id}"]`),
  add: (pg, type) => pg.click(`#addBar [data-add="${type}"]`),
  pick: (pg, i) => pg.click(`#layers [data-act="sel"][data-i="${i}"]`),
  layerBtn: (pg, act, i) => pg.click(`#layers [data-act="${act}"][data-i="${i}"]`),
  undo: (pg) => pg.click('#undoBtn'),
  redo: (pg) => pg.click('#redoBtn'),
  // a field visit: click into it, select its text, type (one input event per key)
  type: async (pg, sel, text) => { await pg.click(sel); await pg.keyboard.press('Control+A'); await pg.keyboard.type(text); },
  key: async (pg, k) => { await pg.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); }); await pg.keyboard.press(k); },
  // the client point of a design point, and of a layer's or a handle's centre
  geo: (pg, what) => pg.evaluate((w) => {
    const s = document.querySelector('#stage svg.kd-svg'), r = s.getBoundingClientRect(), vb = s.viewBox.baseVal;
    const el = w.layer != null ? document.querySelector(`#stage g[data-l='${w.layer}']`) : document.querySelector(`#stage .kd-handle[data-h='${w.handle}']`);
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, k: r.width / vb.width };
  }, what),
  // a drag in `steps` moves of a design delta (dx, dy); Alt held (no snapping)
  drag: async (pg, what, dx, dy, steps = 4) => {
    const g = await h.geo(pg, what);
    await pg.keyboard.down('Alt');
    await pg.mouse.move(g.x, g.y); await pg.mouse.down();
    for (let i = 1; i <= steps; i++) await pg.mouse.move(g.x + dx * g.k * i / steps, g.y + dy * g.k * i / steps);
    await pg.mouse.up(); await pg.keyboard.up('Alt');
  },
  clickLayer: async (pg, i) => { const g = await h.geo(pg, { layer: i }); await pg.mouse.click(g.x, g.y); },
  importJson: async (pg, text) => {
    await pg.evaluate(() => { document.getElementById('toast').textContent = ''; });
    await pg.setInputFiles('#importFile', { name: 'design.svgkpi.json', mimeType: 'application/json', buffer: Buffer.from(text, 'utf8') });
    await pg.waitForFunction(() => document.getElementById('toast').textContent !== '', null, { timeout: 10000 });
  },
  exportIt: async (pg) => { await pg.evaluate(() => { window.__blob = null; window.__dl = null; }); await pg.click('#exportBtn'); return pg.evaluate(async () => ({ name: window.__dl, text: window.__blob ? await window.__blob.text() : null })); }
};

// 10 sessions: [name, starting starter, steps]; each step [label, action]; the state is recorded after every step
const SESSIONS = [
  ['add layers, undo, undo, redo', '__blank', [['add rect', (pg) => h.add(pg, 'rect')], ['add circle', (pg) => h.add(pg, 'circle')], ['add text', (pg) => h.add(pg, 'text')],
    ['undo', h.undo], ['undo', h.undo], ['redo', h.redo], ['add ring after a redo (the redo stack is cleared)', (pg) => h.add(pg, 'ring')], ['Control+Y with nothing to redo', (pg) => h.key(pg, 'Control+Y')]]],
  ['typing: one undo step per field visit', 'ring', [['pick the ring', (pg) => h.pick(pg, 0)], ['type the X', (pg) => h.type(pg, '#props [data-p="cx"]', '47')],
    ['type the radius', (pg) => h.type(pg, '#props [data-p="r"]', '33')], ['type the name', (pg) => h.type(pg, '#props [data-p="name"]', 'My ring')],
    ['undo', h.undo], ['undo', h.undo], ['redo', h.redo], ['type the radius again', (pg) => h.type(pg, '#props [data-p="r"]', '21')], ['undo', h.undo]]],
  ['a grouped drag undoes in one step', '__blank', [['add rect', (pg) => h.add(pg, 'rect')], ['add circle', (pg) => h.add(pg, 'circle')],
    ['drag the circle in 4 moves', (pg) => h.drag(pg, { layer: 1 }, 30, -12, 4)], ['drag the rect in 6 moves', (pg) => h.drag(pg, { layer: 0 }, -40, 20, 6)],
    ['undo (the whole rect drag)', h.undo], ['undo (the whole circle drag)', h.undo], ['redo', h.redo], ['a click without a move (no step)', (pg) => h.clickLayer(pg, 1)], ['undo', h.undo]]],
  ['resize by handles', '__blank', [['add rect', (pg) => h.add(pg, 'rect')], ['resize se', (pg) => h.drag(pg, { handle: 'se' }, 30, 12, 3)], ['resize e', (pg) => h.drag(pg, { handle: 'e' }, -20, 0, 3)],
    ['add circle', (pg) => h.add(pg, 'circle')], ['resize r', (pg) => h.drag(pg, { handle: 'r' }, 9, 0, 3)], ['add line', (pg) => h.add(pg, 'line')], ['move p2', (pg) => h.drag(pg, { handle: 'p2' }, 15, 20, 3)],
    ['undo', h.undo], ['undo', h.undo], ['undo', h.undo], ['redo', h.redo]]],
  ['delete, by button and by key', 'bar', [['pick layer 1', (pg) => h.pick(pg, 1)], ['delete it', (pg) => h.layerBtn(pg, 'del', 1)], ['pick layer 0', (pg) => h.pick(pg, 0)],
    ['the Delete key', (pg) => h.key(pg, 'Delete')], ['undo', h.undo], ['undo', h.undo], ['redo', h.redo], ['redo', h.redo], ['undo', h.undo]]],
  ['keyboard: arrows, duplicate, Ctrl+Z, Ctrl+Shift+Z, Escape', '__blank', [['add rect', (pg) => h.add(pg, 'rect')], ['ArrowRight', (pg) => h.key(pg, 'ArrowRight')], ['ArrowRight', (pg) => h.key(pg, 'ArrowRight')],
    ['Shift+ArrowDown', (pg) => h.key(pg, 'Shift+ArrowDown')], ['Control+D', (pg) => h.key(pg, 'Control+D')], ['Control+Z', (pg) => h.key(pg, 'Control+Z')], ['Control+Z', (pg) => h.key(pg, 'Control+Z')],
    ['Control+Shift+Z', (pg) => h.key(pg, 'Control+Shift+Z')], ['Control+Y', (pg) => h.key(pg, 'Control+Y')], ['Escape', (pg) => h.key(pg, 'Escape')], ['Control+Z', (pg) => h.key(pg, 'Control+Z')]]],
  ['import, undo, redo, a bad import', 'pill', [['pick layer 0', (pg) => h.pick(pg, 0)], ['import a design', (pg) => h.importJson(pg, JSON.stringify(IMPORTED))], ['undo', h.undo], ['redo', h.redo],
    ['import a file that is not a design', (pg) => h.importJson(pg, '{"layers": "no"}')], ['undo', h.undo]]],
  ['export, edit a value, export, undo', 'spark', [['export', h.exportIt], ['type a test value', (pg) => h.type(pg, '#values input[type="number"][data-v="0"][data-vk="sample"]', '777')],
    ['type a measure name', (pg) => h.type(pg, '#values [data-v="1"][data-vk="measure"]', 'Goal [x]')], ['export', h.exportIt], ['undo', h.undo], ['export', h.exportIt], ['undo', h.undo], ['export', h.exportIt]]],
  ['data links and rules', '__blank', [['add rect', (pg) => h.add(pg, 'rect')], ['link the width', (pg) => pg.click('#props [data-bind-toggle="w"]')], ['link the fill', (pg) => pg.click('#props [data-bind-toggle="fill"]')],
    ['add a rule', (pg) => pg.click('#props [data-rule-add="fill"]')], ['remove rule 0', (pg) => pg.click('#props [data-rule-del="fill"][data-i="0"]')], ['undo', h.undo], ['undo', h.undo], ['undo', h.undo], ['redo', h.redo],
    ['unlink the width', (pg) => pg.click('#props [data-bind-toggle="w"]')], ['undo', h.undo]]],
  ['the card, order buttons, a starter, a value', 'trend', [['the card (Escape)', (pg) => h.key(pg, 'Escape')], ['background on', (pg) => pg.click('#props [data-card-bg]')], ['type the card name', (pg) => h.type(pg, '#props [data-p="card.name"]', 'Card 7')],
    ['type the width', (pg) => h.type(pg, '#props [data-p="card.w"]', '150')], ['undo', h.undo], ['pick layer 0', (pg) => h.pick(pg, 0)], ['bring it forward', (pg) => h.layerBtn(pg, 'up', 0)], ['duplicate it', (pg) => h.layerBtn(pg, 'dup', 1)],
    ['add a measure', (pg) => pg.click('#addMeasure')], ['the bar starter', (pg) => h.starter(pg, 'bar')], ['undo (back to the edited trend)', h.undo], ['undo', h.undo], ['undo', h.undo], ['redo', h.redo]]]
];

const state = (pg) => pg.evaluate(() => {
  const s = document.querySelector('#stage svg.kd-svg');
  let svg = null;
  if (s) { const c = s.cloneNode(true); c.removeAttribute('width'); c.removeAttribute('height'); c.querySelectorAll('g.kd-ui').forEach((g) => g.remove()); svg = c.outerHTML; }
  const lis = [...document.querySelectorAll('#layers .kd-layer')];
  const act = lis.find((li) => li.classList.contains('active'));
  const saved = localStorage.getItem('dataarcus-svg-kpi-v2'), d = saved ? JSON.parse(saved) : null, i = act ? +act.dataset.i : -1;
  return {
    layers: lis.map((li) => li.dataset.i + ':' + li.querySelector('.kd-lname span').textContent),
    sel: i, title: document.getElementById('propsTitle').textContent,
    undo: !document.getElementById('undoBtn').disabled, redo: !document.getElementById('redoBtn').disabled,
    handles: [...document.querySelectorAll('#stage .kd-handle')].map((x) => x.dataset.h).join(' '), selbox: !!document.querySelector('#stage .kd-selbox'),
    layer: d && i >= 0 ? JSON.stringify(d.layers[i]) : null, saved, svg, dax: document.getElementById('dax').textContent
  };
});

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const record = process.env.SP25_RECORD === '1';
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
      if (k === 0) loaded.push(lang + ': ' + await pg.evaluate(() => [...document.scripts].map((s) => s.src).filter((x) => /svg-(editor-store|kpi-designer)\.min\.js/.test(x)).map((x) => x.replace(/^.*\/([\w-]+)\.min\.js.*$/, '$1')).join(' ')));
      await h.starter(pg, start); await frame(pg);
      const rec = [];
      const errs0 = v.errs.length;
      for (const [label, act] of [['start ' + start, null]].concat(steps)) {
        let out;
        try { if (act) out = await act(pg); await frame(pg); } catch (e) { bad.push(`${label}: ${e.message.split('\n')[0]}`); break; }
        const st = await state(pg);
        const r = { step: label, layers: st.layers, sel: st.sel, title: st.title, undo: st.undo, redo: st.redo, handles: st.handles, selbox: st.selbox, layer: st.layer, saved: sha(st.saved), svg: sha(st.svg), dax: sha(st.dax) };
        if (out && typeof out === 'object' && 'text' in out) { r.export = out.name; r.exportText = sha(out.text); r.exportIsSaved = out.text === (st.saved && JSON.stringify(JSON.parse(st.saved), null, 2)); }
        rec.push(r);
      }
      if (v.errs.length > errs0) bad.push('page errors: ' + v.errs.slice(errs0).join(' | '));
      if (k) await pg.close();
      got[lang][id] = { session: name, steps: rec };
      if (record) { if (bad.length) throw new Error(`${id} cannot be recorded: ${bad.join('; ')}`); continue; }
      const g = (gold[lang] || {})[id];
      if (!g) bad.push('no record'); else {
        const diff = [];
        const n = Math.max(g.steps.length, rec.length);
        for (let i = 0; i < n; i++) {
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
  if (!record && moved) {
    // M1: both pages load the store once, before the designer (deferred scripts run in document order)
    const pagesOk = ['tools/svg-kpi-designer.html', 'ar/tools/svg-kpi-designer.html'].map((p) => {
      const t = fs.readFileSync(path.join(ROOT, p), 'utf8'), at = (s) => t.indexOf(s + '.min.js?v='), n = (s) => t.split(s + '.min.js?v=').length - 1;
      return n('svg-editor-store') === 1 && n('svg-kpi-designer') === 1 && at('svg-editor-store') > 0 && at('svg-editor-store') < at('svg-kpi-designer');
    });
    check(pagesOk.every(Boolean) && loaded.every((l) => / svg-editor-store svg-kpi-designer$/.test(l)), `M1 both designer pages must load svg-editor-store.min.js once, before svg-kpi-designer.min.js: ${loaded.join(' | ')}`);
    // M2: the store is state and history only (comments left out)
    const code = fs.readFileSync(STORE_JS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const banned = ['document', 'addEventListener', 'querySelector', 'getElementById', 'localStorage', 'sessionStorage', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'innerHTML', 'eval(', 'Function(', 'fetch('].filter((w) => code.includes(w));
    check(!banned.length && /root\.SVGEditorStore\s*=/.test(code), `M2 svg-editor-store.js must hold no DOM, listener, timer or storage (found: ${banned.join(', ') || 'none'}) and export SVGEditorStore`);
  }
  if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); checks += SESSIONS.length * 2; }
  return { checks, problems };
}
