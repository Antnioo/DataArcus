# FX6 (0.3.1): Codex's delta review (D01, D04, D05, D06) and FX4's Seen 1

## Summary
- **Approval:** the reviewer's brief "Go on FX6" (28 Oct). Binding: D-1028-02 (Codex's findings fixed in 0.3.1),
  D-1027-13 (0.3.1 backed by every means), D-1027-12 (the twin identical), nothing written that the person did not approve.
- **Source:** Codex's delta review 75652532..5690ea89 (dataarcus-exchange results/2026-10-28-delta-review-031), as
  quoted in the brief: D01 (high), D04 (medium), D05 (low), D06 (low); FX4's Seen 1 (suggest_fields' word list).
- **Base:** `fix/0.3.1-fx6` from `origin/integration/0.3.1` at 1356a16 (Merge FX4). Push only this branch.
- **Scope:** `assets/js/report-mirror.js` (phoneCard, labelMobile, mirrorVisual's shadow; + .min.js),
  `assets/js/pbip-bind.js` (NOT_CAT_OLD; + .min.js), `mcp/lib/tool-answer.mjs` (capText), `scripts/microsoft-watch.mjs`
  (the comment pages), `mcp/CHANGELOG.md` (lines at the end of [Unreleased]). Tests: `test-0.3.1-tw1.mjs` (P4-P6),
  `test-0.3.1-cx2.mjs` (S7-S10), `scripts/test-microsoft-watch.mjs` (W13), new `test-0.3.1-fx6.mjs` (C, N).
  Not twin-pages.mjs at all if the fix fits in report-mirror.js (FX3's file); not FX3's or FX5's files.
- **Expected checks (before the work):** tw1 18 -> 21 (P4-P6, red on 1356a16 first: P4, P5; P6 a guard);
  cx2 16 -> 20 (S7-S9 red first; S10 a guard: no theme preset, nothing written); microsoft-watch 65 -> 67
  (W13 page 101 read, no duplicate, red first; W13b the cap refuses without posting, red first); new `fx6` about 6
  checks (C1-C3 the cut never splits an escape, red first; N1 "Notes" with a capital is no category, red first; N2 a
  guard). Every other suite the same count; golden picks may move only where a column named Notes/Description/Comments
  (capitalised) was a category: each said here. Suites: base + 1 (fx6).
- **Resume:** the plan below.

## Plan
1. **D01** (report-mirror.js phoneCard): the text fitted is the phone card's FINAL title: the phone layout's own title
   text when it has one (as approved, `phone:title:` label, else as it was), else the desktop's full name. Skipped only
   when that final text is the original phone layout's (so a phone-only change is fitted too). The wrap writes the final
   text, never the desktop's over an approved phone title.
2. **D04** (report-mirror.js mirrorVisual): a visual with no local shadow preset whose theme gives one (visualStyles
   `<type>` then `*`, `*` state, dropShadow preset) of a side gets a local, mirrored preset on the Arabic visual.
   The theme comes in opts (the twin's opts already carry it in `opts.waterfall.theme`; `opts.theme` read first).
3. **D05** (tool-answer.mjs capText): the cut backs up over an escape token (`\u` + 4-5 hex digits, model.mjs visible())
   it would split, then over a high surrogate.
4. **D06** (microsoft-watch.mjs): pages read to the end (a cap of 1,000 pages, 100,000 comments); at the cap the run
   posts nothing and says the history could not be read whole (action `incomplete`, exit code not 0).
5. **FX4 Seen 1** (pbip-bind.js): NOT_CAT_OLD's words without regard to case; the camel-case ends (OrderID, ...Key) stay
   case-sensitive ("Paid", "Turkey" are words).
