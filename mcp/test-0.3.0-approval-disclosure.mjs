import './test-env.mjs';
// 0.3.0 R6 (the outside audit of 19 Oct, F07, F08, F09, F13): the approval page shows everything the click approves, the
// theme pins its model, and no tool answer of the redesign path holds a value saved in the report. Written red first.
// Made-up fixtures only (mcp/fixtures/twin-project and health-project, copied and changed here): no employer or client data.
//   T07 a theme planned from a model pins the model (its definition and the report theme its colours come from): a change
//       after the go is refused with nothing on disk; the gate refuses a model plan written without one and the reverse;
//       a theme with no model is still written; an edit between the last read and the first write is refused
//       (DATAARCUS_TEST_EDIT_BEFORE_WRITE), for generate_theme and create_report
//   T08 synthetic sentinels in a static title, a saved filter, a slicer state, a bookmark and a DATATABLE row: none is in
//       any tool answer of the redesign path; a visual is named by its kind, fields and place; the title is still copied
//   T09 the actual approval HTML: every file a report writes, grouped and counted; the measured why of a kind change; the
//       overwrite sentence true for each plan kind; the native copy's every loss; the redesign's every copied file;
//       a long answers list in full; hostile names escaped and shown as text
//   T13 a low-contrast first colour: the page shows the approved colour, the written colour and why, before the click;
//       the written theme has exactly the shown colour
//   node test-0.3.0-approval-disclosure.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? x.t.slice(0, 500) : JSON.stringify(x && x.j).slice(0, 500));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => fs.writeFileSync(f, JSON.stringify(j, null, 2));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rels = (d) => tree(d).map((f) => path.relative(d, f).split(path.sep).join('/')).sort();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-r6-')));
const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
['th', 'th2', 'th3'].forEach((d) => cp('fixtures/twin-project', d));
['hp', 'hp2'].forEach((d) => cp('fixtures/health-project', d));
cp('fixtures/twin-project', 'rd'); cp('fixtures/twin-project', 'nat');
const TWIN = (d) => `${d}/Twin Sales.SemanticModel`, THEME = (d) => path.join(ROOT, d, 'Twin Sales.Report/StaticResources/RegisteredResources/twin-theme.json');
const BIM = (d) => path.join(ROOT, d, 'Twin Sales.SemanticModel/model.bim');

