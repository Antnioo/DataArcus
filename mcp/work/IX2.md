## Summary
- **Approval:** the owner, 11 Nov, D-1111-17 ("go you have all night to finish everything we got so far also don't
  overlook the seen not in scope") and D-1111-16 ("go for your recommendations": IX2 then OX2; stage 3 not yet; the
  site page after IX2; the Arabic words later). Relayed by the hub, session_015Q77oNR7YVFznptSuZoZZ2.
- **Base:** `feat/0.3.3-ix2` from `origin/integration/0.3.3` at 274a3d40 (IX1 merged). Push only this branch; never
  merge, no PR.
- **Scope:** IX1's "Next stages" 2: `check_report` option `likeForLike: { year, country }`, section `likeForLike`
  beside `impactCheck`, read through `impact.mjs`'s one reading, capped; `CF` exported from
  `assets/js/health-confirm.js` (its .min.js and stamps) and IX1's `callsOf` removed; a calculation group's items read;
  IX1 "Seen" 5 (gulf-dates rows to 1460, only from a primary Umm al-Qura source) and 7 (the 60-character cut in
  `lacking`); TOOLS.md, PRIVACY.md, CHANGELOG, MODULES.md rows, tests.json's line (not the `affected` block). Not:
  stage 3, stage 4, the Arabic wording (drafts under "For the owner").
- **Expected checks:** new suite `ix2` (area checker), about 33 checks, red on the base first; ix1 64, hx1 59, hx2 43,
  sp27 25, fn1d 125 unchanged; tl1 51 with its saved tools/list shape given the one new property (said per test);
  tk1 15 with tools/list under its 61,000 cap (58,837 before); `node scripts/check-modules.mjs --strict` PASS;
  check-contracts, test-contracts, check-result-lines, check-agent-memory, check-min, test-site-config PASS; the
  website suites that load health-confirm.min.js (sp27, model-health, theme-generator, theme-logo) alone after
  build:min; lint exit 0; CI on the branch.
- **Resume:** code committed and pushed; next CI on the branch (merge integration in once first if it moved).
- **Got:** `ix2` 33 checks (red on 274a3d40 first: 28 of 33); everything in "Expected checks" PASS as listed in
  "Results"; tools/list 58,837 -> 59,624. IX1 "Seen" 7 closed; "Seen" 5 not done (Decisions 8).

## The plan (written before the code, 2026-11-11)
1. **The lens.** `impact.mjs` gets `readOnModel(path, option)` (the report through the reading block and its own model
   through `loadModel`, refused when definition.pbir names no model folder) and `likeForLike(path, opts, read)`;
   `impactCheck` takes the same `read`. `check-report.mjs`'s reading step reads once when `againstModel` or
   `likeForLike` is given and hands the read to both. The section is `like-for-like.mjs`'s answer, with `unread` when
   a model or report file was not read fully; cut to `SECTION_MAX` (16,000) and, last, inside the answer's cap.
   With `lens: "arabic"` the option is refused (the lens runs instead of the checks).
2. **The schema.** `likeForLike: { year (integer 1900-2100), country (gulf-dates.js's weekend list: uae, ksa, kwt,
   qat, bhr, omn, shj) }`, both optional, strict; a year outside 2018-2030 is answered "not known", as IX1 does.
3. **One reader.** `health-confirm.js` exports `CF` (frozen) beside `pleaseConfirm`; `like-for-like.mjs` reads calls
   with `CF.lex` and `CF.calls`, dates with `CF.reference`; `callsOf` deleted. IX1's 64 checks are the proof nothing
   moved.
4. **Calculation groups.** Each item's DAX scanned; a visual reaches the items through the group's table node (the
   lineage puts it under the group's column, as a field or a filter). Rows `Table[Item]`, kind `calculation item`,
   no base (SELECTEDMEASURE), no Ramadan partner.
5. **Caps.** visuals 60 (`notListed`), measures 60 (`measuresNotListed`), lacking 60 (`lackingNotListed`), a visual's
   comparisons `WHY_MAX` 6 (`more`), the distances compared 4 (`calendarNotListed`).
6. **"Seen" 7.** `lacking` names through `shownName(name, NAME_OUT)`: whole to 200 characters, a longer one ends "…".
7. **"Seen" 5.** Rows 1452 (its Eids) to 1460 only from the Umm al-Qura calendar's own publication (ummulqura.org.sa,
   King Abdulaziz City for Science and Technology), each cited; a row I cannot read there is not added.

