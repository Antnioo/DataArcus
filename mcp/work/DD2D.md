## Summary
- **Approval:** the brief "DD2D (0.3.2)" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-18
  (keep building it), D-1104-15 (families he did not decide: the reviewer's call, as in CONTRACTS.md), D-1016-01.
- **Base:** `feat/0.3.2-dd2d` from `origin/integration/0.3.2` at 59877ed. Push only this branch; never merge, no PR.
- **Scope:** two equal-copy families in one place, NO answer changes: `decode` (a Power BI file's bytes to text) and
  `limits` (the model file sizes). One pure dual module `assets/js/model-file.js` (`decodeText`, frozen `LIMITS`;
  CommonJS, `window.DAModelFile`, `self.DAModelFile`). Not in this job: the ZIP reader, inflate, the model's parse;
  canon, contrast, xml, html, tmdl-name.
- **Callers:** model-health-worker.js (importScripts, first in its list), model-import-browser.js (requires it in Node;
  theme-generator.js loads model-file.min.js before it), mcp/lib/model.mjs (createRequire; `decode` an adapter,
  `PBIT_LIMITS` the SAME object).
- **Before -> after:** decoders 3 -> 1; limit objects 3 -> 1. Every answer as before (the import's LIMITS gains
  `entries`, which it never reads).
- **Test:** mcp/test-0.3.2-dd2d.mjs (suite dd2d, area model): the probe's 10 byte strings + 3 more (a UTF-16BE BOM,
  Arabic UTF-16LE with BOM, half a UTF-8 BOM) and the 8 limit kinds, each answer pinned; then every caller (the worker
  run in a vm, the import, model.mjs) gives the pinned answer. Red proof: a copy reading a UTF-16BE BOM as LE fails.
- **Expected checks:** dd2d passes (about 75 checks); sp9 16, sp14 20, sp15 19, sp27 25, sp30 21, sp42 22, dd1g 35
  as on the base; contracts check and probe: decode and limits one answer per input; check-modules --strict green
  (one row more); literal requires green; lint 0; mutation 76/76; every other suite as on the base.
- **State:** plan pushed; the work follows, one commit a step (5 steps).
- **Resume:** the next step not committed below; then the CI line.

## Plan (one commit each, every suite green between them)
1. model-file.js + .min.js (`npm run build:min`) + test dd2d (unit: pinned answers) in tests.json.
2. model.mjs reads it (createRequire); its own decode body and limits object go.
3. The worker (importScripts first) and model-import-browser.js (require / DAModelFile; theme-generator.js loads it
   first) read it; `npm run build:min` writes every stamp; `node scripts/sitemap-lastmod.mjs --write` if a page moved.
4. dd2d parity: every caller and the module, one answer per input; the red proof in this note.
5. CONTRACTS.md (decode, limits: "One place"), the probe's places, MODULES.md's row; the note; WORK.md's line.

## Answers pinned (made-up bytes; the base's model.mjs decode and PBIT_LIMITS)
| input | text |
|---|---|
| UTF-8, UTF-8 + BOM, UTF-16LE + BOM, UTF-16LE (`{"a":1}`) | `{"a":1}` |
| Arabic UTF-8 / Arabic UTF-16LE + BOM | مبيعات |
| empty; the BOM FF FE alone | (empty) |
| `a`; `a` then 00 | a |
| FF alone; EF BB (half a BOM) | U+FFFD |
| UTF-16BE BOM + `{"a":1}` | read as UTF-8: two U+FFFD, then the text with zero bytes |

Limits: model 64 MB, entry 32 MB, total 128 MB, file 300 MB, entries 20000; pbix, '' and MODEL none.
