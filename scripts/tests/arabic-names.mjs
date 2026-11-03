// 0.3.1 TT2 (the owner, 27 Oct, D-1027-19 "Both A"; D-1027-04: no English titles in an Arabic report; D-1027-03: a title
// all Arabic or all English; mcp/work/TT2.md; written red first): the Theme Generator's Arabic project download on the
// person's own model with English names lists those names, each with an Arabic draft in an editable box, before it
// builds. Drafts only from DataArcus's fixed words (assets/data/arabic-report-words.json); anything else starts empty.
// Made-up models only (written here as model.bim files in a temp folder), no employer data.
//   W1 refused without approval: no download, the list (English name beside its draft; "Territory" empty)
//   W2 the drafts are suggestions to check, said in Arabic and in English; no request but the fixed words file
//   W3 an empty box: still no download, the name said, its box focused
//   W4 approved Arabic names: every title wholly Arabic; the README beside the report says the names
//   W5 "keep English" (ticked by the person) for one name: its titles wholly English, the others Arabic, none mixed;
//      the README says it was kept English by choice
//   W6 the drafts come from the words file: the same page with a copy of the file without "customer" drafts nothing
//      for Customer
//   W7 the English download: no step, its files (the pictures aside, the random names numbered) byte for byte the base's (13afb3a)
//   W8 a model already named in Arabic: no step, the download at once
//   W9 right to left at phone width (390): the list inside the screen, each English name isolated left to right
//   W10 the keyboard: every box, choice and the approve button reached by Tab; Enter approves
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { visitor, ROOT } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = '/tools/power-bi-theme-generator-lab.html';
const PIN = path.join(HERE, 'fixtures', 'tt2-english-download.json');
const AR = /[؀-ۿ]/, bare = (s) => String(s == null ? '' : s).replace(/[‎‏⁦-⁩]/g, '');
const mixed = (s) => AR.test(bare(s)) && /[A-Za-z]/.test(bare(s));

function unzip(buf) {
  const out = {}; let p = 0;
  while (buf.readUInt32LE(p) === 0x04034b50) {
    const size = buf.readUInt32LE(p + 18), nlen = buf.readUInt16LE(p + 26), xlen = buf.readUInt16LE(p + 28);
    const name = buf.toString('utf8', p + 30, p + 30 + nlen), start = p + 30 + nlen + xlen;
    out[name] = buf.subarray(start, start + size); p = start + size;
  }
  return out;
}
// every title a viewer reads: a visual's title text, or the plain text of its "Title:" report measure
function titlesOf(files) {
  const ext = JSON.parse((Object.entries(files).find(([n]) => /reportExtensions\.json$/.test(n)) || [0, '{}'])[1].toString('utf8'));
  const ms = (ext.entities || []).flatMap((x) => x.measures || []);
  return Object.entries(files).filter(([n]) => /\/visual\.json$/.test(n)).map(([, b]) => JSON.parse(b.toString('utf8'))).filter((j) => j.visual).map((j) => {
    const t = ((((j.visual.visualContainerObjects || {}).title || [])[0] || {}).properties || {}).text, e = t && t.expr;
    if (e && e.Literal) return String(e.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'");
    const m = e && e.Measure && ms.find((x) => x.name === e.Measure.Property), x = m && /_s = _n, "((?:[^"]|"")*)"/.exec(m.expression);
    return x ? x[1].replace(/""/g, '"') : null;
  }).filter(Boolean);
}
// the download's files, the pictures aside (drawn by the browser's canvas: its pixels are not this job's), as one digest;
// the writer's random names (a visual's or a filter's 20 to 32 hex name, a .platform GUID) numbered in order of appearance, so two builds of
// the same input compare byte for byte
const RANDOM = /\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b|(?<![0-9a-f])[0-9a-f]{20,32}(?![0-9a-f])/g;
const flatOf = (files) => { const ids = new Map(), at = (x) => { if (!ids.has(x)) ids.set(x, '#' + ids.size); return ids.get(x); };
  return Object.keys(files).filter((n) => !/\.png$/i.test(n)).map((n) => (n + '\n' + files[n].toString('utf8')).replace(RANDOM, at)).join('\n'); };
const digest = (files) => crypto.createHash('sha256').update(flatOf(files)).digest('hex');

