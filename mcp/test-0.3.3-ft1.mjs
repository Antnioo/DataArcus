import './test-env.mjs';
// 0.3.3 FT1 (B-430; the owner's 0.3.2 laptop sitting, step 18: "PASS with the font noted"; mcp/work/FT1.md). A
// hand-placed report's font (create_report's "font", pinned by plan_layout) was written only on the text box, the
// slicers, the language button and the filter pane: its theme file was { "name" } alone, so a table, a card and a chart
// fell back to Desktop's default font. The theme the tools write now carries the font in its primary text classes
// (callout, title, header, label; lib/design.mjs themeFont), which the secondary classes inherit (Microsoft Learn,
// "Create custom report themes in Power BI Desktop", Set formatted text defaults).
// Through the real server (plan_layout -> approve_plan -> create_report, then create_arabic_twin), a made-up model.
//   R1-R6  the "Tahoma" report: every visual resolves to Tahoma (its own objects, else the theme's visual style, else
//          its text class, else the primary class a secondary one inherits from): the table, the card, the bar chart,
//          the slicer, the text box, every other visual
//   T1-T6  its Arabic twin: the same theme file byte for byte, the same resolution for every visual
//   S1-S2  the theme within Microsoft's report theme schema (reportThemeSchema-2.149.json: its 14 text class names and
//          the textClass properties fontFace, fontSize, fontWeight, color)
//   V1-V2  Microsoft's validator: the report and its twin have the errors of the same report without a font (L-1102-01)
//   B1-B3  the base's bytes (fixtures/ft1-pins.json, recorded on a8df06e9 with FT1_RECORD=1): no font, every file;
//          a given theme with no font, every file; the "Tahoma" report, every file but the theme (each visual keeps
//          exactly what it set)
//   G1-G2  a given theme with its own text classes and the font: sizes, colours and the weight classes kept, the font
//          in every primary class and in each secondary class the theme sets with a face of its own
//   U1-U6  themeFont alone: the default font and a font outside E.FONTS change nothing; the input is not changed; a
//          theme with no text classes; a non-object text class; a theme that is not an object
//   D1     the designed path is unchanged and already carries its font (buildTheme's same 4 classes)
// Made-up model only; temporary folders under os.tmpdir().   node test-0.3.3-ft1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { rolesOf, visualText, themeValue } from './lib/text-format.mjs';
import * as Design from './lib/design.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const PINS = path.join(HERE, 'fixtures', 'ft1-pins.json'), RECORD = process.env.FT1_RECORD === '1';
const pins = RECORD ? {} : JSON.parse(fs.readFileSync(PINS, 'utf8'));
const themeFont = Design.themeFont || ((t) => t);
const FONT = 'Tahoma';

// Microsoft's report theme schema (reportThemeSchema-2.149.json, the version lib/text-format.mjs cites): textClasses
const SCHEMA_CLASSES = ['title', 'label', 'callout', 'header', 'largeTitle', 'dataTitle', 'boldLabel', 'largeLabel', 'largeLightLabel', 'lightLabel', 'semiboldLabel', 'smallLabel', 'smallLightLabel', 'smallDataLabel'];
const TEXT_CLASS_KEYS = ['fontFace', 'fontSize', 'fontWeight', 'color'];
const PRIMARY = ['callout', 'title', 'header', 'label'];
// a secondary class inherits from its primary one (Microsoft Learn's table)
const PRIMARY_OF = { largeTitle: 'title', dataTitle: 'title', semiboldLabel: 'label', largeLabel: 'label', smallLabel: 'label', lightLabel: 'label', boldLabel: 'label', largeLightLabel: 'label', smallLightLabel: 'label', smallDataLabel: 'label' };

