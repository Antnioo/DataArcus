// 0.3.2 DD2N (mcp/work/DD2N.md): one way to write a name in TMDL. assets/js/tmdl-name.js tmdlName (bare when a plain
// identifier, else in single quotes with ' doubled; a hyphen is quoted) is the one home of CONTRACTS.md's family
// tmdl-name. Made-up names only. Each answer is pinned.
//   N1-N13  tmdlName on the contracts probe's 9 names and 4 more (a number, a name with two quotes, a leading hyphen,
//           an underscore inside); the .min.js gives the same; F1 the module is frozen, its two names exactly
//   P1-P13  parity: every place of CONTRACTS.md's family tmdl-name (scripts/contracts-probe.mjs, run as the probe runs
//           it: the module, the health check's inner name, each caller's own line read from its source) and the two
//           pages' shipped .min.js (the health check's engine and the measure builder, run in a vm after
//           tmdl-name.min.js) on the 13 names: one answer per name, the pinned one
//   S1-S4   one place: no caller holds a name rule of its own; each reads the module (the same function); both
//           pages, English and Arabic, load tmdl-name.min.js once, before the caller
//   node test-0.3.2-dd2n.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { FAMILIES, answerOf, placeName } from '../scripts/contracts-probe.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const JS = path.join(HERE, '..', 'assets', 'js');
const require = createRequire(import.meta.url);
const TmdlName = require('../assets/js/tmdl-name.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const src = (f) => fs.readFileSync(path.join(JS, f), 'utf8');
const show = (s) => JSON.stringify(s);

// [id, the name, its TMDL text]: the probe's 9 (scripts/contracts-probe.mjs TNAMES), then 4 more
export const NAMES = [
  ['N1', 'Sales', 'Sales'],
  ['N2', 'Sales Amount', "'Sales Amount'"],
  ['N3', 'Sales-2024', "'Sales-2024'"],
  ['N4', "O'Brien", "'O''Brien'"],
  ['N5', 'المبيعات', "'المبيعات'"],
  ['N6', '_x', '_x'],
  ['N7', '1st', "'1st'"],
  ['N8', '', "''"],
  ['N9', 'Date', 'Date'],
  ['N10', 12, "'12'"],
  ['N11', "it''s", "'it''''s'"],
  ['N12', '-x', "'-x'"],
  ['N13', 'Sales_2024', 'Sales_2024'],
];

const Min = { self: {} }; vm.createContext(Min); vm.runInContext(src('tmdl-name.min.js'), Min);
for (const [id, n, want] of NAMES) {
  const got = TmdlName.tmdlName(n), min = Min.self.DATmdlName.tmdlName(n);
  chk(() => got === want && min === want, () => `${id} ${show(n)}: tmdlName gave ${show(got)} (.min.js ${show(min)}), pinned ${show(want)}`);
}
chk(() => Object.isFrozen(TmdlName) && Object.keys(TmdlName).join() === 'PLAIN,tmdlName',
  () => `F1 the module must be frozen, its names PLAIN and tmdlName: ${Object.keys(TmdlName)}`);

// ---------- parity ----------
const fam = FAMILIES.find((f) => f.id === 'tmdl-name');
const CALLER_FILES = ['assets/js/model-health-tmdl.js', 'assets/js/measure-builder.js', 'mcp/lib/model-culture.mjs', 'mcp/lib/sample-project.mjs', 'mcp/lib/shadow-model.mjs', 'mcp/lib/twin-model.mjs'];
chk(() => fam && fam.places[0].file === 'assets/js/tmdl-name.js' && CALLER_FILES.every((f) => fam.places.some((p) => p.file === f)), () => 'P0 the probe\'s family tmdl-name must hold the module first and every caller');
// the shipped pages: the health check's engine and the measure builder's tName, each after tmdl-name.min.js
const Health = { self: {} }; vm.createContext(Health); vm.runInContext(src('tmdl-name.min.js'), Health); vm.runInContext(src('field-meaning.min.js'), Health); vm.runInContext(src('sort-column.min.js'), Health); vm.runInContext(src('model-health-tmdl.min.js'), Health);
const mbLine = (s) => (/(?:const |,)(\w+)=window\.DATmdlName\.tmdlName/.exec(s) || [])[1];
const Mb = { window: Min.self }; vm.createContext(Mb);
const mbMin = vm.runInContext('(' + JSON.stringify(mbLine(src('measure-builder.min.js'))) + ', window.DATmdlName.tmdlName)', Mb);
const shipped = { 'model-health-tmdl.min.js name': (n) => Health.self.MHTmdl.name(n), 'measure-builder.min.js tName': mbMin };
for (const [i, [id, n, want]] of NAMES.entries()) {
  const off = [];
  for (const place of (fam ? fam.places : [])) { const got = await answerOf(place, { label: String(n), n }); if (got.key !== show(want)) off.push(placeName(place) + ' ' + got.shown); }
  for (const [k, f] of Object.entries(shipped)) { let g; try { g = f(n); } catch (e) { g = 'throws ' + e.name; } if (g !== want) off.push(k + ' ' + show(g)); }
  chk(() => !off.length, () => `P${i + 1} (${id}) ${show(n)}: not one answer: ${off.join('; ')} (pinned ${show(want)})`);
}

// ---------- one place ----------
const lib = (f) => fs.readFileSync(path.join(HERE, 'lib', f), 'utf8');
const CALLERS = { 'model-health-tmdl.js': src('model-health-tmdl.js'), 'measure-builder.js': src('measure-builder.js'), 'model-culture.mjs': lib('model-culture.mjs'), 'sample-project.mjs': lib('sample-project.mjs'), 'shadow-model.mjs': lib('shadow-model.mjs'), 'twin-model.mjs': lib('twin-model.mjs') };
const own = /\[A-Za-z_\]\[A-Za-z0-9_-?\]\*\$/;
chk(() => Object.values(CALLERS).every((s) => !own.test(s)), () => `S1 a caller holds its own TMDL name rule again: ${Object.entries(CALLERS).filter(([, s]) => own.test(s)).map(([k]) => k)}: read assets/js/tmdl-name.js`);
{ const MH = require('../assets/js/model-health-tmdl.js');
  const reads = ['model-culture.mjs', 'sample-project.mjs', 'shadow-model.mjs', 'twin-model.mjs'].filter((k) => !/require\('\.\.\/\.\.\/assets\/js\/tmdl-name\.js'\)\.tmdlName;/.test(CALLERS[k]));
  chk(() => MH.name === TmdlName.tmdlName && !reads.length && /require\('\.\/tmdl-name\.js'\)/.test(CALLERS['model-health-tmdl.js']) && /root\.DATmdlName/.test(CALLERS['model-health-tmdl.js']),
    () => `S2 the health check's name must be tmdl-name.js's own function (require in Node, DATmdlName in the browser); the MCP places must require it: ${reads}`); }
chk(() => mbLine(src('measure-builder.min.js')) && /const tName = window\.DATmdlName\.tmdlName;/.test(CALLERS['measure-builder.js']), () => 'S3 measure-builder.js must read window.DATmdlName.tmdlName (source and .min.js)');
{ const pages = { 'tools/power-bi-model-health-check.html': 'model-health-tmdl', 'ar/tools/power-bi-model-health-check.html': 'model-health-tmdl', 'tools/dax-measure-builder.html': 'measure-builder', 'ar/tools/dax-measure-builder.html': 'measure-builder' };
  const bad = Object.entries(pages).filter(([p, caller]) => { const h = fs.readFileSync(path.join(HERE, '..', ...p.split('/')), 'utf8'), a = h.indexOf('assets/js/tmdl-name.min.js?v='), b = h.indexOf('assets/js/' + caller + '.min.js?v='); return !(a >= 0 && b > a && h.split('assets/js/tmdl-name.min.js?v=').length === 2); }).map(([p]) => p);
  chk(() => !bad.length, () => `S4 these pages must load tmdl-name.min.js once, before their caller: ${bad}`); }

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2n  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2n  ${checks} checks`);
