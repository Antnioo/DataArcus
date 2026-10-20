import './test-env.mjs';
// 0.3.0 S1, the backlog sweep (the owner, 20 Oct: "continue the held jobs"): eight small follow-ups, each a "Seen, not
// in scope" of an earlier job. Written red first. Made-up fixtures only (mcp/fixtures/twin-project and health-project,
// copied and changed here, and made-up names): no employer or client data.
//   A  B-180 the twin's timeRightToLeft false keeps a sort by the month's number (the Tooltips-role helper), as it keeps
//      a sort by the category itself (assets/js/report-mirror.js)
//   B  B-181 a hidden "Keep:" measure's name is in one script (assets/js/pbip-query.js topSet)
//   C  B-182 create_arabic_twin reads its model again right before its first write (lib/arabic-twin.mjs)
//   D  B-183 the app's own approval prompt counts the files per group and names a changed colour (lib/approval-window.mjs)
//   E  B-184 read_report never returns a static visual title (lib/read-report.mjs)
//   F  B-211 check_report's validator findings quote no name from the report (lib/check-report.mjs)
//   G  B-196 the repo check for non-literal requires (scripts/check-literal-requires.mjs)
//   H  B-198 the repo check for every npm test script's result line (scripts/check-result-lines.mjs)
//   node test-0.3.0-sweep-s1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { elicitClient } from './test-audit6.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? x.t.slice(0, 500) : JSON.stringify(x && x.j).slice(0, 500));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => fs.writeFileSync(f, JSON.stringify(j, null, 2));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rels = (d) => tree(d).map((f) => path.relative(d, f).split(path.sep).join('/')).sort();
// one script: no name that holds Latin letters beside letters of another script
const oneScript = (s) => !(/\p{Script=Latin}/u.test(s) && /[^\P{L}\p{Script=Latin}]/u.test(s));

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-s1-')));
const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
const DEF = (d) => path.join(ROOT, d, 'Twin Sales.Report/definition');
const added = (before) => rels(ROOT).filter((r) => !before.includes(r));

// ---------- A: B-180, the mirror engine alone ----------
{
  const M = require('../assets/js/report-mirror.js');
  const col = (t, c) => ({ Column: { Expression: { SourceRef: { Entity: t } }, Property: c } });
  const mea = (t, m, ext) => ({ Measure: { Expression: { SourceRef: Object.assign(ext ? { Schema: 'extension' } : {}, { Entity: t }) }, Property: m } });
  const minOf = (t, c) => ({ Aggregation: { Expression: col(t, c), Function: 3 } });
  // a writer-made chart: the month names in order by Min of the month number in its Tooltips role (round 2), or by the
  // writer's own "Month start (sort)" report measure (O-13)
  const chart = (type, cat, key, dir) => ({ name: 'v1', position: { x: 40, y: 40, width: 600, height: 300, z: 0 }, visual: { visualType: type, query: { queryState: {
    Category: { projections: [{ field: cat, queryRef: 'q.cat' }] }, Y: { projections: [{ field: mea('Sales', 'Total Sales'), queryRef: 'Sales.Total Sales' }] },
    ...(key ? { Tooltips: { projections: [{ field: key, queryRef: 'q.key' }] } } : {}) }, sortDefinition: { sort: [{ field: key || mea('Sales', 'Total Sales'), direction: dir }], isDefaultSort: true } } } });
  const dirOf = (r) => r.json.visual.query.sortDefinition.sort[0].direction;
  const keep = { timeRightToLeft: false, dateTables: ['Calendar'] };
  const a1 = M.mirrorVisual(chart('clusteredColumnChart', col('Calendar', 'Month Name'), minOf('Calendar', 'Month Number'), 'Ascending'), 1280, keep);
  chk(() => dirOf(a1) === 'Ascending', () => `A1. a column chart by month sorted by Min(Month Number) (the Tooltips role) keeps its order with timeRightToLeft false: ${dirOf(a1)} ${JSON.stringify(a1.changes)}`);
  const a2 = M.mirrorVisual(chart('lineChart', col('Calendar', 'Month Name'), minOf('Calendar', 'Month Number'), 'Ascending'), 1280, keep);
  chk(() => dirOf(a2) === 'Ascending', () => `A2. a line chart by month sorted by Min(Month Number) keeps its order with timeRightToLeft false: ${dirOf(a2)}`);
  const a3 = M.mirrorVisual(chart('lineChart', col('Calendar', 'Month Name'), mea('Calendar', 'Month start (sort)', true), 'Ascending'), 1280, keep);
  chk(() => dirOf(a3) === 'Ascending', () => `A3. a chart sorted by the writer's "Month start (sort)" helper keeps its order with timeRightToLeft false: ${dirOf(a3)}`);
  const a4 = M.mirrorVisual(chart('clusteredColumnChart', col('Calendar', 'Month Name'), minOf('Calendar', 'Month Number'), 'Ascending'), 1280, { dateTables: ['Calendar'] });
  chk(() => dirOf(a4) === 'Descending', () => `A4. by default (time right to left) the same chart is still turned round: ${dirOf(a4)}`);
  const a5 = M.mirrorVisual(chart('clusteredColumnChart', col('Sales', 'Region'), null, 'Descending'), 1280, keep);
  chk(() => dirOf(a5) === 'Ascending', () => `A5. a chart by a category that is not time, sorted by its measure, is still turned round with timeRightToLeft false: ${dirOf(a5)}`);
}

