// RD2 scratch (research only, not a product file): the number check's layer 1, "same question", from the files.
// compare(beforePath, afterPath) -> { visuals, matched, sameQuestion, differ: [...], orderOnly, displayOnly, noQuery,
// notMatched, pageContext, reportContext }. Reads through the reading block (locate, diskSource, inventory), so the
// same limits and link checks as check_report. Never returns a value: a filter, a slicer selection, a visual
// calculation's expression or a report measure's expression is compared by its SHA-256 hash and said by its kind, its
// field and its count of literals only.
import crypto from 'node:crypto';
import { locate, diskSource, inventory, safeName } from '../../lib/read-report.mjs';

const H = (x) => crypto.createHash('sha256').update(JSON.stringify(x === undefined ? null : x)).digest('hex');
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);
// Power BI's QueryAggregateFunction (semanticQuery): 0 Sum, 1 Avg, 2 Count, 3 Min, 4 Max, 5 CountNonNull, 6 Median,
// 7 StandardDeviation, 8 Variance
const AGG = ['Sum', 'Avg', 'Count', 'Min', 'Max', 'CountNonNull', 'Median', 'StdDev', 'Variance'];
const srcOf = (e) => (isObj(e) && isObj(e.SourceRef) ? e.SourceRef.Entity || e.SourceRef.Source || '?' : '?');
// a field as a key: metadata only (table, column or measure, aggregation, hierarchy level); a visual calculation by
// its hash (its expression can hold literals)
export function fieldKey(f) {
  if (!isObj(f)) return 'other:' + H(f).slice(0, 12);
  if (f.Column) return `col ${srcOf(f.Column.Expression)}[${f.Column.Property}]`;
  if (f.Measure) return `measure ${srcOf(f.Measure.Expression)}[${f.Measure.Property}]`;
  if (f.Aggregation) return `${AGG[f.Aggregation.Function] || 'agg' + f.Aggregation.Function}(${fieldKey(f.Aggregation.Expression).replace(/^col /, '')})`;
  if (f.HierarchyLevel) { const h = f.HierarchyLevel.Expression && f.HierarchyLevel.Expression.Hierarchy; return `level ${h ? srcOf(h.Expression) + '[' + h.Hierarchy + ']' : '?'}.${f.HierarchyLevel.Level}`; }
  if (f.NativeVisualCalculation) return `visualCalc #${H(f.NativeVisualCalculation.Expression).slice(0, 12)}`;
  return 'other:' + H(f).slice(0, 12);
}
const literals = (x) => { let n = 0; const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (isObj(o)) Object.entries(o).forEach(([k, v]) => { if (k === 'Literal') n++; else walk(v); }); }; walk(x); return n; };
// a filter: its field (metadata), its type, Top N or not; its condition by hash and its count of literals
const hasTop = (x) => JSON.stringify(x || null).includes('"Top"');
function filterOf(f) {
  const field = f.field ? fieldKey(f.field) : 'expression', type = String(f.type || (hasTop(f.filter) ? 'TopN' : 'Advanced'));
  return { key: field + ' ' + type, field, type, topN: type === 'TopN' || hasTop(f.filter), hash: H({ field: f.field, filter: f.filter, type: f.type }), literals: literals(f.filter) };
}
const filtersOf = (fc) => arr(isObj(fc) ? fc.filters : null).filter(isObj).map(filterOf);
// display units: Power BI's labelDisplayUnits / displayUnits literals (0D auto, 1D none, 1000D K, ...)
const UNITS = { '0D': 'auto', '1D': 'none', '1000D': 'K', '1000000D': 'M', '1000000000D': 'bn', '1000000000000D': 'T' };
const DISPLAY = /^(labelDisplayUnits|displayUnits|valueDisplayUnits|labelPrecision|precision|valueDecimalPlaces|decimalPlaces)$/;
function displayOf(objects) {
  const out = {};
  Object.entries(isObj(objects) ? objects : {}).forEach(([obj, list]) => arr(list).forEach((e) => {
    if (!isObj(e) || !isObj(e.properties)) return;
    const sel = e.selector ? H(e.selector).slice(0, 8) : '';
    Object.entries(e.properties).forEach(([p, v]) => { if (!DISPLAY.test(p)) return; const lit = isObj(v) && isObj(v.expr) && isObj(v.expr.Literal) ? String(v.expr.Literal.Value) : 'expr#' + H(v).slice(0, 8); out[`${obj}${sel ? '[' + sel + ']' : ''}.${p}`] = /units/i.test(p) ? (UNITS[lit] || lit) : lit.replace(/L$|D$/, ''); });
  }));
  return out;
}
// the question a visual asks the model, from its visual.json; null for a visual with no query
export function questionOf(j) {
  const v = isObj(j) && isObj(j.visual) ? j.visual : null;
  if (!v) return null;
  const qs = isObj(v.query) && isObj(v.query.queryState) ? v.query.queryState : {};
  const roles = {};
  Object.entries(qs).forEach(([role, r]) => { const l = arr(r && r.projections).filter(isObj).map((p) => fieldKey(p.field)); if (l.length) roles[role] = l; });
  const sort = arr(isObj(v.query) && isObj(v.query.sortDefinition) ? v.query.sortDefinition.sort : null).filter(isObj).map((s) => ({ field: fieldKey(s.field), dir: /desc/i.test(String(s.direction || '')) ? 'desc' : 'asc' }));
  const slicerSel = arr(isObj(v.objects) ? v.objects.general : null).filter((e) => isObj(e) && isObj(e.properties) && e.properties.filter).map((e) => ({ hash: H(e.properties.filter), literals: literals(e.properties.filter) }));
  if (!Object.keys(roles).length && !slicerSel.length) return null;
  return { type: String(v.visualType || ''), roles, sort, filters: filtersOf(j.filterConfig), display: displayOf(v.objects), slicerSel, interactions: null };
}

