// The Arabic twin, step 4: English and Arabic in ONE report, the copy "<name> (EN-AR)": the language buttons, their
// tab order and the copy's pages, links and bookmarks.
// (0.3.1 S9: moved out of lib/arabic-twin.mjs as it was, no change of behaviour; arabic-twin.mjs re-exports what others import)
import path from 'node:path';
import crypto from 'node:crypto';
import { canSync, safeName, mustJson } from './read-report.mjs';
import { json, jsonAt, isObj, EXT, pageOf } from './twin-read.mjs';
import { posOf, typeOf, clone, litStr, Lv, Ls, isPageBtn, overlaps, holdsBox, absBox, idMaker, textLook, hexOf, solid } from './twin-visuals.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js');
const Rules = require('../../assets/js/report-rules.js');
const Sizing = require('../../assets/js/pbip-sizing.js');
const Engine = require('../../assets/js/design-engine.js');
const A11y = require('../../assets/js/report-a11y.js');

// ---- (0.3.0 X1, the owner, 19 Oct: "add the toggle") English and Arabic in ONE report: the copy "<name> (EN-AR)" ----
// The copy holds the original's files as they are (the English pages), and beside them each page's Arabic page exactly as
// the twin builds it (buildTwin). The Arabic pages get new page ids, visual names and bookmark names (hashes of the
// original's, so the plan and the write give the same; never one the report has), and every link of theirs (page buttons,
// tooltip pages, drillthrough, bookmarks) goes to the Arabic one. Each page gets a language button to its counterpart; each
// slicer pair one sync group (visual.syncGroup, the visualConfiguration schema's VisualSyncGroup); the counterpart
// language's pages are hidden from the tabs (HiddenInViewMode). The original is only read.
// a report's .platform as create_report writes it (pbip-export.js): its type, its name, a new logical id
export const newPlatform = (name) => json({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json', metadata: { type: 'Report', displayName: name }, config: { version: '2.0', logicalId: crypto.randomUUID() } });
export const COPY_TAG = ' (EN-AR)';
export const LANG = { en: { text: 'العربية', alt: 'Show this page in Arabic', on: 'English' }, ar: { text: 'English', alt: 'اعرض هذه الصفحة بالإنجليزية', on: 'Arabic' } };
const VC_SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
const MOBILE_SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainerMobileState/2.1.0/schema.json';
function plainLook(page, theme) {
  const th = isObj(theme) ? theme : {}, tc = isObj(th.textClasses) && isObj(th.textClasses.label) ? th.textClasses.label : {};
  const pageBg = (() => { const o = isObj(page) && isObj(page.objects) && Array.isArray(page.objects.background) ? page.objects.background.find((e) => isObj(e) && isObj(e.properties) && !e.selector) : null; return o ? hexOf(o.properties.color) : null; })();
  const vs = isObj(th.visualStyles) && isObj(th.visualStyles.page) && isObj(th.visualStyles.page['*']) && Array.isArray(th.visualStyles.page['*'].background) ? th.visualStyles.page['*'].background[0] : null;
  const bg = pageBg || (isObj(vs) ? hexOf(vs.color) : null) || hexOf(th.background) || '#FFFFFF';
  const want = hexOf(th.foreground) || hexOf(th.firstLevelElements) || hexOf(tc.color) || '#252423';
  const text = Engine.contrast(want, bg) >= 4.5 ? want : (Engine.contrast('#252423', bg) >= Engine.contrast('#FFFFFF', bg) ? '#252423' : '#FFFFFF');
  return { text, bg };
}
export function langButton(page, visuals, mobiles, lang, target, name, theme) {
  const W = LANG[lang], pw = isObj(page) && Number.isFinite(page.width) ? page.width : 1280, ph = isObj(page) && Number.isFinite(page.height) ? page.height : 720;
  const tabs = visuals.filter((v) => isObj(v) && isObj(v.visual) && isPageBtn(v) && posOf(v));
  const tpl = tabs.find((v) => !textLook(v).bold) || tabs[0] || null, look = tpl ? textLook(tpl) : {};
  const t = Number.isFinite(look.size) ? look.size : Math.max(8, Math.round(14 * ph / 1080)), font = look.font || 'Segoe UI';
  let btn;
  if (tpl) {
    btn = clone(tpl); delete btn.parentGroupName; delete btn.filterConfig;
    const o = btn.visual.objects;
    // the show switch alone, without a selector; no show inside a selector (Desktop ignores it there)
    o.text = (Array.isArray(o.text) ? o.text : []).filter((e) => isObj(e) && isObj(e.properties));
    o.text.forEach((e) => { if (e.selector) delete e.properties.show; });
    o.text = o.text.filter((e) => Object.keys(e.properties).length);
    if (!o.text.some((e) => !e.selector && 'show' in e.properties)) o.text.unshift({ properties: { show: Lv('true') } });
    let d = o.text.find((e) => isObj(e.selector) && e.selector.id === 'default'); if (!d) o.text.push(d = { properties: {}, selector: { id: 'default' } });
    Object.assign(d.properties, { text: Ls(W.text), bold: Lv('false') });
  } else {
    const c = plainLook(page, theme).text, offs = { background: [{ properties: { show: Lv('false') } }], border: [{ properties: { show: Lv('false') } }], dropShadow: [{ properties: { show: Lv('false') } }] };
    btn = { $schema: VC_SCHEMA, name, position: {}, visual: { visualType: 'actionButton', objects: { icon: [{ properties: { shapeType: Ls('blank') }, selector: { id: 'default' } }],
      text: [{ properties: { show: Lv('true') } }, { properties: { text: Ls(W.text), fontColor: solid(c), fontFamily: Ls(font), fontSize: Lv(t + 'D') }, selector: { id: 'default' } }],
      fill: [{ properties: { show: Lv('false') } }], outline: [{ properties: { show: Lv('true') } }, { properties: { lineColor: solid(c) }, selector: { id: 'default' } }] }, visualContainerObjects: Object.assign({ title: [{ properties: { show: Lv('false') } }] }, offs) } };
  }
  btn.name = name;
  const vco = btn.visual.visualContainerObjects = isObj(btn.visual.visualContainerObjects) ? btn.visual.visualContainerObjects : {};
  vco.general = [{ properties: { altText: Ls(W.alt) } }];
  vco.visualLink = [{ properties: { show: Lv('true'), type: Ls('PageNavigation'), navigationSection: Ls(target) } }];
  delete vco.visualTooltip;
  const need = Rules.buttonNeed({ json: btn, type: 'actionButton', h: 0, w: 0 }, { labelSize: t, font });
  const w = Math.max(need ? need.one : 0, Math.ceil(Rules.MEASURED.BTN_TW(t, [...W.text].length))), h = Math.max(tpl ? posOf(tpl).height : 0, need ? need.needH : Rules.MEASURED.BTN_H(t));
  // where: the tabs' group (else the page), at the tabs' height (else near the top), from its end
  const g = tpl && tpl.parentGroupName != null ? visuals.find((v) => isObj(v) && v.name === tpl.parentGroupName && posOf(v)) : null;
  const room = g ? posOf(g).width : pw, y0 = tpl ? posOf(tpl).y : Math.round(8 * ph / 720), off = g ? absBox(visuals, g) : { x: 0, y: 0 };
  const obst = visuals.filter((v) => isObj(v) && !isObj(v.visualGroup) && posOf(v)).map((v) => absBox(visuals, v)).filter(Boolean);
  const free = (x) => { const A = { x: off.x + x, y: off.y + y, width: w, height: h }; return A.x >= -0.5 && A.x + w <= pw + 0.5 && A.y >= -0.5 && A.y + h <= ph + 0.5 && !obst.some((b) => overlaps(b, A) && !holdsBox(b, A)); };
  const xs = []; for (let x = Math.floor(room - w); x >= 0; x--) xs.push(x); if (lang === 'ar') xs.reverse();
  // (0.3.1 X2: a page with no page tabs and no header, the metric switcher's, starts its visuals near the top) at the
  // tabs' height; else near the top, then the first free row of the page's top quarter, from its end
  let y = y0, x = xs.find(free);
  if (x == null && !tpl) for (let yy = 0; yy + h <= ph / 4 && x == null; yy++) { y = yy; x = xs.find(free); }
  if (x == null) return { json: null, why: `no free place ${w} x ${h} at the ${lang === 'ar' ? 'left' : 'right'} end of ${g ? 'the header (the page tabs\' group)' : 'the top of the page'}: the page is written without it; add the button by hand` };
  const zs = visuals.filter((v) => posOf(v)).map((v) => posOf(v)), top = (k) => Math.max(0, ...zs.map((p) => (Number.isFinite(p[k]) ? p[k] : 0)));
  btn.position = { x, y, z: top('z') + 1000, height: h, width: w, tabOrder: top('tabOrder') + 1000 };
  if (g) btn.parentGroupName = g.name;
  const at = g ? `the ${lang === 'ar' ? 'left' : 'right'} end of the header, beside the page tabs` : `the top ${lang === 'ar' ? 'left' : 'right'} of the page`;
  // the phone
  if (!mobiles.some(Boolean)) return { json: btn, mobile: null, phone: false, at, why: 'the page has no phone layout' };
  const ptabs = tabs.map((v) => mobiles[visuals.indexOf(v)]).filter((m) => m && posOf(m)), mt = (tpl && mobiles[visuals.indexOf(tpl)] && posOf(mobiles[visuals.indexOf(tpl)])) ? mobiles[visuals.indexOf(tpl)] : ptabs[0];
  if (!mt) return { json: btn, mobile: null, phone: false, at, why: 'the phone layout has no page tabs to sit beside: the button is on the page only' };
  const PW = Mirror.PHONE_W, my = posOf(mt).y, mh = posOf(mt).height, mw = Math.min(PW, Sizing.phoneTabWidth(W.text, font));
  const mob = visuals.map((v, i) => (isObj(v) && !isObj(v.visualGroup) && mobiles[i] && posOf(mobiles[i]) ? posOf(mobiles[i]) : null)).filter(Boolean);
  const mfree = (x0) => { const A = { x: x0, y: my, width: mw, height: mh }; return !mob.some((b) => overlaps(b, A)); };
  const mxs = []; for (let x0 = Math.floor(PW - mw); x0 >= 0; x0--) mxs.push(x0); if (lang === 'ar') mxs.reverse();
  const mx = mxs.find(mfree);
  if (mx == null) return { json: btn, mobile: null, phone: false, at, why: `no free place ${mw} wide in the phone layout's tab row: the button is on the page only` };
  const mz = mobiles.filter((m) => m && posOf(m)).map(posOf), mtop = (k) => Math.max(0, ...mz.map((p) => (Number.isFinite(p[k]) ? p[k] : 0)));
  const mobile = Object.assign(clone(mt), { position: { x: mx, y: my, z: mtop('z') + 1000, width: mw, height: mh, tabOrder: mtop('tabOrder') + 1000 } });
  if (!mobile.$schema) mobile.$schema = MOBILE_SCHEMA;
  // the group's phone box holds what is in it (a grouped visual's phone position is a page position)
  if (g) { const gi = visuals.indexOf(g), gb = mobiles[gi] && posOf(mobiles[gi]); if (gb) { const x0 = Math.min(gb.x, mx), x1 = Math.max(gb.x + gb.width, mx + mw), y0 = Math.min(gb.y, my), y1 = Math.max(gb.y + gb.height, my + mh); Object.assign(gb, { x: x0, width: x1 - x0, y: y0, height: y1 - y0 }); } }
  return { json: btn, mobile, phone: true, at };
}

// (0.3.1 R1: check_report found 8 and 7 Tab stop pairs against the reading order on a real user's two Arabic pages) the
// mirror maps a page's reading order to the right-to-left one exactly (each place mirrored, the numbers kept); what broke
// it was the language button, last in the tab order at the top of the page. It takes its place in its page's (or
// group's) reading order instead (left to right on an English page, right to left on an Arabic one: check_report's own
// count, report-a11y.js inversions): a free number between its neighbours, else the stops after it move up by one, in
// their order. The other stops keep their order: the page's tab order is its author's
function tabInOrder(visuals, btn, dir) {
  const parent = (v) => (v.parentGroupName != null ? String(v.parentGroupName) : ''), box = (v) => ({ x: posOf(v).x, y: posOf(v).y, w: posOf(v).width, h: posOf(v).height });
  const sibs = visuals.filter((v) => v !== btn && isObj(v) && posOf(v) && Number.isFinite(posOf(v).tabOrder) && parent(v) === parent(btn)).sort((a, b) => posOf(a).tabOrder - posOf(b).tabOrder);
  if (!sibs.length) return;
  let at = sibs.length, least = Infinity;
  for (let k = 0; k <= sibs.length; k++) { const n = A11y.inversions(sibs.slice(0, k).concat([btn], sibs.slice(k)).map(box), dir); if (n < least) { least = n; at = k; } }
  if (at === sibs.length) return;   // last already
  const prev = at > 0 ? posOf(sibs[at - 1]).tabOrder : null, next = posOf(sibs[at]).tabOrder;
  if (prev == null ? next >= 1 : next - prev >= 2) { btn.position.tabOrder = prev == null ? Math.floor(next / 2) : prev + Math.floor((next - prev) / 2); return; }
  btn.position.tabOrder = next;
  sibs.slice(at).forEach((v) => { v.position.tabOrder = posOf(v).tabOrder + 1; });
}

// P: the plan's own (R, keepLtr, tabsShown); built: buildTwin's; labels: by the mirror engine's ids. Returns the copy as
// a list of files { rel, data } (data: the bytes to write, or from: the original's file copied as it is), and what the
// plan says: pairs, buttons, syncGroups, bookmarks, tabs
export function languageCopy(P, built, labels) {
  const { R, loc } = P, tabsShown = P.tabsShown === 'ar' ? 'ar' : 'en', hidden = 'HiddenInViewMode';
  const newId = idMaker([].concat(R.pages.map((pg) => pg.id), ...R.pages.map((pg) => pg.visuals.map((v) => v.json.name)), R.bookmarks.map((b) => b.json.name)));
  const arOf = new Map(R.pages.map((pg) => [String(pg.id), newId('page\u0000' + pg.id)])), names = new Map();
  R.pages.forEach((pg) => names.set(String(pg.id), new Map(pg.visuals.map((v) => [String(v.json.name), newId('visual\u0000' + arOf.get(String(pg.id)) + '\u0000' + v.json.name)]))));
  const bmOf = new Map(R.bookmarks.map((b) => [String(b.json.name), newId('bookmark\u0000' + b.json.name)]));
  const changed = new Map(), added = [], pairs = [], buttons = [], syncGroups = [];
  const jsonEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // an Arabic visual's names and links: its own name and group, its page links, tooltip pages, drillthrough and bookmarks
  // (Microsoft's validator, PBIR_FILTER_NAME_DUPLICATE_GLOBAL: a filter's name is unique across the report) each filter of
  // an Arabic page or visual gets its own name, by page (fm: old name -> new), which its bookmarks follow
  const filtersOf = new Map();
  const renameFilters = (o, arId, owner) => { const fs0 = isObj(o) && isObj(o.filterConfig) && Array.isArray(o.filterConfig.filters) ? o.filterConfig.filters : [];
    if (!filtersOf.has(arId)) filtersOf.set(arId, new Map()); const fm = filtersOf.get(arId);
    fs0.forEach((f) => { if (isObj(f) && f.name != null) { const to = newId('filter\u0000' + arId + '\u0000' + owner + '\u0000' + f.name); fm.set(String(f.name), to); f.name = to; } }); };
  const remap = (vj, nm) => {
    if (!isObj(vj)) return;
    if (vj.name != null && nm.has(String(vj.name))) vj.name = nm.get(String(vj.name));
    if (vj.parentGroupName != null && nm.has(String(vj.parentGroupName))) vj.parentGroupName = nm.get(String(vj.parentGroupName));
    const vco = isObj(vj.visual) && isObj(vj.visual.visualContainerObjects) ? vj.visual.visualContainerObjects : null;
    if (vco) ['visualLink', 'visualTooltip'].forEach((k) => (Array.isArray(vco[k]) ? vco[k] : []).forEach((e) => {
      if (!isObj(e) || !isObj(e.properties)) return;
      ['navigationSection', 'section', 'drillthroughSection'].forEach((p) => { const v = litStr(e.properties[p]); if (v != null && arOf.has(v)) e.properties[p] = Ls(arOf.get(v)); });
      const b = litStr(e.properties.bookmark); if (b != null && bmOf.has(b)) e.properties.bookmark = Ls(bmOf.get(b));
    }));
  };
  let n = 0;
  built.pages.forEach(({ pg, page, visuals, mobiles }) => {
    const id = String(pg.id), arId = arOf.get(id), nm = names.get(id), folder = pg.rel.slice(0, pg.rel.lastIndexOf('/') + 1), arFolder = 'definition/pages/' + arId + '/';
    const P0 = pageOf(pg), tooltip = P0.type === 'Tooltip', drill = isObj(P0.pageBinding) && /drillthrough/i.test(String(P0.pageBinding.type || ''));
    // the English page: the original's, its page hidden when the Arabic tabs are the ones shown
    const enPage = isObj(pg.page) ? clone(pg.page) : pg.page, enV = pg.visuals.map((v) => clone(v.json)), enM = pg.visuals.map((v) => (v.mobile ? clone(v.mobile.json) : null));
    if (isObj(enPage) && tabsShown === 'ar') enPage.visibility = hidden;
    // the Arabic page: the twin's, under its new id, hidden when the English tabs are shown
    const arPage = isObj(page) ? clone(page) : page, arV = visuals.map((v) => clone(v)), arM = (mobiles || []).map((m) => clone(m || null));
    if (isObj(arPage)) {
      arPage.name = arId;
      if (isObj(arPage.pageBinding) && arPage.pageBinding.name != null) arPage.pageBinding.name = newId('binding\u0000' + arId);
      if (tabsShown === 'en') arPage.visibility = hidden;
      if (Array.isArray(arPage.visualInteractions)) arPage.visualInteractions.forEach((x) => { if (isObj(x)) ['source', 'target'].forEach((k) => { if (x[k] != null && nm.has(String(x[k]))) x[k] = nm.get(String(x[k])); }); });
    }
    arV.forEach((v, i) => { renameFilters(v, arId, String(pg.visuals[i] ? pg.visuals[i].json.name : i)); remap(v, nm); });
    if (isObj(arPage)) renameFilters(arPage, arId, '');
    // each slicer pair in one sync group: a group the English slicer has already, else its own
    pg.visuals.forEach((v, i) => {
      // (0.3.1 X2) every slicer kind Microsoft's catalog says Power BI keeps in sync (the slicer, the button slicer's pills,
      // the list and text slicers), of one field (Power BI syncs a slicer of one field only)
      if (!canSync(typeOf(enV[i])) || !isObj(arV[i]) || !isObj(arV[i].visual)) return;
      const has = isObj(enV[i].visual.syncGroup) && typeof enV[i].visual.syncGroup.groupName === 'string' && enV[i].visual.syncGroup.groupName;
      const ps = isObj(enV[i].visual.query) && isObj(enV[i].visual.query.queryState) ? Object.values(enV[i].visual.query.queryState).flatMap((r) => (isObj(r) && Array.isArray(r.projections) ? r.projections : [])) : [];
      const q = ps.map((p) => (isObj(p) && typeof p.queryRef === 'string' ? p.queryRef : '')).find(Boolean) || 'Slicer';
      if (ps.length > 1) return;
      if (!has) enV[i].visual.syncGroup = { groupName: `${q.slice(0, 80)} (EN-AR ${++n})`, fieldChanges: true, filterChanges: true };
      arV[i].visual.syncGroup = clone(enV[i].visual.syncGroup);
      syncGroups.push({ page: safeName(typeof P0.displayName === 'string' ? P0.displayName : id), slicer: safeName(String(v.json.name)), arabicSlicer: nm.get(String(v.json.name)), group: safeName(enV[i].visual.syncGroup.groupName), ...(has ? { kept: 'the English slicer\'s own sync group: its Arabic copy joins it' } : {}) });
    });
    // the language buttons (a tooltip or drillthrough page is reached by its visual, not by the tabs: none)
    const say = (lang, r, pageName, target) => buttons.push(Object.assign({ page: safeName(pageName), on: LANG[lang].on, text: LANG[lang].text, goesTo: target, placed: !!r.json }, r.json ? { at: r.at, phone: r.phone } : {}, r.why ? { why: r.why } : {}));
    if (!tooltip && !drill) {
      const en = langButton(enPage, enV, enM, 'en', arId, newId('button\u0000' + id), R.theme);
      if (en.json) { tabInOrder(enV, en.json, 'ltr'); enV.push(en.json); enM.push(en.mobile); added.push({ rel: folder + 'visuals/' + en.json.name + '/visual.json', data: json(en.json) }); if (en.mobile) added.push({ rel: folder + 'visuals/' + en.json.name + '/mobile.json', data: json(en.mobile) }); }
      say('en', en, typeof P0.displayName === 'string' ? P0.displayName : id, arId);
      const ar = langButton(arPage, arV, arM, 'ar', id, newId('button\u0000' + arId), R.theme);
      if (ar.json) { tabInOrder(arV, ar.json, P.keepLtr(pg) ? 'ltr' : 'rtl'); arV.push(ar.json); arM.push(ar.mobile); added.push({ rel: arFolder + 'visuals/' + ar.json.name + '/visual.json', data: json(ar.json) }); if (ar.mobile) added.push({ rel: arFolder + 'visuals/' + ar.json.name + '/mobile.json', data: json(ar.mobile) }); }
      say('ar', ar, isObj(arPage) && typeof arPage.displayName === 'string' ? arPage.displayName : arId, id);
    }
    // the English files that changed (the slicers' sync group, a group's phone box grown, the page hidden)
    if (isObj(enPage) && !jsonEq(enPage, pg.page)) changed.set(pg.rel, json(enPage));
    pg.visuals.forEach((v, i) => { if (!jsonEq(enV[i], v.json)) changed.set(v.rel, json(enV[i])); if (v.mobile && !jsonEq(enM[i], v.mobile.json)) changed.set(v.mobile.rel, json(enM[i])); });
    // the Arabic page's files: every file of the English page's folder, under the new page id and visual names
    const folderOf = new Map(pg.visuals.map((v, i) => [v.rel.split('/')[4], i]));
    R.files.filter((f) => f.startsWith(folder)).forEach((f) => {
      const segs = f.split('/'), i = segs[3] === 'visuals' && folderOf.has(segs[4]) ? folderOf.get(segs[4]) : -1;
      segs[2] = arId; if (i >= 0) segs[4] = nm.get(String(pg.visuals[i].json.name));
      const rel = segs.join('/');
      if (f === pg.rel && isObj(arPage)) added.push({ rel, data: json(arPage) });
      else if (i >= 0 && f === pg.visuals[i].rel) added.push({ rel, data: json(arV[i]) });
      else if (i >= 0 && pg.visuals[i].mobile && f === pg.visuals[i].mobile.rel && arM[i]) added.push({ rel, data: json(arM[i]) });
      else added.push({ rel, from: f });
    });
    const shown = (pgj) => !(isObj(pgj) && pgj.visibility === hidden);
    pairs.push(Object.assign({ english: { id: safeName(id), name: safeName(typeof P0.displayName === 'string' ? P0.displayName : ''), hidden: !shown(enPage) },
      arabic: { id: arId, name: safeName(isObj(arPage) && typeof arPage.displayName === 'string' ? arPage.displayName : ''), hidden: !shown(arPage) } }, tooltip ? { tooltip: true } : {}, drill ? { drillthrough: true } : {}));
  });
  // the bookmarks: an Arabic copy of each (its pages and visuals the Arabic ones, its name as approved), listed after the English
  const BM = 'definition/bookmarks/bookmarks.json';
  R.bookmarks.forEach((b) => {
    const j = clone(b.json), key = String(b.json.name), es = isObj(j.explorationState) ? j.explorationState : null, act = es && es.activeSection != null ? String(es.activeSection) : '';
    if (labels['bookmark:' + key] != null) j.displayName = labels['bookmark:' + key];
    j.name = bmOf.get(key);
    if (es) {
      if (arOf.has(act)) es.activeSection = arOf.get(act);
      // the filters it names (by name, in "byName" lists) are the Arabic page's own
      const byName = (o, fm) => { if (Array.isArray(o)) { o.forEach((x) => byName(x, fm)); return; } if (!isObj(o)) return; Object.keys(o).forEach((k) => { if (k === 'byName' && isObj(o[k])) o[k] = Object.fromEntries(Object.entries(o[k]).map(([fn, v]) => [fm.has(fn) ? fm.get(fn) : fn, v])); byName(o[k], fm); }); };
      if (isObj(es.sections)) Object.entries(es.sections).forEach(([k, sec]) => { if (arOf.has(k)) byName(sec, filtersOf.get(arOf.get(k)) || new Map()); });
      if (isObj(es.sections)) es.sections = Object.fromEntries(Object.entries(es.sections).map(([k, sec]) => { const m = names.get(k) || new Map();
        if (isObj(sec)) ['visualContainers', 'visualContainerGroups'].forEach((x) => { if (isObj(sec[x])) sec[x] = Object.fromEntries(Object.entries(sec[x]).map(([vn, v]) => [m.has(vn) ? m.get(vn) : vn, v])); });
        return [arOf.has(k) ? arOf.get(k) : k, sec]; }));
    }
    if (isObj(j.options) && Array.isArray(j.options.targetVisualNames)) { const m = names.get(act) || new Map(); j.options.targetVisualNames = j.options.targetVisualNames.map((x) => (m.has(String(x)) ? m.get(String(x)) : x)); }
    added.push({ rel: b.rel.replace(/[^/]+$/, j.name + '.bookmark.json'), data: json(j) });
  });
  if (R.bookmarks.length && R.files.includes(BM)) { try { const j = jsonAt(loc, BM); if (isObj(j) && Array.isArray(j.items)) {
    const item = (it) => (!isObj(it) ? it : Array.isArray(it.children) ? Object.assign(clone(it), { name: newId('bookmarkGroup\u0000' + it.name), children: it.children.map((c) => bmOf.get(String(c)) || c) }) : Object.assign(clone(it), { name: bmOf.get(String(it.name)) || it.name }));
    j.items = j.items.concat(j.items.map(item)); changed.set(BM, json(j)); } } catch (e) { /* not JSON: copied as it is */ } }
  // pages.json: the English pages, then the Arabic ones in the same order; the first page opened in the language shown
  const PJ = 'definition/pages/pages.json';
  let activePage = null;
  if (R.files.includes(PJ)) { try { const j = jsonAt(loc, PJ); if (isObj(j)) {
    const order = Array.isArray(j.pageOrder) ? j.pageOrder.map(String) : R.pages.map((pg) => String(pg.id));
    j.pageOrder = order.concat(order.filter((x) => arOf.has(x)).map((x) => arOf.get(x)));
    const first = j.activePageName != null && arOf.has(String(j.activePageName)) ? String(j.activePageName) : order.find((x) => arOf.has(x) && !(pairs.find((p) => p.english.id === safeName(x)) || {}).tooltip);
    if (tabsShown === 'ar' && first) j.activePageName = arOf.get(first);
    activePage = j.activePageName != null ? safeName(String(j.activePageName)) : null;
    changed.set(PJ, json(j)); } } catch (e) { /* not JSON: copied as it is */ } }
  if (built.ext) changed.set(EXT, json(built.ext));
  // (0.3.1 X2) a report built in English and Arabic keeps its own name (P.name): it is new, not a copy
  if (R.hasPlatform) { const pl = loc.mem ? jsonAt(loc, '.platform') : mustJson(path.join(loc.dir, '.platform'), '.platform'); pl.metadata = Object.assign({}, pl.metadata, { displayName: P.name || loc.base + COPY_TAG }); pl.config = Object.assign({}, pl.config, { logicalId: crypto.randomUUID() }); changed.set('.platform', json(pl)); }
  // (0.3.0 A1) a report without .platform (the validator's PBIR_PLATFORM_MISSING, a "can break"): the twin writes its own, as create_report does
  else changed.set('.platform', newPlatform(P.name || loc.base + COPY_TAG));
  const files = R.files.map((rel) => (changed.has(rel) ? { rel, data: changed.get(rel) } : { rel, from: rel })).concat(R.hasPlatform ? [] : [{ rel: '.platform', data: changed.get('.platform') }], built.ext && !R.files.includes(EXT) ? [{ rel: EXT, data: json(built.ext) }] : [], added);
  const anyNav = R.pages.some((pg) => pg.visuals.some((v) => Mirror.kindOf(v.json) === 'navigator')), anyBmNav = R.pages.some((pg) => pg.visuals.some((v) => typeOf(v.json) === 'bookmarkNavigator'));
  const notes = [].concat(anyNav ? ['A page navigator lists the pages shown in the tabs only: on an Arabic page it lists the English pages (use page buttons there)'] : [], anyBmNav ? ['A bookmark navigator lists every bookmark: the English and the Arabic ones'] : [],
    R.bookmarks.length ? ['A bookmark group keeps its name in its Arabic copy (bookmarks.json)'] : []);
  const EN = LANG.en.text;
  const tabs = tabsShown === 'en'
    ? { shown: 'the English pages, as in the original', hidden: `the Arabic pages (hidden in the tabs): each English page's «${EN}» button opens its Arabic page, whose "English" button goes back`, tooltipPages: 'stay hidden in both languages',
      service: `In the Power BI service (and Desktop's reading view) a reader sees one tab per English page; the Arabic pages are not in the page list and are reached by the «${EN}» button, and "English" brings the reader back. In Desktop's editing view every page is listed, the hidden ones marked hidden.` }
    : { shown: 'the Arabic pages (the report opens on the first Arabic page)', hidden: `the English pages (hidden in the tabs): each Arabic page's "English" button opens its English page, whose «${EN}» button goes back`, tooltipPages: 'stay hidden in both languages',
      service: `In the Power BI service (and Desktop's reading view) a reader sees one tab per Arabic page; the English pages are not in the page list and are reached by the "English" button, and «${EN}» brings the reader back. In Desktop's editing view every page is listed, the hidden ones marked hidden.` };
  return { files, pairs, buttons, syncGroups, bookmarks: R.bookmarks.length, activePage, tabs, notes, tabsShown };
}
