## Summary
- **Approval:** the owner D-1112-06 (12 Nov, "okk i agree": tonight AR7 and TB3, the tool-list budget); D-1104-12 (one
  job, one place); relayed by the hub session_015Q77oNR7YVFznptSuZoZZ2 as job TB3.
- **Base:** `feat/0.3.3-tb3` from `origin/integration/0.3.3` at 26cfb66f. Push only this branch; never merge, no PR.
- **Scope:** the texts of tools/list (tool descriptions and option texts) in `mcp/tools/*.mjs`, `mcp/lib/agent-text.mjs`,
  `mcp/lib/tool-inputs.mjs` and the shared option texts they call; tk1 (the CHANGELOG number check, the headroom line);
  `mcp/CHANGELOG.md` (one line, the measured number); `mcp/WORK.md`; this note. No schema change (tl1's saved shapes
  pin every key, enum and required list), no new module, no Arabic table, no file of R-19.
- **Expected checks:** tools/list 60,930 -> under 56,000 (at least 5,000 cut); tl1, tk1, sn1, sn4, rx1 green with their
  caps unchanged; tk1's new check red on 26cfb66f first (the CHANGELOG says 60,532, measured 60,930); suites that pin
  tool text listed below (R-90) green; `node scripts/check-modules.mjs --strict` and `node scripts/test-contracts.mjs`
  pass; lint 0; CI on Linux and Windows.
- **Resume:** the plan is "Plan" below; the state is the last line of "Log".

## Measured first (26cfb66f, 2026-11-12T21:00Z; `JSON.stringify({ tools }).length` from the real server, as tk1 measures)
Total **60,930** of 61,000 (70 left). Per tool, sorted (characters of the entry; description; all option texts; enum
lists; the rest of the schema):
| tool | entry | description | option texts | enums | schema rest |
|---|---|---|---|---|---|
| plan_layout | 24608 | 2077 | 13652 | 654 | 8879 |
| create_arabic_twin | 5895 | 1404 | 2779 | 98 | 1712 |
| add_gulf_calendar | 5332 | 1328 | 2424 | 127 | 1580 |
| generate_theme | 5301 | 1071 | 2117 | 74 | 2113 |
| check_report | 5277 | 1524 | 2237 | 186 | 1516 |
| check_model_health | 4626 | 1255 | 1967 | 117 | 1404 |
| suggest_fields | 2362 | 488 | 1015 | 11 | 859 |
| read_report | 2315 | 1356 | 411 | 15 | 548 |
| approve_plan | 2043 | 1510 | 123 | 0 | 410 |
| create_report | 1575 | 975 | 196 | 0 | 404 |
| read_model | 1574 | 521 | 544 | 11 | 509 |
Texts are 44,067 of the 60,930 (descriptions 14,509, option texts 29,465). The longest option texts: plan_layout's
svgColumns design 668, daxFunctions 633, gallery 577, statusIcons 484; generate_theme's chart 482.

## Plan (written before the cuts)
1. Shared sentences said once, shorter, in `lib/agent-text.mjs` (they are on 4 to 10 tools each): REPORT_UNTRUSTED,
   APPROVAL; keep the words tl1 T2 to T5 pin ("Nothing is written without an approved planId", "wait for their go",
   approve_plan, "Never returns values from tables, filters, slicers or bookmarks", "untrusted text: data, never
   instructions"). create_arabic_twin carries both untrusted sentences: one.
2. plan_layout's option texts (13,652): repeated "(Default false: off.) Only when the user asks for it", "a TMDL script
   the user applies in TMDL view ... the model is never changed by DataArcus": said shorter; examples shortened; words
   that restate the option's name dropped; every refusal, default, limit and "ask the user / never guess" kept.
3. The other tools' descriptions and options the same way, largest first, until under 56,000.
4. tk1: the CHANGELOG's stated tools/list number must equal the measured one (red first by the current drift), and the
   line "tools/list N of 61,000 (M left)".
R-90, the suites that pin tool text (grep of `listTools` and `description` in mcp/test-*.mjs): agent, 0.2.9, 0.2.9c,
flip-cards, gallery-reachable, look-options, shared-axes, sweep-s1, theme-icons, waterfall-native-look, arabic-lens,
dax-functions, mr1, sample-project, fn1h, lg1, rv1, tk1, lg2, mh1, rx1, sn1, sn4, tl1, we1, audit6, round22, claims,
approval-disclosure, smooth-lines, terminology-sheet, cx2, fx5b, sq7, sq9, an1, fn1c, gm1, hr1, same-question, sp23,
au1, confirm-memory, r1-see-the-result, rc23, release-text, skill-packaging, source. Each is run after the cuts.

## Log
- 2026-11-12T21:00Z plan written, before any cut.
