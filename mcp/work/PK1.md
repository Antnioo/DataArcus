# PK1 (0.3.2): the redesign's patch kinds as a registry (one place per change kind; behaviour identical, MCP only)

## Summary
- **Approval:** the owner D-1104-01 ("Agree on all r&ds": the patch-kind registry first, as RD4, RD6, RD8 and RD1e
  need it), D-1103-11, J13 (19 Oct: a redesign is a lossless copy with allowlisted patches; this job never widens it).
  Earlier work read (sections c and g): SCOUT-0.3.2 "Where it is weakest" 4 and Decision 3, RD4, RD6, RD8, rd1/b304.
- **Base:** `feat/0.3.2-pk1` from `origin/integration/0.3.2` at 1691046. Push only this branch; never merge.
- **Scope:** new `mcp/lib/redesign-kinds.mjs`: each patch kind one entry (name, the files and JSON pointers it may
  touch, the files it may add, its validator, its plan sentence EN and AR). Enabled, today's five: grid placement,
  static titles, theme tokens (restyle), the copy's name and id (.platform), consistent text (CS1/CS2: a visual's own
  text settings removed, the theme's visual styles, the added theme file and report.json's additions). ALLOW, the file
  kinds, the added-file rule, report.json's "additions only" and the logical id chosen at the write are read from it by
  `buildCopy` and `verifyCopy` (redesign.mjs); a new kind is one entry. Four planned kinds as entries with
  `enabled: false` (season RD4, phone RD6, page RD8, tidy B-304): the shape is proven, nothing new is allowed.
- **Test first, suite pk1 (test-0.3.2-pk1.mjs, area report), recorded on the base** in fixtures/pk1-redesign.json:
  16 redesigns (SP19's 10 made-up reports; filters, bookmarks, a slicer selection and a tooltip link; consistentText
  "theme" with keepPositions; consistentText on a report with no theme file; a report with no .platform; the NC1 lab's
  original and its native copy): for each, the plan (problems, patches, answer sha256 and length, digest, verifyCopy's
  result) and the files writeRedesign writes (each sha256, read back from disk). 12 made-up copies outside every kind
  (a visual's type, a page.json, report.json's existing theme, a theme text class, .platform's type, an added file
  elsewhere, an added theme with a colour class, an allowlisted pointer not in the plan, and the planned kinds' own
  shapes: a mobile.json added, a page added, a page background in the theme, the page order alone) refused with the exact
  message the base gives. After: 6 registry checks (ALLOW is the base's literal regex for regex; the enabled kinds are
  the five; the planned four have the full shape and none enabled; each kind's sentence EN and AR; buildCopy and
  verifyCopy hold no pointer of their own; the module reads and writes no file).
- **Expected checks:** pk1 44 of 50 on the base (the 6 registry checks red: no module), 50 after, records unchanged;
  sp19 13, redesign 50, rd1 14, cs1 45, cs2 29, sp2 10 unchanged; mutation 76 of 76 killed before and after (its
  CS-allow anchor names the new file: the same mutation, widening the visual pointers by /visual/objects/).
- **Got:** as expected: pk1 44 of 50 on the base (3 runs identical, recorded), 50 after, records unchanged; mutation 76
  of 76 killed before (186 s) and after; report 58 of 58 suites, safety 18 of 18; lint 0. redesign.mjs 534 -> 526
  lines, redesign-kinds.mjs 161 (new). R12 changed before recording (a group moved is accepted by verifyCopy: Seen 1).
- **Resume:** the merge of integration (if it moved), the area runs, CI on the branch.

## Plan
1. This note (commit, push). 2. pk1 on the base, recorded, 3 runs identical; mutation suite before.
3. redesign-kinds.mjs; redesign.mjs reads it; pk1 50, the area runs, mutation after (CS-allow anchor moved).
4. CHANGELOG line, WORK.md line; merge integration in once if it moved; area runs, lint; CI on the branch, wait.

## CHANGELOG line
- **Inside the MCP, the redesign's allowed changes:** each kind of change a redesign may make to its copy (the grid,
  titles, theme colours, the copy's name, consistent text) is one entry in a file of its own, which the copy's check
  reads; nothing new is allowed, and every redesign plan, check and written file is exactly what it was before.

