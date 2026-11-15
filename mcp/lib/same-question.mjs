// The number check, layer 1 ("same question"; 0.3.2 NC1, RD2's brief g, the owner's D-1104-01): check_report's option
// `against`. Two PBIR reports on the same model, the original (`against`) and its copy (`path`), compared visual by
// visual from the files only: does each visual of the copy ask the model the same question (its fields, aggregations,
// filters, sort, Top N, visual calculations, the report measures it shows, its page's and the report's filters), and
// show the answer the same way (display units, decimals)? Three tiers: question (the numbers can differ), display (the
// same numbers shown otherwise), order (the same numbers in another order).
// Read-only, through the reading block (locate: inside the working folder, PBIR, no link; diskSource: every file
// measured before it is read, links never followed; inventory). Never a value: a filter, a slicer selection, a visual
// calculation, a report measure and a bookmark are compared by their SHA-256 hash and said by their field, their type
// and their count of literals; the hashes themselves never leave this module. Names out through safeName, fields
// written as read_report writes them.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { locate, diskSource, jsonOpt, inventory, safeName, typeName } from './read-report.mjs';

const H = (x) => crypto.createHash('sha256').update(JSON.stringify(x === undefined ? null : x)).digest('hex');
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);
// at most this many visuals listed (the rest counted), and the section's share of check_report's answer
export const LISTED_MAX = 60;
export const SECTION_MAX = 16000;
// read_report's words for Power BI's aggregation functions (lib/read-report.mjs)
const AGG = { 0: 'Sum', 1: 'Avg', 2: 'DistinctCount', 3: 'Min', 4: 'Max', 5: 'Count', 6: 'Median', 7: 'StDev', 8: 'Var' };

// ---- a field: k (the exact key, raw names, compared only), base (k without its aggregation), l (as the answer says it)
const srcOf = (e) => { const s = isObj(e) && isObj(e.SourceRef) ? e.SourceRef : {}; return { t: String(s.Entity || s.Source || ''), ext: s.Schema === 'extension' }; };
export function fieldOf(f) {
  if (!isObj(f)) return { k: 'other ' + H(f), base: 'other ' + H(f), l: '(an expression)' };
  if (isObj(f.Column)) { const s = srcOf(f.Column.Expression), n = String(f.Column.Property || ''); const k = 'col ' + JSON.stringify([s.t, n]); return { k, base: k, l: `${safeName(s.t)}[${safeName(n)}]` }; }
  if (isObj(f.Measure)) { const s = srcOf(f.Measure.Expression), n = String(f.Measure.Property || ''); const k = (s.ext ? 'rm ' : 'm ') + JSON.stringify([s.t, n]); return { k, base: k, l: `[${safeName(n)}]${s.ext ? '(report measure)' : ''}`, report: s.ext }; }
  if (isObj(f.Aggregation)) { const inner = fieldOf(f.Aggregation.Expression), a = AGG[f.Aggregation.Function] || 'Agg' + safeName(f.Aggregation.Function); return { k: a + '(' + inner.k + ')', base: inner.base, l: `${a}(${inner.l})` }; }
  if (isObj(f.HierarchyLevel)) {
    const h = isObj(f.HierarchyLevel.Expression) && isObj(f.HierarchyLevel.Expression.Hierarchy) ? f.HierarchyLevel.Expression.Hierarchy : {}, v = isObj(h.Expression) ? h.Expression.PropertyVariationSource : null;
    const s = isObj(v) ? srcOf(v.Expression) : srcOf(h.Expression), hn = String(isObj(v) && v.Property ? v.Property : h.Hierarchy || ''), lv = String(f.HierarchyLevel.Level || '');
    const k = 'level ' + JSON.stringify([s.t, hn, lv]); return { k, base: k, l: `${safeName(s.t)}[${safeName(hn)}].${safeName(lv)}` };
  }
  // a visual calculation: its expression can hold literals, so it is in the key by hash only, said by its name
  if (isObj(f.NativeVisualCalculation)) { const c = f.NativeVisualCalculation, k = 'calc ' + H([c.Language, c.Expression, c.Name]); return { k, base: k, l: `visual calculation [${safeName(c.Name || '')}]`, calc: true }; }
  return { k: 'other ' + H(f), base: 'other ' + H(f), l: '(an expression)' };
}
const literals = (x) => { let n = 0; const walk = (o, d) => { if (d > 40) return; if (Array.isArray(o)) o.forEach((v) => walk(v, d + 1)); else if (isObj(o)) Object.entries(o).forEach(([k, v]) => { if (k === 'Literal') n++; else walk(v, d + 1); }); }; walk(x, 0); return n; };

