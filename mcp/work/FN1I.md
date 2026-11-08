# FN1I (0.3.2): two website functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1I" (8 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1i` from `origin/integration/0.3.2` at 5cf96356 (BF2 merged; e621426b, FN1H, inside it).
  Pushed only this branch; never merged, no PR.
- **Scope:** `assets/js/theme-layout-ui.js` `mount` and `assets/js/pbip-export.js` `build` split into named steps in
  the same files (no new module). Code moves; no text, order, key, random-id order or output change.
- **Expected checks:** sizes (my espree script, first to last line, nested functions inside their parent; the
  reviewer's 3 over 150 on e621426b, mine 3 on 5cf96356: register 468, mount 231, build 205) -> 1 (register only);
  every new step 80 or fewer; files under 600. Every website suite and every MCP suite green on the base and on the
  split with the same check counts; no fixture re-recorded; new suites (where a part has no red suite) red on
  5cf96356 under their mutant first.
- **Resume:** the plan is pushed; next the base runs, then the mutants, then the splits.

## The plan: the parts and their steps
- **mount** (theme-layout-ui.js :26-256), one context `ui` (the inputs, then what each step makes), one state `st`
  for the two lets the listeners write (pageMsg, advOpen; PW stays a let inside its own step):
  basicsStep :27-46 (the engine's parts, labels, colour inputs, renderInputs, setColor); fontStep :47-62 (fontNote,
  renderPresets and its first draw); controlsStep :63-97 (the colour, preset, Generate, name, font and chart-style
  listeners); pageStep :98-121 (PW, page, shapeMsg, applyPage, boxOf, lay, rtl, nm, ranges, sizes, computeSlots,
  barW, thumb); sizesStep :123-145 (seg, chk, rng, sizeControls); advStep :146-162 (dot, colorSeg, advControls);
  previewStep :163-184 (pngSize, canvasSlots, renderLayoutPreview); layoutStep :185-207 (renderLayout);
  listenersStep :209-245 (the layout step's click, input, change, toggle and hover listeners). Called in that order.
- **build** (pbip-export.js :257-461), steps given what they read and returning what later lines use (the writer's
  context `c` is built as today, the same keys in the same order): chartLookOf :273-282, continuousOf :283-291,
  quietGridOf :292-297, namesOf :299-311 (the pages' rnd() ids), projectFiles :318-334 (guid() of each .platform),
  resourceFiles :336-360, tooltipKit :362-382, svgMeasures :398-410, bookmarkFiles :415-427, extMeasures :433-441,
  repoFiles :443-452, resultOf :453-460. rnd() and guid() are called in today's order.
- **Characterise first:** each suite that loads these files green on the base; mutants in a worktree of the base;
  a part no suite turns red gets a pin (an MCP suite fn1i for build: made-up builds over every condition, every
  file byte for byte; a website suite fn1i for the layout panel where needed).
