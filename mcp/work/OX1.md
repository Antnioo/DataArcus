## Summary
- **Approval:** the owner, 11 Nov, D-1111-15: "I need two more fable sessions for new ideas that would make this mcp
  one of kind" (relayed by the hub, session_015Q77oNR7YVFznptSuZoZZ2). OX1 is the outside-in half; IX1 the other.
- **Base:** `feat/0.3.3-ox1` from `origin/integration/0.3.3` at 2960587c. Push only this branch; never merge, no PR.
- **Scope:** new module(s) in `mcp/lib/` or `mcp/lab/ox1-*` with tests and their `mcp/tests.json` lines, MODULES.md
  rows, `mcp/WORK.md`, this note. Nothing a tool writes or answers today changes. CHANGELOG: none.
- **Expected checks:** (written before the code: "about 45 checks") **got:** new suite `ox1`
  (`mcp/test-0.3.3-ox1.mjs`, area checker) 57 checks, red on c2c868dc first (54 of 57 failed: no `lib/brief.mjs`);
  the plan's table met as written (Souq 6 pairs all move; the planted page 12 pairs: 9 move, 3 one value, 1 name not
  in the model; 7 questions: 3 answered, 1 partly, 1 not answered, 2 cannot). checker 15 suites passed (hx1 59, hx2
  43, same-question 41 unchanged); `node scripts/check-modules.mjs --strict` PASS 1240 (222 files, 222 rows),
  check-contracts PASS 858, check-agent-memory PASS 518, check-result-lines PASS 247, test-site-config PASS, lint 0.
