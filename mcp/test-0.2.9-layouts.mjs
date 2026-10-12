// 0.2.9, the design block's layout matrix (the reviewer, with the owner's go, 12 Oct): almost every check used the
// executive layout. Here every layout meets every page size, every KPI count and every filter position at least once,
// left to right and right to left, on the synthetic models only (ramadan, arabic-long-names, no-measures,
// large-synthetic). Each report written is checked: Microsoft's validator clean; the DataArcus lint without overlap,
// cut text or a visual off the page; no visual written without its fields; the second page where it should be; the
// right-to-left report the left-to-right one mirrored; the plan's lint the written report's (as v029c L2); and a table
// ending where the visual beside it ends (the table-height and panel rules, in the operations layout's third-wide tile).
// Tests only: a failure is a defect to report, by block, not a reason to change what is expected here.
//   node test-0.2.9-layouts.mjs           (npm test runs it after the golden baseline)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';
import { validatorCounts } from './test-validator.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-layouts-')), t0 = Date.now();
const copy = (from, to) => fs.cpSync(path.join(REPO, from), path.join(ROOT, to), { recursive: true });
copy('scripts/tests/fixtures/model-health/tmdl-ramadan/definition', 'ramadan/Ramadan Test.SemanticModel/definition');
fs.writeFileSync(path.join(ROOT, 'ramadan/Ramadan Test.SemanticModel/definition.pbism'), '{ "version": "4.0", "settings": {} }');
copy('mcp/test-models/arabic-long-names', 'arabic');
copy('mcp/test-models/no-measures', 'plain');
copy('mcp/test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');

const s = await serverClient(ROOT), call = withPlans(s.call);
const problems = [], known = []; let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

// ---------- the matrix: every layout x (page, kpis, filters) in a Latin square, each in both directions ----------
const LAYOUTS = ['exec', 'analysis', 'ops', 'focus'], PAGES = ['1920x1080', '1280x720', '960x720', '640x360'], KPIS = [0, 3, 4, 6], FILTERS = ['none', 'start', 'end', 'top'];
const MODELS = [{ path: 'ramadan' }, { path: 'arabic' }, { path: 'plain' }, { path: 'large', focus: 'logistics' }];
const combos = [];
LAYOUTS.forEach((layout, li) => [0, 1, 2, 3].forEach((i) => combos.push({ layout, page: PAGES[i], kpis: KPIS[(i + li) % 4], filters: FILTERS[(i + 2 * li + li % 2) % 4], model: MODELS[(i + li) % 4] })));
// every layout meets every page size, KPI count and filter position (checked here, so a change to the square can't drop one)
LAYOUTS.forEach((l) => { const c = combos.filter((x) => x.layout === l);
  check(PAGES.every((p) => c.some((x) => x.page === p)) && KPIS.every((k) => c.some((x) => x.kpis === k)) && FILTERS.every((f) => c.some((x) => x.filters === f)), `the matrix: ${l} must meet every page, KPI count and filter position`); });

// (polish round P2) 0 errors outside the known-false entry, its hits exactly the report's slicer boxes (test-validator.mjs)
const validate = (dir) => {
  const r = validatorCounts(dir);
  if (!r.ran) return 'the validator did not run';
  return r.errors.map((e) => `${e.code}: ${e.message.slice(0, 80)}`).join('; ');
};
// a written report: its pages in order (tooltip pages apart), each with its top-level visuals at page positions
const readReport = (dir) => {
  const D = path.join(dir, 'definition', 'pages'), order = JSON.parse(fs.readFileSync(path.join(D, 'pages.json'), 'utf8')).pageOrder;
  return order.map((id) => { const pj = JSON.parse(fs.readFileSync(path.join(D, id, 'page.json'), 'utf8')), vd = path.join(D, id, 'visuals');
    const vs = fs.existsSync(vd) ? fs.readdirSync(vd).map((n) => JSON.parse(fs.readFileSync(path.join(vd, n, 'visual.json'), 'utf8'))) : [];
    const by = Object.fromEntries(vs.map((v) => [v.name, v]));
    vs.forEach((v) => { const g = v.parentGroupName && by[v.parentGroupName] ? by[v.parentGroupName].position : { x: 0, y: 0 }; v.at = { x: v.position.x + g.x, y: v.position.y + g.y, w: v.position.width, h: v.position.height }; });
    return { page: pj, tooltip: pj.type === 'Tooltip', visuals: vs }; });
};
const DATA = /Chart$|^tableEx$|^cardVisual$|^slicer$|^pivotTable$|^gauge$/;
const BAD_LINT = ['OVERLAP', 'OFF_PAGE', 'TEXTBOX_FITS', 'BUTTON_ONE_LINE', 'SLICER_FITS', 'TEXT_SIZE_RANGE'];
const label = (c, dir) => `${c.layout} ${c.page} kpis ${c.kpis} filters ${c.filters} ${dir} (${c.model.path})`;

