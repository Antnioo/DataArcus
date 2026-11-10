## Summary
- **Approval:** the owner's D-1110-04 (10 Nov, "Go 1 and 2 they have to be finished anyways"), B-432, FT1's Seen 1; D-1027-12
  (the twin identical in look), D-1109-07 (an Arabic plan line is drafted, never shipped silently).
- **Base:** `fix/0.3.3-ft2` from `origin/integration/0.3.3` at 00f7f702. Push only this branch; never merge, no PR.
- **Scope:** create_report's `font` given with a layout / design is applied over the design's own font; the plan says which
  font it uses and which it replaced; a font outside E.FONTS is named in the plan's `repaired`. Hand-placed pages (FT1) unchanged.
- **Expected checks:** new suite test-0.3.3-ft2, 12 checks, red on the base (7 of 12 fail); report, core, arabic areas and the
  split guards unchanged; `node scripts/check-modules.mjs --strict` (no fs / process.env import added).
- **Resume:** none; the reviewer reads and merges.

## Plan and measurement (written 2026-11-10T08:26Z)
Measured on 00f7f702 through the real server (plan_layout, approve_plan, create_report), made-up model; theme faces = the 4 primary
text classes (callout, title, header, label); no visual writes a font literal in designed reports:
| case | input | theme faces on the base | plan text on the base |
| a | hand pages + font Tahoma | Tahoma (FT1) | plan.reportLook.font Tahoma |
| b | layout exec | Segoe UI | no font word |
| c | layout exec + font Tahoma | **Segoe UI** (Tahoma unused) | reportLook.font says **Tahoma**: the plan promised a font the write does not use |
| d | design font Verdana + font Tahoma | **Verdana** (Tahoma unused) | reportLook.font Tahoma and design.font Verdana, no word about which wins |
| e | design font Verdana | Verdana | design.font Verdana |
Cause (measured): designStep (lib/report-build.mjs) called planLayout without `font`; planLayout (lib/design.mjs) never read a.font
(only themeDesign, generate_theme's step, does). plan_layout passed it but planLayout ignored it, so plan and write agreed
with each other and both ignored the font.
Fix: planLayout applies `a.font` over the design's font (given.font) when E.FONTS offers it and it is not "Segoe UI";
returns `fontSaid { font, replaced?, say }`; plan_layout puts it in its answer; designStep passes `font: a.font`, so the write
equals the plan.

## Before -> after (written 2026-11-10T08:26Z)
- Red on 00f7f702 first: test-0.3.3-ft2 `FAIL  ft2  5 of 12 checks` (C1, C2, D1, D2, G, TC, TD fail: the theme keeps Segoe UI or
  Verdana, no fontSaid, no repaired line).
- After: `PASS  ft2  12 checks`. Written 2026-11-10T08:56Z, each number from the run's own output: report area 76 suites PASS, core 13, arabic 18;
  split guards and pinned suites sp10 113, sp22 24, sp26 26, sp38 50, sp39 96, sp43 21, sp44 23, sp6 13, sp29 21, sp12 21, sp13 12,
  sp23 29 PASS, no fixture re-recorded and no test's expected number changed. Gates: check-modules --strict (217 rows, no row
  changes: no new module, no fs / process.env import), agent-memory, result-lines, changelog-words, check-contracts,
  test-contracts, site config PASS; eslint (npm run lint at the repo root) exit 0.
## Changed on purpose
- none: no existing test or fixture changed.

## CHANGELOG line
- A report made with a layout or design now uses the `font` you give it (for example Tahoma) over the design's own font, in the
  English report and its Arabic twin; the plan says which font it uses and which design font it replaced, and a font the
  tools do not offer is named in the plan instead of being dropped.

## Decisions I made
- The font the person gave wins over the design's (the explicit choice). No measured layout break argued otherwise: the
  design engine's text room is measured for Segoe UI and DIN; Tahoma was already allowed by hand-placed pages with the
  same caveat, so the plan carries the "not measured yet" sentence the generator uses (E.MEASURED_FONTS).
- "Segoe UI" is create_report's default (withLookDefaults fills it into the plan's pin), so it counts as no font, as FT1
  decided: a design's Verdana stays when the call says nothing or says "Segoe UI" (F). Plan and write use the same rule.
- A font outside E.FONTS keeps the design's font and is named in `repaired` (field font, given, used, why), never silent.
- The plan line is English only; no Arabic plan text changed, so there is no Arabic draft.
- The twin needs no change: it copies the theme (TC, TD).

## For the owner
- none

## Risky changes
- planLayout (lib/design.mjs), used by plan_layout, generate_theme's redesign paths and the writer: a font in the call now changes design.font.
  Callers that pass `font` to planLayout: plan_layout (a), report-build designStep. Hand-placed pages are skipped (a.pages).

## For the laptop
- Next sitting: plan_layout with layout "exec" and font "Tahoma", approve, create_report, open in Desktop: the table and cards show
  Tahoma; the plan's fontSaid line names it.

## Seen, not in scope
- create_report's schema describes `font` as "Hand-placed pages: the font (default Segoe UI)" (lib/report-inputs.mjs:100): out of
  this job's scope list; the text is now stale for designed reports.

## Lessons for the reviewer
- planLayout's `fix` takes one object while themeDesign's takes four arguments: same name, different shape; a wrong call pushed the string 'font' into repaired.
