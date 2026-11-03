// 0.3.1 TT2 (the owner, 27 Oct, D-1027-19 "Both A": the website's Arabic download lists the English names with Arabic
// drafts the person edits and approves before it builds, never silent; mcp/work/TT2.md; written red first). The engine
// the Theme Generator's step runs (assets/js/arabic-names.js), in Node, on made-up models only (no employer data):
//   N1 the drafts are the MCP's proposeArabic, read by the same code (one reading of the fixed words file)
//   N2 drafts only from the words given: a word the file lacks gives none; a copy of the file without a word, none for it
//   N3 the list: every field the written visuals show with no Arabic name, its English name and its draft (or empty); a
//      model named in Arabic, none; the list is capped
//   N4 the approval: nothing missing, no English-only "Arabic" name, no invisible sign; "keep English" only when chosen
//   N5 approved Arabic names: every title wholly Arabic; one name kept English: its titles wholly English, none mixed
//   N6 the README says each approved name and each name kept English (README.md; next to the person's project, its own
//      <report>.README.md, never their README); without the step, the files are byte for byte the same
//   node test-0.3.1-tt2.mjs
import './test-env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const cut = (o) => (typeof o === 'string' ? o : JSON.stringify(o) || '').slice(0, 500);
const AR = /[؀-ۿ]/, bare = (s) => String(s == null ? '' : s).replace(/[‎‏⁦-⁩]/g, '');
const mixed = (s) => AR.test(bare(s)) && /[A-Za-z]/.test(bare(s));

const LIST = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'assets', 'data', 'arabic-report-words.json'), 'utf8'));
const Pbip = require('../assets/js/pbip-export.js'), E = require('../assets/js/design-engine.js'), Bind = require('../assets/js/pbip-bind.js');
const N = get(() => require('../assets/js/arabic-names.js'));
const { proposeArabic } = await import('./lib/arabic-names.mjs');

