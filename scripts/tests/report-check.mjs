// Checks on a written Power BI project, read the way Power BI Desktop reads it. Used by pbip.mjs and mcp/test.mjs.
// files: { 'path/inside/project': bytes or text }.
//
// layoutProblems(files):
//  - phone: in mobile.json a grouped visual's position is a page position (Desktop draws it there, not relative to its
//    group as in visual.json): no two visuals' phone boxes overlap, every box inside the 323-wide phone canvas, and each
//    group's box around its children
//  - sizes: every text size in the header, the page buttons, the slicers and the buttons within Power BI's 8-60; each
//    text fits its box, with the heights measured in Power BI Desktop 2.157 (DESKTOP-TESTS.md, 2026-10-01; page units, a
//    point size taking the same page units on any page): a text box 10 + 1.8 x pt per line, button text 2 + 1.6 x pt per
//    line, a dropdown slicer (title and box) 16 + 4 x pt; width 0.55 em per character for text boxes and page buttons.
//    Buttons (measured 2026-10-01 on 2.158): Power BI never wraps a button's text, and its icon grows with the button's
//    height (about as wide as the button is high) and is drawn at the start: a button's text is one line (its height
//    holds 2 + 1.6 x pt), and with an icon, text + icon + 6 fit the width, the text measured at 0.45 em per character
//    (0.40-0.41 seen for "Reset filters" and "إعادة ضبط الفلاتر" at 8pt). Page buttons: the text size is set for the
//    default, hover and selected states (the current page is the selected one; unset, it shows Power BI's own size).
//    A button needs 6 + 1.6 x pt in height (measured 2026-10-01 on 2.158: "إعادة ضبط الفلاتر" whole from 19 at 8pt
//    and 30 at 15pt; English from 14).
// Returns { phone: [...], sizes: [...] }, what is wrong.
const BOX = (t) => Math.ceil(10 + 1.8 * t), BTN = (t) => Math.ceil(2 + 1.6 * t), RESET = (t) => Math.ceil(6 + 1.6 * t), TW = (t, n) => 0.45 * 4 / 3 * t * n;
const SLICER = (t) => Math.ceil(16 + 4 * t), CH = (t) => t * 0.55 * 4 / 3;
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const num = (p) => parseFloat(lit(p)), str = (p) => String(lit(p) || '').replace(/^'|'$/g, '').replace(/''/g, "'");
const state = (list, id) => ((list || []).find((x) => x.selector && x.selector.id === id) || {}).properties || {};
const look = (list) => ((list || []).find((x) => x.selector && x.selector.id === 'default') || (list || [])[0] || {}).properties || {};

