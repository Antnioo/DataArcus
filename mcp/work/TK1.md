# TK1 (0.3.2, first batch): fewer tokens in every conversation, and every answer capped

## Summary
- **Approval:** the reviewer's brief "TK1" (1 Nov); the owner D-1101-01 (0.3.2 starts with the rest of the MCP
  review), his 0.3.2 order of 1 Nov (B-272 and B-273 first), D-1027-13 (0.3.1's bar not disturbed), D-1027-17.
- **Base:** `feat/0.3.2-tk1` from `origin/integration/0.3.1` at b40cb78. Push only this branch; merged after 0.3.1.
- **Scope:** the tool layer: `mcp/tools/create_report.mjs`, `mcp/tools/plan_layout.mjs` (the plan keeps
  create_report's inputs), `mcp/lib/report-inputs.mjs`, `mcp/lib/tool-inputs.mjs`, `mcp/lib/tool-answer.mjs`,
  `mcp/lib/answer.mjs`, `mcp/lib/scope.mjs`, `mcp/lib/read-report.mjs`, `mcp/lib/plans.mjs` (a read-only
  `inputsOf`; the gate unchanged), agent-facing texts that said to pass the plan's options again, the test helper
  `test-plan.mjs` (withPlans) and the suites that call create_report with plan options. A new suite
  `test-0.3.2-tk1.mjs` (area core). No `assets/js/` change. Not touched: model.mjs, twin-*.mjs, create_arabic_twin.mjs.
- **Expected checks** (before the work): `tk1` about 16 checks, red on b40cb78 first where behaviour changes:
  K1 an old-shape create_report call (design, name...) refused with "the approved plan holds" + "plan_layout again";
  K2 a real typo still gets the plain unknown-key words; K3 create_report's inputs are path and planId only;
  K4 tools/list under 70,000 characters; K5 the full flow plan_layout -> approve -> create_report {path, planId}
  writes the approved bytes (digest = the plan's); K6 a theme file changed after the go: refused, nothing written;
  K7 sample and K8 redesign written with path and planId only; F1-F2 an answer under the cap has no indentation
  (plan_layout sample, read_model), F3 the same JSON; E1 an error over 40,000 characters capped and the cut said;
  E2 a schema error with 500 unknown keys bounded ("and N more"); L1 no literal 40000 in mcp/lib or mcp/tools but
  the one constant (and report-fields' SVG design input limit, named); L2 LIMIT, READ_CAP, AIM read from it.
- **Expected numbers:** tools/list 98,360 -> about 68,000 characters (create_report 30,749 -> about 1,500);
  plan_layout sample answer 3,640 -> about 2,900 (20% spaces -> about 8%); check_report on the twin fixture
  14,487 and create_arabic_twin's plan 17,699 unchanged (already flat: compact()).
- **Other suites:** every suite that passes plan options to create_report moves to {path, planId} (named per suite
  in "Before -> after" when done); counts unchanged unless named.
- **State:** plan pushed; work next.
- **Resume:** implement B-272 (plan keeps inputs), then B-273, B-281, B-283; then the suites; then the full run.

## Measured on b40cb78 (`node scripts-measure-tokens.mjs`)
- tools/list 98,360 characters: plan_layout 32,133, create_report 30,749, create_arabic_twin 6,462, generate_theme
  5,650, add_gulf_calendar 5,444, check_model_health 5,290, check_report 3,420, read_report 3,025, suggest_fields
  2,745, approve_plan 2,316, read_model 1,104.
- Answers: plan_layout {sample:true} 3,640 (20% spaces); check_report twin fixture 14,487 (9%); create_arabic_twin
  plan on the twin fixture 17,699 (11%).

## The design (B-272)
plan_layout already pins create_report's inputs (reportPin, compared key by key by the gate). It now also keeps the
exact input object it pinned from (the plan's data, `inputs.create_report`); create_report takes path and planId,
fills the rest from the plan and recomputes the pin from it: the files (theme, logo, backgrounds, a source report)
are read again and hashed, the model is read again, the artifact's digest and the approval's binding are checked as
before. What is written is still exactly what was approved; the gate and the binding are unchanged.
