# SP8 (0.3.2, the split): assets/js/pbip-bind.js -> field-picker-ui.js (the DOM field picker; behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP8" (3 Nov); the owner D-1016-01, D-1102-02, D-1102-04. Backlog B-280, B-286
  (the Codex split map: "Extract field-picker-ui.js first, accepting catalogs and emitting selections").
- **Base:** `feat/0.3.2-sp8` from `origin/integration/0.3.2` at 7797bf6. Pushed only this branch; never merged.
- **Scope:** new `assets/js/field-picker-ui.js` (`DAFieldPicker.render(el, fields, bind, L, build)`: draws the picker
  from the catalog's fields `{measures, columns}` and the current binding, and gives the visitor's selections back as
  the binding `build` makes of them, through the same getter `renderPicker` returns today). pbip-bind.js keeps parsing,
  calendars, catalog, relationships, ranking and `build`; its `renderPicker(el, tables, bind, L)` stays (same signature)
  and hands `catalog(tables)` and `build` to the new file. Website: the picker is lazy (theme-generator.js `loadBind`),
  so field-picker-ui.min.js is loaded there, before pbip-bind.min.js; no page has a script tag for either, no worker
  touches the picker. MCP: never calls `renderPicker` (checked), so no MCP file changes.
- **Plan:** (1) characterise on the base: MCP suite `sp8` (area report) and website suite `sp8` (Playwright), recorded
  on the base code; (2) move; (3) the same records pass unchanged; min files, stamps, csp, ar-pages, sitemap.
- **MCP suite sp8 (test-0.3.2-sp8.mjs), in process, made-up models from mcp/fixtures and mcp/test-models (8: fx4
  births, retail, financial; Twin Sales; Health Test; Plain Orders (no measures); Service Orders; Arabic Long Names),
  each EN and AR = 16 cases:** suggest (4 KPI slots, the relationships), the picker drawn twice on one fake element
  (the page redraws it), and recorded: the picker's HTML, the default binding, and the binding after two changed
  choices made through the picker's own change listener (the main measure and the first slicer). One check per case.
  **Expected: 16 checks on the base; 19 after** (M1 renderPicker is field-picker-ui's, pbip-bind holds no picker HTML;
  M2 field-picker-ui reads no model and no file; M3 theme-generator loads field-picker-ui before pbip-bind).
- **Website suite sp8 (scripts/tests/sp8.mjs), the lab page ?lang=en and ?lang=ar, the bridge project folder:** the
  random source seeded and the clock fixed (SP5's init script); the picker's DOM (#pbipMap: every select's options in
  order, optgroups, labels, attributes, the selected item), the same after two changed choices, and the download's
  every non-image file byte-identical to the record. **Expected: 2 checks on the base, 3 after** (W3: field-picker-ui
  loaded before pbip-bind, each once).
- **Before -> after:** `assets/js/pbip-bind.js` 1025 -> 990 lines; `field-picker-ui.js` 52 (new).
- **Expected checks:** sp8 16 on the base, 19 after; website sp8 2 on the base, 3 after.
- **Got:** sp8 16 on the base (095d4db), recorded; after the move (fa30b6b9) 19, the records unchanged. Website sp8 2
  on the base, 3 after. A one-line change to the picker (a slicer choice dropped) fails both (MCP 16 of 19, website W1
  and W2: 97 files differ), then reverted.
- **Areas (on fa30b6b9):** report + model 61 suites passed; website sp8 3, sp5 3, pbip 111, theme-generator 922,
  theme-generator-lab 922, arabic-names 14, layout-canvas 31; lint 0; check-min (stamps vs main), test-site-config,
  changelog-words, csp pass.
- **Merged integration/0.3.2 in (956c4d80, SP6)** at 84d8cd90: both sides kept (tests.json, run-all's lists, WORK.md
  3,180 characters). CI 41576482704: every job green but website sp8 (EN and AR): the page reads a folder in the file
  system's directory order, which differs on CI. The suite now hands the page the folder's files sorted by path
  (an init script; the product unchanged), recorded again on the base code (095d4db, a worktree), then 3 after.
- **CI green: https://github.com/Antnioo/DataArcus/actions/runs/41578855895 on cc3adbc5.**
- **State: DONE.**
- **Resume:** none; the reviewer's merge.

## CHANGELOG line
- **Inside the website's field picker:** the list where you choose a field for each visual has a file of its own; it
  shows the same choices in the same order and the download is byte for byte what it was before.

## Decisions I made
- The picker's input is the catalog's fields `{measures, columns}` (what `catalog(tables)` gives and the old code read),
  not the whole `{tables, relationships, fields}`: the picker reads nothing else, and the relationships are already in
  the binding `suggest` made. `build` and `iso` are passed in by pbip-bind (one place each: `iso` is also `DB.iso` on the
  page); `esc` and `key` moved (only the picker used them).
- `renderPicker(el, tables, bind, L)` stays in pbip-bind's API with the same signature and return (the getter), so
  theme-generator.js's call is unchanged; pbip-bind finds the picker by `require` in Node, `window.DAFieldPicker` in the
  browser, only when drawing (the MCP never draws, so no MCP file requires it).
- The MCP suite draws on a fake element (innerHTML, change listeners) and picks through the picker's own listener, so
  it covers the callbacks too; models read through `fromFolder` on file-like objects, as the page reads a folder.
- The website suite records the picker as a node walk (tag, sorted attributes, live value and selected state, text),
  so the selected item after a change is seen (the `selected` attribute does not move). The picker has no aria
  attributes today; the walk would see any.
- New stamp `20261103sp8` for field-picker-ui, pbip-bind and theme-generator.min.js (both English pages; the Arabic
  copy rendered again).

## For the owner
none

## Risky changes
none (the picker's HTML, the bindings and the download proven identical in Node and in the rendered page).

## Seen, not in scope
- The picker's table groups (and the TMDL model's table order) follow the order the browser lists a chosen folder's
  files, which is the file system's: two machines can show the same model's tables in a different order. Sorting the
  files by path in `fromFolder` would fix it; a behaviour change (a later job, with its own record).
- The picker's selects have no `aria-label`; each sits inside its `<label>`, which names it, so it reads fine.
- `catalog(tables)` is computed twice per draw on the page (suggest, then the picker): cheap, unchanged.

## Lessons for the reviewer
- model-import-browser (next): `fromFolder`, `fromFile` (its worker URL comes from theme-generator.js), `decodeText`,
  `LIMITS`, `tooBig`, `clean` sit at the top of pbip-bind.js (about lines 37-130); `fromTmsl`/`relsOfTmsl` are used by
  the MCP (lib/model.mjs) too, so they are catalog, not browser input. Its loader is the same `loadBind` chain: add it
  there, before pbip-bind, and extend sp8's M3. The sp8 suites already read every model through `fromFolder`, so they
  characterise that split as well.
