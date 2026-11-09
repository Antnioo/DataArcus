import './test-env.mjs';
// 0.3.2 TR1 (mcp/work/TR1.md, B-275; RD1's brief, mcp/research/rd1/b275/NOTES.md (g), choice A; written red first on
// integration/0.3.2 1e5e3b3). The owner, 1 Nov: "in matrices we could switch columns but in tables it's not yet done
// why?". Power BI lays a table from its left edge, so a reversed table narrower than its box kept its blank at the right
// and its first English column (now the last) did not reach the box's right edge. On the twin's right-to-left pages a
// table Power BI sizes itself (no width, or some only) with no auto-size behaviour of its own gets "grow to fit"
// (columnHeaders.columnAdjustment), so its columns fill the box. A table sized column by column, or with its own
// adjustment, is never changed. Made-up report only (the fixture twin-project with made-up Work fields).
//   G1a-G1e  no widths: growToFit in the unselected columnHeaders entry (made, or the one there with every other
//            property kept, beside a per-column entry kept as it is); columns reversed; nothing else differs from the
//            same table with its own fitToContent
//   G2a-G2b  every width set (guard): no adjustment, keepView's slack at the left: the names' right edge at the room's
//            edge (the box less 32 x 720/1080, less 1) within TOL px
//   G3a-G3b  English's own fixedWidth and fitToContent (guard): kept as they are
//   G4       the EN-AR copy: its English page untouched, its Arabic page grown
//   G5a-G5c  one width of three: grown, the width kept; one column, a flat matrix written as a table (guard): untouched
//   G6a-G6f  the plan names each grown table, the twin's and the copy's; "wider than their box" kept; Microsoft's
//            validator on the written twin and copy: no error code the English has not; every columnWidth selector a
//            projection of its visual (the validator does not check it: RD1's X2)
//   node test-0.3.2-tr1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
const clone = (o) => JSON.parse(JSON.stringify(o));
const J = (x) => JSON.stringify(x === undefined ? null : x);
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tr1-')));
process.env.DATAARCUS_ROOT = ROOT;
const TOL = 0.5;
const L = (v) => ({ expr: { Literal: { Value: String(v) } } });
const S = (s) => L("'" + s + "'");
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const T = 'Work';
const col = (c) => ({ field: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, queryRef: T + '.' + c, nativeQueryRef: c });
const mea = (m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: T } }, Property: m } }, queryRef: T + '.' + m, nativeQueryRef: m });
const cwOf = (p, w) => ({ properties: { value: L(w + 'D') }, selector: { metadata: p.queryRef } });
const theme = (id) => ({ solid: { color: { expr: { ThemeDataColor: { ColorId: id, Percent: 0 } } } } });
const GROW = "'growToFit'";

