// 0.3.2 SP34 (the split, finish: dp600-sim.js -> exam-grade.js, exam-session.js, exam-progress.js, exam-view.js;
// mcp/work/SP34.md): both practice exams (DP-600 and PL-300), EN and AR, driven through 13 made-up inputs in a browser
// with a fixed clock and a seeded Math.random (reseeded before every action). Each step records the sha256 of the
// exam's HTML (#dpApp), the outline note, the saved progress, the analytics events, an open dialog, the toast's text,
// the windows opened and the exam's classes. Only hashes and step names are stored or printed: no question-bank content.
// Recorded on the base (integration/0.3.2 2f02348) in fixtures/sp34-exam.json; SP34_RECORD=1 records again (only on the
// base, never to make a run pass).
//   S1  empty home                       S8  study plan, practice a skill
//   S2  made-up progress: home, mistakes, bookmarks
//   S3  corrupt and partial saved progress
//   S4  practice: chips, check, skip, next, summary
//   S5  weakest first                    S9  quick mock: flags, review grid, submit, results filters, review, share
//   S6  every question type (multi over-select, order up/down/remove, yes/no)
//   S7  a case study                     S10 full mock: the weighted pick and the case, the last question
//   S11 the timer: ticks, low time, reload restart, resume, the replace dialog, time up (resumed and while open)
//   S12 renewal check: setup, pick, results by renewal skill, retake
//   S13 deep links, keyboard, language switch mid-mock, reset
//   C1  every recorded step was seen     E1  no page error
//   (after a move) M1 each new module under 600 lines with its interface at its top (dp600-sim.js too once exam-view.js
//   exists); M2 each page asks for the modules that exist, in order, before dp600-sim; M3 exam-grade.js in Node.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { visitor } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..');
const GOLD = path.join(HERE, 'fixtures', 'sp34-exam.json');
const sha = (t) => crypto.createHash('sha256').update(String(t)).digest('hex').slice(0, 16);
const MODS = ['exam-grade', 'exam-session', 'exam-progress', 'exam-view'];
const T0 = Date.parse('2026-11-04T09:00:00Z'), MIN = 60000, DAY = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const EXAMS = [['dp-600', 'dataarcus-dp600-v1', 'DP600'], ['pl-300', 'dataarcus-pl300-v1', 'PL300']];

