// LAYER reading (0.3.2 SP37, split from visual-meaning.mjs): the replacement's disclosure. What the plan and the answer
// say about a custom visual's native replacement once it is chosen (visual-candidates.mjs): what the reader no longer
// sees with that option, the native visual's own settings for what the custom one showed, what an Azure map needs before
// it draws, the sentence for the user (tell), the confidence's evidence in words, the second option, and the plan's
// line. Pure: no I/O, no network, the input is not changed (detailsOf gives the chosen option a copy of its roles when a
// scatter's legend is dropped, as before). Names in the report are untrusted: the words are written from kinds, counts
// and the visual's own object names screened by objName, never from a table, column or measure name. Nothing here
// replaces anything: the plan lists the entry and the person approves it in DataArcus's own window first.
// Interface:
//   disclose(meaning, visual, opts, rank) -> nativeFor's answer for a custom visual (rank: rankCandidates')
//   detailsOf(option, { meaning, visual, opts, form, calendarNote }) -> { lost, format, expand, needs, tooltips }
//   ownSettingsSaid({ count, named, kept, rest, hidden }) -> text   replacementLine(entry) -> the plan's line
//   shortType(type) -> the id the plan shows   aOr(word) -> "a"/"an" word   nOf(k, one, many) -> "k word(s)"
//   LABEL { kind: name }   CONFIDENCE_LEVELS { level: text }   AZURE_NEEDS [text]

import { createRequire } from 'node:module';
import { capsOf, drillsIn, roleLabel } from './visual-capabilities.mjs';
import { CHARTS } from './visual-candidates.mjs';
import { hintsOf } from './visual-vocabulary.mjs';

// (0.3.1 NC3) the measured slicer heights (a dropdown slicer with its header: slicerH; the button slicer's pills: pillH)
const SZ = createRequire(import.meta.url)('../../assets/js/pbip-sizing.js').make({ font: 'Segoe UI', LABEL: 10 });
// and the least a dropdown slicer takes with no header: Microsoft's validator (validateDropdownSlicerSizing,
// PBIR_SLICER_HEIGHT_BELOW_FLOOR, an error): the selector 32 + its padding 8 above and below
const DROPDOWN_FLOOR = 32 + 8 + 8;
// a count with its word: "1 field", "2 fields" (meaningOf's `why` uses it too)
const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
export { n as nOf };

// (0.3.1 R4A, round 4's problem 9: "its own format settings (1: needle)") a custom visual's own settings in plain words:
// how many, their names (the visual's own object names, quoted), which the native visual keeps and as what, the rest not
// carried over. o: { count, named, kept (words), rest (names), hidden (settings without a name shown) }
export function ownSettingsSaid(o) {
  const named = o.named || [], rest = o.rest || [], hidden = o.hidden || 0, n = o.count || 0;
  const names = named.slice(0, 8).map((x) => `"${x}"`).join(', ') + (named.length > 8 ? ', …' : '');
  const restWords = rest.slice(0, 8).join(', ') + (rest.length > 8 ? ', …' : '') + (hidden ? `${rest.length ? ', ' : ''}${hidden} more (names not shown)` : '');
  return `the custom visual's own formatting (${n} setting${n === 1 ? '' : 's'}${names ? ': ' + names : ''}): kept: ${(o.kept || []).length ? o.kept.join(', ') : 'none'}; not carried over: ${restWords || 'none'}; the report's theme formats the rest`;
}
// (ST1, NC3-S2) the article before a kind's name: "an Azure map", "an area chart"
export const aOr = (w) => (/^[aeio]/i.test(String(w)) ? 'an ' : 'a ') + w;
export const LABEL = { combo: 'line and clustered column chart', column: 'clustered column chart', bar: 'clustered bar chart', line: 'line chart', area: 'area chart', pie: 'pie chart',
  donut: 'donut chart', waterfall: 'waterfall chart', scatter: 'scatter chart', map: 'Azure map', gauge: 'gauge', kpi: 'KPI', table: 'table', matrix: 'matrix', card: 'card', slicer: 'slicer', multiRowCard: 'multi-row card' };
// a custom object's name as the answer may show it (plain names only; the reading block screens them first)
const objName = (s) => (typeof s === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(s) ? s : null);

