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
- **Got:** bd1 18 checks (14 red first on 0f7f6e8), bidi-lab 11 (B0 red without the lab; 135 tested texts, 38 pages,
  validator 0 errors, 0 warnings); arabic 10 -> 12 suites; report 28, release 5, core 6, checker 5: every line the same
  count; website run-all 21 = 21; dax-functions 92 = 92 (no pin changed); full run: below.
- **Resume:** done; waits for the reviewer. Desktop: "For the laptop" 1-3 (the batched run).

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

## Baseline (0f7f6e8, a clean worktree) -> after
- `npm test -- arabic`: 10 suites passed -> 12 (bd1 18, bidi-lab 11 added; every other line the same).
- `npm test -- report`: 28 -> 28, every count the same (dax-functions 92, story-titles 94, sq15b 19 ...).
- `npm test -- release`: 5 -> 5 (0.3.0-claims 672, release-text 38: the same).
- `npm test -- core`: 6 -> 6 (mcp 1591, golden 12 tasks match, mutation 186 checks / 72 mutants killed: the same).
- `npm test -- checker`: 5 -> 5 (arabic-lens 31: LR1's suite, untouched, still green on the new words).
- `scripts/tests/run-all.mjs` (the website, for the article): All 21 passed -> All 21 passed, every count the same.
- check-agent-memory PASS (153), check-result-lines PASS (93), changelog-words PASS (132), test-site-config PASS,
  ar-pages PASS, test-arabic-terms 87 PASS, check-min PASS (every changed .min.js has a new stamp).
- Full run `npm test -- --keep-going`: FULL_RESULT.

## Results
Commits: plan 8e17490, red first 71208eb, the work 6cc745c, the article 0023591 and its sitemap dates 9c7978c, this note.

| Item | Before | After | Test (red -> green) |
|---|---|---|---|
| 1 DA.StoryTitle | the Arabic text started with an isolate, no U+200F: Desktop drew it out of order | `VAR r = UNICHAR ( 8207 )`; the Arabic is `r & ar & r` (opens with RLM, the measured pattern; closes with one, as isolateLatin does after an end run); English unchanged; the function's description says it | bd1 D1, D2, D4 red -> green (a JS evaluation of the function's own DAX body); D3, D5, D6 pins |
| 2 the lens's TEXT_MIXED | "a run at an end, or one with signs inside it, reads in the wrong place ... or reword it so the run sits between Arabic words" | "a Latin run anywhere in the text, at an end or between Arabic words, can swap the Arabic around it (measured in Desktop 2.159, 26 Oct)"; the fix: each run in U+2068 ... U+2069 and U+200F at the start of the text; same id, same count | bd1 X2-X5 red -> green; X1 (id, count 2) pin |
| 3 the bidi lab | none | `mcp/lab/bidi-lab.mjs` (9 kinds: text box, visual title, card label, card callout, button, table header, slicer header, tooltip page name, page name; 3 positions; V0-V4), `--key`, `--pages`; `mcp/lab/BIDI-LAB.md` | bidi-lab B0 red -> B0-B10 green |
| 4 L6's words | "the pictures are empty and the story titles blank"; check_report "empty in Power BI Desktop"; howToApply "then Apply and accept the compatibility upgrade" | each KPI card, story title and table picture column "shows an error until you apply the script" (howToApply, the plan's modelChange, plan_layout's sayInPlan, DAX_MEASURE_PENDING, TOOLS.md, L6's laptop list); the prompt "at Preview and again at Apply", naming only the first function ("... needed for [function DA.Sparkline]") | bd1 W1-W7 red -> green |

## CHANGELOG line
- Arabic chart titles from the DAX function library start with a right-to-left mark, so an English name at the start
  keeps the sentence in order in Power BI Desktop; check_report's Arabic lens says an English word anywhere in Arabic text
  can swap the words around it, with the fix; the DAX functions option says Desktop shows an error until the script is
  applied and asks for the compatibility upgrade at Preview and at Apply.

