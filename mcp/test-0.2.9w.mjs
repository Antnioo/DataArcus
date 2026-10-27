import './test-env.mjs';
// 0.2.9, the report writer's block (the reviewer's routine of 11 Oct, cloud builder 11; audit 3's A3-7 to A3-12 on the
// writer's side, and the audit's "seen, not in scope" items that sit in the writer). Written red first, item by item.
// The owner's rule of 11 Oct: build in blocks, fix at the root inside one block, nothing tuned to his two portfolio
// reports or to fixtures: the models here are made up, built straight with the shared writer (no server needed).
// test.mjs runs it (import { v029w }); run alone:
//   node test-0.2.9w.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { serverSource } from './test-source.mjs';   // (0.3.1 S9: the server's code is server.mjs, tools/ and the lib/ modules it shared)

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const req = createRequire(import.meta.url);
const { lint: designLint } = await import(pathToFileURL(path.join(HERE, 'lib', 'design-lint.mjs')).href);

export function v029w({ check }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e) }; } };
  const Px = req('../assets/js/pbip-export.js'), E = req('../assets/js/design-engine.js');
  const src = () => ['pbip-export.js', 'pbip-query.js', 'pbip-sizing.js', 'pbip-page.js', 'pbip-notes.js'].map((f) => path.join(REPO, 'assets/js', f)).filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const L = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : undefined), S = (p) => { const v = L(p); return v == null ? undefined : v.replace(/^'|'$/g, '').replace(/''/g, "'"); };
  // a report on a made-up model, the way the MCP and the website call the writer: a designed page (or hand-placed slots)
  const build = (bind, o = {}) => {
    const lang = o.lang || 'en', d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma';
    d.layout = Object.assign({}, d.layout, o.layout || {}); E.repairState(d);
    const specs = o.pages ? null : E.projectPages(d.layout, lang, { second: false, panel: false });
    const pages = o.pages || specs.map((sp) => ({ name: sp.name, page: sp.page, slots: sp.slots, panel: sp.panel, png: new Uint8Array([1]), grow: true }));
    const extra = Object.assign({}, o); delete extra.lang; delete extra.layout; delete extra.pages;
    return Px.build(Object.assign({ name: 'W', title: 'W', pageName: pages[0].name, lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false,
      model: { byPath: 'M.SemanticModel' }, bind, texts: E.REPORT_TEXTS[lang], pages }, extra));
  };
  const hand = (w, h, slots) => [{ name: 'P', page: { w, h }, slots, panel: null, hand: true, png: new Uint8Array([1]) }];
  const visuals = (r) => r.files.filter((f) => /visual\.json$/.test(f.path)).map((f) => JSON.parse(String(f.data))).filter((v) => v.visual);
  const ext = (r) => { const f = r.files.find((x) => /reportExtensions\.json$/.test(x.path)); return f ? JSON.parse(String(f.data)).entities : []; };
  const measures = (r) => ext(r).flatMap((e) => e.measures.map((m) => Object.assign({ t: e.name }, m)));
  const titleOf = (v) => S((((v.visual.visualContainerObjects || {}).title || [])[0] || { properties: {} }).properties.text);
  const altOf = (v) => S((((v.visual.visualContainerObjects || {}).general || [])[0] || { properties: {} }).properties.altText);
  const T = 'Sales', D = 'Dates', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x, t) => Object.assign({ t: t || T, c }, x || {});
  const base = (x) => Object.assign({ kpis: [M('Total Sales'), M('Orders')], measure: M('Total Sales'), date: null, cats: { bar: C('City'), column: C('Channel'), donut: C('Channel') }, y: {},
    table: [C('City'), M('Total Sales')], slicers: [C('City'), null, null], tip: { card: M('Total Sales'), cat: C('City'), y: M('Total Sales') } }, x || {});

  // ---------- A3-10: one daxNames helper (quote, escape, refuse control characters), the writer's only DAX quoter ----------
  {
    const N = Px.daxNames || {};
    chk(() => N.table("O'Brien") === "'O''Brien'" && N.column("O'Brien", 'Sales]x') === "'O''Brien'[Sales]]x]" && N.measure('A]]b') === '[A]]]]b]' && N.string('say "hi"') === '"say ""hi"""',
      () => `A3-10: Px.daxNames quotes a table, a column, a measure and a DAX string: ${JSON.stringify(Object.keys(N))}`);
    chk(() => ['table', 'column', 'measure', 'string'].every((k) => { try { (k === 'column' ? N.column('T', 'a\nb') : N[k]('a\tb')); return false; } catch (e) { return /control character/.test(e.message); } }),
      () => 'A3-10: daxNames refuses a name with a control character (a tab, a line break), with an error that says so');
    const s = src();
    chk(() => (s.match(/replace\(\/\\\]\/g, '\]\]'\)/g) || []).length === 1 && !/const (ref|daxName|daxTable|dq) = /.test(s),
      () => `A3-10: the writer has one DAX-name quoter (the "]" escape once; no ref, daxName, daxTable or dq of its own): ${(s.match(/replace\(\/\\\]\/g, '\]\]'\)/g) || []).length}`);
    // a month label whose date column holds a line break: no time measure may name it (before: a raw line break in the DAX)
    const r = get(() => build(base({ date: C('Month Year', { dateOf: { t: T, c: 'Order\nDate' } }) })));
    chk(() => r.files && measures(r).every((m) => !/\p{Cc}/u.test(m.expression)) && !measures(r).some((m) => /Month start|Last 12/.test(m.name)),
      () => `A3-10: a date column with a control character gets no time measure (its DAX can't name it): ${r.threw || JSON.stringify(measures(r).map((m) => m.name))}`);
  }

  // ---------- A3-11: a name's direction controls never reach shown text (titles, alt text, headers, report measures' names) ----------
  {
    const RLO = '\u202E', LRI = '\u2066', BIDI = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/;
    const bind = base({ kpis: [M('Sales' + RLO + ' Net'), M('Orders')], measure: M('Sales' + RLO + ' Net'), cats: { bar: C('City' + LRI), column: C('Channel'), donut: C('Channel') },
      table: [C('City' + LRI), M('Sales' + RLO + ' Net')], date: C('Month Label', { dateOf: { t: T, c: 'Order Date' } }), tip: { card: M('Sales' + RLO + ' Net'), cat: C('City' + LRI), y: M('Sales' + RLO + ' Net') } });
    for (const lang of ['en', 'ar']) {
      const r = get(() => build(bind, { lang })), vs = r.files ? visuals(r) : [];
      const shownText = vs.flatMap((v) => [titleOf(v), altOf(v)].concat(Object.values((v.visual.query || { queryState: {} }).queryState).flatMap((st) => st.projections.map((p) => p.displayName)))).filter((x) => x != null);
      // (changed 27 Oct 2026, 0.3.1 TT1, the owner's new rule: an English title or alt text in an Arabic report is isolated
      // whole by the writer, text-measure.js isolateWhole; a display name never is)
      const titled = new Set(vs.flatMap((v) => [titleOf(v), altOf(v)]).filter((x) => x != null));
      // (SQ15b, J18-S2: an Arabic build is isolated by the writer itself, J18's rule) the writer's own marks (FSI, PDI, RLM
      // where text-measure.js isolateLatin puts them; BD2: and the RLI that wraps the whole text) are allowed in Arabic; a
      // name's direction controls never are; (TT1) an English title or alt text isolated whole (isolateWhole) too
      const TM = req('../assets/js/text-measure.js'), own = (x) => (lang === 'ar' ? x.replace(/[\u2067\u2068\u2069\u200F]/g, '') : x);
      chk(() => vs.length && shownText.length > 5 && !shownText.some((x) => BIDI.test(own(x))) && shownText.every((x) => x === (lang === 'ar' ? TM.isolateLatin(own(x)) : x) || (lang === 'ar' && titled.has(x) && x === TM.isolateWhole(own(x)))) && shownText.some((x) => /Sales Net/.test(x)),
        () => `A3-11 (${lang}): titles, alt text and display names carry no direction control: ${r.threw || JSON.stringify(shownText.filter((x) => BIDI.test(x)).slice(0, 4))}`);
      const ms = measures(r);
      chk(() => ms.length && ms.every((m) => !BIDI.test(m.name)) && ms.some((m) => /^No data: Sales Net$/.test(m.name) && m.expression.includes('[Sales' + RLO + ' Net]')),
        () => `A3-11 (${lang}): a report measure's name has no direction control, its DAX still names the model's measure: ${JSON.stringify(ms.map((m) => [m.name, m.expression.slice(0, 60)]))}`);
    }
    // the report's title is shown text too (the header's text box): its file name already dropped the format characters
    const r3 = get(() => build(base(), { title: 'Report' + RLO + 'xcod.exe' })), heads = r3.files ? visuals(r3).filter((v) => v.visual.visualType === 'textbox').map((v) => JSON.stringify(v.visual.objects)) : [];
    chk(() => heads.some((x) => x.includes('Reportxcod.exe')) && !heads.some((x) => BIDI.test(x)), () => `A3-11: the header's title drops the override: ${r3.threw || heads.join(' ').slice(0, 200)}`);
    // two measures that differ only by a direction mark keep two "No data" measures (one name would serve both)
    const r2 = get(() => build(base({ kpis: [M('Sales'), M('Sales' + RLO)], measure: M('Sales'), y: { bar: M('Sales' + RLO) } })));
    chk(() => measures(r2).filter((m) => /^No data: Sales/.test(m.name)).length === 2 && new Set(measures(r2).map((m) => m.name)).size === measures(r2).length,
      () => `A3-11: "Sales" and "Sales" + U+202E get a No data measure each, with different names: ${r2.threw || JSON.stringify(measures(r2).map((m) => m.name))}`);
  }

  // ---------- A3-7 (writer side): the picker's nameLike, not a hand copy; names measured by their own family ----------
  {
    const s = src();
    chk(() => !/Bind_nameLike/.test(s) && !/\(month\|day\|weekday\)\\s\*_\?\(name\|short\)/.test(s), () => 'A3-7: the writer keeps no hand copy of the picker\'s nameLike');
    const col = (c, w, lang) => get(() => build(base({ cats: { bar: C('City'), column: c, donut: C('Channel') } }), { lang, pages: hand(1280, 720, [{ kind: 'column', title: 'C', x: 24, y: 80, w, h: 400 }]) }));
    const bars = (r) => (r.barCharts || []).length;
    // 1000 wide: twelve English month names fit their share of the plot (September 66 wide at 10pt); the Hijri ones don't
    // ("Jumada al-Akhirah" 113): a Hijri month chart is written as a bar chart, a Gregorian one stays a column chart
    const hijri = col(C('Hijri Month Name', { sortBy: { t: D, c: 'Hijri Month No' } }, D), 1000), greg = col(C('Month Name', { sortBy: { t: D, c: 'Month No' } }, D), 1000);
    chk(() => bars(hijri) === 1 && bars(greg) === 0, () => `A3-7: Hijri month names are measured as Hijri names (a bar chart at 1000 wide), Gregorian ones as theirs (a column chart): hijri ${hijri.threw || JSON.stringify(hijri.barCharts)} gregorian ${greg.threw || JSON.stringify(greg.barCharts)}`);
    // 800 wide in Arabic (Tahoma): the English names would not fit ("September" 70), the Arabic ones do ("سبتمبر" 45)
    const ar = col(C('اسم الشهر', { ordered: true }, D), 800, 'ar'), arDays = col(C('Day Name (Arabic)', { ordered: true }, D), 560, 'ar');
    chk(() => bars(ar) === 0 && bars(arDays) === 0, () => `A3-7: Arabic month and day names are measured as Arabic names (both stay column charts): months ${ar.threw || JSON.stringify(ar.barCharts)} days ${arDays.threw || JSON.stringify(arDays.barCharts)}`);
    // the picker's kind, row count and family, where it gives them, before any name
    const given = col(C('Period', { kind: 'month', rows: 12, family: 'hijri' }, D), 1000);
    chk(() => bars(given) === 1, () => `A3-7: a category the picker marks { kind: 'month', family: 'hijri' } is measured as Hijri month names: ${given.threw || JSON.stringify(given.barCharts)}`);
    // a table's known rows: "Year Quarter" holds many quarters (never 4); a quarter or a day the picker counts is known
    const tbl = (c) => get(() => build(base({ table: [c, M('Total Sales')] }), { pages: hand(1280, 720, [{ kind: 'table', title: 'T', x: 24, y: 80, w: 600, h: 120 }]) }));
    // (design round 8, N6: a table of unknown rows now takes the room past its last whole row as extra row padding; a table
    // whose rows are known and tight has rowPadding 0)
    const tight = (r) => !!(r.files && visuals(r).some((v) => v.visual.visualType === 'tableEx' && JSON.stringify(v.visual.objects.grid || '').includes('"rowPadding":{"expr":{"Literal":{"Value":"0D"}}}'))) || (r.tableRows || []).length > 0;
    const yq = tbl(C('Year Quarter', {}, D)), qq = tbl(C('Quarter', {}, D)), pk = tbl(C('Weekday Label', { kind: 'day', rows: 7 }, D)), my = tbl(C('Month Year', {}, D));
    chk(() => !tight(yq) && tight(qq) && tight(pk) && !tight(my), () => `A3-7: rows known only for a quarter without a year, a day or month name, or the picker's count: Year Quarter ${tight(yq)}, Quarter ${tight(qq)}, picker's 7 days ${tight(pk)}, Month Year ${tight(my)}`);
  }

  // ---------- A3-8 (writer side): a time category keeps its own order when the picker marks it; the words are the fallback ----------
  {
    const chart = (c, tipCat) => get(() => build(base({ cats: { bar: c, column: C('Channel'), donut: C('Channel') }, tip: { card: M('Total Sales'), cat: tipCat || c, y: M('Total Sales') } }), { pages: hand(1280, 720, [{ kind: 'bar', title: 'B', x: 24, y: 80, w: 600, h: 400 }]) }));
    const byValue = (r) => { const v = r.files && visuals(r).find((x) => x.visual.visualType === 'clusteredBarChart' && x.position.x === 24); const sd = v && v.visual.query.sortDefinition; return !!(sd && sd.sort[0].field.Measure); };
    const shift = chart(C('Shift', { kind: 'day' })), dayType = chart(C('Day Type', { kind: 'category' })), marked = chart(C('Slot', { time: true })), unmarked = chart(C('Day Type', { time: false }));
    chk(() => !byValue(shift) && byValue(dayType) && !byValue(marked) && byValue(unmarked),
      () => `A3-8: the picker's mark decides (a time kind or time: true keeps its order; another kind or time: false is sorted largest first): Shift/day ${byValue(shift)}, Day Type/category ${byValue(dayType)}, Slot/time ${byValue(marked)}, Day Type/not time ${byValue(unmarked)}`);
    const region = chart(C('Region')), week = chart(C('Fiscal Week'));
    chk(() => byValue(region) && !byValue(week), () => `A3-8: without a mark the words decide as before: Region ${byValue(region)}, Fiscal Week ${byValue(week)}`);
    // (the laptop's second sweep, T5: a chart never opens a tooltip by its own category, so the tooltip's category is
    // checked under a chart by another one, Channel)
    const tipShift = chart(C('Channel'), C('Shift', { kind: 'day' })), tipDayType = chart(C('Channel'), C('Day Type', { kind: 'category' }));
    chk(() => tipShift.tooltipLimits && tipShift.tooltipLimits.top === null && tipDayType.tooltipLimits.top === 6,
      () => `A3-8: the tooltip's Top 6 follows the same mark (never on a time category): ${JSON.stringify([tipShift.tooltipLimits, tipDayType.tooltipLimits])}`);
  }

  // ---------- A3-9 (writer side): build's input and result written down (JSDoc) and checked at its top; typed page filters ----------
  {
    const s = fs.readFileSync(path.join(REPO, 'assets/js/pbip-export.js'), 'utf8'), doc = (s.match(/\/\*\*(?:(?!\*\/)[\s\S])*@typedef \{Object\} BuildInput[\s\S]*?\*\//) || [''])[0], res = (s.match(/@typedef \{Object\} BuildResult[\s\S]*?\*\//) || [''])[0];
    const KEYS = ['name', 'title', 'lang', 'rtl', 'font', 'ui', 'theme', 'page', 'pageName', 'slots', 'png', 'pages', 'logo', 'sample', 'model', 'bind', 'texts', 'svgColumns', 'svgCards', 'subtitles', 'chartColors', 'chartAxes', 'quietGrid', 'pageFilters', 'kpiValues', 'noDataMessage', 'logoPlaceholder', 'smoothLines'];
    const RES = ['base', 'files', 'zip', 'leftOut', 'kpiTitles', 'titles', 'tableOrder', 'tableRows', 'headerGrew', 'tableSmaller', 'tableWide', 'noDataSkipped', 'svgSizes', 'noPageButtons', 'tableColumns', 'rowLabels', 'rowLabelSkipped', 'extRenamed', 'chartColors', 'chartAxes', 'tabRows', 'ringsSmall', 'shortDays', 'barCharts', 'blankKept', 'subtitlesUsed', 'timeAxes', 'blankFiltered', 'tooltipLimits'];
    const TEXTS = ['by', 'detail', 'reset', 'resetTip', 'noDataName', 'top6', 'readme', 'logoHere', 'tooltipPage'];
    chk(() => KEYS.every((k) => new RegExp('\\b' + k + '\\b').test(doc)) && RES.every((k) => new RegExp('\\b' + k + '\\b').test(res)) && TEXTS.every((k) => doc.includes(k)) && /@property/.test(doc) && /sortBy/.test(doc) && /kind/.test(doc),
      () => `A3-9: a JSDoc BuildInput (every key, the texts, page, slot and field properties) and a BuildResult (every key): missing ${KEYS.filter((k) => !new RegExp('\\b' + k + '\\b').test(doc)).concat(RES.filter((k) => !new RegExp('\\b' + k + '\\b').test(res)), TEXTS.filter((k) => !doc.includes(k))).join(', ')}`);
    const err = (o) => { try { Px.build(o); return null; } catch (e) { return e; } };
    const e0 = err({}), e1 = err({ ui: { text: '#111111', card: '#ffffff', background: '#eeeeee' }, pages: [{ name: 'P', page: { w: 1280, h: 720 }, slots: [{ kind: 'chart', x: 0, y: 0, w: 10, h: 10 }] }] });
    chk(() => e0 instanceof TypeError && /ui/.test(e0.message) && /pages/.test(e0.message) && e1 instanceof TypeError && /slots\[0\]/.test(e1.message) && /chart/.test(e1.message),
      () => `A3-9: build checks its input first and names what is wrong: ${e0 && e0.message} | ${e1 && e1.message}`);
    // page filters take typed values; the writer writes the literals (before: the caller's literals, trusted as written)
    const pf = (f) => get(() => build(base(), { pageFilters: [f] }));
    const vals = (r) => { const pj = r.files && r.files.find((x) => /pages\/[^/]+\/page\.json$/.test(x.path) && /filterConfig/.test(String(x.data))); return pj ? JSON.parse(String(pj.data)).filterConfig.filters[0].filter.Where[0].Condition.In.Values.map((v) => v[0].Literal.Value) : r.threw; };
    chk(() => JSON.stringify(vals(pf({ t: T, c: 'City', type: 'string', values: ["O'Brien", 'Dubai'] }))) === JSON.stringify(["'O''Brien'", "'Dubai'"])
      && JSON.stringify(vals(pf({ t: T, c: 'Year', type: 'int64', values: [2024] }))) === '["2024L"]' && JSON.stringify(vals(pf({ t: T, c: 'Rate', type: 'double', values: [5.5, 3] }))) === '["5.5D","3D"]'
      && JSON.stringify(vals(pf({ t: T, c: 'Open', type: 'boolean', values: [true] }))) === '["true"]' && JSON.stringify(vals(pf({ t: T, c: 'Code', values: [7] }))) === '["7L"]',
      () => `A3-9: a page filter's typed values are written as Power BI's literals by the writer: ${JSON.stringify(vals(pf({ t: T, c: 'City', type: 'string', values: ["O'Brien"] })))}`);
    const bad = [pf({ t: T, c: 'City', literals: ["'a') } ] } , 'b'"] }), pf({ t: T, c: 'City', values: [{ x: 1 }] }), pf({ t: T, c: 'City', type: 'int64', values: [1.5] })];
    chk(() => bad.every((r) => r.threw && /pageFilters\[0\]/.test(r.threw)), () => `A3-9: a literal that is not Power BI's, or a value of the wrong type, is refused: ${JSON.stringify(bad.map((r) => r.threw || 'written'))}`);
  }

  // ---------- A3-12: build split into its query, sizing, page and notes modules (each loadable alone; build puts them together) ----------
  {
    const mod = (f) => get(() => req('../assets/js/' + f + '.js')), Q = mod('pbip-query'), Z = mod('pbip-sizing'), Pg = mod('pbip-page'), N = mod('pbip-notes');
    chk(() => typeof Q.bindQuery === 'function' && typeof Q.daxNames.column === 'function' && typeof Q.measures === 'function' && typeof Z.textWidth === 'function' && typeof Z.make === 'function'
      && typeof Pg.write === 'function' && typeof Pg.kit === 'function' && typeof Pg.tooltips === 'function' && typeof N.make === 'function' && typeof N.result === 'function',
      () => `A3-12: the modules pbip-query.js, pbip-sizing.js, pbip-page.js and pbip-notes.js export their parts: ${JSON.stringify([Q, Z, Pg, N].map((m) => (m && !m.threw ? Object.keys(m).length : m && m.threw)))}`);
    chk(() => Px.textWidth === Z.textWidth && Px.daxNames === Q.daxNames && Px.barNameShare === Z.barNameShare && Px.timeAxisPlan === Q.timeAxisPlan,
      () => 'A3-12: pbip-export.js re-exports the modules\' own functions (one of each)');
    const s = fs.readFileSync(path.join(REPO, 'assets/js/pbip-export.js'), 'utf8'), lines = s.split('\n'), from = lines.findIndex((l) => /^  function build\(o\) \{/.test(l)), to = lines.findIndex((l, i) => i > from && /^  \}$/.test(l));
    chk(() => from > 0 && to - from < 250, () => `A3-12: build is the orchestrator, under 250 lines (it was about 1,400): ${to - from}`);
    // the website loads the five files in order, each with its stamp
    const tg = fs.readFileSync(path.join(REPO, 'assets/js/theme-generator.js'), 'utf8'), order = ['pbip-query', 'pbip-sizing', 'pbip-notes', 'pbip-page', 'pbip-export'].map((f) => tg.indexOf(f + '.min.js?v='));
    chk(() => order.every((i, k) => i > 0 && (k === 0 || i > order[k - 1])), () => `A3-12: the website loads the writer's modules before pbip-export.min.js: ${JSON.stringify(order)}`);
  }

  // ---------- the audit's "seen, not in scope" items in the writer: B-23 (a table's grid entry), B-06 (a text column's room) ----------
  {
    // B-23: a table whose known rows need tight rows (grid.rowPadding 0) and that holds pictures (grid.imageHeight) keeps both:
    // the pictures' entry replaced the rows' one
    const r = get(() => build(base({ table: [C('Day Name', { sortBy: { t: D, c: 'Day No' } }, D), M('Total Sales')] }), { pages: hand(1280, 720, [{ kind: 'table', title: 'T', x: 24, y: 80, w: 600, h: 150 }]),
      svgColumns: [{ page: 0, t: T, m: 'Bar', expression: '"<svg/>"', w: 120, h: 24 }] }));
    const grid = r.files ? ((visuals(r).find((v) => v.visual.visualType === 'tableEx') || { visual: { objects: {} } }).visual.objects.grid || []) : [];
    chk(() => grid.length === 1 && grid[0].properties.rowPadding && grid[0].properties.imageHeight && grid[0].properties.imageWidth,
      () => `B-23: one grid entry with the tight rows and the pictures' size: ${r.threw || JSON.stringify(grid)}`);
    // B-06: a text column's room was 12 letters whatever it holds; a day or month name's values are known (its family's
    // names), so its room is its widest name: "Wednesday" (71) needs less, "Jumada al-Akhirah" (113) more
    const tbl = (c, w) => get(() => build(base({ table: [c, M('A', { tableFormat: '#,0' }), M('B', { tableFormat: '#,0' }), M('C', { tableFormat: '#,0' })] }), { pages: hand(1280, 720, [{ kind: 'table', title: 'T', x: 24, y: 80, w, h: 400 }]) }));
    const cut = (x) => (x.tableColumns || []).length + (x.tableSmaller || []).length;
    // (rc1, S1/S2: the rooms are cellRoom's since, the one rule of the kept fields and the widths: padding 16 at 720, numbers
    // "#,0" 105, Day Name 87, Customer 104, a Hijri month 129; a table 446 wide has 410 for its columns)
    const days = tbl(C('Day Name', { sortBy: { t: D, c: 'Day No' } }, D), 446), hij = tbl(C('HM', { kind: 'month', family: 'hijri' }, D), 446), plain = tbl(C('Customer'), 446);
    chk(() => cut(days) === 0 && cut(hij) > 0 && cut(plain) > 0,
      () => `B-06: a known name column takes its widest name's room (days fit 410; the picker's Hijri months, under a short header, don't), another text column 12 letters as before: days ${days.threw || cut(days)}, hijri ${hij.threw || cut(hij)}, customer ${plain.threw || cut(plain)}`);
  }

  // ---------- audit 6's writer items: A6-12 (build tells what it bound), A6-14 (one page filter from typed values) ----------
  {
    // A6-12: the fields each written visual shows, page by page, as written (Table[Field], Sum(Table[Field])); a model with no
    // time axis gives no line chart (its room went to the visual beside it), and helpers (sort, hidden name, pictures) are not fields
    const r = get(() => build(base({ table: [C('City'), M('Total Sales'), C('Qty', { agg: 0 })] }), { layout: { filters: true } })), bd = r.bound || [], vs = bd.flatMap((p) => p.visuals);
    chk(() => bd.length === 1 && bd[0].page && vs.length > 3 && !vs.some((v) => v.kind === 'line') && vs.filter((v) => v.kind === 'kpi').map((v) => v.fields.join()).join('|') === 'Sales[Total Sales]|Sales[Orders]'
      && vs.find((v) => v.kind === 'table').fields.join() === 'Sales[City],Sales[Total Sales],Sum(Sales[Qty])' && vs.filter((v) => v.kind === 'slicer').map((v) => v.fields.join()).join() === 'Sales[City]',
      () => `A6-12: build returns bound, the fields of every visual it wrote: ${r.threw || JSON.stringify(bd).slice(0, 500)}`);
    const wd = get(() => build(base({ date: C('Month Name', { sortBy: { t: D, c: 'Month No' } }, D) }))), lv = (wd.bound || []).flatMap((p) => p.visuals).find((v) => v.kind === 'line');
    chk(() => lv && lv.fields.join() === 'Dates[Month Name],Sales[Total Sales]', () => `A6-12: with a time axis the line chart is bound to it, its sort helper not listed: ${wd.threw || JSON.stringify(lv)}`);
    // A6-14: Pbip.pageFilterOf(col, values) writes the PBIR filter with Power BI's literals (the website can filter too)
    const pf = get(() => Px.pageFilterOf({ t: T, c: 'City', type: 'string' }, ["O'Brien", 'Dubai'])), num = get(() => Px.pageFilterOf({ t: T, c: 'Year', type: 'int64' }, [2024]));
    const lits = (f) => (f && f.filter ? f.filter.Where[0].Condition.In.Values.map((v) => v[0].Literal.Value) : f);
    chk(() => JSON.stringify(lits(pf)) === JSON.stringify(["'O''Brien'", "'Dubai'"]) && JSON.stringify(lits(num)) === '["2024L"]' && pf.type === 'Categorical' && pf.field.Column.Property === 'City' && /^Filter/.test(pf.name),
      () => `A6-14: pageFilterOf gives the basic filter with its literals: ${JSON.stringify(pf).slice(0, 300)}`);
    const bad = get(() => Px.pageFilterOf({ t: T, c: 'Year', type: 'int64' }, [1.5]));
    chk(() => bad && /whole number|TypeError|must/.test(bad.threw || ''), () => `A6-14: a value of the wrong type is refused: ${JSON.stringify(bad)}`);
  }

  // ---------- A2-3: one pure fitSlots in the design engine; the writer, plan_layout and the website's PNG all call it ----------
  {
    const fit = E.fitSlots, sl = [{ kind: 'title', x: 0, y: 0, w: 600, h: 60 }, { kind: 'logo', x: 600, y: 0, w: 200, h: 60 }, { kind: 'line', x: 0, y: 80, w: 100, h: 50 }, { kind: 'line', x: 110, y: 80, w: 100, h: 50 },
      { kind: 'table', x: 0, y: 140, w: 210, h: 50 }, { kind: 'slicer', x: 600, y: 80, w: 100, h: 400 }];
    const copy = JSON.stringify(sl), out = typeof fit === 'function' ? fit(sl, { dropKinds: ['line'], headerRows: 10, railItems: { n: 2, minH: 30, maxH: 50, resetH: 30, pad: 10, gap: 8 } }) : null;
    const t = out && out.slots.find((x) => x.kind === 'table'), hd = out && out.slots.find((x) => x.kind === 'title'), rail = out && out.slots.find((x) => x.kind === 'slicer');
    chk(() => out && JSON.stringify(sl) === copy && out.dropped.length === 2 && !out.slots.some((x) => x.kind === 'line') && t.y === 90 && t.h === 110 && hd.h === 70 && hd.textH === 60
      && rail.y === 90 && rail.stack === true && rail.h === Math.ceil(2 * 10 + 2 * 50 + 8 * 2 + 30),
      () => `A2-3: E.fitSlots drops a kind (touching slots merged, the room to the visual beside), grows the header, fits the rail to its items, never changes its input: ${JSON.stringify(out)}`);
    chk(() => typeof E.absorb === 'function' && JSON.stringify(fit(sl, {}).slots) === copy, () => 'A2-3: E.absorb is the engine\'s; with no options fitSlots moves nothing');
    // the writer measures (tabs, the rail's slicers and Reset), the engine moves: no slot rule left in the writer
    const pgSrc = fs.readFileSync(path.join(REPO, 'assets/js/pbip-page.js'), 'utf8');
    chk(() => !/function absorb|function dropLines|const grown = |const railFit = |SLOT_GAP/.test(pgSrc) && /fitSlots/.test(pgSrc) && typeof Px.fitOptions === 'function' && !fs.existsSync(path.join(HERE, 'lib/slots.mjs')),
      () => 'A2-3: absorb, dropLines, grown and railFit are gone from the writer (it calls E.fitSlots with Pbip.fitOptions), and mcp/lib/slots.mjs is deleted');
    // the report's visuals sit exactly on the fitted slots: a designed report on a model with no time axis, two pages
    const o = (() => { const d = E.fresh(); d.layout = Object.assign({}, d.layout, { filters: true, fpos: 'start' }); E.repairState(d);
      const specs = E.projectPages(d.layout, 'en', { second: true, panel: false });
      return { name: 'W fit', title: 'W fit', lang: 'en', rtl: false, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), sample: false, model: { byPath: 'M.SemanticModel' }, bind: base(), texts: E.REPORT_TEXTS.en,
        pages: specs.map((sp) => ({ name: sp.name + ' with a much longer page name for the tabs', page: sp.page, slots: sp.slots, panel: sp.panel, png: new Uint8Array([1]), grow: true })) }; })();
    const r = get(() => Px.build(o)), fo = get(() => Px.fitOptions(o)), pages = Array.isArray(fo) ? o.pages.map((pg, i) => fit(pg.slots, fo[i]).slots) : [];
    const box = (v) => [v.position.x, v.position.y, v.position.width, v.position.height].join(','), DATA = ['clusteredBarChart', 'clusteredColumnChart', 'donutChart', 'tableEx'];
    const pj = r.files ? r.files.filter((f) => /\/page\.json$/.test(f.path)).map((f) => JSON.parse(String(f.data))).filter((p) => p.type !== 'Tooltip') : [];
    const written = pj.map((p) => r.files.filter((f) => f.path.includes('/pages/' + p.name + '/') && /visual\.json$/.test(f.path)).map((f) => JSON.parse(String(f.data))).filter((v) => v.visual && DATA.includes(v.visual.visualType) && !v.parentGroupName).map(box).sort());
    const planned = pages.map((sl2) => sl2.filter((s) => ['bar', 'column', 'donut', 'table'].includes(s.kind)).map((s) => [s.x, s.y, s.w, s.h].join(',')).sort());
    // (changed in 0.2.9 rc1, S3: a table ends on a whole row, so its box is its slot's, less under one row at the bottom)
    const onSlot = (b, pl) => pl.includes(b) || pl.some((q) => { const [x, y, w, h] = b.split(',').map(Number), [x2, y2, w2, h2] = q.split(',').map(Number); return x === x2 && y === y2 && w === w2 && h <= h2 && h2 - h < 30; });
    chk(() => written.length === 2 && written.every((w, i) => w.length && w.every((b) => onSlot(b, planned[i]))) && fo.every((f) => (f.dropKinds || []).includes('line')),
      () => `A2-3: every chart and table of the report is on a slot of fitSlots(slots, fitOptions): written ${JSON.stringify(written)} fitted ${JSON.stringify(planned)} ${r.threw || ''} ${fo && fo.threw || ''}`);
    // the website's PNG and plan_layout take the same fitting
    const tg = fs.readFileSync(path.join(REPO, 'assets/js/theme-generator.js'), 'utf8'), srv = serverSource();
    chk(() => /fitSlots/.test(tg) && /fitOptions/.test(tg) && !/dropLines/.test(tg) && /fitOptions/.test(srv), () => 'A2-3: the website\'s background PNG and plan_layout fit the slots with the writer\'s options');
  }

  // ---------- F-W1 (the fuzz test, seed 7 case 809): a 200,000-character name is measured and fitted in bounded time ----------
  {
    const huge = 'x'.repeat(200000), words = Array.from({ length: 40000 }, (_, i) => 'w' + i).join(' ');
    const run = (name) => { const t0 = Date.now(), r = get(() => build(base({ kpis: [M(name), M('Orders')], measure: M(name), cats: { bar: C(name), column: C('Channel'), donut: C('Channel') }, slicers: [C(name), null, null] }), { layout: { filters: true } })); return { r, ms: Date.now() - t0 }; };
    const one = run(huge), many = run(words);
    const cutTitles = (x) => (x.r.kpiTitles ? x.r.kpiTitles.shortened.length : 0) + (x.r.titles ? x.r.titles.shortened.length + x.r.titles.slicers.length : 0);
    chk(() => one.ms < 3000 && many.ms < 3000 && one.r.files && many.r.files && cutTitles(one) >= 2 && cutTitles(many) >= 2
      && visuals(one.r).every((v) => (titleOf(v) || '').length < 2000),
      () => `F-W1: a 200,000-character name (one word, or 40,000 words) is fitted fast and its titles are cut: one word ${one.ms} ms, ${one.r.threw || cutTitles(one) + ' cut'}; words ${many.ms} ms, ${many.r.threw || cutTitles(many) + ' cut'}`);
  }

  // ---------- rc1 release blocker 1 (the laptop's 11 Oct proof, O-13 again): a month label of a DAX table (no type, no date
  // column the picker can type, no sort-by column) was written in alphabetical order; it is put in time order by the label
  // itself read as a date (a report measure), kept to the last 12 months, and the plan says so ----------
  {
    const my = C('Month-Year', { type: 'unknown' }, 'Calendar');
    const r = get(() => build(base({ date: my, measure: M('Total Sales') }), { pages: hand(1280, 720, [{ kind: 'line', title: 'L', x: 24, y: 80, w: 900, h: 400 }]) }));
    const line = r.files ? visuals(r).find((v) => v.visual.visualType === 'lineChart') : null, sd = line && line.visual.query.sortDefinition, ms = measures(r);
    const key = ms.find((m) => /Month start/.test(m.name)), last = ms.find((m) => /^Last 12 months/.test(m.name));
    chk(() => (Px.timeAxisPlan(my) || {}).order === 'monthLabel' && sd && sd.sort[0].field.Measure && sd.sort[0].field.Measure.Expression.SourceRef.Schema === 'extension'
      && key && key.t === 'Calendar' && /DATEVALUE/.test(key.expression) && /'Calendar'\[Month-Year\]/.test(key.expression) && last && /ISBLANK \( _last \)/.test(last.expression)
      && (line.filterConfig || { filters: [] }).filters.some((f) => /Last 12 months/.test(JSON.stringify(f))),
      () => `rc1-1: an untyped Month-Year label is ordered by the label read as a date and kept to its last 12 months (and nothing parsed keeps every month): ${r.threw || JSON.stringify({ plan: Px.timeAxisPlan(my), sd, ms: ms.map((m) => m.name) })}`);
    // a "period" or week label is not read as a date (G11); a month label with a date column keeps the exact month start
    chk(() => Px.timeAxisPlan(C('Payment Period', { type: 'unknown' })).order === 'az' && Px.timeAxisPlan(C('Month-Year', { dateOf: { t: D, c: 'Date' } }, D)).order === 'monthStart',
      () => 'rc1-1: only a month label is read as a date; a label with its date column keeps the month start');
    const srv = serverSource();
    chk(() => /monthLabel: /.test(srv), () => 'rc1-1: plan_layout says how a month label read as a date is ordered (timeAxis.how), before the plan is approved');
  }

  // ---------- rc1 release blocker 2 (PERF-COMPARE S1, S2): table amounts wrapped onto two lines and headers were cut ----------
  {
    const tbl = (fields, w, page) => get(() => build(base({ table: fields }), { pages: hand(page ? page.w : 1920, page ? page.h : 1080, [{ kind: 'table', title: 'T', x: 24, y: 120, w, h: 500 }]) }));
    const check = (r) => { const v = r.files && visuals(r).find((x) => x.visual.visualType === 'tableEx'); if (!v) return ['no table: ' + (r.threw || '')];
      const th = JSON.parse(String(r.files.find((f) => /RegisteredResources\/[^/]+theme\.json$/.test(f.path)).data)), vf = ((v.visual.objects.values || [{ properties: {} }])[0].properties || {}).fontSize;
      const T = vf ? parseFloat(L(vf)) : +th.visualStyles.tableEx['*'].values[0].fontSize, bad = [];
      const widths = Object.fromEntries((v.visual.objects.columnWidth || []).map((e) => [e.selector.metadata, parseFloat(L(e.properties.value))]));
      v.visual.query.queryState.Values.projections.forEach((p) => { const wd = widths[p.queryRef]; if (wd == null || wd <= 1) return;
        const head = Px.textWidth(p.displayName || p.nativeQueryRef, T, true, 'Segoe UI');
        if (wd < head + 10) bad.push(`header "${p.nativeQueryRef}" ${head.toFixed(0)} in ${wd}`);
        if ((p.field.Measure || p.field.Aggregation) && wd < Px.textWidth('8,888,888,888', T, false, 'Segoe UI') + 10) bad.push(`number "${p.nativeQueryRef}" in ${wd}`); });
      const total = Object.values(widths).reduce((a2, x) => a2 + x, 0); if (total > v.position.width) bad.push(`columns ${total} in a table ${v.position.width}`);
      return bad; };
    const money = (n) => M(n, { tableFormat: '$#,0.00' });
    const a1 = tbl([C('Region'), money('Revenue'), money('Total Cost of Goods'), M('Quantity Sold In Store'), M('Exposure At Default')], 927);
    const a2 = tbl([C('Issue'), money('Revenue'), money('Total Milestones Budget'), money('Average Wait Time Minutes'), money('Gross Margin'), money('Net Margin'), money('Discount Given')], 927);
    chk(() => !check(a1).length && !check(a2).length && ((a2.tableColumns || []).length || (a2.tableSmaller || []).length),
      () => `rc1-2: every number as wide as its widest value, every header whole, all within the table (a table with too many fields leaves one out or takes a smaller text, told): ${JSON.stringify([check(a1), check(a2), a2.tableColumns && a2.tableColumns.length, a2.tableSmaller])}`);
  }

  // ---------- rc1 item 4 (PERF-COMPARE S5, S7, D15, Task 1): crowded category charts, and the empty column under a short rail ----------
  {
    const r = get(() => build(base({ cats: { bar: C('Product'), column: C('City'), donut: C('Channel') } }), { pages: hand(1280, 720, [
      { kind: 'bar', title: 'B', x: 24, y: 80, w: 600, h: 300 }, { kind: 'column', title: 'K', x: 640, y: 80, w: 500, h: 300 }, { kind: 'column', title: 'Q', x: 640, y: 400, w: 500, h: 300 }]) }));
    const vs = r.files ? visuals(r).filter((v) => /^clustered(Bar|Column)Chart$/.test(v.visual.visualType)) : [];
    // (design round 10, N14: a report chart's Top N is kept by a report measure, "Keep: ...": N is its rank's limit)
    const topOf = (v) => { const fs = (v.filterConfig || {}).filters || [], f = fs.find((x) => x.type === 'TopN'); if (f) return f.filter.From[0].Expression.Subquery.Query.Top;
      const k = fs.find((x) => x.field && x.field.Measure && /^Keep: /.test(x.field.Measure.Property)), ext = k && r.files && r.files.find((g) => /reportExtensions\.json$/.test(g.path));
      const m = ext && JSON.parse(String(ext.data)).entities.flatMap((e) => e.measures).find((x) => x.name === k.field.Measure.Property), n = m && m.expression.match(/MIN \( _n, (\d+) \) = \1, (\d+), _n \)/);
      return n ? +n[2] : null; };
    const bar = vs.find((v) => v.position.x === 24), col = vs.find((v) => v.position.x === 640 && v.position.y === 80);
    // a bar chart 300 high at 720: (300 - 45 - 8 - 38) / 22.2 = 9 rows; a column chart 500 wide: room for 12-character labels
    // (design round 8, N2/N3: the title says "Top N of M:" only when the chart leaves categories out: a report measure)
    const extTitle = (v) => { const m = (((v.visual.visualContainerObjects || {}).title || [])[0] || { properties: {} }).properties.text, ref = m && m.expr && m.expr.Measure; if (!ref || !r.files) return '';
      const ext = r.files.find((f) => /reportExtensions\.json$/.test(f.path)); return ext ? (JSON.parse(String(ext.data)).entities.flatMap((e) => e.measures).find((x) => x.name === ref.Property) || {}).expression || '' : ''; };
    chk(() => topOf(bar) === 9 && topOf(col) >= 3 && /, 9, _n \)/.test(extTitle(bar)) && new RegExp(', ' + topOf(col) + ', _n \\)').test(extTitle(col)) && (r.topCharts || []).length >= 2,   /* (round 7: S5 belongs to the design block, which reports the cut charts as topCharts) */
      () => `rc1-4: a chart by a text category shows its top N by its measure, N the rows or columns it holds, said in its title and told: ${r.threw || JSON.stringify(vs.map((v) => [extTitle(v) || titleOf(v), topOf(v)]))}`);
    const t = get(() => build(base({ cats: { bar: C('Month Name', { sortBy: { t: D, c: 'Month No' } }, D), column: C('Quarter', {}, D), donut: C('Channel') } }), { pages: hand(1280, 720, [{ kind: 'bar', title: 'B', x: 24, y: 80, w: 600, h: 300 }, { kind: 'column', title: 'K', x: 640, y: 80, w: 500, h: 300 }]) }));
    chk(() => t.files && visuals(t).filter((v) => /^clustered/.test(v.visual.visualType) && v.position.x !== 12).every((v) => topOf(v) == null), () => 'rc1-4: a time or known category (months, quarters) is never cut to a top N');
    // the website's sample report (4 values a category) is never cut and never titled "Top N" (the tooltip page's own
    // "Top 6", at x 12, is older and left as it is)
    const sm = get(() => build(null, { sample: true, model: null, pages: hand(1280, 720, [{ kind: 'bar', title: 'B', x: 24, y: 80, w: 600, h: 300 }, { kind: 'column', title: 'K', x: 640, y: 80, w: 500, h: 300 }]) }));
    chk(() => sm.files && visuals(sm).filter((v) => /^clustered/.test(v.visual.visualType) && v.position.x !== 12).length === 2 && visuals(sm).filter((v) => /^clustered/.test(v.visual.visualType) && v.position.x !== 12).every((v) => topOf(v) == null && !/^Top \d/.test(titleOf(v) || '')) && !(sm.topCharts || []).length,
      () => `rc1-4: the sample report's charts are not cut to a top N: ${sm.threw || JSON.stringify(visuals(sm).map((v) => [titleOf(v), topOf(v)]))}`);
    // S7: under a rail fitted to its slicers, the bottom row's visual beside the rail takes the rail's column
    const sl = [{ kind: 'slicer', x: 1068, y: 70, w: 196, h: 634 }, { kind: 'bar', x: 16, y: 178, w: 1040, h: 293 }, { kind: 'column', x: 16, y: 483, w: 514, h: 221 }, { kind: 'table', x: 542, y: 483, w: 514, h: 221 }];
    const f = E.fitSlots(sl, { railItems: { n: 2, minH: 50, maxH: 50, resetH: 30, pad: 10, gap: 8 } }).slots, tb = f.find((x) => x.kind === 'table'), br = f.find((x) => x.kind === 'bar');
    // (design round 9, the re-score's S7: a chart alone in its row beside a short rail, which would keep under half its
    // height by ending at the rail, starts under the rail and takes its column: the bar, a row's gap under the rail)
    chk(() => tb.x === 542 && tb.w === 1264 - 542 && br.w === 1264 - 16 && br.y === 70 + 166 + 12 && br.y + br.h === 178 + 293 && f.find((x) => x.kind === 'column').w === 514,
      () => `rc1-4 S7: the bottom row's visual beside a short rail takes the rail's column; the chart alone beside it starts under the rail and takes its column: ${JSON.stringify(f)}`);
  }

  // ---------- rc1 DETAIL-2 and the reviewer's addition (S3, D3): tooltip pages, table rows, slicer headers ----------
  {
    const pagesOf = (r) => r.files.filter((f) => /pages\/[^/]+\/page\.json$/.test(f.path)).map((f) => { const pj = JSON.parse(String(f.data)), dir = f.path.replace(/page\.json$/, '');
      return Object.assign(pj, { vs: r.files.filter((x) => x.path.startsWith(dir) && /visual\.json$/.test(x.path)).map((x) => JSON.parse(String(x.data))).filter((v) => v.visual) }); });
    const tips = (r) => pagesOf(r).filter((p) => p.type === 'Tooltip'), trendOf = (r) => tips(r).find((p) => / · /.test(p.displayName)), topOf = (r) => tips(r).find((p) => !/ · /.test(p.displayName));
    const barOf = (p) => p && p.vs.find((v) => v.visual.visualType === 'clusteredBarChart');
    const hasNotBlank = (v) => JSON.stringify((v.filterConfig || {}).filters || []).includes('"Not"');
    // the measured bar chart (Desktop 2.158, night of 6-7 Oct, at the 10pt theme text): 22.2 a row, 45 above the first, 8 under the last
    const rowsFit = (h, n) => h >= 45 + 8 + 22.2 * n;
    const monthName = C('Month Name', { sortBy: { t: D, c: 'Month No' } }, D);
    const r = get(() => build(base({ date: monthName, tip: { card: M('Total Sales'), cat: C('Product'), y: M('Total Sales'), date: monthName } })));
    const tr = r.files ? trendOf(r) : null, tb = barOf(tr), top = r.files ? barOf(topOf(r)) : null;
    // T1: the month tooltip gets the chart's "is not blank" filter, so no "(Blank)" row (13 rows, a scrollbar)
    chk(() => tb && hasNotBlank(tb), () => `T1: the month tooltip's bars leave the blank month out: ${r.threw || JSON.stringify(tb && tb.filterConfig || null)}`);
    // T9 and T6: the tooltip's bar chart holds its 12 months and its 6 bars, and the page holds the chart
    chk(() => tb && rowsFit(tb.position.height, 12) && tb.position.y + tb.position.height <= tr.height && top && rowsFit(top.position.height, 6) && top.position.y + top.position.height <= topOf(r).height,
      () => `T6/T9: 12 months need ${Math.ceil(53 + 22.2 * 12)} and 6 bars ${Math.ceil(53 + 22.2 * 6)}: ${JSON.stringify([tb && tb.position, tr && tr.height, top && top.position, r.files && topOf(r).height])}`);
    // T8: the Top 6 names take the share of a narrow bar chart (barNameShare: 50 under 560 wide at 720), as the page's bar charts
    const mm = (v) => L(((((v || {}).visual || {}).objects || {}).categoryAxis || [{ properties: {} }])[0].properties.maxMarginFactor);
    chk(() => mm(top) === String(Px.barNameShare(296, 720)) + 'L' && mm(tb) === String(Px.barNameShare(296, 720)) + 'L', () => `T8: the tooltip's names take ${Px.barNameShare(296, 720)}% of its width: ${mm(top)} ${mm(tb)}`);
    // T10: a measure shown whole on the cards (a unit in its format, "#,0 \"kg\"") shows its own format on the tooltip's bars, never "8.0Kkg"
    // (round 7, the design block's T4: each tooltip page shows the hovered chart's own measure, so the charts here show
    // the kg measure too; before, the pages showed the picker's tooltip card whatever the chart's measure)
    const kg = M('Weight', { wholeFormat: '#,0 "kg"' }), rk = get(() => build(base({ measure: kg, date: monthName, tip: { card: kg, cat: C('Product'), y: kg, date: monthName } })));
    const units = (v) => L(((((v || {}).visual || {}).objects || {}).labels || [{ properties: {} }])[0].properties.labelDisplayUnits);
    chk(() => rk.files && units(barOf(topOf(rk))) === '1D' && units(barOf(trendOf(rk))) === '1D' && units(top) == null,
      () => `T10: a whole-number measure's tooltip labels have no display units (its format's unit kept): ${rk.threw || JSON.stringify([units(barOf(topOf(rk))), units(barOf(trendOf(rk))), units(top)])}`);
    // T2: an untyped month-year label: the month tooltip in time order, its last 6 months (as the line chart, item 1)
    const my = C('Month Year', { type: 'unknown' }), r2 = get(() => build(base({ date: my, tip: { card: M('Total Sales'), cat: C('Product'), y: M('Total Sales'), date: my } })));
    const t2 = r2.files ? barOf(trendOf(r2)) : null, sd = t2 && JSON.stringify(t2.visual.query.sortDefinition || null);
    chk(() => t2 && /Month start/.test(sd) && /Descending/.test(sd) && JSON.stringify(t2.filterConfig || {}).includes('Last'),
      () => `T2: the month tooltip of a month label is in time order, newest first, its last months: ${r2.threw || JSON.stringify([sd, (t2 && t2.filterConfig || {}).filters])}`);
    // S3: a table of rows the model doesn't count ends on a whole row: its height is the title, the header, whole rows
    // and the total. (Changed in writer round 8: the numbers MEASURED in Desktop 2.158, dataarcus-engine
    // lab/proof-0.2.9-rc1 business/beta/MEASURE-TABLE-ROWS.md, at 1280 x 720, 10pt values, 12pt title: 62.1 to the header's
    // rule, 19.8 a row, 21 the total, about 4 under it; at 1920 x 1080, 15pt, 18pt title: 90.3, 29.8, 31, about 6, and
    // "for 6 rows 306, for 7 rows 336". The test before used round 11's 8pt numbers, which rc.3 showed wrong at 1920.)
    // (Changed in P3-3 N21, 13 Oct: re-measured in Desktop 2.158, N21-LAB.md (PDF and screen to 0.3 px), the reviewer's
    // round: regular Segoe UI 62.0 to the header's rule, 20.0 a row, the pinned total block 29.3 at 1280 x 720 10pt; 90.0,
    // 30.0, 40.2 at 1920 x 1080 15pt. S3's numbers were short by 4.2 and 2.9 a table, so the total line cut the last row (N21,
    // D3). The rows these two slots hold stay 10 and 5; only the heights move, to 291.3 and 280.2.)
    const M720 = { top: 62.0, row: 20.0, total: 29.3, under: 0 }, M1080 = { top: 90.0, row: 30.0, total: 40.2, under: 0 };
    const whole = (h, m) => { const k = Math.floor((h - m.top - m.total - m.under) / m.row); return { k, h: m.top + k * m.row + m.total + m.under }; };
    const rt = get(() => build(base({ table: [C('City'), M('Total Sales')] }), { pages: hand(1280, 720, [{ kind: 'table', title: 'T', x: 24, y: 80, w: 600, h: 300 }]) }));
    const tv = rt.files ? visuals(rt).find((v) => v.visual.visualType === 'tableEx') : null, w720 = whole(300, M720);
    chk(() => tv && tv.position.y === 80 && Math.abs(tv.position.height - w720.h) <= 1.5,
      () => `S3: a 300-high table at 1280 x 720 shows ${w720.k} whole rows and its total in ${w720.h.toFixed(1)} (measured): ${rt.threw || JSON.stringify(tv && tv.position)}`);
    // (the theme as create_report scales it for a 1920 x 1080 page: the table's text 15pt, the title 18pt, as measured)
    const th15 = (() => { const d = E.fresh(); E.repairState(d); const t = E.buildTheme(d, 'en'); const tb = t.visualStyles.tableEx['*']; ['values', 'columnHeaders', 'total'].forEach((k) => (tb[k] || []).forEach((e) => { if (e.fontSize != null) e.fontSize = 15; })); tb.values[0].fontSize = 15; t.textClasses.title.fontSize = 18; return t; })();
    const r1 = get(() => build(base({ table: [C('City'), M('Total Sales')] }), { theme: th15, pages: hand(1920, 1080, [{ kind: 'table', title: 'T', x: 24, y: 120, w: 900, h: 302 }]) }));
    const t1 = r1.files ? visuals(r1).find((v) => v.visual.visualType === 'tableEx') : null, w1080 = whole(302, M1080);
    // (RESCORE-1's page-1 case: 302 high at 1920 x 1080 holds 5.9 rows: 5 whole rows and the total, 276.3)
    chk(() => t1 && w1080.k === 5 && Math.abs(t1.position.height - w1080.h) <= 1.5,
      () => `S3: the 302-high table at 1920 x 1080 shows 5 whole rows and its total in ${w1080.h.toFixed(1)} (measured): ${r1.threw || JSON.stringify(t1 && t1.position)}`);
    // S3 with the design's N6 (the reviewer's resolution, 12 Oct): a table beside a chart in one row of the page: the table
    // visual ends on its whole rows (measured), its panel keeps the slot's height, and the panel's bottom is the chart's;
    // (changed in writer round 9: the table's own shadow is off, the panel's is drawn: the laptop's local resolution, S3 FIXED
    // in Desktop on rc.4 with it; the round-8 check had it left to the theme)
    const row = [{ kind: 'table', title: 'T', x: 24, y: 120, w: 900, h: 302 }, { kind: 'bar', title: 'B', x: 948, y: 120, w: 900, h: 302 }];
    for (const nd of [true, false]) {
      const rp = get(() => build(base({ table: [C('City'), M('Total Sales')] }), { theme: th15, noDataMessage: nd, pages: hand(1920, 1080, row) }));
      const vs = rp.files ? visuals(rp) : [], tb = vs.find((v) => v.visual.visualType === 'tableEx'), ch = vs.find((v) => v.visual.visualType === 'clusteredBarChart');
      const panel = vs.find((v) => v !== tb && v.position.x === 24 && v.position.y === 120 && v.position.height === 302 && /^(cardVisual|textbox)$/.test(v.visual.visualType));
      const shadowOff = tb && L((((tb.visual.visualContainerObjects || {}).dropShadow || [])[0] || { properties: {} }).properties.show) === 'false';
      chk(() => tb && Math.abs(tb.position.height - w1080.h) <= 1.5 && panel && panel.position.y + panel.position.height === ch.position.y + ch.position.height && panel.position.z < tb.position.z && shadowOff && panel.position.tabOrder == null,
        () => `S3/N6 (${nd ? 'with' : 'without'} the "No data" card): the table on whole rows (${w1080.h.toFixed(1)}) inside a panel whose bottom is the chart's: ${rp.threw || JSON.stringify({ table: tb && tb.position, panel: panel && [panel.visual.visualType, panel.position], chart: ch && ch.position, shadowOff })}`);
    }
    const rd = get(() => build(base({ table: [C('Day Name', { kind: 'day', rows: 7 }), M('Total Sales')] }), { pages: hand(1280, 720, [{ kind: 'table', title: 'T', x: 24, y: 80, w: 600, h: 300 }]) }));
    chk(() => rd.files && visuals(rd).find((v) => v.visual.visualType === 'tableEx').position.height === 300, () => 'S3: a table whose rows all show (7 days) keeps its height');
    // D3: a long slicer header takes a smaller text, down to 8pt, before it is shortened
    const rs = get(() => build(base({ slicers: [C('Enforcement_History_Status'), null, null] }), { pages: hand(1280, 720, [{ kind: 'slicer', x: 1068, y: 70, w: 196, h: 300 }]) }));
    const sv = rs.files ? visuals(rs).find((v) => v.visual.visualType === 'slicer') : null, hd = sv && sv.visual.objects.header[0].properties;
    chk(() => hd && L(hd.text) == null && +L(hd.textSize).replace(/D$/, '') >= 8 && !(rs.titles && (rs.titles.slicers || []).length),
      () => `D3: "Enforcement_History_Status" in a 196-wide slicer is whole at a smaller header text: ${rs.threw || JSON.stringify(hd)} ${JSON.stringify(rs.titles && rs.titles.slicers)}`);
  }

  // ---------- writer round 8 (RESCORE-1): T6 by the tooltip's own measured rows, D18 the table's decimals, T10 through the picker ----------
  {
    const Bind = req('../assets/js/pbip-bind.js');
    const pagesOf = (r) => r.files.filter((f) => /pages\/[^/]+\/page\.json$/.test(f.path)).map((f) => { const pj = JSON.parse(String(f.data)), dir = f.path.replace(/page\.json$/, '');
      return Object.assign(pj, { vs: r.files.filter((x) => x.path.startsWith(dir) && /visual\.json$/.test(x.path)).map((x) => JSON.parse(String(x.data))).filter((v) => v.visual) }); });
    const r = get(() => build(base()));
    const tp = r.files ? pagesOf(r).find((p) => p.type === 'Tooltip' && !/ · /.test(p.displayName)) : null, bar = tp && tp.vs.find((v) => v.visual.visualType === 'clusteredBarChart');
    // T6 (RESCORE-1: a scrollbar beside the 6 bars at 187): the tooltip lab's measure of this very chart (8pt names, values
    // beside the bars, TOOLTIP-FIX-LAB, report-rules TIP_ROWS_6): 27 a bar and 40, plus the 8 under the last
    chk(() => bar && bar.position.height >= 40 + 27 * 6 + 8 && bar.position.y + bar.position.height <= tp.height,
      () => `T6: the Top 6 tooltip chart holds 6 bars at 27 + 40 (+ 8): ${r.threw || JSON.stringify([bar && bar.position, tp && tp.height])}`);
    // T8 (RESCORE-1: "Microsoft 365 Business Sta..."): measured on the laptop's crops, a tooltip bar chart's visible name room
    // is its share x its width - 18 (40%: 96, 50%: 129 at 296 wide); a 31-letter name at 8pt (158) needs a 352-wide chart
    // at 50%: the Top 6 page 376 wide (the reviewer's yes), its card and chart 352
    const need = Px.textWidth('Microsoft 365 Business Standard', 8, false, 'Segoe UI'), share = bar ? +String(L(bar.visual.objects.categoryAxis[0].properties.maxMarginFactor)).replace(/L$/, '') : 0;
    chk(() => tp.width === 376 && bar.position.width === 352 && share / 100 * bar.position.width - 18 >= need && tp.vs.every((v) => v.position.x + v.position.width <= tp.width),
      () => `T8: the Top 6 tooltip holds a 31-letter name (${need.toFixed(0)}): page ${tp && tp.width}, chart ${bar && bar.position.width}, share ${share}`);
    // S3 (writer round 8): one table of constants for a table's rows (pbip-sizing.js TABLE_ROWS), used by both height rules
    const Zs = req('../assets/js/pbip-sizing.js'), pgSrc = fs.readFileSync(path.join(REPO, 'assets/js/pbip-page.js'), 'utf8');
    chk(() => Zs.TABLE_ROWS && typeof Zs.tableHeight === 'function' && !/1\.415 \* t/.test(pgSrc) && (pgSrc.match(/tableHeight\(/g) || []).length >= 2,
      () => 'S3: the table row rule lives in pbip-sizing.js TABLE_ROWS, and pbip-page.js has no row constant of its own');
    // D18 (RESCORE-1: "$4,344,705.7026" in a table): a measure the format rule leaves alone keeps its model format on the
    // cards, and its table column shows 2 decimals at most (the report's number rule), the currency kept
    const tb = { name: 'Sales', columns: [{ name: 'Amount', dataType: 'decimal' }], measures: [{ name: 'Revenue', formatString: '\\$#,0.0000', expression: 'SUM ( Sales[Amount] )' }, { name: 'Cost', formatString: '#,0.0000', expression: 'SUM ( Sales[Amount] )' }, { name: 'Units', formatString: '#,0', expression: 'SUM ( Sales[Amount] )' }] };
    const rev = get(() => Bind.measureOf(tb, 'Revenue', [tb])), rate = get(() => Bind.measureOf(tb, 'Cost', [tb])), units = get(() => Bind.measureOf(tb, 'Units', [tb]));
    chk(() => rev.tableFormat === '\\$#,0.00' && rate.tableFormat === '#,0.00' && !units.tableFormat,
      () => `D18: a table amount with more than 2 decimals is shown with 2: ${JSON.stringify([rev.tableFormat, rate.tableFormat, units.tableFormat])}`);
    // T10 re-checked through the picker: a "#,0 \"kg\"" measure is whole on its card, and the tooltip's values show its own format
    const kgT = { name: 'Sales', columns: [{ name: 'Kg', dataType: 'int64' }], measures: [{ name: 'Weight', formatString: '#,0 "kg"', expression: 'SUM ( Sales[Kg] )' }] };
    const kg = Object.assign({ t: 'Sales', m: 'Weight' }, get(() => Bind.measureOf(kgT, 'Weight', [kgT])));
    const rk = get(() => build(base({ kpis: [kg, M('Orders')], measure: kg, tip: { card: kg, cat: C('Product'), y: kg } })));
    const kb = rk.files ? pagesOf(rk).filter((p) => p.type === 'Tooltip').flatMap((p) => p.vs).filter((v) => v.visual.visualType === 'clusteredBarChart') : [];
    chk(() => kg.wholeFormat && kb.length && kb.every((v) => L(v.visual.objects.labels[0].properties.labelDisplayUnits) === '1D'),
      () => `T10: the kg measure's tooltip values keep "kg" whole (display units None): ${rk.threw || JSON.stringify([kg.wholeFormat, kb.map((v) => v.visual.objects.labels)])}`);
  }

  // ---------- writer round 9 (RESCORE-2): D18 fixed decimals, D15 labels by their width, the table's panel card ----------
  {
    const Bind = req('../assets/js/pbip-bind.js');
    // D18 (RESCORE-2: "$2,484,247.5", "$1,395,881.25", "$2,721,900" in one column): a table amount shows exactly 2 decimals
    const tb = { name: 'Sales', columns: [{ name: 'Amount', dataType: 'decimal' }], measures: [['A', '\\$#,0.####'], ['B', '\\$#,0.##'], ['C', '#,0.0000'], ['D', '#,0.0'], ['E', '#,0.00']].map(([n, f]) => ({ name: n, formatString: f, expression: 'SUM ( Sales[Amount] )' })) };
    const tf = ['A', 'B', 'C', 'D', 'E'].map((n) => (get(() => Bind.measureOf(tb, n, [tb])) || {}).tableFormat || null);
    chk(() => JSON.stringify(tf) === JSON.stringify(['\\$#,0.00', '\\$#,0.00', '#,0.00', null, null]),
      () => `D18: one column, two fixed decimals (optional digits made fixed; 1 or 2 fixed decimals kept): ${JSON.stringify(tf)}`);
    // N8 (SHAPES-RC4, the laptop: "-€0,050.87M"): the model's format "€#,##0,000;-€#,##0,000;€0" has fixed zero placeholders
    // after a thousands comma; scaled to millions by the card's automatic units it is padded to four digits. Such a card
    // shows the number unscaled, in the model's format without the padding (as a whole number's card does: Custom units
    // and its own format, measured D8); an ordinary "€#,0" stays in automatic units. EUR, USD, AED and no currency
    const fm = (n, f) => ({ name: n, formatString: f, expression: 'SUM ( Sales[Amount] ) - SUM ( Sales[Amount] )' });
    const nt = { name: 'Sales', columns: [{ name: 'Amount', dataType: 'decimal' }], measures: [fm('Budget Variance', '€#,##0,000;-€#,##0,000;€0'), fm('Var USD', '$#,##0,000;($#,##0,000)'), fm('Var AED', '#,##0,000 "AED";-#,##0,000 "AED"'), fm('Var plain', '#,##0,000;-#,##0,000'), fm('Plain EUR', '€#,0;-€#,0')] };
    const kf = (n) => Object.assign({ t: 'Sales', m: n }, get(() => Bind.measureOf(nt, n, [nt])) || {});
    const wf = ['Budget Variance', 'Var USD', 'Var AED', 'Var plain', 'Plain EUR'].map((n) => kf(n).wholeFormat || null);
    // (changed in round 10, RESCORE-3 N11 + N13: the unscaled number, "-€50,866,000", was cut on a 6-card row (290 wide,
    // 36pt) and read in another style than the row's "€ 105.53M" cards. The card's own format now scales, to millions (the
    // value's size isn't known when the report is written): the format's own symbols and sign sections, no padding, the
    // "M" on the number and a text suffix after it; Microsoft's rule: two commas just left of the decimal point divide by
    // a million, at every level of format string)
    const MIL = (pre, post) => pre + '#,0,,.00"M"' + post;
    chk(() => JSON.stringify(wf.slice(0, 4)) === JSON.stringify([MIL('€', '') + ';' + MIL('-€', '') + ';€0', MIL('$', '') + ';' + MIL('($', ')'), MIL('', ' "AED"') + ';' + MIL('-', ' "AED"'), MIL('', '') + ';' + MIL('-', '')]) && wf[4] == null,
      () => `N8/N11: a padded format's card gets a scaled format of its own; "€#,0" keeps automatic units: ${JSON.stringify(wf)}`);
    // the text it prints, by Microsoft's rule (",," left of the point: / 1,000,000; "#,0" grouped; ".00" two decimals;
    // quoted text as is), positive and negative, against what the row's cards read ("€ 105.53M" style), and the width a
    // 290-wide card holds at 36pt (8 to 10 characters, RESCORE-3)
    const render = (fmt, v) => { const secs = fmt.split(';'), sec = v < 0 && secs[1] != null ? secs[1] : v === 0 && secs[2] != null ? secs[2] : secs[0];
      return sec.replace(/("[^"]*")|(#,0,,\.00)/g, (a, q, n) => (q ? q.slice(1, -1) : (Math.abs(v) / 1e6).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','))); };
    const shown = [[wf[0], -50866000], [wf[0], 105530000], [wf[2], -50870000], [wf[2], 50870], [wf[1], -50870000]].map(([f, v]) => render(f, v));
    chk(() => JSON.stringify(shown) === JSON.stringify(['-€50.87M', '€105.53M', '-50.87M AED', '0.05M AED', '($50.87M)']) && shown.every((t) => t.length <= 11),
      () => `N11/N13: the cards read "-€50.87M", "€105.53M", "-50.87M AED", "($50.87M)", short enough for a 290-wide card: ${JSON.stringify(shown)}`);
    const bv = kf('Budget Variance'), rn = get(() => build(base({ kpis: [bv, M('Orders')], measure: M('Orders') })));
    const kc = rn.files ? visuals(rn).find((v) => v.visual.visualType === 'cardVisual' && JSON.stringify(v.visual.query || '').includes('Budget Variance')) : null;
    const ve = kc ? kc.visual.objects.value.find((e) => e.selector && e.selector.metadata) : null;
    chk(() => ve && L(ve.properties.labelDisplayUnits) === '-1D' && S(ve.properties.customFormatString) === MIL('€', '') + ';' + MIL('-€', '') + ';€0',
      () => `N8: the card writes Custom units and that format (positive and negative sections): ${rn.threw || JSON.stringify(kc && kc.visual.objects.value)}`);
    // F4 (N8-LAB: "#,0 \"AED\";-#,0 \"AED\"" read "-50.87KAED" / "50.87MAED" in automatic units: the unit letter glued to the
    // text, its space lost; with Custom units and the model's own format it read right, unscaled): a card whose model format
    // carries quoted text after the number, or a prefix that is no currency, shows the number unscaled in that format, both signs; "€#,0",
    // "$#,0.00;($#,0.00)" stay on automatic units, "#,0" whole, as before
    const f4 = (f) => { const T = { name: 'S', columns: [{ name: 'A', dataType: 'decimal' }], measures: [{ name: 'X', formatString: f, expression: 'SUM ( S[A] )' }] }; return (get(() => Bind.measureOf(T, 'X', [T])) || {}).wholeFormat || null; };
    const g4 = ['#,0 "AED";-#,0 "AED"', '"AED" #,0;-"AED" #,0', '#,0.00 "AED"', '€#,0', '$#,0.00;($#,0.00)', '#,0'].map(f4);
    // (a currency code before the number reads right in automatic units, "EUR 54.66M": the owner's O-2, kept)
    // (changed in round 10's review: a text suffix without padding is not forced to millions, "950 AED" would read "0.00M
    // AED"; the card takes N8-LAB's setting B, automatic units with the decimals cleared, measured right: "-51K AED",
    // "51K AED", the space kept, a small value whole. Only a padded format (large by construction) scales to millions)
    const k4 = (f) => { const T = { name: 'S', columns: [{ name: 'A', dataType: 'decimal' }], measures: [{ name: 'X', formatString: f, expression: 'SUM ( S[A] )' }] }; return get(() => Bind.measureOf(T, 'X', [T])) || {}; };
    chk(() => JSON.stringify(g4) === JSON.stringify([null, null, null, null, null, '#,0']) && f4('"Qty " #,0') === '"Qty " #,0'   /* (a whole quantity with text stays whole, as "#,0 \"kg\"") */
      && k4('#,0 "AED";-#,0 "AED"').unitAuto === true && k4('#,0.00 "AED"').unitAuto === true && !k4('€#,0').unitAuto && !k4('"AED" #,0').unitAuto && f4('#,##0,000 "AED"') === MIL('', ' "AED"'),
      () => `F4: quoted text in a card's format: unscaled in that format; currency signs keep automatic units: ${JSON.stringify(g4)}`);
    // the cards (round 10's review): 950 "AED" in automatic units with no decimals set (setting B), 8,000 "kg" whole, never
    // "0.0xM"; the padded "€#,##0,000" card keeps its millions format
    const cardOf = (f, n) => { const fld = Object.assign({}, k4(f), { t: 'Sales', m: n }), r = get(() => build(base({ kpis: [fld, M('Orders')], measure: M('Orders') })));
      const v = r.files ? visuals(r).find((x) => x.visual.visualType === 'cardVisual' && JSON.stringify(x.visual.query || '').includes(n)) : null;
      const es = v ? v.visual.objects.value : [], def = (es.find((e) => e.selector && e.selector.id === 'default') || { properties: {} }).properties, own = (es.find((e) => e.selector && e.selector.metadata) || { properties: {} }).properties;
      return { prec: L(def.labelPrecision) || null, units: L(own.labelDisplayUnits) || null, fmt: S(own.customFormatString) || null }; };
    const aed = cardOf('#,0 "AED";-#,0 "AED"', 'Small AED'), kg = cardOf('#,0 "kg"', 'Weight Kg'), pad = cardOf('€#,##0,000;-€#,##0,000;€0', 'Padded EUR');
    chk(() => aed.prec == null && aed.units == null && aed.fmt == null && kg.units === '-1D' && kg.fmt === '#,0 "kg"' && pad.units === '-1D' && /,,\.00"M"/.test(pad.fmt || ''),
      () => `the cards: 950 AED in automatic units, decimals cleared; 8,000 kg whole; the padded EUR in millions: ${JSON.stringify({ aed, kg, pad })}`);
    // D15 (RESCORE-2: bank's "Debtconsolidation" slanted and cut on a designed 6-column chart): a column chart by a text
    // category whose columns can't each hold a 12-letter name (the writer's stand-in for a name it can't measure, as its
    // tables use) is written as a bar chart, whose names are level, where its slot holds 3 rows or more
    const slot = { kind: 'column', title: 'K', x: 24, y: 120, w: 600, h: 300, topN: 8 };
    const rc = get(() => build(base({ cats: { bar: C('City'), column: C('Purpose'), donut: C('Channel') } }), { pages: hand(1280, 720, [slot]) }));
    const cv = rc.files ? visuals(rc).filter((v) => /^clustered(Bar|Column)Chart$/.test(v.visual.visualType) && v.position.x === 24) : [];
    chk(() => cv.length === 1 && cv[0].visual.visualType === 'clusteredBarChart' && (rc.barCharts || []).length === 1,
      () => `D15: 8 columns in 600 can't hold 12-letter names: a bar chart: ${rc.threw || JSON.stringify([cv.map((v) => v.visual.visualType), rc.barCharts])}`);
    const low = get(() => build(base({ cats: { bar: C('City'), column: C('Purpose'), donut: C('Channel') } }), { pages: hand(1280, 720, [Object.assign({}, slot, { h: 140 })]) }));
    const lv = low.files ? visuals(low).find((v) => v.visual.visualType === 'clusteredColumnChart' && v.position.x === 24) : null;
    // (design round 10, N14: a report chart's Top N is kept by a report measure, "Keep: ...": N is its rank's limit)
    const topOf = (v) => { const fs = (v && v.filterConfig || {}).filters || [], f = fs.find((x) => x.type === 'TopN'); if (f) return f.filter.From[0].Expression.Subquery.Query.Top;
      const k = fs.find((x) => x.field && x.field.Measure && /^Keep: /.test(x.field.Measure.Property)), ext = k && low.files && low.files.find((g) => /reportExtensions\.json$/.test(g.path));
      const m = ext && JSON.parse(String(ext.data)).entities.flatMap((e) => e.measures).find((x) => x.name === k.field.Measure.Property), n = m && m.expression.match(/MIN \( _n, (\d+) \) = \1, (\d+), _n \)/);
      return n ? +n[2] : null; };
    const plot = 600 - 2 * Math.round(16 * 720 / 1080) - 40, need = Px.textWidth('n'.repeat(12), 10, false, 'Segoe UI') + 6;
    chk(() => lv && topOf(lv) === Math.max(3, Math.floor(plot / need)),
      () => `D15: a slot too low for bars keeps its columns, as many as hold a 12-letter name (${Math.floor(plot / need)}): ${low.threw || JSON.stringify(lv && [lv.visual.visualType, topOf(lv)])}`);
    // the panel card (RESCORE-2: OVERLAP 2 on every report): the "No data" card behind a table that ends on its whole rows
    // keeps the slot's height and the panel's shadow; the table's own shadow is off (the laptop's local resolution, S3
    // FIXED in Desktop on rc.4); the lint counts it as a cover, never an overlap
    const th = (() => { const d = E.fresh(); E.repairState(d); const t = E.buildTheme(d, 'en'); const x = t.visualStyles.tableEx['*']; ['values', 'columnHeaders', 'total'].forEach((k) => (x[k] || []).forEach((e) => { if (e.fontSize != null) e.fontSize = 15; })); t.textClasses.title.fontSize = 18; return t; })();
    const rp = get(() => build(base({ table: [C('City'), M('Total Sales')] }), { theme: th, pages: hand(1920, 1080, [{ kind: 'table', title: 'T', x: 24, y: 120, w: 900, h: 302 }, { kind: 'bar', title: 'B', x: 948, y: 120, w: 900, h: 302 }]) }));
    const vs = rp.files ? visuals(rp) : [], t = vs.find((v) => v.visual.visualType === 'tableEx'), card = vs.find((v) => v.visual.visualType === 'cardVisual' && t && v.position.x === t.position.x && v.position.y === t.position.y);
    const sh = (v) => L((((v.visual.visualContainerObjects || {}).dropShadow || [])[0] || { properties: {} }).properties.show);
    chk(() => t && card && card.position.height === 302 && t.position.height < 302 && sh(card) === 'true' && sh(t) === 'false',
      () => `the panel card: the slot's height, the panel's shadow; the table on its rows, its own shadow off: ${rp.threw || JSON.stringify({ t: t && [t.position, sh(t)], card: card && [card.position, sh(card)] })}`);
    const inv = { pages: [{ n: 1, name: 'P', w: 1920, h: 1080, visuals: vs.filter((v) => v.position.x !== 12).map((v) => ({ type: v.visual.visualType, x: v.position.x, y: v.position.y, w: v.position.width, h: v.position.height, z: v.position.z, fields: {} })) }] };
    const F = get(() => designLint(inv, [], null, { titles: false }).findings) || [];
    chk(() => Array.isArray(F) && !F.some((f) => f.rule === 'OVERLAP') && F.some((f) => f.rule === 'COVER_CARDS'),
      () => `the lint: the panel card behind its own table is a cover, not an overlap: ${JSON.stringify(F.filter((f) => /OVERLAP|COVER/.test(f.rule)))} ${JSON.stringify(inv.pages[0].visuals.map((x) => [x.type, x.x, x.y, x.w, x.h, x.z]))}`);
  }

  // ---------- P2, the owner's polish (LAB-POLISH, measured in Desktop 2.158): line width, the donut's ring, smooth lines as an option ----------
  {
    const mn = C('Month Name', { sortBy: { t: D, c: 'Month No' } }, D);
    const slots = hand(1280, 720, [{ kind: 'line', title: 'L', x: 24, y: 80, w: 600, h: 300 }, { kind: 'donut', title: 'D', x: 640, y: 80, w: 500, h: 300 }]);
    const ls = (r) => { const v = r.files ? visuals(r).find((x) => x.visual.visualType === 'lineChart') : null; return v ? ((v.visual.objects || {}).lineStyles || [])[0] : null; };
    const dn = (r) => { const v = r.files ? visuals(r).find((x) => x.visual.visualType === 'donutChart' && x.position.x === 640) : null; return v ? ((v.visual.objects || {}).slices || [])[0] : null; };
    const r = get(() => build(base({ date: mn }), { pages: slots, smoothLines: false })), rs = get(() => build(base({ date: mn }), { pages: slots })), rt = get(() => build(base({ date: mn }), { pages: slots, smoothLines: true }));
    const P = (e) => (e && e.properties) || {};
    // 1. the line 3 wide (rc.7's 1 px was the weakest mark on every page), no selector, as the lab wrote it; with smoothLines
    // false straight and no markers (L1, 19 Oct: smooth with markers is the default now, test-0.3.0-smooth-lines.mjs)
    chk(() => ls(r) && !ls(r).selector && L(P(ls(r)).strokeWidth) === '3D' && P(ls(r)).lineChartType == null && P(ls(r)).showMarker == null,
      () => `P2-1: with smoothLines false every line chart's line is 3 wide, straight, no markers: ${r.threw || JSON.stringify(ls(r))}`);
    // 2. the donut's ring at 68 (65 to 70 looked right; 60 too heavy, 80 too thin)
    chk(() => dn(r) && L(P(dn(r)).innerRadiusRatio) === '68L', () => `P2-2: every donut's ring at 68: ${r.threw || JSON.stringify(dn(r))}`);
    // 3. smooth lines by default (L1) and with smoothLines true: lineChartType 'smooth' with interpolationSmooth 'monotoneX' ("interpolation" is no property)
    chk(() => JSON.stringify(ls(rs)) === JSON.stringify(ls(rt)) && ls(rs) && L(P(ls(rs)).lineChartType) === "'smooth'" && L(P(ls(rs)).interpolationSmooth) === "'monotoneX'" && L(P(ls(rs)).strokeWidth) === '3D' && !('interpolation' in P(ls(rs))),
      () => `P2-3: the default (and smoothLines true) gives smooth monotone lines, 3 wide: ${rs.threw || JSON.stringify(ls(rs))}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = []; let checks = 0;
  v029w({ check: (ok, msg) => { checks++; if (!ok) problems.push(msg); } });
  console.log(problems.length ? `FAIL  v029w  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029w  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
