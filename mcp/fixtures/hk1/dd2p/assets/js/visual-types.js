/* DataArcus visual types: which visual types are Power BI's own and which are custom (0.2.9, audit 5 A5-6 and audit 6
 * A6-13). One list for every block that asks: the reading block (read_report, check_report) and the report writer's
 * mirror (the Arabic twin) used two different tests and disagreed (scorecard, heatMap, filterSlicer were custom to one
 * and native to the other; a custom id written as one plain word was native to the twin).
 * NATIVE_TYPES is Microsoft's catalog of visual types: listVisualTypes() of @microsoft/powerbi-core-visual-schema 0.1.3
 * (58 types; 0.1.1's debugVisual left the catalog, U1), copied here because this file also runs in the browser; mcp/test-0.2.9v.mjs fails when the package's
 * list and this one differ, so a new catalog version is a test failure, not a silent drift.
 * A type is custom when the report declares it (report.json: publicCustomVisuals, organizationCustomVisuals, or a
 * resourcePackages entry of type CustomVisual), or when it is not in the catalog. 'group' and 'unknown' (no type
 * read) are neither. Pure; browser and Node (module.exports / window.DAVisualTypes). */
(function (root) {
  'use strict';
  const CATALOG = '@microsoft/powerbi-core-visual-schema 0.1.3';
  const NATIVE_TYPES = Object.freeze([
    'accessibleTable', 'actionButton', 'advancedSlicerVisual', 'aiNarratives', 'animatedNumber', 'areaChart',
    'azureMap', 'barChart', 'basicShape', 'bookmarkNavigator', 'card', 'cardVisual', 'clusteredBarChart',
    'clusteredColumnChart', 'columnChart', 'dataQueryVisual', 'decompositionTreeVisual', 'donutChart',
    'filledMap', 'filterSlicer', 'funnel', 'ganttChart', 'gauge', 'heatMap', 'hundredPercentStackedAreaChart',
    'hundredPercentStackedBarChart', 'hundredPercentStackedColumnChart', 'image', 'keyDriversVisual', 'kpi',
    'lineChart', 'lineClusteredColumnComboChart', 'lineStackedColumnComboChart', 'listSlicer', 'map', 'matrix',
    'multiRowCard', 'pageNavigator', 'pieChart', 'pivotTable', 'pythonVisual', 'qnaVisual', 'rdlVisual',
    'realTimeLineChart', 'ribbonChart', 'scatterChart', 'scorecard', 'scriptVisual', 'shape', 'shapeMap', 'slicer',
    'stackedAreaChart', 'table', 'tableEx', 'textbox', 'textSlicer', 'treemap', 'waterfallChart'
  ]);
  const NATIVE = new Set(NATIVE_TYPES);
  // the slicers of the catalog (a visual that filters the page by its field)
  const SLICER_TYPES = Object.freeze(['slicer', 'advancedSlicerVisual', 'listSlicer', 'textSlicer', 'filterSlicer']);
  const NOT_A_TYPE = new Set(['group', 'unknown', '']);
  const list = (x) => (Array.isArray(x) ? x : []);
  // the custom visual types a report declares (report.json), as a set of type ids
  function customTypesOf(report) {
    const r = report || {}, out = new Set();
    list(r.publicCustomVisuals).forEach((n) => { if (typeof n === 'string') out.add(n); });
    list(r.organizationCustomVisuals).forEach((o) => { if (o && typeof o.name === 'string') out.add(o.name); });
    list(r.resourcePackages).forEach((p) => { if (p && p.type === 'CustomVisual' && typeof p.name === 'string') out.add(p.name); });
    return out;
  }
  const isNative = (type) => NATIVE.has(String(type == null ? '' : type));
  // report: the report.json (optional); declared: a set from customTypesOf (optional, saves reading report.json again)
  function isCustom(type, report, declared) {
    const t = String(type == null ? '' : type);
    if (NOT_A_TYPE.has(t)) return false;
    const d = declared || (report ? customTypesOf(report) : null);
    if (d && d.has(t)) return true;
    return !NATIVE.has(t);
  }
  const isSlicer = (type) => SLICER_TYPES.includes(String(type));
  const api = { CATALOG, NATIVE_TYPES, SLICER_TYPES, isNative, isCustom, isSlicer, customTypesOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAVisualTypes = api;
})(typeof self !== 'undefined' ? self : this);
