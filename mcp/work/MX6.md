# MX6 (0.3.1): three geometry bugs the fuzz lab found, and its fastest checks as a suite

## Summary
- **Approval:** the reviewer's brief "MX6" (2 Nov), from Codex's twin-fuzz lab (evidence/0.3.1-fuzz, replayed on
  0f47f4cb); D-1027-12 (the twin identical), D-1101-04 (general rules), D-1102-02 (CI on the branch is the gate).
- **Base:** `fix/0.3.1-mx6` from `origin/integration/0.3.1` at 0f47f4cb (MX5 in). Push only this branch; never merge.
- **Scope:** 1 (B1-1) the button fitting borrows a slicer's width only where every visual it moves stays inside its
  page or group, else the button is fitted as before without borrowing. 2 (B1-3) the bar-over-table rule's kept offset
  is clamped to the page or group; a bar wider than it is said. 3 (M1-1) every visual whose box differs from its exact
  mirror is named in the plan by visual name (fitted / kept / moved): the button fitting's neighbours go into
  `movedByRule`; any other unnamed change the 25 seeds show is named the same way (each said below). 4 a new suite
  `twin-fuzz` (area twin): the six reduced cases (spec.json copied to `mcp/fixtures/twin-fuzz/`, made up) and 25
  fixed generated seeds (20261102..20261126) through the real plan / approve / write flow: V1 (Microsoft's validator:
  no new error code), V2 ($schema), B1 (every box in its page and group), M1 (every box its exact mirror unless the
  plan names it). B2, B3, D1, P1 stay out (the brief: the lab's strict properties, not bugs).
  Files: `mcp/lib/twin-pages.mjs` (fitButtons, aroundTables, the caller), new `mcp/test-0.3.1-twin-fuzz.mjs`,
  `mcp/fixtures/twin-fuzz/*.json`, `mcp/tests.json`.
- **Expected checks:** `twin-fuzz` 31 inputs x 5 (written, V1, V2, B1, M1) + 4 named checks (B1-1's chart inside,
  B1-3's bar inside and named, M1-1's group named) = about 159. Red on 0f47f4cb first (the lab's replay there):
  B1-1 (B1, M1), B1-3 (B1), M1-1 (M1); seeds M1 on 20261109, 13, 17, 20, 22, 23, 24, 26 and B1 on 20261117.
  Unchanged expected: mx1..mx5, fx1 (x5), the never-shrink guard (keepSize); any check that moves is said per check.
  Under 30 s in CI.
- **State:** plan pushed; work next.
- **Resume:** the red run of `twin-fuzz` on 0f47f4cb, then the fixes.

## Plan
1. Port from fuzz.mjs only: the generator (mulberry32, `generate`, `visual`), `materialize`, the plan/approve/write
   flow with the texts' pagination, the validator call (as `mcp/lib/artifact.mjs`), and the V1, V2, B1, M1 checks
   (M1's exceptions: the page kept left to right, or the visual's `page/visual` token in mirrors (heatmap names),
   cannot, movedByRule, keptTogether, keptInView, pictureChecks, fitted). No shrinker, no campaign, no fs observer.
2. Run it on 0f47f4cb: red as above. Then the fixes, each a general rule (no trick for one dashboard).
3. The owner's six dashboards: compare the evidence/0.3.1-shapes twins before and after; name any visual that moves.
