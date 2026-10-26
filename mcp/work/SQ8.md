# SQ8 (0.3.1 night, Seen batch 8): website pages, English and Arabic

## Summary
- **Approval:** the owner's "Yes, fix now" to every open "Seen, not in scope" item (26 Oct); the reviewer's brief "Go on
  SQ8". Batch "SQ8: website pages, English and Arabic" in [SEEN-QUEUE.md](SEEN-QUEUE.md).
- **Scope:** the licensing guide (EN, AR, translations) and the cost calculator's FAQ (EN, AR, translations); the Gulf
  calendar article's p3 (EN, AR, translations); `scripts/make-share-images.mjs` and `assets/img/og/gulf-calendar.jpg`;
  `assets/js/theme-generator.js` (one line); `assets/js/dp600-sim.js` (one line); `scripts/sitemap-lastmod.mjs`; tests
  in `mcp/test-0.3.0-claims.mjs`, `scripts/tests/theme-generator.mjs`, `scripts/tests/tools.mjs`,
  `scripts/test-sitemap-lastmod.mjs`; the six Status cells in SEEN-QUEUE.md. Not SQ7's (calendar-generator.js, the
  Calendar Generator and Health Check pages, gulf-calendar.mjs) nor SQ10's (report-run.mjs, plan notes).
- **Base:** `fix/0.3.1-sq8` from `origin/integration/0.3.1` (26f7fbe). Push only this branch; the reviewer merges.
- **Items:** GC-S1, 0.2.9-design-S4, I-S3, GC2-S4, I-S1, DS1-S3: all six confirmed true on 26f7fbe (below); none
  obsolete.
- **Expected checks:** claims 580 -> about 645, red first (about 25 failed), then PASS; theme-generator and
  theme-generator-lab +4 checks each, 2 red; tools +4 checks, 4 red (if the practice run ends with a skill under 70%);
  test-sitemap-lastmod 37 -> 40, 3 red; then all PASS. site config, csp, ar-pages, check:min, test-arabic-terms,
  sitemap-lastmod PASS; run-all site, spacing, text-align, lang-switcher, tools, theme-generator(-lab) PASS.
- **Resume:** see "Results" (filled at the end). Nothing needs Desktop.

## The items, confirmed (26f7fbe)
1. **GC-S1** `scripts/make-share-images.mjs:207`: the Gulf image's kicker says "Free tool" and its line "the right
   weekend for each country and year"; the article (meta description) says "Hijri dates, announced Ramadan and Eid
   days, each country's weekend and the 2022 UAE change."
2. **0.2.9-design-S4** `assets/js/theme-generator.js:820`: the folded Layout step's summary is
   `LAYOUTS[c.preset].name`: a 640 x 360 executive page folds as "Executive summary" while the preview (and the
   download) is the single-focus layout (`E.fitLayout`, design-engine.js:350).
3. **I-S3** `assets/js/dp600-sim.js:454`: the practice summary's skill table calls `bar()` without a class (blue);
   the area rows (line 103) and the mock's skill table (line 688) pass good / warn at 70%.
4. **GC2-S4** the Gulf article p3 (EN and AR): Umm al-Qura "Saudi Arabia's official calculated calendar" / «التقويم
   المحسوب الرسمي في السعودية», no source.
5. **I-S1** `scripts/sitemap-lastmod.mjs`: no shallow check. Measured: a `git clone --depth 1` of this branch,
   `--write` -> "Updated 68 dates", exit 0.
6. **DS1-S3** the licensing guide: only the Pro limits were re-checked in DS1.

## Plan (before any edit)
1. This note, pushed first, with the red tests.
2. Red first: claims (SQ8 block: Umm al-Qura sentence and link; the share image's line = the article's description,
   no "free", new JPG; every licensing figure computed from `assets/data/powerbi-prices.json` and the UAE prices; the
   check date; creators "Pro or PPU" in the guide and the calculator); theme-generator 8b (640 x 360 folds as single
   focus, 1280 x 720 as executive, EN and AR); tools (skill bars green / amber at 70%); test-sitemap-lastmod (a
   depth-1 clone: --write and the check exit 2 naming `git fetch --unshallow`, sitemap.xml unchanged).
3. Fixes at the cause: (1) the Gulf entry's kicker and line, image regenerated; (2) the summary reads
   `E.fitLayout(c).preset`; (3) `bar(p, p >= 0.7 ? 'good' : 'warn')` as line 688; (4) p3 softened and sourced; (5)
   refuse on a shallow clone; (6) every figure re-checked (list below), the changes made, dates updated.
4. build:min, ?v= stamps (both copies), git add, csp --write, ar-pages --write, site config, test-arabic-terms, claims,
   run-all (the suites above), commit, sitemap-lastmod --write (commit), the six Status cells, push.