// ---- filters (a visual's, a page's, the report's): by field and type; the condition by hash, its literals counted
function filtersOf(cfg) {
  const seen = {};
  return arr(isObj(cfg) ? cfg.filters : null).filter(isObj).map((f) => {
    const field = f.field ? fieldOf(f.field) : { k: 'expression', l: '(an expression)' }, type = String(f.type || 'unknown').replace(/[^A-Za-z]/g, '').slice(0, 30) || 'unknown';
    const k0 = field.k + ' ' + type, n = (seen[k0] = (seen[k0] || 0) + 1);
    return { key: k0 + ' #' + n, field: field.l, type, topN: type === 'TopN', hash: H([f.field, f.filter, f.type]), literals: literals(f.filter) };
  });
}
function compareFilters(fa, fb, scope, out) {
  const ka = new Map(fa.map((f) => [f.key, f])), kb = new Map(fb.map((f) => [f.key, f]));
  ka.forEach((f, k) => { if (!kb.has(k)) out.push({ tier: 'question', what: `${scope} filter removed`, field: f.field, type: f.type }); });
  kb.forEach((f, k) => {
    const o = ka.get(k);
    if (!o) out.push({ tier: 'question', what: `${scope} filter added`, field: f.field, type: f.type, literals: f.literals });
    else if (o.hash !== f.hash) out.push({ tier: 'question', what: f.topN ? `${scope} Top N changed` : `${scope} filter changed`, field: f.field, type: f.type, literals: { before: o.literals, after: f.literals } });
  });
}

// ---- display: Power BI's display units and decimals (formats, not values): units by name, decimals as a small number
const UNITS = { '0D': 'auto', '1D': 'none', '1000D': 'K', '1000000D': 'M', '1000000000D': 'bn', '1000000000000D': 'T' };
const DISPLAY = /^(labelDisplayUnits|displayUnits|valueDisplayUnits|labelPrecision|precision|valueDecimalPlaces|decimalPlaces)$/;
function displayOf(objects) {
  const out = {};
  Object.entries(isObj(objects) ? objects : {}).forEach(([obj, list]) => arr(list).forEach((e) => {
    if (!isObj(e) || !isObj(e.properties)) return;
    Object.entries(e.properties).forEach(([p, v]) => {
      if (!DISPLAY.test(p)) return;
      const raw = isObj(v) && isObj(v.expr) && isObj(v.expr.Literal) ? String(v.expr.Literal.Value) : null;
      const said = raw == null ? 'set by an expression' : /units/i.test(p) ? (UNITS[raw] || 'other') : (/^\d{1,2}[LD]?$/.test(raw) ? raw.replace(/[LD]$/, '') : 'other');
      // (a per-series entry: its selector can hold a value; it is in the key by hash, said only as "one series")
      out[JSON.stringify([obj, p, e.selector ? H(e.selector) : ''])] = { at: `${safeName(obj)}.${safeName(p)}${e.selector ? ' (one series)' : ''}`, said, hash: H(v) };
    });
  }));
  return out;
}

// ---- the question a visual asks the model, from its visual.json; null for a visual with no query
export function questionOf(j) {
  const v = isObj(j) && isObj(j.visual) ? j.visual : null;
  if (!v) return null;
  const q = isObj(v.query) ? v.query : {}, qs = isObj(q.queryState) ? q.queryState : {};
  const roles = {};
  Object.entries(qs).forEach(([role, r]) => { const l = arr(isObj(r) ? r.projections : null).filter(isObj).map((p) => fieldOf(p.field)); if (l.length) roles[role] = l; });
  const sort = arr(isObj(q.sortDefinition) ? q.sortDefinition.sort : null).filter(isObj).map((s) => Object.assign(fieldOf(s.field), { dir: /desc/i.test(String(s.direction || '')) ? 'desc' : 'asc' }));
  const general = arr(isObj(v.objects) ? v.objects.general : null).filter((e) => isObj(e) && isObj(e.properties) && e.properties.filter);
  const slicer = { hash: H(general.map((e) => e.properties.filter)), literals: general.reduce((n, e) => n + literals(e.properties.filter), 0), set: general.length > 0 };
  if (!Object.keys(roles).length && !slicer.set) return null;
  return { type: typeName(String(v.visualType || 'unknown')), rawType: String(v.visualType || ''), roles, sort, filters: filtersOf(j.filterConfig), display: displayOf(v.objects), slicer };
}

