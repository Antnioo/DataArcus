import './test-env.mjs';
// 0.3.3 HX2 (the owner, 11 Nov, D-1111-13: "HX2 go, 3 later, 4 after the entry, name Impact check"; mcp/work/HX2.md).
// HX1's stages 2 and 3 through the real server: check_report's option againstModel (the section impactCheck: which
// visuals can show another number after a MODEL change, each with its chain of names) and read_model's option reach
// (the pages and visuals of every report beside the model that a measure, a column or a table reaches, by tier). Both
// read the health engine's one graph (graphStep, exported once).
//   T1-T4  the twin, the native copy and the redesign of twin-project, and the original alone, on an unchanged model:
//          impactCheck agrees with sameQuestion (6/2/1, 8/0/1, 9/0/0) and the original alone is 9 of 9
//   E1-E6  six planted model edits, each named on exactly its visuals and tier; the chain of names
//   C1     a canary in a measure's DAX and in a page filter: in no answer
//   R1-R4  reach on twin-project; with the three copies beside it, 4 reports; a name the model lacks; a column, a table
//   S1-S3  400 visuals on an edited measure: 60 listed, the rest counted, the answer under 40,000, never "truncated"
//   Q1-Q5  refusals through the registered schema and the reading block
//   N1-N2  without the new options both tools answer as before (no new key)
//   G1-G2  the engine: graphStep exported; lineage reads it (one graph)
//   D1-D3  TOOLS.md, PRIVACY.md and CHANGELOG say Impact check, both options, names and hashes only
// Made up, in os.tmpdir(), from mcp/fixtures/twin-project: no model rows.   node test-0.3.3-hx2.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-hx2-')));
process.env.DATAARCUS_ROOT = ROOT;
const { serverClient } = await import('./test-0.2.9.mjs');

const J = (x) => JSON.stringify(x);
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n');
const CANARY = 'HX2_CANARY_6630';
const lit = (v) => ({ Literal: { Value: `'${v}'` } });
const colOf = (e, p) => ({ Column: { Expression: { SourceRef: { Entity: e } }, Property: p } });
const inFilter = (e, p, v) => ({ Version: 2, From: [{ Name: 's', Entity: e, Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 's' } }, Property: p } }], Values: [[lit(v)]] } } }] });
const RP = 'Twin Sales.Report', SM = 'Twin Sales.SemanticModel', PAGES = (d) => path.join(d, RP, 'definition/pages');
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
const BIM = (d) => path.join(d, SM, 'model.bim');
const files = (d) => { const out = {}; const walk = (x) => fs.readdirSync(x, { withFileTypes: true }).forEach((e) => { const f = path.join(x, e.name); if (e.isDirectory()) walk(f); else if (e.isFile()) out[path.relative(d, f)] = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); }); walk(d); return out; };

// the original: twin-project, its [Total Sales] carrying the canary in a DAX string, a page filter holding it
const P = path.join(ROOT, 'p'); fs.cpSync(path.join(HERE, 'fixtures/twin-project'), P, { recursive: true });
const measure = (m, n) => m.model.tables.flatMap((t) => t.measures || []).find((x) => x.name === n);
{ const m = rd(BIM(P)); measure(m, 'Total Sales').expression = `CALCULATE ( SUM ( Sales[Amount] ), Sales[Region] <> "${CANARY}" )`; wr(BIM(P), m); }
{ const f = path.join(PAGES(P), 'p1overview/page.json'), j = rd(f); j.filterConfig = { filters: [{ name: 'pf1', field: colOf('Sales', 'Region'), type: 'Categorical', filter: inFilter('Sales', 'Region', CANARY) }] }; wr(f, j); }
const ORIG = rel(path.join(P, RP)), ORIG_MODEL = rel(path.join(P, SM));
// a whole project copied (model and report), the model then edited: the "after" side; againstModel the original's model
const project = (name, edit) => { const d = path.join(ROOT, name); fs.cpSync(P, d, { recursive: true, filter: (s) => !/ (AR|native|redesigned)\.Report/.test(s) }); if (edit) { const m = rd(BIM(d)); edit(m); wr(BIM(d), m); } return d; };

