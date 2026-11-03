# SP5 (0.3.2, the split): assets/js/pbip-export.js -> pbip-zip.js + pbip-sample.js (behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP5" (2 Nov); the owner D-1016-01, D-1102-02, D-1102-04. Backlog B-280, B-286
  (the Codex split map: "Extract pbip-zip.js and pbip-sample.js first; then pbip-bidi.js").
- **Base:** `feat/0.3.2-sp5` from `origin/integration/0.3.2` at 550cea1. Pushed only this branch; never merged.
- **Scope:** new `assets/js/pbip-zip.js` (the stored ZIP: named byte entries -> bytes; `zip`, `crc32`) and
  `assets/js/pbip-sample.js` (the sample sales model: its words per language, `model(lang)`, `bind(lang)`). pbip-export.js
  keeps validation, build, names, fitOptions and the bidi isolation (pbip-bidi is not this job), and re-exports
  `zip`, `crc32`, `AR_MONTHS` exactly as before. Website: both new .min.js in theme-generator.js's BUILDER list after
  pbip-query (pbip-sample reads its DAX names) and before pbip-export; no page loads pbip-export.min.js by a script tag
  (checked: the lab page loads it only through BUILDER). MCP: every caller requires pbip-export.js, which requires the
  two new files (no MCP file changes).
- **Plan:** (1) characterise on the base: suite `sp5` (MCP, area report) and website suite `sp5` (Playwright), both
  recorded on the base code; (2) move; (3) the same records pass unchanged; min files, stamps, csp, ar-pages, sitemap.
- **MCP suite sp5 (test-0.3.2-sp5.mjs), in process, the clock fixed (the ZIP writes `new Date()` into every entry)
  and Math.random seeded before each build (pbip-query's ids in Node):**
  Z1 a ZIP of named entries (text, bytes, an Arabic name, an empty file): sha256 of the bytes; Z2 crc32 of 4 inputs;
  S1-S4 build with the sample model, EN and AR (rtl) x two themes: sha256 of the ZIP and of every file (one check
  each); F1 fitOptions for the sample EN and AR; A1 AR_MONTHS. **Expected: 9 checks on the base and after.**
  After the move, M1-M3 (the new modules are what the facade uses; the BUILDER order): **sp5 12 after.**
- **Website suite sp5 (scripts/tests/sp5.mjs), the lab theme generator page, ?lang=en and ?lang=ar:** the random
  source seeded and the clock fixed by an init script, reseeded just before the click; the download's every non-image
  file byte-identical to the record, and the ZIP container byte-identical to pbip-zip's re-encoding of its own entries.
  The background PNGs are canvas-drawn (fonts and Chromium build differ between this container and CI): recorded here,
  compared whole on the same machine only (the note says what was seen). **Expected: 2 checks on base, 3 after**
  (W3: the page loaded pbip-zip and pbip-sample before pbip-export).
- **Before -> after:** `assets/js/pbip-export.js` 603 -> 522 lines; `pbip-zip.js` 38 (new); `pbip-sample.js` 76 (new).
- **Expected checks:** sp5 9 on the base, 12 after; website sp5 2 on the base, 3 after.
- **Got:** sp5 9 on the base code (442eeb0), recorded; after the move (a16ad868) 12, the records unchanged. Website
  sp5 2 on the base, 3 after; the whole ZIP, PNGs included, also identical here (SP5_WHOLE=1). A one-word change to the
  sample model fails both (MCP sp5 S1-S4, website W1: model.bim), then reverted.
- **Areas (on a16ad868):** report 44 of 44 (glass-tables 113 once cba24a5 was fetched: shallow clone, as SP1); core
  CORE_RESULT; release 5 of 5; website sp5 3, pbip 111, theme-generator 922, theme-generator-lab 922, layout-canvas 31, design-engine 600;
  lint 0; check-min (stamps compared with main) and test-site-config pass.
- **CI:** CI_RESULT
- **State:** STATE_NOW
- **Resume:** RESUME_NOW

## CHANGELOG line
- **Inside the report writer:** the zip file and the sample sales data each have a file of their own; every download,
  on the website and from the MCP, is byte for byte what it was before.

## Decisions I made
- The clock is fixed in the tests, not in the product: the ZIP keeps writing the time of the download into every entry
  (behaviour identical). The MCP suite replaces `Date` in process; the website suite with an init script (no-argument
  `new Date()` only, so the page's timers keep the real `Date.now`), and seeds `crypto.getRandomValues` and
  `Math.random`, reseeded just before the click (the page's ids are drawn at build time).
- The website check compares every non-image file byte for byte and the ZIP container against pbip-export's `zip` of
  the downloaded entries in Node; the canvas-drawn PNGs are recorded but compared only with SP5_WHOLE=1 (CI's Chromium
  and fonts are not this container's). Here the whole ZIP matched before and after.
- "EN and AR theme generator pages": the lab page is the only page with the project card (pbipBtn), so the suite
  downloads from it at ?lang=en and ?lang=ar, as scripts/tests/pbip.mjs does; registered in shard 1 beside pbip.
- pbip-sample's API takes the language (`model(lang)`, `bind(lang)`); no theme parameter: the sample's files do not
  read the theme (S1-S4 vary the theme to prove it). `TEXTS` keeps the words per language.
- `AR_MONTHS` in the facade's API is pbip-query's list (`AR_MONTHS.slice()`), the same list `T.ar.months` was.
- W3 reads the resource timing order, not the DOM order: the page's own deferred pbip-query tag sits after the
  scripts BUILDER appends to the head, though it ran first.
- New stamps `20261102sp5` for pbip-zip, pbip-sample, pbip-export and theme-generator.min.js (both English pages; the
  Arabic copy rendered again).

## For the owner
none

## Risky changes
none (bytes proven identical in Node and in the rendered download).

## Seen, not in scope
- `docs/MODULES.md` line 73 ("What a report looks like") still starts with pbip-export.js: right, left.
- The ZIP's entry time is the visitor's local clock: two downloads of the same design differ only there (and in the
  random ids). A fixed time would make downloads reproducible; a behaviour change, not this job.
- The design-engine website suite routes `pbip-export.min.js*` to a 404 (capture-design-fixtures `noWriter`): it
  passes (600 checks on a16ad868): the writer still fails to load as a whole; a later split may route its modules too.

## Lessons for the reviewer
- pbip-bidi (next): `isolateFiles`, `walkVisual`, `daxTexts`, `lit`, `TITLED`, `WRAP_*` sit at the end of
  pbip-export.js and read only `Measure` (text-measure.js). build calls `isolateFiles(files, [], { all: true })` for an
  Arabic build, and the MCP calls `Pbip.isolateFiles` (lib/terminology.mjs re-exports it): keep it on the facade's API.
- sp5 S3/S4 (the Arabic builds) and website W2 already cover the isolation's output byte for byte: they are the gate
  for pbip-bidi unchanged. Never re-record the fixtures on a split branch.
- Source-reading tests pin pbip-export.js text: 0.2.9w (the BuildInput/BuildResult doc comment and `function build`
  between `^  function build(o) {` and `^  }$`), 0.2.9i (the writer's five files concatenated), mirror-parity
  (matrixRtl), bd2 and dax-functions (Pbip.isolateFiles). A new module's text may need adding to 0.2.9w/0.2.9i's lists.
- A new browser module goes into theme-generator.js's BUILDER (lazy, in order) and needs a .min.js made once by hand:
  build:min rebuilds only tracked .min.js files (git add the source and min, then build:min verifies).
