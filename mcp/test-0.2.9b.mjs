// 0.2.9 part 2 (the reviewer's routine of 11 Oct 2026, the owner's 0.2.9 plan items 3, 4, 5, 7, 8, 9), written red first:
// the report writer's fixes for the owner's own test of 0.2.8 (O-2, O-3, O-4, O-6, O-7, O-13, O-14), the tooltip
// pages (Top 6, the last 6 months), $schema on every file, and the MCP's light default with a calm brand palette.
// The recipes were measured in Desktop on the laptop (dataarcus-engine business/research/REPORT-FIXES-LAB.md,
// TOOLTIP-FIX-LAB.md, VALIDATOR-LAB.md).
// test.mjs runs it with its own client (import { v029b }); run alone it starts the server itself:
//   node test-0.2.9b.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { E } from './lib/design.mjs';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';

// call: the helper that gets approved plans (test-plan.mjs)
export async function v029b({ call, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  // a made-up sales model: a calendar with a text "Month-Year" (no sort column) and a sorted "Month Name", a long text column
  const dir = 'b29';
  fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), col('Year', 'int64'), col('Month-Year', 'string'), Object.assign(col('Month Name', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64')] },
    { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Order Date', 'dateTime'), col('Region', 'string'), col('Product', 'string'), col('Issue', 'string')],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '"EUR" #,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' },
        { name: 'Margin %', expression: 'DIVIDE ( SUM ( Sales[Amount] ), 3 )', formatString: '0.0%' }] }],
    relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }] } }));
  const fields = { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month-Year]', category: 'Sales[Product]', category2: 'Sales[Region]', table: ['Sales[Issue]', 'Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin %]'] };
  const build = async (name, lang, extra) => { const pl = await ask('plan_layout', { layout: 'exec', filters: 'end', lang, path: dir });
    return ask('create_report', Object.assign({ path: dir, name, lang, design: pl.j && pl.j.design, fields, noDataMessage: false }, extra || {})); };
  // the report's files read back: every page with its visuals (absolute boxes), and the report-level measures
  const read = (x) => {
    if (x.err) return { pages: [], ext: [], files: [] };
    const R = path.join(ROOT, dir, x.j.report), D = path.join(R, 'definition'), files = [];
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else files.push(f); }); walk(R);
    const order = JSON.parse(fs.readFileSync(path.join(D, 'pages/pages.json'), 'utf8')).pageOrder;
    const pages = order.map((id) => { const P = path.join(D, 'pages', id), pj = JSON.parse(fs.readFileSync(path.join(P, 'page.json'), 'utf8')), vd = path.join(P, 'visuals');
      const vs = fs.existsSync(vd) ? fs.readdirSync(vd).map((n) => JSON.parse(fs.readFileSync(path.join(vd, n, 'visual.json'), 'utf8'))) : [];
      return { page: pj, visuals: vs }; });
    const ef = path.join(D, 'reportExtensions.json'), ext = fs.existsSync(ef) ? JSON.parse(fs.readFileSync(ef, 'utf8')).entities.flatMap((e) => e.measures.map((m) => Object.assign({ entity: e.name }, m))) : [];
    return { pages, ext, files, R };
  };
  const typeOf = (v) => (v.visual ? v.visual.visualType : 'group');
  const extOf = (r, p) => p && p.field && p.field.Measure && p.field.Measure.Expression.SourceRef.Schema === 'extension' ? r.ext.find((m) => m.entity === p.field.Measure.Expression.SourceRef.Entity && m.name === p.field.Measure.Property) : null;
  const extByField = (r, f) => (f && f.Measure ? r.ext.find((m) => m.entity === f.Measure.Expression.SourceRef.Entity && m.name === f.Measure.Property) : null);
  const filtersOf = (v) => ((v && v.filterConfig || {}).filters || []);
  const get = (fn) => { try { return fn(); } catch (e) { return undefined; } };

  const en = await build('B29 en', 'en'), ar = await build('B29 ar', 'ar'), E1 = read(en), A1 = read(ar);
  chk(() => !en.err && !ar.err, () => `the two reports must be written: ${short(en)} ${short(ar)}`);
  const main = (r) => (r.pages.find((p) => p.page.type !== 'Tooltip') || { visuals: [] }).visuals;

  // ---------- 1. O-13: the month axis ----------
  for (const [tag, r, dirn] of [['en', E1, 'Ascending'], ['ar', A1, 'Descending']]) {
    const line = main(r).find((v) => typeOf(v) === 'lineChart'), qs = get(() => line.visual.query.queryState), tip = get(() => qs.Tooltips.projections[0]), ms = extOf(r, tip);
    chk(() => qs.Category.projections[0].queryRef === 'Calendar.Month-Year' && ms && ms.dataType === 'DateTime' && /^MIN \( 'Calendar'\[Date\] \)$/.test(ms.expression),
      () => `O-13 ${tag}: the line chart by Month-Year must carry a report-level "month start" measure (MIN of Calendar[Date]) in Tooltips: ${JSON.stringify(tip)} ${JSON.stringify(ms)}`);
    const sd = get(() => line.visual.query.sortDefinition.sort[0]);
    chk(() => JSON.stringify(sd.field) === JSON.stringify(tip.field) && sd.direction === dirn, () => `O-13 ${tag}: the line chart must be sorted by the month start, ${dirn}: ${JSON.stringify(line && line.visual.query.sortDefinition)}`);
    const last = filtersOf(line).map((f) => ({ f, m: extByField(r, f.field) })).find((x) => x.m && /EDATE \( [^,]+, -12 \)/.test(x.m.expression));
    chk(() => last && last.f.type === 'Advanced' && /NOT ISBLANK \( 'Sales'\[Total Sales\] \)/.test(last.m.expression) && /"Value":"1L"/.test(JSON.stringify(last.f.filter)) && last.m.dataType === 'Integer',
      () => `O-13 ${tag}: the line chart must keep the last 12 months (a report-level measure = 1, counted back from the last month with data): ${JSON.stringify(filtersOf(line || {})).slice(0, 400)}`);
  }
  {
    const x = await ask('create_report', { path: dir, name: 'B29 month name', lang: 'en', design: (await ask('plan_layout', { layout: 'exec', path: dir })).j.design, fields: Object.assign({}, fields, { timeAxis: 'Calendar[Month Name]' }), noDataMessage: false, secondPage: false });
    const r = read(x), line = main(r).find((v) => typeOf(v) === 'lineChart');
    chk(() => line && !line.visual.query.queryState.Tooltips && !filtersOf(line).some((f) => extByField(r, f.field)), () => `O-13: a month name the model sorts keeps its own order and its 12 points: ${JSON.stringify(line && line.visual.query).slice(0, 300)} ${short(x)}`);
    const pl = await ask('plan_layout', { layout: 'exec', path: dir, planFields: { timeAxis: 'Calendar[Month-Year]' } });
    chk(() => pl.j.timeAxis.field === 'Calendar[Month-Year]' && /last 12 months/.test(pl.j.timeAxis.how) && /month start/i.test(pl.j.timeAxis.how), () => `O-13: the plan must say how the month axis is ordered and limited: ${JSON.stringify(pl.j && pl.j.timeAxis)}`);
  }

  // ---------- 2. O-14: tables ----------
  for (const [tag, r] of [['en', E1], ['ar', A1]]) {
    const pg = r.pages.find((p) => p.page.type !== 'Tooltip'), t = pg && pg.visuals.find((v) => typeOf(v) === 'tableEx'), o = get(() => t.visual.objects);
    const ch = get(() => o.columnHeaders[0].properties), ws = (o && o.columnWidth || []).map((e) => ({ ref: e.selector.metadata, w: parseFloat(e.properties.value.expr.Literal.Value) }));
    const refs = t ? t.visual.query.queryState.Values.projections.map((p) => p.queryRef) : [];
    chk(() => ch.autoSizeColumnWidth.expr.Literal.Value === 'false' && !ch.columnAdjustment, () => `O-14 ${tag}: the table's auto-size must be off and grow-to-fit gone: ${JSON.stringify(ch)}`);
    chk(() => refs.length && refs.every((q) => ws.some((w) => w.ref === q)), () => `O-14 ${tag}: one width per column: ${JSON.stringify(refs)} vs ${JSON.stringify(ws)}`);
    const sc = get(() => pg.page.height / 1080), issue = ws.find((w) => w.ref === (tag === 'ar' ? 'Sales.Row label: Issue' : 'Sales.Issue')),   /* (Arabic: the name column is hidden at 0, round 23; its row label shows it) */ nums = ws.filter((w) => /^Sales\.(Total Sales|Orders|Margin %)$/.test(w.ref)), sum = ws.reduce((a, w) => a + w.w, 0);
    chk(() => issue.w >= 160 * sc && nums.every((w) => w.w >= 90 * sc - 0.5 && w.w <= 130 * sc + 0.5) && sum <= t.position.width - 36 + 0.5,
      () => `O-14 ${tag}: numbers 90-130, the text 160 at least, all within the width less 36 (${t && t.position.width}): ${JSON.stringify(ws)}`);
    chk(() => o.values[0].properties.wordWrap.expr.Literal.Value === 'true', () => `O-14 ${tag}: the values must wrap: ${JSON.stringify(o && o.values)}`);
  }

  // ---------- 3. O-4: bar chart labels ----------
  {
    const bar = main(E1).find((v) => typeOf(v) === 'clusteredBarChart'), H = E1.pages[0].page.height, w720 = bar && bar.position.width * 720 / H;
    const mf = get(() => bar.visual.objects.categoryAxis[0].properties.maxMarginFactor);
    chk(() => mf && mf.expr.Literal.Value === (w720 < 560 ? '50L' : '40L'), () => `O-4: the bar chart's category axis gets 40 or 50 by its width (${bar && bar.position.width} on ${H}): ${JSON.stringify(bar && bar.visual.objects.categoryAxis)}`);
  }

  // ---------- 4. O-3 (no blank category), O-6 (no logo placeholder), O-7 (core KPIs) ----------
  for (const [tag, r] of [['en', E1], ['ar', A1]]) {
    const charts = main(r).filter((v) => /^(lineChart|clusteredBarChart|clusteredColumnChart|donutChart)$/.test(typeOf(v)) && v.visual.query);
    const bad = charts.filter((v) => { const c = get(() => v.visual.query.queryState.Category.projections[0].field.Column); return !c || !filtersOf(v).some((f) => f.type === 'Advanced' && f.field.Column && f.field.Column.Property === c.Property && /"Not"/.test(JSON.stringify(f.filter)) && /"Value":"null"/.test(JSON.stringify(f.filter))); });
    chk(() => charts.length >= 3 && !bad.length, () => `O-3 ${tag}: every chart must filter out a blank category: ${bad.map((v) => typeOf(v)).join(', ')} of ${charts.length}`);
    const holders = r.pages.flatMap((p) => p.visuals).filter((v) => typeOf(v) === 'textbox' && /Your logo|شعارك/.test(JSON.stringify(v.visual.objects)));
    chk(() => !holders.length, () => `O-6 ${tag}: no logo placeholder text without a logo: ${holders.length}`);
  }
  {
    fs.mkdirSync(path.join(ROOT, 'b29k', 'K.SemanticModel'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'b29k', 'K.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Projects', partitions: mp('Projects'), columns: [col('Cost', 'double'), col('Budget', 'double'), col('Department', 'string')],
      measures: [{ name: 'Predicted Cost (EOC)', expression: 'SUMX ( Projects, Projects[Cost] * 1.1 )', formatString: '#,0' }, { name: 'Earned Value', expression: 'SUMX ( Projects, Projects[Budget] * 0.5 )', formatString: '#,0' },
        { name: 'CPI', expression: 'DIVIDE ( [Earned Value], SUM ( Projects[Cost] ) )', formatString: '0.00' }, { name: 'SPI', expression: 'DIVIDE ( [Earned Value], 2 )', formatString: '0.00' },
        { name: 'Total Projects', expression: 'COUNTROWS ( Projects )', formatString: '#,0' }, { name: 'Actual Budget', expression: 'SUM ( Projects[Budget] )', formatString: '#,0' },
        { name: 'Budget Variance %', expression: 'DIVIDE ( 1, 2 )', formatString: '0.0%' }, { name: '% On Track', expression: 'DIVIDE ( 1, 3 )', formatString: '0.0%' }] }] } }));
    const s = await ask('suggest_fields', { path: 'b29k', kpis: 4 }), k = (s.j && s.j.kpis || []).filter(Boolean).map((x) => x.m);
    // (the cross-review's G1, 11 Oct: this model is the portfolio's own names, so the check asks for the shape only: the
    // plain count and sum first, a computed indicator such as CPI not before them; no name list decides. The general
    // check, on retail, HR and logistics measures, is in test-0.2.9i.mjs)
    chk(() => k[0] === 'Total Projects' && k[1] === 'Actual Budget' && !k.includes('CPI') && !k.includes('SPI'), () => `O-7: the executive KPIs must start with the core count and sum: ${JSON.stringify(k)}`);
  }

  // ---------- 5. O-2: the cards' numbers ----------
  {
    const s = await ask('suggest_fields', { path: dir, kpis: 3 }), k = (s.j && s.j.kpis || []).filter(Boolean);
    const ts = k.find((x) => x.m === 'Total Sales'), od = k.find((x) => x.m === 'Orders');
    chk(() => ts && !ts.wholeFormat && od && od.wholeFormat === '#,0', () => `O-2: an amount (EUR #,0, a SUM) shows automatic units with 2 decimals (no wholeFormat), a count its whole number: ${JSON.stringify(k)}`);
    const card = get(() => main(E1).filter((v) => typeOf(v) === 'cardVisual' && v.visual.query && /Total Sales/.test(JSON.stringify(v.visual.query))).map((v) => v.visual.objects.value)[0]);
    chk(() => card && /"labelPrecision"/.test(JSON.stringify(card)) && !/customFormatString/.test(JSON.stringify(card)), () => `O-2: the Total Sales card: automatic units, 2 decimals: ${JSON.stringify(card)}`);
  }

  // ---------- 6. the tooltip pages ----------
  for (const [tag, r] of [['en', E1], ['ar', A1]]) {
    const tips = r.pages.filter((p) => p.page.type === 'Tooltip'), bars = tips.map((p) => ({ p, v: p.visuals.find((v) => typeOf(v) === 'clusteredBarChart') })).filter((x) => x.v);
    const byCat = bars.find((x) => !/Calendar/.test(JSON.stringify(x.v.visual.query.queryState.Category))), byMonth = bars.find((x) => /Calendar/.test(JSON.stringify(x.v.visual.query.queryState.Category)));
    const top = get(() => filtersOf(byCat.v).find((f) => f.type === 'TopN'));
    chk(() => top && /"Top":6/.test(JSON.stringify(top.filter)) && (tag === 'ar' ? /أعلى 6/ : /Top 6/).test(JSON.stringify(byCat.v.visual.visualContainerObjects.title)), () => `tooltip ${tag}: the category bars must be the Top 6 by their measure, said in the title: ${JSON.stringify(byCat && filtersOf(byCat.v)).slice(0, 300)}`);
    const m6 = get(() => filtersOf(byMonth.v).map((f) => extByField(r, f.field)).find((m) => m && /EDATE \( [^,]+, -6 \)/.test(m.expression)));
    const sd = get(() => byMonth.v.visual.query.sortDefinition.sort[0]);
    chk(() => m6 && sd.direction === 'Descending' && /MIN \( 'Calendar'\[Date\] \)/.test((extByField(r, sd.field) || {}).expression) && byMonth.v.position.height >= 40 + 27 * 6 && byMonth.v.position.height + byMonth.v.position.y <= byMonth.p.page.height,
      () => `tooltip ${tag}: the month bars must be the last 6 months, newest first, at a height for 6 bars: ${JSON.stringify(byMonth && { f: filtersOf(byMonth.v), s: byMonth.v.visual.query.sortDefinition, h: byMonth.v.position.height }).slice(0, 400)}`);
  }

  // ---------- 7. $schema on every file ----------
  {
    const pbip = en.err ? null : path.join(ROOT, en.j.open);
    const all = E1.files.concat(pbip ? [pbip] : []).filter((f) => /\.(json|pbir|pbip|platform|pbism)$/i.test(f) || path.basename(f) === '.platform').filter((f) => !/RegisteredResources/.test(f));
    const none = all.filter((f) => { try { return !JSON.parse(fs.readFileSync(f, 'utf8')).$schema; } catch (e) { return true; } });
    chk(() => all.length > 20 && !none.length, () => `$schema: every file the report writes must carry one: ${none.map((f) => path.relative(ROOT, f)).slice(0, 5)}`);
  }

  // ---------- 8. the MCP's light default and the calm brand palette ----------
  {
    const pl = await ask('plan_layout', { layout: 'exec' }), d = pl.j && pl.j.design;
    chk(() => lum(d.ui.background) > 0.45 && lum(d.ui.card) > 0.45, () => `light default: plan_layout without a design must be light: ${JSON.stringify(d && d.ui)}`);
    const t = await ask('generate_theme', { brand: '#0F766E' }), td = t.j && t.j.design, loud = E.generate('#0f766e', 'analogous');
    chk(() => td.data[0] === '#0f766e' && td.data.slice(1).every((c) => ratio(c, td.ui.card) >= 3) && td.data.slice(1).every((c, i) => c !== loud[i + 1]) && new Set(td.data).size === 8,
      () => `calm palette: the brand exact, 7 other colours each 3:1 on the card, not the loud harmony: ${JSON.stringify(td && td.data)} card ${td && td.ui.card}`);
    const dk = (await ask('generate_theme', { brand: '#0F766E', mode: 'dark' })).j.design;
    chk(() => dk.data.slice(1).every((c) => ratio(c, dk.ui.card) >= 3), () => `calm palette, dark: each 3:1 on the dark card: ${JSON.stringify(dk.data)} ${dk.ui.card}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029b-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await v029b({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029b  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029b  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
