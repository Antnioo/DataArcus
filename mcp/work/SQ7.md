# SQ7 (0.3.1 night, Seen batch 7): calendar and health

## Summary
- **Approval:** the owner answered "Yes, fix now" to every open "Seen, not in scope" item (26 Oct); the reviewer's brief
  "Go on SQ7". Batch "SQ7: calendar and health" in [SEEN-QUEUE.md](SEEN-QUEUE.md).
- **Scope:** `assets/js/calendar-generator.js`, `assets/js/gulf-health.js` (GC-S4's cause: the analyzer takes only a
  country), `assets/js/model-health.js` (+ their `.min.js`, new `?v=` on both copies of each page that loads a changed
  one), `mcp/lib/gulf-calendar.mjs`, `mcp/tools/add_gulf_calendar.mjs`, `mcp/tools/check_model_health.mjs`,
  `mcp/TOOLS.md` (its two sections only); a new suite `mcp/test-0.3.1-sq7.mjs` (one line in `tests.json`); the
  Health Check card's count check in `scripts/tests/model-health.mjs` (the item's own number); the seven Status cells
  in SEEN-QUEUE.md. Not SQ8's (share images, theme generator, licensing, practice exams) or SQ10's files.
- **Base:** `fix/0.3.1-sq7` from `origin/integration/0.3.1` (26f7fbe). Push only this branch; the reviewer merges.
- **Items:** C1-S1, GC-S5, GC-S4, 0.2.9-reader-S14, audit-6-mcp-tools-S3, E-S2, WORK-2026-10-05-09-S8. All seven
  confirmed true on 26f7fbe (below); none obsolete.
- **Expected checks:** the new suite about 25 checks, about 18 red before the fixes; model-health's card check red
  (its «1 مرئيات») then PASS; `npm test -- model`, `scripts/tests/run-all.mjs` (gulf-calendar's baseline unchanged:
  its saved settings have no `arabicNames`), site config, arabic terms, check-agent-memory PASS;
  `npm test -- --keep-going` 81 -> 82 suites, all PASS.
- **Invariants:** nothing written without a plan (no new write); metadata only (the new answers are names and
  options); every Gulf fact sourced (Sharjah's 1 January 2022 change: `DATES-SOURCES.md`, Sharjah Executive Council).
- **Got:** (after the run)
- **Resume:** (after the run)

## The items, confirmed (26f7fbe)
1. **C1-S1** `arabicOn` (calendar-generator.js:73) is false when `lang` is "ar": an Arabic table keeps "Q1",
   "2025 Q1", "FY2025", "FQ1" and true/false flags with no Arabic label beside them.
2. **GC-S5** `build` (calendar-generator.js:126) writes "Is After UAE Weekend Change" for `weekend === 'uae'` only;
   Sharjah's rule (gulf-dates.js `weekends.shj`) also changed on 2022-01-01.
3. **GC-S4** `addGulfCalendar` (gulf-calendar.mjs:119) self-checks with `Gulf.analyze(..., { country })`: a `shj`
   table is compared with the federal weekend, so every Sunday from 2022 is a GC_WEEKEND day; check_model_health
   has no way to say Sharjah either.
4. **0.2.9-reader-S14** gulf-calendar.mjs:62 and :85 unwrap `m.tmsl` themselves; model.mjs has `modelOf` for it.
5. **audit-6-mcp-tools-S3** the plan path passes `scriptNameNow` (names a file, writes nothing) as `env.writeScript`;
   the JSDoc (gulf-calendar.mjs:57) says nothing of it.
6. **E-S2** the card's size line (model-health.js:712) has one Arabic word per kind: «1 مرئيات», «11 جداول».
7. **WORK-2026-10-05-09-S8** check_model_health's description (and TOOLS.md) never says the DAX is not parsed: a
   measure whose DAX is broken is not found by the check (the engine tokenizes DAX for references only).

## Plan (before any edit)
1. This note, pushed first.
2. Red first: `mcp/test-0.3.1-sq7.mjs` (in process, made-up names, temp working folders):
   - C1-S1: `Cal.build({ lang: 'ar', arabicNames: true })` has Quarter (Arabic), Year Quarter (Arabic), Fiscal Year
     (Arabic), Fiscal Quarter (Arabic), Is Weekend (Arabic), Is Working Day (Arabic), Is Ramadan (Arabic) and the Eid
     twins, built by arabic-calendar.js; no Month/Day/Hijri name twin (names are Arabic already); `arabicNames` false
     and the English table unchanged (pins).
   - GC-S5: a `shj` table has "Is After Sharjah Weekend Change" from the rule's own sourced date (2022-01-01); the UAE's
     column unchanged; another country none.
   - GC-S4: `Gulf.analyze(shj table, { country: 'uae', weekend: 'shj' })` has no GC_WEEKEND; a federal (uae) table
     checked with `weekend: 'shj'` has it, naming Sharjah's government; add_gulf_calendar's `selfCheck` for a `shj`
     table has no GC_WEEKEND; check_model_health takes `weekend: 'shj'`, and its `fixes.addGulfCalendar` passes it on.
   - S14: gulf-calendar.mjs reads the model through `modelOf` (no `m.tmsl.model ||` left), behaviour pinned.
   - audit-6-S3: the env key says what it is on both paths (renamed `scriptFile`, documented in the JSDoc).
   - E-S2: an Arabic count helper in model-health.js gives 1 «جدول واحد», 2 «جدولان», 3-10 «N جداول», 11-99
     «N جدولًا», 100 «100 جدول» (same for measures «مقياس», visuals «مرئي»: E2's singular); model-health.mjs's card
     check: «مرئي واحد».
   - S8: the description and TOOLS.md say "DAX is not parsed: a measure whose DAX is broken is not found".
3. Fixes at the cause, then `npm run build:min`, `?v=` stamps, csp, ar-pages, the suites, sitemap-lastmod.
