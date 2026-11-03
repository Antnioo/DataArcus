# Twin fuzz second pass

Pinned integration head: `1a5f65847c837bae50608ef9dfed1f2b170f8e7c`, already containing MX8.
Completed 1,000 generated reports and all 57 sanitized evidence shapes, with zero execution errors.
Retained 329 reduced cases; every failing input/property/reason was shrunk and confirmed.
Campaign time: 48.46 wall minutes, 94.67 CPU minutes; the existing suite passed 185 checks.
All 329 reduced cases reproduce on both heads; MX8 fixes none of these remaining cases.

## Results

Each property screened 1,057 reports. Counts below are failed reports, not individual diagnostic instances. No sanitized evidence shape failed. P1 was skipped as requested; exact approval digest binding remained under S1 (`mcp/lib/twin-write.mjs:120`).

| Property | Failed reports | Reduced cases |
| --- | ---: | ---: |
| V1, V2, D1, B1, B3, T1, S1 | 0 each | 0 |
| M1 | 72 | 72 |
| B2 | 62 | 62 |
| A1 | 92 | 24 |
| F1 | 107 | 75 |
| N1 | 248 | 96 |

A1 checked 416 eligible matrix/chart pairs. F1 examined 565 added/resized tables or matrices: 446 height estimates, 119 unknown cardinalities, and 90 narrow-header checks. N1 observed 176 added names tables plus 72 collisions with original names. All 144 targeted heatmap combinations occurred three or four times across 500 targeted reports; the other 500 were mixed random reports.

## Findings

**A1: the added table can defeat chart alignment.** `cases/A1-1/spec.json`, seed 20261175, reduces to a matrix and a chart. The taller names table can become the obstacle in `landsOn`; the fallback returns before `keepInside`, leaving the chart's mirrored sort, axis side and padding (`mcp/lib/twin-pages.mjs:269`, `:316-318`). The table grows at `assets/js/report-mirror.js:694-696`. This is a disclosed collision fallback, but fails the requested strict offset/order property. Restore or explicitly resolve the chart's internal order even when movement is refused.

**F1: row padding is omitted from eligibility.** `cases/F1-1/spec.json`, seed 20261127. The seven-row eligibility estimate ignores explicit rowPadding (`assets/js/report-mirror.js:646-650`); the table expansion adds only one padded row (`:694-696`). The reduced case estimates 269px needed against a 190px matrix and a 222.88px added table. These are synthetic geometry estimates. An already overflowing English matrix is not a new rendering regression, but adding its names table despite that overflow violates fit eligibility. All F1 failures were height estimates; narrow-header checks found no failures.

**N1 and M1: name collision overwrites a twin visual.** `cases/N1-25/spec.json` and `cases/M1-1/spec.json`, seed 20261415. The generated name is the source name plus `Names` (`assets/js/report-mirror.js:594`). The writer inserts it into the same path-keyed Map as original visuals (`mcp/lib/twin-write.mjs:47-50`), replacing an existing synthetic `v0Names` shape in the twin. All 72 M1 reductions contain this collision; the source report stays unchanged. Separately, 176 reports fail explicit added-name disclosure: the returned plan lists the source heatmap identifier (`mcp/lib/twin-plan.mjs:202`), not the added identifier. `cases/N1-1/spec.json` is the smallest representative here.

**B2: 62 new overlaps remain.** See `cases/B2-*/spec.json`. Layout fitting still runs after alignment (`mcp/lib/twin-pages.mjs:695-703`); overlap disclosure is a separate plan field (`mcp/lib/twin-plan.mjs:378`). The strict property counts new original-visual overlaps even when disclosed. Removed overlaps are excluded. Full replay lists all failing pairs in 45 reductions. The other 17 are 12 naming-collision cases and five group-box pairs; the disclosure helper excludes groups (`mcp/lib/page-picture.mjs:337`). Group-box intersection is not proof of visible occlusion.

## MX8 comparison

Re-fetched `fix/0.3.1-mx8` at completion: `e5122932f78cfc5a757868a9b1ceb4aca949ff8a`. Its only repository difference from the pinned integration head is `mcp/WORK.md`. All 329 target failures and their complete failure details match on both heads, with zero replay errors. Replay wall times were 33.44s and 26.30s respectively.

## Decisions I made

- Used NEXT-JOB.md's explicit job path beneath its heading.
- Kept the cloned head pinned. Clone/dependency setup were the requested exceptions to results-only writes; product source was not edited.
- Used supported Node 24.19.0. B3 follows both product dimensions and the conditional chart floor (`mcp/lib/twin-pages.mjs:578-589`); D1 normalizes the deliberate logical ID (`mcp/lib/twin-plan.mjs:332`).
- Treated N1 listing literally: an added identifier or full path in the returned plan.
- Used empty models and synthetic domain/width profiles, never row values. Temporary projects are cleaned; only reduced failures are retained.
- Kept the measured generator unchanged after finding its unsupported categoryAxis.reverseOrder property. Three original-seed controls removing only that property reproduce the findings with no offline input validator errors. Use those controls for CI; details and replay commands are in METHOD.md and SUITE-ADD.md.

## COULD NOT CHECK

Desktop rendering, actual automatic row-header widths, or actual row cardinalities. F1 uses row height = `(15.1/8)*pt + 2 + 2*rowPadding`; need is seven rows plus header/optional total, optional 1.6-row title, and max(6px, vertical container padding). Header width uses the character-weighted `textWidth` plus 12px (`assets/js/text-measure.js:20-33`). These are estimates.

Validation uses offline skipSchema, matching `mcp/lib/artifact.mjs:55`; source diagnostic counts remain in stats. Reduced fixtures may omit optional query roles. The 57 shapes are sanitized, isolated reconstructions, not complete real-report or pixel replays.
