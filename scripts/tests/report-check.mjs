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
// (changed 5 Oct 2026, with Reset only as wide as its icon and text, the owner's design choice 7: a button's text is
// measured with the writer's per-letter widths and needs its width + 10, as measured in Desktop 2.158 in round 10, M3,
// DESKTOP-TESTS.md; the icon as wide as the button is high. The old 0.45 em a character + 6 was an estimate made
// before that measurement, and it called the measured tight Reset too narrow. A button without an icon keeps the old
// rule: Desktop showed "إعادة ضبط الفلاتر" whole in a 91-wide button at 8pt (round 1), which the per-letter widths,
// made on the safe side, would call too narrow.)
import { createRequire } from 'node:module';
const { textWidth } = createRequire(import.meta.url)('../../assets/js/pbip-export.js');
const BTW = (text, t, font) => textWidth(text, t, false, font) + 10;
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
        // a page button puts a long name on two lines only when two lines fit its height: 3.5 x pt in Segoe UI, 3.2 x pt
        // in Tahoma (measured in Desktop 2.158, DESKTOP-TESTS.md round 1); otherwise it cuts it with "..."
        const t = font(id(x), num(look((v.objects || {}).text).fontSize)), lines = Math.min(2, Math.floor(h / (1.8 * t)));
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
        if (hasIcon ? BTW(text, t, str(tx.fontFamily)) + h > w + 0.5 : TW(t, text.length) > w) sizes.push(`${id(x)}: "${text}" at ${t}pt${hasIcon ? ` with its icon (${h} wide at this height)` : ''} doesn't fit ${w} on one line`);
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
  // (round 10: the navigator is tab buttons, each as wide as its own name: "nav" is their text size, or the width of
  // Power BI's navigator where that is still used)
  const tab = vs.find((v) => v.visual.visualType === 'actionButton' && /PageNavigation/.test(JSON.stringify(v.visual.visualContainerObjects.visualLink || '')));
  const tabPt = tab ? parseFloat(tab.visual.objects.text.find((e) => e.selector && e.selector.id === 'default').properties.fontSize.expr.Literal.Value) : null;
  return { title: pt(title), logo: pt(logo), nav: nav ? nav.position.width : tabPt, slicer: slicer ? slicer.position.height : null, reset: reset ? reset.position.height : null };
}

// The header's text boxes (the title, "Your logo") are centred in the header's height. A text box is top-aligned and has
// no vertical alignment: the middle of its text is about 1.2 x pt below the box's top (measured in Desktop 2.158,
// DESKTOP-TESTS.md round 1), so a box whose text would sit high is moved down. Each must have its text's middle within
// 3 of the header group's middle, unless the box is already as short as its text allows (10 + 1.8 x pt) or its text's
// middle is at or below the group's (the title at 0.42 x its box). Returns { boxes, bad }.
// Round 6: the text's middle by the font's own measured number (the same measurement: Segoe UI 3 + 1.19 x pt, Tahoma
// 1.12 x pt; 1.2 x pt for a font that was not measured), as the report writer now places it; before, 1.2 x pt for all.
const TEXT_MID = (font, t) => (/^segoe ui/i.test(String(font)) ? 3 + 1.19 * t : /^tahoma/i.test(String(font)) ? 1.12 * t : 1.2 * t);
export function headerProblems(files) {
  const bad = []; let boxes = 0;
  pagesOf(files).filter((p) => p.page.type !== 'Tooltip').forEach((p) => {
    const byName = Object.fromEntries(p.visuals.map((v) => [v.name, v]));
    p.visuals.filter((v) => v.visual && v.visual.visualType === 'textbox' && v.parentGroupName).forEach((v) => {
      const g = byName[v.parentGroupName];
      if (!g || g.isHidden) return;   // the slide-in panel's card
      boxes++;
      const run = ((((v.visual.objects || {}).general || [{}])[0].properties || {}).paragraphs || [{ textRuns: [{}] }])[0].textRuns[0];
      const t = parseFloat((run.textStyle || {}).fontSize), H = g.position.height, y = v.position.y, h = v.position.height, mid = y + TEXT_MID((run.textStyle || {}).fontFamily, t);
      const id = `${p.page.displayName}/"${run.value}" ${t}pt`;
      if (y < -0.5 || y + h > H + 0.5) bad.push(`${id}: box ${y}..${y + h} outside the header's ${H}`);
      else if (mid < H / 2 - 3 && h > BOX(t) + 0.5) bad.push(`${id}: text's middle at ${mid.toFixed(1)} of ${H} (box y ${y}, ${h} high), ${(H / 2 - mid).toFixed(1)} above the centre`);
    });
  });
  return { boxes, bad };
}

