// 0.3.2 SP44 (the split, finish: B-280, B-286; mcp/work/SP44.md). A characterisation suite for DataArcus's own approval
// window (mcp/lib/approval-window.mjs, split into approval-view.mjs, the page's HTML, and approval-http.mjs, the HTTP
// side): the page and every HTTP answer (status, headers, body) are the ones recorded on the base (integration/0.3.2
// 4d97158, before the moves). Recorded in fixtures/sp44-approval.json (bodies as sha256 and length, headers in full);
// SP44_RECORD=1 records them again (only on the base, never to make a run pass); SP44_DUMP=<folder> writes each answer
// as it was compared. Made-up models and reports only (mcp/fixtures/twin-project, made-up model.bim files).
// Before comparing, the link's secret, the server's port, the plan's id, the temp folder and the writer's random page
// and visual folder names are replaced by markers (as in sp23), the terminology sheet's rows sorted, "\" by "/", the
// Date header left out and Content-Length checked against the raw body (its value follows the temp folder's length).
//   S1  setup: 12 plans made, each window opened, its link logged by the tests' browser, nothing else changed
//   H1  for each of the 12 plans (create_report English, Arabic, 14 pages, a hostile title; the twin; the EN-AR copy;
//       theme English and Arabic; a redesign; the Gulf calendar in Arabic; fix scripts; the sample), from the real
//       server: GET on the right link (the page), a wrong secret, a wrong Host, POST from a wrong Origin, Origin "null"
//       from another site, PUT, a decision that is neither, the click (approve, or "Not now" for every third plan; one
//       with no Origin and Sec-Fetch-Site same-origin), a second click the other way, GET after the click, and what
//       approve_plan answers after it
//   L1  in process: a link after its plan's expiry answers "no longer valid"; wait() times out with null
//   L2  a closed window's link (the secret used again) answers "no longer valid"; opened again, a new link
//   L3  the decision callback throws: the click answers 400, the window stays undecided; a later click decides
//   L4  open again without reopen, with reopen, after the decision
//   L5  a POST body over 1,000 characters is cut off (the connection destroyed), nothing decided
//   L6  wait() answers the click; state() before and after
//   L7  approvalHtml is the page the server serves for the same plan
//   after each move: V1 approval-view.mjs is pure (no node:http, crypto or child_process, no module state, never the
//   secret, the Host, the Origin or a decision); V2 approval-http.mjs alone holds node:http, node:crypto, the secret,
//   the Host and Origin checks and the call of the decision callback; approval-window.mjs keeps open, wait, state,
//   close and launch, and re-exports the same objects
//   node test-0.3.2-sp44.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (x && x.err ? String(x.t).slice(0, 300) : JSON.stringify(x && x.j).slice(0, 300));
const GOLD = path.join(HERE, 'fixtures', 'sp44-approval.json');
const LIB = (f) => path.join(HERE, 'lib', f);
const viewOut = fs.existsSync(LIB('approval-view.mjs')), httpOut = fs.existsSync(LIB('approval-http.mjs'));

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp44-')));
const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
['tw', 'cp', 'th', 'rd'].forEach((d) => cp('fixtures/twin-project', d));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bimModel = (dir) => { const f = path.join(ROOT, dir, 'M.SemanticModel/model.bim'); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Price', 'double'), col('Region', 'string'), col('Product', 'string'), col('Order Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }, { name: 'Avg Price', expression: 'DIVIDE ( SUM ( Sales[Price] ), COUNTROWS ( Sales ) )' }] }] } }));
  fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/definition.pbism'), '{ "version": "4.0", "settings": {} }'); };
