/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's pages (0.2.9, audit 3's A3-12): the page assembly. One report page with its visuals in reading
// order and its phone layout (write), the tooltip pages (tooltips). The visuals themselves are built by pbip-visuals.js
// (0.3.2 SP28: the look, each slot's kind, the cards, charts, tables and slicers, the phone look), the tooltip pages by
// pbip-tooltip.js (SP7), the page buttons and filter panels by pbip-navigation.js (SP13): this file names each visual
// (rnd), gives z and tab order, applies their notes in order and writes the files.
(function (root) {
  'use strict';
  // (0.2.9, A2-3: the design engine's fitSlots moves the slots; design-engine.js, loaded first on the website's pages)
  const E = (typeof module !== 'undefined' && module.exports ? require('./design-engine.js') : root.DAEngine);
  const Q = (typeof module !== 'undefined' && module.exports ? require('./pbip-query.js') : root.DAPbipQuery), Z = (typeof module !== 'undefined' && module.exports ? require('./pbip-sizing.js') : root.DAPbipSizing);
  const { AR_LETTERS, CHARTS, SCHEMA, bindTitle, bool, color, json, num, obj, resource, rnd, shown, str } = Q;
  // (0.3, J4: the story titles' rules, story-titles.js, loaded before pbip-query.js on the website's pages)
  const ST = (typeof module !== 'undefined' && module.exports ? require('./story-titles.js') : root.DAStoryTitles);
  // (0.3.1 TT1, the owner's rule of 27 Oct) a Top-N title measure's English text in an Arabic report, isolated whole by the
  // shared rule (text-measure.js isolateWhole, never marks of its own here): the marks it puts before the title open the
  // measure's first text, the marks after it close its last
  const TM = (typeof module !== 'undefined' && module.exports ? require('./text-measure.js') : root.DataArcusTextMeasure);
  const isoTop = (on, word, rest, plain) => {
    const w = on && TM && TM.isolateWhole ? TM.isolateWhole(plain) : plain, at = w.indexOf(plain);
    if (w === plain || at < 0) return [word, rest, plain];
    return [[w.slice(0, at) + word[0], word[1]], rest + w.slice(at + plain.length), w];
  };
  // (0.3.2 SP7) the tooltip pages' builder (pbip-tooltip.js, loaded before this file on the website's pages)
  const TP = (typeof module !== 'undefined' && module.exports ? require('./pbip-tooltip.js') : root.DAPbipTooltip);
  // (0.3.2 SP13) the page buttons' and the filter panels' builders (pbip-navigation.js, loaded right after pbip-tooltip.js)
  const N = (typeof module !== 'undefined' && module.exports ? require('./pbip-navigation.js') : root.DAPbipNavigation);
  // (0.3.2 SP28) the visuals' builders (pbip-visuals.js, loaded before pbip-tooltip.js on the website's pages)
  const V = (typeof module !== 'undefined' && module.exports ? require('./pbip-visuals.js') : root.DAPbipVisuals);


  // The page buttons as tabs (see write): the layout of a page's tabs (pbip-navigation.js tabsLayout), made per page from
  // the report's context c
  const tabsFor = (c, pg) => N.tabsLayout({ pages: { PAGES: c.PAGES, base: c.base }, theme: { font: c.font, title: c.o.title }, metrics: { pt: c.pt, boxFit: c.boxFit },
    direction: { rtl: c.rtl }, pageH: pg.page.h });
  // 0.2.9, audit 2's A2-3: what the writer measures for the design engine's fitSlots on one page (pure: no notes, no
  // files); build fits its pages with it, and Pbip.fitOptions gives it to the website's background and to plan_layout.
  // dropKinds: a user's model whose binding has no time axis: a designed page's line charts give their room away.
  // headerRows: Round 12 (the owner's go on round 11's recommendation 2): in a designed layout (pg.grow: the engine owns
  // the positions) a header whose page names don't fit one row of tabs grows by the height of the second row, where two
  // rows then fit. Hand-placed pages are the caller's: their header never grows.
  // railItems: the rail's dropdowns (the slicers the model has, three on the sample) and its Reset, as measured
  function fitOf(c, pg) {
    const { B, PAGES, SLICER_TEXT, own, resetFit, rtl, slicerH } = c, tabsLayout = tabsFor(c, pg);
    const dropKinds = B && own && !B.date && !pg.hand ? ['line'] : [];
    const headerRows = (() => {
      const slots = pg.slots, t0 = slots.find((x) => x.kind === 'title'), l0 = slots.find((x) => x.kind === 'logo');
      if (!pg.grow || PAGES.length < 2 || !t0 || !l0 || pg.panel) return 0;
      const kk = pg.page.h / 1080, gap = 24 * kk, x0 = rtl ? l0.x + l0.w + gap : t0.x + t0.w + gap, x1 = rtl ? t0.x - gap : l0.x - gap;
      if (tabsLayout(t0, l0, x0, x1, t0.h)) return 0;
      let extra = 0;
      for (let d = 1; d <= Math.ceil(30 * kk) + 25 && !extra; d++) { const tl = tabsLayout(t0, l0, x0, x1, t0.h + d); if (tl && tl.rows.length === 2 && d <= tl.rowH) extra = d; }
      return extra;
    })();
    const kk = pg.page.h / 1080, all3 = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null);
    // (the Reset's height does not depend on its width: resetFit)
    const railItems = { n: Math.max(1, (B && own ? all3.filter(Boolean) : all3).length), minH: slicerH(SLICER_TEXT), maxH: 76 * kk, resetH: resetFit('', 0, kk).h, pad: 10 * kk, gap: 8 * kk };
    return { dropKinds, headerRows, railItems };
  }
  // The visuals' look and sizes shared by a report's pages and its tooltip pages (pbip-visuals.js look), made once per
  // report from its context c (see build)
  const kit = (c) => V.look({ theme: { o: c.o, u: c.u, font: c.font, edge: c.edge, W: c.W }, direction: { align: c.align, rtl: c.rtl } });

  // One report page: its page.json, and every visual in reading order (visual.json, and mobile.json for the phone)
  function write(c, pg, pageIndex) {
    const {
      B, bound, CONTINUOUS, D, GRAD, GRAD2, GRID, LABEL, MIRROR, NODATA, PAGES, SLICER_TEXT, SOLID, TITLE, W, add, align, kindChanges, base, bookmarks,
      buttonH, charW, chartColors, def, edge, extFile, font, frame, freeExt, headed, headerGrew, lang, leftOut, logoFile, noData, noDataSkipped,
      noPageButtons, o, own, pageFilters, paneObjects, pt, resetFill, resetFit, resetIcon, resetLook, resetTip, resetW, ringsSmall, rowLabelSkipped,
      rowLabels, rtl, same, slicerH, svgDone, svgSizes, tabRows, textbox, tip, tipFor, tipName, titleFit, titles, trend, u,
      extMeasure, extField, topSet, topN, notBlank, lastMonths, byMonthStart
    } = c;
    const pageName = pg.id, filters = pageFilters();
    add(D + '/pages/' + pageName + '/page.json', json(Object.assign({
      $schema: SCHEMA.page, name: pageName, displayName: pg.name || base, displayOption: 'FitToPage', width: pg.page.w, height: pg.page.h,
      objects: Object.assign({
        background: obj({ image: { image: { name: str(pg.bgFile), url: resource(pg.bgFile), scaling: str('Fit') } }, transparency: num(0) }),
        outspace: obj({ color: color(u.background) }),
        displayArea: obj({ verticalAlignment: str('Middle') })
      }, paneObjects)
    }, filters.length ? { filterConfig: { filters } } : {})));

    // visuals, in reading order: z and tab order follow it, so keyboard users move through the page the way it reads
    const visuals = [], mob = [], slicerNames = [];
    // (0.3.2 SP28) the look the page's visuals are written with (the kit's), each written slot's place in the planned page
    // ({ from: its planned kind, nth among them }, as kindChanges name it, so a chart kept to its top N is told against the
    // plan's own slot: 0.2.9.1, B-174), each chart's band count for the phone, and the builders' notes and counts applied
    // to the report's lists in the order they come ('titles.wrapped': c.titles.wrapped; 'n.blankFiltered': c.n)
    const look = V.lookOf(c), SLOT_PLAN = new Map(), bands = new Map();
    const take = (r) => { r.notes.forEach(([key, e]) => { const [a, b] = key.split('.'), l = b ? c[a][b] : c[a]; if (l instanceof Set) l.add(e); else l.push(e); });
      Object.keys(r.counts || {}).forEach((key) => { const [a, b] = key.split('.'); c[a][b] = (c[a][b] || 0) + r.counts[key]; }); return r; };
    // a visual inside a group stores its position relative to the group's top-left corner, not the page
    const origin = {};
    const container = (spec) => {
      const o0 = spec.parent ? origin[spec.parent] : { x: 0, y: 0 };
      const v = { $schema: SCHEMA.visual, name: spec.name || rnd(), position: Object.assign({ x: spec.x - o0.x, y: spec.y - o0.y, z: spec.z, height: spec.h, width: spec.w }, spec.kind === 'nodata' || spec.kind === 'panel' ? {} : { tabOrder: spec.z }) };   // (a "No data" message card is no tab stop: seen in Desktop, 6-7 Oct, a card with a tabOrder was an unnamed stop before its chart)
      if (spec.group) origin[v.name] = { x: spec.x, y: spec.y };
      if (spec.group) v.visualGroup = spec.group; else v.visual = spec.visual;
      if (spec.parent) v.parentGroupName = spec.parent;
      if (spec.hidden) v.isHidden = true;
      visuals.push(v); mob.push({ v, kind: spec.kind, parent: spec.parent, group: spec.groupKey, noPhone: spec.noPhone, of: spec.of });
      return v;
    };
    // (0.3.2 SP13) the page assembly over pbip-navigation.js's items: each name drawn (rnd) and each z given here, in the
    // order the items come, as they always were; a ref names an item's own name ({ draw }: a name of its own, as a
    // bookmark's), the buttons' bookmarks and the bookmarks' fields are written by it; 'slicers': this page's slicers so far
    const refs = {};
    const placeNav = (out) => {
      out.items.forEach((it) => {
        if (it.draw) { refs[it.draw] = rnd(); return; }
        if (it.zAtLeast) z = Math.max(z, it.zAtLeast);
        if (it.link) { const p = it.visual.visualContainerObjects.visualLink[0].properties; p.bookmark = str(refs[p.bookmark.ref]); }
        const v = container({ name: it.nameRef ? refs[it.nameRef] : undefined, x: it.x, y: it.y, w: it.w, h: it.h, z, hidden: it.hidden, kind: it.kind, groupKey: it.groupKey, group: it.group,
          parent: it.parentRef ? refs[it.parentRef] : it.parent, noPhone: it.noPhone, of: it.ofRef ? refs[it.ofRef] : undefined, visual: it.visual });
        if (it.ref) refs[it.ref] = v.name;
        if (it.nameRef) refs[it.nameRef] = v.name;
        if (it.slicer) slicerNames.push(v.name);
        z += 1000;
      });
      (out.bookmarks || []).forEach((b) => { const r = {};
        Object.keys(b).forEach((key) => { r[key] = key === 'name' || key === 'group' ? refs[b[key]] : key === 'targets' ? (b[key] === 'slicers' ? slicerNames.slice() : b[key].map((t) => refs[t])) : b[key]; });
        bookmarks.push(r); });
      const d = out.diagnostics || {};
      (d.leftOut || []).forEach((x) => leftOut.push(x));
      if (d.tabRows && !tabRows.some((x) => x.page === d.tabRows.page)) tabRows.push(d.tabRows);
    };

    // 0.2.9, audit 2's A2-3: the slots this page really gets, by the design engine's fitSlots with what the writer measures
    // (fitOf): a line chart's room given away on a model with no time axis (told in leftOut with gave; a hand-placed page
    // keeps the caller's positions), the header one row of tabs taller, the filter rail as high as its slicers and Reset
    const tabsLayout = tabsFor(c, pg), fit = fitOf(c, pg), placed = E.fitSlots(pg.slots, fit);
    placed.dropped.forEach((t) => leftOut.push({ page: pg.name || base, kind: 'line', title: t.title || null, gave: true }));
    if (fit.headerRows) headerGrew.push({ page: pg.name || base, by: fit.headerRows });
    pg = Object.assign({}, pg, { slots: placed.slots });
    // the kind each slot is written as (pbip-visuals.js slotKind: a column chart by names its columns can't hold is a bar
    // chart, a two-valued category a donut)
    // (rc.22, B-140: the approved column chart was written as a bar chart, and the plan never said so) every kind changed
    // here is recorded, so the plan shows the kind written (plan_layout runs this writer on the plan's page)
    const changed = (s0) => { const s1 = take(V.slotKind({ look: { LABEL }, theme: { font, base }, binding: { B, own }, page: { pg }, slot: s0 })).slot, nth = pg.slots.filter((x) => x.kind === s0.kind).indexOf(s0); SLOT_PLAN.set(s1, { pageIndex, from: s0.kind, nth }); if (s1.kind !== s0.kind) kindChanges.push({ page: pg.name || base, pageIndex, role: s0.role || null, nth, from: s0.kind, to: s1.kind, topN: s1.topN == null ? null : s1.topN, why: s1.kindWhy || null, said: s1.kindSaid || null, saidAr: s1.kindSaidAr || null }); return s1; };
    const sorted = pg.slots.map(changed).sort((a, b) => (a.y - b.y) || (rtl ? b.x - a.x : a.x - b.x));
    const groups = {};
    const groupOf = (kind) => (kind === 'title' || kind === 'logo' ? 'header' : kind === 'kpi' ? 'kpis' : kind === 'slicer' ? 'filters' : null);
    const GROUP_NAMES = { header: W.header || 'Header', kpis: W.kpis || 'KPI cards', filters: W.filters || 'Filters' };
    let z = 1000, kpiIndex = 0;
    // the KPI cards' row: one title size and one value size (pbip-visuals.js kpiRow)
    const row = V.kpiRow({ look, theme: { o, W, font }, binding: { B }, page: { pg }, slots: sorted });
    const fitted = new Map();   // round 22: each chart's full title and the room it was fitted to (pbip-visuals.js visual)
    // the page's slicers (pbip-visuals.js slicers): each slicer's notes applied as it is made
    const sl = V.slicers({ look, theme: { o, u, font, edge, base }, metrics: { k: pg.page.h / 1080 }, direction: { rtl }, page: { pg } });
    const slicerVisual = (f, ttl, w, h) => take(sl.slicerVisual(f, ttl, w, h)).visual, stackHeights = sl.stackHeights;
    // Round 12 (#15; seen in Desktop 2.158, round 11: "Total Sales by Day Name" twice on one page): a table whose title
    // is a chart's title on the same page is titled by what it adds, "...: detail"
    const catPlan = V.categoryPlan({ binding: { B }, slots: sorted });   // each categorical chart slot's category, given out once for the page (round 16, #18; round 18)
    const chartTitles = new Set(B ? sorted.filter((s) => CHARTS.includes(s.kind)).map((s) => bindTitle(s.was || (s.wasColumn ? 'column' : s.kind), B, W.by || 'by')).filter(Boolean) : []);   // (wasColumn: a column chart written as a bar chart keeps its own title)
    const charts = [];
    sorted.forEach((s) => {
      const g = groupOf(s.kind);
      if (g && !groups[g]) groups[g] = { name: rnd(), x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h, z: 0 };
      if (g) { const G = groups[g]; G.x0 = Math.min(G.x0, s.x); G.y0 = Math.min(G.y0, s.y); G.x1 = Math.max(G.x1, s.x + s.w); G.y1 = Math.max(G.y1, s.y + s.h); }
    });
    // groups sit under their visuals in the layer order
    Object.keys(groups).forEach((g) => { const G = groups[g]; G.z = z; z += 1000;
      // in a solid design the theme would draw a band behind the whole group, square and without a shadow (a group
      // has neither a border nor a shadow), so no group draws one: the KPI cards each have their own panel, and the
      // header and the filter rail get a panel behind them (below)
      container({ name: G.name, x: G.x0, y: G.y0, w: G.x1 - G.x0, h: G.y1 - G.y0, z: G.z, kind: 'group', groupKey: g,
        group: Object.assign({ displayName: GROUP_NAMES[g], groupMode: 'ScaleMode' }, SOLID ? { objects: { background: obj({ show: bool(false) }) } } : {}) });
      // The header's and the filter rail's panel on a solid design: an empty text box left to the theme, under the
      // group in the layer order. Nothing is written for its background, border or shadow, so the theme draws the
      // same panel as behind the cards (measured in Desktop 2.158, DESKTOP-TESTS.md round 1; a shape with its own
      // rounded fill is not drawn rounded). The rail's is the group's box; the header's is grown by 12k at each side
      // and 6k above and below, which lines it up with the rail and the cards. Not in the phone layout.
      if (SOLID && g !== 'kpis') {
        const kk = pg.page.h / 1080, dx = g === 'header' ? Math.round(12 * kk) : 0, dy = g === 'header' ? Math.round(6 * kk) : 0;
        const bx = Math.max(0, G.x0 - dx), by = Math.max(0, G.y0 - dy);
        container({ x: bx, y: by, w: G.x1 + dx - bx, h: G.y1 + dy - by, z: G.z - 500, kind: 'band', noPhone: true, visual: V.emptyPanel() });
      } });

    // page navigation between the title and the logo, when the report has more than one page
    const title = pg.slots.find((s) => s.kind === 'title'), logo = pg.slots.find((s) => s.kind === 'logo');
    const panel = pg.panel && title && logo ? pg.panel : null, k = pg.page.h / 1080;
    // the look pbip-navigation.js's builders write with (the kit's, and this page's slicers: slicerVisual, stackHeights)
    const navLook = { frame, def, textbox, resetIcon, resetLook, resetFill, resetTip, slicerVisual, stackHeights };
    // page navigation between the title and the logo, when the report has more than one page (pbip-navigation.js headerPlan)
    const head = N.headerPlan({ slots: { title, logo, panel }, pages: { PAGES, base, name: pg.name }, theme: { W, LABEL }, metrics: { k, pt, charW, buttonH },
      direction: { rtl }, tabs: tabsLayout });
    head.diagnostics.noPageButtons.forEach((x) => noPageButtons.push(x));

    sorted.forEach((s) => {
      const g = groupOf(s.kind), parent = g ? groups[g].name : null;
      if (s.kind === 'slicer') {
        // the filter slot: its slicers and Reset, stacked in a rail or side by side in a strip (pbip-navigation.js filterRail)
        placeNav(N.filterRail({ slot: s, pages: { PAGES, base, name: pg.name, id: pageName }, theme: { W, SLICER_TEXT }, metrics: { k, slicerH, resetW, resetFit },
          direction: { rtl }, binding: { B, own }, look: navLook, parent }));
        return;
      }
      // the slot's visual (pbip-visuals.js visual): built from the page's inputs; named, layered and added here
      const r = take(V.visual({ theme: { o, u, W, font, base, lang, logoFile, GRAD, GRAD2, GRID, NODATA }, look, metrics: row, binding: { B, own, planned: catPlan.get(s), chartTitles },
        slot: s, plan: SLOT_PLAN.get(s), kpiIndex, page: { pg, pageIndex }, direction: { rtl, align, MIRROR, CONTINUOUS },
        known: { rowLabels, rowLabelSkipped, noDataSkipped, colourKeys: chartColors.keys, svgDone: !!svgDone[pageIndex], extFile: !!extFile },
        measures: { freeExt, topSet, topN, notBlank, lastMonths, byMonthStart, extMeasure } }));
      if (s.kind === 'kpi') kpiIndex++;
      if (r.skip) return;
      const { visual, box, tableH, hov } = r;
      if (r.fitted) fitted.set(visual, r.fitted);
      if (r.bands !== undefined) bands.set(visual, r.bands);
      if (r.colourKey !== undefined && !(r.colourKey in chartColors.keys)) chartColors.keys[r.colourKey] = Object.keys(chartColors.keys).length % 2;
      // (round 18: a table's pictures, and a ring drawn under 40 high takes its version without the number inside, the
      // server's expressionNoNumber; the table's value column carries the number)
      if (r.svg) { svgSizes[pageIndex] = r.svg; svgDone[pageIndex] = true; }
      r.rings.forEach((x) => { const e = extFile.entities.find((y) => y.name === x.t), me = e && e.measures.find((y) => y.name === x.m); if (me) { me.expression = x.expressionNoNumber; extFile.changed = true; ringsSmall.push({ page: pg.name || base, label: x.m, h: x.h }); } });
      // Round 19: "No data for this selection" one layer below the visual (pbip-visuals.js noDataCard), its report
      // measure named here (A3-11: two measures whose names differ only by a format character get a name each, "(2)")
      if (r.noData) {
        const { ent, expression, want } = r.noData, other = (n) => noData.some((x) => x.t === ent && x.m === n && x.expression !== expression);
        let nm = freeExt(ent, want); for (let k = 2; other(nm); k++) nm = freeExt(ent, want + ' (' + k + ')');
        if (!noData.some((x) => x.t === ent && x.m === nm)) noData.push({ t: ent, m: nm, expression });
        container({ x: s.x, y: box.y, w: s.w, h: box.h, z: z - 500, parent, kind: 'nodata', noPhone: true, visual: V.noDataCard({ look: { LABEL }, theme: { u }, ent, nm, tableH }) });
      }
      // (S3 + N6) a table shorter than its slot on a solid theme: the panel at the slot's height behind it
      if (r.panel) container({ x: s.x, y: box.y, w: s.w, h: box.h, z: z - 500, parent, kind: 'panel', noPhone: true, visual: V.emptyPanel() });
      const v = container({ x: s.x, y: box.y, w: s.w, h: tableH || box.h, z, parent, visual, kind: s.kind });
      if (r.filters && r.filters.length) v.filterConfig = { filters: r.filters };
      if (CHARTS.includes(s.kind)) charts.push({ v, hov });
      z += 1000;
      // the page buttons after the title in the reading order, and the Filters button (pbip-navigation.js pageButtons)
      if (s.kind === 'title') placeNav(N.pageButtons({ plan: head, slots: { title }, pages: { PAGES, base, name: pg.name, pageIndex }, theme: { u, W, font, LABEL },
        metrics: { k }, direction: { rtl }, look: navLook, parent: groups.header.name }));
    });

    // slide-in filter panel (pbip-navigation.js filterPanel): over the page, its two bookmarks drawn with the Filters button
    if (panel && refs.open) placeNav(N.filterPanel({ slots: { panel }, pages: { PAGES, base, name: pg.name, id: pageName }, theme: { u, W, font, LABEL, SLICER_TEXT, edge },
      metrics: { k, pt, charW, buttonH, slicerH, resetW, resetFit }, direction: { rtl }, binding: { B, own }, look: navLook }));

    // every chart shows the tooltip page when you hover it: type 'Canvas' is Power BI's name for a report page tooltip
    // ('ReportPage' is not a value: Desktop then shows its default tooltip; measured in Desktop 2.158)
    // (the laptop's second sweep of rc.1, T4 and T5) each chart opens the tooltip page of its own measure: by month (the
    // trend) when the chart is not by the month itself; otherwise by a category other than the chart's own, the picker's
    // tooltip category first, then the report's other chart categories; with none, Power BI's own tooltip
    const tipSection = (h) => {
      if (!tip) return tipName;
      const m = (h && h.m) || tip.card, cat = h && h.cat;
      if (trend && !same(cat, tip.date)) return tipFor('trend', m, tip.date).name;
      const other = [tip.cat].concat(Object.values(B.cats || {}), B.catPool || []).find((f) => f && f.c != null && f.agg == null && !same(f, cat) && !same(f, tip.date));
      return other ? tipFor('cat', m, other).name : null;
    };
    charts.forEach((c) => { const sec = tipSection(c.hov); if (sec) c.v.visual.visualContainerObjects.visualTooltip = obj({ show: bool(true), type: str('Canvas'), section: str(sec) }); });

    // phone layout: Power BI's phone canvas is 323 points wide. Cards go two per row (158 x 100), charts and
    // tables full width, slicers and buttons as short full-width rows, in the reading order of the page.
    const PW = 323, GAP = 8, SIZE = { title: 56, nav: 44, logo: 56, kpi: 100, card: 100, slicer: 64, button: 40, text: 120, table: 270, gauge: 180, donut: 220, map: 220, treemap: 220 };
    const pos = {};
    let y = 0, col = 0;
    const navBtns = mob.filter((m) => m.kind === 'navbtn');
    const place = (m) => {
      const k = m.kind, half = k === 'kpi' || k === 'card';
      const h = SIZE[k] || 190;
      if (k === 'navbtn') {
        // the page buttons: rows of the 323-wide canvas, each button at least as wide as its name needs at the phone's
        // text size (so two pages share one row, and many pages wrap instead of being cut), the rest of a row shared
        // equally; the first page at the reading start
        const i = navBtns.indexOf(m);
        if (i === 0) {
          if (col) { y += 100 + GAP; col = 0; }
          const need = navBtns.map((b) => Z.phoneTabWidth(String(b.v.visual.objects.text[1].properties.text.expr.Literal.Value).slice(1, -1), font));
          let row = [], used = 0; const rows = [row];
          need.forEach((w, j) => { const add = (row.length ? GAP : 0) + w; if (row.length && used + add > PW) { row = [j]; rows.push(row); used = w; } else { row.push(j); used += add; } });
          // (round 12, #2; seen in Desktop 2.158, round 11: names centred in stretched buttons looked scattered): each
          // button as wide as its name, from the reading start, a fixed gap between them
          rows.forEach((r) => { let x = 0;
            r.forEach((j) => { const w = need[j]; pos[navBtns[j].v.name] = { x: rtl ? PW - x - w : x, y, w, h: SIZE.nav }; x += w + GAP; });
            y += SIZE.nav + GAP; });
        }
        return;
      }
      if (half) {
        const x = col ? PW - 157.5 : 0; pos[m.v.name] = { x: rtl ? PW - 157.5 - x : x, y, w: 157.5, h };
        if (col) { y += h + GAP; col = 0; } else col = 1;
      } else {
        if (col) { y += 100 + GAP; col = 0; }
        pos[m.v.name] = { x: 0, y, w: PW, h }; y += h + GAP;
      }
    };
    const order = ['header', 'filters', 'kpis', null];
    order.forEach((g) => mob.filter((m) => m.kind !== 'group' && !m.noPhone && m.kind !== 'navline' && (g ? m.parent === (groups[g] || {}).name : !m.parent) && m.kind !== 'logo').forEach(place));
    // #5 (round 12; seen in Desktop 2.158, round 11: on the phone the current page was only bold): the line under the
    // current tab on the phone too, 2 high, right under its button (in the gap before the next row)
    mob.filter((m) => m.kind === 'navline' && m.of && pos[m.of]).forEach((m) => { const b = pos[m.of]; pos[m.v.name] = { x: b.x + 4, y: b.y + b.h, w: Math.max(4, b.w - 8), h: 2 }; });
    if (col) { y += 100 + GAP; col = 0; }
    // groups wrap their children on the phone as well; the children keep their page positions: in mobile.json Power BI
    // Desktop reads a grouped visual's position as a page position, not relative to its group as in visual.json
    Object.keys(groups).forEach((g) => {
      const kids = mob.filter((m) => m.parent === groups[g].name && pos[m.v.name]);
      if (!kids.length) return;
      const x0 = Math.min(...kids.map((m) => pos[m.v.name].x)), y0 = Math.min(...kids.map((m) => pos[m.v.name].y));
      const x1 = Math.max(...kids.map((m) => pos[m.v.name].x + pos[m.v.name].w)), y1 = Math.max(...kids.map((m) => pos[m.v.name].y + pos[m.v.name].h));
      pos[groups[g].name] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    });
    // text on the phone: each visual's own sizes in mobile.json (pbip-visuals.js phoneLook)
    const kindOf = {}; mob.forEach((m) => { kindOf[m.v.name] = m.kind; });
    // Round 20 (golden task 7, the owner's (a), 7 Oct 2026: on the Arabic page of a model without measures three charts
    // were all titled "عدد Order Id"): charts of a page whose titles would be the same each get their grouping column
    // in brackets, "عدد Order Id (Region)", English and Arabic alike; a title that is already its own is not changed
    {
      const tOf = (v) => { const t = ((v.visual.visualContainerObjects || {}).title || [])[0], x = t && t.properties && t.properties.text; return x && x.expr && x.expr.Literal ? String(x.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null; };
      // (round 22, the code review's e and h, and seen in Desktop on 7 Oct, "Total Sales by City (City)" twice: the
      // titles are compared in full, not as shortened; charts by the same column are left alone, a bracket would only
      // repeat itself; the new title is fitted like any title, and the alt text carries the same name)
      const same = {}, full = (v) => (fitted.get(v.visual) || {}).ttl || tOf(v), colOf = (v) => { const p = v.visual.query.queryState.Category.projections[0]; return shown(p.displayName || p.nativeQueryRef); };
      // (rc1: a chart cut to its top N keeps its "Top N: " before its title; the titles are compared without it, so two charts
      // that differ only by their N are still told apart by their column, and the new name keeps the prefix)
      const TOPPED = /^(Top|أعلى) \d+: /, core = (v) => full(v).replace(TOPPED, ''), prefix = (v) => (full(v).match(TOPPED) || [''])[0];
      visuals.filter((v) => v.visual && v.visual.query && v.visual.query.queryState.Category && tOf(v)).forEach((v) => { (same[core(v)] = same[core(v)] || []).push(v); });
      // (round 22b, the review of round 22, item 10: three charts and two columns, "عدد Order Id (Channel)" twice: charts
      // of the group by the same column too take a number after it in reading order, "(Channel 2)"; nothing else
      // tells them apart, as their measure and column are the same)
      const order = (a, b) => a.position.y - b.position.y || (rtl ? b.position.x - a.position.x : a.position.x - b.position.x);
      // the new title fitted like any title, the alt text the same name, the titles report following
      const rename = (v, k, name, altName) => { const f = fitted.get(v.visual), tp = v.visual.visualContainerObjects.title[0].properties, g = (v.visual.visualContainerObjects.general || [])[0];
        const tf = f ? titleFit(name, TITLE, f.avail) : { mode: 'one', shown: name };
        if (f) f.final = name;
        tp.text = str(tf.shown); if (tf.mode !== 'one' && !tf.one) tp.titleWrap = bool(true); else delete tp.titleWrap;
        if (g && g.properties && g.properties.altText) g.properties.altText = str(altName || name);
        if (f && f.story) f.story.alt = String(altName || name).replace(TOPPED, '');
        // (the reviewer's third review, item 4: the entry this visual's title gave, not the first with the same title,
        // which may be another chart's)
        if (f) { ['wrapped', 'shortened'].forEach((m) => { const i = titles[m].indexOf(f.entry); if (i >= 0) titles[m].splice(i, 1); });
          f.entry = null; if (tf.mode !== 'one') titles[tf.mode].push(f.entry = { page: f.page, title: name, shown: tf.shown }); } };
      Object.keys(same).filter((k) => same[k].length > 1).forEach((k) => { const nth = {}, one = new Set(same[k].map(colOf)).size === 1; same[k].slice().sort(order).forEach((v) => { const c = colOf(v);
        // (the reviewer's second review, item 8: charts with the same measure and the same column kept the same title
        // and alt text: the second and later are numbered, "Total Sales by City (2)")
        // (0.3, J4, B-130: "Total by Note (2)", "(2) (2)") the second and later say what they show in another true
        // sentence of their own measure and column, "Note ranked by Total", "Total per Note" (story-titles.js alternate)
        // (0.3.0 D2) a gallery visual whose sentences run out says its kind instead ("Sales: step by step"), never a number
        const alt = (n) => { const st = (fitted.get(v.visual) || {}).story; return st ? ST.alternate(st.m, st.c, n, st.ranked, W.by || 'by') || (st.tail ? k + ': ' + st.tail : null) : null; };
        // (19 Oct: the alt text says the same sentence with the full names)
        const altOf = (n) => { const st = (fitted.get(v.visual) || {}).story; return st ? ST.alternate(st.full.m, st.full.c, n, st.ranked, W.by || 'by') : null; };
        const fullCore = () => { const st = (fitted.get(v.visual) || {}).story; return st ? st.alt : k; };
        if (one) { nth[''] = (nth[''] || 0) + 1; if (nth[''] > 1) { const a = alt(nth['']); rename(v, k, prefix(v) + (a || k + ' (' + nth[''] + ')'), a ? prefix(v) + (altOf(nth['']) || a) : null); } return; }
        // (never a script the title does not have already: round 14's rule keeps an Arabic title free of English names;
        // "عدد Order Id" holds Latin letters already, so "(Region)" may follow it)
        const lat = /[A-Za-z]/, adds = (x) => (AR_LETTERS.test(c) && !AR_LETTERS.test(x)) || (lat.test(c) && !lat.test(x));
        if (!c || adds(k)) return;
        nth[c] = (nth[c] || 0) + 1;
        const two = nth[c] > 1 && alt(nth[c]);
        rename(v, k, prefix(v) + (two ? alt(nth[c]) + ' (' + c + ')' : k + ' (' + c + (nth[c] > 1 ? ' ' + nth[c] : '') + ')'),
          prefix(v) + (two ? (altOf(nth[c]) || alt(nth[c])) + ' (' + c + ')' : fullCore() + ' (' + c + (nth[c] > 1 ? ' ' + nth[c] : '') + ')')); }); });
      // (design round 8, the re-score's N2 and N3: "Top 8:" stood over charts of 2, 4 or 6 bars, and a chart that left
      // categories out did not say how many there were) a chart cut to its Top N takes its title from a report-level
      // measure: "Top N of M: <title>" when more than N of its categories have a value under the page's filters (M counted
      // without the chart's own Top N, REMOVEFILTERS on its category column), its plain title otherwise. The tools never
      // read the data, so only the report can know. Each text is fitted as the title is, "M" taken as 999. (_n > N is written
      // MIN ( _n, N + 1 ) = N + 1: no comparison sign in the DAX, which round 9's names check keeps to names and strings)
      visuals.forEach((v) => { const f = v.visual && fitted.get(v.visual); if (!f || !f.top || !f.top.cat || f.top.cat.c == null) return;
        // (design round 10, N14/N15: the title counts the bars kept, the same report measure's rank: "Top S of M" only when
        // S < M; fitted with S and M taken as 999)
        // (TT1: the lead in the title's language)
        const core = (f.final || f.ttl).replace(TOPPED, ''), word = AR_LETTERS.test(core) ? ['أعلى ', ' من '] : ['Top ', ' of '], lead = word[0] + '999' + word[1] + '999: ';
        const plain = titleFit(core, TITLE, f.avail), long = titleFit(lead + core, TITLE, f.avail), rest = long.shown.indexOf(lead) === 0 ? long.shown.slice(lead.length) : null;
        if (rest == null) return;
        const set = topSet(f.top.cat, f.top.y, f.top.n, 2); if (!set) return;
        let m; try { m = set.title('Title: ' + core, ...isoTop(lang === 'ar', word, rest, plain.shown)); } catch (e) { return; }   // (a control character: the text title stays)
        const tp = v.visual.visualContainerObjects.title[0].properties, g = (v.visual.visualContainerObjects.general || [])[0];
        tp.text = { expr: extField(f.top.cat.t, m) };
        if (g && g.properties && g.properties.altText) g.properties.altText = str(f.story ? f.story.alt : core);   // (the alt text promises no cut either; 19 Oct: the full story title)
        // (the titles report tells the plain title's fit, the one shown when nothing is cut)
        ['wrapped', 'shortened'].forEach((md) => { const i = titles[md].indexOf(f.entry); if (i >= 0) titles[md].splice(i, 1); });
        f.entry = plain.mode !== 'one' ? { page: f.page, title: core, shown: plain.shown } : null; if (f.entry) titles[plain.mode].push(f.entry);
        if ((plain.mode !== 'one' && !plain.one) || (long.mode !== 'one' && !long.one)) tp.titleWrap = bool(true); else delete tp.titleWrap; });
    }
    // 0.2.9, audit 6's A6-12: what each written visual shows, in the page's order, for the caller's answer: its fields as
    // Table[Field] (a measure or a column) or Sum(Table[Field]) (a column the visual sums or counts), its roles in order; the
    // helpers are not fields (the Tooltips' sort, the hidden-header order column, the report's own measures: row labels,
    // pictures, "No data")
    const AGG_NAMES = { 0: 'Sum', 2: 'DistinctCount', 5: 'Count' };
    const fieldKey = (p) => { const f = p.field;
      if (f.Column) return f.Column.Expression.SourceRef.Entity + '[' + f.Column.Property + ']';
      if (f.Measure) return f.Measure.Expression.SourceRef.Schema ? null : f.Measure.Expression.SourceRef.Entity + '[' + f.Measure.Property + ']';
      if (f.Aggregation && p.displayName !== ' ') { const c = f.Aggregation.Expression.Column; return (AGG_NAMES[f.Aggregation.Function] || 'Agg') + '(' + c.Expression.SourceRef.Entity + '[' + c.Property + '])'; }
      return null; };
    bound.push({ page: pg.name || base, visuals: mob.filter((m) => m.v.visual && m.v.visual.query && m.kind !== 'nodata').map((m) => ({ kind: m.kind,
      fields: Object.keys(m.v.visual.query.queryState).filter((r) => r !== 'Tooltips').flatMap((r) => m.v.visual.query.queryState[r].projections.map(fieldKey)).filter(Boolean) })) });
    visuals.forEach((v) => { headed(v.visual);
      add(D + '/pages/' + pageName + '/visuals/' + v.name + '/visual.json', json(v));
      const p = pos[v.name];
      // (0.3.0: a design that says phoneLayout false gets no phone layout; every page has one by default)
      if (p && o.phoneLayout !== false) add(D + '/pages/' + pageName + '/visuals/' + v.name + '/mobile.json', json(Object.assign({ $schema: SCHEMA.mobile,
        position: { x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: v.position.z, width: +p.w.toFixed(1), height: +p.h.toFixed(1), tabOrder: v.position.tabOrder } },
        v.visual ? V.phoneLook({ look, theme: { u, font }, known: { rowLabels }, kind: kindOf[v.name], band: bands.get(v.visual) }, v, p) : {})));
    });
  }

  // The tooltip pages (the card and the bar chart by category, and the trend by month); returns six, the trend kept to
  // its last 6 months. 0.3.2 SP7: pbip-tooltip.js builds each page from explicit inputs; this is the page assembly: it
  // asks for the pages a report always has (tipFor gives their names), names each visual and adds the files, page by
  // page in the report's order (the random ids and the report measures come out in the sequence they always had)
  function tooltips(c) {
    const {
      B, CONTINUOUS, D, FULL, MIRROR, TIP_TITLE, TIP_VALUE, W, add, align, byMonthStart, cardCode, cardFit, cardFrame,
      cardObjects, frame, headed, lang, lastMonths, notBlank, sameField, textbox, tip, tipBinding, tipFor, tipName, tipPages, titleFit, topN, trend,
      u, topSet, extField
    } = c;
    const T = TP.tooltipPages({ theme: { u, W, FULL }, metrics: { TIP_TITLE, TIP_VALUE, cardFit, titleFit },
      binding: { B, tip, trend, tipName, tipBinding, tipPages }, direction: { lang, align, MIRROR, CONTINUOUS, isoTop },
      look: { frame, textbox, cardObjects, cardFrame, cardCode, sameField }, measures: { notBlank, topN, topSet, lastMonths, byMonthStart, extField } });
    // a page and its visuals as files: each visual named here, in its order on the page
    const put = (pg) => {
      add(D + '/pages/' + pg.name + '/page.json', json(pg.page));
      pg.visuals.forEach((s, i) => {
        const v = { $schema: SCHEMA.visual, name: rnd(), position: { x: s.x, y: s.y, z: (i + 1) * 1000, height: s.h, width: s.w, tabOrder: (i + 1) * 1000 }, visual: s.visual };
        if (s.filters && s.filters.length) v.filterConfig = { filters: s.filters };
        headed(s.visual);
        add(D + '/pages/' + pg.name + '/visuals/' + v.name + '/visual.json', json(v));
      });
    };
    if (!tip) { put(T.empty()); return false; }
    T.wanted().forEach(([kind, m, cat]) => tipFor(kind, m, cat));
    tipPages.forEach((t) => put(T.page(t)));
    return T.six;
  }

  const api = {
    fitOf, themeSizes: V.themeSizes, kit, write, tooltips
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbipPage = api;
})(typeof self !== 'undefined' ? self : this);
