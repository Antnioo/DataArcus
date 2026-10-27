// 0.3.1 BD2 (the laptop's measurement of BD1's bidi lab, Power BI Desktop 2.159, 27 Oct, with Windows text recognition;
// mcp/work/BD2.md; written red first): V1 (each Latin run in U+2068 ... U+2069, U+200F beside a run at an end) drew right
// except where Desktop cuts a text with "..." (cards); V3 (V1 wrapped whole in U+2067 ... U+2069) drew right on every
// canvas kind, cut card texts included; no variant helps the tab strip (page and tooltip page names lay out left to right).
//   R  the rule in the shared engine (text-measure.js)        K  each kind through the writer (an Arabic build)
//   D  DAX-built texts (report measures, DA.StoryTitle)       P  page and tooltip page names, and what the plan says
//   L  the Arabic lens's TEXT_MIXED words                    A  the article (EN and AR)
//   B  the bidi lab (V1 kept as measured; the buttons as DataArcus writes them)
// Made-up models and texts in a temp folder (no employer data). In process, plus one server for plan_layout.
//   node test-0.3.1-bd2.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-bd2-')));
process.env.DATAARCUS_ROOT = ROOT;
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const cps = (s) => Array.from(String(s)).map((c) => (c.codePointAt(0) > 0x7e ? 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') : c)).join('');
const cut = (o) => (typeof o === 'string' ? o : JSON.stringify(o) || '').slice(0, 400);
const RLM = '‏', FSI = '⁨', PDI = '⁩', RLI = '⁧', MARKS = /[‎‏⁦-⁩‪-‮]/g;
const TM = require('../assets/js/text-measure.js'), Pbip = require('../assets/js/pbip-export.js'), E = require('../assets/js/design-engine.js');
const Terms = await import('./lib/terminology.mjs');
const src = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');
const V3 = (s) => s.startsWith(RLI) && s.endsWith(PDI);

// ---------- R: the rule ----------
const T = { start: 'Department: عدد الأوامر في كل شهر', middle: 'عدد الأوامر حسب Department في كل شهر', end: 'عدد الأوامر في كل شهر حسب Department' };
const V1 = { start: RLM + FSI + 'Department' + PDI + ': عدد الأوامر في كل شهر', middle: 'عدد الأوامر حسب ' + FSI + 'Department' + PDI + ' في كل شهر', end: 'عدد الأوامر في كل شهر حسب ' + FSI + 'Department' + PDI + RLM };
{
  chk(() => typeof TM.isolateRuns === 'function' && Object.keys(T).every((k) => TM.isolateRuns(T[k]) === V1[k]), () => `R1. isolateRuns (new) is today's V1, as the lab measured it: ${typeof TM.isolateRuns === 'function' ? Object.keys(T).map((k) => cps(TM.isolateRuns(T[k]))).join(' | ') : 'missing'}`);
  chk(() => Object.keys(T).every((k) => TM.isolateLatin(T[k]) === RLI + V1[k] + PDI), () => `R2. isolateLatin is V3: U+2067 + V1 + U+2069, at the start, in the middle and at the end: ${Object.keys(T).map((k) => cps(TM.isolateLatin(T[k]))).join(' | ')}`);
  chk(() => Object.keys(T).every((k) => TM.isolateLatin(TM.isolateLatin(T[k])) === TM.isolateLatin(T[k])), () => 'R3. idempotent: a text already wrapped is not wrapped twice');
  chk(() => Object.keys(T).every((k) => TM.isolateLatin(V1[k]) === RLI + V1[k] + PDI), () => `R4. a text an older build isolated (V1 only) gets the wrap, its isolates kept: ${cps(TM.isolateLatin(V1.middle))}`);
  chk(() => ['المبيعات', 'أعلى 6 من 10', 'أعلى {1} من {2}: المبيعات', 'Total Sales', 'Sales by Region 2024', '', '  '].every((x) => TM.isolateLatin(x) === x), () => 'R5. no Latin run (digits and placeholders only), English, empty: unchanged');
  const named = TM.isolateNames('المبيعات حسب Region', ['Region']);
  chk(() => named === RLI + 'المبيعات حسب ' + FSI + 'Region' + PDI + RLM + PDI && TM.isolateNames(named, ['Region']) === named && TM.isolateNames('المبيعات', ['Region']) === 'المبيعات', () => `R6. isolateNames wraps what it isolates, once; a text without the name unchanged: ${cps(named)}`);
  chk(() => TM.textWidth(TM.isolateLatin(T.middle), 12) === TM.textWidth(T.middle, 12), () => 'R7. the marks are 0 wide (textWidth)');
  chk(() => Terms.isolateLatin === TM.isolateLatin && Terms.isolateRuns === TM.isolateRuns, () => 'R8. the MCP re-exports the engine\'s functions (terminology.mjs), no copy');
}

// ---------- K: each kind through the writer (the website's Arabic download on a model with English names) ----------
// (changed 27 Oct 2026, 0.3.1 TT1, the owner's rule: a title is wholly Arabic or wholly English, so English names give
// English titles and no mixed text; the Arabic build here shows its fields under approved Arabic names, one with a Latin
// run, «إجمالي مبيعات KPI», the mixed text TT1 still writes: each title, alt text and header that holds it is V3)
const AR_NAME = { 'Total Sales': 'إجمالي مبيعات KPI', Orders: 'الطلبات', Region: 'المنطقة', Month: 'الشهر' };
let LANG = 'en';
const M = (m) => ({ t: 'Sales', m, name: LANG === 'ar' ? AR_NAME[m] || m : m }), C = (c, extra) => Object.assign({ t: 'Sales', c, name: LANG === 'ar' ? AR_NAME[c] || c : c }, extra || {});
const site = (lang) => { LANG = lang; const d = E.fresh(); E.repairState(d); const pages = E.projectPages(d.layout, lang, { second: true, panel: false });
  return Pbip.build({ name: 'Own', title: 'Own Sales', pageName: pages[0].name, lang, rtl: lang === 'ar', ...(lang === 'ar' ? { chartAxes: 'mirrored' } : {}), font: d.font, sample: false, logo: null, theme: E.buildTheme(d, lang), ui: d.ui, texts: E.REPORT_TEXTS[lang],
    model: { byPath: 'T.SemanticModel' }, bind: { kpis: [M('Total Sales'), M('Orders')], measure: M('Total Sales'), date: C('Month', { sortBy: { t: 'Sales', c: 'Month Number' } }), cats: { bar: C('Region'), column: C('Region') }, y: {}, table: [C('Region'), M('Total Sales'), M('Orders')], slicers: [C('Region')],
      tip: { card: M('Total Sales'), cat: C('Region'), y: M('Orders'), date: C('Month', { sortBy: { t: 'Sales', c: 'Month Number' } }) } },
    pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, png: new Uint8Array([1]), panel: p.panel })) }); };
