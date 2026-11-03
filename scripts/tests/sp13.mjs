// 0.3.2 SP13 (the split: pbip-page.js -> pbip-navigation.js, the page buttons and the filter panels; mcp/work/SP13.md):
// the theme generator's Power BI project download, rendered (the lab page, the one page with the project card, ?lang=en
// and ?lang=ar), is the download recorded on the base (integration/0.3.2 a57e094, before the move), on another layout
// than sp5's and sp7's (ops, 1920 x 1080, 3 KPI cards, the filters in a strip on top; in Arabic the slide-in filter
// panel too: the sample's two pages, so the page tabs, the strip's Reset and the panel's Close and Reset).
// The page's random source is seeded and its clock fixed by an init script (SP5's), and seeded again just before the
// click. Recorded in fixtures/sp13-download.json; SP13_RECORD=1 records again (only on the base, never to make a run
// pass). The background PNGs are drawn by the page's canvas (fonts and Chromium differ between machines): recorded,
// compared whole only with SP13_WHOLE=1 on the machine that recorded them.
//   W1, W2  EN and AR: the same files in the same order, every file but the PNGs byte for byte, and the ZIP container
//           byte for byte the writer's ZIP of its own entries (same clock)
//   W3      the page loaded pbip-navigation.min.js once, after pbip-tooltip.min.js and before pbip-page.min.js (SP13's move)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { visitor } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLD = path.join(HERE, 'fixtures', 'sp13-download.json');
const PAGE = '/tools/power-bi-theme-generator-lab.html';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

// the page's seeded random source and fixed clock (new Date() with no argument: 2 Nov 2026 10:20:30, page local time)
const SEEDED = () => {
  let s = 1;
  const next = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s; };
  window.__sp13seed = (n) => { s = n >>> 0 || 1; };
  Math.random = () => next() / 4294967296;
  const fill = (b) => { const u = new Uint8Array(b.buffer, b.byteOffset, b.byteLength); for (let i = 0; i < u.length; i++) u[i] = next() & 255; return b; };
  try { Object.defineProperty(crypto, 'getRandomValues', { value: fill, configurable: true, writable: true }); } catch (e) { /* ignore */ }
  const RealDate = Date, FIXED = new RealDate(2026, 10, 2, 10, 20, 30).getTime();
  Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(FIXED); } };
  Date.now = RealDate.now;
};

// a stored ZIP's entries in order, and each entry's header time and date
function entries(buf) {
  const out = []; let at = 0;
  while (buf.readUInt32LE(at) === 0x04034b50) {
    const n = buf.readUInt16LE(at + 26), x = buf.readUInt16LE(at + 28), size = buf.readUInt32LE(at + 18);
    out.push({ path: buf.slice(at + 30, at + 30 + n).toString('utf8'), data: new Uint8Array(buf.slice(at + 30 + n + x, at + 30 + n + x + size)), time: buf.readUInt16LE(at + 10), date: buf.readUInt16LE(at + 12) });
    at += 30 + n + x + size;
  }
  return out;
}

