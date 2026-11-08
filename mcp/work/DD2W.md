## Summary
- **Approval:** the brief "DD2W (0.3.2): one toast and one copy helper for the website pages (Phase 2: toast, copy
  fallback)" (8 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-15 (the reviewer's DD1 plan, Phase 2).
- **Base:** `feat/0.3.2-dd2w` from `origin/integration/0.3.2` at 5cf96356 (BF2 in). Push only this branch; never merge, no PR.
- **Scope:** CONTRACTS.md "Equal copies, not probed": toast and copy fallback. One shared browser module
  `assets/js/page-toast.js` (`window.DAPageToast`, CommonJS in Node; the shape of html-escape.js): `toast(msg, { ms, el, cls })`,
  `boxToast(id, className)`, `copyText(text, node, { done, selected, toast })`. Every place keeps its local name as a
  one-line alias; every message stays where it is, as typed. Not in this job: health-view's textarea copy (a different
  question: named in "Not one question"), the health worker's address and the area labels (Phase 3), any wording, BF1, mcp/.
- **Plan, one commit each:** 1 this note; 2 the module, its .min.js, website suite dd2w (a fake document; plus each page
  that loads a place), its MODULES.md row; 3 the four `#toast` pages (calendar 1800, measure builder 1800, theme
  generator 1800, SVG KPI 2200), page-toast.min.js before each page script, stamps, ar-pages; 4 the four select
  fallbacks (calendar, measure builder, SVG KPI, theme-download-ui) read `copyText`; 5 exam-view (2200, dpToast) and
  health-view (1800, mhToast) through `boxToast` if the box's markup stays byte-identical (else the reason here),
  CONTRACTS.md rows, check-contracts. Then merge integration once, build:min, sitemap, every check, CI, wait.
- **Copies before -> after:** toast 6 -> 1 (4 by opacity on `#toast`, 2 boxes by the class `show`: `cls` names it);
  select fallback 4 -> 1. Same-shape (git grep `selectNodeContents` and `clearTimeout(toast` in assets/js, no .min.js):
  4 and 4 files -> page-toast.js only.
- **Answers that change:** none (every message, time, element and class as today).
- **Expected checks:** dd2w new (got 30 after step 2, 130 after step 5; red on 5cf96356 first: no page-toast.js);
  check-contracts 715 -> 717 (one "Not one question" place);
  the pinned split tests (sp5 sp7 sp8 sp10 sp12 sp13 sp14 sp16 sp28 sp30 sp39 sp43, scripts sp12 sp25 sp31-sp34 sp36)
  unchanged except a guard that pins a requires list, allowed on purpose and said per test; website suites tools, dax,
  theme-generator, theme-generator-lab, svg-kpi, sp25, sp31, pbip, model-health, gulf-calendar green; lint 0.
- **Red proof (not committed):** `clearTimeout(timers.get(t));` taken out of page-toast.js (and its .min.js rebuilt):
  dd2w FAIL, 4 of its then 30 checks: T3 and T6, source and min; restored.
CI green: https://github.com/Antnioo/DataArcus/actions/runs/42502343919 on 47346f74247c3f663d53514b4e5238d1c7f25808
- **State:** DONE 2026-11-08T17:09Z (Linux and Windows; macOS runs where the reviewer merges).
- **Resume:** none; the reviewer reads and merges.

## Copies before -> after (each place)
| place | before | after |
|---|---|---|
| `calendar-generator.js` `toast` | its own body, `#toast`, 1800 ms | `window.DAPageToast.toast(msg, { ms: 1800 })` |
| `measure-builder.js` `toast` | the same | the same, 1800 |
| `theme-generator.js` `toast` | the same | the same, 1800 |
| `svg-kpi-designer.js` `toast` | the same, 2200 ms | the same, 2200 |
| `exam-view.js` `toast` (in mount) | makes `#dpToast` (dp-toast), class show, 2200 ms | `PT.toast(msg, { el: PT.boxToast('dpToast', 'dp-toast'), cls: 'show', ms: 2200 })` |
| `health-view.js` `toast` (in create) | makes `#mhToast` (mh-toast), class show, 1800 ms | the same with mhToast, mh-toast, 1800 |
| calendar, measure builder, SVG KPI, theme-download-ui `fallback` | each its own select-the-text | `copyText` alias -> `DAPageToast.copyText(text, node, { done, selected, toast })` |
| `health-view.js` `fallback` (in copy) | a textarea and execCommand | unchanged; CONTRACTS.md "Not one question" |