// ---- the made-up project ----
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-ft1-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const model = (dir) => { fs.mkdirSync(path.join(ROOT, dir, 'Shop.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, dir, 'Shop.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'),
    columns: [col('Amount', 'double'), col('Region', 'string'), col('Product', 'string')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' }] }] } })); };
const PAGES = [{ name: 'Hand', width: 1280, height: 720, slots: [{ kind: 'kpi', x: 24, y: 20, w: 300, h: 120 }, { kind: 'text', x: 340, y: 20, w: 600, h: 120, text: 'Sales overview' },
  { kind: 'slicer', x: 960, y: 20, w: 296, h: 120 }, { kind: 'bar', x: 24, y: 160, w: 600, h: 300 }, { kind: 'table', x: 640, y: 160, w: 616, h: 300 }] }];
// a given theme with text classes of its own (made up): sizes, colours, a weight class and a secondary face
const GIVEN = { name: 'Given', textClasses: { callout: { fontSize: 30, color: '#112233' }, label: { fontFace: 'Segoe UI', fontSize: 11, color: '#445566' },
  boldLabel: { fontFace: 'Segoe UI Bold' }, largeTitle: { fontFace: 'Arial', fontSize: 15 }, title: { fontSize: 13 } } };
['nofont', 'given', 'font', 'givenfont', 'design'].forEach(model);
fs.writeFileSync(path.join(ROOT, 'given', 'theme.json'), JSON.stringify(GIVEN));
fs.writeFileSync(path.join(ROOT, 'givenfont', 'theme.json'), JSON.stringify(GIVEN));

const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rel = (d, f) => path.relative(d, f).split(path.sep).join('/');
const isTheme = (r) => /StaticResources\/RegisteredResources\/[^/]+\.json$/.test(r);
const filesOf = (d) => Object.fromEntries(tree(d).map((f) => [rel(d, f), sha(fs.readFileSync(f))]).sort((a, b) => (a[0] < b[0] ? -1 : 1)));
const themeFile = (d) => tree(d).find((f) => isTheme(rel(d, f)));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
// one fixed seed for the server's random ids (sp1's fixtures/sp1/seeded-random.mjs), so the files compare byte for byte
const SEED = pathToFileURL(path.join(HERE, 'fixtures', 'sp1', 'seeded-random.mjs')).href;
const s = await serverClient(ROOT, { NODE_OPTIONS: [process.env.NODE_OPTIONS, `--import ${SEED}`].filter(Boolean).join(' ') });
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
async function write(dir, more) {
  const pl = await s.call('plan_layout', Object.assign({ path: dir, name: 'Fonted', pages: PAGES }, more));
  if (!pl.j || !pl.j.plan || !pl.j.plan.planId) return 'plan: ' + short(pl);
  await s.call('approve_plan', { planId: pl.j.plan.planId });
  const w = await s.call('create_report', { path: dir, planId: pl.j.plan.planId });
  return w.err ? 'write: ' + w.t.slice(0, 400) : null;
}
async function twin(dir) {
  const t0 = await s.call('create_arabic_twin', { path: dir + '/Fonted.Report' });
  if (t0.err || !t0.j) return 'twin texts: ' + short(t0);
  // made-up placeholders for the labels (no Arabic sentence is written by this job: the twin needs one per text)
  const labels = {}; (t0.j.texts || []).filter((t) => t.text != null).forEach((t, k) => { labels[t.id] = t.draftArabic || 'نص ' + (k + 1); });
  const p = await s.call('create_arabic_twin', { path: dir + '/Fonted.Report', labels });
  if (!p.j || !p.j.plan || !p.j.plan.planId) return 'twin plan: ' + short(p);
  await s.call('approve_plan', { planId: p.j.plan.planId });
  const w = await s.call('create_arabic_twin', { path: dir + '/Fonted.Report', labels, planId: p.j.plan.planId });
  return w.err ? 'twin write: ' + w.t.slice(0, 400) : null;
}

// a visual's text font, role by role: its own objects, else the theme (visual style, then text class), else the primary
// class the secondary one inherits from; a type whose roles are not listed: every own font literal, then each primary class
const famOf = (v) => (v == null ? null : String(v).split(',')[0].replace(/['"]/g, '').trim());
const classFont = (theme, cls) => { const tc = ((theme || {}).textClasses || {})[cls]; if (tc && typeof tc.fontFace === 'string') return famOf(tc.fontFace); return PRIMARY_OF[cls] ? classFont(theme, PRIMARY_OF[cls]) : null; };
function fontsOf(json, theme) {
  const out = [], type = ((json || {}).visual || {}).visualType, own = visualText(json).overrides.filter((o) => o.prop === 'family');
  const lits = [...JSON.stringify(json).matchAll(/"(?:fontFamily|titleFontFamily)":\{"expr":\{"Literal":\{"Value":"([^"]*)"/g)].map((m) => famOf(m[1]))
    .concat([...JSON.stringify(json).matchAll(/"fontFamily":"([^"]*)"/g)].map((m) => famOf(m[1])));
  lits.forEach((f) => out.push({ role: 'own', font: f }));
  const roles = rolesOf(type);
  if (roles.length) roles.forEach((r) => { const o = own.find((x) => x.cls === r.cls && x.object === r.object && x.at === r.at); if (o) return;
    const tv = themeValue(theme, r.cls, 'family', type, r.object, r.props); out.push({ role: `${r.cls} ${r.object}`, font: tv.value != null ? famOf(tv.value) : classFont(theme, r.cls) }); });
  else PRIMARY.forEach((c) => out.push({ role: c, font: classFont(theme, c) }));
  return { type, out };
}
const visualsOf = (d) => tree(d).filter((f) => /visual\.json$/.test(f)).map((f) => rd(f));
const notFont = (d, theme) => visualsOf(d).map((j) => fontsOf(j, theme)).map((x) => ({ type: x.type, bad: x.out.filter((r) => r.font !== FONT) })).filter((x) => x.bad.length);

let V = null; try { V = await import('@microsoft/powerbi-report-authoring-cli'); } catch (e) { V = null; }
const provider = V ? await V.getMetadataProvider() : null;
async function errorsOf(reportDir) {
  const r = await V.runReportValidation({ reportDir, defDir: path.join(reportDir, 'definition'), provider, skipSchema: true });
  return Object.entries(r.diagnostics || {}).filter(([, d]) => d.severity === 'error' && d.items && d.items.length).map(([code]) => code).sort();
}

try {
  const e1 = await write('nofont', {}), e2 = await write('given', { theme: 'given/theme.json' }), e3 = await write('font', { font: FONT }), e4 = await write('givenfont', { theme: 'givenfont/theme.json', font: FONT });
  const e5 = await twin('font'), e6 = await twin('nofont');
  const EN = path.join(ROOT, 'font/Fonted.Report'), AR = path.join(ROOT, 'font/Fonted AR.Report'), N0 = path.join(ROOT, 'nofont/Fonted.Report'), N0AR = path.join(ROOT, 'nofont/Fonted AR.Report');
  chk(() => !e1 && !e2 && !e3 && !e4 && !e5 && !e6, () => `setup. every report and twin is written: ${[e1, e2, e3, e4, e5, e6].filter(Boolean).join(' | ')}`);
  if (RECORD) {
    fs.writeFileSync(PINS, JSON.stringify({ about: 'FT1: the base\'s files (sha256 by path) for test-0.3.3-ft1.mjs, recorded with FT1_RECORD=1 on the base only', nofont: filesOf(N0), given: filesOf(path.join(ROOT, 'given/Fonted.Report')), font: filesOf(EN) }, null, 1) + '\n');
    console.log('recorded ' + PINS);
  }
  const th = rd(themeFile(EN)), thAr = rd(themeFile(AR));
  // R: every visual of the Tahoma report
  const types = visualsOf(EN).map((j) => ((j || {}).visual || {}).visualType);
  chk(() => ['tableEx', 'cardVisual', 'clusteredBarChart', 'slicer', 'textbox'].every((t) => types.includes(t)), () => `R1. the report holds a table, a card, a bar chart, a slicer and a text box: ${types.join(', ')}`);
  chk(() => PRIMARY.every((c) => classFont(th, c) === FONT), () => `R2. the theme's 4 primary text classes carry ${FONT}: ${JSON.stringify(th.textClasses || null)}`);
  const bad = notFont(EN, th);
  ['tableEx', 'cardVisual', 'clusteredBarChart'].forEach((t, i) => chk(() => types.includes(t) && !bad.some((x) => x.type === t), () => `R${3 + i}. every ${t} resolves to ${FONT} (its own objects, else the theme): ${JSON.stringify(bad.filter((x) => x.type === t)).slice(0, 600)}`));
  chk(() => !bad.length, () => `R6. every visual (slicer, text box, the button and the rest) resolves to ${FONT}: ${JSON.stringify(bad).slice(0, 800)}`);
  // T: the twin
  chk(() => fs.existsSync(AR) && sha(fs.readFileSync(themeFile(AR))) === sha(fs.readFileSync(themeFile(EN))), () => 'T1. the twin\'s theme file is the English report\'s, byte for byte');
  const badAr = notFont(AR, thAr), typesAr = visualsOf(AR).map((j) => ((j || {}).visual || {}).visualType);
  ['tableEx', 'cardVisual', 'clusteredBarChart', 'slicer'].forEach((t, i) => chk(() => typesAr.includes(t) && !badAr.some((x) => x.type === t), () => `T${2 + i}. the twin's ${t} resolves to ${FONT}: ${JSON.stringify(badAr.filter((x) => x.type === t)).slice(0, 600)}`));
  chk(() => typesAr.length >= types.length && !badAr.length, () => `T6. every visual of the twin resolves to ${FONT}: ${JSON.stringify(badAr).slice(0, 800)}`);
  // S: the schema
  const allThemes = [th, rd(themeFile(path.join(ROOT, 'givenfont/Fonted.Report')))];
  chk(() => allThemes.every((t) => Object.keys(t.textClasses || {}).every((c) => SCHEMA_CLASSES.includes(c))), () => `S1. every text class is one of the schema's 14: ${allThemes.map((t) => Object.keys(t.textClasses || {})).join(' / ')}`);
  chk(() => allThemes.every((t) => Object.values(t.textClasses || {}).every((x) => x && typeof x === 'object' && Object.keys(x).every((k) => TEXT_CLASS_KEYS.includes(k)) && (x.fontFace === undefined || typeof x.fontFace === 'string'))), () => `S2. every text class holds only the schema's textClass properties: ${JSON.stringify(allThemes.map((t) => t.textClasses))}`);
  // V: Microsoft's validator
  if (V) {
    const [a, b, c, d] = [await errorsOf(EN), await errorsOf(N0), await errorsOf(AR), await errorsOf(N0AR)];
    console.log(`  validator errors: EN ${JSON.stringify(a)} (no font ${JSON.stringify(b)}), twin ${JSON.stringify(c)} (no font ${JSON.stringify(d)})`);
    chk(() => JSON.stringify(a) === JSON.stringify(b), () => `V1. the report's validator errors equal the same report's without a font: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
    chk(() => JSON.stringify(c) === JSON.stringify(d), () => `V2. the twin's validator errors equal the no-font twin's: ${JSON.stringify(c)} vs ${JSON.stringify(d)}`);
  } else chk(() => false, () => 'V1. Microsoft\'s validator (@microsoft/powerbi-report-authoring-cli) must load');
  // B: the base's bytes
  const diff = (got, want, skip) => Object.keys(Object.assign({}, got, want)).filter((k) => !(skip && skip(k)) && got[k] !== want[k]);
  if (!RECORD) {
    chk(() => !diff(filesOf(N0), pins.nofont).length, () => `B1. no font: every file as the base's: ${diff(filesOf(N0), pins.nofont).slice(0, 6).join(', ')}`);
    chk(() => !diff(filesOf(path.join(ROOT, 'given/Fonted.Report')), pins.given).length, () => `B2. a given theme, no font: every file as the base's: ${diff(filesOf(path.join(ROOT, 'given/Fonted.Report')), pins.given).slice(0, 6).join(', ')}`);
    chk(() => !diff(filesOf(EN), pins.font, isTheme).length && diff(filesOf(EN), pins.font).length === 1, () => `B3. the ${FONT} report: every file but the theme as the base's (each visual keeps what it set), the theme changed: ${diff(filesOf(EN), pins.font).slice(0, 6).join(', ')}`);
  }
  // G: a given theme with text classes and the font
  const g = rd(themeFile(path.join(ROOT, 'givenfont/Fonted.Report'))).textClasses || {};
  chk(() => PRIMARY.every((c) => g[c] && g[c].fontFace === FONT) && g.largeTitle.fontFace === FONT, () => `G1. the font in every primary class and in the secondary class with a face of its own: ${JSON.stringify(g)}`);
  chk(() => g.callout.fontSize === 30 && g.callout.color === '#112233' && g.label.fontSize === 11 && g.label.color === '#445566' && g.title.fontSize === 13 && g.largeTitle.fontSize === 15 && g.boldLabel.fontFace === 'Segoe UI Bold' && !('fontSize' in g.header),
    () => `G2. sizes, colours and the weight class kept as the theme has them: ${JSON.stringify(g)}`);
  // U: themeFont alone
  const T0 = { name: 'X', textClasses: { label: { fontFace: 'Arial', fontSize: 9 } }, visualStyles: { '*': { '*': { title: [{ fontFamily: 'Arial' }] } } } }, T0s = JSON.stringify(T0);
  chk(() => typeof Design.themeFont === 'function', () => 'U1. lib/design.mjs exports themeFont');
  chk(() => JSON.stringify(themeFont(T0, 'Segoe UI')) === T0s && JSON.stringify(themeFont(T0, undefined)) === T0s, () => 'U2. the default font (Segoe UI) or none: the theme as it is');
  chk(() => JSON.stringify(themeFont(T0, 'Comic Sans MS')) === T0s && JSON.stringify(themeFont(T0, "Tahoma'}")) === T0s, () => 'U3. a font outside the offered list (E.FONTS): the theme as it is');
  const t1 = themeFont(T0, FONT);
  chk(() => JSON.stringify(T0) === T0s && t1 !== T0 && t1.textClasses.label.fontFace === FONT && t1.textClasses.label.fontSize === 9 && JSON.stringify(t1.visualStyles) === JSON.stringify(T0.visualStyles), () => `U4. the input is not changed; the label keeps its size; visual styles as they are: ${JSON.stringify(t1)}`);
  const t2 = themeFont({ name: 'Y', textClasses: { title: 'odd' } }, FONT), t3 = themeFont({ name: 'Z' }, FONT);
  chk(() => themeFont(null, FONT) === null && JSON.stringify(themeFont([1], FONT)) === '[1]', () => 'U6. a theme that is not an object: returned as it is');
  chk(() => t2.textClasses.title.fontFace === FONT && PRIMARY.every((c) => t3.textClasses[c].fontFace === FONT && Object.keys(t3.textClasses[c]).length === 1), () => `U5. a text class that is not an object, and a theme with none: the 4 primary classes get the font alone: ${JSON.stringify([t2, t3])}`);
  // D: the designed path
  const d1 = await s.call('plan_layout', { path: 'design', name: 'Designed', layout: 'exec', design: { font: FONT } });
  let dth = null;
  if (d1.j && d1.j.plan && d1.j.plan.planId) { await s.call('approve_plan', { planId: d1.j.plan.planId }); const w = await s.call('create_report', { path: 'design', planId: d1.j.plan.planId }); if (!w.err) dth = rd(themeFile(path.join(ROOT, 'design/Designed.Report'))); }
  chk(() => dth && PRIMARY.every((c) => dth.textClasses[c].fontFace === FONT), () => `D1. the designed report's theme carries its font in the 4 primary classes: ${dth ? JSON.stringify(dth.textClasses) : short(d1)}`);
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL script=mcp/test-0.3.3-ft1.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 1200))); console.log(`FAIL  ft1  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  ft1  ${checks} checks`);
