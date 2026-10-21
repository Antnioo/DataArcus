import './test-env.mjs';
// 0.3.0 T1 (21 Oct): the simulated beta testers' findings (the private engine repo, evals/results/2026-10-21-testers.md
// and evals/FINDINGS.md T-1..T-9, 18 episodes on 819f4b5), each quoted where its check is. Written red first. Made-up
// fixtures only (mcp/fixtures/twin-project and health-project, copied into a "Sales" subfolder as the testers' setup had
// them): no employer or client data.
//   T-1 the approval page: a summary by kind in words first, the file asked for named on top, the full list folded
//   T-2 a report path that misses: "Did you mean "Sales/Twin Sales.pbip"?", never "ask the person"
//   T-3 "0 problems Power BI Desktop would show, 3 more worth a look": the items listed, one plain line each
//   T-4 "TMDL script" / "the user applies it in TMDL view": what the file is and the 3 steps, on the page and in the answer
//   T-6 the page, the plan and the write answer agree (the blank page background; the redesign's copied theme)
//   T-7 internal inputs in plain words, raw inputs folded, unused options left out, no "fingerprint"
//   T-8 plan_layout's slicers-without-filters message names the value that fits and why
//   T-9 the folder named ("in the folder "Sales", next to "Twin Sales.pbip"")
//   T-5 the approval page in Arabic for an Arabic plan, right to left, paths isolated
//   C1  the Arabic calendar columns script alone (add_gulf_calendar arabicColumnsOnly); the calendar answer grouped
//   node test-0.3.0-testers.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? x.t.slice(0, 600) : JSON.stringify(x && x.j).slice(0, 600));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rels = (d) => tree(d).map((f) => path.relative(d, f).split(path.sep).join('/')).sort();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
// the part of the page from one text to another (raw HTML)
const between = (H, from, to) => { const i = H.indexOf(from); if (i < 0) return ''; const j = to ? H.indexOf(to, i + from.length) : -1; return H.slice(i, j < 0 ? i + 4000 : j); };

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-t1-')));
const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
// (the testers' setup: the made-up project sat in a subfolder "Sales" of the working folder)
cp('fixtures/twin-project', 'Sales');
['hp/Sales', 'rd/Sales'].forEach((d) => cp('fixtures/health-project', d));
['tw/Sales', 'ar/Sales', 'cal/Sales', 'th/Sales'].forEach((d) => cp('fixtures/twin-project', d));

const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const pageOf = async (planId, approve) => {
  const n = links().length; await w.call('approve_plan', { planId }); const url = await linkAt(n), html = url ? await req(url, 'GET') : '';
  if (approve && url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId }); }
  return html;
};
const FILES = 'Files that will be written';
// the files part of a page, and what stands before its fold
const filesPart = (html) => between(html, `id="files"`, "</div>");
const beforeFold = (html) => { const f = filesPart(html), i = f.indexOf('<details'); return i < 0 ? f : f.slice(0, i); };
const STEPS = (H) => /TMDL view/.test(H) && /Preview/.test(H) && /Apply/.test(H);

