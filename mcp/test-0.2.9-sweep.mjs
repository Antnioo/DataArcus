// 0.2.9, the design block's items of the laptop's sweep of rc.1 on nine models (S5/D19, S6, S7, D16). Written red first,
// on made-up models only (a loans book and a clinic: names chosen to look like raw database names, none of the owner's).
// test.mjs runs it with its own client (import { v029sweep }); run alone it starts the server itself:
//   node test-0.2.9-sweep.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url);

export async function v029sweep({ call, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const get = (fn) => { try { return fn(); } catch (e) { return 'threw: ' + e.message; } };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
  const E = req('../assets/js/design-engine.js');
  const design = (layout) => E.repairState({ name: 'Sweep', font: 'Segoe UI', data: E.PRESETS.Corporate.data.slice(), ui: Object.assign({}, E.PRESETS.Corporate.ui), layout: Object.assign({ v: 3 }, layout) });
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  const model = (dir, tables) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables } })); };
  // a loans book with no date at all (D16), raw-looking names (S6)
  model('s-loans', [{ name: 'loans', partitions: mp('loans'), columns: [col('loan_amnt', 'double'), col('loan_intent', 'string'), col('person_home_ownership', 'string'), col('BranchName', 'string'), col('loan_status', 'int64')],
    measures: [{ name: 'Total Exposure', expression: 'SUM ( loans[loan_amnt] )', formatString: '#,0' }, { name: 'Loans', expression: 'COUNTROWS ( loans )', formatString: '#,0' }] }]);
  const visualsOf = (x, dir) => { if (x.err) return []; const D = path.join(ROOT, dir, x.j.report, 'definition', 'pages'), out = [];
    JSON.parse(fs.readFileSync(path.join(D, 'pages.json'), 'utf8')).pageOrder.forEach((id, pi) => { const pj = JSON.parse(fs.readFileSync(path.join(D, id, 'page.json'), 'utf8')), vd = path.join(D, id, 'visuals');
      if (fs.existsSync(vd)) fs.readdirSync(vd).forEach((n) => out.push(Object.assign(JSON.parse(fs.readFileSync(path.join(vd, n, 'visual.json'), 'utf8')), { page: pj, pi }))); }); return out; };
  const typeOf = (v) => (v.visual || {}).visualType || (v.visualGroup ? 'group' : '?');

  // ---------- D16: a model with no time axis gets a layout made for it ----------
  {
    const k = (opt) => get(() => E.computeSlots(design({ preset: 'exec', page: '1920x1080' }).layout, 'en', opt));
    const s = k({ noTime: true }), kinds = Array.isArray(s) ? s.map((x) => x.kind).join() : s;
    const bar = Array.isArray(s) && s.find((x) => x.kind === 'bar'), colm = Array.isArray(s) && s.find((x) => x.kind === 'column'), tab = Array.isArray(s) && s.find((x) => x.kind === 'table');
    chk(() => kinds === 'title,logo,kpi,kpi,kpi,kpi,bar,column,table' && bar.y === colm.y && tab.y > bar.y && tab.w > bar.w + colm.w, () => `D16: the executive layout without a time axis: the bar and column charts share the first row, the table the second, full width: ${kinds} ${JSON.stringify([bar, colm, tab].map((x) => x && [x.x, x.y, x.w, x.h]))}`);
    const f = get(() => E.computeSlots(design({ preset: 'focus', kpis: 3 }).layout, 'en', { noTime: true }).map((x) => x.kind).join());
    chk(() => f === 'title,logo,kpi,kpi,kpi,bar,text', () => `D16: the single-focus layout's hero chart is a bar chart without a time axis: ${f}`);
    chk(() => JSON.stringify(k({})) === JSON.stringify(k(undefined)) && k({}).some((x) => x.kind === 'line'), () => 'D16: with a time axis nothing changes');
    const x = await ask('create_report', { path: 's-loans', name: 'S no time', design: design({ preset: 'exec' }), secondPage: false });
    const vs = visualsOf(x, 's-loans').filter((v) => /Chart$/.test(typeOf(v))), pw = x.j && x.j.pages && x.j.pages[0].width;
    chk(() => !x.err && vs.length >= 2 && vs.every((v) => v.position.width < 0.6 * pw), () => `D16: create_report on a model without a date: no chart across the page (${vs.map((v) => typeOf(v) + ' ' + Math.round(v.position.width)).join(', ')} of ${pw}): ${short(x)}`);
  }

  // ---------- S7: the rows under a shortened filter rail take the rail's column ----------
  {
    const l = design({ preset: 'analysis', page: '1920x1080', filters: true, fpos: 'start' }).layout, pages = E.projectPages(l, 'en', {});
    const R = { n: 3, minH: 56, maxH: 114, resetH: 40, pad: 15, gap: 12 }, fit = get(() => E.fitSlots(pages[0].slots, { railItems: R }).slots);
    const rail = fit.find((x) => x.kind === 'slicer'), tab = fit.find((x) => x.kind === 'table');
    chk(() => rail.h < 600 && tab.x === rail.x && tab.y >= rail.y + rail.h, () => `S7: under the shortened rail the table takes the rail's column: rail ${JSON.stringify(rail && [rail.x, rail.y, rail.w, rail.h])}, table ${JSON.stringify(tab && [tab.x, tab.y, tab.w, tab.h])}`);
    const end = E.projectPages(design({ preset: 'analysis', page: '1920x1080', filters: true, fpos: 'end' }).layout, 'en', {})[0].slots, fe = get(() => E.fitSlots(end, { railItems: R }).slots);
    const re = fe.find((x) => x.kind === 'slicer'), te = fe.find((x) => x.kind === 'table');
    chk(() => te.x + te.w === re.x + re.w, () => `S7: a rail at the end: the table reaches the page's end edge: ${JSON.stringify([re.x, re.w, te.x, te.w])}`);
  }

  // ---------- S5/D19: a category chart holds the categories its slot can show: Top N, said in the plan ----------
  {
    const sl = E.projectPages(design({ preset: 'exec', page: '1920x1080' }).layout, 'en', {})[0].slots, bar = sl.find((x) => x.kind === 'bar'), colm = sl.find((x) => x.kind === 'column');
    const rows = Math.floor((bar.h / 1.5 - 45 - 8 - 38) / 22.2);
    chk(() => bar.topN === rows && Number.isInteger(colm.topN) && colm.topN >= 3 && colm.topN <= 12, () => `S5: the bar slot holds ${rows} rows (22.2 a row, 45 above, 8 below, 38 for the axis, measured), the column slot its own number: ${bar.topN}, ${colm.topN}`);
    chk(() => E.CATEGORY_FIT && /22\.2/.test(E.CATEGORY_FIT.bar) && /GUESS|laptop/i.test(E.CATEGORY_FIT.column), () => 'S5: the numbers say where they come from (the column rule is a guess until measured)');
    const pl = await ask('plan_layout', { layout: 'exec', path: 's-loans' }), pb = pl.j && pl.j.slots.find((x) => x.kind === 'bar');
    chk(() => pb && pb.topN === rows && JSON.stringify(pl.j).includes('Top ' + rows), () => `S5: plan_layout gives each category chart's top N and says it: ${short(pl)}`);
    const x = await ask('create_report', { path: 's-loans', name: 'S top n', design: design({ preset: 'analysis' }), secondPage: false, fields: { category: 'loans[BranchName]' } });
    // (design round 10, N14: the Top N is kept by a report measure, "Keep: ...", not a fixed Top N filter)
    const tops = visualsOf(x, 's-loans').filter((v) => v.page.type !== 'Tooltip' && /(Bar|Column)Chart$/.test(typeOf(v))).map((v) => ((v.filterConfig || {}).filters || []).find((f) => f.type === 'TopN' || (f.field && f.field.Measure && /^Keep: /.test(f.field.Measure.Property))));
    chk(() => !x.err && tops.length && tops.every(Boolean) && (x.j.reportNotes || []).some((n) => /Top \d+/.test(n)), () => `S5: every bar and column chart by a category gets its Top N filter, said in the notes: ${tops.map(Boolean)} ${short(x)}`);
  }

  // ---------- S6: raw field names: the plan offers readable display names; the report uses the approved ones ----------
  {
    const pl = await ask('plan_layout', { layout: 'exec', path: 's-loans', lang: 'en', fields: ['loans[loan_intent]', 'loans[BranchName]', 'loans[Total Exposure]'] });
    // (design round 8, S6: the readable names are the plan's default, inThePlan, named in it for the user's go)
    const sug = pl.j && pl.j.displayNames && pl.j.displayNames.inThePlan;
    chk(() => sug && sug['loans[loan_intent]'] === 'Loan Intent' && sug['loans[BranchName]'] === 'Branch Name' && !('loans[Total Exposure]' in sug) && /plan/i.test(pl.j.displayNames.sayInPlan), () => `S6: plan_layout proposes readable names for raw ones, named in the plan: ${JSON.stringify(pl.j && pl.j.displayNames)}`);
    const x = await ask('create_report', { path: 's-loans', name: 'S names', design: design({ preset: 'exec' }), secondPage: false, fields: { category: 'loans[loan_intent]' }, displayNames: { 'loans[loan_intent]': 'Loan Intent' } });
    const titles = JSON.stringify(visualsOf(x, 's-loans').map((v) => (v.visual || {}).visualContainerObjects || {}));
    chk(() => !x.err && /Loan Intent/.test(titles) && !/by loan_intent/.test(titles), () => `S6: the titles use the approved name: ${titles.slice(0, 300)}`);
    // (design round 8, the re-score's S6: the plan's default is the readable name, named in the plan; the user who wants the
    // model's own name gives it, and the plan keeps it)
    const y = await ask('create_report', { path: 's-loans', name: 'S names raw', design: design({ preset: 'exec' }), secondPage: false, fields: { category: 'loans[loan_intent]' }, displayNames: { 'loans[loan_intent]': 'loan_intent' } });
    chk(() => !y.err && /loan_intent/.test(JSON.stringify(visualsOf(y, 's-loans').map((v) => (v.visual || {}).visualContainerObjects || {}))), () => 'S6: a name the user keeps is kept (the raw name, given in displayNames)');
  }

  // ---------- the second sweep (DETAIL-2): T4, T5, A2: a chart's tooltip shows the hovered chart's own measure, by another category ----------
  {
    // a shop with a month (the trend tooltip) and one without (the category tooltip only), made-up names
    model('s-shop', [{ name: 'shop', partitions: mp('shop'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Product', 'string'), col('Channel', 'string'), col('Month', 'string')],
      measures: [{ name: 'Revenue', expression: 'SUM ( shop[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( shop )', formatString: '#,0' }, { name: 'Units', expression: 'SUM ( shop[Amount] ) * 2', formatString: '#,0' }] }]);
    const role = (v, r) => ((((v.visual || {}).query || {}).queryState || {})[r] || { projections: [] }).projections.map((p) => JSON.stringify(p.field));
    const lit = (x) => String(x && x.expr && x.expr.Literal && x.expr.Literal.Value || '').replace(/^'|'$/g, '');
    const tipsOf = (x, dir) => { const vs = visualsOf(x, dir), out = [];
      vs.filter((v) => v.page.type !== 'Tooltip' && /Chart$/.test(typeOf(v))).forEach((v) => { const t = (((v.visual.visualContainerObjects || {}).visualTooltip || [])[0] || {}).properties || {};
        const page = vs.filter((w) => w.page.name === lit(t.section) && w.page.type === 'Tooltip'), card = page.find((w) => typeOf(w) === 'cardVisual'), bar = page.find((w) => typeOf(w) === 'clusteredBarChart');
        out.push({ chart: typeOf(v) + ' on ' + v.page.displayName, linked: lit(t.type) === 'Canvas' ? lit(t.section) : null, y: role(v, 'Y')[0], cat: role(v, 'Category')[0], card: card && role(card, 'Data')[0], barY: bar && role(bar, 'Y')[0], barCat: bar && role(bar, 'Category')[0] }); });
      return out; };
    const name = (f) => (f || '').replace(/.*"Property":"([^"]*)".*/, '$1');
    for (const [dir, label] of [['s-loans', 'no month'], ['s-shop', 'a month']]) {
      const x = await ask('create_report', { path: dir, name: 'T45 ' + dir, design: design({ preset: 'ops' }), secondPage: true });
      const ts = tipsOf(x, dir), linked = ts.filter((t) => t.linked);
      chk(() => !x.err && linked.length && linked.every((t) => t.card === t.y && t.barY === t.y), () => `T4 (${label}): a chart's tooltip shows the hovered chart's own measure, in its card and its bars: ${linked.map((t) => `${t.chart}: ${name(t.y)} -> card ${name(t.card)}, bars ${name(t.barY)}`).join('; ')} ${x.err ? short(x) : ''}`);
      chk(() => !x.err && linked.length && linked.every((t) => t.barCat !== t.cat), () => `T5 (${label}): a tooltip's bars are never by the hovered chart's own category (one bar): ${linked.map((t) => `${t.chart} by ${name(t.cat)} -> bars by ${name(t.barCat)}`).join('; ')}`);
    }
    const ar = await ask('plan_layout', { layout: 'exec', path: 's-shop', lang: 'ar' }), say = ar.j && ar.j.arabicNames && ar.j.arabicNames.sayFirst;
    chk(() => /أعلى 6/.test(say || '') && /tooltip/i.test(say || ''), () => `A2: an Arabic plan with English measure names says the tooltip's «أعلى 6» title will mix the two scripts unless Arabic names are given: ${say}`);
  }

  // ---------- design round 8 (the laptop's re-score of the rc, RESCORE-1): N2, N3, S7, N6, S6 ----------
  {
    const extOf = (x, dir) => { if (x.err) return []; const f = path.join(ROOT, dir, x.j.report, 'definition', 'reportExtensions.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).entities.flatMap((e) => e.measures.map((m) => Object.assign({ t: e.name }, m))) : []; };
    // N2 and N3: a chart cut to its Top N says "Top N of M:" only when it leaves categories out (counted in the report, from
    // the data the tools never read), else its plain title; the plan says the rest are left out, with no "Other" bar
    const x = await ask('create_report', { path: 's-loans', name: 'R8 top', design: design({ preset: 'exec' }), secondPage: false });
    const vs = visualsOf(x, 's-loans').filter((v) => v.page.type !== 'Tooltip'), ext = extOf(x, 's-loans');
    // (design round 10, N14: kept by a report measure "Keep: ...", and the title counts the bars kept: "Top S of M")
    const keepF = (v) => ((v.filterConfig || {}).filters || []).find((f) => f.field && f.field.Measure && /^Keep: /.test(f.field.Measure.Property));
    const topped = vs.filter((v) => keepF(v));
    const titleM = (v) => { const t = (((v.visual.visualContainerObjects || {}).title || [])[0] || {}).properties || {}, m = t.text && t.text.expr && t.text.expr.Measure; return m && m.Expression.SourceRef.Schema === 'extension' ? ext.find((e) => e.t === m.Expression.SourceRef.Entity && e.name === m.Property) : null; };
    chk(() => !x.err && topped.length >= 2 && topped.every((v) => { const m = titleM(v); return m && /REMOVEFILTERS/.test(m.expression) && /IF \( _s = _n, "[^"]*", "Top " & _s & " of " & _n/.test(m.expression); }),
      () => `N2/N3: a Top N chart's title is a report measure: "Top N of M: ..." only when more than N categories have a value, the plain title otherwise: ${topped.map((v) => JSON.stringify(titleM(v) && titleM(v).expression || (((v.visual.visualContainerObjects || {}).title || [])[0] || {}).properties)).join(' | ').slice(0, 600)} ${short(x)}`);
    chk(() => !x.err && vs.filter((v) => /Chart$/.test(typeOf(v))).every((v) => !/'Top \d+: /.test(JSON.stringify((v.visual.visualContainerObjects || {}).title || ''))), () => 'N2: no chart title is a fixed "Top N:" text');
    const pl = await ask('plan_layout', { layout: 'exec', path: 's-loans' }), say = JSON.stringify((pl.j || {}).categoryCharts || {}) + ' ' + ((pl.j || {}).topCategories || '');
    chk(() => /only when/i.test(say) && /Other/.test(say) && /of M|"Top \d+ of/.test(say), () => `N3: the plan says a chart shows "Top N of M" only when it leaves categories out, and that the rest are left out with no "Other" bar: ${say.slice(0, 400)}`);
    chk(() => (x.j.reportNotes || []).some((n) => /Top \d+ of/.test(n) && /only when/i.test(n)), () => `N3: the report's notes say it too: ${JSON.stringify((x.j || {}).reportNotes || []).slice(0, 300)}`);

    // S7: the rail stays as high as its contents (the owner's round-12 rule #18, kept by the reviewer on 12 Oct); the page
    // reflows so nothing large stays empty under it (round 8: the chart beside ends at the rail; round 9: or it starts
    // under the rail and takes its column, whichever keeps half its height)
    const underRail = (sl) => { const r = sl.find((x) => x.kind === 'slicer' && x.stack), bottom = Math.max(...sl.map((x) => x.y + x.h));
      const tops = sl.filter((x) => x !== r && x.x < r.x + r.w && x.x + x.w > r.x && x.y >= r.y + r.h).map((x) => x.y); return (tops.length ? Math.min(...tops) : bottom) - (r.y + r.h); };
    for (const n of [1, 2, 3]) for (const [preset, pi] of [['analysis', 0], ['exec', 1]]) {
      const pp = E.projectPages(design({ preset, page: '1920x1080', filters: true, fpos: 'start' }).layout, 'en', { second: true })[pi].slots;
      const ff = get(() => E.fitSlots(pp, { railItems: { n, minH: 56, maxH: 114, resetH: 40, pad: 15, gap: 12 } }).slots), rail = ff.find((x) => x.kind === 'slicer');
      chk(() => rail.h <= 2 * 15 + n * 114 + 12 * n + 40 && underRail(ff) <= 40, () => `S7 (${preset} page ${pi + 1}, ${n} dropdowns): the rail fits its contents (#18) and nothing large stays empty under it: ${underRail(ff)} empty, ${JSON.stringify(ff.filter((x) => !['title', 'logo', 'kpi'].includes(x.kind)).map((x) => [x.kind, x.x, x.y, x.w, x.h]))}`);
    }
    model('s-one', [{ name: 'desk', partitions: mp('desk'), columns: [col('Amount', 'double'), col('Region', 'string')], measures: [{ name: 'Revenue', expression: 'SUM ( desk[Amount] )', formatString: '#,0' }] }]);
    const z = await ask('create_report', { path: 's-one', name: 'R8 rail', design: design({ preset: 'exec', page: '1920x1080', filters: true, fpos: 'start' }), secondPage: true });
    const pv = visualsOf(z, 's-one').filter((v) => v.pi === 1), at = (v) => { const g = v.parentGroupName ? pv.find((w) => w.name === v.parentGroupName) : null; return { y: v.position.y + (g ? g.position.y : 0), h: v.position.height }; };
    const sl = pv.filter((v) => typeOf(v) === 'slicer').map(at), btn = pv.filter((v) => typeOf(v) === 'actionButton' && /Bookmark/.test(JSON.stringify(v.visual.visualContainerObjects || {}))).map(at)[0];
    chk(() => !z.err && sl.length >= 1 && btn && btn.y - Math.max(...sl.map((v) => v.y + v.h)) <= 30, () => `S7: Reset sits right under the dropdowns (#18): ${JSON.stringify([sl, btn])} ${short(z)}`);

    // N6: on page 1 the table's panel ends where the chart beside it ends; its rows stay whole (the slack in their padding)
    const w = await ask('create_report', { path: 's-shop', name: 'R8 table', design: design({ preset: 'exec', page: '1920x1080' }), secondPage: false, fields: { table: ['shop[Product]', 'shop[Revenue]', 'shop[Orders]'] } });
    const p1 = visualsOf(w, 's-shop').filter((v) => v.pi === 0), tb = p1.find((v) => typeOf(v) === 'tableEx'), nb = tb && p1.find((v) => /Chart$/.test(typeOf(v)) && Math.abs(v.position.y - tb.position.y) <= 1);
    // (changed in writer round 8, the reviewer's resolution of 12 Oct with the writer's S3: the PANEL behind the table keeps the
    // slot's height and ends where the chart beside it ends; the table visual inside it ends on its whole rows, measured)
    const pn = tb && p1.find((v) => v !== tb && /^(cardVisual|textbox)$/.test(typeOf(v)) && v.position.x === tb.position.x && v.position.y === tb.position.y && v.position.z < tb.position.z);
    chk(() => !w.err && tb && nb && pn && Math.abs(pn.position.y + pn.position.height - nb.position.y - nb.position.height) <= 1 && tb.position.height <= pn.position.height, () => `N6: the table's panel ends where the chart beside it ends, the table inside it: ${JSON.stringify(tb && tb.position)} ${JSON.stringify(pn && pn.position)} ${JSON.stringify(nb && nb.position)} ${short(w)}`);

    // S6: the plan's default display names are the readable ones, named in the plan, and the report uses them
    const pd = await ask('plan_layout', { layout: 'exec', path: 's-loans', planFields: { category: 'loans[loan_intent]' } }), dn = (pd.j || {}).displayNames || {};
    chk(() => dn.inThePlan && dn.inThePlan['loans[loan_intent]'] === 'Loan Intent' && /plan/i.test(dn.sayInPlan || ''), () => `S6: the plan shows the readable names as its default: ${JSON.stringify(dn).slice(0, 300)}`);
    const d = await ask('create_report', { path: 's-loans', name: 'R8 names', design: design({ preset: 'exec' }), secondPage: false, fields: { category: 'loans[loan_intent]' } });
    const dt = JSON.stringify(visualsOf(d, 's-loans').map((v) => ((v.visual || {}).visualContainerObjects || {}).title || '')) + JSON.stringify(extOf(d, 's-loans'));
    chk(() => !d.err && /Loan Intent/.test(dt) && !/by loan_intent/.test(dt), () => `S6: the report shows the plan's names: ${dt.slice(0, 300)} ${short(d)}`);
  }

  // ---------- design round 9 (the laptop's RESCORE-2 on rc.4): S7 page 2, D19, D11 ----------
  {
    // S7 (round 9): page 2 keeps the filter side asked (the owner's O-1) and ends with the table beside a bar chart, so a
    // table of few rows leaves half a row empty, not half a page; both sizes, both languages, each layout whose page 2 it is
    for (const pgSize of ['1280x720', '1920x1080']) for (const lang of ['en', 'ar']) for (const preset of ['exec', 'ops', 'focus']) {
      const ps = get(() => E.projectPages(design({ preset, page: pgSize }).layout, lang, { second: true })), p2 = Array.isArray(ps) && ps[1];
      const tb = p2 && p2.slots.find((x) => x.kind === 'table'), br = p2 && p2.slots.find((x) => x.kind === 'bar');
      chk(() => p2 && tb && br && Math.abs(tb.y - br.y) <= 1 && Math.abs(tb.h - br.h) <= 1 && tb.y + tb.h === Math.max(...p2.slots.map((x) => x.y + x.h)),
        () => `S7 (${preset} ${pgSize} ${lang}): page 2's last row is the table beside a bar chart: ${p2 ? JSON.stringify(p2.slots.map((x) => [x.kind, x.x, x.y, x.w, x.h])) : ps}`);
    }
    // D11 and D19: a made-up model with a yes/no column made by IF and a product name in its own table
    model('s-items', [{ name: 'Items', partitions: mp('Items'), columns: [col('Amount', 'double'), col('Region', 'string'), Object.assign(col('Size Band', 'string'), { type: 'calculated', expression: 'IF ( Items[Amount] > 100, "Large", "Small" )' }), col('ProductKey', 'int64')],
      measures: [{ name: 'Revenue', expression: 'SUM ( Items[Amount] )', formatString: '#,0' }] },
      { name: 'Products', partitions: mp('Products'), columns: [col('ProductKey', 'int64'), col('Product Name', 'string')] }]);
    const kinds = (x) => visualsOf(x, 's-items').filter((v) => v.page.type !== 'Tooltip' && v.pi === 0 && v.visual).map((v) => [typeOf(v), JSON.stringify(((v.visual.query || {}).queryState || {}).Category || '')]);
    const d11 = await ask('create_report', { path: 's-items', name: 'R9 two', design: design({ preset: 'exec' }), secondPage: false, fields: { measure: 'Items[Revenue]', category: 'Items[Size Band]', category2: 'Items[Region]' } });
    const byTwo = kinds(d11).filter(([, c]) => c.includes('Size Band')).map(([t]) => t);
    chk(() => !d11.err && byTwo.length && byTwo.every((t) => t === 'donutChart'), () => `D11: a chart by a two-valued category is a donut, not two bars in a wide slot: ${JSON.stringify(byTwo)} ${short(d11)}`);
    const d19 = await ask('create_report', { path: 's-items', name: 'R9 names', design: design({ preset: 'exec', page: '1920x1080' }), secondPage: false, fields: { measure: 'Items[Revenue]', category: 'Items[Region]', category2: 'Products[Product Name]' } });
    const vs19 = visualsOf(d19, 's-items').filter((v) => v.page.type !== 'Tooltip' && v.pi === 0 && v.visual), byName = vs19.filter((v) => JSON.stringify(((v.visual.query || {}).queryState || {}).Category || '').includes('Product Name') && /Chart$/.test(typeOf(v)));
    const share = (v) => +String(((((v.visual.objects || {}).categoryAxis || [])[0] || {}).properties || {}).maxMarginFactor && v.visual.objects.categoryAxis[0].properties.maxMarginFactor.expr.Literal.Value || '0').replace(/L$/, '');
    // (measured, REPORT-FIXES-LAB B1/B2: 40% of 508 held about 20 characters, 50% about 25: 10.2 page units a character at 1080)
    chk(() => !d19.err && byName.length && byName.every((v) => typeOf(v) === 'clusteredBarChart' && (share(v) === 50 || share(v) * v.position.width / 100 >= 25 * 10.2 * (d19.j.pages[0].height / 1080))),
      () => `D19: a chart by a product name is a bar chart, names level, with room for 25 characters where its width allows (50% at most): ${JSON.stringify(byName.map((v) => [typeOf(v), share(v), v.position.width]))} ${short(d19)}`);
  }

  // ---------- design round 10 (the laptop's RESCORE-3 on rc.5, final for 0.2.9): N14, N15, D19 ----------
  {
    const extOf10 = (x, dir) => { if (x.err) return []; const f = path.join(ROOT, dir, x.j.report, 'definition', 'reportExtensions.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).entities.flatMap((e) => e.measures) : []; };
    const x = await ask('create_report', { path: 's-loans', name: 'R10 top', design: design({ preset: 'exec', page: '1920x1080' }), secondPage: false });
    const vs = visualsOf(x, 's-loans').filter((v) => v.visual && /^clustered(Bar|Column)Chart$/.test(typeOf(v))), ext = extOf10(x, 's-loans');
    const keepOf = (v) => { const f = ((v.filterConfig || {}).filters || []).find((q) => q.field && q.field.Measure && q.field.Measure.Expression.SourceRef.Schema === 'extension' && /^Keep/.test(q.field.Measure.Property)); return f ? ext.find((m) => m.name === f.field.Measure.Property) : null; };
    const titleOf10 = (v) => { const t = (((v.visual.visualContainerObjects || {}).title || [])[0] || {}).properties || {}, m = t.text && t.text.expr && t.text.expr.Measure; return m ? ext.find((e) => e.name === m.Property) : null; };
    const report = vs.filter((v) => v.page.type !== 'Tooltip'), tips = vs.filter((v) => v.page.type === 'Tooltip' && ((v.filterConfig || {}).filters || []).some((q) => q.type === 'TopN'));
    const nOf = (k) => +((k.expression.match(/MIN \( _n, (\d+) \) = \1, (\d+), _n \)/) || [])[2] || NaN), capOf = (k) => +((k.expression.match(/MIN \( _n, (\d+) \)/) || [])[1] || NaN);
    // N14: a chart shows every category when they are at most 2 more than its rows; its Top N is a report measure, not a fixed Top N filter
    chk(() => !x.err && report.length >= 2 && report.every((v) => { const k = keepOf(v); return k && /RANKX/.test(k.expression) && capOf(k) === nOf(k) + 3 && !((v.filterConfig || {}).filters || []).some((q) => q.type === 'TopN'); }),
      () => `N14: each Top N chart keeps its categories with a report measure (rank within N, or all of them when they are N + 2 or fewer): ${report.map((v) => JSON.stringify(keepOf(v) && keepOf(v).expression.slice(0, 260))).join(' | ')} ${short(x)}`);
    // N14/N15: the title counts what is shown: "Top S of M" only when S < M (a tie shows as more), the plain title otherwise
    chk(() => report.concat(tips).every((v) => { const t = titleOf10(v); return t && /IF \( _s = _n, /.test(t.expression) && /RANKX/.test(t.expression); }),
      () => `N14/N15: the titles say Top only when the chart leaves categories out, with the number actually shown: ${report.concat(tips).map((v) => JSON.stringify(titleOf10(v) && titleOf10(v).expression.slice(-200))).join(' | ')}`);
    // N15: the tooltip's Top 6 is the same rule, without extra rows (a tooltip can't scroll)
    // (the tooltip keeps its fixed Top 6 filter, which keeps the same bars, ties too, and check_report's TOOLTIP_SCROLL reads)
    chk(() => tips.length >= 1 && tips.every((v) => { const t = titleOf10(v); return t && /MIN \( _n, 7 \) = 7, 6, _n \)/.test(t.expression); }), () => `N15: the tooltip's title counts its Top 6 with no extra rows: ${tips.map((v) => JSON.stringify(titleOf10(v) && titleOf10(v).expression.slice(0, 260))).join(' | ')}`);
    // D19: a bar chart cut to its Top N by a text category gets the measured name room (25 characters where 40% holds them, else 50%)
    const bars = report.filter((v) => typeOf(v) === 'clusteredBarChart' && keepOf(v)), share = (v) => +String((((v.visual.objects.categoryAxis || [])[0] || {}).properties || {}).maxMarginFactor.expr.Literal.Value).replace(/L$/, '');
    chk(() => bars.length && bars.every((v) => share(v) === 50 || share(v) * v.position.width / 100 >= 25 * 10.2 * (x.j.pages[0].height / 1080)), () => `D19: a bar chart cut to its Top N gives its names the measured room: ${JSON.stringify(bars.map((v) => [share(v), v.position.width]))}`);
  }

  // ---------- the owner's decision on layouts (12 Oct, after LAYOUT-SWEEP-RC6): three setups ship as preview ----------
  {
    const LINE = 'Preview: this layout is still being tuned on real dashboards; the executive and single-focus layouts are the tested ones.';
    const prev = async (args) => { const p = await ask('plan_layout', Object.assign({ path: 's-shop' }, args)); return { p, line: p.j && p.j.preview }; };
    for (const [args, want] of [[{ layout: 'ops' }, true], [{ layout: 'analysis' }, true], [{ layout: 'exec', page: '1280x720', filters: 'top' }, true], [{ layout: 'exec', page: '960x720', filters: 'top' }, true],
      [{ layout: 'exec' }, false], [{ layout: 'exec', page: '1920x1080', filters: 'top' }, false], [{ layout: 'exec', page: '1280x720', filters: 'end' }, false], [{ layout: 'focus' }, false], [{ layout: 'focus', page: '1280x720', filters: 'top' }, true]]) {
      const { p, line } = await prev(args);
      chk(() => !p.err && p.j.plan && p.j.plan.planId && (want ? line === LINE : line === undefined), () => `preview (${JSON.stringify(args)}): the plan says the preview line ${want ? 'once' : 'never'}, and nothing is refused: ${JSON.stringify(line)} ${short(p)}`);
    }
    const { line: ar } = await prev({ layout: 'ops', lang: 'ar' });
    chk(() => typeof ar === 'string' && /^معاينة/.test(ar) && /[\u0600-\u06FF]/.test(ar) && !/[A-Za-z]/.test(ar), () => `preview: the Arabic plan says it in Arabic: ${ar}`);
    const readme = fs.readFileSync(path.join(HERE, 'README.md'), 'utf8');
    const row = (name) => (readme.split('\n').find((l) => l.includes(name) && /preview/i.test(l)) || '');
    chk(() => readme.includes(LINE) && row('Operations monitor') && row('Analysis') && !/\b(first|only|unique)\b[^.\n]*(layout|tool|report)/i.test(readme.split('\n').filter((l) => /preview/i.test(l)).join('\n')),
      () => `preview: mcp/README.md marks Operations monitor and Analysis as preview, with the same line: ${row('Operations monitor')} | ${row('Analysis')}`);
  }

  // ---------- polish round P1 (the owner's go, 12 Oct; RESCORE-5 and B-71/B-72): colour ----------
  {
    const D = await import('./lib/design.mjs');
    const rt = (painted, themeColours, extra) => ({ report: 'R', theme: Object.assign({ name: 'Custom', themeColours: themeColours || [], painted }, extra || {}) });
    const hue = (c) => E.hexToHsl(c)[0], card = '#ffffff';
    // 1. a status colour is never the lead: only red and green found (inspection), the default lead, said in the plan
    const st = D.themeColours(rt(['#D64554', '#6ACC84']), 'en');
    chk(() => st.data[0] === E.PRESETS.Corporate.data[0] && st.ui.bad.toLowerCase() === '#d64554' && st.ui.good.toLowerCase() === '#6acc84' && /status/i.test(JSON.stringify(st.info)),
      () => `P1-1: only status colours found: the default lead, the red and green as bad and good, said in the plan: ${JSON.stringify([st.data[0], st.ui, st.info]).slice(0, 400)}`);
    const mixd = D.themeColours(rt(['#D64554', '#1F77B4']), 'en');
    chk(() => mixd.data[0].toLowerCase() === '#1f77b4', () => `P1-1: a status colour found first gives the lead to the next colour: ${mixd.data.slice(0, 3)}`);
    const th = D.themeColours(rt([], ['#C62828', '#0D6E8C'], { bad: '#C62828' }), 'en');
    chk(() => th.data[0].toLowerCase() === '#0d6e8c', () => `P1-1: the theme's own bad colour is never the lead: ${th.data.slice(0, 3)}`);
    // 3. a pale lead (under 3:1 on the card) is darkened, keeping its hue, to 3:1 for lines, bars and accents; the plan names it
    const pale = D.themeColours(rt(['#20E2D7']), 'en');
    chk(() => E.contrast(pale.data[0], card) >= 3 && Math.abs(hue(pale.data[0]) - hue('#20E2D7')) <= 6 && JSON.stringify(pale.info).includes('#20E2D7') && /3:1/.test(JSON.stringify(pale.info)),
      () => `P1-3: a pale lead darkened to 3:1, its hue kept, the change named: ${pale.data[0]} ${E.contrast(pale.data[0], card).toFixed(2)}:1 ${JSON.stringify(pale.info).slice(0, 300)}`);
    // explicit colours win: a brand colour given is used exactly, pale or not
    const brand = D.themeDesign({ brand: '#20E2D7' });
    chk(() => brand.design.data[0].toLowerCase() === '#20e2d7', () => `P1: an explicit brand colour wins, exactly: ${brand.design.data[0]}`);
    // 4. greys from the theme's text colour for axes and gridlines (never Power BI's default grey)
    // (with a chart style chosen: "Power BI default", every setting auto, writes no chart settings, the website's promise)
    const des = E.repairState({ name: 'G', font: 'Segoe UI', data: E.PRESETS.Corporate.data.slice(), ui: Object.assign({}, E.PRESETS.Corporate.ui, { text: '#2b1d3a' }), chart: { labels: 'on' }, layout: { v: 3 } });
    const plain = E.buildTheme(E.repairState({ name: 'G', font: 'Segoe UI', data: E.PRESETS.Corporate.data.slice(), ui: E.PRESETS.Corporate.ui, layout: { v: 3 } }), 'en');
    chk(() => !JSON.stringify(plain.visualStyles.clusteredColumnChart || {}).includes('labelColor'), () => `P1-4: "Power BI default" writes no axis greys: ${JSON.stringify(plain.visualStyles.clusteredColumnChart || {}).slice(0, 200)}`);
    const tj = E.buildTheme(des, 'en'), R0 = E.roles(des.ui), cc = ((tj.visualStyles.clusteredColumnChart || {})['*']) || {};
    // the gridlines' grey is the report writer's quiet grid (text mixed 0.85 into the card): the theme leaves the gridline
    // colour out, or the writer's grey would be switched off (pbip-export.js themeGrid)
    chk(() => JSON.stringify(cc.categoryAxis || '').includes(R0.secondary) && JSON.stringify(cc.valueAxis || '').includes(R0.secondary) && !/gridline/.test(JSON.stringify(cc.valueAxis || '')),
      () => `P1-4: the column chart's axis labels take the grey mixed from the theme's text colour, the gridlines left to the writer's quiet grid: ${JSON.stringify([cc.valueAxis, cc.categoryAxis]).slice(0, 300)}`);
    // (P1+, the laptop's LAB-POLISH section 5, measured in Desktop, 12 Oct) (b) the second chart takes the palette's next
    // DISTINCT colour, chosen: a hue at least 30 degrees from the lead and 3:1 on the card (Corporate's colour 2 is the
    // lead's own blue, lighter: the page stayed one colour), not blindly data colour 2
    const pick = E.secondColour && E.secondColour(E.PRESETS.Corporate.data, card), hd = (a, b) => { const x = Math.abs(hue(a) - hue(b)) % 360; return Math.min(x, 360 - x); };
    chk(() => !!pick && hd(pick, E.PRESETS.Corporate.data[0]) >= 30 && E.contrast(pick, card) >= 3 && pick.toLowerCase() === '#c55a11',
      () => `P1+b: the second colour is chosen, a distinct hue at 3:1 on the card: ${pick}`);
    const darkened = E.secondColour && E.secondColour(['#1f4e79', '#2e75b6', '#ffd966', '#9dc3e6', '#bdd7ee', '#ddebf7', '#5b9bd5', '#4472c4'], card);
    chk(() => !!darkened && hd(darkened, '#ffd966') <= 6 && E.contrast(darkened, card) >= 3,
      () => `P1+b: no distinct colour at 3:1: the first distinct one darkened to 3:1, its hue kept: ${darkened}`);
    // (d) a 6% tint of the lead as the page background on a light design (the cards stay as they are); never on a dark
    // design, never over a background the user asked for, off with pageTint: false; the plan names it
    const T = D.themeDesign({}), lead = T.design.data[0], tint = E.mix(T.design.ui.card, lead, 0.06);
    chk(() => T.design.ui.background === tint && T.design.ui.card === E.PRESETS.Corporate.ui.card && T.notes.some((n) => n.includes(tint) && /6%/.test(n)),
      () => `P1+d: a light design's page is a 6% tint of the lead (${tint}), named: ${T.design.ui.background} ${JSON.stringify(T.notes).slice(0, 300)}`);
    const Tb = D.themeDesign({ brand: '#0F766E' });
    chk(() => Tb.design.ui.background === E.mix(Tb.design.ui.card, '#0f766e', 0.06), () => `P1+d: a brand's light page is the brand's 6% tint: ${Tb.design.ui.background}`);
    const Td = D.themeDesign({ mode: 'dark' }), Tp = D.themeDesign({ palette: { data: E.PRESETS.Corporate.data, ui: Object.assign({}, E.PRESETS.Corporate.ui, { background: '#ffffff' }) } }), To = D.themeDesign({ pageTint: false });
    chk(() => Td.design.ui.background === E.PRESETS.DataArcus.ui.background && Tp.design.ui.background === '#ffffff' && To.design.ui.background === E.PRESETS.Corporate.ui.background,
      () => `P1+d: no tint on a dark design, over an asked background or with pageTint false: ${Td.design.ui.background} ${Tp.design.ui.background} ${To.design.ui.background}`);
    // 2. the second palette colour is used: the second bar or column chart of a page takes colour 2 (P1+: the chosen one)
    const two = await ask('create_report', { path: 's-shop', name: 'P1 colours', design: design({ preset: 'exec', page: '1920x1080' }), secondPage: false });
    const grads = visualsOf(two, 's-shop').filter((v) => v.visual && v.page.type !== 'Tooltip' && /^clustered(Bar|Column)Chart$/.test(typeOf(v))).sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x).map((v) => JSON.stringify(((v.visual.objects || {}).dataPoint) || ''));
    const C = E.PRESETS.Corporate.data.map((c) => c.toLowerCase());
    const C2 = String(E.secondColour ? E.secondColour(E.PRESETS.Corporate.data, card) : C[1]).toLowerCase();
    chk(() => !two.err && grads.length >= 2 && grads[0].includes(C[0]) && grads[1].includes(C2) && !grads[1].includes(C[0]),
      () => `P1-2: the first bar or column chart takes colour 1, the second colour 2: ${grads.map((g) => (g.match(/#[0-9a-f]{6}/g) || []).join('/')).join(' | ')} ${short(two)}`);
    const sc = ((two.j || {}).chartColors || {}).second || {};
    chk(() => !two.err && sc.charts >= 1 && String(sc.colour).toLowerCase() === C2 && grads[1].includes(String(sc.high).toLowerCase()),
      () => `P1-2: the answer tells the second colour's charts and ends: ${JSON.stringify((two.j || {}).chartColors).slice(0, 400)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029s-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await v029sweep({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029sweep  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029sweep  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
