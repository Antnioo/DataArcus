// DD1B (0.3.2; the owner, D-1104-12, 4 Nov: "a library of functions where a place calls them so if we need to fix
// something we fix it at the source"; D-1104-18; D-1016-01): one answer to "what does a Power BI literal hold?" (its
// text, its number, its true or false, the value as shown) and to "what width did the report set for this table
// column?". The readers live in assets/js/pbir-values.js only (mcp/docs/CONTRACTS.md, families 1b-text, 1b-number,
// 1b-bool, 1d).
//   U1-U4  the ledger's 15 made-up literals: litText, litNumber, litBool, litShown each pinned (60 checks)
//   U5     the ledger's 12 made-up columnWidth entries: columnWidth pinned (12 checks)
//   U6     never throws, never changes its input (odd shapes: null, an array, a string, a number, a cycle)
//   U7     a bare value (a theme's own true, 12, 'x') is read as the literal's value
//   P      every place of the families 1b-text, 1b-shown, 1b-number, 1b-bool and 1d (scripts/contracts-probe.mjs, run as
//          it runs them) gives the rule's answer on every input: one answer per input per question; "shown" (report-a11y
//          backgroundOf's show) is the bool reader's !== false
//   C1-C3  the answers that changed, from what the callers do: report-a11y 60L transparent, redesign 'it''s',
//          dax-functions 120L and an entry with no properties
//   S1-S2  the readers that went are not defined again; every place still named holds no literal parse of its own
// Made-up data only; reads the sources of the places.   node test-0.3.2-dd1b.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { FAMILIES, answerOf, placeName, definitions } from '../scripts/contracts-probe.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const V = require('../assets/js/pbir-values.js');

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const show = (x) => (x === undefined ? 'undefined' : typeof x === 'number' && Number.isNaN(x) ? 'NaN' : JSON.stringify(x));
const same = (a, b) => Object.is(a, b);

// ---- the ledger's 15 literals (scripts/contracts-probe.mjs LITERALS): text, number, bool, shown ----
const L = (v) => ({ expr: { Literal: { Value: v } } });
const LITERALS = [
  { label: 'missing (no property)', p: undefined, want: [null, null, null, null] },
  { label: 'an expr with no Literal', p: { expr: { Measure: { Property: 'x' } } }, want: [null, null, null, null] },
  { label: "'Sales'", p: L("'Sales'"), want: ['Sales', null, null, 'Sales'] },
  { label: "'it''s' (a quote inside)", p: L("'it''s'"), want: ["it's", null, null, "it's"] },
  { label: "'المبيعات' (Arabic)", p: L("'المبيعات'"), want: ['المبيعات', null, null, 'المبيعات'] },
  { label: "'' (empty text)", p: L("''"), want: ['', null, null, ''] },
  { label: "'a (broken: no closing quote)", p: L("'a"), want: [null, null, null, "'a"] },
  { label: '12D', p: L('12D'), want: [null, 12, null, '12'] },
  { label: '12L', p: L('12L'), want: [null, 12, null, '12'] },
  { label: '-3.5D', p: L('-3.5D'), want: [null, -3.5, null, '-3.5'] },
  { label: 'true', p: L('true'), want: [null, null, true, 'true'] },
  { label: 'false', p: L('false'), want: [null, null, false, 'false'] },
  { label: 'null', p: L('null'), want: [null, null, null, 'null'] },
  { label: '12 (a number, not text)', p: L(12), want: [null, 12, null, '12'] },
  { label: "'12D' (a number in quotes)", p: L("'12D'"), want: ['12D', null, null, '12D'] },
];
const QUESTIONS = ['litText', 'litNumber', 'litBool', 'litShown'];
QUESTIONS.forEach((fn, i) => LITERALS.forEach((x) => {
  chk(() => same(V[fn](x.p), x.want[i]), () => `U${i + 1} ${fn}(${x.label}) = ${show(V[fn](x.p))}, the rule says ${show(x.want[i])}`);
}));

