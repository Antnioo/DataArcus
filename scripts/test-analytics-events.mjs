// Every analytics event the site sends, checked against GA4's rules on every push. No network: it reads the page
// scripts and every page's inline scripts. Found 2026-10-06 (R-003): `mh_analyze` sent `source: 'pbit'`, and GA4 reads
// an event parameter called `source` as the visit's traffic source, so each Health Check run re-labelled that visit
// as coming from "pbit" and hid where the visitor really came from.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

// Parameter names GA4 takes as the visit's campaign/traffic source (they overwrite attribution), and its reserved prefixes
const ATTRIBUTION = ['source', 'medium', 'campaign', 'term', 'content', 'campaign_id', 'gclid', 'dclid', 'srsltid'];
// GA4 reads these as money and e-commerce (Event value, revenue, items); the site sells nothing through GA4 (finding 1, 2026-10-06)
const MONEY = ['value', 'currency', 'items', 'transaction_id', 'price', 'quantity', 'tax', 'shipping', 'coupon'];
const RESERVED_PREFIX = /^(google_|ga_|firebase_|utm_|_)/;
const NAME = /^[A-Za-z][A-Za-z0-9_]*$/;   // GA4: letters, digits, underscores; starts with a letter
const MAX_NAME = 40, MAX_PARAMS = 25;

