# RD9 (0.3.2 R&D): one answer and plan contract

## Summary
- **Approval:** the owner, D-1103-11 (3 Nov): "push more tokens to make sure we are building the best schematic";
  the scout's brief RD9 (`mcp/research/SCOUT-0.3.2.md` on `rd/0.3.2-scout`), D-1103-12.
- **Question:** can every tool's answer and every plan be described by one schema module (an `outputSchema` per
  tool, MCP's structured output), with one cap and one cut rule instead of hand-made loops, and the plan's pinned
  inputs read from the same schema?
- **Scope:** docs only: this file and scratch scripts under `mcp/research/rd9/`. No product file changes.
- **Base:** `rd/0.3.2-answer-contract` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** none by a product suite (no product file changes). The measurement script runs the real
  server over the fixtures in `os.tmpdir()`, made-up data only.
- **Expected numbers (stated before measuring):** the SDK sends structuredContent beside the text, so an answer with
  both is about 2x its text size; 11 tools, 0 with an outputSchema today; between 5 and 8 hand-made cut loops.
- **Got:** 1.84x to 1.95x on the wire (the SDK adds no text itself: the handler sends both, as the specification
  asks); 0 of 11 tools with an outputSchema; 9 places that cut an answer by hand (a), 4 size measures, 3 aims.
  The SDK's own client throws away a whole answer that carries one undeclared field (d2). outputSchemas would add at
  least 27,101 characters to tools/list (70,679 today, +38%) on every conversation.
- **Recommendation:** way A + C: one contract module that names each tool's fields and its cut list, checked in the
  tests, and one `fitAnswer` with per-tool cut lists; no outputSchema on the wire (e).
- **State: DONE.** Builder brief (g): 3 steps, about 1.5 days, medium risk (answers change only past the aim).
- **Resume:** none; the owner decides on the brief.

## The plan
1. Read today's code (answer.mjs, tool-answer.mjs, scope.mjs, check-report.mjs's cut, plan-headroom.mjs,
   twin-plan.mjs, read-report.mjs, plans.mjs propose, report-inputs.mjs REPORT_PINNED, report-result.mjs) and list
   every cap and cut, file:line (a).
2. Read the MCP specification (2025-06-18 structured output) and the installed SDK: outputSchema validation on the
   server and the client, structuredContent, whether the text is kept (b).
3. Measure on the fixtures (`mcp/research/rd9/measure.mjs`): each tool's answer size, with and without
   structuredContent; the fields no description names; time per call (d).
4. Three ways with size and risk (c); the recommendation (e); the client checks (f); a builder brief (g).

## a) Today's code: every cap and every cut

One limit, `ANSWER_MAX = 40000` (`lib/answer.mjs:24`, TK1: no other literal). Around it, measured on `b26b60b`:

| # | Where | What it cuts, in order | Aim | Size measured as |
|---|---|---|---|---|
| 1 | `lib/answer.mjs:27` capAnswer (every JSON answer, `lib/tool-answer.mjs:37` compact) | the longest list halved (opts.last lists last), then the longest string to 400, then the largest object's keys halved, then the whole answer replaced; `truncated.cut` + `how` | 40,000 | flat JSON after out() |
| 2 | `lib/tool-answer.mjs:31` capText (text answers, errors) | the text's end, `CUT_SAID` | 40,000 | characters |
| 3 | `lib/answer.mjs:96` fitLists (helper of 4, 7, 8) | the same k for every list given, binary search, `<key>NotListed` | caller's | caller's |
| 4 | `lib/check-report.mjs:548-552` | findings x0.7 steps, then lint.findings x0.7, then suspiciousNames to 5, then notChecked to 10; `findingsNotListed`, `findingsHow`, `truncated: true` | AIM 34,000 | flat, before out() |
| 5 | `lib/arabic-lens.mjs:219` | findings x0.7; `findingsNotListed` | AIM 34,000 | flat |
| 6 | `lib/scope.mjs:66, 103, 108` largeSummary, namedTables | otherTables halved, areas' tables 8/3/0, areas to 40; tables one by one, `notShown` | 39,000 and 34,000-400 | flat; pretty |
| 7 | `tools/check_model_health.mjs:271` | every object list per finding, fix and question, one k (fitLists); `listsCut` | AIM 34,000 | **pretty** after out() |
| 8 | `lib/twin-plan.mjs:68` twinFit | texts (room 20), then terminology.sheet (to 1), then notTranslated with it, then texts to 0; `moreTexts`, `moreTerms`, `moreNotTranslated` with textsFrom / termsFrom | 34,000-2,500 | flat after out() |
| 9 | `lib/plan-variants.mjs:66` | tiers of visual lists (fitLists); `listsCut` | AIM 34,000 | caller's |
| 10 | `lib/plan-headroom.mjs:79` fitRepeats (plan_layout) | not a cut: repeats said once (flip backs, gulf candidates, notTranslated by why, positions) | 38,000 (95%) | flat after out() |
| 11 | `lib/read-report.mjs:551-633` | pages past the cap listed without visuals; a page too large alone, a cursor (`from`) | 40,000 | text or flat, per line |

