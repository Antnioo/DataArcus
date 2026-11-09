# DP1 (0.3.2): the MCP's package updates (Dependabot #107-#110, audit AUD-046)

## Summary
- **Approval:** the owner's D-1102-02 (2 Nov, "yes switch and start both"); D-1016-01 (one place per version);
  D-1101-01 (0.3.2 starts with the rest found). CI on the branch is the gate (no local 40-minute full run).
- **Base:** `feat/0.3.2-deps` from `origin/integration/0.3.1` at e75d432. Push only this branch; never merge. It merges
  only after 0.3.1 ships. The Dependabot PRs #107-#110 are not touched (the reviewer closes them).
- **Scope:** mcp/package.json (the SDK pin 1.32.1 -> 1.32.2) and mcp/package-lock.json (body-parser 2.3.0 -> 2.4.0,
  fast-uri 3.1.8 -> 3.1.9, ip-address 10.7.2 -> 10.7.5, qs 6.16.0 -> the first fixed version if `npm audit` lists it).
  A new suite `dp1` (area platform): the pins as written once, in package.json, and the audit's fixed floors.
- **Expected checks:** `dp1` about 8 checks; its 4 floor checks red on e75d432 first, the pin checks are guards.
  Every other suite unchanged; the full suite 136 -> 137. `npm audit --omit=dev`: 4 (1 high, 3 moderate) -> 0.
  node_modules: 54196 KB before, about the same after. No product code change (the SDK's notes below need none).
- **Got:** commit 6c1e662: SDK 1.32.2; lock: body-parser 2.4.0, fast-uri 3.1.9, ip-address 10.7.5, qs 6.17.1. `dp1`
  8 checks, red on e75d432 first (4 of 8 failed: the floors; D1, D2 x2, D4 guards). `npm audit --omit=dev`: 4 (1 high,
  3 moderate) -> 0. node_modules (fresh `npm ci`): 54196 KB -> 54312 KB. Areas: see "Tests" below. Lint 0.
- **State: DONE.** CI green: https://github.com/Antnioo/DataArcus/actions/runs/41396585299 on 3b83592 (Linux, Windows,
  macOS). After the last code commit 6c1e662 only this note changed.
- **Resume:** the reviewer's merge after 0.3.1 ships; then close Dependabot #107-#110.

## Plan
1. Read mcp/package.json: the runtime dependencies are exact pins (no caret), the dev one (pngjs) a caret range.
   The SDK goes to the exact `1.32.2`; the four transitive packages move in the lock only (`npm audit fix`, then the
   lock checked by hand: only those packages change).
2. The SDK 1.32.1 -> 1.32.2, read from the tag's history (`git log 1.32.1..1.32.2`; the release page answers 403 to
   this session) and from the two published packages compared file by file:
   - fa56d815 "allow registering after connect() when the capability was declared" (#2958): McpServer's
     constructor now installs the tools, resources and prompts handlers when `options.capabilities` declares them.
     DataArcus builds `new McpServer({ name, version }, { instructions })` (server.mjs:30), declares no capabilities
     there and registers every tool before `connect()`: this path is never taken. No change, no test of behaviour.
   - 6919e952 "explicit | undefined on Transport optional properties" (#2814): TypeScript types only (.d.ts);
     no JavaScript changes. Nothing for us (plain .mjs, no type check).
   - 3b73021a the version bump.
   Tool registration with a zod object as inputSchema (MR1, tool-inputs.mjs), elicitation, the stdio transport and
   the error shapes: the published JavaScript is byte-identical outside dist/*/server/mcp.js (the constructor lines
   above). Nothing to change, nothing to test red first.
3. Where a version is written: only mcp/package.json pins these (searched: README, packaging notes, the skills'
   plugin files, the workflows). The CHANGELOG's "MCP SDK 1.32.1" (0.3.0's entry) and older work notes are history
   and stay. The new suite reads every pin from package.json; the only numbers it holds are the audit's fixed floors
   (a different fact: the first safe version, not the pin).
4. `cd mcp && npm test -- platform core`, lint, CI on the branch.

## Before -> after
| Package | Before | After | How |
|---|---|---|---|
| @modelcontextprotocol/sdk | 1.32.1 | 1.32.2 | package.json exact pin (the only place it is written) |
| body-parser (SDK's express) | 2.3.0 | 2.4.0 | lock (`npm audit fix`); it also asks content-type ^2.1.0, iconv-lite ^0.7.3 (already met) |
| fast-uri (ajv) | 3.1.8 | 3.1.9 | lock |
| ip-address (SDK's express-rate-limit) | 10.7.2 | 10.7.5 | lock |
| qs (body-parser) | 6.16.0 | 6.17.1 | lock: `npm audit` listed it; the fix within body-parser's range |

`npm audit --omit=dev` before: body-parser high (GHSA-27r3-jxmh-p828); fast-uri moderate (4 advisories); ip-address
moderate (GHSA-rxp7-6hxx-x8q5); qs moderate (GHSA-6pq8-jhm2-2vcw): "4 vulnerabilities (3 moderate, 1 high)". After:
"found 0 vulnerabilities". None of the four is reached over stdio (the HTTP server packages are the SDK's, unused).
`npm ls --omit=dev` exits 0; 109 packages installed (unchanged count).

## The SDK's notes, per change (1.32.1..1.32.2)
- #2958 registering after connect(): only McpServer's constructor, when its options declare capabilities. Ours
  declare none (`dp1` D4 keeps it so): not reached. Tool registration with zod inputs, elicitation, stdio, error
  shapes: no byte of their JavaScript changed (the two packages compared: only dist/*/server/mcp.js, its maps, and
  transport.d.ts differ).
- #2814 `| undefined` on Transport's optional properties: types only. Nothing.
- No product code change.

## Tests
- New: `dp1` (platform) 8 checks, red on e75d432 first. No other suite's expected number changed.
- Areas after 6c1e662: platform + safety 19, core + model + checker 29, report + arabic 57 suites passed.
  (glass-tables N0 first failed only in this session's shallow clone, its base commit cba24a5 missing; passed after a
  deeper fetch.)
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/41396585299 on 3b83592.

## CHANGELOG line
- **Package updates:** the MCP SDK 1.32.2 and fixed versions of four packages it brings (body-parser, fast-uri,
  ip-address, qs), so a security audit of the MCP's packages finds nothing.

## Decisions I made
- The CHANGELOG line stays here, not in mcp/CHANGELOG.md: its [Unreleased] is still 0.3.1 being finished; the
  reviewer adds it under 0.3.2's heading when this merges (no conflict with laptop part 11).
- qs moved to 6.17.1 (what `npm audit fix` chose inside body-parser 2.4.0's `^6.16.1`), not held at 6.16.1.
- The floors in `dp1` are the advisories' first safe versions, not the pins, so a later bump never edits the test.
- The release page answered 403 to this session; the notes were read from the tag history and the two npm packages.

## For the owner
none

## Risky changes
none (packages only; no security policy, approval, writing, answers, network or process code changed; no check removed)

## Seen, not in scope
- The CHANGELOG's 0.3.0 entry says "MCP SDK 1.32.1": history, left as is.
- audit-8 A8-9 ("declared = locked") is now a test (`dp1` D2) for every runtime pin.

## Lessons for the reviewer
- Compare the published packages (`npm pack` both, `diff -r`): the shipped JavaScript is the truth, release notes a guide.
