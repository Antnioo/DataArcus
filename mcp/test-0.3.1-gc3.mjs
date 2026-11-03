// 0.3.1 GC3 (the owner's laptop run, 27 Oct, the sample's tour step 3; written red first): add_gulf_calendar never adds a
// second active relationship from a fact date column that already has an active one to a date table.
//   G1  the sample (Sales[Date] -> Calendar[Date]): relateTo Sales[Date] relates Calendar[Date] -> Gulf Calendar[Date] (many
//       to one, single direction: the shape Desktop applied), nothing more to Sales[Date]; the plan and the approval page
//       say so and why, EN and AR; the tour's own step 3 (no relateTo) is unchanged: no relationship
//   G2  two facts on the same date table (Sales[Date], Returns[Date] -> Calendar[Date]): one relationship, Calendar's
//   G3  the date table's Date is already related onward: the relationship is added inactive (isActive: false), the answer
//       says how to use it (USERELATIONSHIP) and the steps by hand name it
//   G4  unchanged: no date table (the active relationship as before); an inactive existing relationship; Power BI's
//       automatic date table (LocalDateTable_); with no relateTo, the step by hand names the date table's Date when there is one
//   G5  every script: no column has two active relationships (the model's and the script's together); each script reads
//       back with the repo's TMDL reader, its relationship lines only fromColumn, toColumn (and isActive: false)
// Fixtures: the sample project (mcp/lib/sample-project.mjs) and made-up models written here.   node test-0.3.1-gc3.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { sampleFiles, tour } from './lib/sample-project.mjs';

