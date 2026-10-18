import './test-env.mjs';
// 0.3, B-153: a write that fails half-way (a full disk). Written red first.
//   W: one new file (writeFileNew, used by writeNew: the theme file, the TMDL scripts) goes to a temporary name in its
//      folder, then into place; a failure part-way, or after its folder was made, leaves nothing; what can't be removed
//      is named exactly (and nothing else is on disk)
//   T: the tree writer (writeTree: create_report, the twin, the native copy) records each file before writing it, so a
//      file cut off part-way is removed too; what can't be removed is named exactly
//   P: the plan: a failed write whose clean-up was complete leaves the plan unused (the same planId writes on a retry);
//      one that left something on disk marks the plan used (a new plan is needed); both said in the answer
//   node test-partial-writes.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 500) : JSON.stringify(x.j).slice(0, 500));
const ROOT = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-b153-')));
process.env.DATAARCUS_ROOT = ROOT;   // (before the modules are loaded: the working folder of the in-process checks)
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
// every file and folder under d (relative, '/'), folders with a trailing '/'
const tree = (d) => { const out = []; const walk = (x) => { if (!fs.existsSync(x)) return; for (const e of fs.readdirSync(x, { withFileTypes: true })) { const f = path.join(x, e.name), r = path.relative(d, f).split(path.sep).join('/'); if (e.isDirectory()) { out.push(r + '/'); walk(f); } else out.push(r); } }; walk(d); return out.sort(); };
const threw = (fn) => { try { fn(); return null; } catch (e) { return e; } };

const W = await import('./lib/write-io.mjs').catch(() => ({}));
const F = await import('./lib/files.mjs');
chk(() => typeof W.writeFileNew === 'function' && typeof W.setIo === 'function' && typeof W.failingIo === 'function', () => 'B-153. lib/write-io.mjs exports writeFileNew, setIo and failingIo');
const stub = (o) => W.setIo(W.failingIo(o));

