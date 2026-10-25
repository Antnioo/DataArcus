## Summary
- **Approval:** the owner, 25 Oct (the 0.3.1 night run): every "Seen, not in scope" item fixed, carefully. Batch SQ2 of
  [SEEN-QUEUE.md](SEEN-QUEUE.md#sq2-arabic-in-the-mcps-other-writes): L6-S2, J19-S1 (both urgent), J19-S5, A1-S4.
- **Scope:** `mcp/lib/flip-cards.mjs` (frontValue: one engine for the K/M/B words), `mcp/lib/dax-functions.mjs`,
  `mcp/lib/visual-meaning.mjs`, `assets/js/visual-replace.js` (+ .min.js), `mcp/lib/native-copy.mjs`,
  `mcp/lib/redesign.mjs`; tests in `test-0.3.1-dax-functions.mjs`, `test-0.3.0-shared-axes.mjs`, `test-0.3-redesign.mjs`.
  Not SQ1's files (pbip-page, pbip-query, pbip-sizing). SEEN-QUEUE.md: my four Status cells only.
- **Base:** `fix/0.3.1-sq2` from `origin/integration/0.3.1` (639c42b).
- **Expected checks:** dax-functions 90 -> 92, shared-axes 33 -> 37, redesign 49 -> 50; every other suite unchanged.
- **Resume:** done: all four DONE (486d97d, dc73503, ed7d53e); the reviewer reviews and merges. Laptop items below.

## Each item, confirmed on 639c42b (all four true)
- **L6-S2** `cardDax` and `storyDax` take `frontValue(mo, mref).t` without units: the Arabic KPI card picture and the
  Arabic story title say "1.25M" (Latin K/M/B). The flip cards already pass E's Arabic units (`W.ar.units`).
- **J19-S1** `axesFor` labels each panel `d.labels[g[0]].en`: an Arabic native copy's panel axis says "minutes", and
  its AED is not isolated (axis-units' Arabic label wraps Latin runs in U+2068 ... U+2069).
- **J19-S5** `replacePanels` copies the visual's container (its title) into every panel: two panels, one title twice.
- **A1-S4** the native copy writes `.platform` only when the original has one (`native-copy.mjs:84`); the redesign
  patches it only when present (`redesign.mjs:297`): a report without `.platform` gets a copy without one (the
  validator's PBIR_PLATFORM_MISSING, a "can break"), when the twin writes its own (`twin-copy.mjs:243`).

## Plan (tests first: each check red on 639c42b, then the fix)
1. **L6-S2** One engine: `frontValue(m, mref, units, plain)`; `plain` gives the unit word as DAX text (the DA
   functions escape their own text inside), without it the flip cards' picture-encoded word, as today (flip-cards
   suite unchanged). The Arabic words exported once (`UNITS_AR`, the flip cards' own `W.ar.units`). `cardDax` and
   `storyDax` take the language's units: `_s = _t & _u` in Arabic; English byte for byte as today.
   Test AR7: the Arabic card and story measures hold «ألف», «مليون», «مليار» and no `& "K"`/`"M"`/`"B"`; EN8: the
   English measures keep `& "M"` (unchanged).
2. **J19-S1** The native copy knows each page's language: `planNative` reads it with check_report's own
   `pageLanguages` (S1: buttons, links, the page's texts; else the language most pages have), and `replacementsOf`
   takes `langOf(page)`; a panel's unit is `labels[i].ar` on an Arabic page. Tests N4 (an Arabic page: the panels'
   axis titles are the isolated Arabic labels) and N5 (the English page: "AED" and "%" as today).
3. **J19-S5** Each panel's title says its unit: a title that is plain text gets " (unit)"; panels whose units are
   the same (the "ask" case) also get their place "1/2"; a title from a measure (an expression) or no title: left as is
   (Power BI titles each panel from its own fields then). Test N6.
4. **A1-S4** Both copies write a new `.platform` (the twin's `newPlatform`, the plan's logical id) when the original
   has none; the plan says it. Tests N7 (native copy) and R-PLAT (redesign): the copy holds a `.platform` of type
   Report, its own name, a UUID logical id, schema 2.0.0; the original is unchanged.
5. `npm run build:min`, new ?v= stamps on both copies of each page loading visual-replace (if any page loads it), `git
   add`, `node scripts/csp.mjs --write`; suites: report, arabic, `--keep-going` once, test-arabic-terms, check-agent-memory.

## Expected (written before any run)
- Red first on 639c42b: AR7, N4, N6, N7, R-PLAT (5 red); EN8 and N5 green before and after (guards).
- dax-functions 92 checks, shared-axes 37, redesign 50; flip-cards 62, arabic-terms 85, every other suite as today.
- Desktop: no new measurement; the texts written change (Arabic unit words, axis titles, panel titles): listed "For
  the laptop".

## Results (each item before -> after)
- **L6-S2 DONE 486d97d.** Before: the Arabic «إجمالي المبيعات» card and story title read `1.25M`. After: `1.25 مليون`
  (`ألف`, `مليار`), the number in Western digits then E's word, from the flip cards' own helper: `frontValue(..., plain)`
  and the one list `UNITS_AR` (flip-cards.mjs). English measures byte for byte as before. AR7 red -> green, EN8 guard.
- **J19-S1 DONE dc73503.** Before: an Arabic page's panels titled their axes "AED", "%" (a duration "minutes"). After:
  the page's language as check_report tells it (`filledLanguages`, one helper now shared with the Arabic lens): `⁨AED⁩`,
  `⁨%⁩`, «دقائق». English pages unchanged. N4 red -> green, N5 guard.
- **J19-S5 DONE dc73503.** Before: two panels, one title twice. After: "Sales and margin (AED)" / "(%)"; the same unit
  twice: "Sales and cost (AED · 1/2)" / "(AED · 2/2)"; Arabic «المبيعات والهامش (⁨AED⁩)». A title from a measure, or no
  title, is left as is. N6 red -> green.
- **A1-S4 DONE ed7d53e.** Before: a report without `.platform` gave a native copy and a redesign without one (a
  validator "can break"). After: both write the twin's `newPlatform` (Report, the copy's name, the plan's logical id,
  inside the plan's digest), and the plan says it (`platform`). N7 and C11 red -> green.
- Suites before -> after: report 24/24 green (dax-functions 90 -> 92, shared-axes 33 -> 37, redesign 49 -> 50, the rest
  equal); arabic 9/9 green, equal counts; full run, test-arabic-terms, check-agent-memory: running at this push (the next push records them).
- No `.min.js`, page, ?v= stamp or CSP change: `visual-replace.js` has no minified copy and no page loads it.

## CHANGELOG line
- Arabic reports: the DAX function library's KPI card and story title say thousands, millions and billions in Arabic;
  a native copy's split charts title their axes in the page's language and each says its unit in its title; the native
  copy and the redesign of a report without a .platform file get their own.

## For the laptop (texts written changed; no size or place changed)
1. An Arabic report with daxFunctions: the KPI card picture and story title show «1.25 مليون» right (the word is plain
   Arabic inside the picture's data URI, as the Arabic title already is, which the L6 lab drew).
2. An Arabic native copy with an amount and a % in one custom visual: the two axis titles (⁨AED⁩, ⁨%⁩) and the two
   titles «... (⁨AED⁩)» read right (with J19-S6, FSI/PDI in an axis title not yet seen in Desktop).
3. The native copy and the redesign of a report without `.platform` open in Desktop.

## Decisions I made
- One engine for the unit words: `frontValue` gains `plain` (the word as plain DAX text, since DA.KpiCard and
  DA.StoryTitle escape their own text; the flip cards keep the picture-encoded word), and `UNITS_AR` is the flip cards'
  own list, exported; no second copy.
- The story title (`storyDax`, the queue's evidence `:163`) gets the same fix as the card: same cause, same line kind.
- The native copy tells a page's language with check_report's own rule; "the language most pages have" moved from
  arabic-lens.mjs into `filledLanguages` (check-report.mjs) so the lens and the copy share it (the lens's answer is
  unchanged: arabic suites equal). A Hebrew page gets the English labels (no Hebrew words exist).
- J19-S5's place "1/2" only when two panels' units are the same (the "ask" case) or unknown; ` · ` as the separator in
  both languages; in Arabic the place is isolated like the unit.
- A1-S4: the plan says the new `.platform` in one line (`platform`), both copies alike.

## Seen, not in scope
1. The native copy's plan lines (`line`, `tell`, `lost`) stay English on an Arabic page (as every plan line for
   Claude); only the written report's texts follow the page's language.
2. A title from a measure (an expression) is still copied into every panel unchanged: two panels can show one dynamic
   title twice (writing a DAX suffix would change the user's measure text).
3. The redesign's `checks.filesByteIdentical` / `filesChanged` count the original's files only; the new `.platform` is
   in `exact.files` and in `platform`, not in those counts.
4. `visual-replace.js` (an engine in `assets/js/`) has no `.min.js` and no page loads it; check-min does not list it.
