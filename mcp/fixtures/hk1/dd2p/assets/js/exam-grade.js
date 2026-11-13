/*
 * DataArcus practice exams: grading (0.3.2 SP34, out of dp600-sim.js).
 * Pure JavaScript, no DOM, no state, no storage, no clock, no random: answers in, score out.
 *
 * Interface (one input, one output per function):
 *   grade(q, r)       q: a question ({ type: single | multi | yesno | order, ans, n }); r: the learner's response (an
 *                     option index, a list of indexes, or a list of true / false / null). Out: 0 to 1. Multi and yes/no
 *                     give partial credit, order is all or nothing, no response is 0.
 *   answered(q, r)    Out: whether r is a complete response (single: a number; multi: q.n picked; yes/no: every row;
 *                     order: at least one step).
 *   scoreMock(items, byId, { domains, renTopic, renewal })
 *                     items: the mock's [{ id, r }]; byId: id -> question ({ d, s, tag, type, ... }); domains: the exam
 *                     areas' keys in order; renTopic: a bank tag -> its renewal skill; renewal: true for a renewal check.
 *                     Out: { res (each item's credit, in order), score (out of 1000), dom (area -> [credit, count], every
 *                     area), sk (skill -> [credit, count], in the order met), ren (renewal skill -> [credit, count]) }.
 *                     An unanswered multi or yes/no still earns what it holds; any other unanswered question 0.
 *   tallySession(items, checked, byId)
 *                     A practice session: items [{ id }], checked: index -> credit of the questions checked.
 *                     Out: { n (checked), right (full credit), bySkill, byDom (key -> [right, checked], in the order met) }.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';

  // Returns a value between 0 and 1. Multi and yes/no give partial credit, order is all or nothing.
  const grade = (q, r) => {
    if (r == null) return 0;
    if (q.type === 'single') return r === q.ans ? 1 : 0;
    if (q.type === 'multi') { if (!r.length) return 0; const hit = r.filter((i) => q.ans.includes(i)).length, miss = r.length - hit; return Math.max(0, (hit - miss) / q.n); }
    if (q.type === 'yesno') { let k = 0; q.ans.forEach((v, i) => { if (r[i] === v) k++; }); return k / q.ans.length; }
    if (q.type === 'order') return r.length === q.ans.length && r.every((v, i) => v === q.ans[i]) ? 1 : 0;
    return 0;
  };
  const answered = (q, r) => {
    if (r == null) return false;
    if (q.type === 'single') return typeof r === 'number';
    if (q.type === 'multi') return r.length === q.n;
    if (q.type === 'yesno') return r.every((v) => v === true || v === false);
    if (q.type === 'order') return r.length > 0;
    return false;
  };

  // a submitted mock exam: each question's credit, the score out of 1000 and the tallies by area, skill and renewal skill
  const scoreMock = (items, byId, { domains, renTopic, renewal }) => {
    const dom = {}, sk = {}, ren = {}; domains.forEach((d) => { dom[d] = [0, 0]; });
    let pts = 0;
    const res = items.map((it) => {
      const q = byId[it.id], g = answered(q, it.r) || q.type === 'multi' || q.type === 'yesno' ? grade(q, it.r) : 0;
      pts += g; dom[q.d][0] += g; dom[q.d][1]++;
      sk[q.s] = sk[q.s] || [0, 0]; sk[q.s][0] += g; sk[q.s][1]++;
      if (renewal && renTopic[q.tag]) { const k = renTopic[q.tag]; ren[k] = ren[k] || [0, 0]; ren[k][0] += g; ren[k][1]++; }
      return g;
    });
    return { res, score: Math.round((pts / items.length) * 1000), dom, sk, ren };
  };

  // a practice session's summary: the questions checked, the ones fully right, by skill and by exam area
  const tallySession = (items, checked, byId) => {
    const n = Object.keys(checked).length, right = Object.values(checked).filter((g) => g === 1).length;
    const bySkill = {}, byDom = {};
    items.forEach((inst, i) => { if (checked[i] == null) return; const q = byId[inst.id], s = q.s; bySkill[s] = bySkill[s] || [0, 0]; bySkill[s][1]++; if (checked[i] === 1) bySkill[s][0]++;
      byDom[q.d] = byDom[q.d] || [0, 0]; byDom[q.d][1]++; if (checked[i] === 1) byDom[q.d][0]++; });
    return { n, right, bySkill, byDom };
  };

  const api = { grade, answered, scoreMock, tallySession };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAExamGrade = api;
})(typeof self !== 'undefined' ? self : this);
