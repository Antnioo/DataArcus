# FN1B (0.3.2): three more website functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1b" (5 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1b` from `origin/integration/0.3.2` at 5e7eff3b. Push only this branch; never merge, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `theme-download-ui.js`
  `mount`, `site-navigation.js` `init`, `svg-editor-panels.js` `create`. Code moves; no text, order, class, event or
  timing changes. FN1A's method: steps are file-level functions given one context object.
- **Function sizes (my measure, `espree`: first to last line, nested functions inside their parent; the gate's
  `ops/gate/funcsize.py` is not in DataArcus):** mount 450, init 338, create 296 (the brief's numbers, the same).
  Target: each under 150, every new step 80 or fewer, each file under 600 (today 485, 381, 318).
- **Ratchet:** the gate's count 24 -> 21 (the baseline lives in the reviewer's engine: not touched here).
- **Expected checks:** the website suites green on the base 5e7eff3b and the same totals after each commit (numbers
  read from each run's output file, below); sp31, sp33, sp35 and their fixtures unchanged (never re-recorded).
- **State:** plan.
- **Resume:** characterise on the base, then the three splits, one commit each.

## The plan: parts by line range (on 5e7eff3b) and the steps
- **theme-download-ui.js mount (:32-481):** the context `d` (the inputs, `E`, `design`, the layout's names) and one
  state object `d.st` for the lets more than one step writes or reads (lastJson, lastPng, lastCsv, autoSwitched,
  pbipSync, canvasFit, logo). Steps, in the old order: statusKit (:431-448, :454-469, the hoisted function
  declarations pngKey, csvKey, layoutChanged, renderVis, updateStatus), fileKit (:56-58), jsonPart (:37-55), slotPart
  (:59-80), pngPart (:81-115); on pages with the project card: ownModelPart (:125-197), logoPart (:198-211), namesPart
  (:212-273), projectPart (:274-335), canvasPart (:336-353), checkPart (:377-396, a definition only, made before the
  download's click needs it), pbipDownloadPart (:354-376), previewPart (:397-425); last statusListeners (:449-453,
  :470-478).
- **site-navigation.js init (:18-355):** facadePart (:19-31), effectsPart (:33-93: particles, AOS, the year),
  navbarPart (:104-128), topOffsetPart (:130-158), hashArrivalPart (:160-175), countersPart (:178-241), menuPart
  (:243-296: outside click, ripple, Escape), blogPart (:298-354). The context `nav` carries navbar and root.
- **svg-editor-panels.js create (:21-316):** FMT and KINDS file-level data; the context `p` (the inputs); steps
  valuesKit (:29-54), layersPart (:56-75), addPart (:77-103), fieldKit (:105-152), propsView (:154-210), propsInput
  (:212-264), valuesPanel (:266-314).

## Characterisation
- The suites that load these files, green on the base; then each part broken once in a git worktree of the base and
  the suites that turn red listed; a part no suite turns red gets a new check, red under that break first.
