// 0.3.1 L6: the DataArcus DAX function library, the Desktop lab of 10 Oct 2026 (Desktop 2.158.1304.0, a copy of a
// public-data project at compatibility level 1702): four DAX user-defined functions (DA.Sparkline, DA.BulletBar,
// DA.KpiCard, DA.StoryTitle) and the measures that call them, in ONE TMDL script next to the project ("<report> - DAX
// functions.tmdl"), applied by the user in TMDL view. DataArcus never changes the model (model-script.mjs, as L3-L5).
// FIRST, everywhere it is said (the plan, the approval page, the script's own header): applying the script raises the
// model's compatibility level to 1702 (DAX user-defined functions need it), and that cannot be undone.
// The lab's open points, fixed here: a blank item of a sparkline is left out inside the function (VALUE("") failed);
// the sparkline's size and the delta's period are parameters; the colours come from the theme (rgb(), never a bare #);
// the Arabic card is right to left and the Arabic title isolates the leader, the value and the noun (U+2068 / U+2069).
// Text that reaches a picture is escaped INSIDE the function (% # & < >): model names are untrusted input. Numbers in the
// pictures are FORMAT(x, "0.0", "en-US") (comma-decimal Windows); the points the measures pass are whole numbers, so no
// decimal separator is ever parsed. No value is read by the MCP: the DAX computes them in Desktop.
// (0.3.1 wave 4, the port of draft #82 onto today's code) Microsoft Learn, read 25 Oct 2026: DAX user-defined functions
// need compatibility level 1702 or higher and are generally available in Power BI Desktop and the service since the June
// 2026 release (learn.microsoft.com/dax/best-practices/dax-user-defined-functions); upgrading the compatibility level is
// irreversible (learn.microsoft.com/analysis-services/tabular-models/compatibility-level-for-tabular-models-in-analysis-services).
// An Arabic report says the compatibility step in Arabic first (the page, the script's header), then in English.
import { createRequire } from 'node:module';
import { modelOf, shownName } from './model.mjs';
import { freeNamer, tagOf, scriptFileOf, functionLines, compatOf, COMPAT_UDF } from './model-script.mjs';
import { calendarFor, frontValue, UNITS_AR } from './flip-cards.mjs';
import { targetOf } from './status-icons.mjs';
import { besideSaid } from './plain-words.mjs';   // (0.3.1 R4A, T-9: the folder by its name and where it is)

const require = createRequire(import.meta.url);
const Fix = require('../../assets/js/model-health-tmdl.js'), Pbip = require('../../assets/js/pbip-export.js'), E = require('../../assets/js/design-engine.js');
const dax = Pbip.daxNames;

export const FOLDER = 'DataArcus DAX functions';
export const SCRIPT_SUFFIX = ' - DAX functions';
export const USES = ['sparkline', 'bulletBar', 'kpiCards', 'storyTitles'];
export const SUFFIX = { sparkline: ' (sparkline)', bulletBar: ' (bullet bar)', kpiCards: ' (KPI card)', storyTitles: ' (story title)' };
/** The names the library gives its measures (a free name may add " 2"): check_report's note and the twin's list. */
export const DAX_MEASURE = / \((sparkline|bullet bar|KPI card|story title)\)( \d+)?$/;
export const SPARK = { width: 120, height: 30, months: 12, scale: 10000 };
const S = 'https://developer.microsoft.com/json-schemas/fabric/';
const SCHEMA_VISUAL = S + 'item/report/definition/visualContainer/2.1.0/schema.json';

