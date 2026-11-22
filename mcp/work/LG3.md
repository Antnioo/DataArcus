# LG3 (0.3.4): the DataArcus mark with a space between the bars and the arc

## Summary
- **Approval:** the owner, 22 Nov, D-1122-06 "there should be a space between the bars and arc inside the arc" (brief of 2026-11-22).
- **Base:** `fix/0.3.4-lg3` from `origin/integration/0.3.4` at b62a59eb. Push only this branch; never merge, no PR.
- **Scope:** assets/img/favicon.svg, favicon-48/96/192/512.png (and any other mark PNG that measures wrong), a committed
  script to regenerate them, a gap test, the site's ?v= stamps (made by `npm run build:min`), before/after pictures in mcp/work/LG3/.
  Not logo.svg, not any text, not Desk or Pulse (SP5, PD3).
- **Expected checks:** `node scripts/check-modules.mjs --strict`; the new test; `node scripts/stamps.mjs`; `node scripts/test-site-config.mjs`.
- **Resume:** plan written 2026-11-22T09:05Z; nothing built yet.

## Plan (written before the work, 2026-11-22T09:05Z)
1. Measured on b62a59eb (R-9): the gap is arc stroke edge (round caps included) to bar edge. favicon.svg: 0.05 of 40 per the brief
   (to be measured by the test). logo.svg: 1.52. In the PNGs: favicon-48/96/192/512 hold favicon.svg's geometry (arc 148 px wide at 192,
   bars 76 wide = 19.2 x .84 x 4.8); apple-touch-icon, logo-square and dataarcus-og-logo already show the wordmark's geometry
   (og: arc stroke 73 px = 3.5 units at 20.65 px/unit, bars 90 px = 4.2 units), so they are measured, not regenerated.
2. Test `scripts/test-favicon-gap.mjs`: parses favicon.svg, samples the arc's centreline, takes the distance to each rounded bar, minus
   half the stroke, times the group scale; fails under 1.0. Red first on b62a59eb.
3. favicon.svg takes logo.svg's arc (3.4) and bars; viewBox, navy square rx 9 and inner transform kept. Expected gap: 1.52 x .84 = 1.28 of 40.
4. `scripts/make-favicons.mjs` renders favicon-N from the SVG with Chromium at exact sizes.
5. `npm run build:min` gives every page the one new stamp per path.
6. Pictures: mcp/work/LG3/before and after, 48 and 192.
Expected numbers: filled in as measured.
