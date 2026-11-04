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
- **Got on the base:** pk1 44 of 50 (the 6 registry checks red), 3 runs identical; recorded.
- **Resume:** step 3 (the registry).

## Plan
1. This note (commit, push). 2. pk1 on the base, recorded, 3 runs identical; mutation suite before.
3. redesign-kinds.mjs; redesign.mjs reads it; pk1 50, the area runs, mutation after (CS-allow anchor moved).
4. CHANGELOG line, WORK.md line; merge integration in once if it moved; area runs, lint; CI on the branch, wait.
