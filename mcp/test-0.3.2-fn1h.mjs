import './fixtures/sp1/seeded-random.mjs';
import './test-env.mjs';
// 0.3.2 FN1H (mcp/work/FN1H.md): three functions split into named steps, behaviour identical. A characterisation suite
// recorded on the base (integration/0.3.2 2fc104ce, before the split) for the parts no other suite turned red under a
// mutant: create_report's answer (lib/report-result.mjs reportAnswer, 141 made-up build states: every note's condition
// on, then one variant per condition), check_model_health's registration and answers through the real server (its entry
// in the tool list, byte for byte; answers and refusals on made-up models), and the shared writer's visuals
// (assets/js/pbip-visuals.js visual: 300 seeded hand-placed reports and 2 edges, every file written). Recorded in
// fixtures/fn1h-pins.json as sha256 and length; FN1H_RECORD=1 records them again (only on the base, never to make a run
// pass); FN1H_DUMP=<file> writes the texts compared. The writer's random ids come from SP1's one fixed seed.
// (0.3.3 TL1, D-1111-14: every tool's texts in tools/list were shortened on purpose) B1's pin alone was moved, by hand, to
// check_model_health's new entry (5,597 -> 4,626 characters); its schema is pinned against the base by test-0.3.3-tl1.mjs.
//   A1  create_report's answers;  B1  check_model_health in the tool list;  B2  its answers and refusals;
//   C1  the writer's files and results;  C2  the builds reach the visual's parts (title, logo, text, Top N, detail,
//   subtitles, fitted titles, "No data", the panel)
//   node test-0.3.2-fn1h.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { BUILDS } from './fixtures/fn1h-builds.mjs';
import { fullState, VARIANTS } from './fixtures/fn1h-cases.mjs';
import { reportAnswer } from './lib/report-result.mjs';
import { serverClient } from './test-0.2.9.mjs';
import { copyFixtures, questionsModel } from './fixtures/health-models.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const pin = (t) => ({ length: t.length, sha256: sha(t) });
const GOLD = path.join(HERE, 'fixtures', 'fn1h-pins.json');
const now = {}, texts = {};

// ---------- C: the writer's visuals (first: the seeded ids run in this process's order) ----------
const vis = []; let allText = '';
// the 300 seeded builds, then two edges a search of 3,000 more found (seed 7): a story title that fits its room only by
// the 16 a side, and a gallery title whose tail is said
const EDGES = [[7, 253], [7, 943]].map(([seed, i]) => ['E' + seed + '-' + i, BUILDS(i, seed)[i - 1][1]]);
for (const [name, run] of BUILDS(300).concat(EDGES)) {
  let r; try { r = run(); } catch (e) { r = { threw: String(e && e.message || e).slice(0, 300) }; }
  const files = (r.files || []).map((f) => f.path + '\0' + sha(typeof f.data === 'string' ? f.data : Buffer.from(f.data || []))).join('\n');
  const rest = Object.assign({}, r); delete rest.files; delete rest.zip;
  const t = files + '\n' + JSON.stringify(rest);
  now['C1 ' + name] = pin(t); texts['C1 ' + name] = t;
  (r.files || []).filter((f) => /visual\.json$|reportExtensions\.json$/.test(f.path)).forEach((f) => { allText += f.data; });
  (r.files || []).filter((f) => /visual\.json$/.test(f.path)).forEach((f) => { try { vis.push(JSON.parse(f.data)); } catch (e) { /* (a file that is not JSON is pinned above) */ } });
}

// ---------- A: create_report's answer for every build state ----------
for (const [name, change] of VARIANTS) {
  const s = fullState(); change(s);
  let t; try { t = JSON.stringify(reportAnswer(s)); } catch (e) { t = 'threw: ' + String(e && e.message || e); }
  // (the answer's "open" is path.join of the project folder: written with / as on the base, on Windows too)
  if (path.sep !== '/') t = t.split(JSON.stringify('Project' + path.sep).slice(1, -1)).join('Project/');
  now['A1 ' + name] = pin(t); texts['A1 ' + name] = t;
}

