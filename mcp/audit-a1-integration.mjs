// 0.3.0 A1 (the cloud integration audit of the wave, 20 Oct): every tool end to end, together. Not in `npm test`: the
// audit's own record (mcp/work/A1.md). The real server over stdio (as test.mjs), on copies of every fixture.
//   E  every fixture (mcp/test-models/*, mcp/fixtures/twin-project, mcp/fixtures/health-project), English and Arabic:
//      read_model, suggest_fields, check_model_health (plan, approve, write), generate_theme (plan, approve, write),
//      plan_layout -> approve_plan -> create_report, read_report, check_report on what was written; the English
//      report's Arabic twin; add_gulf_calendar; the fixtures' own reports read, checked and twinned
//   T  every wave option on one report (gallery, smoothLines, slicerStyle pills, grid dotted, metricSwitcher, flipCards,
//      statusIcons with the person's thresholds, sharedAxes, a Ramadan page with the date questions answered), in
//      English and in Arabic with terms (waterfallRtl native and mirror); the English one's twin (native, mirror), its
//      EN-AR copy, a redesign of it and of the copy. Each approval page lists every file written and every model script.
//   Every report: Microsoft's validator 0 errors and check_report 0 "can break"; every answer under 40,000 characters.
// Made-up models only (the repo's fixtures).   node audit-a1-integration.mjs   (DA_A1_PRINT=1 prints every answer's size)
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { LIMIT } from './lib/scope.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = [], notes = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } return ok; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (!x ? 'no answer' : x.err ? String(x.t).slice(0, 500) : JSON.stringify(x.j).slice(0, 500));
const chars = (t) => String(t).split('\\\\').join('/').length;
const unesc = (h) => String(h).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const walk = (d) => { const out = []; if (!fs.existsSync(d)) return out; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) out.push(...walk(f)); else out.push(f); } return out; };

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-a1-')));
const FIX = [
  { id: 'large', from: 'test-models/large-synthetic/Large Synthetic.SemanticModel', to: 'large/Large Synthetic.SemanticModel', focus: 'Web Orders' },
  { id: 'arabic', from: 'test-models/arabic-long-names/Arabic Long Names.SemanticModel', to: 'arabic/Arabic Long Names.SemanticModel' },
  { id: 'plain', from: 'test-models/no-measures/Plain Orders.SemanticModel', to: 'plain/Plain Orders.SemanticModel' },
  { id: 'twin', from: 'fixtures/twin-project', to: 'twin', report: 'twin/Twin Sales.pbip' },
  { id: 'health', from: 'fixtures/health-project', to: 'health', report: 'health/Health Test Report.pbip' }];
FIX.forEach((f) => fs.cpSync(path.join(HERE, f.from), path.join(ROOT, f.to), { recursive: true }));
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 200 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });

