# The number check: the same values before and after a change (plan)

**Plan only** (the reviewer's request on the owner's go, "go 4", 2026-10-04). No engine code, tests or Desktop runs
were made for it. Written on `plan/check-report-number-check` from main `2268d6f`. Sources were read on 2026-10-04.

**Why precision matters here.** Our public Position says: "A number check that proves every visual's values before
and after a change is planned, not built" (`mcp/ROADMAP.md`). This plan is what that sentence promises. Every claim
in it is sourced or marked **unverified** or **needs Desktop**. Until it is built and measured, the public wording
stays "planned".

## What it is
A tool, `check_numbers`, that compares two reports on the same model, the report **before** a change and the copy
**after** it (a new theme, a new layout, an `edit_report` copy, a translation). It proves, visual by visual, that
each one shows the same numbers.

It works in two layers:
- **Layer 1, "same question"** (files only, no Desktop, no data). Each visual asks the model the same question
  before and after: the same fields, aggregations, filters, sort, top N and visual calculations. It also shows the
  answer in the same way: the same display units, decimals and format.
- **Layer 2, "same answer"** (Power BI Desktop open, on this machine). Each visual's DAX query is run before and
  after, and the results are compared.

**The values stay on the machine.** The answer is a summary ("12 visuals: 12 identical"). Values come back only when
the user asks for them in words (section 4).

What it proves, said exactly: *these visuals ran the same queries (layer 1), and the queries returned the same
results in Power BI Desktop on <date> with the model as it was then (layer 2).* What it does **not** prove: that the
numbers are right in the business sense, that the model is right, or that the report looks right (that is
`check_report`).

## 1. Inputs and answer
| Input | Values | Default | Notes |
|---|---|---|---|
| `before`, `after` | two reports (`.pbip`, `.Report` folder) | required | inside the working folder; both must point to the same model (`definition.pbir`), or it refuses |
| `layer` | `1`, `2`, `both` | `1` | layer 2 needs Desktop open with the model (section 3) |
| `queries` | `performanceAnalyzer`, `generated` | `performanceAnalyzer` | where layer 2's DAX comes from (section 3) |
| `paFiles` | `{ before: [files], after: [files] }` | none | the Performance Analyzer exports the user saved (one per page) |
| `showValues` | false / true | false | true only when the user asked in words to see values (section 4) |

**The answer:**
```
{ layer1: { visuals, sameQuestion, differ: [ { page, visual, type, what: 'measure changed'|'filter added'|'display units 0 -> K'|... } ],
            noQuery: [ { visual, type } ], notMatched: [ ... ] },
  layer2: { ran, at, desktopVersion, visuals, identical, differ: [ { page, visual, type, rowsBefore, rowsAfter, cellsDiffer } ],
            couldNotRun: [ { visual, why } ], valuesFile: null | path },
  cantCheck: [ { visual|scope, why } ], wording }
```
- `differ` gives counts only, never values ("3 of 24 rows differ in 1 column").
- `wording` is the sentence the AI should use with the user, built from what actually ran. Example: "Layer 1: 12 of
  12 visuals ask the same question. Layer 2 was not run."

**Matching visuals.** Visuals are matched by their `name`, which survives a copy made by our tools. When names don't
match (a report rebuilt from scratch), a visual is matched only by the same page, the same type and the same fields.
Anything else goes in `notMatched`, never in "identical".

## 2. Layer 1: same question, from the files
- **What is compared, per visual:**
  - the query in `visual.json`: projections per role, aggregations, `sortDefinition`, top N;
  - the visual-level filters and the page and report filters that apply to it;
  - visual calculations (`NativeVisualCalculation` in the semantic query, semanticQuery 1.4.0 schema, per
    `research/ENGINE-POSSIBILITIES.md`);
  - report-level measures in `reportExtensions.json`, compared by expression and format;
  - **the display:** display units, decimal places and format overrides in the visual's objects. The number shown can
    change without any change to the query, for example 101,914 becoming 101.9K.
