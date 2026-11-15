/*
 * DataArcus SVG KPI Designer: the expression tree and its evaluator (0.3.2 SP12, moved from svg-kpi-compiler.js as
 * it was). Every dynamic part of a KPI picture is one tree of these nodes: svg-kpi-compiler.js prints it as DAX, and
 * evalNode() runs it here for the live preview, so the preview cannot drift from what Power BI draws.
 * The evaluator is closed: it knows the node kinds, the 10 operators and the 6 functions below and nothing else (no
 * eval, no Function, no names looked up on an object it was handed). Text from the model's data is escaped by the
 * esc node with ESCAPES (the same table the DAX's SUBSTITUTE chain uses). Pure JavaScript, no DOM.
 * The designer pages load this file before svg-kpi-compiler.js (browser global SVGKPIExpr); Node requires it.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  // ---------- expression tree ----------
  // Every dynamic part of the SVG is one of these nodes. evalNode() runs it in JS, dax() prints it as DAX.
  const N = {
    num: (n) => ({ k: 'num', n: +(+n).toFixed(6) }),       // rounded so the DAX text and the JS value are the same number
    str: (s) => ({ k: 'str', s: s }),
    ref: (name) => ({ k: 'ref', name: name }),            // a VAR defined earlier
    measure: (name) => ({ k: 'measure', name: name }),
    op: (o, a, b) => ({ k: 'op', o: o, a: a, b: b }),      // + - * / and comparisons
    fn: (f, args) => ({ k: 'fn', f: f, args: args }),      // DIVIDE COALESCE MIN MAX ABS SIGN
    iff: (c, a, b) => ({ k: 'if', c: c, a: a, b: b }),
    sw: (cases, other) => ({ k: 'switch', cases: cases, other: other }), // SWITCH ( TRUE (), c1, v1, ..., other )
    fmt: (a, pattern) => ({ k: 'fmt', a: a, p: pattern }), // FORMAT ( a, pattern, "en-US" )
    // joins text pieces, dropping empty strings and merging neighbouring strings
    cat: (parts) => {
      const p = [];
      parts.forEach((x) => { if (x.k === 'str' && x.s === '') return; const last = p[p.length - 1]; if (x.k === 'str' && last && last.k === 'str') p[p.length - 1] = { k: 'str', s: last.s + x.s }; else p.push(x); });
      return p.length === 1 ? p[0] : p.length ? { k: 'cat', parts: p } : { k: 'str', s: '' };
    },
    blank: () => ({ k: 'blank' }),
    isBlank: (a) => ({ k: 'isblank', a: a }),
    // sparkline pieces: a small table of { Value: periods back, @v: value } and row functions over it
    col: (name) => ({ k: 'col', name: name }),
    spark: (o) => Object.assign({ k: 'spark' }, o),         // FILTER ( ADDCOLUMNS ( GENERATESERIES ... ), NOT ISBLANK )
    sparkEnd: (o) => Object.assign({ k: 'sparkEnd' }, o),   // the last date of the series
    aggx: (f, t, e) => ({ k: 'aggx', f: f, t: t, e: e }),   // MINX MAXX COUNTROWS
    filt: (t, c) => ({ k: 'filt', t: t, c: c }),
    concatx: (t, e, by) => ({ k: 'concatx', t: t, e: e, by: by }),
    // the value of a model column in the current row (SELECTEDVALUE), for an SVG shown per row of a table
    colval: (col) => ({ k: 'colval', col: col }),
    // text that comes from the model's data, made safe for the SVG and the data URL when the measure runs
    esc: (a) => ({ k: 'esc', a: a })
  };
  // what esc replaces, in this order: & first (the others write an &), then the URL characters % and #
  const ESCAPES = Object.freeze([['&', '&amp;'], ['<', '&lt;'], ['>', '&gt;'], ["'", '&apos;'], ['"', '&quot;'], ['%', '%25'], ['#', '%23']].map(Object.freeze));
  // "0.00" (not "0.##") for SVG numbers: Excel-style formatting can print "12." for "0.##", which some SVG attributes reject
  const PATTERNS = { '0.00': [2, 2, false], '#,0': [0, 0, true], '#,0.0': [1, 1, true], '#,0.00': [2, 2, true] };

  // FORMAT with the en-US locale: half away from zero, like .NET
  // Rounds the number as written (69.115 -> 69.12), not its binary value (69.11499...), like .NET and Intl do
  function roundDecimal(abs, d) {
    const [ip, fp = ''] = abs.toFixed(d + 6).split('.');
    let digits = ip + fp.slice(0, d);
    if (fp[d] >= '5') {
      const a = digits.split(''); let i = a.length - 1;
      while (i >= 0) { if (a[i] === '9') { a[i] = '0'; i--; } else { a[i] = String(+a[i] + 1); break; } }
      digits = (i < 0 ? '1' : '') + a.join('');
    }
    return d ? digits.slice(0, digits.length - d) + '.' + digits.slice(digits.length - d) : digits;
  }
  function formatNumber(v, pattern) {
    const [minD, maxD, group] = PATTERNS[pattern];
    let s = roundDecimal(Math.abs(v), maxD);
    const neg = v < 0 && /[1-9]/.test(s);
    if (minD < maxD) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (group) { const parts = s.split('.'); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = parts.join('.'); }
    return (neg ? '-' : '') + s;
  }

  // JS evaluation. BLANK is null and follows DAX: BLANK + BLANK is BLANK, BLANK + 5 is 5,
  // BLANK * 5 and BLANK / 5 are BLANK, and comparisons treat BLANK as 0.
  function evalNode(n, env) {
    const z = (x) => (x == null ? 0 : x);
    switch (n.k) {
      case 'num': return n.n;
      case 'str': return n.s;
      case 'blank': return null;
      case 'ref': return env.vars[n.name];
      case 'measure': return Object.prototype.hasOwnProperty.call(env.measures, n.name) ? env.measures[n.name] : null;
      case 'colval': return env.columns && Object.prototype.hasOwnProperty.call(env.columns, n.col) ? env.columns[n.col] : null;
      case 'esc': { const v = evalNode(n.a, env); return ESCAPES.reduce((s, e) => s.split(e[0]).join(e[1]), v == null ? '' : String(v)); }
      case 'isblank': return evalNode(n.a, env) == null;
      case 'op': {
        const a = evalNode(n.a, env), b = evalNode(n.b, env);
        switch (n.o) {
          case '+': return a == null && b == null ? null : z(a) + z(b);
          case '-': return a == null && b == null ? null : z(a) - z(b);
          case '*': return a == null || b == null ? null : a * b;
          case '/': if (!b) throw new Error('DIV0'); return a == null ? null : a / b;
          case '<': return z(a) < z(b);
          case '<=': return z(a) <= z(b);
          case '>': return z(a) > z(b);
          case '>=': return z(a) >= z(b);
          case '=': return z(a) === z(b);
          case '<>': return z(a) !== z(b);
        }
        throw new Error('op ' + n.o);
      }
      case 'fn': {
        const v = n.args.map((x) => evalNode(x, env));
        switch (n.f) {
          case 'DIVIDE': return (v[0] == null || v[1] == null || v[1] === 0) ? null : v[0] / v[1];
          case 'COALESCE': return v[0] == null ? v[1] : v[0];
          case 'MIN': return Math.min(z(v[0]), z(v[1]));
          case 'MAX': return Math.max(z(v[0]), z(v[1]));
          case 'ABS': return Math.abs(z(v[0]));
          case 'SIGN': return Math.sign(z(v[0]));
        }
        throw new Error('fn ' + n.f);
      }
      case 'if': return evalNode(n.c, env) ? evalNode(n.a, env) : evalNode(n.b, env);
      case 'switch': { for (const [c, v] of n.cases) if (evalNode(c, env)) return evalNode(v, env); return evalNode(n.other, env); }
      case 'fmt': return formatNumber(z(evalNode(n.a, env)), n.p);
      case 'cat': return n.parts.map((p) => { const v = evalNode(p, env); return v == null ? '' : String(v); }).join('');
      case 'col': return env.row[n.name];
      case 'sparkEnd': return null; // dates only matter in DAX; the preview uses the test series directly
      case 'spark': {
        // period i = i periods back from the last one; test series are newest first
        // complete months only: the preview treats the newest test value as a month still running and leaves it out
        const rows = [], series = env.series || {}, skip = n.complete ? 1 : 0;
        for (let i = 0; i < n.n; i++) {
          const m = {}; Object.keys(series).forEach((k) => { const v = series[k][i + skip]; if (v != null && isFinite(v)) m[k] = v; });
          const v = evalNode(n.expr, { measures: m, vars: {} });
          if (v != null) rows.push({ Value: i, '@v': v });
        }
        return rows;
      }
      case 'filt': return evalNode(n.t, env).filter((r) => evalNode(n.c, Object.assign({}, env, { row: r })));
      case 'aggx': {
        const rows = evalNode(n.t, env);
        if (n.f === 'COUNTROWS') return rows.length || null; // COUNTROWS of an empty table is BLANK
        const vals = rows.map((r) => evalNode(n.e, Object.assign({}, env, { row: r }))).filter((v) => v != null);
        if (!vals.length) return null;
        return n.f === 'MINX' ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
      }
      case 'concatx': {
        const rows = evalNode(n.t, env).map((r) => ({ r: r, by: evalNode(n.by, Object.assign({}, env, { row: r })) }));
        rows.sort((a, b) => b.by - a.by);
        const out = rows.map((x) => { const v = evalNode(n.e, Object.assign({}, env, { row: x.r })); return v == null ? '' : String(v); });
        return out.length ? out.join(' ') : null;
      }
    }
    throw new Error('node ' + n.k);
  }

  const api = Object.freeze({ N: Object.freeze(N), ESCAPES: ESCAPES, formatNumber: formatNumber, evalNode: evalNode });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SVGKPIExpr = api;
})(typeof self !== 'undefined' ? self : this);
