// J14 (0.3, B-168): the exact artifact. plan_layout builds the report create_report will write (every page, the tooltip
// pages, page filters, display names, number formats, SVG measures) with the one build create_report uses, checks those
// bytes in memory (Microsoft's validator offline, the references to the model, the measured rules and the design lint)
// on every page, and binds their digest, the plan and the model's print to the approval. create_report then writes
// exactly the approved bytes, or nothing: a source changed since the go is refused with "make the plan again".
// Written red first on main d76703c (lib/artifact.mjs did not exist; plan_layout checked page 1 only).
//   node test-j14-exact.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++;
  if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x ? (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400)) : 'no answer');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
// the digest, computed here on its own (not the server's code): sha256 over the sorted lines "path NUL sha256(bytes) LF",
// the paths as the project has them ("R.Report/definition/...", "R.pbip")
const digestOfDisk = (dir, base) => sha(tree(path.join(dir, base + '.Report')).concat([path.join(dir, base + '.pbip')])
  .map((f) => path.relative(dir, f).split(path.sep).join('/') + '\0' + sha(fs.readFileSync(f)) + '\n').sort().join(''));

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-j14-'));
process.env.DATAARCUS_ROOT = ROOT;
const cp = (from, to) => fs.cpSync(path.join(REPO, from), path.join(ROOT, to), { recursive: true });
cp('mcp/test-models/arabic-long-names', 'arabic'); cp('mcp/fixtures/health-project', 'health');
cp('mcp/test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');
cp('scripts/tests/fixtures/model-health/tmdl-ramadan/definition', 'ramadan/Ramadan Test.SemanticModel/definition');
fs.writeFileSync(path.join(ROOT, 'ramadan/Ramadan Test.SemanticModel/definition.pbism'), '{ "version": "4.0", "settings": {} }');
// the tiny model: sales by region and month, an Arabic column, a measure whose format is a DAX expression (dynamic)
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const MODEL = path.join(ROOT, 'tiny/Tiny.SemanticModel/model.bim');
fs.mkdirSync(path.dirname(MODEL), { recursive: true });
const bim = { compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('المنطقة', 'string'), col('Product', 'string'), col('Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' },
      { name: 'Margin', expression: 'SUM ( Sales[Amount] ) - SUM ( Sales[Cost] )', formatString: '#,0', formatStringDefinition: { expression: 'IF ( ABS ( SELECTEDMEASURE () ) >= 1000000, "#,0.0,,\\"M\\"", "#,0" )' } }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), col('Month Name', 'string'), Object.assign(col('Month Number', 'int64'), {})] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } };
bim.model.tables[1].columns[1].sortByColumn = 'Month Number';
fs.writeFileSync(MODEL, JSON.stringify(bim));
const PROJECT = path.join(ROOT, 'tiny');

