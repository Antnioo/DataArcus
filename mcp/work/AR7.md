## Summary
- **Approval:** the owner, 12 Nov, D-1112-05 ("... if it is the same syntax google and microsoft are using then approve
  it don't wait for me") and D-1112-06 ("okk i agree" to this job), relayed by the reviewer's hub
  (session_015Q77oNR7YVFznptSuZoZZ2). D-1109-07, D-1027-03, D-1104-12 bind it.
- **Base:** `feat/0.3.3-ar7` from `origin/integration/0.3.3` at 26cfb66f. Push only this branch; never merge, no PR.
- **Scope:** `assets/data/arabic-report-words.json` (the one term sheet: Google's word, both sources, the approval per
  concept; new concepts), `mcp/lib/arabic-terms.mjs` (the existing check, extended: the key named, the glossary rendered),
  `content/ARABIC-GLOSSARY.md` (new, rendered from the sheet), `content/ARABIC-STYLE.md` (one section),
  `mcp/work/AR7-ARABIC.md` (the 37 items, one row each), a new suite `ar7` (`mcp/tests.json`, area arabic), one
  count formatter in the shared library if both sources back it, the APPROVED lines behind each tool's own
  `lang: "ar"` path (AU1's reasons in `assets/js/tmdl-model.js` and the two-models sentence, others as the table
  decides), MODULES.md and CONTRACTS.md rows, CHANGELOG, `mcp/WORK.md`, this note. Not: tool descriptions,
  `mcp/TOOLS.md`, R-19's files.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; ar7 red on 26cfb66f first; `npm test -- arabic`
  (and model, checker, report, core where a shipped line moves an answer); the website suites of each changed asset;
  build:min; lint 0; check-result-lines, changelog-words, check-agent-memory PASS; CI green.
- **Resume:** plan pushed (2026-11-12T21:20Z); next: read both sources per term, write the table, then the check.

## Plan (written before any work)
1. Sources first, measured: for each key term of the 37 items, fetch Microsoft's Arabic page (learn.microsoft.com/ar-sa)
   and Google's Arabic page (support.google.com ?hl=ar, cloud.google.com ?hl=ar, CLDR for plural forms) and record the
   word each uses, the URL and the date read. A term passes when both use it, or when it is already the owner's own
   (ARABIC-STYLE.md rule 2 and 5, WORK.md's E2 list). A sentence passes when every key term passes and it follows the
   pattern of their own messages; otherwise HELD, both sources side by side.
2. One source for terms: the existing sheet (`assets/data/arabic-report-words.json` `concepts`, read by
   `mcp/lib/arabic-terms.mjs`, checked by `test-0.3.1-arabic-terms` and `scripts/test-arabic-terms.mjs`). No second
   list (D-1104-12): the sheet gains `google`, `googleSource`, `read`, `approval`; the glossary file is rendered from it
   and a check fails when the file and the sheet differ.
3. The check names the file, the key and the word (today: the file, the line and the word); planted wrong word seen red.
4. Ship only APPROVED lines, each with a test red on the base; HELD lines stay English.
5. Counts: one formatter on `Intl.PluralRules('ar')` only if Microsoft and Google both write Arabic counts with CLDR's
   six forms.

## Expected numbers (before the work)
- 37 rows in `AR7-ARABIC.md`, one per I- id of the brief; every row APPROVED or HELD, none blank.
- Every concept of the sheet (30 today) keeps its Arabic; `test-0.3.1-arabic-terms` keeps passing with more checks
  (one AT-1 and at most one AT-2/AT-3 check per new concept); no existing expected number changed by hand.
- The verdict counts are measured, not guessed: written under "Before -> after" when the sources are read.