## Decisions I made
1. **Five kinds today, not four:** the brief named grid, titles, theme tokens and the copy's name; ALLOW also holds
   CS1/CS2's consistent text (a visual's own text settings removed, the theme's visual styles, report.json's additions,
   the added theme file). It is the fifth entry, `consistentText`, so the registry is the whole allowlist.
2. **The planned kinds are real entries with `enabled: false`** (in `PLANNED`, each with a comment naming its R&D note),
   not code comments: the same `shapeProblems` the enabled ones pass proves their shape (K3), and only `KINDS` with
   `enabled: true` reach the copy (ALLOW, the file kinds, the added files). The module throws at load if any entry is
   not whole.
3. **A file kind is matched only when an enabled kind changes it:** the planned kinds' file kinds (mobile.json,
   pages.json, reportExtensions.json) are declared, but a change to one is still "a file the allowlist never changes"
   (R2, R12), as on the base.
4. **The plan sentences are in the registry only** (`said`, `sentenceOf`), not added to any plan: the plan's words are
   unchanged (so L-1102-06's cap measure and fx1 runs do not apply: no word added). A kind that shows its sentence in a
   plan later measures the cap then.
5. **R12 replaced before recording:** "a group moved" was accepted by verifyCopy on the base (the plan refuses it, the
   copy check does not); recording it as a refusal would have been false. R12 is now the page order changed alone.
6. **The suite writes through `writeRedesign` directly** (a made-up approved plan with the plan's pins and files),
   as the gate calls it after the go, to record the written files' sha256; the gate itself is audit-writes' and
   write-gate's (both unchanged).
7. **The mutation suite's CS-allow anchor moved** to the new file: the same mutant (the visual text pointers widened
   by `/visual/objects/`), killed by cs1 as before; no expected number changed.
8. **`node:path` in the registry** (themeFileOf's `path.basename`, kept exactly as verifyCopy had it); K6 forbids fs.

## For the owner
none

## Risky changes
- **The copy check's authority (verifyCopy) moves behind a registry.** Nothing new is allowed: the registry's enabled
  pointers are the base's ALLOW literal regex for regex, in order (K1, against the literal copied from redesign.mjs:121
  at 1691046); the planned kinds are off (K2) and their shapes are refused exactly as on the base (R9 a mobile.json
  added, R10 a page added, R11 a page background in the theme, R12 the page order). verifyCopy keeps its order (lost
  files, added files, each changed pointer: allowed, the kind's rule, in the plan, its value) and its messages: the 12
  refusals give the base's exact text, and 16 redesigns give the base's plan, checks and written bytes (pk1).
- One edge is stricter, never looser: a plan with an `add` patch whose file no kind adds and that is not in the copy
  (unreachable: buildCopy writes every add) is now refused; on the base only its content was checked.

## Seen, not in scope
1. **verifyCopy accepts a group's position change** (the grid's pointers on any visual.json; R12's first form): only
   the plan's reasonOf keeps groups still. Tidy (way B) moves groups: its kind's check should refuse a group's size and
   check its children byte-identical (the planned entry's check does the first).
2. The test history is shallow in a fresh cloud checkout: glass-tables reads cba24a5 (`git fetch --unshallow` first).

## For the laptop
none (no Desktop change: every written file is the base's, byte for byte)

## Lessons for the reviewer
- **Season, phone, page, tidy:** turn the entry on (`enabled: true`) and move it from `PLANNED` to `KINDS`; never edit
  buildCopy or verifyCopy. A kind's rule returns the words after "changed at <pointer>, " (changes) or after the file's
  name (adds), so its refusal reads like today's.
- **pk1 is the proof for every kind added:** its 16 redesigns and 12 refusals must stay as recorded; the refusal of
  that kind's own shape (R9 phone, R10/R12 page, R11 season) flips to accepted, and that job changes only that row,
  with the owner's go, in its own note.
- **Phone:** the added file's rule gets `ctx.src` (the original's files): no mobile.json on the page already, a
  visual.json beside it. **Page:** additions only (`before === undefined`) on pages.json, report.json's resources and
  reportExtensions; new page ids case-insensitive. **Season:** a restore op is new (buildCopy has set, create, remove,
  add). **Tidy:** see Seen 1.
