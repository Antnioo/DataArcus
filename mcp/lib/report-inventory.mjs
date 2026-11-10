// The semantic inventory of a PBIR report (0.3.2 SP42, out of read-report.mjs; the Codex split map's "semantic
// inventory"): pages, visuals, fields, filters, titles, texts, bookmarks, the theme's name and colours, custom visuals,
// what could not be read. It opens no file: every byte comes through the source it is given, which read-report.mjs
// makes (diskSource: the located report on disk, links refused, files capped; memorySource: the writer's files).
// A report's text is untrusted: names and texts are screened here with read-report.mjs's screen (safeName, safeText);
// filter values, slicer selections and bookmark states are never read into the inventory's answers.
// Interface:
//   inventory(src, reportName, opts?) -> { name, pages, theme, bookmarks, types, customVisuals, unreadable, suspicious,
//     sk, ... } (the shape below). src: { dirs(rel), files(rel), has(rel), json(rel), sk } by paths relative to the report
//     folder; json throws TooBig or Linked (read-report.mjs's) for a file left unread, anything else for one that is
//     not readable. opts.pages: read the visuals of these pages only.
//   refOf(field), keyOf(field), filterText(filter), typeName(type), isCustom(type), customNameOf(type), isDecor(visual)
// No state: the answer comes from the source alone.
import path from 'node:path';
import { addLink, INSTRUCTION, LONG_TEXT, Linked, REPORT_LIMITS, safeName, safeText, TooBig } from './read-report.mjs';
import { meaningInReport, VT, PV, TR } from './visual-meaning.mjs';