export function layoutProblems(files) {
  const J = (p) => JSON.parse(String(files[p]));
  const phone = [], sizes = [];
  const themeFile = Object.keys(files).find((p) => /StaticResources\/RegisteredResources\/[^/]*\.json$/.test(p));
  const theme = themeFile ? J(themeFile) : {};
  const slicerText = ((((theme.visualStyles || {}).slicer || {})['*'] || {}).header || [{}])[0].textSize;
  const pages = {};
  Object.keys(files).filter((p) => p.endsWith('/visual.json')).forEach((p) => {
    const pid = p.split('/pages/')[1].split('/')[0], mp = p.replace(/visual\.json$/, 'mobile.json');
    (pages[pid] = pages[pid] || []).push({ v: J(p), m: files[mp] ? J(mp).position : null });
  });
  const pageNames = Object.keys(files).filter((p) => p.endsWith('/page.json')).map(J).filter((pg) => pg.type !== 'Tooltip').map((pg) => pg.displayName || '');
  const font = (where, t) => { if (!(t >= 8 && t <= 60)) sizes.push(`${where}: text size ${t}`); return t; };
  for (const [pid, vs] of Object.entries(pages)) {
    const id = (x) => `${pid.slice(0, 6)}/${x.v.name.slice(0, 6)} ${x.v.visual ? x.v.visual.visualType : 'group'}`;
    // phone
    const boxes = vs.filter((x) => x.m && !x.v.visualGroup);
    boxes.forEach((a, i) => {
      const A = a.m;
      if (A.x < -0.5 || A.x + A.width > 323.5) phone.push(`${id(a)}: outside the phone canvas (x ${A.x}, width ${A.width})`);
      boxes.slice(i + 1).forEach((b) => {
        const B = b.m;
        if (A.x < B.x + B.width - 0.5 && B.x < A.x + A.width - 0.5 && A.y < B.y + B.height - 0.5 && B.y < A.y + A.height - 0.5)
          phone.push(`${id(a)} at ${A.x},${A.y} overlaps ${id(b)} at ${B.x},${B.y}`);
      });
    });
    vs.filter((g) => g.m && g.v.visualGroup).forEach((g) => vs.filter((c) => c.m && c.v.parentGroupName === g.v.name).forEach((c) => {
      const G = g.m, C = c.m;
      if (C.x < G.x - 0.5 || C.y < G.y - 0.5 || C.x + C.width > G.x + G.width + 0.5 || C.y + C.height > G.y + G.height + 0.5)
        phone.push(`${id(c)} at ${C.x},${C.y} is outside its group's phone box ${G.x},${G.y} ${G.width}x${G.height}`);
    }));
    // sizes
    for (const x of vs) {
      const v = x.v.visual, w = x.v.position.width, h = x.v.position.height;
      if (!v) continue;
      if (v.visualType === 'textbox' && x.v.parentGroupName) {
        // the header's title and logo text, the slide-in panel's title: one line that fits
        const run = ((((v.objects || {}).general || [{}])[0].properties || {}).paragraphs || [{ textRuns: [{}] }])[0].textRuns[0];
        const t = font(id(x), parseFloat((run.textStyle || {}).fontSize)), text = run.value || '';
        if (BOX(t) > h || CH(t) * text.length > w) sizes.push(`${id(x)}: "${text}" at ${t}pt doesn't fit ${w}x${h}`);
      } else if (v.visualType === 'pageNavigator') {
        const t = font(id(x), num(look((v.objects || {}).text).fontSize)), lines = Math.min(2, Math.floor((h - 2) / (1.6 * t)));
        const longest = Math.max(...pageNames.map((s) => s.length)), each = w / pageNames.length;
        if (!(lines >= 1) || CH(t) * Math.ceil(longest / Math.max(1, lines)) > each) sizes.push(`${id(x)}: page names at ${t}pt don't fit ${pageNames.length} buttons in ${w}x${h}`);
        const per = ['hover', 'selected'].map((k) => num(state((v.objects || {}).text, k).fontSize));
        if (per.some((p) => p !== t)) sizes.push(`${id(x)}: page button text ${t}pt by default, hover ${per[0]}, selected ${per[1]} (the current page)`);
      } else if (v.visualType === 'actionButton') {
        const o = v.objects || {}, tx = look(o.text), t = font(id(x), num(tx.fontSize)), text = str(tx.text);
        const shape = str(look(o.icon).shapeType), hasIcon = shape !== 'blank';
        // every button (Reset, and the slide-in panel's Close and Filters): the height Arabic text needs
        const need = RESET(t);
        if (h < need) sizes.push(`${id(x)}: "${text}" at ${t}pt needs ${need} high, has ${h}`);
        if (TW(t, text.length) + (hasIcon ? h + 6 : 0) > w) sizes.push(`${id(x)}: "${text}" at ${t}pt${hasIcon ? ` with its icon (${h} wide at this height)` : ''} doesn't fit ${w} on one line`);
      } else if (v.visualType === 'slicer' && slicerText) {
        if (h < SLICER(slicerText)) sizes.push(`${id(x)}: ${h} high, a ${slicerText}pt dropdown slicer needs ${SLICER(slicerText)}`);
      }
    }
  }
  return { phone, sizes };
}

// The sizes the guard test pins down (header title, logo text, page buttons' width, slicer and Reset height), read from a
// project built with the exec layout (page 1) and its second page (analysis, filter rail)
export function headerAndRail(files) {
  const J = (p) => JSON.parse(String(files[p]));
  const vs = Object.keys(files).filter((p) => p.endsWith('/visual.json')).map(J).filter((v) => v.visual);
  const runs = (v) => ((((v.visual.objects || {}).general || [{}])[0].properties || {}).paragraphs || [{ textRuns: [{}] }])[0].textRuns[0];
  const tb = vs.filter((v) => v.visual.visualType === 'textbox' && v.parentGroupName);
  const title = tb.find((v) => (runs(v).textStyle || {}).fontWeight === 'bold'), logo = tb.find((v) => /logo/i.test(runs(v).value || ''));
  const nav = vs.find((v) => v.visual.visualType === 'pageNavigator');
  const slicer = vs.find((v) => v.visual.visualType === 'slicer'), reset = vs.find((v) => v.visual.visualType === 'actionButton' && /'reset'/.test(JSON.stringify(v.visual.objects.icon)));
  const pt = (v) => (v ? parseFloat(runs(v).textStyle.fontSize) : null);
  return { title: pt(title), logo: pt(logo), nav: nav ? nav.position.width : null, slicer: slicer ? slicer.position.height : null, reset: reset ? reset.position.height : null };
}

