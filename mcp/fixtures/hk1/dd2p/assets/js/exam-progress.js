/*
 * DataArcus practice exams: the learner's saved progress and the study plan (0.3.2 SP34, out of dp600-sim.js).
 * No DOM. The storage and the clock are passed in; the progress is one JSON text in the storage.
 *
 * Interface:
 *   learnPages(questions, skills)  Out: skill -> the 3 Microsoft Learn pages its questions cite most ([{ t, u, n }]).
 *   create({ storage, now, questions, domains, skills })
 *     storage: { read() -> the saved text or null, write(text) } (either may throw: private mode reads as nothing and
 *     skips the write); now() -> ms; questions: every question of the bank ({ id, d, s }); domains: area -> { wt };
 *     skills: skill -> { d }. Out: the progress, saved as { ans (id -> { n, c, last, t }), bm (ids), mocks (the last 30
 *     results), days (the last 60 study days, YYYY-MM-DD), mock (the mock in progress, exam-session.js's) }:
 *       state()            the saved object (read only for the caller)
 *       save(), reset()    write it; start again from nothing
 *       today(), markDay(), streak()   the study days, by the UTC date of now()
 *       record(q, ok)      a practice answer: counted, its last result, the day
 *       recordMock(items, res, answered, rec)   a submitted mock: every answered question counted with its credit
 *                          (res[i] === 1 right), the result rec kept, the day marked; saved
 *       isBm(id), toggleBm(id)         bookmarks
 *       rank(id)           0 unseen, 1 last answered wrong, 2 last answered right (the draw's and the practice's order)
 *       stats(list) -> { total, seen, right, acc }; readiness() (0-100, by area weight, accuracy times coverage);
 *       mistakes() (the questions last answered wrong); skillAccuracy() (skill -> accuracy, 0.5 when unseen)
 *       planRows()         the study plan: [{ s, st, k (new, weak, mid, good) }], weakest first
 *       mockStorage        the storage adapter of the mock in progress for exam-session.js ({ load, store })
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';

  // Most-cited Microsoft Learn pages per skill, taken from the question references
  const learnPages = (questions, skills) => {
    const LEARN = {};
    Object.keys(skills).forEach((s) => {
      const cnt = {};
      questions.filter((q) => q.s === s).forEach((q) => (q.ref || []).forEach((r) => { const k = r.u; cnt[k] = cnt[k] || { t: r.t, u: r.u, n: 0 }; cnt[k].n++; }));
      LEARN[s] = Object.values(cnt).sort((a, b) => b.n - a.n).slice(0, 3);
    });
    return LEARN;
  };

  const create = ({ storage, now, questions, domains, skills }) => {
    const ALL = questions;
    const blank = () => ({ ans: {}, bm: [], mocks: [], days: [], mock: null });
    let P;
    try { P = Object.assign(blank(), JSON.parse(storage.read() || '{}')); } catch (e) { P = blank(); }
    const save = () => { try { storage.write(JSON.stringify(P)); } catch (e) { /* private mode */ } };
    const today = () => new Date(now()).toISOString().slice(0, 10);
    const markDay = () => { const t = today(); if (!P.days.includes(t)) { P.days.push(t); P.days = P.days.slice(-60); } };
    const streak = () => {
      const set = new Set(P.days); let n = 0; const d = new Date(now());
      if (!set.has(today())) d.setDate(d.getDate() - 1);
      while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
      return n;
    };
    const record = (q, ok) => {
      const a = P.ans[q.id] || { n: 0, c: 0 };
      a.n++; if (ok) a.c++; a.last = ok ? 1 : 0; a.t = now();
      P.ans[q.id] = a; markDay(); save();
    };
    const recordMock = (items, res, answered, rec) => {
      items.forEach((it, i) => {
        const q = it.q, g = res[i];
        if (answered(q, it.r)) P.ans[q.id] = Object.assign(P.ans[q.id] || { n: 0, c: 0 }, { n: ((P.ans[q.id] || {}).n || 0) + 1, c: ((P.ans[q.id] || {}).c || 0) + (g === 1 ? 1 : 0), last: g === 1 ? 1 : 0, t: now() });
      });
      P.mocks.push(rec); P.mocks = P.mocks.slice(-30);
      markDay(); save();
    };
    const isBm = (id) => P.bm.includes(id);
    const toggleBm = (id) => { P.bm = isBm(id) ? P.bm.filter((x) => x !== id) : P.bm.concat(id); save(); };
    const rank = (id) => (P.ans[id] ? (P.ans[id].last ? 2 : 1) : 0);

    const stats = (list) => {
      let seen = 0, right = 0;
      list.forEach((q) => { const a = P.ans[q.id]; if (a) { seen++; if (a.last) right++; } });
      return { total: list.length, seen, right, acc: seen ? right / seen : 0 };
    };
    const readiness = () => {
      let sum = 0, w = 0;
      Object.keys(domains).forEach((d) => {
        const st = stats(ALL.filter((q) => q.d === d));
        const cover = Math.min(1, st.seen / (st.total * 0.6));
        sum += domains[d].wt * st.acc * cover; w += domains[d].wt;
      });
      return Math.round((sum / w) * 100);
    };
    const mistakes = () => ALL.filter((q) => P.ans[q.id] && !P.ans[q.id].last);
    const skillAccuracy = () => { const acc = {}; Object.keys(skills).forEach((s) => { const st = stats(ALL.filter((q) => q.s === s)); acc[s] = st.seen ? st.acc : 0.5; }); return acc; };
    // the study plan: weakest skills first (never answered before any answered), each with its status
    const planRows = () => Object.keys(skills).map((s) => ({ s, st: stats(ALL.filter((q) => q.s === s)) }))
      .sort((a, b) => (a.st.seen ? a.st.acc : -1 + a.st.seen) - (b.st.seen ? b.st.acc : -1 + b.st.seen))
      .map(({ s, st }) => ({ s, st, k: !st.seen ? 'new' : st.acc < 0.6 ? 'weak' : st.acc < 0.8 ? 'mid' : 'good' }));

    return {
      state: () => P, save, reset: () => { P = blank(); save(); }, today, markDay, streak, record, recordMock, isBm, toggleBm, rank,
      stats, readiness, mistakes, skillAccuracy, planRows,
      mockStorage: { load: () => P.mock, store: (m) => { P.mock = m; save(); } }
    };
  };

  const api = { learnPages, create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAExamProgress = api;
})(typeof self !== 'undefined' ? self : this);
