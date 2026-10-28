# FX1 (0.3.1): fixes from the owner's laptop part 3 (28 Oct) and his 28 Oct decision

## Summary
- **Approval:** the reviewer's brief "Go on FX1" (28 Oct): laptop part 3 on 0.3.1-rc.2 (integration 0d342773, Desktop
  2.159.883.0, Windows 11): D-1028-02 (the twin's Reset icon is given room), G4-1 (Health Check offline), A5 and P3A's
  Seen 2 (an Arabic plan's approval page wholly Arabic). Binding: D-1027-12 (the twin identical), D-1027-04.
- **Scope:** 1. `mcp/lib/twin-pages.mjs` (fitButtons). 2. `assets/js/model-health.js` (+ .min.js, its ?v= stamp),
  `scripts/tests/model-health.mjs`. 3. `mcp/lib/approval-window.mjs`, a new `mcp/lib/approval-ar.mjs` (the page's
  Arabic words), `mcp/tools/generate_theme.mjs` (its write line in Arabic). New suite `mcp/test-0.3.1-fx1.mjs`.
  Not FX2's files (report-mirror.js, plan_layout, create_report, TOOLS.md).
- **Base:** `fix/0.3.1-fx1` from `origin/integration/0.3.1` (5690ea89). Push only this branch.
- **Expected checks:** (written before the work) new `fx1` about 24 checks, red first on 5690ea8 except its guards;
  website `model-health` one check more; `sq4` 20 = 20 with X2-S1b/c changed on purpose (the icon kept: D-1028-02);
  approval suites (r4a, sq3, lr1, tt1, cs1, cx2, approval-complete, twin-artifact) the same counts, an assertion on an
  English copy of an Arabic page changed on purpose and said per test; mutation the same; full run base + 1 (fx1).
- **Got:** (filled at the end)
- **Resume:** plan pushed; next: red tests.

## Plan
1. **The Reset icon (D-1028-02).** Reproduced on 5690ea8 (a scratch script, the sample project as the laptop ran it:
   its report, then the twin separate and "same"): both Reset buttons, 159 wide in English, are grown to 179 (the strip's
   10 of padding each side) and still need more with the icon at «  إعادة ضبط الفلاتر», so the icon is switched off
   (`iconOff`). Fix in `fitButtons`, after today's growth into free room: (a) as the writer does in a strip (the Reset as
   wide as its text and icon need, the dropdown slicers sharing the rest: pbip-page.js), width is taken from the
   dropdown slicers beside it in its row, equally, each kept at least 160 x k (the writer's strip minimum), the visuals
   between them moving with them; (b) else the largest text size down to 8pt at which its Arabic and its icon fit
   side by side (the writer's rule for a slicer header and a KPI title: the largest size, down to 8, at which it is
   whole); (c) only where neither gives room, the icon off and said in the plan as today. The plan says (a) and (b).
2. **Health Check offline (G4-1).** The worker is created when the page loads (its importScripts fetch the engine and
   the TMDL reader then), kept between runs (it holds no state between messages), replaced only when a run is
   cancelled. Website test: load, `setOffline(true)`, the sample's button: a score appears.
3. **Arabic approval pages (A5).** An Arabic page shows Arabic only: headings, row labels and values, file kinds, each
   write line without its English copy, the theme's page (Arabic for lang "ar", today English), the calendar's inputs.
   Names (model, table, file, field, page) stay as they are, isolated, inside «». The raw inputs stay as given (code).
4. Note, CHANGELOG, full run, CI.