// ---------- the library: four functions, the lab's signatures with the open points fixed ----------
// (the escape of text for a picture: % first, then #, then & < >; a DAX expression of a text parameter)
const esc = (v) => `SUBSTITUTE ( SUBSTITUTE ( SUBSTITUTE ( SUBSTITUTE ( SUBSTITUTE ( ${v}, "%", "%25" ), "#", "%23" ), "&", "&amp;" ), "<", "&lt;" ), ">", "&gt;" )`;
// (a colour parameter: never a quote or a tag, and # as %23, so rgb(...) and #hex both stay inside the data URI)
const col = (v) => `SUBSTITUTE ( SUBSTITUTE ( SUBSTITUTE ( SUBSTITUTE ( ${v}, "'", "" ), "<", "" ), ">", "" ), "#", "%23" )`;
const n1 = (x) => `FORMAT ( ${x}, "0.0", "en-US" )`;
export const HEADER = [
  'DataArcus DAX function library (DA.Sparkline, DA.BulletBar, DA.KpiCard, DA.StoryTitle).',
  'FIRST: applying this script raises your model\'s compatibility level to 1702 (DAX user-defined functions need it). It cannot be undone. Power BI Desktop asks before it raises it; save a copy of your file first.'
];
// (an Arabic report: the same step in Arabic, first)
export const HEADER_AR = 'أولًا: تطبيق هذا السكربت يرفع مستوى التوافق (compatibility level) في النموذج إلى 1702 (تحتاجه دوال DAX المعرّفة من المستخدم). لا يمكن التراجع عنه. يسألك Power BI Desktop قبل أن يرفعه؛ احفظ نسخة من ملفك أولًا.';
export const LIBRARY = [
  { name: 'DA.Sparkline',
    description: 'Trend line with an end dot, as an SVG image (data category Image URL). points: numbers in a text list with "." decimals, "3,5,4,8"; a blank item is left out. colour: rgb(...). width, height: the picture\'s size.',
    params: 'points : STRING, colour : STRING, width : NUMERIC, height : NUMERIC',
    body: [
      'VAR p = SUBSTITUTE ( points, ",", "|" )',
      'VAR n = IF ( ISBLANK ( points ) || TRIM ( points ) = "", 0, PATHLENGTH ( p ) )',
      'VAR w = MAX ( width, 16 )',
      'VAR h = MAX ( height, 8 )',
      'VAR c = ' + col('colour'),
      'VAR t = FILTER ( ADDCOLUMNS ( GENERATESERIES ( 1, MAX ( n, 1 ) ), "@s", TRIM ( PATHITEM ( p, [Value] ) ) ), [@s] <> "" )',
      'VAR u = ADDCOLUMNS ( t, "@v", VALUE ( [@s] ) )',
      'VAR k = COUNTROWS ( u )',
      'VAR mn = MINX ( u, [@v] )',
      'VAR mx = MAXX ( u, [@v] )',
      'VAR rng = IF ( mx = mn, 1, mx - mn )',
      'VAR stepx = DIVIDE ( w - 8, MAX ( n - 1, 1 ) )',
      `VAR pts = CONCATENATEX ( u, ${n1('4 + ( [Value] - 1 ) * stepx')} & "," & ${n1('h - 4 - ( [@v] - mn ) / rng * ( h - 8 )')}, " ", [Value], ASC )`,
      'VAR last = MAXX ( u, [Value] )',
      `VAR lx = ${n1('4 + ( last - 1 ) * stepx')}`,
      `VAR ly = ${n1('h - 4 - ( MAXX ( FILTER ( u, [Value] = last ), [@v] ) - mn ) / rng * ( h - 8 )')}`,
      `VAR sz = "width='" & ${n1('w')} & "' height='" & ${n1('h')} & "' viewBox='0 0 " & ${n1('w')} & " " & ${n1('h')} & "'"`,
      'RETURN IF ( n < 1 || k < 1, BLANK (), "data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' " & sz & "><polyline fill=\'none\' stroke=\'" & c & "\' stroke-width=\'2\' stroke-linejoin=\'round\' stroke-linecap=\'round\' points=\'" & pts & "\'/><circle cx=\'" & lx & "\' cy=\'" & ly & "\' r=\'3\' fill=\'" & c & "\'/></svg>" )'] },
  { name: 'DA.BulletBar',
    description: 'Bar with a target mark, as an SVG image (data category Image URL). goodWhenUp: TRUE when at or above the target is good. good, bad, track, mark: rgb(...) colours. No mark when the target is blank; blank when the actual is blank; a max of zero or less counts as 1.',
    params: 'actual : NUMERIC, target : NUMERIC, maxValue : NUMERIC, goodWhenUp : BOOLEAN, good : STRING, bad : STRING, track : STRING, mark : STRING',
    body: [
      'VAR m = IF ( ISBLANK ( maxValue ) || maxValue <= 0, 1, maxValue )',
      `VAR wa = ${n1('MIN ( MAX ( DIVIDE ( actual, m ), 0 ), 1 ) * 116')}`,
      `VAR xt = ${n1('2 + MIN ( MAX ( DIVIDE ( target, m ), 0 ), 1 ) * 114')}`,
      'VAR ok = IF ( ISBLANK ( target ), TRUE (), IF ( goodWhenUp, actual >= target, actual <= target ) )',
      'VAR c = ' + col('IF ( ok, good, bad )'),
      'VAR tick = IF ( ISBLANK ( target ), "", "<rect x=\'" & xt & "\' y=\'2\' width=\'2\' height=\'16\' fill=\'" & ' + col('mark') + ' & "\'/>" )',
      'RETURN IF ( ISBLANK ( actual ), BLANK (), "data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'20\' viewBox=\'0 0 120 20\'><rect x=\'2\' y=\'6\' width=\'116\' height=\'8\' rx=\'4\' fill=\'" & ' + col('track') + ' & "\'/><rect x=\'2\' y=\'6\' width=\'" & wa & "\' height=\'8\' rx=\'4\' fill=\'" & c & "\'/>" & tick & "</svg>" )'] },
  { name: 'DA.KpiCard',
    description: 'KPI card (HTML inside an SVG image, data category Image URL). delta is a ratio (0.094 = 9.4%); blank shows no pill. The pill is good when the direction is good. Colours rgb(...) from the theme; lang "ar" is right to left. title and valueText are escaped here.',
    params: 'title : STRING, valueText : STRING, delta : NUMERIC, goodWhenUp : BOOLEAN, width : NUMERIC, height : NUMERIC, goodColour : STRING, badColour : STRING, textColour : STRING, cardColour : STRING, lang : STRING',
    body: [
      'VAR w = MAX ( width, 60 )',
      'VAR h = MAX ( height, 40 )',
      'VAR ar = lang = "ar"',
      'VAR up = delta >= 0',
      'VAR pill = ' + col('IF ( up = goodWhenUp, goodColour, badColour )'),
      'VAR fg = ' + col('textColour'),
      'VAR bg = ' + col('cardColour'),
      'VAR t = ' + esc('title'),
      'VAR v = ' + esc('valueText'),
      `VAR ft = ${n1('MAX ( 9, h * 0.11 )')}`,
      `VAR fv = ${n1('MAX ( 12, MIN ( h * 0.3, w * 0.12 ) )')}`,
      'VAR d = IF ( ISBLANK ( delta ), "", "<span dir=\'ltr\' style=\'font-size:" & ft & "px;padding:2px 10px;border-radius:999px;color:rgb(255,255,255);background:" & pill & "\'>" & IF ( up, "▲ ", "▼ " ) & ' + n1('ABS ( delta ) * 100') + ' & "%25</span>" )',
      `VAR sz = "width='" & ${n1('w')} & "' height='" & ${n1('h')} & "'"`,
      'RETURN "data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' " & sz & " viewBox=\'0 0 " & ' + n1('w') + ' & " " & ' + n1('h') + ' & "\'><foreignObject x=\'0\' y=\'0\' " & sz & "><div xmlns=\'http://www.w3.org/1999/xhtml\' dir=\'" & IF ( ar, "rtl", "ltr" ) & "\' style=\'box-sizing:border-box;width:" & ' + n1('w') + ' & "px;height:" & ' + n1('h') + ' & "px;padding:12px 16px;border-radius:12px;background:" & bg & ";color:" & fg & ";font-family:Segoe UI,Tahoma,sans-serif;display:flex;flex-direction:column;justify-content:space-between\'><div style=\'display:flex;justify-content:space-between;align-items:center;gap:8px\'><span style=\'font-size:" & ft & "px;opacity:0.75\'>" & t & "</span>" & d & "</div><div style=\'font-size:" & fv & "px;font-weight:700\'>" & v & "</div></div></foreignObject></svg>"'] },
  { name: 'DA.StoryTitle',
    description: 'Plain text for a dynamic title. delta is a ratio; blank says no change. period: what the delta compares with ("last year", "العام الماضي"). lang: "en" or "ar"; in Arabic the leader, the value and the noun are isolated (U+2068 / U+2069), the text opens and closes with U+200F, and the whole text is wrapped in U+2067 ... U+2069, so a Latin name keeps the sentence in order.',
    params: 'leader : STRING, valueText : STRING, noun : STRING, delta : NUMERIC, period : STRING, lang : STRING',
    body: [
      'VAR pct = FORMAT ( ABS ( delta ) * 100, "0", "en-US" ) & "%"',
      'VAR i = UNICHAR ( 8296 )',
      'VAR o = UNICHAR ( 8297 )',
      // (BD1, measured in Desktop 2.159, 26 Oct: a title starting with an isolate read out of order; with U+200F first it
      // read in order) the Arabic opens and closes with a right-to-left mark, as isolateLatin's rule puts one beside an end run
      'VAR r = UNICHAR ( 8207 )',
      // (0.3.1 BD2, the bidi lab measured in Desktop 2.159, 27 Oct: the isolates wrapped whole in U+2067 ... U+2069 drew
      // right on every canvas kind, cut texts included) the Arabic is wrapped whole, as text-measure.js isolateLatin
      'VAR w = UNICHAR ( 8295 )',
      'VAR en = leader & " leads with " & valueText & " " & noun & IF ( ISBLANK ( delta ), "", ", " & IF ( delta >= 0, "up ", "down " ) & pct & " on " & period )',
      'VAR ar = i & leader & o & " في الصدارة بـ " & i & valueText & o & " " & i & noun & o & IF ( ISBLANK ( delta ), "", "، " & IF ( delta >= 0, "بارتفاع ", "بانخفاض " ) & i & pct & o & " عن " & period )',
      'RETURN IF ( ISBLANK ( leader ) || leader = "", BLANK (), IF ( lang = "ar", w & r & ar & r & o, en ) )'] }
];
export const FUNCTION_NAMES = LIBRARY.map((f) => f.name);
export const exprOf = (f) => [`(${f.params}) =>`].concat(f.body.map((l) => '\t' + l)).join('\n');
const norm = (s) => String(s == null ? '' : Array.isArray(s) ? s.join('\n') : s).replace(/\s+/g, ' ').trim();