function read(p) {
  const loc = locate(p, 'check_report');
  const inv = inventory(diskSource(loc, { big: [], deep: 0 }), 'r');
  const ext = (() => { try { return diskSource(loc, { big: [], deep: 0 }).json('definition/reportExtensions.json'); } catch (e) { return null; } })();
  const reportJson = (() => { try { return diskSource(loc, { big: [], deep: 0 }).json('definition/report.json'); } catch (e) { return {}; } })();
  const measures = {};
  arr(isObj(ext) ? ext.entities : null).forEach((en) => arr(en && en.measures).forEach((m) => { measures[`measure ${en.name}[${m.name}]`] = H({ e: m.expression, f: m.formatString, d: m.dataType }); }));
  const pages = new Map();
  inv.pages.forEach((pg) => {
    const raw = pg.raw || {}, vis = new Map();
    pg.visuals.forEach((x) => { if (x.json && x.json.name != null) vis.set(String(x.json.name), x.json); });
    pages.set(pg.id, { id: pg.id, kind: pg.kind, filters: filtersOf(raw.filterConfig), interactions: H(raw.visualInteractions || null), visuals: vis });
  });
  return { pages, reportFilters: filtersOf(reportJson.filterConfig), measures, unreadable: inv.unreadableFiles.length };
}

