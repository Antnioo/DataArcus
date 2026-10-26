// 0.3.1 NC1: the custom visuals lab (mcp/lab/custom-visuals-lab.mjs), the owner's question of 26 Oct ("a report of 5
// pages having custom visuals: can DataArcus replace them all with native ones and clean up the clutter"). The lab is a
// made-up hand-made-looking report; this suite proves what the cloud can before the laptop opens it in Desktop.
//   CL-1  the lab writes 5 pages, 13 custom visuals declared (publicCustomVisuals) and placed, 10 native ones, a text
//         box and a shape on each page, and its clutter (uneven gaps, one visual off its row, mixed title sizes and fonts)
//   CL-2  Microsoft's validator (the version mcp/package.json pins) on the original: 0 errors, 0 warnings
//   CL-3  through the real server over stdio, plan_layout customVisualsFrom: 11 replacements, each with the native the
//         lab expects, its plan line and what it loses; the 2 networks not replaced, with why; a plan id; no field name
//         in the lines; the three charts of two AED values asked about (sharedAxes) and split until answered
//   CL-4  with the person's sharedAxes answers (comparable): the same 11, none split, nothing asked
//   CL-5  the original is not changed by the plans
//   CL-6  approve_plan (the tests' browser clicks Approve, test-env.mjs) and create_report: "<name> native" written; only
//         the 2 networks stay custom and declared; every replaced visual keeps its name; validator 0 errors
//   CL-7  plan_layout redesignFrom on the native copy: a plan id, every page, the clutter's boxes changed (the card off
//         its row back on it, page 1's top row with even gaps); approved and written: "<name> native redesigned"
//   CL-8  the laptop's driver (lab/custom-visuals-run.mjs) runs the same chain on its own and fills the result table
// The laptop's run (mcp/lab/CUSTOM-VISUALS-LAB.md) is this chain, then Desktop.
//   node test-0.3.1-custom-visuals-lab.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const HERE = path.dirname(fileURLToPath(import.meta.url)), VT = createRequire(import.meta.url)('../assets/js/visual-types.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const TMP = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-cvlab-')));
const ROOT = path.join(TMP, 'work');
// the modules read DATAARCUS_ROOT when they load: set before they are imported
process.env.DATAARCUS_ROOT = ROOT;
const Lab = await import('./lab/custom-visuals-lab.mjs');

const LAB = path.join(ROOT, 'lab'), RD = path.join(LAB, Lab.NAME + '.Report'), NAT = path.join(LAB, Lab.NAME + ' native.Report');
const tree = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)]));
const hashOf = (d) => tree(d).sort().map((f) => path.relative(d, f) + ':' + fs.readFileSync(f).toString('base64')).join('|');
const visualsOf = (d) => tree(path.join(d, 'definition', 'pages')).filter((f) => /visual\.json$/.test(f)).map((f) => J(f));
const errorsOf = (v) => (v.json && v.json.data ? v.json.data.errorCount : -1), warningsOf = (v) => (v.json && v.json.data ? v.json.data.warningCount : -1);
const FIELDS = /Total Sales|Sales LY|Sales Target|Units Sold|\bOrders\b|Branches|Products|Calendar|Month Start/;
const COMPARABLE = [{ measures: ['Sales[Total Sales]', 'Sales[Sales Target]'], answer: 'comparable' }, { measures: ['Sales[Total Sales]', 'Sales[Sales LY]'], answer: 'comparable' }];
const SPLIT = ['bulletChart', 'tornadoChart', 'smoothLineChart'];

