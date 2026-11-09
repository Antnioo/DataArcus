import './test-env.mjs';
// 0.3.2 PF3 (B-384, FN1E's "Seen, not in scope"): check_report's fieldParameters.parameters list (and its note naming every
// missing table) was the one list the cut loop never cut: 700 field parameter tables the model does not have answered
// 72,285 characters, over the tools' 40,000. Now the list and the note are capped like suspiciousNames (the first items,
// "more" says how many are left out) and the cut loop may cut the list too.
//   C1  700 tables not in the model: the answer is under 40,000 characters, the list is cut and "more" counts the rest
//   C2  the note names a few tables and says how many more; the answer does not carry "truncated" because of this list
//   C3  a few tables (3): the list, the note and the answer have no "more" and name every table, as before
// Made-up data only (fixtures/twin-project in a temporary folder).   node test-0.3.2-pf3.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-pf3-')));
process.env.DATAARCUS_ROOT = ROOT;
const CR = await import('./lib/check-report.mjs');
const { ANSWER_MAX } = await import('./lib/answer.mjs');

const RP = 'Twin Sales.Report';
const mref = (t, m) => ({ expr: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } } });
const fpVisual = (name, tables) => ({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json', name, position: { x: 10, y: 10, z: 100, height: 60, width: 200, tabOrder: 100 },
  visual: { visualType: 'clusteredColumnChart', query: { queryState: { Y: { projections: [{ field: mref('Sales', 'Total Sales').expr }], fieldParameters: tables.map((t) => ({ parameterExpr: { Column: { Expression: { SourceRef: { Entity: t } }, Property: t } }, index: 0, length: 1 })) } } } } });
const make = (dir, n) => {
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(ROOT, dir), { recursive: true });
  const f = path.join(ROOT, dir, RP, 'definition/pages/p1overview/visuals/fpMany/visual.json');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(fpVisual('fpMany', Array.from({ length: n }, (_, i) => 'Parameter table ' + String(i).padStart(4, '0'))), null, 2) + '\n');
  return dir + '/' + RP;
};

const big = await CR.checkReport(make('big', 700), { maxFindings: 200 });
const bigText = JSON.stringify(big), fp = big.fieldParameters || {};
chk(() => bigText.length < ANSWER_MAX, () => `C1. 700 tables: the answer is ${bigText.length} characters, over ${ANSWER_MAX}`);
chk(() => Array.isArray(fp.parameters) && fp.parameters.length < 700 && fp.parameters.length >= 1, () => `C1. the parameters list holds ${fp.parameters && fp.parameters.length} of 700`);
chk(() => fp.more === 700 - fp.parameters.length, () => `C1. more is ${fp.more}, expected ${700 - (fp.parameters && fp.parameters.length)}`);
chk(() => /and \d+ more/.test(fp.note || '') && (fp.note || '').length < 2000, () => `C2. the note (${(fp.note || '').length} characters) does not say "and N more"`);
chk(() => !big.truncated, () => 'C2. the answer carries truncated: the findings were cut as well');

const small = await CR.checkReport(make('small', 3), {});
const sp = small.fieldParameters || {};
chk(() => sp.parameters && sp.parameters.length === 3 && !('more' in sp), () => 'C3. 3 tables: the list is whole and has no more');
chk(() => [0, 1, 2].every((i) => (sp.note || '').includes('Parameter table 000' + i)) && !/and \d+ more/.test(sp.note || ''), () => 'C3. 3 tables: the note names every table');

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-pf3.mjs cause=${problems[0].slice(0, 300)}`); problems.slice(0, 20).forEach((p) => console.log('  - ' + p.slice(0, 400))); console.log(`FAIL  pf3  ${problems.length} of ${checks} checks failed`); process.exit(1); }
console.log(`PASS  pf3  ${checks} checks`);
