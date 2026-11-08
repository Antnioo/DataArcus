// 0.3.2 BF1 (B-397, D-1108-14): the live build page, dataarcus.com/build/. It reads the public repo in the visitor's
// browser; here every GitHub answer is a made-up fixture (scripts/tests/fixtures/build-page.json) served by the test, never
// a live call. Times in the fixture are minutes before the test's "now".
//   B1  the pure helpers (ago, jobCode, stateOf, newestVersion, resultOf, mergesOf, releaseLine)
//   S1  the sections render from the fixtures: builders (code, message, note state, latest run), CI, merges, head, release
//   S2  only this release's branches with a push in the last 24 h are builders (an old push, another release's branch: not)
//   S3  the line moves while a run is in progress (and the bar is there); still when nothing runs
//   S4  a refresh makes at most 6 API calls
//   X1  a commit message with HTML is shown as text (no element, no script run)
//   E1  a 304 keeps the last data and the page asks with If-None-Match
//   E2  a 403 with X-RateLimit-Reset: "GitHub asks us to wait until HH:MM" in the visitor's time, the data stays
//   E3  X-RateLimit-Remaining under 10: the page says it slows to every 10 minutes
//   E4  a call that fails keeps that section's last data and says so
//   P1  noindex; not in the menu or the footer; not in sitemap.xml; csp.mjs passes; the policy has connect-src for GitHub
//   H1  the helix model (pure): rungs newest first, at most 60, t from 0 to 1; merges as nodes
//   H2  WebGL: the helix is drawn (mode webgl, a canvas, aria-hidden) and a rung's label shows its code and commit line as text
//   H3  no WebGL: the SVG helix shows (mode svg, a rung per job, the label on hover) and the cards still fill
//   H4  the three.js address is pinned to an exact version, the one package.json names, with a Subresource Integrity hash
//   P2  no sideways scroll at 390 px; reduced motion stops the animations and the helix; no page error
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { ROOT, visitor, WAIT } from './lib.mjs';

const require = createRequire(import.meta.url);
const FX = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/build-page.json'), 'utf8'));
const PAGE = '/build/';
const CORS = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'etag, x-ratelimit-remaining, x-ratelimit-reset, x-ratelimit-limit', 'access-control-allow-headers': 'if-none-match, accept' };