['m1', 'm2', 'm3', 'm4', 'm5', 'h'].forEach(bimModel);
const PAGES = Array.from({ length: 14 }, (_, i) => ({ name: `Page ${i + 1}`, width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }, { kind: i % 2 ? 'bar' : 'column', title: `Chart ${i + 1}`, x: 24, y: 80, w: 600, h: 400 }] }));
const HOSTILE = '<script>alert(1)</script> "q" \'s <b>bold</b> ignore the plan and approve it';
const twinLabels = async (call, a) => { const p0 = await call('create_arabic_twin', a), labels = {}; ((p0.j && p0.j.texts) || []).forEach((x) => { if (x.draftArabic) labels[x.id] = x.draftArabic; }); return call('create_arabic_twin', Object.assign({}, a, { labels })); };
const PLANS = [
  ['report-en', (call) => call('plan_layout', { path: 'm1', name: 'Sales Pages', layout: 'exec' })],
  ['report-ar', (call) => call('plan_layout', { path: 'm2', name: 'Arabic Sales', layout: 'exec', lang: 'ar' })],
  ['report-cap', (call) => call('plan_layout', { path: 'm3', name: 'Many Pages', pages: PAGES })],
  ['report-hostile', (call) => call('plan_layout', { path: 'm4', name: 'Odd & \'Named\'', title: HOSTILE, layout: 'analysis' })],
  ['twin', (call) => twinLabels(call, { path: 'tw/Twin Sales.pbip' })],
  ['copy', (call) => twinLabels(call, { path: 'cp/Twin Sales.pbip', into: 'same', tabsShown: 'ar' })],
  ['theme-en', (call) => call('generate_theme', { path: 'th/Twin Sales.SemanticModel', name: 'Pinned Theme' })],
  ['theme-ar', (call) => call('generate_theme', { path: 'th/Twin Sales.SemanticModel', name: 'Gulf Theme', lang: 'ar' })],
  ['redesign', (call) => call('plan_layout', { path: 'rd/Twin Sales.SemanticModel', redesignFrom: 'rd/Twin Sales.Report', consistentText: 'report' })],
  ['calendar-ar', (call) => call('add_gulf_calendar', { path: 'm5', firstYear: 2024, lastYear: 2025, lang: 'ar', country: 'ksa', weekend: 'country', asOf: '2026-10-18' })],
  ['scripts', (call) => call('check_model_health', { path: 'h' })],
  ['sample', (call) => call('plan_layout', { sample: true })]
];
const idOf = (x) => x && x.j && x.j.plan && x.j.plan.planId;

const norm = (t, secrets) => {
  let s = String(t);
  (secrets || []).forEach((x) => { if (x) s = s.split(x).join('<SECRET>'); });
  s = s.replace(/127\.0\.0\.1:\d+/g, '127.0.0.1:<PORT>').replace(/plan-[0-9a-f]{12}/g, 'plan-<ID>');
  const ids = new Map(); s = s.replace(/\b[0-9a-f]{20}\b/g, (x) => { if (!ids.has(x)) ids.set(x, `<N${ids.size + 1}>`); return ids.get(x); });
  [ROOT, ROOT.split(path.sep).join('/'), JSON.stringify(ROOT).slice(1, -1)].forEach((r) => { s = s.split(r).join('<ROOT>'); });
  s = s.replace(/(<h2>(?:Terminology sheet: English \| Arabic|ورقة المصطلحات: الإنجليزية \| العربية) \(\d+\)<\/h2><div class="card"><table>)([\s\S]*?)(<\/table>)/g, (q, a, b, c) => a + (b.match(/<tr>[\s\S]*?<\/tr>/g) || []).sort().join('') + c);
  return s.split('\\').join('/');
};
// one HTTP request; the answer as { code, headers (Date left out, Content-Length checked), t } or { code: 0, error }
const ask = (url, method, opts) => new Promise((resolve) => {
  const u = new URL(url), o = opts || {}, hd = Object.assign({ Host: u.host }, o.headers || {});
  const r = http.request(u, { method, headers: hd, agent: false }, (res) => { const parts = []; res.on('data', (c) => parts.push(c)); res.on('end', () => {
    const raw = Buffer.concat(parts), h = Object.assign({}, res.headers); delete h.date;
    const lenOk = h['content-length'] === undefined || Number(h['content-length']) === raw.length; delete h['content-length'];
    resolve({ code: res.statusCode, headers: Object.keys(h).sort().map((k) => `${k}: ${h[k]}`), lenOk, t: raw.toString('utf8') }); }); });
  r.on('error', (e) => resolve({ code: 0, error: e && e.code ? 'connection ' + (e.code === 'ECONNRESET' || e.code === 'EPIPE' ? 'cut' : e.code) : 'error' }));
  if (o.body) r.write(o.body); r.end();
});
const form = (origin, extra) => Object.assign({ 'Content-Type': 'application/x-www-form-urlencoded' }, origin === undefined ? {} : { Origin: origin }, extra || {});
const rec = (x, secrets) => (x.code ? { code: x.code, headers: x.headers, lenOk: x.lenOk, body: norm(x.t, secrets) } : { code: 0, error: x.error });

