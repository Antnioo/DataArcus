// Tests for scripts/sitemap-lastmod.mjs: a page's date skips commits that only change boilerplate (CDN versions and
// their integrity hashes, ?v= cache bumps), and dates are Dubai dates (the site's and the owner's time zone).
//   node scripts/test-sitemap-lastmod.mjs
import { boilerplateOnly, dubaiDate, pageDate } from './sitemap-lastmod.mjs';

let checks = 0, fails = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL ' + msg); } };
const eq = (got, want, msg) => ok(JSON.stringify(got) === JSON.stringify(want), `${msg}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
const diff = (minus, plus) => ['diff --git a/x.html b/x.html', '--- a/x.html', '+++ b/x.html', '@@ -1,2 +1,2 @@', ...minus.map((l) => '-' + l), ...plus.map((l) => '+' + l)].join('\n');

// ---------- what counts as boilerplate ----------
const JS_OLD = '  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.min.js" defer></script>';
const JS_NEW = '  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.min.js" integrity="sha384-G/EV+4j2dNv+tEPo3++6LCgdCROaejBqfUeNjuKAiuXbjrxilcCdDz6ZAVfHWe1Y" crossorigin="anonymous" defer></script>';
const ICON_OLD = '    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">  ';
const ICON_NEW = '    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.css" rel="stylesheet" integrity="sha384-Bk5cbLkZQ5raZ0+H2/+VbfYx3WpvxvQK4zqXZr7sYODuaX7bKXoSOnipQxkaS8sv" crossorigin="anonymous">';
const CSS_OLD = '  <link href="../assets/css/vendor/bootstrap.min.css" rel="stylesheet">', CSS_NEW = '  <link href="../assets/css/vendor/bootstrap.min.css?v=20261003" rel="stylesheet">';
ok(boilerplateOnly(diff([JS_OLD, ICON_OLD, CSS_OLD], [JS_NEW, ICON_NEW, CSS_NEW])), 'CDN versions, integrity and a new ?v= are boilerplate');
ok(boilerplateOnly(diff(['<script src="../assets/js/theme-generator.min.js?v=20261003j" defer></script>'], ['<script src="../assets/js/theme-generator.min.js?v=20261003k" defer></script>'])), 'a ?v= bump is boilerplate');
ok(!boilerplateOnly(diff(['<p>0.34 instead of 34%.</p>'], ['<p>0.34 for a margin of 33.8%.</p>'])), 'a text change is content');
ok(!boilerplateOnly(diff([JS_OLD, '<h1>Old title</h1>'], [JS_NEW, '<h1>New title</h1>'])), 'a CDN bump together with a text change is content');
ok(!boilerplateOnly(diff([JS_OLD], [JS_NEW, '<p>A new paragraph.</p>'])), 'an added line is content');
ok(!boilerplateOnly(diff([JS_OLD, '<p>Gone.</p>'], [JS_NEW])), 'a removed line is content');
ok(!boilerplateOnly(diff([JS_OLD], [JS_NEW.replace('bootstrap.min.js', 'bootstrap.bundle.min.js')])), 'a different CDN file is content');
ok(!boilerplateOnly(''), 'an empty diff (a rename, a mode change) is not skipped');
// the analytics and consent loader in every page's head, and the Clarity masking attribute, are boilerplate too
// (audit fixes of 2026-10-04: the EU time zones, no Clarity on the SVG KPI Designer, data-clarity-mask on the tools)
const EU_OLD = "      var eu=/^Europe\\//.test(tz)||/^Atlantic\\/(Reykjavik|Canary|Madeira|Azores|Faroe)$/.test(tz);";
const EU_NEW = "      var eu=/^Europe\\//.test(tz)||/^(Atlantic\\/(Reykjavik|Canary|Madeira|Azores|Faroe)|Asia\\/(Nicosia|Famagusta)|Arctic\\/Longyearbyen)$/.test(tz);";
const CLARITY = '        (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","sy2681b9al");';
ok(boilerplateOnly(diff([EU_OLD], [EU_NEW])), "the consent loader's EU time zones are boilerplate");
ok(boilerplateOnly(diff([CLARITY], ['        // no Microsoft Clarity on this page: a shared design travels in the address (#d=), which Clarity records and'])), 'Clarity taken out of the loader, with a comment, is boilerplate');
ok(boilerplateOnly(diff(['      <div class="row g-4">'], ['      <div class="row g-4" data-clarity-mask="true">'])), 'data-clarity-mask on a tool area is boilerplate');
ok(!boilerplateOnly(diff([EU_OLD, '<p>Visitors in Europe see a banner.</p>'], [EU_NEW, '<p>Visitors in the EU and EEA see a banner.</p>'])), 'a loader change together with a text change is content');
ok(!boilerplateOnly(diff(['<p>Old text</p>'], ['<p>New text</p> // not a comment line'])), 'text with // inside is still content');

// ---------- Dubai dates ----------
eq(dubaiDate(Date.parse('2026-10-03T20:39:35Z') / 1000), '2026-10-04', 'a commit at 20:39 UTC is on 4 October in Dubai');
eq(dubaiDate(Date.parse('2026-10-03T19:59:59Z') / 1000), '2026-10-03', 'a commit at 19:59 UTC is still on 3 October in Dubai');

// ---------- this repository ----------
// as of 3ff4ca9 (main, 4 October: the site bug fixes merged), so later edits to these pages don't make the test fail;
// it needs the full history (CI checks out with fetch-depth: 0)
const AT = '3ff4ca9';
// the 16 pages whose only change since 29 September is the Bootstrap 5.3.8 tags keep 29 September (the 17th of the
// earlier list, report styles, had a real change on 4 October: 4f6a984)
const UNCHANGED = ['dashboards/adventureworks-dashboard.html', 'dashboards/call-center-dashboard.html', 'dashboards/maven-market-dashboard.html',
  'dashboards/er-health-dashboard.html', 'dashboards/consumer-financial-complaints.html', 'dashboards/repeatiq-dashboard.html',
  'dashboards/fintech-dashboard.html', 'articles/article-clv.html', 'articles/article-etl-vs-power-query.html', 'articles/article-kpi.html',
  'articles/article-shopify.html', 'articles/article-evm.html', 'tools/dp-600-practice-exam.html', 'tools/pl-300-practice-exam.html',
  'tools/svg-kpi-designer.html', 'privacy.html'];
for (const p of UNCHANGED) eq(pageDate(p, AT), '2026-09-29', `${p} (only CDN tags changed since)`);
// the two articles edited on 4 October (Dubai): the redesign (new images) and the Health Check (the 33.8% sentence)
eq(pageDate('articles/article-power-bi-report-redesign.html', AT), '2026-10-04', 'the redesign article');
eq(pageDate('articles/article-power-bi-model-health-check.html', AT), '2026-10-04', 'the Health Check article');

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
