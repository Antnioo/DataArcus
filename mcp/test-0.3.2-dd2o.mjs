// DD2O (0.3.2; the owner, D-1104-12, 4 Nov: "a library of functions where a place calls them so if we need to fix
// something we fix it at the source"; D-1104-18; D-1104-15: equal copies, one copy, no answer changes; D-1016-01): one
// place for two boxes overlapping. The tolerant yes or no and the shared area live in mcp/lib/box-overlap.mjs only
// (docs/CONTRACTS.md families overlap and overlap-area): two questions, two functions.
//   U1-U52   the module on 13 pairs (the contract probe's 9, then a zero-width box apart, a box exactly 0.5 px over,
//            touching corners, two zero-size boxes at one point): overlaps and overlapArea, each on both box shapes
//            ({ x, y, width, height } and { x, y, w, h }), each answer pinned (52 checks)
//   P1-P26   the parity: the five old copies, run from the base's source (saved in mcp/fixtures/hk1/dd2o, ae8c173's bytes: each definition read from the
//            file as scripts/contracts-probe.mjs reads a nested name), and the one place on every pair: one answer per
//            pair per question. overlap: twin-visuals overlaps and redesign-grid overlap (base), box-overlap overlaps on
//            both shapes, twin-visuals overlaps and redesign-grid overlap now; overlap-area: twin-geometry overlapOf,
//            page-picture meets and twin-geometry meet in landsOn (base), box-overlap overlapArea on both shapes. The
//            answers compared as text, unrounded (26 checks)
//   S1-S11   one job, one place: no other file in mcp/lib or mcp/tools holds the tolerant test or the area (box-diff.mjs's
//            iou, research code that the server never loads, is a ratio over the union: named, not counted); the four
//            callers import box-overlap.mjs; twin-visuals.mjs and redesign-grid.mjs export its overlaps itself (the
//            same function); each caller's threshold is a named constant (11 checks)
// Made-up boxes only.   node test-0.3.2-dd2o.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { overlaps, overlapArea } from './lib/box-overlap.mjs';
import * as TV from './lib/twin-visuals.mjs';
import * as RG from './lib/redesign-grid.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

// ---------- the inputs (the contract probe's BOXES, scripts/contracts-probe.mjs, then four more) and today's answers ----------
const BOXES = [
  { label: 'apart', a: [0, 0, 100, 100], b: [200, 0, 100, 100], overlap: false, area: 0 },
  { label: 'touching edges', a: [0, 0, 100, 100], b: [100, 0, 100, 100], overlap: false, area: 0 },
  { label: '0.4 px overlap', a: [0, 0, 100, 100], b: [99.6, 0, 100, 100], overlap: false, area: 40 },
  { label: '1 px overlap', a: [0, 0, 100, 100], b: [99, 0, 100, 100], overlap: true, area: 100 },
  { label: '1 px overlap, 3 px high (area 3)', a: [0, 0, 100, 3], b: [99, 0, 100, 3], overlap: true, area: 3 },
  { label: '3 px overlap both ways (area 9)', a: [0, 0, 100, 100], b: [97, 97, 100, 100], overlap: true, area: 9 },
  { label: 'one inside the other', a: [0, 0, 100, 100], b: [10, 10, 20, 20], overlap: true, area: 400 },
  { label: 'the same box', a: [0, 0, 100, 100], b: [0, 0, 100, 100], overlap: true, area: 10000 },
  { label: 'a zero-width box inside', a: [0, 0, 100, 100], b: [50, 10, 0, 20], overlap: true, area: 0 },
  { label: 'a zero-width box apart', a: [0, 0, 100, 100], b: [300, 10, 0, 20], overlap: false, area: 0 },
  { label: 'exactly 0.5 px over', a: [0, 0, 100, 100], b: [99.5, 0, 100, 100], overlap: false, area: 50 },
  { label: 'touching corners', a: [0, 0, 100, 100], b: [100, 100, 50, 50], overlap: false, area: 0 },
  { label: 'two zero-size boxes at one point', a: [10, 10, 0, 0], b: [10, 10, 0, 0], overlap: false, area: 0 },
];
const wh = ([x, y, w, h]) => ({ x, y, width: w, height: h }), xywh = ([x, y, w, h]) => ({ x, y, w, h });
const r2 = (n) => Math.round(n * 100) / 100;

