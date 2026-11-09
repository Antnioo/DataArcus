import './test-env.mjs';
// 0.3.2 SP12 (the split: B-280, B-286; mcp/work/SP12.md). A characterisation suite: the SVG KPI compiler gives, for 18
// made-up designs, exactly what it gave on the base (integration/0.3.2 at a57e094, before the expression tree and its
// evaluator moved to assets/js/svg-expressions.js and the SVG text safety to assets/js/svg-escape.js). Recorded on the
// base in fixtures/sp12-compiler.json: the whole text of every output of the adversarial designs (A*), sha256 and
// length for the starters and the rest. SP12_RECORD=1 records again (only on the base, never to make a run pass).
//   C1-C18  a design's toDax, toMeasure (plain, card, table), toImageUrl (preview tagged, plain, with a column's value)
//           and themed (with a palette) output and errors, as recorded
//   A1      the adversarial outputs: no raw markup, quote, ]]> or script from the inputs reaches the SVG or the DAX
//   M1      (after the move) the compiler uses both files; the evaluator is closed (no eval, no Function, the same
//           operators and functions); the escape file keeps text and attribute escaping apart
//   M2      (after the move) both designer pages load svg-escape and svg-expressions once, before svg-kpi-compiler
//   node test-0.3.2-sp12.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex').slice(0, 24) + ':' + Buffer.byteLength(s, 'utf8');
const GOLD = path.join(HERE, 'fixtures', 'sp12-compiler.json');
const Svg = require('../assets/js/svg-kpi-compiler.js');
const Tpl = require('../assets/js/svg-kpi-templates.js');
const record = process.env.SP12_RECORD === '1';
const moved = fs.existsSync(path.join(REPO, 'assets/js/svg-expressions.js')) && fs.existsSync(path.join(REPO, 'assets/js/svg-escape.js'));

// sample values and series (made up), newest first
const SAMPLES = { Sales: 1240000, Target: 1500000, 'Sales LY': 1100000 };
const SERIES = { Sales: Array.from({ length: 30 }, (_, i) => 1000000 + ((i * 7919) % 400000)), 'Sales LY': Array.from({ length: 30 }, (_, i) => 900000 + ((i * 104729) % 300000)) };
const PALETTE = Svg.themePalette({ text: '#1f2937', card: '#ffffff', accent: '#0f6cbd' }, ['#118dff', '#12239e', '#e66c37']);
const BAD_TEXT = 'He said "hi" & \'bye\' <b>x</b> ]]> <script>alert(1)</script> 100% #1';
const V = () => JSON.parse(JSON.stringify(Tpl.TEMPLATES[0].values));
const txt = (o) => Object.assign({ type: 'text', name: 'Text', x: 10, y: 20, size: 12, weight: 400, anchor: 'start', fill: '#111111' }, o);

// the designs: the 7 starters, then 11 made up (A: adversarial text, escaped; B: the other paths)
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

// one design's outputs: text where it is adversarial, sha and length otherwise (the measures given: the samples, a
// column's value with markup)
function outputs(name, make) {
  const COLS = { "'Cust''s'[Na]]me]": '<script>alert("x")</script> & 50% #1 ]]>', "'Sales'[Amount]": 1234.5 };
  const o = {
    dax: Svg.toDax(make()), measure: Svg.toMeasure(make()), card: Svg.toMeasure(make(), { context: 'card' }), table: Svg.toMeasure(make(), { context: 'table' }),
    tagged: Svg.toImageUrl(make(), SAMPLES, { tag: true, series: SERIES }), plain: Svg.toImageUrl(make(), SAMPLES, { series: SERIES, columns: COLS }),
    blank: Svg.toImageUrl(make(), {}, {})
  };
  const th = Svg.themed(make(), PALETTE); o.themed = { design: th.design, errors: th.errors, url: Svg.toImageUrl(th.design, SAMPLES, { series: SERIES }), dax: Svg.toDax(th.design) };
  const text = JSON.stringify(o);
  return { full: o, rec: name.startsWith('A ') ? JSON.parse(text) : sha(text) };
}

const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
const adversarial = [];
DESIGNS.forEach(([name, make], i) => {
  const id = 'C' + (i + 1);
  let r = null;
  try { r = outputs(name, make); } catch (e) { r = { rec: 'threw: ' + e.message, full: null }; }
  got[id + ' ' + name] = r.rec;
  if (name.startsWith('A ') && r.full) adversarial.push([id, name, r.full]);
  if (!record) chk(() => JSON.stringify(r.rec) === JSON.stringify(gold[id + ' ' + name]), () => `${id} ${name}: the compiler's outputs differ from the base's (${typeof r.rec === 'string' ? r.rec : sha(JSON.stringify(r.rec))}, recorded ${typeof gold[id + ' ' + name] === 'string' ? gold[id + ' ' + name] : sha(JSON.stringify(gold[id + ' ' + name] || null))})`);
});

