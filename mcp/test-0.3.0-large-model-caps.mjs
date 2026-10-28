// 0.3.0 Q1 (the owner, 20 Oct: "one clean laptop session heavily tested in all aspects so we can call it ready for
// shipment"; written red first): every answer has a cap on the large model with every 0.3.0 feature on. mcp/CLAUDE.md,
// round 4: once check_model_health answered 162,909 characters on the 300-table model because only read_model was
// measured. The wave added many answer parts (gallery, phone, the twin's texts, the EN-AR copy, redesign, metric switcher,
// flip cards, status icons, the terminology sheet, the date questions, shared axes): each is measured here.
//   C-1  every tool with every option the wave added, on the large model (focus "Web Orders"): each answer under
//        40,000 characters (mcp/lib/scope.mjs's LIMIT) with a 10% margin (an answer at 36,000 or more needs a cap)
//   C-2  every list a cap cut says how many were left out and how to get the rest
//   C-3  every approval page (local HTML, one page, everything inline) measured, under 2 MB; each plan's size recorded
//   C-4  Microsoft's validator 0 errors and check_report 0 "can break" on every report written
// Fixture: the golden model (mcp/test-models/large-synthetic, made up), copied to a temporary folder.
//   node test-0.3.0-large-model-caps.mjs           (DA_CAPS_PRINT=1 prints every measurement)
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { keepEnglish } from './test-plan.mjs';
import { LIMIT } from './lib/scope.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
// an answer's size, the same on Windows and Linux (golden-baseline.mjs: a backslash pair counted as one character)
const chars = (t) => String(t).split('\\\\').join('/').length;
const MARGIN = Math.floor(LIMIT * 0.9), PAGE_MAX = 2 * 1024 * 1024;

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-q1-')));
fs.cpSync(path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
const MP = 'large', FOCUS = 'Web Orders';
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 200 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });

// every answer measured: { label, tool, chars }; every approval page: { label, bytes, planChars }
const answers = [], pages = [];
const call = async (label, tool, args) => {
  const r = await s.call(tool, args); answers.push({ label, tool, chars: chars(r.t), err: r.err, backstop: r.j && r.j.truncated && r.j.truncated.cut ? r.j.truncated.cut : null });
  chk(() => chars(r.t) < MARGIN, () => `C-1 ${label} (${tool}): ${chars(r.t).toLocaleString('en-US')} characters, at or over ${MARGIN.toLocaleString('en-US')} (10% under the ${LIMIT.toLocaleString('en-US')} cap): needs a cap at its cause`);
  if (r.j) chk(() => !cutsSay(label, r.j).length, () => `C-2 ${label} (${tool}): ${cutsSay(label, r.j).join('; ')}`);
  return r;
};
// the person approves in DataArcus's window: the page is fetched (its size measured) and Approve is clicked
const approve = async (label, planAns) => {
  const pid = planAns && planAns.j && planAns.j.plan && planAns.j.plan.planId; if (!pid) return null;
  const n = links().length; await call(label + ': approve_plan (waiting)', 'approve_plan', { planId: pid });
  const url = await linkAt(n); const html = url ? await req(url, 'GET') : '';
  pages.push({ label, bytes: Buffer.byteLength(html, 'utf8'), planChars: chars(planAns.t) });
  // (0.3.0 T1, T-5, changed on purpose: an Arabic plan's page is Arabic now, its Approve button «موافقة»)
  chk(() => html.length > 1000 && /Approve|موافقة/.test(html), () => `C-3 ${label}: the approval page did not load (${html.length} characters)`);
  chk(() => Buffer.byteLength(html, 'utf8') < PAGE_MAX, () => `C-3 ${label}: the approval page is ${Buffer.byteLength(html, 'utf8').toLocaleString('en-US')} bytes, over 2 MB`);
  if (url) await req(url, 'POST', 'decision=approve');
  const done = await call(label + ': approve_plan (approved)', 'approve_plan', { planId: pid });
  return done.j && /approved/i.test(JSON.stringify(done.j)) ? pid : pid;
};
// C-2: a list cut at its cause says how many were left out ("<list>NotListed", notShown, more*) and the answer says how
// to get the rest; the last backstop (answer.mjs capAnswer: "truncated.cut") must never have had to cut it
const cutsSay = (label, j) => {
  const bad = [], cut = [];
  const walk = (o, at) => { if (Array.isArray(o)) return o.forEach((x, i) => walk(x, `${at}[${i}]`)); if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (/NotListed$/.test(k)) { cut.push(`${at}.${k}`); if (!(typeof v === 'number' && v > 0)) bad.push(`${at}.${k} is not a count`); }
      if (k === 'truncated' && v && typeof v === 'object' && v.cut) bad.push(`${at}.truncated: the backstop cut ${JSON.stringify(v.cut).slice(0, 200)}`);
      walk(v, `${at}.${k}`);
    } };
  walk(j, label);
  if (cut.length && !/again with|textsFrom: \d+|only: \[/.test(JSON.stringify(j))) bad.push(`${cut.slice(0, 3).join(', ')} cut, and no "how to get the rest"`);
  return bad;
};
const reportsWritten = [];
const written = (label, r) => { const rep = r && r.j && (r.j.report || (r.j.twin && r.j.twin.report)); if (rep) reportsWritten.push({ label, report: rep, pbip: r.j.pbip || (r.j.twin && r.j.twin.pbip) }); return rep; };

