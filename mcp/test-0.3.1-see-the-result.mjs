// S2 (20 Oct 2026, "see the result" v1, mcp/research/SEE-THE-RESULT.md "S2: the v1"; written red first): render_report,
// behind DATAARCUS_EXPERIMENTAL_RENDER=1. Made-up models and the repo's fixtures only.
//   L   lib/shadow-model.mjs daxLiterals: the measures, calculated columns and calculation items whose DAX holds a
//       constant (a number other than 0/1, a text other than "" or a format pattern), counted, never quoted
//   ST  literals 'stub': each listed constant replaced by a made-up one (digit count and sign kept), the rest of the DAX
//       byte for byte; 'keep' and the default keep them
//   MG  amounts sized by the format string (a column's own, else a measure's that sums it), and by magnitude
//   SH  renderProject (the DAX form the driver opens): every column declared with its type, relationships and measures
//       kept, the report pointed at the shadow, the first page to capture active; Microsoft's validator 0 errors and
//       check_report 0 "can break" on the shadow project (the twin's own report; the Arabic fixture's planned report)
//   D   lib/desktop-render.mjs on a FAKE Desktop (fixtures/fake-desktop-helper.mjs, the PowerShell helper's protocol):
//       open, pid, window, captures until two in a row match, a page switch and a capture a page, close by pid, temp
//       folder deleted (on an error too); refuses on a dialog, on the user's own Desktop in front, off Windows
//   T   the server: the tool hidden without the switch (11 tools, instructions unchanged); with it: refused off Windows,
//       the literal choice asked first (Desktop not started), images a page with the boxes and what they can't tell
//   node test-0.3.1-see-the-result.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const Tmdl = req('../assets/js/tmdl-model.js');
const exprOf = (e) => (Array.isArray(e) ? e.join('\n') : String(e == null ? '' : e));
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-s2-'));
process.env.DATAARCUS_ROOT = ROOT;
let S = null, D = null;
try { S = await import('./lib/shadow-model.mjs'); } catch (e) { S = null; }
try { D = await import('./lib/desktop-render.mjs'); } catch (e) { D = null; }
chk(() => S && typeof S.daxLiterals === 'function' && typeof S.renderProject === 'function', () => 'L-0. lib/shadow-model.mjs exports daxLiterals and renderProject');
chk(() => D && typeof D.render === 'function' && typeof D.helperCommand === 'function' && typeof D.scoreRender === 'function', () => 'D-0. lib/desktop-render.mjs exports render, helperCommand and scoreRender');

