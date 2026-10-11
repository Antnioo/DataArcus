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
    const tops = visualsOf(x, 's-loans').filter((v) => v.page.type !== 'Tooltip' && /(Bar|Column)Chart$/.test(typeOf(v))).map((v) => ((v.filterConfig || {}).filters || []).find((f) => f.type === 'TopN'));
    chk(() => !x.err && tops.length && tops.every(Boolean) && (x.j.reportNotes || []).some((n) => /Top \d+/.test(n)), () => `S5: every bar and column chart by a category gets its Top N filter, said in the notes: ${tops.map(Boolean)} ${short(x)}`);
  }

  // ---------- S6: raw field names: the plan offers readable display names; the report uses the approved ones ----------
  {
    const pl = await ask('plan_layout', { layout: 'exec', path: 's-loans', lang: 'en', fields: ['loans[loan_intent]', 'loans[BranchName]', 'loans[Total Exposure]'] });
    const sug = pl.j && pl.j.displayNames && pl.j.displayNames.suggestedDisplayNames;
    chk(() => sug && sug['loans[loan_intent]'] === 'Loan Intent' && sug['loans[BranchName]'] === 'Branch Name' && !('loans[Total Exposure]' in sug) && /approve/i.test(pl.j.displayNames.sayFirst), () => `S6: plan_layout proposes readable names for raw ones, for the user to approve: ${JSON.stringify(pl.j && pl.j.displayNames)}`);
    const x = await ask('create_report', { path: 's-loans', name: 'S names', design: design({ preset: 'exec' }), secondPage: false, fields: { category: 'loans[loan_intent]' }, displayNames: { 'loans[loan_intent]': 'Loan Intent' } });
    const titles = JSON.stringify(visualsOf(x, 's-loans').map((v) => (v.visual || {}).visualContainerObjects || {}));
    chk(() => !x.err && /Loan Intent/.test(titles) && !/by loan_intent/.test(titles), () => `S6: the titles use the approved name: ${titles.slice(0, 300)}`);
    const y = await ask('create_report', { path: 's-loans', name: 'S names raw', design: design({ preset: 'exec' }), secondPage: false, fields: { category: 'loans[loan_intent]' } });
    chk(() => !y.err && /loan_intent/.test(JSON.stringify(visualsOf(y, 's-loans').map((v) => (v.visual || {}).visualContainerObjects || {}))), () => 'S6: without the user\'s go no name is changed (the raw name stays)');
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
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029s-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await v029sweep({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029sweep  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029sweep  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
