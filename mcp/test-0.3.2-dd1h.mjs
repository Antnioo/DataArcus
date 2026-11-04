// 0.3.2 DD1H (mcp/work/DD1H.md): one answer to "which column sorts this month or day name?". The report writer
// (assets/js/field-catalog.js sortColumnFor, through pbip-bind.js) and the Model Health Check's fix script
// (assets/js/model-health-tmdl.js sortColumnFor) both read the one rule, assets/js/sort-column.js. In process, made-up
// column sets only (names and types, never data).
//   P1-P14  fourteen made-up column sets: the two callers agree, and agree with the expected answer
//   F1-F2   the health check's fix script on a made-up model whose month number has no dataType: sorted by it, no column added
//   S1-S5   one place: neither caller holds a copy of the rule; both require sort-column.js; both pages load it first
//   node test-0.3.2-dd1h.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const Rule = require('../assets/js/sort-column.js');
const Bind = require('../assets/js/pbip-bind.js');
const Health = require('../assets/js/model-health-tmdl.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

// a column: a name, and a dataType when given (none: the files give no type)
const C = (name, dataType, more) => Object.assign({ name }, dataType ? { dataType } : {}, more || {});
const CASES = [
  ['P1 Month Name, Month Number with no dataType', 'Month Name', [C('Month Name', 'string'), C('Month Number')], 'Month Number'],
  ['P2 Day Name (Arabic), Day of Week Number int64', 'Day Name (Arabic)', [C('Day Name (Arabic)', 'string'), C('Day of Week Number', 'int64')], 'Day of Week Number'],
  ['P3 Month Name (Arabic), Month Number int64', 'Month Name (Arabic)', [C('Month Name (Arabic)', 'string'), C('Month Number', 'int64')], 'Month Number'],
  ['P4 Month Name (عربي), no types at all', 'Month Name (عربي)', [C('Month Name (عربي)'), C('Month Number')], 'Month Number'],
  ['P5 Hijri Month Name, both month numbers', 'Hijri Month Name', [C('Month Number', 'int64'), C('Hijri Month Number', 'int64')], 'Hijri Month Number'],
  ['P6 Hijri Month Name, only the Gregorian number', 'Hijri Month Name', [C('Month Number', 'int64')], null],
  ['P7 Fiscal Month Name, Fiscal Month No with no dataType', 'Fiscal Month Name', [C('Month No', 'int64'), C('Fiscal Month No')], 'Fiscal Month No'],
  ['P8 Month Year, Year Month Number with no dataType', 'Month Year', [C('Month Year', 'string'), C('Year Month', 'string'), C('Year Month Number')], 'Year Month Number'],
  ['P9 Month Name, "Month" with no dataType (may be text)', 'Month Name', [C('Month')], null],
  ['P10 Month Name, Month Number as text', 'Month Name', [C('Month Number', 'string')], null],
  ['P11 اسم الشهر, رقم الشهر with no dataType', 'اسم الشهر', [C('اسم الشهر', 'string'), C('رقم الشهر')], 'رقم الشهر'],
  ['P12 Month Name, a DAX table column with no dataType', 'Month Name', [C('Month Number', null, { type: 'calculatedTableColumn' })], 'Month Number'],
  ['P13 Sales (not a name to sort)', 'Sales', [C('Month Number', 'int64')], null],
  ['P14 Month Name, no column list at all', 'Month Name', null, null]
];
for (const [id, name, cols, want] of CASES) {
  const ans = (f) => { try { const c = f(cols, name); return c ? c.name : null; } catch (e) { return 'throws ' + e.name; } };
  const w = ans(Bind.sortColumnFor), h = ans(Health.sortColumnFor), r = ans(Rule.sortColumnFor);
  chk(() => w === h, () => `${id}: the report writer says ${JSON.stringify(w)}, the health check ${JSON.stringify(h)}`);
  chk(() => w === want && r === want, () => `${id}: expected ${JSON.stringify(want)}; writer ${JSON.stringify(w)}, rule ${JSON.stringify(r)}`);
}

// the health check's fix script on a made-up model: a month name whose number column has no dataType
const model = [{ name: 'Calendar', columns: [C('Date', 'dateTime', { sourceColumn: 'Date' }), C('Month Name', 'string', { sourceColumn: 'Month Name' }), C('Month Number', null, { sourceColumn: 'Month Number' })] }];
const s = Health.sortFixes(model, [{ table: 'Calendar', column: 'Month Name' }], {});
chk(() => s.sorts.length === 1 && s.sorts[0].by === 'Calendar[Month Number]' && s.sorts[0].added === false, () => `F1 the fix script must sort Calendar[Month Name] by the model's Month Number, adding none: ${JSON.stringify(s.sorts)}`);
chk(() => /sortByColumn: 'Month Number'/.test(s.script || '') && !/Month Number 2/.test(s.script || ''), () => `F2 the script text: ${String(s.script).slice(0, 300)}`);

// one place: no copy of the rule left in either caller
const read = (f) => fs.readFileSync(path.join(REPO, f), 'utf8');
const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const COPY = /const (NAME_LIKE|SORT_BY|FAMILY|ARABIC_SUFFIX) =|const sortKind = \(|const family = \(|function sortColumnFor\s*\(/;
for (const f of ['assets/js/field-catalog.js', 'assets/js/model-health-tmdl.js']) {
  const src = code(read(f));
  chk(() => !COPY.test(src) && /require\('\.\/sort-column\.js'\)/.test(src) && /root\.DASortColumn/.test(src), () => `S ${f} must read sort-column.js and hold no copy of the rule (${(src.match(COPY) || [])[0]})`);
}
const tg = read('assets/js/theme-generator.js'), at = (f) => tg.indexOf('/assets/js/' + f + '.min.js?v=');
chk(() => at('sort-column') > 0 && at('sort-column') < at('field-catalog') && tg.split('/assets/js/sort-column.min.js?v=').length === 2, () => 'S theme-generator.js must load sort-column.min.js once, before field-catalog.min.js');
for (const page of ['tools/power-bi-model-health-check.html', 'ar/tools/power-bi-model-health-check.html']) {
  const h = read(page), i = h.indexOf('sort-column.min.js?v='), j = h.indexOf('model-health-tmdl.min.js?v=');
  chk(() => i > 0 && i < j, () => `S ${page} must load sort-column.min.js before model-health-tmdl.min.js`);
}

if (problems.length) { console.log(`FAIL script=test-0.3.2-dd1h.mjs cause=${problems[0]}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd1h  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd1h  ${checks} checks`);
