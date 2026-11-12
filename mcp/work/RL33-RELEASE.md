# 0.3.3: the release checklist (RL33, written 2026-11-12T14:24Z)

## Summary
- **Approval:** the owner D-1112-04 (12 Nov); the job is RL33 (`mcp/work/RL33.md` holds its plan and results).
- **Base:** `release/0.3.3-rl33` (integration/0.3.3 at 624357f0 plus RL33's commits), the release candidate.
- **Scope:** what is done, what the owner clicks, what is held, the open items. DataArcus main changes only by his click.
- **Expected checks:** tests.yml green on Linux, Windows and macOS on the branch's last code commit (RL33.md's line).
- **Resume:** the reviewer opens the pull request to main; then "What the owner clicks".

## The cut
- The cut is integration/0.3.3 at 624357f0 (WF3's merge, 12 Nov): what RL33's last CI run tested on three systems.
- RX1 (`feat/0.3.3-rx1`, the report writer: alt text, bookmarks) is not in the cut: no such branch was on origin at
  2026-11-12T14:24Z. It joins 0.3.3 only if the reviewer merges it into integration/0.3.3 before he opens the pull request to
  main; then this branch takes integration in again, the CHANGELOG gets RX1's line, and tests.yml runs once more on
  Linux, Windows and macOS. Otherwise RX1 is 0.3.4's.

## Done
- The version says 0.3.3 in every place the build and the server read: `mcp/package.json`, `mcp/package-lock.json`
  (its two own fields), `mcp/PRIVACY.md` ("Checked against 0.3.3"); `mcp/server.mjs` reads package.json; the
  CHANGELOG's newest section is "## [Unreleased]: 0.3.3" (the form the package build accepts for a candidate).
  They were already 0.3.3 on integration: RL33 changed none of them.
- The CHANGELOG's 0.3.3 section checked against the 44 job merges since 0.3.2 (`git log --merges --first-parent`):
  25 jobs had lines; 2 user-facing changes had none and got one (the PL-300 practice questions, the article
  title); 17 change nothing a user sees (tests, CI, builder tools, type checking, research notes). One number was
  wrong and is now measured (the tool list: 60,513 characters).
- tests.yml on Linux, Windows and macOS on the last commit: see the "CI green" line in `mcp/work/RL33.md`.
- macOS now runs on a `release/*` branch (D-1104-19), so a release branch is read on three systems before main.

## What the owner clicks, in order
1. The pull request to main, opened by the reviewer from the release branch (as #117 for 0.3.2): merge it.
2. The package: built by the private engine's packaging step from `mcp/` as it is on main (this repository holds no
   release workflow: `.github/workflows/` has tests, coverage, indexnow, microsoft-watch, privacy, schemas-refresh
   and the two weekly bots). So the laptop way, as for 0.3.1 and 0.3.2: build `dataarcus-0.3.3.mcpb`, install-test
   it, publish it as v0.3.3 on Antnioo/dataarcus-releases with its size and SHA-256.
3. After the file is public, one small job (as RL031 and RL032L, #115 and #121) flips the release-day places, then
   `node scripts/check-release.mjs --version 0.3.3 --live` must pass (today: FAIL 29 of 50, by design).

## Release-day places (they say 0.3.2 until a 0.3.3 file exists; nothing to do before)
- `README.md` line 46 (the tag and "download 0.3.2").
- `mcp/README.md` step 2 (the file name, three times, and "for 0.3.2,").
- `power-bi-mcp/index.html`, and `ar/power-bi-mcp/index.html` through `node scripts/ar-pages.mjs --write`.
- `assets/js/translations/beta-page.js` (English and Arabic: the button, the tag, the file name) and its `.min.js`.
- `mcp/skills-packaging/.claude-plugin/marketplace.json`, `.github/plugin/marketplace.json`,
  `plugins/dataarcus/.claude-plugin/plugin.json` (version and the .mcpb address), `.github/plugin/plugin.json`,
  `mcp/skills-packaging/README.md`.
- `mcp/CHANGELOG.md`: the heading becomes "## [0.3.3]: <the day>" with a one-line "In short" above the list.
- The MCP page has a "What's new" section for 0.3.1 only (`id="new-031"`); a 0.3.3 section would be new public
  words in English and Arabic: the owner's to ask for.
- The MCP Registry entry (check-release reads it with `--live`).

## Held (not in 0.3.3 as shipped; each waits for the owner)
- Arabic, drafted and not approved (D-1109-07); the product answers in English in each place:
  the Impact check's 8 texts (HX2), the brief check's 11 verdict words (OX2), like for like's 4 texts and the two
  words «مقارنة غير متكافئة» and «مقابل» (IX1, IX2; after 18 Nov), the filters "none" plan sentence (FB4), the Health
  Check's 3 "did not read" texts (AU1), the whole Arabic page of tools/gulf-like-for-like.html (IX4: English only, no
  /ar/ copy, off the Arabic hub), «لم يُكتب شيء:» and its about 70 sentences (LG2), the "no working folder" error
  (WE1), a wrong name in a folder with no model (AT1), and RL33's build page words (below).
- Public sentences without proof yet: the "one value on every row" sentence (OX2: after the laptop run), "can only
  show other numbers if the data changed" stays "by rule" (HX1: six Desktop runs), the like-for-like page's one-line
  claim (IX4), "still being tuned" on three layouts (FB1).
- The .mcpb keeps `win32` until one real Mac run (P1, in force in WORK.md).

## Known open items (ids)
- Laptop, one batched run, none recorded yet: FW1 (the folder window sentence), FT1 and FT2 (Tahoma in tables and
  cards, the twin too), AT1 (the Arabic approval page's first line at phone width), FB1, FB2, FB3, FB4 (every page
  with a side rail is placed differently: not yet seen in Desktop), LX1 (a one-to-one relationship), SN3 (FORMAT of
  1E21), HX1 stage 4 (six runs), OX2 (the rule on a made-up model), IX2 (like for like on a real project).
- Owner's decisions open: FB3 (look a, b or c for a low first row), IX2 (likeForLike together with the Arabic lens),
  OX2 (does a split chart answer a total question), TL1 (TOOLS.md as a resource), CL2 (the Copilot article's last
  shift needs a wording change), L6 "Seen" 1 (Arabic DA measures), C (the beta task list's line).
- Data: Umm al-Qura dates end at Ramadan 1452, so 2031 and later say "not known" (IX2, IX4).
- Dated: `.well-known/security.txt` expires 2027-10-06 (SN3: renew before 6 Sep 2027).
- Seen and not fixed, a user can meet them: B-308 / AUD-052 (a date table named only with «عام» words), SN4 (a
  too-deep folder is not said in read_report), DB2 (a report name of only spaces), HC2 (no sort column for an Arabic
  Hijri month name), HX2 and OX2 (the tool list is 487 characters under its cap of 61,000: the next option needs room).
