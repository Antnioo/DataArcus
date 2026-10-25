// R5 (0.3.0 release, safety; the owner approved fixing every finding of the outside audit of 19 Oct before release):
// the "Please confirm" answers file and memory (B-148, #56). Written red first.
//   F04: the answers file is replaced only if it is still the file that was checked (dev+ino, size, content hash taken
//        at the check, verified again right before the replace); otherwise nothing changes. The plan and the approval
//        page say "replaces the answers file DataArcus wrote", never "nothing is overwritten" for it.
//   F05: the file is written through write-io (temp 'wx' inside the try, removed on failure); a failed write names what
//        is left and says whether the plan was used.
//   F14: an unrelated-table question's signature follows its table evidence (key columns, their types).
//   F10: a record keeps no name in plain text: the question id and the object are hashed (the promise says so).
//   F12: (browser, scripts/tests/model-health.mjs) stale answers are kept, marked, and deleted only by "Forget".
//   node test-0.3.0-answers-safety.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { serverSource } from './test-source.mjs';   // (0.3.1 S9: the server's code is server.mjs, tools/ and the lib/ modules it shared)

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 500) : JSON.stringify(x.j).slice(0, 500));

const CM = require('../assets/js/confirm-memory.js');
const Health = require('../assets/js/model-health-engine.js');
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-r5-'));
process.env.DATAARCUS_ROOT = ROOT;   // (before answers.mjs loads: model.mjs reads it once)
const A = await import('./lib/answers.mjs');
const W = await import('./lib/write-io.mjs');

const DAX = 'SUM(Sales[Qty]) + SUM(Sales[Qty])';
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bim = (expr) => ({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'),
  columns: [col('Qty', 'int64'), col('Amount', 'double')],
  measures: [{ name: 'Units Doubled', expression: expr, formatString: '#,0' }] }] } });
// (the server cases: columns formatted, so no fix script is planned and the answers file is the only write)
const fmt = (c, f) => Object.assign(c, { formatString: f, summarizeBy: 'none' });
const bimQuiet = (expr) => ({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'),
  columns: [fmt(col('Qty', 'int64'), '#,0'), fmt(col('Amount', 'double'), '#,0.00')],
  measures: [{ name: 'Units Doubled', expression: expr, formatString: '#,0' }] }] } });
const tmpLeft = (dir) => fs.readdirSync(dir).filter((n) => n.startsWith('.dataarcus-tmp-'));
const r1 = Health.analyze(bim(DAX), null), q1 = r1.confirm.find((c) => c.id === 'duplicateAggregate');
const rec = (answer) => CM.record(q1, answer, r1.rawTables, '2026-10-19T10:00:00.000Z');

