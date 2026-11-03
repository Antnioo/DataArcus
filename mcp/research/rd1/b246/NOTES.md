# B-246: a versioned Power BI compatibility gate (rd1 research, 3 Nov 2026)

Idea (architecture review, 25 Oct): the tested Desktop version and the schema commit pinned in one place; Desktop-saved
golden PBIR/TMDL fixtures rerun each monthly Desktop release; an untested Desktop version warned about, not assumed.
Prototype: `node mcp/research/rd1/b246/prototype.mjs` (read-only scan, then a made-up report in `os.tmpdir()`).

## (a) What the code does today
**Pins that already follow D-1016-01 (one place):** the validator and catalog in `mcp/package.json` (0.5.0, 0.1.3);
`VALIDATOR_VERSION` reads the installed validator (`mcp/lib/check-report.mjs:38`); `test-0.3.2-deps.mjs` reads the
pins; `scripts/microsoft-watch.mjs:81` reads them; the bundle in `mcp/schemas` is read from the folder.

**Pins written twice or more (the gaps):**
| Fact | Where (file:line) | Places |
|---|---|---|
| Schema bundle commit | `mcp/schemas/SOURCE.md:4` (full hash), `mcp/lib/check-report.mjs:36` (`SCHEMA_COMMIT = 'af7b264'`), `mcp/test-0.3.0-powerbi-2026-10.mjs:34` (`SU09 = 'af7b264'`) | 3 |
| Catalog version | `mcp/package.json`, `assets/js/visual-types.js:13` (`CATALOG = '... 0.1.3'`), `mcp/test-0.3.0-powerbi-2026-10.mjs:34` (`PIN = '0.1.3'`) | 3 |
| The tested Desktop, as a live claim in answers | `mcp/lib/check-report.mjs:166,173,177,242,255` (2.159), `:201,275` (2.158), `mcp/lib/sample-project.mjs:161-162` ("2.159 or later") | 8 strings, 2 files |
| Writer's schema versions | `assets/js/pbip-query.js:11-23` (`SCHEMA`, 12), plus literal URLs: `assets/js/pbip-export.js:403,435,437`, `assets/js/report-mirror.js:567`, `mcp/lib/twin-copy.mjs:26,29,30`, `twin-pages.mjs:397`, `redesign.mjs:384`, `shadow-model.mjs:351,353`, `twin-write.mjs:63`, `native-copy.mjs:128` | 1 map + 13 lines |
| Newest major each family may have | `mcp/lib/redesign.mjs:92` (`SCHEMAS = { report: 3, visualContainer: 2, ... }`) | 1 |
| compatibilityLevel written | `assets/js/pbip-export.js:326` (1567), `mcp/lib/model-script.mjs:26` (`COMPAT_UDF = 1702`) | 2 |
| reportVersionAtImport | `assets/js/pbip-export.js:352`, `mcp/lib/redesign.mjs:218` ('5.61') | 2 |

**Measured (prototype, lines, mcp/ without node_modules, mcp/schemas, this folder):**
| Fact | code | tests | docs | data | lines | files |
|---|---|---|---|---|---|---|
| a Desktop build named (2.13x-2.16x) | 54 | 78 | 213 | 3 | 348 | 136 |
| schema bundle commit | 1 | 2 | 8 | 0 | 11 | 7 |
| validator 0.5.0 | 0 | 0 | 10 | 4 | 14 | 9 |
| catalog 0.1.3 | 2 | 10 | 40 | 4 | 56 | 24 |
| a $schema URL with a version | 14 | 53 | 0 | 94 | 161 | 117 |
| schema family + version in text | 30 | 116 | 42 | 82 | 270 | 134 |
| SCHEMAS major map | 1 | 0 | 0 | 0 | 1 | 1 |
| compatibilityLevel number | 15 | 131 | 0 | 9 | 155 | 93 |
| reportVersionAtImport literal | 4 | 3 | 0 | 3 | 10 | 10 |

assets/js + scripts/ add 154 code lines naming a Desktop build, 4 schema URLs, 6 catalog mentions. Almost all Desktop
numbers are dated evidence ("measured in Desktop 2.158, 4 Oct"), which the owner's rule keeps as history; the live
claims are the 8 strings above. Fixtures: `mcp/fixtures/twin-project`, `health-project`, `test-models/service-orders`
are all written by DataArcus (visualContainer 2.1.0, report 2.1.0); **no Desktop-saved fixture is in the repo**,
although `SOURCE.md` notes Desktop 2.158 saves visualContainer 2.13.0.

