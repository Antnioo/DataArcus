# MCP blocks-and-bias audit: the summary across all 8 blocks (11 Oct, builder 7)

This is a read-only audit; nothing was fixed. It follows the owner's rule of 11 Oct: build in blocks, fix at the root inside one block, nothing tuned to the two portfolio reports or to fixtures, each block reusable.

Bases read:
- Blocks 1-3: `origin/main` `517e702`.
- Blocks 4-8: the integrated head of `fix/0.2.9-gate` `d2300f9` (builder 5's "0.2.9 integration", 939 tests green). Block 8 also reads the private packaging folder at its HEAD, cited by path and line only.

The files are `mcp/work/audit-<n>-*.md`, one per block, with IDs A<n>-<k>. They are written on `fix/0.2.9-checks`, since this session may push only there.

The audit was run one block at a time, with one helper per block. Every break and high finding was checked against the cited lines by the builder; A1-1 and A5-2 were reproduced a second time independently.

## Counts
| Block | File | Break | High | Med | Low | Reusable as a black box |
|---|---|---|---|---|---|---|
| 1 model reading | audit-1-model-reading.md | 1 | 2 | 7 | 4 | tmdl-model.js yes; model.mjs no (env ROOT at import, two return shapes, MCP wording) |
| 2 design engine | audit-2-design-engine.md | 0 | 0 | 5 | 7 | design-engine.js partly (pure, no schema or escaping of its own); design.mjs no |
| 3 picker + writer | audit-3-picker-writer.md | 0 | 2 | 6 | 4 | partly (pure core; binding rules live in server.mjs; 12 undocumented writer options) |
| 4 validator/checks | audit-4-checks.md | 0 | 4 | 5 | 5 | partly (rules pure; no shared finding shape; check_report tied to the MCP) |
| 5 reading | audit-5-reading.md | 1 | 2 | 7 | 5 | partly (pure inventory, real in-memory seam; locate tied to ROOT) |
| 6 MCP tools | audit-6-mcp-tools.md | 0 | 4 | 9 | 5 | no (import starts the server; inline closures; module globals) |
| 7 instructions + claims | audit-7-instructions.md | 0 | 3 | 6 | 4 | partly (host-neutral text, but each rule in four places) |
| 8 packaging | audit-8-packaging.md | 3 | 2 | 2 | 5 | another version yes; another server no |
| **Total** | | **5** | **19** | **47** | **39** | 110 findings |

## The five breaks
1. **A1-1 (model reading).** A model folder linked from outside the working folder is read when asked for through its `.pbip`. `model.mjs:193` never passes the `.pbip` sibling through `real()`. This makes PRIVACY's read-containment claim false (A7-1).
2. **A5-2 (reading).** One malformed visual (`projections: [null]`) makes read_report, check_report's lint and plan_layout's lint throw for the whole report. The root fix is a try around each visual in `inventory`.
3. **A8-1 (packaging).** The build refuses the six new files (read-report, design-lint, plan-lint, plans, arabic-twin, report-mirror.js), because its hand list is checked against files it already finds itself. This is the third release hit by the same cause.
4. **A8-2 (packaging).** The manifest lists 8 of the 11 tools (B-10).
5. **A8-3 (packaging).** The smoke test calls create_report without an approved plan, so it fails against the gate.

## Root fixes ranked
The owner decided on 11 Oct that every finding is fixed in 0.2.9. The ranking is therefore an order of work inside 0.2.9: what ships broken or breaks a privacy or safety promise first, then what keeps the blocks clean.

### First: breaks, privacy and safety (0.2.9 must not ship without them)
| # | Root fix | Covers | Block | Owner (per the reviewer) |
|---|---|---|---|---|
| 1 | Every path loadModel picks (`.pbip` sibling, name search) goes through `real()`. Read through one fd (`fstat`, cap+1 bytes) and refuse links in `readCapped` | A1-1, A1-3, A7-1 | model reading | builder 6 (reading A1-x) |
| 2 | Packaging derives the expected file list from the require graph, adds the 3 tools to the manifest, and gives the smoke test plan-aware recipes that assert files really exist | A8-1, A8-2, A8-3, A8-5, B-10, B-18 | packaging | packaging step (item 14) |
| 3 | `inventory` puts each visual in a try, screens role keys, ids, types and group names at read time, and refuses links in `readJson` | A5-2, A5-1, R4, R6, A4-1 | reading | builder 6 |
| 4 | The plan gate compares one record: full canonical inputs in `plan.data`, refusal of any difference, use-once `consume()`, the 2 hours counted from the proposal, refusal of re-approval, refusal of any reply holding a no or wait word, approval through MCP elicitation when the client supports it | A6-1, A6-2, A6-3, A6-5, A7-3, B-01, G5 | MCP tools | builder 9 (gate) |
| 5 | check_report never throws on one bad file (each rule isolated, null-safe readers); its summary says "opens in Desktop" only when the validator ran offline and every file was read; it skips the validator when links were met | A4-2, A4-3, A4-4 | checks | builder 7 (audit 4 fixes) |
| 6 | One atomic write: create_report and the twin write into a new temporary name, then rename | A6-4, T8 | MCP tools | builder 9 |
| 7 | PRIVACY and README are made true: containment once #1 lands, the known gaps listed, the version, read_report's screened titles, the twin in the gate texts; answers carry no unscreened names (the boundFields format characters A6-6, A3-11) | A7-1, A7-2, A7-5..7, A6-6 | instructions | builder of block 7 |
| 8 | The display-folder screen runs over the reader's shape (the field list carries `displayFolder`) | A1-7 | model reading | builder 6 |

### Then: the blocks made clean (each a root fix inside one block)
| # | Root fix | Covers | Block |
|---|---|---|---|
| 9 | Move create_report's binding rules (bindFor, Ramadan axis, page-filter slicers, Arabic twins by structure, card formats) into the picker; server.mjs passes options only | A3-2, A3-3, G9; about 490 lines of server.mjs (A6 list) | picker (builder 5) |
| 10 | One "field meaning" module (percent, money, text, sort-by) shared by the picker and the health engine, with word boundaries; calendars recognised by marking or shape, not by name | A1-11, A3-1, A3-5, G1, G2, A4-9 | picker / reading (builder 5) |
| 11 | One pure `fitSlots` in the design engine, called by plan_layout, the writer and the background image; the small-page rule and the KPI count move into the engine | A2-3, A2-1, A2-2, A2-4 | design engine (builder 11 for A2-3, builder 10 for the rest) |
| 12 | One reading of the model: parse once (`Tmdl.fromFiles` or the bim), build fields and relationships from it, one documented return shape, `loadModel(path, {root})` with coded errors | A1-5, A1-6, A1-8, A1-9 | model reading |
| 13 | One report reader for check_report, the lint and the twin, with a strict mode for a writer; check_report builds its rules' input from `inventory` | R1, T3, A5 duplicates | reading |
| 14 | One finding shape across the checks (origin field, one severity scale, `impact` on lint findings too); the tolerated-codes list grows only from Desktop proofs, each with its date and version | A4-7, C1, C2 | checks |
| 15 | One function per tool under `lib/tools/`, called by the MCP registration and by any other host | A6-9 | MCP tools |
| 16 | Each agent rule in one source (LIMITS built into the instructions, descriptions and skill), which frees the 2,500 cap | A7-4, B-12 | instructions |
| 17 | Engine escapes its own colours and caps names; the design schema is exported from the engine | A2-7, A2-12 | design engine |
| 18 | The native visual list taken from Microsoft's core visual schema (already installed), not a hand list | A5 bias (12 of 60 missing) | reading |

### Custom visuals (the owner's ask, blocks 5-6)
- **Today:** read_report gives the type id (screened in text, raw in JSON), the fields under their internal role keys, the title and the position. check_report only counts custom visuals, the twin lists them under "cannot", and create_report never writes one.
- **For "what does this custom visual show":** reading needs one record per custom visual with its source (AppSource, organisational or private). For private visuals it also needs the package's display name, version, role display names and kinds, and formatting objects (A5-10, A5-13). AppSource visuals are not stored in the report, so for them the answer can only say so. The folder layout should be measured on one saved report before coding.
- **For replacing one with a native visual:** a pure mapping in the design block (`nativeFor`, A5-14) that matches roles by kind and count against Microsoft's catalog and lists what cannot carry over, marked as a guess when the definition is absent. Then a `replace` plan kind and a write tool that makes a "<name> native" copy, with the mapping pinned in the plan (A6 custom-visual section).

## Bias, across the blocks
- **Portfolio reports:** nothing names or fits the two portfolio reports in the code read here. The KPI and amount word lists from the Fintech report sit on the gate branch (G1/G2, owned by builder 5).
- **Fixtures and golden tasks:** small-page numbers come from golden task 5 (A2-1), the table share from one table (A2-5), the Arabic glossary and the instruction examples from the golden tasks and the Gulf calendar (A6-18, A7). Every golden or fixture move read has a recorded cause.
- **Word lists everywhere:** percent, money, calendar, KPI and time-variant lists, English and Arabic only (A1-11, A3-1, A3-5); instruction screens English-only (A1-13).
- **Unmeasured numbers:** the 800 threshold, 116, 1.5, the writer's spacing (+10, 40, +6), the lint's thresholds, the tolerated-codes list (A2-1, A2-5, A3 bias, R7, A4-10).
- **English/LTR:** two languages hard-coded as pairs (A2-9); right-to-left mirrored in one place in the engine but ad hoc in the writer (B-14, T1).

## Seen, not in scope (across the blocks)
Status of these items: [mcp/work/SEEN-QUEUE.md#audit-summary](SEEN-QUEUE.md#audit-summary)
- Each block file ends with its own list.
- The website's model readers have no size cap on model.bim (audit 1).
- Packaging's build tests rewrite committed files and restore them in `finally` (audit 8).
- Plans live in memory, so a restart forgets them (audits 6 and 8).
