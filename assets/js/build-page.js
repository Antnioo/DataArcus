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
 *   buildersOf({ events, runs, version, now })   branches at work: a push in the last 24 h, newest first, each with
 *                             its latest tests.yml run
 *   ciRows(runs, now)         runs in progress or finished in the last 3 h
 *   mergesOf(commits, now)    "Merge ..." commits of the last 24 h (a builder's own "Merge origin/..." left out)
 *   releaseLine(pkg, latest)  { text, inProgress }: the version on integration against the latest release
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

  const REPO = 'Antnioo/DataArcus';
  const API = 'https://api.github.com/repos/' + REPO;
  const RAW = 'https://raw.githubusercontent.com/' + REPO + '/';
  const DAY = 864e5, HOUR = 36e5;
  const EVERY = 120000, SLOW_EVERY = 600000, LOW = 10, MAX_BUILDERS = 12;

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

  const buildersOf = ({ events, runs, version, now }) => {
    const out = new Map();
    for (const e of Array.isArray(events) ? events : []) {
      if (!e || e.type !== 'PushEvent' || !e.payload) continue;
      const branch = String(e.payload.ref || '').replace(/^refs\/heads\//, ''), code = jobCode(branch, version), t = stamp(e.created_at);
      if (!code || now - t > DAY || out.has(branch)) continue;   // events come newest first: the first push of a branch is its latest
      const commits = Array.isArray(e.payload.commits) ? e.payload.commits : [];
      const last = commits[commits.length - 1] || {};
      out.set(branch, { branch, code, sha: short(e.payload.head || last.sha), message: firstLine(last.message), time: t, run: null });
    }
    for (const r of runsOf(runs)) {   // runs come newest first: the first run of a branch is its latest
      const b = out.get(r && r.head_branch);
      if (b && !b.run) b.run = runInfo(r);
    }
    return [...out.values()].sort((a, b) => b.time - a.time).slice(0, MAX_BUILDERS);
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
      if (!res.ok) throw new Error('GitHub answered ' + res.status);
      const data = raw ? await res.text() : await res.json();
      cache.set(url, { etag: res.headers.get('etag') || '', data });
      return { data, fresh: true };
    };
    const slow = () => state.remaining != null && state.remaining < LOW;
    return { get, state, slow, blocked: () => state.blockedUntil > now(), nextIn: () => (slow() ? SLOW_EVERY : EVERY) };
  };

  // ------------------------------------------------------------------ the page
  const start = (win) => {
    const doc = win.document;
    const $ = (id) => doc.getElementById(id);
    if (!$('bp-builders')) return;
    const client = createClient({ fetch: (u, o) => win.fetch(u, o), now: () => Date.now() });
    const last = {};   // section -> its last data: a section that cannot load keeps it
    let timer = 0, busy = null;

    const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const when = (ms) => { const t = el('time', 'bp-when', ago(ms, Date.now())); t.dateTime = new Date(ms).toISOString(); t.dataset.ts = String(ms); t.title = new Date(ms).toLocaleString(); return t; };
    const link = (href, text) => { const a = el('a', 'bp-link', text); if (/^https:\/\/github\.com\//.test(href)) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; } return a; };
    const pill = (result) => el('span', 'bp-pill bp-' + result, { queued: 'queued', running: 'in progress', green: 'green', red: 'red', other: 'ended' }[result] || result);
    const dur = (s) => (s >= 3600 ? Math.floor(s / 3600) + ' h ' + Math.round((s % 3600) / 60) + ' min' : s >= 60 ? Math.floor(s / 60) + ' min ' + (s % 60) + ' s' : s + ' s');
    const fill = (id, nodes, empty) => { const box = $(id); box.replaceChildren(...(nodes.length ? nodes : [el('p', 'bp-empty', empty)])); };
    const note = (id, text) => { const n = $(id); n.textContent = text || ''; n.hidden = !text; };
    const runBar = (r) => (r && r.result === 'running' ? el('span', 'bp-bar') : null);

    const drawBuilders = (list, notes) => {
      fill('bp-builders', list.map((b) => {
        const row = el('li', 'bp-row' + (b.run && !b.run.done ? ' bp-live' : '')), top = el('div', 'bp-top');
        top.append(el('span', 'bp-code', b.code), el('span', 'bp-branch', b.branch));
        const st = notes[b.branch];
        if (st) top.append(el('span', 'bp-state', st));
        const line = el('div', 'bp-msg'); line.append(el('span', 'bp-text', b.message || '(no message)'), when(b.time));
        row.append(top, line);
        if (b.run) { const r = el('div', 'bp-run'); r.append(pill(b.run.result), el('span', 'bp-sha', b.run.sha), link(b.run.url, 'tests'), ...[runBar(b.run)].filter(Boolean)); row.append(r); }
        else row.append(el('div', 'bp-run bp-dim', 'no tests run yet'));
        return row;
      }), 'No builder has pushed in the last 24 hours.');
    };
    const drawCi = (rows) => fill('bp-ci', rows.map((r) => {
      const row = el('li', 'bp-row' + (r.done ? '' : ' bp-live')), top = el('div', 'bp-top');
      top.append(pill(r.result), el('span', 'bp-branch', r.branch), el('span', 'bp-sha', r.sha));
      const line = el('div', 'bp-msg'); line.append(el('span', 'bp-text', (r.done ? 'ran ' : 'running ') + dur(r.seconds)), when(r.started), link(r.url, 'open the run'));
      row.append(top, line, ...[runBar(r)].filter(Boolean)); return row;
    }), 'No tests.yml run in the last 3 hours.');
    const drawMerges = (m) => {
      fill('bp-merges', m.merges.map((c) => { const row = el('li', 'bp-row'), line = el('div', 'bp-msg'); line.append(el('span', 'bp-text', c.message), when(c.time)); row.append(line); return row; }), 'No merge in the last 24 hours.');
      const h = $('bp-head'); h.replaceChildren();
      if (m.head) { h.append(el('span', 'bp-sha', m.head.sha), el('span', 'bp-dim', ' tests: ')); h.append(m.head.run ? pill(m.head.run.result) : el('span', 'bp-dim', 'no run on this commit')); if (m.head.run) h.append(link(m.head.run.url, ' open')); }
    };
    const drawRelease = (rel) => { $('bp-release').textContent = rel.text; $('bp-release').classList.toggle('bp-pending', rel.inProgress); };
    const drawLine = (mod) => {
      for (const k of ['branches', 'ci', 'integration', 'release']) { const s = doc.querySelector('[data-station="' + k + '"] .bp-count'); if (s) s.textContent = String(mod[k] == null ? '-' : mod[k]); }
      doc.getElementById('bp-line').classList.toggle('bp-moving', !!mod.moving);
    };

    // ---- one refresh: at most 5 API calls; the notes and package.json come from raw.githubusercontent.com
    const refresh = async () => {
      if (busy) return busy;
      busy = (async () => {
        if (client.blocked()) { status(); return; }
        const ask = async (key, path, opts) => { try { const r = await client.get(path, opts); last[key] = r.data; delete last[key + 'Err']; return r.data; } catch (e) { if (e.limited) throw e; last[key + 'Err'] = e.message; return last[key]; } };
        try {
          const branches = await ask('branches', API + '/branches?per_page=100');
          const found = newestVersion(branches) || last.found;
          if (found) last.found = found;
          const [events, runs] = [await ask('events', API + '/events?per_page=100'), await ask('runs', API + '/actions/workflows/tests.yml/runs?per_page=50')];
          // no `since` in the address: it stays the same, so its ETag works (mergesOf keeps the last 24 h)
          const commits = found ? await ask('commits', API + '/commits?sha=' + encodeURIComponent(found.branch) + '&per_page=60') : null;
          const latest = await ask('latest', API + '/releases/latest');
          const now = Date.now();
          let pkg = last.pkg;
          if (found) { try { pkg = JSON.parse((await client.get(RAW + esc(found.branch) + '/mcp/package.json', { raw: true })).data); last.pkg = pkg; } catch (e) { if (e.limited) throw e; } }
          const builders = found ? buildersOf({ events, runs, version: found.version, now }) : [];
          const notes = last.notes || (last.notes = {});
          await Promise.all(builders.map(async (b) => { try { notes[b.branch] = stateOf((await client.get(RAW + esc(b.branch) + '/mcp/work/' + esc(b.code) + '.md', { raw: true })).data); } catch (e) { if (e.limited) throw e; } }));
          const ci = ciRows(runs, now), merges = mergesOf(commits, now);
          const headSha = commits && commits[0] && commits[0].sha, headRun = headSha && runsOf(runs).find((r) => r.head_sha === headSha);
          drawBuilders(builders, notes); drawCi(ci);
          drawMerges({ merges, head: headSha ? { sha: short(headSha), run: headRun ? runInfo(headRun) : null } : null });
          drawRelease(releaseLine(pkg, latest));
          const live = builders.some((b) => b.run && !b.run.done) || ci.some((r) => !r.done);
          drawLine({ branches: builders.length, ci: ci.filter((r) => !r.done).length, integration: merges.length, release: releaseLine(pkg, latest).inProgress ? 'open' : 'done', moving: live });
          const bad = ['branches', 'events', 'runs', 'commits', 'latest'].filter((k) => last[k + 'Err']);
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
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) win.clearTimeout(timer); else refresh().then(schedule); });
    win.setInterval(() => doc.querySelectorAll('time[data-ts]').forEach((t) => { t.textContent = ago(+t.dataset.ts, Date.now()); }), 30000);
    win.BuildPage.refresh = refresh;
    refresh().then(schedule);
  };

  return { REPO, EVERY, SLOW_EVERY, ago, jobCode, stateOf, newestVersion, resultOf, buildersOf, ciRows, mergesOf, releaseLine, createClient, start };
}));