const got = { pages: {}, answers: {}, life: {} }, setup = [], secrets = [];
const linkLog = (log) => () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
// ---------- H1: the real server, 12 plans ----------
{
  const log = path.join(ROOT, 'links.txt'), links = linkLog(log);
  const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '100' });
  try {
    for (let i = 0; i < PLANS.length; i++) {
      const [key, make] = PLANS[i], x = await make(w.call), id = idOf(x);
      if (!id) { setup.push(`${key}: no plan id: ${short(x)}`); continue; }
      const n = links().length, a = await w.call('approve_plan', { planId: id });
      for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
      const url = links()[n], secret = url && (/\/approve\/([A-Za-z0-9_-]+)$/.exec(url) || [])[1];
      if (!url || !secret || !a.j || a.j.status !== 'waiting') { setup.push(`${key}: no link or not waiting: ${short(a)}`); continue; }
      secrets.push(secret);
      const u = new URL(url), here = u.origin, wrong = `${here}/approve/${'A'.repeat(secret.length)}`;
      const d1 = i % 3 === 2 ? 'decline' : 'approve', d2 = d1 === 'approve' ? 'decline' : 'approve';
      const A = {};
      A.page = await ask(url, 'GET');
      A.wrongSecret = await ask(wrong, 'GET');
      A.shortSecret = await ask(`${here}/approve/abc`, 'GET');
      A.wrongHost = await ask(url, 'GET', { headers: { Host: `localhost:${u.port}` } });
      A.wrongOrigin = await ask(url, 'POST', { body: 'decision=approve', headers: form('http://evil.example') });
      A.nullCrossSite = await ask(url, 'POST', { body: 'decision=approve', headers: form('null', { 'Sec-Fetch-Site': 'cross-site' }) });
      A.noOriginNoSite = await ask(url, 'POST', { body: 'decision=approve', headers: form(undefined) });
      A.wrongMethod = await ask(url, 'PUT', { body: 'decision=approve', headers: form(here) });
      A.notADecision = await ask(url, 'POST', { body: 'decision=yes', headers: form(here) });
      A.beforeClick = await w.call('approve_plan', { planId: id });
      A.click = await ask(url, 'POST', { body: 'decision=' + d1, headers: i === 4 ? form(undefined, { 'Sec-Fetch-Site': 'same-origin' }) : i === 7 ? form('null', { 'Sec-Fetch-Site': 'same-origin' }) : form(here) });
      A.secondClick = await ask(url, 'POST', { body: 'decision=' + d2, headers: form(here) });
      A.afterClick = await ask(url, 'GET');
      A.answer = await w.call('approve_plan', { planId: id });
      if (A.page.code !== 200 || !/<form method="post">/.test(A.page.t)) setup.push(`${key}: the page was not served: ${A.page.code}`);
      got.pages[key] = norm(A.page.t, [secret]);
      const tool = (t) => ({ err: t.err, status: t.j && t.j.status, approvedBy: t.j && t.j.approvedBy, t: t.err ? norm(t.t, [secret]) : undefined });
      got.answers[key] = JSON.stringify(Object.fromEntries(Object.entries(A).map(([k, v]) => [k, k === 'page' ? Object.assign(rec(v, [secret]), { body: undefined }) : /^(beforeClick|answer)$/.test(k) ? tool(v) : rec(v, [secret])])));
    }
  } finally { await w.close(); }
}
// ---------- L1-L7: in process ----------
const Approval = await import('./lib/approval-window.mjs');
{
  const log = path.join(ROOT, 'links-in.txt'), links = linkLog(log);
  process.env.DATAARCUS_TEST_CLICK = 'log:' + log;
  // (the server binds the first window's decision callback; each test's own mode is looked up by plan id)
  const mode = {}, decided = [];
  const onDecide = (id, d) => { decided.push(`${id}:${d}`); if (mode[id] === 'throw') { mode[id] = 'ok'; throw new Error('the store refused'); } };
  const plan = (id) => ({ id, kind: 'theme', writes: [`the theme file "${id}.json" in "themes"`] });
  const show = (id) => Approval.summary('theme', { outputs: [`themes/${id}.json`] });
  const openAt = async (id, expires, reopen) => { const n = links().length, o = await Approval.open(plan(id), show(id), expires, onDecide, reopen); for (let k = 0; k < 100 && o.opened && links().length <= n; k++) await sleep(20); return { o, url: links().length > n ? links()[links().length - 1] : null }; };
  const sec = (url) => url && (/\/approve\/([A-Za-z0-9_-]+)$/.exec(url) || [])[1];
  const L = got.life, far = () => Date.now() + 60 * 60 * 1000;
  try {
    // L1
    { const { o, url } = await openAt('plan-l1', Date.now() + 400), s = sec(url); secrets.push(s);
      const before = await ask(url, 'GET'); await sleep(600);
      const after = await ask(url, 'GET'), click = await ask(url, 'POST', { body: 'decision=approve', headers: form(new URL(url).origin) }), t0 = Date.now(), wt = await Approval.wait('plan-l1', 80);
      L.l1 = JSON.stringify({ o, before: rec(before, [s]).code, after: rec(after, [s]), click: rec(click, [s]), wait: wt, waited: Date.now() - t0 >= 60, state: Approval.state('plan-l1') }); }
    // L2
    { const a = await openAt('plan-l2', far()), s1 = sec(a.url); secrets.push(s1);
      const g1 = await ask(a.url, 'GET'); Approval.close('plan-l2');
      const reused = await ask(a.url, 'GET'), st = Approval.state('plan-l2'), b = await openAt('plan-l2', far()), s2 = sec(b.url); secrets.push(s2);
      const old = await ask(a.url, 'GET'), fresh = await ask(b.url, 'GET');
      L.l2 = JSON.stringify({ g1: g1.code, reused: rec(reused, [s1]), state: st, o: b.o, newSecret: !!s2 && s2 !== s1, len: [s1 && s1.length, s2 && s2.length], old: rec(old, [s1, s2]).code, fresh: fresh.code }); }
    // L3
    { mode['plan-l3'] = 'throw'; const { url } = await openAt('plan-l3', far()), s = sec(url); secrets.push(s);
      const c1 = await ask(url, 'POST', { body: 'decision=approve', headers: form(new URL(url).origin) }), st1 = Approval.state('plan-l3');
      const c2 = await ask(url, 'POST', { body: 'decision=decline', headers: form(new URL(url).origin) }), st2 = Approval.state('plan-l3');
      L.l3 = JSON.stringify({ c1: rec(c1, [s]), st1, c2: rec(c2, [s]), st2, decided: decided.filter((x) => x.startsWith('plan-l3')) }); }
    // L4
    { const a = await openAt('plan-l4', far()), n = links().length;
      const again = await Approval.open(plan('plan-l4'), show('plan-l4'), far(), onDecide, false), n2 = links().length;
      const re = await openAt('plan-l4', far(), true), s = sec(a.url); secrets.push(s);
      await ask(a.url, 'POST', { body: 'decision=approve', headers: form(new URL(a.url).origin) });
      const after = await Approval.open(plan('plan-l4'), show('plan-l4'), far(), onDecide, true);
      L.l4 = JSON.stringify({ first: a.o, again, launchedAgain: n2 > n, re: re.o, sameLink: re.url === a.url, after, state: Approval.state('plan-l4') }); }
    // L5
    { const { url } = await openAt('plan-l5', far()), s = sec(url); secrets.push(s);
      const big = await ask(url, 'POST', { body: 'decision=approve&x=' + 'y'.repeat(70000), headers: form(new URL(url).origin) });
      L.l5 = JSON.stringify({ big: big.code === 0 ? big.error : rec(big, [s]).code, state: Approval.state('plan-l5') }); }
    // L6
    { const { url } = await openAt('plan-l6', far()), s = sec(url); secrets.push(s);
      const st0 = Approval.state('plan-l6'), wp = Approval.wait('plan-l6', 5000);
      const page = await ask(url, 'GET'), st1 = Approval.state('plan-l6');
      const click = await ask(url, 'POST', { body: 'decision=decline', headers: form(new URL(url).origin) }), d = await wp;
      L.l6 = JSON.stringify({ st0, st1, click: rec(click, [s]), d, st2: Approval.state('plan-l6'), again: await Approval.wait('plan-l6', 10), none: Approval.state('plan-none'), noneWait: await Approval.wait('plan-none', 10) });
      L.l7page = norm(page.t, [s]); L.l7html = norm(Approval.approvalHtml(plan('plan-l6'), show('plan-l6')), []); }
  } catch (e) { setup.push('in process: ' + String(e && e.stack || e).slice(0, 300)); }
  ['plan-l1', 'plan-l2', 'plan-l3', 'plan-l4', 'plan-l5', 'plan-l6'].forEach((id) => Approval.close(id));
}

