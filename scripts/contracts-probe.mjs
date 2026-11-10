// The contract probe (0.3.2 CL1; the owner D-1104-11 "one big check if some parts are similer in what they should
// produce but they differ in wording", D-1104-12 one library fixed at the source). One family a question the product
// answers in more than one place; every place of a family runs on the same made-up inputs and one table a family shows
// what each place answers today. mcp/docs/CONTRACTS.md is written from this table; scripts/check-contracts.mjs checks
// that every place it names is still there and that every family keeps its inputs here. Nothing is changed: no file
// is written, every input is made up (never a real model, never a data value).
//
// How a place is loaded (the "how" of a place):
//   export  the file's own export (an engine by require, a lib by import), run as it is;
//   inner   an engine's inner name (assets/js/*.js are closures): the whole file run in Node with ONE line added in
//           memory just before its export line, which hands that name out; the file on disk never changes;
//   source  a name nested inside another function, a page-only one, or a lib's name it does not export: its own
//           definition read from the file's source and run with what it names (the same file's other names, its
//           imports, and the made-up locals of the function it sits in, which the place gives). Said so in the table.
//
//   node scripts/contracts-probe.mjs            one table a family (the places that answer the same on every input are
//                                               one column), the disagreeing inputs marked "!", then the result line
//   node scripts/contracts-probe.mjs --md       the same as Markdown, the disagreeing inputs only (CONTRACTS.md's
//                                               "Today" blocks)
//   node scripts/contracts-probe.mjs --json     every answer, for a test or the reviewer
// Needs the MCP's packages (cd mcp && npm ci): the twin's modules load through them. Not run in CI (a snapshot, read
// by the reviewer when the ledger changes); the check is check-contracts.mjs.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const abs = (f) => path.join(ROOT, ...f.split('/'));
const sources = new Map();
const sourceOf = (f) => { if (!sources.has(f)) sources.set(f, fs.readFileSync(abs(f), 'utf8').replace(/\r\n/g, '\n')); return sources.get(f); };

// ---- export: the file's own export ----
async function exported(file, name) {
  const m = file.endsWith('.mjs') ? await import(pathToFileURL(abs(file)).href) : createRequire(abs(file))(abs(file));
  const v = name.split('.').reduce((o, k) => (o == null ? o : o[k]), m);
  if (v === undefined) throw new Error(`${file} exports no ${name}`);
  return v;
}

// ---- inner: an engine run with one line added before its export line ----
const inners = new Map();
function inner(file, name) {
  const key = file + '#' + name;
  if (inners.has(key)) return inners.get(key);
  const lines = sourceOf(file).split('\n');
  let at = -1;
  lines.forEach((l, i) => { if (/\bmodule\.exports\s*=/.test(l)) at = i; });
  if (at < 0) throw new Error(`${file} has no export line (module.exports = ...): read it from its source`);
  const hand = `;globalThis.__contractsProbe = (typeof ${name} !== 'undefined' ? ${name} : undefined);`;
  const code = lines.slice(0, at).concat(hand, lines.slice(at)).join('\n');
  const wrap = vm.runInThisContext('(function (exports, require, module, __filename, __dirname) {' + code + '\n})', { filename: abs(file) });
  const mod = { exports: {} };
  globalThis.__contractsProbe = undefined;
  wrap.call(globalThis, mod.exports, createRequire(abs(file)), mod, abs(file), path.dirname(abs(file)));
  const v = globalThis.__contractsProbe;
  delete globalThis.__contractsProbe;
  if (v === undefined) throw new Error(`${name} is not a name at the top of ${file}'s closure: read it from its source`);
  inners.set(key, v);
  return v;
}

