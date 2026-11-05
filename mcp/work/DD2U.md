## Summary
- **Approval:** the brief "DD2U (0.3.2)" (5 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-18 (keep
  building it). Leftovers DD2P's builder found (B-344): one copy, no answer changes.
- **Base:** `feat/0.3.2-dd2u` from `origin/integration/0.3.2` at a02f6f00. Push only this branch; never merge, no PR.
- **Scope:** (1) design-metrics.js `imageSize` has its own `u` (the big-endian 4-byte read); png-bytes.js `u32` holds it.
  design-metrics.js reads `u32` from png-bytes.js (`require('./png-bytes.js')` in Node, `root.DAPngBytes` in the browser).
  (2) mcp/tests.json `affected.base` is `origin/integration/0.3.1` (gone), so `npm test -- --affected` exits 2: point it at
  `origin/integration/0.3.2`. (3) CONTRACTS.md u32 place list names design-metrics.js. Not in this job: any other file.
- **Copies before -> after:** the 4-byte big-endian read: png-bytes.js `u32` + design-metrics.js `u` (2) -> 1.
- **Pages:** the three theme generator pages (tools/, tools/-lab, ar/tools/) already load png-bytes.min.js before
  design-metrics.min.js (checked); no other page or loader loads design-metrics.
- **Proof:** new suite `dd2u` (mcp/test-0.3.2-dd2u.mjs): imageSize on a made-up PNG header (w, h pinned), a zero size,
  a short buffer and a made-up JPG as today; design-metrics.js has no 4-byte read of its own and requires png-bytes.js.
  sp29's purity check allows the one pure file (DAPngBytes); no number moves.
- **Expected checks:** dd2u passes (new); every other suite's number as on the base; mutation 76/76; lint 0; check-min,
  stamps, check-contracts, check-modules --strict, check-agent-memory, check-result-lines green.
- **State:** plan written; work not started.
- **Resume:** step 2 of the brief.

## Plan (one commit each)
1. This note.
2. design-metrics.js reads png-bytes.js; dd2u suite; tests.json line; `npm run build:min`; sitemap dates if moved.
3. `affected.base` -> `origin/integration/0.3.2`; CONTRACTS.md u32 place list.