const ar = get(() => site('ar')), en = get(() => site('en'));
const json = (r, re) => (r.files || []).filter((f) => typeof f.data === 'string' && re.test(f.path)).map((f) => ({ path: f.path, j: JSON.parse(f.data) }));
// every visible text the writer isolates (isolateFiles' own walk): formatting literals, text runs, projection names, page names
function texts(r) {
  const out = [];
  const walk = (o, where) => { if (Array.isArray(o)) return o.forEach((x) => walk(x, where)); if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'filterConfig' || k === 'selector') continue;
      if (k === 'properties' && v && typeof v === 'object' && !Array.isArray(v)) Object.entries(v).forEach(([pk, p]) => { const L = p && p.expr && p.expr.Literal && p.expr.Literal.Value; if (typeof L === 'string' && /^'.*'$/s.test(L)) out.push({ where: where + ':' + pk, s: L.slice(1, -1).replace(/''/g, "'") }); });
      if (k === 'textRuns' && Array.isArray(v)) v.forEach((x) => x && typeof x.value === 'string' && out.push({ where: where + ':textRun', s: x.value }));
      if (k === 'projections' && Array.isArray(v)) v.forEach((x) => x && typeof x.displayName === 'string' && out.push({ where: where + ':header', s: x.displayName }));
      walk(v, where);
    } };
  json(r, /\/visual\.json$/).forEach((f) => walk(f.j.visual, f.j.visual && f.j.visual.visualType));
  json(r, /\/page\.json$/).forEach((f) => out.push({ where: 'page:' + (f.j.type || 'page'), s: f.j.displayName }));
  return out;
}
{
  const all = ar.files ? texts(ar) : [], mixed = all.filter((t) => TM.ARABIC.test(t.s) && /[A-Za-z]/.test(t.s.replace(MARKS, '')));
  const kinds = (re) => mixed.filter((t) => re.test(t.where));
  chk(() => mixed.length > 5 && mixed.every((t) => V3(t.s)), () => `K1. every mixed Arabic/Latin text of the Arabic download is wrapped whole (V3): ${cut(ar.threw || mixed.filter((t) => !V3(t.s)).slice(0, 4).map((t) => t.where + ' ' + cps(t.s)))}`);
  chk(() => kinds(/:text$/).length && kinds(/:altText$/).length, () => `K2. guard: titles and alt texts among them (the other kinds: K5): ${cut([...new Set(mixed.map((t) => t.where))])}`);
  chk(() => mixed.every((t) => TM.isolateRuns && t.s === RLI + TM.isolateRuns(t.s.slice(1, -1)) + PDI), () => `K3. inside the wrap, V1's isolates kept: ${cut(mixed.slice(0, 2).map((t) => cps(t.s)))}`);
  // the kinds a build on English names has no mixed text in: a text box run, a button's text, a table or slicer header, a
  // tooltip's text, a page name, a bookmark: through the writer's own pass (isolateFiles, as report-run and the download call it)
  const lit = (s) => ({ expr: { Literal: { Value: "'" + s.replace(/'/g, "''") + "'" } } });
  const hand = [{ path: 'H.Report/definition/pages/p1/page.json', data: JSON.stringify({ name: 'p1', displayName: T.end }) },
    { path: 'H.Report/definition/pages/p1/visuals/b/visual.json', data: JSON.stringify({ name: 'b', visual: { visualType: 'actionButton', objects: { text: [{ properties: { show: lit('true') } }, { properties: { text: lit(T.start) }, selector: { id: 'default' } }] } } }) },
    { path: 'H.Report/definition/pages/p1/visuals/t/visual.json', data: JSON.stringify({ name: 't', visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: T.middle }] }] } }] } } }) },
    { path: 'H.Report/definition/pages/p1/visuals/h/visual.json', data: JSON.stringify({ name: 'h', visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: [{ field: {}, queryRef: 'Sales.Region', displayName: 'المنطقة Region' }] } } }, visualContainerObjects: { visualTooltip: [{ properties: { text: lit(T.middle) } }] } } }) },
    { path: 'H.Report/definition/bookmarks/x.bookmark.json', data: JSON.stringify({ name: 'x', displayName: T.middle }) }];
  const n = Pbip.isolateFiles(hand, [], { all: true });
  const got = hand.flatMap((f) => texts({ files: [f] })).concat(hand.filter((f) => /bookmark/.test(f.path)).map((f) => ({ where: 'bookmark', s: JSON.parse(f.data).displayName })));
  chk(() => n === 6 && got.filter((t) => TM.ARABIC.test(t.s)).length === 6 && got.filter((t) => TM.ARABIC.test(t.s)).every((t) => V3(t.s)), () => `K5. a page name, a button's text, a text box run, a table header, a tooltip text and a bookmark: each V3 (${n} changed): ${cut(got.map((t) => t.where + ' ' + cps(t.s).slice(0, 40)))}`);
  chk(() => en.files && !texts(en).some((t) => MARKS.test(t.s)), () => `K4. an English download: no mark at all: ${cut(en.threw || texts(en).filter((t) => /[‎‏⁦-⁩]/.test(t.s)).slice(0, 3))}`);
}

