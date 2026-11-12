/*
 * DataArcus live build page (0.3.2 BF1, B-397): what the builders are doing, read from the public repo in the visitor's
 * browser. dataarcus.com/build/ is unlisted (noindex, no menu, not in the sitemap). No token, no server, no AI, nothing
 * written anywhere: only GET requests to api.github.com and raw.githubusercontent.com.
 *
 * Interface (pure core, runs in the browser and in Node; the DOM part below runs only where `document` exists):
 *   REPO                      'Antnioo/DataArcus'
 *   ago(ms, now?)             "just now", "5 min ago", "3 h ago", "2 d ago" ("" for a missing time)
 *   jobCode(branch, version)  'fix/0.3.2-bf1' -> 'BF1' ('' when the branch is not that release's)
 *   stateOf(noteText)         the text after "**State:**" in a job note, or ''
 *   newestVersion(branches)   the highest integration/X.Y.Z among the branch list (API answer): { version, branch } | null
 *   resultOf(run)             'queued' | 'running' | 'green' | 'red' | 'other' for a workflow run
 *   buildersOf({ heads, runs, version, now })   branches at work: this release's fix/ and feat/ branches whose latest commit
 *                             (heads: [{ branch, sha, message, time }], read per branch) is from the last 24 h, newest first,
 *                             each with its latest tests.yml run
 *   statusOf(b, note, now)    a builder's light: running (a run in progress), red (a red run, or a note waiting on the owner), green
 *                             (done), stopped (no push for 2 h and nothing running), idle
 *   ciRows(runs, now)         runs in progress or finished in the last 3 h
 *   mergesOf(commits, now)    "Merge ..." commits of the last 24 h (a builder's own "Merge origin/..." left out)
 *   releaseLine(pkg, latest)  { text, inProgress }: the version on integration against the latest release
 *   (BF2) where window.BuildUsage exists the Fuel panel is mounted on this client and read once per refresh
 *   createClient({ fetch, now, save })  the reader: etag cache (If-None-Match, a 304 keeps the data), the rate-limit
 *                             state (remaining < 10: every 10 min; a 403/429: wait until X-RateLimit-Reset)
 * Every text from GitHub is shown with textContent, never as HTML.
 * (c) DataArcus. All rights reserved.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.BuildPage = api; if (root.document) api.start(root); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // (0.3.3 SG1) the page helpers (an element with its class and text): page-toast.js, loaded before this file on the page
  const PT = typeof module === 'object' && module.exports ? require('./page-toast.js') : self.DAPageToast;

  const REPO = 'Antnioo/DataArcus';
  const API = 'https://api.github.com/repos/' + REPO;
const REL_API = 'https://api.github.com/repos/Antnioo/dataarcus-releases';   // the releases are published in their own public repo
const MAX_LOOKUPS = 40, KEEP_CALLS = 12;   // latest-commit lookups per refresh; below KEEP_CALLS requests left, none
  const RAW = 'https://raw.githubusercontent.com/' + REPO + '/';
  const DAY = 864e5, HOUR = 36e5;
  const EVERY = 120000, SLOW_EVERY = 600000, LOW = 10, MAX_BUILDERS = 24;

  const ago = (ms, now) => {
    if (!ms) return '';
    const s = Math.max(0, Math.round(((now == null ? Date.now() : now) - ms) / 1000));
    if (s < 45) return 'just now';
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' d ago';
  };
  const stamp = (t) => { const n = Date.parse(t || ''); return Number.isFinite(n) ? n : 0; };
  const firstLine = (s) => String(s || '').split('\n')[0].trim().slice(0, 200);
  const short = (sha) => String(sha || '').slice(0, 7);
  const esc = (v) => String(v == null ? '' : v).replace(/[^\w.\-/]/g, '');   // a branch name inside a URL path: plain characters only

  const jobCode = (branch, version) => {
    const m = new RegExp('^(?:fix|feat)/' + String(version).replace(/\./g, '\\.') + '-([A-Za-z0-9][A-Za-z0-9._-]*)$').exec(String(branch || ''));
    return m ? m[1].toUpperCase() : '';
  };
  const stateOf = (text) => { const m = /\*\*State:\*\*[ \t]*([^\n\r]*)/.exec(String(text || '')); return m ? m[1].trim().slice(0, 120) : ''; };
  const newestVersion = (branches) => {
    let best = null;
    for (const b of Array.isArray(branches) ? branches : []) {
      const m = /^integration\/(\d+)\.(\d+)\.(\d+)$/.exec(b && b.name || '');
      if (!m) continue;
      const k = +m[1] * 1e8 + +m[2] * 1e4 + +m[3];
      if (!best || k > best.k) best = { k, version: m.slice(1).join('.'), branch: b.name };
    }
    return best && { version: best.version, branch: best.branch };
  };
  const resultOf = (run) => {
    if (!run) return 'other';
    if (run.status === 'queued' || run.status === 'waiting' || run.status === 'pending') return 'queued';
    if (run.status !== 'completed') return 'running';
    if (run.conclusion === 'success') return 'green';
    return run.conclusion === 'failure' || run.conclusion === 'timed_out' ? 'red' : 'other';
  };
  const runsOf = (x) => (Array.isArray(x) ? x : x && Array.isArray(x.workflow_runs) ? x.workflow_runs : []);   // the API's answer, or the list itself
  const runInfo = (r) => r && ({ id: r.id, branch: r.head_branch, sha: short(r.head_sha), result: resultOf(r), url: String(r.html_url || ''),
    started: stamp(r.run_started_at || r.created_at), updated: stamp(r.updated_at), done: r.status === 'completed' });

  const buildersOf = ({ heads, runs, version, now }) => {
    const out = new Map();
    for (const h of Array.isArray(heads) ? heads : []) {
      const code = h && jobCode(h.branch, version);
      if (!code || !h.time || now - h.time > DAY || out.has(h.branch)) continue;
      out.set(h.branch, { branch: h.branch, code, sha: short(h.sha), message: firstLine(h.message), time: h.time, run: null });
    }
    for (const r of runsOf(runs)) {   // runs come newest first: the first run of a branch is its latest
      const b = out.get(r && r.head_branch);
      if (b && !b.run) b.run = runInfo(r);
    }
    return [...out.values()].sort((a, b) => b.time - a.time).slice(0, MAX_BUILDERS);
  };

  const statusOf = (b, note, now) => {
    const r = b && b.run ? b.run.result : '';
    if (r === 'running' || r === 'queued') return 'running';
    if (r === 'red' || /\b(wait|owner|stop|block)/i.test(String(note || ''))) return 'red';
    if (r === 'green' || /^done\b/i.test(String(note || ''))) return 'green';
    return b && now - b.time > 2 * HOUR ? 'stopped' : 'idle';
  };

  const ciRows = (runs, now) => runsOf(runs).map(runInfo)
    .filter((r) => r && (!r.done || now - r.updated <= 3 * HOUR))
    .map((r) => ({ ...r, seconds: r.done ? Math.max(0, Math.round((r.updated - r.started) / 1000)) : Math.max(0, Math.round((now - r.started) / 1000)) }));

  const mergesOf = (commits, now) => (Array.isArray(commits) ? commits : []).filter((c) => c && c.commit && Array.isArray(c.parents) && c.parents.length > 1)
    .map((c) => ({ sha: short(c.sha), message: firstLine(c.commit.message), time: stamp(c.commit.committer && c.commit.committer.date) }))
    .filter((c) => /^Merge /.test(c.message) && !/^Merge (branch|remote-tracking|origin|pull request)/.test(c.message) && now - c.time <= DAY);

  const releaseLine = (pkg, latest) => {
    const v = String((pkg && pkg.version) || '').trim(), rel = String((latest && latest.tag_name) || '').replace(/^v/, '').trim();
    if (!v) return { text: 'The version on the integration branch could not be read.', inProgress: false };
    if (!rel) return { text: v + ' in progress (no release found).', inProgress: true };
    return v === rel ? { text: v + ' is released.', inProgress: false } : { text: v + ' in progress, latest release ' + rel + '.', inProgress: true };
  };

  const hhmm = (ms) => { const d = new Date(ms); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  // The reader. fetch is the browser's; every API call sends the last ETag of that address, and a 304 hands back the data
  // of the last 200 (it costs nothing against the 60 an hour). `limits` says what the page must tell the visitor.
  const createClient = ({ fetch, now }) => {
    const cache = new Map();
    const state = { remaining: null, resetAt: 0, blockedUntil: 0, calls: 0 };
    const read = (res) => {
      const rem = res.headers.get('x-ratelimit-remaining'), reset = res.headers.get('x-ratelimit-reset');
      if (rem != null && rem !== '') state.remaining = +rem;
      if (reset) state.resetAt = +reset * 1000;
    };
    const get = async (url, { raw } = {}) => {
      const hit = cache.get(url), headers = {};
      if (hit && hit.etag) headers['If-None-Match'] = hit.etag;
      if (!raw) headers.Accept = 'application/vnd.github+json';
      if (!raw) state.calls++;
      const res = await fetch(url, { headers, cache: 'no-store' });
      read(res);
      if (res.status === 304 && hit) return { data: hit.data, fresh: false };
      if (res.status === 403 || res.status === 429) {
        state.blockedUntil = state.resetAt || now() + 60000;
        throw Object.assign(new Error('rate limited'), { limited: true });
      }
      if (!res.ok) throw Object.assign(new Error('GitHub answered ' + res.status), { status: res.status });
      const data = raw ? await res.text() : await res.json();
      cache.set(url, { etag: res.headers.get('etag') || '', data });
      return { data, fresh: true };
    };
    const slow = () => state.remaining != null && state.remaining < LOW;
    return { get, state, slow, blocked: () => state.blockedUntil > now(), nextIn: () => (slow() ? SLOW_EVERY : EVERY) };
  };

  // ------------------------------------------------------------------ the page
  // ------------------------------------------------------------------ the page
  const start = (win) => {
    const doc = win.document;
    const $ = (id) => doc.getElementById(id);
    if (!$('bp-builders')) return;
    const client = createClient({ fetch: (u, o) => win.fetch(u, o), now: () => Date.now() });
    const last = {};   // section -> its last data: a section that cannot load keeps it
    // the helix (build-helix.js, three.js): where either is missing the page still works with its cards
    const helix = win.BuildHelix ? win.BuildHelix.mount($('bp-line'), win) : null;
    // the Fuel panel (build-usage.js, BF2): read through this same client, once per refresh; the page works without it
    const usage = win.BuildUsage ? win.BuildUsage.mount(win, client) : null;
    let timer = 0, busy = null;

    const el = (tag, cls, text) => PT.el(doc, tag, cls, text);   // (0.3.3 SG1) page-toast.js, its one place
    const when = (ms) => { const t = el('time', 'bp-when', ago(ms, Date.now())); t.dateTime = new Date(ms).toISOString(); t.dataset.ts = String(ms); t.title = new Date(ms).toLocaleString(); return t; };
    const link = (href, text) => { const a = el('a', 'bp-link', text); if (/^https:\/\/github\.com\//.test(href)) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; } return a; };
    const pill = (result) => el('span', 'bp-pill bp-' + result, { queued: 'queued', running: 'in progress', green: 'green', red: 'red', other: 'ended' }[result] || result);
    const light = (status) => el('span', 'bp-pill bp-' + status, { running: 'running', red: 'red', green: 'done', stopped: 'stopped', idle: 'idle' }[status] || status);
    const dur = (s) => (s >= 3600 ? Math.floor(s / 3600) + ' h ' + Math.round((s % 3600) / 60) + ' min' : s >= 60 ? Math.floor(s / 60) + ' min ' + (s % 60) + ' s' : s + ' s');
    const fill = (id, nodes, empty) => { const box = $(id); box.replaceChildren(...(nodes.length ? nodes : [el('li', 'bp-empty', empty)])); };
    const note = (id, text) => { const n = $(id); n.textContent = text || ''; n.hidden = !text; };
    const live = (r) => r && !r.done;
    const extras = (r) => (r && r.result === 'running' ? [el('span', 'bp-bar')] : []);

    const drawBuilders = (list, notes, now) => {
      fill('bp-builders', list.map((b) => {
        const st = notes[b.branch] || '', status = statusOf(b, st, now);
        const row = el('li', 'bp-row' + (live(b.run) ? ' bp-live' : '')), top = el('div', 'bp-top');
        top.append(el('span', 'bp-code', b.code), light(status), el('span', 'bp-branch', b.branch));
        const line = el('div', 'bp-msg'); line.append(el('span', 'bp-text', b.message || '(no message)'), when(b.time));
        const tele = el('div', 'bp-tele'); tele.append(el('span', null, 'last push ' + ago(b.time, now)), el('span', null, 'CI '), el('span', null, st ? 'note: ' + st : 'note: -'));
        tele.children[1].append(b.run ? pill(b.run.result) : el('span', 'bp-dim', 'no run yet'));
        row.append(...extras(b.run), top, line, tele);
        if (b.run) { const r = el('div', 'bp-run'); r.append(el('span', 'bp-sha', b.run.sha), link(b.run.url, 'tests')); row.append(r); }
        return row;
      }), 'No builder has pushed in the last 24 hours.');
    };
    const drawCi = (rows) => fill('bp-ci', rows.map((r) => {
      const row = el('li', 'bp-row' + (r.done ? '' : ' bp-live')), top = el('div', 'bp-top');
      top.append(pill(r.result), el('span', 'bp-branch', r.branch), el('span', 'bp-sha', r.sha));
      const line = el('div', 'bp-msg'); line.append(el('span', 'bp-text', (r.done ? 'ran ' : 'running ') + dur(r.seconds)), when(r.started), link(r.url, 'open the run'));
      row.append(...extras(r), top, line); return row;
    }), 'No tests.yml run in the last 3 hours.');
    const drawMerges = (m) => {
      fill('bp-merges', m.merges.map((c) => { const row = el('li', 'bp-row'), line = el('div', 'bp-msg'); line.append(el('span', 'bp-text', c.message), when(c.time)); row.append(line); return row; }), 'No merge in the last 24 hours.');
      const h = $('bp-head'); h.replaceChildren();
      if (m.head) { h.append(el('span', 'bp-sha', m.head.sha), el('span', 'bp-dim', ' tests: ')); h.append(m.head.run ? pill(m.head.run.result) : el('span', 'bp-dim', 'no run on this commit')); if (m.head.run) h.append(link(m.head.run.url, ' open')); }
    };
    const drawRelease = (rel) => { $('bp-release').textContent = rel.text; $('bp-release').classList.toggle('bp-pending', rel.inProgress); };
    const drawLine = (mod) => {
      const n = (id, v) => { $(id).textContent = String(v); };
      n('bp-n-running', mod.running); n('bp-n-red', mod.red); n('bp-n-done', mod.done); n('bp-n-merged', mod.merged); n('bp-n-open', mod.open);
      $('bp-line').classList.toggle('bp-moving', !!mod.moving);
      if (helix) helix.set(win.BuildHelix.helixModel(mod.items, mod.mergeList, Date.now()));
    };

    // ---- one refresh: at most 5 API calls; the notes and package.json come from raw.githubusercontent.com
    const refresh = async () => {
      if (busy) return busy;
      busy = (async () => {
        if (client.blocked()) { status(); return; }
        // soft: a 404 is "not there" (no release yet), not a failure
        const ask = async (key, path, opts) => { try { const r = await client.get(path, opts); last[key] = r.data; delete last[key + 'Err']; return r.data; } catch (e) { if (e.limited) throw e; if (opts && opts.soft && e.status === 404) { last[key] = null; delete last[key + 'Err']; return null; } last[key + 'Err'] = e.message; return last[key]; } };
        const usageDone = usage ? usage.refresh() : null;   // alongside the page's own reads; it never throws
        try {
          const branches = await ask('branches', API + '/branches?per_page=100');
          const found = newestVersion(branches) || last.found;
          if (found) last.found = found;
          const runs = await ask('runs', API + '/actions/workflows/tests.yml/runs?per_page=100');
          // no `since` in the address: it stays the same, so its ETag works (mergesOf keeps the last 24 h)
          const commits = found ? await ask('commits', API + '/commits?sha=' + encodeURIComponent(found.branch) + '&per_page=60') : null;
          const latest = await ask('latest', REL_API + '/releases/latest', { soft: true });
          // the branches by their latest commit: one lookup per job branch whose head is new to us (a commit never changes, so
          // it is read once per sha; the branch list itself is a cheap 304 while nothing moved). The Events feed lags by hours.
          const heads = last.heads || (last.heads = new Map());
          const jobs = (Array.isArray(branches) ? branches : []).filter((b) => b && b.commit && found && jobCode(b.name, found.version)).slice(0, 80);
          const todo = jobs.filter((b) => !heads.has(b.commit.sha)).slice(0, MAX_LOOKUPS);
          let failed = 0;
          for (let i = 0; i < todo.length; i += 8) {
            if (client.state.remaining != null && client.state.remaining < KEEP_CALLS) break;
            await Promise.all(todo.slice(i, i + 8).map(async (b) => {
              try { const c = (await client.get(API + '/commits?sha=' + encodeURIComponent(b.commit.sha) + '&per_page=1')).data[0]; heads.set(b.commit.sha, { message: c && c.commit && c.commit.message, time: stamp(c && c.commit && (c.commit.committer || c.commit.author || {}).date) }); }
              catch (e) { if (e.limited) throw e; failed++; }
            }));
          }
          last.lookupsFailed = failed;
          const now = Date.now();
          let pkg = last.pkg;
          if (found) { try { pkg = JSON.parse((await client.get(RAW + esc(found.branch) + '/mcp/package.json', { raw: true })).data); last.pkg = pkg; } catch (e) { if (e.limited) throw e; } }
          const builders = found ? buildersOf({ heads: jobs.filter((b) => heads.has(b.commit.sha)).map((b) => ({ branch: b.name, sha: b.commit.sha, message: heads.get(b.commit.sha).message, time: heads.get(b.commit.sha).time })), runs, version: found.version, now }) : [];
          const notes = last.notes || (last.notes = {});
          // a note that is not there (404) is "-", never a failure
          await Promise.all(builders.map(async (b) => { try { notes[b.branch] = stateOf((await client.get(RAW + esc(b.branch) + '/mcp/work/' + esc(b.code) + '.md', { raw: true })).data); } catch (e) { if (e.limited) throw e; if (e.status === 404) notes[b.branch] = ''; } }));
          const ci = ciRows(runs, now), merges = mergesOf(commits, now);
          const headSha = commits && commits[0] && commits[0].sha, headRun = headSha && runsOf(runs).find((r) => r.head_sha === headSha);
          if (usageDone) await usageDone;
          // (0.3.3 RL33) for the helix's replay: a job's first known event (its earliest tests.yml run in the list, else its last push)
          const firstRun = {}; for (const r of runsOf(runs)) { const t = stamp(r && (r.run_started_at || r.created_at)); if (t && r.head_branch && (!firstRun[r.head_branch] || t < firstRun[r.head_branch])) firstRun[r.head_branch] = t; }
          const sats = builders.map((b) => ({ code: b.code, cost: usage ? usage.costOf(b.code) : null, started: Math.min(b.time, firstRun[b.branch] || b.time), costText: usage && usage.costOf(b.code) != null ? usage.fmtUsd(usage.costOf(b.code)) : '', status: statusOf(b, notes[b.branch], now), message: b.message, time: b.time, note: notes[b.branch] || '',
            ci: b.run ? { queued: 'queued', running: 'in progress', green: 'green', red: 'red', other: 'ended' }[b.run.result] : '' }));
          drawBuilders(builders, notes, now); drawCi(ci);
          drawMerges({ merges, head: headSha ? { sha: short(headSha), run: headRun ? runInfo(headRun) : null } : null });
          drawRelease(releaseLine(pkg, latest));
          const count = (k) => sats.filter((s) => s.status === k).length;
          drawLine({ running: count('running'), red: count('red'), done: count('green'), merged: merges.length, open: builders.length, mergeList: merges, items: sats,
            moving: builders.some((b) => live(b.run)) || ci.some((r) => !r.done) });
          const bad = ['branches', 'runs', 'commits', 'latest'].filter((k) => last[k + 'Err']).concat(last.lookupsFailed ? ['some commits'] : []);
          note('bp-warn', bad.length ? 'Could not load ' + bad.join(', ') + ' just now: showing the last data.' : '');
          $('bp-updated').textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch (e) {
          if (!e.limited) { note('bp-warn', 'Could not reach GitHub just now: showing the last data.'); }
        }
        status();
      })().finally(() => { busy = null; });
      return busy;
    };
    const status = () => {
      const s = client.state;
      if (client.blocked()) note('bp-limit', 'GitHub asks us to wait until ' + hhmm(s.blockedUntil) + '.');
      else if (client.slow()) note('bp-limit', 'GitHub allows few requests to your browser right now (' + s.remaining + ' left this hour): refreshing every 10 minutes.');
      else note('bp-limit', '');
    };
    const schedule = () => {
      win.clearTimeout(timer);
      if (doc.hidden) return;
      const wait = client.blocked() ? Math.max(1000, client.state.blockedUntil - Date.now() + 1000) : client.nextIn();
      timer = win.setTimeout(() => refresh().then(schedule), wait);
    };
    win.BuildPage.helix = helix;
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) win.clearTimeout(timer); else refresh().then(schedule); });
    win.setInterval(() => doc.querySelectorAll('time[data-ts]').forEach((t) => { t.textContent = ago(+t.dataset.ts, Date.now()); }), 30000);
    win.BuildPage.refresh = refresh;
    refresh().then(schedule);
  };

  return { REPO, EVERY, SLOW_EVERY, ago, jobCode, stateOf, newestVersion, resultOf, statusOf, buildersOf, ciRows, mergesOf, releaseLine, createClient, start };
}));