/** The option as the plan pins it: null (off), or the uses asked (true: all four). */
export function daxOption(v) { if (v === true) return USES.slice(); if (Array.isArray(v) && v.length) return USES.filter((u) => v.includes(u)); return null; }

/** The library against the model (tmsl): its compatibility level, and each DA.* function it already has: the same text
 *  (left out of the script, said), or its own (a plan problem: a script never replaces anything). */
export function resolveDax(tmsl) {
  const have = (modelOf(tmsl).functions || []), problems = [], present = [];
  LIBRARY.forEach((f) => {
    const x = have.find((y) => y && String(y.name).toLowerCase() === f.name.toLowerCase());
    if (!x) return;
    if (norm(x.expression) === norm(exprOf(f))) present.push(f.name);
    else problems.push(`daxFunctions: the model already has its own function ${f.name}, which the library would replace. A script never replaces anything: rename or remove that function in the model first, or leave daxFunctions out.`);
  });
  return { compat: compatOf(tmsl), present, problems };
}

// ---------- the colours: the theme's, as rgb() (never a bare # in a data URI), status colours at 3:1 on the card ----------
const rgb = (hex) => { const h = E.clampHex(hex) || '#000000'; return `rgb(${E.hexToRgb(h).map((v) => Math.round(v)).join(',')})`; };
export function coloursOf(ui) {
  const u = Object.assign({ card: '#ffffff', text: '#1f2937', accent: '#0f6cbd', good: '#00a896', bad: '#e63946' }, ui || {});
  const card = E.clampHex(u.card) || '#ffffff', text = E.clampHex(u.text) || '#1f2937', on = (c) => E.toContrast(E.clampHex(c) || text, card, 3);
  return { card: rgb(card), text: rgb(text), good: rgb(on(u.good)), bad: rgb(on(u.bad)), line: rgb(on(u.accent)), track: rgb(E.mix(text, card, 0.85)), mark: rgb(text),
    hex: { card, text, good: on(u.good), bad: on(u.bad), line: on(u.accent) } };
}

