// 0.3.1 C (time to first value): a new user with no model asks "show me what DataArcus can do". plan_layout with sample
// true proposes a made-up Gulf retail project (a plan of its own kind), approve_plan asks the person, create_report with
// sample true writes it (a PBIP project: TMDL model with typed rows, an empty report), and its answer is a 4-step tour of
// real DataArcus calls on it. Every name in it is made up: no real company, mall, person or vehicle trade.
//   C1-C3   the plan: nothing written, the files listed, no model input with it
//   C4-C7   the gate: refused before approval, the approval page, one write of exactly the listed files, the folder pinned
//   C8-C10  the model: read_model reads it, typed rows, the empty report passes Microsoft's validator
//   C11-C15 the tour, run: a report (validator 0 errors), English and Arabic, the twin's plan, the Gulf calendar, the lens
//   C16-C17 never over anything: a second sample gets a new folder; a folder taken after the plan refuses the write
//   C18     no real company and no employer data in the files
//   C19-C23 the answers' size, the tour's calls are real, the tour's language, where the agent learns of it, the README
//   node test-0.3.1-sample-project.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { scanText, termsOf } from '../scripts/deny-scan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), Tmdl = createRequire(import.meta.url)('../assets/js/tmdl-model.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const filesOf = (dir) => { const out = []; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else out.push(path.relative(dir, f).split(path.sep).join('/')); }); if (fs.existsSync(dir)) rec(dir); return out.sort(); };
const hashes = (dir) => Object.fromEntries(filesOf(dir).map((f) => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex')]));
const AR = /[؀-ۿ]/;

// The deny list: names a made-up Gulf retail sample must never hold, because each is a real company or place a reader
// would take for the real one (well-known Gulf retailers, hypermarkets, fashion and electronics chains, online shops,
// and the region's best-known malls). Matched as whole words, any case.
const DENY = [
  ['Lulu', 'hypermarket chain'], ['Carrefour', 'hypermarket chain (franchised in the Gulf)'], ['Majid Al Futtaim', 'retail and malls group'], ['Al Futtaim', 'retail group'],
  ['Landmark Group', 'retail group'], ['Centrepoint', 'department store chain'], ['Home Centre', 'furniture chain'], ['Max Fashion', 'fashion chain'], ['Apparel Group', 'fashion group'],
  ['Sharaf DG', 'electronics chain'], ['Jumbo Electronics', 'electronics chain'], ['Emax', 'electronics chain'], ['Jarir', 'bookstore and electronics chain'], ['eXtra', 'electronics chain (matched as a word)'],
  ['Panda', 'supermarket chain'], ['Othaim', 'supermarket chain'], ['Tamimi', 'supermarket chain'], ['Danube', 'supermarket chain'], ['Spinneys', 'supermarket chain'], ['Choithrams', 'supermarket chain'],
  ['Union Coop', 'cooperative supermarkets'], ['Nesto', 'hypermarket chain'], ['Geant', 'hypermarket chain'], ['Waitrose', 'supermarket (franchised)'], ['IKEA', 'furniture chain'],
  ['Noon', 'online shop (as a name)'], ['Namshi', 'online shop'], ['Amazon', 'online shop'], ['Talabat', 'delivery app'],
  ['Dubai Mall', 'mall'], ['Mall of the Emirates', 'mall'], ['Yas Mall', 'mall'], ['City Centre', 'mall brand'], ['Ibn Battuta', 'mall'], ['Dalma Mall', 'mall'], ['Marina Mall', 'mall'],
  ['The Avenues', 'mall'], ['Villaggio', 'mall'], ['Kingdom Centre', 'mall'], ['Red Sea Mall', 'mall'], ['Mall of Qatar', 'mall'], ['Muscat Grand Mall', 'mall'], ['Mirdif', 'mall district'], ['Galleria', 'mall brand']];
// The trade the sample must never be about (the brief: never a vehicle or dealership domain): one word each
const TRADE = /\b(vehicles?|cars?|dealers?(hip)?s?|showrooms?|motors?|motorcycles?|bikes?|tyres?|tires?|spare parts?|workshops?|garages?|service advisors?|test drives?|auto(motive)?)\b/i;

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-c-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-c-log-')));   // (the test click's log, outside the working folder)
const log = path.join(LOGS, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, {});
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const meta = { tools: (await s.c.listTools()).tools };
const answers = [];
const call = async (c, tool, args) => { const r = await c.call(tool, args); answers.push({ tool, n: String(r.t).length }); return r; };
// the person's click on Approve in the approval window; returns the page's text
async function approve(pid) {
  const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n); const html = url ? unesc(await req(url, 'GET')) : '';
  if (url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId: pid }); }
  return html;
}
// a report plan as a person answers it: the Gulf date and shared-axes questions, then the Arabic names and texts
async function planReport(a0) {
  let args = Object.assign({}, a0), pl = await call(w, 'plan_layout', args);
  for (let i = 0; i < 6 && !pl.err; i++) {
    const j = pl.j || {}, more = {};
    if (j.gulfDates && j.gulfDates.askNext && !args.gulfDates && ((j.gulfDates.candidates || [])[0] || {}).field) more.gulfDates = { dateRole: j.gulfDates.candidates[0].field, grain: 'gregorian', scope: 'all' };
    if (j.sharedAxes && (j.sharedAxes.ask || []).length && !args.sharedAxes) more.sharedAxes = j.sharedAxes.ask.map((q) => ({ measures: q.measures, answer: 'separate' }));
    const B = j.bilingual;
    if (B && !args.arabicTerms) { const t = {}; ((B.terminology || {}).sheet || []).forEach((r, k) => { if (r.field) t[r.field] = 'الحقل ' + (k + 1); }); more.arabicTerms = t; }
    else if (B && !args.arabicTexts) { const t = {}; (B.texts || []).filter((x) => !x.field && x.text != null && x.arabic == null).forEach((x, k) => { t[x.text] = x.draftArabic || 'نص ' + (k + 1); }); more.arabicTexts = t; }
    if (!Object.keys(more).length) break;
    args = Object.assign(args, more); pl = await call(w, 'plan_layout', args);
  }
  return { pl, args };
}

