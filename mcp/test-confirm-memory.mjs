// B-148 (0.3): the "Please confirm" answers are remembered while the metadata a question was based on is unchanged.
// Written red first. The shared module (assets/js/confirm-memory.js, the website's and the MCP's), then the MCP:
//   - an answer is reused while its evidence signature matches, and the question comes back when the DAX changes
//   - a record holds hashes and the answer only: never DAX text or data
//   - the answers file next to the model is written only with an approved plan that lists it; forget goes the same way
//   - the module makes no network call
//   node test-confirm-memory.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));

let CM = null;
try { CM = require('../assets/js/confirm-memory.js'); } catch (e) { CM = null; }
const Health = require('../assets/js/model-health-engine.js');

// a made-up model (no employer data): one measure that raises "the same aggregate added twice"
const DAX = 'SUM(Sales[Qty]) + SUM(Sales[Qty])', DAX2 = 'SUM(Sales[Qty]) + SUM(Sales[Qty]) + 0';
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bim = (expr, format) => ({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'),
  columns: [col('Qty', 'int64'), col('Amount', 'double')],
  measures: [{ name: 'Units Doubled', expression: expr, formatString: format === undefined ? '#,0' : format }, { name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }] } });

// ---------- the shared module ----------
chk(() => CM, () => 'U0. assets/js/confirm-memory.js exists and loads in Node');
if (CM) {
  const strs = ['', 'abc', 'المبيعات', 'x'.repeat(200), DAX];
  chk(() => strs.every((s) => CM.sha256(s) === crypto.createHash('sha256').update(s, 'utf8').digest('hex')), () => 'U1. sha256 equals node:crypto\'s for ASCII, Arabic, empty and long text');
  const r1 = Health.analyze(bim(DAX), null), raw1 = r1.rawTables, q1 = r1.confirm.find((c) => c.id === 'duplicateAggregate');
  const sig = (expr, format) => { const r = Health.analyze(bim(expr, format), null); return CM.signature(r.confirm.find((c) => c.id === 'duplicateAggregate'), r.rawTables); };
  chk(() => q1 && /^[0-9a-f]{64}$/.test(CM.signature(q1, raw1)) && CM.signature(q1, raw1) === sig(DAX), () => 'U2. the signature is a SHA-256 and the same for the same metadata');
  chk(() => sig(DAX) !== sig(DAX2), () => 'U3. the signature changes when the measure\'s DAX changes');
  chk(() => sig(DAX) !== sig(DAX, '0.00'), () => 'U4. the signature changes when the measure\'s format string changes');
  // a relationship question: its signature follows the candidate column's type
  const relModel = (candType) => ({ model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [col('CustomerKey', 'int64'), col('ProductKey', candType)] },
    { name: 'Product', partitions: mp('Product'), columns: [col('ProductKey', 'int64'), col('Color', 'string')] }],
  relationships: [{ name: 'p', fromTable: 'Sales', fromColumn: 'CustomerKey', toTable: 'Product', toColumn: 'ProductKey' }] } });
  const rr = Health.analyze(relModel('int64'), null), rq = rr.confirm.find((c) => c.id === 'wrongRelationshipKey');
  const raw2 = JSON.parse(JSON.stringify(rr.rawTables)); raw2[0].columns[1].description = 'x';   // a description is not evidence
  const raw3 = JSON.parse(JSON.stringify(rr.rawTables)); raw3[1].columns[0].dataType = 'string';   // the key's type is
  chk(() => rq && CM.signature(rq, rr.rawTables) === CM.signature(rq, raw2) && CM.signature(rq, rr.rawTables) !== CM.signature(rq, raw3), () => 'U5. a relationship question\'s signature follows its columns\' types, not their descriptions');
  // a record: hashes and the answer only
  const rec = CM.record(q1, 'intended', raw1, '2026-10-18T10:00:00.000Z');
  // (R5, 0.3.0: the question id and the object are hashed too; changed on purpose, test-0.3.0-answers-safety.mjs F10)
  chk(() => JSON.stringify(Object.keys(rec).sort()) === JSON.stringify(['answer', 'at', 'by', 'evidenceSignature', 'objectHash', 'questionHash']) && rec.by === 'user' && rec.questionHash === CM.sha256(JSON.stringify(['b148-question', 'duplicateAggregate'])) && rec.objectHash === CM.sha256(JSON.stringify(['b148-object', '[Units Doubled]'])) && rec.answer === 'intended' && rec.evidenceSignature === CM.signature(q1, raw1),
    () => `U6. the record's shape: ${JSON.stringify(rec)}`);
  chk(() => !JSON.stringify(rec).includes('SUM(') && !JSON.stringify(rec).includes('Qty'), () => `U7. a record holds no DAX: ${JSON.stringify(rec)}`);
  chk(() => { let bad = false; try { CM.record(q1, 'maybe', raw1); } catch (e) { bad = true; } return bad; }, () => 'U8. an answer other than intended or mistake is refused');
  // reused while the signature matches; the DAX changed: asked again, the old record dropped
  const a = CM.apply(r1.confirm, [rec], raw1);
  chk(() => a.answered.length === 1 && a.answered[0].record === rec && !a.ask.some((c) => c.id === 'duplicateAggregate') && a.keep.length === 1 && !a.stale.length, () => `U9. an answer is reused while the metadata is unchanged: ${JSON.stringify({ ask: a.ask.map((c) => c.id), answered: a.answered.length, stale: a.stale.length })}`);
  const r2 = Health.analyze(bim(DAX2), null), b = CM.apply(r2.confirm, [rec], r2.rawTables);
  chk(() => b.ask.some((c) => c.id === 'duplicateAggregate') && !b.answered.length && b.stale.length === 1 && !b.keep.length, () => `U10. the DAX changed: the question is asked again and the old answer dropped: ${JSON.stringify({ ask: b.ask.map((c) => c.id), answered: b.answered.length, stale: b.stale.length })}`);
  // the model fingerprint: table names only (the same model after a DAX change is the same model)
  chk(() => /^[0-9a-f]{64}$/.test(CM.fingerprint(raw1)) && CM.fingerprint(raw1) === CM.fingerprint(r2.rawTables) && CM.fingerprint(raw1) !== CM.fingerprint(rr.rawTables), () => 'U11. the model fingerprint: the same model after a DAX change, another model differs');
  // no network: the module names no network call
  const src = fs.readFileSync(path.join(REPO, 'assets/js/confirm-memory.js'), 'utf8').replace(/\/\/.*$/gm, '');
  chk(() => !/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource|importScripts|import\s*\()\b/.test(src), () => 'U12. confirm-memory.js makes no network call');
}

