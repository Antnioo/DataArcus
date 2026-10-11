// Readable display names for database-style field names (0.2.9, the laptop's sweep of rc.1, S6: titles and slicer
// headers showed "ProductName", "facility_city", "loan_intent", "Enforcement_History (groups)"). By the owner's rule a
// name is never changed silently: plan_layout only PROPOSES these, the user approves or changes each, and create_report
// shows only the approved ones (its displayNames); the model is never renamed. Pure, any model: no word lists.
//   snake_case and kebab-case: words split at _ and -, each capitalised when it was all lower case
//   camelCase and PascalCase: words split where a lower-case letter or digit meets an upper-case one; an acronym stays
//     ("CustomerID" -> "Customer ID", "HTTPStatus" -> "HTTP Status")
//   Power BI's own group-column suffix " (groups)" is left out
// Returns the proposal, or null when the name already reads as words (nothing to ask).
export function readableName(name) {
  const raw = String(name == null ? '' : name);
  let s = raw.replace(/\s*\(groups\)\s*$/i, '').replace(/[_-]+/g, ' ');
  s = s.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2').replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2');
  s = s.split(/\s+/).filter(Boolean).map((w) => (w === w.toLowerCase() && /^\p{L}/u.test(w) ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
  return s && s !== raw ? s : null;
}
