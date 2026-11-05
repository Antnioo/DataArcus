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
- **Mutants before -> after:** 76 -> 86, all killed: AH-host, AH-link, AH-expiry, AH-method, AH-origin, AH-body, AH-once,
  AH-revoke (killed by sp44, 4 of them by test-approval too), RD-scrub, RD-mask (killed by sp41).
- **Guards added:** sp41 X2 (RD-mask; 23 -> 24 checks), sp44 L8 (AH-link; 22 -> 23 checks): each red with its mutant.
- **State:** the code done; the last CI below.
- **Resume:** the reviewer reads and merges.

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
| AH-host | test-0.3.2-sp44 (H1), test-approval (W-03) |
| AH-link | test-0.3.2-sp44 by V2 only (the source text of the pattern): no behaviour; L8 added (step 3) |
| AH-expiry | test-0.3.2-sp44 (L1), test-approval (W-07) |
| AH-method | test-0.3.2-sp44 (H1; test-approval passes) |
| AH-origin | test-0.3.2-sp44 (H1), test-approval (W-03) |
| AH-body | test-0.3.2-sp44 (L5; test-approval passes) |
| AH-once | test-0.3.2-sp44 (H1), test-approval (W-04) |
| AH-revoke | test-0.3.2-sp44 (L2; test-approval passes) |
| RD-scrub | test-0.3.2-sp41 (X1, K answers) |
| RD-mask | none (sp41, check, tb2 pass): X2 added (step 3) |
test-approval-hardening and test-z kill none of the AH mutants (they reach the gate in plans.mjs, not the HTTP side).
test-0.3.0-sweep-s1 can't be a guard: on the copy it fails its baseline (it runs `scripts/check-literal-requires.mjs`,
which the copy does not hold); left out of RD's guards.

## Step 3: the missing cases (made-up inputs; red with the mutant on a scratch copy, green without)
- RD-mask: sp41 X2, a made-up page of the twin-project without its required `name`: the SCHEMA finding says
  `must have required property <value>`. With the mutant: `... property 'name'`, X2 alone fails (1 of 24).
- AH-link: sp44 L8 (in process, outside the recorded fixture): `/approve/<secret>/x`, `/x/approve/<secret>`,
  `/approve/<secret>/`, `/a/approve/<secret>`, GET and POST each: 404, nothing decided. With the mutant: all 200 and
  the POST approves; L8 and V2 fail (21 of 23).

## Step 4
The 10 in `mcp/test-0.3.1-mutation.mjs`, section 7 (D-1104-14, B-329); guards: AH sp44 then test-approval, RD sp41.
`node mcp/test-0.3.1-mutation.mjs`: `PASS  mutation  220 checks (86 mutants, all killed, 43 guard suites, 219s;
equivalent, not run: G-artifact, W-size, W-free-real)`.

## Decisions I made
- AH-link is the pattern unanchored and of any length: loosening `{20,64}` alone is equivalent (the lookup is an
  exact Map key of a 32-character secret), so the mutant drops the anchors too, which a path around the secret reaches.
- RD-scrub turns off both quoted-part maskings (the standing-alone pairs and the first-to-last) and keeps the path cut.
- A mutant killed only by a source-text check (AH-link by V2) got a behaviour case too (L8).
- The new cases sit outside sp41's and sp44's recorded fixtures (never re-recorded); each suite only goes up by one.
- Guards are the suites measured to kill; test-approval-hardening, test-z, test-0.3.0-check and tb2 killed none;
  sweep-s1 can't run on the copy (needs `scripts/check-literal-requires.mjs`).

## For the owner
none (no mutant is equivalent). One thing to know: with today's ajv messages, the parts maskValues hides are the
schema's own words (a required property's name, a pattern), not the report's text; X2 pins the rule all the same.

## Risky changes
none (tests only; no product file changed).

## Seen, not in scope
- test-0.3.0-sweep-s1 can't guard a mutant: the mutation copy holds no `scripts/*.mjs` (a later job could copy them).
- B-330 (blockOverlap, arabicMonth): not met.

## Lessons for the reviewer
- sp44's V2 is a source-text check: it "kills" any edit to the link's pattern, so a pattern mutant looked guarded when
  no request proved it. Read which check kills, not only which suite.
