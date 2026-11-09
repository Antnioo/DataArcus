# FN1B (0.3.2): three more website functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1b" (5 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1b` from `origin/integration/0.3.2` at 5e7eff3b. Pushed only this branch; never merged, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `theme-download-ui.js`
  `mount`, `site-navigation.js` `init`, `svg-editor-panels.js` `create`. Code moves; no text, order, class, event or
  timing changes. FN1A's method: steps are file-level functions given one context object.
- **Commits:** plan f0da2633; theme-download-ui.js 0fed67c1; site-navigation.js 22848464; svg-editor-panels.js
  f0bacdae; new checks cc249988, fecba33f, a08da86e; CHANGELOG 0a1a916c; integration merged in once 688f5afc (56f1b891:
  PL1, MCP files only).
- **Function sizes (my measure, `espree`: first to last line, nested functions inside their parent; the gate's
  `ops/gate/funcsize.py` is not in DataArcus):** mount 450 -> 18, init 338 -> 5, create 296 -> 9. Every new step 80 or
  fewer: the largest are countersPart 68, namesPart 66, projectPart 66, effectsPart 63, modelPart 62, propsView 61.
  Files: theme-download-ui.js 485 -> 560, site-navigation.js 381 -> 401, svg-editor-panels.js 318 -> 352 (each under
  600). Over 150 in these files now: only the files' own wrappers (as on the base).
