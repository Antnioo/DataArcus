# GC2 (0.3.1, wave 6): the Gulf calendar's last unsupported sentences

## Summary
- **Approval:** the reviewer's brief, 25 Oct (wave 6: public claims true before release). GC fixed the false and most
  unsupported sentences of the outside audit (`mcp/work/GC.md`); these 10 were still on the pages at 2a70d72.
- **Scope:** the Gulf calendar article (EN, AR, translations) and the Calendar Generator page (EN, AR, translations):
  only the sentences listed below; `mcp/test-0.3.0-claims.mjs` (GC2 block). Not K2's or A2's files.
- **Base:** `fix/0.3.1-gulf-claims` from `origin/integration/0.3.1` (2a70d72). Push only this branch.
- **Expected checks:** `0.3.0-claims` 377 -> about 470 (red first, then PASS); `test-arabic-terms` 87 PASS;
  site config, csp, ar-pages, check:min, sitemap-lastmod PASS; run-all site, spacing, text-align, lang-switcher,
  gulf-calendar PASS; check-agent-memory PASS. **Got:** claims 377 -> 480 (red e89e62d: 65 failed; then PASS); every
  other check PASS (see "Results").
- **Resume:** done; waits for the reviewer. Nothing needs Desktop. "Seen, not in scope" stays open for the owner.

## Plan (before any edit)
1. This note, pushed first.
2. Red first: a GC2 block in `mcp/test-0.3.0-claims.mjs`: each old sentence a banned phrase on the GC files (EN and
   AR), each new sentence (or its source link) required in the files that carry it; the article's "Posted on" date
   equal to its `datePublished` (EN and AR); the FAQ's FORMAT measurement names its DESKTOP-TESTS.md section.
   Expected red: every new sentence missing (about 40 failures), every banned check of the old sentences failing on
   the article EN, AR and translations.