So: **9 hand-made cut places** (1, 2, 4-9, 11; 3 is the shared helper, 10 is a reshape), **3 aims** (34,000, 38,000,
40,000; twin 31,500), **4 ways to measure size** (flat, flat after out(), pretty after out(), characters of text).
The "how to reach the rest" is written 9 times in 9 shapes: `truncated.how`, `findingsHow`, `listsCut.how`,
`moreTexts.how`, `moreTerms.how`, `notListed.how`, `note`, `MORE:` / `TRUNCATED:` lines, `CUT_SAID`.

Measured mismatch (`rd9/measure.mjs` answers, pretty/flat): pretty is 1.08x to 1.90x flat. check_model_health
measures pretty against 34,000 while TK1 sends flat: on the health fixture (1.24x) its lists are cut at about 27,400
characters sent, 19% under its own aim (31% under the cap), though no one decided that (TK1's note: "the tools' own list cuts still measure
as before").

**The plan's inputs.** `lib/report-inputs.mjs:151` REPORT_PINNED (14 names + REPORT_LOOK's 29) is a list kept by hand
beside `CREATE_REPORT_INPUTS` (`:30`, the zod shape). `rd9/pinned.mjs`: 56 inputs, 43 pinned by name, 13 by other
routes (design, layout, kpis, filters, header through resolvedDesign; redesignFrom, consistentText, keepPositions,
titles, restyle through redesignPin; sample through samplePin; path and planId through the plan itself). Every input
is covered today, but by 4 lists and no test says a new input must join one. `plans.mjs:44` propose stores `data`
as given (any shape); `report-result.mjs:22` reportAnswer takes 41 values by name (SP3 "Seen"): its answer has no
declared shape either.

## b) The MCP specification and the SDK (1.32.2, installed)

