// Power BI project download with the user's own model (theme generator lab page):
//  - a local project: the fixture's Sales.SemanticModel folder is picked, the download is a report that points at it
//    and would not replace anything in their folder (own report name, no .gitignore or README)
//  - a published model: a live connection in the form Microsoft documents, fields loaded from a .pbit
//  - every field a visual uses exists in the model, as the right kind (measure or column)
//  - the sample-data download still has its own model
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { visitor } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.join(HERE, 'fixtures', 'bridge-project');
const PBIT = path.join(HERE, '..', '..', 'assets', 'data', 'model-health-sample.pbit');
const PAGE = '/tools/power-bi-theme-generator-lab.html';

// the exporter writes stored (uncompressed) zips, so reading one is only walking its headers
function unzip(buf) {
  const out = {}; let p = 0;
  while (buf.readUInt32LE(p) === 0x04034b50) {
    const size = buf.readUInt32LE(p + 18), nlen = buf.readUInt16LE(p + 26), xlen = buf.readUInt16LE(p + 28);
    const name = buf.toString('utf8', p + 30, p + 30 + nlen), start = p + 30 + nlen + xlen;
    out[name] = buf.subarray(start, start + size); p = start + size;
  }
  return out;
}
// the fields each visual uses, as "Measure Table[Name]" / "Column Table[Name]"
const refs = (files) => Object.entries(files).filter(([n]) => n.endsWith('/visual.json')).flatMap(([, b]) => {
  const out = [];
  JSON.stringify(JSON.parse(b.toString('utf8')), (k, v) => {
    if (v && (v.Column || v.Measure) && (v.Column || v.Measure).Expression) { const x = v.Column || v.Measure; out.push({ kind: v.Column ? 'c' : 'm', t: x.Expression.SourceRef.Entity, n: x.Property }); }
    return v;
  });
  return out;
});

