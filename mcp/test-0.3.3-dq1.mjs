// DQ1 (0.3.3; the owner D-1104-12 "we fix it at the source", D-1110-04; night audit AUD-061/AUD-060/AUD-064).
//   D1-D5  B-437: a DAX name 'Table'[Column] is quoted in ONE place (assets/js/pbip-query.js daxNames, which refuses a
//          control character, AUD-032); the mcp/lib places that wrote it by hand call it: same text for a name with a
//          quote or a bracket, the refusal for a control character, and no hand-written quoting left
// Made-up names only.   node test-0.3.3-dq1.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolveSvgColumns } from './lib/report-fields.mjs';
import { titleProblems } from './lib/metric-switcher.mjs';
import { functionLines } from './lib/model-script.mjs';
import { fieldKeyOf, sheetOf, placesOf } from './lib/terminology.mjs';
import { cultureScript } from './lib/model-culture.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const read = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) problems.push(msg + err); };

const { daxNames } = require('../assets/js/pbip-query.js');
const TAB = 'A\tB';
// ---- D1-D2: report-fields, an SVG column's column value ----
const model = (tn, cn) => [{ name: tn, columns: [{ name: cn, dataType: 'string' }, { name: 'Amount', dataType: 'double' }], measures: [{ name: 'Total', expression: 'SUM(1)' }] }];
const design = (tn, cn) => ({ layers: [{ type: 'text', text: 'x', x: 0, y: 0, bind: { text: 'c' } }], values: [{ id: 'c', kind: 'column', column: `${tn}[${cn}]` }] });
const svg = (tn, cn) => resolveSvgColumns(model(tn, cn), [{ label: 'L', design: design(tn, cn) }], { what: 'svgColumns' });
chk(() => svg("O'Brien", 'A]B')[0].expression.includes("'O''Brien'[A]]B]"), "D1 report-fields: a table with a quote and a column with a bracket are quoted as 'O''Brien'[A]]B]");
chk(() => { try { svg(TAB, 'X'); } catch (e) { return /control character/.test(e.message) && !/threw/.test(e.message); } return false; }, 'D2 report-fields: a table name with a control character is refused by the shared quoter');
// ---- D3: the metric switcher's title check reads the same quoted name; a control-character name is skipped, not thrown ----
const param = (tn, dn) => ({ name: tn, columns: [{ name: 'Fields', extendedProperties: [{ name: 'ParameterMetadata', value: { kind: 2 } }] }, { name: dn, relatedColumnDetails: { groupByColumns: [{ groupingColumn: 'Fields' }] } }], measures: [{ name: 'Title', expression: `SELECTEDVALUE ( '${tn.replace(/'/g, "''")}'[${dn.replace(/]/g, ']]')}] )` }] });
chk(() => titleProblems({ tables: [param("O'Br", 'Name]x')] }).problems.length === 1, "D3 metric-switcher: a measure naming 'O''Br'[Name]]x] is found");
chk(() => titleProblems({ tables: [Object.assign(param('P', 'Name'), { measures: [{ name: 'M', expression: "SELECTEDVALUE ( 'P'[Name] )" }] })] }).problems.length === 1, 'D3b metric-switcher: a plain name is found as before');
chk(() => titleProblems({ tables: [param(TAB, 'Name')] }).problems.length === 0, 'D3c metric-switcher: a table name with a control character is skipped (nothing throws)');
// ---- D4: the quoter itself ----
chk(() => daxNames.column("O'Brien", 'A]B') === "'O''Brien'[A]]B]", "D4 daxNames.column quotes a quote and a bracket");
chk(() => { try { daxNames.column('T', TAB); } catch (e) { return /control character/.test(e.message); } return false; }, 'D4b daxNames refuses a control character');
// ---- D5: one job, one place: no hand-written 'Table'[Column] quoting left in the mcp/lib files that had it ----
for (const f of ['mcp/lib/report-fields.mjs', 'mcp/lib/twin-model.mjs', 'mcp/lib/metric-switcher.mjs']) {
  const s = read(f);
  chk(() => !/"'\[" \+|replace\(\/\\?\]\/g, '\]\]'\)/.test(s), `D5 ${f}: no hand-written bracket quoting`);
  chk(() => !/tq = `\(\?:'\$\{esc/.test(s), `D5 ${f}: no hand-written table quoting in a regex`);
  chk(() => /daxNames/.test(s), `D5 ${f}: reads daxNames`);
}

// ---- D6 (B-438): functionLines writes its name with tmdl-name.js, the one TMDL name rule ----
const { tmdlName } = require('../assets/js/tmdl-name.js');
// the 9 probe names of family tmdl-name's kind, plus a dotted function name and a hyphenated one
const NAMES = ['Sales', 'Sales Data', 'Sales-2024', "O'Brien", 'Local.Fn', '2024', '_x', 'ي', '', 'a b-c'];
for (const n of NAMES) chk(() => functionLines({ name: n, expression: '1' }, 1).find((l) => l.includes('function ')).trim() === 'function ' + tmdlName(n) + ' =', `D6 functionLines name ${JSON.stringify(n)} is tmdlName's`);
// drift: the rule moves in tmdl-name.js only; functionLines must follow it (no copy of the rule in model-script.mjs)
chk(() => !/A-Za-z_\]\[A-Za-z0-9_\]\*/.test(read('mcp/lib/model-script.mjs')), 'D6 model-script.mjs keeps no TMDL name rule of its own');
chk(() => /tmdl-name\.js/.test(read('mcp/lib/model-script.mjs')), 'D6 model-script.mjs reads tmdl-name.js');

