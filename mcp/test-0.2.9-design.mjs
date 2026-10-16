import './test-env.mjs';
// 0.2.9, the design engine block (the audit mcp/work/audit-2-design-engine.md on fix/0.2.9-checks, findings A2-1 to
// A2-12 except A2-3, and the audit's "Seen, not in scope" items of this block). Written red first.
// The owner's rule of 11 Oct: build in blocks, fix at the root inside one block, nothing tuned to his two portfolio
// reports or to fixtures: the model here is a made-up one (a bike shop), not the portfolio's names.
// test.mjs runs it with its own client (import { v029design }); run alone it starts the server itself:
//   node test-0.2.9-design.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const req = createRequire(import.meta.url);
const src = (f) => fs0.readFileSync(path.join(REPO, f), 'utf8');

// the engine on its own (no server): the checks of the design block's black box
export async function v029designEngine({ check }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const E = req('../assets/js/design-engine.js');
  const D = await import('./lib/design.mjs');
  const get = (fn) => { try { return fn(); } catch (e) { return 'threw: ' + e.message; } };
  const copy = (o) => JSON.parse(JSON.stringify(o));
  const base = () => ({ name: 'Bike shop', font: 'Segoe UI', data: E.PRESETS.Corporate.data.slice(), ui: Object.assign({}, E.PRESETS.Corporate.ui) });
  const design = (layout) => E.repairState(Object.assign(base(), { layout: Object.assign({ v: 3 }, layout) }));
  const kinds = (slots) => slots.map((s) => s.kind).join();
  const small = (preset, w, h) => design({ preset, page: 'custom', pageW: w, pageH: h }).layout;

  // ---------- A2-1: the small-page rule lives in the engine, so the website and the MCP lay out the same page ----------
  {
    const l = small('exec', 640, 360), web = get(() => kinds(E.computeSlots(l, 'en'))), mcp = get(() => kinds(D.planLayout({ design: design({ preset: 'exec', page: 'custom', pageW: 640, pageH: 360 }), lang: 'en' }).slots));
    chk(() => web === 'title,logo,kpi,kpi,kpi,kpi,line,text' && web === mcp, () => `A2-1: a 640 x 360 executive page gives the same slots on the website and in the MCP (the single-focus layout): website ${web}, MCP ${mcp}`);
    const pages = get(() => E.projectPages(l, 'en', { second: true }));
    chk(() => Array.isArray(pages) && pages.length === 1, () => `A2-1: no second page under 800 wide, in the engine: ${Array.isArray(pages) ? pages.length : pages} pages`);
    const sp = get(() => E.smallPage(l)), wide = get(() => E.smallPage(small('exec', 800, 450)));
    chk(() => sp && sp.w === 640 && sp.from === 'exec' && sp.to === 'focus' && wide === null, () => `A2-1: E.smallPage says which layout a small page takes: 640 ${JSON.stringify(sp)}, 800 ${JSON.stringify(wide)}`);
    const k = get(() => E.computeSlots(small('focus', 700, 394), 'en').find((s) => s.kind === 'kpi').h);
    chk(() => k === 116, () => `A2-1: the single-focus KPI row under 800 wide is 116 high on the 720 grid (measured at 640 x 360): ${k}`);
    chk(() => kinds(E.computeSlots(small('exec', 800, 450), 'en')) === 'title,logo,kpi,kpi,kpi,kpi,line,bar,column,table', () => 'A2-1: 800 wide keeps the executive layout');
    chk(() => E.SMALL_PAGE && E.SMALL_PAGE.w === 800 && E.SMALL_PAGE.kpiH === 116 && /640 x 360/.test(E.SMALL_PAGE.measured || ''), () => `A2-1: the 800 and 116 values say where they were measured: ${JSON.stringify(E.SMALL_PAGE)}`);
    chk(() => /700.{0,40}800/.test(src('scripts/tests/DESKTOP-TESTS.md').split('A2-1')[1] || ''), () => 'A2-1: DESKTOP-TESTS.md names the 700-800 wide laptop proof (under "A2-1")');
  }

  // ---------- A2-2: planLayout's own smallPage is what the note uses ----------
  {
    const r = get(() => D.planLayout({ design: design({ preset: 'exec', page: 'custom', pageW: 640, pageH: 360 }), lang: 'en' }));
    const f = get(() => D.planLayout({ design: design({ preset: 'focus', page: 'custom', pageW: 700, pageH: 394 }), lang: 'en' }));
    chk(() => r.smallPage && r.smallPage.from === 'exec' && r.smallPage.to === 'focus' && /640 wide/.test(r.smallPage.say) && !f.smallPage, () => `A2-2: smallPage only when the plan was switched: exec 640 ${JSON.stringify(r.smallPage)}, focus 700 ${JSON.stringify(f.smallPage)}`);
  }

  // ---------- A2-4: the engine takes kpis 0-6; kpiCards goes; a value it can't use is reported ----------
  {
    const one = get(() => D.planLayout({ kpis: 1, lang: 'en' }).design.layout);
    chk(() => one.kpis === 1 && !('kpiCards' in one), () => `A2-4: plan_layout's kpis 1 is the layout's kpis, no kpiCards: ${JSON.stringify(one)}`);
    const zero = get(() => E.computeSlots(design({ preset: 'exec', kpis: 0 }).layout, 'en')), q = get(() => E.computeSlots(design({ preset: 'exec', kpis: 1, page: '1280x720' }).layout, 'en'));
    chk(() => !zero.some((s) => s.kind === 'kpi') && q.filter((s) => s.kind === 'kpi').length === 1 && q.find((s) => s.kind === 'kpi').w === Math.round((1280 - 32 - 36) / 4), () => `A2-4: kpis 0 leaves the row out, kpis 1 is one card a quarter of the row: ${JSON.stringify(q && q.filter((s) => s.kind === 'kpi'))}`);
    const notes = [], seven = get(() => E.repairState(Object.assign(base(), { layout: { v: 3, preset: 'exec', kpis: 7 } }), (n) => notes.push(n)));
    chk(() => seven.layout.kpis === 4 && notes.some((n) => n.field === 'layout.kpis' && n.given === 7 && n.used === 4), () => `A2-4: kpis 7 is reported, not reset without a word: ${JSON.stringify(notes)}`);
    const legacyNotes = [], legacy = get(() => E.repairState(Object.assign(base(), { layout: { v: 3, preset: 'exec', kpis: 4, kpiCards: 2 } }), (n) => legacyNotes.push(n)));
    chk(() => legacy.layout.kpis === 2 && !('kpiCards' in legacy.layout) && legacyNotes.some((n) => n.field === 'layout.kpiCards'), () => `A2-4: an older design's kpiCards becomes its kpis, and is said: ${JSON.stringify(legacy.layout)} ${JSON.stringify(legacyNotes)}`);
    const r7 = get(() => D.planLayout({ design: Object.assign(base(), { layout: { kpis: 7 } }), lang: 'en' }));
    chk(() => (r7.repaired || []).some((x) => x.field === 'layout.kpis' && x.given === 7), () => `A2-4: plan_layout reports the design's kpis 7: ${JSON.stringify(r7.repaired)}`);
    const pages = get(() => E.projectPages(design({ preset: 'analysis', kpis: 3, filters: true }).layout, 'en', { second: true, maxKpis: 2 }));
    chk(() => pages.length === 2 && pages.every((p) => p.slots.filter((s) => s.kind === 'kpi').length === 2), () => `A2-4: maxKpis (the report's measures) caps every page: ${JSON.stringify(pages.map && pages.map((p) => p.slots.filter((s) => s.kind === 'kpi').length))}`);
    const two = get(() => E.projectPages(design({ preset: 'exec', kpis: 2 }).layout, 'en', { second: true }));
    chk(() => two.map((p) => p.slots.filter((s) => s.kind === 'kpi').length).join() === '2,2', () => `A2-4: a page with fewer cards than its layout plans keeps the second page at that count: ${JSON.stringify(two.map && two.map((p) => p.slots.filter((s) => s.kind === 'kpi').length))}`);
    chk(() => !/c\.kpiCards/.test(src('assets/js/design-engine.js')) && !/kpiCards/.test(src('assets/js/theme-generator.js').replace(/\/\/[^\n]*/g, '')) && !/kpiCards/.test(src('mcp/lib/design.mjs').replace(/\/\/[^\n]*/g, '')),
      () => 'A2-4: no kpiCards in the engine (but the older-design repair), the website or design.mjs');
  }

  // ---------- A2-5: one wideTable default (the engine's); the table's share from its need ----------
  {
    const srv = src('mcp/server.mjs'), dm = src('mcp/lib/design.mjs');
    chk(() => !/wideTable\s*[:=]/.test(srv.replace(/\/\/[^\n]*/g, '')) && !/wideTable\s*[:=]/.test(dm.replace(/\/\/[^\n]*/g, '')), () => 'A2-5: wideTable is defaulted in the engine only (not in server.mjs or design.mjs)');
    const w = (o, opt) => get(() => E.computeSlots(design(Object.assign({ preset: 'exec', page: '960x720' }, o)).layout, 'en', opt).find((s) => s.kind === 'table').w);
    chk(() => w({}) === 550 && w({ filters: true, fpos: 'end' }) === 425 && w({}, { tableFields: 4 }) === 550, () => `A2-5: four fields (the measured case) keep today's widths: ${w({})}, ${w({ filters: true, fpos: 'end' })}, ${w({}, { tableFields: 4 })}`);
    chk(() => w({}, { tableFields: 6 }) > w({}, { tableFields: 5 }) && w({}, { tableFields: 5 }) > 550 && w({}, { tableFields: 2 }) === 550, () => `A2-5: more fields, a wider table (2: ${w({}, { tableFields: 2 })}, 5: ${w({}, { tableFields: 5 })}, 6: ${w({}, { tableFields: 6 })})`);
    chk(() => w({ wideTable: false }) === 458, () => `A2-5: a design that says wideTable false keeps equal shares: ${w({ wideTable: false })}`);
    chk(() => E.TABLE_NEED && /463/.test(E.TABLE_NEED.measured) && /483/.test(E.TABLE_NEED.measured) && E.TABLE_NEED.fields === 4, () => `A2-5: the 1.5's source is written down: ${JSON.stringify(E.TABLE_NEED)}`);
  }

  // ---------- A2-6: slots carry their index ----------
  {
    const sl = get(() => E.computeSlots(design({ preset: 'ops', kpis: 6 }).layout, 'en').filter((s) => s.kind === 'kpi'));
    chk(() => sl.map((s) => s.index).join() === '0,1,2,3,4,5', () => `A2-6: KPI slots carry index 0..5: ${JSON.stringify(sl.map && sl.map((s) => s.index))}`);
    const d = design({ preset: 'exec', kpiBarC: 'data' }), renamed = get(() => E.computeSlots(d.layout, 'en').map((s) => Object.assign({}, s, { role: { en: 'Revenue', ar: 'الإيرادات' } })));
    const svg = get(() => E.bgSvg(d, renamed, {}, 'en'));
    chk(() => typeof svg === 'string' && !/undefined/.test(svg) && svg.includes(`fill="${d.data[1]}"`), () => `A2-6: a renamed role still colours KPI 2 with data colour 2: ${String(svg).slice(0, 120)}`);
  }

  // ---------- A2-7: the engine escapes and clamps colours itself; repairState checks every layout key; the schema ----------
  {
    const bad = Object.assign(base(), { ui: Object.assign(base().ui, { background: '"/><script>alert(1)</script>', card: 'red' }), layout: design({ preset: 'exec' }).layout });
    const svg = get(() => E.bgSvg(bad, E.computeSlots(bad.layout, 'en'), {}, 'en')), th = get(() => JSON.stringify(E.buildTheme(bad, 'en')));
    chk(() => !/<script|alert\(|"red"/.test(svg) && !/<script|alert\(|"red"/.test(th), () => `A2-7: an unrepaired colour never reaches the SVG or the theme: ${String(svg).slice(0, 160)}`);
    const proto = Object.assign(base(), { layout: Object.assign(design({ preset: 'exec' }).layout, { kpiBarC: 'constructor', headLineC: '__proto__' }) });
    chk(() => /^#[0-9a-f]{6}$/.test(get(() => E.barColor(proto, 'kpiBarC', 0))) && /^#[0-9a-f]{6}$/.test(get(() => E.barColor(proto, 'headLineC', 0))), () => `A2-7: barColor of "constructor": ${get(() => E.barColor(proto, 'kpiBarC', 0))}`);
    const notes = [], r = get(() => E.repairState(Object.assign(base(), { layout: { v: 3, kpiBarC: 'constructor', headLineC: 'pink', fpos: 'middle', wideTable: 'yes', kpiBarW: 'x' } }), (n) => notes.push(n)));
    const fixed = notes.map((n) => n.field).sort().join();
    chk(() => !('kpiBarC' in r.layout) && !('headLineC' in r.layout) && !('fpos' in r.layout) && !('wideTable' in r.layout) && fixed === 'layout.fpos,layout.headLineC,layout.kpiBarC,layout.kpiBarW,layout.wideTable',
      () => `A2-7: kpiBarC, headLineC, fpos, wideTable and kpiBarW checked and reported: ${JSON.stringify(r.layout)} ${fixed}`);
    chk(() => Array.isArray(E.DESIGN_KEYS) && Array.isArray(E.LAYOUT_KEYS) && E.LAYOUT_KEYS.includes('kpiBarC') && !E.LAYOUT_KEYS.includes('kpiCards') && E.SCHEMA && E.LAYOUT_KEYS.every((k) => E.SCHEMA.layout[k] && E.SCHEMA.layout[k].about) && E.DESIGN_KEYS.every((k) => E.SCHEMA[k] && (E.SCHEMA[k].about || k === 'layout')),
      () => 'A2-7: the engine exports DESIGN_KEYS, LAYOUT_KEYS and a written SCHEMA with every key');
    chk(() => !/const (DESIGN|LAYOUT)_KEYS = \[/.test(src('mcp/server.mjs')), () => 'A2-7: server.mjs uses the engine\'s key lists');
  }

  // ---------- A2-8: no file I/O in the design adapter; the server reaches the engine only through design.mjs ----------
  {
    const dm = src('mcp/lib/design.mjs'), srv = src('mcp/server.mjs');
    chk(() => !/node:fs|from '\.\/model\.mjs'/.test(dm) && !('freeFile' in D), () => 'A2-8: design.mjs has no fs, no import from the reading block, no freeFile');
    chk(() => fs0.existsSync(path.join(HERE, 'lib/files.mjs')) && /export function freeFile/.test(src('mcp/lib/files.mjs')), () => 'A2-8: freeFile lives in the tools\' file helper (lib/files.mjs)');
    chk(() => !/\bE\.[A-Za-z]/.test(srv) && !/import \{[^}]*\bE\b[^}]*\} from '\.\/lib\/design\.mjs'/.test(srv), () => `A2-8: server.mjs calls no E.* directly: ${(srv.match(/\bE\.[A-Za-z]+/g) || []).slice(0, 8).join(' ')}`);
  }

  // ---------- A2-9: labels keyed by language, English fallback; rtl from a set of RTL languages ----------
  {
    chk(() => E.label({ en: 'Main trend', ar: 'الاتجاه الرئيسي' }, 'fr') === 'Main trend' && E.label(E.LAYOUTS.exec.name, 'ar') === 'ملخص تنفيذي' && E.label(E.KINDS.kpi, 'de') === 'Card' && E.LAYOUTS.exec.name.en === 'Executive summary',
      () => 'A2-9: E.label picks the language, else English; LAYOUTS and KINDS are keyed by language');
    const rt = ['ar', 'fa', 'ur', 'he', 'ar-AE', 'en', 'fr', ''].map((l) => get(() => E.rtl({ dir: '' }, l)));
    chk(() => rt.join() === 'true,true,true,true,true,false,false,false', () => `A2-9: rtl by language (ar fa ur he ar-AE en fr ''): ${rt.join()}`);
    chk(() => get(() => E.texts('fr').reset) === 'Reset filters' && get(() => E.texts('ar').reset) === E.REPORT_TEXTS.ar.reset, () => 'A2-9: E.texts(lang) with an English fallback');
    const fa = get(() => E.projectPages(design({ preset: 'exec' }).layout, 'fa', {})[0]);
    chk(() => fa.name === 'Executive summary' && fa.slots.find((s) => s.kind === 'kpi').x > 900, () => `A2-9: a Persian page: English labels, mirrored: ${fa && fa.name} ${fa && fa.slots && fa.slots.find((s) => s.kind === 'kpi').x}`);
  }

  // ---------- A2-10: one E.roles(ui) ----------
  {
    const u = E.PRESETS.Midnight.ui, ro = get(() => E.roles(u));
    chk(() => ro.secondary === E.mix(u.text, u.card, 0.35) && ro.tertiary === E.mix(u.text, u.card, 0.6) && ro.grid === E.mix(u.text, u.card, 0.85) && ro.gridline === E.mix(u.text, u.card, 0.8)
      && E.buildTheme(Object.assign(base(), { ui: u, layout: design({}).layout }), 'en').foregroundNeutralSecondary === ro.secondary, () => `A2-10: E.roles: ${JSON.stringify(ro)}`);
    const tg = src('assets/js/theme-generator.js'), en = src('assets/js/design-engine.js');
    chk(() => !/mix\(u\.text, u\.card, 0\.(35|85|8)\)/.test(tg) && (en.match(/mix\(u\.text, u\.card, 0\.35\)/g) || []).length === 1, () => 'A2-10: the derived colours are computed once (E.roles), not in the website page');
  }

  // ---------- A2-11: the fonts: only measured fonts, or the widest one on the laptop list ----------
  {
    chk(() => Array.isArray(E.MEASURED_FONTS) && E.MEASURED_FONTS.includes('Segoe UI') && E.MEASURED_FONTS.includes('Tahoma') && !E.MEASURED_FONTS.includes('Verdana'), () => `A2-11: the engine names its measured fonts: ${JSON.stringify(E.MEASURED_FONTS)}`);
    const t = get(() => D.themeDesign({ font: 'Verdana' }));
    chk(() => t.notes.some((n) => /Verdana/.test(n) && /measured/.test(n)), () => `A2-11: a font not measured is said: ${JSON.stringify(t.notes)}`);
    chk(() => /A2-11[\s\S]{0,400}Verdana/.test(src('scripts/tests/DESKTOP-TESTS.md')), () => 'A2-11: DESKTOP-TESTS.md has the laptop measure of the widest font (Verdana)');
  }

  // ---------- A2-12: the theme name is capped in repairState ----------
  {
    const notes = [], r = get(() => E.repairState(Object.assign(base(), { name: 'x'.repeat(5000) }), (n) => notes.push(n)));
    chk(() => r.name.length === 60 && notes.some((n) => n.field === 'name'), () => `A2-12: a 5,000-character name is cut to 60 and said: ${r.name && r.name.length}`);
  }

  // ---------- A6-10 (the tools audit, the reviewer's addition): the theme's page scale is the engine's ----------
  {
    const pages = [['1920x1080'], ['1280x720'], ['960x720'], ['custom', 1366, 768], ['custom', 3840, 2160], ['custom', 640, 360]];
    const bad = pages.map(([pg, w, h]) => {
      const d = design(Object.assign({ preset: 'exec', page: pg }, w ? { pageW: w, pageH: h } : {})), th = E.buildTheme(d, 'en'), sc = get(() => E.themeScaleOf(th));
      const again = sc && sc.h ? get(() => JSON.stringify(E.buildTheme(design({ preset: 'exec', page: 'custom', pageW: Math.round(sc.h * 16 / 9), pageH: sc.h }), 'en').visualStyles.tableEx)) : null;
      return sc && sc.h && again === JSON.stringify(th.visualStyles.tableEx) ? null : `${pg}${w ? ' ' + w + 'x' + h : ''}: ${JSON.stringify(sc)}`;
    }).filter(Boolean);
    chk(() => !bad.length, () => `A6-10: themeScaleOf finds the height every buildTheme was made for: ${bad.join(' | ')}`);
    const user = { name: 'Mine', visualStyles: { tableEx: { '*': { values: [{ fontSize: 12 }] } } } };
    chk(() => get(() => E.themeScaleOf(user)) === null, () => `A6-10: a theme the user made gives null: ${JSON.stringify(get(() => E.themeScaleOf(user)))}`);
    const t = E.buildTheme(design({ preset: 'exec', page: '1920x1080' }), 'en'), half = get(() => E.scaleTheme(t, 0.5));
    chk(() => half.visualStyles.card['*'].labels[0].fontSize === 21 && half.textClasses.callout.fontSize === 21 && t.visualStyles.card['*'].labels[0].fontSize === 42 && get(() => E.scaleTheme(t, 10)).textClasses.callout.fontSize === 60,
      () => `A6-10: scaleTheme scales every text size within 8-60 and leaves the theme given as it was: ${JSON.stringify(half && half.textClasses)}`);
    chk(() => !/fsz\(|for \(let h = 200; h <= 4400/.test(src('mcp/server.mjs')), () => 'A6-10: server.mjs no longer re-derives the theme\'s scale');
  }

  // ---------- the audit's "Seen, not in scope" in this block ----------
  {
    const r = get(() => D.planLayout({ dir: 'up', lang: 'en' })), d2 = get(() => D.planLayout({ design: Object.assign(base(), { layout: { dir: 'sideways' } }), lang: 'en' }));
    chk(() => (r.repaired || []).some((x) => x.field === 'layout.dir') && (d2.repaired || []).some((x) => x.field === 'layout.dir'), () => `seen: a bad dir is reported, not reset without a word: ${JSON.stringify(r.repaired)} ${JSON.stringify(d2.repaired)}`);
    chk(() => !/rx="18"/.test(src('assets/js/theme-generator.js')), () => 'seen: the layout thumbnails use the design\'s radius, not a fixed rx="18"');
  }
}

// the tools (with a server): what the user is told
export async function v029design({ call, check, ROOT, fs = fs0 }) {
  await v029designEngine({ check });
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  fs.mkdirSync(path.join(ROOT, 'd-bikes', 'M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'd-bikes', 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Rentals', partitions: mp('Rentals'), columns: [col('Fee', 'double'), col('Minutes', 'int64'), col('Station', 'string'), col('Bike Type', 'string'), col('Start', 'dateTime')],
      measures: [{ name: 'Fees', expression: 'SUM ( Rentals[Fee] )', formatString: '#,0' }, { name: 'Rides', expression: 'COUNTROWS ( Rentals )', formatString: '#,0' }, { name: 'Ride Minutes', expression: 'SUM ( Rentals[Minutes] )', formatString: '#,0' }] }] } }));
  const lay = (preset, w, h) => ({ name: 'Bikes', layout: { v: 3, preset, page: 'custom', pageW: w, pageH: h } });

  // A2-2: create_report's note comes from the plan's own smallPage
  {
    const ex = await ask('create_report', { path: 'd-bikes', name: 'D small exec', design: lay('exec', 640, 360) });
    const fo = await ask('create_report', { path: 'd-bikes', name: 'D small focus', design: lay('focus', 700, 394) });
    const said = (x) => ((x.j && x.j.reportNotes) || []).some((n) => /under 800/.test(n) && /single-focus/.test(n));
    chk(() => !ex.err && said(ex) && !fo.err && !said(fo), () => `A2-2: the switch is said when exec was switched (${said(ex)}), not when focus was chosen (${said(fo)}): ${short(ex)} | ${short(fo)}`);
  }
  // A2-4 + A2-7: plan_layout reports a design value it could not use (kpis 7, a bad dir)
  {
    const p = await ask('plan_layout', { design: { name: 'Bikes', layout: { kpis: 7, dir: 'up' } }, lang: 'en' });
    const rep = (p.j && p.j.repaired) || [];
    chk(() => rep.some((x) => x.field === 'layout.kpis' && x.given === 7) && rep.some((x) => x.field === 'layout.dir'), () => `A2-4: plan_layout's repaired lists kpis 7 and dir "up": ${short(p)}`);
  }
  // A2-12: the echoed design's name is capped
  {
    const p = await ask('plan_layout', { design: { name: 'n'.repeat(5000) }, lang: 'en' });
    chk(() => p.j && p.j.design.name.length === 60, () => `A2-12: the design echoed back has its name capped at 60: ${p.j ? p.j.design.name.length : short(p)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029d-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await v029design({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029design  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029design  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
