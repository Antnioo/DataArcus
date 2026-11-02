# Proposal only: a written-twin regression suite

Keep the existing approval, boundary, pinned-input and no-data-value tests unchanged. Add tests around their real plan/approve/write flow; do not turn off a gate for test convenience. The lab uses the same in-process `Plans.approve(id, 'user-in-browser')` pattern as `mcp/test-0.3.1-twin-artifact.mjs:44`.

1. On every change to the twin writer, run the reduced V1/V2 heatmap fixture through an approved write. Check every resulting visual.json for `$schema`, including files absent from the input. Run the pinned Microsoft validator on both input and written output and reject new error codes. The missing schema originates in `assets/js/report-mirror.js:577`; added visuals reach disk at `mcp/lib/twin-write.mjs:50`. Keep the source-validity baseline visible, and also compare per-file diagnostic counts as an additional stronger property.
2. On every change to text fitting, run the smallest B1 and M1 fixtures: a button borrowing slicer width, and a button shifting its neighbor. Check all absolute boxes against their page and group, then require every neighbor move to be named. The width redistribution is at `mcp/lib/twin-pages.mjs:79`; the fitting answer records the button and a count at :103 and :122. Checking only the button misses the shifted neighbor.
3. For 25 fixed seeds, check bounds, the requested shrink threshold, original preservation, artifact digest equality and untranslated visible text after the approved write. Include all three canvas sizes, a tooltip, a group, an overlap and a background-picture page. Keep unsupported pixel/rendering claims out of the verdict.
4. For 10 of those seeds, make a second independent plan and a page-ID permutation. Retain a raw-byte diagnostic, but treat the deliberate new logical ID separately: `mcp/lib/twin-plan.mjs:331` assigns it, and `mcp/lib/twin-write.mjs:60` writes it. Confirm that all other bytes agree. Add a large-text fixture that must paginate labels, with distinct source texts and different Arabic lengths, so page ordering cannot hide a missing label.
5. Run all 57 sanitized evidence-derived shapes nightly, together with 2,000 generated reports and automatic shrinking. Keep stable evidence SHA, input seed, sanitizer version and original error-code counts. A nightly failure should attach its minimal PBIR, metadata-only explanation and approved-write replay, never a model's rows.

## Interpret the strict properties explicitly

Do not silently relax B2. Report new overlaps separately from removed overlaps and from disclosed layout changes. `mcp/lib/twin-pages.mjs:390` deliberately removes a matrix-margin overlap; a raw failure here is not enough to call Desktop rendering broken. New overlaps involving unrelated visuals need a regression test and Desktop review.

Do not label D1's independent UUID difference an approval failure. The approval binding must still match every actual output byte, as enforced at `mcp/lib/twin-write.mjs:119`.

P1 has two obligations. The tool answer contains a digest and count at `mcp/tools/create_arabic_twin.mjs:94`; the approval window receives paths at :98 via `mcp/lib/twin-write.mjs:88`. If the product promises paths in the tool answer too, add a path list or a retrievable manifest with the same digest. Do not remove the existing approval-window list or weaken digest binding.

The absolute 60 px B3 floor should be discussed as a specification issue when the English source was already narrower and stays unchanged. The current guard applies its absolute floor to bar/column charts that were previously at least 60 px (`mcp/lib/twin-pages.mjs:471` and :474). Keep such raw lab failures visible while deciding the intended contract.

## Timing

Measured on Node 22.23.4 in this environment (`benchmark.json`): the six reduced fixtures V1-1, M1-1, B1-1, B1-3, B2-1 and B3-1 averaged 1.44 seconds per six-case set over five repetitions (30 full replays, 7.19 seconds total). Each replay included fresh process startup, the actual approval/write flow, Microsoft validation, repeat determinism and page-ID permutation. A separate set of 25 generated seeds took 10.24 seconds with all properties and no shrinking. These are measured local wall times, not a CI guarantee.

Proposed per-PR budget: six reduced regressions plus 25 fixed generated reports, about 12 seconds on this machine; allow 30 seconds in CI as an estimate, and retain failures for diagnosis. The nightly campaign measured 2,000 generated reports plus 57 shapes in 39.13 wall minutes and 77.92 CPU minutes, including 105,351 uncached shrink trials. It exceeded this job's approximate 60-minute CPU target. Keep all safety assertions; use smaller PR seed sets and separate nightly shrinking rather than relaxing checks.

Add B1-3 to the geometry regressions: the bar-over-table rule can preserve an offset beyond the page edge (mcp/lib/twin-pages.mjs:379). The reduced fixture reaches x=-57.
