## Summary
- **Approval:** the owner, 25 Oct (the night run, SQ0): "finishing all the seen not in scope everywhere since we
  started, making sure everything is in the right place". This job is the map, not the fixes.
- **Scope:** docs only. Every "Seen, not in scope" item in `mcp/work/*.md` and `mcp/work/archive/*.md` gets a status
  checked against today's code (DONE / OPEN / OBSOLETE / OWNER / DUPLICATE) with evidence; the OPEN ones are grouped
  into batches SQ1, SQ2, ... of 45-60 minutes each. One line per source note links back here; one line in `mcp/WORK.md`
  (ARCHITECTURE.md is at 5,196 of 5,200 characters, no room). No product or test code changes.
- **Base:** `chore/0.3.1-seen-queue` from `origin/integration/0.3.1` (2bf8bae).
- **Expected checks:** `node scripts/check-agent-memory.mjs` PASS (91 checks before; one more summary after).
  Expected counts, written before the check: 75 notes with a "Seen" section or line (3 notes have none: 0.2.9-crossreview,
  0.2.9-fuzz, R7-claims); 404 numbered items plus about 6 in prose (L2, L4), so about 410. Guess by status: DONE about
  35%, OPEN about 35%, OWNER about 15%, OBSOLETE about 10%, DUPLICATE about 5%; 8 to 12 batches.
- **Resume:** step 1 (this plan) pushed; step 2: per-note tables, batches, the back links, WORK.md's line.

## Plan
1. Extract every section (a heading with "Seen, not in scope", or a "Seen, not in scope:" line) and number its
   top-level items in order: `<NOTE>-S<n>` (all sections of a note numbered on, in file order).
2. Check each item against today's tree (grep, the file:line it names, `git log -S`, `mcp/CHANGELOG.md`); mark it with
   evidence. Not decidable in 2 minutes: OPEN, "verify first".
3. Group the OPEN items into batches by area and files (twin, reader and checker, report writer, design, website EN
   and AR, tests and CI, docs and memory, packaging), no two batches on the same files where possible; ordered by
   value: user-visible correctness, claims and docs, tests, tidy-ups. Desktop items go to the OWNER list, never a batch.
4. Each source note gets one line under each "Seen" heading: `Status of these items: mcp/work/SEEN-QUEUE.md#<note>`.
