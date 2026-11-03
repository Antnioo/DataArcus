# RD4 (0.3.2 R&D): seasonal skins for an existing report (Ramadan, Eid, the National Days)

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night): "Go for 10 r&ds during the night ... choose the best r&ds ideas
  that will best fit our code and make us shine". Brief: RD4 in `mcp/research/SCOUT-0.3.2.md` (branch `rd/0.3.2-scout`).
- **Scope:** docs only: this file and scratch scripts under `mcp/research/rd4/`. No product file changes.
- **Base:** `rd/0.3.2-seasonal-skins` from `origin/integration/0.3.2` (e3f0123). Push only it; no merge, no PR.
- **Expected checks:** no product suite touched; the prototype runs the redesign's own functions (`planRedesign`,
  `buildCopy`, `verifyCopy`) on a copy of `mcp/fixtures/twin-project` in `os.tmpdir()`, made-up only.
- **Got:** today's restyle carries a skin's data colours, text and accent losslessly (6 of 6 palettes: 2 files changed,
  28 of 30 byte-identical, verifyCopy passed, 10-34 ms), but it can't take a palette (its input is strict), can't reach
  the page colour or the title colour (outside ALLOW, pageTint forced off), and has no undo: a restyle back gives a
  theme with 3 extra keys and 8 data colours for 6; a token restore gives the same JSON but not the same bytes (the
  final newline). Only the original's theme bytes give the original back. Flag colours as drawn: 5 of 6 fail the
  colour-blind floor on series 1-4; the best order of the same 8 colours passes 5 of 6 (Qatar 9.1 under 10).
- **Recommendation:** a redesign option `season` (a SEASONS table in the design engine, 6 entries the owner names),
  as the first entry of a patch-kind registry, with `season: "off"` restoring the original's theme file byte for byte.
- **Resume:** done; the owner approves each palette and Arabic name, then the builder brief (g) can go.

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

## Checked against the expected (step 4)
- (a) right: `restyle` with `palette` is refused at the input (`inputTakesPalette: false`; preset: true). The library
  under it (`planRedesign` into `themeDesign`) takes a palette as it is: the block is the zod schema alone.
- (b) right: 2 files changed (the theme, `.platform`), 28 byte-identical, for all 6.
- (c) right, and sharper than expected: a token restore that also removes the added keys gives the same JSON, yet
  225 bytes for 226: `buildCopy` writes `JSON.stringify(j, null, 2)` with no final newline (`redesign.mjs:401` json2).
- (d) right: 5 of 6 fail as drawn (Kuwait passes).

