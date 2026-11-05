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
// 2. The role names, matched word by word against ROLE_WORDS (visual-vocabulary.mjs): a custom visual names its roles
//    in its own capabilities, so these are words, not a vendor's list. The table is the one place to adjust once real
//    role names are read.
// 3. A weak hint: words in the visual's id (FAMILY_HINTS, a short table). It only chooses among the kinds the fields can
//    show (a "pie" word picks a pie for one measure by a category) and is set aside, and said so, when they can't.
// Names in the report are untrusted: `why` and `lost` are written from role classes and counts only, never from a role,
// table, column or measure name. The fields in `roles` are the report's own (the writer needs them); a caller that
// shows them screens them as read_report does.
//
// The parts (0.3.2 SP18, SP37): this file keeps the interpretation (rolesOf, meaningOf) and the orchestration: nativeFor
// (meaningOf -> rankCandidates -> disclose), replacementsOf (one plan entry per custom visual, with axesFor's panels),
// meaningInReport, and the model's typeOfModel and categoryOfModel. The role words and hints: visual-vocabulary.mjs; the
// capability validation: visual-capabilities.mjs; the candidates, their ranking and the choice's confidence (the meaning
// passed whole, its confidence and evidence with it): visual-candidates.mjs; what the plan says about the choice:
// replacement-disclosure.mjs. Every name exported here before is still exported here.

import { createRequire } from 'node:module';
// (0.3.2 SP18) the role words and the family hints: their own module; the names exported here before are re-exported
import { ROLE_WORDS, TO_WORDS, FAMILY_HINTS, OBJECT_HINTS, wordsOf, classOf, classesOf, hintsOf, objectHintOf } from './visual-vocabulary.mjs';
export { ROLE_WORDS, FAMILY_HINTS, OBJECT_HINTS, wordsOf };
// (0.3.2 SP37) the capability validation (Microsoft's capabilities and validator): its own module; fitsCapabilities re-exported
import { isValue, isCol, copy, drillsIn, fitsCapabilities } from './visual-capabilities.mjs';
export { fitsCapabilities };
// (0.3.2 SP37) the candidates and their ranking: their own module; NATIVE and FORMS re-exported
import { NATIVE, FORMS, rankCandidates } from './visual-candidates.mjs';
export { NATIVE, FORMS };
// (0.3.2 SP37) what the plan says about a replacement (its losses, settings, sentences and line): its own module; the
// names exported here before are re-exported
import { LABEL, aOr, nOf as n, disclose, ownSettingsSaid, CONFIDENCE_LEVELS, AZURE_NEEDS, shortType, replacementLine } from './replacement-disclosure.mjs';
export { ownSettingsSaid, CONFIDENCE_LEVELS, AZURE_NEEDS, shortType, replacementLine };

// one test of custom versus native for every block (assets/js/visual-types.js, Microsoft's catalog)
const VT = createRequire(import.meta.url)('../../assets/js/visual-types.js');
// (0.3.0 J19, B-172) which measures may share one value axis: the one rule, shared with the gallery's combo
const AX = createRequire(import.meta.url)('../../assets/js/axis-units.js');
// (0.3.2 DD1B) a literal's text, number and true or false: assets/js/pbir-values.js, their one home; handed on to
// report-inventory.mjs as VT is (its imports stay ./read-report.mjs, ./visual-meaning.mjs and node:path: sp42 P4)
const PV = createRequire(import.meta.url)('../../assets/js/pbir-values.js');
// (0.3.2 DD2T) a text box's paragraphs: one text each, assets/js/text-runs.js, their one home; handed on to
// report-inventory.mjs as PV is (sp42 P4)
const TR = createRequire(import.meta.url)('../../assets/js/text-runs.js');
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
  let shape, roles, drill = [], series = null, why, kind, aggregate = null, targets = [], idFit = null;
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
    targets = goal.map(copy);
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
      if (hint !== objHint) idFit = kind;
      if (kind === 'combo' && idHints.includes('bar')) lost.push('its horizontal bars: Power BI\'s line and column combo is vertical, so the bars become columns');
      why += `; the ${hint === objHint ? 'format objects' : 'id\'s words'} hint at ${aOr(hint === 'time' ? 'timeline' : hint)}, which the fields can show`;
    } else {
      conf = down(conf);
      why += `; the id's words hint at ${aOr(hint === 'time' ? 'timeline' : hint)}, set aside: the fields can't be shown as one`;
    }
  }
  if (kind === 'network') lost.push('no native visual draws a network: an HTML/SVG measure in an image-capable visual is needed (the owner approves it in the plan)');
  if (drill.length > 1) {
    if (drillsIn(NATIVE[kind])) lost.push(`the custom visual's own drill-down (its animation and click behaviour): Power BI's drill buttons on the native visual take its place, the ${drill.length} levels kept as a hierarchy`);
    else lost.push(`the ${drill.length} drill levels: the native visual shows them side by side, not as a drill-down`);
  }
  lost.push('the custom visual\'s own look (colours, labels, animation) is not carried over: the report\'s theme gives the native one its look');
  // (0.3.1 NC2) the evidence nativeFor weighs: idFit, the kind the id's words named and the fields could show (the
  // meaning's kind); named, every role's words known; targets, the values in a target role
  return out(kind, roles, Object.assign({ drill, series, confidence: conf, why: `${custom}: ${why}`, lost, htmlNeeded: kind === 'network', idFit: idFit === kind ? kind : null, named, targets }, aggregate ? { aggregate } : {}));
}