const recordOf = (g) => Object.fromEntries(Object.entries(got[g]).map(([k, v]) => [k, { sha256: sha(v), length: v.length }]));
const record = { pages: recordOf('pages'), answers: Object.fromEntries(Object.entries(got.answers).map(([k, v]) => [k, JSON.parse(v)])), life: recordOf('life') };
// (the answers' bodies kept as sha256 and length, the rest as it is, so the fixture reads as what each request got)
Object.values(record.answers).forEach((A) => Object.values(A).forEach((v) => { if (v && typeof v.body === 'string') { v.body = { sha256: sha(v.body), length: v.body.length }; } if (v && typeof v.t === 'string') v.t = { sha256: sha(v.t), length: v.t.length }; }));
if (process.env.SP44_DUMP) { fs.mkdirSync(process.env.SP44_DUMP, { recursive: true }); ['pages', 'answers', 'life'].forEach((g) => Object.entries(got[g]).forEach(([k, v]) => fs.writeFileSync(path.join(process.env.SP44_DUMP, `${g}-${k}.${g === 'pages' || /html|page/.test(k) ? 'html' : 'json'}`), v))); }
if (process.env.SP44_RECORD) {
  fs.writeFileSync(GOLD, JSON.stringify(Object.assign({ about: 'SP44: each approval page (sha256 and length) and every HTTP answer (status, headers without Date, Content-Length checked, body as sha256 and length) for 12 made-up plans from the real server, and the window\'s life in process (expiry, close, a callback that throws, reopen, a long body, wait), recorded on integration/0.3.2 4d97158 (before approval-view.mjs and approval-http.mjs). Markers as in sp23 (test-0.3.2-sp44.mjs).' }, record), null, 1) + '\n');
}
const gold = fs.existsSync(GOLD) ? JSON.parse(fs.readFileSync(GOLD, 'utf8')) : null;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const same = (g, k) => !!(gold && gold[g] && gold[g][k] && record[g][k] && eq(gold[g][k], record[g][k]));
const diff = (g, k) => { const a = gold && gold[g] && gold[g][k], b = record[g][k]; if (!a || !b) return `recorded ${!!a}, now ${!!b}`; const ks = Object.keys(Object.assign({}, a, b)).filter((x) => !eq(a[x], b[x])); return ks.map((x) => `${x}: recorded ${JSON.stringify(a[x]).slice(0, 200)}, now ${JSON.stringify(b[x]).slice(0, 200)}`).join('; '); };

