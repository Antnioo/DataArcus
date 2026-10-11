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

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const req = createRequire(import.meta.url);

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
      chk(() => vs.length && shownText.length > 5 && !shownText.some((x) => BIDI.test(x)) && shownText.some((x) => /Sales Net/.test(x)),
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
    const tight = (r) => !!(r.files && visuals(r).some((v) => v.visual.visualType === 'tableEx' && JSON.stringify(v.visual.objects.grid || '').includes('rowPadding'))) || (r.tableRows || []).length > 0;
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
    const KEYS = ['name', 'title', 'lang', 'rtl', 'font', 'ui', 'theme', 'page', 'pageName', 'slots', 'png', 'pages', 'logo', 'sample', 'model', 'bind', 'texts', 'svgColumns', 'svgCards', 'subtitles', 'chartColors', 'chartAxes', 'quietGrid', 'pageFilters', 'kpiValues', 'noDataMessage', 'logoPlaceholder'];
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
    const tbl = (c, w) => get(() => build(base({ table: [c, M('A'), M('B'), M('C')] }), { pages: hand(1280, 720, [{ kind: 'table', title: 'T', x: 24, y: 80, w, h: 400 }]) }));
    const cut = (x) => (x.tableColumns || []).length + (x.tableSmaller || []).length;
    const days = tbl(C('Day Name', { sortBy: { t: D, c: 'Day No' } }, D), 330), hij = tbl(C('HM', { kind: 'month', family: 'hijri' }, D), 350), plain = tbl(C('Customer'), 330);
    chk(() => cut(days) === 0 && cut(hij) > 0 && cut(plain) > 0,
      () => `B-06: a known name column takes its widest name's room (days fit 330; the picker's Hijri months, under a short header, don't fit 350), another text column 12 letters as before: days ${days.threw || cut(days)}, hijri ${hij.threw || cut(hij)}, customer ${plain.threw || cut(plain)}`);
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
    chk(() => written.length === 2 && written.every((w, i) => w.length && w.every((b) => planned[i].includes(b))) && fo.every((f) => (f.dropKinds || []).includes('line')),
      () => `A2-3: every chart and table of the report is on a slot of fitSlots(slots, fitOptions): written ${JSON.stringify(written)} fitted ${JSON.stringify(planned)} ${r.threw || ''} ${fo && fo.threw || ''}`);
    // the website's PNG and plan_layout take the same fitting
    const tg = fs.readFileSync(path.join(REPO, 'assets/js/theme-generator.js'), 'utf8'), srv = fs.readFileSync(path.join(HERE, 'server.mjs'), 'utf8');
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
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = []; let checks = 0;
  v029w({ check: (ok, msg) => { checks++; if (!ok) problems.push(msg); } });
  console.log(problems.length ? `FAIL  v029w  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029w  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
