// LAYER reading (0.3.2 SP37, split from visual-meaning.mjs): the candidate ranking. For one custom visual's meaning, the
// native visuals that could take its place, most fitting first, each checked against Microsoft's capabilities
// (visual-capabilities.mjs); the closer native a form calls for (a bullet's target marks, a calendar heatmap's matrix)
// put first, and a second option where the first may not draw (a map's bar chart, a text search's input slicer); and
// the choice's confidence. Pure: no I/O, no network; the meaning and the visual are not changed (the candidates are new
// objects that share the meaning's field objects). The meaning is passed whole, with its own confidence and evidence
// (idFit, named, targets): a weak hint never becomes a confident choice here (high only with the package's roles read
// AND an id that names the kind written); with nothing that fits, no native at all (the person decides).
// Interface:
//   NATIVE { kind: visualType | null }   CHARTS [kind]   FORMS { form: [word] }   formOf(type) -> form | null
//   candidatesOf(meaning) -> [{ kind, native, roles, twoLevel? }] (most fitting first, before the capability check)
//   rankCandidates(meaning, visual, opts) -> { candidates: [{ kind, native, roles, fits, problems, ... }] (the fitting
//     first, rank kept), best, other (the second option or null), closer (best when a form's closer native was put
//     first), calendarNote, form, guess, confidence, idKnown, rolesRead }. opts: nativeFor's (customRoles, calendarOf,
//     second).

import { isValue, isCol, copy, fitsCapabilities } from './visual-capabilities.mjs';
import { wordsOf } from './visual-vocabulary.mjs';

// ---- the native visual of each kind (Power BI's visualType; null: no native visual shows it) ----
export const NATIVE = {
  combo: 'lineClusteredColumnComboChart', column: 'clusteredColumnChart', bar: 'clusteredBarChart', line: 'lineChart', area: 'areaChart',
  pie: 'pieChart', donut: 'donutChart', waterfall: 'waterfallChart', scatter: 'scatterChart', map: 'azureMap', network: null,
  gauge: 'gauge', kpi: 'kpi', table: 'tableEx', matrix: 'pivotTable', card: 'cardVisual', slicer: 'slicer', unknown: null
};
export const CHARTS = ['bar', 'column', 'line', 'area', 'combo', 'pie', 'donut', 'waterfall'];

// the candidates for one meaning, most fitting first: [{ kind, native, roles }]
export function candidatesOf(m) {
  const R = m.roles || {}, tips = R.Tooltips ? { Tooltips: R.Tooltips } : {};
  const all = Object.entries(R).filter(([r]) => r !== 'Tooltips').flatMap(([, l]) => l);
  const table = { kind: 'table', native: 'tableEx', roles: { Values: all.slice() } };
  const out = [];
  if (CHARTS.includes(m.kind)) {
    const Y = (R.Y || []).concat(R.Y2 || []), base = Object.assign({ Category: R.Category || [] }, R.Series ? { Series: R.Series } : {}, tips);
    const time = m.kind === 'line' || m.kind === 'area';
    const order = [m.kind].concat(time ? ['line', 'area', 'column', 'bar'] : ['bar', 'column', 'line'], Y.length >= 2 ? ['combo'] : ['donut', 'pie']);
    [...new Set(order)].forEach((k) => {
      if (k === 'combo') out.push({ kind: k, native: NATIVE.combo, roles: Object.assign({}, base, R.Y2 ? { Y: R.Y, Y2: R.Y2 } : { Y: Y.slice(0, 1), Y2: Y.slice(1) }) });
      else if (k === 'waterfall') out.push({ kind: k, native: NATIVE.waterfall, roles: Object.assign({ Category: R.Category || [], Y }, R.Breakdown ? { Breakdown: R.Breakdown } : {}, tips) });
      // a pie or donut by two categories: the second as its details (Microsoft's validator: its Category takes one field)
      else if ((k === 'pie' || k === 'donut') && base.Category.length === 2 && !base.Series) out.push({ kind: k, native: NATIVE[k], twoLevel: true, roles: Object.assign({}, base, { Category: base.Category.slice(0, 1), Series: base.Category.slice(1), Y }) });
      else out.push({ kind: k, native: NATIVE[k], roles: Object.assign({}, base, { Y }) });
    });
    out.push(table);
  } else if (m.kind === 'card') out.push({ kind: 'card', native: 'cardVisual', roles: R }, { kind: 'card', native: 'multiRowCard', roles: { Values: R.Data || [] } }, table);
  else if (m.kind === 'gauge') out.push({ kind: 'gauge', native: 'gauge', roles: R }, { kind: 'card', native: 'cardVisual', roles: { Data: all } });
  else if (m.kind === 'kpi') out.push({ kind: 'kpi', native: 'kpi', roles: R }, { kind: 'line', native: 'lineChart', roles: { Category: R.TrendLine || [], Y: (R.Indicator || []).concat(R.Goal || []) } }, { kind: 'card', native: 'cardVisual', roles: { Data: (R.Indicator || []).concat(R.Goal || []) } });
  else if (m.kind === 'matrix') out.push({ kind: 'matrix', native: 'pivotTable', roles: R }, table);
  else if (m.kind === 'table') out.push({ kind: 'table', native: 'tableEx', roles: R }, { kind: 'matrix', native: 'pivotTable', roles: { Rows: all.filter(isCol), Values: all.filter(isValue) } });
  else if (m.kind === 'slicer') out.push({ kind: 'slicer', native: 'slicer', roles: R }, { kind: 'slicer', native: 'listSlicer', roles: R }, table);
  else if (m.kind === 'scatter' || m.kind === 'map') out.push({ kind: m.kind, native: m.native, roles: R }, table);
  else if (m.kind === 'network') out.push(table);
  return out.filter((c) => c.native);
}

