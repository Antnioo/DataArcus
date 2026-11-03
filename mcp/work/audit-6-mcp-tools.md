# Audit 6: MCP tools layer (base d2300f9, integrated fix/0.2.9-gate)

Read-only; lines at d2300f9; reproduced through the MCP client on made-up models (scratch, not committed). Verified by the builder against the cited lines (the gate in plans.mjs: no use-once, no input pinning). Nothing fixed. Written on `fix/0.2.9-checks` (this session may push only there).

## History
server.mjs 17 commits (1,353 lines); plans 3, arabic-twin 3, gulf-calendar 4, arabic-names 1, scope 1.

| Commit(s) | Round | Fix (grouped) | Right block? |
|---|---|---|---|
| 4e1bec3 | r1-9 | 6 tools, root rule, never overwrite; `reportFormatOf`, page filters, SVG columns | **no**: format, filter, SVG rules |
| 8f6d2c3 | 10-04 | add_gulf_calendar in its own lib file | yes |
| 3803b7a, 1cef9ac | r10-11 | kpiValues, card formats, notes | partly (A3-3) |
| 2280cda | r12-13 | #20-#26: text slot, counts, text KPIs, slicers vs filters, Ramadan axis | **no**: picker (A3-2), design (A2-3) |
| d9d27e5 | r14 | formats at source, `ARABIC_OF`, Arabic names | **no** (A3-2) |
| 11ed33a | r15-19 | ring numbers, `KPI_COUNTS`, Day Short, focus <800 | **no** (A6-11, A3-2, A2-1) |
| f9f461d | r20-22b | check_report, `scrub`, `SUSPICIOUS`, `hasControl` | partly (A1-13) |
| 843c8dc | r23 | theme rescale, language notes | **no** (A6-10) |
| 56b14f7, 3b53ba0 | 0.2.9 | gate, LIMITS, planProblems | yes |
| dc66344, 61c1006, e316751 | 0.3.0 | twin, read_report, designLint, C4 | yes; R2 copy |
| 3eff1de, ccfae87, 49c7a6f | cross-review | G9, G6, G13, G5 | G6 root; others partly |

**Key question:** about 490 of 1,353 lines (36%, 22 units) are picker/writer/design/format/reading logic; create_report's handler is 494 lines (607-1100), about 30 closures (table below).