// ---- reading a visual's parts ----
// (0.3.2 DD1B) read-only, the value as shown (12D -> "12"), its number and its true or false: assets/js/pbir-values.js
const litStr = PV.litShown, litNum = PV.litNumber, litBool = PV.litBool;
// (A5-2, audit 5: only objects; a null entry in a list made the whole reader throw) (0.3.3 SG1) an objects list's entries, the plain ones' properties, all their properties: assets/js/pbir-values.js, their one place
const entries = PV.entries, plain = PV.plain, anyOf = PV.anyOf;
// a list of names (strings), for the lists that hold names, not objects
const names = (list) => (Array.isArray(list) ? list.filter((e) => typeof e === 'string' || (e && typeof e === 'object' && typeof e.name === 'string')).map((e) => (typeof e === 'string' ? e : e.name)) : []);
// Microsoft's QueryAggregateFunction (semantic query schema)
const AGG = { 0: 'Sum', 1: 'Avg', 2: 'DistinctCount', 3: 'Min', 4: 'Max', 5: 'Count', 6: 'Median', 7: 'StDev', 8: 'Var' };
// a field: { kind: column | measure | aggregation, table, name, agg?, report? (a report-level measure), level? }
function fieldOf(f) {
  if (!f || typeof f !== 'object') return null;
  const src = (x) => (((x || {}).Expression || {}).SourceRef || {});
  if (f.Column) { const s = src(f.Column); return { kind: 'column', table: String(s.Entity || s.Source || ''), name: String(f.Column.Property || '') }; }
  if (f.Measure) { const s = src(f.Measure); return Object.assign({ kind: 'measure', table: String(s.Entity || s.Source || ''), name: String(f.Measure.Property || '') }, s.Schema === 'extension' ? { report: true } : {}); }
  if (f.Aggregation) { const inner = fieldOf(f.Aggregation.Expression || {}); return inner ? Object.assign({}, inner, { kind: 'aggregation', agg: AGG[f.Aggregation.Function] || 'Agg' }) : null; }
  // (SQ6, 0.2.9-custom-visuals-S4) Power BI's auto date hierarchy has no SourceRef on the hierarchy: its date column is
  // the PropertyVariationSource's Entity and Property ("Date Hierarchy" is Power BI's name, not the report's)
  if (f.HierarchyLevel) {
    const h = ((f.HierarchyLevel.Expression || {}).Hierarchy) || {}, s = src(h), v = ((h.Expression || {}).PropertyVariationSource) || null, level = String(f.HierarchyLevel.Level || '');
    if (!s.Entity && !s.Source && v && v.Property) { const vs = src(v); return { kind: 'column', table: String(vs.Entity || vs.Source || ''), name: String(v.Property), level }; }
    return { kind: 'column', table: String(s.Entity || ''), name: String(h.Hierarchy || ''), level };
  }
  return null;
}
// a field as the answer writes it: Table[Column], [Measure], Sum(Table[Column]); names cleaned (they are untrusted)
export const refOf = (x) => {
  if (!x) return '(an expression)';
  const core = x.kind === 'measure' ? `[${safeName(x.name)}]${x.report ? '(report measure)' : ''}` : `${safeName(x.table)}[${safeName(x.name)}]${x.level ? '.' + safeName(x.level) : ''}`;
  return x.agg ? `${x.agg}(${core})` : core;
};
// the model's key of a column: "Table[Column]" (raw, for looking it up in the model; never returned as is)
export const keyOf = (x) => (x && x.kind !== 'measure' ? `${x.table}[${x.name}]` : null);
// the filters of a visual, page or report: the field and the kind of filter, never its values
// (A5-2: a filter list that cannot be read is no filters, never an error)
const safeFilters = (cfg) => { try { return filtersOf(cfg); } catch (e) { return []; } };
// (AF1, the release audit's F03: the first "Top":N or "Value":"NL" anywhere in the filter was taken, so a malformed TopN
// returned a saved In value as its count) a TopN's count, read only from its own subquery's Top: the subquery as Desktop
// writes it (From: [{ Type 2, Expression: { Subquery: { Query: { ..., Top: n } } } }]) or inside its In condition's
// Table (0.2.9c's shape); exactly one subquery; its Top a whole number, or a literal "<n>L" there
const topOf = (filter) => {
  const f = filter && typeof filter === 'object' ? filter : {};
  const subs = entries(f.From).filter((x) => x.Type === 2 && x.Expression && x.Expression.Subquery).map((x) => x.Expression.Subquery)
    .concat(entries(f.Where).map((w) => { const t = w.Condition && w.Condition.In && w.Condition.In.Table; return t && t.Expression && t.Expression.Subquery; }).filter(Boolean));
  if (subs.length !== 1) return null;
  const q = subs[0].Query, t = q && typeof q === 'object' ? q.Top : null;
  if (Number.isInteger(t) && t > 0) return t;
  const v = t && t.Literal && t.Literal.Value, m = typeof v === 'string' ? /^(\d{1,9})L$/.exec(v) : null;
  return m && +m[1] > 0 ? +m[1] : null;
};
function filtersOf(cfg) {
  return entries(cfg && cfg.filters).map((f) => {
    const field = fieldOf(f.field), s = JSON.stringify(f.filter || {});
    // "is not blank" (Advanced: Not over a comparison with null) or a basic filter leaving out (Blank): Not In null
    const notBlank = /^(Advanced|Categorical)$/.test(String(f.type)) && /"Not"/.test(s) && /"Value":"null"/.test(s);
    const top = f.type === 'TopN' ? topOf(f.filter) : null;
    return Object.assign({ field, type: String(f.type || 'unknown').replace(/[^A-Za-z]/g, '').slice(0, 30) || 'unknown', set: !!f.filter }, notBlank ? { notBlank: true } : {}, top ? { top: +top } : {});
  });
}
export const filterText = (f) => `${refOf(f.field)} (${f.notBlank ? 'not blank' : f.top ? 'top ' + f.top : f.type + (f.set ? ', set' : ', empty')})`;
const hex = (c) => (typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c) ? c.toLowerCase() : null);
// (0.3.2 DD2T) a text box's text: its paragraphs' texts (assets/js/text-runs.js), on one line: " / " between, trimmed
const textOf = (j) => TR.paragraphTexts(plain(((j.visual || {}).objects || {}).general).paragraphs).join(' / ').trim();
// Power BI's own visuals and slicers: Microsoft's catalog (assets/js/visual-types.js); a custom visual's type is its id
export const typeName = (t) => (t === 'group' || VT.isNative(t) ? t : 'custom ' + safeName(t));
// a custom visual's type: the one test (the cross-review's duplicates, 11 Oct: check_report used its own regex)
export const isCustom = (t) => VT.isCustom(t);

