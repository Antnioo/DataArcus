// 0.3.0 L4: flip cards, the Desktop labs of 10 Oct 2026 (Desktop 2.158.1304, "build 1", v2). A KPI card turns over to a
// one-line description when clicked: three Image visuals in the card's box (a backdrop in the card colour, always shown;
// the front with the value; the back with one line about the measure, hidden), each face carrying a bookmark link to the
// other (no button), two display-only bookmarks a card (the lab's options exactly). The faces are HTML-in-SVG image
// measures (foreignObject) whose root div turns in 0.3 s from 25 degrees and opacity .6, never from invisible (v1 from 90
// degrees risked a blank card at frame 0, in the PDF too). CSS :hover never reaches a picture: the interaction is Power BI's.
// The model is never changed: the measures go into a TMDL script next to the project (flipScript), for the user to apply.
// Built on the writer's own files after Pbip.build (create_report's one build, J14), so the website's shared writer is
// untouched. Model metadata is untrusted: names and descriptions are escaped, a description that reads like an
// instruction is dropped, and no value is ever read: the DAX computes them in Desktop.
import { createRequire } from 'node:module';
import { readsLikeInstruction, modelOf } from './model.mjs';
import { freeNamer, tagOf, scriptFileOf } from './model-script.mjs';   // (the one helper for model additions as scripts, shared with L3)

const require = createRequire(import.meta.url);
const Fix = require('../../assets/js/model-health-tmdl.js'), Pbip = require('../../assets/js/pbip-export.js');
const dax = Pbip.daxNames;

const S = 'https://developer.microsoft.com/json-schemas/fabric/';
const SCHEMA = { visual: S + 'item/report/definition/visualContainer/2.1.0/schema.json', mobile: S + 'item/report/definition/visualContainerMobileState/2.1.0/schema.json',
  bookmark: S + 'item/report/definition/bookmark/1.4.0/schema.json', bookmarks: S + 'item/report/definition/bookmarksMetadata/1.0.0/schema.json' };
