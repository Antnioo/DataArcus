// 0.3.1 GD1 (the owner, 27 Oct: "i want to make the glassy dashboard default", "Everywhere"; mcp/work/GD1.md): the glass
// look is the default of the Theme Generator, generate_theme and every new report create_report writes; the plain look
// one option away (chart.look "auto", or "plain"); contrast is the gate (glass only where it keeps everything readable,
// else plain, and the plan says why); the redesign, the Arabic twin and the EN-AR copy keep the original report's look.
// Made-up models only, in a temp working folder: no employer or client data.
//   D   the engine: DEFAULT_LOOK glass, CHART_DEFAULTS.look still auto (a saved design keeps its look), glassFit (the gate)
//   L   the design for a new report (planLayout, the pin), the theme generator's design (themeDesign: the redesign's)
//   G   generate_theme: glass by default, plain asked, a pale brand falls back to plain with why
//   R   plan_layout, the approval page and create_report: glass by default (the picture in StaticResources), plain asked
//       (the blank pixel), a pale accent plain with why; Microsoft's validator 0 errors
//   T   the Arabic twin keeps the original report's theme, glass or plain
//   S   the sample project's plan claims no look (its report is empty; a report planned on it takes the default)
//   node test-0.3.1-glass-default.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import * as D from './lib/design.mjs';
import { reportPin, withLookDefaults } from './lib/report-inputs.mjs';
import { BLANK_PNG_BYTES } from './lib/report-run.mjs';

