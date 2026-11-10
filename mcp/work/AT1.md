# AT1 (0.3.3): two approved Arabic texts (B-429, B-449)

## Summary
- **Approval:** the owner, 10 Nov, D-1110-07 "Yes to B-429 wording and LG2's 3 Arabic drafts". D-1109-07, D-1027-03/04 bind any Arabic text; the approved lines ship byte for byte.
- **Base:** `fix/0.3.3-at1` from `origin/integration/0.3.3` at 00ed5d63. Push only this branch; never merge, no PR. LG2 (test-0.3.3-lg2) is not on integration yet at 2026-11-10T14:51Z: the B-449 test is a new test-0.3.3-at1 (no touch of LG2's files).
- **Scope:** `mcp/lib/arabic-names.mjs` (title template), `mcp/lib/plain-words.mjs` (folder bracket), the shared model-path error text (model-discovery.mjs and its Arabic source), tests that pin the old words, new `mcp/test-0.3.3-at1.mjs` + `mcp/tests.json`, `mcp/CHANGELOG.md`, `mcp/WORK.md`, this note.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; at1 red on 00ed5d63 first; arabic, report, core, checker areas; approval sha256 pins and TS-2 caps measured; lint 0; CI green.
- **Plan:** (1) the template lives once, in arabic-names.mjs line 37 (twin-texts.mjs calls draftText from it): change one string; each test naming «أعلى {1} من {2}» changes on purpose. (2) the header: measured on 00ed5d63 the bracket of an Arabic "in the working folder" shows the full path, or "." when no root is set; the repeated generic words did not reproduce: drop the bracket when it holds no name ("." or empty), else keep the path. (3) three Arabic errors with lang "ar" in the same source the other approved Arabic errors use; English unchanged. (4) CHANGELOG, WORK.
- **Resume:** start at "Plan" step 1; nothing is built yet.