- **The filter values themselves** are compared on the machine (equal or not) and never returned (section 4).
- **No data, no Desktop:** layer 1 reads the report files only, as `check_report` does. It runs in CI.
- **Why it is first:** a theme or layout change must leave every query identical. When it does, layer 2 can only
  find a difference from the model having changed in between. Layer 1 catches most real mistakes, for example an
  edit that re-bound a card or dropped a filter, with no data at all.
- **Limits:**
  - A visual with no query (text box, image, shape, button) goes in `noQuery`.
  - A custom visual's own transforms can't be read. Its query is compared, and the visual goes in `cantCheck` for
    what it does after the query.

## 3. Layer 2: same answer, in Power BI Desktop
### Where the DAX comes from
- **A. Performance Analyzer (recommended).** Microsoft: "You can see the DAX query of each visual by selecting **Copy
  query** in performance analyzer", and "Selecting **export** creates a .json file with information from the
  performance analyzer pane" ([Learn] "Use Performance Analyzer", read 2026-10-04).
  - These are the queries Desktop itself ran, with its data reduction and totals.
  - Whether the export file holds every visual's **full DAX text and the visual's name** **needs Desktop** (NC-1).
    Microsoft documents the format in "Power BI Performance Analyzer Export File Format.docx" in
    `microsoft/powerbi-desktop-samples` (not read here).
  - Cost: the user clicks, per page and per report: Optimize > Performance Analyzer > Start recording > Refresh
    visuals > Export. That is two reports times N pages.
- **B. Generated by the tool.** Our own `SUMMARIZECOLUMNS` built from the visual's fields and filters.
  - No clicks, but it is *our* query, not Desktop's: it doesn't reproduce data reduction, top N windows, totals or
    visual calculations exactly.
  - Allowed only labelled as such: "our query for the visual's fields, not the query Desktop runs".
  - Useful when layer 1 already says "same question" and the user only wants the model's current values compared.

### How it runs, locally
- Power BI Desktop runs its model in a local Analysis Services process. When Desktop launches it, "it dynamically
  assigns a random port number", and external tools "use Analysis Services client libraries to establish a
  connection to the model, retrieve metadata, and execute DAX or MDX queries" ([Learn] "External tools in Power BI
  Desktop").
- **Finding the port:** the external-tools ribbon passes `%server%` (server and port) and `%database%` ([Learn]
  "Register an external tool"). Starting from the ribbon is not how an MCP starts.
  - The alternative is to read the port of the running instance from Desktop's workspace folder. That is
    **unverified** community knowledge, so it **needs Desktop** (NC-2).
  - Microsoft's Desktop Bridge has no query method. Its methods are `bridge.manifest`, `application.state.get/v1`,
    `report.snapshot.capture/v1` and `file.reload/v1` ([Learn] "What is the Power BI Desktop Bridge?").
- **Running the query:** Node has no Analysis Services client of its own. The options:
  - **(i) Microsoft's local Power BI Authoring MCP, started by DataArcus as a child process,** with DataArcus as its
    MCP client.
    - It connects "to a model open in Power BI Desktop", runs DAX, and "DAX query execution tools have a hard limit
      of 100,000 rows" ([Learn] "Power BI Authoring MCP server").
    - Package `@microsoft/powerbi-modeling-mcp` 1.0.0, MIT, published 2026-09-25 (npm), with native binaries per
      platform.
    - **The results arrive in DataArcus's process, not in the AI's conversation.** That is the whole point: the AI
      app never sees them.
    - Whether it sends telemetry is **unverified**: read its README and run NC-3 with a network monitor first.
  - **(ii) A small helper on Microsoft's .NET client library (ADOMD.NET),** shipped with the package. Its licence and
    size are **unverified**, and it means more packaging work.
  - **Not an option:** asking the AI to run the queries through Microsoft's MCP itself. Every result would go to the
    AI app, which breaks section 4.
