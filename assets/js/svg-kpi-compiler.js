/*
 * DataArcus SVG KPI Designer: compiler.
 * Turns one design (layers + values + bindings) into two outputs from the SAME expression tree:
 *   - a DAX measure that returns an SVG image URL for Power BI (Data category: Image URL)
 *   - the same SVG evaluated in the browser with sample values, for the live preview
 * Because both come from one tree, the preview cannot drift from what Power BI draws.
 * Pure JavaScript, no DOM. Runs in the browser and in Node for tests.
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
    concatx: (t, e, by) => ({ k: 'concatx', t: t, e: e, by: by })
  };
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
        const rows = [], series = env.series || {};
        for (let i = 0; i < n.n; i++) {
          const m = {}; Object.keys(series).forEach((k) => { const v = series[k][i]; if (v != null && isFinite(v)) m[k] = v; });
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

  // DAX printing
  const daxStr = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const daxNum = (n) => { const s = String(+n.toFixed(6)); return s.startsWith('.') ? '0' + s : s; };
  const daxMeasure = (name) => '[' + String(name).replace(/\]/g, ']]') + ']';
  function dax(n) {
    switch (n.k) {
      case 'num': return n.n < 0 ? '( ' + daxNum(n.n) + ' )' : daxNum(n.n);
      case 'str': return daxStr(n.s);
      case 'blank': return 'BLANK ()';
      case 'ref': return n.name;
      case 'measure': return daxMeasure(n.name);
      case 'isblank': return 'ISBLANK ( ' + dax(n.a) + ' )';
      case 'op': return '( ' + dax(n.a) + ' ' + n.o + ' ' + dax(n.b) + ' )';
      case 'fn': return n.f + ' ( ' + n.args.map(dax).join(', ') + ' )';
      case 'if': return 'IF ( ' + dax(n.c) + ', ' + dax(n.a) + ', ' + dax(n.b) + ' )';
      case 'switch': return 'SWITCH ( TRUE (), ' + n.cases.map(([c, v]) => dax(c) + ', ' + dax(v)).join(', ') + ', ' + dax(n.other) + ' )';
      case 'fmt': return 'FORMAT ( ' + dax(n.a) + ', ' + daxStr(n.p) + ', "en-US" )';
      case 'cat': return n.parts.map(dax).join(' & ');
      case 'col': return '[' + n.name + ']';
      case 'sparkEnd': return n.mode === 'filter' ? 'MAX ( ' + n.col + ' )' : 'CALCULATE ( MAX ( ' + n.col + ' ), LASTNONBLANK ( ' + n.col + ', ' + dax(n.expr) + ' ) )';
      case 'spark': {
        const E = dax(n.end);
        const win = {
          month: ['EOMONTH ( ' + E + ', -[Value] - 1 ) + 1', 'EOMONTH ( ' + E + ', -[Value] )'],
          week: [E + ' - 7 * [Value] - 6', E + ' - 7 * [Value]'],
          day: [E + ' - [Value]', E + ' - [Value]']
        }[n.grain];
        return 'FILTER ( ADDCOLUMNS ( GENERATESERIES ( 0, ' + (n.n - 1) + ' ), "@v", CALCULATE ( ' + dax(n.expr) + ', ' +
          (n.clear ? 'REMOVEFILTERS ( ' + n.table + ' ), ' : '') + 'DATESBETWEEN ( ' + n.col + ', ' + win[0] + ', ' + win[1] + ' ) ) ), NOT ( ISBLANK ( [@v] ) ) )';
      }
      case 'filt': return 'FILTER ( ' + dax(n.t) + ', ' + dax(n.c) + ' )';
      case 'aggx': return n.f === 'COUNTROWS' ? 'COUNTROWS ( ' + dax(n.t) + ' )' : n.f + ' ( ' + dax(n.t) + ', ' + dax(n.e) + ' )';
      case 'concatx': return 'CONCATENATEX ( ' + dax(n.t) + ', ' + dax(n.e) + ', " ", ' + dax(n.by) + ', DESC )';
    }
    throw new Error('node ' + n.k);
  }

  // ---------- SVG text safety ----------
  // Static text is escaped for XML, then for the data URL: % and # would break the image URL.
  const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
  const urlEsc = (s) => String(s).replace(/%/g, '%25').replace(/#/g, '%23');
  const safe = (s) => urlEsc(xmlEsc(s));
  const hexOk = (c) => /^#[0-9a-fA-F]{6}$/.test(c || '');
  const color = (c) => (c === 'none' ? 'none' : hexOk(c) ? urlEsc(c.toLowerCase()) : '%23000000');
  const attrNum = (n) => { const v = Math.round((+n || 0) * 100) / 100; return String(Object.is(v, -0) ? 0 : v); };

  // ---------- values ----------
  // A value is a measure, or a formula of two other values. Each becomes one VAR.
  const VALUE_KINDS = {
    measure: (v) => N.measure(v.measure),
    ratio: (v, R) => N.fn('DIVIDE', [R(v.a), R(v.b)]),
    diff: (v, R) => N.op('-', R(v.a), R(v.b)),
    pct: (v, R) => N.fn('DIVIDE', [N.op('-', R(v.a), R(v.b)), R(v.b)])
  };
  // DAX variable names come from the value labels (_Sales_LY), falling back to the id for non-Latin labels
  const slug = (s) => String(s || '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  function varNames(values) {
    const map = new Map(), used = new Set(['_svg']);
    values.forEach((v) => {
      let base = slug(v.label) || slug(v.id) || 'value';
      if (/^\d/.test(base)) base = 'v' + base;
      base = '_' + base;
      if (/^_L\d+_/.test(base)) base += '_v';   // keep clear of the layer variables
      let n = base, k = 2;
      while (used.has(n.toLowerCase())) n = base + '_' + k++;  // DAX names are not case sensitive
      used.add(n.toLowerCase()); map.set(v.id, n);
    });
    return map;
  }

  // Number formats for text: all arithmetic + FORMAT with fixed patterns, so JS and DAX agree exactly.
  // Percent is written as a static "%25" suffix: a raw % would break the image URL.
  // A number that rounds to zero is made exactly 0 first, so no engine can print "-0.0".
  const zeroSmall = (a, decimals) => N.iff(N.op('<', N.fn('ABS', [a]), N.num(0.5 / Math.pow(10, decimals))), N.num(0), a);
  const FORMATS = {
    n0: (a) => N.fmt(zeroSmall(a, 0), '#,0'),
    n1: (a) => N.fmt(zeroSmall(a, 1), '#,0.0'),
    n2: (a) => N.fmt(zeroSmall(a, 2), '#,0.00'),
    k1: (a) => N.cat([N.fmt(zeroSmall(N.op('/', a, N.num(1000)), 1), '#,0.0'), N.str('K')]),
    m1: (a) => N.cat([N.fmt(zeroSmall(N.op('/', a, N.num(1000000)), 1), '#,0.0'), N.str('M')]),
    auto: (a) => N.iff(N.op('>=', N.fn('ABS', [a]), N.num(1000000)), FORMATS.m1(a),
      N.iff(N.op('>=', N.fn('ABS', [a]), N.num(1000)), FORMATS.k1(a), FORMATS.n0(a))),
    p0: (a) => N.cat([N.fmt(zeroSmall(N.op('*', a, N.num(100)), 0), '#,0'), N.str('%25')]),
    p1: (a) => N.cat([N.fmt(zeroSmall(N.op('*', a, N.num(100)), 1), '#,0.0'), N.str('%25')])
  };
  const OPS = ['<', '<=', '>', '>=', '=', '<>'];

  // ---------- compile ----------
  function compile(design, opts) {
    const d = design || {};
    const tag = !!(opts && opts.tag);  // preview only: wrap each layer in <g data-l='n'> for the editor
    const W = Math.max(8, Math.min(2000, +d.w || 240)), H = Math.max(8, Math.min(2000, +d.h || 80));
    const vars = [];      // { name, node, comment }
    const errors = [];
    const valueIds = new Set();
    const names = varNames(d.values || []);
    const varName = (id) => names.get(id);
    const R = (id) => { if (!valueIds.has(id)) { errors.push('Unknown value: ' + id); return N.num(0); } return N.ref(varName(id)); };
    const Z = (id) => N.fn('COALESCE', [R(id), N.num(0)]);

    (d.values || []).forEach((v) => {
      const make = VALUE_KINDS[v.kind];
      if (!make) { errors.push('Unknown value kind: ' + v.kind); return; }
      if (v.kind === 'measure' && !String(v.measure || '').trim()) { errors.push('Value "' + (v.label || v.id) + '" needs a measure name'); return; }
      vars.push({ name: varName(v.id), node: make(v, R), comment: null });
      valueIds.add(v.id);
    });

    // A value written out in full, with its measures inline, so it can be recalculated per period
    const exprOf = (id, depth) => {
      const v = (d.values || []).find((x) => x.id === id);
      if (!v || !VALUE_KINDS[v.kind] || (depth || 0) > 20) { errors.push('Unknown value: ' + id); return N.num(0); }
      return VALUE_KINDS[v.kind](v, (x) => exprOf(x, (depth || 0) + 1));
    };
    // 'Date'[Date] or Date[Date] -> table and column, always quoted
    const dateCol = (() => {
      const m = /^\s*'?([^'\[\]]+?)'?\s*\[([^\[\]]+)\]\s*$/.exec(d.dateCol || "'Date'[Date]");
      return m ? { table: "'" + m[1].trim().replace(/'/g, "''") + "'", col: "'" + m[1].trim().replace(/'/g, "''") + "'[" + m[2].trim() + ']' } : null;
    })();

    // Bound numeric prop: range r0..r1 driven by value v across d0..d1 (clamped)
    const scale = (b) => {
      const span = (+b.d1) - (+b.d0);
      if (!span) { errors.push('Scale range cannot be empty'); return N.num(+b.r0 || 0); }
      let t = Z(b.v);
      if (+b.d0) t = N.op('-', t, N.num(+b.d0));
      if (span !== 1) t = N.op('/', t, N.num(span));
      t = N.fn('MIN', [N.fn('MAX', [t, N.num(0)]), N.num(1)]);
      const r0 = +b.r0 || 0, r1 = +b.r1 || 0;
      let out = r1 - r0 === 1 ? t : N.op('*', t, N.num(r1 - r0));
      if (r0) out = N.op('+', N.num(r0), out);
      return out;
    };
    const cond = (c) => {
      if (!OPS.includes(c.op)) { errors.push('Unknown comparison: ' + c.op); return N.op('=', N.num(0), N.num(1)); }
      return N.op(c.op, Z(c.v), N.num(+c.t || 0));
    };
    const rules = (b) => ((b.rules || []).length ? N.sw(b.rules.map((r) => [cond(r), N.str(color(r.c))]), N.str(color(b.other))) : N.str(color(b.other)));

    const parts = [];     // top-level SVG pieces: string or node
    const lit = (arr, s) => { const last = arr[arr.length - 1]; if (typeof last === 'string') arr[arr.length - 1] = last + s; else arr.push(s); };
    const hoist = (el, prop, node, list) => { const name = '_L' + el._i + '_' + prop; vars.push({ name: name, node: node, comment: list }); return N.ref(name); };

    (d.layers || []).forEach((el, i) => {
      el = Object.assign({}, el, { _i: i + 1 });
      const b = el.bind || {};
      const out = [];
      let first = true;
      const note = () => { const c = first ? 'Layer ' + el._i + ': ' + (el.name || el.type) : null; first = false; return c; };
      // attribute helpers: static value, or a hoisted VAR when bound
      const numA = (name, prop, v) => {
        if (b[prop] && b[prop].v) { const r = hoist(el, prop, scale(b[prop]), note()); lit(out, ' ' + name + "='"); out.push(N.fmt(+b[prop].r0 < 0 || +b[prop].r1 < 0 ? zeroSmall(r, 2) : r, '0.00')); lit(out, "'"); }
        else lit(out, ' ' + name + "='" + attrNum(v) + "'");
      };
      const colA = (name, prop, v) => {
        if (b[prop] && b[prop].rules) { const r = hoist(el, prop, rules(b[prop]), note()); lit(out, ' ' + name + "='"); out.push(r); lit(out, "'"); }
        else lit(out, ' ' + name + "='" + color(v) + "'");
      };
      const common = () => {
        if (el.stroke && el.stroke !== 'none' && +el.sw > 0) { colA('stroke', 'stroke', el.stroke); lit(out, " stroke-width='" + attrNum(el.sw) + "'"); }
        if (b.opacity && b.opacity.v) numA('opacity', 'opacity', 1);
        else if (el.opacity != null && +el.opacity < 1) lit(out, " opacity='" + attrNum(el.opacity) + "'");
      };

      switch (el.type) {
        case 'rect':
          lit(out, '<rect');
          numA('x', 'x', el.x); numA('y', 'y', el.y); numA('width', 'w', el.w); numA('height', 'h', el.h);
          if (+el.rx) lit(out, " rx='" + attrNum(el.rx) + "'");
          colA('fill', 'fill', el.fill); common(); lit(out, '/>');
          break;
        case 'circle':
          lit(out, '<circle');
          numA('cx', 'cx', el.cx); numA('cy', 'cy', el.cy); numA('r', 'r', el.r);
          colA('fill', 'fill', el.fill); common(); lit(out, '/>');
          break;
        case 'line':
          lit(out, '<line');
          numA('x1', 'x1', el.x1); numA('y1', 'y1', el.y1); numA('x2', 'x2', el.x2); numA('y2', 'y2', el.y2);
          colA('stroke', 'stroke', el.stroke || '#000000');
          lit(out, " stroke-width='" + attrNum(el.sw || 1) + "'" + (el.cap === 'round' ? " stroke-linecap='round'" : ''));
          if (el.opacity != null && +el.opacity < 1) lit(out, " opacity='" + attrNum(el.opacity) + "'");
          lit(out, '/>');
          break;
        case 'text': {
          const anchor = ['start', 'middle', 'end'].includes(el.anchor) ? el.anchor : 'start';
          lit(out, '<text');
          numA('x', 'x', el.x); lit(out, " y='" + attrNum(el.y) + "'");
          lit(out, " font-family='Segoe UI, sans-serif' font-size='" + attrNum(el.size || 14) + "' font-weight='" + (+el.weight || 400) + "' text-anchor='" + anchor + "'");
          colA('fill', 'fill', el.fill); common(); lit(out, '>');
          if (b.text && b.text.v) {
            const f = FORMATS[b.text.fmt] || FORMATS.auto;
            let node = f(Z(b.text.v));
            if (b.text.sign) node = N.cat([N.iff(N.op('>', Z(b.text.v), N.num(0)), N.str('+'), N.str('')), node]);
            const r = hoist(el, 'text', N.cat([N.str(safe(b.text.prefix || '')), node, N.str(safe(b.text.suffix || ''))]), note());
            out.push(r);
          } else lit(out, safe(el.text || ''));
          lit(out, '</text>');
          break;
        }
        case 'ring': {
          const r = Math.max(1, +el.r || 20), C = 2 * Math.PI * r, cx = attrNum(el.cx), cy = attrNum(el.cy), sw = attrNum(el.sw || 6);
          lit(out, "<circle cx='" + cx + "' cy='" + cy + "' r='" + attrNum(r) + "' fill='none' stroke='" + color(el.track || '#1e293b') + "' stroke-width='" + sw + "'/>");
          lit(out, "<circle cx='" + cx + "' cy='" + cy + "' r='" + attrNum(r) + "' fill='none'");
          colA('stroke', 'fill', el.fill || '#00d4ff');
          lit(out, " stroke-width='" + sw + "'" + (el.cap === 'round' ? " stroke-linecap='round'" : '') + " transform='rotate(-90 " + cx + ' ' + cy + ")'");
          if (b.p && b.p.v) {
            const p = hoist(el, 'p', scale({ v: b.p.v, d0: b.p.d0, d1: b.p.d1, r0: 0, r1: 1 }), note());
            lit(out, " stroke-dasharray='"); out.push(N.fmt(N.op('*', p, N.num(+C.toFixed(4))), '0.00')); lit(out, ' ' + attrNum(C) + "'");
            // a round cap draws a dot at 0%, so hide the arc when there is no progress
            lit(out, " stroke-opacity='"); out.push(N.iff(N.op('>', p, N.num(0)), N.str('1'), N.str('0'))); lit(out, "'");
          } else lit(out, " stroke-dasharray='" + attrNum(C * Math.max(0, Math.min(1, +el.p || 0))) + ' ' + attrNum(C) + "'");
          lit(out, '/>');
          break;
        }
        case 'arrow': {
          // Triangle pointing up, down, or a flat bar, chosen by the sign of the value
          const x = +el.x || 0, y = +el.y || 0, s = Math.max(4, +el.size || 16), h = s / 2;
          const P = (pts) => 'M' + pts.map((p) => attrNum(p[0]) + ' ' + attrNum(p[1])).join(' L') + ' Z';
          const up = P([[x + h, y], [x + s, y + s * 0.8], [x, y + s * 0.8]]);
          const down = P([[x, y + s * 0.2], [x + s, y + s * 0.2], [x + h, y + s]]);
          const flat = P([[x, y + s * 0.4], [x + s, y + s * 0.4], [x + s, y + s * 0.6], [x, y + s * 0.6]]);
          const good = color(el.good || '#22c55e'), bad = color(el.bad || '#ef4444'), neutral = color(el.neutral || '#94a3b8');
          const upGood = el.goodWhen !== 'down';
          lit(out, "<path d='");
          if (b.dir && b.dir.v) {
            const sg = hoist(el, 'dir', N.fn('SIGN', [Z(b.dir.v)]), note());
            out.push(N.sw([[N.op('>', sg, N.num(0)), N.str(up)], [N.op('<', sg, N.num(0)), N.str(down)]], N.str(flat)));
            lit(out, "' fill='");
            out.push(N.sw([[N.op('>', sg, N.num(0)), N.str(upGood ? good : bad)], [N.op('<', sg, N.num(0)), N.str(upGood ? bad : good)]], N.str(neutral)));
          } else { lit(out, up + "' fill='" + good); }
          lit(out, "'");
          if (el.opacity != null && +el.opacity < 1) lit(out, " opacity='" + attrNum(el.opacity) + "'");
          lit(out, '/>');
          break;
        }
        case 'spark': {
          // Line over the last n periods: one CALCULATE per period, scaled between the lowest and highest value
          const sv = b.series && b.series.v;
          if (!sv || !valueIds.has(sv)) { errors.push('Sparkline "' + (el.name || 'spark') + '" needs a value'); return; }
          if (!dateCol) { errors.push("Date column must look like 'Date'[Date]"); return; }
          const n = Math.max(2, Math.min(60, Math.round(+el.n || 12))), grain = ['month', 'week', 'day'].includes(el.grain) ? el.grain : 'month';
          const x = +el.x || 0, y = +el.y || 0, w = Math.max(1, +el.w || 100), h = Math.max(1, +el.h || 30), step = w / (n - 1);
          const expr = exprOf(sv);
          const end = hoist(el, 'end', N.sparkEnd({ col: dateCol.col, expr: expr, mode: el.end === 'filter' ? 'filter' : 'data' }), note());
          const pts = hoist(el, 'pts', N.spark({ expr: expr, grain: grain, n: n, end: end, col: dateCol.col, table: dateCol.table, clear: d.clearDateFilters !== false }), note());
          const lo = hoist(el, 'lo', N.aggx('MINX', pts, N.col('@v')), note());
          const hi = hoist(el, 'hi', N.aggx('MAXX', pts, N.col('@v')), note());
          const F = (node) => N.fmt(x < 0 || y < 0 ? zeroSmall(node, 2) : node, '0.00');
          const xOf = (i) => N.op('+', N.num(x), N.op('*', N.op('-', N.num(n - 1), i), N.num(step)));
          const yOf = (v) => N.iff(N.op('=', hi, lo), N.num(y + h / 2), N.op('-', N.num(y + h), N.op('*', N.op('/', N.op('-', v, lo), N.op('-', hi, lo)), N.num(h))));
          const line = hoist(el, 'line', N.concatx(pts, N.cat([F(xOf(N.col('Value'))), N.str(','), F(yOf(N.col('@v')))]), N.col('Value')), note());
          const count = N.aggx('COUNTROWS', pts);
          if (el.area) {
            const bottom = attrNum(y + h), op = attrNum(el.areaOpacity == null ? 0.2 : Math.max(0, Math.min(1, +el.areaOpacity)));
            out.push(N.iff(N.op('>', count, N.num(1)), N.cat([N.str("<polygon points='"), F(xOf(N.aggx('MAXX', pts, N.col('Value')))), N.str(',' + bottom + ' '), line, N.str(' '),
              F(xOf(N.aggx('MINX', pts, N.col('Value')))), N.str(',' + bottom + "' fill='" + color(el.areaColor || el.stroke || '#00d4ff') + "' fill-opacity='" + op + "'/>")]), N.str('')));
          }
          lit(out, "<polyline points='"); out.push(line); lit(out, "' fill='none'");
          colA('stroke', 'stroke', el.stroke || '#00d4ff');
          lit(out, " stroke-width='" + attrNum(el.sw || 2) + "' stroke-linejoin='round' stroke-linecap='round'");
          if (el.opacity != null && +el.opacity < 1) lit(out, " opacity='" + attrNum(el.opacity) + "'");
          lit(out, '/>');
          if (el.dot) {
            // dot on the newest period that has a value
            const i0 = hoist(el, 'i0', N.aggx('MINX', pts, N.col('Value')), note());
            const v0 = hoist(el, 'v0', N.aggx('MAXX', N.filt(pts, N.op('=', N.col('Value'), i0)), N.col('@v')), note());
            out.push(N.iff(N.op('>', count, N.num(0)), N.cat([N.str("<circle cx='"), F(xOf(i0)), N.str("' cy='"), F(yOf(v0)),
              N.str("' r='" + attrNum(el.dotR || 3) + "' fill='" + color(el.dotColor || el.stroke || '#00d4ff') + "'/>")]), N.str('')));
          }
          break;
        }
        default:
          errors.push('Unknown layer type: ' + el.type);
          return;
      }
      // The editor wraps each layer (outside any "show if") so hidden layers stay selectable
      if (tag) lit(parts, "<g data-l='" + (el._i - 1) + "'>");
      // Show if: the whole layer becomes "" when the condition is false
      if (b.show && b.show.v) {
        const shown = hoist(el, 'show', cond(b.show), note());
        const inner = out.map((p) => (typeof p === 'string' ? N.str(p) : p));
        parts.push(N.iff(shown, N.cat(inner), N.str('')));
      } else out.forEach((p) => (typeof p === 'string' ? lit(parts, p) : parts.push(p)));
      if (tag) lit(parts, '</g>');
    });

    const bg = hexOk(d.bg) ? "<rect width='" + W + "' height='" + H + "' rx='" + attrNum(d.radius || 0) + "' fill='" + color(d.bg) + "'/>" : '';
    const open = "<svg xmlns='http://www.w3.org/2000/svg' width='" + W + "' height='" + H + "' viewBox='0 0 " + W + ' ' + H + "'>" + bg;
    const svgParts = [open].concat(parts).concat(['</svg>']);
    // merge neighbouring strings
    const merged = [];
    svgParts.forEach((p) => (typeof p === 'string' ? lit(merged, p) : merged.push(p)));
    const svgNode = N.cat(merged.map((p) => (typeof p === 'string' ? N.str(p) : p)));
    // Only a measure can be "blank" in the same way in DAX and in the preview
    const hideIf = (d.values || []).some((v) => v.id === d.hideIfBlank && v.kind === 'measure' && valueIds.has(v.id)) ? d.hideIfBlank : null;

    return { vars: vars, svg: svgNode, hideIf: hideIf ? varName(hideIf) : null, errors: errors, name: String(d.name || 'SVG KPI').replace(/[\r\n]+/g, ' ').trim() || 'SVG KPI' };
  }

  // ---------- outputs ----------
  const PREFIX = 'data:image/svg+xml;utf8,';

  function toDax(design) {
    const c = compile(design);
    const L = [];
    L.push(daxMeasure(c.name).slice(1, -1) + ' =');
    L.push('-- Made with the free DataArcus SVG KPI Designer: dataarcus.com/tools/svg-kpi-designer.html');
    L.push('-- In Power BI set this measure\'s Data category to Image URL (Measure tools > Data category).');
    c.vars.forEach((v) => {
      if (v.comment) L.push('-- ' + v.comment.replace(/[\r\n]+/g, ' '));
      L.push('VAR ' + v.name + ' = ' + dax(v.node));
    });
    L.push('VAR _svg =');
    const pieces = (c.svg.k === 'cat' ? c.svg.parts : [c.svg]).map(dax);
    L.push('    ' + pieces[0]);
    pieces.slice(1).forEach((p) => L.push('        & ' + p));
    L.push('RETURN');
    if (c.hideIf) L.push('    IF ( ISBLANK ( ' + c.hideIf + ' ), BLANK (), ' + daxStr(PREFIX) + ' & _svg )');
    else L.push('    ' + daxStr(PREFIX) + ' & _svg');
    return { dax: L.join('\n'), errors: c.errors };
  }

  // measures: { "Sales": 1240000, ... } keyed by measure name; returns the image URL (or '' when hidden)
  function toImageUrl(design, measures, opts) {
    const c = compile(design, opts);
    const env = { measures: measures || {}, vars: {}, series: (opts && opts.series) || {} };
    c.vars.forEach((v) => { env.vars[v.name] = evalNode(v.node, env); });
    if (c.hideIf && env.vars[c.hideIf] == null) return { url: '', errors: c.errors };
    return { url: PREFIX + evalNode(c.svg, env), errors: c.errors };
  }

  const api = { compile: compile, toDax: toDax, toImageUrl: toImageUrl, formatNumber: formatNumber, FORMATS: Object.keys(FORMATS), OPS: OPS, PREFIX: PREFIX, version: 1 };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SVGKPI = api;
})(typeof self !== 'undefined' ? self : this);
