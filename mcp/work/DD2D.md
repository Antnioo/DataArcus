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
- **Expected checks:** dd2d passes (48 checks: planned about 75; parity is one check an input, not a place); sp9 16,
  sp14 20, sp15 19, sp27 25, sp30 21, sp42 22, dd1g 35 as on the base; contracts check and probe: decode and limits one answer per input; check-modules --strict green
  (one row more); literal requires green; lint 0; mutation 76/76; every other suite as on the base.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/41929485457 on 4f526309eeef51531ed579f378dc6fcd2a4db168
- **State:** DONE. integration/0.3.2 merged in once (DD1H, d667a6c5); local gate 196 suites, mutation 76/76.
- **Resume:** none; the reviewer reads and merges.

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

## Copies before -> after (each place)
| place | before | after |
|---|---|---|
| model-health-worker.js | `decodeText` and `LIMITS` its own | `self.DAModelFile` (importScripts `model-file.min.js` first) |
| model-import-browser.js | `decodeText` and `LIMITS` its own (no `entries`) | `require('./model-file.js')` / `root.DAModelFile` |
| mcp/lib/model.mjs | `decode` and `PBIT_LIMITS` its own | `decode` an adapter (`new Uint8Array(buf)` as before), `PBIT_LIMITS` the same object |
| theme-generator.js (loader) | | loads `model-file.min.js` once, before `model-import-browser.min.js` |

Decoders 3 -> 1; limit objects 3 -> 1. Answers before and after: the table above, on every place (dd2d P1-P13,
Q1-Q8); the probe: decode 4 places 0 of 10, limits 4 places 0 of 8 (before: 1 of 8, the import's missing
`entries`, a key it never read).

## Red proof (not committed)
In mcp/lib/model.mjs, `decode` given a copy back that reads a UTF-16BE mark (FE FF) as UTF-16LE:
`export const decode = (buf) => { const u8 = new Uint8Array(buf); if (u8[0] === 0xfe && u8[1] === 0xff) return new
TextDecoder('utf-16le').decode(u8.subarray(2)); return ModelFile.decodeText(u8); };` -> `FAIL  dd2d  46 of 48
checks`: P11 (model.mjs decode gave CJK text, the base two U+FFFD then the bytes) and S1 (a decoder in a caller).
Restored with `git checkout mcp/lib/model.mjs`: `PASS  dd2d  48 checks`.

## Decisions I made
- model.mjs `decode` stays exported as a one-line adapter (read-report.mjs and the probe import it); it keeps
  `new Uint8Array(buf)` so a Buffer or an ArrayBuffer reads as before.
- The callers bind local names (`const decodeText = ...DAModelFile.decodeText`), so the ledger's places stay their
  file and name and check-contracts still finds them; the probe gives the worker's `self` its DAModelFile.
- The probe gets model-file.js as a fourth place in both families (as model-nearest.js in 1g).
- The MODULES.md row was added in step 1 (check-modules --strict fails on a module without a row); its "used by"
  grew with each step as the facts did.
- dd2d's parity runs the worker and the import as shipped (.min.js in a vm) besides the sources, with no copy of
  the old code: the old answers are pinned (recorded from the base's model.mjs `decode`, equal to the other two by
  the probe); the base's source is not read (CI's checkout is shallow).
- samejob.py is not in the repo (as DD1C found): not run.

## For the owner
none

## Risky changes
- mcp/test.mjs part pbit-limits read the four numbers in the worker's source; it now reads them in model-file.js and
  requires the worker's `const LIMITS = self.DAModelFile.LIMITS;` (same check, same count: 1594).
- LIMITS is frozen now and PBIT_LIMITS is that object: a test that wrote into PBIT_LIMITS would throw (none does;
  tests pass their own smaller limits as an argument).
- The import's LIMITS gains `entries` (20000), never read there.

## Seen, not in scope
- The worker's `parseJson` strips a leading U+FEFF after decoding; model.mjs `json` does not (a BOM is already dropped
  by decodeText, so only a doubled mark differs). Not a family in the ledger.
- sitemap-lastmod.mjs needs the full history (`git fetch --unshallow`); the cloud clone is shallow.

## Lessons for the reviewer
- A module with no row fails check-modules --strict, so the row goes in the step that adds the file, not the docs
  step.
- terser keeps the worker's top-level names (no toplevel mangle), so a vm can read the shipped worker's bindings.
