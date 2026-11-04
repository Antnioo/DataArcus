## Summary
- **Approval:** the brief "DD1C" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-11 (one big
  check for twins that differ), D-1016-01 (never 100 places). Scope: one question, "how wide is the frame a visual
  is mirrored inside?", answered in one place.
- **Base:** `feat/0.3.2-dd1c` from `origin/integration/0.3.2` at 762bba0. Pushed only this branch; never merged.
- **Before:** three answers. mirror-units.js `widthOf` (the group's position.width whenever it has a position, else
  page.width, else undefined); twin-geometry.mjs `aroundTables` widthOf (the group's width when boxOk, else the
  page's); twin-text-fit.mjs `fitButtons` widthOf (the group's width unchecked, undefined without a position, else
  page.width, else NaN). Group width "wide" in a page 1280: "wide" / 1280 / undefined.
- **The rule (commit 1):** `frameWidth(page, byName, v)` in assets/js/mirror-units.js: the parent group's width when
  its box is valid (mirror-units' own boxOf: finite x, y, width > 0, height > 0), else the page's width when finite
  and > 0, else undefined. `widthOf` stays in the api as the same function (sp39's interface check names it).
- **Callers (commit 2):** mirror-units placesOf and report-mirror mirrorPage (through Units), twin-geometry
  aroundTables, twin-text-fit fitButtons. Unknown frame: mirror and placement skip (as today); fitting skips the
  button and counts the box as fitting (as today); geometry skips the bar (today it wrote x NaN: see Decisions).
- **Test (commit 3):** mcp/test-0.3.2-dd1c.mjs (area twin; tests.json has no "quick" group): 12 made-up inputs, each
  caller's frame read from its behaviour, one answer, the rule's; 2 end-to-end (valid group, broken group); a source
  check that no caller computes a frame itself. Red: old fitButtons widthOf back -> fails.
- **Expected:** answers 3 -> 1; dd1c about 40 checks; twin 43/43 suites as on the base (numbers unchanged, sp39 96);
  mutation 76/76; lint 0; modules strict PASS.
- **State:** plan pushed. **Resume:** commit 1.