// ---- T08's sentinels (rd): a static title, a page filter, a slicer selection, a bookmark filter, a DATATABLE row ----
const SENT = { title: 'R6_TITLE_SENTINEL_81', filter: 'R6_FILTER_SENTINEL_82', slicer: 'R6_SLICER_SENTINEL_83', bookmark: 'R6_BOOKMARK_SENTINEL_84', datatable: 'R6_DATATABLE_SENTINEL_85' };
const lit = (v) => ({ Literal: { Value: `'${v}'` } });
const colOf = (e, p) => ({ Column: { Expression: { SourceRef: { Entity: e } }, Property: p } });
const inFilter = (e, p, v) => ({ Version: 2, From: [{ Name: 's', Entity: e, Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 's' } }, Property: p } }], Values: [[lit(v)]] } } }] });
// hostile names (HTML, quotes, instruction-like text), shown on the approval page as text only
const HOSTILE = '<script>alert(1)</script> "q" \'s <b>bold</b>';
{
  const D = path.join(ROOT, 'rd/Twin Sales.Report/definition'), P = path.join(D, 'pages');
  { const f = path.join(P, 'p1overview/visuals/lineMonth/visual.json'), j = rd(f); j.visual.visualContainerObjects.title[0].properties.text.expr.Literal.Value = `'${SENT.title}'`; wr(f, j); }
  { const f = path.join(P, 'p1overview/page.json'), j = rd(f); j.filterConfig = { filters: [{ name: 'pf1', field: colOf('Sales', 'Region'), type: 'Categorical', filter: inFilter('Sales', 'Region', SENT.filter) }] }; wr(f, j); }
  { const f = path.join(P, 'p1overview/visuals/slRegion/visual.json'), j = rd(f); j.visual.objects = Object.assign({}, j.visual.objects, { general: [{ properties: { filter: { filter: inFilter('Sales', 'Region', SENT.slicer) } } }] }); wr(f, j); }
  { const f = path.join(D, 'bookmarks/bmReset.bookmark.json'), j = rd(f); j.explorationState.sections.p1overview.filters = { byExpr: [{ name: 'bf1', type: 'Categorical', expression: colOf('Sales', 'Region'), filter: inFilter('Sales', 'Region', SENT.bookmark) }] }; wr(f, j); }
  { const f = path.join(P, 'p2details/page.json'), j = rd(f); j.displayName = HOSTILE; wr(f, j); }
  const b = rd(BIM('rd')); b.model.tables.push({ name: 'Targets', columns: [{ name: 'Region', dataType: 'string', isDataTypeInferred: true, sourceColumn: '[Region]', type: 'calculatedTableColumn' }],
    partitions: [{ name: 'Targets', mode: 'import', source: { type: 'calculated', expression: `DATATABLE ( "Region", STRING, { { "${SENT.datatable}" } } )` } }] });
  wr(BIM('rd'), b);
}
// ---- T09's long answers list (an): 30 "Please confirm" questions, each answered ----
{
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
  const col = (name, dataType, f) => ({ name, dataType, sourceColumn: name, formatString: f, summarizeBy: 'none' });
  fs.mkdirSync(path.join(ROOT, 'an/M.SemanticModel'), { recursive: true });
  wr(path.join(ROOT, 'an/M.SemanticModel/model.bim'), { compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Qty', 'int64', '#,0'), col('Amount', 'double', '#,0.00')],
    measures: Array.from({ length: 30 }, (_, i) => ({ name: `Units Doubled ${String(i + 1).padStart(2, '0')}`, expression: `SUM(Sales[Qty]) + SUM(Sales[Qty]) + ${i}`, formatString: '#,0' })) }] } });
}
// ---- the format script (hp): a percentage measure without a format ----
{ const f = path.join(ROOT, 'hp/Health Test.SemanticModel/model.bim'), j = rd(f), t = j.model.tables.find((x) => x.name === '_Measures');
  t.measures.push({ name: 'Margin %', expression: 'DIVIDE ( [Total], [Total] + 1 )' }); wr(f, j); }

const Plans = await import('./lib/plans.mjs');
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, {});
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const hook = (rel) => serverClient(ROOT, { DATAARCUS_TEST_EDIT_BEFORE_WRITE: rel });
const answers = [];
const call = async (srv, name, args) => { const r = await srv.call(name, args); answers.push(r.t); return r; };
// the approval page of a plan made on w, as the person's browser gets it; then (approve) the click on Approve
const pageOf = async (planId, approve) => {
  const n = links().length; await call(w, 'approve_plan', { planId }); const url = await linkAt(n), html = url ? await req(url, 'GET') : '';
  if (approve && url) { await req(url, 'POST', 'decision=approve'); await call(w, 'approve_plan', { planId }); }
  return html;
};
const added = (before) => rels(ROOT).filter((r) => !before.includes(r) && r !== 'links.txt');

