/* DataArcus mirror text: the Arabic twin's text runs and literals (0.3.2 SP39, from report-mirror.js; the Codex split
 * map, B-280). What a reader sees that the report itself says (titles, text box runs, button texts, field names, alt
 * texts, tooltips, labels Desktop draws beside a value; never the model's data values), listed with stable ids, and
 * the person's approved Arabic written back in their place, on the page and on the phone layout. A report's text is
 * untrusted input: it is only copied or replaced, never interpreted.
 * Interface (no state between calls; the readers are mirror-policy.js's, the literals mirror-charts.js's, the phone
 * title sizes pbip-sizing.js's):
 *  - textsOfVisual(pageId, visualJson) -> [{ id, kind, text }]: pure. ids: title:<page>/<visual>,
 *    textbox:<page>/<visual>/<paragraph>.<run>, button:<page>/<visual>, field:<queryRef>, text:<page>/<visual>/<key>
 *  - labelVisual(pageId, visualJson, labels { id: text }) -> how many were applied (visualJson changed in place)
 *  - textsOfMobile(pageId, visualJson, mobileJson) -> the phone layout's texts, ids 'phone:' + the visual's: pure
 *  - labelMobile(pageId, visualJson, mobileJson, labels, { font, was }) -> how many were applied (mobileJson changed
 *    in place: the texts, a relabelled one-run title's phone size, a new card's phone title fit)
 *  - paragraphsOf(visual) -> a text box's paragraphs that are objects; runsOf(paragraph) -> its runs that are objects;
 *    eachRun(visual, fn(run, paragraph, run number)); TEXT_PROPS, TEXT_KIND (the text properties listed and their kind)
 * Browser and Node (module.exports / window.DAMirrorText). */
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const P = node ? require('./mirror-policy.js') : root.DAMirrorPolicy;
  const Charts = node ? require('./mirror-charts.js') : root.DAMirrorCharts;
  const { isObj, lit, strOf, entries, projections, kindOf } = P;
  const { mk, str } = Charts;

  // a text box's paragraphs that are objects, and a paragraph's text runs that are objects
  const paragraphsOf = (v) => (entries(isObj(v) ? v.objects : null, 'general') || []).flatMap((e) => (isObj(e.properties) && Array.isArray(e.properties.paragraphs) ? e.properties.paragraphs : []).map((para, i) => (isObj(para) ? Object.assign(para, {}) : null)).filter(Boolean));
  const runsOf = (para) => (Array.isArray(para.textRuns) ? para.textRuns : []);

  // ---- texts: what a reader sees that the report itself says (the model's data values are not here) ----
  // ids: page:<page>, title:<page>/<visual>, textbox:<page>/<visual>/<paragraph>.<run>, button:<page>/<visual>,
  // field:<queryRef> (one per field across the report), bookmark:<name>
  const eachProjection = (v, fn) => { const qs = isObj(v.query) && v.query.queryState; if (isObj(qs)) Object.keys(qs).forEach((r) => (projections(v.query, r) || []).forEach((x) => { if (isObj(x)) fn(x); })); };
  // a text box's runs with their paragraph and run numbers as the file has them (the ids' numbers)
  const eachRun = (v, fn) => (entries(v.objects, 'general') || []).forEach((e) => (isObj(e.properties) && Array.isArray(e.properties.paragraphs) ? e.properties.paragraphs : []).forEach((para, i) => {
    if (isObj(para)) runsOf(para).forEach((run, j) => { if (isObj(run)) fn(run, i, j); });
  }));
  function textsOfVisual(pageId, json) {
    const out = [];
    if (!isObj(json) || !isObj(json.visual)) return out;
    const v = json.visual, where = pageId + '/' + json.name;
    const t = (entries(v.visualContainerObjects, 'title') || []).map((e) => strOf((e.properties || {}).text)).find((x) => x != null);
    if (t != null && kindOf(json) !== 'button') out.push({ id: 'title:' + where, kind: 'title', text: t });
    if (kindOf(json) === 'textbox') eachRun(v, (run, i, j) => {
      if (typeof run.value === 'string' && run.value.trim()) out.push({ id: `textbox:${where}/${i}.${j}`, kind: 'textbox', text: run.value });
    });
    if (kindOf(json) === 'button') { const b = (entries(v.objects, 'text') || []).map((e) => strOf((e.properties || {}).text)).find((x) => x != null); if (b != null) out.push({ id: 'button:' + where, kind: 'button', text: b }); }
    eachProjection(v, (x) => { if (typeof x.queryRef === 'string' && x.queryRef) out.push({ id: 'field:' + x.queryRef, kind: 'field', text: String(x.displayName != null ? x.displayName : (x.nativeQueryRef || x.queryRef)) }); });
    eachTextProp(json, (p) => out.push({ id: 'text:' + where + '/' + p.key, kind: TEXT_KIND[p.prop] || 'text', text: p.text }));
    return out;
  }
  // (0.3.0 D3, the laptop's proof of rc.2: the twin left 15 alt texts, the cards' "No data" and a button's tooltip in
  // English) every other text of a visual's formatting a viewer meets: its alt text (read aloud, and in the selection
  // pane), a card's text for a blank value, a button's tooltips, a subtitle... one id per property:
  // text:<page>/<visual>/<o (objects) | c (container)>.<card>.<entry>.<property>. The title and a button's text keep their ids
  // (0.3.1 TB1) and the labels Desktop draws beside a value that were not listed (Microsoft's catalog): a KPI's goal text
  // (kpi goals.goalText), a data label's own title and detail (labels.dynamicLabelTitle, dynamicLabelDetail, when a text)
  // (0.3.1 TB1b) a reference line's own label: displayName on the catalog's reference line cards (xAxisReferenceLine,
  // y1AxisReferenceLine, referenceLine), only there (REF_LINE)
  const TEXT_PROPS = ['altText', 'showBlankAs', 'enabledTooltip', 'disabledTooltip', 'tooltip', 'text', 'titleText', 'subTitleText', 'placeholderText', 'labelText', 'headerText', 'tooltipText', 'goalText', 'dynamicLabelTitle', 'dynamicLabelDetail', 'displayName'];
  const REF_LINE = /^(?:[a-z0-9]*AxisReferenceLine|referenceLine)$/;
  const TEXT_KIND = { altText: 'altText', showBlankAs: 'blankText', enabledTooltip: 'buttonTooltip', disabledTooltip: 'buttonTooltip', tooltip: 'buttonTooltip' };
  function eachTextProp(json, fn) {
    const v = json.visual, button = kindOf(json) === 'button';
    [['o', v.objects], ['c', v.visualContainerObjects]].forEach(([w, bag]) => { if (!isObj(bag)) return; Object.keys(bag).forEach((card) => {
      (Array.isArray(bag[card]) ? bag[card] : []).forEach((e, i) => { if (!isObj(e) || !isObj(e.properties)) return; TEXT_PROPS.forEach((prop) => {
        // (0.3.0 A3) a button's own title (the visual's title card: off by default, still the name a screen reader may
        // read, and shown when switched on) is listed with the other texts, so it takes the button's approved Arabic
        if (prop === 'text' && ((w === 'c' && card === 'title' && !button) || (w === 'o' && card === 'text' && button))) return;
        if (prop === 'displayName' && !(w === 'o' && REF_LINE.test(card))) return;
        const s = strOf(e.properties[prop]); if (s != null && /\p{L}/u.test(s)) fn({ key: `${w}.${card}.${i}.${prop}`, prop, entry: e, text: s });
      }); });
    }); });
  }
  // labels: { id: text } (the user's approved texts). Returns how many were applied
  function labelVisual(pageId, json, labels) {
    if (!isObj(json) || !isObj(json.visual) || !labels) return 0;
    const v = json.visual, where = pageId + '/' + json.name; let n = 0;
    const has = (id) => Object.prototype.hasOwnProperty.call(labels, id);
    if (has('title:' + where)) (entries(v.visualContainerObjects, 'title') || []).forEach((e) => { if (e.properties && e.properties.text) { e.properties.text = str(labels['title:' + where]); n++; } });
    if (kindOf(json) === 'textbox') eachRun(v, (run, i, j) => { const id = `textbox:${where}/${i}.${j}`; if (has(id)) { run.value = String(labels[id]); n++; } });
    if (kindOf(json) === 'button' && has('button:' + where)) (entries(v.objects, 'text') || []).forEach((e) => { if (e.properties && e.properties.text) { e.properties.text = str(labels['button:' + where]); n++; } });
    // (0.3.1 TB1, the laptop's part 4: two cards of one measure named "Male" and "Female" both took the field's Arabic) a
    // visual's own name for a field is its own text, fieldAt:<page>/<visual>/<queryRef>: its label (null: kept as it
    // is) wins, and the field's label is never written over it
    eachProjection(v, (x) => { if (typeof x.queryRef !== 'string') return; const own = 'fieldAt:' + where + '/' + x.queryRef;
      if (has(own)) { if (labels[own] != null) { x.displayName = String(labels[own]); n++; } } else if (has('field:' + x.queryRef)) { x.displayName = String(labels['field:' + x.queryRef]); n++; } });
    eachTextProp(json, (p) => { const id = 'text:' + where + '/' + p.key; if (has(id)) { p.entry.properties[p.prop] = str(labels[id]); n++; } });
    return n;
  }

  // ---- the phone layout's texts (report-mirror.js mirrorMobile mirrors its boxes) ----
  const phoneView = (json, mobile) => ({ name: json.name, visual: { visualType: json.visual.visualType, objects: mobile.objects, visualContainerObjects: mobile.visualContainerObjects } });
  function textsOfMobile(pageId, json, mobile) {
    if (!isObj(json) || !isObj(json.visual) || !isObj(mobile)) return [];
    return textsOfVisual(pageId, phoneView(json, mobile)).filter((t) => t.kind !== 'field').map((t) => Object.assign(t, { id: 'phone:' + t.id }));
  }
  // labels: { id: text } with the 'phone:' ids. Returns how many were applied (mobile is changed in place)
  // (SQ4, D3-S1: the phone header kept the English title's 14pt, and a longer Arabic title was cut) a text box's
  // paragraph of one run, relabelled, takes the writer's phone title size for its new text in its phone box
  // (pbip-sizing.js phoneTitleSize), never larger than it was; a paragraph of several runs keeps its sizes
  const Sizing = () => (typeof module !== 'undefined' && module.exports ? require('./pbip-sizing.js') : root.DAPbipSizing || null);
  const MARKS = /[\u200e\u200f\u2066-\u2069]/g;
  // (0.3.1 TW1, SQ4-S2: the twin kept the English phone card title's wrap for a longer Arabic one) a new card on the
  // phone as the writer lays it (its value and title sizes in mobile.json) takes the writer's rule for its Arabic title
  // (pbip-sizing.js phoneCardFit): its full name (the alt text, else the title, as the writer reads it) on one line, or
  // on two (titleWrap) with the two-line card fit; one too long for two lines stays on one line, which Power BI ends
  // with "…" (the approved text is never shortened here). Only where that name is not the original's (was). o: { font, was }
  // (0.3.1 FX6, Codex's D01: a phone title approved apart from the desktop's was replaced by the desktop's, and a change
  // on the phone alone was never fitted) the text fitted is the phone card's own final title when its phone layout has
  // one (as approved, else as it was), and the desktop's full name only when it has none; o.phoneWas: that phone title
  // before the labels (null: none)
  const textAt = (v, bag, key) => { const e = (entries(isObj(v) && isObj(v.visual) ? v.visual.visualContainerObjects : null, bag) || []).find((x) => isObj(x.properties) && !x.selector); return e ? strOf(e.properties[key]) : null; };
  const fullName = (v) => { const a = textAt(v, 'general', 'altText'); return a != null && a.trim() ? a : textAt(v, 'title', 'text'); };
  function phoneCard(json, mobile, o) {
    const Z = Sizing(), p = mobile.position, vco = isObj(mobile.visualContainerObjects) ? mobile.visualContainerObjects : null;
    const tl = vco && Array.isArray(vco.title) && isObj(vco.title[0]) && isObj(vco.title[0].properties) ? vco.title[0].properties : null;
    const val = (entries(mobile.objects, 'value') || []).find((e) => isObj(e.properties) && e.properties.fontSize !== undefined);
    if (!Z || !Z.make || json.visual.visualType !== 'cardVisual' || !tl || !val || !isObj(p) || !Number.isFinite(p.width) || !Number.isFinite(p.height)) return;
    const own = strOf(tl.text), full = own != null ? own : fullName(json), was = own != null ? o.phoneWas : o.was ? fullName(o.was) : undefined;
    if (full == null || !full.trim() || full === was) return;
    const size = parseFloat(lit(tl.fontSize)) || 10, value = parseFloat(lit(val.properties.fontSize)) || 20;
    const f = Z.make({ font: o.font || 'Segoe UI', LABEL: 10 }).phoneCardFit(full.replace(MARKS, ''), p.width, p.height, size, Math.max(20, value));
    if (f.mode === 'wrap') { tl.text = str(full); tl.titleWrap = mk('true'); } else delete tl.titleWrap;
    val.properties.fontSize = mk(f.c.V + 'D');
    (entries(mobile.objects, 'padding') || []).forEach((e) => { if (isObj(e.properties) && e.properties.paddingUniform !== undefined) e.properties.paddingUniform = mk(f.c.I + 'D'); });
    (entries(vco, 'padding') || []).forEach((e) => { if (isObj(e.properties)) ['top', 'bottom', 'left', 'right'].forEach((k) => { if (e.properties[k] !== undefined) e.properties[k] = mk(f.c.P + 'D'); }); });
  }
  function labelMobile(pageId, json, mobile, labels, o) {
    if (!isObj(json) || !isObj(json.visual) || !isObj(mobile) || !labels) return 0;
    const sub = {}; Object.keys(labels).forEach((k) => { if (k.startsWith('phone:')) sub[k.slice(6)] = labels[k]; });
    const view = phoneView(json, mobile), was = new Map(), vco0 = isObj(mobile.visualContainerObjects) ? mobile.visualContainerObjects : null;
    const tl0 = vco0 && Array.isArray(vco0.title) && isObj(vco0.title[0]) && isObj(vco0.title[0].properties) ? vco0.title[0].properties : null, phoneWas = tl0 ? strOf(tl0.text) : null;
    if (kindOf(json) === 'textbox') eachRun(view.visual, (run, i, j) => { if (Object.prototype.hasOwnProperty.call(sub, `textbox:${pageId}/${json.name}/${i}.${j}`)) was.set(run, run.value); });
    const n = labelVisual(pageId, view, sub), Z = Sizing(), p = mobile.position, w = isObj(p) && Number.isFinite(p.width) ? p.width : NaN;
    if (Z && Z.phoneTitleSize && Number.isFinite(w)) (entries(mobile.objects, 'general') || []).forEach((e) => (isObj(e.properties) && Array.isArray(e.properties.paragraphs) ? e.properties.paragraphs : []).forEach((para) => {
      const rs = isObj(para) ? runsOf(para) : []; if (rs.length !== 1 || !isObj(rs[0]) || !was.has(rs[0]) || rs[0].value === was.get(rs[0])) return;
      const st = rs[0].textStyle, m = isObj(st) && /^(\d+(?:\.\d+)?)pt$/.exec(String(st.fontSize || '')); if (!m) return;
      const size = Z.phoneTitleSize(String(rs[0].value).replace(MARKS, ''), w, +m[1]); if (size < +m[1]) st.fontSize = size + 'pt';
    }));
    phoneCard(json, mobile, Object.assign({}, o || {}, { phoneWas }));
    return n;
  }

  const api = Object.freeze({ textsOfVisual, labelVisual, textsOfMobile, labelMobile, paragraphsOf, runsOf, eachRun, TEXT_PROPS, TEXT_KIND });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAMirrorText = api;
})(typeof self !== 'undefined' ? self : this);
