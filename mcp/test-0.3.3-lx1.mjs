import './test-env.mjs';
// 0.3.3 LX1 (the owner, 11 Nov, D-1111-17; D-1104-12 one job, one place; mcp/work/LX1.md): the builders' "Seen, not in
// scope" items made one, behaviour unchanged except where said.
//   R1-R4  (item 13, AUD-069) a one-to-one relationship filters both ways (Microsoft Learn, "Model relationships in Power
//          BI Desktop", Cross filter direction), whatever its crossFilteringBehavior says: one rule in
//          assets/js/relationship-filter.js, read by lineage.mjs (and brief.mjs through its graph) and field-catalog.js.
//          On a made-up Souq with Store to Bridge one-to-one (no bothDirections) and Targets to Bridge many-to-one:
//          check_report's briefCheck through the real server, lineageOf + compareLineage, the picker's reach.
// Made up, in os.tmpdir(), from fixtures/hx1-souq.mjs: no model rows.   node test-0.3.3-lx1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { souqModel, souqReport, tableOf, colRef, msrRef, visual } from './fixtures/hx1-souq.mjs';
import { project as writeProject } from './fixtures/souq-project.mjs';
import { gulfModel, gulfReport } from './fixtures/ix1-souq-gulf.mjs';
import { measureOf } from './fixtures/hx1-souq.mjs';

const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-lx1-')));
process.env.DATAARCUS_ROOT = ROOT;
const { serverClient } = await import('./test-0.2.9.mjs');
const LN = await import('./lib/lineage.mjs');
const Cat = require('../assets/js/field-catalog.js');
const J = (x) => JSON.stringify(x);

// ---- item 13: Souq with a Bridge. one: Store to Bridge is one-to-one (no crossFilteringBehavior); else many-to-one ----
const BRIDGE = 'Store-Bridge';
function bridged(kind) {
  const m = souqModel();
  m.model.tables.push({ name: 'Bridge', partitions: [{ name: 'Bridge', mode: 'import', source: { type: 'm', expression: 'let Source = #table(type table [StoreKey = Int64.Type], {}) in Source' } }], columns: [{ name: 'StoreKey', dataType: 'int64', sourceColumn: 'StoreKey' }] });
  tableOf(m, 'Targets').columns.push({ name: 'StoreKey', dataType: 'int64', sourceColumn: 'StoreKey' });
  m.model.relationships.push({ name: 'Targets-Bridge', fromTable: 'Targets', fromColumn: 'StoreKey', toTable: 'Bridge', toColumn: 'StoreKey' });
  m.model.relationships.push(Object.assign({ name: BRIDGE, fromTable: 'Store', fromColumn: 'StoreKey', toTable: 'Bridge', toColumn: 'StoreKey' },
    kind === 'one' ? { fromCardinality: 'one', toCardinality: 'one' } : kind === 'both' ? { crossFilteringBehavior: 'bothDirections' } : {}));
  return m;
}
const TARGET_BY_REGION = 'bar-target-by-region';
const withTarget = () => { const r = souqReport(); r.files.push(visual('overview', TARGET_BY_REGION, 'clusteredBarChart', { Category: [colRef('Store', 'Region')], Y: [msrRef('Target')] })); return r; };
const off = (m) => { m.model.relationships.find((r) => r.name === BRIDGE).isActive = false; return m; };

