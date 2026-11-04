// DD1C (0.3.2; the owner, D-1104-12, 4 Nov: "a library of functions where a place calls them so if we need to fix
// something we fix it at the source"; D-1104-11; D-1016-01): one answer to "how wide is the frame a visual is mirrored
// inside?". The rule lives in assets/js/mirror-units.js frameWidth only: the parent group's width when the group's box
// is valid (finite x, y, width > 0, height > 0), else the page's width when finite and > 0, else undefined (unknown).
// Its three callers, each read from what it does (never from its source):
//   mirror    report-mirror.js mirrorPage (a text box's x' = W - x - width; unknown: x left as it is)
//   geometry  twin-geometry.mjs aroundTables (a bar kept on a table, clamped to W - width; unknown: not kept)
//   fitting   twin-text-fit.mjs fitButtons (a button widened up to its frame; unknown: left as it is)
//   F1-F13   13 made-up frames: the three callers give one answer, the rule's (39 checks)
//   R1       frameWidth itself on the 13 (13 checks)
//   S1-S3    no caller computes a frame itself; each calls mirror-units.js frameWidth (3 checks)
//   E1-E2    a made-up two-visual report in a group (valid; broken): the mirrored x and the widened button stay
//            inside the same frame (6 checks)
// Made-up data only, no IO but reading the three sources.   node test-0.3.2-dd1c.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { aroundTables } from './lib/twin-geometry.mjs';
import { fitButtons } from './lib/twin-text-fit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Mirror = require('../assets/js/report-mirror.js');
const Units = require('../assets/js/mirror-units.js');

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const copy = (x) => JSON.parse(JSON.stringify(x));
const near = (a, b) => (a === undefined && b === undefined) || (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.01);

// ---- the made-up frames ----
const group = (name, position, parent) => Object.assign({ name, visualGroup: { displayName: name, groupMode: 'ScaleMode' } }, position === undefined ? {} : { position }, parent ? { parentGroupName: parent } : {});
const box = (width, x = 0) => ({ x, y: 0, z: 0, width, height: 300 });
const CASES = [
  { id: 'F1', what: 'a valid group 400 wide', page: { width: 1280 }, groups: [group('G', box(400))], parent: 'G', want: 400 },
  { id: 'F2', what: 'a group whose width is "wide"', page: { width: 1280 }, groups: [group('G', box('wide'))], parent: 'G', want: 1280 },
  { id: 'F3', what: 'a group whose width is 0', page: { width: 1280 }, groups: [group('G', box(0))], parent: 'G', want: 1280 },
  { id: 'F4', what: 'a group whose width is -5', page: { width: 1280 }, groups: [group('G', box(-5))], parent: 'G', want: 1280 },
  { id: 'F5', what: 'a group whose position has no width', page: { width: 1280 }, groups: [group('G', { x: 0, y: 0, height: 300 })], parent: 'G', want: 1280 },
  { id: 'F6', what: 'a group with no position', page: { width: 1280 }, groups: [group('G')], parent: 'G', want: 1280 },
  { id: 'F7', what: 'no group', page: { width: 1280 }, groups: [], parent: null, want: 1280 },
  { id: 'F8', what: 'a parent group the page does not hold', page: { width: 1280 }, groups: [], parent: 'Gone', want: 1280 },
  { id: 'F9', what: 'a page with no width', page: { height: 720 }, groups: [], parent: null, want: undefined },
  { id: 'F10', what: 'a page width "x"', page: { width: 'x', height: 720 }, groups: [], parent: null, want: undefined },
  { id: 'F11', what: 'a nested group (300 inside 600)', page: { width: 1280 }, groups: [group('G1', box(600)), group('G2', box(300, 50), 'G1')], parent: 'G2', want: 300 },
  { id: 'F12', what: 'a group "wide" in a page with no width', page: { height: 720 }, groups: [group('G', box('wide'))], parent: 'G', want: undefined },
  { id: 'F13', what: 'a group 400 wide whose x is "a"', page: { width: 1280 }, groups: [group('G', Object.assign(box(400), { x: 'a' }))], parent: 'G', want: 1280 }
];
const inGroup = (v, parent) => (parent ? Object.assign(v, { parentGroupName: parent }) : v);
const lit = (s) => ({ expr: { Literal: { Value: `'${s}'` } } });

