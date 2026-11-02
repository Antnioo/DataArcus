// 0.3.0 L5: status icons, the theme-icons lab of 10 Oct 2026 (Desktop 2.158.1304.0, a copy of a public-data report).
// Every DataArcus theme carries three icons (design-engine.js statusIcons: daGood, daWarn, daBad, three shapes); this
// option puts one before a table's or matrix's measure by conditional formatting, the lab's entry exactly (values.icon,
// kind Icon, layout 'Before', verticalAlignment 'Middle', rows only by dataViewWildcard matchingOption 1, metadata
// "<Table>.<Measure>"). Two ways, both drawn the same in the lab:
//   - rules (the lab's Way E): only with thresholds the USER gave ({ measure, good: ">= 0.97", bad: "< 0.94" }): the
//     measure compared with the user's numbers; between them the warning icon. No measure, no script.
//   - a status measure (Way C): the measure against a target the model's METADATA names ("<M> Target", "<M> Goal",
//     "<M> Budget", ...): at or above it "daGood", below it "daBad", blank when either is blank. No threshold is ever
//     guessed: no warning band. The measure goes into a TMDL script next to the project, as L3's and L4's (model-script.mjs):
//     DataArcus never changes the model.
// The MCP never reads a value. Model names are untrusted: quoted (Fix.name, daxNames), compared, never followed.
import { createRequire } from 'node:module';
import { freeNamer, tagOf, scriptFileOf, nameKey } from './model-script.mjs';
import { kpiTarget } from './model.mjs';
import { besideSaid } from './plain-words.mjs';   // (0.3.1 R4A, T-9: the folder by its name and where it is)

const require = createRequire(import.meta.url);
const Fix = require('../../assets/js/model-health-tmdl.js'), Pbip = require('../../assets/js/pbip-export.js'), Bind = require('../../assets/js/pbip-bind.js'), E = require('../../assets/js/design-engine.js');
const dax = Pbip.daxNames;

export const FOLDER = 'DataArcus status icons';
export const SCRIPT_SUFFIX = ' - status icons';
export const SUFFIX = ' (status icon)';
export const ICONS = E.ICON_NAMES;   // { good: 'daGood', neutral: 'daWarn', bad: 'daBad' }
export const LIST_MAX = 8;
// the target names the metadata may give a measure, in this order (same table first, then the others)
const TARGET_WORDS = ['Target', 'Goal', 'Budget'];
// a threshold: an operator and a number. ComparisonKind: 1 >, 2 >=, 3 <, 4 <= (the lab: 2 and 3)
const KIND = { '>': 1, '>=': 2, '<': 3, '<=': 4 }, NOT = { 1: 4, 2: 3, 3: 2, 4: 1 };
const UP = (k) => k === 1 || k === 2;
export const parseThreshold = (s) => { const m = /^\s*(>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)\s*$/.exec(String(s == null ? '' : s)); return m ? { op: m[1], kind: KIND[m[1]], n: m[2].replace(/^(-?)0+(?=\d)/, '$1') } : null; };

/** The option as the plan pins it: null (off), true (automatic) or the list as given. */
export function iconsOption(v) { if (v === true) return true; if (Array.isArray(v) && v.length) return v; return null; }

const keyOf = (s) => { const mk = String(s).trim().match(/^'?(.+?)'?\[(.+)\]$/); return mk ? { t: mk[1], m: mk[2] } : null; };
// (SQ15a) a KPI whose target is not one measure: said so, never quoted
export const kpiSaid = (raw, t, m) => { const k = kpiTarget(raw, t, m); return k && k.expression ? '; its KPI in the model has a target, but it is an expression, not a measure DataArcus can name' : ''; };
const shownName = (s) => JSON.stringify(Pbip.shown ? Pbip.shown(String(s)).slice(0, 160) : String(s).replace(/[\p{Cc}\p{Cf}]/gu, ' ').slice(0, 160));

/** The target measure the model's metadata names for t[m] (raw: the model's tables), or null: the measure's own KPI
 *  target first when it is a measure (SQ15a, L5-S1: kpiTarget, model.mjs), then the names. */
export function targetOf(raw, t, m) {
  const k = kpiTarget(raw, t, m); if (k && !k.expression) return k;
  const want = new Set(TARGET_WORDS.flatMap((w) => [`${m} ${w}`, `${w} ${m}`, `${m} - ${w}`]).map(nameKey));
  const tables = (raw || []).slice().sort((a, b) => (a.name === t ? -1 : b.name === t ? 1 : 0));
  for (const x of tables) { const hit = (x.measures || []).find((y) => y.name !== m && want.has(nameKey(y.name))); if (hit) return { t: x.name, m: hit.name }; }
  return null;
}