// ---------- round 0 (2026-10-01): what Power BI Desktop 2.158 was measured to need (DESKTOP-TESTS.md, "round 0") ----------
const pagesOf = (files) => {
  const J = (p) => JSON.parse(String(files[p])), pages = {};
  Object.keys(files).filter((p) => p.endsWith('/page.json')).forEach((p) => { const pj = J(p); pages[pj.name] = { page: pj, visuals: [] }; });
  Object.keys(files).filter((p) => p.endsWith('/visual.json')).forEach((p) => { const id = p.split('/pages/')[1].split('/')[0]; if (pages[id]) pages[id].visuals.push(J(p)); });
  const order = (Object.keys(files).filter((p) => p.endsWith('/pages/pages.json')).map(J)[0] || {}).pageOrder || Object.keys(pages);
  return order.filter((id) => pages[id]).map((id) => pages[id]);
};
const CHART_TYPES = ['lineChart', 'clusteredBarChart', 'clusteredColumnChart', 'donutChart', 'funnel', 'treemap', 'map'];

// Every chart on every main page is linked to the tooltip page: visualTooltip { show, type 'Canvas', section }; the type
// Desktop knows is 'Canvas' ('ReportPage' is not a value: it falls back to the default tooltip). Nothing else is linked.
// Returns { charts, bad }.
export function tooltipProblems(files) {
  const pages = pagesOf(files), tips = pages.filter((p) => p.page.type === 'Tooltip').map((p) => p.page.name), bad = [];
  let charts = 0;
  pages.filter((p) => p.page.type !== 'Tooltip').forEach((p) => p.visuals.forEach((v) => {
    if (!v.visual) return;
    const tt = ((v.visual.visualContainerObjects || {}).visualTooltip || [])[0], id = `${p.page.displayName}/${v.visual.visualType}`;
    if (!CHART_TYPES.includes(v.visual.visualType)) { if (tt) bad.push(`${id}: linked to a tooltip page, only charts are`); return; }
    charts++;
    if (!tt) { bad.push(`${id}: no tooltip link`); return; }
    const pr = tt.properties;
    if (lit(pr.show) !== 'true' || lit(pr.type) !== "'Canvas'" || !tips.includes(str(pr.section)) || tt.selector) bad.push(`${id}: tooltip link type ${lit(pr.type)}, page ${tips.includes(str(pr.section)) ? 'ok' : 'not a tooltip page'}`);
  }));
  return { charts, bad };
}

