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

// ---- the role words (lower-case words; a role name is split at case changes, digits and other characters) ----
// Order matters: a role takes the first class one of its words belongs to (ColumnValues: bar before value).
export const ROLE_WORDS = {
  tooltip: ['tooltip', 'tooltips'],
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
  column: ['column'],
  bar: ['bar']
};

// ---- the native visual of each kind (Power BI's visualType; null: no native visual shows it) ----
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
export const wordsOf = (s) => String(s || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const classOf = (role, display) => { const w = wordsOf(role).concat(display ? wordsOf(display) : []); for (const [cls, list] of Object.entries(ROLE_WORDS)) { const hit = w.find((x) => list.includes(x)); if (hit) return { cls, word: hit }; } return { cls: 'other', word: null }; };
const isValue = (f) => f.kind === 'measure' || f.kind === 'aggregation';
const isCol = (f) => f.kind === 'column';
const copy = (f) => Object.assign({}, f);

// a custom visual's id words for the hint (the trailing code of 32 letters and digits left out)
function hintOf(type) {
  const w = wordsOf(String(type || '').replace(/[0-9A-Fa-f]{32}$/, ''));
  for (const [kind, list] of Object.entries(FAMILY_HINTS)) if (w.some((x) => list.includes(x))) return kind;
  return null;
}

// each role: its effective class from its words and its fields' shapes
// customRoles: the custom visual's own dataRoles when the report has its package ([{ name, displayName, kind }]): a role
// whose name says nothing ("measureRole7") is read by its display name ("Values")
function rolesOf(v, customRoles) {
  const disp = Object.fromEntries((Array.isArray(customRoles) ? customRoles : []).filter((r) => r && r.name).map((r) => [String(r.name), String(r.displayName || '')]));
  return Object.entries(v.fields || {}).map(([role, list]) => {
    const fields = (list || []).filter((f) => f && (isValue(f) || isCol(f)));
    const { cls, word } = classOf(role, disp[role]), cols = fields.filter(isCol), vals = fields.filter(isValue);
    const shape = !fields.length ? 'none' : !vals.length ? 'columns' : !cols.length ? 'values' : 'mixed';
    let eff = cls;
    if (shape === 'mixed') eff = cls === 'tooltip' ? 'tooltip' : 'mixed';
    else if (shape === 'columns') eff = { node: 'node', from: 'from', goal: TO_WORDS.has(word) ? 'to' : 'anonCol', bar: 'mcolumns', x: 'category', y: 'category', rows: 'rows', time: 'time', category: 'category', series: 'series', breakdown: 'breakdown', location: 'location', latitude: 'latitude', longitude: 'longitude', tooltip: 'tooltip' }[cls] || 'anonCol';
    else if (shape === 'values') eff = { goal: 'goal', min: 'min', max: 'max', indicator: 'indicator', line: 'line', bar: 'bar', x: 'x', y: 'y', size: 'size', tooltip: 'tooltip', value: 'value', category: 'value', series: 'value', time: 'value', node: 'size', from: 'size', location: 'size', latitude: 'latitude', longitude: 'longitude' }[cls] || 'anonVal';
    return { role, cls, eff, named: cls !== 'other', fields, cols, vals };
  }).filter((r) => r.fields.length);
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
  const temporal = (f) => isCol(f) && ((f.level && DATE_LEVELS.has(String(f.level).toLowerCase())) || DATE_TYPES.test(String(typeOf(f) || '')));
  const out = (kind, roles, extra) => Object.assign({ kind, native: NATIVE[kind], drill: [], series: null, confidence: 'low', why: '', htmlNeeded: kind === 'network', roles, lost: [] }, extra);

  // a Power BI visual: its own kind, kept as it is
  if (type === 'group') return out('unknown', {}, { native: null, why: 'a group of visuals: nothing to replace' });
  if (!VT.isCustom(type, null, o.declared)) {
    const kind = Object.prototype.hasOwnProperty.call(BUILTIN_KIND, type) ? BUILTIN_KIND[type] : 'unknown', roles = Object.fromEntries(Object.entries(visual.fields || {}).map(([r, l]) => [r, (l || []).filter((f) => f && (isValue(f) || isCol(f))).map(copy)]).filter(([, l]) => l.length));
    const cat = roles.Category || roles.Rows || [];
    return out(kind, roles, { native: type, drill: cat.length > 1 ? cat.map(copy) : [], series: roles.Series ? roles.Series.map(copy) : null, confidence: 'high', why: 'a Power BI visual: kept as it is' });
  }

  const R = rolesOf(visual || {}, o.customRoles), hint = hintOf(type);
  const live = R.filter((r) => r.eff !== 'tooltip'), tips = R.filter((r) => r.eff === 'tooltip').flatMap((r) => r.fields.map(copy));
  const named = live.length > 0 && live.every((r) => r.named);
  const by = (...effs) => live.filter((r) => effs.includes(r.eff));
  const cols = (...effs) => by(...effs).flatMap((r) => r.cols.map(copy));
  const vals = (...effs) => by(...effs).flatMap((r) => r.vals.map(copy));
  const withTips = (roles) => (tips.length ? Object.assign(roles, { Tooltips: tips }) : roles);
  const lost = [];
  const custom = 'a custom visual';
  if (!live.length) return out('unknown', {}, { why: `${custom} with no fields in its roles: nothing tells what it shows` });

  // the shape: which family of kinds the fields can show
  let shape, roles, drill = [], series = null, why, kind;
  const valueRoles = by('value', 'indicator', 'bar', 'anonVal', 'y', 'size', 'line', 'goal', 'min', 'max', 'x');
  const catRoles = by('category', 'time', 'x', 'y').filter((r) => r.cols.length).concat(by('anonCol'));
  if (by('node').length || (by('from').length && (by('to').length || by('node').length))) {
    shape = 'network';
    roles = { Source: cols('from', 'node'), Target: cols('to'), Weight: vals('size', 'value', 'anonVal') };
    why = 'its roles join two columns (a start and an end, or nodes and their links): a network, which no native visual draws';
  } else if (by('location', 'latitude', 'longitude').length) {
    shape = 'map';
    roles = withTips({ Category: cols('location') });
    if (by('latitude').length) roles.Y = by('latitude').flatMap((r) => r.fields.map(copy)).slice(0, 1);
    if (by('longitude').length) roles.X = by('longitude').flatMap((r) => r.fields.map(copy)).slice(0, 1);
    const size = vals('size', 'value', 'anonVal').slice(0, 1); if (size.length) roles.Size = size;
    if (by('series').length) roles.Series = cols('series');
    why = `${roles.Category.length ? 'a location' : 'a latitude and a longitude'}${size.length ? ' and a value' : ''}: a map`;
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
      const lines = vals('line'), bars = vals('bar'), main = vals('value', 'indicator', 'anonVal', 'y', 'size', 'goal', 'min', 'max');
      roles = withTips({ Category: cat });
      drill = cat.length > 1 ? cat.map(copy) : [];
      if (lines.length && (bars.length || main.length)) {
        kind = 'combo'; roles.Y = bars.concat(main); roles.Y2 = lines;
        why = `a category, column values and line values: a combo`;
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
  if (!kind) kind = { network: 'network', map: 'map', scatter: 'scatter', matrix: 'matrix', table: 'table', gauge: 'gauge', card: 'card', slicer: 'slicer', kpi: 'kpi' }[shape];
  if (hint) {
    const nY = (roles.Y || []).length, single = shape === 'chart' && nY === 1 && !roles.Y2 && !roles.Breakdown;
    const fits = { pie: single, donut: single, waterfall: shape === 'chart' && nY === 1 && !roles.Y2, combo: shape === 'chart' && (nY + (roles.Y2 || []).length) >= 2,
      time: shape === 'chart', line: shape === 'chart' && !roles.Y2, area: shape === 'chart' && !roles.Y2, column: shape === 'chart' && !roles.Y2, bar: shape === 'chart' && !roles.Y2,
      network: shape === 'network', map: shape === 'map', scatter: shape === 'scatter', matrix: shape === 'matrix', table: shape === 'table', slicer: shape === 'slicer', card: shape === 'card',
      gauge: shape === 'gauge', kpi: shape === 'kpi' || shape === 'gauge' }[hint];
    const want = hint === 'time' ? (timeAxis ? 'line' : 'column') : hint === 'kpi' && shape === 'gauge' ? 'gauge' : hint;
    if (fits) {
      if (hint === 'combo' && !roles.Y2) {
        // one role of several values: the first draws as columns, the rest as lines (the custom visual's own format
        // decides which are lines; it is not in its roles)
        roles.Y2 = roles.Y.slice(1); roles.Y = roles.Y.slice(0, 1);
        if (roles.Series) { delete roles.Series; series = null; }
        lost.push('which values draw as lines was set in the custom visual\'s format, not its roles: here the first value is the columns and the rest are lines; check it');
        conf = named ? 'medium' : 'low';
      } else conf = up(conf);
      kind = want;
      why += `; the id's words hint at a ${hint === 'time' ? 'timeline' : hint}, which the fields can show`;
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
  return out(kind, roles, { drill, series, confidence: conf, why: `${custom}: ${why}`, lost, htmlNeeded: kind === 'network' });
}

// ---- Microsoft's capabilities of the native visuals (@microsoft/powerbi-core-visual-schema 0.1.1) ----
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
  const keeps = best ? Object.entries(best.roles).filter(([, l]) => l.length).map(([r, l]) => `${roleLabel(best.native, r)} (${n(l.length, 'field', 'fields')})`).join(', ') : '';
  const short = lost.map((x) => x.split(':')[0]).join('; ');
  const tell = best ? `This custom visual becomes a native ${LABEL[best.kind] || best.native}${best.native === 'multiRowCard' ? ' (multi-row card)' : ''}${guess ? ' (a guess from its fields\' kinds: the custom visual\'s own role definitions are not in the report)' : ''}. It keeps ${keeps}. It loses ${short}.`
    : m.kind === 'network' ? `No native Power BI visual draws this custom visual's network: an HTML/SVG measure in an image-capable visual can (you approve it in the plan), or a table of its links. It loses ${short}.`
    : `No native Power BI visual can show this custom visual's fields as they are: it can be kept as it is or left out. Nothing is decided without you.`;
  return Object.assign({}, m, best ? { kind: best.kind, native: best.native, roles: best.roles } : { native: null }, { custom: true, candidates: ranked, guess, lost, tell, htmlNeeded: m.kind === 'network' });
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
