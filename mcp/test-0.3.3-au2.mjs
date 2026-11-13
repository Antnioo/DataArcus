// AU2 (0.3.3; the reviewer's night audit AUD-051, B-307, and the weekday half of B-402): the Arabic twin read two things
// from a column's name in English only. Each case through create_arabic_twin on the real server (stdio), on a made-up
// model (the twin fixture, its Calendar date table given four made-up columns), the plan approved in the browser, the
// twin written:
//   A1  guard: a line chart on the date table's untyped column "Ship Date": the twin inverts its axis (time read from
//       the right), as on c21df8d5 (mirror-policy's DATE_LIKE)
//   A2  the same chart on the untyped column «تاريخ الشحن»: the same axis treatment (red on c21df8d5: kept left to right)
//   H1  guard: a heatmap whose rows are "Weekday": the twin gives it its day names beside the grid (MX3)
//   H2  the same heatmap by «يوم الأسبوع»: the same (red on c21df8d5: kept a matrix, its rows "not the days of the week")
//   V   the written twin passes Microsoft's validator (R-73: the names beside are a visual the twin adds)
// The names are read by assets/js/time-names.js (isDateName, isWeekdayName), their one home (D-1104-15, D-1104-12).
// Made-up names only, no data.   node test-0.3.3-au2.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { validatorCounts } from './test-validator.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (f) => { try { return f(); } catch (e) { return undefined; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2)); };
const httpReq = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (d) => { t += d; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const L = (v) => ({ expr: { Literal: { Value: v } } });
const col = (c) => ({ field: { Column: { Expression: { SourceRef: { Entity: 'Calendar' } }, Property: c } }, queryRef: 'Calendar.' + c, nativeQueryRef: c });
const sales = { field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Total Sales' } }, queryRef: 'Sales.Total Sales', nativeQueryRef: 'Total Sales' };
const calls = { field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: 'Calendar' } }, Property: 'Calls' } }, Function: 0 } }, queryRef: 'Sum(Calendar.Calls)', nativeQueryRef: 'Calls' };
const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
const line = (name, x, c) => ({ $schema: VS, name, position: { x, y: 20, z: 1000, width: 560, height: 300, tabOrder: 1000 },
  visual: { visualType: 'lineChart', query: { queryState: { Category: { projections: [col(c)] }, Y: { projections: [sales] } },
    sortDefinition: { sort: [{ field: col(c).field, direction: 'Ascending' }] } } } });
// (MX1's heatmap: Rows = a weekday, Columns = an hour, one value; English's row header strip set, 6 of padding beside it)
const heat = (name, x, rows) => ({ $schema: VS, name, position: { x, y: 360, z: 2000, width: 200, height: 300, tabOrder: 2000 },
  visual: { visualType: 'pivotTable', query: { queryState: { Rows: { projections: [col(rows)] }, Columns: { projections: [col('Hour')] }, Values: { projections: [calls] } } },
    objects: { columnWidth: [{ properties: { value: L('82D') }, selector: { metadata: 'Calendar.' + rows } }] },
    visualContainerObjects: { padding: [{ properties: { right: L('6D') } }] } } });

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-au2-root-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-au2-log-'))), log = path.join(LOGS, 'links.txt');
const D = path.join(ROOT, 'a'), DEF = path.join(D, 'Twin Sales.Report/definition'), PG = 'p5au2';
fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
// the model: the Calendar date table (a typed Date, a month and a year: twin-model.mjs reads it a date table) given two
// calculated columns with no type (the model read cannot say they are dates: RepeatIQ's StartOfMonth's shape, MP1e),
// two text weekday columns and an hour
{
  const f = path.join(D, 'Twin Sales.SemanticModel/model.bim'), bim = rd(f), cal = bim.model.tables.find((t) => t.name === 'Calendar');
  cal.columns.push({ name: 'Ship Date', type: 'calculated', expression: "'Calendar'[Date] + 2" },
    { name: 'تاريخ الشحن', type: 'calculated', expression: "'Calendar'[Date] + 2" },
    { name: 'Weekday', dataType: 'string', sourceColumn: 'Weekday' }, { name: 'يوم الأسبوع', dataType: 'string', sourceColumn: 'يوم الأسبوع' },
    { name: 'Hour', dataType: 'int64', sourceColumn: 'Hour' }, { name: 'Calls', dataType: 'int64', sourceColumn: 'Calls' });
  wr(f, bim);
  const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj); pages.pageOrder.push(PG); wr(pj, pages);
  wr(path.join(DEF, 'pages', PG, 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: PG, displayName: 'Shipping', displayOption: 'FitToPage', width: 1280, height: 720 });
  [line('lineEn', 20, 'Ship Date'), line('lineAr', 660, 'تاريخ الشحن'), heat('heatEn', 300, 'Weekday'), heat('heatAr', 760, 'يوم الأسبوع')]
    .forEach((v) => wr(path.join(DEF, 'pages', PG, 'visuals', v.name, 'visual.json'), v));
}

