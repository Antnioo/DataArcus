## Summary
- **Approval:** the owner, 12 Nov 04:15 Dubai, D-1112-01 (fix the open audit finds, go on without him while he sleeps);
  D-1104-12 (one job, one place). Relayed by the hub, session_015Q77oNR7YVFznptSuZoZZ2, as job SN4.
- **Base:** `feat/0.3.3-sn4` from `origin/integration/0.3.3` at 0dc0ea05 (LX1 c78c9f80 and AU2 merged). Push only this
  branch; never merge, no PR.
- **Scope:** (1) read_report's JSON form says what it did not read (LK1 "Seen" 1); (2) create_report's `font` text true
  for both routes (FT1, FT2); (3) check_report's lint section says `notListed` with its count, not `truncated`
  (LX1 "For the owner" 1, decided by the hub). Files: lib/report-answer.mjs, lib/report-inputs.mjs, lib/check-report.mjs
  (the lint lines only), fixtures by their recorders, new suite sn4, TOOLS.md, CHANGELOG, WORK.md, this note.
- **Expected checks:** sn4 red on 0dc0ea05 first, then green; fn1e only the 4 lint cases move (read every key, R-95);
  tl1 and tk1 pass, tools/list under 61,000 (60,532 now, measured); lk1 23, sn1 20, rv1 484 unchanged; lint 0; CI.
- **Resume:** plan written 2026-11-12T02:33Z; no code yet.

## The plan (written before the code, 2026-11-12T02:33Z)
Measured on 0dc0ea05:
- **1.** read-report... report-answer.mjs: the text's NOT READ line (the tail) lists links, files over 8 MB (`inv.sk.big`),
  folders deeper than 12 (`inv.sk.deep`), unreadable (`inv.unreadable`), the cap (`inv.sk.capped`); the JSON `out` has
  `notRead: { links }` only. Plan: one function `notReadOf(inv, links)` builds the facts (count and names as the text
  line prints them); the text line formats it, the JSON adds its keys next to `links` under `notRead`, only when
  there is something to say (R-89). Names are screened by the same helpers as the text. Red first: a made-up report with a
  file over the limit, a folder too deep, an unreadable file; both forms through the real server.
  R-90: suites that record read_report's JSON, listed before the change below.
- **2.** report-inputs.mjs:91, "Hand-placed pages: the font (default Segoe UI)" -> a text true for both routes. tl1's
  fixture is recorded without descriptions; measured after the change whether it moves (said per test).
- **3.** check-report.mjs:397 (cap) and :430 (size loop) set `truncated: true` in the lint section; both become
  `notListed: <count>`. fn1e's 4 cases re-recorded by their recorder ON PURPOSE; C2's needle `"truncated":true}`
  follows to the new key.
