## Summary
- **Approval:** the brief "DD1C" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-11 (one big
  check for twins that differ), D-1016-01 (never 100 places).
- **Base:** `feat/0.3.2-dd1c` from `origin/integration/0.3.2` at 762bba0. Pushed only this branch; never merged.
- **Scope:** one question, "how wide is the frame a visual is mirrored inside?", answered in one place:
  `frameWidth(page, byName, v)` in assets/js/mirror-units.js (9136568). The parent group's width when its box is
  valid (mirror-units' boxOf: finite x, y, width > 0, height > 0), else the page's width when finite and > 0, else
  undefined. `widthOf` stays in the api as the same function (sp39's interface check names it).
- **Callers (e1cdd02):** mirror-units placesOf, report-mirror mirrorPage, twin-geometry aroundTables, twin-text-fit
  fitButtons. Unknown frame: the mirror and placement leave the box (as before), fitting leaves the button and counts
  a box as fitting (as before), geometry no longer keeps the bar (before: x NaN; see Decisions).
- **Before -> after (three answers -> one):** see "## Three answers -> one" below.
- **Test (41fa997):** mcp/test-0.3.2-dd1c.mjs, suite dd1c (area twin), 61 checks: F1-F13 each caller's frame read
  from its behaviour on 13 made-up frames, R1 frameWidth itself, S1-S3 no caller computes a frame, E1-E2 a grouped
  text box and widened button in one frame. Red: on the base 27 of 61; with only the old twin-text-fit widthOf back
  53 of 61 (F2-F6, F13, S twin-text-fit, E2).
- **Ledger and map (ff3e163):** MODULES.md's mirror-units.js row names frameWidth and its three callers
  (check-modules --strict PASS 1033 -> 1035); one CHANGELOG line (a visual in a broken group). .min.js: faeb19b.
- **Expected checks:** dd1c 61; twin 43/43 suites, every number as on the base (sp39 96, sp11 21, twin-fuzz 185);
  mutation 76/76; lint 0. **Got:** exactly that (full runs: see Results).
- **Merge:** integration/0.3.2 did not move (762bba0): no merge. mcp/docs/CONTRACTS.md is not on integration: its
  frame family line is below ("For CONTRACTS.md").
- **State:** see the CI line.
- **Resume:** none; the reviewer reads and merges.

## Three answers -> one (made-up inputs, page 1280 unless said; mirror / geometry / fitting)
| input | before | after |
|---|---|---|
| a valid group 400 | 400 / 400 / 400 | 400 |
| group width "wide" | "wide" (not mirrored) / 1280 / unknown | 1280 |
| group width 0 | 0 / 0 (bar at 0) / unknown | 1280 |
| group width -5 | -5 / -5 (bar at 0) / unknown | 1280 |
| group position without width | unknown / 1280 / unknown | 1280 |
| group with no position | 1280 / 1280 / unknown | 1280 |
| group x "a", width 400 | 400 / 1280 / unknown | 1280 |
| no group; a group not there | 1280 | 1280 |
| page with no width; width "x"; "wide" group in it | unknown / NaN (bar at x NaN) / unknown | unknown |
| nested group 300 in 600 | 300 | 300 |

## Decisions I made
- The box test is mirror-units' own boxOf (width and height > 0), not twin-geometry's boxOk (finite only): the brief's
  rule asks > 0, and boxOk also judges the twin's own visuals, so it stays as it is (changing it would change answers
  beyond the frame). No copy of the rule: the twin reads frameWidth.
- twin-text-fit reads it as `const { frameWidth, byNameOf } = require(...)`: sp11's M2 allows only named engines as
  top-level constants (Mirror, Rules); a destructured require keeps sp11 untouched.
- geometry, unknown frame: the bar is left as the mirror placed it, no entry said (before it wrote x NaN). twin-pages
  already says a page whose size is not a number (sizeOf), so nothing new is said.
- `widthOf` kept as an alias of the same function (`widthOf === frameWidth`), not a second rule.
- The end-to-end checks run the engines in the twin's order (mirrorPage, then fitButtons) on a made-up page, not
  create_arabic_twin (no project, no approval needed to show the frame).
- tests.json has no "quick" group: dd1c is in the twin area beside an1. samejob.py is not in the repo: not run.

## For CONTRACTS.md (not on integration yet)
The frame family: "one place: assets/js/mirror-units.js frameWidth; test mcp/test-0.3.2-dd1c.mjs (dd1c)".

## For the owner
none (no golden or twin test changed its answer).

## Risky changes
- A grouped visual in a group whose box is broken (width 0, below 0, text, no width, x not a number) is now placed in
  its page, in all three steps; before, the mirror used the broken width. Old: mirror-units.js widthOf (any
  position.width); new: frameWidth (a valid box only).

## Results
- Local (faeb19b): `npm test -- --keep-going` in mcp, `npm test` at the root, lint 0, check:min (124 match, stamps
  new since main), test-site-config PASS, check-modules --strict PASS 1035, changelog-words PASS, result-lines PASS.

## Seen, not in scope
- twin-geometry's boxOk accepts a width of 0 or below for the twin's own visuals (aroundTables, badgesWithText).
- twin-text-fit's fitTextboxes keeps its own byName (by any name, not byNameOf's string or number).

## Lessons for the reviewer
- Read each caller's frame from what it does (x' = W - x - w, the clamp, the widened button): it catches a copy
  that a source search would miss.
- A guard test (sp11 M2) names the allowed engines: a new engine for a twin file shows there first.
