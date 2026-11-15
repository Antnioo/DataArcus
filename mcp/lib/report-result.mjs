// create_report's answer and its notes, from one report's build (0.3.2 SP3, the split's step 3: B-280, B-286; moved out of
// report-run.mjs's finish as it was, no change of behaviour). Pure: it reads only what it is given (the build's metadata,
// the written theme, the format script's answer) and never a file, the plan's state or the model on disk; the write
// (withPlan, writeTree, formatsAnswer) stays in report-run.mjs and runs first. reportNotes is the build's own array: the
// build's notes come first, this adds the answer's after them, as before the move.
import path from 'node:path';
import { visible, modelOf } from './model.mjs';
import { switchSaid } from './metric-switcher.mjs';
import { flipHow } from './flip-cards.mjs';
import { iconsSaid, iconsHow } from './status-icons.mjs';
import { daxSaid, daxHow } from './dax-functions.mjs';
import { hiddenOf } from './hidden-names.mjs';
import { SVG_STATUS, boundOf } from './report-fields.mjs';
import { flipAnswer, topSaid, CARD_RULE, modelNotes, phoneAnswer, calendarSaid, tableSmallerSaid, rowLabelSaid, rowLabelSkippedSaid, extRenamedSaid, uniqueFields } from './report-said.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Bind = require('../../assets/js/pbip-bind.js');
const Fix = require('../../assets/js/model-health-tmdl.js');

/** The answer of a written report: x holds the build's values by their names in report-run.mjs (reportRun), fieldsOf
 *  its field list of a binding; fmt is formatsAnswer's (null without a format script). Returns the answer object. */
