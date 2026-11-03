# RD10 (0.3.2 R&D): one model, two languages: an Arabic culture for the model

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night): "Go for 10 r&ds during the night ... choose the best r&ds ideas
  that will best fit our code and make us shine"; brief RD10 in `mcp/research/SCOUT-0.3.2.md` (rd/0.3.2-scout).
  WORK.md's open item "Arabic DA measures for the twin" stays the owner's (not touched here).
- **Scope:** docs only: this file and scratch scripts under `mcp/research/rd10/`. No product file changes.
- **Base:** `rd/0.3.2-arabic-culture` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** no product suite touched; the prototype is a scratch script run with `node`, writing made-up
  data in `os.tmpdir()` only and parsing its own output with `assets/js/tmdl-model.js`.
- **Expected numbers (before the work):** the sample project's model (`mcp/lib/sample-project.mjs`) has a handful of
  tables and fields; the fixed glossary drafts some, so a culture file built from *confirmed* terms only covers 0
  objects until the person approves terms; with a made-up confirmed set, coverage = confirmed / total, the rest listed
  English. The file must parse back with `tmdl-model.js` as one `cultures` entry.
- **Got (measured, `mcp/research/rd10/culture-proto.mjs`):** the sample model has 27 translatable objects (4 tables,
  19 columns, 4 measures, 0 hidden, 6 descriptions, 0 display folders); the glossary drafts 21 of them, none written;
  a made-up sheet of 16 confirmed names + 1 confirmed description gives one `cultures/ar-AE.tmdl` of 38 lines, 916
  bytes, 17 translations, 11 objects and 5 descriptions left English and listed (coverage 16/27 = 59%). It reads
  back with no skipped file, as one culture `ar-AE`; but the shared reader keeps 3 of its 17 translations (two gaps
  in `tmdl-model.js`, below). Six Gulf cultures: 6 files, 5,496 bytes, identical except the name; one TMDL view
  script for all six: 230 lines, 5,734 bytes.
- **Recommendation:** way A, a twin option: `create_arabic_twin` writes one TMDL script "<twin> - Arabic names.tmdl"
  from the plan's own approved terms (already pinned in its digest), applied by the person in TMDL view. Size S-M,
  risk low (no model file is written by DataArcus). Arabic Q&A synonyms: dropped (Q&A is English only and retires
  Feb 2027).
- **Resume:** done; the owner decides whether brief AC1 (g) goes to the builder.

## The plan
1. (a) Read today's code: terminology sheet and memory, twin texts, arabic-names, model-script, tmdl-model's cultures.
2. (b) Microsoft Learn: translations (caption, description, display folder), locale rules, TMDL culture syntax.
3. (d) A scratch prototype `mcp/research/rd10/culture-proto.mjs`: the sample model + a made-up confirmed sheet ->
   `cultures/ar-AE.tmdl`; measure coverage, list English-left objects, parse it back, size per Gulf culture.
4. (c, e, f, g) Ways with size and risk, the recommendation, the checks (the service check as a laptop step), the
   builder brief.

## a) Today's code (integration/0.3.2)
- **The terms exist and are approved one at a time.** `mcp/lib/terminology.mjs:157` sheetOf gives every field the
  report shows as EN | AR with a status (approved, draft, kept) and why; `:138` remember keeps only `approved` (a
  name the person gave or confirmed) and `kept` (declined); a draft approved with the whole plan stays a draft
  (never confirmed silently). The key is the model's folder and tables (`:122` modelKeyOf), the evidence the field's
  description and DAX (`Memory.termEvidence`): a changed measure asks again. Memory is per session (`CONFIRMED`, 5,000).
- **The twin already carries them in its plan.** `create_arabic_twin` takes `terms` ({ "Table[Field]": "Arabic" },
  `mcp/tools/create_arabic_twin.mjs:45`), pins them in the digest (`:93` pin.terms) and writes them on every header,
  title, tooltip and alt text of the field (the report side). The model is never renamed (`terminology.mjs:181` HOW).
- **The drafts.** `mcp/lib/arabic-names.mjs` proposeArabic drafts from the fixed glossary
  (`assets/data/arabic-report-words.json`); a word not listed gives no draft. Drafts are shown, never written.
- **The script pattern exists.** `mcp/lib/model-script.mjs`: `scriptFileOf` ("<report> - <option>.tmdl", a file of the
  one write, in the digest), `tagOf`, `freeNamer`, `compatOf`. Used by L3 metric switcher, L4 flip cards, status
  icons and the DAX library (`mcp/lib/dax-functions.mjs:314`); the person applies it in TMDL view (`daxHow` gives the
  steps: Notepad, TMDL view, new tab, paste, Preview, Apply).
