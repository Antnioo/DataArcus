// 0.3, J4 story titles + B-130 / B-131 (written red first, 18 Oct 2026): a visual's title says what it answers, from
// the model's metadata only (assets/js/story-titles.js), unique on its page without "(2)", shortened by rule to its box
// and never cut in a word.
//   ST-1  the engine: time intelligence in words (EN, AR), the shortening rules, the alternates, no judgement words
//   ST-2  golden models through create_report: no "(n)" in any title or alt text, no "KPI n" / «مؤشر n» title, every
//         chart's and table's title unique on its page
//   ST-3  B-131: the Arabic long names on the ops layout (narrow charts): no chart or KPI title shortened with "…"
//   ST-4  the planned page (plan_layout's in-memory page, lib/plan-lint.mjs) has no "KPI 2/3/4" card on a model with
//         fewer measures than cards
//   ST-5  time intelligence end to end: "Sales PY" on a card reads "Sales last year"; a chart "Sales vs last year by Region"
//   node test-0.3-story-titles.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-st-'));
process.env.DATAARCUS_ROOT = ROOT;
const cp = (from, to) => fs.cpSync(path.join(REPO, from), path.join(ROOT, to), { recursive: true });
cp('mcp/test-models/arabic-long-names', 'arabic'); cp('mcp/fixtures/health-project', 'health'); cp('mcp/test-models/no-measures', 'plain');
cp('mcp/test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');
cp('scripts/tests/fixtures/model-health/tmdl-ramadan/definition', 'ramadan/Ramadan Test.SemanticModel/definition');
fs.writeFileSync(path.join(ROOT, 'ramadan/Ramadan Test.SemanticModel/definition.pbism'), '{ "version": "4.0", "settings": {} }');
// ST-5's model: time intelligence written as abbreviations
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
fs.mkdirSync(path.join(ROOT, 'ti/TI.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'ti/TI.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'Region', dataType: 'string', sourceColumn: 'Region' }, { name: 'Date', dataType: 'dateTime', sourceColumn: 'Date' }],
    measures: [{ name: 'Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Sales PY', expression: '[Sales]', formatString: '#,0' },
      { name: 'Sales vs PY', expression: '[Sales] - [Sales PY]', formatString: '#,0' }, { name: 'Sales YTD', expression: '[Sales]', formatString: '#,0' }] }] } }));

const ST = req('../assets/js/story-titles.js');
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const titleOf = (v) => { const t = ((v.visual.visualContainerObjects || {}).title || [])[0]; return t && lit(t.properties.show) === 'true' ? (lit(t.properties.text) || '[measure]') : null; };
const altOf = (v) => lit(((((v.visual.visualContainerObjects || {}).general || [])[0] || {}).properties || {}).altText);
const pagesOf = (dir) => { const d = path.join(dir, 'definition/pages');
  return rd(path.join(d, 'pages.json')).pageOrder.map((id) => ({ page: rd(path.join(d, id, 'page.json')), visuals: fs.existsSync(path.join(d, id, 'visuals')) ? fs.readdirSync(path.join(d, id, 'visuals')).map((v) => rd(path.join(d, id, 'visuals', v, 'visual.json'))).filter((v) => v.visual) : [] })); };

const s = await serverClient(ROOT, {});
const report = async (args, plan) => {
  const pl = await s.call('plan_layout', Object.assign({}, plan || {}, { path: args.path, name: args.name, secondPage: true }, args.lang ? { lang: args.lang } : {}, args.focus ? { focus: args.focus } : {}, args.pages ? { pages: args.pages } : {}, args.fields ? { planFields: args.fields } : {}));
  if (!pl.j || !pl.j.plan || !pl.j.plan.planId) return { pl, r: pl };
  await s.call('approve_plan', { planId: pl.j.plan.planId });
  const r = await s.call('create_report', Object.assign({}, args, { planId: pl.j.plan.planId }, args.pages ? {} : { design: pl.j.design }));
  return { pl, r };
};

