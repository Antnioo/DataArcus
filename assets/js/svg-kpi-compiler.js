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
    num: (n) => ({ k: 'num', n: n }),
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
    isBlank: (a) => ({ k: 'isblank', a: a })
  };
  const PATTERNS = { '0.##': [0, 2, false], '#,0': [0, 0, true], '#,0.0': [1, 1, true], '#,0.00': [2, 2, true] };

  // FORMAT with the en-US locale: half away from zero, like .NET
  function formatNumber(v, pattern) {
    const [minD, maxD, group] = PATTERNS[pattern];
    const p = Math.pow(10, maxD);
    let r = Math.round(Math.abs(v) * p) / p;
    const neg = v < 0 && r !== 0;
    let s = r.toFixed(maxD);
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
  const varName = (id) => '_' + String(id).replace(/[^A-Za-z0-9_]/g, '_');

  // Number formats for text: all arithmetic + FORMAT with fixed patterns, so JS and DAX agree exactly.
  // Percent is written as a static "%25" suffix: a raw % would break the image URL.
  const FORMATS = {
    n0: (a) => N.fmt(a, '#,0'),
    n1: (a) => N.fmt(a, '#,0.0'),
    n2: (a) => N.fmt(a, '#,0.00'),
    k1: (a) => N.cat([N.fmt(N.op('/', a, N.num(1000)), '#,0.0'), N.str('K')]),
    m1: (a) => N.cat([N.fmt(N.op('/', a, N.num(1000000)), '#,0.0'), N.str('M')]),
    auto: (a) => N.iff(N.op('>=', N.fn('ABS', [a]), N.num(1000000)), FORMATS.m1(a),
      N.iff(N.op('>=', N.fn('ABS', [a]), N.num(1000)), FORMATS.k1(a), FORMATS.n0(a))),
    p0: (a) => N.cat([N.fmt(N.op('*', a, N.num(100)), '#,0'), N.str('%25')]),
    p1: (a) => N.cat([N.fmt(N.op('*', a, N.num(100)), '#,0.0'), N.str('%25')])
  };
  const OPS = ['<', '<=', '>', '>=', '=', '<>'];

  // ---------- compile ----------
  function compile(design) {
    const d = design || {};
    const W = Math.max(8, Math.min(2000, +d.w || 240)), H = Math.max(8, Math.min(2000, +d.h || 80));
    const vars = [];      // { name, node, comment }
    const errors = [];
    const valueIds = new Set();
    const R = (id) => { if (!valueIds.has(id)) { errors.push('Unknown value: ' + id); return N.num(0); } return N.ref(varName(id)); };
    const Z = (id) => N.fn('COALESCE', [R(id), N.num(0)]);

    (d.values || []).forEach((v) => {
      const make = VALUE_KINDS[v.kind];
      if (!make) { errors.push('Unknown value kind: ' + v.kind); return; }
      if (v.kind === 'measure' && !String(v.measure || '').trim()) { errors.push('Value "' + (v.label || v.id) + '" needs a measure name'); return; }
      vars.push({ name: varName(v.id), node: make(v, R), comment: null });
      valueIds.add(v.id);
    });

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
    const layerComments = [];
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
        if (b[prop] && b[prop].v) { const r = hoist(el, prop, scale(b[prop]), note()); lit(out, ' ' + name + "='"); out.push(N.fmt(r, '0.##')); lit(out, "'"); }
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
            lit(out, " stroke-dasharray='"); out.push(N.fmt(N.op('*', p, N.num(+C.toFixed(4))), '0.##')); lit(out, ' ' + attrNum(C) + "'");
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
        default:
          errors.push('Unknown layer type: ' + el.type);
          return;
      }
      // Show if: the whole layer becomes "" when the condition is false
      if (b.show && b.show.v) {
        const shown = hoist(el, 'show', cond(b.show), note());
        const inner = out.map((p) => (typeof p === 'string' ? N.str(p) : p));
        parts.push(N.iff(shown, N.cat(inner), N.str('')));
      } else out.forEach((p) => (typeof p === 'string' ? lit(parts, p) : parts.push(p)));
      layerComments.push(el.name || el.type);
    });

    const bg = hexOk(d.bg) ? "<rect width='100%' height='100%' rx='" + attrNum(d.radius || 0) + "' fill='" + color(d.bg) + "'/>" : '';
    const open = "<svg xmlns='http://www.w3.org/2000/svg' width='" + W + "' height='" + H + "' viewBox='0 0 " + W + ' ' + H + "'>" + bg;
    const svgParts = [open].concat(parts).concat(['</svg>']);
    // merge neighbouring strings
    const merged = [];
    svgParts.forEach((p) => (typeof p === 'string' ? lit(merged, p) : merged.push(p)));
    const svgNode = N.cat(merged.map((p) => (typeof p === 'string' ? N.str(p) : p)));
    // Only a measure can be "blank" in the same way in DAX and in the preview
    const hideIf = (d.values || []).some((v) => v.id === d.hideIfBlank && v.kind === 'measure' && valueIds.has(v.id)) ? d.hideIfBlank : null;

    return { vars: vars, svg: svgNode, hideIf: hideIf, errors: errors, name: d.name || 'SVG KPI' };
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
    if (c.hideIf) L.push('    IF ( ISBLANK ( ' + varName(c.hideIf) + ' ), BLANK (), ' + daxStr(PREFIX) + ' & _svg )');
    else L.push('    ' + daxStr(PREFIX) + ' & _svg');
    return { dax: L.join('\n'), errors: c.errors };
  }

  // measures: { "Sales": 1240000, ... } keyed by measure name; returns the image URL (or '' when hidden)
  function toImageUrl(design, measures) {
    const c = compile(design);
    const env = { measures: measures || {}, vars: {} };
    c.vars.forEach((v) => { env.vars[v.name] = evalNode(v.node, env); });
    if (c.hideIf && env.vars[varName(c.hideIf)] == null) return { url: '', errors: c.errors };
    return { url: PREFIX + evalNode(c.svg, env), errors: c.errors };
  }

  const api = { compile: compile, toDax: toDax, toImageUrl: toImageUrl, formatNumber: formatNumber, FORMATS: Object.keys(FORMATS), OPS: OPS, PREFIX: PREFIX, version: 1 };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SVGKPI = api;
})(typeof self !== 'undefined' ? self : this);
