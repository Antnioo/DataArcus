# RV1 (0.3.2): every tool's input-validation error is capped (Codex release-review-032, B-392), and the two promises say what the code does (B-393)

## Summary
- **Approval:** the owner, 8 Nov: D-1108-03 (testers after 0.3.2), "codex is free we can run something we really need"
  (the release review); D-1108-09 "yes to both, go with your recommendations" (B-393 wording narrowed, in RV1).
- **Base:** `fix/0.3.2-rv1` from `origin/integration/0.3.2` (225498d2). Push only it; never merge, no PR.
- **Scope:** part 1: `mcp/lib/tool-answer.mjs` (`guardInputErrors`, `inputErrorSaid`), `mcp/server.mjs` (one call after
  the tools are registered), `mcp/tools/check_report.mjs` (`checks` max 50), `mcp/tools/generate_theme.mjs` (`folder`
  max 500), new `mcp/test-0.3.2-rv1.mjs` (+ row in `tests.json`). Part 2: the words of the two promises (list below).
- **Expected checks:** new suite rv1: about 467 checks through the real server (stdio), red first on 225498d2 (14 failed
  there: check_report `checks` 470,031 characters at 3,000 items, plan_layout `pages` 187,971 and 423,861, generate_theme
  `folder` with a 150,000-character string HANGS the server (no answer in 10 s), the shape checks S3-S6). All other suites
  unchanged by a byte (the pinned fixtures); `agent` suites re-checked for the instructions' last line.
- **Resume:** DONE. CI green: https://github.com/Antnioo/DataArcus/actions/runs/42489282364 on d25ec6ca611dd33198b90df20d92de05ef7b6ecb

## Plan
1. Red first: `test-0.3.2-rv1.mjs` on 225498d2 (done: red).
2. Fix at the protocol boundary once: `guardInputErrors(server)` wraps the SDK's `validateToolInput` (on the instance, never
   node_modules): on a validation failure it re-parses with the tool's own zod schema and answers with `inputErrorSaid`:
   the tool, the number of problems, the first 5 (path, message, what was got, a value cut at 40 characters), "and N
   more", "Fix the input and call again". A message the SDK made that is already 1,500 characters or less is kept as it is
   (older suites pin those words: golden task 9, mr1 S1, sp43 P2); only a longer one is rebuilt. `createToolError` is wrapped too, so every error the SDK makes is scrubbed and
   capped as safe()'s are (an unknown tool with a 100,000-character name).
3. Bound the two schemas whose real input is bounded.
4. Part 2: the two promise sentences in every statement; the hit list below.

