## Summary
- **Approval:** the brief "DD2H (0.3.2): one HTML escape for the pages and the approval window (family html)" (5 Nov);
  the owner D-1104-12 (one library, fix at the source), D-1104-15 (html is the reviewer's call, as CONTRACTS.md proposes).
- **Base:** `feat/0.3.2-dd2h` from `origin/integration/0.3.2` at 1730d919 (DD2T in). Push only this branch; never merge, no PR.
- **Scope:** CONTRACTS.md family html. One shared pure dual module `assets/js/html-escape.js` (CommonJS in Node,
  `window.DAHtmlEscape` / `self.DAHtmlEscape` in the browser; the shape of pbir-values.js): `htmlEsc(s)`, group B's
  answer. The 9 places keep their local name as a one-line alias (`const esc = HE.htmlEsc;`). Not in this job: xml,
  attribute quoting rules, any page's own markup.
- **Plan, one commit each:** 1 this note; 2 the module, its .min.js, suite dd2h (tests.json beside the dd suites), its
  MODULES.md row; 3 approval-view.mjs reads it (createRequire); 4 the browser places read it, html-escape.min.js loaded
  before each page script (script tags, theme-generator.js's loaders), `npm run build:min`, sitemap lastmod; 5 the
  parity test (every place, every input), CONTRACTS.md html "One place" line. Then merge integration once if it
  moved, `npm run build:min`, every check, `gh workflow run tests.yml`, wait.
- **Copies before -> after:** 9 -> 1 (3 groups -> one answer per text).
- **Answers that change (only these):** null and undefined give "" in exam-view, theme-generator and measure-builder
  (they gave "null" / "undefined"); measure-builder escapes `'` as `&#39;` (the browser reads it the same). If a golden
  or page test changes its expected answer beyond these: stop, "## For the owner".
- **Expected checks:** dd2h new (about 40 checks after step 2, about 130 after step 5; exact numbers in Results); every
  other suite's number unchanged; lint 0; mutation 76/76; check-contracts, check-modules --strict, check-agent-memory,
  check-result-lines, check-min, stamps, sitemap-lastmod green; website `npm test` green (exam pages sp34, health
  check sp24/sp32, theme generator sp31/pbip/theme-generator, SVG KPI designer sp25/sp33, measure builder dax/dd2n);
  same-shape groups go down (9 HTML escape chains -> 1).
- **Red proof (not committed):** take `'` out of htmlEsc; dd2h fails on `it's` for every place.
- **State:** step 1.
- **Resume:** step 2.
