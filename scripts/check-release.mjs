// The release consistency check (PR1, 0.3.1): every place that names a download of the DataArcus MCP names the same
// version, file name, SHA-256 and date. Run it on release day, after the download lines are flipped to the new version
// and before the PR to main; until then it reports the old version honestly (that is what the pages still offer).
//   node scripts/check-release.mjs --version 0.3.1           README.md, mcp/README.md, the MCP page (English and its
//                                                             Arabic copy), beta-page.js (EN and AR), mcp/CHANGELOG.md
//   node scripts/check-release.mjs --version 0.3.1 --live    also the live pages on dataarcus.com and the MCP Registry
//   node scripts/check-release.mjs --version 0.3.1 --root <dir>   another tree (the test's fixtures)
// Prints each mismatch, then one line: PASS  check-release  <N> checks (or FAIL ...). Exit code 1 on a mismatch.
// What it compares: the release tag (`releases/tag/v<version>`, `releases/download/v<version>/`), the file name
// (`dataarcus-<version>.mcpb`), the version a download button or line names ("Download 0.3.1", the link "0.3.1 release",
// "for 0.3.1,"), every 64-hex SHA-256 (all must be one), and the release day: mcp/CHANGELOG.md's "## [<version>]:
// YYYY-MM-DD" against the page's "What's new in <version>" date (shown, not the placeholder) and the Registry's
// publishedAt (its UTC day or the UAE day). The Registry entry: its version, its package's address and fileSha256.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MONTHS_AR = createRequire(import.meta.url)('../assets/js/arabic-calendar.js').MONTHS;   // the one Arabic month list
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const FILES = { readme: 'README.md', mcpReadme: 'mcp/README.md', page: 'power-bi-mcp/index.html', pageAr: 'ar/power-bi-mcp/index.html',
  translations: 'assets/js/translations/beta-page.js', changelog: 'mcp/CHANGELOG.md' };
export const LIVE = { page: 'https://dataarcus.com/power-bi-mcp/', pageAr: 'https://dataarcus.com/ar/power-bi-mcp/',
  translations: 'https://dataarcus.com/assets/js/translations/beta-page.js', registry: 'https://registry.modelcontextprotocol.io/v0.1/servers?search=dataarcus' };