- **Reading cultures today.** `assets/js/tmdl-model.js:261` maps the `cultureInfo` object to `model.cultures`, as
  Desktop's files write it (fixture `scripts/tests/fixtures/model-health/tmdl-ramadan/definition/cultures/en-US.tmdl`,
  test `scripts/tests/tmdl-model.mjs:225`). Two gaps, measured by the prototype:
  1. **Translations collapse.** Inside `translations > model > table ...`, `table` is not in `LISTS` (`:126`), so
     `toJson` keeps the last table only (`o[c.type] = ...`): 3 of 17 translations read back (Calendar's). Nothing in
     the product reads translations today, so nothing is wrong on screen; it matters the day a check reads them.
  2. **Learn's keyword `culture` is not read.** Learn's TMDL example writes `culture pt-PT` (and `ref culture`);
     the reader maps only `cultureInfo`: the same file with `culture` gives 0 cultures, no skipped file (silent).
     TMDL is case-insensitive but these are two words; which one Desktop accepts in a script is a laptop check (f).
- **The shadow copy drops cultures** (`mcp/lib/shadow-model.mjs:7`, `:338` "cultures (translations)" listed as left
  out): the see-the-result copy would not show an Arabic culture, which is right (Desktop does not load them anyway).

## b) Microsoft's docs (Microsoft Learn, read 3 Nov 2026)
- **What can be translated** ("Plan translation for multiple-language reports"): metadata translation is on the
  semantic model only: tables, columns, measures, hierarchies, levels; properties Caption, Description, DisplayFolder.
  Report layout text (text boxes, buttons, page tabs) cannot be translated; page tabs: hide them. The twin already
  covers that side (an Arabic copy of the report).
- **Desktop does not load metadata translations** ("Use locale values"): "Power BI Desktop only loads semantic model
  object names". So the effect is seen in the service only; a Desktop check can prove the file applies, not the names.
- **Culture match** (same page): measures take the closest culture (so ar-KW may get ar-AE's measure names: a service check), tables and
  columns need an exact match, else English ("a known issue"). Learn's advice: one set per culture name you support.
  For the Gulf: ar-AE, ar-SA, ar-KW, ar-QA, ar-BH, ar-OM: six cultures, one file each (TMDL: "one file for each
  culture"), the same captions in each unless the person wants local wording.
- **Testing** ("Add a language ... Translations Builder"): publish, open the report with `?language=ar-AE` on the URL;
  Learn says a Premium capacity workspace for that walkthrough (to check on the laptop whether Pro shows it too).
  The mobile apps ignore `?language=`; they use the device's locale.
- **TMDL form** ("TMDL Reference - Objects overview", "Translations in TMDL"): under the culture, `translations`,
  `model Model`, then `table`, `column`, `measure`, `hierarchy` with `caption:`, `description:`, `displayFolder:`;
  `linguisticMetadata =` is a separate child (the Q&A schema). Property values one line, quoted when they start or
  end with a space.
- **Q&A** ("Supported languages": Q&A is English only; "Intro to Q&A tooling": "Q&A experiences are going away in
  February 2027", Copilot instead). Arabic synonyms in `linguisticMetadata` would serve nothing a Gulf user can use.

## c) The ways, judged on the code
| Way | What | Size | Risk |
|---|---|---|---|
| A. Twin option `modelNames` (recommended) | `create_arabic_twin` with the option writes one more file of its one write: "<twin> - Arabic names.tmdl", a TMDL view script (`createOrReplace`, a `cultureInfo` per chosen culture) built from `P.terms` only, already in the digest. The plan lists covered and English-left objects (the sheet's rows) and the six cultures. | S-M: one lib module (~120 lines: lines, quoting, coverage), one option in the tool's zod, plan text EN and AR, one suite (~25 checks). No new tool. | Low: no model file written by DataArcus; the person previews in TMDL view. One risk: `createOrReplace` replaces a culture the model already has (its other translations, its linguisticMetadata); guarded by skipping a culture name the model already has, and saying so. |
| B. An `add_gulf_calendar`-like step on its own | A model script tool step (or an option of `read_model`) that writes the culture from the session's confirmed terms. | M: a plan kind, approval page, write; terms from memory (`confirmedOf`) rather than a twin plan. | Medium: a 12th tool or a read tool that writes, against decision C and `INSTRUCTIONS_MAX`; terms in memory are per session and per model key. |
| C. RD3 handbook appendix | The document-model handbook (RD3, `mcp/research/RD3-document-model.md`) lists the confirmed terms as an EN | AR appendix, and gives the culture text to paste. | S, but nothing is applied, and the text would sit in an answer (size cap). | Low, low value: the person copies it by hand. Good as a fallback line inside way A's plan. |

## d) The measured prototype (`mcp/research/rd10/culture-proto.mjs`, made-up data in os.tmpdir())
- Input: `sampleFiles()` of `mcp/lib/sample-project.mjs` (the made-up Gulf Retail model), read with `TmdlModel.read`
  (0 skipped). A made-up confirmed sheet: 16 captions, 1 description; 2 fields kept in English (declined).
- Objects: 27 (4 tables, 19 columns, 4 measures), 0 hidden, 6 with a description, 0 display folders.
- Glossary drafts: 21 of 27 (shown in the list, never written: e.g. Sales[Channel] «القناة» stays English until
  confirmed).
- Written: 16 captions + 1 description = 17 translations; coverage 16/27 = 59% of captions, 1/6 descriptions.
- Left English and listed (11): Sales[Date], Sales[Branch], Sales[Product], Sales[Channel], Sales[Orders],
  Calendar[Date], Calendar[Quarter], Calendar[Year Month] (draft only, not confirmed); Sales[Units Sold] (no name);
  Calendar[Month Number], Calendar[Year Month Key] (kept, declined). Descriptions left English: Sales,
  Sales[Total Sales], Branches, Products, Calendar.
- The file: `cultures/ar-AE.tmdl`, 38 lines, 916 bytes. Six Gulf cultures: 6 files, 5,496 bytes, the same except
  the name. As one TMDL view script (`createOrReplace` and six cultures one level deeper): 230 lines, 5,734 bytes.
- Validity: read back with the model (model.tmdl + `ref cultureInfo ar-AE`): 0 skipped, `cultures: ["ar-AE"]`;
  translations read back 3 of 17 (gap 1); with Learn's `culture` keyword: 0 cultures, 0 skipped (gap 2).
- Not measured here (needs Desktop and the service): that TMDL view accepts a `cultureInfo` in a `createOrReplace`
  script without `linguisticMetadata`; that the names show in the service under `?language=ar-AE` and under ar-KW.

## e) Recommendation
Way A. It reuses what is strongest: the approved terms the twin already pins, the one write, and the script pattern
of `model-script.mjs`. The model is not changed by DataArcus; the person applies the script. Only `approved` terms
are written (the twin's `terms` the person gave); drafts and fields without a name stay English and are listed in
the plan, EN and AR. Default cultures: all six Gulf names in one script (exact match for tables and columns);
`ar-AE` alone when the person asks. Descriptions: written only when the person approved an Arabic description (none
are drafted). Display folders: only the folders DataArcus itself writes (the DA library's folder) when an Arabic
name for them is approved. No `linguisticMetadata`, no synonyms. Fix gap 1 and gap 2 in `tmdl-model.js` in the same
job (so a later check can read what it wrote), each with a failing test first.

## f) The checks
- **Suites (cloud):** the script's lines for a made-up sheet (quoting: names with spaces and `'`; values with leading
  spaces and `"`); coverage and the English-left list match the sheet; a draft is never written; a culture the model
  has is skipped and said; the script reads back with `tmdl-model.js` with every translation (after gap 1's fix);
  `culture` and `cultureInfo` both read (gap 2); the plan's digest changes when a term changes.
- **Laptop (Desktop, the owner's machine, made-up sample only):** open the sample project, TMDL view, paste the
  script, Preview, Apply; save; the project's `cultures/` has six files, `model.tmdl` the refs; which keyword the
  saved files use; Desktop still shows English names (expected, Learn).
- **The service check (a step for the owner's laptop, never from this session; nothing is published from here):**
  publish the made-up sample to a test workspace; open the report with `?language=ar-AE`, `?language=ar-KW`,
  `?language=en-US`; note tables, columns, measures and descriptions (field list hover) in Arabic or English per
  culture; note whether the workspace needs a Premium or Fabric capacity; screenshot each; delete the published model.

## g) Builder brief (AC1: Arabic model names as a twin option)
- **Approval:** the owner's go on this note (not given yet). **Base:** a branch from `origin/integration/0.3.2`.
- **Scope:** `mcp/lib/model-culture.mjs` (new: cultureScript(terms, model, cultures, seed) -> { text, covered,
  english, skipped }), `mcp/tools/create_arabic_twin.mjs` (option `modelNames: true | ["ar-AE", ...]`, one more file
  of the write via `scriptFileOf(base, ' - Arabic names')`), `mcp/lib/twin-plan.mjs` (the plan's list, EN and AR),
  `assets/js/tmdl-model.js` (gaps 1 and 2; then `npm run build:min`), TOOLS.md, CHANGELOG [Unreleased] in plain words.
- **Tests first by risk:** a draft never written; a culture already in the model skipped; read-back of every
  translation; then quoting; ~25 checks in one new suite in `mcp/tests.json`, plus 2 in `scripts/tests/tmdl-model.mjs`.
- **Expected numbers:** on the made-up sample with the prototype's sheet: 17 translations per culture, 11 English
  rows, 6 cultures, the script 230 lines.
- **Size and risk:** S-M (about 300 lines with tests); low: no model file written; budget: a tool description line
  only (instructions at their cap).
- **Stop when:** TMDL view refuses the script (the laptop check decides the keyword and whether `linguisticMetadata`
  is required) before anything ships.

## Decisions I made
- The made-up sheet of 16 names is mine, for measuring; in the product only the person's approved terms are written.
- Synonyms for Q&A dropped (English only, retiring Feb 2027); recorded, not built.
- Six cultures as the default, not one shared file: TMDL has one file per culture, and tables and columns need an
  exact match.
- Gaps 1 and 2 put in the builder brief, not fixed here (no product file changes in an R&D).

## Seen, not in scope
- `tmdl-model.js` collapses any named child that is not in `LISTS` when it repeats (translations are one case);
  worth a fuzz line for other unknown objects.
- `shadow-model.mjs` drops cultures by design; the see-the-result tour could say "translations: seen in the service
  only" when the model has any.
