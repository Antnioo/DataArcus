// LAYER checks (0.2.9 item 11): the design lint. It reads the reading layer's inventory (lib/read-report.mjs) and,
// when it has one, the model's tables (types and sort-by columns: what a report's files cannot say), and never opens a
// report file itself. It never reads data: what depends on the data (how long the labels are, how many points an axis
// has) is a guess from names and types, and such a finding is marked "~" (guess: true). Measured on the laptop
// against the owner's test reports (Desktop 2.158): the time axis (O-13), bar labels (O-4), tables (O-14) and the logo
// placeholder (O-6) were caught wherever they happened, and the table rule was narrowed to the setting that was seen
// to fail ("grow to fit" without word wrap), which removed most false alarms on hand-built reports.
// A finding names the visual by its type, title (cleaned), place and size; it never quotes a text box or a value.
import { keyOf, refOf, typeName } from './read-report.mjs';

export const LINT_RULES = {
  AXIS_TEXT_TIME_UNSORTED: 'a chart\'s axis is a text column with a time-like name, no sort-by column in the model, and the visual is not sorted by another field: it sorts A to Z (O-13)',
  AXIS_TIME_UNKNOWN: 'a time-like axis whose type and sort-by column are unknown (no model read)',
  AXIS_HAS_BLANK: 'a chart\'s axis field has a blank value and no "is not blank" filter: a "(Blank)" point (O-3); runs only when the blank count is known',
  TABLE_GROW_TO_FIT: 'a table with "grow to fit" columns, no word wrap and a text column: the text column grows and pushes the others off (O-14)',
  TABLE_WIDTHS_TOO_WIDE: 'a table\'s set column widths add up to more than the table',
  BAR_LABELS_MAY_BE_CUT: 'a bar chart whose category axis holds fewer than 18 characters at the label size: longer names end in "..." (O-4)',
  OFF_PAGE: 'a visual outside the page',
  OVERLAP: 'two visible data visuals, cards or slicers overlapping by more than 10% of the smaller',
  COVER_CARDS: 'a card laid over another visual at the same place (a "no data" message): counted apart, not an overlap',
  NO_TITLE: 'a chart or table whose title is switched off, with no text box just above it (with no title setting Power BI draws its own title)',
  PLACEHOLDER_TEXT: 'placeholder wording left in a title or text box ("Your logo", «شعارك», lorem ipsum...) (O-6)'
};

