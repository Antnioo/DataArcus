// 0.3.1 TB2 (the laptop part 4, blocks C1, C5, C6, 28 Oct; Power BI Desktop 2.159): check_report said "can break the
// report in Power BI Desktop" on hand-built reports that opened in Desktop with no error banner. Ten validator codes were
// counted on those reports (scripts/tests/DESKTOP-TESTS.md, 2026-10-28): each is now the kind openedInDesktop, with its
// measurement; a code not measured stays canBreak. The plan's own check (checkArtifact, which create_report and
// plan_layout say) counts the same kinds from the same table (impactOf).
//   B1      the made-up fixture gives each of the ten codes (and the unmeasured control, PBIR_VISUAL_TYPE_UNKNOWN)
//   B2-B11  check_report: each measured code's findings are openedInDesktop, never canBreak
//   B12     the kind's sentence and each code's measurement (Desktop version, date, "opened with no error"; a missing
//           required role also names the 11 Oct proof of an empty visual)
//   B13     the unmeasured control and a schema error stay canBreak
//   B14-B15 the summary: the measured fixture says no "can break"; the control's says "can break" for the control only
//   B16     the plan's check (checkArtifact) counts the same kinds as check_report on the same files
//   B17     validatorVerdict in English and Arabic
//   node test-0.3.1-tb2.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import * as CR from './lib/check-report.mjs';
import { checkArtifact } from './lib/artifact.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const put = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2)); };
const MEASURED = ['PBIR_FORMATTING_PROP_NESTED', 'PBIR_FILTER_NAME_DUPLICATE_GLOBAL', 'PBIR_ROLE_REQUIRED_MISSING', 'PBIR_SLICER_HEIGHT_BELOW_FLOOR', 'PBIR_ROLE_MAX_EXCEEDED',
  'PBIR_SCATTER_NO_GROUPING', 'PBIR_DRILLTHROUGH_BACK_BUTTON_MISSING', 'PBIR_VISUAL_TYPE_DEPRECATED', 'PBIR_BOOKMARK_ACTION_TARGET_MISSING', 'PBIR_THEME_VISUAL_UNKNOWN'];
const CONTROL = 'PBIR_VISUAL_TYPE_UNKNOWN';