try {
  // ---------- N1, N2: the drafts ----------
  const P = get(() => N.make(LIST));
  const names = Object.keys(LIST.words).concat(['Total Sales', 'Sales Last Year', 'Average Price', 'Count of Order', 'Order Count', 'Customer Name', 'Margin %', 'Return Rate', 'Year Month', 'Hijri Year', 'Planned Budget', 'Region (Arabic)', 'المنطقة', 'Total Widgets', '']);
  chk(() => typeof P.propose === 'function' && names.every((n) => (P.propose(n) || null) === (proposeArabic(n) || null)) && P.propose('Total Sales') === 'إجمالي المبيعات',
    () => `N1. the engine's draft is the MCP's proposeArabic for every word of the fixed file and its patterns: ${cut(P.threw || N.threw || names.filter((n) => (P.propose(n) || null) !== (proposeArabic(n) || null)))}`);
  const less = JSON.parse(JSON.stringify(LIST)); delete less.words.region;
  chk(() => P.propose('Planned Budget') == null && P.propose('Total Widgets') == null && N.make(less).propose('Region') == null && N.make(less).propose('Total Sales') === 'إجمالي المبيعات',
    () => 'N2. drafts only from the words given: none for "Planned Budget" or "Total Widgets"; a copy of the file without "region" gives none for Region');
  const src = (() => { try { return fs.readFileSync(path.join(HERE, '..', 'assets', 'js', 'arabic-names.js'), 'utf8'); } catch (e) { return 'fetch('; } })();
  chk(() => !/\bfetch\s*\(|XMLHttpRequest|https?:\/\/|import\s*\(|WebSocket|sendBeacon/.test(src), () => 'N2b. the engine sends nothing and loads nothing: no fetch, request, URL or import in arabic-names.js');

  // ---------- N3: the list ----------
  const M = (m, name) => Object.assign({ t: 'Sales', m }, name ? { name } : {}), C = (c, name, extra) => Object.assign({ t: 'Sales', c }, name ? { name } : {}, extra || {});
  const bindOf = (ar) => { const TS = M('Total Sales', ar && 'إجمالي المبيعات'), OR = M('Orders', ar && 'الطلبات'), PB = M('Planned Budget', ar && 'الميزانية المخططة'), RG = C('Region', ar && 'المنطقة'), MO = C('Month', ar && 'الشهر', { sortBy: { t: 'Sales', c: 'Month Number' } });
    return { kpis: [TS, OR, PB], measure: TS, date: MO, cats: { bar: RG, column: RG }, y: {}, table: [RG, TS, OR], slicers: [RG, null, null], tip: { card: TS, cat: RG, y: TS } }; };
  const site = (lang, bind, extra) => { const d = E.fresh(); E.repairState(d); const pages = E.projectPages(d.layout, lang, { second: true, panel: false });
    return Pbip.build(Object.assign({ name: 'Own', title: 'Own Sales', pageName: pages[0].name, lang, rtl: lang === 'ar', ...(lang === 'ar' ? { chartAxes: 'mirrored' } : {}), font: d.font, sample: false, logo: null, theme: E.buildTheme(d, lang), ui: d.ui, texts: Object.assign({}, E.REPORT_TEXTS[lang], { readme: '# {name}\n' }),
      model: { ws: 1, byConnection: 'Data Source="powerbi://api.powerbi.com/v1.0/myorg/W";initial catalog="M";access mode=readonly;integrated security=ClaimsToken' }, bind,
      pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, png: new Uint8Array([1]), panel: p.panel })) }, extra || {})); };
  const en = bindOf(false), r0 = get(() => site('ar', en));
  const items = get(() => N.toApprove(r0, en, LIST));
  const want = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Orders]': 'الطلبات', 'Sales[Region]': 'المنطقة', 'Sales[Month]': 'الشهر', 'Sales[Planned Budget]': '' };
  chk(() => Array.isArray(items) && items.length === 5 && items.every((x) => want[x.key] === x.draft && x.english === x.key.replace(/^.*\[(.*)\]$/, '$1')),
    () => `N3. the list: the 5 fields the visuals show with no Arabic name, each with its English name and its draft from the fixed words ("Planned Budget": empty, for the person): ${cut(items.threw || r0.threw || items)}`);
  const rAr = get(() => site('ar', bindOf(true)));
  chk(() => Array.isArray(N.toApprove(rAr, bindOf(true), LIST)) && N.toApprove(rAr, bindOf(true), LIST).length === 0, () => 'N3b. a model whose names are already Arabic: nothing to approve');
  const many = { kpis: [], measure: null, date: null, cats: {}, y: {}, table: Array.from({ length: 90 }, (_, i) => C('Field ' + i)), slicers: [], tip: {} };
  chk(() => N.toApprove({ bound: [{ page: 'p', visuals: [{ kind: 'table', fields: many.table.map((f) => 'Sales[' + f.c + ']') }] }] }, many, LIST).length === N.MAX && N.MAX <= 60,
    () => `N3c. the list is capped (MAX ${N.MAX})`);

  // ---------- N4: the approval ----------
  const ok = { 'Sales[Total Sales]': { ar: 'إجمالي المبيعات' }, 'Sales[Orders]': { ar: 'الطلبات' }, 'Sales[Region]': { ar: 'المنطقة' }, 'Sales[Month]': { ar: 'الشهر' }, 'Sales[Planned Budget]': { ar: 'الميزانية المخططة' } };
  const a0 = get(() => N.approve(items, {})), aMiss = get(() => N.approve(items, Object.assign({}, ok, { 'Sales[Planned Budget]': { ar: '  ' } })));
  const aLatin = get(() => N.approve(items, Object.assign({}, ok, { 'Sales[Region]': { ar: 'Region' } }))), aHidden = get(() => N.approve(items, Object.assign({}, ok, { 'Sales[Region]': { ar: 'المن‮طقة' } })));
  chk(() => a0.ok === false && a0.missing.length === 5 && aMiss.ok === false && aMiss.missing.join() === 'Planned Budget' && aLatin.ok === false && aLatin.bad.length === 1 && aHidden.ok === false && aHidden.bad.length === 1,
    () => `N4. not approved: nothing answered (5 missing), an empty box, an "Arabic" name with no Arabic letter, an invisible sign: ${cut([a0, aMiss, aLatin, aHidden])}`);
  const aAll = get(() => N.approve(items, ok)), aKeep = get(() => N.approve(items, Object.assign({}, ok, { 'Sales[Region]': { keep: true, ar: 'المنطقة' } })));
  chk(() => aAll.ok && Object.keys(aAll.names).length === 5 && !aAll.kept.length && aKeep.ok && aKeep.kept.join() === 'Region' && !('Sales[Region]' in aKeep.names),
    () => `N4b. approved: 5 Arabic names; "keep English" ticked for Region: Region kept, no Arabic name for it: ${cut([aAll, aKeep])}`);

  // ---------- N5: the titles ----------
  const titles = (r) => r.files.filter((f) => /\/visual\.json$/.test(f.path)).map((f) => { const j = JSON.parse(f.data), t = (((((j.visual || {}).visualContainerObjects || {}).title || [])[0] || {}).properties || {}).text; return t && t.expr && t.expr.Literal ? t.expr.Literal.Value.replace(/^'|'$/g, '') : null; }).filter(Boolean);
  const rAll = get(() => site('ar', N.withNames(en, aAll.names, Bind.mapFields), { namesNote: N.note(aAll) })), tAll = rAll.files ? titles(rAll) : [];
  chk(() => tAll.length > 5 && tAll.every((t) => AR.test(t) && !/[A-Za-z]/.test(bare(t))) && tAll.includes('إجمالي المبيعات حسب الشهر'),
    () => `N5. approved Arabic names: every title wholly Arabic: ${cut(rAll.threw || tAll)}`);
  const rKeep = get(() => site('ar', N.withNames(en, aKeep.names, Bind.mapFields), { namesNote: N.note(aKeep) })), tKeep = rKeep.files ? titles(rKeep) : [];
  chk(() => tKeep.length > 5 && tKeep.every((t) => !mixed(t)) && tKeep.filter((t) => /Region/.test(t)).length >= 2 && tKeep.filter((t) => /Region/.test(t)).every((t) => !AR.test(bare(t))) && tKeep.some((t) => t === 'إجمالي المبيعات حسب الشهر'),
    () => `N5b. Region kept English: its titles wholly English ("Total Sales by Region"), the others wholly Arabic, none mixed: ${cut(rKeep.threw || tKeep.map(bare))}`);

  // ---------- N6: the README ----------
  const readme = (r) => (r.files.find((f) => /(^|\/)README\.md$/.test(f.path)) || {}).data || '';
  chk(() => /Region/.test(readme(rKeep)) && /keep English|kept in English/i.test(readme(rKeep)) && /الإنجليزية/.test(readme(rKeep)) && /Total Sales/.test(readme(rKeep)) && readme(rKeep).includes('إجمالي المبيعات') && readme(rKeep).startsWith('# Own'),
    () => `N6. the README after the report's own text: every approved name, and Region kept English by the person's choice (both languages): ${cut(readme(rKeep))}`);
  const local = get(() => site('ar', N.withNames(en, aKeep.names, Bind.mapFields), { namesNote: N.note(aKeep), model: { byPath: 'Shop.SemanticModel', taken: [] } }));
  const lf = local.files ? local.files.map((f) => f.path) : [];
  chk(() => !lf.includes('README.md') && lf.includes(local.base + '.README.md') && lf.includes(local.base + '.pbip') && /Region/.test(local.files.find((f) => /\.README\.md$/.test(f.path)).data),
    () => `N6b. next to the person's project: its own <report>.README.md, never their README.md: ${cut(local.threw || lf.filter((p) => !p.includes('/')))}`);
  // the writer's random names (a visual's or a filter's 20 to 32 hex name, a .platform GUID) numbered in order of appearance; then byte for byte
  const RANDOM = /\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b|(?<![0-9a-f])[0-9a-f]{20,32}(?![0-9a-f])/g;
  const flat = (r) => { const ids = new Map(), at = (x) => { if (!ids.has(x)) ids.set(x, '#' + ids.size); return ids.get(x); };
    return r.files.map((f) => (f.path + '\n' + (typeof f.data === 'string' ? f.data : Buffer.from(f.data).toString('base64'))).replace(RANDOM, at)).join('\n'); };
  const same = (a, b) => a.files && b.files && flat(a) === flat(b);
  const e1 = get(() => site('en', en)), e2 = get(() => site('en', en, { namesNote: undefined }));
  chk(() => same(e1, e2) && same(get(() => site('ar', en)), r0), () => 'N6c. without the step (no namesNote), the files are byte for byte the same');
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

if (problems.length) { console.log(`FAIL script=test-0.3.1-tt2.mjs cause=${problems.length} of ${checks} checks failed`); console.log(`FAIL  tt2  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  tt2  ${checks} checks`);
