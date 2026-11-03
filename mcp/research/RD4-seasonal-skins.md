# RD4 (0.3.2 R&D): seasonal skins for an existing report (Ramadan, Eid, the National Days)

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night): "Go for 10 r&ds during the night ... choose the best r&ds ideas
  that will best fit our code and make us shine". Brief: RD4 in `mcp/research/SCOUT-0.3.2.md` (branch `rd/0.3.2-scout`).
- **Scope:** docs only: this file and scratch scripts under `mcp/research/rd4/`. No product file changes.
- **Base:** `rd/0.3.2-seasonal-skins` from `origin/integration/0.3.2` (e3f0123). Push only it; no merge, no PR.
- **Expected checks:** no product suite touched; the prototype runs the redesign's own functions (`planRedesign`,
  `buildCopy`, `verifyCopy`) on a copy of `mcp/fixtures/twin-project` in `os.tmpdir()`, made-up only.
- **Got:** (filled in at the end)
- **Resume:** (filled in at the end)

## The plan
1. Read today's code: the restyle path (`mcp/lib/redesign.mjs` ALLOW, planRedesign's restyle, buildCopy's
   re-serialisation, verifyCopy), `mcp/lib/design.mjs` themeDesign, `assets/js/design-engine.js` PRESETS, buildTheme,
   contrastChecks; `assets/js/report-a11y.js` readable; the restyle input (`mcp/lib/report-inputs.mjs:114`).
2. Read Microsoft's docs on report themes (which JSON sets the page background, title colour, data colours).
3. Prototype (`mcp/research/rd4/measure.mjs`): 6 made-up palettes (Ramadan, Eid, UAE, KSA, Qatar, Kuwait); per palette,
   on the twin fixture's copy: each data colour's contrast on the card (3:1), the colour-blind distance between the
   first 4 series (CVD simulation, Machado 2009, deltaE 2000; the dataviz validator's method), files changed vs
   byte-identical (verifyCopy), and the undo (restyle the skinned theme back to the original's tokens): is the
   original's theme file given back byte for byte?
4. Expected before measuring (written now, checked after): (a) today's restyle can't take a palette (its input is
   strict: preset, brand, harmony, mode), so the 6 skins go through a local option in the prototype only; (b) the
   files changed: 2 (the theme file and .platform), every other file byte-identical; (c) the undo is NOT byte-identical
   today: the restyle adds tokens the original lacks (good, neutral, bad) and re-serialises the theme, and a patch can
   only set, never remove; (d) at least 1 of 6 flag palettes has a pair of its first 4 series too close for
   colour-blind viewers (red and green flags: UAE, KSA, Kuwait).
5. Write a-g, the "Decisions I made" and "Seen, not in scope"; fill the Summary.