// ---------- F04: replaced only if it is still the file that was checked ----------
{
  const dir = path.join(ROOT, 'f04'); fs.mkdirSync(dir);
  const file = path.join(dir, 'M.dataarcus-answers.json');
  A.writeAnswers(dir, 'M', [rec('intended')], A.readAnswers(dir, 'M'));
  // (a) another file swapped in (a new inode) after the check, before the replace: refused, the swapped file untouched
  const checked = A.readAnswers(dir, 'M');
  chk(() => checked.ours && checked.checked && checked.checked.ino && /^[0-9a-f]{64}$/.test(checked.checked.hash) && checked.checked.size > 0, () => `F04-0. the check takes the file's identity (dev+ino, size, hash): ${JSON.stringify(checked.checked)}`);
  const swapped = fs.readFileSync(file, 'utf8').replace('"intended"', '"mistake"');
  W.setIo({ writeFileSync(f, data, opts) { if (path.basename(String(f)).startsWith('.dataarcus-tmp-')) { const x = path.join(dir, 'other.json'); fs.writeFileSync(x, swapped); fs.renameSync(x, file); } return fs.writeFileSync(f, data, opts); } });
  let e1 = null; try { A.writeAnswers(dir, 'M', [rec('intended'), rec('mistake')], checked); } catch (e) { e1 = e; }
  W.setIo();
  chk(() => e1 && /Nothing was written/.test(e1.message) && /changed after/.test(e1.message), () => `F04-1. a file swapped in after the check is refused, nothing written: ${e1 && e1.message}`);
  chk(() => fs.readFileSync(file, 'utf8') === swapped, () => 'F04-2. the swapped file is byte-identical');
  // (0.3.1 T1, the mutation suite: F04-1 passed with dev+ino left out of the check, since the swapped file's size and hash
  // differ) a byte-identical copy put in its place (a new inode only) is refused too
  {
    const checkedB = A.readAnswers(dir, 'M'), same = fs.readFileSync(file);
    W.setIo({ writeFileSync(f, data, opts) { if (path.basename(String(f)).startsWith('.dataarcus-tmp-')) { const x = path.join(dir, 'copy.json'); fs.writeFileSync(x, same); fs.renameSync(x, file); } return fs.writeFileSync(f, data, opts); } });
    let eb = null; try { A.writeAnswers(dir, 'M', [rec('intended'), rec('mistake')], checkedB); } catch (e) { eb = e; }
    W.setIo();
    chk(() => eb && /changed after/.test(eb.message) && fs.readFileSync(file).equals(same), () => `F04-1b. a byte-identical copy swapped in after the check (a new inode) is refused: ${eb ? eb.message : 'replaced'}`);
  }
  chk(() => !tmpLeft(dir).length, () => `F04-3. no temporary file left: ${tmpLeft(dir)}`);
  // (b) the same file edited in place (same inode, same size, other bytes) after the check: refused too
  const checked2 = A.readAnswers(dir, 'M');
  const edited = fs.readFileSync(file, 'utf8').replace('"mistake"', '"MISTAK"');
  W.setIo({ writeFileSync(f, data, opts) { if (path.basename(String(f)).startsWith('.dataarcus-tmp-')) fs.writeFileSync(file, edited); return fs.writeFileSync(f, data, opts); } });
  let e2 = null; try { A.writeAnswers(dir, 'M', [rec('intended')], checked2); } catch (e) { e2 = e; }
  W.setIo();
  chk(() => e2 && /Nothing was written/.test(e2.message) && fs.readFileSync(file, 'utf8') === edited && !tmpLeft(dir).length, () => `F04-4. an in-place edit of the same size after the check is refused, the file byte-identical: ${e2 && e2.message}`);
  // (c) the file is still the one checked: replaced
  fs.writeFileSync(file, swapped);
  const ok = A.readAnswers(dir, 'M');
  let e3 = null; try { A.writeAnswers(dir, 'M', [rec('intended')], ok); } catch (e) { e3 = e; }
  chk(() => !e3 && JSON.parse(fs.readFileSync(file, 'utf8')).answers.length === 1 && !tmpLeft(dir).length, () => `F04-5. the file checked and unchanged is replaced: ${e3 && e3.message}`);
  // (d) a file that appeared after a check that found none: never replaced
  const dir2 = path.join(ROOT, 'f04b'); fs.mkdirSync(dir2);
  const none = A.readAnswers(dir2, 'M'); fs.writeFileSync(path.join(dir2, 'M.dataarcus-answers.json'), 'x');
  let e4 = null; try { A.writeAnswers(dir2, 'M', [rec('intended')], none); } catch (e) { e4 = e; }
  chk(() => e4 && fs.readFileSync(path.join(dir2, 'M.dataarcus-answers.json'), 'utf8') === 'x' && !tmpLeft(dir2).length, () => `F04-6. a file that appeared after the check is never replaced: ${e4 && e4.message}`);
  // the wording: the plan line and the approval note say what is replaced
  chk(() => typeof A.writesNote === 'function' && /replaces the answers file DataArcus wrote/.test(A.writesNote(['the answers file "M.dataarcus-answers.json" next to the project, which replaces the answers file DataArcus wrote there: x']))
    && !/Nothing is overwritten or deleted\.$/.test(A.writesNote(['the answers file "M.dataarcus-answers.json" next to the project, which replaces the answers file DataArcus wrote there: x']))
    // (changed on purpose in R6, F09 e: the sentence for a plan of new files also says what a failed write removes)
    && A.writesNote(['a new file']) === 'New files only: nothing is overwritten or deleted. If the write fails part-way, DataArcus removes what this call created, and names anything it could not remove.', () => 'F04-7. writesNote: "replaces the answers file DataArcus wrote" for a replace, "New files only: nothing is overwritten or deleted." otherwise');
  const aw = fs.readFileSync(path.join(HERE, 'lib/approval-window.mjs'), 'utf8'), sv = serverSource();
  chk(() => !/Nothing is overwritten or deleted\./.test(aw) && /writesNote\(/.test(aw) && !/\\nNothing is overwritten or deleted\./.test(sv), () => 'F04-8. the approval page and the app\'s own prompt take their note from writesNote');
}

// ---------- F05: through write-io; a failed write leaves nothing (or names what is left) ----------
{
  const dir = path.join(ROOT, 'f05'); fs.mkdirSync(dir);
  const file = path.join(dir, 'M.dataarcus-answers.json');
  A.writeAnswers(dir, 'M', [rec('intended')], A.readAnswers(dir, 'M'));
  const before = fs.readFileSync(file);
  W.setIo(W.failingIo({ code: 'ENOSPC', how: 'partial', n: 1 }));
  let e1 = null; try { A.writeAnswers(dir, 'M', [rec('mistake')], A.readAnswers(dir, 'M')); } catch (e) { e1 = e; }
  W.setIo();
  chk(() => e1 && /Nothing was written/.test(e1.message) && e1.left && !e1.left.ours.length && !tmpLeft(dir).length && fs.readFileSync(file).equals(before), () => `F05-1. the temp write fails half-way: no temp left, the file unchanged, nothing left: ${e1 && e1.message}`);
  W.setIo(W.failingIo({ code: 'ENOSPC', how: 'partial', n: 1, stuck: true }));
  let e2 = null; try { A.writeAnswers(dir, 'M', [rec('mistake')], A.readAnswers(dir, 'M')); } catch (e) { e2 = e; }
  W.setIo();
  const left = tmpLeft(dir);
  chk(() => e2 && e2.code === 'PARTIAL_WRITE' && e2.left.ours.length === 1 && left.length === 1 && path.basename(e2.left.ours[0]) === left[0] && e2.message.includes(left[0]) && fs.readFileSync(file).equals(before), () => `F05-2. a temp file that can't be removed is named exactly (and the answers file unchanged): ${e2 && e2.message} / ${left}`);
  left.forEach((n) => fs.unlinkSync(path.join(dir, n)));
  // a new file: the same (write-io's writeFileNew)
  const dir2 = path.join(ROOT, 'f05b'); fs.mkdirSync(dir2);
  W.setIo(W.failingIo({ code: 'ENOSPC', how: 'partial', n: 1 }));
  let e3 = null; try { A.writeAnswers(dir2, 'M', [rec('mistake')], A.readAnswers(dir2, 'M')); } catch (e) { e3 = e; }
  W.setIo();
  chk(() => e3 && /Nothing was written/.test(e3.message) && !fs.readdirSync(dir2).length, () => `F05-3. a new answers file that fails half-way leaves nothing: ${e3 && e3.message} / ${fs.readdirSync(dir2)}`);
  const src = fs.readFileSync(path.join(HERE, 'lib/answers.mjs'), 'utf8').replace(/\/\/.*$/gm, '');
  chk(() => !/\bfs\.(writeFileSync|renameSync|linkSync|unlinkSync)\b/.test(src), () => 'F05-4. answers.mjs writes only through write-io (no direct fs write calls)');
}
// the server: the plan's use is stated, and the leftovers named
const proj = (dir, model) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify(model)); };
async function planned(s, target, answer) {
  const h0 = await s.call('check_model_health', { path: target });
  const key = h0.j && h0.j.pleaseConfirm && h0.j.pleaseConfirm.items[0].answerKey;
  const h1 = await s.call('check_model_health', { path: target, answers: [{ answerKey: key, answer }] });
  const id = h1.j && h1.j.plan && h1.j.plan.planId;
  await s.call('approve_plan', { planId: id });
  return { key, id, h1 };
}
{
  proj('s1', bimQuiet(DAX)); proj('s2', bimQuiet(DAX));
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:partial:1' });
  const p = await planned(s, 's1/M.SemanticModel', 'intended');
  chk(() => p.h1.j.plan.writesAfterGo.length === 1 && /a new file/.test(p.h1.j.plan.writesAfterGo[0]), () => `F05-5. the plan writes only the answers file, named as a new file: ${short(p.h1)}`);
  const w = await s.call('check_model_health', { path: 's1/M.SemanticModel', answers: [{ answerKey: p.key, answer: 'intended' }], planId: p.id });
  const pc = w.j && w.j.pleaseConfirm;
  chk(() => !w.err && /Nothing was written/.test(pc.answersNotWritten) && /not used/.test(pc.answersPlan || '') && !(pc.answersLeftOnDisk || []).length && !fs.existsSync(path.join(ROOT, 's1/M.dataarcus-answers.json')) && !tmpLeft(path.join(ROOT, 's1')).length, () => `F05-6. a failed write that left nothing: the plan is not used, and said: ${short(w)}`);
  const w2 = await s.call('check_model_health', { path: 's1/M.SemanticModel', answers: [{ answerKey: p.key, answer: 'intended' }], planId: p.id });
  chk(() => !w2.err && w2.j.pleaseConfirm.answersFile && fs.existsSync(path.join(ROOT, 's1/M.dataarcus-answers.json')), () => `F05-7. the same planId writes once the cause is gone: ${short(w2)}`);
  // the file is there now: the next plan says it replaces the answers file DataArcus wrote
  const h = await s.call('check_model_health', { path: 's1/M.SemanticModel', forgetAnswers: true });
  chk(() => h.j.plan && /replaces the answers file DataArcus wrote/.test(h.j.plan.writesAfterGo.join(' ')) && /emptied/.test(h.j.plan.writesAfterGo.join(' ')), () => `F05-8. the plan for an existing answers file says it replaces the file DataArcus wrote: ${short(h)}`);
  await s.close();
  const s2 = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:partial:1+stuck' });
  const q = await planned(s2, 's2/M.SemanticModel', 'mistake');
  const x = await s2.call('check_model_health', { path: 's2/M.SemanticModel', answers: [{ answerKey: q.key, answer: 'mistake' }], planId: q.id });
  const left = tmpLeft(path.join(ROOT, 's2')), xc = x.j && x.j.pleaseConfirm;
  chk(() => !x.err && left.length === 1 && (xc.answersLeftOnDisk || []).length === 1 && xc.answersLeftOnDisk[0].endsWith(left[0]) && /is now used/.test(xc.answersPlan || ''), () => `F05-9. a temp file left: named exactly, the plan used: ${short(x)} / ${left}`);
  const x2 = await s2.call('check_model_health', { path: 's2/M.SemanticModel', answers: [{ answerKey: q.key, answer: 'mistake' }], planId: q.id });
  chk(() => x2.err && /already used/.test(x2.t), () => `F05-10. that plan can't write again: ${short(x2)}`);
  await s2.close();
}

