# RD3 (0.3.2 R&D): document_model, the model's handbook in English and Arabic

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night): "Go for 10 r&ds during the night ... choose the best r&ds ideas
  that will best fit our code and make us shine"; the brief RD3 in `mcp/research/SCOUT-0.3.2.md` (rd/0.3.2-scout).
- **Question:** can DataArcus write, after approval, one HTML handbook next to the project (tables, columns, measures
  with their DAX, display folders, dependencies both ways, the report visuals that use each measure, the date tables,
  the health score) in English and Arabic, from metadata only, so a team hands its boss a document?
- **Scope:** docs only: this file and scratch scripts under `mcp/research/rd3/`. No product file changes.
- **Base:** `rd/0.3.2-document-model` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** none run by a product suite (no product file changes). Measured by `rd3/handbook-proto.mjs`
  on made-up models only (`mcp/fixtures/health-project`, the sample project written to `os.tmpdir()`): size in KB,
  time in ms, Arabic names from confirmed terms vs "not confirmed", DAX string literals masked.
- **Resume:** (filled at the end)

## The plan
1. a) Read what read_model, check_model_health and the website's Model Health Check already return or download.
2. b) Microsoft's docs: descriptions as tooltips, display folders, TMDL view, translations.
3. c) The ways: a check_model_health option, a 12th tool, a website page on the same engine; judged on the code.
4. d) A prototype handbook (scratch script, made-up models, written to `os.tmpdir()`) and its numbers.
5. e) Recommendation; f) Desktop checks; g) the builder brief.