// ---- one report, read once
function modelOf(src, loc, given) {
  let pbir = null; try { pbir = src.json('definition.pbir'); } catch (e) { pbir = null; }
  const ref = isObj(pbir) && isObj(pbir.datasetReference) ? pbir.datasetReference : null;
  if (ref && isObj(ref.byPath) && typeof ref.byPath.path === 'string' && ref.byPath.path) {
    let full = path.resolve(loc.reportDir, ref.byPath.path); try { full = fs.realpathSync.native(full); } catch (e) { /* not there: compared as written */ }
    return 'path ' + (process.platform === 'win32' ? full.toLowerCase() : full);
  }
  if (ref && isObj(ref.byConnection)) return 'connection ' + H(ref.byConnection);
  throw new Error(`"${safeName(given)}" names no model (its definition.pbir has no datasetReference): check_report compares two reports only when both name the same model. Nothing was compared.`);
}
// r: check_report's reading of p ({ loc, sk, src, inv }, read-report.mjs's reading; 0.3.3 LX1), else read here
function read(p, r) {
  const loc = r ? r.loc : locate(p, 'check_report'), sk = r ? r.sk : { big: [], deep: 0 }, src = r ? r.src : diskSource(loc, sk);
  const model = modelOf(src, loc, p);
  const inv = r ? r.inv : inventory(src, path.basename(loc.reportDir));
  const opt = (rel) => jsonOpt(src, rel);
  const report = opt('definition/report.json') || {}, ext = opt('definition/reportExtensions.json');
  const measures = {};
  arr(isObj(ext) ? ext.entities : null).filter(isObj).forEach((en) => arr(en.measures).filter(isObj).forEach((m) => { measures['rm ' + JSON.stringify([String(en.name || ''), String(m.name || '')])] = H([m.expression, m.formatString, m.dataType]); }));
  const bookmarks = new Map();
  src.files('definition/bookmarks').filter((n) => /\.bookmark\.json$/i.test(n)).forEach((n) => { const b = opt('definition/bookmarks/' + n); if (b) bookmarks.set(String(b.name || n), H([b.explorationState, b.options])); });
  const pages = new Map();
  inv.pages.forEach((pg) => {
    const raw = isObj(pg.raw) ? pg.raw : {}, vis = new Map();
    pg.visuals.forEach((x) => { if (x.json) vis.set(String(x.id), x.json); });
    pages.set(String(pg.id), { filters: filtersOf(raw.filterConfig), interactions: H(raw.visualInteractions || null), visuals: vis });
  });
  return { model, pages, reportFilters: filtersOf(report.filterConfig), measures, bookmarks, unread: inv.unreadableFiles.length + sk.big.length + sk.deep + (sk.links || []).length + (sk.capped ? 1 : 0) };
}

