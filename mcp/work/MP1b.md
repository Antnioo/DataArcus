# MP1b (0.3.1): the page picture placed as Desktop measured it (Normal centred, Fit stretched)

## Summary
- **Approval:** the reviewer's brief "Round 2 as MP1b" (29 Oct), from laptop part 6 block B (Desktop 2.159, shots
  mp1-p1..p4-en-ar-p6.png): Normal is centred at scale 1, Fit is stretched to the page, Fill centred at max scale.
  MP1's padded Normal flip is off by (W - iw)/2 across and (H - ih)/2 down. The owner: D-1029-03, D-1027-12.
- **Round 2 (the reviewer's message of 11:45, laptop part 6 on the owner's 6 dashboards, RESULTS.md block C):** 1. the
  picture file is never found (Desktop's two names); 2. an emptied picture; 3. Call Center's bar chart and ratings table
  kept in English order; 4. KPI icons on their titles, Fintech's «فهمت» over its text; 5. ER p1's weekday bars. Added to
  this job, red first: R1-R7 (the made-up shapes of each).
- **Base:** `fix/0.3.1-mp1b` from `origin/integration/0.3.1` at d9d3ae98. Push only this branch.
- **Scope:** `mcp/lib/page-picture.mjs` (placement as measured; the flip without padding; the box check on the measured
  placement), `mcp/lib/twin-pictures.mjs` (no "padded", no "drawn on the page first"), `mcp/TOOLS.md`,
  `scripts/tests/DESKTOP-TESTS.md` (the measurement), `mcp/test-0.3.1-mp1.mjs`, CHANGELOG if a line says padding.
- **Expected checks:** (written before the work) `mp1` grows by about 4 new checks, red on d9d3ae98 first:
  N1-N2 (the laptop's two Normal shapes, 520 x 360 and 400 x 250 on a 640 x 360 page: the Arabic page's picture is the
  picture itself flipped, its own size, Normal kept, and its content mirrors about the page centre: a visual on a panel
  of the centred picture lands, at x' = W - x - w, on the same panel), F1 (placement: Fit stretched, Normal centred,
  Fill centred at max), F2 (the box check on a Fit picture not page-shaped: a visual widened off its panel named, the
  others not). Changed on purpose, said per check: mp1's own placement model (the test's `place`) becomes the measured
  one, so P's 18 checks hold their number but test the measured placement; A1 now says no page is padded; A2 counts no
  "drawn on the page first" row (0, was 3). Other suites: none expected to move. Full run: the base's 128 suites.
