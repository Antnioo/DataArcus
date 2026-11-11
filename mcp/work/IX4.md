## Summary
- **Approval:** the owner, 11 Nov, D-1111-17: "IX4 (site page, Arabic held)"; IX1's stage 4 ("a free page on
  dataarcus.com from the same engine (is this month like last year's?)"). Relayed by the hub,
  session_015Q77oNR7YVFznptSuZoZZ2.
- **Base:** `feat/0.3.3-ix4` from `origin/integration/0.3.3` at 274b3499. Push only this branch; never merge, no PR.
- **Scope:** one English page `tools/gulf-like-for-like.html` (a free tool) on `gulf-compare.js` and `gulf-dates.js`
  (the engines, never a copy), its page script `assets/js/gulf-like-for-like.js`, the engines' first `.min.js` where
  missing (gulf-compare), CSP, sitemap, llms.txt, a card on the tools hub (English only), the Arabic held (one list in
  `locale-routes.js`, read by ar-pages.mjs and test-site-config.mjs), a new website suite `gulf-like-for-like`,
  CHANGELOG, MODULES.md rows, WORK.md. The Arabic page's text drafted under "For the owner" only.
- **Expected checks:** new suite `gulf-like-for-like` (about 30 checks), red on 274b3499 first (no page);
  `node scripts/check-modules.mjs --strict` PASS; check-min, test-site-config, ar-pages, csp, sitemap-lastmod PASS;
  ix1 64 and ix2 33 unchanged; the website suites the page or locale-routes touch, each alone; lint exit 0; CI.
- **Resume:** planning (2026-11-11T22:23Z).

## The plan (written before the code, 2026-11-11T22:23Z)
1. **The dates first (OA1).** gulf-dates.js's estimates came from ICU. Measured here, before any page: .NET 8.0.134's
   `UmAlQuraCalendar` (Ubuntu's own package, installed in this session) against ICU 78.3 (Node 22's Intl,
   `islamic-umalqura`) for 1 Ramadan, 1 Shawwal and 10 Dhu al-Hijjah of 1439 to 1453. Result: the two families agree on
   every estimate row of gulf-dates.js (1448 to 1452, all three dates each); the first difference is 1 Ramadan 1453
   (.NET 2031-12-15, ICU 2031-12-16), after the table. So no row is "estimate: published tables differ by a day"
   today; the rule is still coded and pinned by a test against a saved copy of .NET's rows.
2. **The engine is one library (R-12).** The page loads `gulf-dates.min.js` and `gulf-compare.min.js` and calls
   `monthsCompared`; one new export in gulf-compare.js, `monthOn({ year, month, country })` (one month's counts and
   the weekend days it holds), for the weekend count the brief asks for; `monthsCompared` and `rangeCompared` unchanged
   (ix1 64, ix2 33 the proof).
3. **The page.** A year, a month, a country (the 6 GCC countries and Sharjah's government; the Ramadan dates differ
   for Oman, the weekend and VAT by country). It says, for the month and the same month a year before: Ramadan days,
   Eid al-Fitr days, Eid al-Adha days, weekend days and which days they are, the VAT rate; then IX1's words: "are not
   like for like" or "like for like on the calendar", never "wrong". Estimates said so, with the sentence that the
   real start is announced after the moon is sighted and may differ by a day. Years outside the table: "not known", no
   number. No upload, no request, nothing stored.
4. **Arabic held.** `locale-routes.js` gets `AR_HELD` (the held pages); `hasArCopy` is false for them, ar-pages.mjs
   leaves them out of PAIRS, test-site-config.mjs reads the same list. The hub's card carries `data-ar-held` and the
   Arabic hub's render drops it (no Arabic text ships).

### Expected numbers (worked out from gulf-dates.js and IX1's table before the code)
| # | check | expected |
|---|---|---|
| E1 | February 2026, UAE | not like for like: Ramadan 11 against 0 |
| E2 | March 2026, UAE | Ramadan 19 against 29, Eid al-Fitr 3 against 2 |
| E3 | August 2026, UAE | like for like on the calendar (no Ramadan, no Eid either year) |
| E4 | January 2022, UAE | the weekend changed: Saturday + Sunday against Friday + Saturday |
| E5 | July 2020, Saudi Arabia | VAT 15% against 5% |
| E6 | February 2026, Oman | 10 Ramadan days (the UAE: 11) |
| E7 | February 2027, UAE | estimate, with the sighting sentence |
| E8 | 2031 and 2018 | not known, no number |
| D1 | every estimate row of gulf-dates.js | equal to .NET's saved row, or shown "published tables differ by a day" |
| H1 | held | no `ar/tools/gulf-like-for-like.html`; hasArCopy false; the Arabic hub has no card for it |
| W1 | words | no "first", "only", "official", "is wrong" in the page |
| R1 | rendered | 390 px and 1440 px: no sideways scroll, no page error; no request after load; storage unchanged |