// ---------- B: B-181, the "Keep:" helper's name ----------
{
  const Q = require('../assets/js/pbip-query.js');
  const keepName = (f, t, m) => { const timeExt = [], X = Q.measures({ freeExt: (tt, want) => want, timeExt }); const s = X.topSet(f, { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, 5, 2); s.keep(); return (timeExt[timeExt.length - 1] || {}).m; };
  const b1 = keepName({ t: 'Plan', c: 'Plan Group', name: 'مجموعة الخطة' }, 'Web', 'Web Orders Total Score');
  chk(() => /^Keep: /.test(b1) && oneScript(b1), () => `B1. an English measure by an Arabic shown name: the hidden helper is named in one script: ${b1}`);
  const b2 = keepName({ t: 'Sales', c: 'Region' }, 'Sales', 'Total Sales');
  chk(() => b2 === 'Keep: Total Sales by Region', () => `B2. an English report keeps its helper's name: ${b2}`);
  const b3 = keepName({ t: 'المبيعات', c: 'المنطقة', name: 'المنطقة' }, 'المبيعات', 'إجمالي المبيعات');
  chk(() => /^Keep: /.test(b3) && oneScript(b3), () => `B3. Arabic model names: the hidden helper is plain English, one script: ${b3}`);
}

const s = await serverClient(ROOT, {});
try {
  // ---------- C: B-182, the twin reads its model again right before its first write ----------
  {
    cp('fixtures/twin-project', 'tw'); cp('fixtures/twin-project', 'tw2');
    const h = await serverClient(ROOT, { DATAARCUS_TEST_EDIT_BEFORE_WRITE: 'tw/Twin Sales.SemanticModel/model.bim' });
    try {
      const p = await h.call('create_arabic_twin', { path: 'tw/Twin Sales.pbip' }), id = p.j && p.j.plan && p.j.plan.planId;
      await h.call('approve_plan', { planId: id });
      const before = rels(ROOT), x = await h.call('create_arabic_twin', { path: 'tw/Twin Sales.pbip', planId: id });
      chk(() => x.err && x.t.startsWith(`Nothing was written: the model changed after you approved: make the plan again (plan ${id} `), () => `C1. create_arabic_twin: an edit between the last read and the first write is refused, with create_report's sentence: ${short(x)}`);
      chk(() => id && !added(before).length, () => `C2. nothing is on disk after the refusal: ${JSON.stringify(added(before)).slice(0, 300)}`);
    } finally { await h.close(); }
    const p2 = await s.call('create_arabic_twin', { path: 'tw2/Twin Sales.pbip' }), id2 = p2.j && p2.j.plan && p2.j.plan.planId;
    await s.call('approve_plan', { planId: id2 });
    const w2 = await s.call('create_arabic_twin', { path: 'tw2/Twin Sales.pbip', planId: id2 });
    chk(() => !w2.err && w2.j.written === true && fs.existsSync(path.join(ROOT, 'tw2/Twin Sales AR.pbip')), () => `C3. nothing changed: the twin is written: ${short(w2)}`);
    const c = await s.call('check_report', { path: 'tw2/Twin Sales AR.pbip' }), j = c.j || {};
    chk(() => !c.err && j.validator && j.validator.ran && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0, () => `C4. the written twin: Microsoft's validator 0 errors, check_report 0 "can break": ${c.err ? c.t.slice(0, 300) : JSON.stringify({ v: j.validator, canBreak: j.impact && j.impact.kinds.canBreak })}`);
  }

  // ---------- D: B-183, the app's own approval prompt says what the page says, in short ----------
  {
    const AW = await import('./lib/approval-window.mjs');
    cp('fixtures/health-project', 'hp');
    const app = await elicitClient(ROOT, () => ({ action: 'accept', content: { approve: true } }));
    try {
      const args = { path: 'hp', name: 'Prompt', layout: 'exec', colors: { accent: '#F4B183' } };
      const pl = await app.call('plan_layout', args), id = pl.j && pl.j.plan && pl.j.plan.planId;
      const r = await app.call('approve_plan', { planId: id }), msg = String((app.seen[0] || {}).message || '');
      chk(() => !r.err && /\bVisuals \(\d+\)/.test(msg) && /\bPages \(\d+\)/.test(msg) && /\bProject file \(1\)/.test(msg) && /\d+ files:/.test(msg), () => `D1. the app's prompt for a report plan counts the files per group: ${msg.slice(0, 900)}`);
      chk(() => /approved colour #f4b183 -> written colour #[0-9a-f]{6}/i.test(msg), () => `D2. the app's prompt names the changed colour (approved -> written): ${msg.slice(0, 900)}`);
      const th = await app.call('generate_theme', { brand: '#0F766E', name: 'Prompt Theme' }), tid = th.j && th.j.plan && th.j.plan.planId;
      await app.call('approve_plan', { planId: tid });
      const tmsg = String((app.seen[1] || {}).message || '');
      chk(() => /Theme file \(1\)/.test(tmsg), () => `D4. a theme plan's prompt counts its theme file: ${tmsg.slice(0, 600)}`);
    } finally { await app.close(); }
    // the cap: 400 files in many groups and a changed colour stay within PROMPT_SUMMARY_CAP characters
    const many = Array.from({ length: 400 }, (_, i) => `Big.Report/definition/pages/p${i % 40}/visuals/v${i}/${['visual', 'mobile'][i % 2]}.json`).concat(['Big.pbip', 'Big.Report/definition/report.json']);
    const sum = AW.promptSummary && AW.promptSummary('report', { outputs: many, colours: { changed: [{ from: '#F4B183', to: '#B5651D', contrast: 1.9 }], card: '#FFFFFF' } });
    chk(() => typeof sum === 'string' && sum.length <= AW.PROMPT_SUMMARY_CAP && AW.PROMPT_SUMMARY_CAP <= 600 && /402 files/.test(sum) && /Visuals \(200\)/.test(sum) && /written colour #B5651D/.test(sum), () => `D3. the prompt's summary stays within its cap (at most 600 characters) and still counts every file: ${sum && sum.length} ${sum}`);
  }

  // ---------- E: B-184, read_report never returns a static title ----------
  {
    cp('fixtures/twin-project', 'rr');
    const SENT = 'S1_TITLE_SENTINEL_184';
    { const f = path.join(DEF('rr'), 'pages/p1overview/visuals/lineMonth/visual.json'), j = rd(f); j.visual.visualContainerObjects.title[0].properties.text.expr.Literal.Value = `'${SENT}'`; wr(f, j); }
    { const f = path.join(DEF('rr'), 'pages/p1overview/visuals/colRegion/visual.json'), j = rd(f); j.visual.visualContainerObjects = Object.assign({}, j.visual.visualContainerObjects, { title: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Total Sales' } } } } }] }); wr(f, j); }
    const t = await s.call('read_report', { path: 'rr/Twin Sales.pbip' }), js = await s.call('read_report', { path: 'rr/Twin Sales.pbip', format: 'json' });
    chk(() => !t.err && !t.t.includes(SENT), () => `E1. a static title is in no text answer: ${t.t.slice(0, 300)}`);
    chk(() => !js.err && !js.t.includes(SENT), () => `E2. a static title is in no JSON answer: ${(js.t.match(new RegExp('.{0,200}' + SENT + '.{0,50}')) || [''])[0]}`);
    const lv = js.j && js.j.pages.flatMap((p) => p.visuals || []).find((v) => v.id === 'lineMonth');
    chk(() => lv && lv.staticTitle === true && !('title' in lv) && Object.keys(lv.fields || {}).length && Number.isFinite(lv.x) && /static title/.test(t.t), () => `E3. the visual is still listed by its kind, place and fields, marked as having a static title: ${JSON.stringify(lv).slice(0, 300)}`);
    const cv = js.j && js.j.pages.flatMap((p) => p.visuals || []).find((v) => v.id === 'colRegion');
    chk(() => cv && /^fx /.test(String(cv.title)) && /Total Sales/.test(cv.title), () => `E4. a title from a measure is still given as "fx Table[Measure]": ${JSON.stringify(cv && cv.title)}`);
    const tools = await s.c.listTools(), desc = ((tools.tools || []).find((x) => x.name === 'read_report') || {}).description || '';
    chk(() => /static title/i.test(desc) && /never returned|not returned/i.test(desc), () => `E5. read_report's description says a static title is not returned: ${desc.slice(0, 300)}`);
  }

  // ---------- F: B-211, the validator's findings quote no name from the report ----------
  {
    cp('fixtures/twin-project', 'cf');
    // (the validator quotes a name in "..."; a name that holds a quote itself got past the quote mask: L4's finding)
    const SENT = 'S1_SENTINEL_211', N1 = `S1_O'BRIEN_${SENT}`, N2 = `Sales "North" ${SENT}`;
    { const f = path.join(DEF('cf'), 'bookmarks/bmReset.bookmark.json'), j = rd(f); j.options.targetVisualNames = [N1]; j.explorationState.sections.p1overview.visualContainers = { [N2]: {} }; wr(f, j); }
    const c = await s.call('check_report', { path: 'cf/Twin Sales.pbip' }), j = c.j || {};
    const hit = (j.findings || []).find((x) => x.rule === 'PBIR_BOOKMARK_VISUAL_REF_MISSING');
    chk(() => hit && hit.severity === 'error' && /bmReset\.bookmark\.json$/.test(String(hit.file)), () => `F1. a bookmark naming a missing visual is the validator's error, its file named: ${JSON.stringify(hit || (j.findings || []).map((x) => x.rule)).slice(0, 300)}`);
    chk(() => !c.err && (j.findings || []).filter((x) => x.rule === 'PBIR_BOOKMARK_VISUAL_REF_MISSING').length === 2 && !(j.findings || []).some((x) => /SENTINEL|BRIEN|North/.test(JSON.stringify(x))), () => `F2. a visual's name from the report (one holding a quote) is in no finding: ${JSON.stringify((j.findings || []).filter((x) => JSON.stringify(x).includes(SENT))).slice(0, 300)}`);
    chk(() => hit && /^Bookmark references missing target visual <text>$/.test(hit.what) && (j.findings || []).some((x) => /^Bookmark section <text> references missing visual <text>$/.test(x.what)), () => `F3. the finding still says what is wrong, each name masked: ${JSON.stringify((j.findings || []).filter((x) => x.origin === 'validator').map((x) => x.what))}`);
  }
} finally { await s.close(); }

// ---------- G: B-196, no module loaded by a computed path ----------
{
  const SCRIPT = path.join(REPO, 'scripts/check-literal-requires.mjs');
  const run = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  const g1 = run([]);
  chk(() => g1.status === 0, () => `G1. the repo's shipped modules load every module by a literal path: ${g1.status} ${(g1.stdout + g1.stderr).slice(0, 400)}`);
  const F = path.join(ROOT, 'req'); fs.mkdirSync(F);
  fs.writeFileSync(path.join(F, 'bad.js'), "const f = './x.js';\nmodule.exports = require(f);\n");
  fs.writeFileSync(path.join(F, 'bad2.mjs'), "import { createRequire } from 'node:module';\nconst p = '../a.js';\nexport default createRequire(import.meta.url)(p);\n");
  fs.writeFileSync(path.join(F, 'good.mjs'), "import { createRequire } from 'node:module';\n// a comment: require(file) is not code\nconst A = createRequire(import.meta.url)('../a.js');\nconst B = (() => require('./b.js'));\nexport const c = () => import('./c.mjs');\nexport default [A, B];\n");
  const g2 = run([F]);
  chk(() => g2.status === 1 && /bad\.js:2/.test(g2.stdout + g2.stderr) && /bad2\.mjs:3/.test(g2.stdout + g2.stderr), () => `G2. a require or createRequire call with a variable path fails, each file and line named: ${g2.status} ${(g2.stdout + g2.stderr).slice(0, 400)}`);
  const g3 = run([path.join(F, 'good.mjs')]);
  chk(() => g3.status === 0, () => `G3. literal requires, a literal import() and a commented require pass: ${g3.status} ${(g3.stdout + g3.stderr).slice(0, 400)}`);
}

// ---------- H: B-198, every npm test script prints its result line ----------
{
  const SCRIPT = path.join(REPO, 'scripts/check-result-lines.mjs');
  const run = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  const h1 = run([]);
  chk(() => h1.status === 0, () => `H1. every script of mcp/package.json's test prints "PASS  <name>  <N> checks" (or FAIL / SKIP): ${h1.status} ${(h1.stdout + h1.stderr).slice(0, 400)}`);
  const F = path.join(ROOT, 'res'); fs.mkdirSync(F);
  fs.writeFileSync(path.join(F, 'package.json'), JSON.stringify({ scripts: { test: 'node a.mjs && node b.mjs' } }));
  fs.writeFileSync(path.join(F, 'a.mjs'), "if (bad) { console.log(`FAIL  a  ${n} checks, ${k} failed`); process.exit(1); }\nconsole.log(`PASS  a  ${n} checks`);\n");
  fs.writeFileSync(path.join(F, 'b.mjs'), "console.log('All good: ' + n + ' tests passed');\n");
  const h2 = run([path.join(F, 'package.json')]);
  chk(() => h2.status === 1 && /b\.mjs/.test(h2.stdout + h2.stderr) && !/\ba\.mjs/.test(h2.stdout + h2.stderr), () => `H2. a test script with no result line is named (and only it): ${h2.status} ${(h2.stdout + h2.stderr).slice(0, 400)}`);
  const tests = (fs.readFileSync(path.join(HERE, 'CLAUDE.md'), 'utf8').split('\n## Tests')[1] || '').split('\n## ')[0];
  chk(() => /PASS {2}<name> {2}<N> checks/.test(tests) && /ci-sum\.mjs/.test(tests) && /check-result-lines/.test(tests), () => 'H3. mcp/CLAUDE.md "Tests" says every npm test script ends with one result line, and names the check');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  sweep-s1  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  sweep-s1  ${checks} checks`);
