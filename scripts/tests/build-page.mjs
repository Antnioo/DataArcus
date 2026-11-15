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
//   H1  the helix model (pure): the 60 newest jobs, oldest first (the bottom), t from 0 to 1; a merge names its job merged
//   H2  WebGL: the helix is drawn (mode webgl; the canvas hidden from screen readers, the stage reachable by keyboard) and a job's label shows its code and commit line as text
//   H3  no WebGL: the SVG helix shows (mode svg, a rung per job, the label on hover) and the cards still fill
//   H4  the three.js address is pinned to an exact version, the one package.json names, with a Subresource Integrity hash
//   (0.3.3 RL33, D-1112-04: the Today app's helix, movable and scalable)
//   H5  the helix's facts (pure): height 9, radius 2.3, turns clamp(n/10, 1.5, 4.5), node i at t = (i + 0.5)/n on the strand and
//       mirrored across the spine, radius 0.11 + 0.21 sqrt(cost/max), the six state colours, the spine, the background
//   H6  the replay (pure): absent before it started, running until merged, as it is at "now"; the counter's two texts
//   H7  the tiers (pure): above 28 ms a frame one step down, above 50 ms at plain the SVG; a tier can be pinned
//   H8  movable: a drag turns it, the wheel zooms only with the helix in focus (the page scrolls otherwise), the keys turn,
//       zoom, reset and step through the jobs; the replay slider takes jobs away and says the hour
//   H9  scalable: the full-screen button fills the window and its icon sits in the middle of its box; at 390 px the stage fits
//   P2  no sideways scroll at 390 px; reduced motion stops the animations and the helix; no page error
// 0.3.2 BF2 (B-399, D-1108-15): the Fuel panel (usage.json from the build-data branch, made-up fixture build-usage.json)
//   U0  the pure helpers of assets/js/build-usage.js (version check, USD, millions, chart geometry, cost by job code)
//   U1  the panel renders: today's cost and tokens, builders/workers/probes, models, the last jobs, the top five, "Updated HH:MM"
//   U2  the 14-day chart is an inline SVG drawn to scale (bar heights follow cost, empty days are empty, a title per day)
//   U3  a rung's label shows that job's cost when usage.json has it
//   U4  a version other than 1 says so and stops the panel; the rest of the page works
//   U5  a missing file (404) says so; the rest of the page works; no banner on the page
//   U6  usage.json comes from raw.githubusercontent.com through the page's one reader: If-None-Match on the next refresh, no API call
//   U7  every text from the file is text (a title with HTML makes no element); no session id or prompt is shown
//   U8  no sideways scroll at 390 px with the panel; reduced motion; no page error
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { ROOT, visitor, WAIT } from './lib.mjs';