// the J18 terms of the Web Orders report (made up)
const DN = { 'Coupon[Coupon Region]': 'منطقة القسيمة', 'Plan[Plan Group]': 'مجموعة الخطة', 'Web Orders[Web Orders Total Score]': 'مؤشر KPI 2024', 'Web Orders[Web Orders Count]': 'عدد الطلبات',
  'Web Orders[Web Orders Total Value]': 'إجمالي القيمة', 'Web Orders[Web Orders Average Score]': 'متوسط الدرجة', 'Calendar[Month Short]': 'الشهر' };
const SWITCH = ['Web Orders[Web Orders Total Score]', 'Web Orders[Web Orders Total Value]', 'Web Orders[Web Orders Count]'];
const AXES = [{ measures: ['Web Orders[Web Orders Total Value]', 'Web Orders[Web Orders Total Value LY]'], answer: 'comparable' }];
const ICONS = [{ measure: 'Web Orders[Web Orders Value Share %]', good: '>= 0.5', bad: '< 0.2' }];
const ALL_ON = { gallery: true, metricSwitcher: SWITCH, flipCards: true, statusIcons: ICONS, slicerStyle: 'pills', grid: 'dotted', smoothLines: true, sharedAxes: AXES, secondPage: true };

try {
  // ---------- the model tools ----------
  const rm = await call('read_model summary', 'read_model', { path: MP });
  const names = [].concat((rm.j && rm.j.tablesWithMeasures || []).map((t) => t.table), (rm.j && rm.j.otherTables || []).map((t) => (typeof t === 'string' ? t : t.name))).filter(Boolean);
  const rt = await call('read_model tables (100, the most it takes)', 'read_model', { path: MP, tables: names.slice(0, 100) });
  chk(() => !rt.err && rt.j.tables.length + (rt.j.notShown || []).length === Math.min(100, names.length) && (!rt.j.notShown || /Call read_model again/.test(rt.j.note)),
    () => `C-2 read_model with 100 tables: every table shown or named in notShown, with how: ${rt.err ? rt.t.slice(0, 300) : JSON.stringify({ shown: rt.j.tables.length, notShown: (rt.j.notShown || []).length, note: rt.j.note })}`);
  if (rt.j && rt.j.notShown) { const rest = await call('read_model the tables not shown', 'read_model', { path: MP, tables: rt.j.notShown.map((t) => (typeof t === 'string' ? t : t.name)) });
    chk(() => !rest.err && rest.j.tables.length + (rest.j.notShown || []).length === rt.j.notShown.length, () => `C-2 read_model notShown: the rest is given when asked: ${short(rest)}`); }
  await call('suggest_fields focus ar', 'suggest_fields', { path: MP, focus: FOCUS, kpis: 6, lang: 'ar' });
  await call('suggest_fields no focus', 'suggest_fields', { path: MP, kpis: 6 });
  await call('suggest_fields tables (60 of the 100 it takes)', 'suggest_fields', { path: MP, kpis: 6, tables: names.slice(0, 60) });
  const hp = await call('check_model_health maxItems 200, country', 'check_model_health', { path: MP, maxItems: 200, country: 'uae', asOf: '2026-10-20' });
  const hid = await approve('check_model_health (fix scripts)', hp);
  const ids = (hp.j && hp.j.findings || []).map((f) => f.id);
  chk(() => hp.j && hp.j.findings.length === 6 && hp.j.findings.every((f) => f.count >= f.items.length) && hp.j.listsCut && hp.j.listsCut.listed > 0,
    () => `C-2 check_model_health: every finding kept with its count, the lists cut evenly (listsCut): ${hp.j ? JSON.stringify({ findings: ids, listsCut: hp.j.listsCut, truncated: hp.j.truncated }).slice(0, 500) : short(hp)}`);
  const big = (hp.j && hp.j.findings || []).slice().sort((a, b) => b.count - a.count)[0];
  if (big) { const one = await call(`check_model_health only ${big.id}`, 'check_model_health', { path: MP, maxItems: 200, country: 'uae', asOf: '2026-10-20', only: [big.id] });
    chk(() => !one.err && one.j.findings.length === 1 && one.j.findings[0].id === big.id && one.j.findings[0].items.length === Math.min(200, big.count) && !one.j.listsCut && one.j.score.overall === hp.j.score.overall,
      () => `C-2 check_model_health only: the rest of one finding (${big.id}, ${big.count}) given whole, the same score: ${one.err ? one.t.slice(0, 300) : JSON.stringify({ f: one.j.findings.map((f) => [f.id, f.items.length]), cut: one.j.listsCut, only: one.j.only })}`); }
  const fx = await call('check_model_health only FORMATS', 'check_model_health', { path: MP, maxItems: 200, only: ['FORMATS', 'NO_SUCH'] });
  chk(() => !fx.err && fx.j.fixes && Object.keys(fx.j.fixes).join() === 'FORMATS' && !fx.j.findings.length && fx.j.only.notFound.join() === 'NO_SUCH', () => `C-2 check_model_health only FORMATS: ${short(fx)}`);
  const hw = hid ? await call('check_model_health with planId', 'check_model_health', { path: MP, maxItems: 200, country: 'uae', asOf: '2026-10-20', planId: hid }) : null;
  chk(() => hw && !hw.err, () => `C-1 check_model_health with its plan: ${short(hw)}`);

  // ---------- the theme ----------
  const th = await call('generate_theme proposal (ar)', 'generate_theme', { name: 'Q1 Theme', brand: '#0F6CBD', lang: 'ar', folder: 'themes' });
  const tid = await approve('generate_theme', th);
  if (tid) await call('generate_theme written', 'generate_theme', { name: 'Q1 Theme', brand: '#0F6CBD', lang: 'ar', folder: 'themes', planId: tid });
  const design = th.j && th.j.design;

  // ---------- the reports: English and Arabic with every option, the Ramadan page with the date questions ----------
  const build = async (label, args) => {
    const pl = await call(`plan_layout ${label}`, 'plan_layout', Object.assign({ path: MP, focus: FOCUS, design }, args));
    chk(() => pl.j && pl.j.plan && pl.j.plan.planId, () => `C-1 plan_layout ${label} gives a plan: ${pl.err ? pl.t.slice(0, 400) : JSON.stringify(Object.keys(pl.j)) + ' ' + JSON.stringify(pl.j.planProblems || pl.j.gulfDates || '').slice(0, 900)}`);
    const id = await approve(`plan_layout ${label}`, pl); if (!id) return null;
    const r = await call(`create_report ${label}`, 'create_report', Object.assign({ path: MP, focus: FOCUS, planId: id, design: pl.j.design }, args));
    chk(() => !r.err && written(label, r), () => `C-1 create_report ${label}: ${short(r)}`);
    return r;
  };
  const EN = await build('EN all on', Object.assign({ name: 'Q1 EN', lang: 'en', layout: 'exec', kpis: 6, filters: 'end' }, ALL_ON));
  // (0.3.1 CX1, F01: the two fields DN gives no Arabic name are kept English on purpose, as the person says it)
  await build('AR all on', Object.assign({ name: 'Q1 AR', lang: 'ar', layout: 'analysis', kpis: 6, filters: 'start', displayNames: Object.assign({}, DN, keepEnglish('Web Orders[Web Orders Max Score]', 'Web Orders[Web Orders Average Value]')), waterfallRtl: 'mirror' }, ALL_ON));
  // (the same with no Arabic name approved yet: every field listed as kept in English, the terminology sheet all asked)
  await build('AR all on, no names yet', Object.assign({ name: 'Q1 AR2', lang: 'ar', layout: 'analysis', kpis: 6, filters: 'start', waterfallRtl: 'mirror' }, ALL_ON));
  await build('Ramadan date questions', { name: 'Q1 Ramadan', lang: 'ar', layout: 'focus', kpis: 3, filters: 'top', displayNames: DN, secondPage: false,
    gulfDates: { dateRole: 'Web Orders[Date]', grain: 'gregorian', scope: 'all' } });

  // ---------- the twin, separate and into "same" ----------
  const enPath = EN && EN.j && EN.j.report ? path.posix.join(MP, String(EN.j.report).split(/[\\/]/).pop()) : null;
  for (const into of ['separate', 'same']) {
    if (!enPath) break;
    const tp = await call(`create_arabic_twin plan (${into})`, 'create_arabic_twin', { path: enPath, into, terms: DN, waterfallRtl: 'mirror' });
    if (tp.j && tp.j.moreTexts) {
      const total = tp.j.texts.length + tp.j.moreTexts.notListed, seen = tp.j.texts.map((t) => t.id); let from = tp.j.moreTexts.from, n = 0, nx = null;
      while (from != null && n++ < 20) { nx = await call(`create_arabic_twin plan (${into}) textsFrom ${from}`, 'create_arabic_twin', { path: enPath, into, terms: DN, waterfallRtl: 'mirror', textsFrom: from });
        if (!nx.j) break; nx.j.texts.forEach((t) => seen.push(t.id)); from = nx.j.moreTexts ? nx.j.moreTexts.from : null; }
      chk(() => seen.length === total && new Set(seen).size === total && from == null, () => `C-2 the twin's texts (${into}): every text reached with textsFrom, once: ${seen.length} seen, ${new Set(seen).size} different, of ${total}`);
    }
    chk(() => tp.j && (tp.j.notTranslated || []).length && !tp.j.notTranslatedNotListed, () => `C-2 the twin's notTranslated (${into}) is said whole: ${tp.j ? (tp.j.notTranslated || []).length + ' listed, ' + (tp.j.notTranslatedNotListed || 0) + ' not' : short(tp)}`);
    const id = await approve(`create_arabic_twin (${into})`, tp);
    const tw = id ? await call(`create_arabic_twin written (${into})`, 'create_arabic_twin', { path: enPath, into, terms: DN, waterfallRtl: 'mirror', planId: id }) : null;
    chk(() => tw && !tw.err && written('twin ' + into, tw), () => `C-1 create_arabic_twin (${into}) written: ${short(tw || tp)}`);
  }

  // ---------- the redesign: of the English report, and of the EN-AR copy (twice its pages) ----------
  const sameRep = (reportsWritten.find((w) => w.label === 'twin same') || {}).report;
  for (const [label, from] of [['redesign', enPath], ['redesign EN-AR', sameRep ? path.posix.join(MP, String(sameRep).split(/[\\/]/).pop()) : null]]) {
    if (!from) continue;
    const rp = await call(`plan_layout ${label}`, 'plan_layout', { path: MP, redesignFrom: from, restyle: { preset: 'Midnight' } });
    const R = rp.j && rp.j.redesign;
    if (R && R.listsCut) {
      const pg = R.pages.find((p) => p.changesNotListed || p.notChangedNotListed) || R.pages[0];
      const one = await call(`plan_layout ${label} redesignPages`, 'plan_layout', { path: MP, redesignFrom: from, restyle: { preset: 'Midnight' }, redesignPages: [pg.id] });
      const P1 = one.j && one.j.redesign && one.j.redesign.pages;
      chk(() => P1 && P1.length === 1 && P1[0].id === pg.id && !P1[0].changesNotListed && !P1[0].notChangedNotListed && P1[0].changes.length === (pg.changes || []).length + (pg.changesNotListed || 0),
        () => `C-2 ${label}: redesignPages gives one page's lists whole: ${one.err ? one.t.slice(0, 300) : JSON.stringify((P1 || []).map((p) => [p.id, (p.changes || []).length, p.changesNotListed, (p.notChanged || []).length, p.notChangedNotListed]))}`);
    }
    const id = await approve(`plan_layout ${label}`, rp);
    const rr = id ? await call(`create_report ${label}`, 'create_report', { path: MP, redesignFrom: from, planId: id, restyle: { preset: 'Midnight' } }) : null;
    chk(() => rr && !rr.err && written(label, rr), () => `C-1 create_report ${label}: ${short(rr || rp)}`);
  }

  // ---------- the calendar ----------
  const cp = await call('add_gulf_calendar proposal', 'add_gulf_calendar', { path: MP, firstYear: 2000, lastYear: 2059, country: 'ksa', relateTo: ['Web Orders[Date]'], asOf: '2026-10-20' });
  const cid = await approve('add_gulf_calendar', cp);
  if (cid) await call('add_gulf_calendar written', 'add_gulf_calendar', { path: MP, firstYear: 2000, lastYear: 2059, country: 'ksa', relateTo: ['Web Orders[Date]'], asOf: '2026-10-20', planId: cid });

  // ---------- every report written: read, checked ----------
  for (const w of reportsWritten) {
    const rel = path.posix.join(MP, String(w.report).split(/[\\/]/).pop());
    await call(`read_report text ${w.label}`, 'read_report', { path: rel });
    await call(`read_report json ${w.label}`, 'read_report', { path: rel, format: 'json' });
    const c = await call(`check_report ${w.label}`, 'check_report', { path: rel, maxFindings: 200 }), j = c.j || {};
    chk(() => !c.err && j.validator && j.validator.ran && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0,
      () => `C-4 ${w.label}: validator 0 errors and check_report 0 "can break": ${c.err ? c.t.slice(0, 300) : JSON.stringify({ v: j.validator, canBreak: j.impact && j.impact.kinds.canBreak, f: (j.findings || []).filter((f) => f.impact === 'canBreak').slice(0, 3).map((f) => [f.rule, f.file, f.what]) }).slice(0, 900)}`);
  }
  chk(() => reportsWritten.length === 8, () => `C-1 eight reports written (EN, AR, AR without names, Ramadan, twin, EN-AR copy, two redesigns): ${reportsWritten.map((w) => w.label).join(', ')}`);
} catch (e) {
  problems.push('the run stopped: ' + String(e && e.stack || e).slice(0, 600));
} finally {
  await s.close();
}

const top = answers.slice().sort((a, b) => b.chars - a.chars);
if (process.env.DA_CAPS_PRINT) { answers.forEach((a) => console.log(`  ${String(a.chars).padStart(7)}  ${a.err ? '(refused) ' : ''}${a.label}${a.backstop ? '  BACKSTOP CUT ' + JSON.stringify(a.backstop) : ''}`)); pages.forEach((p) => console.log(`  page ${String(p.bytes).padStart(9)} bytes, plan ${p.planChars} characters: ${p.label}`)); }
console.log(`  largest answer: ${top[0] ? `${top[0].label}, ${top[0].chars} characters` : 'none'}; largest approval page: ${pages.length ? pages.slice().sort((a, b) => b.bytes - a.bytes).map((p) => `${p.label}, ${p.bytes} bytes`)[0] : 'none'}`);
fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  large-model-caps  ${problems.length} of ${checks} checks failed:`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  large-model-caps  ${checks} checks`);
