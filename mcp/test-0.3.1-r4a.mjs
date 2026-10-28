import './test-env.mjs';
// 0.3.1 R4A (the owner's E1 round 4, 27 Oct: 19 simulated testers on e2236be7): the builder's items, each at its cause;
// written red first (mcp/work/R4A.md). Made-up models and names only: no employer or client data.
//   A  the slicer DataArcus adds is listed by the plan, and create_report takes the list the plan showed (the asked ones,
//      or the asked ones and exactly the added ones): the same approved files; any other slicer still refused
//   B  a refusal for inputs that differ names the values and the exact input to pass, for every kind of difference
//   C  plain words where the person decides: a chart's kind, the cards over a chart, a date column with no type, CS1's
//      text lines, a custom visual's own settings, every item worth a look listed, the working folder by its path
//   D  the approval page starts with one plain line: what is written and where; the counts folded under it
//   E  the laptop's rc.1 run (27 Oct, section 6): the app's prompt in Arabic for an Arabic plan and with the name the write
//      uses; each script by its own kind; an approved Arabic matched to a label with spaces; the language button's side
//   node test-0.3.1-r4a.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { keepEnglish } from './test-plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), require = createRequire(import.meta.url);
const LL = require('../assets/js/label-limits.js'), LC = require('../assets/js/layout-check.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const J = (x) => JSON.stringify(x).slice(0, 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const text = (html) => unesc(String(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
const AR = /[؀-ۿ]/, NUMBERS = /\bpx\b|\bletters?\b|\d+ ?pt\b/;

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-r4a-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-r4a-log-')));
process.env.DATAARCUS_ROOT = ROOT;
const Approval = await import('./lib/approval-window.mjs');
const Plans = await import('./lib/plans.mjs');
const PlanLint = await import('./lib/plan-lint.mjs');
const Words = await import('./lib/plain-words.mjs');
const S = await import('./lib/sample-project.mjs');

// ---------- C: plain words (in process) ----------
{
  // C1 the column -> bar note: the person's words hold no pixels or letter widths; the numbers stay in why (the agent's)
  const m509 = LL.decide({ axis: 'monthShort', lang: 'en', width: 509, count: 12 }), t8 = LL.decide({ names: ['Debtconsolidation', 'Home', 'Car', 'Travel', 'Wedding', 'Medical', 'Education', 'Business'], lang: 'en', width: 600, count: 8 });
  chk(() => m509.kind === 'bar' && m509.said === 'A bar chart, not columns: 12 months would be cut or slanted under columns.' && /42 px a category/.test(m509.why)
    && t8.kind === 'bar' && t8.said === 'A bar chart, not columns: 8 names would be cut or slanted under columns.',
    () => `C1. the bar note in plain words (12 months; 8 names), the measured numbers kept in why: ${J([m509, t8])}`);
  chk(() => typeof m509.saidAr === 'string' && AR.test(m509.saidAr) && !NUMBERS.test(m509.saidAr) && /12/.test(m509.saidAr), () => `C1ar. the same in Arabic: ${J(m509)}`);
  // C2 the approval page's "Written as another kind" row says the plain words (and their Arabic on an Arabic page)
  const kinds = [{ role: 'Comparison', from: 'column', to: 'bar', why: m509.why, said: m509.said, saidAr: m509.saidAr }];
  const rowOf = (lang) => { const s = Approval.summary('report', { pins: { create_report: { name: 'R', lang, design: { layout: { preset: 'exec' } }, fields: {} } }, kinds });
    const r = ((s.sections.find((x) => x.heading === 'Layout') || { rows: [] }).rows.find((x) => x[0] === 'Written as another kind') || [])[1]; return JSON.stringify(r || null); };
  chk(() => rowOf('en').includes(m509.said) && !NUMBERS.test(rowOf('en')), () => `C2. the kinds row: plain words, no pixels: ${rowOf('en')}`);
  chk(() => rowOf('ar').includes(m509.saidAr), () => `C2ar. the kinds row on an Arabic page: the Arabic words: ${rowOf('ar')}`);

  // C3-C4 the layout check: the cards over a chart (DataArcus's "no data" pattern) and a date column with no type
  const vis = (type, x, y, w, h, fields) => ({ type, x, y, w, h, z: 0, fields: fields || {}, sort: [], filters: [], format: {}, title: 'T' });
  const month = { kind: 'column', table: 'Calendar', name: 'Month Year' };
  const inv = { pages: [{ n: 1, name: 'P', id: 'p1', w: 1280, h: 720, visuals: [vis('lineChart', 20, 20, 600, 300, { Category: [month] }), vis('cardVisual', 20, 20, 600, 300)] }] };
  const L = LC.lint(inv, [{ name: 'Calendar', columns: [{ name: 'Month Year', dataType: 'unknown' }] }], null, { titles: false });
  const cover = L.findings.find((f) => f.rule === 'COVER_CARDS') || {}, untyped = L.findings.find((f) => f.rule === 'AXIS_TEXT_TIME_UNSORTED') || {};
  chk(() => /no data/.test(cover.why || '') && /meant/.test(cover.why || '') && !/not counted as overlaps|pattern\)/.test(cover.why || '') && /^nothing to do/i.test(cover.fix || ''),
    () => `C3. the cards over a chart, said as meant: ${J(cover)}`);
  chk(() => /alphabetical/.test(untyped.why || '') && !/DAX table\)|model's files/.test(untyped.why || '') && (untyped.why || '').split(/\.\s/).length === 1 && /sort by column|Sort by column/i.test(untyped.fix || ''),
    () => `C4. a date column with no type: what happens and what to do, plain: ${J(untyped)}`);

  // C5 every item worth a look is listed: "N more worth a look" is followed by the N items
  const worth = Array.from({ length: 14 }, (_, i) => ({ origin: 'lint', rule: 'BAR_FIT', severity: 'note', guess: true, page: { n: 1 }, place: `the bar chart ${i + 1}`, what: `item ${i + 1}`, fix: 'none' }));
  const cs = PlanLint.checkSummary({ summary: '0 problems Power BI Desktop would show, 14 more worth a look', desktop: 0, worth: 14, problems: [], worthALook: worth }, 8);
  chk(() => (cs.worthALookItems || []).length === 14 && !cs.worthALookMore, () => `C5. 14 worth a look: 14 items listed: ${(cs.worthALookItems || []).length} ${cs.worthALookMore}`);
  // C6-C7 CS1's text lines on the redesign's page: no "X -> X", plain class names, "set to" / "removed"
  const shown = { original: 'Sales', newReport: 'Sales redesign', pages: [{ page: 'Overview', changes: [{ visual: 'v1', type: 'clusteredBarChart', text: [
    { class: 'largeTitle', property: 'fontFamily', from: 'Segoe UI', to: 'Segoe UI' }, { class: 'largeTitle', property: 'fontSize', from: '14pt', to: '12pt' }, { class: 'largeTitle', property: 'bold', from: 'bold', to: 'the theme\'s' }] }] }],
  text: { mode: 'report', set: [{ class: 'largeTitle', what: 'visual titles', font: 'Segoe UI', size: '12pt' }], boldItalic: 'b', theme: 't', removed: 3 } };
  const rs = Approval.summary('redesign', { shown }), all = JSON.stringify(rs.sections);
  chk(() => !/Segoe UI -> Segoe UI/.test(all) && !/largeTitle/.test(all) && /visual titles/.test(all), () => `C6. no no-op line, plain role names: ${all.slice(0, 900)}`);
  chk(() => /set to 12pt/.test(all) && /bold.{0,40}removed|removed.{0,40}bold/.test(all) && !/->/.test(all), () => `C7. "set to" when set, "removed" only when removed: ${all.slice(0, 900)}`);

  // C9 the working folder by its path, never only "in the working folder"
  const ws = Words.whereSaid(ROOT), wsAr = Words.whereSaid(ROOT, undefined, true);
  chk(() => ws.includes(ROOT) && wsAr.includes(ROOT) && !/itself$/.test(ws), () => `C9. the working folder said with its path: ${ws} | ${wsAr}`);
  const smp = Approval.summary('sample', { pins: { create_report: { lang: 'en' } }, sample: { folder: 'Gulf Retail Sample' } }), folderRow = JSON.stringify(smp.sections[0].rows.find((r) => r[0] === 'Folder' || (r[0] && r[0].en === 'Folder')));
  const smpAr = Approval.summary('sample', { pins: { create_report: { lang: 'ar' } }, sample: { folder: 'Gulf Retail Sample' }, sampleAr: {} }), folderAr = JSON.stringify(smpAr.sections[0].rows.find((r) => r[0] && r[0].en === 'Folder'));
  chk(() => folderRow.includes(JSON.stringify(path.join(ROOT, 'Gulf Retail Sample')).slice(1, -1)) && folderAr.includes(JSON.stringify(path.join(ROOT, 'Gulf Retail Sample')).slice(1, -1)), () => `C9b. the sample's folder and where it is: ${folderRow} | ${folderAr}`);
}

