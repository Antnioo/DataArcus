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
- **Resume:** DONE (2026-11-09T20:48Z). CI green: https://github.com/Antnioo/DataArcus/actions/runs/42693441891 on d725d9df19a070809b233c30f8552b275eeec453

## Plan
1. Measure the catch: the SDK's `validateToolInput` parses the raw arguments with the tool's schema and hands the
   handler the parsed object, where the default has filled `lang: "en"`. So the handler cannot tell "en" from absent.
2. Red test `test-0.3.3-we1.mjs` on the base.
3. One place (tool-answer.mjs): `guardInputErrors` marks the parsed arguments (a Symbol, not enumerable, never in an
   answer) when the raw arguments had their own `lang`; `langGiven(args)` returns that lang ("en" | "ar") or undefined.
   `safe(fn, { lang: 'given' })` hands it to the coded error words; `{ lang: true }` (the reading tools) unchanged.
4. The four write tools with a `lang` input pass `{ lang: 'given' }`. Area runs, mutation before and after (one
   mutant on the explicit check), CI.

## Before -> after
- Measured the catch on f3c1b7e1 (the brief's named cause, proved): the SDK's `validateToolInput` parses the raw
  arguments and hands the handler the parsed object; plan_layout's handler got `lang: "en"` for a call with no `lang`,
  so it could not tell "en" from absent. The raw arguments (what guardInputErrors already sees) still have no `lang`.
- plan_layout / add_gulf_calendar / generate_theme, folder "Models" with 2 English-named models, `lang: "ar"`:
  before: English ("\"Models\" holds 2 models at the same level: ...") -> after: read_model's own `lang: "ar"` answer,
  byte for byte («يحتوي "Models" على نموذجين في المستوى نفسه: ...»).
- The same three, Arabic-named folder «نماذج», `lang: "en"`: before: Arabic (the letter rule, since the default and an
  explicit "en" looked the same) -> after: English, as the reading tools.
- No `lang`: unchanged, byte for byte (English on "Models", Arabic on «نماذج»: the K checks compare with read_model).
- Red on f3c1b7e1 first: `test-0.3.3-we1.mjs` 6 of 19 failed (A x3, EA x3); after: PASS 19 checks.

## What changed
- `lib/tool-answer.mjs`: `langGiven(args)` (exported, next to safe): the call's lang ("en" | "ar") only when the call
  gave it, else undefined. `guardInputErrors` marks the parsed arguments with a non-enumerable Symbol when the raw
  arguments have their own `lang` (never serialised, never in an answer). `safe(fn, { lang: 'given' })` hands
  `langGiven(args)` to the coded error words; `{ lang: true }` (read_model, suggest_fields, check_model_health) unchanged.
- `tools/plan_layout.mjs`, `add_gulf_calendar.mjs`, `generate_theme.mjs`, `check_report.mjs`: `{ lang: 'given' }` on
  their safe() call, nothing else. create_report has no `lang` input: nothing added (checked: S2).
- `test-0.3.1-mutation.mjs`: one mutant `WE1-given` (langGiven ignores the mark), at the list's end (away from anchors).

## Tests run (after the last code commit 49e6948a)
- we1 PASS 19, lg1 PASS 12. The 11 pinned split suites (sp1, sp2, sp3, sp4, sp7, sp13, sp20, sp23, sp41, sp43, sp44)
  PASS, fixtures untouched. Mutation: `WE1-given` alone killed (`PASS  mutation  5 checks (1 mutants, all killed`).
- Areas (run-tests' own total lines): arabic + checker + model `61 suites passed`; report + safety `97 suites passed`;
  core `12 suites passed`. Lint exit 0. agent-memory, changelog-words, result-lines PASS.
- Mutation before (f3c1b7e1, a worktree): `PASS  mutation  244 checks (97 mutants, all killed, 45 guard suites)`;
  after: `PASS  mutation  247 checks (98 mutants, all killed, 46 guard suites)` (+1 mutant WE1-given, +1 guard we1).
- Suites that call the four tools: every suite in the report, safety, arabic, checker, model and core areas above
  (grep: plan_layout, generate_theme, add_gulf_calendar and check_report are called across most of them); the twin
  area (53) is left to CI (no twin file touched). No `agent` area exists in tests.json: the agent suites run in these areas.

## CHANGELOG line
- **The write tools answer in Arabic when asked to:** plan_layout, generate_theme and add_gulf_calendar given
  `lang: "ar"` say the several-models answer in the same approved Arabic as the reading tools; `lang: "en"` says it in
  English; without `lang` the folder's own letters decide, as before.

## Decisions I made
- Explicit `lang: "en"` now says English even on an Arabic-named folder (before: the letter rule, because the default
  and an explicit "en" looked the same). Same rule as the reading tools (LG1); the brief's "explicit en -> English".
- Told "given" from "absent" from the raw arguments at the protocol boundary (guardInputErrors), not by removing the
  schemas' defaults: the schemas, their `default` in tools/list and every recorded fixture stay as they are (S1 checks).
- A call that skips the server (a handler called in-process) has no mark: treated as absent (as today), never Arabic.
- check_report gets `{ lang: 'given' }` as briefed, but no coded error reaches its words (it catches loadModel): its
  answer is the same with ar, en and none (C check). Its "he" and "auto" are not passed (langGiven: en|ar only).
- mcp/WORK.md was at 3,196 of 3,200 characters: my line is folded into the integration line, which now names
  `integration/0.3.3` (was 0.3.2) and drops "the owner merges to main" (said in CLAUDE.md).
- The one mutant line went into test-0.3.1-mutation.mjs (LK1's file, as the brief allows): keep both sides at the merge.

## For the owner
none (no new Arabic: the only coded error with approved Arabic is the several-models sentence, D-1105-16; the other
three coded errors keep English for reading and write tools alike, waiting on LG1's drafts already with you).

## Risky changes
- What an answer returns: the error words of plan_layout, add_gulf_calendar and generate_theme now follow a given
  `lang` (no new data: the same models' list). safe() and guardInputErrors are shared by every tool: without
  `{ lang: 'given' }` nothing changes (all areas and the 11 pinned split suites pass unchanged). The mark is a
  non-enumerable Symbol on the parsed arguments: never serialised, never in an answer.

## For the laptop
none

## Seen, not in scope
- The "no working folder" error (safe()'s `fail(problem)`) is English for every tool, the reading tools too: no
  approved Arabic exists for it.
- mcp/docs/MODULES.md's tool-answer.mjs row could name `langGiven` (no new module; left for the row's owner).

## Lessons for the reviewer
- WORK.md sat 4 characters under its cap on the 0.3.3 base: the next builder cannot add a line without trimming one.
- No `agent` area in mcp/tests.json (the brief names one); I ran every area that holds the tools' suites.