function model(dir, name, tables, relationships) {
  fs.mkdirSync(path.join(dir, name, name + '.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(dir, name, name + '.SemanticModel', 'definition.pbism'), '{ "version": "4.0", "settings": {} }');
  fs.writeFileSync(path.join(dir, name, name + '.SemanticModel', 'model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships } }));
  return path.join(dir, name);
}

export default async function ({ browser, url }) {
  let checks = 0; const problems = [];
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tt2-'));
  const cols = (xs) => xs.map(([name, dataType]) => ({ name, dataType }));
  const OWN = model(tmp, 'Own', [
    { name: 'Sales', columns: cols([['Amount', 'double'], ['Cost', 'double'], ['Qty', 'double'], ['Customer', 'string'], ['Territory', 'string'], ['Order Date', 'dateTime']]),
      measures: [['Total Sales', 'SUM ( Sales[Amount] )'], ['Orders', 'COUNTROWS ( Sales )'], ['Total Cost', 'SUM ( Sales[Cost] )'], ['Units', 'SUM ( Sales[Qty] )']].map(([name, expression]) => ({ name, expression, formatString: '#,0' })) },
    { name: 'Calendar', dataCategory: 'Time', columns: [{ name: 'Date', dataType: 'dateTime', isKey: true }, { name: 'Month', dataType: 'string', sortByColumn: 'Month Number' }, { name: 'Month Number', dataType: 'int64' }] }],
  [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }]);
  const ARM = model(tmp, 'Arm', [
    { name: 'المبيعات', columns: cols([['المبلغ', 'double'], ['العميل', 'string'], ['المنطقة', 'string'], ['تاريخ الطلب', 'dateTime']]),
      measures: [['إجمالي المبيعات', 'SUM ( \'المبيعات\'[المبلغ] )'], ['الطلبات', 'COUNTROWS ( \'المبيعات\' )']].map(([name, expression]) => ({ name, expression, formatString: '#,0' })) },
    { name: 'التقويم', dataCategory: 'Time', columns: [{ name: 'التاريخ', dataType: 'dateTime', isKey: true }, { name: 'الشهر', dataType: 'string', sortByColumn: 'رقم الشهر' }, { name: 'رقم الشهر', dataType: 'int64' }] }],
  [{ name: 'r1', fromTable: 'المبيعات', fromColumn: 'تاريخ الطلب', toTable: 'التقويم', toColumn: 'التاريخ' }]);

  // the page with a model picked; wordsWithout: the fixed words file served without that word (W6)
  const open = async (lang, folder, o) => {
    const v = await visitor(browser, { viewport: (o && o.viewport) || [1440, 900], downloads: true });
    const asked = []; v.pg.on('request', (r) => { if (!r.url().startsWith(url) || /\/assets\/data\//.test(r.url())) asked.push(r.url()); });
    if (o && o.wordsWithout) await v.pg.route('**/assets/data/arabic-report-words.json', (r) => { const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/arabic-report-words.json'), 'utf8')); delete j.words[o.wordsWithout]; r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) }); });
    await v.pg.goto(`${url}${PAGE}?lang=${lang}`, { waitUntil: 'networkidle' });
    await v.pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('dataarcus-theme-generator') || '{}'); s.name = 'Shop';
      s.layout = { v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', headLine: 'full', samples: true, transparent: true, preset: 'exec', kpis: 4, filters: true, fpos: 'top', page: '1920x1080' };
      localStorage.setItem('dataarcus-theme-generator', JSON.stringify(s)); });
    await v.pg.reload({ waitUntil: 'networkidle' });
    await v.pg.selectOption('#pbipData', 'local'); await v.pg.setInputFiles('#pbipFolder', folder);
    await v.pg.waitForFunction(() => document.querySelectorAll('#pbipMap select').length > 0 && !/Reading the model|جارٍ قراءة النموذج/.test((document.getElementById('pbipOwnMsg') || {}).textContent || ''), null, { timeout: 15000 });
    return Object.assign(v, { asked });
  };
  const tap = (pg, sel) => pg.click(sel, { timeout: 3000 }).catch(() => {});
  // a click that downloads, or not within ms (then null)
  const download = async (pg, click, ms) => {
    const dl = pg.waitForEvent('download', { timeout: ms || 30000 }).catch(() => null);
    await click(); const d = await dl;
    return d ? unzip(fs.readFileSync(await d.path())) : null;
  };
  const rows = (pg) => pg.$$eval('#pbipNames [data-name-key]', (rs) => rs.map((r) => ({ key: r.getAttribute('data-name-key'), en: (r.querySelector('[data-name-en]') || {}).textContent, draft: (r.querySelector('input[type=text]') || {}).value, keep: !!(r.querySelector('input[type=checkbox]') || {}).checked })));
  const shown = (pg) => pg.$eval('#pbipNames', (e) => !e.hidden && e.getBoundingClientRect().height > 0).catch(() => false);
  const DRAFTS = { 'Total Sales': 'إجمالي المبيعات', Orders: 'الطلبات', 'Total Cost': 'إجمالي التكلفة', Units: 'الوحدات', Customer: 'العميل', Month: 'الشهر', Territory: '' };

  // W1, W2, W3, W4: one visitor, step by step
  {
    const v = await open('ar', OWN), pg = v.pg;
    v.asked.length = 0;
    const none = await download(pg, () => pg.click('#pbipBtn'), 4000);
    const rs = await rows(pg).catch(() => []);
    check(!none && await shown(pg) && rs.length >= 5 && rs.every((r) => r.en in DRAFTS && DRAFTS[r.en] === r.draft && !r.keep) && rs.some((r) => r.en === 'Territory'),
      `W1: an Arabic download on English names is not built before the names are approved; the list (English name, its draft, "keep English" not ticked): ${none ? 'downloaded at once' : JSON.stringify(rs)}`);
    const hint = await pg.$eval('#pbipNames', (e) => e.textContent).catch(() => '');
    check(/اقتراحات/.test(hint) && /suggestions/i.test(hint) && /راجع/.test(hint) && /check/i.test(hint), `W2: the drafts are suggestions to check, said in Arabic and English: "${hint.slice(0, 300)}"`);
    check(v.asked.every((u) => /\/assets\/data\/arabic-report-words\.json$/.test(u)) && v.asked.length <= 1, `W2b: no request outside the site, and none but the fixed words file: ${v.asked.join(' | ')}`);
    const stillNone = await download(pg, () => tap(pg, '#pbipNamesOk'), 3000);
    const err = await pg.$eval('#pbipNamesMsg', (e) => e.textContent).catch(() => ''), focus = await pg.evaluate(() => (document.activeElement.closest('[data-name-key]') || {}).getAttribute ? document.activeElement.closest('[data-name-key]').getAttribute('data-name-key') : null);
    check(!stillNone && /Territory/.test(err) && focus === 'Sales[Territory]', `W3: an empty box: no download, the name said ("${err}"), its box focused (${focus})`);
    await pg.fill('#pbipNames [data-name-key="Sales[Territory]"] input[type=text]', 'الإقليم', { timeout: 3000 }).catch(() => {});
    const files = await download(pg, () => tap(pg, '#pbipNamesOk'));
    const ts = files ? titlesOf(files) : [];
    check(files && ts.length > 5 && ts.every((t) => AR.test(t) && !/[A-Za-z]/.test(bare(t))) && ts.includes('إجمالي المبيعات حسب الإقليم'), `W4: approved Arabic names: every title wholly Arabic: ${ts.map(bare).join(' | ')}`);
    const rd = files ? Object.entries(files).find(([n]) => /^Shop[^/]*\.README\.md$/.test(n)) : null;
    check(rd && /الإقليم/.test(rd[1].toString('utf8')) && /Territory/.test(rd[1].toString('utf8')) && !files['README.md'], `W4b: the names in the report's own README beside it (never the project's README.md): ${files ? Object.keys(files).filter((n) => !n.includes('/')).join(', ') : 'no download'}`);
    if (v.errs.length) problems.push('W1-W4: ' + v.errs.join(' | '));
    await v.ctx.close();
  }
  // W5: keep English for Territory, chosen by the person
  {
    const v = await open('ar', OWN), pg = v.pg;
    await download(pg, () => pg.click('#pbipBtn'), 4000);
    await pg.check('#pbipNames [data-name-key="Sales[Territory]"] input[type=checkbox]', { timeout: 3000 }).catch(() => {});
    const files = await download(pg, () => tap(pg, '#pbipNamesOk'));
    const ts = files ? titlesOf(files) : [], terr = ts.filter((t) => /Territory/.test(t));
    check(files && ts.length > 5 && ts.every((t) => !mixed(t)) && terr.length >= 2 && terr.every((t) => !AR.test(bare(t))) && ts.some((t) => AR.test(t)), `W5: "keep English" for Territory: its titles wholly English, the others wholly Arabic, none mixed: ${ts.map(bare).join(' | ')}`);
    const rd = files ? Object.entries(files).find(([n]) => /\.README\.md$/.test(n)) : null, txt = rd ? rd[1].toString('utf8') : '';
    check(/Territory/.test(txt) && /الإنجليزية/.test(txt) && /keep English|kept in English/i.test(txt), `W5b: the README says Territory was kept English by the person's choice: ${txt.slice(0, 400)}`);
    if (v.errs.length) problems.push('W5: ' + v.errs.join(' | '));
    await v.ctx.close();
  }
  // W6: the drafts come from the file the page reads
  {
    const v = await open('ar', OWN, { wordsWithout: 'customer' }), pg = v.pg;
    await download(pg, () => pg.click('#pbipBtn'), 4000);
    const rs = await rows(pg).catch(() => []), cu = rs.find((r) => r.en === 'Customer'), ts = rs.find((r) => r.en === 'Total Sales');
    check(cu && cu.draft === '' && ts && ts.draft === 'إجمالي المبيعات', `W6: the words file without "customer": no draft for Customer, the others as the file says: ${JSON.stringify(rs)}`);
    await v.ctx.close();
  }
  // W7: the English download, unchanged
  {
    const v = await open('en', OWN), pg = v.pg;
    const files = await download(pg, () => pg.click('#pbipBtn'));
    const pin = fs.existsSync(PIN) ? JSON.parse(fs.readFileSync(PIN, 'utf8')) : {};
    if (process.env.TT2_PIN && files) fs.writeFileSync(PIN, JSON.stringify({ _note: 'TT2 W7: the English download of the made-up "Own" model, its files the pictures aside, the random names of the writer numbered in order, as one SHA-256 (scripts/tests/arabic-names.mjs digest); written on 13afb3a, before TT2', base: '13afb3a', sha256: digest(files) }, null, 2) + '\n');
    check(files && !(await shown(pg)) && digest(files) === pin.sha256, `W7: the English download: no step, its files byte for byte the base's: ${files ? digest(files) : 'no download'} (want ${pin.sha256})`);
    await v.ctx.close();
  }
  // W8: a model already named in Arabic
  {
    const v = await open('ar', ARM), pg = v.pg;
    const files = await download(pg, () => pg.click('#pbipBtn'), 15000);
    check(files && !(await shown(pg)), `W8: a model named in Arabic: no step, the download at once (${files ? Object.keys(files).length + ' files' : 'none'})`);
    await v.ctx.close();
  }
  // W9, W10: phone width, right to left, the keyboard
  {
    const v = await open('ar', OWN, { viewport: [390, 844] }), pg = v.pg;
    await download(pg, () => pg.click('#pbipBtn'), 4000);
    await pg.$eval('#pbipNames', (e) => e.scrollIntoView({ block: 'start' })).catch(() => {});
    const lay = await pg.evaluate(() => { const b = document.getElementById('pbipNames'); if (!b || b.hidden) return null; const r = b.getBoundingClientRect(), en = [...b.querySelectorAll('[data-name-en]')];
      return { dir: getComputedStyle(b).direction, left: r.left, right: r.right, vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth,
        inside: [...b.querySelectorAll('input, button, [data-name-en]')].every((x) => { const q = x.getBoundingClientRect(); return q.left >= -0.5 && q.right <= document.documentElement.clientWidth + 0.5; }),
        en: en.every((x) => getComputedStyle(x).direction === 'ltr' && /isolate/.test(getComputedStyle(x).unicodeBidi)) && en.length > 0 }; });
    // the rendered list (in the temp folder: the run leaves the repo as it was; the copy for the review is
    // scripts/tests/shots/tt2-names-ar-390.png, taken by this check)
    if (lay) await pg.locator('#pbipNames').screenshot({ path: path.join(tmp, 'tt2-names-ar-390.png') }).catch(() => {});
    check(lay && lay.dir === 'rtl' && lay.inside && lay.sw <= lay.vw + 1 && lay.en, `W9: right to left at 390 wide: the list inside the screen, each English name isolated left to right: ${JSON.stringify(lay)}`);
    // W10: Tab from the first box reaches every box, every "keep English" and the approve button, in that order; Enter approves
    const order = [];
    await pg.focus('#pbipNames input[type=text]', { timeout: 3000 }).catch(() => {});
    for (let i = 0; i < 30; i++) { const id = await pg.evaluate(() => { const a = document.activeElement, r = a && a.closest('[data-name-key]'); return a.id === 'pbipNamesOk' ? 'ok' : r ? r.getAttribute('data-name-key') + ':' + a.type : a.tagName; }); order.push(id); if (id === 'ok') break; await pg.keyboard.press('Tab'); }
    const rs = await rows(pg).catch(() => []);
    const want = rs.flatMap((r) => [r.key + ':text', r.key + ':checkbox']).concat('ok');
    check(rs.length && order.join() === want.join(), `W10: the keyboard reaches every box, choice and the button in order: ${order.join(' > ')}`);
    await pg.fill('#pbipNames [data-name-key="Sales[Territory]"] input[type=text]', 'الإقليم', { timeout: 3000 }).catch(() => {});
    await pg.focus('#pbipNamesOk', { timeout: 3000 }).catch(() => {});
    const files = await download(pg, () => pg.keyboard.press('Enter'));
    check(!!files, 'W10b: Enter on the approve button builds the download');
    await v.ctx.close();
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return { checks, problems };
}
