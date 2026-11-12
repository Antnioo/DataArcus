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
  `lang: "ar"` path (`mcp/lib/read-words.mjs`; AU1's two sentences were shipped, then held again in round 2), MODULES.md and CONTRACTS.md rows, CHANGELOG, `mcp/WORK.md`, this note. Not: tool descriptions,
  `mcp/TOOLS.md`, R-19's files.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; ar7 red on 26cfb66f first; `npm test -- arabic`
  (and model, checker, report, core where a shipped line moves an answer); the website suites of each changed asset;
  build:min; lint 0; check-result-lines, changelog-words, check-agent-memory PASS; CI green.
- **Resume:** sent back by the review of 12 Nov 23:1xZ (two approved rows shipped unsourced words); fixed (2026-11-12T23:09Z); next: CI, the CI line.

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
(round 2, 2026-11-12T23:09Z: after the review)
- The 37 items (`mcp/work/AR7-ARABIC.md`, one row each): 5 APPROVED (I-1112-1001, -1050, -1053, -1679, -1680), 32 HELD.
  Round 1 said 7 and 30: -1004 and -1006 were approved on their nouns only; the review asked for every word, and
  their verbs («يذكر», «يعرّفه», «قرأ», «ضع») and «الفحص» have no source in both. They are HELD and their code is the
  base's again, byte for byte (`git diff 26cfb66f -- assets/js tools ar scripts/tests`: only the two arabic-count files).
- Shipped Arabic: `mcp/lib/read-words.mjs` NO_MODEL_NAMED and NO_MODEL_AT with no model to list, lang "ar":
  English -> Arabic. Nothing else.
- The term sheet: 30 concepts -> 44; every concept says why it stands: 17 both use (D-1112-05), 25 the owner's own,
  2 with one source (relationship, VAT; read from `content/ARABIC-GLOSSARY.md`'s last line). No existing Arabic term changed.
- The term check: a failure named the file, the line and the word -> also the key (`fileHits` gives `key`).
- Counts: no formatter -> `assets/js/arabic-count.js` (`arCount`, CLDR's six forms), tested, with no caller yet.
- Sources: Microsoft Learn's Power BI docs under /ar-sa/ answer in English (16 pages fetched), so Microsoft's Arabic
  was read from the Arabic training units that carry Arabic and from support.microsoft.com/ar-sa; Google's from
  support.google.com ?hl=ar and developer.android.com ?hl=ar. Looker Studio and BigQuery pages answer in English.
  Round 2 read no new page: every word was looked up in the pages fetched in round 1 (all reachable then).

## Arabic approved by D-1112-05 (both sources read 2026-11-12; the links are in AR7-ARABIC.md, rows and "Sources")
Word by word (the review's rule): a line is here only when every word of it is sourced in both or is the owner's own.
1. «لا يوجد نموذج باسم "X" في مجلد العمل Y. أعطِ read_model مسار مجلد مشروع، أو "." لمجلد العمل نفسه.» and «لا يوجد شيء
   في "X" داخل مجلد العمل Y. أعد استدعاء الأداة بمسار مجلد مشروع (نسبةً إلى مجلد العمل)، أو "." لمجلد العمل نفسه.»: every
   word but two is from the owner's own approved lines of 10 Nov (D-1110-07, `mcp/work/AT1.md` lines 24 to 26); the
   two new words, «مجلد» and «مشروع», are both-sourced (M3, M9, G8). No word without a source.
2. Counts by CLDR's six forms (Microsoft M13, Google G14, G15): the rule, built as a formatter; no sentence uses it yet.
3. "…" round a name in a tool answer, as both write it (M3, M4, G2, G17): punctuation, no word; no change needed.
4. Glossary terms both use: chart, measure, column, page, report, weekend, legend, table, row, field, file, folder,
   project, zip file, alt text, option, full screen (each row of the glossary has both links).
Approved by the owner's own standing rule, NOT by D-1112-05 (not shipped; they wait for the Gulf page): -1050 (month
names, Western digits: ARABIC-STYLE.md "Also") and -1053 (the page name from the sheet's «كل موسم بنظيره»).
Words re-checked and found without both sources (their rows are HELD): «يذكر», «يعرّفه» (-1004); «الفحص», «قرأ / لم
يقرأ / لم تُقرأ / المقروء», «ضع» (-1006).

## Tests
- `ar7` (new, area arabic): 34 checks now (45 in round 1: the 11 checks of the two sentences' Arabic became 4 that pin
  them held, English on the Arabic side, source and .min.js). Red on 0f2b5d36 first (round 1: 31 of 45 failed).
- Round 1 changed `au1` R4 and W5 and the website `model-health` suite on purpose; round 2 put all three back to the
  base's text (no difference from 26cfb66f): `au1` 40, `model-health` 265 as before the job.
- `test-0.3.3-at1.mjs`: a comment only. `test-0.3.1-arabic-terms` 99 checks (85 before: one AT-1 check per new
  concept); `scripts/test-arabic-terms.mjs` 87.

## Results (round 2, run 2026-11-12T23:13Z)
- `ar7` 34; `au1` 40; `npm test -- arabic model`: 53 suites passed. Round 1 (on afadc436): core with the mutation
  suite passed (48 suites with model); round 2 changes no file of core's.
- `node scripts/check-modules.mjs --strict`: PASS, 1267 checks (227 module files, 227 rows). `check-contracts` 868,
  `check-agent-memory` 537, `changelog-words` 111, `check-result-lines` 258, `stamps` 1286, `arabic-glossary` 44,
  `scripts/test-arabic-terms.mjs` 87, `test-site-config` PASS, lint exit 0.
- Website `model-health` not re-run locally: its test file and every asset it reads are the base's again (CI runs it).
- The merge (R-33): origin/integration/0.3.3 fetched before CI; see the CI line.

## CHANGELOG line
Two lines under [Unreleased] in `mcp/CHANGELOG.md`: the Arabic answer for a wrong model name or path in an empty working folder; the glossary and its check. (The counts have no line: nothing a user sees uses them yet.)

## Decisions I made
1. One term source, not two: the glossary file is the existing sheet rendered (`scripts/arabic-glossary.mjs --write`),
   and the check is the existing one (`mcp/lib/arabic-terms.mjs`) extended, not a second scanner (D-1104-12).
2. What "passes" means, applied the same way to every row (corrected in round 2): every word of a sentence that carries
   meaning, verbs included, is sourced in both or is the owner's own (ARABIC-STYLE rules 2 and 5, the sheet's chosen
   terms, a sentence he approved word for word); and both sources have a message of its kind. Round 1 checked only the
   nouns: wrong, and two sentences shipped on it for one commit (never merged).
3. Strict where one side is missing: «علاقة» (a model relationship) is Microsoft's only, so AU1's second reason is HELD
   although the Health Check already says «علاقة» elsewhere.
4. «ملف ZIP» is the glossary's word for a zip file (the one both use); no shipped line uses it yet.
5. The formatter stays, tested and with no caller: -1679 is a rule both sources back, and the first sentence that
   counts will call it. Its worker import was removed with the held sentence. The older Arabic count texts (Seen 2)
   and `read-words.mjs` manyAr (the owner's approved words) are not rewritten.
6. No direction marks in tool answers (`answer.mjs` shows them as codes).
7. The Gulf like-for-like page stays held as a whole: its approved lines (-1050, -1053) ship with it (D-1027-03).
8. `mcp/work/AR7-ARABIC.md` has its own `## Summary` (check-agent-memory asks every note in `mcp/work/` for one).
9. A new file, `assets/js/arabic-count.js` (and its .min.js); nothing requires or imports it yet. No tool description holds a shipped Arabic line; none was edited (TB3's files untouched).

## For the owner
- May these held Arabic lines ship as drafted, each one where only the rule's letter stops it: (a) the Health Check's three sentences, held on the relationship word (Google has none) and on plain verbs with no source in both («يذكر», «يعرّفه», «قرأ», «ضع», «الفحص»): «يذكر model.tmdl هذا الجدول، ولا يوجد في المشروع ملف يعرّفه», «تستخدم إحدى العلاقات هذا الجدول، ولا يوجد في المشروع ملف يعرّفه», «يحتوي ملف ZIP هذا على نموذجين دلاليين: قرأ الفحص أدناه A؛ ولم يقرأ B. التقرير المقروء هو تقرير A (R)، ولم تُقرأ تقارير النموذج الآخر. لفحص نموذج آخر، ضع مجلد مشروعه وحده في ملف ZIP.»; and, kept from before, the relationship reason «تستخدم إحدى العلاقات هذا الجدول، ولا يوجد في المشروع ملف يعرّفه» (Microsoft «علاقة»; Google has no Arabic for a model relationship); (b) the Gulf page's badge «أداة مجانية · بدون تسجيل · تعمل في متصفحك» (the hub's live badge plus «أداة»), its weekend line «عطلة نهاية الأسبوع: السبت والأحد مقابل الجمعة والسبت» and its labels («مقابل»: Google only; VAT «ضريبة القيمة المضافة»: Google only); (c) «ملء الشاشة» and «الخروج من ملء الشاشة» for the build page (both use it; the page has no Arabic copy yet)? | class: arabic | risk: two-way | rec: yes to (a), (b), (c) | yes: a builder ships (a) now and (b), (c) with their pages | no: they stay English | default: they stay English
- Neither Microsoft nor Google has an Arabic term for like for like: do you keep the sheet's «كل موسم بنظيره» as the name and approve IX1's «مقارنة غير متكافئة» only as the verdict "not like for like"? | class: arabic | risk: two-way | rec: yes | yes: IX1, IX2 and IX4's verdict lines are redrafted on that and come back once | no: all like-for-like Arabic stays held until you choose one word | default: held
- The other held lines have no Microsoft or Google wording to lean on (AR7-ARABIC.md, 32 HELD rows: the Impact check's 8, the brief check's words, the lens, native copy, the two verbs, the Gulf page's statuses, sighting, not-known and privacy lines): approve them as drafted in one pass after 18 Nov? | class: arabic | risk: two-way | rec: yes, one sitting with the table open | yes: each approved row ships | no: they stay English | default: they stay English

## For the reviewer
- Round 2 answers the review of 12 Nov 23:1xZ: option (b) for -1006, and -1004 too (the same re-check found «يذكر»
  and «يعرّفه» unsourced). -1001 stands: every word is the owner's (D-1110-07) or both-sourced. -1679 and -1680 hold
  no word to source. -1050 and -1053 are marked as the owner's standing rule, not D-1112-05.
- The hub can close I-1112-1001, -1679, -1680 (done), and -1050, -1053 (approved by his standing rule, ship with the
  page). -1003, -1004, -1005, -1006 stay open.
- The code for the three AU1 sentences in Arabic exists in commit afadc436 (with its tests): on the owner's yes it can
  be taken from there.
- The sheet's older Microsoft sources (the training units under dax-power-bi-modify-filter and others) answered in
  English when fetched on 12 Nov; for every term marked "both" a Microsoft page read in Arabic that day was added.
- Expected check run: `node scripts/check-modules.mjs --strict` (see Results).

## Risky changes
none (one error text changes, with lang "ar" only; English answers are byte for byte; no answer's shape changes).

## For the laptop
none

## Seen, not in scope
- Microsoft Learn's Arabic addresses in the sheet's older `source` lists now serve English | route: job | size: S | why: the glossary links should show Arabic; re-read each and replace
- Older Arabic count texts do not agree with their noun (calendar-generator.js «${colCount} عمود», theme-generator.js «${c.kpis} بطاقات», measure-builder.js, layout-check.js) | route: job | size: M | why: the formatter exists now; each is a shipped, approved text, so the owner decides
- `read-words.mjs` manyAr writes «12 نماذج» for 11 and up | route: backlog | size: S | why: the owner's words for 3 and up; 11 models at one level is rare
- IX2's draft writes «مرئية» where the sheet's singular is «مرئي» | route: fix | size: S | why: redraft before it goes to the owner
- OX1 and OX2 hold two different drafts for the same status ("one value on every row") | route: fix | size: S | why: one draft should reach the owner
- AR6's batch («لم يُكتب شيء») is not in this repository | route: job | size: M | why: the hub holds it; a builder needs the lines in `mcp/work/`

## Lessons for the reviewer
- A sentence is not approved by its nouns: the verbs carry the meaning and were the unsourced part. The brief's "every key term" should say "every word that carries meaning".
- "Microsoft's Arabic" for Power BI is thin: the product docs are not translated, so a both-sources rule mostly passes
  general words (table, file, folder) and holds Power BI's own (relationship, calculation group, row-level security).
- A brief that sends a table to `mcp/work/` should say it needs its own `## Summary` block.
- `git ls-files "*.min.js"` decides what build:min builds: a new engine needs its empty .min.js added to git first.
