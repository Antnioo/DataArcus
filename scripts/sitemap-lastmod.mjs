// Sets every <lastmod> in sitemap.xml to the date of the page's last commit: the page's HTML and the translation
// scripts it loads (its text lives there too), whichever changed last. Google uses lastmod only when it is accurate.
// Commits that only change boilerplate (CDN versions and their integrity hashes, ?v= cache bumps, the analytics and
// consent loader in each page's head, the Content Security Policy, Clarity's masking attribute) don't count: a library
// or privacy update on every page is not a change to any page's content. Dates are Dubai dates (the site's time zone).
//   node scripts/sitemap-lastmod.mjs           check; exit code 1 and the list when a date is out of step
//   node scripts/sitemap-lastmod.mjs --write   rewrite the stale dates
// Run after committing page changes (uncommitted edits don't count: the date is the commit's).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://dataarcus.com/';
const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// a commit time (Unix seconds) as a date in Dubai
const DUBAI = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' });
export const dubaiDate = (secs) => DUBAI.format(new Date(secs * 1000));

// One line of a page with its boilerplate taken out: the version in a CDN address, integrity and crossorigin
// attributes, and ?v= cache bumps. What is left is what the page says and loads.
const strip = (line) => line
  .replace(/(cdn\.jsdelivr\.net\/npm\/(?:@[^/@"]+\/)?[^/@"]+)@[^/"]+/g, '$1')
  .replace(/\s+integrity="[^"]*"/g, '').replace(/\s+crossorigin="[^"]*"/g, '')
  .replace(/\?v=[^"'&\s]*/g, '').replace(/\s+data-clarity-mask="[^"]*"/g, '')
  .trim();
// lines of the analytics and consent loader in each page's head (the EU time zones, Google Analytics, Clarity), the
// Content Security Policy (scripts/csp.mjs), and lines that are only a script comment: not what the page says
const loader = (line) => /var eu=|clarity\.ms\/tag|googletagmanager\.com\/gtag|gtag\('config'|^<meta http-equiv="Content-Security-Policy"/.test(line) || /^\/\//.test(line);
// true when every line the diff removes comes back, boilerplate aside, as a line it adds (and the other way round)
export function boilerplateOnly(diff) {
  const minus = [], plus = [];
  for (const l of diff.split('\n')) {
    if (/^(---|\+\+\+) /.test(l)) continue;
    const t = strip(l.slice(1));
    if (loader(t)) continue;
    if (l[0] === '-') minus.push(t); else if (l[0] === '+') plus.push(t);
  }
  if (!minus.length && !plus.length) return /^[-+](?![-+]{2} )/m.test(diff);   // only loader lines changed: boilerplate
  const key = (a) => a.filter((x) => x !== '').sort().join('\n');
  return key(minus) === key(plus);
}

// the page file for a sitemap URL ("" -> index.html, "tools/" -> tools/index.html)
const pageFile = (loc) => { const p = loc.slice(SITE.length); return !p ? 'index.html' : p.endsWith('/') ? p + 'index.html' : p; };
// the page's own translation sources (translations/x.min.js -> translations/x.js); common.js (menu and footer on
// every page) is left out: a menu change is not a change to the page's content
const translations = (file, rev) => {
  const html = rev ? git(['show', `${rev}:${file}`]) : fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dir = path.dirname(file);
  const exists = (f) => { if (!rev) return fs.existsSync(path.join(ROOT, f)); try { git(['cat-file', '-e', `${rev}:${f}`]); return true; } catch (e) { return false; } };
  return [...html.matchAll(/src="([^"?]*translations\/[^"?]+?)(?:\.min)?\.js(?:\?[^"]*)?"/g)]
    .map((m) => path.posix.normalize(path.posix.join(dir, m[1] + '.js')))
    .filter((f) => !/translations[\\/]common\.js$/.test(f) && exists(f));
};
// the Dubai date of the last commit that changed the page's content (its HTML or its translations), as of rev
// (default: the files on disk and the current history)
export function pageDate(page, rev) {
  const files = [page, ...translations(page, rev)];
  for (const row of git(['log', '--format=%H %ct', ...(rev ? [rev] : []), '--', ...files]).trim().split('\n').filter(Boolean)) {
    const [sha, secs] = row.split(' ');
    if (!boilerplateOnly(git(['show', '--format=', '-U0', '--no-color', sha, '--', ...files]))) return dubaiDate(+secs);
  }
  return null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const file = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(file, 'utf8');
  const stale = [];
  xml = xml.replace(/(<loc>([^<]+)<\/loc>\s*<lastmod>)([^<]+)(<\/lastmod>)/g, (all, head, loc, old, tail) => {
    const page = pageFile(loc);
    if (!fs.existsSync(path.join(ROOT, page))) { stale.push(`${loc}: no file ${page}`); return all; }
    const date = pageDate(page);
    if (!date || date === old) return all;
    stale.push(`${loc}: ${old} -> ${date}`);
    return head + date + tail;
  });
  if (write) {
    if (stale.length) fs.writeFileSync(file, xml);
    console.log(stale.length ? `Updated ${stale.length} dates:\n  ${stale.join('\n  ')}` : 'All lastmod dates match the last commits.');
  } else if (stale.length) {
    console.log(`${stale.length} lastmod dates out of step (node scripts/sitemap-lastmod.mjs --write):\n  ${stale.join('\n  ')}`);
    process.exit(1);
  } else console.log('All lastmod dates match the last commits.');
}
