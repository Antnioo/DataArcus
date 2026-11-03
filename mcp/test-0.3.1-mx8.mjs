import './test-env.mjs';
// 0.3.1 MX8 (laptop part 13, rc.13: verdict NO, two general rules on heatmaps; the reviewer's brief of 2 Nov;
// mcp/work/MX8.md; written red first on a6000a27). Fixtures made up in the shapes of the owner's public dashboards
// (evidence/0.3.1-shapes: pages, boxes, column widths; made-up names and paddings, no data). Edges and order, never centres.
//   G1-G10  a chart lined up with a heatmap's grid (Call Center 52c8e333 under 9d8cf758, both twins; ER c1e3e190 under
//           f2c68e52, sorted Ascending) keeps English's padding, axis cards and sort, only moved: bar k under hour k's
//           cell edges as in English; named in movedByRule with why; a chart under no grid keeps the general mirror
//   N1-N8   the heatmap's names table: its blank header the matrix's header outline, its values the row headers',
//           one row of the matrix's text more room below (same top), kept inside its page
//   node test-0.3.1-mx8.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mx8-')));
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
const CPAD = { left: 0, right: 20 };   // the hour chart's own padding (made up: one side wider, as part 13 measured a shift)
const chartAt = (name, box, pad, sort) => { const j = hourChart(name, box); j.visual.visualContainerObjects = { padding: [{ properties: { left: L(pad.left + 'D'), right: L(pad.right + 'D') } }] };
  if (sort) j.visual.query.sortDefinition = { sort: [{ field: col('Call Hour').field, direction: sort }] }; return j; };