**Reading a report's version today:** PBIR files carry no Desktop build number. The code reads `$schema` URLs:
- `check-report.mjs:108-131` validates each file against the bundled schema it names; a version not bundled goes to
  `notChecked` ("newer than the copy of af7b264"). No warning names Desktop.
- `redesign.mjs:92-110` refuses a newer major (`SCHEMAS`), a file with no `$schema`, a `version.json` not 1.x/2.x,
  a `definition.pbir` below 4.0. Minor versions above what Desktop was tested with pass silently.
- `model-script.mjs:26-28` reads `compatibilityLevel` (`compatOf`) for UDFs (1702).
- The weekly watch (`scripts/microsoft-watch.mjs`, `mcp/research/MICROSOFT-WATCH.md`) flags new schemas, packages and
  Feature Summaries, but not a new Desktop build, and nothing records which Desktop build DataArcus was last proven on.

## (b) What Microsoft documents
- PBIR: every file declares a `$schema`; "The schema URL also defines the version of the document, which is expected to
  change as the report definition evolves"; schemas at github.com/microsoft/json-schemas `fabric/item/report/definition`.
  `version.json` "determines the required files to be loaded"; `definition.pbir` 1.0 = PBIR-Legacy, 4.0+ = PBIR.
  https://learn.microsoft.com/power-bi/developer/projects/projects-report#pbir-format
- On open, Desktop validates changed PBIR files; invalid schema or missing required properties are blocking errors.
  https://learn.microsoft.com/power-bi/developer/embedded/projects-enhanced-report-format
- `definition.pbism` 1.0 = TMSL only, 4.0+ = TMSL or TMDL (the Fabric example shows 5.0).
  https://learn.microsoft.com/power-bi/developer/projects/projects-dataset#semantic-model-files ,
  https://learn.microsoft.com/rest/api/fabric/articles/item-management/definitions/semantic-model-definition
- TMDL view prompts for a compatibility level upgrade when a property needs one (example 1550 to 1601).
  https://learn.microsoft.com/power-bi/transform-model/desktop-tmdl-view#compatibility-level-upgrade-prompt
- Cadence: "Power BI Desktop is updated and released on a monthly basis ... Only the most recent version ... is
  supported"; "Previous versions can't open files created or saved in newer releases". Numbers: May 2026 2.154.1260,
  June 2.155.756.0, July 2.156.951.0 (one minor per month; the repo measured 2.157 in Aug, 2.158 in Sep, 2.159 in Oct).
  https://learn.microsoft.com/power-bi/fundamentals/desktop-latest-update-archive ,
  https://learn.microsoft.com/power-bi/fundamentals/whats-new (October 2026)
- Packages (`mcp/node_modules/@microsoft/*`): `powerbi-report-authoring-cli` 0.5.0 (0.x "public preview ... Pin to exact
  versions", its CHANGELOG); it names one schema URL in its dist (`page/2.0.0`) and fetches the rest by the file's
  `$schema`. `powerbi-core-visual-schema` 0.1.3 (`data/*.json`, `schemaVersion` "1.0"). `powerbi-desktop-bridge-cli`
  1.0.0 (a dependency of the validator): its README's `status`/`manifest` and a grep of its dist show no Desktop
  build field, so the running Desktop's build is read by hand (Help > About) on the laptop.

## (c) Ways to build it
| | What it changes | Risk | Size |
|---|---|---|---|
| A | One `mcp/compat.json`: `desktop.tested` (e.g. "2.159"), `testedOn`, `schemaCommit`, `saves` (newest version per family seen in a Desktop-saved fixture), `formatVersions`, `fixtures`. `SCHEMA_COMMIT`, the live Desktop strings and the test's `SU09`/`PIN` read it (validator stays in package.json). check_report and the redesign add one note when a file names a version above `saves`. | Low: read-only, one new note; answers grow by one line | S |
| B | A, plus `mcp/fixtures/desktop-golden/` (7 made-up reports saved by Desktop) and `scripts/desktop-pass.mjs`, which the laptop runs after each Desktop update: diff, validator, twin per fixture; on pass it prints the compat.json change to make | Low in CI (it reads only); the laptop step is by hand | M |
| C | CI only: a test that compat.json agrees with `mcp/schemas`, `package.json` and the writer's `SCHEMA`; the watch adds "a new Desktop month since `testedOn`" | Lowest, but proves nothing about Desktop | S |

## (d) Prototype numbers
See the table in (a). The gate on made-up reports (compat made up, `desktop.tested` 2.159, `saves.visualContainer`
2.13.0): visualContainer 2.13.0: `tested`; 2.14.0: `untested` (words below); Desktop 2.159.1084.0: `tested`;
2.160.512.0: `untested`. Temp folder removed: true. `npx eslint mcp/research/rd1/b246`: clean.

## (e) Recommendation
**B, built in two steps:** A now (S, one job, all in CI), the golden fixtures and the pass script next (M, needs the
laptop once to save the 7 fixtures). A without fixtures has nothing true to put in `saves`, so A's first `saves` is
filled from one Desktop save of the existing twin fixture. The warning goes in `notChecked` (check_report) and in the
plan's notes (redesign), never as an error. Exact words:
- Report side: "This report uses a file format newer than the Power BI Desktop DataArcus has tested (visualContainer
  2.14.0; tested: Desktop 2.159). DataArcus can still read it, but some parts may not be checked. Open the result in
  Power BI Desktop before you rely on it."
