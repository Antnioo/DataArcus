# The beta page draft: every claim and where it comes from

Draft for the owner (branch `content/beta-page`, from main `ad65ee7`). `beta.html` is **noindex**, **not in the
navigation** and **not in the sitemap**: nothing links to it until the owner approves it. Screenshots in this folder:
`beta-en-390.png`, `beta-en-1440.png`, `beta-ar-390.png`, `beta-ar-1440.png` (full page, real fonts). The Arabic is
for the owner to read and correct.

Each "today" line is true of main `ad65ee7` (MCP `npm test` 340 checks, package 0.2.5). Round 10 (0.2.6, tonight)
is **not** counted.

## What it does today
| Line on the page | True because | Round, commit |
|---|---|---|
| Reads the structure, not the data; .pbip, model.bim, .pbit | `read_model`; `mcp/PRIVACY.md` section 3 | phase 2, round 0 (`e8fe171`) |
| A summary first on a large model, then the tables you name | `read_model` summary and `tables`; the cap of 100 tables | round 4 (`19c5408`), round 7 (`3564fe7`) |
| Score and findings naming the objects; unused or broken fields | `check_model_health` | phase 2; round 2 (`ada2942`) |
| Months that sort A to Z, measures without a format, ready script file applied by hand | sort and format findings with scripts; scripts written to files, never in the answer | round 2 (`ada2942`), round 5 (`8b1d6ae`) |
| Numbers without a thousand separator | `fixes.THOUSANDS` | round 6 (`ed13112`) |
| Hijri, Ramadan, Eid columns; weekend by Gulf country; Calendar Generator's dates against the announced ones (UAE, Saudi Arabia) | `gulfCalendar` section of `check_model_health`; UAE and Saudi compared with announced dates | the Gulf calendar beta cut (`b76bbbf`) |
| Shows a plan and waits for the go | server instructions and tool descriptions; agent-level plan-and-go 8 of 8 | round 5 (`8b1d6ae`) |
| Binds exactly the fields you approved | `create_report` `fields` | round 6 (`ed13112`) |
| KPI cards, charts, table, slicers, tooltip page, page buttons, filter rail or slide-in panel, phone layout | `create_report` | phase 2, rounds 0 and 1 (`80d3a00`) |
| Text and button sizes measured in Power BI Desktop | `cardFit` and the measured tables (`scripts/tests/DESKTOP-TESTS.md`) | rounds 0 and 1; the logo text, round 6 |
| Arabic mirrored; page buttons in reading order; Arabic names only the ones you give | right-to-left pages and buttons; `displayNames` | round 2 (`ada2942`) |
| KPI cards with a thousand separator (101,914, not 101.914K) | the card's report-side format (D8's entry) | round 9 (`58adf6f`) |
| Theme with its colour contrast checked | `generate_theme` returns the contrast checks | phase 2 |
| Page filters: "Ramadan only", one Ramadan by its Hijri year | `create_report` `pageFilters`; the "every Ramadan" note | round 8 (`38f9230`), round 9 (`58adf6f`) |
| Never changes the model, never overwrites or deletes, one folder | path checks, free names, links refused | round 3 (`9b5d666`), round 5 (`8b1d6ae`) |
| Points out names with invisible characters | `hiddenCharacters` | round 7 (`3564fe7`) |
| Microsoft's validator: 0 errors on our test models | the validator run in the tests on the test exports (rounds 8 and 9: 0 errors, English and Arabic). Worded "on our test models": we don't run it on every user's report | rounds 0 to 9 |

## Experimental
| SVG picture columns in a table, a measure only in the report, "still tuning how it looks" | `create_report` `svgColumns`; on main the picture size in a row is Desktop's default (D-P1b) | round 9 (`58adf6f`); round 10 works on it |

## Planned (each line starts with "Planned")
| Line | Source |
|---|---|
| The number check | `mcp/plans/NUMBER-CHECK.md` (plan only; the privacy decision is with the owner) |
| Check any report | `mcp/plans/CHECK-REPORT.md` (plan only) |
| Edit a report | the owner's picks of 2026-10-04 (no plan file yet) |
| Add a Gulf calendar | `mcp/plans/ADD-GULF-CALENDAR.md`; being built on `feat/add-gulf-calendar` (not on main) |

## Privacy box
Each line is a plain-words version of `mcp/PRIVACY.md` (sections 1 to 5) as it is on main. "It doesn't connect to
Power BI Desktop ... runs no queries" is true today and is exactly what the number check's decision would change: if
the owner says yes to it, this line changes with PRIVACY.md.

## What it needs, how to join
From `business/beta/INSTALL.md` and `INVITE.md` (engine, `beta-kit`): Windows 10 or 11, Power BI Desktop (tested on
2.158), Claude Desktop signed in, a model saved as .pbip; 5 testers, 1 to 15 November, about two hours, a 30-minute
setup call, a year of Pro free from Pro's launch (owner 2026-10-03). Join: hello@dataarcus.com or the contact form.

## Words not used
Not "the only", "the first" or "Microsoft can't". Microsoft's tools are named only as what DataArcus works next to.
