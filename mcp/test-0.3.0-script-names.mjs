// 0.3.0 F7 (the API red team, E1 round 2: F-2 and F-3; written red first).
//   F2  the Arabic calendar script (C1) never writes a name with a control character: a date table or a column whose name
//       holds a line break (LF, CRLF, then text that looks like TMDL) is left out and named in the answer, with why, on
//       both routes (create_report lang "ar", create_arabic_twin); every line of the script is the builder's own; a name
//       with bidi or zero-width characters stays (inside its quotes), as before
//   F3  the formats script plan_layout and create_report write holds only the objects the plan lists (formats.fields):
//       nothing is written without being shown first; check_model_health's own script still covers the whole model
// Fixtures: made-up models written here (model.bim), and mcp/test-models/no-measures.   node test-0.3.0-script-names.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-f7-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
const INJ = '\nref table Sales\n\t\tmeasure INJECTED = 1';
// a model: Sales and a date table; cal: the date table's name; extra: more date table columns
const model = (dir, cal, extra) => {
  fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Date', 'dateTime')],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] },
    { name: cal, dataCategory: 'Time', partitions: mp('Cal'), columns: [col('Date', 'dateTime', { isKey: true }), col('Year', 'int64'), col('Month Number', 'int64'),
      col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Is Weekend', 'boolean')].concat(extra || []) }],
    relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: cal, toColumn: 'Date' }] } }));
  fs.writeFileSync(path.join(ROOT, dir, 'M.pbip'), JSON.stringify({ version: '1.0', artifacts: [] }));
};
model('lf', 'Cal' + INJ);                                                         // the date table's name: a line break
model('crlf', 'Calendar', [col('Quarter\r\n', 'string'), col('Fiscal Year\n\t\tcolumn X = 1', 'string')]);   // columns' names: CRLF; a line break then TMDL
model('bidi', 'Calendar‮​', [col('Quarter', 'string')]);                 // bidi and zero-width: kept, quoted
const s = await serverClient(ROOT, {});
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Total Sales]', category: 'Sales[Region]' };
const write = async (dir, lang, name, extra) => {
  const a = Object.assign({ path: dir + '/M.SemanticModel', lang, name, layout: 'exec', secondPage: false, planFields: FIELDS }, extra || {});
  const pl = await s.call('plan_layout', a), id = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!id) return { pl, err: 'no plan id: ' + short(pl) };
  await s.call('approve_plan', { planId: id });
  const cr = Object.assign({}, a, { planId: id, design: pl.j.design, fields: FIELDS }); delete cr.planFields;
  const r = await s.call('create_report', cr);
  return r.err ? { pl, err: String(r.t).slice(0, 400) } : { pl, r };
};
// every line of a calendar script is the builder's own shape
const LINE = /^(createOrReplace|\tref table ('([^'\r\n]|'')*'|[A-Za-z_][A-Za-z0-9_]*)|\t\tcolumn ('([^'\r\n]|'')*'|[A-Za-z_][A-Za-z0-9_]*) = .+|\t\t\t(dataType: \w+|isHidden|lineageTag: [0-9a-f-]+|summarizeBy: none|sortByColumn: ('([^'\r\n]|'')*'|[A-Za-z_][A-Za-z0-9_]*))|)$/;
const badLines = (sc) => String(sc).split('\n').filter((l) => !LINE.test(l));
const scriptIn = (dir, re) => { const f = fs.readdirSync(path.join(ROOT, dir)).find((x) => re.test(x)); return f ? fs.readFileSync(path.join(ROOT, dir, f), 'utf8') : null; };

try {
  // ---------- F2: create_report lang "ar" ----------
  {
    const w = await write('lf', 'ar', 'تقرير');
    const sc = scriptIn('lf', /Arabic calendar\.tmdl$/), ca = (w.pl && w.pl.j && w.pl.j.calendarArabic) || null;
    chk(() => !w.err && !sc && !/INJECTED/.test(JSON.stringify(fs.readdirSync(path.join(ROOT, 'lf')))), () => `F2-1. a date table named with a line break gets no calendar script (the report is written): ${w.err || 'script: ' + String(sc).slice(0, 200)}`);
    const said = JSON.stringify((w.r && w.r.j && w.r.j.calendarArabic) || ca || (w.r && w.r.j) || {});
    chk(() => /control character|line break/i.test(said) && /left out|not offered|leftOut/i.test(said), () => `F2-2. the answer names the date table left out, with why: ${said.slice(0, 400)}`);
  }
  {
    const w = await write('crlf', 'ar', 'تقرير');
    const sc = scriptIn('crlf', /Arabic calendar\.tmdl$/) || '';
    chk(() => !w.err && sc && !badLines(sc).length && !/column X = 1/.test(sc) && /Month Name \(Arabic\)/.test(sc), () => `F2-3. a column named with CRLF + TMDL is left out; every line the builder's own: ${w.err || JSON.stringify(badLines(sc).slice(0, 4))}`);
    const said = JSON.stringify((w.r && w.r.j && w.r.j.calendarArabic) || {});
    chk(() => /leftOut/.test(said) && /control character/i.test(said), () => `F2-4. the column is named as left out, with why: ${said.slice(0, 400)}`);
  }
  // ---------- F2: create_arabic_twin ----------
  for (const dir of ['lf', 'crlf']) {
    const en = await write(dir, 'en', 'Rep EN');
    const p0 = await s.call('create_arabic_twin', { path: dir + '/Rep EN.pbip' }), am = (p0.j && p0.j.arabicMonth) || {};
    const pid = p0.j && p0.j.plan && p0.j.plan.planId;
    if (pid) { await s.call('approve_plan', { planId: pid }); await s.call('create_arabic_twin', { path: dir + '/Rep EN.pbip', planId: pid }); }
    const sc = scriptIn(dir, /Rep EN AR - Arabic calendar\.tmdl$/);
    chk(() => !en.err && (dir === 'lf' ? !sc && am.offered === false && /control character/i.test(am.why || '') : sc && !badLines(sc).length && !/column X = 1/.test(sc) && /control character/i.test(JSON.stringify(am.leftOut || ''))),
      () => `F2-5 (${dir}). the twin's calendar script leaves the name out and says why: ${en.err || JSON.stringify(am).slice(0, 400)} ${sc ? JSON.stringify(badLines(sc).slice(0, 3)) : 'no script'}`);
  }
  // bidi and zero-width: kept (inside the quotes), as before
  {
    const w = await write('bidi', 'ar', 'تقرير');
    const sc = scriptIn('bidi', /Arabic calendar\.tmdl$/) || '';
    chk(() => !w.err && sc && sc.includes("ref table 'Calendar‮​'") && !badLines(sc).length, () => `F2-6. a bidi or zero-width name stays in the script, quoted: ${w.err || sc.slice(0, 200)}`);
  }

  // ---------- F3: the formats script holds only what the plan lists ----------
  {
    // a plain made-up model: the report's measures and others it does not show, none with a format
    fs.mkdirSync(path.join(ROOT, 'plain/P.SemanticModel'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'plain/P.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
      { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('Date', 'dateTime')],
        measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' },
          { name: 'Total Cost', expression: 'SUM ( Sales[Cost] )' }, { name: 'Margin Ratio', expression: 'DIVIDE ( [Total Sales] - [Total Cost], [Total Sales] )' }, { name: 'Avg Cost', expression: 'AVERAGE ( Sales[Cost] )' }] }] } }));
    fs.writeFileSync(path.join(ROOT, 'plain/P.pbip'), JSON.stringify({ version: '1.0', artifacts: [] }));
    const MP = 'plain/P.SemanticModel', a = { path: MP, lang: 'en', name: 'Plain', layout: 'exec', secondPage: false, planFields: { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Total Sales]', category: 'Sales[Region]' } };
    const pl = await s.call('plan_layout', a), id = pl.j && pl.j.plan && pl.j.plan.planId;
    const listed = (((pl.j || {}).formats || {}).fields || []).filter((x) => !x.byHand).map((x) => x.object).sort();
    await s.call('approve_plan', { planId: id });
    const cr = Object.assign({}, a, { planId: id, design: pl.j && pl.j.design, fields: a.planFields }); delete cr.planFields;
    const r = await s.call('create_report', cr);
    const sc = scriptIn('plain', /fix formats\.tmdl$/) || '';
    let table = null; const objs = []; sc.split('\n').forEach((l) => { let m = l.match(/^\tref table (?:'((?:[^']|'')*)'|(\S+))$/); if (m) table = (m[1] || m[2]).replace(/''/g, "'");
      m = l.match(/^\t\t(?:column|measure) (?:'((?:[^']|'')*)'|([^\s=]+))/); if (m) objs.push(`${table}[${(m[1] || m[2]).replace(/''/g, "'")}]`); });
    objs.sort();
    chk(() => !r.err && sc && listed.length && JSON.stringify(objs) === JSON.stringify(listed), () => `F3-1. the report's formats script changes exactly the objects its plan lists: script ${JSON.stringify(objs)} vs plan ${JSON.stringify(listed)} ${r.err ? short(r) : ''}`);
    // check_model_health's own script still covers every object (its plan lists them all)
    const h = await s.call('check_model_health', { path: MP }), f = ((h.j || {}).fixes || {}).FORMATS || {};
    chk(() => !h.err && (f.fields || []).length >= objs.length && (f.fields || []).length > listed.length, () => `F3-2. check_model_health's formats list still covers the whole model: ${(f.fields || []).length} vs the report's ${listed.length}`);
  }
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }
await s.close();
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL  script-names  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  script-names  ${checks} checks`);
