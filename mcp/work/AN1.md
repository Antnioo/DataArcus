# AN1 (0.3.2): Arabic names in the model itself, as a twin option (RD10's brief g)

## Summary
- **Approval:** the owner, D-1104-01 (4 Nov): "Agree on all r&ds": RD10's recommendation (way A) built with its own
  recommended choices. Brief: RD10 section g (`rd/0.3.2-arabic-culture`, `mcp/research/RD10-arabic-culture.md`).
- **Base:** `feat/0.3.2-an1` from `origin/integration/0.3.2` at 1e5e3b3. Push only this branch; never merge, no PR.
- **Scope:** `create_arabic_twin` option `modelNames` (`true`: the six Gulf cultures; or a list of them) writes one
  more file of its one write, the TMDL view script "<twin> - Arabic names.tmdl" (`createOrReplace`, one `cultureInfo`
  per culture, `translations` captions only), built from the plan's own `terms` (pinned in its digest). A draft, a
  declined term, a field without a term, a table, a description: never written, listed English with why (EN and AR).
  A culture the model already has (or its own culture) is skipped and said. No machine translation, no
  `linguisticMetadata` (no Q&A synonyms). DataArcus never applies it. Files: `mcp/lib/model-culture.mjs` (new),
  `mcp/lib/twin-plan.mjs`, `mcp/lib/twin-write.mjs`, `mcp/tools/create_arabic_twin.mjs`, `assets/js/tmdl-model.js`
  (RD10's gaps 1 and 2) and its `.min.js`, `mcp/TOOLS.md`, CHANGELOG line, WORK.md line, a new suite.
- **Expected checks:** new suite `an1` (area twin) about 25 checks, red on 1e5e3b3 (no module, no option); plus 2 in
  `scripts/tests/tmdl-model.mjs` (red there: gap 1 keeps 1 table of translations, gap 2 reads 0 cultures). Unchanged:
  every other suite's number; sp11 and sp26 (twins byte for byte the base's) prove the option off changes nothing.
- **Expected numbers (made-up: the sample project's model, a page showing its 23 fields, RD10's sheet as `terms`):**
  the twin's terms are per field, so RD10's 4 table names and 1 description have no input: 12 captions per culture
  (not 17), 72 in all, 6 cultures, 15 rows left English (4 tables + 11 fields; RD10 counted 11 with its tables
  confirmed), the script about 200 lines (RD10's 230 had the 4 tables and the description). Plan answer: the option
  off +0 characters; on, a few hundred more, under the cap and never `truncated`.
- **Base numbers (1e5e3b3):** fx1 22 / 22 / 22.
- **Got:** `an1` 25 checks, red on 1e5e3b3 first (22 of 25; T1, T13, T15 are guards, green there; commit 89bc050);
  after: 25 of 25. tmdl-model 70 -> 72 (both new red there). Measured: 12 captions a culture, 72 in all, 6 cultures,
  15 rows English, the script 200 lines, 4,522 bytes. Plan answer: off 19,368 -> 19,368 (+0), on 22,957 (+3,589),
  never `truncated`. fx1 22 / 22 / 22. On the merged head (integration at 39c46bb, PK1, merged once): twin 40,
  arabic 15, model 19, safety 18 suites pass; the website's 34 of 34; lint 0.
- **CI green: https://github.com/Antnioo/DataArcus/actions/runs/41784584962 on 7f7bb32** (Linux and Windows, every job
  green; macOS skipped on a builder branch, as CI1 set). **State: DONE.**
- **Resume:** none; the reviewer's merge. The owner: the table names item (For the owner) and the laptop steps.

## The plan
1. Red first: `test-0.3.2-an1.mjs` and the 2 tmdl-model checks, run on the base (red), committed.
2. `tmdl-model.js`: `table` joins LISTS (translations keep every table); `culture` read like `cultureInfo`
   (objects and `ref`); `npm run build:min`.
3. `lib/model-culture.mjs`: `cultureScript(terms, raw model, cultures)` -> { text, covered, english, skipped, ... };
   the names quoted as every script writes them, values quoted when they start or end with a space or hold `"`;
   a name or value with a control character never written (listed).
4. The twin: zod option, planTwin's `names` (answer `arabicModelNames`), twinTree's file (the month script's way: a
   file that already holds exactly this script is not written again), the pin and the plan's data, the write's
   refusal when `modelNames` differs, the writes lines EN and AR, the write's answer, the tool description (one line).