- **Specification** (2025-06-18, kept in 2025-11-25, the SDK's LATEST_PROTOCOL_VERSION): a tool may declare an
  `outputSchema` (JSON Schema). When it does, the server MUST return `structuredContent` that conforms, and clients
  SHOULD validate it. For backwards compatibility a tool that returns structuredContent SHOULD also return the
  serialized JSON in a text block. (Paraphrased: modelcontextprotocol.io, specification, server, tools,
  "Structured Content" and "Output Schema".) The specification does not say which of the two a client gives the model.
- **SDK, server** (`dist/esm/server/mcp.js`): `registerTool({ outputSchema })` lists it in tools/list converted from
  zod (`toJsonSchemaCompat`, pipeStrategy output, `:138-145`). After the handler, `validateToolOutput` (`:239-259`):
  no structuredContent, or one that fails zod's parse, turns the answer into an error (`isError`, "Output validation
  error"). The SDK never writes the text block itself: the handler sends both, so **the JSON goes twice**.
- **SDK, client** (`dist/esm/client/index.js:479-519`): caches a validator per tool from tools/list (ajv) and
  **throws** on a call whose structuredContent does not match, so the caller gets no answer at all.
- **zod 4's JSON Schema** for `z.object` says `additionalProperties: false` (measured, `rd9/sdk-probe.mjs`), while
  zod's own parse on the server strips extra keys silently. The two sides disagree: the server passes an answer with
  an undeclared field, the client refuses it.
- **zod `.meta()`** goes onto the wire (measured: `{"pin":"look"}` appears in the tool's inputSchema): pin classes
  kept as zod metadata would grow tools/list and say internals to every client.

## c) Three ways

| Way | What changes | Size | Risk |
|---|---|---|---|
| **A. Schemas only in tests** | `lib/answer-contract.mjs`: per tool, its top-level fields (name, one line, kind: ours / name / count / path), its cut list; a suite runs every fixture answer (and the fuzz answers) against it: an undeclared field, a field no description names, or a cut without its "how" fails. Nothing on the wire changes. | 1 module (~250 lines), 1 suite, 0 bytes on the wire | Low: answers byte for byte as today |
| **B. outputSchema on the wire** | each tool registers `outputSchema`; handlers return structuredContent + the text | 11 schemas; tools/list +27,101 characters at least (+38%, the inferred floor without descriptions, `rd9/measure.mjs` schemaFloor); each answer 1.84-1.95x on the wire | High: an undeclared field (capAnswer's `truncated`, any `<key>NotListed`) makes the SDK client throw the answer away; a missing one turns it into an error; descriptions' budget (instructions at their cap) |
| **C. One `fitAnswer` with per-tool cut lists** | the cut lists of A drive one function: lists in the order they are cut, each with a floor and its "how"; binary search per list; one note `cut: { lists: [{list, kept, of}], how: [...] }`, counted inside the cap; capAnswer stays as the last backstop | replaces 4, 5, 7, 8, 9 (about 90 lines, estimated from the line ranges); 6 and 11 stay (they design the answer, not cut it) | Medium: answers past the aim change shape (one `cut` note instead of 9); clients and the skill read "NotListed" today |

## d) The measured prototype (`mcp/research/rd9/`, fixtures copied to os.tmpdir(), made-up data)

**d1. Each tool's answer** (`measure.mjs`, `measure.out.json`; tokens a stated estimate, 3.5 characters per token):

| Call | Text | Tokens (est.) | Wire today | Wire + structured | Keys | Keys no listing word names | ms |
|---|---|---|---|---|---|---|---|
| read_model twin | 477 | 136 | 574 | 1,072 | 9 | 5 | 32 |
| suggest_fields twin | 2,184 | 624 | 2,635 | 4,840 | 36 | 19 | 30 |
| check_model_health health | 10,927 | 3,122 | 11,760 | 22,708 | 72 | 46 | 27 |
| generate_theme | 4,683 | 1,338 | 5,152 | 9,856 | 69 | 25 | 40 |
| plan_layout sample | 3,150 | 900 | 3,335 | 6,506 | 22 | 7 | 14 |
| plan_layout twin, ar | 14,702 | 4,201 | 15,995 | 30,718 | 143 | 46 | 193 |
| add_gulf_calendar twin | 3,756 | 1,073 | 3,969 | 7,746 | 36 | 18 | 21 |
| read_report twin, text | 2,746 | 785 | 2,856 | (not JSON) | - | - | 9 |
| read_report twin, json | 7,419 | 2,120 | 8,596 | 16,036 | 72 | 38 | 10 |
| check_report twin | 14,487 | 4,139 | 15,566 | 30,074 | 78 | 45 | 420 (first call: the validator loads) |
| check_report health | 7,708 | 2,202 | 8,133 | 15,862 | 69 | 45 | 14 |
| create_arabic_twin twin | 17,829 | 5,094 | 19,226 | 37,076 | 78 | 33 | 57 |

create_report and approve_plan answer only after a click (errors measured: 611 and 253 characters). "Keys no listing
word names": the answer's key names (every depth) that appear nowhere in the tool's tools/list entry, a lenient
substring test: 327 of 684 (a key counted once per answer) over the 11 JSON answers. Top-level ones, e.g. check_report `rulesRun`, `impact`,
`truncated`; create_arabic_twin `approvalPreview`, `keptForNavigation`; read_report `installedNotUsed`. None of the
fixture answers was cut (largest 17,829, 45% of the cap; HR1's B5 plan, about 37,700, is the known largest).
**Performance line:** every call under 200 ms except check_report's first (420-611 ms, Microsoft's validator loading).

**d2. The SDK with an outputSchema** (`sdk-probe.mjs`, in memory): exact answer ok; one extra top-level field
(`truncated`) or one extra nested field: **the client threw** ("must NOT have additional properties"), no answer;
a missing field: an error answer; no structuredContent: an error answer. With `z.looseObject` the extra fields pass,
but a loose schema says little more than today.

**d3. One cut rule** (`cut-prototype.mjs`, `cut-prototype.out.json`), the measured answers with the cap lowered:

| Answer | Cap | fitAnswer keeps | Today's loop keeps | ms |
|---|---|---|---|---|
| check_report twin (14,487) | 11,590 | findings 5/10, fits | findings 4/10 (x0.7 steps) | 3.9 |
| check_report twin | 8,692 | findings 1/10, fits | findings 1/10 | 1.0 |
| check_report twin | 5,795 | does not fit (8,457: the parts that are not lists) | does not fit | 1.6 |
| create_arabic_twin (17,829) | 14,263 | texts 20/25, sheet 1/6, notTranslated 4/21, fits | (twinFit, same order) | 2.0 |

The binary search keeps more than the x0.7 steps at the same cap; the per-tool order reproduces twinFit's order
(texts to their room, the sheet, notTranslated, then texts to 0) as 4 lines of data instead of 20 lines of code.
Found while prototyping: the first version went 50 characters over because its own cut note was not counted (the same
bug scope.mjs's Q1 and twin-plan.mjs's PLAN_ROOM fixed by hand): fitAnswer counts the note, once, for every tool.
check_report's fixed part (health fixture: 7,708 with 0 findings) is not a list: no cut list can bring it lower; the
backstop (capAnswer) stays.

## e) The recommendation

**A + C, not B.** One contract module, `lib/answer-contract.mjs`, the one place that says, for each tool: its
top-level fields (name, one line, kind), its cut list (order, floor, how the rest is reached), the aim (one: 34,000,
measured one way: flat after out(), as sent). The tests read it (A); `fitAnswer` reads it (C); capAnswer stays the
last backstop at 40,000. The plan's pinned inputs: a side table in the same module, `PIN` (input -> look / input /
design / redesign / sample / write), with a test that every key of `CREATE_REPORT_INPUTS` has one class; REPORT_PINNED
and REPORT_LOOK become reads of it. Not zod `.meta()` (it goes on the wire, b).

Why not B: +27,101 characters on every conversation's tools/list at least, an answer sent twice, and the SDK's client
discards a whole answer for one undeclared field: a cut answer (the one that most needs to arrive) is the most likely
to carry one. B can come later from the same module (the schema is already written) once (f) shows a client uses it.
No answer gains a field that carries a value: the contract's kinds have no "value" kind, and the suite fails a field
that is not declared. The instructions' cap is untouched (nothing goes into the server's instructions).

## f) The client checks (the laptop's batch; Desktop: none)
- Desktop: none (no file written differently; answers only).
- Claude Desktop, one answer: check_report on the twin fixture; open the tool's result view: what it shows (the text
  block); then, for the record, the same with a scratch build that adds structuredContent: does the view show the JSON
  twice, or the structured one only? (Decides whether B ever pays.)