// ---------- the measures DataArcus writes with the library (each one call of a function) ----------
const lit = (v) => ({ expr: { Literal: { Value: v } } }), str = (s) => lit("'" + String(s).replace(/'/g, "''") + "'"), bool = (b) => lit(b ? 'true' : 'false');
const obj = (p) => [{ properties: p }];
const litOf = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : '');
const textOf = (p) => litOf(p).replace(/^'|'$/g, '').replace(/''/g, "'");
const measureRef = (t, m) => ({ Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } });
const WORDS = { en: { period: 'last year', units: null }, ar: { period: 'العام الماضي', units: UNITS_AR } };
// (0.3.1 SQ2, L6-S2) the value's text as the flip cards say it, K/M/B in the report's language: the number, then in
// Arabic E's word (plain text: the functions escape their own text)
const valueDax = (mo, mref, lang) => { const fv = frontValue(mo, mref, WORDS[lang === 'ar' ? 'ar' : 'en'].units, true); return fv.t + (fv.u ? ' & ' + fv.u : ''); };
// the year on year of a measure by the marked date table, or BLANK () without one
const yoyDax = (mref, cal) => (cal ? `VAR _p = CALCULATE ( ${mref}, SAMEPERIODLASTYEAR ( ${dax.column(cal.t, cal.c)} ) )\nVAR _d = IF ( ISBLANK ( _v ) || ISBLANK ( _p ) || _p = 0, BLANK (), DIVIDE ( _v - _p, ABS ( _p ) ) )` : 'VAR _d = BLANK ()');
// the points of the last SPARK.months months with data (by the marked date table), whole numbers in en-US
export const sparkDax = (t, m, cal, c) => [
  `VAR _end = EOMONTH ( MAXX ( FILTER ( ALLSELECTED ( ${dax.column(cal.t, cal.c)} ), NOT ISBLANK ( ${dax.column(t, m)} ) ), ${dax.column(cal.t, cal.c)} ), 0 )`,
  `VAR _pts = CONCATENATEX ( GENERATESERIES ( 1, ${SPARK.months} ), VAR _e = EOMONTH ( _end, [Value] - ${SPARK.months} ) VAR _x = CALCULATE ( ${dax.column(t, m)}, DATESBETWEEN ( ${dax.column(cal.t, cal.c)}, EOMONTH ( _e, -1 ) + 1, _e ) ) RETURN IF ( ISBLANK ( _x ), "", FORMAT ( ROUND ( _x * ${SPARK.scale}, 0 ), "0", "en-US" ) ), ",", [Value], ASC )`,
  `RETURN IF ( ISBLANK ( _end ), BLANK (), DA.Sparkline ( _pts, ${dax.string(c.line)}, ${SPARK.width}, ${SPARK.height} ) )`].join('\n');
export const bulletDax = (t, m, target, c) => [`VAR _a = ${dax.column(t, m)}`, `VAR _t = ${dax.column(target.t, target.m)}`,
  `RETURN DA.BulletBar ( _a, _t, MAX ( _a, _t ) * 1.25, TRUE (), ${dax.string(c.good)}, ${dax.string(c.bad)}, ${dax.string(c.track)}, ${dax.string(c.mark)} )`].join('\n');
export const cardDax = (t, mo, title, cal, c, w, h, lang) => { const mref = dax.column(t, mo.name);
  return [`VAR _v = ${mref}`, `VAR _s = ${valueDax(mo, mref, lang)}`, yoyDax(mref, cal),
    `RETURN DA.KpiCard ( ${dax.string(title)}, _s, _d, TRUE (), ${w}, ${h}, ${dax.string(c.good)}, ${dax.string(c.bad)}, ${dax.string(c.text)}, ${dax.string(c.card)}, ${dax.string(lang)} )`].join('\n'); };
// (0.3.1 TT1, the owner, 27 Oct: a title is wholly Arabic or wholly English) the Arabic sentence only for an Arabic noun;
// an English noun takes the English sentence in an Arabic report too (the leader is a data value: the plan says it may
// be in the other language)
export const storyLang = (noun, lang) => (lang === 'ar' && /[\u0600-\u06FF]/.test(String(noun)) ? 'ar' : 'en');
export const storyDax = (t, mo, cat, noun, cal, lang0) => { const lang = storyLang(noun, lang0), mref = dax.column(t, mo.name), cref = dax.column(cat.t, cat.c);
  return [`VAR _top = TOPN ( 1, FILTER ( VALUES ( ${cref} ), NOT ISBLANK ( ${mref} ) ), ${mref}, DESC )`, `VAR _k = MAXX ( _top, ${cref} )`,
    `VAR _v = CALCULATE ( ${mref}, TREATAS ( { _k }, ${cref} ) )`, `VAR _s = ${valueDax(mo, mref, lang)}`,
    cal ? `VAR _p = CALCULATE ( ${mref}, TREATAS ( { _k }, ${cref} ), SAMEPERIODLASTYEAR ( ${dax.column(cal.t, cal.c)} ) )\nVAR _d = IF ( ISBLANK ( _v ) || ISBLANK ( _p ) || _p = 0, BLANK (), DIVIDE ( _v - _p, ABS ( _p ) ) )` : 'VAR _d = BLANK ()',
    `RETURN IF ( ISBLANK ( _k ), BLANK (), DA.StoryTitle ( _k & "", _s, ${dax.string(noun)}, _d, ${dax.string(WORDS[lang].period)}, ${dax.string(lang)} ) )`].join('\n'); };

