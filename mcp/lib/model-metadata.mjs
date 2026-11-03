// The model's metadata, adapted for the tools (0.3.2 SP22, moved out of model.mjs as it was): the model of a JSON
// however it is wrapped, the column types read from Power BI Desktop, and the KPI targets. Pure: the loaded model
// object in, the adapted metadata out; it reads no disk (model.mjs keeps the disk and re-exports every name here).
import { nameOut, marked } from './model-names.mjs';

// the model of a model.bim's JSON (or a .pbit's DataModelSchema), whichever way it is wrapped (A1-8: one helper for
// every caller)
export const modelOf = (tmsl) => (tmsl && (tmsl.model || tmsl)) || {};
// Column types read from the model open in Power BI Desktop (INFO.COLUMNS() through Microsoft's Power BI Authoring MCP),
// for the columns a TMDL project leaves without one. Keys are Table[Column] ('Quoted Table'[Col]]x] as in DAX, any case);
// values are model.bim names or the Tabular DataType numbers INFO.COLUMNS returns (also as text). A type the files
// already give is never replaced. Returns what was used and what was not, so nothing is dropped silently.
const TYPE_NUMBERS = { 2: 'string', 6: 'int64', 8: 'double', 9: 'dateTime', 10: 'decimal', 11: 'boolean' };
const TYPE_NAMES = Object.fromEntries(Object.values(TYPE_NUMBERS).map((n) => [n.toLowerCase(), n]));
function columnTypeOf(v) {
  const s = String(v).trim();
  return /^\d+$/.test(s) ? TYPE_NUMBERS[s] : TYPE_NAMES[s.toLowerCase()];
}
function columnKey(k) {
  const m = String(k).trim().match(/^(?:'((?:[^']|'')+)'|([^'[\]]+?))\s*\[((?:[^\]]|\]\])+)\]$/);
  return m ? [(m[1] || m[2]).replace(/''/g, "'").trim(), m[3].replace(/]]/g, ']')] : null;
}
// (A1-6: given the model read by loadModel, both views take the type: its JSON (the health check) and the reader's
// tables (the picker, the tools); given only the JSON, that alone, as before)
export function applyColumnTypes(model, types) {
  const out = { applied: 0, alreadyTyped: [], notInModel: [], badType: [] };
  const both = model && model.tmsl !== undefined && Array.isArray(model.tables), tmsl = both ? model.tmsl : model;
  const tables = modelOf(tmsl).tables || [];
  Object.entries(types || {}).forEach(([key, value]) => {
    const ref = columnKey(key), t = ref && tables.find((x) => String(x.name).toLowerCase() === ref[0].toLowerCase());
    const c = t && (t.columns || []).find((x) => x.type !== 'rowNumber' && String(x.name).toLowerCase() === ref[1].toLowerCase());
    if (!c) return out.notInModel.push(key);
    const type = columnTypeOf(value);
    if (!type) return out.badType.push({ column: key, type: value });
    if (c.dataType && c.dataType !== 'unknown') return out.alreadyTyped.push(key);
    c.dataType = type; out.applied++;
    if (both) { const rt = model.tables.find((x) => x.name === t.name), rc = rt && rt.columns.find((x) => x.name === c.name); if (rc) rc.dataType = type; }
  });
  return out;
}
// (SQ15a, L5-S1) a measure's KPI target (TMSL's kpi.targetExpression; the TMDL reader gives a kpi block the same
// shape): a reference to one other measure of the model is that measure, { t, m } (names as the model has them; DAX
// matches names whatever their case); any other expression is { expression: true }: never parsed further, never
// returned (PRIVACY.md section 3: expressions are read here, not answered); no KPI target: null
const KPI_REF = /^\s*(?:'((?:[^']|'')+)'|([A-Za-z_][A-Za-z0-9_]*))?\s*\[((?:[^\]]|\]\])+)\]\s*$/;
export function kpiTarget(tables, t, m) {
  const list = tables || [], own = list.find((x) => x && x.name === t), mo = own && (own.measures || []).find((x) => x && x.name === m);
  const e = mo && mo.kpi && mo.kpi.targetExpression, text = Array.isArray(e) ? e.join('\n') : e;
  if (text == null || !String(text).trim()) return null;
  const r = KPI_REF.exec(String(text)), lc = (v) => String(v).toLowerCase();
  if (r) {
    const tn = r[1] != null ? r[1].replace(/''/g, "'") : r[2], mn = lc(r[3].replace(/\]\]/g, ']'));
    for (const x of tn != null ? list.filter((y) => y && lc(y.name) === lc(tn)) : list) {
      const hit = (x.measures || []).find((y) => y && lc(y.name) === mn);
      if (hit && !(x.name === t && hit.name === m)) return { t: x.name, m: hit.name };
    }
  }
  return { expression: true };
}
// read_model's KPI list: each visible measure with a KPI and its target, a measure or "an expression" (never its text)
export const KPI_LIST = 50;
export function kpisOf(m) {
  const tables = modelOf(m && m.tmsl).tables || [], out = [];
  tables.forEach((t) => (t.measures || []).forEach((x) => {
    if (!x || !x.kpi || x.isHidden) return;
    const k = kpiTarget(tables, t.name, x.name);
    out.push({ measure: marked(`${nameOut(t.name)}[${nameOut(x.name)}]`, t.name, x.name), target: !k ? 'none' : k.expression ? 'an expression' : marked(`${nameOut(k.t)}[${nameOut(k.m)}]`, k.t, k.m) });
  }));
  return out.length ? Object.assign({ kpis: out.slice(0, KPI_LIST) }, out.length > KPI_LIST ? { kpisNotListed: out.length - KPI_LIST } : {}) : {};
}