const answers = [];   // { label, tool, chars }
const call = async (label, tool, args) => {
  const r = await s.call(tool, args); answers.push({ label, tool, chars: chars(r.t), err: r.err });
  if (process.env.DA_A1_DUMP) fs.writeFileSync(path.join(process.env.DA_A1_DUMP, `${answers.length} ${label.replace(/[^\w -]+/g, '_')}.json`), r.t);
  chk(() => chars(r.t) < LIMIT, () => `${label} (${tool}): ${chars(r.t)} characters, over ${LIMIT}`);
  return r;
};
const pid = (a) => a && a.j && a.j.plan && a.j.plan.planId;
// the person clicks Approve in DataArcus's window; the page is kept to compare with what is written
const approve = async (label, planAns) => {
  const id = pid(planAns); if (!id) return { id: null, html: '' };
  const n = links().length; await call(label + ': approve_plan (waiting)', 'approve_plan', { planId: id });
  const url = await linkAt(n), html = url ? await req(url, 'GET') : '';
  chk(() => html.length > 1000 && /Approve/.test(html), () => `${label}: the approval page did not load (${html.length} characters)`);
  if (url) await req(url, 'POST', 'decision=approve');
  await call(label + ': approve_plan (approved)', 'approve_plan', { planId: id });
  return { id, html: unesc(html) };
};
const relOf = (dir, rep) => (rep ? path.posix.join(dir, String(rep).split(/[\\/]/).pop()) : null);
// every report written: read (text, json) and checked (validator 0 errors, 0 "can break")
const reports = [];
const verify = async (label, rel) => {
  if (!rel) return;
  reports.push(label);
  await call(`read_report ${label}`, 'read_report', { path: rel });
  await call(`read_report json ${label}`, 'read_report', { path: rel, format: 'json' });
  const c = await call(`check_report ${label}`, 'check_report', { path: rel, maxFindings: 200 }), j = c.j || {};
  chk(() => !c.err && j.validator && j.validator.ran && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0,
    () => `${label}: validator 0 errors and check_report 0 "can break": ${c.err ? c.t.slice(0, 300) : JSON.stringify({ v: j.validator, canBreak: j.impact && j.impact.kinds.canBreak, f: (j.findings || []).filter((f) => f.impact === 'canBreak').slice(0, 3).map((f) => [f.rule, f.file, f.what]) }).slice(0, 900)}`);
};
// every file a write made is on its approval page (by its path inside the folder); model scripts by name
const listed = (label, html, before, dir) => {
  const now = walk(path.join(ROOT, dir)), made = now.filter((f) => !before.has(f)).map((f) => path.relative(path.join(ROOT, dir), f).split(path.sep).join('/'));
  const missing = made.filter((f) => !html.includes(f) && !html.includes(f.split('/').slice(-3).join('/')));
  chk(() => made.length && !missing.length, () => `${label}: ${missing.length} of ${made.length} files written are not on the approval page: ${missing.slice(0, 6).join(', ')}`);
  return made;
};
const snap = (dir) => new Set(walk(path.join(ROOT, dir)));

