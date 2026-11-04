## Summary
- **Approval:** the brief "DD2P (0.3.2): one place for the picture bytes" (4 Nov); the owner D-1104-12 (one library,
  fix at the source), D-1104-18 (keep building it), D-1104-15 (Phase 2 equal copies: one copy, no answer changes),
  D-1016-01 (never 100 places).
- **Base:** `feat/0.3.2-dd2p` from `origin/integration/0.3.2` at deff19e. Push only this branch; never merge, no PR.
- **Scope:** four families of docs/CONTRACTS.md, each answered the same by every copy today: crc, png-chunk, u32, lru.
  One pure dual module `assets/js/png-bytes.js` (`crc32`, `be32`, `u32`, `pngChunk`; `window.DAPngBytes`) and one MCP
  module `mcp/lib/small-cache.mjs` (`lru`). pbip-zip.js keeps exporting `crc32`, the same function. Not in this job:
  the PNG decoders, the ZIP format, any picture's content; families canon, contrast, xml, html.
- **Copies before -> after:** CRC-32 5 (5 tables) -> 1; the chunk writer 4 (design-engine `chunk` in `pngOf`,
  glass-picture `chunk` in `encode`, page-picture `chunk`, theme-download-ui `textChunk` by DataView) -> 1; the read
  `u32` 2 -> 1; `lru` 2 -> 1; the big-endian write (`u32` in pngOf, `be` twice) 3 -> 1.
- **Proof:** 15 outputs (every PNG the site and the MCP write, the theme generator's text chunks, three ZIPs) hashed on
  the base (table below) and pinned in `mcp/test-0.3.2-dd2p.mjs`; the old places run from the base's source beside
  the new one on every probe input.
- **Expected checks:** dd2p passes (new); every other suite's number as on the base (the base run is in the table
  "Numbers"); mutation 76/76; `npm run lint` 0; check-min, stamps, check-contracts, check-modules --strict,
  check-agent-memory, check-result-lines green; the probe: crc 6 places, png-chunk 4, u32 3, lru 3 (the new place
  added beside the old ones until they go, then the module and its callers), one answer per input.
- **State:** step 1 (the modules, their test, the hashes pinned).
- **Resume:** step 2 (the MCP places read them).

## Plan (one commit each, every suite green between them)
1. The two modules, their .min.js (png-bytes only: a browser file), the test dd2p (units: 8 byte strings, 8 chunks,
   8 reads, 8 cache step lists, each pinned; the 15 hashes pinned), one line in tests.json beside dd1g.
2. glass-picture.mjs, page-picture.mjs read them (createRequire of png-bytes.js, as twin-geometry requires
   mirror-policy.js; an import of small-cache.mjs); their copies and tables go.
3. design-engine.js, pbip-zip.js, theme-download-ui.js read png-bytes.js; the pages load it before them (the three
   theme generator pages' script tags) and theme-generator.js's BUILDER list before pbip-zip; `npm run build:min`.
4. The parity test: the old places from the base's source (git show deff19e, as sp6 and sp29 do) and the new module
   on every input: one answer each; the hashes equal. Red proof (not committed): one CRC table entry changed.
5. CONTRACTS.md (the four families' "One place" lines, the probe's places), MODULES.md (two rows).

## How the hashes were measured (step 1)
A script in os.tmpdir() (not committed) loaded the base's engines in one Node process with the clock fixed (4 Nov
2026 09:30, local) and the seeded random of `mcp/fixtures/sp1/seeded-random.mjs`, and printed the SHA-256 of each
output below; run twice, the same. The test does the same in its own process.

## Hashes (base deff19e; after: filled at step 4)
| output | bytes | SHA-256 (base) | after |
|---|---|---|---|
| theme background, glassPng 1280x720 (DataArcus) | 96999 | 9648460bb936...61d1c684 | |
| theme background, glassPng 1920x1080 (Desert Gulf) | 151334 | 68dd99c823a4...4c327b37 | |
| encodePng 24x9, a comment, the browser deflate | 385 | 4ffb815ac861...1a6df21a | |
| encodePng 24x9, node:zlib | 171 | eaa48acd7e49...c7aa2153 | |
| the glass flipped (flipGlassPng) | 97278 | 1008ffb464bf...f097b06e | |
| the glass preview (glassPreviewUrl) | 30538 | daa679edb3a6...580016a8 | |
| page picture opaque (writePng 17x5) | 108 | e6153d7c3b33...35018b70 | |
| page picture with alpha (writePng 17x5) | 117 | 7bc52d7a198a...16c22e8f | |
| page picture palette (testPng) | 162 | 540223cb624a...23ddf691 | |
| page picture interlaced (testPng) | 411 | 8f2fe12287a1...f0ff9f09 | |
| page picture flipped (pagePicture, Normal) | 110 | 72311c431247...25423157 | |
| theme generator text chunks (textChunk x2) | 140 | b657f58e0bc1...b080c4d5 | |
| ZIP, pbip-export build (en, DataArcus) | 379608 | 522a03df9d59...36c84bd8 | |
| ZIP, pbip-export build (ar, Desert Gulf) | 390049 | a27b9650da28...9d2ab4f2 | |
| ZIP, pbip-zip zip (three made-up entries) | 97329 | d38b248badeb...7139f992 | |
(The full hashes are pinned in the test.)

## Numbers (filled as measured)

## Decisions I made

## For the owner
none

## Risky changes
none yet

## Seen, not in scope

## Lessons for the reviewer