// ---- role by role: the same fields in the same order; in another order (order); else added, removed, swapped
function compareRoles(a, b, out) {
  [...new Set(Object.keys(a).concat(Object.keys(b)))].sort().forEach((r) => {
    const x = a[r] || [], y = b[r] || [], kx = x.map((f) => f.k), ky = y.map((f) => f.k), role = safeName(r);
    if (JSON.stringify(kx) === JSON.stringify(ky)) return;
    if (JSON.stringify(kx.slice().sort()) === JSON.stringify(ky.slice().sort())) { out.push({ tier: 'order', what: `${role}: the same fields in another order` }); return; }
    const gone = x.filter((f) => !ky.includes(f.k)), added = y.filter((f) => !kx.includes(f.k)), calc = gone.concat(added).some((f) => f.calc) ? ' (a visual calculation)' : '';
    const ls = (l) => l.map((f) => f.l);
    if (gone.length === 1 && added.length === 1 && gone[0].base === added[0].base) out.push({ tier: 'question', what: `${role}: aggregation changed`, from: gone[0].l, to: added[0].l });
    else if (gone.length && added.length) out.push({ tier: 'question', what: `${role}: field swapped${calc}`, from: ls(gone), to: ls(added) });
    else if (added.length) out.push({ tier: 'question', what: `${role}: field added${calc}`, to: ls(added) });
    else out.push({ tier: 'question', what: `${role}: field removed${calc}`, from: ls(gone) });
  });
}
function compareVisual(qa, qb, ctx) {
  const out = [], flat = (q) => Object.values(q.roles).flat().map((f) => f.k).sort().join('|');
  if (qa.rawType !== qb.rawType && flat(qa) === flat(qb)) out.push({ tier: 'question', what: 'visual type changed, the same fields (in its own roles)', from: qa.type, to: qb.type, ...(/^custom /.test(qa.type) || /^custom /.test(qb.type) ? { layer2: 'what a custom visual does with its query is not in the files' } : {}) });
  else { if (qa.rawType !== qb.rawType) out.push({ tier: 'question', what: 'visual type changed', from: qa.type, to: qb.type }); compareRoles(qa.roles, qb.roles, out); }
  const sk = (q) => q.sort.map((s) => s.k + ' ' + s.dir).join('|'), sf = (q) => q.sort.map((s) => s.k).join('|'), sl = (q) => q.sort.map((s) => s.l + ' ' + s.dir);
  if (sk(qa) !== sk(qb)) out.push({ tier: 'order', what: !qa.sort.length ? 'sort added' : !qb.sort.length ? 'sort removed' : sf(qa) === sf(qb) ? 'sort direction changed' : 'sort field changed', from: sl(qa), to: sl(qb) });
  compareFilters(qa.filters, qb.filters, 'visual', out);
  if (qa.slicer.hash !== qb.slicer.hash) out.push({ tier: 'question', what: 'slicer selection changed (its saved state)', literals: { before: qa.slicer.literals, after: qb.slicer.literals } });
  [...new Set(Object.keys(qa.display).concat(Object.keys(qb.display)))].sort().forEach((k) => {
    const x = qa.display[k], y = qb.display[k];
    if ((x && x.hash) !== (y && y.hash)) out.push({ tier: 'display', what: /units/i.test(k) ? 'display units changed' : 'decimals changed', at: (y || x).at, from: x ? x.said : 'default', to: y ? y.said : 'default' });
  });
  // a report measure the visual shows, its expression, format or type changed in reportExtensions.json (by hash)
  new Set(Object.values(qb.roles).flat().filter((f) => f.report).map((f) => f.k)).forEach((k) => { if (ctx.ma[k] !== ctx.mb[k]) out.push({ tier: 'question', what: 'report measure changed', field: Object.values(qb.roles).flat().find((f) => f.k === k).l }); });
  const ordered = out.some((d) => d.tier === 'order');
  // a Top N keeps the first N rows: another order on such a visual is part of the question (RD2, Microsoft's data limits)
  if (ordered && qb.filters.some((f) => f.topN)) out.push({ tier: 'question', what: 'order changed on a visual with a Top N filter: worth a layer 2 run' });
  // a visual calculation runs along the visual's own axes (Microsoft, "Visual calculations": the visual structure)
  if (ordered && Object.values(qb.roles).flat().some((f) => f.calc)) out.push({ tier: 'question', what: 'order changed on a visual with a visual calculation: its numbers can change' });
  return out;
}
const RANK = { question: 0, display: 1, order: 2 };
const tierOf = (d) => (d.some((x) => x.tier === 'question') ? 'question' : d.some((x) => x.tier === 'display') ? 'display' : 'order');

export const PROVES = 'Layer 1 of the number check, from the files only: for each visual of the original, whether the copy asks the model the same question (its fields, aggregations, filters, sort, Top N, visual calculations, the report measures it shows, its page\'s and the report\'s filters) and shows the answer the same way (display units, decimals).';
export const NOT_PROVED = 'It does not run the queries, so it does not prove the values are the same: a model changed since, a custom visual\'s own logic or a sort near Power BI\'s data limits can still change what Desktop shows. Tell the user the sentence in said, never more than it says.';

