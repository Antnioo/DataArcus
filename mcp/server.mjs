#!/usr/bin/env node
// DataArcus MCP server: the engines behind dataarcus.com's Power BI tools, for an AI agent.
// Pairs with Microsoft's Power BI Authoring MCP server (model edits, DAX) and the Desktop bridge (reload, screenshots).
// Every path stays inside the working folder (DATAARCUS_ROOT; without it every tool refuses), and nothing is ever overwritten.
import fs from 'node:fs';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Bind, Fix, Gulf, Health, Pbip, ROOT, applyColumnTypes, inside, loadModel, prepareRoot, rootProblem, summary } from './lib/model.mjs';
import { E, themeDesign, planLayout, pageOf, contrastReport, freeFile } from './lib/design.mjs';
import { fullAnswer, isLarge, largeSummary, namedTables, scopeOf } from './lib/scope.mjs';

// the version is in one place: mcp/package.json
const VERSION = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;
const server = new McpServer({ name: 'dataarcus', version: VERSION });
// What a tool does to the user's files, for the AI app: four tools only read; the two that write only add new files
// (never change or delete one) and stay inside the working folder
const READS = { readOnlyHint: true, openWorldHint: false }, ADDS = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
const text = (o) => ({ content: [{ type: 'text', text: typeof o === 'string' ? o : JSON.stringify(o, null, 2) }] });
const compact = (o) => ({ content: [{ type: 'text', text: JSON.stringify(o) }] });
// the part of a large model a request is about (see lib/scope.mjs)
const focusInput = z.string().min(1).max(80).optional().describe('On a large model: the part of the model the user asked about, in their words ("logistics", "sales"). The picks then come from the tables whose name or whose measures\' display folder contains it, the tables related to them and the date table. A large model needs a focus or tables');
const tablesInput = z.array(z.string()).min(1).max(60).optional().describe('Instead of a focus: the tables to pick from, by name (the tables related to them and the date table are added)');
const fail = (e) => ({ isError: true, content: [{ type: 'text', text: String(e && e.message || e) }] });
// no working folder (not set, or not there): every tool answers with the reason and touches no file
const safe = (fn) => async (args) => { try { const problem = rootProblem(); if (problem) return fail(problem); return await fn(args); } catch (e) { return fail(e); } };
// The DAX query that reads every column's type from the model open in Power BI Desktop (run it with Microsoft's
// Power BI Authoring MCP). INFO.COLUMNS gives the Tabular DataType numbers; a column Power BI names or types from DAX
// has them in InferredName / InferredDataType. Its rows go into check_model_health's columnTypes as Table[Column]: type.
const COLUMN_TYPES_QUERY = [
  'EVALUATE',
  'VAR _Tables = SELECTCOLUMNS ( INFO.TABLES (), "TableID", [ID], "Table", [Name] )',
  'VAR _Columns =',
  '    SELECTCOLUMNS (',
  '        FILTER ( INFO.COLUMNS (), [Type] <> 3 ),',
  '        "TableID", [TableID],',
  '        "Column", IF ( [ExplicitName] = "", [InferredName], [ExplicitName] ),',
  '        "Type", IF ( [ExplicitDataType] IN { 1, 19 }, [InferredDataType], [ExplicitDataType] )',
  '    )',
  'RETURN SELECTCOLUMNS ( NATURALLEFTOUTERJOIN ( _Columns, _Tables ), "Table", [Table], "Column", [Column], "Type", [Type] )'
].join('\n');
const modelPath = z.string().describe('A Power BI project folder, its .SemanticModel folder, a model.bim or a .pbit, relative to the DataArcus folder');

// A theme's own colours (DataArcus theme generator and Power BI themes): text, visual and page background, accent,
// so the title, buttons and filter pane match the theme instead of the defaults
const themeColors = (t) => {
  const page = t && t.visualStyles && t.visualStyles.page && t.visualStyles.page['*'] && t.visualStyles.page['*'].background;
  const out = { text: t && t.foreground, card: t && t.background, accent: t && t.tableAccent, background: page && page[0] && page[0].color && page[0].color.solid && page[0].color.solid.color };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)));
};

server.registerTool('read_model', {
  title: 'Read a Power BI model',
  description: 'Lists the tables, visible columns (with types), measures (with formats) and date tables of a model, without changing it. A large model (a full list over 40,000 characters) gets a summary first: counts, the date tables, the areas (measure display folders), the tables with measures and the other tables\' names; ask for the tables you need with tables.',
  inputSchema: { path: modelPath, tables: z.array(z.string()).min(1).max(100).optional().describe('Only these tables, in full (names as read_model lists them). For a large model, after its summary') }, annotations: READS
}, safe(async ({ path: p, tables }) => {
  const m = loadModel(p);
  if (tables) return text(namedTables(m, tables));
  return isLarge(m) ? compact(largeSummary(m)) : text(fullAnswer(m));
}));

