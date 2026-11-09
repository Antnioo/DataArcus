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
CI green: https://github.com/Antnioo/DataArcus/actions/runs/41978502098 on 8e1f5854be2818e9c1c86898c85339ce058364a4
- **State:** DONE (Linux and Windows; macOS runs where the reviewer merges).
- **Resume:** none; the reviewer reads and merges.

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
- sp8 M2 pins field-picker-ui.js to no `require(` at all: the full run caught it, the targeted website suites did
  not (sp8's Node half lives in mcp/). The brief's list of split tests (sp10, sp26, sp30, sp42) missed sp8; a grep of
  mcp/test-*.mjs for the edited file's name before the run finds them.
- My first insert of the script tags matched `translations/theme-generator.min.js` and
  `translations/measure-builder.min.js` (the same file name) before the page script; build:min named the missing
  file at once. A tag inserted by a pattern needs the exact `assets/js/<name>` path.

## Results
- Base (1730d919, before any change): MCP as CI's 5 shards side by side, all exit 0 (210 result lines).
- Step 4: the website suites that load each page, 17 of 17 PASS (tools 399, model-health 255, consent 38,
  theme-generator 922, theme-generator-lab 922, pbip 111, dax 51, svg-kpi 854, gulf-calendar 913, sp8 3, sp12 3,
  sp24 23, sp25 22, sp33 34, sp32 39, sp34 18, sp31 17).
- Merged origin/integration/0.3.2 once at 6087c735 (TN2) in d3d9bef4: stamps only in conflict, `npm run build:min`.
  Integration moved again (cd7392f8, DD2U) after it: not merged (L-1103-04).
- On ae82cf0b: the same 5 shards, every suite's number as on the base but dd1a 311 -> 319 (TN2's own, from
  integration), dd2h 175 (new), and sp8 FAIL, 1 of 19 checks failed (M2, see Lessons); fixed in 8e1f5854 (sp8 19 PASS; sp10 113,
  sp26 26, sp30 21, sp42 22 PASS). Mutation 76/76 killed (198 checks). Lint exit 0; check-contracts 710 (28 families,
  99 places); check-modules --strict 1160; agent-memory, result-lines, literal requires, site config, stamps,
  changelog-words, check-min PASS. The probe: html 9 places, 0 of 10 disagree.
- CI run 41978502098 on 8e1f5854: green (MCP Linux and Windows 5 shards each, the website's 3 suites shards and checks).