try {
  // ---------- E: every fixture, English and Arabic ----------
  for (const f of FIX) {
    const dir = f.to.split('/')[0], focus = f.focus ? { focus: f.focus } : {};
    await call(`read_model ${f.id}`, 'read_model', { path: dir });
    const hp = await call(`check_model_health ${f.id}`, 'check_model_health', Object.assign({ path: dir, country: 'uae', asOf: '2026-10-20' }));
    chk(() => !hp.err, () => `check_model_health ${f.id}: ${short(hp)}`);
    if (pid(hp)) { const a = await approve(`check_model_health ${f.id}`, hp); const hw = await call(`check_model_health ${f.id} written`, 'check_model_health', { path: dir, country: 'uae', asOf: '2026-10-20', planId: a.id }); chk(() => !hw.err, () => `check_model_health ${f.id} with its plan: ${short(hw)}`); }
    if (f.report) {
      await verify(`${f.id} own report`, f.report);
      const tp = await call(`create_arabic_twin ${f.id} own report`, 'create_arabic_twin', { path: f.report });
      if (pid(tp)) { const b = snap(dir), a = await approve(`twin ${f.id} own`, tp); const tw = await call(`create_arabic_twin ${f.id} own written`, 'create_arabic_twin', { path: f.report, planId: a.id });
        chk(() => !tw.err && tw.j.written, () => `twin of ${f.id}'s own report: ${short(tw)}`); if (!tw.err) { listed(`twin ${f.id} own`, a.html, b, dir); await verify(`twin of ${f.id} own`, relOf(dir, tw.j.pbip)); } }
      else chk(() => false, () => `create_arabic_twin ${f.id} own report gives no plan: ${short(tp)}`);
    }
    for (const lang of ['en', 'ar']) {
      const tag = `${f.id} ${lang}`;
      const sf = await call(`suggest_fields ${tag}`, 'suggest_fields', Object.assign({ path: dir, lang }, focus));
      chk(() => !sf.err, () => `suggest_fields ${tag}: ${short(sf)}`);
      const th = await call(`generate_theme ${tag}`, 'generate_theme', { name: `A1 ${f.id} ${lang}`, brand: '#0F6CBD', lang, path: dir, folder: 'themes' });
      if (pid(th)) { const a = await approve(`generate_theme ${tag}`, th); const tw = await call(`generate_theme ${tag} written`, 'generate_theme', { name: `A1 ${f.id} ${lang}`, brand: '#0F6CBD', lang, path: dir, folder: 'themes', planId: a.id }); chk(() => !tw.err, () => `generate_theme ${tag} written: ${short(tw)}`); }
      else chk(() => false, () => `generate_theme ${tag} gives no plan: ${short(th)}`);
      const name = `A1 ${f.id} ${lang}`, args = Object.assign({ path: dir, lang, layout: 'exec', name }, focus);
      const pl = await call(`plan_layout ${tag}`, 'plan_layout', args);
      if (!pid(pl)) { notes.push(`plan_layout ${tag}: no plan (${short(pl).slice(0, 300)})`); chk(() => f.id === 'plain' && !pl.err, () => `plan_layout ${tag} gives no plan: ${short(pl)}`); continue; }
      const b = snap(dir), a = await approve(`plan_layout ${tag}`, pl);
      const r = await call(`create_report ${tag}`, 'create_report', Object.assign({ planId: a.id, design: pl.j.design }, args));
      if (!chk(() => !r.err && r.j.report, () => `create_report ${tag}: ${short(r)}`)) continue;
      listed(`create_report ${tag}`, a.html, b, dir);
      const rel = relOf(dir, r.j.pbip || r.j.report.replace(/\.Report$/, '.pbip'));
      await verify(tag, rel);
      if (lang === 'en') {
        const tp = await call(`create_arabic_twin ${tag}`, 'create_arabic_twin', { path: rel });
        if (!chk(() => pid(tp), () => `create_arabic_twin ${tag} gives no plan: ${short(tp)}`)) continue;
        const b2 = snap(dir), a2 = await approve(`twin ${tag}`, tp), tw = await call(`create_arabic_twin ${tag} written`, 'create_arabic_twin', { path: rel, planId: a2.id });
        if (chk(() => !tw.err && tw.j.written, () => `twin ${tag}: ${short(tw)}`)) { listed(`twin ${tag}`, a2.html, b2, dir); await verify(`twin of ${tag}`, relOf(dir, tw.j.pbip)); }
      }
      const cp = await call(`add_gulf_calendar ${tag}`, 'add_gulf_calendar', { path: dir, firstYear: 2024, lastYear: 2027, country: 'uae', lang, name: `Gulf Calendar ${lang.toUpperCase()}`, asOf: '2026-10-20' });
      if (pid(cp)) { const b3 = snap(dir), a3 = await approve(`add_gulf_calendar ${tag}`, cp); const cw = await call(`add_gulf_calendar ${tag} written`, 'add_gulf_calendar', { path: dir, firstYear: 2024, lastYear: 2027, country: 'uae', lang, name: `Gulf Calendar ${lang.toUpperCase()}`, asOf: '2026-10-20', planId: a3.id });
        if (chk(() => !cw.err, () => `add_gulf_calendar ${tag} written: ${short(cw)}`)) listed(`add_gulf_calendar ${tag}`, a3.html, b3, dir); }
      else chk(() => false, () => `add_gulf_calendar ${tag} gives no plan: ${short(cp)}`);
    }
  }

  // ---------- T: every wave option on one report, then its twin, its EN-AR copy, its redesign ----------
  const MP = 'large', FOCUS = 'Web Orders';
  const DN = { 'Coupon[Coupon Region]': 'منطقة القسيمة', 'Plan[Plan Group]': 'مجموعة الخطة', 'Web Orders[Web Orders Total Score]': 'مؤشر KPI 2024', 'Web Orders[Web Orders Count]': 'عدد الطلبات',
    'Web Orders[Web Orders Total Value]': 'إجمالي القيمة', 'Web Orders[Web Orders Average Score]': 'متوسط الدرجة', 'Calendar[Month Short]': 'الشهر' };
  const ALL = { gallery: true, smoothLines: true, slicerStyle: 'pills', grid: 'dotted', secondPage: true,
    metricSwitcher: ['Web Orders[Web Orders Total Score]', 'Web Orders[Web Orders Total Value]', 'Web Orders[Web Orders Count]'], flipCards: true,
    statusIcons: [{ measure: 'Web Orders[Web Orders Value Share %]', good: '>= 0.5', bad: '< 0.2' }],
    sharedAxes: [{ measures: ['Web Orders[Web Orders Total Value]', 'Web Orders[Web Orders Total Value LY]'], answer: 'comparable' }],
    pageFilters: [{ field: 'Calendar[Is Ramadan]', values: [true] }, { field: 'Calendar[Hijri Year]', values: [1446] }],
    gulfDates: { dateRole: 'Web Orders[Date]', grain: 'gregorian', scope: 'year', year: 1446, hijriYearColumn: 'Calendar[Hijri Year]' } };
  const scripts = (made) => made.filter((f) => /\.tmdl$/i.test(f));
  const together = async (label, args) => {
    const pl = await call(`plan_layout ${label}`, 'plan_layout', Object.assign({ path: MP, focus: FOCUS, kpis: 6 }, args));
    if (!chk(() => pid(pl), () => `T ${label}: no plan: ${pl.err ? pl.t.slice(0, 500) : JSON.stringify({ k: Object.keys(pl.j), p: pl.j.planProblems, g: pl.j.gulfDates }).slice(0, 900)}`)) return null;
    const G = pl.j.gulfDates || {};
    chk(() => !G.askNext, () => `T ${label}: the date questions all answered, none asked: ${JSON.stringify(G).slice(0, 400)}`);
    const b = snap(MP), a = await approve(`plan_layout ${label}`, pl);
    const r = await call(`create_report ${label}`, 'create_report', Object.assign({ path: MP, focus: FOCUS, kpis: 6, planId: a.id, design: pl.j.design }, args));
    if (!chk(() => !r.err && r.j.report, () => `T ${label}: create_report: ${short(r)}`)) return null;
    const made = listed(`T ${label}`, a.html, b, MP), sc = scripts(made);
    chk(() => sc.some((f) => / - metric switcher\.tmdl$/i.test(f)) && sc.some((f) => / - flip cards( \d+)?\.tmdl$/i.test(f)) && !sc.some((f) => / - status icons\.tmdl$/i.test(f)) && sc.every((f) => a.html.includes(f.split('/').pop())),
      () => `T ${label}: the metric switcher and flip cards scripts written and each named on the approval page (status icons with the person's thresholds: no script): ${JSON.stringify(sc)}`);
    const si = r.j.statusIcons || (r.j.looks || {}).statusIcons || null;
    chk(() => si && JSON.stringify(si).includes('Value Share'), () => `T ${label}: the status icons are said in the answer: ${JSON.stringify(si || Object.keys(r.j)).slice(0, 400)}`);
    const rel = relOf(MP, r.j.pbip || r.j.report.replace(/\.Report$/, '.pbip'));
    const pages = walk(path.join(ROOT, MP, String(r.j.report).split(/[\\/]/).pop(), 'definition/pages')).filter((p) => /page\.json$/.test(p)).map((p) => fs.readFileSync(p, 'utf8')).filter((t) => !/"Tooltip"/.test(t) && !/HiddenInViewMode/.test(t));
    chk(() => pages.length && pages.every((t) => /Is Ramadan/.test(t) && /Hijri Year/.test(t) && /1446/.test(t)), () => `T ${label}: every page holds the Ramadan and Hijri-year 1446 filters (${pages.length} pages)`);
    await verify(`T ${label}`, rel);
    return { rel, r, pl };
  };
  const EN = await together('EN', Object.assign({ name: 'A1 Together', lang: 'en', layout: 'exec', filters: 'end' }, ALL));
  await together('AR native', Object.assign({ name: 'A1 Arabic Together', lang: 'ar', layout: 'analysis', filters: 'start', displayNames: DN, waterfallRtl: 'native' }, ALL));
  await together('AR mirror', Object.assign({ name: 'A1 Arabic Together mirror', lang: 'ar', layout: 'analysis', filters: 'start', displayNames: DN, waterfallRtl: 'mirror' }, ALL));
  if (EN) {
    const twins = [['twin native', { waterfallRtl: 'native' }], ['twin mirror', { waterfallRtl: 'mirror', mirrorPicturePages: true }], ['EN-AR copy', { into: 'same', waterfallRtl: 'native' }]];
    let copy = null;
    for (const [label, x] of twins) {
      const args = Object.assign({ path: EN.rel, terms: DN }, x);
      let tp = await call(`create_arabic_twin T ${label}`, 'create_arabic_twin', args);
      if (pid(tp) === undefined && tp.j && tp.j.moreTexts) notes.push(`T ${label}: moreTexts`);
      const b = snap(MP), a = await approve(`T ${label}`, tp);
      if (!chk(() => a.id, () => `T ${label}: no plan: ${short(tp)}`)) continue;
      const tw = await call(`create_arabic_twin T ${label} written`, 'create_arabic_twin', Object.assign({ planId: a.id }, args));
      if (!chk(() => !tw.err && tw.j.written, () => `T ${label}: ${short(tw)}`)) continue;
      listed(`T ${label}`, a.html, b, MP);
      const rel = relOf(MP, tw.j.pbip); if (x.into === 'same') copy = rel;
      await verify(`T ${label}`, rel);
      // the next twin has the same name: this one is moved aside (as the person would rename it)
      if (!x.into) { const D = path.join(ROOT, MP), b0 = String(tw.j.pbip).split(/[\\/]/).pop().replace(/\.pbip$/, ''), b1 = `${b0} ${label.split(' ')[1]}`;
        fs.renameSync(path.join(D, b0 + '.Report'), path.join(D, b1 + '.Report'));
        const pj = JSON.parse(fs.readFileSync(path.join(D, b0 + '.pbip'), 'utf8')); pj.artifacts = [{ report: { path: b1 + '.Report' } }]; fs.writeFileSync(path.join(D, b1 + '.pbip'), JSON.stringify(pj, null, 2)); fs.rmSync(path.join(D, b0 + '.pbip'));
        fs.readdirSync(D).filter((f) => f.startsWith(b0 + ' - ') && f.endsWith('.tmdl')).forEach((f) => fs.renameSync(path.join(D, f), path.join(D, b1 + f.slice(b0.length)))); }
      // the moved names: every one of them would have to be translated or listed
      chk(() => !(tp.j.notTranslatedNotListed > 0), () => `T ${label}: notTranslated cut: ${tp.j.notTranslatedNotListed}`);
    }
    for (const [label, from] of [['redesign', EN.rel], ['redesign EN-AR', copy]]) {
      if (!from) continue;
      const rp = await call(`plan_layout T ${label}`, 'plan_layout', { path: MP, redesignFrom: from, restyle: { preset: 'Midnight' } });
      const b = snap(MP), a = await approve(`T ${label}`, rp);
      if (!chk(() => a.id, () => `T ${label}: no plan: ${short(rp)}`)) continue;
      const rr = await call(`create_report T ${label}`, 'create_report', { path: MP, redesignFrom: from, planId: a.id, restyle: { preset: 'Midnight' } });
      if (!chk(() => !rr.err && rr.j.report, () => `T ${label}: ${short(rr)}`)) continue;
      listed(`T ${label}`, a.html, b, MP);
      await verify(`T ${label}`, relOf(MP, rr.j.pbip || rr.j.report.replace(/\.Report$/, '.pbip')));
    }
  }
} catch (e) {
  problems.push('the run stopped: ' + String(e && e.stack || e).slice(0, 800));
} finally {
  await s.close();
}

const byTool = {};
answers.forEach((a) => { if (!byTool[a.tool] || byTool[a.tool].chars < a.chars) byTool[a.tool] = a; });
if (process.env.DA_A1_PRINT) answers.forEach((a) => console.log(`  ${String(a.chars).padStart(7)}  ${a.err ? '(refused) ' : ''}${a.label}`));
Object.values(byTool).sort((a, b) => b.chars - a.chars).forEach((a) => console.log(`  largest ${a.tool.padEnd(18)} ${String(a.chars).padStart(6)}  ${a.label}`));
console.log(`  reports written and checked: ${reports.length}; answers: ${answers.length}`);
notes.forEach((n) => console.log('  note: ' + n));
if (process.env.DA_A1_KEEP) console.log('  kept: ' + ROOT); else fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  a1-integration  ${problems.length} of ${checks} checks failed:`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  a1-integration  ${checks} checks`);
