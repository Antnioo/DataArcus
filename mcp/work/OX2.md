## Summary
- **Approval:** the owner, 11 Nov, D-1111-16 ("go for your recommendations": OX1's asks, the brief check next, the
  Arabic verdicts drafted for approval, "Revenue by month and region" answers "Revenue by month", worded "answers it,
  split further", the public sentence held) and D-1111-17 ("go you have all night"). Relayed by the hub,
  session_015Q77oNR7YVFznptSuZoZZ2.
- **Base:** `feat/0.3.3-ox2` from `origin/integration/0.3.3` at 1e5c539a. Push only this branch; never merge, no PR.
- **Scope:** OX1's stage 2: `check_report` option `brief` and section `briefCheck` (beside `impactCheck` and
  `likeForLike`), the "one value on every row" findings for every report that names its model; question names through
  impact.mjs's `parseReach`; report measures judged through lineage's own nodes; one reading of the report and one load
  of its model for every section and step; TOOLS.md, PRIVACY.md, CHANGELOG (and SEEN-BACKLOG 35), MODULES.md,
  tests.json. Not: OX1's stages 3 and 4; no Arabic in any answer (drafts under "For the owner").
- **Expected checks:** (written before the code) new suite `ox2` about 36 checks, red on 1e5c539a first; ox1 57 with
  X10 changed on purpose; ix2 33, hx2 43, hx1 59 unchanged; tl1 51 with the one new property; tools/list under 61,000;
  the suites pinning check_report said under "Changed on purpose"; `node scripts/check-modules.mjs --strict` PASS;
  check-contracts, test-contracts, check-result-lines, check-agent-memory, changelog-words, test-site-config PASS;
  lint 0; CI on the branch.
- **Got:** `ox2` 29 checks (red on 1e5c539a first: 27 of 28 with the code stashed; the 29th, T4c, red on the base's
  lineage.mjs alone); ox1 57 (X9, not X10 as the plan said, changed on purpose); fn1e 591, sp20 8, sp41 25 (each +1,
  their base recordings unchanged); sn1 20 (T6 bound moved on purpose); every other suite naming check_report unchanged
  (72 run, "Results"); tools/list 59,592 -> 60,532; `node scripts/check-modules.mjs --strict` PASS 1251.
- **Resume:** DONE. The reviewer: review and merge (`node scripts/check-modules.mjs --strict` PASS 1251). The owner:
  "For the owner" 1 to 3. CI could not start from 20:31Z to about 21:20Z for any branch (startup_failure, the base too:
  43096526086, 43097384331, 43097861380); it ran again after.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/43104581983 on f19efb594928cac4c41256ad773c97ebffc4129a
  (2026-11-11T21:53Z; Linux 5 of 5 shards, Windows 5 of 5, the website 3 of 3 and its checks, macOS skipped by the
  workflow; origin/integration/0.3.3 274b3499 (test-0.2.9 G9) merged in once before it, v029 42 PASS locally). DONE.

## The plan (written 2026-11-11T20:10Z, before any code)
1. **One reading.** check-report.mjs reads the report once (`walk`, `diskSource`, `inventory`) and hands that reading
   to impact.mjs: `readOnModel(path, option, shared)` builds the lineage files from it (`filesOf`, the one builder) and
   loads the model through check_report's memo (`modelAt`) shared with the pending measures, the field parameters and
   the lint. Measured on 1e5c539a (a scratch count of `fs.openSync`, Souq as a .pbip): default 2 model.bim and 57
   report JSON opens; `againstModel` 4 and 100. Expected after: default 1 and at most 57; `againstModel` 2.
2. **The section.** brief.mjs's `checkVisuals` (counts, "one value" findings with why, names not in the model) and,
   with `brief`, `checkBrief`; `unread` when a file was not read fully; 60 listed, 16,000 characters, then cut inside
   the answer's cap. On every call whose report names its model when `checks` is not narrowed; with `checks` narrowed
   only with `brief`. No model folder: no section, one `notChecked` line; with `brief`: refused.
3. **The questions.** `brief: [{ id, measure, by }]` (at most 60), each name read by `parseReach`.
4. **Wording (D-1111-16).** A visual grouped by the question's columns and more: `answered`, `how: "answers it, split
   further"`, `splitBy` the extra columns; "partly" only for a visual grouped otherwise. In doubt "cannot tell".