// the writer's ZIP of the same entries with the same header time, in Node
function rezip(list) {
  const require = createRequire(import.meta.url), P = require('../../assets/js/pbip-export.js');
  const { time, date } = list[0], RealDate = Date;
  const at = new RealDate(1980 + (date >> 9), ((date >> 5) & 15) - 1, date & 31, time >> 11, (time >> 5) & 63, (time & 31) * 2).getTime();
  globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(at); } };
  try { return Buffer.from(P.zip(list.map((e) => ({ path: e.path, data: e.data })))); } finally { globalThis.Date = RealDate; }
}

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const record = process.env.SP13_RECORD === '1', whole = process.env.SP13_WHOLE === '1';
  const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
  const loaded = []; let badOrder = false;

  for (const lang of ['en', 'ar']) {
    const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
    await v.ctx.addInitScript(SEEDED);
    await v.pg.goto(`${url}${PAGE}?lang=${lang}`, { waitUntil: 'networkidle' });
    await v.pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('dataarcus-theme-generator') || '{}'); s.name = 'SP13 Sales';
      s.layout = { v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', headLine: 'full', samples: true, transparent: true, preset: 'ops', kpis: 3, filters: true, fpos: 'top', page: '1920x1080' };
      localStorage.setItem('dataarcus-theme-generator', JSON.stringify(s)); });
    await v.pg.reload({ waitUntil: 'networkidle' });
    await v.pg.evaluate(() => window.__sp13seed(0x5e5));
    // (Arabic) the slide-in filter panel as well
    if (lang === 'ar') await v.pg.evaluate(() => { const p = document.getElementById('pbipPanel'); if (p && !p.checked) { p.checked = true; p.dispatchEvent(new Event('change', { bubbles: true })); } });
    const dlp = v.pg.waitForEvent('download');
    await v.pg.click('#pbipBtn');
    // an Arabic download on English names asks for the names first: every name kept in English (as scripts/tests/pbip.mjs)
    const asked = await Promise.race([dlp.then(() => false), v.pg.waitForSelector('#pbipNames:not([hidden])', { timeout: 60000 }).then(() => true)]);
    if (asked) { await v.pg.$$eval('#pbipNames input[type=checkbox]', (cs) => cs.forEach((c) => { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); })); await v.pg.click('#pbipNamesOk'); }
    const buf = fs.readFileSync(await (await dlp).path());
    // (W3) the scripts the page loaded, in the order it asked for them (BUILDER loads one after the other): the navigation after the tooltip pages, before the pages
    const order = await v.pg.evaluate(() => performance.getEntriesByType('resource').sort((x, y) => x.startTime - y.startTime).map((x) => x.name).filter((x) => /\/pbip-(tooltip|navigation|page|export)\.min\.js/.test(x)).map((x) => x.replace(/^.*\/(pbip-\w+)\.min\.js.*$/, '$1')));
    loaded.push(lang + ': ' + order.join(' '));
    if (!(order.filter((x) => x === 'pbip-navigation').length === 1 && order.indexOf('pbip-tooltip') < order.indexOf('pbip-navigation') && order.indexOf('pbip-navigation') < order.indexOf('pbip-page') && order.indexOf('pbip-page') < order.indexOf('pbip-export'))) badOrder = true;
    if (v.errs.length) problems.push(`${lang}: ${v.errs.join(' | ')}`);
    await v.ctx.close();

    const list = entries(buf), png = (p) => /\.png$/i.test(p);
    const now = { zip: sha(buf), order: list.map((e) => e.path),
      files: Object.fromEntries(list.filter((e) => !png(e.path)).map((e) => [e.path, sha(e.data)])),
      png: Object.fromEntries(list.filter((e) => png(e.path)).map((e) => [e.path, sha(e.data)])) };
    got[lang] = now;
    if (record) continue;
    const g = gold[lang] || {}, bad = [];
    if (JSON.stringify(now.order) !== JSON.stringify(g.order)) bad.push(`the files or their order differ (${now.order.length} files, recorded ${(g.order || []).length})`);
    const changed = Object.keys(Object.assign({}, g.files, now.files)).filter((k) => (g.files || {})[k] !== now.files[k]);
    if (changed.length) bad.push(`${changed.length} files differ: ${changed.slice(0, 4).join(', ')}`);
    if (!rezip(list).equals(buf)) bad.push('the ZIP container is not the writer\'s ZIP of its own entries');
    if (whole && now.zip !== g.zip) bad.push(`the whole ZIP differs (${now.zip.slice(0, 12)}, recorded ${String(g.zip).slice(0, 12)}; PNGs differ: ${Object.keys(now.png).filter((k) => now.png[k] !== (g.png || {})[k]).length})`);
    check(!bad.length, `${lang === 'en' ? 'W1' : 'W2'} ${lang} download: ${bad.join('; ')}`);
  }
  if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); checks += 2; }
  return { checks, problems };
}
