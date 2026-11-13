// The twin's field key (0.3.3 DQ1, B-434; the owner D-1104-12): the one text a model field is told apart by in the
// terminology sheet, the approved Arabic captions, the culture script and the memory of earlier answers. The pair
// (table, field), written `Table[Field]` as before: a table with a quote or a bracket in its name is quoted (`'` doubled),
// a `]` in the field is doubled, so table A column `B][C` (`A[B]][C]`) and table `A[B]` column C (`'A[B]'[C]`) are two
// keys. A normal name keeps its text. Pure: texts in, texts out; no value of a table is ever read.
const BARE = /^([^'[\]]*)\[((?:[^\]]|\]\])*)\]$/, QUOTED = /^'((?:[^']|'')*)'\[((?:[^\]]|\]\])*)\]$/;

/** table and field names: their key. */
export const fieldKey = (t, c) => {
  const tn = String(t);
  return (/['[\]]/.test(tn) ? "'" + tn.replace(/'/g, "''") + "'" : tn) + '[' + String(c).replace(/]/g, ']]') + ']';
};

/** A key (or a typed 'Table'[Field] / Table[Field]) read back as { t, c }, or null when it is not one. */
export function parseFieldKey(text) {
  // a name with a control character (a tab, a line break) is no key a person can type: it never reads as one (as before)
  const s = String(text == null ? '' : text).trim(), m = /\p{Cc}/u.test(s) ? null : QUOTED.exec(s) || BARE.exec(s);
  return m ? { t: m[1].replace(/''/g, "'"), c: m[2].replace(/]]/g, ']') } : null;
}

/** What a person typed for a field ("Table[Field]", 'Table'[Field], a name written as it was before this key):
 *  its key, or null. A text that is not exactly a key reads as the older, looser form: the first "[" splits it. */
export function keyOfText(text) {
  const s = String(text == null ? '' : text).trim(), p = parseFieldKey(s);
  if (p) return fieldKey(p.t, p.c);
  const mk = s.match(/^'?(.+?)'?\[(.+)\]$/);
  return mk ? fieldKey(mk[1], mk[2]) : null;
}

/** A key's field name (the English name of a field): its column or measure, as the model names it. */
export const fieldOfKey = (k) => { const p = parseFieldKey(k); return p ? p.c : String(k).replace(/^.*?\[(.*)\]$/, '$1'); };
