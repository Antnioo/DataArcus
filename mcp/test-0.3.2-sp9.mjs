import './test-env.mjs';
// 0.3.2 SP9 (the split: B-280, B-286; mcp/work/SP9.md). A characterisation suite for the Model Health Check's DAX tokens
// and report references: analyze()'s whole output for 11 made-up models, the tokens and report references of 14 inputs
// and check_model_health's answer are the ones recorded on the base (integration/0.3.2 a57e094, before the tokenizer and
// the report reading moved from assets/js/model-health-engine.js to assets/js/dax-reference-parser.js). Recorded in
// fixtures/sp9-health.json; SP9_RECORD=1 records them again (only on the base, never to make a run pass). Made-up models
// only: the health, twin and TMDL fixtures and five models written here.
//   A1-A11  analyze() on each model: findings, unused fields, score, skipped checks, questions, tables, measures
//   T1      tokenizeDax, collectReportRefs and analyzeReport on 14 inputs
//   Q1      check_model_health's answer (the health project; the incomplete TMDL model keeps its warning)
//   C1      the cases cover comments, strings with brackets, quoted names, VARs, an Arabic table, the incomplete model
//   after the move: P1 the parser holds no model state and the engine's functions are the parser's;  P2 the load order
//   (the worker, both tool pages)
//   node test-0.3.2-sp9.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { copyFixtures, CASES as SP9_CASES, TRICKY, pbir, legacy } from './fixtures/health-models.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp9-health.json');
const Health = require('../assets/js/model-health-engine.js');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp9-')));
process.env.DATAARCUS_ROOT = ROOT;
const { loadModel, unreadableOf } = await import(new URL('./lib/model.mjs', import.meta.url).href);
copyFixtures(ROOT);
const viaLoader = (p) => { const m = loadModel(p, { root: ROOT }); return { model: m.tmsl, report: m.report, extra: unreadableOf(m) }; };
const CASES = SP9_CASES(viaLoader);
const outOf = ([, make]) => { const c = make(); return JSON.stringify({ result: Health.analyze(c.model, c.report), extra: c.extra || null }); };
const now = {}, texts = {};
for (const c of CASES) { let t; try { t = outOf(c); } catch (e) { t = 'threw: ' + String(e && e.stack || e); } texts[c[0]] = t; now[c[0]] = { length: t.length, sha256: sha(t) }; }

// T1: the tokens and the report references of hard inputs
const T_INPUTS = TRICKY.map((m) => m.expression).concat(["'المبيعات'[المبلغ] + [x]]y] - 1.5e3 // end"]);
const tokens = JSON.stringify({ tokens: T_INPUTS.map((s) => Health.tokenizeDax(s)),
  refs: [pbir(), legacy()].map((r) => { const acc = []; Health.collectReportRefs(r.files.map((f) => f.json), acc, {}); return acc; }),
  reports: [pbir(), legacy(), { format: 'pbir', files: [] }, { format: 'pbir', files: [{ path: 'definition/report.json', json: {} }] }].map((r) => Health.analyzeReport(r)) });
now.T1 = { length: tokens.length, sha256: sha(tokens) }; texts.T1 = tokens;

// Q1: check_model_health through the server (the answer the MCP gives; the incomplete model's warning first)
const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t)).replace(/plan-[0-9a-f]{12}/g, 'plan-<id>').split('\\\\').join('/');
const s = await serverClient(ROOT);
let q = '';
try {
  for (const p of ['health', 'broken/B.SemanticModel']) { const r = await s.call('check_model_health', { path: p }); q += p + '\n' + r.err + '\n' + norm(r.t) + '\n'; }
} finally { await s.close(); }
now.Q1 = { length: q.length, sha256: sha(q) }; texts.Q1 = q;

if (process.env.SP9_DUMP) fs.writeFileSync(process.env.SP9_DUMP, JSON.stringify(texts, null, 1));
if (process.env.SP9_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp9.mjs: analyze()\'s output, the tokens and report references, and check_model_health\'s answer, recorded on the base (normalised: the working folder, the plan id and the path separator)', records: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).records;
for (const k of Object.keys(now)) chk(() => gold[k] && JSON.stringify(now[k]) === JSON.stringify(gold[k]),
  () => `${k.split(' ')[0]}. ${k.replace(/^\w+ /, '')}: the output is the base's: now ${JSON.stringify(now[k])}, recorded ${JSON.stringify(gold[k] || null)} (SP9_DUMP=<file> writes them)`);