// after: the copy (check_report's path); before: the original (against). Throws the reading block's refusals and a
// refusal for two models; returns the section.
export function sameQuestion(after, before, opts) {
  const o = opts || {}, cap = Math.max(1, Math.min(LISTED_MAX, o.max || LISTED_MAX));
  // (0.3.3 LX1) o.readingOf: check_report's readings, one per report a call reads (shared with the Impact check)
  const rd = typeof o.readingOf === 'function' ? o.readingOf : null, B = read(after, rd && rd(after)), A = read(before, rd && rd(before));
  if (A.model !== B.model) throw new Error(`check_report compares two reports only on the same model: "${safeName(after)}" and "${safeName(before)}" name different models in their definition.pbir. Nothing was compared.`);
  const res = { visuals: 0, matched: 0, withQuery: 0, sameQuestion: 0, questionDiffers: 0, displayOnly: 0, orderOnly: 0, noQuery: 0, notMatched: 0 };
  const differ = [], missing = [], pageContext = [], reportContext = [];
  compareFilters(A.reportFilters, B.reportFilters, 'report', reportContext);
  A.pages.forEach((pa, id) => {
    const pb = B.pages.get(id);
    const pc = []; if (pb) { compareFilters(pa.filters, pb.filters, 'page', pc); if (pa.interactions !== pb.interactions) pc.push({ tier: 'question', what: 'page interactions changed' }); }
    if (pc.length) pageContext.push({ page: safeName(id), changes: pc });
    pa.visuals.forEach((ja, n) => {
      res.visuals++;
      const qa = questionOf(ja); if (qa) res.withQuery++;
      const jb = pb ? pb.visuals.get(n) : null;
      if (!jb) { res.notMatched++; missing.length < 20 && missing.push({ page: safeName(id), visual: safeName(n), why: pb ? 'no visual of this name in the copy' : 'its page is not in the copy' }); return; }
      res.matched++;
      const qb = questionOf(jb);
      if (!qa && !qb) { res.noQuery++; return; }
      let d;
      if (!qa || !qb) d = [{ tier: 'question', what: qa ? 'query removed' : 'query added' }];
      else d = compareVisual(qa, qb, { ma: A.measures, mb: B.measures });
      if (d.length && (pc.length || reportContext.length)) d.push({ tier: 'question', what: `its ${pc.length ? 'page\'s' : 'report\'s'} filters changed (pages, report)` });
      else if (!d.length && (pc.length || reportContext.length)) d = [{ tier: 'question', what: `its ${pc.length ? 'page\'s' : 'report\'s'} filters changed (pages, report)` }];
      if (!d.length) { res.sameQuestion++; return; }
      const tier = tierOf(d);
      res[tier === 'question' ? 'questionDiffers' : tier === 'display' ? 'displayOnly' : 'orderOnly']++;
      differ.push({ page: safeName(id), visual: safeName(n), type: (qb || qa).type, tier, changes: d });
    });
  });
  let added = 0; B.pages.forEach((pb, id) => { const pa = A.pages.get(id); pb.visuals.forEach((_, n) => { if (!pa || !pa.visuals.has(n)) added++; }); });
  // the bookmarks: counted by name, each state by hash (a bookmark can hold filter values), never shown
  const bm = { before: A.bookmarks.size, after: B.bookmarks.size, changed: 0, added: 0, removed: 0 };
  A.bookmarks.forEach((h, n) => { if (!B.bookmarks.has(n)) bm.removed++; else if (B.bookmarks.get(n) !== h) bm.changed++; });
  B.bookmarks.forEach((_, n) => { if (!A.bookmarks.has(n)) bm.added++; });
  differ.sort((x, y) => RANK[x.tier] - RANK[y.tier]);
  const K = res.questionDiffers, L = res.orderOnly, D = res.displayOnly, M = res.withQuery;
  const said = `${res.sameQuestion} of ${M} visuals ask the same question; ${K} ${K === 1 ? 'differs' : 'differ'}${K ? ' (listed)' : ''}; ${L} only in order; ${D} only in display` + (res.notMatched ? `; ${res.notMatched} not found in the copy` : '') + (added ? `; ${added} new in the copy` : '') + '.';
  const section = Object.assign({ said }, res, { newInCopy: added, differ: differ.slice(0, cap) },
    differ.length > cap ? { notListed: differ.length - cap } : {},
    missing.length ? { notFound: missing } : {}, pageContext.length ? { pages: pageContext } : {}, reportContext.length ? { report: reportContext } : {},
    bm.before || bm.after ? { bookmarks: bm } : {}, A.unread || B.unread ? { unread: { original: A.unread, copy: B.unread, note: 'files the reading block could not read (too big, too deep, a link, not JSON): their visuals are not compared' } } : {},
    { tiers: 'question: the numbers can differ; display: the same numbers shown otherwise (units, decimals); order: the same numbers in another order', proves: PROVES, notProved: NOT_PROVED });
  // its share of check_report's answer: the list is cut, never the counts, and the cut said
  while (JSON.stringify(section).length > SECTION_MAX && section.differ.length > 1) { section.differ = section.differ.slice(0, Math.floor(section.differ.length * 0.8)); section.notListed = differ.length - section.differ.length; }
  return section;
}