// ---------- B: check_model_health through the server ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fn1h-')));
copyFixtures(ROOT);
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
const bim = (dir, folder, tables) => { fs.mkdirSync(path.join(ROOT, dir, folder), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, folder, 'model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { culture: 'en-US', tables } }, null, 2)); };
// a shop model: month and day names without a sort column, a name with a control character, measures with no format
// (more than maxItems), a percent without one, a number format without a separator
const shop = (extra) => [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Date', 'dateTime'), col('Month Name', 'string'), col('Day Name', 'string'), col('Mon\tth Label', 'string'), col('Amount', 'double'), col('Units', 'int64', { formatString: '0' }), col('Region', 'string')],
  measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )' }, { name: 'Margin %', expression: 'DIVIDE ( SUM ( Sales[Amount] ), 2 )' }, { name: 'Units Sold', expression: 'SUM ( Sales[Units] )', formatString: '0' }, { name: 'Ret\turns', expression: '1' }]
    .concat(Array.from({ length: 24 }, (_, i) => ({ name: 'Measure ' + (i + 1), expression: 'SUM ( Sales[Amount] ) * ' + (i + 1) })), extra || []) }];
bim('shop', 'Shop.SemanticModel', shop());
bim('dataset', 'Shop.Dataset', shop());
// only a month column whose name holds a control character: its sort is a step by hand, with no script
bim('handonly', 'Hand.SemanticModel', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Month\tName', 'string'), col('Amount', 'double')], measures: [{ name: 'Total', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
// a big measure set: the format scripts cut under 30,000 characters
bim('big', 'Big.SemanticModel', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double')],
  measures: Array.from({ length: 200 }, (_, i) => ({ name: 'A rather long measure name for the script number ' + (i + 1), expression: 'SUM ( Sales[Amount] ) * ' + (i + 1) + ' + ' + 'CALCULATE ( SUM ( Sales[Amount] ) ) '.repeat(4) })) }]);