- Claude Code: the same call; does the transcript count the structuredContent in the context (`/context` before and
  after)?

## g) The builder brief (AC1, 0.3.3 or later)
- **Approval:** the owner, after this note. **Base:** a new branch from the integration branch of the day.
- **Scope:** new `mcp/lib/answer-contract.mjs` (FIELDS, CUTS, PIN per tool); new `fitAnswer` in `lib/answer.mjs`;
  callers: `check-report.mjs:548-552`, `arabic-lens.mjs:219`, `check_model_health.mjs:271`, `twin-plan.mjs:68`,
  `plan-variants.mjs:66`; `report-inputs.mjs` REPORT_PINNED and REPORT_LOOK read PIN. Not: scope.mjs, read-report.mjs,
  plan-headroom.mjs, capAnswer, capText.
- **Steps, each its own commit and suite run:** 1) the contract and its suite, no product change: every fixture answer
  and every fuzz answer is declared; expected: today's undeclared fields listed and declared, 0 answers changed byte
  for byte (`npm test -- --keep-going` the same lines). 2) fitAnswer for check_report and the Arabic lens: answers
  under the aim byte for byte the same; past it, more findings kept (d3), one `cut` note. 3) twin, model health, plan
  variants; the size measure one (flat after out()); PIN with its test.
- **Tests first by risk:** the twin's moreTexts / textsFrom paging (the approval window shows the whole lists: test
  that it still does); bilingual-report B5h; hr1; the fuzz test's F-CP and F-TP; tk1's L1 (no new literal).
- **Size:** about 1.5 days, ~300 lines added, ~90 removed. **Risk:** medium: answers past the aim change shape;
  `NotListed` names read by the skill and the tool descriptions must keep their words (keep `<key>NotListed`, add
  the one note).

## Decisions I made
1. Measured on the twin and health fixtures only (the large-model fixtures are generated by tests at run time); HR1's
   B5 number (37,700) is quoted, not re-measured.
2. Tokens are an estimate (3.5 characters per token), as the brief allows: no tokenizer in the MCP's packages.
3. "Fields no description names" is a substring test over the whole tools/list entry (lenient: a key named in any
   description of any input counts as named).
4. The outputSchema size is a floor inferred from one answer per call (types and keys, no descriptions, no unions).

## Seen, not in scope
- check_model_health measures pretty while the answer is sent flat (a): it cuts about 19% under its own aim (d1's
  health answer, 1.24x); a one-line fix, but it changes answers: for the owner.
- check_report's answer has `truncated: false` on every uncut answer and `truncated.cut` (an object) on capAnswer's
  cut: one key, two meanings.
- capAnswer's `truncated` and the twin's `moreTexts` are both "how to get the rest" in different words.
