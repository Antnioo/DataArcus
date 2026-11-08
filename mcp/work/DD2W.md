## Summary
- **Approval:** the brief "DD2W (0.3.2): one toast and one copy helper for the website pages (Phase 2: toast, copy
  fallback)" (8 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-15 (the reviewer's DD1 plan, Phase 2).
- **Base:** `feat/0.3.2-dd2w` from `origin/integration/0.3.2` at 5cf96356 (BF2 in). Push only this branch; never merge, no PR.
- **Scope:** CONTRACTS.md "Equal copies, not probed": toast and copy fallback. One shared browser module
  `assets/js/page-toast.js` (`window.DAPageToast`, CommonJS in Node; the shape of html-escape.js): `toast(msg, { ms, el, cls })`,
  `boxToast(id, className)`, `copyText(text, node, { done, selected, toast })`. Every place keeps its local name as a
  one-line alias; every message stays where it is, as typed. Not in this job: health-view's textarea copy (a different
  question: named in "Not one question"), the health worker's address and the area labels (Phase 3), any wording, BF1, mcp/.
- **Plan, one commit each:** 1 this note; 2 the module, its .min.js, website suite dd2w (a fake document; plus each page
  that loads a place), its MODULES.md row; 3 the four `#toast` pages (calendar 1800, measure builder 1800, theme
  generator 1800, SVG KPI 2200), page-toast.min.js before each page script, stamps, ar-pages; 4 the four select
  fallbacks (calendar, measure builder, SVG KPI, theme-download-ui) read `copyText`; 5 exam-view (2200, dpToast) and
  health-view (1800, mhToast) through `boxToast` if the box's markup stays byte-identical (else the reason here),
  CONTRACTS.md rows, check-contracts. Then merge integration once, build:min, sitemap, every check, CI, wait.
- **Copies before -> after:** toast 6 -> 1 (4 by opacity on `#toast`, 2 boxes by the class `show`: `cls` names it);
  select fallback 4 -> 1. Same-shape (git grep `selectNodeContents` and `clearTimeout(toast` in assets/js, no .min.js):
  4 and 4 files -> page-toast.js only.
- **Answers that change:** none (every message, time, element and class as today).
- **Expected checks:** dd2w new (number after step 2); check-contracts 715 -> about the same (rows renamed, not added);
  the pinned split tests (sp5 sp7 sp8 sp10 sp12 sp13 sp14 sp16 sp28 sp30 sp39 sp43, scripts sp12 sp25 sp31-sp34 sp36)
  unchanged except a guard that pins a requires list, allowed on purpose and said per test; website suites tools, dax,
  theme-generator, theme-generator-lab, svg-kpi, sp25, sp31, pbip, model-health, gulf-calendar green; lint 0.
- **Red proof (planned):** `clearTimeout` taken out of toast: dd2w's "second call clears the first timer" fails.
- **State:** step 1, plan pushed 2026-11-08T16:30Z.
- **Resume:** step 2 (the module and dd2w).
