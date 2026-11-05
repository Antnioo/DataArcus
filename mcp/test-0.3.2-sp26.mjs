import './test-env.mjs';
// 0.3.2 SP26 (the split: B-280, B-286; mcp/work/SP26.md). A characterisation suite for the Arabic twin's geometry: the
// badges and units on a text or titled host (badgesWithText), the bar charts and side margins around tables and
// matrices (aroundTables), a chart lined up with its heatmap's grid (underGrids, landsOn, keepInside), a text box's
// indentation (indentToEnd) and its icon's room (iconRoom). For 23 runs of create_arabic_twin (the plan with every text
// given an Arabic, the click, the write), the plan's text and every file of the folder after the write are byte for
// byte the ones recorded on the base (integration/0.3.2 fe4cc82, before they moved from lib/twin-pages.mjs to
// lib/twin-geometry.mjs). The runs' flow is sp11's (fixtures/twin-runs.mjs: one fixed seed, normalised plan id and
// working folder). Recorded in fixtures/sp26-twins.json; SP26_RECORD=1 records them again (only on the base, never to
// make a run pass); SP26_DUMP=<file> writes what was compared. Made-up reports only.
//   T1-T18  sp11's runs (the guards' fixtures, twin-fuzz's cases and seeds, hm2's A1-1, the fitting project)
//   T19-T21 hm1's N1-25, M1-1, F1-1;  T22-T23 the geometry project (its own report, both languages in one)
//   C1  the runs reach every geometry path
//   after the move: M1  twin-pages.mjs defines none of them, imports them from twin-geometry.mjs and calls them in
//   the base's order, keepSize last;  M2  twin-geometry.mjs holds no state, does no IO, reads the left-to-right kinds
//   from mirror-policy.js and lists no visual type of its own
//   node test-0.3.2-sp26.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const GOLD = path.join(HERE, 'fixtures', 'sp26-twins.json');
const H = await import('./fixtures/twin-runs.mjs');
const { ROOT, rd } = H;
const CASES = H.SP26_CASES;   // (the geometry project and the 23 runs: fixtures/twin-runs.mjs, SP40)

const { got, plans } = await H.runCases(CASES, problems);
if (process.env.SP26_DUMP) fs.writeFileSync(process.env.SP26_DUMP, JSON.stringify({ got, plans }, null, 1));
const now = H.summary(got);
if (process.env.SP26_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp26.mjs: create_arabic_twin\'s plan and write answers and every file of each folder after the write, recorded on the base (normalised: the plan id, the working folder and the path separator)', runs: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).runs;
for (const [name] of CASES) chk(() => gold[name] && JSON.stringify(now[name]) === JSON.stringify(gold[name]),
  () => `${name.split(' ')[0]}. "${name.replace(/^T\d+ /, '')}": the twin's plan, its write and the folder's files are the base's, byte for byte: now ${JSON.stringify(now[name])}, recorded ${JSON.stringify(gold[name] || null)} (SP26_DUMP=<file> writes them)`);

// the runs reach every geometry path: the rules the plans name, and the geometry project's written twin
const said = Object.values(got).map((v) => v.plan.t).join('\n');
const g1 = path.join(ROOT, 'g1', 'Synthetic AR.Report', 'definition', 'pages');
const twinV = (n) => { try { const p = fs.readdirSync(g1).find((d) => fs.existsSync(path.join(g1, d, 'visuals', n, 'visual.json'))); return p ? rd(path.join(g1, p, 'visuals', n, 'visual.json')) : null; } catch (e) { return null; } };
const parasOf = (v) => (v && v.visual && v.visual.objects && v.visual.objects.general ? v.visual.objects.general[0].properties.paragraphs : []);
const runsOf = (pa) => (pa && Array.isArray(pa.textRuns) ? pa.textRuns.map((r) => r.value) : []);
const COVER = {
  'every twin written': Object.values(got).every((v) => v.write && !v.write.err),
  'a small visual on a text box: to its other end': /a small visual on a text box: to its other end with the text/.test(said),
  'a small visual on a visual whose text or title turns right': /a small visual on a visual whose text or title turns right/.test(said),
  'a bar chart over a table kept on it': /a bar chart over a table or matrix that stays left to right/.test(said),
  'a visual in a matrix\'s side margin narrowed': /in a matrix's side margin: narrowed off its row headers/.test(said),
  'a chart kept lined up with its heatmap\'s grid': /kept lined up with its heatmap/.test(said),
  'a chart kept at its mirror (landsOn)': /kept at its mirror, its inside as English/.test(said),
  'a small visual kept on its host would cover another': /a small visual kept on its host would cover another/.test(said),
  'a text box ends before its icon': /a text box ends before the icon on its end/.test(said),
  'the indentation moved to the end': (() => { const r = runsOf(parasOf(twinV('kpiT'))[0]); return r.length === 2 && /^\t+$/.test(r[1]) && !/^\s*$/.test(r[0]); })(),
  'the icon\'s room in the title as no-break spaces': (() => { const r = runsOf(parasOf(twinV('kpiT2'))[0]); return r.length === 2 && /^ +$/.test(r[1]); })(),
  'a heatmap\'s names table': /heatmapNames|names table/.test(said)
};
chk(() => Object.values(COVER).every(Boolean), () => `C1. the runs reach every geometry path: missing ${JSON.stringify(Object.keys(COVER).filter((k) => !COVER[k]))}`);

