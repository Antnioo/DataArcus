// Weekly watch on Microsoft's Power BI updates (G1; .github/workflows/microsoft-watch.yml).
// Reads Microsoft's own sources: the PBIR report schemas (github.com/microsoft/json-schemas), the report theme schema
// (github.com/microsoft/powerbi-desktop-samples), the validator and the visual catalog on npm, and the Power BI blog's
// feed (a new "Feature Summary" post). Compares them with what DataArcus is built on and, when something is newer,
// opens ONE issue labelled "microsoft-update" (or comments on the open one) saying what changed and what in DataArcus
// it may touch. It never changes code, never opens a pull request, never merges.
// What DataArcus is built on is read where it lives (one place for every version): the bundled schemas (mcp/schemas),
// the writer's schema versions (assets/js/pbip-query.js, assets/js/pbip-export.js), the pins (mcp/package.json).
// mcp/research/microsoft-watch.json holds only what is nowhere else: the theme schema and Feature Summary last checked,
// and the report folders not bundled on purpose. A Microsoft source that can't be read is a warning; the run passes.
// Run by hand: node scripts/microsoft-watch.mjs --dry-run   (prints the issue, writes nothing; mcp/research/MICROSOFT-WATCH.md)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LABEL = 'microsoft-update';
export const TITLE = 'Microsoft Power BI update: DataArcus may need a look';
const GH = 'https://api.github.com';
export const URLS = {
  feed: 'https://powerbi.microsoft.com/en-us/blog/feed/',
  schemasItem: `${GH}/repos/microsoft/json-schemas/contents/fabric/item`,
  schemasTree: (sha) => `${GH}/repos/microsoft/json-schemas/git/trees/${sha}?recursive=1`,
  schemasCommit: `${GH}/repos/microsoft/json-schemas/commits?path=fabric/item/report&per_page=1`,
  schemaFolder: (fam, v) => `https://github.com/microsoft/json-schemas/tree/main/fabric/item/report/${fam}/${v}`,
  themeDir: `${GH}/repos/microsoft/powerbi-desktop-samples/contents/Report%20Theme%20JSON%20Schema`,
  themeCommit: `${GH}/repos/microsoft/powerbi-desktop-samples/commits?path=Report%20Theme%20JSON%20Schema&per_page=1`,
  npm: (name) => `https://registry.npmjs.org/${name.replace('/', '%2f')}`,
  npmPage: (name, v) => `https://www.npmjs.com/package/${name}/v/${v}`
};
const PACKAGES = ['@microsoft/powerbi-report-authoring-cli', '@microsoft/powerbi-core-visual-schema'];
const STATE = 'mcp/research/microsoft-watch.json';
const DOC = 'mcp/research/MICROSOFT-WATCH.md';

// what a change may touch in DataArcus
const TOUCH = {
  bundled: "the bundled schemas check_report reads (`mcp/schemas`, `mcp/schemas/SOURCE.md`, `SCHEMA_COMMIT` in `mcp/lib/check-report.mjs`): until they are copied, check_report lists files with this version under notChecked",
  writer: (v) => `the writer's schema versions (\`assets/js/pbip-query.js\` SCHEMA, \`assets/js/pbip-export.js\`): DataArcus writes ${v}, an older version on purpose so reports open in older Desktop builds; change it only if Desktop needs the newer one`,
  unbundled: (why) => `\`${STATE}\` (the version seen); not bundled on purpose: ${why}`,
  theme: "the theme generator (`assets/js/design-engine.js`: the theme JSON the website and `generate_theme` write), and check_report's theme note (the theme schema is not bundled: listed under notChecked)",
  themeState: `\`${STATE}\` themeSchema (once DataArcus's themes are checked against it)`,
  validator: "the validator pin (`mcp/package.json`; the version VALIDATOR_VERSION reads), check_report's known notes (`VALIDATOR_GAPS` in `mcp/lib/check-report.mjs`)",
  catalog: "the catalog pin (`mcp/package.json`: the validator reads the copy installed beside it), check_report's known notes (`VALIDATOR_GAPS` in `mcp/lib/check-report.mjs`: a gap is known only while the catalog lacks the object), `NATIVE_TYPES` in `assets/js/visual-types.js`",
  post: 'read it for report, visual and theme changes: it feeds the next "Power BI update" job (like U1, `mcp/work/U1.md`)',
  postState: `\`${STATE}\` featureSummary (once it is read)`
};
const SECTIONS = {
  schemas: '## Report schemas (microsoft/json-schemas, `fabric/item/report`)',
  theme: '## Report theme schema (microsoft/powerbi-desktop-samples)',
  npm: "## Microsoft's validator and visual catalog (npm)",
  post: "## The Power BI blog's Feature Summary"
};

