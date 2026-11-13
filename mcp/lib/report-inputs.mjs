// create_report's inputs (plan_layout takes them too), their defaults, and what a report plan pins of them.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import crypto from 'node:crypto';
import { z } from 'zod';
import { DESIGN_KEYS, LAYOUT_KEYS, OLD_LAYOUT_KEYS, planLayout, DEFAULT_PAGE_W, DEFAULT_PAGE_H } from './design.mjs';
import { SWITCH_MIN, SWITCH_MAX } from './metric-switcher.mjs';
import { reportPrint } from './read-report.mjs';
import { LIST_MAX as ICONS_MAX } from './status-icons.mjs';
import { USES as DAX_USES } from './dax-functions.mjs';
import { readUserFile } from './files.mjs';
import { GALLERY_KINDS } from './tool-limits.mjs';
import { WATERFALL_RTL_INPUT, planIdInput, modelPath, slot, columnStatsShape, strictObject, keysSaid, unknownKeysSaid } from './tool-inputs.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Gallery = require('../../assets/js/visual-gallery.js');

// The keys of a design the tools know. Another key (a typing slip, or an input that doesn't exist, like "fields"
// inside a design) is named in the answer's "ignored", never dropped without a word.
// (the audit's A2-7: the key lists are the design engine's, with its written schema; an older design's keys the engine
// still reads, such as kpiCards, are reported by the engine's repair instead)
// (0.3.3 LX1, SN1's open item) The sentence names plan_layout's planFields, the input fields go in today (create_report
// has no "fields" input since 0.3.2); fixtures/fn1j-pins.json was recorded again on purpose for it (mcp/work/LX1.md).
export function unknownKeys(design) {
  const keys = Object.keys(design || {}).filter((k) => !DESIGN_KEYS.includes(k))
    .concat(Object.keys((design && typeof design.layout === 'object' && design.layout) || {}).filter((k) => !LAYOUT_KEYS.includes(k) && !OLD_LAYOUT_KEYS.includes(k)).map((k) => 'layout.' + k));
  return keys.length ? { keys, why: 'These keys of the design are not ones the tools know, so they changed nothing. The fields go in plan_layout\'s own "planFields" input, not inside the design; layout choices are its other inputs.' } : null;
}
// the files a user names, read through lib/files.mjs (audit 6, A6-7): measured first, never quoted; the largest real
// theme files are about 22 KB and a page background a few hundred KB, so the caps are far above them
export const THEME_MAX = 4 * 1024 * 1024, BACKGROUND_MAX = 10 * 1024 * 1024, LOGO_MAX = 2 * 1024 * 1024;
// The inputs plan_layout takes from here, one definition each (audit 6, A6-1): the ones a plan pins and create_report
// writes from the approved plan. (0.3.3 SN1) create_report itself lists only path and planId (CREATE_REPORT_WRITE below);
// plan_layout's own inputs (design, layout, kpis, focus, tables, filters, header, page, dir, lang, fields, displayNames,
// planFields, path) are defined in tools/plan_layout.mjs and named in PLAN_ONLY_KEYS: they were defined here too, and no
// tool listed them from here.
export const CREATE_REPORT_INPUTS = {
    name: z.string().min(1).max(60).optional().describe('Report name (needed for a new report)'),
    title: z.string().min(1).max(80).optional().describe('Header title (default: the report\'s name)'),
    pages: z.array(z.object({ name: z.string(), width: z.number().int().default(DEFAULT_PAGE_W), height: z.number().int().default(DEFAULT_PAGE_H), slots: z.array(slot).min(1),
      background: z.string().optional().describe('Background PNG inside the DataArcus folder') })).min(1).optional()
      .describe('Hand-placed pages; or give a design instead'),
    secondPage: z.boolean().optional().describe('(Default true.) With a design: a second page in a complementary layout (details after an overview, or the reverse), with page buttons'),
    slidePanel: z.boolean().optional().describe('(Default false.) With a design: filters in a slide-in panel opened by a Filters button in the header, not a rail'),
    theme: z.string().optional().describe('Theme JSON file inside the DataArcus folder'),
    pageFilters: z.array(z.object({
      field: z.string().describe('A column, Table[Column] as read_model lists it (never a measure)'),
      values: z.array(z.union([z.string(), z.number(), z.boolean()])).min(1).max(50).describe('Values kept, in the column\'s type')
    }).strict()).max(8).optional().describe('For a request limited to part of the data ("Ramadan only": [{ "field": "Calendar[Is Ramadan]", "values": [true] }]; "this Ramadan" also needs the Hijri year: ask the user, the tools never return data values). Each keeps the rows whose column is one of the values, on every page. Model columns and plain values only: no measures, dates or DAX. Show them in the plan'),
    svgColumns: z.array(z.object({
      label: z.string().min(1).max(40).describe('The column\'s header and its report-level measure\'s name; not a model measure\'s name'),
      design: z.record(z.any()).describe('The design, in the SVG KPI Designer\'s format: { w, h, bg?, values: [{ id, label, kind: "measure", measure: "Table[Measure]" } | { id, label, kind: "column", column: "Table[Column]" } | { id, label, kind: "ratio" | "diff" | "pct", a, b }], layers: [{ type: "rect" | "circle" | "line" | "text" | "ring" | "arrow" | "spark", ...sizes, colours (#rrggbb or "theme:accent", text, muted, track, card, good, bad, neutral, data1 to data8; left out: the theme\'s), bind?: { w | x | fill | text | p | dir | show | ...: { v: <value id>, ... } } }] }. A text bound to a column: bind.text { v, fmt: "text" }. No raw SVG, no script: only these layers'),
      page: z.number().int().min(1).optional().describe('The page (1 = the first) whose table gets it; left out: the first page with a table')
    }).strict()).max(4).optional().describe('EXPERIMENTAL. A small picture per table row (progress bar, ring, arrow, sparkline, label) from a declarative design: a report-level measure (the model is never touched), the table\'s last column. Show them in the plan'),
    svgCards: z.array(z.object({
      card: z.number().int().min(1).max(6).describe('The KPI card (1 = the first), on every page'),
      label: z.string().min(1).max(40).describe('The report-level measure\'s name; not a model measure\'s name'),
      design: z.record(z.any()).describe('The design, in the same format as svgColumns')
    }).strict()).max(6).optional().describe('EXPERIMENTAL. A small picture (ring, arrow, sparkline) beside a KPI card\'s number, designed as in svgColumns; the model is never touched'),
    gallery: z.union([z.boolean(), z.array(z.enum(GALLERY_KINDS)).min(1).max(3)]).optional().describe('Power BI\'s waterfall, combo (line and clustered column) and small multiples, only when the user asks: true (every kind that fits) or a list (hand-placed pages name it in a slot). Each only where its fields fit (combo: two measures in ONE unit over a time or ordered axis, never a second axis; waterfall: one measure that adds up over 2-12 known members, such as months; smallMultiples: one measure by a category, a panel per member of a second, small one), else the slot\'s kind; gallery says why'),
    // (0.3.0 J19, B-172) the person's own answers on which measures may share one chart axis
    sharedAxes: z.array(z.object({ measures: z.array(z.string().max(300)).length(2).describe('Two measures, Table[Measure] as read_model lists them'), answer: z.enum(['comparable', 'separate']) }).strict()).max(20).optional()
      .describe('Only the user\'s own answer to the plan\'s sharedAxes question: two measures in one unit share a chart axis only when the user says they compare ("comparable"); "separate": separate visuals. Never answer for the user. Different units: always separate, never a secondary axis, no currency converted'),
    chartColors: z.enum(['gradient', 'solid']).optional().describe('Bar and column charts\' bars: "gradient" (each bar fades by its value from a light tint to the theme\'s first data colour) or "solid". Left out: "gradient" with a design, "solid" on hand-placed pages'),
    // (0.3.1 FX5b, the owner's D-1028-06: three bars on a plain text column drawn wide) the model's own counts
    columnStats: columnStatsShape().optional().describe('Counts only, never values (suggest_fields\' shape: distinct { "Table[Column]": Cardinality from COLUMNSTATISTICS(); never pass its Min or Max }, rows { "Table": row count }): a bar or column chart on a column of few values then draws fitting bars (barThickness)'),
    chartAxes: z.enum(['mirrored', 'standard']).optional().describe('Right-to-left reports only. "mirrored" (the default there): value axis, categories, dates and bars from the right. "standard": charts stay left to right'),
    waterfallRtl: WATERFALL_RTL_INPUT(),
    text: z.string().min(1).max(400).optional().describe('The design\'s text box sentence, from the approved plan: what the main chart shows and what to do, in the report\'s language. Without it no box: never a placeholder'),
    kpiValues: z.enum(['auto', 'full']).optional().describe('KPI cards\' numbers. "auto" (default): units with 2 decimals (3.43M). "full": the full number with separators (101,914), smaller on narrow cards, never cut'),
    logo: z.string().optional().describe('Header logo: a PNG or JPG inside the DataArcus folder, 2 MB at most; copied into the report, shown at its own shape'),
    subtitles: z.record(z.string(), z.string().max(120)).optional().describe('Subtitles under chart titles, from the approved plan only, never made up: { "<the slot\'s role, or a hand-placed slot\'s title>": "<text>" }'),
    // (0.3.0 L2: the polish lab's look options, 12-13 Oct, Desktop 2.158)
    slicerStyle: z.enum(['dropdown', 'pills']).optional().describe('(Default "dropdown".) "pills": Power BI\'s button slicer, only for a field with 2-6 values known from metadata (true/false, a quarter); other slicers stay dropdowns'),
    grid: z.enum(['solid', 'dotted', 'none']).optional().describe('(Default "solid".) Value-axis gridlines: "dotted" calms dense bars; "none" suits data labels'),
    // (0.3.0 L4: the flip-card labs of 10 Oct, Desktop 2.158)
    flipCards: z.union([z.boolean(), z.array(z.number().int().min(1).max(6)).min(1).max(6)]).optional().describe('(Default false.) KPI cards that turn over to a one-line description when clicked: true for all, or 1-6 card numbers in reading order. Their pictures need measures: a TMDL script the user applies in TMDL view first (DataArcus never changes the model)'),
    // (0.3.1 X2) one report holding both languages, built in the same plan by the EN-AR copy's engine (create_arabic_twin into "same")
    languages: z.enum(['en+ar']).optional().describe('Only when the user asks for ONE report in English and Arabic: the English pages, then each page\'s mirrored Arabic page (as create_arabic_twin into "same"), a language button on every page («العربية» / "English"). Plan it with lang "en": the plan drafts the Arabic of every text and field (bilingual), written only as the user approves it (arabicTexts, arabicTerms)'),
    tabsShown: z.enum(['en', 'ar']).optional().describe('With languages "en+ar": whose pages show in the tabs (default "en"); the other\'s are reached by the language button'),
    arabicTexts: z.record(z.string().max(200), z.string().max(200)).optional().describe('With languages "en+ar": the approved Arabic per text, keyed by the English exactly as bilingual.texts lists it; a text without one stays English'),
    arabicTerms: z.record(z.string().max(300), z.string().max(200)).optional().describe('With languages "en+ar": the approved Arabic name per Table[Field] (bilingual.terminology); the English name given back keeps it English'),
    // (0.3.3 RX1, the owner's D-1112-04) the plan's views as bookmarks, in the plan's order: each opens its page and holds
    // no data state and no display state (assets/js/pbip-export.js bookmarkFiles); the text is short on purpose (tools/list's cap)
    bookmarks: z.array(z.object({ name: z.string().min(1).max(60), page: z.number().int().min(1).default(1) }).strict()).min(1).max(8).optional().describe('Only when asked: views in presenting order, each a bookmark opening its page (1 = the first), first in the Bookmarks pane. No filter or slicer state'),
    // (0.3.0 L5: the theme-icons lab of 10 Oct, Desktop 2.158)
    statusIcons: z.union([z.boolean(), z.array(z.object({ measure: z.string().max(300), good: z.string().max(40).optional(), bad: z.string().max(40).optional() }).strict()).min(1).max(ICONS_MAX)]).optional().describe('(Default false.) Status icons (three shapes, never colour alone) before a table\'s or matrix\'s measure. true: every rate or ratio with a target measure the model names ("<name> Target", "Goal", "Budget"). Or 1-8 { measure: "Table[Measure]", good, bad }: the USER\'s own thresholds (">= 0.97"), never guessed; without thresholds it needs a model target. With a target, the status measure is a TMDL script the user applies in TMDL view first'),
    // (0.3.1 L6, the DAX functions lab of 10 Oct; Microsoft Learn read 25 Oct: generally available since June 2026, level 1702)
    daxFunctions: z.union([z.boolean(), z.array(z.enum(DAX_USES)).min(1).max(DAX_USES.length)]).optional().describe('(Default false.) Only when the user asks: the DataArcus DAX function library and the measures calling it, as ONE TMDL script the user applies in TMDL view (DataArcus never changes the model). Say FIRST, in the user\'s language: applying it raises the model\'s compatibility level to 1702, which cannot be undone. true: all four where they fit; or a list of "sparkline" (a 12-month trend column in the table; needs a related date table), "bulletBar" (a bar against a model target), "kpiCards" (KPI cards as pictures; not with flipCards), "storyTitles" (a chart title naming its leader)'),
    smoothLines: z.boolean().optional().describe('(Default true.) Lines (and a combo\'s line) as smooth curves that never swing past the data, a dot per point. false: straight lines, no dots, for a jagged series where every swing matters'),
    // (L3, the lab of 10 Oct: a field parameter switches charts between measures, each in its own format)
    metricSwitcher: z.array(z.string().max(300)).min(SWITCH_MIN).max(SWITCH_MAX).optional().describe('(Default off.) Only when the user asks: 2 to 5 model measures (Table[Measure] as read_model lists them) one slicer switches between, on their own page ("Metric", Arabic «المؤشر»). The model is never changed: the field parameter is a TMDL script the user applies in TMDL view; until then that page shows Power BI\'s error'),
    noDataMessage: z.boolean().optional().describe('(Default true.) Charts and tables say "No data for this selection" (Arabic: لا توجد بيانات لهذا الاختيار) when their measure is blank for the filters; a wide enough KPI card says "No data". The model is not touched. false: none'),
    rtl: z.boolean().optional().describe('Hand-placed pages only: right to left (Arabic: the default with lang "ar"; false keeps them left to right)'), font: z.string().optional().describe('The font (default Segoe UI)'),
    colors: strictObject('colors', { text: z.string(), card: z.string(), background: z.string(), accent: z.string() }).partial().optional(),
    // (0.2.9, custom visuals, step C: lib/native-copy.mjs)
    customVisualsFrom: z.string().max(400).optional().describe('An existing PBIR report (.pbip or .Report folder) whose custom visuals become native ones in a NEW report "<name> native" beside it (the original is only read); the plan lists each replacement and its loss'),
    // (0.3.1 NC2) where the plan offers a closer native first (a bullet, a calendar heatmap), the user's choice of the second
    customVisualsSecond: z.array(z.string().max(40)).max(50).optional().describe('With customVisualsFrom, only the user\'s choice: keys ("page:x,y", from replacements[].second.pick) of the replacements written as their second option'),
    // (0.3, J13 redesign step 2: lib/redesign.mjs, copy-and-patch)
    redesignFrom: z.string().max(400).optional().describe('An existing PBIR report (.pbip or .Report folder) on this model, redesigned as a NEW report "<name> redesigned" beside it (the original is only read): a lossless copy with only the allowlisted changes: top-level native visuals on the grid, titles, restyle\'s colours. redesign lists every change and every visual not changed, with why: show it all before the go'),
    // (0.3.1 CS1) one text set for a hand-made report: lib/text-format.mjs, lib/redesign.mjs
    consistentText: z.enum(['report', 'theme']).optional().describe('(Default off.) With redesignFrom: one text set for the report: the listed native visuals lose their own font, size, bold and italic, so the theme governs. "report": the font and size most visuals show; "theme": the theme\'s. The plan lists every removed setting'),
    keepPositions: z.boolean().optional().describe('(Default false.) With redesignFrom: every visual keeps its place and size (no grid)'),
    titles: z.record(z.string().max(200), z.string().max(200)).optional().describe('With redesignFrom: approved new static titles, { "<page id>/<visual name>": "<title>" } as redesign.pages lists them; top-level visuals only'),
    // (0.3.1 C) the sample project: a plan of its own kind (sample), written by create_report with the same inputs
    sample: z.boolean().optional().describe('No model yet ("show me what DataArcus can do", "try the sample"): true (with lang, no model input) plans a made-up Gulf retail project. After approval create_report writes it (path: sample.folder) with a tour of next requests'),
    restyle: z.object({ preset: z.string().max(40), brand: z.string().max(20), harmony: z.string().max(20), mode: z.enum(['light', 'dark']) }).partial().strict().optional().describe('With redesignFrom: new theme colours (a preset, or a brand colour and harmony; light or dark); only the custom theme\'s colour tokens change'),
};
// (0.3.2 TK1, B-272: create_report repeated plan_layout's 55 options, about 30,000 characters of tools/list sent in every
// conversation, though it filled every left-out one from the approved plan) create_report takes the model (path, read
// again and compared with the plan's print) and the approved planId; the plan holds every other input (heldInputs, kept
// with the proposal) and create_report writes from them. The gate compares their pin with the plan's as before, and the
// files they name are read and hashed again, so what is written is still exactly what was approved
export const WRITE_KEYS = ['path', 'planId'];
// plan_layout's own inputs (defined in tools/plan_layout.mjs) that create_report once took: named "held by the plan" too
export const PLAN_ONLY_KEYS = ['design', 'layout', 'kpis', 'focus', 'tables', 'filters', 'header', 'page', 'dir', 'lang', 'fields', 'displayNames'];
export const CREATE_REPORT_WRITE = {
  path: modelPath.describe('The model the plan was made with (the sample: its sample.folder)'),
  planId: planIdInput.describe('From plan_layout, approved in approve_plan after the user\'s go. It holds every other input; without it nothing is written')
};
// what a plan keeps for create_report: the inputs it pinned from, the plan's fields as fields, never the model or the plan id
export const heldInputs = (a, fields) => Object.assign(Object.fromEntries(Object.entries(a).filter(([k, v]) => v !== undefined && !['path', 'planId', 'planFields'].includes(k))), fields !== undefined ? { fields } : {});
// create_report's words for an input it no longer takes: one the plan holds is said as such (never a bare "Unrecognized key")
export const heldSaid = (keys) => {
  const held = keys.filter((k) => (Object.prototype.hasOwnProperty.call(CREATE_REPORT_INPUTS, k) || PLAN_ONLY_KEYS.includes(k)) && !WRITE_KEYS.includes(k)), other = keys.filter((k) => !held.includes(k)), one = held.length === 1;
  return 'Nothing was written: ' + [held.length ? `${keysSaid(held)}: the approved plan holds ${one ? 'this input' : 'these inputs'} (plan_layout's), so create_report takes only path and planId: call it with those two. To change ${one ? 'it' : 'them'}, call plan_layout again with the new value${one ? '' : 's'}, show the user the new plan and wait for their go.` : '',
    other.length ? unknownKeysSaid('the inputs of create_report', other, WRITE_KEYS) : ''].filter(Boolean).join(' ');
};
// What a report plan pins (audit 6, A6-1): the design as planLayout resolves it (or the hand-placed pages), the page,
// language and direction, the fields, page filters, display names, text, subtitles and SVG designs. plan_layout stores
// it with the plan; create_report computes the same from its own inputs, and the gate compares them key by key.
// (The outside review of rc.14, A-02: the report's look and options are pinned too: its name and title, the theme file,
// the logo, the colours and every report option. plan_layout takes them with create_report's own definitions and shows
// them in the plan, so nothing the user approved can change between the go and the write.)
// REPORT_LOOK: what create_report takes for the report's look and options; when the call leaves one out, the plan's
// value is used (one with a default, such as secondPage, is compared as given)
export const REPORT_LOOK = ['name', 'title', 'theme', 'logo', 'colors', 'chartColors', 'chartAxes', 'kpiValues', 'noDataMessage', 'secondPage', 'slidePanel', 'smoothLines', 'font', 'rtl', 'gallery', 'slicerStyle', 'grid', 'metricSwitcher', 'flipCards', 'waterfallRtl', 'statusIcons', 'sharedAxes', 'customVisualsSecond', 'languages', 'tabsShown', 'arabicTexts', 'arabicTerms', 'daxFunctions', 'columnStats', 'bookmarks'];
// (B-03, the follow-up review: the options' defaults are given here, once, at the plan and at the write alike, so an
// option left out of create_report takes the plan's value, not a schema default that differs from it)
const LOOK_DEFAULTS = { kpiValues: 'auto', noDataMessage: true, secondPage: true, slidePanel: false, smoothLines: true, font: 'Segoe UI', slicerStyle: 'dropdown', grid: 'solid', flipCards: false, waterfallRtl: Gallery.WATERFALL_RTL_DEFAULT, statusIcons: false, daxFunctions: false };
export const withLookDefaults = (a) => Object.assign({}, a, Object.fromEntries(Object.entries(LOOK_DEFAULTS).filter(([k]) => a[k] === undefined)));
// (B-01: focus and tables decide which fields are picked when the plan names none, so they are pinned too)
// (0.3.1 SF1) the options only a redesign uses (redesignFrom), given with something to change: plan_layout refuses them
// elsewhere and create_report writes nothing with them, never drops them silently
export const redesignOnly = (a) => ['consistentText', 'keepPositions', 'titles', 'restyle'].filter((k) => a[k] != null && a[k] !== false && !(typeof a[k] === 'object' && !Object.keys(a[k]).length));
const REPORT_PINNED = ['pages', 'page', 'lang', 'dir', 'fields', 'focus', 'tables', 'pageFilters', 'displayNames', 'text', 'subtitles', 'svgColumns', 'svgCards', 'customVisualsFrom'].concat(REPORT_LOOK);
// (a native copy, customVisualsFrom, uses no design: none is pinned, so the report theme read at plan time cannot make
// its pin differ from create_report's)
const resolvedDesign = (a) => (a.pages || a.customVisualsFrom != null ? null : planLayout({ design: a.design, layout: a.layout, kpis: a.kpis, filters: a.filters, header: a.header, page: a.page, dir: a.dir, lang: a.lang, reportTheme: a.reportTheme, colors: a.colors, theme: a.theme }).design);
// (B-02, the follow-up review: a plan pinned the theme, logo and background files by their names only, and a native
// copy's source report as it was read at the plan; a file changed after the go changed the report. The plan now pins
// each file's contents, sha256, and the write reads them again: another file under the same name is refused)
const printOf = (p, kind, max) => { try { return crypto.createHash('sha256').update(readUserFile(p, { kind, max })).digest('hex'); } catch (e) { return 'unreadable'; } };
const filesPin = (a) => ({ theme: a.theme ? printOf(a.theme, 'theme', THEME_MAX) : null, logo: a.logo ? printOf(a.logo, 'logo', LOGO_MAX) : null,
  backgrounds: (a.pages || []).map((p) => (p && p.background ? printOf(p.background, 'background image', BACKGROUND_MAX) : null)),
  source: a.customVisualsFrom != null ? reportPrint(a.customVisualsFrom) : null });
export const reportPin = (a, fields) => Object.assign({ design: resolvedDesign(a), files: filesPin(a) }, Object.fromEntries(REPORT_PINNED.map((k) => [k, k === 'fields' ? fields : a[k]])));
// (0.3, J13) a redesign pins its own inputs and the original's contents (B-154: the write reads it again)
const nonEmpty = (o) => (o && Object.keys(o).length ? o : null);
export const redesignPin = (a) => ({ redesignFrom: String(a.redesignFrom), titles: nonEmpty(a.titles), restyle: nonEmpty(a.restyle), consistentText: a.consistentText || null, keepPositions: a.keepPositions ? true : null, files: { source: reportPrint(a.redesignFrom) } });
export const samplePin = (a) => ({ sample: true, path: String(a.path == null ? '' : a.path), lang: a.lang === 'ar' ? 'ar' : 'en' });