// ---------- the fixture: the twin project (made-up names), with one made-up shape per measured code ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tb2-')));
const lit = (v) => ({ expr: { Literal: { Value: v } } });
const col = (p) => ({ field: { Column: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: p } }, queryRef: 'Sales.' + p, nativeQueryRef: p });
const mea = (p) => ({ field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: p } }, queryRef: 'Sales.' + p, nativeQueryRef: p });
const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
const vis = (name, y, visual, h) => ({ $schema: VS, name, position: { x: 40, y, z: 1000, height: h || 200, width: 300, tabOrder: 1000 }, visual });
const filt = (name) => ({ name, field: col('Region').field, type: 'Categorical' });
function fixture(name, control) {
  const d = path.join(ROOT, name), R = path.join(d, 'Twin Sales.Report'), DEF = path.join(R, 'definition');
  fs.cpSync(path.join(HERE, 'fixtures', 'twin-project'), d, { recursive: true });
  const V = (page, v) => put(path.join(DEF, 'pages', page, 'visuals', v.name, 'visual.json'), v);
  // PBIR_FORMATTING_PROP_NESTED: a property written inside another property's expr
  V('p2details', vis('labNested', 300, { visualType: 'clusteredColumnChart', query: { queryState: { Category: { projections: [col('Region')] }, Y: { projections: [mea('Total Sales')] } } },
    objects: { legend: [{ properties: { show: { expr: { Literal: { Value: 'true' } }, position: lit("'Top'") } } }] } }));
  // PBIR_ROLE_REQUIRED_MISSING: a column chart with no category
  V('p2details', vis('labNoCat', 520, { visualType: 'clusteredColumnChart', query: { queryState: { Y: { projections: [mea('Total Sales')] } } } }));
  // PBIR_ROLE_MAX_EXCEEDED: a card with two values
  V('p2details', vis('labTwoVals', 740, { visualType: 'card', query: { queryState: { Values: { projections: [mea('Total Sales'), mea('Orders')] } } } }, 120));
  // PBIR_SCATTER_NO_GROUPING: a scatter chart with no category or legend
  V('p2details', vis('labScatter', 300, { visualType: 'scatterChart', query: { queryState: { X: { projections: [mea('Total Sales')] }, Y: { projections: [mea('Orders')] } } } }));
  // PBIR_VISUAL_TYPE_DEPRECATED: the legacy map
  V('p2details', vis('labMap', 520, { visualType: 'map', query: { queryState: { Category: { projections: [col('Region')] } } } }));
  // PBIR_BOOKMARK_ACTION_TARGET_MISSING: a bookmark button with no bookmark
  V('p2details', vis('labBookmark', 860, { visualType: 'actionButton', visualContainerObjects: { visualLink: [{ properties: { show: lit('true'), type: lit("'Bookmark'") } }] } }, 40));
  // PBIR_SLICER_HEIGHT_BELOW_FLOOR: a dropdown slicer 40 high
  V('p2details', vis('labSlicer', 940, { visualType: 'slicer', query: { queryState: { Values: { projections: [col('Region')] } } }, objects: { data: [{ properties: { mode: lit("'Dropdown'") } }] } }, 40));
  // PBIR_FILTER_NAME_DUPLICATE_GLOBAL: one filter name on two pages
  for (const pg of ['p1overview', 'p2details']) { const f = path.join(DEF, 'pages', pg, 'page.json'), j = J(f); j.filterConfig = { filters: [filt('labRegionFilter')] }; put(f, j); }
  // PBIR_DRILLTHROUGH_BACK_BUTTON_MISSING: a drillthrough page, its filter and parameter bound, no back button
  put(path.join(DEF, 'pages', 'p4drill', 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: 'p4drill', displayName: 'Region detail', displayOption: 'FitToPage', width: 1920, height: 1080,
    type: 'Drillthrough', pageBinding: { name: 'labBinding', type: 'Drillthrough', parameters: [{ name: 'labParam', boundFilter: 'labDrillFilter', fieldExpr: col('Product').field }] },
    filterConfig: { filters: [Object.assign(filt('labDrillFilter'), { field: col('Product').field, howCreated: 'Drillthrough' })] } });
  V('p4drill', vis('labDrillCard', 100, { visualType: 'card', query: { queryState: { Values: { projections: [mea('Total Sales')] } } } }, 120));
  { const f = path.join(DEF, 'pages', 'pages.json'), j = J(f); j.pageOrder = (j.pageOrder || []).concat('p4drill'); put(f, j); }
  // PBIR_THEME_VISUAL_UNKNOWN: a theme style for a visual no catalog lists
  { const f = path.join(R, 'StaticResources', 'RegisteredResources', 'twin-theme.json'), j = J(f); j.visualStyles = { labNoSuchVisual: { '*': { title: [{ show: true }] } } }; put(f, j); }
  // the unmeasured control: a visual type no catalog lists
  if (control) V('p2details', vis('labUnknown', 300, { visualType: 'labNoSuchVisualType' }));
  return 'Twin Sales.pbip';
}
fixture('measured', false); fixture('control', true);

