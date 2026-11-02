# OP1 (0.3.2): one place per fact, the text sizes and fonts (B-283)

## Summary
- **Approval:** the brief "OP1"; the owner D-1016-01 (one place for every fact), D-1101-01 (0.3.2 with the rest),
  D-1102-02 (this job; CI on the branch is the gate).
- **Base:** `feat/0.3.2-one-place` from `origin/integration/0.3.1` at e75d432. Push only this branch; never merge.
  Merges only after 0.3.1 ships.
- **Scope:** `assets/js/text-measure.js` owns `boxH`, `buttonH`, `slicerH`, `boxFit`, `TEXT_MIN`/`TEXT_MAX` (8-60),
  `sizeIn`, `ptIn`, `FONTS`, `AR_FONTS`, `MEASURED_FONTS`, `measuredFont`; `design-engine.js` owns `DEFAULT_PAGE`.
  Readers: report-rules.js, pbip-sizing.js, pbip-page.js, design-engine.js, theme-generator.js (the font select drawn
  from the catalog, the page choice from DEFAULT_PAGE), mcp/lib/design.mjs (exports DEFAULT_PAGE, DEFAULT_PAGE_W/H),
  approval-window.mjs, report-inputs.mjs. The three generator pages: no `<option>` copy; text-measure.js before
  design-engine.js. Website suite design-engine.mjs: its loader gives the engine a require; the font check reads the
  rendered select.
- **The one behaviour change:** a button's height: writer `ceil(2 + 1.6 x pt x lines)` and checker `ceil(6 + 1.6 x pt)`
  -> both `ceil(6 + 1.6 x pt x lines)` (why: "Decisions I made" 1). The checker gives the same numbers as before (it
  only passed one line); the writer's English page navigator now needs 4 more height (no suite moved).
- **Expected checks:** (written first, c1d4b07) `op1` about 14, red on e75d432 first except the guard's self-test;
  every other suite unchanged; the website's design-engine font check reads the rendered list.
- **Got:** `op1` 16 checks, red on e75d432 first: 15 of 16 failed there (G5, the guard's own patterns, passes on both,
  as planned). Areas on ced72e43 vs the base e75d432 (same machine): report 43 suites (base 42 + op1), checker 7,
  arabic 15, model 14: every suite's count the same as on the base (glass-tables 113 on both once git history is there:
  a shallow clone lacks cba24a5). core: 1 check failed on ced72e43 (A2-8, server files call no E.*: report-inputs.mjs
  read E.PAGES), fixed in 87dadbf9 (design.mjs exports the size). Website: design-engine 600 (+2 on purpose, below),
  theme-generator 922, theme-generator-lab 922, pbip 111, layout 512, layout-canvas 31 (base e75d432: 598, 922, 922, 111, 512, 31). Lint 0;
  check-min 75 match; site config PASS; csp, ar-pages up to date. Rendered EN and AR: 8 fonts, no page error.
- **Final runs after 87dadbf9:** report 43, checker 7, arabic 15, model 14 suites passed (counts as above); core: CORE2.
  CI 41398188138 red: the sitemap dates (written now), theme-logo.mjs's loader (no require), op1 G3 on Windows only
  (CRLF lines kept a comment; red with the old splitter, G5 now tests it): fixed in the next commit; theme-logo 753 = base.
- **State:** CI on the branch (running).
- **Resume:** the reviewer's merge after 0.3.1 ships; the laptop's button check (below); the TK1 follow-up.

## Before -> after
- Text box height: 2 places (report-rules.js:67, pbip-sizing.js:127) -> text-measure.js `boxH` (+ `boxFit`, its
  inverse, was pbip-sizing.js:167).
- Dropdown height: 3 places (report-rules.js:75, pbip-sizing.js:128, design-engine.js:375) -> `slicerH`.
- Button height: 7 places, 2 rules (report-rules.js:68; pbip-sizing.js:127, :159, :165; pbip-page.js:57, :663, :1238)
  -> `buttonH`, one rule.