/** The listed entries checked against the model (raw: its tables). { items: [{ t, m, way, good, bad, target }], problems } */
export function resolveIcons(raw, opt) {
  const problems = [], items = [];
  if (!Array.isArray(opt)) return { items, problems };
  if (opt.length > LIST_MAX) problems.push(`statusIcons takes at most ${LIST_MAX} measures; the plan names ${opt.length}.`);
  opt.forEach((x, i) => {
    const at = `statusIcons[${i}]`, k = x && keyOf(x.measure), t = k && (raw || []).find((y) => y.name === k.t);
    if (!k) { problems.push(`${at}: ${shownName(x && x.measure)} is not written as Table[Measure].`); return; }
    if (!t || !(t.measures || []).some((y) => y.name === k.m)) { problems.push(`${at}: ${shownName(x.measure)} is not a measure of the model${t && (t.columns || []).some((y) => y.name === k.m) ? ' (it is a column: status icons go on a measure)' : ''}.`); return; }
    if (Pbip.hasControl(k.t) || Pbip.hasControl(k.m)) { problems.push(`${at}: the name holds a control character (a tab or a line break) that no DAX may name; rename it in the model first.`); return; }
    if (items.some((y) => y.t === k.t && y.m === k.m)) { problems.push(`${at}: ${shownName(x.measure)} is named twice.`); return; }
    const has = (v) => v !== undefined && v !== null && String(v).trim() !== '';
    if (has(x.good) || has(x.bad)) {
      if (!has(x.good) || !has(x.bad)) { problems.push(`${at}: give both thresholds, good and bad (the user's own numbers), or neither (then the target the model names is used); a missing one is never guessed.`); return; }
      const g = parseThreshold(x.good), b = parseThreshold(x.bad);
      if (!g || !b) { problems.push(`${at}: a threshold is an operator (>=, >, <=, <) and a number, like ">= 0.97" (a percent as a ratio: 97% is 0.97).`); return; }
      if (UP(g.kind) === UP(b.kind)) { problems.push(`${at}: good and bad must point in opposite directions (good ">= 0.97" with bad "< 0.94", or good "<= 0.03" with bad "> 0.05").`); return; }
      const gn = +g.n, bn = +b.n, inc = (k) => k === 2 || k === 4;
      const overlap = UP(g.kind) ? (bn > gn || (bn === gn && inc(g.kind) && inc(b.kind))) : (bn < gn || (bn === gn && inc(g.kind) && inc(b.kind)));
      if (overlap) { problems.push(`${at}: the thresholds overlap (a value would be good and bad at once); bad must lie beyond good.`); return; }
      items.push({ t: k.t, m: k.m, way: 'rules', good: g, bad: b, given: { good: String(x.good).trim(), bad: String(x.bad).trim() } });
      return;
    }
    const target = targetOf(raw, k.t, k.m);
    if (!target) { problems.push(`${at}: ${shownName(x.measure)} has no target measure in the model's metadata (a measure named "<name> Target", "<name> Goal" or "<name> Budget"${kpiSaid(raw, k.t, k.m)}), and no thresholds were given. Ask the user for thresholds (good and bad), or name a measure that has a target; thresholds are never guessed.`); return; }
    items.push({ t: k.t, m: k.m, way: 'measure', target });
  });
  return { items, problems };
}

const lit = (v) => ({ expr: { Literal: { Value: v } } });
const measureRef = (t, m) => ({ Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } });
const cmp = (kind, left, n) => ({ Comparison: { ComparisonKind: kind, Left: left, Right: { Literal: { Value: n + 'D' } } } });
const icon = (name) => ({ Literal: { Value: `'${name}'` } });
/** The lab's rules (Way E): good, bad, then the warning between them. */
export function rulesValue(t, m, g, b) {
  const M = measureRef(t, m);
  return { expr: { Conditional: { Cases: [
    // (F1, the laptop proof: a blank row got the bad icon) a blank value first: no icon (blank, as Power BI's filters write it)
    { Condition: { Comparison: { ComparisonKind: 0, Left: M, Right: { Literal: { Value: 'null' } } } }, Value: { Literal: { Value: "''" } } },
    { Condition: cmp(g.kind, M, g.n), Value: icon(ICONS.good) },
    { Condition: cmp(b.kind, M, b.n), Value: icon(ICONS.bad) },
    { Condition: { And: { Left: cmp(NOT[g.kind], M, g.n), Right: cmp(NOT[b.kind], M, b.n) } }, Value: icon(ICONS.neutral) }] } } };
}
/** The lab's entry in a table's or matrix's values, for the column queryRef. */
// (F1, the laptop proof: 'Before', "left of the value", put the icon at the far left of a wide right-aligned cell, beside
// the previous column's number) right of the value ('After') in English, left of it ('Before') in a right-to-left report
export const iconEntry = (queryRef, value, rtl) => ({ properties: { icon: { kind: 'Icon', layout: lit(rtl ? "'Before'" : "'After'"), verticalAlignment: lit("'Middle'"), value } },
  selector: { data: [{ dataViewWildcard: { matchingOption: 1 } }], metadata: queryRef } });