try {
  const empty = await call(s, 'read_model', { path: '.' });
  // ---------- C1-C3: the plan ----------
  const before = hashes(ROOT);
  const p = await call(s, 'plan_layout', { sample: true }), S = (p.j || {}).sample || {}, plan = (p.j || {}).plan || {};
  const T = Object.fromEntries((S.tables || []).map((t) => [t.table, t]));
  chk(() => !p.err && plan.planId && plan.written === false && S.folder === 'Gulf Retail Sample' && Object.keys(T).length === 4 && T.Sales.rows === 648 && T.Branches.rows === 6 && T.Products.rows === 12 && T.Calendar.rows === 546
    && S.relationships === 3 && /Calendar/.test(S.dateTable || '') && JSON.stringify(hashes(ROOT)) === JSON.stringify(before),
    () => `C1. plan_layout sample: a plan id, the folder, 4 tables (648/6/12/546 rows), 3 relationships, the Calendar marked; nothing written: ${short(p)}`);
  const outs = (plan.writesAfterGo || []).join(' '), shownAll = JSON.stringify(p.j || {});
  chk(() => /Gulf Retail Sample/.test(outs) && (plan.outputs || []).length === 16 && !/#date|#table|\{"/.test(shownAll),
    () => `C2. the plan lists the 16 files and its writes name the folder; no answer holds a row: ${outs.slice(0, 200)} ${String(shownAll).slice(0, 300)}`);
  const bad = await call(s, 'plan_layout', { sample: true, path: 'x', layout: 'exec' });
  chk(() => !bad.err && !(bad.j || {}).plan && ((bad.j || {}).planProblems || []).some((x) => /sample/.test(x) && /path/.test(x)), () => `C3. a model input with sample is a plan problem, no plan id: ${short(bad)}`);

  // ---------- C4-C7: the gate and the write ----------
  const pw = await call(w, 'plan_layout', { sample: true }), pid = pw.j && pw.j.plan && pw.j.plan.planId, folder = pw.j && pw.j.sample && pw.j.sample.folder;
  const early = await call(w, 'create_report', { sample: true, path: folder || 'Gulf Retail Sample', planId: pid });
  chk(() => early.err && /Nothing was written/.test(early.t) && JSON.stringify(hashes(ROOT)) === JSON.stringify(before), () => `C4. create_report before the approval: refused, nothing written: ${short(early)}`);
  const html = await approve(pid), txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  chk(() => /Sample project/.test(txt) && /16 files/.test(txt) && /Model \(TMDL\) \(9\)/.test(txt) && /Empty report \(6\)/.test(txt) && /Project file \(1\)/.test(txt) && !/About the script/.test(txt) && /made up/i.test(txt),
    () => `C5. the approval page: "Sample project", 16 files grouped (model 9, report 6, project file 1), what is made up, no script section: ${txt.slice(0, 700)}`);
  const other = await call(w, 'create_report', { sample: true, path: 'Somewhere Else', planId: pid });
  chk(() => other.err && /Nothing was written/.test(other.t) && !fs.existsSync(path.join(ROOT, 'Somewhere Else')), () => `C7. another folder than the approved one: refused, nothing written: ${short(other)}`);
  const wr = await call(w, 'create_report', { sample: true, path: folder, planId: pid }), WJ = wr.j || {};
  const added = filesOf(ROOT).filter((f) => !(f in before));
  const again = await call(w, 'create_report', { sample: true, path: folder, planId: pid });
  chk(() => !wr.err && WJ.written === true && added.length === 16 && added.every((f) => f.startsWith('Gulf Retail Sample/')) && JSON.stringify(added.map((f) => f.replace(/^Gulf Retail Sample\//, ''))) === JSON.stringify((pw.j.plan.outputs || []).map((f) => f.replace(/^Gulf Retail Sample\//, '')).sort())
    && again.err && filesOf(ROOT).length === added.length + Object.keys(before).length,
    () => `C6. after the approval: exactly the 16 listed files, all in the sample's folder; the same plan again refused: ${short(wr)} ${JSON.stringify(added).slice(0, 400)} again: ${short(again)}`);

  // ---------- C8-C10: the model ----------
  const MP = 'Gulf Retail Sample/Gulf Retail.SemanticModel', DEF = path.join(ROOT, MP, 'definition');
  const rm = await call(s, 'read_model', { path: MP }), RT = Object.fromEntries((((rm.j || {}).tables) || []).map((t) => [t.table, t]));
  const tmsl = fs.existsSync(DEF) ? Tmdl.fromFiles(filesOf(DEF).filter((f) => f.endsWith('.tmdl')).map((f) => ({ path: f, text: fs.readFileSync(path.join(DEF, f), 'utf8') }))) : { model: { tables: [], relationships: [] } };
  chk(() => !rm.err && Object.keys(RT).length === 4 && RT.Sales.measures.length === 4 && RT.Calendar.dateTable === true && Object.values(RT).every((t) => t.columns.every((c) => !/\(unknown\)/.test(String(c))))
    && (tmsl.model.relationships || []).length === 3,
    () => `C8. read_model reads it: 4 tables, 4 measures, the Calendar marked, every column typed; 3 relationships: ${short(rm)} rels ${(tmsl.model.relationships || []).length}`);
  const rowsOf = (t) => { const e = String((((tmsl.model.tables.find((x) => x.name === t) || {}).partitions || [])[0] || { source: {} }).source.expression || ''); return { typed: /#table\s*\(\s*type table \[/.test(e), n: (e.match(/\{#date|\{"/g) || []).length, e }; };
  const RW = Object.fromEntries(['Sales', 'Branches', 'Products', 'Calendar'].map((t) => [t, rowsOf(t)]));
  const days = [...RW.Calendar.e.matchAll(/#date\((\d+), (\d+), (\d+)\)/g)].map((m) => Date.UTC(+m[1], +m[2] - 1, +m[3]));
  chk(() => Object.values(RW).every((r) => r.typed) && RW.Sales.n === 648 && RW.Branches.n === 6 && RW.Products.n === 12 && days.length === 546 && days.every((d, i) => !i || d - days[i - 1] === 86400000),
    () => `C9. typed #table partitions with 648, 6, 12 and 546 rows, every Calendar day once: ${JSON.stringify(Object.fromEntries(Object.entries(RW).map(([k, v]) => [k, { typed: v.typed, n: v.n }])))} days ${days.length}`);
  const ce = await call(s, 'check_report', { path: 'Gulf Retail Sample/Gulf Retail.pbip' });
  chk(() => !ce.err && ce.j.validator && ce.j.validator.ran !== false && ce.j.validator.errors === 0, () => `C10. the sample's empty report: Microsoft's validator 0 errors: ${short(ce)}`);

  // ---------- C11-C15: the tour, run ----------
  const tour = WJ.tour || [], step = (tool) => tour.find((x) => x.call && x.call.tool === tool && (tool !== 'plan_layout' || !x.call.args.languages)) || { call: { args: {} } };
  const t1 = step('plan_layout'), { pl, args } = await planReport(t1.call.args), rid = pl.j && pl.j.plan && pl.j.plan.planId;
  if (rid) await approve(rid);
  const send = Object.assign({}, args, { planId: rid, design: pl.j && pl.j.design, fields: args.planFields }); delete send.planFields;
  const rep = rid ? await call(w, 'create_report', send) : { err: true, t: 'no plan: ' + short(pl) };
  const open = rep.j && rep.j.open, cr = open ? await call(s, 'check_report', { path: open }) : { err: true, t: 'nothing written' };
  chk(() => !rep.err && open === 'Gulf Retail Sample/Gulf Retail Sales.pbip' && !cr.err && cr.j.validator.errors === 0, () => `C11. tour step 1 writes a report; Microsoft's validator 0 errors: ${short(rep)} check: ${short(cr)}`);
  const t2 = tour.find((x) => x.call && x.call.tool === 'plan_layout' && x.call.args.languages === 'en+ar') || { call: { args: {} } };
  const p2 = (await planReport(t2.call.args)).pl;
  chk(() => !p2.err && p2.j.plan && p2.j.plan.planId && p2.j.bilingual, () => `C12. tour step 2 (English and Arabic in one report) plans without a problem: ${short(p2)}`);
  const tw = open ? await call(s, 'create_arabic_twin', { path: open }) : { err: true, t: 'no report' };
  chk(() => !tw.err && tw.j.plan && tw.j.plan.planId && !fs.existsSync(path.join(ROOT, 'Gulf Retail Sample/Gulf Retail Sales AR.pbip')), () => `C13. create_arabic_twin's plan on the tour's report: a plan id, nothing written: ${short(tw)}`);
  const gc = await call(s, 'add_gulf_calendar', step('add_gulf_calendar').call.args);
  chk(() => !gc.err && gc.j.plan && gc.j.plan.planId, () => `C14. tour step 3, the Gulf calendar: a plan id: ${short(gc)}`);
  const ln = await call(s, 'check_report', step('check_report').call.args);
  chk(() => !ln.err && ln.j && /arabic/i.test(JSON.stringify(ln.j).slice(0, 4000)) && step('check_report').call.args.path === open, () => `C15. tour step 4, check_report lens "arabic" on the tour's report: ${short(ln)}`);

  // ---------- C16-C17: never over anything ----------
  const first = hashes(path.join(ROOT, 'Gulf Retail Sample'));
  const p3 = await call(w, 'plan_layout', { sample: true }), pid3 = p3.j && p3.j.plan && p3.j.plan.planId;
  if (pid3) await approve(pid3);
  const w3 = pid3 ? await call(w, 'create_report', { sample: true, path: p3.j.sample.folder, planId: pid3 }) : { err: true, t: short(p3) };
  chk(() => p3.j.sample.folder === 'Gulf Retail Sample 2' && !w3.err && filesOf(path.join(ROOT, 'Gulf Retail Sample 2')).length === 16 && JSON.stringify(hashes(path.join(ROOT, 'Gulf Retail Sample'))) === JSON.stringify(first),
    () => `C16. a second sample: "Gulf Retail Sample 2", the first untouched: ${short(p3)} ${short(w3)}`);
  const p4 = await call(w, 'plan_layout', { sample: true }), pid4 = p4.j && p4.j.plan && p4.j.plan.planId, f4 = p4.j && p4.j.sample && p4.j.sample.folder;
  if (pid4) await approve(pid4);
  if (f4) { fs.mkdirSync(path.join(ROOT, f4)); fs.writeFileSync(path.join(ROOT, f4, 'mine.txt'), 'the person\'s own file'); }
  const w4 = pid4 ? await call(w, 'create_report', { sample: true, path: f4, planId: pid4 }) : { err: true, t: '' };
  chk(() => f4 === 'Gulf Retail Sample 3' && w4.err && /Nothing was written/.test(w4.t) && JSON.stringify(filesOf(path.join(ROOT, f4))) === '["mine.txt"]', () => `C17. a folder taken after the plan: refused, nothing written over: ${short(w4)}`);

  // ---------- C18: no real company, no employer data ----------
  const written = filesOf(path.join(ROOT, 'Gulf Retail Sample')).filter((f) => !/^Gulf Retail Sales/.test(f)).map((f) => [f, fs.readFileSync(path.join(ROOT, 'Gulf Retail Sample', f), 'utf8')]);
  const text = written.map(([f, t]) => f + '\n' + t).join('\n');
  const deny = DENY.filter(([n]) => new RegExp(`(^|[^\\p{L}])${n.replace(/ /g, '\\s+')}([^\\p{L}]|$)`, 'iu').test(text)).map(([n, why]) => `${n} (${why})`);
  const trade = (text.match(TRADE) || [])[0];
  const terms = termsOf(process.env.DENY_TERMS || ''), hits = terms.length ? written.flatMap(([f, t]) => scanText(f + '\n' + t, terms, f)) : [];
  chk(() => written.length === 16 && !deny.length && !trade && !hits.length,
    () => `C18. the sample holds no real retailer or mall, no vehicle-trade word and nothing of the employer-data scan: ${deny.join(', ')} ${trade || ''} ${hits.length ? hits.length + ' scan hits (terms by number: ' + [...new Set(hits.map((h) => h.term))].join(',') + ')' : ''}`);
  if (!terms.length) console.warn('NOTE  C18: DENY_TERMS is not set here, so the employer-data scan ran on the deny list only (CI\'s privacy job sets it)');

  // ---------- C19-C23 ----------
  const sampleAnswers = answers.filter((x) => x.tool === 'plan_layout' || x.tool === 'create_report');
  chk(() => [p, pw, wr, p3, w3].every((x) => String(x.t).length < 40000), () => `C19. every answer of the sample under 40,000 characters: ${[p, pw, wr, p3, w3].map((x) => String(x.t).length).join(', ')} (${sampleAnswers.length} report answers)`);
  const tl = Object.fromEntries(meta.tools.map((t) => [t.name, t])), badCalls = [];
  tour.forEach((x, i) => { const t = tl[(x.call || {}).tool]; if (!t) { badCalls.push(`${i + 1}: no tool ${(x.call || {}).tool}`); return; } const props = (t.inputSchema || {}).properties || {};
    Object.entries(x.call.args || {}).forEach(([k, v]) => { const pr = props[k]; if (!pr) badCalls.push(`${i + 1}: ${t.name} has no input ${k}`); else if (pr.enum && !pr.enum.includes(v)) badCalls.push(`${i + 1}: ${t.name}.${k} "${v}" is not one of ${pr.enum}`); }); });
  chk(() => tour.length === 4 && !badCalls.length && tour.every((x) => typeof x.ask === 'string' && x.ask.length > 10) && ['plan_layout', 'add_gulf_calendar', 'check_report'].every((n) => tour.some((x) => x.call.tool === n)),
    () => `C20. the tour: 4 steps, each a real tool with real inputs: ${badCalls.join('; ')} ${JSON.stringify(tour).slice(0, 400)}`);
  const pa = await call(w, 'plan_layout', { sample: true, lang: 'ar' }), pida = pa.j && pa.j.plan && pa.j.plan.planId;
  if (pida) await approve(pida);
  const wa = pida ? await call(w, 'create_report', { sample: true, path: pa.j.sample.folder, lang: 'ar', planId: pida }) : { err: true, t: short(pa) };
  chk(() => !wa.err && (wa.j.tour || []).length === 4 && wa.j.tour.every((x) => AR.test(x.ask)) && tour.every((x) => !AR.test(x.ask)) && AR.test(wa.j.sayFirst || ''),
    () => `C21. an Arabic request: the tour in Arabic (and in English otherwise): ${short(wa)}`);
  const pdesc = (tl.plan_layout || {}).description || '';
  chk(() => !empty.err && /sample/i.test(JSON.stringify(empty.j || empty.t)) && /plan_layout/.test(JSON.stringify(empty.j || empty.t)) && /sample/.test(pdesc) && /no model/i.test(pdesc),
    () => `C22. the empty working folder's answer offers the sample, and plan_layout's description says it: ${short(empty)}`);
  const readme = fs.readFileSync(path.join(HERE, 'README.md'), 'utf8'), at = readme.indexOf('Try the sample'), tools = readme.search(/^\| `read_model` \|/m);
  chk(() => at > 0 && tools > 0 && at < tools && /sample: true/.test(readme.slice(tools)), () => `C23. README: "Try the sample" before the tools, and the option's line under them (at ${at}, tools ${tools})`);
} finally {
  await s.close(); await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true }); fs.rmSync(LOGS, { recursive: true, force: true });
}

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  test-0.3.1-sample-project  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  test-0.3.1-sample-project  ${checks} checks`);
