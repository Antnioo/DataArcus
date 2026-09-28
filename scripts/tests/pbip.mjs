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
