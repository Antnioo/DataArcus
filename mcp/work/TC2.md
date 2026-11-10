# TC2 0.3.3: type checking rolled out to read-report.mjs and files.mjs (A-TC1-1, D-1110-05)

## Summary
- **Approval:** D-1110-05 (10 Nov, "1 yes yes yes", A-TC1-1: roll type checking out to read-report and files); D-1108-13 for the pilot.
- **Base:** `feat/0.3.3-tc2` from `origin/integration/0.3.3` (cd4ea0c0). Push only it; no merge, no PR.
- **Scope:** `mcp/lib/read-report.mjs` and `mcp/lib/files.mjs` (comments only), the tsconfig, the tests.yml step if its path changes, `mcp/WORK.md`, this note.
- **Expected checks:** comment-stripped output of both files byte-identical to the base's (and the proof sensitive); `npm pack` list
  identical apart from the new repo files (1460 files before); `npx tsc -p <tsconfig>` exit 0; `node scripts/check-modules.mjs --strict`;
  area runs core, report, model, arabic PASS with no recording moved; mutation count before = after; lint 0; CI green.
- **Resume:** plan written 2026-11-10T11:33Z; next: JSDoc on read-report.mjs, then files.mjs, then the proof.

## Plan and numbers (measured 2026-11-10T11:33Z)
Importers recounted on integration/0.3.3 (distinct mcp/lib and mcp/tools files, relative import): model 45, read-report 31, files 15,
plain-words 14, plans 12. Order unchanged from TC1: the next two are read-report.mjs (298 lines) and files.mjs (215 lines).
Method is TC1's: `// @ts-check` + JSDoc, `@ts-expect-error <why>` for flow the checker cannot see, no cast, no code change;
typedefs from model.mjs by `import('./model.mjs').X`, never copied. Base copies saved for the stripped-output proof.
