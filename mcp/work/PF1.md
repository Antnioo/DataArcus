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
- **Got:** (after the work, below)
- **Resume:** the plan below; then the full run, then CI on the branch.

## The plan
1. **Decode once.** glassPixels keeps the last few decoded pictures (an LRU of 4, keyed by the bytes' SHA-1 and
   length: a 1920 x 1080 picture is 6.2 MB decoded); each call gets its own copy of the pixels, so no caller can change
   a cached picture. glassPreviewUrl keeps its result (a string, immutable) the same way (16), flipGlassPng too (8,
   each call a copy of the bytes). The internal reads use the cached pixels without copying.
2. **node:zlib.** The pictures written here (the flip, the preview) are encoded in this file: the same marked layout
   as the engine's encodePng (signature, IHDR RGB 8 bits, the tEXt "Comment\0DataArcus glass look" chunk right after
   the header, so isGlassPng reads it, IDAT from zlib.deflateSync, IEND), CRC-32 by a table (zlib.crc32 is not in
   every Node the package allows, ">=20.10"). The filter per row chosen as the engine does (the smallest sum).
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