// ---- the ledger's 12 columnWidth entries (scripts/contracts-probe.mjs WIDTHS), asked for T.a ----
const W = (v, ref = 'T.a', more) => Object.assign({ properties: { value: L(v) }, selector: { metadata: ref } }, more || {});
const WIDTHS = [
  { label: '120D', cw: [W('120D')], want: 120 }, { label: '120L', cw: [W('120L')], want: 120 },
  { label: '120 (no suffix)', cw: [W('120')], want: 120 }, { label: '120 (a number, not text)', cw: [W(120)], want: 120 },
  { label: '120.5D', cw: [W('120.5D')], want: 120.5 }, { label: '0D', cw: [W('0D')], want: 0 },
  { label: '-5D', cw: [W('-5D')], want: -5 }, { label: 'abc', cw: [W('abc')], want: null },
  { label: 'no entry for the column', cw: [W('120D', 'T.b')], want: null },
  { label: 'an entry with no properties', cw: [{ selector: { metadata: 'T.a' } }], want: null },
  { label: 'two entries: 80D then 120D', cw: [W('80D'), W('120D')], want: 80 },
  { label: 'an entry with no selector', cw: [{ properties: { value: L('120D') } }], want: null },
];
WIDTHS.forEach((x) => chk(() => same(V.columnWidth(x.cw, 'T.a'), x.want), () => `U5 columnWidth(${x.label}) = ${show(V.columnWidth(x.cw, 'T.a'))}, the rule says ${show(x.want)}`));

// ---- U6: odd shapes never throw, the input never changes ----
const cyc = { expr: { Literal: {} } }; cyc.expr.Literal.Value = cyc;
const ODD = [null, [], [L('12D')], 'x', 0, NaN, Infinity, { expr: null }, { expr: { Literal: null } }, cyc, L(undefined), L({}), L(NaN), L(Infinity), L('1e3D'), L('12DD'), L(' 12D')];
ODD.forEach((p, k) => {
  const before = (() => { try { return JSON.stringify(p); } catch (e) { return 'cycle'; } })();
  chk(() => { QUESTIONS.forEach((fn) => V[fn](p)); return true; }, () => `U6 odd shape ${k} threw`);
  chk(() => (() => { try { return JSON.stringify(p); } catch (e) { return 'cycle'; } })() === before, () => `U6 odd shape ${k} was changed`);
});
chk(() => [null, undefined, 'x', {}, [null, 1, 'a', { selector: null }, { selector: { metadata: 'T.a' }, properties: null }]].every((cw) => V.columnWidth(cw, 'T.a') === null), () => 'U6 columnWidth on odd entries is not null');
chk(() => V.litNumber(L(NaN)) === null && V.litNumber(L(Infinity)) === null && V.litNumber(L('12DD')) === null && V.litNumber(L(' 12D')) === null, () => 'U6 litNumber reads a number that is not one');
chk(() => V.litNumber(L('1e3D')) === 1000 && V.litNumber(L('12M')) === 12 && V.litNumber(L('.5D')) === 0.5, () => 'U6 litNumber misses 1e3D, 12M or .5D');

// ---- U7: a bare value is the literal's value ----
chk(() => V.litBool(true) === true && V.litBool(false) === false && V.litBool('false') === false && V.litBool(undefined) === null, () => 'U7 litBool on a bare value');
chk(() => V.litNumber(12) === 12 && V.litNumber('12D') === 12 && V.litNumber('x') === null, () => 'U7 litNumber on a bare value');
chk(() => V.litText("'x'") === 'x' && V.litText('x') === null && V.litShown(12) === '12', () => 'U7 litText / litShown on a bare value');

// ---- P1-P5: every place of the ledger's families gives the rule's one answer (run as scripts/contracts-probe.mjs runs
// it: its module, an engine's inner name, or its own definition read from its source) ----
const RULES = {
  '1b-text': (x) => V.litText(x.p), '1b-shown': (x) => V.litShown(x.p), '1b-number': (x) => V.litNumber(x.p),
  '1b-bool': (x) => V.litBool(x.p), '1d': (x) => V.columnWidth(x.cw, 'T.a'),
};
for (const [id, rule] of Object.entries(RULES)) {
  const f = FAMILIES.find((x) => x.id === id);
  chk(() => f && f.places.length > 0 && f.inputs.length >= 12, () => `P ${id}: the probe has no such family, or too few places or inputs`);
  if (!f) continue;
  for (const input of f.inputs) {
    const want = await answerOf({ how: 'export', run: async (x) => rule(x) }, input);
    for (const place of f.places) {
      const got = await answerOf(place, input);
      chk(() => got.key === want.key, () => `P ${id} ${placeName(place)} on ${input.label}: ${got.shown}, the rule says ${want.shown}`);
    }
  }
}
// "shown" over the one bool reader (report-a11y show: anything but false is shown, a card that does not say is undefined)
{
  const A11y = require('../assets/js/report-a11y.js');
  const shown = [];
  LITERALS.forEach((x) => { const s = (() => { try { return A11y.backgroundOf({ theme: null }, { type: 'card', json: { visual: { visualContainerObjects: { background: [{ properties: Object.assign({ color: { solid: { color: L("'#112233'") } } }, x.p === undefined ? {} : { show: x.p }) }] } } } }, { json: {} }); } catch (e) { return 'throws'; } })();
    shown.push([x.label, s, x.p === undefined || V.litBool(x.p) !== false ? '#112233' : '#ffffff']); });
  shown.forEach(([label, got, want]) => chk(() => got === want, () => `P shown: report-a11y backgroundOf with show ${label}: ${got}, "shown" (!== false) says ${want}`));
}