- **Ratchet:** the gate's count 24 -> 21 for the reviewer to set (the baseline lives in `ops/gate/`, not touched).
- **Expected checks:** (each run's output file, its PASS/FAIL line) the base 5e7eff3b, after `npm run build:min`: all 44
  website suites pass (1445 s; site 624, anchors 120, lang-switcher 1442, consent 38, theme-generator 922,
  theme-generator-lab 922, pbip 111, layout 512, layout-lab 512, svg-kpi 854, theme-logo 753, arabic-names 14,
  layout-canvas 31, sp25 22, sp31 17, sp33 34, sp35 38, pv2 20). The split (all three files): those 18 suites, the same
  totals, all pass. New website suite fn1b 17 checks, pass. MCP `npm test -- model arabic twin`: 95 suites pass (the
  three that read theme-download-ui.js's source: dd2p 112, sq14 15, dd1g 39). sp31-page.json, sp33-editor.json,
  sp35-site.json unchanged (never re-recorded). Lint 0; check-modules, check-min, stamps, site config, csp, ar-pages,
  agent-memory, changelog-words, result-lines pass.
- **Characterisation, red-proven on 5e7eff3b:** 78 mutants, one or more per step (a class, an event name, a threshold,
  a text, a file name, a condition), each in a git worktree of the base (build:min, then the suites in order, first
  red stops): 61 red on an existing suite (sp31 27, sp35 16, sp33 15, pbip 3). 17 red nowhere: new checks in
  `scripts/tests/fn1b.mjs`, each green on the base, red on 5e7eff3b under its own mutant first, green on the split.
  Controls (the base worktree, unmutated, the same build): sp31, sp33, sp35, fn1b green.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42054180122 on 688f5afc (Linux and Windows; macOS skipped
  by the workflow on a branch run). After it only this note changed.
- **State: DONE.**
- **Resume:** none; the reviewer's merge (WORK.md's 0.3.2 line: FN1B, left to the merge).

## The steps (one per job of the old function, called in the old order)
- **theme-download-ui.js:** mount -> statusKit (pngKey, csvKey, layoutChanged, renderVis, updateStatus: the function
  declarations mount hoisted, so made first), fileKit, jsonPart, slotPart, pngPart; on pages with the project card
  modelPart, modelFilesPart, logoPart, namesPart, projectPart, canvasPart, checkPart (a definition only, made before
  the download needs it), pbipDownloadPart, previewPart; last statusListeners. One state object `st` for the lets more
  than one step reads or writes (lastJson, lastPng, lastCsv, autoSwitched, pbipSync, canvasFit, logo).
- **site-navigation.js:** init -> facadePart, effectsPart, navbarPart, topOffsetPart, hashArrivalPart, countersPart,
  menuPart, blogPart; navbar and root go to later steps through `nav`.
- **svg-editor-panels.js:** create -> valuesKit, layersPart, addPart, fieldKit, propsView, propsInput, valuesPanel,
  each given `p` (the inputs); FMT and KINDS are file-level data.

## The mutants (ids as in the commits) and what caught them
- theme-download-ui.js (T1-T37): sp31 27, pbip 3 (T17 the .pbit file's name, T18 the logo's size limit, T25 the
  connection's order). New checks: P1 (T10, the PNG's credit chunks), K1 (T12, the KPI pickers follow the second page),
  M1 (T14, "No .SemanticModel folder here"), R1 (T21, an Arabic model's download keeps its name), R2 (T22, the names
  step asked again shows the approved names), L1 (T28, the check lists 12 problems), B1 (T31, the button disabled while
  it builds).
- site-navigation.js (N1-N20): sp35 16. New: A1 (N6, AOS's options), H1 (N10, an in-page link inside the open phone
  menu closes it), C1 (N14, the counters at threshold 0.9), S1 (N18, the blog's search waits 300 ms).
- svg-editor-panels.js (S1-S21): sp33 15. New: D1 (S1, A - B's result), D2 (S2, a value Hide when blank uses stays),
  D3 (S3, the warning names a value by its label), D4 (S8, svgkpi_add_layer), D5 (S13, the card's width kept at 1200),
  D6 (S20, one value: "Add two values first").

## Decisions I made
- Steps are file-level functions given one context and destructuring only what they use (read from each step's own
  tokens, then lint's no-undef and no-unused-vars as the proof); a step adds to the context what a later step uses.
- The renames to `st.` were made on the syntax tree (identifiers only, never strings or comments): 34 places, plus the
  writer's input `logo` written `logo: st.logo`. Every other moved line is the line it was (a multiset line diff of
  each file against the base: only the renames, the dispatch lines, the steps' heads and tails and five comments).
- The function declarations mount hoisted (pngKey, csvKey, layoutChanged, renderVis, updateStatus) and checkPart's
  showCheck are made before the steps that call them; making a function has no effect a page can see.
- H1: no page has an in-page link inside its navbar today, so the check adds a made-up one; a # link outside the
  navbar is closed by the outside-click handler too, which is why no suite could tell.
- S1 reads the cards from page timers at 150 and 450 ms: the browser runs timers in time order, so a busy machine
  cannot make the check flaky. L1 serves a made-up check engine (15 made-up problems) for that check only.
- `model` and `unzip` in arabic-names.mjs are exported and imported by fn1b.mjs (one place, never a copy).
- No new module: MODULES.md unchanged (the interfaces are the same). `ops/gate/samejob.py` is not in DataArcus: no
  shared helper was written, only the steps of each function.
- Each split commit carries its own build:min stamps; the 18 suites ran once on all three splits together.

## CHANGELOG line
- **Inside the Theme Generator's downloads, the site's navigation and the SVG KPI Designer's panels, in smaller
  steps:** each is made by short named steps instead of one long function; every download, menu, counter, panel and
  click is what it was before.

## For the owner
none

## Risky changes
none: no security policy, approval step, file writing, answer, network or process changes; no test loses a check (a
suite added: website fn1b 17; arabic-names.mjs exports two helpers, its 14 checks as before).

## For the laptop
none

## Seen, not in scope
- The site-navigation.js outside-click and Escape handlers call `bootstrap.Collapse` without checking that bootstrap
  loaded (the in-page link handler checks `window.bootstrap`); moved as they are.
- The other functions over 150 lines (my measure, among others: plan_layout register 463, planTwin 321,
  check_model_health register 196, languageCopy 182, meaningOf 201): for the next FN jobs.
- sp31 does not compare the PNG's bytes by default (SP31_WHOLE=1), so the credits were unpinned; sp33 never uses a
  diff formula or one value; sp35 does not read AOS's options or the counters' threshold (now fn1b).

## Lessons for the reviewer
- 78 mutants at about 2 minutes each (sp35 and sp33 are 2 minutes a run, a survivor runs every suite: site alone 13
  minutes) took about 2 hours on 4 workers; a survivor's long list is most of it. Running the cheap suites first and
  the slow `site` last would help; a mutant list per step ready in the brief would too.
- A suite that reads a file's source (MCP dd2p extracts textChunk from theme-download-ui.js) is not in ops/gate/pins.py's
  website list: worth listing in the brief.
- Editing an assets/js file while a suite run is in progress in the same checkout risks the run: work in a worktree.
