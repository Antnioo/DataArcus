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
(numbers: below, filled after the full run)

## CHANGELOG line
- **Glass by default:** new reports and themes now start in the glass look: the Theme Generator opens on it,
  generate_theme gives it, and every new report create_report writes has it, with the soft page picture behind every
  page. It is used only where every text stays readable: with colours where it can't (a pale brand colour, say), the
  report or theme is plain and the plan says why. The plain look is one choice away ("Plain" in the Theme Generator,
  `chart.look: "auto"` or `"plain"` for the tools). A report you already have keeps its own look: a redesign, the
  Arabic twin and the copy in English and Arabic don't change it.

## Decisions I made
1. **The plain option's name** is what exists, `chart.look: "auto"` (Power BI's own cards; a saved design's value);
   the tools also take `"plain"` (one word less to get wrong). The website's control: "Glass (default)" and "Plain".
2. **Where the default lives:** one constant, the engine's `DEFAULT_LOOK`; `CHART_DEFAULTS.look` stays "auto", so a
   design saved without a look (the website's localStorage, a design JSON) keeps the look it was made with: plain.
   The default is applied where a NEW design is made: the generator's first visit, generate_theme, planLayout (every
   plan_layout and create_report with a design). themeDesign itself adds no look: the redesign's restyle uses it.
3. **The gate (glassFit):** glass only when the cards keep some transparency (t > 0) and every glass check passes; a
   failure of the page's own text on its own colour once the picture is already plain (GL1's C4) is not glass's (plain
   fails it the same). Contrast wins over an asked glass too ("never a glass report that fails contrast"); an asked
   plain is always plain. The website does the same: colours where glass can't pass switch the page to Plain, said.
4. **The twin mirrors glass pages:** the twin keeps a page drawn on a background picture left to right (its panels);
   with glass as the default every new report had one, so its twin stopped mirroring (rc24, look-options, flip-cards,
   theme-icons failed). The engine's glass PNG now carries a tEXt mark ("DataArcus glass look", right after the
   header); the twin treats that picture (soft colour fields, no panels) as no picture. Its page keeps the picture.
5. **The approval page** names the glass picture under Files ("Page backgrounds (the glass look's soft picture...)"),
   as T-6 named the blank pixel, and has a "Card look" row in "Look and options".
6. **The sample project** is unchanged: its report is empty (no theme); a report planned on it takes the default.
7. **Hand-placed pages and a native copy** have no design, so no look of DataArcus's: their theme as given.
8. **Saved Theme Generator designs** keep their look; the "Load example" button's design (no look, its own panels in
   the background picture) stays plain.
9. **A small cache of glass PNGs** (8, by colours, strength and size, a copy each call): every new report now draws the
   picture in its plan and again in its write.

## For the laptop
On the next batched run (Desktop, harness.ps1, full-size crops):
1. A new report on the sample project (plan_layout sample, then a report on it) and on a made-up model, EN and AR,
   light and dark (generate_theme mode "dark"): glass by default; tables and matrices see-through (GL2); every text
   readable; the soft picture behind every page; Refresh, then screenshot every page.
2. The same with `chart.look: "auto"` (or "plain"): solid cards, no picture.
3. The Arabic twin of a glass report: mirrored (KPI values right, charts mirrored), the picture kept behind.
4. A pale brand colour (#FFD54F): the plan says plain and why; the report solid.
5. The website: a fresh browser opens the Theme Generator on glass; Plain one click away.

## Seen, not in scope
1. A theme file from generate_theme (now glass by default) used with hand-placed pages gives see-through cards over
   the plain page colour, without the picture (GL1's Seen 3, now more likely).
2. The approval page's preview (page-preview.js) still draws a glass report's pages with solid cards and no picture
   (GL1's Seen 1); every new report is now glass, so the preview differs from the report more often.
3. Before GD1 the twin of an explicitly glass report already stayed left to right (the same cause as decision 4):
   nobody had twinned one.
4. The twin's page keeps the glass picture unmirrored: its colour fields are not where the English page has them
   (no panels, so nothing sits wrong).
