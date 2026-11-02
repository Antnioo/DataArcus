# Twin fuzz cases (evidence branch, never merged)

Made-up PBIR shapes only (no model, no data values). From the Codex twin-fuzz lab (2 Nov 2026), seed 20261102, run on
integration a7d04ad5: 2,000 generated reports + 57 real shapes. Replayed by the reviewer on 0f47f4cb (each case's
`replay-0f47f4cb.json`): V1-1 (heatmap names without $schema) is fixed by MX4; still failing: B1-1 (a chart pushed to
x=-59 when a button borrows width, mcp/lib/twin-pages.mjs ~79), B1-3 (a bar over a table keeps an offset past the page
edge, ~379), M1-1 (a neighbour moved without the plan saying so, ~103/122). B2-1 (an overlap the twin removes on purpose)
and B3-1 (a visual already under 60 px in English) are the lab's own strict properties, not product bugs.
Replay: `node fuzz.mjs /path/to/DataArcus --replay cases/<case>/spec.json --out <absolute path inside this folder>/replay/<case>`.
METHOD.md defines every property; SUITE-PROPOSAL.md is Codex's proposal for a per-PR suite.
