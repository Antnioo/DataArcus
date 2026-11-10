// 0.3.2 SP24 (the split: model-health.js -> health-downloads.js, the Model Health Check's text downloads; mcp/work/SP24.md):
// the Model Health Check page, rendered (?lang=en and ?lang=ar), checks ten made-up models through its worker, then
// every download button is clicked (the findings CSV on the Issues tab; the HTML and Markdown documentation and the
// measures CSV on the Docs tab) and each file's name and exact text is compared with what was recorded on the base
// (integration/0.3.2 83666ef, before the move). The documentation's date is written as <DATE>; the worker's clock is
// stopped. Each model in a fresh visitor. Recorded in fixtures/sp24-downloads.json; SP24_RECORD=1 records again (only on
// the base, never to make a run pass). Made-up models only (mcp/fixtures/health-models.mjs and the site's fixtures).
//   D1-D20  each model, EN and AR: the same files with the same names and the same text as recorded
//   M1      (after the move) the four builders live in health-downloads.js, not in model-health.js
//   M2      (after the move) in Node: build() of every kind, on two models the engine analysed, gives the same file
//           twice and leaves its input unchanged; the module reads no DOM, clock, storage or worker
//   M3      (after the move) both pages ask for health-downloads.min.js before model-health.min.js
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { visitor } from './lib.mjs';
import { trickyModel, arabicModel, legacy, daxTables, mp, col } from '../../mcp/fixtures/health-models.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..');
const GOLD = path.join(HERE, 'fixtures', 'sp24-downloads.json');
const require = createRequire(import.meta.url);
const { zip } = require('../../assets/js/pbip-zip.js');
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const AFTER = fs.existsSync(path.join(ROOT, 'assets/js/health-downloads.js'));

// ---------- the ten made-up models, as the files a person drops on the page ----------
const utf16 = (s) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(s, 'utf16le')]);
const pbit = (model, layout) => Buffer.from(zip([{ path: 'DataModelSchema', data: new Uint8Array(utf16(JSON.stringify(model))) }]
  .concat(layout ? [{ path: 'Report/Layout', data: new Uint8Array(utf16(JSON.stringify(layout))) }] : [], [{ path: 'Version', data: new Uint8Array(utf16('1.28')) }])));
