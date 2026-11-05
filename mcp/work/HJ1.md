## Summary
- Job HJ1 (0.3.2): the model health check's two Hijri calendar lines in the owner's approved Arabic. Fenced.
- Approval: D-1105-16 (5 Nov) "Agree on suggested arabic and yes" (A-PL1-2, E1 round 5 finding 7). Lines are the owner's, written character for character.
- Branch: fix/0.3.2-hj1 from origin/integration/0.3.2 (56f1b891). Push only it; no merge, no PR.
- Scope: assets/js/gulf-health.js (GC_NO_HIJRI Arabic title and sentence), its .min.js and stamps (build), one new check block in scripts/tests/gulf-calendar.mjs. Nothing else.
- Expected checks: gulf-calendar +2 checks (title, sentence), red on 56f1b891 first; sp15-index, sp27-health, sp9-health fixtures unchanged.
- Resume point: see "Progress" below.

## Plan
1. Note (this file). 2. Test: GC_NO_HIJRI on a calendar without Hijri columns; its ar.title and ar.why equal the approved text. 3. Two replacements. 4. `npm run -s build:min`, stamps, sitemap-lastmod.
5. Area runs, lint, CI on the branch.

## Progress
(filled in as the work goes)