try {
  // ---------- T-1, T-3, T-4 (format script), T-6 (blank background), T-7 (fingerprint): a new report ----------
  // finance / pnl-report: "Monthly P&L.Report/definition/pages/.../visuals/.../visual.json" (about 100 raw paths);
  // finance / waterfall: "102 files:"; "0 problems Power BI Desktop would show, 3 more worth a look" (layout-check.js:287)
  let repHtml = '', repPlan = null, repOut = null;
  {
    repPlan = await w.call('plan_layout', { path: 'hp/Sales', name: 'Testers', layout: 'exec' });
    const id = repPlan.j && repPlan.j.plan && repPlan.j.plan.planId;
    chk(() => id, () => `T-1 setup. the report gets a plan id: ${short(repPlan)}`);
    repHtml = id ? await pageOf(id, true) : '';
    repOut = id ? await w.call('create_report', { path: 'hp/Sales', name: 'Testers', planId: id, design: repPlan.j.design }) : { err: true, t: 'no plan' };
    chk(() => !repOut.err, () => `T-1 setup. the report is written: ${short(repOut)}`);
  }
  {
    const top = unesc(beforeFold(repHtml)), part = filesPart(repHtml);
    const before = rels(path.join(HERE, 'fixtures/health-project')), written = rels(path.join(ROOT, 'hp/Sales')).filter((r) => !before.includes(r));
    const pages = written.filter((r) => /\/page\.json$/.test(r)).length, visuals = written.filter((r) => /\/visual\.json$/.test(r)).length, phones = written.filter((r) => /\/mobile\.json$/.test(r)).length;
    chk(() => new RegExp(`1 report: ${pages} pages?, ${visuals} visuals?`).test(top) && new RegExp(`${phones} phone layouts?`).test(top),
      () => `T1-1. the summary by kind comes first, in words (1 report: ${pages} pages, ${visuals} visuals, ... ${phones} phone layouts): ${top.slice(0, 500)}`);
    chk(() => /Testers\.pbip/.test(top) && !/1 script/.test(top), () => `T1-2. the report the person asked for is named on top, before the fold: ${top.slice(0, 500)}`);
    const folds = part.match(/<details[^>]*>/g) || [];
    chk(() => folds.length >= 1 && !/\bopen\b/.test(folds[0]) && part.indexOf('<details') < part.indexOf('visual.json'), () => `T1-3. the full list is folded under a closed <details>: ${part.slice(0, 400)}`);
    const missing = written.filter((r) => !unesc(repHtml).includes(r));
    chk(() => written.length > 20 && !missing.length, () => `T1-4 (guard). every file written is on the page, folded: missing ${JSON.stringify(missing.slice(0, 6))}`);
    chk(() => new RegExp(`All ${written.length} files`).test(unesc(part)), () => `T1-5. the count on the page is what the write wrote (${written.length}): ${unesc(part).slice(0, 300)}`);
    // T-3: the items "worth a look" are listed (the page's count, in its summary line)
    const ckPart = unesc(between(repHtml, 'Checked before writing', '</div>')), worth = +((/(\d+) more worth a look/.exec(ckPart) || [])[1] || 0);
    const items = repPlan.j && repPlan.j.exactCheck && repPlan.j.exactCheck.worthALookItems;
    chk(() => worth > 0, () => `T3 setup. the plan's check has items worth a look: ${ckPart.slice(0, 300)}`);
    chk(() => Array.isArray(items) && items.length === Math.min(worth, 12) && items.every((x) => typeof x === 'string' && x.length > 10),
      () => `T3-1. the answer lists each item worth a look in one plain line: ${JSON.stringify(items).slice(0, 400)}`);
    chk(() => Array.isArray(items) && items.length && items.every((x) => ckPart.includes(x)), () => `T3-2. the approval page lists those items: ${ckPart.slice(0, 600)}`);
    chk(() => Array.isArray(items) && items.every((x) => /No action needed|\b(Keep|Make|Move|Give|Set|Use|Add|Check|Change|Rename|Leave|Remove|Widen)\b/.test(x)), () => `T3-3. each item says what to do, or "no action needed": ${JSON.stringify(items).slice(0, 400)}`);
    const H = unesc(repHtml);
    chk(() => !/a small text file that/i.test(H) && !(repPlan.j.plan || {}).scriptIs, () => 'T4-1 (guard). a plan that writes no script says nothing about scripts');
    // T-6 (it-reviewer / exec-report): "...executive-report-background.png" listed, then "There is no background image."
    const png = written.find((r) => /-background\.png$/.test(r));
    chk(() => png && /Page background[^.]*blank/i.test(H), () => `T6-1. the blank page background is listed as what it is (blank, see-through): ${png} | ${H.slice(H.indexOf('Images') - 50, H.indexOf('Images') + 200)}`);
    const panels = repOut.j && String(repOut.j.panels || '');
    chk(() => panels && !/There is no background image\./.test(panels) && /blank/.test(panels), () => `T6-2. the write answer agrees with the page (a blank background file, no picture): ${panels}`);
    // T-7 (beginner / nice-report): "...to check and fingerprint them, and never returns data values to Claude."
    chk(() => !/fingerprint/i.test(H) && /never returns data values/.test(H), () => 'T7-1. no "fingerprint" on the page; the data-values promise stays');
    // T-6, the judge's "unplanned slicer": every slicer the report writes is on the page
    const slicerFields = written.filter((r) => /\/visual\.json$/.test(r)).map((r) => JSON.parse(fs.readFileSync(path.join(ROOT, 'hp/Sales', r), 'utf8'))).filter((j) => j.visual && j.visual.visualType === 'slicer')
      .map((j) => { const p = (((j.visual.query || {}).queryState || {}).Values || {}).projections || []; return p.map((x) => x.queryRef || '').join(','); }).filter(Boolean);
    const missingSlicers = slicerFields.filter((q) => !H.includes(q.replace(/^.*\./, '')));
    chk(() => !missingSlicers.length, () => `T6-3 (guard). every slicer the report writes is named on the page: ${JSON.stringify(missingSlicers)} of ${JSON.stringify(slicerFields)}`);
  }

  // ---------- T-1, T-4, T-7, T-9: the twin ----------
  // hr-riyadh / arabic-twin: "32 files:" ... "never applied: the user applies it in TMDL view" (server.mjs:571);
  // hr-riyadh / ar-report-en-model: Options "Waterfall, right to left: native: ..." on a report with no waterfall
  let twinHtml = '', twinPlan = null;
  {
    twinPlan = await w.call('create_arabic_twin', { path: 'tw/Sales/Twin Sales.pbip' });
    const id = twinPlan.j && twinPlan.j.plan && twinPlan.j.plan.planId;
    chk(() => id && twinPlan.j.plan.writesAfterGo.some((x) => /\.tmdl/.test(x)), () => `T4 setup. the twin's plan writes the Arabic calendar script: ${short(twinPlan)}`);
    twinHtml = id ? await pageOf(id, true) : '';
    const out = id ? await w.call('create_arabic_twin', { path: 'tw/Sales/Twin Sales.pbip', planId: id }) : { err: true, t: 'no plan' };
    chk(() => !out.err, () => `T1 setup. the twin is written: ${short(out)}`);
    const before = rels(path.join(HERE, 'fixtures/twin-project')), written = rels(path.join(ROOT, 'tw/Sales')).filter((r) => !before.includes(r));
    const top = unesc(beforeFold(twinHtml)), H = unesc(twinHtml);
    const script = written.find((r) => /\.tmdl$/.test(r));
    chk(() => /التقارير: 1 \(الصفحات: \d+/.test(top) && /السكربتات: 1/.test(top) && script && top.includes(script), () => `T1-6. the twin's summary in words (the twin's page is Arabic, T-5), its script named on top: ${script} | ${top.slice(0, 400)}`);
    chk(() => new RegExp(`All ${written.length} files`).test(unesc(filesPart(twinHtml))), () => `T1-7. the twin's count is what the write wrote (${written.length})`);
    chk(() => /السكربت ملف نصي صغير/.test(H) && /لا يغيّر DataArcus نموذجك بنفسه أبدًا/.test(H) && STEPS(H), () => `T4-3. the twin's (Arabic) page says what the script is and the 3 steps: ${H.slice(H.indexOf('script'), H.indexOf('script') + 300)}`);
    chk(() => /a small text file/i.test(twinPlan.j.plan.scriptIs || '') && (twinPlan.j.plan.howToApplyScript || []).length === 3, () => `T4-4. the twin's plan answer carries scriptIs and the 3 steps: ${JSON.stringify(twinPlan.j.plan).slice(0, 400)}`);
    chk(() => !/the user applies it in TMDL view/.test(twinPlan.j.plan.writesAfterGo.join(' ')), () => `T4-5. the plan's writes no longer say "the user applies it in TMDL view": ${twinPlan.j.plan.writesAfterGo.join(' | ')}`);
    chk(() => twinPlan.j.plan.writesAfterGo.some((x) => /in the folder "tw\/Sales", next to "Twin Sales\.pbip"/.test(x)), () => `T9-1. the twin's writes name the folder: ${twinPlan.j.plan.writesAfterGo.join(' | ')}`);
    chk(() => !/Waterfall, right to left/.test(H), () => 'T7-2. a twin of a report with no waterfall shows no waterfall option');
  }

  // ---------- T-2: a report path that misses ----------
  // hr-riyadh / c1-calendar: ""Twin Sales.pbip" is not a report: give a .pbip file, a .Report folder, or a folder
  // holding definition/." (read-report.mjs:135) when the report sat in Sales/
  {
    // (its own working folder, as the testers had it: one project, in Sales/)
    const R2 = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-t1b-'))); fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(R2, 'Sales'), { recursive: true });
    const w2 = await serverClient(R2, {});
    try {
    const said = (x) => x.err && /Did you mean "Sales\/Twin Sales\.pbip"\?/.test(x.t);
    const r1 = await w2.call('read_report', { path: 'Twin Sales.pbip' });
    chk(() => said(r1), () => `T2-1. read_report names the report found in the subfolder: ${short(r1)}`);
    const r2 = await w2.call('create_arabic_twin', { path: 'Twin Sales' });
    chk(() => said(r2), () => `T2-2. create_arabic_twin too, given the name without .pbip: ${short(r2)}`);
    const r3 = await w2.call('check_report', { path: 'Twin Sales.pbip' });
    chk(() => said(r3), () => `T2-3. check_report too: ${short(r3)}`);
    chk(() => /again with (that|this) path/.test(r1.t) && !/ask the (user|person)/i.test(r1.t), () => `T2-4. the message says to retry with that path, not to ask the person: ${r1.t}`);
    const r4 = await w2.call('read_report', { path: 'Nope Report.pbip' });
    chk(() => r4.err && /No report named "Nope Report"/.test(r4.t) && /Sales\/Twin Sales\.pbip/.test(r4.t), () => `T2-5. no name matches: the reports in the working folder are named: ${short(r4)}`);
    const r5 = await w2.call('read_report', { path: 'Sales/Twin Sales.pbip' });
    chk(() => !r5.err, () => `T2-6 (guard). the path the hint gives reads: ${short(r5)}`);
      } finally { await w2.close(); fs.rmSync(R2, { recursive: true, force: true }); }
  }

  // ---------- T-4, T-7, T-9: the health check's scripts ----------
  // it-reviewer / health-check: "maxItems: 15 weekStart: sunday"; "next to the project (never applied: the user applies
  // it in TMDL view)" (server.mjs:571)
  {
    const h = await w.call('check_model_health', { path: 'rd/Sales', maxItems: 15, weekStart: 'sunday' });
    const id = h.j && h.j.plan && h.j.plan.planId;
    chk(() => id, () => `T7 setup. the health check proposes its scripts: ${short(h)}`);
    const html = id ? await pageOf(id, false) : '', H = unesc(html);
    chk(() => !/maxItems/.test(between(html, '>Inputs<', '<details')) && /at most 15/.test(H) && /Sunday/.test(H), () => `T7-3. the inputs in plain words (at most 15, Sunday), the raw names folded: ${H.slice(H.indexOf('Inputs'), H.indexOf('Inputs') + 400)}`);
    chk(() => /<details[^>]*>\s*<summary>[^<]*(raw|as given)/i.test(html) && /maxItems/.test(html), () => `T7-4. the raw inputs stay on the page, behind a fold: ${html.slice(html.indexOf('Inputs'), html.indexOf('Inputs') + 600)}`);
    chk(() => h.j.plan.writesAfterGo.every((x) => !/fix script/.test(x) || /in the folder "rd\/Sales", next to "Health Test Report\.pbip"/.test(x)), () => `T9-2. the health scripts' place is named: ${h.j.plan.writesAfterGo.join(' | ')}`);
    chk(() => /a small text file/i.test(H) && STEPS(H) && /a small text file/i.test(h.j.plan.scriptIs || ''), () => 'T4-6. the health check\'s page and plan say what a script is, with the steps');
  }

  // ---------- T-6, T-7: the redesign ----------
  // beginner / redesign: "The redesign writes no format script and no theme file of its own." (approval-window.mjs:325)
  // above a list with a theme JSON and a background PNG; "moves from 40, 40, 700 x 640 to 40, 40, 704 x 640"
  {
    const pl = await w.call('plan_layout', { path: 'rd/Sales', redesignFrom: 'rd/Sales/Health Test Report.pbip' }), id = pl.j && pl.j.plan && pl.j.plan.planId;
    chk(() => id, () => `T6 setup. the redesign gets a plan id: ${short(pl)}`);
    const html = id ? await pageOf(id, false) : '', H = unesc(html);
    const hasTheme = /Theme \(\d+\)/.test(H);
    chk(() => !/no theme file of its own/.test(H) && (!hasTheme || /theme[^.]*the original's, copied/i.test(H)), () => `T6-4. the redesign's sentence agrees with its list (the theme listed is the original's, copied): ${H.slice(H.indexOf('Nothing is left out'), H.indexOf('Nothing is left out') + 400)}`);
    chk(() => !/moves from \d+, \d+, \d+ x \d+ to \d+/.test(H), () => `T7-5. a redesign's move is said in words, not as raw coordinates: ${(H.match(/moves from[^;]*/) || [''])[0]}`);
  }

  // ---------- T-8: slicers on a layout without filters ----------
  // finance / waterfall: "slicers (planFields.slicers): this layout has no filters; plan them with filters "start",
  // "end" or "top", or leave the slicers out." (server.mjs:1620)
  {
    const r = await w.call('plan_layout', { path: 'hp/Sales', name: 'No Filters', layout: 'exec', filters: 'none', planFields: { slicers: ['Calendar[Year]'] } });
    const msg = r.j && Array.isArray(r.j.planProblems) ? r.j.planProblems.join(' ') : r.t;
    chk(() => /filters "(top|start|end)"/.test(msg) && /because/.test(msg) && !/"start", "end" or "top"/.test(msg), () => `T8-1. the message names the value that fits and why: ${msg.slice(0, 600)}`);
  }

  // ---------- T-9: the theme file's place ----------
  // it-reviewer / approval-theme: "the theme file "my-brand-theme.json" in the working folder" (server.mjs:1422)
  {
    const t = await w.call('generate_theme', { path: 'th/Sales/Twin Sales.SemanticModel', name: 'My Brand', folder: 'th/Sales' });
    const wr = t.j && t.j.plan ? t.j.plan.writesAfterGo.join(' ') : '';
    chk(() => /in the folder "th\/Sales"/.test(wr), () => `T9-3. the theme's place is named: ${wr || short(t)}`);
    const t2 = await w.call('generate_theme', { name: 'Root Brand' });
    const wr2 = t2.j && t2.j.plan ? t2.j.plan.writesAfterGo.join(' ') : '';
    chk(() => /in the working folder itself/.test(wr2) || /in the working folder \(/.test(wr2), () => `T9-4. a theme at the root says it is the working folder itself: ${wr2 || short(t2)}`);
    const id = t.j && t.j.plan && t.j.plan.planId, html = id ? await pageOf(id, false) : '', top = unesc(beforeFold(html));
    chk(() => /My-Brand|My Brand|my-brand/i.test(top) && /\.json/.test(top), () => `T1-8. the theme's page names the theme file on top: ${top.slice(0, 300)}`);
    chk(() => !/\b1 files\b/.test(unesc(html)), () => 'T1-9. "1 files" is not written');
  }

  // ---------- T-5: the page in Arabic for an Arabic plan ----------
  // hr-riyadh / ar-report-en-model: "DataArcus asks before it writes anything. Nothing has been written yet." in English
  // (approval-window.mjs:119) for an Arabic-speaking user
  {
    const a = twinHtml;
    chk(() => /<html lang="ar" dir="rtl">/.test(a), () => `T5-1. the twin's page is Arabic, right to left: ${a.slice(0, 120)}`);
    chk(() => /موافقة/.test(a) && /لم يُكتب أي شيء بعد/.test(a) && !/DataArcus asks before it writes anything/.test(a), () => 'T5-2. its fixed texts are Arabic (the lead, the buttons)');
    chk(() => /<bdi dir="ltr">[^<]*Twin Sales AR\.Report\//.test(a), () => `T5-3. file paths stay as they are, isolated left to right: ${(a.match(/<li[^>]*>[^<]*<bdi[^>]*>[^<]*Report[^<]*/) || [''])[0]}`);
    chk(() => /<html lang="en">/.test(repHtml) && /DataArcus asks before it writes anything/.test(repHtml), () => 'T5-4 (guard). an English plan\'s page stays English');
    const pl = await w.call('plan_layout', { path: 'ar/Sales', name: 'Arabic Testers', layout: 'exec', lang: 'ar' }), id = pl.j && pl.j.plan && pl.j.plan.planId;
    const html = id ? await pageOf(id, false) : '';
    chk(() => /<html lang="ar" dir="rtl">/.test(html) && /موافقة/.test(html), () => `T5-5. an Arabic report's page is Arabic too: ${id ? html.slice(0, 120) : short(pl)}`);
  }

  // ---------- C1: the Arabic calendar columns alone; add_gulf_calendar's answer grouped ----------
  // hr-riyadh / c1-calendar: she refused a 32-file report plan for one script; hr-riyadh / gulf-calendar-ksa: "a long JSON
  // with 50 column names and dense apply instructions" (gulf-calendar.mjs:142)
  {
    const before = rels(ROOT);
    const c = await w.call('add_gulf_calendar', { path: 'cal/Sales', arabicColumnsOnly: true });
    const id = c.j && c.j.plan && c.j.plan.planId;
    chk(() => id && c.j.plan.writesAfterGo.length === 1 && /Arabic calendar\.tmdl/.test(c.j.plan.writesAfterGo[0]) && !rels(ROOT).filter((r) => !before.includes(r) && !/links\.txt$/.test(r)).length,
      () => `C1-1. arabicColumnsOnly plans one script, the Arabic calendar columns, and writes nothing yet: ${short(c)}`);
    const html = id ? await pageOf(id, true) : '';
    chk(() => /1 script/.test(unesc(beforeFold(html))) && !/report:/.test(unesc(beforeFold(html))), () => `C1-2. its page: one script, no report: ${unesc(beforeFold(html)).slice(0, 300)}`);
    const out = id ? await w.call('add_gulf_calendar', { path: 'cal/Sales', arabicColumnsOnly: true, planId: id }) : { err: true, t: 'no plan' };
    const added = rels(ROOT).filter((r) => !before.includes(r) && !/links\.txt$/.test(r));
    chk(() => !out.err && added.length === 1 && /^cal\/Sales\/Twin Sales - Arabic calendar\.tmdl$/.test(added[0]), () => `C1-3. after the click exactly that script is written, next to the project: ${JSON.stringify(added)} ${short(out)}`);
    const s = added.length ? fs.readFileSync(path.join(ROOT, added[0]), 'utf8') : '';
    chk(() => /^createOrReplace/.test(s) && /ref table/.test(s) && /\(Arabic\)/.test(s), () => `C1-4. the script adds Arabic columns to the model's own date table: ${s.slice(0, 200)}`);
    chk(() => out.j && Array.isArray(out.j.howToApplyScript) && out.j.howToApplyScript.length === 3 && /a small text file/i.test(out.j.scriptIs || ''), () => `C1-5. the write answer says what the file is and the 3 steps: ${short(out)}`);
    const g = await w.call('add_gulf_calendar', { path: 'cal/Sales', firstYear: 2024, lastYear: 2025, country: 'ksa', asOf: '2026-10-21' });
    const cols = g.j && g.j.columns;
    chk(() => g.j && !Array.isArray(cols) && typeof (g.j.columnsByKind || '') === 'string' && /\d+ date columns?/.test(g.j.columnsByKind) && /\d+ Hijri/.test(g.j.columnsByKind),
      () => `C1-6. add_gulf_calendar's answer groups its columns ("12 date columns, 8 Hijri, ..."), no flat list of every name: ${short(g)}`);
    chk(() => g.j && g.j.plan && Array.isArray(g.j.plan.howToApplyScript) && g.j.plan.howToApplyScript.length === 3 && /a small text file/i.test(g.j.plan.scriptIs || ''), () => `C1-7. and the apply steps as in T-4: ${short(g)}`);
    chk(() => g.j && g.j.plan && g.j.plan.writesAfterGo.some((x) => /in the folder "cal\/Sales", next to "Twin Sales\.pbip"/.test(x)), () => `T9-5. the calendar's place is named: ${g.j && g.j.plan && g.j.plan.writesAfterGo.join(' | ')}`);
  }
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  test-0.3.0-testers  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  test-0.3.0-testers  ${checks} checks`);