// The design decision for one visual (audit 5, A5-14): which native visual takes a custom visual's place, ranked.
// visual: as meaningOf takes it; opts: meaningOf's, plus customObjects: the names of its formatting objects; (NC2)
// calendarOf(date field) -> { year, month, weekday } columns of the date's own table (the heatmap's matrix), second: true
// to write the second option.
// Returns meaningOf's answer, and: candidates [{ kind, native, roles, fits, problems }] (the fitting ones first),
// the chosen one (kind, native, roles; native null when none fits or the kind needs HTML), guess (true when the custom
// visual's own role definitions were not given: matched by field kinds only), lost, tell: the sentence for the user,
// (NC2) confidence and evidence from what was read, and second: { kind, native, roles, lost, format, add } when a
// closer native was put first (or, with opts.second, the closer one offered back).
export function nativeFor(visual, opts) {
  const o = opts || {}, m = meaningOf(visual, o);
  const custom = VT.isCustom(String((visual && visual.type) || ''), null, o.declared);
  if (!custom) return Object.assign({}, m, { custom: false, candidates: [], guess: false, tell: 'a Power BI visual: kept as it is' });
  return disclose(m, visual, o, rankCandidates(m, visual, o));
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
// (0.3.1 NC3) the model's data category of a column ('' when it has none; undefined when the column is not known)
export function categoryOfModel(tables) {
  const map = new Map();
  (Array.isArray(tables) ? tables : []).forEach((t) => (t && Array.isArray(t.columns) ? t.columns : []).forEach((c) => { if (c && c.name != null) map.set(`${t.name}[${c.name}]`, String(c.dataCategory || '')); }));
  return (f) => (f ? map.get(`${f.table}[${f.name}]`) : undefined);
}
export function typeOfModel(tables) {
  const map = new Map();
  (Array.isArray(tables) ? tables : []).forEach((t) => (t && Array.isArray(t.columns) ? t.columns : []).forEach((c) => { if (c && c.name != null) map.set(`${t.name}[${c.name}]`, c.dataType); }));
  return (f) => (f ? map.get(`${f.table}[${f.name}]`) : undefined);
}
// inv: the reading block's inventory (read-report.mjs); opts: { typeOf } (typeOfModel of the report's model), langOf
// (an inventory page -> 'ar' or 'en', the panels' units; English without it)
// One entry per custom visual: { page, pageName, visual (its id, for the writer), place, size, from, kind, native, label,
// roles { NativeRole: [queryRef] }, why, tell, lost, guess, confidence, htmlNeeded, candidates [{ native, fits }] }
// (0.3.0 J19, B-172) the native charts whose value roles put their measures on one axis
const AXIS_ROLES = { lineClusteredColumnComboChart: ['Y', 'Y2'], clusteredColumnChart: ['Y'], clusteredBarChart: ['Y'], lineChart: ['Y'], areaChart: ['Y'] };
// the measures a native chart would put on one value axis, and whether they may share it (axis-units.js decide: the same
// unit, scale and currency, and the person's confirmation, opts.axes { tables, confirmed }); when they may not, the panels:
// one native chart per group in the custom visual's box (a line chart over time, else the chart's own kind, a combo's
// columns), each with its group's values, the category and the tooltips. Never a combo with a second axis.
// (0.3.1 SQ2, J19-S1 and S5) lang: the page's ('ar' or 'en'): each panel's unit in it (axis-units' label, Latin runs
// isolated in Arabic), and titleTag, what its title adds: the unit, with its place ("1/2") when the units are the same
const FSI = '\u2068', PDI = '\u2069';
function axesFor(r, o, type, lang) {
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
  // (NC2) or the bars the meaning read (a bullet's combo split: its own bars)
  const bars = hintsOf(type).includes('bar') || (r.native === 'lineClusteredColumnComboChart' && r.drewBars), one = r.native === 'lineClusteredColumnComboChart' ? (time ? 'lineChart' : bars ? 'clusteredBarChart' : 'clusteredColumnChart') : r.native;
  const refs = (l) => l.map((f) => f.queryRef).filter(Boolean);
  const ar = lang === 'ar', units = d.groups.map((g) => (d.labels[g[0]] && d.labels[g[0]][ar ? 'ar' : 'en']) || null);
  const alike = units.some((u, i) => !u || units.indexOf(u) !== i), placeOf = (i) => (ar ? FSI : '') + `${i + 1}/${units.length}` + (ar ? PDI : '');
  const panels = d.groups.map((g, i) => ({ native: one, roles: Object.assign({ Category: refs(cat), Y: refs(g.map((x) => vals[x])) }, (r.roles.Tooltips || []).length ? { Tooltips: refs(r.roles.Tooltips) } : {}),
    unit: units[i], titleTag: alike ? [units[i], placeOf(i)].filter(Boolean).join(' · ') : units[i] }));
  return { share: false, why: d.why, ask: d.ask, panels, bars: one === 'clusteredBarChart' };
}
// (NC2) opts.second: the keys ("page:x,y") of the replacements to write as their second option (customVisualsSecond);
// opts.calendarOf: the date's own table's year, month and weekday columns (the calendar heatmap's matrix)
export const pickOf = (p, x) => `${p.n}:${x.x},${x.y}`;
export function replacementsOf(inv, opts) {
  const o = opts || {}, out = [], second = new Set(o.second || []);
  ((inv && inv.pages) || []).forEach((p) => (p.visuals || []).forEach((x) => {
    if (!x.meaning) return; // the reading block gives a meaning to custom visuals only
    const pick = pickOf(p, x);
    const r0 = nativeFor(x, Object.assign({}, o, { declared: new Set([x.type]), second: second.has(pick) }, o.factsOf && x.json ? { facts: o.factsOf(x.json) } : {}));
    const r = Object.assign(r0, { drewBars: r0.native === 'lineClusteredColumnComboChart' && !!r0.second && r0.second.kind === 'bar' });
    const ax = r.native ? axesFor(r, o, x.type, o.langOf ? o.langOf(p) : 'en') : null, panels = ax && ax.panels ? ax.panels : null, kindOf = (t) => Object.keys(NATIVE).find((k) => NATIVE[k] === t) || r.kind;
    out.push({ page: p.n, pageName: p.name, visual: x.id, place: `${x.x},${x.y}`, size: `${x.w}x${x.h}`, from: shortType(x.type), kind: panels ? kindOf(panels[0].native) : r.kind, native: panels ? panels[0].native : r.native,
      label: r.native ? LABEL[panels ? kindOf(panels[0].native) : r.kind] || r.native : null,
      ...(ax ? { axes: Object.assign({ share: ax.share, why: ax.why }, panels ? { panels: panels.length } : {}) } : {}), ...(panels ? { panels } : {}), ...(ax && ax.ask && ax.ask.length ? { ask: ax.ask } : {}),
      roles: r.native ? Object.fromEntries(Object.entries(r.roles).map(([k, l]) => [k, l.map((f) => f.queryRef).filter(Boolean)])) : {},
      format: r.format || {}, tooltips: !!r.tooltips, ...(r.needs ? { needs: r.needs } : {}), ...(r.expand ? { expand: r.expand } : {}), ...(r.aggregate ? { aggregate: r.aggregate } : {}),
      ...(r.added && r.native ? { add: Object.fromEntries(r.added.map((f) => [f.queryRef, { table: f.table, column: f.name }])) } : {}),
      why: r.why, tell: panels ? r.tell.replace(/^This custom visual becomes a native [^.(]+/, `This custom visual becomes ${panels.length} separate native ${LABEL[kindOf(panels[0].native)] || panels[0].native}s in its box, one axis each (${ax.why.en})`) : r.tell,
      lost: ax && ax.bars ? r.lost.filter((l) => !/horizontal bars/.test(l)) : r.lost, guess: r.guess, confidence: r.confidence, evidence: r.evidence, htmlNeeded: r.htmlNeeded, candidates: (r.candidates || []).map((c) => ({ native: c.native, fits: c.fits })),
      ...(r.second ? { second: Object.assign({ pick, native: r.second.native, label: r.second.label, chosen: r.secondChosen, lost: r.second.lost }, r.second.needs ? { needs: r.second.needs } : {}) } : {}) });
  }));
  return out;
}
export { VT, PV, TR };