const files = execSync('git ls-files "*.js" "*.html"', { cwd: ROOT, encoding: 'utf8' }).trim().split('\n')
  .filter((f) => f && !f.endsWith('.min.js') && !/^(node_modules|mcp|scripts|content|\.claude)\//.test(f) && !f.startsWith('assets/js/vendor/'));

// The text between the call's "(" and its matching ")", strings skipped
const argsAt = (src, open) => {
  let depth = 0, q = null;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (q) { if (ch === '\\') i++; else if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') q = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch) && --depth === 0) return src.slice(open + 1, i);
  }
  return null;
};
// Split on commas at depth 0
const split = (s) => {
  const out = []; let depth = 0, q = null, start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === '\\') i++; else if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') q = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (ch === ',' && depth === 0) { out.push(s.slice(start, i).trim()); start = i + 1; }
  }
  out.push(s.slice(start).trim());
  return out.filter(Boolean);
};
const keyOf = (prop) => {
  if (prop.startsWith('...')) return null;
  if (prop.startsWith('[')) return null;                       // computed key: checked by hand (theme_chart_style)
  const m = prop.match(/^(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*(:|$)/);
  return m ? (m[1] || m[2] || m[3]) : null;
};

let calls = 0;
for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const re = /\b(trackOnce|dataArcusTrack|track)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    const before = src.slice(Math.max(0, m.index - 30), m.index);
    if (/(const|let|var|function|window\.)\s*$/.test(before) && !/window\.$/.test(before)) continue;   // a definition
    if (/typeof\s+window\.$/.test(before)) continue;
    const args = argsAt(src, m.index + m[0].length - 1);
    if (args === null || /^\s*(name|key)\s*,/.test(args)) continue;                                  // the helpers themselves
    let parts = split(args);
    if (m[1] === 'trackOnce') parts = parts.slice(1);             // trackOnce(key, name, params)
    const line = src.slice(0, m.index).split('\n').length;
    const where = `${f}:${line}`;
    const name = parts[0] || '';
    calls++;
    // Literal parts of the event name (names built as EX.ev + '_x' are checked on their literal suffix)
    const literal = name.match(/^'([^']*)'$/) || name.match(/^"([^"]*)"$/);
    if (literal) {
      ok(NAME.test(literal[1]), `${where}: event name "${literal[1]}" must be letters, digits and _ and start with a letter`);
      ok(literal[1].length <= MAX_NAME, `${where}: event name "${literal[1]}" is longer than ${MAX_NAME}`);
      ok(!RESERVED_PREFIX.test(literal[1]), `${where}: event name "${literal[1]}" uses a GA4 reserved prefix`);
    }
    const obj = parts[1];
    if (!obj || !obj.startsWith('{')) continue;
    const props = split(obj.slice(1, -1));
    ok(props.length <= MAX_PARAMS, `${where}: ${props.length} parameters (GA4 keeps ${MAX_PARAMS})`);
    for (const p of props) {
      const k = keyOf(p);
      if (!k) continue;
      ok(!ATTRIBUTION.includes(k), `${where}: parameter "${k}" is read by GA4 as the visit's traffic source; rename it (e.g. file_type)`);
      ok(!MONEY.includes(k), `${where}: parameter "${k}" is read by GA4 as money or e-commerce; rename it (e.g. accent_value)`);
      ok(!RESERVED_PREFIX.test(k), `${where}: parameter "${k}" uses a GA4 reserved prefix`);
      ok(NAME.test(k) && k.length <= MAX_NAME, `${where}: parameter "${k}" must be letters, digits and _ (max ${MAX_NAME})`);
    }
  }
}
// (round 22b, the reviewer's second review, item 1) no regex lookbehind in a site script: Safari before 16.4 cannot
// parse "(?<=" or "(?<!" and drops the whole file (main.js runs on every page). A named group "(?<name>" is fine.
{
  const files = fs.readdirSync(path.join(ROOT, 'assets/js'), { recursive: true }).filter((f) => /\.js$/.test(f)).map((f) => path.join('assets/js', f));
  const bad = files.filter((f) => /\(\?<[=!]/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  ok(!bad.length, `no regex lookbehind in site scripts (Safari before 16.4 fails on the whole file): ${bad.join(', ')}`);
}
// Typed text never reaches GA4 when it looks like an email address or a phone number (Google's terms forbid personal data)
const main = fs.readFileSync(path.join(ROOT, 'assets/js/main.js'), 'utf8');
ok(/track\('search', \{ search_term: safeTerm\(/.test(main), "main.js: the blog search must send safeTerm(...), not the raw text");
// AUD-031 (round 20): a search term with 7 or more digits in all is redacted (a Gulf phone number is 8 digits, "5512 3456"),
// unless every number in it is a year (19xx or 20xx), so "2024 2025" is kept; the "@" rule and the 50-character cut stay
{
  const src = (main.match(/const safeTerm = ([^\r\n]+);\r?\n/) || [])[1];   // (a Windows checkout has CRLF line ends)
  let safe = null; try { safe = src && Function('return (' + src + ')')(); } catch (e) { safe = null; }
  ok(typeof safe === 'function', 'main.js: safeTerm could not be read as one arrow function on one line');
  if (typeof safe === 'function') {
    for (const q of ['5512 3456', '9876 5432', '+974 5512 3456', '050 123 4567', 'me@example.com', '1234567'])
      ok(safe(q) === '(redacted)', `safeTerm("${q}") must be "(redacted)", got "${safe(q)}"`);
    // (round 22, the code review's i) the rule is one: the years a search names (2015 to 2035) are set aside, then 7 or
    // more digits are redacted. So other words and small numbers beside years are kept, and two old "years" that
    // could as well be a phone number ("2012 1995") are not
    for (const q of ['2012 1995', '2024 5512 3456', '2024 2025 050 123 4567', '20242025'])
      ok(safe(q) === '(redacted)', `safeTerm("${q}") must be "(redacted)", got "${safe(q)}"`);
    for (const q of ['2024 2025 top 10', 'dax 2024 vs 2025 top 100', 'power bi 2019 2020 2021'])
      ok(safe(q) === q, `safeTerm("${q}") must keep the term, got "${safe(q)}"`);
    for (const q of ['2024 2025', 'top 10 dax', 'dax 2025', 'calculate'])
      ok(safe(q) === q, `safeTerm("${q}") must keep the term, got "${safe(q)}"`);
    ok(safe('x'.repeat(80)) === 'x'.repeat(50), 'safeTerm must cut a term to 50 characters');
    // (round 22b, the review of round 22, item 1: setting the years aside let phone numbers through whose groups read
    // as years, "050 2024 2025". Never a phone-like number: a run of numbers joined by spaces, dashes, dots, slashes or
    // brackets counts whole unless it is years only, or one number of at most 3 digits beside one year, "dp-600 2025")
    for (const q of ['050 2024 2025', '+971 50 2030 2015', '971 50 2030 2015', '5520 2025', '04 2024 2025', '050 2025', '+971501234567', '00971 50 123 4567',
      '050-123-4567', '050.123.4567', '(04) 123 4567', '+966 55 123 4567', '055 123 4567', '+44 20 7946 0958', '+1 (415) 555-2671', 'call 050 123 4567 please', '+2030 2015 2020'])
      ok(safe(q) === '(redacted)', `safeTerm("${q}") must be "(redacted)" (a phone number), got "${safe(q)}"`);
    // (X-06, the outside review of round 22b; the reviewer's decision, keep as is: a run of years alone, "2015 2035", is
    // kept although it has 8 digits. Year searches such as "2024 2025" and "Vision 2030" matter more than this rare
    // case: an accepted, known gap, documented here so a change to it is a decision, not an accident)
    // (and, by the reviewer's item 7, "a small number beside years is kept, in any order": "50 2024 2025", a UAE mobile
    // written without its 0 whose last seven digits read as two years, is kept too: accepted with the same reason)
    for (const q of ['2015 2035', '2024 2025', 'vision 2030', 'vision 2030 2035', '50 2024 2025'])
      ok(safe(q) === q, `safeTerm("${q}") keeps a run of years alone (X-06, accepted): got "${safe(q)}"`);
    // (round 22b, the reviewer's second review, items 6 and 7) commas, underscores, a single letter between numbers
    // join them like a space ("050,2024,2025", "050x2024x2025"); and a small number beside years is kept whatever the order
    for (const q of ['050,2024,2025', '050 , 2024 , 2025', '050_2024_2025', '050x2024x2025', '+971,50,2030,2015'])
      ok(safe(q) === '(redacted)', `safeTerm("${q}") must be "(redacted)" (a phone number), got "${safe(q)}"`);
    for (const q of ['top 10 2024 2025', '5 2024 2025', '2024 2025 2026 30', '2024 2025 top 10'])
      ok(safe(q) === q, `safeTerm("${q}") must keep the term, got "${safe(q)}"`);
    // (round 22b, the reviewer's third review, items 5 and 6) a number of 3 or more digits beside two or more years counts
    // whole ("971 2030 2015"); Arabic-Indic and Eastern Arabic digits count as digits ("٠٥٠١٢٣٤٥٦٧"), and the term is
    // sent as typed when kept
    for (const q of ['971 2030 2015', '123 2024 2025', '\u0660\u0665\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667', '\u06f0\u06f5\u06f0\u06f1\u06f2\u06f3\u06f4\u06f5\u06f6\u06f7', '+\u0669\u0667\u0661 \u0665\u0660 \u0661\u0662\u0663 \u0664\u0665\u0666\u0667'])
      ok(safe(q) === '(redacted)', `safeTerm("${q}") must be "(redacted)" (a phone number), got "${safe(q)}"`);
    for (const q of ['5 2024 2025', 'top 10 2024 2025', '\u062a\u0642\u0631\u064a\u0631 \u0662\u0660\u0662\u0665', 'dp-600 2025'])
      ok(safe(q) === q, `safeTerm("${q}") must keep the term as typed, got "${safe(q)}"`);
    for (const q of ['dp-600 2025', 'fy2025', 'fy2024 vs fy2025', 'q1 2025', 'pl-300', 'pl-300 dp-600', 'top 10', 'power bi 2024 2025 2026'])
      ok(safe(q) === q, `safeTerm("${q}") must keep the term, got "${safe(q)}"`);
  }
}

// European visitors who click Accept: Clarity gets its consent signal (it is enforced for the EEA, UK and Switzerland)
ok(/clarity\('consentv2', \{ ad_Storage: 'denied', analytics_Storage: 'granted' \}\)/.test(main), "main.js: an explicit Accept must send Clarity consentv2 (analytics granted, ads denied)");

// Short links: one tagging rule (ANALYTICS.md section 7) so every visit lands in a named channel, never Unassigned
const MEDIUMS = ['social', 'paid', 'email', 'video', 'referral'];   // GA4 default channel rules recognise all five
const NOT_A_PLATFORM = ['groups', 'post', 'social', 'group'];
let links = 0;
for (const dir of fs.readdirSync(path.join(ROOT, 'go'))) {
  const f = path.join('go', dir, 'index.html');
  if (!fs.existsSync(path.join(ROOT, f))) continue;
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/&amp;/g, '&');
  const targets = [...html.matchAll(/https:\/\/dataarcus\.com\/[^'"\s]*utm_[^'"\s]*/g)].map((m) => m[0].replace(/;$/, ''));
  ok(targets.length >= 3, `${f}: the refresh, the script and the link must all carry the tagged address`);
  ok(new Set(targets).size === 1, `${f}: the refresh, the script and the link point to different addresses`);
  const q = new URL(targets[0]).searchParams;
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) ok(q.get(k), `${f}: ${k} missing`);
  for (const [k, v] of q) if (k.startsWith('utm_')) ok(/^[a-z0-9-]+$/.test(v), `${f}: ${k}=${v} must be lowercase letters, digits and hyphens`);
  ok(MEDIUMS.includes(q.get('utm_medium')), `${f}: utm_medium=${q.get('utm_medium')} is not one GA4 recognises (${MEDIUMS.join(', ')})`);
  ok(!NOT_A_PLATFORM.includes(q.get('utm_source')), `${f}: utm_source=${q.get('utm_source')} must be the platform (put the placement in utm_content)`);
  links++;
}
ok(links >= 10, `only ${links} short links found: the scan is broken`);

// One rule for every post's links, so nothing drifts (owner 2026-10-07): a post gets one campaign "<name>-YYYY-MM-DD"
// and a pair of links, go/<name> (utm_content=personal, his profile) and go/<name>-page (utm_content=page, the
// DataArcus page's own post), both to the same address and campaign. Two posts may point at the same page: each keeps
// its own campaign, so GA4 tells the posts apart. LEGACY: links made before the rule (the September design-tools launch
// and the 6 Oct SVG video); they stay as they are, so their numbers stay comparable.
const LEGACY = ['ad-li', 'dev', 'fabric', 'fb', 'hashnode', 'ih', 'kpi', 'kpi-ar', 'li', 'li-ar', 'medium', 'ph', 'reddit', 'svg', 'svg-ar', 'theme', 'tools', 'tools-page', 'x'];
const tags = {};
for (const dir of fs.readdirSync(path.join(ROOT, 'go'))) {
  const f = path.join(ROOT, 'go', dir, 'index.html');
  if (!fs.existsSync(f)) continue;
  const m = fs.readFileSync(f, 'utf8').replace(/&amp;/g, '&').match(/https:\/\/dataarcus\.com\/[^'"\s]*utm_[^'"\s]*/);
  if (m) { const u = new URL(m[0]); const q = u.searchParams; tags[dir] = { to: u.pathname + (q.get('lang') ? '?lang=' + q.get('lang') : ''), campaign: q.get('utm_campaign'), content: q.get('utm_content') }; }
}
for (const [name, t] of Object.entries(tags)) {
  if (LEGACY.includes(name)) continue;
  const where = `go/${name}`;
  ok(/^[a-z0-9-]+-\d{4}-\d{2}-\d{2}$/.test(t.campaign || ''), `${where}: utm_campaign=${t.campaign} must be <name>-YYYY-MM-DD (one campaign per post)`);
  if (name.endsWith('-page')) {
    ok(t.content === 'page', `${where}: a -page link must carry utm_content=page`);
    ok(tags[name.slice(0, -5)], `${where}: no go/${name.slice(0, -5)} for the personal profile`);
  } else {
    ok(t.content === 'personal', `${where}: utm_content=${t.content} must be personal (the page's twin is go/${name}-page)`);
    const twin = tags[name + '-page'];
    ok(twin, `${where}: no go/${name}-page for the DataArcus page`);
    if (twin) ok(twin.to === t.to && twin.campaign === t.campaign, `${where} and go/${name}-page must share address and campaign`);
  }
}


ok(calls > 50, `only ${calls} tracking calls found: the scan is broken`);

if (fails.length) { console.error(`Analytics events: ${fails.length} problem(s)\n  ` + fails.join('\n  ')); process.exit(1); }
console.log(`Analytics events: ${calls} tracking calls follow GA4's naming rules; ${links} short links follow the tagging rule.`);
