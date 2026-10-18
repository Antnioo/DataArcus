# B-146: the aggregation guard's holdout (18 Oct 2026)

What `assets/js/aggregation.js` calls `non_additive` (never stack or sum it) and `semi_additive_time` (adds up across
categories, not across time) on models it was not written for, every call read and marked. Metadata only: measure
names, DAX shapes, format strings; no data was read. Re-run: `node aggregation-holdout.mjs all <folder of the clones>`.

## The models
- The repo's fixtures: 9 models (`mcp/fixtures`, `mcp/test-models`, `scripts/tests/fixtures/model-health`,
  `assets/data/model-health-sample.pbit`; the large synthetic model's measures are generated from templates).
- 18 public Microsoft models (17 read): microsoft/Analysis-Services `d3ccb5032c90` (3 model.bim and the SamplePBIP
  project), microsoft/fabric-samples `9379bb140202` (Bank Customer Churn Analysis), microsoft/fabric-toolbox
  `29264d36e5fd` (FUAM x5, FCA, Gateway Monitoring, Spark Monitoring, Query Capacity Correlation, the Workspace
  Monitoring and SemanticModelAudit templates, Gateway Monitor.pbit), and the COVID-19 US Tracking Sample .pbit
  already in the repo. Gateway Monitor.pbit holds no model (a report-only template): refused, not counted.
  Microsoft's `.pbix` samples were not used: a .pbix holds the data cache (PRIVACY.md section 3).

## Result (the rule as committed)
| | models | measures | non_additive | semi, asked | semi, handled in the DAX | unknown | wrong |
|---|---|---|---|---|---|---|---|
| Microsoft | 17 | 1161 | 381 | 10 | 14 | 756 | 0 |
| repo fixtures | 9 | 1023 | 537 | 10 | 132 | 344 | 0 |

Every call is in `aggregation-holdout.tsv`, marked. **0 wrong non_additive** (the bar), 0 wrong semi-additive.
"unknown" is not a miss to fix: the classifier never says a measure IS additive, and nothing is said or changed for
an unknown measure. Recall was not the bar (many unknowns are plain SUMs, text measures or EXTERNALMEASUREs).

## Wrong calls found on the way, each fixed in the rule (never a model special-cased)
1. A division by a constant or by one selected unit (`DIVIDE ( SUM ( x ), [Selected Time Unit Value] )`, the unit
   measure being `SELECTEDVALUE ( 'Time Units'[UnitValue] )`; `SUM ( x ) / 1000`) is a unit conversion of a total,
   additive: 90 calls on fabric-toolbox. Now the numerator's shape decides.
2. A `//` inside a text (`"https://..."`) was read as a comment start, so 3 URL text measures looked like divisions.
   The DAX is now read in one pass: texts, quoted names and `[...]` first, comments only outside them.
3. A % format string on arithmetic the reader can't follow (`[Previous Quarter Sales] * ( [Days QTD] / [Days in
   Quarter] )`, an amount prorated, formatted % in Microsoft's file): 1 call. The format decides only when the DAX's
   top level is not such arithmetic.
4. Text measures built with `&` (titles, an SVG image named "Quota Ratio"): 7 calls by name. A measure whose top level
   joins text is now text, never a ratio.
5. "utilization" as a ratio word: "Dynamic M1 cumulative utilization (GB)" is an amount (now a cumulative, asked).
6. "Inventory" over `COUNTROWS ( reports )` is a catalogue, one row per item, not a stock level: 4 calls. A stock or
   inventory word reads as a level only over a SUM.
7. "Stock Movements Total Net Amount" (the synthetic model) is a flow: 4 calls. A level word with a flow word
   (movements, transactions, receipts, sales, transfers...) reads as a flow.
8. A name that reads as both an average and a cumulative ("Avg cumulative static storage hourly") is an average.
