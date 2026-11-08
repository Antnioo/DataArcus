# FN1I (0.3.2): two website functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1I" (8 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1i` from `origin/integration/0.3.2` at 5cf96356 (BF2 merged; e621426b, FN1H, inside it);
  integration merged in once, 38cf7202 (28073f3c: DD2W, B387). Pushed only this branch; never merged, no PR.
- **Scope:** `assets/js/theme-layout-ui.js` `mount` and `assets/js/pbip-export.js` `build` split into named steps in
  the same files (no new module). Code moves; no text, order, key, random-id order or output change.
- **Commits:** plan 33b24dec; new checks d1dc0335 (MCP fn1i) and 6bb58920 (website fn1i); build 15d48825; mount
  8b8ddf08; merge 38cf7202; CHANGELOG 2a7c8314.
- **Function sizes (my espree script, first to last line, nested functions inside their parent; the gate's
  funcsize.py is not in DataArcus):** mount 231 -> 10, build 205 -> 60. Largest new steps: listenersStep 45,
  controlsStep 35, pageStep 34, layoutStep 30, resourceFiles 29 (all 80 or fewer). Files: theme-layout-ui.js 260 -> 305,
  pbip-export.js 466 -> 519 (each under 600).
- **Ratchet (fn_over_150):** the reviewer's 3 on e621426b; mine 3 on 5cf96356 (register 468, mount 231, build 205),
  1 on 2a7c8314 (plan_layout register 468). The reviewer sets the gate's number.
- **Expected checks:** every website and MCP suite green on the base and on the split with the same counts, no
  fixture re-recorded, the new suites red on 5cf96356 under their mutants first.
- **Got on the base 5cf96356:** website "All 47 passed (1803s)" (sp31 17, pbip 111, layout 512, layout-canvas 31,
  theme-generator 922, theme-logo 753, fn1b 17, sp5 3, sp7 3, sp13 3); MCP suites that read build all PASS (sp28 17,
  sp5 12, sp43 21, v029w 75 and 25 more, the mutant runner's controls).
- **Got on 2a7c8314 (the last code commit, integration merged):** MCP `npm test -- --keep-going` "run-tests: 227
  suites passed" (every suite in one local run, the 5 CI shards' union; fn1i 22, sp28 17, sp43 21, sp5 12, fn1h 5,
  mutation 225); website "All 49 passed (2381s)" (sp31 17, pbip 111, layout 512, theme-generator 922, fn1b 17, fn1i 14,
  dd2w 130). No fixture changed. Lint 0; contracts 717, test-contracts 14, modules, check-min, stamps, site config, csp,
  ar-pages, sitemap-lastmod, agent-memory, result-lines 227, changelog-words PASS.
- **Characterisation, red-proven on 5cf96356:** 136 one-line mutants, each alone in a git worktree of the base (the
  layout panel's after build:min). build 70: 65 red (sp28 47, fn1i 12, sp43 2, mirror-parity 1, fx3b 1, tt2 1,
  v029w 1; fn1i grew four builds after the first survivors), 5 equivalent. mount 66: 48 red on sp31, 14 red only on
  the new website fn1i, 4 equivalent. Each new check green on 5cf96356 unmutated and on the split.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42513626118 on f79b38c0 (Linux and Windows, MCP 5
  shards each, website 3 shards; macOS skipped by the workflow on a branch run). After it only this note changed.
- **State: DONE.**
- **Resume:** none; the reviewer's merge (fn_over_150: 3 -> 1).

## The steps (one per job of the old function, called in the old order)
- **mount** (context `ui`: the inputs, then what each step returns; `state` holds the two lets the listeners write,
  pageMsg and advOpen; PW stays a let inside pageStep, the only step that reads or writes it): basicsStep, fontStep,
  controlsStep, pageStep, sizesStep, advStep, previewStep, layoutStep, listenersStep. mount returns the same api.