export const cmpVer = (a, b) => {
  const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d < 0 ? -1 : 1; }
  return 0;
};
const SEMVER = /^\d+\.\d+\.\d+$/;
const newest = (vs) => vs.slice().sort(cmpVer).pop();
const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

// ---------- what DataArcus is built on, read from the repo ----------
export function readBaseline(root) {
  const bundled = {};
  const reportDir = path.join(root, 'mcp/schemas/fabric/item/report');
  const walk = (dir) => {
    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const full = path.join(dir, d.name);
      if (SEMVER.test(d.name)) {
        const fam = path.relative(reportDir, dir).split(path.sep).join('/');
        if (!bundled[fam] || cmpVer(d.name, bundled[fam]) > 0) bundled[fam] = d.name;
      } else walk(full);
    }
  };
  walk(reportDir);
  const writer = {};
  for (const f of ['assets/js/pbip-query.js', 'assets/js/pbip-export.js']) {
    for (const m of fs.readFileSync(path.join(root, f), 'utf8').matchAll(/item\/report\/([\w/]+?)\/(\d+\.\d+\.\d+)\/schema\.json/g)) writer[m[1]] = m[2];
  }
  const deps = JSON.parse(fs.readFileSync(path.join(root, 'mcp/package.json'), 'utf8')).dependencies || {};
  const pins = Object.fromEntries(PACKAGES.map((p) => [p, String(deps[p] || '').replace(/^[\^~=]/, '')]));
  const state = JSON.parse(fs.readFileSync(path.join(root, STATE), 'utf8'));
  return { bundled: sortObj(bundled), writer: sortObj(writer), pins, state };
}

// ---------- Microsoft's sources ----------
const decode = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
export function feedPosts(xml) {
  const posts = [];
  for (const m of String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)) {
    const tag = (t) => { const x = m[1].match(new RegExp(`<${t}\\b[^>]*>([\\s\\S]*?)</${t}>`)); return x ? decode(x[1]) : ''; };
    const url = tag('link'), id = (url.match(/\/ba-p\/(\d+)/) || [])[1];
    posts.push({ title: tag('title'), url, id: id ? Number(id) : null, date: tag('pubDate') });
  }
  return posts;
}

