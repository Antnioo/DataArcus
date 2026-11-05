## Summary
- **Approval:** the brief "SM1 (0.3.2)" (5 Nov); the owner D-1104-14 ("add the security mutants to DD1 too", B-329),
  D-1104-18 (the mutants are DD1's last step before FN1). Tests only.
- **Base:** `feat/0.3.2-sm1` from `origin/integration/0.3.2` at cd7392f. Push only this branch; never merge, no PR.
- **Scope:** 10 mutants in `mcp/test-0.3.1-mutation.mjs`: 8 on `mcp/lib/approval-http.mjs` (AH), 2 on
  `mcp/lib/check-redact.mjs` (RD); a missing guard case only where no suite kills one. Product code is read only.
  D-realIn and R-ancestors (the readers' containment) stay as they are. Not in this job: B-330, FN1.
- **The 10 mutants:**
  - AH-host (:31) the Host check never true; AH-link (:32) the link pattern unanchored and any length (any path holding
    `/approve/<secret>` is looked up); AH-expiry (:34) an expired window answers; AH-method (:36) any method is a click;
    AH-origin (:41) the Origin / Sec-Fetch-Site rule always passes; AH-body (:44) a body over 1,000 bytes is read;
    AH-once (:47) `!w.decided` dropped; AH-revoke (:69) revoke keeps the secret's lookup.
  - RD-scrub: scrub keeps quoted parts (both maskings off; paths still cut); RD-mask: maskValues returns the message.
- **Guards (first to try):** AH: test-0.3.2-sp44.mjs, test-approval.mjs, test-approval-hardening.mjs, test-z.mjs;
  RD: test-0.3.2-sp41.mjs, test-0.3.0-sweep-s1.mjs, test-0.3.0-check.mjs, test-0.3.1-tb2.mjs.
- **Expected checks:** mutation 76 -> 86 mutants, all killed (its check count up by 10); a guard suite that gets a case
  only goes up; every other suite's number as on the base; lint 0; check-agent-memory, check-modules --strict,
  check-result-lines green. No CHANGELOG line (nothing a person sees changes).
- **State:** plan pushed. **Resume:** step 2 (each mutant by hand, its killing suite written below).

## Plan (one commit each)
1. This note.
2. Each mutant on a scratch copy (the harness's own copy, `DA_MUTATION_ALL=1 DA_MUTATION_ONLY=...`), every guard run:
   the killing suites written below, or "none".
3. For every "none": the missing case in the suite that owns that check (made-up request or report), red with the
   mutant, green without.
4. The 10 mutants in test-0.3.1-mutation.mjs (a comment naming D-1104-14 and B-329); PASS with 86 mutants.
5. merge origin/integration/0.3.2 once if it moved, `npm run build:min`, every check, tests.yml on this branch.

## Step 2: each mutant by hand (the harness's copy, `DA_MUTATION_ALL=1`, every guard; base cd7392f)
| Mutant | Killed by (every guard run) |
|---|---|
| AH-host | test-0.3.2-sp44 (H1 wrongHost), test-approval (W-03 rebound Host) |
| AH-link | test-0.3.2-sp44 by V2 only (the source text of the pattern): no behaviour; L8 added (step 3) |
| AH-expiry | test-0.3.2-sp44 (L1), test-approval (W-07) |
| AH-method | test-0.3.2-sp44 (H1 wrongMethod: a PUT approved) |
| AH-origin | test-0.3.2-sp44 (H1 wrongOrigin), test-approval (W-03) |
| AH-body | test-0.3.2-sp44 (L5: the 70,000-byte body decided) |
| AH-once | test-0.3.2-sp44 (H1 secondClick), test-approval (W-04 the later "Not now") |
| AH-revoke | test-0.3.2-sp44 (L2: the old link opens the new window) |
| RD-scrub | test-0.3.2-sp41 (X1, K answers) |
| RD-mask | none (sp41, check, tb2 pass): X2 added (step 3) |
test-approval-hardening and test-z kill none of the AH mutants (they reach the gate in plans.mjs, not the HTTP side).
test-0.3.0-sweep-s1 can't be a guard: on the copy it fails its baseline (it runs `scripts/check-literal-requires.mjs`,
which the copy does not hold); left out of RD's guards.