// the DATATABLE of a table in the DAX form: header [[name, TYPE]] and rows of raw literals
function readDataTable(expr) {
  const e = String(expr), head = [...e.slice(0, e.indexOf('{')).matchAll(/"((?:[^"]|"")*)"\s*,\s*([A-Z]+)/g)].map((m) => [m[1].replace(/""/g, '"'), m[2]]);
  const rows = [...e.slice(e.indexOf('{') + 1).matchAll(/\{([^{}]*)\}/g)].map((m) => [...m[1].matchAll(/"((?:[^"]|"")*)"|(-?\d+(?:\.\d+)?)|\b(TRUE|FALSE)\b|BLANK \(\)/g)].map((v) => (v[1] != null ? v[1] : v[2] != null ? +v[2] : v[3] != null ? v[3] : null)));
  return { head, rows };
}
const shadowBack = (sh) => Tmdl.fromFiles(sh.files.filter((f) => /\.tmdl$/.test(f.path)).map((f) => ({ path: f.path.replace(/^[^/]*\.SemanticModel\//, ''), text: f.text }))).model;
const colRows = (back, table, column) => { const t = back.tables.find((x) => x.name === table), dt = readDataTable(exprOf(t.partitions[0].source.expression)), k = dt.head.findIndex((h) => h[0] === column); return k < 0 ? null : dt.rows.map((r) => r[k]); };

// ---------- the made-up model with constants in its DAX ----------
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const made = { model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double', { formatString: '#,0,,"M"' }), col('Cost', 'double'), col('Plain Amount', 'double'), col('Big', 'double', { formatString: '#,0.0,,,"B"' }),
    col('Units', 'int64'), col('Margin %', 'double', { formatString: '0.0%' }), col('Region', 'string'), col('Date', 'dateTime'),
    { name: 'Tier', type: 'calculated', dataType: 'string', expression: 'IF ( Sales[Amount] > 250, "Gold", "Std" )' }],
  measures: [
    { name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' },
    { name: 'Target', expression: '5000000', formatString: '#,0' },
    { name: 'Label', expression: 'SWITCH ( SELECTEDVALUE ( Sales[Region] ), "North", "Customer X", "Other" )' },
    { name: 'Ratio', expression: 'DIVIDE ( [Total Sales], [Target], 0 ) + 1' },
    { name: 'Pretty', expression: 'FORMAT ( [Total Sales], "#,0.0" ) & " - " & FORMAT ( TODAY (), "dd MMM yyyy" )' },
    { name: 'Commented', expression: ['SUM ( Sales[Units] ) // 2024 budget 777', '/* "Secret" 42 */'] },
    { name: 'Cols', expression: "CALCULATE ( SUM ( 'Year 2024'[Value 99] ) ) + LOG10 ( [Total Sales] )" },
    { name: 'Cost M', expression: 'SUM ( Sales[Cost] )', formatString: '#,0,,"M"' },
    { name: 'Growth', expression: '[Total Sales] * 1.05' },
    { name: 'Empty', expression: 'IF ( [Total Sales] > 0, "", "none" )' }] },
  { name: 'Time Calc', calculationGroup: { precedence: 1, calculationItems: [{ name: 'YTD', expression: 'CALCULATE ( SELECTEDMEASURE (), DATESYTD ( Sales[Date], "6/30" ) )' }, { name: 'Current', expression: 'SELECTEDMEASURE ()' }] },
    columns: [col('Time Calc', 'string')], partitions: [{ name: 'Time Calc', mode: 'import', source: { type: 'calculationGroup' } }] },
  { name: 'Pick', columns: [
    { name: 'Pick', type: 'calculatedTableColumn', dataType: 'string', sourceColumn: '[Value1]', sortByColumn: 'Pick Order', relatedColumnDetails: { groupByColumns: [{ groupingColumn: 'Pick Fields' }] } },
    { name: 'Pick Fields', type: 'calculatedTableColumn', dataType: 'string', sourceColumn: '[Value2]', isHidden: true, extendedProperties: [{ type: 'json', name: 'ParameterMetadata', value: { version: 3, kind: 2 } }] },
    { name: 'Pick Order', type: 'calculatedTableColumn', dataType: 'int64', sourceColumn: '[Value3]', isHidden: true }],
  partitions: [{ name: 'Pick', mode: 'import', source: { type: 'calculated', expression: '{ ("Total Sales", NAMEOF(\'Sales\'[Total Sales]), 0), ("Growth", NAMEOF(\'Sales\'[Growth]), 1) }' } }] }] } };
const SECRETS = ['5000000', 'Customer X', 'North', 'Gold', '6/30', '1.05', '"none"'];

// ---------- L: the DAX literals ----------
let lits = null;
if (S) {
  chk(() => { lits = S.daxLiterals(made); return Array.isArray(lits); }, () => 'L-1. daxLiterals gives a list');
  if (lits) {
    const key = (x) => `${x.table}|${x.name}|${x.kind}|${x.numbers}|${x.texts}`;
    const want = ['Sales|Target|measure|1|0', 'Sales|Label|measure|0|3', 'Sales|Growth|measure|1|0', 'Sales|Empty|measure|0|1', 'Sales|Tier|column|1|2', 'Time Calc|YTD|calculationItem|0|1'];
    chk(() => JSON.stringify(lits.map(key).sort()) === JSON.stringify(want.slice().sort()), () => `L-2. exactly the measures, calculated columns and calculation items with a constant, counted: ${JSON.stringify(lits.map(key))}`);
    chk(() => !lits.some((x) => ['Total Sales', 'Ratio', 'Pretty', 'Commented', 'Cols', 'Cost M', 'Current', 'Pick'].includes(x.name)), () => 'L-3. no constant: 0 and 1, "", a format pattern, a comment, a name with digits ([Value 99], \'Year 2024\', LOG10), a field parameter\'s names');
    chk(() => { const j = JSON.stringify(lits); return SECRETS.every((s) => !j.includes(s.replace(/"/g, ''))) && !/250|777|42|Std|Other/.test(j); }, () => `L-4. the list never holds a constant's value: ${JSON.stringify(lits)}`);
  }
}

// ---------- ST: the opt-in replacement ----------
if (S) {
  let stub = null, keep = null, dflt = null;
  chk(() => { stub = S.shadowModel(made, { form: 'dax', literals: 'stub' }); keep = S.shadowModel(made, { form: 'dax', literals: 'keep' }); dflt = S.shadowModel(made, { form: 'dax' }); return stub && keep && dflt; }, () => 'ST-1. shadowModel takes literals stub and keep');
  if (stub && keep && dflt) {
    const all = (sh) => sh.files.map((f) => f.text).join('\n');
    const sTxt = all(stub), back = shadowBack(stub), kBack = shadowBack(keep);
    chk(() => SECRETS.every((s) => !sTxt.includes(s.startsWith('"') ? s : '"' + s + '"') && !(s === '5000000' && sTxt.includes(s)) && !(s === '1.05' && sTxt.includes(s))) && !/> 250,/.test(sTxt), () => `ST-2. stub: none of the model's constants is in the copy: ${SECRETS.filter((s) => sTxt.includes(s))}`);
    const m = (b, t, n) => { const tb = b.tables.find((x) => x.name === t); return exprOf(((tb.measures || []).find((x) => x.name === n) || (tb.columns || []).find((x) => x.name === n) || {}).expression).trim(); };
    chk(() => /^\d{7}$/.test(m(back, 'Sales', 'Target')) && m(back, 'Sales', 'Target') !== '5000000', () => `ST-3. a number keeps its digit count: Target = ${m(back, 'Sales', 'Target')}`);
    chk(() => /^\[Total Sales\] \* \d\.\d\d$/.test(m(back, 'Sales', 'Growth')) && !/\* [01]\.00$/.test(m(back, 'Sales', 'Growth')), () => `ST-3. a decimal keeps its digits: Growth = ${m(back, 'Sales', 'Growth')}`);
    chk(() => /^IF \( Sales\[Amount\] > \d{3}, "[^"]+", "[^"]+" \)$/.test(m(back, 'Sales', 'Tier')), () => `ST-3. a calculated column's constants replaced, its shape kept: ${m(back, 'Sales', 'Tier')}`);
    chk(() => /^IF \( \[Total Sales\] > 0, "", "[^"]+" \)$/.test(m(back, 'Sales', 'Empty')), () => `ST-3. 0 and "" are kept: ${m(back, 'Sales', 'Empty')}`);
    chk(() => ['Total Sales', 'Ratio', 'Pretty', 'Commented', 'Cols', 'Cost M'].every((n) => m(back, 'Sales', n) === m(kBack, 'Sales', n) && m(kBack, 'Sales', n) === exprOf(made.model.tables[0].measures.find((x) => x.name === n).expression).trim()), () => 'ST-4. stub: a measure without a constant is byte for byte the model\'s');
    chk(() => m(kBack, 'Sales', 'Target') === '5000000' && m(shadowBack(dflt), 'Sales', 'Target') === '5000000' && /"Customer X"/.test(all(keep)), () => 'ST-5. keep (and no choice) keeps the constants');
    chk(() => !/"6\/30"/.test(sTxt) && /DATESYTD \( Sales\[Date\], "[^"]+" \)/.test(sTxt), () => 'ST-6. a calculation item\'s constant replaced too');
    chk(() => /NAMEOF\('Sales'\[Total Sales\]\)/.test(sTxt) && /\("Growth"/.test(sTxt), () => 'ST-7. a field parameter keeps its names (they are names, not constants)');
    chk(() => (stub.notes || []).some((n) => /replaced/.test(n) && /6/.test(n)), () => `ST-8. the notes say how many were replaced: ${JSON.stringify(stub.notes)}`);
    chk(() => JSON.stringify(S.shadowModel(made, { form: 'dax', literals: 'stub' }).files) === JSON.stringify(stub.files), () => 'ST-9. the replacement is the same on every run (seeded by the names)');
  }
}

// ---------- MG: magnitude by format string ----------
if (S) {
  let a = null, b = null;
  chk(() => { a = shadowBack(S.shadowModel(made, { form: 'dax' })); b = shadowBack(S.shadowModel(made, { form: 'dax', magnitude: 'millions' })); return a && b; }, () => 'MG-1. shadowModel takes magnitude');
  if (a && b) {
    const v = (bk, c) => colRows(bk, 'Sales', c) || [];
    const mx = (xs) => Math.max(...xs), mn = (xs) => Math.min(...xs);
    chk(() => mn(v(a, 'Amount')) >= 1e4 && mx(v(a, 'Amount')) >= 1e6 && mx(v(a, 'Amount')) < 1e8, () => `MG-2. a column formatted in millions gets amounts in millions: ${mn(v(a, 'Amount'))}..${mx(v(a, 'Amount'))}`);
    chk(() => mx(v(a, 'Big')) >= 1e9 && mx(v(a, 'Big')) < 1e11, () => `MG-2. billions: ${mx(v(a, 'Big'))}`);
    chk(() => mx(v(a, 'Cost')) >= 1e6, () => `MG-3. a measure formatted in millions sizes the column it sums: ${mx(v(a, 'Cost'))}`);
    chk(() => mx(v(a, 'Plain Amount')) <= 5000 && mx(v(a, 'Margin %')) <= 1 && mx(v(a, 'Units')) <= 100, () => 'MG-4. no unit: amounts as before; rates 0-1; whole numbers as before');
    chk(() => mx(v(b, 'Plain Amount')) >= 1e6 && mx(v(b, 'Margin %')) <= 1 && JSON.stringify(v(b, 'Amount')) === JSON.stringify(v(a, 'Amount')), () => `MG-5. magnitude millions sizes the amounts without a unit, not rates, not a column with its own: ${mx(v(b, 'Plain Amount'))}`);
    chk(() => JSON.stringify(v(b, 'Region')) === JSON.stringify(v(a, 'Region')) && v(b, 'Region').length === v(a, 'Region').length, () => 'MG-6. nothing else changes (the same rows, the same labels)');
  }
}

// ---------- the fixtures ----------
const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
cp('fixtures/twin-project', 'twin'); cp('test-models/arabic-long-names', 'arabic');
const filesOf = (dir) => { const out = []; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else out.push({ path: path.relative(dir, f).split(path.sep).join('/'), data: fs.readFileSync(f) }); }); rec(dir); return out; };
const { loadModel } = await import('./lib/model.mjs');
const twin = loadModel('twin', { root: ROOT }), arabic = loadModel('arabic', { root: ROOT });
const twinReport = filesOf(path.join(ROOT, 'twin', 'Twin Sales.Report'));
let arabicReport = null;
{
  const { plannedReport } = await import('./lib/plan-lint.mjs'), { planLayout } = await import('./lib/design.mjs');
  const built = plannedReport({ m: arabic, tables: arabic.tables, design: planLayout({ layout: 'exec', lang: 'ar' }).design, lang: 'ar' }, { second: true, title: 'تقرير' });
  arabicReport = built.files.filter((f) => /^[^/]+\.Report\//.test(f.path)).map((f) => ({ path: f.path.replace(/^[^/]+\.Report\//, ''), data: f.data }));
}

// ---------- SH: the project the driver opens ----------
const DT = { int64: 'INTEGER', double: 'DOUBLE', decimal: 'CURRENCY', dateTime: 'DATETIME', string: 'STRING', boolean: 'BOOLEAN' };
const projects = {};
if (S) {
  const { checkReport } = await import('./lib/check-report.mjs');
  for (const [label, m, rep, pages] of [['twin', twin, twinReport, null], ['arabic', arabic, arabicReport, [2]]]) {
    let pj = null;
    chk(() => { pj = S.renderProject(m.tmsl, rep, { name: 'Render ' + label, literals: 'keep', pages }); return pj && Array.isArray(pj.files) && Array.isArray(pj.pages); }, () => `SH-1 ${label}. renderProject gives the files and the pages to capture`);
    if (!pj) continue;
    projects[label] = pj;
    const src = m.tmsl.model || m.tmsl, back = shadowBack({ files: pj.files.filter((f) => /\.SemanticModel\//.test(f.path)) });
    const bad = [];
    back.tables.forEach((t) => {
      const part = (t.partitions || [])[0], e = exprOf(part && part.source && part.source.expression);
      if (!/^\s*DATATABLE\s*\(/.test(e)) return;
      const { head } = readDataTable(e), st = src.tables.find((x) => x.name === t.name);
      head.forEach(([n, ty]) => { const c = st.columns.find((x) => x.name === n), g = (pj.guessed || []).find((x) => x.table === t.name && x.column === n);
        const want = c && DT[c.dataType] ? DT[c.dataType] : g ? DT[g.as] : null;
        if (ty !== want) bad.push(`${t.name}[${n}] ${c && c.dataType} declared ${ty}`); });
    });
    chk(() => back.tables.length === src.tables.length && back.tables.some((t) => /DATATABLE/.test(exprOf(((t.partitions || [])[0] || { source: {} }).source.expression))), () => `SH-2 ${label}. the DAX form: a DATATABLE a table`);
    chk(() => !bad.length, () => `SH-2 ${label}. every column declared with its type, no number, date or true/false as STRING: ${bad.slice(0, 4).join('; ')}`);
    const rk = (r) => [r.fromTable, r.fromColumn, r.toTable, r.toColumn, r.fromCardinality || 'many', r.toCardinality || 'one', r.crossFilteringBehavior || 'oneDirection', r.isActive === false ? 'off' : 'on'].join('|');
    chk(() => JSON.stringify((back.relationships || []).map(rk).sort()) === JSON.stringify((src.relationships || []).map(rk).sort()), () => `SH-3 ${label}. relationships kept`);
    const ms = (x) => x.tables.flatMap((t) => (t.measures || []).map((mm) => t.name + '|' + mm.name + '=' + exprOf(mm.expression).trim())).sort().join('\n');
    chk(() => ms(back) === ms(src), () => `SH-3 ${label}. measures kept with their DAX`);
    const at = (p) => pj.files.find((f) => f.path === p), txt = (f) => (f.text != null ? f.text : Buffer.from(f.data).toString('utf8'));
    chk(() => JSON.parse(txt(at(`Render ${label}.Report/definition.pbir`))).datasetReference.byPath.path === `../Render ${label}.SemanticModel`, () => `SH-4 ${label}. the report points at the shadow model`);
    const pagesJson = JSON.parse(txt(at(`Render ${label}.Report/definition/pages/pages.json`)));
    chk(() => pagesJson.activePageName === pj.pages[0].id && (pages ? pj.pages.length === 1 && pj.pages[0].n === 2 : pj.pages.length >= 2), () => `SH-5 ${label}. the first page to capture is the active page: ${pagesJson.activePageName} ${JSON.stringify(pj.pages.map((p) => [p.n, p.id]))}`);
    chk(() => pj.pages.every((p) => p.name && Array.isArray(p.boxes) && p.boxes.length && p.boxes.every((b) => b.type && [b.x, b.y, b.w, b.h].every(Number.isFinite) && b.title === undefined)), () => `SH-6 ${label}. each page's boxes: type and place, no title text`);
    chk(() => !pj.pages.some((p) => /tooltip/i.test(p.id)), () => `SH-6 ${label}. tooltip pages are not captured`);
    // written to disk and checked as any report DataArcus writes
    const dir = path.join(ROOT, 'sh-' + label);
    pj.files.forEach((f) => { const p = path.join(dir, ...f.path.split('/')); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.text != null ? f.text : f.data); });
    let r = null;
    try { r = await checkReport(path.join('sh-' + label, `Render ${label}.pbip`), {}); } catch (e) { r = { failed: String(e && e.message || e) }; }
    chk(() => r && r.validator && r.validator.ran && r.validator.errors === 0, () => `SH-7 ${label}. Microsoft's validator: 0 errors on the shadow project: ${JSON.stringify(r && (r.validator || r)).slice(0, 400)}`);
    chk(() => r && r.impact && r.impact.kinds && (r.impact.kinds.canBreak || { count: 0 }).count === 0, () => `SH-7 ${label}. check_report: 0 "can break": ${JSON.stringify(r && r.impact).slice(0, 300)}`);
  }
  chk(() => { const s = S.renderProject(made, [], { literals: 'stub' }); return (s.literals || []).length === 6 && s.literals.every((x) => x.numbers != null); }, () => 'SH-8. renderProject lists the literals it found');
}

// ---------- D: the driver on a fake Desktop ----------
const FAKE = path.join(HERE, 'fixtures', 'fake-desktop-helper.mjs');
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return false; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const T = { pollMs: 10, windowMs: 3000, settleMs: 3000, pageSettleMs: 2000 };
let runN = 0;
const fake = (sc) => { const log = path.join(ROOT, `fake-${++runN}.log`); return { log, helper: { cmd: process.execPath, args: [FAKE, JSON.stringify(Object.assign({ log }, sc))] } }; };
const ops = (log) => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const temps = () => fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('dataarcus-render-'));
if (D && projects.twin) {
  const pj = projects.twin, before = temps();
  // D-1. the whole run
  {
    const f = fake({ windowAfter: 3, stableAfter: 3 });
    let r = null, err = null;
    try { r = await D.render(pj, { helper: f.helper, timing: T }); } catch (e) { err = e; }
    const o = ops(f.log), names = o.map((x) => x.op);
    chk(() => r && !err, () => `D-1. the render runs on the fake Desktop: ${err && err.message}`);
    if (r) {
      const opened = o.find((x) => x.op === 'open');
      chk(() => names[0] === 'foreground' && opened && /Render twin\.pbip$/.test(opened.file) && [os.tmpdir(), fs.realpathSync(os.tmpdir())].some((t) => opened.file.startsWith(t)), () => `D-1. foreground checked first, then the project opened by its path in a temporary folder: ${JSON.stringify(o.slice(0, 3))}`);
      chk(() => names.filter((n) => n === 'state').length >= 3 && names.indexOf('capture') > names.indexOf('open'), () => `D-1. the window waited for: ${names.join(',')}`);
      chk(() => r.pid === opened.pid && o.filter((x) => x.op === 'close').length === 1 && o.find((x) => x.op === 'close').pid === opened.pid && !alive(opened.pid), () => `D-2. closed by the pid it started, once, and that process is gone: ${JSON.stringify(o.filter((x) => x.op === 'close'))}`);
      chk(() => r.pages.length === pj.pages.length && r.pages.every((p) => p.settled === true && Buffer.isBuffer(p.png) && p.png.slice(1, 4).toString() === 'PNG'), () => `D-3. one settled PNG a page: ${JSON.stringify(r.pages.map((p) => [p.id, p.settled, p.png && p.png.length]))}`);
      const perPage = pj.pages.map((p) => o.filter((x) => x.op === 'capture' && x.page === p.name).length);
      chk(() => perPage.every((n) => n >= 3 + 1 && n <= 3 + 2), () => `D-3. captured until two in a row match (3 changing frames, then 2 the same): ${perPage}`);
      const switched = o.filter((x) => x.op === 'page').map((x) => x.name);
      chk(() => JSON.stringify(switched) === JSON.stringify(pj.pages.slice(1).map((p) => p.name)), () => `D-4. a page switch by name for every page after the first (the first is the active page): ${switched}`);
      chk(() => r.pages.every((p, k) => p.png.equals(fs.readFileSync(path.join(path.dirname(f.log), `fake-${runN}-last-${k}.png`)))), () => 'D-3. each page\'s image is its last capture');
    }
    chk(() => JSON.stringify(temps()) === JSON.stringify(before), () => `D-5. the temporary folder is deleted: ${temps().filter((n) => !before.includes(n))}`);
  }
  // D-6. a capture that fails: Desktop closed, the folder deleted, the error said
  {
    const f = fake({ windowAfter: 1, stableAfter: 1, failCapture: 2 });
    let err = null; try { await D.render(pj, { helper: f.helper, timing: T }); } catch (e) { err = e; }
    const o = ops(f.log), opened = o.find((x) => x.op === 'open');
    chk(() => err && /capture/i.test(err.message) && opened && o.some((x) => x.op === 'close' && x.pid === opened.pid) && !alive(opened.pid) && JSON.stringify(temps()) === JSON.stringify(before), () => `D-6. a failed capture: closed by pid, folder deleted, said: ${err && err.message} ${JSON.stringify(o.slice(-3))}`);
  }
  // D-7. a dialog: stops, clicks nothing, closes, deletes
  {
    const f = fake({ windowAfter: 1, dialogAt: 2 });
    let err = null; try { await D.render(pj, { helper: f.helper, timing: T }); } catch (e) { err = e; }
    const o = ops(f.log), opened = o.find((x) => x.op === 'open');
    chk(() => err && err.refused === true && /dialog/i.test(err.message) && !o.some((x) => x.op === 'capture') && o.some((x) => x.op === 'close' && x.pid === opened.pid) && !alive(opened.pid) && JSON.stringify(temps()) === JSON.stringify(before), () => `D-7. a dialog open: nothing captured or clicked, closed by pid, deleted: ${err && err.message} ${o.map((x) => x.op)}`);
  }
  // D-8. the user's own Desktop in front: refused before anything
  {
    const f = fake({ foreground: 'desktop' });
    let err = null; try { await D.render(pj, { helper: f.helper, timing: T }); } catch (e) { err = e; }
    const o = ops(f.log);
    chk(() => err && err.refused === true && /in front/i.test(err.message) && o.map((x) => x.op).join() === 'foreground' && JSON.stringify(temps()) === JSON.stringify(before), () => `D-8. the user's Desktop in front: refused, nothing opened or written: ${err && err.message} ${o.map((x) => x.op)}`);
  }
  // D-9. a page that never settles: its last capture, marked, at the cap
  {
    const f = fake({ windowAfter: 1, stableAfter: 1e9 }), t0 = Date.now();
    let r = null, err = null; try { r = await D.render({ ...pj, pages: pj.pages.slice(0, 1) }, { helper: f.helper, timing: { ...T, settleMs: 300 } }); } catch (e) { err = e; }
    chk(() => r && r.pages.length === 1 && r.pages[0].settled === false && Buffer.isBuffer(r.pages[0].png) && Date.now() - t0 < 5000, () => `D-9. never the same twice: returned at the cap, settled false: ${err && err.message} ${r && JSON.stringify(r.pages.map((p) => p.settled))}`);
  }
  // D-10. Desktop not found: said, nothing opened
  {
    const f = fake({ noDesktop: true });
    let err = null; try { await D.render(pj, { helper: f.helper, timing: T }); } catch (e) { err = e; }
    chk(() => err && err.refused === true && /Power BI Desktop/.test(err.message) && !ops(f.log).some((x) => x.op === 'open') && JSON.stringify(temps()) === JSON.stringify(before), () => `D-10. no Desktop: refused, nothing opened: ${err && err.message}`);
  }
  // D-11. off Windows, no helper: refused
  {
    let err = null; try { await D.render(pj, { helper: null, timing: T }); } catch (e) { err = e; }
    chk(() => D.helperCommand('linux') === null && D.helperCommand('darwin') === null && /powershell/i.test(D.helperCommand('win32').cmd) && D.helperCommand('win32').args.some((a) => /desktop-render\.ps1$/.test(a)), () => 'D-11. the helper is PowerShell on Windows, none elsewhere');
    chk(() => err && err.refused === true && /Windows/.test(err.message), () => `D-11. no helper: refused (Windows only): ${err && err.message}`);
  }
  // D-12. the learning hook: the written boxes against boxes measured in an image (none yet: null, said)
  {
    const p = pj.pages[0], same = D.scoreRender(p, p.boxes), none = D.scoreRender(p, null);
    chk(() => same && same.score === 1 && none && none.score === null && /laptop/.test(none.why), () => `D-12. scoreRender: 1 against itself, null with why when nothing was measured: ${JSON.stringify(none)}`);
  }
  chk(() => fs.readFileSync(path.join(HERE, 'lib', 'desktop-render.ps1'), 'utf8').length > 0, () => 'D-13. the PowerShell helper is there');
  {
    const ps = fs.readFileSync(path.join(HERE, 'lib', 'desktop-render.ps1'), 'utf8');
    chk(() => ['foreground', 'find', 'open', 'state', 'page', 'capture', 'close'].every((op) => new RegExp(`'${op}'\\s*\\{`).test(ps)) && /PrintWindow/.test(ps) && /PBI_DESKTOP_PATH/.test(ps) && /taskkill[^\n]*\/PID[^\n]*\/T/.test(ps) && !/Stop-Process\s+-Name|taskkill[^\n]*\/IM/i.test(ps), () => 'D-13. the helper answers every operation, captures by handle (PrintWindow), finds Desktop by PBI_DESKTOP_PATH first, closes by pid only (its tree), never by name');
  }
}

// ---------- T: the server ----------
{
  const { serverClient } = await import('./test-0.2.9.mjs');
  fs.mkdirSync(path.join(ROOT, 'lit', 'Lit.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'lit', 'Lit.SemanticModel', 'model.bim'), JSON.stringify(made));
  fs.cpSync(path.join(ROOT, 'twin', 'Twin Sales.Report'), path.join(ROOT, 'lit', 'Lit.Report'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'lit', 'Lit.Report', 'definition.pbir'), JSON.stringify({ version: '4.0', datasetReference: { byPath: { path: '../Lit.SemanticModel' } } }));
  const listOf = (d) => { const out = []; const rec = (x) => fs.readdirSync(x, { withFileTypes: true }).forEach((e) => { const f = path.join(x, e.name); if (e.isDirectory()) rec(f); else out.push(path.relative(ROOT, f)); }); rec(d); return out.filter((n) => !/^fake-/.test(n)).sort(); };
  const off = await serverClient(ROOT, { DATAARCUS_EXPERIMENTAL_RENDER: '' });
  const offTools = (await off.c.listTools()).tools.map((t) => t.name), offIns = off.c.getInstructions() || '';
  await off.close();
  chk(() => offTools.length === 11 && !offTools.includes('render_report'), () => `T-1. without the switch: the 11 tools, no render_report: ${offTools}`);
  const on = await serverClient(ROOT, { DATAARCUS_EXPERIMENTAL_RENDER: '1' });
  const onTools = (await on.c.listTools()).tools, rr = onTools.find((t) => t.name === 'render_report');
  chk(() => onTools.length === 12 && rr && on.c.getInstructions() === offIns, () => `T-2. with the switch: 12 tools with render_report, the instructions unchanged: ${onTools.map((t) => t.name)}`);
  chk(() => rr && /made-up/.test(rr.description) && /new plan/.test(rr.description) && /Windows/.test(rr.description) && rr.inputSchema.properties.literals && rr.inputSchema.properties.magnitude, () => `T-2. its description says made-up rows, Windows, a new plan for every fix; inputs literals and magnitude: ${rr && rr.description.slice(0, 200)}`);
  const before = listOf(ROOT);
  const x = await on.call('render_report', { path: 'twin/Twin Sales.pbip', literals: 'keep' });
  chk(() => !x.err && x.j && x.j.rendered === false && /Windows/.test(x.j.why) && JSON.stringify(listOf(ROOT)) === JSON.stringify(before), () => `T-3. off Windows: not rendered, said why, nothing written: ${x.t.slice(0, 300)}`);
  await on.close();
  // with the fake Desktop (the tests' hook)
  const f = fake({ windowAfter: 1, stableAfter: 1 });
  const w = await serverClient(ROOT, { DATAARCUS_EXPERIMENTAL_RENDER: '1', DATAARCUS_TEST_RENDER_HELPER: JSON.stringify({ ...f.helper, timing: T }) });
  const g = await w.call('render_report', { path: 'lit/Lit.Report' });
  chk(() => !g.err && g.j && g.j.rendered === false && g.j.literals && g.j.literals.count === 6 && g.j.literals.items.length === 6 && /stub/.test(g.j.sayFirst) && !ops(f.log).some((o) => o.op === 'open') && SECRETS.every((s) => !g.t.includes(s.replace(/"/g, ''))), () => `T-4. constants in the DAX and no choice: listed (names and counts), Desktop not started: ${g.t.slice(0, 400)}`);
  let raw = null;
  try { raw = await w.c.callTool({ name: 'render_report', arguments: { path: 'twin/Twin Sales.pbip', literals: 'stub', magnitude: 'thousands' } }); } catch (e) { raw = { isError: true, content: [{ type: 'text', text: String(e.message) }] }; }
  const head = raw && raw.content && raw.content[0] && raw.content[0].type === 'text' ? (() => { try { return JSON.parse(raw.content[0].text); } catch (e) { return null; } })() : null;
  const images = ((raw && raw.content) || []).filter((c) => c.type === 'image');
  chk(() => !raw.isError && head && head.rendered === true && images.length === head.pages.length && images.length === projects.twin.pages.length && images.every((i) => i.mimeType === 'image/png' && Buffer.from(i.data, 'base64').slice(1, 4).toString() === 'PNG'), () => `T-5. one PNG image a page in the answer: ${raw && raw.content && raw.content[0] && String(raw.content[0].text).slice(0, 300)}`);
  if (head && head.rendered) {
    chk(() => head.pages.every((p, k) => p.image === k && p.name && Array.isArray(p.boxes) && p.boxes.length && p.boxes.every((b) => b.type && Number.isFinite(b.x) && b.title === undefined) && p.settled === true), () => `T-6. each page: its image, name, boxes (no title text), settled: ${JSON.stringify(head.pages).slice(0, 300)}`);
    chk(() => Array.isArray(head.cantTell) && head.cantTell.some((s) => /magnitude|size of a number|real values/i.test(s)) && head.cantTell.some((s) => /label/i.test(s)) && /made up/i.test(head.madeUpData), () => `T-7. what the images can't tell, and that the data is made up: ${JSON.stringify(head.cantTell)}`);
    chk(() => Array.isArray(head.howToLook) && head.howToLook.some((s) => /plan_layout/.test(s)) && head.howToLook.some((s) => /never/i.test(s)) && head.howToLook.some((s) => /confidence/i.test(s)), () => `T-8. the look-and-propose steps: list problems in a fixed shape, fixes as a new plan, never a rewrite: ${JSON.stringify(head.howToLook)}`);
    chk(() => head.learning && head.learning.score === null, () => `T-9. the learning hook: unscored until the laptop measures boxes: ${JSON.stringify(head.learning)}`);
    chk(() => !/\/tmp\/|dataarcus-render-|\\Temp\\/.test(raw.content[0].text), () => 'T-10. no local path in the answer');
  }
  chk(() => JSON.stringify(listOf(ROOT)) === JSON.stringify(before), () => `T-11. nothing written in the working folder: ${listOf(ROOT).filter((n) => !before.includes(n))}`);
  await w.close();
}

fs.rmSync(ROOT, { recursive: true, force: true });
console.log(problems.length ? `FAIL  see-the-result  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  see-the-result  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