3. The edits, sentence by sentence (decided after checking each source):
   1. p1 "knows January to December and one weekend" -> Power BI's own date table (auto date/time) has Gregorian
      years, quarters, months and days, and nothing about the weekend, Hijri months or Ramadan. Source: Microsoft Learn,
      "Apply auto date/time in Power BI Desktop" (columns Day, MonthNo, Month, QuarterNo, Quarter, Year) and "Auto
      date/time guidance" ("Calendar periods only ... can't add columns for other time periods").
   2. "the report shows trends that are really the calendar" -> "can show".
   3. h1 "gets wrong" -> "doesn't know" (AR «لا يعرفها»).
   4. "Eid is a window, not a day." kept, sourced: u.ae, Public holidays: Eid al-Fitr 1 to 3 Shawwal, Eid al-Adha 10
      to 12 Dhu al-Hijjah (read 25 Oct).
   5. "Shopping builds up in the days before Eid" and "The days before Eid often matter more than Eid itself" ->
      conditional ("If your sales build up before Eid ..."). "those days fall in a different Gregorian month from one
      year to the next" is not true every year (Eid al-Fitr 2025-03-30, 2026-03-20: both March) -> they come about 11
      days earlier each year (the Hijri year, already said in the article's first item), so they move across the
      Gregorian months.
   6. p14 the made-up model: true (README: two stores, a fixed formula, no real data; `check.dax` 43 checks); the link
      goes to the README itself.
   7. "Posted on October 3, 2026": the article's first commit is 4e7ef3a9, 2026-10-03 16:32 UTC; `datePublished`
      2026-10-03: kept.
   8. "DataArcus builds Power BI reports that understand the Gulf calendar" (article end, generator CTA): kept, linked
      to the MCP page (`/power-bi-mcp/`: add_gulf_calendar and the Arabic twin), EN and AR.
   9. "Names sort alphabetically." / «الأسماء تُرتَّب أبجديًا.» kept, sourced: Microsoft Learn, "Tips and tricks for
      creating reports" (a text value's default order is alphabetical) and "Sort one column by another column".
   10. FAQ a2 "(Measured in Power BI Desktop 2.158, October 2026: DAX FORMAT ...)": measured, kept;
       `scripts/tests/DESKTOP-TESTS.md`, "2026-10-05, round 10", "DAX FORMAT with Arabic locales" named in a comment
       on the page and in the translations.
4. build:min, check:min (new ?v= stamps), csp --write, ar-pages --write, site config, sitemap-lastmod --write after the
   commit, run-all (site spacing text-align lang-switcher gulf-calendar), test-arabic-terms, check-agent-memory.

## Results
Commits on `fix/0.3.1-gulf-claims`: 5ab0442 plan; e89e62d tests first (red: 480 checks, 65 failed);
8e1ef6d the sentences (EN, AR, translations, ar/ copies, ?v= stamps `20261025gc2` on both translations files).

| # | Before | After | Source / verdict |
|---|---|---|---|
| 1 | "A standard Power BI date table knows January to December and one weekend." / «...يعرف الأشهر من يناير إلى ديسمبر وعطلة واحدة فقط.» | "Power BI's own date table (auto date/time) has Gregorian years, quarters, months and days, and nothing about the weekend, Hijri months or Ramadan (Microsoft Learn)." / «جدول التواريخ التلقائي في Power BI (auto date/time) فيه السنوات والأرباع والأشهر والأيام الميلادية، ولا شيء عن عطلة نهاية الأسبوع أو الأشهر الهجرية أو رمضان» | softened and sourced: learn.microsoft.com/power-bi/transform-model/desktop-auto-date-time (columns Day, MonthNo, Month, QuarterNo, Quarter, Year; AR links the ar-sa page) |
| 2 | "the report shows trends that are really the calendar" / «أظهر التقرير» | "can show" / «فقد يُظهر التقرير» | softened |
| 3 | "Four things a standard calendar gets wrong in the Gulf" / «يخطئ فيها» | "...doesn't know in the Gulf" / «لا يعرفها» | softened |
| 4 | "Eid is a window, not a day." | kept; new sentence: the UAE's public holidays for Eid al-Fitr 1-3 Shawwal, Eid al-Adha 10-12 Dhu al-Hijjah (u.ae link) (EN, AR) | kept with source: u.ae Public holidays, read 25 Oct |
| 5 | "Shopping builds up in the days before Eid ... fall in a different Gregorian month from one year to the next." / p12 "The days before Eid often matter more than Eid itself." | "If your sales build up in the days before Eid, those days come about 11 days earlier each year and move from one Gregorian month to another." / "If your sales build up before Eid, look at those days together with Eid itself." (AR the same) | softened (no source for shopping); the month sentence corrected (Eid al-Fitr 2025-03-30 and 2026-03-20 are both in March) |
| 6 | "We test these measures on a made-up model ... 43 checks" | text kept; the link goes to `scripts/gulf-calendar/test-model/README.md` (EN, AR) | kept with source: the README (two stores, fixed formula, no real data; `check.dax` 43 checks) |
| 7 | "Posted on October 3, 2026" | kept | first commit 4e7ef3a9, 2026-10-03 16:32 UTC; `datePublished` 2026-10-03 (now a test) |
| 8 | "DataArcus builds Power BI reports that understand the Gulf calendar, in English and Arabic." (article; the generator's shorter one) | kept, + "see DataArcus for Power BI (its Gulf calendar tool and the Arabic twin)" linked to `/power-bi-mcp/` (generator: the link only); AR «انظر DataArcus لـ Power BI» | kept as the product's description, linked; no superlative |
| 9 | "Names sort alphabetically." / «الأسماء تُرتَّب أبجديًا.» | kept + "Power BI puts text in alphabetical order unless a column is set to sort it (Microsoft Learn)." / «يرتّب Power BI النصوص أبجديًا ما لم يُحدَّد عمود لترتيبها» | kept with source: Microsoft Learn, Tips and tricks for creating reports, "Sort by another column" ("the default order is alphabetical") |
| 10 | FAQ a2 "(Measured in Power BI Desktop 2.158, October 2026: DAX FORMAT with "ar-SA" or "ar-AE" still returns the Gregorian date.)" | kept; an HTML comment on the page (EN, AR copy) and a JS comment in the translations name `scripts/tests/DESKTOP-TESTS.md`, "DAX FORMAT with Arabic locales" (2026-10-05, round 10) | kept: measured there (6 FORMAT results, all Gregorian) |

## Tests (before -> after)
- `0.3.0-claims` 377 PASS -> 480 (65 failed at e89e62d) -> 480 PASS. `test-arabic-terms` 87 PASS. ar-pages PASS (38 copies);
  site config PASS (78 pages); csp PASS; check:min PASS (74 files, stamps); sitemap-lastmod PASS (full clone).
- run-all: site 483, spacing 1074, lang-switcher 1442, gulf-calendar 905, text-align 474: all PASS. check-agent-memory PASS.

## CHANGELOG line
None: the website's article text, not the MCP.

## Decisions I made
1. Sentence 1 names auto date/time, the date table Power BI makes itself (sourced), rather than "a standard date
   table": a hand-made CALENDAR table has only a Date column, so "has Gregorian months and years" was not true of it.
2. Sentence 5: "a different Gregorian month from one year to the next" is false for some years (Eid al-Fitr 2025 and
   2026 both in March); replaced by "about 11 days earlier each year", which the article's first item already says.
3. The closing line's AR copy used «داتا أركوس»; E2's rule is DataArcus in Latin in every text (the Arabic name only in
   keywords): changed to DataArcus while the sentence was edited. The link text is the site's own name for the MCP
   page ("DataArcus for Power BI" / «DataArcus لـ Power BI», as the footer).
4. "official" avoided in the Eid sentence ("public holidays"), as the claims test flags it said of anything but the
   weekend, announcements and dates.
5. The two CTA paragraphs became `data-i18n-html` (they now hold a link).

## Seen, not in scope
1. The article's `dateModified` is still 2026-10-03 (EN, AR) though GC and GC2 changed its text on 25 Oct; and
   `article:published_time` says 09:00Z, before the first commit (16:32Z the same day). Proposed: dateModified
   2026-10-25 with the release.
2. The article links to `github.com/Antnioo/DataArcus` (sources file, test model): they work for a visitor only while the repo is public
   (K1's public repo step); not checked here.
3. "Book a Free Call" (CTA button) and "Open the free DAX Calendar Table Generator" still say "free" (GC's Seen 2).
4. AR p3 calls Umm al-Qura «التقويم المحسوب الرسمي في السعودية» and list4 «العطلة الحكومية الرسمية»: true, but no source
   is linked for Umm al-Qura's status on the page.
5. u.ae lists Eid al-Fitr as "1 to 3 Shawwal (4 days)" (day 30 of Ramadan is a holiday when Ramadan has 30 days); the
   article's Is Eid al-Fitr column is 1-3 Shawwal and Is Eid al-Adha 10-13 Dhu al-Hijjah (one day more than u.ae's
   10-12): the column's definition is unchanged here; the owner may want the two to agree.
