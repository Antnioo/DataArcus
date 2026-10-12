# 0.2.9 release gate: the block-by-block audit of the release candidate (12 Oct 2026, builder 7)

**Verdict: no open break**, the custom-visual replacement flow included (delta of 12 Oct, below: 3 low/medium findings, each failing safe).

Base: `fix/0.2.9-gate` at **`b9f04ba`** (integration round 10a, round 10 merged). The audit is read-only and was run on
a detached checkout of that commit. Packaging was read from the engine repo's `fix/0.2.9-packaging` at `bfafa2a`, and
its build was run dry against `b9f04ba` into a scratch folder (nothing committed, nothing kept). Written on
`fix/0.2.9-checks`, since this session may push only there.

## What was run on `b9f04ba` (once each)
| Run | Result |
|---|---|
| Full `npm test` (test.mjs, reader c/d/e/f, golden, fuzz bounded) | **1442 of 1442**, c 36, d 21, e 21, f 20, golden 11 tasks match, fuzz 600 cases PASS |
| `FUZZ_LONG=1 node test-fuzz.mjs` | **PASS, 10,000 cases, 135,843 checks; KNOWN is empty** (no open fuzz finding left in any block) |
| Website suites, `check-min`, `test-site-config` | **17 of 17 PASS**, 62 `.min.js` match, site config PASS |
| CI on `b9f04ba` | Tests and Privacy scan (the private deny list, gitleaks) **success** |
| Packaging dry build (`build.mjs --commit b9f04ba --dry`) | staged from the import graph, packed (5,117,583 bytes), the .mcpb's and the plugin's smoke tests call all 11 tools through plan -> approve -> write; no warning |