/** The status measure's DAX (Way C): the target the model names; no number of DataArcus's own. */
export const statusDax = (x) => [`VAR _v = ${dax.column(x.t, x.m)}`, `VAR _t = ${dax.column(x.target.t, x.target.m)}`,
  `RETURN IF ( ISBLANK ( _v ) || ISBLANK ( _t ), BLANK (), IF ( _v >= _t, ${dax.string(ICONS.good)}, ${dax.string(ICONS.bad)} ) )`].join('\n');
const ruleSaid = (x) => (x.way === 'rules' ? `the user's thresholds, as given: good ${x.given.good}, bad ${x.given.bad}, the warning icon between them`
  : `against its target ${x.target.t}[${x.target.m}] (named in the model): at or above the target good, below it bad; no warning band (no threshold is guessed)`);

/**
 * Puts the icons on create_report's built files, in place. files: the build's [{ path, data }]; o: { opt (true | list),
 * tmsl's raw tables (raw), base (the report's base name), seed (the plan's: lineage tags), ui (for a theme without the
 * icons) }. The script "<base> - status icons.tmdl" joins the files (one write, one digest). Returns null when off; else
 * { columns, measures, scriptFile, notShown, themeAdded }.
 */
export function applyIcons(files, o) {
  const opt = iconsOption(o.opt);
  if (!opt) return null;
  const raw = o.raw || [], listed = opt === true ? null : resolveIcons(raw, opt).items;
  const free = freeNamer(raw);
  const at = new Map(files.map((f, i) => [f.path, i]));
  const put = (p, j) => { files[at.get(p)].data = JSON.stringify(j, null, 2); };
  const columns = [], measures = [], made = new Map(), seen = new Set(), skipped = new Map();
  const pageName = new Map();
  files.filter((f) => /\.Report\/definition\/pages\/[^/]+\/page\.json$/.test(f.path)).forEach((f) => { try { const j = JSON.parse(f.data); pageName.set(f.path.replace(/\/page\.json$/, ''), j.type === 'Tooltip' ? null : j.displayName); } catch (e) { /* not a page */ } });
  files.filter((f) => /\.Report\/definition\/pages\/[^/]+\/visuals\/[^/]+\/visual\.json$/.test(f.path)).forEach((f) => {
    const j = JSON.parse(f.data), type = j.visual && j.visual.visualType;
    if (type !== 'tableEx' && type !== 'pivotTable') return;
    const pg = pageName.get(f.path.replace(/\/visuals\/[^/]+\/visual\.json$/, ''));
    if (pg === null) return;   // (a tooltip page: no icons)
    const ps = ((((j.visual.query || {}).queryState || {}).Values || {}).projections || []);
    const entries = [];
    ps.forEach((p) => {
      const ms = p.field && p.field.Measure;
      if (!ms || ms.Expression.SourceRef.Schema) return;
      const t = String(ms.Expression.SourceRef.Entity), m = String(ms.Property), key = t + '\u0000' + m;
      let x = listed ? listed.find((y) => y.t === t && y.m === m) : null;
      if (!listed) {
        const mt = raw.find((y) => y.name === t), mo = mt && (mt.measures || []).find((y) => y.name === m);
        if (!mo || !Bind.isPercent(m, mo.formatString, mo.expression) || Pbip.hasControl(t) || Pbip.hasControl(m)) return;
        const target = targetOf(raw, t, m);
        if (!target) { skipped.set(key, { measure: `${t}[${m}]`, why: 'a rate with no target measure in the model\'s metadata ("<name> Target", "<name> Goal" or "<name> Budget"' + kpiSaid(raw, t, m) + '); give thresholds (good and bad) from the user for it' }); return; }
        x = { t, m, way: 'measure', target };
      }
      if (!x) return;
      seen.add(key);
      let value;
      if (x.way === 'rules') value = rulesValue(t, m, x.good, x.bad);
      else {
        let name = made.get(key);
        if (!name) { name = free(m + SUFFIX); made.set(key, name); measures.push({ t, name, expression: statusDax(x), of: `${t}[${m}]` }); }
        value = { expr: measureRef(t, name) };
      }
      entries.push(iconEntry(p.queryRef || `${t}.${m}`, value, o.rtl));
      columns.push(Object.assign({ page: pg, visual: type === 'tableEx' ? 'table' : 'matrix', measure: `${t}[${m}]`, way: x.way, rule: ruleSaid(x) }, x.way === 'measure' ? { statusMeasure: `${t}[${made.get(key)}]`, target: `${x.target.t}[${x.target.m}]` } : { thresholds: x.given }));
    });
    if (!entries.length) return;
    const obs = j.visual.objects = j.visual.objects || {};
    obs.values = (obs.values || []).concat(entries);
    put(f.path, j);
  });
  const notShown = (listed || []).filter((x) => !seen.has(x.t + '\u0000' + x.m)).map((x) => ({ measure: `${x.t}[${x.m}]`, why: 'not in a table or matrix of the report: add it to the table\'s fields for its icon' }))
    .concat([...skipped.entries()].filter(([k]) => !seen.has(k)).map(([, v]) => v));
  // a theme without the icons (a theme the user passed): the report's copy gets them; the user's own file is not changed
  let themeAdded = false;
  if (columns.length) {
    const rj = files.find((f) => /^[^/]+\.Report\/definition\/report\.json$/.test(f.path)), ct = rj && JSON.parse(rj.data).themeCollection;
    const tf = ct && ct.customTheme && files.find((f) => f.path === rj.path.replace(/definition\/report\.json$/, 'StaticResources/RegisteredResources/' + ct.customTheme.name));
    if (tf) { const th = JSON.parse(tf.data), ic = th.icons || {};
      if (!Object.values(ICONS).every((n) => ic[n] && ic[n].url)) { th.icons = Object.assign({}, ic, E.statusIcons(Object.assign({}, o.ui || {}, ['good', 'neutral', 'bad', 'card'].reduce((a, k) => (th[k === 'card' ? 'background' : k] ? Object.assign(a, { [k]: th[k === 'card' ? 'background' : k] }) : a), {})))); tf.data = JSON.stringify(th, null, 2); themeAdded = true; } }
  }
  let scriptFile = null;
  if (measures.length && o.base) { scriptFile = scriptFileOf(o.base, SCRIPT_SUFFIX); files.splice(Math.max(0, files.findIndex((f) => /\.pbip$/.test(f.path))), 0, { path: scriptFile, data: iconsScript(measures, o.seed || '') }); }
  return { columns, measures, scriptFile, notShown, themeAdded, auto: opt === true };
}

