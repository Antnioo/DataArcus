import './test-env.mjs';
// 0.3.2 SP27 (the split, finish: B-280, B-286; mcp/work/SP27.md). A characterisation suite for the Model Health Check's
// rules and its "Please confirm" questions: analyze()'s whole output for 15 made-up inputs, the rule catalogue with the
// score, and check_model_health's answers are the ones recorded on the base (integration/0.3.2 39c46bb, before the
// rules moved from assets/js/model-health-engine.js to assets/js/health-rules.js and the questions to
// assets/js/health-confirm.js). Recorded in fixtures/sp27-health.json; SP27_RECORD=1 records them again (only on the
// base, never to make a run pass). Made-up models only (fixtures/health-models.mjs).
//   S1-S15  analyze() on sp9's 11 cases, sp15's B1-B3 and E1 the edge cases (every rule no other case raises, every
//           question, the guards' models, the unused-field claims with a report): findings, score, skipped, questions
//   K1      the rule catalogue (RULES with its sources) and scoreFrom with and without ignored rules
//   Q1      check_model_health's answers (the health project; the incomplete TMDL model keeps its warning)
//   C1      the cases raise every rule, ask every question, skip a check, keep the incomplete model's warning
//   after the rules move: H1 health-rules.js holds the catalogue and the rules (no score), the engine requires it and
//   exports the same RULES;  H2 runRules is pure (its input unchanged, twice the same, findings without score fields);
//   H3 the load order (the worker, both tool pages)
//   after the questions move: F1 health-confirm.js holds pleaseConfirm (no score, no require);  F2 pure (a frozen
//   model, twice the same, no score fields);  F3 the load order
//   node test-0.3.2-sp27.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import * as F from './fixtures/health-models.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), JS = path.join(REPO, 'assets/js');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp27-health.json');
const SRC = (f) => fs.readFileSync(path.join(REPO, f), 'utf8');
const Health = require('../assets/js/model-health-engine.js');
const RULES_AFTER = fs.existsSync(path.join(JS, 'health-rules.js')), CONFIRM_AFTER = fs.existsSync(path.join(JS, 'health-confirm.js'));

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp27-')));
process.env.DATAARCUS_ROOT = ROOT;
const { loadModel, unreadableOf } = await import(new URL('./lib/model.mjs', import.meta.url).href);
F.copyFixtures(ROOT);
const viaLoader = (p) => { const m = loadModel(p, { root: ROOT }); return { model: m.tmsl, report: m.report, extra: unreadableOf(m) }; };

// ---------- the 15 inputs ----------
const one = (model, report) => [{ model, report }];
const CASES = F.CASES(viaLoader).map(([name, make]) => [name, () => [make()]]).concat([
  ['B1 calculation groups with a PBIR report', () => one(F.calcGroups(), F.calcGroupsReport())],
  ['B2 measures using another table\'s measures, with a PBIR report', () => one(F.crossTable(), F.crossTableReport())],
  ['B3 the incomplete TMDL model (a table file that is not TMDL)', () => [viaLoader('garbled/G.SemanticModel')]],
  ['E1 the edge cases: every rule, every question, the guards\' models, the unused-field claims', () => [
    { model: F.rulesModel(), report: F.rulesReport() }, { model: F.rulesModel(), report: null }, { model: F.questionsModel(), report: null },
    ...F.guardModels(), { model: F.unusedModel(), report: F.unusedReport() }, { model: F.unusedModel(), report: null }, { model: null, report: null }, { model: {}, report: {} }]]]);

const now = {}, texts = {}, outs = {};
CASES.forEach(([name, make], i) => {
  let t;
  try {
    const r = make().map((c) => ({ result: Health.analyze(c.model, c.report), extra: c.extra || null }));
    outs[i] = r; t = JSON.stringify(r);
  } catch (e) { t = 'threw: ' + String(e && e.stack || e); }
  const key = 'S' + (i + 1) + ' ' + name.replace(/^\w+ /, '');
  texts[key] = t; now[key] = { length: t.length, sha256: sha(t) };
});

// K1: the catalogue (every rule, its texts and its source) and the score from the findings of S1 and E1
{
  const fs1 = (outs[0] || [])[0].result.findings, fe = (outs[14] || [])[0].result.findings;
  const t = JSON.stringify({ rules: Health.RULES, bpa: Health.BPA_URL, score: [fs1, fe].map((f) => [Health.scoreFrom(f), Health.scoreFrom(f, new Set(f.slice(0, 3).map((x) => x.id))), Health.scoreFrom(f, new Set())]), empty: Health.scoreFrom() });
  texts.K1 = t; now.K1 = { length: t.length, sha256: sha(t) };
}

