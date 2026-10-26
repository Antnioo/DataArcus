// SQ10 (0.3.1, the night run of the "Seen, not in scope" queue; mcp/work/SQ10.md): the plan's and create_report's
// notes. Written red first, one block per item of mcp/work/SEEN-QUEUE.md:
//   0.2.9-design-S13          a table made smaller and short of fields: the smaller-text note doesn't say "left out only"
//   0.2.9-writer-S19          a report measure renamed: the note names the cause (this table, another, a report measure)
//   audit-3-picker-writer-S2  two fields whose "T[c]" text is the same are two fields (by table and name), never one
//   WORK-2026-10-05-09-S2     an English right-to-left table's total says "Total", an Arabic one «الإجمالي»
//   AF2-S3                    the format script is never said to be "the same file check_model_health writes"
//   AF2-S4                    a format script already there is listed as already there, never as written
//   J17-S2                    the Ramadan note names the Hijri-year column the person confirmed
//   K2-S1                     the bilingual plan and its approval page say "Not fully Arabic"
//   L6-S4                     a redesign with report options it never uses: plan problems, not silence
//   Q1-S8                     the plan's flip cards: one entry per card, with its pages
//   S9-S4                     each module imported once
// Made-up models only (a small sales model and calendar written here, the fixture health-project): no employer data.
//   node test-0.3.1-sq10.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import * as Approval from './lib/approval-window.mjs';
import * as Said from './lib/report-said.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/<\/?bdi[^>]*>/g, '').replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const short = (x) => (x && x.err ? String(x.t).slice(0, 300) : JSON.stringify(x && x.j).slice(0, 300));
const fn = (name) => (typeof Said[name] === 'function' ? Said[name] : () => { throw new Error(`report-said.mjs has no ${name}`); });