// the project's files in memory, as create_report hands them to the plan's check
const filesOf = (d) => { const out = []; const walk = (x) => { for (const e of fs.readdirSync(x, { withFileTypes: true })) { const p = path.join(x, e.name); if (e.isDirectory()) walk(p); else out.push({ path: path.relative(d, p).split(path.sep).join('/'), data: fs.readFileSync(p) }); } };
  walk(d); return out.filter((f) => !/\.SemanticModel\//.test(f.path)); };
const tablesOf = (d) => J(path.join(d, 'Twin Sales.SemanticModel', 'model.bim')).model.tables;

const s = await serverClient(ROOT, {});
try {
  const m = await s.call('check_report', { path: 'measured/Twin Sales.pbip', maxFindings: 200 });
  const c = await s.call('check_report', { path: 'control/Twin Sales.pbip', maxFindings: 200 });
  const F = (x) => ((x.j && x.j.findings) || []).filter((f) => f.origin === 'validator');
  const short = (x) => (x.err ? String(x.t).slice(0, 300) : JSON.stringify({ summary: x.j.impact.summary, byImpact: x.j.counts.byImpact, codes: F(x).map((f) => f.rule + ':' + f.impact) }).slice(0, 1500));
  // B1: the fixture reproduces each code (a guard: green before and after)
  chk(() => !m.err && m.j.validator.ran && MEASURED.every((k) => F(m).some((f) => f.rule === k)) && !F(m).some((f) => f.rule === CONTROL) && F(c).some((f) => f.rule === CONTROL),
    () => `B1. the made-up fixture gives each measured code once at least, the control only in its own copy: ${short(m)}`);
  // B2-B11: each measured code is openedInDesktop
  MEASURED.forEach((k, i) => chk(() => F(m).filter((f) => f.rule === k).length > 0 && F(m).filter((f) => f.rule === k).every((f) => f.impact === 'openedInDesktop'),
    () => `B${i + 2}. ${k}: openedInDesktop (measured on reports that opened in Desktop 2.159), not "can break": ${F(m).filter((f) => f.rule === k).map((f) => f.impact).join(', ')}`));
  // B12: the kind's sentence and the measurement of each code
  const K = m.j && m.j.impact.kinds.openedInDesktop;
  chk(() => K && K.count === F(m).filter((f) => MEASURED.includes(f.rule)).length && /opened/.test(K.means) && /saving/i.test(K.means) && !/can break/i.test(K.means)
    && MEASURED.every((k) => K.measured && /DESKTOP-TESTS\.md/.test(K.measured[k]) && /2026-10-28/.test(K.measured[k]) && /2\.159/.test(K.measured[k]) && /opened with no error/.test(K.measured[k])) && /may show nothing/.test(K.measured.PBIR_ROLE_REQUIRED_MISSING),
  () => `B12. the kind openedInDesktop: its count, its sentence, each code's measurement (Desktop 2.159, 2026-10-28, "opened with no error"): ${JSON.stringify(K)}`);
  // B13: a code not measured stays canBreak (never loosened without a measurement)
  chk(() => F(c).filter((f) => f.rule === CONTROL).every((f) => f.impact === 'canBreak') && CR.impactOf({ origin: 'schema', rule: 'SCHEMA', severity: 'error' }) === 'canBreak'
    && CR.impactOf({ origin: 'validator', rule: 'PBIR_DRILLTHROUGH_FILTER_MISSING', severity: 'warning', file: 'x', _base: 'page.json' }) === 'canBreak',
  () => `B13. the unmeasured control, a schema error and an unmeasured drillthrough warning stay canBreak: ${short(c)}`);
  // B14-B15: what the summary says
  chk(() => m.j.counts.byImpact.canBreak === 0 && !/can break/i.test(m.j.impact.summary) && /opened/.test(m.j.impact.summary),
    () => `B14. the measured fixture: nothing "can break", the summary says Desktop opened reports with them: ${short(m)}`);
  chk(() => c.j.counts.byImpact.canBreak === F(c).filter((f) => f.rule === CONTROL).length && /^1 finding can break/.test(c.j.impact.summary) && /opened/.test(c.j.impact.summary),
    () => `B15. the control: only the unmeasured code can break; the measured ones are said apart: ${short(c)}`);
  // B16: the plan's check counts the same kinds from the same table
  const d = path.join(ROOT, 'measured'), a = await checkArtifact(filesOf(d), tablesOf(d), 'en', { skip: ['rules', 'lint', 'references', 'layout'] });
  const vk = (a.checks && a.checks.validator && a.checks.validator.kinds) || {}, bi = m.j.counts.byImpact;
  const vOnly = (k) => F(m).filter((f) => f.impact === k && !f.known).length;
  chk(() => a.checks.validator.ran && (vk.openedInDesktop || 0) === vOnly('openedInDesktop') && (vk.canBreak || 0) === vOnly('canBreak') && (vk.canBreak || 0) === 0 && bi.openedInDesktop === vOnly('openedInDesktop'),
    () => `B16. the plan's check and check_report: the same kinds on the same files: plan ${JSON.stringify(vk)}, check_report ${JSON.stringify(bi)}`);
  // B17: the one sentence both tools say
  const en = CR.validatorVerdict({ openedInDesktop: 3 }, 'en'), ar = CR.validatorVerdict({ openedInDesktop: 3 }, 'ar'), both = CR.validatorVerdict({ canBreak: 1, openedInDesktop: 2 }, 'en');
  chk(() => /opened/.test(en) && !/can break/i.test(en) && /[؀-ۿ]/.test(ar) && /Power BI Desktop/.test(ar) && /can break/.test(both) && /opened/.test(both),
    () => `B17. validatorVerdict says openedInDesktop in English and Arabic, and canBreak beside it: ${JSON.stringify([en, ar, both])}`);
} catch (e) { problems.push('the suite threw: ' + (e && e.stack || e)); }
finally { await s.close(); try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* the OS temp folder clears it */ } }

if (problems.length) { console.log(`FAIL script=test-0.3.1-tb2.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  tb2  ${checks} checks`); process.exit(1); }
console.log(`PASS  tb2  ${checks} checks`);
