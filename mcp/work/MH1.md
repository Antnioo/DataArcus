# MH1 (0.3.3): the shared MCP test client gives every call a timeout and restarts its server after a throw (L-1108-25)

## Summary
- **Approval:** the owner, 10 Nov: D-1110-06 ("I agree to your recommendations in lessons i responded", L-1108-25);
  D-1027-15 (rules as checks).
- **Base:** `fix/0.3.3-mh1` from `origin/integration/0.3.3` (ad50f1d7). Push only it; never merge, no PR.
- **Scope:** `serverClient` in `mcp/test-0.2.9.mjs` (timeout per call, restart after a throw, same shape), new
  `mcp/test-0.3.3-mh1.mjs` (+ row in `tests.json`), a longer explicit timeout in any suite whose slowest call needs it.
- **Expected checks:** mh1 suite red first on ad50f1d7 (the next call after a hang does not answer); every suite that
  imports serverClient and the 12 split guards unchanged; `node scripts/check-modules.mjs --strict`.
- **Resume:** DONE 2026-11-10T15:30Z. CI green: https://github.com/Antnioo/DataArcus/actions/runs/42842558065 on cd8d34554aa567a2cb13c140ef7e7657273ed1a9 (Linux and Windows; macOS skipped by the workflow).

## Plan
1. Suite mh1: a made-up call that hangs the server (a hostile input) or kills it, then a normal call must answer in time.
2. serverClient(ROOT, env, { timeoutMs = 10000 }): `c` is a getter on the live client; `call` passes the timeout, and on a
   throw closes the client and starts a fresh server with the same ROOT and env before the next call.
3. Measure the slowest call per importing suite; pass a longer timeout where needed, with the number in a comment.

## Before -> after
- Before: `call` passed no timeout, nothing restarted the server: one hang or crash made every later call of a suite fail.
- After: `serverClient(ROOT, env, { timeoutMs })`: 10 s default per call; after a throw the next call closes the client
  (own child only, SIGKILL by its pid after a 3 s polite close) and starts a fresh server with the same ROOT and env;
  `c` is a getter on the live client; shape `{ c, call, close }` unchanged.
- mh1 (new, registered, area core): 11 checks. Red first on ad50f1d7 (the base before the change): 3 failed, the call after
  a killed server answered "Not connected", `c` did not move, listTools threw. K kills the child (all platforms), H stops
  it with SIGSTOP (not on Windows; K covers Windows).
- Timeouts measured: all 123 suites that import serverClient run once on Linux with the slowest call timed; all PASS
  (sweep-s1 failed only because mh1 was not yet registered, then PASS). The slowest call is wn1's 3.0 s (3 s approval wait),
  then hr2 0.99 s, dt1 0.95 s; every other under 0.9 s. wn1's three servers that wait for an approval get `timeoutMs: 40000`
  (comment in the file, L-1104-02). No other suite changed; no fixture moved.
- The 12 split guards (sp1, 13, 15, 2, 23, 27, 3, 4, 43, 44, 7, 9) PASS. check-modules --strict, test-contracts,
  check-agent-memory PASS; lint 0.

## CHANGELOG line
none (tests only).

## Decisions I made
- A throw marks the client broken and the restart happens at the start of the NEXT call, so the failed call still returns its
  own { err, t } and no suite changes.
- A suite that calls `s.c.callTool` directly (RV1's raw) keeps its own timeout; a throw there does not trigger the restart.
- The Linux-only SIGSTOP check is skipped on Windows (no SIGSTOP); the kill check runs everywhere.
- WORK.md: trimmed two old job lines to fit the 3,200 cap with the MH1 line.

## For the owner
none

## Risky changes
none (test harness only).

## For the laptop
none

## Seen, not in scope
- RV1's `raw` and any suite that uses `s.c` directly does not restart after a throw.
- Other suites that start servers without serverClient are not covered.

## Lessons for the reviewer
- `git checkout <file>` to undo temporary instrumentation also drops uncommitted real edits: commit first, instrument second.
