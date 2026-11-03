## Summary
- **Approval:** the reviewer's brief "DT1" (3 Nov, B-294, HR1 and HR2's "Seen, not in scope"); D-1016-01, D-1102-02, D-1103-09.
- **Base:** `fix/0.3.2-dt1` from `origin/integration/0.3.2` at e2cf676. Pushed only this branch.
- **Scope:** the ORDER of the texts the person labels (`bilingual.texts` of plan_layout, and the same list in
  create_arabic_twin's plan, both from `textsOf`, `lib/twin-texts.mjs`). Every text, its where and its label slot
  unchanged; only the order. Not: the content of a text, the Arabic labels, the approval binding.
- **The cause (measured before any change):** `lib/twin-read.mjs:51` (readOriginal) sorts each page's visuals by
  file path, `definition/pages/<page>/visuals/<visual name>/visual.json`, and a visual's name is a random hex id
  (`assets/js/pbip-query.js:43`, `rnd()`, crypto random). `textsOf` walked the visuals in that order, so the texts
  (and the order inside each text's `where`, "title (4), field" or "field, title (4)") followed random ids. A probe
  (4 runs of B5 in fresh folders, not committed): 4 different orders of the same 49 texts. The bookmarks came in
  file order too (inventory: in memory the build's order, on disk the folder listing, by the bookmark's id).
- **The order, decided once (`lib/twin-texts.mjs`, `readingOrder`, its comment says it):** pages in the report's
  order (pages.json); on a page, its visuals top to bottom, then left to right (position y, then x), ties by z,
  tabOrder, the visual's type and its texts, its file last (reached only when everything shown is the same); in a
  visual, its texts in their place (as before). Bookmarks in the Bookmarks pane's order (bookmarks.json, read by
  readOriginal as `bookmarkOrder`), the rest by their shown name. Only `textsOf` reads in that order: the twin's
  pages, files and writes keep readOriginal's order (sp3: create_report's answer and its 204 files byte for byte).
- **Expected checks:** (written first) dt1 red on e2cf676 (D1, D2), green after; hr1 10, hr2 7 green; no other line
  moves unless it reads the texts' order. Sizes not above the base's. **Got:** dt1 red on e2cf676 (7 of 7: D1 x2, D2,
  D3, U1-U3), 7 checks green on 26fd6a9f; hr1 10, hr2 7. Two other suites moved, by this job: sp3 R5 and sp1 P6 (see Results).
- **Answer size (L-1102-06), B5, 5 runs each:** dt1's flow (hr1's person): the step before the Arabic texts
  36,481-36,528 on the base (10 runs) -> 36,475 every run; the plan with an id 37,029-37,065 -> 37,019. The probe's
  flow: 37,774-37,902 -> 37,774; 36,169-36,195 -> 36,156. Never grows; one number per step.
- **State: DONE.** CI green: https://github.com/Antnioo/DataArcus/actions/runs/41679003262 on db206ce2.
- **Resume:** none; the reviewer's merge.

## Results
- Commits: 6774c79 (the plan), 67c9d907 (the guard red, in `ignored`), 26fd6a9f (the code, dt1 in `suites`, sp3's R5
  plan entry, CHANGELOG), 10f42ef3 (merge of origin/integration/0.3.2 at 0c6ad5d0, HM2: no conflict), then WORK.md and
  this note; db206ce2 (sp1's P6 value, after CI run 41673663474 failed on it: linux and windows sp1 P6; macOS shards 1-2
  cancelled with no FAIL line, no rerun needed as the whole run was made again).
- Line counts: lib/twin-texts.mjs +21 -2; lib/twin-read.mjs +5 -1; test-0.3.2-dt1.mjs 0 -> 148 (new); tests.json +1;
  fixtures/sp3-answers.json and sp1-answers.json 2 values each; CHANGELOG.md +2; WORK.md's 0.3.2 line names DT1.
