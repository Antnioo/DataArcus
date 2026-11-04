// 0.3.2 SP31 (the split, finish: theme-generator.js -> theme-state-ui.js, theme-layout-ui.js, theme-download-ui.js;
// mcp/work/SP31.md): everything the Theme Generator page produces, for 13 made-up visits, is what the base produced
// (integration/0.3.2 6511900, before the moves). Each case opens the live page or the lab page (EN or AR), drives
// it, and records at each named point the page's regions (preview, contrast, theme JSON, colour inputs, presets, the
// layout controls, canvas and slot table, visual backgrounds, the reminder, folds, the project card's boxes), every
// input's value, the saved keys (the design, the folded steps, the design kept before the example); and over the
// visit the toasts, the tracked events and the downloads (theme JSON and CSV byte for byte, the project ZIP's files
// but its PNGs byte for byte; PNGs the canvas draws (fonts differ between machines) only with SP31_WHOLE=1, the glass
// pictures, made by the engine, always). Random source seeded and clock fixed (SP13's init script).
// Recorded in fixtures/sp31-page.json; SP31_RECORD=1 records again (only on the base, never to make a run pass).
//   C1-C13  the cases below, one check each
//   after the moves: M1 theme-generator.js keeps none of the moved code and wires the modules; M2 each module's
//   interface header, no hidden state, every ?v= stamp still in theme-generator.js only; M3 every generator page loads
//   each module once, before theme-generator.min.js; S1 the store in Node (the migration, get/update/subscribe/save)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { ROOT, visitor } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLD = path.join(HERE, 'fixtures', 'sp31-page.json');
const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const LAB = '/tools/power-bi-theme-generator-lab.html', LIVE = '/tools/power-bi-theme-generator.html', LIVE_AR = '/ar/tools/power-bi-theme-generator.html';
const MODULES = ['theme-state-ui', 'theme-layout-ui', 'theme-download-ui'];

// the page's seeded random source and fixed clock (SP13's), the toasts and the tracked events kept for the record
const INIT = () => {
  let s = 1;
  const next = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s; };
  window.__sp31seed = (n) => { s = n >>> 0 || 1; };
  Math.random = () => next() / 4294967296;
  const fill = (b) => { const u = new Uint8Array(b.buffer, b.byteOffset, b.byteLength); for (let i = 0; i < u.length; i++) u[i] = next() & 255; return b; };
  try { Object.defineProperty(crypto, 'getRandomValues', { value: fill, configurable: true, writable: true }); } catch (e) { /* ignore */ }
  const RealDate = Date, FIXED = new RealDate(2026, 10, 4, 9, 30, 0).getTime();
  Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(FIXED); } };
  Date.now = RealDate.now;
  window.__sp31 = { toasts: [], tracks: [] };
  let own = null;
  Object.defineProperty(window, 'dataArcusTrack', { configurable: true,
    get: () => (name, params) => { window.__sp31.tracks.push([name, params || null]); if (own) own(name, params); },
    set: (f) => { own = f; } });
  document.addEventListener('DOMContentLoaded', () => {
    const t = document.getElementById('toast'); if (!t) return;
    new MutationObserver(() => { if (t.textContent) window.__sp31.toasts.push(t.textContent); }).observe(t, { childList: true, characterData: true, subtree: true });
  });
};

// what the page shows now: each region's markup, every input's value, the saved keys
const SNAP = () => {
  const ids = ['preview', 'contrast', 'dataColors', 'uiColors', 'presets', 'fontNote', 'logoOut', 'pageSize', 'layControls', 'layWhy', 'layCanvas', 'slotTable', 'layUnits',
    'dlVis', 'dlStatus', 'pbipOwn', 'pbipOwnMsg', 'pbipMap', 'pbipLogoName', 'pbipNames', 'pbipCheck', 'pbipPreview'];
  const out = {};
  ids.forEach((id) => { const e = document.getElementById(id); out[id] = e ? (e.hidden ? 'hidden:' : '') + e.innerHTML : null; });
  out.json = (document.getElementById('json') || {}).textContent || null;
  out.inputs = [...document.querySelectorAll('main input, main select')].filter((e) => e.type !== 'file').map((e) => [e.id || e.dataset.l || e.dataset.key || e.name || '', e.type, e.type === 'checkbox' ? e.checked : e.value, e.disabled]);
  out.folds = ['colors', 'layout', 'download'].map((id) => { const p = document.getElementById(id); if (!p) return null; const b = p.querySelector(':scope > .tg-fold'), s = p.querySelector(':scope > .tg-fold-sum');
    return [p.classList.contains('tg-folded'), b && b.getAttribute('aria-expanded'), b && b.getAttribute('aria-label'), s && s.textContent]; });
  out.stale = [...document.querySelectorAll('.tg-file[data-file]')].map((c) => c.dataset.file + ':' + c.classList.contains('stale')).join(' ') + ' step:' + ((document.querySelector('.tg-steps [data-step="download"]') || { classList: { contains: () => null } }).classList.contains('stale'));
  out.buttons = ['exampleUndo', 'pbipBtn', 'pbipPreviewBtn'].map((id) => { const e = document.getElementById(id); return e ? [e.hidden, e.disabled] : null; });
  out.saved = ['', '-folded', '-before'].map((k) => localStorage.getItem('dataarcus-theme-generator' + k));
  return out;
};

