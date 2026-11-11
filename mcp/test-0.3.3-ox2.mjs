import './test-env.mjs';
// 0.3.3 OX2 (the owner, 11 Nov, D-1111-16: "go for your recommendations", D-1111-17; mcp/work/OX2.md). OX1's stage 2:
// the brief check through check_report. Section briefCheck (beside impactCheck and likeForLike) on the report's own
// model: the "one value on every row" findings for every report that names its model, and with option brief which
// questions a visual answers; a visual grouped by the question's columns and more "answers it, split further"; report
// measures judged through lineage's own nodes; one reading of the report and one load of its model for every section.
//   T1-T7  through the real server, on Souq written as a .pbip project: the base, OX1's AI page, eight questions, report
//          measures, checks narrowed, no model folder, the Arabic lens, lang "ar"
//   O1     the files opened: fewer than on the base (measured on 1e5c539a, the note's plan 1), never more
//   C1-C2  the caps: 80 one-value visuals, 404 visuals; under 16,000 and 40,000, never truncated
//   Q1     refusals through the registered schema
//   S1     a literal planted in a DAX text and a filter is in no answer; no hash
//   D1-D3  TOOLS.md, PRIVACY.md and CHANGELOG
// Made up, in os.tmpdir(), from fixtures/hx1-souq.mjs and fixtures/ox1-ai-page.mjs: no model rows.   node test-0.3.3-ox2.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { souqModel, souqReport, measureOf, colRef, msrRef } from './fixtures/hx1-souq.mjs';
import { visual, aiReport } from './fixtures/ox1-ai-page.mjs';
import { project as writeProject } from './fixtures/souq-project.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-ox2-')));
process.env.DATAARCUS_ROOT = ROOT;
const { serverClient } = await import('./test-0.2.9.mjs');
let CR = {}; try { CR = await import('./lib/check-report.mjs'); } catch (e) { CR = {}; }
const LN = await import('./lib/lineage.mjs');
const J = (x) => JSON.stringify(x);
const SRC = (f) => fs.readFileSync(path.join(HERE, '..', f), 'utf8');
const CANARY = 'OX2_CANARY_5521';
const project = (name, model, report, opts) => writeProject(ROOT, name, model, report, opts);
const extMeasure = (name) => ({ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: '_Measures' } }, Property: name } }, queryRef: `_Measures.${name}`, nativeQueryRef: name });

// the questions: OX1's seven as names (two asked in Arabic) and "Revenue by region", answered by a matrix by month and region
const BRIEF = [
  { id: 'Revenue by month', measure: '[Revenue]', by: ['Calendar[Month]'] },
  { id: 'صافي الإيراد حسب المنطقة', measure: 'Net Revenue', by: ["'Store'[Region]"] },
  { id: 'الهدف حسب المنطقة', measure: '[Target]', by: ['Store[Region]'] },
  { id: 'Margin by brand', measure: '[Margin]', by: ['Product[Brand]'] },
  { id: 'Units by city', measure: '[Units]', by: ['Store[City]'] },
  { id: 'Net Sales by month', measure: '[Net Sales]', by: ['Calendar[Month]'] },
  { id: 'Total revenue', measure: '_Measures[Revenue]', by: [] },
  { id: 'Revenue by region', measure: '[Revenue]', by: ['Store[Region]'] }
];
const matrix = visual('matrix-revenue-month-region', 'pivotTable', { Rows: [colRef('Calendar', 'Month'), colRef('Store', 'Region')], Values: [msrRef('Revenue')] });
const BASE = project('base', souqModel(), souqReport());
const AI = project('ai', souqModel(), aiReport([matrix]));
const s = await serverClient(ROOT, {});
const answers = [];
const call = async (args) => { const r = await s.call('check_report', args); answers.push(r.t); return r; };
const bc = (r) => (r && r.j && r.j.briefCheck) || null;
const cut = (r) => String(r && r.t).slice(0, 700);
const q = (x, id) => x.questions.results.find((r) => r.id === id) || {};
const vis = (l) => (l || []).map((v) => v.visual).sort();