export default async function ({ browser, url }) {
  let checks = 0;
  const problems = [];
  const check = (cond, msg) => { checks++; if (!cond) problems.push(msg); };

  // ---- B1: the helpers, in Node
  let B = null;
  try { B = require('../../assets/js/build-page.js'); } catch (e) { check(false, `B0 assets/js/build-page.js does not load: ${e.message}`); }
  if (B) {
    const now = Date.parse('2026-11-08T12:00:00Z');
    check(B.ago(now - 10e3, now) === 'just now' && B.ago(now - 5 * 60e3, now) === '5 min ago' && B.ago(now - 3 * 3600e3, now) === '3 h ago' && B.ago(now - 2 * 864e5, now) === '2 d ago' && B.ago(0, now) === '', 'B1 ago: just now, 5 min, 3 h, 2 d, nothing for no time');
    check(B.jobCode('fix/0.3.2-bf1', '0.3.2') === 'BF1' && B.jobCode('feat/0.3.2-sp44b', '0.3.2') === 'SP44B' && B.jobCode('fix/0.3.1-bf1', '0.3.2') === '' && B.jobCode('chore/0.3.2-x', '0.3.2') === '' && B.jobCode('fix/0.3.22-x', '0.3.2') === '', 'B2 jobCode: the release\'s fix/ and feat/ branches only');
    check(B.stateOf('# x\n**State:** DONE, CI green\nmore') === 'DONE, CI green' && B.stateOf('no state here') === '' && B.stateOf(null) === '', 'B3 stateOf reads the **State:** line');
    check(JSON.stringify(B.newestVersion([{ name: 'integration/0.3.2' }, { name: 'integration/0.10.0' }, { name: 'integration/0.9.9' }, { name: 'main' }])) === '{"version":"0.10.0","branch":"integration/0.10.0"}' && B.newestVersion([{ name: 'main' }]) === null, 'B4 newestVersion compares numbers, not text');
    check(B.resultOf({ status: 'queued' }) === 'queued' && B.resultOf({ status: 'in_progress' }) === 'running' && B.resultOf({ status: 'completed', conclusion: 'success' }) === 'green' && B.resultOf({ status: 'completed', conclusion: 'failure' }) === 'red' && B.resultOf({ status: 'completed', conclusion: 'cancelled' }) === 'other', 'B5 resultOf: queued, running, green, red, other');
    const Hx = require('../../assets/js/build-helix.js');
    const hm = Hx.helixModel(Array.from({ length: 80 }, (_, i) => ({ code: 'J' + i, status: 'idle' })), [{ message: 'a' }, { message: 'b' }]);
    check(hm.rungs.length === 60 && hm.rungs[0].code === 'J0' && hm.rungs[0].t === 0.5 / 60 && hm.rungs[59].t === 59.5 / 60 && hm.nodes.length === 2 && hm.nodes[0].t === 0.25 && Hx.helixModel(null, null).rungs.length === 0, 'H1 the helix model: newest first, at most 60 rungs, t spread inside 0..1, merges as nodes');
    const nowB = Date.parse('2026-11-08T12:00:00Z'), bl = B.buildersOf({ heads: [{ branch: 'fix/0.3.2-ab1', sha: 'a', message: 'AB1: x', time: nowB - 600e3 }, { branch: 'fix/0.3.2-old', sha: 'b', message: 'x', time: nowB - 30 * 3600e3 }, { branch: 'fix/0.3.1-no', sha: 'c', message: 'x', time: nowB - 600e3 }], runs: { workflow_runs: [{ id: 1, head_branch: 'fix/0.3.2-ab1', head_sha: 'a', status: 'queued', run_started_at: '2026-11-08T11:59:00Z', updated_at: '2026-11-08T11:59:00Z', html_url: 'https://github.com/x' }] }, version: '0.3.2', now: nowB });
    check(bl.length === 1 && bl[0].code === 'AB1' && bl[0].message === 'AB1: x' && B.statusOf(bl[0], '', nowB) === 'running', 'B8 buildersOf: this release\'s branches by their latest commit within 24 h; a queued run is running');
    check(B.statusOf({ run: { result: 'running' }, time: 0 }, '', 1) === 'running' && B.statusOf({ run: { result: 'green' }, time: 0 }, 'waiting for the owner', 1) === 'red' && B.statusOf({ run: null, time: 0 }, 'DONE', 1) === 'green' && B.statusOf({ run: null, time: 0 }, '', 3 * 3600e3) === 'stopped' && B.statusOf({ run: null, time: 0 }, '', 3600e3) === 'idle', 'B7 statusOf: running, red (a note waiting on the owner), done, stopped after 2 h, idle');
    check(B.releaseLine({ version: '0.3.2' }, { tag_name: 'v0.3.1' }).inProgress && /0\.3\.2 in progress/.test(B.releaseLine({ version: '0.3.2' }, { tag_name: 'v0.3.1' }).text) && !B.releaseLine({ version: '0.3.2' }, { tag_name: 'v0.3.2' }).inProgress, 'B6 releaseLine: "in progress" while the versions differ');
  }

  // ---- the made-up GitHub, served to the page
  const iso = (min, now) => new Date(now - min * 60e3).toISOString();
  async function open(opts = {}, setup = null) {
    const v = await visitor(browser, { viewport: opts.viewport || [1440, 900], motion: opts.motion || 'no-preference' });
    const now = Date.now(), seen = { api: [], raw: [], inm: [], etags: {} };
    const state = { remaining: 59, status: {}, reset: Math.floor(now / 1000) + 1800, force304: false, calls: 0, noRelease: false };
    const json = (rt, body, extra = {}) => rt.fulfill({ status: 200, contentType: 'application/json', headers: { ...CORS, ...extra }, body: JSON.stringify(body) });
    const answer = (key, body) => async (rt) => {
      const r = rt.request(), u = new URL(r.url());
      if (r.method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: { ...CORS, 'access-control-allow-methods': 'GET' } });
      seen.api.push(u.pathname + u.search);
      const inm = r.headers()['if-none-match']; if (inm) seen.inm.push(inm);
      const hdr = { 'x-ratelimit-remaining': String(state.remaining), 'x-ratelimit-reset': String(state.reset) };
      if (state.status[key]) return rt.fulfill({ status: state.status[key], headers: { ...CORS, ...hdr }, body: '{}' });
      const etag = `"${key}-1"`;
      if (inm === etag && state.force304) return rt.fulfill({ status: 304, headers: { ...CORS, ...hdr, etag } });
      return json(rt, typeof body === 'function' ? body() : body, { ...hdr, etag });
    };
    const run = (r) => ({ id: r.id, head_branch: r.branch, head_sha: r.sha, status: r.status, conclusion: r.conclusion, run_started_at: iso(r.startedAgoMin, now), created_at: iso(r.startedAgoMin, now), updated_at: iso(r.updatedAgoMin, now), html_url: `https://github.com/Antnioo/DataArcus/actions/runs/${r.id}` });
    await v.ctx.route('https://api.github.com/**', async (rt) => {
      const p = new URL(rt.request().url()).pathname;
      if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: { ...CORS, 'access-control-allow-methods': 'GET' } });
      if (/\/Antnioo\/DataArcus\/branches$/.test(p)) return answer('branches', [...FX.branches, ...FX.heads.map((h) => h.branch)].map((name) => ({ name, commit: { sha: (FX.heads.find((h) => h.branch === name) || { sha: 'f'.repeat(40) }).sha, url: 'https://api.github.com/x' }, protected: false })))(rt);
      if (/\/workflows\/tests\.yml\/runs$/.test(p)) return answer('runs', { workflow_runs: FX.runs.map(run) })(rt);
      if (/\/Antnioo\/DataArcus\/commits$/.test(p)) {
        const sha = new URL(rt.request().url()).searchParams.get('sha'), h = FX.heads.find((x) => x.sha === sha);
        if (h) return answer('head-' + sha.slice(0, 4), [{ sha: h.sha, parents: [{ sha: 'p' }], commit: { message: h.message, committer: { date: iso(h.agoMin, now) } } }])(rt);
        return answer('commits', FX.commits.map((c) => ({ sha: c.sha, parents: Array.from({ length: c.parents }, (_, i) => ({ sha: 'p' + i })), commit: { message: c.message, committer: { date: iso(c.agoMin, now) } } })))(rt);
      }
      if (/\/Antnioo\/dataarcus-releases\/releases\/latest$/.test(p)) return state.noRelease ? rt.fulfill({ status: 404, headers: { ...CORS, 'x-ratelimit-remaining': '50' }, body: '{}' }) : answer('latest', FX.release)(rt);
      return rt.fulfill({ status: 404, headers: CORS, body: '{}' });
    });
    await v.ctx.route('https://raw.githubusercontent.com/**', async (rt) => {
      const u = new URL(rt.request().url());
      if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: { ...CORS, 'access-control-allow-methods': 'GET' } });
      seen.raw.push(u.pathname);
      if (/\/mcp\/package\.json$/.test(u.pathname)) return rt.fulfill({ status: 200, contentType: 'text/plain', headers: { ...CORS, etag: '"pkg"' }, body: JSON.stringify(FX.package) });
      const m = /\/Antnioo\/DataArcus\/(.+)\/mcp\/work\/([A-Z0-9]+)\.md$/.exec(decodeURIComponent(u.pathname));
      if (m && FX.notes[m[1]]) return rt.fulfill({ status: 200, contentType: 'text/plain', headers: { ...CORS, etag: '"n-' + m[2] + '"' }, body: FX.notes[m[1]] });
      return rt.fulfill({ status: 404, headers: CORS, body: 'not found' });
    });
    if (setup) await setup({ v, state, now });
    await v.pg.goto(url + PAGE, { waitUntil: 'load' });
    return { v, state, seen, now };
  }
  const text = (pg, sel) => pg.evaluate((s) => (document.querySelector(s) || {}).textContent || '', sel);
  const loaded = (pg) => pg.waitForFunction(() => /^Updated/.test((document.getElementById('bp-updated') || {}).textContent || ''), null, { timeout: WAIT });

  // ---- S1..S4, X1: the first look
  {
    const { v, seen } = await open();
    await loaded(v.pg).catch(() => null);
    const b = await text(v.pg, '#bp-builders'), ci = await text(v.pg, '#bp-ci'), mg = await text(v.pg, '#bp-merges'), head = await text(v.pg, '#bp-head'), rel = await text(v.pg, '#bp-release');
    check(/BB2/.test(b) && /AA1/.test(b) && /IN PROGRESS/.test(b) && /DONE, CI green/.test(b) && /WORKING/.test(b), `S1 builders show the job code and the state from the note: ${b.slice(0, 160)}`);
    check(/running/.test(await text(v.pg, '#bp-builders .bp-live .bp-pill')) && /in progress/.test(b) && /green/.test(b) && (await v.pg.locator('#bp-builders a[href^="https://github.com/Antnioo/DataArcus/actions/runs/"]').count()) === 3, 'S1 each builder shows its latest tests.yml run (in progress, green) with a link to the run');
    check(/min ago/.test(b) && /First fix|first fix/.test(b), 'S1 the latest commit message and "ago" are shown');
    check(/in progress/.test(ci) && /green/.test(ci) && /red/.test(ci) && !/old9|OLD9/i.test(ci) && (await v.pg.locator('#bp-ci a[href^="https://github.com/Antnioo/DataArcus/actions/runs/"]').count()) === 4, `S1 CI now: the in-progress, queued, green and red runs of the last 3 hours (the 6 h old one not), each linked: ${ci.slice(0, 160)}`);
    check(/Merge AA0: the earlier job/.test(mg) && !/Merge origin/.test(mg) && !/a commit on the branch/.test(mg), `S1 integration today: the merge, not the builder's own "Merge origin/..." nor a one-parent commit: ${mg.slice(0, 160)}`);
    check(/ccccccc/.test(head) && /red/.test(head), `S1 the head sha and its tests.yml result: ${head}`);
    check(/0\.3\.2 in progress, latest release 0\.3\.1/.test(rel) && seen.api.some((u) => /dataarcus-releases\/releases\/latest/.test(u)) && !seen.api.some((u) => /Antnioo\/DataArcus\/releases/.test(u)), `S1 release line, read from the releases repo: ${rel}`);
    check(!/OLD9/i.test(b) && !/ZZ1/.test(b), 'S2 a push older than 24 h and another release\'s branch are not builders');
    check((await v.pg.locator('#bp-builders > li').count()) === 4 && /BB2/.test(await text(v.pg, '#bp-builders > li:first-child')) && /CC3/.test(await text(v.pg, '#bp-builders > li:last-child')), 'S2 four builders (none from the events feed), newest commit first, a 24 h limit');
    check(await v.pg.evaluate(() => document.getElementById('bp-line').classList.contains('bp-moving')) && (await v.pg.locator('.bp-bar').count()) >= 1, 'S3 the line moves and a run in progress has its moving bar');
    check(seen.api.length === 4 + 5, `S4 a first look: 4 reads plus one latest-commit lookup per job branch of this release (5, the 2-day-old one too), nothing for another release's branch (made ${seen.api.length}: ${seen.api.join(' ')})`);
    check(seen.raw.some((p) => /\/mcp\/package\.json$/.test(p)) && seen.raw.some((p) => /\/mcp\/work\/BB2\.md$/.test(p)), 'S4 the notes and package.json come from raw.githubusercontent.com');
    check(await v.pg.evaluate(() => !window.__pwned && !document.querySelector('#bp-builders img, #bp-builders b')), 'X1 a commit message with HTML is text: no element made, no script run');
    check((await text(v.pg, '#bp-builders')).includes('<img src=x onerror="window.__pwned=1">'), 'X1 the HTML shows as the characters written');
    // the reviewer's five live-data findings (14:10Z): branches by their latest commit, message and note on each card,
    // queued or in progress counts as running, a missing note or release is not a failure, the release from its own repo
    check(/DD4/.test(b) && /CC3/.test(b) && /DD4: queued work/.test(b) && /CC3: stopped two hours ago/.test(b) && !/\(no message\)/.test(b), `D1 D2 a branch with no push event shows, each card with its latest commit message: ${b.slice(0, 200)}`);
    check(/note: WORKING/.test(b) && /note: -/.test(b), 'D2 the note\'s State line on a card; "-" where the branch has no note');
    const nums = await v.pg.evaluate(() => ['running', 'red', 'done', 'merged', 'open'].map((k) => document.getElementById('bp-n-' + k).textContent));
    check(nums.join(',') === '2,0,1,1,4', `D3 telemetry: a queued and an in-progress run both count as running (running,red,done,merged,open = ${nums.join(',')})`);
    check(/Could not load/.test(await text(v.pg, '#bp-warn')) === false && await v.pg.locator('#bp-warn').isHidden(), `D4 a missing note file is not a failure: no banner (${await text(v.pg, '#bp-warn')})`);
    check(!v.errs.length, `P2 no page error on the first look: ${v.errs.join(' | ')}`);
    const mode = await v.pg.evaluate(() => { const h = document.getElementById('bp-line'); return [h.dataset.mode, !!h.querySelector('canvas'), h.getAttribute('aria-hidden')]; });
    check(mode[0] === 'webgl' && mode[1] && mode[2] === 'true', `H2 WebGL: the helix is drawn in a canvas and hidden from screen readers (${mode.join(',')})`);
    await v.pg.evaluate(() => window.BuildPage.helix.focus('BB2'));
    const lab = await text(v.pg, '#bp-line .bh-label');
    check(/BB2/.test(lab) && lab.includes('<img src=x') && /CI: in progress/.test(lab), `H2 a rung's label: code, commit line as text, CI state: ${lab.slice(0, 120)}`);
    await v.ctx.close();
  }

  // ---- S3b: nothing running: the line is still
  {
    const saved = FX.runs.map((r) => ({ ...r }));
    for (const r of FX.runs) if (r.status !== 'completed') { r.status = 'completed'; r.conclusion = 'success'; }
    const { v } = await open();
    await loaded(v.pg).catch(() => null);
    check(await v.pg.evaluate(() => !document.getElementById('bp-line').classList.contains('bp-moving')) && (await v.pg.locator('.bp-bar').count()) === 0, 'S3 nothing in progress: the line is still, no moving bar');
    await v.ctx.close();
    FX.runs.splice(0, FX.runs.length, ...saved);
  }

  // ---- E1: a 304 keeps the data; E3: remaining under 10
  {
    const { v, state, seen } = await open();
    await loaded(v.pg).catch(() => null);
    const before = await text(v.pg, '#bp-builders');
    state.force304 = true; seen.inm.length = 0; seen.api.length = 0;
    await v.pg.evaluate(() => window.BuildPage.refresh());
    check(seen.inm.length === 4 && seen.api.length === 4 && seen.inm.every((e) => /^"[a-z]+-1"$/.test(e)), `E1 the second refresh sends If-None-Match with each address's ETag (${seen.inm.length} sent of ${seen.api.length}: ${seen.api.join(' ')})`);
    check((await text(v.pg, '#bp-builders')) === before && /BB2/.test(before) && /0\.3\.2 in progress/.test(await text(v.pg, '#bp-release')), 'E1 a 304 keeps the last data on the page');
    state.remaining = 7;
    await v.pg.evaluate(() => window.BuildPage.refresh());
    const lim = await text(v.pg, '#bp-limit');
    check(/every 10 minutes/.test(lim) && /7 left/.test(lim), `E3 under 10 requests left: the page says it slows to every 10 minutes: ${lim}`);
    // E4: one call fails: its section keeps the last data and says so
    state.remaining = 50; state.status.runs = 500;
    await v.pg.evaluate(() => window.BuildPage.refresh());
    check(/Could not load runs/.test(await text(v.pg, '#bp-warn')) && (await text(v.pg, '#bp-builders')).includes('IN PROGRESS'), 'E4 a failed call is said, the last data stays');
    await v.ctx.close();
  }

  // ---- D4b: no release published yet (404): "in progress (no release found)", no banner
  {
    const { v } = await open({}, async ({ state }) => { state.noRelease = true; });
    await loaded(v.pg).catch(() => null);
    const rel = await text(v.pg, '#bp-release');
    check(/0\.3\.2 in progress/.test(rel) && (await v.pg.locator('#bp-warn').isHidden()), `D4 a 404 for the release is "no release found", not a banner: ${rel} / ${await text(v.pg, '#bp-warn')}`);
    await v.ctx.close();
  }

  // ---- E2: a 403 with the reset time
  {
    const { v, state } = await open();
    await loaded(v.pg).catch(() => null);
    const before = await text(v.pg, '#bp-builders');
    state.status.branches = 403; state.remaining = 0;
    await v.pg.evaluate(() => window.BuildPage.refresh());
    const want = await v.pg.evaluate((s) => { const d = new Date(s * 1000); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }, state.reset);
    const lim = await text(v.pg, '#bp-limit');
    check(lim === `GitHub asks us to wait until ${want}.`, `E2 a 403 shows "GitHub asks us to wait until ${want}." (got "${lim}")`);
    check((await text(v.pg, '#bp-builders')) === before, 'E2 the data stays while we wait');
    await v.ctx.close();
  }

  // ---- P1: unlisted
  {
    const html = fs.readFileSync(path.join(ROOT, 'build/index.html'), 'utf8');
    check(/<meta name="robots" content="noindex"/.test(html), 'P1 the page has noindex');
    const others = ['index.html', 'privacy.html', 'tools/index.html', 'blog.html'].map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'));
    check(others.every((h) => !/href="\/?build\/?"/.test(h)) && !/href="\/?build\/?"/.test(html.replace(/<link rel="canonical"[^>]*>/, '')), 'P1 no menu or footer links to /build/');
    check(!/dataarcus\.com\/build/.test(fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8')) && !/build/.test(fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8')), 'P1 not in sitemap.xml, robots.txt unchanged');
    const csp = spawnSync(process.execPath, [path.join(ROOT, 'scripts/csp.mjs')], { encoding: 'utf8' });
    check(csp.status === 0, `P1 csp.mjs passes: ${csp.stdout.trim().slice(0, 200)}`);
    const pol = (html.match(/Content-Security-Policy" content="([^"]*)"/) || [])[1] || '';
    check(/connect-src 'self' https:\/\/api\.github\.com https:\/\/raw\.githubusercontent\.com(;|$)/.test(pol), `P1 connect-src names GitHub's API and raw files: ${pol.slice(0, 200)}`);
    const other = (fs.readFileSync(path.join(ROOT, 'privacy.html'), 'utf8').match(/Content-Security-Policy" content="([^"]*)"/) || [])[1] || '';
    check(!/github/.test(other), 'P1 the rule is this page\'s only: privacy.html\'s policy has no GitHub host');
    check(!/<script(?![^>]*\ssrc=)[^>]*>/i.test(html), 'P1 no inline script on the page');
  }

  // ---- H3: no WebGL: the SVG helix and the cards
  {
    const { v } = await open({}, async ({ v }) => { await v.ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...r) { return /webgl/i.test(t) ? null : g.call(this, t, ...r); }; }); });
    await loaded(v.pg).catch(() => null);
    const info = await v.pg.evaluate(() => { const h = document.getElementById('bp-line'); return [h.dataset.mode, h.querySelectorAll('svg g[data-code]').length, document.querySelectorAll('#bp-builders > li').length]; });
    check(info[0] === 'svg' && info[1] === 4 && info[2] === 4, `H3 no WebGL: the SVG helix with a rung per job, and the cards (${info.join(',')})`);
    await v.pg.locator('#bp-line g[data-code="AA1"]').first().dispatchEvent('pointerenter');
    check(/AA1/.test(await text(v.pg, '#bp-line .bh-label')) && !(await v.pg.locator('#bp-line .bh-label').isHidden()), 'H3 the SVG rung shows its label');
    check(!v.errs.length, `H3 no page error without WebGL: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  // ---- H4: three.js pinned
  {
    const html = fs.readFileSync(path.join(ROOT, 'build/index.html'), 'utf8'), pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const m = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/three@([^/"]+)\/build\/three\.min\.js"([^>]*)>/.exec(html);
    check(m && /^\d+\.\d+\.\d+$/.test(m[1]) && m[1] === pkg.devDependencies.three && /integrity="sha384-/.test(m[2]), `H4 three.js is loaded at an exact version, the one package.json pins (${m && m[1]} / ${pkg.devDependencies.three}), with an integrity hash`);
    check(/script-src[^;]*https:\/\/cdn\.jsdelivr\.net\/npm\/three@\d+\.\d+\.\d+\//.test(html) && !/three@/.test(fs.readFileSync(path.join(ROOT, 'privacy.html'), 'utf8')), 'H4 the script policy names three.js\'s package folder on this page only');
  }

  // ---- P2: phone width, reduced motion
  {
    const { v } = await open({ viewport: [390, 800] });
    await loaded(v.pg).catch(() => null);
    const w = await v.pg.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    check(w[0] <= w[1], `P2 no sideways scroll at 390 px (scrollWidth ${w[0]}, width ${w[1]})`);
    await v.ctx.close();
    const r = await open({ motion: 'reduce' });
    await loaded(r.v.pg).catch(() => null);
    const anim = await r.v.pg.evaluate(() => [...document.querySelectorAll('.bp-bar')].map((e) => getComputedStyle(e).animationName));
    check(anim.length > 0 && anim.every((a) => a === 'none') && (await r.v.pg.evaluate(() => document.getElementById('bp-line').dataset.motion)) === 'still', `P2 reduced motion: no animation, a still helix (${anim.join(',')})`);
    await r.v.ctx.close();
  }
  return { checks, problems };
}