## Break probes (made-up projects, through the MCP client, at `b9f04ba`)
| Probe | Result |
|---|---|
| A model folder linked from outside the working folder, asked for through its `.pbip` (audit 1's A1-1) | refused |
| Every writing tool called with no approved plan (generate_theme, check_model_health, add_gulf_calendar, create_report) | **0 files written**; create_report refused |
| approve_plan with "Wait, don't go yet", "I said no", "nein, stop" / "go" | refused, refused, refused / approved |
| The same approved plan used for a second report | refused (a plan is used once) |
| create_arabic_twin after its plan's approval | twin written; **the original report byte for byte unchanged** (SHA-256 over every file) |
| read_report with a `null` projection; check_report with a `null` visual.json | both answered (the validator ran) |

## Per block
| Block | Open break | Test gaps / changed since the last audit without a test |
|---|---|---|
| Field picker | none | every audit item since `d2300f9` (A3-3, A3-5..A3-9, T3, the calendar-name fix) has a named test |
| Report writer | none | N8, F4, D19, S5, S7 named in tests; golden task 6's move traced in `why` |
| Design engine | none | A2-x, S5/S7, D19 named in tests; recorded fixtures moved with causes |
| Checks | none | A4-1..A4-14, F-C1/F-C2/F-CP, N16 tested; fuzz KNOWN empty |
| Reader | none | A1-x, A5-x, R1-R9 named in tests; fuzz covers the shapes |
| Custom visuals | none | read_report gives each custom visual's source and formatting objects (A5-10, A5-13, tested). **Replacement is shipped** (builder 12, rounds 6 and 7b; N9 in round 9): plan_layout and create_report with `customVisualsFrom` write a NEW "<name> native" report. Audited in the delta section below: CV-1..CV-3 open, none a break |
| Twin | none | T2-T9 tested; the original is never changed (probe above) |
| MCP server / approval flow | none | the gate's pinned inputs, use-once, refusal words, nothing written before approval: tested and probed |
| Packaging inputs | none | the file list comes from the import graph (audit 8's A8-1 fixed); the manifest lists 11 tools; the smoke test asserts the files it writes |

Integration commits with no audit ID since `d2300f9` (`4f0f133`, `7d379e4`, `3ca94fa`, `c902387`) were each found by
an existing test that went red at the merge, and fixed. Every other product change names a finding that has a test.

## Delta: the custom-visual replacement flow (12 Oct, on `b9f04ba`)
The release-gate audit wrongly called this 0.3.0 work; the reviewer corrected it. Files read: `mcp/lib/native-copy.mjs`,
`mcp/lib/visual-meaning.mjs` (replacementsOf, replacementLine), `assets/js/visual-replace.js`, server.mjs's two
`customVisualsFrom` branches, and `test-0.2.9v.mjs` (C1-C12, N9, VC and the pure V/R/Z checks). The probes were made-up
projects (a copy of the twin fixture plus made-up custom visuals) run through the MCP client.

| Ask | Covered by | Result |
|---|---|---|
| The original never changes | C8; probes B, C (hostile), C-isolated, B2 (SHA over every file) | byte for byte unchanged in every case, written or refused |
| Nothing written before approval | C5; probe A (no plan), D (a "not" reply refused, then create_report refused) | 0 files |
| The approval pins the replacements | `keyOf` compares visual, native type and roles with the plan's own entries; C6 (another `customVisualsFrom`), C12 (report changed), C11 (used once), N9; probes D (another model path refused; `pages` with `customVisualsFrom` refused) | refused, nothing written. The write uses the plan's entries (format, aggregate, expand), never the caller's. The model's content is not pinned (modelKey is its folder, as for every report plan): a model change that leaves the mapping as it was still writes the approved mapping |
| What each replacement loses is said | C2, C9 (`lost` in the plan and in the answer) | yes; the network stays the custom visual and is listed under notReplaced |
| A hostile or large config | probes: 3,000 format objects with instruction text in their names (1.4 MB), `projections` with null/number/string, roles that are not arrays, a broken visual.json, a 30 MB visual.json, a link inside the report | the plan answers in 10,389 characters with no injected name (only plain-letter object names are counted); the 30 MB file is refused at the reader's 8 MB cap; the link is refused; the custom formatting is not carried. **CV-1** below |
| A report with no custom visuals | probe A | planProblems "This report has no custom visual: nothing to replace", no plan id |
| RTL and long names | probes B (Arabic + U+202E + U+200F report name, an instruction-like page name), B2 (244-letter name) | written next to the original, `.pbip` points at the copy; the answer's paths go through `safeName` (controls shown as `\u202e`), no page name or field name in any line. **CV-2, CV-3** below |

### Findings (none a break; each fails safe: nothing written, the original unchanged)
| ID | Sev | Finding | Root fix (owner: builder 12's files) |
|---|---|---|---|
| CV-1 | medium | A custom visual whose projection `queryRef` is an `Object.prototype` name (`constructor`, `toString`, `valueOf`...) gets a plan id and an approval, then create_report fails: "an internal error (\"undefined\" is not valid JSON)". `visual-replace.js` keeps `byRef = {}` and tests `r in byRef`, so it finds the inherited function and `clone()` fails. Only a hand-edited or hostile file has such a queryRef (Desktop writes `Table.Field`). | `byRef = Object.create(null)` (or a Map) in `replaceVisual`; a test in test-0.2.9v with `constructor` and `__proto__` queryRefs |
| CV-2 | low | The "already there" texts (`planNative`'s `taken`, `writeNative`'s refusal) put the raw folder name in the answer (`path.basename(loc.outDir)`), not through `safeName` as every other path in this flow: an RTL or control character, or any length, reaches the AI unscreened | `safeName(path.basename(...))` in both texts |
| CV-3 | low | A copy name over the file system's 255-byte name limit (a 244-letter report name + " native.Report") is reported as "is already there: rename or move it": `nothingAt` reads ENAMETOOLONG as taken. Safe (no plan id), wrong reason | `nothingAt` (or the plan) says the name is too long |

Not probed: Desktop rendering of the native copy. The laptop's rc.5/rc.6 proofs and C10/C10b (Microsoft's validator: no
added error, every required role present) cover it.

## Known and accepted (not breaks, the owner's decisions)
- The ops layout, analysis as page 1, and exec at 1280 with the filters on top score 6.4-6.5: they ship as "preview".
- Twin T-3 / N17 only with `mirrorPicturePages` (0.3.0).
- Answers are 23 % larger than in 0.2.8 (backlog B-52).

## Seen, not in scope
- `mcp/package.json` still says 0.1.0 at the source. The build writes the version (PRIVACY says so); rc.1's record names
  the commit it packed.
- The engine repo's main branch still has the 0.2.8 manifest (8 tools). The 0.2.9 packaging lives on
  `fix/0.2.9-packaging` until it is merged there.