// role by role: the same fields in the same order; the same fields in another order (order); else what was added and
// removed (a removed and an added field in one role: "field swapped")
function compareRoles(a, b, out) {
  const roles = [...new Set(Object.keys(a).concat(Object.keys(b)))].sort();
  roles.forEach((r) => {
    const x = a[r] || [], y = b[r] || [];
    if (JSON.stringify(x) === JSON.stringify(y)) return;
    const sx = x.slice().sort(), sy = y.slice().sort();
    if (JSON.stringify(sx) === JSON.stringify(sy)) { out.push({ tier: 'order', what: `${r}: the same fields in another order` }); return; }
    const gone = x.filter((k) => !y.includes(k)), added = y.filter((k) => !x.includes(k));
    const agg = (k) => k.replace(/^[A-Za-z]+\((.*)\)$/, '$1').replace(/^col /, '');
    if (gone.length === 1 && added.length === 1 && agg(gone[0]) === agg(added[0])) out.push({ tier: 'question', what: `${r}: aggregation changed`, from: gone[0], to: added[0] });
    else if (gone.length && added.length) out.push({ tier: 'question', what: `${r}: field swapped`, from: gone, to: added });
    else if (added.length) out.push({ tier: 'question', what: `${r}: field added`, to: added });
    else out.push({ tier: 'question', what: `${r}: field removed`, from: gone });
  });
}
// filters by key (field and type); the condition by hash only; "Top N changed" for a Top N one
function compareFilters(fa, fb, scope, out) {
  const ka = new Map(fa.map((f) => [f.key, f])), kb = new Map(fb.map((f) => [f.key, f]));
  ka.forEach((f, k) => { if (!kb.has(k)) out.push({ tier: 'question', what: `${scope} filter removed`, field: f.field, type: f.type }); });
  kb.forEach((f, k) => {
    const o = ka.get(k);
    if (!o) out.push({ tier: 'question', what: `${scope} filter added`, field: f.field, type: f.type, literals: f.literals });
    else if (o.hash !== f.hash) out.push({ tier: 'question', what: f.topN ? `${scope} Top N changed` : `${scope} filter changed`, field: f.field, type: f.type, literals: { before: o.literals, after: f.literals } });
  });
}
function compareVisual(qa, qb, ctx) {
  const out = [];
  const flat = (q) => Object.values(q.roles).flat().sort().join('|');
  if (qa.type !== qb.type && flat(qa) === flat(qb)) out.push({ tier: 'question', what: 'visual type changed, the same fields (in its own roles)', from: qa.type, to: qb.type, cantProve: 'what a custom visual does after its query is not in the files: layer 2' });
  else { if (qa.type !== qb.type) out.push({ tier: 'question', what: 'visual type changed', from: qa.type, to: qb.type }); compareRoles(qa.roles, qb.roles, out); }
  // a visual calculation's expression is in its key (by hash): a changed one shows as a field swapped; say it
  out.forEach((d) => { if (JSON.stringify([d.from, d.to]).includes('visualCalc #')) d.what += ' (a visual calculation)'; });
  if (JSON.stringify(qa.sort) !== JSON.stringify(qb.sort)) {
    const fa = qa.sort.map((s) => s.field).join(), fb = qb.sort.map((s) => s.field).join();
    out.push({ tier: 'order', what: !qa.sort.length ? 'sort added' : !qb.sort.length ? 'sort removed' : fa === fb ? 'sort direction changed' : 'sort field changed', from: qa.sort.map((s) => s.field + ' ' + s.dir), to: qb.sort.map((s) => s.field + ' ' + s.dir) });
  }
  compareFilters(qa.filters, qb.filters, 'visual', out);
  if (JSON.stringify(qa.slicerSel) !== JSON.stringify(qb.slicerSel)) out.push({ tier: 'question', what: 'slicer selection changed (saved state)', literals: { before: qa.slicerSel.reduce((n, s) => n + s.literals, 0), after: qb.slicerSel.reduce((n, s) => n + s.literals, 0) } });
  const ka = [...new Set(Object.keys(qa.display).concat(Object.keys(qb.display)))].sort();
  ka.forEach((k) => { if (qa.display[k] !== qb.display[k]) out.push({ tier: 'display', what: /units/i.test(k) ? 'display units changed' : 'decimals changed', at: k, from: qa.display[k] == null ? 'default' : qa.display[k], to: qb.display[k] == null ? 'default' : qb.display[k] }); });
  // a report measure the visual shows, changed in reportExtensions.json
  const used = new Set(Object.values(qb.roles).flat());
  used.forEach((k) => { if (k in ctx.mb || k in ctx.ma) { if (ctx.ma[k] !== ctx.mb[k]) out.push({ tier: 'question', what: 'report measure changed', field: k }); } });
  // a Top N on the visual makes its order part of the question (data reduction keeps the first N): say so
  if (out.some((d) => d.tier === 'order') && qb.filters.some((f) => f.topN)) out.push({ tier: 'question', what: 'order changed on a visual with a Top N filter: worth a layer 2 run' });
  // a visual calculation runs along the visual's own axes (ROWS, COLUMNS; RUNNINGSUM, PREVIOUS): another order can give
  // other numbers (Microsoft, "Visual calculations": they refer to the visual structure)
  if (out.some((d) => d.tier === 'order') && Object.values(qb.roles).flat().some((k) => /^visualCalc /.test(k))) out.push({ tier: 'question', what: 'order changed on a visual with a visual calculation: its numbers can change' });
  // what the copy's own plan says it changes on purpose (option expected: [{ visual, what: RegExp }]): said, not counted
  (ctx.expected || []).forEach((e) => out.forEach((d) => { if (e.visual === ctx.visual && e.what.test(d.what) && (!e.field || JSON.stringify([d.to, d.field]).includes(e.field))) d.tier = 'expected'; }));
  return out;
}