// ---------- F14: an unrelated table's question follows its table evidence ----------
{
  const fact = (keyName, keyType, dimKeyType) => ({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [col(keyName, keyType), col('Amount', 'double'), col('Qty', 'int64')] },
    { name: 'Customer', partitions: mp('Customer'), columns: [Object.assign(col(keyName, dimKeyType || keyType), { isKey: true }), col('Name', 'string')] },
    { name: 'Product', partitions: mp('Product'), columns: [col('Color', 'string')] }] } });
  const sigOf = (model) => { const r = Health.analyze(model, null), q = r.confirm.find((c) => c.id === 'unrelatedTable'); return q ? CM.signature(q, r.rawTables) : null; };
  const base = sigOf(fact('CustomerKey', 'int64'));
  chk(() => base && sigOf(fact('CustomerKey', 'int64')) === base, () => `F14-0. the unrelated-table question is asked and its signature is stable: ${base}`);
  chk(() => sigOf(fact('CustomerID', 'int64')) && sigOf(fact('CustomerID', 'int64')) !== base, () => 'F14-1. the key column renamed: the signature changes');
  chk(() => sigOf(fact('CustomerKey', 'string')) && sigOf(fact('CustomerKey', 'string')) !== base, () => 'F14-2. the key\'s type changed: the signature changes');
  const dateModel = (t) => ({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Qty', 'int64')] },
    { name: 'Calendar', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), col(t, 'dateTime')] }] } });
  const d1 = sigOf(dateModel('Month Start')), d2 = sigOf(dateModel('Week Start'));
  chk(() => d1 && d2 && d1 !== d2, () => 'F14-3. a date table\'s date columns changed: the signature changes');
  // the MCP: answered, then the key changes: the question comes back
  proj('t', fact('CustomerKey', 'int64'));
  const s = await serverClient(ROOT);
  const h0 = await s.call('check_model_health', { path: 't/M.SemanticModel' });
  const it = h0.j && h0.j.pleaseConfirm && h0.j.pleaseConfirm.items.find((x) => x.id === 'unrelatedTable');
  const h1 = await s.call('check_model_health', { path: 't/M.SemanticModel', answers: [{ answerKey: it && it.answerKey, answer: 'intended' }] });
  await s.call('approve_plan', { planId: h1.j && h1.j.plan && h1.j.plan.planId });
  await s.call('check_model_health', { path: 't/M.SemanticModel', answers: [{ answerKey: it && it.answerKey, answer: 'intended' }], planId: h1.j && h1.j.plan && h1.j.plan.planId });
  const h2 = await s.call('check_model_health', { path: 't/M.SemanticModel' });
  chk(() => !h2.j.pleaseConfirm.items.some((x) => x.id === 'unrelatedTable') && h2.j.pleaseConfirm.answered.some((x) => x.id === 'unrelatedTable'), () => `F14-4. answered: not asked again: ${short(h2)}`);
  fs.writeFileSync(path.join(ROOT, 't/M.SemanticModel/model.bim'), JSON.stringify(fact('CustomerKey', 'string')));
  const h3 = await s.call('check_model_health', { path: 't/M.SemanticModel' });
  chk(() => h3.j.pleaseConfirm.items.some((x) => x.id === 'unrelatedTable') && h3.j.pleaseConfirm.answersForgotten && h3.j.pleaseConfirm.answersForgotten.count === 1, () => `F14-5. the unrelated table's key changed: the question comes back: ${short(h3)}`);
  // F10 on disk: the file holds no name of the model
  let t = ''; try { t = fs.readFileSync(path.join(ROOT, 't/M.dataarcus-answers.json'), 'utf8'); } catch (e) { t = 'missing'; }
  chk(() => t !== 'missing' && !/Sales|Customer|unrelatedTable/.test(t), () => `F10-4. the answers file holds no table name and no question id in plain text: ${t.slice(0, 400)}`);
  await s.close();
}