## Part 2: where the two promises are stated (`git grep -n -i -E "data value|before you approve|nothing is written"`, plus the
## phrases "never sends", "metadata only", "never returns data")
Changed (same two sentences, the owner's words of D-1108-09, short):
- ARCHITECTURE.md:32-40 (both invariants, with the code that does it); CLAUDE.md:22 (line 22 only).
- mcp/README.md: the top paragraph, the Safety section (both promises first), the `read_model` row, the data bullet,
  install step 4 (the working folder is made empty on first start).
- mcp/PRIVACY.md: "On one page" opens with both promises; section 3's first bullet.
- mcp/lib/agent-text.mjs:53, the server's instructions (last line): both promises, compact (the instructions are held to 2,200 characters, A7-4, and had 5 to spare: now exactly 2,200; to fit, "Files are read locally", "writes are new files" and "a failed one removes what it made" left this line; the README and PRIVACY still say them).
- power-bi-mcp/index.html `beta.safe.model` and `beta.safe.data`, and the same two keys (English only) in
  assets/js/translations/beta-page.js (+ .min.js by build:min; stamps by the build; csp, ar-pages, sitemap-lastmod run).
Not changed, and why:
- The Arabic pages (ar/power-bi-mcp/index.html and the `ar` block of beta-page.js): they keep today's Arabic until the
  owner's yes. Only the script's ?v= stamp moved on the Arabic page (the build).
- mcp/CHANGELOG.md history, mcp/work/*, mcp/GOLDEN-TASKS.md, mcp/plans/*, mcp/research/*, mcp/ROADMAP.md: history or
  plans, not a statement to a user.
- mcp/docs/OWNER-RULES.md:41 (the owner's rule as he said it: "never"), mcp/PRODUCT_SPEC.md:28/48/123, mcp/TOOLS.md,
  mcp/skills/ and mcp/skills-packaging/ SKILL.md: not in this job's owns. PRODUCT_SPEC:28 and :123 already say the typed
  texts are returned; :48 ("never returns data values") and the SKILL.md lines say "data values" in the narrow sense; the
  reviewer decides whether to align them.
- code comments in assets/js/*.js and mcp/lib/*.mjs ("never a data value"): they describe what a function reads, not a promise.
- articles/article-power-bi-custom-visual-ai-checks.html:198 and articles/article-power-bi-report-ready-for-arabic.html:297
  (and their translations files) say "it never sends your data values to the AI": wider than the code in the same way.
  Not in the owns and they have Arabic copies: see "For the owner".

## Tests
- rv1: new, 467 checks (see the result line at the bottom).
- Red first: `node test-0.3.2-rv1.mjs` on 225498d2 (the test file with the source of that head) printed
  `FAIL  rv1  467 checks, 14 failed`.

## CHANGELOG line
`[0.3.2]`: every tool's input-validation error is short and capped (it was the SDK's whole message, 46,772 characters for
300 invalid items), and the two promises (no values from tables, filters, slicers or bookmarks; nothing written before
approval) are worded exactly as the code behaves.

## Decisions I made
- The guard wraps the SDK's `validateToolInput` and `createToolError` on the server instance (server.mjs calls
  `guardInputErrors(server)` after registering the tools): no node_modules edit, no per-tool code. A schema without zod's
  `safeParseAsync` falls back to the SDK's message, which `createToolError` then caps.
- Error text is English only. The Arabic wording is a draft below; shipping Arabic the owner has not approved would
  break D-1027-04. The tools' other errors take `lang` only on some tools, and an invalid input cannot be trusted to carry it.
- Bounds: check_report `checks` max 50 (12 distinct checks exist; 50 leaves duplicates alone), generate_theme `folder`
  max 500. The boundary cap holds without them. plan_layout's `pages` is in lib/report-inputs.mjs (not an owned file):
  not bounded here; the boundary cap answers it (test rv1 O plan_layout pages).
- Test cap used for "that tool's cap": ANSWER_MAX (40,000), the one constant every answer is held to; a validation error
  is also held to 4,000.
- Every hit of the grep is listed above; the owner's two sentences are used word for word.

## For the owner
- Arabic DRAFT of the data promise (not published; the Arabic pages keep today's text): «لا يرسل DataArcus إلى تطبيق الذكاء الاصطناعي أي قيم من جداولك أو عوامل التصفية أو القطاعات أو الإشارات المرجعية. النص الذي كتبته بنفسك في العناوين ومربعات النص يُقرأ كما كتبته، ليتحقق منه الذكاء الاصطناعي، ولتتم ترجمته بموافقتك إن كان لديك توأم عربي.»
- Arabic DRAFT of the write promise: «لا يُكتب أي شيء في مشاريعك قبل أن توافق على الخطة. الاستثناء الوحيد: عند أول تشغيل ينشئ DataArcus مجلد العمل الفارغ الذي اخترته إذا لم يكن موجودًا بعد.»
- Arabic DRAFT of the validation error (shipped in English only): «خطأ في المدخلات: الأداة <الاسم> رفضت N مشكلة. أول ٥ مشكلات: ... و N أخرى. صحّح المدخلات وأعد الاستدعاء.»
- Two articles still say "it never sends your data values to the AI" (power-bi-custom-visual-ai-checks p12, report-ready-for-arabic
  exploreMore.subtitle). Proposed: "it never sends values from your tables, filters, slicers or bookmarks to the AI app".
  Say yes and the reviewer brings it with the Arabic copies.

## Risky changes
- What an answer returns: an input-validation error is now our short text (tool, count, the first 5 problems with the
  value the caller sent cut at 40 characters, "and N more", how to retry) instead of the SDK's whole zod message. Only
  error answers for invalid input change; every valid call answers byte for byte as before (pinned suites).
- The server's instructions (what the AI app is told at start) change in their last line: the two promises, compact; three
  clauses of that line (files read locally, writes are new files, a failed write removes what it made) left it to stay within the 2,200 cap.
- A schema tightened: check_report `checks` max 50 and generate_theme `folder` max 500 characters (a longer folder hung the
  server before; now a short validation error).
- No security policy, approval step, file writing, network or process changes.

## For the laptop
none

## Seen, not in scope
- generate_theme with a `folder` of 150,000 characters HANGED the server (no answer in 10 s) before the bound: freeName on an
  over-long path. The bound fixes the reachable input; the loop itself (a path over the OS limit) is worth a look.
- plan_layout `pages` (lib/report-inputs.mjs) has no maxItems; the boundary cap answers it.
- The articles' statements (above).

## Lessons for the reviewer
- A first red run hung for minutes: one case (a 150,000-character `folder`) blocked the server and every later call timed
  out; the test now has a 10 s timeout per call and restarts the server after a throw.
- An untracked test file is not stashed by `git stash`: do not `rm` it afterwards to "clean up" (I lost the file once and
  rewrote it).

## Changed on purpose
- test-0.3.0-claims.mjs DS1-2 (mcp page, English): the pinned "exact metadata sentence" is now the data promise (B-393);
  the Arabic pin is untouched (the Arabic page keeps today's text). 721 = 721 checks.
- ARCHITECTURE.md is held to 5,200 characters (check-agent-memory): the two invariants are worded compactly (5,194).
- Found by CI on the first push: golden task 9, mr1 S1 and sp43 P2 pinned the SDK's old message; the guard now leaves a
  message of 1,500 characters or less as the SDK made it, so none of the three moved (no fixture re-recorded).

CI green: https://github.com/Antnioo/DataArcus/actions/runs/42489282364 on d25ec6ca611dd33198b90df20d92de05ef7b6ecb (rv1 467 checks PASS; lint 0; site config PASS; site and sp36 PASS locally)