export function compare(beforePath, afterPath, opts) {
  const A = read(beforePath), B = read(afterPath), o = opts || {}, cap = o.max || 60;
  const res = { visuals: 0, matched: 0, sameQuestion: 0, orderOnly: 0, displayOnly: 0, differ: [], differCount: 0, noQuery: 0, notMatched: [], pageContext: [], reportContext: [] };
  compareFilters(A.reportFilters, B.reportFilters, 'report', res.reportContext);
  A.pages.forEach((pa, id) => {
    const pb = B.pages.get(id);
    if (!pb) { pa.visuals.forEach((_, n) => res.notMatched.push({ page: safeName(id), visual: safeName(n), why: 'page not in after' })); res.visuals += pa.visuals.size; return; }
    const pc = []; compareFilters(pa.filters, pb.filters, 'page', pc); if (pa.interactions !== pb.interactions) pc.push({ tier: 'question', what: 'page interactions changed' });
    if (pc.length) res.pageContext.push({ page: safeName(id), differ: pc });
    pa.visuals.forEach((ja, n) => {
      res.visuals++;
      const jb = pb.visuals.get(n);
      if (!jb) { res.notMatched.push({ page: safeName(id), visual: safeName(n), why: 'no visual of this name in after' }); return; }
      res.matched++;
      const qa = questionOf(ja), qb = questionOf(jb);
      if (!qa && !qb) { res.noQuery++; return; }
      if (!qa || !qb) { res.differCount++; res.differ.length < cap && res.differ.push({ page: safeName(id), visual: safeName(n), differ: [{ tier: 'question', what: qa ? 'query removed' : 'query added' }] }); return; }
      const d = compareVisual(qa, qb, { ma: A.measures, mb: B.measures, visual: n, expected: o.expected }).concat(pc.map((x) => Object.assign({ fromPage: true }, x))).concat(res.reportContext.map((x) => Object.assign({ fromReport: true }, x)));
      if (!d.length) { res.sameQuestion++; return; }
      const tiers = new Set(d.map((x) => x.tier));
      if ([...tiers].every((t) => t === 'expected')) { res.expectedOnly = (res.expectedOnly || 0) + 1; res.differCount++; res.differ.length < cap && res.differ.push({ page: safeName(id), visual: safeName(n), type: qb.type, differ: d }); return; }
      if (!tiers.has('question') && !tiers.has('display')) res.orderOnly++;
      else if (!tiers.has('question')) res.displayOnly++;
      res.differCount++;
      if (res.differ.length < cap) res.differ.push({ page: safeName(id), visual: safeName(n), type: qb.type, differ: d.map((x) => Object.assign({}, x, { what: x.what })) });
    });
    pb.visuals.forEach((_, n) => { if (!pa.visuals.has(n)) res.notMatched.push({ page: safeName(id), visual: safeName(n), why: 'new in after' }); });
  });
  B.pages.forEach((pb, id) => { if (!A.pages.has(id)) pb.visuals.forEach((_, n) => res.notMatched.push({ page: safeName(id), visual: safeName(n), why: 'page new in after' })); });
  return res;
}
