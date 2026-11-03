# RD3 (0.3.2 R&D): document_model, the model's handbook in English and Arabic

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night): "Go for 10 r&ds during the night ... choose the best r&ds ideas
  that will best fit our code and make us shine"; the brief RD3 in `mcp/research/SCOUT-0.3.2.md` (rd/0.3.2-scout).
- **Question:** can DataArcus write, after approval, one HTML handbook next to the project (tables, columns, measures
  with their DAX, display folders, dependencies both ways, the report visuals that use each measure, the date tables,
  the health score) in English and Arabic, from metadata only, so a team hands its boss a document?
- **Scope:** docs only: this file and scratch scripts under `mcp/research/rd3/`. No product file changes.
- **Base:** `rd/0.3.2-document-model` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** none run by a product suite (no product file changes). Measured by `rd3/handbook-proto.mjs`
  on made-up models only (`mcp/fixtures/health-project`, the sample project written to `os.tmpdir()`): size in KB,
  time in ms, Arabic names from confirmed terms vs "not confirmed", DAX string literals masked.
- **Got:** most of the handbook already exists: the website's Model Health Check downloads an English HTML and
  Markdown "Full documentation" (`assets/js/model-health.js:661` docHtml, `:688` docMd) from the engine's
  documentation data (`assets/js/model-health-engine.js:780-821`: measures with DAX, folder, format, dependsOn,
  usedBy, pages; columns with neededBy). Missing: Arabic, masked DAX literals, visuals per measure, explain-in-words,
  and any MCP path. Prototype (`rd3/handbook-proto.mjs`, made-up models): 5.6-14.8 KB and 3-54 ms on the three
  small models; 467 KB in 162 ms at 495 measures; the tool's answer 140-157 characters, no name, DAX or description.
- **Recommendation:** a shared engine `assets/js/model-handbook.js` (lifted from docHtml), used by the website's
  Documentation tab and by a `handbook` option of check_model_health that writes one HTML file next to the project
  through the plan gate the fix scripts use. Not a 12th tool.
- **Builder brief:** section g, size M (about 450 lines with tests), risk low (no model or report file touched).
- **Resume:** done; the owner decides on the brief (g) and the open decisions in e.

## The plan
1. a) Read what read_model, check_model_health and the website's Model Health Check already return or download.
2. b) Microsoft's docs: descriptions as tooltips, display folders, TMDL view, translations.
3. c) The ways: a check_model_health option, a 12th tool, a website page on the same engine; judged on the code.
4. d) A prototype handbook (scratch script, made-up models, written to `os.tmpdir()`) and its numbers.
5. e) Recommendation; f) Desktop checks; g) the builder brief.

## a) What read_model and check_model_health already return (integration/0.3.2)
- **read_model** (`mcp/tools/read_model.mjs:15`): tables, visible columns with types, measures with formats, date
  tables, areas (display folders); a summary first past 40,000 characters. No DAX, no descriptions, no dependencies.
- **check_model_health** (`mcp/tools/check_model_health.mjs:44`): score, findings with their objects, pleaseConfirm,
  gulfCalendar; fix scripts written next to the project only with an approved planId (`:82` scriptAfterGo, the names
  fixed in the plan by `freeScriptName`, `lib/fix-scripts.mjs`). The DAX stays in the files, "not in this answer".
- **The engine already builds the handbook's data** (`Health.analyze`, `model-health-engine.js:780-821`): per measure
  name, table, expr, formatString, folder, description, hidden, used, visuals (count), pages, depth, dependsOn, usedBy;
  per column used, neededBy, visuals; date tables (`markedDate`); stats; score. Which visual uses which measure is in
  `analyzeReport(...).perVisual` (`dax-reference-parser.js:110`), each ref labelled by `visualLabel` ("Card "Sales"").
- **The website already writes it, English only** (`model-health.js:640-657`, the Documentation tab: HTML, Markdown,
  measures CSV). Its builder is inside the page module (uses the page's `R`, `esc`, `RULES()`), so the MCP cannot call
  it today. Its comment says why English: "always English, like the model" (`:661`).
- **Arabic pieces that exist:** every rule's title, why and fix in Arabic (`RULES` ar, e.g. NO_DESC at `:95`); the
  terminology sheet (`mcp/lib/terminology.mjs:157` sheetOf, `:129` confirmedOf, `:173` askNextOf) with names
  confirmed in this session only (kept in memory, `:120`); the fixed list's drafts (`mcp/lib/arabic-names.mjs`
  proposeArabic, draftText), drafts only, never shown as the name.