/**
 * Puts the library's uses on create_report's built files, in place, and adds the one script. files: the build's
 * [{ path, data }]; o: { opt (true | uses), tmsl (the model as read), lang, ui (the design's colours), base (the report's
 * base name), seed (the plan's: lineage tags), font, rtl }. Returns
 * null when off; else { uses, measures, functions, present, compat, scriptFile, notUsed, colours }.
 */
export function applyDax(files, o) {
  const uses = daxOption(o.opt);
  if (!uses) return null;
  const lang = o.lang === 'ar' ? 'ar' : 'en', model = modelOf(o.tmsl), raw = model.tables || [], c = coloursOf(o.ui);
  const free = freeNamer(raw), res = resolveDax(o.tmsl);
  const at = new Map(files.map((f, i) => [f.path, i]));
  const put = (p, j) => { files[at.get(p)].data = JSON.stringify(j, null, 2); };
  const measureOf = (t, m) => { const mt = raw.find((x) => x.name === t); return mt && (mt.measures || []).find((x) => x.name === m); };
  const okName = (...n) => n.every((x) => !Pbip.hasControl(String(x)));
  const measures = [], made = new Map(), used = { sparkline: [], bulletBar: [], kpiCards: [], storyTitles: [] }, notUsed = [];
  const make = (use, key, want, t, expression, extra) => { const k = use + '\u0000' + key; if (made.has(k)) return made.get(k);
    const name = free(want); measures.push(Object.assign({ use, t, name, expression }, extra || {})); made.set(k, name); return name; };
  const pageName = new Map();
  files.filter((f) => /\.Report\/definition\/pages\/[^/]+\/page\.json$/.test(f.path)).forEach((f) => { try { const j = JSON.parse(f.data); pageName.set(f.path.replace(/\/page\.json$/, ''), j.type === 'Tooltip' ? null : j.displayName); } catch (e) { /* not a page */ } });
  const visuals = files.filter((f) => /\.Report\/definition\/pages\/[^/]+\/visuals\/[^/]+\/visual\.json$/.test(f.path)).map((f) => ({ path: f.path, j: JSON.parse(f.data), page: pageName.get(f.path.replace(/\/visuals\/[^/]+\/visual\.json$/, '')) })).filter((v) => v.page && v.j.visual);
  const measuresIn = (j, role) => ((((j.visual.query || {}).queryState || {})[role] || {}).projections || []).map((p) => p.field && p.field.Measure).filter((ms) => ms && !ms.Expression.SourceRef.Schema).map((ms) => ({ t: String(ms.Expression.SourceRef.Entity), m: String(ms.Property) }));
  const columnsIn = (j, role) => ((((j.visual.query || {}).queryState || {})[role] || {}).projections || []).map((p) => p.field && p.field.Column).filter(Boolean).map((cl) => ({ t: String(cl.Expression.SourceRef.Entity), c: String(cl.Property) }));
  // the table's text size (the theme's, as the writer reads it) and each page's height, for the columns' room
  const rj = files.find((f) => /^[^/]+\.Report\/definition\/report\.json$/.test(f.path)), ct = rj && (JSON.parse(rj.data).themeCollection || {}).customTheme;
  const tf = ct && files.find((f) => f.path === rj.path.replace(/definition\/report\.json$/, 'StaticResources/RegisteredResources/' + ct.name));
  const tt = (() => { try { return +((((((JSON.parse(tf.data).visualStyles || {}).tableEx || {})['*'] || {}).values || [{}])[0] || {}).fontSize) || 10; } catch (e) { return 10; } })();
  const pageH = new Map(); files.filter((f) => /\/page\.json$/.test(f.path)).forEach((f) => { try { pageH.set(f.path.replace(/\/page\.json$/, ''), +JSON.parse(f.data).height || 1080); } catch (e) { /* not a page */ } });
  // (the writer's rule for a table's pictures, pbip-page.js svgColumns, measured in Desktop 2.158 on 4-5 Oct: every other
  // column keeps its room, the pictures share what is left, each with + 10 like a column, never past the box; the
  // picture's size is the table's grid imageWidth and imageHeight, one size for all its pictures. A column's room here is
  // columnRoom plus the cell's padding (24 at 1080, scaled), the writer's cellRoom padding; its other widths shrink
  // only into their slack, in proportion. Too little room: no picture column, told.)
  const fitPictures = (v, cols) => {
    const vis = v.j.visual, ps = vis.query.queryState.Values.projections, cw = ((vis.objects || {}).columnWidth || []), sc = (pageH.get(v.path.replace(/\/visuals\/[^/]+\/visual\.json$/, '')) || 1080) / 1080;
    const widthOf = (p) => { const e = cw.find((x) => x.selector && x.selector.metadata === p.queryRef); return e ? +String(e.properties.value.expr.Literal.Value).replace(/D$/, '') : null; };
    const shown = ps.filter((p) => widthOf(p) !== 0 && p.displayName !== ' ');
    const need = (p) => Math.ceil(Pbip.columnRoom(p, tt, o.font || 'Segoe UI') - 10 + 24 * sc);
    const box = Math.round(v.j.position.width) - 36, others = shown.reduce((a, p) => a + need(p), 0);
    const W = Math.min(SPARK.width, Math.floor((box - others) / cols.length) - 10);
    if (W < 48) return null;
    const H = Math.max(8, Math.round(W * SPARK.height / SPARK.width));
    // the other columns: their room, and what is left of the box in proportion to their slack
    const left = box - cols.length * (W + 10), cur = shown.map((p) => { const x = widthOf(p); return x == null ? need(p) : x; }), slack = shown.map((p, i) => Math.max(0, cur[i] - need(p))), S = slack.reduce((a, b) => a + b, 0);
    const spare = Math.max(0, left - others);
    const num = (n) => ({ expr: { Literal: { Value: Math.round(n) + 'D' } } });
    vis.objects = vis.objects || {};
    const list = (vis.objects.columnWidth = cw.filter((x) => !(x.selector && shown.some((p) => p.queryRef === x.selector.metadata))));
    shown.forEach((p, i) => { list.push({ properties: { value: num(need(p) + (S ? spare * slack[i] / S : spare / shown.length)) }, selector: { metadata: p.queryRef } }); });
    cols.forEach((c) => list.push({ properties: { value: num(W + 10) }, selector: { metadata: `${c.t}.${c.name}` } }));
    vis.objects.grid = [{ properties: Object.assign(((vis.objects.grid || [])[0] || {}).properties || {}, { imageHeight: num(H), imageWidth: num(W) }) }];
    // (a right-to-left table: the pictures at its reading end, the left, after its hidden helper columns)
    const proj = cols.map((c) => ({ field: measureRef(c.t, c.name), queryRef: `${c.t}.${c.name}`, nativeQueryRef: c.name, displayName: c.shown }));
    if (o.rtl) { let lead = 0; while (lead < ps.length && (widthOf(ps[lead]) === 0 || ps[lead].displayName === ' ')) lead++; vis.query.queryState.Values.projections = ps.slice(0, lead).concat(proj, ps.slice(lead)); }
    else vis.query.queryState.Values.projections = ps.concat(proj);
    return { w: W, h: H };
  };

  // 1. tables: a sparkline column (the table's first measure by month, only with a related date table) and a bullet bar
  //    for each measure the model names a target for
  visuals.filter((v) => v.j.visual.visualType === 'tableEx').forEach((v) => {
    const ms = measuresIn(v.j, 'Values');
    if (!ms.length) return;
    const cols = [];
    if (uses.includes('sparkline')) {
      const x = ms[0], mo = measureOf(x.t, x.m), cal = mo && calendarFor(model, x.t);
      if (!mo || !okName(x.t, x.m)) notUsed.push({ use: 'sparkline', page: v.page, why: 'the table\'s first measure is not a measure of the model DAX can name' });
      else if (!cal) notUsed.push({ use: 'sparkline', page: v.page, measure: `${x.t}[${x.m}]`, why: 'no table marked as a date table (with a date key) is related to the measure\'s table, so there are no months to draw' });
      else cols.push({ use: 'sparkline', t: x.t, want: x.m + SUFFIX.sparkline, key: `${x.t}\u0000${x.m}`, expression: sparkDax(x.t, x.m, cal, c), extra: { of: `${x.t}[${x.m}]` }, shown: lang === 'ar' ? 'الاتجاه' : 'Trend',
        said: { page: v.page, measure: `${x.t}[${x.m}]`, months: SPARK.months, by: `${cal.t}[${cal.c}]` } });
    }
    if (uses.includes('bulletBar')) ms.forEach((x) => {
      if (!okName(x.t, x.m)) return;
      const target = targetOf(raw, x.t, x.m);
      if (!target || !okName(target.t, target.m)) return;
      cols.push({ use: 'bulletBar', t: x.t, want: x.m + SUFFIX.bulletBar, key: `${x.t}\u0000${x.m}`, expression: bulletDax(x.t, x.m, target, c), extra: { of: `${x.t}[${x.m}]`, target: `${target.t}[${target.m}]` }, shown: lang === 'ar' ? 'مقابل الهدف' : 'vs target',
        said: { page: v.page, measure: `${x.t}[${x.m}]`, target: `${target.t}[${target.m}]` } });
    });
    if (!cols.length) return;
    // (the names are given only to the columns written: a table without room adds no measure)
    const probe = cols.map((x) => Object.assign({}, x, { name: x.want }));
    const fit = fitPictures({ path: v.path, j: JSON.parse(JSON.stringify(v.j)) }, probe);
    if (!fit) { notUsed.push({ use: cols.map((x) => x.use).join(', '), page: v.page, why: 'the table has no room for a picture column 48 wide beside its other columns; a wider table slot, fewer table fields or a larger page makes room' }); return; }
    cols.forEach((x) => { x.name = make(x.use, x.key, x.want, x.t, x.expression, Object.assign({ image: true }, x.extra)); });
    const sz = fitPictures(v, cols);
    cols.forEach((x) => used[x.use].push(Object.assign({}, x.said, { column: `${x.t}[${x.name}]`, picture: `${sz.w} x ${sz.h}` })));
    put(v.path, v.j);
  });
  if (uses.includes('bulletBar') && !used.bulletBar.length) notUsed.push({ use: 'bulletBar', why: 'no measure in the report\'s tables has a target the model\'s metadata names (a measure "<name> Target", "<name> Goal" or "<name> Budget")' });

  // 2. KPI cards: each card of the KPI row becomes an Image visual of its DA.KpiCard measure (the card's box, name, tab
  //    stop, group and alt text kept)
  if (uses.includes('kpiCards')) visuals.filter((v) => v.j.visual.visualType === 'cardVisual' && v.j.parentGroupName).forEach((v) => {
    const x = measuresIn(v.j, 'Data')[0], mo = x && measureOf(x.t, x.m);
    if (!mo || !okName(x.t, x.m)) { notUsed.push({ use: 'kpiCards', page: v.page, why: 'the card\'s value is not a measure of the model DAX can name' }); return; }
    const vco = v.j.visual.visualContainerObjects || {}, tp = Object.assign({}, ...((vco.title || []).map((e) => e.properties)));
    const title = textOf(tp.text) || x.m, alt = textOf(Object.assign({}, ...((vco.general || []).map((e) => e.properties))).altText) || title;
    const w = Math.round(v.j.position.width), h = Math.round(v.j.position.height), cal = calendarFor(model, x.t);
    const name = make('kpiCards', [x.t, x.m, w, h, title].join('\u0000'), x.m + SUFFIX.kpiCards, x.t, cardDax(x.t, mo, title, cal, c, w, h, lang), { image: true, of: `${x.t}[${x.m}]` });
    v.j.visual = { visualType: 'image', objects: { image: obj({ sourceType: str('imageUrl'), sourceUrl: { expr: measureRef(x.t, name) }, fit: str('Fit') }) },
      visualContainerObjects: { title: obj({ show: bool(false), text: str(title) }), background: obj({ show: bool(false) }), border: obj({ show: bool(false) }), dropShadow: obj({ show: bool(false) }), general: obj({ altText: str(alt) }) } };
    v.j.$schema = SCHEMA_VISUAL;
    put(v.path, v.j);
    used.kpiCards.push({ page: v.page, title, measure: `${x.t}[${x.m}]`, picture: `${x.t}[${name}]`, yearOnYear: !!cal });
  });

  // 3. story titles: a bar or column chart by one category with one measure gets its title from DA.StoryTitle
  if (uses.includes('storyTitles')) visuals.filter((v) => /^(clusteredBarChart|clusteredColumnChart|barChart|columnChart)$/.test(v.j.visual.visualType)).forEach((v) => {
    const cats = columnsIn(v.j, 'Category'), ms = measuresIn(v.j, 'Y');
    if (cats.length !== 1 || ms.length !== 1) return;
    const x = ms[0], cat = cats[0], mo = measureOf(x.t, x.m);
    if (!mo || !okName(x.t, x.m, cat.t, cat.c)) return;
    const vco = v.j.visual.visualContainerObjects = v.j.visual.visualContainerObjects || {};
    const p0 = ((v.j.visual.query.queryState.Y.projections || [])[0] || {}), noun = p0.displayName || x.m;
    const cal = calendarFor(model, x.t);
    const name = make('storyTitles', [x.t, x.m, cat.t, cat.c, noun].join('\u0000'), `${x.m} by ${cat.c}${SUFFIX.storyTitles}`, x.t, storyDax(x.t, mo, cat, noun, cal, lang), { of: `${x.t}[${x.m}]` });
    const before = textOf(Object.assign({}, ...((vco.title || []).map((e) => e.properties))).text);
    const entries = (vco.title || []).length ? vco.title : [{ properties: {} }];
    entries[0].properties = Object.assign({}, entries[0].properties, { text: { expr: measureRef(x.t, name) } });
    vco.title = entries;
    // (the static title stays the visual's alt text when it has none: a screen reader still names the chart)
    const g = Object.assign({}, ...((vco.general || []).map((e) => e.properties)));
    if (!textOf(g.altText) && before) vco.general = obj(Object.assign(g, { altText: str(before) }));
    put(v.path, v.j);
    used.storyTitles.push({ page: v.page, chart: before || null, measure: `${x.t}[${x.m}]`, by: `${cat.t}[${cat.c}]`, title: `${x.t}[${name}]`, yearOnYear: !!cal, sentence: storyLang(noun, lang) === 'ar' ? 'Arabic' : 'English' });
  });
  if (uses.includes('storyTitles') && !used.storyTitles.length) notUsed.push({ use: 'storyTitles', why: 'no bar or column chart of the report shows one measure by one category' });

  let scriptFile = null;
  if (o.base) { scriptFile = scriptFileOf(o.base, SCRIPT_SUFFIX); files.splice(Math.max(0, files.findIndex((f) => /\.pbip$/.test(f.path))), 0, { path: scriptFile, data: daxScript(measures, o.seed || '', res.present, lang) }); }
  return { uses, lang, measures, functions: FUNCTION_NAMES.filter((n) => !res.present.includes(n)), present: res.present, compat: res.compat, scriptFile, used, notUsed, colours: c.hex };
}