if (typeof W.writeFileNew === 'function') {
  const D = path.join(ROOT, 'unit'); fs.mkdirSync(D);
  const data = JSON.stringify({ name: 'x'.repeat(4000) });
  // W1. the disk fills during the write: nothing at the name, no temporary file
  stub({ code: 'ENOSPC', how: 'partial', n: 1 });
  let e = threw(() => W.writeFileNew(path.join(D, 'Theme.json'), data));
  W.setIo();
  chk(() => e && e.code === 'ENOSPC' && e.message === 'Nothing was written: the file "unit/Theme.json" could not be written (the disk is full (ENOSPC)). What this call had written was removed. Nothing else was touched.', () => `W1. a disk full part-way says "Nothing was written": ${e && e.message}`);
  chk(() => tree(D).length === 0, () => `W1. nothing is left in the folder (no half file, no temporary file): ${tree(D)}`);
  chk(() => e && e.left && e.left.ours.length === 0 && e.left.foreign.length === 0, () => 'W1. the error says nothing was left (e.left)');
  // W2. a failure after the folder was made (freeFile made it): the folder is removed too
  const made = [];
  const f2 = F.freeFile('unit/themes/new', 'T', '.json', made);
  chk(() => made.length === 2 && made[0] === path.join(D, 'themes') && made[1] === path.join(D, 'themes', 'new'), () => `W2. freeFile tells the folders it made, outermost first: ${JSON.stringify(made)}`);
  stub({ code: 'ENOSPC', how: 'open', n: 1 });
  e = threw(() => W.writeFileNew(f2, data, { madeDirs: made }));
  W.setIo();
  chk(() => e && /^Nothing was written/.test(e.message) && tree(D).length === 0, () => `W2. a failure after the folder was made leaves no folder: ${tree(D)} ${e && e.message}`);
  // W3. the clean-up can't remove the half file: exactly that file is named, and it is all that is on disk
  stub({ code: 'ENOSPC', how: 'partial', n: 1, stuck: true });
  e = threw(() => W.writeFileNew(path.join(D, 'Stuck.json'), data));
  W.setIo();
  const left3 = tree(D);
  chk(() => e && e.code === 'PARTIAL_WRITE' && !/Nothing was written/.test(e.message) && /The write stopped part-way/.test(e.message), () => `W3. an incomplete clean-up never says "Nothing was written": ${e && e.message}`);
  chk(() => left3.length === 1 && /^\.dataarcus-tmp-[0-9a-f]{10}$/.test(left3[0]) && e.left.ours.length === 1 && path.basename(e.left.ours[0]) === left3[0] && e.message.includes('"unit/' + left3[0] + '"') && !fs.existsSync(path.join(D, 'Stuck.json')), () => `W3. exactly the half file is named and is all that is left: ${left3} ${e && e.message}`);
  left3.forEach((n) => fs.unlinkSync(path.join(D, n)));
  // W4. success: the whole file at its name, nothing else
  W.writeFileNew(path.join(D, 'Ok.json'), data);
  chk(() => tree(D).join('|') === 'Ok.json' && fs.readFileSync(path.join(D, 'Ok.json'), 'utf8') === data, () => `W4. a write that succeeds leaves the whole file and nothing else: ${tree(D)}`);
  // W5. never over anything
  e = threw(() => W.writeFileNew(path.join(D, 'Ok.json'), 'other'));
  chk(() => e && e.code === 'EEXIST' && fs.readFileSync(path.join(D, 'Ok.json'), 'utf8') === data && tree(D).join('|') === 'Ok.json', () => `W5. a taken name is refused, the old file untouched, no temporary file left: ${tree(D)} ${e && e.message}`);
  fs.unlinkSync(path.join(D, 'Ok.json'));

  // T1. the tree writer: the 3rd file is cut off part-way: nothing left, no temporary folder
  const files = [{ path: 'R.Report/definition/report.json', data }, { path: 'R.Report/definition/pages/p1/page.json', data }, { path: 'R.Report/definition/pages/p1/visuals/v/visual.json', data }, { path: 'R.Report/definition.pbir', data }, { path: 'R.pbip', data }];
  stub({ code: 'ENOSPC', how: 'partial', n: 3 });
  e = threw(() => F.writeTree(D, files));
  W.setIo();
  chk(() => e && /^Nothing was written: the files could not be written \(the disk is full \(ENOSPC\)\)/.test(e.message) && tree(D).length === 0, () => `T1. a file cut off part-way in a tree leaves nothing: ${tree(D)} ${e && e.message}`);
  // T2. a failure after mkdir (the first file of a new folder can't be created)
  stub({ code: 'ENOSPC', how: 'open', n: 2 });
  e = threw(() => F.writeTree(D, files));
  W.setIo();
  chk(() => e && /^Nothing was written/.test(e.message) && tree(D).length === 0, () => `T2. a failure after its folders were made leaves nothing: ${tree(D)} ${e && e.message}`);
  // T3. the half file can't be removed: exactly what is left is named
  stub({ code: 'ENOSPC', how: 'partial', n: 3, stuck: true });
  e = threw(() => F.writeTree(D, files));
  W.setIo();
  const left = tree(D), named = (e && e.left && e.left.ours || []).map((f) => path.relative(D, f).split(path.sep).join('/')).sort();
  chk(() => e && e.code === 'PARTIAL_WRITE' && /The write stopped part-way/.test(e.message) && !/Nothing was written/.test(e.message), () => `T3. an incomplete clean-up of a tree is said as such: ${e && e.message}`);
  chk(() => left.length > 0 && JSON.stringify(left.map((x) => x.replace(/\/$/, ''))) === JSON.stringify(named), () => `T3. what is named is exactly what is on disk: on disk ${JSON.stringify(left)}, named ${JSON.stringify(named)}`);
  chk(() => named.every((n) => e.message.includes('"unit/' + n + '"')), () => `T3. the message names each: ${e && e.message}`);
  fs.rmSync(D, { recursive: true, force: true }); fs.mkdirSync(D);
  // T4. after all that, the same tree writes whole
  F.writeTree(D, files);
  chk(() => tree(D).filter((x) => !x.endsWith('/')).length === 5 && !tree(D).some((x) => /dataarcus-tmp/.test(x)), () => `T4. the tree writes whole afterwards: ${tree(D)}`);
}

