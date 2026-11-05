## Summary
- **Approval:** D-1105-16 (5 Nov) "Agree on suggested arabic and yes" (A-PL1-2, E1 round 5 finding 7). The two lines are the owner's, written character for character.
- **Scope:** assets/js/gulf-health.js (GC_NO_HIJRI Arabic title and sentence) and one new check block in scripts/tests/gulf-calendar.mjs. No gulf-health.min.js exists (build:min: stamps nothing to change). Fenced.
- **Base:** fix/0.3.2-hj1 from origin/integration/0.3.2 (56f1b891). Push only it; no merge, no PR.
- **Expected checks:** gulf-calendar 913 -> 916 (+3: English title, Arabic title, Arabic sentence), red on 56f1b891 first (2 of the 3 failed); sp9 16, sp15 19, sp27 25 unchanged.
- **Resume:** done. CI green: https://github.com/Antnioo/DataArcus/actions/runs/42054748024 on 1d683ebb

## Before -> after
Title: التقويم بلا تاريخ هجري -> التقويم لا يحتوي على تواريخ هجرية.
Sentence: "وبدون السنة والشهر واليوم الهجري لا يقارن التقرير إلا الأشهر الميلادية" -> "ومن دون السنة الهجرية والشهر الهجري واليوم الهجري، لا يستطيع التقرير إلا مقارنة الأشهر الميلادية". English unchanged.

## CHANGELOG line
The model health check's "no Hijri dates" finding now reads in the owner's approved Arabic.

## Decisions I made
- The test lives in the website's gulf-calendar suite (it already loads gulf-health.js), as section 7b.
- WORK.md not edited: it is already over its cap, and the job's line is this note.

## For the owner
none

## Risky changes
none (two Arabic strings and a test that gains checks).

## For the laptop
none

## Seen, not in scope
- mcp/WORK.md is 3244 characters, over the 3,200 cap in the brief (check-agent-memory counts the whole startup pack and passes).

## Lessons for the reviewer
- CI run 42052172743 went red once on Windows: the mutation suite's baseline copy of sp44 failed 22/23 (sp44 passed 23 in its own shard; nothing of mine touches the approval page). A rerun was green: sp44 looks flaky inside the mutation baseline on Windows.
- check-agent-memory needs the summary lines as "- **Approval:**", "**Scope:**", "**Base:**", "**Expected checks:**", "**Resume:**"; the brief's wording did not say so and CI went red once.