/** The ONE script: the header (the compatibility step first), the functions the model does not have yet, then each
 *  measure under its "ref table"; createOrReplace, nothing it names exists yet. */
export function daxScript(measures, seed, present, lang) {
  const out = ['createOrReplace', ''];
  const fns = LIBRARY.filter((f) => !(present || []).includes(f.name));
  fns.forEach((f, i) => { out.push(...functionLines({ name: f.name, description: (i === 0 ? (lang === 'ar' ? [HEADER[0], HEADER_AR] : [HEADER[0]]).concat(HEADER.slice(1), ['']) : []).concat([f.description]).join('\n'), expression: exprOf(f), lineageTag: tagOf(seed, 'function\u0000' + f.name) }, 1), ''); });
  const byT = new Map(); measures.forEach((x) => { if (!byT.has(x.t)) byT.set(x.t, []); byT.get(x.t).push(x); });
  byT.forEach((list, t) => { out.push('\tref table ' + Fix.name(t), '');
    list.forEach((x) => { const lines = Fix.measure(Object.assign({ name: x.name, expression: x.expression, displayFolder: FOLDER }, x.image ? { dataCategory: 'ImageUrl' } : {}, { lineageTag: tagOf(seed, 'dax\u0000' + x.t + '\u0000' + x.name) }), 2);
      if (!lines) throw new Error('a DAX functions measure could not be written'); out.push(...lines, ''); }); });
  return out.join('\n').replace(/\n+$/, '\n');
}

