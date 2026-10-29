// 0.3.1 GL1 (the owner, 26 Oct: the "Glassy Dashboard" look; mcp/work/GL1.md, mcp/lab/GLASS-LAB.md): a test project for
// the laptop to pick the glass look's shipped values from Power BI Desktop, not a guess. Power BI has no blur behind a
// visual: the look is each visual's background colour with transparency, a 1-pixel rim, a soft shadow, and the page
// picture DataArcus draws already soft (no photo). A made-up shop model (typed Power Query rows; no employer or client
// data), four reports written through the tools as a person would (generate_theme with chart.look "glass" ->
// plan_layout -> approve -> create_report): "Glass EN light", "Glass EN dark", "Glass AR light", "Glass AR dark", each
// with its two report pages (KPI cards, line, bar and column charts, a table, dropdown slicers, the page and Reset
// buttons) and three variant pages, each variant labelled above its row, outside the visuals. (GL2, 27 Oct) Tables and
// matrices keep no fill of their own (clear cells); "Glass EN dark" and "Glass AR light" ask Chart style table "banded",
// so the laptop sees the faint tint on every other row too:
//   "Variants: transparency"  the cards at 20, 35 (shipped) and 50% (the contrast floor may lower a value: the label says
//                             what was written)
//   "Variants: corners"       radius 0, 8 (shipped) and 16 on the 720 grid (x 1.5 on this 1920 x 1080 page)
//   "Variants: shadow"        none, soft (shipped) and strong
// Each variant row: a KPI card, the bar chart, the table and a matrix (the table's fields as rows and values), with the
// look's background, border and shadow written on the visual itself (visual.json outranks the theme). Microsoft's
// validator and check_report run on every report. Nothing outside the folder given is touched.
//   node lab/glass-lab.mjs <empty folder>      (from mcp/; prints the four .pbip files to open in Power BI Desktop)
import '../test-env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from '../test-0.2.9.mjs';

const E = createRequire(import.meta.url)('../../assets/js/design-engine.js');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const REGIONS = ['North', 'South', 'East', 'West', 'Central'], CATEGORIES = ['Home', 'Fashion', 'Electronics', 'Beauty'], CHANNELS = ['Store', 'Online'];
// the rows: every month of 2026, each region and category (made up, deterministic)
export function writeModel(dir) {
  const rows = []; let k = 0;
  for (let mo = 1; mo <= 12; mo++) REGIONS.forEach((r, ri) => CATEGORIES.forEach((c, ci) => {
    const amount = 4000 + 900 * (5 - ri) + 700 * ci + 300 * mo + ((k++ * 37) % 23) * 40;
    rows.push(`{#datetime(2026, ${mo}, ${1 + ((ri * 5 + ci) % 27)}, 0, 0, 0), "${r}", "${c}", "${CHANNELS[(ri + ci + mo) % 2]}", ${amount}, ${Math.max(1, Math.round(amount / 180))}}`);
  }));
  const days = []; for (let mo = 1; mo <= 12; mo++) for (let d = 1; d <= 28; d++) days.push(`{#datetime(2026, ${mo}, ${d}, 0, 0, 0), "${MONTHS[mo - 1]}", ${mo}}`);
  const mp = (expression) => [{ name: 'p', mode: 'import', source: { type: 'm', expression } }];
  const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
  fs.mkdirSync(path.join(dir, 'Glass Shop.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Glass Shop.SemanticModel/definition.pbism'), JSON.stringify({ version: '1.0' }, null, 2));
  fs.writeFileSync(path.join(dir, 'Glass Shop.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { culture: 'en-US', defaultPowerBIDataSourceVersion: 'powerBI_V3', tables: [
    { name: 'Sales', partitions: mp(`let Source = #table(type table [Date = datetime, Region = text, Category = text, Channel = text, Amount = number, Orders = number], {${rows.join(', ')}}) in Source`),
      columns: [col('Date', 'dateTime'), col('Region', 'string'), col('Category', 'string'), col('Channel', 'string'), col('Amount', 'double'), col('Orders', 'double')],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Order Count', expression: 'SUM ( Sales[Orders] )', formatString: '#,0' },
        { name: 'Average Order', expression: 'DIVIDE ( [Total Sales], [Order Count] )', formatString: '#,0.00' }] },
    { name: 'Calendar', dataCategory: 'Time', partitions: mp(`let Source = #table(type table [Date = datetime, #"Month Name" = text, #"Month Number" = Int64.Type], {${days.join(', ')}}) in Source`),
      columns: [col('Date', 'dateTime', { isKey: true }), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64')] }],
    relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }, null, 1));
}
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Order Count]', 'Sales[Average Order]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Category]',
  slicers: ['Sales[Channel]', 'Sales[Region]'], table: ['Sales[Region]', 'Sales[Total Sales]', 'Sales[Order Count]'] };
