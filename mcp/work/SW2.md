# SW2 (0.3.4): job sweep, six small items (D-1112-03)

## Summary
- **Approval:** the owner, 12 Nov, D-1112-03 "For wf1 1 to 5 yes" (WF1-DESIGN.md section 2), relayed by the reviewer's brief.
- **Base:** `fix/0.3.4-sw2` from `origin/integration/0.3.4` at 87fd7896. Push only this branch; never merge, no PR.
- **Scope:** only the files the six items name and their tests: mcp/work/IX2.md, OX1.md, TF1.md, AR7.md; scripts/tests/run-all.mjs; scripts/check-modules.mjs (+ scripts/test-modules.mjs); the Gulf like-for-like page (tools/gulf-like-for-like.html, assets/js/gulf-like-for-like.js and its .min.js) and its suite.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; `node scripts/test-modules.mjs`; `node scripts/tests/run-all.mjs gulf-like-for-like` (alone); csp, ar-pages, sitemap-lastmod, test-site-config; lint.
- **Resume:** all six items done and pushed; only the CI line is left (see "CI").

## Plan (written before the work)
1. I-1113-04: IX2.md draft «مرئية» -> «مرئي». A note, no code: red = grep finds «مرئية» on 87fd7896.
2. I-1113-05: OX1.md's For the owner 3 points to OX2's table as the one draft (OX2 gave its reasons); OX1's examples dropped.
3. I-1113-25: run-all.mjs honours `--list` (prints the suites, exit 0) and refuses an unknown `--flag` (exit 2); check-modules says `not a file: <name>` with the fix when a "used by" cell names a function. Red first in scripts/test-modules.mjs and a run-all check.
4. I-1115-01 (AUD-076): the Year select offers only years that can answer (RANGE.first+1 to RANGE.last: 2019 to 2030, 13 options -> 12), and the unknown verdict does not say "yet". Test red first.
5. I-1115-02 (AUD-077): at 390 px the overview's last column ("like for like") is wholly inside its box. Test red first on the page.
6. I-1115-05 (TF1 note line): measure first (read each Learn page in Arabic); an item no longer true says "not so on <sha>".
Expected numbers are filled in as measured.