// (0.3.1 NC3, the laptop's run on 27 Oct: a map drawn as an empty panel) what an Azure map needs before it draws, from
// Microsoft Learn ("Manage Azure Maps Power BI visual within your organization", "Integration tenant settings", "Get
// started with Azure Maps Power BI visual"): the settings by their exact names; said in the plan and after the write
export const AZURE_NEEDS = [
  'Azure Maps draws only where it is turned on: in the Power BI admin portal (Tenant settings, Integration settings), "Users can use the Azure Maps visual"; and for a tenant outside the United States and the European Union also "Data sent to Azure Maps can be processed outside your tenant\'s geographic region, compliance boundary, or national cloud instance" (Microsoft: without it the visual won\'t function there)',
  'Power BI Desktop of May 2025 or later, signed in to that tenant (an older Desktop says "Tenant switch not enabled" even with the setting on)',
  'if the map shows no map tiles at all, it is these settings; if it shows the map with no bubbles, Azure Maps found none of the places (see the location column\'s data category)'
];
// the model's geographic data categories (Desktop's Column tools > Data category)
const GEO_CATEGORY = /^(address|place|city|county|stateorprovince|postalcode|country|continent|latitude|longitude)$/i;
function formLost(form, kind, calendarNote, rows) {
  if (form === 'tornado') return ['its two-sided layout (its two values drawn left and right of one centre line, per category): the native chart draws both bars side by side from the same axis'];
  if (form === 'bullet') return kind === 'combo'
    ? ['its horizontal bars: the native combo draws upright columns, the target as a long dash across each column', 'its bands behind each bar (the ranges from poor to good): no native chart draws them']
    : ['its target marker (a line across each bar): the target becomes a second bar beside the value', 'its bands behind each bar (the ranges from poor to good): no native chart draws them'];
  if (form === 'cloud') return ['its cloud (each word sized by its value, laid out as a cloud): the native bar chart ranks the same words by the same value, longest bar first (Power BI sorts a bar chart by its value), the same facts read as lengths'];
  if (form === 'calendar') return kind === 'matrix'
    ? ['its calendar grid of one square per day: the matrix shades one cell per weekday in each month (the sum of those days), not each day'].concat(rows > 1 ? ['with the year and the month as its rows, the matrix may open at years: "Expand all down one level" (the forked arrow above it) shows the months'] : [])
    : ['its calendar grid of one square per day, shaded by its value: the days become one line over time, with no shading'].concat(calendarNote ? [calendarNote] : []);
  return [];
}
// the custom visual's own format objects the native visual carries over, by their names (formatFacts' words)
const KEPT = [{ re: /valuelabel|^labels$|^datalabels$/i, fact: 'valueLabels', as: 'the native value labels' }, { re: /categorylabel|nodelabel/i, fact: 'categoryLabels', as: 'the native category labels' }, { re: /regression|trend/i, fact: 'trend', as: 'the native trend line' }];
// a loss's head: the text before its first colon outside brackets ("the custom visual's own formatting (1 setting: "labels"): ..." -> the part
// before ": ...")
const headOf = (x) => { let d = 0; for (let i = 0; i < x.length; i++) { const c = x[i]; if (c === '(') d++; else if (c === ')') d--; else if (c === ':' && d <= 0) return x.slice(0, i); } return x; };
// the levels of confidence, said once in the plan
export const CONFIDENCE_LEVELS = {
  high: 'the custom visual\'s package is in the report (its own role definitions read) and its id names the kind written',
  medium: 'one of the two: its id names the kind written, or its package\'s role definitions were read and name every role',
  low: 'inferred: matched by its fields\' kinds (columns, values, dates) and its role names alone; look at it in Desktop'
};