5. **Report measures.** lineage.mjs's reading of reportExtensions.json in one exported function (`reportMeasures`).
6. **Arabic.** None in an answer; `brief` with `lens: "arabic"` refused (IX2's decision 4).

### Expected numbers (by hand, before the code) -> got
| # | check | expected | got |
|---|---|---|---|
| T1 | Souq as a .pbip, default call | 6 of 6 pairs move, 0 findings, no questions | as expected |
| T2 | OX1's AI page and the matrix | 12 pairs (14 with the matrix's 2): 9 (11) move, 3 one value, 1 not in the model | 14, 11, 3, [Net Sales] |
| T3 | 8 questions | 4 answered (1 split further), 1 partly, 1 not answered, 2 cannot | as expected |
| T4 | a report measure SUM ( Targets[Target] ) by Store[Region]; one calling it | one value, one value | as expected |
| T5 | `checks: ["schemas"]` without and with brief | no section, section | as expected |
| T6 | no model folder; with brief; with lens "arabic" | notChecked line; refused; refused | as expected |
| T7 | `lang: "ar"` | the section in English | as expected |
| O1 | files opened, default; againstModel | model 1, report <= 57; model 2 | 1 and 44; 2 and 58 |
| C1 | 83 one-value pairs; 404 visuals | 60 listed + counted, under 16,000; under 40,000 | as expected |
| Q | an extra key, 61 questions, an empty measure, no by, []; "Region" as a by | refused; not read | as expected |
| S1 | a planted literal in a DAX text and a page filter | in no answer, no hash | as expected |

## Before -> after (2026-11-11T20:29Z)
- **Before (1e5c539a).** check_report said nothing about whether a chart's column can move its number; brief.mjs was
  a library no tool loaded; a report measure was "cannot tell"; "Revenue by month and region" was "partly" for
  "Revenue by month". A default check loaded the model twice (pending measures, lint) and `againstModel` four times
  and read the report again for its section (57 and 100 report JSON opens).
- **After.** On Souq's made-up AI page, a default `check_report` answers in `briefCheck`: "11 of 14 pairs of a number
  and a column it is grouped by: the column can move the number; 3 would show one value on every row (listed); 1 name
  is not in the model." Each finding: "No relationship lets a filter on Store reach what [Target] reads (Targets), and
  its DAX does not name Store: every Store[Region] would show the same [Target]." With `brief` (8 questions, two in
  Arabic): "4 of 8 questions answered by a visual (1 by a visual that answers it, split further); 1 partly; 1 not
  answered; 2 this model cannot answer as asked." Report measures are judged (SUM ( Targets[Target] ) by Store[Region]:
  one value). One reading: the model loaded once a call (default 2 -> 1, `againstModel` 4 -> 2), the report read once
  (57 -> 44 and 100 -> 58 JSON opens). tools/list 59,592 -> 60,532 (check_report 4,337 -> 5,277; cap 61,000).
- **Lineage, too:** a report measure calling another report measure is now followed (`reportMeasures`); on the base
  a visual showing only [Mine Twice] ( [Mine] * 2 ) lost [Mine] and Targets, so the Impact check could miss a change
  under it (T4c, red on the base's lineage.mjs). hx1 59 and hx2 43 unchanged.

## Results (from the runs' own output, on the code commit)
- `ox2` PASS 29; red on 1e5c539a first: 27 of 28 (the code stashed, the suite and its fixtures kept; S1b "no hash"
  holds on the base too); Q1 tightened after it passed on the base for the wrong reason (the base refuses `brief` as an
  unknown key, quoted differently). T4c added after: red on the base's lineage.mjs (scratch run: `["x:mine twice"]`
  only, against `["c:targets|target","t:targets","x:mine","x:mine twice"]`).
- `npm test -- checker` (17 suites + ox2): check 31, test-0.3.1-checker 23, arabic-lens 31, p3a 21, tb2 17,
  validator-gap 5, sq5 22, pf3 7, same-question 41, hx1 59, hx2 43, ox1 57, ix1 64, ix2 33, ox2 29; fn1e, sp20, sp41
  red until changed on purpose (below), then 591, 8, 25.
- The other 72 suites that name check_report, each alone (`git grep -l check_report`): 71 PASS first time (among them
  0.3.0-claims 752, fuzz 8199, mutation 250 with 99 mutants all killed, lk1 23, we1 19, hx2 43, terminology-sheet 48,
  bilingual-report 34); sn1 red (T6), changed on purpose, PASS 20. terminology-sheet and bilingual-report run 3 times:
  PASS each time. test.mjs left to CI's shards.
