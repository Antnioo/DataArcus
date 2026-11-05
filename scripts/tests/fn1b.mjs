// 0.3.2 FN1B (mount, init and create into named steps; mcp/work/FN1B.md): parts of the pages that no website suite
// turned red when broken on the base (5e7eff3b), pinned as they behave today. Made-up models and values only.
//   P1 the Theme Generator's background PNG (theme-download-ui.js pngPart): right after its header, the two text chunks
//      that credit DataArcus (Software, Source), each with a valid CRC, and the picture's own chunks after them
//   K1 the project card's field picker (modelPart): a 2-KPI layout with "a second page" (on by default) shows 4 KPI
//      pickers; the second page off, 2
//   M1 the project card (modelPart): a folder with no .SemanticModel says so, in words
//   A1 the home page (site-navigation.js effectsPart): AOS starts once, 800 ms, ease-out-cubic, on a desktop with motion
//   H1 the phone menu (topOffsetPart): an in-page link inside the open menu closes it (a made-up link: no page has one)
//   D1-D4 the SVG KPI Designer's panels (svg-editor-panels.js): D1 an A - B formula's result in the data panel; D2 a
//      value "Hide when blank" uses cannot be removed (said in the toast); D3 the self-comparison warning names a value
//      by its label; D4 the add bar sends svgkpi_add_layer with the layer's type
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { visitor, ready } from './lib.mjs';
import { model } from './arabic-names.mjs';
import { h, frame } from './sp25.mjs';

