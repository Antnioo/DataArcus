// 0.3.3 HX1 (the owner, 11 Nov, D-1111-12; mcp/work/HX1.md): the number's lineage. For each visual of a PBIR report,
// everything in the model its numbers depend on, and three prints of it. A library: no tool loads it yet.
// It joins what three parts already read and never joined: the question a visual asks (same-question.mjs's
// questionOf), the fields a report's JSON references (dax-reference-parser.js's collectReportRefs) and the model
// objects a DAX text references (model-index.js's daxRefs). From a visual's fields it follows the measures they call,
// the columns and tables under them and the relationships a filter can travel, and hashes what it met.
//   lineageOf(model, report)        each visual's nodes (by tier) and prints; model: the TMSL JSON a model.bim holds
//                                   (loadModel's tmsl), report: { files: [{ path, json }] } (the health check's shape)
//   compareLineage(before, after)   visual by visual: can it show other numbers, and through which names
//   reachOf(lineage, what)          the visuals a measure, a column or a table reaches
//   modelGraph(model)               the model's nodes, their references and its relationships
// Three tiers, same-question's: question (the numbers can differ), display (the same numbers shown otherwise: a format
// string, a colour set by a measure), order (the same numbers in another order: a sort-by column, the visual's sort).
// IN DOUBT, MORE: whatever cannot be resolved counts as a change of the question; "can only show other numbers if the
// data changed" is said only when the visual's own question, its page's context and every definition under it hash the
// same. Never a value: a filter, a slicer's selection and a DAX text are compared by SHA-256; compareLineage and reachOf
// return names (through safeName) and words, no hash. The prints leave only in lineageOf's result (a later stage keeps
// them at approval; they are hashes of definitions and of filters, so that stage decides where they may be kept).
// Pure: nothing is read or written here.
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { canon } from './canon.mjs';
import { questionOf } from './same-question.mjs';
import { safeName } from './read-report.mjs';

const require = createRequire(import.meta.url);
const Index = require('../../assets/js/model-index.js'), Parser = require('../../assets/js/dax-reference-parser.js');
const { normalizeModel, buildIndex, K, daxRefs, aggBase } = Index;

const H = (x) => crypto.createHash('sha256').update(canon(x)).digest('hex');
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);
const lc = (s) => String(s == null ? '' : s).toLowerCase();
export const TIERS = ['question', 'display', 'order'];
const rank = (t) => TIERS.indexOf(t);
// at most this many reasons a visual, and visuals listed (the rest counted): the share a tool's answer can give it
export const WHY_MAX = 6;
export const LISTED_MAX = 60;

export const PROVES = 'From the files only: for each visual, whether its own question (fields, aggregations, filters, sort), its page\'s context (page and report filters, the page\'s slicers) and every model definition under it (the measures it calls, their measures, the columns, the tables\' queries, the relationships a filter can travel between them) are the same in both versions. A visual counted as "can only show other numbers if the data changed" has all of them the same.';
export const NOT_PROVED = 'It runs no query and reads no data: the data itself, row-level security (said once for the whole model when the roles changed), a slicer synced from another page, a bookmark, a custom visual\'s own logic and what a DAX text builds at run time are outside it. Which relationships count for a visual is a rule from Microsoft\'s documented filter propagation, not measured in Power BI Desktop. Tell the user the sentence in said, never more than it says.';

