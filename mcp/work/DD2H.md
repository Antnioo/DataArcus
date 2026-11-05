## Summary
- **Approval:** the brief "DD2H (0.3.2): one HTML escape for the pages and the approval window (family html)" (5 Nov);
  the owner D-1104-12 (one library, fix at the source), D-1104-15 (html is the reviewer's call, as CONTRACTS.md proposes).
- **Base:** `feat/0.3.2-dd2h` from `origin/integration/0.3.2` at 1730d919 (DD2T in). Push only this branch; never merge, no PR.
- **Scope:** CONTRACTS.md family html. One shared pure dual module `assets/js/html-escape.js` (CommonJS in Node,
  `window.DAHtmlEscape` / `self.DAHtmlEscape` in the browser; the shape of pbir-values.js): `htmlEsc(s)`, group B's
  answer. The 9 places keep their local name as a one-line alias. Not in this job: xml, attribute quoting rules, any
  page's own markup.
- **Plan, one commit each:** 1 this note; 2 the module, its .min.js, suite dd2h (tests.json beside the dd suites), its
  MODULES.md row; 3 approval-view.mjs reads it (createRequire); 4 the browser places read it, html-escape.min.js loaded
  before each page script (script tags, theme-generator.js's loaders), `npm run build:min`, sitemap lastmod; 5 the
  parity test (every place, every input), CONTRACTS.md html "One place" line. Then merge integration once if it
  moved, `npm run build:min`, every check, `gh workflow run tests.yml`, wait.
- **Copies before -> after:** 9 -> 1 (3 groups -> one answer per text). Same-shape (git grep of the chain
  `replace(/[&<>"']/g` in assets/js and mcp/lib, no .min.js): 9 files -> 1 (html-escape.js).
- **Answers that change (only these):** null and undefined give "" in exam-view, theme-generator and measure-builder
  (they gave "null" / "undefined"); measure-builder escapes `'` as `&#39;` (the browser reads it the same). No golden
  or page test changed its expected answer.
- **Expected checks:** dd2h new (got 15 after step 2, 175 after step 5); every other suite's number unchanged; lint 0;
  mutation 76/76; check-contracts, check-modules --strict, check-agent-memory, check-result-lines, check-min, stamps,
  sitemap-lastmod green; website `npm test` green; same-shape groups go down (9 -> 1).
- **Red proof (not committed):** `'` taken out of htmlEsc: dd2h FAIL 155 of 175 (H5 and H13, and both texts for each
  of the 9 places in P); restored.
- **State:** steps 1-5 done, integration merged once (d3d9bef4); the full run and CI next.
- **Resume:** read Results; if CI is not green yet, run it (`gh workflow run tests.yml --ref feat/0.3.2-dd2h`).

## Copies before -> after (each place)
| place | before | after |
|---|---|---|
| `assets/js/exam-view.js` `esc` (in mount) | its own chain, `String(s)` (A) | `const esc = HE.htmlEsc;` (HE: require in Node, `glob.DAHtmlEscape` in the page) |
| `assets/js/theme-generator.js` `esc` (the logo part) | its own chain, `String(x)` (A) | `const esc = window.DAHtmlEscape.htmlEsc;` |
| `assets/js/field-picker-ui.js` `esc` | its own chain (B) | `const esc = HE.htmlEsc;` |
| `assets/js/health-downloads.js` `esc` | its own chain (B) | `const esc = HE.htmlEsc;` |
| `assets/js/health-view.js` `esc` (in create) | its own chain (B) | `const esc = HE.htmlEsc;` |
| `assets/js/page-preview.js` `esc` | its own chain (B) | `const esc = HE.htmlEsc;` |
| `assets/js/svg-kpi-designer.js` `esc` | its own chain (B) | `const esc = window.DAHtmlEscape.htmlEsc;` |
| `assets/js/measure-builder.js` `escapeHtml` | its own chain, no `'`, `String(s)` (C) | `const escapeHtml = window.DAHtmlEscape.htmlEsc;` |
| `mcp/lib/approval-view.mjs` `esc` | its own chain (B) | `const { htmlEsc } = createRequire(import.meta.url)('../../assets/js/html-escape.js'); const esc = htmlEsc;` |

Loaded first: html-escape.min.js before exam-view (4 exam pages), before health-downloads (2 health check pages),
before svg-editor-store (2 SVG KPI pages), before measure-builder (2 pages), before theme-generator (3 pages);
theme-generator.js's loadBind before field-picker-ui and loadPreview before page-preview (each unless already there).

## The answers, before and after (the probe's 10 texts; dd2h adds 0, false, all five, a line break)
| input | A (exam-view, theme-generator) | B (six places) | C (measure-builder) | after (all 9) |
|---|---|---|---|---|
| it's | "it&#39;s" | "it&#39;s" | "it's" | "it&#39;s" |
| null | "null" | "" | "null" | "" |
| undefined | "undefined" | "" | "undefined" | "" |
| the other 7 | the same in all three groups | | | unchanged |

## Decisions I made
- approval-view.mjs takes `htmlEsc` by a destructured createRequire, not `HE.htmlEsc`: the probe reads a lib's
  destructured require (requiredOf) but cannot run `import.meta` in a definition read from source.
- The page-only scripts (svg-kpi-designer.js, theme-generator.js, measure-builder.js) read `window.DAHtmlEscape`, as
  measure-builder.js reads `window.DATmdlName` since DD2N; the probe gives them the page's window (`escPage`).
- On the SVG KPI pages the tag sits before svg-editor-store.min.js (sp25 and sp33 pin the order of the editor files;
  the escape is outside it).
- MODULES.md: the two page scripts that read the page's window are named without backticks (check-modules names a
  caller in backticks only when it loads the file), the pages that load it in backticks.
- No CHANGELOG line: nothing a person sees changes (no page escapes a missing text today; `&#39;` shows as `'`).
- The merge's conflicts were stamps only (TN2 changed time-names.js): ours kept, `npm run build:min` wrote every
  stamp; `sitemap-lastmod --write` moved one page's date and went in the merge commit.

## For the owner
none (no golden, twin or Desktop-measured test changed its answer).

## Risky changes
- A page whose script runs before html-escape.min.js would throw at load: every page that loads a place is pinned by
  dd2h L1-L3 and was run by its website suite.

## Seen, not in scope
- Other HTML escapes not in the ledger, by another shape (a `.replace(/&/g, '&amp;')` chain or textContent): not
  searched beyond the 9 places; a probe sweep for the next ledger.

## Lessons for the reviewer
- My first insert of the script tags matched `translations/theme-generator.min.js` and
  `translations/measure-builder.min.js` (the same file name) before the page script; build:min named the missing
  file at once. A tag inserted by a pattern needs the exact `assets/js/<name>` path.

## Results