// (SQ15a, 0.2.9-reader-S4: the lab's list) the image files a visual's or a page's formatting names (a resource item of
// the report: its file name only, screened by the caller as every name; the file itself is not read here), at most 10
const imagesIn = (o) => { const out = []; const walk = (n, d) => { if (!n || typeof n !== 'object' || d > 12 || out.length >= 10) return;
  if (n.ResourcePackageItem && typeof n.ResourcePackageItem === 'object' && n.ResourcePackageItem.ItemName != null) { out.push(String(n.ResourcePackageItem.ItemName)); return; }
  (Array.isArray(n) ? n : Object.values(n)).forEach((c) => walk(c, d + 1)); }; walk(o, 0); return [...new Set(out)]; };
// a custom visual's name from its id, as Power BI writes an AppSource or organisation id (the name, then a timestamp or a
// GUID, "_OrgStore" for the organisation's copy): "ChicletSlicer1448559807354" is "Chiclet Slicer"; an id with
// nothing to take off has no name (never guessed from a vendor's list)
export const customNameOf = (t) => {
  const id = String(t || ''), s = id.replace(/_OrgStore$/i, '').replace(/[0-9A-F]{32}$/i, '').replace(/\d{6,}$/, '');
  if (s === id || !/^[A-Za-z]/.test(s)) return null;
  const w = s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').replace(/[_\-.]+/g, ' ').trim();
  return w ? safeName(w.charAt(0).toUpperCase() + w.slice(1)) : null;
};
// a group's decoration: a shape or an image with no field, text, title, action or tooltip page (the text answer folds
// two or more of a group into one line; the JSON keeps each)
const DECOR = new Set(['shape', 'basicShape', 'image']);
export const isDecor = (x) => !!(x.group && DECOR.has(x.type) && !Object.keys(x.fields || {}).length && !x.text && !x.title && !x.action && !x.tooltipPage);