## Before -> after (written 2026-11-19T01:55Z)
1. I-1113-04, commit 6dd79c40: IX2.md's draft «لا تُحسب مقارنة أو مرئية فيها» -> «... أو مرئي فيها» (the sheet's singular). A note, no code: red = `grep -c مرئية mcp/work/IX2.md` was 1 on 87fd7896, 0 now.
2. I-1113-05, e806db01: OX1.md "For the owner" 3 no longer carries its own Arabic examples; it points to OX2.md's table as the one draft (OX2 already gave the reasons each OX1 word reads two ways).
3. I-1113-25, 587da7cd: `run-all.mjs --list` did not list: it ran every suite. Now it prints the 51 names and exits 0; any other `--option` exits 2 "Unknown option". `check-modules.mjs` says `not a file` with the fix for a used-by name that is not a file name (a function). Red on 87fd7896 first: test-modules 1 new check (the old text said "not a module, server.mjs or a page"), results-adapter 1 new check (`--list` timed out at 20 s: it started the browser and every suite). test-modules 11 -> 12, results-adapter 45 -> 46.
4. I-1115-01 (AUD-076), 9c20257f: the Year list was 2018 to 2032 (15), 2018, 2031 and 2032 never answer; now 2019 to 2030 (12), the table's first year + 1 to its last. The not-known verdict ends "cannot be compared." (was "... cannot be compared yet."). The two pages' tests that picked 2031 (B3, L1) add that option first, on purpose: they test the not-known path, now unreachable by the list. gulf-like-for-like now 116 checks (the red run on 87fd7896's page and script: the Y1 and O1 checks failed, 5 messages).
5. I-1115-02 (AUD-077): at 390 px the year overview's table was 380 px in a 324 px box: the last column cut. Now the table cells wrap at 575 px and below: 324 px in 324 px. Red first: "the last column ends 56.1 px past the box". gulf-like-for-like 116 checks. Still true at 360 px (6 px of scroll) and 320 px (46 px): the owner's report named 390; not changed.
6. I-1115-05 (TF1 "Seen"): measured 2026-11-19 by curl (html lang, the word in the body): the Learn pages of table, row, semanticmodel (8 uses) and project («لمشروعك») serve ar-sa with the word: **not so on 87fd7896 for table, row, field (1 use), semanticmodel, project**: no change. English bodies (lang en-us, 0 uses): the Learn pages of tooltip, datetable, dashboard, column, bookmark (both), drill (both), legend. Changed: bookmark -> support.microsoft.com/ar-sa/word/add-or-delete-bookmarks-in-a-word-document-or-outlook-message (ar-SA, «إشارة مرجعية» 15); drill -> .../excel/drill-into-pivottable-data (ar-SA, «التنقل لأسفل» 22); dashboard -> .../visio/add-visio-visuals-to-power-bi-reports (ar-SA, «لوحة معلومات» 1); column and legend lose the Learn page and keep their Support page. New check tf1 G1b, red on 87fd7896 first, tf1 33 -> 34. ARABIC-GLOSSARY.md rendered (arabic-glossary --write). No term, approval or Arabic word changed.

## CHANGELOG line
none (the glossary's links and a website page's layout; no tool answer changes). The page change: no CHANGELOG line needed (the website is not in mcp/CHANGELOG.md).

## Decisions I made
- Items 4 and 5 live on the Gulf like-for-like page: the audit file (business/audit/2026-11-13.md) is in the engine, not here; I read each finding from its one line in the brief and reproduced it first (the page script and a 390 px browser).
- Item 4: dropped "yet" rather than reword: a past year is not "not yet".
- Item 5: wrapping, not a smaller font, so it fits with no scrolling at 390.
- Item 6: only the sources that are measured English were replaced; tooltip and datetable have no Arabic Microsoft page I found (a search of support.microsoft.com ar-sa): left as they were, listed below. Power BI's own docs under /ar-sa are English (7 pages tried).
- Items 1 and 2 are notes, so their "red" is a grep.

## For the owner
none

## For the reviewer
- I-1113-04: 6dd79c40. I-1113-05: e806db01. I-1113-25: 587da7cd. I-1115-01 and I-1115-02: the two "SW2 I-1115-0x" commits (git log). I-1115-05: the "SW2 I-1115-05" commit; table, row, field, semanticmodel, project "not so on 87fd7896".
- No merge of origin/integration/0.3.4 was needed (it had not moved from 87fd7896, R-33).
- New requires: none. Build: `npm run -s build:min` (gulf-like-for-like.min.js, new ?v=108aa8ccdc36 on the page), csp --write (the page's style hash), ar-pages, sitemap-lastmod: nothing else changed. The page is held in English: no /ar/ copy.
- Reading of the one list: arabic-names suite PASS 14, arabic area 21 suites passed, tools 417, lang-switcher 1442 PASS.

## Risky changes
none

## For the laptop
none

## Seen, not in scope
- The page's overview still scrolls 6 px at 360 px and 46 px at 320 px | route: backlog | size: S | why: AUD-077 named 390
- Tooltip and datetable cite only Learn pages with English bodies: no Arabic Microsoft page found | route: job | size: S | why: both are the owner's own terms; a source search with the owner's list of Office products
- The audit reports are in the engine repo, not here | route: drop | size: S | why: a brief for them should quote the finding in full

## Lessons for the reviewer
- A brief that sends a builder to a file that lives elsewhere (the audit) should paste the finding.
- Learn's Arabic body varies by page: the same TF1 line ("all serve English") was half true four days later; a re-read before a fix is worth it.
