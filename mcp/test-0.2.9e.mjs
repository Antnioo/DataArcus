import './test-env.mjs';
// 0.2.9 audit fixes, part 2, LAYER reading (the reviewer's routine "B6: rest of audit 1", 11 Oct 2026; the owner wants
// every audit finding fixed before the beta): A1-2, A1-4, A1-5, A1-6, A1-8, A1-9, A1-10, A1-14 and the reading items of
// the audit's "seen, not in scope" (the website's model.bim size cap, byName's folder read), written red first.
// Run alone (it starts the server itself): node test-0.2.9e.mjs   (npm test runs it too)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';
import { serverSource } from './test-source.mjs';   // (0.3.1 S9: the server's code is server.mjs, tools/ and the lib/ modules it shared)

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const src = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');
const Bind = require('../assets/js/pbip-bind.js'), Tmdl = require('../assets/js/tmdl-model.js');

export async function v029e({ call, check, ROOT }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 400) : (x.j ? JSON.stringify(x.j) : x.t).slice(0, 400));
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => Object.assign({ name, sourceColumn: name }, dataType ? { dataType } : {});
  const bim = (tables) => JSON.stringify({ compatibilityLevel: 1567, model: { tables } });
  const write = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof o === 'string' ? o : JSON.stringify(o, null, 2)); };
  const sales = () => [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Note')], measures: [{ name: 'Total', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }];
  // a project: M.SemanticModel and reports, each pointing at a model folder
  const project = (dir, reports) => {
    write(path.join(ROOT, dir, 'M.SemanticModel', 'model.bim'), bim(sales()));
    reports.forEach((r) => {
      const R = path.join(ROOT, dir, r.name + '.Report');
      write(path.join(R, 'definition.pbir'), { version: '4.0', datasetReference: { byPath: { path: '../' + (r.model || 'M') + '.SemanticModel' } } });
      write(path.join(R, 'definition', 'report.json'), {});
      write(path.join(R, 'definition', 'pages', 'p1', 'page.json'), { name: 'p1', displayName: 'P', width: 1920, height: 1080 });
      (r.files || []).forEach(([rel, body]) => write(path.join(R, rel), body));
    });
  };

  // ---------- A1-2: only the reports that point at this model (fixed with the checks branch; kept) ----------
  project('e2', [{ name: 'Mine' }, { name: 'Theirs', model: 'Other' }]);
  const h2 = await ask('check_model_health', { path: 'e2' }), rep2 = h2.j && h2.j.reports;
  chk(() => rep2 && JSON.stringify(rep2.counted) === '["Mine"]' && rep2.notCounted.some((x) => x.report === 'Theirs'), () => `A1-2. the health check counts only the reports of this model: ${short(h2)}`);

  // ---------- A1-4: a damaged report file is said (skipped), and the unused findings are partial ----------
  project('e4', [{ name: 'Mine', files: [['definition/pages/p1/visuals/v1/visual.json', '{ this is not json']] }]);
  const h4 = await ask('check_model_health', { path: 'e4' }), rep4 = h4.j && h4.j.reports;
  chk(() => rep4 && Array.isArray(rep4.skipped) && rep4.skipped.length === 1 && /visual\.json$/.test(rep4.skipped[0].file) && /not valid JSON/i.test(rep4.skipped[0].why) && /partial/i.test(rep4.partial || ''),
    () => `A1-4. a report file that could not be read is listed (skipped: file, why) and the answer says the unused findings are partial: ${short(h4)}`);

  // ---------- A1-5: one result for every route (a model.bim given as a file filters the hidden date tables too) ----------
  write(path.join(ROOT, 'e5', 'model.bim'), bim(sales().concat([{ name: 'LocalDateTable_0f1e', partitions: mp('L'), columns: [col('Date', 'dateTime')] }])));
  const r5 = await ask('read_model', { path: 'e5/model.bim' });
  chk(() => !r5.err && !/LocalDateTable/.test(r5.t) && r5.j.tables.length === 1, () => `A1-5. the file route leaves out Power BI's hidden date tables, as the folder route does: ${short(r5)}`);

  // ---------- A1-9 (and A1-5's keys): loadModel(path, { root }) from any caller, coded errors, data only ----------
  const M = await import(pathToFileURL(path.join(HERE, 'lib', 'model.mjs')).href);
  let viaFile = null, viaDir = null, coded = null;
  try { viaFile = M.loadModel('e5/model.bim', { root: ROOT }); viaDir = M.loadModel('e2', { root: ROOT }); } catch (e) { viaFile = viaFile || { err: String(e.message) }; }
  try { M.loadModel('no-such-model-anywhere', { root: ROOT }); } catch (e) { coded = e; }
  const keys = (o) => Object.keys(o || {}).sort().join(',');
  chk(() => viaFile && viaDir && !viaFile.err && keys(viaFile) === keys(viaDir) && viaFile.folder === null && viaFile.projectDir === null, () => `A1-5/A1-9. loadModel(path, { root }) works for any caller, and every route returns the same keys: file ${keys(viaFile)} ${viaFile && viaFile.err || ''} | folder ${keys(viaDir)}`);
  chk(() => coded && coded.code === 'NO_MODEL_NAMED' && Array.isArray(coded.data && coded.data.models), () => `A1-9. a reading error carries a code and its data (the tool words it): ${coded && coded.code} ${coded && coded.message}`);
  const missOld = await ask('read_model', { path: 'no-such-model-anywhere' });
  chk(() => missOld.err && /No model named "no-such-model-anywhere"/.test(missOld.t) && /Give read_model/.test(missOld.t), () => `A1-9. the tool still words it for the user, as before: ${short(missOld)}`);
  chk(() => !/Give read_model|read_model/.test(src('lib/model.mjs').replace(/^\s*\/\/.*$/gm, '')) && !/\btaken\b/.test(src('lib/model.mjs').replace(/^\s*\/\/.*$/gm, '')),
    () => 'A1-9. the reading block speaks as no tool (no "read_model" wording) and computes no free report names (taken: the writer side)');
  chk(() => /export function takenNames/.test(src('lib/report-names.mjs')), () => 'A1-9. the free report names: a function on the writer side (lib/report-names.mjs takenNames)');

  // ---------- A1-6: one type default, "unknown" ----------
  write(path.join(ROOT, 'e6', 'M.SemanticModel', 'model.bim'), bim(sales()));
  const r6 = await ask('read_model', { path: 'e6' }), cols6 = r6.j && r6.j.tables[0].columns;
  chk(() => cols6 && cols6.includes('Note (unknown)') && cols6.includes('Region (string)'), () => `A1-6. a model.bim column with no type reads as unknown, as in TMDL (never guessed as text): ${short(r6)}`);
  chk(() => Bind.fromTmsl({ model: { tables: [{ name: 'T', columns: [{ name: 'C' }] }] } })[0].columns[0].dataType === 'unknown', () => 'A1-6. the shared reader (website too) defaults a missing type to unknown');
  chk(() => !/dataType \|\| 'string'|c\.dataType \|\| 'string'/.test(serverSource() + src('lib/model.mjs')), () => 'A1-6. no tool or reader defaults a type to string');
  // column types read from Desktop reach both views
  let m6 = null; try { m6 = M.loadModel('e6', { root: ROOT }); M.applyColumnTypes(m6, { 'Sales[Note]': 'string' }); } catch (e) { m6 = null; }
  chk(() => m6.tables[0].columns.find((c) => c.name === 'Note').dataType === 'string' && M.modelOf(m6.tmsl).tables[0].columns.find((c) => c.name === 'Note').dataType === 'string',
    () => 'A1-6. applyColumnTypes fills the model JSON and the reader\'s tables alike');

  // ---------- A1-8: one TMDL parse; one modelOf ----------
  chk(() => typeof Bind.parseTmdl === 'undefined' && typeof Bind.relsOfTmdl === 'undefined', () => 'A1-8. pbip-bind has no TMDL parser of its own (parseTmdl, relsOfTmdl): one parse, tmdl-model.js');
  chk(() => /TmdlModel|tmdl-model/.test(src('../assets/js/pbip-bind.js')) && /tmdl-model\.min\.js/.test(src('../assets/js/theme-generator.js')), () => 'A1-8. the website reads a TMDL folder through tmdl-model.js (loaded with the picker)');
  chk(() => !/\(m\.tmsl && \(m\.tmsl\.model \|\| m\.tmsl\)\)|\(tmsl && \(tmsl\.model \|\| tmsl\)\)/.test(serverSource()) && /modelOf\(/.test(serverSource()), () => 'A1-8. one modelOf(tmsl) in place of the server\'s seven unwraps');
  const tm = Tmdl.fromFiles([{ path: 'definition/tables/T.tmdl', text: 'table T\n\tmeasure M = 1\n\t\tformatString: #,0\n\t\tdisplayFolder: F\n\n\tcolumn C\n\t\tdataType: string\n\t\tsortByColumn: N\n\n\tcolumn N\n\t\tdataType: int64\n' }]);
  const t8 = Bind.fromTmsl(tm)[0];
  chk(() => t8.columns[0].sortBy === 'N' && t8.measures[0].displayFolder === 'F' && t8.measures[0].formatString === '#,0', () => `A1-8. a TMDL table read once gives the picker's fields: ${JSON.stringify(t8)}`);

  // ---------- A1-10: model.mjs exports only reading ----------
  chk(() => !['Bind', 'Health', 'Pbip', 'Fix', 'Svg', 'Gulf'].some((k) => k in M), () => `A1-10. model.mjs exports only reading: ${Object.keys(M).filter((k) => ['Bind', 'Health', 'Pbip', 'Fix', 'Svg', 'Gulf'].includes(k))}`);

  // ---------- A1-14: no module state in tmdl-model.js ----------
  const tagged = 'table T\n\tlineageTag: abc\n\n\tcolumn C\n\t\tdataType: string\n\t\tlineageTag: def\n';
  const a14 = Tmdl.fromFiles([{ path: 'definition/tables/T.tmdl', text: tagged }], { lineageTags: true }), b14 = Tmdl.fromFiles([{ path: 'definition/tables/T.tmdl', text: tagged }]);
  chk(() => a14.model.tables[0].lineageTag === 'abc' && !b14.model.tables[0].lineageTag && !/let keepTags/.test(src('../assets/js/tmdl-model.js')), () => 'A1-14. the lineage-tag option is passed down, not kept in module state');

  // ---------- seen, not in scope (reading): the website's size caps; byName's folder read ----------
  const huge = { name: 'model.bim', size: 65 * 1024 * 1024, arrayBuffer: () => { throw new Error('read'); } };
  let e1 = null; try { await Bind.fromFile(huge, ''); } catch (e) { e1 = String(e.message); }
  chk(() => e1 === 'TOO_BIG', () => `seen. the website refuses a model.bim over 64 MB before reading it: ${e1}`);
  const bigTmdl = [{ name: 'T.tmdl', webkitRelativePath: 'P/M.SemanticModel/definition/tables/T.tmdl', size: 129 * 1024 * 1024, arrayBuffer: () => { throw new Error('read'); } }];
  let e2 = null; try { await Bind.fromFolder(bigTmdl); } catch (e) { e2 = String(e.message); }
  chk(() => e2 === 'TOO_BIG', () => `seen. the website refuses TMDL files over 128 MB together before reading them: ${e2}`);
  chk(() => /try \{ inner = fs\.readdirSync\(full\)|readdirSafe/.test(src('lib/model.mjs')), () => 'seen. byName reads each folder so that one unreadable folder does not fail the whole search');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029e-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await v029e({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029e  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029e  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