// The phone layout's text (round 1; measured in Desktop 2.158, DESKTOP-TESTS.md round 1). On the phone every text keeps
// the page's size unless mobile.json gives its own, and a size there is used only with the selector that property needs
// on the page: none for a text box's paragraph, a slicer's header and items, a container title, a chart's axes, a
// table's text and the card's container padding; "default" for a button's text; each state for page buttons. For every
// visual in the phone layout the size in force (mobile.json's when written that way, else the page's) must fit its phone
// box: a text box 10 + 1.8 x pt high and 0.55 em a character wide (8pt is the floor), a dropdown slicer 16 + 4 x pt, a
// button 6 + 1.6 x pt (and its text and icon side by side), page buttons one or two lines at 1.8 x pt with the longest
// name's widest line at 0.45 em a character; a shown title at most 12pt; the axis text of line, bar and column charts
// and a table's text at most 10pt; a card's container padding without a selector, the same on every side.
// Returns { visuals, bad }.
export function phoneTextProblems(files) {
  const J = (p) => JSON.parse(String(files[p])), bad = [];
  const themeFile = Object.keys(files).find((p) => /StaticResources\/RegisteredResources\/[^/]*\.json$/.test(p));
  const theme = themeFile ? J(themeFile) : {};
  const slicerTheme = ((((theme.visualStyles || {}).slicer || {})['*'] || {}).header || [{}])[0].textSize, titleTheme = +((theme.textClasses || {}).title || {}).fontSize || 12, labelTheme = +((theme.textClasses || {}).label || {}).fontSize || 10;
  const pageNames = Object.keys(files).filter((p) => p.endsWith('/page.json')).map(J).filter((pg) => pg.type !== 'Tooltip').map((pg) => pg.displayName || '');
  const plain = (list) => ((list || []).find((x) => !x.selector) || {}).properties || {};   // the entry without a selector
  let visuals = 0;
  Object.keys(files).filter((p) => p.endsWith('/mobile.json')).forEach((mp) => {
    const m = J(mp), v = J(mp.replace(/mobile\.json$/, 'visual.json'));
    if (!v.visual) return;
    visuals++;
    const t = v.visual.visualType, o = v.visual.objects || {}, c = v.visual.visualContainerObjects || {}, mo = m.objects || {}, mc = m.visualContainerObjects || {}, w = m.position.width, h = m.position.height;
    const id = `${mp.split('/pages/')[1].slice(0, 6)}/${v.name.slice(0, 6)} ${t}`, say = (x) => bad.push(`${id}: ${x}`);
    if (t === 'cardVisual') {
      const pads = mc.padding || [], pd = plain(pads), sides = ['top', 'bottom', 'left', 'right'].map((k) => num(pd[k]));
      if (pads.length !== 1 || pads[0].selector || sides.some((x) => !(x >= 0) || x !== sides[0])) say(`the card's phone padding ${JSON.stringify(pads).slice(0, 160)}`);
      return;
    }
    // a title that shows on the page: at most 12pt on the phone
    if (lit(plain(c.title).show) === 'true') { const ts = num(plain(mc.title).fontSize); if (!(ts <= 12)) say(`title ${isNaN(ts) ? titleTheme + 'pt (the page\'s)' : ts + 'pt'} on the phone, want 12 at most`); }
    if (t === 'textbox' && v.parentGroupName) {
      const para = (plain(mo.general).paragraphs || plain(o.general).paragraphs || [{ textRuns: [{}] }])[0].textRuns[0], size = parseFloat((para.textStyle || {}).fontSize), text = para.value || '';
      if (BOX(size) > h || (size > 8 && CH(size) * text.length > w)) say(`"${text}" at ${size}pt doesn't fit the phone's ${w}x${h}`);
    } else if (t === 'pageNavigator') {
      const sizes = ['default', 'hover', 'selected'].map((k) => { const a = num(state(mo.text, k).fontSize); return isNaN(a) ? num(state(o.text, k).fontSize) : a; }), size = sizes[0];
      const lines = Math.min(2, Math.floor(h / (1.8 * size))), longest = Math.max(...pageNames.map((x) => x.length));
      if (sizes.some((x) => x !== size) || !(lines >= 1) || 0.45 * 4 / 3 * size * Math.ceil(longest / Math.max(1, lines)) > w / pageNames.length) say(`page buttons at ${sizes.join('/')}pt don't fit ${pageNames.length} in the phone's ${w}x${h}`);
    } else if (t === 'slicer') {
      const a = num(plain(mo.header).textSize), b = num(plain(mo.items).textSize), size = Math.max(isNaN(a) ? slicerTheme || labelTheme : a, isNaN(b) ? slicerTheme || labelTheme : b);
      if (SLICER(size) > h) say(`a ${size}pt dropdown slicer needs ${SLICER(size)}, the phone box is ${h}`);
    } else if (t === 'actionButton') {
      const a = num(state(mo.text, 'default').fontSize), tx = look(o.text), size = isNaN(a) ? num(tx.fontSize) : a, text = str(tx.text), hasIcon = str(look(o.icon).shapeType) !== 'blank';
      if (RESET(size) > h || (hasIcon ? BTW(text, size, str(tx.fontFamily)) + h > w + 0.5 : TW(size, text.length) > w)) say(`"${text}" at ${size}pt doesn't fit the phone's ${w}x${h}`);
    } else if (['lineChart', 'clusteredBarChart', 'clusteredColumnChart'].includes(t)) {
      const a = num(plain(mo.categoryAxis).fontSize), b = num(plain(mo.valueAxis).fontSize);
      if (!(a <= 10) || !(b <= 10)) say(`axis text on the phone: category ${isNaN(a) ? 'the page\'s' : a}, value ${isNaN(b) ? 'the page\'s' : b}, want 10 at most`);
    } else if (t === 'tableEx') {
      const s3 = ['columnHeaders', 'values', 'total'].map((k) => num(plain(mo[k]).fontSize));
      if (s3.some((x) => !(x <= 10))) say(`table text on the phone: header, values, total ${s3.map((x) => (isNaN(x) ? 'the page\'s' : x)).join(', ')}, want 10 at most`);
    }
  });
  return { visuals, bad };
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

// Every chart on every main page is linked to a tooltip page: visualTooltip { show, type 'Canvas', section }; the type
// Desktop knows is 'Canvas' ('ReportPage' is not a value: it falls back to the default tooltip). Nothing else is linked.
// Round 1: when the report has a trend tooltip page (the taller one, 320 x 410: the measure by month), a chart that is
// itself by that month field is linked to the other tooltip page (the bar chart by category; its own trend would be
// one bar), and every other chart to the trend page. Returns { charts, trend (charts linked to the trend page), bad }.
const tipChart = (p) => p.visuals.find((v) => v.visual && /Chart$/.test(v.visual.visualType));
const isTrend = (p) => p.page.height === 410;
const catRef = (v) => { const q = ((v.visual.query || {}).queryState || {}), r = q.Category || q.Group; return r && r.projections[0] ? r.projections[0].queryRef : null; };
export function tooltipProblems(files) {
  const pages = pagesOf(files), tipPages = pages.filter((p) => p.page.type === 'Tooltip'), tips = tipPages.map((p) => p.page.name), bad = [];
  const trendPage = tipPages.find(isTrend), month = trendPage && tipChart(trendPage) ? catRef(tipChart(trendPage)) : null;
  let charts = 0, trend = 0;
  pages.filter((p) => p.page.type !== 'Tooltip').forEach((p) => p.visuals.forEach((v) => {
    if (!v.visual) return;
    const tt = ((v.visual.visualContainerObjects || {}).visualTooltip || [])[0], id = `${p.page.displayName}/${v.visual.visualType}`;
    if (!CHART_TYPES.includes(v.visual.visualType)) { if (tt) bad.push(`${id}: linked to a tooltip page, only charts are`); return; }
    charts++;
    if (!tt) { bad.push(`${id}: no tooltip link`); return; }
    const pr = tt.properties;
    if (lit(pr.show) !== 'true' || lit(pr.type) !== "'Canvas'" || !tips.includes(str(pr.section)) || tt.selector) { bad.push(`${id}: tooltip link type ${lit(pr.type)}, page ${tips.includes(str(pr.section)) ? 'ok' : 'not a tooltip page'}`); return; }
    if (!trendPage) return;
    const toTrend = str(pr.section) === trendPage.page.name, byMonth = catRef(v) === month;
    if (toTrend) trend++;
    if (toTrend === byMonth) bad.push(`${id}: ${byMonth ? 'by month, linked to the monthly trend (one bar)' : 'not linked to the monthly trend'}`);
  }));
  return { charts, trend, bad };
}

// A tooltip page holds one chart, a bar chart (names always horizontal) with its own sizes: axis text 8, 40% axis room,
// no axis titles, the value axis off and data labels on at 8. A bar row takes 22 and the chart's title and padding 46
// (measured in Desktop 2.158). The page by category is 320 x 284, its chart 184 high: 6 rows. The trend page (round 1,
// the owner's choice 2026-10-03) is 320 x 410, its chart 310 high: 12 rows, one a month, each name whole with its value
// beside the bar, whatever the measure (a column or line chart of this width loses a month behind a scrollbar when the
// value axis's labels are wide, or cuts the first name without that axis: DESKTOP-TESTS.md, "round 1 built").
// Returns { pages, charts, trend, bad }.
export function tooltipPageProblems(files) {
  const bad = []; let charts = 0, trend = 0;
  const tips = pagesOf(files).filter((p) => p.page.type === 'Tooltip');
  tips.forEach((p) => {
    const isT = isTrend(p), wantH = isT ? 410 : 284;
    if (isT) trend++;
    if (p.page.width !== 320 || p.page.height !== wantH) bad.push(`tooltip page is ${p.page.width} x ${p.page.height}, want 320 x 284, or 320 x 410 for the trend`);
    const cs = p.visuals.filter((v) => v.visual && /Chart$/.test(v.visual.visualType));
    if (cs.length > 1 || (isT && cs.length !== 1)) bad.push(`tooltip page "${p.page.displayName}" has ${cs.length} charts`);
    cs.forEach((v) => {
      charts++;
      const o = v.visual.objects || {}, P = (k) => ((o[k] || [])[0] || {}).properties || {}, c = P('categoryAxis'), y = P('valueAxis'), l = P('labels');
      const rows = Math.floor((v.position.height - 46) / 22);
      const got = { type: v.visual.visualType, text: lit(c.fontSize), room: lit(c.maxMarginFactor), axisTitle: lit(c.showAxisTitle), valueAxis: lit(y.show), labels: lit(l.show), labelText: lit(l.fontSize), rows };
      const want = { type: 'clusteredBarChart', text: '8D', room: '40L', axisTitle: 'false', valueAxis: 'false', labels: 'true', labelText: '8D', rows: isT ? 12 : 6 };
      if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`tooltip chart ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
      if (v.position.y + v.position.height > p.page.height || v.position.x + v.position.width > p.page.width) bad.push('tooltip chart outside its page');
    });
  });
  if (trend > 1) bad.push(`${trend} trend tooltip pages`);
  return { pages: tips.length, charts, trend, bad };
}

// Page buttons in reading order (round 2; measured in Desktop 2.158, DESKTOP-TESTS.md round 2). The page navigator has
// no setting for its order: it always puts the first page on the left. So a right-to-left report with more than one
// page has single buttons instead: one actionButton per main page with visualLink { show, type 'PageNavigation',
// navigationSection: that page's id }, the first page's button rightmost and the others to its left in page order,
// none overlapping; the current page's button has bold text, the others not. Where even 8pt buttons would not fit
// (a header under 6 + 1.6 x 8 = 19 high, or too little width for the longest name at 0.45 em a character) the
// navigator stays. A left-to-right report keeps the navigator and has no such button.
// Returns { buttons, navigators, bad }.
export function navProblems(files, rtl) {
  const bad = [], pages = pagesOf(files).filter((p) => p.page.type !== 'Tooltip'), ids = pages.map((p) => p.page.name);
  let buttons = 0, navigators = 0;
  pages.forEach((p) => {
    const link = (v) => ((((v.visual.visualContainerObjects || {}).visualLink || [])[0] || {}).properties) || {};
    const btns = p.visuals.filter((v) => v.visual && v.visual.visualType === 'actionButton' && lit(link(v).type) === "'PageNavigation'");
    const navs = p.visuals.filter((v) => v.visual && v.visual.visualType === 'pageNavigator'), id = p.page.displayName;
    buttons += btns.length; navigators += navs.length;
    // Round 10 (the owner's design note R10.6a, measured in Desktop 2.158): the navigator is single buttons in both
    // directions: tabs without boxes, each as wide as its own name needs, the first page at the reading start
    // (leftmost in English, rightmost in Arabic), the current page's bold. A left-to-right report is checked the same
    // way as a right-to-left one, mirrored. (Before round 10 a left-to-right report kept Power BI's navigator, and a
    // single button there was a failure.)
    if (!rtl) {
      if (!btns.length) return;   // a page without a header, or where even 8pt tabs don't fit (then Power BI's navigator stays)
      if (navs.length) bad.push(`${id}: page buttons and a navigator`);
      const byP = ids.map((pid) => btns.filter((v) => str(link(v).navigationSection) === pid));
      if (btns.length !== ids.length || byP.some((l) => l.length !== 1)) { bad.push(`${id}: ${btns.length} page buttons for ${ids.length} pages, or not one each`); return; }
      for (let i = 1; i < byP.length; i++) { const a = byP[i - 1][0].position, b = byP[i][0].position; if (Math.abs(a.y - b.y) < 2 && !(a.x + a.width <= b.x + 0.5)) bad.push(`${id}: page ${i + 1}'s button at ${b.x} is not to the right of page ${i}'s`); }
      byP.forEach((l, i) => { const o = l[0].visual.objects || {}, bold = lit(look(o.text).bold) === 'true', current = ids[i] === p.page.name;
        if (lit(link(l[0]).show) !== 'true' || bold !== current) bad.push(`${id}: the button of page ${i + 1} ${current ? "is the current page's and not bold" : "is bold but not the current page's"}`); });
      return;
    }
    const longest = Math.max(...pages.map((x) => String(x.page.displayName || '').length)), k = p.page.height / 1080;
    const roomFor8 = (v) => v.position.height >= 19 && Math.ceil(TW(8, longest) + 16 * k) <= (v.position.width - 40 * k) / ids.length;
    if (!btns.length) { if (navs.some(roomFor8)) bad.push(`${id}: a page navigator in a right-to-left report (the first page's button is on the left)`); return; }
    if (navs.length) bad.push(`${id}: page buttons and a navigator`);
    const byPage = ids.map((pid) => btns.filter((v) => str(link(v).navigationSection) === pid));
    if (btns.length !== ids.length || byPage.some((l) => l.length !== 1)) { bad.push(`${id}: ${btns.length} page buttons for ${ids.length} pages, or not one each`); return; }
    const xs = byPage.map((l) => l[0].position.x), ws = byPage.map((l) => l[0].position.width);
    const ys = byPage.map((l) => l[0].position.y);   // (round 10: the buttons may wrap to a second row; the order is checked within a row)
    for (let i = 1; i < xs.length; i++) if (Math.abs(ys[i] - ys[i - 1]) < 2 && !(xs[i] + ws[i] <= xs[i - 1] + 0.5)) bad.push(`${id}: page ${i + 1}'s button at ${xs[i]} is not to the left of page ${i}'s at ${xs[i - 1]}`);
    byPage.forEach((l, i) => {
      const o = l[0].visual.objects || {}, bold = lit(look(o.text).bold) === 'true', current = ids[i] === p.page.name;
      if (lit(link(l[0]).show) !== 'true' || bold !== current) bad.push(`${id}: the button of page ${i + 1} ${current ? 'is the current page\'s and not bold' : 'is bold but not the current page\'s'}`);
    });
  });
  return { buttons, navigators, bad };
}

// Months and weekdays in order without changing the model (round 2; measured in Desktop 2.158, DESKTOP-TESTS.md round
// 2). A chart sorts by a field only when that field is in the visual: so a chart whose category is a month or day name
// without a sort-by column carries Min of the model's number column in its Tooltips role and sorts by it, ascending.
// (A sort by a field that is not in the visual is ignored; our charts show a report page tooltip, so the number is
// never seen.) Every chart with a sortDefinition must be written that way. Returns { sorted: [{ page, type, category,
// by }], bad }.
export function sortProblems(files) {
  const bad = [], sorted = [];
  pagesOf(files).forEach((p) => p.visuals.filter((v) => v.visual && v.visual.query).forEach((v) => {
    const sd = v.visual.query.sortDefinition, id = `${p.page.displayName}/${v.visual.visualType}`;
    if (!sd) return;
    const s0 = (sd.sort || [])[0] || {}, agg = (s0.field || {}).Aggregation, tips = ((v.visual.query.queryState.Tooltips || {}).projections || []);
    if ((sd.sort || []).length !== 1 || !agg || agg.Function !== 3 || !agg.Expression.Column || s0.direction !== 'Ascending') { bad.push(`${id}: sort ${JSON.stringify(sd).slice(0, 160)}, want one ascending Min of a column`); return; }
    const by = agg.Expression.Column.Expression.SourceRef.Entity + '.' + agg.Expression.Column.Property;
    if (!tips.some((t) => JSON.stringify(t.field) === JSON.stringify(s0.field))) bad.push(`${id}: sorted by Min of ${by}, which is not in its tooltip fields (Desktop ignores the sort)`);
    if (!['lineChart', 'clusteredBarChart', 'clusteredColumnChart'].includes(v.visual.visualType)) bad.push(`${id}: a sort on a visual that is not a line, bar or column chart`);
    sorted.push({ page: p.page.displayName, tooltip: p.page.type === 'Tooltip', type: v.visual.visualType, category: catRef(v), by });
  }));
  return { sorted, bad };
}

// The measure each tooltip page's chart shows (its Y projection's queryRef): { category, trend }.
export function tooltipMeasures(files) {
  const out = {};
  pagesOf(files).filter((p) => p.page.type === 'Tooltip').forEach((p) => { const c = tipChart(p), y = c && ((c.visual.query || {}).queryState || {}).Y; if (y) out[isTrend(p) ? 'trend' : 'category'] = y.projections[0].queryRef; });
  return out;
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
// number fits the width that is left (7 characters at 0.55 em). Round 2: on a solid design (the theme's "*" visuals have
// a background) a main page's card without an accent-bar inset has round(16k) at the reading start: at 8 the title
// touches the panel's rounded corner (measured in Desktop 2.158, DESKTOP-TESTS.md round 2). Returns { cards, bad }.
export function cardStyleProblems(files, rtl, insets) {
  const bad = []; let cards = 0;
  const themeFile = Object.keys(files).find((p) => /StaticResources\/RegisteredResources\/[^/]*\.json$/.test(p)), theme = themeFile ? JSON.parse(String(files[themeFile])) : {};
  const solid = !!((((((theme.visualStyles || {})['*'] || {})['*'] || {}).background || [{}])[0] || {}).show);
  pagesOf(files).forEach((p, pi) => p.visuals.filter((v) => v.visual && v.visual.visualType === 'cardVisual').forEach((v) => {
    cards++;
    const id = `${p.page.displayName}/${v.name.slice(0, 6)}`, o = v.visual.objects || {}, c = v.visual.visualContainerObjects || {}, tip = p.page.type === 'Tooltip';
    const fill = o.fillCustom || [];
    if (fill.length !== 1 || fill[0].selector || lit(fill[0].properties.show) !== 'false') bad.push(`${id}: fillCustom ${JSON.stringify(fill)}`);
    for (const k of ['padding', 'spacing']) if (!(c[k] || []).length || c[k].some((x) => x.selector)) bad.push(`${id}: ${k} ${c[k] ? 'has a selector' : 'missing'}`);
    const pad = ((c.padding || [])[0] || {}).properties || {}, t = ((c.title || [])[0] || {}).properties || {};
    const s = tip ? 1 : p.page.height / 720, k = p.page.height / 1080, P = Math.round(8 * s / 1.5), line = lit(t.show) === 'true' ? Math.ceil(1.5 * num(t.fontSize)) : 0;
    const T = tip ? P : Math.round(12 * k), top = T > P && Math.floor((v.position.height - T - P - line) / 1.5) < 8 ? P : T;
    const inset = (!tip && insets && insets[pi]) || (!tip && solid ? Math.round(16 * k) : P), a = rtl ? 'right' : 'left', b = rtl ? 'left' : 'right';
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
    // the bands (round 1): empty text boxes outside every group
    const emptyText = (v) => { const ps = ((((v.visual.objects || {}).general || [{}])[0].properties || {}).paragraphs || []); return ps.every((x) => (x.textRuns || []).every((r) => !r.value)); };
    const bands = p.visuals.filter((v) => v.visual && v.visual.visualType === 'textbox' && !v.parentGroupName && emptyText(v)), used = new Set();
    // groups first, so each band is matched to its group before the bands themselves are looked at
    p.visuals.slice().sort((a, b) => (a.visualGroup ? 0 : 1) - (b.visualGroup ? 0 : 1)).forEach((v) => {
      const id = `${p.page.displayName}/${v.visual ? v.visual.visualType : 'group ' + v.visualGroup.displayName}`;
      if (v.visualGroup) {
        const gb = ((((v.visualGroup.objects || {}).background || [])[0] || {}).properties || {}).show;
        if (solid && !tip && kpiGroups.has(v.name)) { if (lit(gb) !== 'false') bad.push(`${id}: the group around the KPI cards must draw no band (background ${lit(gb)})`); }
        else if (solid && !tip && !v.isHidden) {
          // round 1: the header and the filter rail are panels like the cards. A group has no border or shadow, so its
          // own background is off and one empty text box left to the theme lies behind it (measured in Desktop 2.158,
          // DESKTOP-TESTS.md round 1: it shows the theme's card colour, corners and shadow): at the group's box for the
          // rail; for the header grown by 12k at each side and 6k above and below (k = page height / 1080), which lines
          // it up with the rail and the cards
          if (lit(gb) !== 'false') bad.push(`${id}: the group's own band must be off on a solid design (background ${lit(gb)})`);
          const isHeader = p.visuals.some((c) => c.parentGroupName === v.name && c.visual && ['textbox', 'image'].includes(c.visual.visualType));
          const k = p.page.height / 1080, dx = isHeader ? Math.round(12 * k) : 0, dy = isHeader ? Math.round(6 * k) : 0, g = v.position;
          const want = { x: Math.max(0, g.x - dx), y: Math.max(0, g.y - dy) }; want.w = g.x + g.width + dx - want.x; want.h = g.y + g.height + dy - want.y;
          const mine = bands.filter((b) => b.position.x === want.x && b.position.y === want.y && b.position.width === want.w && b.position.height === want.h);
          if (mine.length !== 1) bad.push(`${id}: ${mine.length} panels behind it at ${want.x},${want.y} ${want.w}x${want.h} (the page has ${bands.map((b) => `${b.position.x},${b.position.y} ${b.position.width}x${b.position.height}`).join(' | ') || 'none'})`);
          else { used.add(mine[0].name); if (!(mine[0].position.z < g.z)) bad.push(`${id}: its panel is not under it in the layer order (${mine[0].position.z}, the group ${g.z})`); }
        } else if (v.visualGroup.objects) bad.push(`${id}: group objects ${JSON.stringify(v.visualGroup.objects)}`);
        return;
      }
      if (bands.includes(v)) {
        // a band: nothing written but the title's switch, so the theme draws it; never on a transparent design or a tooltip page
        const c = v.visual.visualContainerObjects || {};
        if (!solid || tip) bad.push(`${id}: an empty panel text box on a ${tip ? 'tooltip page' : 'transparent design'}`);
        else if (JSON.stringify(Object.keys(c)) !== '["title"]' || lit(c.title[0].properties.show) !== 'false') bad.push(`${id}: the panel's container objects ${JSON.stringify(Object.keys(c))}`);
        else if (!used.has(v.name)) bad.push(`${id}: a panel at ${v.position.x},${v.position.y} with no group over it`);
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
