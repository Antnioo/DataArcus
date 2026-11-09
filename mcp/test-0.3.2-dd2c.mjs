// 0.3.2 DD2C (mcp/work/DD2C.md): one canonical text of a plan. mcp/lib/canon.mjs canon (JSON with every object's
// keys sorted and undefined left out) is the one home of CONTRACTS.md's family canon: the text a plan's binding to
// its click (artifact.mjs bindingOf, modelPrintOf) and the gate's comparison of a write's inputs with the plan's pins
// (plans.mjs inputDifferences and the gate) are taken of. The security path: no answer changes. Made-up values only.
//   C1-C16  canon on the contract probe's 10 values and 6 more (key order deep in arrays, undefined in nested objects,
//           an empty object and array, a string, a number, true), each answer pinned; F1 the module's one name
//   B1-B3, M1-M4, D1-D3  the base's (128285e, measured before DD2C, mcp/work/DD2C.md) digests and differences of
//           made-up plans: bindingOf, modelPrintOf and inputDifferences, byte for byte
//   P1-P16  parity: both old copies (artifact.mjs canon and plans.mjs canon, read from the base's source saved in
//           mcp/fixtures/hk1/dd2c, the commit 128285e's bytes) and canon.mjs on C1-C16: one answer per value
//   Q1-Q3   the bindings and prints of B1, B2 and M1 taken with each old copy (sha256 of its text): the same digest
//   S1-S2   one place: neither caller holds a canonical text of its own; each imports canon.mjs
//   node test-0.3.2-dd2c.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as Canon from './lib/canon.mjs';
import { bindingOf, modelPrintOf } from './lib/artifact.mjs';
import { inputDifferences } from './lib/plans.mjs';

const { canon } = Canon;
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const show = (s) => JSON.stringify(s);

// [id, label, the value, its canonical text]: the probe's 10 (scripts/contracts-probe.mjs CANON), then 6 more
export const VALUES = [
  ['C1', 'keys out of order', { b: 1, a: 2 }, '{"a":2,"b":1}'],
  ['C2', 'an undefined value', { a: undefined, b: 1 }, '{"b":1}'],
  ['C3', 'undefined at the top', undefined, 'null'],
  ['C4', 'null', null, 'null'],
  ['C5', 'an array keeps its order', [3, 1, 2], '[3,1,2]'],
  ['C6', 'undefined inside an array', [1, undefined], '[1,null]'],
  ['C7', 'nested objects', { z: { y: 1, x: [{ b: 1, a: 0 }] } }, '{"z":{"x":[{"a":0,"b":1}],"y":1}}'],
  ['C8', 'NaN and -0', { n: NaN, z: -0 }, '{"n":null,"z":0}'],
  ['C9', 'Arabic keys', { 'ب': 1, 'أ': 2 }, '{"أ":2,"ب":1}'],
  ['C10', 'a Date', { d: new Date(0) }, '{"d":"1970-01-01T00:00:00.000Z"}'],
  ['C11', 'undefined deep in an object', { p: { q: undefined, r: { s: undefined, t: 2 } } }, '{"p":{"r":{"t":2}}}'],
  ['C12', 'objects in an array, keys out of order', [{ y: 1, x: 2 }, { b: [{ d: 1, c: 2 }] }], '[{"x":2,"y":1},{"b":[{"c":2,"d":1}]}]'],
  ['C13', 'an empty object and array', { b: [], a: {} }, '{"a":{},"b":[]}'],
  ['C14', 'a string', 'Sales[Amount]', '"Sales[Amount]"'],
  ['C15', 'a number', 12.5, '12.5'],
  ['C16', 'true', true, 'true'],
];
for (const [id, label, v, want] of VALUES) { const got = canon(v); chk(() => got === want, () => `${id} ${label}: canon gave ${show(got)}, pinned ${show(want)}`); }
chk(() => Object.keys(Canon).join() === 'canon' && typeof canon === 'function', () => `F1 canon.mjs must export canon only: ${Object.keys(Canon)}`);

