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
- **Expected checks (pv2):** 14 label orders + 6 guards = about 20. Red on the base: 8 of the 14 orders (AR3's
  number) and the guards that need the wrap (the cut title, the approval page's mixed title). Green after: all.
  Guards: an English page unchanged (no mark added); an English-only title on an Arabic page not wrapped (drawn
  left to right); a name carrying marks still drawn without them (clean stays); a cut title keeps its "…" inside
  the isolate and inside its box; the approval page (approval-view.mjs askPage, Arabic) draws a mixed title in the
  written order; the theme generator lab page's Arabic preview is the shared renderer's, every mixed text in order.
- **Every other suite unchanged** (no expected number changed, no fixture re-recorded); lint 0; check-modules
  --strict green; check-agent-memory, changelog-words, test-site-config pass.
- **Resume:** step 1 done.
