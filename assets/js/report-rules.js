/* DataArcus report rules: the measured rules of scripts/tests/report-check.mjs as a rule engine for any PBIR report
 * (check_report in the MCP; later the website). Each rule says what Power BI Desktop does, with its numbers and where
 * they were measured (scripts/tests/DESKTOP-TESTS.md, the date and the Desktop version). The rules read a report
 * already parsed (see check(report) below) and return findings in numbers and ids only: a finding NEVER quotes the
 * report's own text (titles, text boxes, page names, filter values): a report's text is untrusted input.
 * Only the general rules are here: true of any PBIR report, because they come from how Desktop draws. DataArcus's
 * own layout rules (header and rail heights, our groups) are not run on reports we didn't make.
 * Browser and Node (module.exports / window.DARules). The engine never writes anything. */
(function (root) {
  'use strict';
  const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
  const num = (p) => parseFloat(lit(p));
  const str = (p) => { const v = lit(p); return v == null ? '' : String(v).replace(/^'|'$/g, '').replace(/''/g, "'"); };
  const entries = (list) => (Array.isArray(list) ? list : []);
  const plain = (list) => entries(list).filter((e) => e && !e.selector).reduce((a, e) => Object.assign(a, e.properties || {}), {});
  const withId = (list, id) => entries(list).filter((e) => e && e.selector && e.selector.id === id).reduce((a, e) => Object.assign(a, e.properties || {}), {});
  const look = (list) => { const d = withId(list, 'default'); return Object.keys(d).length ? d : plain(list); };

  // where each number comes from: DESKTOP-TESTS.md, the section's date, the Desktop version, the section's title
  const M = (date, desktop, section) => ({ file: 'scripts/tests/DESKTOP-TESTS.md', date, desktop, section });
  const SRC = {
    sizes: M('2026-09-29', '2.157', 'Power BI Desktop 2.157 (August 2026): theme font sizes must stay within 8-60'),
    heights: M('2026-10-01', '2.157', 'measured in Power BI Desktop 2.157, the heights text boxes, dropdown slicers and Reset need'),
    buttons: M('2026-10-01', '2.158.1177', 'measured on Power BI Desktop 2.158.1177: KPI cards, Reset buttons, page buttons'),
    resetH: M('2026-10-01', '2.158.1177', 'measured on Power BI Desktop 2.158.1177: the Reset button\'s height, Arabic and English'),
    round0: M('2026-10-01', '2.158.1177', 'round 0 measurements'),
    show: M('2026-09-30', '2.157', 'report fixes: a button\'s "show" outside the state selector (and Microsoft\'s button reference)'),
    phone: M('2026-10-03', '2.158.1177', 'round 1 measurements: mobile.json positions and selectors')
  };
  // The text rules were measured in these fonts; on another font a finding is an estimate (a note, never an error)
  const MEASURED_FONTS = ['segoe ui', 'tahoma'];
  const measuredFont = (f) => !f || MEASURED_FONTS.includes(String(f).toLowerCase().replace(/^'|'$/g, '').split(',')[0].trim());
  // heights and widths in page units (a point size takes the same page units on any page, as measured)
  const BOX = (t, n) => Math.ceil(10 + 1.8 * t * (n || 1));        // a text box: 10 + 1.8 x pt a line
  const BTN_H = (t) => Math.ceil(6 + 1.6 * t);                     // a button's one line (Arabic needs the 6)
  const BTN_TW = (t, n) => 0.45 * 4 / 3 * t * n;                   // a button's text, 0.45 em a character
  const CH = (t) => t * 0.55 * 4 / 3;                              // a text box's character, 0.55 em
  const SLICER = (t) => Math.ceil(16 + 4 * t);                     // a dropdown slicer, title and box
  const STATES = ['default', 'hover', 'press', 'pressed', 'disabled', 'selected'];

  // The rules. Each: id, group (the check_report "checks" input), severity, source, what it checks, and run(R, out),
  // where R is the parsed report and out(visual or file, what, fix, extra) adds a finding.
  const RULES = [
    { id: 'TEXT_SIZE_RANGE', group: 'sizes', severity: 'error', source: SRC.sizes,
      about: 'every text size is within Power BI\'s 8-60pt',
      run(R, out) {
        R.visuals.forEach((x) => {
          const sizes = [];
          const walk = (o) => { if (!o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) { if (/^(fontSize|textSize)$/.test(k) && v && v.expr) sizes.push(num(v)); else if (k === 'textStyle' && v && v.fontSize) sizes.push(parseFloat(v.fontSize)); else walk(v); } };
          walk((x.json.visual || {}).objects); walk((x.json.visual || {}).visualContainerObjects);
          const bad = sizes.filter((t) => !isNaN(t) && (t < 8 || t > 60));
          if (bad.length) out(x, `${bad.length} text size${bad.length === 1 ? '' : 's'} outside 8-60pt (${bad.join(', ')}pt)`, 'Use sizes from 8 to 60pt: Power BI refuses a theme outside that range, and on a visual such a size draws badly.');
        });
      } },
    { id: 'TEXTBOX_FITS', group: 'sizes', severity: 'warning', source: SRC.heights,
      about: 'a text box\'s height holds its lines: 10 + 1.8 x pt a line, the lines wrapped at 0.55 em a character',
      run(R, out) {
        R.visuals.filter((x) => x.type === 'textbox').forEach((x) => {
          const paras = (plain(((x.json.visual || {}).objects || {}).general).paragraphs) || [];
          let lines = 0, top = 0, text = 0, fonts = [];
          paras.forEach((p) => {
            const runs = p.textRuns || [], t = Math.max(0, ...runs.map((r) => parseFloat(((r.textStyle || {}).fontSize) || '') || R.textSize));
            const len = runs.reduce((a, r) => a + String(r.value || '').length, 0); text += len;
            runs.forEach((r) => fonts.push((r.textStyle || {}).fontFamily || R.font));
            top = Math.max(top, t);
            lines += Math.max(1, Math.ceil(len * CH(t) / Math.max(1, x.w - 10)));
          });
          if (!text) return;
          const need = BOX(top, lines);
          if (x.h + 0.5 < need) out(x, `the box is ${x.h} high; ${lines} line${lines === 1 ? '' : 's'} of ${top}pt (${text} characters in ${x.w} wide) need ${need}`, `Make the box at least ${need} high, or the text smaller: Power BI shows a scrollbar or cuts the text.`, fonts.every(measuredFont) ? null : { estimate: true });
        });
      } },
    { id: 'BUTTON_ONE_LINE', group: 'sizes', severity: 'warning', source: SRC.buttons,
      about: 'a button\'s text never wraps: one line needs 6 + 1.6 x pt in height; with an icon (as wide as the button is high, drawn at the start) the text (0.45 em a character) + the icon + 6 fit the width',
      run(R, out) {
        R.visuals.filter((x) => x.type === 'actionButton').forEach((x) => {
          const o = (x.json.visual || {}).objects || {}, tx = look(o.text), t = num(tx.fontSize) || R.labelSize, n = str(tx.text).length;
          if (!n || lit(plain(o.text).show) === 'false') return;
          const icon = (str(look(o.icon).shapeType) || 'blank') !== 'blank' && lit(plain(o.icon).show) !== 'false';
          const needH = BTN_H(t), needW = Math.ceil(BTN_TW(t, n) + (icon ? x.h + 6 : 0)), est = measuredFont(str(tx.fontFamily) || R.font) ? null : { estimate: true };
          if (x.h + 0.5 < needH) out(x, `the button is ${x.h} high; one line of ${t}pt needs ${needH}`, `Make it at least ${needH} high: a button never wraps its text, and Arabic text needs the most.`, est);
          else if (x.w + 0.5 < needW) out(x, `the button is ${x.w} wide; ${n} characters at ${t}pt${icon ? ` and its icon (${x.h} wide at this height)` : ''} need ${needW}`, `Make it at least ${needW} wide${icon ? ', or turn the icon off' : ''}: Power BI cuts the text${icon ? ' or draws the icon over it' : ''}.`, est);
        });
      } },
    { id: 'SLICER_FITS', group: 'sizes', severity: 'warning', source: SRC.heights,
      about: 'a dropdown slicer (its title and its box) needs 16 + 4 x pt in height',
      run(R, out) {
        R.visuals.filter((x) => x.type === 'slicer' && /dropdown/i.test(str(plain(((x.json.visual || {}).objects || {}).data).mode))).forEach((x) => {
          const t = num(plain(((x.json.visual || {}).objects || {}).header).textSize) || R.slicerSize, need = SLICER(t);
          if (x.h + 0.5 < need) out(x, `the dropdown slicer is ${x.h} high; at ${t}pt it needs ${need}`, `Make it at least ${need} high: the box under the title is cut.`);
        });
      } },
    { id: 'SELECTOR_SHOW', group: 'selectors', severity: 'warning', source: SRC.show,
      about: 'a button card\'s "show" switch inside a state selector (default, hover...) is ignored: it goes in its own entry with no selector',
      run(R, out) {
        R.visuals.filter((x) => /button|navigator/i.test(x.type)).forEach((x) => {
          const o = (x.json.visual || {}).objects || {};
          const cards = Object.keys(o).filter((k) => entries(o[k]).some((e) => e && e.selector && STATES.includes(e.selector.id) && e.properties && 'show' in e.properties));
          if (cards.length) out(x, `${cards.length} formatting card${cards.length === 1 ? '' : 's'} (${cards.join(', ')}) set "show" inside a state selector`, 'Move each "show" into its own entry without a selector, as Power BI Desktop saves it; inside a state it is ignored and the text, fill or outline stays hidden.');
        });
      } },
    { id: 'SELECTOR_CARD', group: 'selectors', severity: 'warning', source: SRC.round0,
      about: 'on the card visual (cardVisual), the container\'s padding and spacing and the card\'s fillCustom "show" are ignored with the "default" selector; the card\'s value, label and outline are ignored without it',
      run(R, out) {
        R.visuals.filter((x) => x.type === 'cardVisual').forEach((x) => {
          const v = x.json.visual || {}, o = v.objects || {}, c = v.visualContainerObjects || {}, bad = [];
          ['padding', 'spacing'].forEach((k) => { if (entries(c[k]).some((e) => e && e.selector && e.selector.id === 'default')) bad.push(`the container's ${k} with "default"`); });
          if (entries(o.fillCustom).some((e) => e && e.selector && e.selector.id === 'default' && e.properties && 'show' in e.properties)) bad.push('fillCustom "show" with "default"');
          ['value', 'label', 'outline'].forEach((k) => { if (entries(o[k]).some((e) => e && !e.selector)) bad.push(`${k} without "default"`); });
          if (bad.length) out(x, `${bad.length} entr${bad.length === 1 ? 'y' : 'ies'} Desktop ignores: ${bad.join('; ')}`, 'Write the container\'s padding and spacing and fillCustom\'s "show" without a selector, and the card\'s value, label and outline with selector { id: "default" }.');
        });
      } },
    { id: 'TOOLTIP_TYPE', group: 'tooltips', severity: 'warning', source: SRC.round0,
      about: 'a report page tooltip is linked with visualTooltip type "Canvas"; "ReportPage" is not a value, and Desktop shows its default tooltip',
      run(R, out) {
        R.visuals.forEach((x) => {
          const t = plain(((x.json.visual || {}).visualContainerObjects || {}).visualTooltip);
          if (t.type && str(t.type) !== 'Canvas' && str(t.type) !== 'Default' && t.section) out(x, `the tooltip page is linked with type "${str(t.type).replace(/[^A-Za-z]/g, '').slice(0, 20)}"`, 'Use type "Canvas" with the tooltip page\'s name in "section"; otherwise Desktop shows its default tooltip.');
        });
      } },
    { id: 'IMAGE_FIT', group: 'selectors', severity: 'warning', source: SRC.round0,
      about: 'an image keeps its ratio with image.fit "Fit"; the old imageScaling.imageScalingType "Fit" stretches it',
      run(R, out) {
        R.visuals.filter((x) => x.type === 'image').forEach((x) => {
          const o = (x.json.visual || {}).objects || {};
          if (str(plain(o.imageScaling).imageScalingType) === 'Fit' && !str(plain(o.image).fit)) out(x, 'the image is set to fit by imageScaling.imageScalingType, which stretches it to the box', 'Use image.fit "Fit" (and leave imageScaling out): the image keeps its ratio, whole and centred.');
        });
      } },
    { id: 'PHONE_OVERLAP', group: 'phone', severity: 'warning', source: SRC.phone,
      about: 'on the phone layout (mobile.json, where a grouped visual\'s position is a page position) no two boxes overlap and every box is inside the 323-wide canvas',
      run(R, out) {
        R.pages.forEach((pg) => {
          const boxes = pg.visuals.filter((x) => x.mobile && x.mobile.position && !x.json.visualGroup);
          boxes.forEach((a, i) => {
            const A = a.mobile.position;
            if (A.x < -0.5 || A.x + A.width > 323.5) out(a, `the phone box is outside the 323-wide canvas (x ${A.x}, width ${A.width})`, 'Move or narrow it on the phone layout.', { file: a.mobileFile });
            boxes.slice(i + 1).forEach((b) => {
              const B = b.mobile.position;
              if (A.x < B.x + B.width - 0.5 && B.x < A.x + A.width - 0.5 && A.y < B.y + B.height - 0.5 && B.y < A.y + A.height - 0.5)
                out(a, `the phone box at ${A.x},${A.y} (${A.width} x ${A.height}) overlaps the ${b.type} ${b.name.slice(0, 20)} at ${B.x},${B.y}`, 'Move one of them on the phone layout.', { file: a.mobileFile });
            });
          });
        });
      } },
    { id: 'THEME_NAME', group: 'theme', severity: 'warning', source: SRC.round0,
      about: 'a theme inside a project has its own "name" equal to the file name report.json references (with .json), and the report folder has a .platform file',
      run(R, out) {
        if (!R.hasPlatform) out(null, 'the report folder has no .platform file', 'Add the .platform file (Power BI Desktop writes it when it saves the project).', { file: '.platform' });
        if (R.theme && R.theme.ref && R.theme.json && String(R.theme.json.name || '') !== R.theme.ref) out(null, `the theme's own name (${String(R.theme.json.name || '').length} characters) is not its file name`, 'Make the theme\'s "name" its file name, with .json, as report.json references it; otherwise Microsoft\'s validator rejects it and Desktop may not load it.', { file: R.theme.file });
      } }
  ];
  const GROUPS = ['sizes', 'selectors', 'phone', 'tooltips', 'theme'];

  // R: { pages: [{ id, visuals: [x] }], visuals: [x], textSize, labelSize, slicerSize, font, theme: { file, ref, json },
  //      hasPlatform }, x: { name, type, file, mobileFile, json (visual.json), mobile (mobile.json or null), x, y, w, h }
  // opts: { groups: [...] }. Returns { findings: [{ rule, severity, file, page, visual, what, fix, source }], ran: [ids] }
  function check(R, opts) {
    const groups = (opts && opts.groups) || GROUPS, findings = [], ran = [];
    RULES.filter((r) => groups.includes(r.group)).forEach((rule) => {
      ran.push(rule.id);
      rule.run(R, (x, what, fix, extra) => {
        const e = extra || {};
        findings.push({ rule: rule.id, severity: e.estimate ? 'note' : rule.severity, file: e.file || (x ? x.file : null), page: x ? x.page : null,
          visual: x ? { name: x.name, type: x.type, x: x.x, y: x.y, w: x.w, h: x.h } : null,
          what: e.estimate ? what + ' (an estimate: measured in Segoe UI and Tahoma, not in this font)' : what, fix,
          source: `measured: ${rule.source.file}, ${rule.source.date}, Desktop ${rule.source.desktop}, "${rule.source.section}"` });
      });
    });
    return { findings, ran };
  }

  const api = { RULES, GROUPS, check };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DARules = api;
})(typeof self !== 'undefined' ? self : this);
