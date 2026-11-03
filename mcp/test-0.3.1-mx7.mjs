import './test-env.mjs';
// 0.3.1 MX7 (laptop part 12, rc.12: "No, but by one rule"; the reviewer's brief of 2 Nov; mcp/work/MX7.md; written red
// first on eb09d194). Fixtures made up in the shape of the owner's public dashboards (evidence/0.3.1-shapes: pages,
// boxes, column widths; made-up names, no data).
//   H1-H6  Call Center p1's heatmap 9d8cf758 written from the copy whose weekday strip is set (38.06): the names table
//          does not wrap (word wrap off, its column at its width), takes the matrix's text size and row padding, its
//          rows the matrix's, and the 6 a table's cell padding needs beyond the strip from the box's slack (the
//          matrix's padding beside its grid); the grid keeps English's width; no slack: B1, said
//   C1-C5  a chart lined up under a heatmap's grid (the hour chart 52c8e333) keeps English's offset from the grid's left
//          edge, named in movedByRule; with the strip not set the same (moved with the box); a chart elsewhere: mirrored
//   T1-T3  RepeatIQ retention 19f5c974 (a sorted hidden column of 0): the hidden column at the left end, counted 0
//   node test-0.3.1-mx7.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mx7-')));
process.env.DATAARCUS_ROOT = ROOT;
const L = (v) => ({ expr: { Literal: { Value: v } } }), S = (s) => L("'" + s + "'");
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const num = (p) => parseFloat(String(lit(p)));
const T = 'Work';
const col = (c, d) => Object.assign({ field: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, queryRef: T + '.' + c, nativeQueryRef: c }, d ? { displayName: d } : {});
const mea = (m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: T } }, Property: m } }, queryRef: T + '.' + m, nativeQueryRef: m });
const widths = (ps, ws) => ps.map((p, i) => ({ properties: ws[i] == null ? {} : { value: L(ws[i] + 'D') }, selector: { metadata: p.queryRef } }));
const DAY = [col('Weekday', ' ')];
const heat = (name, box, more, pad, grid) => ({ name, position: Object.assign({ z: 26000 }, box), visual: { visualType: 'pivotTable',
  query: { queryState: { Rows: { projections: DAY }, Columns: { projections: [col('Call Hour')] }, Values: { projections: [mea('Calls')] } } },
  objects: Object.assign({ subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }], columnHeaders: [{ properties: { outlineStyle: L('0D') } }],
    rowHeaders: [{ properties: { outlineStyle: L('0D'), steppedLayoutIndentation: L('10D'), outlineWeight: L('1D') } }],
    grid: [{ properties: Object.assign({ gridHorizontal: L('true'), gridVertical: L('true'), gridHorizontalWeight: L('5D'), gridVerticalWeight: L('2D'), textSize: L('10D') }, grid || {}) }] }, more || {}),
  visualContainerObjects: Object.assign({ stylePreset: [{ properties: { name: S('None') } }] }, pad == null ? {} : { padding: [{ properties: { right: L(pad + 'D') } }] }) } });
const hourChart = (name, box) => ({ name, position: Object.assign({ z: 28000 }, box), visual: { visualType: 'columnChart', query: { queryState: { Category: { projections: [col('Call Hour')] }, Y: { projections: [mea('Calls')] } } }, objects: { categoryAxis: [{ properties: { show: L('false') } }], valueAxis: [{ properties: { show: L('false') } }] } } });
const STRIP = 38.06, PAD = 6, HB = { x: 543.33, y: 434.17, width: 317.5, height: 188.33 }, CB = { x: 557.5, y: 603.75, width: 310, height: 82.5 };

