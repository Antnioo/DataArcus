# GD1 (0.3.1, the owner, 27 Oct): the glass look is the default for new reports and themes

## Summary
- **Approval:** the reviewer's brief "Go on GD1"; the owner, 27 Oct: "i want to make the glassy dashboard default",
  "Everywhere": the Theme Generator, generate_theme and every new report create_report writes start in the glass look;
  the plain look one click / one option away.
- **Scope:** `assets/js/design-engine.js` (DEFAULT_LOOK, glassFit: the gate) and `.min.js`;
  `assets/js/theme-generator.js` (opens on glass, "Plain" one click away, the gate) and `.min.js`, its translations, the
  generator's EN page (AR by `ar-pages --write`); `mcp/lib/design.mjs` (the look for a new design: lookFor),
  `mcp/tools/generate_theme.mjs`, `mcp/tools/plan_layout.mjs`, `mcp/lib/report-run.mjs`, `mcp/lib/approval-window.mjs`
  (the look's row); the new suite `mcp/test-0.3.1-glass-default.mjs`; the tests that pin the default look (each said
  below); TOOLS.md, README, the MCP page's 0.3.1 list, CHANGELOG, WORK.md, this note. Not TT1's (titles), BD2's
  (text-measure.js), CS2's (redesign.mjs, text-format), NC3's (native-copy.mjs).
- **Base:** `feat/0.3.1-glass-default` from `origin/integration/0.3.1` (6f106a3). Push only this branch.
- **Expected checks:** (written before the work) the new suite `glass-default` about 35 checks, red first (no default,
  no gate, no plan line); `run-all theme-generator design-engine pbip`: the baseline's counts plus the new website
  checks (opens on glass, Plain one click away, EN and AR), the sections that pin the plain default made plain
  explicitly (said each); design-engine and pbip unchanged (CHART_DEFAULTS unchanged: every saved design's theme byte
  for byte); `npm test -- report`: the baseline + 1 suite; `-- core`: golden's changes said task by task; full run
  +1 suite.
- **Resume:** the plan (this commit); then the work.

## The plan
1. **One default, one gate, in the engine** (`design-engine.js`): `DEFAULT_LOOK = 'glass'`; `glassFit(d)`: glass fits
   when the cards keep some transparency (t > 0) and every glass check passes (text, labels, colour 1, the grid, the
   band on the see-through cards; the page's text on the picture), a failure of the page's own text on its own colour
   (the picture already plain, strength 0) excepted: the plain look fails it the same way. `CHART_DEFAULTS.look` stays
   "auto": a saved design without a look keeps the look it was made with (plain).
2. **The plain option's name:** what exists, `chart.look: "auto"` (Power BI's own cards); the MCP takes "plain" as
   the same (one word less to get wrong). The website's control: "Glass" and "Plain".
3. **The Theme Generator:** a first visit (nothing saved) opens on glass; Card look "Glass" first, "Plain" beside it;
   a saved design keeps its own look. With colours where glass can't pass, the page goes to Plain and says why.
4. **generate_theme:** no look asked: glass when it fits, else plain with why (sayInPlan and `look`).
5. **plan_layout / create_report:** a design without a look (none given, or one without `chart.look`) gets glass when
   it fits, else plain with why; an asked look ("auto"/"plain" or "glass") wins, glass still only where it fits. The
   plan's `look` block and the approval page's row: "Glass look (default); plain: chart.look \"auto\"". The pin carries
   the look (the design). The soft page picture into StaticResources as GL1 (report-run).
6. **What does not change:** the redesign (themeDesign without a look: plain, as the original), the Arabic twin and the
   EN-AR copy (no design: the original report's files), hand-placed pages (no design: their theme file as given). The
   sample project: its report is empty (no theme); a report planned on it takes the default.
7. **Tests:** every test that fails only because the default changed is said below with its plain case kept.

## Results
(after the work)

## CHANGELOG line
(after the work)

## Decisions I made
(after the work)

## For the laptop
(after the work)

## Seen, not in scope
(after the work)