// C1: the cases cover what the parser reads
const A = (k) => texts[CASES.find((c) => c[0].startsWith(k + ' '))[0]];
const COVER = {
  'every case analysed': CASES.every((c) => !texts[c[0]].startsWith('threw')),
  'comments of three kinds': TRICKY.some((m) => m.expression.includes('//')) && TRICKY.some((m) => m.expression.includes('--')) && TRICKY.some((m) => m.expression.includes('/*')),
  'strings holding brackets': TRICKY.some((m) => /"[^"]*\[[^"]*"/.test(m.expression)),
  'quoted names with spaces and apostrophes': /Bob''s Sales/.test(JSON.stringify(TRICKY)) && /Sales Region Map/.test(JSON.stringify(TRICKY)),
  'VARs': TRICKY.some((m) => /\bVAR\b/.test(m.expression)),
  'an Arabic table found unused or used': /المبيعات/.test(A('A9')) && /"UNUSED_MEASURE","items":\[\{"obj":"\[نص\]"/.test(A('A9')),
  'unused fields found with a report': /"UNUSED_COL"/.test(A('A8')) && /"UNUSED_MEASURE"/.test(A('A8')),
  'questions asked': /"confirm":\[\{/.test(A('A1') + A('A7') + A('A8') + A('A9')),
  'the incomplete model keeps its warning': /"unreadable":\{"message":"[^"]*Notes\.tmdl/.test(A('A11')) && /Notes\.tmdl/.test(q)
};
chk(() => Object.values(COVER).every(Boolean), () => `C1. the cases cover the parser's paths: missing ${JSON.stringify(Object.keys(COVER).filter((k) => !COVER[k]))}`);

// ---------- after the move (SP9): the parser is pure, the engine calls it; every loader loads it first ----------
if (fs.existsSync(path.join(REPO, 'assets/js/dax-reference-parser.js'))) {
  const SRC = (f) => fs.readFileSync(path.join(REPO, f), 'utf8');
  const P = require('../assets/js/dax-reference-parser.js'), psrc = SRC('assets/js/dax-reference-parser.js'), esrc = SRC('assets/js/model-health-engine.js');
  chk(() => ['tokenizeDax', 'daxCode', 'collectReportRefs', 'visualLabel', 'analyzeReport'].every((f) => typeof P[f] === 'function')
    && Health.tokenizeDax === P.tokenizeDax && Health.collectReportRefs === P.collectReportRefs && Health.analyzeReport === P.analyzeReport
    && !/function (tokenizeDax|daxCode|collectReportRefs|visualLabel|analyzeReport)\b/.test(esrc) && /require\('\.\/dax-reference-parser\.js'\)/.test(esrc)
    && !/\bIX\b|buildIndex|normalizeModel|\bRULES\b|require\(/.test(psrc),
  () => 'P1 dax-reference-parser.js holds the tokenizer and the report reading (no model state, no require); the engine requires it and exports the same functions');
  const worker = SRC('assets/js/model-health-worker.js'), imp = (worker.match(/importScripts\(([^)]*)\)/) || [])[1] || '';
  const order = (s, a, b) => s.indexOf(a) >= 0 && s.indexOf(a) < s.indexOf(b) && s.split(a).length === 2;
  const pages = ['tools/power-bi-model-health-check.html', 'ar/tools/power-bi-model-health-check.html'].map(SRC);
  chk(() => order(imp, 'dax-reference-parser.min.js?v=', 'model-health-engine.min.js?v=') && pages.every((h) => order(h, 'dax-reference-parser.min.js?v=', 'model-health-engine.min.js?v=')),
    () => `P2 the worker and both tool pages load dax-reference-parser.min.js once, before model-health-engine.min.js: worker ${imp}`);
}

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp9.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp9  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp9  ${checks} checks`);
