// DD2T (0.3.2; the owner, D-1104-12, 4 Nov: "a library of functions where a place calls them so if we need to fix
// something we fix it at the source"; D-1104-18; D-1104-15; D-1016-01): one answer to "what text does a text box's
// paragraphs hold?". The runs reader lives in assets/js/text-runs.js only (paragraphTexts; mcp/docs/CONTRACTS.md, family
// text-runs); each caller keeps its own join at the call: " / " and trimmed (a box's lines on one line: layout-check.js,
// report-inventory.mjs), " " (a test for text, the text drawn: report-a11y.js, page-preview.js).
//   U1   the probe's 9 text boxes and 7 more (a number beside text, a paragraph with no textRuns, a run that is not an
//        object, a true and a false value, paragraphs that are not a list, a null value): paragraphTexts pinned
//   U2   each caller's join on the same 16: " / " and trimmed, " "
//   U3   never throws, never changes its input (odd shapes, a frozen input, a cycle)
//   P    every place (the four callers' textOf, run as scripts/contracts-probe.mjs runs them: an engine's inner name or
//        its own definition read from its source) on the same 16 boxes: its answer is paragraphTexts joined as decided
//        for it (" / " and trimmed, or " "); one paragraphTexts answer per input
//   S    no caller reads the runs itself: each textOf is a call of TR.paragraphTexts, its join named there
// Made-up data only.   node test-0.3.2-dd2t.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { answerOf, definitions } from '../scripts/contracts-probe.mjs';

const require = createRequire(import.meta.url);
const TR = require('../assets/js/text-runs.js');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const show = (x) => (x === undefined ? 'undefined' : JSON.stringify(x));
const lineOf = (ps) => TR.paragraphTexts(ps).join(' / ').trim();   // A: layout-check.js, report-inventory.mjs
const textOf = (ps) => TR.paragraphTexts(ps).join(' ');             // B: report-a11y.js, page-preview.js

// ---- the inputs: a text box's paragraphs (the probe's BOXTEXTS first, scripts/contracts-probe.mjs) ----
const BOXES = [
  { label: 'one paragraph, one run', ps: [{ textRuns: [{ value: 'Sales' }] }], want: ['Sales'], a: 'Sales', b: 'Sales' },
  { label: 'one paragraph, two runs', ps: [{ textRuns: [{ value: 'Sales ' }, { value: '2024' }] }], want: ['Sales 2024'], a: 'Sales 2024', b: 'Sales 2024' },
  { label: 'two paragraphs', ps: [{ textRuns: [{ value: 'Top' }] }, { textRuns: [{ value: 'Bottom' }] }], want: ['Top', 'Bottom'], a: 'Top / Bottom', b: 'Top Bottom' },
  { label: 'an Arabic run', ps: [{ textRuns: [{ value: 'المبيعات' }] }], want: ['المبيعات'], a: 'المبيعات', b: 'المبيعات' },
  { label: 'a run with a number value', ps: [{ textRuns: [{ value: 0 }] }], want: ['0'], a: '0', b: '0' },
  { label: 'a run with no value', ps: [{ textRuns: [{}] }], want: [''], a: '', b: '' },
  { label: 'no paragraphs', ps: undefined, want: [], a: '', b: '' },
  { label: 'an empty paragraph between two', ps: [{ textRuns: [{ value: 'A' }] }, { textRuns: [] }, { textRuns: [{ value: 'B' }] }], want: ['A', '', 'B'], a: 'A /  / B', b: 'A  B' },
  { label: 'spaces around', ps: [{ textRuns: [{ value: '  Sales  ' }] }], want: ['  Sales  '], a: 'Sales', b: '  Sales  ' },
  { label: 'a number beside text (12)', ps: [{ textRuns: [{ value: 'Top ' }, { value: 12 }] }], want: ['Top 12'], a: 'Top 12', b: 'Top 12' },
  { label: 'a paragraph with no textRuns', ps: [{}], want: [''], a: '', b: '' },
  { label: 'a paragraph and a run that are not objects', ps: [null, { textRuns: [null, 'x', { value: 'A' }] }], want: ['A'], a: 'A', b: 'A' },
  { label: 'a run with the value true', ps: [{ textRuns: [{ value: true }] }], want: ['true'], a: 'true', b: 'true' },
  { label: 'a run with the value false', ps: [{ textRuns: [{ value: false }] }], want: ['false'], a: 'false', b: 'false' },
  { label: 'paragraphs that are not a list', ps: { textRuns: [{ value: 'A' }] }, want: [], a: '', b: '' },
  { label: 'a run with a null value', ps: [{ textRuns: [{ value: null }, { value: 'B' }] }], want: ['B'], a: 'B', b: 'B' },
];