// ---- the model: nodes { label, q (what decides the number), d (how it is shown), deps, show (references of its format), sort (its sort-by column) } ----
const mLabel = (n) => `[${safeName(n)}]`, cLabel = (t, c) => `${safeName(t)}[${safeName(c)}]`, tLabel = (t) => `${safeName(t)} (table)`;
const relKey = (r) => `r:${lc(r.fromTable)}|${lc(r.fromColumn)}>${lc(r.toTable)}|${lc(r.toColumn)}`;
// a DAX text that can turn a relationship on or change its direction: every path counts then, whatever its direction
const TURNS = /\b(USERELATIONSHIP|CROSSFILTER)\s*\(/i;

export function modelGraph(model) {
  const M = normalizeModel(isObj(model) ? model : {}), IX = buildIndex(M), nodes = new Map();
  const put = (key, n) => nodes.set(key, Object.assign({ deps: [], show: [], sort: null, turns: false }, n));
  M.functions.forEach((f) => put(K.f(f.name), { label: `${safeName(f.name)} (function)`, q: H({ expr: f.expr }), d: '', deps: daxRefs(f.expr, null, IX).refs, turns: TURNS.test(f.expr) }));
  M.tables.forEach((t) => {
    const cg = t.calcGroup, tDeps = (t.isCalcTable ? daxRefs(t.calcExpr, null, IX).refs : []).concat(cg ? cg.items.flatMap((ci) => daxRefs(ci.expr + '\n' + ci.fsExpr, null, IX).refs) : []);
    put(K.t(t.name), { label: tLabel(t.name), kind: 'table', q: H({ parts: t.partitions.map((p) => [p.mode, p.sourceType, p.expression, p.entityName, p.schemaName]), calc: t.calcExpr, group: cg ? [cg.precedence, cg.items.map((ci) => [ci.name, ci.expr, ci.fsExpr])] : null }), d: '',
      deps: [...new Set(tDeps)].filter((k) => k !== K.t(t.name)), turns: TURNS.test(t.calcExpr + (cg ? cg.items.map((ci) => ci.expr).join('\n') : '')) });
    t.columns.forEach((c) => {
      const deps = [K.t(t.name)].concat(c.kind === 'calculated' ? daxRefs(c.expr, t.name, IX).refs : []);
      const base = aggBase(c.alternateOf); if (base) deps.push(base);
      arr(c.relatedColumnDetails && c.relatedColumnDetails.groupByColumns).forEach((g) => { if (g && g.groupingColumn) deps.push(K.c(t.name, g.groupingColumn)); });
      put(K.c(t.name, c.name), { label: cLabel(t.name, c.name), kind: 'column', q: H({ kind: c.kind, type: c.dataType, expr: c.expr, source: c.sourceColumn, alt: c.alternateOf || null }), d: H({ format: c.formatString, category: c.dataCategory }),
        deps: [...new Set(deps)], sort: c.sortBy ? K.c(t.name, c.sortBy) : null, turns: TURNS.test(c.expr) });
    });
    t.measures.forEach((ms) => put(K.m(ms.name), { label: mLabel(ms.name), kind: 'measure', q: H({ expr: ms.expr }), d: H({ format: ms.formatString, by: ms.fsExpr }),
      deps: daxRefs(ms.expr, null, IX).refs, show: ms.fsExpr ? daxRefs(ms.fsExpr, null, IX).refs : [], turns: TURNS.test(ms.expr) }));
  });
  const relationships = M.relationships.map((r) => ({ key: relKey(r), label: `${cLabel(r.fromTable, r.fromColumn)} to ${cLabel(r.toTable, r.toColumn)}`, from: lc(r.fromTable), to: lc(r.toTable), active: r.active,
    both: r.cross === 'bothDirections', many: r.toCard === 'many', q: H([r.fromTable, r.fromColumn, r.toTable, r.toColumn, r.active, r.cross, r.fromCard, r.toCard]) }));
  return { M, IX, nodes, relationships, wide: { roles: H(M.roles), culture: H([M.culture]) } };
}

// ---- a report reference ({ kind, entity, prop } or a hierarchy level) -> a node's key; a field the model lacks gets its own node ----
function keyOfRef(r, G, ext) {
  const t = G.IX.tables.get(lc(r.entity)), tn = t ? t.name : r.entity;
  if (r.kind === 'HierarchyLevel') {
    const h = t && t.hierarchies.find((x) => lc(x.name) === lc(r.hierarchy)), lvl = h && h.levels.find((l) => lc(l.name) === lc(r.level));
    if (lvl && G.nodes.has(K.c(tn, lvl.column))) return K.c(tn, lvl.column);
    if (G.nodes.has(K.c(tn, r.hierarchy))) return K.c(tn, r.hierarchy);
    return missing(G, `${safeName(r.entity)}[${safeName(r.hierarchy)}].${safeName(r.level)}`);
  }
  if (ext.has(lc(r.prop)) && (r.kind === 'Measure' || !G.nodes.has(K.c(tn, r.prop))) && !G.nodes.has(K.m(r.prop))) return 'x:' + lc(r.prop);
  if (r.kind === 'Measure' && G.nodes.has(K.m(r.prop))) return K.m(r.prop);
  if (G.nodes.has(K.c(tn, r.prop))) return K.c(tn, r.prop);
  if (G.nodes.has(K.m(r.prop))) return K.m(r.prop);
  return missing(G, r.kind === 'Measure' ? mLabel(r.prop) : cLabel(r.entity, r.prop));
}
function missing(G, label) { const key = 'missing:' + lc(label); if (!G.nodes.has(key)) G.nodes.set(key, { label, kind: 'missing', q: 'missing', d: '', deps: [], show: [], sort: null, turns: false }); return key; }
const refsOf = (json, G, ext) => { const acc = []; Parser.collectReportRefs(json, acc, {}); return [...new Set(acc.map((r) => keyOfRef(r, G, ext)))]; };

// ---- which relationships count for a set of tables (the rule; NOT_PROVED says it is not measured in Desktop) ----
// A filter travels from the one side to the many side, both ways when the relationship says so. A relationship counts
// when (i) it lies on a path a filter can travel from one of the visual's tables to another (itself not used twice),
// or (ii) its one side is one of the visual's tables (an unmatched key adds that table's blank row). A text with
// USERELATIONSHIP or CROSSFILTER under the visual: every relationship is a path both ways, active or not.
function relsFor(tables, G, turned) {
  if (!tables.size) return [];
  const edges = [];   // { a, b, r }: a filter on a reaches b through r
  G.relationships.forEach((r) => { if (!turned && !r.active) return; edges.push({ a: r.to, b: r.from, r }); if (turned || r.both) edges.push({ a: r.from, b: r.to, r }); });
  const reach = (starts, skip, forward) => { const seen = new Set(starts), stack = [...starts]; while (stack.length) { const n = stack.pop(); edges.forEach((e) => { if (e.r === skip) return; const from = forward ? e.a : e.b, to = forward ? e.b : e.a; if (from === n && !seen.has(to)) { seen.add(to); stack.push(to); } }); } return seen; };
  return G.relationships.filter((r) => {
    if (tables.has(r.to) || (r.many && tables.has(r.from))) return true;
    const from = reach(tables, r, true), into = reach(tables, r, false);   // reached from a visual's table; reaches one
    return edges.some((e) => e.r === r && from.has(e.a) && into.has(e.b));
  });
}

// ---- one visual's nodes: { key: { tier, via } }, the strongest tier first, each with the node it was reached from ----
function closure(G, roots) {
  const nodes = {};
  TIERS.forEach((tier) => {
    const queue = roots[tier].filter((k) => !nodes[k]).map((k) => [k, null]);
    queue.forEach(([k]) => { if (!nodes[k]) nodes[k] = { tier, via: null }; });
    for (let i = 0; i < queue.length; i++) {
      const [k] = queue[i], n = G.nodes.get(k); if (!n) continue;
      n.deps.forEach((d) => { if (!nodes[d] && G.nodes.has(d)) { nodes[d] = { tier, via: k }; queue.push([d, k]); } });
    }
  });
  return nodes;
}
const tablesOf = (nodes, tier) => new Set(Object.keys(nodes).filter((k) => (!tier || nodes[k].tier === tier) && (k.startsWith('t:') || k.startsWith('c:'))).map((k) => (k.startsWith('t:') ? k.slice(2) : k.slice(2).split('|')[0])));

export function lineageOf(model, report) {
  const G = modelGraph(model), files = arr(isObj(report) ? report.files : null).filter((f) => f && typeof f.path === 'string' && isObj(f.json));
  // the report's own measures: nodes of their own, their DAX followed into the model
  const ext = new Set();
  files.filter((f) => /(^|\/)reportExtensions\.json$/i.test(f.path)).forEach((f) => arr(f.json.entities).filter(isObj).forEach((en) => arr(en.measures).filter(isObj).forEach((ms) => {
    const expr = Parser.exprText(ms.expression), key = 'x:' + lc(ms.name); ext.add(lc(ms.name));
    G.nodes.set(key, { label: mLabel(ms.name), kind: 'report measure', q: H({ expr, type: ms.dataType }), d: H({ format: ms.formatString }), deps: daxRefs(expr, null, G.IX).refs, show: [], sort: null, turns: TURNS.test(expr) });
  })));
  const reportJson = (files.find((f) => /(^|\/)definition\/report\.json$/.test(f.path) || f.path === 'report.json') || {}).json || {};
  const pages = new Map();
  const pageOf = (id) => { if (!pages.has(id)) pages.set(id, { id, json: {}, visuals: [] }); return pages.get(id); };
  files.forEach((f) => {
    const pm = /(^|\/)pages\/([^/]+)\/page\.json$/.exec(f.path), vm = /(^|\/)pages\/([^/]+)\/visuals\/([^/]+)\/visual\.json$/.exec(f.path);
    if (pm) pageOf(pm[2]).json = f.json; else if (vm) pageOf(vm[2]).visuals.push({ name: vm[3], json: f.json });
  });
  const visuals = [];
  pages.forEach((pg) => {
    const asked = pg.visuals.map((v) => ({ v, q: questionOf(v.json) }));
    const slicers = asked.filter((x) => x.q && x.q.slicer && (x.q.slicer.set || /slicer/i.test(x.q.rawType)));
    const around = { page: H(pg.json.filterConfig || null), report: H(reportJson.filterConfig || null), interactions: H(pg.json.visualInteractions || null) };
    const aroundRefs = refsOf(pg.json.filterConfig, G, ext).concat(refsOf(reportJson.filterConfig, G, ext));
    asked.forEach(({ v, q }) => {
      const out = { page: safeName(pg.id), visual: safeName(v.name), id: pg.id + '/' + v.name, type: q ? q.type : safeName(String((isObj(v.json.visual) && v.json.visual.visualType) || 'unknown')) };
      if (!q) { visuals.push(out); return; }
      const vis = isObj(v.json.visual) ? v.json.visual : {}, query = isObj(vis.query) ? vis.query : {};
      const others = slicers.filter((s) => s.v !== v);
      const shown = refsOf(query.queryState, G, ext);
      const roots = {
        question: [...new Set(shown.concat(refsOf(v.json.filterConfig, G, ext), aroundRefs, others.flatMap((s) => refsOf(isObj(s.v.json.visual) && isObj(s.v.json.visual.query) ? s.v.json.visual.query.queryState : null, G, ext))))],
        display: [...new Set(refsOf(vis.objects, G, ext).concat(refsOf(vis.visualContainerObjects, G, ext), shown.flatMap((k) => (G.nodes.get(k) || { show: [] }).show)))],
        order: [...new Set(refsOf(query.sortDefinition, G, ext).concat(shown.map((k) => (G.nodes.get(k) || {}).sort).filter(Boolean)))]
      };
      const nodes = closure(G, roots);
      // the relationships: for the question's tables first, then for every table under the visual (a weaker tier)
      const turned = (tier) => Object.keys(nodes).some((k) => (!tier || nodes[k].tier === tier) && (G.nodes.get(k) || {}).turns);
      relsFor(tablesOf(nodes, 'question'), G, turned('question')).forEach((r) => { nodes[r.key] = { tier: 'question', via: null }; });
      relsFor(tablesOf(nodes), G, turned()).forEach((r) => { if (!nodes[r.key]) nodes[r.key] = { tier: 'display', via: null }; });
      const defs = (tier) => Object.keys(nodes).filter((k) => nodes[k].tier === tier).sort().map((k) => [k, qOf(G, k)]);
      const own = { type: q.rawType, roles: Object.fromEntries(Object.entries(q.roles).map(([r, l]) => [r, l.map((f) => f.k).sort()])), filters: q.filters.map((f) => [f.key, f.hash]), slicer: q.slicer.hash };
      const context = Object.assign({ slicers: others.map((s) => [s.v.name, s.q.slicer.hash]).sort() }, around);
      const display = { own: Object.fromEntries(Object.entries(q.display).map(([k, x]) => [k, x.hash])), shown: shown.map((k) => [k, dOf(G, k)]).sort() };
      const order = { roles: Object.fromEntries(Object.entries(q.roles).map(([r, l]) => [r, l.map((f) => f.k)])), sort: q.sort.map((s) => [s.k, s.dir]), by: shown.map((k) => [k, (G.nodes.get(k) || {}).sort || null]).sort() };
      // (parts: what compareLineage reads to say why; hashes, kept inside this module's results, never in its answers)
      out.parts = { own: H(own), context: H(context), display: H(display), order: H(order) };
      out.prints = { question: H([out.parts.own, out.parts.context, defs('question')]), display: H([out.parts.display, defs('display')]), order: H([out.parts.order, defs('order')]) };
      out.nodes = Object.fromEntries(Object.keys(nodes).sort().map((k) => [k, { tier: nodes[k].tier, via: nodes[k].via, q: qOf(G, k), d: shown.includes(k) ? dOf(G, k) : '', label: labelOf(G, k), kind: kindOf(G, k) }]));
      visuals.push(out);
    });
  });
  return { visuals, wide: G.wide, known: Object.fromEntries([...G.nodes.keys()].map((k) => [k, labelOf(G, k)])) };
}
const relOf = (G, k) => G.relationships.find((r) => r.key === k);
const qOf = (G, k) => (k.startsWith('r:') ? (relOf(G, k) || {}).q : (G.nodes.get(k) || {}).q) || '';
const dOf = (G, k) => (G.nodes.get(k) || {}).d || '';
const labelOf = (G, k) => (k.startsWith('r:') ? (relOf(G, k) || {}).label : (G.nodes.get(k) || {}).label) || safeName(k);
const kindOf = (G, k) => (k.startsWith('r:') ? 'relationship' : (G.nodes.get(k) || {}).kind || 'function');

// ---- two versions compared ----
const CHANGED = { measure: 'measure: its DAX changed', 'report measure': 'report measure changed', column: 'column: its definition changed', table: 'table: its source query or its definition changed', relationship: 'relationship changed', function: 'function: its DAX changed' };
function whyOf(a, b) {
  const why = [], through = (v, k) => { const path = []; let at = v.nodes[k] && v.nodes[k].via, n = 0; while (at && n++ < 50) { path.unshift(v.nodes[at].label); at = v.nodes[at].via; } return path; };
  const say = (what, v, k) => why.push(Object.assign({ what, name: v.nodes[k].label }, through(v, k).length ? { through: through(v, k) } : {}));
  if (a.parts.own !== b.parts.own) why.push({ what: 'its own question changed (its fields, aggregations, filters or type)' });
  if (a.parts.context !== b.parts.context) why.push({ what: 'its page\'s filters changed (the page\'s, the report\'s, or a slicer\'s saved selection on the page)' });
  TIERS.forEach((tier) => {
    const ka = Object.keys(a.nodes).filter((k) => a.nodes[k].tier === tier), kb = Object.keys(b.nodes).filter((k) => b.nodes[k].tier === tier);
    kb.forEach((k) => {
      const x = a.nodes[k], y = b.nodes[k], t = tier === 'question' ? '' : ` (${tier} only)`;
      if (y.kind === 'missing') { if (!x) say('not in the model' + t, b, k); return; }
      if (x && x.tier === tier && x.q !== y.q) say((CHANGED[y.kind] || 'changed') + t, b, k);
      else if (!x && y.kind === 'relationship') say('relationship added' + t, b, k);
    });
    ka.forEach((k) => { if (!b.nodes[k] && a.nodes[k].kind === 'relationship') say('relationship removed' + (tier === 'question' ? '' : ` (${tier} only)`), a, k); });
  });
  if (a.parts.display !== b.parts.display) {
    const moved = Object.keys(b.nodes).filter((k) => b.nodes[k].d && a.nodes[k] && a.nodes[k].d && a.nodes[k].d !== b.nodes[k].d);
    if (moved.length) moved.forEach((k) => say('its format changed', b, k)); else why.push({ what: 'how it shows its numbers changed (display units, decimals or the fields shown)' });
  }
  if (a.parts.order !== b.parts.order) why.push({ what: 'its order changed (its sort, a sort-by column or the order of its fields)' });
  return why;
}

export function compareLineage(before, after) {
  const A = arr(before && before.visuals), B = new Map(arr(after && after.visuals).map((v) => [v.id, v]));
  const res = { visuals: A.length, withQuery: 0, same: 0, question: 0, display: 0, order: 0, noQuery: 0, notMatched: 0 }, differ = [];
  A.forEach((a) => {
    const b = B.get(a.id);
    if (a.prints) res.withQuery++;
    if (!b) { res.notMatched++; return; }
    if (!a.prints && !b.prints) { res.noQuery++; return; }
    if (!a.prints || !b.prints) { res.question++; differ.push({ page: b.page, visual: b.visual, type: b.type, tier: 'question', why: [{ what: a.prints ? 'query removed' : 'query added' }] }); return; }
    const tier = TIERS.find((t) => a.prints[t] !== b.prints[t]);
    if (!tier) { res.same++; return; }
    let why = whyOf(a, b); if (!why.length) why = [{ what: 'what it depends on changed' }];
    res[tier]++;
    differ.push(Object.assign({ page: b.page, visual: b.visual, type: b.type, tier, why: why.slice(0, WHY_MAX) }, why.length > WHY_MAX ? { moreReasons: why.length - WHY_MAX } : {}));
  });
  const ids = new Set(A.map((a) => a.id)), added = arr(after && after.visuals).filter((v) => !ids.has(v.id)).length;
  differ.sort((x, y) => rank(x.tier) - rank(y.tier));
  const wa = (before && before.wide) || {}, wb = (after && after.wide) || {}, modelWide = [];
  if (wa.roles !== wb.roles) modelWide.push('The model\'s row-level security roles changed: every visual can show other numbers to the people in a role.');
  if (wa.culture !== wb.culture) modelWide.push('The model\'s culture changed: dates and numbers can be shown otherwise.');
  const Q = res.question;
  const said = `${res.same} of ${res.withQuery} visuals can only show other numbers if the data changed; ${Q} can show other numbers${Q ? ' (listed)' : ''}; ${res.display} only in display; ${res.order} only in order`
    + (res.notMatched ? `; ${res.notMatched} not found in the later version` : '') + (added ? `; ${added} new` : '') + '.';
  return Object.assign({ said }, res, { newInAfter: added, differ: differ.slice(0, LISTED_MAX) }, differ.length > LISTED_MAX ? { notListed: differ.length - LISTED_MAX } : {}, { modelWide,
    tiers: 'question: the numbers can differ; display: the same numbers shown otherwise; order: the same numbers in another order', proves: PROVES, notProved: NOT_PROVED });
}

// ---- what a measure ({ measure }), a column ({ table, column }) or a table ({ table }) reaches ----
export function reachOf(lineage, what) {
  const w = isObj(what) ? what : {}, key = w.measure != null ? K.m(w.measure) : w.column != null ? K.c(w.table, w.column) : K.t(w.table);
  const known = isObj(lineage) && isObj(lineage.known) ? lineage.known : {}, found = Object.prototype.hasOwnProperty.call(known, key) || Object.prototype.hasOwnProperty.call(known, 'x:' + lc(w.measure));
  const hit = arr(lineage && lineage.visuals).filter((v) => v.nodes && (v.nodes[key] || (w.measure != null && v.nodes['x:' + lc(w.measure)])));
  const visuals = hit.map((v) => ({ page: v.page, visual: v.visual, type: v.type, tier: (v.nodes[key] || v.nodes['x:' + lc(w.measure)]).tier })).sort((x, y) => rank(x.tier) - rank(y.tier));
  return { found, name: found ? known[key] || known['x:' + lc(w.measure)] : null, visuals: visuals.slice(0, LISTED_MAX), count: visuals.length, pages: new Set(hit.map((v) => v.page)).size };
}