Same-shape (`git grep -n "selectNodeContents\|clearTimeout(toast\|clearTimeout(tt\|clearTimeout(toastT" -- 'assets/js/*.js' ':!*.min.js'`):
8 lines in 6 files -> 1 (page-toast.js). Loaded first: page-toast.min.js before calendar-generator (2 pages),
measure-builder (2), theme-download-ui (3 theme pages), svg-kpi-designer (2), exam-view (4), health-view (2): dd2w L1.

## Tests before -> after
- dd2w (website, shard 3): new, 130 checks (U 30 source + min; L1 21 page tags; X 10 the boxes against the base's code
  in a real page; P 72: 4 pages x en, ar x clipboard ok, refused, none).
- Website suites, PASS here (their base numbers not re-run; no expected number changed): tools 399, model-health 255, theme-generator 922,
  theme-generator-lab 922, pbip 111, dax 51, svg-kpi 854, gulf-calendar 916, sp25 22, sp31 17, sp12 3, sp32 39,
  sp33 34, sp34 18, sp36 18.
- MCP tests that name a file I touched (git grep), and the brief's list: 25 suites, each the same PASS line on the
  base (worktree at 5cf96356) and here (sp10 113, sp30 21, sp8 19, ...): no guard test needed the new file allowed.
- check-contracts 715 -> 717; check-min 139 files; stamps 1240; test-site-config, check-agent-memory, result-lines,
  literal-requires green; lint 0. No mutation suite touched (mcp/ unchanged).

## CHANGELOG line
none: nothing a person sees changes (every message, time, element and class as before; dd2w X1-X3, P1-P3).

## Decisions I made
- `toast` takes a third option `cls` (the brief named `{ ms, el }`): the two boxes are shown by the class `show`, not
  by opacity; without `cls` their CSS transition and markup would change (a style attribute). With it, the markup is
  byte for byte the base's (X1-X3), so both boxes moved (6 -> 1, not 4 -> 1).
- `boxToast(id, className)` takes the class too (dp-toast, mh-toast): the ids and classes stay in each page.
- The copy places' local name is `copyText` (a one-line alias, the same text in all four: CONTRACTS.md "same text:
  yes" pins it); the old name `fallback` lives on only in health-view (Not one question).
- Every alias reads `window.DAPageToast` when called, not when the script loads: theme-download-ui.js is required in
  Node by tests and mounts there without a page.
- exam-view.js and health-view.js take the module like html-escape.js (require in Node, the page's global in the page).
- The messages are passed as `L(en, ar)` at the click, not when the clipboard answers (a microtask later): the same text.
- The tag sits right before the place's script (before theme-download-ui on the theme pages).

## For the owner
none.

## Risky changes
- A page whose script runs before page-toast.min.js would throw at its first toast: every page that loads a place is
  pinned by dd2w L1 and was opened by its website suite. No security policy, write, network or approval change.

## For the laptop
nothing (no Desktop output changes).

## Seen, not in scope
- `node scripts/check-modules.mjs --strict` fails on the base too: MODULES.md build-usage.js's "used by" names
  build-page.js, which does not load it (BF2).
- `scripts/check-exam-outline.mjs` reads Microsoft's study guide over the network and rewrites
  assets/data/dp600-outline.json when it cannot; I put the file back.
- Other copies without the select fallback (svg-kpi-designer's share link, theme-download-ui's CSV copy): one message
  on a refused clipboard; not in the ledger's rows, left.

## Lessons for the reviewer
- `npm run build:min` makes no .min.js for a new file (check-min reads `git ls-files "*.min.js"`): the first one is
  `npx terser <file> -c -m -o <file>.min.js`, then `git add`, then build:min writes its stamps.
- A selection of a hidden box (the theme generator's #json) reads "" from `getSelection().toString()`; the range's
  own toString holds the text.
