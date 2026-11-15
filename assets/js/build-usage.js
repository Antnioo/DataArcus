/*
 * DataArcus build page, the "Fuel" panel (0.3.2 BF2, B-399, D-1108-15): what the builders and workers used, read from
 * usage.json (version 1) on the public build-data branch, in the visitor's browser. It reads through the page's one reader
 * (build-page.js createClient: the ETag cache and the rate-limit state), never a fetch of its own. Only GET, no token.
 *
 * Interface (pure core, runs in the browser and in Node; mount runs only where there is a document):
 *   URL                          raw.githubusercontent.com/Antnioo/DataArcus/build-data/usage.json
 *   validate(data)               { ok, message }: version 1 with today and days, else the words the panel shows
 *   fmtUsd(n, locale?)           "$12.34" (two decimals, the visitor's grouping); "-" for a non-number
 *   fmtMillions(n, locale?)      tokens in millions: "346.2M"; "-" for a non-number
 *   dayBars(days, height)        [{ date, cost, tokens, sessions, h }]: h in 0..height, the costliest day full height
 *   costById(jobs)               { JOBCODE: cost_usd } from the finished jobs
 *   mount(win, client)           draws the panel (#bu-panel); -> { refresh(), costOf(code) } or null where there is no panel
 * Every text from the file is shown with textContent, never as HTML. Only the fields of version 1 are read.
 * (c) DataArcus. All rights reserved.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BuildUsage = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // (0.3.3 SG1) the page helpers (an element with its class and text): page-toast.js, loaded before this file on the page
  const PT = typeof module === 'object' && module.exports ? require('./page-toast.js') : self.DAPageToast;

  const URL_ = 'https://raw.githubusercontent.com/Antnioo/DataArcus/build-data/usage.json';
  const VERSION = 1, MAX_JOBS = 8, MAX_TOP = 5, MAX_DAYS = 14;
  const GONE = 'Usage numbers are not available right now.';
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
  const str = (v, n) => String(v == null ? '' : v).slice(0, n || 200);

  const fmtUsd = (n, locale) => (isNum(n) ? '$' + new Intl.NumberFormat(locale || [], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) : '-');
  const fmtMillions = (n, locale) => (isNum(n) ? new Intl.NumberFormat(locale || [], { maximumFractionDigits: 1 }).format(n / 1e6) + 'M' : '-');

  const validate = (d) => {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return { ok: false, message: GONE };
    if (d.version !== VERSION) return { ok: false, message: 'This page reads usage version ' + VERSION + '; the file says ' + str(d.version, 20) + '.' };
    if (!d.today || typeof d.today !== 'object' || !Array.isArray(d.days)) return { ok: false, message: GONE };
    return { ok: true, message: '' };
  };

  const dayBars = (days, height) => {
    const list = (Array.isArray(days) ? days : []).slice(-MAX_DAYS).map((r) => ({ date: str(r && r.date, 10), cost: num(r && r.cost_usd), tokens: num(r && r.tokens), sessions: num(r && r.sessions) }));
    const max = Math.max(0, ...list.map((r) => r.cost));
    return list.map((r) => ({ ...r, h: max > 0 ? (r.cost / max) * height : 0 }));
  };

  const costById = (jobs) => {
    const out = {};
    for (const j of Array.isArray(jobs) ? jobs : []) if (j && typeof j.id === 'string' && isNum(j.cost_usd)) out[j.id.toUpperCase()] = j.cost_usd;
    return out;
  };

  const KINDS = ['builder', 'worker', 'probe', 'other'];
  const cap = (s) => str(s, 40).replace(/^./, (c) => c.toUpperCase());

  const mount = (win, client) => {
    const doc = win.document, $ = (id) => doc.getElementById(id);
    if (!$('bu-panel')) return null;
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, cls, text) => PT.el(doc, tag, cls, text);   // (0.3.3 SG1) page-toast.js, its one place
    const mk = (tag, attrs) => { const e = doc.createElementNS(NS, tag); for (const k of Object.keys(attrs || {})) e.setAttribute(k, attrs[k]); return e; };
    let costs = {}, shown = null;

    const say = (text) => { const s = $('bu-status'); s.textContent = text || ''; s.hidden = !text; };
    const clear = () => {
      for (const id of ['bu-kinds', 'bu-models', 'bu-jobs', 'bu-top', 'bu-chart']) $(id).replaceChildren();
      $('bu-cost').textContent = '-'; $('bu-tokens').textContent = '-'; $('bu-updated').textContent = '';
      costs = {};
    };
    const row = (name, cost, extra) => { const li = el('li', 'bu-row'); li.append(el('span', 'bu-name', name), el('span', 'bu-val', cost)); if (extra) li.append(el('span', 'bu-dim', extra)); return li; };
    const sessions = (n) => num(n) + (num(n) === 1 ? ' session' : ' sessions');

    const chart = (days) => {
      const bars = dayBars(days, 110), W = 560, slot = W / Math.max(1, bars.length), base = 130;
      const svg = mk('svg', { viewBox: '0 0 ' + W + ' 156', role: 'img', 'aria-label': 'Cost per day, last ' + bars.length + ' days', class: 'bu-svg' });
      svg.append(mk('line', { x1: 0, y1: base + 0.5, x2: W, y2: base + 0.5, class: 'bu-axis' }));
      bars.forEach((b, i) => {
        const x = i * slot + slot * 0.15, w = slot * 0.7;
        svg.append(mk('rect', { x: x.toFixed(1), y: 20, width: w.toFixed(1), height: 110, rx: 4, class: 'bu-track' }));
        const r = mk('rect', { x: x.toFixed(1), y: (base - b.h).toFixed(1), width: w.toFixed(1), height: b.h.toFixed(1), rx: 4, 'data-day': b.date, class: 'bu-bar' });
        const t = mk('title'); t.textContent = b.date + ': ' + fmtUsd(b.cost) + ', ' + fmtMillions(b.tokens) + ' tokens, ' + sessions(b.sessions); r.append(t);
        svg.append(r);
        if (i === 0 || i === bars.length - 1 || i === Math.floor(bars.length / 2)) {
          const first = i === 0, lastBar = i === bars.length - 1;
          const l = mk('text', { x: (first ? x : lastBar ? x + w : x + w / 2).toFixed(1), y: 148, 'text-anchor': first ? 'start' : lastBar ? 'end' : 'middle', class: 'bu-tick' });
          l.textContent = b.date.slice(5); svg.append(l);
        }
      });
      $('bu-chart').replaceChildren(svg);
    };

    const draw = (d) => {
      const t = d.today;
      $('bu-cost').textContent = fmtUsd(num(t.cost_usd));
      $('bu-tokens').textContent = fmtMillions(num(t.tokens));
      const by = t.by_kind && typeof t.by_kind === 'object' ? t.by_kind : {};
      const kinds = KINDS.filter((k) => k !== 'other' || (by.other && (num(by.other.cost_usd) || num(by.other.count))));
      $('bu-kinds').replaceChildren(...kinds.map((k) => row(cap(k + 's'), fmtUsd(num(by[k] && by[k].cost_usd)), sessions(by[k] && by[k].count))));
      const bm = t.by_model && typeof t.by_model === 'object' ? t.by_model : {};
      $('bu-models').replaceChildren(...Object.keys(bm).sort((a, b) => num(bm[b] && bm[b].cost_usd) - num(bm[a] && bm[a].cost_usd)).slice(0, 8)
        .map((k) => row(cap(k), fmtUsd(num(bm[k] && bm[k].cost_usd)), sessions(bm[k] && bm[k].count))));
      chart(d.days);
      const jobs = (Array.isArray(d.jobs) ? d.jobs : []).slice(0, MAX_JOBS);
      $('bu-jobs').replaceChildren(...jobs.map((j) => {
        const li = el('li', 'bu-job'), top = el('div', 'bu-top');
        top.append(el('span', 'bu-code', str(j && j.id, 20)), el('span', 'bu-val', fmtUsd(num(j && j.cost_usd))), el('span', 'bu-dim', num(j && j.minutes) + ' min'), el('span', 'bu-dim', fmtMillions(num(j && j.tokens)) + ' tokens'));
        if (j && j.model) top.append(el('span', 'bu-chip', str(j.model, 20)));
        li.append(top, el('div', 'bu-title', str(j && j.title, 200)));
        return li;
      }));
      $('bu-top').replaceChildren(...(Array.isArray(d.top) ? d.top : []).slice(0, MAX_TOP).map((s) => row(str(s && s.label, 80), fmtUsd(num(s && s.cost_usd)), str(s && s.kind, 20))));
      costs = costById(d.jobs);
      const at = Date.parse(str(d.generated_at, 30));
      $('bu-updated').textContent = Number.isFinite(at) ? 'Updated ' + new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    };

    // one read per page refresh, through the page's reader; a failure never reaches the rest of the page
    const refresh = async () => {
      try {
        const r = await client.get(URL_, { raw: true });
        if (!r.fresh && shown === r.data) return;
        let data = null;
        try { data = JSON.parse(r.data); } catch (e) { data = null; }
        const v = validate(data);
        shown = r.data;
        if (!v.ok) { clear(); say(v.message); return; }
        say(''); draw(data);
      } catch (e) {
        if (e && e.limited) return;   // the page says it; the last numbers stay
        if (e && e.status === 404) { shown = null; clear(); say(GONE); return; }
        if (shown == null) { clear(); say(GONE); }
      }
    };
    return { refresh, costOf: (code) => (Object.prototype.hasOwnProperty.call(costs, code) ? costs[code] : null), fmtUsd };
  };

  return { URL: URL_, validate, fmtUsd, fmtMillions, dayBars, costById, mount };
}));
