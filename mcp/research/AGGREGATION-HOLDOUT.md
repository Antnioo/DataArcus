# B-146: the aggregation guard, measured (18 Oct 2026)

What `assets/js/aggregation.js` calls `non_additive` (never stack or sum it) and `semi_additive_time` (adds up across
categories, not across time) on public models, every call read and marked. Metadata only: measure names, DAX shapes,
format strings; no data was read, no .pbix opened (a .pbix holds the data cache, PRIVACY.md section 3).

Two sets, kept apart:
- **the tuning set** (26 models): the rule was written and corrected on it, so its numbers say nothing about precision
  on new models. Listed in `aggregation-holdout.tsv` (the file keeps its first name), re-run with
  `node aggregation-holdout.mjs all <folder of the clones>`.
- **the fresh holdout** (34 models from 15 public repos, never seen while writing the rule): run once with the rule
  frozen, counted, and only then used to fix the rule. Its per-measure list is not copied into this repo (other people's
  repos, read only); it is reproduced by cloning the repos below and running the same classifier.

## 1. The fresh holdout, rule frozen (commit `6c9177f`, `aggregation.js` blob `e09e77f`)
Repos (shallow clones, 18 Oct 2026; every `.SemanticModel`, `.Dataset`, `model.bim` and `.pbit`, never a backup, a
build output or a test fixture): tshihab07/Healthcare-Patient-Analytics `0cf3ca378329`, The-inspiringHarsh/
logistics-powerbi-project `904403226d53`, andressachaves/logistics-dashboard-powerbi `66003f30075c`,
Priyagupta0/HR-ANAYTICS-POWERBI-DASHBOARD `32bd31d23fd5`, JLCaraveo/Reporte_Ventas_PowerBI `1a29fc5a6c60`,
MrPerfectH/Semantic-Model-Viewer `80361abcc1d7` (Models/demo only), FabricTools/pbir-samples `2713c2ed3115`,
olivierpecheux/copilot-adoption-impact-report-lite `1edd7d873b1e`, vikrambala/PowerBI-for-Wordpress `4b0851c81729`,
vinijmoura/Azure-DevOps `5c92c7d9c22a`, Azure/CCOInsights `8c6b67d124cd`, Panwars259/powerbi-german-companies-
financial-analysis `a4e0464fd832`, kaluabreu/delivery-center-powerbi `b524f114f0f4`, josemgomez-cuervo/powerbi-cicd-demo
`6be164092db9`, Haweee47/powerbi-autopilot `dc73e88b6905`. 39 models found, 34 read (5 Haweee47 templates hold no
tables), 916 measures. The two Microsoft models the brief also named (COVID-19 US Tracking, Bank Customer Churn) were
already in the tuning set, so they are not counted here.

| frozen rule | calls | right | wrong | precision |
|---|---|---|---|---|
| non_additive | 399 | 315 | 84 | **0.789** |
| semi_additive_time | 28 | 25 | 3 | 0.893 |

The wrong calls, by cause (counts per occurrence; Haweee47's models repeat measures across near-copies):
1. **A unit chosen once for the visual** (35): `DIVIDE ( [Sales], [Unit Scale] )`, `[Unit Scale]` being
   `SWITCH ( TRUE (), t >= 1E9, 1E9, ... )` over the ALLSELECTED total: a unit conversion of a total, additive. The rule
   read divisions by constants, but not `1E9` as a constant.
2. **A share of the total** (8): `DIVIDE ( x, CALCULATE ( x, ALLSELECTED () ) )`, `ALL ( Product )`, a SUMX of each
   row's share: the rows add up to the total row across the dimension the denominator removes.
3. **A distinct count of the table's own row id** (41): `DISTINCTCOUNT ( FactShipments[ShipmentID] )` and the measures
   built on it, `Resources[Resource Id]`, `'Resource Groups'[Resource Group Id]`, PR and project ids: one row per id, so
   the parts add up.
4. **Snapshots** (3): "Qtd" (Portuguese for quantity) read as QTD; a YTD minus a YTD asked about though each is
   evaluated per period; a `>= MIN ... <= MAX` period window read as a running total.

## 2. The fresh holdout after fixing on it (a second number, not a holdout any more)
Each cause fixed in the rule, none special-cased, each pinned by a check in `mcp/test-b146.mjs` (7 red on the frozen
rule): constants with an exponent; a denominator over ALL / ALLSELECTED / REMOVEFILTERS / ALLEXCEPT is a share
(unknown); `DISTINCTCOUNT ( T[c] )` where c is T's key column or T's own id by name is unknown; YTD/QTD/MTD only in
capitals; arithmetic of measures handled over time is handled; a window with both ends is not a running total.

| after fixing on the holdout | calls | right | wrong | precision |
|---|---|---|---|---|
| non_additive | 312 | 310 | 2 | **0.994** |
| semi_additive_time | 28 | 28 | 0 | 1.000 |

Still wrong (2): a distinct count of a table's own id named otherwise (`Disks[Resource Id]`, a Portuguese
`dStores[ID Loja]`). Recall lost (right calls now unknown, which is never wrong): 5: two distinct counts of policy ids
in a table whose name starts with "Policies" (repeated there), a share of one category, two displays scaled per row.

## 3. The tuning set, re-read after the holdout (and my first marking corrected)
The first version of this page said "0 wrong" on the tuning set. That was not true: **I had marked 99 wrong calls
right**: 94 "Share %" measures of the large synthetic model (`DIVIDE ( [x], CALCULATE ( [x], ALL ( 'T' ) ) )`, a
share of the total), 4 "Items Unique" (`DISTINCTCOUNT ( EH_Items[ItemId] )`, the table's own id) and "New Customers"
(`DISTINCTCOUNT ( Customer[CustomerKey] )`). The fixed rule no longer calls any of them.

| tuning set, fixed rule | models | measures | non_additive (right / undecidable / wrong) | semi (asked / handled) | unknown |
|---|---|---|---|---|---|
| Microsoft (Analysis-Services, fabric-samples, fabric-toolbox, COVID .pbit) | 17 | 1161 | 365 (352 / 12 / 1) | 24 (10 / 14) | 772 |
| repo fixtures | 9 | 1023 | 406 (406 / 0 / 0) | 142 (10 / 132) | 475 |

Wrong (1): `DISTINCTCOUNT ( churn[CustomerId] )`, one row per customer. Undecidable (12): distinct counts of request,
operation, tracking or item ids, right only when the id repeats in its table, which metadata does not tell.

Earlier fixes on the tuning set (before the holdout), kept: a division by a constant or by one `SELECTEDVALUE` unit
(90 calls), `//` inside a text read as a comment (3), a % format over arithmetic the reader can't follow (1), text
measures built with `&` (7), "utilization" as a ratio word, "Inventory" over COUNTROWS (a catalogue, 4), a level word
with a flow word ("Stock Movements", 4), a name that is both an average and a cumulative.

## What this means for the guard
It never says a measure IS additive, and an unknown measure gets nothing, so a wrong "unknown" costs nothing. A wrong
non_additive call costs a plan sentence ("not additive") that is not true, and would refuse a stacked chart the writer
does not write today. On new models, expect about 1 in 100 such calls (0.994 after fixing, 0.789 before: the rule is
only as good as the public models it has met, so the next fresh set should be counted the same way, frozen first).