// The tooltip page is 320 x 284, and its chart is a bar chart (names always horizontal) with its own sizes: axis text 8,
// 40% axis room, no axis titles, the value axis off and data labels on at 8; a bar row takes 22 and the chart's
// title and padding 46 (measured), so its 184 show 6 rows. Returns { pages, charts, bad }.
export function tooltipPageProblems(files) {
  const bad = []; let charts = 0;
  const tips = pagesOf(files).filter((p) => p.page.type === 'Tooltip');
  tips.forEach((p) => {
    if (p.page.width !== 320 || p.page.height !== 284) bad.push(`tooltip page is ${p.page.width} x ${p.page.height}, want 320 x 284`);
    p.visuals.filter((v) => v.visual && /Chart$/.test(v.visual.visualType)).forEach((v) => {
      charts++;
      const o = v.visual.objects || {}, P = (k) => ((o[k] || [])[0] || {}).properties || {}, c = P('categoryAxis'), y = P('valueAxis'), l = P('labels');
      const rows = Math.floor((v.position.height - 46) / 22);
      const got = { type: v.visual.visualType, text: lit(c.fontSize), room: lit(c.maxMarginFactor), axisTitle: lit(c.showAxisTitle), valueAxis: lit(y.show), labels: lit(l.show), labelText: lit(l.fontSize), rows };
      const want = { type: 'clusteredBarChart', text: '8D', room: '40L', axisTitle: 'false', valueAxis: 'false', labels: 'true', labelText: '8D', rows: 6 };
      if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`tooltip chart ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
      if (v.position.y + v.position.height > p.page.height || v.position.x + v.position.width > p.page.width) bad.push('tooltip chart outside its page');
    });
  });
  return { pages: tips.length, charts, bad };
}

// Each column of every table has one columnFormatting entry (selector: the column's queryRef) that aligns its values
// and its header together: text columns on the reading-start side (Left; Right in a right-to-left report), numbers on
// the other. numbers: queryRefs of columns that are numbers (measures always are). Returns { columns, bad }.
export function tableProblems(files, rtl, numbers) {
  const bad = []; let columns = 0;
  pagesOf(files).forEach((p) => p.visuals.filter((v) => v.visual && v.visual.visualType === 'tableEx' && v.visual.query).forEach((v) => {
    const list = (v.visual.objects || {}).columnFormatting || [];
    v.visual.query.queryState.Values.projections.forEach((pr) => {
      columns++;
      const mine = list.filter((x) => x.selector && x.selector.metadata === pr.queryRef), isNum = !!pr.field.Measure || (numbers || []).includes(pr.queryRef);
      const want = "'" + (isNum ? (rtl ? 'Left' : 'Right') : (rtl ? 'Right' : 'Left')) + "'", id = `${p.page.displayName}/${pr.queryRef}`;
      if (mine.length !== 1) { bad.push(`${id}: ${mine.length} columnFormatting entries`); return; }
      const x = mine[0].properties;
      if (lit(x.alignment) !== want || lit(x.styleHeader) !== 'true' || lit(x.styleValues) !== 'true' || lit(x.styleTotal) !== 'true') bad.push(`${id}: alignment ${lit(x.alignment)} (want ${want}), header ${lit(x.styleHeader)}, values ${lit(x.styleValues)}, total ${lit(x.styleTotal)}`);
    });
  }));
  return { columns, bad };
}

// Cards, as measured: the card's own fill is off (fillCustom show false, with no selector: with the "default" selector
// Desktop ignores it), so the panel and its accent bar show; the container padding and spacing have no selector (with
// one they are ignored); on main pages the top padding is round(12k) (k = page height / 1080) unless even an 8pt number
// would not fit then, the bottom and the far side P = round(8 x (page height / 720) / 1.5), the reading-start side the
// page's inset (insets[page index], the side accent bar's end + round(5k)) or P; the tooltip card P on every side; the
// number fits the width that is left (7 characters at 0.55 em). Returns { cards, bad }.
export function cardStyleProblems(files, rtl, insets) {
  const bad = []; let cards = 0;
  pagesOf(files).forEach((p, pi) => p.visuals.filter((v) => v.visual && v.visual.visualType === 'cardVisual').forEach((v) => {
    cards++;
    const id = `${p.page.displayName}/${v.name.slice(0, 6)}`, o = v.visual.objects || {}, c = v.visual.visualContainerObjects || {}, tip = p.page.type === 'Tooltip';
    const fill = o.fillCustom || [];
    if (fill.length !== 1 || fill[0].selector || lit(fill[0].properties.show) !== 'false') bad.push(`${id}: fillCustom ${JSON.stringify(fill)}`);
    for (const k of ['padding', 'spacing']) if (!(c[k] || []).length || c[k].some((x) => x.selector)) bad.push(`${id}: ${k} ${c[k] ? 'has a selector' : 'missing'}`);
    const pad = ((c.padding || [])[0] || {}).properties || {}, t = ((c.title || [])[0] || {}).properties || {};
    const s = tip ? 1 : p.page.height / 720, k = p.page.height / 1080, P = Math.round(8 * s / 1.5), line = lit(t.show) === 'true' ? Math.ceil(1.5 * num(t.fontSize)) : 0;
    const T = tip ? P : Math.round(12 * k), top = T > P && Math.floor((v.position.height - T - P - line) / 1.5) < 8 ? P : T;
    const inset = (!tip && insets && insets[pi]) || P, a = rtl ? 'right' : 'left', b = rtl ? 'left' : 'right';
    const want = { top, bottom: P, [a]: inset, [b]: P }, got = { top: num(pad.top), bottom: num(pad.bottom), [a]: num(pad[a]), [b]: num(pad[b]) };
    if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`${id}: padding ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    const I = num(look(o.padding).paddingUniform), V = num(look(o.value).fontSize);
    if (V > 8 && num(pad.left) + num(pad.right) + 2 * I + 7 * 0.55 * 4 / 3 * V > v.position.width + 0.01) bad.push(`${id}: a ${V}pt number needs more than the ${v.position.width} wide box`);
  }));
  return { cards, bad };
}

// The project shell, as Microsoft's references and validator ask: the theme is referenced by one name everywhere
// (report.json customTheme.name = the registered item's name = its path = the "name" inside the theme file, ending
// .json), and the report folder (and a model folder written with it) has a .platform file. Returns what is wrong.
export function projectProblems(files) {
  const bad = [], J = (p) => JSON.parse(String(files[p]));
  const rp = Object.keys(files).find((p) => p.endsWith('.Report/definition/report.json'));
  if (!rp) return ['no report.json'];
  const R = rp.replace(/definition\/report\.json$/, ''), rep = J(rp), ref = ((rep.themeCollection || {}).customTheme || {}).name;
  const item = (((rep.resourcePackages || [])[0] || {}).items || []).find((x) => x.type === 'CustomTheme') || {};
  const tf = R + 'StaticResources/RegisteredResources/' + item.path, inner = files[tf] ? J(tf).name : undefined;
  if (!/\.json$/.test(ref || '') || item.name !== ref || item.path !== ref || inner !== ref) bad.push(`theme names differ: report.json ${ref}, item ${item.name} at ${item.path}, the theme file's name ${inner}`);
  const platform = (folder, type) => {
    const f = folder + '.platform';
    if (!files[f]) { bad.push(`no ${f}`); return; }
    const p = J(f), name = folder.replace(/\/$/, '').split('/').pop().replace(/\.(Report|SemanticModel)$/, '');
    if (!/platformProperties\/2\.0\.0\/schema\.json$/.test(p.$schema || '') || (p.metadata || {}).type !== type || (p.metadata || {}).displayName !== name || (p.config || {}).version !== '2.0'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test((p.config || {}).logicalId || '')) bad.push(`${f}: ${JSON.stringify(p)}`);
  };
  platform(R, 'Report');
  const model = Object.keys(files).find((p) => /\.SemanticModel\/(model\.bim|definition\.pbism)$/.test(p));
  if (model) platform(model.replace(/[^/]+$/, ''), 'SemanticModel');
  return bad;
}

// ---------- panels (fix/mcp-visual-style, 2026-10-02; measured in Desktop 2.158, DESKTOP-TESTS.md) ----------
// Who draws the panel behind a visual. A transparent design (the theme's visuals have no background: the page's
// background image draws the panels) switches every visual's container background, border and shadow off in
// visual.json. A solid design (the theme's "*" visuals have a background) leaves the visuals that sit on a panel (KPI
// cards, charts, tables, text slots) to the theme: none of the three entries is written, so the theme's card colour,
// rounded corners and shadow show; the group around the KPI cards draws no band behind them (background show false);
// everything else (header title, logo, page buttons, slicers, buttons, the tooltip page's visuals) stays off.
// Returns { solid, panels (visuals left to the theme), bad }.
const PANEL_TYPES = ['cardVisual', 'gauge', 'tableEx'].concat(CHART_TYPES);
export function panelProblems(files) {
  const bad = [], themeFile = Object.keys(files).find((p) => /StaticResources\/RegisteredResources\/[^/]*\.json$/.test(p));
  const theme = themeFile ? JSON.parse(String(files[themeFile])) : {};
  const solid = !!((((((theme.visualStyles || {})['*'] || {})['*'] || {}).background || [{}])[0] || {}).show);
  let panels = 0;
  const KEYS = ['background', 'border', 'dropShadow'], off = (c, k) => lit((((c[k] || [])[0] || {}).properties || {}).show) === 'false';
  pagesOf(files).forEach((p) => {
    const tip = p.page.type === 'Tooltip', byName = Object.fromEntries(p.visuals.map((v) => [v.name, v]));
    const kpiGroups = new Set(p.visuals.filter((v) => v.visual && v.visual.visualType === 'cardVisual' && v.parentGroupName).map((v) => v.parentGroupName));
    p.visuals.forEach((v) => {
      const id = `${p.page.displayName}/${v.visual ? v.visual.visualType : 'group ' + v.visualGroup.displayName}`;
      if (v.visualGroup) {
        const gb = ((((v.visualGroup.objects || {}).background || [])[0] || {}).properties || {}).show;
        if (solid && !tip && kpiGroups.has(v.name)) { if (lit(gb) !== 'false') bad.push(`${id}: the group around the KPI cards must draw no band (background ${lit(gb)})`); }
        else if (v.visualGroup.objects) bad.push(`${id}: group objects ${JSON.stringify(v.visualGroup.objects)}`);
        return;
      }
      const c = v.visual.visualContainerObjects || {}, parent = v.parentGroupName ? byName[v.parentGroupName] : null;
      if (parent && parent.isHidden) return;   // the slide-in panel: its own card, written in visual.json
      const panel = !tip && (PANEL_TYPES.includes(v.visual.visualType) || (v.visual.visualType === 'textbox' && !v.parentGroupName));
      if (solid && panel) { panels++; const has = KEYS.filter((k) => c[k]); if (has.length) bad.push(`${id}: ${has.join(', ')} written, the theme can't draw its panel`); }
      else { const on = KEYS.filter((k) => !off(c, k)); if (on.length) bad.push(`${id}: ${on.join(', ')} not switched off`); }
    });
  });
  return { solid, panels, bad };
}