try {
  const D = path.join(ROOT, 'p'), DEF = path.join(D, 'Twin Sales.Report/definition');
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
  const bimF = path.join(D, 'Twin Sales.SemanticModel/model.bim'), bim = rd(bimF);
  bim.model.tables.push({ name: T, columns: ['Region', 'Project', 'Owner'].map((name) => ({ name, dataType: 'string', sourceColumn: name })), measures: ['Revenue', 'Customers', 'Planned Hours', 'Actual Hours'].map((m) => ({ name: m, expression: '1' })) }); wr(bimF, bim);
  const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj);
  const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
  pages.pageOrder.push('p9tr');
  wr(path.join(DEF, 'pages/p9tr/page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: 'p9tr', displayName: 'Tables', displayOption: 'FitToPage', width: 1280, height: 720 });
  let z = 1000;
  const put = (name, x, y, w, h, visual) => { z += 1000; wr(path.join(DEF, 'pages/p9tr/visuals', name, 'visual.json'), { $schema: VS, name, position: { x, y, z, width: w, height: h, tabOrder: z }, visual }); };
  const three = () => [col('Region'), mea('Revenue'), mea('Customers')];
  const tbl = (ps, objects) => Object.assign({ visualType: 'tableEx', query: { queryState: { Values: { projections: ps } } } }, objects ? { objects } : {});
  put('tblNone', 20, 20, 600, 150, tbl(three()));
  put('tblHead', 660, 20, 600, 150, tbl(three(), { columnHeaders: [{ properties: { backColor: theme(2), fontColor: theme(0), autoSizeColumnWidth: L('false'), wordWrap: L('true') } }], values: [{ properties: { wordWrap: L('true') } }] }));
  put('tblSel', 20, 190, 600, 150, tbl(three(), { columnHeaders: [{ properties: { alignment: S('Center') }, selector: { metadata: 'Work.Revenue' } }] }));
  const all = [col('Project'), col('Owner'), mea('Revenue')];
  put('tblAll', 660, 190, 600, 150, tbl(all, { columnWidth: [cwOf(all[0], 60), cwOf(all[1], 50), cwOf(all[2], 80)] }));
  put('tblFixed', 20, 360, 600, 150, tbl(three(), { columnHeaders: [{ properties: { columnAdjustment: S('fixedWidth'), defaultColumnWidth: L('90D') } }] }));
  put('tblFit', 660, 360, 600, 150, tbl(three(), { columnHeaders: [{ properties: { columnAdjustment: S('fitToContent') } }] }));
  const mix = three();
  put('tblMixed', 20, 530, 600, 150, tbl(mix, { columnWidth: [cwOf(mix[0], 120)] }));
  put('tblOne', 660, 530, 120, 150, tbl([col('Project')]));
  put('mtxFlat', 800, 530, 220, 150, { visualType: 'pivotTable', query: { queryState: { Rows: { projections: [col('Owner')] }, Values: { projections: [mea('Planned Hours'), mea('Actual Hours')] } } } });
  put('tblWide', 1040, 530, 200, 150, tbl([col('Project'), col('Owner'), mea('Planned Hours'), mea('Actual Hours')]));
  wr(pj, pages);

  const Plans = await import('./lib/plans.mjs'), { register } = await import('./tools/create_arabic_twin.mjs');
  let handler = null; register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
  const call = async (a) => { let r; try { r = await handler(a); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } const t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* words */ } return { err: !!r.isError, t, j }; };
  const labels = { 'field:Work.Region': 'المنطقة', 'field:Work.Revenue': 'الإيرادات', 'field:Work.Customers': 'العملاء', 'field:Work.Project': 'اسم المشروع الرئيسي في المحفظة', 'field:Work.Owner': 'المسؤول عن المشروع', 'field:Work.Planned Hours': 'الساعات المخططة للمشروع', 'field:Work.Actual Hours': 'الساعات الفعلية للمشروع', 'page:p9tr': 'الجداول' };
  const write = async (extra) => { const a = Object.assign({ path: 'p/Twin Sales.pbip', arabicMonth: false, labels }, extra || {}); const p = await call(a), id = p.j && p.j.plan && p.j.plan.planId; if (id) Plans.approve(id, 'user-in-browser'); const w = id ? await call(Object.assign({}, a, { planId: id })) : p; return { p, w }; };
  const { p, w } = await write();
  if (w.err || !p.j) throw new Error('the twin is written: ' + String(w.t).slice(0, 400));
  const ENR = path.join(D, 'Twin Sales.Report'), ARR = path.join(D, 'Twin Sales AR.Report'), CPR = path.join(D, 'Twin Sales (EN-AR).Report');
  const vis = (rep, pg, n) => { const f = path.join(rep, 'definition/pages', pg, 'visuals', n, 'visual.json'); return fs.existsSync(f) ? rd(f) : null; };
  const at = (n) => vis(ARR, 'p9tr', n), en = (n) => vis(ENR, 'p9tr', n);
  const heads = (v) => (v && v.visual && v.visual.objects && Array.isArray(v.visual.objects.columnHeaders) ? v.visual.objects.columnHeaders : []);
  const unsel = (v) => heads(v).filter((e) => e && !e.selector);
  const adj = (v) => heads(v).map((e) => lit(e.properties && e.properties.columnAdjustment)).filter((x) => x !== undefined);
  const refs = (v) => v.visual.query.queryState.Values.projections.map((x) => x.queryRef);
  const wOf = (v, r) => { const e = ((v.visual.objects || {}).columnWidth || []).find((x) => x.selector && x.selector.metadata === r); return e ? parseFloat(lit(e.properties.value)) : null; };

  // G1 (B-275): no widths
  chk(() => unsel(at('tblNone')).length === 1 && lit(unsel(at('tblNone'))[0].properties.columnAdjustment) === GROW && J(adj(at('tblNone'))) === J([GROW]), () => `G1a. a table with no widths: "grow to fit" in its one unselected columnHeaders entry: ${J(heads(at('tblNone')))}`);
  const ROUTE = ['Work.Region', 'Work.Customers', 'Work.Revenue', 'Work.Row label: Region'];   // (MX1's row label route, as on the base: English's text column hidden first, its row label last)
  chk(() => J(refs(at('tblNone'))) === J(ROUTE) && J(refs(en('tblNone'))) === J(['Work.Region', 'Work.Revenue', 'Work.Customers']), () => `G1b (guard). its columns reversed as on the base: English ${J(refs(en('tblNone')))}, twin ${J(refs(at('tblNone')))}`);
  const noAdj = (v) => { const x = clone(v); delete x.name; delete x.position; const o = x.visual.objects || {}; if (Array.isArray(o.columnHeaders)) { o.columnHeaders.forEach((e) => { if (e.properties) delete e.properties.columnAdjustment; }); o.columnHeaders = o.columnHeaders.filter((e) => e.selector || Object.keys(e.properties || {}).length); if (!o.columnHeaders.length) delete o.columnHeaders; } if (!Object.keys(o).length) delete x.visual.objects; return J(x); };
  chk(() => noAdj(at('tblNone')) === noAdj(at('tblFit')), () => `G1c (guard). nothing else changed: the twin of the table with no widths equals the twin of the same table with its own fitToContent, each adjustment aside: ${noAdj(at('tblNone')).slice(0, 300)} vs ${noAdj(at('tblFit')).slice(0, 300)}`);
  const hp = (v) => (unsel(v)[0] || {}).properties || {};
  chk(() => lit(hp(at('tblHead')).columnAdjustment) === GROW && J(Object.assign({}, hp(at('tblHead')), { columnAdjustment: undefined })) === J(Object.assign({}, hp(en('tblHead')), { columnAdjustment: undefined })) && unsel(at('tblHead')).length === 1, () => `G1d. its own columnHeaders entry gains "grow to fit", every other property kept (autoSizeColumnWidth as English): English ${J(heads(en('tblHead')))}, twin ${J(heads(at('tblHead')))}`);
  chk(() => unsel(at('tblSel')).length === 1 && lit(hp(at('tblSel')).columnAdjustment) === GROW && J(heads(at('tblSel')).filter((e) => e.selector)) === J(heads(en('tblSel'))), () => `G1e. a table with only a per-column header entry: a new unselected entry with "grow to fit", the per-column one kept as it is: English ${J(heads(en('tblSel')))}, twin ${J(heads(at('tblSel')))}`);

  // G2 (guard): every width set: keepView's
  const room = 600 - 32 * 720 / 1080 - 1, sumW = (v) => refs(v).reduce((a, r) => a + wOf(v, r), 0);
  chk(() => adj(at('tblAll')).length === 0, () => `G2a (guard). a table sized column by column gets no adjustment: ${J(heads(at('tblAll')))}`);
  chk(() => Math.abs(sumW(at('tblAll')) - room) <= TOL, () => `G2b (guard). its slack at the left as today: the names' right edge ${sumW(at('tblAll'))} at the room's edge ${room} (TOL ${TOL} px)`);

  // G3 (guard): English's own adjustment
  chk(() => J(heads(at('tblFixed'))) === J(heads(en('tblFixed'))), () => `G3a (guard). English's own fixedWidth kept as it is: English ${J(heads(en('tblFixed')))}, twin ${J(heads(at('tblFixed')))}`);
  chk(() => J(heads(at('tblFit'))) === J(heads(en('tblFit'))), () => `G3b (guard). English's own fitToContent kept as it is: ${J(heads(at('tblFit')))}`);

  // G5: mixed widths, one column, a flat matrix
  const cws = (v) => ((v.visual.objects || {}).columnWidth || []).map((e) => [e.selector.metadata, lit(e.properties.value)]);
  chk(() => J(adj(at('tblMixed'))) === J([GROW]) && J(cws(at('tblMixed'))) === J([['Work.Region', '0D'], ['Work.Row label: Region', '120D']]), () => `G5a. one width of three: "grow to fit", its 120 kept (on the row label, English's text column hidden at 0, as on the base; RD1's check 3 for the laptop): ${J(cws(at('tblMixed')))} ${J(heads(at('tblMixed')))}`);
  chk(() => adj(at('tblOne')).length === 0 && heads(at('tblOne')).length === 0, () => `G5b (guard). a one-column table: no adjustment: ${J(at('tblOne').visual.objects || null)}`);
  chk(() => at('mtxFlat').visual.visualType === 'tableEx' && adj(at('mtxFlat')).length === 0, () => `G5c (guard). a flat matrix written as a table keeps its own route (no adjustment): ${J(at('mtxFlat').visual.visualType)} ${J(heads(at('mtxFlat')))}`);

  // G6: the plan, the validator, the selectors
  const fill = (j) => ((j && j.tablesFillBox) || []).filter((x) => /^p9tr\//.test(x.table)).map((x) => x.table).sort();
  const WANT = ['p9tr/tblHead', 'p9tr/tblMixed', 'p9tr/tblNone', 'p9tr/tblSel', 'p9tr/tblWide'];
  const said = (j) => ((j && j.tablesFillBox) || []).every((x) => x.what === 'its columns fill its box (grow to fit) so its first column ends at the right');
  chk(() => J(fill(p.j)) === J(WANT) && said(p.j), () => `G6a. the plan names each grown table, its columns filling its box: ${J(p.j.tablesFillBox || null)}, wanted ${J(WANT)}`);
  const cannotWide = (j) => ((j && j.cannot) || []).filter((x) => x.what === 'tables wider than their box').flatMap((x) => x.where).filter((x) => /^p9tr\/tblWide /.test(x));
  chk(() => cannotWide(p.j).length === 1, () => `G6c (guard). "wider than their box" kept as it is for the narrow table: ${J(((p.j && p.j.cannot) || []).map((x) => x.what))}`);
  const { runReportValidation, getMetadataProvider } = await import('@microsoft/powerbi-report-authoring-cli');
  const codes = async (dir) => { if (!fs.existsSync(dir)) return null; const s = await runReportValidation({ reportDir: dir, defDir: path.join(dir, 'definition'), provider: await getMetadataProvider(), skipSchema: true });
    return Object.entries(s.diagnostics || {}).filter(([, d]) => (d.items || []).length && d.severity === 'error').map(([c]) => c); };
  const enC = await codes(ENR), arC = await codes(ARR), enSet = new Set(enC || []);
  chk(() => Array.isArray(arC) && arC.every((c) => enSet.has(c)), () => `G6d (guard). Microsoft's validator on the written twin: no error code the English has not: English ${J(enC)}, twin ${J(arC)}`);
  const visualsOf = (rep) => { const d = path.join(rep, 'definition/pages'); return fs.readdirSync(d).filter((x) => fs.existsSync(path.join(d, x, 'visuals'))).flatMap((pg) => fs.readdirSync(path.join(d, pg, 'visuals')).map((n) => ({ pg, n, v: vis(rep, pg, n) }))).filter((x) => x.v && x.v.visual); };
  const strays = (rep) => visualsOf(rep).flatMap(({ pg, n, v }) => { const ps = Object.values((v.visual.query || {}).queryState || {}).flatMap((r) => (r.projections || []).map((x) => x.queryRef)); return ((v.visual.objects || {}).columnWidth || []).filter((e) => !ps.includes(e.selector && e.selector.metadata)).map((e) => pg + '/' + n + ' ' + J(e.selector)); });
  chk(() => strays(ARR).length === 0, () => `G6f (guard). every columnWidth selector of the twin names a projection of its visual: ${J(strays(ARR))}`);

  // G4: the EN-AR copy (its English pages kept left to right)
  const c = await write({ into: 'same' });
  if (c.w.err) throw new Error('the copy is written: ' + String(c.w.t).slice(0, 400));
  const cvAll = visualsOf(CPR), enPage = cvAll.filter((x) => x.pg === 'p9tr'), arT = cvAll.filter((x) => x.pg !== 'p9tr' && x.v.visual.visualType === 'tableEx' && J(adj(x.v)) === J([GROW]));
  chk(() => enPage.filter((x) => en(x.n)).length === 10 && enPage.filter((x) => en(x.n)).every((x) => J(x.v) === J(en(x.n))) && arT.length === 5 + (p.j.tablesFillBox || []).filter((x) => !/^p9tr\//.test(x.table)).length, () => `G4. the EN-AR copy: its English page's ${enPage.filter((x) => en(x.n)).length} of 10 visuals as the original's (its language button aside), its Arabic pages' tables grown: ${J(arT.map((x) => x.pg + '/' + x.n))}`);
  chk(() => (c.p.j && (c.p.j.tablesFillBox || []).length >= 5) && said(c.p.j), () => `G6b. the copy's plan names its grown tables too: ${J(c.p.j && c.p.j.tablesFillBox || null)}`);
  const cpC = await codes(CPR);
  chk(() => Array.isArray(cpC) && cpC.every((x) => enSet.has(x)), () => `G6e (guard). Microsoft's validator on the written copy: no error code the English has not: English ${J(enC)}, copy ${J(cpC)}`);
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 800)); }
try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* a temp folder */ }

if (problems.length) {
  console.log(`FAIL script=mcp/test-0.3.2-tr1.mjs check=${JSON.stringify(problems[0].slice(0, 300))} cause=checks-failed`);
  problems.forEach((x) => console.log('  - ' + x));
  console.log(`FAIL  tr1  ${problems.length} of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS  tr1  ${checks} checks`);
