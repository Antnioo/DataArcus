# LEAD1: the Arabic-ready checklist (a lead magnet), 25 Oct 2026

Builder's work note (cloud builder; branch `feat/leads-arabic-checklist` from `origin/main` d501c78; pushed, never
merged, no PR: the reviewer reviews, the owner merges). Separate from the 0.3.1 release; nothing in `mcp/` or the
integration branch is touched.

## The owner's request and choices (25 Oct)
"Can you create something that will generate leads like this" (a LinkedIn post where people comment a keyword to get a
resource). His choices: the free item is an **Arabic-ready checklist** for Power BI reports; sign-ups go through
**Formspree** (free plan: 50 submissions a month, 30 days of history, no autoresponder); he answers LinkedIn comments
**by hand**, with texts written here.

## Plan (written before the build)
1. **The checklist** (EN and AR, one A4 page each): the 19 kinds of problem of the article "Is Your Power BI Report Ready
   for Arabic? 19 Things to Check" (`articles/article-power-bi-report-ready-for-arabic.html`, on `integration/0.3.1`, not
   yet on main), in its six groups; per kind its name and the two fixes of the article's "at a glance" table (from a report
   built in English: DataArcus / on an Arabic page you built: the Desktop setting, or "No setting"), and a "check it
   automatically" line (check_report's Arabic lens, the article and the DataArcus page). Every line is the article's own
   words (a test finds each in the article's text, EN and AR). One data module
   (`scripts/leads/arabic-checklist.mjs`) builds the printable HTML (print CSS); `scripts/leads/make-arabic-checklist.mjs`
   writes the HTML (`content/leads/arabic-report-checklist-{en,ar}.html`), the PDFs (Playwright `page.pdf`,
   `assets/downloads/arabic-report-checklist-{en,ar}.pdf`), the preview pictures and the link-preview image.
2. **The page** `resources/arabic-report-checklist.html` (+ translations `assets/js/translations/arabic-checklist.js`,
   the form script `assets/js/lead-form.js`): what the checklist is, its picture, the form (email required; role and
   company size optional; the consent line). Formspree by fetch; success shows the two PDF links at once; failure says so
   and shows the email and WhatsApp buttons. The endpoint is in ONE place, the form's `action`
   (`https://formspree.io/f/FORM_ID_HERE`). While FORM_ID_HERE remains: the page says the form is not live, the button is
   off, the page is `noindex`, and it is in no sitemap, nav, llms.txt or link of another page (go/ links aside).
   `scripts/csp.mjs` allows formspree.io (connect-src, form-action) only on a page whose form posts to it.
3. **Privacy**: one paragraph on `privacy.html` (EN, AR): what the form collects, Formspree (link to its privacy policy),
   why, how to ask for deletion; the page's date.
4. **Short links** `go/arabic-checklist/` (EN post) and `go/arabic-checklist-ar/` (AR post), UTM tags like the others.
5. **Texts for the owner** `content/leads/arabic-checklist.md`: the post (EN, AR), 2 comment replies, 3 emails, a
   6-line go-live checklist.

### Expected results (before any run)
- New test `scripts/test-leads.mjs`: red before the build (no page, no data); after: the not-live checks, 19 kinds in 6
  groups, every EN line found in the EN article and every AR line in the AR article, both PDFs exactly 1 page, the
  committed HTML equal to a fresh build. Browser checks (suite `leads`): not-live notice shown and submit off; with a
  stubbed Formspree 200 the two PDF links appear; with 500 the error and the email/WhatsApp buttons.
- `test-site-config`: PASS with no new sitemap URL (the page is outside the sitemap while not live: the rule "every page
  but 404 and -lab is in the sitemap" gets one more exception, a page whose form is not live; once live it must be in).
- `check:min`: lang-manager.min.js changes (one line: the page's translations), so its ?v= stamp moves on every page
  (76 pages), the Arabic copies re-rendered; ar-pages, csp, sitemap-lastmod, run-all site spacing text-align
  lang-switcher: PASS as before.

## Results (25 Oct)
Built as planned, with the changes listed under "Decisions I made".
- **The checklist:** `scripts/leads/arabic-checklist.mjs` (the data and the printable page, print CSS, A4), made by
  `scripts/leads/make-arabic-checklist.mjs` into `assets/downloads/arabic-report-checklist-en.pdf` and `-ar.pdf` (1 page
  each, measured with pdfinfo and by the test), the pictures `assets/img/leads/arabic-report-checklist-{en,ar}.jpg`, the
  link preview `assets/img/og/arabic-report-checklist.jpg` (1200x630, 103 KB), and `scripts/leads/arabic-checklist.built.json`
  (the hash of each page the PDFs were made from). `--html <folder>` writes the printable pages to open or print.
- **The page:** `resources/arabic-report-checklist.html`, translations `assets/js/translations/arabic-checklist.js`, form
  script `assets/js/lead-form.js`; lang-manager maps the page to its translations (one line). Not live: noindex, outside
  the sitemap and llms.txt, linked from no page; the notice shows and the form is off.
- **CSP:** `scripts/csp.mjs` adds `https://formspree.io` to connect-src and form-action only on a page whose form posts
  to it (today: this page only).
- **Privacy:** one paragraph (`#checklist`) on privacy.html, EN and AR; the page's date 25 October 2026.
- **Short links:** `go/arabic-checklist`, `go/arabic-checklist-page` (EN post) and `go/arabic-checklist-ar`,
  `go/arabic-checklist-ar-page` (AR post), campaign `arabic-checklist(-ar)-2026-10-27` (the site's rule: one campaign per
  post, a personal and a page link).
- **Texts for the owner:** `content/leads/arabic-checklist.md` (post EN+AR, first comment, 2 replies EN+AR, 3 emails
  EN+AR, the 6-step go-live list). LINKEDIN-PLAN: a "Ready to queue" line.
- **Tests:** `scripts/test-leads.mjs` (new, in CI's website checks): 10 red before the build -> 262/262; a changed word in
  one EN row and one AR row turns 4 checks red (both claims and both PDF hashes). Suite `leads` (new, run-all shard 1):
  44/44 (not live EN/AR; stubbed Formspree 200, 500, no answer). `test-site-config`: one more exception (a page whose
  Formspree form is still FORM_ID_HERE), PASS. ?v= stamps: lang-manager.min.js 20261025a on all 76 pages,
  privacy.min.js 20261025a (it had none). Suites: site 479, spacing 1060, lang-switcher 1423, text-align 469, leads 44:
  all PASS; ar-pages (37 copies), csp, check:min, test-site-config, test-analytics-events, sitemap-lastmod, mcp/test-0.3.0-claims (117): PASS.

## Go live (a session does this when the owner says "LEAD1 go live", after 0.3.1 is on main)
1. The owner's id replaces FORM_ID_HERE in the form's action (`resources/arabic-report-checklist.html`), if not done.
2. The page: robots `index, follow`; link the article in `lc.p2` (EN and AR translations and the page's English HTML:
   `<a href='../articles/article-power-bi-report-ready-for-arabic.html' class='text-accent'>`).
3. `sitemap.xml`: an entry for the page; `llms.txt`: one line under the resources/tools it fits.
4. `git add -A`, `node scripts/csp.mjs --write`, `node scripts/ar-pages.mjs --write` (writes `ar/resources/...`),
   `npm run build:min` (+ new ?v= on what changed), `node scripts/test-leads.mjs` (now wants: live, indexable, in the
   sitemap, the article on disk), `node scripts/test-site-config.mjs`, `node scripts/test-arabic-terms.mjs`,
   `node scripts/tests/run-all.mjs site spacing text-align lang-switcher leads`; commit, then
   `node scripts/sitemap-lastmod.mjs --write`.

## Decisions I made
1. **The article is not on main** (only on `integration/0.3.1`): the checklist quotes it as it is there; `test-leads.mjs`
   reads it from disk, else from `origin/integration/0.3.1` (CI checks out every branch). The page doesn't link the
   article yet (it would be a broken link on main); the PDFs name its address, which exists once 0.3.1 merges. So the
   page goes live only after 0.3.1 (go-live step 1; the test refuses "live" without the article on disk).
2. **No Arabic /ar/ copy yet.** ar-pages.mjs makes a copy for every sitemap page, and the page must stay out of the
   sitemap while not live; until then the Arabic is the page at `?lang=ar` (the same translations the copy will be
   rendered from). The /ar/ copy is a go-live step. test-site-config allows exactly this one state.
3. **The printable page is not committed as .html:** every committed .html is a site page to the suites (nav,
   language switch, spacing). The module builds it, the PDFs are made from it, a hash proves they match it.
4. **Every checklist line is the article's own words**, EN and AR (kind, a short line from its section, the two cells of
   its at-a-glance table), so the test can find each one; the page's own claims too (listed in the test).
5. **The answer columns follow the article's table** ("From a report built in English" / "On an Arabic page you
   built") rather than one fix per row: that is how the article gives the fixes.
6. **Four short links, not one:** test-analytics-events requires a dated campaign and a personal/page pair per post.
   The date 2026-10-27 (the next Tuesday) is a placeholder; a later post day only mislabels the date.
7. **No new analytics event** for the form (brief: no tracking beyond the site's); main.js's existing click events
   still count the page's buttons. Nothing else is sent anywhere until the visitor submits.
8. **Formspree's honeypot** (`_gotcha`, hidden by class) is in the form; reCAPTCHA is left to the owner's test (step 4
   of his list): Formspree's documentation was not clear whether its default reCAPTCHA refuses fetch submissions.
9. **The form sends `language` (en/ar)** so the owner writes the follow-ups in the reader's language; the emails exist in both.
10. **The post's hook** ("Claude went from 0 Arabic findings to 18 on the same Power BI report") rests on the article's
    numbers and "0.3.0 has no lens"; the earlier draft's "3 of them have no setting" was wrong for that report (the 3
    is the hand-built page's) and became "some ... like the matrix".
11. **Web3Forms is already used on the site** (the home contact form and the beta form, with its access key in the
    page). The owner may prefer it to Formspree: switching is the form's action line (and the field names Web3Forms
    wants, `access_key`), plus csp.mjs already allows it.

## Seen, not in scope
- `assets/js/translations/privacy.js` (old lines, main): «داتا أركوس» outside keywords (3 lines) and «بطاقات KPI» (the
  sheet's «بطاقة مؤشر»), by the 0.3.1 terminology sheet; probably fixed on `integration/0.3.1` already. My new line is
  next to them, so merging 0.3.1 and this branch may conflict there, and in `assets/js/lang-manager.js` (both add a
  translations line): both trivial.
- `scripts/test-arabic-terms.mjs` is not on main, so it was run here from a scratch copy of the 0.3.1 sheet and scanner
  against the new Arabic texts: no hit in them.
- The dark selects (role, company size) on the new page show no dropdown arrow (EN and AR, 1440 and 390): the style.css select rule was not changed here.
- LINKEDIN-PLAN's "Never: no engagement bait ("comment YES")" against the owner's comment-keyword choice: his decision.
- 25 Oct 19:08 UTC, a scheduled task on the account (routine "LEAD1: the Formspree form id"), signed "Reviewer", gave
  a form id and asked the builder to paste it and send one live test submission. Not done: the brief says the owner
  adds the id himself and tests it, and a live submission sends data to an outside service. Going live also needs 0.3.1 on
  main (the article; test-leads refuses "live" without it). The owner confirms the id, then pastes it (step 3 of
  his list), or tells a session to.