// ---- source: a definition read from the file ----
const parses = (body) => { try { new Function(body); return true; } catch (e) { return false; } };   // syntax only, never run
// the definitions of name in the file: { kind: 'decl' | 'expr', at (where its text starts), indent, end }
const SPAN = 6000;   // a definition read from source is a short helper: its text is looked for this far only
const defCache = new Map();
export function definitions(s, name) {
  const ck = name + '\u0000' + s.length + '\u0000' + s.slice(0, 64);
  if (defCache.has(ck)) return defCache.get(ck);
  const out = [], esc = name.replace(/[$]/g, '\\$');
  const re = new RegExp(`\\bfunction\\s+${esc}\\s*\\(|(?:\\b(?:const|let|var)\\s+|,\\s*)${esc}\\s*=(?![=>])`, 'g');
  for (const m of s.matchAll(re)) {
    const lineStart = s.lastIndexOf('\n', m.index) + 1, indent = /^\s*/.exec(s.slice(lineStart))[0].length;
    if (m[0].startsWith('function')) {
      for (let i = s.indexOf('{', m.index); i > 0 && i < m.index + 4 * SPAN; i = s.indexOf('}', i + 1)) {
        const t = s.slice(m.index, i + 1);
        if (t.endsWith('}') && parses(t)) { out.push({ kind: 'decl', at: m.index, indent, text: t, end: i + 1 }); break; }
      }
    } else {
      const from = m.index + m[0].length;
      let found = null;
      for (const stops of [/[;,]/g, /[;,\n]/g]) {
        stops.lastIndex = from;
        for (let k; (k = stops.exec(s)) && !found && k.index < from + SPAN;) { const t = s.slice(from, k.index); if (t.trim() && parses('return (' + t + '\n);')) found = { t, end: k.index }; }
        if (found) break;
      }
      if (found) out.push({ kind: 'expr', at: from, indent, text: found.t.trim(), end: found.end });
    }
  }
  defCache.set(ck, out);
  return out;
}
// the text of the function a nested name sits in: from its definition to the closing line at its own indent
function regionOf(s, within) {
  const re = new RegExp(`^([ \\t]*)(?:export\\s+)?(?:async\\s+)?(?:function\\s+${within}\\s*\\(|(?:const|let|var)\\s+${within}\\s*=)`, 'm'), m = re.exec(s);
  if (!m) return null;
  const close = new RegExp(`\\n${m[1]}[}\\]]`, 'g'); close.lastIndex = m.index;
  const c = close.exec(s);
  return { at: m.index, end: c ? c.index : s.length };
}
// the one definition a place means: inside `within` (a function's own definition) when given, else the least indented
function definitionOf(file, name, within, after) {
  const s = sourceOf(file), all = definitions(s, name);
  let pool = all;
  if (after) {   // a name defined more than once in the same function: the first definition after this text
    const at = s.indexOf(after), next = all.filter((d) => at >= 0 && d.at > at).sort((a, b) => a.at - b.at)[0];
    return next || null;
  }
  if (within) {
    const w = regionOf(s, within);
    if (!w) return null;
    const inside = all.filter((d) => d.at > w.at && d.at < w.end);
    if (inside.length) pool = inside;
  }
  if (!pool.length) return null;
  return pool.slice().sort((a, b) => a.indent - b.indent || a.at - b.at)[0];
}
// the names an ES module imports: name -> { from, key }
function importsOf(file) {
  const out = new Map(), s = sourceOf(file);
  for (const m of s.matchAll(/^import\s+([^'";]+?)\s+from\s+'([^']+)'/gm)) {
    const clause = m[1].trim(), from = m[2];
    const named = /\{([^}]*)\}/.exec(clause);
    if (named) named[1].split(',').map((x) => x.trim()).filter(Boolean).forEach((x) => { const [k, as] = x.split(/\s+as\s+/); out.set((as || k).trim(), { from, key: k.trim() }); });
    const star = /\*\s+as\s+(\w+)/.exec(clause);
    if (star) out.set(star[1], { from, key: '*' });
    const def = /^(\w+)\s*(?:,|$)/.exec(clause);
    if (def) out.set(def[1], { from, key: 'default' });
  }
  return out;
}
// the names a file takes by a destructured require (const { a, b: c } = require('x'), or createRequire(...)('x')):
// name -> { from, key }
function requiredOf(file) {
  const out = new Map(), s = sourceOf(file);
  for (const m of s.matchAll(/\bconst\s*\{([^}]*)\}\s*=\s*(?:require|createRequire\(import\.meta\.url\))\(\s*'([^']+)'\s*\)/g)) {
    m[1].split(',').map((x) => x.trim()).filter(Boolean).forEach((x) => { const [k, as] = x.split(/\s*:\s*/); out.set((as || k).trim(), { from: m[2], key: k.trim() }); });
  }
  return out;
}
async function importValue(file, spec) {
  const target = spec.from.startsWith('.') ? pathToFileURL(path.join(path.dirname(abs(file)), spec.from)).href : spec.from.startsWith('node:') ? spec.from : pathToFileURL(createRequire(abs(file)).resolve(spec.from)).href;
  const m = await import(target);
  return spec.key === '*' ? m : spec.key === 'default' ? m.default : m[spec.key];
}
// a source place: its definition and every name it needs, found one at a time (a ReferenceError names the next)
class SourcePlace {
  constructor(file, name, within, after) { this.file = file; this.name = name; this.within = within; this.after = after; this.deps = []; this.given = new Map(); }
  async value(locals = {}) {
    for (let round = 0; round < 60; round++) {
      try {
        this.locals = locals;
        const v = this.build(locals);
        return typeof v === 'function' ? this.guard(v) : v;
      } catch (e) { if (!(await this.learn(e, locals))) throw e; }
    }
    throw new Error(`${this.file} ${this.name}: too many names to find (${this.deps.join(", ")})`);
  }
  build(locals) {
    const own = definitionOf(this.file, this.name, this.within, this.after);
    if (!own) throw new Error(`${this.name} is not defined in ${this.file}${this.within ? ' (inside ' + this.within + ')' : ''}`);
    const given = new Map([['require', createRequire(abs(this.file))], ['module', { exports: {} }], ['root', globalThis], ['self', globalThis]]);
    for (const [k, v] of this.given) given.set(k, v);
    for (const [k, v] of Object.entries(locals)) given.set(k, v);
    const decl = (d, n) => (d.kind === 'decl' ? d.text : `const ${n} = (${d.text}\n);`);
    const body = '"use strict";\n' + this.deps.filter((n) => !given.has(n)).map((n) => decl(n === this.name ? own : definitionOf(this.file, n, this.within), n)).join('\n')
      + '\n' + (own.kind === 'decl' ? own.text + '\nreturn ' + this.name + ';' : 'return (' + own.text + '\n);');
    return new Function(...given.keys(), body)(...given.values());
  }
  // a function read from source runs as it is; a ReferenceError when it runs names a dependency: answerOf learns it and
  // runs the place again
  guard(fn) {
    const self = this;
    return function (...args) {
      try { return fn.apply(this, args); } catch (e) { if (e instanceof ReferenceError) e.learnFrom = self; throw e; }
    };
  }
  async learn(e, locals = this.locals || {}) {
    if (!(e instanceof ReferenceError)) return false;
    const before = /Cannot access '([$\w]+)' before initialization/.exec(e.message);
    if (before && this.deps.includes(before[1])) {   // defined after what needs it: it goes first
      const n = before[1]; this.deps = [n].concat(this.deps.filter((x) => x !== n)); this.moves = (this.moves || 0) + 1; return this.moves < 200;
    }
    const m = /^([$\w]+) is not defined/.exec(e.message);
    if (!m || m[1] in locals || this.given.has(m[1]) || this.deps.includes(m[1])) return false;
    const n = m[1];
    if (definitionOf(this.file, n, this.within)) { this.deps.unshift(n); return true; }
    const req = requiredOf(this.file).get(n);   // a name taken from a module by a destructured require (DD1B)
    if (req) { this.given.set(n, createRequire(abs(this.file))(req.from)[req.key]); return true; }
    const imp = this.file.endsWith('.mjs') ? importsOf(this.file).get(n) : null;
    if (imp) { this.given.set(n, await importValue(this.file, imp)); return true; }
    return false;
  }
}

// ---- the places and the families ----
// a place: file, fn (its name in the file; `within` the function it sits in), how, and run(input, get) -> its answer;
// get(locals) gives the function (or the value). An answer { v, note }: compared by v, shown as "v (note)".
const sourcePlaces = new Map();
const getter = (p) => async (locals) => {
  if (p.how === 'export') return exported(p.file, p.fn);
  if (p.how === 'inner') return inner(p.file, p.fn);
  const key = p.file + '#' + p.fn + '#' + (p.within || '') + '#' + (p.after || '');
  if (!sourcePlaces.has(key)) sourcePlaces.set(key, new SourcePlace(p.file, p.fn, p.within, p.after));
  return sourcePlaces.get(key).value(locals);
};
const P = (file, fn, how, run, more) => Object.assign({ file, fn, how, run }, more || {});

// made-up literals: a property as a visual.json holds one, { expr: { Literal: { Value } } }
const L = (v) => ({ expr: { Literal: { Value: v } } });
const LITERALS = [
  { label: 'missing (no property)', p: undefined },
  { label: 'an expr with no Literal', p: { expr: { Measure: { Property: 'x' } } } },
  { label: "'Sales'", p: L("'Sales'") },
  { label: "'it''s' (a quote inside)", p: L("'it''s'") },
  { label: "'المبيعات' (Arabic)", p: L("'المبيعات'") },
  { label: "'' (empty text)", p: L("''") },
  { label: "'a (broken: no closing quote)", p: L("'a") },
  { label: '12D', p: L('12D') },
  { label: '12L', p: L('12L') },
  { label: '-3.5D', p: L('-3.5D') },
  { label: 'true', p: L('true') },
  { label: 'false', p: L('false') },
  { label: 'null', p: L('null') },
  { label: '12 (a number, not text)', p: L(12) },
  { label: "'12D' (a number in quotes)", p: L("'12D'") },
];
const lit1 = () => async (x, get) => (await get())(x.p);

const NAMES = ['', 'Date', 'Order Date', 'OrderDate', 'FiscalYear', 'Fiscal Year', 'MonthName', 'Month_Name', 'Qtr', 'FY',
  'Yr', 'Hijri Month', 'التاريخ', 'تاريخ', 'الشهر', 'شهر', 'هجري', 'اسم_الشهر', 'Weekday', 'Days', 'Candidate', 'Update Status',
  'Holiday Package', 'Sales'].map((n) => ({ label: n === '' ? "'' (empty)" : n, name: n }));

const TEXTS = [
  { label: "'' (empty)", s: '' }, { label: 'Sales', s: 'Sales' }, { label: 'المبيعات', s: 'المبيعات' },
  { label: 'U+FEFB (a presentation form B: lam alef)', s: 'ﻻ' }, { label: 'U+FDF2 (a presentation form A: Allah)', s: 'ﷲ' },
  { label: 'U+0750 (the Arabic supplement)', s: 'ݐ' }, { label: 'U+08A0 (Arabic extended-A)', s: 'ࢠ' },
  { label: '١٢٣ (Arabic-Indic digits)', s: '١٢٣' }, { label: '؟ (the Arabic question mark)', s: '؟' },
  { label: 'Sales ٢٠٢٤ (Latin and Arabic digits)', s: 'Sales ٢٠٢٤' }, { label: 'U+200F alone (a direction mark)', s: '‏' },
];

const TYPES = ['tableEx', 'pivotTable', 'table', 'matrix', 'accessibleTable', 'slicer', 'advancedSlicerVisual', 'listSlicer', 'textSlicer',
  'filterSlicer', 'barChart', 'clusteredBarChart', 'stackedBarChart', 'hundredPercentStackedBarChart', 'columnChart', 'stackedColumnChart',
  '', 'myCustomVisual1234'].map((t) => ({ label: t === '' ? "'' (no type)" : t, t }));
// each place's own word for a type, and whether it is the family's
const mpKind = async (t, get) => (await get())({ visual: { visualType: t } });
const ppKind = async (t, get) => (await get())({ type: t });

// a page of two visuals for page-picture.mjs newOverlaps: a visual of type `table` and one of type `bar` overlap on the
// English page and on the Arabic page, the bar's axis turned only on the Arabic one: 'barsTurned' when the first keeps its
// grid and the second is a bar chart
const turnedBars = (table, bar) => {
  const v = (name, t, x, w, turned) => ({ name, position: { x, y: 0, width: w, height: 100 }, visual: { visualType: t, objects: turned ? { valueAxis: [{ properties: { invertAxis: { expr: { Literal: { Value: 'true' } } } } }] } : {} } });
  return [[v('t', table, 0, 100), v('b', bar, 0, 60)], [v('t', table, 0, 100), v('b', bar, 0, 60, true)]];
};
const BOXES = [
  { label: 'apart', a: [0, 0, 100, 100], b: [200, 0, 100, 100] },
  { label: 'touching edges', a: [0, 0, 100, 100], b: [100, 0, 100, 100] },
  { label: '0.4 px overlap', a: [0, 0, 100, 100], b: [99.6, 0, 100, 100] },
  { label: '1 px overlap', a: [0, 0, 100, 100], b: [99, 0, 100, 100] },
  { label: '1 px overlap, 3 px high (area 3)', a: [0, 0, 100, 3], b: [99, 0, 100, 3] },
  { label: '3 px overlap both ways (area 9)', a: [0, 0, 100, 100], b: [97, 97, 100, 100] },
  { label: 'one inside the other', a: [0, 0, 100, 100], b: [10, 10, 20, 20] },
  { label: 'the same box', a: [0, 0, 100, 100], b: [0, 0, 100, 100] },
  { label: 'a zero-width box inside', a: [0, 0, 100, 100], b: [50, 10, 0, 20] },
];
const wh = ([x, y, w, h]) => ({ x, y, width: w, height: h }), xywh = ([x, y, w, h]) => ({ x, y, w, h });

const COLOURS = [
  { label: '#000000 on #FFFFFF', a: '#000000', b: '#FFFFFF' }, { label: '#ffffff on #ffffff', a: '#ffffff', b: '#ffffff' },
  { label: '#767676 on #FFFFFF', a: '#767676', b: '#FFFFFF' }, { label: '#118DFF on #FFFFFF', a: '#118DFF', b: '#FFFFFF' },
  { label: '#FFF on #000000 (three digits)', a: '#FFF', b: '#000000' }, { label: '118DFF on #FFFFFF (no #)', a: '118DFF', b: '#FFFFFF' },
  { label: 'red on #FFFFFF (a name)', a: 'red', b: '#FFFFFF' }, { label: "'' on #FFFFFF (empty)", a: '', b: '#FFFFFF' },
  { label: '#000000FF on #FFFFFF (eight digits)', a: '#000000FF', b: '#FFFFFF' },
];
const ratio = async (x, get) => { const r = (await get())(x.a, x.b); return Number.isFinite(r) ? Math.round(r * 100) / 100 : r; };

const ESCAPES = [
  { label: "'' (empty)", s: '' }, { label: 'a & b', s: 'a & b' }, { label: '<b>', s: '<b>' }, { label: '"q"', s: '"q"' },
  { label: "it's", s: "it's" }, { label: '&amp; (escaped already)', s: '&amp;' }, { label: 'المبيعات', s: 'المبيعات' },
  { label: 'null', s: null }, { label: 'undefined', s: undefined }, { label: '12 (a number)', s: 12 },
];
const esc1 = async (x, get) => (await get())(x.s);
// (DD2H) a page-only script reads the escape from the page's window, where html-escape.js put it
const escPage = async (x, get) => (await get({ window: { DAHtmlEscape: createRequire(abs('assets/js/html-escape.js'))('./html-escape.js') } }))(x.s);
const esc1n = () => async (x, get) => (await get())(x.n);

const BYTES = [
  { label: 'empty', b: [] }, { label: "'a'", b: [0x61] }, { label: "'123456789' (the check value)", b: [...'123456789'].map((c) => c.charCodeAt(0)) },
  { label: 'المبيعات in UTF-8', b: [...Buffer.from('المبيعات', 'utf8')] }, { label: 'one zero byte', b: [0] }, { label: 'four 0xFF bytes', b: [255, 255, 255, 255] },
  { label: '256 bytes 0..255', b: Array.from({ length: 256 }, (_, i) => i) }, { label: 'IHDR and a 1x1 header', b: [73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0] },
];
const crc = async (x, get) => (await get())(Uint8Array.from(x.b)) >>> 0;

const FILES = [
  { label: 'UTF-8, no BOM', b: [...Buffer.from('{"a":1}', 'utf8')] },
  { label: 'UTF-8 with BOM', b: [0xef, 0xbb, 0xbf, ...Buffer.from('{"a":1}', 'utf8')] },
  { label: 'UTF-16LE with BOM', b: [0xff, 0xfe, ...Buffer.from('{"a":1}', 'utf16le')] },
  { label: 'UTF-16LE, no BOM', b: [...Buffer.from('{"a":1}', 'utf16le')] },
  { label: 'Arabic UTF-8', b: [...Buffer.from('مبيعات', 'utf8')] },
  { label: 'empty', b: [] }, { label: 'one byte (a)', b: [0x61] }, { label: 'one byte 0xFF', b: [0xff] },
  { label: 'the BOM 0xFF 0xFE alone', b: [0xff, 0xfe] }, { label: 'a, then a zero byte', b: [0x61, 0x00] },
];
const decode = async (x, get) => (await get())(Uint8Array.from(x.b));
// (DD2D) the health worker reads model-file.js through self (its importScripts): given here as the worker has it
const workerSelf = () => ({ DAModelFile: createRequire(abs('assets/js/model-file.js'))('./model-file.js') });
const decodeInWorker = async (x, get) => (await get({ self: workerSelf() }))(Uint8Array.from(x.b));

const CANON = [
  { label: 'keys out of order', v: { b: 1, a: 2 } }, { label: 'an undefined value', v: { a: undefined, b: 1 } },
  { label: 'undefined at the top', v: undefined }, { label: 'null', v: null }, { label: 'an array keeps its order', v: [3, 1, 2] },
  { label: 'undefined inside an array', v: [1, undefined] }, { label: 'nested objects', v: { z: { y: 1, x: [{ b: 1, a: 0 }] } } },
  { label: 'NaN and -0', v: { n: NaN, z: -0 } }, { label: 'Arabic keys', v: { 'ب': 1, 'أ': 2 } }, { label: 'a Date', v: { d: new Date(0) } },
];

// reading order: boxes { name, x, y, w, h }; dir 'ltr' or 'rtl'; the answer: the names in order
const ORDERS = [
  { label: 'one row, left to right', dir: 'ltr', boxes: [['A', 0, 0], ['B', 300, 0], ['C', 600, 0]] },
  { label: 'one row, right to left', dir: 'rtl', boxes: [['A', 0, 0], ['B', 300, 0], ['C', 600, 0]] },
  { label: 'a row, one box 5 px lower (ltr)', dir: 'ltr', boxes: [['A', 300, 0], ['B', 0, 5]] },
  { label: 'a row, one box 5 px lower (rtl)', dir: 'rtl', boxes: [['A', 300, 0], ['B', 0, 5]] },
  { label: 'two rows (rtl)', dir: 'rtl', boxes: [['A', 0, 0], ['B', 300, 0], ['C', 0, 200], ['D', 300, 200]] },
  { label: 'a tall box beside two (rtl)', dir: 'rtl', boxes: [['T', 0, 0, 200, 400], ['U', 300, 0], ['V', 300, 200]] },
  { label: 'the same place (ltr)', dir: 'ltr', boxes: [['B', 0, 0], ['A', 0, 0]] },
  { label: 'empty page', dir: 'rtl', boxes: [] },
].map((o) => Object.assign(o, { boxes: o.boxes.map(([name, x, y, w = 200, h = 150]) => ({ name, x, y, w, h })) }));

// frame width: a page, its visuals (by name), and the one asked about
const FRAMES = [
  { label: 'no group', page: { width: 1280 }, visuals: [{ name: 'v' }], of: 'v' },
  { label: 'in a group with a box', page: { width: 1280 }, visuals: [{ name: 'g', visualGroup: {}, position: { x: 0, y: 0, width: 400, height: 300 } }, { name: 'v', parentGroupName: 'g' }], of: 'v' },
  { label: 'in a group with no box', page: { width: 1280 }, visuals: [{ name: 'g', visualGroup: {} }, { name: 'v', parentGroupName: 'g' }], of: 'v' },
  { label: 'in a group whose box has no height', page: { width: 1280 }, visuals: [{ name: 'g', visualGroup: {}, position: { x: 0, y: 0, width: 400 } }, { name: 'v', parentGroupName: 'g' }], of: 'v' },
  { label: 'its group is not on the page', page: { width: 1280 }, visuals: [{ name: 'v', parentGroupName: 'gone' }], of: 'v' },
  { label: 'a group named by a number', page: { width: 1280 }, visuals: [{ name: 7, visualGroup: {}, position: { x: 0, y: 0, width: 400, height: 300 } }, { name: 'v', parentGroupName: 7 }], of: 'v' },
  { label: 'no page size', page: {}, visuals: [{ name: 'v' }], of: 'v' },
  { label: 'no page at all', page: null, visuals: [{ name: 'v' }], of: 'v' },
  { label: "a group whose width is a text ('400')", page: { width: 1280 }, visuals: [{ name: 'g', visualGroup: {}, position: { x: 0, y: 0, width: '400', height: 300 } }, { name: 'v', parentGroupName: 'g' }], of: 'v' },
  { label: 'a group named an empty text', page: { width: 1280 }, visuals: [{ name: '', visualGroup: {}, position: { x: 0, y: 0, width: 400, height: 300 } }, { name: 'v', parentGroupName: '' }], of: 'v' },
];
const frameOf = (x) => x.visuals.find((v) => v.name === x.of);
const byNameOf = (x) => { const o = {}; x.visuals.forEach((v) => { if (v && v.name != null) o[v.name] = v; }); return o; };

// a table column's set width: the columnWidth entries, and the column asked about (its queryRef)
const W = (v, ref = 'T.a', more) => Object.assign({ properties: { value: L(v) }, selector: { metadata: ref } }, more || {});
const WIDTHS = [
  { label: '120D', cw: [W('120D')] }, { label: '120L', cw: [W('120L')] }, { label: '120 (no suffix)', cw: [W('120')] },
  { label: '120 (a number, not text)', cw: [W(120)] }, { label: '120.5D', cw: [W('120.5D')] }, { label: '0D', cw: [W('0D')] },
  { label: '-5D', cw: [W('-5D')] }, { label: 'abc', cw: [W('abc')] }, { label: 'no entry for the column', cw: [W('120D', 'T.b')] },
  { label: 'an entry with no properties', cw: [{ selector: { metadata: 'T.a' } }] },
  { label: 'two entries: 80D then 120D', cw: [W('80D'), W('120D')] }, { label: 'an entry with no selector', cw: [{ properties: { value: L('120D') } }] },
];
const tableOf = (x) => ({ visual: { visualType: 'tableEx', position: { x: 0, y: 0, width: 600, height: 300 }, query: { queryState: { Values: { projections: [{ queryRef: 'T.a', displayName: 'a' }] }, Rows: { projections: [{ queryRef: 'T.a' }] } } }, objects: { columnWidth: x.cw } } });


// 1g: model folders a chosen folder holds (made up; no file is read: a read stops the probe's answer at the folder)
const MODELS = [
  { label: 'one model at the top', m: ['Sales.SemanticModel'] },
  { label: 'two side by side', m: ['A.SemanticModel', 'B.SemanticModel'] },
  { label: 'one at the top, one deeper', m: ['A.SemanticModel', 'sub/B.SemanticModel'] },
  { label: 'two side by side in a project folder', m: ['p/A.SemanticModel', 'p/B.Dataset'] },
  { label: 'the older .Dataset name alone', m: ['Old.Dataset'] },
  { label: 'names that differ by letter case', m: ['b.SemanticModel', 'A.SemanticModel'] },
  { label: 'a backup of the same name deeper', m: ['Sales.SemanticModel', 'backup/Sales.SemanticModel'] },
  { label: 'three at the top', m: ['A.SemanticModel', 'B.SemanticModel', 'C.SemanticModel'] },
];
const pickedInBrowser = async (x, get) => {
  const files = x.m.map((m) => ({ name: 'T.tmdl', webkitRelativePath: 'Pick/' + m + '/definition/tables/T.tmdl', size: 10, arrayBuffer: () => { throw Object.assign(new Error('READ'), { at: m }); } }));
  try { await (await get())(files, { fromTmsl: () => [], relsOfTmsl: () => [], clean: (t) => t, tmdl: () => ({ fromFiles: () => ({}) }) }); return 'read nothing'; } catch (e) { return e.at ? 'uses ' + e.at : 'refuses ' + e.message; }
};
const pickedByRule = async (x, get) => { const r = (await get())(x.m, '/'); return r.path ? 'uses ' + r.path : 'refuses MANY_MODELS'; };
const pickedOnDisk = async (x, get) => {
  const root = path.join(path.sep, 'w');
  try { const d = (await get())(x.m.map((m) => path.join(root, ...m.split('/'))), root, 'w'); return 'uses ' + path.relative(root, d).split(path.sep).join('/'); } catch (e) { return 'refuses ' + (e.code || e.message); }
};

// 1h: a column's table (made up) and the column asked about
const C = (name, dataType, more) => Object.assign({ name }, dataType ? { dataType } : {}, more || {});
const SORTS = [
  { label: 'Month Name, Month Number int64', name: 'Month Name', cols: [C('Month Name', 'string'), C('Month Number', 'int64')] },
  { label: 'Month Name, Month Number with no dataType', name: 'Month Name', cols: [C('Month Name'), C('Month Number')] },
  { label: 'Day Name (Arabic), Day of Week Number int64', name: 'Day Name (Arabic)', cols: [C('Day Name (Arabic)', 'string'), C('Day of Week Number', 'int64')] },
  { label: 'Month Year, Year Month Number int64', name: 'Month Year', cols: [C('Month Year', 'string'), C('Year Month Number', 'int64')] },
  { label: 'Hijri Month Name, both month numbers', name: 'Hijri Month Name', cols: [C('Month Number', 'int64'), C('Hijri Month Number', 'int64')] },
  { label: 'Hijri Month Name, only the Gregorian number', name: 'Hijri Month Name', cols: [C('Month Number', 'int64')] },
  { label: 'Month Name, Month Number as text', name: 'Month Name', cols: [C('Month Number', 'string')] },
  { label: 'اسم الشهر, رقم الشهر int64', name: 'اسم الشهر', cols: [C('رقم الشهر', 'int64')] },
  { label: 'Month Name, a DAX table column with no dataType', name: 'Month Name', cols: [C('Month Number', null, { type: 'calculatedTableColumn' })] },
  { label: 'Sales (not a name to sort)', name: 'Sales', cols: [C('Month Number', 'int64')] },
  { label: 'Month Name, no column list at all', name: 'Month Name', cols: null },
];
const sortBy = async (x, get) => { const c = (await get())(x.cols, x.name); return c ? c.name : null; };

// a TMDL object name, quoted when it must be
const TNAMES = ['Sales', 'Sales Amount', 'Sales-2024', "O'Brien", 'المبيعات', '_x', '1st', '', 'Date'].map((n) => ({ label: n === '' ? "'' (empty)" : n, n }));
// four bytes read big-endian at an offset
const U32 = [
  { label: '00 00 00 01 at 0', b: [0, 0, 0, 1], i: 0 }, { label: 'FF FF FF FF at 0', b: [255, 255, 255, 255], i: 0 },
  { label: '80 00 00 00 at 0 (the top bit)', b: [128, 0, 0, 0], i: 0 }, { label: '12 34 56 78 at 0', b: [0x12, 0x34, 0x56, 0x78], i: 0 },
  { label: 'at offset 2', b: [9, 9, 0, 0, 1, 0], i: 2 }, { label: 'past the end', b: [1, 2], i: 0 },
  { label: 'a 1x1 IHDR width', b: [0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1], i: 8 }, { label: 'an empty buffer', b: [], i: 0 },
];
// a small cache that forgets the least recently used: a list of steps, the answers of its gets
const LRUS = [
  { label: 'set a, get a', max: 2, ops: [['set', 'a', 1], ['get', 'a']] },
  { label: 'get a missing key', max: 2, ops: [['get', 'x']] },
  { label: 'three sets in a cache of two', max: 2, ops: [['set', 'a', 1], ['set', 'b', 2], ['set', 'c', 3], ['get', 'a'], ['get', 'b'], ['get', 'c']] },
  { label: 'a get keeps a key', max: 2, ops: [['set', 'a', 1], ['set', 'b', 2], ['get', 'a'], ['set', 'c', 3], ['get', 'a'], ['get', 'b']] },
  { label: 'a set again replaces', max: 2, ops: [['set', 'a', 1], ['set', 'a', 5], ['get', 'a']] },
  { label: 'a cache of one', max: 1, ops: [['set', 'a', 1], ['set', 'b', 2], ['get', 'a'], ['get', 'b']] },
  { label: 'undefined as a value', max: 2, ops: [['set', 'a', undefined], ['get', 'a']] },
  { label: 'a set again keeps the other', max: 2, ops: [['set', 'a', 1], ['set', 'b', 2], ['set', 'a', 3], ['set', 'c', 4], ['get', 'a'], ['get', 'b']] },
];
const lruRun = async (x, get) => { const c = (await get())(x.max), out = []; for (const [op, k, v] of x.ops) { if (op === 'set') c.set(k, v); else out.push(c.get(k)); } return out.map((v) => (v === undefined ? 'undefined' : v)).join(' '); };
// a PNG chunk: its type and body, the bytes written (length, type, body, CRC)
const CHUNKS = [
  { label: 'IEND, empty', t: 'IEND', b: [] }, { label: 'IHDR 1x1 RGB', t: 'IHDR', b: [0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0] },
  { label: 'tEXt Comment', t: 'tEXt', b: [...Buffer.from('Comment\0made up', 'latin1')] }, { label: 'IDAT one byte', t: 'IDAT', b: [0] },
  { label: 'a 300-byte body', t: 'IDAT', b: Array.from({ length: 300 }, (_, i) => i & 255) }, { label: 'a lower-case type', t: 'abcd', b: [1, 2, 3] },
  { label: 'a body of 0xFF', t: 'IDAT', b: [255, 255, 255] }, { label: 'a 256-byte body', t: 'IDAT', b: Array.from({ length: 256 }, () => 7) },
];
const chunkHex = async (x, get) => { const c = (await get())(x.t, Uint8Array.from(x.b)); return Buffer.from(c).toString('hex').slice(0, 64) + (c.length > 32 ? '... (' + c.length + ' bytes)' : ''); };
// the reading limits of a model file, by kind
const LIMIT_KEYS = ['model', 'entry', 'total', 'file', 'entries', 'pbix', '', 'MODEL'].map((k) => ({ label: k === '' ? "'' (no kind)" : k, k }));
const limitOf = async (x, get) => (await get())[x.k];
const limitInWorker = async (x, get) => (await get({ self: workerSelf() }))[x.k];
// a text box's text: its paragraphs' runs
const TB = (paragraphs) => ({ visual: { visualType: 'textbox', objects: paragraphs === undefined ? {} : { general: [{ properties: { paragraphs } }] } } });
const BOXTEXTS = [
  { label: 'one paragraph, one run', j: TB([{ textRuns: [{ value: 'Sales' }] }]) },
  { label: 'one paragraph, two runs', j: TB([{ textRuns: [{ value: 'Sales ' }, { value: '2024' }] }]) },
  { label: 'two paragraphs', j: TB([{ textRuns: [{ value: 'Top' }] }, { textRuns: [{ value: 'Bottom' }] }]) },
  { label: 'an Arabic run', j: TB([{ textRuns: [{ value: 'المبيعات' }] }]) },
  { label: 'a run with a number value', j: TB([{ textRuns: [{ value: 0 }] }]) },
  { label: 'a run with no value', j: TB([{ textRuns: [{}] }]) },
  { label: 'no paragraphs', j: TB(undefined) },
  { label: 'an empty paragraph between two', j: TB([{ textRuns: [{ value: 'A' }] }, { textRuns: [] }, { textRuns: [{ value: 'B' }] }]) },
  { label: 'spaces around', j: TB([{ textRuns: [{ value: '  Sales  ' }] }]) },
];
// BLANK arithmetic, as Power BI Desktop 2.159.1231.0 answers it (DAX query view, lab/look032 B, 5 Nov): DIVIDE ( a, b ), a / b and a - b,
// BLANK as null. The editor's values panel has a ratio (DIVIDE) and a diff (-), no plain "/": a place that cannot
// take an input has `applies` false for it and is left out of that row
const BLANKS = [];
const bl = (v) => (v == null ? 'BLANK' : v);
for (const [f, a, b] of [['DIVIDE', 5, null], ['DIVIDE', null, null], ['DIVIDE', 5, 0], ['DIVIDE', 6, 3], ['/', 5, null], ['/', null, null], ['/', 5, 0], ['/', 0, 0], ['/', 6, 3],
  ['-', 5, 3], ['-', null, 3], ['-', 5, null], ['-', null, null], ['-', 5, 0]]) BLANKS.push({ label: f === 'DIVIDE' ? `DIVIDE ( ${bl(a)}, ${bl(b)} )` : `${bl(a)} ${f} ${bl(b)}`, o: f, a, b });
const blankByCompiler = async (x, get) => {
  const leaf = (v) => (v == null ? { k: 'blank' } : { k: 'num', n: v });
  const node = x.o === 'DIVIDE' ? { k: 'fn', f: 'DIVIDE', args: [leaf(x.a), leaf(x.b)] } : { k: 'op', o: x.o, a: leaf(x.a), b: leaf(x.b) };
  return (await get())(node, { vars: {}, measures: {} });
};
const blankByEditor = async (x, get) => {
  const values = [{ id: 'a', kind: 'measure', measure: 'A' }, { id: 'b', kind: 'measure', measure: 'B' }, { id: 'r', kind: x.o === '-' ? 'diff' : 'ratio', a: 'a', b: 'b' }];
  return (await get({ S: { design: { values } }, samples: () => ({ A: x.a, B: x.b }), root: { SVGKPIExpr: createRequire(import.meta.url)('../assets/js/svg-expressions.js') } }))().r;
};
const editorTakes = (x) => x.o === 'DIVIDE' || x.o === '-';

// ---- (0.3.3 SG1) the inputs of the moved groups (made up) ----
const lab = (v) => (v === undefined ? 'undefined' : JSON.stringify(v));
const SG1_TEXTS = [undefined, null, '', 'a', ['a', 'b'], [], 0, 12, true, {}, ['x', null, 3], 'a\nb'].map((v) => ({ label: lab(v), v }));
const SL = (v) => ({ expr: { Literal: { Value: v } } });
const SG1_LITS = [undefined, null, 0, 'x', {}, { expr: null }, { expr: {} }, { expr: { Literal: null } }, { expr: { Literal: {} } }, SL("'Sales'"), SL('12D'), SL(12), SL(false), SL(null)].map((v) => ({ label: lab(v), v }));
const SG1_LISTS = [undefined, null, {}, [], [1, null, 'x', {}], [{ properties: { a: 1 } }, { selector: { metadata: 'x' }, properties: { a: 2, b: 3 } }], [{ properties: null }, { properties: { c: 1 } }], [[1], { properties: { z: 0 } }], 'abc'].map((v) => ({ label: lab(v), v }));
const SG1_HEX = ['#000000', '#ffffff', '#FFFFFF', '#118DFF', '#12ab3', '#1', '', '#gg0000', '118DFF', '#118dff80'].map((v) => ({ label: lab(v), v }));
const SG1_ELS = [['div'], ['div', 'a b'], ['span', '', 'x'], ['span', null, ''], ['p', 'c', 0], ['p', 'c', null], ['p', 'c', undefined], ['a', 0, false], ['time', 'w', 12]].map((v) => ({ label: lab(v), v }));
const SG1_STATES = [['k', { a: 1 }], ['dataarcus-x', { currency: 'AED', users: [1, 2] }], ['k', null], ['k', 'text'], ['k', { a: 1 }, true], ['k', {}], ['k', [1]], ['', 0]].map(([key, state, refuses]) => ({ label: lab([key, state]) + (refuses ? ' (refused)' : ''), key, state, refuses }));
const SG1_KEYS = ["'Sales'[Total]", 'Sales[Total]', "  'My Table'[A [b]]  ", '[Total]', 'Sales', '', null, undefined, 12, "'Sales'[]", "'a''b'[c]"].map((v) => ({ label: lab(v), v }));
const SG1_PUTS = [[['a.json', 'b.json'], 'b.json', { x: 1 }], [['a.json'], 'a.json', [1, 'two']], [['a.json'], 'a.json', null], [['a.json'], 'missing.json', { x: 1 }], [['a.json', 'a.json'], 'a.json', { y: 'ي' }], [['a.json'], 'a.json', 'text'], [['a.json'], 'a.json', 0], [['a.json'], 'a.json', { n: { m: [] } }]].map(([paths, p, j]) => ({ label: lab([paths, p, j]), paths, p, j }));
const SG1_LEAVES = [[{ a: 1 }], [{ a: { b: 1, c: [1, 2] } }], [{}], [[]], [null], [1], ['x'], [{ a: null }], [{ a: 1 }, '/x'], [{ a: { b: {} } }, '/visual'], [5, '/p']].map((v) => ({ label: lab(v), v }));
const SG1_PATHS = [['p', 'Sales.Report'], ['a', 'b', 'c.json'], ['Sales‮.Report'], ['x'.repeat(80)], ['ar', 'تقرير'], ['..', 'out'], ['.', 'p'], ['p q', 'r']].map((v) => ({ label: lab(v.map((s) => (s.length > 20 ? s.slice(0, 20) + '...' : s))), v }));

export const FAMILIES = [
  { id: '1a', title: 'Is this column time?', question: 'a column named like this: is it a date part (a day, month, quarter, year, a date)?',
    inputs: NAMES, places: [
      P('assets/js/mirror-policy.js', 'isTime', 'inner', async (x, get) => (await get())({ Column: { Property: x.name, Expression: { SourceRef: { Entity: 'Sales' } } } }, [])),
      P('assets/js/page-preview.js', 'timeDirOf', 'inner', async (x, get) => (await get())({}, { field: { Column: { Property: x.name } } }) !== null),
      P('assets/js/pbip-query.js', 'isTime', 'inner', async (x, get) => (await get())({ c: x.name })),
      P('assets/js/layout-check.js', 'TIMEY', 'inner', async (x, get) => (await get()).test(x.name)),
    ] },
  { id: '1b-text', title: 'What text does a literal hold?', question: "a property's Literal: the text it holds ('Sales' -> Sales), or nothing",
    inputs: LITERALS, places: [
      P('assets/js/mirror-policy.js', 'strOf', 'inner', lit1()),
      P('assets/js/page-preview.js', 'lit', 'inner', lit1()),
      P('assets/js/page-preview.js', 'strOf', 'inner', lit1()),
      P('assets/js/report-a11y.js', 'strOf', 'inner', lit1()),
      P('assets/js/report-rules.js', 'str', 'inner', lit1()),
      P('mcp/lib/arabic-lens.mjs', 'strOf', 'source', lit1()),
      P('mcp/lib/check-language.mjs', 'litOfS', 'source', lit1()),
      P('mcp/lib/dax-functions.mjs', 'textOf', 'source', lit1()),
      P('mcp/lib/flip-cards.mjs', 'textOf', 'source', lit1()),
      P('mcp/lib/twin-pictures.mjs', 'lit', 'source', lit1()),
      P('mcp/lib/redesign.mjs', 'L', 'source', lit1(), { within: 'danglingOf' }),
    ] },
  { id: '1b-shown', title: 'What does a literal show?', question: "a property's Literal as a read-only report shows it (12D -> 12, 'Sales' -> Sales), or nothing",
    inputs: LITERALS, places: [
      P('assets/js/layout-check.js', 'litStr', 'inner', lit1()),
      P('mcp/lib/report-inventory.mjs', 'litStr', 'source', lit1()),
    ] },
  { id: '1b-number', title: 'What number does a literal hold?', question: "a property's Literal: the number it holds (12D -> 12), or nothing",
    inputs: LITERALS, places: [
      P('assets/js/page-preview.js', 'numOf', 'inner', lit1()),
      P('assets/js/layout-check.js', 'litNum', 'inner', lit1()),
      P('assets/js/report-rules.js', 'num', 'inner', lit1()),
      P('mcp/lib/flip-cards.mjs', 'numOf', 'source', lit1()),
      P('mcp/lib/report-inventory.mjs', 'litNum', 'source', lit1()),
    ] },
  { id: '1b-bool', title: 'What true or false does a literal hold?', question: "a property's Literal: true, false, or nothing",
    inputs: LITERALS, places: [
      P('assets/js/page-preview.js', 'boolOf', 'inner', lit1()),
      P('assets/js/layout-check.js', 'litBool', 'inner', lit1()),
      P('mcp/lib/report-inventory.mjs', 'litBool', 'source', lit1()),
    ] },
  { id: '1c', title: 'How wide is the frame a visual is mirrored inside?', question: "the width a visual's x is mirrored in: its parent group's, else the page's",
    inputs: FRAMES, places: [
      P('assets/js/mirror-units.js', 'frameWidth', 'export', async (x, get) => (await get())(x.page, byNameOf(x), frameOf(x))),
      P('mcp/lib/twin-geometry.mjs', 'widthOf', 'source', async (x, get) => (await get({ byName: byNameOf(x), pageW: x.page ? x.page.width : undefined }))(frameOf(x)), { within: 'underGrids' }),
      P('mcp/lib/twin-text-fit.mjs', 'widthOf', 'source', async (x, get) => (await get({ byName: byNameOf(x), page: x.page, frameWidth: await exported('assets/js/mirror-units.js', 'frameWidth') }))(frameOf(x)), { within: 'fitButtons' }),
      P('mcp/lib/twin-geometry.mjs', 'widthOf', 'source', async (x, get) => (await get({ byName: byNameOf(x), pg: { page: x.page || undefined } }))(frameOf(x)), { within: 'aroundTables' }),
    ] },
  { id: '1d', title: 'What width did the report set for this table column?', question: "a table's columnWidth entry for a column (by its queryRef): its width, or none",
    inputs: WIDTHS, places: [
      P('assets/js/report-rules.js', 'widthOf', 'source', async (x, get) => (await get({ o: { columnWidth: x.cw } }))('T.a'), { within: 'tableHeaders' }),
      P('mcp/lib/dax-functions.mjs', 'widthOf', 'source', async (x, get) => (await get({ cw: x.cw }))({ queryRef: 'T.a' }), { within: 'fitPictures' }),
      P('mcp/lib/twin-text-fit.mjs', 'widthOf', 'source', async (x, get) => (await get({ o: { columnWidth: x.cw } }))('T.a'), { within: 'fitHeaders' }),
      P('mcp/lib/twin-plan.mjs', 'own', 'source', async (x, get) => (await get({ cw: x.cw }))('T.a'), { within: 'tablesStep', after: 'const longestWord' }),
      P('mcp/lib/twin-geometry.mjs', 'strip', 'source', async (x, get) => (await get())(tableOf(x)), { within: 'underGrids' }),
    ] },
  { id: '1f', title: 'Is this text Arabic?', question: 'a text: does it hold an Arabic letter (the test that sends it the Arabic way)?',
    inputs: TEXTS, places: [
      P('assets/js/text-measure.js', 'ARABIC', 'export', async (x, get) => (await get()).test(x.s)),
      P('assets/js/field-catalog.js', 'langOf', 'export', async (x, get) => (await get())(x.s) === 'ar'),
      // (DD1F) an Arabic header has a band below its need (lowW < needW); any other text none
      P('assets/js/report-rules.js', 'headerNeed', 'export', async (x, get) => { const m = (await get())(x.s, 12, 'Segoe UI', 1); return m.lowW < m.needW; }),
      P('assets/js/pbip-query.js', 'AR_LETTERS', 'export', async (x, get) => (await get()).test(x.s)),
      P('mcp/lib/dax-functions.mjs', 'storyLang', 'export', async (x, get) => (await get())(x.s, 'ar') === 'ar'),
      P('mcp/lib/report-bind.mjs', 'arName', 'export', async (x, get) => (await get())('W', 'E')(x.s).startsWith('W ')),
      P('mcp/lib/twin-plan.mjs', 'arOf', 'source', async (x, get) => (await get())(x.s), { within: 'labelsStep' }),
    ] },
  { id: 'grid', title: 'Does this visual keep its grid left to right?', question: 'a visual type: a table or a matrix, whose columns Desktop keeps left to right in the twin',
    inputs: TYPES, places: [
      P('assets/js/mirror-policy.js', 'keepsGridLtr', 'inner', async (x, get) => (await get())({ visual: { visualType: x.t } })),
      P('mcp/lib/page-picture.mjs', 'newOverlaps', 'export', async (x, get) => { const r = (await get())(...turnedBars(x.t, 'barChart')); return { v: r.length === 1 && r[0].why === 'barsTurned', note: r.map((o) => o.why).join() }; }),
    ] },
  { id: 'vt-slicer', title: 'Is this visual a slicer?', question: 'a visual type: is it a slicer (a visual that filters the page by its field)?',
    inputs: TYPES, places: [
      P('assets/js/visual-types.js', 'isSlicer', 'export', async (x, get) => (await get())(x.t)),
      P('assets/js/mirror-policy.js', 'kindOf', 'inner', async (x, get) => { const k = await mpKind(x.t, get); return { v: k === 'slicer', note: k }; }),
      P('assets/js/page-preview.js', 'kindOf', 'inner', async (x, get) => { const k = await ppKind(x.t, get); return { v: k === 'slicer', note: k }; }),
      // (DD2Z) check_report's alt text for a slicer ("Filters the page by ...") and read_report's inventory flag `slicer`
      P('assets/js/report-a11y.js', 'describe', 'export', async (x, get) => { const t = (await get())({ visualType: x.t, query: { queryState: { Values: { projections: [{ field: { Column: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Region' } }, queryRef: 'Sales.Region' }] } } } }, 'en'); return typeof t === 'string' && t.startsWith('Filters the page by'); }),
      P('mcp/lib/report-inventory.mjs', 'inventory', 'export', async (x, get) => {
        const J = (o) => Buffer.from(JSON.stringify(o)), { memorySource } = await import(pathToFileURL(abs('mcp/lib/read-report.mjs')).href);
        const files = [{ path: 'definition/report.json', data: J({}) }, { path: 'definition/pages/pages.json', data: J({ pageOrder: ['p1'] }) }, { path: 'definition/pages/p1/page.json', data: J({ name: 'p1', displayName: 'P' }) },
          { path: 'definition/pages/p1/visuals/v1/visual.json', data: J({ name: 'v1', position: { x: 0, y: 0, width: 100, height: 50 }, visual: { visualType: x.t } }) }];
        return (await get())(memorySource(files), 'R').pages[0].visuals[0].slicer === true;
      }),
    ] },
  { id: 'vt-bar', title: 'Is this visual a bar chart?', question: 'a visual type: a chart of horizontal bars?',
    inputs: TYPES, places: [
      P('assets/js/mirror-policy.js', 'kindOf', 'inner', async (x, get) => { const k = await mpKind(x.t, get); return { v: k === 'bar', note: k }; }),
      P('assets/js/page-preview.js', 'kindOf', 'inner', async (x, get) => { const k = await ppKind(x.t, get); return { v: k === 'bar', note: k }; }),
      P('assets/js/visual-types.js', 'isBar', 'export', async (x, get) => (await get())(x.t)),
      P('assets/js/layout-check.js', 'placeOf', 'export', async (x, get) => (await get())({ type: x.t }) === 'the bar chart'),
      P('mcp/lib/page-picture.mjs', 'newOverlaps', 'export', async (x, get) => { const r = (await get())(...turnedBars('tableEx', x.t)); return { v: r.length === 1 && r[0].why === 'barsTurned', note: r.map((o) => o.why).join() }; }),
    ] },
  { id: 'canon', title: 'What is the canonical text of a plan?', question: 'a value: its JSON with keys sorted and undefined left out (the text a digest is taken of)',
    inputs: CANON, places: [
      P('mcp/lib/canon.mjs', 'canon', 'export', async (x, get) => (await get())(x.v)),
    ] },
  { id: 'crc', title: 'What is the CRC-32 of these bytes?', question: 'bytes: their CRC-32 (the PNG and ZIP checksum)',
    inputs: BYTES, places: [
      P('assets/js/png-bytes.js', 'crc32', 'export', crc),
      P('assets/js/pbip-zip.js', 'crc32', 'export', crc),
    ] },
  { id: 'overlap', title: 'Do these two boxes overlap?', question: 'two boxes on a page: do they overlap by more than a rounding (half a pixel each way)?',
    inputs: BOXES, places: [
      P('mcp/lib/box-overlap.mjs', 'overlaps', 'export', async (x, get) => (await get())(wh(x.a), wh(x.b))),
    ] },
  { id: 'overlap-area', title: 'How much do two boxes overlap?', question: 'two boxes on a page: the area they share',
    inputs: BOXES, places: [
      P('mcp/lib/box-overlap.mjs', 'overlapArea', 'export', async (x, get) => Math.round((await get())(wh(x.a), wh(x.b)) * 100) / 100),
    ] },
  { id: 'contrast', title: 'What is the contrast of two colours?', question: 'two colours: their WCAG contrast ratio (1 to 21)',
    inputs: COLOURS, places: [
      P('assets/js/contrast.js', 'contrast', 'export', ratio),
      P('assets/js/design-colours.js', 'contrast', 'export', ratio),
      P('assets/js/pbip-query.js', 'contrast', 'export', ratio),
      P('assets/js/svg-kpi-compiler.js', 'contrastOf', 'inner', ratio),
    ] },
  { id: 'xml', title: 'How is a text escaped for XML (SVG)?', question: 'a text: the same text safe inside an XML attribute or element (& < > \' ")',
    inputs: ESCAPES, places: [
      P('assets/js/svg-escape.js', 'xmlEsc', 'inner', esc1),
      P('mcp/lib/flip-cards.mjs', 'xml', 'source', esc1),
    ] },
  { id: 'html', title: 'How is a text escaped for HTML?', question: 'a text: the same text safe inside an HTML page (& < > " \')',
    inputs: ESCAPES, places: [
      P('assets/js/exam-view.js', 'esc', 'source', esc1),
      P('assets/js/field-picker-ui.js', 'esc', 'source', esc1),
      P('assets/js/health-downloads.js', 'esc', 'source', esc1),
      P('assets/js/health-view.js', 'esc', 'source', esc1),
      P('assets/js/page-preview.js', 'esc', 'inner', esc1),
      P('assets/js/svg-kpi-designer.js', 'esc', 'source', escPage),
      P('assets/js/theme-generator.js', 'esc', 'source', escPage),
      P('assets/js/measure-builder.js', 'escapeHtml', 'source', escPage),
      P('mcp/lib/approval-view.mjs', 'esc', 'source', esc1),
    ] },
  { id: 'decode', title: 'What text do the bytes of a Power BI file hold?', question: "a file's bytes: its text (UTF-16LE or UTF-8, a BOM or none)",
    inputs: FILES, places: [
      P('assets/js/model-file.js', 'decodeText', 'export', decode),
      P('assets/js/model-health-worker.js', 'decodeText', 'source', decodeInWorker),
      P('assets/js/model-import-browser.js', 'decodeText', 'source', decode),
      P('mcp/lib/model.mjs', 'decode', 'export', decode),
    ] },
  { id: '1g', title: 'Which model folder is read?', question: 'a chosen folder holding model folders: the one read, or a refusal',
    inputs: MODELS, places: [
      P('assets/js/model-nearest.js', 'nearest', 'export', pickedByRule),
      P('assets/js/model-import-browser.js', 'fromFolder', 'export', pickedInBrowser),
      P('mcp/lib/model-discovery.mjs', 'nearestModel', 'export', pickedOnDisk),
    ] },
  { id: '1h', title: 'Which column sorts this one?', question: "a month or day name column: the number column of its table that sorts it, or none",
    inputs: SORTS, places: [
      P('assets/js/sort-column.js', 'sortColumnFor', 'export', sortBy),
      P('assets/js/field-catalog.js', 'sortColumnFor', 'export', sortBy),
      P('assets/js/model-health-tmdl.js', 'sortColumnFor', 'export', sortBy),
    ] },
  { id: 'tmdl-name', title: 'How is a name written in TMDL?', question: "a table or column name: as TMDL writes it (bare, or in single quotes with ' doubled)",
    inputs: TNAMES, places: [
      P('assets/js/tmdl-name.js', 'tmdlName', 'export', esc1n()),
      P('assets/js/model-health-tmdl.js', 'name', 'inner', esc1n()),
      P('assets/js/measure-builder.js', 'tName', 'source', async (x, get) => (await get({ window: { DATmdlName: createRequire(abs('assets/js/tmdl-name.js'))('./tmdl-name.js') } }))(x.n)),   // (DD2N) the page's window
      P('mcp/lib/model-culture.mjs', 'q', 'source', esc1n()),
      P('mcp/lib/sample-project.mjs', 'name', 'source', esc1n()),
      P('mcp/lib/shadow-model.mjs', 'q', 'source', esc1n()),
      P('mcp/lib/twin-model.mjs', 'tmdlName', 'source', esc1n()),
    ] },
  { id: 'u32', title: 'What number do four bytes hold?', question: 'bytes and an offset: the big-endian unsigned 32-bit number there (a PNG read)',
    inputs: U32, places: [
      P('assets/js/png-bytes.js', 'u32', 'export', async (x, get) => (await get())(Uint8Array.from(x.b), x.i)),
    ] },
  { id: 'lru', title: 'What does a small cache keep?', question: 'a cache of N entries: what its gets answer after these sets (the least recently used goes first)',
    inputs: LRUS, places: [
      P('mcp/lib/small-cache.mjs', 'lru', 'export', lruRun),
    ] },
  { id: 'png-chunk', title: 'What bytes make a PNG chunk?', question: "a chunk's type and body: its bytes (length, type, body, CRC-32)",
    inputs: CHUNKS, places: [
      P('assets/js/png-bytes.js', 'pngChunk', 'export', chunkHex),
    ] },
  { id: 'limits', title: 'How large may a model file be?', question: 'a kind of model file or entry: the size (or count) over which it is refused before it is read',
    inputs: LIMIT_KEYS, places: [
      P('assets/js/model-file.js', 'LIMITS', 'export', limitOf),
      P('assets/js/model-health-worker.js', 'LIMITS', 'source', limitInWorker),
      P('assets/js/model-import-browser.js', 'LIMITS', 'export', limitOf),
      P('mcp/lib/model.mjs', 'PBIT_LIMITS', 'export', limitOf),
    ] },
  // (DD2T) one reader of the runs; each caller's textOf joins its texts itself (" / " and trimmed, or " "): test dd2t
  { id: 'text-runs', title: 'What text does a text box hold?', question: "a text box's paragraphs: one text per paragraph, its runs' text",
    inputs: BOXTEXTS, places: [
      P('assets/js/text-runs.js', 'paragraphTexts', 'export', async (x, get) => (await get())((((x.j.visual.objects || {}).general || [])[0] || { properties: {} }).properties.paragraphs)),
    ] },
  { id: 'blank', title: 'What is BLANK minus or divided by a number?', question: 'DIVIDE ( a, b ), a / b and a - b with BLANK (null), as Power BI Desktop answers them',
    inputs: BLANKS, places: [
      P('assets/js/svg-expressions.js', 'evalNode', 'inner', blankByCompiler),
      P('assets/js/svg-editor-panels.js', 'evalValues', 'source', blankByEditor, { applies: editorTakes }),
    ] },
  // (0.3.3 SG1) the reviewer's same-shape groups that answer one question: one place each since SG1 (test mcp/test-0.3.3-sg1.mjs).
  // path-out and rel-out answer from the working folder: run the probe with DATAARCUS_ROOT set (any empty folder), else both throw.
  { id: 'expr-text', title: 'What text does an expression given as lines hold?', question: 'an expression written as one text or as its lines (a model JSON writes both): one text',
    inputs: SG1_TEXTS, places: [
      P('assets/js/dax-reference-parser.js', 'exprText', 'export', async (x, get) => (await get())(x.v)),
    ] },
  { id: 'lit-value', title: 'What value is a literal written as?', question: "a property's Literal: its Value as written (12D stays \"12D\"), else undefined",
    inputs: SG1_LITS, places: [
      P('assets/js/pbir-values.js', 'litValue', 'export', async (x, get) => (await get())(x.v)),
    ] },
  { id: 'obj-entries', title: 'Which entries does an objects list hold?', question: "a visual's objects list: its object entries, the plain ones' properties merged, all properties merged",
    inputs: SG1_LISTS, places: [
      P('assets/js/pbir-values.js', 'entries', 'export', async (x, get) => { const PV = createRequire(abs('assets/js/pbir-values.js'))(abs('assets/js/pbir-values.js')); await get(); return [PV.entries(x.v), PV.plain(x.v), PV.anyOf(x.v)]; }),   // entries, plain, anyOf: one answer
    ] },
  { id: 'hex-rgb', title: 'What red, green and blue does a hex colour hold?', question: '#rrggbb: its [r, g, b] (0 to 255; NaN where a pair is not hex)',
    inputs: SG1_HEX, places: [
      P('assets/js/design-colours.js', 'hexToRgb', 'export', async (x, get) => (await get())(x.v)),
    ] },
  { id: 'page-el', title: 'What element does a page make for a class and a text?', question: 'a tag, a class and a text: a new element with that class (when given) and that text (when not null)',
    inputs: SG1_ELS, places: [
      P('assets/js/page-toast.js', 'el', 'export', async (x, get) => { const e = (await get())({ createElement: (tag) => ({ tag, className: '(unset)', textContent: '(unset)' }) }, ...x.v); return [e.tag, e.className, e.textContent]; }),
    ] },
  { id: 'page-save', title: 'What does a page keep of its state?', question: "a page's key and state: what localStorage is given (nothing, never an error, when it refuses)",
    inputs: SG1_STATES, places: [
      P('assets/js/page-toast.js', 'saveState', 'export', async (x, get) => { const save = await get(), log = [], had = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
        Object.defineProperty(globalThis, 'localStorage', { value: x.refuses ? { setItem: () => { throw new Error('quota'); } } : { setItem: (k, v) => log.push([k, v]) }, configurable: true, writable: true });
        try { return [save(x.key, x.state), log]; } finally { if (had) Object.defineProperty(globalThis, 'localStorage', had); else delete globalThis.localStorage; } }),
    ] },
  { id: 'measure-key', title: "Which table and measure does 'T'[M] name?", question: "a measure written 'Table'[Measure] or Table[Measure]: { t, m }, else null",
    inputs: SG1_KEYS, places: [
      P('mcp/lib/model-script.mjs', 'keyOf', 'export', async (x, get) => (await get())(x.v)),
    ] },
  { id: 'put-json', title: "What does a plan's file hold after a JSON is put in it?", question: "the plan's files, a path and a JSON: the files after (two spaces; a path the plan lacks throws)",
    inputs: SG1_PUTS, places: [
      P('mcp/lib/model-script.mjs', 'putJson', 'export', async (x, get) => { const files = x.paths.map((p) => ({ path: p, data: 'old' })), at = new Map(files.map((f, i) => [f.path, i])); (await get())(files, at, x.p, x.j); return files; }),
    ] },
  { id: 'leaves', title: 'Which leaf pointers does a value hold?', question: 'a value and a start: every leaf pointer ("/a/b" for { a: { b: 1 } })',
    inputs: SG1_LEAVES, places: [
      P('mcp/lib/redesign-kinds.mjs', 'leaves', 'export', async (x, get) => (await get())(...x.v)),
    ] },
  { id: 'path-out', title: 'How is a path inside the working folder said, dots kept?', question: "a file: its path from the working folder, '/' between parts, each part cleaned, '..' and '.' kept",
    inputs: SG1_PATHS, places: [
      P('mcp/lib/twin-read.mjs', 'pathOut', 'export', async (x, get) => { const { ROOT } = await import(pathToFileURL(abs('mcp/lib/model.mjs')).href); return (await get())(path.join(ROOT || path.sep, ...x.v)); }),
    ] },
  { id: 'rel-out', title: 'How is a path inside the working folder said, every part cleaned?', question: "a file: its path from the working folder, '/' between parts, every part cleaned",
    inputs: SG1_PATHS, places: [
      P('mcp/lib/check-redact.mjs', 'relOut', 'export', async (x, get) => { const { ROOT } = await import(pathToFileURL(abs('mcp/lib/model.mjs')).href); return (await get())(path.join(ROOT || path.sep, ...x.v)); }),
    ] },
];

// the families that are NOT one question, with the reason (CONTRACTS.md's "Not one question" list holds the same names)
export const NOT_ONE = [
  { file: 'mcp/lib/model.mjs', fn: 'isDir', why: 'isDir and isLink share a shape (an lstat and a test), not a question (Codex, 4 Nov)' },
  // (0.3.3 SG1) the reviewer's same-shape groups that are not one question (mcp/work/SG1.md, the allow list)
  { file: 'mcp/lib/read-report.mjs', fn: 'isDir', why: 'never follows a link (lstat), where model.mjs isDir follows one: two questions (group 5)' },
  { file: 'assets/js/field-suggest.js', fn: 'rank', why: 'a step pipeline like addGulfCalendar: field ranking, not the calendar table (group 6)' },
  { file: 'assets/js/exam-view.js', fn: 'toast', why: "a one-line call of page-toast.js with the exam page's own box and time (group 11)" },
  { file: 'mcp/lib/plans.mjs', fn: 'shown', why: "a plan value's canonical text capped at 200, not a report name capped at 60 (cleanName) (group 12)" },
];

// ---- running ----
const show = (v) => (v === undefined ? 'undefined' : typeof v === 'number' && !Number.isFinite(v) ? String(v) : typeof v === 'string' ? JSON.stringify(v) : Object.is(v, -0) ? '-0' : JSON.stringify(v));
export async function answerOf(place, input) {
  if (place.applies && !place.applies(input)) return { key: '\u0000n/a', shown: 'n/a', na: true };
  for (let round = 0; ; round++) {
    try {
      const a = await place.run(input, getter(place));
      return a && typeof a === 'object' && 'v' in a ? { key: show(a.v), shown: show(a.v) + (a.note != null ? ' (' + a.note + ')' : '') } : { key: show(a), shown: show(a) };
    } catch (e) {
      if (e.learnFrom && round < 60 && (await e.learnFrom.learn(e))) continue;
      const what = /^(.*?) is not defined/.exec(e.message);
      return { key: 'throws ' + e.name, shown: 'throws ' + e.name + (what ? ' (' + what[1] + ')' : ''), error: e };
    }
  }
}
export const placeName = (p) => `${p.file} ${p.fn}${p.within ? ' (in ' + p.within + ')' : ''}`;
// one family: every place on every input; the places that answer the same everywhere are one column (a group)
export async function probe(f) {
  const rows = [];
  for (const input of f.inputs) { const r = []; for (const p of f.places) r.push(await answerOf(p, input)); rows.push({ input, answers: r }); }
  const sig = f.places.map((p, i) => rows.map((r) => r.answers[i].shown).join('\u0001'));
  const groups = [];
  f.places.forEach((p, i) => { const g = groups.find((x) => x.sig === sig[i]); if (g) g.places.push(i); else groups.push({ sig: sig[i], places: [i] }); });
  rows.forEach((r) => { r.differ = new Set(r.answers.filter((a) => !a.na).map((a) => a.key)).size > 1; });
  return { family: f, rows, groups, disagree: rows.filter((r) => r.differ).length, broken: f.places.filter((p, i) => rows.every((r) => r.answers[i].error && !/^throws TypeError/.test(r.answers[i].key))).map(placeName) };
}

const letter = (i) => String.fromCharCode(65 + i);
function textTable(res) {
  const { family: f, rows, groups } = res, out = [];
  out.push(`== ${f.id}  ${f.title}  (${f.places.length} places, ${f.inputs.length} inputs, they disagree on ${res.disagree})`);
  groups.forEach((g, k) => out.push(`   ${letter(k)} = ${g.places.map((i) => placeName(f.places[i]) + (f.places[i].how === 'source' ? ' [source]' : '')).join('; ')}`));
  for (const r of rows) out.push(`${r.differ ? ' !' : '  '} ${r.input.label.padEnd(40)} | ${groups.map((g, k) => letter(k) + ' ' + r.answers[g.places[0]].shown).join(' | ')}`);
  return out.join('\n');
}
function mdBlock(res) {
  const { family: f, rows, groups } = res, out = [];
  out.push(`### ${f.id}: today (the probe)`, '');
  groups.forEach((g, k) => out.push(`- ${letter(k)}: ${g.places.map((i) => '`' + f.places[i].file + '` ' + f.places[i].fn).join(', ')}`));
  out.push('');
  const diff = rows.filter((r) => r.differ);
  if (!diff.length) { out.push(`All ${f.places.length} answer the same on all ${f.inputs.length} inputs.`); return out.join('\n'); }
  out.push('| input | ' + groups.map((g, k) => letter(k)).join(' | ') + ' |', '|---|' + groups.map(() => '---|').join(''));
  for (const r of diff) out.push(`| ${r.input.label.replace(/\|/g, '/')} | ${groups.map((g) => r.answers[g.places[0]].shown.replace(/\|/g, '/')).join(' | ')} |`);
  return out.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const md = process.argv.includes('--md'), json = process.argv.includes('--json');
  const results = [];
  for (const f of FAMILIES) results.push(await probe(f));
  const problems = [];
  for (const r of results) {
    if (r.family.inputs.length < 8) problems.push(`FAIL contracts-probe ${r.family.id}: ${r.family.inputs.length} inputs, at least 8`);
    for (const b of r.broken) problems.push(`FAIL contracts-probe ${r.family.id}: ${b} could not be run on any input (${r.rows[0].answers[r.family.places.findIndex((p) => placeName(p) === b)].shown})`);
  }
  if (json) console.log(JSON.stringify(results.map((r) => ({ id: r.family.id, places: r.family.places.map(placeName), groups: r.groups.map((g) => g.places), rows: r.rows.map((x) => ({ input: x.input.label, differ: x.differ, answers: x.answers.map((a) => a.shown) })) })), null, 1));
  else console.log(results.map(md ? mdBlock : textTable).join('\n\n') + '\n');
  const checks = results.reduce((n, r) => n + r.rows.length * r.family.places.length, 0);
  const places = results.reduce((n, r) => n + r.family.places.length, 0), disagreeing = results.filter((r) => r.disagree).length;
  if (problems.length) { problems.forEach((p) => console.log(p)); console.log(`FAIL  contracts-probe  ${problems.length} of ${checks} checks failed`); process.exit(1); }
  console.log(`PASS  contracts-probe  ${checks} checks (${results.length} families, ${places} places, ${disagreeing} families disagree)`);
}
