## Summary
- **Approval:** the owner, 11 Nov, D-1111-17 ("go you have all night to finish everything we got so far also don't
  overlook the seen not in scope") and D-1111-16 ("go for your recommendations": IX2 then OX2; stage 3 not yet; the
  site page after IX2; the Arabic words later). Relayed by the hub, session_015Q77oNR7YVFznptSuZoZZ2.
- **Base:** `feat/0.3.3-ix2` from `origin/integration/0.3.3` at 274a3d40 (IX1 merged). Push only this branch; never
  merge, no PR.
- **Scope:** IX1's "Next stages" 2: `check_report` option `likeForLike: { year, country }`, section `likeForLike`
  beside `impactCheck`, read through `impact.mjs`'s one reading, capped; `CF` exported from
  `assets/js/health-confirm.js` (its .min.js and stamps) and IX1's `callsOf` removed; a calculation group's items read;
  IX1 "Seen" 5 (gulf-dates rows to 1460, only from a primary Umm al-Qura source) and 7 (the 60-character cut in
  `lacking`); TOOLS.md, PRIVACY.md, CHANGELOG, MODULES.md rows, tests.json's line (not the `affected` block). Not:
  stage 3, stage 4, the Arabic wording (drafts under "For the owner").
- **Expected checks:** new suite `ix2` (area checker), about 33 checks, red on the base first; ix1 64, hx1 59, hx2 43,
  sp27 25, fn1d 125 unchanged; tl1 51 with its saved tools/list shape given the one new property (said per test);
  tk1 15 with tools/list under its 61,000 cap (58,837 before); `node scripts/check-modules.mjs --strict` PASS;
  check-contracts, test-contracts, check-result-lines, check-agent-memory, check-min, test-site-config PASS; the
  website suites that load health-confirm.min.js (sp27, model-health, theme-generator, theme-logo) alone after
  build:min; lint exit 0; CI on the branch.
- **Resume:** PLAN pushed; next the code commit, then CI.

## The plan (written before the code, 2026-11-11)
1. **The lens.** `impact.mjs` gets `readOnModel(path, option)` (the report through the reading block and its own model
   through `loadModel`, refused when definition.pbir names no model folder) and `likeForLike(path, opts, read)`;
   `impactCheck` takes the same `read`. `check-report.mjs`'s reading step reads once when `againstModel` or
   `likeForLike` is given and hands the read to both. The section is `like-for-like.mjs`'s answer, with `unread` when
   a model or report file was not read fully; cut to `SECTION_MAX` (16,000) and, last, inside the answer's cap.
   With `lens: "arabic"` the option is refused (the lens runs instead of the checks).
2. **The schema.** `likeForLike: { year (integer 1900-2100), country (gulf-dates.js's weekend list: uae, ksa, kwt,
   qat, bhr, omn, shj) }`, both optional, strict; a year outside 2018-2030 is answered "not known", as IX1 does.
3. **One reader.** `health-confirm.js` exports `CF` (frozen) beside `pleaseConfirm`; `like-for-like.mjs` reads calls
   with `CF.lex` and `CF.calls`, dates with `CF.reference`; `callsOf` deleted. IX1's 64 checks are the proof nothing
   moved.
4. **Calculation groups.** Each item's DAX scanned; a visual reaches the items through the group's table node (the
   lineage puts it under the group's column, as a field or a filter). Rows `Table[Item]`, kind `calculation item`,
   no base (SELECTEDMEASURE), no Ramadan partner.
5. **Caps.** visuals 60 (`notListed`), measures 60 (`measuresNotListed`), lacking 60 (`lackingNotListed`), a visual's
   comparisons `WHY_MAX` 6 (`more`), the distances compared 4 (`calendarNotListed`).
6. **"Seen" 7.** `lacking` names through `shownName(name, NAME_OUT)`: whole to 200 characters, a longer one ends "…".
7. **"Seen" 5.** Rows 1452 (its Eids) to 1460 only from the Umm al-Qura calendar's own publication (ummulqura.org.sa,
   King Abdulaziz City for Science and Technology), each cited; a row I cannot read there is not added.

### Expected numbers (worked out from IX1's table and fixture before the code)
| # | check | expected |
|---|---|---|
| T1 | Souq Gulf as a .pbip, `likeForLike: { year: 2026 }` | 4 of 16 visuals, IX1's 2026 sentence word for word; 5 months a year back, then a month back; lacking [Cost Last Ramadan], [Units Last Ramadan]; 6 measures |
| T2-T3 | the UAE 2022; no year | 12 months and the weekend sentence; 41 of 144 months, no month listed |
| T4 | the section against the library on the same files (Oman 2026) | equal |
| O1 | with `againstModel` too | both sections; the model and report files opened as often as for `againstModel` alone |
| G1-G5 | a group "Time Intel" (Current, PY, PM): a matrix by its column; a page filter on it; no visual on it; through the server | 5 visuals (PY and PM on the matrix); 10 (the 8 of that page and the overview's 2); 4; 5 |
| N1-N2 | a 70-character base; a 250-character one | "<base> Last Ramadan" whole; cut at 200 with "…" |
| C1-C4 | 86 comparison measures; one visual with 80; 82 lacking; 404 visuals | 60 + 26 counted; 6 + 74; 4 distances + the rest; 60 + 22; under 40,000, never truncated |
| Q1-Q4 | a wrong year, an unknown country, an extra key, a fraction; no option; no model folder; with the Arabic lens | refused by the schema; no section; refused naming likeForLike; refused, said why |
| S1 | a canary in a comparison's DAX and a page filter | in no answer |
| tools/list | tk1's K4 cap 61,000 | under it; the size before and after said |
