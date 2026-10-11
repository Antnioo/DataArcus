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
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = []; let checks = 0;
  v029w({ check: (ok, msg) => { checks++; if (!ok) problems.push(msg); } });
  console.log(problems.length ? `FAIL  v029w  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029w  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