// made-up saved progress, built in the page from the bank's own ids (by position: no content)
function progress(bank, T0, days) {
  const B = window[bank], all = B.q.concat(B.cases.flatMap((c) => c.questions)), ans = {};
  all.forEach((q, i) => { if (i % 3 === 0) ans[q.id] = { n: 1 + (i % 4), c: i % 2, last: (i / 3) % 2 ? 0 : 1, t: T0 - i * 60000 }; });
  return { ans, bm: [all[1].id, all[5].id, all[9].id], days,
    mocks: [620, 700, 755, 680, 810].map((s, k) => ({ t: T0 - (k + 1) * 86400000, kind: 'full', score: s, pass: s >= 700, n: 50, used: 3000 - k * 60, dom: {}, sk: {} })), mock: null };
}
// one of each question type, bookmarked
function everyType(bank) {
  const B = window[bank], all = B.q;
  return { ans: {}, mocks: [], days: [], mock: null, bm: ['single', 'multi', 'yesno', 'order'].map((t) => all.find((q) => q.type === t)).filter(Boolean).map((q) => q.id) };
}
// answers the question on screen: right, or wrong in a fixed way (as scripts/tests/tools.mjs does)
function answer({ bank, right }) {
  const B = window[bank], el = document.querySelector('.dp-q'), q = B.q.concat(B.cases.flatMap((c) => c.questions)).find((x) => x.id === el.dataset.qid);
  const click = (sel) => document.querySelector('.dp-q ' + sel).click();
  if (q.type === 'single') click(`[data-opt="${right ? q.ans : (q.ans + 1) % q.opts.length}"]`);
  else if (q.type === 'multi') (right ? q.ans : [q.opts.findIndex((_, i) => !q.ans.includes(i)), ...q.ans.slice(1)]).forEach((i) => click(`[data-opt="${i}"]`));
  else if (q.type === 'yesno') q.ans.forEach((a, i) => click(`[data-yn="${i}"][data-v="${(right ? a : !a) ? 1 : 0}"]`));
  else if (q.type === 'order') (right ? q.ans : q.ans.slice().reverse()).forEach((i) => click(`[data-add="${i}"]`));
}
// every control of the question on screen, in a fixed order
function workout({ bank }) {
  const B = window[bank], el = document.querySelector('.dp-q'), q = B.q.concat(B.cases.flatMap((c) => c.questions)).find((x) => x.id === el.dataset.qid);
  const all = (sel) => [...document.querySelectorAll('.dp-q ' + sel)], one = (sel) => { const b = document.querySelector('.dp-q ' + sel); if (b) b.click(); };
  if (q.type === 'single') { one('[data-opt]'); all('[data-opt]')[1].click(); }
  else if (q.type === 'multi') { for (let k = 0; k <= q.opts.length; k++) { const b = all('[data-opt]')[k % q.opts.length]; if (b) b.click(); } }
  else if (q.type === 'yesno') q.opts.forEach((_, i) => one(`[data-yn="${i}"][data-v="${i % 2}"]`));
  else if (q.type === 'order') {
    while (all('[data-add]').length) all('[data-add]').pop().click();
    one('[data-up="1"]'); one('[data-down="0"]'); one('[data-rm="0"]');
    while (all('[data-add]').length) all('[data-add]')[0].click();
  }
}

