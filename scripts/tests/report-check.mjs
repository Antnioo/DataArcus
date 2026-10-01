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
//    line and a Reset icon 2.25 x pt, a dropdown slicer (title and box) 16 + 4 x pt; width 0.55 em per character
// Returns { phone: [...], sizes: [...] }, what is wrong.
const BOX = (t) => Math.ceil(10 + 1.8 * t), ICON = (t) => Math.ceil(2.25 * t);
const SLICER = (t) => Math.ceil(16 + 4 * t), CH = (t) => t * 0.55 * 4 / 3;
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const num = (p) => parseFloat(lit(p)), str = (p) => String(lit(p) || '').replace(/^'|'$/g, '').replace(/''/g, "'");
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
      } else if (v.visualType === 'actionButton') {
        const o = v.objects || {}, tx = look(o.text), t = font(id(x), num(tx.fontSize)), text = str(tx.text);
        const hasIcon = str(look(o.icon).shapeType) !== 'blank', icon = hasIcon ? ICON(t) : 0, lines = Math.floor((h - 2) / (1.6 * t));
        if (!(lines >= 1) || (hasIcon && h < ICON(t)) || Math.ceil(CH(t) * text.length / (w - icon)) > lines) sizes.push(`${id(x)}: "${text}" at ${t}pt doesn't fit ${w}x${h}`);
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