const lit = (v) => ({ expr: { Literal: { Value: v } } }), str = (s) => lit("'" + String(s).replace(/'/g, "''") + "'"), bool = (b) => lit(b ? 'true' : 'false');
const obj = (p) => [{ properties: p }];
const litOf = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : '');
const textOf = (p) => litOf(p).replace(/^'|'$/g, '').replace(/''/g, "'");
const numOf = (p) => parseFloat(litOf(p));
export const FOLDER = 'DataArcus flip cards';
export const SCRIPT_SUFFIX = ' - flip cards';
const SUFFIX = { front: 'flip front', back: 'flip back', backdrop: 'flip backdrop' };
// the turn (the lab's v2, measured): .3 s at most, from 25 degrees and opacity .6
export const TURN = { seconds: 0.3, degrees: 25, opacity: 0.6, perspective: 700 };
const DESC_MAX = 90;
const W = {
  en: { yoy: ' vs last year', front: (t) => `${t}, KPI card: select to see what it means`, back: (t) => `${t}: what it means; select to turn back`, bmFront: (t) => `Flip ${t}: front`, bmBack: (t) => `Flip ${t}: back` },
  ar: { yoy: ' مقارنة بالعام الماضي', front: (t) => `${t}، بطاقة مؤشر: اختر لترى معناها`, back: (t) => `${t}: معناها؛ اختر للرجوع`, bmFront: (t) => `قلب ${t}: الوجه`, bmBack: (t) => `قلب ${t}: الخلف` }
};

// ---- text for the picture: XML-escaped, then every %, # and " and every non-ASCII character URL-encoded (a data URL) ----
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
export const enc = (s) => String(s).replace(/[%#"]|[^\x20-\x7E]/gu, (c) => encodeURIComponent(c));
// a DAX string of static picture text (no double quote is left after enc)
const lt = (s) => dax.string(enc(s));
// the DAX value text made safe the same way inside the measure: XML first, then % and # (the lab: '%' as '%25')
const safeDax = (e) => `SUBSTITUTE ( SUBSTITUTE ( SUBSTITUTE ( SUBSTITUTE ( SUBSTITUTE ( ${e}, "&", "&amp;" ), "<", "&lt;" ), ">", "&gt;" ), "%", "%25" ), "#", "%23" )`;
// a description from the model: one line, no control or format characters, never an instruction, at most DESC_MAX
export function cleanDescription(d) {
  if (d == null) return null;
  const t = String(Array.isArray(d) ? d.join(' ') : d).replace(/[\p{Cc}\p{Cf}]+/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!t || readsLikeInstruction(t)) return null;
  return t.length > DESC_MAX ? t.slice(0, DESC_MAX - 1).replace(/\s+\S*$/, '') + '…' : t;
}
const cssColor = (c, d) => (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(c || '')) ? String(c) : d);
const cssFont = (f) => String(f || 'Segoe UI').replace(/[^A-Za-z0-9 -]/g, '').trim() || 'Segoe UI';

// the KPI rule's shapes for the front (pbip-bind's card rule, as DAX): a percent, a whole count, else automatic units
export function frontValue(m, mref) {
  const f = String(m.formatString || ''), pct = /%/.test(f) || /%|\b(rate|ratio|share|margin)\b/i.test(String(m.name));
  if (pct) return `IF ( ISBLANK ( _v ), "--", FORMAT ( _v, "0.0%" ) )`;
  if (f && !/\./.test(f) && /COUNT/i.test(String(m.expression || ''))) return `IF ( ISBLANK ( _v ), "--", FORMAT ( _v, "#,0" ) )`;
  const u = (n, s) => `FORMAT ( _v / ${n}, "#,0.00" ) & "${s}"`;
  return `IF ( ISBLANK ( _v ), "--", IF ( ABS ( _v ) >= 1E9, ${u('1E9', 'B')}, IF ( ABS ( _v ) >= 1E6, ${u('1E6', 'M')}, IF ( ABS ( _v ) >= 1E3, ${u('1E3', 'K')}, FORMAT ( _v, "#,0.00" ) ) ) ) )`;
}
const keyframes = (deg) => `@keyframes flipin{from{transform:perspective(${TURN.perspective}px) rotateY(${deg}deg);opacity:${String(TURN.opacity).replace(/^0/, '')}}to{transform:perspective(${TURN.perspective}px) rotateY(0deg);opacity:1}}`;
// the picture around the card's own HTML: an SVG of the card's size with one foreignObject
const svgOpen = (w, h) => `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><foreignObject x='0' y='0' width='${w}' height='${h}'>`;
function cardCss(c, deg) {
  const p = c.pad;
  return keyframes(deg) + `.card{animation:flipin ${TURN.seconds}s ease-out both;transform-origin:center;box-sizing:border-box;width:${c.w}px;height:${c.h}px;border-radius:${c.r}px;`
    + `background:${c.card};color:${c.text};font-family:'${c.font}',sans-serif;padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px;display:flex;flex-direction:column;justify-content:flex-start;overflow:hidden;text-align:${c.rtl ? 'right' : 'left'}}`
    + `.t{font-size:${c.titlePx}px;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`
    + `.v{font-size:${c.valuePx}px;font-weight:600;line-height:1.2;margin-top:2px;white-space:nowrap}`
    + `.l{font-size:${c.linePx}px;line-height:1.35;margin-top:4px;overflow:hidden}`;
}
const divOpen = (c, deg) => `<div xmlns='http://www.w3.org/1999/xhtml' class='card' dir='${c.rtl ? 'rtl' : 'ltr'}'><style>${cardCss(c, deg)}</style>`;
const CLOSE = '</div></foreignObject></svg>';

// the three measures of one card. c: the card's look; m: the KPI's measure from the model; cal: the marked calendar's
// date key reached from the measure's table, or null
function measuresOf(c, t, m, cal, words) {
  const mref = dax.column(t, m.name), name = xml(c.title), fd = c.rtl ? TURN.degrees : -TURN.degrees, bd = -fd;
  const front = ['VAR _v = ' + mref, 'VAR _t = ' + frontValue(m, mref), 'RETURN',
    [lt(svgOpen(c.w, c.h) + divOpen(c, fd) + `<div class='t'>${name}</div><div class='v'>`), safeDax('_t'), lt('</div>' + CLOSE)].join(' & ')].join('\n');
  const desc = cleanDescription(m.description), fs = m.formatString ? String(m.formatString) : null;
  const value = fs ? `IF ( ISBLANK ( _v ), "--", FORMAT ( _v, ${dax.string(fs)} ) )` : frontValue(m, mref);
  const lines = ['VAR _v = ' + mref, 'VAR _t = ' + value];
  let yoy = null;
  if (cal) { lines.push(`VAR _p = CALCULATE ( ${mref}, SAMEPERIODLASTYEAR ( ${dax.column(cal.t, cal.c)} ) )`, 'VAR _y = IF ( ISBLANK ( _v ) || ISBLANK ( _p ) || _p = 0, BLANK (), DIVIDE ( _v - _p, ABS ( _p ) ) )');
    yoy = `IF ( ISBLANK ( _y ), "", ${lt(' · ')} & ${safeDax('FORMAT ( _y, "+0.0%;-0.0%;0.0%" )')} & ${lt(words.yoy)} )`; }
  lines.push('RETURN', [lt(svgOpen(c.w, c.h) + divOpen(c, bd) + `<div class='t'>${xml(c.full)}</div><div class='l'>` + (desc ? xml(desc) + ' · ' : '')), safeDax('_t')].concat(yoy ? [yoy] : [], [lt('</div>' + CLOSE)]).join(' & '));
  const backdrop = lt(`data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${c.w}' height='${c.h}' viewBox='0 0 ${c.w} ${c.h}'><rect x='0' y='0' width='${c.w}' height='${c.h}' rx='${c.r}' ry='${c.r}' fill='${c.card}'/></svg>`);
  return { front, back: lines.join('\n'), backdrop, description: !!desc, descriptionDropped: m.description != null && !desc, format: fs, yoy: !!cal };
}

// the calendar a measure's year on year may use: the key date column of a table marked as a date table (dataCategory
// Time), related directly to the measure's table; else null with why
export function calendarFor(model, table) {
  const cals = (model.tables || []).filter((t) => /^time$/i.test(String(t.dataCategory || '')));
  for (const t of cals) {
    const c = (t.columns || []).find((x) => x.isKey && /^date(time)?$/i.test(String(x.dataType || '')));
    if (!c) continue;
    const rel = (model.relationships || []).some((r) => r && r.isActive !== false && ((r.fromTable === table && r.toTable === t.name) || (r.toTable === table && r.fromTable === t.name)));
    if (rel) return { t: t.name, c: c.name };
  }
  return null;
}


/** The flip cards option as the plan pins it: null (off), true (every KPI card) or the sorted card numbers. */
export function flipOption(v) { if (v === true) return true; if (Array.isArray(v) && v.length) return [...new Set(v.map(Number))].sort((a, b) => a - b); return null; }

/**
 * Turns the chosen KPI cards of create_report's built files into flip cards, in place. files: the build's [{ path, data }];
 * o: { flip (true | [n]), lang, rtl, ui { card, text }, font, radius, tmsl (the model as read), base (the report's base name),
 * seed (the plan's: the lineage tags) }. The script "<base> - flip cards.tmdl" joins the files (one write, one digest), as
 * the metric switcher's. Returns null when off; else { cards, bookmarks, measures, scriptFile, notFlipped, skipped }.
 */
export function applyFlip(files, o) {
  const flip = flipOption(o.flip);
  if (!flip) return null;
  const words = W[o.lang === 'ar' ? 'ar' : 'en'], model = modelOf(o.tmsl), rtl = !!o.rtl;
  const free = freeNamer(model.tables);   // (a script never replaces anything: no name the model has)
  const at = new Map(files.map((f, i) => [f.path, i]));
  const read = (p) => JSON.parse(files[at.get(p)].data);
  const put = (p, j) => { const data = JSON.stringify(j, null, 2); if (at.has(p)) files[at.get(p)].data = data; else { at.set(p, files.length); files.push({ path: p, data }); } };
  const pagesFile = files.find((f) => /^[^/]+\.Report\/definition\/pages\/pages\.json$/.test(f.path));
  if (!pagesFile) return null;
  const D = pagesFile.path.replace(/\/pages\/pages\.json$/, '');
  const order = JSON.parse(pagesFile.data).pageOrder || [];
  const cards = [], bookmarks = [], measures = [], made = new Map(), skipped = [];
  let most = 0;
  order.forEach((pid) => {
    const page = read(`${D}/pages/${pid}/page.json`);
    if (page.type === 'Tooltip') return;
    const vdir = `${D}/pages/${pid}/visuals/`, mine = files.filter((f) => f.path.startsWith(vdir) && /\/visual\.json$/.test(f.path)).map((f) => ({ path: f.path, j: JSON.parse(f.data) }));
    // the KPI row: the page's cards inside a group (the writer's "KPI cards"), in reading order (their tab order)
    const kpis = mine.filter((v) => v.j.visual && v.j.visual.visualType === 'cardVisual' && v.j.parentGroupName).sort((a, b) => (a.j.position.tabOrder || a.j.position.z) - (b.j.position.tabOrder || b.j.position.z));
    most = Math.max(most, kpis.length);
    kpis.forEach((v, i) => {
      const n = i + 1;
      if (flip !== true && !flip.includes(n)) return;
      const pr = ((((v.j.visual.query || {}).queryState || {}).Data || {}).projections || [])[0], ms = pr && pr.field && pr.field.Measure;
      if (!ms || ms.Expression.SourceRef.Schema) { skipped.push({ page: page.displayName, card: n, why: 'its value is not a measure of the model' }); return; }
      const t = String(ms.Expression.SourceRef.Entity), mt = (model.tables || []).find((x) => x.name === t), m = mt && (mt.measures || []).find((x) => x.name === ms.Property);
      if (!m) { skipped.push({ page: page.displayName, card: n, why: 'its measure is not in the model' }); return; }
      if (Pbip.hasControl(t) || Pbip.hasControl(m.name)) { skipped.push({ page: page.displayName, card: n, why: 'its measure\'s name holds a control character, which no DAX may hold' }); return; }
      // the card's own look: its title, value and title sizes, container padding; the design's colours and font
      const vco = v.j.visual.visualContainerObjects || {}, tp = Object.assign({}, ...((vco.title || []).map((e) => e.properties))), pad = Object.assign({}, ...((vco.padding || []).map((e) => e.properties)));
      const val = Object.assign({}, ...(((v.j.visual.objects || {}).value || []).map((e) => e.properties)));
      const title = textOf(tp.text) || m.name, full = textOf(Object.assign({}, ...((vco.general || []).map((e) => e.properties))).altText) || title;
      const pos = v.j.position, w = Math.round(pos.width), h = Math.round(pos.height), px = (pt, d) => Math.round((Number.isFinite(pt) ? pt : d) * 4 / 3);
      const c = { w, h, r: Math.max(0, Math.min(24, +o.radius || 8)), card: cssColor(o.ui && o.ui.card, '#ffffff'), text: cssColor(o.ui && o.ui.text, '#1f2937'), font: cssFont(o.font), rtl, title, full,
        titlePx: px(numOf(tp.fontSize), 12), valuePx: px(numOf(val.fontSize), 28), linePx: Math.max(11, px(numOf(tp.fontSize), 12) - 4),
        pad: { top: numOf(pad.top) || 12, bottom: numOf(pad.bottom) || 8, left: numOf(pad.left) || 12, right: numOf(pad.right) || 12 } };
      // one set of measures per measure and size (the same card on another page of the same size shares it)
      const mk = [t, m.name, w, h, title, rtl].join('\u0000');
      let set = made.get(mk);
      if (!set) {
        const cal = calendarFor(model, t), x = measuresOf(c, t, m, cal, words);
        set = { t, front: free(`${m.name} (${SUFFIX.front})`), back: free(`${m.name} (${SUFFIX.back})`), backdrop: free(`${m.name} (${SUFFIX.backdrop})`), x, measure: m.name };
        measures.push({ t, name: set.backdrop, expression: x.backdrop }, { t, name: set.front, expression: x.front }, { t, name: set.back, expression: x.back });
        made.set(mk, set);
      }
      // the three visuals: the front keeps the card's name, place, tab stop and group
      const front = v.j.name, back = front + 'fb', bd = front + 'fd', bmBack = front + 'bb', bmFront = front + 'bf', z = pos.z;
      const picture = (mname) => ({ image: obj({ sourceType: str('imageUrl'), sourceUrl: { expr: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: mname } } }, fit: str('Fit') }) });
      const off = { title: obj({ show: bool(false) }), background: obj({ show: bool(false) }), border: obj({ show: bool(false) }), dropShadow: obj({ show: bool(false) }) };
      const link = (bm) => obj({ show: bool(true), type: str('Bookmark'), bookmark: str(bm) });
      // (the front keeps the card's title on its hidden title, for the approval page's preview, which draws it as the card)
      const face = (name, mname, alt, bm, zz, hidden) => Object.assign({ $schema: SCHEMA.visual, name, position: Object.assign({}, pos, { z: zz, tabOrder: zz }),
        visual: { visualType: 'image', objects: picture(mname), visualContainerObjects: Object.assign({}, off, hidden ? {} : { title: obj({ show: bool(false), text: str(title) }) }, { general: obj({ altText: str(alt) }), visualLink: link(bm) }) },
        parentGroupName: v.j.parentGroupName }, hidden ? { isHidden: true } : {});
      const vis = v.path.replace(/[^/]+\/visual\.json$/, '');   // (the page's visuals folder)
      const pos0 = Object.assign({}, pos); delete pos0.tabOrder;
      put(`${vis}${bd}/visual.json`, { $schema: SCHEMA.visual, name: bd, position: Object.assign({}, pos0, { z: z - 1 }),
        visual: { visualType: 'image', objects: picture(set.backdrop), visualContainerObjects: { title: obj({ show: bool(false) }), general: obj({ altText: str('') }) } }, parentGroupName: v.j.parentGroupName });
      put(v.path, face(front, set.front, words.front(full), bmBack, z, false));
      put(`${vis}${back}/visual.json`, face(back, set.back, words.back(full), bmFront, z + 1, true));
      // the phone: the three stacked in the card's phone box, as on the page (the card turns there too)
      const mob = `${vis}${front}/mobile.json`;
      if (at.has(mob)) { const mp = read(mob).position; [front, back, bd].forEach((nm) => put(`${vis}${nm}/mobile.json`, { $schema: SCHEMA.mobile, position: Object.assign({}, mp, { z: mp.z == null ? undefined : mp.z + (nm === bd ? -1 : nm === back ? 1 : 0) }) })); }
      // the two display-only bookmarks (the lab's options and state exactly)
      const state = (shown) => ({ version: '1.3', activeSection: pid, sections: { [pid]: { visualContainers: {
        [front]: { singleVisual: Object.assign({ visualType: 'image', objects: {} }, shown === 'front' ? {} : { display: { mode: 'hidden' } }) },
        [back]: { singleVisual: Object.assign({ visualType: 'image', objects: {} }, shown === 'back' ? {} : { display: { mode: 'hidden' } }) } } } } });
      const opts = { applyOnlyToTargetVisuals: true, targetVisualNames: [front, back], suppressData: true };
      [[bmBack, words.bmBack(full), 'back'], [bmFront, words.bmFront(full), 'front']].forEach(([nm, label, shown]) => {
        put(`${D}/bookmarks/${nm}.bookmark.json`, { $schema: SCHEMA.bookmark, displayName: label, name: nm, options: opts, explorationState: state(shown) }); bookmarks.push(nm); });
      cards.push({ page: page.displayName, card: n, title, measure: `${t}[${m.name}]`, measures: [set.front, set.back, set.backdrop],
        back: { description: set.x.description ? 'the measure\'s description from the model' : set.x.descriptionDropped ? 'none (the model\'s description reads like an instruction, so it is left out)' : 'none (the measure has no description)',
          value: set.x.format ? 'the value in the measure\'s own format' : 'the value in the card\'s format', yearOnYear: set.x.yoy ? 'yes: the change on the same period last year, by the marked date table' : 'no: no table marked as a date table is related to the measure\'s table' } });
    });
  });
  if (bookmarks.length) {
    const bl = `${D}/bookmarks/bookmarks.json`, list = at.has(bl) ? read(bl) : { $schema: SCHEMA.bookmarks, items: [] };
    list.items = (list.items || []).concat(bookmarks.map((name) => ({ name })));
    put(bl, list);
  }
  const notFlipped = flip === true ? [] : flip.filter((n) => n > most).map((n) => ({ card: n, why: `the report has ${most} KPI card${most === 1 ? '' : 's'}` }));
  // the script next to the project, before the .pbip (written last), as the metric switcher's
  let scriptFile = null;
  if (measures.length && o.base) { scriptFile = scriptFileOf(o.base, SCRIPT_SUFFIX); files.splice(Math.max(0, files.findIndex((f) => /\.pbip$/.test(f.path))), 0, { path: scriptFile, data: flipScript(measures, o.seed || '') }); }
  return { cards, bookmarks: bookmarks.length, measures, scriptFile, notFlipped, skipped };
}