try {
  // ---------- T: through the server ----------
  { const r = await call({ path: BASE.report }), x = bc(r);
    chk(() => x && x.visuals.pairs === 6 && x.visuals.moves === 6 && x.visuals.oneValue === 0 && x.visuals.findings.length === 0 && !x.questions && /^6 of 6 /.test(x.said) && typeof x.proves === 'string' && /Desktop/.test(x.notProved),
      () => `T1 Souq, a default call: briefCheck, 6 of 6 pairs move, no finding, no questions key: ${cut(r)}`);
    chk(() => Object.keys(r.j).indexOf('briefCheck') > Object.keys(r.j).indexOf('impact') && Object.keys(r.j).indexOf('briefCheck') < Object.keys(r.j).indexOf('findings') && Array.isArray(r.j.findings) && r.j.validator,
      () => `T1b the section sits after impact, before findings; the checks still run: ${Object.keys(r.j || {}).join(',')}`); }
  { const r = await call({ path: AI.report, brief: BRIEF }), x = bc(r), v = x && x.visuals;
    chk(() => v && v.pairs === 14 && v.moves === 11 && v.oneValue === 3 && J(v.findings.map((f) => `${f.visual}|${f.number}|${f.by}`).sort()) === J(['bar-target-by-region|[Target]|Store[Region]', 'column-headcount-by-category|[Headcount]|Product[Category]', 'table-staff-revenue|[Revenue]|Staff[Name]']) && v.findings.every((f) => f.verdict === 'one value' && /would show the same/.test(f.why)),
      () => `T2 OX1's AI page and the matrix: 14 pairs, 11 move, OX1's three findings with why: ${J(v).slice(0, 600)}`);
    chk(() => J(v.notInModel) === J([{ page: 'ai', visual: 'card-ghost', name: '[Net Sales]' }]), () => `T2b [Net Sales] is not in the model: ${J(v && v.notInModel)}`);
    const Q = x && x.questions;
    chk(() => Q && Q.questions === 8 && Q.answered === 4 && Q.splitFurther === 1 && Q.partly === 1 && Q.notAnswered === 1 && Q.cannotAnswer === 2 && Q.notRead === 0,
      () => `T3 8 questions: 4 answered (1 split further), 1 partly, 1 not answered, 2 cannot answer: ${J(Q).slice(0, 500)}`);
    chk(() => q(x, 'Revenue by region').status === 'answered' && q(x, 'Revenue by region').how === 'answers it, split further' && J(vis(q(x, 'Revenue by region').answeredBy)) === J(['matrix-revenue-month-region']) && J(q(x, 'Revenue by region').splitBy) === J(['Calendar[Month]']),
      () => `T3b Revenue by region: answered by the matrix by month and region, worded "answers it, split further", the extra column named (D-1111-16): ${J(q(x, 'Revenue by region'))}`);
    chk(() => q(x, 'Revenue by month').status === 'answered' && !q(x, 'Revenue by month').how && J(vis(q(x, 'Revenue by month').answeredBy)) === J(['column-revenue-by-month']) && q(x, 'Total revenue').status === 'answered' && J(vis(q(x, 'Total revenue').answeredBy)) === J(['card-revenue']),
      () => `T3c an exact visual answers it (no wording added): Revenue by month, the total on the card ("_Measures[Revenue]" read as the measure): ${J([q(x, 'Revenue by month'), q(x, 'Total revenue')])}`);
    chk(() => q(x, 'صافي الإيراد حسب المنطقة').status === 'answered' && q(x, 'الهدف حسب المنطقة').status === 'cannot answer' && /Targets/.test(q(x, 'الهدف حسب المنطقة').why) && q(x, 'Units by city').status === 'partly' && q(x, 'Margin by brand').status === 'not answered' && q(x, 'Net Sales by month').status === 'cannot answer',
      () => `T3d the others as OX1 sorted them, names read by parseReach ("'Store'[Region]"): ${J(x.questions.results.map((r) => [r.id, r.status]))}`);
    chk(() => /^14 pairs|^11 of 14 /.test(x.said) && /4 of 8 questions answered by a visual \(1 by a visual that answers it, split further\)/.test(x.said) && !/partly[^;]*split further/.test(x.said), () => `T3e the sentence: ${x && x.said}`);
    chk(() => !J(x).includes('Unrecognized') && /Store\[Region\]/.test(J(q(x, 'الهدف حسب المنطقة'))), () => 'T3f a question asked in Arabic keeps its id as typed; the names are the model\'s'); }
  { const r0 = souqReport(); r0.files.push(visual('x', 'tableEx', { Values: [colRef('Store', 'Region'), extMeasure('Mine'), extMeasure('Mine Twice')] }));
    r0.files.push({ path: 'definition/reportExtensions.json', json: { entities: [{ name: '_Measures', measures: [{ name: 'Mine', expression: 'SUM ( Targets[Target] )' }, { name: 'Mine Twice', expression: '[Mine] * 2' }] }] } });
    const P = project('rm', souqModel(), r0), r = await call({ path: P.report, checks: ['schemas'], brief: [{ id: 'mine', measure: '[Mine Twice]', by: ['Store[Region]'] }] }), x = bc(r);
    chk(() => x && x.visuals.oneValue === 2 && x.visuals.cannotTell === 0 && J(x.visuals.findings.map((f) => f.number).sort()) === J(['[Mine Twice](report measure)', '[Mine](report measure)']),
      () => `T4 report measures judged through lineage's nodes: SUM ( Targets[Target] ) and one calling it, by Store[Region]: one value each (was cannot tell): ${J(x && x.visuals).slice(0, 500)}`);
    const r1 = souqReport(); r1.files.push(visual('y', 'tableEx', { Values: [colRef('Store', 'Region'), extMeasure('Mine Twice')] }), r0.files.find((f) => /reportExtensions/.test(f.path)));
    const lin = LN.lineageOf(souqModel(), r1), xv = lin.visuals.find((y) => y.visual === 'y'), keys = Object.keys((xv && xv.nodes) || {});
    chk(() => keys.includes('x:mine twice') && keys.includes('x:mine') && keys.some((k) => /^c:targets\|/.test(k)), () => `T4c a visual showing only [Mine Twice]: lineage follows a report measure into another (reportMeasures, one reading): the Impact check sees [Mine] and Targets under [Mine Twice]: ${J(keys)}`);
    chk(() => q(x, 'mine').status === 'cannot answer' && J(vis(q(x, 'mine').shownBy)) === J(['x']), () => `T4b a question on a report measure: this model cannot answer it, the visual named: ${J(q(x, 'mine'))}`); }
  { const a = await call({ path: AI.report, checks: ['schemas'] }), b = await call({ path: AI.report, checks: ['schemas'], brief: BRIEF.slice(0, 2) });
    chk(() => a.j && !('briefCheck' in a.j) && bc(b) && bc(b).questions.questions === 2, () => `T5 checks narrowed: no section; with brief: the section: ${cut(a)} / ${cut(b)}`); }
  { const P = project('nomodel', souqModel(), souqReport(), { noModel: true }), a = await call({ path: P.report }), b = await call({ path: P.report, brief: BRIEF.slice(0, 1) }), c = await call({ path: BASE.report, lens: 'arabic', brief: BRIEF.slice(0, 1) });
    chk(() => a.j && !a.err && !('briefCheck' in a.j) && a.j.notChecked.some((n) => n.rule === 'briefCheck' && /no model folder/.test(n.why)), () => `T6 a report that names no model folder: no section, one notChecked line: ${cut(a)}`);
    chk(() => b.err && /brief/.test(b.t) && /model folder/.test(b.t) && /Nothing was checked/.test(b.t), () => `T6b with brief: refused, the option named: ${cut(b)}`);
    chk(() => c.err && /brief/.test(c.t) && /Arabic lens/.test(c.t), () => `T6c brief with the Arabic lens: refused, said why: ${cut(c)}`); }
  { const r = await call({ path: AI.report, lang: 'ar', brief: BRIEF }), x = bc(r);
    const noIds = (y) => J(Object.assign({}, y, { questions: Object.assign({}, y.questions, { results: y.questions.results.map((z) => Object.assign({}, z, { id: '' })) }) }));
    chk(() => x && !/[؀-ۿ]/.test(noIds(x)),
      () => `T7 lang "ar": the section in English (the Arabic words wait for the owner's approval, D-1111-16): ${cut(r)}`); }

  // ---------- O: the files opened ----------
  { const reads = new Map(), real = fs.openSync;
    const count = async (opts) => { reads.clear(); fs.openSync = function (f, ...a) { const k = String(f); reads.set(k, (reads.get(k) || 0) + 1); return real.call(fs, f, ...a); }; let res; try { res = await CR.checkReport(BASE.report, opts); } finally { fs.openSync = real; }
      const n = (re) => [...reads.entries()].filter(([k]) => re.test(k)).reduce((m, [, v]) => m + v, 0); return { bim: n(/model\.bim$/), rep: n(/Souq\.Report.*(visual|page|reportExtensions|report)\.json$/), res }; };
    const d = await count({}), m = await count({ againstModel: BASE.model });
    // measured on 1e5c539a with the same count (mcp/work/OX2.md, the plan's step 1): default 2 and 57; againstModel 4 and 100
    chk(() => d.res.briefCheck && d.bim === 1 && d.rep <= 57, () => `O1 a default call reads the model once (2 on the base) and the report's files no more often (57 on the base): ${d.bim} ${d.rep}`);
    chk(() => m.res.briefCheck && m.res.impactCheck && m.bim === 2 && m.rep < 100, () => `O1b with againstModel: the two models once each (4 on the base), the report fewer times (100): ${m.bim} ${m.rep}`); }

  // ---------- C: the caps ----------
  { const more = Array.from({ length: 80 }, (_, i) => visual(`more-target-by-region-${i}`, 'tableEx', { Values: [colRef('Store', 'Region'), msrRef('Target')] }));
    const P = project('cap', souqModel(), aiReport(more)), r = await call({ path: P.report, checks: ['schemas'], brief: BRIEF }), x = bc(r);
    chk(() => x && x.visuals.oneValue === 83 && x.visuals.findings.length + x.visuals.notListed === 83 && x.visuals.findings.length <= 60 && J(x).length <= 16000 && x.questions.results.length === 8,
      () => `C1 83 one-value pairs: at most 60 listed, the rest counted, the section under 16,000: ${x && J([x.visuals.findings.length, x.visuals.notListed, J(x).length])}`); }
  { const r0 = souqReport(); for (let i = 0; i < 400; i++) r0.files.push(visual(`many-${i}-with-a-longer-visual-name-for-the-size-test`, 'tableEx', { Values: [colRef('Staff', 'Name'), msrRef('Revenue')] }));
    const P = project('big', souqModel(), r0), r = await call({ path: P.report, checks: ['navigation'], brief: BRIEF }), x = bc(r);
    chk(() => x && x.visuals.oneValue === 400 && x.visuals.findings.length + x.visuals.notListed === 400 && r.t.length < 40000 && !/"truncated":(true|\{)/.test(r.t),
      () => `C2 404 visuals, 400 findings: listed and counted, the answer under 40,000, never truncated: ${x && J([x.visuals.findings.length, x.visuals.notListed])} ${r.t.length}`); }

  // ---------- Q: refusals through the registered schema ----------
  { const bad = [[{ measure: '[Revenue]', by: [], extra: 1 }], Array.from({ length: 61 }, () => ({ measure: '[Revenue]', by: [] })), [{ measure: '', by: [] }], [{ measure: '[Revenue]' }], []];
    const rs = []; for (const b of bad) rs.push(await call({ path: BASE.report, brief: b }));
    chk(() => rs.every((r) => r.err && !bc(r) && /Input validation error/.test(r.t) && !/Unrecognized key:? ["']brief["']/.test(r.t)), () => `Q1 an extra key, 61 questions, an empty measure, no by, an empty list: refused by the schema: ${rs.map((r) => String(r.t).slice(0, 120)).join(' | ')}`); }
  { const r = await call({ path: BASE.report, brief: [{ id: 'x', measure: '[Revenue]', by: ['Region'] }] }), x = bc(r);
    chk(() => x && q(x, 'x').status === 'not read' && /Table\[Column\]/.test(q(x, 'x').why), () => `Q2 a "by" that is not Table[Column]: not read, said why: ${J(x && x.questions)}`); }

  // ---------- S: no value ----------
  { const m = souqModel(), r0 = aiReport(); measureOf(m, 'Target').expression = `CALCULATE ( SUM ( Targets[Target] ), Targets[Region] = "${CANARY}" )`;
    r0.files.find((f) => /pages\/ai\/page\.json$/.test(f.path)).json.filterConfig = { filters: [{ name: 'f', field: colRef('Product', 'Brand').field, type: 'Categorical', filter: { Version: 2, From: [{ Name: 'p', Entity: 'Product', Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 'p' } }, Property: 'Brand' } }], Values: [[{ Literal: { Value: `'${CANARY}'` } }]] } } }] } }] };
    const P = project('canary', m, r0), res = await call({ path: P.report, brief: BRIEF });
    chk(() => bc(res) && bc(res).visuals.oneValue === 3 && answers.every((t) => !String(t).includes(CANARY)), () => `S1 a literal planted in a DAX text and a page filter is in no answer: ${cut(res)}`);
    chk(() => answers.every((t) => !/"[0-9a-f]{64}"/.test(String(t))), () => 'S1b no hash in an answer'); }

  // ---------- D: the words ----------
  { const tools = SRC('mcp/TOOLS.md'), priv = SRC('mcp/PRIVACY.md'), log = SRC('mcp/CHANGELOG.md'), un = log.slice(log.indexOf('## [Unreleased]'), log.indexOf('\n## [', log.indexOf('## [Unreleased]') + 5));
    chk(() => /briefCheck/.test(tools) && /answers it, split further/.test(tools) && /not (yet )?measured in Power BI Desktop|a rule, not a Desktop measurement/i.test(tools), () => 'D1 TOOLS.md says briefCheck, "answers it, split further", and that the rule is not a Desktop measurement');
    chk(() => priv.split('\n').some((l) => /briefCheck/.test(l) && /name/i.test(l) && /value/i.test(l)), () => 'D2 PRIVACY.md says what briefCheck sends: names, never values');
    chk(() => /one value on every row/i.test(un) && !/\b(first|only|official)\b/i.test(un.split('\n').filter((l) => /one value on every row/i.test(l)).join(' ')) && !/^- A new measure[^\n]*\n[^\n]*\n\s*Nothing a tool writes or answers changes\./m.test(un),
      () => 'D3 CHANGELOG [Unreleased]: one plain line for the brief check, never "first", "only" or "official"; the first bullet no longer says nothing changes while the next ones change the layout'); }
} finally {
  await s.close();
}

if (problems.length) { console.log(`FAIL script=mcp/test-0.3.3-ox2.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 600))); console.log(`FAIL  ox2  ${problems.length} of ${checks} checks failed`); process.exit(1); }
console.log(`PASS  ox2  ${checks} checks`);
