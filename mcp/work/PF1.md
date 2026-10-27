# PF1 (0.3.1): the glass pictures fast again (decode once, node:zlib, no closure per byte, the flip cached)

## Summary
- **Approval:** the reviewer's brief "Go on PF1" (27 Oct); the owner, D-1027-21 "yes start PF1 and if it works that
  needs yo go live asap so don't change anything midrun but halt anything new till pf1 is fone"; D-1027-05 (glass the
  default, everywhere); D-1027-12 (the twin identical: the Arabic picture the English one mirrored, kept exactly).
- **Scope:** `mcp/lib/glass-picture.mjs` only (the caching inside glassPixels, glassPreviewUrl and flipGlassPng, no
  caller changes); the new suite `mcp/test-0.3.1-glass-speed.mjs` and its line in `mcp/tests.json`; this note.
  Not design-engine.js (TS1), not plan-lint.mjs / twin-plan.mjs / twin-preview.mjs (TW1, as is).
- **Base:** `fix/0.3.1-glass-speed` from `origin/integration/0.3.1` (a69fffc5). Push only this branch.
- **Expected checks:** (written before the work) the new suite `glass-speed` about 10 checks, red first on a69fffc5 (24
  previews of one picture decode it 24 times, not once; 3 flips of one picture decode 3 times; the engine's JavaScript
  deflate, not node:zlib); `glass-twin` 28 = 28, `twin-preview` 23 = 23, `glass-default`, `glass`, `look-options`
  equal (no check changed: glass-twin already compares the flipped picture's pixels, not its bytes); `twin` and
  `report` areas equal + 1 suite; full run: the base's suites + 1 (glass-speed).
- **Got:** glass-speed 23 (4 of 21 red on a69fffc5 first: 48 decodes for 24 figures, 3 for 3 flips, no node:zlib;
  P6-P7 added after, they pass on the old code too: pixel checks) -> 23 PASS; twin area 10 suites (9 = 9 + glass-speed),
  glass-twin 28 = 28, twin-preview 23 = 23; no other test changed. twin-preview 39.3 s -> 11.3 s plain, 347 s (RED,
  timed out) -> 21.5 s under NODE_V8_COVERAGE. Full run 108 -> 109 suites (+ glass-speed).
- Full run on d42befe: "run-tests: 109 suites passed"
- **Resume:** done; CI started on the branch (run 40592747988); waits for the reviewer, then the laptop.

## The plan
1. **Decode once.** glassPixels keeps the last few decoded pictures (an LRU of 4, keyed by the bytes' SHA-1 and
   length: a 1920 x 1080 picture is 6.2 MB decoded); each call gets its own copy of the pixels, so no caller can change
   a cached picture. glassPreviewUrl keeps its result (a string, immutable) the same way (16), flipGlassPng too (8,
   each call a copy of the bytes). The internal reads use the cached pixels without copying.
2. **node:zlib.** The pictures written here (the flip, the preview) are encoded in this file: the same marked layout
   as the engine's encodePng (signature, IHDR RGB 8 bits, the tEXt "Comment\0DataArcus glass look" chunk right after
   the header, so isGlassPng reads it, IDAT from zlib.deflateSync, IEND), CRC-32 by a table (zlib.crc32 is not in
   every Node the package allows, ">=20.10"). (After a first measure: every row filtered Up, see Decisions.)
   The bytes differ from the engine's (another deflate): the pixels are identical (checked in the new suite, pixel by
   pixel against the old encoder's output); glass-twin already compares pixels.
3. **The filter loops:** no function per byte; the Paeth predictor inlined.
4. **The flip cached** by the source bytes (the twin, the EN-AR copy and the bilingual report flip the same picture).

