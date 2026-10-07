// Round 22 (sitting 7-8 Oct): the checks of the reviewer's code review of rounds 20 and 21 (findings a to i), each
// written red first. test.mjs runs them with its own client (import { round22 }); run alone they start the server
// themselves, so one block can be tried in seconds: node test-round22.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function round22({ call, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"Day"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  const model = (dir, tables) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables } })); };
  const dir = 'r22';
  model(dir, [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Quarter', 'string'), col('Year Quarter', 'string'), col('Fiscal Year Quarter', 'string')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }, { name: 'Margin %', expression: 'DIVIDE ( 1, 2 )', formatString: '0.0%' }] }]);
  const vis = (x, d) => { if (x.err) return []; const out = []; const walk = (p) => fs.readdirSync(p, { withFileTypes: true }).forEach((f) => { const q = path.join(p, f.name); if (f.isDirectory()) walk(q); else if (f.name === 'visual.json') out.push(JSON.parse(fs.readFileSync(q, 'utf8'))); }); walk(path.join(ROOT, d || dir, x.j.report, 'definition', 'pages')); return out.filter((v) => v.visual); };
  const lit = (e) => (e && e.expr && e.expr.Literal ? String(e.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
  const vco = (v, k) => ((v.visual.visualContainerObjects || {})[k] || [])[0];
  const titleOf = (v) => { const t = vco(v, 'title'); return t ? lit(t.properties.text) : null; }, altOf = (v) => { const g = vco(v, 'general'); return g ? lit(g.properties.altText) : null; };
  const subs = (x) => vis(x).filter((v) => vco(v, 'subTitle')).map((v) => [v.visual.visualType, lit(vco(v, 'subTitle').properties.text)]);
  const notes = (x) => JSON.stringify(x.err ? x.t : x.j.reportNotes || []);
  const build = async (name, extra, lang) => { const pl = await ask('plan_layout', { layout: 'exec', kpis: 3, filters: 'end', lang: lang || 'en' }); return ask('create_report', Object.assign({ path: dir, name, lang: lang || 'en', secondPage: false, design: pl.j.design }, extra || {})); };
  const hand = (name, slots, extra) => ask('create_report', Object.assign({ path: dir, name, fields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', category: 'Sales[Region]', category2: 'Sales[Channel]' },
    pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 36, y: 18, w: 840, h: 48 }].concat(slots) }] }, extra || {}));

  // item 1 of the sitting: "No data" is on by default (the owner's rule: every part passed in Desktop on the night of
  //    6-7 Oct). Without the option a report has one message card under each chart and table and "No data" on the KPI
  //    cards wide enough for it; noDataMessage: false leaves all of it out, as every report was before
  {
    const msg = (x) => vis(x).filter((v) => v.visual.visualType === 'cardVisual' && /"Property":"No data: /.test(JSON.stringify(v.visual.query || '')));
    const blank = (x) => vis(x).filter((v) => v.visual.visualType === 'cardVisual' && (v.visual.objects.value || []).some((e) => e.properties && e.properties.showBlankAs));
    const dflt = await build('R22 nodata default'), off = await build('R22 nodata off', { noDataMessage: false });
    const charts = (x) => vis(x).filter((v) => /Chart$|^tableEx$/.test(v.visual.visualType) && v.visual.query).length;
    chk(() => !dflt.err && charts(dflt) >= 3 && msg(dflt).length >= 3 && msg(dflt).length <= charts(dflt) && blank(dflt).length >= 3 && msg(dflt).every((v) => !('tabOrder' in v.position)),
      () => `by default the charts and the table of a page have their "No data" card (no tab stop; the tooltip pages have none) and the KPI cards their blank text: charts ${charts(dflt)}, message cards ${msg(dflt).length}, cards with a blank text ${blank(dflt).length} ${dflt.err ? dflt.t.slice(0, 200) : ''}`);
    chk(() => !off.err && charts(off) >= 3 && msg(off).length === 0 && blank(off).length === 0 && !fs.existsSync(path.join(ROOT, dir, off.j.report, 'definition', 'reportExtensions.json')),
      () => `noDataMessage: false writes no message card, no blank text and no report-level measure: ${msg(off).length} ${blank(off).length} ${off.err ? off.t.slice(0, 200) : ''}`);
  }
  // a. AUD-032's follow-up: the FORMATS script (check_model_health's, and the one plan_layout and create_report hand
  //    over) is built from the model without the names that hold a control character, like every other fix script
  {
    const d = 'r22-cc'; model(d, [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string')],
      measures: [{ name: 'Sales\tTotal', expression: 'SUM ( Sales[Amount] )' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' }] }]);
    const h = await ask('check_model_health', { path: d }), f = h.err ? {} : ((h.j.fixes || {}).FORMATS || {});
    const sc = f.fixScriptFile ? fs.readFileSync(path.join(ROOT, f.fixScriptFile), 'utf8') : '';
    chk(() => sc && /measure Orders\b/.test(sc) && !/Sales\tTotal|Sales.Total/.test(sc) && !JSON.stringify(f.fields || []).includes('Sales\\tTotal'),
      () => `a. the FORMATS script must leave out the measure with a tab in its name: ${JSON.stringify(sc.slice(0, 400))} fields ${JSON.stringify(f.fields || null).slice(0, 300)} ${h.err ? h.t.slice(0, 200) : ''}`);
    const pl = await ask('plan_layout', { layout: 'exec', kpis: 2, lang: 'en', path: d, fields: ['Sales[Orders]'] });
    const cr = await ask('create_report', { path: d, name: 'R22 cc', fields: { kpis: ['Sales[Orders]'] }, pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 36, y: 18, w: 840, h: 48 }, { kind: 'kpi', x: 36, y: 100, w: 300, h: 110 }] }] });
    const files = fs.readdirSync(path.join(ROOT, d)).filter((n) => /fix formats/.test(n)).map((n) => fs.readFileSync(path.join(ROOT, d, n), 'utf8'));
    chk(() => !pl.err && !cr.err && files.length && files.every((t) => !/Sales\tTotal/.test(t)), () => `a. no formats script in the folder may name the measure with a tab raw: ${files.length} file(s) ${pl.err ? pl.t.slice(0, 150) : ''} ${cr.err ? cr.t.slice(0, 150) : ''}`);
  }
  // A page under 800 wide (the owner's (a); golden task 5 at 640 x 360 in Desktop 2.158.1304, 7 Oct: card values
  //    touching the card's bottom on page 1, cut in half on the second page, whose table scrolled): the single-focus
  //    layout's KPI cards are one step taller than the layout's own (48 at this size), and the report has one page,
  //    said in the notes; a page 800 wide or more is unchanged (two pages)
  {
    const small = await ask('plan_layout', { layout: 'exec', kpis: 3, filters: 'none', page: { w: 640, h: 360 }, lang: 'en' }), big = await ask('plan_layout', { layout: 'focus', kpis: 3, filters: 'none', page: '1280x720', lang: 'en' });
    const kh = (p) => (p.err ? [] : p.j.slots.filter((s) => s.kind === 'kpi').map((s) => s.h));
    chk(() => kh(small).length === 3 && kh(small).every((h) => h > 48 && h <= 64) && kh(big).every((h) => h === 96), () => `a 640 x 360 plan's KPI cards are taller than 48 (and a 1280 x 720 focus plan's stay 96): ${JSON.stringify([kh(small), kh(big)])} ${small.err ? small.t.slice(0, 200) : ''}`);
    const rs = small.err ? small : await ask('create_report', { path: dir, name: 'R22 tiny', design: small.j.design }), rb = big.err ? big : await ask('create_report', { path: dir, name: 'R22 not tiny', design: big.j.design });
    chk(() => !rs.err && rs.j.pages.length === 1 && /one page/.test(notes(rs)) && !rb.err && rb.j.pages.length === 2 && !/one page/.test(notes(rb)),
      () => `under 800 wide the report has one page, told; at 1280 x 720 two: ${rs.err ? rs.t.slice(0, 200) : rs.j.pages.length + ' ' + notes(rs).slice(0, 200)} | ${rb.err ? rb.t.slice(0, 200) : rb.j.pages.length}`);
  }
  // The golden test models' DAX tables (round 20) write a date as Desktop's DATATABLE takes it, "2026-01-03": with
  //    "2026-01-03T00:00:00" both tables of tasks 6 and 7 stayed empty and every visual showed an error (measured in
  //    Desktop 2.158.1304, 7 Oct: "Cannot convert value ... of type Text to type Date")
  {
    const HERE = path.dirname(fileURLToPath(import.meta.url)), bad = [];
    const walk = (p) => fs0.readdirSync(p, { withFileTypes: true }).forEach((f) => { const q = path.join(p, f.name); if (f.isDirectory()) walk(q); else if (q.endsWith('.tmdl') && /DATATABLE \([^\n]*"\d{4}-\d{2}-\d{2}T\d\d:\d\d:\d\d"/.test(fs0.readFileSync(q, 'utf8'))) bad.push(f.name); });
    walk(path.join(HERE, 'test-models'));
    chk(() => bad.length === 0, () => `a DATATABLE date must be written as "yyyy-mm-dd" (Desktop refuses "yyyy-mm-ddT00:00:00"): ${bad.join(', ')}`);
  }
  // b. (measured in Desktop 2.158.1304, 7 Oct: with a subtitle a planned KPI card's value is pushed down and cut in
  //    half) a subtitle is never written on a KPI card; the answer says which key was not used
  {
    const x = await build('R22 sub kpi', { subtitles: { 'KPI 1': 'Year to date', Breakdown: 'Largest first' } });
    chk(() => JSON.stringify(subs(x)) === JSON.stringify([['clusteredBarChart', 'Largest first']]), () => `b. a subtitle only on the chart, none on a KPI card: ${JSON.stringify(subs(x))} ${x.err ? x.t.slice(0, 200) : ''}`);
    chk(() => /subtitle/i.test(notes(x)) && notes(x).includes('KPI 1'), () => `b. the notes must say the subtitle of "KPI 1" was not written: ${notes(x).slice(0, 400)}`);
    const h = await hand('R22 sub kpi hand', [{ kind: 'kpi', x: 36, y: 100, w: 300, h: 110, title: 'K0' }, { kind: 'bar', x: 36, y: 240, w: 500, h: 300, title: 'B0' }], { subtitles: { K0: 'x', B0: 'y' } });
    chk(() => JSON.stringify(subs(h)) === JSON.stringify([['clusteredBarChart', 'y']]), () => `b. hand-placed: a subtitle on the chart only: ${JSON.stringify(subs(h))} ${h.err ? h.t.slice(0, 200) : ''}`);
  }
  // c. a slot's plan role works in English or Arabic whatever the report's language (as create_report documents), and
  //    a key that matches nothing is named in the notes
  {
    const ar = await build('R22 sub ar', { subtitles: { Breakdown: 'الأكبر أولًا', Nope: 'x' } }, 'ar'), en = await build('R22 sub en', { subtitles: { 'التوزيع': 'Largest first' } });
    chk(() => JSON.stringify(subs(ar)) === JSON.stringify([['clusteredBarChart', 'الأكبر أولًا']]), () => `c. Arabic report, English role key: one subtitle on the bar chart: ${JSON.stringify(subs(ar))} ${ar.err ? ar.t.slice(0, 200) : ''}`);
    chk(() => JSON.stringify(subs(en)) === JSON.stringify([['clusteredBarChart', 'Largest first']]), () => `c. English report, Arabic role key: one subtitle on the bar chart: ${JSON.stringify(subs(en))} ${en.err ? en.t.slice(0, 200) : ''}`);
    chk(() => /subtitle/i.test(notes(ar)) && notes(ar).includes('Nope') && !notes(ar).includes('Breakdown'), () => `c. the notes must name the key that matched nothing ("Nope") and only it: ${notes(ar).slice(0, 400)}`);
  }
  // e, h. charts with the same title get their column in brackets (round 20): the new title is fitted like any title
  //    (never a bracket after a shortened title's "…"), the alt text carries the same full name, and two charts by the
  //    same column are left alone (seen in Desktop, 7 Oct: "Total Sales by City (City)" twice)
  {
    // (an Arabic report on English names: round 14 drops the English column from the title, so every chart reads the measure's name)
    // (golden task 7's shape: a model without measures, in Arabic: every chart reads "عدد Order Id")
    model('r22-nm', [{ name: 'Orders', partitions: mp('Orders'), columns: [col('Order Id', 'string'), col('Region', 'string'), col('Channel', 'string')] }]);
    const mk = (name, w) => ask('create_report', { path: 'r22-nm', name, lang: 'ar', pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 36, y: 18, w: 840, h: 48 }, { kind: 'bar', x: 36, y: 100, w, h: 300 }, { kind: 'column', x: 640, y: 100, w, h: 300 }] }] });
    const x = await mk('R22 same title', 470), xn = await mk('R22 same title narrow', 110);
    const pick = (r, w) => vis(r, 'r22-nm').filter((v) => /Chart$/.test(v.visual.visualType) && titleOf(v) && v.position.width === w), narrow = pick(xn, 110), wide = pick(x, 470);
    chk(() => narrow.length === 2 && narrow.every((v) => !/… \(/.test(titleOf(v))), () => `e. a bracket never follows a shortened title: ${JSON.stringify(narrow.map((v) => [titleOf(v), JSON.stringify(vco(v, 'title').properties.titleWrap || null)]))} ${x.err ? x.t.slice(0, 200) : ''}`);
    chk(() => wide.length === 2 && wide.map((v) => (titleOf(v).match(/\((Region|Channel)\)$/) || [])[1]).sort().join() === 'Channel,Region', () => `e. the wide charts end with "(Region)" and "(Channel)": ${JSON.stringify(wide.map(titleOf))}`);
    const four = narrow.concat(wide);
    chk(() => four.length === 4 && four.every((v) => /\((Region|Channel)\)$/.test(altOf(v) || '')), () => `h. each chart's alt text carries its bracketed name: ${JSON.stringify(four.map(altOf))}`);
    const s = await hand('R22 same column', [{ kind: 'bar', x: 36, y: 100, w: 500, h: 300 }, { kind: 'donut', x: 600, y: 100, w: 500, h: 300 }]);
    const st = vis(s).filter((v) => /Chart$/.test(v.visual.visualType) && v.position.width === 500).map(titleOf);
    chk(() => st.length === 2 && st.every((t) => t === 'Total Sales by Region'), () => `e. two charts by the same column keep their title (a bracket would repeat itself): ${JSON.stringify(st)} ${s.err ? s.t.slice(0, 200) : ''}`);
  }
  // f. data labels above the columns only where the columns are four: "Quarter", never "Year Quarter" (8 to 40 values)
  {
    const run = async (cat) => { const x = await hand('R22 labels ' + cat, [{ kind: 'column', x: 36, y: 100, w: 600, h: 400, title: 'C' }], { fields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', category: 'Sales[Region]', category2: 'Sales[' + cat + ']' } });
      const c = vis(x).find((v) => v.visual.visualType === 'clusteredColumnChart'); return { has: !!(c && (c.visual.objects || {}).labels), ok: !!c, err: x.err ? x.t.slice(0, 200) : '' }; };
    const q = await run('Quarter'), yq = await run('Year Quarter'), fyq = await run('Fiscal Year Quarter');
    chk(() => q.ok && q.has, () => `f. a column chart by Quarter keeps its labels ${q.err}`);
    chk(() => yq.ok && !yq.has && fyq.ok && !fyq.has, () => `f. a column chart by "Year Quarter" or "Fiscal Year Quarter" has no data labels: ${JSON.stringify([yq, fyq])}`);
  }
  // g. a column left out of the scripts for a control character in its name is still seen when the rest is judged:
  //    no second "Month Number" is added beside 'Month Number\t', and a skipped column is never called "not found"
  {
    const d = 'r22-sort'; model(d, [{ name: 'Calendar', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), col('Month Name', 'string'), Object.assign(col('Month Number\t', 'int64'), { summarizeBy: 'none' }), col('Day\nName', 'string')] }]);
    const h = await ask('check_model_health', { path: d }), ms = h.err ? {} : ((h.j.fixes || {}).MONTH_SORT || {}), all = JSON.stringify(ms);
    const sc = ms.fixScriptFile ? fs.readFileSync(path.join(ROOT, ms.fixScriptFile), 'utf8') : '';
    chk(() => !h.err && !(ms.sorts || []).some((s) => s.added && /Month Name/.test(s.column)) && !/column 'Month Number'/.test(sc) && (ms.byHand || []).some((b) => /Month Name/.test(b.column) && /control character/.test(b.why)),
      () => `g. Month Name's sort is a step by hand (its number column's name holds a tab), no new Month Number: ${all.slice(0, 600)} ${h.err ? h.t.slice(0, 200) : ''}`);
    chk(() => !h.err && !/not found/.test(all), () => `g. no column is "not found" because its name holds a control character: ${all.slice(0, 600)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const HERE = path.dirname(fileURLToPath(import.meta.url)), req = createRequire(import.meta.url);
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js'), { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-r22-')), problems = []; let checks = 0;
  const client = new Client({ name: 'test-r22', version: '1' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(HERE, 'server.mjs')], env: { ...process.env, DATAARCUS_ROOT: ROOT }, stderr: 'ignore' }));
  const call = async (name, args) => { const r = await client.callTool({ name, arguments: args }); const t = r.content[0].text; return { err: !!r.isError, t, j: r.isError ? null : JSON.parse(t) }; };
  await round22({ call, check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await client.close(); fs0.rmSync(ROOT, { recursive: true, force: true }); void req;
  console.log(problems.length ? `FAIL  round22  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  round22  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