server.registerTool('suggest_fields', {
  title: 'Suggest fields for a report design',
  description: 'Picks which of the model\'s measures and columns go in each KPI card, chart, table and slicer, the way the DataArcus theme generator does (base measures first, month from the date table, no keys or hidden fields).',
  inputSchema: { path: modelPath, kpis: z.number().int().min(1).max(8).default(4).describe('Number of KPI cards'), focus: focusInput, tables: tablesInput }, annotations: READS
}, safe(async ({ path: p, kpis, focus, tables }) => {
  const m = loadModel(p), sc = scopeOf(m, { focus, tables });
  // a large model without a focus, or a focus that matches nothing: no picks, and what to ask the user
  if (sc.needsFocus) return text(sc);
  const b = Bind.suggest(sc.tables, kpis); delete b.choices;
  return text(sc.scope ? Object.assign({ scope: sc.scope }, b) : b);
}));

server.registerTool('check_model_health', {
  title: 'Check model health',
  description: 'Runs the DataArcus Model Health Check: score, and every finding with the objects it concerns (unused columns and measures, risky relationships, slow DAX, date tables...). Reads a project saved by Power BI Desktop (TMDL or model.bim), a model.bim or a .pbit.',
  inputSchema: {
    path: modelPath, maxItems: z.number().int().min(1).max(200).default(15).describe('Objects listed per finding'),
    weekStart: z.enum(['sunday', 'monday', 'saturday']).default('sunday').describe('The first day of the week, used only when a fix script has to add a weekday number column to sort day names: sunday (default: Saudi Arabia and most of the Gulf), monday (a Saturday-Sunday weekend, as in the UAE since 2022), or saturday'),
    country: z.enum(['uae', 'ksa', 'qat', 'kwt', 'bhr', 'omn']).optional().describe('For a Gulf model: the country whose official weekend the calendar is checked against (uae, ksa, qat, kwt, bhr, omn). Giving it adds the gulfCalendar section (not part of the score): Hijri, Ramadan and Eid columns, the weekend, the Ramadan and Eid dates, the range of the calendar. Without it the section appears only when the model already has Hijri or Ramadan columns, checked for the UAE. It never changes weekStart'),
    asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('The date the gulfCalendar section counts as today (YYYY-MM-DD; default: today). For tests'),
    columnTypes: z.record(z.string(), z.union([z.string(), z.number()])).optional()
      .describe('Only when a TMDL project skipped checks: column types read from the same model open in Power BI Desktop, as { "Table[Column]": type }. The type is a model.bim name (string, int64, double, decimal, dateTime, boolean) or the number INFO.COLUMNS returns (2, 6, 8, 10, 9, 11), also as text. Fills only columns the files leave without a type.')
  }, annotations: READS
}, safe(async ({ path: p, maxItems, columnTypes, weekStart, country, asOf }) => {
  const m = loadModel(p);
  const typed = columnTypes ? applyColumnTypes(m.tmsl, columnTypes) : undefined;
  const r = Health.analyze(m.tmsl, m.report);
  // ready fixes for three findings, as TMDL scripts the user applies in Power BI Desktop (TMDL view); nothing is ever
  // applied by this tool. What a script can't do safely is listed as steps by hand, never guessed.
  const raw = ((m.tmsl && (m.tmsl.model || m.tmsl)) || {}).tables || [], itemsOf = (id) => ((r.findings.find((f) => f.id === id) || {}).items || []).concat((((r.skipped || []).find((s) => s.id === id)) || {}).items || []);
  const howToApply = 'Save a copy of the file first. In Power BI Desktop open TMDL view, paste the script, choose Preview to see the changes, then Apply. The script is a suggestion: it is never applied by this tool.';
  // measured in Power BI Desktop 2.158: after a script that adds a column, every visual shows an error until the
  // yellow bar's "Refresh now" is pressed
  const refreshAfter = ' This script adds a column: after Apply, press "Refresh now" in the yellow bar at the top of the report (until then every visual shows an error).';
  const fixes = {};
  {
    const cols = itemsOf('MONTH_SORT').map((i) => String(i.obj).match(/^(.*)\[(.*)\]$/)).filter(Boolean).map((x) => ({ table: x[1], column: x[2] }));
    if (cols.length) { const s = Fix.sortFixes(raw, cols, { weekStart });
      fixes.MONTH_SORT = Object.assign({ weekStart: s.weekStart, weekStartNote: s.sorts.some((x) => x.added && /Day of Week/.test(x.by)) ? `A weekday number column is added with the week starting on ${s.weekStart}; call again with weekStart: 'sunday', 'monday' or 'saturday' for another start.` : undefined,
        sorts: s.sorts, byHand: s.byHand }, s.script ? { fixScript: s.script, howToApply: howToApply + (s.sorts.some((x) => x.added) ? refreshAfter : '') } : {}); }
    for (const [id, percent] of [['NO_FORMAT', false], ['PCT_FORMAT', true]]) {
      const names = itemsOf(id).map((i) => String(i.obj).replace(/^\[|\]$/g, ''));
      if (!names.length) continue;
      // the script and its list cover maxItems measures (as the findings list their objects), and stay under 30,000
      // characters: on a large model the whole script was the biggest part of the answer (measured: 147,000 characters)
      let n = Math.min(names.length, maxItems), s = Fix.formatFixes(raw, names.slice(0, n), { percent });
      while (n > 1 && String(s.script || '').length > 30000) { n = Math.floor(n * 0.7); s = Fix.formatFixes(raw, names.slice(0, n), { percent }); }
      const covers = n < names.length ? { covers: { measures: n, of: names.length, note: `The script and the list cover the first ${n} of ${names.length} measures. Call again with a larger maxItems (up to 200) for more; a script is kept under 30,000 characters.` } } : {};
      fixes[id] = Object.assign({ suggested: s.suggested, byHand: s.byHand }, covers, s.script ? { fixScript: s.script, howToApply } : {});
    }
  }
  // the Gulf calendar check: its own section, never scored; shown when a country is given or the model already has
  // Hijri or Ramadan columns. Read from the model files only; its fixes name the website tools and their settings.
  const gulfCalendar = country || Gulf.hasGulfColumns(m.tmsl) ? Gulf.analyze(m.tmsl, { country: country || 'uae', asOf, maxItems }) : undefined;
  return text({
    source: m.source, score: r.score, stats: r.stats, reportRead: !!m.report,
    fixes: Object.keys(fixes).length ? fixes : undefined,
    gulfCalendar,
    // what was done with columnTypes: types used, types the files already had (kept), names and types that could not be used
    columnTypes: typed,
    findings: r.findings.map((f) => { const rule = Health.RULES[f.id] || {}; const en = rule.en || [f.id, '', ''];
      return { id: f.id, severity: rule.sev, category: rule.cat, title: en[0], why: en[1], fix: en[2], count: f.items.length, items: f.items.slice(0, maxItems) }; }),
    // checks that need a column type the files don't give (columns of DAX tables in a TMDL project): listed, not guessed
    skipped: r.skipped.length ? {
      why: 'The TMDL files give no data type for these columns: Power BI works out the types of a DAX table\'s columns from its DAX, and only the open model knows them. The checks below need the type, so they were not run for these objects and are not in the score.',
      getThem: ['Export a .pbit from the same model (Power BI Desktop: File > Export > Power BI template) and run check_model_health on it.',
        'Or read the types from the same model open in Power BI Desktop: run this DAX query with Microsoft\'s Power BI Authoring MCP (dax_query_operations, Execute), then call check_model_health again with columnTypes = { "Table[Column]": Type } for every row:\n' + COLUMN_TYPES_QUERY],
      checks: r.skipped.map((s) => ({ id: s.id, title: ((Health.RULES[s.id] || {}).en || [s.id])[0], count: s.items.length, items: s.items.slice(0, maxItems) }))
    } : undefined
  });
}));