### Expected numbers (worked out from IX1's table and fixture before the code)
| # | check | expected |
|---|---|---|
| T1 | Souq Gulf as a .pbip, `likeForLike: { year: 2026 }` | 4 of 16 visuals, IX1's 2026 sentence word for word; 5 months a year back, then a month back; lacking [Cost Last Ramadan], [Units Last Ramadan]; 6 measures |
| T2-T3 | the UAE 2022; no year | 12 months and the weekend sentence; 41 of 144 months, no month listed |
| T4 | the section against the library on the same files (Oman 2026) | equal |
| O1 | with `againstModel` too | both sections; the model and report files opened as often as for `againstModel` alone |
| G1-G5 | a group "Time Intel" (Current, PY, PM): a matrix by its column; a page filter on it; no visual on it; through the server | 5 visuals (PY and PM on the matrix); 10 (the 8 of that page and the overview's 2); 4; 5 |
| N1-N2 | a 70-character base; a 250-character one | "<base> Last Ramadan" whole; cut at 200 with "…" |
| C1-C4 | 86 comparison measures; one visual with 80; 82 lacking; 404 visuals | 60 + 26 counted; 6 + 74; 4 distances + the rest; 60 + 22; under 40,000, never truncated |
| Q1-Q4 | a wrong year, an unknown country, an extra key, a fraction; no option; no model folder; with the Arabic lens | refused by the schema; no section; refused naming likeForLike; refused, said why |
| S1 | a canary in a comparison's DAX and a page filter | in no answer |
| tools/list | tk1's K4 cap 61,000 | under it; the size before and after said |

## Before -> after (2026-11-11T18:19Z)
- **Before (274a3d40).** `check_report` had no word for like for like: IX1's library answered only in a test and a
  demo. Three readers of a DAX call (`tokenizeDax`, `CF` unexported, IX1's `callsOf`); a calculation group's items
  were said "not seen"; `lacking` cut a long name at 60 characters, " Last Ramadan" with it; `measures`, `lacking`, a
  visual's comparisons and the distances were not capped. tools/list 58,837 characters (check_report's entry 3,550).
- **After.** `check_report` with `likeForLike: { year: 2026 }` on Souq Gulf written as a .pbip answers, in section
  `likeForLike` after `impactCheck`, IX1's sentence word for word: "4 of 16 visuals compare with the same Gregorian
  dates of another period (through [Revenue LY], [Revenue PM], [Units LY (report)], [Units PY]). One year back, 2026
  against 2025: 5 of 12 months are not like for like in the Gulf (February: 11 Ramadan days against 0; ...)". The
  section is `like-for-like.mjs`'s own answer on the files the reading block read (T4, equal on Oman 2026), read once
  beside `againstModel` (O1b: the model and report files opened as often as for `againstModel` alone). One reader:
  `CF` exported (frozen) from `health-confirm.js`, `callsOf` deleted, IX1's 64 checks unchanged. A calculation group
  "Time Intel" (Current, PY, PM): a matrix by its column lists `Time Intel[PY]` and `Time Intel[PM]` (5 visuals); a
  page filter on its column lists that page's 8 visuals (10 in all); a group no visual uses adds none.
  `lacking` gives a 70-character base's "<base> Last Ramadan" whole; past 200 characters it ends "…". Every list
  capped: 60 visuals, 60 measures, 60 lacking, 6 comparisons a visual, 4 distances, the rest counted; 404 visuals
  answer under 40,000 characters, never truncated. tools/list 58,837 -> 59,624 characters (+787; cap 61,000;
  check_report's entry 3,550 -> 4,337).
- **Nothing else a tool answers changed:** without `likeForLike` no new key (Q2; fn1e's 590 recorded checks, hx2's
  43 unchanged).

## Results (from the runs' own output, on the code commit (base 274a3d40))
- `ix2` PASS 33 checks; red on 274a3d40 first: 28 of 33 failed (the option unknown to the schema, no CF export, no
  calculation item, no caps, no words); Q1 and Q4 were then tightened so they cannot pass on the base for the wrong
  reason (an unknown key's refusal no longer counts).
- `npm test -- checker` exit 0: 17 suites (check 31, test-0.3.1-checker 23, arabic-lens 31, p3a 21, tb2 17,
  validator-gap 5, sq5 22, pf3 7, fn1e 590, sp20 7, sp41 24, same-question 41, hx1 59, hx2 43, ix1 64, ix2 33, ox1 57).
- tl1 PASS 51 (red with the new option first: Z1 and S2 "check_report.properties.likeForLike: only now"; its saved
  shape `fixtures/tl1-tools-list.json` got exactly the new property, 23 added lines, taken from a TL1_RECORD run and
  put into the saved file by hand; nothing else in it changed). tk1 PASS 15 (K4: 59,624 under 61,000). sp27 25,
  fn1d 125 unchanged.
- The other suites that read these files, each alone: v029a4 41, v029checks 37, v029d 22, v029i 36, 0.3.0-claims 752,
  powerbi-2026-10 26, sweep-s1 30, bd1 18, mutation 250 (99 mutants, all killed), sq14 15, sq9 21, write-gate 7, op1 16,
  lk1 23, sg1 69, fuzz 8199 (600 cases), round22 58; `test-validator.mjs` is a helper (exit 0).
- Website, each alone after `npm run -s build:min`: sp27 3, model-health 259, theme-generator 922, theme-logo 753.
- `node scripts/check-modules.mjs --strict` PASS 1249 (224 files, 224 rows); check-contracts PASS 858;
  test-contracts PASS 14; check-result-lines PASS 249; check-agent-memory PASS; check-min (stamps) PASS 1267;
  `node scripts/test-site-config.mjs` PASS; `node scripts/changelog-words.mjs` PASS 54; lint exit 0.

## CHANGELOG line
- **Like for like in the Gulf:** `check_report` with `likeForLike` (a year, a Gulf country) names the visuals whose number
  compares with the same Gregorian dates of another period, the months of that year whose Ramadan or Eid days differ from
  the months they are compared with, and the "Last Ramadan" measures the model lacks. Names and dates only, never values.

## Decisions I made
1. **One reading, shared:** `readOnModel` in `impact.mjs`; `impactCheck` and `likeForLike` take its result. With
   both options the refusal for a report without a model folder names `againstModel` (it is asked first).
2. **`CF` exported frozen,** so no caller can change the reader for the health check. The 13 files `build:min`
   changed are its stamps (5 pages, 4 engines and their .min.js), as IX1 measured.
3. **A calculation item is a row, not a measure:** `measure` holds `Table[Item]`, `kind` "calculation item", no base,
   no Ramadan partner (SELECTEDMEASURE has no name to pair). A group applied another way (a bookmark, the service) is
   still not seen: `notProved` says so.
4. **The Arabic lens and likeForLike together are refused** (the lens runs instead of the checks; silently dropping
   the option would hide it). Other options with the lens are as before.
5. **The year is checked 1900 to 2100 by the schema;** a year outside the dates (2018 to 2030) is answered "not known"
   by the engine, as IX1 does: one place decides the range (gulf-dates.js).
6. **`lacking` through `shownName(name, NAME_OUT)`** (the reading block's own screen and 200-character cut, the cut
   marked "…"), not a new helper. The base's label elsewhere stays at 60, marked "…".
7. **CALENDAR_MAX 4** distances (a report compares a year, a quarter, a month back; a fourth is rare); the rest counted.
8. **"Seen" 5 not done: no row added to gulf-dates.js.** Reading the Umm al-Qura calendar's own conversion service
   (the site ummulqura.org.sa, its API at umqserv.kacst.gov.sa) was refused by this session's permission check, and the
   brief allows a row only from a primary source I can read; the site's page itself is a script that shows no date
   without that service. The estimates the table holds came from ICU's `islamic-umalqura` calendar, a copy, not the
   publication. So 2031 still cannot be compared ("For the owner" 3).
9. **CONTRACTS.md unchanged:** no helper was added and no family moved; one copy (`callsOf`) was removed in favour of
   the existing reader. check-contracts and test-contracts pass.
10. **tests.json: the suite's line only;** the `affected` block untouched (SN1's).

## For the owner
1. **Yes / no:** the Arabic words, after 18 Nov. Each new English sentence an answer can carry, with its draft (nothing
   ships in Arabic; D-1109-07):
   - "likeForLike is a section of the checks, and the Arabic lens runs instead of the checks: call check_report once
     with lens "arabic" and once with likeForLike. Nothing was checked." Draft: «likeForLike قسم من الفحوص، والعدسة
     العربية تعمل بدلًا من الفحوص: استدعِ check_report مرة بالعدسة "arabic" ومرة بـ likeForLike. لم يُفحص شيء.»
   - "check_report's likeForLike reads "<report>" on its own model, and its definition.pbir names no model folder
     (byPath): give a report saved with its model (a .pbip project). Nothing was compared." Draft: «يقرأ likeForLike في
     check_report التقرير "<report>" على نموذجه، ولا يسمّي ملف definition.pbir مجلد نموذج (byPath): أعطِ تقريرًا
     محفوظًا مع نموذجه (مشروع ‎.pbip). لم يُقارَن شيء.»
   - "model or report files that could not be read fully: a comparison or a visual in them is not counted, so more
     visuals can compare than said" Draft: «ملفات في النموذج أو التقرير تعذّرت قراءتها كاملة: لا تُحسب مقارنة أو مرئية
     فيها، فقد تكون المرئيات التي تقارن أكثر مما ذُكر.»
   - In notProved: "the items of a calculation group are read on the visuals that use the group's column (a field or a
     filter), not where the group is applied another way." Draft: «تُقرأ عناصر مجموعة الحساب في المرئيات التي تستخدم
     عمود المجموعة (حقلًا أو فلترًا)، لا حيث تُطبَّق المجموعة بطريقة أخرى.»
   - The section's main sentence is IX1's; its drafts are in IX1's "For the owner" 4.
2. **Yes / no:** keep refusing `likeForLike` with `lens: "arabic"` (Decision 4), or run the lens and drop the option
   with a note.
3. **Ask:** the Umm al-Qura dates for 1452 (Eids, 2031) to 1460: either allow this session's network to reach the
   calendar's own service (umqserv.kacst.gov.sa), or read the 27 dates on ummulqura.org.sa on the laptop; until then
   2031 and later are "not known" (Decision 8).

## Risky changes
- `health-confirm.js` exports one more name (a website file): its behaviour is the same (sp27 F1, F2; fn1d 125; the
  model-health page suite 259), but 5 pages and 4 engines got new `?v=` stamps.
- `check_report`'s schema grew by one option: TL1's saved shape was given that property by hand; the reviewer can read
  the 23 added lines.

## For the laptop
Nothing new: the stage 4 Desktop run (IX1 "For the owner" 5) is unchanged. A hand check if wanted: `check_report` with
`likeForLike: { year: 2026 }` on a real .pbip that uses SAMEPERIODLASTYEAR (made-up rows only).

## Seen, not in scope
1. IX1 "Seen" 5 stays open (Decision 8): `gulf-dates.js` ends at Ramadan 1452's first day.
2. `like-for-like.mjs` still says a base measure's name at 60 characters inside `measures` and each comparison (safeName);
   only `lacking`, the names a person must create, is whole.
3. Three lists of time-intelligence functions remain (IX1 "Seen" 3): `health-confirm.js`'s `TI` (30 names),
   `field-catalog.js`'s `2026-11-11T18:19Z_DAX`, `like-for-like.mjs`'s `FIXED` and `BY_ARGS`. Each answers its own question; one
   list with flags would do.
4. `dax-reference-parser.js`'s `tokenizeDax` and `CF.lex` are still two lexers (other callers use the first); IX2 made
   one reader of a call, not one lexer.
5. `impactCheck`'s refusal and `likeForLike`'s share one sentence now; `reach` (read_model) loads the model its own way.
6. DataArcus writes `SAMEPERIODLASTYEAR` itself (IX1 "Seen" 4): stage 3's business.

## Lessons for the reviewer
- An option on a tool moves TL1's saved tools/list shape; the brief can say so ("tl1's fixture gets the property") so
  a builder does not have to choose between "never re-record" and a red tl1.
- A source a brief calls "primary" may sit behind a permission the session does not have; ask for the dates in the
  brief, or for the host, before the night starts.
- A suite that is red on the base for the wrong reason (an unknown key's refusal) passes some refusal checks by luck:
  check the message, not only `isError`.