// the write: the same shop model and the questions model, each with its project file (scripts go next to the project)
bim('shopw', 'Shop.SemanticModel', shop()); fs.writeFileSync(path.join(ROOT, 'shopw', 'Shop.pbip'), JSON.stringify({ version: '1.0', artifacts: [] }));
fs.mkdirSync(path.join(ROOT, 'quest', 'Q.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'quest', 'Q.SemanticModel', 'model.bim'), JSON.stringify(questionsModel(), null, 2));
fs.writeFileSync(path.join(ROOT, 'quest', 'Q.pbip'), JSON.stringify({ version: '1.0', artifacts: [] }));
// edges: a month name whose number column holds a control character, a percent with a number format, three more
// names with a control character; a model with nothing to fix; questions and no script (the answers file alone)
bim('edges', 'Edge.SemanticModel', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Date', 'dateTime'), col('Month Name', 'string'), col('Month Number\t', 'int64'), col('Amount', 'double', { formatString: '#,0' }), col('Re\tgion', 'string'), col('Ci\nty', 'string')],
  measures: [{ name: 'Margin %', expression: 'DIVIDE ( SUM ( Sales[Amount] ), 2 )', formatString: '#,0' }, { name: 'Total', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Ret\turns', expression: '1', formatString: '#,0' }, { name: 'Lo\nss', expression: '1', formatString: '#,0' }] }]);
bim('clean', 'Clean.SemanticModel', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double', { formatString: '#,0' })], measures: [{ name: 'Total', expression: 'SUM ( Sales[Amount] )', formatString: '#,0', displayFolder: 'Main', description: 'The total.' }] }]);
const qonly = () => [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Customer Key', 'int64'), col('Cases', 'int64', { formatString: '#,0' }), col('Category', 'string')], measures: [{ name: 'Units Doubled', expression: 'SUM(Sales[Cases]) + SUM(Sales[Cases])', formatString: '#,0' }] },
  { name: 'Customer', partitions: mp('Customer'), columns: [col('Billing Customer Key', 'int64', { isKey: true }), col('Name', 'string')] }];
for (const d of ['qonly', 'qbad', 'qfail']) { bim(d, 'Q.SemanticModel', qonly()); fs.writeFileSync(path.join(ROOT, d, 'Q.pbip'), JSON.stringify({ version: '1.0', artifacts: [] })); }
fs.writeFileSync(path.join(ROOT, 'qbad', 'Q.dataarcus-answers.json'), 'not an answers file');
// a bad answers file beside a model with no question
bim('cleanbad', 'Clean.SemanticModel', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double', { formatString: '#,0' })], measures: [{ name: 'Total', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
fs.writeFileSync(path.join(ROOT, 'cleanbad', 'Clean.pbip'), JSON.stringify({ version: '1.0', artifacts: [] })); fs.writeFileSync(path.join(ROOT, 'cleanbad', 'Clean.dataarcus-answers.json'), '{ "broken": ');
// the model changed after the go: a script the plan did not name
bim('chg', 'C.SemanticModel', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Date', 'dateTime'), col('Month Name', 'string'), col('Amount', 'double', { formatString: '#,0' })], measures: [{ name: 'Total', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
fs.writeFileSync(path.join(ROOT, 'chg', 'C.pbip'), JSON.stringify({ version: '1.0', artifacts: [] }));
const norm = (t, root) => [root, JSON.stringify(root).slice(1, -1), root.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t)).replace(/plan-[0-9a-f]{12}/g, 'plan-<id>').split('\\\\').join('/');
const CALLS = [
  ['health', { path: 'health' }], ['health maxItems 1', { path: 'health', maxItems: 1 }], ['health only', { path: 'health', only: ['NO_FORMAT', 'pleaseConfirm', 'gulfCalendar', 'NOT_A_PART'] }],
  ['health an unknown answer', { path: 'health', answers: [{ answerKey: 'nope', answer: 'intended' }] }], ['health forget', { path: 'health', forgetAnswers: true }],
  ['health an unknown plan', { path: 'health', planId: 'plan-000000000000' }], ['health Gulf', { path: 'health', country: 'ksa', asOf: '2026-03-01' }],
  ['health Sharjah', { path: 'health', weekend: 'shj', asOf: '2026-03-01' }], ['tmdl', { path: 'tmdl/H.SemanticModel' }], ['tmdl typed', { path: 'tmdl/H.SemanticModel', columnTypes: { 'Sales Agg[Amount]': 'double', 'Nope[X]': 'text' } }],
  ['broken', { path: 'broken/B.SemanticModel' }], ['broken with a plan', { path: 'broken/B.SemanticModel', planId: 'plan-000000000000' }], ['ramadan', { path: 'ramadan/R.SemanticModel', country: 'uae', asOf: '2026-03-01' }],
  ['shop', { path: 'shop' }], ['shop maxItems 2, Monday', { path: 'shop', maxItems: 2, weekStart: 'monday' }], ['shop maxItems 200, Saturday', { path: 'shop', maxItems: 200, weekStart: 'saturday' }],
  ['shop only', { path: 'shop', only: ['MONTH_SORT', 'THOUSANDS', 'FORMATS', 'PCT_FORMAT'] }], ['edges', { path: 'edges' }], ['clean', { path: 'clean' }],
  ['ramadan, no country', { path: 'ramadan/R.SemanticModel', asOf: '2026-03-01' }], ['a bad answers file', { path: 'qbad' }], ['a bad answers file, no question', { path: 'cleanbad' }], ['dataset', { path: 'dataset' }], ['hand only', { path: 'handonly' }], ['big', { path: 'big', maxItems: 200 }],
];
const s = await serverClient(ROOT);
try {
  const tools = await s.c.listTools(), entry = (tools.tools || []).find((x) => x.name === 'check_model_health');
  const t = JSON.stringify(entry || null); now['B1 the tool list entry'] = pin(t); texts['B1 the tool list entry'] = t;
  for (const [name, args] of CALLS) { const r = await s.call('check_model_health', args); const tx = String(r.err) + '\n' + norm(r.t, ROOT); now['B2 ' + name] = pin(tx); texts['B2 ' + name] = tx; }
  // the write path: the plan, the user's go (approve_plan), then the scripts; the answers file the same way; each answer
  // and the files written (their names and sha256) pinned
  const tree = (dir) => { const out = []; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else out.push(path.relative(ROOT, f).split(path.sep).join('/') + ' ' + sha(fs.readFileSync(f).toString('utf8').replace(/"at": ?"[^"]*"/g, '"at":"<at>"'))); }); walk(path.join(ROOT, dir)); return out.sort().join('\n'); };
  const step = async (name, args, dir) => { const r = await s.call('check_model_health', args); const tx = String(r.err) + '\n' + norm(r.t, ROOT).replace(/"at": ?"[^"]*"/g, '"at":"<at>"') + '\n' + tree(dir); now['B2 ' + name] = pin(tx); texts['B2 ' + name] = tx; return r; };
  const go = async (r) => { const id = r.j && r.j.plan && r.j.plan.planId; if (id) await s.call('approve_plan', { planId: id }); return id; };
  const w0 = await step('shop write: the plan', { path: 'shopw' }, 'shopw');
  await step('shop write: the scripts', { path: 'shopw', planId: await go(w0) }, 'shopw');
  await step('shop write: again, the names taken', { path: 'shopw' }, 'shopw');
  const q0 = await step('questions: asked', { path: 'quest' }, 'quest');
  const keys = ((q0.j && q0.j.pleaseConfirm && q0.j.pleaseConfirm.items) || []).map((x) => x.answerKey);
  const answers = keys.slice(0, 2).map((k, i) => ({ answerKey: k, answer: i ? 'mistake' : 'intended' })).concat([{ answerKey: 'nope', answer: 'intended' }]);
  const q1 = await step('questions: answered, the plan', { path: 'quest', answers }, 'quest');
  await step('questions: answered, written', { path: 'quest', answers, planId: await go(q1) }, 'quest');
  await step('questions: shown answered', { path: 'quest' }, 'quest');
  const q3 = await step('questions: forget, the plan', { path: 'quest', forgetAnswers: true }, 'quest');
  await step('questions: forgotten', { path: 'quest', forgetAnswers: true, planId: await go(q3) }, 'quest');
  await step('questions: maxItems 1', { path: 'quest', maxItems: 1 }, 'quest');
  // the answers file alone (no script): answered, written; then answered again while forgetting; then the measure
  // changed, so the answer recorded before is forgotten
  const k0 = async (dir) => { const r = await s.call('check_model_health', { path: dir }); return ((r.j && r.j.pleaseConfirm && r.j.pleaseConfirm.items) || []).map((x) => ({ answerKey: x.answerKey, answer: 'intended' })); };
  const a1 = await k0('qonly'), o1 = await step('answers only: the plan', { path: 'qonly', answers: a1 }, 'qonly');
  await step('answers only: written', { path: 'qonly', answers: a1, planId: await go(o1) }, 'qonly');
  const o2 = await step('answers only: forget and answer, the plan', { path: 'qonly', answers: a1, forgetAnswers: true }, 'qonly');
  await step('answers only: forget and answer, written', { path: 'qonly', answers: a1, forgetAnswers: true, planId: await go(o2) }, 'qonly');
  const qm = qonly(); qm[0].measures[0].expression = 'SUM(Sales[Cases]) + SUM(Sales[Cases]) + 0'; bim('qonly', 'Q.SemanticModel', qm);
  await step('answers only: the measure changed', { path: 'qonly' }, 'qonly');
  const a3 = await k0('qonly'), o3 = await step('answers only: answered again, the plan', { path: 'qonly', answers: a3 }, 'qonly');
  await step('answers only: answered again, written', { path: 'qonly', answers: a3, planId: await go(o3) }, 'qonly');
  // the answers file cannot be written (a folder took its name after the go)
  const a2 = await k0('qfail'), f1 = await step('answers fail: the plan', { path: 'qfail', answers: a2 }, 'qfail'), fid = await go(f1);
  fs.mkdirSync(path.join(ROOT, 'qfail', 'Q.dataarcus-answers.json', 'x'), { recursive: true });
  await step('answers fail: not written', { path: 'qfail', answers: a2, planId: fid }, 'qfail');
  // the model changed after the go: the plan does not name the new script, nothing is written
  const c1 = await step('changed: the plan', { path: 'chg' }, 'chg'), cid = await go(c1);
  bim('chg', 'C.SemanticModel', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Date', 'dateTime'), col('Month Name', 'string'), col('Amount', 'double', { formatString: '#,0' })], measures: [{ name: 'Total', expression: 'SUM ( Sales[Amount] )' }] }]);
  await step('changed: refused', { path: 'chg', planId: cid }, 'chg');
} finally { await s.close(); }
// the working folder is the model folder itself: no place for a script (said, never written inside the model)
const inner = path.join(ROOT, 'shop', 'Shop.SemanticModel'), s2 = await serverClient(inner);
try { for (const [name, args] of [['the model folder as the working folder', { path: '.' }], ['the model folder as the working folder, forget', { path: '.', forgetAnswers: true }]]) {
  const r = await s2.call('check_model_health', args); const tx = String(r.err) + '\n' + norm(r.t, inner); now['B2 ' + name] = pin(tx); texts['B2 ' + name] = tx; } }
finally { await s2.close(); }

if (process.env.FN1H_DUMP) fs.writeFileSync(process.env.FN1H_DUMP, JSON.stringify(texts, null, 1));
if (process.env.FN1H_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-fn1h.mjs: create_report\'s answers, check_model_health\'s tool list entry and answers, and the writer\'s files, recorded on the base (integration/0.3.2 2fc104ce) as sha256 and length', records: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).records;
const part = (p, label) => { const keys = Object.keys(now).filter((k) => k.startsWith(p + ' '));
  const off = keys.filter((k) => JSON.stringify(now[k]) !== JSON.stringify(gold[k] || null)), lost = Object.keys(gold).filter((k) => k.startsWith(p + ' ') && !(k in now));
  chk(() => keys.length > 0 && !off.length && !lost.length, () => `${p}. ${label}: byte for byte as on 2fc104ce, ${keys.length - off.length} of ${keys.length} the same; differ: ${off.slice(0, 6).join('; ')}${lost.length ? '; not made: ' + lost.slice(0, 3).join('; ') : ''}`); };
part('A1', 'create_report\'s answer for 141 build states');
part('B1', 'check_model_health in the tool list (name, title, description, input schema, annotations)');
part('B2', 'check_model_health\'s answers and refusals on the calls');
part('C1', 'the writer\'s files and results for 300 seeded reports');

// C2: the builds reach the visual's parts (read from the written visuals)
const vco = (v) => (v.visual && v.visual.visualContainerObjects) || {};
const REACH = {
  'a logo image': vis.some((v) => v.visual && v.visual.visualType === 'image'),
  'a Top N title in English': allText.includes('Top '), 'a Top N title in Arabic': allText.includes('أعلى '), 'the detail word in Arabic': allText.includes('التفاصيل'),
  'a subtitle': vis.some((v) => vco(v).subTitle), 'a wrapped title': vis.some((v) => ((vco(v).title || [{}])[0].properties || {}).titleWrap),
  'a "No data" card': vis.some((v) => JSON.stringify((v.visual || {}).query || {}).includes('No data')),
  'a KPI title in bold': vis.some((v) => v.visual && v.visual.visualType === 'cardVisual' && ((vco(v).title || [{}])[0].properties || {}).bold),
};
const missing = Object.keys(REACH).filter((k) => !REACH[k]);
chk(() => !missing.length, () => `C2. the builds reach the visual's parts: missing ${JSON.stringify(missing)}`);

if (problems.length) { console.log('FAIL script=test-0.3.2-fn1h.mjs cause=' + JSON.stringify(problems[0]).slice(0, 300)); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  fn1h  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  fn1h  ${checks} checks`);