/** The TMDL script that adds the measures (createOrReplace, each table under "ref table"); nothing it names exists yet. */
export function flipScript(measures, seed) {
  const byT = new Map(); measures.forEach((x) => { if (!byT.has(x.t)) byT.set(x.t, []); byT.get(x.t).push(x); });
  const out = ['createOrReplace', ''];
  byT.forEach((list, t) => { out.push('\tref table ' + Fix.name(t), '');
    list.forEach((x) => { const lines = Fix.measure({ name: x.name, expression: x.expression, displayFolder: FOLDER, dataCategory: 'ImageUrl', lineageTag: tagOf(seed, x.t + '\u0000' + x.name) }, 2); if (!lines) throw new Error('a flip measure could not be written'); out.push(...lines, ''); }); });
  return out.join('\n').replace(/\n+$/, '\n');
}

/** How the user applies the script, for the answer and the plan. */
export const flipHow = (file) => `Apply the script first: the flip cards show their pictures only once the model has the measures. The script is in the file "${file}", next to the project. Save a copy of your file first; open the script in Notepad, select all and copy; in Power BI Desktop open TMDL view, open a new tab, paste, choose Preview (only new measures, in the folder "${FOLDER}"; nothing changed or replaced), then Apply. The model is not changed by DataArcus. Then click a card to turn it (Ctrl+click while editing; a plain click in reading view and in the service). Until the script is applied the cards are empty pictures.`;
