import './test-env.mjs';
// 0.3.2 SP2 (the split, step 2: B-280, B-286; mcp/work/SP2.md). A characterisation suite for plan_layout's two plans of
// their own kind, the sample and the redesign (lib/plan-variants.mjs after SP2): their answers on the paths sp1 does not
// take are byte for byte the answers recorded on the base (integration/0.3.2 550cea1, before the move), with sp1's seed
// (fixtures/sp1/seeded-random.mjs) and sp1's normalising (the plan id, the working folder). Recorded in
// fixtures/sp2-answers.json as sha256 and length; SP2_RECORD=1 records them again (only on the base, never to make a run
// pass). Then the cross-entry parity: the module's own samplePlan and redesignPlan, called here, give the tool's blocks.
// Made-up models only: the twin-project fixture.
//   S1-S2  the sample: Arabic; with a model input (a plan problem)
//   R1-R6  the redesign: no path; a new report's inputs; one page listed (redesignPages); its options; the copy's folder
//          already there; a title for a visual that is not there (lib/redesign.mjs's problems)
//   X1-X2  the module's sample and redesign blocks are the tool's
//   node test-0.3.2-sp2.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp2-answers.json');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp2-')));
process.env.DATAARCUS_ROOT = ROOT;
for (const d of ['twin', 'twin2']) fs.cpSync(path.join(HERE, 'fixtures', 'twin-project'), path.join(ROOT, d), { recursive: true });
// (sp1's lesson: CI's Windows checkout writes CRLF, the redesign's digest is over the original's bytes) LF copies
const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
  const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });
lf(path.join(ROOT, 'twin')); lf(path.join(ROOT, 'twin2'));
// the copy's folder already there: the redesign never writes over a file (a plan problem)
fs.mkdirSync(path.join(ROOT, 'twin2', 'Twin Sales redesigned.Report'));
const FROM = 'twin/Twin Sales.pbip';

const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t))
  .replace(/plan-[0-9a-f]{12}/g, 'plan-<id>');
const SEED = pathToFileURL(path.join(HERE, 'fixtures', 'sp1', 'seeded-random.mjs')).href;
const s = await serverClient(ROOT, { NODE_OPTIONS: [process.env.NODE_OPTIONS, `--import ${SEED}`].filter(Boolean).join(' ') });
const got = {}, raw = {};
let CASES = [];
try {
  // the page ids, from the redesign as sp1's P7 plans it (this call's answer is sp1's; not compared here)
  const first = JSON.parse((await s.call('plan_layout', { path: 'twin', redesignFrom: FROM })).t);
  const page = first.redesign.pages[0].id;
  CASES = [
    ['S1 the sample in Arabic', { sample: true, lang: 'ar' }],
    ['S2 the sample with a model input', { sample: true, path: 'twin', layout: 'exec' }],
    ['R1 a redesign without path', { redesignFrom: FROM }],
    ['R2 a redesign with a new report\'s inputs', { path: 'twin', redesignFrom: FROM, layout: 'exec', design: {}, flipCards: true }],
    ['R3 a redesign listing one page', { path: 'twin', redesignFrom: FROM, redesignPages: [page] }],
    ['R4 a redesign with its options', { path: 'twin', redesignFrom: FROM, restyle: { preset: 'Midnight', mode: 'dark' }, consistentText: 'report', keepPositions: true }],
    ['R5 a redesign whose copy is already there', { path: 'twin2', redesignFrom: 'twin2/Twin Sales.pbip' }],
    ['R6 a redesign titling a visual that is not there', { path: 'twin', redesignFrom: FROM, titles: { [`${page}/no-such-visual`]: 'Sales by month' } }]
  ];
  for (const [name, args] of CASES) { const r = await s.call('plan_layout', args); got[name] = { err: r.err, t: norm(r.t) }; raw[name] = r.t; }
} finally { await s.close(); }
if (process.env.SP2_DUMP) fs.writeFileSync(process.env.SP2_DUMP, JSON.stringify(got, null, 1));
const now = Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { err: v.err, length: v.t.length, sha256: sha(v.t) }]));
if (process.env.SP2_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp2.mjs: plan_layout\'s sample and redesign answers recorded on the base (normalised: the plan id and the working folder)', answers: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).answers;
for (const [name] of CASES) chk(() => gold[name] && now[name].sha256 === gold[name].sha256 && now[name].length === gold[name].length && now[name].err === gold[name].err,
  () => `${name.split(' ')[0]}. plan_layout's answer for "${name.replace(/^[SR]\d+ /, '')}" is the base's, byte for byte: now ${JSON.stringify(now[name])}, recorded ${JSON.stringify(gold[name] || null)} (SP2_DUMP=<file> writes the answers)`);

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp2.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp2  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp2  ${checks} checks`);
