## Summary
- **Approval:** the owner, 12 Nov, D-1112-05 ("... if it is the same syntax google and microsoft are using then approve
  it don't wait for me") and D-1112-06 ("okk i agree" to this job), relayed by the reviewer's hub
  (session_015Q77oNR7YVFznptSuZoZZ2). D-1109-07, D-1027-03, D-1104-12 bind it.
- **Base:** `feat/0.3.3-ar7` from `origin/integration/0.3.3` at 26cfb66f. Push only this branch; never merge, no PR.
- **Scope:** `assets/data/arabic-report-words.json` (the one term sheet: Google's word, both sources, the approval per
  concept; new concepts), `mcp/lib/arabic-terms.mjs` (the existing check, extended: the key named, the glossary rendered),
  `content/ARABIC-GLOSSARY.md` (new, rendered from the sheet), `content/ARABIC-STYLE.md` (one section),
  `mcp/work/AR7-ARABIC.md` (the 37 items, one row each), a new suite `ar7` (`mcp/tests.json`, area arabic), one
  count formatter in the shared library if both sources back it, the APPROVED lines behind each tool's own
  `lang: "ar"` path (AU1's reasons in `assets/js/tmdl-model.js` and the two-models sentence, others as the table
  decides), MODULES.md and CONTRACTS.md rows, CHANGELOG, `mcp/WORK.md`, this note. Not: tool descriptions,
  `mcp/TOOLS.md`, R-19's files.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; ar7 red on 26cfb66f first; `npm test -- arabic`
  (and model, checker, report, core where a shipped line moves an answer); the website suites of each changed asset;
  build:min; lint 0; check-result-lines, changelog-words, check-agent-memory PASS; CI green.
- **Resume:** DONE (2026-11-12T22:00Z): the tip is ready to merge; nothing left on this branch. The held rows wait for the owner.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/43312241764 on afadc4368a5be1b08beffc34ac0da797972453ff (2026-11-12T22:00Z; conclusion success: Linux 5 of 5 shards, Windows 5 of 5, the website checks and 3 suite shards, lint; macOS skipped by the workflow; integration had not moved from 26cfb66f, no merge). DONE

## Plan (written before any work)
1. Sources first, measured: for each key term of the 37 items, fetch Microsoft's Arabic page (learn.microsoft.com/ar-sa)
   and Google's Arabic page (support.google.com ?hl=ar, cloud.google.com ?hl=ar, CLDR for plural forms) and record the
   word each uses, the URL and the date read. A term passes when both use it, or when it is already the owner's own
   (ARABIC-STYLE.md rule 2 and 5, WORK.md's E2 list). A sentence passes when every key term passes and it follows the
   pattern of their own messages; otherwise HELD, both sources side by side.
2. One source for terms: the existing sheet (`assets/data/arabic-report-words.json` `concepts`, read by
   `mcp/lib/arabic-terms.mjs`, checked by `test-0.3.1-arabic-terms` and `scripts/test-arabic-terms.mjs`). No second
   list (D-1104-12): the sheet gains `google`, `googleSource`, `read`, `approval`, `used`; the glossary file is rendered from it
   and a check fails when the file and the sheet differ.
3. The check names the file, the key and the word (today: the file, the line and the word); planted wrong word seen red.
4. Ship only APPROVED lines, each with a test red on the base; HELD lines stay English.
5. Counts: one formatter on `Intl.PluralRules('ar')` only if Microsoft and Google both write Arabic counts with CLDR's
   six forms.

## Expected numbers (before the work)
- 37 rows in `AR7-ARABIC.md`, one per I- id of the brief; every row APPROVED or HELD, none blank.
- Every concept of the sheet (30 today) keeps its Arabic; `test-0.3.1-arabic-terms` keeps passing with more checks
  (one AT-1 and at most one AT-2/AT-3 check per new concept); no existing expected number changed by hand.
- The verdict counts are measured, not guessed: written under "Before -> after" when the sources are read.

## Before -> after (measured 2026-11-12T21:20Z)
- The 37 items (`mcp/work/AR7-ARABIC.md`, one row each): 7 APPROVED (I-1112-1001, -1004, -1006, -1050, -1053, -1679,
  -1680), 30 HELD. Before: all 37 open, every line English in the code.
- Shipped Arabic, each behind the path its tool already has:
  - `assets/js/tmdl-model.js` WHY.missingTable (the website's Health Check in Arabic, `read_model` and
    `check_model_health` with lang "ar"): English sentence on the Arabic side -> the approved Arabic.
  - `assets/js/model-health-worker.js` modelsSaid (the website, a zip with more than one model): `ar: en` -> the
    approved Arabic, the count through the new formatter, each folder name and "ZIP" isolated (FSI ... PDI).
  - `mcp/lib/read-words.mjs` NO_MODEL_NAMED and NO_MODEL_AT with no model to list, lang "ar": English -> Arabic.
- The term sheet: 30 concepts -> 44; every concept says why it stands: 17 both use (D-1112-05), 25 the owner's own,
  2 with one source (relationship, VAT; read from `content/ARABIC-GLOSSARY.md`'s last line). No existing Arabic term changed.
- The term check: a failure named the file, the line and the word -> also the key (`fileHits` gives `key`).
- Counts: no formatter -> `assets/js/arabic-count.js` (`arCount`, CLDR's six forms), one user (the two-models sentence).
- Sources: Microsoft Learn's Power BI docs under /ar-sa/ answer in English (16 pages fetched), so Microsoft's Arabic
  was read from the Arabic training units that carry Arabic and from support.microsoft.com/ar-sa; Google's from
  support.google.com ?hl=ar and developer.android.com ?hl=ar. Looker Studio and BigQuery pages answer in English.

## Arabic approved by D-1112-05 (both sources read 2026-11-12; the links are in AR7-ARABIC.md, rows and "Sources")
1. «يذكر model.tmdl هذا الجدول، ولا يوجد في المشروع ملف يعرّفه». Why each word: «يذكر» not «يسمّي» (reads two ways, AU1's
   own choice); جدول, مشروع, ملف: Microsoft (M1, M9, M3) and Google (G1, G8) both; the frame «لا يوجد» both (M1, G12).
2. «يحتوي ملف ZIP هذا على نموذجين دلاليين: قرأ الفحص أدناه A؛ ولم يقرأ B. التقرير المقروء هو تقرير A (R)، ولم تُقرأ تقارير
   النموذج الآخر. لفحص نموذج آخر، ضع مجلد مشروعه وحده في ملف ZIP.» (no report: «لم يُقرأ أي تقرير: لا يمكن أن يُعرف أي
   تقرير في ملف ZIP يخص A.»). Why: «ملف ZIP» over the draft's «الملف المضغوط» because it is the word BOTH write (M3, G10);
   Google keeps «مضغوط» for .gz files (G11). «نموذجين دلاليين», «نماذج دلالية»: the owner's terms. «ضع ... في ملف ZIP»
   not «اضغط» (reads "press").
3. «لا يوجد نموذج باسم "X" في مجلد العمل Y. أعطِ read_model مسار مجلد مشروع، أو "." لمجلد العمل نفسه.» and «لا يوجد شيء
   في "X" داخل مجلد العمل Y. أعد استدعاء الأداة بمسار مجلد مشروع (نسبةً إلى مجلد العمل)، أو "." لمجلد العمل نفسه.»: the
   owner's approved sentences of 10 Nov with the English's other ending; the one new phrase is «مجلد مشروع» (both).
4. Counts by CLDR's six forms (Microsoft M13, Google G14, G15): «نموذج دلالي واحد، نموذجين دلاليين، 3 نماذج دلالية،
   11 نموذجًا دلاليًا، 100 نموذج دلالي».
5. "…" round a name in a tool answer, as both write it (M3, M4, G2, G17): no change needed.
6. Glossary terms both use: chart, measure, column, page, report, weekend, legend, table, row, field, file, folder,
   project, zip file, alt text, option, full screen (each row of the glossary has both links).

## Tests
- `ar7` (new, area arabic): 45 checks; red on 0f2b5d36 first (the plan commit, code equal to the base 26cfb66f: 31 of
  45 failed), green now.
- Changed on purpose, per test (R-10): `au1` R4 (pinned the English reason on the Arabic side; now the approved Arabic,
  and missingEnd still English) and W5 source and min (pinned `ar === en`; now the Arabic start); 40 checks, unchanged
  count. Website `model-health`: the two missing-table checks take the Arabic reason on the Arabic page; one new
  rendered check (the two-models note in Arabic at 390 px: right to left, inside the page, names isolated): 265 -> 266.
  `test-0.3.3-at1.mjs`: a comment only.
- `test-0.3.1-arabic-terms` 99 checks (85 before: one AT-1 check per new concept); `scripts/test-arabic-terms.mjs` 87.
- Area runs: see "Results".

## Results (run 2026-11-12T21:38Z, on afadc436)
- `ar7` 45; `au1` 40; `at1` 22; `lg2` 29; `test-0.3.1-arabic-terms` 99; `npm test -- arabic`: 21 suites passed;
  `npm test -- model core` (the mutation suite is in core): 48 suites passed.
- Website: `node scripts/tests/run-all.mjs model-health` 266 checks, alone (R-64); `scripts/test-arabic-terms.mjs` 87;
  `test-site-config` PASS; `ar-pages` (39 copies), `csp` (143 pages), `stamps` 1288, `check-min`, `sitemap-lastmod` PASS.
- `node scripts/check-modules.mjs --strict`: PASS, 1268 checks (227 module files, 227 rows). `check-contracts` 868,
  `test-contracts` 14, `check-agent-memory` 537, `changelog-words` 116, `check-result-lines` 258, lint exit 0.
- Not run: the report and checker areas (no file of theirs changed; CI runs every suite).
- The merge (R-33): origin/integration/0.3.3 was still at 26cfb66f before CI (fetched 2026-11-12T21:38Z); nothing to take.

## CHANGELOG line
Three lines under [Unreleased] in `mcp/CHANGELOG.md`: the three Arabic answers, the Arabic counts, the glossary and its check.

## Decisions I made
1. One term source, not two: the glossary file is the existing sheet rendered (`scripts/arabic-glossary.mjs --write`),
   and the check is the existing one (`mcp/lib/arabic-terms.mjs`) extended, not a second scanner (D-1104-12).
2. What "passes" means, applied the same way to every row: a key term is a noun that names a thing; it passes when both
   use it or it is already the owner's own (ARABIC-STYLE rules 2 and 5, the sheet's chosen terms). A sentence passes only
   when both sources also have a message of its kind (an absence, a failed read, a holding, a count). A verdict of
   DataArcus's own checks (impact, like for like, the brief check) has no such message in either: HELD.
3. Strict where one side is missing: «علاقة» (a model relationship) is Microsoft's only, so AU1's second reason is HELD
   although the Health Check already says «علاقة» elsewhere.
4. «ملف ZIP» replaces the draft's «الملف المضغوط» (the word both use). The site's «مشروع PBIP مضغوط» (zipped, the
   adjective) is left as it is.
5. The formatter is used only where a line was approved with a count. The older Arabic count texts (Seen 2) and
   `read-words.mjs` manyAr (the owner's approved words) are not rewritten.
6. No direction marks in tool answers (`answer.mjs` shows them as codes); the website's sentence has them. The
   missing-table reason carries none, like the six reasons beside it (it is said by both the site and the tools).
7. The Gulf like-for-like page stays held as a whole: its approved lines (-1050, -1053) ship with it (D-1027-03).
8. `mcp/work/AR7-ARABIC.md` has its own `## Summary` (check-agent-memory asks every note in `mcp/work/` for one).
9. A new required file: `assets/js/arabic-count.js` (and its .min.js), imported by `model-health-worker.js`
   (importScripts). No tool description holds a shipped Arabic line; none was edited (TB3's files untouched).

## For the owner
- May these held Arabic lines ship as drafted, each one where only the rule's letter stops it: (a) the relationship reason «تستخدم إحدى العلاقات هذا الجدول، ولا يوجد في المشروع ملف يعرّفه» (Microsoft «علاقة»; Google has no Arabic for a model relationship); (b) the Gulf page's badge «أداة مجانية · بدون تسجيل · تعمل في متصفحك» (the hub's live badge plus «أداة»), its weekend line «عطلة نهاية الأسبوع: السبت والأحد مقابل الجمعة والسبت» and its labels («مقابل»: Google only; VAT «ضريبة القيمة المضافة»: Google only); (c) «ملء الشاشة» and «الخروج من ملء الشاشة» for the build page (both use it; the page has no Arabic copy yet)? | class: arabic | risk: two-way | rec: yes to (a), (b), (c) | yes: a builder ships (a) now and (b), (c) with their pages | no: they stay English | default: they stay English
- Neither Microsoft nor Google has an Arabic term for like for like: do you keep the sheet's «كل موسم بنظيره» as the name and approve IX1's «مقارنة غير متكافئة» only as the verdict "not like for like"? | class: arabic | risk: two-way | rec: yes | yes: IX1, IX2 and IX4's verdict lines are redrafted on that and come back once | no: all like-for-like Arabic stays held until you choose one word | default: held
- The other held lines have no Microsoft or Google wording to lean on (AR7-ARABIC.md, 30 HELD rows: the Impact check's 8, the brief check's words, the lens, native copy, the two verbs, the Gulf page's statuses, sighting, not-known and privacy lines): approve them as drafted in one pass after 18 Nov? | class: arabic | risk: two-way | rec: yes, one sitting with the table open | yes: each approved row ships | no: they stay English | default: they stay English

## For the reviewer
- The hub can close I-1112-1001, -1004, -1006, -1679, -1680 (done), and -1050, -1053 (approved, ship with the page).
  -1003 stays open for -1005 only.
- The sheet's older Microsoft sources (the training units under dax-power-bi-modify-filter and others) answered in
  English when fetched on 12 Nov; for every term marked "both" a Microsoft page read in Arabic that day was added.
- A translated page's key is named only when the text sits on its key's line or the line under it; running HTML has
  no key (the file, the line and the word, as before).
- Expected check run: `node scripts/check-modules.mjs --strict` PASS (see Results).

## Risky changes
none (three texts change on the Arabic side only; English answers are byte for byte; no answer's shape changes).

## For the laptop
Optional: open the Arabic Health Check page on a phone, drop a zip with two project folders, and read the note above
the score: the folder names should sit inside the Arabic sentence without reordering it.

## Seen, not in scope
- Microsoft Learn's Arabic addresses in the sheet's older `source` lists now serve English | route: job | size: S | why: the glossary links should show Arabic; re-read each and replace
- Older Arabic count texts do not agree with their noun (calendar-generator.js «${colCount} عمود», theme-generator.js «${c.kpis} بطاقات», measure-builder.js, layout-check.js) | route: job | size: M | why: the formatter exists now; each is a shipped, approved text, so the owner decides
- `read-words.mjs` manyAr writes «12 نماذج» for 11 and up | route: backlog | size: S | why: the owner's words for 3 and up; 11 models at one level is rare
- IX2's draft writes «مرئية» where the sheet's singular is «مرئي» | route: fix | size: S | why: redraft before it goes to the owner
- OX1 and OX2 hold two different drafts for the same status ("one value on every row") | route: fix | size: S | why: one draft should reach the owner
- AR6's batch («لم يُكتب شيء») is not in this repository | route: job | size: M | why: the hub holds it; a builder needs the lines in `mcp/work/`

## Lessons for the reviewer
- "Microsoft's Arabic" for Power BI is thin: the product docs are not translated, so a both-sources rule mostly passes
  general words (table, file, folder) and holds Power BI's own (relationship, calculation group, row-level security).
- A brief that sends a table to `mcp/work/` should say it needs its own `## Summary` block.
- `git ls-files "*.min.js"` decides what build:min builds: a new engine needs its empty .min.js added to git first.
