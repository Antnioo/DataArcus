// 0.3, J5: privacy and approval hardening, from an outside audit of 0.2.9 (all writes were gated; these were the gaps).
// Each written red first.
//   B-152: a report's fingerprint (reportPrint), its Arabic twin and its native copy read only the report's own file types
//          (definition JSON, definition.pbir, .platform, StaticResources images and theme JSON, private custom visuals'
//          files); any other file in the .Report folder (a stray .csv or .xlsx) is never opened, hashed or copied, and the
//          plan names it. The reads are instrumented: the sentinel files' bytes are never read.
//   B-154: an approval pins the model too: every plan that reads a model pins a hash of the model's definition files
//          (model.bim, or the TMDL files; a .pbit or model.bim file's own bytes); a write after the model changed is
//          refused with "the model changed after you approved: make the plan again", and nothing is written.
//   node test-approval-hardening.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

// the working folder first: the library modules read DATAARCUS_ROOT when they are loaded
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-j5-'));
process.env.DATAARCUS_ROOT = ROOT;
const cp = (from, to) => fs.cpSync(path.join(REPO, from), path.join(ROOT, to), { recursive: true });

// ---------- B-152: a report folder with files that are not the report's (made up: no employer data) ----------
const SENT = 'J5_SENTINEL_STRAY_DATA_5e1c';
cp('mcp/fixtures/twin-project', 'twin');
const RD = path.join(ROOT, 'twin/Twin Sales.Report');
const STRAY = {
  'orders.csv': `Customer,Amount\n${SENT},100\n`,
  'definition/export.xlsx': `PK\u0003\u0004${SENT}`,
  'StaticResources/RegisteredResources/customers.csv': `${SENT}\n`,
  'definition/pages/p1overview/notes.txt': `${SENT}\n`,
  '.pbi/localSettings.json': `{ "note": "${SENT}" }`
};
for (const [r, t] of Object.entries(STRAY)) { fs.mkdirSync(path.dirname(path.join(RD, r)), { recursive: true }); fs.writeFileSync(path.join(RD, r), t); }
const strayFull = Object.keys(STRAY).map((r) => path.join(RD, ...r.split('/')));

// every way a file is read (open, readFileSync), by real path
const opened = new Set();
const keyOf = (p) => { try { return fs.realpathSync(String(p)); } catch (e) { return path.resolve(String(p)); } };
const orig = { openSync: fs.openSync, readFileSync: fs.readFileSync };
fs.openSync = function (p, ...rest) { if (typeof p === 'string') opened.add(keyOf(p)); return orig.openSync.call(fs, p, ...rest); };
fs.readFileSync = function (p, ...rest) { if (typeof p === 'string') opened.add(keyOf(p)); return orig.readFileSync.call(fs, p, ...rest); };
const strayRead = () => strayFull.filter((f) => opened.has(keyOf(f))).map(rel);

const { reportPrint, strictFiles } = await import('./lib/read-report.mjs');
const { planTwin, writeTwin, twinTree } = await import('./lib/arabic-twin.mjs');
const { planNative, writeNative } = await import('./lib/native-copy.mjs');
const { loadModel } = await import('./lib/model.mjs');

