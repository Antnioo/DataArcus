// 0.3.3 HX1 (mcp/work/HX1.md): the number's lineage shown on "Souq", a made-up model and report (fixtures/hx1-souq.mjs).
// It prints what lib/lineage.mjs says about three edits of the MODEL, beside what the number check (check_report's
// `against`, lib/same-question.mjs) says today about the same edits. A demo, not a tool and not a test: nothing of a
// person's is read; the report is written to a temporary folder only so that same-question can read it, and removed.
//   node lab/lineage-demo.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { souqModel, souqReport, measureOf, tableOf } from '../fixtures/hx1-souq.mjs';

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-lineage-demo-')));
process.env.DATAARCUS_ROOT = ROOT;
const { lineageOf, compareLineage, reachOf } = await import('../lib/lineage.mjs');
const { sameQuestion } = await import('../lib/same-question.mjs');

const put = (f, x) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(x, null, 2) + '\n'); };
const writeReport = (name) => { const dir = path.join(ROOT, name + '.Report'); souqReport().files.forEach((f) => put(path.join(dir, f.path), f.json));
  put(path.join(dir, 'definition.pbir'), { version: '4.0', datasetReference: { byPath: { path: '../Souq.SemanticModel' } } });
  put(path.join(dir, 'definition', 'pages', 'pages.json'), { pageOrder: ['overview', 'details'], activePageName: 'overview' }); return dir; };
const writeModel = (m) => put(path.join(ROOT, 'Souq.SemanticModel', 'model.bim'), m);
const line = (s) => console.log(s);
const show = (c) => { line('  lineage: ' + c.said); c.differ.forEach((d) => line(`    - ${d.page} / ${d.visual} (${d.tier}): ` + d.why.map((w) => (w.name ? `${w.name} ${w.what}` : w.what) + (w.through ? `, reached through ${w.through.join(' > ')}` : '')).join('; '))); };

try {
  writeModel(souqModel());
  const original = writeReport('Souq'), copy = writeReport('Souq copy');
  const base = lineageOf(souqModel(), souqReport());
  line(`Souq (made up): ${base.visuals.length} visuals, ${base.visuals.filter((v) => v.prints).length} with a query.`);
  const edits = [
    ['1. [Returns Value]\'s DAX is edited (SUM becomes SUMX)', (m) => { measureOf(m, 'Returns Value').expression = 'SUMX ( Returns, Returns[Amount] )'; }],
    ['2. The relationship Returns to Store is removed', (m) => { m.model.relationships = m.model.relationships.filter((r) => r.name !== 'Returns-Store'); }],
    ['3. A new measure nobody shows is added, and [Headcount] is edited', (m) => { tableOf(m, '_Measures').measures.push({ name: 'Bonus', expression: '[Revenue] * 0.01' }); measureOf(m, 'Headcount').expression = 'DISTINCTCOUNT ( Staff[StaffKey] )'; }]
  ];
  for (const [title, edit] of edits) {
    const m = souqModel(); edit(m); writeModel(m);
    line(''); line(title);
    line('  the number check today (the report\'s files only): ' + sameQuestion(copy, original).said);
    show(compareLineage(base, lineageOf(m, souqReport())));
  }
  line(''); line('Before an edit: what does a name reach?');
  for (const what of [{ measure: 'Returns Value' }, { table: 'Sales', column: 'Cost' }, { measure: 'Headcount' }]) {
    const r = reachOf(base, what);
    line(`  ${r.name}: ${r.count} visual${r.count === 1 ? '' : 's'} on ${r.pages} page${r.pages === 1 ? '' : 's'}` + (r.count ? ' (' + r.visuals.map((v) => v.visual).join(', ') + ')' : ''));
  }
} finally { fs.rmSync(ROOT, { recursive: true, force: true }); }
