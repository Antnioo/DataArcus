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
const { ROOT, VS, L, Q, obj, fcol, fmea, query, materialize, rd } = H;

// ---- the geometry project (made up, 1280 x 720, twin-fuzz's model) ----
// kpiT: a KPI text box, its title indented with tabs, its icon kpiI on its left end (Call Center's KPI shape: the
// indentation goes to the end, the icon to the text's other end, the box ends before it); kpiT2: the same with a second
// paragraph (the box keeps its width, the icon's room goes to the title as no-break spaces); cardK: a card with its own
// title and a small icon on it (to the card's other end); tbl: a table with a bar chart drawn over it (kept on it, its
// direction kept); mx: a matrix with a card in its right margin (narrowed off its row headers) and a column chart under
// it lined up with its grid (heatmap rows and columns: its names table, the chart kept lined up); noteI: an icon on a
// panel, lying on a text box over that panel (to the text box's other end with its text); cardPI: an icon on a card
// with no title, kept on it it would lie on mark, which it does not touch in English (mirrored on its own)
const pos = (x, y, width, height, z) => ({ x, y, width, height, z, tabOrder: z });
const run = (value, pt) => ({ value, textStyle: { fontFamily: 'Segoe UI', fontSize: (pt || 14) + 'pt' } });
const tb = (name, p, paragraphs) => ({ $schema: VS, name, position: p, visual: { visualType: 'textbox', objects: { general: obj({ paragraphs }) } } });
const img = (name, p) => ({ $schema: VS, name, position: p, visual: { visualType: 'image', objects: { general: obj({ imageUrl: Q('synthetic.svg') }) } } });
const titled = (text) => ({ title: obj({ show: L('true'), text: Q(text) }) });
const GEO = { pages: [{ id: 'p0', width: 1280, height: 720, visuals: [
  tb('kpiT', pos(40, 40, 300, 60, 1000), [{ textRuns: [run('\t\t\t\t'), run('Calls answered')], horizontalTextAlignment: 'left' }]),
  img('kpiI', pos(46, 48, 40, 40, 2000)),
  tb('kpiT2', pos(40, 120, 300, 90, 3000), [{ textRuns: [run('\t\t\t\t'), run('Talk time')], horizontalTextAlignment: 'left' }, { textRuns: [run('Average per call', 10)], horizontalTextAlignment: 'left' }]),
  img('kpiI2', pos(46, 128, 40, 40, 4000)),
  { $schema: VS, name: 'cardK', position: pos(400, 40, 300, 120, 5000), visual: { visualType: 'card', query: query({ Values: [fmea()] }), visualContainerObjects: titled('Revenue this year') } },
  img('cardI', pos(410, 46, 28, 28, 6000)),
  { $schema: VS, name: 'cardP', position: pos(740, 40, 300, 100, 12000), visual: { visualType: 'card', query: query({ Values: [fmea('Third')] }) } },
  img('cardPI', pos(750, 50, 40, 40, 13000)), img('mark', pos(1020, 55, 60, 30, 14000)),
  { $schema: VS, name: 'tbl', position: pos(40, 260, 520, 300, 7000), visual: { visualType: 'tableEx', query: query({ Values: [fcol('Category'), fmea()] }), visualContainerObjects: titled('Categories') } },
  { $schema: VS, name: 'barOn', position: pos(300, 300, 200, 160, 8000), visual: { visualType: 'clusteredBarChart', query: query({ Category: [fcol('Category')], Y: [fmea()] }) } },
  { $schema: VS, name: 'mx', position: pos(700, 260, 400, 260, 9000), visual: { visualType: 'pivotTable', query: query({ Rows: [fcol('Weekday')], Columns: [fcol('Hour')], Values: [fmea()] }),
    objects: { subTotals: obj({ rowSubtotals: L('false'), columnSubtotals: L('false') }), grid: obj({ textSize: L('10D') }) } } },
  { $schema: VS, name: 'side', position: pos(1080, 300, 120, 200, 10000), visual: { visualType: 'card', query: query({ Values: [fmea('Other')] }) } },
  { $schema: VS, name: 'panel', position: pos(40, 580, 560, 130, 100), visual: { visualType: 'shape', objects: { shape: obj({ tileShape: Q('rectangle') }) } } },
  tb('note', pos(50, 590, 300, 40, 200), [{ textRuns: [run('Read me first')], horizontalTextAlignment: 'left' }]),
  img('noteI', pos(60, 592, 30, 30, 300)),
  { $schema: VS, name: 'hrs', position: pos(712, 530, 380, 120, 11000), visual: { visualType: 'clusteredColumnChart', query: query({ Category: [fcol('Hour')], Y: [fmea()] }) } }
] }] };

const hm1 = (n) => JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures/hm1', n + '.json'), 'utf8'));
const CASES = H.SP11_CASES.concat([
  ...['N1-25', 'M1-1', 'F1-1'].map((n, i) => [`T${19 + i} hm1's ${n}`, 'h' + n, () => materialize(hm1(n), path.join(ROOT, 'h' + n)), { path: 'h' + n + '/Synthetic.pbip', arabicMonth: false }]),
  ['T22 the geometry project, its own report', 'g1', () => materialize(GEO, path.join(ROOT, 'g1')), { path: 'g1/Synthetic.pbip', arabicMonth: false }],
  ['T23 the geometry project, both languages in one report', 'g2', () => materialize(GEO, path.join(ROOT, 'g2')), { path: 'g2/Synthetic.pbip', arabicMonth: false, into: 'same' }]
]);

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
    && [...geo.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]).every((m) => ['./read-report.mjs', './twin-read.mjs', './twin-visuals.mjs', './page-picture.mjs', 'node:module'].includes(m))
    && /require\('\.\.\/\.\.\/assets\/js\/mirror-policy\.js'\)/.test(geo) && /Policy\.keepsGridLtr\(/.test(geo)
    && !/'matrix'[^;\n]*\|\|[^;\n]*'table'|'table'[^;\n]*\|\|[^;\n]*'matrix'/.test(geo),
  () => 'M2 twin-geometry.mjs holds no module state (no top-level let or var) and does no IO (no fs, process, clock or randomness); it imports only read-report, twin-read, twin-visuals, page-picture and the engines, and reads the kinds that keep left to right from mirror-policy.js (keepsGridLtr), with no list of its own');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp26.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp26  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp26  ${checks} checks`);