// Q1: check_model_health's answers (the health project and the incomplete model: its warning first)
const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t)).replace(/plan-[0-9a-f]{12}/g, 'plan-<id>').split('\\\\').join('/');
const s = await serverClient(ROOT);
let q = '';
try { for (const p of ['health', 'broken/B.SemanticModel']) { const r = await s.call('check_model_health', { path: p }); q += r.err + '\n' + norm(r.t) + '\n'; } } finally { await s.close(); }
now.Q1 = { length: q.length, sha256: sha(q) }; texts.Q1 = q;

if (process.env.SP27_DUMP) fs.writeFileSync(process.env.SP27_DUMP, JSON.stringify(texts, null, 1));
if (process.env.SP27_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp27.mjs: analyze() for 15 made-up inputs, the rule catalogue and the score, and check_model_health\'s answers, recorded on the base (normalised: the working folder, the plan id and the path separator)', records: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).records;
for (const k of Object.keys(now)) chk(() => gold[k] && JSON.stringify(now[k]) === JSON.stringify(gold[k]),
  () => `${k.split(' ')[0]}. ${k.replace(/^\w+ /, '')}: the output is the base's: now ${JSON.stringify(now[k])}, recorded ${JSON.stringify(gold[k] || null)} (SP27_DUMP=<file> writes them)`);

// C1: the cases cover every rule and every question
const all = Object.values(outs).flat().map((x) => x.result);
const raised = new Set(all.flatMap((r) => r.findings.map((f) => f.id))), asked = new Set(all.flatMap((r) => r.confirm.map((c) => c.id + (c.table ? ':' + c.table.looksLike : ''))));
const QUESTIONS = ['totalFilter', 'duplicateAggregate', 'wrongColumn', 'shiftedCurrentDate', 'ratioAsPercent', 'percentTwice', 'thousandsPlain', 'wrongRelationshipKey', 'unrelatedTable:date', 'unrelatedTable:fact'];
const COVER = {
  'every case read': Object.values(texts).every((t) => !t.startsWith('threw')),
  'every rule raised': Object.keys(Health.RULES).every((id) => raised.has(id)),
  'every question asked': QUESTIONS.every((id) => asked.has(id)),
  'a check skipped for an unknown type': all.some((r) => r.skipped.length),
  'the incomplete model keeps its warning': /"unreadable":\{"message":"[^"]*Notes\.tmdl/.test(texts[Object.keys(texts).find((k) => k.startsWith('S11 '))]) && /Notes\.tmdl/.test(q),
  'unused fields claimed with a report only': (outs[14] || [])[6].result.findings.some((f) => f.id === 'UNUSED_COL') && !(outs[14] || [])[7].result.findings.some((f) => /^UNUSED_/.test(f.id))
};
chk(() => Object.values(COVER).every(Boolean), () => `C1. the cases cover the rules and the questions: missing ${JSON.stringify(Object.keys(COVER).filter((k) => !COVER[k]))} (rules not raised: ${Object.keys(Health.RULES).filter((id) => !raised.has(id)).join(' ')})`);