- **The compare:** each result is normalised (rows sorted by all columns; numbers kept as returned, exact
  comparison; blanks as blank). Each visual's result gets a SHA-256 hash. Equal hashes mean identical. Unequal ones
  are counted (rows, cells), in memory only.

## 4. Privacy: what runs locally, what the AI may and may not see
| Thing | Where it stays | Goes to the AI? |
|---|---|---|
| The DAX query text | the machine | **no** (it holds model expressions and filter values); only "query identical / differs" |
| Query results (data values) | the DataArcus process memory, freed after the compare | **no**, never by default |
| Hashes of results | memory | no (a hash of a small result could be guessed back; not returned) |
| Counts (visuals, rows, cells that differ) | answer | yes |
| Filter and slicer values (layer 1) | memory | no: "a filter differs", never what it holds |
| Values on request | `showValues: true` writes a CSV of the differing cells to a **new file** in the working folder and returns its path | only if the user, in words, asked to see them in the conversation; the default is the file |

**The rule:**
- The tool description and the server instructions say: pass `showValues` only when the user asked in their own
  words to see values. Even then, the default is the local file. Values in the answer itself need a second, explicit
  "show them here", and the AI must first tell the user that values in the answer go to the AI app (as
  `mcp/PRIVACY.md` section 3 says for Microsoft's tools today).
- **`mcp/PRIVACY.md` must change first.** Today it says DataArcus "never connects to Power BI Desktop or to your data
  sources, and runs no queries". This tool does both, locally. The page gets a new section before the tool ships, and
  the owner decides on it (question 1).
- **A canary test** plants made-up values ("CANARY-7319") in the results the test double returns. No answer may hold
  them unless `showValues` is set; with it, they are only in the written file.

## 5. What it can't check, and how to say so
Each item goes into `cantCheck` with its reason, and into `wording`:
- **Visuals with no query:** text boxes (a number typed into a text box is not checked), images, shapes, buttons.
- **R and Python visuals,** and what a custom visual does after its query.
- **States the report doesn't save:** hover tooltips, drill-down levels, cross-filtering by a click, drillthrough
  pages, which only show with a filter passed from another page. Layer 2 checks the default state as saved. Tooltip
  and drillthrough pages are listed, not checked.
- **Bookmarks:** only the saved default view is checked, not each bookmark's state.
- **Row-level security:** queries run as the Desktop user with no role. A report seen through a role may show other
  numbers.
- **A model that changed in between:** a refresh, a DirectQuery source that moved, or measures with `TODAY()`,
  `NOW()`, `RAND()` or `UTCNOW()`. The health engine already reads expressions locally, so measures using them are
  named (names only) and the answer says the values can differ for that reason alone. Before and after are run back
  to back, in one session.
- **Display at the pixel:** a number cut off by a small box, or a sampled line chart drawn differently. That is
  `check_report`, and screenshots.
- **The service, the phone app, embedded reports:** layer 2 runs in Desktop only.
- **Over 100,000 rows** (the authoring MCP's limit): the visual goes in `couldNotRun`.

**The honest sentence, always in this shape:** "N of M visuals were compared; K identical; the rest listed with why."
Never "the report's numbers are verified", never "all numbers are right".

## 6. Tests (failing first; expected numbers written now)
In `mcp/test.mjs`. Layer 2 runs against a **test double** of the query runner (canned results), because CI has no
Desktop.
1. **Theme swap:** the Round0 EN export and the same report with another theme (`generate_theme`, same layout and
   fields). Layer 1: **all visuals with a query "same question"**. Text boxes, the image, buttons and the page
   navigator go in `noQuery`. Nothing in `differ`.
2. **A re-bound card:** the copy with KPI card 2's measure changed: **exactly 1** in `differ`, `what: 'measure
   changed'`.
3. **Display units only:** a card's display units changed from auto to thousands: **exactly 1** in `differ`,
   `what: 'display units'`. Its query is otherwise identical.
4. **A dropped filter:** a page filter removed: every visual on that page in `differ` (`'filter removed'`), the other
   page unchanged. The filter's values are not in the answer (canary).
5. **Layer 2, identical:** the double returns the same rows for both: `identical` equals the visuals with a query.
6. **Layer 2, one cell differs:** the double changes one cell of one visual: **1** in `differ`, `cellsDiffer: 1`. No
   value in the answer; with `showValues: true`, a new CSV file holding the canary and the path in the answer.
7. **Time-dependent measure:** a fixture measure using `TODAY()` that a visual shows: it is named in `cantCheck`,
   and its expression is not in the answer.
8. **Refusals:** two reports on different models; a PBIR-Legacy report; a path outside the working folder: refused,
   nothing run.
9. **Caps:** 300 visuals that differ: `differ` holds 60, the rest counted; the answer is under 40,000 characters.

## 7. Desktop checks (one sitting, made-up models)
On the "Ramadan Test" model (`tests/5-tmdl-sample`), with the Round0 report and its theme-swapped copy:

| Check | Test | Expected (written before the run) |
|---|---|---|
| NC-1 What Performance Analyzer exports | Record, refresh visuals, export one page | The JSON holds each visual's full DAX text and a name or id we can match to `visual.json`. If not, record what it holds; option B becomes the default |
| NC-2 Finding Desktop's port | Read the running instance's port as planned; connect | Connects to the open model only. With two Desktop windows open: both found, and the right one chosen by the file path from `application.state.get/v1` |
| NC-3 Microsoft's MCP as our child process | DataArcus starts it, connects to Desktop, runs a KPI card's query | The result reaches our process; the conversation holds no values; a network monitor shows no outbound connection during the run (if it does: stop and report) |
| NC-4 The real loop | Layer 2 on Round0 vs its theme-swapped copy | Every visual with a query identical; the KPI values equal the model's known answers (101914, 74675, 0.3378, DESKTOP-TESTS.md 2026-10-03) |
| NC-5 A real difference | The copy with card 2 re-bound to another measure | Exactly that card differs, in layer 1 and layer 2 |

Recorded in `scripts/tests/DESKTOP-TESTS.md`.

## 8. Effort
| Part | Builder sessions |
|---|---|
| Layer 1: query and display comparison, matching, answer, tests 1-4, 8, 9 | 1.5 |
| Layer 2: the runner (option i or ii), Performance Analyzer reading, compare, hashes, tests 5-7 | 2.5 |
| `PRIVACY.md` section, tool texts, the `showValues` file | 0.5 |
| Desktop NC-1 to NC-5 | 1 (the owner's laptop; NC-1 and NC-2 decide the design, so they come first) |
| **Total** | **about 5.5.** Layer 1 alone is about 2 and could ship first |

## 9. Questions for the owner
1. **May DataArcus connect to Power BI Desktop and read values on this machine?**
   - This changes `mcp/PRIVACY.md`'s promise ("never connects to Power BI Desktop ... runs no queries") into "reads
     values locally, only in this tool, never returns them unless you ask".
   - (a) yes, in this tool only;
   - (b) no: layer 1 only.
   - *Recommended: (a), with layer 1 shipping first.*
2. **Where layer 2's DAX comes from:**
   - (a) Performance Analyzer exports: exact, but the user clicks per page;
   - (b) our generated queries: no clicks, labelled "not Desktop's";
   - (c) both.
   - *Recommended: (c), with (a) as the one that may be called "the queries Desktop runs".*
3. **The query runner:**
   - (a) Microsoft's local Authoring MCP as a child process;
   - (b) our own .NET helper;
   - *Recommended: (a) after NC-3 shows no outbound connection.* It is MIT, already used in our live loop, and keeps
     us from shipping a .NET runtime.
