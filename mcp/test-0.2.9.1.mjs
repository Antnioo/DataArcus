// 0.2.9.1: two fixes after 0.2.9 shipped to testers (19 Oct 2026), each written red first on main d76703c.
//   B-174: the laptop's Desktop proofs of rc.23 and rc.24 (Desktop 2.159, the large synthetic model, EN and the Arabic
//          twin): the plan said "Comparison: Top 5" and the Plan Group bar chart showed all 6 groups. The writer keeps a
//          chart's categories with its "Keep:" report measure (design round 10, N14): its Top N, or every category when
//          there are at most N + 2 (so 6 groups under "Top 5" are all shown, with the plain title). The plan and
//          create_report's notes now say that rule, read from what the writer writes; Desktop is unchanged.
//   D:     a column chart that the two-valued rule turns into a donut kept the bar's valueAxis { show: false }:
//          Microsoft's validator reports PBIR_FORMATTING_OBJECT_UNKNOWN (check_report: impact canBreak). Found by draft
//          PR #69's exact check (its E-23/E-24); the written donut is validated here offline, as test.mjs's G-13 does.
//   node test-0.2.9.1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { validatorErrors } from './test-validator.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++;
  if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x ? (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400)) : 'no answer');
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-0291-'));
fs.cpSync(path.join(REPO, 'mcp/test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
// (#69's E-23 model) a category whose values the writer knows are two (an IF of two texts): its column chart is a donut
fs.mkdirSync(path.join(ROOT, 'items/M.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'items/M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Items', partitions: mp('Items'), columns: [col('Amount', 'double'), col('Region', 'string'), Object.assign(col('Size Band', 'string'), { type: 'calculated', expression: 'IF ( Items[Amount] > 100, "Large", "Small" )' })],
    measures: [{ name: 'Revenue', expression: 'SUM ( Items[Amount] )', formatString: '#,0' }] }] } }));

