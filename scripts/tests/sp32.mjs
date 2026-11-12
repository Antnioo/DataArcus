// 0.3.2 SP32 (the split, finish: model-health.js -> health-worker-client.js, health-fix-plan.js, health-view.js;
// mcp/work/SP32.md): everything the Model Health Check page produces, recorded on the base (integration/0.3.2 2f02348,
// before any move) and compared after every move. The page, rendered (?lang=en and ?lang=ar, and the /ar/ page), checks
// 13 made-up inputs through its worker: sp24's ten models, a .pbix, a .bim with no model and a broken .pbit. For each
// model: the drop view, the result, every tab, the clicks a person makes (a "Show all", a category chip, a finding
// ignored and counted again, a confirm question answered and dismissed, a plan step ticked, a measure opened, searched
// and filtered, a table opened, the language flipped, "Check another file"), every copy button's text, the analytics
// events, the browser storage, and the worker's log (made, posted with which keys, terminated, each message's type).
// The worker's clock is stopped; dates are written as <DATE>. Each scenario in a fresh visitor. Recorded in
// fixtures/sp32-page.json; SP32_RECORD=1 records again (only on the base, never to make a run pass).
//   P1-P20  each model, EN and AR: every view, event, storage value, copied text and worker message as recorded
//   E1, E2  EN and AR: the error panels (.pbix, no model, not a template, the sample not reachable) and "Try another file"
//   L1-L10  the worker's lifecycle, EN and AR: a run cancelled by a second file (the first's worker terminated, its
//           answer never shown); two runs on one worker with the score history; the worker blocked; the worker failing
//           (stopped, a new one for the next file); offline after the page loaded (the worker was started at load)
//   X1, X2  the /ar/ page: the sample's walk and the error panels
//   C1, C2  (after the client move) MHWorkerClient in Node with a fake Worker: typed progress/result/error messages,
//           cancellation, no analytics in its messages, the worker reused; the sources: model-health.js starts no
//           worker, the stamp is in the client once; both pages load the client before model-health.min.js
//   F1      (after the fix plan move) MHFixPlan.plan in Node: the same plan twice, its input unchanged, nothing read
//           from the page
//   V1, V2  (after the view move) health-view.js holds the views and reads no storage, analytics or worker itself;
//           both pages load it before model-health.min.js; model-health.js keeps the orchestration only
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { visitor } from './lib.mjs';
import { stampOf } from '../stamps.mjs';
import { trickyModel, arabicModel, legacy, daxTables, mp, col } from '../../mcp/fixtures/health-models.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..');
const GOLD = path.join(HERE, 'fixtures', 'sp32-page.json');
const require = createRequire(import.meta.url);
const { zip } = require('../../assets/js/pbip-zip.js');
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const has = (f) => fs.existsSync(path.join(ROOT, 'assets/js', f));
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ---------- the 13 made-up inputs (sp24's ten models, the same builders) ----------
const utf16 = (s) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(s, 'utf16le')]);
const pbit = (model, layout) => Buffer.from(zip([{ path: 'DataModelSchema', data: new Uint8Array(utf16(JSON.stringify(model))) }]
  .concat(layout ? [{ path: 'Report/Layout', data: new Uint8Array(utf16(JSON.stringify(layout))) }] : [], [{ path: 'Version', data: new Uint8Array(utf16('1.28')) }])));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const folderZip = (dir, prefix, extra) => Buffer.from(zip(walk(dir).sort().map((f) => ({ path: prefix + path.relative(dir, f).split(path.sep).join('/'),
  data: new Uint8Array(Buffer.from(fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'))) })).concat(extra || [])));
const noMeasures = () => ({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Orders', partitions: mp('Orders'), columns: [col('Order ID', 'int64'), col('Product Key', 'int64'), col('Quantity', 'int64'), col('Order Date', 'dateTime')] },
  { name: 'Products', partitions: mp('Products'), columns: [col('Product Key', 'int64', { isKey: true }), col('Product', 'string'), col('Colour', 'string')] }],
relationships: [{ name: 'r1', fromTable: 'Orders', fromColumn: 'Product Key', toTable: 'Products', toColumn: 'Product Key' }] } });
const FIX = path.join(ROOT, 'scripts/tests/fixtures/model-health');
const TMDL = path.join(FIX, 'tmdl-health/definition');
const TRICKY = Buffer.from(JSON.stringify(trickyModel()));
const MODELS = [
  ['sample', null],
  ['tricky.bim', TRICKY],
  ['arabic.pbit', pbit(arabicModel(), legacy().files[0].json)],
  ['dax-tables.bim', Buffer.from(JSON.stringify(daxTables()))],
  ['no-measures.bim', Buffer.from(JSON.stringify(noMeasures()))],
  ['legacy.pbit', fs.readFileSync(path.join(FIX, 'legacy.pbit'))],
  ['Health Test.pbit', fs.readFileSync(path.join(FIX, 'tmdl-health/Health Test.pbit'))],
  ['ramadan.zip', folderZip(path.join(FIX, 'tmdl-ramadan/definition'), 'R.SemanticModel/definition/')],
  ['health-project.zip', folderZip(path.join(ROOT, 'mcp/fixtures/health-project'), 'Health/')],
  ['broken.zip', folderZip(TMDL, 'B.SemanticModel/definition/', [{ path: 'B.SemanticModel/definition/tables/Notes.tmdl', data: new Uint8Array(0) }])]
];
const ERRORS = [
  ['model.pbix', Buffer.from('PK\u0003\u0004 a .pbix holds data')],                   // refused before the worker
  ['notes.bim', Buffer.from(JSON.stringify({ hello: 'no model here' }))],              // the worker: NO_MODEL
  ['bad.pbit', Buffer.from('PK\u0003\u0004 not really a zip at all, cut short')]       // the worker: not a template
];

// dates and times a run can write
// the page writes them (the history's day, an export's time), so they are the page's days, not node's: set from the page's clock in open()
const around = (ms) => [-1, 0, 1].map((d) => new Date(ms + d * 864e5).toISOString().slice(0, 10));
let DATES = around(Date.now());
const undate = (t) => DATES.reduce((s, d) => s.split(d).join('<DATE>'), String(t)).replace(/<DATE>T[\d:.]+Z/g, '<TIME>');

// ---------- the page, watched: analytics, the clipboard, the worker ----------
function watch() {
  window.__ev = []; window.__clip = []; window.__wlog = [];
  let theirs = null;
  Object.defineProperty(window, 'dataArcusTrack', { configurable: true,
    get: () => (name, params) => { window.__ev.push([name, params || {}]); if (theirs) try { theirs(name, params); } catch (e) { /* ignore */ } },
    set: (f) => { theirs = f; } });
  try { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (t) => { window.__clip.push(String(t)); return Promise.resolve(); } } }); } catch (e) { /* ignore */ }
  const Native = window.Worker; let n = 0;
  window.Worker = class extends Native {
    constructor(url, o) {
      if (window.__blockWorker) { window.__wlog.push('blocked'); throw new Error('blocked'); }
      super(url, o); const id = ++n; this.__id = id;
      window.__wlog.push('new ' + id + ' ' + String(url).replace(/^.*\/assets\/js\//, ''));
      this.addEventListener('message', (e) => window.__wlog.push('msg ' + id + ' ' + (e.data && e.data.type) + (e.data && e.data.step ? ':' + e.data.step : '') + (e.data && e.data.code ? ':' + e.data.code : '')));
      this.addEventListener('error', () => window.__wlog.push('error ' + id));
    }
    postMessage(m, t) { window.__wlog.push('post ' + this.__id + ' ' + Object.keys(m || {}).sort().join(',') + ' ' + (m && m.fileName) + ' transfer:' + (t ? t.length : 0)); return super.postMessage(m, t); }
    terminate() { window.__wlog.push('terminate ' + this.__id); return super.terminate(); }
  };
}

async function open(browser, url, page, lang, opts = {}) {
  const v = await visitor(browser, { viewport: [1440, 900] });
  DATES = around(await v.pg.evaluate(() => Date.now()));
  await v.ctx.addInitScript(watch);
  if (opts.block) await v.ctx.addInitScript(() => { window.__blockWorker = true; });
  if (opts.noSample) await v.ctx.route(/model-health-sample\.pbit/, (rt) => rt.fulfill({ status: 404, body: '' }));
  await v.ctx.route(/model-health-worker\.min\.js/, async (rt) => {
    if (opts.failing) return rt.fulfill({ status: 200, contentType: 'text/javascript', body: 'self.onmessage = () => { throw new Error("boom"); };' });
    const r = await rt.fetch(); let body = 'Date.now = () => 1e12;\n' + await r.text();
    // the run of "slow.bim" waits 3 s before it starts: time to drop another file
    if (opts.slow) body += '\n;(() => { const go = self.onmessage; self.onmessage = (ev) => (ev.data.fileName === "slow.bim" ? setTimeout(() => go(ev), 3000) : go(ev)); })();';
    await rt.fulfill({ response: r, body });
  });
  await v.pg.goto(`${url}${page}${lang ? '?lang=' + lang : ''}`, { waitUntil: 'networkidle' });
  return v;
}

const tick = (v, ms = 30) => v.pg.waitForTimeout(ms);
const click = async (v, sel, i = 0) => { const ok = await v.pg.evaluate(([s, k]) => { const e = document.querySelectorAll(s)[k]; if (!e) return false; e.click(); return true; }, [sel, i]); await tick(v); return ok; };
const count = (v, sel) => v.pg.evaluate((s) => document.querySelectorAll(s).length, sel);
const drop = async (v, name, buffer) => { await v.pg.setInputFiles('#mhFile', { name, mimeType: 'application/octet-stream', buffer }); };
const settled = (v) => v.pg.waitForSelector('.mh-unreadable, #mhTab, .mh-error', { timeout: 30000 });

// a record of a visit: every snapshot of #mhApp, then the events, storage, copied text and the worker's log
function recorder(v) {
  const steps = [], html = {};
  const snap = async (label) => { const h = undate(await v.pg.evaluate(() => document.getElementById('mhApp').innerHTML)); steps.push([label, h.length, sha(h)]); html[label] = h; };
  const finish = async () => {
    const s = await v.pg.evaluate(() => ({ ev: window.__ev, clip: window.__clip, wlog: window.__wlog,
      local: Object.keys(localStorage).filter((k) => /^dataarcus-(mh|confirm)/.test(k)).sort().map((k) => [k, localStorage.getItem(k)]),
      session: Object.keys(sessionStorage).filter((k) => /^dataarcus-mh/.test(k)).sort().map((k) => [k, sessionStorage.getItem(k)]) }));
    return { steps, events: JSON.parse(undate(JSON.stringify(s.ev))), clip: s.clip.map((t) => [undate(t).length, sha(undate(t))]),
      local: JSON.parse(undate(JSON.stringify(s.local))), session: s.session, worker: s.wlog, errs: v.errs.slice() };
  };
  return { snap, finish, html };
}

// one model, every view and click
async function walkModel(browser, url, page, lang, name, buffer) {
  const v = await open(browser, url, page, lang), r = recorder(v);
  await r.snap('drop');
  if (buffer) await drop(v, name, buffer); else await click(v, '#mhSample');
  await settled(v); await tick(v, 100);
  await r.snap('result');
  if (await count(v, '[data-tab]')) {
    await click(v, '[data-tab="issues"]'); await r.snap('issues');
    if (await click(v, '[data-more]')) await r.snap('issues:more');
    await click(v, '[data-cat="perf"]'); await r.snap('issues:perf');
    await click(v, '[data-cat="all"]');
    if (await click(v, '[data-ign]')) { await r.snap('issues:ignored'); await click(v, '[data-ign]'); await r.snap('issues:again'); }
    if (await click(v, '[data-qanswer="intended"]')) await r.snap('issues:answered');
    if (await click(v, '[data-qdismiss]')) await r.snap('issues:dismissed');
    await click(v, '[data-tab="fix"]'); await r.snap('fix');
    for (let i = 0, n = await count(v, '[data-script]'); i < n; i++) await click(v, '[data-script]', i);
    if (await click(v, '[data-step]', 1)) await r.snap('fix:step');
    await click(v, '[data-tab="unused"]'); await r.snap('unused');
    for (let i = 0, n = await count(v, '[data-copy]'); i < n; i++) await click(v, '[data-copy]', i);
    if (await click(v, '#mhTab [data-ms]')) await r.snap('unused:measure');
    await click(v, '[data-tab="measures"]'); await r.snap('measures');
    if (await click(v, '.mh-mrow', 1)) await r.snap('measures:open');
    if (await click(v, '.mh-dep.measure')) await r.snap('measures:dep');
    await v.pg.evaluate(() => { const q = document.getElementById('mhQ'); q.value = 'a'; q.dispatchEvent(new Event('input')); }); await tick(v); await r.snap('measures:search');
    await click(v, '[data-mf="unused"]'); await r.snap('measures:unused');
    await click(v, '[data-tab="tables"]'); await r.snap('tables');
    if (await click(v, 'tr[data-t]')) await r.snap('tables:open');
    await click(v, '[data-tab="rels"]'); await r.snap('rels');
    await click(v, '[data-tab="docs"]'); await r.snap('docs');
  }
  const was = await v.pg.evaluate(() => document.documentElement.lang);
  await v.pg.evaluate((l) => { document.documentElement.lang = l; }, was === 'ar' ? 'en' : 'ar'); await tick(v, 60); await r.snap('flipped');
  await v.pg.evaluate((l) => { document.documentElement.lang = l; }, was); await tick(v, 60); await r.snap('flipped-back');
  if (await click(v, '#mhNew')) await r.snap('new');
  const out = await r.finish(); await v.ctx.close(); return { out, html: r.html };
}

async function walkErrors(browser, url, page, lang) {
  const v = await open(browser, url, page, lang, { noSample: true }), r = recorder(v);
  for (const [name, buffer] of ERRORS) { await drop(v, name, buffer); await settled(v); await tick(v, 60); await r.snap(name); await click(v, '#mhAgain'); await r.snap(name + ':again'); }
  await click(v, '#mhSample'); await v.pg.waitForSelector('.mh-error', { timeout: 30000 }); await tick(v, 60); await r.snap('sample-unreachable');
  const out = await r.finish(); await v.ctx.close(); return { out, html: r.html };
}

const LIFE = {
  // a run still going when another file comes: the language flipped during the run shows the drop zone again
  async cancel(browser, url, lang) {
    const v = await open(browser, url, '/tools/power-bi-model-health-check.html', lang, { slow: true }), r = recorder(v);
    await drop(v, 'slow.bim', Buffer.from(JSON.stringify(arabicModel()))); await tick(v, 100); await r.snap('loading');
    const was = await v.pg.evaluate(() => document.documentElement.lang);
    await v.pg.evaluate((l) => { document.documentElement.lang = l; }, was === 'ar' ? 'en' : 'ar'); await tick(v, 60);
    await v.pg.evaluate((l) => { document.documentElement.lang = l; }, was); await tick(v, 60); await r.snap('drop-during-run');
    await drop(v, 'tricky.bim', TRICKY); await settled(v); await tick(v, 3500); await r.snap('second');
    const out = await r.finish(); await v.ctx.close(); return { out, html: r.html };
  },
  async reuse(browser, url, lang) {
    const v = await open(browser, url, '/tools/power-bi-model-health-check.html', lang), r = recorder(v);
    for (const [k, name, b] of [[1, 'tricky.bim', TRICKY], [2, 'tricky.bim', TRICKY], [3, 'no-measures.bim', MODELS[4][1]]]) {
      await drop(v, name, b); await settled(v); await tick(v, 100); await r.snap('run' + k); await click(v, '#mhNew');
    }
    const out = await r.finish(); await v.ctx.close(); return { out, html: r.html };
  },
  async blocked(browser, url, lang) {
    const v = await open(browser, url, '/tools/power-bi-model-health-check.html', lang, { block: true }), r = recorder(v);
    await drop(v, 'tricky.bim', TRICKY); await settled(v); await tick(v, 60); await r.snap('blocked');
    await click(v, '#mhAgain'); await r.snap('again');
    const out = await r.finish(); await v.ctx.close(); return { out, html: r.html };
  },
  async failing(browser, url, lang) {
    const v = await open(browser, url, '/tools/power-bi-model-health-check.html', lang, { failing: true }), r = recorder(v);
    for (const k of [1, 2]) { await drop(v, 'tricky.bim', TRICKY); await settled(v); await tick(v, 100); await r.snap('failed' + k); await click(v, '#mhAgain'); }
    const out = await r.finish(); await v.ctx.close(); return { out, html: r.html };
  },
  async offline(browser, url, lang) {
    const v = await open(browser, url, '/tools/power-bi-model-health-check.html', lang), r = recorder(v);
    await v.pg.waitForFunction(() => window.__wlog.length > 0); await v.pg.waitForTimeout(500);
    await v.ctx.setOffline(true);
    await drop(v, 'tricky.bim', TRICKY); await settled(v); await tick(v, 100); await r.snap('offline');
    await v.ctx.setOffline(false);
    const out = await r.finish(); await v.ctx.close(); return { out, html: r.html };
  }
};

// ---------- after the moves: the modules in Node ----------
function clientContract(problems) {
  const C = require('../../assets/js/health-worker-client.js'), bad = [];
  const made = [];
  class Fake { constructor(url) { this.url = url; this.posted = []; this.dead = false; made.push(this); } postMessage(m, t) { this.posted.push([m, t]); } terminate() { this.dead = true; } }
  const c = C.create({ Worker: Fake }), got = [];
  if (made.length !== 1 || !/model-health-worker\.min\.js\?v=/.test(made[0].url)) bad.push('one worker started at create, with the stamped URL');
  const b1 = new ArrayBuffer(4);
  c.run(b1, 'a.bim', (m) => got.push(m));
  const w = made[0];
  if (!w.posted.length || JSON.stringify(Object.keys(w.posted[0][0]).sort()) !== '["buffer","fileName"]' || w.posted[0][1][0] !== b1) bad.push('posts { buffer, fileName } with the buffer transferred');
  w.onmessage({ data: { type: 'progress', step: 'model' } });
  w.onmessage({ data: { type: 'done', result: { meta: { fileName: 'a.bim' } } } });
  if (JSON.stringify(got) !== JSON.stringify([{ type: 'progress', step: 'model' }, { type: 'result', result: { meta: { fileName: 'a.bim' } } }])) bad.push('typed progress and result: ' + JSON.stringify(got));
  // a second run reuses the worker; a third while it runs cancels it (terminated, a new one)
  got.length = 0; c.run(new ArrayBuffer(1), 'b.bim', (m) => got.push(m));
  if (made.length !== 1 || w.dead) bad.push('the idle worker is reused');
  c.run(new ArrayBuffer(1), 'c.bim', (m) => got.push(m));
  if (!w.dead || made.length !== 2) bad.push('a run still going is cancelled: its worker terminated, a new one started');
  made[1].onmessage({ data: { type: 'error', code: 'NO_MODEL', message: 'NO_MODEL' } });
  if (JSON.stringify(got) !== JSON.stringify([{ type: 'error', code: 'NO_MODEL', message: 'NO_MODEL' }])) bad.push('typed error: ' + JSON.stringify(got));
  // a failing worker is not kept
  got.length = 0; c.run(new ArrayBuffer(1), 'd.bim', (m) => got.push(m)); made[1].onerror();
  if (!made[1].dead || JSON.stringify(got) !== JSON.stringify([{ type: 'error', code: 'PARSE' }])) bad.push('a failing worker: terminated, an error PARSE: ' + JSON.stringify(got));
  got.length = 0; c.run(new ArrayBuffer(1), 'e.bim', (m) => got.push(m));
  if (made.length !== 3) bad.push('after a failure the next run starts a new worker');
  c.cancel(); if (!made[2].dead) bad.push('cancel() terminates the running worker');
  // blocked: no worker can start
  const blocked = C.create({ Worker: class { constructor() { throw new Error('blocked'); } } }), gb = [];
  blocked.run(new ArrayBuffer(1), 'x.bim', (m) => gb.push(m));
  if (JSON.stringify(gb) !== JSON.stringify([{ type: 'error', code: 'WORKER' }])) bad.push('a blocked worker: an error WORKER: ' + JSON.stringify(gb));
  const src = read('assets/js/health-worker-client.js').replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
  const reads = /\b(document|localStorage|sessionStorage|dataArcusTrack|track|navigator|location)\b/.exec(src);
  if (reads) bad.push('the client reads ' + reads[0]);
  problems.push(...bad);
}

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const record = process.env.SP32_RECORD === '1';
  // (ST1) the worker's URL was recorded with the stamp typed then; the page now holds the file's content stamp (the one helper)
  const worker = 'model-health-worker.min.js?v=' + stampOf(path.join(ROOT, 'assets/js/model-health-worker.min.js'));
  const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8').replace(/model-health-worker\.min\.js\?v=[\w.-]+/g, worker)), got = {};
  const EN = '/tools/power-bi-model-health-check.html', AR = '/ar/tools/power-bi-model-health-check.html';
  const compare = (id, key, res) => {
    got[key] = res.out;
    if (record) return;
    const g = gold[key], now = res.out;
    const diff = !g ? ['no record'] : Object.keys(now).filter((k) => JSON.stringify(g[k]) !== JSON.stringify(now[k]));
    const where = diff.includes('steps') && g ? now.steps.filter((s, i) => JSON.stringify(s) !== JSON.stringify(g.steps[i])).map((s) => {
      const f = path.join(os.tmpdir(), `sp32-${key.replace(/\W+/g, '_')}-${s[0].replace(/\W+/g, '_')}.html`); fs.writeFileSync(f, res.html[s[0]] || ''); return `${s[0]} (now in ${f})`; }) : [];
    check(!diff.length && !now.errs.length, `${id} ${key}: as recorded: ${diff.map((k) => k === 'steps' ? 'steps ' + where.join(', ') : k + ' now ' + JSON.stringify(now[k]).slice(0, 300)).join('; ')} ${now.errs.join(' | ')}`.trim());
  };
  let n = 0;
  for (const lang of ['en', 'ar']) for (const [name, buffer] of MODELS) compare('P' + (++n), `${lang} ${name}`, await walkModel(browser, url, EN, lang, name, buffer));
  compare('E1', 'en errors', await walkErrors(browser, url, EN, 'en'));
  compare('E2', 'ar errors', await walkErrors(browser, url, EN, 'ar'));
  n = 0;
  for (const k of Object.keys(LIFE)) for (const lang of ['en', 'ar']) compare('L' + (++n), `${lang} life:${k}`, await LIFE[k](browser, url, lang));
  compare('X1', 'ar-page sample', await walkModel(browser, url, AR, null, 'sample', null));
  compare('X2', 'ar-page errors', await walkErrors(browser, url, AR, null));
  if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); return { checks, problems }; }

  const page = read('assets/js/model-health.js');
  const pages = [read('tools/power-bi-model-health-check.html'), read('ar/tools/power-bi-model-health-check.html')];
  const before = (h, a, b) => { const i = h.indexOf(a + '.min.js?v='), j = h.indexOf('js/' + b + '.min.js?v='); return i >= 0 && i < j && h.split(a + '.min.js?v=').length === 2; };
  if (has('health-worker-client.js')) {
    const bad = []; try { clientContract(bad); } catch (e) { bad.push('crashed: ' + e.message); }
    check(!bad.length, `C1 MHWorkerClient: buffers in, typed progress/result/error out, cancellation, no analytics: ${bad.join('; ')}`);
    const stamps = (page + read('assets/js/health-worker-client.js')).match(/model-health-worker\.min\.js\?v=/g) || [];
    check(!/new Worker\(|WORKER_URL/.test(page) && stamps.length === 1 && /MHWorkerClient\.create\(/.test(page) && pages.every((h) => before(h, 'health-worker-client', 'model-health')),
      'C2 model-health.js starts no worker (MHWorkerClient does; the stamp once, in the client); both pages load the client before model-health.min.js');
  }
  if (has('health-fix-plan.js')) {
    const P = require('../../assets/js/health-fix-plan.js'), E = require('../../assets/js/model-health-engine.js'), T = require('../../assets/js/model-health-tmdl.js'), bad = [];
    for (const [label, model, report] of [['tricky', trickyModel(), null], ['arabic', arabicModel(), legacy()], ['dax', daxTables(), null]]) {
      const result = Object.assign(E.analyze(model, report), { meta: { fileName: label + '.bim', source: 'bim', hasReport: !!report } });
      for (const lang of ['en', 'ar']) {
        const input = { result, ignored: new Set(['UNUSED_COL']), lang, tmdl: T }, was = JSON.stringify(result);
        const a = P.plan(input), b = P.plan(input);
        if (!a || !a.scripts || JSON.stringify(a) !== JSON.stringify(b)) bad.push(`${label} ${lang}: not the same plan twice`);
        if (JSON.stringify(result) !== was || input.ignored.size !== 1) bad.push(`${label} ${lang}: the input changed`);
      }
    }
    const src = read('assets/js/health-fix-plan.js').replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
    const reads = /\b(document|localStorage|sessionStorage|Worker|navigator|location|Date|innerHTML)\b|window\.(?!MHFixPlan)/.exec(src.replace(/root\.MHFixPlan = api/, ''));
    if (reads) bad.push('the module reads ' + reads[0]);
    if (/function (quickEdits|cleanupPlan|quickFixScript|tmdlScripts)\b/.test(page)) bad.push('model-health.js still builds the plan');
    check(!bad.length, `F1 MHFixPlan.plan is pure (the same plan twice, its input unchanged, nothing read from the page): ${bad.join('; ')}`);
  }
  if (has('health-view.js')) {
    const v = read('assets/js/health-view.js'), vc = v.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
    check(/function renderResult\b/.test(v) && /function tIssues\b/.test(v) && /function showError\b/.test(v) && !/innerHTML|function (renderResult|tIssues|tFix|showError|loading)\b/.test(page)
      && !/\b(localStorage|dataArcusTrack|Worker|MHWorkerClient)\b/.test(vc),
    'V1 health-view.js holds the views and the error/loading UI and reads no storage, analytics or worker itself; model-health.js renders nothing');
    check(pages.every((h) => before(h, 'health-view', 'model-health') && before(h, 'health-fix-plan', 'health-view')),
      'V2 both pages load health-fix-plan.min.js, then health-view.min.js, before model-health.min.js');
  }
  return { checks, problems };
}