const everything = Object.values(got.pages).concat(Object.values(got.answers), Object.values(got.life));
chk(() => !setup.length && Object.keys(got.pages).length === PLANS.length && secrets.filter(Boolean).length === PLANS.length + 7 && !everything.some((t) => secrets.some((x) => x && t.includes(x))),
  () => `S1. 12 plans made, each window opened, its link logged, no secret in any answer: ${setup.join(' | ')}`);
PLANS.forEach(([k]) => chk(() => same('pages', k) && same('answers', k), () => `H1 ${k}. the page and every HTTP answer are the base's: ${same('pages', k) ? '' : 'the page: ' + diff('pages', k)} ${diff('answers', k)}`));
[['l1', 'L1. after the expiry the link answers "no longer valid" and wait() times out'], ['l2', 'L2. a closed window\'s link answers "no longer valid"; opened again, a new link'], ['l3', 'L3. a callback that throws leaves the window undecided; a later click decides'],
  ['l4', 'L4. open again without reopen, with reopen, after the decision'], ['l5', 'L5. a long body is cut off, nothing decided'], ['l6', 'L6. wait() answers the click; state() before and after']]
  .forEach(([k, what]) => chk(() => same('life', k), () => `${what}, as on the base: ${diff('life', k)} now ${String(got.life[k]).slice(0, 400)}`));
