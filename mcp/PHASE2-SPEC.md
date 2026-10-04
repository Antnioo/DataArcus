# Phase 2: the design engine in the MCP

Roadmap item 1. Written 2026-09-30 from the code at `c9399aa`; references rechecked at `a6e0df4` (bugs #3, #5 and #8
merged, 54 design fixtures). The builder checks every line reference before relying on it.

## Goal
Claude designs a report's look with exactly the website's engine: `generate_theme` makes a brand theme, `plan_layout`
gives exact positions, and `create_report` can build from both. The output is also meant for Microsoft's Report
Authoring skill, so an agent editing an existing report uses DataArcus numbers instead of guessing coordinates.

**Proof of success:** for the same inputs, the MCP gives byte-identical theme JSON and slot tables to the website
(the 54 design fixtures), and a generated report opens cleanly in Power BI Desktop.

## What already exists (reuse, don't copy)
- `assets/js/design-engine.js` exports: `PRESETS`, `FONTS`, `AR_FONTS`, `CHART_OPTIONS`, `LAYOUTS` (exec, analysis, ops,
  focus), `PAGES`, `LIM`, `generate(base, mode)` (4 harmonies), `contrast`, `mix`, `page`, `fitCustom`, `computeSlots`,
  `boxOf`, `rtl`, `buildTheme(design, lang)`, `bgSvg`, `pngSize`, `fresh()`, `repairState(state)`, `fileBase(name)`,
  `DEFAULT_NAME`, `themeName(name)`, `KINDS`, `sizes`. `computeSlots(layout, lang)` also takes the language.
- A design is `{ preset, name, font, data: [8 hex], ui: { background, card, text, accent, good, neutral, bad },
  chart: { labels, grid, legend, axis, table }, layout: { preset, page, kpis, filters, fpos, dir, ... } }`, the same shape
  the website saves: the layout's name is `layout.preset` (exec, analysis, ops, focus), and `ui` has exactly those 7
  colours. `repairState` turns any partial or damaged input into a valid design: use it for every tool input.
- `mcp/server.mjs` `create_report` already takes pages with hand-placed `slots`, a `theme` file, `lang`, `rtl`.
- `scripts/tests/fixtures/design-engine/cases.json`: 54 cases with the saved design, theme JSON, slot table and file name.
  The MCP tests read the file themselves (a blob starting with `=` is raw text, otherwise compact JSON to pretty-print);
  they must not import `capture-design-fixtures.mjs`, which needs the website's browser test packages.
- Still in the page code, not the engine: the project download's second page and slide-in filter panel geometry
  (`theme-generator.js`, `c2` and `withPanel`). `create_report` with a layout needs them moved into the engine first.

## One engine change first (small, fixture-safe)
The contrast checks live in the page code (`theme-generator.js`, `renderContrast`): text on visuals, labels on visuals,
text on page (4.5 each), colour 1 on visuals (3), plus the warning for any data colour that almost disappears on the
visual background (below 1.6:1). Move the numbers into the engine as `contrastChecks(design)` returning
`{ checks: [{ id, ratio, min, pass }], weak: [data colour numbers] }`; the page keeps the wording in both languages. The design fixtures must stay byte-identical,
and the theme-generator suite unchanged on both pages.

## Tool 1: `generate_theme`
**Input** (all optional except where noted; zod schema):
- `name` (string, max 60): empty or blank gets the engine's default name (bug note #3's fix).
- One colour source, in this order of priority:
  - `palette`: `{ data: [hex x 8], ui: { background, card, text, accent, good?, neutral?, bad? } }`; good, neutral and
    bad not given come from `preset` (default DataArcus) and are listed under `repaired`;
  - `brand`: a hex colour plus `harmony` (`analogous` | `complementary` | `triadic` | `mono`), through `generate()`;
  - `preset`: one of the engine's `PRESETS` names (default `DataArcus`).
- `font`: one of `FONTS` (Arabic designs: `AR_FONTS`); unknown values are refused and listed, not guessed.
- `chart`: `{ labels, grid, legend, axis, table }` from `CHART_OPTIONS`.
- `layout`: the page size and style that affect the theme (font sizes scale with the page, 8-60): `page` (preset key or
  `{ w, h }`), `radius`, `shadow`, `transparent`, `dir` (`ltr` | `rtl`).
- `lang`: `en` | `ar` (only decides the direction when `dir` is not given, as on the website).
- `folder`: where to write, inside `DATAARCUS_ROOT` (default: the root).

**Output** (text JSON):
- `path`: the written `<fileBase(name)>.json`, with a free name (`-2`, `-3`...), never overwriting.
- `design`: the full repaired design, so Claude can pass it to `plan_layout` and `create_report` unchanged.
- `contrast`: `contrastChecks(design)`; any failing check is listed under `warnings` with the pair of colours.
- `repaired`: every input value that was changed or refused, and why.

**Tests first** (`mcp/test.mjs`, must fail before, pass after):
- For every design fixture: `generate_theme` with that case's saved design gives the fixture's theme JSON byte for byte,
  and the file name is the fixture's `file` with `.json` instead of the PNG suffix.
