// 0.3.1 P3A (the laptop's part 3, block B, 28 Oct; Power BI Desktop 2.159): two defects of 0.3.1-rc.2.
// (1) create_report's own check said "0 problems Power BI Desktop would show" while check_report on the files it had just
// written put PBIR_TEXTBOX_HEIGHT_BELOW_FLOOR and PBIR_SLICER_HEADER_MAY_CLIP under "can break the report in Power BI
// Desktop". Both are warnings of Microsoft's validator ("may be too small", "may be clipped ... verify in Desktop"), and
// the repo's measured Desktop evidence has Desktop drawing them whole (scripts/tests/DESKTOP-TESTS.md, 2026-10-01 and
// round 11 item 7): check_report groups them as "may not look as meant" (mayLook), and create_report's check carries the
// plan's validator warnings in the same kinds, so the two tools give one verdict on the same files.
// (2) generate_theme with a full palette and mode "dark" wrote a light theme and dropped mode with no line: the drop is
// said in repaired, in sayInPlan and on the approval page; the person's colours are kept as given.
//   P1-P3   the grouping (check-report.mjs): the two measured codes are mayLook; every other validator finding keeps its kind
//   P4-P15  three laptop cases (EN exec, filters top, Tahoma; EN exec, filters top, 1280 x 720; AR exec, Tahoma) written
//           by create_report, then check_report on the same files: no "can break", the same counts in each kind
//   T1-T6   generate_theme: a palette whose page decides against the mode asked
//   node test-0.3.1-p3a.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { serverClient } from './test-0.2.9.mjs';
import * as CR from './lib/check-report.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const CODES = ['PBIR_TEXTBOX_HEIGHT_BELOW_FLOOR', 'PBIR_SLICER_HEADER_MAY_CLIP'];

// ---------- P1-P3: the grouping ----------
const v = (rule, severity, file) => ({ origin: 'validator', rule, severity, file: file || 'definition/pages/p/visuals/v/visual.json', _base: 'visual.json' });
chk(() => CODES.every((c) => CR.impactOf(v(c, 'warning')) === 'mayLook'), () => `P1. the two measured validator warnings are mayLook: ${CODES.map((c) => CR.impactOf(v(c, 'warning'))).join(', ')}`);
chk(() => CR.impactOf(v('PBIR_VISUAL_TYPE_UNKNOWN', 'warning')) === 'canBreak' && CR.impactOf(v('PBIR_SLICER_HEIGHT_BELOW_FLOOR', 'error')) === 'canBreak' && CR.impactOf(v('PBIR_TEXTBOX_HEIGHT_BELOW_FLOOR', 'error')) === 'canBreak'
  && CR.impactOf(v('PBIR_THEME_FILE_NAME_MISMATCH', 'error', 'StaticResources/x.json')) === 'desktopOpens' && CR.impactOf({ origin: 'schema', rule: 'SCHEMA', severity: 'error' }) === 'canBreak',
() => 'P2. every other validator finding keeps its kind: an unmeasured warning, the slicer\'s clip error and any error stay canBreak; the Desktop-opens codes stay desktopOpens');
chk(() => CR.IMPACT.mayLook && /may not look/.test(CR.IMPACT.mayLook) && !/can break/i.test(CR.IMPACT.mayLook) && CODES.every((c) => CR.DESKTOP_DRAWS[c] && /DESKTOP-TESTS\.md/.test(CR.DESKTOP_DRAWS[c].evidence))
  && /may not look as meant/.test(CR.impactSummary({ desktopOpens: 0, canBreak: 0, dataarcusRule: 0, mayLook: 2 }, { validator: { ran: true, mode: 'offline' } })),
() => `P3. the kind's sentence and each code's measured evidence; the summary says it: ${JSON.stringify(CR.IMPACT.mayLook)} ${JSON.stringify(CR.DESKTOP_DRAWS)}`);

