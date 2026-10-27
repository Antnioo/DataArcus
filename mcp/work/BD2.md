# BD2 (0.3.1, 27 Oct): the measured bidi rule (V3: the isolates, the whole text in RLI ... PDI), once, in the shared engine

## Summary
- **Approval:** the reviewer's brief "Go on BD2" (27 Oct), on the laptop's measurement of BD1's bidi lab (Power BI
  Desktop 2.159, 27 Oct, Windows text recognition; engine branch lab/rc031-proof, RESULTS.md "BD1 bidi lab"): V0 wrong
  everywhere; V1 (today's isolateLatin) right except where Desktop cuts a text with "..." (cards); **V3 (V1 wrapped
  whole in U+2067 ... U+2069) right on every canvas kind, cut card texts included**; V4 draws as V3 (old embeddings);
  no variant helps the tab strip (page and tooltip page names lay out left to right).
- **Scope:** `assets/js/text-measure.js` (the rule), `pbip-export.js` (isolateFiles: DAX texts wrapped whole),
  `pbip-page.js` (Arabic tooltip page names), their `.min.js`, the `?v=` stamps (theme-generator.js's builder list, its
  own stamp on the 3 pages); `mcp/lib/dax-functions.mjs`, `arabic-lens.mjs` (TEXT_MIXED's words), `terminology.mjs`
  (pageNamesOf), `tools/plan_layout.mjs` and `tools/create_arabic_twin.mjs` (pageNames), `lab/bidi-lab.mjs`,
  `lab/BIDI-LAB.md`, the article (EN, AR, translation), BLOG-PLAN's log line; new suite `test-0.3.1-bd2.mjs`; pins by
  the wrap in 7 suites (below). Not R4A's, GL2's, TT1's (story-titles.js) or CS2's files.
- **Base:** `fix/0.3.1-bd2` from `origin/integration/0.3.1` (e2236be). Push only this branch; the reviewer merges.
- **Expected checks:** (written before the work) bd2 about 22, about 18 red first; arabic 12 -> 13; report and core the
  same counts, the golden reports byte for byte; the website the same counts; full run +1 suite.
- **Got:** bd2 33 checks (22 of 31 red first on e2236be; P7 and K5 added while working); arabic 12 -> 13 suites; report
  33 = 33, every count the same; core 6 suites, test.mjs 1591 = 1591, golden 12 tasks match (byte for byte); website
  theme-generator 910 = 910, pbip 109 = 109; lint clean; full run: "Results".
- **Invariants:** metadata only; the marks come from the writer only (a person's name with one stays refused).
- **TT1:** `isolateLatin(s)` keeps its signature (its output is now V3); new `isolateRuns(s)` (V1) and `wrapped(t)`.
- **Resume:** done; waits for the reviewer. Desktop: "For the laptop" 1-3 (the batched run).

## Plan
1. This note, pushed first. Baselines on e2236be (a clean worktree): arabic, report, core, the website's two suites.
2. Red first, `mcp/test-0.3.1-bd2.mjs`: R the rule (V3 on each position, idempotent, V1 upgraded, no Latin unchanged,
   isolateNames, widths, re-exports); K each kind through the writer; D DAX texts and DA.StoryTitle; P page names and
   what the plans say; L the lens; A the article; B the lab.
3. The work at the cause. Then the suites, build:min, stamps, csp, ar-pages, sitemap-lastmod, the note.

## Results
Commits: plan fb01a6e, red first 88735d9, the work 08ced1e, the article 3a71764, the pins of core's test.mjs and this
note (next commits), sitemap dates last.

| Item | Before | After | Test |
|---|---|---|---|
| 1 the rule | `isolateLatin` = V1 (FSI ... PDI per run, RLM beside an end run) | `isolateLatin` = U+2067 + V1 + U+2069; idempotent; a V1 text (an older build) gets the wrap; no Latin letter, English, empty: unchanged; `isolateNames` wraps what it isolates; `isolateRuns` = V1 | bd2 R1-R8, K1-K5 red -> green |
| 1 every kind | titles, alt texts, text boxes, buttons, headers, tooltips, page and bookmark names V1 | each V3 through `isolateFiles` (the MCP's create_report, the twin's labels, the website's download) | bd2 K1-K5 |
| 3 DAX texts | a report Text measure's literals V1 each | literals V1, the whole expression `UNICHAR ( 8295 ) & ( ... ) & UNICHAR ( 8297 )`, once | bd2 D1-D3 |
| 3 DA.StoryTitle | `r & ar & r` | `w & r & ar & r & o` (w = UNICHAR ( 8295 ), o = UNICHAR ( 8297 )); English unchanged | bd2 D4-D5 |
| 2 page names | Arabic tooltip tab «تلميح · Month Short» | «تلميح · الشهر»; a measure or category kept in English gives way to the page's number among its kind; plan_layout (lang "ar", en+ar) and the twin answer `pageNames` (latin, sayInPlan or note) | bd2 P1-P7 |
| 4 the lens | "U+2068 ... U+2069 and U+200F at the start" | the isolates, U+200F beside an end run, the whole text in U+2067 ... U+2069 (Desktop 2.159, 27 Oct); page names: keep English out; the twin sentence names the wrap; a V1-only text is now flagged | bd2 L1-L3 |
| 4 the article | the isolate and U+200F at the start | the isolates and the whole text in U+2067 ... U+2069, cut card texts included; page names: keep English out (tabs left to right); dateModified 2026-10-27 | bd2 A1-A3 |
| 5 the lab | page 4: `show` and `text` in one entry under `selector: default` (no text drawn) | `show` an entry of its own, the text under default (pbip-page.js `def`); V1 = `isolateRuns` | bd2 B1-B2 |

**Pins changed (item 6), each only by the wrap:** terminology-sheet TS-4a, TS-4b (RLI ... PDI round the same text);
TS-10b (the tooltip tab: «تلميح · الشهر», no Latin run, item 2, was «تلميح · Month Short»); bd1 D2, D4 (U+2067 first,
U+2069 last round the same text), X4 (the fix's new words: "U+200F beside a run that starts or ends the text"; the
wrap is bd2 L2); bidi-lab: RULE's V1 is `isolateRuns` (the lab's V1 unchanged), B4's reader takes the button's two
entries (item 5); sq15b J1 (the wrap), T2 (U+2067 first), the title reader (the expression's wrap); the website's
pbip.mjs LR2-a3 (U+2067 first, U+2069 last) and its title reader; test.mjs: round22's plainOf (the expression's wrap),
0.2.9w A3-11 (U+2067 allowed among the writer's own marks). No expected count changed; nothing loosened.

## Baseline (e2236be) -> after
- `npm test -- arabic`: 12 suites passed -> 13 (bd2 33; terminology-sheet 48, bd1 18, bidi-lab 11: the same counts).
- `npm test -- report`: 33 -> 33, every count the same (sq15b 25, dax-functions 92, story-titles 94 ...).
- `npm test -- core`: 6 -> 6; test.mjs 1591 = 1591 (two pins by the wrap, shard 3 re-run: 634 PASS); golden 12 tasks
  match (no golden report changed); mutation: see the full run.
- Website `run-all.mjs theme-generator pbip`: 910 and 109 -> 910 and 109.
- lint clean (exit 0); check-result-lines PASS (99), changelog-words PASS (166), check-agent-memory PASS (168),
  ar-pages PASS, test-site-config PASS, arabic-terms 85 = 85.
- Full run `npm test -- --keep-going`: (below, filled at the end).

## CHANGELOG line
- Arabic text with an English word in it is written the way Power BI Desktop was measured to draw it right everywhere,
  cut card texts included: each English run isolated and the whole text wrapped in a right-to-left isolate, in every
  title, text box, button, header, alt text, tooltip and dynamic title, in the agent's reports, the Arabic twin and the
  website's Arabic download; Arabic tooltip page names keep English out, and the plan names any Arabic page name that
  still holds an English word, since Power BI lays page tabs out left to right; check_report's Arabic lens and the
  "Is your report ready for Arabic?" article give the same fix.

## Decisions I made
1. **A V1 text gets the wrap** (`isolateLatin` upgrades a text that already holds isolates but no wrap): an older
   build's titles become V3 when a report is rewritten, and the lens flags a V1-only text (it draws wrong where cut).
   A text that holds isolates is never re-isolated inside (`isolateRuns` returns it as it is).
2. **DAX: the whole expression is wrapped, not each literal** (`UNICHAR ( 8295 ) & ( expr ) & UNICHAR ( 8297 )`), only
   when a literal took isolates: a Top N title joins literals and counts at run time, and the measured rule wraps the
   text a reader sees. VAR ... RETURN inside parentheses is DAX; Desktop to confirm (For the laptop 2).
3. **Digits alone are no Latin run** (the measured texts held "Department"): arabic-calendar.js's pills («2025 الربع 1»,
   RLM and FSI built in DAX) and an Arabic page name with a number stay as they are.
4. **Page names keep the wrap** where they still hold a Latin run (a person's name in the twin): no mark helped the
   tabs, none hurt, and a page navigator draws the name on the canvas, where V3 was right. The writer's own drafts keep
   English out: the trend's tab «تلميح · الشهر» (the trend is always by month); another kept-English part gives way to
   the page's number among its kind (names stay apart).
5. **pageNames in both plans** (plan_layout with lang "ar" or "en+ar", and create_arabic_twin): `latin` (each name and
   whether it is a tooltip page) and `sayInPlan`; none: a one-line `note`. From the plans' exact files
   (`Terms.pageNamesOf`), so it names what is written.
6. **The lab keeps V1 as measured:** `isolateRuns`, so its key and screenshots stay comparable with 27 Oct's run.
7. **TT1:** `isolateLatin`'s signature kept; `isolateRuns` and `wrapped` added to text-measure.js's API.

## For the laptop (Power BI Desktop 2.159 or later; the batched run)
1. The bidi lab again (`node lab/bidi-lab.mjs <empty folder>`; `mcp/lab/BIDI-LAB.md`): V3 right on every kind as on
   27 Oct; page 4's buttons now draw their text: judge them (V0-V4).
2. A written Arabic report (create_report lang "ar" on a made-up model with English names, e.g. "Total Sales", "Region"):
   the KPI cards and charts whose titles Desktop cuts with "...": the "..." at the reading end; the Top N chart titles
   (a report measure wrapped at run time) read in order; DA.StoryTitle with daxFunctions true reads in order.
3. Its tooltip tabs: «تلميح» and «تلميح · الشهر», no English.

## Seen, not in scope
1. `scripts/tests/DESKTOP-TESTS.md` has no entry for the 27 Oct lab measurement (it lives in the engine branch's
   RESULTS.md and now BIDI-LAB.md); the reviewer may want one line there.
2. The twin's labels a person gives with a Latin run in a page name are kept (named in the plan); nothing asks for
   an Arabic word instead.
3. model-health.js builds FSI ... PDI for its own canvas (a browser canvas, not Power BI): not changed.
4. axis-units.js and visual-meaning.mjs isolate units with FSI ... PDI; their texts reach Power BI through isolateFiles,
   which now wraps them (an Arabic text with a Latin letter), so they are V3 too.
