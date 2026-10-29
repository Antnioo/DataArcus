# MP1b (0.3.1): the page picture placed as Desktop measured it (Normal centred, Fit stretched)

## Summary
- **Approval:** the reviewer's brief "Round 2 as MP1b" (29 Oct), from laptop part 6 block B (Desktop 2.159, shots
  mp1-p1..p4-en-ar-p6.png): Normal is centred at scale 1, Fit is stretched to the page, Fill centred at max scale.
  MP1's padded Normal flip is off by (W - iw)/2 across and (H - ih)/2 down. The owner: D-1029-03, D-1027-12.
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
- **State:** FULL_RUN_LINE
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

## Seen, not in scope
- Running `npm test -s -- twin` from the repo root runs the website's runner ("Unknown test: twin"): the MCP's runner
  is `mcp/run-tests.mjs`. Nothing to change; said for the next builder.

## For the laptop
- Re-run part 6's block B on the new build: all four pages PASS (every visual on its panel, Normal included).