// ---- U1-U2 ----
for (const x of BOXES) {
  chk(() => JSON.stringify(TR.paragraphTexts(x.ps)) === JSON.stringify(x.want), () => `U1 paragraphTexts(${x.label}) = ${show(TR.paragraphTexts(x.ps))}, the rule says ${show(x.want)}`);
  chk(() => lineOf(x.ps) === x.a, () => `U2 " / " and trimmed (${x.label}) = ${show(lineOf(x.ps))}, decided ${show(x.a)}`);
  chk(() => textOf(x.ps) === x.b, () => `U2 " " (${x.label}) = ${show(textOf(x.ps))}, decided ${show(x.b)}`);
}

// ---- U3: odd shapes never throw, the input never changes ----
const cyc = [{ textRuns: [] }]; cyc[0].textRuns.push({ value: 'x', back: cyc });
const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
const ODD = [null, undefined, 'x', 5, {}, [], [[]], [{ textRuns: 'x' }], [{ textRuns: { value: 'x' } }], [{ textRuns: [{ value: {} }] }], [{ textRuns: [{ value: NaN }] }], cyc, deepFreeze([{ textRuns: [{ value: 'F' }] }])];
ODD.forEach((ps, k) => {
  const snap = () => { try { return JSON.stringify(ps); } catch (e) { return 'cycle:' + ps[0].textRuns.length; } };
  const before = snap();
  chk(() => Array.isArray(TR.paragraphTexts(ps)) && TR.paragraphTexts(ps).every((t) => typeof t === 'string'), () => `U3 odd shape ${k}: not a list of texts`);
  chk(() => snap() === before, () => `U3 odd shape ${k} was changed`);
});
chk(() => TR.paragraphTexts(cyc)[0] === 'x' && TR.paragraphTexts(ODD[12])[0] === 'F', () => 'U3 a cycle or a frozen input is not read');
chk(() => Object.isFrozen(TR) && Object.keys(TR).join() === 'paragraphTexts', () => 'U3 the module hands out paragraphTexts alone, frozen');

// ---- P: every place gives its decided answer (the probe's loaders; a box as the probe makes it) ----
const TB = (ps) => ({ visual: { visualType: 'textbox', objects: ps === undefined ? {} : { general: [{ properties: { paragraphs: ps } }] } } });
const PLACES = [
  { file: 'assets/js/layout-check.js', fn: 'textOf', how: 'inner', join: 'a', run: async (x, get) => (await get())(x.j) },
  { file: 'mcp/lib/report-inventory.mjs', fn: 'textOf', how: 'source', join: 'a', run: async (x, get) => (await get())(x.j) },
  { file: 'assets/js/report-a11y.js', fn: 'textOf', how: 'inner', join: 'b', run: async (x, get) => (await get())(x.j.visual) },
  { file: 'assets/js/page-preview.js', fn: 'textOf', how: 'inner', join: 'b', run: async (x, get) => (await get())(x.j) },
];
const JOINS = { a: lineOf, b: textOf };
for (const x of BOXES) {
  const input = { label: x.label, j: TB(x.ps) };
  const one = await answerOf({ how: 'export', run: async () => TR.paragraphTexts(x.ps) }, input);
  chk(() => one.key === JSON.stringify(x.want), () => `P paragraphTexts on ${x.label}: ${one.shown}, one answer ${show(x.want)}`);
  for (const p of PLACES) {
    const got = await answerOf(p, input), want = JOINS[p.join](x.ps);
    chk(() => got.key === JSON.stringify(want), () => `P ${p.file} ${p.fn} on ${x.label}: ${got.shown}, decided (${p.join === 'a' ? '" / " and trimmed' : '" "'}) ${show(want)}`);
  }
}

// ---- S: no caller reads the runs itself ----
const src = (f) => fs.readFileSync(path.join(ROOT, ...f.split('/')), 'utf8').replace(/\r\n/g, '\n');
for (const p of PLACES) {
  const defs = definitions(src(p.file), p.fn), sep = p.join === 'a' ? ".join(' / ').trim()" : ".join(' ')";
  chk(() => defs.length === 1 && /\bTR\.paragraphTexts\(/.test(defs[0].text) && defs[0].text.includes(sep) && !/textRuns|\.value\b/.test(defs[0].text), () => `S ${p.file} ${p.fn} reads the runs itself (or not with its join ${sep}): ${defs.map((d) => d.text.slice(0, 160)).join(' / ')}`);
}
chk(() => /text-runs\.js/.test(src('mcp/lib/visual-meaning.mjs')) && /\bTR\b/.test(src('mcp/lib/report-inventory.mjs').split('\n').find((l) => l.startsWith('import {') && l.includes('visual-meaning')) || ''), () => 'S report-inventory.mjs does not take TR from visual-meaning.mjs (sp42 P4: its imports stay three)');

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2t  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2t  ${checks} checks`);