// ---- D7-D9 (B-434): the twin keys a field by its (table, field) pair ----
const field = (e, p) => ({ Column: { Expression: { SourceRef: { Entity: e } }, Property: p } });
const K1 = fieldKeyOf(field('A', 'B][C')), K2 = fieldKeyOf(field('A[B]', 'C'));
chk(() => K1 && K2 && K1 !== K2, `D7 table A column "B][C" and table "A[B]" column C get two keys (${K1} and ${K2})`);
chk(() => fieldKeyOf(field('Sales', 'Amount')) === 'Sales[Amount]' && fieldKeyOf(field('Sales Data', 'Net [x]')) === 'Sales Data[Net [x]]]', 'D7b a normal name keeps its key text (Sales[Amount])');
chk(() => fieldKeyOf({ Measure: { Expression: { SourceRef: { Entity: 'A' } }, Property: 'M' } }) === 'A[M]' && fieldKeyOf({ Aggregation: { Function: 0, Expression: field('A', 'B') } }) === 'A[B]', 'D7c a measure and an aggregated column key the same way');
// two approval lines: the sheet gives each of the two fields its own row, one approved and one not
chk(() => { const rows = sheetOf([K1, K2], new Map([[K1, { ar: 'اسم', status: 'approved' }]]), null); return rows.length === 2 && rows[0].field !== rows[1].field && rows[0].status === 'approved' && rows[1].status === 'kept'; }, 'D8 the terminology sheet has two rows and one approval line for each field');
chk(() => { const rows = sheetOf([K2], new Map(), null); return rows[0].en === 'C'; }, 'D8b the English name of the table-with-brackets field is its column C');
chk(() => { const rows = sheetOf([K1], new Map(), null); return rows[0].en === 'B][C'; }, 'D8c the English name of the column B][C is B][C');
// the culture script writes the one caption to the one field
const raw = { model: { name: 'M', culture: 'en-US', tables: [{ name: 'A', columns: [{ name: 'B][C', dataType: 'string' }] }, { name: 'A[B]', columns: [{ name: 'C', dataType: 'string' }] }] } };
chk(() => { const r = cultureScript(raw, new Map([[K1, { ar: 'الأول', status: 'approved', given: true }]]), ['ar-AE']); return r.covered.length === 1 && /الأول/.test(r.text) && r.english.some((e) => /C/.test(e.field)) && !/'A\[B\]'\s*\n\s*column C\s*\n\s*caption/.test(r.text); }, 'D9 the culture script gives the caption to table A only');

if (problems.length) { console.log(`FAIL script=test-0.3.3-dq1.mjs cause=${problems[0].slice(0, 300)}`); for (const p of problems) console.log('  - ' + p); console.log(`FAIL  dq1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dq1  ${checks} checks`);