## b) Microsoft's docs (Microsoft Learn, read 3 Nov)
- A measure's description shows as its tooltip in the Data pane, DAX query view and Model explorer; since the July
  2026 Desktop (2.156) a `///` line above a MEASURE in DAX query view writes it, "the same syntax TMDL supports"
  ([updates archive](https://learn.microsoft.com/power-bi/fundamentals/desktop-latest-update-archive#july-2026-update-version-21569510)).
- Display folders: `\` makes subfolders, `;` puts a field in several folders
  ([desktop-measures](https://learn.microsoft.com/power-bi/transform-model/desktop-measures#organize-your-measures)).
  The handbook groups by the folder string as written; a builder should split on `;` and `\` (the prototype does not).
- TMDL view (GA in Desktop since September 2025): a script pasted, Preview, Apply
  ([desktop-tmdl-view](https://learn.microsoft.com/power-bi/transform-model/desktop-tmdl-view)): the way the fix
  scripts already go, and the way a "suggested descriptions" script would go (f).

## c) The ways, judged on the code
| Way | For | Against |
|---|---|---|
| 1. `handbook: true` on check_model_health | the gate, the free file names, the "next to the project" rule and the answer shape exist (`:82`); the engine's data is what this tool already computes; no instructions budget (`agent-text.mjs:9`, 2,200) | the tool's description grows by about 300 characters; one more file kind in its plan |
| 2. A 12th tool document_model | a clear name for the person | the owner chose "an option, not a 12th tool" (C, WORK.md); the server's instructions are at their cap; a second gate and plan kind for the same analysis |
| 3. The website only (Documentation tab, Arabic added) | no MCP change; the person keeps it in the browser | the MCP's user (Claude in Desktop) gets nothing; two builders drift if the MCP later adds one |
| **1 + 3 on one engine** | one builder (`assets/js/model-handbook.js`), the same file from both, as the rest of `assets/js/` | the lift must keep the website's download byte-identical in English first (a characterisation test) |

## d) The prototype and its numbers
`node mcp/research/rd3/handbook-proto.mjs` (scratch, not product code). Made-up models in `os.tmpdir()` only: the
health fixture, the sample project (`sampleFiles`, written by `writeTree`), and a made-up "Gulf Trading" model in the
script (11 measures in folders, a chain of depth 3, a marked Calendar, two DAX text filters, one description written
as an instruction), and the same model 45 times (495 measures). One HTML file: an English half and an Arabic half
(`dir="rtl"`), each: score, counts, date tables, tables and columns, measures by folder with description (or "no
description yet"), the chain in words (explain_measure), the masked DAX, "used by" and the report visuals.

| Model | KB | ms | Measures | Literals masked | AR confirmed | AR not confirmed | (drafts the list could offer) | Withheld | No description | Answer chars |
|---|---|---|---|---|---|---|---|---|---|---|
| health-project | 5.6 | 53.8 (first load) | 2 | 0 | 0 | 18 | 9 | 0 | 2 | 140 |
| sample project | 8.5 | 18.3 | 4 | 0 | 0 | 27 | 21 | 0 | 2 | 140 |
| Gulf Trading | 14.8 | 7.1 | 11 | 4 | 0 | 27 | 17 | 1 | 9 | 143 |
| Gulf Trading, 4 terms confirmed | 14.7 | 3.0 | 11 | 4 | 4 | 23 | 13 | 1 | 9 | 152 |
| Gulf Trading x45 | 467.2 | 161.6 | 495 | 180 | 0 | 511 | 17 | 45 | 405 | 157 |

What the numbers say:
1. **Arabic names: 0 confirmed in a fresh session.** confirmedOf holds terms in this process's memory only
   (`terminology.mjs:120`), so a handbook asked for alone shows every name "غير مؤكد" (not confirmed) beside the
   English. The fixed list could draft 17 of 27 on Gulf Trading, but a draft is never the name (rule). The handbook
   needs the person's terms as an input (as create_arabic_twin's `terms`), pinned in the plan (e).
2. **Literals: 4 masked on Gulf Trading, but only 2 are values** ("Online", "Pearl Bay"); the other 2 are a label
   ("Sales: ") and a FORMAT pattern ("#,0"). Masking every string is the safe default; a format string argument may be
   kept (the second argument of FORMAT, and formatString itself is metadata). A measure's *name* can still hold a
   value ("Pearl Bay Sales"): names are metadata, shown, screened by `shownName`.
3. **The instruction-like description is withheld** in the file (45 of 45 at scale) and never reaches the answer:
   the answer is counts and the file's name only; a search of it for "Pearl Bay", "Online" and the instruction found
   none (answerLeaks 0 on every run).
4. **Size and time are no constraint:** 467 KB and 162 ms for 495 measures; the file is never read into the answer.
5. **Rendering (a screenshot of the Arabic half, Chromium):** right to left reads well; two defects to fix in the
   builder: a format string ("#,0" drawn as "0,#") and an English description's full stop jump sides unless each is
   wrapped (`<bdi>` or `dir="ltr"`); visual labels come out English ("Card "Sales"") and need Arabic visual words
   (the owner's «المرئيات»; `VISUAL_TYPES` has English only, `dax-reference-parser.js:85`).

## e) Recommendation
- **Build ways 1 and 3 on one engine.** Lift docHtml/docMd into `assets/js/model-handbook.js` (pure: the engine's
  result, the report's perVisual, options in; HTML text out), first with a characterisation test that the website's
  English download is byte-identical; then add the Arabic half, the masking, visuals per measure and explain-in-words.
- **check_model_health `handbook: true`** (and `handbookLang: 'en' | 'ar' | 'both'`, default both): without a planId
  the answer names the file it would write (`<project> - handbook.html`, free name fixed in the plan) and the counts;
  with an approved planId it writes that file next to the project, as the fix scripts. Never returned as text.
- **Arabic names:** the person's terms (`terms: { "Table[Field]": "..." }`, the twin's input shape; measures as
  `Table[Measure]`, as `fieldKeyOf` keys them) plus the session's confirmedOf; everything else is the English name
  marked «غير مؤكد». No draft is ever printed as a name.
- **Open decisions for the owner:** (1) whether drafts from the fixed list may appear as a marked suggestion column
  (my default: no); (2) whether FORMAT patterns are kept unmasked (my default: mask all strings, simplest promise);
  (3) whether the website download also gets the Arabic half by default (my default: yes, a language choice).
- **Seen, not in scope:** a "suggested descriptions" TMDL script (405 of 495 measures without one at scale) would be
  writing model text from a guess: only as the person's own text, never generated; it is not part of this brief.

## f) Desktop checks
- The handbook file: none (a browser page, nothing Power BI reads). One check on the laptop batch: open the file in
  Edge with Windows set to Arabic, print to PDF, confirm the RTL half and the DAX blocks.
- The descriptions a handbook points to are applied, by the person, in TMDL view or DAX query view (`///`): not
  written by DataArcus.

## g) Builder brief (HB1)
- **Base:** `feat/0.3.x-hb1` from the integration branch the reviewer names. Push only it.
- **Files:** new `assets/js/model-handbook.js` (+ `npm run build:min`); `assets/js/model-health.js` docHtml/docMd call
  it; `mcp/tools/check_model_health.mjs` the `handbook`, `handbookLang`, `terms` inputs, pinned in `pinH`, the file
  name in the plan's data like `scriptNames`; `mcp/TOOLS.md`; `mcp/CHANGELOG.md` [Unreleased] in plain words;
  `assets/js/dax-reference-parser.js` an Arabic visual word map beside `VISUAL_TYPES` (or in the handbook engine).
- **Tests first, by risk:** (1) the answer holds no DAX, description, literal or instruction text (the prototype's
  leak check, on the trading model); (2) without planId nothing is written, with one exactly the planned name;
  (3) the website's English download byte-identical before the Arabic is added; (4) every string literal masked,
  counted; (5) a name with no term shows the English name and «غير مؤكد», never a draft; (6) `<bdi>` around every model
  text in the Arabic half; (7) folders split on `;` and `\`. One suite line in `mcp/tests.json` (area health);
  `node scripts/test-site-config.mjs` for the website change.
- **Expected numbers:** the prototype's table (d) within 10% on size; answer under 400 characters; 0 leaks.
- **Size:** M (engine about 250 lines, tool about 60, tests about 150). **Risk:** low: no model, report or Desktop file
  is written; the new file is a new name through the existing gate.

## Decisions I made
1. The handbook is one HTML file with both halves (an English and an Arabic section, anchors to each), not two files:
   a boss gets one document; `handbookLang` keeps either half alone.
2. Every DAX string literal is masked in the file too, not only in the answer: the file is meant to be passed on.
3. Measured keys in the prototype were "[Measure]"; the builder uses "Table[Measure]" as the terminology sheet does.
4. Page pictures (`page-preview.js`) left out of the prototype: it draws a *planned* page (`fromFiles` exists, `:519`)
   and would add about 5-20 KB a page; listed as a later option, not measured tonight.