// what the reader no longer sees with one option, and the native visual's own settings for what the custom one showed
// best: the option ({ kind, native, roles, ... } from rankCandidates); ctx: { meaning, visual, opts, form, calendarNote }
export function detailsOf(best, ctx) {
  const { meaning: m, visual, opts: o, form, calendarNote } = ctx, type = String((visual && visual.type) || '');
  const lost = m.lost.filter((x) => !/own look/.test(x));
  const objs = (o.customObjects || visual.customObjects || []).map(objName), named = objs.filter(Boolean);
  const f = o.facts || {}, format = {}, bc = best ? capsOf(best.native) || {} : {}, bobj = bc.objects || {};
  let expand = 0;
  if (best) {
    if (CHARTS.includes(best.kind) && !['pie', 'donut'].includes(best.kind)) format.axisTitles = false; // the custom visuals have none; Power BI would add the fields' names
    if (f.valueLabels && bobj.labels) format.valueLabels = true;
    if (f.categoryLabels && bobj.categoryLabels && best.kind === 'scatter') format.categoryLabels = true;
    if (f.trend && bobj.trend) format.trend = true;
    if (best.targetMarkers) format.targetMarkers = true;
    if (best.heat) format.heat = true;
    // (NC3) a text search or a row of chips: the native slicer as a dropdown in its own box (a list or a row of pills
    // squeezed into it cut its rows), the search on for a text search; its header off where the box is lower than a
    // dropdown and its header need (slicerH at 10pt, measured)
    if (best.native === 'slicer' && (form === 'search' || form === 'chips')) {
      format.dropdown = true;
      if (form === 'search') format.search = true;
      if (visual.h > 0 && visual.h < SZ.slicerH(10)) format.headerOff = true;
      if (visual.h > 0 && visual.h < DROPDOWN_FLOOR) format.minHeight = DROPDOWN_FLOOR;
    }
    // (NC3) the word cloud's bars ranked by their value, largest first (Desktop drew them A to Z with no sort written)
    if (form === 'cloud' && ['bar', 'column'].includes(best.kind) && !(visual.sort || []).length && (best.roles.Y || []).length) format.sortByValue = true;
  }
  // (NC2, NC1 "Seen" 9) which of its own settings the native one keeps, and as what; the rest named as not carried over
  if (objs.length) {
    const kept = named.filter((x) => KEPT.some((k) => k.re.test(x) && format[k.fact])), rest = named.filter((x) => !kept.includes(x)), hidden = objs.length - named.length;
    const keptWords = kept.map((x) => `${x} (as ${KEPT.find((k) => k.re.test(x)).as})`);
    lost.push(ownSettingsSaid({ count: objs.length, named, kept: keptWords, rest, hidden }));
  } else lost.push('its own look (colours, labels, animation): the report\'s theme formats the native visual');
  lost.push('its own interactions (its clicks, animation and drill behaviour): Power BI\'s cross-filtering and drill buttons take their place');
  // when the chosen visual is not the meaning's first choice, its drill note follows the chosen one
  if (best && best.native !== m.native && m.drill.length > 1) {
    const i = lost.findIndex((x) => /drill levels|drill-down/.test(x));
    const note = drillsIn(best.native) ? `the custom visual's own drill-down: Power BI's drill buttons on the native visual take its place, the ${m.drill.length} levels kept as a hierarchy` : `the ${m.drill.length} drill levels: the native visual shows them side by side, not as a drill-down`;
    if (i >= 0) lost[i] = note; else lost.push(note);
  }
  if (best) {
    if (best.twoLevel) { const i = lost.findIndex((x) => /drill/.test(x)); const note = 'the drill-down from its first category to its second: the native donut shows both at once, the second as its details'; if (i >= 0) lost[i] = note; else lost.push(note); }
    if (f.valueLabels && !format.valueLabels) lost.push('its value labels: the native visual has none');
    if (f.categoryLabels && !format.categoryLabels) lost.push('the labels under its marks (the category\'s names): the native visual has no such labels');
    if (f.trend) { if (format.trend) lost.push('its own regression line: the native trend line is switched on in its place (a straight line through the points; check it draws)'); else lost.push('its regression line: the native visual has none'); }
    if (f.thresholds) lost.push('its threshold lines: add constant lines on the native visual by hand');
    if (best.kind === 'scatter' && f.legend !== true && (best.roles.Series || []).length) {
      best.roles = Object.assign({}, best.roles); delete best.roles.Series;
      lost.push('its colour split by a legend field: the original showed no legend, so the native scatter keeps one colour');
    }
    if (best.kind === 'map') format.stylePicker = false;
    // a timeline shows a finer date level than the top one: the native chart opens one level down (years with their quarters)
    const lv = m.drill.filter((x) => x.level);
    if (hintsOf(type).includes('time') && lv.length >= 2 && drillsIn(best.native)) {
      expand = 1;
      const nm = (x) => (/^[A-Za-z ]{1,20}$/.test(String(x.level)) ? String(x.level).toLowerCase() : 'the next level');
      lost.push(`the date level it chose by its zoom: the native chart is set to open at ${nm(lv[1])} within ${nm(lv[0])}; if it opens at ${nm(lv[0])}, use "Expand all down one level" (the forked arrow above the chart) to see ${nm(lv[1])}`);
    }
    // a picture that becomes another kind of visual says so first, in plain words (rc.2b: a map written as a table)
    const PIC = ['map', 'scatter', 'gauge', 'kpi', 'pie', 'donut', 'waterfall'];
    if (best.noMap) lost.unshift(`the Azure map itself: written as ${aOr(LABEL[best.kind] || best.native)} of the same fields by place, which draws without Azure Maps (no tenant setting needed)`);
    else if (PIC.includes(m.kind) && best.kind !== m.kind) lost.unshift(`the ${LABEL[m.kind]} itself: no native ${LABEL[m.kind]} could take its fields, so it is written as ${aOr(LABEL[best.kind] || best.native)}`);
    // a sort by a field no role carries (a helper): kept through the tooltips, said
    const inRoles = (sf) => Object.values(best.roles).some((l) => l.some((x) => x.table === sf.table && x.name === sf.name));
    if ((visual.sort || []).some((x) => x && x.field && !inRoles(x.field))) lost.push(best.tooltips === false || !(bc.dataRoles || []).some((r) => r.name === 'Tooltips') ? 'its sort by a helper field: the native visual sorts by its own fields' : 'its sort by a helper field: kept by adding that field (its first value) to the tooltips, where it also shows');
  }
  lost.push(...formLost(form, best ? best.kind : null, best && best.kind !== 'matrix' ? calendarNote : null, best && best.roles && best.roles.Rows ? best.roles.Rows.length : 0));
  // (NC3) the slicers' forms: what the native one is, in words
  const h = visual.h > 0 ? Math.round(visual.h) : null, box = h ? `its ${h}-high box` : 'its box';
  if (best && best.native === 'slicer' && form === 'search') lost.push(`its search box (a line to type in): the native slicer is a dropdown with its search on, in ${box}: open it, type to find the values, then pick them`);
  if (best && best.native === 'textSlicer') lost.push('its list of the values found: the input slicer filters by the text a person types, with no list to pick from');
  if (best && best.native === 'slicer' && form === 'chips') lost.push(`its row of chips: the native button slicer's pills need ${SZ.pillH(10)} high at 10pt (measured on Desktop 2.159) and each value's width, and a copy that reads metadata only does not know the values: a dropdown in ${box}`);
  if (format.headerOff) lost.push(`its header: ${box} is lower than the ${SZ.slicerH(10)} a dropdown slicer and its header need at 10pt, so the header is off (the box shows the dropdown only)`);
  if (format.minHeight) lost.push(`its height: ${box} is lower than the ${format.minHeight} a dropdown takes at least (Microsoft's validator: the selector 32 and its padding), so the box grows to ${format.minHeight} high, downward; check nothing below it is covered`);
  // (NC3) what an Azure map needs before it draws, and its location column's data category (metadata, from the model)
  const needs = [];
  if (best && best.native === 'azureMap') {
    needs.push(...AZURE_NEEDS);
    const loc = (best.roles.Category || [])[0], keyed = loc && (best.roles.Y || []).some((f) => f.table === loc.table && f.name === loc.name);
    const cat = loc && !keyed && typeof o.categoryOf === 'function' ? (() => { try { return o.categoryOf(loc); } catch (e) { return undefined; } })() : undefined;
    if (typeof cat === 'string' && !GEO_CATEGORY.test(cat.replace(/\s+/g, ''))) needs.push(`its location column has no geographic data category, so Azure Maps guesses what each name is (and may place none): in Desktop select that column, Column tools > Data category, and pick what it holds (City, Country, Address, ...)`);
  }
  return { lost, format, expand, needs, tooltips: !!(bc.dataRoles || []).some((r) => r.name === 'Tooltips') };
}

