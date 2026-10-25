// The sentences create_report's run and plan_layout both answer with: the flip cards, the top N, the card values'
// rule, the model's notes, the phone layout, the Arabic calendar.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { shownName, modelOf } from './model.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Pbip = require('../../assets/js/pbip-export.js');
const Bind = require('../../assets/js/pbip-bind.js');

// The KPI cards' number rule (round 12, the owner's ask of 6 Oct 2026), as the answer and reportNotes state it
// (0.2.9.1, B-174) a category chart's kept categories as the plan and the report notes say them: "Top 5, all of them
// when it has 7 or fewer" (the writer's Keep: measure), "Top 5" (a fixed Top N filter)
// (0.3.0 L4) the flip cards as the plan and the answer say them: names screened, no description text, no value
export const flipAnswer = (f) => Object.assign({ cards: f.cards.map((c) => ({ page: shownName(c.page, 80), card: c.card, title: shownName(c.title, 80), measure: shownName(c.measure, 120), measures: c.measures.map((x) => shownName(x, 120)), back: c.back })),
  bookmarks: f.bookmarks, newMeasures: f.measures.length,
  how: 'Each card is three Image visuals in its box: a backdrop in the card colour, the front (its title and value) and the back (the measure\'s name and one line: its description from the model, its value, the change on last year where the model has a marked date table), hidden until the card is clicked; each face goes to the other through a display-only bookmark of its own (two a card), which touches no slicer or filter. The turn takes 0.3 s. The pictures are measures the model does not have yet: they are written as a TMDL script next to the project, applied by the user first.' },
  f.notFlipped.length ? { notFlipped: f.notFlipped } : {}, f.skipped.length ? { skipped: f.skipped.map((x) => ({ page: shownName(x.page, 80), card: x.card, why: x.why })) } : {});
export const topSaid = (x) => `Top ${x.top}` + (x.allUpTo > x.top ? `, all of them when it has ${x.allUpTo} or fewer` : '');
export const CARD_RULE = 'a percentage (a % in its format or name; a rate or ratio; a margin, share, growth or "vs" measure whose DAX divides and that has no format) shows as a percent without useless decimals: the model\'s percent format where it has one decimal or none, otherwise 0.0%; a count, or a measure whose format has no decimals (or a count without a format), shows its whole number with thousand separators (179, 101,914), except an amount (a currency in its format, or a sum of money: sales, revenue, cost, budget...), which keeps automatic units with 2 decimals (EUR 54.66M; 14.81K under a million: Power BI cannot switch the units by the value without a change in the model); every other measure keeps automatic units with 2 decimals (3.43M). A measure that shows text is never put on a card.';
// Things in the user's model that make the new report look wrong, for the fields it uses. The report never changes the
// model: these are told to the user, with the fix, to make in Power BI Desktop (or through Microsoft's MCP, with the
// user's go). A month or day name without a sort column shows them A to Z; a ratio without a format string shows 0.34, not 34%.
export function modelNotes(tmsl, bind) {
  const model = modelOf(tmsl), notes = [], seen = new Set();
  const find = (f, kind) => { const t = (model.tables || []).find((x) => x.name === f.t); return t && (t[kind] || []).find((x) => x.name === (f.c || f.m)); };
  const fields = bind ? [bind.date, bind.measure, ...(bind.kpis || []), ...Object.values(bind.cats || {}), ...Object.values(bind.y || {}), ...(bind.table || []), ...(bind.slicers || [])] : [];
  fields.filter(Boolean).forEach((f) => {
    const key = `${f.t}[${f.c || f.m}]`;
    if (seen.has(key)) return; seen.add(key);
    if (f.c != null) {
      const c = find(f, 'columns');
      // (builder 7's audit A6-15, 11 Oct: "no" was matched inside "Announced": a month column is a text column (the model's
      // type, not its name) whose name has the whole word month; a number, key or date column is never one)
      if (c && !c.sortByColumn && /^(string|unknown)?$/i.test(String(c.dataType || '')) && /\bmonths?\b|الشهر/i.test(f.c) && !/\b(number|num|no|sort|key|offset|index|id)\b/i.test(f.c))
        notes.push({ field: key, issue: f.sortBy ? 'This column has no sort-by column in the model. The report\'s charts and tables are put in month order by the report itself (round 12); slicers still show months in alphabetical order.' : ['monthStart', 'monthLabel'].includes((Pbip.timeAxisPlan(f) || {}).order) ? 'This column has no sort-by column in the model. The report\'s trend is put in time order by the report itself (its month start, or the label read as a date); tables and slicers still show months in alphabetical order.' : 'Months will show in alphabetical order: this column has no sort-by column.',
          fix: `In Power BI Desktop select ${key}, then Column tools > Sort by column > ${f.sortBy ? f.sortBy.c : 'the month number column'}. check_model_health gives the steps or a ready script (fixes.MONTH_SORT).` });
      if (c && !c.sortByColumn && /(day|weekday)\s*name|اسم اليوم/i.test(f.c))
        notes.push({ field: key, issue: f.sortBy ? 'This column has no sort-by column in the model. The report\'s charts and tables are put in weekday order by the report itself (round 12); slicers still show days in alphabetical order (Friday, Monday, ...).' : 'Days will show in alphabetical order (Friday, Monday, ...): this column has no sort-by column.',
          fix: `In Power BI Desktop select ${key}, then Column tools > Sort by column > ${f.sortBy ? f.sortBy.c : 'the day-of-week number column'}. check_model_health gives the steps or a ready script (fixes.MONTH_SORT).` });
    } else {
      const ms = find(f, 'measures');
      if (ms && !ms.formatString && Bind.isPercent(f.m, ms.formatString, ms.expression))
        notes.push({ field: key, issue: 'This looks like a percentage but has no format string, so cards show 0.34 instead of 34%.',
          fix: `In Power BI Desktop select ${key}, then Measure tools > Format > Percentage. check_model_health gives a ready script (fixes.NO_FORMAT).` });
    }
  });
  return notes;
}

// 0.3.0: what plan_layout and create_report say about the phone layout (the shared writer's mobile.json: Power BI's
// 323-wide phone canvas, the order of pbip-page.js's phone block)
export const phoneAnswer = (written) => (written
  ? { written: true, canvas: 323, about: 'Every report page gets a phone layout for the Power BI mobile app: the header and title first, then the filters, the KPI cards two to a row, then each chart and table full width in the page\'s reading order (mirrored right to left). Tooltip pages have none. A design with layout.phoneLayout false leaves it out.' }
  : { written: false, canvas: 323, about: 'No phone layout (the design says layout.phoneLayout false): the Power BI mobile app shows the page as it is, shrunk to the phone.' });
// (D6, the laptop's T1b: approved names passed as displayNames, «السنة» among them, made it say "no field has a proposed
// Arabic name") nG: the Arabic names given in displayNames, counted beside the fixed list's proposals
// (0.3.0 C1) what an Arabic plan and report say of the Arabic calendar columns: the script, its columns, the calendar
// fields that show English data until it is applied (those the report shows, when known), and how to switch
export const calendarSaid = (co, shown, extra) => { const on = shown ? (co.englishData || []).filter((x) => shown.includes(x)) : co.englishData || [];
  return Object.assign({ offered: true, table: co.table, columns: co.columns, englishData: on, englishDataWhy: co.englishDataWhy, howToSwitch: co.howToSwitch }, co.leftOut ? { leftOut: co.leftOut } : {}, co.note ? { note: co.note } : {}, extra || {}); };
