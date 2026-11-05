# LG1 (0.3.2): an optional `lang` on the reading tools, so the person's language decides, not the folder names

## Summary
- **Approval:** the owner's D-1105-16 (5 Nov) "Agree on suggested arabic and yes": an optional `lang` on the reading
  tools (A-AR4-1, AR4's "For the owner"); the several-models Arabic as AR4 wrote it (reused exactly).
- **Base:** `fix/0.3.2-lg1` from `origin/integration/0.3.2` (ca3a1b73). Push only it; never merge, no PR.
- **Scope:** `lib/tool-inputs.mjs` (one shared `readLangInput`), `lib/read-words.mjs` (`wordOf(e, lang)`),
  `lib/tool-answer.mjs` (`safe(fn, { lang })` hands the call's `lang` to the words), `tools/read_model.mjs`,
  `tools/check_model_health.mjs`, `tools/suggest_fields.mjs` (its own `lang` also says the words), new
  `test-0.3.2-lg1.mjs` (+ its row in `tests.json`), `CHANGELOG.md`, this note.
- **Which reading tools reach read-words.mjs and can say MANY_MODELS / MANY_MODELS_NAMED / NO_MODEL_*:** every tool's
  handler is wrapped in `safe()` (tool-answer.mjs), whose `fail()` calls `wordOf`. The codes come only from
  `lib/model-discovery.mjs` through `loadModel`. Reading tools that call `loadModel` uncaught: `read_model` (schema
  today: path, tables), `suggest_fields` (path, kpis, focus, tables, lang en|ar optional = the report's language,
  columnStats), `check_model_health` (path, maxItems, weekStart, country, weekend, asOf, planId, answers,
  forgetAnswers, only, columnTypes). `read_report` (path, pages, format, from) never calls `loadModel`: it cannot say
  these codes, so it gets no `lang` (an input that changes nothing would mislead). `check_report` catches its
  `loadModel` errors (tables = null): never said. The write tools (plan_layout, generate_theme, create_report,
  add_gulf_calendar) already take `lang` with default "en": left as they are (see "Seen, not in scope").
- **Expected checks:** new suite lg1: 12 checks through the real server (stdio), E1's input (L-1105-09): a folder
  "Models" with 2, then 3 English-named made-up models: read_model, suggest_fields, check_model_health with
  `lang: "ar"` say AR4's Arabic exactly («نموذجين», «3 نماذج»); read_model without lang: English as today (2 and 3);
  `lang: "en"` on an Arabic-named folder («نماذج»): English; without lang on it: Arabic (AR4's letter rule kept);
  the three schemas take `lang` en|ar optional and read_report's does not. Red first on the base: 7 of 12 fail
  (the six `lang: "ar"`/`"en"` answers and the schema check; the strict inputs refuse an unknown `lang`).
  ar4 stays 10; every other suite unchanged; sp42 and the pinned fixtures unchanged; lint 0.
- **Resume:** plan pushed; next the red test, then the change, CHANGELOG, merge integration once, area runs, tests.yml, wait.

## Plan
1. Red test `test-0.3.2-lg1.mjs` on the base. 2. `readLangInput` in tool-inputs.mjs (optional, no default: absent
keeps AR4's letter rule); `wordOf(e, lang)`: "ar" says AR4's Arabic for MANY_MODELS, "en" the English, absent the
letter rule. 3. `safe(fn, { lang: true })` only on the three tools (a write tool's default "en" would turn the letter
rule off). 4. Drafts for the other codes below, not in code.