- tl1 PASS 51 (red first: Z1 and S2 "check_report.properties.brief: only now"; the saved shape got exactly the new
  property, 33 added lines, from a TL1_RECORD run, nothing else in the file changed); tk1 PASS 15 (60,532 < 61,000).
- `node scripts/check-modules.mjs --strict` PASS 1251 (224 files, 224 rows); check-contracts PASS 858; test-contracts
  PASS 14; check-result-lines PASS 251; check-agent-memory PASS 522; changelog-words PASS 59; test-site-config PASS
  (after `git add`); `npm run lint` exit 0.

## Changed on purpose (per test)
- `test-0.3.3-ox1.mjs` X9: a report measure was "cannot tell"; now judged (SUM ( Targets[Target] ) by Store[Region]:
  one value, one finding), and "cannot tell" only when its definition was not read (both asserted). The AI page moved
  to `fixtures/ox1-ai-page.mjs` (ox1 and ox2 read it; no check changed).
- `test-0.3.2-fn1e.mjs`, `test-0.3.2-sp20.mjs`, `test-0.3.2-sp41.mjs`: every default answer on a report with its model
  now carries `briefCheck`, and a report without one a `notChecked` line. Not re-recorded: each compares the answer
  without OX2's own section (`fixtures/ox2-pins.mjs` `withoutBrief`) with its base recording, which passes unchanged
  (so nothing else moved), plus one check each on how many carried it: fn1e 42 and 4, sp20 0 and 4, sp41 10 and 2.
- `test-0.3.3-sn1.mjs` T6: tools/list bound 59,592 -> 60,532 (OX2's `brief`, measured).
- `test-0.3.3-ix2.mjs`: its project writer moved to `fixtures/souq-project.mjs` (ix2 and ox2); 33 checks unchanged.
- `fixtures/tl1-tools-list.json`: the `brief` property, nothing else.

## CHANGELOG line
- **Charts that would show one value on every row:** `check_report` now names each chart whose column cannot change the
  number it shows on your model (no relationship lets a filter on that column reach what the number reads), with why. Give
  it `brief`, the questions the report must answer as a measure by columns, and it says which a visual answers (a visual
  split further still answers it), which only partly, which no visual answers and which the model cannot answer. From
  the files only, names never values; a rule not yet measured in Power BI Desktop, and in doubt it says it cannot tell.
- (SEEN-BACKLOG 35) the first bullet now says "The measure itself is in no answer; the two layout changes it measured
  are the next two lines" (was "Nothing a tool writes or answers changes"). The tools/list bullet said 58,837: now
  60,532 with this version's options, and "the shortening itself changed no option and no answer".

## Decisions I made
1. **briefCheck runs on every default check** (the brief: "for every report even without questions"), but with
   `checks` narrowed only when `brief` is given: a narrowed call asks for those checks only, and no new `checks` value
   was added (one new property in tools/list, as the brief allows).
2. **No model folder:** no section and one `notChecked` line (never silently left out); with `brief`, refused naming
   it, as likeForLike is. A model that cannot be read: the same line, worded so.
3. **The Arabic lens with `brief` is refused** (IX2's decision 4 holds: the lens runs instead of the checks, so the
   option would be dropped silently). The lens alone is unchanged.
4. **"Answers it, split further" is `status: "answered"` with `how`**, so a count of answered questions includes it
   (the owner: "is answered"), and `splitBy` names the extra columns. It also covers a total question answered by a
   visual split by a column: the words say it is split. A non-additive measure (an average, a distinct count) split
   further does not give the total by itself; the owner may want that case "partly" (For the owner 3).
5. **The model memo is per call** (`modelAt` in check-report.mjs), not a module cache: a model edited between calls is
   read again; the Impact check's earlier model is still its own load.
6. **Report measure into report measure** is followed in lineage too (one reading, `reportMeasures`): in doubt, more;
   a `[Name]` matching another report measure counts even inside a column reference, which can only add a dependency.
7. **The recorded suites are not re-recorded:** they compare without OX2's section against the base, so they still
   prove nothing else moved (their headers say "never re-recorded to make a run pass").
8. **The question's `id` is echoed as typed** (capped and screened by safeName): it is the person's own words, like a
   title they typed, and lets them find their question; OX1's library kept no text, the tool keeps only this id.
9. **CONTRACTS.md:** no family touched (both moves stay in their file and each job had one place); check-contracts and
   test-contracts PASS. Test helpers shared in fixtures (D-1104-12): the project writer, the AI page, `withoutBrief`.
10. **WORK.md's line is "OX2." only:** with the note's link the file was 3,201 of 3,200 characters (measured).

## For the owner
1. **The Arabic words (drafts, not shipped; the answers stay English until you approve, D-1111-16, R-100):**
   | English | Arabic draft | why each word |
   |---|---|---|
   | one value on every row | «الرقم نفسه في كل الصفوف» | «نفسه» (the same) over OX1's «قيمة واحدة في كل صف», which reads two ways ("one value in each row" is how every table looks); «الرقم» because the reader sees a number; «الصفوف» with «كل» says all rows |
   | moves | «يتغيّر الرقم بتغيّر العمود» | says what moves and why; «يتحرك» (moves) would be word for word |
   | constant | «ثابت بتعريفه» | «ثابت» alone also reads "proven, established"; «بتعريفه» pins "fixed by its own definition" |
   | cannot tell | «لا يمكن الحكم عليه» | «غير معروف» (unknown) sounds like missing data; «الحكم» says the check holds back its verdict |
   | not in the model | «غير موجود في النموذج» | «النموذج» is Power BI's word (النموذج الدلالي) |
   | answered | «تمت الإجابة عنه» | over OX1's «مُجاب»: without its marks «مجاب» also reads "granted" (a prayer) and is stiff; this is the everyday form in the Gulf and Egypt |
   | answers it, split further | «يجيب عنه بتفصيل أكثر» | «مقسّم أكثر» would be word for word; «بتفصيل أكثر» is how a person says a chart shows more detail; the extra column follows, isolated: «حسب ⁨Store[Region]⁩» |
   | partly | «إجابة جزئية» | a noun phrase reads as a status; «جزئيًا» alone needs a verb |
   | not answered | «لا يجيب عنه أي مرئي» | over OX1's «غير مُجاب» (same two readings); «مرئي» is Power BI's word for a visual and says what is missing |
   | this model cannot answer | «لا يستطيع هذا النموذج الإجابة عنه» | the ARABIC-STYLE example's «لن يستطيع ... أن يجيب» pattern, in the present |
   | not read | «تعذّرت قراءة السؤال» | «لم يُقرأ» also reads "was not read (by a person)"; «تعذّرت» says it could not be |
   Approve, change or refuse each line.
2. **The public sentence (held; corrected to what was built):** "DataArcus checks, from the files only, whether each
   chart's columns can actually change the number it shows on your model, and which of the questions you give it a
   report answers." (OX1 proposed "...and which of your questions a report answers": the questions are given to the
   check, it does not guess them.) Approve after the laptop run? yes / no.