- **Got:** `mp1` 70 checks (63 + 7: N's 5 (the twin written, 2 pages x 2), F1, F2; the estimate said about 4: N
  took 5), red on d9d3ae98 first: 21 of 70 failed there (the 6 Normal pages x 2 of PNG and JPEG, N's 4, A1, A2, V3,
  F1, F2). Changed on purpose, per check: P (18, same number) tests Desktop's placement; A1 says no page padded; A2
  counts 0 "drawn on the page first" rows (was 3); V3 (MP1's tight Normal page) now red on the old code, which padded
  it. Areas: twin 20 suites, arabic 15; lint 0; agent-memory PASS. No other suite's number moved.
- **Got, round 2:** `mp1` 78 checks (70 + R1-R7 + O4), red on 783ccba (the round 1 code; d9d3ae98 the same for these):
  6 of 78 failed (R1-R3, R5-R7); R4 (a nested group, W - x - w at every level) a guard, green there: groups were not
  the cause. Engine change: `assets/js/report-mirror.js` (build:min; new stamps report-mirror 20261029mp1b in
  theme-generator.js, theme-generator 20261029mp1b in its 3 pages).
- **State: DONE.** Full run on 95f170e4: "run-tests: 128 suites passed" (the base's 128; mp1 78, mcp 1594, mutation 198,
  76 mutants all killed). Areas on 95f170e4: twin 20, arabic 15, report 42; lint 0. Website: run-all's lang-switcher,
  text-align and layout-canvas crashed together under load (Chromium "browser has been closed"), each PASS alone
  (1442, 474, 31 checks); site config PASS. CI on 61a9f78f: run 40880840674 green.
- **Resume:** none; the reviewer's merge.

## The plan
1. `placement(iw, ih, fit, W, H)` as measured: Normal { sx = sy = 1, centred }, Fit { sx = W/iw, sy = H/ih, at 0,0 },
   Fill { s = max, centred }. Every mode is symmetric about the page's centre line, so the picture is flipped as it
   is, its own size, its fit kept: no padding, no crop.
2. The box check maps each box through that placement (two scales for Fit).
3. The measurement in DESKTOP-TESTS.md (29 Oct, Desktop 2.159, the numbers, the shots' path), cited in page-picture.mjs.
4. No sentence says "padded" or "drawn on the page first" any more (plan, approval page, TOOLS.md).

## Before -> after
| Item | Before | After | Where | Test |
|---|---|---|---|---|
| 1 | Normal modelled at (0,0): a picture narrower than the page padded to W x H, then flipped (off by (W - iw)/2 in Desktop) | Normal centred at scale 1 (measured): every fit flipped as it is, its own size and fit kept | page-picture.mjs placement, flippedFor | mp1 N, P (Normal), F1 |
| 2 | the box check mapped Fit as centred at the smaller scale | Fit stretched to W x H (two scales), Normal centred, Fill centred at max | page-picture.mjs placement, panelAt | mp1 F2, V3 |
| 3 | plan and approval said "padded", "drawn on the page first" | neither (picturePages: flipped, its fit); the measurement in DESKTOP-TESTS.md, cited at the rule | twin-pictures.mjs, TOOLS.md, DESKTOP-TESTS.md | mp1 A1, A2 |

## Decisions I made
- A fit Power BI writes that is none of Normal, Fit, Fill (or none) is read as Normal: centred, so still symmetric.
- `picturePages[].padded` is gone (no page is padded); nothing reads it (grep: create_arabic_twin, approval-window).
- The CHANGELOG's MP1 bullet never said padding: unchanged.

## Round 2: the causes found in the files
| Item | Cause | Fix | Test |
|---|---|---|---|
| 1 | twin-pictures.mjs read the file from `image.name`, the label Desktop shows; the file is `url`'s ResourcePackageItem.ItemName | the file from ItemName (the name only when there is none); the Arabic page's ItemName the new file, its label kept when it differs | R1 |
| 2 | an image with name and url '' counted as a picture (Mirror.pageHasPicture reads names only) | no file, no picture: the picture pages are picturesOf's (`picturePageIds`) | R2 |
| 3 | NOT the group (R4: groups mirror right at every level). T-6's rule "a bar list with hidden names and a visual of names beside it, kept as one block in its order" took the ratings table (other fields) for the bar chart's names: the made-up pair gives exactly the laptop's 21 and 393 | the names visual must show the bars' own category field (a text box, with no field, still can) | R3; T-6 (v030twin) still green |
| 4 | Mirror keeps a small visual at its place on its host (T-3); badgesWithText only acted when the HOST was a text box | it turns with a text box it lies on (host or not), with its host's turned title, and is mirrored on its own when kept it would lie on a visual it did not touch in English | R5 (icon beside a title on a card), R6 (icon on a card with a title), R7 (a button under a help text box) |

## Seen, not in scope
- Running `npm test -s -- twin` from the repo root runs the website's runner ("Unknown test: twin"): the MCP's runner
  is `mcp/run-tests.mjs`. Nothing to change; said for the next builder.

## For the laptop
- Re-run part 6's block B on the new build: all four pages PASS (every visual on its panel, Normal included).
- Re-run block C on the owner's 6 dashboards: the 14 picture pages flipped (none "kept: its picture file is not in the
  report"); AdventureWorks p1 mirrored as a plain page; Call Center Overview's "Calls by Department" and the ratings
  table each at its own mirror (21 and 372), the agent card off the heatmap; the 4 KPI icons off their titles;
  Fintech's «فهمت» off its text.
- 5 (ER p1, the weekday bars over the heatmap's weekday names "un", "lon"): not the group cause, and not reproduced from
  the description. If it stays after this build, send the two visuals' visual.json `position` and `visual.visualType`
  (and whether the bar chart's category axis is hidden): a bar chart paired with a matrix's row headers keeps its
  English order (T-6), which a matrix's headers staying at its left (no right-to-left setting) may not suit.
