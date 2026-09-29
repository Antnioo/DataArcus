# Site tests

Browser tests for dataarcus.com. They run the real pages in Chromium, in English and Arabic, on a phone and a laptop screen.

## First time

```
npm install
npx playwright-core install chromium   # skip if Chrome is installed, or set CHROME_PATH
```

## Run

```
npm test                          # everything, 3 tests at a time (about 4 minutes)
npm test -- anchors consent       # only these
npm test -- --jobs 1              # one at a time (about 9 minutes), to rule out a busy machine
npm run test:full                 # also the long layout test on every page size
```

Each test prints `PASS` or `FAIL` with the problems it found. The command fails when any test fails, so it can run before a deploy.

| Test | What it checks |
|---|---|
| `site` | Every page: no errors, no missing translations, no sideways scrolling, phone menu opens, top offset matches the navbar |
| `anchors` | `#section` links, clicked or arrived at, land just below the navbar and pinned bars |
| `tools` | Model health results and exam navigation scroll below the navbar, CTA buttons spaced in both directions, FAQ right after the CTA, site works if AOS fails to load |
| `model-health` | Model Health Check: the engine sees every real use of a column (measure-table placeholders, field parameters, DAX functions, aggregations), and the fix plan never removes anything that something staying still needs |
| `spacing` | Every page: stacked boxes are one step of the spacing scale apart (style.css `--space-*`), and content starts one step below the navbar |
| `consent` | Cookie banner only in Europe, Reject stops analytics, privacy page button, phone layout |
| `lang-switcher` | Every page: the language switcher's label is in the other language, the Arabic label gets the Arabic font (its letters load on English pages), joined letters and its optical lift, so it sits level with the globe |
| `theme-generator` | Saved-design upgrades, accent bars and corners, page sizes, theme JSON, download reminders, example and Undo |
| `pbip` | Power BI project download with your own model: a local project's model folder or a published model, the report never replaces files in their folder, every field a visual uses exists in their model; the sample download keeps its model |
| `dax` | DAX Measure Builder and Calendar Generator: Ramadan vs last Ramadan is right on cards and totals, bad inputs never give broken DAX or stale output, odd saved settings don't break the page |
| `layout` | 512 layout combinations: every visual on the page, usable size, no overlaps |
| `svg-kpi` | The SVG KPI Designer's DAX output matches its preview (runs `scripts/test-svg-kpi.mjs`) |
| `theme-generator-lab`, `layout-lab` | The same two tests on the lab page, which runs the generator on the design engine (the live page keeps the old script until it moves) |
| `design-engine` | The design engine (`assets/js/design-engine.js`) gives exactly what the generator gave before the move, for every case in `fixtures/design-engine`: the repaired saved design, theme JSON, slot table, background SVG and file name; both pages offer the engine's fonts and chart choices; the lab page runs the engine and the live page the old script; and both pages in the browser make exactly the fixtures, preview included. Fixtures come from `capture-design-fixtures.mjs` and are only remade with the owner's approval |
| `tmdl-model` | TMDL projects read into the same model as a model.bim: every kind of TMDL object, and the Model Health Check gives identical results on a project saved by Power BI Desktop and its .pbit export (fixtures in `fixtures/model-health/tmdl-*`). Runs in Node, no browser: `node scripts/tests/tmdl-model.mjs` |

## How it works

`lib.mjs` starts a small web server for the site folder (no Python needed), serves the CDN files (Bootstrap, icons, AOS) from `node_modules` so tests run offline, and blocks analytics.
To add a test, create `name.mjs` exporting `async ({ browser, url }) => ({ checks, problems })`, and add its name to `ALL` in `run-all.mjs`.

## Design fixes: fix the cause, then test it

When something looks wrong on one page, find where it comes from (usually `style.css`, `main.js` or `lang-manager.js`, shared by every page) and fix it there, so every page gets the fix. Then add a check here that runs on every page, so the problem cannot come back unnoticed. Minified files are rebuilt from the source: `terser file.js -c -m -o file.min.js` for scripts, `lightningcss --minify style.css -o style.min.css` for the stylesheet.
