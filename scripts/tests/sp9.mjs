// 0.3.2 SP9 (the split: model-health-engine.js -> dax-reference-parser.js, the DAX tokens and the report references;
// mcp/work/SP9.md): the Model Health Check page, rendered (?lang=en and ?lang=ar), checks three files through its worker
// and shows what was recorded on the base (integration/0.3.2 a57e094, before the move): the page's sample, a made-up
// .pbit (DAX with comments, strings holding brackets, quoted table names with spaces and apostrophes, VARs, an Arabic
// table; a legacy report with a bookmark and a report measure) and a made-up TMDL project with one table file empty
// (the incomplete model: no score, its warning). For each: the result's text and every tab's text (each finding opened).
// The worker's clock is stopped (the check time reads "under 0.1 s"); each file in a fresh visitor (no score history).
// Recorded in fixtures/sp9-page.json; SP9_RECORD=1 records again (only on the base, never to make a run pass).
//   W1, W2  EN and AR: the three files show the recorded text, tab by tab
//   W3      (after the move) the page asked for dax-reference-parser.min.js before model-health-engine.min.js
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { visitor } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..');
const GOLD = path.join(HERE, 'fixtures', 'sp9-page.json');
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

// a stored ZIP of [name, Buffer] (a .pbit's parts in UTF-16 as Power BI writes them; TMDL files in UTF-8)
function zip(list) {
  const parts = [], dir = []; let off = 0;
  for (const [name, data] of list) {
    const nb = Buffer.from(name), crc = zlib.crc32(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(nb.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(nb.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, nb, data); dir.push(c, nb); off += 30 + nb.length + data.length;
  }
  const cd = Buffer.concat(dir), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(dir.length / 2, 8); e.writeUInt16LE(dir.length / 2, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, e]);
}
const utf16 = (s) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(s, 'utf16le')]);

// the made-up model (no employer data)
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, extra) => Object.assign({ name, dataType, sourceColumn: name }, extra || {});
const ms = (name, expression) => ({ name, expression, formatString: '#,0' });
const MODEL = { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Qty/Box', 'int64'), col('Region', 'string'), col('Spare', 'string'), col('Region Key', 'int64'), col('Date', 'dateTime')],
    measures: [ms('Total', 'SUM ( Sales[Amount] ) // Sales[Spare] only in a comment'),
      ms('Commented', "-- [Total]\n/* 'Sales'[Region] */\nCALCULATE ( [Total], Sales[Region] = \"[Not a ref] and 'not a table'\" )"),
      ms('Per Box', 'SUM ( Sales[Qty/Box] ) / 1000'),
      ms('With Vars', "VAR _Base = [Total]\nVAR _Ticks = 60\nVAR _Rows = COUNTROWS ( 'Bob''s Sales' )\nRETURN DIVIDE ( _Base, _Rows ) / _Ticks"),
      ms('Net', "SUM ( 'Bob''s Sales'[Net Amount] ) + SUM ( 'Sales Region Map'[Weight] )"),
      ms('Virtual', 'SUMX ( ADDCOLUMNS ( Sales, "Spare", Sales[Amount] * 2 ), [Spare] )'),
      ms('Iterator', 'SUMX ( Sales, [Amount] * [Qty/Box] )'),
      ms('Same Twice', 'SUM ( Sales[Amount] ) + SUM ( Sales[Amount] )')] },
  { name: "Bob's Sales", partitions: mp("Bob's Sales"), columns: [col('Net Amount', 'double'), col('Region Key', 'int64'), col('Note', 'string')] },
  { name: 'Sales Region Map', partitions: mp('Sales Region Map'), columns: [col('Region Key', 'int64', { isKey: true }), col('Weight', 'double'), col('Label', 'string')] },
  { name: 'المبيعات', partitions: mp('المبيعات'), columns: [col('المبلغ', 'double'), col('الكمية', 'int64'), col('المنطقة', 'string')],
    measures: [ms('إجمالي المبيعات', "SUM ( 'المبيعات'[المبلغ] ) -- المبلغ"), ms('متوسط', 'AVERAGEX ( المبيعات, [المبلغ] * [الكمية] )'), ms('نص', '"[المنطقة]"')] }],