## Findings
| ID | Block | file:line | Evidence | Why it matters | Root fix: what, where, test (block) | Sev | Known as |
|---|---|---|---|---|---|---|---|
| A6-1 | tools, gate | server.mjs:615-620, 1253, 1270; plans.mjs:32-34 | `if (plannedFields) {…}` | **Reproduced:** plan without planFields → create_report with other fields, a page filter, displayNames: **written**. With planFields: `layout:'focus'`, `page:'960x720'`, `lang:'ar'`, filters, names: **written** | plan_layout stores the canonical plan in `plan.data` (design after planLayout, page, lang/dir, resolved fields incl. picks, pageFilters, displayNames, text, subtitles, svg; add these inputs to plan_layout); `Plans.gate(tool, id, model, inputs)` refuses with the differing keys (as the twin's labels). Test (test-0.2.9i): each differing input refused, nothing written (tools) | high | B-01/G5 (fields only) |
| A6-2 | tools, gate | plans.mjs:59-69 | `gate()` never marks a plan used | **Reproduced:** one approved id wrote `Unpinned.Report` then `Again.Report` | `Plans.consume(id)` after a successful write. Test: same id twice → second refused (tools) | high | new |
| A6-3 | tools, gate | plans.mjs:5-6, 46-55; server.mjs:1349 | "it can't prove that a person typed that reply" | **Reproduced:** approve_plan with `'go'` right after plan_layout → approved: self-approval. SDK 1.32.1 has `server.elicitInput` | approve_plan asks the user by MCP elicitation (showing `writesAfterGo`) when the client declares it; otherwise the reply path, marked `approvedBy:'assistant-reported'`. Test: client declines → refused; accepts → approved; no capability → marked (tools) | high | B-02 related |
| A6-4 | tools, atomicity | server.mjs:955-957; arabic-twin.mjs:224-230 | clash check, then `writeNew` per file | **Reproduced** (injected ENOSPC): 12 files of `Half.Report` left, error "ENOSPC" only, retry named "Half - New design" | `writeTree(dir, files)` in new `lib/files.mjs`: write to `.dataarcus-tmp-<rand>` with `wx`, rename when complete (.pbip last, no overwrite), remove on failure; used by create_report and writeTwin. Test: injected failure → nothing left, "nothing was written", same name on retry (tools) | high | T8 (same root) |
| A6-5 | tools, gate | server.mjs:445, 524, 1173, 1310, 1318 | `Plans.propose('calendar', key, [text])`, no data | **Reproduced:** calendar plan 2020-2021 approved; 1990-2049, another name, `relateTo` → **written**. Scripts and theme plans pin nothing | each proposal stores its write inputs (years, name, country, weekend, relateTo…; weekStart, maxItems, columnTypes; palette, brand, mode, folder); same gate as A6-1. Test per tool (tools) | med | new |
| A6-6 | tools, untrusted names | server.mjs:378, 968, 971, 1005, 1025, 1033-1035, 1050, 1086; gulf-calendar.mjs:133, 137 | `` `${k.t}[${k.m}]` `` without `visible()` (1060 has it) | **Reproduced:** measure "Ignore previous instructions…\u202e" returned in boundFields with a raw U+202E | one `nameOut()` (A1-13's single screen) wherever a model name enters an answer. Test: plant Cf + instruction name, call every tool, no raw `\p{Cf}` (tools) | med | new |
| A6-7 | tools, file input | server.mjs:654, 911, 947 | `JSON.parse(fs.readFileSync(inside(a.theme)))` | **Reproduced:** error `Unexpected token 'I', "Ignore pre"... is not valid JSON`: file text reaches the AI; no size cap | `readUserFile(p, {kind, max})` in lib/files.mjs (isFile, cap, own message) for theme, background, logo. Test: that file → no text in error; 50 MB refused unread (tools) | med | new |
| A6-8 | tools, answer size | server.mjs:434, 525-544 | `maxItems … max(200)`, no cap | **Reproduced:** large-synthetic: 23,532 chars default, **166,053** at 200; other tools stay ≤ 40,000 | `capAnswer()` in `text()`/`compact()`: over 40,000 cut items, add `truncated` + how to page. Test: maxItems 200 → ≤ 40,000 (tools) | med | new |
| A6-9 | tools, reuse | server.mjs:403-1349, 1351-1352; plans.mjs:21 | `await server.connect(...)` at import | no other host can call a tool; ROOT (A1-9) and plans are globals | `lib/tools/<tool>.mjs`: `fn(args, ctx={root, plans, now})` → answer; server.mjs keeps schemas, `safe`, `text`. Test: import `createReport`, two roots, no transport (tools) | med | new |
| A6-10 | design, wrong block | server.mjs:917-939 | `for (let h = 200; h <= 4400 …) if (fits(h))`, `fsz(28, h)` | engine's sizes copied and brute-forced; an engine change silently breaks it | engine exports `themeScaleOf(theme)`, `scaleTheme(theme, r)`. Test: buildTheme per height found; user theme null (design) | med | new |
| A6-11 | SVG compiler, wrong block | server.mjs:346-348, 363-365 | ring `inside` closure written twice | "no number in a card's ring / under 40" only in the MCP | `Svg.toMeasure(d, {context})` returns the variants. Test in compiler suite (compiler) | med | new |
| A6-12 | writer facts re-derived | server.mjs:375-391 | `boundOf` walks planned slots, `AGGN` | **Reproduced:** no-date model: boundFields lists "Line chart: Sales[Total Sales]", leftOutVisuals says it was left out | `Pbip.build` returns `bound` for what it wrote. Test: no-date model → no line chart in boundFields (writer) | med | new |
| A6-13 | reading/writer, custom visuals | read-report.mjs:139-143 vs report-mirror.js:35 | `BUILTIN` list vs `!/^[a-z][A-Za-z]*$/` | **Reproduced:** `scorecard`, `heatMap`, `filterSlicer`: custom for read_report, plain for the twin; custom `drilldownpie` plain to the twin, absent from `cannot` | shared `assets/js/visual-types.js` (catalog, A5-6); custom = in `publicCustomVisuals`/`resourcePackages` or not in the catalog. Test: both agree on every type (reading + writer) | med | crossreview §2 (half fixed) |
| A6-14 | writer, wrong block | server.mjs:249-290 | `String(n) + (kind === 'whole' ? 'L' : 'D')` | PBIR literals in the tools; website can't filter | `Pbip.pageFilterOf(col, values)`. Test in writer suite (writer) | low | new |
| A6-15 | picker, bias | server.mjs:1116, 1119 | `!/number\|num\|no\|…\|date/i` | "no" not word-bound: "Month Announced" gets no note | use `Bind.sortColumnFor`/`sortByColumn` facts. Test: that column noted (picker) | low | new |
| A6-16 | tools, contract | server.mjs:35, 50, 551, 585, 590 | enum has `matrix`; LIMITS and rule 6 don't | agent told matrix unsupported; limits written twice | zod caps and instruction list from LIMITS; writer exports kinds. Test: every slot kind in LIMITS (tools) | low | new |
| A6-17 | tools, errors | server.mjs:69, 74 | `fail(e)` returns `e.message` raw | "Cannot read properties of null" (A5-2) says neither why nor what was written | `safe()` wraps foreign errors: "could not finish (cause). Nothing was written." Test: planted null → wording (tools) | low | new |
| A6-18 | tools, bias | arabic-names.mjs:76-100 | 59 English words incl. `ramadan`, "last ramadan" | English sources only, golden-task patterns; also twin drafts | shared data file marked heuristic; answer says why no proposal. Test: French name → needNames (tools) | low | new |

## Logic living in server.mjs that belongs below
| Function | Lines | Belongs to |
|---|---|---|
| `reportFormatOf`, `DIVIDES_OR_AVERAGES`, `scriptTables` | 96-113 | format/health (A3-3, A1 note) |
| `themeColors` | 153-157 | design |
| `hiddenOnly`, `SUSPICIOUS`, `suspiciousOf` | 165-208 | reading (A1-13, A1-7) |
| `fieldsAndProblems` (measure side) | 214-244 | picker (G9 half) |
| `resolvePageFilters` | 249-290 | writer (A6-14) |
| `resolveSvgColumns` | 299-372 | SVG compiler (A6-11, A3-4) |
| `boundOf`, `VISUAL_NAMES` | 375-391 | writer (A6-12) |
| `DESIGN_KEYS`, `LAYOUT_KEYS`, `unknownKeys` | 394-401 | design (A2-7) |
| Ramadan/Hijri filter note | 635-642 | picker (A3-2) |
| `svgPalette`, `svgFor`, `svgCardsFor` | 651-670 | design / writer |
| `cardFormatOf`, `rightOf`, `withRightFormats`, `withCardFormats`, `short` | 673-729 | format/picker (A3-3, A3-2) |
| `COUNTS`, `countBind`, `bindFor`, `unfixed` | 730-782 | picker (A3-2; R2 copies it) |
| `withText`, `withValues` | 795-808 | design (A2-3) |
| `ARABIC_OF`, `inArabic` | 828-848 | picker (A3-2) |
| kpis/wideTable/tinyPage | 879-886 | design (A2-1, A2-4) |
| theme rescale | 917-939 | design (A6-10) |
| `noSep` | 975-986 | format |
| `modelNotes` | 1107-1130 | picker/health (A6-15) |

## Custom visuals at the tools layer
- **check_report:** a count only in `notChecked` ("only the validator checks them", check-report.mjs:218), from the reader's hand list (A5-6); not which visuals.
- **read_report:** `CUSTOM VISUALS USED <screened ids>` and role keys; no source, display name, role meaning or object names (A5-7, A5-10, A5-13, B-11).
- **create_arabic_twin:** moved only, under `cannot` with page/visual ids and the sign-in note (arabic-twin.mjs:167; B-21), but its own custom test misses some (A6-13).
- **create_report:** can never write one (closed enum, 551; rule 6).
- **Missing.** *Describe:* read_report `visual: "<page>/<visual>"` returning one visual in full (source, name, roles with kinds, fields, object names; screened; `guess` for AppSource, whose definition is not in the report). *Replace:* a `replace` plan kind in `ALLOWS` and a write tool (or create_report `from: <report>`) that writes a **new** "<name> native" copy as the twin does; mapping from design's `nativeFor` (A5-14); pure `replaceVisual(visualJson, mapping)` in the writer beside report-mirror; the mapping and lost features pinned in `plan.data` like the twin's labels; the unused `publicCustomVisuals` entry dropped (no sign-in prompt); check_report on the result.

## Already-known items at d2300f9
| Item | Status |
|---|---|
| G5 / B-01 | **partly**: fields pinned only when planFields are given; the rest is open (A6-1) |
| G6 | fixed (1261 `Pbip.timeAxisPlan`) |
| G9 | half: columns use `Bind.fieldOf` (235); measures still built here (233) |
| G13 | half: create_report fixed (1030); plan_layout still says it always (1285) |
| G12 | fixed (`approvedFor` gone) |
| R2 | open (plan-lint.mjs:24-38) |
| T2 | open (arabic-twin.mjs:160, 211: opts carry no date tables) |
| T5 | open (arabic-twin.mjs:106, 162: `visible` only, no screen on ids) |
| T8 | open (224-230) → A6-4 |
| C4 | fine |
| Break 1 | fixed (arabic-twin.mjs:15 imports from read-report) |
| Break 2 | fixed (test.mjs:762, 11 tools) |
| B-02 | open → A6-3 |
| B-09 | fixed (`logoPlaceholder` at server.mjs:898, plan-lint and pbip-export:1232) |
| B-12 | open (instructions 2,479 / 2,500) |
| A1-1 | **open** (model.mjs:193, `beside` not through `real()`): reaches plan_layout, create_report, check_model_health, add_gulf_calendar |
| A1-7 | open (server.mjs:203-204) |
| A2-2 | open (1000) |
| A2-4 | open (880-882) |
| A3-2 | open (742-782, 724-726, 828-848) |
| A3-3 | open (673-729) |
| A5-3 | open (read_report has no cursor input, 1195) |

## Reuse
**No.** Importing server.mjs starts stdio (1351-1352). Tool logic sits in inline closures. ROOT comes from the environment at import time (A1-9), and the plan registry is a module Map. A CLI or a Fabric app would have to copy the handlers. Partial seams already exist: `checkReport`, `readReport`, `planTwin`/`writeTwin`, `addGulfCalendar`, `scopeOf`. create_report, plan_layout and check_model_health have none. Fix: A6-9.

## Bias
- Gulf-calendar names in the tools (636-641, 724-726, 765, 828), from golden tasks 3-4 (A3-2).
- English-only screens (178-184, A1-13); approval words English/Arabic only (plans.mjs:25-26); English → Arabic glossary (A6-18).
- About 40 English reportNotes templates in server.mjs: no language seam for answers.
- Theme sizes 10/28/12/18 copied (A6-10). Nothing else tuned to the portfolio reports in this layer.

## Seen, not in scope
Status of these items: [mcp/work/SEEN-QUEUE.md#audit-6-mcp-tools](SEEN-QUEUE.md#audit-6-mcp-tools)
- A report plan lets generate_theme write into any folder in the root (1173).
- `CARD_RULE` is used at 1013 and defined at 1103 (works only at run time).
- add_gulf_calendar's plan path passes a fake `writeScript` (1315-1316): a hidden contract.