const Tmdl = createRequire(import.meta.url)('../assets/js/tmdl-model.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? String(x.t).slice(0, 500) : JSON.stringify(x && x.j).slice(0, 500));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/[ \t\n]+/g, ' ');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-gc3-')));
// the sample, as create_report writes it
const SAMPLE = 'Gulf Retail Sample';
sampleFiles(SAMPLE).forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
const SM = `${SAMPLE}/Gulf Retail.SemanticModel`;
// made-up models (model.bim): Sales and Returns facts, a Calendar, a Fiscal table; rels: the model's relationships
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
const bim = (dir, tables, rels) => {
  fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: rels } }));
  fs.writeFileSync(path.join(ROOT, dir, 'M.pbip'), JSON.stringify({ version: '1.0', artifacts: [] }));
};
const SALES = { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Date', 'dateTime'), col('Ship Date', 'dateTime')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )' }] };
const RETURNS = { name: 'Returns', partitions: mp('Returns'), columns: [col('Qty', 'int64'), col('Date', 'dateTime')] };
const CAL = { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Year', 'int64')] };
const FISCAL = { name: 'Fiscal', partitions: mp('Fiscal'), columns: [col('Date', 'dateTime', { isKey: true }), col('Fiscal Year', 'int64')] };
const AUTO = { name: 'LocalDateTable_0a1b2c3d', isHidden: true, partitions: [{ name: 'L', mode: 'import', source: { type: 'calculated', expression: 'Calendar(Date(Year(MIN(\'Sales\'[Date])), 1, 1), Date(Year(MAX(\'Sales\'[Date])), 12, 31))' } }], columns: [col('Date', 'dateTime')] };
const R = (name, ft, fc, tt, tc, x) => Object.assign({ name, fromTable: ft, fromColumn: fc, toTable: tt, toColumn: tc }, x || {});
bim('two', [SALES, RETURNS, CAL], [R('r1', 'Sales', 'Date', 'Calendar', 'Date'), R('r2', 'Returns', 'Date', 'Calendar', 'Date')]);
bim('chain', [SALES, CAL, FISCAL], [R('r1', 'Sales', 'Date', 'Calendar', 'Date'), R('r2', 'Calendar', 'Date', 'Fiscal', 'Date')]);
bim('nodate', [SALES], []);
bim('inactive', [SALES, CAL], [R('r1', 'Sales', 'Date', 'Calendar', 'Date'), R('r2', 'Sales', 'Ship Date', 'Calendar', 'Date', { isActive: false })]);
bim('auto', [SALES, AUTO], [R('r1', 'Sales', 'Date', 'LocalDateTable_0a1b2c3d', 'Date', { joinOnDateBehavior: 'datePartOnly' })]);

const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const pageOf = async (planId) => {
  const n = links().length; await s.call('approve_plan', { planId }); const url = await linkAt(n), html = url ? await req(url, 'GET') : '';
  if (url) { await req(url, 'POST', 'decision=approve'); await s.call('approve_plan', { planId }); }
  return unesc(html);
};
// plan, page (approved), write: { plan, page, out, script }
const run = async (a) => {
  const plan = await s.call('add_gulf_calendar', Object.assign({ asOf: '2026-10-27' }, a)), id = plan.j && plan.j.plan && plan.j.plan.planId;
  const page = id ? await pageOf(id) : '', out = id ? await s.call('add_gulf_calendar', Object.assign({ asOf: '2026-10-27', planId: id }, a)) : { err: true, t: 'no plan: ' + short(plan) };
  const f = out.j && out.j.scriptFile, script = f && fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f), 'utf8') : '';
  return { plan, page, out, script };
};
// the script's relationships, as written: [{ name, props: [[key, value]] }]
const relsOf = (sc) => sc.split(/\n(?=\trelationship )/).filter((b) => /^\trelationship /.test(b)).map((b) => { const L = b.split('\n'); return { name: L[0].slice('\trelationship '.length), props: L.slice(1).filter((l) => /^\t\t\S/.test(l)).map((l) => { const m = l.trim().match(/^(\w+)(?::\s*(.*))?$/); return [m[1], m[2] == null ? true : m[2]]; }) }; });
const prop = (r, k) => (r.props.find(([x]) => x === k) || [])[1];
// G5: the model's active relationships and the script's, together: no from column twice
const modelRels = (dir) => {
  const bimF = path.join(ROOT, dir, 'M.SemanticModel/model.bim');
  if (fs.existsSync(bimF)) return JSON.parse(fs.readFileSync(bimF, 'utf8')).model.relationships;
  const t = fs.readFileSync(path.join(ROOT, SM, 'definition/relationships.tmdl'), 'utf8');
  return Tmdl.fromFiles([{ path: 'definition/relationships.tmdl', text: t }]).model.relationships;
};
const noSecondActive = (dir, sc) => {
  const all = modelRels(dir).filter((r) => r.isActive !== false && !/^LocalDateTable_/.test(r.toTable)).map((r) => `${r.fromTable}.${r.fromColumn}`)
    .concat(relsOf(sc).filter((r) => prop(r, 'isActive') !== 'false').map((r) => prop(r, 'fromColumn').replace(/'/g, '')));
  return all.length === new Set(all).size;
};
// the script reads back with the repo's TMDL reader (its objects one tab in, under createOrReplace): the table and each
// relationship, with the isActive the script says
const readsBack = (sc) => { const m = Tmdl.fromFiles([{ path: 'definition/script.tmdl', text: sc.replace(/^createOrReplace\n/, '').replace(/^\t/gm, '') }]).model; return (m.tables || []).length === 1 && (m.relationships || []).length === relsOf(sc).length && m.relationships.every((r, i) => (r.isActive === false) === (prop(relsOf(sc)[i], 'isActive') === 'false')); };
const shapeOk = (sc) => relsOf(sc).every((r) => r.props.every(([k, v]) => k === 'fromColumn' || k === 'toColumn' || (k === 'isActive' && v === 'false')));

try {
  // ---------- G1: the sample ----------
  {
    const g = await run({ path: SM, firstYear: 2025, lastYear: 2026, relateTo: ['Sales[Date]'] });
    const r = relsOf(g.script);
    chk(() => !g.out.err && r.length === 1 && prop(r[0], 'fromColumn') === 'Calendar.Date' && prop(r[0], 'toColumn') === "'Gulf Calendar'.Date" && prop(r[0], 'isActive') == null,
      () => `G1-1. the sample: Calendar[Date] -> Gulf Calendar[Date], active, nothing more to Sales[Date]: ${JSON.stringify(r)} ${short(g.out)}`);
    chk(() => JSON.stringify(g.plan.j.relationships) === JSON.stringify(['Calendar[Date] -> Gulf Calendar[Date] (many to one, single direction)']),
      () => `G1-2. the plan's relationships: ${short(g.plan)}`);
    chk(() => g.plan.j.relationshipsWhy.length === 1 && /Sales\[Date\] already relates to the date table "Calendar" \(Calendar\[Date\]\)/.test(g.plan.j.relationshipsWhy[0]) && /no second relationship is added to Sales\[Date\]/.test(g.plan.j.relationshipsWhy[0]) && !('relationshipsWhyAr' in g.plan.j),
      () => `G1-3. the plan says why, in plain words (the Arabic only on the page): ${short(g.plan)}`);
    chk(() => g.plan.j.plan.writesAfterGo.some((w) => /1 relationship \(Sales\[Date\] already relates to the date table "Calendar"/.test(w)),
      () => `G1-4. the plan's write line says it: ${JSON.stringify(g.plan.j.plan && g.plan.j.plan.writesAfterGo)}`);
    chk(() => /Sales\[Date\] already relates to the date table "Calendar"/.test(g.page) && /no second relationship is added to Sales\[Date\]/.test(g.page),
      () => `G1-5. the approval page says it (EN): ${g.page.slice(0, 600)}`);
    // (ST1, GC3-S2) the input row is what was asked, not a claim the columns are related as given
    chk(() => /Asked to relate to the new table's Date/.test(g.page) && !/>Related to the new table's Date</.test(g.page) && !/Related to the new table's Date: /.test(g.page),
      () => `G1-5b. the input row says "asked to relate", the write line says what is related: ${g.page.slice(0, 600)}`);
    chk(() => noSecondActive(SM, g.script) && readsBack(g.script) && shapeOk(g.script), () => `G1-6. no second active relationship; reads back; the proven shape: ${g.script.slice(g.script.indexOf('\trelationship'))}`);
    chk(() => g.out.j.byHand.length === 1 && /Mark as date table/.test(g.out.j.byHand[0]), () => `G1-7. one step by hand, as before: ${short(g.out)}`);
    // the Arabic page
    const a = await run({ path: SM, firstYear: 2025, lastYear: 2026, relateTo: ['Sales[Date]'], lang: 'ar', name: 'Gulf Calendar AR' });
    // (FX1, the laptop's part 3: an Arabic plan's page wholly Arabic, each Latin run isolated; changed on purpose)
    const aPage = String(a.page).replace(/<\/?bdi[^>]*>/g, '');
    chk(() => /العمود Sales\[Date\] مرتبط من قبل بجدول التاريخ «Calendar»/.test(aPage) && /ولا تُضاف علاقة ثانية إلى Sales\[Date\]/.test(aPage),
      () => `G1-8. the Arabic approval page says it: ${a.page.slice(0, 600)}`);
    // naming Calendar[Date] too: still one relationship
    const b = await run({ path: SM, firstYear: 2025, lastYear: 2026, relateTo: ['Calendar[Date]', 'Sales[Date]'], name: 'Gulf Calendar B' });
    chk(() => relsOf(b.script).length === 1 && prop(relsOf(b.script)[0], 'fromColumn') === 'Calendar.Date' && noSecondActive(SM, b.script), () => `G1-9. Calendar[Date] and Sales[Date]: one relationship: ${b.script.slice(b.script.indexOf('\trelationship'))}`);
    // the tour's own step 3: no relateTo, no relationship (unchanged)
    const step3 = tour(SAMPLE, 'en')[2].call.args;
    const t3 = await s.call('add_gulf_calendar', Object.assign({ asOf: '2026-10-27' }, step3, { name: 'Gulf Calendar T' }));
    chk(() => !t3.err && t3.j.relationships.length === 0 && !t3.j.relationshipsWhy, () => `G1-10. the tour's step 3 relates nothing: ${short(t3)}`);
    chk(() => t3.j.byHand.length === 2 && /^Relate Calendar\[Date\] to "Gulf Calendar T"\[Date\]/.test(t3.j.byHand[1]) && /never drag those onto/.test(t3.j.byHand[1]),
      () => `G1-11. and its step by hand relates Calendar[Date], never Sales[Date] a second time: ${JSON.stringify(t3.j && t3.j.byHand)}`);
  }
  // ---------- G2: two facts on the same date table ----------
  {
    const g = await run({ path: 'two', firstYear: 2024, lastYear: 2025, relateTo: ['Sales[Date]', 'Returns[Date]'] });
    const r = relsOf(g.script);
    chk(() => !g.out.err && r.length === 1 && prop(r[0], 'fromColumn') === 'Calendar.Date' && g.plan.j.relationshipsWhy.length === 2 && noSecondActive('two', g.script) && readsBack(g.script) && shapeOk(g.script),
      () => `G2-1. two facts, one relationship from Calendar[Date], both said: ${JSON.stringify(r)} ${short(g.plan)}`);
  }
  // ---------- G3: the date table's Date already related onward: inactive ----------
  {
    const g = await run({ path: 'chain', firstYear: 2024, lastYear: 2025, relateTo: ['Sales[Date]'] });
    const r = relsOf(g.script);
    chk(() => !g.out.err && r.length === 1 && prop(r[0], 'fromColumn') === 'Sales.Date' && prop(r[0], 'isActive') === 'false' && r[0].props[0][0] === 'isActive',
      () => `G3-1. Sales[Date] -> Gulf Calendar[Date] inactive (isActive: false first, as Microsoft Learn's TMDL): ${JSON.stringify(r)} ${short(g.out)}`);
    chk(() => /\(many to one, single direction, inactive\)$/.test(g.plan.j.relationships[0]) && /USERELATIONSHIP \( Sales\[Date\], Gulf Calendar\[Date\] \)/.test(g.plan.j.relationshipsWhy[0]) && /dashed/.test(g.plan.j.relationshipsWhy[0]),
      () => `G3-2. the answer says inactive and how to use it: ${short(g.plan)}`);
    chk(() => g.out.j.byHand.length === 2 && /USERELATIONSHIP/.test(g.out.j.byHand[1]) && /USERELATIONSHIP/.test(g.page), () => `G3-3. the step by hand and the page: ${JSON.stringify(g.out.j && g.out.j.byHand)}`);
    chk(() => noSecondActive('chain', g.script) && readsBack(g.script) && shapeOk(g.script), () => `G3-4. no second active relationship; reads back: ${g.script.slice(g.script.indexOf('\trelationship'))}`);
  }
  // ---------- G4: unchanged ----------
  for (const [dir, rc, want] of [['nodate', 'Sales[Date]', 'Sales.Date'], ['inactive', 'Sales[Ship Date]', "Sales.'Ship Date'"], ['auto', 'Sales[Date]', 'Sales.Date']]) {
    const g = await run({ path: dir, firstYear: 2024, lastYear: 2025, relateTo: [rc] });
    const r = relsOf(g.script);
    const n = await s.call('add_gulf_calendar', { path: dir, firstYear: 2024, lastYear: 2025, asOf: '2026-10-27', name: 'Gulf Calendar N' });
    chk(() => !n.err && /^Relate (your fact tables' date columns|Calendar\[Date\]) to/.test(n.j.byHand[1]) && (dir === 'inactive') === /^Relate Calendar/.test(n.j.byHand[1]),
      () => `G4 ${dir} (no relateTo): the step by hand: ${JSON.stringify(n.j && n.j.byHand)}`);
    chk(() => !g.out.err && r.length === 1 && prop(r[0], 'fromColumn') === want && prop(r[0], 'isActive') == null && r[0].props.length === 2 && !g.plan.j.relationshipsWhy && noSecondActive(dir, g.script),
      () => `G4 ${dir}. ${rc} related as before (active, fromColumn and toColumn only): ${JSON.stringify(r)} ${short(g.plan)}`);
  }
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }
await s.close();
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL  gc3  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  gc3  ${checks} checks`);