// ---------- D: DAX-built texts ----------
{
  const ext = json(ar, /reportExtensions\.json$/).flatMap((f) => (f.j.entities || []).flatMap((e) => e.measures || [])).filter((m) => m.dataType === 'Text');
  const lits = (e) => [...String(e).matchAll(/"((?:[^"]|"")*)"/g)].map((x) => x[1].replace(/""/g, '"'));
  const mixed = ext.filter((m) => lits(m.expression).some((s) => TM.ARABIC.test(s) && /[A-Za-z]/.test(s)));
  const WRAP = /^UNICHAR \( 8295 \) & \( [\s\S]* \) & UNICHAR \( 8297 \)$/;
  chk(() => mixed.length && mixed.every((m) => WRAP.test(m.expression)), () => `D1. a report Text measure with Arabic and a Latin run is wrapped whole at run time (UNICHAR ( 8295 ) & ( ... ) & UNICHAR ( 8297 )): ${cut(mixed.map((m) => m.expression.slice(0, 80) + ' ... ' + m.expression.slice(-60)))}`);
  chk(() => mixed.every((m) => lits(m.expression).every((s) => !(TM.ARABIC.test(s) && /[A-Za-z]/.test(s.replace(MARKS, ''))) || (!V3(s) && TM.isolateRuns(s) === s))), () => `D2. inside, each literal keeps V1 (its isolates), no wrap of its own: ${cut(mixed.map((m) => lits(m.expression).map(cps)))}`);
  const again = (ar.files || []).map((f) => ({ path: f.path, data: f.data }));
  chk(() => ar.files && Pbip.isolateFiles(again, [], { all: true }) === 0 && ext.every((m) => TM.ISOLATED.test(m.expression) || !TM.ARABIC.test(m.expression) || !/"[^"]*[A-Za-z][^"]*"/.test(m.expression)), () => 'D3. isolateFiles twice changes nothing (no second wrap)');
  // DA.StoryTitle's Arabic: the same evaluation of its own DAX as bd1's
  const DF = await import('./lib/dax-functions.mjs'), st = DF.LIBRARY.find((f) => f.name === 'DA.StoryTitle');
  const evalDax = (f, args) => { const params = f.params.split(',').map((p) => p.split(':')[0].trim());
    const js = f.body.map((line) => { const S = []; let e = line.replace(/"((?:[^"]|"")*)"/g, (_, s) => { S.push(s.replace(/""/g, '"')); return `__S${S.length - 1}__`; });
      e = e.replace(/^VAR (\w+) = /, 'const $1 = ').replace(/^RETURN /, 'return ').replace(/&/g, '+').replace(/(?<![<>!=])=(?!=)/g, '==').replace(/^const (\w+) == /, 'const $1 = ');
      return e.replace(/__S(\d+)__/g, (_, k) => JSON.stringify(S[+k])) + ';'; }).join('\n');
    const lib = { IF: (c, a, b) => (c ? a : b), ISBLANK: (x) => x == null, BLANK: () => null, UNICHAR: (n) => String.fromCodePoint(n), ABS: Math.abs, FORMAT: (x) => String(Math.round(x)) };
    return new Function(...Object.keys(lib), ...params, js)(...Object.values(lib), ...args); };
  const a1 = evalDax(st, ['North', '1.2M', 'Sales', 0.094, 'العام الماضي', 'ar']);
  chk(() => /UNICHAR \( 8295 \)/.test(st.body.join('\n')) && a1.startsWith(RLI + RLM + FSI + 'North' + PDI) && a1.endsWith(RLM + PDI) && a1.replace(MARKS, '') === 'North في الصدارة بـ 1.2M Sales، بارتفاع 9% عن العام الماضي',
    () => `D4. DA.StoryTitle's Arabic: U+2067 + (its RLM ... isolates ... RLM) + U+2069 at run time: ${cps(a1)}`);
  chk(() => evalDax(st, ['North', '1.2M', 'Sales', -0.05, 'last year', 'en']) === 'North leads with 1.2M Sales, down 5% on last year' && evalDax(st, ['', '1', 'x', null, 'p', 'ar']) == null, () => 'D5. English unchanged; a blank leader still a blank title');
}