// mirror: a text box 20 wide at x 10; mirrored, x' = W - 10 - 20
function mirrorFrame(c) {
  const tb = inGroup({ name: 'tb', position: { x: 10, y: 10, z: 1, width: 20, height: 20 }, visual: { visualType: 'textbox' } }, c.parent);
  const r = Mirror.mirrorPage(copy(c.page), copy(c.groups).concat([copy(tb)]), {}), out = r.visuals.find((v) => v.name === 'tb');
  return out.position.x === 10 ? undefined : out.position.x + 10 + 20;
}
// geometry: a bar over a table, both in the frame; the table's twin pushed far right so the bar is clamped to W - 20
function geometryFrame(c) {
  const table = inGroup({ name: 'tbl', position: { x: 0, y: 0, z: 1, width: 50, height: 100 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: [] } } } } }, c.parent);
  const bar = inGroup({ name: 'bar', position: { x: 5, y: 5, z: 2, width: 20, height: 40 }, visual: { visualType: 'barChart' } }, c.parent);
  const en = copy(c.groups).concat([table, bar]), ar = copy(en); ar.find((v) => v.name === 'tbl').position.x = 100000;
  const r = { visuals: ar, moved: [] };
  aroundTables({ page: copy(c.page), visuals: en.map((json) => ({ json })) }, r, {});
  if (!r.moved.some((m) => m.visual === 'bar')) return undefined;
  const k = r.visuals.find((v) => v.name === 'bar').position; return k.x + k.width;
}
// fitting: a button 20 wide at x 10 whose Arabic text needs far more than any frame; widened up to its frame's edges
function fittingFrame(c) {
  const but = inGroup({ name: 'btn', position: { x: 10, y: 10, z: 1, width: 20, height: 40 }, visual: { visualType: 'actionButton', objects: { text: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: lit('ب'.repeat(400)), fontSize: { expr: { Literal: { Value: '10D' } } } } }] } } }, c.parent);
  const vs = copy(c.groups).concat([but]);
  try { fitButtons(copy(c.page), vs, { text: { labelSize: 10, font: 'Segoe UI' }, rtl: true }, 'p1'); } catch (e) { return 'threw: ' + e.message; }
  const p = vs.find((v) => v.name === 'btn').position;
  return p.x === 10 && p.width === 20 ? undefined : p.x + p.width;
}

for (const c of CASES) {
  const m = mirrorFrame(c), g = geometryFrame(c), f = fittingFrame(c);
  chk(() => near(m, c.want), () => `${c.id} (${c.what}): the mirror's frame is ${m}, the rule's ${c.want}`);
  chk(() => near(g, c.want), () => `${c.id} (${c.what}): the geometry's frame is ${g}, the rule's ${c.want}`);
  chk(() => near(f, c.want), () => `${c.id} (${c.what}): the fitting's frame is ${f}, the rule's ${c.want}`);
}
// R1: the rule itself
for (const c of CASES) {
  const v = inGroup({ name: 'v', position: box(10) }, c.parent), got = typeof Units.frameWidth === 'function' ? Units.frameWidth(c.page, Units.byNameOf(c.groups.concat([v])), v) : 'not there';
  chk(() => near(got, c.want), () => `R1 ${c.id} (${c.what}): frameWidth gives ${got}, the rule says ${c.want}`);
}

// S1-S3: one home. No caller computes a frame from a parent group itself; each calls Units.frameWidth
const SRC = [['report-mirror.js', '../assets/js/report-mirror.js'], ['twin-geometry.mjs', 'lib/twin-geometry.mjs'], ['twin-text-fit.mjs', 'lib/twin-text-fit.mjs']];
for (const [name, rel] of SRC) {
  const s = fs.readFileSync(path.join(HERE, rel), 'utf8');
  const own = s.split('\n').filter((l) => /parentGroupName/.test(l) && /\.width\b/.test(l) && /byName/.test(l));
  chk(() => /(Units\.|[^.\w])frameWidth\(/.test(s) && /mirror-units\.js|Units\./.test(s) && !own.length, () => `S ${name}: ${own.length ? 'computes a frame itself: ' + own[0].trim().slice(0, 160) : 'does not call mirror-units.js frameWidth'}`);
}

// E1-E2: a made-up two-visual report in a group: a text box and a button with a long Arabic text, mirrored, then fitted
function endToEnd(id, groupBox, frame) {
  const page = { width: 1280, height: 720 };
  const vs = [group('G', groupBox),
    { name: 'title', parentGroupName: 'G', position: { x: 300, y: 10, z: 1, width: 80, height: 30 }, visual: { visualType: 'textbox' } },
    { name: 'go', parentGroupName: 'G', position: { x: 20, y: 60, z: 2, width: 30, height: 40 }, visual: { visualType: 'actionButton', objects: { text: [{ properties: { text: lit('عرض التفاصيل الكاملة لكل فرع في المنطقة'), fontSize: { expr: { Literal: { Value: '12D' } } } } }] } } }];
  const r = Mirror.mirrorPage(page, copy(vs), {});
  fitButtons(page, r.visuals, { text: { labelSize: 10, font: 'Segoe UI' }, rtl: true }, 'p1');
  const t = r.visuals.find((v) => v.name === 'title').position, b = r.visuals.find((v) => v.name === 'go').position;
  chk(() => near(t.x, frame - 300 - 80), () => `${id}: the text box mirrored to x ${t.x}, in a frame ${frame} it is ${frame - 380}`);
  chk(() => b.width > 30, () => `${id}: the button was not widened (${b.width})`);
  chk(() => [t, b].every((p) => p.x >= -0.5 && p.x + p.width <= frame + 0.5), () => `${id}: a box left the frame ${frame}: text box ${t.x}+${t.width}, button ${b.x}+${b.width}`);
}
endToEnd('E1 (a valid group 400 wide)', box(400, 600), 400);
endToEnd('E2 (a group whose width is "wide")', box('wide', 600), 1280);

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd1c  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd1c  ${checks} checks`);
