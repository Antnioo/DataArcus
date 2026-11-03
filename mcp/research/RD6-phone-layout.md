# RD6: a phone layout for an existing report (3 Nov 2026)

Research, cloud session; branch `rd/0.3.2-phone-layout` from `origin/integration/0.3.2`. No product file changes:
this note and scratch scripts under `mcp/research/rd6/` only. Made-up reports in `os.tmpdir()` only.

## Summary
- **Approval:** the owner's D-1103-12 (3 Nov, "10 r&ds during the night"); the brief: SCOUT-0.3.2.md "RD6" on
  `rd/0.3.2-scout`.
- **The question:** can a redesign patch add `mobile.json` to every page that has none (right to left on an Arabic
  page), placed by the writer's own phone rules, with nothing else changed?
- **Scope:** read the code (a), Microsoft's docs (b), 2-3 ways with size and risk (c), a measured prototype (d), the
  recommendation (e), the Desktop checks (f), a builder brief (g).
- **The rule kept everywhere:** a page that has a phone layout (any visual on it with a `mobile.json`) is never
  touched: not completed, not moved, not resized. Tooltip pages and hidden pages are skipped too (no phone view).
- **Base:** `origin/integration/0.3.2` at the branch point. **Resume point:** see "State" at the end.

## Plan and expected numbers (written before the work)
1. Read: `pbip-page.js` (mob, the phone placement, mobile.json), `layout-check.js`, `report-rules.js` PHONE_OVERLAP,
   `twin-pages.mjs` fitPhoneTabs, `read-report.mjs` (mobile read), `redesign.mjs` ALLOW / buildCopy / verifyCopy.
2. Microsoft Learn: "Create mobile-optimized reports" (auto-create, what it leaves off, the canvas) and the PBIR
   mobile.json schema (visualContainerMobileState).
3. Prototype (`mcp/research/rd6/phone.mjs`): the writer's placement rules (323 wide, cards two a row 157.5 x 100,
   everything else full width with the writer's heights, 8 gap, reading order) lifted onto an existing report's
   visuals by their type; groups wrap their children with page positions; right to left mirrors x.
4. Measure on made-up reports: the 25 twin-fuzz seeds (20261102..20261126, the lab's generator) and the two fixture
   reports, plus reports the writer itself writes with their mobile.json removed (the prototype's layout compared with
   the writer's own). Per page: laid out or skipped (why), visuals placed vs left off (why), PHONE_OVERLAP findings,
   phone page height, time.
5. The copy check: the prototype's files through `buildCopy` + `verifyCopy` as they are today (expected: refused,
   "file(s) not in the original"), and with a patch-kind registry entry for `mobile.json` (expected: passes,
   every other file byte-identical).

Expected (guesses, to be checked): PHONE_OVERLAP 0 on every laid-out page (the placement is a column, nothing can
overlap except a group's box over its children, which the rule skips); 60-80% of visuals placed on the fuzz seeds
(shapes, images, hidden visuals, tooltip pages left off); phone pages 1,000-4,000 high; under 50 ms a report; on
writer reports the positions equal the writer's own for every non-group visual (same rules, same order).