export function reportAnswer(x) {
  const { a, m, r, bind, given, written, fmt, projectCheck, extra, unknown, sc, designRepaired, reportNotes, kpiCards, leftOutVisuals, textLeftOut, PF, SV, SC, boundPages, smallPageNote, tinyPage, subKeys, ringNumbers, FULL, cardFormats, tableFormats, flip, icons, daxR, englishNames, textKpis, slicersDropped, byFlagDay, modelNames, F, galleryList, SW, CO, barThickness, fieldsOf } = x;
  const ra = { a, m, r, bind, given, written, fmt, projectCheck, extra, unknown, sc, designRepaired, reportNotes,
      kpiCards, leftOutVisuals, textLeftOut, PF, SV, SC, boundPages, smallPageNote, tinyPage, subKeys, ringNumbers,
      FULL, cardFormats, tableFormats, flip, icons, daxR, englishNames, textKpis, slicersDropped, byFlagDay,
      modelNames, F, galleryList, SW, CO, barThickness, fieldsOf };
  panelsStep(ra);
  formatsStep(ra);
  pageNotesStep(ra);
  looksStep(ra);
  axesStep(ra);
  leftOutStep(ra);
  titlesStep(ra);
  return answerStep(ra);
}
// the panels behind the visuals, the KPI cards, the text boxes, the titles and the page filters said
function panelsStep(ra) {
  const { a, r, written, reportNotes, kpiCards, leftOutVisuals, textLeftOut, PF } = ra;
  // what the report shows behind its visuals (read from the theme that was written, as the report writer reads it)
  const solid = !!((((((written.visualStyles || {})['*'] || {})['*'] || {}).background || [{}])[0] || {}).show);
  const panels = solid
    ? 'Each KPI card, chart and table has its own panel, drawn by the theme (solid visuals in the card colour, with the design\'s corners and shadow); the header and the filter rail are bands. There is no background picture: each page\'s background file is blank and see-through (listed with the report\'s files), so the page shows the theme\'s colour.'
    : 'The visuals have no panels of their own (the theme\'s visuals are transparent): they show on the page\'s background image where one is given, otherwise straight on the page. For panels, use a design or a theme with solid visuals.';
  if (kpiCards && leftOutVisuals.length) kpiCards.leftOutVisuals = leftOutVisuals;
  if (kpiCards) reportNotes.push(`KPI cards: ${kpiCards.built} of ${kpiCards.asked} built. ${kpiCards.why}`);
  if (textLeftOut.length) reportNotes.push(`The text box${textLeftOut.length === 1 ? '' : 'es'} ${[...new Set(textLeftOut)].map((x) => `"${x}"`).join(', ')} ${textLeftOut.length === 1 ? 'was' : 'were'} left out: create_report was given no text for ${textLeftOut.length === 1 ? 'it' : 'them'}, and a placeholder is never written${a.design ? '; the chart beside it takes its room' : ''}. For the box, pass the plan's sentence in "text" (what the main chart shows and what to do about it, in the report's language).`);
  // chart and table titles too long for one line (round 12, #24): wrapped to two, or shortened at the end with "…"
  const TT = r.titles || { wrapped: [], shortened: [], slicers: [] };
  if (TT.shortened.length || TT.slicers.length) reportNotes.push(`${TT.shortened.length + TT.slicers.length} title${TT.shortened.length + TT.slicers.length === 1 ? ' was' : 's were'} shortened at the end with "…" to fit (the full name stays the visual's alt text): ${[...new Set(TT.shortened.map((x) => `"${x.title}" as "${x.shown}"`).concat(TT.slicers.map((x) => `the slicer "${x.field}" as "${x.shown}"`)))].slice(0, 8).join('; ')}. Shorter display names (displayNames, from the user) read better.`);
  // the page filters, in words: the user must see that the pages show part of the data
  const shownValue = (v) => (typeof v === 'string' ? `"${v}"` : String(v));
  if (PF) reportNotes.push(`${PF.length === 1 ? 'A page filter is' : PF.length + ' page filters are'} set on every page of the report: ${PF.map((f) => `${f.key} is ${f.values.map(shownValue).join(' or ')}`).join('; ')}. Every visual shows only that part of the data. The user sees, changes or clears ${PF.length === 1 ? 'it' : 'them'} in the Filters pane of Power BI.`);
  Object.assign(ra, { panels, TT });
}
// the model notes, the numbers without a thousand separator and the SVG measures
function formatsStep(ra) {
  const { m, r, bind, reportNotes, PF, SV, SC, boundPages, cardFormats, tableFormats, fieldsOf } = ra;
  const notes = modelNotes(m.tmsl, bind);
  // numbers the report shows whose format in the model has no thousand separator (or that have no format): Power BI
  // takes the format of a table cell, a tooltip and an unscaled card from the model, so the report can't add it
  const noSep = (() => {
    const model = modelOf(m.tmsl), out = [];
    // (measures wherever they are shown; number columns only in the table, and never an identifier or a date part)
    // (SQ10, audit-3-picker-writer-S2: each field once by its table and name)
    uniqueFields(fieldsOf(bind).filter((f) => f.m != null).concat((bind.table || []).filter((f) => f && f.c != null && f.num && !Fix.notAQuantity(f.c)))).forEach(({ key: k, f }) => {
      const t = (model.tables || []).find((x) => x.name === f.t), o = t && (f.m != null ? (t.measures || []).find((x) => x.name === f.m) : f.num ? (t.columns || []).find((x) => x.name === f.c) : null);
      if (!o || o.formatStringDefinition) return;
      if (f.m != null && Bind.isPercent(f.m, o.formatString, o.expression)) return;
      if (!o.formatString || Fix.lacksSeparator(o.formatString)) out.push(k);
    });
    return out;
  })();
  const numberFormats = noSep.length ? { numberFormats: { noThousandSeparator: noSep,
    ...(cardFormats.length ? { cards: { formatted: cardFormats, note: 'The KPI cards of these measures carry a number format of their own in the report (the measure\'s format with the thousand separator), so a card shows the full number with the separator, like 101,914, not a scaled one like 101.914K. The model is not changed.' } } : {}),
    ...(tableFormats.length ? { tables: { formatted: tableFormats, note: 'The tables of the report carry a number format of their own for these measures (the measure\'s format with the thousand separator), so a table shows 13,857, not 13857. The model is not changed.' } } : {}),
    charts: 'Chart labels and axes are not formatted by the report: they show scaled numbers (65K), which a format does not change.',
    why: 'These fields have no format with a thousand separator in the model. Wherever Power BI takes the format from the model (a visual added by hand, Excel, another report) they show 13857, not 13,857.',
    fix: 'check_model_health writes ready scripts that add the formats (fixes.NO_FORMAT for measures without a format, fixes.THOUSANDS for formats without a separator), or in Power BI Desktop select each measure, then Measure tools > the thousands separator button.' } } : {};
  if (PF) PF.filter((f) => f.note).forEach((f) => reportNotes.push(f.note));
  const svgList = (SV || []).map((c) => Object.assign({ label: c.label, entity: c.t, page: boundPages[c.at.page].name, shownAs: 'a column of that page\'s table, after its own columns (in a right-to-left report after its text column)', characters: c.expression.length, status: SVG_STATUS }, (r.svgSizes || {})[c.at.page] ? { imageWidth: r.svgSizes[c.at.page].w, imageHeight: r.svgSizes[c.at.page].h } : {}))
    .concat((SC || []).map((c) => ({ label: c.label, entity: c.t, shownAs: `the image of KPI card ${c.card} on every page`, characters: c.expression.length, status: SVG_STATUS })));
  const svgMeasures = svgList.length ? { svgMeasures: svgList } : {};
  Object.assign(ra, { notes, numberFormats, svgList, svgMeasures });
}
// the SVG sizes, the small page, the subtitles, blank cards, bar charts, short days and rings said
function pageNotesStep(ra) {
  const { a, r, bind, reportNotes, boundPages, smallPageNote, tinyPage, subKeys, ringNumbers, svgList } = ra;
  // pictures narrowed so the table fits its box (never a scrollbar or a cut header)
  Object.entries(r.svgSizes || {}).filter(([, z]) => z.capped).forEach(([pi, z]) => reportNotes.push(`The SVG pictures in the table on "${boundPages[pi].name}" were narrowed to ${z.w} x ${z.h} (the widest design is ${z.design}) so the table fits its box. For the design's own size, give the table more room or fewer columns.`));
  // round 19 (the owner's choice B): a page under 800 wide takes the single-focus layout (the design engine's rule):
  // said when this call switched it (a design already planned as single focus was told so by plan_layout)
  if (smallPageNote) reportNotes.push(`The page is ${smallPageNote.w} wide, under 800, so it uses the single-focus layout (the KPI cards and one large chart): the executive layout's four charts and table would be cut or scroll on it.`);
  if (tinyPage && a.secondPage) reportNotes.push('The page is under 800 wide: the report has one page. A second page (details) would cut its card values and scroll its table at this size; ask for a page 800 wide or more for two pages.');
  if (a.subtitles) { const used = new Set(r.subtitlesUsed || []), un = Object.keys(a.subtitles).filter((k) => !used.has(subKeys[k] || k));
    if (un.length) reportNotes.push(`No subtitle was written for ${un.map((k) => '"' + k + '"').join(', ')}: a subtitle goes under the title of a chart or a table, found by its slot's role as plan_layout names it (in English or Arabic) or by a hand-placed slot's title. A KPI card never gets one (its value would be pushed down and cut).`); }
  if ((r.blankKept || []).length) reportNotes.push(`${r.blankKept.length === 1 ? 'A KPI card keeps' : r.blankKept.length + ' KPI cards keep'} "--" when there is no data (${r.blankKept.map((x) => `${x.title ? '"' + x.title + '"' : 'a card'} on "${x.page}", ${x.w} wide, needs ${x.need}`).join('; ')}): the "No data" text, at the value's own size, does not fit, and the value keeps its size.`);
  if ((r.barCharts || []).length) reportNotes.push(`The chart${r.barCharts.length === 1 ? '' : 's'} by ${[...new Set(r.barCharts.map((x) => x.field))].join(', ')} on ${[...new Set(r.barCharts.map((x) => `"${x.page}"`))].join(', ')} ${r.barCharts.length === 1 ? 'is a bar chart' : 'are bar charts'} instead of a column chart: the names would not fit side by side and would slant; as bars they read level. A short day name column in the model (Sun ... Sat, as the Gulf calendar's) keeps a column chart.`);
  if ((r.shortDays || []).length) { const sh = Object.values((bind && bind.cats) || {}).find((f) => f && f.short), shortCol = sh ? visible(sh.short.c) : 'the short day names', fullCol = sh ? visible(sh.c) : 'the day names'; reportNotes.push(`The column chart${r.shortDays.length === 1 ? '' : 's'} by day on ${[...new Set(r.shortDays.map((x) => `"${x.page}"`))].join(', ')} ${r.shortDays.length === 1 ? 'shows' : 'show'} ${shortCol} (Sun ... Sat), in the calendar's order: the full day names would not fit side by side and would slant. Tables and slicers keep ${fullCol}.`); }
  if ((r.ringsSmall || []).length) reportNotes.push(`The ring${r.ringsSmall.length === 1 ? '' : 's'} in the table (${[...new Set(r.ringsSmall.map((x) => x.label))].join(', ')}) ${r.ringsSmall.length === 1 ? 'is' : 'are'} drawn ${Math.max(...r.ringsSmall.map((x) => x.h))} high, too small for a number to be read, so ${r.ringsSmall.length === 1 ? 'it has' : 'they have'} no number inside: the measure's own column in the table carries the value (add it to fields.table where the table does not have it).`);   // (night of 6-7 Oct, seen in Desktop: a table without that column showed the value nowhere, and the note said it did)
  if (ringNumbers.length) reportNotes.push(`The ring${ringNumbers.length === 1 ? '' : 's'} on the KPI card${ringNumbers.length === 1 ? '' : 's'} (${ringNumbers.join(', ')}) ${ringNumbers.length === 1 ? 'has' : 'have'} no number inside: the card already shows the value, and two numbers read as two facts. A table picture keeps its number.`);
  if (svgList.length) reportNotes.push(`${svgList.length === 1 ? 'An SVG picture was' : svgList.length + ' SVG pictures were'} added (${svgList.map((c) => c.label).join(', ')}): each is a measure that exists only in this report (definition/reportExtensions.json); the model was not changed. This is ${SVG_STATUS}.`);
}
// the KPI values, the chart colours and axes, the slicers, flip cards, icons, the DAX library and waterfalls
function looksStep(ra) {
  const { m, r, reportNotes, FULL, flip, icons, daxR, englishNames, textKpis } = ra;
  // how the KPI cards show their numbers
  const kpiValues = { kpiValues: FULL
    ? { mode: 'full', note: 'The KPI cards show Power BI\'s own default, and the full number with thousand separators (101,914) where the measure\'s format has none; the value is smaller on narrow cards so nine digits fit.' }
    : { mode: 'auto', note: CARD_RULE + ' For full numbers with separators on every card (101,914) pass kpiValues: "full".' } };
  // the bars' colours (round 13): what was written, and why not when a gradient was asked and the colour cannot fade
  const CC = r.chartColors || {};
  // polish round P1 (B-71), P1+ (LAB-POLISH) and P3 (RESCORE-6 N25-N27): the fade's strong end is the chart's colour itself
  // (never past it), the weak end its tint; the second colour is chosen (never a red or status colour); a chart's colour is
  // keyed to its category field, so one field keeps one colour on every page
  const soft = (e) => (e && e.soft ? ' (the colour stands near 3:1 on the visuals, so its tint stands under 3:1)' : '');
  const second = CC.ends && CC.charts && CC.second && CC.ends2 ? { second: { charts: CC.second, colour: CC.base2, low: CC.ends2.low, high: CC.ends2.high, note: `A chart's colour follows its category field, the same on every page: the first field takes the theme's colour, the next ${CC.base2}, chosen from the palette (another hue, never a red or status colour, 3:1 on the visuals), and so on in turn. Its bars fade the same way, from its tint (${CC.ends2.low}) up to ${CC.ends2.high}${soft(CC.ends2)}.` } } : {};
  const chartColors = { chartColors: CC.ends && CC.charts
    ? Object.assign({ mode: 'gradient', charts: CC.charts, low: CC.ends.low, high: CC.ends.high }, CC.ends.soft ? { soft: true } : {}, { note: `The bars of the bar and column charts fade by their value: the smallest value shown is its tint towards the panel (${CC.ends.low}), the largest exactly the chart's colour (${CC.ends.high}), never darker${soft(CC.ends)} (conditional formatting on the data colour, a gradient by the chart's measure). The colours are written into each chart: after a change of theme, set them again or pass chartColors: "solid".` }, second)
    : Object.assign({ mode: 'solid' }, CC.asked && !CC.ends ? { why: `The bars' colour (${CC.base}) cannot fade and still stand 3:1 (contrast) off the panel behind it, so every bar keeps that one colour.` } : {}) };
  // a right-to-left report's charts (round 13): mirrored, or left as they are when asked
  const CA = r.chartAxes || {};
  const chartAxes = CA.rtl ? { chartAxes: CA.asked === 'mirrored'
    ? { mode: 'mirrored', charts: CA.charts, note: 'Power BI does not mirror charts in a right-to-left report, so the report does: column and line charts have the value axis at the right and their categories and dates run from the right (the chart is sorted by its category, descending, and a date axis is inverted); bar charts grow from the right with their names at the right; a waterfall (gallery) is Power BI\'s own, left to right as in English, with waterfallRtl "native" (the default: Power BI cannot draw its waterfall design right to left), and with waterfallRtl "mirror" a waterfall (gallery) is written as a stacked column chart drawn as a waterfall, read from the right (Power BI draws a waterfall left to right only; waterfallRtl in reportNotes says what each became). For charts left to right pass chartAxes: "standard".' }
    : { mode: 'standard', note: 'The charts run left to right, as Power BI draws them.' } } : {};
  // (0.3.0 L2) the slicers' style asked, and what each slicer was written as with why; the gridlines asked
  const looks = Object.assign(r.slicerStyle ? { slicerStyle: r.slicerStyle } : {}, r.grid ? { grid: r.grid } : {});
  // (L4) the flip cards: which cards, their bookmarks, the script and how to apply it first
  if (flip) looks.flipCards = Object.assign(flipAnswer(flip), flip.scriptFile ? { scriptFile: flip.scriptFile, howToApply: flipHow(flip.scriptFile, m.projectDir) } : {});
  // (0.3.3 RX1) the plan's views, written as bookmarks in the plan's order
  if (r.views) looks.bookmarks = { views: r.views, say: `${r.views} bookmark${r.views === 1 ? '' : 's'} for the plan's views, first in the Bookmarks pane in the plan's order (View > Bookmarks; "View" in that pane plays them as a slide show). Each opens its page and changes no filter, slicer or visual.` };
  // (L5) the status icons: each column, its way and rule, the script and how to apply it first
  if (icons) looks.statusIcons = Object.assign(iconsSaid(icons), icons.scriptFile ? { scriptFile: icons.scriptFile, howToApply: iconsHow(icons.scriptFile, m.projectDir) } : {});
  // (L6) the DAX function library: said FIRST in the answer (its compatibility step), with the script and how to apply it
  const daxFirst = daxR ? { daxFunctions: Object.assign(daxSaid(daxR), { scriptFile: daxR.scriptFile, howToApply: daxHow(daxR.scriptFile, daxR.compat, m.projectDir) }) } : {};
  // (D1) a right-to-left report's waterfalls: what each was written as (the plan says it too, waterfallRtl)
  (r.waterfallRtl || []).forEach((x) => reportNotes.push(`The waterfall${x.title ? ` "${visible(x.title)}"` : ''} on "${visible(x.page)}": ${x.written === 'columnChart' ? x.what : x.what + (x.why ? ` (${x.why})` : '')}.`));
  if (englishNames.size) reportNotes.push(`${[...englishNames].join(', ')} ${englishNames.size === 1 ? 'shows' : 'show'} the calendar's own names, English unless the calendar was made in Arabic: add the Gulf calendar's Arabic name columns to show Arabic day and month names (add_gulf_calendar writes them, as does the Calendar Generator's "Add Arabic name columns"), then create the report again.`);
  reportNotes.push('How the KPI cards show their numbers: ' + CARD_RULE + (textKpis.length ? '' : ''));
  Object.assign(ra, { kpiValues, chartColors, chartAxes, looks, daxFirst });
}
// the time axes, Top N, blanks, accessibility, tooltips, formats, row labels and the tables said
function axesStep(ra) {
  const { a, r, bind, reportNotes, boundPages, textKpis, slicersDropped, byFlagDay } = ra;
  // 0.2.9 part 2 (the owner's own test of 0.2.8): what the report does to its axes, tables and tooltips, said once
  (r.timeAxes || []).forEach((x) => reportNotes.push(`The line chart by ${visible(x.field)} on "${x.page}" is in time order by the month's first date (a report-level measure, "Month start (sort)", from ${visible(x.by)}; the model's column has no sort column)${x.last ? `, and shows the last ${x.last} months with data (a visual filter: clear it in the Filters pane for the whole history)` : ''}.`));
  // (the cross-review's G13: said only where a chart got the filter)
  // (the design block's S5/D19) the category charts kept to the Top N their slot can show. (0.2.9.1, B-174: the plan said
  // "Top 5" and Desktop showed 6: the writer's Keep: measure shows every category when there are at most allUpTo)
  if (r.topCharts && r.topCharts.length) reportNotes.push(`Bar and column charts by a category show the categories their place on the page can hold, by their measure: ${[...new Set(r.topCharts.map(topSaid))].join('; ')} (a visual filter${r.topCharts.some((x) => x.allUpTo > x.top) ? ' by a report-level "Keep:" measure' : ''}${r.topCharts.some((x) => !(x.allUpTo > x.top)) ? `${r.topCharts.some((x) => x.allUpTo > x.top) ? ' or' : ''} a Top N filter` : ''}, which can be cleared in the Filters pane; the rest are left out, with no "Other" bar). Only when a chart leaves categories out does its title say so, "${`Top ${r.topCharts[0].top} of`}" and the number of its categories, counted in the report under the page's filters; otherwise it shows its plain title (a report-level measure, the model untouched).`);
  if (r.blankFiltered) reportNotes.push('Charts leave out a blank category ("(Blank)"): each has a visual filter "is not blank" on its category, which can be cleared in the Filters pane.');
  if (boundPages && boundPages.some((p) => (p.slots || []).some((x) => x.kind === 'table'))) reportNotes.push('Tables have set column widths, and long text wraps.');
  // (0.3, J7) Power BI's accessibility basics: the data colours stepped to 3:1 on the card are told, from and to
  const A1 = r.a11y || {};
  if ((A1.colours || []).length) reportNotes.push(`${A1.colours.length === 1 ? 'A data colour of the theme was' : A1.colours.length + ' data colours of the theme were'} under 3:1 on the visuals' background ${A1.card} and ${A1.colours.length === 1 ? 'was' : 'were'} made darker or lighter to 3:1, hue kept (Power BI's accessibility basics): ${A1.colours.map((c) => `${c.from} (${c.contrast}:1) -> ${c.to}`).join(', ')}.`);
  if (r.tooltipLimits && (r.tooltipLimits.top || r.tooltipLimits.months)) reportNotes.push(`The tooltip pages show ${[r.tooltipLimits.top ? `the Top ${r.tooltipLimits.top} by the measure (said in the title)` : '', r.tooltipLimits.months ? `the last ${r.tooltipLimits.months} months, newest first` : ''].filter(Boolean).join(' and ')}, so no bar is lost behind a scrollbar a tooltip can't use.`);
  if (textKpis.length) reportNotes.push(`${textKpis.length === 1 ? 'A KPI card was' : textKpis.length + ' KPI cards were'} left out: ${textKpis.map((k) => `${k.t}[${k.m}]`).join(', ')} ${textKpis.length === 1 ? 'shows' : 'show'} text, not a number (a format of words only, a date format, or DAX that returns text), and a KPI card would show that text. Pick a measure that returns a number for the card.`);
  if (slicersDropped.length) reportNotes.push(`No slicer on ${[...new Set(slicersDropped)].join(', ')}: a page filter already keeps one value of ${new Set(slicersDropped).size === 1 ? 'it' : 'each'}, so a slicer would only show the choice already made. The next columns took the rail's places.`);
  // (the rc's laptop proof, D17: a card whose format the model sets by DAX, beside cards in a currency)
  // (round 8: an amount with no format in the model is told the same way: its card shows no currency either)
  if (bind && (bind.formatsMixed || []).length) { const fm = bind.formatsMixed, dyn = fm.filter((x) => !x.unformatted), unf = fm.filter((x) => x.unformatted), ns = (l) => l.map((x) => `${visible(x.t)}[${visible(x.m)}]`).join(', ');
    reportNotes.push(`${[dyn.length ? `${ns(dyn)} ${dyn.length === 1 ? 'takes its' : 'take their'} format from a DAX expression in the model` : null, unf.length ? `${ns(unf)} ${unf.length === 1 ? 'has' : 'have'} no format in the model` : null].filter(Boolean).join('; ')}, so ${fm.length === 1 ? 'its card' : 'their cards'} may show no currency beside the cards that do: say so in the plan, give ${fm.length === 1 ? 'it' : 'them'} the currency format in the model, or name other measures in "fields".`); }
  if (byFlagDay.length) { const x = byFlagDay[0]; reportNotes.push(`The line chart runs by ${x.t}[${x.c}] (its days), not by month: the page filter keeps ${x.flag.t}[${x.flag.c}] true, and one such period by month is a line of two or three points.`); }
  // tables given a smaller text so more of their fields fit (round 12, recommendation 5)
  if ((r.tableSmaller || []).length) reportNotes.push(tableSmallerSaid(r.tableSmaller, r.tableColumns));
  // round 23 (the owner's go, 8 Oct 2026): the right-to-left table's total row says «الإجمالي» (way 4, measured in Desktop); "Total" in an English report
  if ((r.rowLabels || []).length) reportNotes.push(rowLabelSaid(r.rowLabels, a.lang));
  if ((r.rowLabelSkipped || []).length) reportNotes.push(rowLabelSkippedSaid(r.rowLabelSkipped, a.lang));
  // (round 22b, the outside review's X-05) a measure whose name holds a control character gets no "No data" card
  if ((r.noDataSkipped || []).length) reportNotes.push(`No data message for ${r.noDataSkipped.map((x) => `${visible(x.t)}[${visible(x.m)}]`).join(', ')}: not written, the name holds a control character (a tab or a line break) that no DAX may name. Rename it in Power BI Desktop (remove the hidden character) and create the report again for the message.`);
  // (round 22b, the review of round 22, item 8) a table whose name column and first measure need more than its width even at 8pt
  if ((r.tableWide || []).length) reportNotes.push(`${r.tableWide.map((x) => `The table on "${x.page}" needs about ${x.need} for its name column and first measure, wider than the table (${Math.round(x.width)}) even at 8pt`).join('; ')}: it scrolls sideways in Power BI. Make the table wider, or give those two fields shorter display names (displayNames, from the user).`);
  // a header that grew one row so the page names fit as tabs (round 12)
  if ((r.headerGrew || []).length) reportNotes.push(`The header is ${r.headerGrew[0].by} taller on ${r.headerGrew.map((x) => `"${x.page}"`).join(', ')}, so the page names fit as two rows of tabs; the visuals under it moved down and the last row is that much shorter.`);
  // tables whose known rows don't fit even with tight rows (round 12, #23)
  (r.tableRows || []).forEach((x) => reportNotes.push(`The table of ${x.field} on "${x.page}" needs about ${x.need} to show its ${x.rows} rows, a header and a total, even with tight rows, and has ${x.h}: its last rows will scroll. A taller table slot, fewer fields or a larger page shows them all.`));
  // days and months put in calendar order in a table by a helper column (round 12, #17)
  if ((r.tableOrder || []).length) reportNotes.push(`${[...new Set(r.tableOrder.map((x) => x.field))].join(', ')} ${r.tableOrder.length === 1 ? 'is' : 'are'} in calendar order in the table${r.tableOrder.length === 1 ? '' : 's'} too (by ${[...new Set(r.tableOrder.map((x) => x.by))].join(', ')}, the same order as the charts): the model gives ${r.tableOrder.length === 1 ? 'it' : 'them'} no sort-by column, so each table carries the number in a narrow column with no header, in the card colour. Setting the sort-by column in the model (check_model_health, fixes.MONTH_SORT) orders slicers too.`);
  // visuals left out because the model has no field for them (never written empty)
}
// the report language, renamed measures, the visuals left out and the tables' columns
function leftOutStep(ra) {
  const { a, m, r, bind, reportNotes, modelNames, F } = ra;
  const WHY = { funnel: 'a funnel shows an amount, and the model has no measure that is not a ratio or a percent', slicer: 'the model has no more text columns a slicer can use', line: bind && !bind.measure ? 'the model has no measure for it' : bind && bind.noRelatedCalendar ? (bind.noRelatedCalendar.kind === 'date' ? `no date column is related to ${visible(bind.noRelatedCalendar.measure.t)}: the date column${bind.noRelatedCalendar.tables.length === 1 ? '' : 's'} of ${bind.noRelatedCalendar.tables.map(visible).join(', ')} ${bind.noRelatedCalendar.tables.length === 1 ? 'is' : 'are'} not reached from ${visible(bind.noRelatedCalendar.measure.t)}[${visible(bind.noRelatedCalendar.measure.m)}]; add a calendar related to ${visible(bind.noRelatedCalendar.measure.t)} (add_gulf_calendar writes one) for a trend` : `no calendar is related to ${visible(bind.noRelatedCalendar.measure.t)}: the model's calendar${bind.noRelatedCalendar.tables.length === 1 ? '' : 's'} (${bind.noRelatedCalendar.tables.map(visible).join(', ')}) ${bind.noRelatedCalendar.tables.length === 1 ? 'is' : 'are'} not reached from ${visible(bind.noRelatedCalendar.measure.t)}[${visible(bind.noRelatedCalendar.measure.m)}]; add the relationship (a date column of ${visible(bind.noRelatedCalendar.measure.t)} to the calendar's date) for a trend`): 'the model has no month or date column for its axis', table: 'no field was found for it', matrix: 'it needs a text column and a measure', gauge: 'the model has no measure for it', card: 'the model has no measure for it' };
  const KIND = { slicer: 'Slicer', line: 'Line chart', bar: 'Bar chart', column: 'Column chart', donut: 'Donut chart', funnel: 'Funnel', treemap: 'Treemap', map: 'Map', table: 'Table', matrix: 'Matrix', gauge: 'Gauge', card: 'Card' };
  // (round 22b, the outside review's X-04) no category is related to the main measure: the charts that need one are left out
  // round 23 (the owner's rule, 8 Oct 2026: English in English reports, Arabic in Arabic reports): which columns the
  // picker left for the report's language, and the named fields in the other language (the user's names always win)
  if (bind && bind.language) { const L = bind.language, sk = L.skipped || [], fb = L.fallback || [];
    reportNotes.push(`${a.lang === 'ar' ? 'Arabic' : 'English'} report: the columns picked are in ${a.lang === 'ar' ? 'Arabic where the model has an Arabic column for the same thing (the others keep their names, shown through display names)' : 'English'}${sk.length ? `; ${sk.map(visible).join(', ')} ${sk.length === 1 ? 'was' : 'were'} not used: ${a.lang === 'ar' ? 'the English column of an Arabic twin' : 'Arabic columns, with English ones beside them'}` : ''}${fb.length ? `; ${fb.map(visible).join(', ')} ${fb.length === 1 ? 'is' : 'are'} Arabic and used anyway: the model has no English column for ${fb.length === 1 ? 'it' : 'them'}` : ''}. To use another column, name it in "fields".`); }
  if (F) { const tw = Bind.twinsOf(m.tables), cl = Bind.langsOf(m.tables), named = [].concat(F.kpis || [], [F.measure, F.timeAxis, F.category, F.category2], F.table || [], F.slicers || []).filter(Boolean);
    const off = [...new Set(named.filter((f) => { const n = f.c != null ? f.c : f.m, l = f.c != null && cl[Bind.fieldKey(f.t, f.c)] ? cl[Bind.fieldKey(f.t, f.c)] : Bind.langOf(n); return a.lang === 'ar' ? l === 'en' && f.c != null && tw[Bind.fieldKey(f.t, f.c)] : l === 'ar'; }).map((f) => `${visible(f.t)}[${visible(f.c != null ? f.c : f.m)}]`))];
    if (off.length) reportNotes.push(`${off.join(', ')} ${off.length === 1 ? 'is' : 'are'} in ${a.lang === 'ar' ? 'English (the model has an Arabic column beside it)' : 'Arabic'}, and the report is ${a.lang === 'ar' ? 'Arabic' : 'English'}: used as named in "fields".`); }
  // round 23: a report measure renamed because its name is taken (by the model or another report measure: said by its cause)
  if ((r.extRenamed || []).length) reportNotes.push(extRenamedSaid(r.extRenamed, modelNames));
  // round 23: a table's measures that do not reach its rows were left out of it (they would repeat one total on every row)
  if (bind && (bind.notReached || []).length) { const nr = bind.notReached; reportNotes.push(`${nr.map((x) => `${visible(x.t)}[${visible(x.m)}]`).join(', ')} ${nr.length === 1 ? 'was' : 'were'} left out of the table by ${visible(nr[0].row.t)}[${visible(nr[0].row.c)}]: ${[...new Set(nr.map((x) => visible(x.t)))].join(', ')} ${nr.length === 1 ? 'is' : 'are'} not related to ${visible(nr[0].row.t)}, so ${nr.length === 1 ? 'it' : 'each'} would repeat one total on every row. Add the relationship in the model, or name the table's fields in "fields".`); }
  if (bind && bind.noRelatedCategory) { const n = bind.noRelatedCategory; reportNotes.push(`No category is related to ${visible(n.measure.t)}[${visible(n.measure.m)}]: the text columns of ${n.tables.map((t) => visible(t)).join(', ')} are in tables the measure's table does not reach through a relationship, so a chart by them would show the same total on every bar. The charts that need a category are left out. Add a relationship from ${visible(n.measure.t)} to one of those tables, or pick a category of a related table in "fields".`); }
  // (0.3.1 SQ1, M1-S4) narrow: a slicer or the Reset button left out of a filter slot too narrow for it (the shared writer's)
  const NARROW = 'its filter slot is too narrow: a slicer narrower than 24 is drawn as a sliver or not at all, so the Reset button goes first, then slicers from the last';
  // (0.3.1 TW1, SQ1-S2) short: left out of a stacked filter slot too short for it
  const SHORT = 'its filter slot is too short: stacked, each slicer needs the height a dropdown needs, so the Reset button goes first, then slicers from the last';
  const leftOutList = (r.leftOut || []).map((x) => ({ visual: x.kind === 'slicer' || x.kind === 'reset' ? (x.title || 'Slicer') : `${KIND[x.kind] || x.kind}${x.title ? ` "${x.title}"` : ''}`, page: x.page, why: x.narrow ? (x.short ? SHORT : NARROW) : (WHY[x.kind] || 'the model has no text column (a category) or no measure for it') + (x.gave ? ' (the visual beside it takes its room)' : x.noTime ? ' (the page has the layout made for a model without a time axis: the charts by category share its rows)' : ''), narrow: !!x.narrow }));   // (round 23: gave, the shared writer's)
  const noField = leftOutList.filter((x) => !x.narrow), narrow = leftOutList.filter((x) => x.narrow);
  if (noField.length) reportNotes.push(`${noField.length} visual${noField.length === 1 ? ' was' : 's were'} left out, because a visual is never written without its field: ${noField.map((x) => `${x.visual} on "${x.page}" (${x.why})`).join('; ')}.`);
  const tight = (list, how, why, fix) => { if (list.length) reportNotes.push(`Left out of a filter slot too ${how} for ${list.length === 1 ? 'it' : 'them'}: ${list.map((x) => `${x.visual} on "${x.page}"`).join('; ')} (${why}). For all of them: a ${fix} slicer slot, or fewer slicers in fields.slicers.`); };
  tight(narrow.filter((x) => x.why === NARROW), 'narrow', NARROW, 'wider'); tight(narrow.filter((x) => x.why === SHORT), 'short', SHORT, 'taller');
  leftOutList.forEach((x) => { delete x.narrow; });
  // tables that hold fewer fields than given, for lack of room (round 11): named, and boundFields lists what each shows
  const TC = r.tableColumns || [], fkey = (f) => `${f.t}[${f.c != null ? f.c : f.m}]`;
  const tableColumns = TC.length ? { tableColumns: TC.map((c) => ({ page: c.page, shown: c.kept.length, leftOut: c.leftOut.map(fkey) })) } : {};
  if (TC.length) reportNotes.push(`Fields were left out of the table on ${TC.map((c) => `"${c.page}" (${c.leftOut.map(fkey).join(', ')})`).join('; ')}: at this page size the table has room for ${[...new Set(TC.map((c) => c.kept.length))].join(' or ')} columns, and a table wider than its box hides columns behind a scrollbar. For the fields left out: a wider table slot, a larger page, shorter display names, or fewer fields in fields.table.`);
  Object.assign(ra, { leftOutList, tableColumns });
}
// the tabs, the page buttons, the KPI and chart titles, the display names and the Arabic names
function titlesStep(ra) {
  const { a, r, bind, given, reportNotes, fieldsOf, TT } = ra;
  // page tabs in two rows (round 16, the owner's yes on design finding #13)
  if ((r.chartTops || []).length) reportNotes.push(`${r.chartTops.length === 1 ? 'A chart shows' : `${r.chartTops.length} charts show`} the top ${[...new Set(r.chartTops.map((x) => x.top))].join(' or ')} of ${[...new Set(r.chartTops.map((x) => visible(x.field)))].join(', ')} by the measure, as the title says: the chart holds that many; the rest is in the table, the slicers and the filter pane.`);
  if ((r.tabRows || []).length) reportNotes.push(`The page tabs take ${[...new Set(r.tabRows.map((x) => x.rows))].join(' or ')} rows at ${[...new Set(r.tabRows.map((x) => x.size + 'pt'))].join(' or ')} on ${r.tabRows.length === 1 ? 'one page' : r.tabRows.length + ' pages'}: the page names fit one row only at a smaller size, and two rows read better; nothing is cut.`);
  // page buttons that did not fit the header (round 11): never written cut, and never left out without saying so
  const NPB = (r.noPageButtons || []).map((x) => x.page);
  const pageButtons = NPB.length ? { pageButtons: { leftOutOn: NPB, why: 'The page names do not fit the room between the title and the logo, even at 8pt on as many rows as the header is high. A cut name is worse than no button, so these pages have no page buttons; readers still change pages with Power BI\'s own page tabs.' } } : {};
  if (NPB.length) reportNotes.push(`${NPB.length === 1 ? 'One page has' : NPB.length + ' pages have'} no page buttons in the header: the page names do not fit the room between the title and the logo, even at 8pt. Readers still change pages with Power BI's own page tabs. For page buttons in the report: shorter page names, fewer pages, or a taller title slot (two rows of names need a title about 44 high).`);
  // KPI titles too long for one line at the 8pt minimum: wrapped to two lines, or shortened with the full name kept
  const KT = r.kpiTitles || { wrapped: [], shortened: [] };
  const chartTitles = TT.wrapped.length || TT.shortened.length || TT.slicers.length ? { chartTitles: { wrapped: TT.wrapped, shortened: TT.shortened, slicerHeaders: TT.slicers,
    note: 'A chart\'s or table\'s title never shows cut at its start: one too long for one line wraps to two lines, and one too long for two is shortened at its end with "…", so it still begins with the measure\'s name; a slicer\'s header is shortened the same way on one line. The full names stay the visuals\' alt text.' } } : {};
  const kpiTitles = KT.wrapped.length || KT.shortened.length ? { kpiTitles: { wrapped: KT.wrapped, shortened: KT.shortened,
    note: 'A KPI title never shows cut: one too long for its card at 8pt wraps to two lines where the card is high enough, otherwise it is shortened at a word with "…" (the full name stays the card\'s alt text and its tooltip). A shorter display name (displayNames, from the user) reads better on a small card.' } } : {};
  if (KT.shortened.length) reportNotes.push(`${KT.shortened.length} KPI title${KT.shortened.length === 1 ? ' was' : 's were'} shortened to fit their cards: ${[...new Set(KT.shortened.map((x) => `"${x.title}" as "${x.shown}"`))].join('; ')}. Ask the user for shorter display names if these read badly.`);
  // what was done with the display names; and in an Arabic report, the fields it shows under a model name that has no
  // Arabic letter (no name is ever made up for them)
  const shown = uniqueFields(fieldsOf(bind)).map((x) => x.key);   // (SQ10: each field once by its table and name)
  const names = given.size ? { displayNames: { used: [...given.values()].filter((g) => g.used).length, notUsed: [...given.values()].filter((g) => !g.used).map((g) => g.key) } } : {};
  const missing = a.lang === 'ar' ? uniqueFields(fieldsOf(bind).filter((f) => !f.name && !/[\u0600-\u06FF]/.test(f.c != null ? f.c : f.m))).map((x) => x.key) : null;
  const arabic = a.lang === 'ar' ? { arabicNames: { shownFields: shown.length, missing,
    how: missing.length ? 'These fields show under their model names. To show Arabic names, call create_report again with displayNames: { "Table[Field]": "الاسم" } for each (propose names, show them to the user, and pass only the ones they approve or edit: never show a name the user has not approved). The model is not renamed.' : 'Every field the report shows has an Arabic name.' } } : {};
  Object.assign(ra, { pageButtons, chartTitles, kpiTitles, shown, names, arabic });
}
// the answer object, the formats first
function answerStep(ra) {
  const { m, r, fmt, projectCheck, extra, unknown, sc, designRepaired, reportNotes, kpiCards, PF, galleryList, SW,
      CO, barThickness, panels, notes, numberFormats, svgMeasures, kpiValues, chartColors, chartAxes, looks,
      daxFirst, leftOutList, tableColumns, pageButtons, chartTitles, kpiTitles, shown, names, arabic } = ra;
  // formats fixed at the source: said first, with the script (the report already shows the right formats)
  const formats = fmt ? { formats: Object.assign({ sayFirst: `Tell the user first: ${fmt.fields.length} of the report's fields ${fmt.fields.length === 1 ? 'has' : 'have'} no right format in the model (listed with the format each should have). The report already shows them right: the cards, the tooltip's card and the tables carry the right format of their own. Applying the script sets them in the model too, so every other visual, Excel and other reports show them right.` }, fmt) } : {};
  return Object.assign(daxFirst, formats, { written: r.files.length, open: path.join(m.projectDir, r.base + '.pbip'), report: r.base + '.Report', model: path.basename(m.folder) }, projectCheck ? { check: Object.assign({ tellUser: 'Checked before it was written (the measured rules of what Power BI Desktop draws, and the layout check). Tell the user the summary; when it lists problems, say each one with its fix.' }, projectCheck) } : {}, extra, { panels },
    // (0.3.0) the phone layout: written for every page unless the design says phoneLayout false
    { phone: phoneAnswer(r.files.some((f) => /\/mobile\.json$/.test(f.path))) },
    { boundFields: boundOf(r.bound) }, PF ? { pageFilters: PF.map((f) => Object.assign({ field: f.key, values: f.values, type: f.type }, f.typedBy ? { typedBy: f.typedBy } : {}, f.note ? { note: f.note } : {})) } : {}, svgMeasures, kpiValues, chartColors, chartAxes, looks, kpiTitles, chartTitles, pageButtons, tableColumns, leftOutList.length ? { leftOutVisuals: leftOutList } : {}, unknown ? { ignored: unknown } : {}, hiddenOf(m),
    sc.scope ? { scope: sc.scope } : {}, kpiCards ? { kpiCards } : {}, designRepaired ? { repaired: designRepaired } : {}, names, arabic, notes.length ? { modelNotes: notes } : {}, numberFormats, reportNotes.length ? { reportNotes } : {}, barThickness ? { barThickness } : {},
    galleryList ? { gallery: { slots: galleryList } } : {}, SW ? { metricSwitcher: switchSaid(SW) } : {}, CO && CO.offered ? { calendarArabic: calendarSaid(CO, shown, { scriptFile: CO.scriptAfterGo, howToApply: CO.howToApply }) } : CO && CO.leftOut ? { calendarArabic: { offered: false, why: CO.why, leftOut: CO.leftOut } } : {});
}