try {
  // ---------- T07: the theme pins its model ----------
  {
    const args = { path: TWIN('th'), name: 'Pinned Theme' };
    const p = await call(s, 'generate_theme', args), id = p.j && p.j.plan && p.j.plan.planId;
    chk(() => id && p.j.plan.modelPinned && p.j.fromReport, () => `T07-1. a theme planned from a model's report pins the model (modelPinned): ${short(p)}`);
    await call(s, 'approve_plan', { planId: id });
    const t = rd(THEME('th')); t.dataColors[0] = '#123456'; wr(THEME('th'), t);
    const before = rels(ROOT), x = await call(s, 'generate_theme', Object.assign({ planId: id }, args));
    chk(() => x.err && /^Nothing was written: the model changed after you approved/.test(x.t) && !added(before).length, () => `T07-2. the report's palette changed after the go: refused, nothing on disk: ${short(x)} ${JSON.stringify(added(before))}`);
    // the model's definition changed after the go (th2): refused too
    const p2 = await call(s, 'generate_theme', { path: TWIN('th2'), name: 'Pinned Theme 2' }), id2 = p2.j && p2.j.plan && p2.j.plan.planId;
    await call(s, 'approve_plan', { planId: id2 });
    const b = rd(BIM('th2')); b.model.tables[0].description = 'changed after the go'; wr(BIM('th2'), b);
    const before2 = rels(ROOT), x2 = await call(s, 'generate_theme', { path: TWIN('th2'), name: 'Pinned Theme 2', planId: id2 });
    chk(() => x2.err && /model changed after you approved/.test(x2.t) && !added(before2).length, () => `T07-3. the model's definition changed after the go: refused, nothing on disk: ${short(x2)}`);
    // the same inputs, nothing changed: written (the pin does not refuse a good write)
    const p3 = await call(s, 'generate_theme', { path: TWIN('th3'), name: 'Pinned Theme 3' }), id3 = p3.j && p3.j.plan && p3.j.plan.planId;
    await call(s, 'approve_plan', { planId: id3 });
    const x3 = await call(s, 'generate_theme', { path: TWIN('th3'), name: 'Pinned Theme 3', planId: id3 });
    chk(() => !x3.err && x3.j.path && fs.existsSync(path.join(ROOT, x3.j.path)), () => `T07-4. nothing changed: the theme from the model is written: ${short(x3)}`);
  }
  // the gate itself (in process): a plan made with a model needs the model at the write, and the reverse
  {
    const pin = { a: 1 };
    const withModel = Plans.propose('theme', { key: '/m', print: 'p1' }, ['x'], { pins: { generate_theme: pin } }); Plans.approve(withModel, 'user-in-browser');
    let e = null; try { Plans.gate('generate_theme', withModel, null, pin); } catch (x) { e = x; }
    chk(() => e && /^Nothing was written/.test(e.message) && /model/.test(e.message), () => `T07-5. the gate refuses a plan made with a model when the write passes none: ${e && e.message}`);
    const noModel = Plans.propose('theme', null, ['x'], { pins: { generate_theme: pin } }); Plans.approve(noModel, 'user-in-browser');
    e = null; try { Plans.gate('generate_theme', noModel, { key: '/m', print: 'p1' }, pin); } catch (x) { e = x; }
    chk(() => e && /^Nothing was written/.test(e.message) && /model/.test(e.message), () => `T07-6. the gate refuses a plan made without a model when the write passes one: ${e && e.message}`);
    const both = Plans.propose('theme', null, ['x'], { pins: { generate_theme: pin } }); Plans.approve(both, 'user-in-browser');
    e = null; try { Plans.gate('generate_theme', both, null, pin); } catch (x) { e = x; }
    chk(() => !e, () => `T07-7. a theme made with no model stays allowed: ${e && e.message}`);
    const brand = await call(s, 'generate_theme', { brand: '#0F766E', name: 'No Model Theme' }); await call(s, 'approve_plan', { planId: brand.j.plan.planId });
    const wb = await call(s, 'generate_theme', { brand: '#0F766E', name: 'No Model Theme', planId: brand.j.plan.planId });
    chk(() => !wb.err && wb.j.path && fs.existsSync(path.join(ROOT, wb.j.path)), () => `T07-8. a theme with no model is written as before: ${short(wb)}`);
  }
  // an edit after the last model read and before the first write (the server's test hook edits the model file there)
  {
    cp('fixtures/twin-project', 'th4');
    const h = await hook('th4/Twin Sales.SemanticModel/model.bim');
    try {
      const p = await h.call('generate_theme', { path: TWIN('th4'), name: 'Late Edit' }); await h.call('approve_plan', { planId: p.j.plan.planId });
      const before = rels(ROOT), x = await h.call('generate_theme', { path: TWIN('th4'), name: 'Late Edit', planId: p.j.plan.planId }); answers.push(x.t);
      chk(() => x.err && /^Nothing was written: the model changed/.test(x.t) && !added(before).length, () => `T07-9. generate_theme: an edit between the last read and the first write is refused, nothing on disk: ${short(x)} ${JSON.stringify(added(before))}`);
    } finally { await h.close(); }
    const h2 = await hook('hp2/Health Test.SemanticModel/model.bim');
    try {
      const pl = await h2.call('plan_layout', { path: 'hp2', name: 'Late Report', layout: 'exec' }); await h2.call('approve_plan', { planId: pl.j.plan.planId });
      const before = rels(ROOT), x = await h2.call('create_report', { path: 'hp2', name: 'Late Report', planId: pl.j.plan.planId, design: pl.j.design }); answers.push(x.t);
      chk(() => x.err && /^Nothing was written: the model changed/.test(x.t) && !added(before).length, () => `T07-10. create_report: an edit between the last read and the first write is refused, nothing on disk: ${short(x)} ${JSON.stringify(added(before)).slice(0, 300)}`);
    } finally { await h2.close(); }
  }

  // ---------- T09 + T13: a new report's approval page (hp: a measured kind change, a format script, phone layouts) ----------
  let reportPage = '', reportOut = null, reportPlan = null;
  {
    const args = { path: 'hp', name: 'Disclosure', layout: 'exec', colors: { accent: '#F4B183' } };
    reportPlan = await call(w, 'plan_layout', args);
    const id = reportPlan.j && reportPlan.j.plan && reportPlan.j.plan.planId;
    chk(() => id && reportPlan.j.formats && reportPlan.j.formats.scriptAfterGo && reportPlan.j.kindChanges && reportPlan.j.kindChanges.slots[0].why, () => `T09 setup. the report plan has a plan id, a format script and a measured kind change: ${short(reportPlan)}`);
    reportPage = await pageOf(id, true);
    reportOut = await call(w, 'create_report', { path: 'hp', name: 'Disclosure', colors: { accent: '#F4B183' }, planId: id, design: reportPlan.j.design });
    chk(() => !reportOut.err && reportOut.j.written !== false, () => `T09 setup. the report is written: ${short(reportOut)}`);
  }
  const PAGE = unesc(reportPage);
  {
    const proj = path.join(ROOT, 'hp'), written = rels(proj).filter((r) => /^Disclosure(\.Report\/|\.pbip$)/.test(r) || / - fix formats\.tmdl$/.test(r));
    const missing = written.filter((r) => !PAGE.includes(r));
    chk(() => written.length > 20 && !missing.length, () => `T09-1. the approval page names every file the report writes (${written.length}): missing ${JSON.stringify(missing.slice(0, 8))}`);
    const count = (re) => written.filter((r) => re.test(r)).length;
    const said = (label, n) => new RegExp(`${label} \\(${n}\\)`).test(PAGE);
    chk(() => said('Visuals', count(/\/visual\.json$/)) && said('Phone layouts', count(/\/mobile\.json$/)) && said('Pages', count(/\/page\.json$/)) && count(/\/mobile\.json$/) > 0,
      () => `T09-2. the files are grouped and counted (visuals ${count(/\/visual\.json$/)}, phone layouts ${count(/\/mobile\.json$/)}, pages ${count(/\/page\.json$/)}): ${PAGE.slice(PAGE.indexOf('Files that will be written'), PAGE.indexOf('Files that will be written') + 600)}`);
    const script = reportPlan.j.formats && reportPlan.j.formats.scriptAfterGo;
    chk(() => script && new RegExp(`Format script \\(1\\)`).test(PAGE) && PAGE.includes(script), () => `T09-3. the format script is named in the file list: ${script}`);
    const why = reportPlan.j.kindChanges && reportPlan.j.kindChanges.slots[0].why;
    chk(() => why && PAGE.includes(why), () => `T09-4. a kind change shows the lint's measured why, not a rebuilt reason: ${why}`);
    chk(() => !/Nothing is overwritten or deleted\./.test(PAGE) && /nothing is overwritten/i.test(PAGE) && /removes what this call created/.test(PAGE), () => `T09-5. the report page's overwrite sentence is true (new files only; a failed write removes what this call created): ${(PAGE.match(/<p class="note">[^<]*overwrit[^<]*/) || [''])[0]}`);
    chk(() => !/DataArcus never reads the model's rows/.test(PAGE) && /never returns data values/.test(PAGE), () => 'T09-6. the preview note says what the code does: the files are read on this machine, no data value is returned');
  }
  // T13: the low-contrast first colour, before the click; the written theme has exactly that colour
  {
    const m = /approved colour (#[0-9a-f]{6}) -> written colour (#[0-9a-f]{6})[^<]*contrast ([\d.]+):1 against [^<]*(#[0-9a-f]{6})[^<]*needs 3:1/i.exec(PAGE);
    chk(() => m && m[1].toLowerCase() === '#f4b183' && m[2].toLowerCase() !== '#f4b183', () => `T13-1. the page shows the approved colour, the written colour and why (contrast X:1 against the background, needs 3:1): ${(PAGE.match(/[^>]*written colour[^<]*/) || ['none'])[0]}`);
    let theme = null; try { const d = path.join(ROOT, 'hp/Disclosure.Report/StaticResources/RegisteredResources'); theme = rd(path.join(d, fs.readdirSync(d).find((f) => f.endsWith('.json')))); } catch (e) { theme = null; }
    chk(() => m && theme && theme.dataColors[0].toLowerCase() === m[2].toLowerCase(), () => `T13-2. the written theme's first colour is exactly the one shown: ${theme && theme.dataColors[0]} vs ${m && m[2]}`);
    chk(() => m && Math.abs(+m[3] - 1.9) < 0.2, () => `T13-3. the contrast shown is the approved colour's on the card (#F4B183 on white is about 1.9:1): ${m && m[3]}`);
  }

  // ---------- T08 + T09: the redesign (rd: sentinels, a hostile page name) ----------
  {
    const pl = await call(w, 'plan_layout', { path: TWIN('rd'), redesignFrom: 'rd/Twin Sales.pbip' }), id = pl.j && pl.j.plan && pl.j.plan.planId;
    chk(() => id, () => `T08 setup. the redesign gets a plan id: ${short(pl)}`);
    const html = id ? await pageOf(id, true) : '', H = unesc(html);
    const out = id ? await call(w, 'create_report', { path: TWIN('rd'), redesignFrom: 'rd/Twin Sales.pbip', planId: id }) : { err: true, t: 'no plan' };
    chk(() => !out.err && out.j.written === true, () => `T08 setup. the redesign is written: ${short(out)}`);
    const src = rels(path.join(ROOT, 'rd/Twin Sales.Report'));
    const missing = src.filter((r) => !H.includes('Twin Sales redesigned.Report/' + r));
    chk(() => src.length > 20 && !missing.length && H.includes('Twin Sales redesigned.pbip'), () => `T09-7. the redesign's page names every file the copy writes (${src.length} + the .pbip): missing ${JSON.stringify(missing.slice(0, 8))}`);
    chk(() => new RegExp(`Nothing is left out: all ${src.length} files of the original are copied`).test(H), () => `T09-8. the redesign's page says nothing is left out, with the count: ${H.slice(H.indexOf('Files that will be written'), H.indexOf('Files that will be written') + 500)}`);
    chk(() => /New files only: nothing is overwritten/.test(H) && !/Nothing is overwritten or deleted\./.test(H), () => 'T09-9. the redesign\'s overwrite sentence is true for it');
    chk(() => html.length > 0 && !html.includes(HOSTILE) && !/<script>alert|<b>bold<\/b>/.test(html) && (html.includes(esc(HOSTILE)) || /withheld|instruction/i.test(H)), () => `T09-10. a hostile page name is escaped and shown as text: ${html.slice(html.indexOf('Details') - 100, html.indexOf('Details') + 100)}`);
    // T08: none of the sentinels is in any answer of the redesign path; a visual is named by kind, fields and place
    const all = answers.join('\n');
    Object.entries(SENT).forEach(([k, v]) => chk(() => !all.includes(v), () => `T08-${k}. the ${k} sentinel is in a tool answer of the redesign path`));
    const changes = ((pl.j && pl.j.redesign && pl.j.redesign.pages) || []).flatMap((p) => (p.changes || []).concat(p.notChanged || []));
    chk(() => changes.length > 5 && changes.every((c) => c.title === undefined && c.type && c.place && Array.isArray(c.fields)), () => `T08-6. each visual is named by its kind, its fields and its place, never its title: ${JSON.stringify(changes.slice(0, 3))}`);
    const copied = path.join(ROOT, 'rd/Twin Sales redesigned.Report/definition/pages/p1overview/visuals/lineMonth/visual.json');
    chk(() => fs.existsSync(copied) && fs.readFileSync(copied, 'utf8').includes(SENT.title), () => 'T08-7. the static title is still copied into the written file (on this machine)');
  }

  // ---------- T09: the native copy's every loss (nat) ----------
  {
    const pl = await call(w, 'plan_layout', { path: TWIN('nat'), customVisualsFrom: 'nat/Twin Sales.pbip' }), id = pl.j && pl.j.plan && pl.j.plan.planId;
    const reps = (pl.j && pl.j.customVisuals && pl.j.customVisuals.replacements) || [];
    const H = id ? unesc(await pageOf(id, false)) : '';
    const lost = reps.flatMap((r) => r.lost || []);
    chk(() => reps.length && lost.length >= 2 && reps.every((r) => H.includes(r.line)) && lost.every((l) => H.includes(l)) && !/"lost":/.test(H), () => `T09-11. the native copy's page shows every replacement and every loss, in words, never cut: ${H.slice(H.indexOf('Custom visuals'), H.indexOf('Custom visuals') + 400)}`);
  }

  // ---------- T09: a long answers list (an: 30 questions answered) ----------
  {
    const h0 = await call(w, 'check_model_health', { path: 'an/M.SemanticModel', maxItems: 50 });
    const items = (h0.j && h0.j.pleaseConfirm && h0.j.pleaseConfirm.items) || [];
    const given = items.map((q, i) => ({ answerKey: q.answerKey, answer: i % 2 ? 'mistake' : 'intended' }));
    const h1 = await call(w, 'check_model_health', { path: 'an/M.SemanticModel', maxItems: 50, answers: given });
    const id = h1.j && h1.j.plan && h1.j.plan.planId;
    const H = id ? unesc(await pageOf(id, false)) : '';
    const shown = items.filter((q, i) => H.includes(q.object) && new RegExp(`${q.object.replace(/[[\]().*+?^$|\\]/g, '\\$&')}[^<]*</td><td[^>]*>[^<]*${i % 2 ? 'a mistake' : 'intended'}`).test(H));
    chk(() => items.length === 30 && id && shown.length === 30 && !/…/.test(H.slice(H.indexOf('Answers'))), () => `T09-12. every answered question is shown with its answer (${shown.length} of ${items.length}), never cut: ${H.slice(H.indexOf('Answers'), H.indexOf('Answers') + 400)}`);
    chk(() => /This plan writes a new answers file|replaces the answers file DataArcus wrote/.test(H) && !/Nothing is overwritten or deleted\./.test(H), () => 'T09-13. the answers plan says what it writes and whether it replaces anything');
  }
} finally {
  await s.close(); await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

console.log(`test-0.3.0-approval-disclosure: ${checks - problems.length}/${checks} checks passed`);
if (problems.length) { problems.forEach((p) => console.log('FAIL ' + p)); process.exit(1); }
console.log('PASS');