3. Should a total question ("Total revenue") count as answered by a chart that only splits it (Revenue by month), and
   should an average or a distinct count split further count as answered? Today both are "answers it, split further".
   yes / no.

## Risky changes
- Every default `check_report` on a report with its model now loads the model and adds a section (up to 16,000
  characters): the answer's cap cuts it last but one, and C2 (404 visuals) stays under 40,000, never truncated.
- The model is loaded once a call and shared by the pending measures, the field parameters, the lint and the sections
  (`modelAt`): an error loading it is kept and rethrown to each, so each says what it said before (fn1e's 590 recorded
  outputs unchanged).

## For the laptop
- The rule ("one value on every row") measured in Desktop on a made-up model: three charts (a missing relationship,
  the many side, an inactive relationship); in the batch after 18 Nov (D-1111-16). TOOLS.md says it is not measured yet.

## Seen, not in scope
- `assets/js/field-catalog.js` (the picker's reach) and lineage's graph still read "what a measure reads" two ways
  (OX1 "Seen" 2): a ledger family for the reviewer.
- `mcp/tests.json`'s `affected` block still has duplicate keys (OX1 "Seen" 1): JSON keeps the last.
- tools/list has 468 characters left under tk1's 61,000 cap: the next option will need room made first.
- `scripts/tests/report-check.mjs` printed nothing and exited 0 when run alone (it is a part `run-all.mjs` loads):
  the brief's list names it as a suite to run, so a brief could say it runs through run-all only.

## Lessons for the reviewer
- A recorded suite ("never re-recorded") can absorb a new answer key without losing its proof: compare without the new
  section and count how often it was there (`fixtures/ox2-pins.mjs`). Re-recording would have hidden any other change.
- `git stash` to prove a suite red removes a staged new test too: stash before staging, or keep the new files untracked.
- A "red on the base" check that passes on the base for the wrong reason (an unknown key's refusal) is easy to miss:
  read each base failure line, not only the count.