const pageInput = z.union([z.enum(['1920x1080', '1280x720', '960x720']), z.object({ w: z.number(), h: z.number() })])
  .describe('Power BI page size: 1920x1080 (default), 1280x720, 960x720, or { w, h } (640-3840 x 360-2160, shaped 4:3 to 2.4:1; other sizes are fitted as the website does)');
const langInput = z.enum(['en', 'ar']).default('en').describe('Language of the report: names in it, and right to left when dir is not given');
const slot = z.object({
  kind: z.enum(['title', 'logo', 'kpi', 'card', 'line', 'bar', 'column', 'donut', 'table', 'gauge', 'funnel', 'treemap', 'map', 'slicer', 'text']),
  title: z.string().optional(), x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive()
});
server.registerTool('create_report', {
  title: 'Create a report project for an existing model',
  description: 'Writes a new Power BI report (PBIR) next to the user\'s model: every visual placed, bound to the model\'s fields (suggested, or given), theme applied; each KPI card, chart and table on its own panel (drawn by the theme\'s solid visuals, or by a page\'s background image when one is given). The model and any existing report are never touched; the new report gets a free name. Every report also gets a hidden tooltip page, shown when a chart is hovered. An optional logo (a PNG or JPG in the DataArcus folder) goes in the header at its own shape. Give either pages (hand-placed slots) or a design (from generate_theme or plan_layout): with a design the pages, positions, second page, slide-in filter panel, labels and theme are exactly the DataArcus Theme Generator\'s project download. Open the new .pbip in Power BI Desktop afterwards (or reload it with the Desktop bridge).',
  inputSchema: {
    path: modelPath.describe('The project folder or .SemanticModel folder the report will use'),
    name: z.string().min(1).max(60).describe('Report name'),
    pages: z.array(z.object({ name: z.string(), width: z.number().int().default(1920), height: z.number().int().default(1080), slots: z.array(slot).min(1),
      background: z.string().optional().describe('PNG file for the page background, inside the DataArcus folder') })).min(1).optional()
      .describe('Hand-placed pages; or give a design instead'),
    design: z.record(z.any()).optional().describe('The design from generate_theme or plan_layout; the layout inputs below change it, as in plan_layout'),
    layout: z.enum(['exec', 'analysis', 'ops', 'focus']).optional(), kpis: z.number().int().min(0).max(6).optional(),
    focus: focusInput, tables: tablesInput,
    filters: z.enum(['none', 'start', 'end', 'top']).optional(), header: z.boolean().optional(), page: pageInput.optional(), dir: z.enum(['ltr', 'rtl']).optional(),
    secondPage: z.boolean().default(true).describe('With a design: a second page in a complementary layout (details after an overview, an overview after analysis), with page buttons'),
    slidePanel: z.boolean().default(false).describe('With a design: filters as a slide-in panel opened from a Filters button in the header, instead of a filter rail'),
    theme: z.string().optional().describe('Theme JSON file (e.g. from the DataArcus theme generator), inside the DataArcus folder'),
    displayNames: z.record(z.string(), z.string()).optional().describe('Names to show instead of the model\'s field names, as { "Table[Field]": "name" } (for example Arabic names for an Arabic report). The report shows the name wherever it shows the field: KPI titles, chart titles, axis and legend, table headers, slicer headers, the tooltip pages. The model is never renamed. Give names only for fields you know the right name of: nothing is translated automatically'),
    logo: z.string().optional().describe('Logo image for the header: a PNG or JPG file inside the DataArcus folder, 2 MB at most. It is copied into the new report (the file itself is not changed) and shown at its own shape, never stretched; a horizontal logo reads best'),
    lang: z.enum(['en', 'ar']).default('en'), rtl: z.boolean().default(false), font: z.string().default('Segoe UI'),
    colors: z.object({ text: z.string(), card: z.string(), background: z.string(), accent: z.string() }).partial().optional()
  }, annotations: ADDS
}, safe(async (a) => {
  if (!a.pages === !a.design) throw new Error('Give create_report pages or a design, not both and not neither: pages with hand-placed slots, or the design from generate_theme or plan_layout.');
  const m = loadModel(a.path);
  if (!m.folder) throw new Error('create_report needs a project folder with a .SemanticModel (save the .pbix as a Power BI project first).');
  // the part of the model the report is about: on a large model a focus (or tables) is needed, as in suggest_fields
  const sc = scopeOf(m, { focus: a.focus, tables: a.tables });
  if (sc.needsFocus) throw new Error(`Nothing was written. ${sc.why} ${sc.how} Areas in this model: ${sc.areas.map((x) => x.area).join(', ') || 'none (no measure display folders)'}.`);
  const pickFrom = sc.tables;
  // KPI cards: never more than the measures a card can show (no card is ever written without a field)
  const usable = Bind.suggest(pickFrom, 8).kpis.filter(Boolean).map((k) => k.m);
  const cardNote = (asked, built, leftOut) => (built >= asked ? null : Object.assign({ asked, built, measures: usable.slice(0, built),
    why: usable.length ? `The model has ${usable.length} measure${usable.length === 1 ? '' : 's'} a KPI card can show${sc.scope ? ' in this part of the model' : ''}, so ${built} of ${asked} KPI cards were built. Add measures to the model (in Power BI Desktop) for more cards, then create the report again.`
      : 'The model has no measures, so no KPI card was built, and the charts were left out too (they have no value to show; see leftOutVisuals). The report has its header, filters and table only. Propose measures with their format strings to the user; when they are in the model (added in Power BI Desktop), create the report again.' }, leftOut ? { leftOut } : {}));
  let kpiCards = null;
  // a model with no measures at all: the visuals that need one (charts, gauges, cards) are left out too, and named:
  // no visual is ever written without its fields
  const NEEDS_MEASURE = ['kpi', 'card', 'line', 'bar', 'column', 'donut', 'gauge', 'funnel', 'treemap', 'map'], leftOutVisuals = [];
  const withValues = (slots) => (usable.length ? slots : slots.filter((s) => { if (!NEEDS_MEASURE.includes(s.kind)) return true; if (s.kind !== 'kpi') leftOutVisuals.push(s.title || s.kind); return false; }));
  // a report is written next to its model; when the working folder is the model folder, that is outside it
  if (!m.projectDir) throw new Error(`Nothing was written: the working folder is the model folder itself (${path.basename(m.folder)}). A report is written next to its model, which would be outside the working folder. Choose the project folder (the folder that holds ${path.basename(m.folder)}) as the working folder, then ask again.`);
  // no background image given: a fully transparent pixel, so the page colour from the theme shows
  const png1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4AWMAAQAABQABNtCI3QAAAABJRU5ErkJggg==', 'base64');
  const kpisOf = (pages) => pages.reduce((n, p) => Math.max(n, p.slots.filter((s) => s.kind === 'kpi').length), 0) || 1;
  // display names: checked first, then put on the bound fields (the report writer shows a field's name when it has one)
  const given = new Map();
  for (const [k, v] of Object.entries(a.displayNames || {})) {
    const mk = String(k).trim().match(/^'?(.+?)'?\[(.+)\]$/), name = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim();
    if (!mk) throw new Error(`displayNames: "${k}" is not written as Table[Field]`);
    if (!name || name.length > 80) throw new Error(`displayNames: the display name for ${k} is empty or longer than 80 characters`);
    given.set(mk[1] + '[' + mk[2] + ']', { name, key: String(k), used: false });
  }
  const fieldsOf = (b) => (b ? [b.date, b.measure, ...(b.kpis || []), ...Object.values(b.cats || {}), ...Object.values(b.y || {}), ...(b.table || []), ...(b.slicers || []), ...Object.values(b.tip || {})].filter(Boolean) : []);
  const keyOf = (f) => `${f.t}[${f.c != null ? f.c : f.m}]`;
  const named = (b) => { fieldsOf(b).forEach((f) => { const g = given.get(keyOf(f)); if (g) { f.name = g.name; g.used = true; } }); return b; };
  // the logo, as the website takes it: a PNG or JPG, 2 MB at most; its size is read so its box can take its shape
  const reportNotes = [];
  // Power BI's own words can't be set by a report (measured: no slicer property holds "All")
  if (a.lang === 'ar') reportNotes.push('Power BI\'s own words in the report ("All" in a slicer, "Select all", "Search") follow each viewer\'s Power BI language, not the report: nothing in the report files can change them.');
  let logo = null, logoRatio;
  if (a.logo) {
    const file = inside(a.logo), ext = /\.png$/i.test(file) ? 'png' : /\.jpe?g$/i.test(file) ? 'jpg' : null;
    if (!ext) throw new Error(`The logo must be a PNG or JPG file: ${a.logo}`);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error(`Logo not found: ${a.logo}`);
    if (fs.statSync(file).size > 2 * 1024 * 1024) throw new Error(`The logo must be 2 MB at most: ${a.logo} is ${(fs.statSync(file).size / 1024 / 1024).toFixed(1)} MB`);
    const bytes = new Uint8Array(fs.readFileSync(file)), size = E.imageSize(bytes);
    if (!size) throw new Error(`The logo must be a PNG or JPG file: ${a.logo} could not be read as one`);
    logo = { bytes, ext }; logoRatio = size.w / size.h;
    if (size.h > size.w) reportNotes.push('This logo is tall; a horizontal version will read much better in the header.');
  }
  let r, bind, extra = {}, written;
  if (a.design) {
    // the website's project download for this design: its pages (second page, slide-in panel), labels and theme
    let design = planLayout({ design: a.design, layout: a.layout, kpis: a.kpis, filters: a.filters, header: a.header, page: a.page, dir: a.dir, lang: a.lang }).design;
    const themeChanged = [];
    if (design.layout.transparent) {
      themeChanged.push({ setting: 'layout.transparent', from: true, to: false,
        why: 'Transparent visuals are meant to sit on panels drawn in a background image. This report has no background image, so its theme has solid visuals instead: each KPI card, chart and table shows on its own panel (the card colour, rounded corners, a shadow when the design has one).' });
      design = Object.assign({}, design, { layout: Object.assign({}, design.layout, { transparent: false }) });
    }
    const askedCards = design.layout.kpiCards != null ? Math.min(design.layout.kpis, design.layout.kpiCards) : design.layout.kpis;
    if (usable.length < 6) design = Object.assign({}, design, { layout: Object.assign({}, design.layout, { kpiCards: Math.min(design.layout.kpiCards != null ? design.layout.kpiCards : 6, usable.length) }) });
    kpiCards = cardNote(askedCards, Math.min(askedCards, usable.length));
    const pages = E.projectPages(design.layout, a.lang, { second: a.secondPage, panel: a.slidePanel, logoRatio }).map((p) => Object.assign({}, p, { slots: withValues(p.slots) }));
    r = Pbip.build({
      name: a.name, title: E.themeName(design.name), pageName: pages[0].name, lang: a.lang, rtl: E.rtl(design.layout, a.lang), font: design.font, sample: false, logo,
      theme: (written = E.buildTheme(design, a.lang)), ui: design.ui, model: { byPath: path.basename(m.folder), taken: m.taken }, bind: (bind = named(Bind.suggest(pickFrom, kpisOf(pages)))),
      texts: E.REPORT_TEXTS[a.lang], pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, png: png1, panel: p.panel }))
    });
    extra = { pages: pages.map((p) => ({ name: p.name, width: p.page.w, height: p.page.h, slots: p.slots.length, slideInPanel: !!p.panel })), theme: E.themeName(design.name),
      ...(themeChanged.length ? { themeChanged } : {}) };
  } else {
    // hand-placed pages: KPI slots beyond the measures are left out, and named
    const leftOut = [];
    a.pages = a.pages.map((p) => { let k = 0; return Object.assign({}, p, { slots: p.slots.filter((s) => { if (s.kind !== 'kpi') return true; k++; if (k <= usable.length) return true; leftOut.push(s.title || `KPI ${k}`); return false; }) }); });
    a.pages = a.pages.map((p) => Object.assign({}, p, { slots: withValues(p.slots) }));
    if (leftOut.length) { const asked = kpisOf(a.pages) === 1 && !usable.length ? leftOut.length : Math.max(...a.pages.map((p) => p.slots.filter((s) => s.kind === 'kpi').length)) + leftOut.length; kpiCards = cardNote(asked, asked - leftOut.length, leftOut); }
    const theme = a.theme ? JSON.parse(fs.readFileSync(inside(a.theme), 'utf8')) : { name: a.name };
    written = theme;
    r = Pbip.build({
      name: a.name, title: a.name, lang: a.lang, rtl: a.rtl, font: a.font, sample: false, logo, theme,
      ui: Object.assign({ text: '#1f2937', card: '#ffffff', background: '#f3f4f6', accent: '#0f6cbd' }, themeColors(theme), a.colors || {}),
      model: { byPath: path.basename(m.folder), taken: m.taken }, bind: (bind = named(Bind.suggest(pickFrom, kpisOf(a.pages)))),
      texts: { by: a.lang === 'ar' ? 'حسب' : 'by', newDesign: a.lang === 'ar' ? 'تصميم جديد' : 'New design' },
      pages: a.pages.map((p) => ({ name: p.name, page: { w: p.width, h: p.height }, slots: p.slots, panel: null, png: p.background ? fs.readFileSync(inside(p.background)) : png1 }))
    });
  }
  // write next to the model; refuse to replace anything that already exists
  const clash = r.files.map((f) => path.join(m.projectDir, f.path)).filter((f) => fs.existsSync(f));
  if (clash.length) throw new Error(`Not written: ${clash.length} files already exist, e.g. ${clash[0]}`);
  r.files.forEach((f) => { const out = path.join(m.projectDir, f.path); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, f.data); });
  // what the report shows behind its visuals (read from the theme that was written, as the report writer reads it)
  const solid = !!((((((written.visualStyles || {})['*'] || {})['*'] || {}).background || [{}])[0] || {}).show);
  const panels = solid
    ? 'Each KPI card, chart and table has its own panel, drawn by the theme (solid visuals in the card colour, with the design\'s corners and shadow); the header and the filter rail are bands. There is no background image.'
    : 'The visuals have no panels of their own (the theme\'s visuals are transparent): they show on the page\'s background image where one is given, otherwise straight on the page. For panels, use a design or a theme with solid visuals.';
  if (kpiCards && leftOutVisuals.length) kpiCards.leftOutVisuals = leftOutVisuals;
  if (kpiCards) reportNotes.push(`KPI cards: ${kpiCards.built} of ${kpiCards.asked} built. ${kpiCards.why}`);
  const notes = modelNotes(m.tmsl, bind);
  // what was done with the display names; and in an Arabic report, the fields it shows under a model name that has no
  // Arabic letter (no name is ever made up for them)
  const shown = [...new Set(fieldsOf(bind).map(keyOf))];
  const names = given.size ? { displayNames: { used: [...given.values()].filter((g) => g.used).length, notUsed: [...given.values()].filter((g) => !g.used).map((g) => g.key) } } : {};
  const missing = a.lang === 'ar' ? fieldsOf(bind).filter((f) => !f.name && !/[\u0600-\u06FF]/.test(f.c != null ? f.c : f.m)).map(keyOf).filter((k, i, l) => l.indexOf(k) === i) : null;
  const arabic = a.lang === 'ar' ? { arabicNames: { shownFields: shown.length, missing,
    how: missing.length ? 'These fields show under their model names. To show Arabic names, call create_report again with displayNames: { "Table[Field]": "الاسم" } for each (ask the user for the names: nothing is translated automatically). The model is not renamed.' : 'Every field the report shows has an Arabic name.' } } : {};
  return text(Object.assign({ written: r.files.length, open: path.join(m.projectDir, r.base + '.pbip'), report: r.base + '.Report', model: path.basename(m.folder) }, extra, { panels },
    sc.scope ? { scope: sc.scope } : {}, kpiCards ? { kpiCards } : {}, names, arabic, notes.length ? { modelNotes: notes } : {}, reportNotes.length ? { reportNotes } : {}));
}));