- A second call with the same name gets `-2`; a folder outside the root is refused.
- A bad colour, font or harmony is listed under `repaired`; `brand` + each harmony matches `generate()`.
- Font sizes in the written theme stay within 8-60 for 3840x2160 and 640x360.

## Tool 2: `plan_layout`
**Input:** `design` (from `generate_theme`) or the same fields; plus `layout` (`exec` | `analysis` | `ops` | `focus`),
`kpis` (within the layout's limits), `filters` (none | start | end | top), `header` on/off, `page`, `dir`, `lang`.

**Output:**
- `page`: `{ w, h }` in Power BI units.
- `slots`: one row per visual, exactly the website's slot table: `{ role, kind, visual, x, y, w, h }` in page units
  from `boxOf`; `role` and `visual` (the suggested visual's name) in `lang`, `kind` the engine's key.
- `why`: the layout's three reasons (from `LAYOUTS[..].why`), in `lang`.
- `forAuthoring`: the same slots as `{ role, kind, position: { x, y, z, width, height, tabOrder } }`, the PBIR
  `visual.json` position (Microsoft's visualContainer schema 2.1.0: x, y, width, height required; z the stacking order;
  tabOrder the keyboard order), which Microsoft's Power BI Report skill (`powerbi-report-cli`, formerly the Report
  Authoring skill) edits. `z` and `tabOrder` are (i + 1) x 1000 in reading order: top to bottom, then along the reading
  direction, the order `pbip-export.js` sorts visuals in. (The report `create_report` writes also gives its header, KPI
  and filter groups z values first, so its z numbers differ; its order is the same.)
- **Use `plan_layout`'s numbers exactly; never snap them to multiples of 8.** Microsoft's skill advises snapping
  positions and sizes to multiples of 8 (`references/design/layout.md`); DataArcus positions are exact (for example
  455 x 144) so each visual lands on its panel in the background. The DataArcus skill must say so.

**Tests first:** for every fixture, `plan_layout` with its design gives the fixture's slot table exactly; right-to-left
cases mirror the x positions; page sizes outside the limits are fitted exactly as the website does (`fitCustom`).

## `create_report` with a layout
Add an optional `design` + `layout` input as an alternative to hand-placed `slots`: the positions come from
`plan_layout`, the theme from `generate_theme` (written next to the report), the second page and slide-in filter panel
geometry as on the website's project download. Hand-placed slots keep working unchanged (all existing MCP checks pass).
Until phase 3, the page background is the transparent 1-pixel PNG and visuals are solid, so everything stays visible.

**Tests:** every visual sits exactly where `plan_layout` says; the theme is registered in the report; only fields that
exist in the model are bound; fonts within 8-60 on 3840x2160 and 640x360.

## The skill (`mcp/skills/report-design/SKILL.md`)
- New report: `read_model`, `suggest_fields`, `generate_theme`, `plan_layout`, show the plan (colours, contrast,
  layout and why) and wait for "go", then `create_report`.
- Existing report: DataArcus for the theme and the positions (`generate_theme`, `plan_layout`); Microsoft's Power BI
  Report skill for the file changes, on a copy the user approves. Never both writing the same report at once.
- Use `plan_layout`'s positions exactly (`forAuthoring`); never snap them to multiples of 8.
- Always report failing contrast checks and anything `repaired`.

## Desktop check (expected results written before the run)
On the Health Test and Ramadan Test models in `<tests folder>`:
1. `generate_theme` (brand #0F4C5C, analogous) + `plan_layout` (exec, 1920x1080) + `create_report`: opens without errors;
   the menu import of the same theme is accepted (no 8-60 error); each visual's position in Desktop equals the slot table.
2. The same with `analysis`, filters `end`, `dir: rtl`, `lang: ar`: x positions mirrored, Arabic slot titles shown.
3. A 640x360 page: every font size within 8-60, nothing unreadable.
Screenshot each page (one at a time), check the KPI values with DAX through Microsoft's Authoring MCP.

## Out of scope for phase 2
Background PNGs (phase 3), editing existing reports ourselves (Microsoft's skill does it), new layouts or presets,
any change to what the website produces.

## Decisions (all made, 2026-09-30)
- **Bug note #5: merged.** In right-to-left designs the legend "Side" option writes `Left`, like the rest of the
  layout; `buildTheme(design, lang)` takes the page language for it. The colour preview follows too (#8, merged).
- **Private repo: decided, stay public.** The Arabic/RTL and Gulf DAX work goes to a private repo later.
- **Bug note #3: merged.** An empty or blank name gives `DEFAULT_NAME` (My Brand Theme) in the theme and the files.

## Order of work
This session: this spec update, (a) `contrastChecks` in the engine, (b) `generate_theme`, (c) `plan_layout`.
Next: (d) the project's second page and panel geometry into the engine, then `create_report` with a layout,
(e) the skill, (f) the Desktop check (expected numbers written before the run).

## Rules
As in `mcp/CLAUDE.md`: plan first, tests first, fix causes in the shared engine, never change fixtures or expected numbers
without approval, the MCP stays self-contained (its own `package.json`), work only inside the laptop's DataArcus folder, and only
Microsoft's Power BI Authoring MCP for Power BI work.
