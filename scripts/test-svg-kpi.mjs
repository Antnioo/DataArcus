// Tests for the SVG KPI Designer compiler.
// Runs the generated DAX through a small DAX evaluator (written separately from the compiler, following
// DAX rules for BLANK, DIVIDE and FORMAT) and checks the result matches the browser preview exactly,
// for every starter design and a set of edge-case values.
// Run: node scripts/test-svg-kpi.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const SVGKPI = require('../assets/js/svg-kpi-compiler.js');
const { TEMPLATES } = require('../assets/js/svg-kpi-templates.js');

// ---------- tiny DAX evaluator (only what the compiler emits) ----------
function tokenize(src) {
  const t = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (src.startsWith('--', i) || src.startsWith('//', i)) { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '"') { let s = ''; i++; for (;;) { if (i >= src.length) throw new Error('unterminated string'); if (src[i] === '"') { if (src[i + 1] === '"') { s += '"'; i += 2; continue; } i++; break; } s += src[i++]; } t.push({ t: 'str', v: s }); continue; }
    if (c === "'") { let s = ''; i++; for (;;) { if (src[i] === "'") { if (src[i + 1] === "'") { s += "'"; i += 2; continue; } i++; break; } s += src[i++]; } t.push({ t: 'tab', v: s }); continue; }
    if (c === '[') { let s = ''; i++; for (;;) { if (src[i] === ']') { if (src[i + 1] === ']') { s += ']'; i += 2; continue; } i++; break; } s += src[i++]; } t.push({ t: 'meas', v: s }); continue; }
    const m2 = src.slice(i, i + 2); if (['<=', '>=', '<>', '&&', '||'].includes(m2)) { t.push({ t: 'op', v: m2 }); i += 2; continue; }
    if ('+-*/&<>=(),'.includes(c)) { t.push({ t: c === '(' || c === ')' || c === ',' ? c : 'op', v: c }); i++; continue; }
    const num = /^\d+(\.\d+)?/.exec(src.slice(i)); if (num) { t.push({ t: 'num', v: +num[0] }); i += num[0].length; continue; }
    const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i)); if (id) { t.push({ t: 'id', v: id[0] }); i += id[0].length; continue; }
    throw new Error('bad char ' + c + ' at ' + i);
  }
  return t;
}
const PREC = { '||': 1, '&&': 2, '=': 3, '<>': 3, '<': 3, '>': 3, '<=': 3, '>=': 3, '&': 4, '+': 5, '-': 5, '*': 6, '/': 6 };
function parse(tokens) {
  let p = 0;
  const peek = () => tokens[p], next = () => tokens[p++];
  const expect = (t) => { const x = next(); if (!x || x.t !== t) throw new Error('expected ' + t + ' got ' + JSON.stringify(x)); return x; };
  function primary() {
    const x = next();
    if (x.t === 'num') return { k: 'num', v: x.v };
    if (x.t === 'str') return { k: 'str', v: x.v };
    if (x.t === 'meas') return { k: 'meas', v: x.v };
    if (x.t === 'tab') { if (peek() && peek().t === 'meas') return { k: 'colref', table: x.v, col: next().v }; return { k: 'tableref', table: x.v }; }
    if (x.t === 'op' && x.v === '-') return { k: 'neg', a: primary() };
    if (x.t === '(') { const e = expr(0); expect(')'); return e; }
    if (x.t === 'id') {
      if (peek() && peek().t === '(') { next(); const args = []; if (peek().t !== ')') { for (;;) { args.push(expr(0)); if (peek().t === ',') { next(); continue; } break; } } expect(')'); return { k: 'call', f: x.v.toUpperCase(), args }; }
      return { k: 'var', v: x.v };
    }
    throw new Error('unexpected ' + JSON.stringify(x));
  }
  function expr(min) {
    let a = primary();
    for (;;) { const o = peek(); if (!o || o.t !== 'op' || PREC[o.v] === undefined || PREC[o.v] <= min) break; next(); a = { k: 'bin', o: o.v, a, b: expr(PREC[o.v]) }; }
    return a;
  }
  // "Name =" header, then VAR ... RETURN expr
  while (!(peek().t === 'op' && peek().v === '=')) next(); next();
  const vars = [];
  while (peek().t === 'id' && peek().v === 'VAR') { next(); const n = expect('id').v; const eq = next(); if (eq.v !== '=') throw new Error('expected ='); vars.push([n, expr(0)]); }
  if (next().v !== 'RETURN') throw new Error('expected RETURN');
  const ret = expr(0);
  if (p !== tokens.length) throw new Error('trailing tokens');
  return { vars, ret };
}
const BLANK = null;
const fmtDax = (v, pat) => {
  const o = { '0.00': [2, 2, false], '#,0': [0, 0, true], '#,0.0': [1, 1, true], '#,0.00': [2, 2, true] }[pat];
  if (!o) throw new Error('pattern ' + pat);
  if (v === BLANK) return '';
  const s = new Intl.NumberFormat('en-US', { minimumFractionDigits: o[0], maximumFractionDigits: o[1], useGrouping: o[2], roundingMode: 'halfExpand' }).format(v);
  return s; // keeps "-0": the compiler must never let a negative zero reach FORMAT
};
// Dates are serial numbers (days since 30 Dec 1899), like DAX.
const serial = (y, m, d) => Date.UTC(y, m - 1, d) / 864e5 + 25569;
const ymd = (sr) => { const dt = new Date((sr - 25569) * 864e5); return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()]; };
const eomonth = (sr, k) => { const [y, m] = ymd(Math.floor(sr)); return Date.UTC(y, m - 1 + k + 1, 0) / 864e5 + 25569; };
// ctx: { end: serial date that MAX('Date'[Date]) returns, series: { measure: [newest ... oldest] } }
function run(prog, measures, ctx) {
  const env = {};
  const num = (x) => (x === BLANK ? 0 : typeof x === 'boolean' ? (x ? 1 : 0) : x);
  let mctx = measures;
  // Which period does a DATESBETWEEN window cover? Must be one whole day, week or calendar month.
  const periodIndex = (a, b) => {
    const end = ctx.end;
    if (a === b) return end - b;
    if (b - a === 6) { const j = (end - b) / 7; if (!Number.isInteger(j)) throw new Error('week window not aligned'); return j; }
    if (b !== eomonth(b, 0) || a !== eomonth(b, -1) + 1) throw new Error('month window is not a whole month: ' + ymd(a) + ' to ' + ymd(b));
    const [ey, em] = ymd(end), [by, bm] = ymd(b); return (ey - by) * 12 + (em - bm);
  };
  const ev = (n, row) => {
    switch (n.k) {
      case 'num': return n.v;
      case 'str': return n.v;
      case 'meas': if (row && n.v in row) return row[n.v]; return n.v in mctx ? mctx[n.v] : BLANK;
      case 'var': if (!(n.v in env)) throw new Error('unknown var ' + n.v); return env[n.v];
      case 'colref': throw new Error('column used as a value');
      case 'neg': { const a = ev(n.a, row); return a === BLANK ? BLANK : -a; }
      case 'bin': {
        const a = ev(n.a, row), b = ev(n.b, row);
        switch (n.o) {
          case '&': return (a === BLANK ? '' : String(a)) + (b === BLANK ? '' : String(b));
          case '+': return a === BLANK && b === BLANK ? BLANK : num(a) + num(b);
          case '-': return a === BLANK && b === BLANK ? BLANK : num(a) - num(b);
          case '*': return a === BLANK || b === BLANK ? BLANK : a * b;
          case '/': if (b === BLANK || b === 0) throw new Error('division by zero'); return a === BLANK ? BLANK : a / b;
          case '<': return num(a) < num(b); case '<=': return num(a) <= num(b);
          case '>': return num(a) > num(b); case '>=': return num(a) >= num(b);
          case '=': return num(a) === num(b); case '<>': return num(a) !== num(b);
        }
        throw new Error('op ' + n.o);
      }
      case 'call': {
        const f = n.f, A = n.args;
        if (f === 'IF') return ev(A[0], row) ? ev(A[1], row) : (A[2] ? ev(A[2], row) : BLANK);
        if (f === 'SWITCH') { const key = ev(A[0], row); for (let i = 1; i + 1 < A.length; i += 2) if (ev(A[i], row) === key) return ev(A[i + 1], row); return A.length % 2 === 0 ? ev(A[A.length - 1], row) : BLANK; }
        if (f === 'MAX' && A.length === 1) { if (A[0].k !== 'colref') throw new Error('MAX of one argument needs a column'); return ctx.end; }
        if (f === 'GENERATESERIES') { const a = ev(A[0], row), b = ev(A[1], row), out = []; for (let i = a; i <= b; i++) out.push({ Value: i }); return out; }
        if (f === 'ADDCOLUMNS') return ev(A[0], row).map((r) => Object.assign({}, r, { [ev(A[1], row)]: ev(A[2], r) }));
        if (f === 'FILTER') return ev(A[0], row).filter((r) => ev(A[1], r));
        if (f === 'COUNTROWS') { const t = ev(A[0], row); return t.length ? t.length : BLANK; }
        if (f === 'MINX' || f === 'MAXX') { const vals = ev(A[0], row).map((r) => ev(A[1], r)).filter((v) => v !== BLANK); return vals.length ? (f === 'MINX' ? Math.min(...vals) : Math.max(...vals)) : BLANK; }
        if (f === 'CONCATENATEX') {
          if (!(A[4] && A[4].k === 'var' && A[4].v === 'DESC')) throw new Error('CONCATENATEX order');
          const rows = ev(A[0], row).map((r) => ({ r, by: ev(A[3], r) })).sort((x, y) => y.by - x.by);
          return rows.length ? rows.map((x) => { const v = ev(A[1], x.r); return v === BLANK ? '' : String(v); }).join(ev(A[2], row)) : BLANK;
        }
        if (f === 'CALCULATE') {
          let win = null, lnb = false;
          for (const fa of A.slice(1)) {
            if (fa.k !== 'call') throw new Error('CALCULATE filter');
            if (fa.f === 'REMOVEFILTERS') continue;
            if (fa.f === 'LASTNONBLANK') { if (fa.args[0].k !== 'colref') throw new Error('LASTNONBLANK column'); lnb = true; continue; }
            if (fa.f === 'DATESBETWEEN') { if (fa.args[0].k !== 'colref') throw new Error('DATESBETWEEN column'); win = [ev(fa.args[1], row), ev(fa.args[2], row)]; continue; }
            throw new Error('CALCULATE filter ' + fa.f);
          }
          if (lnb) return ctx.end;   // the test data's last date with data is the end date
          if (!win) throw new Error('CALCULATE without a date window');
          const j = periodIndex(win[0], win[1]);
          const saved = mctx; mctx = {};
          Object.keys(ctx.series).forEach((k) => { const v = ctx.series[k][j]; if (v != null) mctx[k] = v; });
          try { return ev(A[0], null); } finally { mctx = saved; }
        }
        if (f === 'NOT') return !ev(A[0], row);
        const v = A.map((a) => ev(a, row));
        switch (f) {
          case 'TRUE': return true;
          case 'BLANK': return BLANK;
          case 'ISBLANK': return v[0] === BLANK;
          case 'DIVIDE': return v[0] === BLANK || v[1] === BLANK || v[1] === 0 ? BLANK : v[0] / v[1];
          case 'COALESCE': return v.find((x) => x !== BLANK) ?? BLANK;
          case 'MIN': return Math.min(num(v[0]), num(v[1]));
          case 'MAX': return Math.max(num(v[0]), num(v[1]));
          case 'ABS': return v[0] === BLANK ? BLANK : Math.abs(v[0]);
          case 'SIGN': return v[0] === BLANK ? BLANK : Math.sign(v[0]);
          case 'EOMONTH': return eomonth(v[0], v[1]);
          case 'FORMAT': if (v[2] !== 'en-US') throw new Error('FORMAT without en-US'); return fmtDax(v[0], v[1]);
        }
        throw new Error('function ' + f);
      }
    }
    throw new Error('node ' + n.k);
  };
  for (const [name, e] of prog.vars) env[name] = ev(e, null);
  const r = ev(prog.ret, null);
  return r === BLANK ? '' : r;
}
const NOSERIES = { end: serial(2026, 9, 30), series: {} };

