#!/usr/bin/env node
// DataArcus MCP server: the engines behind dataarcus.com's Power BI tools, for an AI agent.
// Pairs with Microsoft's Power BI Authoring MCP server (model edits, DAX) and the Desktop bridge (reload, screenshots).
// Every path stays inside DATAARCUS_ROOT (default: the folder the server starts in), and nothing is ever overwritten.
import fs from 'node:fs';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Bind, Health, Pbip, ROOT, applyColumnTypes, inside, loadModel, summary } from './lib/model.mjs';
import { E, themeDesign, planLayout, pageOf, contrastReport, freeFile } from './lib/design.mjs';

const server = new McpServer({ name: 'dataarcus', version: '0.1.0' });
const text = (o) => ({ content: [{ type: 'text', text: typeof o === 'string' ? o : JSON.stringify(o, null, 2) }] });
const fail = (e) => ({ isError: true, content: [{ type: 'text', text: String(e && e.message || e) }] });
const safe = (fn) => async (args) => { try { return await fn(args); } catch (e) { return fail(e); } };
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
  description: 'Lists the tables, visible columns (with types), measures (with formats) and date tables of a model, without changing it.',
  inputSchema: { path: modelPath }
}, safe(async ({ path: p }) => { const m = loadModel(p); return text({ source: m.source, existingReports: m.taken || [], tables: summary(m) }); }));

server.registerTool('suggest_fields', {
  title: 'Suggest fields for a report design',
  description: 'Picks which of the model\'s measures and columns go in each KPI card, chart, table and slicer, the way the DataArcus theme generator does (base measures first, month from the date table, no keys or hidden fields).',
  inputSchema: { path: modelPath, kpis: z.number().int().min(1).max(8).default(4).describe('Number of KPI cards') }
}, safe(async ({ path: p, kpis }) => { const m = loadModel(p); const b = Bind.suggest(m.tables, kpis); delete b.choices; return text(b); }));

