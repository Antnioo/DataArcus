/*
 * DataArcus SVG KPI Designer: starter designs.
 * Each one is a normal design the user can open and change. Same format the designer saves.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  // Sample values shared by the starters: Sales vs Target vs Sales last year
  const V = () => [
    { id: 'sales', label: 'Sales', kind: 'measure', measure: 'Sales', sample: 1240000 },
    { id: 'target', label: 'Target', kind: 'measure', measure: 'Target', sample: 1500000 },
    { id: 'ly', label: 'Sales LY', kind: 'measure', measure: 'Sales LY', sample: 1100000 },
    { id: 'ach', label: 'Achievement', kind: 'ratio', a: 'sales', b: 'target' },
    { id: 'growth', label: 'Growth vs LY', kind: 'pct', a: 'sales', b: 'ly' }
  ];
  const GOOD = '#22c55e', WARN = '#f59e0b', BAD = '#ef4444', ACCENT = '#00d4ff', INK = '#f8fafc', MUTED = '#94a3b8';
  const achColor = () => ({ rules: [{ v: 'ach', op: '<', t: 0.7, c: BAD }, { v: 'ach', op: '<', t: 0.9, c: WARN }], other: GOOD });

  const TEMPLATES = [
    {
      id: 'ring', name: 'Progress ring', nameAr: 'حلقة التقدم', w: 120, h: 120, values: V(), hideIfBlank: 'sales',
      layers: [
        { type: 'ring', name: 'Ring', cx: 60, cy: 60, r: 46, sw: 12, track: '#1e293b', fill: ACCENT, cap: 'round', bind: { p: { v: 'ach', d0: 0, d1: 1 }, fill: achColor() } },
        { type: 'text', name: 'Percent', x: 60, y: 66, size: 22, weight: 700, anchor: 'middle', fill: INK, bind: { text: { v: 'ach', fmt: 'p0' } } },
        { type: 'text', name: 'Caption', x: 60, y: 84, size: 10, weight: 400, anchor: 'middle', fill: MUTED, text: 'of target' }
      ]
    },
    {
      id: 'trend', name: 'Trend arrow', nameAr: 'سهم الاتجاه', w: 120, h: 32, values: V(), hideIfBlank: 'sales',
      layers: [
        { type: 'arrow', name: 'Arrow', x: 4, y: 8, size: 16, goodWhen: 'up', good: GOOD, bad: BAD, neutral: MUTED, bind: { dir: { v: 'growth' } } },
        { type: 'text', name: 'Growth', x: 26, y: 22, size: 14, weight: 700, anchor: 'start', fill: INK,
          bind: { text: { v: 'growth', fmt: 'p1', sign: true }, fill: { rules: [{ v: 'growth', op: '<', t: 0, c: BAD }], other: GOOD } } },
        { type: 'text', name: 'Caption', x: 82, y: 22, size: 10, weight: 400, anchor: 'start', fill: MUTED, text: 'vs LY' }
      ]
    },
    {
      id: 'bar', name: 'Target bar', nameAr: 'شريط الهدف', w: 220, h: 48, values: V(), hideIfBlank: 'sales',
      layers: [
        { type: 'text', name: 'Value', x: 0, y: 16, size: 14, weight: 700, anchor: 'start', fill: INK, bind: { text: { v: 'sales', fmt: 'auto', prefix: 'AED ' } } },
        { type: 'text', name: 'Percent', x: 220, y: 16, size: 12, weight: 600, anchor: 'end', fill: MUTED, bind: { text: { v: 'ach', fmt: 'p0', suffix: ' of target' } } },
        { type: 'rect', name: 'Track', x: 0, y: 26, w: 220, h: 12, rx: 6, fill: '#1e293b' },
        { type: 'rect', name: 'Bar', x: 0, y: 26, w: 0, h: 12, rx: 6, fill: ACCENT, bind: { w: { v: 'ach', d0: 0, d1: 1, r0: 0, r1: 220 }, fill: achColor() } },
        { type: 'line', name: '90% marker', x1: 198, y1: 22, x2: 198, y2: 42, stroke: INK, sw: 2, opacity: 0.6 }
      ]
    },
    {
      id: 'pill', name: 'Status pill', nameAr: 'شارة الحالة', w: 120, h: 30, values: V(), hideIfBlank: 'sales',
      layers: [
        { type: 'rect', name: 'Pill', x: 1, y: 1, w: 118, h: 28, rx: 14, fill: GOOD, opacity: 0.18, bind: { fill: achColor() } },
        { type: 'circle', name: 'Dot', cx: 16, cy: 15, r: 5, fill: GOOD, bind: { fill: achColor() } },
        { type: 'text', name: 'Label', x: 28, y: 20, size: 13, weight: 700, anchor: 'start', fill: INK, bind: { text: { v: 'ach', fmt: 'p0', suffix: ' of target' } } },
        { type: 'circle', name: 'Target hit', cx: 110, cy: 8, r: 4, fill: '#fdcb6e', bind: { show: { v: 'ach', op: '>=', t: 1 } } }
      ]
    },
    {
      id: 'card', name: 'KPI card', nameAr: 'بطاقة مؤشر', premium: true, w: 260, h: 112, bg: '#1a1f2e', radius: 12, values: V(), hideIfBlank: 'sales',
      layers: [
        { type: 'text', name: 'Title', x: 16, y: 26, size: 12, weight: 600, anchor: 'start', fill: MUTED, text: 'Sales' },
        { type: 'text', name: 'Achievement', x: 244, y: 26, size: 11, weight: 600, anchor: 'end', fill: MUTED, bind: { text: { v: 'ach', fmt: 'p0', suffix: ' of target' } } },
        { type: 'text', name: 'Value', x: 16, y: 62, size: 28, weight: 800, anchor: 'start', fill: INK, bind: { text: { v: 'sales', fmt: 'auto', prefix: 'AED ' } } },
        { type: 'arrow', name: 'Arrow', x: 16, y: 73, size: 12, goodWhen: 'up', good: GOOD, bad: BAD, neutral: MUTED, bind: { dir: { v: 'growth' } } },
        { type: 'text', name: 'Growth', x: 33, y: 84, size: 12, weight: 700, anchor: 'start', fill: GOOD,
          bind: { text: { v: 'growth', fmt: 'p1', sign: true }, fill: { rules: [{ v: 'growth', op: '<', t: 0, c: BAD }], other: GOOD } } },
        { type: 'text', name: 'Caption', x: 82, y: 84, size: 11, weight: 400, anchor: 'start', fill: MUTED, text: 'vs last year' },
        { type: 'rect', name: 'Track', x: 16, y: 96, w: 228, h: 6, rx: 3, fill: '#0a0f1c' },
        { type: 'rect', name: 'Bar', x: 16, y: 96, w: 0, h: 6, rx: 3, fill: ACCENT, bind: { w: { v: 'ach', d0: 0, d1: 1, r0: 0, r1: 228 }, fill: achColor() } }
      ]
    }
  ];

  const api = { TEMPLATES: TEMPLATES };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SVGKPITemplates = api;
})(typeof self !== 'undefined' ? self : this);
