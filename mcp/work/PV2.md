# PV2 (0.3.2): the preview draws mixed Arabic and English labels in the report's order (AR3, B-361)

## Summary
- **Approval:** the owner, D-1105-15 (5 Nov): "Go" (E1 round 5 fixes, the reviewer's plan #4-#7: AR4, PL1, PV2).
- **Base:** `fix/0.3.2-pv2` from `origin/integration/0.3.2` at b8dadf7. Push only this branch; never merge, no PR.
- **Scope:** `assets/js/page-preview.js` (and its .min.js, the stamps `npm run build:min` makes), a new site suite
  `scripts/tests/pv2.mjs` (in run-all.mjs ALL, SHARDS, SLOW; its README row), `mcp/CHANGELOG.md` one line, this
  note, one line in `mcp/WORK.md`. Not AP1's files, not .github/, mcp/package*.json, lab/evidence/.
- **The fault (AR3):** `clean()` (page-preview.js:18) strips the writer's isolate marks and the SVG is laid out ltr
  (:346), so 8 of AR3's 14 mixed labels are drawn in another order than the report writes them.
- **Plan:** 1. this note. 2. The failing suite first: AR3's 14 labels through `Preview.render` on a right-to-left
  page in Chromium, each label's character order equal to Chromium's on the written text (`isolateLatin`) in a
  `dir="rtl"` box; plus the guards below. 3. The fix in page-preview.js only: on a right-to-left page each shown text,
  after `clean()` and after `fit()`/`wrap()` cut it, is written as the writer writes it (`text-measure.js
  isolateLatin`; U+2067 ... U+2069 when it has no Latin letter); `clean()` stays; the SVG keeps `direction="ltr"` and
  every anchor. 4. The approval page's preview and the theme generator's preview checked in the same suite.
- **Expected checks:** pv2: 14 label orders + 6 guards = about 20. Red on the base: 8 of the 14 orders (AR3's
  number) and the guards that need the wrap (the cut title, the approval page's mixed title). Green after: all.
  Guards: an English page unchanged (no mark added); an English-only title on an Arabic page not wrapped (drawn
  left to right); a name carrying marks still drawn without them (clean stays); a cut title keeps its "…" inside
  the isolate and inside its box; the approval page (approval-view.mjs askPage, Arabic) draws a mixed title in the
  written order; the theme generator lab page's Arabic preview is the shared renderer's, every mixed text in order.
- **Every other suite unchanged** (no expected number changed, no fixture re-recorded); lint 0; check-modules
  --strict green; check-agent-memory, changelog-words, test-site-config pass.
- **Got:** pv2 20 checks: red on the base 12 of 20 (P3, P6, P7, P8, P9, P11, P12, P14: 8 of 14, AR3's number; G3,
  G4, G5, G6), green after the fix 20 of 20. Every other suite unchanged and green: MCP 214 of 214 scripts, site
  43 of 43; lint 0.
- **Resume:** steps 1 to 4 done; the last merge, build:min, checks and tests.yml remain.

## What changed (before -> after)
`assets/js/page-preview.js` `render()`: a new `asWritten(t)` beside `fit()`, applied to every drawn text (a text box's
or a button's text, a slicer's header, each line of a title) after `clean()` and after `fit()`/`wrap()` cut it.
On a left-to-right page it returns the text as it is. On a right-to-left page:
- a text with a Latin letter: `text-measure.js isolateLatin` (Arabic and Latin: the writer's U+2067 RLM FSI ... PDI
  RLM U+2069; English only: unchanged);
- a text with no Latin letter: U+2067 ... U+2069.

Drawn on an Arabic page, runs left to right as on screen (a right-to-left reader starts at the right):
- «Sales YTD الإجمالي»: before «Sales YTD» «الإجمالي» -> after «الإجمالي» «Sales YTD».
- «Q1 / الربع 1»: before «Q1 /» «الربع 1» -> after «/ الربع 1» «Q1».
- «هامش الربح %» (the theme generator's sample card): before «هامش الربح» «%» (the «%» at the right end, read
  first) -> after «%» «هامش الربح».
- «My Brand Theme» on the Arabic sample: unchanged (no mark added).
- A cut title: before «Sales YTD الإجمالي حسب ا…» drawn left to right -> after the same clean cut, then wrapped, so
  the «…» sits inside the isolate (at its logical end, the left end).
`clean()` is unchanged: a name's own marks (U+202E, U+2066 ...) are still removed first (G3).

## Checks
- The red run (d0f0a28, before the fix): `node scripts/tests/run-all.mjs pv2`: FAIL 20 checks, 12 failed (above).
- After the fix: `PASS  pv2  20 checks`; `cd mcp && npm test -- --keep-going`: 214 of 214 scripts passed;
  `npm test` (site): all 43 passed; `npm run lint` 0; check-modules --strict, check-contracts, check-min,
  check-agent-memory, changelog-words, check-result-lines, test-site-config: PASS.

## Decisions I made
- The wrap is applied at drawing time, not to `title` itself: `fit()` and `wrap()` measure and cut the clean text,
  and the marks never get cut off (AR3's warning); `textWidth` counts them 0 wide, so no size changed.
- An English-only text on an Arabic page is not wrapped in U+2067 (the brief's rule read literally: `isolateLatin`
  when the text has a Latin letter). Wrapping it would turn «Revenue (AED)» into a right-to-left paragraph and move
  its bracket (G2 pins it).
- If text-measure.js is not loaded (a browser page that loads the preview without the writer), a text with a Latin
  letter is drawn as before; both pages that show the preview load it (G5 in Node, G6 in the browser).
- The new suite is a site suite (`scripts/tests/pv2.mjs`, Chromium) in shard 1 (its short suites); the approval page is
  `approval-view.mjs askPage` on a made-up plan, loaded in the same Chromium.
- Orders are measured as AR3 measured them (each character's box; a tie by direction), the reference in the SVG's own
  font, size and weight, so a machine's font does not decide the result.

## For the owner
- New Arabic text: none. AR3's open question stays on the laptop list: a text with no Latin letter («هامش الربح %») is
  written unwrapped; the preview now draws it right to left as an Arabic report reads it. One Desktop look tells if
  Desktop draws its «%» on the same side.

## Risky changes
none (the preview's drawn text only; no size, no box, no anchor changed).

## Seen, not in scope
- The flag and note tags and the page's aria-label are fixed words, not wrapped (no mixed text in them).
- `fit()` still cuts by UTF-16 unit; a cut can split a surrogate pair or a lam-alef (the picture only).

## Lessons for the reviewer
- A site suite reads the `.min.js`: G6 stayed red until `npm run build:min`, the Node checks were already green.
