# Method and replay

Run with Node 22 and the product's own installed packages:

```sh
node fuzz.mjs /path/to/DataArcus --seed 20261102 --cases 2000
```

Campaigns over 250 reports use two script processes in batches of 250, with fresh upstream plan registries. The master merges counts and content-addressed fixtures in seed order; CPU time is summed across workers. This is process isolation, not a change to the product gate. The default evidence commit is pinned in the script. Fetch `evidence/0.3.1-shapes` before running. The script reads its 57 `en.json` objects with `git show`; it never checks that branch out into the product or stores raw evidence. `--evidence-ref SHA` selects a different evidence commit explicitly. `--out` must be an absolute path inside this lab folder. Existing output folders should not be reused for a different campaign because case numbering starts again.

Replay one reduced fixture:

```sh
node fuzz.mjs /path/to/DataArcus --replay cases/V1-1/spec.json --out /absolute/path/to/this/lab/replay
```

`spec.json` is the generator's minimal metadata representation. `pbir/` is the corresponding full project, including an empty synthetic model. `seed.txt` is the first originating seed. `stats.json` maps every failing input and invariant to its independently reduced fixture; equivalent final fixtures share a folder. Evidence inputs have stable indices resolved by `evidenceManifest` in the statistics. Replaying a fixture checks all properties, so it may reproduce additional failures beyond its folder's invariant.

## Generation

Mulberry32 takes the reported unsigned seed; generated report i uses seed+i. Reports have 1 to 3 pages, each with 1 to 25 visuals. Canvas sizes are 1280x720, 1280x800 and 1920x1080. Coordinates include edges, overlapping boxes and group-relative children. Every seventh seed also places a heading with an icon. Visual kinds include card, textbox, tableEx, flat and grouped pivotTable, weekday/hour heatmap, time-axis column/line/area chart, bar, donut with legend, slicer, button, shape, image and group. Text labels vary in length and each planned text receives Arabic. The public text pagination API is followed before approval.

The 57 evidence shapes are rebuilt individually on a 1920x1080 page (expanded if necessary), preserving geometry, roles and formatting structure. Table, field, measure, display and selector names are replaced. Weekday, hour and date semantics are retained through synthetic field names. Filter/data expressions are discarded; unknown formatting literals become synthetic labels. No data rows are generated, read from a model or retained. Measures use BLANK(). This is shape-derived coverage, not an unchanged replay of the owner's reports. Source validator errors are counted and retained by code, not silently dismissed.

Pictures use a synthetic text SVG. This covers the background-picture keep-left-to-right branch and ordinary image geometry. It does not cover PNG decoding, pixel flipping or rendering.

## Oracles

- V1 calls the pinned Microsoft CLI's `runReportValidation` with a shared metadata provider, `skipSchema: true`, reportDir, defDir and pbipPath, matching `mcp/lib/artifact.mjs:55`. It compares error-code sets, exactly as requested, without suppressing known gaps. A new instance of an existing error code is outside this property. `skipSchema` is the upstream offline mode, not full remote JSON Schema validation.
- V2 independently scans every written visual.json for a nonempty `$schema`.
- D1 writes two independently approved copies and one with reversed page-ID ordering. The raw byte comparison is retained. Two additional comparisons normalize only `.platform.config.logicalId`, and normalize renamed page IDs in paths and JSON strings. They do not normalize geometry, formatting or text.
- M1 computes the second horizontal reflection algebraically, with parent group width and 0.5 px tolerance. It checks size and vertical position too. Exceptions must be disclosed in the answer's page, fitting, kept, moved or heatmap lists; visual IDs have token boundaries.
- B1 computes absolute boxes, following parent groups, for all written visuals including added ones. B2 compares positive intersection of the original visual pairs before/after; an intersection needs more than 0.5 px in both axes. It retains both new and lost overlaps, including intentional decoration. B3 applies the requested 75 percent / 60 px rule with the plan's disclosed exceptions. An unchanged original already under 60 px is reported as an invariant mistake, not quietly excluded.
- P1 compares actual new files and bytes against the artifact digest, file count, plan digest and write-answer digest. Separately it applies the literal requirement that paths of changed visual files and `.platform` appear in the tool answer. The digest and an approval-window path list are not treated as an explicit path list in that answer.
- T1 reads page names and the shared engine's visible text enumeration from written visuals, then checks remaining Latin letters against notTranslated. Sharing the extractor limits independence: an unrecognized text-bearing property can escape both the plan and this oracle. It does not inspect model rows or DAX results.
- S1 reuses the twin tests' before/after hashes, missing-approval rejection, changed-label rejection and original-preservation assertions. A synchronous filesystem observer also records attempted writes outside DATAARCUS_ROOT. Read-only numeric open flags are distinguished by access/create/truncate bits. Answer payload keys are checked; the fixtures contain no rows. The unchanged upstream approval-disclosure and hardening suites add the original synthetic-sentinel, boundary and safety checks. This is not an operating-system syscall sandbox or a proof for every possible asynchronous I/O path.

## Shrinking

Each failing input/property pair gets its own delta-debugging pass: page deletion (at least one page), visual deletion, optional-property deletion, and safe ID normalization. Canonical geometry is tried for V1, V2, D1 and P1 to improve cache reuse. Every accepted reduction is checked through the actual plan, approval and write flow. Targeted shrink trials omit unrelated negative-approval probes and the third renamed copy when reducing the raw D1 UUID difference; the complete per-input property run retains those checks. A content-addressed cache reuses exact previously evaluated candidates; no result is inferred from a similar seed. Each final fixture is executed again before retention. Review found 11 reductions with shared references to a deleted group; these were regenerated from their original seeds and reduced again with a valid-parent constraint. `reduction-review.json` records these supplemental checks, outside the campaign timing. The final reducer rejects dangling parent references.

The reducer preserves the named invariant, not every simultaneously violating pair or diagnostic instance. To replay an original generated report without retaining its files, add `--regenerate-seed N` to a replay command; the seed replaces the supplied spec and the resulting JSON retains failure metadata only.

Minimality is relative to this deletion grammar: required PBIR identity and geometry keys stay, and numbers/strings are not exhaustively searched. Global mathematical minimality is not claimed. No upstream safety assertion was changed to make a failure pass. Early pilot runs and interrupted performance trials do not count toward final statistics.

## Source map at the reported product SHA

| Property | Decision point |
| --- | --- |
| V1 | mcp/lib/artifact.mjs:55, offline validator invocation |
| V2 | assets/js/report-mirror.js:577, added names table construction; mcp/lib/twin-write.mjs:50, added visual serialization |
| D1 | mcp/lib/twin-plan.mjs:331, per-plan random logical ID; mcp/lib/twin-write.mjs:60, platform output |
| M1 | assets/js/report-mirror.js:703, mirroring and group width; mcp/lib/twin-pages.mjs:60, neighboring visuals shifted during button fitting |
| B1/B2 | mcp/lib/twin-pages.mjs:582, fitting; assets/js/report-mirror.js:715, badges moved with hosts |
| B3 | mcp/lib/twin-pages.mjs:468, size guard constants; :474, threshold and chart-only absolute floor |
| P1 | mcp/tools/create_arabic_twin.mjs:94, answer digest/count; :98, approval-window output list; mcp/lib/twin-write.mjs:119, digest enforcement |
| T1 | assets/js/report-mirror.js:745, visible texts; mcp/lib/twin-texts.mjs:355, untranslated list |
| S1 | mcp/tools/create_arabic_twin.mjs:63, approval gate; mcp/lib/twin-write.mjs:111, pinned rebuild; :125, writeTree |