// the fields of the fixture's model
const LOCAL = { m: { Sales: ['Total Sales', 'Orders', 'Sales YoY %'] }, c: { Sales: ['CustomerKey', 'Sales Channel'], Customer: ["Customer's City", 'المنطقة'], Calendar: ['Date', 'Year', 'Month Name'] } };
// a copy of the fixture project in a temporary folder named proj, changed by edit(dir)
const project = (edit) => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pbip-')), 'proj');
  fs.cpSync(PROJECT, dir, { recursive: true }); edit(dir);
  return dir;
};

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

  // 0. A .pbit is read by the Model Health Check's engine: it keeps hidden tables and the date-table mark, so the
  //    picker sees the same model as from the model.bim
  {
    const require = createRequire(import.meta.url);
    const E = require('../../assets/js/model-health-engine.js'), DB = require('../../assets/js/pbip-bind.js');
    const bim = { model: { tables: [
      { name: 'Sales', columns: [{ name: 'Amount', dataType: 'double' }, { name: 'Region', dataType: 'string' }], measures: [{ name: 'Total', expression: 'SUM(Sales[Amount])' }] },
      { name: 'Helpers', isHidden: true, columns: [{ name: 'X', dataType: 'string' }], measures: [{ name: 'Hidden One', expression: '1' }] },
      { name: 'Dim', dataCategory: 'Time', columns: [{ name: 'Day', dataType: 'dateTime' }, { name: 'Mon', dataType: 'string' }] }] } };
    const viaPbit = DB.fromTmsl({ tables: E.analyze(bim).rawTables }), direct = DB.fromTmsl(bim);
    check(JSON.stringify(viaPbit) === JSON.stringify(direct), `pbit: the model differs from the model.bim: ${JSON.stringify(viaPbit.map((t) => [t.name, t.hidden, t.date]))}`);
  }

  // 9. File and folder names from any design name: whole characters only (an emoji is never cut in half)
  {
    const require = createRequire(import.meta.url), P = require('../../assets/js/pbip-export.js');
    const names = (name) => P.build({ name, lang: 'en', font: 'Segoe UI', ui: { text: '#111111', card: '#ffffff', background: '#eeeeee', accent: '#0077ff' }, theme: {}, sample: true, texts: {},
      pages: [{ name: 'P', page: { w: 1280, h: 720 }, slots: [{ kind: 'kpi', title: 'K', x: 0, y: 0, w: 100, h: 50 }], png: new Uint8Array([1]) }] }).files.map((f) => f.path);
    const emoji = names('x'.repeat(59) + '\u{1F4CA} Sales');
    for (const n of ['..', '.', ' .. ', 'Sales.', '.hidden']) {
      const ps = names(n);
      check(ps.every((p) => !p.split('/').some((seg) => seg === '..' || seg === '.' || (seg !== '.gitignore' && /^[.\s]|[.\s]$/.test(seg.replace(/\.(pbip|Report|SemanticModel)$/, ''))))), `names: "${n}" gives ${ps.find((p) => /(^|\/)\.|\.\//.test(p)) || ps[0]}`);
    }
    // the longest path stays well under Windows' 260 characters after "Extract all" into C:\Users\<name>\Downloads\<zip name>\
    const longest = Math.max(...names('A'.repeat(60)).map((p) => p.length));
    check(longest <= 160, `names: longest path in the zip is ${longest} characters`);
    check(emoji.every((n) => !/[\uD800-\uDFFF]/.test(n.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')) && !n.includes('\uFFFD')), `names: an emoji cut in half: ${emoji[0]}`);
  }

  const run = async (lang, name, setup) => {
    const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
    await v.pg.goto(`${url}${PAGE}?lang=${lang}`, { waitUntil: 'networkidle' });
    await v.pg.evaluate((n) => { const s = JSON.parse(localStorage.getItem('dataarcus-theme-generator') || '{}'); s.name = n;
      s.layout = { v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', headLine: 'full', samples: true, transparent: true, preset: 'exec', kpis: 4, filters: true, fpos: 'top', page: '1920x1080' };
      localStorage.setItem('dataarcus-theme-generator', JSON.stringify(s)); }, name);
    await v.pg.reload({ waitUntil: 'networkidle' });
    const picked = await setup(v.pg);
    const [dl] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('#pbipBtn')]);
    const files = unzip(fs.readFileSync(await dl.path()));
    const msg = await v.pg.$eval('#pbipOwnMsg', (e) => e.textContent).catch(() => '');
    if (v.errs.length) problems.push(`${lang} ${name}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
    return { files, picked, msg };
  };
  const picker = async (pg) => {
    await pg.waitForFunction(() => document.querySelectorAll('#pbipMap select').length > 0, null, { timeout: 15000 });
    return pg.$$eval('#pbipMap select', (ss) => ss.map((s) => (s.value ? s.options[s.selectedIndex].text.replace(/[\u2068\u2069]/g, '') : '')));
  };

  // 1. Local project, named like their model: the new report gets its own name, next to their folder
  {
    const { files, picked, msg } = await run('en', 'Sales', async (pg) => {
      await pg.selectOption('#pbipData', 'local');
      check(await pg.isVisible('#pbipFolder >> xpath=..') && !(await pg.isVisible('#pbipWs')), 'local: the folder picker is not the one shown');
      await pg.setInputFiles('#pbipFolder', PROJECT);
      return picker(pg);
    });
    const names = Object.keys(files);
    check(names.includes('Sales - New design.pbip') && names.every((n) => n.startsWith('Sales - New design.')), `local: files outside the new report: ${names.filter((n) => !n.startsWith('Sales - New design.')).join(', ')}`);
    check(!names.some((n) => /^Sales\.(Report|SemanticModel)\//.test(n) || n === '.gitignore' || n === 'README.md'), 'local: the download would replace something in their project');
    const pbir = JSON.parse(files['Sales - New design.Report/definition.pbir'] || '{}');
    check(pbir.datasetReference?.byPath?.path === '../Sales.SemanticModel', `local: report points at ${JSON.stringify(pbir.datasetReference)}`);
    check(/Sales\.SemanticModel\u2069?: 3 tables, 3 measures/.test(msg) || /Unzip it into the folder that holds Sales\.SemanticModel/.test(msg), `local: message "${msg}"`);
    // suggestions: base measures before variants, the hidden helper and the automatic date table left out,
    // the month from the date table on the trend, keys never offered as categories
    check(picked[0] === 'Total Sales' && picked[1] === 'Orders' && picked[4] === 'Total Sales' && picked[5] === 'Month Name', `local: suggestions ${picked.join(' | ')}`);
    check(picked[3] === '', `local: a 4th KPI card with only 3 measures should stay empty, got "${picked[3]}"`);
    check(!picked.some((p) => /Helper|Key|LocalDate/.test(p)), `local: hidden or key fields suggested: ${picked.join(' | ')}`);
    const sl = picked.slice(-3).filter(Boolean);
    check(sl.length === 3 && new Set(sl).size === 3, `local: slicers should be three different fields: ${sl.join(' | ')}`);
    check(picked.includes("Customer's City") || picked.includes('المنطقة'), `local: no category column suggested: ${picked.join(' | ')}`);
    const rs = refs(files);
    check(rs.length > 20, `local: only ${rs.length} fields bound`);
    const bad = rs.filter((r) => !(LOCAL[r.kind][r.t] || []).includes(r.n));
    check(!bad.length, `local: fields not in the model: ${bad.map((r) => `${r.kind} ${r.t}[${r.n}]`).join(', ')}`);
  }

  // 2. Published model, Arabic page: live connection, fields read from a .pbit
  {
    const { files, picked } = await run('ar', 'Exec Board', async (pg) => {
      await pg.selectOption('#pbipData', 'service');
      await pg.fill('#pbipWs', 'Sales "EU"'); await pg.fill('#pbipModelName', 'Contoso Model');
      await pg.setInputFiles('#pbipModelFile', PBIT);
      return picker(pg);
    });
    const pbir = JSON.parse(files['Exec Board/Exec Board.Report/definition.pbir'] || '{}');
    check(pbir.datasetReference?.byConnection?.connectionString === 'Data Source="powerbi://api.powerbi.com/v1.0/myorg/Sales ""EU""";initial catalog="Contoso Model";access mode=readonly;integrated security=ClaimsToken',
      `service: connection ${JSON.stringify(pbir.datasetReference)}`);
    check(!Object.keys(files).some((n) => /\.SemanticModel\//.test(n)), 'service: a live report must not carry a model of its own');
    check(picked.filter(Boolean).length >= 10, `service: few suggestions ${picked.join(' | ')}`);
    check(refs(files).length > 20, 'service: fields not bound');
  }

  // 4. A copy of the model with the same name further down (a backup): the report and its fields come from the
  //    model at the top of the chosen folder, not a mix of the two
  {
    const dir = project((d) => {
      fs.mkdirSync(path.join(d, 'backup', 'Sales.SemanticModel'), { recursive: true });
      fs.writeFileSync(path.join(d, 'backup', 'Sales.SemanticModel', 'model.bim'), JSON.stringify({ model: { tables: [{ name: 'Old Sales', measures: [{ name: 'Legacy Revenue' }, { name: 'Legacy Orders' }], columns: [{ name: 'Old Region', dataType: 'string' }, { name: 'Old Date', dataType: 'dateTime' }] }] } }));
    });
    let note = '';
    const { files, picked, msg } = await run('en', 'Board', async (pg) => {
      await pg.selectOption('#pbipData', 'local'); await pg.setInputFiles('#pbipFolder', dir);
      const p = await picker(pg); note = await pg.$eval('#pbipOwnMsg', (e) => e.textContent); return p;
    });
    const bad = refs(files).filter((r) => !(LOCAL[r.kind][r.t] || []).includes(r.n));
    check(!bad.length && !picked.some((p) => /Legacy|Old /.test(p)), `backup copy: fields from the other model: ${bad.map((r) => `${r.kind} ${r.t}[${r.n}]`).concat(picked.filter((p) => /Legacy|Old /.test(p))).join(', ')}`);
    check(/proj\/Sales\.SemanticModel\u2069? \(2 models/.test(note), `backup copy: the message does not say which model is used: "${note}"`);
    check(JSON.parse(files['Board.Report/definition.pbir'] || '{}').datasetReference?.byPath?.path === '../Sales.SemanticModel' && /holds Sales\.SemanticModel \(proj\)/.test(msg), `backup copy: report or message "${msg}"`);
  }

  // 5. Their folder already has reports with the name of the design (Exec.Report, Exec.pbip, and even
  //    "Exec - New design.Report"): the download takes a free name, so unzipping it replaces nothing
  {
    const dir = project((d) => {
      for (const r of ['Exec', 'exec - new design']) {
        fs.mkdirSync(path.join(d, r + '.Report'), { recursive: true });
        fs.writeFileSync(path.join(d, r + '.Report', 'definition.pbir'), fs.readFileSync(path.join(d, 'Sales.Report', 'definition.pbir')));
      }
      fs.writeFileSync(path.join(d, 'Exec.pbip'), '{}');
    });
    const { files } = await run('en', 'Exec', async (pg) => { await pg.selectOption('#pbipData', 'local'); await pg.setInputFiles('#pbipFolder', dir); return picker(pg); });
    const names = Object.keys(files), clash = names.filter((n) => fs.existsSync(path.join(dir, n)) || /^(exec|exec - new design|sales)\.(pbip$|report\/)/i.test(n));
    check(!clash.length && names.includes('Exec - New design 2.pbip'), `existing reports: the download would replace ${clash.slice(0, 3).join(', ') || 'nothing, but is named ' + names.find((n) => n.endsWith('.pbip'))}`);
  }

  // 6. Local project, then a published model's .pbit, then back to local: the download uses the local model's
  //    fields again (not the .pbit's), and each choice keeps its own
  {
    let back = [];
    const { files } = await run('en', 'Switch', async (pg) => {
      await pg.selectOption('#pbipData', 'local'); await pg.setInputFiles('#pbipFolder', PROJECT); const first = await picker(pg);
      await pg.selectOption('#pbipData', 'service'); await pg.setInputFiles('#pbipModelFile', PBIT);
      await pg.waitForFunction(() => /\.pbit/.test(document.getElementById('pbipOwnMsg').textContent), null, { timeout: 15000 });
      await pg.selectOption('#pbipData', 'local'); back = await picker(pg);
      check(back.join() === first.join(), `switching: the local picker came back as ${back.join(' | ')}`);
      return back;
    });
    const bad = refs(files).filter((r) => !(LOCAL[r.kind][r.t] || []).includes(r.n));
    check(!bad.length, `switching: the local report uses fields of the other model: ${bad.slice(0, 5).map((r) => `${r.kind} ${r.t}[${r.n}]`).join(', ')}`);
  }

  // 7. More KPI cards after the model is loaded (4 -> 6): the picker gets a row per card, and no card repeats another's KPI
  {
    let rows = 0;
    const { files } = await run('en', 'Cards', async (pg) => {
      await pg.selectOption('#pbipData', 'local'); await pg.setInputFiles('#pbipFolder', PROJECT); await picker(pg);
      await pg.click('#layControls button[data-l="kpis"][data-v="6"]');
      rows = await pg.$$eval('#pbipMap select[data-path^="kpis."]', (ss) => ss.length);
      return picker(pg);
    });
    check(rows === 6, `more KPI cards: the picker has ${rows} KPI rows for 6 cards`);
    const pages = {};
    Object.entries(files).filter(([n]) => n.endsWith('/visual.json')).forEach(([n, b]) => {
      const v = JSON.parse(b.toString('utf8')), t = v.visual && v.visual.visualContainerObjects && v.visual.visualContainerObjects.title;
      if (!(t && t[0].properties.bold)) return;   // KPI cards are the visuals with a bold title
      const m = JSON.stringify(v.visual.query || null), pgName = n.split('/pages/')[1].split('/')[0];
      if (v.visual.query) (pages[pgName] = pages[pgName] || []).push(m);
    });
    const rep = Object.values(pages).filter((l) => new Set(l).size !== l.length);
    check(Object.keys(pages).length && !rep.length, `more KPI cards: a KPI repeats on a page (${Object.values(pages).map((l) => l.length).join(', ')} bound cards)`);
  }

  // 8. An older project whose model folder is Sales.Dataset: read, and the report points at it
  {
    const dir = project((d) => fs.renameSync(path.join(d, 'Sales.SemanticModel'), path.join(d, 'Sales.Dataset')));
    const { files } = await run('en', 'Sales', async (pg) => { await pg.selectOption('#pbipData', 'local'); await pg.setInputFiles('#pbipFolder', dir); return picker(pg); });
    const pbir = JSON.parse(files['Sales - New design.Report/definition.pbir'] || '{}');
    check(pbir.datasetReference?.byPath?.path === '../Sales.Dataset', `.Dataset folder: report points at ${JSON.stringify(pbir.datasetReference)}`);
  }

  // 3. Missing inputs stop the download with a message instead of a broken project
  {
    const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
    await v.pg.goto(`${url}${PAGE}?lang=en`, { waitUntil: 'networkidle' });
    let got = false; v.pg.on('download', () => { got = true; });
    for (const m of ['local', 'service']) {
      await v.pg.selectOption('#pbipData', m); await v.pg.click('#pbipBtn'); await v.pg.waitForTimeout(300);
      check(!got && /first|Type the/.test(await v.pg.$eval('#toast', (e) => e.textContent)), `${m} with nothing filled in: downloaded ${got}`);
    }
    // the sample download still carries its own model with data
    await v.pg.selectOption('#pbipData', 'sample');
    const [dl] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('#pbipBtn')]);
    const files = unzip(fs.readFileSync(await dl.path())), bim = Object.keys(files).find((n) => n.endsWith('.SemanticModel/model.bim'));
    check(!!bim && JSON.parse(files[bim]).model.tables.length === 1, 'sample: no sample model in the download');
    if (v.errs.length) problems.push(`inputs: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  return { checks, problems };
}
