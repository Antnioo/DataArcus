# Seeing the result: how the AI can look at what Power BI Desktop draws (R1, 20 Oct 2026)

Research and prototypes, cloud builder; branch `research/see-the-result`. Nothing here is a tool, and no default changed.
The plan and the results are in `mcp/work/R1-see-the-result.md`.

## The gap
The owner, 20 Oct, after an honest review of 0.3: "It can't see the result. Neither of us sees what Desktop actually
draws until the laptop run. A designer works by looking and adjusting." Today DataArcus judges a report from its files
(the design lint, `check_report`'s measured rules, the approval page's preview drawn by `assets/js/page-preview.js`).
Every rule is a measurement someone took in Desktop once; whatever nobody measured is invisible until the laptop opens
the report: a title that wraps, a table's last column behind a scrollbar, month labels that slant, an empty card, an
Arabic header cut.

## What we already know (evidence in this repo)
- **The preview places boxes right, and misses what is inside them.** J12 (19 Oct, `mcp/work/archive/WORK-2026-10-15-22.md`): the laptop compared
  the preview with Desktop's PDF export of the same written reports: every box within 4 units; titles, cut table columns,
  slanted labels and the side of a KPI's value were wrong until fixed one rule at a time. D5 (19 Oct): the preview called
  titles «مقطوع» (cut) that Desktop drew whole. Each fix was a new measurement in Desktop.
- **The plan's slots are not the report.** Measured here (prototype 2, below): the design engine's slots against the
  report the writer writes from them score 0.15 to 0.50 (frame IoU, missing and extra counted 0) on the fixtures'
  planned pages: the writer adds page buttons, header bars and panels and moves boxes. Only a drawing of the WRITTEN
  report can be judged; the approval page already draws the written pages (0.3.0 D5, PM-5).
- **Desktop is drivable on the laptop, with quirks** (`mcp/CLAUDE.md`, `scripts/tests/DESKTOP-TESTS.md`): the bridge CLI
  (`status`, `open`, `reload`, `screenshot <page-id>`); `screenshot-all` fails on generated projects (one page at a
  time); a capture right after opening caught empty cards ("about 20 seconds more than the script's wait"); 2.159 says
  "not loaded after 45 s" while it is still loading (record the pid, wait on the window); capture the Desktop window by
  its handle; never touch the user's browser; close only its own windows. The bridge's page capture includes the
  Filters pane. A test model's Power Query rows must be a typed `#table` (untyped: every column text, every SUM fails);
  a Power Query table in a project opens EMPTY until a refresh, a DAX table opens with its data and a refresh banner.
- **The Power BI service needs an account and a capacity.** Microsoft Learn, "Export Power BI report to file": the
  `exportToFile` API needs the report in a workspace on a Premium, Embedded or Fabric capacity (not Premium Per User);
  PNG export needs the tenant setting "Export reports as image files", off by default. "Capacity and SKUs in Power BI
  embedded analytics": publishing needs a Pro or PPU licence; embedding in production needs a capacity (A, EM, P or F).

## The four options

| | (a) Shadow-data render | (b) Calibrated in-browser renderer | (c) Real-data screenshots, opt-in | (d) Power BI service / embed |
|---|---|---|---|---|
| What draws | Power BI Desktop itself, on a made-up copy of the model | our renderer (page-preview.js grown up) | Power BI Desktop, on the real model | the service, on a published copy |
| Fidelity | Desktop's own layout, fonts, wrapping, scrollbars, Arabic shaping; values made up | as good as its calibration; drifts with each Desktop release | exact | exact (service rendering, close to Desktop) |
| Privacy | no data values in the images (see below) | no data, no images of the report | the report's numbers go to the AI app | the model and data leave the machine |
| Platforms | Windows with Desktop | everywhere (browser, Node) | Windows with Desktop | anywhere with an account |
| Speed (est.) | 30-90 s a report (open, load, ~20 s settle, a page at a time) | milliseconds a page | same as (a) | minutes (publish, export job, poll) |
| Cost | none (Desktop is free) | none | none | Pro or PPU to publish, a capacity for export/embed |
| Effort | medium: generator (done, prototype), the driver (the lab has it by hand), the loop | high and never done: every visual type, every Desktop release | small on top of (a) | high, and needs the user's tenant |