// ---------- C8: a custom visual's own settings, in plain words ----------
{
  const VM = await import('./lib/visual-meaning.mjs');
  // the words come from the shared phrase (ownSettingsSaid): checked directly
  const said = VM.ownSettingsSaid ? VM.ownSettingsSaid({ count: 1, named: ['needle'], kept: [], rest: ['needle'], hidden: 0 }) : '';
  chk(() => said && !/\(1: needle\)/.test(said) && /1 setting/.test(said) && /"needle"/.test(said) && /not carried over/.test(said), () => `C8. a custom visual's own settings in plain words: ${said || 'no ownSettingsSaid'}`);
}

// ---------- E: the app's own approval prompt and the twin's texts (in process) ----------
{
  const plan = { id: 'plan-0000000e1', kind: 'report', writes: ['the report "<name>.Report" and its "<name>.pbip" in the folder "Gulf Retail Sample", next to the model, with the theme inside it (create_report)'] };
  const data = (lang) => ({ pins: { create_report: { name: 'Gulf Retail Sales', lang } }, writesAr: ['التقرير «<name>.Report» وملف «<name>.pbip» في المجلد «Gulf Retail Sample»، بجانب النموذج، ومعه السمة (create_report)'],
    outputs: ['Gulf Retail Sales - New design.pbip', 'Gulf Retail Sales - New design.Report/definition/report.json'] });
  const ar = Approval.promptText ? Approval.promptText(plan, data('ar')) : '', en = Approval.promptText ? Approval.promptText(plan, data('en')) : '';
  const box = Approval.promptBox ? Approval.promptBox(plan, data('ar')) : {};
  chk(() => AR.test(ar.split('\n')[0]) && /التقرير «Gulf Retail Sales - New design\.Report»/.test(ar) && /the report "Gulf Retail Sales - New design\.Report"/.test(ar) && AR.test(box.title || '') && !AR.test(en),
    () => `E1 (a). an Arabic plan's app prompt: Arabic first, the English line under it; an English plan's: English: ${ar.slice(0, 400)} | ${J(box)}`);
  chk(() => /"Gulf Retail Sales - New design\.pbip"/.test(en) && !/"Gulf Retail Sales\.(Report|pbip)"/.test(en) && /Gulf Retail Sales - New design/.test(Approval.summary('report', data('en')).title),
    () => `E2 (b). the prompt and the page name the report the write uses, not the taken name: ${en.slice(0, 400)}`);
  const cal = Approval.promptSummary('calendar', { pins: { add_gulf_calendar: { path: 'x' } }, outputs: ['Gulf Retail - add Gulf calendar.tmdl'] });
  const kinds = Approval.groupFiles(['R - fix formats.tmdl', 'R - Arabic calendar.tmdl', 'R - something.tmdl']).map((g) => g.label);
  chk(() => /Gulf calendar script \(1\)/.test(cal) && !/Format script/.test(cal) && J(kinds) === J(['Format script', 'Arabic calendar script', 'Script']), () => `E3 (c). each script by its own kind: ${cal} | ${J(kinds)}`);
  // (e) the language button's side: where it is written, not where its language would put it (the right end taken)
  const Copy = await import('./lib/twin-copy.mjs');
  const wall = { name: 'v1', position: { x: 600, y: 0, z: 0, width: 680, height: 25 }, visual: { visualType: 'textbox', objects: {} } };
  const b = Copy.langButton({ width: 1280, height: 720 }, [wall], [null], 'en', 'p2', 'btn1', {});
  chk(() => b.json && b.json.position.x + b.json.position.width <= 600 && /left/.test(b.at) && !/right/.test(b.at), () => `E5 (e). the button said where it is written: ${J({ at: b.at, pos: b.json && b.json.position })}`);
}