const CHARTS = /^(lineChart|areaChart|stackedAreaChart|columnChart|clusteredColumnChart|barChart|clusteredBarChart|stackedBarChart|stackedColumnChart|hundredPercentStacked\w+|line\w*ComboChart|ribbonChart|waterfallChart)$/;
const BARS = /^(barChart|clusteredBarChart|stackedBarChart|hundredPercentStackedBarChart)$/;
const DATA = /Chart$|^tableEx$|^pivotTable$|^treemap$|^funnel$|^gauge$|^map$|^filledMap$|^azureMap$/;
// (A4-9, audit 4: a time-like name by its whole words, never inside another word: "Candidate" and "Update Status" are
// not dates; "OrderDate", "Month-Year", "fiscal_period", «الشهر» are) a name's words: split on spaces, marks and camel case
const wordsOf = (name) => String(name || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9\u0600-\u06ff]+/).filter(Boolean).map((w) => w.replace(/^ال(?=..)/, ''));
const TIME_WORDS = new Set(['month', 'months', 'year', 'years', 'date', 'dates', 'week', 'weeks', 'quarter', 'quarters', 'qtr', 'period', 'periods', 'day', 'days', 'شهر', 'سنة', 'تاريخ', 'أسبوع', 'ربع', 'يوم']);
const TIMEY = { test: (name) => wordsOf(name).some((w) => TIME_WORDS.has(w)) };
const many = (name) => { const w = wordsOf(name); return (w.some((x) => /^months?$/.test(x)) && w.some((x) => /^years?$/.test(x))) || w.some((x) => /^dates?$|^تاريخ$/.test(x)); };
// (A4-8) the reading layer's titleOff; a visual JSON when given (the reading branch's inventory keeps it, a test's too)
const titleOff = (x) => { if (x.titleOff) return true; const t = (((((x.json || {}).visual || {}).visualContainerObjects || {}).title) || []).find((e) => e && !e.selector && e.properties && e.properties.show); const v = t && t.properties.show.expr && t.properties.show.expr.Literal && t.properties.show.expr.Literal.Value; return String(v) === 'false'; };
const PLACEHOLDER = /your logo|logo here|lorem ipsum|placeholder|title here|text here|click to add|شعارك|عنوان هنا|نص هنا/i;
// a character of a label at a point size (Segoe UI, measured in the report-fixes lab): 1.333 px a point x 0.57 em
// (R7, the cross-review: every number the rules use, named, with where it comes from; a number that was chosen and not
// measured says so, and a finding that rests on one, or on a word list, is a guess)
const MEASURED = {
  PX_PER_PT: { value: 1.333, source: 'a point is 4/3 of a page unit (Power BI\'s 96 dpi page)' },
  CHAR_EM: { value: 0.57, source: 'measured on the laptop, Power BI Desktop 2.158, 10 Oct 2026: the average width of a category label\'s character in Segoe UI, in em' },
  AXIS_SHARE: { value: 25, source: 'Power BI\'s default category-axis maximum width, in % of the visual (no maxMarginFactor set)' },
  BAR_FIT_WARN: { value: 18, source: 'chosen, not measured: fewer characters than this on a bar chart\'s axis is worth a look (a guess)' },
  BAR_FIT_HIGH: { value: 13, source: 'chosen, not measured: fewer than this is likely to cut most names (a guess)' },
  TABLE_SLACK: { value: 20, source: 'chosen, not measured: set widths more than this past the table\'s width scroll' },
  PIVOT_SCROLL: { value: 1.5, source: 'chosen, not measured: a matrix\'s set widths scroll by design up to 1.5 x its width' },
  PAGE_SLACK: { value: 1, source: 'chosen: a visual this far past the page edge is still on the page (rounding)' },
  LABEL_ABOVE: { value: 70, source: 'chosen, not measured: a text box ending up to this far above a visual names it' },
  LABEL_INTO: { value: 12, source: 'chosen, not measured: ... or reaching this far into it' },
  COVER_NEAR: { value: 3, source: 'chosen, not measured: a card within this of another visual\'s place and size lies over it (a "no data" message)' },
  OVERLAP_SHARE: { value: 0.1, source: 'chosen, not measured: an overlap above this share of the smaller visual is worth a look' },
  OVERLAP_HIGH: { value: 0.5, source: 'chosen, not measured: above this share an overlap is high' }
};
export { MEASURED };
const V = (k) => MEASURED[k].value;
const pxPerChar = (pt) => pt * V('PX_PER_PT') * V('CHAR_EM');