async function drive(browser, url, [exam, store, bank], lang, rec, errors, asked) {
  const v = await visitor(browser, { viewport: [1440, 900] });
  await v.ctx.addInitScript(() => {
    let s = 1;
    window.__seed = (n) => { s = n >>> 0; };
    Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    window.__ev = []; window.__opened = [];
    Object.defineProperty(window, 'dataArcusTrack', { configurable: true, get: () => (n, p) => window.__ev.push([n, p]), set: () => {} });
    window.open = (u) => { window.__opened.push(String(u)); return null; };
  });
  // the outline's "checked" day is the weekly bot's, and the exam's note prints it: the run reads the day the fixtures were recorded
  // with (2 Nov), so a Monday data PR never turns the home steps red (10 Nov: the 9 Nov bot PR did)
  await v.ctx.route(/\/assets\/data\/(dp600|pl300)-outline\.json/, async (rt) => { const r = await rt.fetch(); const j = await r.json(); j.checked = '2026-11-02'; await rt.fulfill({ response: r, json: j }); });
  v.ctx.on('request', (r) => { const m = /\/(exam-grade|exam-session|exam-progress|exam-view|dp600-sim)\.min\.js/.exec(r.url()); if (m && !asked.includes(m[1])) asked.push(m[1]); });
  const pg = v.pg, base = `${url}/tools/${exam}-practice-exam.html?lang=${lang}`;
  let scen = '', step = 0, act = 0;
  const outline = () => pg.waitForFunction(() => document.getElementById('dpOutline').textContent.trim().length > 0, null, { timeout: 15000 });
  const snap = async (label) => {
    const s = await pg.evaluate((store) => {
      const t = document.getElementById('dpToast'), m = document.querySelector('.dp-modal');
      return { app: document.getElementById('dpApp').innerHTML, out: document.getElementById('dpOutline').innerHTML, store: localStorage.getItem(store),
        ev: JSON.stringify(window.__ev), modal: m ? m.innerHTML : '', toast: t ? t.textContent : '', opened: JSON.stringify(window.__opened), cls: document.getElementById('dpApp').className };
    }, store);
    const key = `${exam} ${lang} ${scen}.${String(++step).padStart(2, '0')} ${label}`;
    rec[key] = Object.fromEntries(Object.entries(s).map(([k, x]) => [k, sha(x)]));
  };
  // every action reseeds Math.random first, so other scripts' draws never shift the exam's
  const click = async (sel, n = 0) => { await pg.evaluate(({ sel, n, seed }) => { window.__seed(seed); const e = document.querySelectorAll(sel)[n]; if (!e) throw new Error('sp34: no ' + sel); e.click(); }, { sel, n, seed: 1000 + ++act }); };
  const has = (sel) => pg.evaluate((sel) => !!document.querySelector(sel), sel);
  const key = async (k) => { await pg.evaluate((seed) => window.__seed(seed), 1000 + ++act); await pg.keyboard.press(k); };
  const open = async (state, query = '') => {
    await pg.clock.setFixedTime(T0);
    await pg.evaluate(({ store, state }) => { if (state == null) localStorage.removeItem(store); else localStorage.setItem(store, state); }, { store, state });
    await pg.goto(base + query, { waitUntil: 'networkidle' }); await outline();
  };
  const made = (fn, ...a) => pg.evaluate(({ src, a }) => JSON.stringify(new Function('return ' + src)()(...a)), { src: fn.toString(), a });
  const S = (name) => { scen = name; step = 0; };
  const at = async (t) => { await pg.clock.setFixedTime(t); };
  const wait = (fn, arg) => pg.waitForFunction(fn, arg, { timeout: 15000 });

  await pg.clock.setFixedTime(T0);
  await pg.goto(base, { waitUntil: 'networkidle' });
  const P2 = await made(progress, bank, T0, [iso(T0 - 2 * DAY), iso(T0 - DAY)]);
  const P6 = await made(everyType, bank);

  S('S1'); await open(null); await snap('home');

  S('S2'); await open(P2); await snap('home');
  await click('[data-go="mistakes"]'); await snap('mistakes');
  await pg.evaluate(answer, { bank, right: true }); await snap('answered'); await click('#dpCheck'); await snap('checked');
  await click('#dpBack'); await snap('home again');
  await click('[data-go="bookmarks"]'); await snap('bookmarks'); await click('#dpBm'); await snap('unbookmarked');
  await click('#dpBack'); await snap('home, one bookmark less');

  S('S3'); await open('{not json'); await snap('corrupt'); await open('{"ans":{},"bm":[]}'); await snap('partial'); await open('null'); await snap('null');

  S('S4'); await open(null); await click('[data-go="practice"]'); await snap('setup');
  await click('[data-skill]', 3); await snap('a skill'); await click('[data-diff="2"]'); await snap('medium'); await click('[data-count="20"]'); await snap('20');
  await click('[data-diff="0"]'); await click('[data-count="10"]'); await click('[data-skill]', 0);
  await pg.evaluate(() => { const f = document.getElementById('dpFresh'); f.checked = false; f.dispatchEvent(new Event('change')); });
  await click('#dpStart'); await snap('started');
  for (let k = 0; k < 14 && !(await has('.dp-end')); k++) {
    if (k === 2) { await click('#dpSkip'); await snap('skipped'); continue; }
    await pg.evaluate(answer, { bank, right: k % 2 === 0 }); await click('#dpCheck'); await snap('checked'); await click('#dpNext');
  }
  await snap('summary');
  if (await has('[data-a="mist"]')) { await click('[data-a="mist"]'); await snap('mistakes'); }
  await click('#dpBack'); await click('[data-go="practice"]'); await click('#dpStart'); await snap('fresh first');

  S('S5'); await open(P2); await click('[data-go="practice"]'); await click('[data-skill="weak"]'); await click('[data-count="20"]'); await snap('setup');
  await click('#dpStart'); await snap('started');
  for (let k = 0; k < 3; k++) { await pg.evaluate(answer, { bank, right: k === 1 }); await click('#dpCheck'); await click('#dpNext'); }
  await snap('after 3'); await click('#dpBack'); await snap('home');

  S('S6'); await open(P6); await click('[data-go="bookmarks"]');
  for (let k = 0; k < 6 && !(await has('.dp-end')); k++) {
    await snap('question'); await pg.evaluate(workout, { bank }); await snap('worked');
    if (await has('#dpCheck:not([disabled])')) { await click('#dpCheck'); await snap('checked'); await click('#dpNext'); } else await click('#dpSkip');
  }
  await snap('summary');

  S('S7'); await open(null); await click('[data-go="cases"]'); await snap('cases'); await click('[data-case]'); await snap('case');
  for (let k = 0; k < 12 && !(await has('.dp-end')); k++) { await pg.evaluate(answer, { bank, right: k !== 1 }); await click('#dpCheck'); await snap('checked'); await click('#dpNext'); }
  await snap('summary'); await click('#dpBack'); await click('[data-go="cases"]'); await snap('cases after');

  S('S8'); await open(P2); await click('[data-go="plan"]'); await snap('plan'); await click('[data-skill]', 1); await snap('practice that skill');

  S('S9'); await open(null); await click('[data-go="mock"]'); await snap('setup'); await click('[data-len="quick"]'); await snap('quick');
  await click('#dpGo'); await snap('started');
  for (let k = 0; k < 10; k++) {
    if (k !== 5) await pg.evaluate(answer, { bank, right: k % 3 !== 0 });
    if (k === 2 || k === 7) await click('#dpFlag');
    if (k === 4) { await click('#dpPrev'); await snap('back one'); await click('#dpNext'); }
    await snap('q');
    if (await has('#dpNext')) await click('#dpNext'); else await click('#dpRev2');
  }
  await snap('review'); await click('[data-j="3"]'); await snap('jump'); await click('#dpRev'); await click('#dpFlagged'); await snap('first flagged');
  await click('#dpRev'); await click('#dpBackQ'); await snap('back to questions'); await click('#dpRev');
  await click('#dpSubmit'); await snap('submit dialog'); await click('.dp-modal [data-ok]'); await snap('results');
  for (const f of ['wrong', 'flag', 'all']) { await click(`[data-f="${f}"]`); await snap('filter ' + f); }
  await pg.evaluate(() => { document.querySelector('details.dp-rev').open = true; });
  await wait(() => document.querySelector('.dp-revbody').innerHTML.length > 0); await snap('review opened');
  await click('[data-bmq]'); await snap('bookmarked'); await click('[data-a="share"]'); await snap('shared');
  await click('[data-a="weak"]'); await snap('weak practice'); await click('#dpBack'); await snap('home');
  await click('[data-go="mock"]'); await snap('setup again');

  S('S10'); await open(null); await click('[data-go="mock"]'); await click('#dpGo'); await snap('full');
  const last = await pg.evaluate((store) => JSON.parse(localStorage.getItem(store)).mock.items.length - 1, store);
  await click('#dpRev'); await snap('grid'); await click(`[data-j="${last}"]`); await snap('last'); await click('#dpRev2'); await snap('review');

  S('S11'); await open(null); await click('[data-go="mock"]'); await click('[data-len="half"]'); await click('#dpGo'); await snap('started');
  const timer = () => pg.evaluate(() => { const b = document.querySelector('#dpTimer b'); return b ? b.textContent + '|' + b.parentElement.className : ''; });
  const t10 = await timer();
  await at(T0 + 10 * MIN); await wait((w) => { const b = document.querySelector('#dpTimer b'); return b && b.textContent + '|' + b.parentElement.className !== w; }, t10); await snap('10 min later');
  await pg.goto(base, { waitUntil: 'networkidle' }); await outline(); await snap('reloaded home'); await click('[data-go="resume"]'); await snap('resumed');
  // the edge of low time: 300 s left is not low yet, 299 s is
  const tick = async (t, label) => { const w = await timer(); await at(t); await wait((w) => { const b = document.querySelector('#dpTimer b'); return b && b.textContent + '|' + b.parentElement.className !== w; }, w); await snap(label); };
  await tick(T0 + 45 * MIN, '300 s left'); await tick(T0 + 45 * MIN + 1000, '299 s left, low');
  await click('#dpRev'); await snap('review with timer');
  await pg.goto(base, { waitUntil: 'networkidle' }); await outline(); await click('[data-go="mock"]'); await click('#dpGo'); await snap('replace dialog');
  await click('.dp-modal [data-x]'); await snap('kept');
  await at(T0 + 50 * MIN + 1000); await pg.goto(base, { waitUntil: 'networkidle' }); await outline(); await snap('home after time');
  await click('[data-go="resume"]'); await snap('time up');
  await click('#dpBack'); await click('[data-go="mock"]'); await click('[data-len="quick"]'); await click('#dpGo'); await snap('quick started');
  await at(T0 + 66 * MIN + 2000); await wait(() => !!document.querySelector('.dp-score')); await snap('time up while open');

  S('S12'); await open(P2); await click('[data-go="renewal"]'); await snap('setup'); await click('#dpGo'); await snap('started');
  for (let k = 0; k < 5; k++) { await pg.evaluate(answer, { bank, right: k % 2 === 0 }); await click('#dpNext'); }
  await snap('5 answered'); await click('#dpRev'); await click('#dpSubmit'); await click('.dp-modal [data-ok]'); await snap('results');
  await click('[data-a="retake"]'); await snap('retake'); await click('#dpBack'); await click('[data-go="mock"]'); await snap('back to full');

  S('S13');
  for (const m of ['mock', 'renewal', 'practice', 'cases', 'plan', 'other']) { await open(null, '&mode=' + m); await snap('mode ' + m); }
  await open(null); await click('[data-go="practice"]'); await click('#dpStart'); await key('1'); await snap('key 1'); await key('Enter'); await snap('enter checks'); await key('Enter'); await snap('enter next');
  await click('#dpBack'); await click('[data-go="mock"]'); await click('[data-len="quick"]'); await click('#dpGo'); await key('2'); await snap('mock key 2');
  await pg.evaluate((l) => { document.documentElement.lang = l; }, lang === 'en' ? 'ar' : 'en'); await pg.evaluate(() => new Promise((r) => setTimeout(r, 50))); await snap('language switched');
  await pg.evaluate((l) => { document.documentElement.lang = l; }, lang); await pg.evaluate(() => new Promise((r) => setTimeout(r, 50))); await snap('switched back');
  await open(P2); await click('#dpReset'); await snap('reset dialog'); await click('.dp-modal [data-ok]'); await snap('reset');

  errors.push(...v.errs.map((e) => `${exam} ${lang}: ${e.slice(0, 160)}`));
  await v.ctx.close();
}

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const runs = EXAMS.flatMap((e) => ['en', 'ar'].map((lang) => ({ e, lang, rec: {}, errors: [], asked: [] })));
  await Promise.all(runs.map((r) => drive(browser, url, r.e, r.lang, r.rec, r.errors, r.asked).catch((e) => r.errors.push(`${r.e[0]} ${r.lang}: crashed: ${String(e.message).split('\n')[0].slice(0, 200)}`))));
  const rec = Object.assign({}, ...runs.map((r) => r.rec));
  if (process.env.SP34_RECORD === '1') fs.writeFileSync(GOLD, JSON.stringify(rec, null, 1) + '\n');
  const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8'));
  for (let s = 1; s <= 13; s++) {
    const keys = Object.keys(gold).filter((k) => k.split(' ')[2].split('.')[0] === 'S' + s);
    const bad = keys.filter((k) => JSON.stringify(rec[k]) !== JSON.stringify(gold[k]))
      .map((k) => k + (rec[k] ? ' (' + Object.keys(gold[k]).filter((p) => rec[k][p] !== gold[k][p]).join(',') + ')' : ' (not reached)'));
    check(keys.length > 0 && !bad.length, `S${s}: ${keys.length ? bad.length + ' of ' + keys.length + ' steps differ from the base: ' + bad.slice(0, 6).join('; ') : 'no recorded step'}`);
  }
  const extra = Object.keys(rec).filter((k) => !gold[k]);
  check(!extra.length && Object.keys(rec).length === Object.keys(gold).length, `C1 ${Object.keys(rec).length} steps seen, ${Object.keys(gold).length} recorded; not recorded: ${extra.slice(0, 5).join('; ')}`);
  const errors = runs.flatMap((r) => r.errors);
  check(!errors.length, `E1 page errors: ${errors.slice(0, 4).join(' | ')}`);

  const want = MODS.filter((n) => fs.existsSync(path.join(ROOT, 'assets/js', n + '.js')));
  if (want.length) {
    const lines = (n) => fs.readFileSync(path.join(ROOT, 'assets/js', n + '.js'), 'utf8').split('\n').length - 1;
    const files = want.concat(want.includes('exam-view') ? ['dp600-sim'] : []);
    const long = files.filter((n) => lines(n) >= 600), noIface = want.filter((n) => !/Interface/.test(fs.readFileSync(path.join(ROOT, 'assets/js', n + '.js'), 'utf8').split('\n').slice(0, 40).join('\n')));
    check(!long.length && !noIface.length, `M1 under 600 lines: ${long.map((n) => n + ' ' + lines(n)).join(', ') || 'ok'}; interface at the top: ${noIface.join(', ') || 'ok'}`);
    const order = want.concat('dp600-sim').join(' ');
    check(runs.every((r) => r.asked.join(' ') === order), `M2 each page must ask for ${order}: ${runs.map((r) => r.e[0] + ' ' + r.lang + ': ' + r.asked.join(' ')).join(' | ')}`);
    check(gradeInNode().every((x) => x[1]), `M3 exam-grade.js in Node: ${gradeInNode().filter((x) => !x[1]).map((x) => x[0]).join(', ')}`);
  }
  return { checks, problems };
}