// a made-up logo: two colour blocks on white (PNG, exact pixels)
function logoPng(w, h, blocks) {
  const p = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const b = blocks.find(([x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1), c = b ? b[4] : [255, 255, 255];
    p.data.set([c[0], c[1], c[2], 255], (y * w + x) * 4);
  }
  return PNG.sync.write(p);
}

// a made-up model on disk (English names), as arabic-names.mjs makes it
function model(dir, name) {
  const cols = (xs) => xs.map(([n, dataType]) => ({ name: n, dataType }));
  const tables = [{ name: 'Orders', columns: cols([['Amount', 'double'], ['Qty', 'double'], ['Region', 'string'], ['Order Date', 'dateTime']]),
    measures: [['Revenue', 'SUM ( Orders[Amount] )'], ['Order Count', 'COUNTROWS ( Orders )'], ['Units', 'SUM ( Orders[Qty] )']].map(([n, expression]) => ({ name: n, expression, formatString: '#,0' })) },
  { name: 'Dates', dataCategory: 'Time', columns: [{ name: 'Date', dataType: 'dateTime', isKey: true }, { name: 'Month', dataType: 'string', sortByColumn: 'Month No' }, { name: 'Month No', dataType: 'int64' }] }];
  const relationships = [{ name: 'r1', fromTable: 'Orders', fromColumn: 'Order Date', toTable: 'Dates', toColumn: 'Date' }];
  fs.mkdirSync(path.join(dir, name, name + '.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(dir, name, name + '.SemanticModel', 'definition.pbism'), '{ "version": "4.0", "settings": {} }');
  fs.writeFileSync(path.join(dir, name, name + '.SemanticModel', 'model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships } }));
  return path.join(dir, name);
}

// a stored ZIP's entries in order
function entries(buf) {
  const out = []; let at = 0;
  while (at + 4 <= buf.length && buf.readUInt32LE(at) === 0x04034b50) {
    const n = buf.readUInt16LE(at + 26), x = buf.readUInt16LE(at + 28), size = buf.readUInt32LE(at + 18);
    out.push({ path: buf.slice(at + 30, at + 30 + n).toString('utf8'), data: buf.slice(at + 30 + n + x, at + 30 + n + x + size) });
    at += 30 + n + x + size;
  }
  return out;
}

const STORE = 'dataarcus-theme-generator';
const save = (pg, s) => pg.evaluate(([k, v]) => { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }, [STORE, s]);
const fire = (pg, sel, value, ev) => pg.$eval(sel, (e, [v, t]) => { if (v !== undefined) e.value = v; (t || ['input', 'change']).forEach((n) => e.dispatchEvent(new Event(n, { bubbles: true }))); }, [value, ev]);
const check1 = (pg, sel, on) => pg.$eval(sel, (e, v) => { e.checked = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, on);
const click = (pg, sel) => pg.$eval(sel, (e) => e.click());
const idle = (pg, ms) => pg.waitForTimeout(ms || 120);

// the 13 visits: [name, page, lang, options, steps(pg, snap, ctx)]
const CASES = [
  ['C1 first visit (glass), its preview and its project download, EN lab', LAB, 'en', { plainDesign: false }, async (pg, snap) => {
    await snap('open');
    await click(pg, '#pbipPreviewBtn'); await pg.waitForSelector('#pbipPreview:not([hidden])', { timeout: 60000 }); await idle(pg, 300); await snap('preview');
    await click(pg, '#pbipBtn'); await pg.waitForSelector('#pbipCheck:not([hidden])', { timeout: 60000 }); await idle(pg, 600); await snap('downloaded');
    await click(pg, '#pngBtn'); await idle(pg, 800); await snap('png');
  }, { exactPng: true }],
  ['C2 a partial old save (the migration), EN live', LIVE, 'en', {}, async (pg, snap) => {
    await save(pg, JSON.stringify({ name: 'Old <b>Report</b>', font: 'Nope', data: ['#112233', 'zzz', '#abc'], ui: { background: '#fff', card: 12 }, preset: 'Corporate',
      layout: { preset: 'ops', kpis: 9, page: 'custom', pageW: 99999, pageH: 'x', dir: 'sideways', radius: '16', hh: -5 }, chart: { legend: 'Nowhere', grid: 'dotted' } }));
    await pg.reload({ waitUntil: 'networkidle' }); await snap('open');
    await click(pg, '#layControls button[data-l="kpis"][data-v="4"]'); await snap('after a change');
  }],
  ['C3 broken saves: not JSON, a number, a list, null, AR live', LIVE_AR, 'ar', {}, async (pg, snap) => {
    for (const [k, v] of [['not JSON', '{'], ['a number', '42'], ['a list', '[1,2]'], ['null', 'null'], ['an empty layout', '{"layout":{},"ui":{},"data":[]}']]) {
      await save(pg, v); await pg.reload({ waitUntil: 'networkidle' }); await snap(k);
    }
  }],
  ['C4 the controls: presets, hex boxes, Generate, name, font, chart styles, AR lab', LAB, 'ar', {}, async (pg, snap) => {
    await click(pg, '#presets [data-p="Midnight"]'); await snap('preset');
    await fire(pg, '#dataColors input[type=text][data-key="d0"]', 'zz', ['input']); await snap('typing a bad hex');
    await fire(pg, '#dataColors input[type=text][data-key="d0"]', 'zz', ['change']); await snap('leaving it');
    await fire(pg, '#uiColors input[type=text][data-key="u_card"]', '#00ff88', ['input', 'change']);
    await fire(pg, '#dataColors input[type=color][data-key="d1"]', '#123456', ['input']); await snap('colours typed');
    await fire(pg, '#brand', '#c0392b', ['input']); await pg.$eval('#harmony', (e) => { e.selectedIndex = e.options.length - 1; });
    await click(pg, '#genBtn'); await snap('generated');
    await fire(pg, '#themeName', 'متجر <x> & Co', ['input']);
    const font = await pg.$eval('#font', (e) => [...e.options].map((o) => o.value).find((f) => !/Segoe UI|Tahoma|Arial/.test(f)));
    await fire(pg, '#font', font, ['change']); await snap('name and font');
    for (const id of ['csLabels', 'csGrid', 'csLegend', 'csAxis', 'csTable']) await pg.$eval('#' + id, (e) => { e.selectedIndex = e.options.length - 1; e.dispatchEvent(new Event('change', { bubbles: true })); });
    await snap('chart styles');
    await pg.$eval('#csLegend', (e) => { e.value = 'Right'; e.dispatchEvent(new Event('change', { bubbles: true })); }); await snap('legend at the side');
  }],
  ['C5 every layout control, the page sizes and their messages, EN live', LIVE, 'en', {}, async (pg, snap) => {
    const keys = await pg.$$eval('#layControls button[data-l="preset"]', (bs) => bs.map((b) => b.dataset.v));
    for (const k of keys) await click(pg, `#layControls button[data-l="preset"][data-v="${k}"]`);
    await snap('the last layout');
    await click(pg, `#layControls button[data-l="preset"][data-v="${keys[0]}"]`);
    await check1(pg, '#layControls input[type=checkbox][data-l="filters"]', true); await check1(pg, '#layControls input[type=checkbox][data-l="header"]', true);
    for (const [l, v] of [['kpis', '6'], ['dir', 'rtl'], ['radius', '16'], ['kpiBar', 'bottom'], ['headLine', 'full'], ['fpos', 'top']]) await click(pg, `#layControls button[data-l="${l}"][data-v="${v}"]`);
    await snap('buttons');
    await check1(pg, '#layControls input[type=checkbox][data-l="header"]', false); await snap('no header');
    await check1(pg, '#layControls input[type=checkbox][data-l="header"]', true);
    await check1(pg, '#layControls input[type=checkbox][data-l="filters"]', false); await check1(pg, '#layControls input[type=checkbox][data-l="filters"]', true);
    await check1(pg, '#layControls input[type=checkbox][data-l="shadow"]', false);
    const ranges = await pg.$$eval('#layControls input[type=range][data-l]', (rs) => rs.map((r) => [r.dataset.l, r.min, r.max]));
    for (const [l, lo, hi] of ranges) await fire(pg, `#layControls input[type=range][data-l="${l}"]`, String(Math.round((+lo * 1 + +hi * 3) / 4)), ['input']);
    await snap('sliders');
    await click(pg, '#layControls button[data-l="reset"]'); await snap('sizes reset');
    await pg.$eval('#layControls details.tg-adv', (d) => { d.open = true; }); await idle(pg);
    await click(pg, '#layControls button[data-l="kpiBar"][data-v="start"]');
    const adv = await pg.$$eval('#layControls details.tg-adv input[type=range][data-l]', (rs) => rs.map((r) => [r.dataset.l, r.min, r.max]));
    for (const [l, lo, hi] of adv) await fire(pg, `#layControls details.tg-adv input[type=range][data-l="${l}"]`, String(Math.round((+lo + +hi) / 3)), ['input']);
    await click(pg, '#layControls button[data-l="kpiBarC"][data-v="data"]');
    await snap('advanced');
    await click(pg, '#layControls button[data-l="resetAdv"]'); await snap('advanced reset');
    await click(pg, '#pageSize button[data-l="page"][data-v="960x720"]'); await snap('4:3');
    await click(pg, '#pageSize button[data-l="page"][data-v="custom"]'); await snap('custom');
    await fire(pg, '#pageSize input[data-l="pageW"]', '100', ['change']); await snap('too narrow');
    await fire(pg, '#pageSize input[data-l="pageW"]', '', ['change']); await snap('empty');
    await fire(pg, '#pageSize input[data-l="pageW"]', '4000', ['change']); await fire(pg, '#pageSize input[data-l="pageH"]', '300', ['change']); await snap('a wide shape');
    await fire(pg, '#pageSize input[data-l="pageW"]', '900', ['change']); await fire(pg, '#pageSize input[data-l="pageH"]', '720', ['change']); await snap('a small page');
    await check1(pg, '#layControls input[type=checkbox][data-l="samples"]', false); await snap('no samples');
    await pg.$eval('#slotTable tr[data-i="1"] td', (td) => td.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))); await snap('a row hovered');
    await pg.$eval('#slotTable', (t) => t.dispatchEvent(new MouseEvent('mouseleave'))); await snap('left');
  }],
  ['C6 the downloads and the reminder: stale, solid, again, EN lab', LAB, 'en', {}, async (pg, snap) => {
    await click(pg, '#dlBtn'); await idle(pg, 300);
    await click(pg, '#pngBtn'); await idle(pg, 800);
    await click(pg, '#slotCsv'); await idle(pg, 300);
    await click(pg, '#slotCopy'); await click(pg, '#copyBtn'); await idle(pg, 300); await snap('downloaded');
    await fire(pg, '#dataColors input[type=text][data-key="d0"]', '#ff5500', ['input']);
    await click(pg, '#layControls button[data-l="kpis"][data-v="5"]'); await snap('stale');
    await click(pg, '#dlStatus button[data-dl="stale"]'); await idle(pg, 2000); await snap('downloaded again');
    await click(pg, '#dlVis button[data-l="transparent"][data-v="0"]'); await snap('solid');
    await click(pg, '#dlStatus button[data-dl="transparent"]'); await snap('back to transparent');
    await click(pg, '#dlVis button[data-l="transparent"][data-v="0"]'); await click(pg, '#dlVis button[data-l="transparent"][data-v="1"]'); await snap('picked');
  }],
  ['C7 visual backgrounds switch to transparent on the first layout change, AR live', LIVE_AR, 'ar', {}, async (pg, snap) => {
    const s = await pg.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE); s.layout.transparent = false; delete s.layout.visPicked;
    await save(pg, JSON.stringify(s)); await pg.reload({ waitUntil: 'networkidle' }); await snap('solid');
    await click(pg, '#layControls button[data-l="kpis"][data-v="5"]'); await snap('switched');
    await click(pg, '#layControls button[data-l="radius"][data-v="0"]'); await snap('no second switch');
    await click(pg, '#dlVis button[data-l="transparent"][data-v="1"]'); await snap('picked');
  }],
  ['C8 the example, a reload, Undo, a reload, EN lab', LAB, 'en', {}, async (pg, snap) => {
    await fire(pg, '#themeName', 'Mine', ['input']);
    await click(pg, '#exampleBtn'); await idle(pg, 400); await snap('example');
    await pg.reload({ waitUntil: 'networkidle' }); await snap('reloaded');
    await click(pg, '#exampleUndo'); await snap('undone');
    await pg.reload({ waitUntil: 'networkidle' }); await snap('reloaded again');
  }],
  ['C9 folded steps kept over a reload, a #hash and a link open them, AR lab', LAB, 'ar', {}, async (pg, snap) => {
    await click(pg, '#colors > .tg-fold'); await click(pg, '#download > .tg-fold'); await snap('folded');
    await pg.reload({ waitUntil: 'networkidle' }); await snap('reloaded');
    await click(pg, '#layout > .tg-fold'); await pg.evaluate(() => { location.hash = '#layout'; }); await idle(pg, 300); await snap('hash');
    await click(pg, '.tg-steps a[data-step="download"]'); await idle(pg, 300); await snap('link');
    await click(pg, '#layout > h2'); await snap('heading');
  }],
  ['C10 glass refused by contrast, EN live', LIVE, 'en', {}, async (pg, snap) => {
    const s = await pg.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE);
    s.chart = Object.assign({}, s.chart, { look: 'glass' }); s.ui = Object.assign({}, s.ui, { background: '#999999', card: '#888888', text: '#777777' });
    await save(pg, JSON.stringify(s)); await pg.reload({ waitUntil: 'networkidle' }); await snap('refused');
    await fire(pg, '#csLook', 'glass', ['change']); await snap('asked again');
    await click(pg, '#presets [data-p="DataArcus"]'); await fire(pg, '#csLook', 'glass', ['change']); await snap('glass fits');
  }],
  ['C11 the sample project with a logo, the panel, its preview and check, EN lab', LAB, 'en', {}, async (pg, snap, x) => {
    await check1(pg, '#pbipPanel', true);
    await pg.setInputFiles('#pbipLogo', { name: 'brand.png', mimeType: 'image/png', buffer: logoPng(120, 40, [[0, 0, 60, 40, [27, 58, 107]], [60, 0, 120, 40, [242, 140, 40]]]) }); await idle(pg, 300);
    await click(pg, '#pbipPreviewBtn'); await pg.waitForSelector('#pbipPreview:not([hidden])', { timeout: 60000 }); await idle(pg, 300); await snap('preview');
    await click(pg, '#pbipBtn'); await pg.waitForSelector('#pbipCheck:not([hidden])', { timeout: 60000 }); await idle(pg, 600); await snap('downloaded');
    await pg.setInputFiles('#pbipLogo', { name: 'tall.png', mimeType: 'image/png', buffer: logoPng(20, 60, [[0, 0, 20, 60, [10, 120, 90]]]) }); await idle(pg, 300); await snap('a tall logo');
    await pg.setInputFiles('#pbipLogo', { name: 'x.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') }); await idle(pg, 300); await snap('a gif');
    await check1(pg, '#pbipPages', false); await click(pg, '#pbipBtn'); await pg.waitForFunction(() => !document.getElementById('pbipBtn').disabled); await idle(pg, 600); await snap('one page');
    void x;
  }],
  ['C12 your own model in Arabic: the names to approve, then the download; a published model, AR lab', LAB, 'ar', {}, async (pg, snap, x) => {
    await pg.selectOption('#pbipData', 'local'); await snap('local chosen');
    await pg.setInputFiles('#pbipFolder', x.folder);
    await pg.waitForFunction(() => document.querySelectorAll('#pbipMap select').length > 0 && !/Reading the model|جارٍ قراءة النموذج/.test((document.getElementById('pbipOwnMsg') || {}).textContent || ''), null, { timeout: 30000 });
    await idle(pg, 300); await snap('model read');
    await click(pg, '#pbipBtn'); await pg.waitForSelector('#pbipNames:not([hidden])', { timeout: 60000 }); await idle(pg, 200); await snap('names asked');
    await pg.$$eval('#pbipNames input[type=text]', (bs) => bs.forEach((b) => { b.value = ''; }));
    await click(pg, '#pbipNamesOk'); await idle(pg, 200); await snap('not approved');
    await pg.$$eval('#pbipNames input[type=checkbox]', (cs) => cs.forEach((c) => { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); }));
    await click(pg, '#pbipNamesOk'); await pg.waitForSelector('#pbipCheck:not([hidden])', { timeout: 60000 }); await idle(pg, 800); await snap('downloaded');
    await check1(pg, '#pbipPages', false); await idle(pg, 300); await snap('one page, the picker follows');
    await pg.selectOption('#pbipData', 'service'); await idle(pg, 300);
    await fire(pg, '#pbipWs', 'Sales Workspace', ['input', 'change']); await fire(pg, '#pbipModelName', 'Sales Model', ['input', 'change']);
    await click(pg, '#pbipPreviewBtn'); await pg.waitForFunction(() => !document.getElementById('pbipPreviewBtn').disabled); await idle(pg, 600); await snap('published, preview');
    await pg.selectOption('#pbipData', 'empty'); await idle(pg, 300); await snap('empty');
  }],
  ['C13 a theme from a logo, a bad file, then the language switched, EN live', LIVE, 'en', {}, async (pg, snap) => {
    await pg.setInputFiles('#logoFile', { name: 'logo.png', mimeType: 'image/png', buffer: logoPng(96, 48, [[4, 8, 54, 40, [27, 58, 107]], [60, 8, 92, 40, [242, 140, 40]]]) });
    await pg.waitForSelector('#logoOut:not([hidden])', { timeout: 30000 }); await idle(pg, 300); await snap('logo');
    await pg.setInputFiles('#logoFile', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') }); await idle(pg, 300); await snap('bad file');
    await pg.evaluate(() => { document.documentElement.lang = 'ar'; }); await idle(pg, 400); await snap('in Arabic');
    await pg.evaluate(() => { document.documentElement.lang = 'en'; }); await idle(pg, 400); await snap('back in English');
  }],
];

async function visit(browser, url, [name, page, lang, opts, steps, flags], extra) {
  const v = await visitor(browser, Object.assign({ viewport: [1440, 900], downloads: true }, opts));
  await v.ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: url });
  await v.ctx.addInitScript(INIT);
  const downloads = [];
  v.pg.on('download', (d) => downloads.push(d));
  await v.pg.goto(`${url}${page}${page === LIVE_AR ? '' : '?lang=' + lang}`, { waitUntil: 'networkidle' });
  const settle = async () => {
    // the lab page draws its canvas again once the writer has loaded (the project's page 1)
    if (page === LAB) await v.pg.waitForFunction(() => !!window.DAPbip, null, { timeout: 60000 }).catch(() => {});
    await idle(v.pg, 150);
  };
  await settle();
  await v.pg.evaluate(() => window.__sp31seed(0x31));
  const snaps = [];
  const snap = async (label) => { await idle(v.pg, 80); const s = await v.pg.evaluate(SNAP); snaps.push([label, Object.fromEntries(Object.entries(s).map(([k, x]) => [k, x == null ? null : sha(JSON.stringify(x)).slice(0, 16)]))]); };
  const reload = v.pg.reload.bind(v.pg), before = { toasts: [], tracks: [] };
  const keep = async () => { const l = await v.pg.evaluate(() => window.__sp31); before.toasts.push(...l.toasts); before.tracks.push(...l.tracks); };
  v.pg.reload = async (o) => { await keep(); const r = await reload(o); await settle(); await v.pg.evaluate(() => window.__sp31seed(0x31)); return r; };
  await steps(v.pg, snap, extra);
  await idle(v.pg, 500);
  await keep(); const log = before;
  const files = [];
  for (const d of downloads) {
    const n = d.suggestedFilename(), buf = fs.readFileSync(await d.path());
    if (/\.zip$/.test(n)) { const es = entries(buf); files.push([n, es.map((e) => e.path), Object.fromEntries(es.filter((e) => !/\.png$/i.test(e.path)).map((e) => [e.path, sha(e.data).slice(0, 16)])), Object.fromEntries(es.filter((e) => /\.png$/i.test(e.path)).map((e) => [e.path, sha(e.data).slice(0, 16)]))]); }
    else if (/\.png$/.test(n)) files.push([n, null, null, sha(buf).slice(0, 16)]);
    else files.push([n, null, sha(buf).slice(0, 16), null]);
  }
  const errs = v.errs.slice();
  await v.ctx.close();
  return { snaps, toasts: log.toasts, tracks: log.tracks, files, errs, exactPng: !!(flags && flags.exactPng) };
}

