import './test-env.mjs';
// 0.3.2 SP16 (the split: B-280, B-286; mcp/work/SP16.md). A characterisation suite: the DAX text the SVG KPI compiler's
// code generation, dax(n), writes is exactly what it wrote on the base (integration/0.3.2 at c7228dc1, before dax and
// its helpers moved to assets/js/svg-codegen.js). Recorded on the base in fixtures/sp16-codegen.json (on the base dax()
// is not exported: the compiler's own source runs in a vm with one line added that hands it out; once svg-codegen.js
// exists the suite reads SVGKPICodegen.dax). SP16_RECORD=1 records again (only on the base, never to make a run pass).
//   D1-D18  every VAR's and the SVG's DAX text for sp12's 18 designs (the 7 starters and 11 made up), as recorded
//   D19-D28 10 more made-up expression trees (nested IF and SWITCH, division by zero, DIVIDE by zero, a column with
//           spaces and brackets, Arabic text, scientific notation, negative and tiny numbers, BLANK arithmetic, every
//           escape with a measure name holding ] and quotes), as recorded
//   E1      the preview evaluator's value and the value of the DAX text (read by the small DAX reader below,
//           independent of both) agree wherever both run (scalar DAX: sparkline tables are left out); the base's
//           disagreements are recorded and said, never fixed here
//   M1      (after the move) svg-codegen.js holds dax and is closed: no eval, no Function, no import, one require
//           (svg-expressions.js), no parser of its own; the compiler keeps no DAX printer
//   M2      (after the move) both designer pages load svg-codegen once, after svg-escape and svg-expressions and
//           before svg-kpi-compiler
//   M3      (after the move) the compiler's toDax VAR lines are SVGKPICodegen.dax of compile()'s nodes
//   node test-0.3.2-sp16.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), JS = path.join(REPO, 'assets/js');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex').slice(0, 24) + ':' + Buffer.byteLength(s, 'utf8');
const GOLD = path.join(HERE, 'fixtures', 'sp16-codegen.json');
const record = process.env.SP16_RECORD === '1';
const moved = fs.existsSync(path.join(JS, 'svg-codegen.js'));
const Svg = require('../assets/js/svg-kpi-compiler.js');
const Tpl = require('../assets/js/svg-kpi-templates.js');
const X = require('../assets/js/svg-expressions.js'), N = X.N;

// dax(n): the moved file's, or (on the base) the compiler's own, handed out by one added line
const dax = moved ? require('../assets/js/svg-codegen.js').dax : (() => {
  const src = fs.readFileSync(path.join(JS, 'svg-kpi-compiler.js'), 'utf8');
  if (src.split('const api = {').length !== 2) throw new Error('the compiler\'s api line is not where the base had it');
  const m = { exports: {} }, req = createRequire(path.join(JS, 'svg-kpi-compiler.js'));
  vm.runInThisContext('(function (module, exports, require) {' + src.replace('const api = {', 'const api = { __dax: dax,') + '\n})', { filename: 'svg-kpi-compiler.js (base, dax handed out)' })(m, m.exports, req);
  return m.exports.__dax;
})();

