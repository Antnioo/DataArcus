// 0.3.0 step 2, "Check before download / before write" (the owner's go, 18 Oct 2026), written red first. The layout
// check (the design lint) moves into assets/js/layout-check.js, one engine with the measured rules (report-rules.js),
// run on a generated project in memory before the MCP writes it and before the lab page offers its download.
//   C-01: the engine loads in Node (window.DALayoutCheck in the browser); mcp/lib/design-lint.mjs is its adapter (the same
//         rules, the same answer)
//   C-02: on the golden test models, the shared check (the lab's path: the files in memory) finds exactly what the MCP's
//         reading layer and lint find (rule, severity, page and place of each finding), and the same twice
//   C-03: the answer: "0 problems Power BI Desktop would show" or the count and the list (English and Arabic); a project
//         with a visual off the page and two visuals overlapping lists them as problems Desktop would show
//   node test-0.3.0-check.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const report = () => { console.log(problems.length ? `FAIL  check  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  check  ${checks} checks`); process.exit(problems.length ? 1 : 0); };

let LC = null;
try { LC = require('../assets/js/layout-check.js'); } catch (e) { LC = null; }
chk(() => LC && ['lint', 'inventoryOf', 'rulesInput', 'checkProject'].every((k) => typeof LC[k] === 'function'), () => 'C-01. assets/js/layout-check.js loads with lint, inventoryOf, rulesInput, checkProject');
if (!LC) report();

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-check-'));
const cp = (from, to) => fs.cpSync(path.join(REPO, from), path.join(ROOT, to), { recursive: true });
cp('mcp/test-models/arabic-long-names', 'arabic'); cp('mcp/fixtures/health-project', 'health');
cp('mcp/test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');
cp('scripts/tests/fixtures/model-health/tmdl-ramadan/definition', 'ramadan/Ramadan Test.SemanticModel/definition');
fs.writeFileSync(path.join(ROOT, 'ramadan/Ramadan Test.SemanticModel/definition.pbism'), '{ "version": "4.0", "settings": {} }');
process.env.DATAARCUS_ROOT = ROOT;
const { loadModel } = await import('./lib/model.mjs');
const { planLayout } = await import('./lib/design.mjs');
const { scopeOf } = await import('./lib/scope.mjs');
const { inventory, memorySource } = await import('./lib/read-report.mjs');
const DL = await import('./lib/design-lint.mjs');
const PL = await import('./lib/plan-lint.mjs');
const Rules = require('../assets/js/report-rules.js');

// ---------- C-01: design-lint.mjs is the engine's adapter ----------
chk(() => DL.LINT_RULES === LC.LINT_RULES && DL.MEASURED === LC.MEASURED, () => 'C-01. design-lint.mjs gives the engine\'s own rules and measured numbers (no copy of its own)');
chk(() => fs.readFileSync(path.join(HERE, 'lib/design-lint.mjs'), 'utf8').split('\n').length < 40, () => 'C-01. design-lint.mjs is a thin adapter (the lint\'s logic lives in assets/js/layout-check.js)');