const require = createRequire(import.meta.url);
const E = require('../assets/js/design-engine.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const cut = (o) => (typeof o === 'string' ? o : JSON.stringify(o) || '').slice(0, 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const vs = (th, t, card) => ((((th || {}).visualStyles || {})[t] || {})['*'] || {})[card];
const glassTheme = (th) => { const b = (vs(th, '*', 'background') || [])[0]; return !!(b && b.transparency > 0); };
const PALE = '#FFD54F';   // a pale brand colour: 1.4:1 on a white card, so no transparency keeps colour 1 at 3:1

const design = (preset, look) => { const d = E.fresh(); d.preset = preset; d.data = E.PRESETS[preset].data.slice(); d.ui = Object.assign({}, E.PRESETS[preset].ui); if (look) d.chart = { look }; return E.repairState(d); };

// ---------- D: the engine ----------
chk(() => E.DEFAULT_LOOK === 'glass' && E.CHART_DEFAULTS.look === 'auto', () => `D1. the default look of a new design is glass; a saved design without a look stays plain (CHART_DEFAULTS): ${cut([E.DEFAULT_LOOK, E.CHART_DEFAULTS && E.CHART_DEFAULTS.look])}`);
chk(() => typeof E.glassFit === 'function' && Object.keys(E.PRESETS).every((p) => { const f = E.glassFit(design(p, 'glass')); return f.fits && f.t > 0 && !f.failed.length; }),
  () => `D2. every preset keeps glass (it fits): ${cut(Object.keys(E.PRESETS).map((p) => [p, get(() => E.glassFit(design(p, 'glass')))]))}`);
const pale = (() => { const d = design('Corporate', 'glass'); d.data[0] = PALE; d.ui.accent = PALE; return d; })();
chk(() => { const f = E.glassFit(pale); return !f.fits && f.failed.some((c) => c.id === 'color1OnGlass' && c.ratio < 3); }, () => `D3. a pale brand colour does not fit glass (colour 1 under 3:1 on the see-through cards): ${cut(get(() => E.glassFit(pale)))}`);
chk(() => { const d = design('Corporate', 'glass'); d.ui.text = '#757575'; const f = E.glassFit(d), g = E.glassLook(d); return f.fits && g.strength === 0 && !g.checks.find((c) => c.id === 'textOnPicture').pass; },
  () => 'D4. the page\'s own text failing on its own colour (the picture already plain) is not glass\'s failure: the plain look fails it the same way');
chk(() => { const d = design('DataArcus', 'glass'); Object.assign(d.ui, { text: '#757575', card: '#ffffff', background: '#ffffff' }); const f = E.glassFit(d); return !f.fits && f.t === 0; }, () => 'D5. cards that would have to be solid (transparency 0) are not glass');

// ---------- L: the design of a new report, and the redesign's ----------
const L0 = get(() => D.planLayout({}));
chk(() => L0.design.chart.look === 'glass' && L0.look.look === 'glass' && L0.look.chosenBy === 'default' && /Glass look \(default\)/.test(L0.look.sayInPlan) && /chart\.look "auto"/.test(L0.look.sayInPlan),
  () => `L1. a new report without a look: glass, said "Glass look (default); plain: chart.look "auto"": ${cut(L0.look || L0)}`);
for (const w of ['auto', 'plain']) {
  const r = get(() => D.planLayout({ design: { chart: { look: w } } }));
  chk(() => r.design.chart.look === 'auto' && r.look.chosenBy === 'asked' && !(r.repaired || []).some((x) => /look/.test(x.field)), () => `L2-${w}. chart.look "${w}" is the plain look, as asked, nothing repaired: ${cut([r.look, r.repaired])}`);
}
const L3 = get(() => D.planLayout({ design: { chart: { look: 'glass', labels: 'on' } } })), L4 = get(() => D.planLayout({ design: { chart: { labels: 'on' } } }));
chk(() => L3.design.chart.look === 'glass' && L3.look.chosenBy === 'asked' && L4.design.chart.look === 'glass' && L4.look.chosenBy === 'default' && L4.design.chart.labels === 'on',
  () => `L3. glass asked is glass; a chart style without a look takes the default and keeps its other choices: ${cut([L3.look, L4.look, L4.design && L4.design.chart])}`);
const L5 = get(() => D.planLayout({ colors: { accent: PALE } })), L6 = get(() => D.planLayout({ colors: { accent: PALE }, design: { chart: { look: 'glass' } } }));
chk(() => L5.design.chart.look === 'auto' && L5.look.chosenBy === 'default' && L5.look.glassFailed.some((c) => /colour 1/.test(c.check)) && /can't keep everything readable/.test(L5.look.sayInPlan) && !E.isGlass(L5.design),
  () => `L4. a pale accent: the plain look, and why (glass can't keep colour 1 readable): ${cut(L5.look)}`);
chk(() => L6.design.chart.look === 'auto' && L6.look.chosenBy === 'asked' && /glass was asked, but/.test(L6.look.sayInPlan), () => `L5. glass asked with colours it can't keep readable: plain too, said (contrast is the gate): ${cut(L6.look)}`);
chk(() => { const t = D.themeDesign({}).design; return !E.isGlass(t) && !glassTheme(E.buildTheme(t, 'en')); }, () => 'L6. themeDesign (the redesign\'s restyle) adds no look of its own: plain, as the original');
chk(() => reportPin(withLookDefaults({ lang: 'en' }), null).design.chart.look === 'glass' && reportPin(withLookDefaults({ lang: 'en', design: { chart: { look: 'plain' } } }), null).design.chart.look === 'auto',
  () => 'L7. the plan\'s pin carries the look (glass by default, plain asked): the approval binds it');
chk(() => reportPin({ customVisualsFrom: 'x/X.pbip' }, null).design === null && reportPin({ pages: [{ slots: [] }] }, null).design === null, () => 'L8. a native copy and hand-placed pages have no design, so no look of DataArcus\'s');

// ---------- the tools ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-gd1-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
const bim = path.join(ROOT, 'shop/Shop.SemanticModel/model.bim'); fs.mkdirSync(path.dirname(bim), { recursive: true });
fs.writeFileSync(bim, JSON.stringify({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Date', 'dateTime')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }));
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Channel]', table: ['Sales[Region]', 'Sales[Total Sales]'], slicers: ['Sales[Channel]'] };
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const req = (url, body) => new Promise((resolve) => { if (!url) { resolve(''); return; } const u = new URL(url), r = http.request(u, { method: body ? 'POST' : 'GET', headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); }); r.on('error', () => resolve('')); if (body) r.write(body); r.end(); });
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
// approves a plan the way the person does (the page, then the click); returns the approval page's HTML
const approve = async (id) => { const n = links().length; await s.call('approve_plan', { planId: id }); for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
  const html = await req(links()[n]); await req(links()[n], 'decision=approve'); await s.call('approve_plan', { planId: id }); return html; };
const BG = (RD) => { const P = path.join(RD, 'definition/pages'), RES = path.join(RD, 'StaticResources/RegisteredResources');
  const pages = rd(path.join(P, 'pages.json')).pageOrder.map((pid) => rd(path.join(P, pid, 'page.json'))).filter((p) => p.type !== 'Tooltip');
  const img = (p) => { const im = p.objects && p.objects.background && p.objects.background[0].properties.image; return im && im.image && String(im.image.name.expr.Literal.Value).replace(/^'|'$/g, ''); };
  const theme = fs.readdirSync(RES).filter((f) => /\.json$/.test(f)).map((f) => rd(path.join(RES, f)))[0];
  return { pages: pages.map((p) => ({ w: p.width, h: p.height, bytes: img(p) ? fs.readFileSync(path.join(RES, img(p))) : null })), theme }; };
try {
  // ---------- G: generate_theme ----------
  const g0 = await s.call('generate_theme', { lang: 'en' }), gj = g0.j || {};
  chk(() => !g0.err && gj.design.chart.look === 'glass' && gj.look.look === 'glass' && gj.look.chosenBy === 'default' && gj.glass && /Glass look \(default\)/.test(gj.sayInPlan),
    () => `G1. generate_theme without a look: glass (default), its glass block and the plan's line: ${cut(g0.err ? g0.t : [gj.look, gj.sayInPlan])}`);
  const g1 = await s.call('generate_theme', { lang: 'en', chart: { look: 'plain' } }), g1j = g1.j || {};
  chk(() => !g1.err && g1j.design.chart.look === 'auto' && !g1j.glass && g1j.look.chosenBy === 'asked' && !(g1j.repaired || []).some((x) => /look/.test(x.field)),
    () => `G2. chart.look "plain" (or "auto"): the plain look, no glass block, nothing repaired: ${cut(g1.err ? g1.t : [g1j.look, g1j.repaired])}`);
  const g2 = await s.call('generate_theme', { lang: 'en', brand: PALE }), g2j = g2.j || {};
  chk(() => !g2.err && g2j.design.chart.look === 'auto' && !g2j.glass && Array.isArray(g2j.look.glassFailed) && /can't keep everything readable/.test(g2j.sayInPlan) && /this theme has Power BI's own solid cards/.test(g2j.sayInPlan),
    () => `G3. a pale brand colour: plain, and the plan says why: ${cut(g2.err ? g2.t : [g2j.look, g2j.sayInPlan])}`);

  // ---------- R: plan_layout, the approval page, create_report ----------
  const made = {};
  for (const [nm, extra, want] of [['default', {}, 'glass'], ['plain', { design: { chart: { look: 'auto' } } }, 'auto'], ['pale', { colors: { accent: PALE } }, 'auto']]) {
    const args = Object.assign({ path: 'shop/Shop.SemanticModel', lang: 'en', layout: 'exec', filters: 'top', secondPage: true, name: 'Look ' + nm }, extra.colors ? { colors: extra.colors } : {});
    const pl = await s.call('plan_layout', Object.assign({ planFields: FIELDS }, extra.design ? { design: extra.design } : {}, args)), pj = pl.j || {}, id = pj.plan && pj.plan.planId;
    chk(() => !!id && pj.look && pj.look.look === want && pj.design.chart.look === want && (nm === 'default' ? pj.look.chosenBy === 'default' && /Glass look \(default\)/.test(pj.look.sayInPlan) : nm === 'plain' ? pj.look.chosenBy === 'asked' : Array.isArray(pj.look.glassFailed)),
      () => `R1-${nm}. plan_layout's look: ${want}${nm === 'pale' ? ', and why' : ''}: ${cut(pl.err ? pl.t : pj.look)}`);
    if (!id) continue;
    const html = await approve(id);
    chk(() => /Card look/.test(html) && (nm === 'default' ? /Glass look \(default\)/.test(html) && /chart\.look &quot;auto&quot;|chart\.look "auto"/.test(html) : nm === 'plain' ? /Plain, as asked/.test(html) : /glass can(&#39;|&#x27;|')t keep everything readable/.test(html)),
      () => `R2-${nm}. the approval page's "Card look" row: ${cut((html.match(/Card look.{0,300}/) || [''])[0])}`);
    const r = await s.call('create_report', Object.assign({ planId: id, design: pj.design, fields: FIELDS }, args)), rj = r.j || {};
    chk(() => !r.err && rj.look && rj.look.look === want, () => `R3-${nm}. create_report writes the look the plan said: ${cut(r.err ? r.t : rj.look)}`);
    if (r.err) continue;
    const b = get(() => BG(path.join(ROOT, 'shop', 'Look ' + nm + '.Report')));
    chk(() => b.pages.length === 2 && (want === 'glass' ? glassTheme(b.theme) && b.pages.every((p) => Buffer.from(p.bytes).equals(Buffer.from(E.glassPng(pj.design, p.w, p.h))))
      : !glassTheme(b.theme) && b.pages.every((p) => Buffer.from(p.bytes).equals(Buffer.from(BLANK_PNG_BYTES)))),
    () => `R4-${nm}. ${want === 'glass' ? 'the glass theme and the soft picture behind every page' : 'solid cards and the blank pixel (the page colour shows)'}: ${cut(b.threw || [glassTheme(b.theme), b.pages.map((p) => [p.w, p.h, p.bytes && p.bytes.length])])}`);
    const c = await s.call('check_report', { path: rj.open }), cj = c.j || {};
    chk(() => !c.err && cj.validator && cj.validator.ran && cj.validator.errors === 0 && cj.impact.kinds.canBreak.count === 0, () => `R5-${nm}. Microsoft's validator 0 errors, 0 "can break": ${cut(c.err ? c.t : cj.validator)}`);
    made[nm] = { rd: path.join(ROOT, 'shop', 'Look ' + nm + '.Report'), pbip: rj.open, theme: b.theme };
  }

  // ---------- T: the Arabic twin keeps the original report's look ----------
  for (const nm of ['default', 'plain']) {
    if (!made[nm]) continue;
    const src = String(made[nm].pbip).split('\\').join('/');
    const p0 = await s.call('create_arabic_twin', { path: src }), L = {}; let k = 0;
    ((p0.j && p0.j.texts) || []).filter((t) => t.text != null).forEach((t) => { L[t.id] = t.draftArabic || `نص ${++k}`; });
    const p1 = await s.call('create_arabic_twin', { path: src, labels: L }), pid = p1.j && p1.j.plan && p1.j.plan.planId;
    if (pid) await approve(pid);
    const w = pid ? await s.call('create_arabic_twin', { path: src, planId: pid }) : { err: true, t: 'no plan: ' + cut(p1.t) };
    const twin = fs.readdirSync(path.join(ROOT, 'shop')).find((f) => f.startsWith('Look ' + nm + ' ') && f.endsWith('.Report'));
    const tb = twin ? get(() => BG(path.join(ROOT, 'shop', twin))) : null;
    chk(() => !w.err && tb && JSON.stringify(tb.theme) === JSON.stringify(made[nm].theme) && glassTheme(tb.theme) === (nm === 'default'),
      () => `T1-${nm}. the Arabic twin keeps the original report's theme (${nm === 'default' ? 'glass' : 'plain'}), no default of its own: ${cut(w.err ? w.t : [twin, tb && glassTheme(tb.theme)])}`);
  }

  // ---------- S: the sample project ----------
  const sp = await s.call('plan_layout', { sample: true }), sj = sp.j || {};
  chk(() => !sp.err && sj.plan && sj.plan.planId && !('look' in sj), () => `S1. the sample project's plan claims no look (its report is empty; a report planned on it takes the default): ${cut(sp.err ? sp.t : Object.keys(sj))}`);
} finally {
  await s.close();
  try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* the OS cleans its temp folder */ }
}
if (problems.length) { console.log(`FAIL script=test-0.3.1-glass-default.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  glass-default  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  glass-default  ${checks} checks`);
process.exit(0);
