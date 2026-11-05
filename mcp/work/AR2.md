# AR2 (0.3.2): the two-model message in Arabic takes the dual

## Summary
- **Approval:** the owner's brief AR2 (5 Nov); D-1105-05 (3 models and up keep «نماذج»); D-1105-02 (A-DD1G-1, the dual for 2).
- **Base:** `fix/0.3.2-ar2` from `origin/integration/0.3.2`. Push only it; never merge, no PR.
- **Scope:** `assets/js/theme-download-ui.js` (the `many` message), its .min.js, the stamped pages, `mcp/test-0.3.2-dd1g.mjs`,
  CHANGELOG, this note (WORK.md untouched: at its cap). No other Arabic text, no other test's number.
- **Expected checks:** dd1g 35 -> 39 (U2: N = 2, 3, 12 and the English sentence, pinned exactly); every other suite
  unchanged; lint 0; check-agent-memory, changelog-words, site config pass.
- **Resume:** all commits done; merge integration if moved, `npm run build:min`, checks, tests.yml, wait.

CI green: https://github.com/Antnioo/DataArcus/actions/runs/41959414731 on 853080fd

## Before -> after
- N = 2: «يحتوي هذا المجلد على 2 نماذج في المستوى نفسه: A; B. اختر مجلد النموذج نفسه.» -> «يحتوي هذا المجلد على نموذجين في المستوى نفسه: A; B. اختر مجلد النموذج نفسه.»
- N = 3: «... على 3 نماذج في المستوى نفسه: A; B; C. ...» -> unchanged.
- N = 12: «... على 12 نماذج في المستوى نفسه: A; ...; L. ...» -> unchanged (word for word, as D-1105-05 says).
- English: unchanged.

## Decisions I made
- The dual is chosen inline in the one template (`length === 2`), so the sentences differ only in the count word.
- The test reads the template from the page source and runs it, so it pins the shipped sentence, not a copy.
- `npm ci` was needed in the fresh clone to run the build (no file of the repo changed by it).

## For the owner
none

## Risky changes
none

## Seen, not in scope
- «12 نماذج» is the owner's wording (D-1105-05); Arabic grammar usually asks for «نموذجًا» after 11, not changed here.