// a folder zipped under a prefix (text files with LF, as the repository holds them: CI's Windows checkout writes CRLF)
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const folderZip = (dir, prefix, extra) => Buffer.from(zip(walk(dir).sort().map((f) => ({ path: prefix + path.relative(dir, f).split(path.sep).join('/'),
  data: new Uint8Array(Buffer.from(fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'))) })).concat(extra || [])));
// a model with tables, columns and a relationship, and no measure at all
const noMeasures = () => ({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Orders', partitions: mp('Orders'), columns: [col('Order ID', 'int64'), col('Product Key', 'int64'), col('Quantity', 'int64'), col('Order Date', 'dateTime')] },
  { name: 'Products', partitions: mp('Products'), columns: [col('Product Key', 'int64', { isKey: true }), col('Product', 'string'), col('Colour', 'string')] }],
relationships: [{ name: 'r1', fromTable: 'Orders', fromColumn: 'Product Key', toTable: 'Products', toColumn: 'Product Key' }] } });
const FIX = path.join(ROOT, 'scripts/tests/fixtures/model-health');
const TMDL = path.join(FIX, 'tmdl-health/definition');
const MODELS = [
  ['sample', null],
  ['tricky.bim', Buffer.from(JSON.stringify(trickyModel()))],                                  // DAX with quoted strings, comments, odd names
  ['arabic.pbit', pbit(arabicModel(), legacy().files[0].json)],                               // Arabic table names, a legacy report
  ['dax-tables.bim', Buffer.from(JSON.stringify(daxTables()))],                               // DAX tables and a function
  ['no-measures.bim', Buffer.from(JSON.stringify(noMeasures()))],                             // no measure at all
  ['legacy.pbit', fs.readFileSync(path.join(FIX, 'legacy.pbit'))],
  ['Health Test.pbit', fs.readFileSync(path.join(FIX, 'tmdl-health/Health Test.pbit'))],
  ['ramadan.zip', folderZip(path.join(FIX, 'tmdl-ramadan/definition'), 'R.SemanticModel/definition/')],
  ['health-project.zip', folderZip(path.join(ROOT, 'mcp/fixtures/health-project'), 'Health/')],
  ['broken.zip', folderZip(TMDL, 'B.SemanticModel/definition/', [{ path: 'B.SemanticModel/definition/tables/Notes.tmdl', data: new Uint8Array(0) }])]   // the incomplete model
];

// the run's date, written once in the document's header ("health check · 2026-11-10" in the page, "health check, 2026-11-10" in
// the Markdown). Only that place: the models' own data may hold the same day (the Hijri month starting 2026-11-10 did, 10 Nov).
const undate = (t) => t.replace(/(health check(?: ·|,) )\d{4}-\d{2}-\d{2}/g, '$1<DATE>');

async function downloadsOf(browser, url, lang, name, buffer, asked) {
  const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
  v.ctx.on('request', (r) => { const m = /\/assets\/js\/(health-downloads|model-health)\.min\.js/.exec(r.url()); if (m && asked) asked.push(m[1]); });
  await v.ctx.route(/model-health-worker\.min\.js/, async (rt) => { const r = await rt.fetch(); await rt.fulfill({ response: r, body: 'Date.now = () => 1e12;\n' + await r.text() }); });
  await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=${lang}`, { waitUntil: 'networkidle' });
  if (buffer) await v.pg.setInputFiles('#mhFile', { name, mimeType: 'application/octet-stream', buffer });
  else await v.pg.click('#mhSample');
  await v.pg.waitForSelector('.mh-unreadable, #mhTab, .mh-error', { timeout: 30000 });
  const files = {};
  const take = async (sel) => {
    const [d] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click(sel)]);
    const text = undate(fs.readFileSync(await d.path(), 'utf8'));
    files[sel] = { name: d.suggestedFilename(), text };
  };
  if (await v.pg.$('#mhCsv')) await take('#mhCsv');
  if (await v.pg.$('[data-tab="docs"]')) {
    await v.pg.click('[data-tab="docs"]');
    for (const k of ['html', 'md', 'csv']) if (await v.pg.$(`[data-doc="${k}"]`)) await take(`[data-doc="${k}"]`);
  }
  const errs = v.errs.slice();
  await v.ctx.close();
  return { files, errs };
}

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const record = process.env.SP24_RECORD === '1';
  const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
  const orders = [];
  let n = 0;
  for (const lang of ['en', 'ar']) {
    got[lang] = {};
    for (const [name, buffer] of MODELS) {
      n++;
      const asked = [];
      const { files, errs } = await downloadsOf(browser, url, lang, name, buffer, asked);
      if (name === 'sample') orders.push([lang, asked]);
      got[lang][name] = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, { name: f.name, length: f.text.length, sha256: sha(f.text), start: f.text.slice(0, 100) }]));
      if (record) continue;
      const g = (gold[lang] || {})[name] || {}, now = got[lang][name];
      const keys = Object.keys(Object.assign({}, g, now)).filter((k) => JSON.stringify(g[k]) !== JSON.stringify(now[k]));
      // a difference: the file as it came now, in the temporary folder, to compare by hand
      const kept = keys.map((k) => { if (!files[k]) return k; const f = path.join(os.tmpdir(), `sp24-${lang}-${name}-${k.replace(/\W+/g, '_')}.txt`); fs.writeFileSync(f, files[k].text); return `${k} (now ${JSON.stringify({ name: now[k].name, length: now[k].length })}, recorded ${JSON.stringify(g[k] && { name: g[k].name, length: g[k].length })}; now in ${f})`; });
      check(!keys.length && !errs.length && Object.keys(now).length === Object.keys(g).length,
        `D${n} ${lang} ${name}: the downloads must be the recorded files: ${kept.join('; ')} ${errs.join(' | ')}`.trim());
    }
  }
  if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); return { checks: 20, problems }; }

  if (AFTER) {
    // M1: the builders moved; the page keeps the views, the worker, download() (the link) and the score card
    const page = fs.readFileSync(path.join(ROOT, 'assets/js/model-health.js'), 'utf8'), mod = fs.readFileSync(path.join(ROOT, 'assets/js/health-downloads.js'), 'utf8');
    check(!/function doc(Html|Md)\b|<!doctype html>|'Model documentation and health check|\['Measure', 'Table', 'Folder'|\['Severity', 'Category', 'Rule'/.test(page)
      && /MHDownloads\.build\(/.test(page) && /function docHtml\b/.test(mod) && /function docMd\b/.test(mod) && /'findings-csv'/.test(mod) && /'measures-csv'/.test(mod),
    'M1 the HTML and Markdown documentation and both CSVs are built in health-downloads.js, and model-health.js calls MHDownloads.build');
    // M2: pure: one input, one output, nothing read from around it
    const D = require('../../assets/js/health-downloads.js'), E = require('../../assets/js/model-health-engine.js');
    const bad = [];
    for (const [label, model] of [['tricky', trickyModel()], ['arabic', arabicModel()]]) {
      const result = Object.assign(E.analyze(model, null), { meta: { fileName: label + '.bim', source: 'bim', hasReport: false } }), input = { result, rules: E.RULES, score: E.scoreFrom(result.findings, new Set()), date: '2026-11-03' };
      const before = JSON.stringify(input);
      for (const kind of ['findings-csv', 'measures-csv', 'doc-html', 'doc-md']) {
        const a = D.build(kind, input), b = D.build(kind, input);
        if (!a || typeof a.text !== 'string' || !a.name || !a.type || JSON.stringify(a) !== JSON.stringify(b)) bad.push(`${label} ${kind}: not the same file twice`);
      }
      if (JSON.stringify(input) !== before) bad.push(`${label}: the input changed`);
    }
    const reads = /\b(document|localStorage|sessionStorage|Worker|navigator|location|Date)\b|window\.(?!MHDownloads)/.exec(mod.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '').replace(/root\.MHDownloads = api/, ''));
    if (reads) bad.push(`the module reads ${reads[0]}`);
    check(!bad.length, `M2 build() is pure (the same file twice, its input unchanged, nothing read from the page): ${bad.join('; ')}`);
    // M3: the page asks for the module before the page's own script, on both languages
    const inOrder = (a) => a.indexOf('health-downloads') >= 0 && a.indexOf('health-downloads') < a.indexOf('model-health');
    check(orders.length === 2 && orders.every((o) => inOrder(o[1])), `M3 both pages must ask for health-downloads.min.js before model-health.min.js: ${orders.map((o) => o[0] + ': ' + o[1].join(' ')).join(' | ')}`);
  }
  return { checks, problems };
}