const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' }), call = s.call;
const a = { path: path.join('a', 'Twin Sales.pbip'), arabicMonth: false };
const plan = await call('create_arabic_twin', a), j = plan.j || {}, id = j.plan && j.plan.planId;
let w = { err: true, t: 'no plan: ' + String(plan.t).slice(0, 300) };
if (id) { const n = links().length; await call('approve_plan', { planId: id }); for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50); const url = links()[n] || ''; if (url) { await httpReq(url, 'POST', 'decision=approve'); await call('approve_plan', { planId: id }); } w = await call('create_arabic_twin', Object.assign({}, a, { planId: id })); }
await s.close();

const AR = path.join(D, 'Twin Sales AR.Report/definition/pages', PG, 'visuals');
const inverted = (name) => get(() => (rd(path.join(AR, name, 'visual.json')).visual.objects.categoryAxis || []).some((e) => e.properties && e.properties.invertAxis && /true/.test(JSON.stringify(e.properties.invertAxis))));
chk(() => !w.err && inverted('lineEn') === true, () => `A1 (guard) the chart on the untyped date column "Ship Date" has its axis inverted in the twin: ${inverted('lineEn')} ${w.err ? String(w.t).slice(0, 300) : ''}`);
chk(() => !w.err && inverted('lineAr') === inverted('lineEn') && inverted('lineAr') === true, () => `A2 the chart on «تاريخ الشحن» gets the axis treatment "Ship Date" gets: inverted ${inverted('lineAr')}, "Ship Date" ${inverted('lineEn')}`);
const hn = get(() => j.mirrors.find((x) => x.kind === 'heatmapNames')), where = (hn && hn.where) || [];
const kept = get(() => (j.cannot || []).filter((c) => (c.where || []).some((x) => /heat/.test(x))).map((c) => c.what + ': ' + (c.where || []).join() + ' ' + (c.why || '')));
chk(() => where.includes(PG + '/heatEn'), () => `H1 (guard) the heatmap by "Weekday" gets its names beside it: ${JSON.stringify(hn)} ${JSON.stringify(kept)}`);
chk(() => where.includes(PG + '/heatAr'), () => `H2 the heatmap by «يوم الأسبوع» gets its names beside it as the one by "Weekday" does: ${JSON.stringify(hn)} ${JSON.stringify(kept)}`);
const v = w.err ? { ran: false, why: 'no twin' } : validatorCounts(path.join(D, 'Twin Sales AR.Report'));
chk(() => v.ran && v.errorCount === 0, () => `V Microsoft's validator on the written twin: ${JSON.stringify(v).slice(0, 400)}`);

[ROOT, LOGS].forEach((d) => { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { /* left for the OS */ } });
if (problems.length) { console.log(`FAIL script=test-0.3.3-au2.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  au2  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  au2  ${checks} checks`);
