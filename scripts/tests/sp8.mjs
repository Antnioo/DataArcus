// 0.3.2 SP8 (the split: pbip-bind.js's DOM field picker -> field-picker-ui.js; mcp/work/SP8.md): the theme generator's
// field picker, rendered (the lab page, the one page with the project card, ?lang=en and ?lang=ar, with the bridge
// project's folder chosen, as scripts/tests/pbip.mjs does), is the picker recorded on the base (integration/0.3.2 7797bf6,
// before the move): its DOM (#pbipMap: every row's label, every select's attributes, options in order, optgroups and the
// selected item), the same after two changed choices (the main measure and the first slicer, each to its last option),
// and the download made after them (every file but the canvas-drawn PNGs, byte for byte; SP5's seeded random source and
// fixed clock; the folder's files in the order of their paths, which the file system gives in no fixed order).
// Recorded in fixtures/sp8-picker.json; SP8_RECORD=1 records again (only on the base, never to make a run pass).
//   W1, W2  EN and AR: the picker's DOM before and after the two choices, and the download's files
//   W3      the page loaded field-picker-ui.min.js before pbip-bind.min.js, each once (SP8's move)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { visitor } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLD = path.join(HERE, 'fixtures', 'sp8-picker.json');
const PROJECT = path.join(HERE, 'fixtures', 'bridge-project');
const PAGE = '/tools/power-bi-theme-generator-lab.html';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

// the page's seeded random source and fixed clock (SP5's: new Date() with no argument is 2 Nov 2026 10:20:30)
const SEEDED = () => {
  let s = 1;
  const next = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s; };
  window.__sp8seed = (n) => { s = n >>> 0 || 1; };
  Math.random = () => next() / 4294967296;
  const fill = (b) => { const u = new Uint8Array(b.buffer, b.byteOffset, b.byteLength); for (let i = 0; i < u.length; i++) u[i] = next() & 255; return b; };
  try { Object.defineProperty(crypto, 'getRandomValues', { value: fill, configurable: true, writable: true }); } catch (e) { /* ignore */ }
  const RealDate = Date, FIXED = new RealDate(2026, 10, 2, 10, 20, 30).getTime();
  Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(FIXED); } };
  Date.now = RealDate.now;
  // a folder's files in the order of their paths: the browser gives them in the file system's own directory order,
  // which differs between machines (this container's and CI's), and the picker groups its tables in the model's order
  const files = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');
  Object.defineProperty(HTMLInputElement.prototype, 'files', { configurable: true, set(v) { files.set.call(this, v); },
    get() { const f = files.get.call(this); return f && this.webkitdirectory ? Array.from(f).sort((a, b) => (a.webkitRelativePath < b.webkitRelativePath ? -1 : a.webkitRelativePath > b.webkitRelativePath ? 1 : 0)) : f; } });
};

// a stored ZIP's entries in order
function entries(buf) {
  const out = []; let at = 0;
  while (buf.readUInt32LE(at) === 0x04034b50) {
    const n = buf.readUInt16LE(at + 26), x = buf.readUInt16LE(at + 28), size = buf.readUInt32LE(at + 18);
    out.push({ path: buf.slice(at + 30, at + 30 + n).toString('utf8'), data: buf.slice(at + 30 + n + x, at + 30 + n + x + size) });
    at += 30 + n + x + size;
  }
  return out;
}