export async function fetchUpstream({ fetch, token, warn }) {
  const headers = { 'user-agent': 'DataArcus weekly Microsoft watch (+https://dataarcus.com)' };
  const ghHeaders = { ...headers, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', ...(token ? { authorization: `Bearer ${token}` } : {}) };
  const get = async (url, h, kind = 'json') => {
    const r = await fetch(url, { headers: h, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
    return kind === 'json' ? r.json() : r.text();
  };
  const up = { reportSchemas: null, theme: null, packages: {}, posts: null };
  const lastCommit = async (url, what) => {
    try { const c = (await get(url, ghHeaders))[0]; return c ? { sha: c.sha.slice(0, 7), url: c.html_url, date: (c.commit.committer.date || '').slice(0, 10), message: c.commit.message.split('\n')[0] } : null; }
    catch (e) { warn(`${what}: the last commit could not be read (${e.message}); the change is still reported`); return null; }
  };

  try {
    const item = await get(URLS.schemasItem, ghHeaders);
    const report = Array.isArray(item) && item.find((e) => e.name === 'report' && e.type === 'dir');
    if (!report) throw new Error('no fabric/item/report folder in the answer');
    const tree = await get(URLS.schemasTree(report.sha), ghHeaders);
    if (!tree || !Array.isArray(tree.tree)) throw new Error('the tree answer has no file list');
    if (tree.truncated) warn('Report schemas: the tree of fabric/item/report came back truncated: a newer folder could be missed this week');
    const versions = {};
    for (const e of tree.tree) {
      const m = e.type === 'blob' && e.path.match(/^(.+)\/(\d+\.\d+\.\d+)\/[^/]+$/);
      if (m && (!versions[m[1]] || cmpVer(m[2], versions[m[1]]) > 0)) versions[m[1]] = m[2];
    }
    if (!Object.keys(versions).length) throw new Error('no version folder found');
    up.reportSchemas = { versions: sortObj(versions), commit: null };
  } catch (e) { warn(`Report schemas (microsoft/json-schemas) could not be read: ${e.message}`); }

  try {
    const files = await get(URLS.themeDir, ghHeaders);
    const list = (Array.isArray(files) ? files : []).map((f) => ({ f, m: f.name.match(/^reportThemeSchema-(\d+(?:\.\d+)*)\.json$/) })).filter((x) => x.m);
    if (!list.length) throw new Error('no reportThemeSchema-*.json file in the folder');
    const top = list.sort((a, b) => cmpVer(a.m[1], b.m[1])).pop();
    up.theme = { newest: top.m[1], file: top.f.name, url: top.f.html_url || `https://github.com/microsoft/powerbi-desktop-samples/blob/main/Report%20Theme%20JSON%20Schema/${top.f.name}`, commit: null };
  } catch (e) { warn(`Report theme schema (microsoft/powerbi-desktop-samples) could not be read: ${e.message}`); }

  for (const name of PACKAGES) {
    try {
      const j = await get(URLS.npm(name), headers);
      const latest = j && j['dist-tags'] && j['dist-tags'].latest;
      if (!latest) throw new Error('no "latest" tag');
      up.packages[name] = { latest, date: ((j.time || {})[latest] || '').slice(0, 10) };
    } catch (e) { warn(`npm ${name} could not be read: ${e.message}`); }
  }

  try {
    const posts = feedPosts(await get(URLS.feed, headers, 'text'));
    if (!posts.length) throw new Error('no post found in the answer');
    up.posts = posts;
  } catch (e) { warn(`The Power BI blog feed could not be read: ${e.message}`); }

  // the latest commit of each GitHub source, for the issue's links (only when something there is newer is it shown)
  if (up.reportSchemas) up.reportSchemas.commit = await lastCommit(URLS.schemasCommit, 'Report schemas');
  if (up.theme) up.theme.commit = await lastCommit(URLS.themeCommit, 'Report theme schema');
  return up;
}

// ---------- the comparison ----------
export function compare(base, up) {
  const out = [];
  const { state } = base;
  const unb = state.unbundledReportFolders || {};
  if (up.reportSchemas) {
    const commitLink = up.reportSchemas.commit ? [up.reportSchemas.commit.url] : [];
    for (const [fam, v] of Object.entries(up.reportSchemas.versions)) {
      const link = [URLS.schemaFolder(fam, v), ...commitLink];
      const wrote = base.writer[fam] ? [TOUCH.writer(`${fam} ${base.writer[fam]}`)] : [];
      if (base.bundled[fam]) {
        if (cmpVer(v, base.bundled[fam]) > 0) out.push({ key: `schema:${fam}@${v}`, section: 'schemas', title: `${fam} ${v}`, was: `DataArcus bundles ${base.bundled[fam]}`, links: link, touches: [TOUCH.bundled, ...wrote] });
      } else if (unb[fam]) {
        if (cmpVer(v, unb[fam].seen) > 0) out.push({ key: `unbundled:${fam}@${v}`, section: 'schemas', title: `${fam} ${v}`, was: `last seen ${unb[fam].seen}, not bundled`, links: link, touches: [TOUCH.unbundled(unb[fam].why)] });
      } else {
        out.push({ key: `folder:${fam}@${v}`, section: 'schemas', title: `new folder ${fam} (${v})`, was: 'not bundled, not seen before', links: link, touches: [TOUCH.bundled, ...wrote] });
      }
    }
  }
  if (up.theme && state.themeSchema && cmpVer(up.theme.newest, state.themeSchema.newest) > 0) {
    out.push({ key: `theme:${up.theme.newest}`, section: 'theme', title: up.theme.file, was: `DataArcus was last checked against ${state.themeSchema.file || state.themeSchema.newest}`,
      links: [up.theme.url, ...(up.theme.commit ? [up.theme.commit.url] : [])], touches: [TOUCH.theme, TOUCH.themeState] });
  }
  for (const name of PACKAGES) {
    const p = up.packages[name], pin = base.pins[name];
    if (p && pin && cmpVer(p.latest, pin) > 0) {
      out.push({ key: `npm:${name}@${p.latest}`, section: 'npm', title: `${name} ${p.latest}${p.date ? ` (${p.date})` : ''}`, was: `mcp/package.json pins ${pin}`,
        links: [URLS.npmPage(name, p.latest)], touches: [/authoring-cli/.test(name) ? TOUCH.validator : TOUCH.catalog] });
    }
  }
  if (up.posts && state.featureSummary) {
    const fresh = up.posts.filter((p) => /feature summary/i.test(p.title) && p.id && p.id > state.featureSummary.id).sort((a, b) => a.id - b.id);
    for (const p of fresh) out.push({ key: `post:${p.id}`, section: 'post', title: `${p.title}${p.date ? ` (${p.date})` : ''}`, was: `last read: ${state.featureSummary.title}`, links: [p.url], touches: [TOUCH.post, TOUCH.postState] });
  }
  return out;
}

// ---------- the issue ----------
const KEYLINE = 'microsoft-watch-keys:';
const BOT_LOGIN = 'github-actions[bot]';   // who writes the workflow's comments (GITHUB_TOKEN)
export const keysIn = (text) => new Set([...String(text || '').matchAll(new RegExp(`<!-- ${KEYLINE} ([^>]*?) -->`, 'g'))].flatMap((m) => m[1].split(/\s+/).filter(Boolean)));
function sections(changes) {
  const lines = [];
  for (const [sec, head] of Object.entries(SECTIONS)) {
    const cs = changes.filter((c) => c.section === sec);
    if (!cs.length) continue;
    lines.push(head, '');
    for (const c of cs) {
      lines.push(`- **${c.title}**: ${c.was}. ${c.links.map((l, i) => `[${i ? 'commit' : 'link'}](${l})`).join(', ')}`);
      for (const t of c.touches) lines.push(`  - May touch: ${t}`);
    }
    lines.push('');
  }
  return lines;
}
const keyLine = (changes) => `<!-- ${KEYLINE} ${changes.map((c) => c.key).join(' ')} -->`;
export function issueBody(changes, { runUrl } = {}) {
  return [
    `The weekly Microsoft watch (\`scripts/microsoft-watch.mjs\`) found ${changes.length === 1 ? 'one thing' : `${changes.length} things`} newer than what DataArcus is built on.`,
    'It never changes code, never opens pull requests and never merges: decide what to do with each line (what to check and update: `' + DOC + '`).',
    'New findings are added to this issue as comments while it is open; close it once each line is handled.',
    '',
    ...sections(changes),
    runUrl ? `Run: ${runUrl}` : '',
    keyLine(changes)
  ].join('\n');
}
export function commentBody(changes, { runUrl } = {}) {
  return [`Newer since this issue was opened (${new Date().toISOString().slice(0, 10)}):`, '', ...sections(changes), runUrl ? `Run: ${runUrl}` : '', keyLine(changes)].join('\n');
}

// gh(method, path, body): GitHub's REST API for this repository; throws on an error answer (err.status)
export async function syncIssue({ changes, gh, dryRun, runUrl, log }) {
  let open = null;
  if (gh) {
    const list = await gh('GET', `issues?state=open&labels=${LABEL}&sort=created&direction=asc&per_page=20`);
    open = (list || []).find((i) => !i.pull_request) || null;
  }
  if (open) {
    // the keys already reported: the issue's own (only the workflow and the owner label it) and the workflow's
    // comments; anyone can comment on a public issue, so a key line in another comment is ignored (AUD-044)
    const known = keysIn(open.body);
    // (CX1, Codex's F10: only the first 100 comments were read) every page, until a page that is not full
    for (let page = 1; page <= 100; page++) {
      const list = (await gh('GET', `issues/${open.number}/comments?per_page=100&page=${page}`)) || [];
      for (const c of list) if (c.user && c.user.login === BOT_LOGIN) for (const k of keysIn(c.body)) known.add(k);
      if (list.length < 100) break;
    }
    const fresh = changes.filter((c) => !known.has(c.key));
    if (!fresh.length) { log(`Already reported in issue #${open.number}: nothing to add.`); return { action: 'already' }; }
    const body = commentBody(fresh, { runUrl });
    if (dryRun) { log(`Would comment on issue #${open.number}:\n\n${body}`); return { action: 'dry-run', body }; }
    const r = await gh('POST', `issues/${open.number}/comments`, { body });
    log(`Commented on issue #${open.number}: ${r.html_url || ''}`);
    return { action: 'commented', body };
  }
  const body = issueBody(changes, { runUrl });
  if (dryRun) { log(`Would open the issue "${TITLE}" (label ${LABEL}):\n\n${body}`); return { action: 'dry-run', body }; }
  try { await gh('POST', 'labels', { name: LABEL, color: '0e8a16', description: 'Microsoft published something DataArcus is built on (the weekly watch)' }); }
  catch (e) { if (e.status !== 422) log(`::warning::The label ${LABEL} could not be made (${e.message}); the issue is opened anyway`); }
  const r = await gh('POST', 'issues', { title: TITLE, body, labels: [LABEL] });
  log(`Opened issue #${r.number}: ${r.html_url || ''}`);
  return { action: 'created', body };
}

function ghClient({ fetch, token, repo, api }) {
  return async (method, p, body) => {
    const r = await fetch(`${api}/repos/${repo}/${p}`, {
      method, signal: AbortSignal.timeout(30000),
      headers: { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', authorization: `Bearer ${token}`, 'user-agent': 'DataArcus weekly Microsoft watch', ...(body ? { 'content-type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!r.ok) { const e = new Error(`GitHub ${method} ${p}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`); e.status = r.status; throw e; }
    return r.json();
  };
}

// ---------- the run ----------
export async function main({ argv = process.argv.slice(2), env = process.env, fetch = globalThis.fetch, root, log = console.log, returnChanges = false } = {}) {
  const dryRun = argv.includes('--dry-run');
  const base = readBaseline(root);
  const warnings = [];
  const up = await fetchUpstream({ fetch, token: env.GITHUB_TOKEN, warn: (w) => warnings.push(w) });
  const changes = compare(base, up);
  if (returnChanges) return changes;
  for (const w of warnings) log(`::warning::${w}`);
  log(`Read: report schemas ${up.reportSchemas ? Object.keys(up.reportSchemas.versions).length + ' folders' : 'no'}; theme schema ${up.theme ? up.theme.newest : 'no'}; npm ${PACKAGES.map((p) => `${p.split('/')[1]} ${up.packages[p] ? up.packages[p].latest : '?'}`).join(', ')}; blog ${up.posts ? up.posts.length + ' posts' : 'no'}.`);
  if (!changes.length) { log('No change: nothing newer than what DataArcus is built on.'); return 0; }
  log(`${changes.length} newer: ${changes.map((c) => c.key).join(', ')}`);
  const repo = env.GITHUB_REPOSITORY, token = env.GITHUB_TOKEN;
  if (!dryRun && (!repo || !token)) { log('::error::GITHUB_TOKEN and GITHUB_REPOSITORY are needed to open the issue (or run with --dry-run).'); return 1; }
  const gh = repo && token ? ghClient({ fetch, token, repo, api: env.GITHUB_API_URL || GH }) : null;
  const runUrl = env.GITHUB_RUN_ID && repo ? `${env.GITHUB_SERVER_URL || 'https://github.com'}/${repo}/actions/runs/${env.GITHUB_RUN_ID}` : '';
  try { await syncIssue({ changes, gh, dryRun, runUrl, log }); return 0; }
  catch (e) { log(`::error::The issue could not be written: ${e.message}`); return 1; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main({ root: path.join(path.dirname(fileURLToPath(import.meta.url)), '..') });
}