// ---------- U: the module, each answer pinned, on both shapes ----------
let un = 0;
BOXES.forEach((x) => [['{width, height}', wh], ['{w, h}', xywh]].forEach(([shape, mk]) => {
  const o = overlaps(mk(x.a), mk(x.b)), a = overlapArea(mk(x.a), mk(x.b));
  chk(() => o === x.overlap, () => `U${un + 1}. overlaps, ${x.label}, ${shape}: ${x.overlap} pinned, got ${o}`); un++;
  chk(() => r2(a) === x.area, () => `U${un + 1}. overlapArea, ${x.label}, ${shape}: ${x.area} pinned, got ${a}`); un++;
}));

// ---------- P: the old copies (the base's source) and the one place, one answer per input per question ----------
// (HK1, 0.3.3) the base's files are saved copies (mcp/fixtures/hk1/dd2o, the commit ae8c173's bytes), not git reads
const baseSrc = new Map();
const baseOf = (f) => { if (!baseSrc.has(f)) baseSrc.set(f, fs.readFileSync(path.join(HERE, 'fixtures', 'hk1', 'dd2o', ...f.split('/')), 'utf8').replace(/\r\n/g, '\n')); return baseSrc.get(f); };
// one definition `const name = ...;` read from a source (as test-0.3.2-dd2p.mjs and scripts/contracts-probe.mjs read a
// nested name): from its name to the ';' where its brackets close, the one inside `within` when given
function definition(src, name, within) {
  let from = 0;
  if (within) { from = src.search(new RegExp(`(?:const|function)\\s+${within}\\b`)); if (from < 0) throw new Error(`${within} is not in the base's source`); }
  const at = src.indexOf(`const ${name} =`, from);
  if (at < 0) throw new Error(`${name} is not in the base's source`);
  let depth = 0;
  for (let i = at; i < src.length; i++) {
    const c = src[i];
    if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) depth--; else if (c === ';' && depth === 0) return src.slice(at, i + 1);
  }
  throw new Error(`${name}: no end`);
}
const old = (file, name, within, mk) => { let f; try { f = new Function('"use strict";\n' + definition(baseOf(file), name, within) + `\nreturn ${name};`)(); } catch (e) { f = () => { throw e; }; } return [`${file} ${name} (base)`, f, mk]; };
const OVERLAP_OLD = [old('mcp/lib/twin-visuals.mjs', 'overlaps', null, wh), old('mcp/lib/redesign-grid.mjs', 'overlap', null, xywh)];
const AREA_OLD = [old('mcp/lib/twin-geometry.mjs', 'overlapOf', null, wh), old('mcp/lib/page-picture.mjs', 'meets', null, xywh), old('mcp/lib/twin-geometry.mjs', 'meet', 'landsOn', xywh)];
const OVERLAP_NOW = [['box-overlap.mjs overlaps {width, height}', overlaps, wh], ['box-overlap.mjs overlaps {w, h}', overlaps, xywh], ['twin-visuals.mjs overlaps (now)', TV.overlaps, wh], ['redesign-grid.mjs overlap (now)', RG.overlap, xywh]];
const AREA_NOW = [['box-overlap.mjs overlapArea {width, height}', overlapArea, wh], ['box-overlap.mjs overlapArea {w, h}', overlapArea, xywh]];
const answer = (f, mk, x) => { try { return String(f(mk(x.a), mk(x.b))); } catch (e) { return 'throws ' + e.message; } };
let pn = 0;
const parity = (q, x, places) => {
  const got = places.map(([who, f, mk]) => [who, answer(f, mk, x)]), one = new Set(got.map((g) => g[1])).size === 1;
  chk(() => one, () => `P${pn}. ${q}, ${x.label}: one answer from every place: ${got.map(([w, a]) => w + ' ' + a.slice(0, 40)).join('; ')}`);
};
BOXES.forEach((x) => { pn++; parity('overlap', x, OVERLAP_OLD.concat(OVERLAP_NOW)); pn++; parity('overlap-area', x, AREA_OLD.concat(AREA_NOW)); });

