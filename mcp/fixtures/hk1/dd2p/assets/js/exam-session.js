/*
 * DataArcus practice exams: the timed mock exam's state machine and its draw (0.3.2 SP34, out of dp600-sim.js).
 * No DOM. The clock, the random source and the storage are passed in, so the same inputs always give the same mock.
 *
 * Interface:
 *   shuffle(list, rand)      Out: a shuffled copy (Fisher-Yates, rand() in [0, 1)).
 *   newInst(q, rand)         A question as asked: { id, perm (the options' order; yes/no keeps its rows), r (no response) }.
 *   lengths(renewal)         The mock lengths: { full, half, quick, renewal? }, each { n (questions), cs (case studies),
 *                            min (minutes) }; renewal ({ n, min }) adds the renewal check.
 *   pickMock(cfg, x)         cfg: a length; x: { questions, cases, domains (key -> { wt }), skills (key -> { d }), mix (area
 *                            -> share, or none), rank (id -> 0 unseen, 1 wrong, 2 right), rand }. Out: { ids, caseId }:
 *                            questions per area by the shares (the last area takes the rest), the skills of an area in
 *                            turn, unseen first then wrong; shuffled; a case study's questions after them when cfg.cs.
 *   pickRenewal(n, x)        x: { topics ([{ k, tags }]), questions, rank, rand }. Out: ids, about the same number from
 *                            each renewal skill (the leftover ones to random skills), unseen first, then wrong.
 *   create({ storage, now }) The state machine of the mock in progress. storage: { load() -> the saved mock or null,
 *                            store(mock or null) } (the page's saved progress); now() -> ms. Its events, each saved:
 *     start({ kind, ids, caseId, min }, inst)  inst: id -> a question as asked. Out: the mock { kind, caseId, items,
 *                            flags, i, start, endAt, min }.
 *     current(), running() (one is saved and its time is not up), expired(), clock() -> { left (s), low (< 300 s), up },
 *     flagged(), next(), prev(), move(i), flag() (toggles the question on screen), firstFlagged(), changed() (a choice
 *     was made), used() (seconds used, at most the mock's length), end() (the saved mock removed).
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  const range = (n) => Array.from({ length: n }, (_, i) => i);
  const shuffle = (a, rand) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const newInst = (q, rand) => ({ id: q.id, perm: q.type === 'yesno' ? range(q.opts.length) : shuffle(range(q.opts.length), rand), r: q.type === 'yesno' ? q.opts.map(() => null) : q.type === 'single' ? null : [] });

  const lengths = (renewal) => {
    const MOCKS = {
      full: { n: 44, cs: 1, min: 100 },
      half: { n: 25, cs: 0, min: 50 },
      quick: { n: 10, cs: 0, min: 15 }
    };
    if (renewal) MOCKS.renewal = { n: renewal.n, cs: 0, min: renewal.min };
    return MOCKS;
  };

  // the renewal check's questions: about the same number from each renewal skill (the leftover ones to random skills),
  // unseen questions first, then ones answered wrongly
  const pickRenewal = (n, { topics, questions, rank, rand }) => {
    const pri = (q) => rank(q.id) + rand();
    const base = Math.floor(n / topics.length), extra = shuffle(topics.map((t) => t.k), rand).slice(0, n - base * topics.length);
    return shuffle(topics.flatMap((t) => questions.filter((q) => t.tags.includes(q.tag)).sort((a, b) => pri(a) - pri(b)).slice(0, base + (extra.includes(t.k) ? 1 : 0)).map((q) => q.id)), rand);
  };

  const pickMock = (cfg, { questions, cases, domains, skills, mix, rank, rand }) => {
    const pool = questions.slice();
    // questions per exam area: fixed shares when given, otherwise by the official weights; the last area takes the rest
    const doms = Object.keys(domains), wsum = doms.reduce((a, d) => a + domains[d].wt, 0), want = {};
    doms.slice(0, -1).forEach((d) => { want[d] = Math.round(cfg.n * (mix ? mix[d] : domains[d].wt / wsum)); });
    want[doms[doms.length - 1]] = cfg.n - doms.slice(0, -1).reduce((a, d) => a + want[d], 0);
    // prefer questions the learner has not seen, then ones they got wrong
    const pri = (q) => rank(q.id) + rand();
    let ids = [];
    Object.keys(want).forEach((d) => {
      const sks = Object.keys(skills).filter((s) => skills[s].d === d);
      const bySk = {}; sks.forEach((s) => { bySk[s] = pool.filter((q) => q.s === s).sort((a, b) => pri(a) - pri(b)); });
      let k = 0; const picked = [];
      while (picked.length < want[d]) { const s = sks[k++ % sks.length]; if (bySk[s].length) picked.push(bySk[s].shift().id); else if (sks.every((x) => !bySk[x].length)) break; }
      ids = ids.concat(picked);
    });
    ids = shuffle(ids, rand);
    let caseId = null;
    if (cfg.cs) { const c = cases[Math.floor(rand() * cases.length)]; caseId = c.id; ids = ids.concat(c.questions.map((q) => q.id)); }
    return { ids, caseId };
  };

  const create = ({ storage, now }) => {
    const M = () => storage.load();
    const save = () => storage.store(storage.load());
    return {
      current: M,
      start: ({ kind, ids, caseId, min }, inst) => {
        const mock = { kind, caseId, items: ids.map(inst), flags: [], i: 0, start: now(), endAt: now() + min * 60000, min };
        storage.store(mock);
        return mock;
      },
      running: () => !!(M() && M().endAt > now()),
      expired: () => now() >= M().endAt,
      clock: () => { const left = (M().endAt - now()) / 1000; return { left, low: left < 300, up: left <= 0 }; },
      flagged: () => M().flags.includes(M().i),
      next: () => { M().i++; save(); },
      prev: () => { M().i--; save(); },
      move: (i) => { M().i = i; save(); },
      flag: () => { const m = M(); m.flags = m.flags.includes(m.i) ? m.flags.filter((x) => x !== m.i) : m.flags.concat(m.i); save(); },
      firstFlagged: () => { const m = M(); m.i = m.flags.slice().sort((a, b) => a - b)[0]; save(); },
      changed: save,
      used: () => { const m = M(); return Math.min(m.min * 60, Math.round((now() - m.start) / 1000)); },
      end: () => storage.store(null)
    };
  };

  const api = { shuffle, newInst, lengths, pickMock, pickRenewal, create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAExamSession = api;
})(typeof self !== 'undefined' ? self : this);
