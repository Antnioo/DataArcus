# SQ4 (0.3.1, the night run): the Arabic twin's "Seen, not in scope" items

## Summary
- **Approval:** the owner, 25 Oct (the 0.3.1 night run): every "Seen, not in scope" item fixed, carefully. Batch SQ4 of
  [SEEN-QUEUE.md](SEEN-QUEUE.md#sq4-the-arabic-twin): AF1-S1, X1-S2, X2-S3, D3-S1, J18-S4, Q1-S7, X2-S1.
- **Scope:** `mcp/lib/twin-write.mjs`, `twin-copy.mjs`, `twin-texts.mjs`, `twin-read.mjs`, `twin-plan.mjs`,
  `twin-pages.mjs` (the button fit), `mcp/tools/create_arabic_twin.mjs` (one kind name), `assets/js/report-mirror.js`
  (`labelMobile`), `assets/js/pbip-sizing.js` and `pbip-page.js` (the phone title rule in one place, both use it);
  new suite `mcp/test-0.3.1-sq4.mjs` (one line in `mcp/tests.json`). Not SQ5's files. SEEN-QUEUE.md: my 7 Status cells.
- **Base:** `fix/0.3.1-sq4` from `origin/integration/0.3.1` (3bda227).
- **Expected checks:** new `sq4` about 22; twin suites and mirror-parity: the same names and counts (twin-complete 24,
  language-toggle 27, en-ar-copy 27, twin-preview 23, twin-artifact 21, mirror-parity 58, bilingual-report 32);
  `npm test -- --keep-going` all PASS; `check-agent-memory` PASS.
- **Resume:** plan pushed; next: the red suite, then the fixes.

## Each item, confirmed on 3bda227
- **AF1-S1** true: `writeTwin`'s `nextSteps` says `Open "${path.basename(twinPbip)}"` raw (`twin-write.mjs:115`); the
  `pbip` field of the same answer is screened (`pathOut`).
- **X1-S2** true: a bookmark group (bookmarks.json `items[].children`) is not in the twin's texts; the twin copies
  bookmarks.json as it is and the EN-AR copy's Arabic group keeps the English `displayName` (`twin-copy.mjs:227`).
- **X2-S3** true: the copy numbers its sync groups "(EN-AR n)" in the slicers' file-name order
  (`twin-read.mjs:51` sorts visuals by file; `twin-copy.mjs:176` counts in that order).
- **D3-S1** true: the phone header text box keeps its English size; `labelMobile` changes the text only. The writer's rule
  (`pbip-page.js` phoneLook: 14pt, or the largest size down to 8 whose one line fits the phone box) is not applied.
- **J18-S4** not true for the twin: the twin never swaps a field (it binds what the original binds; no "(Arabic)"
  column is bound by it: the month column is a script the user applies), and its sheet is built from its own pages
  (`twin-plan.mjs:174`), so it names the column the twin shows. The swap is create_report's (`pbip-bind.js` `inAr`)
  and its sheet is plan_layout's (SQ10's file): listed below under "Seen, not in scope". OBSOLETE in the queue.
- **Q1-S7** true: every alt text is its own entry in the plan's `texts`, also when it repeats its visual's title word for
  word (the alt text then takes the title's label, `sameTextLabels`).
- **X2-S1** true: on the lab demo (`lab/bilingual-demo.mjs`) check_report gives BUTTON_ONE_LINE on both Arabic Reset
  buttons (201 wide in a 201-wide group; 17 Arabic characters at 15pt and the icon need 232): `fitButtons` finds no room
  and lists it as cut. The writer's own rule in a narrow place (`pbip-sizing.js` resetFit) switches the icon off.

## Plan (tests first: each red on 3bda227, then the fix at its cause)
1. **AF1-S1** nextSteps names `pathOut(twinPbip)`, as the `pbip` field does.
2. **X1-S2** `readOriginal` reads the groups of bookmarks.json; `textsOf` lists each group's name (`bookmarkGroup:<name>`,
   kind `bookmarkGroup`); the separate twin writes bookmarks.json with the approved names; the copy's Arabic group takes
   the approved name (the English group unchanged); the copy's note says it only for a group left without one.
3. **X2-S3** the copy numbers its new sync groups by page order, then the slicer's place (y, then x; then its name).
4. **D3-S1** `pbip-sizing.js: phoneTitleSize(text, width, top)` holds the writer's rule; `pbip-page.js` calls it (the same
   sizes: golden unchanged); `labelMobile` applies it to a relabelled one-run phone text box, shrinking only (never above
   the size it had): a longer Arabic title gets the size the writer would give it.
5. **J18-S4** OBSOLETE; a check that the twin's sheet names only columns the twin's pages bind.
6. **Q1-S7** in the plan's `texts`, an alt text that repeats its visual's title word for word, with no label of its own
   or of the title yet, is not listed alone: the title says it (`altTextToo: <id>`), and it takes the title's Arabic.
   Once the title has its Arabic, the alt text is listed with `labelFrom` as today (the plan shows what is written).
7. **X2-S1** `fitButtons`: a button still too narrow after the widening, with an icon, whose text alone fits: its icon
   is switched off (shapeType blank, as the writer writes it), said in `fitted.buttons` (`iconOff`).

## Expected (before any run)
- `node test-0.3.1-sq4.mjs`: FAIL on 3bda227 on every check but J18-S4's; PASS after (about 22 checks).
- twin suites, mirror-parity: PASS, counts unchanged. `npm test -- --keep-going`, `check-agent-memory`: PASS.
- For the laptop: D3-S1 (a long Arabic phone header title, its size) and X2-S1 (the Reset button without its icon).
