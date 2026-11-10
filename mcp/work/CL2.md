# CL2 (0.3.3, the site): the Copilot-ready article's title jumps when Inter loads (B-435, AUD-062)

## Summary
- **Approval:** the reviewer's brief "CL2" (10 Nov); the owner D-1110-04 ("keep everything going"), D-1104-12 (fix at the
  source), D-1027-03, D-1027-12, D-1029-03 (Arabic untouched). Backlog B-435 (night audit AUD-062).
- **Base:** `fix/0.3.3-cl2` from `origin/integration/0.3.3` at 00f7f702. Push only this branch; never merge, no PR.
- **Scope:** `assets/css/style.css` (the one stylesheet that defines `Inter Fallback` and `.article-header h1`) and
  its `.min.css`, a new case in `scripts/tests/site.mjs` (the AUD-002 font-swap block), the `?v=` stamps, sitemap.xml
  lastmod lines, this note, one WORK.md line. No page words, no Arabic text, no font file.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; site suite (new case red on the base first);
  `npm run lint` 0; check-min; `node scripts/test-site-config.mjs`.
- **Resume:** fix and test done, pushed; waiting for CI (see the end of this note).

## Plan
1. Measure on the base (Playwright 1.63 Chromium 153, Inter from @fontsource served 500 ms late, as site.mjs does).
2. Try the metrics fix first (L-1109-03); reserve the title's height only if metrics cannot reach under 0.05.
3. Test: the title's shift at 1400 px, 0.1 or less, the Arabic page 0.

## Measured on the base (step 1)
Note: this machine has Inter installed as a system font, so "Inter blocked" falls through to the system Inter. The
measure declares an `Inter` @font-face (as the real Google CSS does) so the system font cannot stand in.

Playwright 1.63, Chromium 153, measured 2026-11-10T11:03Z. Inter (@fontsource, the same font) 500 ms late, as site.mjs serves it.
Before -> after, CLS of the page (title height with Inter, px):

| page | width | before | after |
|---|---|---|---|
| copilot-ready-check | 1280 | 0.006 (3 lines, 172.8) | 0.006 |
| copilot-ready-check | 1400 | 0.258 (3 lines -> 2, 172.8 -> 115.2) | 0.089 (172.8 held) |
| copilot-ready-check | 1600 | 0.197 | 0.068 |
| copilot-ready-check | 1920 | 0.137 | 0.048 |
| model-health-check | 1280 to 1920 | 0.001 to 0.003 (3 lines) | same |
| model-ai-ready | 1280 to 1920 | 0.001 to 0.003 (2 lines) | same (1400: 0.003) |
| copilot-ready-check, Arabic | 1280 to 1920 | 0 | 0 |

The audit's 58 px is reproduced: 172.8 -> 115.2 = 57.6 px, one shift at about 700 ms (Inter's arrival), the content below.
**Cause, measured:** the title in 48 px bold is 1656.1 px in `Inter Fallback` and 1633.6 px in Inter (+1.4 %); in the
856 px column (from 1400 px) greedy line breaking gives 3 lines against 2. The named cause is true. What varies between
runs: only whether the first frame comes before the local Arial finished loading (about 195 ms here; a further 0.048
shift or none), so the test counts shifts from 450 ms on, the swap.

## Why not the metrics fix (step 2 said to try it first)
- Widths of the 17 English article titles, Inter / fallback at 700: 0.983 to 1.004, so the error is per title, not one
  number. A sweep of the 650-749 face's size-adjust (x0.975 to x1.02) over 17 titles at 150 widths (300 to 900 px):
  wraps that differ 103 of 2567 at the current value, 105 at x0.995, 114 at x0.99, 128 at x1.005: the current value is
  already the best. Body text, 371 paragraphs at 4 widths, 400 weight: 46 of 1484 differ at the current value, 49 at
  x1.005, 50 at x0.995: also the best. `text-wrap: balance` and `pretty` change nothing (same 103).
- So a metrics fix cannot reach 0.05 for this title: it is the word-packing of one title, not a calibration error.

## The fix
`assets/css/style.css` and `style.min.css` (the .min.css edited by hand in lightningcss's form: `lightningcss-cli` is
not in node_modules and the sandbox refused the download; check-min covers .min.js only, so nothing in CI compares it):
from 1400 px, English only, `.article-header h1` gets `min-height: 3.6em` (3 lines x line-height 1.2). One rule in the
shared article style: no page touched, no word changed, no font file. `npm run build:min` wrote the new `?v=` stamp on
every page that loads the stylesheet.

## Tests: before -> after
- New case in `scripts/tests/site.mjs` (the AUD-002 font-swap block). I ran its code alone, because the full site suite
  crashed this sandbox's browser at 589 s on the base (a resource limit, not a result): copilot 1400, 1600, 1920 en
  <= 0.1, ai-ready 1400 <= 0.1, copilot ar 1400 <= 0.01. **Red on 00f7f702 (+ stamps only) first:** 1400 0.256, 1600
  0.196, 1920 0.136 (0.057 once: the 1920 value varied on the base, the 1400 value did not, 3 runs). After: 5 of 5
  pass, 4 runs the same (0.089, 0.068, 0.048, 0.001, 0). The full site suite is for CI to run.
- lint 0, `check-modules --strict` 0, site config 0, check-min 0.

## CHANGELOG line
- **Steadier article titles:** the Copilot article no longer jumps about 58 px when the web font loads on a wide screen.

## Decisions I made
- Reserve 3 lines (not the metrics fix) because the measure shows metrics cannot fix per-title wrapping.
- The test counts shifts from 450 ms (the swap), not the local-font frame, to remove the varying input.
- Threshold 0.1 as the brief says; the brief's 0.05 goal is NOT reached for this page (below).

## For the owner
- The Copilot page still shifts 0.089 at 1400 px (0.048 at 1920): one body paragraph (the one holding "our 7-point
  check") wraps one line apart in the fallback and in Inter, 31.7 px. A wording change fixes it (as ED1 did for the
  Health Check); this job may not change words. Say if you want that.
- Cost of the reserve: an English article with a 2-line title at 1400 px and up now has one blank line (57.6 px) under
  the title (model-ai-ready is one; I did not count the others).

## Risky changes
- The 3-line reserve changes the look of 2-line English article titles at 1400 px and up (a blank line). Not shot.

## For the laptop
none

## Seen, not in scope
- A `local()` font stands in only after about 195 ms, so the first frame can use the browser's generic font (a 0.048
  shift on some runs). Not the swap; would need the stack to name a system font.
- The full site suite crashes this sandbox's browser (589 s): run it in CI.

## Lessons for the reviewer
- A brief's cause can be true and still not the whole shift: after the title was fixed a body paragraph remained.
- "Inter blocked" does not give the fallback where Inter is a system font: declare the face and abort its file instead.