- Laptop side: "Power BI Desktop 2.160.512.0 is newer than the version DataArcus has tested (2.159). Run the monthly
  Desktop pass before you rely on it."

## (f) The laptop's monthly Desktop pass (per fixture)
0. Record the build (Help > About) and the date; the pass names them.
1. **Open** the fixture's .pbip in the new Desktop: no error banner, every page draws (the bridge's `screenshot-all`).
2. **Save** (Ctrl+S) into a copy; `desktop-pass.mjs` diffs the copy with the committed golden, JSON-normalized:
   each `$schema` version that moved, files added or removed, properties added or removed (ids and order ignored).
3. **Validator**: `check_report` on the saved copy: 0 schema errors, validator errors only the known ones.
4. **The twin**: `create_arabic_twin` on the saved copy (made-up names), then open the twin in Desktop: no banner,
   check_report clean.
5. TMDL fixtures: the saved `compatibilityLevel` and `definition.pbism` version unchanged, or recorded.
6. All pass: set `desktop.tested`, `testedOn`, and any moved `saves` versions in compat.json; commit the new golden
   copies. Any fail: stop, report the diff (a failure could change what Desktop shows).
Fixtures: visual groups, mobile positions, formatting selectors, bookmarks, sync groups, field parameters, calculated
tables (one made-up report each, or one report holding all seven).

## (g) Brief for the builder (step A)
**Do:** add `mcp/compat.json` (desktop.tested, testedOn, schemaCommit, saves, formatVersions, fixtures); read it in
`check-report.mjs` (`SCHEMA_COMMIT`, the live Desktop strings at 166/173/177/242/255/201/275 when they claim the
current build, not dated evidence), `sample-project.mjs:161-162`, `redesign.mjs` (`SCHEMAS` derived from `saves`);
point `SOURCE.md` and `test-0.3.0-powerbi-2026-10.mjs:34` at it; add the report-side note in the words of (e).
**Test (red first):** a suite in `tests.json`: compat.json's `schemaCommit` matches SOURCE.md's hash; every `saves`
version is bundled in `mcp/schemas`; no code line outside compat.json names the commit; a made-up report with
visualContainer one minor above `saves` gets the note, one at `saves` does not; the redesign still refuses a newer major.
**Not in this job:** the golden fixtures and `desktop-pass.mjs` (step B, laptop); the writer's own schema versions
(they change only if Desktop needs it); dated history numbers; the bridge; `visual-types.js` CATALOG (browser engine).

## Owner's decision
1. Does the untested note appear in check_report/redesign answers (users see it), or only in the laptop pass?
2. The warning's words. 3. Go for A now, B after the next laptop run?

## Seen, not in scope
- `assets/js/visual-types.js:13` and `mcp/test-0.3.0-powerbi-2026-10.mjs:34` write the catalog version (0.1.3) and the
  bundle commit beside `mcp/package.json` / `SOURCE.md` (D-1016-01).
- check-report.mjs names two Desktop builds as current in one answer (2.159 for opened shapes, 2.158 for known notes).
