/*
 * DataArcus SVG KPI Designer: the DAX code generation (0.3.2 SP16, moved from svg-kpi-compiler.js as it was).
 * dax(n) prints one node of the expression tree svg-expressions.js builds (the same tree the preview evaluator runs:
 * one tree, no second parser) as DAX text; daxStr, daxNum and daxMeasure write a string, a number and a measure name.
 * A name holding a control character is never written (hasControl, CONTROL_MSG: the compiler reads them too).
 * The run-time escaping of a model's text (the esc node) prints svg-expressions.js's frozen ESCAPES. Pure JavaScript,
 * no DOM. The designer pages load this file after svg-expressions.js and before svg-kpi-compiler.js (browser global
 * SVGKPICodegen); Node requires it.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  const X = typeof module === 'object' && module.exports ? require('./svg-expressions.js') : root.SVGKPIExpr;
  const ESCAPES = X.ESCAPES;

  const daxStr = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const daxNum = (n) => { const s = String(+n.toFixed(6)); return s.startsWith('.') ? '0' + s : s; };
  // A3-4 (AUD-032): a name holding a control character (\p{Cc}: a tab, a line break) is never written into DAX: the
  // same test as the report writer's Pbip.hasControl. compile refuses such values with an error first; this throw is
  // the backstop, so no path can write one
  const hasControl = (x) => /\p{Cc}/u.test(String(x));
  const CONTROL_MSG = 'holds a control character (a tab or a line break), which DAX names can\'t hold: rename it in the model';
  const daxMeasure = (name) => { if (hasControl(name)) throw new Error('The measure name ' + CONTROL_MSG); return '[' + String(name).replace(/\]/g, ']]') + ']'; };
  function dax(n) {
    switch (n.k) {
      case 'num': return n.n < 0 ? '( ' + daxNum(n.n) + ' )' : daxNum(n.n);
      case 'str': return daxStr(n.s);
      case 'blank': return 'BLANK ()';
      case 'ref': return n.name;
      case 'measure': return daxMeasure(n.name);
      case 'colval': return 'SELECTEDVALUE ( ' + n.col + ' )';
      case 'esc': return ESCAPES.reduce((s, e) => 'SUBSTITUTE ( ' + s + ', ' + daxStr(e[0]) + ', ' + daxStr(e[1]) + ' )', dax(n.a) + ' & ""');
      case 'isblank': return 'ISBLANK ( ' + dax(n.a) + ' )';
      case 'op': return '( ' + dax(n.a) + ' ' + n.o + ' ' + dax(n.b) + ' )';
      case 'fn': return n.f + ' ( ' + n.args.map(dax).join(', ') + ' )';
      case 'if': return 'IF ( ' + dax(n.c) + ', ' + dax(n.a) + ', ' + dax(n.b) + ' )';
      case 'switch': return 'SWITCH ( TRUE (), ' + n.cases.map(([c, v]) => dax(c) + ', ' + dax(v)).join(', ') + ', ' + dax(n.other) + ' )';
      case 'fmt': return 'FORMAT ( ' + dax(n.a) + ', ' + daxStr(n.p) + ', "en-US" )';
      case 'cat': return n.parts.map(dax).join(' & ');
      case 'col': return '[' + n.name + ']';
      case 'sparkEnd': {
        const e = n.mode === 'filter' ? 'MAX ( ' + n.col + ' )' : 'CALCULATE ( MAX ( ' + n.col + ' ), LASTNONBLANK ( ' + n.col + ', ' + dax(n.expr) + ' ) )';
        // complete months only: a month that is still running ends the line at the month before
        return n.complete ? '( VAR __e = ' + e + ' RETURN IF ( __e = EOMONTH ( __e, 0 ), __e, EOMONTH ( __e, -1 ) ) )' : e;
      }
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

  const api = Object.freeze({ dax: dax, daxStr: daxStr, daxNum: daxNum, daxMeasure: daxMeasure, hasControl: hasControl, CONTROL_MSG: CONTROL_MSG });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SVGKPICodegen = api;
})(typeof self !== 'undefined' ? self : this);
