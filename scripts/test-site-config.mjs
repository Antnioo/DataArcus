// The website's configuration files, checked on every push (owner's rule 2026-10-06: any website change runs a check
// on all site config files). No network: it reads the repo as GitHub Pages publishes it.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const SITE = 'https://dataarcus.com/';
const local = (url) => { let p = url.replace(SITE, ''); if (p === '' || p.endsWith('/')) p += 'index.html'; return p; };

// _config.yml: the site's own files are published, notes and code are not
const config = read('_config.yml');
for (const x of ['mcp', 'content', 'scripts', 'CLAUDE.md']) ok(new RegExp(`exclude:.*\\b${x.replace('.', '\\.')}\\b`).test(config), `_config.yml: ${x} must stay excluded`);
ok(/include:.*\.well-known/.test(config), '_config.yml: .well-known must be included (Jekyll hides dot folders)');
ok(exists('CNAME') && read('CNAME').trim() === 'dataarcus.com', 'CNAME must be dataarcus.com');

// robots.txt and the sitemap
const robots = read('robots.txt');
ok(/Sitemap:\s*https:\/\/dataarcus\.com\/sitemap\.xml/.test(robots), 'robots.txt must point to the sitemap');
ok(!/Disallow:\s*\/\s*$/m.test(robots), 'robots.txt must not block the whole site');
const sitemap = read('sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ok(locs.length > 0, 'sitemap.xml has no <loc>');
for (const u of locs) {
  ok(u.startsWith(SITE), `sitemap: ${u} is not on ${SITE}`);
  ok(exists(local(u)), `sitemap: ${u} has no file (${local(u)})`);
  ok(!u.includes('/go/'), `sitemap: ${u} is a short link (redirect)`);
}

// icons and the web manifest
for (const f of ['favicon.ico', 'assets/img/favicon.svg', 'assets/img/favicon-48.png', 'assets/img/favicon-192.png', 'assets/img/favicon-512.png', 'assets/img/apple-touch-icon.png']) ok(exists(f), `missing ${f}`);
let manifest = null;
try { manifest = JSON.parse(read('site.webmanifest')); } catch (e) { fails.push(`site.webmanifest is not valid JSON: ${e.message}`); }
if (manifest) {
  ok(manifest.name && manifest.start_url && manifest.theme_color, 'site.webmanifest needs name, start_url, theme_color');
  for (const i of manifest.icons || []) ok(exists(i.src.replace(/^\//, '')), `site.webmanifest icon missing: ${i.src}`);
}

// security.txt (RFC 9116): a contact and an Expires date in the future
const sec = read('.well-known/security.txt');
ok(/^Contact:\s*\S+/m.test(sec), 'security.txt needs Contact');
const exp = (sec.match(/^Expires:\s*(\S+)/m) || [])[1];
ok(exp && new Date(exp) > new Date(), `security.txt Expires is missing or past (${exp})`);
ok(exp && new Date(exp) - new Date() > 30 * 864e5, `security.txt Expires is within 30 days (${exp}): renew it`);

// llms.txt: every link is a page that exists
const llms = read('llms.txt');
ok(llms.startsWith('# '), 'llms.txt must start with "# " (its title)');
for (const m of llms.matchAll(/\((https:\/\/dataarcus\.com\/[^)]*)\)/g)) ok(exists(local(m[1])), `llms.txt links a missing page: ${m[1]}`);

// every published page: icon, manifest, theme colour; every page in the sitemap: canonical and a preview image
const pages = [];
const walk = (d) => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
  const p = path.join(d, e.name);
  if (e.isDirectory()) { if (!/^(node_modules|mcp|content|scripts|\.|go$)/.test(e.name)) walk(p); }
  else if (e.name.endsWith('.html')) pages.push(p);
} };
walk('.');
for (const p of pages) {
  const h = read(p);
  ok(/rel="icon"[^>]*favicon-48\.png/.test(h), `${p}: no 48 px PNG icon`);
  ok(/rel="manifest" href="\/site\.webmanifest"/.test(h), `${p}: no manifest link`);
  ok(/name="theme-color"/.test(h), `${p}: no theme-color`);
  // (round 16: main.min.js is cached like every script, so a page loads it with its version stamp, as the others)
  ok(!/main\.min\.js"/.test(h) || /main\.min\.js\?v=[0-9a-z]+"/.test(h), `${p}: main.min.js without a ?v= stamp`);
}
for (const u of locs) {
  const h = read(local(u));
  ok(/rel="canonical"/.test(h), `${local(u)}: no canonical`);
  ok(/property="og:image"/.test(h), `${local(u)}: no og:image`);
}

if (fails.length) { console.error(`FAIL  site config: ${fails.length} problem(s)\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS  site config: _config, CNAME, robots, sitemap (${locs.length} URLs), icons, manifest, security.txt, llms.txt, ${pages.length} pages`);
