# AR3 (0.3.2): R&D: real Arabic shaping and bidi for previews (harfbuzzjs, bidi-js), proved on one page

## Summary
- **Approval:** the owner, D-1105-14 (5 Nov): "I agree queue them" (the research of 5 Nov: MIT tools only).
- **Base:** `feat/0.3.2-ar3` from `origin/integration/0.3.2` at 6b419ef. Push only this branch; never merge, no PR.
- **Scope:** R&D only. `lab/rd/ar3/` (package.json with exact pins, its lock, `proof.mjs`, `result.json`) and this
  note. Nothing in `assets/`, `mcp/` (but this note), `.github/`, `lab/evidence/`; no CHANGELOG line.
- **The question:** does the page preview (`assets/js/page-preview.js`, on texts the writer isolates with
  `pbip-bidi.js` / `text-measure.js`) draw mixed Arabic and English labels in the order an Arabic report reads them,
  and join Arabic letters right? Would bidi-js (UAX 9) and harfbuzzjs (OpenType shaping) do better?
- **Plan (as committed first, 188b9dc):** a made-up Gulf calendar page of 14 labels; per label the visual order of
  its characters: (a) page-preview.js's real SVG in Chromium, each character's x read back; (b) Chromium on the text
  the writer gives an Arabic report (`isolateLatin`), right-to-left paragraph; (c) bidi-js on the same inputs.
  Shaping: harfbuzzjs glyphs in Noto Sans Arabic (SIL OFL) vs Chromium's canvas in the same font (width, pixels).
- **Expected checks:** bidi-js = Chromium 14 of 14; a few labels where the preview differs; harfbuzzjs width within 1%;
  bidi-js under 5 ms a page; harfbuzzjs about 1 MB of WASM. No suite changes; lint 0.
