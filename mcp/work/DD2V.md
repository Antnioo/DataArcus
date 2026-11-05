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
- **State:** step 1 written. **Resume:** step 2.
