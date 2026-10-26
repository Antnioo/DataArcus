// 0.3.1 BD1 (the owner's laptop run, 26 Oct, Power BI Desktop 2.159.883.0: a title «U+200F U+2068 Total Sales U+2069:
// التفاصيل» read in order; a text box with no marks and a Latin run in the MIDDLE drew its two Arabic phrases swapped; a
// text box with DataArcus's marks, and an RLI...PDI or RLE...PDF wrap of the whole text, were not measured): one project
// for the laptop to open in Power BI Desktop and screenshot page by page, so the next rule is measured, never guessed.
// A made-up model of its own, written here (orders by department and month; no employer or client data); typed Power
// Query rows (the night of 6-7 Oct fact: untyped rows load as text).
// Every page tests one kind of text Power BI draws; on it, the same Arabic text with a Latin run ("Department") at the
// start, in the middle and at the end (rows), in five variants (columns):
//   V0  no marks
//   V1  DataArcus's current rule (text-measure.js isolateLatin: each Latin run in U+2068 ... U+2069, U+200F beside a run
//       at either end)
//   V2  V1 plus U+200F at the text start (the same as V1 when the run starts the text: V1 already opens with it)
//   V3  V1 wrapped whole in U+2067 ... U+2069 (RLI ... PDI)
//   V4  V1 wrapped whole in U+202B ... U+202C (RLE ... PDF)
// Each tested box has its label ("V2 middle") in plain ASCII in a text box of its own above it, never inside the tested text.
// Pages (ids, for screenshots by name): p1textbox, p2title, p3cardlabel, p3cardcallout, p4button, p5tableheader,
// p6slicerheader (a 5 x 3 grid each); p7tooltips (a card per tooltip page, each bound to it); then 15 tooltip pages
// p7tipV0start ... p7tipV4end and 15 pages p8nameV0start ... p8nameV4end, whose own names are the tested texts (judged on
// the page tab while that page is open). Microsoft's validator runs on the project; its error count is printed (0 expected).
//   node lab/bidi-lab.mjs <empty folder>          (from mcp/; prints the key and the .pbip to open)
//   node lab/bidi-lab.mjs --key                   prints the key only (mcp/lab/BIDI-LAB.md's table)
//   node lab/bidi-lab.mjs --pages                 prints the 38 page ids, one per line (the screenshot loop)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const TM = require('../../assets/js/text-measure.js');
const S = 'https://developer.microsoft.com/json-schemas/fabric/';
const SCHEMA = {
  pbip: S + 'pbip/pbipProperties/1.0.0/schema.json', pbir: S + 'item/report/definitionProperties/2.0.0/schema.json',
  platform: S + 'gitIntegration/platformProperties/2.0.0/schema.json', version: S + 'item/report/definition/versionMetadata/1.0.0/schema.json',
  report: S + 'item/report/definition/report/2.1.0/schema.json', pages: S + 'item/report/definition/pagesMetadata/1.0.0/schema.json',
  page: S + 'item/report/definition/page/2.0.0/schema.json', visual: S + 'item/report/definition/visualContainer/2.1.0/schema.json'
};
const L = (v) => ({ expr: { Literal: { Value: v } } });
const str = (s) => L("'" + String(s).replace(/'/g, "''") + "'");
const bool = (b) => L(b ? 'true' : 'false');
const obj = (props) => [{ properties: props }];

// ---------- the tested texts and the variants ----------
export const TEXTS = { start: 'Department: عدد الأوامر في كل شهر', middle: 'عدد الأوامر حسب Department في كل شهر', end: 'عدد الأوامر في كل شهر حسب Department' };
export const POSITIONS = ['start', 'middle', 'end'];
const RLM = '‏', RLI = '⁧', PDI = '⁩', RLE = '‫', PDF = '‬';
const v1 = (t) => TM.isolateLatin(t);
export const VARIANTS = [
  ['V0', 'no marks', (t) => t],
  ['V1', 'DataArcus\'s current rule (isolateLatin)', v1],
  ['V2', 'V1 plus U+200F at the text start', (t) => (v1(t).startsWith(RLM) ? v1(t) : RLM + v1(t))],
  ['V3', 'V1 wrapped in U+2067 ... U+2069 (RLI ... PDI)', (t) => RLI + v1(t) + PDI],
  ['V4', 'V1 wrapped in U+202B ... U+202C (RLE ... PDF)', (t) => RLE + v1(t) + PDF]];
export const variantText = (id, pos) => VARIANTS.find((v) => v[0] === id)[2](TEXTS[pos]);
const CELLS = POSITIONS.flatMap((pos) => VARIANTS.map(([id]) => ({ id, pos, text: variantText(id, pos), key: id + pos })));
const MARK_NAMES = { '\u200F': 'RLM', '\u2068': 'FSI', '\u2069': 'PDI', '\u2067': 'RLI', '\u202B': 'RLE', '\u202C': 'PDF' };
/** A text with its marks named ([RLM] [FSI] ...), the rest as it is. */
export const marked = (s) => Array.from(String(s)).map((c) => (MARK_NAMES[c] ? `[${MARK_NAMES[c]}]` : c)).join('');

// ---------- the made-up model ----------
const T = 'Orders', DEPTS = ['Finance', 'Operations', 'Sales', 'Support'];
const COLS = [['Department', 'text', 'string'], ['Month Start', 'datetime', 'dateTime'], ['Orders', 'Int64.Type', 'int64']];
const q2 = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const ROWS = DEPTS.flatMap((d, i) => Array.from({ length: 6 }, (_, m) => [q2(d), `#datetime(2026, ${m + 5}, 1, 0, 0, 0)`, 20 + ((i * 7 + m * 5) % 13)]));
const M = `let Source = #table(type table [${COLS.map(([n, t]) => '#"' + n + '" = ' + t).join(', ')}], {${ROWS.map((r) => '{' + r.join(', ') + '}').join(', ')}}) in Source`;
const daxText = (s) => '"' + String(s).replace(/"/g, '""') + '"';
function model() {
  return { compatibilityLevel: 1567, model: { culture: 'en-US', defaultPowerBIDataSourceVersion: 'powerBI_V3', tables: [{ name: T, partitions: [{ name: T, mode: 'import', source: { type: 'm', expression: M } }],
    columns: COLS.map(([n, , dt]) => Object.assign({ name: n, dataType: dt, sourceColumn: n }, n === 'Orders' ? { summarizeBy: 'sum' } : {})),
    // one text measure per cell for the card callouts: the tested text is the measure's value
    measures: [{ name: 'Order Count', expression: `SUM ( '${T}'[Orders] )`, formatString: '#,0' }].concat(CELLS.map((c) => ({ name: `Callout ${c.id} ${c.pos}`, expression: daxText(c.text) }))) }] } };
}

// ---------- the visuals ----------
const col = (c, display) => Object.assign({ field: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, queryRef: `${T}.${c}`, nativeQueryRef: c }, display != null ? { displayName: display } : {});
const mea = (m, display) => Object.assign({ field: { Measure: { Expression: { SourceRef: { Entity: T } }, Property: m } }, queryRef: `${T}.${m}`, nativeQueryRef: m }, display != null ? { displayName: display } : {});
const q = (role, ps) => ({ queryState: { [role]: { projections: ps } } });
const textbox = (text, align, size) => ({ visualType: 'textbox', objects: { general: obj({ paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: 'Segoe UI', fontSize: (size || 14) + 'pt' } }], horizontalTextAlignment: align }] }) } });
const noTitle = () => ({ title: obj({ show: bool(false) }) });
const card = (p, o) => ({ visualType: 'card', query: q('Values', [p]), objects: Object.assign({ labels: obj({ fontSize: L('14D') }) }, o || {}), visualContainerObjects: noTitle() });
export const KINDS = [
  { id: 'textbox', page: 'p1textbox', name: '1 Text box', what: 'a text box, its paragraph aligned right', make: (t) => textbox(t, 'right') },
  { id: 'title', page: 'p2title', name: '2 Visual title', what: 'a card\'s visual title, aligned right (as DataArcus writes Arabic titles)',
    make: (t) => Object.assign(card(mea('Order Count')), { visualContainerObjects: { title: obj({ show: bool(true), text: str(t), alignment: str('right'), titleWrap: bool(true) }) } }) },
  { id: 'cardlabel', page: 'p3cardlabel', name: '3a Card label', what: 'a card\'s category label (the measure\'s display name for the visual)', make: (t) => card(mea('Order Count', t), { categoryLabels: obj({ show: bool(true) }) }) },
  { id: 'cardcallout', page: 'p3cardcallout', name: '3b Card callout', what: 'a card\'s callout value (a text measure that returns the tested text)', make: (t, c) => card(mea(`Callout ${c.id} ${c.pos}`), { categoryLabels: obj({ show: bool(false) }) }) },
  { id: 'button', page: 'p4button', name: '4 Button text', what: 'a blank button\'s text',
    make: (t) => ({ visualType: 'actionButton', objects: { icon: [{ properties: { shapeType: str('blank') }, selector: { id: 'default' } }], text: [{ properties: { show: bool(true), text: str(t), fontSize: L('12D') }, selector: { id: 'default' } }] }, visualContainerObjects: noTitle() }) },
  { id: 'tableheader', page: 'p5tableheader', name: '5 Table header', what: 'a table\'s column header (the measure\'s display name)', make: (t) => ({ visualType: 'tableEx', query: q('Values', [mea('Order Count', t)]), visualContainerObjects: noTitle() }) },
  { id: 'slicerheader', page: 'p6slicerheader', name: '6 Slicer header', what: 'a list slicer\'s header (the column\'s display name)', make: (t) => ({ visualType: 'slicer', query: q('Values', [col('Department', t)]), objects: { header: obj({ show: bool(true) }) }, visualContainerObjects: noTitle() }) },
  { id: 'tooltippage', pagePrefix: 'p7tip', name: '7 Tooltip page name', what: 'a tooltip page\'s name (its page tab, judged while it is open)' },
  { id: 'pagename', pagePrefix: 'p8name', name: '8 Page name', what: 'a page\'s name (its page tab, judged while it is open)' }];