// ---------- P: page and tooltip page names ----------
{
  const pages = json(ar, /\/page\.json$/).map((f) => f.j), tips = pages.filter((p) => p.type === 'Tooltip');
  chk(() => tips.length >= 2 && tips.every((p) => !/[A-Za-z]/.test(p.displayName)), () => `P1. an Arabic build's tooltip pages on fields kept in English: no Latin letter in their names: ${cut(ar.threw || tips.map((p) => p.displayName))}`);
  chk(() => new Set(pages.map((p) => p.displayName)).size === pages.length, () => `P2. the page names stay unique: ${cut(pages.map((p) => p.displayName))}`);
  const enTips = json(en, /\/page\.json$/).map((f) => f.j).filter((p) => p.type === 'Tooltip').map((p) => p.displayName);
  chk(() => enTips.includes('Tooltip') && enTips.includes('Tooltip · Month'), () => `P3. English tooltip names unchanged: ${cut(enTips)}`);
  const said = typeof Terms.pageNamesOf === 'function' ? Terms.pageNamesOf([{ path: 'X.Report/definition/pages/a/page.json', data: JSON.stringify({ displayName: 'تحليل Region' }) }, { path: 'X.Report/definition/pages/b/page.json', data: JSON.stringify({ displayName: 'التفاصيل' }) }, { path: 'X.Report/definition/pages/c/page.json', data: JSON.stringify({ displayName: 'Overview' }) }]) : null;
  chk(() => said && said.latin.length === 1 && said.latin[0].page === 'تحليل Region' && /left to right/.test(said.sayInPlan) && /Desktop 2\.159, 27 Oct/.test(said.sayInPlan), () => `P4. the plan names each Arabic page name that keeps a Latin run, and says Power BI lays tabs out left to right (measured): ${cut(said)}`);
  const { serverClient } = await import('./test-0.2.9.mjs');
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  fs.mkdirSync(path.join(ROOT, 'm/M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'm/M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Order Date', 'dateTime')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] }] } }));
  const w = await serverClient(ROOT, {});
  try {
    const r = await w.call('plan_layout', { path: 'm/M.SemanticModel', name: 'Own AR', layout: 'exec', lang: 'ar' });
    const pn = r.j && r.j.pageNames;
    chk(() => pn && Array.isArray(pn.latin) && pn.latin.length === 0 && /left to right/.test(pn.note || ''), () => `P5. plan_layout (lang "ar"): pageNames says every page name is Arabic only, and why (tabs lay out left to right): ${cut(pn || (r.j ? Object.keys(r.j) : r.t))}`);
    const e = await w.call('plan_layout', { path: 'm/M.SemanticModel', name: 'Own EN', layout: 'exec', lang: 'en' });
    chk(() => e.j && !('pageNames' in e.j), () => 'P6. an English plan: no pageNames');
    // the twin: a page name the person gives in Arabic with a Latin run is named in the plan
    fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(ROOT, 'tw'), { recursive: true });
    const t0 = await w.call('create_arabic_twin', { path: 'tw/Twin Sales.pbip' }), pageText = ((t0.j && t0.j.texts) || []).find((x) => /page/i.test(String(x.kind || x.what || x.id)));
    const t1 = pageText ? await w.call('create_arabic_twin', { path: 'tw/Twin Sales.pbip', labels: { [pageText.id]: 'تحليل Region' } }) : t0;
    const tn = t1.j && t1.j.pageNames;
    chk(() => tn && tn.latin.some((x) => x.page === 'تحليل Region') && /left to right/.test(tn.sayInPlan), () => `P7. the twin's plan names an Arabic page name with a Latin run (tabs lay out left to right): ${cut(tn || (t1.j ? Object.keys(t1.j) : t1.t))} (page text ${cut(pageText)})`);
  } finally { await w.close(); }
}

// ---------- L: the Arabic lens ----------
{
  fs.cpSync(path.join(HERE, 'test-models/service-orders'), path.join(ROOT, 'so'), { recursive: true, filter: (f) => !/make-report\.mjs$/.test(f) });
  const S = 'https://developer.microsoft.com/json-schemas/fabric/', R = 'hand/Hand.Report', DEF = R + '/definition';
  const put = (rel, o) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); };
  const box = (name, y, text) => put(`${DEF}/pages/arPage00001/visuals/${name}/visual.json`, { $schema: S + 'item/report/definition/visualContainer/2.1.0/schema.json', name, position: { x: 760, y, z: 1000, height: 60, width: 500, tabOrder: 1000 },
    visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: 'Segoe UI', fontSize: '14pt' } }], horizontalTextAlignment: 'right' }] } }] } } });
  put('hand/Hand.pbip', { $schema: S + 'pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: 'Hand.Report' } }], settings: { enableAutoRecovery: true } });
  put(R + '/definition.pbir', { $schema: S + 'item/report/definitionProperties/2.0.0/schema.json', version: '4.0', datasetReference: { byPath: { path: '../../so/Service Orders.SemanticModel' } } });
  put(DEF + '/version.json', { $schema: S + 'item/report/definition/versionMetadata/1.0.0/schema.json', version: '2.0.0' });
  put(DEF + '/report.json', { $schema: S + 'item/report/definition/report/2.1.0/schema.json', themeCollection: {} });
  put(DEF + '/pages/pages.json', { $schema: S + 'item/report/definition/pagesMetadata/1.0.0/schema.json', pageOrder: ['arPage00001'], activePageName: 'arPage00001' });
  put(DEF + '/pages/arPage00001/page.json', { $schema: S + 'item/report/definition/page/2.0.0/schema.json', name: 'arPage00001', displayName: 'الأوامر', displayOption: 'FitToPage', width: 1280, height: 720 });
  box('raw', 20, T.middle); box('v1', 100, V1.end); box('v3', 180, RLI + V1.start + PDI); box('plain', 260, 'الأوامر المفتوحة في كل شهر');
  const { arabicLens } = await import('./lib/arabic-lens.mjs');
  const Lr = get(() => arabicLens('hand/Hand.pbip')), f = ((Lr && Lr.findings) || []).find((x) => x.rule === 'TEXT_MIXED');
  chk(() => f && f.count === 2, () => `L1. TEXT_MIXED counts the raw text and the V1-only text (cut card texts draw wrong), not the V3 or the Arabic one: ${cut(f || Lr)}`);
  const how = f ? f.fix.how : '';
  chk(() => /U\+2068/.test(how) && /U\+2069/.test(how) && /U\+2067/.test(how) && /whole text/i.test(how) && /Desktop 2\.159, 27 Oct/.test(f.what + ' ' + how), () => `L2. the fix: the isolates, and the whole text wrapped in U+2067 ... U+2069 (measured in Desktop 2.159, 27 Oct): ${how}`);
  chk(() => /page name/i.test(how) && /left to right/i.test(how) && /The twin writes [^']*U\+2067 \.\.\. U\+2069/.test(src('lib/arabic-lens.mjs')), () => `L3. page names: keep English out (Power BI lays tabs out left to right); the twin's sentence names the wrap: ${cut(f && f.fix)}`);
}

// ---------- A: the article ----------
{
  const tr = fs.readFileSync(path.join(HERE, '../assets/js/translations/article-power-bi-report-ready-for-arabic.js'), 'utf8');
  const s23 = [...tr.matchAll(/"s2_3": "((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
  chk(() => s23.length === 2 && /U\+2067/.test(s23[0]) && /whole text/.test(s23[0]) && /left to right/.test(s23[0]) && /page names/i.test(s23[0]) && /27 Oct 2026/.test(s23[0]), () => `A1. the English article: the isolates and the whole text in U+2067 ... U+2069; page names: keep English out (tabs left to right); 27 Oct: ${cut(s23[0])}`);
  chk(() => /U\+2067/.test(s23[1]) && /27 أكتوبر 2026/.test(s23[1]) && /أسماء الصفحات/.test(s23[1]) && /من اليسار إلى اليمين/.test(s23[1]), () => `A2. the Arabic article says the same: ${cut(s23[1])}`);
  const html = ['articles', 'ar/articles'].map((d) => fs.readFileSync(path.join(HERE, '..', d, 'article-power-bi-report-ready-for-arabic.html'), 'utf8'));
  chk(() => html.every((h) => /"dateModified": "2026-10-27"/.test(h) && /U\+2067/.test(h)), () => 'A3. both copies: dateModified 2026-10-27 and the new words');
}

// ---------- B: the bidi lab ----------
{
  const lab = src('lab/bidi-lab.mjs');
  const Lab = await import('./lab/bidi-lab.mjs');
  chk(() => ['start', 'middle', 'end'].every((p) => Lab.variantText('V1', p) === V1[p] && Lab.variantText('V3', p) === TM.isolateLatin(T[p])) && /TM\.isolateRuns/.test(lab), () => `B1. the lab's V1 stays what was measured (isolateRuns); its V3 is today's isolateLatin: ${cps(Lab.variantText('V1', 'middle'))}`);
  const btn = Lab.KINDS.find((k) => k.id === 'button').make('x', {}).objects.text;
  chk(() => Array.isArray(btn) && btn.some((e) => !e.selector && e.properties.show && Object.keys(e.properties).length === 1) && btn.some((e) => e.selector && e.selector.id === 'default' && e.properties.text && !('show' in e.properties)), () => `B2. page 4's buttons: "show" in an entry of its own, the text under selector default (as pbip-page.js's buttons): ${cut(btn)}`);
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-bd2.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  bd2  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  bd2  ${checks} checks`);
process.exit(0);