// the Arabic names a person approves for the Arabic reports
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Order Count]': 'عدد الطلبات', 'Sales[Average Order]': 'متوسط الطلب', 'Sales[Region]': 'المنطقة', 'Sales[Category]': 'الفئة', 'Sales[Channel]': 'القناة', 'Calendar[Month Name]': 'الشهر' };
const L = (v) => ({ expr: { Literal: { Value: v } } }), colr = (h) => ({ solid: { color: L(`'${h}'`) } });
// the look's cards on one visual (visual.json outranks the theme): background at t, the rim, the corners, a shadow
const lookOn = (ui, g, o) => ({
  background: [{ properties: { show: L('true'), color: colr(ui.card), transparency: L(o.t + 'D') } }],
  border: [{ properties: { show: L('true'), color: colr(g.rim), radius: L(o.radius + 'D'), width: L('1D') } }],
  dropShadow: [{ properties: o.shadow ? { show: L('true'), color: colr(o.shadow.color || '#000000'), position: L("'Outer'"), preset: L(`'${o.shadow.preset || 'Bottom'}'`), transparency: L(o.shadow.transparency + 'D'), shadowBlur: L(o.shadow.blur + 'D'), shadowDistance: L(o.shadow.distance + 'D'), shadowSpread: L((o.shadow.spread || 0) + 'D') } : { show: L('false') } }]
});

// (GL2, the laptop of 27 Oct: the lab failed on Windows) the report's folder from create_report's answer: its "open" is
// relative to the working folder with the platform's separators ("glass\\Glass EN light.pbip" on Windows), so it is
// split on both. p: path (path.win32 in the test, as the Windows job would see it)
export const reportDirOf = (root, open, name, p = path) => p.join(root, ...String(open).split(/[\\/]/).slice(0, -1), name + '.Report');
export const pbipOf = (root, open, p = path) => p.join(root, ...String(open).split(/[\\/]/));
// (GL2) GL1's dark shadow, which the laptop found barely shows on a dark page, at 1080 high: one row of the dark page
const GL1_DARK_SHADOW = { transparency: 55, blur: 18, distance: 4 };

export async function writeLab(out) {
  fs.mkdirSync(out, { recursive: true });
  const ROOT = fs.realpathSync.native(path.resolve(out));
  if (fs.readdirSync(ROOT).length) throw new Error(`${ROOT} is not empty: give an empty folder`);
  writeModel(path.join(ROOT, 'glass'));
  const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
  const req = (url, body) => new Promise((resolve) => { if (!url) { resolve(''); return; } const u = new URL(url), r = http.request(u, { method: body ? 'POST' : 'GET', headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); }); r.on('error', () => resolve('')); if (body) r.write(body); r.end(); });
  const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
  const made = [];
  try {
    for (const [lang, mode, table] of [['en', 'light', 'auto'], ['en', 'dark', 'banded'], ['ar', 'light', 'banded'], ['ar', 'dark', 'auto']]) {
      const name = `Glass ${lang.toUpperCase()} ${mode}`;
      const gt = await s.call('generate_theme', { chart: { look: 'glass', table }, mode, lang });
      if (gt.err) throw new Error('generate_theme: ' + gt.t.slice(0, 300));
      let args = Object.assign({ path: 'glass/Glass Shop.SemanticModel', lang, layout: 'exec', filters: 'top', secondPage: true, name, design: gt.j.design, planFields: FIELDS }, lang === 'ar' ? { displayNames: AR_NAMES } : {});
      let pl = await s.call('plan_layout', args);
      for (let i = 0; i < 4 && !pl.err; i++) {
        const j = pl.j || {}, more = {};
        if (j.gulfDates && j.gulfDates.askNext && !args.gulfDates && ((j.gulfDates.candidates || [])[0] || {}).field) more.gulfDates = { dateRole: j.gulfDates.candidates[0].field, grain: 'gregorian', scope: 'all' };
        if (j.sharedAxes && (j.sharedAxes.ask || []).length && !args.sharedAxes) more.sharedAxes = j.sharedAxes.ask.map((q) => ({ measures: q.measures, answer: 'separate' }));
        if (!Object.keys(more).length) break;
        args = Object.assign(args, more); pl = await s.call('plan_layout', args);
      }
      const id = pl.j && pl.j.plan && pl.j.plan.planId;
      if (!id) throw new Error('no plan: ' + JSON.stringify((pl.j || {}).planProblems || pl.t).slice(0, 600));
      const n = links().length; await s.call('approve_plan', { planId: id });
      for (let k = 0; k < 100 && links().length <= n; k++) await new Promise((r) => setTimeout(r, 50));
      await req(links()[n], 'decision=approve'); await s.call('approve_plan', { planId: id });
      const send = Object.assign({}, args, { planId: id, design: pl.j.design, fields: FIELDS }); delete send.planFields;
      const r = await s.call('create_report', send);
      if (r.err) throw new Error('not written: ' + r.t.slice(0, 400));
      const design = pl.j.design, g = E.glassLook(design), variants = addVariants(reportDirOf(ROOT, r.j.open, name), design, g, lang);
      const c = await s.call('check_report', { path: r.j.open }), cj = c.j || {};
      made.push({ name, pbip: pbipOf(ROOT, r.j.open), look: { transparency: g.t, asked: g.asked, rim: g.rim, shadow: g.shadow, tables: g.table, checks: g.checks.map((x) => `${x.id} ${x.ratio.toFixed(2)}:1`) }, variants,
        validator: c.err ? c.t.slice(0, 200) : cj.validator && cj.validator.errors, canBreak: cj.impact && cj.impact.kinds.canBreak.count, gt: gt.j.glass && gt.j.glass.sayInPlan });
    }
  } finally { await s.close(); }
  return made;
}

