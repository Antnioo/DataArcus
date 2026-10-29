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
- **Got:** (after the work)
- **State:** plan pushed; the work next.
- **Resume:** write `mcp/test-0.3.1-mp1.mjs`, see it red on 115db29f, then the code.

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

## For the laptop (to fill)
