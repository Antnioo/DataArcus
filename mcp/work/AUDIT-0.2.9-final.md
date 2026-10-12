# 0.2.9 release gate: the block-by-block audit of the release candidate (12 Oct 2026, builder 7)

**Verdict: no open break.**

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
| Custom visuals | none | read_report gives each custom visual's source and formatting objects (A5-10, A5-13, tested); replacing one with a native visual is 0.3.0 work, not shipped |
| Twin | none | T2-T9 tested; the original is never changed (probe above) |
| MCP server / approval flow | none | the gate's pinned inputs, use-once, refusal words, nothing written before approval: tested and probed |
| Packaging inputs | none | the file list comes from the import graph (audit 8's A8-1 fixed); the manifest lists 11 tools; the smoke test asserts the files it writes |

Integration commits with no audit ID since `d2300f9` (`4f0f133`, `7d379e4`, `3ca94fa`, `c902387`) were each found by
an existing test that went red at the merge, and fixed. Every other product change names a finding that has a test.

## Known and accepted (not breaks, the owner's decisions)
- The ops layout, analysis as page 1, and exec at 1280 with the filters on top score 6.4-6.5: they ship as "preview".
- Twin T-3 / N17 only with `mirrorPicturePages` (0.3.0).
- Answers are 23 % larger than in 0.2.8 (backlog B-52).

## Seen, not in scope
- `mcp/package.json` still says 0.1.0 at the source. The build writes the version (PRIVACY says so); rc.1's record names
  the commit it packed.
- The engine repo's main branch still has the 0.2.8 manifest (8 tools). The 0.2.9 packaging lives on
  `fix/0.2.9-packaging` until it is merged there.
