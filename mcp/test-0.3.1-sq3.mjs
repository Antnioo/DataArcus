// SQ3 (0.3.1, the night run of the "Seen, not in scope" queue; mcp/work/SQ3.md): the approval page in English and
// Arabic, and the gate. Written red first, one block per item of mcp/work/SEEN-QUEUE.md:
//   T1-S6   an Arabic page says what the plan writes in Arabic (data.writesAr, line for line), the English line under it;
//           a writesAr that does not match the writes line for line is not shown; every Arabic line escaped
//   T1-S8   the twin's plan with no approved text says so, never "0 Arabic texts as approved"
//   T1-S9   an Arabic heading's count words in Arabic too; the report's other headings in Arabic
//   T1-S13  the twin's Options rows in Arabic («عن السكربت»), the English beside
//   D6-S3   a base theme (StaticResources/SharedResources/BaseThemes) is grouped and counted as a theme
//   A2-S9   the app's own prompt says what was not checked before writing
//   V1-S3   the EN-AR copy's English pages are drawn with the English preview tag
//   LR1-4   (the laptop run of 26 Oct) the Arabic sample page's rows in Arabic, the English line under each
//   A3-S1   (OBSOLETE: fixed before SQ3) the approved display names passed again are written; another value is refused
// Fixtures: mcp/fixtures/twin-project and health-project (made up), copied into a temp folder.
//   node test-0.3.1-sq3.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import * as Approval from './lib/approval-window.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// (an isolate around a quoted name, <bdi>, adds no space)
const unesc = (s) => String(s).replace(/<\/?bdi[^>]*>/g, '').replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const short = (x) => (x && x.err ? String(x.t).slice(0, 300) : JSON.stringify(x && x.j).slice(0, 300));
// the "Files that will be written" list of a page (raw HTML), and its items
const writesList = (H) => { const i = H.indexOf('id="files"'), j = i < 0 ? -1 : H.indexOf('</ul>', i); return i < 0 || j < 0 ? '' : H.slice(i, j); };
const items = (H) => [...writesList(H).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
const AR = /[؀-ۿ]/;
// (red first: approvalHtml is new; until it exists every page is empty)
const pageHtml = (p, sh) => { try { return Approval.approvalHtml(p, sh); } catch (e) { return ''; } };

// ---------- unit: the page as approval-window renders it (no server) ----------
{
  // T1-S6: a writesAr line for line on an Arabic page; mismatched, it is not shown; escaped
  const plan = { id: 'plan-0123456789ab', kind: 'twin', writes: ['the new report "<name> AR.Report" next to the original', 'the TMDL script "x.tmdl" next to the project'] };
  const show = (extra) => Object.assign(Approval.summary('twin', { labels: {} }), { name: 'Sales' }, extra);
  const H = pageHtml(plan, show({ writesAr: ['التقرير الجديد «<name> AR.Report» بجانب الأصل', 'سكربت TMDL «x.tmdl» بجانب المشروع'] }));
  const L = items(H);
  chk(() => L.length === 2 && AR.test(unesc(L[0])) && unesc(L[0]).includes('«Sales AR.Report»') && unesc(L[0]).includes('the new report "Sales AR.Report" next to the original') && unesc(L[1]).includes('سكربت TMDL') && unesc(L[1]).includes('the TMDL script "x.tmdl"'),
    () => `T1-S6a. on an Arabic page each write is said in Arabic, the English line under it, the report's name in both: ${L.map(unesc).join(' | ')}`);
  const M = items(pageHtml(plan, show({ writesAr: ['سطر عربي واحد فقط'] })));
  chk(() => M.length === 2 && !M.some((x) => x.includes('سطر عربي واحد فقط')) && unesc(M[0]).includes('the new report "Sales AR.Report"') && unesc(M[1]).includes('the TMDL script "x.tmdl"'),
    () => `T1-S6b. a writesAr that does not match the writes line for line is not shown (the English lines only): ${M.map(unesc).join(' | ')}`);
  const X = pageHtml(plan, show({ writesAr: ['<img src=x onerror="alert(1)"> «<b>bold</b>»', 'سكربت'] }));
  chk(() => !/<img|<b>bold/.test(X) && /&lt;img src=x/.test(X) && /&lt;b&gt;bold/.test(X), () => `T1-S6c. every Arabic writes line is escaped: ${writesList(X).slice(0, 400)}`);
  const E = pageHtml({ id: 'plan-0123456789ab', kind: 'report', writes: ['the report "<name>.Report"'] }, Object.assign(Approval.summary('report', { pins: { create_report: { name: 'R', lang: 'en' } } }), { writesAr: ['التقرير'] }));
  chk(() => !items(E).some((x) => AR.test(x)), () => `T1-S6d. an English page shows no Arabic writes line: ${items(E).join(' | ')}`);

  // T1-S9: the count words in Arabic too, beside the English heading
  const heads = (H2) => [...H2.matchAll(/<(?:h2|summary)>([\s\S]*?)<\/(?:h2|summary)>/g)].map((m) => unesc(m[1]).trim());
  const tw = heads(pageHtml(plan, Approval.summary('twin', { labels: {}, notTranslated: [{ field: '"Sales" (page name)', why: 'kept' }, { field: '"Note" (title)', why: 'kept' }] })));
  chk(() => tw.includes('تظهر بالإنجليزية (2، دون نص عربي) · Shown in English (2, no Arabic text)'), () => `T1-S9a. the twin's "Shown in English" heading with its count words in Arabic: ${tw.join(' | ')}`);
  const rp = heads(pageHtml({ id: 'plan-0123456789ab', kind: 'report', writes: ['x'] }, Approval.summary('report', { pins: { create_report: { name: 'R', lang: 'ar' } }, notTranslated: [{ field: 'Sales[Note]', why: 'none' }],
    daxFunctions: { compatibility: { raises: false, sayFirst: 'at 1702' }, functions: [{ name: 'DA.Spark', params: 'm' }, { name: 'DA.Bar', params: 'm' }], measures: [{ measure: 'M', use: 'sparkline', of: 'Sales' }] },
    flipCards: { cards: [{ page: 'P', card: 1, title: 'T', back: {} }], bookmarks: 2, newMeasures: 1 }, statusIcons: { columns: [{ page: 'P', measure: 'M', way: 'rules', thresholds: {} }] }, waterfallRtl: [{ page: 'P', written: 'mirror', what: 'x' }], metricSwitcher: { page: 'P', measures: [], charts: [] } })));
  chk(() => rp.includes('تظهر بالإنجليزية (1، دون اسم عربي) · Shown in English (1, no Arabic name)') && rp.includes('مكتبة دوال DAX (الدوال: 2، المقاييس: 1) · DAX function library (2 functions, 1 measures)'),
    () => `T1-S9b. an Arabic report's counted headings with their words in Arabic: ${rp.join(' | ')}`);
  chk(() => ['البطاقات القابلة للقلب · Flip cards (1)', 'أيقونات الحالة · Status icons (1)', 'الشلالات من اليمين إلى اليسار · Waterfalls, right to left (1)', 'مبدّل المقاييس · Metric switcher'].every((h) => rp.includes(h)),
    () => `T1-S9c. an Arabic report's other headings in Arabic: ${rp.join(' | ')}`);

  // D6-S3: a base theme is a theme, grouped and counted
  const BT = 'Sales AR.Report/StaticResources/SharedResources/BaseThemes/CY24SU10.json', RT = 'Sales AR.Report/StaticResources/RegisteredResources/my-theme.json';
  const g = Approval.groupFiles([BT, RT, 'Sales AR.Report/definition/report.json']);
  chk(() => (g.find((x) => x.label === 'Theme') || { paths: [] }).paths.join('|') === [BT, RT].join('|') && (g.find((x) => x.label === 'Report settings') || { paths: [] }).paths.length === 1,
    () => `D6-S3a. a base theme (SharedResources/BaseThemes) is grouped under Theme, not Report settings: ${JSON.stringify(g)}`);
  chk(() => Approval.kindsLine([BT, RT, 'Sales AR.pbip'], 'twin', false) === '1 report; 2 themes' && Approval.kindsLine(['Sales AR.Report/StaticResources/SharedResources/BaseThemes/readme.txt', 'Sales AR.pbip'], 'twin', false) === '1 report',
    () => `D6-S3b. kindsLine counts the base theme as a theme (and only a .json): ${Approval.kindsLine([BT, RT, 'Sales AR.pbip'], 'twin', false)}`);
  const rd = Approval.summary('redesign', { shown: {}, outputs: [BT, RT] }).files || [];
  chk(() => (rd.find((x) => /^Theme \(the original's, copied\)$/.test(x.label)) || { paths: [] }).paths.length === 2, () => `D6-S3c. the redesign's copied themes include the base theme: ${JSON.stringify(rd)}`);

  // A2-S9: the app's prompt says what was not checked before writing, within its cap
  const nc = (why, n) => Approval.promptSummary('report', { exact: { pages: 3, notChecked: [{ check: 'validator', why }] }, outputs: Array.from({ length: n }, (_, i) => `R.Report/definition/pages/p${i}/visuals/v${i}/visual.json`).concat(['R.pbip']) });
  const p1 = nc('Microsoft\'s validator could not be loaded', 4);
  chk(() => /Not checked before writing: Microsoft's validator \(not run: Microsoft's validator could not be loaded\)/.test(p1) && p1.split('\n').length >= 2, () => `A2-S9a. the prompt names the check not run and why: ${JSON.stringify(p1)}`);
  const p2 = nc('x'.repeat(2000), 400);
  chk(() => p2.length <= Approval.PROMPT_SUMMARY_CAP && /Not checked before writing: Microsoft's validator/.test(p2), () => `A2-S9b. with a long why and many files, still within ${Approval.PROMPT_SUMMARY_CAP} characters and said: ${p2.length} ${JSON.stringify(p2.slice(0, 200))}`);
}

// ---------- through the tools: the twin, the EN-AR copy, the Arabic report, the calendar, the sample ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sq3-')));
const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
['tw/Sales', 'ar/Sales', 'cal/Sales'].forEach((d) => cp('fixtures/twin-project', d));
cp('fixtures/health-project', 'hp');
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const pageOf = async (planId, approve) => {
  const n = links().length; await w.call('approve_plan', { planId }); const url = await linkAt(n), html = url ? await req(url, 'GET') : '';
  if (approve && url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId }); }
  return html;
};
const idOf = (r) => r && r.j && r.j.plan && r.j.plan.planId;
// a figure's preview tag (the renderer's <text class="pv">)
const tags = (H) => [...H.matchAll(/<figure[\s\S]*?<\/figure>/g)].map((m) => ((m[0].match(/<text class="pv"[^>]*>([^<]*)<\/text>/) || [])[1] || ''));
try {
  // ---------- the separate twin, no text approved (T1-S8), then with the texts (T1-S6, T1-S13, V1-S3) ----------
  const t0 = await w.call('create_arabic_twin', { path: 'tw/Sales/Twin Sales.pbip' }), w0 = (t0.j && t0.j.plan && t0.j.plan.writesAfterGo) || [];
  chk(() => w0.length && /no Arabic text approved yet/.test(w0[0]) && !/\b0 Arabic texts/.test(w0.join(' ')), () => `T1-S8a. the twin's plan with no approved text says so, never "0 Arabic texts as approved": ${w0[0] || short(t0)}`);
  const H0 = idOf(t0) ? await pageOf(idOf(t0)) : '';
  chk(() => /لم يُوافق بعد على أي نص عربي/.test(unesc(items(H0)[0] || '')), () => `T1-S8b. and its Arabic line says no Arabic text is approved yet: ${unesc(items(H0)[0] || '')}`);
  const L = {}; ((t0.j && t0.j.texts) || []).filter((t) => t.text != null).forEach((t, k) => { L[t.id] = t.draftArabic || `نص ${k + 1}`; });
  const t1 = await w.call('create_arabic_twin', { path: 'tw/Sales/Twin Sales.pbip', labels: L }), w1 = (t1.j && t1.j.plan && t1.j.plan.writesAfterGo) || [];
  chk(() => new RegExp(`${Object.keys(L).length} Arabic texts as approved`).test(w1[0] || ''), () => `T1-S8c. with texts approved, their count as before: ${w1[0] || short(t1)}`);
  const H1 = idOf(t1) ? await pageOf(idOf(t1)) : '', I1 = items(H1);
  chk(() => I1.length === w1.length && w1.length >= 2 && /التقرير الجديد/.test(unesc(I1[0])) && unesc(I1[0]).includes(w1[0]) && /سكربت TMDL/.test(unesc(I1[1])) && /لا يطبّقه DataArcus/.test(unesc(I1[1])) && unesc(I1[1]).includes(w1[1]),
    () => `T1-S6e. the twin's page says each write in Arabic, the English under it: ${I1.map(unesc).join(' | ')} / ${w1.join(' | ')}`);
  const opts = (() => { const i = H1.indexOf('Options</h2>'); return i < 0 ? '' : H1.slice(i, H1.indexOf('</table>', i)); })();
  const optRows = [...opts.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => unesc(c[1]).trim()));
  chk(() => optRows.length >= 2 && optRows.every(([k, v]) => /^[؀-ۿ]/.test(k) && / · [A-Z]/.test(k) && /^[؀-ۿ]/.test(v)),
    () => `T1-S13a. the twin's Options rows start in Arabic, the English beside: ${JSON.stringify(optRows)}`);
  chk(() => optRows.some(([k, v]) => /التقويم/.test(k) && /انظر «عن السكربت»/.test(v)), () => `T1-S13b. the calendar row points to «عن السكربت» in Arabic: ${JSON.stringify(optRows)}`);
  const tg1 = tags(H1);
  chk(() => tg1.length && tg1.every((x) => x === 'معاينة'), () => `V1-S3a. the separate twin's pages keep the Arabic preview tag: ${JSON.stringify(tg1)}`);

  // ---------- the EN-AR copy (T1-S6, V1-S3) ----------
  const c1 = await w.call('create_arabic_twin', { path: 'tw/Sales/Twin Sales.pbip', into: 'same', labels: L }), wc = (c1.j && c1.j.plan && c1.j.plan.writesAfterGo) || [];
  const HC = idOf(c1) ? await pageOf(idOf(c1)) : '', IC = items(HC);
  chk(() => IC.length === wc.length && /أزرار اللغة: \d+/.test(unesc(IC[0] || '')) && unesc(IC[0] || '').includes(wc[0]), () => `T1-S6f. the EN-AR copy's page says its write in Arabic (pairs, buttons, slicers), the English under it: ${IC.map(unesc).join(' | ')}`);
  const pairs = [...HC.matchAll(/<div class="pair">([\s\S]*?)<\/div>(?=<div class="pair">|<p class="note">)/g)].map((m) => tags(m[1]));
  chk(() => pairs.length && pairs.every((p) => p.length === 2 && p[0] === 'preview' && p[1] === 'معاينة'), () => `V1-S3b. each pair: the English page's tag in English, the Arabic page's in Arabic: ${JSON.stringify(pairs)}`);

  // ---------- an Arabic report and an English one (T1-S6) ----------
  const r1 = await w.call('plan_layout', { path: 'ar/Sales', name: 'Arabic SQ3', layout: 'exec', lang: 'ar' }), wr = (r1.j && r1.j.plan && r1.j.plan.writesAfterGo) || [];
  const HR = idOf(r1) ? await pageOf(idOf(r1)) : '', IR = items(HR);
  chk(() => IR.length === wr.length && /^التقرير «Arabic SQ3\.Report» وملف «Arabic SQ3\.pbip»/.test(unesc(IR[0] || '').trim()) && unesc(IR[0] || '').includes(wr[0].split('<name>').join('Arabic SQ3')),
    () => `T1-S6g. an Arabic report's page says its write in Arabic, the English under it: ${IR.map(unesc).join(' | ')}`);
  const r2 = await w.call('plan_layout', { path: 'ar/Sales', name: 'English SQ3', layout: 'exec', lang: 'en' });
  const HE = idOf(r2) ? await pageOf(idOf(r2)) : '';
  chk(() => HE && items(HE).length && !items(HE).some((x) => AR.test(x)), () => `T1-S6h. an English report's page is as before (no Arabic line): ${items(HE).map(unesc).join(' | ')}`);

  // ---------- the calendar in Arabic, both forms (T1-S6) ----------
  const k1 = await w.call('add_gulf_calendar', { path: 'cal/Sales', arabicColumnsOnly: true, lang: 'ar' }), HK1 = idOf(k1) ? await pageOf(idOf(k1)) : '', IK1 = items(HK1);
  chk(() => IK1.length === 1 && /سكربت TMDL «Twin Sales - Arabic calendar\.tmdl» في المجلد «cal\/Sales»، بجانب «Twin Sales\.pbip»/.test(unesc(IK1[0])) && /لا يطبّقه DataArcus/.test(unesc(IK1[0])),
    () => `T1-S6i. the Arabic calendar columns' page says its write in Arabic: ${IK1.map(unesc).join(' | ') || short(k1)}`);
  const k2 = await w.call('add_gulf_calendar', { path: 'cal/Sales', firstYear: 2024, lastYear: 2025, country: 'uae', lang: 'ar' }), HK2 = idOf(k2) ? await pageOf(idOf(k2)) : '', IK2 = items(HK2);
  chk(() => IK2.length === 1 && /سكربت TMDL «[^»]+\.tmdl»/.test(unesc(IK2[0])) && /يضيف الجدول/.test(unesc(IK2[0])) && /2024-01-01/.test(unesc(IK2[0])), () => `T1-S6j. the Gulf calendar's Arabic page says its write in Arabic: ${IK2.map(unesc).join(' | ') || short(k2)}`);

  // ---------- the sample project in Arabic (T1-S6) ----------
  const s1 = await w.call('plan_layout', { sample: true, lang: 'ar' }), HS = idOf(s1) ? await pageOf(idOf(s1)) : '', IS = items(HS);
  chk(() => IS.length === 1 && /المجلد الجديد «[^»]+» في مجلد العمل/.test(unesc(IS[0])) && /بيانات مختلَقة/.test(unesc(IS[0])), () => `T1-S6k. the sample's Arabic page says its write in Arabic: ${IS.map(unesc).join(' | ') || short(s1)}`);

  // ---------- LR1 item 4 (the laptop run of 26 Oct): the Arabic sample page's own rows in Arabic, the English under each ----------
  const secRows = (H, head) => { const i = H.indexOf(head), j = i < 0 ? -1 : H.indexOf('</table>', i); return i < 0 || j < 0 ? [] : [...H.slice(i, j).matchAll(/<tr><td class="k"[^>]*>([\s\S]*?)<\/td><td[^>]*>([\s\S]*?)<\/td><\/tr>/g)].map((m) => [m[1], m[2]]); };
  const both = (c) => AR.test(c.split('<br>')[0]) && /<br><span class="note" dir="ltr">[^<]+<\/span>$/.test(c);
  const SR = secRows(HS, 'Sample project (made-up data)'), keysEn = SR.map(([k]) => unesc(k.split('<br>')[1] || ''));
  chk(() => SR.length >= 7 && SR.every(([k, v]) => both(k) && both(v)) && ['What it is', 'Made up', 'Folder'].every((k) => keysEn.some((x) => x.trim() === k)),
    () => `LR1-4a. the Arabic sample page: each row's name and value in Arabic, the English line under each: ${SR.map(([k, v]) => `${unesc(k)} = ${unesc(v).slice(0, 80)}`).join(' | ') || HS.slice(0, 200)}`);
  const TR = secRows(HS, 'Tables (');
  chk(() => TR.length === 4 && TR.every(([, v]) => both(v)), () => `LR1-4b. the Arabic sample page's Tables rows in Arabic, the English under each: ${TR.map(([k, v]) => `${unesc(k)} = ${unesc(v)}`).join(' | ')}`);
  const s2 = await w.call('plan_layout', { sample: true, lang: 'en' }), HSE = idOf(s2) ? await pageOf(idOf(s2)) : '', ER = secRows(HSE, 'Sample project (made-up data)');
  chk(() => ER.length >= 7 && ER.every(([k, v]) => !AR.test(k) && !AR.test(v) && !/<br>/.test(k)) && unesc(ER[0][0]).trim() === 'What it is', () => `LR1-4c. guard: the English sample page keeps its English rows, one line each: ${ER.map(([k]) => unesc(k)).join(' | ')}`);

  // ---------- A3-S1 (OBSOLETE: fixed before SQ3; kept as a check): the approved names passed again ----------
  const MP = 'hp/Health Test.SemanticModel', base = { path: MP, lang: 'ar', name: 'تقرير', layout: 'exec' };
  const a0 = await w.call('plan_layout', base), dn = {};
  ((a0.j && a0.j.arabicNames && a0.j.arabicNames.proposeYourself) || []).forEach((f, i) => { dn[f] = `اسم ${i + 1}`; });
  const a1 = await w.call('plan_layout', Object.assign({}, base, { displayNames: dn })), pinned = (a1.j && a1.j.arabicNames && a1.j.arabicNames.inThePlan) || {};
  if (idOf(a1)) await pageOf(idOf(a1), true);
  const k = Object.keys(dn)[0];
  const bad = idOf(a1) ? await w.call('create_report', Object.assign({}, base, { planId: idOf(a1), design: a1.j.design, displayNames: Object.assign({}, dn, { [k]: 'اسم آخر' }) })) : { err: true, t: 'no plan' };
  chk(() => Object.keys(dn).length && Object.keys(pinned).length && bad.err && /inputs differ from the approved plan .* in displayNames/.test(bad.t), () => `A3-S1a. another name than the approved one is refused by the gate: ${short(bad)}`);
  const ok = idOf(a1) ? await w.call('create_report', Object.assign({}, base, { planId: idOf(a1), design: a1.j.design, displayNames: dn })) : { err: true, t: 'no plan' };
  chk(() => !ok.err && ok.j && ok.j.written !== false, () => `A3-S1b. the same approved names passed again, with a fixed-list name pinned too, are written: ${short(ok)}`);
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) {
  console.log(`FAIL script=test-0.3.1-sq3.mjs cause=${JSON.stringify(problems[0].slice(0, 200))}`);
  problems.forEach((p) => console.log('  - ' + p));
  console.log(`FAIL  sq3  ${problems.length} of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS  sq3  ${checks} checks`);
