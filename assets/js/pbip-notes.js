/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's notes (0.2.9, audit 3's A3-12): the lists of what it did that its caller should tell (tables
// that hold fewer fields, titles shortened, measures renamed...), made once per report, and the result build returns.
(function (root) {
  'use strict';
  // What the writer did that its caller should tell the user, one list each (the result's keys, see BuildResult in
  // pbip-export.js), and the report's own measures' names (freeExt: never a name the model has; extRenamed)
  function make(o) {
    const tableColumns = [];   // tables that hold fewer fields than given, for lack of room: { page, pageIndex, x, y, kept, leftOut } (round 11)
    const tabRows = [];   // pages whose page tabs take two or three rows: { page, rows, size } (round 16)
    const noPageButtons = [];   // pages whose header has no room for the page names even at 8pt: { page } (round 11)
    const leftOut = [];   // data visuals not written because the model has no field for them: { page, kind, title }
    const kpiTitles = { wrapped: [], shortened: [] };
    const titles = { wrapped: [], shortened: [], slicers: [] };   // chart and table titles, slicer headers (round 12, #24)
    const tableOrder = [];   // tables put in calendar order by a helper column (round 12, #17)
    const tableRows = [];   // tables whose known rows don't fit even with tight rows (round 12, #23)
    const headerGrew = [];   // pages whose header grew one row of tabs (round 12)
    const tableSmaller = [];   // tables given a smaller text so more fields fit (round 12)
    const tableWide = [];   // tables whose two kept fields are wider than the box even at 8pt: { page, width, need } (round 22b)
    const subtitlesUsed = new Set();   // round 22: the subtitle keys that found their visual
    const blankKept = [];   // round 21: KPI cards too narrow for the blank text at the value's size
    const noData = [];   // round 19: the "No data" measures, { t, m, expression }
    const noDataSkipped = [];   // round 22b (X-05): fields whose name holds a control character: no "No data" card, { page, t, m }
    // Round 23 (the owner's "nothing critical left"): a report measure ("No data: ...", "Row label: ...") never takes a
    // name its model table already has (o.model.names: { table: [its columns' and measures' names] }, from the MCP; DAX
    // names ignore case): the first free "<name> (2)", "(3)"... is used, and told (extRenamed)
    const modelNames = (o.model && o.model.names) || {}, extRenamed = [];
    // (P3, LAYOUT-SWEEP-RC7: a column "Agent" on two tables gave "Keep: Calls by Agent" on both, and Desktop showed "Something's
    // wrong with one or more filters", though the validator and check_report said clean. A measure's name is unique across
    // the whole model, report-level measures included, without case: a name is taken when any model table has it, or a
    // report measure of another table already has it; the same table's own lists keep their reuse of one measure for one
    // expression, as before)
    const reportNames = () => noData.concat(rowLabels, timeExt, o.svgColumns || [], o.svgCards || []);
    const freeExt = (t, want) => { const has = (n) => { const l = n.toLowerCase(); return Object.values(modelNames).some((ns) => (ns || []).some((x) => String(x).toLowerCase() === l)) || reportNames().some((x) => x.t !== t && String(x.m).toLowerCase() === l); }; if (!has(want)) return want;
      let k = 2; while (has(want + ' (' + k + ')')) k++; const nm = want + ' (' + k + ')'; if (!extRenamed.some((x) => x.t === t && x.from === want)) extRenamed.push({ t, from: want, to: nm }); return nm; };
    const rowLabels = [], rowLabelSkipped = [];   // round 23: the tables' row-label measures { page, t, c, m, expression }; tables kept as before (a control character) { page, t, c }
    const barCharts = [];   // round 19: column charts by day or month names written as bar charts
    const kindChanges = [];   // rc.22, B-140: every slot the writer gives another kind { page, pageIndex, role, nth (its place among the page's slots of that kind), from, to, topN }: the plan shows them
    const shortDays = [];   // round 18, S3: column charts that show Day Short
    const ringsSmall = [];   // round 18: ring pictures drawn under 40 high, written without their number
    const svgSizes = {};   // the SVG pictures' size in each page's table: { w, h, design (the widest), capped }

    const timeExt = [];   // 0.2.9 part 2: the time axes' report measures (DateTime and Integer), into reportExtensions.json with the others
    const timeAxes = [];   // what was done to each time axis, for the answer
    let blankFiltered = 0;
    const topCharts = [];   // the design block's S5/D19: charts kept to the Top N their slot can show { page, title, top }
    const bound = [];   // 0.2.9, A6-12: what each written visual shows, page by page: { page, visuals: [{ kind, fields }] }   // charts given the "is not blank" filter (the cross-review's G13: the note only then)
    return {
      tableColumns, tabRows, noPageButtons, leftOut, kpiTitles, titles, tableOrder, tableRows,
      headerGrew, tableSmaller, tableWide, subtitlesUsed, blankKept, noData, noDataSkipped, modelNames,
      extRenamed, freeExt, rowLabels, rowLabelSkipped, barCharts, kindChanges, shortDays, ringsSmall, svgSizes,
      timeExt, timeAxes, blankFiltered, bound, topCharts
    };
  }

  // the result build returns (BuildResult), its keys in their order: r holds what build itself made (base, files, zip,
  // chartColors, chartAxes, tooltipLimits)
  const result = (n, r) => ({ base: r.base, files: r.files, zip: r.zip, leftOut: n.leftOut, kpiTitles: n.kpiTitles, titles: n.titles, tableOrder: n.tableOrder, tableRows: n.tableRows,
    headerGrew: n.headerGrew, tableSmaller: n.tableSmaller, tableWide: n.tableWide, noDataSkipped: n.noDataSkipped, svgSizes: n.svgSizes, noPageButtons: n.noPageButtons, tableColumns: n.tableColumns,
    rowLabels: n.rowLabels.map((x) => ({ page: x.page, t: x.t, c: x.c, m: x.m })), rowLabelSkipped: n.rowLabelSkipped, extRenamed: n.extRenamed, chartColors: r.chartColors, chartAxes: r.chartAxes,
    tabRows: n.tabRows, ringsSmall: n.ringsSmall, shortDays: n.shortDays, barCharts: n.barCharts, kindChanges: n.kindChanges, blankKept: n.blankKept, subtitlesUsed: [...n.subtitlesUsed], timeAxes: n.timeAxes,
    blankFiltered: n.blankFiltered, tooltipLimits: r.tooltipLimits, bound: n.bound, topCharts: n.topCharts });

  const api = {
    make, result
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbipNotes = api;
})(typeof self !== 'undefined' ? self : this);
