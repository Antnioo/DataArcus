# BD1 (0.3.1, 26 Oct): Arabic text with Latin runs, as Desktop drew it; the bidi lab; L6's words made true

## Summary
- **Approval:** the reviewer's brief "Go on BD1" (approved, 26 Oct), on the owner's laptop run of 26 Oct (Power BI Desktop
  2.159.883.0, on 0f7f6e83): a visual title «U+200F U+2068 Total Sales U+2069: التفاصيل» reads in order; L6's Arabic
  DA.StoryTitle (no RLM, starts with an FSI) reads out of order; L1's text box «عدد الأوامر حسب Department في كل شهر» (no
  marks) draws its two Arabic phrases swapped. Not measured: a text box with DataArcus's marks; an RLI...PDI or RLE...PDF wrap.
- **Scope:** `mcp/lib/dax-functions.mjs` (DA.StoryTitle's Arabic, L6's wording, the prompt at Preview and Apply),
  `mcp/lib/arabic-lens.mjs` (TEXT_MIXED's words only), `mcp/lib/check-report.mjs` (DAX_MEASURE_PENDING's words only),
  `mcp/tools/plan_layout.mjs` (one sentence), `mcp/TOOLS.md`, `mcp/work/L6.md` (its laptop list), new
  `mcp/lab/bidi-lab.mjs` and `mcp/lab/BIDI-LAB.md`, two new suites (`test-0.3.1-bd1.mjs`, `test-0.3.1-bidi-lab.mjs`, one
  line each in `tests.json`). Not LR1's files (pbip-query.js, approval-window.mjs, the Arabic terms,
  test-0.3.1-arabic-lens.mjs) nor LR2's (pbip-export.js, story-titles.js, the website download). No website file.
- **Base:** `fix/0.3.1-bd1` from `origin/integration/0.3.1` (0f7f6e8). Push only this branch; the reviewer merges.
- **Expected checks:** (written before the work) bd1 about 16 checks, about 10 red first on 0f7f6e8; bidi-lab about 8
  checks (all red first: no lab yet); `npm test -- arabic` 10 -> 12 suites (the two new ones), every other line the same;
  `-- report`, `-- release`, `-- core`, `-- checker`: the baseline's lines and counts (dax-functions 90 -> 90: its AR1
  pins the `VAR ar = i & leader ...` text, which I keep; the RLM goes in the RETURN); the golden reports byte for byte
  (no golden report uses daxFunctions); `npm test -- --keep-going` 89+ -> +2 suites, all PASS.
- **Invariants:** metadata only (the lab is a made-up model; the lens reads texts a person typed, as before); nothing
  written without approval (the lab writes only into the empty folder it is given, as the other labs).
- **Resume:** see "Results" below for where the work stands.

## Plan
1. This note, pushed first. Baselines on 0f7f6e8 (below).
2. Red first (`mcp/test-0.3.1-bd1.mjs`, in process, made-up texts, a temp folder):
   - D1-D5 (item 1): DA.StoryTitle's Arabic starts with U+200F (UNICHAR ( 8207 )) and ends with it; a JS evaluation of the
     function's own DAX body (VARs, IF, ISBLANK, UNICHAR, FORMAT, &: a 20-line evaluator in the suite) for a Latin leader
     ("North", "1.2M", "Sales", 0.094, «العام الماضي») gives RLM FSI North PDI ... and for a blank delta ends PDI RLM; the
     marks taken off give the plain sentence; English unchanged (no RLM); every other Arabic text the library builds at
     run time named and judged (DA.KpiCard: HTML in an SVG picture with dir="rtl", a browser paragraph, not Power BI's;
     the sparkline and bullet bar: no text).
   - X1-X5 (item 2): the lens's TEXT_MIXED on a hand page (a text box with a middle run, one with a run at the start, one
     Arabic only): the same id and count (2), the fix says a Latin run anywhere can swap the Arabic around it (measured
     in Desktop 2.159, 26 Oct), names U+2068 ... U+2069 and U+200F at the start of the text, and no longer offers "reword
     it so the run sits between Arabic words".
   - W1-W5 (item 4): no text the option writes says "empty" or "blank" for what Desktop shows before the script (daxHow,
     daxSaid.modelChange, plan_layout's sayInPlan, DAX_MEASURE_PENDING, TOOLS.md): each says it shows an error until the
     script is applied; howToApply says Desktop's compatibility prompt comes at Preview and again at Apply, and that it
     names only the first function (DA.Sparkline).
3. `mcp/test-0.3.1-bidi-lab.mjs` (item 3): the lab writes into an empty folder, refuses a non-empty one, validator 0
   errors, every kind x position x variant present (8 kinds x 3 x 5 = 120 tested texts), each variant's text exactly its
   rule (V0 raw, V1 `isolateLatin`, V2 V1 with U+200F first, V3 U+2067 V1 U+2069, V4 U+202B V1 U+202C), every label
   plain ASCII and never inside a tested text, typed Power Query rows, the key printed.
4. The fixes at the cause, as above. Then the suites (below), the note's results, SEEN-QUEUE untouched (not a Seen batch).

## Baseline (0f7f6e8) -> after
(filled from the runs)
