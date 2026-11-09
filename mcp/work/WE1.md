# WE1 (0.3.3): the write tools say their coded errors in Arabic when called with lang "ar" explicitly (B-419, A-LG1-2)

## Summary
- **Approval:** the owner, 9 Nov, D-1109-02 ("3 yes"), answering A-LG1-2: the write tools given `lang: "ar"`
  explicitly also say the coded errors in Arabic. No new Arabic: only the wording already approved (AR4's
  several-models sentence, D-1105-16; the input-error sentence, D-1108-16).
- **Base:** `fix/0.3.3-we1` from `origin/integration/0.3.3` (f3c1b7e1). Push only it; never merge, no PR.
- **Scope:** `lib/tool-answer.mjs` (one helper `langGiven` next to `safe`; `guardInputErrors` marks a call whose raw
  arguments hold `lang`), `tools/plan_layout.mjs`, `tools/add_gulf_calendar.mjs`, `tools/generate_theme.mjs`,
  `tools/check_report.mjs` (the safe() call only), new `test-0.3.3-we1.mjs` (+ its row in `tests.json`),
  `CHANGELOG.md` [Unreleased] (one line), `WORK.md` (one line), this note. create_report has no `lang` input: nothing added.
- **Expected checks:** new suite we1 about 18 checks through the real server (stdio), made-up models in a temp folder:
  per write tool (plan_layout, add_gulf_calendar, generate_theme) on a folder "Models" with 2 English-named models:
  explicit ar = read_model's own `lang: "ar"` answer (compared, never retyped), explicit en = English, absent = English;
  on an Arabic-named folder «نماذج»: explicit en = English, absent = Arabic (AR4's letter rule, byte for byte as
  read_model without lang). check_report: no coded error reaches it (it catches loadModel): ar / en / absent answers
  identical. Schemas unchanged (defaults "en"/"auto" kept), create_report has no lang. Expected red on f3c1b7e1: 6
  (the 3 explicit-ar and the 3 explicit-en-on-Arabic-names). Every other suite unchanged; lg1 12, ar4 10, rv1 as before.
- **Resume:** plan pushed; next: the red test.

## Plan
1. Measure the catch: the SDK's `validateToolInput` parses the raw arguments with the tool's schema and hands the
   handler the parsed object, where the default has filled `lang: "en"`. So the handler cannot tell "en" from absent.
2. Red test `test-0.3.3-we1.mjs` on the base.
3. One place (tool-answer.mjs): `guardInputErrors` marks the parsed arguments (a Symbol, not enumerable, never in an
   answer) when the raw arguments had their own `lang`; `langGiven(args)` returns that lang ("en" | "ar") or undefined.
   `safe(fn, { lang: 'given' })` hands it to the coded error words; `{ lang: true }` (the reading tools) unchanged.
4. The four write tools with a `lang` input pass `{ lang: 'given' }`. Area runs, mutation before and after (one
   mutant on the explicit check), CI.