try {
  // ---------- ST-1: the engine ----------
  {
    const tw = (x) => ST.timeWords(x);
    chk(() => tw('Sales PY') === 'Sales last year' && tw('PY Sales') === 'Sales last year' && tw('Sales_YTD') === 'Sales year to date' && tw('Sales (MTD)') === 'Sales month to date',
      () => `ST-1a. PY/YTD/MTD said in words: ${JSON.stringify([tw('Sales PY'), tw('PY Sales'), tw('Sales_YTD'), tw('Sales (MTD)')])}`);
    chk(() => tw('Sales vs PY') === 'Sales vs last year' && tw('Sales YoY %') === 'Sales vs last year %' && tw('Total Sales vs Last Ramadan %') === 'Total Sales vs Last Ramadan %' && tw('Total Sales Last Year') === 'Total Sales Last Year',
      () => `ST-1b. "vs PY", "YoY"; names in words kept as they are: ${JSON.stringify([tw('Sales vs PY'), tw('Sales YoY %'), tw('Total Sales vs Last Ramadan %'), tw('Total Sales Last Year')])}`);
    chk(() => tw('المبيعات YTD') === 'المبيعات منذ بداية العام' && tw('المبيعات PY') === 'المبيعات في العام الماضي' && tw('المبيعات vs PY') === 'المبيعات مقارنة بالعام الماضي',
      () => `ST-1c. an Arabic name's abbreviations in Arabic words: ${JSON.stringify([tw('المبيعات YTD'), tw('المبيعات PY'), tw('المبيعات vs PY')])}`);
    chk(() => tw('Pypy Sales') === 'Pypy Sales' && tw('Sales') === 'Sales' && tw('PY') === 'PY', () => `ST-1d. no change without a whole abbreviation word: ${JSON.stringify([tw('Pypy Sales'), tw('PY')])}`);
    // the shortening rules, in order; never a cut word
    const v = ST.variants({ t: 'Shipments', m: 'Shipments Total Net Amount' }, { t: 'Lanes', c: 'Lane Region Name' }, 'by');
    chk(() => JSON.stringify(v.map((x) => x.text)) === JSON.stringify(['Shipments Total Net Amount by Lane Region Name', 'Total Net Amount by Lane Region Name', 'Total Net Amount by Lane Region', 'Net Amount by Lane Region']),
      () => `ST-1e. table prefix, then "Name", then "Total": ${JSON.stringify(v.map((x) => x.text))}`);
    const a = ST.variants({ t: 'المبيعات', m: 'إجمالي صافي المبيعات بعد الخصومات والمرتجعات' }, { t: 'الفروع', c: 'قناة البيع المستخدمة في إتمام العملية' }, 'حسب');
    chk(() => a[0].text === 'إجمالي صافي المبيعات بعد الخصومات والمرتجعات حسب قناة البيع المستخدمة في إتمام العملية' && a[a.length - 1].text === 'صافي المبيعات حسب قناة البيع',
      () => `ST-1f. Arabic: «إجمالي» dropped, then the trailing clauses: ${JSON.stringify(a.map((x) => x.text))}`);
    const words = (t) => new Set(String(t).split(/\s+/));
    const full = words(a[0].text);
    chk(() => a.every((x) => [...words(x.text)].every((w) => full.has(w))) && v.every((x) => [...words(x.text)].every((w) => words(v[0].text).has(w))), () => 'ST-1g. every shortened title is made of whole words of the full one');
    chk(() => ST.variants({ t: 'S', m: 'Total net sales' }, null, 'by').map((x) => x.text).includes('Net sales'), () => 'ST-1m. a name left after "Total" starts with a capital ("Net sales")');
    chk(() => ST.variants({ t: 'S', m: 'Total Sales', name: 'Total Sales Display' }, { t: 'R', c: 'Region' }, 'by').every((x) => x.m === 'Total Sales Display'), () => 'ST-1h. the user\'s display name is never rewritten');
    chk(() => ST.join('Total Sales', 'Region', 'by') === 'Total Sales by Region' && ST.join('إجمالي المبيعات', 'المنطقة', 'حسب') === 'إجمالي المبيعات حسب المنطقة' && ST.join('عدد Order Id', 'Region', 'حسب') === 'عدد Order Id',
      () => 'ST-1i. "M by C", «M حسب C», and one script per title');
    const alts = [2, 3, 4].map((n) => ST.alternate('Total', 'Note', n, true, 'by')), altAr = [2, 3].map((n) => ST.alternate('إجمالي المبيعات', 'المنطقة', n, true, 'حسب'));
    chk(() => JSON.stringify(alts) === JSON.stringify(['Note ranked by Total', 'Total per Note', 'Total breakdown by Note']) && JSON.stringify(altAr) === JSON.stringify(['ترتيب المنطقة حسب إجمالي المبيعات', 'إجمالي المبيعات لكل المنطقة']),
      () => `ST-1j. the alternates: ${JSON.stringify([alts, altAr])}`);
    chk(() => ST.alternate('Total', 'Month', 2, false, 'by') === 'Total per Month', () => 'ST-1k. "ranked" only for a chart sorted by its measure');
    const TM = req('../assets/js/text-measure.js'), room = TM.textWidth(a[2].text, 12, true) + 1, fw = ST.fitWidth(a, room, 12, 1);
    chk(() => fw.text === a.find((x) => TM.textWidth(x.text, 12, true) <= room).text && ST.fitWidth(a, 10, 12, 1) === a[a.length - 1], () => `ST-1l. fitWidth takes the first that fits, else the shortest: ${fw.text}`);
  }

  // ---------- ST-2, ST-3: golden models ----------
  const runs = [['health', 'en', 'exec'], ['health', 'en', 'analysis'], ['large', 'en', 'ops', 'logistics'], ['arabic', 'ar', 'exec'], ['arabic', 'ar', 'ops'], ['ramadan', 'en', 'exec'], ['ramadan', 'ar', 'exec'], ['plain', 'en', 'analysis']];
  for (const [m, lang, layout, focus] of runs) {
    const name = 'ST ' + m + ' ' + lang + ' ' + layout, { r } = await report({ path: m, name, lang, ...(focus ? { focus } : {}) }, { layout });
    chk(() => !r.err, () => `ST-2 setup ${name}: ${r.t.slice(0, 300)}`);
    if (r.err) continue;
    const pages = pagesOf(path.join(ROOT, m, name + '.Report'));
    const all = pages.flatMap((p) => p.visuals.map((v) => ({ p: p.page.displayName, t: titleOf(v), a: altOf(v), type: v.visual.visualType })));
    chk(() => all.every((x) => !/\(\d+\)/.test(x.t || '') && !/\(\d+\)/.test(x.a || '')), () => `ST-2a ${name}. no "(n)" in a title or alt text: ${JSON.stringify(all.filter((x) => /\(\d+\)/.test((x.t || '') + (x.a || ''))).slice(0, 4))}`);
    chk(() => all.every((x) => !/^(KPI|مؤشر) \d+$/.test(x.t || '') && !/^(KPI|مؤشر) \d+$/.test(x.a || '')), () => `ST-2b ${name}. no "KPI n" title: ${JSON.stringify(all.filter((x) => /^(KPI|مؤشر) \d+$/.test(x.t || '')))}`);
    // every chart's and table's title (its alt text: the full title, also for a "Top N of M" title made by a measure) unique on its page
    pages.forEach((p) => { const ts = p.visuals.filter((v) => /Chart$|^tableEx$|^pivotTable$/.test(v.visual.visualType) && titleOf(v)).map(altOf);
      chk(() => new Set(ts).size === ts.length, () => `ST-2c ${name} "${p.page.displayName}". every chart's and table's title unique on its page: ${JSON.stringify(ts)}`); });
    chk(() => all.every((x) => !/…/.test(x.t || '')), () => `ST-2e ${name}. no title cut with "…" on any page, the tooltip pages too: ${JSON.stringify(all.filter((x) => /…/.test(x.t || '')).slice(0, 4))}`);
    chk(() => all.every((x) => ST.NEVER[lang].every((w) => !String(x.t || '').toLowerCase().includes(w))), () => `ST-2d ${name}. no judgement word in a title`);
    // ST-6 (the owner's decision, 19 Oct): a visual's alt text is the FULL story title, never the fitted one; the drawn
    // title is the fitted one. Every chart and table of the Arabic model shows its long measure, so each alt text names it whole.
    if (m === 'arabic') {
      const LONG = 'إجمالي صافي المبيعات بعد الخصومات والمرتجعات', cv = all.filter((x) => /Chart$|^tableEx$/.test(x.type) && x.a);
      chk(() => cv.length > 0 && cv.every((x) => x.a.startsWith(LONG)), () => `ST-6a ${name}. every chart's and table's alt text is the full title: ${JSON.stringify(cv.filter((x) => !x.a.startsWith(LONG)).map((x) => [x.type, x.t, x.a]).slice(0, 4))}`);
      if (layout === 'ops') chk(() => cv.some((x) => x.t && x.t !== '[measure]' && x.t !== x.a && !x.t.startsWith(LONG)), () => `ST-6b ${name}. a drawn title is the shortened form while its alt text stays full: ${JSON.stringify(cv.map((x) => [x.t, x.a]).slice(0, 4))}`);
    }
    if (m === 'arabic' && layout === 'ops') {
      const cut = all.filter((x) => /…/.test(x.t || ''));
      chk(() => !cut.length && !((r.j.chartTitles || {}).shortened || []).length && !((r.j.kpiTitles || {}).shortened || []).length,
        () => `ST-3 ${name}. no Arabic title shortened with "…" (shortened by rule instead): ${JSON.stringify([cut.slice(0, 4), (r.j.chartTitles || {}).shortened])}`);
      chk(() => all.filter((x) => /Chart$/.test(x.type) && x.a).every((x) => /[؀-ۿ]/.test(x.a)), () => 'ST-3b. the Arabic charts keep Arabic titles');
    }
  }

  // ---------- ST-4: the planned page ----------
  {
    const { loadModel } = await import('./lib/model.mjs'), { planLint } = await import('./lib/plan-lint.mjs');
    const pl = await s.call('plan_layout', { path: 'health', name: 'ST plan', layout: 'exec' });
    const out = pl.j && planLint({ m: loadModel(path.join(ROOT, 'health'), { root: ROOT }), design: pl.j.design, lang: 'en', F: null });
    chk(() => out && Array.isArray(out.titles) && out.titles.length > 0 && out.titles.every((t) => !/^KPI \d+$/.test(t)), () => `ST-4. the planned page has no "KPI n" card on a model with one measure: ${JSON.stringify(out && out.titles)}`);
  }

  // ---------- ST-5: time intelligence end to end ----------
  {
    const { r } = await report({ path: 'ti', name: 'ST ti', pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'kpi', x: 36, y: 40, w: 300, h: 110 }, { kind: 'kpi', x: 360, y: 40, w: 300, h: 110 }, { kind: 'line', x: 36, y: 180, w: 600, h: 300 }] }],
      fields: { kpis: ['Sales[Sales PY]', 'Sales[Sales YTD]'], measure: 'Sales[Sales vs PY]', timeAxis: 'Sales[Date]' } });
    chk(() => !r.err, () => `ST-5 setup: ${r.t.slice(0, 300)}`);
    if (!r.err) {
      const vs = pagesOf(path.join(ROOT, 'ti', 'ST ti.Report'))[0].visuals, ts = vs.map(titleOf).filter(Boolean);
      chk(() => ts.includes('Sales last year') && ts.includes('Sales year to date'), () => `ST-5a. the cards read "Sales last year" and "Sales year to date": ${JSON.stringify(ts)}`);
      chk(() => ts.some((t) => /^Sales vs last year by /.test(t)), () => `ST-5b. the line chart reads "Sales vs last year by ...": ${JSON.stringify(ts)}`);
    }
  }
} finally {
  await s.close();
}
fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  story-titles  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  story-titles  ${checks} checks`);
