# CS2 (0.3.1): the text set where Power BI Desktop draws it; colours kept; an older save's definition.pbir

## Summary
- **Approval:** the reviewer's brief "Go on CS2" (27 Oct), after the laptop's CS1 run in Desktop 2.159: (a) the copy is
  one text set but Desktop draws Power BI's default sizes, not the plan's (the added `DataArcusText.json` held only
  `textClasses`); (b) on the DataDNA report the titles' own colour looked removed; (c) the Fintech redesign was refused
  ("redesignFrom: definition...": its definition file names no `$schema`). The option is not "clean up" until Desktop
  draws what the plan says.
- **Scope:** `mcp/lib/redesign.mjs` (the theme write, the allowlist, the schema check), `mcp/lib/text-format.mjs`
  (the theme's visual-style pointers, themeValue reads `"*"`), a new suite `mcp/test-0.3.1-cs2.mjs` (one line in
  `tests.json`), cs1's checks T4 and T6 (they assert the textClasses write this job replaces: said below), one mutant
  in `test-0.3.1-mutation.mjs`, `mcp/lab/consistency-lab.mjs` (the run sheet), CHANGELOG. Not R4A, GL2, TT1 or BD2's
  files; `approval-window.mjs` not touched.
- **Base:** `fix/0.3.1-cs2` from `origin/integration/0.3.1` (e2236be). Push only this branch; the reviewer merges.
- **Expected checks (written before the work):** cs2 about 25 checks, red first on e2236be; cs1 44 checks (the same
  count: T4 and T6 assert visual styles instead of textClasses); `npm test -- report` the base's suites + cs2, the rest
  the same counts; `-- checker`, `-- core` the same; mutation +1 mutant (CS-style), killed by cs2; full run: the base's
  suites + 1, all passed.
- **Resume:** see "Got" below once written.

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
3. **Colours kept:** the removals stay TEXT_POINTER's (family, size, bold, italic); a new verifyCopy guard: no removed
   pointer may name a colour, background, alignment or wrap property. cs2 test: titles with their own `fontColor`,
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
