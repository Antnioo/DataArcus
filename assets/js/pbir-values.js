/* DataArcus PBIR values: what a Power BI literal holds, read in one place (0.3.2 DD1B; the owner D-1104-12 "we create
 * a library of functions where a place calls them so if we need to fix something we fix it at the source", D-1016-01).
 * A report's property holds a literal as { expr: { Literal: { Value } } }: a text in quotes ('Sales', a quote inside
 * doubled: 'it''s'), a number with its type letter (12D, 12L, 12M) or bare, true or false. Five readers, each a pure
 * function that never throws and never changes its input:
 *   litText(p)    the text of a quoted literal ('' undone), else null
 *   litNumber(p)  the number of nD, nL, nM or a bare number, else null
 *   litBool(p)    true or false, else null ("on" is === true, "shown" is !== false: the caller's question)
 *   litShown(p)   the value as shown (12D -> "12", 'Sales' -> "Sales", true -> "true"), else null: read-only reports
 *   columnWidth(entries, queryRef)  a table's columnWidth entry for that column: the first whose value is a number
 * A caller that wants "" or 0 for nothing says `?? ''` or `?? 0` where it calls. p is the property; a value that is not
 * an object (a theme's own true, 12 or 'x') is read as the literal's value itself. The ledger: mcp/docs/CONTRACTS.md
 * (1b-text, 1b-number, 1b-bool, 1d); the test: mcp/test-0.3.2-dd1b.mjs.
 *   litValue(p)   the raw Literal.Value as written, else undefined (0.3.3 SG1)
 *   entries(list), plain(list), anyOf(list)  an objects list's object entries; the no-selector entries' properties merged; all merged (0.3.3 SG1)
 * Browser, worker and Node (module.exports / window.DAPbirValues / self.DAPbirValues). */
(function (root) {
  'use strict';
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  // the literal's value: a property's expr.Literal.Value, a bare value as it is, else undefined
  const valueOf = (p) => {
    if (!isObj(p)) return p;
    return isObj(p.expr) && isObj(p.expr.Literal) ? p.expr.Literal.Value : undefined;
  };
  // (0.3.3 SG1) a property's raw Literal.Value as written (12D stays "12D"), else undefined: the one place
  const litValue = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
  // (0.3.3 SG1) an objects list (a visual's objects.<name>): its object entries; the properties of those with no selector, merged;
  // the properties of all, merged. A list that is not an array has none.
  const entries = (list) => (Array.isArray(list) ? list.filter((e) => e && typeof e === 'object') : []);
  const plain = (list) => entries(list).filter((e) => e && !e.selector).reduce((a, e) => Object.assign(a, e.properties || {}), {});
  const anyOf = (list) => entries(list).reduce((a, e) => Object.assign(a, (e && e.properties) || {}), {});
  const QUOTED = /^'.*'$/s;
  const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[DLM]?$/;
  const litText = (p) => { const v = valueOf(p); return typeof v === 'string' && QUOTED.test(v) ? v.slice(1, -1).replace(/''/g, "'") : null; };
  const litNumber = (p) => {
    const v = valueOf(p);
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v !== 'string' || !NUMBER.test(v)) return null;
    const n = Number(v.replace(/[DLM]$/, ''));
    return Number.isFinite(n) ? n : null;
  };
  const litBool = (p) => { const v = valueOf(p); return v === true || v === 'true' ? true : v === false || v === 'false' ? false : null; };
  const litShown = (p) => {
    const v = valueOf(p);
    if (v == null) return null;
    const t = litText(p);
    return t != null ? t : String(v).replace(/[DLM]$/, '');
  };
  const columnWidth = (entries, queryRef) => {
    if (!Array.isArray(entries)) return null;
    for (const e of entries) {
      if (!isObj(e) || !isObj(e.selector) || e.selector.metadata !== queryRef || !isObj(e.properties)) continue;
      const n = litNumber(e.properties.value);
      if (n != null) return n;
    }
    return null;
  };
  const api = Object.freeze({ litText, litNumber, litBool, litShown, columnWidth, litValue, entries, plain, anyOf });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbirValues = api;
})(typeof self !== 'undefined' ? self : this);
