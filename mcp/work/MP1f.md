# MP1f (0.3.1): laptop part 9's cards, legend and the icon regression

## Summary
- **Approval:** the reviewer's brief "MP1f" (1 Nov, 13:07), from laptop part 9 (rc.8, integration b40cb786; engine
  lab/rc031-part9 RESULTS.md block C, quoted in the brief; not readable here). Verdict NO but close. Not this job:
  tables, matrices, keptInView, matrixAsTable, the heatmap, MR1's path list (MX3).
- **Evidence:** DataArcus branch `evidence/0.3.1-shapes` (c9a151d9, read only): Call Center p1 positions (the four KPI
  text boxes, their icons and sparklines), the legend donut a28b4206, the agent cards bae91c53 and c47dbc53. Not in it:
  the KPI text boxes' paragraphs, RepeatIQ p4's KPI strip, Fintech p2's KPI cards (made-up from the brief's words and
  the p1 strip 8886cd92: said per item).
- **Base:** `fix/0.3.1-mp1f` from `origin/integration/0.3.1` at b40cb786. Push only this branch.
- **Scope:** `mcp/lib/twin-pages.mjs` (1: iconRoom; 3: the card's reference label layout), `mcp/lib/twin-texts.mjs`
  (3: no padding where the layout makes the column), `assets/js/report-mirror.js` (2: a measures legend's order; 3: the
  name beside the photo; 4, 5: a value entry with no alignment of its own under a centred default; build:min, stamps),
  a new suite `mp1f`.
- **Expected checks:** (written before the work) a new suite `mp1f`, about 15 checks, red on b40cb786 first except
  guards: I1-I4 (the four real Call Center boxes, 5714c737 a52fc2b5 b91fa3b2 ce4819bc at their real coordinates, each
  with a title, a value, a comparison line and a legend: width kept, x mirrored, no "ends before the icon" move); I5
  (each title paragraph ends with a no-break space run as wide as the icon's room, measured); I6 (the other paragraphs
  unchanged); I7 (guard: a one-paragraph title box still ends before its icon, MD-c's shape); L1 (a legend donut of two
  measures, no category: the measures' order reversed, so the first item stands at the right over its value); L2, L3
  (guards: a ring with its legend hidden, a donut with a category: unchanged); R1 (an agent card whose English titles
  are padded into a column: referenceLabelLayout style "tabular"); R2 (its Arabic titles written without padding); R3
  (the p2 agent grid: photo at the right and the name, the card's value, right-aligned beside it); R4 (guard: a one-value
  card with no image keeps its value alignment); K1 (RepeatIQ: a 5-value strip, centred default, the refund rate's own
  value entry with no alignment: left without one, so it stays centred); K2 (Fintech p2: 6 values centred, two own
  entries: none set right); K3 (guard: MP1e A1's shape, a default not centred: every entry right). mp1, mp1-shapes
  (MD-c, the never-shrink guard), mp1e: green; mp1e R1 changes (said in Risky changes). Full run: the base's suites + 1.
- **State:** plan written; next: the red tests.
- **Resume:** write `mcp/test-0.3.1-mp1f.mjs`, run it on b40cb786 (red), then the fixes.

## The causes and the plan
1. (regression) MP1d's iconRoom narrows the whole box (Call Center: by 52.6 page px, x kept), so every right-aligned
   line moved left onto the sparklines and the two comparison lines wrapped. Plan: a box with any other non-empty
   paragraph keeps its width; the icon's room goes to the title's paragraph only (the paragraph English indented with
   tabs, else the first): its trailing tabs (MP1c moved them to its end) become one run of no-break spaces as wide as
   the room (the box's end less the icon's start, 4 px gap; text-measure.js space width at the run's size), measured
   rather than tab stops (part 8: the wide Arabic outgrew the stops). A box of one paragraph narrows as before (MD-c).
   No paragraph indent exists in a PBIR text box (none in the format), so no right indent.
2. The donut a28b4206 is a legend strip of two measures (Answered, Unanswered) in projection order; a legend reads left
   to right in Power BI. Choice: reverse the measures' order (the legend's), not unmirror the value cards: the page
   reads from the right, so the first item (مُجابة) stands at the right over 1,298 as in English; and a donut's slices in
   reverse order are the English ring seen in a mirror. Only a donut or pie with a shown legend and no category.
3. The padding (space + RLM) depends on measured Arabic widths Desktop does not match, so no column. The card has its
   own table layout for reference labels: `referenceLabelLayout.style` "tabular" (Power BI's theme schema 2.149:
   "Table"); written where the English titles are padded into a column, and the Arabic titles then carry no padding.
   p2's name is the card's value (the small multiples' header is transparent): its alignment unset (left) while the
   photo went right; a card whose image goes right gets its value right-aligned (centred kept).
4, 5. MP1e set "right" on every value entry not centred, also an entry with no alignment of its own that takes the
   centred default: RepeatIQ p4's refund rate and Fintech p2's 54 and 44.4% (a count and a percentage: own entries, the
   likely shapes; not in the evidence). Plan: an entry with no alignment under a centred default is left as it is.

## Before and after
| Item | Before (rc.8) | After | Where | Test |
|---|---|---|---|---|
| 1 | a KPI text box beside its icon narrowed whole (215.71 -> 162.9, as part 9 measured): every right-aligned line 52.6 px left | a box with other lines keeps its width; the title's paragraph ends with no-break spaces as wide as the icon's room (52.8 for Calls), its tabs gone; a one-line box narrows as before | twin-pages.mjs iconRoom, titleRoom | mp1f I1-I7 |
| 2 | the legend donut listed Answered, Unanswered left to right; the answered value at the right | its measures in reverse: «مُجابة» at the right over 1,298 | report-mirror.js mirrorVisual (plain) | mp1f L1-L3 |
| 3 | titles padded with space + RLM, values ragged in Desktop; the name (the card's value) left, the photo right | referenceLabelLayout style "tabular", titles whole; a card whose image goes right gets its unset value alignment right | twin-pages.mjs cardColumn; twin-texts.mjs (no padding); report-mirror.js newCard | mp1f R1-R4; mp1e R1 |
| 4, 5 | an own value entry with no alignment set right under a centred default | left without one (stays centred); a default not centred: every entry right as before | report-mirror.js newCard | mp1f K1-K3 |

## Decisions I made
- 1: "other paragraphs" are paragraphs with text; the title's paragraph is the one whose runs end with spaces or tabs
  (English indented it under the icon; MP1c moved them to its end), else the first with text. The room is the box's
  end less the icon's start plus 4 px; the spaces are counted at the run's own size (12pt default). The spaces take the
  replaced run's style. Not a right indent: a PBIR text box paragraph has none. Not "narrow when the lines fit": the
  value lines fit and still moved onto the sparkline (Talk Time's «3m 46s»), so any other line keeps the width.
- 2: the legend's order, not the cards: the page reads from the right and the cards are mirrored with it; the first
  legend item (Answered, the English first) stands at the right over its value. Only a donut or pie with a shown legend
  and no category (a category's legend follows the data's order: not seen in a part 9 shape; left as it is).
  The plan's sentence for these visuals ("moved only") is unchanged: a longer one pushed terminology-sheet's plan
  over the answer's cap by one text (TS-2, seen and reverted).
- 3: "tabular" is Power BI's own "Table" style for reference labels (theme schema 2.149, referenceLabelLayout.style);
  the card's titles and values in two columns, so no measured padding is needed. Written only where the English pads
  its titles into a column (two or more). The value alignment: only when the image goes from left to right and the card
  has one value (the agents' name); a value already aligned is kept.
- 4, 5: the cause is a shape the evidence does not hold (p4's strip, Fintech p2's cards): a value entry of its own
  (a percentage's precision, a count's display units) with no alignment, under the centred default entry. If the real
  entries carry their own "left", this rule does not reach them: the laptop says.

## Risky changes
- mp1e R1 asserted the padding this job replaces (the brief: the padding does not make a column in Desktop); it now
  asserts the titles whole and the table layout. No other test's expectation changed.
- "tabular" has not been drawn in Desktop here: if Desktop ignores it, the titles are whole (no padding) and the values
  ragged as in rc.8; the laptop decides (block "For the laptop").

## For the laptop (part 10)
- Call Center p1 (Overview), the four KPI boxes (Calls, Resolution Rate, Avg Call Duration, Avg Speed of Answer): each
  box as wide as English; the title clear of its icon by about 4 px; «3m 46s» and «67» clear of their sparklines; the
  comparison lines («1,772 | ▼ -8.80 % شهريًا») on one line, no scrollbar; the Calls legend shows «الأعلى».
- Call Center p1: the donut legend «● غير مُجابة ● مُجابة» left to right, «مُجابة» over 1,298 / 80.3 %.
- Call Center p1, Dan's card: the four values in one column (the card's table layout); say if Desktop ignores it.
- Call Center p2 (Agent Performance): each agent's name beside the photo at the card's right.
- RepeatIQ p4: the refund-rate card's title whole and its value centred as in English; if not, its value entry's own
  alignment (the shape is not in the evidence: send the card's visual.json).
- Fintech p2: all six KPI values centred, "54" and "44.4%" too.

## Seen, not in scope
- A one-value card with no image keeps an unset alignment (left in Desktop?) under a right-aligned title: rc.24 turns
  only an explicit "left". Not asked; no shape here.
- The phone layouts' text boxes keep their tabs (iconRoom works on the page's boxes only), as before.

## Lessons for the reviewer
- Why MP1d's checks and mp1-shapes passed with item 1's regression in: their KPI boxes were the title alone (one
  paragraph), the part 8 shape quoted then; the real boxes hold four lines, and no check looked at the lines under the
  title. A rule that changes a box must be tested on the real box's whole content, not the one line the report named.
- The never-shrink guard measures the box (162.9 is 75.5 % of 215.71, over its 75 %); a narrowing that keeps the box
  but moves its text needs the text's own check, now in the rule itself.
