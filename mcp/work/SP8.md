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
- **Before -> after:** `assets/js/pbip-bind.js` 1025 -> about 985 lines; `field-picker-ui.js` about 60 (new).
- **Got:** (filled in after the run)
- **State:** planned.
- **Resume:** step (1).
