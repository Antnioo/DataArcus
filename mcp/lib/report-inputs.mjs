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
    name: z.string().min(1).max(60).optional().describe('Report name (needed for a new report; customVisualsFrom names its copy after the original)'),
    title: z.string().min(1).max(80).optional().describe('The title in the report\'s header; without it the header shows the report\'s name'),
    pages: z.array(z.object({ name: z.string(), width: z.number().int().default(DEFAULT_PAGE_W), height: z.number().int().default(DEFAULT_PAGE_H), slots: z.array(slot).min(1),
      background: z.string().optional().describe('PNG file for the page background, inside the DataArcus folder') })).min(1).optional()
      .describe('Hand-placed pages; or give a design instead'),
    secondPage: z.boolean().optional().describe('(Default true.) With a design: a second page in a complementary layout (details after an overview, an overview after analysis), with page buttons'),
    slidePanel: z.boolean().optional().describe('(Default false.) With a design: filters as a slide-in panel opened from a Filters button in the header, instead of a filter rail'),
    theme: z.string().optional().describe('Theme JSON file (e.g. from the DataArcus theme generator), inside the DataArcus folder'),
    pageFilters: z.array(z.object({
      field: z.string().describe('The column, as Table[Column] exactly as read_model lists it (never a measure)'),
      values: z.array(z.union([z.string(), z.number(), z.boolean()])).min(1).max(50).describe('The values the pages keep, in the column\'s type: true or false, texts, or numbers')
    }).strict()).max(8).optional().describe('Page filters, for a request that limits the report to part of the data (for example "Ramadan only": [{ "field": "Calendar[Is Ramadan]", "values": [true] }]; "this Ramadan" also needs the calendar\'s Hijri year: ask the user which, because the tools never return data values). Each keeps the rows where the column is one of the values, on every page. Only columns of the model and plain values: no measures, no dates, no DAX. Show the filters in the plan'),
    svgColumns: z.array(z.object({
      label: z.string().min(1).max(40).describe('The column\'s header and its report-level measure\'s name; not the name of a measure of the model'),
      design: z.record(z.any()).describe('The design, in the SVG KPI Designer\'s format: { w, h, bg?, values: [{ id, label, kind: "measure", measure: "Table[Measure]" } | { id, label, kind: "column", column: "Table[Column]" } | { id, label, kind: "ratio" | "diff" | "pct", a, b }], layers: [{ type: "rect" | "circle" | "line" | "text" | "ring" | "arrow" | "spark", ...its sizes and colours (#rrggbb, or a theme colour: "theme:accent", text, muted, track, card, good, bad, neutral, data1 to data8; left out: the theme\'s), bind?: { w | x | fill | text | p | dir | show | ...: { v: <value id>, ... } } }] }. For a text bound to a column use bind.text { v, fmt: "text" }. No raw SVG and no script: only these layers'),
      page: z.number().int().min(1).optional().describe('The page (1 = the first) whose table gets the column; left out: the first page that has a table')
    }).strict()).max(4).optional().describe('EXPERIMENTAL. Small pictures drawn per row of a table (a progress bar, a ring, an arrow, a sparkline, a label), from a declarative design: each a report-level measure (the model is never touched), shown as the table\'s last column. Show the columns in the plan'),
    svgCards: z.array(z.object({
      card: z.number().int().min(1).max(6).describe('Which KPI card (1 = the first) gets the picture, on every page'),
      label: z.string().min(1).max(40).describe('The report-level measure\'s name; not the name of a measure of the model'),
      design: z.record(z.any()).describe('The design, in the same format as svgColumns')
    }).strict()).max(6).optional().describe('EXPERIMENTAL. A small picture beside a KPI card\'s number (a ring, an arrow, a sparkline), from a design in the svgColumns format; the model is never touched'),
    gallery: z.union([z.boolean(), z.array(z.enum(GALLERY_KINDS)).min(1).max(3)]).optional().describe('Power BI\'s waterfall, combo (line and clustered column) and small multiples, only when the user asks for one: true, every kind whose fields fit, or a list of kinds (hand-placed pages name the kind in a slot instead). Each is written only where its fields fit (combo: two measures in ONE unit over a time or ordered axis, never a second axis; waterfall: one measure that adds up over 2-12 known members, such as months; smallMultiples: one measure by a category, a panel per member of a second, small category), else as the slot\'s own kind; the plan\'s gallery says each with why'),
    // (0.3.0 J19, B-172) the person's own answers on which measures may share one chart axis
    sharedAxes: z.array(z.object({ measures: z.array(z.string().max(300)).length(2).describe('Two measures as Table[Measure], exactly as read_model lists them'), answer: z.enum(['comparable', 'separate']) }).strict()).max(20).optional()
      .describe('Only the user\'s own answer to a sharedAxes question of the plan: two measures in the same unit share one chart axis only when the user says they compare ("comparable"); "separate" keeps them in separate visuals. Never answer for the user. Measures in different units are always separate visuals: never a secondary axis, no currency converted'),
    chartColors: z.enum(['gradient', 'solid']).optional().describe('The bars of bar and column charts: "gradient" (each bar fades by its value, from a light tint to the theme\'s first data colour) or "solid". Left out: "gradient" with a design, "solid" with hand-placed pages'),
    // (0.3.1 FX5b, the owner's D-1028-06: three bars on a plain text column drawn wide) the model's own counts
    columnStats: columnStatsShape().optional().describe('Counts only, never values (suggest_fields\' columnStats, the same shape: distinct { "Table[Column]": Cardinality from COLUMNSTATISTICS(); never pass its Min or Max }, rows { "Table": its row count }): a bar or column chart on a column of few values then draws its bars at a fitting thickness (barThickness)'),
    chartAxes: z.enum(['mirrored', 'standard']).optional().describe('Only for a right-to-left report. "mirrored" (the default there): the value axis at the right, categories and dates from the right, bars growing from the right. "standard": the charts stay left to right'),
    waterfallRtl: WATERFALL_RTL_INPUT(),
    text: z.string().min(1).max(400).optional().describe('The sentence for the design\'s text box, from the approved plan: what the main chart shows and what to do about it, in the report\'s language. Without it the box is left out: a placeholder is never written'),
    kpiValues: z.enum(['auto', 'full']).optional().describe('How every KPI card shows its number. "auto" (the default): automatic units with 2 decimals (3.43M, 14.81K). "full": the full number with thousand separators (101,914), smaller on narrow cards so it is never cut'),
    logo: z.string().optional().describe('Logo image for the header: a PNG or JPG file inside the DataArcus folder, 2 MB at most; copied into the new report and shown at its own shape'),
    subtitles: z.record(z.string(), z.string().max(120)).optional().describe('Subtitles under chart titles, from the approved plan only, never made up: { "<the slot\'s role as plan_layout names it, or a hand-placed slot\'s title>": "<text>" }'),
    // (0.3.0 L2: the polish lab's look options, 12-13 Oct, Desktop 2.158)
    slicerStyle: z.enum(['dropdown', 'pills']).optional().describe('(Default "dropdown".) "pills": Power BI\'s button slicer, only for a field whose 2-6 values the model\'s metadata makes known (true/false, a quarter); every other slicer stays a dropdown. For a short choice the user flips often'),
    grid: z.enum(['solid', 'dotted', 'none']).optional().describe('(Default "solid".) The value-axis gridlines: "solid", "dotted" (calmer behind dense bars) or "none" (for charts with data labels)'),
    // (0.3.0 L4: the flip-card labs of 10 Oct, Desktop 2.158)
    flipCards: z.union([z.boolean(), z.array(z.number().int().min(1).max(6)).min(1).max(6)]).optional().describe('(Default false: off.) KPI cards that turn over to a one-line description when clicked: true for every KPI card, or a list of 1-6 card numbers in reading order. Their pictures are measures the model does not have yet: a TMDL script the user applies in TMDL view first (the model is never changed by DataArcus)'),
    // (0.3.1 X2) one report holding both languages, built in the same plan by the EN-AR copy's engine (create_arabic_twin into "same")
    languages: z.enum(['en+ar']).optional().describe('(Default off: one language.) Only when the user asks for ONE report in English and Arabic: "en+ar" writes the English pages and, after them, each page\'s Arabic page (mirrored, as create_arabic_twin into "same" makes them), with a language button on every page («العربية» / "English"). Plan it in English (lang "en"): the plan drafts the Arabic of every text and field (bilingual), written only as the user approves it (arabicTexts, arabicTerms)'),
    tabsShown: z.enum(['en', 'ar']).optional().describe('With languages "en+ar": the language whose pages show in the tabs, "en" (the default) or "ar"; the other\'s are reached by the language button'),
    arabicTexts: z.record(z.string().max(200), z.string().max(200)).optional().describe('With languages "en+ar": the Arabic the user approved for each text, by the English text exactly as bilingual.texts lists it ({ "Executive summary": "ملخص تنفيذي" }); a text without one stays English'),
    arabicTerms: z.record(z.string().max(300), z.string().max(200)).optional().describe('With languages "en+ar": the Arabic name the user approved for each field, as Table[Field] (bilingual.terminology); the English name given back keeps the field in English'),
    // (0.3.3 RX1, the owner's D-1112-04) the plan's views as bookmarks, in the plan's order: each opens its page and holds
    // no data state and no display state (assets/js/pbip-export.js bookmarkFiles); the text is short on purpose (tools/list's cap)
    bookmarks: z.array(z.object({ name: z.string().min(1).max(60), page: z.number().int().min(1).default(1) }).strict()).min(1).max(8).optional().describe('Only when asked: views in presenting order, each a bookmark that opens its page (1 = the first), first in the Bookmarks pane. No filter or slicer state'),
    // (0.3.0 L5: the theme-icons lab of 10 Oct, Desktop 2.158)
    statusIcons: z.union([z.boolean(), z.array(z.object({ measure: z.string().max(300), good: z.string().max(40).optional(), bad: z.string().max(40).optional() }).strict()).min(1).max(ICONS_MAX)]).optional().describe('(Default false: off.) Status icons (three shapes, never colour alone) before a table\'s or matrix\'s measure. true: every rate or ratio that has a target measure the model names ("<name> Target", "Goal" or "Budget"). Or a list of 1-8 { measure: "Table[Measure]", good, bad }: the USER\'s own thresholds (">= 0.97", "< 0.94"), never guessed; an entry without thresholds needs a target the model names. With a target, the status measure is a TMDL script the user applies in TMDL view first'),
    // (0.3.1 L6, the DAX functions lab of 10 Oct; Microsoft Learn read 25 Oct: generally available since June 2026, level 1702)
    daxFunctions: z.union([z.boolean(), z.array(z.enum(DAX_USES)).min(1).max(DAX_USES.length)]).optional().describe('(Default false: off.) Only when the user asks for it: the DataArcus DAX function library and the measures that call it, as ONE TMDL script that the user applies in TMDL view (the model is never changed by DataArcus). Say FIRST, in the user\'s language: applying it raises the model\'s compatibility level to 1702, which cannot be undone. true uses all four where they fit, or a list of "sparkline" (a 12-month trend column in the table, only with a related date table), "bulletBar" (a bar against a target the model names), "kpiCards" (the KPI cards as pictures; not with flipCards), "storyTitles" (a chart title that names its leader)'),
    smoothLines: z.boolean().optional().describe('(Default true.) Line charts, and the line of a combo, drawn as smooth curves that never swing past the data, with a dot on each point. false: straight lines without dots, for a jagged series where every swing matters (daily stock, a sensor)'),
    // (L3, the lab of 10 Oct: a field parameter switches charts between measures, each in its own format)
    metricSwitcher: z.array(z.string().max(300)).min(SWITCH_MIN).max(SWITCH_MAX).optional().describe('(Default off.) Only when the user asks for it: 2 to 5 of the model\'s measures, as Table[Measure] exactly as read_model lists them, that one slicer switches between, on a page of its own ("Metric", Arabic «المؤشر»). The model is never changed: the field parameter is a TMDL script the user applies in TMDL view; until then only that page shows Power BI\'s error'),
    noDataMessage: z.boolean().optional().describe('(Default true.) Charts and tables show "No data for this selection" (Arabic: لا توجد بيانات لهذا الاختيار) when their measure is blank for the current filters; a KPI card wide enough for it says "No data" (لا توجد بيانات). The model is not touched. false leaves all of it out'),
    rtl: z.boolean().optional().describe('Hand-placed pages only: right to left (Arabic: the default with lang "ar"; false keeps them left to right)'), font: z.string().optional().describe('The font (default Segoe UI)'),
    colors: strictObject('colors', { text: z.string(), card: z.string(), background: z.string(), accent: z.string() }).partial().optional(),
    // (0.2.9, custom visuals, step C: lib/native-copy.mjs)
    customVisualsFrom: z.string().max(400).optional().describe('An existing PBIR report (its .pbip or .Report folder) whose custom visuals are replaced by native Power BI visuals in a NEW report "<name> native" next to it (the original is only read); the plan lists each replacement and what it loses'),
    // (0.3.1 NC2) where the plan offers a closer native first (a bullet, a calendar heatmap), the user's choice of the second
    customVisualsSecond: z.array(z.string().max(40)).max(50).optional().describe('With customVisualsFrom, only the user\'s own choice: the keys ("page:x,y", as the plan\'s replacements[].second.pick gives them) of the replacements to write as their second option'),
    // (0.3, J13 redesign step 2: lib/redesign.mjs, copy-and-patch)
    redesignFrom: z.string().max(400).optional().describe('An existing PBIR report (its .pbip or .Report folder) on this model, redesigned as a NEW report "<name> redesigned" next to it (the original is only read): a lossless copy with only the allowlisted changes: the top-level native visuals placed on the grid, the titles in titles, the theme\'s colours in restyle. With path: redesign lists every change and every visual not changed with why: show it all before the go'),
    // (0.3.1 CS1) one text set for a hand-made report: lib/text-format.mjs, lib/redesign.mjs
    consistentText: z.enum(['report', 'theme']).optional().describe('(Default off.) With redesignFrom: one text set for the whole report: the native visuals the redesign lists lose their own font family, size, bold and italic, so the theme governs. "report": the theme takes the font and size most visuals already show (the report keeps its look); "theme": the theme\'s own. The plan lists every removed setting'),
    keepPositions: z.boolean().optional().describe('(Default false.) With redesignFrom: every visual keeps its place and size (no grid); only the other changes asked are made'),
    titles: z.record(z.string().max(200), z.string().max(200)).optional().describe('With redesignFrom: new static titles the user approved, { "<page id>/<visual name>": "<title>" } as redesign.pages lists them; only a top-level visual\'s own static title is changed'),
    // (0.3.1 C) the sample project: a plan of its own kind (sample), written by create_report with the same inputs
    sample: z.boolean().optional().describe('No model yet (a new user: "show me what DataArcus can do", "try the sample"): true (with lang, the user\'s language, and no model input) plans a made-up Gulf retail project to try DataArcus on. After approval create_report writes it with path (the plan\'s sample.folder) and planId; its answer has the tour of next requests'),
    restyle: z.object({ preset: z.string().max(40), brand: z.string().max(20), harmony: z.string().max(20), mode: z.enum(['light', 'dark']) }).partial().strict().optional().describe('With redesignFrom: new theme colours (a preset, or a brand colour with a harmony; light or dark); only the colour tokens of the original\'s custom theme change'),
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
  planId: planIdInput.describe('The approved plan id (plan_layout, then approve_plan after the user\'s go). It holds every other input; without it nothing is written')
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
