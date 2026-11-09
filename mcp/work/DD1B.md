## Summary
- **Approval:** the brief "DD1B (0.3.2)" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-18 (keep
  building it), D-1104-15 (the ledger's proposals stand as the reviewer's call for 1b and 1d), D-1016-01.
- **Base:** `feat/0.3.2-dd1b` from `origin/integration/0.3.2` at 78f7fc28. Push only this branch; never merged.
- **Scope:** one shared pure dual module `assets/js/pbir-values.js` (`window.DAPbirValues` / `self.DAPbirValues`,
  CommonJS in Node): `litText`, `litNumber`, `litBool`, `litShown`, `columnWidth`. The places of CONTRACTS.md's 1b-text
  (18), 1b-number (8), 1b-bool (6) and 1d (5) read it; their own copies go (one kept, see Decisions).
- **Commits:** plan 74a73e86; 1 the module, .min.js, suite dd1b (2efd86b); 2 the MCP readers (a796001a); 3 the browser
  engines and loaders (0d9f5000); 4 the parity test (df2fa87c); 5 ledger, MODULES.md, CHANGELOG, WORK.md (see git log).
- **Readers before -> after:** 37 named readers in 21 files -> 1 module (5 functions). 26 names stay as an alias or a
  call of it (the probe runs them), 10 are gone (their calls read the module by the question they ask), 1 kept equal.
  Disagreeing families 1b-text, 1b-number, 1b-bool, 1d -> one answer each (probe: 0 of 15, 0 of 15, 0 of 15, 0 of 12);
  1b-text's group B is its own question now, 1b-shown (`litShown`), 0 of 15.
- **Answers that changed:** see "## Answers that changed" (the brief's four, nothing else in any golden, twin or
  Desktop-measured test).
- **Test:** mcp/test-0.3.2-dd1b.mjs (suite dd1b, area twin): 545 checks. Red: with report-a11y's old `tr` back, C1 and S1
  fail (543 of 545).
- **Expected checks:** dd1b 545; every other suite's number as before; mutation 76/76; lint 0; check-contracts,
  check-modules --strict green. **Got:** exactly that (Results).
- **Merge:** integration/0.3.2 moved to 59877edb (DD1G, CI2): merged once (82e6edc7), `npm run build:min`.
CI green: https://github.com/Antnioo/DataArcus/actions/runs/41926467794 on 4c53153d
- **State:** DONE (Linux and Windows; macOS runs where the reviewer merges).
- **Resume:** none once CI is green; the reviewer reads and merges.

## Readers before -> after (each place)
| family | place | after |
|---|---|---|
| 1b-text | page-preview `lit`, `strOf`; arabic-lens `strOf`; check-language `litOfS`; dax-functions, flip-cards `textOf`; twin-pictures `lit`; redesign `L` | an alias of `litText` |
| 1b-text | report-rules `str`, report-a11y `strOf` (gave "" for nothing) | an alias of `litText`; `?? ''` at the calls that use it as a text |
| 1b-text | pbip-query `S0` (exported for pbip-visuals) | gone: pbip-visuals reads `litText(...) ?? ''` |
| 1b-text | terminology `litText`, twin-geometry `litOf`, twin-pages `lit` (fitPhoneTabs), twin-visuals `litStr` | gone: the calls read `litText`; a show or bold `litBool`, a font size `litNumber` |
| 1b-text | layout-check `litStr`, report-inventory `litStr` (group B) | an alias of `litShown` (new family 1b-shown) |
| 1b-text | mirror-policy `strOf` | kept (Decisions), pinned equal to `litText` by dd1b |
| 1b-number | page-preview `numOf`, layout-check `litNum`, report-rules `num`, flip-cards `numOf`, report-inventory `litNum` | an alias of `litNumber` |
| 1b-number | twin-visuals `num`, twin-geometry `lit0`, report-a11y `tr` | gone: `litNumber(...)` (`?? 0` / `?? NaN` where the caller wanted that) |
| 1b-bool | page-preview `boolOf`, layout-check `litBool`, report-inventory `litBool` | an alias of `litBool` |
| 1b-bool | twin-texts `isOn`, visual-replace `isTrue` | gone: `litBool(...) === true` ("on") |
| 1b-bool | report-a11y `show` | `litBool(s) !== false` ("shown"), undefined when the card does not say |
| 1d | report-rules `widthOf`, dax-functions `widthOf`, twin-text-fit `widthOf`, twin-plan `own`, twin-geometry `strip` | a call of `columnWidth(entries, queryRef)` |

## Answers that changed (made-up inputs)
| input | place | before | after |
|---|---|---|---|
| a link to the page `'it''s'` | redesign `L` (danglingOf) | "it''s": said to dangle | "it's": the page is there (dd1b C2) |
| a title alignment `'it''s'` | twin-geometry `litOf` | "it''s" | "it's" |
| a background transparency `60L` | report-a11y `tr` (backgroundOf) | 0: drawn on its own colour | 60: the page's colour (dd1b C1, B-332) |
| a column width `120L` | dax-functions `widthOf` (fitPictures) | NaN | 120 (B-332) |
| a columnWidth entry with no properties | dax-functions `widthOf` | threw TypeError | null (B-332) |