// ---------- P4-P15: the laptop's cases, end to end ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-p3a-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-p3a-log-')));
const log = path.join(LOGS, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, {});
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
// the person's click on Approve; returns the approval page's text
async function approve(pid) {
  const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n); const html = url ? unesc(await req(url, 'GET')) : '';
  if (url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId: pid }); }
  return html;
}
// a sample project, then the tour's report plan with the case's options, answered as a person answers it, approved,
// written; then check_report on the written report
async function laptopCase(lang, extra) {
  const p = await w.call('plan_layout', Object.assign({ sample: true }, lang === 'ar' ? { lang } : {})), pid = p.j && p.j.plan && p.j.plan.planId;
  if (!pid) return { why: 'no sample plan: ' + short(p) };
  await approve(pid);
  const sw = await w.call('create_report', Object.assign({ sample: true, path: p.j.sample.folder, planId: pid }, lang === 'ar' ? { lang } : {}));
  const t1 = ((sw.j || {}).tour || []).find((x) => x.call && x.call.tool === 'plan_layout' && !x.call.args.languages);
  if (!t1) return { why: 'no tour: ' + short(sw) };
  const args = Object.assign({}, t1.call.args, { layout: 'exec' }, lang === 'ar' ? { lang } : {}, extra);
  let pl = await w.call('plan_layout', args);
  for (let i = 0; i < 6 && !pl.err; i++) {
    const j = pl.j || {}, more = {};
    if (j.gulfDates && j.gulfDates.askNext && !args.gulfDates && ((j.gulfDates.candidates || [])[0] || {}).field) more.gulfDates = { dateRole: j.gulfDates.candidates[0].field, grain: 'gregorian', scope: 'all' };
    if (j.sharedAxes && (j.sharedAxes.ask || []).length && !args.sharedAxes) more.sharedAxes = j.sharedAxes.ask.map((q) => ({ measures: q.measures, answer: 'separate' }));
    // (an Arabic plan: the made-up Arabic names a person approves for the fields still without one)
    const tie = ((j.arabicNames || {}).titlesInEnglish || {}).fields || [];
    if (tie.length && !(j.plan && j.plan.planId)) more.displayNames = Object.assign({}, args.displayNames, Object.fromEntries(tie.map((f, k) => [f, 'المقياس ' + (k + 1)])));
    if (!Object.keys(more).length) break;
    Object.assign(args, more); pl = await w.call('plan_layout', args);
  }
  const rid = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!rid) return { why: 'no report plan: ' + short(pl) };
  await approve(rid);
  const send = Object.assign({}, args, { planId: rid, design: pl.j.design, fields: args.planFields }); delete send.planFields;
  const rep = await w.call('create_report', send);
  if (rep.err) return { why: 'not written: ' + short(rep) };
  const cr = await s.call('check_report', { path: rep.j.open });
  return { pl, rep, cr };
}
const CASES = [['EN exec, filters top, Tahoma', 'en', { filters: 'top', design: { font: 'Tahoma' } }, ['PBIR_TEXTBOX_HEIGHT_BELOW_FLOOR']],
  ['EN exec, filters top, 1280 x 720', 'en', { filters: 'top', page: { w: 1280, h: 720 } }, CODES],
  ['AR exec, Tahoma', 'ar', { design: { font: 'Tahoma' } }, ['PBIR_TEXTBOX_HEIGHT_BELOW_FLOOR']]];