// ---------- the MCP: the answers file, through the gate ----------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-b148-'));
const proj = (dir, expr) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify(bim(expr))); };
proj('p', DAX);
const FILE = path.join(ROOT, 'p', 'M.dataarcus-answers.json'), target = 'p/M.SemanticModel';
const s = await serverClient(ROOT);
const health = (extra) => s.call('check_model_health', Object.assign({ path: target }, extra || {}));
{
  const h0 = await health();
  const item = h0.j && h0.j.pleaseConfirm && h0.j.pleaseConfirm.items.find((x) => x.id === 'duplicateAggregate');
  chk(() => item && /^[0-9a-f]{12,64}$/.test(item.answerKey) && !fs.existsSync(FILE), () => `S1. each question has an answerKey, and no answers file is there yet: ${short(h0)}`);
  const key = item ? item.answerKey : 'x';
  // answers without a plan id: nothing written; the plan names the file
  const h1 = await health({ answers: [{ answerKey: key, answer: 'intended' }] });
  chk(() => !h1.err && !fs.existsSync(FILE) && h1.j.plan && h1.j.plan.writesAfterGo.some((w) => w.includes('M.dataarcus-answers.json')), () => `S2. answers without planId: nothing written, the plan lists the answers file: ${short(h1)}`);
  const id = h1.j && h1.j.plan && h1.j.plan.planId;
  await s.call('approve_plan', { planId: id });
  // another answer than the approved one: refused, nothing written
  const bad = await health({ planId: id, answers: [{ answerKey: key, answer: 'mistake' }] });
  chk(() => bad.err && /Nothing was written/.test(bad.t) && !fs.existsSync(FILE), () => `S3. an answer that differs from the approved plan is refused, nothing written: ${short(bad)}`);
  const h2 = await health({ planId: id, answers: [{ answerKey: key, answer: 'intended' }] });
  let saved = null; try { saved = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { saved = null; }
  const recs = saved && saved.answers;
  chk(() => !h2.err && Array.isArray(recs) && recs.length === 1 && recs[0].questionHash === CM.sha256(JSON.stringify(['b148-question', 'duplicateAggregate'])) && recs[0].objectHash === CM.sha256(JSON.stringify(['b148-object', '[Units Doubled]'])) && recs[0].answer === 'intended' && recs[0].by === 'user' && /^[0-9a-f]{64}$/.test(recs[0].evidenceSignature),
    () => `S4. with the approved plan the answers file is written with the record: ${short(h2)} / ${JSON.stringify(saved)}`);
  chk(() => { const t = fs.readFileSync(FILE, 'utf8'); return !t.includes('SUM(') && !t.includes('Qty') && !t.includes('Sales'); }, () => 'S5. the answers file holds no DAX text and no table or column name beyond the question\'s object');
  // the next check: not asked again, listed as answered
  const h3 = await health();
  const pc = h3.j && h3.j.pleaseConfirm;
  chk(() => pc && !pc.items.some((x) => x.id === 'duplicateAggregate') && pc.answered && pc.answered.some((x) => x.id === 'duplicateAggregate' && x.object === '[Units Doubled]' && x.answer === 'intended'), () => `S6. the remembered answer: not asked again, listed as answered: ${short(h3)}`);
  // the plan used once: the same id writes nothing again
  const again = await health({ planId: id, answers: [{ answerKey: key, answer: 'intended' }] });
  chk(() => again.err && /already used/.test(again.t), () => `S7. the plan writes once: ${short(again)}`);
  // an unknown key: nothing planned for it, said
  const unk = await health({ answers: [{ answerKey: 'ffffffffffff', answer: 'intended' }] });
  chk(() => !unk.err && unk.j.pleaseConfirm.answersNotRecorded && unk.j.pleaseConfirm.answersNotRecorded[0].answerKey === 'ffffffffffff' && !(unk.j.plan && unk.j.plan.writesAfterGo.some((w) => w.includes('answers'))), () => `S8. an answerKey that is not asked now is not recorded and not planned: ${short(unk)}`);
  // the DAX changed: the question is asked again, the old answer named as forgotten
  fs.writeFileSync(path.join(ROOT, 'p/M.SemanticModel/model.bim'), JSON.stringify(bim(DAX2)));
  const h4 = await health();
  const pc4 = h4.j && h4.j.pleaseConfirm;
  chk(() => pc4 && pc4.items.some((x) => x.id === 'duplicateAggregate') && !(pc4.answered || []).length && pc4.answersForgotten && pc4.answersForgotten.count === 1, () => `S9. the DAX changed: asked again, the old answer forgotten: ${short(h4)}`);
  chk(() => fs.readFileSync(FILE, 'utf8') === JSON.stringify(saved, null, 2) + '\n', () => 'S10. a check without a plan never rewrites the answers file (the stale answer stays until the next approved write)');
  // forget: through the gate too
  const f1 = await health({ forgetAnswers: true });
  chk(() => !f1.err && f1.j.plan && f1.j.plan.writesAfterGo.some((w) => w.includes('M.dataarcus-answers.json')) && JSON.parse(fs.readFileSync(FILE, 'utf8')).answers.length === 1, () => `S11. forgetAnswers without planId: nothing changed, the plan names the file: ${short(f1)}`);
  await s.call('approve_plan', { planId: f1.j && f1.j.plan && f1.j.plan.planId });
  const f2 = await health({ forgetAnswers: true, planId: f1.j && f1.j.plan && f1.j.plan.planId });
  chk(() => !f2.err && JSON.parse(fs.readFileSync(FILE, 'utf8')).answers.length === 0, () => `S12. forgetAnswers with the approved plan empties the file: ${short(f2)}`);
}
{
  // a file of that name that is not a DataArcus answers file: not read as answers, never replaced
  proj('q', DAX);
  const other = path.join(ROOT, 'q', 'M.dataarcus-answers.json'), junk = '{"hello":"not ours"}';
  fs.writeFileSync(other, junk);
  const h = await s.call('check_model_health', { path: 'q/M.SemanticModel' });
  const key = h.j && h.j.pleaseConfirm && h.j.pleaseConfirm.items[0].answerKey;
  chk(() => !h.err && h.j.pleaseConfirm.answersFileProblem && !(h.j.pleaseConfirm.answered || []).length, () => `S13. a file that is not ours is named as a problem and not read as answers: ${short(h)}`);
  const p = await s.call('check_model_health', { path: 'q/M.SemanticModel', answers: [{ answerKey: key, answer: 'mistake' }] });
  const id = p.j && p.j.plan && p.j.plan.planId;
  if (id) await s.call('approve_plan', { planId: id });
  const w = await s.call('check_model_health', { path: 'q/M.SemanticModel', answers: [{ answerKey: key, answer: 'mistake' }], planId: id });
  chk(() => fs.readFileSync(other, 'utf8') === junk && (w.err || (w.j.pleaseConfirm && w.j.pleaseConfirm.answersNotWritten)), () => `S14. a file that is not ours is never replaced: ${short(w)}`);
}
await s.close();
// the privacy note names the file and what it holds
{
  const privacy = fs.readFileSync(path.join(HERE, 'PRIVACY.md'), 'utf8').replace(/\s+/g, ' ');
  chk(() => privacy.includes('.dataarcus-answers.json') && /hashes/.test(privacy), () => 'P1. PRIVACY.md names the answers file and says it holds hashes and answers only');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  b148  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  b148  ${checks} checks`);