- **Resume:** stage 1 built (2026-11-11T15:40Z); CI on the branch is the last step. The reviewer: review and merge (nothing
  user-visible; no existing file's code changed). The owner: "For the owner" 1 to 5. Next builder: "Stages 2 to 4".
- **Result:** on a made-up report, three visuals that validate and draw are named as showing one value on every row,
  each with why; seven questions (two in Arabic) are sorted into answered, partly, not answered and "this model
  cannot answer": `node lab/ox1-brief-demo.mjs`.

## Phase 1 (discover; written 2026-11-11T15:35Z, before any code)
How it was read: two research passes over the public web on 11 Nov 2026 plus my own searches. "Opened" = the page
itself was read; "snippet" = only a search result's text. Could not be read at all: every page of
community.fabric.microsoft.com (HTTP 403 to scripted reads, so forum and Ideas rows are snippets, undated), r/PowerBI,
the bodies of other repositories' GitHub issues except one, Power BI Sentinel, pbir.tools' website. Not searched: the
monthly feature summaries beyond U1's (mcp/research/POWERBI-2026-10.md), Guy in a Cube. Arabic-language searches
("Power BI من اليمين لليسار", "التقويم الهجري Power BI") returned the same English threads or nothing about Power BI.

### 1. What people struggle with (evidence)
| # | Pain | Evidence | Source | Date | Read |
|---|---|---|---|---|---|
| E1 | The AI picks the wrong measure or aggregation, and it looks fine | "the chart picked the wrong measure, the date field is being treated as text"; "Copilot will happily sum a column that should be averaged"; the reviewer is told to ask "Is that the right measure? Is the aggregation correct?" | https://team400.ai/blog/2026-09-power-bi-copilot-create-reports (M. Ridland) | 2026-09-16 | opened |
| E2 | A visual built across tables the model does not relate the way the AI assumed | Chris Webb's own test of a measure with no direct relationship to the dimension: "I was expecting to see the same value repeated across all customers", "the visual was assuming an indirect relationship via the Sales table" | https://blog.crossjoin.co.uk/2025/07/20/power-bi-copilot-ai-instructions-and-semantic-model-relationships/ | 2025-07-20 | opened |
| E3 | "The same number on every row" is a standing forum question (people cannot see why) | threads titled "Measure from different table is displaying the same number for..." and "Measure returning same value for all row" | https://community.fabric.microsoft.com/t5/DAX-Commands-and-Tips/Measure-from-different-table-is-displaying-the-same-number-for/m-p/2898112 , .../Measure-returning-same-value-for-all-row/m-p/3934991 | not seen | snippet |
| E4 | Plausible and wrong | "It is a plausible answer that happens to be wrong."; "Copilot may combine data incorrectly or produce results that appear coherent but are analytically flawed." | https://blog.bismart.com/en/power-bi-copilot-errors-wrong-answers | 2026, no day | opened |
| E5 | AI DAX is not reliable enough to skip review | Marco Russo: "it's not always 100% correct, and performance isn't always ideal." | https://www.sqlbi.com/blog/marco/2026/09/22/where-we-stand-on-ai-and-dax-in-2026/ | 2026-09-22 | opened |
| E6 | A measure right in one context, wrong in the report | Microsoft: a suggested measure "could produce unexpected or incorrect results" in another filter context | https://learn.microsoft.com/power-bi/create-reports/copilot-semantic-models | live, read 11 Nov | opened |
| E7 | The AI misreads the model (ambiguous names; 200 characters of a description) | Microsoft's own example of a wrong answer from ambiguous field names | https://learn.microsoft.com/dax/dax-copilot | live | opened |
| E8 | The validator passes, the visual is still wrong | an agent-built donut drew empty, KPI cards broke: "Power BI Desktop is the rendering authority, not the validator." | https://sqlsekou.substack.com/p/replicating-microsoft-build-2026s | 2026-06-05 | opened |
| E9 | No undo, and the context is eaten | Kurt Buhler: "you can't undo or revert your changes"; "MCP servers consume a lot of your context window" | https://tabulareditor.com/blog/ai-agents-that-work-with-power-bi-semantic-model-mcp-servers | 2025-11-19, upd. 2026-08-26 | opened |
| E10 | A rename breaks visuals quietly | renamed fields left grey boxes; bookmarks kept the old names | https://tabulareditor.com/blog/fixing-a-broken-power-bi-report-with-ai | 2026-06-09 | opened |
| E11 | People want the report built too | microsoft/powerbi-modeling-mcp issue 28 (report and visual creation): open, 20 thumbs-up, no maintainer reply | https://github.com/microsoft/powerbi-modeling-mcp/issues/28 | 2025-12-04 | opened |
| E12 | Privacy and over-reliance | a SQLBits 2026 abstract: "data protection and privacy risks", "a growing risk of over-reliance"; Microsoft: "Metadata, schemas, and query results go to the MCP client" | https://sqlbits.com/sessions/event2026/The_good_the_bad_the_ugly_with_Power_BI_agentic_development ; https://learn.microsoft.com/en-us/power-bi/developer/mcp/mcp-servers-overview | 2026-04-25; 2026-09-24 | opened |
| A1 | Arabic: no right to left in Desktop, visuals do not mirror | "Desktop doesn't support right-to-left languages."; "the layout of visuals doesn't change if you're using a right-to-left language" | https://learn.microsoft.com/en-us/power-bi/fundamentals/supported-languages-countries-regions | live | opened |
| A2 | Arabic: Copilot's data questions are English | "The only supported language is English."; tip: "Naming measures in English." | https://learn.microsoft.com/power-bi/create-reports/copilot-ask-data-question ; .../copilot-semantic-models | live | opened |
| A3 | Gulf: Copilot's processing can leave the region | a UAE capacity maps to US Azure OpenAI; a cross-geo setting, off by default outside US/EU | https://learn.microsoft.com/fabric/fundamentals/copilot-fabric-overview | live | opened |
| A4 | Hijri | classic time intelligence "assumes Gregorian or shifted Gregorian calendar"; the calendar-based option is preview, Umm al-Qura not named | https://learn.microsoft.com/power-bi/transform-model/desktop-time-intelligence | live | opened |
| A5 | Arabic readers ask for right-to-left reports | "Request for RTL Support When Embedding Reports in Arabic for GCC"; an Ideas post on text direction | https://community.fabric.microsoft.com/t5/Service/Request-for-RTL-Support-When-Embedding-Reports-in-Arabic-for-GCC/td-p/4367113 | not seen | snippet |

Not confirmed by any source I could read: "AI reports look generic"; Arabic numerals or shaping problems; anything on
Gulf weekends. Weak (vendor blogs only): "the same question, different answers".
**What the evidence says in one line:** building is no longer the hard part (E11 is being met by Microsoft's report
skill); the open pain is E1 to E8: the result looks right and nobody but a careful human can say whether it answers
what was asked. A1 to A4: in Arabic the person cannot even ask Microsoft's assistant.

### 2. What the others do (read 11 Nov 2026; Y yes, N not on the page, P partly, ? unknown)
Columns: reads the model, writes the model, builds report pages, runs DAX and returns values, approval or preview
before a write, validates its output, impact analysis, tests of measures, right to left or Arabic or Hijri, handover.
| Tool | RM | WM | Rep | DAX | Appr | Val | Imp | Test | RTL | Doc |
|---|---|---|---|---|---|---|---|---|---|---|
| Microsoft Power BI Authoring MCP (was Modeling MCP) | Y | Y | N | Y | P (one confirmation per database; read-only switch) | P (DAX, BPA, transactions) | N | N | N | P |
| Microsoft report skill (`powerbi-report-cli`) + Desktop Bridge | P | N | Y | N | P (the plan "records approval"; auto mode assumes it) | Y (structure, screenshots) | N | N | N | N |
| Copilot in Power BI | Y | P | Y | Y | ? | ? | N | N | N | P |
| Tabular Editor 3 AI Assistant + MCP (Sept 2026) | Y | Y | N | Y (own data permission) | Y (preview of model changes, revert) | P | ? | N | N | ? |
| sulaiman013/powerbi-mcp 3.9 (its README's claims) | Y | Y | Y | Y (PII masking) | P (dry run, undo) | P | Y | Y (DAX tests) | N | Y |
| data-goblin power-bi-agentic-development + pbir | Y | Y | Y | Y | N (hooks) | Y | P (downstream reports) | N | N | N |
| MinaSaad1/pbi-cli | Y | Y | Y | Y | P | Y | N | N | N | Y |
| Fab Inspector (PBI Inspector v2) | N | N | N | P | n/a | Y (rules) | N | P | N | N |
| Semantic Link Labs 0.18.1 | Y | Y | P | Y | N | P (two BPAs) | P | N | P | N |
| Measure Killer 3 | Y | P | N | N | ? | N | Y | N | N | Y |
| DataArcus 0.3.3 (ours: mcp/TOOLS.md) | Y | N (a calendar, with approval) | Y | N by design | Y (its own window, every file) | Y | Y (HX2) | N | Y | P |
Sources: https://learn.microsoft.com/en-us/power-bi/developer/mcp/mcp-servers-overview (2026-09-24),
https://github.com/microsoft/powerbi-modeling-mcp, https://learn.microsoft.com/en-us/power-bi/developer/agentic/power-bi-report-skill-overview
(2026-09-18), .../power-bi-desktop-bridge-overview (2026-09-21), .../create-reports/copilot-introduction (2026-08-24),
https://tabulareditor.com/blog/tabular-editor-3-september-2026-release (2026-09-23), https://github.com/sulaiman013/powerbi-mcp,
https://github.com/data-goblin/power-bi-agentic-development, https://github.com/MinaSaad1/pbi-cli,
https://github.com/NatVanG/PBI-InspectorV2, https://github.com/microsoft/semantic-link-labs, https://www.measurekiller.com/.
Snippet only: SemanticOps MCP (not opened by this session on purpose beyond its public README), pbir-utils, Sentinel.

**Gaps none of them fill** (internal words; none of this is a public sentence):
- G1 **Nobody holds the person's question.** Every check is of structure (schema), of syntax (DAX), of the picture
  (a screenshot) or of practice (BPA). None says "this page answers what you asked" or "this visual cannot answer
  anything on this model". Microsoft's skill records a plan's approval and does not check the result against it.
- G2 Meaning-level mistakes in a visual (E1 to E4): fields that validate, draw, and are wrong together.
- G3 Right to left, Arabic, Hijri: no page mentions them (ours does).
- G4 Structure only by design: every DAX-capable tool hands values to the model's provider (E12).
- G5 An approval with a preview on the report layer (ours has it).
- G6 Model text as untrusted input: no page describes a defence.
- G7 A handover a non-technical owner can read: only data dictionaries.

### 3. Five ideas, ranked
**1. The brief check: the person's questions are the report's acceptance test (the winner).**
- Pain: E1 to E4, E6, E8, G1, G2; in Arabic A2 (the person cannot ask in Arabic at all).
- Idea: the questions the report must answer, as the person said them (English or Arabic), each tied to the measure
  and the "by" columns it needs (Claude proposes the tie with suggest_fields, the person confirms it). Then three
  answers from the files only: (a) can this model answer it at all (the names exist; a filter on each "by" column can
  reach the measure: else every row shows one value, E2 and E3); (b) which visual answers it, which only shows the
  measure otherwise, which question nothing answers; (c) for ANY report, whoever built it: the visuals that ask
  something the model cannot answer. Later the same list says which QUESTIONS a model change can move (HX2 in the
  person's own words) and becomes the handover (G7).
- Why nobody does it: their unit is the file, the measure or the picture; a question needs the model's graph and the
  report's queries joined, and a promise not to run anything.
- Why DataArcus can: the model's graph with relationships and their direction is built (`modelGraph`,
  mcp/lib/lineage.mjs:54, the health check's own `graphStep`); each visual's fields by role are read (`questionOf`,
  mcp/lib/same-question.mjs:82); the rule already guards DataArcus's OWN plans (`reached` and `reachTable`,
  assets/js/field-catalog.js:470 and :497; `switchReach`, mcp/lib/metric-switcher.mjs:60) but no check applies it to
  a report someone else built (measured: `grep` for it in check-report.mjs and report-rules.js finds nothing); the
  approval window can show and keep the list (mcp/lib/plans.mjs:45 `propose`); Arabic text is read as typed.
- What a user sees: "7 questions: 3 answered, 1 partly, 1 not answered, 2 this model cannot answer. «الهدف حسب
  المنطقة»: Store[Region] cannot filter [Target] (no relationship reaches Targets): every bar would show one value."
- First stage: a pure module and its suite, half a day (this job). Risk: the rule is a rule (the relationships a
  filter travels), not a Desktop measurement: in doubt it must say "cannot tell", never accuse; one laptop run on a
  made-up model before any public word. The tie from words to fields is the AI's and the person's, not proved.
**2. The change receipt: what did the agent change, in plain words.** Pain: E9, E10; Microsoft's skill says to commit
a git baseline first. Idea: a snapshot before any agent's session, a receipt after (model and report, with what can
move). Why it loses: HX1 and HX2 already built its core (mcp/lib/impact.mjs:36) and it is inside-out ground (IX1's);
git and Tabular Editor's preview cover part of it. It is the next step of what exists, not a new kind of thing.
**3. Where an AI must guess: names an assistant would confuse, in English and Arabic.** Pain: E7, A2. Why it loses:
Microsoft's "Prep data for AI", two BPAs and Tabular Editor already live there; and what Copilot does with a name is
not ours to measure ("measured, not estimated": mcp/CLAUDE.md), so every finding would be an estimate.
**4. The instruction screen as a check: text in a model that could steer an AI.** Pain: G6, E12. We have the screen
(`readsLikeInstruction`, mcp/lib/model-names.mjs:63). Why it loses: I found no public evidence that practitioners feel
this today (no forum pain, only a conference abstract); a pattern screen shown as a check promises more safety than
it gives.
**5. The handover sheet for the report's owner, English and Arabic.** Pain: G7. Why it loses alone: without content
of its own it is a document generator, which others have (data dictionaries). With idea 1 it has content nobody else
has (the questions and their answers), so it is the winner's stage 4, not a rival.

## Phase 2 plan (written 2026-11-11T15:35Z, before any code)
- New, pure: `mcp/lib/brief.mjs` (imports lineage.mjs's `modelGraph`, same-question.mjs's `questionOf`, read-report's
  `safeName`, model-index.js's `K`; no fs, no env). No existing module edited. No tool loads it.
  - `visualsOf(model, report)`: each visual's numbers (measures, aggregations) and groups (columns, levels).
  - `checkVisuals(model, report)`: each (number, group) pair: `moves`, `one value` (no filter path from the group's
    table to any table the number reads, and its DAX does not name that table), `constant` (reads no table),
    `not in the model`, `cannot tell` (a report measure, a field parameter, a calculation group, an unresolved name).
    USERELATIONSHIP or CROSSFILTER under the number: every relationship counts both ways (lineage's own rule).
  - `checkBrief(model, report, questions)`: each `{ id, measure, by: [] }`: `answered` (a visual shows the measure
    by exactly those columns), `partly` (the measure is shown, not by those), `not answered`, `cannot answer` (a name
    not in the model, or a "by" that cannot move it; the visuals that show it anyway are named). Ids and names only:
    the question's text stays with the caller.
- Suite `ox1` (`mcp/test-0.3.3-ox1.mjs`, area checker), on Souq (fixtures/hx1-souq.mjs, read only) plus a made-up
  "AI-built" page of 6 planted visuals. **Expected, by hand: about 45 checks.**
| # | case | expected |
|---|---|---|
| B | Souq as it is | 6 pairs (month x Revenue, region x Net Revenue, category x Units, category x Avg Price, month x Growth %, city x Sum of Line Margin), all `moves`; 0 findings |
| P1 | [Target] by Store[Region] | one value (Targets is related to nothing) |
| P2 | Staff[Name] with [Revenue] and [Headcount] | Revenue: one value (Staff is on the many side of Store); Headcount: moves |
| P3 | [Headcount] by Product[Category] | one value |
| P4 | [Headcount] by Store[City]; [Returns Value] by Calendar[Month] | moves, moves |
| P5 | a card of [Net Sales] | not in the model |
| P | the AI-built report in all | 12 pairs: 9 move, 3 one value; 1 name not in the model |
| X | edges | Staff to Store both directions: P2's Revenue moves; a measure naming Store (TREATAS): P1 moves; USERELATIONSHIP with an inactive relationship: moves; a constant measure: `constant`; a field parameter, a calculation group, a report measure: `cannot tell`; a hierarchy level: its table |
| Q | 7 questions (2 in Arabic) on the AI-built report | 3 answered (Revenue by month; Net Revenue by region; total Revenue on a card), 1 partly (Units by city), 1 not answered (Margin by brand), 2 cannot answer (Target by region: one value, shown anyway by 1 visual; Net Sales: not in the model) |
| S | safety | no hash, no question text, no literal in an answer; names through safeName; inputs not changed; null inputs do not throw |
- Demo: `mcp/lab/ox1-brief-demo.mjs` prints the sheet for the 7 questions. MODULES.md row, tests.json line, WORK.md.

## Result (stage 1, 2026-11-11T15:40Z)
**Before -> after.** Before: no part of DataArcus (and no tool in the table above) says whether a visual someone else
built can answer its own question; the rule guarded only DataArcus's own plans (assets/js/field-catalog.js:497).
After: `lib/brief.mjs` (pure, 3 exports and their constants; no tool loads it) answers it for any PBIR report and for
a list of questions. Nothing a tool writes or answers changed: no existing module's code was edited (0 export lines
added); the diff is brief.mjs, its suite, its demo, one tests.json line, one MODULES.md row, WORK.md, this note.
The demo's output (made-up Souq; run on this branch):
```
1. The visuals: 7 of 10 pairs of a number and a column it is grouped by: the column can move the number; 3 would show one value on every row (listed).
   - ai / bar-target-by-region: No relationship lets a filter on Store reach what [Target] reads (Targets), and its DAX does not name Store: every Store[Region] would show the same [Target].
2. The questions: 3 of 7 questions answered by a visual; 1 partly; 1 not answered; 2 this model cannot answer as asked. 6 visuals with a number are tied to no question.
   q3  الهدف حسب المنطقة  ([Target] by Store[Region]): CANNOT ANSWER. ... Shown anyway by ai / bar-target-by-region.
   q4  Margin by brand  ([Margin] by Product[Brand]): NOT ANSWERED. The model can answer it; no visual shows [Margin].
   q5  Units by city  ([Units] by Store[City]): PARTLY. [Units] is shown, but no visual groups it by exactly Store[City].
```

## Stages 2 to 4 (each a builder job of a day at most; none starts before the owner's yes)
2. **The check, through a tool (held).** `check_report { path, brief }`: a section `briefCheck` beside `impactCheck`,
   capped like it (60 listed, 16,000 characters); the "one value" findings for every report even without questions;
   question names parsed by impact.mjs's `parseReach`; report measures read (lineage's own nodes) instead of "cannot
   tell"; TOOLS.md, PRIVACY.md, CHANGELOG. Before it: one laptop run of the rule on a made-up model (For the owner 2).
3. **The brief kept with the report.** `plan_layout` and `create_report` take the questions; the approval window shows
   "what this report will answer" and what it cannot, before the click; the list is written with the report's files
   only at approval, so a later check reads it without being told again. The Arabic words, approved first.
4. **Questions in the Impact check, and the handover sheet.** `againstModel` says which QUESTIONS a model change can
   move (HX2's chains, in the person's words); one sheet, English and Arabic, for the report's owner: each question,
   its answer's place, what was checked and what was not.

## Decisions I made
- The winner is the brief check, not the change receipt (idea 2): the receipt's core is HX1 and HX2 and is IX1's
  ground; the evidence (E1 to E8) is about meaning, which no tool in the table checks.
- Stage 1 takes a question as names (`{ measure, by: [{ table, column }] }`), not as words: tying words to fields is
  the assistant's proposal and the person's confirmation (stage 3's window); a library that guessed it would be an
  estimate. The question's text never enters the module (test S2), so no typed text is echoed by it.
- In doubt, no finding: USERELATIONSHIP or CROSSFILTER anywhere under a number makes every relationship count; a
  report measure, a field parameter and a calculation group are "cannot tell"; a constant is counted, never listed.
- "Answered" is strict: the measure grouped by exactly the question's columns. Revenue by month and region does not
  answer "Revenue by month" (it is "partly"); the owner may want it looser (For the owner 4).
- The suite reads fixtures/hx1-souq.mjs (HX1's made-up model) and adds its planted page in the test itself: no new
  fixture file, no edit of HX1's. `used by` in MODULES.md is "none (a test)", as HX1's row was before a tool read it.
- WORK.md's line is "OX1." only: the file was 12 characters under its 3,200 cap (measured: 3,207 with 7 more).
- The rule is lineage.mjs's (one side to many side, both when the relationship says so), walked here per pair because
  lineage's `relsFor` answers per visual; the graph itself is `modelGraph`, not a copy.

## For the owner
1. Is the brief check the direction you want built next (stages 2 to 4 above)? yes / no.
2. May the next laptop batch include one run that measures the "one value on every row" rule in Desktop on a
   made-up model (three charts: a missing relationship, the many side, an inactive relationship)? yes / no.
3. May a builder draft the Arabic words for the verdicts and statuses («قيمة واحدة في كل صف», «مُجاب», «غير مُجاب»:
   examples only, not approved) for your approval? yes / no.
4. Should "Revenue by month and region" count as answering "Revenue by month"? (today: partly) yes / no.
5. A proposed public sentence, held: "DataArcus checks, from the files only, whether each chart's columns can
   actually change the number it shows on your model, and which of your questions a report answers." Approve after
   stage 2 and the laptop run? yes / no.

## Risky changes
none (a new library no tool loads, its suite and a demo; no existing code edited).

## Seen, not in scope
- `mcp/tests.json`'s `affected` block has the keys `everything` and `areas.checker`, `areas.model`, `areas.report`
  twice each (lines 20 to 28 on c2c868dc): JSON keeps the last, so the first lists are dead text. Not touched.
- The picker's reach rule (assets/js/field-catalog.js:470, by regular expressions) and lineage's graph (by the DAX
  tokens) are two readings of "what a measure reads"; brief.mjs uses the graph. One home for both is a later job.
- microsoft/json-schemas issue 573 (a schema URL that answered 404) was closed on 2026-09-14: nothing to do.
- Microsoft's Desktop Bridge setting is on by default (Learn, 2026-09-21): worth a line in MICROSOFT-WATCH.

## Lessons for the reviewer
- community.fabric.microsoft.com answers 403 to every scripted read: forum evidence can only be a search snippet,
  undated. A research brief should say so up front, or the builder spends calls finding it out.
- The root `npm run lint` needs `npm ci` at the repo root in a new clone (`globals` missing otherwise); `mcp/` has no
  lint script.
- A WORK.md near its cap leaves a builder room for a job code only; the reviewer may want to archive a line first.
- `node scripts/test-site-config.mjs` reads tracked files only: run it after `git add`, not before. My first CI run
  (43050778385) was red on website-checks for one em dash in the new suite (an escape the editor wrote as the
  character; the local run before staging said PASS). Fixed at the cause: the check builds it from its code point.