const s = await serverClient(ROOT, {});
try {
  // R1: through the real server, check_report's briefCheck
  const bc = async (kind) => { const P = writeProject(ROOT, 'lx1-' + kind, bridged(kind), withTarget()); const r = await s.call('check_report', { path: P.report }); return { r, x: r.j && r.j.briefCheck }; };
  const findsTarget = (x) => !!x && x.visuals.findings.some((f) => f.visual === TARGET_BY_REGION);
  { const { r, x } = await bc('one');
    chk(() => x && !findsTarget(x) && x.visuals.oneValue === 0, () => `R1 a one-to-one Store to Bridge without bothDirections filters both ways: "Target by Region" moves, no "one value on every row": ${J(x && x.visuals).slice(0, 500) || String(r.t).slice(0, 300)}`); }
  { const { x } = await bc('many');
    chk(() => x && findsTarget(x) && x.visuals.oneValue === 1, () => `R1b the control: Store to Bridge many-to-one, one direction: Region cannot move [Target], one finding: ${J(x && x.visuals).slice(0, 500)}`); }
  { const { x } = await bc('both');
    chk(() => x && !findsTarget(x), () => `R1c many-to-one with bothDirections: moves, as before: ${J(x && x.visuals).slice(0, 400)}`); }

  // R2: lineage, the Impact check's reading: the one-to-one turned off changes what Target by Region can show
  { const c = LN.compareLineage(LN.lineageOf(bridged('one'), withTarget()), LN.lineageOf(off(bridged('one')), withTarget())), d = c.differ.find((v) => v.visual === TARGET_BY_REGION);
    chk(() => d && d.tier === 'question' && J(d.why).includes('Bridge'), () => `R2 the one-to-one turned off: "Target by Region" can show other numbers, the relationship named: ${J(c.differ).slice(0, 500)} / ${c.said}`); }
  { const c = LN.compareLineage(LN.lineageOf(bridged('many'), withTarget()), LN.lineageOf(off(bridged('many')), withTarget()));
    chk(() => !c.differ.some((v) => v.visual === TARGET_BY_REGION), () => `R2b the control (many-to-one, one direction, a filter on Store never reaches Targets through it): unchanged: ${J(c.differ).slice(0, 400)}`); }

  // R3: the website's picker and suggest_fields (field-catalog.js): the one-to-one filters both ways
  { const rels = Cat.relsOfTmsl(bridged('one')), b = rels.find((r) => r.fromTable === 'Store' && r.toTable === 'Bridge');
    chk(() => b && b.both === true, () => `R3 relsOfTmsl: Store to Bridge one-to-one is both ways: ${J(b)}`);
    chk(() => !rels.find((r) => r.fromTable === 'Targets').both && !Cat.relsOfTmsl(bridged('many')).find((r) => r.fromTable === 'Store' && r.toTable === 'Bridge').both, () => 'R3b many-to-one without bothDirections stays one way'); }
  // R3c the health engine's answer (fromCard, toCard, cross) gives the same
  { const b = Cat.relsOfTmsl({ relationships: [{ fromTable: 'A', toTable: 'B', fromCard: 'one', toCard: 'one', cross: 'oneDirection', active: true }] })[0];
    chk(() => b && b.both === true, () => `R3c relsOfTmsl on the health engine's shape: one-to-one both ways: ${J(b)}`); }

  // R4: one rule in one place: relationship-filter.js filtersBoth, and no caller decides from crossFilteringBehavior alone
  { let RF = null; try { RF = require('../assets/js/relationship-filter.js'); } catch (e) { RF = null; }
    const cases = [[{ crossFilteringBehavior: 'bothDirections' }, true], [{ fromCardinality: 'one', toCardinality: 'one' }, true], [{ fromCardinality: 'one' }, true], [{}, false],
      [{ fromCardinality: 'many', toCardinality: 'many' }, false], [{ cross: 'bothDirections' }, true], [{ fromCard: 'one', toCard: 'one', cross: 'oneDirection' }, true], [{ fromCard: 'many', toCard: 'one' }, false], [{ crossFilteringBehavior: 'BothDirections' }, true]];
    chk(() => RF && typeof RF.filtersBoth === 'function' && cases.every(([r, w]) => RF.filtersBoth(r) === w), () => `R4 relationship-filter.js filtersBoth answers each case: ${RF ? J(cases.map(([r]) => RF.filtersBoth(r))) : 'not there'}`);
    const src = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
    chk(() => !/bothDirections/.test(src('mcp/lib/lineage.mjs')) && !/bothDirections/.test(src('mcp/lib/brief.mjs').replace(/\/\/.*$/gm, '')) && !/bothDirections/.test(src('assets/js/field-catalog.js').replace(/\/\/.*$/gm, '')),
      () => 'R4b lineage.mjs, brief.mjs and field-catalog.js read the direction through filtersBoth, never bothDirections themselves'); }
  // ---- item 8 (HX1 "Seen"): collectReportRefs keeps Schema "extension"; a report measure and a model measure of one name ----
  { const r = souqReport(), ext = (name) => ({ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: '_Measures' } }, Property: name } }, queryRef: `_Measures.${name}`, nativeQueryRef: name });
    r.files.push(visual('overview', 'card-report-revenue', 'card', { Values: [ext('Revenue')] }));
    r.files.push({ path: 'definition/reportExtensions.json', json: { entities: [{ name: '_Measures', measures: [{ name: 'Revenue', expression: 'SUM ( Targets[Target] )' }] }] } });
    const lin = LN.lineageOf(souqModel(), r), keys = (v) => Object.keys(((lin.visuals.find((y) => y.visual === v) || {}).nodes) || {});
    chk(() => keys('card-report-revenue').includes('x:revenue') && keys('card-report-revenue').some((k) => /^c:targets\|/.test(k)) && !keys('card-report-revenue').includes('m:revenue'),
      () => `L8 a visual on the report's own [Revenue] (Schema "extension") reads the report measure, not the model's of the same name: ${J(keys('card-report-revenue'))}`);
    chk(() => keys('card-revenue').includes('m:revenue') && !keys('card-revenue').includes('x:revenue'), () => `L8b the model's [Revenue] on another card stays the model's: ${J(keys('card-revenue'))}`);
    const acc = []; require('../assets/js/dax-reference-parser.js').collectReportRefs([ext('Revenue'), msrRef('Revenue')], acc, {});
    chk(() => J(acc) === J([{ kind: 'Measure', entity: '_Measures', prop: 'Revenue', schema: 'extension' }, { kind: 'Measure', entity: '_Measures', prop: 'Revenue' }]), () => `L8c collectReportRefs keeps schema "extension" (and adds no key otherwise): ${J(acc)}`); }
  // ---- item 10 (SN1's open item, TL1 "Seen"): unknownKeys names the input that exists, plan_layout's planFields ----
  { const RI = await import('./lib/report-inputs.mjs'), u = RI.unknownKeys({ fields: { kpis: [] } }), p = await s.call('plan_layout', { design: { fields: {} } });
    chk(() => u && /plan_layout's own "planFields" input/.test(u.why) && !/create_report's own "fields"/.test(u.why), () => `L10 unknownKeys' sentence names plan_layout's planFields, not create_report's old "fields": ${u && u.why}`);
    chk(() => /plan_layout's own \\?"planFields\\?" input/.test(p.t) && !/create_report's own/.test(p.t), () => `L10b plan_layout's answer through the server says it too: ${String(p.t).slice(0, 400)}`); }
  // ---- item 11: the PL1 Arabic the owner approved on 5 Nov (D-1105-16) is no longer called a draft ----
  { const t = fs.readFileSync(new URL('./lib/approval-ar.mjs', import.meta.url), 'utf8'), line = t.split('\n').find((l) => /0\.3\.2 PL1/.test(l)) || '';
    chk(() => !/DRAFT/.test(line) && /approved/.test(line) && /D-1105-16/.test(line), () => `L11 approval-ar.mjs's PL1 comment says approved, with the decision id: ${line.trim()}`); }
  // ---- item 12: LR3.md has one "## For the owner" heading (a wrapped plan line started with it) ----
  { const lines = fs.readFileSync(new URL('./work/LR3.md', import.meta.url), 'utf8').split('\n').filter((l) => /^#+ .*For the owner/.test(l));
    chk(() => lines.length === 1 && lines[0] === '## For the owner', () => `L12 mcp/work/LR3.md: one heading with "For the owner", the real one: ${J(lines)}`); }
  // ---- item 9 (IX2 "Seen" 2): a base measure's name in measures and comparisons: whole to 200 characters, as lacking ----
  { const LF = await import('./lib/like-for-like.mjs'), long = 'Net Revenue After Returns And Discounts For All Gulf Stores Combined X', m = gulfModel(); measureOf(m, 'Units').name = long;
    m.model.tables.forEach((t) => (t.measures || []).forEach((x) => { x.expression = String(Array.isArray(x.expression) ? x.expression.join('\n') : x.expression).split('[Units]').join(`[${long}]`); }));
    const a = LF.likeForLike(m, gulfReport()), bases = a.measures.map((x) => x.base).concat(a.list.flatMap((v) => v.comparisons.map((c) => c.base))).filter((b) => b && b.startsWith('[Net Revenue After'));
    chk(() => long.length === 70 && bases.length >= 2 && bases.every((b) => b === `[${long}]`), () => `L9 a 70-character base measure: whole in measures and in each comparison (was cut at 60 with "…"): ${J(bases.slice(0, 3))}`);
    const huge = 'R' + 'x'.repeat(249); measureOf(m, long).name = huge; m.model.tables.forEach((t) => (t.measures || []).forEach((x) => { x.expression = String(x.expression).split(`[${long}]`).join(`[${huge}]`); }));
    const b = LF.likeForLike(m, gulfReport()), hit = b.measures.map((x) => x.base).find((x) => x && x.startsWith('[Rxxx'));
    chk(() => hit && hit.length <= 204 && /…\]$/.test(hit), () => `L9b past 200 characters: cut, and the cut marked: ${String(hit).slice(-30)} (${hit && hit.length})`); }
} catch (e) {
  problems.push('threw: ' + String(e && e.stack || e).slice(0, 600));
} finally {
  await s.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL script=mcp/test-0.3.3-lx1.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  lx1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  lx1  ${checks} checks`);
