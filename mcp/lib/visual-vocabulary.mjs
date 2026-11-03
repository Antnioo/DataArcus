// LAYER reading (0.3.2 SP18, split from visual-meaning.mjs): the vocabulary that reads a custom visual's role names and
// its id. The role words (ROLE_WORDS, TO_WORDS), the weak hints of the id's words (FAMILY_HINTS) and of its format
// objects (OBJECT_HINTS), and the pure helpers that read only these tables. Pure: no I/O, no import; the tables' order is
// part of their meaning (a role takes the first class one of its words belongs to; the first hint that matches counts).
// Whether a hint is used at all (only when the fields can show that kind) is decided in visual-meaning.mjs, which
// imports these and re-exports the names it exported before. Names read here are untrusted: the helpers return table
// keys and words, never act on them.

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
export const TO_WORDS = new Set(['target', 'targets', 'to', 'child', 'children', 'destination', 'end']);

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

// the custom visual's own format objects can name its form (weak, as the id's words): a pie drawn with a hole
export const OBJECT_HINTS = { donut: ['donut', 'doughnut'] };

// a name split into lower-case words: "ColumnValues" -> column, values; "Y2" -> y2; "Trend Axis" -> trend, axis
export const wordsOf = (s) => String(s || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  .flatMap((w) => { const m = /^([a-z]+)\d+$/.exec(w); return m ? [w, m[1]] : [w]; }); // "Values1" -> values1, values (a vendor numbers its value roles)
export const classOf = (role, display) => { const w = wordsOf(role).concat(display ? wordsOf(display) : []); for (const [cls, list] of Object.entries(ROLE_WORDS)) { const hit = w.find((x) => list.includes(x)); if (hit) return { cls, word: hit }; } return { cls: 'other', word: null }; };
// every class a role's words belong to (a vendor joins two: "sourceNodes", "kpiValue", "StartDate"), with the words
export const classesOf = (role, display) => { const w = wordsOf(role).concat(display ? wordsOf(display) : []); return { words: w, set: new Set(Object.entries(ROLE_WORDS).filter(([, list]) => w.some((x) => list.includes(x))).map(([c]) => c)) }; };

// a custom visual's id words for the hint (the trailing code of 32 letters and digits left out)
export function hintsOf(type) {
  const w = wordsOf(String(type || '').replace(/[0-9A-Fa-f]{32}$/, ''));
  return Object.entries(FAMILY_HINTS).filter(([, list]) => w.some((x) => list.includes(x))).map(([kind]) => kind);
}
// the format objects' hint (OBJECT_HINTS): names only, never their values
export const objectHintOf = (objects) => { const w = (Array.isArray(objects) ? objects : []).flatMap((x) => wordsOf(x)); const e = Object.entries(OBJECT_HINTS).find(([, list]) => w.some((x) => list.includes(x))); return e ? e[0] : null; };
