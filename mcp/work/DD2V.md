## Summary
- **Approval:** the brief "DD2V (0.3.2): one list each for 'keeps its grid left to right' and 'is a bar chart'" (5 Nov);
  the owner D-1104-12 (one library, fix at the source), D-1104-15 (the families he did not decide are the reviewer's call, as CONTRACTS.md proposes).
- **Base:** `feat/0.3.2-dd2v` from `origin/integration/0.3.2` at 27618f5. Push only this branch; never merge, no PR.
- **Scope:** CONTRACTS.md families grid and vt-bar. Not in this job: vt-slicer, the other kinds in kindOf.
- **Plan, one commit each:** 1 this note; 2 `BAR_TYPES` + `isBar` in visual-types.js and suite dd2v (tests.json) pinning the probe's 18 types
  for both questions; 3 the places read them (mirror-policy.js BAR and `keepsGridLtr`, page-preview.js KIND, layout-check.js BARS and KINDS,
  page-picture.mjs BARS and TABLES -> `keepsGridLtr`, createRequire); the probe's places follow; `npm run build:min`; 4 the parity test in dd2v
  (every place on the 18 types, one answer each; red proof), CONTRACTS.md grid and vt-bar start with `**One place:** ...`.
- **Copies before -> after:** grid 2 -> 1 (page-picture TABLES goes); vt-bar 4 places over 5 lists (mirror-policy BAR, page-preview KIND,
  layout-check BARS and KINDS bar entry, page-picture BARS) -> 1 (`BAR_TYPES`). Same-shape groups go down.
- **Answers that change (only these):** `stackedBarChart` is no longer a bar in the preview, check_report and the twin's picture;
  `stackedColumnChart` leaves the column kind lists of page-preview KIND and layout-check KINDS (listed in the note after step 3).
- **Expected checks:** dd2v new; every other suite's number unchanged; lint 0; check-contracts, check-modules --strict, check-agent-memory, check-result-lines green.
- **State:** DONE (Linux and Windows; macOS runs where the reviewer merges).
- **Resume:** none; the reviewer reads and merges.

## Copies before -> after (each place)
| place | before | after |
|---|---|---|
| `assets/js/mirror-policy.js` `BAR` (kindOf) | its own frozen list of the 3 catalog bar types | `const BAR = VT.BAR_TYPES;` (same three) |
| `assets/js/page-preview.js` `KIND` bar entry | a regex of 4 types (stackedBarChart in) | `{ test: VT.isBar }` |
| `assets/js/page-preview.js` padding band (line ~448) | a regex of bar and column types | `VT.isBar(type) \|\| ` the column regex |
| `assets/js/layout-check.js` `BARS` (bar-label rule) and the `KINDS` bar entry | a regex of 4 types, twice | `VT.isBar` both; `BARS` gone |
| `mcp/lib/page-picture.mjs` `BARS` | a regex of 4 types | `isBar` from visual-types.js (createRequire) |
| `mcp/lib/page-picture.mjs` `TABLES` | `Set(['pivotTable','tableEx'])` | `keepsGridLtr` from mirror-policy.js; `TABLES` gone |
Lists: grid 2 -> 1; bar 5 -> 1 (`BAR_TYPES`). Same-shape groups go down; the loader of the preview (`theme-generator.js` loadPreview) loads visual-types.min.js first.

## Answers before and after
- `stackedBarChart`: bar in page-preview, layout-check and page-picture (before) -> not a bar (after); mirror-policy already said custom.
- `stackedColumnChart`: column in page-preview (KIND, padding band, category) and layout-check `KINDS` (before) -> not a column ("a visual"/"other"; after).
- The other 16 of the probe's 18 types: unchanged. No golden or twin test changed its expected answer.

## Checks
dd2v 178 checks (red proof, not committed: page-preview's bar entry put back to the 4-type regex: FAIL 176 of 178, P vt-bar page-preview stackedBarChart and S1; restored). MCP in CI's shards side by side (DA_SHARD=0..4/4): 0 failures; website suites shards 1-3 of 3: 21, 13 and 8 passed; lint 0; check-contracts, check-modules --strict, check-agent-memory, check-result-lines, check-min green.

## Decisions I made
- The probe (scripts/contracts-probe.mjs) names the new places: grid and vt-bar now run `newOverlaps` (a table and a bar over each other, the bar's axis turned in Arabic: 'barsTurned' iff the grid keeps/bar) and `placeOf` (layout-check) where the old copies were; the 18 inputs are unchanged.
- layout-check `CHARTS` (the "is a chart" list) still holds stackedBarChart and stackedColumnChart: a different question, not in this job.
- `stackedColumnChart` left the column lists only where they sit beside the bar list (page-preview KIND, padding band and category; layout-check KINDS).
- Not typed: any `?v=` stamp (build:min wrote them); sitemap lastmod written after `git fetch --unshallow`.

## For the owner
none

## Risky changes
none (a type Power BI never writes changes its picture; no report Power BI writes has it)

## Seen, not in scope
- layout-check.js `CHARTS` still lists stackedBarChart and stackedColumnChart; report-a11y.js, twin-plan.mjs, visual-meaning.mjs and twin-geometry.mjs also name stackedBarChart (other questions).
- vt-slicer waits on a Desktop look (D-1104-15).

## Lessons for the reviewer
- `git grep -l` of the edited files found 56 tests; running the whole MCP in CI's shards plus the 3 website shards was the only sure proof (about 25 minutes on 4 cores).
- A page loader edit (theme-generator.js loadPreview) is covered by the website shards (pbip, sp31, theme-generator).
CI green: https://github.com/Antnioo/DataArcus/actions/runs/41985887507 on cbf3569c17f11c19ff8608898c6f1a7515cebcb2
