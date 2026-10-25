// LAYER reading (0.2.9, custom visuals): what a visual SHOWS, from its data roles and the shape of their fields, so a
// redesign can put a native Power BI visual in place of a custom one (or an HTML/SVG measure where native can't show
// it). Pure: no I/O, no network; the input is not changed.
//
// Input: one visual as the reading block's inventory gives it (read-report.mjs): { type, fields: { Role: [field] } },
// a field { kind: column | measure | aggregation, table, name, agg?, level?, queryRef? }. The report files carry no data
// types: opts.typeOf(field) may give the model's ('dateTime', 'date', 'string', 'int64', ...).
// Output: { kind, native, drill: [field], series: [field] | null, confidence: high | medium | low, why, htmlNeeded,
//   roles: { NativeRole: [field] }, lost: [text] }.
//
// How it decides, in this order of weight:
// 1. The fields' shapes: which roles hold columns and which hold measures (an aggregation of a column is a value), the
//    columns' data types (a date type, or a level of Power BI's date hierarchy, makes a time axis; a column's NAME never
//    does), and how many columns a category role holds (more than one: drill levels, in their order).
// 2. The role names, matched word by word against ROLE_WORDS: a custom visual names its roles in its own capabilities,
//    so these are words, not a vendor's list. The table is the one place to adjust once real role names are read.
// 3. A weak hint: words in the visual's id (FAMILY_HINTS, a short table). It only chooses among the kinds the fields can
//    show (a "pie" word picks a pie for one measure by a category) and is set aside, and said so, when they can't.
// Names in the report are untrusted: `why` and `lost` are written from role classes and counts only, never from a role,
// table, column or measure name. The fields in `roles` are the report's own (the writer needs them); a caller that
// shows them screens them as read_report does.

import { createRequire } from 'node:module';
import { getCapabilities } from '@microsoft/powerbi-core-visual-schema';

// one test of custom versus native for every block (assets/js/visual-types.js, Microsoft's catalog)
const VT = createRequire(import.meta.url)('../../assets/js/visual-types.js');
// (0.3.0 J19, B-172) which measures may share one value axis: the one rule, shared with the gallery's combo
const AX = createRequire(import.meta.url)('../../assets/js/axis-units.js');
// Microsoft's validator's own table of required roles and maxima per visual type (its metadata provider): the referee
// of every native visual this module chooses (the laptop proof of 11 Oct: a donut written with no value, a map with no
// location: PBIR_ROLE_REQUIRED_MISSING; two categories in a donut: PBIR_ROLE_MAX_EXCEEDED)
let VP = null;
try { VP = await (await import('@microsoft/powerbi-report-authoring-cli')).getMetadataProvider(); } catch (e) { VP = null; }

// ---- the role words (lower-case words; a role name is split at case changes, digits and other characters) ----
// Order matters: a role takes the first class one of its words belongs to (ColumnValues: bar before value).
export const ROLE_WORDS = {
  tooltip: ['tooltip', 'tooltips'],
  // a colour rule (a field that only colours the marks): never a series
  colorRule: ['rule', 'rules'],
  latitude: ['latitude', 'lat'],
  longitude: ['longitude', 'lon', 'lng'],
  location: ['location', 'locations', 'geo', 'address', 'place', 'places'],
  node: ['node', 'nodes', 'link', 'links', 'edge', 'edges'],
  from: ['source', 'sources', 'from', 'parent', 'parents', 'origin', 'start'],
  // "target" is a network's end when it holds a column, a goal when it holds a measure
  goal: ['goal', 'goals', 'target', 'targets', 'benchmark', 'baseline', 'to', 'child', 'children', 'destination', 'end'],
  min: ['min', 'minimum'],
  max: ['max', 'maximum'],
  indicator: ['indicator', 'kpi'],
  breakdown: ['breakdown'],
  line: ['line', 'lines', 'secondary', 'y2'],
  bar: ['column', 'columns', 'bar', 'bars', 'primary'],
  series: ['series', 'legend', 'color', 'colour', 'colors', 'colours', 'stack', 'segment', 'segments', 'subcategory'],
  x: ['x', 'xaxis'],
  y: ['y', 'yaxis'],
  size: ['size', 'bubble', 'radius', 'weight', 'weights'],
  rows: ['row', 'rows'],
  time: ['date', 'dates', 'time', 'timeline', 'period', 'periods', 'calendar', 'trend'],
  category: ['category', 'categories', 'axis', 'group', 'groups', 'dimension', 'dimensions', 'label', 'labels', 'name', 'names', 'item', 'items', 'level', 'levels', 'hierarchy', 'drill', 'detail', 'details'],
  value: ['value', 'values', 'measure', 'measures', 'amount', 'amounts', 'metric', 'metrics', 'data', 'total', 'totals']
};
// a "to" word that holds a column: the network's end (the goal class above with a column)
const TO_WORDS = new Set(['target', 'targets', 'to', 'child', 'children', 'destination', 'end']);

// ---- the weak hint: words in a custom visual's id (its trailing 32-character code left out) ----
// Each entry: id words -> a kind. Only used when the fields can show that kind. Ordered: the first match counts.
export const FAMILY_HINTS = {
  donut: ['donut', 'doughnut', 'ring'],
  pie: ['pie'],
  combo: ['combo'],
  waterfall: ['waterfall'],
  time: ['timeline'],
  network: ['network', 'graph', 'sankey', 'chord', 'flow'],
  gauge: ['gauge', 'dial', 'bullet'],
  kpi: ['kpi', 'indicator'],
  map: ['map', 'geo'],
  scatter: ['scatter', 'bubble'],
  matrix: ['matrix', 'pivot'],
  table: ['table', 'grid'],
  slicer: ['slicer', 'filter'],
  card: ['card', 'tile'],
  area: ['area'],
  line: ['line'],
  column: ['column', 'facet'],
  bar: ['bar']
};

// ---- the native visual of each kind (Power BI's visualType; null: no native visual shows it) ----
// the custom visual's own format objects can name its form (weak, as the id's words): a pie drawn with a hole
export const OBJECT_HINTS = { donut: ['donut', 'doughnut'] };