// ---------- after the moves: the modules' boundaries ----------
// the engine run in a sandbox whose require hands it the real modules with their one entry point watched
const plain = (k, v) => (v instanceof Set ? { Set: Array.from(v) } : v instanceof Map ? { Map: Array.from(v) } : typeof v === 'function' ? 'fn' : v);
const freeze = (o, seen = new Set()) => { if (o && typeof o === 'object' && !seen.has(o)) { seen.add(o); Object.values(o).forEach((x) => freeze(x, seen)); Object.freeze(o); } return o; };
const SCORE_KEYS = ['penalty', 'share', 'cat', 'sev', 'score', 'overall'];
const watched = { rules: [], confirm: [] };
const sandboxed = () => {
  const m = { exports: {} };
  const req = (dep) => {
    const real = require(path.join(JS, path.basename(dep)));
    if (/health-rules\.js$/.test(dep)) return Object.assign({}, real, { runRules: (input) => { const before = JSON.stringify(input, plain), out = real.runRules(input); watched.rules.push({ before, input, out: JSON.stringify(out, plain) }); return out; } });
    if (/health-confirm\.js$/.test(dep)) return Object.assign({}, real, { pleaseConfirm: (M, ctx) => { const out = real.pleaseConfirm(M, ctx); watched.confirm.push({ M, ctx, out: JSON.stringify(out) }); return out; } });
    return real;
  };
  new Function('module', 'exports', 'self', 'require', SRC('assets/js/model-health-engine.js'))(m, m.exports, undefined, req);
  return m.exports;
};
const order = (s, names) => { const at = names.map((n) => s.indexOf(n + '.min.js?v=')); return at.every((a, i) => a >= 0 && (!i || at[i - 1] < a)) && names.every((n) => s.split(n + '.min.js?v=').length === 2); };
const worker = SRC('assets/js/model-health-worker.js'), imp = (worker.match(/importScripts\(([^)]*)\)/) || [])[1] || '';
const pages = ['tools/power-bi-model-health-check.html', 'ar/tools/power-bi-model-health-check.html'].map(SRC);
const esrc = SRC('assets/js/model-health-engine.js');
const requiresOf = (s) => Array.from(s.matchAll(/require\('([^']+)'\)/g), (x) => x[1]);
let E2 = null, sameOut = true;
if (RULES_AFTER || CONFIRM_AFTER) {
  E2 = sandboxed();
  CASES.forEach(([, make], i) => make().forEach((c, j) => { if (JSON.stringify(E2.analyze(c.model, c.report)) !== JSON.stringify(outs[i][j].result)) sameOut = false; }));
}

if (RULES_AFTER) {
  const R = require('../assets/js/health-rules.js'), rsrc = SRC('assets/js/health-rules.js');
  chk(() => typeof R.runRules === 'function' && R.RULES === Health.RULES && R.BPA_URL === Health.BPA_URL && Object.keys(R.RULES).length === 37
    && JSON.stringify(requiresOf(rsrc)) === JSON.stringify(['./dax-reference-parser.js', './model-index.js'])
    && !/penalty|scoreFrom|\bSCOPE\b|\bCAP\b|\bSEV\b|pleaseConfirm|function analyze/.test(rsrc) && /Input:/.test(rsrc) && /Output:/.test(rsrc)
    && !/\bconst RULES = |\bconst SOURCES = |function runRules/.test(esrc) && requiresOf(esrc).includes('./health-rules.js'),
  () => 'H1 health-rules.js holds the catalogue and the rules (no score; it requires the parser and the index only; its interface written at its top); the engine requires it and exports the same RULES and BPA_URL');
  chk(() => sameOut && watched.rules.length >= CASES.length && watched.rules.every((w) => {
    const again = JSON.stringify(R.runRules(w.input), plain), out = JSON.parse(w.out);
    return again === w.out && JSON.stringify(w.input, plain) === w.before && Object.keys(out).join() === 'findings,skipped'
      && out.findings.every((f) => Object.keys(f).join() === 'id,items' && f.items.every((it) => !SCORE_KEYS.some((k) => k in it)));
  }) && !/\bIX\.\w+\.(set|delete|clear)\(|\bIX\.\w+\s*=[^=]|\bIX\[/.test(rsrc),
  () => `H2 runRules is pure: the engine's output unchanged through it (${sameOut}), its input unchanged, twice the same, { findings, skipped } out with no score fields (${watched.rules.length} calls)`);
  chk(() => order(imp, ['dax-reference-parser', 'model-index', 'health-rules', 'model-health-engine']) && pages.every((h) => order(h, ['dax-reference-parser', 'model-index', 'health-rules', 'model-health-engine'])),
    () => `H3 the worker and both tool pages load dax-reference-parser, model-index, health-rules (once), then model-health-engine: worker ${imp}`);
}

if (CONFIRM_AFTER) {
  const C = require('../assets/js/health-confirm.js'), csrc = SRC('assets/js/health-confirm.js');
  chk(() => typeof C.pleaseConfirm === 'function' && !requiresOf(csrc).length && !/penalty|scoreFrom|\bRULES\b|runRules|function analyze/.test(csrc) && /Input:/.test(csrc) && /Output:/.test(csrc)
    && !/function pleaseConfirm|\bconst CF = /.test(esrc) && requiresOf(esrc).includes('./health-confirm.js'),
  () => 'F1 health-confirm.js holds pleaseConfirm (no score, no require; its interface written at its top); the engine requires it');
  chk(() => sameOut && watched.confirm.length >= CASES.length && watched.confirm.every((w) => {
    const again = JSON.stringify(C.pleaseConfirm(freeze(w.M), freeze(w.ctx)));
    return again === w.out && JSON.parse(w.out).every((x) => !SCORE_KEYS.some((k) => k in x) && typeof x.evidence === 'string' && x.message && x.message.en && x.message.ar);
  }),
  () => `F2 pleaseConfirm is pure: the engine's output unchanged through it (${sameOut}), a frozen model gives the same questions, each with its evidence and no score fields (${watched.confirm.length} calls)`);
  chk(() => order(imp, ['model-index', 'health-rules', 'health-confirm', 'model-health-engine']) && pages.every((h) => order(h, ['model-index', 'health-rules', 'health-confirm', 'model-health-engine'])),
    () => `F3 the worker and both tool pages load model-index, health-rules, health-confirm (once), then model-health-engine: worker ${imp}`);
}

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp27.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp27  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp27  ${checks} checks`);
