# MP1 (0.3.1): picture pages mirrored in the Arabic twin (the picture flipped, the visuals on its panels)

## Summary
- **Approval:** the reviewer's brief "Go on MP1" (29 Oct). The owner: D-1029-03 ("I want all the pages to be mirrored
  rtl": every page of the twin right to left, picture pages too; a picture that may hold text or a logo is asked, never
  flipped silently), D-1027-12 (the twin identical in look), D-1027-13 (nothing written that the person did not approve).
- **Base:** `fix/0.3.1-mp1` from `origin/integration/0.3.1` at 115db29f. Push only this branch.
- **Scope:** a new `mcp/lib/page-picture.mjs` (PNG and JPEG read, PNG written, the placement rule, the flip, the
  text signal, the panel check); `mcp/lib/twin-plan.mjs` (new functions near :99 and :211 only, not the texts code);
  `twin-pages.mjs` (a badge on a text box mirrored within it); `twin-write.mjs`, `twin-copy.mjs` (the new pictures
  registered, only the Arabic pages pointed to them); `twin-preview.mjs`; `tools/create_arabic_twin.mjs` (input
  `flipPictures`, the pin); `approval-window.mjs` (a row per picture page, EN and AR); TOOLS.md, SKILL.md, CHANGELOG.
  Not touched: TB1c's ground (twin-texts.mjs's field and title listing, titleMeasures, check-report.mjs), `assets/js/`.
- **Expected checks:** (written before the work) a new suite `mp1` (area twin), about 50 checks, red on 115db29f first
  except guards. D (the decoder: PNG RGBA, RGB, grey, grey+alpha, palette, 16-bit, interlaced read as pngjs writes
  them; a baseline JPEG of the repo and a progressive one within 3 levels of a reference: about 8). P (made-up pages
  drawn by the test, 3 layouts (a left rail + 2 panels; 3 card columns; a header band) x 3 fits (Normal narrower than
  the page, Fit, Fill) x PNG and JPEG = 18 pages: each Arabic page points to a new PNG that is the flip of the English
  picture (Normal: padded to the page first), and every visual sits on the same panel: 36). O (the original's files
  byte-identical: 2). A (the plan, the approval page EN and AR say per page flipped / asked / kept, the digest covers
  the new pictures: about 4). T (a picture with words: asked, kept until `flipPictures` names it; then flipped: 2).
  W (a wallpaper picture kept as it is, said: 1). X (the EN-AR copy: Arabic pages on the new pictures, registered,
  the English ones untouched: 2). V (a badge on a text box mirrored within it, no new overlap: 1; a new overlap named
  by page and visual: 1). Other suites: a picture page that was kept left to right is now mirrored (said per test if
  a number moves). Full run: the base's suites + 1 (mp1).
- **Got:** `mp1` 63 checks (the estimate about 50: P took 36 as planned, D 10, V 3), red on 115db29f first: 56 of 62
  failed there, the 6 green are guards (both twins written, O1-O3, X2); D10 (the inflate cap) red on f1dd798 first.
  Areas: twin 19 suites pass (no other number moved), arabic 15, report 42; lint 0; changelog-words, agent-memory,
  result-lines PASS; no `assets/js/` change (no build:min). mcp 1594, mutation 198 (76 mutants, all killed): unchanged.
- **State: DONE.** Full run on 7ad8c53: "run-tests: 127 suites passed" (the base's 126 + mp1). CI on 7ad8c53: run 40835247944 green (Linux, Windows, macOS); a run on the note's commit queued after it.
- **Resume:** none; the reviewer's merge (TB1c first; integration was still 115db29 at the full run).

## The plan
1. **Read the page picture.** For each page: `objects.background`'s image (name, scaling Normal / Fit / Fill,
   transparency) and `objects.outspace`'s (the wallpaper). The file under StaticResources/RegisteredResources read
   by a decoder of DataArcus's own (`page-picture.mjs`, no new dependency): PNG (every colour type and depth,
   interlaced too) and JPEG (baseline and progressive, Huffman). Anything else (another format, arithmetic JPEG, a
   missing file, over 8192 px) is kept left to right as before, with why; `mirrorPicturePages` keeps its meaning for
   those (mirror anyway, the picture as it is).