// (0.3.1 NC2, NC1 "Seen" 1-5, 9) a custom visual's form, by its id's words: what the reader no longer sees in the
// native one, in words, and the closer native Power BI has for it (the bullet, the calendar heatmap). The words only
// name the form; the fields still decide what can be written.
// (0.3.1 NC3) a text search box (one line to type in) and a row of chips: slicers whose native look must be chosen
export const FORMS = { tornado: ['tornado', 'butterfly'], bullet: ['bullet'], cloud: ['cloud', 'wordcloud', 'tagcloud'], calendar: ['heatmap', 'calendar'],
  search: ['search', 'searchbox', 'textfilter', 'textsearch'], chips: ['chip', 'chips', 'pill', 'pills', 'button', 'buttons', 'tag', 'tags'] };
// a form's word is one of the id's words, or (a long one, 8 letters or more) inside them joined: "textFilter" -> textfilter
export const formOf = (type) => { const w = wordsOf(String(type || '').replace(/[0-9A-Fa-f]{32}$/, '')), j = w.join(''); const e = Object.entries(FORMS).find(([, l]) => l.some((x) => w.includes(x) || (x.length >= 8 && j.includes(x)))); return e ? e[0] : null; };

// The ranking of one custom visual's candidates (audit 5, A5-14), and the choice: the closer native first, the meaning's
// choice second (NC2); a second option where the first may not draw or may not be what the person wants (NC3);
// opts.second swaps the two.
export function rankCandidates(m, visual, opts) {
  const o = opts || {}, type = String((visual && visual.type) || '');
  const cands = candidatesOf(m).map((c, i) => Object.assign({}, c, fitsCapabilities(c.native, c.roles), { rank: i }));
  const ranked = cands.filter((c) => c.ok).concat(cands.filter((c) => !c.ok)).map(({ ok, rank, ...c }) => Object.assign(c, { fits: ok }));
  const best0 = m.kind === 'network' ? null : ranked.find((c) => c.fits) || null;
  const guess = !(Array.isArray(o.customRoles) && o.customRoles.length);
  const form = formOf(type);
  // (NC2) the closer native first, the meaning's choice second
  let closer = null, calendarNote = null;
  if (best0 && form === 'bullet' && ['bar', 'column'].includes(best0.kind) && (m.targets || []).length === 1 && (best0.roles.Y || []).length === 2 && !best0.roles.Series) {
    // a bar's target: Microsoft's capabilities give the bar chart error bars (error, by field), but error.errorRange is
    // {"errorRange":{}} there, its JSON not described and not measured; a constant line is one value per chart. The
    // combo's line drawn as markers only (lineStyles: strokeShow, showMarker, markerShape longDash) marks each target
    const tq = (f) => `${f.table}[${f.name}]`, t = m.targets[0], Y = best0.roles.Y.filter((f) => tq(f) !== tq(t));
    const c = { kind: 'combo', native: NATIVE.combo, roles: Object.assign({ Category: best0.roles.Category || [], Y, Y2: [copy(t)] }, best0.roles.Tooltips ? { Tooltips: best0.roles.Tooltips } : {}), targetMarkers: true };
    if (Y.length === 1 && fitsCapabilities(c.native, c.roles).ok) closer = c;
  } else if (best0 && form === 'calendar' && ['line', 'area', 'column', 'bar'].includes(best0.kind) && (best0.roles.Category || []).length === 1 && (best0.roles.Y || []).length === 1 && !best0.roles.Series) {
    const cal = typeof o.calendarOf === 'function' ? (() => { try { return o.calendarOf(best0.roles.Category[0]); } catch (e) { return null; } })() : null;
    if (cal && cal.month && cal.weekday) {
      const c = { kind: 'matrix', native: 'pivotTable', roles: { Rows: [cal.year, cal.month].filter(Boolean).map(copy), Columns: [copy(cal.weekday)], Values: best0.roles.Y.map(copy) }, heat: true, added: [cal.year, cal.month, cal.weekday].filter(Boolean).map(copy) };
      if (fitsCapabilities(c.native, c.roles).ok) closer = c;
    } else if (typeof o.calendarOf === 'function') calendarNote = 'a matrix of weekdays by month, shaded by the value, would be closer: it needs a weekday and a month column in the date\'s own table that the model sorts, and none was found';
  }
  // (NC3) a second option where the first may not draw or may not be what the person wants: a map's bar chart (it draws
  // without Azure Maps), a text search's input slicer (Learn: generally available since February 2026, "the input slicer")
  let alt = null;
  if (!closer && best0 && best0.native === 'azureMap') {
    const R = best0.roles, byName = (R.Category || []).length && !(R.Y || []).some((f) => (R.Category || []).some((c) => c.table === f.table && c.name === f.name));
    const bar = byName && (R.Size || []).length ? { kind: 'bar', native: NATIVE.bar, roles: Object.assign({ Category: R.Category.map(copy), Y: R.Size.map(copy) }, R.Tooltips ? { Tooltips: R.Tooltips } : {}), noMap: true } : null;
    alt = bar && fitsCapabilities(bar.native, bar.roles).ok ? bar : (() => { const t = ranked.find((c) => c.fits && c.native === 'tableEx'); return t ? Object.assign({}, t, { noMap: true }) : null; })();
  } else if (!closer && best0 && best0.native === 'slicer' && form === 'search' && (best0.roles.Values || []).length) {
    const t = { kind: 'slicer', native: 'textSlicer', roles: { Values: best0.roles.Values.slice(0, 1).map(copy) } };
    if (fitsCapabilities(t.native, t.roles).ok) alt = t;
  }
  let best = closer || best0, other = closer ? best0 : alt;
  if (o.second && other) { const x = best; best = other; other = x; }
  // (NC2, NC1 "Seen" 5) confidence from what was read: high = its package's roles AND an id that names the kind written;
  // medium = one of the two; low = inferred from the fields' kinds. Never high without the package.
  const idKnown = !!(best && m.idFit && best.kind === m.idFit), rolesRead = !guess && !!m.named;
  const confidence = !best ? (guess && m.confidence === 'high' ? 'medium' : m.confidence) : !guess && idKnown ? 'high' : idKnown || rolesRead ? 'medium' : 'low';
  return { candidates: ranked, best, other, closer, calendarNote, form, guess, confidence, idKnown, rolesRead };
}
