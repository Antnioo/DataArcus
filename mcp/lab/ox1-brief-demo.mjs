// 0.3.3 OX1 (mcp/work/OX1.md): the brief check shown on "Souq", a made-up model and report (fixtures/hx1-souq.mjs),
// with three visuals an assistant could add that validate, draw, and ask what the model cannot answer. It prints what
// lib/brief.mjs says about the report's visuals and about seven questions (two asked in Arabic). A demo, not a tool
// and not a test: everything is in memory, nothing is read or written.   node lab/ox1-brief-demo.mjs
import { souqModel, souqReport, colRef, msrRef } from '../fixtures/hx1-souq.mjs';
import { checkVisuals, checkBrief } from '../lib/brief.mjs';

const visual = (name, visualType, roles) => ({ path: `definition/pages/ai/visuals/${name}/visual.json`,
  json: { name, position: { x: 0, y: 0, z: 0, width: 300, height: 200 }, visual: { visualType, query: { queryState: Object.fromEntries(Object.entries(roles).map(([r, l]) => [r, { projections: l }])) } } } });
const report = souqReport();
report.files.push({ path: 'definition/pages/ai/page.json', json: { name: 'ai', displayName: 'AI page', width: 1280, height: 720 } },
  visual('bar-target-by-region', 'clusteredBarChart', { Category: [colRef('Store', 'Region')], Y: [msrRef('Target')] }),
  visual('table-staff-revenue', 'tableEx', { Values: [colRef('Staff', 'Name'), msrRef('Revenue'), msrRef('Headcount')] }),
  visual('column-headcount-by-category', 'clusteredColumnChart', { Category: [colRef('Product', 'Category')], Y: [msrRef('Headcount')] }));

const by = (table, column) => ({ table, column });
// the text is the person's own; the tie to a measure and its columns is proposed by the assistant and confirmed by them
const questions = [
  { id: 'q1', text: 'Revenue by month', measure: 'Revenue', by: [by('Calendar', 'Month')] },
  { id: 'q2', text: 'صافي الإيراد حسب المنطقة', measure: 'Net Revenue', by: [by('Store', 'Region')] },
  { id: 'q3', text: 'الهدف حسب المنطقة', measure: 'Target', by: [by('Store', 'Region')] },
  { id: 'q4', text: 'Margin by brand', measure: 'Margin', by: [by('Product', 'Brand')] },
  { id: 'q5', text: 'Units by city', measure: 'Units', by: [by('Store', 'City')] },
  { id: 'q6', text: 'Net Sales by month', measure: 'Net Sales', by: [by('Calendar', 'Month')] },
  { id: 'q7', text: 'Total revenue', measure: 'Revenue', by: [] }
];
const line = (s) => console.log(s);
const where = (l) => l.map((v) => `${v.page} / ${v.visual}`).join(', ');

const c = checkVisuals(souqModel(), report);
line(`Souq (made up) with an assistant's page: ${c.visuals} visuals, ${c.withNumbers} with a number.`);
line('1. The visuals: ' + c.said);
c.findings.forEach((f) => line(`   - ${f.page} / ${f.visual}: ${f.why}`));
const b = checkBrief(souqModel(), report, questions);
line(''); line('2. The questions: ' + b.said);
b.results.forEach((r) => {
  const text = questions.find((x) => x.id === r.id).text;
  line(`   ${r.id}  ${text}  (${r.measure}${r.by.length ? ' by ' + r.by.join(', ') : ', a total'}): ${r.status.toUpperCase()}`
    + (r.answeredBy.length ? ' by ' + where(r.answeredBy) : '') + (r.why ? '. ' + r.why : '') + (r.shownBy.length ? ' Shown ' + (r.status === 'partly' ? 'otherwise' : 'anyway') + ' by ' + where(r.shownBy) + '.' : ''));
});
line(''); line('What this proves: ' + b.proves); line('What it does not: ' + b.notProved);