/** The page ids in the report's order (for a screenshot loop: node lab/bidi-lab.mjs --pages). */
export const PAGE_IDS = KINDS.filter((k) => k.page).map((k) => k.page).concat(['p7tooltips'], CELLS.map((c) => 'p7tip' + c.key), CELLS.map((c) => 'p8name' + c.key));
/** The key: one row per tested text (the page to screenshot, the kind, the variant, the position, the text's code points). */
export function keyRows() {
  return KINDS.flatMap((k) => CELLS.map((c) => ({ page: k.page || k.pagePrefix + c.key, kind: k.id, variant: c.id, position: c.pos, text: c.text })));
}
export function keyTable() {
  return ['| Page | Kind | Variant | Position | The tested text (marks named) |', '|---|---|---|---|---|'].concat(keyRows().map((r) => `| ${r.page} | ${r.kind} | ${r.variant} | ${r.position} | ${marked(r.text)} |`)).join('\n');
}

export function writeLab(out) {
  const ROOT = path.resolve(out), P = 'Bidi Lab', R = P + '.Report', DEF = R + '/definition', SM = 'Lab.SemanticModel';
  if (fs.existsSync(ROOT) && fs.readdirSync(ROOT).length) throw new Error('give an empty folder: ' + ROOT);
  const put = (rel, o) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof o === 'string' ? o : JSON.stringify(o, null, 2) + '\n'); };
  put(SM + '/definition.pbism', { version: '1.0' });
  put(SM + '/model.bim', model());
  put(P + '.pbip', { $schema: SCHEMA.pbip, version: '1.0', artifacts: [{ report: { path: R } }], settings: { enableAutoRecovery: true } });
  put(R + '/definition.pbir', { $schema: SCHEMA.pbir, version: '4.0', datasetReference: { byPath: { path: '../' + SM } } });
  put(R + '/.platform', { $schema: SCHEMA.platform, metadata: { type: 'Report', displayName: P }, config: { version: '2.0', logicalId: '7d2b9e41-5c3a-4f86-b1e7-2a9c4d6e8f03' } });
  put(DEF + '/version.json', { $schema: SCHEMA.version, version: '2.0.0' });
  put(DEF + '/report.json', { $schema: SCHEMA.report, themeCollection: {}, settings: { useStylableVisualContainerHeader: true, defaultDrillFilterOtherVisuals: true, useDefaultAggregateDisplayName: true } });
  const order = [], written = [];
  const page = (id, displayName, extra, visuals) => {
    order.push(id);
    put(`${DEF}/pages/${id}/page.json`, Object.assign({ $schema: SCHEMA.page, name: id, displayName, displayOption: 'FitToPage', width: 1280, height: 720 }, extra || {}));
    visuals.forEach((v, i) => put(`${DEF}/pages/${id}/visuals/${v.name}/visual.json`, { $schema: SCHEMA.visual, name: v.name, position: { x: v.x, y: v.y, z: (i + 1) * 1000, height: v.h, width: v.w, tabOrder: (i + 1) * 1000 }, visual: v.visual }));
  };
  const label = (name, x, y, w, text) => ({ name, x, y, w, h: 34, visual: textbox(text, 'left', 10) });   // plain ASCII, outside the tested text
  // the grids: a heading, then per cell its ASCII label and the tested visual (columns V0-V4 left to right, rows start/middle/end)
  const gap = 16, cw = Math.floor((1280 - gap * 6) / 5), top = 56, rh = Math.floor((720 - top - gap * 3) / 3);
  KINDS.filter((k) => k.page).forEach((k) => {
    const vs = [label('heading', gap, 12, 1280 - 2 * gap, `${k.name}: ${k.what}. Columns V0-V4, rows start / middle / end. Each label is outside the tested text.`)];
    CELLS.forEach((c, i) => {
      const x = gap + (i % 5) * (cw + gap), y = top + Math.floor(i / 5) * (rh + gap);
      vs.push(label('lbl' + c.key, x, y, cw, `${c.id} ${c.pos}`));
      vs.push({ name: 'test' + c.key, x, y: y + 36, w: cw, h: rh - 36, visual: k.make(c.text, c) });
      written.push({ page: k.page, kind: k.id, variant: c.id, position: c.pos, text: c.text });
    });
    page(k.page, k.name, null, vs);
  });
  // the tooltip pages, and one page that binds a card to each (hover it to see the tooltip; the tab is what is judged)
  const tip = KINDS.find((k) => k.id === 'tooltippage'), named = KINDS.find((k) => k.id === 'pagename');
  page('p7tooltips', '7 Tooltips', null, [label('heading', gap, 12, 1280 - 2 * gap, '7 Tooltips: each card shows its tooltip page on hover; the tooltip pages p7tipV0start ... p7tipV4end are named with the tested texts.')]
    .concat(CELLS.flatMap((c, i) => { const x = gap + (i % 5) * (cw + gap), y = top + Math.floor(i / 5) * (rh + gap);
      return [label('lbl' + c.key, x, y, cw, `${c.id} ${c.pos}`), { name: 'tipcard' + c.key, x, y: y + 36, w: cw, h: rh - 36,
        visual: Object.assign(card(mea('Order Count')), { visualContainerObjects: { title: obj({ show: bool(false) }), visualTooltip: obj({ show: bool(true), type: str('Canvas'), section: str(tip.pagePrefix + c.key) }) } }) }]; })));
  CELLS.forEach((c) => {
    const id = tip.pagePrefix + c.key;
    page(id, c.text, { width: 320, height: 240, type: 'Tooltip', pageBinding: { name: id, type: 'Tooltip' } }, [label('lbl', 10, 10, 300, `7 Tooltip page name: ${c.id} ${c.pos}`), { name: 'tipvalue', x: 10, y: 50, w: 300, h: 180, visual: card(mea('Order Count')) }]);
    written.push({ page: id, kind: tip.id, variant: c.id, position: c.pos, text: c.text });
  });
  CELLS.forEach((c) => {
    const id = named.pagePrefix + c.key;
    page(id, c.text, null, [label('lbl', gap, 12, 1280 - 2 * gap, `8 Page name: ${c.id} ${c.pos}. The tested text is this page's own name, on its tab.`)]);
    written.push({ page: id, kind: named.id, variant: c.id, position: c.pos, text: c.text });
  });
  put(DEF + '/pages/pages.json', { $schema: SCHEMA.pages, pageOrder: order, activePageName: order[0] });
  // Microsoft's validator (the version mcp/package.json pins), offline
  const cli = path.join(HERE, '../node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');
  const r = spawnSync(process.execPath, [cli, 'validate', path.join(ROOT, R)], { encoding: 'utf8' });
  const text = (r.stdout || '') + (r.stderr || '');
  return { pbip: path.join(ROOT, P + '.pbip'), report: path.join(ROOT, R), pages: order, tested: written, validator: { exit: r.status, text: text.trim().slice(0, 4000) } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--key') { console.log(keyTable()); process.exit(0); }
  if (process.argv[2] === '--pages') { console.log(PAGE_IDS.join('\n')); process.exit(0); }
  if (!process.argv[2]) { console.error('node lab/bidi-lab.mjs <empty folder>'); process.exit(2); }
  const r = writeLab(process.argv[2]);
  console.log(keyTable());
  console.log(`\nwrote ${r.pages.length} pages, ${r.tested.length} tested texts: ${r.pbip}\nvalidator (exit ${r.validator.exit}):\n${r.validator.text}`);
  process.exit(r.validator.exit === 0 ? 0 : 1);
}