- **Got:** the preview differs from the written order on **8 of 14** labels; bidi-js = Chromium on **42 of 42**
  inputs (the preview's text, the written text, the candidate fix's text); harfbuzzjs = Chromium shaping on
  **13 of 13** Arabic runs (width 0.00% apart, pixels at most 3.23% apart against 47.54% at least for an unshaped
  control). A candidate fix (the writer's marks kept in the preview) draws **14 of 14** in the written order.
  Cost: bidi-js 11,975 bytes min (5,801 gzip), 0.29 to 0.41 ms a page; harfbuzzjs 444,394 bytes of WASM (181,449
  gzip), 0.36 to 0.98 ms a page. `npm test` in lab/rd/ar3: `PASS  ar3-proof  111 checks`. Lint 0.
- **Recommendation:** adopt neither library now. The preview's order is our own fault (two lines of page-preview.js),
  not the browser's: fix it there (a job of its own, below). bidi-js is the pick when Node needs an order with no
  browser (a PDF, an MCP check of the writer's order); harfbuzzjs only if a PDF job finds its PDF library's shaping
  wrong.
- **Resume:** steps 1 to 4 done. **State: DONE.**
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42001437405 on 55648a8

## What was found

### Order (14 labels; `result.json` `order.rows` has every order)
Today's preview takes the writer's text, removes every bidi mark with `clean()` (page-preview.js:18, a safety rule
against names that carry marks) and draws it in an SVG with `direction="ltr"` (page-preview.js:346, T2: the anchors
are computed left to right). So each label is laid out as a left-to-right paragraph with no isolate. The writer's
text for an Arabic report is `isolateLatin`: the whole text in U+2067 ... U+2069 (BD2, measured in Desktop 2.159).

| | count |
|---|---|
| labels | 14 |
| preview order differs from Chromium on the written text (rtl) | 8 |
| of those, labels with a Latin letter (the writer wraps them) | 7 of 7 |
| of those, labels with no Latin letter (the writer leaves them) | 1 of 7 |
| bidi-js differs from Chromium: the preview's text (ltr) / the written text (rtl) / the fix's text | 0 / 0 / 0 |
| the written text: rtl paragraph differs from ltr paragraph | 1 (the unwrapped label below) |
| the candidate fix differs from the written order | 0 |

Examples, runs shown left to right as drawn (a right-to-left reader starts at the right):
- «Sales YTD الإجمالي»: preview «Sales YTD» «الإجمالي»; written «الإجمالي» «Sales YTD». The preview puts the English
  first word last for the reader.
- «Q1 / الربع 1»: preview «Q1 /» «الربع 1»; written «/ الربع 1» «Q1».
- «رمضان 1447 (Feb 2026)»: preview «1447» «رمضان» «(Feb 2026)»; written «)» «Feb 2026» «(» «1447» «رمضان».
- «KPI: نسبة الإنجاز ٪87»: preview «KPI:» «87» «نسبة الإنجاز ٪»; written «87» «: نسبة الإنجاز ٪» «KPI».
- «الهدف 12% مقابل الفعلي 9.5%» (no Latin letter, never wrapped): preview «9.5» «% مقابل الفعلي» «12» «الهدف» «%»;
  rtl «%» «9.5» «% مقابل الفعلي» «12» «الهدف». The last «%» lands at the right end, read first.
- Same in both (6): «الربع الأول 2026», «رمضان», «05/11/2026», «٪12», «عيد الفطر 20/03/2026», «الأسبوع 45 من 52».

Which is right (UAX 9): with the writer's U+2067 (X5a) the text is a right-to-left isolate: Arabic at level 1, each
Latin run raised to level 2 (I2), so the runs read right to left in their logical order, English included. The
preview's left-to-right paragraph (base level 0, P3 not used) leaves the Latin run at level 0; neutrals between it
and Arabic («/», «-», «:», «(») take the paragraph's direction (N2), so English sits on the left and is read last.
The «%» case: digits after an Arabic letter become AN (W2, the letters are AL), so W5 never joins the «%» to «9.5»;
the trailing «%» sits between AN and the paragraph's end and takes the paragraph's direction (N1, N2): left to right
puts it at the right end. bidi-js and Chromium agree on every input, so the written order is UAX 9's order, the one
BD2 measured Desktop drawing right.

### Shaping (13 Arabic runs, 97 letters, 139 glyphs)
harfbuzzjs in Noto Sans Arabic gives 73 contextual glyphs (init, medi, fina, the lam-alef rlig parts; 0 unshaped),
e.g. «رمضان»: `uni0631 uni0645.init uni0635.medi dotabovear uni0627.fina uni06BA dotabovear` (logical order;
Noto draws dots as separate marks). Against Chromium's canvas in the same font: width 0.00% apart on 13 of 13
(Chromium shapes with HarfBuzz itself), pixels 0.84% to 3.23% apart (half-ink 0.56% to 3.27%: edge anti-aliasing,
the canvas rasterizes with its own hinting); the same runs drawn unshaped differ 47.54% or more, so the compare sees
a wrong form. Today's preview has no shaping code of its own: the browser shapes its SVG text, and that is right.

### Cost (this container, Node 22)
| | bytes | gzip | time |
|---|---|---|---|
| bidi-js 1.1.0 (`dist/bidi.min.mjs`; package 171,249) | 11,975 | 5,801 | load 1.1 ms; 0.29 to 0.41 ms a page (14 labels), first page 8 to 18 ms |
| harfbuzzjs 1.6.4 (`harfbuzz.wasm`; JS 85,257; package 1,321,408) | 444,394 | 181,449 | import 10 ms; font 1.5 to 2.2 ms; 0.36 to 0.98 ms a page |
| Noto Sans Arabic Regular TTF (OFL) | 194,176 | | |

### The recommendation, where
1. **Not adopted:** bidi-js and harfbuzzjs in the preview. The browser is already UAX 9 and HarfBuzz; adding them
   would add bytes (up to 181 KB gzip) and change nothing the browser draws.
2. **Proposed job (assets/js/page-preview.js, the owner's go first):** on a right-to-left page, draw each text as
   the writer writes it: after `clean()`, `text-measure.js isolateLatin`, wrapped in U+2067 ... U+2069 when it has
   no Latin letter; the SVG keeps `direction="ltr"` and every anchor. Measured here (lab only): 14 of 14 in the
   written order. `fit()` must cut the clean text and wrap after (a cut inside the wrap would drop the U+2069).
3. **bidi-js later, in Node:** the pick for any order computed without a browser (a PDF; an MCP check that a written
   text reads in order). 5.8 KB gzip, MIT, UAX 9 C1 conformant, 0 differences from Chromium here.
4. **harfbuzzjs later, maybe:** only if a PDF job finds its library's own Arabic shaping wrong; measure it then.

## Decisions I made
- The font: `@expo-google-fonts/noto-sans-arabic` 0.4.3 (its TTF; the package MIT, the font SIL OFL 1.1). The repo
  ships no Arabic font; Fontsource ships WOFF2 only, which harfbuzzjs does not read.
- "Today's preview" is the real `Preview.render` SVG fed the writer's text (`isolateLatin`), one text box per label,
  on an `rtl` page, read back per character in Chromium (`getExtentOfChar`). "The browser's order" is Chromium on
  the written text in a `dir="rtl"` div (the ltr div gives the same on every wrapped label).
- A visual order is compared as the list of the label's character indices; a tie in x (a ligature's parts) is
  ordered by direction. Examples group consecutive indices into runs.
- The proof script is `npm test` in lab/rd/ar3 so `scripts/check-result-lines.mjs lab/rd/ar3/package.json` reads its
  result line (PASS there). It is not in `mcp/tests.json`: lab only, not CI.
- `mcp/WORK.md` not changed: the brief keeps every change in lab/rd/ar3 and this note; the reviewer adds the line.
- `result.json` committed as this run's record (times vary run to run; the counts do not).
- Integration moved to 2d5bbe4 (PB1) after my first green run (41999456331 on 02cf571): merged once (55648a8), CI rerun.

## For the owner
- One question for the laptop list: the writer wraps only a text with a Latin letter, so «الهدف 12% مقابل الفعلي
  9.5%» goes into the report unwrapped. If a Desktop text box lays it out left to right, its last «%» is read first
  (UAX 9 N1, N2). One Desktop look at such a title answers it.
- The preview fix (recommendation 2) needs your go as a job of its own.

## Risky changes
none (lab and this note only).

## Seen, not in scope
- page-preview.js `fit()` cuts a title with "…" by character; on an Arabic text the "…" goes at the logical end,
  which is the left end only inside a right-to-left isolate: the same fix makes the cut land where Desktop's does.
- Bracket mirroring (UAX 9 L4) was not measured as glyphs; order only.
- text-measure.js `textWidth` estimates Segoe UI and Tahoma widths; harfbuzzjs could measure them exactly, but only
  with a font we may ship, and Segoe UI is not one.

## Lessons for the reviewer
- harfbuzzjs 1.x `shape(font, buffer, features)` takes `Feature` objects (`hb.Feature.fromString('-init')`), not the
  0.x feature string.
- `npm run lint` at the root needs the root's `npm ci --ignore-scripts` first; lab/ is outside its paths.
- Rerun: `cd lab/rd/ar3 && npm ci --ignore-scripts && npm test` (Playwright from the container's global install).