// ---------- F10: what a record keeps matches the promise ----------
{
  const r = rec('intended'), j = JSON.stringify(r);
  chk(() => JSON.stringify(Object.keys(r).sort()) === JSON.stringify(['answer', 'at', 'by', 'evidenceSignature', 'objectHash', 'questionHash']) && /^[0-9a-f]{64}$/.test(r.questionHash) && /^[0-9a-f]{64}$/.test(r.objectHash), () => `F10-1. a record: the hashes, the answer, its date and "user": ${j}`);
  chk(() => !/Units Doubled|duplicateAggregate|SUM\(|Qty/.test(j), () => `F10-2. no name, question id or DAX in plain text: ${j}`);
  // a record written by B-148 (plain questionId and object) still answers its question, held hashed from then on
  const old = { questionId: 'duplicateAggregate', object: '[Units Doubled]', answer: 'mistake', evidenceSignature: CM.signature(q1, r1.rawTables), at: '2026-10-18T10:00:00.000Z', by: 'user' };
  const a = CM.apply(r1.confirm, CM.upgrade ? [old].map(CM.upgrade) : [old], r1.rawTables);
  chk(() => a.answered.length === 1 && a.answered[0].record.answer === 'mistake' && !JSON.stringify(a.keep).includes('Units Doubled'), () => `F10-3. an older record still applies, and is kept hashed: ${JSON.stringify(a.keep)}`);
  const privacy = fs.readFileSync(path.join(HERE, 'PRIVACY.md'), 'utf8').replace(/\s+/g, ' ');
  chk(() => /answers file/.test(privacy) && /no name/i.test(privacy) && /date/.test(privacy) && /hash of the question/i.test(privacy), () => 'F10-5. PRIVACY.md says exactly what is kept: hashes (of the question and its object), the answer, its date; no name, no DAX, no data');
  const cm = fs.readFileSync(path.join(REPO, 'assets/js/confirm-memory.js'), 'utf8');
  chk(() => /questionHash, objectHash, answer, evidenceSignature, at, by/.test(cm), () => 'F10-6. confirm-memory.js documents the record as it is');
}
// ---------- F12 (the shared part): apply keeps stale records apart, never drops them ----------
{
  const r2 = Health.analyze(bim(DAX + ' + 0'), null), a = CM.apply(r2.confirm, [rec('intended')], r2.rawTables);
  chk(() => a.stale.length === 1 && typeof CM.kept === 'function' && CM.kept(a).length === 1, () => 'F12-1. a stale record is kept (kept() = the good ones and the stale ones); only Forget drops it');
  const mh = fs.readFileSync(path.join(REPO, 'assets/js/model-health.js'), 'utf8');
  chk(() => !/qPrune/.test(mh) && !/m\.a\.keep\.concat/.test(mh), () => 'F12-2. the page no longer prunes stale answers (nor drops them when a new answer is saved)');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  r5-answers  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  r5-answers  ${checks} checks`);