// ---------- the sentences alone (report-said.mjs, as create_report's run says them) ----------
{
  // 0.2.9-design-S13
  const small = [{ page: 'Details', size: 9, from: 10 }];
  const both = get(() => fn('tableSmallerSaid')(small, [{ page: 'Details', kept: [{ t: 'Sales', c: 'Region' }], leftOut: [{ t: 'Sales', m: 'Orders' }] }]));
  chk(() => /The table text is 9pt \(the theme's is 10pt\) on "Details"/.test(both) && !/left out only/.test(both), () => `S13a. a table made smaller and also short of fields: no "a field is left out only where even 8pt doesn't hold it" (the next note lists what was left out): ${JSON.stringify(both)}`);
  const alone = get(() => fn('tableSmallerSaid')(small, []));
  chk(() => /a field is left out only where even 8pt doesn't hold it\.$/.test(alone), () => `S13b. guard: a table made smaller with every field kept keeps the clause: ${JSON.stringify(alone)}`);

  // 0.2.9-writer-S19
  const names = { Sales: ['Amount', 'Row label: Region'], Orders: ['No data: Orders'] };
  const ren = (x) => get(() => fn('extRenamedSaid')([x], names));
  const own = ren({ t: 'Sales', from: 'Row label: Region', to: 'Row label: Region (2)' });
  chk(() => /^Sales already has "Row label: Region", so the report's own measure is "Row label: Region \(2\)"/.test(own), () => `S19a. the measure's own table has the name: said as before: ${JSON.stringify(own)}`);
  const other = ren({ t: 'Sales', from: 'No data: Orders', to: 'No data: Orders (2)' });
  chk(() => /the model's table Orders already has "No data: Orders"/.test(other) && !/^Sales already has/.test(other), () => `S19b. another model table has the name: that table is named, never "Sales already has": ${JSON.stringify(other)}`);
  const rep = ren({ t: 'Sales', from: 'Keep: Calls by Agent', to: 'Keep: Calls by Agent (2)' });
  chk(() => /another of the report's own measures is named "Keep: Calls by Agent"/.test(rep) && !/already has/.test(rep), () => `S19c. no model table has it (another report measure does): said so: ${JSON.stringify(rep)}`);

  // audit-3-picker-writer-S2
  const A = { t: 'Sales', c: 'Region[x' }, B = { t: 'Sales[Region', c: 'x' };   // (one text, and one Bind.fieldKey too)
  const keys = get(() => fn('uniqueFields')([A, B, A, null]));
  chk(() => Array.isArray(keys) && keys.length === 2 && keys[0].f === A && keys[1].f === B && keys.every((k) => k.key === 'Sales[Region[x]'), () => `S2a. two fields whose "T[c]" text is the same stay two (identity by table and name), each once, its text as the tools take it: ${JSON.stringify(keys)}`);

  // WORK-2026-10-05-09-S2
  const rl = [{ page: 'Details', t: 'Sales', c: 'Region', m: 'Row label: Region' }];
  const en = get(() => fn('rowLabelSaid')(rl, 'en')), ar = get(() => fn('rowLabelSaid')(rl, 'ar'));
  chk(() => /^The total row of the right-to-left table says "Total"/.test(en) && !/الإجمالي|Arabic table/.test(en) && /the total row then has no word/.test(en), () => `WS2a. an English right-to-left table: "Total", "right-to-left table": ${JSON.stringify(en)}`);
  chk(() => /^The total row of the right-to-left table says «الإجمالي»/.test(ar), () => `WS2b. an Arabic one: «الإجمالي»: ${JSON.stringify(ar)}`);
  const sk = get(() => fn('rowLabelSkippedSaid')([{ page: 'Details', t: 'Sales', c: 'Re\tgion' }], 'en'));
  chk(() => /has no "Total"/.test(sk) && !/الإجمالي/.test(sk), () => `WS2c. the skipped note in English says "Total" too: ${JSON.stringify(sk)}`);

  // K2-S1: the report's page shows the bilingual plan's line, escaped like every row
  const S = get(() => Approval.summary('report', { pins: { create_report: { name: 'BI', lang: 'en' } }, bilingual: { copy: { report: 'BI.Report', pbip: 'BI.pbip' }, pairs: [], buttons: [], syncGroups: [], notFullyArabic: { en: 'Not fully Arabic: <img src=x onerror=1>.', ar: 'ليست عربية بالكامل: <b>x</b>.' } } }));
  const H = get(() => Approval.approvalHtml({ id: 'plan-0123456789ab', kind: 'report', writes: ['the report "<name>.Report"'] }, Object.assign({}, S, { name: 'BI' })));
  chk(() => typeof H === 'string' && /Not fully Arabic/.test(unesc(H)) && /ليست عربية بالكامل/.test(unesc(H)) && !/<img src=x|<b>x/.test(H) && /&lt;img src=x/.test(H), () => `K2-S1a. the report's approval page has the "Not fully Arabic" row, escaped: ${typeof H === 'string' ? (unesc(H).match(/.{0,80}Not fully Arabic.{0,120}/) || ['none'])[0] : JSON.stringify(H)}`);
}

// ---------- S9-S4: each module imported once ----------
{
  const imports = (f) => [...fs.readFileSync(path.join(HERE, f), 'utf8').matchAll(/^import [^;]*? from '([^']+)';/gm)].map((m) => m[1]);
  const twice = (f) => imports(f).filter((x, i, l) => l.indexOf(x) !== i);
  chk(() => !twice('lib/report-run.mjs').length, () => `S9-S4a. report-run.mjs imports each module once: twice ${twice('lib/report-run.mjs')}`);
  chk(() => !twice('tools/plan_layout.mjs').length, () => `S9-S4b. plan_layout.mjs imports each module once: twice ${twice('tools/plan_layout.mjs')}`);
}

// ---------- through the tools ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sq10-')));
fs.cpSync(path.join(HERE, 'fixtures/health-project'), path.join(ROOT, 'hp'), { recursive: true });
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const modelAt = (dir, tables, relationships) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: relationships || [] } })); };
const sales = (avgFormat) => ({ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Price', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Product', 'string'), col('City', 'string'), col('Segment', 'string'), col('Order Date', 'dateTime')],
  measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }, Object.assign({ name: 'Avg Price', expression: 'DIVIDE ( SUM ( Sales[Price] ), COUNTROWS ( Sales ) )' }, avgFormat ? { formatString: avgFormat } : {})] });
modelAt('fmt', [sales(null)]);
modelAt('g', [sales('#,0.00')]);
modelAt('ram', [sales('#,0.00'), { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), col('Is Ramadan', 'boolean'), col('AH', 'int64'), col('Month', 'string')] }],
  [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }]);