// Things in the user's model that make the new report look wrong, for the fields it uses. The report never changes the
// model: these are told to the user, with the fix, to make in Power BI Desktop (or through Microsoft's MCP, with the
// user's go). A month or day name without a sort column shows them A to Z; a ratio without a format string shows 0.34, not 34%.
function modelNotes(tmsl, bind) {
  const model = (tmsl && (tmsl.model || tmsl)) || {}, notes = [], seen = new Set();
  const find = (f, kind) => { const t = (model.tables || []).find((x) => x.name === f.t); return t && (t[kind] || []).find((x) => x.name === (f.c || f.m)); };
  const fields = bind ? [bind.date, bind.measure, ...(bind.kpis || []), ...Object.values(bind.cats || {}), ...Object.values(bind.y || {}), ...(bind.table || []), ...(bind.slicers || [])] : [];
  fields.filter(Boolean).forEach((f) => {
    const key = `${f.t}[${f.c || f.m}]`;
    if (seen.has(key)) return; seen.add(key);
    if (f.c != null) {
      const c = find(f, 'columns');
      if (c && !c.sortByColumn && /month|الشهر/i.test(f.c) && !/number|num|no|sort|key|offset|start|date/i.test(f.c))
        notes.push({ field: key, issue: f.sortBy ? 'This column has no sort-by column in the model. The report\'s charts are put in month order by the report itself; tables and slicers still show months in alphabetical order.' : 'Months will show in alphabetical order: this column has no sort-by column.',
          fix: `In Power BI Desktop select ${key}, then Column tools > Sort by column > ${f.sortBy ? f.sortBy.c : 'the month number column'}. check_model_health gives the steps or a ready script (fixes.MONTH_SORT).` });
      if (c && !c.sortByColumn && /(day|weekday)\s*name|اسم اليوم/i.test(f.c))
        notes.push({ field: key, issue: f.sortBy ? 'This column has no sort-by column in the model. The report\'s charts are put in weekday order by the report itself; tables and slicers still show days in alphabetical order (Friday, Monday, ...).' : 'Days will show in alphabetical order (Friday, Monday, ...): this column has no sort-by column.',
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

// ---------- design tools: the Theme Generator's engine (assets/js/design-engine.js) ----------

server.registerTool('generate_theme', {
  title: 'Generate a Power BI theme',
  description: 'Makes a Power BI report theme (JSON) exactly as the DataArcus Theme Generator does, and writes it to a new file inside the DataArcus folder (never over an existing one). Colours from a full palette, a brand colour and a harmony, or a preset (in that order). Returns the file, the full design (pass it to plan_layout and create_report), the readability checks and every input value that could not be used.',
  inputSchema: {
    name: z.string().max(60).optional().describe('Theme name; empty or blank gives "My Brand Theme"'),
    palette: z.object({ data: z.array(z.string()).length(8).describe('8 data colours, hex'),
      ui: z.object({ background: z.string(), card: z.string(), text: z.string(), accent: z.string(), good: z.string().optional(), neutral: z.string().optional(), bad: z.string().optional() })
        .describe('Page, visual (card), text and table accent colours; good/neutral/bad come from the preset when left out') }).optional(),
    brand: z.string().optional().describe('A brand colour (hex): 8 data colours are generated from it with the harmony'),
    harmony: z.string().optional().describe('analogous (default), complementary, triadic or mono'),
    preset: z.string().optional().describe(`A preset palette: ${Object.keys(E.PRESETS).join(', ')} (default DataArcus)`),
    font: z.string().optional().describe(`One of: ${E.FONTS.join(', ')}. For Arabic reports: ${E.AR_FONTS.join(', ')}`),
    chart: z.object({ labels: z.string(), grid: z.string(), legend: z.string(), axis: z.string(), table: z.string() }).partial().optional()
      .describe(`Chart style: ${Object.entries(E.CHART_OPTIONS).map(([k, v]) => `${k} ${v.join('|')}`).join('; ')}. legend "Right" is the side (left in right-to-left designs)`),
    layout: z.object({ page: pageInput.optional(), radius: z.number().optional().describe('Corner radius 0-24 (default 8)'), shadow: z.boolean().optional(),
      transparent: z.boolean().optional().describe('Transparent visuals, for a background image with the panels'), dir: z.enum(['ltr', 'rtl']).optional() }).optional()
      .describe('Page and style choices that change the theme (text sizes grow with the page, kept within 8-60)'),
    lang: langInput,
    folder: z.string().optional().describe('Folder for the theme file, inside the DataArcus folder (default: the DataArcus folder)')
  }, annotations: ADDS
}, safe(async (a) => {
  const { design, repaired, notes } = themeDesign(a);
  const { page, fitted } = pageOf(design.layout), { contrast, warnings } = contrastReport(design);
  if (fitted) warnings.push(`Page ${fitted.asked.w} x ${fitted.asked.h} is outside the sizes the generator allows; the theme is made for ${page.w} x ${page.h}.`);
  const arabic = a.lang === 'ar' || design.layout.dir === 'rtl';
  if (arabic && !E.AR_FONTS.includes(design.font)) warnings.push(`${design.font} has no Arabic letters, so Arabic text will show in another font. For Arabic reports use ${E.AR_FONTS.join(', ')}.`);
  const file = freeFile(a.folder, E.fileBase(design.name), '.json');
  fs.writeFileSync(file, JSON.stringify(E.buildTheme(design, a.lang), null, 2));
  return text({ path: file, file: path.basename(file), page, design, contrast, warnings, repaired, ...(notes.length ? { notes } : {}) });
}));

server.registerTool('plan_layout', {
  title: 'Plan a report page layout',
  description: 'The exact position of every visual on a Power BI page, as the DataArcus Theme Generator lays it out: one row per visual with its name, the suggested visual, and x, y, width, height in the page\'s own units (Format > General > Properties). Right-to-left designs are mirrored. forAuthoring gives the same numbers as PBIR visual.json positions for editing an existing report: use them exactly, never snap them to multiples of 8, so every visual lands on its panel. Nothing is written.',
  inputSchema: {
    design: z.record(z.any()).optional().describe('The design from generate_theme (its layout is the starting point); the other inputs change it'),
    layout: z.enum(['exec', 'analysis', 'ops', 'focus']).optional().describe('Executive summary, analysis (filters and a wide table), operations monitor, or single focus'),
    kpis: z.number().int().min(0).max(6).optional().describe('KPI cards in the top row (0-6; the layouts are made for 3-6, fewer cards share the row, 0 leaves the row out)'),
    filters: z.enum(['none', 'start', 'end', 'top']).optional().describe('A filter panel at the start or end side (left or right by reading direction), a strip on top, or none'),
    header: z.boolean().optional().describe('A header band with the page title and a logo (default on)'),
    page: pageInput.optional(),
    dir: z.enum(['ltr', 'rtl']).optional().describe('Reading direction; by default the language decides'),
    lang: langInput
  }, annotations: READS
}, safe(async (a) => {
  const r = planLayout(a), { page, fitted } = pageOf(r.design.layout);
  return text({ page, fitted, slots: r.slots, why: r.why, forAuthoring: r.forAuthoring, design: r.design });
}));

prepareRoot();
await server.connect(new StdioServerTransport());
console.error(rootProblem() ? `DataArcus MCP started, but no tool will work: ${rootProblem()}` : `DataArcus MCP ready. Folder: ${ROOT}`);
