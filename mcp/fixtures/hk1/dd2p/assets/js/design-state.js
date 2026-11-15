/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
/*
 * DataArcus - Design state: the saved designs, moved from design-engine.js as they were (0.3.2 SP29). The saved
 * layout's version and its upgrade (v1 -> v2 -> v3), the keys older saves still carry, the written schema, a fresh
 * design and the repair a save gets on load. Pure: no page, no storage (the generator page reads and writes
 * localStorage itself and hands the save in), no clock, no state between calls. The generator pages load this file
 * after design-colours.js and design-metrics.js and before design-engine.js (browser global DAState), Node requires it;
 * design-engine.js (DAEngine) calls make() once and re-exports every name.
 * The interface:
 *   upgrade(layout)        a saved layout brought to the current version (v3), in place; returned (undefined stays so)
 *   OLD_LAYOUT_KEYS        the keys of older saves the repair still reads
 *   make(config)           config: the default configuration, which the engine owns: { PRESETS, FONTS, CHART_OPTIONS,
 *                          BAR_COLORS, DEFAULT_NAME, NAME_MAX }. Returns { SCHEMA, DESIGN_KEYS, LAYOUT_KEYS, fresh,
 *                          repairState }: fresh() a new design; repairState(save, report) the save made safe in place
 *                          (or a fresh design when nothing is usable), report({ field, given, used, why }) called for
 *                          each value not used as given. The page sizes, layouts and ranges are design-metrics.js's,
 *                          the hex check design-colours.js's.
 */
