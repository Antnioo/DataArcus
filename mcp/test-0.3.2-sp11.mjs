import './test-env.mjs';
// 0.3.2 SP11 (the split: B-280, B-286; mcp/work/SP11.md). A characterisation suite for the Arabic twin's text, button
// and header fitting: for 18 runs of create_arabic_twin (the plan with every text given an Arabic, the click, the write),
// the plan's text and every file of the folder after the write are byte for byte the ones recorded on the base
// (integration/0.3.2 1b5f863, before fitButtons, fitTextboxes and fitHeaders moved from lib/twin-pages.mjs to
// lib/twin-text-fit.mjs). The random ids come from one fixed seed (SP1's fixtures/sp1/seeded-random.mjs, loaded in this
// process first); normalised: the plan id and the working folder (SP13's way). Recorded in fixtures/sp11-twins.json;
// SP11_RECORD=1 records them again (only on the base, never to make a run pass); SP11_DUMP=<file> writes what was
// compared. Made-up reports only: the guards' fixtures (twin-project, the sample project, twin-fuzz's cases, hm2's A1-1)
// and one project written here.
//   T1-T18  each run's plan and files;  C1  the runs reach every fitting path
//   after the move: M1  twin-pages.mjs defines no fitting function and calls the three from twin-text-fit.mjs in the
//   base's order;  M2  twin-text-fit.mjs holds no module state and does no IO
//   (the runs' flow, the fuzz generator and the fitting project: fixtures/twin-runs.mjs, shared with sp26)
//   node test-0.3.2-sp11.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const GOLD = path.join(HERE, 'fixtures', 'sp11-twins.json');
const { ROOT, SP11_CASES: CASES, runCases, summary } = await import('./fixtures/twin-runs.mjs');
const { got, plans } = await runCases(CASES, problems);
if (process.env.SP11_DUMP) fs.writeFileSync(process.env.SP11_DUMP, JSON.stringify({ got, fitted: Object.fromEntries(Object.entries(plans).map(([k, p]) => [k, p && p.fitted])) }, null, 1));
const now = summary(got);
if (process.env.SP11_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp11.mjs: create_arabic_twin\'s plan and write answers and every file of each folder after the write, recorded on the base (normalised: the plan id, the working folder and the path separator)', runs: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).runs;
for (const [name] of CASES) chk(() => gold[name] && JSON.stringify(now[name]) === JSON.stringify(gold[name]),
  () => `${name.split(' ')[0]}. "${name.replace(/^T\d+ /, '')}": the twin's plan, its write and the folder's files are the base's, byte for byte: now ${JSON.stringify(now[name])}, recorded ${JSON.stringify(gold[name] || null)} (SP11_DUMP=<file> writes them)`);

// the runs reach every fitting path: read from the plans' fitted lists and the written twins
const F = (k) => Object.values(plans).flatMap((p) => (p && p.fitted && Array.isArray(p.fitted[k]) ? p.fitted[k] : []));
const t15 = plans['T15 the fitting shapes, their own report'] || {};
const COVER = {
  'every twin written': Object.values(got).every((v) => v.write && !v.write.err),
  'a button widened, the visuals beside it moved': F('buttons').some((x) => x.moved),
  'a button the slicers beside it gave width': F('buttons').some((x) => x.slicersNarrowed),
  'a button\'s text made smaller': F('buttons').some((x) => x.textSize),
  'a button\'s icon switched off': F('buttons').some((x) => x.iconOff),
  'a button with its underline': F('buttons').some((x) => Array.isArray(x.withLine)),
  'a button cut': F('buttonsCut').length > 0,
  'a text box widened or made taller': F('textboxes').length > 0,
  'a text box cut': F('textboxesCut').length > 0,
  'a table header grown': F('headers').length > 0,
  'a table header cut': F('headersCut').some((x) => x.cut === 'cut'),
  'a table header that may be cut': F('headersCut').some((x) => x.cut === 'may be cut'),
  'the table with stale columnWidth entries fitted': JSON.stringify(t15.fitted || {}).includes('tblFit'),
  'a heatmap\'s names table': Object.values(plans).some((p) => p && (p.mirrors || []).some((x) => x && x.kind === 'heatmapNames')) || Object.values(got).some((v) => /heatmapNames/.test(v.plan.t))
};
chk(() => Object.values(COVER).every(Boolean), () => `C1. the runs reach every fitting path: missing ${JSON.stringify(Object.keys(COVER).filter((k) => !COVER[k]))}`);

// ---------- after the move (SP11): twin-pages.mjs calls the fitting it imports from twin-text-fit.mjs ----------
const SRC = (f) => fs.readFileSync(path.join(HERE, 'lib', f), 'utf8');
if (fs.existsSync(path.join(HERE, 'lib', 'twin-text-fit.mjs'))) {
  const pages = SRC('twin-pages.mjs'), fit = SRC('twin-text-fit.mjs'), Fit = await import('./lib/twin-text-fit.mjs');
  const calls = ['fitButtons(page, r.visuals, c, pg.id)', 'fitHeaders(page, r.visuals, origByName, c, pg.id)', 'keepView(page, r.visuals, pg.id)', 'fitTextboxes(page, r.visuals, c, pg.id, keep, kept)', 'iconRoom(r.visuals', 'keepSize(pg.visuals'].map((t) => pages.indexOf(t));
  chk(() => ['fitButtons', 'fitTextboxes', 'fitHeaders'].every((f) => typeof Fit[f] === 'function' && !new RegExp('function ' + f + '\\(').test(pages) && new RegExp('function ' + f + '\\(').test(fit))
    && /^import \{ HIDDEN_W, fitButtons, fitTextboxes, fitHeaders \} from '\.\/twin-text-fit\.mjs';$/m.test(pages) && Fit.HIDDEN_W === 10 && !/const HIDDEN_W = /.test(pages)
    && calls.every((i, k) => i > 0 && (k === 0 || i > calls[k - 1])),
  () => `M1 twin-pages.mjs defines no fitting function, imports fitButtons, fitTextboxes, fitHeaders and HIDDEN_W from twin-text-fit.mjs and calls them in the base's order (buttons, headers, keepView, text boxes, iconRoom, keepSize last): ${JSON.stringify(calls)}`);
  chk(() => !/^(let|var) /m.test(fit) && !/node:fs|readFileSync|writeFileSync|process\.|globalThis|Date\.now|Math\.random/.test(fit)
    && [...fit.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]).every((m) => ['./read-report.mjs', './twin-read.mjs', './twin-visuals.mjs', 'node:module'].includes(m))
    && [...fit.matchAll(/^const (\w+) = /gm)].map((m) => m[1]).every((n) => ['require', 'Mirror', 'Rules', 'HIDDEN_W'].includes(n) || /^[A-Z_]+$/.test(n)),
  () => 'M2 twin-text-fit.mjs holds no module state (no top-level let or var; constants and the engines only) and does no IO (no fs, process, clock or randomness); it imports only read-report, twin-read, twin-visuals and the engines');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp11.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp11  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp11  ${checks} checks`);
