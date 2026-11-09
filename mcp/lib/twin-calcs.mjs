// (0.3.2 VC1, B-305, RD2-D2) the visual calculations whose result depends on the visual's order, found by structure.
// A visual calculation is a projection's field NativeVisualCalculation { Language, Expression, Name } (semanticQuery
// 1.4.0, QueryNativeVisualCalc). Its expression is read here only to count the functions by name: it can hold literals
// (the model's values), so no part of it is ever returned; strings, comments and [names] are removed before counting.
// Sources: Microsoft Learn "Visual calculations" and the DAX reference of each function (mcp/work/VC1.md).
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
// running and neighbour calculations: along the visual's axis, in its order (the one list: the plan counts these and
// the approval page names only these; 0.3.2 VC2: OFFSET, INDEX, WINDOW, RANGE and ROWNUMBER, the window functions)
export const ORDER_FUNCTIONS = ['RUNNINGSUM', 'MOVINGAVERAGE', 'PREVIOUS', 'NEXT', 'FIRST', 'LAST', 'RANK', 'OFFSET', 'INDEX', 'WINDOW', 'RANGE', 'ROWNUMBER'];
const CALL = new RegExp('\\b(' + ORDER_FUNCTIONS.join('|') + ')\\s*\\(', 'gi');
// DAX strings ("" inside), comments (//, --, /* */) and bracketed names ([RANK (old)]) say nothing of a call
const bare = (s) => String(s).replace(/"(?:[^"]|"")*"?|\/\*[\s\S]*?(?:\*\/|$)|(?:\/\/|--)[^\n]*|\[(?:[^\]]|\]\])*\]?|'(?:[^']|'')*'?/g, ' ');

// { RUNNINGSUM: 1, ... } for one visual's query, or null when it holds none of them
export function orderCalcsOf(json) {
  const q = isObj(json) && isObj(json.visual) ? json.visual.query : null;
  if (!isObj(q)) return null;
  const counts = {};
  const walk = (x, depth) => {
    if (depth > 40 || x === null || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach((y) => walk(y, depth + 1)); return; }
    const c = x.NativeVisualCalculation;
    if (isObj(c) && typeof c.Expression === 'string') for (const m of bare(c.Expression).matchAll(CALL)) { const k = m[1].toUpperCase(); counts[k] = (counts[k] || 0) + 1; }
    Object.values(x).forEach((y) => walk(y, depth + 1));
  };
  walk(q, 0);
  return Object.keys(counts).length ? Object.fromEntries(ORDER_FUNCTIONS.filter((k) => counts[k]).map((k) => [k, counts[k]])) : null;
}

// the mirror turned this visual's order: its query (a sort turned or added, values or a legend reversed) or its
// category axis (invertAxis) is not the original's
const axisOf = (j) => (isObj(j) && isObj(j.visual) && isObj(j.visual.objects) ? JSON.stringify(j.visual.objects.categoryAxis || null) : 'null');
export function turnedBy(original, mirrored) {
  if (!isObj(original) || !isObj(original.visual) || !isObj(mirrored) || !isObj(mirrored.visual)) return false;
  return JSON.stringify(original.visual.query) !== JSON.stringify(mirrored.visual.query) || axisOf(original) !== axisOf(mirrored);
}

export const ORDER_CALC_SAID = {
  en: 'turned right to left; it holds a running or neighbour calculation, so its numbers may differ from the original: check it in Desktop',
  ar: 'عُكس من اليمين إلى اليسار؛ فيه حساب تراكمي أو حساب يعتمد على الصف المجاور، لذا قد تختلف أرقامه عن الأصل: تحقّق منه في Power BI Desktop'
};
// the plan's key (null when no visual applies): each visual by page/visual, its functions counted
export function orderCalculationsSaid(list) {
  if (!list.length) return null;
  return { count: list.length, visuals: list.slice(0, 30), ...(list.length > 30 ? { notListed: list.length - 30 } : {}),
    en: `${list.length} visual${list.length === 1 ? '' : 's'} ${ORDER_CALC_SAID.en}.`, ar: `${list.length} من المرئيات: ${ORDER_CALC_SAID.ar}.`,
    sayInPlan: 'Say each of these visuals to the user by page and visual, in these words: the twin still turns it (its order right to left); a running sum, moving average, previous, next, first, last, rank, offset, index, window, range or row number in it may then count along the turned order. Ask the user to compare its numbers with the original in Power BI Desktop.' };
}