/** The compatibility step, said first (the plan, the approval page, the answer). */
export function compatSaid(compat) {
  if (compat != null && compat >= COMPAT_UDF) return `Your model is already at compatibility level ${compat} (${COMPAT_UDF} or higher): applying the script does not raise it.`;
  return `FIRST: applying the script raises your model's compatibility level ${compat != null ? `from ${compat} ` : ''}to ${COMPAT_UDF} (DAX user-defined functions need it). It cannot be undone. Power BI Desktop asks before it raises it; save a copy of your file first.${compat == null ? ' (The level could not be read from the model\'s files.)' : ''}`;
}

/** The same step in Arabic (an Arabic plan's approval page), the model's level as read. */
export function compatSaidAr(compat) {
  if (compat != null && compat >= COMPAT_UDF) return `مستوى التوافق (compatibility level) في النموذج ${compat} بالفعل (${COMPAT_UDF} أو أعلى): تطبيق السكربت لا يرفعه.`;
  return `أولًا: تطبيق السكربت يرفع مستوى التوافق (compatibility level) في النموذج ${compat != null ? `من ${compat} ` : ''}إلى ${COMPAT_UDF} (تحتاجه دوال DAX المعرّفة من المستخدم). لا يمكن التراجع عنه. يسألك Power BI Desktop قبل أن يرفعه؛ احفظ نسخة من ملفك أولًا.${compat == null ? ' (لم يُقرأ المستوى من ملفات النموذج.)' : ''}`;
}

