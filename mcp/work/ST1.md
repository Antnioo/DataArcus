# ST1 (0.3.1, the owner, 26-27 Oct): the "Seen, not in scope" sweep of 0.3.1

## Summary
- **Approval:** the reviewer's brief "Go on ST1" (line 2 of the 0.3.1 release bar), corrected 13:56 (SQ0's queue
  stands); the owner, 26 Oct: "don't freeze .3.1 fix the seen not in scope in it"; 27 Oct: "get 0.3.1 in a shape that
  you yourself would back up by every means".
- **Scope:** this register (595 items, a verdict each, checked in today's code); 18 fixes, one commit each with its
  red-first test; the old notes not edited. Not GD2's files, not SF1's (README install, CHANGELOG 0.3.1, the hard rules).
- **Base:** `fix/0.3.1-seen-sweep` from `origin/integration/0.3.1` (44d1f32). Push only this branch.
- **Expected checks:** (written before the work, revised 13:56) 595 items: the queue's 442 (DONE, OBSOLETE, DUPLICATE
  stand, 10 spot-checked; 106 OPEN confirmed; OWNER triaged) + 153 new. New: FIXED-SINCE ~30 %, NOT-A-PROBLEM ~25 %,
  0.3.2 ~20 %, NEEDS-DESKTOP ~15 %, FIXED-HERE 10-20, GAP 0-5. Full run 105 suites + 0; each fix's suite +1 check or
  more, red first; lint 0; agent-memory, changelog-words PASS.
- **Got (595):** FIXED-SINCE 200 · NOT-A-PROBLEM 167 · 0.3.2 66 · NEEDS-DESKTOP 58 · DUPLICATE 33 · FIXED-HERE 16 ·
  GAP fixed here 2 · FIXED-HERE-NEXT 2 · STOP-GAP 12 · SF1 12 · DROP 14 · CHOICE 13. Spot-check of the queue: 10 of
  10 hold. The new 153: NOT-A-PROBLEM 49, 0.3.2 47, FIXED-SINCE 17, FIXED-HERE 13, DUPLICATE 9, STOP-GAP 8,
  NEEDS-DESKTOP 6, SF1 2, FIXED-HERE-NEXT 2 (more 0.3.2 and fewer FIXED-SINCE than expected: the notes are a day old).
- **GAPs fixed here:** GC-S2 ("Free" in 26 page headlines and 17 go/ links), 0.2.9-checks-S1 (THEME_NAME's untrue
  "Desktop may not load it"). **STOP-GAP (11):** 9 are GD2's files (the glass preview GD1-S2, the twin's mirrored
  glass picture GD1-S4, the generator's glass table GL2-S2, a glass plan saying "solid" GL1-S2, plan-lint's chartAxes
  SQ13-S1, the layout canvas SQ13-S2, the twin's phone card title SQ4-S2, the twin's panels, "Total" and number axes
  M1-S1/S2/S3); TT1-S1 (the website's Arabic download keeps English titles: L, the owner's scope call);
  0.2.9-writer-S10 (his 26 Oct yes not carried out: a layout option in GD2's design-engine.js). Below.
- **The owner's 73 yes answers (26 Oct):** 70 fixed by their SQ batch (commit or test in each row; checks-S4 with option
  (a), the refusal), AF2-S1 and R1-see-the-result-S3 nothing left (checked), 0.2.9-writer-S10 STOP-GAP. None in his list.
- **Tests:** before: 105 suites (GD1's full run on ac296cc3; my own baseline run was cut at 30 min after 24 suites, all
  PASS). After: see "Before -> after" (the full-run line at the end).
- **Resume:** done (full run on 381b264a: 105 suites passed); the reviewer: STOP-GAP briefs, the owner's lists below.