const s = await serverClient(ROOT, {});
const ask = async (srv, name, args) => { try { return await srv.call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[المنطقة]', category2: 'Sales[Product]', table: ['Sales[المنطقة]', 'Sales[Product]', 'Sales[Total Sales]', 'Sales[Margin]'], slicers: ['Sales[Product]'] };
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Orders]': 'الطلبات', 'Sales[Margin]': 'الهامش', 'Sales[Product]': 'المنتج' };
const INPUTS = { path: 'tiny', name: 'Tiny AR', layout: 'analysis', kpis: 3, filters: 'start', lang: 'ar', displayNames: AR_NAMES, pageFilters: [{ field: 'Sales[Region]', values: ['North'] }], secondPage: true };

// ---- E-1 to E-5: every page is checked, on the bytes create_report writes ----
const before = tree(ROOT).length;
const pl = await ask(s, 'plan_layout', Object.assign({}, INPUTS, { planFields: FIELDS }));
const ex = pl.j && pl.j.exactCheck;
chk(() => pl.j && pl.j.plan && pl.j.plan.planId, () => `E-1 the plan of the tiny Arabic model gets a plan id: ${short(pl)}`);
chk(() => ex && ex.status === 'pass', () => `E-2 the plan's exact check passes (status pass): ${JSON.stringify(ex || null).slice(0, 600)}`);
chk(() => ex && ex.pages >= 3 && ex.tooltipPages >= 1 && ex.pages === ex.checkedPages, () => `E-3 every page is checked, the tooltip pages too (2 report pages + tooltip pages): ${JSON.stringify(ex || null).slice(0, 300)}`);
chk(() => ex && ex.checks && ex.checks.validator && ex.checks.validator.ran === true && ex.checks.validator.errors === 0 && ex.checks.references.ran === true && ex.checks.references.unresolved === 0 && ex.checks.rules.ran > 0 && ex.checks.lint.ran === true,
  () => `E-4 the validator (offline), the references, the measured rules and the lint all ran, 0 validator errors: ${JSON.stringify(ex && ex.checks || null).slice(0, 400)}`);
chk(() => tree(ROOT).length === before, () => `E-5 nothing is written before approval (files under the working folder ${before} -> ${tree(ROOT).length})`);
// (5) counts, rule ids and relative paths only: no model or report text in the check's answer
const exText = JSON.stringify(ex || {});
chk(() => ex && !/Total Sales|Margin|المنطقة|إجمالي|الهامش|North|Region|Tiny AR/.test(exText) && /^[0-9a-f]{64}$/.test(ex.digest), () => `E-6 the exact check returns counts, rule ids, relative paths and a digest only, no source text: ${exText.slice(0, 400)}`);

// ---- E-7 to E-12: create_report writes exactly the approved bytes ----
const id = pl.j && pl.j.plan && pl.j.plan.planId;
const pl2 = await ask(s, 'plan_layout', Object.assign({}, INPUTS, { planFields: FIELDS }));
chk(() => pl2.j.exactCheck.digest !== ex.digest, () => `E-7 two builds of the same plan differ (each build draws new random ids), so a write that rebuilt could not match: ${pl2.j && pl2.j.exactCheck && pl2.j.exactCheck.digest} vs ${ex && ex.digest}`);
await ask(s, 'approve_plan', { planId: id });
const cr = await ask(s, 'create_report', Object.assign({}, INPUTS, { fields: FIELDS, planId: id, design: pl.j && pl.j.design }));
chk(() => cr.j && cr.j.report, () => `E-8 create_report writes the approved plan: ${short(cr)}`);
const base = cr.j && cr.j.report ? cr.j.report.replace(/\.Report$/, '') : 'Tiny AR';
const written = fs.existsSync(path.join(PROJECT, base + '.pbip')) ? digestOfDisk(PROJECT, base) : null;
chk(() => written === ex.digest, () => `E-9 the written files' hashes are the approved digest exactly (random ids identical between plan and write): written ${written}, approved ${ex && ex.digest}`);
chk(() => cr.j.exact && cr.j.exact.digest === ex.digest && cr.j.exact.status === 'pass', () => `E-10 create_report's answer names the approved digest and the check's status: ${JSON.stringify(cr.j && cr.j.exact || null)}`);
// what the check covered is what was written: Arabic names, the dynamic format's measure, the tooltip page, the page filter
const files = tree(path.join(PROJECT, base + '.Report')), all = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const pageJsons = files.filter((f) => /page\.json$/.test(f)).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
chk(() => all.includes('إجمالي المبيعات') && all.includes('"Margin"') && pageJsons.some((p) => p.type === 'Tooltip') && pageJsons.filter((p) => p.type !== 'Tooltip').every((p) => /"Region"/.test(JSON.stringify(p.filterConfig || {}))),
  () => `E-11 the written report holds the Arabic display names, the dynamic-format measure, a tooltip page and the page filter on every page (${pageJsons.length} pages)`);
chk(() => ex.pages === pageJsons.length, () => `E-12 the plan checked as many pages as were written: ${ex && ex.pages} vs ${pageJsons.length}`);

// ---- E-13, E-14: a source changed after approval => zero writes ----
const pl3 = await ask(s, 'plan_layout', Object.assign({}, INPUTS, { name: 'Tiny Changed', planFields: FIELDS }));
const id3 = pl3.j && pl3.j.plan && pl3.j.plan.planId;
await ask(s, 'approve_plan', { planId: id3 });
const changed = JSON.parse(JSON.stringify(bim)); changed.model.tables[0].measures.push({ name: 'Added Later', expression: '1' });
fs.writeFileSync(MODEL, JSON.stringify(changed));
const n3 = tree(ROOT).length;
const cr3 = await ask(s, 'create_report', Object.assign({}, INPUTS, { name: 'Tiny Changed', fields: FIELDS, planId: id3, design: pl3.j && pl3.j.design }));
chk(() => cr3.err && /make the plan again/i.test(cr3.t) && /Nothing was written/.test(cr3.t), () => `E-13 the model changed after the go: refused with "make the plan again": ${short(cr3)}`);
chk(() => tree(ROOT).length === n3 && !fs.existsSync(path.join(PROJECT, 'Tiny Changed.pbip')), () => `E-14 zero writes after the refusal (${n3} -> ${tree(ROOT).length})`);
fs.writeFileSync(MODEL, JSON.stringify(bim));

// ---- E-15, E-16: a check that could not run makes the result incomplete, never green ----
const sk = await serverClient(ROOT, { DATAARCUS_TEST_CHECK_SKIP: 'validator' });
const pl4 = await ask(sk, 'plan_layout', Object.assign({}, INPUTS, { name: 'Tiny Skipped', planFields: FIELDS }));
const ex4 = pl4.j && pl4.j.exactCheck;
chk(() => ex4 && ex4.status === 'incomplete' && (ex4.notRun || []).some((x) => x.check === 'validator') && ex4.checks.validator.ran === false, () => `E-15 a skipped validation makes the plan's check incomplete: ${JSON.stringify(ex4 || null).slice(0, 400)}`);
chk(() => ex4 && /not every check/i.test(ex4.sayInPlan || ''), () => `E-16 an incomplete check is said in the plan: ${ex4 && ex4.sayInPlan}`);
await sk.close();

// ---- E-17 to E-20: the checker on its own (lib/artifact.mjs), on the written bytes ----
let A = null; try { A = await import('./lib/artifact.mjs'); } catch (e) { A = null; }
const { loadModel } = await import('./lib/model.mjs');
const tables = loadModel('tiny').tables;
const memFiles = tree(path.join(PROJECT, base + '.Report')).concat([path.join(PROJECT, base + '.pbip')]).map((f) => ({ path: path.relative(PROJECT, f).split(path.sep).join('/'), data: fs.readFileSync(f) }));
chk(() => A && A.digestOf(memFiles) === ex.digest, () => 'E-17 lib/artifact.mjs digestOf gives the approved digest on the written bytes');
// a 2-page plan whose page 2 has an unresolved measure: BLOCKED (page 1 alone, as plan_layout's lint read it, passes)
const pageDirs = [...new Set(memFiles.map((f) => (/\.Report\/definition\/pages\/([^/]+)\//.exec(f.path) || [])[1]).filter(Boolean))];
const order = (() => { try { return JSON.parse(memFiles.find((f) => /pages\/pages\.json$/.test(f.path)).data).pageOrder; } catch (e) { return pageDirs; } })();
const p2 = order[1], ghost = memFiles.map((f) => {
  if (!(new RegExp(`/pages/${p2}/visuals/[^/]+/visual\\.json$`).test(f.path))) return f;
  const t = f.data.toString('utf8'); if (!/"Property"\s*:\s*"Total Sales"/.test(t)) return f;
  return { path: f.path, data: Buffer.from(t.replace(/("Property"\s*:\s*)"Total Sales"/g, '$1"Ghost Measure"')) };
});
chk(() => ghost.some((f, i) => f !== memFiles[i]), () => 'E-18 the test fixture: a visual on page 2 names [Total Sales] (it is replaced by an unknown measure)');
const g = A ? await A.checkArtifact(ghost, tables, 'ar') : null;
chk(() => g && g.status === 'blocked' && g.blocking.some((b) => b.rule === 'REF_UNRESOLVED' && b.file.includes(`/pages/${p2}/`)) && !g.blocking.some((b) => b.file.includes(`/pages/${order[0]}/`)),
  () => `E-19 page 2's unresolved measure blocks the check (rule REF_UNRESOLVED, the page 2 file): ${JSON.stringify(g || null).slice(0, 500)}`);
const big = memFiles.concat([{ path: base + '.Report/StaticResources/RegisteredResources/big.png', data: Buffer.alloc(8 * 1024 * 1024 + 1) }]);
const gb = A ? await A.checkArtifact(big, tables, 'ar') : null;
chk(() => gb && gb.status === 'incomplete' && gb.notRun.some((x) => x.check === 'validator'), () => `E-20 a file over the cap skips the validator: incomplete, never pass: ${JSON.stringify(gb || null).slice(0, 300)}`);
const gs = A ? await A.checkArtifact(memFiles, tables, 'ar', { skip: ['references'] }) : null;
chk(() => gs && gs.status === 'incomplete', () => `E-21 a skipped reference check: incomplete: ${JSON.stringify(gs || null).slice(0, 200)}`);

// ---- E-22: the golden models: the exact check passes, 0 validator errors ----
const GOLDEN = [['arabic', { lang: 'ar', layout: 'exec', kpis: 4 }], ['health', { lang: 'en', layout: 'analysis', kpis: 4, filters: 'end' }], ['large', { lang: 'en', layout: 'ops', kpis: 4, focus: 'logistics' }], ['ramadan', { lang: 'en', layout: 'focus', kpis: 3, filters: 'top' }]];
for (const [p, o] of GOLDEN) {
  const r = await ask(s, 'plan_layout', Object.assign({ path: p, name: 'Golden ' + p }, o)), e = r.j && r.j.exactCheck;
  chk(() => r.j.plan.planId && e.status === 'pass' && e.checks.validator.errors === 0 && e.pages === e.checkedPages, () => `E-22 ${p}: the exact check passes with 0 validator errors on every page: ${JSON.stringify(e || null).slice(0, 400)}`);
}

await s.close();
fs.rmSync(ROOT, { recursive: true, force: true });
console.log(problems.length ? `FAIL  j14  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  j14  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
