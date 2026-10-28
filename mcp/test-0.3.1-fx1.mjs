import './test-env.mjs';
// 0.3.1 FX1 (the owner's laptop part 3, 28 Oct, 0.3.1-rc.2 on Power BI Desktop 2.159; mcp/work/FX1.md). Written red first.
//   R1-R6  D-1028-02 ("the D-1028-01 fix it correctly": the twin is identical, D-1027-12): the sample project's report as the
//          laptop ran it, its twin (separate) and its EN-AR copy ("same") with the drafted Arabic: every Arabic Reset
//          button keeps its icon, its text and icon fit side by side at the English size (the dropdown slicers beside it
//          give the width, each kept 160 x k at least, nothing overlaps), the plan says it (iconKept), nothing is cut
//   R7     only where nothing gives room (a 60-wide Reset alone in its group): the icon is switched off and said (iconOff)
//   A1-A14 an Arabic plan's approval page is wholly Arabic (the laptop's A5, P3A's Seen 2): the theme's, the Gulf
//          calendar's, the Arabic calendar columns', the twin's, the copy's and the report's: no English left outside
//          the names («...»), paths, plan ids, the raw inputs (code) and the product's own names; the calendar's inputs
//          in Arabic; no English copy under a write. The check's items (the measured rules' own sentences, made by the
//          shared rule engines in English) are not part of this (mcp/work/FX1.md, "For the owner")
//   A15    an English plan's page keeps its English words (guard)
// Made-up data only: the sample project (mcp/lib/sample-project.mjs) and mcp/fixtures/twin-project.
//   node test-0.3.1-fx1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), Rules = createRequire(import.meta.url)('../assets/js/report-rules.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '') : null);
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx1-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx1-log-'))), log = path.join(LOGS, 'links.txt');
const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' }), call = w.call;
// the approval page of a plan (its window's link, as the person's browser gets it); approve: then the click
async function pageOf(pid, approve) {
  const n = links().length; await call('approve_plan', { planId: pid });
  for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
  const url = links()[n] || '', html = url ? await req(url, 'GET') : '';
  if (url && approve) { await req(url, 'POST', 'decision=approve'); await call('approve_plan', { planId: pid }); }
  return html;
}
// the files of a written report: every visual.json, by page folder
const visualsOf = (rep) => { const P = path.join(ROOT, rep, 'definition/pages'), out = []; if (!fs.existsSync(P)) return out;
  fs.readdirSync(P).forEach((pg) => { const V = path.join(P, pg, 'visuals'); if (fs.existsSync(V)) fs.readdirSync(V).forEach((v) => { const f = path.join(V, v, 'visual.json'); if (fs.existsSync(f)) out.push(Object.assign(rd(f), { _page: pg })); }); });
  return out; };
