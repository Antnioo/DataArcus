# AR4 (0.3.2): the "several models" message from the reader, in Arabic with the dual

## Summary
- **Approval:** the owner's brief AR4 (5 Nov); D-1105-15 (E1 round 5 fixes), D-1105-02 (dual for 2), D-1105-05 («نماذج» for 3 and up).
- **Base:** `fix/0.3.2-ar4` from `origin/integration/0.3.2`. Push only it; never merge, no PR.
- **Scope:** `lib/read-words.mjs` (the MANY_MODELS wording; the only place it is worded), new `test-0.3.2-ar4.mjs`
  (+ its row in `tests.json`), `CHANGELOG.md`, this note. WORK.md: one short line (3,056 of 3,200 characters now).
- **Chosen the way the MCP's check_report `auto` chooses:** the person's own words count. Arabic when the path the
  person gave, or a tied model folder, holds Arabic letters (`hasArabic`, the one answer). read_model has no `lang`
  input and none is added (a new input is a schema change on every reading tool; see "For the owner").
- **Expected checks:** new suite ar4: 12 checks (2, 3, 10, 11, 12 models in Arabic exactly; English unchanged for the
  same errors; English names with no Arabic letters stay English; MANY_MODELS_NAMED untouched); every other suite unchanged; lint 0.
- **Resume:** plan pushed; next the red test, then the change, then CHANGELOG, merge integration once, build:min, checks, tests.yml, wait.

## Before -> after (DRAFT for the owner: every new Arabic line)
- English, any count: `"Models" holds 2 models at the same level: A; B. Give read_model the path of the one you mean.` -> unchanged.
- Arabic, 2: DRAFT for the owner: «يحتوي "نماذج" على نموذجين في المستوى نفسه: A; B. أعطِ read_model مسار النموذج الذي تقصده.»
  (English: "X" holds 2 models at the same level: A; B. Give read_model the path of the one you mean.)
- Arabic, 3-10: «... على 3 نماذج في المستوى نفسه ...»; 11+: «... على 12 نماذج ...» (the website's form, AR2, D-1105-05).