const s = await serverClient(ROOT, {});
const ask = async (name, args) => { try { return await s.call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
// the numbers of a written "Keep:" measure: VAR _k = IF ( MIN ( _n, cap ) = cap, n, _n ): its Top n, all when at most cap - 1
const keepNumbers = (dax) => { const m = /MIN \( _n, (\d+) \) = \1, (\d+), _n \)/.exec(dax || ''); return m ? { top: +m[2], allUpTo: +m[1] - 1 } : null; };
// how many categories a Keep: measure with these numbers shows, out of M with a value (no ties)
const shown = (k, M) => (M < k.allUpTo + 1 ? M : k.top);

try {
  // ---------- B-174: the plan's Top N is what the writer keeps ----------
  for (const lang of ['en', 'ar']) {
    const pl = await ask('plan_layout', { path: 'large', focus: 'Web Orders', name: 'Top ' + lang, layout: 'exec', lang });
    const cc = pl.j && pl.j.categoryCharts, cmp = cc && cc.tops.find((x) => x.role === (lang === 'ar' ? 'مقارنة' : 'Comparison')) || cc && cc.tops[1];
    chk(() => cmp && cmp.top === 5, () => `B-174 ${lang} setup. the plan's Comparison chart is planned Top 5 (the laptop's case): ${JSON.stringify(cc || short(pl))}`);
    chk(() => cc.tops.every((x) => x.allUpTo === x.top + 2), () => `B-174 ${lang} 1. each category chart of the plan says up to how many categories it shows all (the writer's N + 2): ${JSON.stringify(cc && cc.tops)}`);
    chk(() => cc.sayInPlan.includes(cmp.role + ": Top 5, all of them when it has 7 or fewer"), () => `B-174 ${lang} 2. the plan's sentence says Comparison shows all its categories when it has 7 or fewer: ${cc && cc.sayInPlan}`);
    chk(() => !/a chart with N or fewer keeps its plain title/.test(cc.sayInPlan) && /a chart that shows all its categories keeps its plain title/.test(cc.sayInPlan), () => `B-174 ${lang} 3. the plan's title rule is the writer's (plain title when every category is shown): ${cc && cc.sayInPlan}`);
    chk(() => /all of them when it has at most N \+ 2/.test(pl.j.topCategories), () => `B-174 ${lang} 4. the general topCategories sentence names the "all when at most N + 2" rule: ${pl.j && pl.j.topCategories}`);
    if (lang !== 'en' || !pl.j || !pl.j.plan) continue;
    // the written report: the Comparison chart's Keep: measure keeps what the plan says
    await ask('approve_plan', { planId: pl.j.plan.planId });
    const made = await ask('create_report', { path: 'large', focus: 'Web Orders', name: 'Top en', planId: pl.j.plan.planId, design: pl.j.design });
    chk(() => !made.err, () => `B-174 setup. the report is written: ${short(made)}`);
    const REP = path.join(ROOT, 'large/Top en.Report'), ext = fs.existsSync(path.join(REP, 'definition/reportExtensions.json')) ? rd(path.join(REP, 'definition/reportExtensions.json')) : { entities: [] };
    const measures = ext.entities.flatMap((e) => e.measures || []);
    const visuals = tree(path.join(REP, 'definition/pages')).filter((f) => /visual\.json$/.test(f)).map(rd);
    const keeps = visuals.flatMap((v) => ((v.filterConfig || {}).filters || []).filter((f) => f.field && f.field.Measure && /^Keep: /.test(f.field.Measure.Property)).map((f) => ({ v, m: measures.find((x) => x.name === f.field.Measure.Property) })));
    const nums = keeps.map((k) => keepNumbers(k.m && k.m.expression)).filter(Boolean);
    chk(() => nums.some((k) => k.top === 5 && k.allUpTo === cmp.allUpTo), () => `B-174 5. the written Comparison chart keeps its Top 5, all when at most ${cmp && cmp.allUpTo} (its Keep: measure): ${JSON.stringify(nums)}`);
    chk(() => nums.some((k) => k.top === 5 && shown(k, 6) === 6 && shown(k, 8) === 5), () => `B-174 6. with 6 groups (the laptop's model) the written chart shows 6 and the plan says all of them; with 8 it shows 5: ${JSON.stringify(nums)}`);
    const note = ((made.j && made.j.reportNotes) || []).find((t) => /Bar and column charts by a category/.test(t)) || '';
    chk(() => /all of them when it has 7 or fewer/.test(note) && !/a Top N visual filter/.test(note), () => `B-174 7. create_report's note says the written rule (Top 5, all when 7 or fewer; a "Keep:" report measure, not a Top N filter): ${note}`);
  }

  // ---------- D: a column chart turned donut has no value axis; the validator passes it (G-13 style) ----------
  const TWO = { measure: 'Items[Revenue]', category: 'Items[Size Band]', category2: 'Items[Region]' };
  const p5 = await ask('plan_layout', { path: 'items', name: 'Two', layout: 'exec', secondPage: false, planFields: TWO });
  if (p5.j && p5.j.plan && p5.j.plan.planId) { await ask('approve_plan', { planId: p5.j.plan.planId }); }
  const m5 = await ask('create_report', { path: 'items', name: 'Two', design: p5.j && p5.j.design, secondPage: false, fields: TWO, planId: p5.j && p5.j.plan && p5.j.plan.planId });
  chk(() => !m5.err, () => `D setup. the report whose chart becomes a donut is written: ${short(m5)}`);
  const donuts = tree(path.join(ROOT, 'items/Two.Report')).filter((f) => /visual\.json$/.test(f)).map(rd).filter((j) => j.visual && j.visual.visualType === 'donutChart');
  chk(() => donuts.length && donuts.every((j) => !((j.visual.objects || {}).valueAxis)), () => `D-1 (#69's E-24) the written donuts have no valueAxis: ${donuts.map((j) => Object.keys(j.visual.objects || {}).join('+')).join(', ') || 'no donut written'}`);
  const errs = validatorErrors(path.join(ROOT, 'items/Two.Report'));
  chk(() => String(errs) === '0', () => `D-2 (#69's E-23, as G-13) Microsoft's validator offline: 0 errors on the report with the donut: ${errs}`);
} finally {
  await s.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}
console.log(problems.length ? `FAIL  0291  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  0291  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