- Measured fonts: 2 lists, one lower-cased (design-engine.js:25, report-rules.js:63) -> `MEASURED_FONTS`,
  `measuredFont` (byte-for-byte the checker's old test). text-measure.js's own Tahoma width rule is not a list (kept).
- Offered fonts: design-engine.js:19 and :27 + 3 HTML copies (EN, AR, lab) -> `FONTS`, `AR_FONTS`; the select is
  drawn by theme-generator.js.
- 8-60: design-engine.js:555, :587, pbip-sizing.js:126, report-rules.js MEASURED -> `TEXT_MIN`, `TEXT_MAX`, `sizeIn`,
  `ptIn` (MEASURED.TEXT_MIN/MAX are getters on them).
- Default page: design-engine.js:295, :1259, :1269, theme-generator.js:431, :1031, design.mjs:255,
  approval-window.mjs:469, report-inputs.mjs:35 -> `DEFAULT_PAGE` (design-engine.js:287 PAGES keeps the size list).
- The guard (op1 G1-G4) reads assets/js (not .min.js), mcp/lib, mcp/tools, mcp/server.mjs, code only (comments out):
  a formula's constants, the 8-60 clamp, two catalog fonts quoted on one line, a font `<option>` on a generator page,
  '1920x1080' or default(1920/1080) outside the owner. Allowed until TK1: tool-limits.mjs, tool-inputs.mjs,
  plan_layout.mjs; check-report.mjs (Power BI's standard sizes, not the default).

## Tests changed on purpose
- scripts/tests/design-engine.mjs, "the fonts on both pages are the engine's": was the HTML `<option>` list = E.FONTS
  (1 check a page); now the page has no option (1) and the rendered list = E.FONTS (1): +1 a page, 2 pages, +2.
- Its `load` gives the engine a `require` (the .min.js of the dependency): the engine now reads text-measure.js.
- No other suite's expected number changed.

## CHANGELOG line
- **One place for each text size rule and the font list:** a button's height is the same in the report writer and in
  check_report (the measured Arabic rule), and the Theme Generator's font list comes from the same list the tools use.

## Decisions I made
1. The button rule: 6 + 1.6 x pt a line, not the writer's 2 + 1.6. The brief: the writer's rule "unless a test or a
   laptop note says otherwise"; the laptop's note does (DESKTOP-TESTS.md, 2026-10-01, Desktop 2.158.1177: Arabic
   Reset text cut at 14-16, touching at 17-18, whole from 19 at 8pt; 30 at 15pt; "Rule from the larger of the two
   (Arabic): 6 + 1.6 x pt"), and the writer itself already used 6 + 1.6 in its Reset, Close, Arabic page buttons and
   tabs row; 2 + 1.6 was only in the English page navigator's fit. Lines kept from the writer (6 + 1.6 x pt x lines).
2. The owner file: text-measure.js, not a new text-metrics.js: it has no dependencies, every engine that sizes text
   already reads it, the generator pages and the writer's BUILDER list already load it, so no new script, stamp list
   entry or package file. The default page stays in design-engine.js beside PAGES.
3. design-engine.js reads text-measure.js at load: the three pages load text-measure.min.js before it (moved up).
4. The guard flags code, not prose: the formulas in comments and docs (DESKTOP-TESTS.md, RULES) are the measurements'
   record. Tests that restate a number as an expected value (mcp/test.mjs:1486, :2319, scripts/tests/*) are left:
   an independent expectation, not a second owner.
5. Stamps: one new stamp, 20261102op1, for the six changed scripts (design-engine, text-measure, pbip-sizing,
   pbip-page, report-rules, theme-generator) on every page and in theme-generator.js's BUILDER and CHECK lists.

## For the owner
none

## Risky changes
- The English page navigator (a header with pages that fit neither as tabs): it now needs 6 + 1.6 x pt of the
  header's height, not 2 + 1.6: on a very low header its text can step down one point, or the page gets no navigator
  (said in the plan as "no page buttons"). No suite or golden task moved.

## For the laptop
- One button (an actionButton with text, Segoe UI and Tahoma, EN and AR) at 1 and 2 lines, 10 and 14 pt, sized by the
  new rule: 22 (10pt, 1 line), 38 (10pt, 2), 29 (14pt, 1), 51 (14pt, 2): the text whole, nothing cut at the bottom.
  And one English page navigator in a 64-high header at 1920 x 1080 (unchanged expected).

## Seen, not in scope
- theme-generator.js's font note names the Arabic fonts in prose (EN and AR, "Segoe UI, Tahoma or Arial", AR_FONTS
  less Semibold): drawn from AR_FONTS it would change the Arabic text, which needs an approved draft.
- check-report.mjs:550 lists Power BI's standard page sizes itself (a second list beside design-engine.js PAGES).
- pbip-page.js:652 (`title.h / (1.8 * t)`) and report-rules.js PAGE_TWO_LINES (3.5 / 3.2 x pt): a page button's two
  lines, a separate measured rule written in two forms; worth one owner next.
- The 0.45 em button text width is in report-rules.js BTN_TW and pbip-page.js:663 (`0.45 * 4 / 3`).
- Test runs on a shallow clone fail glass-tables N0 (it reads cba24a5 from git history).

## Lessons for the reviewer
- The architecture test A2-8 (server files reach the engine only through design.mjs) caught an `E.` in
  report-inputs.mjs: export from design.mjs, never import E into a server module.

## Plan
1. text-measure.js: the sizes, the range and the font catalog (exported); the guard suite `op1` written first, run
   on e75d432 (red), registered in mcp/tests.json.
2. Readers changed to import; HTML option copies removed; the select filled by theme-generator.js before the state
   is shown; script order on the three pages.
3. `npm run -s build:min`, new ?v= stamps (one per script path), csp, ar-pages, sitemap.
4. Areas: report, core, arabic, checker, model; website suites design-engine, theme-generator, report-check, pbip;
   lint 0; a rendered check of both generator pages (EN, AR).
5. CI: tests.yml on the branch, waited for.

## Follow-up after TK1 merges (not in this job: TK1 owns these files)
- The default page '1920x1080' also written in mcp/lib/tool-limits.mjs:18, mcp/lib/tool-inputs.mjs:25-26,
  mcp/tools/plan_layout.mjs:181, :313, :314: read design-engine.js DEFAULT_PAGE (the guard G4 names them as allowed
  until then).