2. **The rule** (Codex): picture box (u, a) -> x = ox + s*u; flip and mirror agree when 2*ox + s*iw = W. Fit
   (s = min, centred) and Fill (s = max, centred) agree for any size: the picture is flipped as it is. Normal (scale 1
   at 0,0) agrees only when iw = W: the picture is first drawn on a transparent W x H canvas at (0,0) (padded or
   cropped), then flipped, Normal kept. The output is always a PNG, `<name>-ar.png` (a free name), registered in
   report.json; only the Arabic pages point to it; the original picture is untouched (byte-identical files).
3. **Words in the picture.** A cheap signal (several small components of one colour on one baseline) can only warn:
   such a page is "asked": kept left to right until the person approves its flip (`flipPictures: [page ids]`, pinned
   in the plan like labels). The plan, the approval page and the answer list every picture page: flipped (fit,
   padded or not) / asked ("This picture may contain words or a logo that will read backwards") / kept (wallpaper,
   unreadable).
4. **The box check** after mirroring and text fitting, on each flipped page: every visual that sat inside a panel of
   the English picture sits inside the same panel of the flipped one (panels: regions of one colour, by their
   bounds); no new overlap between visuals that the English page did not have. Each failure listed by page and
   visual (`pictureChecks`). A small visual on a text box whose text turns right (Mirror keeps it at its place on the
   host) is mirrored within the text box: the text and the badge swap sides together (the cause clear from the files).
5. **The digest:** the new pictures are files of the plan's exact tree, so the approval digest covers their bytes; the
   write's rebuild flips the original again and must give the same bytes.
6. **Wallpaper** (outspace) is relative to the viewport, not the page: kept unflipped, said per page.

## Before -> after
| Item | Before | After | Where | Test |
|---|---|---|---|---|
| 1 | a page on a picture kept left to right; `mirrorPicturePages` mirrored the visuals over the unflipped picture (off their panels, as part 4b saw) | mirrored by default, the picture flipped into `<name>-ar.png` (PNG or JPEG read, PNG written; Normal drawn on the page first), registered, only the Arabic pages pointed to it; `mirrorPicturePages` now only for a picture that is not flipped (asked or unreadable) | page-picture.mjs, twin-pictures.mjs, twin-plan.mjs, twin-write.mjs, twin-copy.mjs | mp1 D1-D9, P (36), O1-O3, X1-X2 |
| 1b | an `outspace` picture was not seen; the legacy `wallpaper` key kept the page left to right | both: the wallpaper kept as it is, the page mirrored, said | twin-pictures.mjs picturesOf | mp1 W1 |
| 2 | nothing checked the boxes on a picture | `pictureChecks.offPanel` (a visual off the panel it sat on, after the text fitting) and `newOverlaps`, by page and visual | page-picture.mjs offPanel, newOverlaps | mp1 V2, V3 |
| 2b | a small visual on a text box kept its place while the text turned right (the text under it) | it goes to the text box's other end with the text (a centred text keeps it) | twin-pages.mjs badgesWithText | mp1 V1 |
| 3 | one row "kept left to right (the picture can't be mirrored)" | picturePages per page: flipped (fit, padded) / asked (words) / kept (wallpaper, unreadable), EN and AR; the approval page a row per page; the new pictures in the plan's exact files (the digest) | twin-pictures.mjs, create_arabic_twin.mjs, approval-window.mjs | mp1 A1-A4, T1-T2 |

## CHANGELOG line
(at the end of [Unreleased]) "Every page of the Arabic twin right to left, pages drawn on a picture too: ..."

