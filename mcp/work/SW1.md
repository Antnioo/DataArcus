## Summary
**Approval:** the owner 12 Nov, D-1112-06 ("okk i agree" to the reviewer's list); the sweep is his yes of D-1112-03.
- **Scope:** two small items, one commit each, nothing else. (1) I-1112-1696: mcp/WORK.md is at its cap; move its oldest finished line to mcp/work/archive/ the way the repo does, leave room for 5 lines, cap unchanged. (2) I-1112-1702: scripts/test-whats-new.mjs names what it checks. Not touched: .github/workflows/tests.yml (CI3's).
**Base:** origin/integration/0.3.3 9ee1b0ce (branch fix/0.3.3-sw1).
**Expected checks:** `node scripts/check-modules.mjs --strict`; check-agent-memory, check-result-lines, changelog-words PASS; `node scripts/test-whats-new.mjs` PASS.
**Resume:** item 1 then item 2 then the CI run; see "For the reviewer" below for the state.