const isReset = (v) => v.visual && v.visual.visualType === 'actionButton' && (v.visual.objects && Array.isArray(v.visual.objects.text) ? v.visual.objects.text : []).some((e) => /Reset filters|إعادة ضبط/.test(String(lit((e.properties || {}).text))));
const iconOf = (v) => ((v.visual.objects.icon || []).map((e) => lit((e.properties || {}).shapeType)).find(Boolean)) || 'blank';
const sizeOf = (v) => ((v.visual.objects.text || []).map((e) => lit((e.properties || {}).fontSize)).find(Boolean)) || null;
const needOf = (v) => Rules.buttonNeed({ json: v, type: 'actionButton', h: v.position.height, w: v.position.width }, { labelSize: 10, font: 'Segoe UI' });
const AR_RE = /[؀-ۿ]/;
// the Latin an Arabic page shows outside the names («...», isolated), the paths and ids (isolated), the raw inputs, the
// colours' hex and the product's own words (Power BI Desktop's menu words as Desktop shows them)
const PRODUCT = ['Power BI Desktop', 'Power BI', 'DataArcus', 'Claude', 'TMDL view', 'TMDL', 'DAX', 'Notepad', 'Preview', 'Apply', 'View', 'Themes', 'Browse for themes', 'Ctrl'];
function latinLeft(H) {
  let b = String(H).replace(/<style[\s\S]*?<\/style>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<title>[\s\S]*?<\/title>/g, '');
  // (the check's items: the shared rule engines' own sentences, English for now: mcp/work/FX1.md)
  b = b.replace(/<p>للمراجعة:<\/p><ul>[\s\S]*?<\/ul>/g, '');
  for (let i = 0; i < 3; i++) b = b.replace(/<bdi[^>]*>(?:(?!<bdi)[\s\S])*?<\/bdi>/g, ' ');
  b = b.replace(/«[^»]*»/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&[a-z#0-9]+;/g, ' ').replace(/#[0-9a-f]{6}\b/gi, ' ');
  PRODUCT.forEach((p) => { b = b.split(p).join(' '); });
  return b.split('\n').map((l) => l.trim()).filter((l) => /[A-Za-z]{2,}/.test(l));
}
const arabicPage = (H) => /<html lang="ar" dir="rtl">/.test(H);

// a plan as a person answers it: the Gulf date and shared-axes questions, then the drafted Arabic names and texts
async function planReport(a0) {
  let args = Object.assign({}, a0), pl = await call('plan_layout', args);
  for (let i = 0; i < 6 && !pl.err; i++) {
    const j = pl.j || {}, more = {};
    if (j.gulfDates && j.gulfDates.askNext && !args.gulfDates && ((j.gulfDates.candidates || [])[0] || {}).field) more.gulfDates = { dateRole: j.gulfDates.candidates[0].field, grain: 'gregorian', scope: 'all' };
    if (j.sharedAxes && (j.sharedAxes.ask || []).length && !args.sharedAxes) more.sharedAxes = j.sharedAxes.ask.map((q) => ({ measures: q.measures, answer: 'separate' }));
    // (an Arabic report: every field's Arabic name, the suggested ones and a made-up one for the rest, approved)
    const an = j.arabicNames; if (an && !args.displayNames) { const own = {}; [].concat(an.proposeYourself || []).forEach((f, k) => { own[typeof f === 'string' ? f : f.field] = 'الحقل ' + (k + 1); }); more.displayNames = Object.assign({}, an.inThePlan || {}, an.suggestedDisplayNames || {}, own); }
    if (!Object.keys(more).length) break;
    args = Object.assign(args, more); pl = await call('plan_layout', args);
  }
  return { pl, args };
}
// the twin's plan with every drafted Arabic approved (as the laptop did)
async function twinPlan(a) {
  const p0 = await call('create_arabic_twin', a), labels = {};
  ((p0.j && p0.j.texts) || []).forEach((x) => { if (x.draftArabic) labels[x.id] = x.draftArabic; });
  const args = Object.assign({}, a, { labels }); return Object.assign(await call('create_arabic_twin', args), { args });
}

try {
  // ---------- the sample project and its report, as the laptop ran them ----------
  const sp = await call('plan_layout', { sample: true }), spid = sp.j && sp.j.plan && sp.j.plan.planId; if (spid) await pageOf(spid, true);
  const sw = spid ? await call('create_report', { sample: true, path: sp.j.sample.folder, planId: spid }) : { err: true, t: 'no sample plan: ' + short(sp) };
  const step = ((sw.j && sw.j.tour) || []).find((x) => x.call && x.call.tool === 'plan_layout' && !x.call.args.languages) || { call: { args: {} } };
  const { pl, args } = await planReport(step.call.args), rid = pl.j && pl.j.plan && pl.j.plan.planId; if (rid) await pageOf(rid, true);
  const send = Object.assign({}, args, { planId: rid, design: pl.j && pl.j.design, fields: args.planFields }); delete send.planFields;
  const rep = rid ? await call('create_report', send) : { err: true, t: 'no plan: ' + short(pl) }, open = rep.j && String(rep.j.open || '').replace(/\\/g, '/');
  if (!open) problems.push('the sample report was not written: ' + short(rep));
  const enResets = visualsOf((open || 'x.pbip').replace(/\.pbip$/, '.Report')).filter(isReset);

  // ---------- R1-R6: the Reset keeps its icon (and the twin's and the copy's approval pages, for A7-A10) ----------
  const pages = {};
  for (const [into, tag] of [['separate', 'R1-R3'], ['same', 'R4-R6']]) {
    const a = { path: open, ...(into === 'same' ? { into: 'same', tabsShown: 'ar' } : {}) }, p = await twinPlan(a), id = p.j && p.j.plan && p.j.plan.planId;
    if (id) pages[into] = await pageOf(id, true);
    const wr = id ? await call('create_arabic_twin', Object.assign({}, p.args, { planId: id })) : { err: true, t: 'no plan: ' + short(p) };
    const F = (p.j && p.j.fitted) || {}, out = wr.j && String(wr.j.pbip || '').replace(/\\/g, '/');
    const all = out ? visualsOf(out.replace(/\.pbip$/, '.Report')) : [], arResets = all.filter((v) => isReset(v) && (v.visual.objects.text || []).some((e) => AR_RE.test(String(lit((e.properties || {}).text))))), strip = (v) => all.filter((x) => x._page === v._page && x.parentGroupName === v.parentGroupName && x !== v && x.position && Math.abs(x.position.y - v.position.y) < 60);
    const enSize = enResets.length ? sizeOf(enResets[0]) : null;
    chk(() => !wr.err && arResets.length >= 2 && arResets.every((v) => iconOf(v) !== 'blank' && needOf(v).icon && needOf(v).needW <= v.position.width + 0.5 && sizeOf(v) === enSize),
      () => `${tag} a. (${into}) every Arabic Reset button keeps its icon, its text and icon fit side by side, at the English size ${enSize}: ${wr.err ? short(wr) : JSON.stringify(arResets.map((v) => ({ icon: iconOf(v), w: v.position.width, size: sizeOf(v), need: needOf(v) })))}`);
    chk(() => (F.buttons || []).some((x) => x.iconKept && x.slicersNarrowed) && !(F.buttons || []).some((x) => x.iconOff) && !(F.buttonsCut || []).length,
      () => `${tag} b. (${into}) the plan says it (fitted.buttons iconKept, the slicers beside it gave the width), no icon off, nothing cut: ${JSON.stringify(F).slice(0, 500)}`);
    const k = 1080 / 1080, bad = [];
    arResets.forEach((v) => strip(v).forEach((x) => {
      const A = v.position, B = x.position; if (A.x < B.x + B.width - 0.5 && B.x < A.x + A.width - 0.5 && A.y < B.y + B.height - 0.5 && B.y < A.y + A.height - 0.5) bad.push(`${x.name} over the Reset`);
      if (x.visual && x.visual.visualType === 'slicer' && B.width < 160 * k - 0.5) bad.push(`${x.name} ${B.width} wide`);
    }));
    chk(() => arResets.length && !bad.length, () => `${tag} c. (${into}) in the strip nothing overlaps the Reset, each slicer 160 wide at least: ${JSON.stringify(bad)}`);
  }

  // ---------- R7: no room at all: the icon off, said (a guard: as before) ----------
  {
    const D = path.join(ROOT, 'r7'); fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
    const vf = (v) => path.join(D, 'Twin Sales.Report/definition/pages/p1overview/visuals', v, 'visual.json'), b = rd(vf('btnReset'));
    fs.mkdirSync(path.dirname(vf('grpR7')), { recursive: true });
    fs.writeFileSync(vf('grpR7'), JSON.stringify({ $schema: b.$schema, name: 'grpR7', position: { x: 1000, y: 150, z: 8500, height: 40, width: 60, tabOrder: 8500 }, visualGroup: { displayName: 'Rail', groupMode: 'ScaleMode' } }, null, 2));
    b.parentGroupName = 'grpR7'; b.position = Object.assign({}, b.position, { x: 0, y: 0, width: 60, height: 40 }); b.visual.objects.text[1].properties.fontSize = { expr: { Literal: { Value: '15D' } } };
    fs.writeFileSync(vf('btnReset'), JSON.stringify(b, null, 2));
    const p = await call('create_arabic_twin', { path: 'r7/Twin Sales.pbip', arabicMonth: false, labels: { 'button:p1overview/btnReset': 'إعادة' } }), F = (p.j && p.j.fitted) || {};
    chk(() => !p.err && (F.buttons || []).some((x) => x.visual === 'btnReset' && x.iconOff && !x.iconKept), () => `R7. a Reset with no room at all (60 wide, alone in its group): its icon off and said (iconOff), as before: ${short(p)}`);
  }

  // ---------- A1-A14: an Arabic plan's approval page, wholly Arabic ----------
  const M = 'Gulf Retail Sample/Gulf Retail.SemanticModel';
  const planOf = async (tool, a) => { const p = await call(tool, a), id = p.j && p.j.plan && p.j.plan.planId; return id ? pageOf(id) : 'no plan: ' + short(p); };
  pages.theme = await planOf('generate_theme', { path: M, name: 'Gulf Theme', lang: 'ar' });
  pages.calendar = await planOf('add_gulf_calendar', { path: M, firstYear: 2024, lastYear: 2025, lang: 'ar', country: 'ksa', weekend: 'country' });
  pages.columns = await planOf('add_gulf_calendar', { path: M, arabicColumnsOnly: true, lang: 'ar' });
  { const { pl: pa } = await planReport(Object.assign({}, step.call.args, { lang: 'ar', name: 'Gulf Retail Arabic' })); pages.report = pa.j && pa.j.plan ? await pageOf(pa.j.plan.planId) : 'no plan: ' + short(pa); }
  if (process.env.FX1_DUMP) Object.entries(pages).forEach(([k, H]) => fs.writeFileSync(path.join(process.env.FX1_DUMP, `fx1-${k}.html`), String(H)));
  const KINDS = [['theme', 'A1-A2'], ['calendar', 'A3-A4'], ['columns', 'A5-A6'], ['separate', 'A7-A8'], ['same', 'A9-A10'], ['report', 'A11-A12']];
  for (const [k, tag] of KINDS) {
    const H = pages[k] || '', left = latinLeft(H);
    chk(() => arabicPage(H), () => `${tag} a. the ${k} plan's approval page is an Arabic page (lang ar, right to left): ${String(H).slice(0, 200)}`);
    chk(() => H.length > 500 && !left.length, () => `${tag} b. the ${k} plan's Arabic page shows no English outside the names, paths, ids and the product's words (${left.length}): ${JSON.stringify(process.env.ALL ? left : left.slice(0, 8))}`);
  }
  // the laptop's words: the calendar's INPUTS in Arabic (labels and values), no English copy under a write
  const C = String(pages.calendar).replace(/<[^>]+>/g, ' ');
  chk(() => /السنة الأولى/.test(C) && /الدولة/.test(C) && /المملكة العربية السعودية/.test(C) && /العطلة الرسمية في الدولة/.test(C) && !/First year|United Arab Emirates|official weekend|Saudi Arabia/.test(C),
    () => `A13. the calendar's inputs: "السنة الأولى", "الدولة", "المملكة العربية السعودية", "العطلة الرسمية في الدولة", no English: ${C.replace(/\s+/g, ' ').slice(0, 900)}`);
  chk(() => KINDS.every(([k]) => !/<li dir="auto">[^<]*[؀-ۿ][\s\S]{0,400}?<br><span class="note" dir="ltr">/.test(pages[k] || '')) && !/the TMDL script|the theme file "/.test(C + String(pages.theme)),
    () => 'A14. no Arabic write line is followed by its English copy');
  // ---------- A15: an English plan keeps its English page (guard) ----------
  const en = String(await planOf('add_gulf_calendar', { path: M, firstYear: 2024, lastYear: 2025, country: 'ksa' })).replace(/<[^>]+>/g, ' ');
  chk(() => /First year/.test(en) && /Saudi Arabia/.test(en) && /the country's official weekend|the country&#39;s official weekend/.test(en) && !AR_RE.test(en.replace(/«[^»]*»/g, '')), () => `A15. an English calendar plan's page stays English: ${en.replace(/\s+/g, ' ').slice(0, 500)}`);
} catch (e) {
  problems.push('the suite stopped: ' + String(e && e.stack || e).slice(0, 600));
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true }); fs.rmSync(LOGS, { recursive: true, force: true });
}

if (problems.length) {
  console.log(`FAIL script=test-0.3.1-fx1.mjs cause=${JSON.stringify(problems[0]).slice(0, 300)}`);
  problems.forEach((p) => console.log('  - ' + p));
  console.log(`FAIL  fx1  ${checks} checks, ${problems.length} failed`);
  process.exit(1);
}
console.log(`PASS  fx1  ${checks} checks`);
process.exit(0);