// the first difference between a record and the recording, in words
function diff(now, was, whole) {
  if (!was) return 'not recorded';
  if (now.errs.length) return 'page errors: ' + now.errs.slice(0, 3).join(' | ');
  if (now.snaps.length !== was.snaps.length) return `${now.snaps.length} points, recorded ${was.snaps.length}`;
  for (let i = 0; i < now.snaps.length; i++) {
    const [l, s] = now.snaps[i], [, w] = was.snaps[i];
    const k = Object.keys(Object.assign({}, s, w)).find((x) => s[x] !== w[x]);
    if (k) return `at "${l}": ${k} differs`;
  }
  if (JSON.stringify(now.toasts) !== JSON.stringify(was.toasts)) return `the toasts differ: ${JSON.stringify(now.toasts).slice(0, 300)} recorded ${JSON.stringify(was.toasts).slice(0, 300)}`;
  if (JSON.stringify(now.tracks) !== JSON.stringify(was.tracks)) return `the tracked events differ: ${JSON.stringify(now.tracks).slice(0, 300)} recorded ${JSON.stringify(was.tracks).slice(0, 300)}`;
  if (now.files.length !== was.files.length) return `${now.files.length} downloads, recorded ${was.files.length}`;
  for (let i = 0; i < now.files.length; i++) {
    const [n, order, data, png] = now.files[i], [wn, wo, wd, wp] = was.files[i];
    if (n !== wn) return `download ${i + 1} is ${n}, recorded ${wn}`;
    if (JSON.stringify(order) !== JSON.stringify(wo)) return `${n}: the files or their order differ`;
    if (JSON.stringify(data) !== JSON.stringify(wd)) { const k = data && wd && typeof data === 'object' ? Object.keys(Object.assign({}, data, wd)).find((x) => data[x] !== wd[x]) : ''; return `${n}: differs ${k || ''}`; }
    if ((whole || now.exactPng) && JSON.stringify(png) !== JSON.stringify(wp)) return `${n}: its PNG differs`;
  }
  return '';
}

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const record = process.env.SP31_RECORD === '1', whole = process.env.SP31_WHOLE === '1';
  const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp31-')), folder = model(tmp, 'Shop');
  for (const c of CASES) {
    const id = c[0].split(' ')[0];
    let r;
    try { r = await visit(browser, url, c, { folder }); } catch (e) { r = { crashed: (e.stack || e.message).split('\n').slice(0, 2).join(' ') }; }
    got[id] = r;
    if (record) { if (r.crashed || r.errs.length) problems.push(`${id}: cannot record: ${r.crashed || r.errs.join(' | ')}`); continue; }
    const d = r.crashed ? 'crashed: ' + r.crashed : diff(r, gold[id], whole);
    check(!d, `${c[0]}: ${d}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });

  // after the moves: the modules and their wiring
  const JS = path.join(ROOT, 'assets/js'), there = MODULES.every((m) => fs.existsSync(path.join(JS, m + '.js')));
  if (there && !record) {
    const src = (f) => fs.readFileSync(path.join(JS, f), 'utf8'), tg = src('theme-generator.js'), mods = MODULES.map((m) => src(m + '.js'));
    // M1: the moved code is not in theme-generator.js; it mounts each module with its context
    const moved = ['const renderInputs =', 'const setColor =', 'function renderLayout(', 'function renderLayoutPreview(', 'function sizeControls(', 'function advControls(', 'const thumb =',
      'const downloadJson =', 'const downloadCsv =', 'const pngBlob =', 'const withCredits =', 'function updateStatus(', 'function renderVis(', 'function layoutChanged(', 'const askNames =', 'const projectOf =',
      'localStorage.getItem(STORE)', 'let lastJson', 'namesAnswers'];
    const left = moved.filter((m) => tg.includes(m));
    check(!left.length && /DAThemeState\.createStore\(/.test(tg) && /DAThemeLayoutUI\.mount\(/.test(tg) && /DAThemeDownloadUI\.mount\(/.test(tg) && tg.split('\n').length < 600,
      `M1 theme-generator.js keeps none of the moved code (left: ${left.join(', ') || '-'}), mounts the three modules, under 600 lines (${tg.split('\n').length})`);
    // M2: each module says its interface at its top, holds no page-wide state of its own, and loads no script (the stamps stay in theme-generator.js)
    const bad = [];
    mods.forEach((s, i) => {
      const head = s.slice(0, 3000), n = MODULES[i];
      if (!/Interface|interface/.test(head) || !/\bIn:/.test(head) || !/\bOut:/.test(head)) bad.push(n + ': no interface header');
      if (/\?v=\w/.test(s)) bad.push(n + ': a ?v= stamp');   // (ST1: any stamp; a content stamp may start with a letter)
      if (/document\.createElement\('script'\)|loadScript\s*=/.test(s)) bad.push(n + ': loads a script');
      if (/window\.__|localStorage/.test(s) && n !== 'theme-state-ui') bad.push(n + ': page-wide state or storage');
      if (s.split('\n').length >= 600) bad.push(n + ': ' + s.split('\n').length + ' lines');
    });
    if (/document\.|window\.|localStorage/.test(mods[0].replace(/\/\/[^\n]*|\/\*[^]*?\*\//g, '').replace(/root\.DAThemeState|typeof window/g, ''))) bad.push('theme-state-ui: touches the page or the storage directly');
    const stamps = (s) => (s.match(/\.min\.js\?v=/g) || []).length;
    check(!bad.length && stamps(tg) >= 20, `M2 the modules' interfaces, purity, size and stamps: ${bad.join('; ') || 'stamps in theme-generator.js ' + stamps(tg)}`);
    // M3: every generator page loads each module once, after the engine and before theme-generator.min.js
    const pages = [LAB, LIVE, LIVE_AR].map((p) => [p, fs.readFileSync(path.join(ROOT, p.slice(1)), 'utf8')]), wrong = [];
    for (const [p, h] of pages) {
      const at = (f) => h.indexOf('assets/js/' + f + '.min.js?v='), tgAt = at('theme-generator');
      MODULES.forEach((m) => { if (h.split('assets/js/' + m + '.min.js?v=').length !== 2 || at(m) < at('design-engine') || at(m) > tgAt) wrong.push(p + ' ' + m); });
      if (!(at('theme-state-ui') < at('theme-layout-ui') && at('theme-layout-ui') < at('theme-download-ui'))) wrong.push(p + ' order');
    }
    check(!wrong.length && MODULES.every((m) => fs.existsSync(path.join(JS, m + '.min.js'))), `M3 each page loads the three modules once, in order, before theme-generator.min.js: ${wrong.join(', ')}`);
    // S1: the store in Node, on a fake storage (the migration and the interface)
    const ST = require('../../assets/js/theme-state-ui.js'), E = require('../../assets/js/design-engine.js');
    const mem = (init) => { const m = Object.assign({}, init); return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, m }; };
    const s1 = [];
    const first = ST.createStore({ storage: mem(), engine: E });
    if (!(first.firstVisit && first.get().chart.look === E.DEFAULT_LOOK)) s1.push('a first visit opens on the default look');
    const broken = ST.createStore({ storage: mem({ [STORE]: '{' }), engine: E });
    if (!(broken.firstVisit && JSON.stringify(Object.assign({}, broken.get(), { chart: null })) === JSON.stringify(Object.assign({}, E.repairState(null), { chart: null })))) s1.push('a broken save repairs to the defaults');
    const old = { data: ['#112233'], layout: { preset: 'ops' } }, st = mem({ [STORE]: JSON.stringify(old) }), kept = ST.createStore({ storage: st, engine: E });
    if (kept.firstVisit || JSON.stringify(kept.get()) !== JSON.stringify(E.repairState(JSON.parse(JSON.stringify(old))))) s1.push('a saved design is repaired, its look kept');
    let seen = 0; const off = kept.subscribe(() => { seen++; });
    kept.update((s) => { s.name = 'X'; }); kept.replace(Object.assign({}, kept.get(), { name: 'Y' })); off(); kept.update((s) => { s.name = 'Z'; });
    if (seen !== 2 || kept.get().name !== 'Z' || st.m[STORE] !== JSON.stringify(old)) s1.push(`subscribe and update (seen ${seen}), nothing saved before save()`);
    kept.save(); if (JSON.parse(st.m[STORE]).name !== 'Z') s1.push('save() writes the design');
    const throwing = { getItem: () => { throw new Error('private'); }, setItem: () => { throw new Error('private'); }, removeItem: () => { throw new Error('private'); } };
    try { const p = ST.createStore({ storage: throwing, engine: E }); p.save(); if (p.keep('-folded').get() !== null) s1.push('a private window reads nothing'); p.keep('-folded').set('x'); p.keep('-folded').remove(); } catch (e) { s1.push('a private window throws: ' + e.message); }
    const k = kept.keep('-before'); k.set('abc'); if (st.m[STORE + '-before'] !== 'abc' || k.get() !== 'abc') s1.push('keep(suffix) reads and writes its own key'); k.remove(); if (STORE + '-before' in st.m) s1.push('keep(suffix).remove()');
    check(!s1.length, `S1 the store: ${s1.join('; ')}`);
  }
  if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); checks += CASES.length; }
  return { checks, problems };
}