// ---------- the cases ----------
// sp12's 18 designs (the same made-up designs, built the same way), then 10 expression trees
const SAMPLES = { Sales: 1240000, Target: 1500000, 'Sales LY': 1100000 };
const COLS = { "'Cust''s'[Na]]me]": '<script>alert("x")</script> & 50% #1 ]]>', "'Sales'[Amount]": 1234.5 };
const BAD_TEXT = 'He said "hi" & \'bye\' <b>x</b> ]]> <script>alert(1)</script> 100% #1';
const V = () => JSON.parse(JSON.stringify(Tpl.TEMPLATES[0].values));
const txt = (o) => Object.assign({ type: 'text', name: 'Text', x: 10, y: 20, size: 12, weight: 400, anchor: 'start', fill: '#111111' }, o);
const DESIGNS = Tpl.TEMPLATES.map((t) => ['starter ' + t.id, () => JSON.parse(JSON.stringify(t))]).concat([
  ['A quotes, markup, ]]>, a script tag', () => ({ name: 'KPI "x" <y>', w: 300, h: 60, values: V(), layers: [txt({ text: BAD_TEXT }),
    txt({ y: 40, bind: { text: { v: 'sales', fmt: 'n0', prefix: '<i>"AED"</i> & ', suffix: ' ]]><script>x()</script>' } } })] })],
  ['A javascript: in a text and a colour', () => ({ name: 'javascript:alert(1)', w: 200, h: 50, values: V(), layers: [
    txt({ text: "<a href='javascript:alert(1)'>click</a>", fill: "#000000' onload='alert(1)" }),
    { type: 'rect', name: 'r', x: 0, y: 0, w: 10, h: 10, fill: 'javascript:alert(1)', stroke: '"><script>', sw: 1, bind: { fill: { rules: [{ v: 'ach', op: '<', t: 1, c: "red' x='" }], other: '#ABCDEF' } } }] })],
  ['A Arabic label with RTL marks, mirrored', () => ({ name: '‏مبيعات «رمضان»‎', w: 240, h: 80, mirror: true, values: [{ id: 'sales', label: '‏المبيعات', kind: 'measure', measure: 'المبيعات', sample: 5 }, { id: 'target', label: 'الهدف', kind: 'measure', measure: 'الهدف' }, { id: 'ach', label: 'الإنجاز', kind: 'ratio', a: 'sales', b: 'target' }],
    layers: [txt({ text: '‏المبيعات ‫من‬ الهدف‎ <&>', anchor: 'end', x: 230 }), txt({ y: 50, bind: { text: { v: 'ach', fmt: 'p1', prefix: '‏«', suffix: '»‎' } } }),
      { type: 'ring', name: 'حلقة', cx: 40, cy: 40, r: 30, sw: 6, fill: '#00d4ff', bind: { p: { v: 'ach', d0: 0, d1: 1 } } }] })],
  ['A measure names with ] and doubled quotes', () => ({ name: 'Net ]] "Sales"', w: 200, h: 40, values: [{ id: 'a', label: 'Net "x"', kind: 'measure', measure: 'Net ]Sales[ "q"' }, { id: 'b', label: 'B', kind: 'measure', measure: 'Tgt""' }, { id: 'c', label: 'C', kind: 'diff', a: 'a', b: 'b' }],
    layers: [txt({ bind: { text: { v: 'c', fmt: 'n2', prefix: 'say ""hi"" ', sign: true } } })] })],
  ['A very long numbers', () => ({ name: 'Big', w: 1e21, h: -5, values: [{ id: 'x', label: 'X', kind: 'measure', measure: 'X' }, { id: 'y', label: 'Y', kind: 'measure', measure: 'Y' }, { id: 'r', label: 'R', kind: 'ratio', a: 'x', b: 'y' }],
    layers: [txt({ x: 123456789012345680, y: -0.0000001, size: 1e308, bind: { text: { v: 'x', fmt: 'auto' } } }), txt({ bind: { text: { v: 'r', fmt: 'k1' } } }),
      { type: 'rect', name: 'r', x: 1.23456789, y: 9.999999, w: 1e15, h: 3, fill: '#123456', bind: { w: { v: 'r', d0: -1e12, d1: 1e12, r0: -1e9, r1: 1e9 } } },
      { type: 'line', name: 'l', x1: -1e-9, y1: 0, x2: 99999999999.995, y2: 1, stroke: '#ffffff', sw: 0.125 }] })],
  ['A a column value with markup', () => ({ name: 'Per row', w: 200, h: 30, values: [{ id: 'n', label: 'Name', kind: 'column', column: "'Cust''s'[Na]]me]" }, { id: 'v', label: 'Val', kind: 'column', column: 'Sales[Amount]' }],
    layers: [txt({ bind: { text: { v: 'n', fmt: 'text', prefix: '<', suffix: '>' } } }), txt({ x: 100, bind: { text: { v: 'v', fmt: 'n1' } } })] })],
  ['A percent and hash in static text and a theme name', () => ({ name: '100% #1', w: 120, h: 30, bg: 'theme:card', values: V(), layers: [txt({ text: '100% #1 %23 %25 &amp; &#x3c;', fill: 'theme:accent' }), txt({ y: 28, fill: 'theme:nope', text: 'x' })] })],
  ['B errors: control characters, unknown kinds, ops and layers', () => ({ name: 'Bad\tname\n', w: 100, h: 30, values: [{ id: 'm', label: 'M', kind: 'measure', measure: 'Tab\there' }, { id: 'c', label: 'C', kind: 'column', column: 'T[\u0007x]' }, { id: 'q', label: 'Q', kind: 'nope' }, { id: 's', label: 'S', kind: 'measure', measure: 'Sales' }],
    layers: [txt({ bind: { text: { v: 'gone' } } }), { type: 'circle', name: 'c', cx: 5, cy: 5, r: 3, fill: '#000000', bind: { show: { v: 's', op: '!=', t: 1 } } }, { type: 'blob' }, { type: 'spark', name: 'no value' }] })],
  ['B sparkline with area, dot, weeks, mirror, quoted date column', () => ({ name: 'Spark', w: 220, h: 48, mirror: true, dateCol: "'Date''s'[Da]]te]", values: V(), layers: [
    { type: 'spark', name: 'Line', x: 0, y: 4, w: 220, h: 40, n: 8, grain: 'week', stroke: '#00d4ff', sw: 2, area: true, areaOpacity: 0.3, dot: true, dotR: 3, bind: { series: { v: 'growth' } } },
    { type: 'spark', name: 'Month', x: -5, y: -2, w: 100, h: 20, n: 12, grain: 'month', complete: true, end: 'filter', bind: { series: { v: 'sales' } } }] })],
  ['B shapes bound: opacity, show, arrow down-good, ring static', () => ({ name: 'Shapes', w: 160, h: 60, bg: '#0f1e3d', radius: 8, hideIfBlank: 'sales', values: V(), layers: [
    { type: 'rect', name: 'r', x: 0, y: 0, w: 50, h: 20, fill: '#22c55e', stroke: '#000000', sw: 1, opacity: 0.5, bind: { opacity: { v: 'ach', d0: 0, d1: 2, r0: 0.2, r1: 1 }, show: { v: 'ach', op: '>=', t: 0.5 } } },
    { type: 'arrow', name: 'a', x: 60, y: 4, size: 14, goodWhen: 'down', opacity: 0.8, bind: { dir: { v: 'growth' } } }, { type: 'arrow', name: 'b', x: 90, y: 4 },
    { type: 'ring', name: 'g', cx: 130, cy: 30, r: 20, p: 0.42, cap: 'round' }, { type: 'circle', name: 'c', cx: 10, cy: 40, r: 6, fill: 'none' },
    txt({ x: 130, y: 34, size: 10, weight: 700, anchor: 'middle', bind: { text: { v: 'ach', fmt: 'n1' } } })] })],
  ['B empty and default', () => ({})]
]);
const M = (name) => N.measure(name), S = (s) => N.str(s), U = (n) => N.num(n);
const COL_SP = "'My Sales Table'[Unit [Price]] (AED)]";
const EXPRS = [
  ['nested IF', N.iff(N.op('>', M('Sales'), U(1000)), N.iff(N.op('<', M('Target'), U(0)), S('negative'), N.iff(N.op('=', M('Sales'), M('Target')), S('equal'), S('big'))), S('small'))],
  ['nested SWITCH in IF', N.iff(N.isBlank(M('Missing')), N.sw([[N.op('>=', N.fn('DIVIDE', [M('Sales'), M('Target')]), U(1)), S('met')], [N.op('>=', N.fn('DIVIDE', [M('Sales'), M('Target')]), U(0.8)), N.sw([[N.op('<>', M('Sales'), U(0)), S('close')]], S('zero'))]], S('far')), S('known'))],
  ['division by zero', N.op('/', M('Sales'), U(0))],
  ['DIVIDE by zero and by BLANK', N.cat([N.fmt(N.fn('COALESCE', [N.fn('DIVIDE', [M('Sales'), U(0)]), U(-1)]), '#,0'), S('|'), N.fmt(N.fn('COALESCE', [N.fn('DIVIDE', [M('Sales'), M('Missing')]), U(-2)]), '#,0')])],
  ['a column with spaces and brackets', N.cat([S('<text>'), N.esc(N.colval(COL_SP)), S('</text>')])],
  ['Arabic text', N.cat([S('‏المبيعات: '), N.esc(N.colval("'العملاء'[الاسم]")), S(' «هدف»‎ '), N.fmt(M('Sales'), '#,0.0')])],
  ['scientific notation', N.cat([N.fmt(U(2.5e21), '#,0'), S(' '), N.fmt(N.op('*', U(1.5e-7), U(1e9)), '#,0.00'), S(' '), N.fmt(U(6.02e23), '0.00')])],
  ['negative and tiny numbers', N.cat([N.fmt(N.op('+', U(-3.25), U(0.0000004)), '#,0.00'), S(' '), N.fmt(U(-0.004), '#,0.0'), S(' '), N.fmt(N.op('-', U(0), U(1234567.891)), '#,0.00')])],
  ['BLANK arithmetic and the functions', N.cat([
    N.iff(N.isBlank(N.op('+', N.blank(), N.blank())), S('b+b blank'), S('b+b not blank')), S(';'),
    N.iff(N.isBlank(N.op('*', N.blank(), U(5))), S('b*5 blank'), S('b*5 not blank')), S(';'),
    N.fmt(N.op('-', N.blank(), U(5)), '#,0'), S(';'), N.fmt(N.fn('MIN', [M('Sales'), M('Target')]), '#,0'), S(';'),
    N.fmt(N.fn('MAX', [U(-2), U(3)]), '#,0'), S(';'), N.fmt(N.fn('ABS', [U(-7.5)]), '#,0.0'), S(';'), N.fmt(N.fn('SIGN', [U(-7.5)]), '#,0'), S(';'),
    N.iff(N.op('=', N.blank(), U(0)), S('blank is 0'), S('blank is not 0'))])],
  ['every escape and a measure name with ] and quotes', N.cat([N.esc(S('<a href="x">&\'100%\' #1</a>')), S(' '), N.esc(M('Net ]] "q" [x]')), S(' '), N.fmt(M('Net ]] "q" [x]'), '#,0')])]
];
const EXPR_ENV = { measures: Object.assign({}, SAMPLES, { 'Net ]] "q" [x]': 'He & <she> 50%' }), columns: { [COL_SP]: 'Box <7> & "lid"', "'العملاء'[الاسم]": 'شركة «النور» & أولاده' } };
// the measure that holds text above is read by esc; FORMAT of it is left to the reader (DAX would refuse it)