export const NATIVE = {
  combo: 'lineClusteredColumnComboChart', column: 'clusteredColumnChart', bar: 'clusteredBarChart', line: 'lineChart', area: 'areaChart',
  pie: 'pieChart', donut: 'donutChart', waterfall: 'waterfallChart', scatter: 'scatterChart', map: 'azureMap', network: null,
  gauge: 'gauge', kpi: 'kpi', table: 'tableEx', matrix: 'pivotTable', card: 'cardVisual', slicer: 'slicer', unknown: null
};
// Power BI's own visuals: their kind
const BUILTIN_KIND = {
  lineClusteredColumnComboChart: 'combo', lineStackedColumnComboChart: 'combo',
  clusteredColumnChart: 'column', columnChart: 'column', stackedColumnChart: 'column', hundredPercentStackedColumnChart: 'column', ribbonChart: 'column',
  clusteredBarChart: 'bar', barChart: 'bar', stackedBarChart: 'bar', hundredPercentStackedBarChart: 'bar', funnel: 'bar',
  lineChart: 'line', areaChart: 'area', stackedAreaChart: 'area', hundredPercentStackedAreaChart: 'area',
  pieChart: 'pie', donutChart: 'donut', waterfallChart: 'waterfall', scatterChart: 'scatter',
  map: 'map', filledMap: 'map', azureMap: 'map', shapeMap: 'map', gauge: 'gauge', kpi: 'kpi', tableEx: 'table', pivotTable: 'matrix',
  card: 'card', cardVisual: 'card', multiRowCard: 'card', slicer: 'slicer', advancedSlicerVisual: 'slicer', listSlicer: 'slicer', textSlicer: 'slicer'
};
// Power BI's date hierarchy levels (as Desktop names them in English; another language's names are not read as time)
const DATE_LEVELS = new Set(['year', 'quarter', 'month', 'day', 'week', 'date']);
const DATE_TYPES = /^(date|datetime|datetimezone)$/i;