const s = await serverClient(ROOT, {});
const answers = [];
const call = async (tool, args) => { const r = await s.call(tool, args); answers.push(r.t); return r; };
const ic = (r) => (r && r.j && r.j.impactCheck) || null;
const nums = (x) => (x ? [x.same, x.order, x.question, x.display] : null);
const at = (x, tier) => (x ? x.differ.filter((d) => !tier || d.tier === tier).map((d) => d.visual).sort() : null);
const made = {};
const run = async (label, planTool, planArgs, writeTool, writeArgs) => {
  const pl = await s.call(planTool, planArgs), id = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!id) { made[label] = { error: pl.t.slice(0, 300) }; return; }
  await s.call('approve_plan', { planId: id });
  const w = await s.call(writeTool, Object.assign({}, writeArgs, { planId: id }));
  made[label] = w.err ? { error: w.t.slice(0, 300) } : { ok: true };
};
try {
  // ---------- N: without the new options, as before ----------
  { const r = await call('check_report', { path: ORIG, checks: ['schemas'] }); chk(() => r.j && !('impactCheck' in r.j), () => 'N1 check_report without againstModel: no impactCheck section'); }
  { const r = await call('read_model', { path: 'p' }); chk(() => r.j && !('reach' in r.j) && Array.isArray(r.j.tables), () => `N2 read_model without reach: the model list, no reach: ${r.t.slice(0, 300)}`); }

  // ---------- R1: reach on twin-project (one report beside the model) ----------
  const reach = async (what, more) => { const r = await call('read_model', Object.assign({ path: 'p', reach: what }, more || {})); return { r, x: r.j && r.j.reach }; };
  { const { r, x } = await reach('[Total Sales]');
    const vis = x && x.reports && x.reports[0] ? x.reports[0].pages.flatMap((p) => p.visuals.map((v) => v.visual)).sort() : null;
    chk(() => x && x.found === true && x.name === '[Total Sales]' && x.reports.length === 1 && x.visuals === 7 && J(vis) === J(['barProduct', 'cardSales', 'colRegion', 'customGauge', 'lineMonth', 'tblProducts', 'tipCard']) && x.reports[0].pages.length === 3,
      () => `R1 [Total Sales] reaches 7 visuals on 3 pages of 1 report: ${r.t.slice(0, 900)}`);
    chk(() => x.reports[0].pages.every((p) => p.visuals.every((v) => v.tier === 'question')) && typeof x.notProved === 'string' && /data/.test(x.notProved), () => `R1b each by its tier, with what it does not prove: ${r.t.slice(0, 600)}`); }
  { const a = (await reach('Sales[Region]')).x, b = (await reach("'Calendar'")).x, c = (await reach('Calendar[Month Number]')).x;
    chk(() => a.visuals === 5 && a.reports[0].pages.length === 1, () => `R3 Sales[Region]: 5 visuals on 1 page: ${J(a)}`);
    chk(() => b.visuals === 1 && b.reports[0].pages[0].visuals[0].visual === 'lineMonth' && /table/.test(b.name), () => `R3b the Calendar table: lineMonth: ${J(b)}`);
    chk(() => c.visuals === 1 && c.reports[0].pages[0].visuals[0].tier === 'order', () => `R3c Calendar[Month Number] (Month Name's sort-by column): lineMonth, in its order only: ${J(c)}`); }
  { const { x } = await reach('[No Such Measure]'); chk(() => x && x.found === false && x.visuals === 0 && /not in the model/.test(x.said), () => `R4 a name the model lacks: found false, said: ${J(x)}`); }

  // ---------- the three copies (written through the real server, beside the original) ----------
  await run('twin', 'create_arabic_twin', { path: 'p/Twin Sales.pbip' }, 'create_arabic_twin', { path: 'p/Twin Sales.pbip' });
  await run('native', 'plan_layout', { path: 'p/Twin Sales.SemanticModel', customVisualsFrom: 'p/Twin Sales.pbip' }, 'create_report', { path: 'p/Twin Sales.SemanticModel' });
  await run('redesign', 'plan_layout', { path: 'p/Twin Sales.SemanticModel', redesignFrom: 'p/Twin Sales.pbip' }, 'create_report', { path: 'p/Twin Sales.SemanticModel' });
  const reports = fs.readdirSync(P).filter((n) => /\.Report$/.test(n));
  const by = { twin: reports.find((n) => / AR\.Report$/.test(n)), native: reports.find((n) => / native\.Report$/.test(n)), redesign: reports.find((n) => / redesigned\.Report$/.test(n)) };
  chk(() => by.twin && by.native && by.redesign, () => `the three copies were written: ${J({ by, made })}`);
  const digest = Object.fromEntries(reports.map((n) => [n, files(path.join(P, n))]));
  // a backup of the model, unchanged
  const BAK = path.join(ROOT, 'backup'); fs.mkdirSync(BAK); fs.cpSync(path.join(P, SM), path.join(BAK, SM), { recursive: true });

  // ---------- T: on an unchanged model, impactCheck agrees with sameQuestion ----------
  const want = { twin: [6, 2, 1, 0], native: [8, 0, 1, 0], redesign: [9, 0, 0, 0] };
  for (const k of Object.keys(want)) {
    if (!by[k]) continue;
    const r = await call('check_report', { path: rel(path.join(P, by[k])), against: ORIG, againstModel: rel(path.join(BAK, SM)), checks: ['schemas'] }), x = ic(r), sq = r.j && r.j.sameQuestion;
    chk(() => J(nums(x)) === J(want[k]) && x.withQuery === 9 && J(at(x)) === J(sq.differ.map((d) => d.visual).sort()), () => `T ${k}: same / order / question / display ${J(want[k])} as sameQuestion, got ${J(nums(x))}: ${J(x && x.differ)} / sameQuestion ${J(sq && sq.differ.map((d) => d.visual))}`);
  }
  { const r = await call('check_report', { path: ORIG, againstModel: rel(path.join(BAK, SM)), checks: ['schemas'] }), x = ic(r);
    chk(() => x && x.same === 9 && x.withQuery === 9 && !x.differ.length && /^9 of 9 visuals can only show other numbers if the data changed/.test(x.said) && !(r.j && r.j.sameQuestion), () => `T4 the original alone on an unchanged backup: 9 of 9, no sameQuestion: ${r.t.slice(0, 700)}`);
    chk(() => typeof x.proves === 'string' && /row-level security/.test(x.notProved) && /custom visual/.test(x.notProved) && /not measured in Power BI Desktop/.test(x.notProved), () => 'T4b the section says what it proves and what it does not'); }

  // ---------- E: planted model edits (the project copied, its model edited; againstModel the original's) ----------
  const E = async (id, edit, w) => {
    const d = project(id, edit), r = await call('check_report', { path: rel(path.join(d, RP)), againstModel: ORIG_MODEL, checks: ['schemas'] }), x = ic(r);
    chk(() => J(at(x, 'question')) === J((w.question || []).slice().sort()) && J(at(x, 'display')) === J((w.display || []).slice().sort()) && J(at(x, 'order')) === J((w.order || []).slice().sort()),
      () => `${id}: expected ${J(w)}, got ${J(x && x.differ.map((v) => [v.visual, v.tier]))} ${x ? '' : r.t.slice(0, 600)}`);
    return x;
  };
  const SEVEN = ['cardSales', 'colRegion', 'lineMonth', 'barProduct', 'customGauge', 'tblProducts', 'tipCard'];
  const e1 = await E('E1', (m) => { measure(m, 'Total Sales').expression = `CALCULATE ( SUMX ( Sales, Sales[Amount] ), Sales[Region] <> "${CANARY}B" )`; }, { question: SEVEN });
  chk(() => e1.differ.every((d) => d.why.length === 1 && d.why[0].name === '[Total Sales]' && /DAX changed/.test(d.why[0].what) && /\[Total Sales\]: measure: its DAX changed/.test(d.why[0].chain)), () => `E1b each visual's reason names [Total Sales] with its chain: ${J(e1 && e1.differ.map((d) => d.why))}`);
  chk(() => /^2 of 9 visuals can only show other numbers if the data changed; 7 can show other numbers \(listed\)/.test(e1.said), () => `E1c the sentence: ${e1 && e1.said}`);
  await E('E2', (m) => { measure(m, 'Orders').expression = 'DISTINCTCOUNT ( Sales[Order Date] )'; }, { question: ['cardOrders'] });
  await E('E3', (m) => { measure(m, 'Total Sales').formatString = '#,0.00'; }, { display: SEVEN });
  await E('E4', (m) => { m.model.tables.find((t) => t.name === 'Calendar').columns.find((c) => c.name === 'Month Name').sortByColumn = 'Year'; }, { order: ['lineMonth'] });
  const e5 = await E('E5', (m) => { m.model.relationships = []; }, { question: ['lineMonth'] });
  chk(() => /relationship removed/.test(e5.differ[0].why[0].what) && e5.differ[0].why[0].name === 'Sales[Order Date] to Calendar[Date]', () => `E5b the relationship said by its columns: ${J(e5 && e5.differ)}`);
  await E('E6', (m) => { m.model.tables[0].measures.push({ name: 'Unused', expression: '[Orders] * 2' }); }, {});
  // a chain through two measures: [Total Sales] now calls [Base], and [Base] is edited
  { const chain = (expr) => (m) => { measure(m, 'Total Sales').expression = '[Base] + 0'; m.model.tables[0].measures.push({ name: 'Base', expression: expr }); };
    const a = project('E7a', chain('SUM ( Sales[Amount] )')), b = project('E7b', chain('SUMX ( Sales, Sales[Amount] * 1 )'));
    const r = await call('check_report', { path: rel(path.join(b, RP)), againstModel: rel(path.join(a, SM)), checks: ['schemas'] }), x = ic(r);
    chk(() => x.question === 7 && x.differ.every((d) => d.why[0].name === '[Base]' && J(d.why[0].through) === J(['[Total Sales]']) && d.why[0].chain === '[Total Sales] uses [Base]: measure: its DAX changed'), () => `E7 the chain: [Total Sales] uses [Base]: ${J(x && x.differ.map((d) => d.why))}`); }

  // ---------- R2: with the three copies beside the model, every report of the model ----------
  { const { r, x } = await reach('[Total Sales]');
    chk(() => x && x.reports.length === 4 && x.reports.every((rp) => rp.visuals >= 1) && x.visuals === x.reports.reduce((n, rp) => n + rp.visuals, 0), () => `R2 four reports beside the model, each reached: ${r.t.slice(0, 900)}`); }

  // ---------- S: 400 visuals on one measure, the measure edited ----------
  { const big = project('big'), pages = PAGES(big), tpl = rd(path.join(pages, 'p2details/visuals/barProduct/visual.json')), order = rd(path.join(pages, 'pages.json'));
    for (let p = 0; p < 16; p++) { const id = 'big' + p; fs.mkdirSync(path.join(pages, id, 'visuals'), { recursive: true }); wr(path.join(pages, id, 'page.json'), Object.assign(rd(path.join(pages, 'p2details/page.json')), { name: id, displayName: 'Big ' + p }));
      for (let v = 0; v < 25; v++) { const j = JSON.parse(JSON.stringify(tpl)); j.name = `v${p}_${v}`; delete j.filterConfig; fs.mkdirSync(path.join(pages, id, 'visuals', j.name)); wr(path.join(pages, id, 'visuals', j.name, 'visual.json'), j); }
      order.pageOrder.push(id); }
    wr(path.join(pages, 'pages.json'), order);
    const old = path.join(ROOT, 'bigold'); fs.mkdirSync(old); fs.cpSync(path.join(big, SM), path.join(old, SM), { recursive: true });
    { const m = rd(BIM(big)); measure(m, 'Total Sales').expression = 'SUMX ( Sales, Sales[Amount] )'; wr(BIM(big), m); }
    const r = await call('check_report', { path: rel(path.join(big, RP)), againstModel: rel(path.join(old, SM)), checks: ['schemas'] }), x = ic(r);
    chk(() => x && x.question === 407 && x.differ.length <= 60 && x.differ.length >= 1 && x.notListed === 407 - x.differ.length, () => `S1 407 visuals can show another number, at most 60 listed, the rest counted: ${J(x && { q: x.question, l: x.differ.length, n: x.notListed })}`);
    chk(() => r.t.length < 40000, () => `S2 the whole answer under 40,000 characters: ${r.t.length}`);
    chk(() => !/"truncated":(true|\{)/.test(r.t), () => 'S3 a capped answer is never passed as fitting: no truncated: ' + (r.t.match(/"truncated":[^,]{0,80}/g) || []).join(' '));
    const rr = await call('read_model', { path: 'big', reach: '[Total Sales]' }), y = rr.j && rr.j.reach;
    chk(() => y && y.visuals === 407 && y.listed <= 60 && y.notListed === 407 - y.listed && rr.t.length < 40000 && !/"truncated":(true|\{)/.test(rr.t), () => `S4 reach on 407 visuals: at most 60 listed, the rest counted, under the cap: ${rr.t.slice(0, 400)}`); }

  // ---------- Q: refusals ----------
  { const r = await call('read_model', { path: 'p', reach: '[Total Sales]', tables: ['Sales'] }); chk(() => r.err && /reach/.test(r.t) && /tables/.test(r.t), () => `Q1 reach with tables: refused: ${r.t.slice(0, 300)}`); }
  { const r = await call('read_model', { path: 'p', reach: '' }); chk(() => r.err, () => `Q2 an empty reach: refused by the schema: ${r.t.slice(0, 300)}`); }
  { const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-hx2-out-')); fs.cpSync(path.join(P, SM), path.join(out, SM), { recursive: true });
    const r = await call('check_report', { path: ORIG, againstModel: path.relative(ROOT, path.join(out, SM)) }); chk(() => r.err && !r.t.includes(CANARY), () => `Q3 againstModel outside the working folder: refused: ${r.t.slice(0, 300)}`); fs.rmSync(out, { recursive: true, force: true }); }
  { const n = project('noby'); const pb = path.join(n, RP, 'definition.pbir'), pj = rd(pb); pj.datasetReference = { byConnection: { connectionString: 'x' } }; wr(pb, pj);
    const r = await call('check_report', { path: rel(path.join(n, RP)), againstModel: ORIG_MODEL }); chk(() => r.err && /model/i.test(r.t) && /againstModel/.test(r.t), () => `Q4 a report whose model is not beside it (byConnection): refused, said: ${r.t.slice(0, 300)}`); }
  { const r = await call('check_report', { path: ORIG, againstModel: 'no/such/folder' }); chk(() => r.err, () => `Q5 againstModel that does not exist: refused: ${r.t.slice(0, 300)}`); }

  // read-only
  chk(() => reports.every((n) => J(files(path.join(P, n))) === J(digest[n])), () => 'W1 a report file changed after the calls');
} finally { await s.close(); }

// ---------- C1: no canary, no hash in any answer ----------
chk(() => answers.length > 20 && answers.every((t) => !t.includes(CANARY)), () => `C1 a canary reached an answer: #${answers.findIndex((t) => t.includes(CANARY))}`);
chk(() => answers.filter((t) => /impactCheck|"reach"/.test(t)).every((t) => !/\b[0-9a-f]{64}\b/.test(t)), () => 'C2 a hash in an impactCheck or reach answer');

// ---------- G: one graph ----------
const Engine = require('../assets/js/model-health-engine.js');
chk(() => typeof Engine.graphStep === 'function' && Engine.graphStep({ model: { tables: [] } }).deps instanceof Map, () => 'G1 the health engine exports graphStep');
chk(() => /graphStep/.test(fs.readFileSync(path.join(HERE, 'lib/lineage.mjs'), 'utf8')) && !/\bbuildIndex\s*\(/.test(fs.readFileSync(path.join(HERE, 'lib/lineage.mjs'), 'utf8')), () => 'G2 lineage.mjs builds the graph through graphStep, not its own buildIndex');

// ---------- D: the words ----------
const doc = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');
chk(() => /`againstModel`/.test(doc('TOOLS.md')) && /`reach`/.test(doc('TOOLS.md')) && /Impact check/.test(doc('TOOLS.md')), () => 'D1 TOOLS.md names againstModel, reach and Impact check');
chk(() => /Impact check/.test(doc('PRIVACY.md')) && /hash/i.test(doc('PRIVACY.md').split('\n').find((l) => /Impact check/.test(l)) || ''), () => 'D2 PRIVACY.md: Impact check\'s row, names and hashes only');
chk(() => { const u = doc('CHANGELOG.md').split(/^## /m).find((x) => /^\[Unreleased\]/.test(x)) || ''; return /Impact check/.test(u) && /againstModel/.test(u) && /reach/.test(u) && !/\b(first|only|official)\b/i.test(u.split('\n').filter((l) => /Impact check/.test(l)).join(' ')); }, () => 'D3 CHANGELOG [Unreleased]: Impact check, both options, never first, only or official');

fs.rmSync(ROOT, { recursive: true, force: true });
problems.forEach((p) => console.log('problem: ' + String(p).slice(0, 900)));
if (problems.length) console.log(`FAIL script=hx2 cause=${problems.length} problem(s)`);
console.log(`${problems.length ? 'FAIL' : 'PASS'}  hx2  ${checks} checks`);
process.exitCode = problems.length ? 1 : 0;