const V = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?`;
const PLACEHOLDER = /\[release day\]|\[يوم الإصدار\]/;

// a day written on the page ("Released on 27 October 2026.", «صدر في 27 أكتوبر 2026.») as YYYY-MM-DD, or null
export function dayOf(text) {
  const s = String(text).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
  const m = new RegExp(`(\\d{1,2})\\s+(${[...MONTHS_EN, ...MONTHS_AR].join('|')})\\s+(\\d{4})`).exec(s);
  if (!m) return null;
  const i = MONTHS_EN.indexOf(m[2]) >= 0 ? MONTHS_EN.indexOf(m[2]) : MONTHS_AR.indexOf(m[2]);
  return `${m[3]}-${String(i + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

// what one text names about a download: { kind: version | file | sha, value }
export function downloadFacts(text) {
  const out = [], t = String(text);
  for (const m of t.matchAll(new RegExp(`dataarcus-releases/releases/(?:tag|download)/v(${V})`, 'g'))) out.push({ kind: 'version', value: m[1], how: 'release tag' });
  for (const m of t.matchAll(new RegExp(`dataarcus-(${V})\\.mcpb`, 'g'))) out.push({ kind: 'file', value: `dataarcus-${m[1]}.mcpb`, how: 'file name' });
  for (const m of t.matchAll(new RegExp(`(?:\\bDownload|\\bdownload|نزّل الإصدار)\\s+(${V})\\b|>(${V}) release</a>|صفحة الإصدار (${V})|\\bfor (${V}), \``, 'g'))) {
    out.push({ kind: 'version', value: m[1] || m[2] || m[3] || m[4], how: `"${m[0].trim()}"` });
  }
  for (const m of t.matchAll(/(?<![0-9A-Za-z+/])[0-9a-f]{64}(?![0-9A-Za-z+/=])/g)) out.push({ kind: 'sha', value: m[0], how: 'SHA-256' });
  return out;
}

const sectionId = (version) => 'new-' + version.replace(/-.*$/, '').split('.').join('');   // 0.3.1 -> new-031
// the page's "What's new in <version>" section: { found, hidden, key } (key: its date's translation key)
export function whatsNew(html, version) {
  const sec = (String(html).match(new RegExp(`<section id="${sectionId(version)}"[^>]*>[\\s\\S]*?</section>`)) || [''])[0];
  if (!sec) return { found: false };
  return { found: true, hidden: /^<section[^>]*\shidden(?:="")?[\s>]/.test(sec), key: (sec.match(/data-i18n="beta\.(\w+)\.date"/) || [])[1], text: sec };
}

function translationsOf(src) {
  const box = { window: {} };
  vm.runInNewContext(src, box);
  return box.window.betaPageTranslations || {};
}

// the Registry's answer: every entry named dataarcus, the latest first
export function registryFacts(json) {
  const servers = ((json && json.servers) || []).filter((s) => /dataarcus/i.test((s.server || {}).name || ''));
  const latest = servers.find((s) => ((s._meta || {})['io.modelcontextprotocol.registry/official'] || {}).isLatest) || servers[0];
  if (!latest) return null;
  const meta = (latest._meta || {})['io.modelcontextprotocol.registry/official'] || {}, out = [{ kind: 'version', value: latest.server.version, how: 'version' }];
  for (const p of latest.server.packages || []) {
    out.push(...downloadFacts(p.identifier || '').map((f) => ({ ...f, how: 'package address' })));
    if (p.fileSha256) out.push({ kind: 'sha', value: p.fileSha256, how: 'fileSha256' });
  }
  return { facts: out, published: meta.publishedAt || null };
}
// the days a Registry time counts as the release day: its UTC day and its UAE day (UTC+4); 0.3.0 was published at
// 20:25 UTC on 21 Oct, already 22 Oct in the UAE
export const registryDays = (iso) => { const t = Date.parse(iso); return Number.isNaN(t) ? [] : [new Date(t).toISOString().slice(0, 10), new Date(t + 4 * 3600e3).toISOString().slice(0, 10)]; };

export async function checkRelease({ root = ROOT, version, live = false, fetchText = defaultFetch } = {}) {
  let checks = 0;
  const mismatches = [], ok = (c, msg) => { checks++; if (!c) mismatches.push(msg); };
  const file = `dataarcus-${version}.mcpb`, shas = [];
  const read = (f) => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return null; } };
  // every source that names a download must name this one, with a hash where it gives one
  const compare = (where, text, { needsSha = false } = {}) => {
    const facts = downloadFacts(text);
    ok(facts.some((f) => f.kind !== 'sha'), `${where}: names no download (no release tag, file name or version)`);
    for (const f of facts) {
      if (f.kind === 'version') ok(f.value === version, `${where}: ${f.how} names ${f.value}, want ${version}`);
      if (f.kind === 'file') ok(f.value === file, `${where}: ${f.how} ${f.value}, want ${file}`);
      if (f.kind === 'sha') shas.push({ where, value: f.value, how: f.how });
    }
    if (needsSha) ok(facts.some((f) => f.kind === 'sha'), `${where}: names no SHA-256 for the download`);
  };
  const days = [];
  // the "What's new in <version>" section and its date, in a page and its translations
  const dated = (where, html, T, lang) => {
    const w = whatsNew(html, version);
    if (!w.found) return;
    ok(!w.hidden, `${where}: the "What's new in ${version}" section is hidden (show it at the release)`);
    const d = T && w.key && ((T[lang] || {}).beta || {})[w.key] ? T[lang].beta[w.key].date : (w.text.match(/data-i18n="beta\.\w+\.date">([^<]*)</) || [])[1];
    ok(!!d && !PLACEHOLDER.test(d) && !!dayOf(d), `${where}: the "What's new in ${version}" date is "${d || ''}", want the release day`);
    if (d && dayOf(d)) days.push({ where, value: dayOf(d) });
  };

  const tree = Object.fromEntries(Object.entries(FILES).map(([k, f]) => [k, read(f)]));
  for (const [k, f] of Object.entries(FILES)) ok(tree[k] != null, `${f}: not found`);
  if (tree.readme != null) compare(FILES.readme, tree.readme);
  if (tree.mcpReadme != null) compare(FILES.mcpReadme, tree.mcpReadme.replace(/<!--[\s\S]*?-->/g, ''));   // the RELEASE reminders are not download lines
  let T = null;
  if (tree.translations != null) {
    T = translationsOf(tree.translations);
    for (const lang of ['en', 'ar']) compare(`${FILES.translations} (${lang})`, JSON.stringify(T[lang] || {}), { needsSha: true });
  }
  for (const [k, lang] of [['page', 'en'], ['pageAr', 'ar']]) if (tree[k] != null) {
    compare(FILES[k], tree[k].replace(/<!--[\s\S]*?-->/g, ''), { needsSha: true });
    dated(FILES[k], tree[k], T, lang);
  }
  // the CHANGELOG: the version's own section, released, with its day
  let released = null;
  if (tree.changelog != null) {
    const heads = [...tree.changelog.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);
    const own = heads.find((h) => h.startsWith(`[${version}]`)), top = heads[0] || '';
    const unreleased = /^\[Unreleased\]/i.test(top) && top.includes(version);
    ok(!!own, unreleased ? `${FILES.changelog}: ${version} is still "## ${top}" (name it "## [${version}]: <day>" at the release)` : `${FILES.changelog}: no "## [${version}]: <day>" section`);
    released = own && (own.match(/\b(\d{4}-\d{2}-\d{2})\b/) || [])[1];
    ok(!own || !!released, `${FILES.changelog}: "## ${own}" names no day (YYYY-MM-DD)`);
  }

  if (live) {
    for (const [k, lang] of [['page', 'en'], ['pageAr', 'ar']]) {
      const html = await fetchText(LIVE[k]).catch((e) => { ok(false, `${LIVE[k]}: could not fetch (${e.message})`); return null; });
      if (html == null) continue;
      compare(`${LIVE[k]} (live)`, html.replace(/<!--[\s\S]*?-->/g, ''), { needsSha: true });
      const liveT = await fetchText(LIVE.translations).then(translationsOf).catch(() => null);
      dated(`${LIVE[k]} (live)`, html, liveT, lang);
    }
    const reg = await fetchText(LIVE.registry).then((s) => registryFacts(JSON.parse(s))).catch((e) => { ok(false, `the Registry: could not read ${LIVE.registry} (${e.message})`); return undefined; });
    if (reg === null) ok(false, 'the Registry: no entry named dataarcus');
    if (reg) {
      for (const f of reg.facts) {
        if (f.kind === 'version') ok(f.value === version, `the Registry: ${f.how} ${f.value}, want ${version}`);
        if (f.kind === 'file') ok(f.value === file, `the Registry: ${f.how} names ${f.value}, want ${file}`);
        if (f.kind === 'sha') shas.push({ where: 'the Registry', value: f.value, how: f.how });
      }
      if (released) ok(registryDays(reg.published).includes(released), `the Registry: published ${reg.published}, the CHANGELOG says ${released}`);
    }
  }

  // one hash everywhere: each one that differs from the most common is named
  const count = new Map();
  for (const s of shas) count.set(s.value, (count.get(s.value) || 0) + 1);
  const main = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
  for (const s of shas) ok(!main || s.value === main[0], `${s.where}: ${s.how} ${s.value}, the others name ${main && main[0]}`);
  // one day everywhere: the CHANGELOG's
  for (const d of days) ok(!released || d.value === released, `${d.where}: the release day ${d.value}, the CHANGELOG says ${released}`);
  return { checks, mismatches };
}

async function defaultFetch(url) {
  const r = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), arg = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const version = arg('--version');
  if (!version || !new RegExp(`^${V}$`).test(version)) { console.error('FAIL  check-release  0 checks: give the version, --version 0.3.1'); process.exit(2); }
  const { checks, mismatches } = await checkRelease({ root: arg('--root') ? path.resolve(arg('--root')) : ROOT, version, live: args.includes('--live') });
  if (mismatches.length) {
    mismatches.forEach((m) => console.log('  - ' + m));
    console.log(`FAIL  check-release  ${mismatches.length} of ${checks} checks (version ${version}${args.includes('--live') ? ', live' : ''})`);
    process.exit(1);
  }
  console.log(`PASS  check-release  ${checks} checks (version ${version}${args.includes('--live') ? ', live' : ''})`);
}
