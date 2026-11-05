## Summary
- **Approval:** the brief "DD2X (0.3.2): one XML escape" (5 Nov); owner D-1104-12 (one library, fix at the source),
  D-1104-15 (Phase 2 equal copies: one copy, no answer changes).
- **Base:** `feat/0.3.2-dd2x` from `origin/integration/0.3.2` at 3d9811a9. Push only this branch; never merge, no PR.
- **Scope:** CONTRACTS.md family xml. `assets/js/svg-escape.js` `xmlEsc` becomes the one place; `mcp/lib/flip-cards.mjs`
  reads it (createRequire, as twin-geometry.mjs requires mirror-policy.js) and keeps `const xml = SvgEscape.xmlEsc`
  as a one-line alias so the ledger and the probe still find the place. Not in this job: family html, any other file.
- **Copies before -> after:** 2 (svg-escape.js `xmlEsc`, flip-cards.mjs `xml`) -> 1.
- **Answers:** the probe's 10 texts give the same answer before and after (both copies are the same line today).
- **Expected checks:** new `mcp/test-0.3.2-dd2x.mjs` passes (in tests.json beside the dd tests); every other suite's
  number unchanged; lint 0; mutation 76/76; check-contracts, check-modules --strict, check-agent-memory,
  check-result-lines green. Same-shape groups go down.
- **Red proof (not committed):** take the `.replace(/'/g, '&apos;')` step out of svg-escape.js; the new test fails on
  the texts holding an apostrophe, for both names.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/41966444527 on 4d4194cd954267982c76cabe1b6e2054856a6718
- **State:** DONE.
- **Resume:** the reviewer reads and merges.

## Plan (one commit each)
1. This note.
2. flip-cards.mjs reads svg-escape.js; its copy goes. The test dd2x: the probe's 10 texts through both names, one
   answer each, `xml === xmlEsc`; a source check that flip-cards.mjs holds no escape chain of its own.
3. CONTRACTS.md (xml "One place" line), MODULES.md (svg-escape.js "used by" names flip-cards.mjs).

## Copies before -> after
- `assets/js/svg-escape.js` `xmlEsc`: the one place (unchanged). `mcp/lib/flip-cards.mjs` `xml`: its own chain -> the
  alias `const xml = SvgEscape.xmlEsc;`. 2 copies -> 1. The probe finds both places (they agree on all 10 texts).

## Answers before and after
The probe's 10 texts, the same before and after: '' -> ''; `a & b` -> `a &amp; b`; `<b>` -> `&lt;b&gt;`; `"q"` ->
`&quot;q&quot;`; `it's` -> `it&apos;s`; `&amp;` -> `&amp;amp;`; Arabic unchanged; null -> `null`; undefined ->
`undefined`; 12 -> `12`. Pinned in `mcp/test-0.3.2-dd2x.mjs` (14 checks: X1-X10, F1, S1-S2, S0).

## Checks
Four shards side by side (`DA_SHARD=k/4`, k = 0..3): 43, 41, 41, 42 suites passed, mutation 76/76; lint exit 0;
check-contracts, check-modules --strict, check-agent-memory, check-result-lines green; `npm run build:min` changed
nothing. Integration had not moved (merge not needed). Red proof (not committed): take the `.replace(/'/g, '&apos;')`
step out of svg-escape.js and dd2x fails on X5 (`it's`), for both names; restored after.

## Decisions I made
- The test reads the alias line from flip-cards.mjs source and runs it, so flip-cards.mjs exports nothing new.
- The alias line has a one-line comment above it naming the home; no other change to flip-cards.mjs.
- No WORK.md line (it is at 2,852 of 3,200 characters) and no CHANGELOG line (nothing a person sees changes).

## For the owner
none

## Risky changes
none

## Seen, not in scope
- Family html (its own brief): the probe says six copies disagree on null and undefined.

## Lessons for the reviewer
- A fresh checkout needs `npm ci` in both the root and `mcp/` before the shards and lint run.
