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
- **Got:** (after the work)
- **Resume:** the plan committed; next the red suite.

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