try {
  const D = path.join(ROOT, 'p'), DEF = path.join(D, 'Twin Sales.Report/definition');
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
  const cols = ['Weekday', 'Call Hour'];
  const bimF = path.join(D, 'Twin Sales.SemanticModel/model.bim'), bim = rd(bimF);
  bim.model.tables.push({ name: T, columns: cols.map((name) => ({ name, dataType: /Call Hour/.test(name) ? 'double' : 'string', sourceColumn: name })),
    measures: ['Calls'].map((m) => ({ name: m, expression: '1' })) }); wr(bimF, bim);
  const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj);
  const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
  const page = (id, w, h) => { pages.pageOrder.push(id); wr(path.join(DEF, 'pages', id, 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: id, displayName: id, displayOption: 'FitToPage', width: w, height: h }); };
  const EN = {}, put = (pg, j) => { EN[j.name] = j; wr(path.join(DEF, 'pages', pg, 'visuals', j.name, 'visual.json'), Object.assign({ $schema: VS }, j, { position: Object.assign({ tabOrder: j.position.z }, j.position) })); };
  // Call Center p1 (1280 x 800) from the width-set copy: the heatmap 9d8cf758 (strip 38.06, right padding 6), the hour
  // chart 52c8e333 under its grid, a column chart under no grid (a guard)
  page('ccSet', 1280, 800);
  put('ccSet', heat('heat', HB, { columnWidth: widths(DAY, [STRIP]) }, PAD));
  put('ccSet', chartAt('hours', CB, CPAD));
  put('ccSet', chartAt('other', { x: 20, y: 600, width: 310, height: 82.5 }, CPAD));
  // Call Center p1 as the unchanged English (its strip not set: B1), the hour chart under it
  page('ccReal', 1280, 800);
  put('ccReal', heat('heatReal', HB, null, PAD));
  put('ccReal', chartAt('hoursReal', CB, CPAD));
  // ER p1 (1280 x 720): heatmap f2c68e52 at 11pt (strip 36 set), the hour chart c1e3e190 under it sorted Ascending
  const EB = { x: 20, y: 300, width: 317.5, height: 188.33 };
  page('erP1', 1280, 720);
  put('erP1', heat('erHeat', EB, { columnWidth: widths(DAY, [36]) }, PAD, { textSize: L('11D') }));
  put('erP1', chartAt('erHours', { x: 30, y: 470, width: 300, height: 80 }, { left: 0, right: 0 }, 'Ascending'));
  // a heatmap at a page's bottom: the names table's room below is clamped to the page
  page('low', 1280, 720);
  put('low', heat('lowHeat', { x: 20, y: 526.67, width: 317.5, height: 188.33 }, { columnWidth: widths(DAY, [STRIP]) }, PAD));
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
  const r2 = (n) => Math.round(n * 100) / 100, J = (x) => JSON.stringify(x === undefined ? null : x);
  // the grid's cells and the chart's bars by their edges (24 hours, the category axis hidden: the bars share the plot
  // width evenly; the grid's columns grow to fit, so its 24 cells share its width evenly)
  const grid = (m, strip) => { const l = m.position.x + padOf(m, 'left') + strip, r = m.position.x + m.position.width - padOf(m, 'right'); return { l, w: r - l }; };
  const bars = (c) => { const l = c.position.x + padOf(c, 'left'), r = c.position.x + c.position.width - padOf(c, 'right'); return { l, w: r - l }; };
  const edgeOff = (c, m, strip, k) => { const g = grid(m, strip), b = bars(c); return (b.l + k * b.w / 24) - (g.l + k * g.w / 24); };
  const hm = at('ccSet', 'heat'), ch = at('ccSet', 'hours');

  // ---------- G: a chart lined up with a heatmap's grid keeps English's inside ----------
  const enOff = (k, strip) => edgeOff(EN.hours, EN.heat, strip, k);
  chk(() => ch && hm && Math.abs(edgeOff(ch, hm, 1, 0) - enOff(0, STRIP)) < 0.5, () => `G1. Call Center (width-set copy): bar 0's left edge stands where English's does against hour 0's cell (${r2(enOff(0, STRIP))}): ${ch && hm && r2(edgeOff(ch, hm, 1, 0))}`);
  chk(() => ch && hm && Math.abs(edgeOff(ch, hm, 1, 23) - enOff(23, STRIP)) < 0.5, () => `G2. and bar 23's against hour 23's (${r2(enOff(23, STRIP))}): ${ch && hm && r2(edgeOff(ch, hm, 1, 23))}`);
  const inside = (tw, en) => J(tw.visual.visualContainerObjects.padding) === J(en.visual.visualContainerObjects.padding) && J((tw.visual.objects || {}).valueAxis) === J(en.visual.objects.valueAxis)
    && J((tw.visual.objects || {}).categoryAxis) === J(en.visual.objects.categoryAxis) && J(tw.visual.query.sortDefinition) === J(en.visual.query.sortDefinition);
  const show = (v) => v && J([v.visual.visualContainerObjects.padding, (v.visual.objects || {}).valueAxis, v.visual.query.sortDefinition]);
  chk(() => ch && inside(ch, EN.hours), () => `G3. its padding, axis cards and sort as English's (no padding swap, no switchAxisPosition, no Descending sort): ${show(ch)}`);
  const ot = at('ccSet', 'other');
  chk(() => ot && padOf(ot, 'left') === 20 && padOf(ot, 'right') === 0 && lit(plain(ot, 'valueAxis', 'switchAxisPosition')) === 'true' && ot.visual.query.sortDefinition.sort[0].direction === 'Descending',
    () => `G4 (guard). a column chart under no grid keeps the general mirror (padding swapped, value axis right, categories by a Descending sort): ${show(ot)}`);
  const hr = at('ccReal', 'heatReal'), cr = at('ccReal', 'hoursReal');
  chk(() => hr && cr && [0, 23].every((k) => Math.abs(edgeOff(cr, hr, 0, k) - edgeOff(EN.hoursReal, EN.heatReal, 0, k)) < 0.5), () => `G5. Call Center (the unchanged English, B1): bars 0 and 23 against their hours' cells as English (${r2(edgeOff(EN.hoursReal, EN.heatReal, 0, 0))}, ${r2(edgeOff(EN.hoursReal, EN.heatReal, 0, 23))}): ${hr && cr && [0, 23].map((k) => r2(edgeOff(cr, hr, 0, k)))}`);
  chk(() => cr && inside(cr, EN.hoursReal), () => `G6. and its inside as English's: ${show(cr)}`);
  const er = at('erP1', 'erHours'), eh = at('erP1', 'erHeat');
  chk(() => er && J(er.visual.query.sortDefinition) === J(EN.erHours.visual.query.sortDefinition), () => `G7. ER c1e3e190: its sort Ascending as English's (Descending put hour 23's bar under «00»): ${er && J(er.visual.query.sortDefinition)}`);
  chk(() => er && eh && inside(er, EN.erHours) && [0, 23].every((k) => Math.abs(edgeOff(er, eh, 1, k) - edgeOff(EN.erHours, EN.erHeat, 36, k)) < 0.5), () => `G8. and its axis and padding as English's, bars 0 and 23 against their cells as English: ${show(er)}`);
  chk(() => ['ccSet/hours', 'ccReal/hoursReal', 'erP1/erHours'].every((n) => moved.some((m) => m.where.endsWith(n) && /grid/.test(m.rule) && /sort/.test(m.rule))), () => `G9. the plan's movedByRule names each with why (kept as English: its offset, padding, axis side and sort): ${J(moved)}`);
  chk(() => ch && hm && Math.abs((ch.position.x - (hm.position.x + padOf(hm, 'left') + 1)) - (CB.x - (HB.x + STRIP))) < 0.5 && Math.abs(ch.position.width - CB.width) < 0.01, () => `G10 (guard, MX7). its box at English's offset from the grid's left edge, its width English's: ${ch && J(ch.position)}`);

  // ---------- N: the names table fits its box ----------
  const namesOf = (pg, m) => all(pg).find((v) => v.visual.visualType === 'tableEx' && m && Math.abs(v.position.y - m.position.y) < 0.5);
  const nm = namesOf('ccSet', hm), en = namesOf('erP1', eh), lh = at('low', 'lowHeat'), ln = namesOf('low', lh);
  const row = (pt) => 15.1 / 8 * pt + 2;
  chk(() => nm && lit(plain(nm, 'columnHeaders', 'outlineStyle')) === '0D', () => `N1. its blank header takes the matrix's column header outline (Call Center: 0, none; a table's default draws a line under it): ${nm && J(nm.visual.objects.columnHeaders)}`);
  chk(() => nm && lit(plain(nm, 'columnHeaders', 'wordWrap')) === 'false' && lit(plain(nm, 'values', 'wordWrap')) === 'false', () => `N2 (guard, MX7). word wrap off on its header and values: ${nm && J(nm.visual.objects.values)}`);
  chk(() => nm && lit(plain(nm, 'values', 'outlineStyle')) === '0D', () => `N3. its values take the matrix's row headers' outline (0, none): ${nm && J(nm.visual.objects.values)}`);
  chk(() => nm && hm && Math.abs(nm.position.y - hm.position.y) < 0.01 && nm.position.height >= hm.position.height + row(10) - 0.01, () => `N4. the same top (its rows level with the grid's) and one row of the matrix's text (${r2(row(10))}) more room below than the matrix: no vertical scrollbar: ${nm && J(nm.position)} under ${hm && J(hm.position)}`);
  const cwN = nm && (nm.visual.objects.columnWidth || []).find((e) => e.selector && e.selector.metadata === DAY[0].queryRef);
  chk(() => nm && cwN && Math.abs(num(cwN.properties.value) - nm.position.width) < 0.01 && Math.abs(hm.position.x + hm.position.width - nm.position.x) < 0.01, () => `N5 (guard). its column the box's width, beside the grid (no horizontal scrollbar): ${nm && J(nm.position)}`);
  chk(() => en && eh && Math.abs(en.position.y - eh.position.y) < 0.01 && en.position.height >= eh.position.height + row(11) - 0.01 && lit(plain(en, 'grid', 'textSize')) === '11D', () => `N6. ER at 11pt: one row of 11pt (${r2(row(11))}) more: ${en && J(en.position)}`);
  chk(() => ln && lh && ln.position.y + ln.position.height <= 720 + 0.01 && ln.position.height > lh.position.height, () => `N7. at a page's bottom the room below is kept inside the page: ${ln && J(ln.position)}`);
  chk(() => nm && Math.abs(nm.position.width - (STRIP - 1 + 6)) < 0.01, () => `N8 (guard, MX7). its width the strip less 1 plus a cell's padding (43.06): ${nm && nm.position.width}`);
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-mx8.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  mx8  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  mx8  ${checks} checks`);
