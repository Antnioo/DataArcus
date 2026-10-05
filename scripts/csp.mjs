// A Content Security Policy for every HTML page (audit AUD-011): a <meta http-equiv="Content-Security-Policy"> right
// after <meta charset>, allowing exactly what that page loads. GitHub Pages can't send headers, so the policy lives in
// the page; a <meta> policy can't set frame-ancestors or report-uri.
//   - scripts: the site's own files, the SHA-256 of each inline script on the page (an edited inline script needs this
//     script run again: the site tests fail until it is), the jsDelivr package folders the page loads scripts from
//     (npm/<package>@<version>/: never the whole host, which serves any package and any GitHub repository; audit
//     AUD-029), and on pages with the consent
//     loader Google Analytics and Microsoft Clarity (they only load after consent; the policy only allows them)
//   - the async stylesheet pattern's onload="..." handler, by its hash ('unsafe-hashes' allows only that exact text)
//   - styles: inline styles are allowed (the pages and tools set style attributes); Google Fonts and the jsDelivr
//     package folders the page loads stylesheets from
//   - fonts: Google Fonts, and the folder of a jsDelivr stylesheet that loads its own fonts (Bootstrap Icons); images: the site, data: and blob: (the tools' previews), the
//     hosts of the page's own <img> from other sites (the certification badge), and the analytics beacons;
//     connections: the analytics beacons, and Web3Forms on the page with the contact form
//   - frames: Power BI only on pages with the "Load the live report" facade, and the Google tag's own frame; nothing else
//   - no plugins (object-src 'none'), <base> only to the site, forms post only to the site or Web3Forms
//
//   node scripts/csp.mjs           check: exit code 1 and the list when a page's policy is missing or out of date
//   node scripts/csp.mjs --write   write the policies
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = (s) => `'sha256-${crypto.createHash('sha256').update(s, 'utf8').digest('base64')}'`;
// Google's list for the Google tag (developers.google.com/tag-platform/security/guides/csp, with Google signals and the
// Ads conversion the contact form's generate_lead reports), except its country domains (*.google.<TLD>), one per
// country: the beacons measured go to analytics.google.com, www.google.com and stats.g.doubleclick.net
const GA = { script: ['https://www.googletagmanager.com'], frame: ['https://www.googletagmanager.com'],
  img: ['https://www.googletagmanager.com', 'https://*.google-analytics.com', 'https://*.google.com', 'https://*.g.doubleclick.net'],
  connect: ['https://www.googletagmanager.com', 'https://*.google-analytics.com', 'https://*.google.com', 'https://*.g.doubleclick.net', 'https://pagead2.googlesyndication.com'] };
// jsDelivr packages whose stylesheet loads font files from its own folder
const FONT_PACKAGES = ['bootstrap-icons'];
const CLARITY = { script: ['https://*.clarity.ms'], frame: [], img: ['https://*.clarity.ms', 'https://c.bing.com'], connect: ['https://*.clarity.ms', 'https://c.bing.com'] };

// the policy a page needs, from its HTML
export function policy(html) {
  const scripts = [...html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)].filter((m) => !/\bsrc\s*=/i.test(m[1] || '') && !/type\s*=\s*["']?application\/(ld\+)?json/i.test(m[1] || ''));
  const inline = [...new Set(scripts.map((m) => sha(m[2])))];
  const handlers = [...new Set([...html.matchAll(/\son[a-z]+="([^"]*)"/gi)].map((m) => sha(m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'))))];
  const ga = /googletagmanager\.com\/gtag/.test(html), clarity = /clarity\.ms\/tag/.test(html);
  // jsDelivr, package by package: the folders of the scripts and of the stylesheets the page loads
  const jsdIn = (re) => [...new Set([...html.matchAll(re)].map((m) => `https://cdn.jsdelivr.net/npm/${m[1]}/`))];
  const jsdScripts = jsdIn(/<script\b[^>]*\ssrc="https:\/\/cdn\.jsdelivr\.net\/npm\/((?:@[^/"]+\/)?[^/"@]+@[^/"]+)\//gi);
  const jsdStyles = jsdIn(/<link\b[^>]*\shref="https:\/\/cdn\.jsdelivr\.net\/npm\/((?:@[^/"]+\/)?[^/"@]+@[^/"]+)\/[^"]*\.css"/gi);
  const jsdFonts = jsdStyles.filter((u) => FONT_PACKAGES.some((f) => u.startsWith(`https://cdn.jsdelivr.net/npm/${f}@`)));
  const gf = /https:\/\/fonts\.googleapis\.com\//.test(html) || /lang-manager/.test(html);
  const pbi = /data-pbi-src="https:\/\/app\.powerbi\.com\//.test(html), form = /id="contact-form"/.test(html);
  const imgHosts = [...new Set([...html.matchAll(/<(?:img|source)\b[^>]*\s(?:src|srcset)="(https:\/\/[^/"\s]+)/gi)].map((m) => m[1]))];   // pictures on other sites (a badge)
  const pick = (k) => [...(ga ? GA[k] : []), ...(clarity ? CLARITY[k] : [])];
  const d = [
    ["default-src", "'self'"],
    ['script-src', "'self'", ...inline, ...(handlers.length ? ["'unsafe-hashes'", ...handlers] : []), ...jsdScripts, ...pick('script')],
    ['style-src', "'self'", "'unsafe-inline'", ...(gf ? ['https://fonts.googleapis.com'] : []), ...jsdStyles],
    ['font-src', "'self'", ...(gf ? ['https://fonts.gstatic.com'] : []), ...jsdFonts],
    ['img-src', "'self'", 'data:', 'blob:', ...imgHosts, ...pick('img')],
    ['connect-src', "'self'", ...pick('connect'), ...(form ? ['https://api.web3forms.com'] : [])],
    ['frame-src', ...((pbi || ga) ? [...(pbi ? ['https://app.powerbi.com'] : []), ...pick('frame')] : ["'none'"])],
    ['object-src', "'none'"],
    ['base-uri', "'self'"],
    ['form-action', "'self'", ...(form ? ['https://api.web3forms.com'] : [])],
  ];
  return d.map((x) => [...new Set(x)].join(' ')).join('; ');
}

const META = /\n?[ \t]*<meta http-equiv="Content-Security-Policy" content="[^"]*"\s*\/?>/;
// the page with its policy in place: right after <meta charset>, indented like it
export function apply(html) {
  const bare = html.replace(META, '');
  const m = bare.match(/^([ \t]*)<meta charset=[^>]*>/im);
  if (!m) throw new Error('no <meta charset>');
  const tag = `${m[1]}<meta http-equiv="Content-Security-Policy" content="${policy(bare)}">`;
  return bare.slice(0, m.index + m[0].length) + '\n' + tag + bare.slice(m.index + m[0].length);
}

export const files = () => execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT }).toString().trim().split(/\r?\n/).filter((p) => p && !/^(mcp|scripts|node_modules)\//.test(p));

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write'), stale = [];
  for (const f of files()) {
    const file = path.join(ROOT, f), html = fs.readFileSync(file, 'utf8'), want = apply(html);
    if (want !== html) { stale.push(f); if (write) fs.writeFileSync(file, want); }
  }
  if (write) console.log(stale.length ? `Wrote the policy of ${stale.length} pages.` : 'Every page has its policy.');
  else if (stale.length) { console.log(`${stale.length} pages without their current policy (node scripts/csp.mjs --write):\n  ${stale.join('\n  ')}`); process.exit(1); }
  else console.log(`All ${files().length} pages carry their current policy.`);
}