let n = 4;
try {
  for (const [label, lang, extra, codes] of CASES) {
    const r = await laptopCase(lang, extra), k = n; n += 4;
    const cr = r.cr && r.cr.j, kinds = cr && cr.impact && cr.impact.kinds, fs0 = (cr && cr.findings) || [], ck = r.rep && r.rep.j && r.rep.j.check;
    // the case reproduces the laptop's (the validator's warnings are there, on the written files)
    chk(() => cr && codes.every((c) => fs0.some((f) => f.rule === c && f.severity === 'warning' && f.origin === 'validator')), () => `P${k}. ${label}: check_report finds ${codes.join(' and ')}, as the laptop saw: ${r.why || JSON.stringify(cr && cr.counts)}`);
    // (b) Microsoft's own severity and the measured evidence: not "can break"
    chk(() => cr && fs0.filter((f) => CODES.includes(f.rule)).every((f) => f.impact === 'mayLook') && kinds.canBreak.count === 0 && kinds.mayLook.count === fs0.filter((f) => CODES.includes(f.rule)).length && !/can break/i.test(cr.impact.summary) && /may not look as meant/.test(cr.impact.summary),
      () => `P${k + 1}. ${label}: the two warnings are "may not look as meant", nothing "can break": ${cr && JSON.stringify({ summary: cr.impact.summary, byImpact: cr.counts.byImpact })}`);
    // (c) the same verdict from create_report's check on the same files
    chk(() => ck && ck.validator && ck.validator.ran === true && ck.validator.canBreak === kinds.canBreak.count && ck.validator.mayLook === kinds.mayLook.count && ck.validator.desktopOpens === kinds.desktopOpens.count,
      () => `P${k + 2}. ${label}: create_report's check gives the same counts in each kind as check_report: ${JSON.stringify(ck && ck.validator)} vs ${JSON.stringify(cr && cr.counts.byImpact)}`);
    chk(() => ck && (lang === 'ar' ? /قد لا تظهر كما يُراد/.test(ck.summary) && !/تعطل/.test(ck.summary) : /may not look as meant/.test(ck.summary) && !/can break/i.test(ck.summary)) && new RegExp(codes[0]).test(JSON.stringify(ck.validator.byRule || {})),
      () => `P${k + 3}. ${label}: create_report's summary says Microsoft's validator's warnings, as check_report does (in the report's language): ${JSON.stringify(ck && { summary: ck.summary, validator: ck.validator })}`);
  }

  // ---------- T1-T6: generate_theme, mode and a full palette ----------
  const PAL = (bg, card, text) => ({ data: ['#1f6feb', '#2da44e', '#bf8700', '#cf222e', '#8250df', '#1b7c83', '#a40e26', '#57606a'], ui: { background: bg, card, text, accent: '#1f6feb' } });
  const lightPal = PAL('#f6f8fa', '#ffffff', '#1f2328'), darkPal = PAL('#0d1117', '#161b22', '#e6edf3');
  const g = await w.call('generate_theme', { name: 'P3A Light Palette', palette: lightPal, chart: { look: 'auto' }, mode: 'dark' }), G = g.j || {};
  const rm = (G.repaired || []).find((x) => x.field === 'mode');
  chk(() => !g.err && rm && rm.given === 'dark' && rm.used === 'light' && /palette/.test(rm.why) && /#f6f8fa/i.test(rm.why),
    () => `T1. a full light palette with mode "dark": repaired says mode was not used, and why: ${short(g)}`);
  chk(() => /mode "dark" was not used/.test(G.sayInPlan) && /palette/.test(G.sayInPlan), () => `T2. sayInPlan says it: ${G.sayInPlan}`);
  chk(() => G.colours && G.colours.page.toLowerCase() === '#f6f8fa' && G.colours.visuals.toLowerCase() === '#ffffff' && G.colours.text.toLowerCase() === '#1f2328' && G.colours.mode === 'light',
    () => `T3. the person's colours are kept as given (never changed without a yes): ${JSON.stringify(G.colours)}`);
  const page = G.plan && G.plan.planId ? await approve(G.plan.planId) : '';
  chk(() => /Mode/.test(page) && /"dark" was asked and not used/.test(page), () => `T4. the approval page's Mode row says it: ${page.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').match(/Mode.{0,240}/) || page.slice(0, 300)}`);
  const gd = await w.call('generate_theme', { name: 'P3A Dark Palette', palette: darkPal, chart: { look: 'auto' }, mode: 'dark' });
  const gl = await w.call('generate_theme', { name: 'P3A Light Light', palette: lightPal, chart: { look: 'auto' }, mode: 'light' });
  const gm = await w.call('generate_theme', { name: 'P3A Dark Mode', chart: { look: 'auto' }, mode: 'dark' });
  chk(() => [gd, gl, gm].every((x) => !x.err && !(x.j.repaired || []).some((y) => y.field === 'mode') && !/was not used/.test(x.j.sayInPlan)) && gd.j.colours.mode === 'dark' && gl.j.colours.mode === 'light' && gm.j.colours.mode === 'dark',
    () => `T5. a palette that agrees with the mode, and mode without a palette: nothing said, the mode kept: ${[gd, gl, gm].map(short).join(' | ')}`);
  // the write after the go: the theme file as planned (light, the palette's own page) and the same line in its answer
  const gw = G.plan && G.plan.planId ? await w.call('generate_theme', { name: 'P3A Light Palette', palette: lightPal, chart: { look: 'auto' }, mode: 'dark', planId: G.plan.planId }) : { err: true, t: 'no plan' };
  const tp = gw.j && gw.j.path ? path.resolve(ROOT, gw.j.path) : null, tf = tp && fs.existsSync(tp) ? fs.readFileSync(tp, 'utf8') : null;
  chk(() => !gw.err && tf && /"#f6f8fa"/i.test(tf) && !/"#0d1117"/i.test(tf) && (gw.j.repaired || []).some((y) => y.field === 'mode' && y.given === 'dark') && /mode "dark" was not used/.test(gw.j.sayInPlan),
    () => `T6. the write after the go: the file has the palette's page, and its answer says mode was not used: ${short(gw)}`);
} catch (e) { problems.push('the run threw: ' + String(e && e.stack || e).slice(0, 600)); }
finally { await s.close(); await w.close(); }

if (problems.length) { console.log(`FAIL script=test-0.3.1-p3a.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  p3a  ${problems.length} of ${checks} checks failed`); process.exit(1); }
console.log(`PASS  p3a  ${checks} checks`);
process.exit(0);
