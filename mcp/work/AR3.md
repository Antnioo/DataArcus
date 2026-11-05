# AR3 (0.3.2): R&D: real Arabic shaping and bidi for previews (harfbuzzjs, bidi-js), proved on one page

## Summary
- **Approval:** the owner, D-1105-14 (5 Nov): "I agree queue them" (the research of 5 Nov: MIT tools only).
- **Base:** `feat/0.3.2-ar3` from `origin/integration/0.3.2` at 6b419ef. Push only this branch; never merge, no PR.
- **Scope:** R&D only. New files in `lab/rd/ar3/` (package.json with exact pins, its lock, a proof script, its
  result JSON) and this note. Nothing in `assets/`, `mcp/`, `.github/`, `lab/evidence/`; no CHANGELOG line.
- **The question:** does the page preview (assets/js/page-preview.js, texts the writer isolates with pbip-bidi.js /
  text-measure.js) draw mixed Arabic and English labels in the order a reader of an Arabic report sees them, and does
  it join Arabic letters right? Would bidi-js (UAX 9) and harfbuzzjs (OpenType shaping) do better?
- **Plan:** a made-up Gulf calendar page of 14 labels («الربع الأول 2026», «رمضان», «Q1 / الربع 1», «05/11/2026»,
  «٪12», mixed titles). For each label, as a visual order of the label's characters:
  (a) today's preview: page-preview.js's real SVG, drawn in Chromium, each character's x read back;
  (b) the browser's order for the text the writer gives an Arabic report (isolateLatin, right-to-left paragraph);
  (c) bidi-js's order for the same inputs as (a) and (b).
  Shaping: harfbuzzjs's glyph list (ids, advances) for each Arabic label in Noto Sans Arabic (SIL OFL) vs the
  browser's (the same font by @font-face): total advance and a pixel compare of the drawn text.
- **What "better" means, in numbers:** (1) bidi-js agrees with Chromium on identical input: expected 14 of 14 in
  both directions (if it does, it can stand in for the browser in Node: the MCP has no browser). (2) labels where
  today's preview order differs from (b): expected a few (the SVG is `direction="ltr"` and `clean()` drops the
  writer's marks), each with its UAX 9 rule. (3) shaping: harfbuzzjs advance within 1% of the browser's and the
  pixel difference near 0 (Chromium shapes with HarfBuzz itself). (4) cost: bidi-js and harfbuzzjs package and WASM
  bytes, time per page (expected: bidi-js under 5 ms a page; harfbuzzjs about 1 MB of WASM).
- **Expected checks:** no suite changes; the proof script prints `PASS  ar3-proof  <N> checks`; lint 0 (lab/ is
  outside `npm run lint`'s paths).
- **Resume point:** step 1 (this note).