// ---------- test cases ----------
const CASES = [
  ['base', { Sales: 1240000, Target: 1500000, 'Sales LY': 1100000 }],
  ['over target', { Sales: 1800000, Target: 1500000, 'Sales LY': 1100000 }],
  ['exactly target', { Sales: 1500000, Target: 1500000, 'Sales LY': 1500000 }],
  ['below 70%', { Sales: 900000, Target: 1500000, 'Sales LY': 1300000 }],
  ['zero sales', { Sales: 0, Target: 1500000, 'Sales LY': 1100000 }],
  ['blank sales', { Target: 1500000, 'Sales LY': 1100000 }],
  ['blank target', { Sales: 1240000, 'Sales LY': 1100000 }],
  ['zero target', { Sales: 1240000, Target: 0, 'Sales LY': 0 }],
  ['negative', { Sales: -25000, Target: 100000, 'Sales LY': 50000 }],
  ['small', { Sales: 999.5, Target: 1000, 'Sales LY': 999.49 }],
  ['huge', { Sales: 98765432109, Target: 1e11, 'Sales LY': 5e10 }],
  ['fractions', { Sales: 1234.5678, Target: 3333.3333, 'Sales LY': 1111.1111 }]
];

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL ' + msg); } };
for (const t of TEMPLATES) {
  const { dax, errors } = SVGKPI.toDax(t);
  ok(errors.length === 0, t.id + ' compile errors: ' + errors.join('; '));
  let prog; try { prog = parse(tokenize(dax)); } catch (e) { ok(false, t.id + ' DAX does not parse: ' + e.message); console.log(dax); continue; }
  for (const [label, m] of CASES) {
    // 12 months of history ending at this case's values, with a gap
    const hist = (v) => (v == null ? [] : [v, v * 0.9, v * 1.1, null, v * 0.8, v * 1.05, v * 0.95, v * 0.7, v * 1.2, v, v * 0.85, v * 1.15]);
    const series = { Sales: hist(m.Sales), Target: hist(m.Target), 'Sales LY': hist(m['Sales LY']) };
    const js = SVGKPI.toImageUrl(t, m, { series }).url;
    let dx; try { dx = run(prog, m, { end: serial(2026, 9, 30), series }); } catch (e) { ok(false, `${t.id} / ${label}: DAX error ${e.message}`); continue; }
    ok(js === dx, `${t.id} / ${label}: preview and DAX differ\n  JS : ${js}\n  DAX: ${dx}`);
    if (js) {
      const body = js.slice(SVGKPI.PREFIX.length);
      ok(!body.includes('#'), `${t.id} / ${label}: raw # in image URL`);
      let decoded = ''; try { decoded = decodeURIComponent(body); } catch (e) { ok(false, `${t.id} / ${label}: bad % escape`); }
      ok(/^<svg [^>]*>.*<\/svg>$/.test(decoded), `${t.id} / ${label}: not an svg`);
      ok(!/NaN|undefined|Infinity/.test(decoded), `${t.id} / ${label}: NaN/undefined in svg`);
    }
  }
}
// escaping of user text and odd measure names
const tricky = { name: 'Odd "name"', w: 100, h: 20, values: [{ id: 'a', kind: 'measure', measure: 'Net [Adj] %', sample: 5 }],
  layers: [{ type: 'text', x: 0, y: 14, text: `100% "sure" <b> & #1 it's`, fill: '#ffffff' }, { type: 'text', x: 50, y: 14, fill: '#ffffff', bind: { text: { v: 'a', fmt: 'p1', prefix: '#', suffix: ' 50%' } } }] };
{
  const { dax } = SVGKPI.toDax(tricky);
  const prog = parse(tokenize(dax));
  const m = { 'Net [Adj] %': 0.1234 };
  const js = SVGKPI.toImageUrl(tricky, m).url, dx = run(prog, m, NOSERIES);
  ok(js === dx, 'tricky text: preview and DAX differ');
  ok(decodeURIComponent(js.slice(SVGKPI.PREFIX.length)).includes('100% &quot;sure&quot; &lt;b&gt; &amp; #1 it&apos;s'), 'tricky text escaped');
  ok(decodeURIComponent(js.slice(SVGKPI.PREFIX.length)).includes('#12.3% 50%'), 'tricky dynamic text');
}
// a design with nothing bound still compiles to a valid measure
{
  const plain = { name: 'Plain', w: 40, h: 40, bg: '#0a0f1c', radius: 6, layers: [{ type: 'circle', cx: 20, cy: 20, r: 10, fill: '#00d4ff' }] };
  const { dax } = SVGKPI.toDax(plain);
  ok(run(parse(tokenize(dax)), {}, NOSERIES) === SVGKPI.toImageUrl(plain, {}).url, 'static design: preview and DAX differ');
  const body = SVGKPI.toImageUrl(plain, {}).url.slice(SVGKPI.PREFIX.length);
  let decodes = true; try { decodeURIComponent(body); } catch (e) { decodes = false; }
  ok(decodes && !body.includes('#'), 'static design: background breaks the image URL');
}
// sparklines: months, weeks, days; measures and formulas; gaps, flat lines, all blank
{
  const values = [
    { id: 'sales', label: 'Sales', kind: 'measure', measure: 'Sales' }, { id: 'target', label: 'Target', kind: 'measure', measure: 'Target' },
    { id: 'ach', label: 'Ach', kind: 'ratio', a: 'sales', b: 'target' }, { id: 'gap', label: 'Gap', kind: 'diff', a: 'target', b: 'sales' }];
  const SERIES = {
    wave: { Sales: [120, 90, 130, 110, 95, 140, 100, 80, 115, 125, 105, 98, 101, 99], Target: [100, 100, 100, 110, 110, 110, 120, 120, 120, 90, 90, 90, 95, 95] },
    gaps: { Sales: [null, 90, null, 110, 95, null, 100, 80, 115, null, 105, 98], Target: [100, 0, 100, null, 110, 110, 120, 120, 0, 90, 90, 90] },
    flat: { Sales: Array(14).fill(50), Target: Array(14).fill(50) },
    one: { Sales: [42], Target: [40] },
    none: { Sales: [], Target: [] },
    negative: { Sales: [-5, 3, -2.5, 8, 0, -1, 4, 2, -3, 6, 1, 0], Target: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }
  };
  let n = 0;
  for (const grain of ['month', 'week', 'day']) for (const endMode of ['data', 'filter']) for (const v of ['sales', 'ach', 'gap']) for (const opts of [{ area: true, dot: true }, { area: false, dot: false }]) {
    const d = { name: 'Spark', w: 160, h: 40, values, dateCol: "Calendar[Day]", clearDateFilters: n % 2 === 0,
      layers: [Object.assign({ type: 'spark', name: 'Trend', x: 4, y: 4, w: 152, h: 32, n: grain === 'day' ? 14 : 12, grain, end: endMode, stroke: '#00d4ff', sw: 2, areaColor: '#00d4ff', areaOpacity: 0.2, dotR: 3, dotColor: '#ffffff', bind: { series: { v }, stroke: { rules: [{ v: 'ach', op: '<', t: 1, c: '#ef4444' }], other: '#22c55e' } } }, opts)] };
    const { dax, errors } = SVGKPI.toDax(d);
    ok(!errors.length, 'spark errors: ' + errors.join('; '));
    let prog; try { prog = parse(tokenize(dax)); } catch (e) { ok(false, 'spark DAX does not parse: ' + e.message); console.log(dax); break; }
    for (const [label, series] of Object.entries(SERIES)) {
      const m = { Sales: series.Sales[0] ?? undefined, Target: series.Target[0] ?? undefined };
      Object.keys(m).forEach((k) => m[k] == null && delete m[k]);
      const js = SVGKPI.toImageUrl(d, m, { series }).url; let dx;
      try { dx = run(prog, m, { end: grain === 'month' ? serial(2026, 9, 30) : serial(2026, 9, 17), series }); } catch (e) { dx = 'ERROR ' + e.message; }
      ok(js === dx, `spark ${grain}/${endMode}/${v}/${label}: preview and DAX differ\n  JS : ${js}\n  DAX: ${dx}`);
      ok(!/NaN|undefined|Infinity/.test(js), `spark ${grain}/${v}/${label}: NaN in svg`);
      n++;
    }
  }
  // the month windows really are calendar months, including February and a leap year
  const d = { values, dateCol: "'Date'[Date]", layers: [{ type: 'spark', x: 0, y: 0, w: 100, h: 20, n: 14, grain: 'month', bind: { series: { v: 'sales' } } }] };
  const prog = parse(tokenize(SVGKPI.toDax(d).dax));
  const series = { Sales: Array.from({ length: 14 }, (_, i) => i + 1) };
  ok(run(prog, {}, { end: serial(2028, 3, 15), series }) === SVGKPI.toImageUrl(d, {}, { series }).url, 'spark month windows across Feb 2028 (leap year)');
}
// random designs: every layer type and every kind of data link, in any combination the editor allows
{
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const n = (lo, hi) => Math.round((lo + rnd() * (hi - lo)) * 10) / 10;
  const hex = () => '#' + Math.floor(rnd() * 0xffffff).toString(16).padStart(6, '0');
  const ids = ['sales', 'target', 'ly', 'ach', 'growth', 'gap'];
  const values = [
    { id: 'sales', label: 'Sales', kind: 'measure', measure: 'Sales' }, { id: 'target', label: 'Target', kind: 'measure', measure: 'Target' },
    { id: 'ly', label: 'Sales LY', kind: 'measure', measure: 'Sales LY' }, { id: 'ach', label: 'Ach', kind: 'ratio', a: 'sales', b: 'target' },
    { id: 'growth', label: 'Growth', kind: 'pct', a: 'sales', b: 'ly' }, { id: 'gap', label: 'Gap', kind: 'diff', a: 'target', b: 'sales' }];
  const scale = () => ({ v: pick(ids), d0: pick([0, 0, -1, 0.5]), d1: pick([1, 2, 1000000, 1500000]), r0: pick([0, 0, 5]), r1: n(10, 200) });
  const rules = () => ({ rules: Array.from({ length: Math.floor(rnd() * 3) }, () => ({ v: pick(ids), op: pick(SVGKPI.OPS), t: pick([0, 0.7, 0.9, 1, -0.05, 1000000]), c: hex() })), other: hex() });
  const show = () => ({ v: pick(ids), op: pick(SVGKPI.OPS), t: pick([0, 1, 0.9]) });
  const layer = () => {
    const t = pick(['rect', 'circle', 'line', 'text', 'ring', 'arrow', 'spark']), b = {};
    const l = { type: t, name: 'L', opacity: pick([1, 1, 0.5]) };
    if (t === 'rect') Object.assign(l, { x: n(0, 100), y: n(0, 40), w: n(1, 100), h: n(1, 40), rx: pick([0, 4]), fill: hex(), stroke: pick(['none', hex()]), sw: pick([0, 1, 2]) });
    if (t === 'circle') Object.assign(l, { cx: n(0, 100), cy: n(0, 40), r: n(1, 30), fill: hex() });
    if (t === 'line') Object.assign(l, { x1: n(0, 100), y1: n(0, 40), x2: n(0, 100), y2: n(0, 40), stroke: hex(), sw: n(1, 4), cap: pick(['butt', 'round']) });
    if (t === 'text') Object.assign(l, { x: n(0, 100), y: n(10, 40), size: n(8, 30), weight: pick([400, 700]), anchor: pick(['start', 'middle', 'end']), fill: hex(), text: pick(['Hi', '50% & up', "<it's>"]) });
    if (t === 'ring') Object.assign(l, { cx: 50, cy: 50, r: n(5, 40), sw: n(2, 12), track: hex(), fill: hex(), cap: pick(['butt', 'round']), p: n(0, 1) });
    if (t === 'arrow') Object.assign(l, { x: n(0, 80), y: n(0, 30), size: n(4, 30), goodWhen: pick(['up', 'down']), good: hex(), bad: hex(), neutral: hex() });
    if (t === 'spark') Object.assign(l, { x: n(-5, 50), y: n(-5, 30), w: n(10, 150), h: n(5, 40), n: pick([2, 6, 12, 24]), grain: pick(['month', 'week', 'day']), end: pick(['data', 'filter']), stroke: hex(), sw: n(1, 3), area: rnd() < 0.5, areaColor: hex(), areaOpacity: n(0, 1), dot: rnd() < 0.5, dotR: n(1, 5), dotColor: hex() });
    const numeric = { rect: ['x', 'y', 'w', 'h', 'opacity'], circle: ['cx', 'cy', 'r', 'opacity'], line: ['x1', 'y1', 'x2', 'y2'], text: ['x', 'opacity'], ring: [], arrow: [], spark: [] }[t];
    if (t === 'spark') b.series = { v: pick(ids) };
    numeric.forEach((k) => { if (rnd() < 0.3) b[k] = scale(); });
    if (t === 'ring' && rnd() < 0.8) b.p = { v: pick(ids), d0: 0, d1: pick([1, 2]) };
    if (t === 'arrow' && rnd() < 0.8) b.dir = { v: pick(ids) };
    if (t === 'text' && rnd() < 0.7) b.text = { v: pick(ids), fmt: pick(SVGKPI.FORMATS), sign: rnd() < 0.5, prefix: pick(['', 'AED ', '#']), suffix: pick(['', ' %', ' of target']) };
    if (['rect', 'circle', 'text', 'ring'].includes(t) && rnd() < 0.5) b.fill = rules();
    if (['rect', 'line', 'spark'].includes(t) && rnd() < 0.3) b.stroke = rules();
    if (rnd() < 0.25) b.show = show();
    if (Object.keys(b).length) l.bind = b;
    return l;
  };
  const cases = [{ Sales: 1240000, Target: 1500000, 'Sales LY': 1100000 }, { Sales: 0, Target: 0, 'Sales LY': 0 }, { Target: 5 }, { Sales: -3.5, Target: 7.25, 'Sales LY': -1 }, { Sales: 123456789.987, Target: 1, 'Sales LY': 2 }];
  let bad = 0;
  for (let i = 0; i < 300; i++) {
    const d = { name: 'Fuzz ' + i, w: 200, h: 80, bg: rnd() < 0.3 ? hex() : undefined, radius: 8, values, hideIfBlank: rnd() < 0.3 ? 'sales' : undefined, layers: Array.from({ length: 1 + Math.floor(rnd() * 6) }, layer) };
    const { dax, errors } = SVGKPI.toDax(d);
    if (errors.length) { bad++; ok(false, 'fuzz ' + i + ' errors: ' + errors.join('; ')); continue; }
    let prog; try { prog = parse(tokenize(dax)); } catch (e) { bad++; ok(false, 'fuzz ' + i + ' DAX does not parse: ' + e.message); continue; }
    for (const m of cases) {
      const series = { Sales: [m.Sales, 3, null, -2, 7, 7, 1e6, 0.5, null, 4, 2, 9, 1, 5, 6, 3, 2, 8, 1, 0, 2, 3, 4, 5], Target: [m.Target, 1, 2, 0, 5, null, 3, 3, 3, 1, 2, 2, 4, 4, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], 'Sales LY': [m['Sales LY'], 2, 2, 2] };
      const js = SVGKPI.toImageUrl(d, m, { series }).url; let dx;
      try { dx = run(prog, m, { end: serial(2026, 9, 30), series }); } catch (e) { dx = 'ERROR ' + e.message; }
      if (js !== dx) { bad++; if (bad < 4) console.log('fuzz mismatch', i, JSON.stringify(m), '\n JS:', js, '\n DX:', dx); }
      let decodes = true; try { decodeURIComponent(js.slice(SVGKPI.PREFIX.length)); } catch (e) { decodes = false; }
      if (!decodes || js.slice(SVGKPI.PREFIX.length).includes('#') || /NaN|undefined|Infinity/.test(js)) { bad++; if (bad < 4) console.log('fuzz bad url', i, js); }
    }
  }
  ok(bad === 0, `fuzz: ${bad} problems in 300 random designs x ${cases.length} value sets`);
}
console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
