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
- **Line counts:** pbip-export.js 603 before -> about 510 after (measured below).
- **Expected checks after:** report area passes, core passes, website pbip + theme-generator-lab + sp5 pass; lint 0.
- **State:** planned.
- **Resume:** characterise on the base.
