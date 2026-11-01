# Laptop part 8 (rc.7): English vs Arabic, every page, read by the reviewer (1 Nov)
Source: lab/rc031-part8 shots (Arabic) beside lab/rc031-part4 shots (English originals). Sheets sent to the owner.

## New (not in any builder's list yet)
1. Fintech p3: the four status lines (Critical, Schedule, Cost, Delivery) are in reverse order top to bottom in Arabic (Delivery first). A top-to-bottom list must keep its order; likely a card's values reversed (newCard Data reversed in report-mirror.js) on a vertical layout.
2. Time runs left to right on some Arabic pages and right to left on others: Consumer Complaints p2 (Resolution Outcome Trends) and p4 (Resolution Trends by Region): Jan -> Aug left to right, while p1 runs Aug -> Jan; AdventureWorks p3 (both line charts) and p4 (Revenue per Customer): left to right, while p1 and p7 are reversed; RepeatIQ p5 small multiples left to right. Part 4 named CC p4 and AW's customer line: still open.
3. Call Center p1 and p2: the month buttons Jan, Feb, Mar keep the English order left to right (time elsewhere starts at the right).
4. Call Center p2: the four agent cards keep their English places (Becky top left) and the photo stays at each card's left.
5. Call Center p1: the donut's legend shows two cut labels («المكالما...» twice): answered and unanswered cannot be told apart.
6. Call Center p1: the agent card's values are not in a column in Arabic (English: label | value columns); the contact line reaches the card's edge.
7. AdventureWorks p4: the two buttons "Total Customers" and "Revenue per Customer" stay English (other buttons are Arabic).
8. Consumer Complaints p2: text-value cards ("Banking", "Managing an account") are left-aligned while the number cards beside them are right-aligned.
9. Legend titles cut in Arabic (Consumer Complaints p3 donuts «...حجم الشر», «...سجل الإجرا»).
10. Fintech p1 watchlist: a fourth column, out of view in English, shows cut at the right edge in Arabic (the wide-table case, MX1 D).

## More matrices with names on the left (MX1's case; part 9 checks each)
RepeatIQ p2 (lifecycle funnel, cohorts), p4 (product pricing), p5 (refund risk); AdventureWorks p1 (top 10 products); Fintech p3 (tasks, team, milestones).

## Power BI cannot mirror these (by design; the plan should say each)
Decomposition trees (RepeatIQ p3, AdventureWorks p5), the treemap (RepeatIQ p4), Power BI's own waterfall (RepeatIQ p3), scatter axes, maps.

## Known, already queued
Call Center: heatmap charts, ratings on stars, one KPI title (MP1d). Model values in English, «اليوم:Thursday», RepeatIQ KPI titles cut, Fintech "..." labels (0.3.2).