// the three variant pages, after the report's pages: each row a label, then a card, the bar chart, the table and a matrix
function addVariants(RD, design, g, lang) {
  const P = path.join(RD, 'definition/pages'), rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8')), wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2)); };
  const order = rd(path.join(P, 'pages.json')), first = order.pageOrder[0], page0 = rd(path.join(P, first, 'page.json'));
  const vis = fs.readdirSync(path.join(P, first, 'visuals')).map((v) => rd(path.join(P, first, 'visuals', v, 'visual.json'))).filter((v) => v.visual && !v.parentGroupName);
  const pick = (t) => vis.find((v) => v.visual.visualType === t);
  const card = pick('cardVisual'), bar = pick('clusteredBarChart') || pick('barChart'), table = pick('tableEx');
  if (!card || !bar || !table) throw new Error('the report has no card, bar chart or table to copy: ' + vis.map((v) => v.visual.visualType).join(', '));
  // a matrix from the table: its first column as rows, its measures as values
  const tq = JSON.parse(JSON.stringify(table.visual.query)), projs = tq.queryState.Values.projections;
  const matrix = { $schema: table.$schema, visual: { visualType: 'pivotTable', query: { queryState: { Rows: { projections: [projs[0]] }, Values: { projections: projs.slice(1) } } }, objects: {}, visualContainerObjects: JSON.parse(JSON.stringify(table.visual.visualContainerObjects || {})), drillFilterOtherVisuals: true } };
  const k = 1080 / 720, ship = { t: g.t, radius: Math.round((+design.layout.radius || 0) * k), shadow: g.shadow };
  const strong = { transparency: Math.max(0, g.shadow.transparency - 25), blur: Math.round(g.shadow.blur * 1.6), distance: g.shadow.distance * 2 };
  // the transparency asked, lowered by the contrast floor where it must be (the label says what was written)
  const tOf = (t) => E.glassLook(design, { t }).t;
  const PAGES = [
    ['Variants: transparency', 'المتغيرات: الشفافية', [20, 35, 50].map((t) => [`Transparency ${t}%${tOf(t) !== t ? ` (written ${tOf(t)}%: the contrast floor)` : ''}${t === g.asked ? ' (shipped)' : ''}`, Object.assign({}, ship, { t: tOf(t) })])],
    ['Variants: corners', 'المتغيرات: الزوايا', [0, 8, 16].map((r) => [`Corners ${r} (${Math.round(r * k)} on this page)${r === +design.layout.radius ? ' (shipped)' : ''}`, Object.assign({}, ship, { radius: Math.round(r * k) })])],
    ['Variants: shadow', 'المتغيرات: الظل', [['none', null], ['soft (shipped)', g.shadow], ['strong', strong]].map(([w, sh]) => [`Shadow ${w}${sh ? `: transparency ${sh.transparency}, blur ${sh.blur}, distance ${sh.distance}` : ''}`, Object.assign({}, ship, { shadow: sh })])]];
  // (GL2) on a dark page only: GL1's soft shadow (barely seen on dark, the laptop of 27 Oct), the shipped dark one, and a
  // light halo instead (white, preset Center, no distance: the schema's dropShadow options), to be measured
  const sayShadow = (sh) => `transparency ${sh.transparency}, blur ${sh.blur}, distance ${sh.distance}${sh.color ? `, ${sh.color}, ${sh.preset}` : ''}`;
  if (g.mode === 'dark') PAGES.push(['Variants: shadow on dark', 'المتغيرات: الظل على الصفحة الداكنة', [['GL1 soft', GL1_DARK_SHADOW], ['dark (shipped)', g.shadow], ['light halo', { transparency: 80, blur: 24, distance: 0, spread: 0, color: '#ffffff', preset: 'Center' }]]
    .map(([w, sh]) => [`Shadow ${w}: ${sayShadow(sh)}`, Object.assign({}, ship, { shadow: sh })])]);
  const out = [];
  PAGES.forEach(([en, ar, rows], pi) => {
    const id = crypto.createHash('sha256').update(RD + en).digest('hex').slice(0, 20), PD = path.join(P, id);
    wr(path.join(PD, 'page.json'), Object.assign({}, page0, { name: id, displayName: lang === 'ar' ? ar : en, filterConfig: undefined, visibility: undefined }));
    let z = 0;
    rows.forEach(([say, o], ri) => {
      const y = 24 + ri * 352, look = lookOn(design.ui, g, o), rtl = lang === 'ar';
      const box = (x, w) => (rtl ? 1920 - x - w : x);
      // (a copied visual's filters renamed, so no filter name is used twice in the report)
      const own = (fc, nm) => (fc ? Object.assign({}, fc, { filters: (fc.filters || []).map((f) => Object.assign({}, f, { name: (f.name || 'f') + nm })) }) : undefined);
      const put = (nm, v, x, w, h) => wr(path.join(PD, 'visuals', nm, 'visual.json'), Object.assign({}, v, { name: nm, position: { x: box(x, w), y: y + 54, z: z, width: w, height: h, tabOrder: z++ }, parentGroupName: undefined, filterConfig: own(v.filterConfig, nm),
        visual: Object.assign({}, v.visual, { visualContainerObjects: Object.assign({}, v.visual.visualContainerObjects || {}, look) }) }));
      wr(path.join(PD, 'visuals', `l${pi}${ri}`, 'visual.json'), { $schema: card.$schema, name: `l${pi}${ri}`, position: { x: box(24, 1872), y, z: z, width: 1872, height: 48, tabOrder: z++ },
        visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: say, textStyle: { fontSize: '13pt', color: design.ui.text } }], horizontalTextAlignment: rtl ? 'right' : 'left' }] } }] }, visualContainerObjects: { background: [{ properties: { show: L('false') } }] } } });
      put(`c${pi}${ri}`, card, 24, 300, 160);
      put(`b${pi}${ri}`, bar, 344, 500, 290);
      put(`t${pi}${ri}`, table, 864, 500, 290);
      put(`m${pi}${ri}`, matrix, 1384, 512, 290);
      out.push({ page: en, row: say, transparency: o.t, radius: o.radius, shadow: o.shadow });
    });
    order.pageOrder.push(id);
  });
  wr(path.join(P, 'pages.json'), order);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) { console.error('Give an empty folder: node lab/glass-lab.mjs <folder>'); process.exit(2); }
  writeLab(out).then((made) => {
    made.forEach((m) => {
      console.log(`Open in Power BI Desktop: ${m.pbip}`);
      console.log(`  the look: ${m.look.transparency}% transparency (asked ${m.look.asked}%), rim ${m.look.rim}, shadow ${JSON.stringify(m.look.shadow)}; worst cases ${m.look.checks.join(', ')}`);
      console.log(`  tables and matrices: cells ${m.look.tables.clear} (clear)${m.look.tables.band ? `, every other row ${m.look.tables.band} (${m.look.tables.bandAlpha}%)` : ''}, grid lines ${m.look.tables.grid}`);
      console.log(`  variant rows: ${m.variants.length}; Microsoft's validator errors: ${m.validator}; check_report "can break": ${m.canBreak}`);
    });
    console.log(`The plan's words (EN light): ${made[0].gt}`);
  }).catch((e) => { console.error('FAIL  ' + (e && e.message || e)); process.exit(1); });
}