server.registerTool('check_model_health', {
  title: 'Check model health',
  description: 'Runs the DataArcus Model Health Check: score, and every finding with the objects it concerns (unused columns and measures, risky relationships, slow DAX, date tables...). Reads a project saved by Power BI Desktop (TMDL or model.bim), a model.bim or a .pbit.',
  inputSchema: {
    path: modelPath, maxItems: z.number().int().min(1).max(200).default(15).describe('Objects listed per finding'),
    columnTypes: z.record(z.string(), z.union([z.string(), z.number()])).optional()
      .describe('Only when a TMDL project skipped checks: column types read from the same model open in Power BI Desktop, as { "Table[Column]": type }. The type is a model.bim name (string, int64, double, decimal, dateTime, boolean) or the number INFO.COLUMNS returns (2, 6, 8, 10, 9, 11), also as text. Fills only columns the files leave without a type.')
  }
}, safe(async ({ path: p, maxItems, columnTypes }) => {
  const m = loadModel(p);
  const typed = columnTypes ? applyColumnTypes(m.tmsl, columnTypes) : undefined;
  const r = Health.analyze(m.tmsl, m.report);
  return text({
    source: m.source, score: r.score, stats: r.stats, reportRead: !!m.report,
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
  description: 'Writes a new Power BI report (PBIR) next to the user\'s model: every visual placed, bound to the model\'s fields (suggested, or given), theme and background applied. The model and any existing report are never touched; the new report gets a free name. Every report also gets a hidden tooltip page, ready for custom tooltips. Give either pages (hand-placed slots) or a design (from generate_theme or plan_layout): with a design the pages, positions, second page, slide-in filter panel, labels and theme are exactly the DataArcus Theme Generator\'s project download. Open the new .pbip in Power BI Desktop afterwards (or reload it with the Desktop bridge).',
  inputSchema: {
    path: modelPath.describe('The project folder or .SemanticModel folder the report will use'),
    name: z.string().min(1).max(60).describe('Report name'),
    pages: z.array(z.object({ name: z.string(), width: z.number().int().default(1920), height: z.number().int().default(1080), slots: z.array(slot).min(1),
      background: z.string().optional().describe('PNG file for the page background, inside the DataArcus folder') })).min(1).optional()
      .describe('Hand-placed pages; or give a design instead'),
    design: z.record(z.any()).optional().describe('The design from generate_theme or plan_layout; the layout inputs below change it, as in plan_layout'),
    layout: z.enum(['exec', 'analysis', 'ops', 'focus']).optional(), kpis: z.number().int().min(3).max(6).optional(),
    filters: z.enum(['none', 'start', 'end', 'top']).optional(), header: z.boolean().optional(), page: pageInput.optional(), dir: z.enum(['ltr', 'rtl']).optional(),
    secondPage: z.boolean().default(true).describe('With a design: a second page in a complementary layout (details after an overview, an overview after analysis), with page buttons'),
    slidePanel: z.boolean().default(false).describe('With a design: filters as a slide-in panel opened from a Filters button in the header, instead of a filter rail'),
    theme: z.string().optional().describe('Theme JSON file (e.g. from the DataArcus theme generator), inside the DataArcus folder'),
    lang: z.enum(['en', 'ar']).default('en'), rtl: z.boolean().default(false), font: z.string().default('Segoe UI'),
    colors: z.object({ text: z.string(), card: z.string(), background: z.string(), accent: z.string() }).partial().optional()
  }
}, safe(async (a) => {
  if (!a.pages === !a.design) throw new Error('Give create_report pages or a design, not both and not neither: pages with hand-placed slots, or the design from generate_theme or plan_layout.');
  const m = loadModel(a.path);
  if (!m.folder) throw new Error('create_report needs a project folder with a .SemanticModel (save the .pbix as a Power BI project first).');
  // no background image given: a fully transparent pixel, so the page colour from the theme shows
  const png1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4AWMAAQAABQABNtCI3QAAAABJRU5ErkJggg==', 'base64');
  const kpisOf = (pages) => pages.reduce((n, p) => Math.max(n, p.slots.filter((s) => s.kind === 'kpi').length), 0) || 1;
  let r, bind, extra = {};
  if (a.design) {
    // the website's project download for this design: its pages (second page, slide-in panel), labels and theme
    let design = planLayout({ design: a.design, layout: a.layout, kpis: a.kpis, filters: a.filters, header: a.header, page: a.page, dir: a.dir, lang: a.lang }).design;
    const themeChanged = [];
    if (design.layout.transparent) {
      themeChanged.push({ setting: 'layout.transparent', from: true, to: false,
        why: 'Transparent visuals are meant to sit on panels drawn in a background image. This report has no background image yet, so its theme gives the visuals their own solid cards to keep them visible.' });
      design = Object.assign({}, design, { layout: Object.assign({}, design.layout, { transparent: false }) });
    }
    const pages = E.projectPages(design.layout, a.lang, { second: a.secondPage, panel: a.slidePanel });
    r = Pbip.build({
      name: a.name, title: E.themeName(design.name), pageName: pages[0].name, lang: a.lang, rtl: E.rtl(design.layout, a.lang), font: design.font, sample: false, logo: null,
      theme: E.buildTheme(design, a.lang), ui: design.ui, model: { byPath: path.basename(m.folder), taken: m.taken }, bind: (bind = Bind.suggest(m.tables, kpisOf(pages))),
      texts: E.REPORT_TEXTS[a.lang], pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, png: png1, panel: p.panel }))
    });
    extra = { pages: pages.map((p) => ({ name: p.name, width: p.page.w, height: p.page.h, slots: p.slots.length, slideInPanel: !!p.panel })), theme: E.themeName(design.name),
      ...(themeChanged.length ? { themeChanged } : {}) };
  } else {
    const theme = a.theme ? JSON.parse(fs.readFileSync(inside(a.theme), 'utf8')) : { name: a.name };
    r = Pbip.build({
      name: a.name, title: a.name, lang: a.lang, rtl: a.rtl, font: a.font, sample: false, logo: null, theme,
      ui: Object.assign({ text: '#1f2937', card: '#ffffff', background: '#f3f4f6', accent: '#0f6cbd' }, themeColors(theme), a.colors || {}),
      model: { byPath: path.basename(m.folder), taken: m.taken }, bind: (bind = Bind.suggest(m.tables, kpisOf(a.pages))),
      texts: { by: a.lang === 'ar' ? 'حسب' : 'by', newDesign: a.lang === 'ar' ? 'تصميم جديد' : 'New design' },
      pages: a.pages.map((p) => ({ name: p.name, page: { w: p.width, h: p.height }, slots: p.slots, panel: null, png: p.background ? fs.readFileSync(inside(p.background)) : png1 }))
    });
  }
  // write next to the model; refuse to replace anything that already exists
  const clash = r.files.map((f) => path.join(m.projectDir, f.path)).filter((f) => fs.existsSync(f));
  if (clash.length) throw new Error(`Not written: ${clash.length} files already exist, e.g. ${clash[0]}`);
  r.files.forEach((f) => { const out = path.join(m.projectDir, f.path); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, f.data); });
  const notes = modelNotes(m.tmsl, bind);
  return text(Object.assign({ written: r.files.length, open: path.join(m.projectDir, r.base + '.pbip'), report: r.base + '.Report', model: path.basename(m.folder) }, extra,
    notes.length ? { modelNotes: notes } : {}));
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
        notes.push({ field: key, issue: 'Months will show in alphabetical order: this column has no sort-by column.',
          fix: `In Power BI Desktop select ${key}, then Column tools > Sort by column > the month number column.` });
      if (c && !c.sortByColumn && /(day|weekday)\s*name|اسم اليوم/i.test(f.c))
        notes.push({ field: key, issue: 'Days will show in alphabetical order (Friday, Monday, ...): this column has no sort-by column.',
          fix: `In Power BI Desktop select ${key}, then Column tools > Sort by column > the day-of-week number column.` });
    } else {
      const ms = find(f, 'measures');
      if (ms && !ms.formatString && /%|ratio|rate|share|margin|نسبة|هامش/i.test(f.m))
        notes.push({ field: key, issue: 'This looks like a percentage but has no format string, so cards show 0.34 instead of 34%.',
          fix: `In Power BI Desktop select ${key}, then Measure tools > Format > Percentage.` });
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
  }
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
    kpis: z.number().int().min(3).max(6).optional().describe('KPI cards in the top row (3-6)'),
    filters: z.enum(['none', 'start', 'end', 'top']).optional().describe('A filter panel at the start or end side (left or right by reading direction), a strip on top, or none'),
    header: z.boolean().optional().describe('A header band with the page title and a logo (default on)'),
    page: pageInput.optional(),
    dir: z.enum(['ltr', 'rtl']).optional().describe('Reading direction; by default the language decides'),
    lang: langInput
  }
}, safe(async (a) => {
  const r = planLayout(a), { page, fitted } = pageOf(r.design.layout);
  return text({ page, fitted, slots: r.slots, why: r.why, forAuthoring: r.forAuthoring, design: r.design });
}));

await server.connect(new StdioServerTransport());
console.error(`DataArcus MCP ready. Folder: ${ROOT}`);
