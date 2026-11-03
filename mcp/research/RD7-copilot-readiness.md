# RD7 (0.3.2 R&D): Arabic Copilot readiness ("prep data for AI")

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night): "Go for 10 r&ds during the night ... choose the best r&ds ideas
  that will best fit our code and make us shine"; this is the scout's brief RD7 (`mcp/research/SCOUT-0.3.2.md` on
  `rd/0.3.2-scout`).
- **Question:** can check_model_health say how ready a model is for Copilot, from its files, and draft the AI
  instructions in English and Arabic from what the model says (the Gulf calendar's weekend and Hijri columns, the
  confirmed Arabic terms), for the person to paste, never applied by DataArcus?
- **Scope:** docs and research only: this note and scratch scripts under `mcp/research/rd7/`. No product file
  changes. Nothing written to a model; made-up models in `os.tmpdir()` only.
- **Base:** `rd/0.3.2-copilot-readiness` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** no product suite (no product file changes). The prototype prints one `PASS  rd7-...  N checks`
  line; expected: every `health-models.mjs` model read, a draft under Microsoft's instruction limit for each.
- **Got:** (filled at the end)
- **Resume:** (filled at the end)

## The plan
1. a) Today's code: what the 37 health rules, gulf-health, terminology and arabic-terms already give an AI lens.
2. b) Microsoft's docs: where Desktop saves the AI schema, instructions and verified answers in a PBIP; the limits.
3. c) 2-3 ways (lens `ai`, an RD3 handbook section, a TMDL script) with size and risk.
4. d) A prototype in `mcp/research/rd7/` over `mcp/fixtures/health-models.mjs`'s models (copied to `os.tmpdir()`):
   the lens's findings per model and each draft's length.
5. e) The recommendation; f) the Desktop checks (a laptop step); g) a builder brief.