// the picker as the visitor and a screen reader meet it: each node's name, attributes (sorted), the select's live
// value and each option's selected state, and its text, in document order
const DOM = () => {
  const walk = (n) => {
    if (n.nodeType === 3) return n.textContent ? ['#text', n.textContent] : null;
    if (n.nodeType !== 1) return null;
    const attrs = [...n.attributes].map((a) => [a.name, a.value]).sort((x, y) => (x[0] < y[0] ? -1 : 1));
    const live = n.tagName === 'SELECT' ? { value: n.value, index: n.selectedIndex } : n.tagName === 'OPTION' ? { selected: n.selected } : {};
    return [n.tagName.toLowerCase(), attrs, live, [...n.childNodes].map(walk).filter(Boolean)];
  };
  const el = document.getElementById('pbipMap');
  return JSON.stringify([...el.childNodes].map(walk).filter(Boolean));
};

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const record = process.env.SP8_RECORD === '1';
  const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
  const loaded = []; let badOrder = false;

  for (const lang of ['en', 'ar']) {
    const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
    await v.ctx.addInitScript(SEEDED);
    await v.pg.goto(`${url}${PAGE}?lang=${lang}`, { waitUntil: 'networkidle' });
    await v.pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('dataarcus-theme-generator') || '{}'); s.name = 'SP8 Sales';
      s.layout = { v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', headLine: 'full', samples: true, transparent: true, preset: 'exec', kpis: 4, filters: true, fpos: 'top', page: '1920x1080' };
      localStorage.setItem('dataarcus-theme-generator', JSON.stringify(s)); });
    await v.pg.reload({ waitUntil: 'networkidle' });
    await v.pg.selectOption('#pbipData', 'local');
    await v.pg.setInputFiles('#pbipFolder', PROJECT);
    await v.pg.waitForFunction(() => document.querySelectorAll('#pbipMap select').length > 0 && !/Reading the model|جارٍ قراءة النموذج/.test((document.getElementById('pbipOwnMsg') || {}).textContent || ''), null, { timeout: 15000 });
    const before = await v.pg.evaluate(DOM);
    // two changed choices, each select to its last option, as a visitor's pick (a change event that bubbles)
    for (const p of ['main', 'slicers.0']) await v.pg.$eval(`#pbipMap select[data-path="${p}"]`, (s) => { s.selectedIndex = s.options.length - 1; s.dispatchEvent(new Event('change', { bubbles: true })); });
    const after = await v.pg.evaluate(DOM);
    await v.pg.evaluate(() => window.__sp8seed(0x5e8));
    const dlp = v.pg.waitForEvent('download');
    await v.pg.click('#pbipBtn');
    // an Arabic download on English names asks for the names first: every name kept in English (as scripts/tests/pbip.mjs)
    const asked = await Promise.race([dlp.then(() => false), v.pg.waitForSelector('#pbipNames:not([hidden])', { timeout: 60000 }).then(() => true)]);
    if (asked) { await v.pg.$$eval('#pbipNames input[type=checkbox]', (cs) => cs.forEach((c) => { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); })); await v.pg.click('#pbipNamesOk'); }
    const buf = fs.readFileSync(await (await dlp).path());
    // (W3) the picker's scripts in the order the page asked for them (loadBind loads one after the other)
    const order = await v.pg.evaluate(() => performance.getEntriesByType('resource').sort((x, y) => x.startTime - y.startTime).map((x) => x.name).filter((x) => /\/(field-picker-ui|pbip-bind)\.min\.js/.test(x)).map((x) => x.replace(/^.*\/([\w-]+)\.min\.js.*$/, '$1')));
    loaded.push(lang + ': ' + order.join(' '));
    if (!(order.length === 2 && order[0] === 'field-picker-ui' && order[1] === 'pbip-bind')) badOrder = true;
    if (v.errs.length) problems.push(`${lang}: ${v.errs.join(' | ')}`);
    await v.ctx.close();

    const list = entries(buf);
    const now = { before: sha(before), after: sha(after), selects: (before.match(/"select"/g) || []).length, differs: before !== after,
      order: list.map((e) => e.path), files: Object.fromEntries(list.filter((e) => !/\.png$/i.test(e.path)).map((e) => [e.path, sha(e.data)])) };
    got[lang] = now;
    if (record) continue;
    const g = gold[lang] || {}, bad = [];
    if (now.before !== g.before) bad.push('the picker drawn differs');
    if (now.after !== g.after) bad.push('the picker after two choices differs');
    if (now.selects !== g.selects || now.differs !== g.differs) bad.push(`selects ${now.selects} (recorded ${g.selects}), changed ${now.differs}`);
    if (JSON.stringify(now.order) !== JSON.stringify(g.order)) bad.push(`the files or their order differ (${now.order.length} files, recorded ${(g.order || []).length})`);
    const changed = Object.keys(Object.assign({}, g.files, now.files)).filter((k) => (g.files || {})[k] !== now.files[k]);
    if (changed.length) bad.push(`${changed.length} files differ: ${changed.slice(0, 4).join(', ')}`);
    check(!bad.length, `${lang === 'en' ? 'W1' : 'W2'} ${lang} picker and download: ${bad.join('; ')}`);
  }
  if (!record && process.env.SP8_BASE !== '1') check(!badOrder, `W3 the page must load field-picker-ui.min.js, then pbip-bind.min.js, once each: ${loaded.join(' | ')}`);
  if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); checks += 2; }
  return { checks, problems };
}