// ---- the inventory: everything the layers above need, structured, from any source ----
// { name, pages, theme { name, dataColors, labelSize }, bookmarks, types, customVisuals, installedNotUsed, reportFilters,
//   unreadable, suspicious, sk }. A page: { id, n, name, rawName (never returned), w, h, kind, hidden, filters, visuals }.
// A visual: { id, type, x, y, w, h (on the page), z, group, groupName, hidden, hiddenByGroup, slicer, title (cleaned, for
// the lint; read_report returns a static one as staticTitle only, S1; rawTitle never returned), text (cleaned; rawText never returned), fields { Role: [field + queryRef, displayName] },
// sort, filters, action, tooltipPage, format { axisShare, axisFontSize, autoSize, growToFit, wordWrap, widths } }
// opts.pages: read the visuals of these pages only (every page.json is read); A5-9
export function inventory(src, reportName, opts) {
  const onlyPages = opts && opts.pages && opts.pages.length ? new Set(opts.pages) : null;
  let reads = 0;
  const sk = src.sk || { big: [], deep: 0 };
  const unreadableFiles = [], versions = {};
  sk.links = sk.links || [];
  // (F-R1/F-R2, the fuzz test: one shape check where a file comes in: a file that is not a JSON object is unreadable,
  // never read on; lists are read through entries() / names() only)
  const json = (rel) => { if (++reads > REPORT_LIMITS.files) { sk.capped = true; return null; } try { const j = src.json(rel); if (!j || typeof j !== 'object' || Array.isArray(j)) { unreadableFiles.push(rel); return null; } return j; } catch (e) { if (e instanceof TooBig) sk.big.push({ file: rel, size: e.size }); else if (e instanceof Linked) addLink(sk, e.rel || rel); else if (src.has(rel)) unreadableFiles.push(rel); return null; } };
  // the schema versions the files name (check_report's answer): family -> versions
  const note = (j) => { const u = String((j && j.$schema) || ''), m = /\/([A-Za-z]+)\/(\d+\.\d+\.\d+)\/schema(?:[.-]embedded)?\.json$/.exec(u); if (m) (versions[m[1]] = versions[m[1]] || new Set()).add(m[2]); return j; };
  const report = note(json('definition/report.json')) || {};
  const order = names((note(json('definition/pages/pages.json')) || {}).pageOrder);
  const ids = src.dirs('definition/pages');
  const pageIds = order.filter((id) => ids.includes(id)).concat(ids.filter((id) => !order.includes(id)));
  const pageJson = Object.fromEntries(pageIds.map((id) => [id, note(json(`definition/pages/${id}/page.json`)) || {}]));
  const pageName = (id) => (pageJson[id] ? safeName(pageJson[id].displayName || id) : safeName(id));
  const bmRaw = src.files('definition/bookmarks').filter((n) => /\.bookmark\.json$/i.test(n)).map((n) => ({ n, b: json('definition/bookmarks/' + n) })).filter((x) => x.b);
  const bmName = Object.fromEntries(bmRaw.map(({ b }) => [String(b.name), safeName(b.displayName || b.name)]));
  // the theme: report.json names its file in RegisteredResources; its name, colours (hex only) and label size
  const tc = report.themeCollection || {}, ref = tc.customTheme && tc.customTheme.name ? path.basename(String(tc.customTheme.name)) : null;
  const th = ref ? json('StaticResources/RegisteredResources/' + ref) : null;
  // (SQ6, audit-5-reading-S3) the base theme Power BI keeps beside it (SharedResources/BaseThemes, through this source's
  // checks), read once: its data colours are the report's when the custom theme gives none, as Power BI draws them
  const bt = tc.baseTheme && tc.baseTheme.name ? path.basename(String(tc.baseTheme.name)) : null;
  const baseJson = bt ? json(`StaticResources/SharedResources/BaseThemes/${bt}.json`) : null;
  const labelSize = +((((th || {}).textClasses || {}).label || {}).fontSize) || 10;
  const colours = th && Array.isArray(th.dataColors) ? th.dataColors : baseJson && Array.isArray(baseJson.dataColors) ? baseJson.dataColors : null;
  const theme = { name: safeName((th && th.name) || ref || (tc.baseTheme && tc.baseTheme.name) || 'default'), labelSize,
    ...(colours ? { dataColors: colours.map(hex).filter(Boolean).slice(0, 8) } : {}) };
  const suspicious = [];
  // (0.3.1 S1: length alone never makes a text suspicious; a long one is counted, as read_report shows it only by its length)
  let longTexts = 0;
  const flag = (kind, t, file) => { const s = String(t || ''); if (INSTRUCTION.test(s)) suspicious.push({ kind, file, why: 'reads like an instruction to an AI assistant' }); else if (s.length > LONG_TEXT) longTexts++; };
  const pages = pageIds.map((id, i) => {
    const prel = `definition/pages/${id}`, pj = pageJson[id];
    const page = { id, n: i + 1, name: pageName(id), rawName: String(pj.displayName || ''), w: +pj.width || 0, h: +pj.height || 0,
      kind: pj.type === 'Tooltip' ? 'Tooltip' : pj.pageBinding && /drill/i.test(String(pj.pageBinding.type || '')) ? 'Drillthrough' : null,
      hidden: pj.visibility === 'HiddenInViewMode', filters: safeFilters(pj.filterConfig), visuals: [], raw: pj, file: prel + '/page.json' };
    flag('page', page.rawName, prel + '/page.json');
    // (SQ15a) the page's background and wallpaper images, by file name
    const pob = (pj && pj.objects) || {}, bg = imagesIn(pob.background), wp = imagesIn(pob.outspace);
    bg.concat(wp).forEach((n) => flag('image', n, prel + '/page.json'));
    if (bg.length || wp.length) Object.assign(page, { images: bg.concat(wp).map(safeName) }, bg.length ? { background: bg.map(safeName) } : {}, wp.length ? { wallpaper: wp.map(safeName) } : {});
    const list = [];
    const vids = src.dirs(prel + '/visuals'); page.visualCount = vids.length;
    for (const vid of onlyPages && !onlyPages.has(i + 1) ? [] : vids) {
      const vrel = `${prel}/visuals/${vid}/visual.json`;
      if (!src.has(vrel)) continue;
      const j = note(json(vrel)); if (!j) continue;
      // (A5-2: a visual that cannot be read, whatever is wrong inside it, goes to the unreadable files; the others stay)
      try {
      const pos = j.position || {};
      // (the raw JSON and the phone layout stay inside the reading block's callers: check_report's measured rules and the
      // twin read them; no answer ever carries them)
      const mrel = `${prel}/visuals/${vid}/mobile.json`, mobile = src.has(mrel) ? note(json(mrel)) : null;
      const x = { id: String(j.name || vid), file: vrel, json: j, mobile, mobileFile: mobile ? mrel : null, rx: +pos.x || 0, ry: +pos.y || 0, w: +pos.width || 0, h: +pos.height || 0, z: +pos.z || 0, group: j.parentGroupName ? String(j.parentGroupName) : null, hidden: !!j.isHidden };
      flag('visual', j.name, vrel);
      if (j.visualGroup) { Object.assign(x, { type: 'group', groupTitle: String(j.visualGroup.displayName || '') }); list.push(x); continue; }
      const v = j.visual || {}, vco = v.visualContainerObjects || {}, o = v.objects || {};
      x.type = String(v.visualType || 'unknown');
      const t = plain(vco.title), tp = t.text;
      // (A4-8, audit 4: a title switched off, for the lint's NO_TITLE; with no title setting Power BI draws its own title)
      if (litBool(t.show) === false) x.titleOff = true;
      if (litBool(t.show) !== false && tp) { const lt = litStr(tp); if (lt != null) { x.rawTitle = lt; x.title = safeText(lt); flag('title', lt, vrel); } else if (tp.expr) { const f = fieldOf(tp.expr); x.title = 'fx ' + refOf(f); } }
      x.fields = {};
      Object.entries((v.query || {}).queryState || {}).forEach(([role, r]) => { const l = entries(r && r.projections).map((p) => Object.assign({}, fieldOf(p.field) || { kind: 'other' }, { queryRef: String(p.queryRef || '') }, p.displayName ? { displayName: String(p.displayName) } : {})); if (l.length) x.fields[role] = l; });
      // (SQ15a) the drill level shown: in a role of several fields (a hierarchy's levels), the ones Power BI marks active.
      // A field, never a value drilled into
      const drill = Object.values((v.query || {}).queryState || {}).flatMap((r) => { const ps = entries(r && r.projections); return ps.length > 1 ? ps.filter((q) => q.active === true).map((q) => refOf(fieldOf(q.field) || { kind: 'other' })) : []; });
      if (drill.length) x.drillLevel = drill.join(', ');
      const imgs = imagesIn([o, vco]); if (imgs.length) { imgs.forEach((n) => flag('image', n, vrel)); x.images = imgs.map(safeName); }
      x.sort = entries(((v.query || {}).sortDefinition || {}).sort).map((s) => ({ field: fieldOf(s.field), dir: /desc/i.test(String(s.direction || '')) ? 'desc' : 'asc' }));
      x.filters = safeFilters(j.filterConfig);
      if (VT.isSlicer(x.type)) x.slicer = true;
      if (x.type === 'textbox') { const tx = textOf(j); if (tx) { x.rawText = tx; x.text = safeText(tx); flag('textbox', tx, vrel); } }
      const link = plain(vco.visualLink), ltype = litStr(link.type);
      if (ltype && (litBool(link.show) === true || x.type === 'actionButton')) {
        const pg = litStr(link.navigationSection), bm = litStr(link.bookmark);
        x.action = ltype.replace(/[^A-Za-z]/g, '').slice(0, 30) + (bm ? ` -> bookmark "${bmName[bm] || safeName(bm)}"` : '') + (pg ? ` -> page "${pageName(pg)}"` : '') + (litStr(link.webUrl) ? ' -> a web address' : '');
      }
      const tip = litStr(plain(vco.visualTooltip).section); if (tip) x.tooltipPage = pageName(tip);
      const ch = anyOf(o.columnHeaders), ca = anyOf(o.categoryAxis), vals = anyOf(o.values);
      const widths = {}; entries(o.columnWidth).forEach((e) => { const k = e && e.selector && e.selector.metadata, w = litNum(((e || {}).properties || {}).value); if (k && w != null) widths[k] = w; });
      // (A5-13: a custom visual's formatting objects by name, never their values: what a replacement would lose)
      if (VT.isCustom(x.type, report)) { const ob = Object.keys(o).filter((k) => k !== 'general').sort().slice(0, 30).map(safeName); if (ob.length) x.customObjects = ob; }
      const meaning = meaningInReport(x, report, { customObjects: x.customObjects }); if (meaning) x.meaning = meaning; // custom visuals: what it shows, its native replacement
      x.format = { axisShare: litNum(ca.maxMarginFactor), axisFontSize: litNum(ca.fontSize), autoSize: litBool(ch.autoSizeColumnWidth), growToFit: litStr(ch.columnAdjustment) === 'growToFit', wordWrap: litBool(vals.wordWrap), widths };
      list.push(x);
      } catch (e) { unreadableFiles.push(vrel); }
    }
    // positions on the page: a visual inside a group is placed relative to the group; hidden with its group
    const by = Object.fromEntries(list.map((x) => [x.id, x]));
    const placed = list.map((x) => { let gx = 0, gy = 0, g = x.group, d = 0, hid = false; while (g && by[g] && d++ < 10) { gx += by[g].rx; gy += by[g].ry; hid = hid || by[g].hidden; g = by[g].group; } return { gx, gy, hid }; });
    list.forEach((x, k) => { const q = placed[k]; if (q.hid) x.hiddenByGroup = true; if (x.group && by[x.group]) x.groupName = safeName(by[x.group].groupTitle || x.group);
      // (to 0.1 on the page, as check_report's measured rules have always read them; the answers round)
      Object.assign(x, { x: Math.round((x.rx + q.gx) * 10) / 10, y: Math.round((x.ry + q.gy) * 10) / 10 }); });
    list.forEach((x) => { delete x.rx; delete x.ry; });
    // (kept in the folder's order, as check_report's rules always read them; the answers sort by place)
    page.visuals = list;
    return page;
  });
  const bookmarks = bmRaw.map(({ n, b }) => { flag('bookmark', b.displayName, 'definition/bookmarks/' + n); const o = b.options || {}, st = b.explorationState || {};
    return { file: 'definition/bookmarks/' + n, rawName: String(b.displayName || ''), raw: b, name: safeName(b.displayName || b.name || n), page: st.activeSection ? pageName(String(st.activeSection)) : null, data: !o.suppressData, display: !o.suppressDisplay, targets: names(o.targetVisualNames).length || 'all' }; });
  const types = {}; pages.forEach((p) => p.visuals.forEach((x) => { types[x.type] = (types[x.type] || 0) + 1; }));
  const custom = Object.keys(types).filter((t) => VT.isCustom(t, report));
  // (A5-10, audit 5: where each custom visual comes from, as report.json lists them: AppSource (publicCustomVisuals), the
  // organisation's (organizationCustomVisuals), or private (a CustomVisual resource package inside the report); its
  // package is not read: its layout on disk is to be measured on a saved report first)
  const pub = names(report.publicCustomVisuals), orgs = names(report.organizationCustomVisuals),
    priv = entries(report.resourcePackages).filter((p) => /customvisual/i.test(String(p.type || ''))).flatMap((p) => [String(p.name || '')].concat(names(p.items)));
  const sourceOf = (t) => (pub.includes(t) ? 'appsource' : orgs.includes(t) ? 'organization' : priv.includes(t) ? 'private' : 'unknown');
  const installedNotUsed = [...new Set(pub.concat(orgs))].filter((t) => !custom.includes(t)).length;
  return { name: safeName(reportName || 'report'), pages, theme, themeFile: ref ? 'StaticResources/RegisteredResources/' + ref : null, themeJson: th, themeRef: ref, baseJson, report,
    hasPlatform: src.has('.platform'), versions: Object.fromEntries(Object.entries(versions).map(([k, v]) => [k, [...v].sort()])),
    bookmarks, bookmarkFiles: src.files('definition/bookmarks').filter((n) => /\.bookmark\.json$/i.test(n)).length, types, customVisuals: custom.map((t) => Object.assign({ type: safeName(t) }, customNameOf(t) ? { name: customNameOf(t) } : {}, { source: sourceOf(t) })), installedNotUsed, reportFilters: safeFilters(report.filterConfig), unreadable: unreadableFiles.length, unreadableFiles, suspicious, longTexts, sk };
}
