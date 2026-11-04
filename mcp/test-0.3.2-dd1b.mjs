// DD1B (0.3.2; the owner, D-1104-12, 4 Nov: "a library of functions where a place calls them so if we need to fix
// something we fix it at the source"; D-1104-18; D-1016-01): one answer to "what does a Power BI literal hold?" (its
// text, its number, its true or false, the value as shown) and to "what width did the report set for this table
// column?". The readers live in assets/js/pbir-values.js only (mcp/docs/CONTRACTS.md, families 1b-text, 1b-number,
// 1b-bool, 1d).
//   U1-U4  the ledger's 15 made-up literals: litText, litNumber, litBool, litShown each pinned (60 checks)
//   U5     the ledger's 12 made-up columnWidth entries: columnWidth pinned (12 checks)
//   U6     never throws, never changes its input (odd shapes: null, an array, a string, a number, a cycle)
//   U7     a bare value (a theme's own true, 12, 'x') is read as the literal's value
// Made-up data only, no IO.   node test-0.3.2-dd1b.mjs
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
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

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd1b  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd1b  ${checks} checks`);