/** How the user applies the script, for the answer. */
export const daxHow = (file, compat, dir) => `${compatSaid(compat)} Then apply the script: it is in the file "${file}", ${besideSaid(dir)}. Open it in Notepad, select all and copy; in Power BI Desktop open TMDL view, open a new tab, paste, choose Preview (the DA.* functions and new measures only, in the folder "${FOLDER}"; nothing changed or replaced), then Apply${compat != null && compat >= COMPAT_UDF ? '' : '. Power BI Desktop asks for the compatibility upgrade at Preview and again at Apply: accept it both times (its prompt names only the first function, "... needed for [function DA.Sparkline]", but the upgrade is for the whole script)'}. The model is not changed by DataArcus. Each KPI card, story title and table picture column shows an error until you apply the script.`;

// (AF1, the release audit's F11) the model's and the report's names in what daxSaid returns (Table[Measure], the source
// columns, the pages, a chart's own title): through the one screen, withheld when one reads like an instruction; the
// keys DataArcus writes itself (use, why, picture sizes) as they are. The script keeps the real names.
const NAMED = ['measure', 'of', 'by', 'column', 'picture', 'title', 'chart', 'target', 'page'];
const screened = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, NAMED.includes(k) && typeof v === 'string' ? shownName(v, Infinity) : v]));

/** What the plan, the approval page and the answer say (no value is ever read). */
export function daxSaid(r) {
  return Object.assign({ compatibility: { level: r.compat, needs: COMPAT_UDF, raises: !(r.compat != null && r.compat >= COMPAT_UDF), sayFirst: compatSaid(r.compat), ...(r.lang === 'ar' ? { sayFirstAr: compatSaidAr(r.compat) } : {}) },
    status: 'DAX user-defined functions are generally available in Power BI Desktop and the Power BI service since the June 2026 release (Microsoft Learn); they need compatibility level 1702 or higher.',
    functions: LIBRARY.map((f) => ({ name: f.name, params: f.params, inScript: !r.present.includes(f.name) })),
    measures: r.measures.map((x) => screened({ use: x.use, measure: `${x.t}[${x.name}]`, of: x.of })), used: Object.fromEntries(Object.entries(r.used).map(([k, l]) => [k, l.map(screened)])),
    modelChange: `${r.functions.length} DAX function${r.functions.length === 1 ? '' : 's'} and ${r.measures.length} new measure${r.measures.length === 1 ? '' : 's'} in the script "${r.scriptFile}" next to the project. The model is not changed by DataArcus: the user applies the script in TMDL view first. Each KPI card, story title and table picture column shows an error until you apply the script.`,
    colours: `the theme's: good ${r.colours.good}, bad ${r.colours.bad} (3:1 on the card ${r.colours.card}), the sparkline ${r.colours.line}, text ${r.colours.text}` },
  r.present.length ? { alreadyInModel: r.present } : {}, r.notUsed.length ? { notUsed: r.notUsed.map(screened) } : {});
}
