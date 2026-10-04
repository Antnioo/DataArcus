#!/usr/bin/env python3
"""Finding 002: work out the Ramadan Test model's expected numbers from its data rule, without Power BI.

Reads the model's own Calendar DAX (the Umm al-Qura month starts in the TMDL file), rebuilds the calendar
2022-01-01 to 2027-12-31 and the Sales rule (1 on a normal day; (Hijri year - 1440) * 100 + Ramadan day on a Ramadan
day), then evaluates the three measures with no filter, as the KPI cards show them.
Usage, from the repository root: python3 findings/002/expected.py
(or pass the path to another copy of tmdl-ramadan/definition/tables/Calendar.tmdl)
"""
import re, sys, datetime as dt

path = sys.argv[1] if len(sys.argv) > 1 else 'scripts/tests/fixtures/model-health/tmdl-ramadan/definition/tables/Calendar.tmdl'
src = open(path, encoding='utf-8').read()
starts = sorted((dt.date.fromisoformat(d), int(y), int(m)) for d, y, m in re.findall(r'\{ "(\d{4}-\d\d-\d\d)", (\d+), (\d+) \}', src))
day, end = dt.date(2022, 1, 1), dt.date(2027, 12, 31)
rows = []
while day <= end:
    s, hy, hm = max(x for x in starts if x[0] <= day)          # Hijri Month Start = MAX(HStart <= Date)
    hd = (day - s).days + 1
    ram_day = hd if hm == 9 else None
    amount = (hy - 1440) * 100 + hd if hm == 9 else 1
    rows.append((day, hy, ram_day, amount))
    day += dt.timedelta(days=1)

total = sum(r[3] for r in rows)
this_ramadan = sum(r[3] for r in rows if r[2] is not None)
pairs = {(r[1] - 1, r[2]) for r in rows if r[2] is not None}   # SUMMARIZE (Hijri Year, Ramadan Day), shifted a year
last_ramadan = sum(r[3] for r in rows if r[2] is not None and (r[1], r[2]) in pairs)
pct = (this_ramadan - last_ramadan) / last_ramadan
print(f"days {len(rows)}")
print(f"Total Sales                      {total}")
print(f"Total Sales Last Ramadan         {last_ramadan}")
print(f"Total Sales vs Last Ramadan %    {pct:.7f}  -> 0.0% format: {pct*100:.1f}%   card without a format: {pct:.2f}")
print(f"the 'expected' worked out from the card: {round(pct, 2)} -> {round(pct, 2)*100:.1f}%")
