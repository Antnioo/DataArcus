# CS2 (0.3.1): the text set where Power BI Desktop draws it; colours kept; an older save's definition.pbir

## Summary
- **Approval:** the reviewer's brief "Go on CS2" (27 Oct), after the laptop's CS1 run in Desktop 2.159: (a) the copy is
  one text set but Desktop draws Power BI's default sizes (the added `DataArcusText.json` held only `textClasses`);
  (b) on the DataDNA report the titles' own colour looked removed; (c) the Fintech redesign was refused (its
  definition file names no `$schema`). Not "clean up" until Desktop draws what the plan says.
- **Scope:** `mcp/lib/redesign.mjs` (the theme write, the allowlist, the added theme's check, the schema check),
  `mcp/lib/text-format.mjs` (THEME_STYLE_AT; themeValue reads `"*"`), a new suite `mcp/test-0.3.1-cs2.mjs` (one line in
  `tests.json`), cs1's T4 and T6 (they asserted the textClasses write this job replaces), one mutant (CS-style), the
  lab's run sheet, TOOLS.md, CHANGELOG. Not R4A, GL2, TT1 or BD2's files; `approval-window.mjs` not touched.
- **Base:** `fix/0.3.1-cs2` from `origin/integration/0.3.1` (e2236be). Push only this branch; the reviewer merges.
- **Expected checks:** (written before the work, 8c4d8dc) cs2 about 25 checks, red first on e2236be; cs1 44 (the same
  count: T4 and T6 assert visual styles instead of textClasses); `-- report` the base's suites + cs2, the rest the same
  counts; `-- checker`, `-- core` the same; mutation +1 mutant, killed by cs2; full run: the base's suites + 1.
- **Got:** cs2 29 checks, red first on e2236be (FAIL 18 of 28; T4's "title hidden" check added after the mutant first
  survived: it is the check that kills CS-style). cs1 44 = 44. report 33 -> 34 suites PASS (every other count the
  same), checker 5 = 5, core 6 = 6, mutation 73 -> 74 mutants, all killed (189 -> 192 checks). lint clean.
  changelog-words, check-result-lines, check-agent-memory PASS. Full run on 480386a's code (a3c89c0 + docs):
  "run-tests: 99 suites passed" (the base's 98 + cs2).
- **Resume:** done; waits for the reviewer, then the laptop ("For the laptop").

## The evidence (each property's source)
1. **Why Desktop drew the defaults.** Microsoft's base themes set the visual title and axis sizes as visual styles, not
   as text classes: the Fluent 2 base theme that the pinned validator package ships (`Fluent2-CY26SU10`, its scaffold's
   `StaticResources/SharedResources/BaseThemes`, MIT) has `visualStyles["*"]["*"].title = [{ fontSize: 15 }]`,
   `categoryAxis`/`valueAxis` `fontSize` and `titleFontSize` 10.5, and `textClasses` only callout/title/header/label.
   A visual style is more specific than a text class (Microsoft Learn, "Create custom report themes", visual styles:
   "sets ... for each visual type"; "Use report themes": the custom theme layers on the base theme), so a custom theme's
   `textClasses.largeTitle` alone does not reach a title that a base theme styles. Same for the table: Desktop draws
   `values` from the visual style when one is set.
2. **What Desktop is proven to draw:** DataArcus's own themes (`assets/js/design-engine.js: textSizes`) write every
   visual text size as `visualStyles[<type>]["*"][<object>] = [{ fontSize | textSize }]` (tableEx/pivotTable values,
   columnHeaders, total, rowHeaders; slicer header and items `textSize`; card labels and categoryLabels; multiRowCard
   cardTitle, dataLabels, categoryLabels), measured in Desktop since 0.2.x (`scripts/tests/DESKTOP-TESTS.md`: the 15pt
   slicer and table text on 1080, C2's theme sizes). Those themes have no `baseTheme` in `themeCollection`.
3. **The properties:** every (type, object, property) CS2 writes is one of CS1's roles (`text-format.mjs ROLES`), each
   checked present for that type in Microsoft's report theme schema 2.149 (CS1.md, "The text roles"): titles
   `title.fontFamily/fontSize`, axis titles `titleFontFamily/titleFontSize`, slicer `header`/`items` `fontFamily/textSize`,
   the rest `fontFamily/fontSize`. Microsoft's validator (`PBIR_THEME_VISUAL_PROP_UNKNOWN`) checks each on the copy.
4. **No `$schema` (Fintech):** Microsoft's validator (`PBIR_JSON_FILE_NO_SCHEMA`: "Fabric rejects PBIR definition JSON
   files without $schema") reports it on `definition.pbir` and every definition file. Microsoft Learn ("Power BI
   Desktop project report folder", Report files): definition.pbir `version` "1.0" = PBIR-Legacy (report.json) only;
   "4.0 or higher" = PBIR possible; the example pairs "4.0" with `definitionProperties/2.0.0`.

## The plan
1. **The text set as visual styles** (`textPlan`): for every role of every type the listed visuals have, the set's font
   and size go to `visualStyles[<type>]["*"][<object>][0].<property>` of the report's theme file (a property added or set;
   the entry's other properties, such as a colour, kept); a missing object is added as `[{ ... }]`. The theme's
   `textClasses` are no longer written (decision 2). A report without a theme file gets `DataArcusText.json` =
   `{ name, visualStyles }` (no textClasses, no colours), registered as CS1 does. A theme's own visual style for that
   type and object (`text.themeStyles`) is now set to the text set and listed with from -> to.
2. **The allowlist:** theme kind: `/visualStyles/<known type>/*/<role object>(/<i>/<role property>)?`
   (`THEME_STYLE_AT`, from ROLES); `TEXT_CLASS_AT` leaves the allowlist (nothing writes it now).
3. **Colours kept:** the removals stay TEXT_POINTER's (family, size, bold, italic); the allowlist already refuses any
   other removal (cs2 T4: a removed title colour is refused), so no second guard was added. New in verifyCopy: an
   added theme's content is allowlist-checked too (before, only its bytes against the plan). cs2 test: titles with their own `fontColor`,
   `background`, `alignment`, `titleWrap`: byte-for-byte the same values after the copy.
4. **definition.pbir without `$schema`:** read by its `version`: "4.x" (and a `definition/` folder) is read as
   definitionProperties 2.x (the version Microsoft's docs pair with 4.0; the redesign never patches this file: it is
   copied byte for byte) and the plan says so (`schemaNotes`); any other version, or any other definition file without
   `$schema` (report.json: patched by the copy, its version can't be told), is refused with the exact reason and the fix
   (open and save once in Desktop, which writes `$schema`). Nothing unknown passes silently.
5. **The lab:** the run sheet says what Desktop must draw: every title 14pt, table text 10pt, the colours of the titles
   given their own. The lab's report is not changed (CS1's counts stay); the colour case is cs2's own made-up fixture.

## Expected numbers (before any run)
- The lab, "report": 37 removals (as CS1); the added theme: `visualStyles` for the 8 listed visual types (card, slicer,
  clusteredColumnChart, lineChart, tableEx, pivotTable, clusteredBarChart, donutChart), `title.fontSize` 14 on each,
  `fontSize` 10 on tableEx/pivotTable values and columnHeaders and pivotTable rowHeaders; no textClasses.
- cs2 red first on e2236be: no visualStyles in the added theme, no THEME_STYLE_AT, Fintech's copy refused.

## Before -> after
| | Before (e2236be) | After |
|---|---|---|
| Where the text set goes | the theme's `textClasses` (fontFace, fontSize) | the theme's `visualStyles[<type>]["*"][<object>][0]` per role (font, size); textClasses never written |
| A report with no theme file | `DataArcusText.json` = `{ name, textClasses }` | `{ name, visualStyles }`: the lab's 8 types, title 14 each, table text 10 |
| A theme's own visual style for a type | listed, "kept as they are" (it beat the set) | its font and size set to the set (from -> to listed), its colour kept |
| Allowlist (theme) | colour tokens, `/textClasses/<class>/(fontFace|fontSize)` | colour tokens, THEME_STYLE_AT (role objects' font and size per known type) |
| An added theme in verifyCopy | its bytes = the plan's | + each pointer in it allowlisted |
| themeValue (FORMAT_MIXED, the set's vote) | the type's own visual style, then the class | + the theme's `"*"` style (as Microsoft's base theme sets titles) |
| definition.pbir with no `$schema` | refused ("names no schema") | version 4.x: read, said in `redesign.schemaNotes`, copied as it is; other versions refused with the fix |
| Any other file with no `$schema` | refused, generic | refused: "an older Desktop save ... Power BI Desktop writes it when it saves" |

## CHANGELOG line
- **The text set is drawn as planned:** the theme now carries the text set per visual type (titles, axes, labels,
  table text), where Power BI Desktop applies it, instead of only as text classes, which Desktop left at its own
  default sizes. A visual's own colour, background, alignment and wrap are never touched; only its font, size, bold
  and italic go. A report saved by an older Power BI Desktop (its definition.pbir names no schema) can be redesigned;
  any other file without one is refused with why and how to fix it (open and save once in Desktop).
("Drawn as planned" is the expectation from the evidence above; the laptop's run confirms it before release.)

## Decisions I made
1. **Visual styles per type, not `"*"` for all types:** a `visualStyles["*"]["*"]` title would also reach text boxes,
   shapes, buttons and custom visuals the plan lists as untouched; per type reaches only the types the listed visuals
   have (as `design-engine.js textSizes` writes them). A hidden visual or a group's visual of the same type with no
   own setting now shows the set too (its own settings, if any, still win).
2. **No text classes written at all** (both an added theme and the report's own): a class written with only font and
   size may replace the base theme's class colour with Power BI's default (the likely cause of DataDNA's "invisible"
   titles: their colour was never in visual.json's removals, cs2 T3 shows the visual's colour already survived on
   e2236be). Measured on the laptop next. TEXT_CLASS_AT left the allowlist and the code.
3. **No `baseTheme` added**, against the brief's first idea: the only base theme file DataArcus could add is
   Microsoft's Fluent 2 (shipped in the validator package), and it brings Fluent 2's colours, padding, borders, grey
   wallpaper and titles on: much more than the text set. DataArcus's own exports have no baseTheme and Desktop applies
   their custom theme's visual styles (proven since 0.2.x). Visual styles per type are more specific than any base
   theme's `"*"` style, so they hold either way. Measured on the laptop next (the lab has `themeCollection: {}`).
4. **definition.pbir only is read without `$schema`:** it is never patched (copied byte for byte), and Microsoft's docs
   tie its `version` to the format (1.0 PBIR-Legacy, 4.0+ PBIR). report.json and the other definition files are patched
   or read by schema version, so one without `$schema` is refused with the fix; nothing passes silently. The copy keeps
   the original's definition.pbir as it is (no `$schema` added): Microsoft's validator reports PBIR_JSON_FILE_NO_SCHEMA
   on the copy as on the original, said in the plan.
5. **cs1's T4 and T6 changed** (not their counts): they asserted the textClasses write this job replaces by the
   reviewer's go; the same 44 checks now assert the visual styles. The lab report is unchanged (CS1's 37 removals and
   FORMAT_MIXED counts hold); the colour case is cs2's own made-up fixture.
6. **The font in the set** is written as the face most visuals write ("'Segoe UI Semibold', wf_segoe-ui_semibold,
   ..."), as before; with "the theme's" font (the lab) no font is written.

## For the laptop
1. `node mcp/lab/consistency-lab.mjs <empty folder>`; plan_layout `{ path: "Gulf Retail.SemanticModel", redesignFrom:
   "Store Ops.pbip", consistentText: "report" }`, approve_plan, create_report. Open `Store Ops redesigned.pbip`: in the
   format pane of every visual, Title > Text size = 14 (the theme's font, not bold or italic); table and matrix Column
   headers, Values (and matrix Row headers) Text size = 10. Any other value: stop and report the visual and the value.
2. The same with `--theme` (the report's own theme): the same sizes; `store-ops-theme.json` gained only visualStyles
   font and size entries; its colours as before.
3. The DataDNA and Fintech copies (the owner's own, nothing from them in the repo): titles keep their own colours
   (as in the original, side by side); the drawn title and table sizes are the plan's `text.set`. Fintech: the plan
   says `schemaNotes` (definition.pbir read by its version); if another file is refused, the message names it: open
   and save once in Desktop, plan again.
4. Write down for each: is any visual title still not 14 (a base theme or style winning)? That decides whether a
   `"*"` style or a base theme is needed (decision 3).

## Seen, not in scope
1. A text class the report's own theme sets (largeTitle, label) is left as it is: visuals of types no listed visual
   has (new ones added later) still follow it, not the set.
2. Bold and italic: removed and left to the theme (CS1's decision 2); the set writes no bold false, so a base theme
   that draws titles bold keeps doing so.
3. The copy of a report with no `$schema` in definition.pbir keeps the validator's PBIR_JSON_FILE_NO_SCHEMA error (as
   the original has it); Desktop opens both.
4. read_report does not list the theme's visual styles (CS1's Seen 1 holds).
5. The base worktree comparison ran on Linux only; Windows and macOS are CI's.
