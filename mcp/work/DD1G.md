## Summary
- **Approval:** the brief "DD1G (0.3.2)" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1016-01
  (never 100 places), and "check which files are duplicate and one shop is older than the other" (4 Nov).
- **Base:** `feat/0.3.2-dd1g` from `origin/integration/0.3.2` at 240d179. Push only this branch; never merge, no PR.
- **Scope:** one question, "which model folder does this folder mean?", answered in one place:
  `assets/js/model-nearest.js` (pure dual module, the shape of mirror-policy.js). Given model folder paths and their
  separator: the nearest one, or the tied ones at the nearest depth (sorted). Not in this job: byName, links, B-326.
- **Callers:** model-discovery.mjs `nearestModel` (adapter: keeps its ReadError and message); model-import-browser.js
  `fromFolder` (throws MANY_MODELS with the tied paths before any file is read); theme-download-ui.js says it in
  English and Arabic. A deeper backup still counts in "others" and never wins.
- **Before -> after:** the site picked the alphabetically first of two side-by-side models silently; after, it refuses
  with both named, as the MCP does (the MCP's answers do not change; its message lists the tied ones sorted).
- **Test:** mcp/test-0.3.2-dd1g.mjs, suite dd1g: the MCP's nearestModel and the browser's fromFolder on >= 8 made-up
  folder lists, one answer for both. Red proof: the old browser sort back, it fails.
- **Ledger and map:** CONTRACTS.md family 1g ("One place" line, places say who reads it); MODULES.md new row.
  One CHANGELOG line under 0.3.2.
- **Expected checks:** dd1g passes; sp14 (fromFolder) every number as on the base; contracts check and probe: 1g one
  answer per input; check-modules --strict green; lint 0; every other suite as on the base.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/41902639619 on 08162dc8212d1737b424623cb960a08135580a17
- **State:** DONE (Linux and Windows; macOS runs where the reviewer merges). integration/0.3.2 did not move (240d179): no merge.
- **Resume:** none until the CI line below; then the reviewer reads and merges.

## Two answers -> one (made-up folder lists; the website before / the MCP / after, both)
| input | website before | MCP | after (both) |
|---|---|---|---|
| two side by side (A, B) | uses A | refuses, both named | refuses, both named |
| two in a project folder | uses p/A | refuses | refuses |
| names that differ by case (b, A) | uses A | refuses | refuses (A; b) |
| three at the top | uses A | refuses | refuses (A; B; C) |
| one at the top, one deeper (a backup) | uses the top one | uses the top one | uses the top one |
| none | NO_SEMANTIC_MODEL | none | none |

## Decisions I made
- The rule returns `{ path, tied, others }`: path is null on a tie; tied sorted by code unit (the old browser order).
  The MCP's message now lists the tied folders sorted (before: the walk's order); the code and the words are as before.
- model-discovery.mjs reads the rule with an ES import of the CommonJS file; test-0.3.2-sp42.mjs P2 pinned the
  imports of model-discovery.mjs to three, so I added the one pure import to its list (no count changed; it still
  proves "lists folders only"). See Risky changes.
- A model-nearest.min.js was made with terser by hand once (build:min only rebuilds files that have one); the stamp was
  written by `npm run build:min`, never typed (I put a placeholder first; the build replaced it).
- The probe gets the rule as a third place (`nearest`), so the 1g table has three places and one answer per input.
- The Arabic page text: a draft in the words of the English, listed below.

## For the owner
Approve this Arabic sentence (the page's message when a folder holds two or more models), word for word:
- English: "This folder holds N models at the same level: A; B. Choose the model's own folder."
- Arabic: "يحتوي هذا المجلد على N نماذج في المستوى نفسه: A; B. اختر مجلد النموذج نفسه."
(N is the number, A; B the models' paths; the paths stay in English letters.)

## Risky changes
- test-0.3.2-sp42.mjs P2: its allowed imports for model-discovery.mjs now include `../../assets/js/model-nearest.js`
  (a pure file). No number moved (22 checks as before). The reviewer may prefer another way to carry the rule in.
- The site's behaviour changes on purpose: two models side by side now refuse where the page used one.

## Seen, not in scope
- model-discovery.mjs's header comment lists "no file opened"; it still holds (the new import is pure).
- 1c's ledger family still lists four places after DD1C; the ledger there is the reviewer's.

## Lessons for the reviewer
- A test that pins a module's exact imports (sp42 P2) blocks adding a shared pure module; a brief that adds a shared
  file to an adapter should name that test.
- build:min does not make a .min.js for a new source file: terser by hand once, then the build writes the stamp.
