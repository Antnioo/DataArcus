// Readable display names for database-style field names (0.2.9, the laptop's sweep of rc.1, S6: titles and slicer
// headers showed "ProductName", "facility_city", "loan_intent", "Enforcement_History (groups)"). By the owner's rule a
// name is never changed silently: plan_layout names each one in the plan (its default since design round 8), the user
// approves or changes each, and create_report shows only the approved ones; the model is never renamed. Pure, any
// model: no word lists. Only a name made like an identifier (letters, digits, _, - and spaces) gets a proposal: a name
// with other signs ('Sales "x" -- ]y') or with spaces ("Total net sales") is shown as the model has it (round 8).
//   snake_case and kebab-case: words split at _ and -, each capitalised when it was all lower case
//   camelCase and PascalCase: words split where a lower-case letter or digit meets an upper-case one; an acronym stays
//     ("CustomerID" -> "Customer ID", "HTTPStatus" -> "HTTP Status")
//   Power BI's own group-column suffix " (groups)" is left out
// Returns the proposal, or null when the name already reads as words (nothing to ask).
export function readableName(name) {
  const raw = String(name == null ? '' : name);
  if (!/^[\p{L}\p{N}_\- ]+(\s*\(groups\))?$/u.test(raw)) return null;
  // a name with spaces already reads as words ("Total net sales"): left as the model has it
  if (/\s/.test(raw.replace(/\s*\(groups\)\s*$/i, ''))) return null;
  let s = raw.replace(/\s*\(groups\)\s*$/i, '').replace(/[_-]+/g, ' ');
  s = s.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2').replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2');
  s = s.split(/\s+/).filter(Boolean).map((w) => (w === w.toLowerCase() && /^\p{L}/u.test(w) ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
  return s && s !== raw ? s : null;
}

// A name the user approved, as it is written into the report (the outside review of rc.12, R-04): control characters
// (\p{Cc}: a tab, a line break, C1) become a space, as before; a format character (\p{Cf}: a direction override or
// isolate, a zero-width space, a byte order mark) is refused, never removed silently, so the name the user saw is the
// name written. The zero-width non-joiner and joiner (U+200C, U+200D) stay: Arabic and Persian text uses them.
// One rule for every name the tools write: create_report's display names, plan_layout's, the twin's labels.
const HIDDEN = /(?![‌‍])\p{Cf}/u;
export function writtenName(s, what) {
  const raw = String(s == null ? '' : s), ch = HIDDEN.exec(raw), name = raw.replace(/\p{Cc}/gu, ' ').trim();
  if (ch) throw new Error(`${what}: the name has an invisible sign (U+${ch[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}) that can change how it reads; nothing was written. Write the name without it, show it to the user again and wait for their go.`);
  return name;
}