/** The TMDL script that adds the status measures (createOrReplace, each table under "ref table"); nothing it names exists yet. */
export function iconsScript(measures, seed) {
  const byT = new Map(); measures.forEach((x) => { if (!byT.has(x.t)) byT.set(x.t, []); byT.get(x.t).push(x); });
  const out = ['createOrReplace', ''];
  byT.forEach((list, t) => { out.push('\tref table ' + Fix.name(t), '');
    list.forEach((x) => { const lines = Fix.measure({ name: x.name, expression: x.expression, displayFolder: FOLDER, lineageTag: tagOf(seed, 'icon\u0000' + x.t + '\u0000' + x.name) }, 2); if (!lines) throw new Error('a status measure could not be written'); out.push(...lines, ''); }); });
  return out.join('\n').replace(/\n+$/, '\n');
}

/** How the user applies the script, for the answer and the plan. */
export const iconsHow = (file, dir) => `Apply the script first: the status icons show only once the model has the status measures. The script is in the file "${file}", ${besideSaid(dir)}. Save a copy of your file first; open the script in Notepad, select all and copy; in Power BI Desktop open TMDL view, open a new tab, paste, choose Preview (only new measures, in the folder "${FOLDER}"; nothing changed or replaced), then Apply. The model is not changed by DataArcus. Until the script is applied the columns show no icon.`;

/** What the plan, the approval page and the answer say (names screened by the caller's JSON; no value is ever read). */
export function iconsSaid(r) {
  return Object.assign({ columns: r.columns, icons: 'the theme\'s DataArcus icons: good a tick in a circle, warning a triangle with "!", bad a cross in a rounded square; they differ in shape, so colour is not the only signal',
    placement: 'before the value (Power BI\'s "left of the value"), rows only (not the total), in English and Arabic alike' },
  r.measures.length ? { newMeasures: r.measures.length, modelChange: `${r.measures.length} new status measure${r.measures.length === 1 ? '' : 's'} in the script "${r.scriptFile}" next to the project. The model is not changed by DataArcus: the user applies the script in TMDL view first; until then the columns show no icon.` } : {},
  r.notShown.length ? { notShown: r.notShown } : {}, r.themeAdded ? { themeAdded: 'The theme had no DataArcus icons: the report\'s copy of it got them (your theme file itself is not changed).' } : {},
  r.auto && !r.columns.length ? { none: 'No table or matrix measure is a rate with a target the model names, so no icon was put: name measures with thresholds the user gives, statusIcons: [{ measure, good, bad }].' } : {});
}
