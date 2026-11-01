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