// ---------- S: one job, one place ----------
{
  const list = (dir) => fs.readdirSync(path.join(REPO, ...dir.split('/'))).filter((f) => /\.mjs$/.test(f)).map((f) => dir + '/' + f);
  const text = (f) => fs.readFileSync(path.join(REPO, ...f.split('/')), 'utf8').replace(/\r\n/g, '\n'), sources = list('mcp/lib').concat(list('mcp/tools'));
  const TOLERANT = /\b(\w+)\.x < (\w+)\.x \+ [^&]*- 0\.5 && \2\.x < \1\.x \+/, AREA = /Math\.max\(0, Math\.min\((\w+)\.x \+ .*?, (\w+)\.x \+ .*?\) - Math\.max\(\1\.x, \2\.x\)\)/;
  const tolerant = sources.filter((f) => TOLERANT.test(text(f))), area = sources.filter((f) => f !== 'mcp/lib/box-diff.mjs' && AREA.test(text(f)));
  chk(() => tolerant.length === 1 && tolerant[0] === 'mcp/lib/box-overlap.mjs', () => `S1. the tolerant test (half a pixel each way) is in box-overlap.mjs only: ${tolerant.join(', ')}`);
  chk(() => area.length === 1 && area[0] === 'mcp/lib/box-overlap.mjs', () => `S2. the area two boxes share is in box-overlap.mjs only (box-diff.mjs's iou named apart): ${area.join(', ')}`);
  [['mcp/lib/twin-visuals.mjs', /^export \{ overlaps \} from '\.\/box-overlap\.mjs';$/m], ['mcp/lib/redesign-grid.mjs', /^import \{ overlaps as overlap \} from '\.\/box-overlap\.mjs';$/m],
    ['mcp/lib/twin-geometry.mjs', /^import \{ overlapArea \} from '\.\/box-overlap\.mjs';$/m], ['mcp/lib/page-picture.mjs', /^import \{ overlapArea \} from '\.\/box-overlap\.mjs';$/m]]
    .forEach(([f, re], i) => chk(() => re.test(text(f)), () => `S${i + 3}. ${f} reads box-overlap.mjs`));
  chk(() => TV.overlaps === overlaps, () => 'S7. twin-visuals.mjs exports box-overlap.mjs overlaps itself (its importers change nothing)');
  chk(() => RG.overlap === overlaps, () => 'S8. redesign-grid.mjs exports box-overlap.mjs overlaps as overlap (the same function)');
  [['mcp/lib/page-picture.mjs', /^const NEW_OVERLAP_MIN = 4;$/m, /overlapArea\(ar\.get\(a\), ar\.get\(b\)\);\n\s*if \(r > NEW_OVERLAP_MIN && e <= 0\)/],
    ['mcp/lib/twin-geometry.mjs', /^const ON_HOST = 0\.5;$/m, /height \* ON_HOST\)[^\n]*\n[\s\S]*height \* ON_HOST\)/], ['mcp/lib/twin-geometry.mjs', /^const LANDS_ON_MIN = 4;$/m, /overlapArea\(a, b\) <= LANDS_ON_MIN\)/]]
    .forEach(([f, def, use], i) => chk(() => def.test(text(f)) && use.test(text(f)), () => `S${i + 9}. ${f}: its threshold is a named constant (${def.source}), read where the area is read`));
}

if (problems.length) { console.log(`FAIL script=test-0.3.2-dd2o.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2o  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2o  ${checks} checks`);