// ---------- the base's digests (128285e, mcp/work/DD2C.md), byte for byte ----------
const SALES = { tmsl: { model: { tables: [{ name: 'Sales', columns: [{ name: 'Amount' }] }] } } };
const M1 = { tmsl: { model: { tables: [{ name: 'Sales', columns: [{ name: 'Amount', dataType: 'decimal' }] }], culture: 'en-US' } } };
const M2 = { tmsl: { model: { culture: 'en-US', tables: [{ columns: [{ dataType: 'decimal', name: 'Amount' }], name: 'Sales' }] } } };
const Z = '0'.repeat(64);
export const DIGESTS = [
  ['B1', () => bindingOf(Z, { slots: [{ kind: 'card', field: 'Sales[Amount]' }], theme: 'dark', x: undefined }, 'print-1'), '2abd90d8094efad9b652a24798edf89146d92c73e9c4dd56b4d4fd896d758168'],
  ['B2', () => bindingOf('ab'.repeat(32), { pages: 2, lang: 'ar', title: 'المبيعات' }, modelPrintOf(SALES)), 'bdc64fbc4629f239d0a20c47ebcace81745c876beb778806eacbc4e76fda7e90'],
  ['B3', () => bindingOf(Z, undefined, undefined), 'abddc6b08f6a8b36c5b112fddbbd55f18f296780ff019885c20fadb88301fefa'],
  ['M1', () => modelPrintOf(M1), 'c37e54d5bd9c331738143f8a6504122748ea34eada5562adf7187549981fa466'],
  ['M2', () => modelPrintOf(M2), 'c37e54d5bd9c331738143f8a6504122748ea34eada5562adf7187549981fa466'],
  ['M3', () => modelPrintOf(null), '74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b'],
  ['M4', () => modelPrintOf({ print: 'kept' }), 'kept'],
  ['D1', () => show(inputDifferences({ slicers: ['Date[Year]', 'Region[Name]'], theme: 'dark' }, { slicers: ['Region[Name]'], theme: 'light' })),
    show(['slicers: the plan holds "Date[Year]", not passed; pass slicers = ["Date[Year]","Region[Name]"]', 'theme: passed "light", the plan holds "dark"; pass theme = "dark"'])],
  ['D2', () => show(inputDifferences({ files: { a: 1, b: 2 }, kpis: { z: 1, y: undefined } }, { files: { a: 1, b: 3 }, kpis: { y: undefined, z: 1 } })), '["files (b)"]'],
  ['D3', () => show(inputDifferences({ pages: [{ b: 1, a: 2 }] }, { pages: [{ a: 2, b: 1 }] })), '[]'],
];
for (const [id, f, want] of DIGESTS) { let got; try { got = f(); } catch (e) { got = 'throws ' + e.message; } chk(() => got === want, () => `${id}: ${show(got).slice(0, 200)}, the base gave ${show(want).slice(0, 200)}`); }

// ---------- P: both old copies (the base's source) and canon.mjs, one answer per value ----------
const HERE = path.dirname(fileURLToPath(import.meta.url));
// (HK1, 0.3.3) the base's files are saved copies (mcp/fixtures/hk1/dd2c, the commit 128285e's bytes), not git reads
// the old copy: its one line `const canon = ...;` read from the base's file, run as it was
const oldCanon = (file) => {
  try {
    const src = fs.readFileSync(path.join(HERE, 'fixtures', 'hk1', 'dd2c', file), 'utf8').replace(/\r\n/g, '\n');
    const line = src.split('\n').filter((l) => l.startsWith('const canon = '));
    if (line.length !== 1) throw new Error(`${file}: ${line.length} lines "const canon = " in the base's source, 1 wanted`);
    return { file, f: new Function('"use strict";\n' + line[0] + '\nreturn canon;')() };
  } catch (e) { return { file, f: () => { throw e; } }; }
};
const OLD = [oldCanon('mcp/lib/artifact.mjs'), oldCanon('mcp/lib/plans.mjs')];
const answer = (run) => { try { return String(run()); } catch (e) { return 'throws ' + String(e.message).slice(0, 120); } };
const parity = (id, label, places) => {
  const got = places.map(([who, run]) => [who, answer(run)]);
  chk(() => new Set(got.map((g) => g[1])).size === 1, () => `${id} ${label}: not one answer: ${got.map(([w, a]) => w + ' ' + a.slice(0, 60)).join('; ')}`);
};
VALUES.forEach(([id, label, v], i) => parity('P' + (i + 1), `(${id}) ${label}`, OLD.map((o) => [o.file + ' (base)', () => o.f(v)]).concat([['canon.mjs', () => canon(v)]])));
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const BIND = [
  ['Q1', 'B1', (c) => sha(c({ digest: Z, pin: { slots: [{ kind: 'card', field: 'Sales[Amount]' }], theme: 'dark', x: undefined }, modelPrint: 'print-1' }))],
  ['Q2', 'B2', (c) => sha(c({ digest: 'ab'.repeat(32), pin: { pages: 2, lang: 'ar', title: 'المبيعات' }, modelPrint: sha(c(SALES.tmsl)) }))],
  ['Q3', 'M1', (c) => sha(c(M1.tmsl))],
];
for (const [id, b, f] of BIND) { const want = DIGESTS.find((d) => d[0] === b)[2]; parity(id, `${b} taken with each copy`, OLD.map((o) => [o.file + ' (base)', () => f(o.f)]).concat([['canon.mjs', () => f(canon)], ['the base', () => want]])); }

// ---------- S: one place ----------
const lib = (f) => fs.readFileSync(path.join(HERE, 'lib', f), 'utf8');
const CALLERS = { 'artifact.mjs': lib('artifact.mjs'), 'plans.mjs': lib('plans.mjs') };
const own = /\.sort\(\)\.filter\(\(key\) => x\[key\] !== undefined\)|\b(?:const|let|var|function)\s+canon\b/;
chk(() => Object.values(CALLERS).every((s) => !own.test(s)), () => `S1 a caller holds a canonical text of its own again: ${Object.entries(CALLERS).filter(([, s]) => own.test(s)).map(([k]) => k)}: import mcp/lib/canon.mjs`);
chk(() => Object.values(CALLERS).every((s) => /^import \{ canon \} from '\.\/canon\.mjs';/m.test(s)), () => `S2 artifact.mjs and plans.mjs must import { canon } from './canon.mjs'`);

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2c  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2c  ${checks} checks`);