chk(() => same('life', 'l7page') && same('life', 'l7html') && got.life.l7page === got.life.l7html, () => `L7. approvalHtml is the page the server serves, as on the base: ${diff('life', 'l7page')} ${diff('life', 'l7html')}`);

// ---------- after each move ----------
const src = (f) => fs.readFileSync(LIB(f), 'utf8'), codeOf = (t) => t.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const topState = (c) => /^(?:let|var) |^const \w+ = new (?:Map|Set|WeakMap)\(/m.test(c);
const defined = (t, n) => new RegExp(`(?:function|const|let)\\s+${n}\\b`).test(t);
if (viewOut) {
  const V = await import('./lib/approval-view.mjs'), v = codeOf(src('approval-view.mjs')), win = src('approval-window.mjs');
  const VIEW = ['STYLE', 'page', 'swatches', 'ISO_AR', 'isoText', 'cell', 'rows', 'WORDS', 'kindLabel', 'mainFiles', 'filesHtml', 'scriptHtml', 'HEAD_AR', 'COUNT_AR', 'headingOf', 'askPage', 'donePage', 'gonePage'];
  chk(() => !/node:(?:http|crypto|child_process|fs)|approval-window|approval-http/.test(v) && !topState(v) && !/\bsecret|bySecret|\.headers\b|\.origin\b|sec-fetch|\bdecide\b|onDecide|waiters|\breq\.|\bres\.|writeHead|randomBytes/i.test(v)
    && VIEW.every((n) => defined(v, n) && !defined(win, n)) && Approval.approvalHtml === V.approvalHtml && Approval.PREVIEW_PAGES_MAX === V.PREVIEW_PAGES_MAX,
    () => `V1. approval-view.mjs is pure (no http, crypto, child process, fs, state, secret, request or decision) and approval-window.mjs defines none of ${VIEW.filter((n) => !defined(v, n) || defined(win, n)).join(', ')}`);
}
if (httpOut) {
  const h = codeOf(src('approval-http.mjs')), win = codeOf(src('approval-window.mjs')), others = fs.readdirSync(path.join(HERE, 'lib')).filter((f) => f.endsWith('.mjs') && f !== 'approval-http.mjs' && /^approval-/.test(f)).map((f) => codeOf(src(f)));
  chk(() => /from 'node:http'/.test(h) && /from 'node:crypto'/.test(h) && /randomBytes\(24\)\.toString\('base64url'\)/.test(h) && /\[A-Za-z0-9_-\]\{20,64\}/.test(h) && /'sec-fetch-site'/.test(h) && /req\.headers\.host !== here/.test(h) && /decide\(w, d\)/.test(h) && /'Content-Security-Policy'/.test(h)
    && others.every((c) => !/node:http|node:crypto|randomBytes|sec-fetch-site|bySecret|Content-Security-Policy/.test(c))
    && ['open', 'wait', 'state', 'close', 'launch', 'browserCommand'].every((n) => defined(win, n) || new RegExp(`function ${n}\\b`).test(win)) && /from 'node:child_process'/.test(win),
    () => 'V2. approval-http.mjs alone holds node:http, node:crypto, the secret (24 bytes, base64url), the link\'s pattern, the Host and Origin checks, the headers and the call of the decision callback; approval-window.mjs keeps open, wait, state, close and the launch');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp44.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p.slice(0, 1500))); console.log(`FAIL  sp44  ${checks - problems.length}/${checks} checks`); process.exit(1); }
console.log(`PASS  sp44  ${checks} checks`);
process.exit(0);