## The count (how)
- Every note in `mcp/work/` (and `archive/WORK-*`, as the queue did) with a "Seen, not in scope" part.
- The 73 notes the queue covers (`SEEN-QUEUE.md`, 25 Oct): its ids, `<NOTE>-S<n>`, 442 items (prose numbered too).
- The 35 notes written since (0.3.1's jobs and the SQ batches): every line starting with "- " or "N. " in a section
  whose heading holds "Seen, not in scope", up to the next heading: 153 items. Total 595.
- The brief's rule over every note gives 524 in 102 notes (J19, L2, L4 and the WORK files keep "Seen" as prose).
- No queue note gained an item after 639c42b3 (each note's items at 639c42b3 and today compared by text).

## The plan
1. This note, the count and the plan; commit, push.
2. The register, in the brief's order: GD1, GL2, TT1, BD2, CS2, NC3, GC3, R4A, then 0.3.1's other notes, then the
   older ones. New items: every verdict checked in today's code (file:line or a command's output). Queue items: its
   DONE/OBSOLETE/DUPLICATE linked to its row (10 spot-checked), formerly OPEN confirmed by their batch's commit, OWNER
   read against the owner's decisions: GAP, NEEDS-DESKTOP, 0.3.2, DROP or CHOICE (his list: 40 lines at most).
   Push every 50 items.
3. Fixes: FIXED-HERE (about 20 lines with the test) and GAP (about 60) in this branch, test red first, one commit each;
   at most 25; past that FIXED-HERE-NEXT.
4. The summary on top: counts, GAPs, the 0.3.2 list (30 lines at most), the NEEDS-DESKTOP list.
5. lint, touched suites, build:min and stamps if `assets/js/` changes; the full run after the last code commit.

## STOP-GAP (each leaves one of the owner's decisions partly undone; too large here or in another job's files)
| Item | What is undone | What a fix needs |
|---|---|---|
| GD1-S2 (= GL2-S3, GL1-S1) | the approval page draws a glass report solid, no picture (`page-preview.js`: no glass code) | GD2 is on it: the picture behind the page, the cards at glassLook's transparency, clear tables |
| GD1-S4 | the twin keeps the English glass picture unmirrored (`twin-plan.mjs:77-79`, `twin-write.mjs`) | GD2's: a mirrored picture under the same name, 15-30 lines + checks |
| GL2-S2 | the generator's glass preview fills the table header with the accent, no band (`theme-generator.js:98-99`) | GD2's: header clear, odd rows `gl.table.band`, 3-5 lines + 2 website checks |
| GL1-S2 | a model whose theme has transparent cards now gets glass, yet the plan says "the new visuals are solid" (`design.mjs:109`; measured with planLayout) | 2-4 lines in `design.mjs` after lookFor (:300) + 2 checks in glass-default (GD2's file) |
| SQ13-S1 | plan-lint's build has no chartAxes: an Arabic plan's preview without exact files draws charts over time unmirrored | 3 lines in `plan-lint.mjs:66-68` (GD2's) + a check in sq13 |
| SQ13-S2 | the website's layout canvas draws slots before the writer's fit (header rows, rail) | M-L in `design-engine.js`/`page-preview.js` (GD2's), the owner's call on the cost per move |
| SQ4-S2 | the twin keeps the English phone card title's wrap for a longer Arabic title (`report-mirror.js:513-525`) | 15-20 lines with the writer's wrap rule; callers are GD2's twin files |
| M1-S1 (= X2-S5) | the twin's Arabic pages lose the text box panels the English pages keep (`twin-pages.mjs:214-235,307`) | about 15 lines (twin-pages, `twin-plan.mjs:209`, parity's KNOWN.textPanel); the owner confirms "kept" (R1 item 4 came from a real report) |
| M1-S2 | the twin's mirrored table loses "Total" (columns reversed; measured round 10) | M, 40-60 lines: the writer's right-to-left table (`pbip-page.js:979,1029`) in the twin; a laptop check first |
| M1-S3 | the twin keeps a whole-number continuous axis left to right (`twin-model.mjs:28,53`); create_report reverses it | 5-10 lines + a parity check; measured in Desktop first |
| TT1-S1 | the website's Arabic download keeps English titles on English field names (TT1 Decision 2) against the owner's "don't keep english titles in arabic reports" | L, 60-120 lines: before the Arabic download, the names without Arabic listed with drafts the person edits and approves (never silent); 0.3.1 or 0.3.2 is his call |
| 0.2.9-writer-S10 (= SQ13-S3) | the owner's yes (26 Oct): rows beside a shortened rail keep their width, a 197-392 gap (pinned by sq13 S10) | one of SQ13's options in `design-engine.js` (GD2's): my pick (a) REFLOW_KEEP 0.5 -> 0.45 (closes the 197 gaps; the chart 347 -> 168 high), then a laptop look |

## For the owner (40 lines at most)
**0.3.2 (one line each, most valuable first; ids in the register):**
1. Arabic on Arabic approval pages and checks: the redesign page, the layout findings, the Gulf calendar rows, row words,
   lint places (R4A-S1, R4A-S2, LR1-S2, SQ3-S1, SQ5-S2).
2. Glass follow-ups: generate_theme also writes the page picture (GD1-S1); a glass matrix's blank rows clear (GL2-S1,
   touches GL2: check the theme schema first); the calendar heatmap's ends from the theme, readable on dark (NC2-S3).
3. An unreadable model file said by check_report and the Arabic lens too, as read_model and suggest_fields now do (AU47-S2).
4. Native copy: replaced bar charts sorted by value (NC3-S1); a grown dropdown never covers the visual below (NC3-S4);
   the closer native's words first (NC2-S6); a measure title's unit as a subtitle (SQ2-S2).
5. The twin: Arabic flip-card and switcher scripts (A3-S3); month axes rebound once the script is applied
   (0.3.0-arabic-twin-S4); phone copies folded in the plan's count (SQ4-S3).
6. Answers remembered: confirmed terms, Gulf dates and shared axes kept in the answers file (J18-S5, J19-S2).
7. Plans: plan_layout lists left-out visuals from the exact build (SQ1-S1); a "field not in the model" finding
   (SQ14-S5); lint places with ordinals and the base theme's label size (SQ5-S1, SQ5-S4, SQ6-S1); a Date axis binned by
   month (WORK-2026-10-11-14-S10); relateTo proposed by the health check (GC3-S3); a test for the Arabic
   terminology sheet's calendar column (SQ4-S1).
8. Metric switcher: Top N, a navigation button and a phone layout, the month's sort, the KPI's own status (L3-S1,
   L3-S3, SQ15b-S1, SQ15a-S3).
9. Redesign: the grid's side margin from the title box, shorter cut names, a counter for a taken name, read_report's
   text set, the new .platform counted, pills at the dropdowns' text size (RD1-S1, RD1-S2, RD1-S4, CS1-S1, SQ2-S3, F2-S2).
10. "Next to the project" names the folder everywhere (R4A-S3); the bullet bar says an expression target (SQ15a-S2).
11. Website: share images stamped (SQ8-S1); Fabric regions line (SQ8-S4); an Arabic SUPPORT page (PR1-S5); the beta
    page's run from 0.3.x (0.2.9-design-S11); the plugin named on the site (K1-S1); English column names isolated in the
    calendar generator's Arabic notes (GC-S6); "Copy, paste, done." out of its description (GC-S2's rest); an axis grey
    option (L2-S2); PRIVACY's two headings (PR1-S3).
12. Code and tests: approval-window.mjs (89 KB) and check-report.mjs (62 KB) split, TOOLS.md rows as paragraphs, one
    DAYS and HIJRI list, one directory read (S9-S3, A1-agent-memory-S5, SQ14-S2, SQ6-S2); fixture timeouts, a phone parity
    check, a group-offset mutant, coverage, a `]]` key (SQ11-S1, SQ11-S2, SQ15c-S1, SQ15c-S2, SQ15c-S4, SQ10-S1).
13. Packaging: --live checks the SHA-256; tool counts read from mcp/tools; build tests on a copy; privacy in the
    manifest; root plugin.json (PR1-S4, audit-8-packaging-S1,
    audit-8-packaging-S2, audit-8-packaging-S3, K1-S6); the share-image script's browser (SQ8-S6). Smaller: TT1-S2, TT1-S3, LR1-S1, LR1-S3,
    RD1-S4, SQ12-S3, 0.2.9-reader-S25.

**His choice (one question each):** keep naming Microsoft's skill in the plugin (D5-S2); positioning and tiers
(D5-S7); name Claude Code and VS Code beside Claude Desktop (DS1-S1); one tool name EN/AR, "calendar table" (E-S3); Eid
al-Adha 10-12 as u.ae or 13 (GC2-S5); powerbi-authoring a hard or optional dependency (K1-S4); which other clients get a
manifest (K1-S7); Arabic DA measures for the twin (L6-S1); mirror the Arabic article's pictures (W-S3); the consulting
sentence (W2-S1); what B-06 and B-23 mean (0.2.9-writer-S7); a small table's title scales with its rows
(WORK-2026-10-05-09-S11); a category pool with fields given (WORK-2026-10-11-14-S22); the twin's panels kept (M1-S1);
TT1-S1's scope.

**Drop (why: each row):** A1-S2, AF1-S2, E2-S3, G1-S2, L5-S2, R1-see-the-result-S1, R1-see-the-result-S4, RB-S3,
RB-S4, W-S4, 0.2.9-custom-visuals-S1, 0.2.9-reader-S5, 0.3.0-arabic-twin-S5, audit-summary-S4.

## For the laptop (NEEDS-DESKTOP, 58; what to look at and record: each row's evidence)
- Bidi and Arabic text: BD1-S4 (digits with RLM in a title), J19-S6 (an AED axis title), V1-S1 («التفاصيل» tab),
  SQ15b-S4 (Arabic report and website download, each page), L1-S1 and W-S2 (Format pane names the lens quotes).
- Twin and mirror: WORK-2026-10-05-09-S4 (the matrix variant), 0.3.0-arabic-twin-S2, 0.3.0-arabic-twin-S6 (bookmark, buttons),
  C1-S2, C1-S3 (the calendar script), D7-S2 (waterfall mirror), X1-S1 (the EN-AR copy, X1 steps 3-6), F2-S1, L5-S3
  (icon side in an Arabic table).
- Sizes Desktop draws: L2-S3, L6-S12, L6-S13, Q1-S6, R1-S6, R1-S7, audit-2-design-engine-S1, audit-4-checks-S1,
  0.2.9-writer-S9, 0.2.9-writer-S13, 0.2.9-writer-S16, 0.2.9-writer-S17, 0.2.9-design-S1, D5-S10, CS1-S5,
  NC3-S3, WORK-2026-10-11-14-S9, WORK-2026-10-11-14-S23, F1-S1 (the listed rules in Desktop).
- What Desktop opens: 0.2.9-checks-S2, 0.2.9-checks-S3, 0.2.9-checks-S10, 0.2.9-writer-S18, 0.2.9-reader-S19,
  0.2.9-reader-S26, NC2-S4, NC2-S5, D1-S3, A3-S5,
  L3-S4, L4-S5, L5-S4, L5-S5, L6-S8.
- The build and the app: A1-S3, J19-S3, K1-S3 (a Mac), K1-S9, 0.2.9-checks-S8, 0.2.9-reader-S3, U1-S4, T1-S10, T1-S15.

## Fixes (18, one commit each; red first on the commit before unless said)
| Item | Commit | What | Test (red first) |
|---|---|---|---|
| S9-S1 | 596c12e | the twin's dead MONTHS_AR gone | v029i: the twin declares no month list (red on e25c25b) |
| K1-S2 | c11eb9a | `.mcpb-cache/` in the root .gitignore; the 8-file count skips it | skill-packaging |
| 0.2.9-checks-S1 | fbd0132 | THEME_NAME's fix: "the validator and Fabric reject it (Desktop opens it: measured)" | v029a4 |
| I-S2 | dd0dcfa | an exam area's weight in `<bdi dir="ltr">` (+ stamps) | tools I-2, 4 checks (EN, AR, both exams) |
| NC3-S5 | 19d0940 | a second option's needs in the plan and on the approval page | custom-visuals-lab NC3-1g (the commit says red on 2ca7d9c: a typo for dd0dcfa) |
| NC3-S2 | 91c3f78 | "an Azure map" (aOr) | custom-visuals-lab NC3-2g |
| GC3-S2 | 5904be6 | "Asked to relate to the new table's Date" | gc3 G1-5b |
| R4A-S4 | 9109a07 | kept text settings in plain words | cs1 T10 |
| AU47-S2 (part) | 6e20ea3 | suggest_fields says `unreadable` first | aud047 M5 (8 checks) |
| SQ12-S4 | dab2d1e | "rule 10"; every such cite held to its rule | agent-memory |
| SQ9-S2 | 13aa094 | PRODUCT_SPEC: KPI cards 0-6, path, planFields | 0.3.0-claims |
| SQ15a-S1 | 96084e5 | TOOLS.md: kpis, drillLevel, images, decoration | sq15a |
| TT1-S4, SQ9-S1 | 62d3dac | two stale test texts (no number changed) | none (comment, label) |
| BD2-S1 | 3003067 | DESKTOP-TESTS.md: the 27 Oct bidi measurement | bd2 |
| GC-S2 | c1a6bd8 | no headline says free/first/only/official (26 pages, 17 go/ links) | site: every page as served and as shown |
| SQ7-S2 | 4ed057f | the Calendar Generator's Arabic columns note names the label twins it writes, EN and AR | gulf-calendar |
| PR1-S2 | 381b264 | the beta form's model question: general words, no figures, client or private names, EN and AR | 0.3.0-claims |

## Results (counts per verdict)
| Verdict | New 153 | Queue 442 | All 595 |
|---|---|---|---|
| FIXED-SINCE (a later commit: sha and file:line, or the test) | 17 | 183 | 200 |
| NOT-A-PROBLEM (checked: informational, by design, the code changed) | 49 | 118 | 167 |
| 0.3.2 (still true, outside the decisions: his list) | 47 | 19 | 66 |
| NEEDS-DESKTOP (the laptop list) | 6 | 52 | 58 |
| DUPLICATE (of the id named) | 9 | 24 | 33 |
| FIXED-HERE (this branch, red first) | 13 | 3 | 16 |
| GAP, fixed here | 0 | 2 | 2 |
| FIXED-HERE-NEXT (small, not done here: why in its row) | 2 | 0 | 2 |
| STOP-GAP | 8 | 4 | 12 |
| SF1 (the hard rules: SF1's job; today's state in the row) | 2 | 10 | 12 |
| DROP / CHOICE (the queue's OWNER decisions) | 0 | 14 / 13 | 14 / 13 |
The queue's OWNER 108 went to: NEEDS-DESKTOP 52, CHOICE 13, DROP 14, 0.3.2 20, GAP 2 (fixed here), the rest
FIXED-SINCE (fixed since 25 Oct, for example A3-S2 by TT1 8ddfe11) or SF1. Its 106 OPEN: all fixed by their SQ batch
(FIXED-SINCE, with the batch's commit) but 0.2.9-writer-S10 (= SQ13-S3: STOP-GAP, the owner said yes on 26 Oct).

## Decisions I made
1. **The count:** the queue's ids for its 73 notes (its rule numbered prose too) and the brief's rule for the 35 new
   ones: 595. The brief's 451 in 94 is neither rule; how both counts come out is under "The count".
2. **The queue's verdicts kept** as the reviewer's correction says, but the seven checkers had already read every queue
   row against today's code when it came: those rows keep their checked verdict (FIXED-SINCE / NOT-A-PROBLEM /
   DUPLICATE) instead of a bare link; the spot-check (10 random rows) found none wrong.
3. **"Free" in headlines (GC-S2) fixed here as a GAP:** the owner's rule is explicit (never in a headline); headline =
   `<title>`, `og:title`, `twitter:title` and `<h1>`, as served and as the page shows them. The words in a footer link,
   a description or body text are not headlines and stay; "Copy, paste, done." (a description) goes to 0.3.2. The
   wording: the word dropped, nothing else changed ("Power BI & Fabric Tools"); the Arabic CLV title's «الوحيد»
   ("the only") became «مقياس واحد» ("one metric"), as the English "The One Metric" says; go/ links take their target
   page's current title.
4. **THEME_NAME (0.2.9-checks-S1) fixed here as a GAP** (a public claim untrue against our own measurement), not left
   as the owner's wording call: the text now says what DESKTOP_OPENS records.
5. **Stamps:** `report-rules.min.js` changed but its `?v=` lives only in theme-generator.js's builder list (GD2's file):
   not bumped here; its stamp (20261025sq5) is not on main yet, so no visitor holds the old file. The reviewer bumps it
   when GD2 merges. Every other changed .min.js has `20261027st1` on every page that loads it.
6. **SQ1-S2 and SQ15a-S2 left FIXED-HERE-NEXT:** the first needs pbip-page.min.js's stamp (in theme-generator.js) and
   moves written positions; the second needs a report fixture for one note line.
7. **AU47-S2 fixed in part** (suggest_fields, the tool that answers a person directly); check_report's model read and
   the lens are in the 0.3.2 list.
8. **No history rewrite:** a `commit -a` swept GC-S2 into c1a6bd8 (the BD2-S1 wording commit); a force push to split it
   was refused by the session's permissions, so the commit stays and this note says what it holds.

## CHANGELOG line (for the reviewer; the 0.3.1 section is SF1's)
- **Plainer words and truer claims:** no page title or heading on dataarcus.com says "free" any more (the short links
  carry their page's current title); the report check says what Power BI Desktop really does with a theme whose name is
  not its file name; the approval page shows what a replacement's second option needs turned on, says "asked to relate"
  for the Gulf calendar's columns and names kept text settings in plain words; suggest_fields says when a model file
  could not be read fully; an exam area's weight reads right in Arabic; the Calendar Generator names every Arabic
  column it adds; the beta form asks for general words about your model, no figures or names.

## Before -> after
(each "before" is the red run's own count less the checks added; each "after" is the passing run)
- Website suites: tools 395 -> 399 (I-2: one check per exam and language); site 622 PASS (new: one static headline
  check per page and go/ link, the shown headlines inside each page view's existing check); gulf-calendar 905 -> 907;
  test-site-config, csp, ar-pages PASS.
- MCP suites touched: v029i 35 -> 36, skill-packaging 24 -> 25, v029a4 40 -> 41, custom-visuals-lab 70 -> 72, gc3 22 ->
  23, cs1 44 -> 45, aud047 98 -> 106, agent-memory 183 -> 184, 0.3.0-claims 672 -> 674, sq15a 23 -> 24, bd2 33 -> 34,
  large-model-caps 215 = 215 (a label).
- Tests changed on purpose: v029i's first month-list check drops `/AR_MONTHS/.test(twin)` (it passed on the dead line
  removed; the new check says the twin keeps no list); large-model-caps' label text. Nothing else.
- `npm run lint`: exit 0 on 381b264.
- Full run, MCP: 105 suites before (GD1's run on ac296cc3) -> 105 after (no suite added; checks added inside them).

Full run on 381b264a: "run-tests: 105 suites passed"

## Seen, not in scope
1. The `no-unused-vars` lint did not flag twin-model.mjs's MONTHS_AR because of an eslint-disable line written for it.
2. `marketplace.json` writes "0.3.1" itself; whether a test ties it to the one version file was not checked.
3. The site test's static headline check reads `<h1>` text without tags; a headline with markup inside is read as shown.

## Lessons for the reviewer
- A `git commit -a` in a tree holding another fix's files commits them too: stage by name when two fixes are open.
- A background run left at its default 30-minute limit is killed: the full run needs `timeout` raised (it ran past 30).
- The clone was shallow (222 commits): the checkers could not show older shas until `git fetch --unshallow`.
- A brief's count rule and the queue's differ (prose items): say which rule a number uses.

## The register (595 rows; queue rows link to SEEN-QUEUE.md's table, new notes since 639c42b3 are marked)

### GD1 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Glass theme from generate_theme on hand-placed pages: see-through cards, no picture | 0.3.2 | generate_theme.mjs:67 says 'A theme file alone carries no picture'; improvement: generate_theme also writes the soft page picture (glassPng) next to the theme file, with how to set it as canvas background (generate_theme.mjs is GD-off-limits now) |
| 2 | Approval page preview (page-preview.js) draws glass pages solid, no picture | STOP-GAP (GD2's) | page-preview.js has no glass code (grep -c glass = 0): the approval page draws a glass report solid, no picture; GD2 is doing it (page-preview.js) |
| 3 | Twin of an explicitly glass report stayed left to right before GD1 | FIXED-SINCE | b251678 (GD1: the twin mirrors a glass page): mcp/lib/twin-plan.mjs:77-79 isGlassPng picture counted as no picture |
| 4 | Twin keeps glass picture unmirrored: colour fields not where the English page has them | STOP-GAP (GD2's) | twin-plan.mjs:77-79, twin-write.mjs keep the English glass picture byte for byte: its colour fields are not mirrored; fix: a mirrored picture (redraw flipped) under the same name, 15-30 lines + checks in GD2's suite |

### GL2 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Matrix blankRows (off by default) would draw own colour if turned on | 0.3.2 | design-engine.js:867-873 glassTables has no blankRows entry; improvement: add pivotTable blankRows backColor clear to glassTables, after checking the theme schema has that property (no schema in repo to confirm) |
| 2 | Theme Generator preview: glass table header in accent, no band, unlike the theme | STOP-GAP (GD2's) | theme-generator.js:98-99 the glass preview table's header filled with the accent, no band: the preview says it draws what Power BI draws; fix 3-5 lines (header clear, odd rows gl.table.band) + 2 checks in theme-generator suite |
| 3 | Approval page preview still draws glass pages without the picture | DUPLICATE-OF GD1-S2 | page-preview.js has no glass code: GD2's |
| 4 | A person's own column formatting or conditional formatting stays solid | NOT-A-PROBLEM | by design: the person's own setting wins over the theme (GL2's note); the theme sets only glassTables objects, design-engine.js:867-873 |

### TT1 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Website Arabic download cannot ask Arabic names: titles on English names stay English | STOP-GAP | the website's Arabic download keeps English titles on English field names (TT1 Decision 2, a builder's): the owner 27 Oct 'don't keep english titles in arabic reports'; fix L (60-120 lines): a name list before the Arabic download with drafts the person edits and approves (never silent); the owner's scope call: 0.3.1 or 0.3.2 |
| 2 | Shared-title gallery charts get alternate plus bracket: 'Sales PY per Quarter (Quarter)' | 0.3.2 | assets/js/pbip-page.js:1418-1419 still adds ' (' + c + ')' after alt(nth[c]); improvement: leave the bracket out when the alternate already names the column |
| 3 | Gallery joins keep R2's rule: measure alone for English pair in Arabic report | 0.3.2 | visual-gallery.js:184-188 join() and pbip-query.js:324-329 byTitle return the measure alone; one language, so the rule holds; improvement: gallery titles on English names whole English 'A by B' as TT1's main charts |
| 4 | test.mjs comment still says round22 keeps the brackets' case | FIXED-HERE | 62d3dac: test.mjs:4586 'pins the titles wholly in one language, no bracket' (a comment: no test) |
| 5 | Golden task 2 'Month Short' has no fixed-list draft; charts English until named | NOT-A-PROBLEM | by design: arabic-names.mjs proposeArabic gives no guess; plan_layout.mjs:248-249 lists it under proposeYourself so the assistant drafts and the person approves (the owner's rule) |

### BD2 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | DESKTOP-TESTS.md has no entry for the 27 Oct bidi lab measurement | FIXED-HERE | 3003067, c1a6bd8: DESKTOP-TESTS.md '2026-10-27: Arabic text with a Latin run' (V3, Desktop 2.159, BIDI-LAB.md); bd2 checks the entry (red on 62d3dac first) |
| 2 | Twin labels a person gives with a Latin run in a page name are kept | NOT-A-PROBLEM | the person's own approved text, named in the plan; DataArcus never translates silently; page tabs lay out LTR whatever they hold (text-measure.js:43) |
| 3 | model-health.js builds FSI...PDI for its own browser canvas | NOT-A-PROBLEM | a browser canvas on the website, never written to Power BI |
| 4 | axis-units.js and visual-meaning.mjs FSI units reach Power BI wrapped by isolateFiles | NOT-A-PROBLEM | informational: pbip-export.js:530 and report-run.mjs:408 run isolateFiles on Arabic builds; isolateLatin wraps an already isolated text whole (text-measure.js:62-66) |

### CS2 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Theme text class kept: new visual types not in the report still follow it | NOT-A-PROBLEM | by design (CS2 decision 1, per-type visualStyles): every type in the report gets the set; only types added later follow the theme |
| 2 | Bold/italic left to theme: a base theme drawing titles bold keeps doing so | NOT-A-PROBLEM | CS1 decision 2: bold and italic are the theme's; the plan says it (text.boldItalic, approval-window.mjs:590) |
| 3 | Copy of a report without $schema keeps validator's NO_SCHEMA error | NOT-A-PROBLEM | the original has the same error and Desktop opens both (CS2 measured); copy kept faithful |
| 4 | read_report does not list the theme's visual styles | DUPLICATE-OF CS1-S1 | read-report.mjs:485-492 reads visualStyles only for colours/transparency and the title font; no text sizes listed |
| 5 | Base worktree comparison ran on Linux only | NOT-A-PROBLEM | session event; CI runs Windows and macOS |

### NC3 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Other replaced bars with no sort (drill bar, tornado) drawn A to Z | 0.3.2 | only the word cloud gets sortDefinition by value (visual-meaning.mjs:493 'Power BI sorts a bar chart by its value'); improvement: the same sortDefinition for the drill bar and tornado, if the owner wants it |
| 2 | Evidence line reads 'name a Azure map' (article before vowel) | FIXED-HERE | 91c3f78: visual-meaning.mjs aOr ('an Azure map'); custom-visuals-lab NC3-2g (red on 19d0940 first) |
| 3 | Validator slicer floor (76 with header) vs measured 56 for dropdown with header | NEEDS-DESKTOP | lab page 2 (NC3 laptop item 4): the chip slicer's dropdown in its 64-high box with header 'Country': full-size crop; record whether the header is whole or cut (cut: threshold becomes 76) |
| 4 | Dropdown grown to 48 may cover pixels of the visual below | 0.3.2 | visual-meaning.mjs:631 grows the box downward and says 'check nothing below'; improvement: grow upward or move the visual below when they would overlap |
| 5 | Approval page shows a second option's losses but not its needs | FIXED-HERE | 19d0940: native-copy.mjs passes second.needs; approval-window.mjs 'second option, to turn on: ...'; custom-visuals-lab NC3-1g (red on dd0dcfa first; the commit says 2ca7d9c by mistake) |

### GC3 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Engine branch lab/rc031-proof not on remote; worked from brief | NOT-A-PROBLEM | session event (git ls-remote: no such branch); the tour's call without relateTo is G1's case in test-0.3.1-gc3.mjs:5 |
| 2 | Approval row 'Related to the new table's Date' lists columns as asked, not what is... | FIXED-HERE | 5904be6: approval-window.mjs:395 'Asked to relate to the new table's Date'; gc3 G1-5b (red on 91c3f78 first) |
| 3 | check_model_health gulfCalendar fix (gulfFixInputs) proposes no relateTo | 0.3.2 | mcp/lib/gulf-calendar.mjs:203-214 inputs have no relateTo; improvement: propose relateTo from the fact tables' date columns the check found |

### R4A (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Layout check findings English on an Arabic approval page | 0.3.2 | layout-check.js:310 summaryOf has Arabic, the findings do not (7 Arabic characters in the file, all in WORDS); improvement: Arabic text for each finding |
| 2 | Redesign approval page English only | 0.3.2 | approval-window.mjs redesign section (:585-595) has no Arabic labels; improvement: Arabic labels for the redesign page |
| 3 | Several 'next to the project' lines still lack the folder | 0.3.2 | metric-switcher.mjs:205, check-report.mjs:414/425/439, answers.mjs:86-87 still say 'next to the project'; improvement: name the folder (folderSaid) in each |
| 4 | CS1 text.kept rows on redesign page name raw properties ('fontFamily') | FIXED-HERE | 9109a07: approval-window.mjs plainProp ('font', 'title text size'); cs1 T10 (red on 5904be6 first) |
| 5 | Engine repo evals/e1-harness not reachable; brief's quotes used | NOT-A-PROBLEM | session event |
| 6 | Length of plan_layout and check_report answers (reviewer's proposal) | SF1 | answers capped today: mcp/lib/answer.mjs:25 ANSWER_MAX 40000, cut with a 'truncated' note (:63, :70); the length proposal belongs to the hard-rules job |

### AU47 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | TMDL cut exactly at a line break reads as a whole shorter file | NOT-A-PROBLEM | cannot be told from the file (AU47 tested: atLineBreak, Dates 2 columns) |
| 2 | suggest_fields, check_report model read and Arabic lens silent on unreadable TMDL | FIXED-HERE (part) | 6e20ea3: suggest_fields says `unreadable` first (aud047 M5, red on 9109a07 first: 8 checks). Left for 0.3.2: check_report's model read (check-report.mjs:477,525) and the Arabic lens (arabic-lens.mjs:102) |
| 3 | model.bim/.pbit with valid JSON but a missing table not detected | NOT-A-PROBLEM | not detectable from metadata: a valid model without a table is a model without that table |

### BD1 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | isolateLatin puts no U+200F for a middle run; the lab decides | FIXED-SINCE | 08ced1e (BD2: V3, the measured rule): text-measure.js:62-66 isolateLatin wraps the whole text in U+2067...U+2069 round V1's isolates |
| 2 | text-measure.js comment says a middle Latin run reads right (untrue) | FIXED-SINCE | 08ced1e rewrote the comment: text-measure.js:36-37 'A Latin run anywhere in Arabic text can swap the Arabic around it' |
| 3 | Model holding L6's previous DA.StoryTitle now reads as its own function | NOT-A-PROBLEM | only a model that applied an unreleased 0.3.1 build; the plan names it and how to fix (rename or remove) |
| 4 | arabic-calendar.js builds its own RLM in DAX, not checked against the lab | NEEDS-DESKTOP | arabic-calendar.js:44-45 digit isolates plus RLM (no Latin letters, so V3 does not apply); in Desktop 2.159 put the Arabic Year Quarter column in a pill slicer and a card cut with '...': record whether '2025 الربع 1' reads in order in each |
| 5 | L6's 'Earlier L6' laptop list still says KPI pictures empty | NOT-A-PROBLEM | history, kept on purpose |

### CS1 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | read_report does not list formatting (plan carries it) | 0.3.2 | read-report.mjs:485-492 reads the theme's colours and title font only; improvement: read_report lists the text set per class (fonts and sizes) the redesign would use |
| 2 | A text box's own runs (fonts per run) not counted or changed | NOT-A-PROBLEM | by design: the author's text |
| 3 | Hidden visuals and tooltip pages keep their own fonts (listed) | NOT-A-PROBLEM | by design and listed; CS2 decision 1: one with no own setting now shows the set by type |
| 4 | Text colour (fontColor) not part of the text set | NOT-A-PROBLEM | the owner named fonts and sizes; CS2 keeps colours on purpose |
| 5 | New card (cardVisual) and button slicer (advancedSlicerVisual) not known to the text set | NEEDS-DESKTOP | text-format.mjs has no cardVisual/advancedSlicerVisual; save a new card and a button slicer in Desktop 2.159 with title, value and label sizes set: record the visual.json objects and properties to add to the class table |

### GL1 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Approval page preview draws glass pages without the picture | DUPLICATE-OF GD1-S2 | page-preview.js has no glass code: GD2's |
| 2 | New report keeping an existing glass theme (cardTransparent) gets solid cards | STOP-GAP (GD2's) | measured: planLayout with a reportTheme cardTransparent 40 gives look glass, yet design.mjs:109 themeColours still says 'the new visuals are solid (#ffffff). Say it in the plan.'; fix 2-4 lines in design.mjs after lookFor (:300) + 2 checks in glass-default |
| 3 | generate_theme writes the theme only; theme users need the site's background download | DUPLICATE-OF GD1-S1 | generate_theme.mjs:67 'A theme file alone carries no picture' |
| 4 | Writer has no matrix of its own | NOT-A-PROBLEM | code changed: the writer writes a matrix kind (pbip-query.js:108 matrix -> pivotTable, tool-limits.mjs:11); only the engine's designed layouts have none, by design |
| 5 | Glass picture adds 1-2 s to create_report | NOT-A-PROBLEM | measured and small; informational |
| 6 | None further: stamps and sitemap dates matched | NOT-A-PROBLEM | informational, no finding |

### LR1 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Date branch of lastMonths has no ISBLANK(_last) guard | 0.3.2 | pbip-query.js:428 date branch still without it; a blank compares as 0, so every month is kept as in the label branch; improvement: the guard for symmetry and clarity |
| 2 | Approval page Fields rows English on an Arabic page; sample 'To open' bare path | 0.3.2 | approval-window.mjs:457 FL labels English only; improvement: Arabic row labels on an Arabic page |
| 3 | Draft compounds beyond the 14 (Fiscal Year, Week Day) give no draft | 0.3.2 | arabic-names.mjs:16-18 DATE_PAIRS 14 entries; improvement: more fixed drafts once the owner gives the terms (the assistant proposes meanwhile) |

### LR2 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Gallery chart titles keep R2's rule in an Arabic report on English names | DUPLICATE-OF TT1-S3 | visual-gallery.js:184-188, pbip-query.js:324-329 |
| 2 | test.mjs comment says round22 keeps the brackets' case | DUPLICATE-OF TT1-S4 | mcp/test.mjs:4586, fixed with TT1-S4 in 62d3dac |
| 3 | English download titles repeat across pages; measures numbered in names only | NOT-A-PROBLEM | each page's own title is unique on its page (test.mjs:4583-4588); the numbers are hidden measure names |
| 4 | Laptop harness skipped chartAxes, formats and maxKpis | NOT-A-PROBLEM | harness note, the real page is right; session event |

### NC1 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Bullet chart -> two bars, target marker lost, no closer native offered | FIXED-SINCE | 19f9467 (NC2): visual-meaning.mjs:532 bullet's closer native, columns with the target as a long-dash marker (:659); lost said at :491-494 |
| 2 | Word cloud -> bar of 12 products, said only as 'its own look' | FIXED-SINCE | 19f9467 (NC2): visual-meaning.mjs:493 formLost names the cloud and the bar sorted by value |
| 3 | Calendar heatmap -> line of 669 points; matrix would be closer | FIXED-SINCE | 19f9467 (NC2): visual-meaning.mjs:539-545 matrix of months by weekday as the closer native; visual-replace.js:139-148 heat shading |
| 4 | Tornado two-sided layout lost and not named in lost | FIXED-SINCE | 19f9467 (NC2): visual-meaning.mjs:490 'its two-sided layout ...' |
| 5 | Every replacement 'a guess' yet 7 say confidence high | FIXED-SINCE | 19f9467 (NC2): visual-meaning.mjs:650-655 'Never high without the package' (high needs roles read and the id) |
| 6 | Redesign name cap drops ' native', colliding with original's redesign | FIXED-SINCE | a4d99dd (RD1): redesign.mjs:40-62 KEEP_SUFFIXES keeps ' native' and ' (EN-AR)', a counter 2-9 when taken |
| 7 | Grid redesign uneven vertical gaps; text boxes at x 24 vs margin 16 | FIXED-SINCE | a4d99dd (RD1): rows 16 apart and from the page; the text boxes' x 24 is kept by rule (RD1-S1) |
| 8 | Title sizes and fonts mixed without CS1's consistent option | NOT-A-PROBLEM | expected: plan_layout consistentText (plan_layout.mjs:121) gives one text set when asked |
| 9 | lost line 'its own format settings (1: labels)' does not say what was kept | FIXED-SINCE | 3057ee8 (R4A): visual-meaning.mjs:176-184 ownSettingsSaid 'kept: ...; not carried over: ...', used at :585 |

### NC2 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | NC1 Seen 6 and 7 (name cap, grid rows) for CS1's file | FIXED-SINCE | a4d99dd (RD1): redesign.mjs:40-62 name keeps the suffix; rows 16 apart |
| 2 | NC1 Seen 8: titles mixed without CS1's option | DUPLICATE-OF NC1-S8 | plan_layout.mjs:121 consistentText |
| 3 | Heat shading ends fixed light blues, not the theme: poor on dark themes | 0.3.2 | visual-replace.js:31-32 HEAT low #f3f8fe high #8cc2f5; improvement: ends from the report's theme (or the cells' text set dark) so a dark theme stays readable |
| 4 | Matrix year rows may open collapsed (no measured expansionStates) | NEEDS-DESKTOP | open the native copy's calendar heatmap matrix in Desktop 2.159: record whether the year rows open collapsed or expanded, and save once to get the expansionStates JSON (visual-replace.js:135 writes one only for charts) |
| 5 | Error bars would give a bar its own target marker; JSON unmeasured | NEEDS-DESKTOP | visual-meaning.mjs:533-534; in Desktop 2.159 add an error bar from a target field to a clustered bar, save, record visual.json's error.errorRange |
| 6 | Plan line's why begins with the meaning's words; long for the bullet | 0.3.2 | visual-meaning.mjs:659 why = m.why + '; written as columns ...'; improvement: lead with the closer native's words, drop the set-aside hint |

### PR1 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Issue forms work only if Issues are on | NOT-A-PROBLEM | checked: gh api repos/Antnioo/DataArcus has_issues = true |
| 2 | Beta form requires 'What is your model about?'; no warning against private details | FIXED-HERE | 381b264: power-bi-mcp/index.html beta-model-hint (aria-describedby) 'In general words... no figures, client names or private table names', EN and AR (beta-page.js modelHint, stamp); test-0.3.0-claims PR1-S2 (red on 4ed057f first) |
| 3 | PRIVACY.md opens with two summaries | 0.3.2 | mcp/PRIVACY.md:12 'On one page' and :26 'In one paragraph'; improvement: keep one (the owner picks) |
| 4 | Check does not read GitHub release notes' SHA-256 | 0.3.2 | improvement: --live reads the release notes' SHA-256 and compares it with the .mcpb |
| 5 | SUPPORT.md and forms English; no Arabic SUPPORT page | 0.3.2 | no ar/SUPPORT page (ls); improvement: an Arabic SUPPORT page |
| 6 | Live site has no 'What's new in 0.3.1' yet | NOT-A-PROBLEM | on the integration branch: power-bi-mcp/index.html and beta-page.js carry 0.3.1's list; reaches main at the release |
| 7 | Base site run counted two fixture pages (485 vs 483) | NOT-A-PROBLEM | session event |

### RD1 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Title text boxes at x 24 while grid rows 16-1264: 8 px misalignment | 0.3.2 | rule kept (never move a text box or custom visual); improvement: the grid's side margin takes the title text box's x when the page has one |
| 2 | Counter can cut the stem hard: 'Gulf native redesigned 2' | 0.3.2 | redesign.mjs:56-61 fit(' ' + n) cuts the stem; improvement: cut fewer words or put the counter only on a cut name's end |
| 3 | Rows set below a band off the 8 step (91, 217, 473) | NOT-A-PROBLEM | exact gaps by design; Format pane numbers only |
| 4 | A whole taken name still refused 'rename or move it' | 0.3.2 | redesign.mjs:44 refused as before; improvement (the owner's call): a counter for a whole taken name too |
| 5 | NC1's Seen 1-5, 8, 9 unchanged by RD1 | FIXED-SINCE | 19f9467 (NC2) and 3057ee8 (R4A) fixed 1-5 and 9 (see NC1-S1..S5, S9); 8 is the consistentText option |

### SQ1 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | plan_layout's answer does not list visuals the writer leaves out; only create_report's does | 0.3.2 | plan_layout (and planLint) answer a leftOutVisuals list from the exact build, as create_report does (report-run.mjs:570-605 builds it; grep leftOutVisuals in plan_layout.mjs/plan-lint.mjs/approval-window.mjs: none) |
| 2 | stacked slicer slot (higher than wide) overflows its height, no height floor | FIXED-HERE-NEXT | still true: pbip-page.js:671-682 stacked branch has no drop loop (a 60 x 80 slot: second slicer at y 88). Not here: pbip-page.min.js's ?v= stamp lives in theme-generator.js (GD2's file) and it moves written positions (report, golden, layout suites); fix: the strip's drop loop for the stacked branch, about 8 lines + a check in test-0.3.1-sq1.mjs |
| 3 | slide-in filter panel's slicers have no width floor | NOT-A-PROBLEM | pbip-page.js:1203 sw = P.w - 2*pad: the panel is the design engine's own fixed-width panel, never a hand-placed slot, so a too-narrow width cannot be reached (as the note says) |
| 4 | report, core and website run-all together take over 30 minutes | NOT-A-PROBLEM | a session timing note; CI runs the suites in shards (.github/workflows/tests.yml jobs, scripts/tests/run-all.mjs SHARDS) |

### SQ10 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | formatReview names objects "T[c]" unescaped, so `only` may match two fields | 0.3.2 | still true: assets/js/model-health-tmdl.js:321 object = t.name+'['+o.name+']' (no ]] doubling), used as the `only` key from mcp/lib/fix-scripts.mjs:73; build the key with the escaped field key (Bind.fieldKey's rule) on both sides; only reachable with ']' in names |
| 2 | twin-model englishData and calendarSaid compare unescaped "T[c]" texts | NOT-A-PROBLEM | mcp/lib/twin-model.mjs:117 and mcp/lib/report-said.mjs:59 build both sides the same unescaped way, so the compare is consistent; calendar columns have fixed names |
| 3 | Gulf date questions remember a confirmed Hijri-year column for the model | NOT-A-PROBLEM | by design (remembered for the model in this session); informational |

### SQ11 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | adapter test's runner fixture fails under load (--timeout 3) | 0.3.2 | still true: scripts/test-results-adapter.mjs:92 runs the made-up suites with '--timeout', '3'; give the non-hanging fixture suites a longer limit (or only test-hang a short one) so test-fail.mjs is not read as crash under load |
| 2 | parity suite's B checks compare B and C, both from the same twin path | 0.3.2 | mcp/test-0.3.1-mirror-parity.mjs: add a B phone check against the English report's own mobile.json (mirrored), so a break of the shared twin path is caught by B too |
| 3 | BLOG-PLAN.md:98 says "All 16 website suites pass" | FIXED-SINCE | 0664c3e (SQ12): content/BLOG-PLAN.md:98 now "Every website suite passes (`node scripts/tests/run-all.mjs`)" |
| 4 | SEEN-QUEUE.md counts line not updated by the batches | NOT-A-PROBLEM | by design (batches write Status cells only, SEEN-QUEUE.md:24); mcp/work/SEEN-QUEUE.md:9 still "DONE 88 . OPEN 106", a dated snapshot that this sweep (ST1) recounts |

### SQ12 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | TESTS.md says "21 suites", a count that goes stale | NOT-A-PROBLEM | true today: mcp/docs/TESTS.md:35 "21 suites" and scripts/tests/run-all.mjs:19 ALL has 21 names |
| 2 | queue batch headings don't link notes; A1-agent-memory-S1 cites twin-pages.mjs:190 | NOT-A-PROBLEM | mcp/WORK.md:12 links every SQ note; the queue's evidence cell is a dated lead on a DONE item (comment now at mcp/lib/twin-pages.mjs:216, pointing at RULES-POWERBI.md as fixed in 0be6d43) |
| 3 | ROADMAP's "Where it is (2026-10-01)" snapshot sits at the top of a live file | 0.3.2 | still true: mcp/ROADMAP.md:3-7 (6 tools, 87 checks, 16 suites); move the snapshot to the archive and leave a one-line current pointer (the owner's call) |
| 4 | OWNER-RULES.md:43 names rule 9 for "Seen, not in scope"; it is rule 10 | FIXED-HERE | dab2d1e: OWNER-RULES.md:43 'rule 10'; check-agent-memory holds each 'rule N in mcp/CLAUDE.md' cite to its rule (red on 6e20ea3 first) |

### SQ13 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | plan-lint's in-memory build passes no chartAxes, so Arabic time charts keep English sort | STOP-GAP (GD2's) | plan-lint.mjs:66-68 builds without chartAxes: an Arabic plan's preview (no exact artifact) draws charts over time unmirrored; fix: pass chartAxes and the look options as report-run.mjs:308 does, about 3 lines + a check in test-0.3.1-sq13 |
| 2 | website layout canvas draws slots before the writer's fit; fitted pages only in Preview | STOP-GAP (GD2's) | the layout canvas (design-engine.js slots, page-preview.js) draws before the writer's fit; fix M-L: run the writer's fit after a slider stops and draw the fitted boxes (30-80 lines + a page-speed check) |
| 3 | S10's rail gaps (the owner's decision) | DUPLICATE-OF 0.2.9-writer-S10 | the same gaps (SEEN-QUEUE.md:193, sq13 S10): STOP-GAP there |

### SQ14 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | validator entry fetches schemas over network; PRIVACY/TOOLS silent | FIXED-SINCE | 26fc183: mcp/lib/check-report.mjs:370 and mcp/lib/artifact.mjs:55 call runReportValidation with skipSchema: true; mcp/PRIVACY.md:46-47 says the download is switched off and never called |
| 2 | Arabic day and Hijri month names still copied in four files | 0.3.2 | still true: assets/js/pbip-query.js:222-225, label-limits.js:26, calendar-generator.js:22-26, mcp/lib/shadow-model.mjs:26; read DAYS and HIJRI from assets/js/arabic-calendar.js (plus .min.js rebuilds) |
| 3 | lab matrix-mirror month list; generator's month select spells months as page text | NOT-A-PROBLEM | lab code is not shipped; the generator's <select> and its translations are page text (the language switcher's), not a data list |
| 4 | check-min cannot compare ?v= stamps in a shallow clone | NOT-A-PROBLEM | scripts/check-min.mjs:37-38 says "not compared" and goes on; CI checks out full history (tests.yml fetch-depth: 0, d91401a) |
| 5 | check_report has no finding for a visual bound to a missing measure | 0.3.2 | still true: no such rule in mcp/lib/check-report.mjs or assets/js/report-rules.js (only the field parameter note :486); add a general "field not in the model" finding (visual, field by name, fix in words) |

### SQ15a (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | TOOLS.md lacks read_model's kpis and read_report's drillLevel, images, decoration | FIXED-HERE | 96084e5: TOOLS.md read_model `kpis`, read_report `drillLevel`, `images`, decoration line; sq15a SQ15a-S1 (red on 13aa094 first) |
| 2 | bulletBar's notUsed line does not say a KPI target is an expression | FIXED-HERE-NEXT | still true: dax-functions.mjs:269 says only the names; fix: export kpiSaid (status-icons.mjs:39) and add it when a table measure's KPI target is an expression; needs a report fixture with a table for applyDax (about 4 lines + a 20-line fixture) |
| 3 | KPI status expression and graphic read but used nowhere | 0.3.2 | still true: only kpi.targetExpression is used (mcp/lib/model.mjs:573-594); a design could follow the model's own status (traffic light) on cards |

### SQ15b (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Metric page leaves its line chart out on a model.bim month sorted by a column | 0.3.2 | still true: mcp/lib/metric-switcher.mjs:50 takes date only for order own/model/number and :198 says "a month name without a sort column"; carry the month's sortBy from model.bim (or use the report's month-order measure) and say the real reason |
| 2 | check_report and read_report show isolates as code points | SF1 | by design today: mcp/lib/model.mjs:35 visible() writes invisible characters as code points; mcp/lib/check-report.mjs:6 and read-report.mjs:6 use it |
| 3 | plan-lint's Arabic lint answers hold the isolates in their titles | NOT-A-PROBLEM | informational: the planned titles follow Bidi V3 as the exact build does (same titles the report writes) |
| 4 | J18 laptop item 5 (isolates drawn as boxes) still open, now website download too | NEEDS-DESKTOP | open an Arabic report written by create_report and the website's Arabic download in Desktop: on each page, look at titles, tabs, card labels and tooltips for boxes or gaps where RLI/PDI/LRI sit; record the Desktop version and the count of boxes or gaps per page (0 expected) |

### SQ15c (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | no check in base shard 2 reads a group's offset through the product's reader | 0.3.2 | still true: mcp/test-0.3.1-mutation.mjs has no group-offset mutant (grep offset: none); add one (break the reader's group offset) with its guard suite |
| 2 | coverage report lists only engines a page loads | 0.3.2 | still true: scripts/coverage-web.mjs runs c8 over Chromium's records only; add the all-files option for assets/js so unloaded engines show 0 % |
| 3 | pages a site page opens itself are not recorded in coverage | NOT-A-PROBLEM | informational: coverage is recorded per test page (scripts/tests/lib.mjs); popups are a small share |
| 4 | Node-only website suites run without coverage | 0.3.2 | still true: svg-kpi, tmdl-model, github-links are not under c8 in scripts/coverage-web.mjs; run them under c8 node and merge the report |
| 5 | report-mirror.js reads 50.2 % lines under the website suites | NOT-A-PROBLEM | informational: its caller is the MCP's twin, covered by the MCP suites (test-0.3.1-mirror-parity.mjs and the twin suites) |

### SQ2 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | native copy's plan lines stay English on an Arabic page | NOT-A-PROBLEM | by design: plan lines are for Claude (English); the written report's texts follow the page's language (mcp/lib/native-copy.mjs:77) |
| 2 | a title from a measure is copied into every panel unchanged | 0.3.2 | still true: assets/js/visual-replace.js:177-181 tags only typed titles; for a measure title, add the panel's unit as a subtitle (the measure itself stays unchanged) |
| 3 | redesign's filesByteIdentical/filesChanged do not count the new .platform | 0.3.2 | still true: mcp/lib/redesign.mjs:641 counts from the original's files; the new .platform (:526) is not in filesAdded; count it there |
| 4 | visual-replace.js has no .min.js, no page loads it | NOT-A-PROBLEM | an MCP-only engine (mcp/lib/native-copy.mjs loads it); check-min covers the engines pages load, like aggregation.js and visual-gallery.js |

### SQ3 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | report page's rows stay English on an Arabic report's approval page | 0.3.2 | still true: headings are Arabic (mcp/lib/approval-window.mjs:236 HEAD_AR) but row words are English (:443, :453, :389); an Arabic word for each row label |
| 2 | quoted name «...» inside <bdi> shows guillemets in LTR order | NOT-A-PROBLEM | mcp/lib/approval-window.mjs:81 wraps «...» in <bdi>; « and » are Bidi_Mirrored, so «name» draws the same in an LTR isolate as in RTL (:285 puts them outside, same look); a glance on the laptop only if he wants |
| 3 | add_gulf_calendar and plan_layout edited here too; merge may meet | NOT-A-PROBLEM | a session merge note; SQ3, SQ7, SQ10 all merged into integration/0.3.1 |

### SQ4 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Arabic create_report binds "(Arabic)" calendar column; terminology sheet naming unverified | 0.3.2 | still unverified: pbip-bind.js:752-765 inAr; plan_layout.mjs:531 reads places from the exact files (the bound Arabic column), givenN keys by the English column; add a test on a model with the calendar script applied: the sheet names the bound column and a term given for the English one applies or is asked |
| 2 | a card's phone title not re-wrapped for a longer Arabic | STOP-GAP (GD2's) | report-mirror.js:513-525 labelMobile keeps the English phone title's wrap for a longer Arabic title; fix 15-20 lines (the writer's wrap rule at pbip-page.js:1330-1342) + a check in test-0.3.1-sq4; its callers twin-write/twin-copy are GD2's |
| 3 | phone copies equal to their page's text listed one by one in the plan | 0.3.2 | still true: mcp/lib/twin-plan.mjs:198-199 folds alt texts under titles but not phone copies; fold a phone text equal to its page's into one count (twin-plan.mjs OFF LIMITS now) |
| 4 | validator's 3 dropdown notes and 8 "labelled by title" | NOT-A-PROBLEM | known and unchanged, informational |

### SQ5 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | approval page problems list names a visual by type and box | 0.3.2 | still true: mcp/lib/plan-lint.mjs:155 one() keeps f.visual (type, title, box); use f.place as plain() does (:159), titles off (plan-lint.mjs OFF LIMITS now) |
| 2 | worth-a-look lines are English on an Arabic page | 0.3.2 | still true: mcp/lib/plan-lint.mjs:159 plain() and layout-check.js placeOf (:290-296) are English; Arabic words for page, place, what and fix |
| 3 | layout-check lint without titles:false quotes a visual's title in problems | DUPLICATE-OF SQ5-S1 | same fix: assets/js/layout-check.js:321 passes o.titles; plan-lint.mjs:149 checkFiles does not set titles: false, and :155 one() returns f.visual |
| 4 | two visuals in the same third of a page get the same place words | 0.3.2 | still true: assets/js/layout-check.js:294-296 thirds only; add an ordinal when two share a place ("the second card, top left") |

### SQ6 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | layout-check reads only the custom theme; base theme's label size never read | 0.3.2 | still true: assets/js/layout-check.js:215-217 reads customTheme only, labelSize falls back to 10; read the base theme (SharedResources/BaseThemes) as the fallback |
| 2 | zipDirectoryCheck and zipParts both open the .pbit and read its directory | 0.3.2 | still true: mcp/lib/model.mjs:423 and :426; one read of the directory serving both |
| 3 | v029g fixture reads a two-model folder by listing order | FIXED-SINCE | 41bd0da: mcp/test-0.2.9g.mjs:20 model(dir) names M.SemanticModel, and two models at one depth are refused (MANY_MODELS) |

### SQ7 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | queue and GC.md say Sharjah selfCheck flagged Sundays; it flagged Fridays | NOT-A-PROBLEM | history wording on a DONE item (SEEN-QUEUE.md:611 GC-S4, fixed f888207); corrected in mcp/work/SQ7.md; mcp/work/GC.md:189 still says "every Sunday" (closed job note, history only; optional one-word fix there and in SEEN-QUEUE.md:611) |
| 2 | generator's "Add Arabic name columns" note omits the label twins | FIXED-HERE | 4ed057f: the Calendar Generator's arabicNote (EN HTML, translations EN and AR, stamp) names the label twins it writes (Quarter (Arabic), Is Weekend (Arabic)...); gulf-calendar checks note and DAX, EN and AR (red on c1a6bd8 first) |

### SQ8 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | share image's URL has no ?v= | 0.3.2 | still true: 0 of 138 og:image tags carry ?v=; stamp the share image URL when its picture changes (social caches) |
| 2 | licensing guide p3 "creators need Pro in both setups" leaves out PPU | NOT-A-PROBLEM | articles/article-power-bi-licensing-guide.html:189: true of the two setups it compares (Pro for everyone vs F64 + Pro creators); PPU is not one of them |
| 3 | Fabric price link is Azure's page; figures read from the Retail Prices API | NOT-A-PROBLEM | same prices, machine-readable source; the linked page is the human one |
| 4 | guide's Copilot section does not say Qatar/UAE Central lack standalone Copilot | 0.3.2 | still true: the guide names Qatar Central and UAE Central only for Fabric regions (:213); one line in "What Copilot needs" (:200-204), EN and AR |
| 5 | Gulf article «العطلة الحكومية الرسمية» keeps "official" | NOT-A-PROBLEM | body text, not a headline (the rule is headlines), and sourced by its WAM link (assets/js/translations/article-gulf-calendar-power-bi.js:138) |
| 6 | make-share-images needs extra installs and CHROME_PATH (pw-browsers is a folder) | 0.3.2 | still true: scripts/make-share-images.mjs:228 picks /opt/pw-browsers/chromium (a folder); reuse scripts/tests/lib.mjs's browser launch (:61-69) |

### SQ9 (new since 639c42b3)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | large-model-caps test label "(60, the most it takes)" is stale (max 100) | FIXED-HERE | 62d3dac: large-model-caps label '60 of the 100 it takes' (a label: no test; no number changed) |
| 2 | PRODUCT_SPEC plan_layout Takes says "KPI cards (3-6)", no path/planFields | FIXED-HERE | 13aa094: PRODUCT_SPEC.md plan_layout row 'KPI cards (0-6; the layouts are made for 3-6)', path, planFields; test-0.3.0-claims reads the schema's range (red on dab2d1e first) |
| 3 | PRIVACY's one-paragraph summary says titles returned, not that read_report returns none | FIXED-SINCE | cde16cef (PR1): mcp/PRIVACY.md:19-21 "page names, text boxes; for the Arabic twin, titles too"; :70 read_report returns a title only from a measure |

### A1-agent-memory ([queue rows](SEEN-QUEUE.md#a1-agent-memory))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | code comments cite mcp/CLAUDE.md for rounds now in RULES-POWERBI | FIXED-SINCE | 0be6d43; pbip-page.js:524, twin-pages.mjs:216, twin-visuals.mjs:29, design-engine.js:391 now cite mcp/docs/RULES-POWERBI.md |
| 2 | plans, PRODUCT_SPEC, GOLDEN-TASKS, SEE-THE-RESULT cite mcp/CLAUDE.md | FIXED-SINCE | 0be6d43; GOLDEN-TASKS no cite left; PRODUCT_SPEC.md:4 and plans/CHECK-REPORT.md:168 cite it only as a historical source ('then') |
| 3 | ROADMAP private-repo list omits mcp/docs/ | FIXED-SINCE | 0664c3e; mcp/ROADMAP.md:218 lists mcp/docs/ and mcp/work/ |
| 4 | ARCHITECTURE.md near its 5,200 cap | FIXED-SINCE | 0664c3e (route c checklist moved to MODULES.md); ARCHITECTURE.md now 4,750 bytes vs cap 5,200 (scripts/check-agent-memory.mjs:24) |
| 5 | TOOLS.md rows are 400-2,900 char single lines | 0.3.2 | still true: longest mcp/TOOLS.md line 4,958 chars (was 3,186). 0.3.2: split TOOLS.md tool rows into per-tool paragraphs and update the suites that parse the rows |

### A1 ([queue rows](SEEN-QUEUE.md#a1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | pills fall back to dropdown on large model | NOT-A-PROBLEM | by design and said: approval-window.mjs:498 'a rounded dropdown for the others'; pills only when 2-6 values are known from metadata |
| 2 | Arabic twin without labels keeps English page names | DROP | code already does it: twin-texts.mjs:137 every page name is a text, :226-233 notTranslatedOf lists each Latin one with no label (kind 'page name'), approval-window.mjs:635 shows them; a laptop look adds nothing |
| 3 | build made from 1e07ad5, rebuild after merge | NEEDS-DESKTOP | builds are not in the repo. Laptop: in Claude Desktop, read the installed .mcpb's version and build commit; record both and the integration head (44d1f32) it should match |
| 4 | native copy and redesign keep a missing .platform missing | FIXED-SINCE | ed7d53e; native-copy.mjs:125-127 newPlatform when absent; redesign.mjs:526 adds .platform via newPlatform |

### A2 ([queue rows](SEEN-QUEUE.md#a2))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | website run-all/ci-sum does not fail 'PASS 0 checks' | FIXED-SINCE | 478d565; scripts/ci-sum.mjs:16 and :75 zero-checks problem on website PASS with no count |
| 2 | test.mjs alone prints every problem, capped via npm test | NOT-A-PROBLEM | informational, works as designed |
| 3 | fuzz check count differs Windows vs Linux | NOT-A-PROBLEM | ci-sum checks identities not counts (mcp/docs/TESTS.md:26) |
| 4 | TESTS.md says website has 13 suites | FIXED-SINCE | de403a2; mcp/docs/TESTS.md:35 '21 suites: ALL there' |
| 5 | CHANGELOG R3 'twin mirrors a waterfall' reads current | FIXED-SINCE | 0664c3e; mcp/CHANGELOG.md:258 '(superseded by D7: native is the default)' |
| 6 | README '19 website test suites' vs 20 | FIXED-SINCE | README.md:24 names ALL in scripts/tests/run-all.mjs, no count |
| 7 | mcp/package.json description lists 4 tools | FIXED-SINCE | 7653789; mcp/package.json:4 generic description, no tool list |
| 8 | beta page 'A real run' is 0.2.8 | DUPLICATE-OF 0.2.9-design-S11 | power-bi-mcp/index.html:189 and ar/power-bi-mcp/index.html:189 still 'Measured on 8 October 2026 with DataArcus 0.2.8' (dated, true as a measurement) |
| 9 | app prompt (elicitation) lacks 'Not checked before writing' | FIXED-SINCE | a6130f7 (SQ3); approval-window.mjs:118-119 promptSummary adds 'Not checked before writing' within PROMPT_SUMMARY_CAP |
| 10 | page's 'never returns data values' pinned only as text | FIXED-SINCE | 16c4389; mcp/test-0.3.0-approval-disclosure.mjs:79-81, :198 asserts made-up data values in hp never appear on the page |
| 11 | SKILL.md omits metric switcher, terms, gulfDates | FIXED-SINCE | 7653789; mcp/skills/report-design/SKILL.md:207 Metric switcher, :214 terms, :217 gulfDates (packaging copy too) |
| 12 | SKILL.md gallery limits vaguer than code | FIXED-SINCE | 7653789; SKILL.md:165 waterfall at most 12 members, :166 combo time/ordered axis, :169 small multiples at most 9 panels |

### A3 ([queue rows](SEEN-QUEUE.md#a3))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | create_report refuses repeated displayNames when plan pinned fixed-list name | FIXED-SINCE | fixed before SQ3, pinned by mcp/test-0.3.1-sq3.mjs:163-173 (A3-S1a other name refused, A3-S1b same names plus pinned fixed-list name written) |
| 2 | kept English names raw inside Arabic titles | FIXED-SINCE | 8ddfe11 (TT1 merge): a kept English name makes the whole title English, never mixed; pbip-export.js:550,579, pbip-page.js:806; mcp/test-0.3.1-tt1.mjs |
| 3 | twin/EN-AR keep English flip-card faces and switcher choices | 0.3.2 | still true, said as cannot: twin-plan.mjs:35,151. 0.3.2: an Arabic flip-cards and switcher script for the twin and EN-AR copy so faces and choices read Arabic |
| 4 | twin plan answer near 40,000 cap; textsFrom proposed | FIXED-SINCE | create_arabic_twin.mjs:47 textsFrom input; twin-plan.mjs:48-52 moreTexts paging |
| 5 | switcher chart projections carry no displayName | NEEDS-DESKTOP | metric-switcher.mjs:148 proj(first) still unnamed. Desktop: open a report with metricSwitcher, pick each metric; record the bar and line charts' axis/legend/tooltip label per metric (field parameter's label or the measure name) |
| 6 | health-project's own report not twinned in sweep | FIXED-SINCE | 67a17b8; mcp/test-0.3.0-arabic-sweep.mjs:51 F3 has own: health/Health Test Report.pbip |

### AF1 ([queue rows](SEEN-QUEUE.md#af1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | twin write nextSteps names pbip unscreened | FIXED-SINCE | 082860a; twin-write.mjs:119 uses pathOut(twinPbip); mcp/test-0.3.1-sq4.mjs:48 |
| 2 | L6 plan returns typed KPI/chart static titles; PRIVACY silent | DROP | the titles are of the new report DataArcus builds from the plan (dax-functions.mjs:277,284; report-run.mjs:402 applyDax on r.files), not read from a person's report; PRIVACY.md:97-98 stays true, nothing to say or drop |
| 3 | lens calendar names now cut with ellipsis past 40 | NOT-A-PROBLEM | informational change note |

### AF2 ([queue rows](SEEN-QUEUE.md#af2))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | TOOLS.md says create_report 'picks a free name' | NOT-A-PROBLEM | true: pbip-export.js:319 picks '<name> - New design' at plan time (measured in SQ9, mcp/work/SQ9.md:24,56); only a name taken after the go is refused |
| 2 | F06: folder-path race remains | NOT-A-PROBLEM | documented race, no cheap narrowing (AF1); informational |
| 3 | '(the same file check_model_health writes)' not always true | FIXED-SINCE | 4d3a1a6; plan_layout.mjs:219,481 'the same kind of script'; mcp/test-0.3.1-sq10.mjs:121-122 |
| 4 | identical existing script still listed as written in plan outputs | FIXED-SINCE | 4d3a1a6; report-run.mjs:419-422 named again, not written; mcp/test-0.3.1-sq10.mjs:8,117 |

### C ([queue rows](SEEN-QUEUE.md#c))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | approve_plan says 'create_report (from redesign)' | FIXED-SINCE | 7653789; mcp/lib/agent-text.mjs:33 SOURCE_OF redesign: 'plan_layout with redesignFrom' |
| 2 | tour asks Gulf date and shared-axes questions on sample | NOT-A-PROBLEM | informational, by design: J17 STRICT asks grain and scope before a plan id, sample included |
| 3 | read_model lists no relationships on the sample | NOT-A-PROBLEM | by design: read_model returns no relationship list; the health check counts them |

### C1 ([queue rows](SEEN-QUEUE.md#c1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Arabic Calendar Generator keeps Q1, FY, FQ, true/false | FIXED-SINCE | f888207; assets/js/calendar-generator.js:74 Arabic labels beside them; mcp/test-0.3.1-sq7.mjs:35-40 |
| 2 | calc columns on a DAX date table via TMDL unproven | NEEDS-DESKTOP | no DESKTOP-TESTS row for it. Desktop: apply the twin's month/calendar TMDL script to a model whose date table is a calculated (DAX) table; record Problems count, the new columns' presence and a refresh result |
| 3 | Day Name (Arabic) sorted by Weekday Number | NEEDS-DESKTOP | twin-model.mjs:95 sortByColumn kept. Desktop: apply the twin's calendar script, record Problems 0 and the order of Day Name (Arabic) in a table visual (Sun..Sat or Sat..Fri per weekday number) |
| 4 | headers show display names; field list shows '(Arabic)' | NOT-A-PROBLEM | informational, works as designed |

### D1 ([queue rows](SEEN-QUEUE.md#d1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | plan_layout cannot reach the waterfall yet (D2) | FIXED-SINCE | report-inputs.mjs:74 waterfallRtl input; plan_layout.mjs:75 passes it; mcp/test-0.3.0-gallery-reachable.mjs:8-9 (D2 in 0.3.0, before this clone's shallow history) |
| 2 | waterfall series names are fixed Arabic words | NOT-A-PROBLEM | by design and said in mirrors: visual-gallery.js:227 WF_WORDS are DataArcus's own series words, not a translation of the user's text |
| 3 | English quarter-text waterfall unsorted; Arabic sorted A to Z | NEEDS-DESKTOP | pbip-query.js:130-135 no sort written for a time text without sortBy. Desktop: English waterfall by a quarter text column; record the column order shown vs the Arabic twin's A to Z order |

### D2 ([queue rows](SEEN-QUEUE.md#d2))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | hand-placed pages: preview draws default design, not slots | FIXED-SINCE | plan_layout.mjs:366,441 previewOf(exact.files) draws the exact build (0.3.0 D5) |
| 2 | second page planned only via exact build; slots = page 1 | NOT-A-PROBLEM | by design: second page in gallery.slots and on the approval page |
| 3 | waterfall's own writer not touched | NOT-A-PROBLEM | informational routing note |

### D3 ([queue rows](SEEN-QUEUE.md#d3))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | phone header keeps 14pt; long Arabic title not shrunk | FIXED-SINCE | 082860a; assets/js/report-mirror.js:508 phone title size rule; mcp/test-0.3.1-sq4.mjs:93-96 |
| 2 | original 'Title:' measures stay unused in reportExtensions.json | NOT-A-PROBLEM | as the brief said: unused report-level measures, no visible effect |
| 3 | tab font: button's or theme's; writer measures report font | NOT-A-PROBLEM | informational, same font in practice |
| 4 | 3 PBIR_FORMATTING_OBJECT_UNKNOWN notes, 8 'labelled by title' | FIXED-SINCE | catalog 0.1.3 (U1): mcp/test-0.2.9-checks.mjs:110-123 no dropdown finding, no known note; check-report.mjs:160 gap entry |

### D4 ([queue rows](SEEN-QUEUE.md#d4))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | redesign never moves grouped, custom, tooltip-page visuals | NOT-A-PROBLEM | by design: redesign.mjs:9,283 'copied as it is, never moved or changed' |
| 2 | overlay's tabOrder and z copied as they are | NOT-A-PROBLEM | by design, original order kept |
| 3 | text-box-led unit: text box named changed, chart in overlays | NOT-A-PROBLEM | informational, describes the approval wording |

### D5 ([queue rows](SEEN-QUEUE.md#d5))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | packaging README Privacy: 'short titles, screened' stale since S1 | FIXED-SINCE | 7653789; mcp/skills-packaging/README.md:62-63 'page names and text boxes, never a static title' |
| 2 | plugin.json description names Microsoft's Power BI Report skill | CHOICE | plugin.json:5 still 'Works next to Microsoft's Power BI Report skill (the powerbi-authoring plugin)'. Question: keep naming Microsoft's skill in the public plugin description, or reword without the name? |
| 3 | beta page Requirements: Windows only, Claude Desktop; no other clients | FIXED-SINCE | 17f78ff; power-bi-mcp/index.html:214-216 one-click wording, beta.req.clients names Claude Code, VS Code, Cursor |
| 4 | home stat '11 tools' and FAQ silent on 0.3.1 | NOT-A-PROBLEM | true: index.html:515 '11 tools'; mcp/tools has 11 tool files |
| 5 | V1 tab cut and C tour date questions still open | DUPLICATE-OF V1-S1 | restates V1-S1 and C-S2 (C-S2 in this batch: NOT-A-PROBLEM) |
| 6 | lens fix texts name unread Desktop labels | DUPLICATE-OF W-S2 | arabic-lens.mjs:145 and :172 still name Desktop pane labels not read off Desktop |
| 7 | PRODUCT_SPEC Positioning and Tiers unchanged | CHOICE | PRODUCT_SPEC.md:133-136 marks repositioning 'the owner's decision, still open'; :150 Tiers. Question: which positioning by audience and which tiers text should PRODUCT_SPEC state? |
| 8 | table projects Plan Group twice, one at width 0 | NOT-A-PROBLEM | by design: assets/js/pbip-query.js:242-250 RTL total row label (Round 23), name column at width 0 |
| 9 | English measure titles in Arabic reports (R2 rule) | NOT-A-PROBLEM | TT1 (8ddfe11) rule: a kept English name makes the whole title English, never mixed; mcp/test-0.3.1-tt1.mjs |
| 10 | ops line chart labels may slant in Desktop | NEEDS-DESKTOP | page-preview.js:59,135 slant note still a rough rule. Desktop: T1b ops page 1 line chart (612 wide, 12 months); record slanted yes/no and the room per month at which it slants |

### D6 ([queue rows](SEEN-QUEUE.md#d6))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | theme page shows raw Inputs table above Colours | FIXED-SINCE | approval-window.mjs:650 Colours, :659 Inputs, :661 raw inputs folded (0.3.0 T1) |
| 2 | taken theme name: freeFile picks 'x 2', page silent | FIXED-SINCE | 20c888a; mcp/tools/generate_theme.mjs:82 the plan's name or nothing written |
| 3 | StaticResources/SharedResources themes grouped as Report settings | FIXED-SINCE | a6130f7; approval-window.mjs:91 THEME_FILE covers SharedResources/BaseThemes; mcp/test-0.3.1-sq3.mjs |

### D7 ([queue rows](SEEN-QUEUE.md#d7))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | report-design SKILL.md silent on waterfallRtl choice | FIXED-SINCE | mcp/skills/report-design/SKILL.md:115 names waterfallRtl native (default) and mirror |
| 2 | mirror waterfall gaps and '-' format display units unmeasured | NEEDS-DESKTOP | visual-gallery.js:228-234 mirror path unchanged. Desktop: Arabic report waterfallRtl 'mirror' beside a native waterfall; record gap between columns (px) for each and the data labels' display units with a '-' format |

### DS1 ([queue rows](SEEN-QUEUE.md#ds1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | MCP page hero, meta, facts say only 'Claude Desktop' | CHOICE | power-bi-mcp/index.html:17,22,32,116 'An AI agent in Claude Desktop' (true for the one-click path; :216 lists other clients). Question: name Claude Code, VS Code, Cursor in hero and meta, or keep the one-click wording? |
| 2 | homepage FAQ 7 says 'in Claude Desktop' | DUPLICATE-OF DS1-S1 | index.html:679 FAQ 7 one-click path wording |
| 3 | licensing guide: rest not re-checked against Learn | FIXED-SINCE | 0c69f68; every figure re-checked 26 Oct, EN and AR (mcp/work/SQ8.md:72-76), claims test SQ8 DS1-S3 |
| 4 | GitHub main links need public repo; anchor checked by eye | FIXED-SINCE | de403a2; scripts/tests/github-links.mjs checks each blob link's file and #anchor |

### E ([queue rows](SEEN-QUEUE.md#e))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | sitemap-lastmod --write moved stale earlier dates | NOT-A-PROBLEM | informational; the dates it moved were stale |
| 2 | Health Check size line: one Arabic plural for every count | FIXED-SINCE | f888207; assets/js/model-health.js:733-734 many() with 1, 2, 3-10, 11+ Arabic forms |
| 3 | Calendar Generator EN 'Calendar Table' vs AR 'date table' | CHOICE | tools/dax-calendar-table-generator.html:14 'Calendar Table' vs ar/...:13 'جدول التاريخ'. Question: one name for the tool in both languages (SEO 'calendar table' or Microsoft's 'date table')? |
| 4 | Desktop Arabic menus to confirm three 'to choose' terms | NOT-A-PROBLEM | settled: owner chose the terms 25 Oct (mcp/work/E2.md:20-29) |

### E2 ([queue rows](SEEN-QUEUE.md#e2))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Shopify AR title differs from listing card | NOT-A-PROBLEM | the card no longer quotes the title: ar/blog.html:529 card title is a different sentence; older articles left unchanged by E2's choice (E2.md:102) |
| 2 | Arabic count agreement '1 مرئيات', 'و45 مرئيًا' | DUPLICATE-OF E-S2 | fixed with it: f888207, assets/js/model-health.js:733-734 |
| 3 | Desktop's Arabic UI uses longer slicer/tooltip names | DROP | owner chose the short terms 25 Oct (mcp/work/E2.md:20-29); the MCP already glosses once, approval-window.mjs:238 '(Slicers)'; a second gloss on site pages adds little |

### F1 ([queue rows](SEEN-QUEUE.md#f1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | proof's own list of unproven items (tooltip scroll, header cut, ...) | NEEDS-DESKTOP | mcp/work/F1.md:144-147. Desktop: run each listed item (TOOLTIP_SCROLL, TABLE_HEADER_CUT, A11Y_TAB_ORDER, T2 total row label, faint gallery titles, text axis, phone layout) and record pass/fail per item |
| 2 | smallest pages: pill slot slicerH is 1 short of pillH | FIXED-SINCE | assets/js/pbip-page.js:555 Math.max(sh, pillH(SLICER_TEXT)) for pill slots (F2) |
| 3 | phone pills keep phone text 10, no header size | NOT-A-PROBLEM | by design: pbip-page.js:1325,1355 PHONE.slicer 10 for pills, phone layout kept as briefed |
| 4 | variants script needs data in Shop model slicer columns | FIXED-SINCE | mcp/lab/pills-variants.mjs:11,32 typed rows table (F2) |
| 5 | twin's mixed texts already isolated; isolateLatin on labels only | NOT-A-PROBLEM | informational: twin-texts.mjs:197 rawLabels isolateLatin; V3 isolation in pbip-export.js:565-579 |

### F2 ([queue rows](SEEN-QUEUE.md#f2))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | L5 Arabic icon at far left of wide right-aligned cell | NEEDS-DESKTOP | mcp/lib/status-icons.mjs:99 rtl still 'Before'. Desktop: Arabic table with statusIcons, wide rate column; record icon position (beside value or at the cell's far left) and the cell width |
| 2 | pills in top strip draw at 9pt, smaller than dropdowns' 15pt | 0.3.2 | still true: pbip-page.js:508 shrinks pill pt to the strip height. 0.3.2: a top strip tall enough for pills at the dropdowns' text size |
| 3 | phone pills keep phone text 10 and heights | DUPLICATE-OF F1-S3 | pbip-page.js:1325,1355 |

### F4 ([queue rows](SEEN-QUEUE.md#f4))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | columnPadding 0 may make pills touch | FIXED-SINCE | assets/js/pbip-page.js:536-537 columnPadding 6 between pills (F5) |
| 2 | variants page V0-V3 kept, second in order | NOT-A-PROBLEM | lab script only: mcp/lab/pills-variants.mjs:12 |

### F6 ([queue rows](SEEN-QUEUE.md#f6))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | pill slicer height at 9pt (65) is lower than at 8pt (66) | NOT-A-PROBLEM | informational, measured values by design: assets/js/pbip-sizing.js:113-118 (56 at 8-9pt + pillRoom 10/9 = 66/65) |
| 2 | pill heights not measured below 56 (8-9pt) and 72 (10-15pt) | NOT-A-PROBLEM | by design, smallest the grid offered, never a guess below: assets/js/pbip-sizing.js:111-112,118 |

### F7 ([queue rows](SEEN-QUEUE.md#f7))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | over 50 report fields to fix: plan lists 50 and says more | NOT-A-PROBLEM | cap by design: mcp/lib/fix-scripts.mjs:73 cap = maxItems \|\| 50, :93 more + scriptCovers |
| 2 | health plan lists maxItems fields while its script covers whole model | NOT-A-PROBLEM | reviewer: stays as it is (mcp/work/F7.md:61-62); scriptCovers said at mcp/lib/fix-scripts.mjs:93 |

### G1 ([queue rows](SEEN-QUEUE.md#g1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | sweep-s1 H1 message names package.json's test instead of tests.json | FIXED-SINCE | 478d565 (SQ11); mcp/test-0.3.0-sweep-s1.mjs:173 now 'every suite in mcp/tests.json' |
| 2 | 1-3 Oct archive open items never closed one by one | DROP | archive is frozen history (WORK.md: finished entries unchanged); its items done since: display names mcp/lib/display-names.mjs, sort-by finding in assets/js/model-health.js |
| 3 | archive README index long (154 lines) | NOT-A-PROBLEM | informational: mcp/work/archive/README.md 156 lines, an index read by search |
| 4 | SOURCE.md bundle commit af7b264 behind json-schemas head | NOT-A-PROBLEM | informational: mcp/schemas/SOURCE.md:4 names af7b264 and how to update (:17-19); no newer report schema named (upstream not reachable from this session) |
| 5 | localSettings schema neither bundled nor named in SOURCE.md | FIXED-SINCE | 0664c3e (SQ12); mcp/schemas/SOURCE.md:15-16 'Not bundled ... localSettings (1.0.0 upstream)' |

### GC ([queue rows](SEEN-QUEUE.md#gc))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Gulf calendar share image says 'right weekend for each country and year' | FIXED-SINCE | 0c69f68 (SQ8); scripts/make-share-images.mjs:207 new sub line; assets/img/og/gulf-calendar.jpg changed in 0c69f68 |
| 2 | 'Free' and 'Copy, paste, done' on generator page and site-wide | GAP, FIXED-HERE | c1a6bd8 (in the BD2-S1 commit by mistake, see Lessons): no title, og:title or h1 says free/first/only/official in 26 pages + 17 go/ links (go/ titles = their target's); scripts/tests/site.mjs checks every page as served and as shown, EN and AR (the static part red on 27 files first). Left: the generator's meta description 'Copy, paste, done. Free.' (not a headline: 0.3.2) |
| 3 | Egypt quick setup keeps fixed Friday + Saturday weekend | NOT-A-PROBLEM | by design, no sourced Egypt history: assets/js/calendar-generator.js:346 |
| 4 | Sharjah calendar self-check flags every Sunday as GC_WEEKEND | FIXED-SINCE | f888207 (SQ7); weekend 'shj' option mcp/tools/check_model_health.mjs:50,96,161; mcp/lib/gulf-calendar.mjs:18 |
| 5 | 'Is After UAE Weekend Change' written for UAE only, not Sharjah | FIXED-SINCE | f888207 (SQ7); assets/js/calendar-generator.js:133-134 'Is After Sharjah Weekend Change' |
| 6 | Arabic generator notes: «و» sits next to inline English column names | 0.3.2 | still true (assets/js/translations/calendar-generator.js AR weekendNote 'Is Weekend وIs Working Day', arabicNote, howto; only observedNote uses <bdi>): isolate English column names in the generator's AR strings (FSI/PDI, as BD1's rule), about 6 strings |

### GC2 ([queue rows](SEEN-QUEUE.md#gc2))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | article dateModified still 2026-10-03; published_time 09:00Z | FIXED-SINCE | 0c69f68; articles/article-gulf-calendar-power-bi.html:98 and ar :97 dateModified 2026-10-26; published_time :32 kept (owner's call) |
| 2 | article GitHub source links work only while repo is public | NOT-A-PROBLEM | informational: repo public today (gh api repos/Antnioo/DataArcus answers); links ar/articles/article-gulf-calendar-power-bi.html:152 |
| 3 | 'Book a Free Call' and 'the free ... Generator' in article | DUPLICATE-OF GC-S2 | still there: articles/article-gulf-calendar-power-bi.html:124,155,224,238 |
| 4 | AR p3 calls Umm al-Qura official without a linked source | FIXED-SINCE | 0c69f68 (SQ8); ar/articles/article-gulf-calendar-power-bi.html:151 and EN :151 link Microsoft Learn UmAlQuraCalendar |
| 5 | Is Eid al-Adha column 10-13 Dhu al-Hijjah vs u.ae 10-12 | CHOICE | still true: assets/js/calendar-generator.js:184,194 (10-13) while the article cites u.ae 10-12: align Is Eid al-Adha with u.ae (10-12) or say why 13 is kept, owner decides |

### I ([queue rows](SEEN-QUEUE.md#i))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | sitemap-lastmod --write in shallow clone gives wrong dates silently | FIXED-SINCE | 0c69f68 (SQ8); scripts/sitemap-lastmod.mjs:78-81 refuses a shallow clone |
| 2 | Arabic DP-600 results: '25–30%' weight placed by bidi rules | FIXED-HERE | dd0dcfa: dp600-sim.js:103,327 the weight in <bdi dir="ltr">; scripts/tests/tools.mjs I-2 'each area's weight in its own bdi', PL-300 and DP-600, EN and AR (red on fbd0132 first: 4 checks) |
| 3 | practice summary skill table bars blue, area rows green/amber | FIXED-SINCE | 0c69f68 (SQ8); assets/js/dp600-sim.js:454 bar(..., >= 0.7 ? 'good' : 'warn') |
| 4 | deny-scan.mjs needs the DENY_TERMS secret | NOT-A-PROBLEM | informational, runs in CI: .github/workflows/privacy.yml:4,37 |

### J17 ([queue rows](SEEN-QUEUE.md#j17))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | generator has no Sharjah weekend and no Friday half-day | FIXED-SINCE | shj option tools/dax-calendar-table-generator.html:209; half day out by design, said at :210 (history squashed, sha not in this shallow clone) |
| 2 | create_report Ramadan note finds Hijri-year column by name | FIXED-SINCE | 4d3a1a6 (SQ10); mcp/lib/report-run.mjs:101-105 plan's hijriYear column first |
| 3 | Hijri month visual needs the model's sort-by column | NOT-A-PROBLEM | informational, said in the plan (gulfDates grain order) |
| 4 | Gulf date answers forgotten when session ends | DUPLICATE-OF J18-S5 | still in memory: mcp/lib/gulf-date-questions.mjs:32,217 CONFIRMED array; answers file mcp/lib/answers.mjs holds only health-check answers |
| 5 | full npm test took over 30 minutes in one process | NOT-A-PROBLEM | informational run-time note |

### J18 ([queue rows](SEEN-QUEUE.md#j18))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | twin plan answer 37,018 chars, near the 40,000 cap | SF1 | answer cap in force: mcp/lib/answer.mjs:25 ANSWER_MAX 40000, cut and said at :63 |
| 2 | website Arabic download does not isolate Latin runs | FIXED-SINCE | 850593d (SQ15b); assets/js/pbip-export.js:530 isolateFiles(..., { all: true }) for lang ar; rule V3 in assets/js/text-measure.js:41-54 |
| 3 | check_report/read_report show isolates as code points | NOT-A-PROBLEM | by design: control characters screened and shown as code points (SF1's rule), informational |
| 4 | Arabic month column swap names it, not the English term's column | NOT-A-PROBLEM | SQ4: the twin never swaps a column; its sheet names what its pages bind (mcp/work/SQ4.md, J18-S4a) |
| 5 | confirmed terms forgotten when session ends | 0.3.2 | still true: mcp/lib/terminology.mjs:114,138 CONFIRMED in memory only: persist confirmed terms and Gulf date answers in the answers file (mcp/lib/answers.mjs) through its approved write, owner decides |

### J19 ([queue rows](SEEN-QUEUE.md#j19))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | native copy panel axis unit in English in Arabic report | FIXED-SINCE | dc73503 (SQ2); mcp/lib/native-copy.mjs:77 page language, mcp/lib/visual-meaning.mjs:697 Arabic unit labels |
| 2 | sharedAxes answers not kept in the answers file | 0.3.2 | still true: mcp/lib/report-fields.mjs:189 per plan only: record confirmed sharedAxes pairs in the answers file with J18-S5's change |
| 3 | packaging must carry axis-units, field-meaning, confirm-memory engines | NEEDS-DESKTOP | laptop/engine build: unzip the built .mcpb, record that assets/js/axis-units.js, field-meaning.js, confirm-memory.js (or .min) are in it; CI checks literal paths only (.github/workflows/tests.yml:47-48) |
| 4 | twin and redesign copy user's visuals, secondary axis included | NOT-A-PROBLEM | informational, copies keep the user's visuals by design |
| 5 | native copy panels each keep the custom visual's one title | FIXED-SINCE | dc73503 (SQ2); assets/js/visual-replace.js:177-178 titleTag adds the panel's unit |
| 6 | FSI/PDI around ISO code in axis title not seen in Desktop | NEEDS-DESKTOP | open an Arabic report with an AED axis title (assets/js/axis-units.js isolate): record whether the code and number read in the right order, and any visible box/marks |

### K1 ([queue rows](SEEN-QUEUE.md#k1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | plugin shows 0 servers; Configure only via /plugin; no website line | 0.3.2 | still true: no site page names the plugin; mcp/skills-packaging/README.md:23: once the public marketplace repo is live, add the plugin's install and Configure line to the MCP page (EN and AR) |
| 2 | local-folder marketplace writes untracked .mcpb-cache/ | FIXED-HERE | c11eb9a: root .gitignore lists .mcpb-cache/; test-skill-packaging checks it and its 8-file count skips the cache (red on 596c12e first) |
| 3 | bundle is win32 only; macOS untried | NEEDS-DESKTOP | on a Mac: install the .mcpb, record whether the server starts and read_model answers; then decide manifest platforms (WORK.md keeps win32) |
| 4 | Microsoft's plugin starts its MCP unpinned (@latest) | CHOICE | still true: mcp/skills-packaging/.claude-plugin/marketplace.json:16-18 hard dependency powerbi-authoring: decide optional dependency or accept unpinned (not ours to pin) |
| 5 | mcp/package.json says 0.1.0 | FIXED-SINCE | mcp/package.json:3 '0.3.1' (sha before this shallow clone) |
| 6 | Copilot 'Agent Plugins 1.0' format not used | 0.3.2 | still true: only mcp/skills-packaging/plugins/dataarcus/.github/plugin/plugin.json (legacy): add root plugin.json/mcp.json in the 1.0 format when Copilot drops legacy |
| 7 | no APM manifest for Cursor, Windsurf, Codex, VS Code | CHOICE | still true: mcp/skills-packaging holds Claude and Copilot manifests only: pick which other clients get a manifest |
| 8 | draft PR #85 to close once K1 merges | FIXED-SINCE | gh api repos/Antnioo/DataArcus/pulls/85: state closed, merged false |
| 9 | engine build may pack skills-packaging into the .mcpb | NEEDS-DESKTOP | engine repo on the laptop: list the built .mcpb files, record that none is under mcp/skills-packaging/ |

### K2 ([queue rows](SEEN-QUEUE.md#k2))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | bilingual plan lacks the 'Not fully Arabic' line | FIXED-SINCE | 4d3a1a6 (SQ10); mcp/tools/plan_layout.mjs:91,566 notFullyArabic; mcp/lib/approval-window.mjs:536 |
| 2 | twin-write.mjs imports unused 'out' | FIXED-SINCE | mcp/lib/twin-write.mjs:3-13 imports no answer.mjs/out (75bfd6e Q1) |

### L1 ([queue rows](SEEN-QUEUE.md#l1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Arabic lens's Desktop setting names not read off the Format pane | NEEDS-DESKTOP | same as W-S2: in Desktop open Format pane for title, slicer, table; record each setting name the lens quotes (mcp/work/L1.md 'For the laptop' 3) as Desktop shows it |
| 2 | twin of (a) shows Month in English; the lens says so | NOT-A-PROBLEM | informational: lens rule CALENDAR_VALUES mcp/lib/arabic-lens.mjs:66,70 |
| 3 | RTL_MIRROR counts slicer headers as titles | NOT-A-PROBLEM | a slicer header is its PBIR title; rule mcp/lib/arabic-lens.mjs:105-107 |
| 4 | matrix on twin is 'no setting' until M1's variant | NOT-A-PROBLEM | lens imports MATRIX_SAID mcp/lib/arabic-lens.mjs:21,157; variant is M1's open decision (WORK.md) |
| 5 | English pages listed 'to be twinned' even if staying English | NOT-A-PROBLEM | informational: the summary says 'No Arabic pages yet' first (arabic-lens.mjs) |
| 6 | server instructions at 2,195 of 2,200 characters | DUPLICATE-OF 0.2.9-reader-S5 | measured today: instructions(LIMITS).length = 2195, cap mcp/lib/agent-text.mjs:9 2200; WORK.md decision: new behaviour in tool descriptions |
| 7 | check_report and lens repeat RTL_MIRROR titles | NOT-A-PROBLEM | one source, two answers: arabic-lens.mjs:107 reads the same RTL_MIRROR rule |

### L2 ([queue rows](SEEN-QUEUE.md#l2))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | 'few' count over-counts texts compared in SWITCH | FIXED-SINCE | 1ebff20 (SQ13); assets/js/pbip-bind.js:469-474 counts only IF branches and SWITCH results |
| 2 | axis-label grey option not built | 0.3.2 | still true: axis labels always theme secondary grey (assets/js/design-engine.js:593-597), no option: add an axis-label grey choice (lab 4.7-6.0:1 on white), owner decides |
| 3 | Desktop's button-slicer title size not measured | NEEDS-DESKTOP | laptop: button slicer at 10pt and 15pt text, record the title's drawn size and whether it cuts with '…' |

### L3 ([queue rows](SEEN-QUEUE.md#l3))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Metric page bar chart may cut names; no Top N | 0.3.2 | still true: mcp/lib/metric-switcher.mjs has no TopN filter (bar chart :125,143): add a Top N filter to the field-parameter bar chart, proved on the laptop first |
| 2 | switch measures may be unrelated to the category/month axes | FIXED-SINCE | 850593d (SQ15b); mcp/lib/metric-switcher.mjs:56-67 reachTable per measure and axis |
| 3 | no navigation button to Metric page; no phone layout | 0.3.2 | still true: mcp/lib/metric-switcher.mjs writes no button or mobile.json: give the Metric page a navigation button and a phone layout |
| 4 | L2 pill slicerStyle not on the Metric page | NEEDS-DESKTOP | slicer still Basic list (mcp/lib/metric-switcher.mjs:144); grid done :160: in Desktop, a Metric page with pill slicerStyle, record whether single-select and the first-metric filter work |
| 5 | create_report description long; agent-text, SKILL.md unchanged | NOT-A-PROBLEM | informational |

### L4 ([queue rows](SEEN-QUEUE.md#l4))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | validator findings quote report names in 'what' | FIXED-SINCE | mcp/lib/check-report.mjs:46 scrub, :381,384 (0.3.0 S1 B-211, fab795c) |
| 2 | separate twin's flip card faces stay English | DUPLICATE-OF L6-S1 | mcp/lib/twin-plan.mjs:136-138 flip faces are model picture measures, said as cannot |
| 3 | flip card front uses K/M/B in Arabic | FIXED-SINCE | mcp/lib/flip-cards.mjs:35,38 UNITS_AR for ar (0.3.0 A3) |
| 4 | back's YoY needs the measure table related to the date table | NOT-A-PROBLEM | informational, told in the answer |
| 5 | image.fit Fit and dataCategory ImageUrl not in the lab JSON | NEEDS-DESKTOP | laptop: a flip card with Fit and ImageUrl, record the image fit setting and the column's data category as Desktop saves them |

### L5 ([queue rows](SEEN-QUEUE.md#l5))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | model KPI (TMSL kpi) not read as a target | FIXED-SINCE | 7f8275e (SQ15a); mcp/lib/status-icons.mjs:38-42 kpiTarget |
| 2 | Way C has two states, no warning band | DROP | by design: no threshold guessed (mcp/lib/status-icons.mjs:9-10); the warning band exists with user thresholds (Way E, :6-7) |
| 3 | Arabic icon placement 'Before' not proven | NEEDS-DESKTOP | laptop: Arabic table with status icons, try the other placement, record which side the icon draws on |
| 4 | new card, slicers, KPI cards get no status icon | NEEDS-DESKTOP | laptop lab: icons on new card, slicer and KPI visual, record which accept the theme's icons |
| 5 | View > Themes import of a theme with icons unproven | NEEDS-DESKTOP | laptop: import a website theme with icons via View > Themes, record whether daGood/daWarn/daBad appear |
| 6 | validator findings quote report names | DUPLICATE-OF L4-S1 | fixed: mcp/lib/check-report.mjs:46,381 scrub |

### L6 ([queue rows](SEEN-QUEUE.md#l6))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | twin/bilingual Arabic half show DA pictures in English | CHOICE | still true, open owner decision in mcp/WORK.md (L6 Seen 1): a second, Arabic set of DA measures (a model script) for the twin and the bilingual Arabic half |
| 2 | KPI card picture keeps Latin K/M/B in Arabic | FIXED-SINCE | 486d97d (SQ2); mcp/lib/dax-functions.mjs:155,158 UNITS_AR when lang ar |
| 3 | #82's Seen 2-8 still stand | DUPLICATE-OF L6-S7 | restated as L6-S7..L6-S13, each checked in its own row |
| 4 | daxFunctions with sample or redesignFrom ignored silently | FIXED-SINCE | 4d3a1a6 (SQ10); mcp/tools/plan_layout.mjs:114 options listed for a redesign, :353-357 |
| 5 | Learn glossary calls UDFs a preview | NOT-A-PROBLEM | external page; our texts guarded mcp/test-0.3.1-dax-functions.mjs:263 |
| 6 | Arabic twin keeps DA measures in English | DUPLICATE-OF L6-S1 | same open decision |
| 7 | story title replaces the 'Top N of M:' title | NOT-A-PROBLEM | informational: static title kept as alt text |
| 8 | picture rows (32 high) may leave a part row | NEEDS-DESKTOP | laptop: a table with picture measures, record whether a part row shows above the total |
| 9 | bullet bar scale is per row | NOT-A-PROBLEM | by design: progress against each row's own target |
| 10 | approval preview draws picture measures as placeholders | NOT-A-PROBLEM | metadata only: the preview has no DAX values, so a placeholder box is what can be drawn |
| 11 | DAX_MEASURE_PENDING matches by name suffix | FIXED-SINCE | b2c7670 (SQ14): note only for a measure the script next to the project declares |
| 12 | KPI card font sizes not measured in Desktop | NEEDS-DESKTOP | laptop: KPI card picture at two heights, record the drawn font sizes |
| 13 | one image size for sparkline and bullet bar | NEEDS-DESKTOP | laptop: bullet bar 120x20 in a 120x30 Fit box, record whether it reads well (no squash, no clip) |

### M1 ([queue rows](SEEN-QUEUE.md#m1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Twin switches text-box panels off on Arabic pages; create_report keeps them | STOP-GAP (GD2's) | twin-pages.mjs:214-235,307 textPanelsOff: the Arabic pages lose the text box panels the English pages keep; fix about 15 lines (twin-pages, twin-plan.mjs:209 note, parity KNOWN.textPanel); R1 item 4 (a real user's report) brought the switch-off in: the owner confirms 'kept' |
| 2 | Twin mirrored table reverses columns, total row loses "Total" | STOP-GAP (GD2's) | the twin reverses a table's columns, the total row loses 'Total' (measured round 10); fix M (40-60 lines): the writer's right-to-left table (pbip-page.js:979,1029 rowLabelDax, hidden first column) in the twin; a laptop check first |
| 3 | Twin passes only date columns as continuous; number axes stay left to right | STOP-GAP (GD2's) | twin-model.mjs:28,53 only date columns continuous: a whole-number continuous axis stays left to right in the twin while create_report reverses it; fix 5-10 lines + a parity check; measure in Desktop first |
| 4 | Narrow Arabic slicer slot gave negative slicer widths | FIXED-SINCE | f026240 (SQ1): assets/js/pbip-page.js:668-677 SLICER_MIN 24, Reset then slicers left out and told |
| 5 | Parity suite skipped mobile.json and Reset formatting | FIXED-SINCE | b8ee323 (SQ11): mcp/test-0.3.1-mirror-parity.mjs:16,253-256 mobileShape/mobileAt and Reset compared |
| 6 | Matrix column data cut at Power BI top 100 columns | NOT-A-PROBLEM | Power BI's own dataViewMappings limit; informational, nothing DataArcus writes |
| 7 | R1's plain matrix sentence stays as it is | NOT-A-PROBLEM | informational: MATRIX_SAID mcp/lib/twin-plan.mjs:26, used :132; no action proposed |

### P1 ([queue rows](SEEN-QUEUE.md#p1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | npm test && chain hid later scripts' results | FIXED-SINCE | mcp/run-tests.mjs:9,98 --keep-going (G1 a9436b3, before the shallow clone); CI .github/workflows/tests.yml:206,370,447 uses it |
| 2 | 0.3.0 CHANGELOG section has 38 lines with internal codes | NOT-A-PROBLEM | by design: scripts/changelog-words.mjs:1-3 checks [Unreleased] only; older versions are history |
| 3 | macOS NFC/NFD branch missing from run log | FIXED-SINCE | mcp/test-platform-paths.mjs:78 fsSays, :128 printed on the result line (5ed4758, before the shallow clone) |

### P7 ([queue rows](SEEN-QUEUE.md#p7))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Size Band values stay English in Arabic report | NOT-A-PROBLEM | data values of the model; DataArcus never translates or reads them; only the calendar has Arabic twins (C1) |
| 2 | Latin product name inside a pill cannot be isolated | NOT-A-PROBLEM | a model data value drawn by Power BI, not a DataArcus text; Bidi V3 covers texts DataArcus writes |

### Q1 ([queue rows](SEEN-QUEUE.md#q1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | T1 mutation test is linted, 0 findings | NOT-A-PROBLEM | informational; package.json:11 lint covers mcp |
| 2 | HTML pages' inline scripts not linted | FIXED-SINCE | de403a2 (SQ11): eslint.config.mjs:6,67-72 eslint-plugin-html on **/*.html; package.json:11 |
| 3 | Two Arabic month lists (arabic-calendar, pbip-query) | FIXED-SINCE | 7f611fa (SQ14): assets/js/pbip-query.js:219-220 reads arabic-calendar MONTHS; mcp/lib/shadow-model.mjs:24 too |
| 4 | R5 planted titles never reach the report; check proved less | FIXED-SINCE | mcp/test-0.2.9i.mjs:145-150 checks the report's real titles are absent from check_report (Q1 T-4, 05f55b0 before the shallow clone) |
| 5 | calendar-generator.js 40% unrun; no website suite coverage | FIXED-SINCE | 1ae5f7d (SQ15c): website suites' Chromium coverage report, CI job beside .github/workflows/tests.yml:246-288 |
| 6 | Tahoma header title 20pt in 46-high box trips validator floor | NEEDS-DESKTOP | still true: assets/js/pbip-page.js:712-713 size from header height, no Tahoma case. In Desktop: a Tahoma-theme report header title 20pt bold in 46-high box: scrollbar or cut? record box height and smallest height without scrollbar, then 48-high box or 18pt |
| 7 | Twin plan needs 2-3 calls; 42 alt texts repeat titles | FIXED-SINCE | 082860a (SQ4): mcp/lib/twin-plan.mjs:195-201 alt text equal to its title listed under it (altTextToo) |
| 8 | plan_layout flipCards.cards repeated each card per page | FIXED-SINCE | 4d3a1a6 (SQ10): mcp/tools/plan_layout.mjs:554-557 cards once each with a pages list |
| 9 | suggest_fields 60 tables vs read_model 100 | FIXED-SINCE | 7653789 (SQ9): one constant in mcp/lib/tool-limits.mjs:15 |

### R1-see-the-result ([queue rows](SEEN-QUEUE.md#r1-see-the-result))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Planned-report shadow has no .platform file | DROP | research only: shadow-model.mjs used by mcp/research/shadow-try.mjs and tests only, no tool writes a shadow; create_report adds .platform on write. Laptop step stays in SEE-THE-RESULT.md if shadows ever ship |
| 2 | Health fixture _Measures shadow gets 120 made-up rows | NOT-A-PROBLEM | harmless, research prototype only (no tool uses lib/shadow-model.mjs) |
| 3 | Plan slots score 0.15-0.50 against the written pages | NOT-A-PROBLEM | SQ13 fced479 verified: approval page draws the exact artifact's files; website Preview draws the download; only designer canvas/PNG/CSV draw slots (assets/js/theme-generator.js:360,400,480), as their downloads are |
| 4 | Power Query shadow needs refresh; bridge has no refresh | DROP | not worth deciding now: research only: mcp/research/SEE-THE-RESULT.md; no tool uses shadows; decide only if shadows ship |

### R1 ([queue rows](SEEN-QUEUE.md#r1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | check_report read the whole EN-AR copy as one language | FIXED-SINCE | mcp/lib/check-report.mjs:250 pageLanguages per page, :283-287 (24c8387 S1, before the shallow clone) |
| 2 | Writer reading order and check_report inversions disagreed on tall visual | FIXED-SINCE | 11a85ab (SQ5): assets/js/report-a11y.js:160 a pair counted only when readingOrder also inverts it |
| 3 | Arabic Detail title 45 chars at 24pt cannot fit | NOT-A-PROBLEM | by design: the plan asks for a shorter Arabic text; DataArcus never shortens silently |
| 4 | Matrix/table at 14pt show fewer rows | NOT-A-PROBLEM | informational: now a note; English pages keep the user's sizes |
| 5 | Fixture visuals have no alt text | NOT-A-PROBLEM | the user's own report; not the twin's to add |
| 6 | Validator slicer/textbox floors differ from SLICER_FITS, TEXTBOX_FITS | NEEDS-DESKTOP | still: assets/js/report-rules.js:143-144 TEXTBOX 10+1.8 x pt, :207-208 SLICER 16+4 x pt. In Desktop: a 60-high dropdown slicer and a 32-high one-line text box at the report sizes: header cut or scrollbar? record the smallest heights that draw whole |
| 7 | Power BI default table/matrix word wrap not measured | NEEDS-DESKTOP | assets/js/layout-check.js:121 treats wordWrap !== true as off. In Desktop: new table and matrix, Format > Values/Column headers: record the Word wrap default of each |

### RB ([queue rows](SEEN-QUEUE.md#rb))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | T1 Seen 2 defence in depth kept | NOT-A-PROBLEM | informational (RB Decisions 1); mcp/work/RB.md:163 |
| 2 | T1 Seen 3: four parts got fast checks | NOT-A-PROBLEM | informational: nothing open (mcp/work/RB.md:165) |
| 3 | Older T1 0.3.0 Seen lines are wording items for owner | DROP | nothing left to decide: each has its own queue row (T1-S6 to T1-S14, checked in this batch: 6 fixed, rest informational or laptop) |
| 4 | Rollback window between last check and unlink remains | DROP | accept as known risk, cannot be closed: Node has no unlink by handle; mcp/lib/write-io.mjs:132-133 hash check then unlink narrows it to that instant |
| 5 | T1.md mutant table still says W-size killed by S2c | FIXED-SINCE | 0664c3e (SQ12): mcp/work/T1.md:195 "Since RB" line points to RB.md |
| 6 | ARCHITECTURE write path could say content-checked removal | FIXED-SINCE | 0664c3e (SQ12): ARCHITECTURE.md:25-26 "removes only what it created, while its content is what this call wrote" |

### S1 ([queue rows](SEEN-QUEUE.md#s1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Server instructions near the 2,200 cap | DUPLICATE-OF 0.2.9-reader-S5 | measured today: instructions(LIMITS).length 2195 of INSTRUCTIONS_MAX 2200 (mcp/lib/agent-text.mjs:9); WORK.md: new behaviour goes in tool descriptions |
| 2 | report-design skill and README lacked rule 7 | FIXED-SINCE | 7653789 (SQ9): mcp/skills/report-design/SKILL.md:224, packaging copy too, mcp/README.md:79 |
| 3 | Microsoft validator's own writes not read by write gate | FIXED-SINCE | 070ee85 (SQ14): mcp/test-0.3.1-write-gate.mjs:11-12,175-181 W5-W7 read the validator's modules |
| 4 | Golden EN-AR tooltip pages get TOOLTIP_SCROLL note | NOT-A-PROBLEM | informational, there before S1; the rule now uses measured rows (11a85ab SQ5) |
| 5 | arabicCopy remakes whole copy; hand edits lost | NOT-A-PROBLEM | by design (never over a file); said in its how |
| 6 | No Desktop step needed | NOT-A-PROBLEM | informational |
| 7 | read_report returns a short text box as typed | SF1 | still: mcp/lib/read-report.mjs:416 x.text = safeText(tx), :23 screens instruction and length only; mcp/PRIVACY.md:70 says a short text box (figure, name) goes to the AI app. Same as R7-claims N1 |
| 8 | SCHEMA finding pointer kept plain-word segments | FIXED-SINCE | b2c7670 (SQ14): mcp/lib/check-report.mjs:105 pointer keeps only schema words and indexes, others "…" |
| 9 | "Last N months: measure" helper could mix scripts | FIXED-SINCE | f026240 (SQ1): assets/js/pbip-query.js:416 latinOnly fallback to "Last N months" |
| 10 | Fuzz 8199 checks Linux vs 8226 Windows | NOT-A-PROBLEM | informational |

### S9 ([queue rows](SEEN-QUEUE.md#s9))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | MONTHS_AR declared unused; month test passed on that line | FIXED-HERE | 596c12e: twin-model.mjs declares no MONTHS_AR; test-0.2.9i 'the twin declares no MONTHS_AR of its own' (red on e25c25b first) |
| 2 | Unused imports in original files | FIXED-SINCE | dropped by S9's move: no summary import in mcp/server.mjs; no inside/writeNew/WITHHELD/isDir in lib/arabic-twin.mjs, lib/twin-*.mjs |
| 3 | approval-window.mjs, check-report.mjs over/near 60 KB | 0.3.2 | now 89,209 and 62,492 bytes (wc -c): split approval-window.mjs's Arabic texts and its page render into their own modules, check-report.mjs's rules from its runner, behaviour unchanged |
| 4 | Same module imported in two statements | FIXED-SINCE | 4d3a1a6 (SQ10): mcp/lib/report-run.mjs:19 one files.mjs import; plan_layout.mjs one arabic-twin.mjs import |

### T1 ([queue rows](SEEN-QUEUE.md#t1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Rollback identity fooled by inode reuse | FIXED-SINCE | mcp/lib/write-io.mjs:107,132 sameBytes content hash before removal (RB 4a40003, before the shallow clone) |
| 2 | Defence in depth no tool reaches | NOT-A-PROBLEM | informational; kept as equivalent (RB.md:163) |
| 3 | Some behaviour guarded only by test.mjs parts | NOT-A-PROBLEM | T1 gave each a fast check (RB.md:165) |
| 4 | Golden baseline differs under parallel workers | FIXED-SINCE | mcp/test-0.3.1-mutation.mjs:156-157 copy holds scripts/gulf-calendar, the cause of the 6 differences (RB 932f61b, before the shallow clone) |
| 5 | Known-gap path dead with today's catalog | FIXED-SINCE | mcp/test-0.3.1-validator-gap.mjs, registered mcp/tests.json:112 (RB fe96c24) |
| 6 | Arabic approval page: writes lines and row texts stayed English | FIXED-SINCE | a6130f7 (SQ3): mcp/lib/approval-window.mjs:277-280,413-415 writesAr; mcp/tools/create_arabic_twin.mjs:69-70; test-0.3.1-sq3.mjs T1-S6a/b |
| 7 | Worth-a-look named visual by type and box | FIXED-SINCE | 11a85ab (SQ5): assets/js/layout-check.js:88-91,290 placeOf plain place words |
| 8 | Twin plan said "0 Arabic texts as approved" before approval | FIXED-SINCE | a6130f7 (SQ3): mcp/tools/create_arabic_twin.mjs:62; test-0.3.1-sq3.mjs:5 |
| 9 | Arabic heading kept English count words | FIXED-SINCE | a6130f7 (SQ3): mcp/lib/approval-window.mjs:240-245; test-0.3.1-sq3.mjs:6 |
| 10 | Judge's unplanned slicer not reproduced | NEEDS-DESKTOP | not reproducible on fixtures; if a tester sees it: record that model's plan_layout answer and the written page's visuals (type, box) to find the slicer |
| 11 | One Arabic term per concept (E1 F-4) | FIXED-SINCE | grep: no "عوامل التصفية" or "مواعيد" in assets/js/*.js (non-min), mcp/lib, mcp/tools (job E 7893922) |
| 12 | suggest_fields off target on large-synthetic | NOT-A-PROBLEM | the fixture model has no revenue or cost measures |
| 13 | Twin Options rows and "About the script" quote English | FIXED-SINCE | a6130f7 (SQ3): mcp/lib/approval-window.mjs:624 Arabic Options rows; test-0.3.1-sq3.mjs:7 |
| 14 | Saudi Ramadan/Eid dates missing from gulf-dates.js | NOT-A-PROBLEM | scripts/gulf-calendar/DATES-SOURCES.md:58 KSA 2018-2026 sourced, same days as UAE |
| 15 | Laptop items: aea6d74, clean-up script, stash, items 8, 10 | NEEDS-DESKTOP | laptop-only state, not in this tree: on the laptop drop or push aea6d74, run the clean-up script, drop the stale stash, finish items 8 and 10; record each done in T1.md |

### U1 ([queue rows](SEEN-QUEUE.md#u1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Microsoft validator ignores literal kind (eight) | NOT-A-PROBLEM | Microsoft's limit; pinned mcp/test-0.2.9-checks.mjs radiusText |
| 2 | reportThemeSchema-2.159 not strict JSON schema | NOT-A-PROBLEM | DataArcus does not validate themes against it |
| 3 | Microsoft What's new and change log lag | NOT-A-PROBLEM | Microsoft's pages, informational |
| 4 | D5 ran on Desktop 2.159 without build number | NEEDS-DESKTOP | scripts/tests/DESKTOP-TESTS.md:2468 says "2.159"; mcp/README.md:15,86 claim 2.159.883.0 is the lowest the 0.3.0 proofs ran on. On the laptop: Help > About, record the build the 0.3.0 proofs ran on in DESKTOP-TESTS.md:2468 (26 Oct runs record 2.159.883.0: BD1.md:5) |
| 5 | New card trend objects and Gantt not researched | NOT-A-PROBLEM | not used by DataArcus |

### V1 ([queue rows](SEEN-QUEUE.md#v1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Arabic "Details" tab drawn cut in approval preview | NEEDS-DESKTOP | only Desktop tells: open the twin's Details page, record whether «التفاصيل» shows whole in its tab and the tab box width; if whole, the preview's fit is wrong (GD2's previews) |
| 2 | Line placeholder showed "label length unknown" note | FIXED-SINCE | 1ebff20 (SQ13): assets/js/page-preview.js:149 plain labels note |
| 3 | Preview tag Arabic on the copy's English pages | FIXED-SINCE | a6130f7 (SQ3): mcp/lib/approval-window.mjs:264 English page drawn with English tag; test-0.3.1-sq3.mjs:10 |
| 4 | Time-chart placeholder gave no time direction cue | FIXED-SINCE | 1ebff20 (SQ13): assets/js/page-preview.js:207,351 arrow toward later time |

### W ([queue rows](SEEN-QUEUE.md#w))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | W and E lang-manager stamps and min files to reconcile | FIXED-SINCE | all 78 pages lang-manager.min.js?v=20261025a (grep count, one stamp) |
| 2 | Lens fix texts unread off Desktop Format pane | NEEDS-DESKTOP | mcp/lib/arabic-lens.mjs:145 (BAR_LTR fix) names Format pane options. In Desktop: read the exact names ("Switch axis position", Values > Horizontal alignment) and record them |
| 3 | Arabic captions say left/right over unmirrored pictures | CHOICE | keep the captions as they are, or mirror the Arabic page's pictures? today ar/articles/article-power-bi-report-ready-for-arabic.html fig1-fig5 captions start "على اليسار": draw the Arabic page's figures mirrored (fixed side first) or reorder the captions |
| 4 | Article says lens from 0.3.1; beta download still 0.3.0 | DROP | nothing to do now: rides integration/0.3.1 only; release step updates the download (mcp/work/D5.md:94 RELEASE 0.3.1 comment); power-bi-mcp/index.html:224 0.3.0 is true on main |
| 5 | BLOG-PLAN says 16 website suites | FIXED-SINCE | 0664c3e (SQ12): content/BLOG-PLAN.md:98 "Every website suite passes" |
| 6 | English quote ends inside quotation marks as Learn does | NOT-A-PROBLEM | informational |

### W1 ([queue rows](SEEN-QUEUE.md#w1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Beta page "A real run" is the 0.2.8 run | DUPLICATE-OF 0.2.9-design-S11 | still: assets/js/translations/beta-page.js:82-83 "Measured on 8 October 2026 with DataArcus 0.2.8" (true as dated) |
| 2 | Privacy line "short titles as typed" not sharp | FIXED-SINCE | assets/js/translations/beta-page.js:93 "short text boxes, and for the Arabic twin its titles too" |
| 3 | read_report "one line per visual" still true | NOT-A-PROBLEM | informational |
| 4 | llms.txt describes MCP without a version | NOT-A-PROBLEM | fits the one-version rule: version only in mcp/package.json |

### W2 ([queue rows](SEEN-QUEUE.md#w2))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | Homepage consulting claim "validated against the source system" | CHOICE | does the consulting sentence stay as written? assets/js/translations/homepage.js:79, index.html:268: a description of the owner's consulting practice, not a product claim nor first/only/official/free; owner may reword |
| 2 | ROADMAP said AI report generation "now free and official" | FIXED-SINCE | grep "free and official\|now free" in mcp/ROADMAP.md: no hit (efe8669) |
| 3 | DESKTOP-TESTS should record 2.159.883.0 | DUPLICATE-OF U1-S4 | scripts/tests/DESKTOP-TESTS.md:2468 still "2.159" |
| 4 | PRODUCT_SPEC rows predated plan gate; rule 4 titles as typed | FIXED-SINCE | 7653789 (SQ9): mcp/PRODUCT_SPEC.md:77,79 approved plan/planId; :120-121 rule 4 text boxes, never a static title |
| 5 | mcp/CLAUDE.md said website has 13 suites | FIXED-SINCE | no "13 suites" or suite count in mcp/CLAUDE.md (A1 93f9219) |

### X1 ([queue rows](SEEN-QUEUE.md#x1))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | EN-AR copy: button look, hidden-page slicer sync, No data AR card, bookmark Reset unproven | NEEDS-DESKTOP | Laptop, X1.md "For the laptop" steps 3-6 on "Orders EN (EN-AR).pbip": record the button's place/one line per page (4), each of the 3 slicer pairs' values carried across, the Arabic card's text on an empty selection, whether the Arabic Reset clears only the Arabic page's slicers |
| 2 | bookmark group name not in twin texts, Arabic copy keeps English name | FIXED-SINCE | 082860a (SQ4): mcp/lib/twin-texts.mjs:147 bookmarkGroup text ids; mcp/lib/twin-copy.mjs:234 applies labels['bookmarkGroup:'+name]; :254 note when none approved |
| 3 | page navigator lists English pages; bookmark navigator lists both languages | NOT-A-PROBLEM | By design, told in the plan: mcp/lib/twin-copy.mjs:252-253 notes (navigator lists shown pages; bookmark navigator lists both) |
| 4 | language button last in tab order | FIXED-SINCE | mcp/lib/twin-copy.mjs:111-121 tabInOrder places it by reading order (:190, :193); test mcp/test-0.3.1-bilingual-report.mjs:153-155 B2l (no added inversions) |
| 5 | validator dropdown notes, labelled-by-title notes, D3 phone header not shrunk | FIXED-SINCE | Dropdown notes gone since catalog 0.1.3: mcp/test-0.2.9-checks.mjs:108-121 P2a (0 PBIR_FORMATTING_OBJECT_UNKNOWN); phone header 082860a assets/js/report-mirror.js:510-522 phoneTitleSize; "labelled by title" is a layouts-suite count, informational |

### X2 ([queue rows](SEEN-QUEUE.md#x2))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | demo Arabic Reset button BUTTON_ONE_LINE, not widened | FIXED-SINCE | 082860a (SQ4): icon switched off where Arabic text and icon do not fit; mcp/test-0.3.1-sq4.mjs:138 X2-S1 checks; mcp/test-0.3.1-mirror-parity.mjs:270-278 |
| 2 | TOOLTIP_SCROLL note on tooltip pages though 12 months fit | NOT-A-PROBLEM | By design: assets/js/report-rules.js:311-329 says rows depend on data check_report does not read; quiet only for Top N or "Last N months" filter (:316-323) |
| 3 | sync groups numbered in random file-name order | FIXED-SINCE | 082860a (SQ4): mcp/lib/twin-copy.mjs:172-182 numbered by page order then place; mcp/test-0.3.1-sq4.mjs:81-90 X2-S3a |
| 4 | inherited X1 items: group name, navigator, flip cards and switcher stay English | DUPLICATE-OF X1-S2 | Group name fixed (X1-S2), navigator told (X1-S3); flip faces and switcher choices are model measures, told under "cannot": mcp/lib/twin-plan.mjs:145,151 |
| 5 | M1/R1 open: twin switches off text-box panels, loses "Total", matrix variant | DUPLICATE-OF M1-S1 | twin-pages.mjs:307 textPanelsOff; with M1-S2 and the matrix variant (M1-S3, WORK-2026-10-05-09-S4) |

### 0.2.9-checks ([queue rows](SEEN-QUEUE.md#029-checks))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | THEME_NAME fix says Desktop "may not load" the theme | GAP, FIXED-HERE | fbd0132: report-rules.js THEME_NAME fix 'the validator and Fabric reject it (Power BI Desktop opens it: measured 2026-10-10)', as DESKTOP_OPENS says; test-0.2.9-a4 (red on c11eb9a first) |
| 2 | THEME_NAME "no .platform file" half never measured | NEEDS-DESKTOP | assets/js/report-rules.js:342 unmeasured. Laptop: delete .platform from a copy of a working PBIP, open in Desktop; record opens yes/no, any error text, and whether Save writes .platform back |
| 3 | FORMATTING_OBJECT_UNKNOWN inside a visual is canBreak | NEEDS-DESKTOP | mcp/lib/check-report.mjs:142 Desktop-opens only under StaticResources/RegisteredResources. Laptop: a visual.json with an unknown objects key; record opens yes/no, the visual draws yes/no, validator code |
| 4 | loadModel picks first of two models at same depth silently | FIXED-SINCE | the owner's yes (26 Oct) carried out by SQ15a 41bd0da with SQ6's option (a): loadModel refuses two models at the top depth, MANY_MODELS naming both (mcp/lib/model.mjs:452-453), v029g names its model; reader-seen S4-1, S4-2 PASS today. (a) over (b) name order or (c) leave: never a silent or arbitrary pick of the model a plan is built on |
| 5 | engine repo attach needed owner's go | NOT-A-PROBLEM | Session permission event, no code |
| 6 | test-0.2.9b.mjs not run by test.mjs | FIXED-SINCE | mcp/test.mjs:16 imports v029b, :4670 runs it; mcp/tests.json:140 |
| 7 | last-6-months tooltip trend still gets TOOLTIP_SCROLL | FIXED-SINCE | assets/js/report-rules.js:318-323 "Last N months" filter counted as a Top N (rc.22 B-142); TIP_ROWS measured 22.2 + 45 + 8 at :75 |
| 8 | packaging hand list must carry text-measure.js, field-meaning.js | NEEDS-DESKTOP | Not in this repo (packaging is in the private dataarcus-engine). Laptop/engine repo: check the .mcpb build list carries assets/js/text-measure.js, field-meaning.js and mcp/lib/files.mjs; record the list and one packed-server start (11 tools listed) |
| 9 | check_report lang lacks Hebrew | FIXED-SINCE | 7653789: mcp/tools/check_report.mjs:17 enum auto/en/ar/he |
| 10 | FILTER_NAME_DUPLICATE_GLOBAL still canBreak | NEEDS-DESKTOP | mcp/lib/check-report.mjs:138-144 not in DESKTOP_OPENS. Laptop: open a report with the duplicate global filter name; record opens yes/no and whether both filters show and apply |
| 11 | lint's 0.57 em and thresholds unsourced | FIXED-SINCE | assets/js/layout-check.js:55-60 CHAR_EM 0.57 with its measured source (Desktop 2.158, 10 Oct) |

### 0.2.9-custom-visuals ([queue rows](SEEN-QUEUE.md#029-custom-visuals))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | catalog lists ganttChart/heatMap/table/matrix as native | DROP | assets/js/visual-types.js:13-23 is Microsoft's catalog 0.1.3 verbatim (one documented source); a type a report declares custom stays custom whatever its name, so subtracting four types gains nothing |
| 2 | text-filter custom visual becomes classic slicer, not textSlicer | FIXED-SINCE | cf3e6eb (NC3): mcp/lib/visual-meaning.mjs:553-555 textSlicer offered as the second option; :576-578 the slicer with search on |
| 3 | donut hole total and bubble map place names told lost | NOT-A-PROBLEM | By design, informational (told as lost) |
| 4 | fieldOf loses date column under auto date hierarchy | FIXED-SINCE | 08493ad (SQ6): mcp/lib/read-report.mjs:264-266 Entity/Property from PropertyVariationSource |
| 5 | custom visual named by whole id | FIXED-SINCE | mcp/lib/visual-meaning.mjs:686 shortType strips the 32-character code, used at :731 |

### 0.2.9-design ([queue rows](SEEN-QUEUE.md#029-design))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | unused tooltip page; two RTL mirrors; rowH +4 unmeasured | NEEDS-DESKTOP | Tooltip pages made on demand (assets/js/pbip-export.js:451-457), one mirror engine (pbip-export.js:359-363); left: assets/js/pbip-page.js:57 +4 for any non-Segoe font. Laptop: two tab rows in Tahoma and Verdana at 1280x720; record each row's drawn height in px |
| 2 | plan-lint builds pages without tableFields | FIXED-SINCE | 1ebff20 (SQ13): mcp/lib/plan-lint.mjs:40-41,52 tableFields from planBinding |
| 3 | LIMITS.kpiCards is a limit name, not layout key | NOT-A-PROBLEM | mcp/lib/tool-limits.mjs:14 a tool limit, by design |
| 4 | website layout label names chosen layout while preview shows single focus | FIXED-SINCE | 0c69f68 (SQ8): assets/js/theme-generator.js:854 LAYOUTS[E.fitLayout(c).preset] |
| 5 | packaging needs new mcp/lib/files.mjs | DUPLICATE-OF 0.2.9-checks-S8 | Same engine-repo build list check (files.mjs added to that item's laptop step) |
| 6 | A2-3 one pure fitSlots | FIXED-SINCE | assets/js/design-engine.js:1046 fitSlots(slots, opts) pure, slots never changed |
| 7 | approve_plan text claims refusal and 2 hours falsely | FIXED-SINCE | mcp/lib/plans.mjs:12-15 TTL 2 h never extended, :49 alive(); mcp/PRIVACY.md:272 A7-3 fixed |
| 8 | idempotentHint false though repeat names same file | FIXED-SINCE | 7653789: mcp/lib/tool-inputs.mjs:19 ADDS_SAME idempotentHint true, used by mcp/tools/add_gulf_calendar.mjs:54 and check_model_health.mjs:61 |
| 9 | desktop extension lacks skill's screenshot/DAX consent rules | SF1 | instructions(LIMITS) measured today: 2195 of INSTRUCTIONS_MAX 2200 (mcp/lib/agent-text.mjs:9), contains "DAX", no "screenshot"; the screenshot consent rule lives only in mcp/skills/report-design/SKILL.md:66-67 (the MCP has no screenshot tool) |
| 10 | A4-7, A5-1/A5-5, A6-4, A6-6 open | FIXED-SINCE | mcp/PRIVACY.md:272-278 lists each fixed |
| 11 | beta page "A real run" is the 0.2.8 run | 0.3.2 | power-bi-mcp/index.html:188-189 (dated, true as dated): replace "A real run" with a measured 0.3.x run, EN and AR |
| 12 | ARABIC-VOICE.md unreadable from engine repo | NOT-A-PROBLEM | Session access note, no code |
| 13 | table smaller and short of field: two "left out" notes | FIXED-SINCE | 4d3a1a6 (SQ10): mcp/lib/report-said.mjs:63-66; test mcp/test-0.3.1-sq10.mjs:41 |
| 14 | picker's chart category choice is builder 5's | NOT-A-PROBLEM | Routing note |
| 15 | v029c L2 failed unreliably; run whole chain | NOT-A-PROBLEM | Session event, fixed by bfd2904 per the note |

### 0.2.9-writer ([queue rows](SEEN-QUEUE.md#029-writer))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | plan's slots miss header growth for two tab rows | FIXED-SINCE | 1ebff20, fced479 (SQ13): mcp/test-0.3.1-sq13.mjs:45 writer-S1 checks; plan-lint/plan_layout through design.mjs |
| 2 | theme-generator stamp merge conflicts | NOT-A-PROBLEM | Merge event, done |
| 3 | mirrorChart writes invertAxis | FIXED-SINCE | assets/js/pbip-export.js:359-363 one mirror engine (report-mirror.js, M1): invertAxis only on a continuous axis |
| 4 | control character (tab) in model name reaches a title | SF1 | Fixed today: assets/js/pbip-query.js:78 shown() drops \p{Cf} and replaces \p{Cc} with a space (f026240, SQ1); :91-93 hasControl |
| 5 | page names keep format characters | SF1 | Page names are the caller's (by design); titles from model names go through assets/js/pbip-query.js:78 shown(); control characters are SF1's job |
| 6 | iconH never called; comment says 320 x 240 | FIXED-SINCE | f026240 (SQ1): no iconH in assets/js/pbip-sizing.js; assets/js/pbip-page.js:178,1474 say 320 x 284 |
| 7 | B-06/B-23 text not in repo; readings may be partial | CHOICE | Does B-06 mean "a text column's room is 12 letters" and B-23 "the table's grid entry", or more? (B-list not in the repo; grep) |
| 8 | golden pins no table text size | FIXED-SINCE | 478d565 (SQ11): mcp/test-models/golden-expected.json has 20 tableText pins |
| 9 | column top N uses 12-letter label guess | NEEDS-DESKTOP | assets/js/pbip-sizing.js:22-24 still 12 letters at 0.55 em; design-engine.js:397 categoryFit. Laptop: DESKTOP-TESTS.md S5 (20 and 40 values, 1920x1080 and 1280x720, EN and AR); record columns shown unslanted per width |
| 10 | row beside short rail keeps width; about 200 gap | STOP-GAP | the owner's yes (26 Oct) not carried out: SQ13 confirmed the gaps (197-392, pinned by test-0.3.1-sq13 S10) and stopped on its options (SQ13.md Decisions 1): (a) REFLOW_KEEP 0.5 -> 0.45 in design-engine.js:1043 (GD2's file; closes the 197 gaps, the column chart 347 -> 168 high), (b) the row under the rail, (c) leave. My pick: (a), one constant, the smallest move, its result pinned by S10; a laptop look at the reflowed page after |
| 11 | S3, S6, D9-D12 not the writer's | NOT-A-PROBLEM | Routing note |
| 12 | TIP_ROWS 22 a row + 46; measured 22.2 + 53 | FIXED-SINCE | 11a85ab (SQ5): assets/js/report-rules.js:75 (h - 45 - 8 - axis 38) / 22.2 |
| 13 | table panel one row shorter on solid theme | NEEDS-DESKTOP | Laptop: a create_report table beside a chart on a solid theme, 1280x720; record the bottom edges' y of the table panel and its neighbour (px difference) |
| 14 | quarter column labels automatic units ("8.0Kkg") | FIXED-SINCE | f026240 (SQ1): assets/js/pbip-page.js:851 labelDisplayUnits num(whole ? 1 : 0) |
| 15 | T3, T4, T5, T7, A2 picker or design | NOT-A-PROBLEM | Routing note |
| 16 | multi-line header, title-off/subtitle/960x720 unmeasured, 8pt header | NEEDS-DESKTOP | Laptop: header on 2 lines at 15pt (record px per line, expect 26.9), title off, a subtitle, 960x720; record header heights and the 8pt source on page 1 |
| 17 | table shadow/grey border inside panel | NEEDS-DESKTOP | Laptop: a table on solid and light themes; record whether a shadow line or grey border shows inside the panel (screenshot, yes/no per theme) |
| 18 | check_report passes duplicate measure names across tables | NEEDS-DESKTOP | No rule yet (grep report-rules.js, check-report.mjs); SQ5.md:96 laptop step: two report measures of one name (different case) on two tables; record opens yes/no and the error text |
| 19 | extRenamed note says the table has the name | FIXED-SINCE | 4d3a1a6 (SQ10): mcp/lib/report-said.mjs:75 names this table, another table or a report measure; mcp/test-0.3.1-sq10.mjs:48 |
| 20 | SVG measure names named by server, not gate | NOT-A-PROBLEM | Informational |
| 21 | picker: two charts by same-name columns of two tables | FIXED-SINCE | assets/js/pbip-bind.js:716-717 otherName excludes the same name (D7) |

### 0.2.9-reader ([queue rows](SEEN-QUEUE.md#029-reader))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | AXIS_HAS_BLANK never fires: blank count needs consented query | SF1 | A data-derived count: assets/js/layout-check.js:167 notChecked says it needs consent (laptop-only); every lint passes facts null; the hard rule (no data values) owns it |
| 2 | plan-lint passes logoPlaceholder false; name may differ | NOT-A-PROBLEM | Names match: mcp/lib/plan-lint.mjs:69 and assets/js/pbip-page.js:723 o.logoPlaceholder |
| 3 | Desktop Extension manifest must list read_report | NEEDS-DESKTOP | No manifest in this repo (packaging private). Laptop/engine repo: open the .mcpb manifest; record the tools listed (expect 11 incl. read_report) |
| 4 | not read: drill level, image names, z, decoration, custom names | FIXED-SINCE | 7f8275e (SQ15a): mcp/lib/read-report.mjs:315 images, :381-384 page images, :408-411 drill level, :570 decorations folded; visual-meaning.mjs:686 shortType |
| 5 | server instructions near their character cap | DROP | Already decided: mcp/WORK.md "Decisions in force" (new behaviour goes in tool descriptions); measured 2195 of INSTRUCTIONS_MAX 2200 (mcp/lib/agent-text.mjs:9) today |
| 6 | merge conflicts with builder 5; npm test should run 0.2.9b | NOT-A-PROBLEM | Merged; mcp/tests.json:140, mcp/test.mjs:16 |
| 7 | browser suites not run locally | NOT-A-PROBLEM | Session note; CI runs them |
| 8 | plan-lint binding is a hand copy of create_report's bindFor | FIXED-SINCE | 850593d (SQ15b): mcp/lib/plan-lint.mjs:23,38 planBinding from mcp/lib/report-run.mjs:56 |
| 9 | lint is a second rule engine beside report-rules.js | NOT-A-PROBLEM | Lint moved to shared assets/js/layout-check.js |
| 10 | R5 done by builder 5 | NOT-A-PROBLEM | Routing note |
| 11 | audit A1 items, website bim cap, byName readdirSync | FIXED-SINCE | assets/js/pbip-bind.js:103,108,125 size caps; mcp/lib/model.mjs:329 readdirSafe |
| 12 | .pbit route reads the zip whole up to 300 MB | FIXED-SINCE | 08493ad (SQ6): mcp/lib/model.mjs:164-169 unzipNeeded reads entries through the descriptor, :260-281 central directory read alone |
| 13 | pbip-bind picker keeps own 'string' type fallbacks | FIXED-SINCE | 1ebff20 (SQ13): grep "\|\| 'string'" in assets/js/pbip-bind.js: 0 matches |
| 14 | gulf-calendar.mjs unwraps m.tmsl itself twice | FIXED-SINCE | f888207 (SQ7): mcp/lib/gulf-calendar.mjs:70,98 modelOf(m.tmsl) |
| 15 | JSON-part errors lack codes | FIXED-SINCE | 08493ad (SQ6): mcp/lib/model.mjs:221-222 ReadError BAD_JSON, TOO_DEEP |
| 16 | .pbit route reads the file whole before unpacking | DUPLICATE-OF 0.2.9-reader-S12 | Same: mcp/lib/model.mjs:164-169,281 |
| 17 | A1-11 percent rule not touched | FIXED-SINCE | Shared assets/js/field-meaning.js; pbip-bind.js isPercent in its api (:935) |
| 18 | check_report measured rules throw on null projection/paragraphs | FIXED-SINCE | assets/js/report-rules.js:14 entries() guard, :386 per-rule try |
| 19 | private-visual package not read; layout must be measured | NEEDS-DESKTOP | mcp/lib/read-report.mjs:69-74 lists CustomVisuals files only. Laptop: save a PBIP with a private (organisational) visual; record the folder layout under CustomVisuals/ and the report.json entry |
| 20 | base theme (SharedResources) never read | FIXED-SINCE | mcp/lib/read-report.mjs:363-366 reads BaseThemes/<name>.json |
| 21 | test.mjs keeps its own report reader | FIXED-SINCE | 8b9a352 (SQ15c): mcp/test.mjs:42-51 uses lib/read-report.mjs inventory (readReport at :427 wraps it) |
| 22 | shared catalog to replace reader's hand list BUILTIN | FIXED-SINCE | mcp/lib/read-report.mjs:309 reads assets/js/visual-types.js; no BUILTIN |
| 23 | fuzz KNOWN lists still hold other blocks' findings | FIXED-SINCE | mcp/test-fuzz.mjs:141,145,148 KNOWN, KNOWN_SLOW, KNOWN_PROPS all empty |
| 24 | largeSummary keys area map by cut name, not raw | FIXED-SINCE | 08493ad (SQ6): mcp/lib/scope.mjs:51 rawOf, :57-58 areaOf keyed by raw name |
| 25 | page background pictures never read; dark-by-picture reads light | 0.3.2 | Picture names read now (read-report.mjs:381-384) but identity (:458-468) takes hex colours only: read a page picture's average lightness (pixels, never data) so a report dark by its picture gets a dark design |
| 26 | report saved without base theme file counts leftovers as own | NEEDS-DESKTOP | mcp/lib/read-report.mjs:365-366 base null when the file is missing. Laptop: save PBIR projects with built-in and custom themes; record whether StaticResources/SharedResources/BaseThemes is always written |
| 27 | theme colour reference colour not counted | NOT-A-PROBLEM | By design: identity takes literal hex only (mcp/lib/read-report.mjs:462-466) |

### 0.3.0-arabic-twin ([queue rows](SEEN-QUEUE.md#030-arabic-twin))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | create_report wrote categoryAxis.invertAxis on categorical axes too | FIXED-SINCE | report-mirror.js:11 (never on categorical), :167 only when the axis is continuous (dateColumns, axisType not Categorical); pbip-export.js:361-368 CONTINUOUS set (0.3.1 M1; its sha predates the shallow clone) |
| 2 | bookmark capturing display state on a mirrored chart never tested | NEEDS-DESKTOP | no record in scripts/tests/DESKTOP-TESTS.md; laptop: on a twin, add a bookmark with Display on a mirrored column chart, apply it; record whether the reversed sort (Descending by category) and right-side value axis are kept |
| 3 | twin's phone layout copied, not mirrored | FIXED-SINCE | assets/js/report-mirror.js:22 and :496-505 mirror mobile.json (x' = 323 - x - width, texts right-aligned), 0.3.0 D3 |
| 4 | charts not rebound to Arabic month column after the month script | 0.3.2 | still true: create_arabic_twin.mjs:43 only offers the script, no rebind input. 0.3.2: once the user says the month script is applied, a follow-up plan rebinds month axes and slicers to Month Name (Arabic) |
| 5 | extension must carry assets/js/report-mirror.js | DROP | not worth a laptop check: mcp/lib/report-run.mjs:30, twin-copy.mjs:11, arabic-lens.mjs:26 require it at import, so a bundle without it fails at server start; 0.3.0 and 0.3.1 rcs shipped and ran the twin |
| 6 | twin's button text/icon mirroring rule not from the labs | NEEDS-DESKTOP | rule at report-mirror.js:20,84,286; no twin button entry in DESKTOP-TESTS.md. Laptop: twin of a report with a left-aligned button text and a left icon; record each now at the right, centred ones unchanged (laptop check 9) |
| 7 | mcp/WORK.md not updated by the twin branch | NOT-A-PROBLEM | session/routing note; branch merged, WORK.md now holds 0.3.1 |

### audit-summary ([queue rows](SEEN-QUEUE.md#audit-summary))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | each audit block file ends with its own seen list | NOT-A-PROBLEM | pointer only; the blocks' lists are separate items (audit-1..8) |
| 2 | website model readers have no model.bim size cap | DUPLICATE-OF audit-1-model-reading-S1 | assets/js/pbip-bind.js:88 LIMITS, :103 and :125 tooBig before reading |
| 3 | packaging build tests rewrite committed files, restore in finally | DUPLICATE-OF audit-8-packaging-S2 | packaging/ not in this repo (ls: no such dir) |
| 4 | plans live in memory; a server restart forgets them | DROP | not worth doing: by design and said, mcp/lib/plans.mjs:4 (unknown id refused like an expired one); fails safe: nothing written without a live approved plan |

### audit-1-model-reading ([queue rows](SEEN-QUEUE.md#audit-1-model-reading))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | website fromFile/fromFolder parse model.bim with no size cap | FIXED-SINCE | assets/js/pbip-bind.js:86-89 LIMITS (model 64MB, entry 32MB, total 128MB, file 300MB), :103,:108,:125 tooBig before reading |
| 2 | byName readdirSync unwrapped; one unreadable subfolder fails whole search | FIXED-SINCE | mcp/lib/model.mjs:328-330 readdirSafe try/catch used by visit and the model check (:338) |
| 3 | server's DIVIDES_OR_AVERAGES was a 4th DIVIDES regex | FIXED-SINCE | now assets/js/field-meaning.js:134 beside DIVIDES :18 in one module; no copy left in mcp/server.mjs or mcp/lib (grep) |

### audit-2-design-engine ([queue rows](SEEN-QUEUE.md#audit-2-design-engine))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | page-button rowH +4 for non-Segoe fonts unmeasured | NEEDS-DESKTOP | still assets/js/pbip-page.js:57 (+4 when font is not Segoe UI). Laptop: page buttons in Tahoma and one more font at 1080; record the drawn row height vs 6+1.6*t+lineH |
| 2 | layoutFrom fix was a no-op in planLayout; bad dir reset silently | FIXED-SINCE | mcp/lib/design.mjs:194 layoutFrom(..., fix) reports; :127,:203 E.repairState; design-engine.js:1214 one('dir', ...) reports a bad dir |
| 3 | server ran E.page() on the raw unrepaired design | FIXED-SINCE | mcp/tools/plan_layout.mjs:277 pageOf(r.design.layout), the repaired design from planLayout |
| 4 | Theme Generator thumbnails used fixed rx=18, not the radius | FIXED-SINCE | assets/js/theme-generator.js:360 rx from +c.radius |

### audit-3-picker-writer ([queue rows](SEEN-QUEUE.md#audit-3-picker-writer))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | connection() workspace name not URL-encoded | NOT-A-PROBLEM | assets/js/pbip-bind.js:910 connection(); Microsoft's connection string takes the raw workspace name (informational, safe) |
| 2 | T[c] field keys ambiguous for names containing ] | FIXED-SINCE | pbip-bind.js:922 fieldKey doubles ]; report-run.mjs:229 named() keys by Bind.fieldKey (4d3a1a6 SQ10). report-run.mjs:224 keyOf stays unescaped on purpose: it must equal model-health-tmdl.js:321's object key for formatsScriptOf |
| 3 | named() mutated shared field objects | FIXED-SINCE | mcp/lib/report-run.mjs:229 Bind.mapFields with Object.assign({}, f, ...) copies |
| 4 | pointer list B-03..B-23, A1-11, A2-3 known elsewhere | NOT-A-PROBLEM | pointer only; B-14/T1 invertAxis gone (report-mirror.js:11) |

### audit-4-checks ([queue rows](SEEN-QUEUE.md#audit-4-checks))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | textSize 12 unmeasured; pageNames uncapped; schema walk 2000; version at import | NEEDS-DESKTOP | assets/js/layout-check.js:261 textSize 12 still unmeasured; laptop: a new text box in Desktop 2.158, record its default font size. Rest informational: check-report.mjs:536 pageNames inside the capped answer, :91/:102 walk 2000, :36 version read at import |

### audit-5-reading ([queue rows](SEEN-QUEUE.md#audit-5-reading))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | test.mjs had a fourth report reader of its own | FIXED-SINCE | 8b9a352 (SQ15c): mcp/test.mjs:42 imports read-report.mjs inventory; :50-53 reportOf uses it, :427 readReport is a thin map over it |
| 2 | check_report lint section did not catch errors | FIXED-SINCE | mcp/lib/check-report.mjs:529-530 try around lint, failure listed in notChecked |
| 3 | base theme never read; no custom theme gives no colours | FIXED-SINCE | 08493ad (SQ6): mcp/lib/read-report.mjs:363-369 reads StaticResources/SharedResources/BaseThemes/<name>.json |

### audit-6-mcp-tools ([queue rows](SEEN-QUEUE.md#audit-6-mcp-tools))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | report plan let generate_theme write any folder | SF1 | approval scope: mcp/lib/plans.mjs:21-22 report allows create_report only, theme plan allows generate_theme |
| 2 | CARD_RULE used before it was defined | FIXED-SINCE | mcp/lib/report-said.mjs:19 exported const, imported report-run.mjs:25 |
| 3 | add_gulf_calendar plan path passes a fake writeScript | FIXED-SINCE | f888207 (SQ7): mcp/lib/gulf-calendar.mjs:61-62 documents writeScript's two callers, one shape; add_gulf_calendar.mjs:24,66 scriptNameNow |

### audit-7-instructions ([queue rows](SEEN-QUEUE.md#audit-7-instructions))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | idempotentHint false though a repeat names the same file | FIXED-SINCE | mcp/lib/tool-inputs.mjs:16-19 ADDS_SAME idempotentHint true, used by check_model_health.mjs:61 and add_gulf_calendar.mjs:54 (SQ9) |
| 2 | Desktop extension has no skill; screenshot/DAX consent rule missing | SF1 | still true: mcp/lib/agent-text.mjs:40-53 has no screenshot/DAX consent line (SKILL.md:66-71,97 only); the MCP itself takes no screenshot and runs no DAX; waits on the instructions cap (0.2.9-design note :153-155) |
| 3 | SKILL said gulfCalendar appears only with a country | FIXED-SINCE | mcp/skills/report-design/SKILL.md:155 'or on a model that already has Hijri or Ramadan columns' |

### audit-8-packaging ([queue rows](SEEN-QUEUE.md#audit-8-packaging))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | private build.mjs header and test plan say 8 tools | 0.3.2 | private packaging repo, not in this checkout; mcp/tools has 11 tools today. 0.3.2: make build.mjs:13-14 and PACKAGING.md:232 read the count from mcp/tools, not a typed number |
| 2 | private build tests rewrite committed files, restore in finally | 0.3.2 | private build.test.mjs not in this checkout. 0.3.2: run the build tests on a temp copy instead of rewriting committed files |
| 3 | no privacy-policy field in the .mcpb manifest | 0.3.2 | private manifest.json not in this checkout. 0.3.2: add privacy_policies (dataarcus.com/privacy.html) to the .mcpb manifest |
| 4 | approvals in memory; a restart forgets them | DUPLICATE-OF audit-summary-S4 | mcp/lib/plans.mjs:4 by design, fails safe |

### WORK-2026-10-01-04 ([queue rows](SEEN-QUEUE.md#work-2026-10-01-04))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | round 1 items: header band, Executive button, centring, padding, tooltip | FIXED-SINCE | round 1 merged 80d3a00 per archive note WORK-2026-10-01-04.md:7 (sha predates shallow clone); pointer to round 1 section :1914 |
| 2 | round 2: English names in Arabic, sorting, refresh banner | FIXED-SINCE | round 2 merged ada2942 (archive note :10); assets/js/translations/theme-generator.js:36 'Sample data (click Refresh once)' |
| 3 | after the beta: the 640 x 360 items | FIXED-SINCE | mcp/lib/design.mjs:289-296 small page under 800 wide takes single focus layout (E.smallPage, rounds 19/22); measured DESKTOP-TESTS.md:2321; no logo placeholder pbip-page.js:721 |
| 4 | fix/card-theme-radius: validator theme error on MCP exports | FIXED-SINCE | merged 99d1cee (archive note :1616; sha predates shallow clone) |

### WORK-2026-10-05-09 ([queue rows](SEEN-QUEUE.md#work-2026-10-05-09))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | hand-placed Arabic page right to left only with rtl true | FIXED-SINCE | mcp/lib/report-run.mjs:112-114 rtlHand defaults to lang ar (round 23) |
| 2 | English RTL report writes Total; note still named Arabic word | FIXED-SINCE | 4d3a1a6 (SQ10): mcp/lib/report-said.mjs:68-70 totalWord(lang) |
| 3 | model name 'Row label: <Column>' could collide with report measure | FIXED-SINCE | assets/js/pbip-notes.js:34 freeExt checks model names; pbip-page.js:980-981 rowLabel name through freeExt |
| 4 | matrices not mirrored; row header not reversed in Arabic | NEEDS-DESKTOP | assets/js/report-mirror.js:309-322 default 'values' only, lab candidates unwritten (M1). Laptop: run mcp/lab/matrix-mirror.mjs, record for each MATRIX_RTL mode where row headers, column order and totals draw; then pick one (it bears on the twin being mirrored) |
| 5 | All in slicers, English names, task 10 totals, Your logo cut | FIXED-SINCE | 'All' follows viewer's Power BI language, said: report-run.mjs:232-233; no 'Your logo' placeholder pbip-page.js:721 (O-6); display names approved (agent-text.mjs rule 2) |
| 6 | mcp/quick.tmp.mjs committed on main | FIXED-SINCE | file absent (ls: no such file) |
| 7 | ring note wording for a table without value column | FIXED-SINCE | fixed that night (archive note night sitting table); text now in pbip-page.js:1063 / report-fields.mjs:168 only as comments |
| 8 | health check cannot tell a measure's DAX does not parse | FIXED-SINCE | f888207 (SQ7): check_model_health.mjs:44 and TOOLS.md:32 'DAX is not parsed: a measure whose DAX is broken is not found' |
| 9 | Arabic table has no Total word | FIXED-SINCE | assets/js/pbip-query.js:243-251 row label measure gives the Arabic total word (round 23, way 4); report-run.mjs:539 |
| 10 | Arabic Reset arrow touches the last letter | FIXED-SINCE | assets/js/pbip-page.js:198 round 22 gap on the arrow side |
| 11 | 18pt table title above 9pt rows in a small hand-placed slot | CHOICE | still: no rule in pbip-page.js scales a visual title by its slot. Question: in a small hand-placed slot, should the table title scale with its text (9pt rows), or keep 18pt? |
| 12 | generate_theme theme keeps 1080 sizes on a smaller hand page | FIXED-SINCE | mcp/lib/report-run.mjs:326-340 round 23 rescales our theme's sizes to the pages' height |
| 13 | English day/month/KPI names on the sample (no Arabic columns) | NOT-A-PROBLEM | the sample's own columns, told in notes |
| 14 | task 8 Total by Note one bar; customer table scrolls | NOT-A-PROBLEM | the test model's own columns |
| 15 | Gulf model bar chart has number-like store names | NOT-A-PROBLEM | the test model's data |
| 16 | No data message cards were tab stops | FIXED-SINCE | assets/js/pbip-page.js:362 nodata and panel get no tabOrder |
| 17 | full npm test 13-30 min; no way to run one block | FIXED-SINCE | mcp/run-tests.mjs:6-17 areas and DA_SHARD k/N (G1) |
| 18 | rounds 18 and 19's own seen lists | NOT-A-PROBLEM | pointer; every row marked done or no change in the archive note |

### WORK-2026-10-11-14 ([queue rows](SEEN-QUEUE.md#work-2026-10-11-14))

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | own isCustom in report-mirror; two Arabic month lists | FIXED-SINCE | report-mirror.js:51 uses VT.isCustom; 7f611fa (SQ14): one MONTHS list assets/js/arabic-calendar.js:13 read by calendar-generator, theme-generator, pbip-query, label-limits, shadow-model |
| 2 | G1 third KPI was a computed measure by name tiebreak | NOT-A-PROBLEM | informational: shape cannot tell two computed measures apart; no defect defined |
| 3 | O-2, R1-R9, T2-T8 belong to their blocks | NOT-A-PROBLEM | pointer only |
| 4 | T1 invertAxis is the laptop's tonight | DUPLICATE-OF 0.3.0-arabic-twin-S1 | assets/js/report-mirror.js:11,167 categoryAxis.invertAxis only on a continuous axis |
| 5 | parseTmdl appended formatStringDefinition lines to DAX | FIXED-SINCE | tree parser assets/js/tmdl-model.js:152; ran here: measure with formatStringDefinition gives expression 'SUM(Sales[Amount])' and formatStringDefinition.expression apart |
| 6 | counted binding's funnel/tooltip now the second KPI count | NOT-A-PROBLEM | informational: behaviour change recorded |
| 7 | display names now shown on category-pool charts | NOT-A-PROBLEM | informational: behaviour change recorded |
| 8 | packaging must carry field-meaning.js | NOT-A-PROBLEM | assets/js/pbip-bind.js and model-health-tmdl.js:12 require it at load, so a bundle without it cannot start; 0.2.9 and 0.3.0 shipped |
| 9 | 'is not blank' filter shape only validator-proven | NEEDS-DESKTOP | written by pbip-query.js:435 notBlank, used pbip-page.js:266; no entry in DESKTOP-TESTS.md. Laptop: open a create_report chart whose axis has blanks; record (Blank) gone and the filter pane showing 'is not blank' |
| 10 | no date hierarchy; plain Date axis draws one point per day | 0.3.2 | still true: pbip-query.js:278 a date-typed axis gets order 'own'. 0.3.2: bin a plain Date axis by month start (as monthStart does for labels), proved in Desktop |
| 11 | month order measure lives in a hidden calendar table | NOT-A-PROBLEM | informational: works as designed, no risk named |
| 12 | table widths from average letters, no data lengths | NOT-A-PROBLEM | by design: data values are never read (CLAUDE.md, owner 25 Oct) |
| 13 | template keeps Your logo; sample's revenue card whole | NOT-A-PROBLEM | a template by design; the sample sets its own formats |
| 14 | brand harmony's other 7 colours too loud | FIXED-SINCE | mcp/lib/design.mjs:168 harmony defaults to 'calm' (0.2.9 O-11) |
| 15 | approved plan did not pin create_report's fields | SF1 | approval: mcp/lib/report-inputs.mjs:128 REPORT_PINNED includes fields, :139 reportPin |
| 16 | see how Claude Desktop shows approve_plan on the beta laptop | SF1 | approval: mcp/tools/approve_plan.mjs:25 asks through MCP elicitation when the app declares it (A6-3), owner's rc Desktop tests |
| 17 | open from before: O-2..O-16 | NOT-A-PROBLEM | pointer; handled in 0.2.9's layers (archive note :563) |
| 18 | website pbip suite race: picker read before filled | FIXED-SINCE | scripts/tests/pbip.mjs:383-384 waits for selects and no 'Reading the model' |
| 19 | text cardinality, Power Query WeekType unknown without values | NOT-A-PROBLEM | by design: metadata only, no data values read |
| 20 | one category: column chart repeats bar chart's field | NOT-A-PROBLEM | informational: the chosen behaviour |
| 21 | S1-S3, S6, S7, D1... are the writer's or design's | NOT-A-PROBLEM | pointer to other blocks' items |
| 22 | open decision: category pool with fields or page filters | CHOICE | still: mcp/lib/report-run.mjs:173 and plan-lint.mjs:45 delete catPool. Question: with fields or page filters, keep no category pool, or give each chart an unused category? |
| 23 | laptop items P1-P6 and blocks' laptop lists | NEEDS-DESKTOP | P1 seen PASS (DESKTOP-TESTS.md:2055); P6 done (pbip-page.js:503 reads f.cal). Laptop: record P2 (Arabic month/day axis order), P3 (Day Short), P4 (Visit Count 1,234 on table and card), P5 (same formats website vs MCP) |
| 24 | report validator in dependencies, not devDependencies | NOT-A-PROBLEM | check_report runs it at run time: mcp/lib/check-report.mjs:36 resolves @microsoft/powerbi-report-authoring-cli (mcp/package.json:19) |
