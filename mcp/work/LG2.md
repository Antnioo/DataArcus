## Summary
- **Approval:** the owner, 9 Nov, D-1109-02 ("3 yes", A-LG1-2) and 10 Nov, D-1110-05 ("2 yes"); D-1104-12 (one shared source).
- **Base:** `fix/0.3.3-lg2` from `origin/integration/0.3.3` (20ef003c). Push only it; never merge, no PR.
- **Scope:** measure every input error a write tool can return with lang "ar"; wire any that has an approved Arabic line;
  a new suite test-0.3.3-lg2 (+ its row in tests.json); CHANGELOG [Unreleased] (one line); WORK.md (one line); this note.
- **Expected checks:** the measurement below says WE1 (merged, d59fab0a) and D-1108-16 already cover every error that has an
  approved Arabic line, so the expected code change is none; lg2 is a pin (about 30 checks) that is green on the base, with a
  mutation proof that it goes red when the shared source is broken. `node scripts/check-modules.mjs --strict`.
- **Resume:** plan written, measuring done; next the suite, then CI.

## Plan
1. Measure (below), on 20ef003c, through the real server (stdio), each write tool with `lang: "ar"`, `"en"` and none.
2. Wire what has an approved line (expected: nothing left).
3. The suite pins the measured table; a recorded proof that it fails when `langGiven` or the Arabic frame is broken.
4. Drafts for the owner for every coded error that has no approved Arabic (D-1109-07), never shipped.

## Measured table (20ef003c)
| Error | Where it is said | Approved Arabic line in the read tools' source | Write tools with lang "ar" |
|---|---|---|---|
| schema refusal (wrong or missing input) | `inputErrorSaid`, `lib/tool-answer.mjs` (D-1108-16) | yes: the frame «خطأ في المدخلات ... صحّح المدخلات وأعد الاستدعاء» | Arabic frame, all 7 tools (the 3 with no lang input too: the call's raw `lang` decides) |
| MANY_MODELS (2+ models at one level) | `manyAr`, `lib/read-words.mjs` (AR4, D-1105-16) | yes | Arabic in plan_layout, generate_theme, add_gulf_calendar (WE1) |
| MANY_MODELS_NAMED | `wordOf` | no (English only, read tools too) | English |
| NO_MODEL_NAMED | `wordOf` | no | English |
| NO_MODEL_AT | `wordOf` | no | English |
| the tools' own checks (`throw new Error` / planProblems) | each tool | no (English in the read tools too) | English |
Counts of own checks in tools/: plan_layout 35 planProblems, create_report 11, approve_plan 6, create_arabic_twin 4,
add_gulf_calendar 4, generate_theme 2, check_model_health 2. approve_plan, create_report, create_arabic_twin take no `lang`
(a given one is refused as an unknown key, in the Arabic frame; the plan's own language is not an input of the call).

## For the owner
- Draft Arabic for the 3 coded errors without an approved line (D-1109-07; the model names and paths stay as they are):
  1. NO_MODEL_NAMED: «لا يوجد نموذج باسم "X" في مجلد العمل Y. أعطِ read_model أحد هذه المسارات، أو "." لمجلد العمل نفسه.»
  2. NO_MODEL_AT: «لا يوجد شيء في "X" داخل مجلد العمل Y. أعد استدعاء الأداة بأحد هذه المسارات (نسبةً إلى مجلد العمل)، أو "." لمجلد العمل نفسه.»
  3. MANY_MODELS_NAMED: «يوجد أكثر من نموذج في مجلد العمل باسم "X": a; b. أعطِ read_model مسار النموذج الذي تقصده.»
  Why: «نموذج» is Power BI's word; «أعطِ» and «النموذج الذي تقصده» are the approved AR4 words; «مجلد العمل» is plain in the Gulf and
  Egypt; «نسبةً إلى» is MSA and read one way; «يوجد/لا يوجد» over «هناك» (no filler). Ship only on his yes.
- One question: the tools' own checks (about 70 sentences, "Nothing was written: ...") have no Arabic at all, in the read tools
  either. Draft the standard opening «لم يُكتب شيء:» only on his go, then each sentence in a batch.