- **build** (each step given what it reads, returning what later lines use; the writer's context `c` built in build as
  before, the same keys in the same order): chartLookOf, continuousOf, quietGridOf, namesOf (the pages' rnd() ids),
  projectFiles (each .platform's guid()), resourceFiles, tooltipKit (tipName, tipBinding, then the trend's rnd()),
  svgMeasures, bookmarkFiles, extMeasures, repoFiles, resultOf. rnd() and guid() are called in today's order.

## The mutants and what caught them
- build (b1-b70, ids in the scratch list, per step): chartLook 5, continuous 3, quietGrid 3, names 5, project 7,
  resources 7, tooltip 5, svg 3, bookmarks 5, pages 3, ext 4, repo 4, result 9, readable 2, inputs 2, context 3.
  Caught by sp28 (47), sp43 (b3 the mirror without rtl, b52 the names note), mirror-parity (b8), fx3b (b34), tt2
  (b51), v029w (b58), fn1i (b6 a decimal axis, b7, b9, b10, b19, b24, b25, b32, b53, b57, b63, b66).
- Equivalent (no input can tell): b5 (bar2 is 30 degrees of hue from the lead by secondColour, never equal), b35
  (same() is only given columns), b65 (sample is read only when there is no model), b69 (assigns c.B to itself), b70
  (pages.json's placeholder is always replaced).
- mount (m1-m66): sp31 48 (labels, colour inputs, presets, slots, thumbnails, seg buttons, sliders, Advanced, the
  table, listeners). The new website fn1i: N1 (m8 the font note on a right-to-left layout), P1 (m11 the presets drawn
  by mount), A1 (m34 Advanced with no KPI bar), T1 (m16 the hex box's toast), M1 (m18 the name's 60), C1 (m19 the glass
  refusal's note cleared), W3 (m22 PW rounded), S3 (m25 the thumbnails ignore the split), U1 (m43 the stale marks), W1
  (m45 the warning colour), S2 (m50 the split dropped), W2 (m53 a page button clears the message), R1 (m58 the radius
  slider writes the theme), W4 (m66 clearPageMsg).
- Equivalent: m21 (PW's first value is replaced by applyPage before anything reads it), m41 (canvasFit's layout has
  the design's page, so PW is the same), m42 (nothing reads a drawn slot's stack), m46 (repairState always sets
  headLine).

## New checks
- `mcp/test-0.3.2-fn1i.mjs` (report area): 21 made-up builds over build's own conditions sp28 does not reach, every
  file's path and bytes, the ZIP's size (the ZIP holds its time) and the whole result; F22 every build ran. Fixture
  `mcp/fixtures/fn1i-builds.json` recorded on 5cf96356 only (the base worktree, no tracked file changed). 22 checks.
- `scripts/tests/fn1i.mjs` (website, shard 2): 14 checks (above), on the live English page.

## The final runs (2a7c8314)
- As in the summary. The Arabic generator at 390 x 844: right to left, 4 layout buttons, 10 slot rows, the canvas, 6
  presets, no page error, no sideways scroll.

## CHANGELOG line
- **Inside the Theme Generator's layout panel and the website's Power BI project download, in smaller steps:** each is
  made by short named steps instead of one long function; every control, preview, saved choice and downloaded file is
  byte for byte what it was before.

## Decisions I made
- The brief names two CONTRACTS.md rows for pbip-export.js: they are pbip-zip.js's crc32 and PBI_LITERAL, neither in
  build, so nothing moved in the ledger or the probe (`node scripts/test-contracts.mjs` PASS 14).
- Renames: only `pageMsg` -> `state.pageMsg` and `advOpen` -> `state.advOpen` (identifiers, never strings); every
  other moved line is the line it was. The step names, their one-line heads and the dispatch lines are new.
- The ZIP is pinned by size, not hash: its entries carry the time it was made (a first recording differed between two
  runs a minute apart).
- No new module (MODULES.md unchanged; the interfaces are the same); no helper written, so nothing for the library.
- The integration merge: the three generator pages' stamp lines and theme-generator.min.js taken from integration,
  then `npm run build:min`; run-all.mjs keeps both suites (dd2w and fn1i).

## For the owner
none

## Risky changes
none: no security policy, approval step, file writing, answer, network or process change; no test loses a check (two
suites added: MCP fn1i 22, website fn1i 14).

## For the laptop
none

## Seen, not in scope
- The other function over 150 lines: plan_layout.mjs register (468), a later job.
- sp31 never leaves a hex box, never types a name over 60, never uses a page message, never moves the corner slider
  with Solid visuals, never undoes the example: now fn1i. sp28 never builds with no data or next to a project.
- secondColour can never return the lead, so build's "GRAD2 only when bar2 differs" test is dead code (b5).

## Lessons for the reviewer
- A one-line mutant on a page module costs about 80 s when sp31 catches it and about 5.5 minutes when nothing does;
  136 mutants took about 2 hours on 3 workers. Writing the pin for a survivor as soon as it appears saved a second pass.
- The radius slider's own renderJson is hidden while visuals are Transparent (layoutChanged writes the theme too):
  a check of it must choose Solid first.
- The ZIP from build carries its time: pin its size or its files, never its hash.