// B152-1: the fingerprint reads none of them, and a change to them does not change it; a change to a page does
{
  opened.clear();
  const p1 = reportPrint('twin/Twin Sales.pbip');
  chk(() => p1 !== 'unreadable' && strayRead().length === 0, () => `B152-1. reportPrint opens no file that is not the report's: ${JSON.stringify(strayRead())} (print ${p1})`);
  fs.writeFileSync(path.join(RD, 'orders.csv'), `Customer,Amount\n${SENT},200\n`);
  const p2 = reportPrint('twin/Twin Sales.pbip');
  chk(() => p2 === p1, () => 'B152-2. a stray .csv changed: the report\'s fingerprint is the same (it is not part of the report)');
  const pg = path.join(RD, 'definition/pages/p1overview/page.json'), keep = orig.readFileSync.call(fs, pg);
  fs.writeFileSync(pg, keep.toString('utf8').replace('}', ', "x": 1 }'));
  chk(() => reportPrint('twin/Twin Sales.pbip') !== p1, () => 'B152-3. a page changed: the fingerprint changes (the report\'s own files are still hashed)');
  fs.writeFileSync(pg, keep);
  const files = strictFiles(RD);
  chk(() => files.length > 20 && Object.keys(STRAY).every((r) => !files.includes(r)) && files.includes('definition.pbir') && files.includes('.platform') && files.includes('StaticResources/RegisteredResources/twin-theme.json'),
    () => `B152-4. strictFiles lists the report's own files only: ${JSON.stringify(files)}`);
}
// B152-5..8: the twin's plan and write (in this process, so the reads are counted)
{
  opened.clear();
  const P = planTwin({ path: 'twin/Twin Sales.pbip' });
  chk(() => strayRead().length === 0, () => `B152-5. the twin's plan opens no stray file: ${JSON.stringify(strayRead())}`);
  const nc = P.answer.notCopied || {};
  chk(() => nc.count === 5 && Object.keys(STRAY).every((r) => (nc.files || []).some((f) => f.includes(path.basename(r)))) && /not copied/i.test(nc.note || ''),
    () => `B152-6. the twin's plan names the 5 files it leaves out: ${JSON.stringify(P.answer.notCopied)}`);
  opened.clear();
  // (0.3.1 K2: the write writes the exact files a plan kept, here twinTree's of the same plan)
  const done = writeTwin({ path: 'twin/Twin Sales.pbip' }, { data: { labels: {}, arabicMonth: false, source: reportPrint('twin/Twin Sales.pbip') } }, twinTree(planTwin({ path: 'twin/Twin Sales.pbip', labels: {}, arabicMonth: false, memory: false })));
  const TD = path.join(ROOT, 'twin/Twin Sales AR.Report'), written = tree(TD);
  chk(() => done.written && strayRead().length === 0, () => `B152-7. writing the twin opens no stray file: ${JSON.stringify(strayRead())}`);
  chk(() => written.length > 20 && written.every((f) => !orig.readFileSync.call(fs, f).includes(SENT)) && !written.some((f) => /\.(csv|xlsx|txt)$/.test(f) || /\/\.pbi\//.test(f)),
    () => `B152-8. the twin holds none of them: ${JSON.stringify(written.map(rel).filter((f) => /\.(csv|xlsx|txt)$|\/\.pbi\//.test(f)))}`);
  fs.rmSync(TD, { recursive: true, force: true }); fs.rmSync(path.join(ROOT, 'twin/Twin Sales AR.pbip'), { force: true });
}
// B152-9..12: the native copy's plan and write
{
  const m = loadModel('twin');
  opened.clear();
  const P = planNative('twin/Twin Sales.Report', m);
  chk(() => P.entries.length >= 1 && strayRead().length === 0, () => `B152-9. the native copy's plan opens no stray file: ${JSON.stringify(strayRead())} (${P.entries.length} replacements)`);
  const nc = P.answer.notCopied || {};
  chk(() => nc.count === 5 && /not copied/i.test(nc.note || ''), () => `B152-10. the native copy's plan names the files it leaves out: ${JSON.stringify(P.answer.notCopied)}`);
  opened.clear();
  const done = writeNative('twin/Twin Sales.Report', m, { data: { customVisuals: P.entries } });
  const ND = path.join(ROOT, 'twin/Twin Sales native.Report'), written = tree(ND);
  chk(() => done.written && strayRead().length === 0, () => `B152-11. writing the native copy opens no stray file: ${JSON.stringify(strayRead())}`);
  chk(() => written.length > 20 && written.every((f) => !orig.readFileSync.call(fs, f).includes(SENT)), () => `B152-12. the native copy holds none of them: ${JSON.stringify(written.map(rel).filter((f) => /\.(csv|xlsx|txt)$|\/\.pbi\//.test(f)))}`);
  fs.rmSync(ND, { recursive: true, force: true }); fs.rmSync(path.join(ROOT, 'twin/Twin Sales native.pbip'), { force: true });
}
fs.openSync = orig.openSync; fs.readFileSync = orig.readFileSync;

// ---------- B-154: the model pinned by every plan that reads one ----------
const { serverClient } = await import('./test-0.2.9.mjs');
const s = await serverClient(ROOT, {});
const approve = (id) => s.call('approve_plan', { planId: id });
const CHANGED = /the model changed after you approved: make the plan again/;
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bimModel = (dir) => { const f = path.join(ROOT, dir, 'M.SemanticModel/model.bim'); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Price', 'double'), col('Region', 'string'), col('Product', 'string'), col('Order Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }, { name: 'Avg Price', expression: 'DIVIDE ( SUM ( Sales[Price] ), COUNTROWS ( Sales ) )' }] }] } }));
  fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/definition.pbism'), '{ "version": "4.0", "settings": {} }'); return f; };