## a) Today's code
- **The path:** `plan_layout`/`create_report` with `redesignFrom` and `restyle` (`report-inputs.mjs:114`: `preset`,
  `brand`, `harmony`, `mode`, strict) -> `planRedesign` (`redesign.mjs:331-344`): no custom theme -> a problem ("no
  theme tokens to change"); else `themeDesign({...restyle, pageTint: false})` -> `buildTheme` -> one patch per TOKEN
  that differs (`redesign.mjs:117` TOKENS: dataColors, foreground, background, tableAccent, good, neutral, bad).
- **What a skin needs and where it stops:**

| Skin part | Theme JSON | Today |
|---|---|---|
| Data colours | `dataColors` | yes (replaced whole: 6 become 8) |
| Text, card, accent, status | `foreground`, `background`, `tableAccent`, good/neutral/bad | yes |
| Page tint | `visualStyles.page.*.background`, `outspace` | no: outside ALLOW (`:124`), and `pageTint: false` (`:337`) |
| Title colour | `textClasses.title.color` (and `largeTitle`) | no: THEME_STYLE_AT allows a role's font and size only |
| A report with no theme | (CS1's `ADDED_THEME` adds a file) | no: restyle refuses; only consistentText adds a theme |
| Undo | | none: patches set, a remove is allowed for a visual's text only |

- **Safe by construction:** a visual's own colours (set in its `objects`) are never touched, as ALLOW has no visual
  colour pointer: a colour someone set by hand, a brand colour included, stays. A skin recolours only what follows
  the theme. This is the rule "a brand colour is never changed", and it holds without new code; the plan must say it
  ("visuals with their own colours keep them").
- **Shared engines:** `design-engine.js:16` PRESETS (6, the website's buttons with Arabic names in
  `theme-generator.js:17` PRESET_AR); contrast and CVD in `design-colours.js` (`contrast`, `deltaE` 2000,
  `simulateCvd`: Machado 2009, protan and deutan only); `report-a11y.js:178` readable steps colour 1 to 3:1 on the
  card (the writer's rule); `contrastChecks` (`design-engine.js:619`) checks colour 1 at 3:1 and flags under 1.6:1.

## b) Microsoft's docs (Microsoft Learn, read 3 Nov)
- "Use report themes in Power BI" (`power-bi/create-reports/desktop-report-themes`): "Report themes can make your Power
  BI Desktop reports a colorful reflection of you, your organization, or even the current season or holiday." A custom
  theme layers on the base theme; reset to default reverts a visual to the custom theme. A visual's own format-pane
  colour wins over the theme (why a skin can't reach a hand-set colour, and needn't).
- "Create custom report themes" (`report-themes-create-custom`): only `name` is required; theme colours, structural
  colours, text classes, visual styles; importing a theme replaces the custom theme. The page background lives in
  `visualStyles.page`; title colour in text classes (`title`, `largeTitle` for the visual title). The engine already
  writes both (`design-engine.js:597-613`), measured in Desktop for new reports (LAB-POLISH, 12 Oct), not yet for a
  patched theme of someone else's report: a Desktop check (f).

## c) Ways
| Way | What | Size | Risk |
|---|---|---|---|
| 1. Presets | 6 entries in `PRESETS` (website and MCP: `generate_theme` and `restyle.preset`) | S (about 40 lines) | M: every "use one of ..." line and the website's button row change; recorded goldens list the presets (`scripts/tests/fixtures/design-engine/cases.json`, sp5/sp6 fixtures); a season is not a brand look, and a preset fixes the page and text too |
| 2. Redesign option `season` | `season: "ramadan" ...` and `season: "off"`; a SEASONS table beside PRESETS in the engine; a patch kind "theme-colours" with the page and title pointers | M (about 150 lines + a suite) | L-M: the allowlist grows by 4 pointers; one new op (restore bytes); lossless check unchanged |
| 3. Dated suggestion in check_report | "Ramadan begins in 12 days: a season skin can be planned" from `gulf-dates.js` | S | M: an unasked suggestion in a check's answer (rule 1 "do only what he asks"); needs 1 or 2 first |

- **The patch-kind registry (the scout's Decision 3):** way 2 is the smallest real client. Shape proposed: `PATCH_KINDS
  = { 'theme-colours': { file: 'theme', pointers: [...], ops: ['set', 'restore'], why }, 'titles': {...}, 'positions':
  {...}, 'text': {...} }`; ALLOW becomes the union of the registered kinds; verifyCopy names the kind of each diff.
  Today's four kinds move in with byte-identical goldens (sp19 records planRedesign on 10 reports: the proof).
  RD6 (phone layout) and RD8 (add page) then register a kind each, never editing the core.

## d) The measured prototype (`mcp/research/rd4/measure.mjs`, run from `mcp/`, made-up, `os.tmpdir()`)
The twin fixture's copy (30 files, theme with 6 data colours, no good/neutral/bad); `planRedesign` with `keepPositions`
and `restyle.palette` (the library path), `buildCopy`, `verifyCopy`. Palettes are made up after each season's or flag's
colours, light page, white card; none claims to be anyone's official colours.

| Skin | Tokens | Files changed / same | Data on card, min (under 3:1) | Series 1-4 min deltaE: normal / protan / deutan / tritan | Pass | Best order of the 8: min, order |
|---|---|---|---|---|---|---|
| Ramadan | 6 | 2 / 28 | 3.25 (none) | 26.4 / 7.6 / 13.5 / 21.2 | no | 14.1, 1-2-5-8 |
| Eid | 5 | 2 / 28 | 4.83 (none) | 16.3 / 5.0 / 0.9 / 9.5 | no | 12.3, 1-3-4-5 |
| UAE | 6 | 2 / 28 | 2.20 (8) | 33.8 / 12.3 / 9.1 / 19.6 | no | 17.0, 1-3-4-7 |
| KSA | 6 | 2 / 28 | 1.54 (2, 6) | 13.4 / 8.7 / 6.2 / 11.0 | no | 12.7, 1-4-7-8 |
| Qatar | 6 | 2 / 28 | 2.10 (6) | 13.1 / 7.8 / 7.6 / 14.1 | no | 9.1, 1-4-5-8 |
| Kuwait | 6 | 2 / 28 | 2.10 (8) | 28.3 / 11.9 / 11.5 / 25.9 | yes | 16.4, 1-3-4-7 |

- Floors (Decisions 3): 3:1 per series on the card; deltaE 2000 of 10 or more between any two of series 1-4, under
  normal vision and each simulation. The engine's own `simulateCvd`/`deltaE` agree within 0.3.
- Text on the card: 14.8 to 17.4 for all 6 (4.5 needed). Plan time 10-34 ms.
- **Undo** (from the skinned copy, all 6 alike): U1 restyle again with the original's colours: not the same JSON (adds
  good, neutral, bad; 8 data colours for 6). U2 token restore (set 3, remove the added): the same JSON, not the same
  bytes (225 for 226: the final newline). U3 the original's theme bytes: byte-identical.
- **What the best order costs:** for UAE and Kuwait it moves the red out of series 1-4 (green, black, greys lead): the
  flag reads less. The trade is the owner's (Decisions 4).

## e) The recommendation
Way 2, the redesign option `season`, built as the first registered patch kind:
1. SEASONS in `assets/js/design-engine.js` (beside PRESETS, not in it: no golden moves): per key `{ en, ar, data[8],
   ui{background, card?, text?, accent, good, neutral, bad}, titleColor }`, each palette checked by a test at the
   floors above (3:1, deltaE 10 for series 1-4 under 3 simulations); the order is chosen at the floors, not by hand.
2. `season: "<key>"` on `plan_layout`/`create_report` with `redesignFrom` (an option, not a 12th tool; no instruction
   text spent). The plan says: the season's name EN and AR, the swatches (the approval window draws them as it does
   restyle's), "visuals with their own colours keep them", the page tint and title colour as changes.
3. `season: "off"` with `originalTheme` (the original report's path): the theme file's bytes taken from it, checked
   that the skinned copy's theme differs from it only at the season's pointers (else said: "the theme was edited since;
   only the season's colours are put back", the U2 way, keeping the final newline).
4. A report with no theme: refused, as restyle is today (Decisions 5).

## f) The Desktop checks (one batched laptop run)
1. Ramadan on the lab report, light: page tint, titles, data colours, table accent; every bookmark and button works.
2. The same skin with the report in Desktop's dark canvas setting (or the dark skin variant if the owner wants one):
   text and series readable.
3. `season: "off"`: the copy opens as the original did (a screenshot pair), and the theme file compares equal.
4. A visual with a hand-set colour keeps it under the skin.

## g) The builder brief (size M, risk low-medium)
- **Base:** `integration/0.3.2` (or 0.3.3 as the owner says); branch `ss1-season-skins`. Approval: the owner's yes on
  the 6 palettes and their Arabic names first (Decisions 6).
- **Plan and tests first:** (1) a patch-kind registry in `redesign.mjs` with today's 4 kinds, sp19's goldens unchanged
  (byte-identical answers: the proof nothing moved); (2) SEASONS + the floors test (fails on a palette under them);
  (3) `season` in `report-inputs.mjs`, `redesignPin`, the plan's lines; (4) `"off"` with `originalTheme`, the U3 test
  (byte-identical theme) and the U2 fallback test (final newline kept); (5) one line in `mcp/tests.json`, TOOLS.md, the
  CHANGELOG in plain words.
- **Expected:** 2 files changed per skin (the theme, `.platform`), every other byte-identical; ALLOW grows by the
  page background, outspace, title and largeTitle colour pointers only; tools stay 11.
- **Stop if:** Desktop draws a patched page tint differently from a new report's (check f1 first).

## Decisions I made
1. The prototype calls the library with `restyle.palette` (the zod schema refuses it): measuring the code under the
   gate, not changing it.
2. One made-up status set (good, neutral, bad) for all six: a palette that leaves them out becomes 3 plan problems
   ("not given; from the Corporate preset"), so the plan would be refused.
3. The floors: 3:1 per series (the writer's and report-a11y's rule); deltaE 2000 of 10 between series 1-4 under
   normal, protan, deutan and tritan (Machado 2009, severity 1), the dataviz validator's method as I read it; the
   number 10 is my choice, the owner may set another.
4. The flag palettes are kept as drawn in d; the best order is shown beside them, not chosen: flag feel or
   colour-blind safety is the owner's call.
5. No skin for a report without a theme: adding a theme file (CS1's way) is another patch kind, after the registry.
6. Arabic names in the script are proposals only (رمضان، العيد، اليوم الوطني الإماراتي/السعودي/القطري/الكويتي), for
   the owner's yes; no public line uses them.
7. Way 3 left out: an unasked season line in a check's answer; it can follow once 2 exists, if the owner asks.

## Seen, not in scope
1. `buildCopy` writes every patched JSON file without the final newline (`redesign.mjs:401` json2): each patched
   file of every redesign differs in its last byte from a Desktop save (harmless to Desktop; shows in a git diff).
2. A restyle replaces `dataColors` whole: an original with 6 colours gets 8 (the engine's palette length).
3. `themeDesign`'s "not given; from the preset" repairs become planRedesign problems (`redesign.mjs:338`): a partial
   palette, if ever allowed into restyle, would refuse the plan rather than fill in.
4. `simulateCvd` (`design-colours.js:124`) has protan and deutan only; tritan is in this prototype, not the engine.
5. restyle compares tokens case-insensitively but writes the engine's lowercase: a token equal but cased differently
   is (rightly) not patched; one that differs is written lowercase.