The rule also gives null where a text reader read a non-text (`12D` -> null, was "12D") and where a number reader had
NaN or 0 for nothing; each caller that used that says `?? ''`, `?? 0` or `?? NaN` itself. No suite changed its number.

## Decisions I made
- The readers take the property (`{ expr: { Literal: { Value } } }`); a value that is not an object (a theme's own
  `true`, `12`) is read as the literal's value: report-a11y's show and transparency read themes that way.
- `litNumber` reads `nD`, `nL`, `nM`, a bare number text or a JS number (finite), `1e3D` too; never `'12D'` in quotes.
- `litShown` keeps group B's answer exactly (the value as written without its type letter: `12.50D` -> "12.50").
- **mirror-policy.js keeps its `strOf`:** sp10's P10 pins mirror-policy.js to `require('./visual-types.js')` alone, and
  another test's expectation is not mine to change; handing it on through visual-types.js would only hide the
  dependency. Its answer is litText's on all 15 (dd1b P); dd1b S2 names it as the one exception. The reviewer's call:
  let sp10 P10 admit `./pbir-values.js`, then it becomes `const strOf = PV.litText`.
- report-inventory.mjs takes the module through visual-meaning.mjs (`PV`, as it takes `VT`): sp42 P4 pins its imports
  to `./read-report.mjs`, `./visual-meaning.mjs`, `node:path`.
- A name used for one question stays as an alias (the probe runs it, the ledger keeps its row); a name used for several
  questions (arabic-lens `strOf` for 'true') stays for its text calls and its other calls read `litBool`.
- The ledger and the probe changed with each step (not only in step 5) so `check-contracts` stays green between steps.
- 1b-shown is a family of its own in the probe and the ledger (the ledger's "second, named reader").
- The probe learns a name a file takes by a destructured require (`const { columnWidth } = require(...)`).
- samejob.py is not in the repo (as DD1C found): not run.

## For the owner
none (no golden, twin or Desktop-measured test changed its answer).

## Risky changes
- report-a11y's contrast check: a background transparency written with L (or M) now counts (before: 0, opaque).
- report-a11y `show`: a card whose show is an expression without a literal is now "shown" (before: not said, so the
  theme decided). Old: `String(lit(s)) !== 'false'` with undefined for no literal; new: `litBool(s) !== false`.
- Text readers that read a non-quoted value as text (`12D` -> "12D") now read none: no suite depends on it.

## Results
- On 82e6edc7 (after the merge): MCP as CI's 5 shards side by side (`DA_SHARD=k/4 node run-tests.mjs --keep-going`):
  all 5 exit 0; every suite's number as on this branch's first full run (after step 2) but dd1b 112 -> 545 and dd1g 35
  (new from integration); mutation 76/76 killed; twin-fuzz 185, sp39 96, sp10 113, sp11 21, sp42 22, dd1c 75. Website
  `npm test`: all 42 passed. Lint 0; check-contracts PASS 752 (28 families, 107 places); contracts-probe: 1b-text,
  1b-shown, 1b-number, 1b-bool, 1d one answer each; check-modules --strict PASS 1065; test-site-config, changelog-words,
  result-lines, agent-memory, literal requires, stamps 1386, check:min (128 match) PASS.
- CI run 41924821084 (on d6de7ca8): website-checks red on the sitemap's lastmod of the two theme generator pages
  (their stamps changed in the merge, dated 5 Nov UTC); `node scripts/sitemap-lastmod.mjs --write`, then every
  website-checks step run here: PASS. The note's lesson below.
- glass-tables and sp6 failed only on the shallow clone (their base commits missing), as in DD1C; after
  `git fetch --unshallow`: 113 and 13 checks, PASS.
- The base's own full run was stopped (two full runs at once passed the 30-minute limit): the numbers are compared with
  this branch's step-2 run, where no test had changed.

## Seen, not in scope
- Inline literal reads that are not named places: twin-pages `wholeTitles` (its quote test), twin-texts `goesTo`,
  pbip-visuals' `imageWidth` (parseFloat), report-a11y `hex6` and its conditional colour names, report-rules'
  `lit(...) === 'true'` checks, arabic-lens `hiddenFirst` (parseFloat), page-preview's table column widths (`columns`).
- The writers (`lit`, `str`, `bool`, `num` in pbip-query, dax-functions, flip-cards, status-icons, visual-replace): one
  question, a family for the next ledger.

## Lessons for the reviewer
- A guard test that pins a module's requires (sp10 P10, sp42 P4) decides where a shared module may be read; check
  them before choosing a home.
- A stamp change is a page change: after `npm run build:min` writes a page's stamps, run `node scripts/sitemap-lastmod.mjs`
  (website-checks runs it; the local suites do not).
- The full MCP run takes over 30 minutes on 4 cores here: run it as CI's 5 shards side by side (`DA_SHARD=k/4`).