// U. withPlan in-process: each way a write can end, and what it does to the plan
{
  const Plans = await import('./lib/plans.mjs');
  const fresh = () => { const id = Plans.propose('theme', null, [], { pins: { generate_theme: {} } }); Plans.approve(id, 'user-in-app'); return id; };
  const usable = (id) => !threw(() => Plans.gate('generate_theme', id, null, {}));
  const clean = Object.assign(new Error('Nothing was written: x'), { left: { ours: [], foreign: [] } }), dirty = Object.assign(new Error('The write stopped part-way: x'), { left: { ours: ['/x'], foreign: [] } });
  let id = fresh(), e = threw(() => F.withPlan(id, 'generate_theme', () => { throw clean; }));
  chk(() => usable(id) && /was not used/.test(e.message), () => `U1. a clean failure leaves the plan usable, and says so: ${e && e.message}`);
  id = fresh(); e = threw(() => F.withPlan(id, 'generate_theme', () => { throw dirty; }));
  chk(() => !usable(id) && /is now used/.test(e.message), () => `U2. a failure that left something uses the plan, and says so: ${e && e.message}`);
  id = fresh(); e = threw(() => F.withPlan(id, 'generate_theme', () => { F.noteWritten(path.join(ROOT, 'placed')); throw new Error('the answer failed'); }));
  chk(() => !usable(id) && e.message === 'the answer failed', () => `U3. an error after the files were placed uses the plan (they are on disk): ${e && e.message}`);
  id = fresh(); e = threw(() => F.withPlan(id, 'generate_theme', () => { throw new Error('refused before writing'); }));
  chk(() => usable(id) && e.message === 'refused before writing', () => `U4. a refusal before any write leaves the plan as it was: ${e && e.message}`);
  id = fresh(); F.withPlan(id, 'generate_theme', () => 1);
  chk(() => !usable(id), () => 'U5. a write that succeeds uses the plan');
}

// ---------- the tools, with the plan ----------
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const model = (dir) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Product', 'string'), col('Order Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] }] } })); };
const NOT_USED = /The plan plan-[0-9a-f]{12} was not used: once the cause is fixed \(for a full disk: free some space\), call this tool again with the same planId\./;
const USED = /The plan plan-[0-9a-f]{12} is now used: part of this write is still on disk, so the approval can't be used for another try\. Delete what is named above, then make a new plan, show it to the user and wait for their go\./;