// model: the model reader's tables ([{ name, columns: [{ name, dataType, sortBy }] }]) or null
// facts: { "Table[Column]": { blank: true } } (the blank count, when the user agreed to read it; not read by the MCP yet)
// opts: { pages: [page numbers] } to lint only those
export function lint(inv, model, facts, opts) {
  const o = opts || {}, cols = {};
  (model || []).forEach((t) => (t.columns || []).forEach((c) => { cols[`${t.name}[${c.name}]`] = { type: String(c.dataType || 'unknown').toLowerCase(), sortBy: c.sortBy || null }; }));
  const hasModel = !!(model && model.length);
  const findings = [];
  // (o.titles false: the visual by its type and place only; check_report's lint never returns a report's text, the owner's
  // decision R5 of 11 Oct)
  // (R4: the type through the reading block's screen, never raw; the place rounded)
  const where = (x) => `${typeName(x.type)}${x.title && o.titles !== false ? ` "${x.title}"` : ''} at ${Math.round(x.x)},${Math.round(x.y)} ${Math.round(x.w)}x${Math.round(x.h)}`;
  const add = (rule, severity, p, x, why, fix, guess) => findings.push({ rule, severity, guess: !!guess, page: { n: p.n, name: p.name }, visual: x ? where(x) : null, why, fix });
  const typeOf = (f) => { const k = keyOf(f), m = k && cols[k]; return m ? m.type : null; };
  const isText = (f) => { if (!f || f.kind !== 'column') return false; const t = typeOf(f); return t == null || t === 'unknown' || t === 'string'; };
  for (const p of inv.pages) {
    if (o.pages && o.pages.length && !o.pages.includes(p.n)) continue;
    const shown = p.visuals.filter((x) => !x.hidden && !x.hiddenByGroup && x.type !== 'group');
    for (const x of shown) {
      const F = x.fields || {}, cat = F.Category || [], ys = (F.Y || []).concat(F.Values || []);
      // (a) a text month or date on an axis, sorted A to Z (O-13)
      if (CHARTS.test(x.type)) for (const f of cat) {
        if (!f || f.kind !== 'column' || !TIMEY.test(f.name)) continue;
        const k = keyOf(f), m = cols[k];
        const sortedByOther = x.sort.some((s) => s.field && !(s.field.table === f.table && s.field.name === f.name) && !ys.some((y) => y.table === s.field.table && y.name === s.field.name && y.kind === s.field.kind));
        if (sortedByOther) continue;
        if (m && m.type === 'string' && !m.sortBy)
          add('AXIS_TEXT_TIME_UNSORTED', many(f.name) ? 'high' : 'medium', p, x, `${refOf(f)} is a text column and the model gives it no sort-by column, so the axis runs in alphabetical order${x.sort.length ? ' (the visual is ordered by its value, not by time)' : ''}${many(f.name) ? '; a label holding month and year is likely to give many points and a scrollbar' : ''}`,
            'order the chart by the earliest date of each label (a MIN of the date column in Tooltips, then sort by it), and keep the last 12 months when there are more than about two years; or put Year and Month on the axis as two levels', true);   // (R7: a time field known by the words of its name: a guess)
        else if (m && m.type === 'unknown' && !m.sortBy)
          add('AXIS_TEXT_TIME_UNSORTED', 'medium', p, x, `${refOf(f)} has no type in the model's files (a column of a DAX table) and no sort-by column: if it holds text, the axis runs in alphabetical order`, 'check its type; order the chart by the earliest date of each label, or give the column a sort-by column in the model', true);
        else if (!m && !hasModel) add('AXIS_TIME_UNKNOWN', 'note', p, x, `${refOf(f)} is named like a time field, and without the model its type and sort-by column cannot be known`, 'make sure it is a date, or a text column with a sort-by column', true);
      }
      // (a2) a blank on the axis (O-3): only when the blank count is known (facts), never guessed
      if (CHARTS.test(x.type) && facts) for (const f of cat) { const k = keyOf(f); if (k && facts[k] && facts[k].blank && !x.filters.some((g) => g.notBlank && g.field && g.field.table === f.table && g.field.name === f.name))
        add('AXIS_HAS_BLANK', 'medium', p, x, `${refOf(f)} has blank values: the axis gets a "(Blank)" point`, 'filter the axis field to "is not blank" on the visual, or tell the user that some rows have no value there', false); }
      // (b) tables (O-14): "grow to fit" without word wrap and a text column; set widths wider than the table
      if (x.type === 'tableEx' || x.type === 'pivotTable') {
        const all = Object.values(F).flat(), text = all.filter(isText), fm = x.format || {};
        const widths = Object.values(fm.widths || {}).reduce((a, b) => a + b, 0), setAll = Object.keys(fm.widths || {}).length >= all.length && all.length > 0;
        if (fm.growToFit && fm.wordWrap !== true && text.length && all.length > 1)
          add('TABLE_GROW_TO_FIT', 'high', p, x, `the columns are set to "grow to fit" with no word wrap, so ${text.map(refOf).join(', ')} widen${text.length === 1 ? 's' : ''} to the longest text and the other ${all.length - text.length} column(s) move out of view`,
            'switch off auto-size, give each column its own width (90 to 130 for numbers, what is left for text) and switch on word wrap', text.some((f) => typeOf(f) == null || typeOf(f) === 'unknown'));
        else if (setAll && fm.autoSize === false && widths > (x.type === 'pivotTable' ? x.w * V('PIVOT_SCROLL') : x.w - V('TABLE_SLACK')))
          add('TABLE_WIDTHS_TOO_WIDE', 'medium', p, x, `the set column widths add up to ${Math.round(widths)} in a table ${x.w} wide`, `bring the widths down to ${Math.round(x.w - 36)} in all, or widen the table`, false);
      }
      // (c) bar labels (O-4): the axis share of the width at the label size the visual or the theme sets
      if (BARS.test(x.type) && cat.length) {
        const share = (x.format && x.format.axisShare) || V('AXIS_SHARE'), pt = (x.format && x.format.axisFontSize) || inv.theme.labelSize || 10;
        const fit = Math.floor(x.w * share / 100 / pxPerChar(pt)), f = cat[cat.length - 1];
        if (isText(f) && fit < V('BAR_FIT_WARN')) add('BAR_LABELS_MAY_BE_CUT', fit < V('BAR_FIT_HIGH') ? 'high' : 'medium', p, x, `about ${fit} characters of a category name fit (visual ${x.w} wide, category axis share ${share}, label ${pt} pt); ${refOf(f)} is text, so longer names are cut with "..."`,
          'raise the category axis maximum width to 40 or 50, or give the chart more width; the longest name decides', true);
      }
      // (d) off the page
      if (p.w && p.h && (x.x < -V('PAGE_SLACK') || x.y < -V('PAGE_SLACK') || x.x + x.w > p.w + V('PAGE_SLACK') || x.y + x.h > p.h + V('PAGE_SLACK'))) add('OFF_PAGE', 'high', p, x, `part of the visual lies outside the ${p.w}x${p.h} page`, 'move it or make it smaller', false);
      // (e) a data visual with its title switched off and no text box just above it. (A4-8, audit 4: with no title setting,
      // Power BI draws its own title, "Sales by Region", so that is not a missing title)
      if (DATA.test(x.type) && !x.title && titleOff(x)) {
        const label = shown.some((t) => t.type === 'textbox' && t.text && t.y + t.h <= x.y + V('LABEL_INTO') && t.y + t.h >= x.y - V('LABEL_ABOVE') && t.x < x.x + x.w && t.x + t.w > x.x);
        if (!label) add('NO_TITLE', 'medium', p, x, 'no title, and no text box just above it to name it', 'add a title that says what the visual answers', false);
      }
      // (f) placeholder wording (read from the raw text, never quoted)
      if (PLACEHOLDER.test([x.rawTitle, x.rawText].filter(Boolean).join(' '))) add('PLACEHOLDER_TEXT', 'high', p, x, 'the words of a placeholder are still there', 'put the real content in, or take the visual out', true);   // (R7: a word list: a guess)
    }
    // (d2) overlapping data visuals; a card over another visual at the same place (within 3) is a cover, counted apart
    const data = shown.filter((x) => DATA.test(x.type) || /^card/.test(x.type) || x.type === 'multiRowCard' || x.type === 'kpi' || x.slicer);
    let covers = 0;
    for (let a = 0; a < data.length; a++) for (let b = a + 1; b < data.length; b++) {
      const A = data[a], B = data[b];
      const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x), oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
      if (ox <= 2 || oy <= 2) continue;
      const near = (m, n) => Math.abs(m - n) <= V('COVER_NEAR');
      if (near(A.x, B.x) && near(A.y, B.y) && near(A.w, B.w) && near(A.h, B.h) && (/^card/.test(A.type) || /^card/.test(B.type))) { covers++; continue; }
      // (writer round 9, RESCORE-2's OVERLAP 2 on every rc.4 report) a card behind its own table: the table's panel, at the
      // slot's height, the table on its whole rows inside it (same place and width, the card at least as high): a cover
      const panelOf = (cd, tb) => /^card/.test(cd.type) && /^(tableEx|pivotTable)$/.test(tb.type) && cd.h >= tb.h - V('COVER_NEAR') && (cd.z == null || tb.z == null || cd.z < tb.z);
      if (near(A.x, B.x) && near(A.y, B.y) && near(A.w, B.w) && (panelOf(A, B) || panelOf(B, A))) { covers++; continue; }
      const share = ox * oy / Math.max(1, Math.min(A.w * A.h, B.w * B.h));
      if (share > V('OVERLAP_SHARE')) add('OVERLAP', share > V('OVERLAP_HIGH') ? 'high' : 'medium', p, A, `covers ${Math.round(share * 100)}% of the smaller of it and ${where(B)}`, 'move one of the two, or show them one at a time with bookmarks when they are alternatives', false);
    }
    if (covers) add('COVER_CARDS', 'note', p, null, `${covers} card(s) sit on another visual at the same place (the "no data" message pattern), not counted as overlaps`, 'none, when that is meant', false);
  }
  const rank = { high: 0, medium: 1, note: 2 };
  findings.sort((a, b) => rank[a.severity] - rank[b.severity]);
  const counts = {}; findings.forEach((f) => { counts[f.rule] = (counts[f.rule] || 0) + 1; });
  const notChecked = [].concat(facts ? [] : ['AXIS_HAS_BLANK: needs the number of blanks per axis column, read from the model only with the user\'s consent (laptop-only for now)'],
    hasModel ? [] : ['the model was not read: column types and sort-by columns are unknown, so the time-axis rule can only say "~"'],
    ['label and text lengths: read from the names and types, not the data (the "~" findings)']);
  return { findings, counts, modelRead: hasModel, guesses: findings.filter((f) => f.guess).length, notChecked,
    sayFirst: findings.length ? 'Findings marked guess (~) come from field names and types, not from data: say so when you tell the user. On DataArcus\'s own planned page, fix them in the plan before showing it; on the user\'s existing report, show them as "worth a look", never as errors.' : 'No design findings.' };
}