const written = {};
for (const c of combos) for (const dir of ['ltr', 'rtl']) {
  const tag = label(c, dir), name = `L ${c.layout} ${c.page} ${c.kpis} ${c.filters} ${dir}`;
  // (a page size other than the four named ones is given as { w, h })
  const pageArg = c.page === '640x360' ? { w: 640, h: 360 } : c.page;
  const args = Object.assign({ path: c.model.path, layout: c.layout, page: pageArg, kpis: c.kpis, filters: c.filters, lang: 'en', dir }, c.model.focus ? { focus: c.model.focus } : {});
  const pl = await call('plan_layout', args);
  if (pl.err || !pl.j.design) { check(false, `${tag}: plan_layout refused: ${(pl.t || '').slice(0, 200)}`); continue; }
  const r = await call('create_report', Object.assign({ path: c.model.path, name, design: pl.j.design, lang: 'en', dir }, c.model.focus ? { focus: c.model.focus } : {}));
  if (r.err) { check(false, `${tag}: create_report refused: ${r.t.slice(0, 200)}`); continue; }
  const dir0 = path.join(ROOT, c.model.path, r.j.report), pages = readReport(dir0), main = pages.filter((p) => !p.tooltip);
  written[c.layout + c.page + c.kpis + c.filters + c.model.path + dir] = main;
  // 1. Microsoft's validator
  const v = validate(dir0); check(!v, `${tag}: Microsoft's validator: ${v}`);
  // 2. the DataArcus lint: no overlap, no cut text, nothing off the page
  const cl = await call('check_report', { path: `${c.model.path}/${r.j.report}`, checks: ['lint', 'sizes'] });
  const all = []; const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (typeof o.rule === 'string') all.push(o); Object.values(o).forEach(walk); } };
  if (!cl.err) walk(cl.j);
  const bad = cl.err ? [cl.t.slice(0, 120)] : all.filter((f) => BAD_LINT.includes(f.rule)).map((f) => `${f.rule} ${typeof f.visual === 'string' ? f.visual : ''} ${typeof f.file === 'string' ? f.file.split('/').slice(-2).join('/') : ''}`);
  check(!bad.length, `${tag}: the lint: ${bad.slice(0, 4).join(' | ')}`);
  // 3. no visual written without its fields (Microsoft's PBIR_QUERY_STATE_MISSING; Desktop shows an empty box)
  const empty = main.flatMap((p) => p.visuals.filter((x) => x.visual && DATA.test(x.visual.visualType) && !Object.values(((x.visual.query || {}).queryState) || {}).some((role) => (role.projections || []).length)).map((x) => `${p.page.displayName}: ${x.visual.visualType}`));
  check(!empty.length, `${tag}: visuals without fields: ${empty.slice(0, 4).join(', ')}`);
  // 4. the second page where it should be: every page but the small one (640 x 360) has its details page
  const small = c.page === '640x360';
  check(main.length === (small ? 1 : 2), `${tag}: ${main.length} report pages, ${small ? 1 : 2} expected`);
  // 5. the plan's lint is the written report's, page 1, rule for rule (v029c L2)
  const rules = (fs2) => fs2.filter((f) => f.page.n === 1).map((f) => `${f.rule}|${f.visual}`).sort();
  const dl = pl.j.designLint || {};
  if (!cl.err && Array.isArray(dl.findings)) { const a = rules(dl.findings), b = rules((cl.j.lint || {}).findings || []);
    // (a known defect, reported to the checks block, 12 Oct: plan_layout's design lint names a visual by its title,
    // check_report's lint never names report text; the same rule at the same place is the same finding, told apart
    // only by that label: counted and listed as known, not failed. Any other difference fails.)
    const where = (x) => x.replace(/\|(\S+)( "(?:[^"\\]|\\.)*")? at /, '|$1 at ');
    if (JSON.stringify(a) !== JSON.stringify(b) && JSON.stringify(a.map(where).sort()) === JSON.stringify(b.map(where).sort())) known.push(`${tag}: ${a.filter((x) => !b.includes(x)).length} finding(s) labelled by title in the plan only`);
    else check(JSON.stringify(a) === JSON.stringify(b), `${tag}: the plan's lint is not the report's: only the plan's ${JSON.stringify(a.filter((x) => !b.includes(x)))}, only the report's ${JSON.stringify(b.filter((x) => !a.includes(x)))}`); }
  else check(!!dl.skipped, `${tag}: plan_layout gave no lint and no reason: ${JSON.stringify(dl).slice(0, 120)}`);
  // 6. a table's panel ends where the visual beside it in its row ends (the table-height and panel rules: S3 with N6, the
  //    writer's bfd2904: the table ends on a whole row, its panel, the "No data" card or an empty text box, keeps the slot)
  main.forEach((p) => p.visuals.filter((x) => x.visual && x.visual.visualType === 'tableEx').forEach((t) => {
    const panel = p.visuals.filter((x) => x === t || (x.visual && /^(cardVisual|textbox)$/.test(x.visual.visualType) && Math.abs(x.at.x - t.at.x) <= 1 && Math.abs(x.at.y - t.at.y) <= 1 && Math.abs(x.at.w - t.at.w) <= 1));
    const end = Math.max(...panel.map((x) => x.at.y + x.at.h));
    const nb = p.visuals.filter((x) => x !== t && x.visual && /Chart$/.test(x.visual.visualType) && Math.abs(x.at.y - t.at.y) <= 1);
    nb.forEach((x) => check(Math.abs(x.at.y + x.at.h - end) <= 1, `${tag}, ${p.page.displayName}: the table's panel ends at ${end} (the table at ${t.at.y + t.at.h}), the ${x.visual.visualType} beside it at ${x.at.y + x.at.h}`)); }));
}
// 7. right to left is the left-to-right report mirrored: each page's data visuals, by kind and row, at x -> W - x - w
for (const c of combos) {
  const l = written[c.layout + c.page + c.kpis + c.filters + c.model.path + 'ltr'], r = written[c.layout + c.page + c.kpis + c.filters + c.model.path + 'rtl'];
  if (!l || !r) continue;
  l.forEach((pl0, i) => { const pr = r[i]; if (!pr) return check(false, `${label(c, 'rtl')}: page ${i + 1} missing`);
    const W = pl0.page.width, key = (x) => x.visual.visualType + '@' + Math.round(x.at.y) + 'x' + Math.round(x.at.h);
    const dataL = pl0.visuals.filter((x) => x.visual && /Chart$|^tableEx$/.test(x.visual.visualType)), dataR = pr.visuals.filter((x) => x.visual && /Chart$|^tableEx$/.test(x.visual.visualType));
    const off = dataL.filter((x) => !dataR.some((y) => key(y) === key(x) && Math.abs(y.at.w - x.at.w) <= 2 && Math.abs(y.at.x - (W - x.at.x - x.at.w)) <= 2));
    check(dataL.length === dataR.length && !off.length, `${label(c, 'rtl')}, page ${i + 1}: not the left-to-right page mirrored: ${off.slice(0, 3).map((x) => key(x) + ' at x ' + x.at.x).join(', ')} (${dataL.length} vs ${dataR.length} data visuals)`); });
}
await s.close(); fs.rmSync(ROOT, { recursive: true, force: true });
const secs = Math.round((Date.now() - t0) / 1000);
if (known.length) console.warn(`KNOWN DEFECT (lint labels, the checks block): ${known.length} report(s)\n` + known.map((k) => '      - ' + k).join('\n'));
console.log(problems.length ? `FAIL  layouts  ${combos.length * 2} reports, ${checks} checks, ${problems.length} failed, ${secs}s\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  layouts  ${combos.length * 2} reports, ${checks} checks, ${secs}s`);
process.exit(problems.length ? 1 : 0);