(function (root) {
  const node = typeof module !== 'undefined' && module.exports;
  const { clampHex } = node ? require('./design-colours.js') : root.DAColours;
  const { LAYOUTS, PAGES, RANGE, DEFAULT_PAGE } = node ? require('./design-metrics.js') : root.DAMetrics;

  // ---------- the saved layout's version ----------
  // v2: corners 0/8/16, and the KPI accent bar became a choice of side (from the old on/off accentBar)
  const upgrade = (l) => {
    if (l && !l.v) {
      if (+l.radius === 12) l.radius = 8; else if (+l.radius === 14) l.radius = 16;
      if (!l.kpiBar) l.kpiBar = l.accentBar === false ? 'none' : 'start';
      delete l.accentBar; l.v = 2;
    }
    // v3: the default page became 1920 x 1080; older saved designs keep the 1280 x 720 they were made on
    if (l && l.v < 3) { if (!l.page) l.page = '1280x720'; l.v = 3; }
    return l;
  };
  // keys of older saved designs the repair still reads (accentBar: v1; kpiCards: the MCP before 0.2.9)
  const OLD_LAYOUT_KEYS = ['accentBar', 'kpiCards'];

  // ---------- a saved design, made safe ----------
  const make = ({ PRESETS, FONTS, CHART_OPTIONS, BAR_COLORS, DEFAULT_NAME, NAME_MAX }) => {
    // The design's written schema (0.2.9, the audit's A2-7: it lived only in the MCP server's key lists). Every key the
    // engine reads, what it means and the values it takes; repairState checks each one. DESIGN_KEYS and LAYOUT_KEYS are
    // its keys (the MCP names any other key of a given design as ignored).
    const SCHEMA = {
      preset: { about: 'the preset the colours came from, or null', values: Object.keys(PRESETS).concat([null]) },
      name: { about: 'the theme name (the theme JSON and the file names); at most NAME_MAX (60) characters', type: 'text' },
      font: { about: 'the font of every text', values: FONTS },
      data: { about: 'the 8 data colours', type: '8 hex colours' },
      ui: { about: 'the page colours: background, card (the visuals), text, accent, good, neutral, bad', type: 'hex colours' },
      chart: { about: 'chart style defaults; auto writes nothing', values: CHART_OPTIONS },
      layout: {
        v: { about: 'the saved layout\'s version (3)', type: 'number' },
        page: { about: 'the page size', values: Object.keys(PAGES).concat('custom') },
        pageW: { about: 'a custom page\'s width (640-3840; fitted to 4:3-2.4:1)', type: 'number' },
        pageH: { about: 'a custom page\'s height (360-2160)', type: 'number' },
        preset: { about: 'the layout', values: Object.keys(LAYOUTS) },
        kpis: { about: 'the KPI cards in the top row (0 leaves the row out)', values: [0, 1, 2, 3, 4, 5, 6] },
        filters: { about: 'a filter panel', type: 'boolean' },
        fpos: { about: 'where the filter panel sits (start and end follow the reading direction)', values: ['start', 'end', 'top'] },
        dir: { about: 'the reading direction; empty: the language decides', values: ['', 'ltr', 'rtl'] },
        radius: { about: 'the corners, on the 720 grid', range: [0, 24] },
        shadow: { about: 'soft shadows', type: 'boolean' },
        header: { about: 'a header band with the title and the logo', type: 'boolean' },
        samples: { about: 'sample visuals in the preview (the website only)', type: 'boolean' },
        transparent: { about: 'transparent visuals over panels drawn in the background image', type: 'boolean' },
        wideTable: { about: 'on a narrow page a table takes the wider share of its row (default on)', type: 'boolean' },
        phoneLayout: { about: 'a phone layout for every report page (mobile.json, Power BI\'s 323-wide phone canvas; default on)', type: 'boolean' },
        kpiBar: { about: 'the KPI cards\' accent bar', values: ['start', 'top', 'bottom', 'none'] },
        kpiBarC: { about: 'the KPI bar\'s colour (default accent)', values: BAR_COLORS },
        kpiBarW: { about: 'the KPI bar\'s thickness', range: RANGE.kpiBarW },
        headLine: { about: 'the line under the header', values: ['short', 'full', 'none'] },
        headLineC: { about: 'the header line\'s colour (default accent)', values: BAR_COLORS },
        headLineW: { about: 'the header line\'s thickness', range: RANGE.headLineW },
        hh: { about: 'the header\'s height', range: RANGE.hh },
        logoW: { about: 'the logo\'s width', range: RANGE.logoW },
        fw: { about: 'the side filter panel\'s width', range: RANGE.fw },
        fh: { about: 'the top filter strip\'s height', range: RANGE.fh },
        kpiH: { about: 'the KPI row\'s height', range: RANGE.kpiH },
        mainW: { about: 'the main chart\'s share of its row, in %', range: RANGE.mainW },
        split: { about: 'the first chart row\'s share of the chart rows, in %', range: RANGE.split }
      }
    };
    const DESIGN_KEYS = Object.keys(SCHEMA), LAYOUT_KEYS = Object.keys(SCHEMA.layout);
    const fresh = () => ({ preset: 'DataArcus', name: DEFAULT_NAME, font: 'Segoe UI', data: PRESETS.DataArcus.data.slice(), ui: { ...PRESETS.DataArcus.ui } });
    // A saved design (or none) made safe to use, the way the generator repairs it on load: an old or hand-edited save may
    // be partial, so each value that is not valid falls back to its default, and older layouts are upgraded.
    // Changes the design in place and returns it (or a fresh one when there is nothing usable).
    // report (optional): called with { field, given, used, why } for each value that was not used as given (0.2.9, the
    // audit's A2-4/A2-7: nothing is reset without a word; the MCP lists them, the website repairs quietly as before).
    function repairState(state, report) {
      const say = (field, given, used, why) => { if (report) report({ field, given, used, why }); };
      if (!state || typeof state !== 'object' || !Array.isArray(state.data) || state.data.length !== 8) state = fresh();
      {
        const d = fresh(), hex = (v) => (typeof v === 'string' ? clampHex(v) : null), ui = state.ui && typeof state.ui === 'object' ? state.ui : {};
        state.data = state.data.map((c, i) => { const h = hex(c); if (!h) say(`data[${i}]`, c, d.data[i], 'not a hex colour'); return h || d.data[i]; });
        state.ui = Object.fromEntries(Object.keys(d.ui).map((k) => { const h = hex(ui[k]); if (!h && ui[k] != null) say('ui.' + k, ui[k], d.ui[k], 'not a hex colour'); return [k, h || d.ui[k]]; }));
        if (typeof state.name !== 'string') { if (state.name != null) say('name', state.name, d.name, 'not a text'); state.name = d.name; }
        if ([...state.name].length > NAME_MAX) { const cut = [...state.name].slice(0, NAME_MAX).join(''); say('name', `${[...state.name].length} characters`, cut, `a theme name is ${NAME_MAX} characters at most`); state.name = cut; }
        if (!FONTS.some((f) => f === state.font)) { if (state.font != null) say('font', state.font, d.font, `use one of ${FONTS.join(', ')}`); state.font = d.font; }
        if (state.preset != null && !Object.prototype.hasOwnProperty.call(PRESETS, state.preset)) { say('preset', state.preset, null, `not a preset; use one of ${Object.keys(PRESETS).join(', ')}`); state.preset = null; }
      }
      // saved chart choices: only the ones the page offers
      if (state.chart) {
        if (typeof state.chart === 'object') Object.keys(state.chart).filter((k) => !(CHART_OPTIONS[k] || []).some((o) => o === state.chart[k])).forEach((k) => say('chart.' + k, state.chart[k], null, CHART_OPTIONS[k] ? `use one of ${CHART_OPTIONS[k].join(', ')}` : `not a chart setting; use ${Object.keys(CHART_OPTIONS).join(', ')}`));
        state.chart = Object.fromEntries(Object.keys(CHART_OPTIONS).filter((k) => CHART_OPTIONS[k].some((o) => o === state.chart[k])).map((k) => [k, state.chart[k]]));
      }
      state.layout = Object.assign({ v: 3, page: DEFAULT_PAGE, preset: 'exec', kpis: 4, filters: false, dir: '', radius: 8, shadow: true, header: true, kpiBar: 'start', headLine: 'short', samples: true, transparent: false }, upgrade(state.layout) || {});
      if (!LAYOUTS[state.layout.preset]) { say('layout.preset', state.layout.preset, 'exec', `use one of ${Object.keys(LAYOUTS).join(', ')}`); state.layout.preset = 'exec'; }
      // saved layout values outside the choices the page offers fall back to the defaults
      {
        const l = state.layout, one = (k, list, d) => { if (!list.includes(l[k])) { say('layout.' + k, l[k], d, `use one of ${list.map((x) => JSON.stringify(x)).join(', ')}`); l[k] = d; } };
        // an older MCP design's kpiCards (fewer cards than the layout's kpis) is its kpis now
        if ('kpiCards' in l) { const n = Math.floor(+l.kpiCards); if (l.kpiCards != null && n >= 0 && n < +l.kpis) l.kpis = n; say('layout.kpiCards', l.kpiCards, null, `not a layout key any more: kpis (0-6) is the number of KPI cards; kpis ${l.kpis} used`); delete l.kpiCards; }
        one('kpis', [0, 1, 2, 3, 4, 5, 6], LAYOUTS[l.preset].kpis); one('dir', ['', 'ltr', 'rtl'], '');
        if (!(+l.radius >= 0 && +l.radius <= 24)) { say('layout.radius', l.radius, 8, 'corners are 0 to 24'); l.radius = 8; }
        one('kpiBar', ['start', 'top', 'bottom', 'none'], 'start'); one('headLine', ['short', 'full', 'none'], 'short');
        if (!PAGES[l.page] && l.page !== 'custom') { say('layout.page', l.page, DEFAULT_PAGE, `use ${Object.keys(PAGES).join(', ')} or custom`); l.page = DEFAULT_PAGE; }
        ['filters', 'shadow', 'header', 'samples', 'transparent'].forEach((k) => { if (typeof l[k] !== 'boolean') { const d = k !== 'filters' && k !== 'transparent'; say('layout.' + k, l[k], d, 'true or false'); l[k] = d; } });
        ['hh', 'logoW', 'fw', 'fh', 'kpiH', 'mainW', 'split', 'kpiBarW', 'headLineW', 'pageW', 'pageH'].forEach((k) => { if (l[k] != null && !isFinite(+l[k])) { say('layout.' + k, l[k], null, 'not a number; the default is used'); delete l[k]; } });
        // the optional choices (0.2.9, the audit's A2-7: every layout key is checked, not only the ones the page offers):
        // a value outside its choices is dropped (its default is used) and said
        const opt = (k, ok, why) => { if (l[k] !== undefined && !ok(l[k])) { say('layout.' + k, l[k], null, why); delete l[k]; } };
        opt('kpiBarC', (v) => BAR_COLORS.includes(v), `use one of ${BAR_COLORS.join(', ')}`); opt('headLineC', (v) => BAR_COLORS.includes(v), `use one of ${BAR_COLORS.join(', ')}`);
        opt('fpos', (v) => ['start', 'end', 'top'].includes(v), 'use start, end or top');
        opt('wideTable', (v) => typeof v === 'boolean', 'true or false');
        opt('phoneLayout', (v) => typeof v === 'boolean', 'true or false');
      }
      return state;
    }
    return { SCHEMA, DESIGN_KEYS, LAYOUT_KEYS, fresh, repairState };
  };

  const api = { upgrade, OLD_LAYOUT_KEYS, make };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAState = api;
})(typeof self !== 'undefined' ? self : this);
