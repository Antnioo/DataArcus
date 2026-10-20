// 0.3.0 F1 (the laptop proof of 20 Oct, Desktop 2.159: every button-slicer pill drawn with no text, the cause not named
// by any evidence): a test report for the laptop to pick the pills' file shape. A made-up shop model (no employer or
// client data), one report written through the tools (plan_layout -> approve -> create_report, slicerStyle "pills"),
// then one more page, "Pills variants", with the same pill slicer three times, each under its label:
//   V1  shipped: the text (value) and outline under the default selector, show included (the new card's measured rule)
//   V2  no selector at all: one entry per card (the selected look dropped)
//   V3  V1 with room for the text: padding 2 on every side and a smaller text (9)
// Microsoft's validator and check_report run on the report. Nothing outside the folder given is touched.
//   node lab/pills-variants.mjs <empty folder>      (from mcp/; prints the .pbip to open in Power BI Desktop)
import '../test-env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { serverClient } from '../test-0.2.9.mjs';

export async function writeVariants(out) {
  const ROOT = fs.realpathSync.native(path.resolve(out));
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table(type table [A = text], {}) in Source' } }];
  const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
  fs.mkdirSync(path.join(ROOT, 'pills/Shop.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'pills/Shop.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Is Online', 'boolean'), col('Date', 'dateTime'),
      { name: 'Size Band', type: 'calculated', dataType: 'string', expression: 'SWITCH ( TRUE (), Sales[Amount] > 1000, "Large", Sales[Amount] > 100, "Medium", "Small" )' }],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] },
    { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Quarter', 'string')] }],
    relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }, null, 1));
  const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Channel]', slicers: ['Sales[Size Band]', 'Sales[Is Online]'] };
  const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
  const req = (url, body) => new Promise((resolve) => { const u = new URL(url), r = http.request(u, { method: body ? 'POST' : 'GET', headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); }); r.on('error', () => resolve('')); if (body) r.write(body); r.end(); });
  const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
  try {
    const args = { path: 'pills', lang: 'en', layout: 'exec', filters: 'top', secondPage: false, name: 'Pills Variants', slicerStyle: 'pills' };
    const pl = await s.call('plan_layout', Object.assign({ planFields: FIELDS }, args)), id = pl.j && pl.j.plan && pl.j.plan.planId;
    if (!id) throw new Error('no plan: ' + pl.t.slice(0, 300));
    const n = links().length; await s.call('approve_plan', { planId: id });
    for (let k = 0; k < 100 && links().length <= n; k++) await new Promise((r) => setTimeout(r, 50));
    await req(links()[n], 'decision=approve'); await s.call('approve_plan', { planId: id });
    const r = await s.call('create_report', Object.assign({ planId: id, design: pl.j.design, fields: FIELDS }, args));
    if (r.err) throw new Error('not written: ' + r.t.slice(0, 300));
    const RD = path.join(ROOT, 'pills/Pills Variants.Report/definition'), P = path.join(RD, 'pages');
    const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8')), wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2)); };
    const order = rd(path.join(P, 'pages.json'));
    let pill = null;
    for (const pid of order.pageOrder) { const vd = path.join(P, pid, 'visuals'); if (!fs.existsSync(vd)) continue;
      for (const v of fs.readdirSync(vd)) { const j = rd(path.join(vd, v, 'visual.json')); if (j.visual && j.visual.visualType === 'advancedSlicerVisual') { pill = j; break; } } if (pill) break; }
    if (!pill) throw new Error('no pill slicer was written');
    const L = (v) => ({ expr: { Literal: { Value: v } } });
    const merged = (o) => Object.fromEntries(Object.entries(o).map(([k, es]) => [k, [{ properties: Object.assign({}, ...es.filter((e) => !e.selector || e.selector.id === 'default').map((e) => e.properties)) }]]));
    const V = {
      V1: JSON.parse(JSON.stringify(pill.visual.objects)),
      V2: merged(JSON.parse(JSON.stringify(pill.visual.objects))),
      V3: (() => { const o = JSON.parse(JSON.stringify(pill.visual.objects)); o.value.find((e) => e.selector && e.selector.id === 'default').properties.fontSize = L('9D');
        o.padding = [{ properties: { topMargin: L('2D'), bottomMargin: L('2D'), leftMargin: L('2D'), rightMargin: L('2D') }, selector: { id: 'default' } }]; return o; })() };
    const SAY = { V1: 'V1 (shipped): text and outline under the default selector', V2: 'V2: no selectors (one entry per card)', V3: 'V3: V1 with padding 2 and text 9' };
    const pageId = crypto.createHash('sha256').update('pills-variants').digest('hex').slice(0, 20), PD = path.join(P, pageId);
    wr(path.join(PD, 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: pageId, displayName: 'Pills variants', displayOption: 'FitToPage', width: 1280, height: 720 });
    Object.keys(V).forEach((k, i) => {
      const y = 40 + i * 220, nm = 'pill' + k.toLowerCase(), lb = 'label' + k.toLowerCase();
      wr(path.join(PD, 'visuals', lb, 'visual.json'), { $schema: pill.$schema, name: lb, position: { x: 40, y, z: i * 2, width: 1200, height: 40, tabOrder: i * 2 },
        visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: SAY[k], textStyle: { fontSize: '14pt' } }] }] } }] } } });
      wr(path.join(PD, 'visuals', nm, 'visual.json'), Object.assign({}, pill, { name: nm, position: { x: 40, y: y + 50, z: i * 2 + 1, width: 600, height: 120, tabOrder: i * 2 + 1 }, visual: Object.assign({}, pill.visual, { objects: V[k] }) }));
    });
    order.pageOrder.unshift(pageId); order.activePageName = pageId; wr(path.join(P, 'pages.json'), order);
    const c = await s.call('check_report', { path: 'pills/Pills Variants.pbip' });
    return { pbip: path.join(ROOT, 'pills/Pills Variants.pbip'), pageId, variants: Object.keys(V), check: c.j ? { validator: c.j.validator.errors, canBreak: c.j.impact.kinds.canBreak.count } : c.t.slice(0, 300) };
  } finally { await s.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out || (fs.existsSync(out) && fs.readdirSync(out).length)) { console.error('Give an empty folder: node lab/pills-variants.mjs <empty folder>'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const r = await writeVariants(out);
  console.log(JSON.stringify(r, null, 1));
}
