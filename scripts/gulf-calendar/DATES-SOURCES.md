# Gulf Calendar: dates and their sources

The dates in `assets/js/gulf-dates.js`, used by the DAX Calendar Table Generator's "Announced Ramadan and Eid dates"
option, its tests and the Gulf Calendar test model. Checked on 2026-10-03. **Update this file and `gulf-dates.js`
together** after every announcement (Ramadan 1448 is expected around 8 February 2027), and move `checked` forward.

## How the dates are decided
- **The Umm al-Qura calendar** is Saudi Arabia's official calculated Hijri calendar (King Abdulaziz City for Science
  and Technology: [ummulqura.org.sa](https://www.ummulqura.org.sa/)). Browsers and Node carry it as the
  `islamic-umalqura` calendar of Unicode CLDR/ICU, which is what the generator uses for every Hijri month start.
- **Ramadan, Eid al-Fitr and Eid al-Adha are set by moon sighting.** In the UAE the Moon-sighting Committee (chaired by
  the Minister of Justice; formed by the UAE Council for Fatwa in the latest years) meets on the 29th of the month before, and the
  Presidential Court or WAM (the UAE's official news agency) announces the result. Saudi Arabia's Supreme Court does
  the same for the Kingdom. An announced date can differ from Umm al-Qura by a day.
- **Future dates are estimates.** From Ramadan 1448 (2027) on, the dates below are Umm al-Qura's: they are what
  astronomers expect, not an announcement, and a sighting can move each by one day. The generator marks them with
  the column `Is Estimated Date`.

## Ramadan and Eid in the UAE, 2018-2030
"WAM" is the official announcement. "Report" is a national newspaper reporting the committee's or the Presidential
Court's announcement, used where the WAM page was not found. Umm al-Qura is the date the calculated calendar gives.

| Hijri year | Ramadan, 1st day | Eid al-Fitr (1 Shawwal) | Eid al-Adha (10 Dhu al-Hijjah) | Umm al-Qura differs? | Sources |
|---|---|---|---|---|---|
| 1439 | Thu 2018-05-17 | Fri 2018-06-15 | Tue 2018-08-21 | **Yes: Ramadan 2018-05-16** | Ramadan: report, [Gulf News](https://gulfnews.com/uae/ramadan-2018-starts-on-may-17-in-the-uae-1.2221540) (UAE committee, Minister of Justice: Sha'ban completed 30 days, crescent not seen on 15 May). Eid al-Fitr: report, [Gulf News](https://gulfnews.com/uae/eid-al-fitr-in-the-uae-on-friday-june-15-1.2236796). Eid al-Adha: report, [Gulf News](https://gulfnews.com/guides/life/when-is-eid-al-adha-2018-in-uae-1.2241595) |
| 1440 | Mon 2019-05-06 | Tue 2019-06-04 | Sun 2019-08-11 | No | Ramadan: report, [Gulf News](https://gulfnews.com/uae/official-announcement-ramadan-2019-will-begin-on-may-6-in-the-uae-1.1557067481167). Eid al-Fitr: report, [Gulf News](https://gulfnews.com/uae/eid-al-fitr-in-uae-on-tuesday-declared-1.1559574208478). Eid al-Adha: report, [Gulf News](https://gulfnews.com/uae/sunday-august-11-will-be-the-first-day-of-eid-al-adha-1.1564675421409) |
| 1441 | Fri 2020-04-24 | Sun 2020-05-24 | Fri 2020-07-31 | No | Ramadan: report, [Gulf News](https://gulfnews.com/uae/uae-announced-ramadan-2020-starts-friday-april-24-1.1587640361659). Eid al-Fitr: report, [Gulf News](https://gulfnews.com/uae/eid-al-fitr-2020-uae-moon-sighting-committee-to-meet-soon-announce-first-day-of-eid-al-fitr-1.1590155834006). Eid al-Adha: report, [Gulf News](https://gulfnews.com/uae/government/eid-al-adha-2020-uae-public-sector-holidays-announced-1.1595399598343) (federal holiday 30 July to 2 August: Arafat Day on 30 July) and [ARN](https://www.arnnewscentre.ae/en/news/uae/saudi-arabia-july-31-marks-first-day-of-eid-al-adha/) |
| 1442 | Tue 2021-04-13 | Thu 2021-05-13 | Tue 2021-07-20 | No | Ramadan: report, [Khaleej Times](https://khaleejtimes.com/ramadan/ramadan-2021-holy-month-begins-in-uae-today). Eid al-Fitr: **WAM**, [Eid al-Fitr Thursday in UAE](https://www.wam.ae/en/article/hszrcaje-eid-al-fitr-thursday-uae). Eid al-Adha: report, [Gulf News](https://gulfnews.com/amp/uae/sunday-to-be-the-first-day-of-dhu-al-hijjah-eid-al-adha-on-tuesday-july-20-1.1625851119141) |
| 1443 | Sat 2022-04-02 | Mon 2022-05-02 | Sat 2022-07-09 | No | Ramadan: report, [Gulf News](https://gulfnews.com/uae/ramadan/ramadan-2022-holy-month-begins-in-uae-on-saturday-1.1648821472533). Eid al-Fitr: report, [Gulf News](https://gulfnews.com/uae/ramadan/eid-al-fitr-2022-in-uae-shawwal-moon-not-sighted-on-saturday-says-international-astronomical-centre-1.1651314387345). Eid al-Adha: report, [Gulf News](https://gulfnews.com/uae/saturday-july-9-is-first-day-of-eid-al-adha-dhu-al-hijjah-crescent-moon-sighted-in-saudi-arabia-1.1656519257839) |
| 1444 | Thu 2023-03-23 | Fri 2023-04-21 | Wed 2023-06-28 | No | Ramadan: report, [The National](https://www.thenationalnews.com/uae/ramadan/2023/03/21/ramadan-2023-start-date/). Eid al-Fitr: **WAM**, [UAE announces Friday as first day of Eid Al Fitr](https://www.wam.ae/en/article/hszrgwra-uae-announces-friday-first-day-eid-fitr). Eid al-Adha: report, [Gulf News](https://gulfnews.com/world/gulf/saudi/saudi-arabia-declares-eid-al-adha-2023-1.1687094793505) and the UAE's holiday from Arafat Day, 27 June ([Gulf News](https://gulfnews.com/uae/government/eid-al-adha-2023-uae-announce-private-sector-holidays-1.1687156164986)) |
| 1445 | Mon 2024-03-11 | Wed 2024-04-10 | Sun 2024-06-16 | No | Ramadan: **WAM**, [Moon-sighting Committee congratulates UAE leadership on advent of Ramadan](https://www.wam.ae/en/article/b22o3v0-moon-sighting-committee-congratulates-uae). Eid al-Fitr: **WAM**, [UAE announces Wednesday as first day of Eid Al Fitr](https://www.wam.ae/en/article/b2jxoem-update-uae-announces-wednesday-first-day-eid-fitr). Eid al-Adha: report, [Gulf News](https://gulfnews.com/uae/eid-al-adha-2024-in-uae-crescent-moon-of-dhu-al-hijjah-captured-over-abu-dhabi-1.1717745191664) |
| 1446 | Sat 2025-03-01 | Sun 2025-03-30 | Fri 2025-06-06 | No | Ramadan: report, [The National](https://www.thenationalnews.com/news/uae/2025/02/28/moon-sighting-uae-ramadan-2025-start/) (UAE Council for Fatwa's committee, 28 February). Eid al-Fitr: report, [Arabian Business](https://www.arabianbusiness.com/culture-society/uae-announces-first-day-of-eid-al-fitr) (Presidential Court statement). Eid al-Adha: report, [What's On](https://whatson.ae/2025/05/uae-announces-dates-of-eid-al-adha-2025/) (crescent sighted 27 May, Dhu al-Hijjah from 28 May) |
| 1447 | Wed 2026-02-18 | Fri 2026-03-20 | Wed 2026-05-27 | No | Ramadan: **WAM**, [Wednesday first day of Ramadan in UAE](https://www.wam.ae/en/article/bysbidd-breaking-wednesday-first-day-ramadan-uae). Eid al-Fitr: **WAM**, [Thursday completes Ramadan; Friday marks first day of Eid Al-Fitr](https://www.wam.ae/en/article/bz9l2ze-breaking-thursday-completes-ramadan-friday-marks). Eid al-Adha: report, [Khaleej Times](https://www.khaleejtimes.com/uae/uae-fatwa-council-dhul-hijjah-crescent-observed-may-17) (UAE Council for Fatwa: crescent sighted 17 May, Dhu al-Hijjah from 18 May) |
| 1448 | Mon 2027-02-08 | Tue 2027-03-09 | Sun 2027-05-16 | estimate | Umm al-Qura |
| 1449 | Fri 2028-01-28 | Sat 2028-02-26 | Fri 2028-05-05 | estimate | Umm al-Qura |
| 1450 | Tue 2029-01-16 | Wed 2029-02-14 | Tue 2029-04-24 | estimate | Umm al-Qura |
| 1451 | Sat 2030-01-05 | Mon 2030-02-04 | Sat 2030-04-13 | estimate | Umm al-Qura |
| 1452 | Thu 2030-12-26 | (2031) | (2031) | estimate | Umm al-Qura. 2030 has two Ramadan starts; this Ramadan's Eids fall in 2031, outside the range |

Checks that hold for every row (the generator's test suite `gulf-calendar` checks them): Eid al-Fitr is 29 or 30
days after Ramadan's first day; each announced date is within one day of Umm al-Qura; every estimate equals
Umm al-Qura; the weekday printed above is the date's weekday. Saudi Arabia's dates are sourced separately below
(all the same as the UAE's, 2018-2026).

**How the generator uses them:** with the option on, the Hijri month starts of Ramadan (9), Shawwal (10) and Dhu
al-Hijjah (12) in its embedded table are replaced by these dates (Dhu al-Hijjah starts 9 days before Eid al-Adha),
so every Hijri column (month, day, Ramadan Day, the flags) follows the announcement. Other months, and years outside
2018-2030, stay on Umm al-Qura.

## Ramadan and Eid in Saudi Arabia, 2018-2026
Sourced 2026-10-03 (owner's decision D2). In Saudi Arabia the Supreme Court's moon-sighting committee decides, and
the Royal Court or the Supreme Court announces it through SPA (the Saudi Press Agency). "**SPA**" is that official
announcement; "report" is Arab News or Saudi Gazette reporting it, used where no SPA page with the date in its title
or text could be read (SPA's pages load their text by script, so only titles and search excerpts were readable).
9 of the 27 dates are SPA, 18 reports.

| Hijri year | Ramadan, 1st day | Eid al-Fitr (1 Shawwal) | Eid al-Adha (10 Dhu al-Hijjah) | Same as the UAE? | Umm al-Qura differs? |
|---|---|---|---|---|---|
| 1439 | Thu 2018-05-17: report, [Saudi Gazette](https://saudigazette.com.sa/article/534941/SAUDI-ARABIA/Ramadan-to-begin-on-Thursday) | Fri 2018-06-15: report, [Arab News](https://www.arabnews.com/saudi-arabia/saudi-arabia-celebrates-eid-al-fitr-on-friday-1320956) | Tue 2018-08-21: report, [Saudi Gazette](https://saudigazette.com.sa/article/540960) | Yes | **Yes: Ramadan 2018-05-16** |
| 1440 | Mon 2019-05-06: report, [Saudi Gazette](https://saudigazette.com.sa/article/565624) | Tue 2019-06-04: report, [Saudi Gazette](https://saudigazette.com.sa/article/568007/SAUDI-ARABIA/Eid-Al-Fitr-in-Gulf-on-Tuesday) | Sun 2019-08-11: report, [Arab News](https://www.arabnews.com/node/1534151/saudi-arabia) | Yes | No |
| 1441 | Fri 2020-04-24: report, [Arab News](https://www.arabnews.com/node/1660636/saudi-arabia) | Sun 2020-05-24: report, [Arab News](https://www.arabnews.com/node/1678461/saudi-arabia) | Fri 2020-07-31: report, [Saudi Gazette](https://saudigazette.com.sa/article/595750/SAUDI-ARABIA/Saudi-Arabia-announces-July-31-as-first-day-of-Eid-Al-Adha) | Yes | No |
| 1442 | Tue 2021-04-13: report, [Arab News](https://www.arabnews.com/node/1841176/amp) | Thu 2021-05-13: **SPA**, [Royal Court: Tomorrow is Last Day of Ramadan and Thursday is First Day of Eid Al-Fitr](https://www.spa.gov.sa/w1556858) | Tue 2021-07-20: report, [Saudi Gazette](https://saudigazette.com.sa/article/608660/SAUDI-ARABIA/Supreme-Court-Arafat-day-on-July-19-first-day-of-Eid-Al-Adha-on-July-20) | Yes | No |
| 1443 | Sat 2022-04-02: report, [Arab News](https://www.arabnews.com/node/2055161/saudi-arabia) | Mon 2022-05-02: report, [Arab News](https://www.arabnews.com/node/2073716/saudi-arabia) | Sat 2022-07-09: report, [Saudi Gazette](https://saudigazette.com.sa/article/622394) | Yes | No |
| 1444 | Thu 2023-03-23: report, [Arab News](https://www.arabnews.com/node/2272956/saudi-arabia) | Fri 2023-04-21: report, [Saudi Gazette](https://saudigazette.com.sa/article/631803/SAUDI-ARABIA/Eid-Al-Fitr-to-begin-on-Friday-in-Saudi-Arabia) | Wed 2023-06-28: report, [Saudi Gazette](https://saudigazette.com.sa/article/633482/SAUDI-ARABIA/Supreme-Court-Arafat-Day-falls-on-June-27-Eid-Al-Adha-on-June-28) | Yes | No |
| 1445 | Mon 2024-03-11: **SPA**, [Royal Court: Ramadan Begins in Saudi Arabia Tomorrow, March 11](https://www.spa.gov.sa/en/N2062566) | Wed 2024-04-10: **SPA**, [Supreme Court: Tomorrow is the Last Day of Ramadan and Wednesday is the First Day of Eid Al-Fitr 1445 Hijri](https://www.spa.gov.sa/en/N2080637) | Sun 2024-06-16: **SPA**, [Supreme Court: Friday is the start of Dhul-Hijjah, Arafat on Saturday 15/06/2024 (French edition)](https://spa.gov.sa/fr/N2118059) | Yes | No |
| 1446 | Sat 2025-03-01: **SPA**, [Royal Court: Ramadan Begins in Saudi Arabia Tomorrow, March 1, 2025](https://spa.gov.sa/en/N2272538) | Sun 2025-03-30: report, [Saudi Gazette](https://saudigazette.com.sa/article/650534/SAUDI-ARABIA/Saudi-Arabia-announces-Sunday-as-first-day-of-Eid-Al-Fitr) | Fri 2025-06-06: **SPA**, [Supreme Court: Wednesday Marks Start of Dhul-Hijjah, Arafat Day on Thursday, June 5](https://www.spa.gov.sa/en/N2327792) | Yes | No |
| 1447 | Wed 2026-02-18: **SPA**, [Royal Court: Ramadan Begins in Saudi Arabia Tomorrow, February 18, 2026](https://www.spa.gov.sa/en/N2516805) | Fri 2026-03-20: **SPA**, [Supreme Court Announces Friday First Day of Eid Al-Fitr](https://www.spa.gov.sa/en/N2541040) | Wed 2026-05-27: **SPA**, [Supreme Court: Monday Marks Start of Dhul-Hijjah, Arafat Day on Tuesday, May 26](https://www.spa.gov.sa/en/N2587986) | Yes | No |

**Every Saudi date is the UAE's date**, and only one differs from Umm al-Qura: Ramadan 1439 started on Thursday 17
May 2018 after the crescent was not seen on 15 May (Sha'ban completed 30 days), while Umm al-Qura's 1 Ramadan 1439
is Wednesday 16 May 2018, as in the UAE. The Saudi dates are **not** in `assets/js/gulf-dates.js`: its `events` list has
no country, so a second country needs a change to the file's structure (see "Open").

## Official weekends in the GCC
Government (public sector) weekends. Private companies may keep a different one, and Sharjah's government has had a
Friday-to-Sunday weekend since 2022 (a four-day week); the generator does not model either.

| Country | Weekend | Since | Source |
|---|---|---|---|
| UAE | Saturday-Sunday (Friday afternoon off for the government) | 1 January 2022 | Announced by WAM on 7 December 2021: [Al Jazeera](https://www.aljazeera.com/economy/2021/12/7/uae-announces-changes-to-workweek-for-employees-of-govt-sector), [Gulf News](https://gulfnews.com/uae/uae-saturday-sunday-weekend-abu-dhabi-announces-four-and-half-day-working-week-1.1638867209602) |
| UAE | Friday-Saturday (before: Thursday-Friday) | 1 September 2006 | Cabinet decree 21/2006: [Gulf News](https://gulfnews.com/amp/story/uae%2Ffriday-saturday-weekend-in-uae-from-september-1.237326), [Khaleej Times](https://www.khaleejtimes.com/uae/new-weekend-holidays-from-september-1?amp=1) |
| Saudi Arabia | Friday-Saturday (before: Thursday-Friday) | 29 June 2013 | Royal decree of 23 June 2013: [Arab News](https://www.arabnews.com/news/455923), [Crowell](https://www.crowell.com/en/insights/client-alerts/saudi-arabia-changes-weekend-to-friday-saturday-from-29-june-2013) |
| Oman | Friday-Saturday (before: Thursday-Friday) | 1 May 2013 | Royal decree: [Gulf Business](https://gulfbusiness.com/en/2013/industry/oman-to-shift-to-friday-saturday-weekend), [The Peninsula](https://thepeninsulaqatar.com/article/07/04/2013/oman-to-shift-weekend) |
| Kuwait | Friday-Saturday (before: Thursday-Friday) | 1 September 2007 | [Asharq Al-Awsat](https://en-archive.aawsat.com/2007/05/27/kuwait-switches-to-friday-saturday-weekend/) |
| Bahrain | Friday-Saturday (before: Thursday-Friday) | 1 September 2006 | [Global Voices](https://globalvoices.org/2006/08/02/bahrain-new-weekends/) |
| Qatar | Friday-Saturday (before: Thursday-Friday) | 1 August 2003 | [Arab News](https://www.arabnews.com/node/234601) |

Before the first change of each country, only the weekend that change replaced is known; earlier history was not
checked, so a calendar that starts before it shows that weekend for every earlier year.

## Open
- The Bahrain, Kuwait and Qatar weekend sources are news reports of the decision, not the decrees themselves.
- Several past Ramadan and Eid dates are sourced to a newspaper's report of the official announcement; the WAM
  pages for those years were not found in this check.
- Saudi Arabia's 2018-2026 dates are in this file only. To use them in the generator or the MCP, `gulf-dates.js`
  needs a country for its dates (decision for the owner), for example `announced: { uae: [...], ksa: [...] }`
  beside the current `events`, which stays the UAE's so the generator's output does not change. 18 of the 27 Saudi
  dates are newspaper reports; the SPA pages for those years were not found or not readable.