// exam-grade.js on made-up questions (no bank): the base's rules, case by case
function gradeInNode() {
  const G = createRequire(import.meta.url)(path.join(ROOT, 'assets/js/exam-grade.js'));
  const single = { type: 'single', ans: 2 }, multi = { type: 'multi', ans: [0, 2, 3], n: 3 }, yn = { type: 'yesno', ans: [true, false, true] }, ord = { type: 'order', ans: [3, 1, 0] };
  return [
    ['single right', G.grade(single, 2) === 1], ['single wrong', G.grade(single, 1) === 0], ['no answer', G.grade(single, null) === 0],
    ['multi partial', Math.abs(G.grade(multi, [0, 2, 1]) - 1 / 3) < 1e-12], ['multi all', G.grade(multi, [3, 0, 2]) === 1], ['multi floor', G.grade(multi, [1, 4, 0]) === 0], ['multi empty', G.grade(multi, []) === 0],
    ['yesno 2 of 3', Math.abs(G.grade(yn, [true, true, true]) - 2 / 3) < 1e-12], ['order', G.grade(ord, [3, 1, 0]) === 1 && G.grade(ord, [3, 0, 1]) === 0 && G.grade(ord, [3, 1]) === 0],
    ['unknown type', G.grade({ type: 'x' }, 1) === 0],
    ['answered', G.answered(single, 0) && !G.answered(single, null) && G.answered(multi, [1, 2, 3]) && !G.answered(multi, [1]) && G.answered(yn, [true, false, false]) && !G.answered(yn, [true, null, false]) && G.answered(ord, [1]) && !G.answered(ord, [])],
  ];
}