const require = createRequire(import.meta.url);
const FX = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/build-page.json'), 'utf8'));
const UX = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/build-usage.json'), 'utf8'));
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
    const hm = Hx.helixModel(Array.from({ length: 80 }, (_, i) => ({ code: 'J' + i, status: 'idle', time: 1e12 - i * 1000 })), [{ message: 'Merge J3: a', time: 1e12 - 5 }, { message: 'Merge J30x: b', time: 1 }], 1e12);
    // (RL33, on purpose) H1 pinned { rungs newest first, nodes: the merges }; the model is now the jobs oldest first, a merge marks its job
    check(hm.nodes.length === 60 && hm.nodes[0].code === 'J59' && hm.nodes[59].code === 'J0' && hm.nodes[0].t === 0.5 / 60 && hm.nodes[59].t === 59.5 / 60 && hm.nodes[56].code === 'J3' && hm.nodes[56].state === 'merged' && hm.nodes[56].merged === 1e12 - 5 && hm.nodes[29].state === 'queued' && Hx.helixModel(null, null).nodes.length === 0, 'H1 the helix model: the 60 newest jobs, oldest first, t spread inside 0..1, a merge marks its own job only');
    // ---- H5: the helix's facts
    const near = (a, b) => Math.abs(a - b) < 1e-9, n10 = Hx.nodeAt(2, 10), ang = 0.25 * 1.5 * 2 * Math.PI;
    check(Hx.HELIX.height === 9 && Hx.HELIX.radius === 2.3 && Hx.turnsOf(5) === 1.5 && Hx.turnsOf(30) === 3 && Hx.turnsOf(60) === 4.5 && Hx.MAX_NODES === 60, 'H5 height 9, radius 2.3, turns clamp(n / 10, 1.5, 4.5), at most 60 jobs');
    check(near(n10.t, 0.25) && near(n10.angle, ang) && near(n10.a[0], 2.3 * Math.cos(ang)) && near(n10.a[1], -4.5 + 0.25 * 9) && near(n10.a[2], 2.3 * Math.sin(ang)) && near(n10.b[0], -n10.a[0]) && n10.b[1] === n10.a[1] && near(n10.b[2], -n10.a[2]) && Hx.nodeAt(0, 4).a[1] < Hx.nodeAt(3, 4).a[1], `H5 node i of n: t = (i + 0.5) / n, on the strand, its rung's other end mirrored across the spine, the oldest lowest: ${JSON.stringify(n10)}`);
    check(near(Hx.nodeRadius(0, 8), 0.11) && near(Hx.nodeRadius(8, 8), 0.32) && near(Hx.nodeRadius(2, 8), 0.11 + 0.21 * 0.5) && near(Hx.nodeRadius(null, 0), 0.11) && near(Hx.nodeRadius(99, 8), 0.32), 'H5 a node\'s radius is 0.11 + 0.21 * sqrt(cost / maxCost); no cost: 0.11');
    check(JSON.stringify(Hx.COLOURS) === '{"red":"#ff6b6b","ready":"#2dd4bf","running":"#fdcb6e","held":"#a29bfe","queued":"#74b9ff","merged":"#00d4ff","spine":"#00d4ff","background":"#0a0f1c"}', `H5 the colours by state, the spine and the background: ${JSON.stringify(Hx.COLOURS)}`);
    check(['running', 'red', 'green', 'stopped', 'idle', 'x'].map((k) => Hx.stateOf(k, 0)).join() === 'running,red,ready,held,queued,queued' && Hx.stateOf('red', 5) === 'merged', 'H5 the page\'s lights as helix states; a merged job is merged');
    // ---- H6: the replay
    const T = 1e12, rm = Hx.helixModel([{ code: 'B2', status: 'running', time: T - 600e3, started: T - 3600e3, cost: 4 }, { code: 'A1', status: 'green', time: T - 7200e3, cost: 1 }], [{ message: 'Merge A1: x', time: T - 3600e3 }], T);
    const at = (ms) => { const r = Hx.replayAt(rm, ms); return r.nodes.map((n) => (n.shown ? n.state : '-')).join() + '|' + Hx.counterText(r).join('|'); };
    check(rm.from === T - 7200e3 && rm.to === T && at(T - 5000e3) === 'running,-|1 being built|0 finished in 24 hours' && at(T - 1800e3) === 'merged,running|1 being built|1 finished \u00b7 $1.00 in 24 hours' && at(null) === at(T) && at(T - 9e7) === at(T - 7200e3),
      `H6 the replay: from the first known event when that is later than 24 h ago; absent before it started, running until merged: ${at(T - 5000e3)} / ${at(T - 1800e3)}`);
    const old = Hx.helixModel([{ code: 'O1', status: 'idle', time: T - 3 * 864e5 }], [], T);
    check(old.from === T - 864e5 && Hx.replayAt(old, old.from).nodes[0].shown && Hx.replayAt(rm, null).nodes[1].state === 'running' && Hx.replayAt(Hx.helixModel([{ code: 'R', status: 'red', time: T - 9 }], [], T), null).nodes[0].state === 'red', 'H6 the slider never goes back more than 24 hours; at "now" a job is as it is now');
    // ---- H7: the tiers
    check(Hx.nextTier('full', 28) === 'full' && Hx.nextTier('full', 29) === 'bloom' && Hx.nextTier('bloom', 40) === 'plain' && Hx.nextTier('plain', 40) === 'plain' && Hx.nextTier('plain', 51) === 'svg' && Hx.nextTier('full', 80) === 'bloom'
      && JSON.stringify(Hx.TIERS) === '{"full":{"ratio":2,"bloom":true,"focus":true,"shadows":true,"stars":320},"bloom":{"ratio":1.5,"bloom":true,"focus":false,"shadows":false,"stars":220},"plain":{"ratio":1,"bloom":false,"focus":false,"shadows":false,"stars":120}}', 'H7 the tiers: one step down above 28 ms a frame, the SVG above 50 ms at plain; full, bloom, plain as the Today app has them');
    const nowB = Date.parse('2026-11-08T12:00:00Z'), bl = B.buildersOf({ heads: [{ branch: 'fix/0.3.2-ab1', sha: 'a', message: 'AB1: x', time: nowB - 600e3 }, { branch: 'fix/0.3.2-old', sha: 'b', message: 'x', time: nowB - 30 * 3600e3 }, { branch: 'fix/0.3.1-no', sha: 'c', message: 'x', time: nowB - 600e3 }], runs: { workflow_runs: [{ id: 1, head_branch: 'fix/0.3.2-ab1', head_sha: 'a', status: 'queued', run_started_at: '2026-11-08T11:59:00Z', updated_at: '2026-11-08T11:59:00Z', html_url: 'https://github.com/x' }] }, version: '0.3.2', now: nowB });
    check(bl.length === 1 && bl[0].code === 'AB1' && bl[0].message === 'AB1: x' && B.statusOf(bl[0], '', nowB) === 'running', 'B8 buildersOf: this release\'s branches by their latest commit within 24 h; a queued run is running');
    check(B.statusOf({ run: { result: 'running' }, time: 0 }, '', 1) === 'running' && B.statusOf({ run: { result: 'green' }, time: 0 }, 'waiting for the owner', 1) === 'red' && B.statusOf({ run: null, time: 0 }, 'DONE', 1) === 'green' && B.statusOf({ run: null, time: 0 }, '', 3 * 3600e3) === 'stopped' && B.statusOf({ run: null, time: 0 }, '', 3600e3) === 'idle', 'B7 statusOf: running, red (a note waiting on the owner), done, stopped after 2 h, idle');
    check(B.releaseLine({ version: '0.3.2' }, { tag_name: 'v0.3.1' }).inProgress && /0\.3\.2 in progress/.test(B.releaseLine({ version: '0.3.2' }, { tag_name: 'v0.3.1' }).text) && !B.releaseLine({ version: '0.3.2' }, { tag_name: 'v0.3.2' }).inProgress, 'B6 releaseLine: "in progress" while the versions differ');
  }

  // ---- the made-up GitHub, served to the page
  const iso = (min, now) => new Date(now - min * 60e3).toISOString();
  async function open(opts = {}, setup = null) {
    const v = await visitor(browser, { viewport: opts.viewport || [1440, 900], motion: opts.motion || 'no-preference' });
    // (RL33) every visit draws the plain tier from its first frame: full-tier WebGL on a test machine's software renderer took the
    // processor from the suites running beside this one (sp35 red in CI run 43237079137, both attempts; reproduced with site beside it)
    if (!opts.tier) await v.ctx.addInitScript(() => { new MutationObserver((_, o) => { const h = document.getElementById('bp-line'); if (h) { h.dataset.tier = 'plain'; o.disconnect(); } }).observe(document, { childList: true, subtree: true }); });
    const now = Date.now(), seen = { api: [], raw: [], inm: [], etags: {}, usage: [], usageInm: [] };
    await v.ctx.clock.install({ time: now }); // the fixtures' times are written from this "now": the page reads the same one (a shifted clock reaches node only)
    const state = { remaining: 59, status: {}, reset: Math.floor(now / 1000) + 1800, force304: false, calls: 0, noRelease: false, usage: 'ok' };
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
      if (/\/Antnioo\/DataArcus\/build-data\/usage\.json$/.test(u.pathname)) {
        seen.usage.push(u.pathname); const inm = rt.request().headers()['if-none-match']; if (inm) seen.usageInm.push(inm);
        if (state.usage === 'missing') return rt.fulfill({ status: 404, headers: CORS, body: '404: Not Found' });
        if (inm === '"usage-1"' && state.force304) return rt.fulfill({ status: 304, headers: { ...CORS, etag: '"usage-1"' } });
        return rt.fulfill({ status: 200, contentType: 'text/plain', headers: { ...CORS, etag: '"usage-1"' }, body: JSON.stringify(state.usage === 'v2' ? { ...UX, version: 2 } : { ...UX, jobs: UX.jobs.map((j, i) => (i ? j : { ...j, session_id: 'sess-SECRET', prompt: 'PROMPT-SECRET' })) }) });
      }
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
    // (RL33, on purpose) H2 pinned aria-hidden on the whole box; the box now holds the slider and the full-screen button, so only the canvas is hidden
    // the visit named the plain tier on the element before the helix mounted (open): no stepping down to the SVG mid-check (H7 pins the stepping)
    const mode = await v.pg.evaluate(() => { const h = document.getElementById('bp-line'), c = h.querySelector('canvas'), st = h.querySelector('.bh-stage'); return [h.dataset.mode, c && c.getAttribute('aria-hidden'), h.getAttribute('aria-hidden'), st && st.tabIndex, st && (st.getAttribute('aria-label') || '').length > 40, h.dataset.tier, window.BuildPage.helix.mode]; });
    check(mode.join() === 'webgl,true,,0,true,plain,webgl', `H2 WebGL: the helix is drawn in a canvas hidden from screen readers; the stage takes the keyboard and says how (${mode.join(',')})`);
    const cnt = await text(v.pg, '#bp-line .bh-count');
    check(/^3 being built\s*1 finished/.test(cnt.trim()), `H2 the counter under the helix: ${cnt}`);
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

  // ---- U0..U8: the Fuel panel (BF2)
  {
    let U = null;
    try { U = require('../../assets/js/build-usage.js'); } catch (e) { check(false, `U0 assets/js/build-usage.js does not load: ${e.message}`); }
    if (U) {
      check(U.validate(UX).ok && U.validate({ version: 2 }).ok === false && /version 1; the file says 2/.test(U.validate({ version: 2 }).message) && U.validate(null).ok === false && U.validate({ version: 1 }).ok === false, 'U0 validate: version 1 with its parts passes; version 2, nothing, or a cut file does not, with the words "This page reads usage version 1; the file says 2"');
      check(U.fmtUsd(12.3, 'en-US') === '$12.30' && U.fmtUsd(0, 'en-US') === '$0.00' && U.fmtUsd(1234.5, 'en-US') === '$1,234.50' && U.fmtUsd('x') === '-', 'U0 fmtUsd: "$12.34" style, two decimals, - for a non-number');
      check(U.fmtMillions(346157859, 'en-US') === '346.2M' && U.fmtMillions(0, 'en-US') === '0M' && U.fmtMillions(null) === '-', 'U0 fmtMillions: tokens in millions');
      const bars = U.dayBars(UX.days, 100);
      check(bars.length === 14 && bars[13].h === 100 && bars[0].h === 0 && Math.abs(bars[9].h - (14.4 / 21.35) * 100) < 0.01 && U.dayBars([], 100).length === 0, 'U0 dayBars: 14 bars drawn to scale (the tallest day is full height, a zero day is 0, the rest in proportion)');
      check(U.costById(UX.jobs).AA1 === 7.25 && Object.keys(U.costById(null)).length === 0, 'U0 costById: job code -> cost');
    }
  }
  {
    const { v, seen } = await open();
    await loaded(v.pg).catch(() => null);
    await v.pg.waitForFunction(() => /^Updated/.test((document.getElementById('bu-updated') || {}).textContent || ''), null, { timeout: WAIT }).catch(() => null);
    const fuel = await text(v.pg, '#bu-panel');
    const want = await v.pg.evaluate(() => [new Intl.NumberFormat([], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(21.35), new Intl.NumberFormat([], { maximumFractionDigits: 1 }).format(66.185)]);
    check((await text(v.pg, '#bu-cost')).includes('$' + want[0]) && (await text(v.pg, '#bu-tokens')).includes(want[1]) && /M/.test(await text(v.pg, '#bu-tokens')), `U1 today's cost in USD and tokens in millions, in the visitor's number format ($${want[0]}, ${want[1]}M): ${await text(v.pg, '#bu-cost')} / ${await text(v.pg, '#bu-tokens')}`);
    const kinds = await text(v.pg, '#bu-kinds');
    check(/builder/i.test(kinds) && /worker/i.test(kinds) && /probe/i.test(kinds) && /\$12\.10/.test(kinds) && /\$8\.40/.test(kinds) && /\$0\.85/.test(kinds), `U1 builders, workers and probes with cost and count: ${kinds.slice(0, 160)}`);
    const models = await text(v.pg, '#bu-models');
    check(/opus/i.test(models) && /sonnet/i.test(models) && /\$15\.60/.test(models) && /\$5\.75/.test(models), `U1 Opus and Sonnet with their cost: ${models.slice(0, 120)}`);
    const jobs = await text(v.pg, '#bu-jobs');
    check(/AA1/.test(jobs) && /ZY9/.test(jobs) && /XW8/.test(jobs) && /\$7\.25/.test(jobs) && /95 min/.test(jobs), `U1 the last finished jobs with cost and minutes: ${jobs.slice(0, 160)}`);
    check(/made-up cleanup/.test(await text(v.pg, '#bu-top')) && (await v.pg.locator('#bu-top > li').count()) === 5, 'U1 the five costliest sessions of today');
    check(/^Updated \d\d:\d\d/.test(await text(v.pg, '#bu-updated')), `U1 "Updated HH:MM" from generated_at: ${await text(v.pg, '#bu-updated')}`);
    check(await v.pg.locator('#bu-status').isHidden(), 'U1 no message while the file is good');
    // U2: the chart
    const chart = await v.pg.evaluate(() => { const svg = document.querySelector('#bu-chart svg'); if (!svg) return null; const bars = [...svg.querySelectorAll('rect[data-day]')]; return { n: bars.length, h: bars.map((b) => +b.getAttribute('height')), titles: bars.map((b) => (b.querySelector('title') || {}).textContent || '') }; });
    check(chart && chart.n === 14 && chart.h[13] > 0 && chart.h[0] === 0 && chart.h[13] >= Math.max(...chart.h) && Math.abs(chart.h[9] / chart.h[13] - 14.4 / 21.35) < 0.02 && /2026-11-08/.test(chart.titles[13]) && /\$21\.35/.test(chart.titles[13]), `U2 a 14-day inline SVG drawn to scale: ${chart && chart.h.join(',')}`);
    // U3: the rung's label
    await v.pg.evaluate(() => window.BuildPage.helix.focus('AA1'));
    check(/\$7\.25/.test(await text(v.pg, '#bp-line .bh-label')), `U3 the rung's label shows that job's cost: ${await text(v.pg, '#bp-line .bh-label')}`);
    await v.pg.evaluate(() => window.BuildPage.helix.focus('BB2'));
    check(!/\$\d/.test(await text(v.pg, '#bp-line .bh-label')), 'U3 a job with no usage row shows no cost');
    // U7: text, not HTML
    check(await v.pg.evaluate(() => !document.querySelector('#bu-panel b, #bu-panel img, #bu-panel script')) && (await text(v.pg, '#bu-jobs')).includes('<b>bold?</b>'), 'U7 a title with HTML shows as the characters written, no element');
    check(!/SECRET/.test(await v.pg.evaluate(() => document.getElementById('bu-panel').innerHTML)), 'U7 a field outside the schema (a session id, a prompt) in the file is never shown');
    // U6: through the one reader
    check(seen.usage.length === 1 && seen.usage[0] === '/Antnioo/DataArcus/build-data/usage.json' && !seen.api.some((u) => /usage/.test(u)), `U6 usage.json is read once from raw.githubusercontent.com (build-data branch), not the API (${seen.usage.join(',')})`);
    check(!v.errs.length, `U1 no page error: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  {
    const { v, state, seen } = await open();
    await loaded(v.pg).catch(() => null);
    await v.pg.waitForFunction(() => /^Updated/.test((document.getElementById('bu-updated') || {}).textContent || ''), null, { timeout: WAIT }).catch(() => null);
    const before = await text(v.pg, '#bu-panel');
    state.force304 = true; seen.usageInm.length = 0;
    await v.pg.evaluate(() => window.BuildPage.refresh());
    check(seen.usageInm.join(',') === '"usage-1"' && (await text(v.pg, '#bu-panel')) === before, `U6 the next refresh sends If-None-Match and a 304 keeps the panel (${seen.usageInm.join(',')})`);
    await v.ctx.close();
  }
  for (const [mode, re, label] of [['v2', /This page reads usage version 1; the file says 2/, 'U4 a version other than 1'], ['missing', /Usage numbers are not available/, 'U5 a missing file']]) {
    const { v } = await open({}, async ({ state }) => { state.usage = mode; });
    await loaded(v.pg).catch(() => null);
    await v.pg.waitForFunction(() => (document.getElementById('bu-status') || {}).hidden === false, null, { timeout: WAIT }).catch(() => null);
    const msg = await text(v.pg, '#bu-status');
    check(re.test(msg) && (await v.pg.locator('#bu-chart svg').count()) === 0 && !/\$\d/.test(await text(v.pg, '#bu-panel')), `${label}: the panel says so and shows no numbers: ${msg}`);
    check(/BB2/.test(await text(v.pg, '#bp-builders')) && /0\.3\.2 in progress/.test(await text(v.pg, '#bp-release')) && (await v.pg.locator('#bp-warn').isHidden()), `${label}: the rest of the page works and no banner`);
    check(!v.errs.length, `${label}: no page error: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  {
    const { v } = await open({ viewport: [390, 800] });
    await loaded(v.pg).catch(() => null);
    await v.pg.waitForFunction(() => /^Updated/.test((document.getElementById('bu-updated') || {}).textContent || ''), null, { timeout: WAIT }).catch(() => null);
    const w = await v.pg.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, document.getElementById('bu-panel').scrollWidth, document.getElementById('bu-panel').clientWidth]);
    check(w[0] <= w[1] && w[2] <= w[3], `U8 no sideways scroll at 390 px with the panel (page ${w[0]}/${w[1]}, panel ${w[2]}/${w[3]})`);
    check(await v.pg.evaluate(() => { const r = document.querySelector('#bu-chart svg').getBoundingClientRect(); return r.width > 100 && r.right <= window.innerWidth; }), 'U8 the chart fits the phone width');
    await v.ctx.close();
  }

  // ---- F3 (BF3): which requests the page's scripts make (fetch, XHR, beacon): GitHub only, never this site
  {
    const reqs = [];
    const { v } = await open({}, async ({ v }) => { v.pg.on('request', (r) => { if (['fetch', 'xhr', 'ping', 'websocket', 'eventsource'].includes(r.resourceType())) reqs.push(r.url()); }); });
    await loaded(v.pg).catch(() => null);
    const hosts = [...new Set(reqs.map((u) => new URL(u).host))].sort();
    check(reqs.length > 0 && hosts.every((h) => h === 'api.github.com' || h === 'raw.githubusercontent.com'), `F3 (BF3) script requests go to GitHub only: ${hosts.join(', ')}`);
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
    check(/connect-src https:\/\/api\.github\.com https:\/\/raw\.githubusercontent\.com(;|$)/.test(pol), `P1 connect-src names GitHub's API and raw files: ${pol.slice(0, 200)}`);
    check(/connect-src https:\/\/api\.github\.com https:\/\/raw\.githubusercontent\.com(;|$)/.test(pol), `F1 (BF3) connect-src lists exactly api.github.com and raw.githubusercontent.com, no 'self': ${pol.slice(0, 300)}`);
    check(html.includes('Your browser reads the public GitHub repository directly. DataArcus stores nothing and receives nothing from this page.') && !/Nothing is stored, nothing is sent/.test(html), 'F2 (BF3) the page says exactly what it sends');
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
    check(await v.pg.locator('#bp-line .bh-flat').isVisible() && /same helix seen from the front/.test(await text(v.pg, '#bp-line .bh-flat')), 'H3 no WebGL: the page says in words that this is the helix from the front and that the cards hold the same jobs');
    await v.pg.locator('#bp-line .bh-range').evaluate((r) => { r.value = '0'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    const back = await v.pg.evaluate(() => [document.querySelectorAll('#bp-line svg g[data-code]').length, document.querySelector('#bp-line .bh-at').textContent]);
    check(back[0] >= 1 && back[0] < 4 && /^\d\d:\d\d$/.test(back[1]), `H3 the replay works on the SVG helix too: fewer jobs at the start, the hour said (${back.join(',')})`);
    await v.pg.locator('#bp-line .bh-stage').focus(); await v.pg.keyboard.press('ArrowUp');
    check(/\b(AA1|BB2|CC3|DD4)\b/.test(await text(v.pg, '#bp-line .bh-said')), 'H3 the arrow keys step through the jobs on the SVG helix');
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
    const ph = await v.pg.evaluate(() => { const st = document.querySelector('#bp-line .bh-stage').getBoundingClientRect(), f = document.querySelector('#bp-line .bh-full').getBoundingClientRect(), r = document.querySelector('#bp-line .bh-range').getBoundingClientRect(); return [st.left >= 0 && st.right <= innerWidth, Math.round(st.height), Math.round(f.width), Math.round(f.height), f.right <= st.right && f.top >= st.top, r.width > 120 && r.right <= innerWidth]; });
    check(ph[0] && ph[1] >= 340 && ph[2] >= 44 && ph[3] >= 44 && ph[4] && ph[5], `H9 at 390 px the stage fits the width, the full-screen button is a 44 px target inside it, the slider fits (${ph.join(',')})`);
    await v.ctx.close();
    const r = await open({ motion: 'reduce' });
    await loaded(r.v.pg).catch(() => null);
    const anim = await r.v.pg.evaluate(() => [...document.querySelectorAll('.bp-bar')].map((e) => getComputedStyle(e).animationName));
    check(anim.length > 0 && anim.every((a) => a === 'none') && (await r.v.pg.evaluate(() => document.getElementById('bp-line').dataset.motion)) === 'still', `P2 reduced motion: no animation, a still helix (${anim.join(',')})`);
    // ---- H8, H9: movable and scalable. Reduced motion, so nothing turns by itself and a position can be read twice
    const pg = r.v.pg;
    check(await pg.evaluate(() => window.BuildPage.helix.tier()) === 'plain' && await pg.evaluate(() => window.BuildPage.helix.tier('bloom')) === 'bloom' && await pg.evaluate(() => window.BuildPage.helix.tier('plain')) === 'plain', 'H7 a tier named on the element is the one drawn; tier(name) changes it and pins it');
    const pos = async () => pg.evaluate(() => { window.BuildPage.helix.focus('BB2'); const l = document.querySelector('#bp-line .bh-label'); return [Math.round(parseFloat(l.style.left)), Math.round(parseFloat(l.style.top)), l.hidden].join(); });
    await pg.locator('#bp-line').scrollIntoViewIfNeeded();
    const box = await pg.locator('#bp-line .bh-stage').boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const p0 = await pos();
    await pg.mouse.move(cx, cy); const y0 = await pg.evaluate(() => scrollY); await pg.mouse.wheel(0, 240);
    // the scroll is waited for, not timed: on a busy runner the page had not moved after 150 ms (run 43288385522: "scroll 54 -> 54")
    await pg.waitForFunction((y) => scrollY > y, y0, { timeout: 5000 }).catch(() => null); await pg.waitForTimeout(150);
    const y1 = await pg.evaluate(() => scrollY), pW0 = await pos();
    check(y1 > y0 && pW0 === p0, `H8 the wheel over a helix that is not in focus scrolls the page and zooms nothing (scroll ${y0} -> ${y1}; ${p0} / ${pW0})`);
    await pg.evaluate(() => window.scrollTo(0, 0)); await pg.locator('#bp-line').scrollIntoViewIfNeeded();
    const b2 = await pg.locator('#bp-line .bh-stage').boundingBox(), mx = b2.x + b2.width / 2, my = b2.y + b2.height / 2, q0 = await pos();
    await pg.mouse.move(mx, my); await pg.mouse.down(); await pg.mouse.move(mx + 90, my + 10, { steps: 4 }); await pg.mouse.move(mx + 180, my + 30, { steps: 4 }); await pg.mouse.up();
    const q1 = await pos();
    check(q1 !== q0 && !/true$/.test(q1), `H8 a drag turns the helix (the job's place ${q0} -> ${q1})`);
    await pg.keyboard.press('0'); const q2 = await pos();
    check(q2 === q0 && await pg.evaluate(() => document.activeElement === document.querySelector('#bp-line .bh-stage')), `H8 a click puts the helix in focus and 0 puts it back (${q0} / ${q2})`);
    const ys = await pg.evaluate(() => scrollY); await pg.mouse.move(mx, my); await pg.mouse.wheel(0, -300); let q3 = q0; for (let i = 0; i < 25 && q3 === q0; i++) { await pg.waitForTimeout(120); q3 = await pos(); }   // the zoom is waited for, 3 s at most
    check(q3 !== q0 && await pg.evaluate(() => scrollY) === ys, `H8 with the helix in focus the wheel zooms and the page stays (${q0} -> ${q3})`);
    await pg.keyboard.press('0'); await pg.keyboard.press('ArrowRight'); const q4 = await pos(); await pg.keyboard.press('0'); await pg.keyboard.press('+'); const q5 = await pos(); await pg.keyboard.press('0');
    check(q4 !== q0 && q5 !== q0 && q4 !== q5 && await pos() === q0, `H8 the keys: an arrow turns, plus zooms, 0 resets (${q0}; ${q4}; ${q5})`);
    // the job in hand is BB2, the newest (pos() asked for it): down goes to the one before it, then to the one before that
    await pg.keyboard.press('ArrowDown'); const s1 = await text(pg, '#bp-line .bh-said'); await pg.keyboard.press('ArrowDown'); const s2 = await text(pg, '#bp-line .bh-said');
    check(/^(AA1|CC3|DD4)\. /.test(s1) && /^(AA1|CC3|DD4)\. /.test(s2) && s2 !== s1 && /CI:/.test(s2) && !(await pg.locator('#bp-line .bh-label').isHidden()), `H8 the down arrow steps through the jobs towards the oldest and says each one: ${s1.slice(0, 60)} | ${s2.slice(0, 60)}`);
    await pg.locator('#bp-line .bh-range').evaluate((el) => { el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    const rp = await pg.evaluate(() => [document.querySelector('#bp-line .bh-c1').textContent, document.querySelector('#bp-line .bh-at').textContent, document.querySelector('#bp-line .bh-range').getAttribute('aria-valuetext')]);
    await pg.locator('#bp-line .bh-range').evaluate((el) => { el.value = '1000'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    const rn = await pg.evaluate(() => [document.querySelector('#bp-line .bh-c1').textContent, document.querySelector('#bp-line .bh-at').textContent]);
    check(/^[12] being built$/.test(rp[0]) && /^\d\d:\d\d$/.test(rp[1]) && rp[2] === rp[1] && rn.join() === '3 being built,now', `H8 the replay slider: fewer jobs at the start and the hour said; back at the end it is now (${rp.join(',')} -> ${rn.join(',')})`);
    const fb = pg.locator('#bp-line .bh-full');
    const mid = await fb.evaluate((f) => { const a = f.getBoundingClientRect(), b = f.querySelector('svg').getBoundingClientRect(); return [Math.abs((a.left + a.width / 2) - (b.left + b.width / 2)), Math.abs((a.top + a.height / 2) - (b.top + b.height / 2)), a.width, a.height, f.getAttribute('aria-label')]; });
    check(mid[0] <= 0.5 && mid[1] <= 0.5 && mid[2] >= 44 && mid[3] >= 44 && mid[4] === 'Full screen', `H9 the full-screen button: its icon in the middle of its box, 44 px, named (${mid.join(',')})`);
    await fb.click(); await pg.waitForFunction(() => document.getElementById('bp-line').classList.contains('bh-on'), null, { timeout: 5000 }).catch(() => null); await pg.waitForTimeout(400);
    const on = await pg.evaluate(() => { const h = document.getElementById('bp-line'), st = h.querySelector('.bh-stage').getBoundingClientRect(), f = h.querySelector('.bh-full'), a = f.getBoundingClientRect(), b = f.querySelector('svg').getBoundingClientRect(); return [h.classList.contains('bh-on'), st.width >= innerWidth - 24, st.height >= innerHeight * 0.7, f.getAttribute('aria-label'), f.getAttribute('aria-pressed'), Math.abs((a.left + a.width / 2) - (b.left + b.width / 2)) <= 0.5 && Math.abs((a.top + a.height / 2) - (b.top + b.height / 2)) <= 0.5]; });
    check(on.join() === 'true,true,true,Leave full screen,true,true', `H9 full screen: the helix fills the window, the button says how to leave, its icon still in the middle (${on.join(',')})`);
    await fb.click(); await pg.waitForFunction(() => !document.getElementById('bp-line').classList.contains('bh-on') && !document.fullscreenElement, null, { timeout: 5000 }).catch(() => null);
    check(await pg.evaluate(() => !document.getElementById('bp-line').classList.contains('bh-on') && !document.fullscreenElement), 'H9 the same button leaves full screen');
    check(!r.v.errs.length, `H8 H9 no page error while moving and scaling: ${r.v.errs.join(' | ')}`);
    await r.v.ctx.close();
  }
  return { checks, problems };
}
