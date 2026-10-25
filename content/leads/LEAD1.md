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
