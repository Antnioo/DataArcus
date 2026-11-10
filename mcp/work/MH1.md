# MH1 (0.3.3): the shared MCP test client gives every call a timeout and restarts its server after a throw (L-1108-25)

## Summary
- **Approval:** the owner, 10 Nov: D-1110-06 ("I agree to your recommendations in lessons i responded", L-1108-25);
  D-1027-15 (rules as checks).
- **Base:** `fix/0.3.3-mh1` from `origin/integration/0.3.3` (ad50f1d7). Push only it; never merge, no PR.
- **Scope:** `serverClient` in `mcp/test-0.2.9.mjs` (timeout per call, restart after a throw, same shape), new
  `mcp/test-0.3.3-mh1.mjs` (+ row in `tests.json`), a longer explicit timeout in any suite whose slowest call needs it.
- **Expected checks:** mh1 suite red first on ad50f1d7 (the next call after a hang does not answer); every suite that
  imports serverClient and the 12 split guards unchanged; `node scripts/check-modules.mjs --strict`.
- **Resume:** plan written 2026-11-10T14:29Z; next: write mh1 suite, run it red on the old client, then change serverClient.

## Plan
1. Suite mh1: a made-up call that hangs the server (a hostile input) or kills it, then a normal call must answer in time.
2. serverClient(ROOT, env, { timeoutMs = 10000 }): `c` is a getter on the live client; `call` passes the timeout, and on a
   throw closes the client and starts a fresh server with the same ROOT and env before the next call.
3. Measure the slowest call per importing suite; pass a longer timeout where needed, with the number in a comment.