// ---------- after the move (SP26): twin-pages.mjs calls the geometry it imports from twin-geometry.mjs ----------
const SRC = (f) => fs.readFileSync(path.join(HERE, 'lib', f), 'utf8');
const GEOM = ['badgesWithText', 'aroundTables', 'underGrids', 'indentToEnd', 'iconRoom'];
if (fs.existsSync(path.join(HERE, 'lib', 'twin-geometry.mjs'))) {
  const pages = SRC('twin-pages.mjs'), geo = SRC('twin-geometry.mjs'), G = await import('./lib/twin-geometry.mjs');
  const calls = ['badgesWithText(pg, r)', 'aroundTables(pg, r, opts)', 'heatmapNames(vj', 'underGrids(pg, r, pageOf(pg).width, extra)', 'indentToEnd(pg.visuals[i].json, vj)', 'fitButtons(page', 'fitTextboxes(page', 'iconRoom(r.visuals, (r.moved = r.moved || []))', 'keepSize(pg.visuals', 'indentToEnd(v.mobile.json, m)'].map((t) => pages.indexOf(t));
  const helpers = ['keepInside', 'landsOn', 'titleRoom', 'textTurns', 'titleAlign', 'titleTurns', 'staysLtr', 'paragraphsIn', 'GRID_CHARTS', 'ICON_GAP'];
  chk(() => GEOM.concat(['keptAtMirrorLine']).every((f) => typeof G[f] === 'function' && !new RegExp('function ' + f + '\\(').test(pages) && new RegExp('export function ' + f + '\\(').test(geo))
    && helpers.every((h) => !new RegExp('(const|function) ' + h + '\\b').test(pages))
    && /^import \{ [^}]*\bbadgesWithText\b[^}]*\} from '\.\/twin-geometry\.mjs';$/m.test(pages) && /^export \{ keptAtMirrorLine \} from '\.\/twin-geometry\.mjs';$/m.test(pages)
    && calls.every((i, k) => i > 0 && (k === 0 || i > calls[k - 1])),
  () => `M1 twin-pages.mjs defines none of ${GEOM.join(', ')} or their helpers, imports them from twin-geometry.mjs (keptAtMirrorLine re-exported) and calls them in the base's order (badges, tables, names, grids, indentation, buttons, text boxes, icon room, keepSize, the phone's indentation): ${JSON.stringify(calls)}`);
  chk(() => !/^(let|var) /m.test(geo) && !/node:fs|readFileSync|writeFileSync|process\.|globalThis|Date\.now|Math\.random/.test(geo)
    && [...geo.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]).every((m) => ['./read-report.mjs', './twin-read.mjs', './twin-visuals.mjs', './page-picture.mjs', './box-overlap.mjs', 'node:module'].includes(m))
    && /require\('\.\.\/\.\.\/assets\/js\/mirror-policy\.js'\)/.test(geo) && /Policy\.keepsGridLtr\(/.test(geo)
    && !/'matrix'[^;\n]*\|\|[^;\n]*'table'|'table'[^;\n]*\|\|[^;\n]*'matrix'/.test(geo),
  () => 'M2 twin-geometry.mjs holds no module state (no top-level let or var) and does no IO (no fs, process, clock or randomness); it imports only read-report, twin-read, twin-visuals, page-picture, box-overlap (DD2O) and the engines, and reads the kinds that keep left to right from mirror-policy.js (keepsGridLtr), with no list of its own');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp26.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp26  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp26  ${checks} checks`);
