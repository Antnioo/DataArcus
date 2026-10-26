# Fixtures of scripts/check-release.mjs (PR1, 0.3.1)

`match/` is a made-up release, 1.2.3 of 2 November 2026 with a made-up SHA-256, named the same way in each of the
files the check reads (the same paths as in the repo, cut to their download lines); `registry.json` is the MCP
Registry's answer for it. `mcp/test-check-release.mjs` checks this set (0 mismatches) and copies of it with one thing
changed (a wrong hash, the CHANGELOG still unreleased, the section hidden, the date left as the placeholder).