## Expected numbers (this machine; measured before the work, on a69fffc5)
- One 1920 x 1080 picture (scratchpad bench: engine glassPng, then glassPixels, glassPreviewUrl, flipGlassPng):
  make 957 / decode 299 / preview 341 / flip 913 ms; under NODE_V8_COVERAGE 8454 / 2149 / 2558 / 10921 ms.
  Expected after: decode about the same the first time (the inflate is zlib's already), then 0 for the same bytes;
  preview and flip a few tens of ms (zlib, no closure); make unchanged (the engine's, not this job's).
- test-0.3.1-twin-preview: plain 39.3 s (23 PASS); under NODE_V8_COVERAGE 347 s and RED here (V1-8 "Request timed
  out"). Expected after: plain under 15 s, coverage green and well under 100 s.
- The full run's wall time: measured on the base below, then after.

## Before -> after (this machine, Linux, Node 22.22; the scratchpad bench and `node test-0.3.1-twin-preview.mjs`)
| | before (a69fffc5) | after (d42befe) |
|---|---|---|
| one 1920 x 1080 picture: make / decode / preview / flip | 957 / 299 / 341 / 913 ms | 583-693 / 73-82 / 26-30 / 132 ms |
| the same under NODE_V8_COVERAGE | 8454 / 2149 / 2558 / 10921 ms | 8528 / 502 / 34 / 352 ms |
| twin-preview, plain | 39.3 s (23 PASS) | 11.3 s (23 PASS) |
| twin-preview, NODE_V8_COVERAGE | 347 s, RED (V1-8 timed out) | 21.5 s (23 PASS) |
| the full run (`npm test -- --keep-going`) | 3130 s (52.2 min), 108 suites passed | 2405 s (40.1 min), 109 suites passed |

"make" is the engine's glassPng (design-engine.js, TS1's file, not changed here: its 8 s under coverage stays; it is
cached by the engine per colours and size). The bench calls decode, then preview and flip of the same bytes, so those
two read the cached pixels; a picture not seen before costs decode + preview or decode + flip (about 100 / 200 ms).

## CHANGELOG line
none: no behaviour a person sees changes (the same pictures, faster); `mcp/CHANGELOG.md` is not in this job's files.

## Decisions I made
- The encoder writes every row with the Up filter, not the engine's per-row search of five: the first version kept the
  search (flip 352 ms, 6 s under coverage); Up alone is one pass, the file is 172 KB against the engine's 187 KB, and
  the pixels are identical (P2-P4, P7). The decoder still reads all five filters (P6, a picture using each).
- The cache keys are SHA-1 of the bytes plus their length (a speed cache, not a security boundary: a collision would need
  a crafted picture that is also a valid marked glass PNG). LRU sizes: 4 decoded pictures (6.2 MB each at 1920 x 1080),
  16 previews (strings), 8 flips (about 170 KB each).
- glassPixels returns a copy of the pixels (a typed array can not be frozen); flipGlassPng a copy of the bytes; the
  preview is a string.
- The decode counted by wrapping node:zlib's own inflateSync in the test (glass-picture.mjs calls it on that object), so
  the guard needs no hook in the code and was red on the old code.
- Not a CRC from zlib.crc32 (Node 20.15 / 22.2 on; the package says ">=20.10"): a table in the file.

## For the owner
none

## Risky changes
none: no security policy, approval step, file writing path, answer, network or process changed; the bytes of the
flipped picture the twin writes differ from before (node:zlib, the Up filter), its pixels are identical (checked).

## For the laptop
- One glass report's Arabic twin opened in Desktop: the Arabic pages' picture shows as the English one mirrored, as
  after GD2 (the file is now written by node:zlib; Desktop reads any valid PNG). Record: the picture shows, yes / no.

## Seen, not in scope
- The engine's glassPng (make: 0.6 s plain, 8.5 s under coverage per new colours and size) and its JavaScript deflate
  are now the slowest part; a node:zlib path there is design-engine.js (TS1's file).
- page-preview.js fromFiles asks for a page's picture twice per page (48 calls for 24 pages); harmless now (cached).

## Lessons for the reviewer
- The session's foreground command is capped at 10 minutes here: a 30-40 minute full run can not run in the
  foreground; it ran in the background with a Monitor waiting on its last line (the session never idle).
- twin-preview under coverage was red on the base on this machine (a request timed out at 347 s), not only slow.
