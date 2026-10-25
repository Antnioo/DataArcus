# GC2 (0.3.1, wave 6): the Gulf calendar's last unsupported sentences

## Summary
- **Approval:** the reviewer's brief, 25 Oct (wave 6: public claims true before release). GC fixed the false and most
  unsupported sentences of the outside audit (`mcp/work/GC.md`); these 10 were still on the pages at 2a70d72.
- **Scope:** the Gulf calendar article (EN, AR, translations) and the Calendar Generator page (EN, AR, translations):
  only the sentences listed below; `mcp/test-0.3.0-claims.mjs` (GC2 block). Not K2's or A2's files.
- **Base:** `fix/0.3.1-gulf-claims` from `origin/integration/0.3.1` (2a70d72). Push only this branch.
- **Expected checks:** `0.3.0-claims` 377 -> about 470 (red first, then PASS); `test-arabic-terms` 87 PASS;
  site config, csp, ar-pages, check:min, sitemap-lastmod PASS; run-all site, spacing, text-align, lang-switcher,
  gulf-calendar PASS; check-agent-memory PASS.
- **Resume:** see "Results" (filled after the run); nothing needs Desktop.

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
