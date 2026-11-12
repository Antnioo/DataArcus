// AU1 (0.3.3; the owner, 12 Nov, D-1112-01; mcp/work/AU1.md): the Health Check says what it did not read.
// The night audit (12 Nov) measured two silent reads on made-up models, rebuilt here from its description:
//   AUD-067  a TMDL model whose table file is missing was read as a smaller model and scored higher (no-measures
//            without tables/Dates.tmdl: 1 table, skipped [], 96 where the whole model scores 92)
//   AUD-068  a zip with two semantic models: the worker read the first .tmdl's model in zip order, said nothing,
//            and read every report in the zip
// Written red first:
//   R  the reader (assets/js/tmdl-model.js read): a table the model names (ref table, a relationship end) and no file
//      defines is one skipped entry, by its name; quoted and differently cased names; no false alarm; no double entry
//   G  R-81: every TMDL project in the repo (the golden inputs and every TMDL fixture mcp/fixtures copies) reads with
//      0 skipped entries and the same model as fromFiles (0 score differences)
//   W  the website's worker (model-health-worker.js, source and .min.js, in a vm): no score, the table named, NO_MODEL
//      never when a name can be given; two models in one zip, in both orders: the same named answer, the report of
//      the model read only, or none said
//   S  read_model and check_model_health on the real server: `unreadable` first, the table named, no score
// Made-up models only (mcp/test-models/no-measures, mcp/fixtures/health-project): no employer data.
//   node test-0.3.3-au1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import vm from 'node:vm';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), JS = path.join(REPO, 'assets/js');
const require = createRequire(import.meta.url);
const T = require('../assets/js/tmdl-model.js'), E = require('../assets/js/model-health-engine.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (x) => JSON.stringify(x === undefined ? null : x).slice(0, 400);

const SRC = path.join(HERE, 'test-models/no-measures'), MODEL = 'Plain Orders.SemanticModel', DEF = path.join(SRC, MODEL, 'definition');
const NAMES = ['database.tmdl', 'model.tmdl', 'relationships.tmdl', 'tables/Orders.tmdl', 'tables/Dates.tmdl'];
const text = Object.fromEntries(NAMES.map((n) => [n, fs.readFileSync(path.join(DEF, n), 'utf8')]));
// the project's files with changes: drop (names left out) and edit ({ name: new text })
const files = (drop = [], edit = {}) => NAMES.filter((n) => !drop.includes(n)).map((n) => ({ path: 'definition/' + n, text: n in edit ? edit[n] : text[n] }))
  .concat(Object.keys(edit).filter((n) => !NAMES.includes(n)).map((n) => ({ path: 'definition/' + n, text: edit[n] })));
const noRefs = text['model.tmdl'].replace(/^ref table .*\n?/gm, '');
const says = (r) => (r.skipped || []).map((s) => `${s.table || s.path}:${s.code}`).join(', ');

// ---------- R. the reader ----------
{
  const whole = T.read(files());
  chk(() => whole.skipped.length === 0, () => `R0. the whole model: nothing skipped: ${says(whole)}`);
  const noDates = T.read(files(['tables/Dates.tmdl']));
  chk(() => says(noDates) === 'Dates:missingTable' && noDates.skipped[0].path === undefined, () => `R1. without tables/Dates.tmdl: one entry, the table Dates, code missingTable (no file path): ${J(noDates.skipped)}`);
  chk(() => /^model\.tmdl names this table/.test(T.whyOf(noDates.skipped[0], 'en')) && /no file in the project defines it/.test(T.whyOf(noDates.skipped[0], 'en')), () => `R2. its reason: "${T.whyOf(noDates.skipped[0] || {}, 'en')}"`);
  const msg = T.unreadableSaid(noDates.skipped, 'en', 'check'), ar = T.unreadableSaid(noDates.skipped, 'ar', 'check');
  chk(() => /^1 model file\(s\) could not be read: Dates \(model\.tmdl names this table/.test(msg), () => `R3. the message names the table: ${msg}`);
  // D-1109-07: no new Arabic sentence ships; the Arabic message carries the English reason until the owner approves one
  chk(() => /^تعذّرت قراءة 1 من ملفات النموذج: Dates \(يذكر model\.tmdl هذا الجدول، ولا يوجد في المشروع ملف يعرّفه\)/.test(ar) && T.whyOf({ code: 'missingEnd' }, 'ar') === T.whyOf({ code: 'missingEnd' }, 'en'), () => `R4. Arabic: the approved frame, the reason approved by D-1112-05 (0.3.3 AR7; the relationship reason is held and stays English): ${ar}`);
  const noRefNoDates = T.read(files(['tables/Dates.tmdl'], { 'model.tmdl': noRefs }));
  chk(() => says(noRefNoDates) === 'Dates:missingEnd' && /^a relationship uses this table/.test(T.whyOf(noRefNoDates.skipped[0], 'en')), () => `R5. no ref lines, the relationship end Dates not read: missingEnd: ${J(noRefNoDates.skipped)}`);
  const noRefWhole = T.read(files([], { 'model.tmdl': noRefs }));
  chk(() => noRefWhole.skipped.length === 0, () => `R6. no ref lines (valid TMDL) and whole files: not flagged: ${says(noRefWhole)}`);
  const none = T.read(files(['tables/Dates.tmdl', 'tables/Orders.tmdl']));
  chk(() => says(none) === 'Orders:missingTable, Dates:missingTable', () => `R7. every table file missing: both named, in the model's order: ${says(none)}`);
  // names: quoted with a doubled quote, a space, and a case that differs from the definition (Power BI names ignore case)
  const QN = "Date 'Table'", qref = text['model.tmdl'].replace('ref table Dates', "ref table 'Date ''Table'''");
  const qrel = text['relationships.tmdl'].replace('toColumn: Dates.Date', "toColumn: 'Date ''Table'''.Date");
  const qtab = text['tables/Dates.tmdl'].replace(/^table Dates/m, "table 'Date ''Table'''");
  const qMissing = T.read(files(['tables/Dates.tmdl'], { 'model.tmdl': qref, 'relationships.tmdl': qrel }));
  chk(() => qMissing.skipped.length === 1 && qMissing.skipped[0].table === QN && qMissing.skipped[0].code === 'missingTable', () => `R8. a quoted name is unquoted as the parse reads it ("${QN}"), one entry: ${J(qMissing.skipped)}`);
  const qWhole = T.read(files(['tables/Dates.tmdl'], { 'model.tmdl': qref, 'relationships.tmdl': qrel, 'tables/Date Table.tmdl': qtab }));
  chk(() => qWhole.skipped.length === 0, () => `R9. the quoted table defined: nothing skipped: ${says(qWhole)}`);
  const cased = T.read(files([], { 'model.tmdl': text['model.tmdl'].replace('ref table Dates', 'ref table DATES'), 'relationships.tmdl': text['relationships.tmdl'].replace('Dates.Date', 'dates.Date') }));
  chk(() => cased.skipped.length === 0, () => `R10. the same name in another case is the same table: nothing skipped: ${says(cased)}`);
  // a table file that is there but could not be read is named once, as the file (AU47), never twice
  const empty = T.read(files([], { 'tables/Dates.tmdl': '' }));
  chk(() => says(empty) === 'definition/tables/Dates.tmdl:empty', () => `R11. Dates.tmdl empty: one entry, the file (no second entry for its table): ${says(empty)}`);
  // the model read is the same model as before: nothing taken out, nothing added
  chk(() => JSON.stringify(noDates.model) === JSON.stringify(T.fromFiles(files(['tables/Dates.tmdl']))), () => 'R12. read() gives the same model as fromFiles (only skipped grows)');
  // the name is metadata, never file text: nothing of Dates.tmdl or of the other files in the entry
  chk(() => !/DATATABLE|January|sourceColumn|lineageTag/.test(J(none.skipped)), () => `R13. skipped holds no file text: ${J(none.skipped)}`);
}

// ---------- G. R-81: every TMDL project in the repo ----------
{
  const tracked = execFileSync('git', ['ls-files', '-z', '*.tmdl'], { cwd: REPO, encoding: 'utf8' }).split('\0').filter(Boolean).filter((f) => !/TMDLScripts\//.test(f));
  const byModel = new Map();
  tracked.forEach((f) => { const k = f.indexOf('/definition/'); if (k < 0) return; const root = f.slice(0, k); (byModel.get(root) || byModel.set(root, []).get(root)).push(f); });
  const extra = [], diff = [];
  for (const [root, list] of byModel) {
    const fl = list.map((f) => ({ path: f.slice(root.length + 1), text: fs.readFileSync(path.join(REPO, f), 'utf8').replace(/^﻿/, '') }));
    const got = T.read(fl, { lineageTags: true });
    got.skipped.forEach((s) => extra.push(`${root}: ${s.table || s.path} ${s.code}`));
    const a = E.analyze(got.model, null).score.overall, b = E.analyze(T.fromFiles(fl, { lineageTags: true }), null).score.overall;
    if (a !== b) diff.push(`${root} ${b} -> ${a}`);
  }
  chk(() => byModel.size === 7 && extra.length === 0, () => `G1. the 7 TMDL projects in the repo give 0 skipped entries (${byModel.size} projects): ${extra.join('; ')}`);
  chk(() => diff.length === 0, () => `G2. 0 score differences: ${diff.join('; ')}`);
}

// ---------- W. the website's worker, in a vm ----------
const crc32 = (b) => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
// a stored (uncompressed) zip of [name, Buffer|string] in the order given
const zipOf = (entries) => {
  const parts = [], dir = []; let off = 0;
  for (const [name, d] of entries) {
    const data = Buffer.isBuffer(d) ? d : Buffer.from(d), nb = Buffer.from(name), crc = crc32(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(nb.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(nb.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, nb, data); dir.push(c, nb); off += 30 + nb.length + data.length;
  }
  const cd = Buffer.concat(dir), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(entries.length, 8); e.writeUInt16LE(entries.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, e]);
};
const worker = (min) => {
  const ctx = { console, TextDecoder, TextEncoder, Blob, Response, DecompressionStream, setTimeout, clearTimeout, Date, posted: [] };
  ctx.self = ctx; vm.createContext(ctx);
  ctx.importScripts = (...names) => names.forEach((n) => { const f = n.replace(/\?.*$/, ''); vm.runInContext(fs.readFileSync(path.join(JS, min ? f : f.replace(/\.min\.js$/, '.js')), 'utf8'), ctx, { filename: f }); });
  ctx.postMessage = (d) => ctx.posted.push(JSON.parse(JSON.stringify(d)));
  vm.runInContext(fs.readFileSync(path.join(JS, min ? 'model-health-worker.min.js' : 'model-health-worker.js'), 'utf8'), ctx, { filename: 'worker' });
  return ctx;
};
const W = { source: worker(false), min: worker(true) };
const run = async (w, buf, fileName) => {
  w.posted.length = 0;
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  await w.onmessage({ data: { buffer: ab, fileName } });
  return w.posted.find((m) => m.type === 'done' || m.type === 'error') || { type: 'none' };
};
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const project = (dir, under, skip = () => false) => walk(dir).filter((f) => !skip(f)).map((f) => [under + path.relative(dir, f).split(path.sep).join('/'), fs.readFileSync(f)]);
const plain = (skip) => project(SRC, '', skip);
for (const [label, w] of Object.entries(W)) {
  const whole = await run(w, zipOf(plain()), 'plain.zip');
  chk(() => whole.type === 'done' && whole.result.score.overall === 92 && !whole.result.unreadable && !whole.result.models, () => `W1 (${label}). guard: the whole project zipped scores 92, nothing unreadable, no models note: ${J(whole.result && whole.result.score)}`);
  const noDates = await run(w, zipOf(plain((f) => /Dates\.tmdl$/.test(f))), 'plain.zip');
  const u = noDates.result && noDates.result.unreadable;
  chk(() => noDates.type === 'done' && u && u.files.length === 1 && u.files[0].table === 'Dates' && /^1 model file\(s\) could not be read: Dates \(model\.tmdl names this table/.test(u.en) && /^تعذّرت قراءة 1 من ملفات النموذج: Dates \(/.test(u.ar), () => `W2 (${label}). without Dates.tmdl: unreadable names the table Dates, EN and AR (the page then gives no score): ${J(noDates.result ? noDates.result.unreadable : noDates)}`);
  const none = await run(w, zipOf(plain((f) => /tables[\\/]/.test(f))), 'plain.zip');
  chk(() => none.type === 'done' && none.result.unreadable && none.result.unreadable.files.map((x) => x.table).join() === 'Orders,Dates', () => `W3 (${label}). every table file missing: not NO_MODEL, both tables named: ${J(none.type === 'error' ? none : none.result.unreadable)}`);
}

// two models in one zip: health-project (model.bim, its report) and no-measures (TMDL, no report), and a decoy report
// of the second model (its definition.pbir points at Plain Orders): the model read is the first by folder path, said
// with the one not read, and only its own report is read; zip order never changes the answer
{
  const HP = path.join(HERE, 'fixtures/health-project'), REP = 'Health Test Report.Report';
  const health = project(HP, ''), report = health.filter(([n]) => n.startsWith(REP + '/'));
  // the decoy: the same report with one more page, connected to the other model
  const decoy = report.map(([n, b]) => [n.replace(REP, 'Plain Report.Report'), /definition\.pbir$/.test(n) ? Buffer.from(b.toString('utf8').replace('../Health Test.SemanticModel', '../Plain Orders.SemanticModel')) : b])
    .concat([['Plain Report.Report/definition/pages/zz/page.json', Buffer.from('{"name":"zz","displayName":"Extra","width":1280,"height":720}')]]);
  const alone = await run(W.source, zipOf(health), 'health.zip');
  const both = [...health, ...plain(), ...decoy];
  for (const [label, w] of Object.entries(W)) {
    const a = await run(w, zipOf(both), 'two.zip'), b = await run(w, zipOf(both.slice().reverse()), 'two.zip');
    const m = a.result && a.result.models;
    chk(() => a.type === 'done' && m && m.read === 'Health Test.SemanticModel' && J(m.notRead) === '["Plain Orders.SemanticModel"]' && m.report === 'read' && J(m.reports) === '["Health Test Report.Report"]', () => `W4 (${label}). two models: the one read and the one not read named, its own report read: ${J(m || a)}`);
    chk(() => m && /^This zip holds 2 semantic models: the check below read Health Test\.SemanticModel; not read: Plain Orders\.SemanticModel\./.test(m.en) && /^يحتوي ملف \u2068ZIP\u2069 هذا على نموذجين دلاليين: /.test(m.ar), () => `W5 (${label}). the sentence (EN; the Arabic approved by D-1112-05, 0.3.3 AR7, pinned word for word in ar7): ${J(m)}`);
    chk(() => b.type === 'done' && J(b.result.models) === J(m) && b.result.score.overall === a.result.score.overall, () => `W6 (${label}). the zip in the other order: the same named answer and score: ${J(b.result ? b.result.models : b)}`);
    chk(() => alone.type === 'done' && a.result.score.overall === alone.result.score.overall && a.result.stats.pages === alone.result.stats.pages && a.result.meta.hasReport, () => `W7 (${label}). the model read is whole: its score and pages as when zipped alone (${alone.result && alone.result.score.overall}, ${alone.result && alone.result.stats.pages} pages): ${a.result && a.result.score.overall}, ${a.result && a.result.stats.pages}`);
  }
  // no report can be told to be the model's (definition.pbir not readable, both models in the same folder): none read, said
  const unsure = [...health.filter(([n]) => !/definition\.pbir$/.test(n)), ...plain()];
  const u = await run(W.source, zipOf(unsure), 'two.zip'), um = u.result && u.result.models;
  chk(() => u.type === 'done' && um && um.report === 'notRead' && !u.result.meta.hasReport && /No report was read: none in the zip can be told to belong to Health Test\.SemanticModel\./.test(um.en), () => `W8. a report that can't be told to be the model's is not read, and that is said: ${J(um || u)}`);
  // projects in their own folders: the report beside the model read (same parent folder) is read without a definition.pbir
  const nested = [...unsure.filter(([n]) => !n.startsWith('Plain') && !/^(definition|database|model|relationships)/.test(n)).map(([n, b2]) => ['shopA/' + n, b2]), ...plain().map(([n, b2]) => ['shopB/' + n, b2])];
  const n2 = await run(W.source, zipOf(nested), 'two.zip'), nm = n2.result && n2.result.models;
  chk(() => n2.type === 'done' && nm && nm.read === 'shopA/Health Test.SemanticModel' && J(nm.notRead) === '["shopB/Plain Orders.SemanticModel"]' && nm.report === 'read' && J(nm.reports) === '["shopA/Health Test Report.Report"]' && n2.result.stats.pages === alone.result.stats.pages, () => `W9. projects in their own folders: the report in the model's folder is read: ${J(nm || n2)}`);
  // which folder is read is model-nearest.js's rule (CONTRACTS.md 1g): the model at the top wins over a deeper copy,
  // even when the copy's path sorts first ("Archive/" before "Health"); a sort of its own would read the copy
  const deeper = [...health, ...plain().map(([n, b2]) => ['Archive/' + n, b2])];
  const d = await run(W.min, zipOf(deeper), 'two.zip'), dm = d.result && d.result.models;
  chk(() => d.type === 'done' && dm && dm.read === 'Health Test.SemanticModel' && J(dm.notRead) === '["Archive/Plain Orders.SemanticModel"]' && d.result.score.overall === alone.result.score.overall, () => `W10. the model at the top is read, never the deeper copy (model-nearest.js): ${J(dm || d)}`);
  chk(() => /model-nearest\.min\.js\?v=/.test(fs.readFileSync(path.join(JS, 'model-health-worker.js'), 'utf8')) && /DAModelNearest\.nearest\(/.test(fs.readFileSync(path.join(JS, 'model-health-worker.js'), 'utf8')), () => 'W11. the worker reads model-nearest.js (importScripts and DAModelNearest.nearest), never a rule of its own');
}

// ---------- S. the real server ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-au1-')));
const put = (k, drop) => { fs.cpSync(SRC, path.join(ROOT, k), { recursive: true }); for (const d of drop) fs.rmSync(path.join(ROOT, k, MODEL, 'definition', d)); };
put('whole', []); put('nodates', ['tables/Dates.tmdl']); put('none', ['tables/Dates.tmdl', 'tables/Orders.tmdl']);
fs.mkdirSync(path.join(ROOT, 'none', MODEL, 'definition/tables'), { recursive: true });
const s = await serverClient(ROOT);
try {
  const h0 = await s.call('check_model_health', { path: 'whole' });
  chk(() => !h0.err && h0.j.score.overall === 92 && !('unreadable' in h0.j), () => `S0. guard: the whole model scores 92, nothing unreadable: ${J(h0.j || h0.t)}`);
  for (const k of ['nodates', 'none']) {
    const want = k === 'none' ? 'Orders,Dates' : 'Dates';
    const r = await s.call('read_model', { path: k }), h = await s.call('check_model_health', { path: k });
    const ru = r.j && r.j.unreadable, hu = h.j && h.j.unreadable;
    chk(() => !r.err && Object.keys(r.j)[0] === 'unreadable' && ru.skipped.map((x) => x.table).join() === want && /could not be read: (Orders \(model\.tmdl names this table.*; )?Dates \(model\.tmdl names this table/.test(ru.message) && ru.skipped.every((x) => x.file === undefined && /^model\.tmdl names this table/.test(x.why)), () => `S1-${k}. read_model: unreadable first, the table(s) ${want} named with why: ${J(r.j || r.t)}`);
    chk(() => !h.err && Object.keys(h.j)[0] === 'unreadable' && hu.skipped.map((x) => x.table).join() === want && h.j.score === undefined && /^No score/.test(h.j.scoreWithheld), () => `S2-${k}. check_model_health: unreadable first, no score: ${J(h.j || h.t)}`);
  }
  const p = await s.call('plan_layout', { path: 'nodates', layout: 'exec', lang: 'en' });
  chk(() => p.err && /could not be read: Dates \(model\.tmdl names this table/.test(p.t) && /Nothing was planned/.test(p.t), () => `S3. plan_layout refuses with the same message: ${J(p.t)}`);
} finally { await s.close(); }
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL script=test-0.3.3-au1.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  au1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  au1  ${checks} checks`);