// a name split into lower-case words: "ColumnValues" -> column, values; "Y2" -> y2; "Trend Axis" -> trend, axis
export const wordsOf = (s) => String(s || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  .flatMap((w) => { const m = /^([a-z]+)\d+$/.exec(w); return m ? [w, m[1]] : [w]; }); // "Values1" -> values1, values (a vendor numbers its value roles)
const classOf = (role, display) => { const w = wordsOf(role).concat(display ? wordsOf(display) : []); for (const [cls, list] of Object.entries(ROLE_WORDS)) { const hit = w.find((x) => list.includes(x)); if (hit) return { cls, word: hit }; } return { cls: 'other', word: null }; };
// every class a role's words belong to (a vendor joins two: "sourceNodes", "kpiValue", "StartDate"), with the words
const classesOf = (role, display) => { const w = wordsOf(role).concat(display ? wordsOf(display) : []); return { words: w, set: new Set(Object.entries(ROLE_WORDS).filter(([, list]) => w.some((x) => list.includes(x))).map(([c]) => c)) }; };
const isValue = (f) => f.kind === 'measure' || f.kind === 'aggregation';
const isCol = (f) => f.kind === 'column';
const copy = (f) => Object.assign({}, f);

// a custom visual's id words for the hint (the trailing code of 32 letters and digits left out)
function hintsOf(type) {
  const w = wordsOf(String(type || '').replace(/[0-9A-Fa-f]{32}$/, ''));
  return Object.entries(FAMILY_HINTS).filter(([, list]) => w.some((x) => list.includes(x))).map(([kind]) => kind);
}
// the format objects' hint (OBJECT_HINTS): names only, never their values
const objectHintOf = (objects) => { const w = (Array.isArray(objects) ? objects : []).flatMap((x) => wordsOf(x)); const e = Object.entries(OBJECT_HINTS).find(([, list]) => w.some((x) => list.includes(x))); return e ? e[0] : null; };
// a value shown as a percentage, by its format string (quoted text left out): null when the format is not known
const pctOf = (fmt) => (typeof fmt === 'string' ? /%/.test(fmt.replace(/"[^"]*"/g, '').replace(/\\./g, '')) : null);

// each role: its effective class from its words and its fields' shapes
// customRoles: the custom visual's own dataRoles when the report has its package ([{ name, displayName, kind }]): a role
// whose name says nothing ("measureRole7") is read by its display name ("Values")
function rolesOf(v, customRoles, temporal) {
  const disp = Object.fromEntries((Array.isArray(customRoles) ? customRoles : []).filter((r) => r && r.name).map((r) => [String(r.name), String(r.displayName || '')]));
  const R = Object.entries(v.fields || {}).map(([role, list]) => {
    const fields = (list || []).filter((f) => f && (isValue(f) || isCol(f)));
    const { cls } = classOf(role, disp[role]), { set, words } = classesOf(role, disp[role]), cols = fields.filter(isCol), vals = fields.filter(isValue);
    const shape = !fields.length ? 'none' : !vals.length ? 'columns' : !cols.length ? 'values' : 'mixed';
    const has = (c) => set.has(c), toWord = words.some((w) => TO_WORDS.has(w));
    // dates only: a date column, or the first or last of one (Min/Max)
    const dates = fields.length > 0 && fields.every((f) => temporal(f) || (f.kind === 'aggregation' && /^(Min|Max)$/.test(f.agg) && temporal(Object.assign({}, f, { kind: 'column' }))));
    let eff;
    if (has('tooltip')) eff = 'tooltip';
    else if (has('colorRule')) eff = 'colorRule';
    else if (shape === 'mixed') eff = 'mixed';
    else if ((has('from') || toWord) && dates && !has('node')) eff = has('from') ? 'start' : 'end'; // a date range: a schedule
    else if (has('time') && shape === 'values' && fields.every((f) => f.kind === 'aggregation' && /^(Min|Max)$/.test(f.agg))) eff = 'timeHelper'; // the first date of a period: the axis's helper, no value
    else if (shape === 'columns') eff = has('latitude') ? 'latitude' : has('longitude') ? 'longitude' : has('location') ? 'location' : has('node') ? 'node' : has('from') ? 'from' : toWord ? 'to'
      : { bar: 'mcolumns', x: 'category', y: 'category', rows: 'rows', time: 'time', category: 'category', series: 'series', breakdown: 'breakdown' }[cls] || 'anonCol';
    else eff = has('latitude') ? 'latitude' : has('longitude') ? 'longitude' : has('series') && words.some((w) => /^colou?rs?$/.test(w)) ? 'colorValue' : has('indicator') ? 'indicator' : has('from') ? 'fromV' : toWord && has('goal') ? 'toV'
      : { goal: 'goal', min: 'min', max: 'max', line: 'line', bar: 'bar', x: 'x', y: 'y', size: 'size', node: 'size', value: 'value', category: 'extra', series: 'value', time: 'value', location: 'extra' }[cls] || 'anonVal';
    return { role, cls, eff, words, named: cls !== 'other', fields, cols, vals };
  }).filter((r) => r.fields.length);
  // a start and an end that are values are a scatter's X and Y ("sourceNodes", "targetNodes"); alone, a start value is a
  // size and an end value a target (a gauge's)
  const pair = R.some((r) => r.eff === 'fromV') && R.some((r) => r.eff === 'toV');
  R.forEach((r) => { if (r.eff === 'fromV') r.eff = pair ? 'x' : 'size'; else if (r.eff === 'toV') r.eff = pair ? 'y' : 'goal'; });
  return R;
}

const LEVELS = ['low', 'medium', 'high'];
const up = (c) => LEVELS[Math.min(2, LEVELS.indexOf(c) + 1)];
const down = (c) => LEVELS[Math.max(0, LEVELS.indexOf(c) - 1)];
const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;

// opts: { typeOf(field) -> data type, customRoles: the custom visual's dataRoles (optional), declared: a Set of the types
// the report declares custom (visual-types.js customTypesOf; optional) }
export function meaningOf(visual, opts) {
  const o = opts || {}, type = String((visual && visual.type) || '');
  const typeOf = (f) => { try { return o.typeOf ? o.typeOf(f) : undefined; } catch (e) { return undefined; } };
  const formatOf = (f) => { try { return o.formatOf ? o.formatOf(f) : undefined; } catch (e) { return undefined; } };
  const temporal = (f) => isCol(f) && ((f.level && DATE_LEVELS.has(String(f.level).toLowerCase())) || DATE_TYPES.test(String(typeOf(f) || '')));
  const out = (kind, roles, extra) => Object.assign({ kind, native: NATIVE[kind], drill: [], series: null, confidence: 'low', why: '', htmlNeeded: kind === 'network', roles, lost: [] }, extra);

  // a Power BI visual: its own kind, kept as it is
  if (type === 'group') return out('unknown', {}, { native: null, why: 'a group of visuals: nothing to replace' });
  if (!VT.isCustom(type, null, o.declared)) {
    const kind = Object.prototype.hasOwnProperty.call(BUILTIN_KIND, type) ? BUILTIN_KIND[type] : 'unknown', roles = Object.fromEntries(Object.entries(visual.fields || {}).map(([r, l]) => [r, (l || []).filter((f) => f && (isValue(f) || isCol(f))).map(copy)]).filter(([, l]) => l.length));
    const cat = roles.Category || roles.Rows || [];
    return out(kind, roles, { native: type, drill: cat.length > 1 ? cat.map(copy) : [], series: roles.Series ? roles.Series.map(copy) : null, confidence: 'high', why: 'a Power BI visual: kept as it is' });
  }

  const R = rolesOf(visual || {}, o.customRoles, temporal), idHints = hintsOf(type), objHint = objectHintOf(o.customObjects || (visual && visual.customObjects));
  let hint = objHint || idHints[0] || null;
  const lost = [];
  // a start without an end (or an end without a start) is no date range: a time column, or a value
  if (!(R.some((r) => r.eff === 'start') && R.some((r) => r.eff === 'end'))) R.forEach((r) => { if (r.eff === 'start' || r.eff === 'end') r.eff = r.cols.length ? 'time' : 'value'; });
  if (R.some((r) => r.eff === 'colorRule')) lost.push('its colour rule role (marks coloured by a field): in Power BI that is conditional formatting by a measure, set by hand');
  // tooltips, and a value role that is a label (a category word holding values), go to Tooltips; the axis's date helper is
  // no value (a native time axis sorts itself)
  const SIDE = ['tooltip', 'extra', 'colorRule', 'timeHelper', 'colorValue'];
  if (R.some((r) => r.eff === 'colorValue')) lost.push('its colour by a value (marks shaded by a measure): the native visual colours by a legend category, or by conditional formatting set by hand');
  const live = R.filter((r) => !SIDE.includes(r.eff)), tips = R.filter((r) => r.eff === 'tooltip' || r.eff === 'extra').flatMap((r) => r.fields.filter((f) => r.eff === 'tooltip' || isValue(f)).map(copy));
  const named = live.length > 0 && live.every((r) => r.named);
  const by = (...effs) => live.filter((r) => effs.includes(r.eff));
  const cols = (...effs) => by(...effs).flatMap((r) => r.cols.map(copy));
  const vals = (...effs) => by(...effs).flatMap((r) => r.vals.map(copy));
  const withTips = (roles) => (tips.length ? Object.assign(roles, { Tooltips: tips }) : roles);
  const custom = 'a custom visual';
  if (!live.length) return out('unknown', {}, { why: `${custom} with no fields in its roles: nothing tells what it shows` });

  // the shape: which family of kinds the fields can show
  let shape, roles, drill = [], series = null, why, kind, aggregate = null;
  const valueRoles = by('value', 'indicator', 'bar', 'anonVal', 'y', 'size', 'line', 'goal', 'min', 'max', 'x');
  const catRoles = by('category', 'time', 'x', 'y').filter((r) => r.cols.length).concat(by('anonCol'));
  if (by('start').length && by('end').length) {
    shape = 'schedule';
    roles = { Values: live.flatMap((r) => r.fields.map(copy)) };
    why = 'a start date and an end date per row: a schedule (a Gantt), which no generally available native visual draws as bars (Microsoft\'s Gantt visual is in preview); a table keeps its facts';
    lost.push('the bars from start to end date: no generally available native visual draws a date range as bars (Microsoft\'s Gantt visual is in preview); the table lists the same fields');
  } else if (by('node').length || (by('from').length && (by('to').length || by('node').length))) {
    shape = 'network';
    roles = { Source: cols('from', 'node'), Target: cols('to'), Weight: vals('size', 'value', 'anonVal') };
    why = 'its roles join two columns (a start and an end, or nodes and their links): a network, which no native visual draws';
  } else if (by('location', 'latitude', 'longitude').length) {
    shape = 'map';
    // a place: by latitude and longitude when both are there (Azure map takes those columns only without a Location),
    // else by a location or a name; a category that is no name is the legend
    const NAME = ['name', 'names', 'label', 'labels'], named2 = (r) => r.words.some((w) => NAME.includes(w));
    const lat = by('latitude').flatMap((r) => r.fields.map(copy)).slice(0, 1), lon = by('longitude').flatMap((r) => r.fields.map(copy)).slice(0, 1);
    const places = cols('location').concat(by('category').filter(named2).flatMap((r) => r.cols.map(copy)));
    const legend = cols('series').concat(by('category').filter((r) => !named2(r)).flatMap((r) => r.cols.map(copy)));
    // Azure map needs a Location (Microsoft's validator): the place's name, else the first category; latitude and
    // longitude go with it averaged (its capabilities: with a Location they are values), so each place sits where they say
    // (rc.2b, Z11: with latitude and longitude but no place, the latitude column keys each point: a category used as the
    // location would move the points; never a table for a map)
    const keyByLat = !places.length && lat.length && lon.length;
    roles = withTips({ Category: places.length ? places.slice(0, 1) : keyByLat ? lat.map(copy) : legend.splice(0, 1) });
    if (lat.length && lon.length) { roles.Y = lat.map((f) => Object.assign({}, f, { kind: 'aggregation', agg: 'Avg' })); roles.X = lon.map((f) => Object.assign({}, f, { kind: 'aggregation', agg: 'Avg' })); aggregate = { Y: 'Avg', X: 'Avg' }; }
    const size = vals('size', 'value', 'anonVal').slice(0, 1); if (size.length) roles.Size = size;
    if (legend.length) roles.Series = legend.slice(0, 1);
    if (keyByLat) lost.push('the place names: the original had none, so each point is keyed by its latitude (shown as its location name) and placed by its latitude and longitude');
    else if (!places.length && roles.Category.length) lost.push('the place names: its category is used as the location, which Power BI looks up on the map; check the places');
    why = `a location${roles.Y ? ' with its latitude and longitude' : ''}${size.length ? ', sized by a value' : ''}${legend.length ? ' by a category' : ''}: a map`;
  } else if (by('x').length && (by('y').length || by('value').length)) {
    shape = 'scatter';
    roles = withTips({ Category: cols('category', 'time', 'anonCol'), X: vals('x'), Y: vals('y', 'value').slice(0, 1), Size: vals('size').slice(0, 1) });
    if (by('series').length) roles.Series = cols('series');
    why = 'an X value and a Y value by a category: a scatter';
  } else if ((by('rows').length || by('mcolumns').length) && valueRoles.length) {
    shape = 'matrix';
    roles = { Rows: cols('rows').concat(by('rows').length ? [] : cols('category', 'time', 'anonCol')), Columns: cols('mcolumns'), Values: vals('value', 'anonVal', 'indicator', 'bar', 'y', 'size') };
    drill = roles.Rows.length > 1 ? roles.Rows.map(copy) : [];
    why = `rows (${n(roles.Rows.length, 'column', 'columns')}), columns and values: a matrix`;
  } else if (by('mixed').length) {
    shape = 'table';
    roles = { Values: live.flatMap((r) => r.fields.map(copy)) };
    why = 'columns and values in one role: a table, in their order';
  } else if (!live.some((r) => r.cols.length)) {
    if (by('goal', 'min', 'max').length) {
      shape = 'gauge';
      roles = { Y: vals('value', 'indicator', 'anonVal', 'bar', 'y').slice(0, 1) };
      if (by('goal').length) roles.TargetValue = vals('goal').slice(0, 1);
      if (by('min').length) roles.MinValue = vals('min').slice(0, 1);
      if (by('max').length) roles.MaxValue = vals('max').slice(0, 1);
      why = 'a value and a target, no category: a gauge';
    } else {
      shape = 'card';
      roles = { Data: live.flatMap((r) => r.vals.map(copy)) };
      why = `${n(roles.Data.length, 'value', 'values')} and no category: a card`;
    }
  } else if (!live.some((r) => r.vals.length)) {
    if (live.length === 1) {
      shape = 'slicer';
      roles = { Values: live[0].cols.map(copy) };
      drill = roles.Values.length > 1 ? roles.Values.map(copy) : [];
      why = 'columns only, in one role: a slicer';
    } else {
      shape = 'table';
      roles = { Values: live.flatMap((r) => r.cols.map(copy)) };
      why = 'columns only, in several roles: a table';
    }
  } else {
    // a chart: a category (its columns are the drill levels), values, and maybe a series
    const catRole = catRoles[0], cat = catRole ? catRole.cols.map(copy) : [];
    const ser = cols('series').concat(catRoles.slice(1).flatMap((r) => r.cols.map(copy)));
    const isTime = cat.length > 0 && cat.every((f) => temporal(f) || (catRole.eff === 'time' && !!f.level));
    const timeTyped = cat.length > 0 && cat.every((f) => temporal(f));
    const goal = vals('goal');
    if (goal.length && cat.length === 1 && timeTyped) {
      shape = 'kpi';
      roles = { Indicator: vals('indicator', 'value', 'anonVal', 'bar', 'y').slice(0, 1), TrendLine: cat, Goal: goal.slice(0, 1) };
      why = 'a value, a trend over dates and a goal: a KPI';
    } else {
      shape = 'chart';
      const lines = vals('line'), bars = vals('bar');
      let main = vals('value', 'indicator', 'anonVal', 'y', 'size', 'goal', 'min', 'max');
      // a KPI value beside the chart's own values (a total shown in a donut's hole): not one of its values
      // (by its role, not by its field: the laptop proof's Z1, a donut whose value and KPI value are the same measure lost
      // both and was written with no value)
      const others = vals('value', 'anonVal', 'y', 'size', 'goal', 'min', 'max');
      if (by('indicator').length && (lines.length || bars.length || others.length)) {
        main = others;
        lost.push('the total it shows over the chart (its own KPI value): a card placed over the native visual can show it');
      }
      roles = withTips({ Category: cat });
      drill = cat.length > 1 ? cat.map(copy) : [];
      const all = bars.concat(main), pcts = all.map((f) => pctOf(formatOf(f)));
      if (lines.length && (bars.length || main.length)) {
        kind = 'combo'; roles.Y = bars.concat(main); roles.Y2 = lines;
        why = `a category, column values and line values: a combo`;
      } else if (all.length >= 2 && pcts.every((x) => x !== null) && pcts.some(Boolean) && pcts.some((x) => !x)) {
        // amounts with a percentage riding along: the percentage draws as a line on its own axis (by the values' formats)
        kind = 'combo'; roles.Y = all.filter((f, i) => !pcts[i]); roles.Y2 = all.filter((f, i) => pcts[i]);
        why = `a category${cat.length > 1 ? ` with ${cat.length} drill levels` : ''}, ${n(roles.Y.length, 'amount', 'amounts')} and ${n(roles.Y2.length, 'percentage', 'percentages')} (by their formats): a combo, the percentages as a line`;
      } else {
        roles.Y = bars.concat(main, lines);
        if (by('breakdown').length) { kind = 'waterfall'; roles.Breakdown = cols('breakdown'); }
        why = `a category${isTime || timeTyped ? ' on a time axis' : ''}${cat.length > 1 ? ` with ${cat.length} drill levels` : ''} and ${n(roles.Y.length, 'value', 'values')}${roles.Breakdown ? ' with a breakdown: a waterfall' : ''}`;
      }
      if (ser.length) {
        if (roles.Y.length === 1 || kind === 'combo' && bars.concat(main).length === 1) { roles.Series = ser; series = ser.map(copy); why += ', split by a series'; }
        else lost.push('the series split: a native chart shows several values or one value split by a series, not both; the values are kept');
      }
      if (!kind) kind = isTime || timeTyped ? 'line' : 'bar';
      shape = 'chart';
      roles._time = isTime || timeTyped;
    }
  }

  // confidence: the shape with named roles is medium, without them low; the hint moves it
  let conf = named ? 'medium' : 'low';
  const timeAxis = !!(roles && roles._time); if (roles) delete roles._time;
  if (!kind) kind = { schedule: 'table', network: 'network', map: 'map', scatter: 'scatter', matrix: 'matrix', table: 'table', gauge: 'gauge', card: 'card', slicer: 'slicer', kpi: 'kpi' }[shape];
  if (hint) {
    const nY = (roles.Y || []).length, single = shape === 'chart' && nY === 1 && !roles.Y2 && !roles.Breakdown;
    const fits = { pie: single, donut: single, waterfall: shape === 'chart' && nY === 1 && !roles.Y2, combo: shape === 'chart' && (nY + (roles.Y2 || []).length) >= 2,
      time: shape === 'chart', line: shape === 'chart' && !roles.Y2, area: shape === 'chart' && !roles.Y2, column: shape === 'chart' && !roles.Y2, bar: shape === 'chart' && !roles.Y2,
      network: shape === 'network', map: shape === 'map', scatter: shape === 'scatter', matrix: shape === 'matrix', table: shape === 'table', slicer: shape === 'slicer', card: shape === 'card',
      gauge: shape === 'gauge', kpi: shape === 'kpi' || shape === 'gauge' }[hint];
    const allKnown = (roles.Y || []).every((f) => pctOf(formatOf(f)) !== null) && (roles.Y || []).length > 0;
    const next = idHints.find((h) => h !== 'combo' && ['bar', 'column', 'line', 'area'].includes(h));
    const want = hint === 'time' ? (roles.Y2 ? 'combo' : timeAxis ? 'line' : 'column') : hint === 'kpi' && shape === 'gauge' ? 'gauge' : hint;
    if (fits && hint === 'combo' && !roles.Y2 && allKnown) {
      // the values' formats are known and none is a percentage beside amounts: no line is called for; the id's other
      // word (a bar) gives the chart, and the bars drawn over each other are told
      kind = next || (timeAxis ? 'line' : 'column');
      lost.push('its overlapping bars (one drawn inside a wider one): native bars sit side by side');
      why += `; the id's words hint at a combo, but the values' formats call for no line: ${kind === 'bar' ? 'bars' : kind}`;
    } else if (fits) {
      if (hint === 'combo' && !roles.Y2) {
        // one role of several values: the first draws as columns, the rest as lines (the custom visual's own format
        // decides which are lines; it is not in its roles)
        roles.Y2 = roles.Y.slice(1); roles.Y = roles.Y.slice(0, 1);
        if (roles.Series) { delete roles.Series; series = null; }
        lost.push('which values draw as lines was set in the custom visual\'s format, not its roles: here the first value is the columns and the rest are lines; check it');
        conf = named ? 'medium' : 'low';
      } else conf = up(conf);
      kind = want;
      if (kind === 'combo' && idHints.includes('bar')) lost.push('its horizontal bars: Power BI\'s line and column combo is vertical, so the bars become columns');
      why += `; the ${hint === objHint ? 'format objects' : 'id\'s words'} hint at a ${hint === 'time' ? 'timeline' : hint}, which the fields can show`;
    } else {
      conf = down(conf);
      why += `; the id's words hint at a ${hint === 'time' ? 'timeline' : hint}, set aside: the fields can't be shown as one`;
    }
  }
  if (kind === 'network') lost.push('no native visual draws a network: an HTML/SVG measure in an image-capable visual is needed (the owner approves it in the plan)');
  if (drill.length > 1) {
    if (drillsIn(NATIVE[kind])) lost.push(`the custom visual's own drill-down (its animation and click behaviour): Power BI's drill buttons on the native visual take its place, the ${drill.length} levels kept as a hierarchy`);
    else lost.push(`the ${drill.length} drill levels: the native visual shows them side by side, not as a drill-down`);
  }
  lost.push('the custom visual\'s own look (colours, labels, animation) is not carried over: the report\'s theme gives the native one its look');
  return out(kind, roles, Object.assign({ drill, series, confidence: conf, why: `${custom}: ${why}`, lost, htmlNeeded: kind === 'network' }, aggregate ? { aggregate } : {}));
}

// ---- Microsoft's capabilities of the native visuals (@microsoft/powerbi-core-visual-schema, the version mcp/package.json pins) ----
const capsOf = (type) => { try { return type ? getCapabilities(type) || null : null; } catch (e) { return null; } };
const drillsIn = (type) => { const c = capsOf(type); return !!(c && c.drilldown); };
// whether a native visual takes these fields in these roles: every role is one of its dataRoles, a Grouping role holds
// columns and a Measure role values, and the counts meet one of its conditions (min, max, and kind: 0 a column, 1 a
// value), in one of its data view mappings. Returns { ok, problems: [text] } (role names are the native's own).
export function fitsCapabilities(type, roles) {
  const caps = capsOf(type);
  if (!caps) return { ok: false, problems: [`${type || 'no type'} is not in Microsoft's catalog of visuals`] };
  const problems = [], dr = Object.fromEntries((caps.dataRoles || []).map((r) => [r.name, r]));
  const used = Object.entries(roles || {}).filter(([, l]) => Array.isArray(l) && l.length);
  for (const [r, l] of used) {
    const d = dr[r];
    if (!d) { problems.push(`${type} has no ${r} role`); continue; }
    if (d.kind === 'Measure' && l.some(isCol)) problems.push(`${type}'s ${r} (${d.displayName || r}) takes values, not columns`);
    if (d.kind === 'Grouping' && l.some(isValue)) {
      // a Grouping role some condition lets hold values (kind 1: the scatter's and the map's X and Y)
      const valuesOk = (caps.dataViewMappings || []).some((m) => (m.conditions || []).some((c) => c[r] && c[r].kind === 1));
      if (!valuesOk) problems.push(`${type}'s ${r} (${d.displayName || r}) takes columns, not values`);
    }
  }
  // a drill role's fields are levels: Power BI shows one at a time, so its conditions count one (a pie's Category max 1
  // still drills through a hierarchy)
  const drillRoles = (caps.drilldown && caps.drilldown.roles) || [];
  const count = (r) => { const k = ((roles || {})[r] || []).length; return drillRoles.includes(r) ? Math.min(k, 1) : k; };
  const meets = (c) => Object.entries(c).every(([r, k]) => {
    if (!k || typeof k !== 'object' || !dr[r] && !(r in (roles || {}))) return true;
    const nr = count(r);
    if (k.min != null && nr < k.min) return false;
    if (k.max != null && nr > k.max) return false;
    if (k.kind === 1 && ((roles || {})[r] || []).some(isCol)) return false;
    if (k.kind === 0 && ((roles || {})[r] || []).some(isValue)) return false;
    return true;
  });
  const maps = caps.dataViewMappings || [];
  const condOk = !maps.length || maps.some((m) => !m || !Array.isArray(m.conditions) || !m.conditions.length || m.conditions.some(meets));
  if (!condOk) problems.push(`${type} can't show ${used.map(([r, l]) => `${l.length} in ${r}`).join(', ')} (none of its field-count conditions is met)`);
  // Microsoft's validator: every required role filled, no role over its maximum (it counts every field, drill levels too)
  const entry = VP ? VP.getVisualEntry(type) : null;
  if (entry) {
    entry.requiredRoles.filter((r) => !((roles || {})[r] || []).length).forEach((r) => problems.push(`${type} needs its ${r} role (${dr[r] && dr[r].displayName || r}) filled`));
    Object.entries(entry.maxPerRole).filter(([r, mx]) => ((roles || {})[r] || []).length > mx).forEach(([r, mx]) => problems.push(`${type}'s ${r} takes at most ${mx} field(s)`));
  }
  return { ok: problems.length === 0, problems };
}

// the native visual's own name of a role (its display name in Desktop's field wells)
const roleLabel = (type, r) => { const c = capsOf(type), d = c && (c.dataRoles || []).find((x) => x.name === r); return d && d.displayName ? d.displayName : r; };
const LABEL = { combo: 'line and clustered column chart', column: 'clustered column chart', bar: 'clustered bar chart', line: 'line chart', area: 'area chart', pie: 'pie chart',
  donut: 'donut chart', waterfall: 'waterfall chart', scatter: 'scatter chart', map: 'Azure map', gauge: 'gauge', kpi: 'KPI', table: 'table', matrix: 'matrix', card: 'card', slicer: 'slicer', multiRowCard: 'multi-row card' };
const CHARTS = ['bar', 'column', 'line', 'area', 'combo', 'pie', 'donut', 'waterfall'];

// the candidates for one meaning, most fitting first: [{ kind, native, roles }]
function candidatesOf(m) {
  const R = m.roles || {}, tips = R.Tooltips ? { Tooltips: R.Tooltips } : {};
  const all = Object.entries(R).filter(([r]) => r !== 'Tooltips').flatMap(([, l]) => l);
  const table = { kind: 'table', native: 'tableEx', roles: { Values: all.slice() } };
  const out = [];
  if (CHARTS.includes(m.kind)) {
    const Y = (R.Y || []).concat(R.Y2 || []), base = Object.assign({ Category: R.Category || [] }, R.Series ? { Series: R.Series } : {}, tips);
    const time = m.kind === 'line' || m.kind === 'area';
    const order = [m.kind].concat(time ? ['line', 'area', 'column', 'bar'] : ['bar', 'column', 'line'], Y.length >= 2 ? ['combo'] : ['donut', 'pie']);
    [...new Set(order)].forEach((k) => {
      if (k === 'combo') out.push({ kind: k, native: NATIVE.combo, roles: Object.assign({}, base, R.Y2 ? { Y: R.Y, Y2: R.Y2 } : { Y: Y.slice(0, 1), Y2: Y.slice(1) }) });
      else if (k === 'waterfall') out.push({ kind: k, native: NATIVE.waterfall, roles: Object.assign({ Category: R.Category || [], Y }, R.Breakdown ? { Breakdown: R.Breakdown } : {}, tips) });
      // a pie or donut by two categories: the second as its details (Microsoft's validator: its Category takes one field)
      else if ((k === 'pie' || k === 'donut') && base.Category.length === 2 && !base.Series) out.push({ kind: k, native: NATIVE[k], twoLevel: true, roles: Object.assign({}, base, { Category: base.Category.slice(0, 1), Series: base.Category.slice(1), Y }) });
      else out.push({ kind: k, native: NATIVE[k], roles: Object.assign({}, base, { Y }) });
    });
    out.push(table);
  } else if (m.kind === 'card') out.push({ kind: 'card', native: 'cardVisual', roles: R }, { kind: 'card', native: 'multiRowCard', roles: { Values: R.Data || [] } }, table);
  else if (m.kind === 'gauge') out.push({ kind: 'gauge', native: 'gauge', roles: R }, { kind: 'card', native: 'cardVisual', roles: { Data: all } });
  else if (m.kind === 'kpi') out.push({ kind: 'kpi', native: 'kpi', roles: R }, { kind: 'line', native: 'lineChart', roles: { Category: R.TrendLine || [], Y: (R.Indicator || []).concat(R.Goal || []) } }, { kind: 'card', native: 'cardVisual', roles: { Data: (R.Indicator || []).concat(R.Goal || []) } });
  else if (m.kind === 'matrix') out.push({ kind: 'matrix', native: 'pivotTable', roles: R }, table);
  else if (m.kind === 'table') out.push({ kind: 'table', native: 'tableEx', roles: R }, { kind: 'matrix', native: 'pivotTable', roles: { Rows: all.filter(isCol), Values: all.filter(isValue) } });
  else if (m.kind === 'slicer') out.push({ kind: 'slicer', native: 'slicer', roles: R }, { kind: 'slicer', native: 'listSlicer', roles: R }, table);
  else if (m.kind === 'scatter' || m.kind === 'map') out.push({ kind: m.kind, native: m.native, roles: R }, table);
  else if (m.kind === 'network') out.push(table);
  return out.filter((c) => c.native);
}

// a custom object's name as the answer may show it (plain names only; the reading block screens them first)
const objName = (s) => (typeof s === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(s) ? s : null);

// The design decision for one visual (audit 5, A5-14): which native visual takes a custom visual's place, ranked.
// visual: as meaningOf takes it; opts: meaningOf's, plus customObjects: the names of its formatting objects.
// Returns meaningOf's answer, and: candidates [{ kind, native, roles, fits, problems }] (the fitting ones first),
// the chosen one (kind, native, roles; native null when none fits or the kind needs HTML), guess (true when the custom
// visual's own role definitions were not given: matched by field kinds only), lost, and tell: the sentence for the user.
export function nativeFor(visual, opts) {
  const o = opts || {}, m = meaningOf(visual, o);
  const type = String((visual && visual.type) || ''), custom = VT.isCustom(type, null, o.declared);
  if (!custom) return Object.assign({}, m, { custom: false, candidates: [], guess: false, tell: 'a Power BI visual: kept as it is' });
  const cands = candidatesOf(m).map((c, i) => Object.assign({}, c, fitsCapabilities(c.native, c.roles), { rank: i }));
  const ranked = cands.filter((c) => c.ok).concat(cands.filter((c) => !c.ok)).map(({ ok, rank, ...c }) => Object.assign(c, { fits: ok }));
  const best = m.kind === 'network' ? null : ranked.find((c) => c.fits) || null;
  const guess = !(Array.isArray(o.customRoles) && o.customRoles.length);
  const lost = m.lost.filter((x) => !/own look/.test(x));
  const objs = (o.customObjects || visual.customObjects || []).map(objName), named = objs.filter(Boolean);
  if (objs.length) lost.push(`its own format settings (${objs.length}${named.length ? ': ' + named.slice(0, 8).join(', ') + (named.length > 8 ? ', …' : '') : ''}): the report's theme formats the native visual`);
  else lost.push('its own look (colours, labels, animation): the report\'s theme formats the native visual');
  lost.push('its own interactions (its clicks, animation and drill behaviour): Power BI\'s cross-filtering and drill buttons take their place');
  // when the chosen visual is not the meaning's first choice, its drill note follows the chosen one
  if (best && best.native !== m.native && m.drill.length > 1) {
    const i = lost.findIndex((x) => /drill levels|drill-down/.test(x));
    const note = drillsIn(best.native) ? `the custom visual's own drill-down: Power BI's drill buttons on the native visual take its place, the ${m.drill.length} levels kept as a hierarchy` : `the ${m.drill.length} drill levels: the native visual shows them side by side, not as a drill-down`;
    if (i >= 0) lost[i] = note; else lost.push(note);
  }
  // what the custom visual showed and the native one can show too (opts.facts: the writer's formatFacts of its own flags)
  const f = o.facts || {}, format = {}, bc = best ? capsOf(best.native) || {} : {}, bobj = bc.objects || {};
  let expand = 0;
  if (best) {
    if (best.twoLevel) { const i = lost.findIndex((x) => /drill/.test(x)); const note = 'the drill-down from its first category to its second: the native donut shows both at once, the second as its details'; if (i >= 0) lost[i] = note; else lost.push(note); }
    if (CHARTS.includes(best.kind) && !['pie', 'donut'].includes(best.kind)) format.axisTitles = false; // the custom visuals have none; Power BI would add the fields' names
    if (f.valueLabels) { if (bobj.labels) format.valueLabels = true; else lost.push('its value labels: the native visual has none'); }
    if (f.categoryLabels) { if (bobj.categoryLabels && best.kind === 'scatter') format.categoryLabels = true; else lost.push('the labels under its marks (the category\'s names): the native visual has no such labels'); }
    if (f.trend) { if (bobj.trend) { format.trend = true; lost.push('its own regression line: the native trend line is switched on in its place (a straight line through the points; check it draws)'); } else lost.push('its regression line: the native visual has none'); }
    if (f.thresholds) lost.push('its threshold lines: add constant lines on the native visual by hand');
    if (best.kind === 'scatter' && f.legend !== true && (best.roles.Series || []).length) {
      best.roles = Object.assign({}, best.roles); delete best.roles.Series;
      lost.push('its colour split by a legend field: the original showed no legend, so the native scatter keeps one colour');
    }
    if (best.kind === 'map') format.stylePicker = false;
    // a timeline shows a finer date level than the top one: the native chart opens one level down (years with their quarters)
    const lv = m.drill.filter((x) => x.level);
    if (hintsOf(type).includes('time') && lv.length >= 2 && drillsIn(best.native)) {
      expand = 1;
      const nm = (x) => (/^[A-Za-z ]{1,20}$/.test(String(x.level)) ? String(x.level).toLowerCase() : 'the next level');
      lost.push(`the date level it chose by its zoom: the native chart is set to open at ${nm(lv[1])} within ${nm(lv[0])}; if it opens at ${nm(lv[0])}, use "Expand all down one level" (the forked arrow above the chart) to see ${nm(lv[1])}`);
    }
  }
  if (best) {
    // a picture that becomes another kind of visual says so first, in plain words (rc.2b: a map written as a table)
    const PIC = ['map', 'scatter', 'gauge', 'kpi', 'pie', 'donut', 'waterfall'];
    if (PIC.includes(m.kind) && best.kind !== m.kind) lost.unshift(`the ${LABEL[m.kind]} itself: no native ${LABEL[m.kind]} could take its fields, so it is written as a ${LABEL[best.kind] || best.native}`);
    // a sort by a field no role carries (a helper): kept through the tooltips, said
    const inRoles = (sf) => Object.values(best.roles).some((l) => l.some((x) => x.table === sf.table && x.name === sf.name));
    if ((visual.sort || []).some((x) => x && x.field && !inRoles(x.field))) lost.push(best.tooltips === false || !(bc.dataRoles || []).some((r) => r.name === 'Tooltips') ? 'its sort by a helper field: the native visual sorts by its own fields' : 'its sort by a helper field: kept by adding that field (its first value) to the tooltips, where it also shows');
  }
  const keeps = best ? Object.entries(best.roles).filter(([, l]) => l.length).map(([r, l]) => `${roleLabel(best.native, r)} (${n(l.length, 'field', 'fields')})`).join(', ') : '';
  const short = lost.map((x) => x.split(':')[0]).join('; ');
  const tell = best ? `This custom visual becomes a native ${LABEL[best.kind] || best.native}${best.native === 'multiRowCard' ? ' (multi-row card)' : ''}${guess ? ' (a guess from its fields\' kinds: the custom visual\'s own role definitions are not in the report)' : ''}. It keeps ${keeps}. It loses ${short}.`
    : m.kind === 'network' ? `No native Power BI visual draws this custom visual's network: an HTML/SVG measure in an image-capable visual can (you approve it in the plan), or a table of its links. It loses ${short}.`
    : `No native Power BI visual can show this custom visual's fields as they are: it can be kept as it is or left out. Nothing is decided without you.`;
  const extras = best ? Object.assign({ format, tooltips: !!(bc.dataRoles || []).some((r) => r.name === 'Tooltips') }, expand ? { expand } : {}, m.aggregate && best.native === m.native ? { aggregate: m.aggregate } : {}) : {};
  return Object.assign({}, m, best ? { kind: best.kind, native: best.native, roles: best.roles } : { native: null, aggregate: undefined }, extras, { custom: true, candidates: ranked, guess, lost, tell, htmlNeeded: m.kind === 'network' });
}

// read_report's record of one visual (step B): null for a Power BI visual; for a custom one { kind, native, why, tell,
// confidence, guess, htmlNeeded }, without the fields (read_report lists them in its own screened lines). report: the
// report.json (its declared custom visuals). opts: nativeFor's (the custom roles and objects, when the reading block has them).
export function meaningInReport(visual, report, opts) {
  const declared = VT.customTypesOf(report);
  if (!visual || !VT.isCustom(visual.type, null, declared)) return null;
  const r = nativeFor(visual, Object.assign({}, opts, { declared }));
  return { kind: r.kind, native: r.native, why: r.why, tell: r.tell, confidence: r.confidence, guess: r.guess, htmlNeeded: r.htmlNeeded };
}

// ---- step C: the plan's entries (plan_layout lists them; the owner approves each before anything is written) ----
// the model's data types, for typeOf: tables as read_model / model.bim gives them ([{ name, columns: [{ name, dataType }] }])
export function typeOfModel(tables) {
  const map = new Map();
  (Array.isArray(tables) ? tables : []).forEach((t) => (t && Array.isArray(t.columns) ? t.columns : []).forEach((c) => { if (c && c.name != null) map.set(`${t.name}[${c.name}]`, c.dataType); }));
  return (f) => (f ? map.get(`${f.table}[${f.name}]`) : undefined);
}
// a custom visual's type as the plan shows it: its id without the trailing code, plain letters and digits only
export const shortType = (t) => { const s = String(t || '').replace(/[0-9A-Fa-f]{32}$/, ''); return /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(s) ? s : 'a custom visual'; };
// inv: the reading block's inventory (read-report.mjs); opts: { typeOf } (typeOfModel of the report's model)
// One entry per custom visual: { page, pageName, visual (its id, for the writer), place, size, from, kind, native, label,
// roles { NativeRole: [queryRef] }, why, tell, lost, guess, confidence, htmlNeeded, candidates [{ native, fits }] }
// (0.3.0 J19, B-172) the native charts whose value roles put their measures on one axis
const AXIS_ROLES = { lineClusteredColumnComboChart: ['Y', 'Y2'], clusteredColumnChart: ['Y'], clusteredBarChart: ['Y'], lineChart: ['Y'], areaChart: ['Y'] };
// the measures a native chart would put on one value axis, and whether they may share it (axis-units.js decide: the same
// unit, scale and currency, and the person's confirmation, opts.axes { tables, confirmed }); when they may not, the panels:
// one native chart per group in the custom visual's box (a line chart over time, else the chart's own kind, a combo's
// columns), each with its group's values, the category and the tooltips. Never a combo with a second axis.
function axesFor(r, o, type) {
  const roles = AXIS_ROLES[r.native];
  if (!roles) return null;
  const vals = roles.flatMap((k) => r.roles[k] || []);
  if (vals.length < 2) return null;
  const fmt = o.formatOf || (() => undefined);
  const ms = vals.map((f) => Object.assign(f.kind === 'measure' ? { t: f.table, m: f.name } : { t: f.table, c: f.name, agg: f.agg === 'Count' || f.agg === 'DistinctCount' ? 2 : undefined }, { formatString: fmt(f) }));
  const d = AX.decide(ms, o.axes || {});
  if (d.share) return r.native === 'lineClusteredColumnComboChart' ? { share: true, why: d.why } : null;
  const cat = r.roles.Category || [], time = !!r.drill && r.drill.some((f) => f.level) || cat.some((f) => /^date/i.test(String((o.typeOf && o.typeOf(f)) || '')));
  // (a combo's panels: lines over time, else the custom visual's own bars where its id says bars, else columns)
  const bars = hintsOf(type).includes('bar'), one = r.native === 'lineClusteredColumnComboChart' ? (time ? 'lineChart' : bars ? 'clusteredBarChart' : 'clusteredColumnChart') : r.native;
  const refs = (l) => l.map((f) => f.queryRef).filter(Boolean);
  const panels = d.groups.map((g) => ({ native: one, roles: Object.assign({ Category: refs(cat), Y: refs(g.map((i) => vals[i])) }, (r.roles.Tooltips || []).length ? { Tooltips: refs(r.roles.Tooltips) } : {}),
    unit: d.labels[g[0]] && d.labels[g[0]].en }));
  return { share: false, why: d.why, ask: d.ask, panels, bars: one === 'clusteredBarChart' };
}
export function replacementsOf(inv, opts) {
  const o = opts || {}, out = [];
  ((inv && inv.pages) || []).forEach((p) => (p.visuals || []).forEach((x) => {
    if (!x.meaning) return; // the reading block gives a meaning to custom visuals only
    const r = nativeFor(x, Object.assign({}, o, { declared: new Set([x.type]) }, o.factsOf && x.json ? { facts: o.factsOf(x.json) } : {}));
    const ax = r.native ? axesFor(r, o, x.type) : null, panels = ax && ax.panels ? ax.panels : null, kindOf = (t) => Object.keys(NATIVE).find((k) => NATIVE[k] === t) || r.kind;
    out.push({ page: p.n, pageName: p.name, visual: x.id, place: `${x.x},${x.y}`, size: `${x.w}x${x.h}`, from: shortType(x.type), kind: panels ? kindOf(panels[0].native) : r.kind, native: panels ? panels[0].native : r.native,
      label: r.native ? LABEL[panels ? kindOf(panels[0].native) : r.kind] || r.native : null,
      ...(ax ? { axes: Object.assign({ share: ax.share, why: ax.why }, panels ? { panels: panels.length } : {}) } : {}), ...(panels ? { panels } : {}), ...(ax && ax.ask && ax.ask.length ? { ask: ax.ask } : {}),
      roles: r.native ? Object.fromEntries(Object.entries(r.roles).map(([k, l]) => [k, l.map((f) => f.queryRef).filter(Boolean)])) : {},
      format: r.format || {}, tooltips: !!r.tooltips, ...(r.expand ? { expand: r.expand } : {}), ...(r.aggregate ? { aggregate: r.aggregate } : {}),
      why: r.why, tell: panels ? r.tell.replace(/^This custom visual becomes a native [^.(]+/, `This custom visual becomes ${panels.length} separate native ${LABEL[kindOf(panels[0].native)] || panels[0].native}s in its box, one axis each (${ax.why.en})`) : r.tell,
      lost: ax && ax.bars ? r.lost.filter((l) => !/horizontal bars/.test(l)) : r.lost, guess: r.guess, confidence: r.confidence, htmlNeeded: r.htmlNeeded, candidates: (r.candidates || []).map((c) => ({ native: c.native, fits: c.fits })) });
  }));
  return out;
}
// the plan's line: "custom visual X on page N at x,y -> native Y (visualType): why"; no field or report name in it
export function replacementLine(e) {
  const why = String(e.why || '').replace(/^a custom visual: /, '');
  // (0.3.0 J19) values that may not share one axis: separate native visuals in the box, the reason said
  if (e.panels) return `custom visual ${e.from} on page ${e.page} at ${e.place} -> ${e.panels.length} separate ${e.label}s (${e.native}) in its box, one axis each${e.guess ? ' [a guess]' : ''}: ${why}; ${e.axes.why.en}`;
  return `custom visual ${e.from} on page ${e.page} at ${e.place} -> ` + (e.native ? `${e.label} (${e.native})${e.guess ? ' [a guess]' : ''}: ${why}` : `no native visual: an HTML/SVG measure in an image-capable visual (step D), or a table of its links: ${why}`);
}
export { VT };
