// 0.2.9, KEEP THE DASHBOARD'S IDENTITY (the owner's go, 12 Oct 2026; the reviewer's routine "B6: existing report's theme
// as the default"): when a call names no colours and the model already has a report with its own (custom) theme, the
// new design starts from that theme's colours. LAYER reading (the theme read from the report beside the model) with
// the design block's default colour choice (mcp/lib/design.mjs). Synthetic fixtures only, written red first.
// Run alone (it starts the server itself): node test-0.2.9g.mjs   (npm test runs it too)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const E = createRequire(import.meta.url)('../assets/js/design-engine.js');

export async function v029g({ call, check, ROOT }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 500) : (x.j ? JSON.stringify(x.j) : x.t).slice(0, 500));
  const write = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof o === 'string' ? o : JSON.stringify(o, null, 2)); };
  const solid = (c) => [{ color: { solid: { color: c } } }];
  // a project: <dir>/M.SemanticModel (model.bim) and its reports, each { name, theme (theme JSON) | base (a base theme
  // only), to (the model folder it points at; default M), pbip (an X.pbip beside it) }
  const project = (dir, reports) => {
    const P = path.join(ROOT, dir);
    write(path.join(P, 'M.SemanticModel', 'model.bim'), { name: 'M', compatibilityLevel: 1550, model: { tables: [
      { name: 'Sales', columns: [{ name: 'Region', dataType: 'string', sourceColumn: 'Region' }, { name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'Order Date', dataType: 'dateTime', sourceColumn: 'Order Date' }],
        measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }],
        partitions: [{ name: 'Sales', mode: 'import', source: { type: 'm', expression: 'let Source = #table({"Region"}, {}) in Source' } }] }] } });
    write(path.join(P, 'Other.SemanticModel', 'model.bim'), { name: 'O', compatibilityLevel: 1550, model: { tables: [{ name: 'T', columns: [{ name: 'A', dataType: 'string' }] }] } });
    (reports || []).forEach((r) => {
      const R = path.join(P, r.name + '.Report'), D = path.join(R, 'definition');
      write(path.join(R, 'definition.pbir'), { version: '4.0', datasetReference: { byPath: { path: `../${r.to || 'M'}.SemanticModel` } } });
      write(path.join(D, 'report.json'), Object.assign({ themeCollection: Object.assign({ baseTheme: { name: 'CY24SU10', type: 'SharedResources' } }, r.theme ? { customTheme: { name: r.file || 'Brand.json', type: 'RegisteredResources' } } : {}) },
        r.ours ? { annotations: [{ name: 'generatedBy', value: 'DataArcus Power BI Theme & Layout Generator (dataarcus.com)' }] } : {}));
      // the base theme file a saved report carries (synthetic colours: the reader compares with this file, never a list of its own)
      if (r.base) write(path.join(R, 'StaticResources', 'SharedResources', 'BaseThemes', 'CY24SU10.json'), { name: 'CY24SU10', dataColors: BASE, foreground: '#252423', background: '#ffffff', tableAccent: BASE[0] });
      // colours written on the visuals themselves: [[hex, how many visuals]]
      (r.paint || []).forEach(([c, n], k) => { for (let i = 0; i < n; i++) write(path.join(D, 'pages/p1/visuals', `c${k}_${i}`, 'visual.json'), { name: `c${k}_${i}`, position: { x: 0, y: 0, z: 0, width: 100, height: 100 },
        visual: { visualType: 'shape', objects: { fill: [{ properties: { fillColor: { solid: { color: { expr: { Literal: { Value: `'${c}'` } } } } } } }] } } }); });
      write(path.join(D, 'pages/pages.json'), { pageOrder: ['p1'] });
      write(path.join(D, 'pages/p1/page.json'), { name: 'p1', displayName: 'Overview', width: 1920, height: 1080 });
      if (r.theme) write(path.join(R, 'StaticResources', 'RegisteredResources', r.file || 'Brand.json'), r.theme);
      if (r.pbip) write(path.join(P, r.name + '.pbip'), { version: '1.0', artifacts: [{ report: { path: r.name + '.Report' } }] });
    });
    return dir;
  };
  const BASE = ['#a01010', '#10a010', '#1010a0', '#a0a010', '#10a0a0', '#a010a0', '#505050', '#c06020'];
  const LIGHT = { name: 'Ocean Brand', dataColors: ['#0B5394', '#e69138', '#6aa84f', '#cc0000', '#674ea7', '#45818e', '#bf9000', '#3d85c6', '#999999'], foreground: '#1c2833', background: '#ffffff',
    tableAccent: '#0b5394', good: '#1e8449', neutral: '#d4ac0d', bad: '#a93226',
    visualStyles: { page: { '*': { background: solid('#eef3f8') } }, '*': { '*': { background: solid('#fdfefe'), border: solid('#d0d7de') } } } };
  const DARK = { name: 'Night Ops', dataColors: ['#ff9f1c', '#2ec4b6', '#e71d36', '#cbf3f0', '#ffbf69', '#9b5de5', '#00bbf9', '#f15bb5'], foreground: '#f0f0f0', background: '#1e1e2e', tableAccent: '#ff9f1c',
    visualStyles: { page: { '*': { background: solid('#121220') } } } };
  const TRIO = { name: 'Trio', dataColors: ['#8e44ad', '#16a085', '#d35400'], foreground: '#222222', background: '#ffffff' };
  const FADED = { name: 'Faded', dataColors: ['#eeeeee', '#e8e8e8', '#dddddd', '#d0d0d0', '#c8c8c8', '#c0c0c0', '#b8b8b8', '#b0b0b0'], foreground: '#cccccc', background: '#ffffff', tableAccent: 'red', good: 'javascript:1' };
  project('tl', [{ name: 'M', theme: LIGHT, pbip: true }]);
  project('td', [{ name: 'M', theme: DARK }]);
  project('t3', [{ name: 'M', theme: TRIO }]);
  project('tb', [{ name: 'M' }]);
  project('tp', [{ name: 'M', theme: FADED }]);
  project('tn', []);
  // several reports: the one sharing the model's name (with its .pbip) wins over another of this model; a report of
  // another model is never read
  project('tm', [{ name: 'Z', theme: LIGHT }, { name: 'M', theme: DARK, pbip: true }, { name: 'F', theme: TRIO, to: 'Other' }]);
  // no report shares the model's name: the one a .pbip opens wins
  project('tq', [{ name: 'A', theme: TRIO }, { name: 'B', theme: LIGHT, pbip: true }]);
  // (the laptop's inventory of nine real dashboards, 12 Oct: the identity is often outside the theme file) synthetic shapes:
  // a stub (3 own colours, then the base's), a base theme with colours written on the visuals, transparent visuals made for
  // a page picture, a rich theme (radius, shadow, font), and reports DataArcus wrote itself beside the user's
  const STUB = { name: 'Custom', dataColors: ['#2b2c8d', '#eb6542', '#3a877f'].concat(BASE.slice(3, 8)) };
  const SEE = { name: 'See Through', dataColors: ['#605bff', '#51e51c', '#fe8d1f'], foreground: '#1f1f3a', visualStyles: { '*': { '*': { background: [{ color: { solid: { color: '#ffffff' } }, transparency: 100 }] } } } };
  const RICH = { name: 'Rich', dataColors: ['#7f4bfc', '#5c2dd5', '#9d6fff', '#4fc3f7', '#0d6e8c', '#b393ff', '#f472d0', '#00a896'], foreground: '#1a1a2e',
    textClasses: { title: { fontFace: 'Segoe UI Semibold' } }, visualStyles: { '*': { '*': { border: [{ color: { solid: { color: '#e9ecef' } }, radius: 12 }], dropShadow: [{ show: true, color: { solid: { color: '#7f4bfc' } } }] } } } };
  project('ts', [{ name: 'M', theme: STUB, base: true, paint: [['#c4c4dd', 3], ['#b0b0e4', 2], ['#20e2d7', 4]] }]);
  project('tv', [{ name: 'M', base: true, paint: [['#20E2D7', 5], ['#333333', 3], ['#DE6A73', 2], [BASE[0], 6]] }]);
  project('tt', [{ name: 'M', theme: SEE }]);
  project('tr', [{ name: 'M', theme: RICH }]);
  project('to', [{ name: 'M', theme: TRIO, ours: true }, { name: 'Sales', theme: LIGHT }]);
  project('t2', [{ name: 'M', theme: TRIO, ours: true, pbip: true }, { name: 'North', theme: DARK }, { name: 'South', theme: LIGHT, pbip: true }]);


  const CORP = E.PRESETS.Corporate;
  const LINE = (n) => `Colours from your report's theme "${n}" (you can ask for a preset or your brand colours instead).`;
  const plan = (dir, more) => ask('plan_layout', Object.assign({ path: dir }, more || {}));
  const colOf = (x) => (x.j && x.j.colours) || {};

  // ---------- 1. the reader: the colours a design needs, hex only, from a custom theme only ----------
  process.env.DATAARCUS_ROOT = ROOT;   // (the reading block in this process reads inside the same working folder as the server)
  const RR = await import(pathToFileURL(path.join(HERE, 'lib', 'read-report.mjs')).href);
  const safely = (f) => (...x) => { try { return f(...x); } catch (e) { return { threw: String(e && e.message || e).slice(0, 200) }; } };
  const themeAt = safely((dir, name) => RR.reportTheme(RR.inventory(RR.diskSource(RR.locate(`${dir}/${name}.Report`, 'test'), { big: [], deep: 0 }), name, { pages: [0] })));
  const tl = themeAt('tl', 'M'), tp = themeAt('tp', 'M');
  chk(() => tl && tl.name === 'Ocean Brand' && tl.dataColors.join() === LIGHT.dataColors.slice(0, 8).map((c) => c.toLowerCase()).join() && tl.background === '#eef3f8' && tl.card === '#fdfefe'
    && tl.border === '#d0d7de' && tl.text === '#1c2833' && tl.accent === '#0b5394' && tl.good === '#1e8449' && tl.neutral === '#d4ac0d' && tl.bad === '#a93226',
  () => `1a. reportTheme gives the colours a design needs (8 data colours, page, visuals, border, text, accent, good/neutral/bad): ${JSON.stringify(tl)}`);
  chk(() => tp && tp.accent == null && tp.good == null && tp.text === '#cccccc', () => `1b. a value that is not a hex colour is left out, never passed on: ${JSON.stringify(tp)}`);
  chk(() => themeAt('tb', 'M') === null, () => `1c. a report with a base theme only has no theme of its own (null): ${JSON.stringify(themeAt('tb', 'M'))}`);
  const MD = await import(pathToFileURL(path.join(HERE, 'lib', 'model.mjs')).href), mt = safely((d) => RR.existingTheme(MD.loadModel(d, { root: ROOT })));
  chk(() => mt('tm') && mt('tm').report === 'M' && mt('tm').theme.name === 'Night Ops' && mt('tq') && mt('tq').report === 'B' && mt('tn') === null,
    () => `1d. the report chosen: the model's own name (with its .pbip) first, then the one a .pbip opens; a report of another model never; none: null: ${JSON.stringify([mt('tm'), mt('tq'), mt('tn')])}`);

  // ---------- 2. plan_layout without colours: the report's theme is the starting point ----------
  const pl = await plan('tl'), d = pl.j && pl.j.design;
  chk(() => !pl.err && d.data.join() === LIGHT.dataColors.slice(0, 8).map((c) => c.toLowerCase()).join() && d.ui.background === '#eef3f8' && d.ui.card === '#fdfefe' && d.ui.text === '#1c2833'
    && d.ui.accent === '#0b5394' && d.ui.good === '#1e8449' && colOf(pl).from === 'report theme' && colOf(pl).report === 'M' && colOf(pl).sayInPlan === LINE('Ocean Brand'),
  () => `2a. plan_layout with the model and no colours starts from the report's theme, said in one line: ${short(pl)}`);
  const pa = await plan('tl', { lang: 'ar' });
  chk(() => !pa.err && colOf(pa).sayInPlan === E.label(['', `الألوان من سمة تقريرك "Ocean Brand" (يمكنك طلب نمط جاهز أو ألوان علامتك التجارية بدلاً منها).`], 'ar'),
    () => `2b. the same line in Arabic for an Arabic plan: ${JSON.stringify(colOf(pa))}`);
  const pd = await plan('td'), dd = pd.j && pd.j.design;
  chk(() => !pd.err && E.lum(dd.ui.background) < 0.45 && dd.ui.background === '#121220' && dd.ui.text === '#f0f0f0' && dd.data[0] === '#ff9f1c' && colOf(pd).mode === 'dark',
    () => `2c. a dark theme gives a dark design: ${short(pd)}`);
  const p3 = await plan('t3'), d3 = p3.j && p3.j.design, gen = E.generate('#8e44ad', 'analogous');
  chk(() => !p3.err && d3.data.length === 8 && d3.data.slice(0, 3).join() === TRIO.dataColors.join() && d3.data.slice(3).join() === gen.slice(3).join()
    && (colOf(p3).filled || []).join() === '4,5,6,7,8' && /analogous/.test(colOf(p3).how || ''),
  () => `2d. 3 data colours: kept exactly, colours 4-8 filled by the engine's analogous harmony from the first, said: ${short(p3)}`);
  const pp = await plan('tp'), dp = pp.j && pp.j.design;
  // polish round P1 (the owner's go, 12 Oct; LAB-POLISH (a)): a lead under 3:1 on the cards is darkened to 3:1, its hue
  // kept, and the change named; the other colours are kept
  chk(() => !pp.err && dp.ui.text === '#cccccc' && dp.data[0] === E.toContrast('#eeeeee', dp.ui.card, 3) && JSON.stringify(colOf(pp).changes || []).includes('#eeeeee') && (colOf(pp).contrastWarnings || []).length > 0,
    () => `2e. poor contrast: the theme's colours are kept, every failing check named: ${JSON.stringify(colOf(pp))}`);
  const pb = await plan('tb'), pn = await plan('tn');
  // (moved in round P3 with its cause, RESCORE-6 N28: the default's near-white page is the 6% tint of the lead)
  chk(() => !pb.err && !pn.err && [pb, pn].every((x) => x.j.design.data.join() === CORP.data.join() && x.j.design.ui.background === E.mix(CORP.ui.card, CORP.data[0], 0.06) && !(x.j.colours && x.j.colours.from === 'report theme')),
    () => `2f. a base theme only, or no report: today's default, unchanged (Corporate): ${short(pb)} | ${short(pn)}`);

  // ---------- 3. an explicit colour request always wins ----------
  const gm = await ask('generate_theme', { preset: 'Midnight', planId: null }), pm = await plan('tl', { design: gm.j && gm.j.design });
  chk(() => !pm.err && pm.j.design.data.join() === E.PRESETS.Midnight.data.join() && !(pm.j.colours && pm.j.colours.from === 'report theme'), () => `3a. a design with its own colours (a preset) wins: ${short(pm)}`);
  const gb = await ask('generate_theme', { path: 'tl', brand: '#123456', planId: null }), gp = await ask('generate_theme', { path: 'tl', planId: null });
  chk(() => !gb.err && gb.j.design.data[0] === '#123456' && !gp.err && gp.j.design.data.join() === d.data.join() && gp.j.design.ui.card === '#fdfefe' && (gp.j.sayInPlan || '').includes(LINE('Ocean Brand')),
    () => `3b. generate_theme with the model: no colours asked -> the report's theme (said); a brand colour wins: ${short(gp)} | ${short(gb)}`);
  const g0 = await ask('generate_theme', { planId: null }), ph = await plan('tl', { design: g0.j && g0.j.design });
  chk(() => !ph.err && ph.j.design.data.join() === CORP.data.join() && /generate_theme/.test(JSON.stringify(ph.j.colours || {})) && /path/.test(JSON.stringify(ph.j.colours || {})),
    () => `3c. a design from generate_theme without the model keeps its colours; the plan says how to keep the report's theme: ${JSON.stringify(ph.j && ph.j.colours)}`);

  // ---------- 4. the written report has the theme's colours; the existing report is never touched ----------
  const hash = (dir) => crypto.createHash('sha256').update(fs.readdirSync(dir, { recursive: true }).sort().map((f) => { const p = path.join(dir, f); return fs.statSync(p).isFile() ? f + fs.readFileSync(p).toString('base64') : f; }).join('|')).digest('hex');
  const before = hash(path.join(ROOT, 'tl', 'M.Report'));
  const cr = await ask('create_report', { path: 'tl', name: 'Fresh', design: d });
  const made = !cr.err && fs.readdirSync(path.join(ROOT, 'tl')).filter((n) => /\.Report$/.test(n) && n !== 'M.Report');
  const themeFile = made && made.length === 1 ? fs.readdirSync(path.join(ROOT, 'tl', made[0], 'StaticResources', 'RegisteredResources')).find((n) => /\.json$/.test(n)) : null;
  const written = themeFile ? JSON.parse(fs.readFileSync(path.join(ROOT, 'tl', made[0], 'StaticResources', 'RegisteredResources', themeFile), 'utf8')) : null;
  chk(() => written && written.dataColors.join() === d.data.join() && written.foreground === '#1c2833' && hash(path.join(ROOT, 'tl', 'M.Report')) === before,
    () => `4a. create_report with the plan's design writes the report's colours, and the existing report is unchanged: ${short(cr)} ${JSON.stringify(written && written.dataColors)}`);
  const again = await plan('tl');
  chk(() => !again.err && colOf(again).report === 'M', () => `4b. the next plan still reads the model's own report, never the one just written: ${JSON.stringify(colOf(again))}`);
}