// nativeFor's answer for a custom visual: the meaning, the chosen option (kind, native, roles, its format settings, what
// it needs), the candidates, what is lost, the sentence for the user (tell), the confidence and its evidence in words,
// and the second option. m: meaningOf's; rank: rankCandidates'
export function disclose(m, visual, opts, rank) {
  const o = opts || {}, type = String((visual && visual.type) || '');
  const { candidates: ranked, best, other, closer, calendarNote, form, guess, confidence, idKnown, rolesRead } = rank, ctx = { meaning: m, visual, opts: o, form, calendarNote };
  const D = detailsOf(best, ctx), lost = D.lost;
  const keeps = best ? Object.entries(best.roles).filter(([, l]) => l.length).map(([r, l]) => `${roleLabel(best.native, r)} (${n(l.length, 'field', 'fields')})`).join(', ') : '';
  const short = lost.map(headOf).join('; ');
  const said = best && best.native === 'slicer' && D.format.dropdown ? (D.format.search ? ' (a dropdown with its search on)' : ' (a dropdown)') : best && best.native === 'textSlicer' ? ' (the input slicer: it filters by the text typed)' : '';
  const tell = best ? `This custom visual becomes a native ${best.native === 'textSlicer' ? 'input slicer' : LABEL[best.kind] || best.native}${said}${best.native === 'multiRowCard' ? ' (multi-row card)' : ''}${guess ? ' (a guess from its fields\' kinds: the custom visual\'s own role definitions are not in the report)' : ''}. It keeps ${keeps}. It loses ${short}.${D.needs.length ? ' It draws only where Azure Maps is turned on: tell the user what to turn on (needs) before they open the copy.' : ''}`
    : m.kind === 'network' ? `No native Power BI visual draws this custom visual's network: an HTML/SVG measure in an image-capable visual can (you approve it in the plan), or a table of its links. It loses ${short}.`
    : `No native Power BI visual can show this custom visual's fields as they are: it can be kept as it is or left out. Nothing is decided without you.`;
  const idSaid = idKnown ? `its id's words name ${aOr(LABEL[best.kind] || best.native)}` : hintsOf(type).length ? 'its id\'s words name no kind its fields could be written as here' : 'its id names no kind DataArcus knows';
  const evidence = `${guess ? 'no package in the report: its own role definitions are not read' : `its package's role definitions read${rolesRead ? ', every role named' : ''}`}; ${idSaid}; ${idKnown && !guess ? 'both agree' : 'matched by its fields\' kinds and its role names'}`;
  const extras = best ? Object.assign({ format: D.format, tooltips: D.tooltips }, D.needs.length ? { needs: D.needs } : {}, D.expand ? { expand: D.expand } : {}, m.aggregate && best.native === m.native ? { aggregate: m.aggregate } : {}, best.added ? { added: best.added } : {}) : {};
  const sec = other ? (() => { const d = detailsOf(other, ctx); return Object.assign({ kind: other.kind, native: other.native, roles: other.roles, label: other.native === 'textSlicer' ? 'input slicer' : LABEL[other.kind] || other.native, lost: d.lost, format: d.format }, d.needs.length ? { needs: d.needs } : {}, other.added ? { added: other.added } : {}); })() : null;
  return Object.assign({}, m, best ? { kind: best.kind, native: best.native, roles: best.roles } : { native: null, aggregate: undefined }, extras,
    { custom: true, candidates: ranked, guess, lost, tell, htmlNeeded: m.kind === 'network', confidence, evidence }, sec ? { second: sec, secondChosen: !!o.second } : {},
    best && best === closer ? { why: m.why + (best.targetMarkers ? '; written as columns with its target as a long-dash marker on each (the closer native for a bullet)' : '; written as a matrix of months by weekday, each cell shaded by the value (the closer native for a calendar heatmap)') } : {});
}

// a custom visual's type as the plan shows it: its id without the trailing code, plain letters and digits only
export const shortType = (t) => { const s = String(t || '').replace(/[0-9A-Fa-f]{32}$/, ''); return /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(s) ? s : 'a custom visual'; };

// the plan's line: "custom visual X on page N at x,y -> native Y (visualType): why"; no field or report name in it
export function replacementLine(e) {
  const why = String(e.why || '').replace(/^a custom visual: /, '');
  // (0.3.0 J19) values that may not share one axis: separate native visuals in the box, the reason said
  if (e.panels) return `custom visual ${e.from} on page ${e.page} at ${e.place} -> ${e.panels.length} separate ${e.label}s (${e.native}) in its box, one axis each${e.guess ? ' [a guess]' : ''}: ${why}; ${e.axes.why.en}`;
  return `custom visual ${e.from} on page ${e.page} at ${e.place} -> ` + (e.native ? `${e.label} (${e.native})${e.guess ? ' [a guess]' : ''}: ${why}` : `no native visual: an HTML/SVG measure in an image-capable visual (step D), or a table of its links: ${why}`);
}
