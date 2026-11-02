# OP1 (0.3.2): one place per fact, the text sizes and fonts (B-283)

## Summary
- **Approval:** the brief "OP1"; the owner D-1016-01 (one place for every fact), D-1101-01 (0.3.2 with the rest),
  D-1102-02 (this job; CI on the branch is the gate).
- **Base:** `feat/0.3.2-one-place` from `origin/integration/0.3.1` at e75d432. Push only this branch; never merge.
  Merges only after 0.3.1 ships.
- **Scope:** one owner per fact, every other place reads it:
  - `assets/js/text-measure.js` (the owner; no dependencies, already loaded by every engine that sizes text and on the
    three generator pages, so no new script and no packaging list change): `boxH`, `buttonH`, `slicerH`, `TEXT_MIN`
    and `TEXT_MAX` (8..60), `ptIn`, `FONTS`, `AR_FONTS`, `MEASURED_FONTS`, `measuredFont`.
  - `assets/js/design-engine.js`: `DEFAULT_PAGE` ('1920x1080', the default page; 1280x720 stays the historical
    upgrade); its FONTS, AR_FONTS, MEASURED_FONTS and 8..60 read text-measure.js.
  - Readers: `report-rules.js` (BOX, BTN_H, SLICER, measuredFont, TEXT_MIN/MAX), `pbip-sizing.js`, `pbip-page.js`,
    `design-engine.js` (the rail's dropdown), `theme-generator.js` (the font select rendered from the catalog, the
    page choices from PAGES and DEFAULT_PAGE), `mcp/lib/design.mjs`, `approval-window.mjs`, `report-inputs.mjs`.
  - Both generator pages (EN, AR) and the lab page: no `<option>` copy of the fonts; text-measure.js loads before
    design-engine.js.
- **The one behaviour change:** a button's height. Writer `ceil(2 + 1.6 x pt x lines)` vs checker `ceil(6 + 1.6 x pt)`
  -> both `ceil(6 + 1.6 x pt x lines)`. Not the writer's rule: the laptop's note (DESKTOP-TESTS.md 2026-10-01, the
  Reset button, Desktop 2.158.1177) measured Arabic button text whole only from 6 + 1.6 x pt (19 at 8pt, 30 at
  15pt); the writer already uses 6 + 1.6 in five of its six button places (Reset, Close, the Arabic page buttons, the
  tabs row); 2 + 1.6 was left only in the English page navigator's fit (pbip-page.js). Lines kept from the writer.
- **Expected checks:** new suite `op1` (area report) about 14 checks, red on e75d432 first except the guards' own
  self-tests: G1-G4 the guard (formula constants, font lists, font options in HTML, the page default written outside
  the owner); S1-S6 one rule (checker = writer for t 8..60, lines 1..2; the font lists the same object; button 19, 30,
  38, 51 at 8, 15, 10x2, 14x2 pt). Website `design-engine` suite: the font check reads the rendered select (said).
  Every other suite, golden tasks and the site's pictures unchanged unless a page navigator's fit moves (each said).
- **Got:** (filled at the end)
- **State:** PLAN.
- **Resume:** implement, then the area runs, then CI on the branch.

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