// ---- C1-C3: the answers that changed, read from what the callers do ----
{
  // C1 (B-332) report-a11y: a background 60L transparent is more than half transparent (it read 60L as 0: drawn on its own colour)
  const A11y = require('../assets/js/report-a11y.js');
  const bg = (t) => A11y.backgroundOf({ theme: null }, { type: 'card', json: { visual: { visualContainerObjects: { background: [{ properties: { show: L('true'), color: { solid: { color: L("'#112233'") } }, transparency: L(t) } }] } } } }, { json: {} });
  chk(() => bg('60L') === '#ffffff' && bg('60D') === '#ffffff' && bg('12L') === '#112233', () => `C1 report-a11y: 60L ${bg('60L')}, 60D ${bg('60D')}, 12L ${bg('12L')} (60 is more than half transparent: the page's #ffffff)`);
  // C2 redesign danglingOf: a page button to the page 'it''s' goes to the page it's (the doubled quote undone)
  const { danglingOf } = await import('./lib/redesign.mjs');
  const files = { "definition/pages/it's/page.json": '{}', 'definition/pages/pages.json': JSON.stringify({ pageOrder: ["it's"] }),
    "definition/pages/it's/visuals/b/visual.json": JSON.stringify({ name: 'b', visual: { visualType: 'actionButton', visualContainerObjects: { visualLink: [{ properties: { type: L("'PageNavigation'"), navigationSection: L("'it''s'") } }] } } }) };
  const d = danglingOf(files);
  chk(() => Array.isArray(d) && !d.some((x) => /-> page/.test(x)), () => `C2 redesign: a button to 'it''s' is said to dangle: ${JSON.stringify(d)}`);
  // C3 dax-functions fitPictures widthOf (B-332): 120L and an entry with no properties, read from its source by the probe (P 1d)
  const f = FAMILIES.find((x) => x.id === '1d'), place = f && f.places.find((p) => /dax-functions/.test(p.file));
  const of = async (label) => (await answerOf(place, f.inputs.find((x) => x.label === label))).key;
  const a = place ? [await of('120L'), await of('an entry with no properties')] : [];
  chk(() => a[0] === '120' && a[1] === 'null', () => `C3 dax-functions widthOf: 120L ${a[0]}, no properties ${a[1]} (the rule: 120, null)`);
}

// ---- S1-S2: no place keeps its own reader ----
// S1 the readers that went (their calls read pbir-values.js): none is defined again
const GONE = [['mcp/lib/twin-visuals.mjs', 'litStr'], ['mcp/lib/twin-visuals.mjs', 'num'], ['mcp/lib/twin-geometry.mjs', 'litOf'], ['mcp/lib/twin-geometry.mjs', 'lit0'],
  ['mcp/lib/twin-pages.mjs', 'lit'], ['mcp/lib/twin-texts.mjs', 'isOn'], ['mcp/lib/terminology.mjs', 'lit'], ['assets/js/pbip-query.js', 'S0'],
  ['assets/js/report-a11y.js', 'tr'], ['assets/js/visual-replace.js', 'isTrue']];
const src = (f) => fs.readFileSync(path.join(ROOT, ...f.split('/')), 'utf8').replace(/\r\n/g, '\n');
GONE.forEach(([f, n]) => chk(() => definitions(src(f), n).length === 0, () => `S1 ${f} defines ${n} again: its calls read assets/js/pbir-values.js`));
// S2 every place still named is the module's reader (or a call of it): no literal parse of its own
const OWN = /\.Literal\b|parseFloat|\.replace\(|=== 'true'|=== 'false'|\+String\(/;
// (DD1A: mirror-policy.js strOf, the one DD1B kept, is PV.litText now: sp10 P10 admits the pure shared files)
for (const id of Object.keys(RULES)) for (const p of (FAMILIES.find((x) => x.id === id) || { places: [] }).places) {
  const s = src(p.file), defs = definitions(s, p.fn);
  chk(() => defs.length > 0 && defs.every((d) => !OWN.test(d.text)) && /pbir-values\.js|\bPV\b/.test(s), () => `S2 ${placeName(p)} reads a literal itself: ${defs.map((d) => d.text.slice(0, 120)).join(' / ')}`);
}

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd1b  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd1b  ${checks} checks`);