- sp3 R5 ("bilingual"), the one expected value this job changed: plan_layout's answer 24,021 -> 24,008 characters, a
  new sha256. Measured (both answers dumped, SP3_DUMP): the same 24 texts and the same 6 terminology rows, in the new
  order (the sheet follows the texts), and one mark that follows the order: "Total Sales" (a field and a chart title)
  is said `field: true` only when its first place is the field (see Seen 1). create_report's answer and the written
  files: unchanged (the recorded sha256 of both kept).
- sp1 P6 ("bilingual", found by CI run 41673663474, the core area I had not finished locally): plan_layout's answer
  26,114 -> 26,254 characters, a new sha256. Measured (dumped, SP1_DUMP, base and after): the same 24 texts, the same
  terminology rows and the same 25 notTranslated (the order of each one's where aside), the same English titles in
  planProblems, in the new order; the two first-place field marks (Seen 1); and `terminology.askNext`, the first
  missing term asked, is now the first field a person reads ("Total Sales", 4 places listed) instead of "Product"
  (2 places): the +140 characters. That choice followed the random order before (sp1's ids are seeded). The B5 plan,
  the one near the cap, did not grow (above).
- Before the merge, on 26fd6a9f: report 57 suites, arabic 15, checker 8, twin 31 passed; dt1, hr1, hr2,
  bilingual-report (33), fx1 (22) and sp3 (10) three times each (sp3 twice), all PASS. Lint: exit 0.
- After the merge (10f42ef3 and on): report 57, arabic 15, checker 8, twin 32 suites passed; sp1 11 checks. Lint: exit 0.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/41679003262 on db206ce2 (every shard, Linux, Windows, macOS).

## CHANGELOG line
"The texts to label in Arabic come in one order: the bilingual plan and the Arabic twin list the texts the way a
person reads the report (page by page, top to bottom, then left to right), the same on every run."

## Decisions I made
- The fix is where the order is made for the texts (`textsOf`), not in readOriginal: the build, the copy and the
  writes read readOriginal's visuals too, and changing that order would move the written files (sp3 proves they
  did not move).
- Reading order is y then x (an English page, left to right): the texts are the English report's. A tie (the flip
  card's front and back on one place) by z, tabOrder, type, then the texts shown; a file name only when all of that
  is equal (then the two give the same texts, so the list does not change).
- Bookmarks: the pane's order (bookmarks.json), not the files'; D2 renames them in reverse to prove it.
- Tried and dropped: saying `field: true` on a wording that is a field anywhere (order-free). It changed a text's
  content (outside "only the order") and grew B5 by 65 characters (36,540, over the base's 36,528): kept as Seen 1.
- D2 renames every page id, visual name and bookmark name of a written report to new ids in the reverse order of
  the old names, every mention in the report's JSON replaced (as fx1 renames, but all of them): the reader that
  sorted by name met them backwards.

## For the owner
none

## Risky changes
- The texts' order in create_arabic_twin's plan changed too (the same list): a twin plan listed in pages of texts
  (textsFrom, moreTexts) puts a text on another page of the list than before; the same texts, labels and approval.

## Seen, not in scope
0. The local core area did not finish within this session's 10-minute command limit (test.mjs); CI ran it.
1. In `bilingualSaid` (`lib/plan-disclosure.mjs`), a wording shown in several places takes `field: true` and
   `spaces` from its first place only: now stable (one order), but "Total Sales" is a field and is not marked one
   when its title comes first. Order-free would add about 65 characters to B5.
2. The texts within one page are listed by kind in passes (the visuals' own texts, then Power BI's automatic
   titles, then titles from a measure, then the phone's), each pass in reading order: not one pass per visual.

## For the laptop
none (no visual, position or written file changes; only the order of a list in the plan).

## Lessons for the reviewer
- A list built from a Map or Set keeps the order it was filled in: when the filling walks files by name and the
  names are random ids, the order is random though every run reads "the same" report. sp3's seeded ids hid it.
- A text merged from several places that takes a property from its first place is as unstable as the order.