relationships: [{ name: 'r2', fromTable: "Bob's Sales", fromColumn: 'Region Key', toTable: 'Sales Region Map', toColumn: 'Region Key', crossFilteringBehavior: 'bothDirections' }] } };
const ent = (e, p, kind = 'Column') => ({ [kind]: { Expression: { SourceRef: { Entity: e } }, Property: p } });
const LAYOUT = {
  config: JSON.stringify({ bookmarks: [{ displayName: 'Group', children: [{ displayName: 'الشمال', explorationState: { filters: [ent('Sales Region Map', 'Label')] } }] }],
    modelExtensions: [{ entities: [{ name: 'Sales', measures: [{ name: 'Report Only', expression: "[Iterator] + SUM ( 'المبيعات'[الكمية] )" }] }] }] }),
  sections: [{ name: 's1', displayName: 'الصفحة ١', filters: JSON.stringify([{ expression: ent('المبيعات', 'المنطقة') }]), visualContainers: [
    { config: JSON.stringify({ singleVisual: { visualType: 'card', prototypeQuery: { From: [{ Name: 'm', Entity: 'Sales' }], Select: [{ Measure: { Expression: { SourceRef: { Source: 'm' } }, Property: 'Net' } }] },
      vcObjects: { title: [{ properties: { text: { expr: { Literal: { Value: "'Bob''s [card]'" } } } } }] } } }), filters: '[]' },
    { config: JSON.stringify({ singleVisual: { visualType: 'tableEx', prototypeQuery: { From: [{ Name: 'a', Entity: 'المبيعات' }], Select: [{ Measure: { Expression: { SourceRef: { Source: 'a' } }, Property: 'إجمالي المبيعات' } }, { Column: { Expression: { SourceRef: { Source: 'a' } }, Property: 'المبلغ' } }] } } }) }] }] };
const PBIT = zip([['DataModelSchema', utf16(JSON.stringify(MODEL))], ['Report/Layout', utf16(JSON.stringify(LAYOUT))], ['Version', utf16('1.28')]]);
// the incomplete project: the TMDL fixture with one table file empty (AU47)
const TMDL_DIR = path.join(ROOT, 'scripts/tests/fixtures/model-health/tmdl-health/definition');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const BROKEN = zip(walk(TMDL_DIR).sort().map((f) => ['Broken.SemanticModel/definition/' + path.relative(TMDL_DIR, f).split(path.sep).join('/'), Buffer.from(fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'))])
  .concat([['Broken.SemanticModel/definition/tables/Notes.tmdl', Buffer.alloc(0)]]));
const FILES = [['sample', null], ['tricky.pbit', PBIT], ['broken.zip', BROKEN]];

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const record = process.env.SP9_RECORD === '1';
  const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
  const after = fs.existsSync(path.join(ROOT, 'assets/js/dax-reference-parser.js'));
  const orders = []; let badOrder = false;

  for (const lang of ['en', 'ar']) {
    got[lang] = {};
    for (const [name, buffer] of FILES) {
      const v = await visitor(browser, { viewport: [1440, 900] });
      const asked = [];
      v.ctx.on('request', (r) => { const m = /\/(dax-reference-parser|model-health-engine)\.min\.js/.exec(r.url()); if (m) asked.push(m[1]); });
      await v.ctx.route(/model-health-worker\.min\.js/, async (rt) => { const r = await rt.fetch(); await rt.fulfill({ response: r, body: 'Date.now = () => 1e12;\n' + await r.text() }); });
      await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=${lang}`, { waitUntil: 'networkidle' });
      if (buffer) await v.pg.setInputFiles('#mhFile', { name, mimeType: 'application/octet-stream', buffer });
      else await v.pg.click('#mhSample');
      await v.pg.waitForSelector('.mh-unreadable, #mhTab, .mh-error', { timeout: 30000 });
      const text = (sel) => v.pg.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.querySelectorAll('details').forEach((d) => { d.open = true; }); return e.textContent.replace(/\s+/g, ' ').trim(); }, sel);
      const now = { app: await text('#mhApp') };
      const tabs = await v.pg.$$eval('[data-tab]', (bs) => bs.map((b) => b.dataset.tab));
      for (const t of tabs) { await v.pg.click(`[data-tab="${t}"]`); now['tab:' + t] = await text('#mhTab'); }
      got[lang][name] = Object.fromEntries(Object.entries(now).map(([k, x]) => [k, x == null ? null : { length: x.length, sha256: sha(x), start: x.slice(0, 80) }]));
      if (v.errs.length) problems.push(`${lang} ${name}: ${v.errs.join(' | ')}`);
      orders.push(`${lang} ${name}: ${asked.join(' ')}`);
      if (after && !(asked.includes('dax-reference-parser') && asked.indexOf('dax-reference-parser') < asked.indexOf('model-health-engine'))) badOrder = true;
      await v.ctx.close();
    }
    if (record) continue;
    const bad = [];
    for (const [name] of FILES) {
      const g = (gold[lang] || {})[name] || {}, n = got[lang][name];
      const keys = Object.keys(Object.assign({}, g, n)).filter((k) => JSON.stringify(g[k]) !== JSON.stringify(n[k]));
      if (keys.length) bad.push(`${name}: ${keys.map((k) => `${k} (now ${JSON.stringify(n[k])}, recorded ${JSON.stringify(g[k])})`).join('; ').slice(0, 600)}`);
    }
    check(!bad.length, `${lang === 'en' ? 'W1' : 'W2'} ${lang}: the page shows what was recorded: ${bad.join(' | ')}`);
  }
  if (!record && after) check(!badOrder, `W3 the page must ask for dax-reference-parser.min.js before model-health-engine.min.js: ${orders.join(' | ')}`);
  if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); checks += 2; }
  return { checks, problems };
}
