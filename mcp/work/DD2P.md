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
- **State:** step 5 (the ledger and the map); then the merge check, the full run and CI (the line below).
- **Resume:** the CI line; then the reviewer reads and merges.

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

## Hashes (base deff19e; after: step 4, 8da3c9f5, the same 15)
| output | bytes | SHA-256 (base) | after |
|---|---|---|---|
| theme background, glassPng 1280x720 (DataArcus) | 96999 | 9648460bb936...61d1c684 || the same |
| theme background, glassPng 1920x1080 (Desert Gulf) | 151334 | 68dd99c823a4...4c327b37 || the same |
| encodePng 24x9, a comment, the browser deflate | 385 | 4ffb815ac861...1a6df21a || the same |
| encodePng 24x9, node:zlib | 171 | eaa48acd7e49...c7aa2153 || the same |
| the glass flipped (flipGlassPng) | 97278 | 1008ffb464bf...f097b06e || the same |
| the glass preview (glassPreviewUrl) | 30538 | daa679edb3a6...580016a8 || the same |
| page picture opaque (writePng 17x5) | 108 | e6153d7c3b33...35018b70 || the same |
| page picture with alpha (writePng 17x5) | 117 | 7bc52d7a198a...16c22e8f || the same |
| page picture palette (testPng) | 162 | 540223cb624a...23ddf691 || the same |
| page picture interlaced (testPng) | 411 | 8f2fe12287a1...f0ff9f09 || the same |
| page picture flipped (pagePicture, Normal) | 110 | 72311c431247...25423157 || the same |
| theme generator text chunks (textChunk x2) | 140 | b657f58e0bc1...b080c4d5 || the same |
| ZIP, pbip-export build (en, DataArcus) | 379608 | 522a03df9d59...36c84bd8 || the same |
| ZIP, pbip-export build (ar, Desert Gulf) | 390049 | a27b9650da28...9d2ab4f2 || the same |
| ZIP, pbip-zip zip (three made-up entries) | 97329 | d38b248badeb...7139f992 || the same |
(The full hashes are pinned in the test.)

## The parity test and its red proof (step 4)
dd2p: 112 checks (U 32, H 15, P 41, B 15, S 9). P runs every old place from `git show deff19e:<file>` (each definition
and the names it needs, the probe's way of reading a nested name) beside the one place; B writes the 15 outputs with
the base's own engines (every assets/js file and the two MCP picture files at deff19e in os.tmpdir(), in a child
process with the same clock and seed) and compares them with now, so a platform whose node:zlib writes other bytes
still proves "unchanged" (H then skips only its zlib pins, with a note).
Red proof (not committed): in png-bytes.js the table line's `t[n] = c >>> 0` made `t[n] = (n === 7 ? c ^ 1 : c) >>> 0`
(one entry changed): `FAIL  dd2p  91 of 112 checks` (U13, P13, P38, H1-H3, H5, H6, H10, H13-H15 and B the same ten);
the file restored, 112 of 112.

## Copies before -> after (each place)
| job | before (deff19e) | after |
|---|---|---|
| CRC-32 and its table | design-engine.js `crc32`, pbip-zip.js `crc32`, theme-download-ui.js `crc32`, glass-picture.mjs `crc32`, page-picture.mjs `crc32` (5 tables) | png-bytes.js `crc32` (1 table); pbip-zip.js exports it as the same function |
| PNG chunk writer | design-engine.js `chunk` (in pngOf), glass-picture.mjs `chunk` (in encode), page-picture.mjs `chunk`, theme-download-ui.js `textChunk` (DataView) | png-bytes.js `pngChunk` |
| big-endian write | design-engine.js `u32` (in pngOf), glass-picture.mjs `be`, page-picture.mjs `be` | png-bytes.js `be32` |
| big-endian read | glass-picture.mjs `u32`, page-picture.mjs `u32` | png-bytes.js `u32` |
| small cache | glass-picture.mjs `lru`, page-picture.mjs `lru` | small-cache.mjs `lru` |
Same-shape files (git grep in assets/js and mcp/lib, no .min.js): the CRC table 5 -> 1, the big-endian write 3 -> 1,
the read 3 -> 2 (the third is design-metrics.js imageSize, see Seen), the cache 2 -> 1, the DataView chunk 1 -> 0.
samejob.py is not in the repository: not run (as DD1C said); these greps stand in for it.