// ---------- a small DAX reader (the test's own, independent of dax() and evalNode): the scalar DAX dax() writes ----------
// Its rules: BLANK + BLANK and BLANK - BLANK are BLANK, BLANK with a number in + and - is 0; BLANK * x and BLANK / x are
// BLANK; x / 0 is +-Infinity (NaN for 0 / 0); comparisons read BLANK as 0 (or "" beside text) and text without case;
// DIVIDE is BLANK on a BLANK or 0 divisor; FORMAT of BLANK is ""; FORMAT rounds half away from zero (Intl, en-US).
// Where I could not confirm DAX's rule here (ABS, SIGN, MIN, MAX of BLANK; a number's text in &; TRUE's text) the reader
// reads BLANK as 0 and writes String(x), as the evaluator does: Desktop would settle those.
function readDax(text, env) {
  const toks = [], re = /\s+|(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|("(?:[^"]|"")*")|('(?:[^']|'')+'\[(?:[^\]]|\]\])+\])|(\[(?:[^\]]|\]\])+\])|([A-Za-z_][A-Za-z0-9_.]*)|(<=|>=|<>|[<>=+\-*/&(),])/y;
  let m, i = 0;
  while (i < text.length) {
    re.lastIndex = i; m = re.exec(text);
    if (!m) throw new Error('reader: cannot read at ' + i + ': ' + text.slice(i, i + 30));
    i = re.lastIndex;
    if (m[1]) toks.push({ t: 'num', v: +m[1] }); else if (m[2]) toks.push({ t: 'str', v: m[2].slice(1, -1).replace(/""/g, '"') });
    else if (m[3]) toks.push({ t: 'colref', v: m[3] }); else if (m[4]) toks.push({ t: 'measure', v: m[4].slice(1, -1).replace(/\]\]/g, ']') });
    else if (m[5]) toks.push({ t: 'id', v: m[5] }); else if (m[6]) toks.push({ t: 'op', v: m[6] });
  }
  let p = 0;
  const peek = () => toks[p], eat = (v) => { const t = toks[p++]; if (!t || (v && t.v !== v)) throw new Error('reader: expected ' + v + ' at token ' + (p - 1)); return t; };
  const z = (x) => (x == null ? 0 : x);
  const txtOf = (x) => (x == null ? '' : String(x));
  const cmp = (o, a, b) => {
    if (typeof a === 'string' || typeof b === 'string') { a = txtOf(a).toLowerCase(); b = txtOf(b).toLowerCase(); } else { a = z(a); b = z(b); }
    return { '<': a < b, '<=': a <= b, '>': a > b, '>=': a >= b, '=': a === b, '<>': a !== b }[o];
  };
  const fmt = (x, pat) => {
    if (x == null) return '';
    const P = { '0.00': [2, false], '#,0': [0, true], '#,0.0': [1, true], '#,0.00': [2, true] }[pat];
    if (!P) throw new Error('reader: pattern ' + pat);
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: P[0], maximumFractionDigits: P[0], useGrouping: P[1], roundingMode: 'halfExpand' }).format(x);
  };
  const call = (f, a) => {
    switch (f) {
      case 'IF': return a[0] ? a[1] : a[2];
      // SWITCH ( TRUE (), c1, v1, ..., else ): the first c equal to the first argument wins
      case 'SWITCH': { for (let k = 1; k + 1 < a.length; k += 2) if (a[k] === a[0]) return a[k + 1]; return a.length % 2 === 0 ? a[a.length - 1] : null; }
      case 'DIVIDE': return a[0] == null || a[1] == null || a[1] === 0 ? null : a[0] / a[1];
      case 'COALESCE': return a.find((x) => x != null) ?? null;
      case 'MIN': return Math.min(z(a[0]), z(a[1]));
      case 'MAX': return Math.max(z(a[0]), z(a[1]));
      case 'ABS': return Math.abs(z(a[0]));
      case 'SIGN': return Math.sign(z(a[0]));
      case 'ISBLANK': return a[0] == null;
      case 'FORMAT': if (a[2] !== 'en-US') throw new Error('reader: FORMAT without en-US'); return fmt(a[0], a[1]);
      case 'SUBSTITUTE': return txtOf(a[0]).split(a[1]).join(a[2]);
      case 'SELECTEDVALUE': return Object.prototype.hasOwnProperty.call(env.columns || {}, a[0]) ? env.columns[a[0]] : null;
      case 'BLANK': return null;
      case 'TRUE': return true;
    }
    throw new Error('reader: function ' + f + ' (not scalar DAX this reader knows)');
  };
  const primary = () => {
    const t = eat();
    if (t.t === 'num') return t.v;
    if (t.t === 'str') return t.v;
    if (t.t === 'measure') return Object.prototype.hasOwnProperty.call(env.measures, t.v) ? env.measures[t.v] : null;
    if (t.t === 'colref') throw new Error('reader: a bare column');
    if (t.v === '-') return -primary();
    if (t.v === '(') { const v = expr(); eat(')'); return v; }
    if (t.t === 'id') {
      if (peek() && peek().v === '(') {
        eat('(');
        if (t.v === 'SELECTEDVALUE') { const c = eat(); eat(')'); return call('SELECTEDVALUE', [c.v]); }
        const args = []; if (peek().v !== ')') { args.push(expr()); while (peek().v === ',') { eat(','); args.push(expr()); } }
        eat(')'); return call(t.v, args);
      }
      if (!Object.prototype.hasOwnProperty.call(env.vars, t.v)) throw new Error('reader: VAR ' + t.v + ' not known');
      return env.vars[t.v];
    }
    throw new Error('reader: unexpected ' + t.v);
  };
  const mul = () => { let a = primary(); while (peek() && (peek().v === '*' || peek().v === '/')) { const o = eat().v, b = primary(); a = o === '*' ? (a == null || b == null ? null : a * b) : (a == null ? null : z(b) === 0 ? (a === 0 ? NaN : a / 0) : a / z(b)); } return a; };
  const add = () => { let a = mul(); while (peek() && (peek().v === '+' || peek().v === '-')) { const o = eat().v, b = mul(); a = a == null && b == null ? null : o === '+' ? z(a) + z(b) : z(a) - z(b); } return a; };
  const amp = () => { let a = add(); while (peek() && peek().v === '&') { eat(); a = txtOf(a) + txtOf(add()); } return a; };
  const expr = () => { let a = amp(); while (peek() && ['<', '<=', '>', '>=', '=', '<>'].includes(peek().v)) { const o = eat().v; a = cmp(o, a, amp()); } return a; };
  const v = expr();
  if (p !== toks.length) throw new Error('reader: text left over at token ' + p);
  return v;
}

