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
- **Got:** (after the work)
- **State:** plan pushed; the work next.
- **Resume:** the red checks in `mcp/test-0.3.1-mp1.mjs` on d9d3ae98, then the code.

## The plan
1. `placement(iw, ih, fit, W, H)` as measured: Normal { sx = sy = 1, centred }, Fit { sx = W/iw, sy = H/ih, at 0,0 },
   Fill { s = max, centred }. Every mode is symmetric about the page's centre line, so the picture is flipped as it
   is, its own size, its fit kept: no padding, no crop.
2. The box check maps each box through that placement (two scales for Fit).
3. The measurement in DESKTOP-TESTS.md (29 Oct, Desktop 2.159, the numbers, the shots' path), cited in page-picture.mjs.
4. No sentence says "padded" or "drawn on the page first" any more (plan, approval page, TOOLS.md).

## For the laptop
- Re-run part 6's block B on the new build: all four pages PASS (every visual on its panel, Normal included).