fs.cpSync(path.join(ROOT, 'ram'), path.join(ROOT, 'ram2'), { recursive: true });
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const idOf = (r) => r && r.j && r.j.plan && r.j.plan.planId;
// the approval page (raw HTML); approve: the click, then approve_plan again
const pageOf = async (planId, approve) => {
  const n = links().length; await w.call('approve_plan', { planId }); const url = await linkAt(n), html = url ? await req(url, 'GET') : '';
  if (approve && url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId }); }
  return html;
};
// every file under a folder, relative
const filesIn = (dir) => { const out = []; const walk = (d) => { if (!fs.existsSync(d)) return; fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else out.push(path.relative(dir, f).split(path.sep).join('/')); }); }; walk(dir); return out; };
// a plan made, its page read, approved, written; the files the write added
const planAndWrite = async (args) => {
  const p = await w.call('plan_layout', args), id = idOf(p); if (!id) return { p, html: '', c: { err: true, t: 'no plan: ' + short(p) }, added: [] };
  const html = await pageOf(id, true), dir = path.join(ROOT, args.path.split('/')[0]), before = filesIn(dir);
  const c = await w.call('create_report', Object.assign({}, args, { design: p.j.design, planId: id, gulfDates: undefined }));
  return { p, html, c, added: filesIn(dir).filter((f) => !before.includes(f)) };
};
try {
  // ---------- AF2-S3 and AF2-S4: the format script, written once, then already there ----------
  const SCRIPT = 'M - fix formats.tmdl';
  const one = await planAndWrite({ path: 'fmt', name: 'First', layout: 'exec', lang: 'en' });
  const f1 = (one.p.j && one.p.j.formats) || {}, w1 = (one.c.j && one.c.j.formats) || {};
  chk(() => f1.scriptAfterGo === SCRIPT && !/same file check_model_health writes/.test(JSON.stringify(f1)), () => `AF2-S3a. the plan's formats never say "the same file check_model_health writes": ${JSON.stringify(f1).slice(0, 400)}`);
  chk(() => !one.c.err && one.added.includes(SCRIPT) && w1.fixScriptFile && !/same file check_model_health writes/.test(String(w1.howToApply)), () => `AF2-S3b. the write's howToApply neither: ${short(one.c)} ${JSON.stringify(w1.howToApply || '').slice(0, 300)}`);
  const script0 = fs.readFileSync(path.join(ROOT, 'fmt', SCRIPT), 'utf8');
  const two = await planAndWrite({ path: 'fmt', name: 'Second', layout: 'exec', lang: 'en' });
  const f2 = (two.p.j && two.p.j.formats) || {}, writes2 = ((two.p.j && two.p.j.plan && two.p.j.plan.writesAfterGo) || []).join(' ');
  chk(() => f2.scriptAfterGo === SCRIPT && /already there/i.test(String(f2.alreadyThere || '')) && !f2.notWrittenYet, () => `AF2-S4a. the plan names the script already there as already there, not "Not written yet": ${JSON.stringify(f2).slice(0, 500)}`);
  chk(() => !/and the format script "M - fix formats\.tmdl"(?! \(already there)/.test(writes2) && /M - fix formats\.tmdl" \(already there/.test(writes2), () => `AF2-S4b. the writes line says the script is already there, not that it writes it: ${writes2.slice(0, 500)}`);
  const listed = (H) => { const i = H.indexOf('id="files"'), j = i < 0 ? -1 : H.indexOf('</ul>', i); return i < 0 || j < 0 ? '' : unesc(H.slice(i, j)); };
  chk(() => two.html && !/M - fix formats\.tmdl: the script/.test(listed(two.html)) && /Already there, not written again \(1\) M - fix formats\.tmdl/.test(unesc(two.html)), () => `AF2-S4c. the approval page lists the script as already there, never among the files written: ${listed(two.html).slice(0, 300)} | ${(unesc(two.html).match(/.{0,60}fix formats.{0,80}/g) || []).join(' | ')}`);
  chk(() => !two.c.err && !two.added.some((f) => /fix formats/.test(f)) && fs.readFileSync(path.join(ROOT, 'fmt', SCRIPT), 'utf8') === script0, () => `AF2-S4d. guard: the write writes no copy and leaves the script as it was: ${short(two.c)} ${JSON.stringify(two.added.filter((f) => /tmdl/.test(f)))}`);
  // the plan lists exactly what the write writes: the page's kinds line counts the files the write added
  const kinds = (H) => (unesc(H).match(/\d+ report: [^<]*?(?=\n|$)/) || [''])[0];
  chk(() => /1 report: /.test(kinds(two.html)) && !/1 script/.test(kinds(two.html)) && two.added.filter((f) => /\.tmdl$/.test(f)).length === 0, () => `AF2-S4e. the page's summary counts no script, and the write adds none: ${kinds(two.html).slice(0, 200)}`);

  // ---------- WORK-2026-10-05-09-S2: an English right-to-left report ----------
  const rt = await planAndWrite({ path: 'g', name: 'RTL English', layout: 'exec', lang: 'en', dir: 'rtl' });
  const notesRt = ((rt.c.j && rt.c.j.reportNotes) || []).filter((x) => /total row/.test(x));
  chk(() => notesRt.length && notesRt.every((x) => /says "Total"/.test(x) && !/الإجمالي|Arabic table/.test(x)), () => `WS2d. the English right-to-left report's total-row note says "Total": ${short(rt.c)} ${JSON.stringify(notesRt).slice(0, 300)}`);

  // ---------- J17-S2: the Hijri-year column the person confirmed ----------
  const ramArgs = { path: 'ram', name: 'Ramadan', layout: 'exec', lang: 'en', pageFilters: [{ field: 'Calendar[Is Ramadan]', values: [true] }], gulfDates: { grain: 'gregorian', scope: 'all', hijriYearColumn: 'Calendar[AH]' } };
  const rm = await planAndWrite(ramArgs);
  const note = (((rm.c.j && rm.c.j.pageFilters) || [])[0] || {}).note || '';
  chk(() => /add a second page filter on the Hijri year \(Calendar\[AH\]\)/.test(note) && !/found by name/.test(note), () => `J17-S2a. the note names the confirmed Hijri-year column Calendar[AH]: ${short(rm.c)} ${note}`);
  // (on a model of its own: the person's answer is remembered for the model it was given for)
  const rm0 = await planAndWrite(Object.assign({}, ramArgs, { path: 'ram2', name: 'Ramadan 2', gulfDates: { grain: 'gregorian', scope: 'all' } }));
  const note0 = (((rm0.c.j && rm0.c.j.pageFilters) || [])[0] || {}).note || '';
  chk(() => /no Hijri year column was found by name/.test(note0), () => `J17-S2b. guard: no column confirmed and none named so: the note says it was not found: ${short(rm0.c)} ${note0}`);

  // ---------- K2-S1: the bilingual plan ----------
  const bi = await w.call('plan_layout', { path: 'g', name: 'Both', layout: 'exec', lang: 'en', languages: 'en+ar' });
  const NF = bi.j && bi.j.bilingual && bi.j.bilingual.notFullyArabic;
  chk(() => NF && /^Not fully Arabic: /.test(NF.en) && /^ليست عربية بالكامل: /.test(NF.ar), () => `K2-S1b. the bilingual plan says notFullyArabic: ${short(bi)} ${JSON.stringify(NF)}`);
  const biHtml = idOf(bi) ? await pageOf(idOf(bi)) : '';
  chk(() => /Not fully Arabic: /.test(unesc(biHtml)) && /ليست عربية بالكامل: /.test(unesc(biHtml)), () => `K2-S1c. and its approval page shows it: ${(unesc(biHtml).match(/.{0,40}fully Arabic.{0,80}/) || ['none'])[0]}`);

  // ---------- L6-S4: a redesign with report options it never uses ----------
  const rd = await w.call('plan_layout', { path: 'hp/Health Test.SemanticModel', redesignFrom: 'hp/Health Test Report.Report', daxFunctions: true, flipCards: true });
  const rdP = ((rd.j && rd.j.planProblems) || []).join(' ');
  chk(() => !idOf(rd) && /daxFunctions/.test(rdP) && /flipCards/.test(rdP), () => `L6-S4a. a redesign with daxFunctions and flipCards: plan problems name both, no plan id: ${short(rd)}`);
  const rdOk = await w.call('plan_layout', { path: 'hp/Health Test.SemanticModel', redesignFrom: 'hp/Health Test Report.Report', daxFunctions: false });
  chk(() => !/daxFunctions|flipCards/.test(((rdOk.j && rdOk.j.planProblems) || []).join(' ')), () => `L6-S4b. guard: an option at its default (daxFunctions false) is no problem: ${short(rdOk)}`);
  const sm = await w.call('plan_layout', { sample: true, daxFunctions: true });
  chk(() => !idOf(sm) && /daxFunctions/.test(((sm.j && sm.j.planProblems) || []).join(' ')), () => `L6-S4c. guard (the sample half was already true): sample with daxFunctions is a plan problem: ${short(sm)}`);

  // ---------- Q1-S8: the flip cards on two pages ----------
  const fc = await w.call('plan_layout', { path: 'g', name: 'Flip', layout: 'exec', lang: 'en', flipCards: true });
  const cards = (fc.j && fc.j.flipCards && fc.j.flipCards.cards) || [];
  chk(() => cards.length === 3 && cards.every((c) => Array.isArray(c.pages) && c.pages.length === 2 && c.page === undefined && c.measures.length === 6) && new Set(cards.map((c) => c.measure)).size === 3, () => `Q1-S8a. one entry per card (3 on 2 pages), each with its pages: ${JSON.stringify(cards.map((c) => [c.measure, c.page, c.pages]))}`);
  chk(() => JSON.stringify(cards.map((c) => c.pages)[0]) === '["Executive summary","Details"]' && cards[0].title === 'Total Sales' && cards[0].back, () => `Q1-S8b. the pages in report order, the card's title and back kept: ${JSON.stringify(cards[0]).slice(0, 300)}`);
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) {
  console.log(`FAIL script=test-0.3.1-sq10.mjs cause=${JSON.stringify(problems[0].slice(0, 200))}`);
  problems.forEach((p) => console.log('  - ' + p));
  console.log(`FAIL  sq10  ${problems.length} of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS  sq10  ${checks} checks`);