## Decisions I made
- The picture logic is a new module, `lib/twin-pictures.mjs` (with `lib/page-picture.mjs`); twin-plan.mjs only calls it
  at :99 and :228 and says it at :181 and :273 (TB1c's texts code untouched).
- `mirrorPicturePages` kept, narrowed: a readable picture is flipped without it; it still mirrors a page whose picture
  is not flipped (asked, unreadable), the picture as it is. Changed on purpose: the default for a readable picture
  page (was left to right).
- The approval of a flip that may show words backwards: `flipPictures: [page ids]`, pinned in the plan like labels (a
  write whose flipPictures differ is refused).
- The twin's Arabic page gets a NEW file `<name>-ar.png` (a free name), not GD2's same-name glass flip: the twin's
  copy of the original picture stays byte-identical; a picture whose flip is itself (symmetric, not padded) keeps
  its name and no file is added.
- Placement as Codex's model: Fit centred at min scale, Fill centred at max, Normal at (0,0) scale 1 (design-engine.js
  calls Fit "Stretch": also symmetric, so the flip holds either way). Normal with iw != W is drawn on a W x H canvas
  at (0,0), cropped or padded transparent, before the flip.
- The words signal: 4 or more small regions of one colour (4-48 px high at <= 1280 wide), one baseline (2 px),
  about one height, each within 1.5 heights of the next. A panel: a region of one colour (28 a channel), 0.1 % of
  the picture and 8 x 8 or more; a visual's panel: the smallest region whose bounds hold its box (2 px slack).
- The box check runs on flipped pages (the brief's scope); the badge fix on every mirrored page (its cause is the
  mirror, not the picture).
- The twin's approval page is wholly Arabic (FX1): its rows say the page in Arabic; the English is in the answer.
- Limits: 8192 a side and 16.8 M pixels; 12-bit, CMYK, lossless and arithmetic JPEGs are not read (the page kept
  left to right, with why). Fixtures: 8 JPEGs of the test's own drawings (36 KB in all) in `mcp/fixtures/mp1/`,
  remade by `make.mjs` (ImageMagick and Pillow, by hand only).

## For the owner
- Every picture page of the twin is now right to left with its picture flipped. A picture with words or a logo is
  listed as "asked" and stays left to right until you approve its flip; the plan names any visual that leaves its
  panel. Wallpaper (around the page) stays as it is.

## Risky changes
- Two picture readers of DataArcus's own (`page-picture.mjs`, about 200 lines), no new package: they read the
  person's picture files. Measured against Pillow on 12 JPEGs (baseline 4:2:0, progressive 4:2:0 and 4:2:2, grey,
  restart markers): at most 4 levels apart, mean under 0.16; PNG pixel for pixel against pngjs (every colour type, 16
  bits, palette, interlaced). A file that fails is never a crash: the page is kept, with why.
- A flipped JPEG is written as a PNG: larger (a 1600 x 900 photo-like screenshot: 675 KB as PNG).
- Time: a 1600 x 900 picture about 0.4 s, 2560 x 1440 about 1.2 s on the first call (cached by its bytes after).

## For the laptop
1. Desktop 2.159: how a page picture is placed in Normal, Fit and Fill (Codex could not measure it): one made-up page
   each (a 520 x 360 picture on a 640 x 360 page for Normal; a 400 x 250 one for Fit and Fill: the mp1 drawings), the
   twin written: every visual on its panel. If Normal is centred, not at (0,0), the padded picture is off: say so.
2. The owner's Call Center and RepeatIQ twins: every visual on its panel; any page "asked" (words) or named in
   pictureChecks looked at; the KPI icon of part 4b no longer over «المكالمات».

## Seen, not in scope
- The approval page's preview draws the glass pictures only, not a flipped page picture (page-preview.js is shared
  with the website): the page boxes are drawn over the page colour.
- `Mirror.pageImages` reads `wallpaper`, a key PBIR's page schema does not have (`outspace` is the schema's).

## Lessons for the reviewer
- The twin's approval page is wholly Arabic (FX1): a brief's "the approval page (EN and AR)" is met by the Arabic rows
  there and the English in the plan's answer; a test that greps the page for English finds nothing.
- A panel threshold of 1 % of the picture missed a KPI-sized tile (the first V3 run): 0.1 % and 8 x 8 now.