// P1. generate_theme into a new folder: the disk fills: nothing (no folder), the plan unused; the same plan writes on a retry
{
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:partial:1' });
  const args = { brand: '#0F766E', name: 'B153 Theme', folder: 'themes/b153' };
  const p = await s.call('generate_theme', args), id = p.j && p.j.plan && p.j.plan.planId;
  await s.call('approve_plan', { planId: id });
  const before = tree(ROOT), x = await s.call('generate_theme', Object.assign({ planId: id }, args)), after = tree(ROOT);
  chk(() => x.err && /^Nothing was written: the file "themes\/b153\/b153-theme\.json" could not be written \(the disk is full \(ENOSPC\)\)/.test(x.t) && NOT_USED.test(x.t), () => `P1. generate_theme: a full disk says nothing was written and the plan was not used: ${short(x)}`);
  chk(() => JSON.stringify(before) === JSON.stringify(after) && !fs.existsSync(path.join(ROOT, 'themes')), () => `P1. no half file and no folder left: ${after.filter((f) => !before.includes(f))}`);
  const y = await s.call('generate_theme', Object.assign({ planId: id }, args));
  chk(() => !y.err && y.j.file === 'b153-theme.json' && JSON.parse(fs.readFileSync(path.join(ROOT, 'themes/b153/b153-theme.json'), 'utf8')).name, () => `P1. the same plan writes the whole theme on a retry: ${short(y)}`);
  const z = await s.call('generate_theme', Object.assign({ planId: id }, args));
  chk(() => z.err && /already used for generate_theme/.test(z.t), () => `P1. and is then used: ${short(z)}`);
  await s.close();
}
// P2. create_report: the 3rd file cut off part-way: nothing left, the plan unused; the same plan writes the report
{
  model('rp');
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:partial:3' });
  const pl = await s.call('plan_layout', { path: 'rp', layout: 'exec', name: 'B153 Report', noDataMessage: false }), id = pl.j && pl.j.plan && pl.j.plan.planId;
  await s.call('approve_plan', { planId: id });
  const before = tree(path.join(ROOT, 'rp'));
  const x = await s.call('create_report', { path: 'rp', name: 'B153 Report', planId: id, design: pl.j && pl.j.design, noDataMessage: false });
  chk(() => x.err && /^Nothing was written: the files could not be written \(the disk is full \(ENOSPC\)\)/.test(x.t) && NOT_USED.test(x.t), () => `P2. create_report: a file cut off part-way: nothing written, the plan not used: ${short(x)}`);
  chk(() => JSON.stringify(tree(path.join(ROOT, 'rp'))) === JSON.stringify(before), () => `P2. the project folder is as it was: ${tree(path.join(ROOT, 'rp')).filter((f) => !before.includes(f))}`);
  const y = await s.call('create_report', { path: 'rp', name: 'B153 Report', planId: id, design: pl.j && pl.j.design, noDataMessage: false });
  chk(() => !y.err && y.j.report === 'B153 Report.Report' && fs.existsSync(path.join(ROOT, 'rp/B153 Report.pbip')), () => `P2. the same plan writes the report on a retry: ${short(y)}`);
  const z = await s.call('create_report', { path: 'rp', name: 'B153 Report', planId: id, design: pl.j && pl.j.design, noDataMessage: false });
  chk(() => z.err && /already used for create_report/.test(z.t), () => `P2. and is then used: ${short(z)}`);
  await s.close();
}
// P3. create_report: the half file can't be removed: exactly that is named, the plan is used
{
  model('rs');
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:partial:3+stuck' });
  const pl = await s.call('plan_layout', { path: 'rs', layout: 'exec', name: 'B153 Stuck', noDataMessage: false }), id = pl.j && pl.j.plan && pl.j.plan.planId;
  await s.call('approve_plan', { planId: id });
  const before = tree(path.join(ROOT, 'rs'));
  const x = await s.call('create_report', { path: 'rs', name: 'B153 Stuck', planId: id, design: pl.j && pl.j.design, noDataMessage: false });
  const added = tree(path.join(ROOT, 'rs')).filter((f) => !before.includes(f)).map((f) => 'rs/' + f.replace(/\/$/, ''));
  chk(() => x.err && /The write stopped part-way/.test(x.t) && !/Nothing was written/.test(x.t) && USED.test(x.t), () => `P3. an incomplete clean-up: said, and the plan is used: ${short(x)}`);
  chk(() => added.length > 0 && added.every((f) => x.t.includes('"' + f + '"')) && (x.t.match(/"rs\/[^"]+"/g) || []).length === added.length, () => `P3. exactly what is left on disk is named: on disk ${JSON.stringify(added)}; ${short(x)}`);
  const y = await s.call('create_report', { path: 'rs', name: 'B153 Stuck', planId: id, design: pl.j && pl.j.design, noDataMessage: false });
  chk(() => y.err && /already used for create_report/.test(y.t), () => `P3. the same plan is refused on a retry: ${short(y)}`);
  await s.close();
}
// P4. add_gulf_calendar: the script's file can't be created: nothing left, the plan unused; the same plan writes it
{
  model('gc');
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:open:1' });
  const args = { path: 'gc', firstYear: 2024, lastYear: 2025, asOf: '2026-10-11' };
  const p = await s.call('add_gulf_calendar', args), id = p.j && p.j.plan && p.j.plan.planId;
  await s.call('approve_plan', { planId: id });
  const before = tree(ROOT), x = await s.call('add_gulf_calendar', Object.assign({ planId: id }, args));
  chk(() => x.err && /Nothing was written/.test(x.t) && /ENOSPC/.test(x.t) && NOT_USED.test(x.t) && JSON.stringify(tree(ROOT)) === JSON.stringify(before), () => `P4. add_gulf_calendar: nothing left, the plan not used: ${short(x)}`);
  const y = await s.call('add_gulf_calendar', Object.assign({ planId: id }, args));
  chk(() => !y.err && y.j.scriptFile && fs.existsSync(path.join(ROOT, y.j.scriptFile)), () => `P4. the same plan writes the script on a retry: ${short(y)}`);
  await s.close();
}
// P5. generate_theme: the half file can't be removed: named, the plan used
{
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:partial:1+stuck' });
  const args = { brand: '#123456', name: 'B153 Stuck Theme' };
  const p = await s.call('generate_theme', args), id = p.j && p.j.plan && p.j.plan.planId;
  await s.call('approve_plan', { planId: id });
  const before = tree(ROOT), x = await s.call('generate_theme', Object.assign({ planId: id }, args));
  const added = tree(ROOT).filter((f) => !before.includes(f));
  chk(() => x.err && /The write stopped part-way/.test(x.t) && USED.test(x.t) && added.length === 1 && /^\.dataarcus-tmp-[0-9a-f]{10}$/.test(added[0]) && x.t.includes('"' + added[0] + '"'), () => `P5. the half theme file is named exactly, the plan used: ${JSON.stringify(added)} ${short(x)}`);
  const y = await s.call('generate_theme', Object.assign({ planId: id }, args));
  chk(() => y.err && /already used for generate_theme/.test(y.t), () => `P5. the same plan is refused on a retry: ${short(y)}`);
  await s.close();
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  b153  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  b153  ${checks} checks`);