// the PNG's chunks: { type, data, crcOk }
const chunks = (buf) => {
  const out = [];
  for (let at = 8; at + 12 <= buf.length;) {
    const n = buf.readUInt32BE(at), type = buf.toString('latin1', at + 4, at + 8), data = buf.subarray(at + 8, at + 8 + n);
    const crcOk = zlib.crc32(buf.subarray(at + 4, at + 8 + n)) === buf.readUInt32BE(at + 8 + n);
    out.push({ type, data, crcOk });
    at += 12 + n;
  }
  return out;
};
// every analytics call the page makes, kept in window.__ev (as FN1A's D1)
const EVENTS = () => {
  window.__ev = []; let theirs = null;
  Object.defineProperty(window, 'dataArcusTrack', { configurable: true,
    get: () => (name, params) => { window.__ev.push([name, params || {}]); if (theirs) try { theirs(name, params); } catch (e) { /* ignore */ } },
    set: (f) => { theirs = f; } });
};

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fn1b-'));

  // P1 (the plain design: its background is drawn on a canvas, then credited; the glass picture comes from the engine)
  {
    const v = await visitor(browser, { downloads: true, plainDesign: true });
    try {
      await v.pg.goto(`${url}/tools/power-bi-theme-generator.html?lang=en`, { waitUntil: 'networkidle' });
      await ready(v.pg);
      const [d] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('#pngBtn')]);
      const buf = fs.readFileSync(await d.path()), cs = chunks(buf);
      const text = cs.filter((c) => c.type === 'tEXt').map((c) => c.data.toString('latin1'));
      const want = ['Software\0DataArcus Power BI Theme & Layout Generator', 'Source\0https://dataarcus.com/tools/power-bi-theme-generator.html'];
      const order = cs.map((c) => c.type).slice(0, 4).join(' ');
      check(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && order === 'IHDR tEXt tEXt IDAT' && JSON.stringify(text) === JSON.stringify(want)
        && cs.every((c) => c.crcOk) && cs[cs.length - 1].type === 'IEND' && !v.errs.length,
      `P1 the background PNG must carry, after its header, the credits ${JSON.stringify(want)}: got chunks "${order}", text ${JSON.stringify(text)}, CRCs ${cs.every((c) => c.crcOk) ? 'valid' : 'broken'} ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }

  // K1, M1: the lab page's project card, "Your own model: a local project", with a 2-KPI layout
  {
    const cols = (xs) => xs.map(([name, dataType]) => ({ name, dataType }));
    const own = model(tmp, 'Own', [
      { name: 'Sales', columns: cols([['Amount', 'double'], ['Cost', 'double'], ['Qty', 'double'], ['Customer', 'string'], ['Order Date', 'dateTime']]),
        measures: [['Total Sales', 'SUM ( Sales[Amount] )'], ['Orders', 'COUNTROWS ( Sales )'], ['Total Cost', 'SUM ( Sales[Cost] )'], ['Units', 'SUM ( Sales[Qty] )']].map(([name, expression]) => ({ name, expression, formatString: '#,0' })) },
      { name: 'Calendar', dataCategory: 'Time', columns: [{ name: 'Date', dataType: 'dateTime', isKey: true }, { name: 'Month', dataType: 'string' }] }],
    [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }]);
    const empty = path.join(tmp, 'NoModel'); fs.mkdirSync(empty); fs.writeFileSync(path.join(empty, 'notes.txt'), 'made-up');
    const v = await visitor(browser, { viewport: [1440, 900] });
    try {
      await v.pg.goto(`${url}/tools/power-bi-theme-generator-lab.html?lang=en`, { waitUntil: 'networkidle' });
      await v.pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('dataarcus-theme-generator') || '{}'); s.name = 'Shop';
        s.layout = { v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', headLine: 'full', samples: true, transparent: true, preset: 'exec', kpis: 2, filters: true, fpos: 'top', page: '1920x1080' };
        localStorage.setItem('dataarcus-theme-generator', JSON.stringify(s)); });
      await v.pg.reload({ waitUntil: 'networkidle' });
      await v.pg.selectOption('#pbipData', 'local');
      await v.pg.setInputFiles('#pbipFolder', empty);
      await v.pg.waitForFunction(() => /SemanticModel/.test((document.getElementById('pbipOwnMsg') || {}).textContent || ''), null, { timeout: 15000 }).catch(() => {});
      const msg = await v.pg.evaluate(() => document.getElementById('pbipOwnMsg').textContent);
      check(msg === 'No .SemanticModel folder here. Choose the folder you saved the Power BI project in.', `M1 a folder with no model must say "No .SemanticModel folder here. Choose the folder you saved the Power BI project in.": got "${msg}"`);
      await v.pg.setInputFiles('#pbipFolder', own);
      await v.pg.waitForFunction(() => document.querySelectorAll('#pbipMap select').length > 0 && !/Reading the model/.test(document.getElementById('pbipOwnMsg').textContent), null, { timeout: 15000 });
      const kpis = () => v.pg.evaluate(() => document.querySelectorAll('#pbipMap select[data-path^="kpis."]').length);
      const before = await kpis();
      await v.pg.click('#pbipPages');
      await v.pg.waitForTimeout(300);
      const after = await kpis();
      check(before === 4 && after === 2 && !v.errs.length, `K1 the KPI pickers must be 4 with the second page, then 2 without: got ${before}, then ${after} ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }

  // A1: the options AOS starts with (its init, wrapped as the library arrives)
  {
    const v = await visitor(browser, { viewport: [1440, 900] });
    try {
      await v.ctx.addInitScript(() => {
        let lib; window.__aos = [];
        Object.defineProperty(window, 'AOS', { configurable: true, get: () => lib,
          set: (x) => { lib = x; if (x && typeof x.init === 'function') { const init = x.init; x.init = function (o) { window.__aos.push(JSON.stringify(o)); return init.apply(this, arguments); }; } } });
      });
      await v.pg.goto(`${url}/index.html?lang=en`, { waitUntil: 'networkidle' });
      const got = await v.pg.evaluate(() => window.__aos);
      const want = JSON.stringify({ once: true, duration: 800, easing: 'ease-out-cubic', disable: false });
      check(got.length === 1 && got[0] === want && !v.errs.length, `A1 AOS must start once with ${want}: got ${JSON.stringify(got)} ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }

  // H1: a phone, the menu open, a made-up in-page link inside it
  {
    const v = await visitor(browser, { viewport: [390, 800] });
    try {
      await v.pg.goto(`${url}/index.html?lang=en`, { waitUntil: 'networkidle' });
      await v.pg.click('.navbar-toggler');
      await v.pg.waitForSelector('#navmenu.show');
      await v.pg.waitForTimeout(500);
      await v.pg.evaluate(() => { const a = document.createElement('a'); a.href = '#contact'; a.id = 'fn1bLink'; a.textContent = 'Contact'; document.getElementById('navmenu').appendChild(a); });
      await v.pg.click('#fn1bLink');
      await v.pg.waitForTimeout(800);
      const open = await v.pg.evaluate(() => document.getElementById('navmenu').classList.contains('show'));
      check(!open && !v.errs.length, `H1 an in-page link inside the open phone menu must close it: still open ${open} ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }

  // D1-D4: the designer on a blank card (Sales, Target, Sales LY, Achievement, Growth vs LY)
  {
    const v = await visitor(browser, { viewport: [1440, 900] });
    try {
      await v.ctx.addInitScript(EVENTS);
      await v.pg.goto(`${url}/tools/svg-kpi-designer.html?lang=en`, { waitUntil: 'networkidle' });
      await v.pg.evaluate(() => localStorage.removeItem('dataarcus-svg-kpi-v2'));
      await v.pg.reload({ waitUntil: 'networkidle' });
      await v.pg.waitForFunction(() => document.querySelector('#stage svg.kd-svg') && document.getElementById('dax').textContent.length > 0, null, { timeout: 30000 });
      await h.starter(v.pg, '__blank'); await frame(v.pg);
      // D1: a formula (index 5), its kind A - B (Sales 1,240,000 - Target 1,500,000)
      await v.pg.click('#addFormula'); await frame(v.pg);
      await v.pg.selectOption('#values select[data-v="5"][data-vk="kind"]', 'diff'); await frame(v.pg);
      const hint = await v.pg.evaluate(() => document.querySelectorAll('#values .kd-val')[5].querySelector('.kd-hint').textContent);
      check(hint === '= -260,000', `D1 Sales - Target must show "= -260,000": got "${hint}"`);
      // D3: Sales labelled Revenue; the formula compares Sales with itself
      await v.pg.fill('#values .kd-vlabel[data-v="0"]', 'Revenue');
      await v.pg.selectOption('#values select[data-v="5"][data-vk="b"]', 'sales'); await frame(v.pg);
      const warn = await v.pg.evaluate(() => document.getElementById('valWarn').textContent);
      check(/compares Revenue with itself\./.test(warn), `D3 the warning must name Sales by its label (Revenue): got "${warn}"`);
      // D2: a new measure (index 6), "Show nothing when this is blank" on it, then remove it
      await v.pg.click('#addMeasure'); await frame(v.pg);
      await h.key(v.pg, 'Escape');
      await v.pg.selectOption('#props [data-p="card.hideIfBlank"]', 'm1'); await frame(v.pg);
      await v.pg.click('#values [data-vdel="6"]'); await frame(v.pg);
      const d2 = await v.pg.evaluate(() => ({ n: document.querySelectorAll('#values .kd-val').length, toast: document.getElementById('toast').textContent }));
      check(d2.n === 7 && d2.toast === 'Still used by: Hide when blank', `D2 a value "Hide when blank" uses must stay, said in the toast: got ${d2.n} values, toast "${d2.toast}"`);
      // D4: the add bar
      await h.add(v.pg, 'rect'); await frame(v.pg);
      const ev = await v.pg.evaluate(() => window.__ev.filter((e) => e[0] === 'svgkpi_add_layer').map((e) => JSON.stringify(e[1])));
      check(ev.length === 1 && ev[0] === '{"layer_type":"rect"}' && !v.errs.length, `D4 the add bar must send svgkpi_add_layer {"layer_type":"rect"} once: got ${JSON.stringify(ev)} ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return { checks, problems };
}