### (a) Shadow-data render on the user's own machine
DataArcus writes a throwaway copy of the model: the same tables, columns, types, formats, sort-by columns, hierarchies,
relationships and measures (their DAX kept), with made-up typed rows; points the WRITTEN report at it; opens it in
Power BI Desktop in a temporary folder; captures each page; closes its own window; deletes the folder; returns the
images. The real model is never opened or changed.
- **What the AI can then judge, reliably:** cut titles and wrapped titles (Desktop's own wrap), overlaps and visuals
  under others, empty panels and "(Blank)" categories, label slant and dropped labels, scrollbars in tables and bar
  charts, density and white space, colour balance (the theme's colours as Desktop applies them, how many series show),
  Arabic right to left (Desktop's own shaping, the order of pages and buttons, the side of values and axes), the
  visual's own error states (a broken field reference shows Desktop's error, which the files can't). **Not reliably:**
  whether a number's SIZE fits (made-up values have made-up magnitudes: a card "4.2K" where the real one is "12.4M");
  whether a category's real labels are long (made-up words are chosen to vary in length, 4 to 14 letters, but are not
  the user's); sparsity (a real filter that leaves few rows).
- **Mitigations for magnitude:** the generator could scale made-up amounts to the format string's unit (K/M), or, in
  S2, take an order of magnitude the user types ("sales are in millions") without reading data.
- **Privacy (against `mcp/PRIVACY.md`):** section 3 holds for the rows: no row value of the model is read or written
  (the generator reads the definition only; the model's DATATABLE and "Enter data" rows are replaced, never copied:
  test S-13). What the images still show, and the page must say: (1) names (tables, columns, measures, titles), which
  the AI already gets as metadata; (2) **literals inside DAX**: a measure `Target = 5000000` or a calculated column
  `SWITCH([Code], 1, "Customer X", ...)` computes on made-up rows but its constants are the model's, and they would show
  in an image. S2 lists every measure and calculated column with a literal (a number other than 0/1 or a text) before the
  render, and offers to replace them with made-up constants (`measures: 'stub'`), never silently; (3) field parameters'
  display names (names, kept). Section 3's "never connects to Power BI Desktop" changes: DataArcus would START Desktop
  (not connect to the user's model or data sources) on a copy with no data; the page changes first, with the owner's
  approval, as for the number check. Section 4 (new files only, inside the working folder): the shadow goes into a new
  folder (inside the working folder or the OS temp folder, the owner decides), deleted after; it never writes next to
  the user's model.
- **Platforms:** Windows with Power BI Desktop (Store or installer). Mac and Linux users get (b) only.
- **Speed:** generation 30-125 ms (the 300-table synthetic model, 2.3 MB of TMDL, measured here); Desktop's open and load
  are the cost: about 20 s after the window shows before the visuals are drawn (laptop note), then about 1-3 s a page
  capture (estimate, to measure).
- **Risks:** Desktop's start time and the 2.159 "not loaded" message; a modal dialog (sign-in, updates, "refresh now",
  a privacy-level prompt) blocks the window: the driver must detect and stop, never click through what it doesn't know;
  the Power Query form opens empty and needs a Refresh (the DAX form, `form: 'dax'`, opens with data: to confirm on the
  laptop); Desktop telemetry is Microsoft's (a copy with made-up rows); two Desktop windows at once (the user's own
  model must never be touched: match the window by the pid we started); calculation groups and field parameters are
  carried but not yet tried in Desktop.
- **Effort:** the generator is done as a prototype (below); S2 needs the driver (a small PowerShell/Node module the MCP
  starts: open by path, wait on the window's render, capture by handle, close by pid), the approval text, the privacy page.

### (b) A higher-fidelity in-browser renderer, calibrated against Desktop
`page-preview.js` grown up: real text layout (wrap, cut, slant) for every visual type, the theme's fonts, scored against
golden captures from the laptop with a box-level score per visual (prototype 2).
- **Can judge:** box geometry exactly; titles and table headers as far as our text measure matches Desktop's (J12/D5
  show this needs a measurement per rule); nothing Desktop decides on its own (axis label thinning, scrollbars, card
  auto-size, a visual's error state). Colour balance from the theme only.
- **Privacy:** best: no data, no image of the report; the drawing is made from the plan.
- **Platforms, speed, cost:** everywhere, milliseconds, free. **Risk:** silent drift: each Desktop release can change
  layout, and the renderer agrees with itself, not with Desktop, unless the golden set is re-run. **Effort:** high and
  open-ended (about 30 visual types, each with its own layout logic).
- **Its real role:** the fast first look, on every platform, before approval (it is already there); and the place where
  each measurement from (a) is kept as a rule, so the cheap check improves from the expensive one.

### (c) Real-data screenshots, explicit opt-in each time
The same driver as (a) on the user's own report and model. The approval page asks each time: "An image of your report,
with its numbers, goes to your AI app. Allow once / No".
- **Can judge:** everything, including real magnitudes, real label lengths, real blanks.
- **Privacy:** breaks the metadata-only promise for that run, by the person's explicit choice; the report-design skill
  already asks before a screenshot (PRIVACY section 3, "Data values only when you ask"). Must never be the default,
  never remembered across runs, never in a scheduled or unattended run.
- **Risks:** opening the user's real model (it may refresh, prompt for credentials, take minutes on a large model); the
  user's own unsaved Desktop session; an employer's data in an image. **Effort:** small once (a) exists.

### (d) The Power BI service / embed: why not
It needs an account and a licence (Pro or PPU to publish; a Premium, Embedded or Fabric capacity for `exportToFile`;
PNG export off by default in the tenant), and the model with its data leaves the machine for the user's tenant. It
breaks section 1 of the privacy page (the MCP sends nothing anywhere) and puts a business decision (publishing to the
tenant) behind a design check. Not for DataArcus's audience; the service is for sharing a finished report, not for a
design loop.

## The loop
Plan -> approve -> write -> render -> the AI looks -> lists visible problems -> proposes changes as a NEW plan the person
approves. Never a silent rewrite.
1. **Plan and approve** as today (`plan_layout`, the approval page with the preview from the written pages, `approve_plan`).
2. **Write** (`create_report`) the approved report, as today.
3. **Render** (new, S2): on Windows with Desktop, the shadow of the model (made-up rows, form 'dax' if the laptop confirms
   it opens with data) and a copy of the written report, opened in Desktop from a new temporary folder; each page captured
   by its window handle; the window closed by its pid; the folder deleted. Elsewhere: the preview only, and the answer
   says so ("rendered by DataArcus, not by Power BI Desktop").
4. **Look:** the images go to the AI app with the page names and the box list of each page (the written boxes, so the
   AI can name a visual: "the bar chart at 852,184"). Images are of made-up data and the answer says so.
5. **List visible problems**, in a fixed shape: page, visual (by its box and type), what is seen (cut title, slant,
   scrollbar, overlap, empty, colour, right-to-left), and a confidence; the same "Seen, not in scope" discipline as the
   laptop's reports. Things the shadow can't tell (magnitudes) are said as such, never guessed.
6. **Propose:** each fix is a change to the design or the fields (wider slot, shorter title, a page more, the table's
   columns), written as a new plan through `plan_layout`, which the person approves on the approval page with its new
   preview. Nothing is rewritten by the render step. A second render after the new write closes the loop; the AI says
   what changed between the two renders (the box diff gives the geometry; the images the rest).
7. **Learn:** every visible problem the render finds that the preview's rules missed is a candidate rule for (b), added
   only after the laptop measures it (the owner's "measure, don't estimate").

## The prototypes (this branch)
1. **`mcp/lib/shadow-model.mjs`** `shadowModel(tmsl, { form: 'm' | 'dax' })` and `shadowProject(tmsl, { name, report,
   form })`. From the model's JSON (TMDL folder, model.bim or .pbit, as `loadModel` reads it) to TMDL files:
   - kept: tables, columns (type, format, summarize-by, sort-by, hidden, category, key), hierarchies, measures and
     calculated columns with their DAX, relationships (cardinality, direction, active), field parameters (their DAX,
     ParameterMetadata, group-by column), calculation groups (carried, not yet tested in Desktop);
   - left out, listed in `notes`: every partition's source and rows, roles, perspectives, cultures, shared expressions,
     data sources, functions, descriptions, annotations, lineage tags;
   - rows: one partition a table: a typed Power Query `#table` (default) or a `DATATABLE` (form 'dax'); dates over 2025,
     whole numbers, decimals (0-1 for a rate or a % format), text from a neutral word list of mixed lengths (Arabic words
     for Arabic names), true/false; deterministic (seeded by the names); a "one" side 8 rows, a fact 120, a date table
     365 days in order with its year, quarter, month, day and weekday columns following the date (English and Arabic
     names); keys from one pool a connected group (every "many" value is on its "one" side; 1:1 and many-to-many too);
     every sort-by column a function of its column; a column with no type (a DAX table's) gets a type by its name, listed
     in `guessed`;
   - measured: 2 to 300 tables, 30-125 ms, the 300-table model 2.3 MB of TMDL. Microsoft's validator (the version
     `mcp/package.json` pins, offline): 0 errors on the shadow projects of twin, arabic and health (form 'dax').
2. **`mcp/lib/box-diff.mjs`** `boxesOfPage(page)` (the written report's frames, from page-preview's `fromFiles`),
   `boxesOfSvg(svg)` (the preview's drawing: frame, title band, the part under the title, a card's value),
   `compare(a, b)` (matched one to one by kind and overlap; per part IoU and largest edge gap; a page score with missing
   and extra visuals counted 0; `within(t)`). A golden capture from the laptop gives the same shape (frame from the
   files; title band, content and value boxes measured in the image), so (b) is scored by the same function.
   Results on the fixtures' planned reports: the preview's drawing against the written files: 1.00 on every page (every
   frame where the file puts it); the plan's slots against the written report: arabic 0.44 / 0.30, health 0.15 / 0.27,
   large (logistics) 0.50 / 0.30, twin 0.27 / 0.22 (pages 1 / 2; `R1_PRINT=1 node test-r1-see-the-result.mjs`).
3. **`mcp/test-r1-see-the-result.mjs`** (in `npm test`): 172 checks: S-1..S-16 on the five fixture models and a made-up
   model with the hard cases, B-1..B-9 on hand-made pages and the fixtures' planned reports.
4. **`mcp/research/shadow-try.mjs`**: writes the shadow project of one fixture for the laptop.

## Recommendation
1. Build (a), the shadow-data render, as S2's v1: Desktop draws, made-up rows, no data values in the images.
2. Keep (b) as the fast first look on every platform, and grow it only by rules (a) finds and the laptop measures.
3. Offer (c) later, only as an explicit per-run opt-in on the approval page, never a default.
4. Don't do (d): an account, a capacity, and the data leaves the machine.
5. First, the laptop proves (a) by hand on one fixture (below): opens, loads (M with Refresh, or DAX without), captures.

## S2: the v1 (plan, for the owner's go)
- **S2-1 the driver** (`mcp/lib/desktop-render.mjs` + a PowerShell helper, Windows only): find Desktop (Store or
  installer, `PBI_DESKTOP_PATH`), open the shadow project by path, record the pid, wait for the window and then for the
  visuals (the capture repeated until two in a row match, at most 90 s), capture each page by the window handle (page
  switch by the bridge's page id), close by pid only; refuse when the user's own Desktop window is in front or a dialog
  is open; temporary folder deleted in `finally`. Measured on the laptop first: load time, the settle wait, English and
  Arabic, smallest and largest page.
- **S2-2 the generator** from this prototype, plus: the DAX-literal list (measures and calculated columns with
  constants) and the opt-in to replace them; magnitude by format string; the form the laptop proves.
- **S2-3 the loop**: a `render_report` step is a NEW TOOL, so it waits for the owner's go (this job adds none); its
  answer: one image a page, the page's box list, what the images can't tell; the skill's instructions for listing
  problems and proposing a new plan; the approval page's wording.
- **S2-4 privacy page** (section 3 and 4 changes, the DAX-literal case) before the code ships, with the owner's approval.
- **S2-5 tests**: the generator's tests here; the driver's on Windows CI where Desktop can't run: a fake Desktop
  (a window that draws a PNG) for the wait/capture/close logic; the real proof on the laptop.
- **S2-6 learning**: each laptop render's images scored against the preview with `box-diff.mjs`; a gap becomes a
  measured rule in page-preview.js.

## For the laptop: try (a) by hand on one fixture
Preconditions: the laptop free (no work model open in Desktop), branch `research/see-the-result` checked out in
`C:\DataArcus\DataArcus`, `cd mcp && npm ci`.
1. Write both forms of the twin fixture (its own English report) and the Arabic fixture (the exec layout's report):
   `node research/shadow-try.mjs --fixture twin --form dax --out C:\DataArcus\tests\r1\twin-dax`, the same with
   `--form m --out ...\twin-m`, and `--fixture arabic --form dax --out ...\arabic-dax`. Each prints the file to open.
2. `powerbi-desktop open "C:\DataArcus\tests\r1\twin-dax\Shadow twin.pbip"` (`PBI_DESKTOP_PATH` set). Record the pid.
   Write down: seconds to the window; seconds until the cards show numbers; any dialog (copy its text, don't click it).
3. The DAX form should open with data (and maybe a refresh banner). The M form opens empty: Home > Refresh once (or the
   Authoring MCP's refresh); write down the seconds and whether any column loads as text (a SUM error on a card).
4. `powerbi-desktop screenshot <page-id>` for each page (page ids in `definition/pages/pages.json`), one at a time,
   after a 20 s wait; keep them in `C:\DataArcus\tests\r1\shots\`.
5. Look for, page by page: every visual drawn (no error icon, no "Can't display"); months in calendar order on the
   twin's month axis (Month Name sorted by Month Number); no "(Blank)" category (keys matched); the Arabic report's
   words in Arabic and right to left; cut or wrapped titles, slanted labels, table scrollbars: compare with the approval
   page's preview of the same report (`box-diff.mjs` can score it if you note each title's band).
6. Close only that window (by its pid); delete the folders.
7. Report: open/load seconds for each form, the dialogs seen, the pages and what was wrong, and "Seen, not in scope".

## Open questions
- Does Desktop 2.159 open a project whose tables are all DATATABLEs without a refresh prompt (form 'dax')? (step 3)
- Is the "one" side's 8 rows enough for a slicer or a bar chart to look like the real one? (the owner's eye)
- Where the shadow's temporary folder lives (inside the working folder or the OS temp folder).
- The DAX-literal opt-in's wording (Arabic too).