// ---------- B: a refusal names what differs and the input to pass ----------
{
  const D = Plans.inputDifferences;
  const off = D ? D({ name: 'Sales', fields: { slicers: ['Sales[Channel]', 'Calendar[Year]'] }, displayNames: { 'Sales[Channel]': 'Channel' } },
    { name: 'Sales 2', fields: { slicers: ['Sales[Channel]', 'Products[Brand]'] }, displayNames: { 'Sales[Channel]': 'Sales channel' } }) : [];
  const s = off.join('; ');
  chk(() => /^displayNames\b/.test(off[0] || '') && /^fields \(slicers/.test(off[1] || '') && /^name\b/.test(off[2] || ''), () => `B1. each difference still starts with its input's name: ${s}`);
  chk(() => /Products\[Brand\]/.test(s) && /Calendar\[Year\]/.test(s) && /pass fields\.slicers/.test(s) && /\["Sales\[Channel\]","Calendar\[Year\]"\]/.test(s), () => `B2. a slicer passed that the plan doesn't hold, one it holds not passed, and the list to pass: ${s}`);
  chk(() => /"Sales 2"/.test(s) && /pass name "Sales"|pass name = "Sales"|pass name: "Sales"/.test(s) && /"Sales channel"/.test(s) && /pass displayNames/.test(s), () => `B3. a scalar and a map: the values passed and the plan's, and what to pass: ${s}`);
}

// ---------- A and D: the sample project, through the server ----------
S.sampleFiles(S.SAMPLE_FOLDER).forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
fs.cpSync(path.join(REPO, 'mcp/fixtures/health-project'), path.join(ROOT, 'health'), { recursive: true });
const log = path.join(LOGS, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
async function approve(pid) {
  const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n); const html = url ? await req(url, 'GET') : '';
  if (url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId: pid }); }
  return html;
}
const slicersOf = (dir) => { const out = []; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else if (e.name === 'visual.json') { const v = JSON.parse(fs.readFileSync(f, 'utf8')); if (v.visual && v.visual.visualType === 'slicer') { const q = JSON.stringify(v.visual.query || {}); const m = /"Entity":"([^"]+)"\}\},"Property":"([^"]+)"/.exec(q); if (m) out.push(`${m[1]}[${m[2]}]`); } } }); if (fs.existsSync(dir)) rec(dir); return [...new Set(out)].sort(); };
try {
  const first = S.tour(S.SAMPLE_FOLDER, 'en')[0].call.args, asked = first.planFields.slicers;
  // (0.3.1 CX1, F01: an Arabic plan whose titles would be English gets no plan id) the sample's two fields with no Arabic
  // name are kept English on purpose: these checks are about the slicers and the approval page, not the names
  const KEPT = keepEnglish('Sales[Units Sold]', 'Sales[Average Basket]');
  const plan = async (name, lang) => { const a = Object.assign({}, first, { name, lang: lang || 'en' }, lang === 'ar' ? { displayNames: KEPT } : {}); const pl = await w.call('plan_layout', a); return { a, pl, id: pl.j && pl.j.plan && pl.j.plan.planId, sl: (pl.j && pl.j.slicers) || {} }; };
  const write = (p, slicers) => { const send = Object.assign({}, p.a, { planId: p.id, design: p.pl.j && p.pl.j.design, fields: Object.assign({}, p.a.planFields, { slicers }) }); delete send.planFields; return w.call('create_report', send); };

  // A1 the plan's text says which list create_report takes (English and Arabic)
  const p1 = await plan('R4A One'), pAr = await plan('R4A Ar', 'ar'), added = p1.sl.added || [], listed = p1.sl.written || [];
  chk(() => p1.id && added.length === 1 && listed.length === 3 && /create_report/.test(p1.sl.sayInPlan || '') && /fields\.slicers/.test(p1.sl.sayInPlan || '') && listed.every((f) => (p1.sl.sayInPlan || '').includes(f)),
    () => `A1. the plan says which slicers to pass to create_report: ${J(p1.sl)} ${short(p1.pl)}`);
  chk(() => /create_report/.test(pAr.sl.sayInPlan || '') && AR.test(pAr.sl.sayInPlanAr || ''), () => `A1ar. an Arabic plan too: ${J(pAr.sl)}`);
  // A2 the asked list writes the approved files
  if (p1.id) await approve(p1.id);
  const w1 = p1.id ? await write(p1, asked) : { err: true, t: 'no plan' };
  // A3 the listed three (the asked plus exactly the added one) write the approved files of their own plan
  const p2 = await plan('R4A Two'); if (p2.id) await approve(p2.id);
  const w2 = p2.id ? await write(p2, asked.concat(p2.sl.added || [])) : { err: true, t: 'no plan' };
  chk(() => !w1.err && w1.j.exact && w1.j.exact.digest === p1.pl.j.exactCheck.digest, () => `A2. the asked slicers write the approved files: ${short(w1)}`);
  chk(() => !w2.err && w2.j.exact && w2.j.exact.digest === p2.pl.j.exactCheck.digest, () => `A3. the listed slicers (asked + added) write the approved files: ${short(w2)}`);
  const s1 = slicersOf(path.join(ROOT, S.SAMPLE_FOLDER, 'R4A One.Report')), s2 = slicersOf(path.join(ROOT, S.SAMPLE_FOLDER, 'R4A Two.Report'));
  chk(() => s1.length === 3 && J(s1) === J(s2) && J(s1) === J(listed.slice().sort()), () => `A4. both reports bind the same 3 slicers, the plan's list: ${J(s1)} ${J(s2)} ${J(listed)}`);
  // A5 any other list is refused, nothing written (a fourth slicer: the schema's limit of 3 refuses it first)
  const p3 = await plan('R4A Three'); if (p3.id) await approve(p3.id);
  const other = await write(p3, asked.concat(['Products[Category]'])), four = await write(p3, listed.concat(['Products[Category]'])), alone = await write(p3, added);
  chk(() => [other, alone].every((x) => x.err && /Nothing was written/.test(x.t)) && four.err && /Nothing was written|at most 3|<=3 items/.test(four.t) && !fs.existsSync(path.join(ROOT, S.SAMPLE_FOLDER, 'R4A Three.pbip')),
    () => `A5. another slicer, a fourth, the added one alone: refused, nothing written: ${short(other)} | ${short(four)} | ${short(alone)}`);
  chk(() => /Products\[Category\]/.test(other.t) && /pass fields\.slicers/.test(other.t), () => `B4. the refusal names the slicer the plan doesn't hold and the list to pass: ${short(other)}`);

  // C5b the check of DataArcus's own report (as before a write) counts its "no data" cards and never lists them as worth a look
  const repFiles = []; { const top = path.join(ROOT, S.SAMPLE_FOLDER); const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else repFiles.push({ path: path.relative(top, f).split(path.sep).join('/'), data: fs.readFileSync(f, 'utf8') }); }); if (fs.existsSync(path.join(top, 'R4A One.Report'))) rec(path.join(top, 'R4A One.Report')); }
  const own = repFiles.length ? LC.checkProject(repFiles, {}) : { counts: {}, worthALook: [{ rule: 'none read' }] };
  chk(() => own.counts.COVER_CARDS > 0 && !own.worthALook.some((f) => f.rule === 'COVER_CARDS') && !/no data/.test(JSON.stringify(own.worthALook)), () => `C5b. the "no data" cards are counted, not listed as worth a look: ${J({ counts: own.counts, worth: own.worthALook })}`);
  // C2b the plan answer's kind changes carry the plain words beside the measured why
  const ph = await w.call('plan_layout', { path: 'health', name: 'J11', layout: 'exec', secondPage: false }), ks = (ph.j && ph.j.kindChanges && ph.j.kindChanges.slots) || [];
  chk(() => ks.length && ks.every((x) => typeof x.said === 'string' && !NUMBERS.test(x.said) && typeof x.why === 'string'), () => `C2b. the plan's kind changes: said (plain) and why (measured): ${J(ks)}`);

  // D the approval page's first line: what is written and where; the counts folded under it
  const p4 = await plan('R4A Four'), html = p4.id ? (await (async () => { const n = links().length; await w.call('approve_plan', { planId: p4.id }); const url = await linkAt(n); return url ? req(url, 'GET') : ''; })()) : '';
  const body = String(html).split('<body')[1] || '', h1end = body.indexOf('</h1>'), lead = body.indexOf('class="lead"'), firstP = body.slice(h1end, lead);
  chk(() => /1 new report: \d+ pages, next to your model, in the folder "Gulf Retail Sample"/.test(text(firstP)) && text(firstP).includes(path.join(ROOT, S.SAMPLE_FOLDER)),
    () => `D1. the page starts with one plain line, the folder and where it is: ${text(firstP).slice(0, 400)}`);
  const counts = /\d+ visuals/.exec(text(body)), at = counts ? body.indexOf(counts[0].split(' ')[0] + ' visuals') : -1, before = body.slice(0, Math.max(0, at));
  chk(() => at > 0 && before.lastIndexOf('<details') > before.lastIndexOf('</details>'), () => `D2. the counts (visuals, bookmarks, phone layouts) are folded: ${text(body).slice(0, 600)}`);
  const pa = await plan('R4A Ar2', 'ar'), htmlAr = pa.id ? (await (async () => { const n = links().length; await w.call('approve_plan', { planId: pa.id }); const url = await linkAt(n); return url ? req(url, 'GET') : ''; })()) : '';
  const bAr = String(htmlAr).split('<body')[1] || '', firstAr = bAr.slice(bAr.indexOf('</h1>'), bAr.indexOf('class="lead"'));
  chk(() => /تقرير جديد/.test(text(firstAr)) && text(firstAr).includes(path.join(ROOT, S.SAMPLE_FOLDER)), () => `D3. the Arabic page's first line in Arabic: ${text(firstAr).slice(0, 400)}`);
  // E4 (d): the approved Arabic of "Reset filters" reaches the button whose text is "  Reset filters"; the plan says so
  const t2 = S.tour(S.SAMPLE_FOLDER, 'en')[1].call.args, bi = await w.call('plan_layout', Object.assign({}, t2, { name: 'R4A Bi', arabicTexts: { 'Reset filters': 'إعادة ضبط الفلاتر' } }));
  const rt = ((bi.j && bi.j.bilingual && bi.j.bilingual.texts) || []).find((t) => /^\s+Reset filters$/.test(t.text || ''));
  chk(() => rt && rt.arabic && rt.arabic.trim() === 'إعادة ضبط الفلاتر' && /spaces/.test(rt.spaces || ''), () => `E4 (d). a label with spaces takes the approved Arabic, and the plan says so: ${J(rt || null)} ${short(bi)}`);
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true }); fs.rmSync(LOGS, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL script=test-0.3.1-r4a.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  r4a  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  r4a  ${checks} checks`);
