# Arabic indexing: plan (owner's go to plan, 2026-10-06; plan only, nothing on the site changed)

## Where we are
- Arabic is a switch in the page: `assets/js/lang-manager.js` reads `?lang=ar`, then `localStorage`
  (`dataarcus-lang`), then the browser's language, and fills the page from `assets/js/translations/*` (36 files:
  `data-i18n`, `data-i18n-html`, attributes, and the `meta` block: title, description, Open Graph, canonical).
- The HTML Google downloads is English. Every page's Arabic `meta.canonical` is the English URL, so even a rendered
  `?lang=ar` page tells Google "the English page is the real one".
- No `hreflang` anywhere; `sitemap.xml` lists 35 English URLs; 37 pages (`scripts/test-site-config.mjs`).
- So Google indexes English only. An Arabic search can't find an Arabic page, because to Google there isn't one.

## What Google says (Search Central)
- "Google recommends using different URLs for each language version of a page rather than using cookies or browser
  settings to adjust the content language on the page." And: "If you prefer to dynamically change content or reroute
  the user based on language settings, be aware that Google might not find and crawl all your variations."
  (Managing multi-regional and multilingual sites.)
- On URL structures, a URL parameter (`?loc=`) is listed as **"Not recommended"** ("URL-based segmentation
  difficult"; "Users might not recognize geotargeting from the URL alone"). (Same page.)
- hreflang: "Each language version must list itself as well as all other language versions"; `x-default` "is used
  when no other language/region matches"; in a sitemap "each `<url>` element must have a child element
  `<xhtml:link rel="alternate" hreflang="...">` that lists every alternate version of the page, including itself";
  "Alternate URLs must be fully-qualified". (Tell Google about localized versions of your page.)
- JavaScript: "a headless Chromium renders the page and executes the JavaScript" once resources allow (a queue);
  "Server-side or pre-rendering is still a great idea because it makes your website faster for users and crawlers,
  and not all bots can run JavaScript." (JavaScript SEO basics.)

## Options

### 1. hreflang to `?lang=ar`, Arabic rendered by JavaScript
- **What:** each page gets `<link rel="alternate" hreflang="en|ar|x-default">` (en and x-default: the page; ar: the
  page `?lang=ar`); the Arabic translations' `meta.canonical` becomes the `?lang=ar` URL; the sitemap lists both with
  `xhtml:link` alternates.
- **SEO effect:** possible, not sure. Google renders JavaScript, but later (a queue), and only if it keeps `?lang=ar`
  as its own URL. It lists parameters as "not recommended", and the English canonical must be fixed first, or the
  Arabic page is folded into the English one. Other engines and AI crawlers that don't run JavaScript see English.
- **Effort:** about 1 builder session (36 translation files' canonicals, the head links, sitemap, tests).
- **Risks:** low on the site (no new files), high on the result: we may wait weeks and learn it didn't take. The
  `localStorage` switch also means a returning visitor's plain URL shows Arabic, so the same URL serves two languages.

### 2. Static `/ar/` copies made at build (recommended)
- **What:** a Node script renders each page in Arabic and writes real HTML to `/ar/<same path>`, which GitHub Pages
  serves as is. The surest way is to render with the same code users run: Playwright (already a dev dependency) opens
  each page at `?lang=ar` on the local server, waits for the translations, and saves the DOM. Then the script fixes
  what must differ:
  - `<html lang="ar" dir="rtl">` in the file itself;
  - title, description and Open Graph in Arabic in the file;
  - canonical = the `/ar/` URL; `hreflang` en / ar / x-default (x-default = English) on both copies, reciprocal;
  - links between pages rewritten to `/ar/...`, so an Arabic visitor stays in Arabic;
  - the language switch becomes a plain link between the two URLs (lang-manager: on `/ar/` the language is `ar`,
    whatever `localStorage` says, and switching saves the choice and goes to the other URL);
  - inline scripts kept byte for byte, so the CSP hashes still match; `csp.mjs --write` runs over `/ar/` too.
- **What it means for the rest:**
  - **37 pages** become 74 files, generated, never edited by hand.
  - **Sitemap:** 35 + 35 URLs, each with `xhtml:link` alternates for itself and its pair.
  - **llms.txt:** an "Arabic versions" line pointing to `/ar/`.
  - **Analytics:** the `language` parameter stays as today (`ar`); `page_location` now separates the two.
  - **Tests:** `test-site-config.mjs` gains the rules below; the website suites run on `/ar/` pages too (the
    lang-switcher suite first).
  - **Freshness:** a CI check renders again and fails when a committed `/ar/` file differs from what its page and
    translations give, as `build:min` does for `.min.js`. A stale copy can't be merged.
- **SEO effect:** the best we can get on GitHub Pages: real Arabic HTML on its own URL, indexable by every crawler,
  the language in the URL (Google's "different URLs for each language").
- **Effort:** about 2 to 3 builder sessions:
  1. The generator, the CI freshness check, and the `test-site-config.mjs` rules, on the 5 tool pages first.
  2. All 37 pages, the sitemap, llms.txt, and lang-manager's link switch.
  3. Search Console checks and fixes from what it reports (submit the sitemap; URL inspection on 3 Arabic pages).
- **Risks:**
  - **Duplicate content:** none if the hreflang pairs and self-canonicals are right; the tests enforce it.
  - **Stale copies:** the CI check covers them.
  - **Repo size:** about double the HTML (small next to the images).
  - **A page that builds its content in JS after load** (the tools' results): the copy holds the page as first shown.
    That is enough for indexing; users still get the live tool.
  - **Page sizes:** test-site-config and the CSP must be extended, not bypassed.

### 3. Other ways, and why not
- **A second GitHub Pages site or subdomain** (`ar.dataarcus.com`): the same build as option 2 plus DNS, a second
  Search Console property and split authority. No gain over `/ar/`.
- **A static-site generator** (Eleventy, Jekyll i18n): the right long-term shape, but it means moving 37 pages and
  their scripts to templates. Weeks, not a night.
- **Edge rendering** (a CDN worker in front of Pages): the site is not behind one today. It adds a service, a bill and
  a moving part to a static site. Not now.

## Recommendation
1. Do option 2: real Arabic pages under `/ar/`, made from the same translations by a Playwright snapshot, with
   hreflang pairs, self-canonicals and a sitemap with alternates.
2. Don't do option 1 even as a stopgap: it changes canonicals to parameter URLs that we would later have to change
   back, and Google calls parameters "not recommended".
3. Cut for tonight (session 1): the generator, `/ar/` copies of the 5 tool pages, their hreflang and canonicals,
   the sitemap entries for those 5, the CI freshness check, and the new `test-site-config.mjs` rules. Not yet:
   articles, the blog, and lang-manager's link switch.
4. Session 2: every page, lang-manager's link switch, llms.txt. Then Search Console (the owner submits the sitemap).
5. Measure: the Arabic URLs indexed (Search Console "Pages"), and Arabic queries in "Performance", from 2 weeks after.

**The one decision for the owner:** the Arabic URL shape. `/ar/tools/...` (recommended: one site, one Search
Console property, the language visible in the URL) or `ar.dataarcus.com`.

## What `scripts/test-site-config.mjs` must add
- Every page in the sitemap has its pair: `X.html` and `ar/X.html`.
- Both files carry `<link rel="alternate" hreflang="en">`, `hreflang="ar"` and `hreflang="x-default"` (x-default =
  the English URL), fully qualified `https://dataarcus.com/...`, and the two files point at each other (reciprocal).
- `rel="canonical"` is the file's own URL in both languages.
- `<html lang="ar" dir="rtl">` in every `/ar/` file; `lang="en"` in the English ones.
- `<title>`, `meta description`, `og:title` and `og:description` differ between the pair, and the Arabic ones contain
  Arabic letters; the Arabic title within the same length limits as the English.
- `sitemap.xml`: every `<url>` (both languages) has `xhtml:link` alternates for en, ar and x-default, including itself,
  and the `xmlns:xhtml` namespace is declared.
- Internal links in an `/ar/` file point to `/ar/` pages (except files and English-only pages, listed by name).
- `robots.txt` doesn't block `/ar/`; `llms.txt` names the Arabic versions.
- The freshness check: a committed `/ar/` file equals what the generator makes from its page and translations.

## Open items
- Pages with no Arabic translation (if any): they get no `/ar/` copy and no `ar` alternate. The generator lists them.
- The website suites' run time grows with `/ar/` pages: run `lang-switcher` and `site` on them, not every suite.