## Numbers (filled as measured)
| check | base deff19e | after |
|---|---|---|
| MCP suites (`npm test -- --keep-going`) | 194 suites; 193 passed, glass-tables failed only because this clone was shallow (cba24a5 missing); after `git fetch --unshallow`: glass-tables 113 checks | (the final run, below) |
| mutation | 198 checks (76 mutants, all killed) | (below) |
| website suites (`node scripts/tests/run-all.mjs`) | (base run) | 42 of 42 at step 3 |
| dd2p | (new) | 112 checks |
| contracts / probe | 808 checks, 27 families, 118 places | 771 checks, 27 families, 111 places (7 places gone: the copies); the four families one answer on every input |
| modules --strict | 1042 checks, 199 files | 1053 checks, 201 files (the two new rows) |
| lint, check-min, stamps, result-lines, agent-memory, site config | green | green |

## Decisions I made
- `be32` returns an Array of 4 numbers (as every old copy did), so `be32(w).concat(be32(h), ...)` stays as it was;
  `pngChunk` returns a Uint8Array; the MCP files hand it to Buffer.concat as it is (the bytes the same, B proves it).
- pbip-zip.js keeps `crc32` as `const crc32 = (...png-bytes).crc32` (a name for the same function, not a copy) so the
  ledger can name it and pbip-export.js changes nothing; P41 checks it is the same function.
- theme-download-ui.js reads `root.DAPngBytes` inside the page's mount (the pages load png-bytes.min.js before
  design-colours, so before every engine); theme-generator.js's BUILDER lists it before pbip-zip (the page already has
  it: `onPage` skips it). MODULES.md names the theme generator page as the user for that part (modules-facts reads
  require/import and page tags only).
- The ledger moved in steps 2 and 3 with the code (check-contracts names every place, so it had to); step 5 wrote the
  "One place" lines and the "Since DD2P" paragraphs. The probe's places are the module (and pbip-zip's export).
- The hashes are pinned (H) and also recomputed from the base's own engines (B): pinned node:zlib bytes may differ on
  another platform (the macOS runner where the reviewer merges); then H skips its zlib pins with a note and B decides.
- MODULES.md's rows went in at step 1 (check-modules --strict names a file without a row), "used by" grown per step.
- WORK.md was at 3,193 of 3,200 characters: to add DD2P I shortened SP43's parenthesis (its file list) to "the split
  is done, SP1-SP44"; nothing else changed there.
- No CHANGELOG line (nothing a person sees changes).

## For the owner
none

## Risky changes
- The theme generator pages now need png-bytes.min.js before design-engine.min.js: a page that loads the engine
  without it would fail at the background PNG (no such page today: the three theme generator pages are the only ones
  that load design-engine.min.js or theme-download-ui.min.js; the website suites, 42 of 42, run them in Chromium).

## Seen, not in scope
- A third big-endian read: design-metrics.js `imageSize` `u` (a logo's PNG size); not in the ledger's u32 family. The
  same answer by its text; a follow-up could read png-bytes.js `u32` (design-metrics is loaded before the engine).
- This clone was shallow: glass-tables (and any suite that reads an old commit) fails locally until
  `git fetch --unshallow`; CI fetches the whole history.
- `run-tests.mjs --affected` diffs against origin/integration/0.3.1, which no longer exists here: it exits 2.

## Lessons for the reviewer
- check-contracts names every place, so a brief that removes copies moves the ledger with each step, not only at the
  end; the brief's step 5 then only adds the "One place" lines.
- Pinning node:zlib output is platform-bound in principle; recomputing the base's bytes with the base's own engines
  in a child process (fresh seed and clock) proves "byte-identical" on any runner.
