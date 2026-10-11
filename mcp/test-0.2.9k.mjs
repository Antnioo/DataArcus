// 0.2.9 integration, the field picker's bias fixes (the owner's "fix all of them now", 11 Oct; builder 7's block audit:
// A1-11 the percent rule by name without word boundaries, A3-1 a calendar by table name without word boundaries).
// Written red first. Ordinary names, none of them the portfolio's.
// test.mjs runs it with its own client (import { v029k }); run alone it starts the server itself:
//   node test-0.2.9k.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const req = createRequire(import.meta.url);

export async function v029k({ call, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  const model = (dir, tables, relationships) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: relationships || [] } })); };
  const B = req('../assets/js/pbip-bind.js'), Fix = req('../assets/js/model-health-tmdl.js');

  // ---------- A1-11: one field-meaning rule, the format first, names only with word boundaries ----------
  {
    const card = (name, formatString, expression) => B.measureCard({ name, formatString, expression });
    const cases = [
      ['Corporate Revenue', undefined, 'SUM ( T[x] )', false], ['Generated Leads', undefined, 'COUNTROWS ( T )', false], ['Exchange Rate', undefined, 'AVERAGE ( T[r] )', false],
      ['Corporate Revenue', '#,0', 'SUM ( T[x] )', false], ['Interest Rate %', undefined, 'AVERAGE ( T[r] )', true], ['Conversion Rate', '0.0%', 'DIVIDE ( 1, 2 )', true],
      ['Conversion Rate', undefined, 'DIVIDE ( 1, 2 )', true], ['نسبة الإنجاز', undefined, 'DIVIDE ( 1, 2 )', true], ['مبيعات الشركات', undefined, 'SUM ( T[x] )', false],
      ['Hourly Rate', undefined, 'AVERAGE ( T[r] )', false]];
    const bad = cases.filter(([n, f, e, want]) => !!card(n, f, e).pct !== want).map(([n, f, , want]) => `${n} ${f || '(no format)'} want ${want}`);
    chk(() => !bad.length, () => `A1-11: the picker's percent rule: ${bad.join('; ')}`);
    const raw = (name, formatString, expression) => [{ name: 'T', columns: [col('x', 'double')], measures: [Object.assign({ name, expression }, formatString ? { formatString } : {})] }];
    const fixOf = (name, formatString, expression) => { const r = Fix.formatOf(Object.assign({ name, expression }, formatString ? { formatString } : {}), 'measure', raw(name, formatString, expression)); return r && r.format; };
    const hb = [['Corporate Revenue', undefined, 'SUM ( T[x] )', (f) => f !== '0.0%'], ['Generated Leads', undefined, 'SUM ( T[x] )', (f) => f !== '0.0%'], ['Conversion Rate', undefined, 'DIVIDE ( 1, 2 )', (f) => f === '0.0%'], ['نسبة الإنجاز', undefined, 'DIVIDE ( 1, 2 )', (f) => f === '0.0%']]
      .filter(([n, f, e, ok]) => !ok(fixOf(n, f, e))).map(([n]) => `${n}: ${fixOf(n, undefined, 'x')}`);
    chk(() => !hb.length, () => `A1-11: the health check's format rule agrees: ${hb.join('; ')}`);
    const FM = (() => { try { return req('../assets/js/field-meaning.js'); } catch (e) { return null; } })();
    const src = (f) => fs.readFileSync(path.join(REPO, 'assets/js', f), 'utf8');
    chk(() => FM && typeof FM.percentFromName === 'function' && typeof FM.hasCurrency === 'function' && !/const NOT_PCT =/.test(src('model-health-tmdl.js')) && !/const PCT = \(x\) => \/%\//.test(src('pbip-bind.js')),
      () => 'A1-11: one shared rule, assets/js/field-meaning.js, used by the picker and the health engine (no copy left in either)');
  }

  // ---------- A3-1: a calendar is marked or shaped like one; a name counts only as a whole calendar word ----------
  model('k-hr', [
    { name: 'Candidates', partitions: mp('Candidates'), columns: [col('Stage', 'string'), col('Source', 'string'), col('Applied', 'dateTime')], measures: [{ name: 'Applicants', expression: 'COUNTROWS ( Candidates )', formatString: '#,0' }] },
    { name: 'Time Sheets', partitions: mp('Time Sheets'), columns: [col('Project', 'string'), col('Hours', 'double')], measures: [{ name: 'Total Hours', expression: 'SUM ( \'Time Sheets\'[Hours] )', formatString: '#,0' }] },
    { name: 'Periods', partitions: mp('Periods'), columns: [col('Day', 'dateTime'), col('Month Name', 'string'), col('Year', 'int64')] }],
    [{ name: 'r1', fromTable: 'Candidates', fromColumn: 'Applied', toTable: 'Periods', toColumn: 'Day' }]);
  {
    const s = await ask('suggest_fields', { path: 'k-hr', kpis: 1 }), j = s.j || {};
    const cats = Object.values(j.cats || {}).filter(Boolean).map((f) => `${f.t}[${f.c}]`);
    chk(() => cats.includes('Candidates[Stage]') || cats.includes('Candidates[Source]'), () => `A3-1: "Candidates" is a fact table: its Stage or Source must be a category: ${JSON.stringify(j.cats)}`);
    const t = await ask('suggest_fields', { path: 'k-hr', kpis: 1, tables: ['Time Sheets'] }), tc = Object.values((t.j || {}).cats || {}).filter(Boolean).map((f) => `${f.t}[${f.c}]`);
    chk(() => tc.includes('Time Sheets[Project]'), () => `A3-1: "Time Sheets" is a fact table: Project must be a category: ${JSON.stringify((t.j || {}).cats)}`);
    // "Periods" is no calendar word, but it is shaped like a calendar: a relationship's one side on its date column
    chk(() => j.date && j.date.t === 'Periods', () => `A3-1: a table whose date column is a relationship's one side is a calendar: the time axis from it: ${JSON.stringify(j.date)}`);
    const tables = [{ name: 'Gulf Calendar', columns: [{ name: 'Date', dataType: 'dateTime' }] }, { name: 'Updates', columns: [{ name: 'When', dataType: 'dateTime' }] }, { name: 'Overtime', columns: [] }, { name: 'Mandates', columns: [] }, { name: 'Date', columns: [] }, { name: 'DimDate', columns: [] }];
    const want = { 'Gulf Calendar': true, Updates: false, Overtime: false, Mandates: false, Date: true, DimDate: true };
    chk(() => typeof B.isDateTable === 'function' && tables.every((x) => B.isDateTable(x) === want[x.name]), () => `A3-1: calendar names as whole words: ${typeof B.isDateTable === 'function' ? JSON.stringify(tables.map((x) => [x.name, B.isDateTable(x)])) : 'no isDateTable'}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029k-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await v029k({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029k  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029k  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