// the edit between the go and the write: a measure added to the model's definition
const editBim = (f) => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); j.model.tables[0].measures.push({ name: 'Added Later', expression: '1' }); fs.writeFileSync(f, JSON.stringify(j)); };
const all = () => tree(ROOT).map(rel).sort();
const added = (before) => all().filter((f) => !before.includes(f));

// B154-1..3: check_model_health's fix scripts
{
  const f = bimModel('h');
  const x = await s.call('check_model_health', { path: 'h' }), id = x.j && x.j.plan && x.j.plan.planId;
  chk(() => /^plan-/.test(id || '') && /model/i.test(x.j.plan.modelPinned || ''), () => `B154-1. the scripts' plan says the model is pinned: ${short(x)}`);
  await approve(id); editBim(f);
  const before = all(), y = await s.call('check_model_health', { path: 'h', planId: id });
  chk(() => y.err && CHANGED.test(y.t) && added(before).length === 0, () => `B154-2. check_model_health after the model changed: refused, nothing written: ${short(y)} ${JSON.stringify(added(before))}`);
  // the same model unchanged: a new plan writes (the pin does not refuse what did not change)
  const x2 = await s.call('check_model_health', { path: 'h' }), id2 = x2.j && x2.j.plan && x2.j.plan.planId; await approve(id2);
  const b2 = all(), y2 = await s.call('check_model_health', { path: 'h', planId: id2 });
  chk(() => !y2.err && added(b2).some((g) => /\.tmdl$/.test(g)), () => `B154-3. an unchanged model writes with its approved plan: ${short(y2)}`);
}
// B154-4..5: plan_layout -> create_report
{
  const f = bimModel('r');
  const pl = await s.call('plan_layout', { path: 'r', name: 'Pinned' }), id = pl.j && pl.j.plan && pl.j.plan.planId;
  chk(() => /^plan-/.test(id || '') && /model/i.test(pl.j.plan.modelPinned || ''), () => `B154-4. the report's plan says the model is pinned: ${short(pl)}`);
  await approve(id); editBim(f);
  const before = all(), r = await s.call('create_report', { path: 'r', name: 'Pinned', planId: id, design: pl.j && pl.j.design });
  chk(() => r.err && CHANGED.test(r.t) && added(before).length === 0, () => `B154-5. create_report after the model changed: refused, nothing written: ${short(r)} ${JSON.stringify(added(before))}`);
}
// B154-6: add_gulf_calendar
{
  const f = bimModel('c'), args = { path: 'c', firstYear: 2024, lastYear: 2025, asOf: '2026-10-18' };
  const x = await s.call('add_gulf_calendar', args), id = x.j && x.j.plan && x.j.plan.planId;
  await approve(id); editBim(f);
  const before = all(), y = await s.call('add_gulf_calendar', Object.assign({}, args, { planId: id }));
  chk(() => /^plan-/.test(id || '') && y.err && CHANGED.test(y.t) && added(before).length === 0, () => `B154-6. add_gulf_calendar after the model changed: refused, nothing written: ${short(y)} ${JSON.stringify(added(before))}`);
}
// B154-7: a TMDL model: one .tmdl file edited
{
  cp('scripts/tests/fixtures/model-health/tmdl-ramadan/definition', 'tm/Ramadan Test.SemanticModel/definition');
  fs.writeFileSync(path.join(ROOT, 'tm/Ramadan Test.SemanticModel/definition.pbism'), '{ "version": "4.0", "settings": {} }');
  const args = { path: 'tm', firstYear: 2024, lastYear: 2025, asOf: '2026-10-18', name: 'Pinned Calendar' };
  const x = await s.call('add_gulf_calendar', args), id = x.j && x.j.plan && x.j.plan.planId;
  await approve(id);
  const t = tree(path.join(ROOT, 'tm/Ramadan Test.SemanticModel/definition')).find((g) => /\.tmdl$/.test(g) && /tables/.test(g));
  fs.appendFileSync(t, '\n');
  const before = all(), y = await s.call('add_gulf_calendar', Object.assign({}, args, { planId: id }));
  chk(() => /^plan-/.test(id || '') && y.err && CHANGED.test(y.t) && added(before).length === 0, () => `B154-7. a TMDL file changed after the go: refused, nothing written: ${short(x)} ${short(y)}`);
}
// B154-8: the Arabic twin (its plan reads the model definition.pbir names, for the month column)
{
  const pl = await s.call('create_arabic_twin', { path: 'twin/Twin Sales.pbip' }), id = pl.j && pl.j.plan && pl.j.plan.planId;
  await approve(id); editBim(path.join(ROOT, 'twin/Twin Sales.SemanticModel/model.bim'));
  const before = all(), y = await s.call('create_arabic_twin', { path: 'twin/Twin Sales.pbip', planId: id });
  chk(() => /^plan-/.test(id || '') && y.err && CHANGED.test(y.t) && added(before).length === 0, () => `B154-8. the twin after its model changed: refused, nothing written: ${short(pl)} ${short(y)}`);
}
// B154-9: the native copy (its plan reads the model for the replacements' types and formats)
{
  const args = { path: 'twin', customVisualsFrom: 'twin/Twin Sales.Report' };
  const pl = await s.call('plan_layout', args), id = pl.j && pl.j.plan && pl.j.plan.planId;
  await approve(id); editBim(path.join(ROOT, 'twin/Twin Sales.SemanticModel/model.bim'));
  const before = all(), y = await s.call('create_report', Object.assign({}, args, { planId: id }));
  chk(() => /^plan-/.test(id || '') && y.err && CHANGED.test(y.t) && added(before).length === 0, () => `B154-9. the native copy after its model changed: refused, nothing written: ${short(pl)} ${short(y)}`);
}
// B154-10: what is not the model's definition does not count: Power BI's local data cache changes, the write goes on
{
  const f = bimModel('d'), cache = path.join(ROOT, 'd/M.SemanticModel/.pbi/cache.abf');
  fs.mkdirSync(path.dirname(cache), { recursive: true }); fs.writeFileSync(cache, SENT);
  const args = { path: 'd', firstYear: 2024, lastYear: 2025, asOf: '2026-10-18' };
  const x = await s.call('add_gulf_calendar', args), id = x.j && x.j.plan && x.j.plan.planId;
  await approve(id); fs.writeFileSync(cache, SENT + SENT);
  const y = await s.call('add_gulf_calendar', Object.assign({}, args, { planId: id }));
  chk(() => !y.err && y.j.scriptFile && fs.existsSync(f), () => `B154-10. a change to the data cache (.pbi/cache.abf) is not a model change: written: ${short(y)}`);
}

await s.close();
fs.rmSync(ROOT, { recursive: true, force: true });
problems.forEach((p) => console.log('  - ' + p));
console.log(`${problems.length ? 'FAIL' : 'PASS'}  approval-hardening  ${checks} checks${problems.length ? `, ${problems.length} failed` : ''}`);
if (problems.length) process.exit(1);
