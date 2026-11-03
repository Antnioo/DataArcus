# RD10 (0.3.2 R&D): one model, two languages: an Arabic culture for the model

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night): "Go for 10 r&ds during the night ... choose the best r&ds ideas
  that will best fit our code and make us shine"; brief RD10 in `mcp/research/SCOUT-0.3.2.md` (rd/0.3.2-scout).
  WORK.md's open item "Arabic DA measures for the twin" stays the owner's (not touched here).
- **Scope:** docs only: this file and scratch scripts under `mcp/research/rd10/`. No product file changes.
- **Base:** `rd/0.3.2-arabic-culture` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** no product suite touched; the prototype is a scratch script run with `node`, writing made-up
  data in `os.tmpdir()` only and parsing its own output with `assets/js/tmdl-model.js`.
- **Expected numbers (before the work):** the sample project's model (`mcp/lib/sample-project.mjs`) has a handful of
  tables and fields; the fixed glossary drafts some, so a culture file built from *confirmed* terms only covers 0
  objects until the person approves terms; with a made-up confirmed set, coverage = confirmed / total, the rest listed
  English. The file must parse back with `tmdl-model.js` as one `cultures` entry.
- **Resume:** see the plan below; each step is a commit.

## The plan
1. (a) Read today's code: terminology sheet and memory, twin texts, arabic-names, model-script, tmdl-model's cultures.
2. (b) Microsoft Learn: translations (caption, description, display folder), locale rules, TMDL culture syntax.
3. (d) A scratch prototype `mcp/research/rd10/culture-proto.mjs`: the sample model + a made-up confirmed sheet ->
   `cultures/ar-AE.tmdl`; measure coverage, list English-left objects, parse it back, size per Gulf culture.
4. (c, e, f, g) Ways with size and risk, the recommendation, the checks (the service check as a laptop step), the
   builder brief.