// ---------- 5. the laptop's inventory (12 Oct): three sources, in order; transparent visuals; DataArcus's own reports ----------
export async function v029g5({ call, check }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 500) : (x.j ? JSON.stringify(x.j) : x.t).slice(0, 500));
  const plan = (dir, more) => ask('plan_layout', Object.assign({ path: dir }, more || {}));
  const colOf = (x) => (x.j && x.j.colours) || {};
  const ps = await plan('ts'), ds = ps.j && ps.j.design;
  chk(() => !ps.err && ds.data.slice(0, 4).join() === '#2b2c8d,#eb6542,#3a877f,#20e2d7' && colOf(ps).source === 'theme and visuals' && !ds.data.includes('#c4c4dd') && !ds.data.includes('#10a010'),
    () => `5a. a stub theme: its own colours (not the base's leftovers) first, then the colours written on the visuals by frequency (a pale tint is not a data colour), source named: ${short(ps)}`);
  const pv = await plan('tv'), dv = pv.j && pv.j.design;
  // (P1, LAB-POLISH (a): the pale lead #20e2d7, 1.6:1 on white, is darkened to 3:1, its hue kept)
  chk(() => !pv.err && dv.data[0] === E.toContrast('#20e2d7', dv.ui.card, 3) && dv.data[1] === '#de6a73' && dv.ui.text === '#333333' && colOf(pv).source === 'visuals' && !dv.data.includes('#a01010')
    && /visuals/.test(colOf(pv).sayInPlan || ''),
  () => `5b. a base theme only: the colours written on the visuals lead (by frequency; a base colour is not identity), the dark grey is the text, said: ${short(pv)}`);
  const pt = await plan('tt'), dt = pt.j && pt.j.design;
  chk(() => !pt.err && dt.data[0] === '#605bff' && dt.ui.card === E.PRESETS.Corporate.ui.card && /transparen/.test(JSON.stringify(colOf(pt))),
    () => `5c. transparent visuals (made for a page picture) are not copied: solid cards, and the plan says why: ${short(pt)}`);
  const pr = await plan('tr'), dr = pr.j && pr.j.design;
  chk(() => !pr.err && dr.layout.radius === 12 && dr.layout.shadow === true && dr.font === 'Segoe UI Semibold' && pr.j.page.w === 1920,
    () => `5d. a rich theme's radius, shadow and font are taken where the design has them; the page size is never the theme's business: ${short(pr)}`);
  const po = await plan('to');
  chk(() => !po.err && colOf(po).report === 'Sales' && colOf(po).theme === 'Ocean Brand', () => `5e. a report DataArcus wrote itself is skipped: ${JSON.stringify(colOf(po))}`);
  const p2 = await plan('t2'), p2b = await plan('t2', { themeFrom: 'North' });
  chk(() => !p2.err && colOf(p2).report === 'South' && (colOf(p2).otherReports || []).join() === 'North' && /themeFrom/.test(JSON.stringify(colOf(p2)))
    && !p2b.err && colOf(p2b).report === 'North' && E.lum(p2b.j.design.ui.background) < 0.45,
  () => `5f. two of the user's reports: the one a .pbip opens, the other named, and themeFrom picks it: ${JSON.stringify(colOf(p2))} | ${JSON.stringify(colOf(p2b))}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029g-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await v029g({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await v029g5({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); } });
  await s.close(); fs.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029g  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029g  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
