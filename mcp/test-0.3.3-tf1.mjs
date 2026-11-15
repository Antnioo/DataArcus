// TF1 (0.3.3): what the whole-0.3.3 laptop run found (test033, 15 Nov; the owner's D-1115-01).
//   Z  (test033 D10, BLOCKER) check_model_health and read_model on a zip of two semantic models, on the real server:
//      the model read is the website's choice (zip-models.js, shared), named before the score with the one not read;
//      only its own report is read; zip order never changes the answer; a zip of one model is unchanged
//   N  (test033 C) plan_layout's writesAfterGo names the report as it is written (its name, or the free name), no "<name>"
// Made-up projects only (mcp/fixtures/health-project, twin-project; mcp/test-models/no-measures).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { zipOf } from './fixtures/stored-zip.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), JS = path.join(REPO, 'assets/js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (x) => JSON.stringify(x === undefined ? null : x).slice(0, 500);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const project = (dir, under = '') => walk(dir).map((f) => [under + path.relative(dir, f).split(path.sep).join('/'), fs.readFileSync(f)]);

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tf1-')));
const s = await serverClient(ROOT, undefined, { timeoutMs: 30000 });
try {
  // ---------- Z. two semantic models in one zip ----------
  {
    const health = project(path.join(HERE, 'fixtures/health-project')), twin = project(path.join(HERE, 'fixtures/twin-project'));
    const put = (name, entries) => { fs.writeFileSync(path.join(ROOT, name), zipOf(entries)); return name; };
    const zips = { health: put('health.zip', health), twin: put('twin.zip', twin), twinFirst: put('twin-first.zip', [...twin, ...health]), healthFirst: put('health-first.zip', [...health, ...twin]) };
    const H = {}, R = {};
    for (const [k, z] of Object.entries(zips)) { H[k] = await s.call('check_model_health', { path: z }); R[k] = await s.call('read_model', { path: z }); }
    const ok = (x) => x && !x.err && x.j;
    chk(() => ok(H.health) && H.health.j.score.overall === 87 && H.health.j.stats.pages === 2 && !('models' in H.health.j) && ok(H.twin) && H.twin.j.score.overall === 94 && !('models' in H.twin.j),
      () => `Z0. guard: each project zipped alone, as before (87 with 2 pages, 94), no models note: ${J([H.health.j && H.health.j.score, H.twin.j && H.twin.j.score])}`);
    for (const k of ['twinFirst', 'healthFirst']) {
      const h = H[k].j, m = h && h.models;
      chk(() => ok(H[k]) && J(Object.keys(h).slice(0, 3)) === '["source","models","score"]', () => `Z1-${k}. check_model_health names the models before the score (keys source, models, score): ${J(h ? Object.keys(h) : H[k].t)}`);
      chk(() => m.read === 'Health Test.SemanticModel' && J(m.notRead) === '["Twin Sales.SemanticModel"]' && m.report === 'read' && J(m.reports) === '["Health Test Report.Report"]',
        () => `Z2-${k}. the model read (the first by folder path, zip-models.js) and the one not read; only its own report: ${J(m)}`);
      chk(() => /^This zip holds 2 semantic models: the check below read Health Test\.SemanticModel; not read: Twin Sales\.SemanticModel\. The report read is the one of Health Test\.SemanticModel \(Health Test Report\.Report\); the other models' reports were not read\. To check another model, zip its project folder alone\.$/.test(m.message),
        () => `Z3-${k}. the website's sentence, word for word: ${J(m && m.message)}`);
      chk(() => h.score.overall === H.health.j.score.overall && h.stats.tables === H.health.j.stats.tables && h.stats.pages === 2 && J(h.stats) === J(H.health.j.stats),
        () => `Z4-${k}. scored with its own tables and its own report only (87, 4 tables, 2 pages, as zipped alone): ${h && h.score.overall}, ${J(h && h.stats)}`);
      const r = R[k].j;
      chk(() => ok(R[k]) && Object.keys(r)[0] === 'models' && J(r.models) === J(m), () => `Z5-${k}. read_model names the models first, the same note: ${J(r ? Object.keys(r) : R[k].t)}`);
    }
    // (the zip's own file name is in source, the plan and the script names: the rest is compared)
    const core = (j) => JSON.stringify(j && { models: j.models, score: j.score, stats: j.stats, reportRead: j.reportRead, findings: j.findings });
    chk(() => core(H.twinFirst.j) === core(H.healthFirst.j), () => 'Z6. zip order never changes the answer: models, score, stats, reportRead and findings the same in both orders');
    // a model.bim project and a TMDL project, and a decoy report of the second (its definition.pbir points at it): the
    // server reads what the website reads (au1's zip), in both orders
    const plain = project(path.join(HERE, 'test-models/no-measures')), REP = 'Health Test Report.Report';
    const decoy = health.filter(([n]) => n.startsWith(REP + '/')).map(([n, b]) => [n.replace(REP, 'Plain Report.Report'), /definition\.pbir$/.test(n) ? Buffer.from(b.toString('utf8').replace('../Health Test.SemanticModel', '../Plain Orders.SemanticModel')) : b])
      .concat([['Plain Report.Report/definition/pages/zz/page.json', Buffer.from('{"name":"zz","displayName":"Extra","width":1280,"height":720}')]]);
    const mixed = [...health, ...plain, ...decoy];
    const a = await s.call('check_model_health', { path: put('mixed.zip', mixed) }), b = await s.call('check_model_health', { path: put('mixed-rev.zip', mixed.slice().reverse()) });
    chk(() => ok(a) && a.j.models.read === 'Health Test.SemanticModel' && J(a.j.models.notRead) === '["Plain Orders.SemanticModel"]' && J(a.j.models.reports) === '["Health Test Report.Report"]' && a.j.stats.pages === 2 && a.j.score.overall === 87 && ok(b) && core(b.j) === core(a.j),
      () => `Z7. a model.bim and a TMDL project with a decoy report: Health Test read with its own report only, both orders: ${J(a.j ? a.j.models : a.t)} ${J(b.j ? b.j.models : b.t)}`);
    // the TMDL model alone in a zip is read (zip-models.js chooses it, as on the website), never "No model in this file"
    const t = await s.call('check_model_health', { path: put('plain.zip', plain) });
    chk(() => ok(t) && t.j.score.overall === 92 && !('models' in t.j), () => `Z8. a TMDL project zipped alone is read as on the website (92): ${J(t.j ? t.j.score : t.t)}`);
    // one place: the worker and the MCP's reader both call zip-models.js; neither keeps a choice of its own
    const worker = fs.readFileSync(path.join(JS, 'model-health-worker.js'), 'utf8'), reader = fs.readFileSync(path.join(HERE, 'lib/model.mjs'), 'utf8');
    chk(() => /DAZipModels\.choose\(/.test(worker) && /ZipModels\.choose\(/.test(reader) && !/new Map\(\)[^\n]*folders|folders\.set\(/.test(worker + reader) && !/find\(\(\[n\]\) => \/\(\^\|\\\/\)model\\\.bim\$\/i\.test\(n\)\)/.test(reader),
      () => 'Z9. one place (D-1104-12): model-health-worker.js and mcp/lib/model.mjs both call zip-models.js choose; no folder map or first-model.bim pick of their own');
  }
  // ---------- N. plan_layout's writesAfterGo names the report (test033 C: name "Gulf Views", the line said "<name>") ----------
  {
    fs.cpSync(path.join(HERE, 'fixtures/health-project'), path.join(ROOT, 'views'), { recursive: true });
    const p = await s.call('plan_layout', { path: 'views', layout: 'exec', name: 'Gulf Views', lang: 'en' }), w = p.j && p.j.plan ? p.j.plan.writesAfterGo : null;
    chk(() => w && /^the report "Gulf Views\.Report" and its "Gulf Views\.pbip" /.test(w[0]) && !w.some((x) => x.includes('<name>')), () => `N1. writesAfterGo names the report as it is written ("Gulf Views.Report", "Gulf Views.pbip"), no "<name>": ${J(w || p.t)}`);
    // the name taken: the free name the write uses (the plan's own .pbip), as the approval page says
    fs.mkdirSync(path.join(ROOT, 'views', 'Gulf Views.Report'));
    const t = await s.call('plan_layout', { path: 'views', layout: 'exec', name: 'Gulf Views', lang: 'en' }), tw = t.j && t.j.plan ? t.j.plan.writesAfterGo : null;
    chk(() => tw && !tw.some((x) => x.includes('<name>')) && /^the report "Gulf Views - [^"]+\.Report" and its "Gulf Views - [^"]+\.pbip" /.test(tw[0]), () => `N2. the name taken: the free name the write uses (the plan's own .pbip, as the approval page says): ${J(tw || t.t)}`);
  }
} finally { await s.close(); }
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL script=test-0.3.3-tf1.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  tf1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  tf1  ${checks} checks`);
