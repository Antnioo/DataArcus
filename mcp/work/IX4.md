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

## Before -> after (2026-11-11T22:37Z)
- **Before (274b3499).** The Gulf like-for-like answer lived in `check_report` only (IX2). No page on dataarcus.com said
  which months a year-over-year comparison sets Ramadan or Eid days beside ordinary days. gulf-compare.js had no
  `.min.js` (no page loaded it).
- **After.** `tools/gulf-like-for-like.html` (English, a free tool): a year, a month, a country (the 6 GCC countries and
  Sharjah's government). For March 2026 (UAE) it says, from the run: "March 2026 and March 2025 are not like for like in
  the Gulf (Ramadan days: 19 against 29; Eid al-Fitr days: 3 against 2)." with a table (Ramadan, Eid al-Fitr, Eid
  al-Adha and weekend days, the weekend, the VAT rate), the dates used (each "announced", "estimate", or "estimate:
  published tables differ by a day"), and the year's 12 months (2026: 5 not like for like, clickable). August 2026:
  "are like for like on the Gulf calendar". January 2026: like for like, "holds 9 weekend days against 8". 2031 and
  2018: "Not known". February 2027: the estimate and the sighting sentence. No request after load, nothing stored.
- **Engines:** gulf-compare.js gains `monthOn` and `eventsOf` (and `countryOf`, internal); `monthsCompared` and
  `rangeCompared` answer as before (ix1 64, ix2 33). Its first `.min.js` by terser; the page loads `gulf-dates.min.js`,
  `gulf-compare.min.js`, `gulf-like-for-like.min.js`.
- **Arabic held, how:** `locale-routes.js` `AR_HELD` (one list): `hasArCopy` is false for the page (an Arabic copy's
  links to it stay English), `scripts/ar-pages.mjs` leaves it out of PAIRS (no `ar/` copy rendered, no hreflang, no
  sitemap alternates) and renders a pair without any element marked `data-ar-held` (the hub's card),
  `scripts/test-site-config.mjs` reads the same list. To release the Arabic: approve the words below, add the page's
  translations, remove the path from `AR_HELD` and the `data-ar-held` mark, then `node scripts/ar-pages.mjs --write`.
  A visitor who saved Arabic sees the site's menu in Arabic and the tool in English, left to right (`#lfTool`).

## Results
(filled from the runs below)

## CHANGELOG line
- **On dataarcus.com, a free page from the same dates:** "Is this month like last year's?" (tools/gulf-like-for-like.html)
  sets a month beside the same month a year earlier for a Gulf country: Ramadan, Eid al-Fitr, Eid al-Adha and weekend days,
  the weekend and the VAT rate, and whether the two are like for like. In English; it runs in the browser and saves nothing.

## Decisions I made
1. **The verdict is gulf-compare.js's `monthsCompared` row** (as `check_report` says it): Ramadan, Eid, weekend rule and
   VAT. Weekend days are counted (`monthOn`, the brief's "weekends") but do not make a month "not like for like": almost
   every month differs by a day as the weekdays fall, and IX1's definition does not count it; the page says it as a
   second sentence ("holds 9 weekend days against 8: the days of the week fall differently each year").
2. **`monthOn` and `eventsOf` in the engine, not in the page** (R-12): the page holds no date and no counting rule.
3. **DIFFER is empty and lives in the page script;** the suite pins every estimate of gulf-dates.js to .NET's row
   (`scripts/tests/fixtures/umalqura-dotnet.json`), so a new estimate the families disagree on fails until it is listed.
   gulf-dates.js untouched (its stamp would move the calendar pages).
4. **.NET from Ubuntu's own package** (`apt-get install dotnet-sdk-8.0`, the archive the environment allows); no other
   host tried. van Gent's tables were not needed.
5. **Years offered 2018 to 2032;** 2018 (against 2017) and 2031 to 2032 answer "Not known" (the brief's "years past the
   last known date"). The default is the visitor's current month and year (UTC), inside the table.
6. **Countries:** all 7 of gulf-dates.js's weekend list (Sharjah's government included); VAT shown where the country has
   a rate list (not Sharjah, which has no VAT row of its own).
7. **The hub card is English and dropped from the Arabic hub** (`data-ar-held`), and the hub's ItemList JSON-LD lists the
   page (inline scripts are copied byte for byte to the Arabic hub, English names, as every other item there).
8. **og:image:** the existing `assets/img/og/gulf-calendar.jpg` (no new picture; R-59 not triggered).
9. **WORK.md** was at 3,180 of 3,200 characters: my entry is " IX4 `work/IX4.md`." (19), nothing else cut.
10. **Not linked to the MCP's `check_report` from the page:** 0.3.3 is not released, so the page would claim a feature
    users cannot download yet.

## For the owner
1. **The page's one-line claim** (IX1's proposed sentence, corrected to what the page does): "See whether a month and
   the same month last year are like for like in the Gulf: Ramadan, Eid, weekend and VAT days, side by side." IX1's
   sentence was about visuals of a report, which the page does not read.
2. **The Arabic page, yours to approve** (drafts; nothing ships; D-1109-07, R-103b). Each line, then why:
   - Name: «مقارنة كل موسم بنظيره في الخليج». Why: the concept `likeforlike` already chosen in
     `assets/data/arabic-report-words.json` («كل موسم بنظيره»); «نظيره» says "its counterpart" without the "tit for tat"
     reading of «المثل بالمثل».
   - Title (54 characters): «هل يشبه هذا الشهر نظيره من السنة الماضية؟ رمضان والعيد». Why «السنة» not «العام»: your
     rule keeps «عام» for a name's first word («عام» also reads "general"); «يشبه» is the everyday verb for "is like".
   - Badge: «أداة مجانية · بدون تسجيل · تعمل في متصفحك». Why: the hub's own Arabic badge («مجانية · بدون تسجيل · تعمل في
     متصفحك», `ar/tools/index.html`) with «أداة» before it, as the English says "Free tool".
   - Not like for like: «مارس 2026 ومارس 2025 مقارنة غير متكافئة في الخليج (أيام رمضان: 19 مقابل 29؛ أيام عيد
     الفطر: 3 مقابل 2).» Why: IX1's approved-for-drafting «مقارنة غير متكافئة» and «مقابل» («ضد» reads as a contest);
     the label before the numbers («أيام رمضان: 19») avoids number agreement (OA1's warning: «11 يومًا», «3 أيام»).
   - Like for like: «مارس 2026 ومارس 2025 متكافئان في تقويم الخليج: أيام رمضان والعيدين نفسها، وعطلة نهاية الأسبوع
     نفسها، ونسبة ضريبة القيمة المضافة نفسها.» Why: «متكافئان» is the same root as the negative; «العيدين» is how both
     regions say "the two Eids".
   - Weekend days line: «أيام عطلة نهاية الأسبوع: 9 مقابل 8، لأن أيام الأسبوع تقع في تواريخ مختلفة كل سنة.» Why: the
     label form again (no agreement); «عطلة نهاية الأسبوع», not the loanword «الويكند».
   - Row labels: «أيام رمضان»، «أيام عيد الفطر»، «أيام عيد الأضحى»، «أيام عطلة نهاية الأسبوع»، «عطلة نهاية الأسبوع»،
     «نسبة ضريبة القيمة المضافة الأساسية». Why «نسبة»: the everyday word for a percentage rate; «الأساسية» for "standard"
     (not «القياسية», which also reads "record"). «عطلة نهاية الأسبوع» is the site's own (the Gulf calendar article).
   - Weekend change: «عطلة نهاية الأسبوع: السبت والأحد مقابل الجمعة والسبت». Why «و» not «+»: a plus sign between two
     Arabic words is read as maths.
   - Statuses: «مُعلَن» (announced); «تقدير» (estimate); «تقدير: الجداول المنشورة تختلف بيوم». Why: «مُعلَن» with its
     marks so it cannot be read «مَعلَن»; «تقدير» not «تقديري» (a noun, as a label).
   - Sighting: «يُعلَن بدء رمضان والعيد فعليًا بعد رؤية الهلال، وقد يختلف عن التقدير بيوم.» Why: «رؤية الهلال» is the
     phrase both regions hear in the announcement itself.
   - Not known: «غير معروف: التواريخ التي يحفظها DataArcus تغطي 2018 إلى 2030، ويجب أن تقع الفترتان ضمنها.» Why: the
     product name stays Latin, isolated (R-101); «تغطي» over «تشمل» (one reading: covers a range).
   - Privacy: «لا يغادر ما تختاره هذه الصفحة، ولا يُحفظ شيء.» Why: the tools hub's own verb («لا شيء مما تدخله يغادر
     متصفحك», `assets/js/translations/tools-hub.js`).
   - Month names as both regions write them (يناير ... ديسمبر), Western digits (ARABIC-STYLE.md, "Also").
3. **Yes / no:** keep the hub card and llms.txt line in English until the Arabic ships (Decision 7).

## Risky changes
- `locale-routes.js` is on every page: `hasArCopy` gained one condition (the held list) and its `.min.js` stamp moved on
  80 pages. Every website suite was run one at a time (Results).
- `scripts/ar-pages.mjs` now drops `[data-ar-held]` elements from a rendered copy: only the hub's card carries it today
  (the Arabic hub's diff is the JSON-LD item and the stamp).

## For the laptop
Nothing in Desktop. A look in a browser if wanted: the page at phone width, and with Arabic chosen in the menu (the
tool stays English, left to right).

## Seen, not in scope
1. gulf-dates.js still ends at Ramadan 1452's first day (IX1 "Seen" 5, IX2 Decision 8). .NET's table gives 1452's Eids
   (2031-01-24, 2031-04-02) and 1453; they are a published table, not an announcement: a row could be added as an
   estimate with .NET and ICU agreeing (both give those two dates), if you want 2031 compared (your call: it widens what
   "estimate" stands on).
2. gulf-dates.js's 1439 Ramadan (2018-05-17, the UAE's announcement) is a day after both Umm al-Qura tables
   (2018-05-16): expected (a sighting), noted for whoever reads the fixture.
3. A visitor with Arabic saved on any English-only page (this one, the lab) gets an Arabic menu around an English body;
   a site-wide rule for held pages (a note in Arabic above the tool) would read better once the owner decides.

## Lessons for the reviewer
- "Arabic held" on this site is three places that must agree (the route rule, the copy generator, the site check):
  one list in `locale-routes.js` made it one place; a brief can name it.
- A host refusal (IX2) was not the only road to the .NET family: Ubuntu's archive carries `dotnet-sdk-8.0`, which the
  default network allows. Worth a line in the next dates brief.
