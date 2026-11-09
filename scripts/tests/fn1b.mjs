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
//      by its label; D4 the add bar sends svgkpi_add_layer with the layer's type; D5 a card typed 1500 wide is kept at
//      1200 (the design saved, the DAX's SVG)
//      D6 with one value left, "Add formula" says "Add two values first" and adds nothing
//   R1 an Arabic download on a model already named in Arabic (namesPart): no names step, and the project keeps the
//      design's name (Shop.pbip)
//   R2 the names step asked again (a new field picked after an approval) shows the names the person approved, not the
//      drafts (namesPart)
//   B1 the project button is disabled while the project is built, then enabled again (pbipDownloadPart)
//   C1 the home page's counters (countersPart): each counter is watched until it is 90% in view
//   L1 the check before download (checkPart) lists 12 problems at most, each "Page n: visual: what. fix" (a made-up
//      check engine served for this check only, with 15 made-up problems)
//   S1 the blog's search (blogPart) waits 300 ms after typing: read by page timers at 150 ms (before it) and 450 ms
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { visitor, ready } from './lib.mjs';
import { model, unzip } from './arabic-names.mjs';
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
      // D5: the card's width, typed past its limit
      await h.key(v.pg, 'Escape');
      await v.pg.fill('#props [data-p="card.w"]', '1500'); await frame(v.pg);
      const d5 = await v.pg.evaluate(() => ({ w: JSON.parse(localStorage.getItem('dataarcus-svg-kpi-v2') || '{}').w, dax: /width='1200' height='80'/.test(document.getElementById('dax').textContent) }));
      check(d5.w === 1200 && d5.dax && !v.errs.length, `D5 a card typed 1500 wide must be kept at 1200: saved ${d5.w}, the DAX's SVG at 1200 ${d5.dax} ${v.errs.join(' | ')}`.trim());
      // D6: a fresh blank card, every value removed but Sales (the last first: each is still used by a later one)
      await h.starter(v.pg, '__blank'); await frame(v.pg);
      for (const i of [4, 3, 2, 1]) { await v.pg.click(`#values [data-vdel="${i}"]`); await frame(v.pg); }
      await v.pg.click('#addFormula'); await frame(v.pg);
      const d6 = await v.pg.evaluate(() => ({ n: document.querySelectorAll('#values .kd-val').length, toast: document.getElementById('toast').textContent }));
      check(d6.n === 1 && d6.toast === 'Add two values first' && !v.errs.length, `D6 one value: "Add formula" must say "Add two values first" and add nothing: got ${d6.n} values, toast "${d6.toast}" ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }
  // R1: the lab page in Arabic, a model named in Arabic, the download at once
  {
    const cols = (xs) => xs.map(([name, dataType]) => ({ name, dataType }));
    const arm = model(tmp, 'Arm', [
      { name: 'المبيعات', columns: cols([['المبلغ', 'double'], ['العميل', 'string'], ['تاريخ الطلب', 'dateTime']]),
        measures: [['إجمالي المبيعات', 'SUM ( \'المبيعات\'[المبلغ] )'], ['الطلبات', 'COUNTROWS ( \'المبيعات\' )']].map(([name, expression]) => ({ name, expression, formatString: '#,0' })) },
      { name: 'التقويم', dataCategory: 'Time', columns: [{ name: 'التاريخ', dataType: 'dateTime', isKey: true }, { name: 'الشهر', dataType: 'string' }] }],
    [{ name: 'r1', fromTable: 'المبيعات', fromColumn: 'تاريخ الطلب', toTable: 'التقويم', toColumn: 'التاريخ' }]);
    const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
    try {
      await v.pg.goto(`${url}/tools/power-bi-theme-generator-lab.html?lang=ar`, { waitUntil: 'networkidle' });
      await v.pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('dataarcus-theme-generator') || '{}'); s.name = 'Shop';
        s.layout = { v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', headLine: 'full', samples: true, transparent: true, preset: 'exec', kpis: 2, filters: true, fpos: 'top', page: '1920x1080' };
        localStorage.setItem('dataarcus-theme-generator', JSON.stringify(s)); });
      await v.pg.reload({ waitUntil: 'networkidle' });
      await v.pg.selectOption('#pbipData', 'local'); await v.pg.setInputFiles('#pbipFolder', arm);
      await v.pg.waitForFunction(() => document.querySelectorAll('#pbipMap select').length > 0 && !/جارٍ قراءة النموذج/.test(document.getElementById('pbipOwnMsg').textContent), null, { timeout: 15000 });
      const d = await Promise.all([v.pg.waitForEvent('download', { timeout: 30000 }), v.pg.click('#pbipBtn')]).then(([x]) => x, () => null);
      const files = d ? unzip(fs.readFileSync(await d.path())) : {};
      const step = await v.pg.$eval('#pbipNames', (e) => !e.hidden).catch(() => false);
      check(d && !step && Object.keys(files).includes('Shop.pbip') && !v.errs.length, `R1 a model named in Arabic: no names step, the project named Shop.pbip: ${d ? Object.keys(files).filter((n) => !n.includes('/')).join(', ') : 'no download'}${step ? ', the names step shown' : ''} ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }
  // R2, B1: the lab page in Arabic, a model on English names, 2 KPIs and no second page
  {
    const cols = (xs) => xs.map(([name, dataType]) => ({ name, dataType }));
    const own = model(tmp, 'Eng', [
      { name: 'Sales', columns: cols([['Amount', 'double'], ['Cost', 'double'], ['Customer', 'string'], ['Territory', 'string'], ['Order Date', 'dateTime']]),
        measures: [['Total Sales', 'SUM ( Sales[Amount] )'], ['Orders', 'COUNTROWS ( Sales )'], ['Total Cost', 'SUM ( Sales[Cost] )']].map(([name, expression]) => ({ name, expression, formatString: '#,0' })) },
      { name: 'Calendar', dataCategory: 'Time', columns: [{ name: 'Date', dataType: 'dateTime', isKey: true }, { name: 'Month', dataType: 'string' }] }],
    [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }]);
    const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
    try {
      await v.pg.goto(`${url}/tools/power-bi-theme-generator-lab.html?lang=ar`, { waitUntil: 'networkidle' });
      await v.pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('dataarcus-theme-generator') || '{}'); s.name = 'Shop';
        s.layout = { v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', headLine: 'full', samples: true, transparent: true, preset: 'exec', kpis: 2, filters: true, fpos: 'top', page: '1920x1080' };
        localStorage.setItem('dataarcus-theme-generator', JSON.stringify(s)); });
      await v.pg.reload({ waitUntil: 'networkidle' });
      await v.pg.selectOption('#pbipData', 'local'); await v.pg.setInputFiles('#pbipFolder', own);
      await v.pg.waitForFunction(() => document.querySelectorAll('#pbipMap select').length > 0 && !/جارٍ قراءة النموذج/.test(document.getElementById('pbipOwnMsg').textContent), null, { timeout: 15000 });
      await v.pg.click('#pbipPages'); await v.pg.waitForTimeout(300);
      const row = (key) => `#pbipNames [data-name-key="${key}"] input[type=text]`;
      await v.pg.click('#pbipBtn');
      await v.pg.waitForSelector(row('Sales[Customer]'), { timeout: 15000 });
      await v.pg.fill(row('Sales[Customer]'), 'الزبون'); await v.pg.fill(row('Sales[Territory]'), 'الإقليم');
      // B1: the approval builds the project: the button is disabled at once, enabled again after the download
      const [d] = await Promise.all([v.pg.waitForEvent('download', { timeout: 30000 }), v.pg.click('#pbipNamesOk')]);
      const busy = await v.pg.evaluate(() => document.getElementById('pbipBtn').disabled);
      await d.path(); await v.pg.waitForFunction(() => !document.getElementById('pbipBtn').disabled, null, { timeout: 15000 }).catch(() => {});
      const done = await v.pg.evaluate(() => document.getElementById('pbipBtn').disabled);
      const second = await v.pg.evaluate(() => { const b = document.getElementById('pbipBtn'); b.click(); return b.disabled; });
      await v.pg.waitForFunction(() => !document.getElementById('pbipBtn').disabled, null, { timeout: 15000 }).catch(() => {});
      check(second && !done && !v.errs.length, `B1 the project button must be disabled while the project is built, then enabled: disabled at the click ${second} (after the approval ${busy}), after ${done} ${v.errs.join(' | ')}`.trim());
      // R2: a KPI the approval did not cover (Orders): the step comes back with the approved names
      await v.pg.selectOption('#pbipMap select[data-path="kpis.1"]', JSON.stringify(['Sales', 'm', 'Orders'])); await v.pg.waitForTimeout(200);
      await v.pg.click('#pbipBtn');
      await v.pg.waitForSelector(row('Sales[Orders]'), { timeout: 15000 }).catch(() => {});
      const back = await v.pg.evaluate((r) => { const x = document.querySelector(r); return x ? x.value : null; }, row('Sales[Customer]'));
      check(back === 'الزبون' && !v.errs.length, `R2 the names step asked again must show the approved name الزبون for Customer: got "${back}" ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }

  // C1: the counters' observer (wrapped as the page makes it): its threshold, and the elements it watches
  {
    const v = await visitor(browser, { viewport: [1440, 900] });
    try {
      await v.ctx.addInitScript(() => {
        const IO = window.IntersectionObserver; window.__io = [];
        window.IntersectionObserver = function (cb, opt) { const o = new IO(cb, opt), rec = { opt: JSON.stringify(opt || {}), counts: 0 }; window.__io.push(rec);
          const observe = o.observe.bind(o); o.observe = (el) => { if (el && el.hasAttribute && el.hasAttribute('data-count')) rec.counts++; return observe(el); }; return o; };
      });
      await v.pg.goto(`${url}/index.html?lang=en`, { waitUntil: 'networkidle' });
      const io = await v.pg.evaluate(() => window.__io.filter((r) => r.counts > 0));
      check(io.length === 1 && io[0].opt === '{"threshold":0.9}' && io[0].counts > 0 && !v.errs.length, `C1 the counters must be watched by one observer at threshold 0.9: got ${JSON.stringify(io)} ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }
  // S1: a term no card has; the cards read from timers the page orders by their time (so a busy machine cannot reorder them)
  {
    const v = await visitor(browser, { viewport: [1440, 900] });
    try {
      await v.pg.goto(`${url}/blog.html?lang=en`, { waitUntil: 'networkidle' });
      const seen = await v.pg.evaluate(() => new Promise((done) => {
        const shown = () => [...document.querySelectorAll('[data-category]')].filter((c) => c.style.display !== 'none').length;
        const box = document.getElementById('blogSearch'), out = [shown()];
        box.value = 'zzqx-no-card'; box.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => out.push(shown()), 150);
        setTimeout(() => { out.push(shown()); done(out); }, 450);
      }));
      check(seen[0] > 0 && seen[1] === seen[0] && seen[2] === 0 && !v.errs.length, `S1 the blog's search must wait 300 ms: cards shown before, at 150 ms, at 450 ms: ${seen.join(', ')} ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }
  // L1: the lab page, the sample data, the made-up check engine
  {
    const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
    try {
      await v.ctx.route(/\/assets\/js\/layout-check\.min\.js/, (rt) => rt.fulfill({ status: 200, contentType: 'text/javascript',
        body: 'window.DALayoutCheck = { checkProject: function () { return { desktop: true, summary: "Made-up: 15 problems", problems: Array.from({ length: 15 }, function (_, i) { return { page: { n: 1 }, visual: "V" + (i + 1), what: "made-up problem " + (i + 1), fix: "Fix it" }; }) }; } };' }));
      await v.pg.goto(`${url}/tools/power-bi-theme-generator-lab.html?lang=en`, { waitUntil: 'networkidle' });
      const [d] = await Promise.all([v.pg.waitForEvent('download', { timeout: 30000 }), v.pg.click('#pbipBtn')]);
      await d.path();
      const ck = await v.pg.evaluate(() => { const b = document.getElementById('pbipCheck'); return { hidden: b.hidden, sum: (b.querySelector('.tg-ck-sum') || {}).textContent, li: [...b.querySelectorAll('li')].map((l) => l.textContent) }; });
      check(!ck.hidden && ck.sum === 'Made-up: 15 problems' && ck.li.length === 12 && ck.li[0] === 'Page 1: V1: made-up problem 1. Fix it' && ck.li[11] === 'Page 1: V12: made-up problem 12. Fix it' && !v.errs.length,
        `L1 the check must list the first 12 of 15 problems: got ${ck.li.length} (${JSON.stringify(ck.li.slice(0, 2))}), summary "${ck.sum}", hidden ${ck.hidden} ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return { checks, problems };
}
