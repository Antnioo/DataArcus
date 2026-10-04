# Finding 002: "34.0%" was our mistake: the expected number came from a rounded card

Test notes for a public finding by Abdelrahman (DataArcus). Tested **2026-10-03** in Power BI Desktop; recomputed
without Power BI the same day with [`expected.py`](expected.py). No vendor is involved: Power BI did what it should,
and the mistake was in our own test plan.

## What was tested
| | |
|---|---|
| What | A number-format fix written by our own model health check (`check_model_health`, the DataArcus MCP): a TMDL script that sets `formatString` to `0.0%` on the two percentage measures (and `#,0.00` on three others) |
| The measure | `Total Sales vs Last Ramadan %`, with no format string; its KPI card showed **0.34** |
| Power BI | Power BI Desktop **2.158.1177**, Windows. The script was applied in TMDL view (Preview, then Apply) |
| Data | The made-up "Ramadan Test" model in this repo, [`scripts/tests/fixtures/model-health/tmdl-ramadan`](../../scripts/tests/fixtures/model-health/tmdl-ramadan). A calendar from 2022-01-01 to 2027-12-31 with Umm al-Qura Hijri months; Sales is 1 on a normal day and (Hijri year − 1440) × 100 + day on day *d* of Ramadan, so every total is known before any run |
| Full record | [`scripts/tests/DESKTOP-TESTS.md`](../../scripts/tests/DESKTOP-TESTS.md), "2026-10-03: round 2 built", "The open checks", item 2; the plan's row R2.6 in [`mcp/WORK.md`](../../mcp/WORK.md) |

## What happened
1. **Before the run**, the test plan wrote down the expected result: after the script, "the % card shows 34.0%"
   (`mcp/WORK.md`, round 2 plan, row R2.6).
2. The script was accepted. Preview showed `formatString` added to the five measures, Problems 0, and "Changes
   applied to the model."
3. **The card showed 33.8%.** A DAX query on the open model gave 0.3378, and `FORMAT` gave "33.8%". The other cards
   read 101.91K, 74.68K and 23.64K.
4. **The cause:** the expected number was wrong. "34.0%" had been worked out from the card's rounded "0.34". With no
   format string, the card showed the value at two decimals: 0.3377971 → 0.34, which was then read as 34%.
5. The plan's table was corrected to 33.8%, with a note saying why. **The result was not adjusted.** The rule since:
   expected numbers come from the model (a DAX query) or from the data's own rule, never from a visual.

## Reproduce (no Power BI needed)
```bash
python3 findings/002/expected.py     # Python 3 only; run from the repository root
```
The script reads the model's own Calendar DAX (its Umm al-Qura month starts) and rebuilds the 2,191 days. It applies
the Sales rule and works out the three measures with no filter, as the KPI cards show them. Output, 2026-10-03:

```
days 2191
Total Sales                      101914
Total Sales Last Ramadan         74675
Total Sales vs Last Ramadan %    0.3377971  -> 0.0% format: 33.8%   card without a format: 0.34
the 'expected' worked out from the card: 0.34 -> 34.0%
```

These are the same as DAX in Power BI Desktop. `DESKTOP-TESTS.md`, 2026-09-30, records "DAX gave 101914 / 74675 /
23635 / 0.3377971" on six reports.

The Desktop part needs Power BI Desktop on Windows:
- Load the model.
- Apply the format script from the health check (`fixes.NO_FORMAT`, written to a `.tmdl` file next to the project).
- Read the card.

## What it does not show
- **Not a Power BI behaviour:** Power BI rounded and formatted exactly as documented. This is about where an expected
  number should come from.
- **One measure, one model, one sitting.** Nothing here says how often this kind of mistake happens.
- The sentence "a tool that checks a report by reading its screenshot inherits every rounding on it" is **our
  judgement**, drawn from this case, not a measured result.

## Sources (read 2026-10-03 and 2026-10-04)
- Microsoft Learn, custom format strings in Power BI Desktop (updated 2026-08-16; `0.0%`: 0.156 → 15.6%):
  https://learn.microsoft.com/power-bi/create-reports/desktop-custom-format-strings
- This repo: `scripts/tests/DESKTOP-TESTS.md` (round 2, the open checks); `mcp/WORK.md` (round 2 plan, row R2.6).