// ---------- run ----------
const TABLES = /\b(FILTER|ADDCOLUMNS|GENERATESERIES|CALCULATE|CONCATENATEX|MINX|MAXX|COUNTROWS|DATESBETWEEN|EOMONTH|LASTNONBLANK)\b/;
const same = (a, b) => (typeof a === 'number' && typeof b === 'number' ? (a === b || (Number.isNaN(a) && Number.isNaN(b)) || Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))) : a === b);
const show = (x) => (x === null ? 'BLANK' : typeof x === 'string' ? JSON.stringify(x.length > 80 ? x.slice(0, 80) + '...' : x) : String(x));
const agreement = { agree: 0, left_out: 0, disagree: [] };
// one case: its nodes in order ([name, node]); the last is the result. Returns the DAX texts; counts the agreement
function runCase(id, nodes, env) {
  const texts = [], evVars = {}, rdVars = {};
  nodes.forEach(([name, node]) => {
    let t; try { t = dax(node); } catch (e) { t = 'threw: ' + e.message; }
    texts.push([name, t]);
    let ev, evErr = null, rd, rdErr = null;
    try { ev = X.evalNode(node, { measures: env.measures, columns: env.columns, vars: evVars, series: {} }); } catch (e) { evErr = e.message; }
    if (t.startsWith('threw: ') || TABLES.test(t.replace(/"(?:[^"]|"")*"/g, '""')) || Array.isArray(ev)) { agreement.left_out++; evVars[name] = ev; rdVars[name] = ev; return; }
    try { rd = readDax(t, { measures: env.measures, columns: env.columns, vars: rdVars }); } catch (e) { rdErr = e.message; }
    evVars[name] = ev; rdVars[name] = rd;
    if (evErr == null && rdErr == null && same(ev, rd)) agreement.agree++;
    else agreement.disagree.push(`${id} ${name}: evaluator ${evErr ? 'threw ' + evErr : show(ev)}, DAX ${rdErr ? 'unread (' + rdErr + ')' : show(rd)}`);
  });
  return texts;
}

const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
DESIGNS.forEach(([name, make], i) => {
  const id = 'D' + (i + 1), c = Svg.compile(make());
  const texts = runCase(id, c.vars.map((v) => [v.name, v.node]).concat([['_svg', c.svg]]), { measures: SAMPLES, columns: COLS });
  const rec = name.startsWith('A ') ? texts : sha(JSON.stringify(texts));
  got[id + ' ' + name] = rec;
  if (!record) chk(() => JSON.stringify(rec) === JSON.stringify(gold[id + ' ' + name]), () => `${id} ${name}: the DAX dax() writes differs from the base's (${sha(JSON.stringify(texts))}, recorded ${typeof gold[id + ' ' + name] === 'string' ? gold[id + ' ' + name] : sha(JSON.stringify(gold[id + ' ' + name] || null))})`);
});
EXPRS.forEach(([name, node], i) => {
  const id = 'D' + (DESIGNS.length + i + 1), texts = runCase(id, [['_x', node]], EXPR_ENV);
  got[id + ' ' + name] = texts;
  if (!record) chk(() => JSON.stringify(texts) === JSON.stringify(gold[id + ' ' + name]), () => `${id} ${name}: the DAX dax() writes differs from the base's: ${JSON.stringify(texts).slice(0, 300)}`);
});
got.E1 = agreement;
if (!record) chk(() => JSON.stringify(agreement) === JSON.stringify(gold.E1), () => `E1 the evaluator and the DAX text agree as on the base (now ${agreement.agree} agree, ${agreement.left_out} left out, ${agreement.disagree.length} disagree; recorded ${gold.E1 && gold.E1.agree}, ${gold.E1 && gold.E1.left_out}, ${gold.E1 && gold.E1.disagree.length}): ${agreement.disagree.join(' | ').slice(0, 600)}`);

if (moved) {
  const src = (f) => fs.readFileSync(path.join(JS, f), 'utf8').replace(/\r\n/g, '\n');
  const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
  // M1: the code generation is in svg-codegen.js, closed, reading the one tree; the compiler keeps no printer of its own
  chk(() => {
    const g = code(src('svg-codegen.js')), c = code(src('svg-kpi-compiler.js'));
    const reqs = [...g.matchAll(/require\(([^)]*)\)/g)].map((m) => m[1]);
    return /function dax\(n\)/.test(g) && /const daxStr/.test(g) && /const daxNum/.test(g) && /const daxMeasure/.test(g) && /root\.SVGKPIExpr/.test(g) &&
      JSON.stringify(reqs) === JSON.stringify(["'./svg-expressions.js'"]) && !/\beval\s*\(|\bFunction\s*\(|new Function|import\s*\(/.test(g) &&
      !/function (parse|tokeni[sz]e|lex)|\.exec\(|evalNode|Object\.freeze\(\{ k:/.test(g) && /Object\.freeze\(\{/.test(g) &&
      /require\('\.\/svg-codegen\.js'\)/.test(c) && /root\.SVGKPICodegen/.test(c) && !/function dax\(|const daxStr|const daxNum|const daxMeasure|const hasControl/.test(c);
  }, () => 'M1 svg-codegen.js must hold dax and its helpers, closed (no eval, Function, import; only svg-expressions.js required; no parser), and the compiler none of them');
  // M2: both designer pages load it once, after the tree and the escaping and before the compiler
  chk(() => ['tools/svg-kpi-designer.html', 'ar/tools/svg-kpi-designer.html'].every((p) => {
    const h = fs.readFileSync(path.join(REPO, p), 'utf8'), at = (s) => h.indexOf(s + '.min.js?v='), n = (s) => h.split(s + '.min.js?v=').length - 1;
    return n('svg-codegen') === 1 && at('svg-escape') > 0 && at('svg-expressions') < at('svg-codegen') && at('svg-escape') < at('svg-codegen') && at('svg-codegen') < at('svg-kpi-compiler');
  }), () => 'M2 the designer pages (EN, AR) must load svg-codegen.min.js once, after svg-escape and svg-expressions and before svg-kpi-compiler.min.js');
  // M3: what the compiler writes is the moved printer's text
  chk(() => DESIGNS.every(([, make]) => {
    const c = Svg.compile(make()), lines = Svg.toDax(make()).dax.split('\n').filter((l) => l.startsWith('VAR ') && !l.startsWith('VAR _svg ='));
    return JSON.stringify(lines) === JSON.stringify(c.vars.map((v) => 'VAR ' + v.name + ' = ' + dax(v.node)));
  }), () => 'M3 the compiler\'s toDax VAR lines must be SVGKPICodegen.dax of compile()\'s nodes');
}

if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); checks += DESIGNS.length + EXPRS.length + 1; }
if (agreement.disagree.length) console.log(`  (E1: ${agreement.disagree.length} disagreements, as recorded on the base: ${agreement.disagree.join(' | ').slice(0, 1500)})`);
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp16.mjs cause=${problems.length} of ${checks} checks`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp16  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp16  ${checks} checks`);