try {
  const D = path.join(ROOT, 'p'), DEF = path.join(D, 'Twin Sales.Report/definition');
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
  const cols = ['Weekday', 'Call Hour', 'Customer ID', 'Region'];
  const bimF = path.join(D, 'Twin Sales.SemanticModel/model.bim'), bim = rd(bimF);
  bim.model.tables.push({ name: T, columns: cols.map((name) => ({ name, dataType: /Call Hour/.test(name) ? 'double' : 'string', sourceColumn: name })),
    measures: ['Calls', 'Cohort Member', 'Orders in Month'].map((m) => ({ name: m, expression: '1' })) }); wr(bimF, bim);
  const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj);
  const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
  const page = (id, w, h) => { pages.pageOrder.push(id); wr(path.join(DEF, 'pages', id, 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: id, displayName: id, displayOption: 'FitToPage', width: w, height: h }); };
  const put = (pg, j) => wr(path.join(DEF, 'pages', pg, 'visuals', j.name, 'visual.json'), Object.assign({ $schema: VS }, j, { position: Object.assign({ tabOrder: j.position.z }, j.position) }));
  // Call Center p1 (1280 x 800) from the width-set copy: the heatmap (strip 38.06, right padding 6), the hour chart under
  // its grid, a column chart elsewhere (a guard); the same heatmap with row padding 3 set; one with no padding (no slack)
  page('ccSet', 1280, 800);
  put('ccSet', heat('heat', HB, { columnWidth: widths(DAY, [STRIP]) }, PAD));
  put('ccSet', hourChart('hours', CB));
  put('ccSet', hourChart('other', { x: 20, y: 600, width: 310, height: 82.5 }));
  page('ccPad', 1280, 800);
  put('ccPad', heat('heatPad', HB, { columnWidth: widths(DAY, [STRIP]) }, PAD, { rowPadding: L('3D') }));
  put('ccPad', heat('heatNoPad', { x: 20, y: 20, width: 317.5, height: 188.33 }, { columnWidth: widths(DAY, [STRIP]) }, null));
  // Call Center p1 as the unchanged English (its strip not set): the heatmap B1, the hour chart under it
  page('ccReal', 1280, 800);
  put('ccReal', heat('heatReal', HB, null, PAD));
  put('ccReal', hourChart('hoursReal', CB));
  // RepeatIQ retention 19f5c974 (1280 x 720): 192 x 96, customer_id 93 (the names), two measures 159 and 177, sorted
  page('rqRet', 1280, 720);
  const RET = [col('Customer ID'), mea('Cohort Member'), mea('Orders in Month')];
  put('rqRet', { name: 'retention', position: { x: 80, y: 16, z: 1000, width: 192, height: 96 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: RET } }, sortDefinition: { sort: [{ field: RET[2].field, direction: 'Descending' }] } },
    objects: { columnWidth: widths(RET, [93, 159, 177]), columnHeaders: [{ properties: { autoSizeColumnWidth: L('false') } }] }, visualContainerObjects: { title: [{ properties: { show: L('false') } }] } } });
  // the same shape whose columns fit its box (the "fits" branch): 93 + 40 + 30 in 300
  put('rqRet', { name: 'retFits', position: { x: 400, y: 16, z: 1001, width: 300, height: 96 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: RET } }, sortDefinition: { sort: [{ field: RET[0].field, direction: 'Ascending' }] } },
    objects: { columnWidth: widths(RET, [93, 40, 30]), columnHeaders: [{ properties: { autoSizeColumnWidth: L('false') } }] } } });
  wr(pj, pages);

  const Plans = await import('./lib/plans.mjs'), { register } = await import('./tools/create_arabic_twin.mjs');
  let handler = null; register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = { h, def }; } }, {});
  const call = async (a) => { let r; try { r = await handler.h(a); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } const t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* words */ } return { err: !!r.isError, t, j }; };
  const a = { path: 'p/Twin Sales.pbip', arabicMonth: false };
  const p = await call(a), id = p.j && p.j.plan && p.j.plan.planId; if (id) Plans.approve(id, 'user-in-browser');
  const w = id ? await call(Object.assign({}, a, { planId: id })) : p;
  if (!id || w.err) problems.push(`the twin is written: ${w.t.slice(0, 300)}`);
  const ARR = path.join(D, 'Twin Sales AR.Report');
  const at = (pg, n) => { const f = path.join(ARR, 'definition/pages', pg, 'visuals', n, 'visual.json'); return fs.existsSync(f) ? rd(f) : null; };
  const all = (pg) => { const dir = path.join(ARR, 'definition/pages', pg, 'visuals'); return fs.existsSync(dir) ? fs.readdirSync(dir).map((n) => rd(path.join(dir, n, 'visual.json'))) : []; };
  const plain = (v, card, k) => { const e = ((v.visual.objects || {})[card] || []).find((x) => !x.selector && x.properties && x.properties[k] !== undefined); return e ? e.properties[k] : undefined; };
  const padOf = (v, side) => { const e = ((v.visual.visualContainerObjects || {}).padding || []).find((x) => !x.selector); return e && e.properties[side] ? num(e.properties[side]) : 0; };
  const moved = (p.j && p.j.plan && p.j.plan.movedByRule) || (p.j && p.j.movedByRule) || [];
  const mx = (p.j && Array.isArray(p.j.cannot) ? p.j.cannot : []).find((x) => x.what === 'matrices'), line = (n) => ((mx && mx.where) || []).find((x) => x.includes('/' + n)) || '';
  const r2 = (n) => Math.round(n * 100) / 100;

  // ---------- H: the names table ----------
  const hm = at('ccSet', 'heat'), nm = all('ccSet').find((v) => v.visual.visualType === 'tableEx' && hm && Math.abs(v.position.y - hm.position.y) < 0.5);
  const cwN = nm && (nm.visual.objects.columnWidth || []).find((e) => e.selector && e.selector.metadata === DAY[0].queryRef);
  const enGrid = HB.width - PAD - STRIP, arGrid = hm ? hm.position.width - 1 - padOf(hm, 'left') - padOf(hm, 'right') : NaN;
  chk(() => nm && cwN && Math.abs(num(cwN.properties.value) - (nm.position.width - 4)) < 0.01, () => `H1. the names table's column is set (columnWidth for its field), so Desktop never wraps nor shrinks it; 0.3.2 HM1 (B-300): its box less 4, the table's own edges: ${JSON.stringify(nm && nm.visual.objects.columnWidth)} in ${nm && nm.position.width}`);
  chk(() => nm && lit(plain(nm, 'values', 'wordWrap')) === 'false' && lit(plain(nm, 'columnHeaders', 'wordWrap')) === 'false', () => `H2. word wrap off on its values and its header (tableEx values.wordWrap, columnHeaders.wordWrap): «Mon» never «M / on»: ${JSON.stringify(nm && [nm.visual.objects.values, nm.visual.objects.columnHeaders])}`);
  chk(() => nm && Math.abs(nm.position.width - (STRIP - 1 + 6)) < 0.01 && Math.abs(arGrid - enGrid) < 0.5 && padOf(hm, 'left') === 0 && Math.abs(nm.position.x + nm.position.width - (hm.position.x + hm.position.width + nm.position.width)) < 0.01 && Math.abs(hm.position.x + hm.position.width - nm.position.x) < 0.01,
    () => `H3. the strip less 1 (37.06) and the 6 a table's cell padding needs beyond a row header's, from the box's slack (the matrix's padding beside its grid, 6 -> 0): names 43.06, the grid English's ${r2(enGrid)}: ${JSON.stringify([hm && hm.position, nm && nm.position, hm && hm.visual.visualContainerObjects.padding])} grid ${r2(arGrid)}`);
  chk(() => nm && hm && nm.position.height >= hm.position.height - 0.01 && Math.abs(nm.position.y - hm.position.y) < 0.01 && lit(plain(nm, 'grid', 'textSize')) === '10D' && plain(nm, 'grid', 'rowPadding') === undefined, () => `H4. its rows the matrix's: same top, at least its height (MX8: one row more room below), the matrix's text size (10), no row padding where the matrix sets none (both Desktop's default): ${JSON.stringify(nm && nm.visual.objects.grid)}`);
  const hp = at('ccPad', 'heatPad'), np = all('ccPad').find((v) => v.visual.visualType === 'tableEx' && hp && Math.abs(v.position.y - hp.position.y) < 0.5);
  // (0.3.2 HM1, B-299) rowPadding 3 at 10pt: 8 rows of 26.88 + 6 = 221 do not fit 188.33: no names beside it, said why (the
  // padding written on the names table: hm1 F3)
  chk(() => !np && /heatPad \(its names not beside its grid: its 7 rows may not all fit/.test(JSON.stringify(mx && mx.where)), () => `H5. the matrix's row padding (3) counted: its 7 rows may not fit 188.33, no names beside it, said: ${JSON.stringify(np && np.visual.objects.grid)} ${JSON.stringify(mx && mx.where)}`);
  chk(() => all('ccPad').filter((v) => v.visual.visualType === 'tableEx').length === 0 && /cell padding/.test(line('heatNoPad')), () => `H6. no padding beside its grid (no slack for the table's cell padding): B1, the plan says why: ${JSON.stringify(mx && mx.where)}`);

  // ---------- C: the chart under the grid ----------
  const gridLeftEn = HB.x + 0 + STRIP, ch = at('ccSet', 'hours'), gridLeftAr = hm ? hm.position.x + padOf(hm, 'left') + 1 : NaN;
  chk(() => ch && Math.abs((ch.position.x - gridLeftAr) - (CB.x - gridLeftEn)) < 0.5, () => `C1. the hour chart keeps English's offset from the grid's left edge (${r2(CB.x - gridLeftEn)}; mirrored about its own box it was ${ch ? r2(1280 - CB.x - CB.width - gridLeftAr) : '?'}): ${ch && r2(ch.position.x - gridLeftAr)}`);
  chk(() => ch && Math.abs(ch.position.width - CB.width) < 0.01 && ch.position.x >= 0 && ch.position.x + ch.position.width <= 1280, () => `C2. its width English's, inside its page: ${JSON.stringify(ch && ch.position)}`);
  chk(() => moved.some((m) => /ccSet\/hours$/.test(m.where) && /grid/.test(m.rule)), () => `C3. named in the plan's movedByRule: ${JSON.stringify(moved)}`);
  const ot = at('ccSet', 'other');
  chk(() => ot && Math.abs(ot.position.x - (1280 - 20 - 310)) < 0.01 && !moved.some((m) => /ccSet\/other$/.test(m.where)), () => `C4 (guard). a chart under no grid: its exact mirror, not named: ${JSON.stringify(ot && ot.position)}`);
  const hr = at('ccReal', 'heatReal'), cr = at('ccReal', 'hoursReal');
  chk(() => hr && cr && Math.abs((cr.position.x - (hr.position.x + padOf(hr, 'left'))) - (CB.x - HB.x)) < 0.5 && moved.some((m) => /ccReal\/hoursReal$/.test(m.where)), () => `C5. the unchanged English (strip not set, B1, row headers still at the grid's left): the chart keeps its offset from the grid, moved with the box: ${JSON.stringify([hr && hr.position, cr && cr.position])}`);

  // ---------- T: the hidden column ----------
  const cw = (v) => (r) => { const e = (v.visual.objects.columnWidth || []).find((x) => x.selector && x.selector.metadata === r && x.properties && x.properties.value); return e ? num(e.properties.value) : null; };
  const lay = (v) => v.visual.query.queryState.Values.projections.map((q) => ({ ref: q.queryRef, w: cw(v)(q.queryRef) }));
  const rt = at('rqRet', 'retention'), rf = at('rqRet', 'retFits');
  const room = (v) => v.position.width - (20 + 12) * (720 / 1080), shownSum = (v) => { const l = lay(v), k = l.findIndex((c) => /Row label/.test(c.ref)); return l.slice(0, k + 1).reduce((s, c) => s + c.w, 0); };
  chk(() => rt && lay(rt)[0].w === 0 && /Customer ID$/.test(lay(rt)[0].ref) && /Row label/.test(lay(rt)[2].ref), () => `T1 (guard, green on eb09d194 too). RepeatIQ retention (wider than its box): the hidden column of 0 first, at the left end, then English's second column in view, the names: ${JSON.stringify(rt && lay(rt))}`);
  chk(() => rf && lay(rf)[0].w === 0 && /Row label/.test(lay(rf)[3].ref), () => `T2 (guard). the same shape that fits its box: the hidden column first: ${JSON.stringify(rf && lay(rf))}`);
  chk(() => rt && rf && Math.abs(shownSum(rt) - room(rt)) < 0.5 && Math.abs(shownSum(rf) - (room(rf) - 1)) < 0.5, () => `T3 (guard). the hidden column counts 0: the shown ones fill the room (${rt && r2(room(rt))}; ${rf && r2(room(rf) - 1)}): ${rt && r2(shownSum(rt))}, ${rf && r2(shownSum(rf))}`);
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-mx7.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  mx7  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  mx7  ${checks} checks`);