## Decisions I made
1. **U+200F at both ends of DA.StoryTitle's Arabic**, not only the start: the measured pattern is RLM first; a text that
   ends with an isolate (no change: it ends with the noun) gets one after it too, as `isolateLatin` does. Added in the
   RETURN (`r & ar & r`), so L6's AR1 pin on `VAR ar = i & leader ...` holds unchanged.
2. **DA.KpiCard unchanged:** its Arabic is HTML inside the SVG picture with `dir="rtl"` (a browser paragraph with a right
   to left base, not Power BI's text drawing); the sparkline and bullet bar draw no text. No other DAX the library builds
   holds Arabic at run time (the measures pass «العام الماضي» and the Arabic names into DA.StoryTitle).
3. **The lens's twin sentence kept** ("The twin writes every mixed Arabic and Latin text with each Latin run isolated"):
   true of what the twin writes today (V1). Whether V1 is enough is the lab's question (Seen 1).
4. **The website article corrected too** (`article-power-bi-report-ready-for-arabic`, EN and AR): it gave the same advice
   as the lens ("reword it so the English word sits between Arabic words"); "public claims true". build:min, the
   translation's `?v=20261026bd1` on both copies, csp (no change needed), ar-pages --write, sitemap-lastmod (2 dates),
   dateModified 2026-10-26, BLOG-PLAN.md's log line. No other website page names the DAX library: no other page changed.
5. **The card's label and callout are two pages** (3a, 3b), so each box tests one text: 9 kinds, 135 tested texts (the
   plan said 8 x 15 = 120).
6. **Page and tooltip-page names judged on the page tab** while that page is open (one page per variant), each page with
   its own ASCII label box; the tooltip pages are bound to cards on `p7tooltips`, not hidden, so their tabs show.
7. **compatSaid / HEADER kept** ("Power BI Desktop asks before it raises it"): still true; the detail (Preview and Apply,
   the first function named) is in howToApply and TOOLS.md, where the steps are.

## For the laptop (Power BI Desktop 2.159 or later; the batched run)
1. Item 3: `mcp/lab/BIDI-LAB.md` "How the laptop runs it, unattended": write the lab, open it with the engine's
   `lab-tools\harness.ps1`, screenshot the 38 pages by id, judge from full-size crops, fill its table (27 rows x V0-V4).
2. Item 1 rechecked: an Arabic report (lang "ar", daxFunctions true, a made-up model with a Latin category such as
   "North"), the script applied: the story title «North في الصدارة بـ ...» reads in order, "North" first from the right.
3. Item 2 rechecked: L1's hand page (`mcp/test-0.3.1-arabic-lens.mjs` fixture (b)): check_report lens "arabic" gives the
   new TEXT_MIXED words; retype the text box with U+200F first and «U+2068 Department U+2069»: does it read in order (the
   lab's p1textbox V2 middle is the same text).

## Seen, not in scope
1. `isolateLatin` (assets/js/text-measure.js, the MCP's and the website download's rule) puts no U+200F at the start when
   the run sits in the middle (V1); the lens now advises U+200F at the start (V2). The lab decides; the rule changes only
   after the owner's go (it is LR2's download path too).
2. text-measure.js's comment still says "A Latin run between Arabic words is read in the right place" (now measured
   untrue); a comment in a website file, left for the rule's change.
3. A model that already holds L6's previous DA.StoryTitle (applied from an earlier 0.3.1 build) now reads as "its own
   function" (a plan problem: rename or remove it first), since the text changed. 0.3.1 is not released.
4. arabic-calendar.js builds its own RLM in DAX (`RLM = 'UNICHAR ( 8207 )'`): not the library; not checked against the
   lab's result.
5. L6's "Earlier L6" laptop list (#82's) still says "KPI pictures empty, story titles blank": kept as history.