// A1: in every SVG (the preview, decoded from the data URL) and every DAX string literal, nothing from the inputs is
// raw markup: no <script, no <b>, no <i>, no <a, no ]]>, no onload=' or x=' outside an attribute's quotes
chk(() => {
  const bad = [];
  adversarial.forEach(([id, name, o]) => {
    [o.tagged, o.plain, o.themed.url].forEach((u, k) => {
      const svg = u.url.startsWith(Svg.PREFIX) ? u.url.slice(Svg.PREFIX.length) : u.url;
      if (/<script|<b>|<i>|<a |\]\]>|javascript:alert\(1\)'|onload=|<\/?[a-z]+[^>]*"/i.test(svg)) bad.push(`${id} url ${k}: ${svg.slice(0, 160)}`);
      if (/[%#](?![0-9A-Fa-f]{2})/.test(svg.replace(/%25|%23/g, ''))) bad.push(`${id} url ${k}: a raw % or # in the data URL`);
    });
    [o.dax.dax, o.measure.dax].forEach((d) => { const lits = d.match(/"(?:[^"]|"")*"/g) || []; if (lits.some((l) => /<script|<b>|<i>|<a |\]\]>/i.test(l))) bad.push(`${id} DAX: raw markup in a string`); });
  });
  if (bad.length) throw new Error(bad.join(' | '));
  return adversarial.length === 7;
}, () => `A1 the adversarial outputs are escaped (${adversarial.length} of 7 designs ran)`);

if (moved) {
  const src = (f) => fs.readFileSync(path.join(REPO, 'assets/js', f), 'utf8').replace(/\r\n/g, '\n');
  const comp = src('svg-kpi-compiler.js'), expr = src('svg-expressions.js'), esc = src('svg-escape.js');
  const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
  // M1: the compiler takes the tree, the evaluator and the escapes from the new files and keeps none of them itself;
  // the evaluator is closed: no eval, no Function, no import, the base's 10 operators and 6 functions
  chk(() => {
    const c = code(comp), x = code(expr), e = code(esc);
    const ops = [...x.matchAll(/case '([^']+)': return z\(a\)|case '([+\-*/])':/g)].map((m) => m[1] || m[2]);
    const fns = [...x.matchAll(/case '([A-Z]+)': return/g)].map((m) => m[1]);
    return /require\('\.\/svg-expressions\.js'\)/.test(c) && /require\('\.\/svg-escape\.js'\)/.test(c) && /root\.SVGKPIExpr/.test(c) && /root\.SVGKPIEscape/.test(c) &&
      !/function evalNode|function formatNumber|const xmlEsc|const urlEsc|const ESCAPES =/.test(c) &&
      /function evalNode/.test(x) && !/\beval\s*\(|\bFunction\s*\(|new Function|import\s*\(|require\(/.test(x) && !/\beval\s*\(|\bFunction\s*\(|require\(/.test(e) &&
      JSON.stringify(ops.sort()) === JSON.stringify(['*', '+', '-', '/', '<', '<=', '<>', '=', '>', '>='].sort()) &&
      JSON.stringify(fns.sort()) === JSON.stringify(['ABS', 'COALESCE', 'DIVIDE', 'MAX', 'MIN', 'SIGN']) &&
      /const xmlEsc/.test(e) && /const urlEsc/.test(e) && /const color/.test(e) && /const attrNum/.test(e) && !/evalNode|ESCAPES/.test(e);
  }, () => 'M1 the compiler must take the tree and evaluator from svg-expressions.js and the escapes from svg-escape.js; the evaluator closed (no eval, no Function, the same 10 operators and 6 functions)');
  // M2: both designer pages load svg-escape and svg-expressions once each, before the compiler
  chk(() => ['tools/svg-kpi-designer.html', 'ar/tools/svg-kpi-designer.html'].every((p) => {
    const h = fs.readFileSync(path.join(REPO, p), 'utf8'), at = (s) => h.indexOf(s + '.min.js?v='), n = (s) => h.split(s + '.min.js?v=').length - 1;
    return n('svg-escape') === 1 && n('svg-expressions') === 1 && n('svg-kpi-compiler') === 1 && at('svg-escape') < at('svg-kpi-compiler') && at('svg-expressions') < at('svg-kpi-compiler') && at('svg-escape') > 0;
  }), () => 'M2 the designer pages (EN, AR) must load svg-escape.min.js and svg-expressions.min.js once each, before svg-kpi-compiler.min.js');
}

if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); checks += DESIGNS.length; }
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp12.mjs cause=${problems.length} of ${checks} checks`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp12  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp12  ${checks} checks`);