try {
  // ---------- C-02: the golden models, the lab's path against the MCP's ----------
  const key = (f) => [f.origin, f.rule, f.severity, f.page && f.page.n, (String(f.visual || '').match(/ at (-?\d+),(-?\d+) (\d+)x(\d+)$/) || []).slice(1).join(',')].join('|');
  const sorted = (l) => l.map(key).sort().join('\n');
  const cases = [
    { model: 'arabic', lang: 'ar', layout: 'exec' },
    { model: 'health', lang: 'en', layout: 'analysis' },
    { model: 'large', lang: 'en', layout: 'ops', focus: 'logistics' },
    { model: 'ramadan', lang: 'en', layout: 'focus' }
  ];
  const found = {};
  for (const c of cases) {
    const m = loadModel(c.model, { root: ROOT }), sc = scopeOf(m, c.focus ? { focus: c.focus } : {});
    const design = planLayout({ layout: c.layout, lang: c.lang }).design;
    const built = PL.plannedReport ? PL.plannedReport({ m, tables: sc.tables, design, lang: c.lang }, { second: true, title: 'Golden ' + c.model }) : null;
    chk(() => built && built.files && built.files.length > 20, () => `C-02 ${c.model}. lib/plan-lint.mjs gives the writer's planned report in memory (plannedReport)`);
    if (!built || !built.files) continue;
    const lab = LC.checkProject(built.files, { lang: c.lang, model: m.tables }), again = LC.checkProject(built.files, { lang: c.lang, model: m.tables });
    // the MCP's path: the reading layer's inventory of the same files, its lint (design-lint.mjs) and the measured rules
    const inv = inventory(memorySource(built.files.filter((f) => /^[^/]+\.Report\//.test(f.path)).map((f) => ({ path: f.path.replace(/^[^/]+\.Report\//, ''), data: f.data }))), 'golden');
    const { R } = LC.rulesInput(inv); Rules.normalize(R); R.lang = c.lang; R.dir = c.lang === 'ar' ? 'rtl' : 'ltr';
    const pageNo = new Map(inv.pages.map((p) => [p.id, p.n]));
    const mcp = Rules.check(R, { groups: Rules.GROUPS }).findings.map((f) => ({ origin: 'rule', rule: f.rule, severity: f.severity, page: f.page ? { n: pageNo.get(f.page.id) } : null, visual: f.visual ? `x at ${Math.round(f.visual.x)},${Math.round(f.visual.y)} ${Math.round(f.visual.w)}x${Math.round(f.visual.h)}` : null }))
      .concat(DL.lint(inv, m.tables, null, {}).findings.map((f) => ({ origin: 'lint', rule: f.rule, severity: f.severity, page: f.page, visual: f.visual })));
    const labAll = lab.problems.concat(lab.worthALook);
    chk(() => lab.pages === inv.pages.length && lab.pages >= 3 && lab.visuals >= 20, () => `C-02 ${c.model}. the check read every page: ${lab.pages} pages, ${lab.visuals} visuals`);
    // (the same files as a download has them, under a folder: the same answer)
    chk(() => JSON.stringify(LC.checkProject(built.files.map((f) => Object.assign({}, f, { path: 'Folder/' + f.path })), { lang: c.lang, model: m.tables })) === JSON.stringify(lab), () => `C-02 ${c.model}. the files under a download's folder give the same answer`);
    chk(() => sorted(labAll) === sorted(mcp) && labAll.length === mcp.length, () => `C-02 ${c.model}. the lab's check finds what the MCP's finds: lab ${JSON.stringify(lab.counts)} vs mcp ${JSON.stringify(mcp.reduce((a, f) => Object.assign(a, { [f.rule]: (a[f.rule] || 0) + 1 }), {}))}`);
    chk(() => JSON.stringify(lab) === JSON.stringify(again), () => `C-02 ${c.model}. the same project gives the same answer`);
    chk(() => typeof lab.summary === 'string' && lab.desktop === lab.problems.length && (lab.desktop ? /^\d+ problems? Power BI Desktop would show/ : /^0 problems Power BI Desktop would show/).test(c.lang === 'ar' ? LC.summaryOf(lab, 'en') : lab.summary), () => `C-02 ${c.model}. the answer says what Desktop would show: ${lab.summary}`);
    found[c.model] = { desktop: lab.desktop, worth: lab.worth, counts: lab.counts, problems: lab.problems.map((f) => `${f.rule} p${f.page && f.page.n} ${f.visual || ''}: ${f.what}`) };
  }
  if (process.argv.includes('--show')) console.log(JSON.stringify(found, null, 1));

  // ---------- C-03: the answer, with problems ----------
  const m = loadModel('health', { root: ROOT });
  const built = PL.plannedReport ? PL.plannedReport({ m, tables: m.tables, design: planLayout({ layout: 'exec', lang: 'en' }).design, lang: 'en' }, { second: false, title: 'Broken' }) : null;
  if (built && built.files) {
    const clean = LC.checkProject(built.files, { lang: 'en', model: m.tables });
    // a chart moved past the page's right edge, and a second one laid over the first chart
    const vis = built.files.filter((f) => /\/visual\.json$/.test(f.path)).map((f) => ({ f, j: JSON.parse(String(f.data)) }));
    const charts = vis.filter((v) => /Chart$/.test((v.j.visual || {}).visualType || '') && !v.j.parentGroupName);
    const page = JSON.parse(String(built.files.find((f) => /\/page\.json$/.test(f.path) && !/Tooltip/.test(String(f.data))).data));
    const moved = built.files.map((f) => {
      if (f === charts[0].f) { const j = JSON.parse(String(f.data)); j.position.x = page.width - j.position.width / 2; return Object.assign({}, f, { data: JSON.stringify(j) }); }
      if (f === charts[1].f) { const j = JSON.parse(String(f.data)); Object.assign(j.position, { x: charts[2].j.position.x + 10, y: charts[2].j.position.y + 10 }); return Object.assign({}, f, { data: JSON.stringify(j) }); }
      return f;
    });
    const bad = LC.checkProject(moved, { lang: 'en', model: m.tables }), ar = LC.checkProject(moved, { lang: 'ar', model: m.tables });
    chk(() => bad.desktop > clean.desktop && bad.problems.some((f) => f.rule === 'OFF_PAGE') && bad.problems.some((f) => f.rule === 'OVERLAP'), () => `C-03. a chart off the page and two overlapping are problems Desktop would show: ${JSON.stringify(bad.counts)}`);
    chk(() => new RegExp(`^${bad.desktop} problems Power BI Desktop would show`).test(bad.summary) && /سيُظهرها Power BI Desktop/.test(ar.summary), () => `C-03. the answer counts them, in English and Arabic: ${bad.summary} | ${ar.summary}`);
    chk(() => bad.problems.every((f) => f.rule && f.what && f.fix && (f.visual || f.origin === 'rule')), () => 'C-03. each problem says what and how to fix it, and names its visual by type and place');
    chk(() => LC.summaryOf({ desktop: 0, worth: 0 }, 'en') === '0 problems Power BI Desktop would show', () => 'C-03. a clean project: "0 problems Power BI Desktop would show"');
  } else chk(() => false, () => 'C-03. the planned report of the health model could not be built');
} finally { fs.rmSync(ROOT, { recursive: true, force: true }); }
report();
