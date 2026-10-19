// Tests for the weekly Microsoft watch (scripts/microsoft-watch.mjs, G1). Fixed answers stand in for Microsoft's
// sources and GitHub's issues API, so it needs no network.
//   node scripts/test-microsoft-watch.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBaseline, compare, issueBody, keysIn, syncIssue, main, cmpVer, URLS, LABEL } from './microsoft-watch.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let checks = 0, fails = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL ' + msg); } };
const eq = (got, want, msg) => ok(JSON.stringify(got) === JSON.stringify(want), `${msg}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// ---------- W1: what DataArcus is built on, read from the repo ----------
const base = readBaseline(ROOT);
eq([base.bundled['definition/visualContainer'], base.bundled['definition/report'], base.bundled['definition/page'], base.bundled['definitionProperties']], ['2.13.0', '3.3.0', '2.1.0', '2.0.0'], 'W1 bundled newest from mcp/schemas');
ok(!('definition/definitionStructure' in base.bundled) && !('localSettings' in base.bundled), 'W1 the two unbundled folders are not bundled');
eq(base.writer, { 'definition/bookmark': '1.4.0', 'definition/bookmarksMetadata': '1.0.0', 'definition/page': '2.0.0', 'definition/pagesMetadata': '1.0.0',
  'definition/report': '2.1.0', 'definition/reportExtension': '1.0.0', 'definition/versionMetadata': '1.0.0', 'definition/visualContainer': '2.1.0',
  'definition/visualContainerMobileState': '2.1.0', 'definitionProperties': '2.0.0' }, 'W1 the writer\'s versions (sorted)');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'mcp/package.json'), 'utf8')).dependencies;
eq(base.pins, { '@microsoft/powerbi-report-authoring-cli': pkg['@microsoft/powerbi-report-authoring-cli'], '@microsoft/powerbi-core-visual-schema': pkg['@microsoft/powerbi-core-visual-schema'] }, 'W1 pins read from mcp/package.json');
eq([base.state.themeSchema.newest, base.state.featureSummary.id], ['2.159', 5374650], 'W1 the state file');
eq([cmpVer('2.98', '2.159') < 0, cmpVer('2.13.0', '2.9.0') > 0, cmpVer('1.0.0', '1.0.0')], [true, true, 0], 'W1 versions compare as numbers');

// ---------- fixtures: Microsoft's sources as they answered on 19 Oct 2026 ----------
const folders = (over = {}) => {
  const v = { ...base.bundled, 'definition/definitionStructure': '3.3.0', localSettings: '1.0.0', ...over };
  const tree = [];
  for (const [f, ver] of Object.entries(v)) { tree.push({ path: `${f}/1.0.0/schema.json`, type: 'blob' }); tree.push({ path: `${f}/${ver}`, type: 'tree' }); tree.push({ path: `${f}/${ver}/schema.json`, type: 'blob' }); }
  return { sha: 'r', truncated: false, tree };
};
const FEED = (extra = '') => `<?xml version="1.0"?><rss><channel><title>Power BI Updates Blog articles</title>${extra}
<item><title>Fabric Data Warehouse integration with Fabric User Data Functions (Preview)</title><link>https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Fabric-Data-Warehouse/ba-p/5375137</link><pubDate>Mon, 19 Oct 2026 21:00:00 GMT</pubDate></item>
<item><title>Power BI October 2026 Feature Summary</title><link>https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Power-BI-October-2026-Feature-Summary/ba-p/5374650</link><pubDate>Thu, 15 Oct 2026 21:25:10 GMT</pubDate></item>
<item><title>Power BI September 2026 Feature Summary</title><link>https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Power-BI-September-2026-Feature-Summary/ba-p/5325831</link><pubDate>Thu, 15 Oct 2026 21:06:46 GMT</pubDate></item>
</channel></rss>`;
const THEMES = (newest = '2.159') => ['2.98', '2.158', newest].map((v) => ({ name: `reportThemeSchema-${v}.json`, type: 'file', html_url: `https://github.com/microsoft/powerbi-desktop-samples/blob/main/Report%20Theme%20JSON%20Schema/reportThemeSchema-${v}.json` }));
const NPM = (v) => ({ 'dist-tags': { latest: v }, time: { [v]: '2026-10-19T00:00:00Z' } });

// a fake fetch: Microsoft's sources and GitHub's issues API; `fail` names sources that throw; `issues` is the repo's state
function world({ tree = folders(), themes = THEMES(), cli = '0.5.0', catalog = '0.1.3', feed = FEED(), fail = [], issues = [], comments = {} } = {}) {
  const calls = [];
  const res = (body, status = 200) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  const f = async (url, opts = {}) => {
    const method = (opts.method || 'GET').toUpperCase();
    calls.push({ method, url, body: opts.body ? JSON.parse(opts.body) : undefined });
    const src = url === URLS.feed ? 'feed' : url.includes('registry.npmjs.org') ? 'npm' : url.includes('microsoft/json-schemas') ? 'schemas' : url.includes('powerbi-desktop-samples') ? 'theme' : 'github';
    if (fail.includes(src)) throw new TypeError('fetch failed');
    if (src === 'feed') return new Response(feed, { status: 200 });
    if (src === 'npm') return res(NPM(url.includes('authoring-cli') ? cli : catalog));
    if (src === 'schemas') {
      if (/\/contents\/fabric\/item$/.test(url)) return res([{ name: 'report', type: 'dir', sha: 'r' }, { name: 'semanticModel', type: 'dir', sha: 's' }]);
      if (/\/git\/trees\/r\?recursive=1$/.test(url)) return res(tree);
      if (/\/commits\?/.test(url)) return res([{ sha: 'abc1234def', html_url: 'https://github.com/microsoft/json-schemas/commit/abc1234def', commit: { message: 'Publish report schemas', committer: { date: '2026-10-15T00:00:00Z' } } }]);
    }
    if (src === 'theme') {
      if (/\/contents\//.test(url)) return res(themes);
      if (/\/commits\?/.test(url)) return res([{ sha: '64ff6b1aa', html_url: 'https://github.com/microsoft/powerbi-desktop-samples/commit/64ff6b1aa', commit: { message: 'Theme schema update', committer: { date: '2026-10-15T00:00:00Z' } } }]);
    }
    if (src === 'github') {
      const m = url.match(/\/repos\/o\/r\/(.*)$/);
      const p = m ? m[1] : '';
      if (method === 'GET' && p.startsWith('issues?')) return res(issues);
      if (method === 'GET' && /^issues\/\d+\/comments/.test(p)) return res(comments[p.match(/\d+/)[0]] || []);
      if (method === 'POST' && p === 'labels') return res({ message: 'Validation Failed' }, 422);
      if (method === 'POST' && p === 'issues') return res({ number: 9, html_url: 'https://github.com/o/r/issues/9' }, 201);
      if (method === 'POST' && /^issues\/\d+\/comments$/.test(p)) return res({ html_url: 'https://github.com/o/r/issues/5#c' }, 201);
    }
    return res({ message: 'Not Found' }, 404);
  };
  f.calls = calls;
  return f;
}
const ENV = { GITHUB_TOKEN: 't', GITHUB_REPOSITORY: 'o/r', GITHUB_SERVER_URL: 'https://github.com', GITHUB_RUN_ID: '42' };
async function run(w, argv = [], env = ENV) {
  const out = [];
  const code = await main({ argv, env, fetch: w, root: ROOT, log: (s) => out.push(String(s)) });
  return { code, out: out.join('\n'), posts: w.calls.filter((c) => c.method !== 'GET') };
}
const changesOf = async (w) => { const out = []; const r = await main({ argv: ['--dry-run'], env: {}, fetch: w, root: ROOT, log: (s) => out.push(String(s)), returnChanges: true }); return r; };

// ---------- W2: the same versions everywhere ----------
{
  const w = world();
  const r = await run(w);
  eq([r.code, r.posts.length], [0, 0], 'W2 same versions: exit 0, nothing written');
  ok(/no change/i.test(r.out), 'W2 the log says no change');
  eq((await changesOf(world())).length, 0, 'W2 no change found');
}

// ---------- W3: a newer bundled folder ----------
{
  const ch = await changesOf(world({ tree: folders({ 'definition/visualContainer': '2.14.0' }) }));
  eq(ch.map((c) => c.key), ['schema:definition/visualContainer@2.14.0'], 'W3 one change, keyed');
  ok(/2\.13\.0/.test(ch[0].was) && /mcp\/schemas/.test(ch[0].touches.join(' ')), 'W3 names the bundled 2.13.0 and mcp/schemas');
  ok(/pbip-query\.js/.test(ch[0].touches.join(' ')) && /2\.1\.0/.test(ch[0].touches.join(' ')), 'W3 names the writer (writes 2.1.0)');
  ok(ch[0].links.some((l) => l.includes('fabric/item/report/definition/visualContainer/2.14.0')), 'W3 links the folder');
  const older = await changesOf(world({ tree: folders({ 'definition/visualContainer': '2.9.0' }) }));
  eq(older.length, 0, 'W3 2.9.0 is not newer than 2.13.0 (numbers, not text)');
}

// ---------- W4: new and unbundled folders ----------
{
  const ch = await changesOf(world({ tree: folders({ 'definition/visualCalculation': '1.0.0', localSettings: '1.1.0' }) }));
  eq(ch.map((c) => c.key).sort(), ['folder:definition/visualCalculation@1.0.0', 'unbundled:localSettings@1.1.0'], 'W4 a new folder and a newer unbundled one');
  ok(/new/i.test(ch.find((c) => c.key.startsWith('folder:')).title), 'W4 the new folder is called new');
  eq((await changesOf(world({ tree: folders({ 'definition/definitionStructure': '3.3.0' }) }))).length, 0, 'W4 definitionStructure at its listed version: none');
  const trunc = await run(world({ tree: { ...folders({ 'definition/visualContainer': '2.14.0' }), truncated: true } }), ['--dry-run'], {});
  ok(/::warning::.*truncated/i.test(trunc.out), 'W4 a truncated tree is a warning');
}

// ---------- W5: the theme schema ----------
{
  const ch = await changesOf(world({ themes: THEMES('2.160') }));
  eq(ch.map((c) => c.key), ['theme:2.160'], 'W5 a newer theme schema');
  ok(/design-engine\.js/.test(ch[0].touches.join(' ')) && ch[0].links.some((l) => l.endsWith('reportThemeSchema-2.160.json')), 'W5 names the theme generator, links the file');
  eq((await changesOf(world({ themes: THEMES('2.159') }))).length, 0, 'W5 2.98 among the files is not newer than 2.159');
}

// ---------- W6: the validator and the catalog ----------
{
  const ch = await changesOf(world({ cli: '0.6.0', catalog: '0.1.4' }));
  eq(ch.map((c) => c.key), ['npm:@microsoft/powerbi-report-authoring-cli@0.6.0', 'npm:@microsoft/powerbi-core-visual-schema@0.1.4'], 'W6 two package changes');
  const t = ch.map((c) => c.touches.join(' ')).join(' ');
  ok(/mcp\/package\.json/.test(t) && /VALIDATOR_GAPS/.test(t) && /visual-types\.js/.test(t), 'W6 names the pin, the known notes and visual-types.js');
  ok(ch[0].links.includes('https://www.npmjs.com/package/@microsoft/powerbi-report-authoring-cli/v/0.6.0'), 'W6 links npm');
  eq((await changesOf(world({ cli: '0.4.0' }))).length, 0, 'W6 an older latest is not a change');
}

// ---------- W7: the Feature Summary ----------
{
  const NEW = '<item><title>Power BI November 2026 Feature Summary</title><link>https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Power-BI-November-2026-Feature-Summary/ba-p/5400001</link><pubDate>Mon, 16 Nov 2026 20:00:00 GMT</pubDate></item>';
  const ch = await changesOf(world({ feed: FEED(NEW) }));
  eq(ch.map((c) => c.key), ['post:5400001'], 'W7 a new Feature Summary');
  ok(/U1/.test(ch[0].touches.join(' ')) && ch[0].links[0].endsWith('/ba-p/5400001'), 'W7 feeds the next update job, links the post');
  const redated = FEED('').replace('Thu, 15 Oct 2026 21:06:46 GMT', 'Tue, 20 Oct 2026 08:00:00 GMT');
  eq((await changesOf(world({ feed: redated }))).length, 0, 'W7 the September summary re-dated: none (ids, not dates)');
  const other = '<item><title>Power BI &amp; Fabric: what&#39;s new in Copilot</title><link>https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/x/ba-p/5500000</link><pubDate>Mon, 16 Nov 2026 20:00:00 GMT</pubDate></item>';
  eq((await changesOf(world({ feed: FEED(other) }))).length, 0, 'W7 a newer post that is not a Feature Summary: none');
  const cdata = '<item><title><![CDATA[Power BI November 2026 Feature Summary]]></title><link>https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Power-BI-November-2026-Feature-Summary/ba-p/5400001</link></item>';
  eq((await changesOf(world({ feed: FEED(cdata) }))).map((c) => c.key), ['post:5400001'], 'W7 a CDATA title is read');
}

// ---------- W8: network failures ----------
for (const src of ['schemas', 'theme', 'npm', 'feed']) {
  const w = world({ fail: [src], cli: '0.6.0' });
  const r = await run(w);
  ok(r.code === 0 && /::warning::/.test(r.out), `W8 ${src} unreachable: a warning, exit 0`);
  if (src !== 'npm') ok(r.posts.some((p) => p.url.endsWith('/issues')), `W8 ${src} unreachable: the other sources still report (the newer validator)`);
  else ok(r.posts.length === 0, 'W8 npm unreachable: its change is not invented, nothing written');
}
{
  const r = await run(world({ fail: ['schemas', 'theme', 'npm', 'feed'] }));
  eq([r.code, r.posts.length], [0, 0], 'W8 every source down: exit 0, no issue');
  const notFound = world({ feed: '<html>not a feed</html>' });
  const r2 = await run(notFound);
  ok(r2.code === 0 && /::warning::.*feed/i.test(r2.out) && r2.posts.length === 0, 'W8 an unreadable feed: a warning, no issue');
}

// ---------- W9: the issue ----------
{
  const ch = await changesOf(world({ tree: folders({ 'definition/visualContainer': '2.14.0' }), themes: THEMES('2.160'), cli: '0.6.0' }));
  const body = issueBody(ch, { runUrl: 'https://github.com/o/r/actions/runs/42' });
  ok(/^## Report schemas/m.test(body) && /^## Report theme schema/m.test(body) && /^## Microsoft's validator and visual catalog/m.test(body), 'W9 body has a section per source');
  ok(ch.every((c) => body.includes(c.links[0]) && c.touches.every((t) => body.includes(t))), 'W9 every change with its link and what it may touch');
  ok(/never changes code/i.test(body) && body.includes('mcp/research/MICROSOFT-WATCH.md') && body.includes('actions/runs/42'), 'W9 says it changed nothing, points to the doc and the run');
  eq([...keysIn(body)].sort(), ch.map((c) => c.key).sort(), 'W9 the hidden key line lists every change');

  // none open: created with the label
  const w = world({ cli: '0.6.0' });
  const r = await run(w);
  const created = r.posts.find((p) => p.url.endsWith('/repos/o/r/issues'));
  ok(r.code === 0 && created && created.body.labels.includes(LABEL) && /validator/i.test(created.body.title + created.body.body), 'W9 none open: one issue created with the label');
  ok(r.posts.some((p) => p.url.endsWith('/labels')), 'W9 the label is made if missing (422 = it exists, fine)');

  // one open listing the validator: only the new theme is commented
  const open = [{ number: 5, title: 'x', body: issueBody(await changesOf(world({ cli: '0.6.0' })), {}), labels: [{ name: LABEL }] }];
  const w2 = world({ cli: '0.6.0', themes: THEMES('2.160'), issues: open });
  const r2 = await run(w2);
  const com = r2.posts.find((p) => /issues\/5\/comments$/.test(p.url));
  ok(com && /2\.160/.test(com.body.body) && !/0\.6\.0/.test(com.body.body), 'W9 open issue: a comment with only the new change');
  ok(!r2.posts.some((p) => p.url.endsWith('/repos/o/r/issues')), 'W9 open issue: no second issue');
  ok(keysIn(com.body.body).has('theme:2.160'), 'W9 the comment carries its key line');

  // everything already listed (in the body or a comment): nothing written
  const w3 = world({ cli: '0.6.0', themes: THEMES('2.160'), issues: open, comments: { 5: [{ body: com.body.body }] } });
  const r3 = await run(w3);
  eq([r3.code, r3.posts.length], [0, 0], 'W9 all already listed: nothing written');
  ok(/already/i.test(r3.out), 'W9 the log says already reported');

  // a pull request in the issues list is not the issue
  const w4 = world({ cli: '0.6.0', issues: [{ number: 7, title: 'pr', body: '', pull_request: {} }] });
  ok((await run(w4)).posts.some((p) => p.url.endsWith('/repos/o/r/issues')), 'W9 a pull request is not taken for the open issue');

  // a failed issue write fails the run (the change would be lost)
  const w5 = world({ cli: '0.6.0' });
  const real = w5;
  const failing = async (url, opts = {}) => (opts.method === 'POST' && url.endsWith('/issues') ? new Response('{"message":"Issues are disabled"}', { status: 410 }) : real(url, opts));
  failing.calls = real.calls;
  const r5 = await run(failing);
  ok(r5.code === 1 && /::error::/.test(r5.out), 'W9 issues disabled: an error, exit 1');
}

// ---------- W10: dry run ----------
{
  const w = world({ cli: '0.6.0' });
  const r = await run(w, ['--dry-run']);
  eq([r.code, r.posts.length], [0, 0], 'W10 dry run: nothing written');
  ok(/0\.6\.0/.test(r.out) && /Would open/i.test(r.out), 'W10 dry run prints the issue it would open');
  const noToken = await run(world({ cli: '0.6.0' }), ['--dry-run'], {});
  ok(noToken.code === 0 && /Would open/.test(noToken.out), 'W10 dry run without a token: prints, no GitHub read');
  const real = await run(world({ cli: '0.6.0' }), [], {});
  ok(real.code === 1 && /GITHUB_TOKEN/.test(real.out), 'W10 a real run without GITHUB_TOKEN or GITHUB_REPOSITORY: an error');
}

// ---------- W11: the workflow file ----------
{
  const y = fs.readFileSync(path.join(ROOT, '.github/workflows/microsoft-watch.yml'), 'utf8');
  ok(/cron:\s*'17 5 \* \* 1'/.test(y) && /workflow_dispatch:/.test(y), 'W11 Mondays 05:17 UTC and by hand');
  const perms = (y.match(/^permissions:\n((?:[ \t]+\S.*\n)+)/m) || [])[1] || '';
  eq(perms.trim().split('\n').map((s) => s.trim()).sort(), ['contents: read', 'issues: write'], 'W11 permissions: contents read, issues write only');
  ok(/node scripts\/microsoft-watch\.mjs/.test(y), 'W11 runs the script');
  eq([...y.matchAll(/secrets\.(\w+)/g)].map((m) => m[1]).filter((s) => s !== 'GITHUB_TOKEN'), [], 'W11 no secret but GITHUB_TOKEN');
  ok(!/npm (ci|install)/.test(y) && !/git push|gh pr|pull-requests/.test(y), 'W11 no install, no push, no PR');
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