let client = null;
try {
  fs.mkdirSync(ROOT, { recursive: true });
  // ---- CL-1 the lab ----
  const w = Lab.writeLab(LAB);
  const rj = J(path.join(RD, 'definition', 'report.json')), vs = visualsOf(RD), pages = J(path.join(RD, 'definition', 'pages', 'pages.json')).pageOrder;
  const custom = vs.filter((v) => rj.publicCustomVisuals.includes(v.visual.visualType));
  chk(() => w.pages === 5 && pages.length === 5 && rj.publicCustomVisuals.length === 13 && custom.length === 13 && new Set(custom.map((v) => v.visual.visualType)).size === 13,
    () => `CL-1a. 5 pages and the 13 custom visuals, each declared once and placed once: ${pages.length} pages, ${rj.publicCustomVisuals.length} declared, ${custom.length} placed`);
  chk(() => pages.every((p) => { const names = fs.readdirSync(path.join(RD, 'definition', 'pages', p, 'visuals')); return names.includes('pageTitle') && names.includes('band'); })
    && vs.filter((v) => v.visual.visualType === 'textbox').length === 5 && vs.filter((v) => v.visual.visualType === 'shape').length === 5,
    () => 'CL-1b. every page has its text box (the page title) and its shape (a band)');
  chk(() => vs.filter((v) => !rj.publicCustomVisuals.includes(v.visual.visualType) && !['textbox', 'shape'].includes(v.visual.visualType)).length === 10 && Lab.VISUALS_CUSTOM.every((c) => Object.keys(c.roles).length >= 1),
    () => 'CL-1c. 10 native visuals beside the custom ones');
  chk(() => !fs.existsSync(path.join(RD, 'CustomVisuals')) && !tree(LAB).some((f) => /\.pbiviz$/i.test(f)), () => 'CL-1d. no custom visual package bytes in the lab');
  const byName = Object.fromEntries(vs.map((v) => [v.name, v]));
  chk(() => byName.cardOrders.position.y - byName.cardSales.position.y === 5, () => 'CL-1e. the clutter: one visual 5 px off its row');
  { const p1 = ['cvKpiTile', 'cardSales', 'cardOrders', 'cvDialGauge'].map((n) => byName[n].position), gaps = p1.slice(1).map((p, i) => p.x - (p1[i].x + p1[i].width));
    chk(() => new Set(gaps).size === 3 && Math.min(...gaps) >= 8 && Math.max(...gaps) <= 31, () => `CL-1f. the clutter: uneven gaps on page 1's top row (8 to 31 px): ${gaps}`); }
  { const ts = vs.map((v) => v.visual.visualContainerObjects && v.visual.visualContainerObjects.title).filter(Boolean).map((t) => t[0].properties);
    const sizes = new Set(ts.map((p) => p.fontSize.expr.Literal.Value)), fonts = new Set(ts.map((p) => p.fontFamily.expr.Literal.Value));
    chk(() => sizes.size >= 3 && fonts.size >= 3, () => `CL-1g. the clutter: titles in at least 3 sizes and 3 fonts: ${[...sizes]} / ${[...fonts]}`); }
  chk(() => (J(path.join(LAB, Lab.NAME + '.SemanticModel', 'model.bim')).model.tables || []).map((t) => t.name).join() === 'Sales,Branches,Products,Calendar'
    && J(path.join(LAB, Lab.NAME + '.SemanticModel', 'model.bim')).model.tables.every((t) => /#table\(type table \[/.test(t.partitions[0].source.expression)),
    () => 'CL-1h. the model: Sales, Branches, Products, Calendar as typed Power Query rows');
  // ---- CL-2 the validator on the original ----
  const v0 = Lab.validate(RD);
  chk(() => errorsOf(v0) === 0 && warningsOf(v0) === 0, () => `CL-2. the validator on the original: 0 errors, 0 warnings: ${v0.text.slice(0, 600)}`);
  const before = hashOf(RD);

  // ---- CL-3 and CL-4 through the real server ----
  client = new Client({ name: 'test-cvlab', version: '1' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(HERE, 'server.mjs')], env: { ...process.env, DATAARCUS_ROOT: ROOT }, stderr: 'ignore' }));
  const call = async (name, args) => { try { const r = await client.callTool({ name, arguments: args }); const t = r.content[0].text; return { err: !!r.isError, t, j: r.isError ? null : JSON.parse(t) }; } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 500) : JSON.stringify(x.j).slice(0, 700));
  const want = Object.fromEntries(Lab.VISUALS_CUSTOM.map((c) => [c.type, c.expect]));
  const planOf = async (extra) => {
    const pl = await call('plan_layout', Object.assign({ path: 'lab', customVisualsFrom: 'lab/' + Lab.NAME + '.Report' }, extra));
    const cv = (pl.j && pl.j.customVisuals) || {};
    return { pl, cv, reps: cv.replacements || [], not: cv.notReplaced || [] };
  };
  const A = await planOf({});
  chk(() => !A.pl.err && A.reps.length === 11 && A.not.length === 2, () => `CL-3a. 11 replacements, 2 not replaced: ${short(A.pl)}`);
  Lab.VISUALS_CUSTOM.filter((c) => c.expect).forEach((c) => {
    const r = A.reps.find((x) => x.from === c.type);
    chk(() => r && r.native === c.expect && r.page === c.page && /^custom visual \S+ on page \d+ at \d+,\d+ -> /.test(r.line) && r.lost.length >= 1 && /It loses/.test(r.tell) && ['low', 'medium', 'high'].includes(r.confidence),
      () => `CL-3b. ${c.name} (page ${c.page}) becomes ${c.expect}, with its line, confidence and what it loses: ${JSON.stringify(r || null).slice(0, 500)}`);
  });
  chk(() => Lab.VISUALS_CUSTOM.filter((c) => !c.expect).every((c) => A.not.some((x) => x.line.includes(c.type) && /no native visual draws it/.test(x.why) && /network/.test(x.line))),
    () => `CL-3c. the sankey and the force graph are not replaced, with why (a network: no native visual draws it): ${JSON.stringify(A.not).slice(0, 600)}`);
  chk(() => A.pl.j.plan && A.pl.j.plan.planId && (A.pl.j.plan.writesAfterGo || []).some((x) => x.includes(Lab.NAME + ' native')), () => `CL-3d. a plan id, and the plan writes "${Lab.NAME} native": ${short(A.pl)}`);
  chk(() => !FIELDS.test(JSON.stringify(A.reps.map((r) => [r.line, r.why, r.tell, r.lost])) + JSON.stringify(A.not)), () => 'CL-3e. no field or table name in the plan\'s lines (the report\'s names are untrusted)');
  chk(() => SPLIT.every((t) => { const r = A.reps.find((x) => x.from.startsWith(t)); return r && r.axes && r.axes.panels === 2; }) && A.reps.filter((r) => r.axes && r.axes.panels).length === 3
    && A.pl.j.sharedAxes && (A.pl.j.sharedAxes.ask || []).length >= 2,
    () => `CL-3f. the three charts of two AED values: split into 2 panels until the person answers, and asked: ${JSON.stringify([A.reps.map((r) => r.axes || null), A.pl.j && A.pl.j.sharedAxes]).slice(0, 700)}`);
  const B = await planOf({ sharedAxes: COMPARABLE });
  chk(() => !B.pl.err && B.reps.length === 11 && B.not.length === 2 && B.reps.every((r) => !(r.axes && r.axes.panels)) && !((B.pl.j.sharedAxes || {}).ask || []).length && B.pl.j.plan && B.pl.j.plan.planId,
    () => `CL-4. with the person's answers (comparable): 11 replacements, none split, nothing asked, a plan id: ${short(B.pl)}`);
  chk(() => SPLIT.every((t) => { const r = B.reps.find((x) => x.from.startsWith(t)); return r && r.native === want[r.from]; }), () => 'CL-4b. answered, the three charts keep their native type, in one visual each');
  // ---- CL-5 ----
  chk(() => hashOf(RD) === before && !fs.existsSync(NAT), () => 'CL-5. the plans change nothing: the original as it was, no native copy written');

  // ---- CL-6 the native copy, approved and written ----
  const id = B.pl.j && B.pl.j.plan && B.pl.j.plan.planId;
  const ok = await call('approve_plan', { planId: id });
  const made = await call('create_report', { path: 'lab', planId: id, customVisualsFrom: 'lab/' + Lab.NAME + '.Report', sharedAxes: COMPARABLE });
  chk(() => !ok.err && !made.err && made.j.written && made.j.replaced === 11 && fs.existsSync(NAT) && fs.existsSync(path.join(LAB, Lab.NAME + ' native.pbip')), () => `CL-6a. approved and written: "${Lab.NAME} native", 11 replaced: ${short(ok)} / ${short(made)}`);
  const nrj = J(path.join(NAT, 'definition', 'report.json')), nvs = visualsOf(NAT), stillCustom = nvs.filter((v) => v.visual.visualType && !VT.isNative(v.visual.visualType));
  chk(() => nrj.publicCustomVisuals.length === 2 && nrj.publicCustomVisuals.every((t) => /^(sankeyDiagram|forceGraph)/.test(t)) && stillCustom.length === 2,
    () => `CL-6b. the native copy keeps only the 2 networks custom and declared: ${JSON.stringify([nrj.publicCustomVisuals, stillCustom.map((v) => v.name)])}`);
  chk(() => nvs.length === vs.length && Lab.VISUALS_CUSTOM.filter((c) => c.expect).every((c) => { const v = nvs.find((x) => x.name === c.name); return v.visual.visualType === c.expect && JSON.stringify(v.position) === JSON.stringify(byName[c.name].position); }),
    () => 'CL-6c. every replaced visual keeps its name and place and has the expected native type');
  const v1 = Lab.validate(NAT);
  chk(() => errorsOf(v1) === 0, () => `CL-6d. the validator on the native copy: 0 errors: ${v1.text.slice(0, 800)}`);
  chk(() => hashOf(RD) === before, () => 'CL-6e. the original is still as it was');

  // ---- CL-7 the redesign of the native copy (the clutter) ----
  const rd = await call('plan_layout', { path: 'lab', redesignFrom: 'lab/' + Lab.NAME + ' native.Report' });
  const R = rd.j && rd.j.redesign, rid = rd.j && rd.j.plan && rd.j.plan.planId;
  chk(() => !rd.err && R && rid && (R.pages || []).length === 5 && R.counts && R.counts.changed > 0, () => `CL-7a. the redesign of the native copy: a plan id, 5 pages, changes: ${short(rd)}`);
  const ch = (R && R.pages || []).flatMap((p) => p.changes || []), to = (n) => (ch.find((c) => c.visual === n) || {}).to;
  chk(() => to('cardOrders') && to('cardSales') && to('cardOrders').y === to('cardSales').y, () => `CL-7b. the card 5 px off its row is put back on it: ${JSON.stringify([to('cardSales'), to('cardOrders')])}`);
  { const row = ['cvKpiTile', 'cardSales', 'cardOrders', 'cvDialGauge'].map(to), gaps = row.every(Boolean) ? row.slice(1).map((p, i) => p.x - (row[i].x + row[i].w)) : [];
    chk(() => gaps.length === 3 && new Set(gaps).size === 1, () => `CL-7c. page 1's top row with even gaps after the redesign: ${JSON.stringify(gaps)}`); }
  await call('approve_plan', { planId: rid });
  const rmade = await call('create_report', { path: 'lab', planId: rid, redesignFrom: 'lab/' + Lab.NAME + ' native.Report' });
  const RED = rmade.j && rmade.j.report ? path.join(LAB, path.basename(String(rmade.j.report))) : null;
  chk(() => !rmade.err && RED && fs.existsSync(RED) && errorsOf(Lab.validate(RED)) === 0, () => `CL-7d. the redesign approved and written, validator 0 errors: ${short(rmade)}`);
  // ---- CL-8 the laptop's driver ----
  const { run } = await import('./lab/custom-visuals-run.mjs');
  const D = path.join(TMP, 'driver'), o = await run(path.join(HERE, 'server.mjs'), D), md = fs.readFileSync(path.join(D, 'nc1-results.md'), 'utf8');
  chk(() => o.native.replaced === 11 && o.redesigned.written !== false && (md.match(/^\| \d \| cv/gm) || []).length === 13 && (md.match(/not replaced/g) || []).length === 2 && /native copy 0 errors/.test(md) && /redesigned 0 errors/.test(md),
    () => `CL-8. the driver's run: 11 replaced, the redesign written, 13 rows in the result table, validator 0 errors: ${md.slice(0, 600)}`);
} catch (e) { problems.push('the suite threw: ' + (e && e.stack || e)); }
finally { if (client) await client.close().catch(() => {}); }
fs.rmSync(TMP, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL script=test-0.3.1-custom-visuals-lab.mjs cause=${problems.length} check(s) failed`); console.log(`FAIL  custom-visuals-lab  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  custom-visuals-lab  ${checks} checks`);
