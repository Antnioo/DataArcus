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
- **Got:** (filled at the end)
- **State:** plan pushed; work next.
- **Resume:** apply the bumps, write `dp1`, the area runs, lint, CI on the branch.

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