5. Sizes (L-1102-06): the plan answer with the option off and on, fx1 x3; TOOLS.md, CHANGELOG, WORK.md; lint;
   the merge once if moved; CI.

## CHANGELOG line
- **Arabic names in the model, as an option of the Arabic twin:** ask for it and the twin also writes a script you
  apply in TMDL view that gives the model's fields the Arabic names you approved, for each Gulf culture; nothing else
  is written, every name left in English is listed with why, and the names show in the Power BI service (Desktop keeps
  the model's own names).

## Decisions I made
- Only this plan's `terms` are written (pin.terms, in the digest). A term confirmed earlier in the session but not given
  again, or an Arabic given as one header's label, stays English and is listed (`earlier`, `label`): the write rebuilds
  the plan with `memory: false`, so writing those would make the rebuild differ and the write refuse.
- The captions are written as approved, without the bidi marks the report side adds (model names are not drawn beside
  values; the laptop check shows whether the service needs them).
- A culture the model has, and the model's own culture, are skipped (createOrReplace would replace its translations).
- No covered field: no script, `offered: false` with why (no empty cultures).
- The whys travel as codes with one dictionary EN and AR (`whys`, `whysAr`), the lists capped at 60, to keep the answer small.
- The reader's ?v= stamp of `tmdl-model.min.js` bumped (20261104an1) in its two loaders, theme-generator.js and
  model-health-worker.js (check-min requires it); their own stamps on the pages already differ from main.
- `mcp/lib/model-culture.mjs` joins the twin's affected paths in tests.json.

## For the owner
- **Table names stay English** in the Arabic culture: the twin's `terms` name fields only ("Table[Field]"), so RD10's
  4 table captions and its 1 description have no input (12 captions a culture, not RD10's 17). In the service's field
  list the tables read in English above Arabic fields. My recommendation: a small follow-up that accepts a table name in
  `terms` ({ "Sales": "المبيعات" }) for the script only, asked one at a time like a field. Built as RD10 wrote it until you say.

## Risky changes
- `assets/js/tmdl-model.js` (shared with the website): `table` joined LISTS, so a repeated `table` child is a list. Only
  translations hold one today (every top-level table goes through build, and roles and perspectives use their own
  kinds); tmdl-model 72, model-health, model 19 suites pass.

## Seen, not in scope
- The plan's `arabicModelNames` lists up to 60 English rows: on a large model it adds a few thousand characters to the
  twin's answer; capAnswer fits it, but a `namesFrom` paging like `termsFrom` would be cleaner.
- `shadow-model.mjs` still drops cultures by design (RD10's note): the see-the-result tour could say "translations: seen
  in the service only".

## For the laptop
1. Made-up sample only: `plan_layout` with `sample: true` writes the Gulf Retail sample; add a page with a table of its
   fields in Desktop and save; then `create_arabic_twin` on it with `terms` (RD10's 12 names) and `modelNames: true`;
   approve; write.
2. Open the sample project in Desktop, TMDL view, open "Gulf Retail AR - Arabic names.tmdl" in Notepad, copy, paste,
   Preview, Apply, save. Note: does TMDL view accept `cultureInfo` in createOrReplace without `linguisticMetadata`
   (RD10's stop point: if it refuses, nothing ships); the project's `cultures/` has 6 files and `model.tmdl` 6 refs;
   which keyword the saved files use (`cultureInfo` or `culture`); Desktop still shows English names (expected).
3. Run `check_model_health` and `read_model` on the saved project: the cultures read back (6), no file skipped.
4. **The owner's step (the service, never from a session):** publish the made-up sample to a test workspace; open the
   report with `?language=ar-AE`, then `?language=ar-KW`, then `?language=en-US`; note for each whether the fields read
   Arabic (the field list, a hover on a field) and the tables English; note whether the workspace needed a Premium or
   Fabric capacity; screenshot each; delete the published model.

## Lessons for the reviewer
- The twin's write rebuilds the plan with `memory: false` and compares digests: anything in the kept files must come
  only from pinned inputs (here, only `terms`).
- An `assets/js/` change needs its `?v=` stamp bumped wherever it is loaded, including inside other engines' JS
  (`check-min.mjs` names them; `npm run build:min` needs the root `npm ci` for terser).
