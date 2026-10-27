// 0.3.1 GL1 (the owner, 26 Oct: "Actually add all ideas i gave you now"; mcp/work/GL1.md; written red first): the glass
// look. Power BI has no blur behind a visual: the look is a visual's background colour with transparency, a light border,
// a soft shadow, and a page background picture DataArcus draws already soft (no photo). Made-up models only, in a temp
// working folder: no employer or client data.
//   O   the choice: chart.look 'auto' | 'glass' (the design engine's chart styles), kept by the repair, off by default
//   T   the theme: every visual type's background (the card colour, transparency), border (1, the rim, the corners in
//       page units; none on cardVisual), shadow; tables' cells see-through (clear back colours, GL2); light and dark; 'auto' byte for byte
//   P   the picture: a PNG at the page's size, read back by pngjs to the engine's own pixels, the same bytes every time
//       from the same theme, other bytes from another, small; light and dark
//   C   the contrast: the card over the darkest and the lightest pixel keeps text 4.5:1, labels 4.5:1, colour 1 3:1 (the
//       transparency lowered until it does), the page text 4.5:1 on the picture; checked on the full picture too
//   W   the writer: create_report puts the picture in StaticResources as each page's background, the theme glass, EN and
//       AR, light and dark; Microsoft's validator 0 errors, check_report 0 "can break"
//   G   generate_theme takes chart.look and says the truth (no blur; the numbers)
//   node test-0.3.1-glass.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const require = createRequire(import.meta.url);
const E = require('../assets/js/design-engine.js'), { PNG } = require('pngjs');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const cut = (o) => (typeof o === 'string' ? o : JSON.stringify(o) || '').slice(0, 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const has = (k) => typeof E[k] === 'function';

const design = (preset, look, layout) => { const d = E.fresh(); d.preset = preset; d.data = E.PRESETS[preset].data.slice(); d.ui = Object.assign({}, E.PRESETS[preset].ui); if (look) d.chart = { look }; E.repairState(d); Object.assign(d.layout, layout || {}); return d; };
const LIGHT = design('Corporate', 'glass'), DARK = design('DataArcus', 'glass');
const vs = (th, t, card) => ((((th || {}).visualStyles || {})[t] || {})['*'] || {})[card];

// ---------- O: the choice ----------
chk(() => JSON.stringify(E.CHART_OPTIONS.look) === '["auto","glass"]' && E.CHART_DEFAULTS.look === 'auto', () => `O1. a chart style "look": auto or glass, auto by default: ${cut([E.CHART_OPTIONS.look, E.CHART_DEFAULTS.look])}`);
chk(() => { const d = E.repairState({ data: E.fresh().data, ui: E.fresh().ui, chart: { look: 'glass' } }); const b = E.repairState({ data: E.fresh().data, ui: E.fresh().ui, chart: { look: 'frosted' } }); return d.chart.look === 'glass' && !('look' in b.chart); },
  () => 'O2. the repair keeps look "glass" and drops a value outside the choices');
chk(() => has('isGlass') && E.isGlass(LIGHT) && !E.isGlass(design('Corporate')), () => 'O3. isGlass(design) reads the choice');

// ---------- T: the theme ----------
const TL = get(() => E.buildTheme(LIGHT, 'en')), TD = get(() => E.buildTheme(DARK, 'ar'));
const GL = get(() => E.glassLook(LIGHT)), GD = get(() => E.glassLook(DARK));
chk(() => GL && GL.t >= 0 && GL.t <= 60 && GD && GD.t >= 0 && GD.t <= 60, () => `T0. glassLook gives the transparency it uses (0-60): ${cut([GL, GD])}`);
for (const [nm, th, d, g] of [['light', TL, LIGHT, GL], ['dark', TD, DARK, GD]]) {
  const bg = (vs(th, '*', 'background') || [])[0] || {};
  chk(() => bg.show === true && bg.color.solid.color === d.ui.card && bg.transparency === g.t, () => `T1-${nm}. every visual's background: the card colour at transparency ${g && g.t}: ${cut(bg)}`);
  const radius = E.toPage(+d.layout.radius, d.layout), wrong = E.VISUAL_TYPES.concat('*').filter((t) => { const b = (vs(th, t, 'border') || [])[0] || {};
    return !(b.show === true && b.width === 1 && b.color && b.color.solid.color === g.rim && (t === 'cardVisual' ? !('radius' in b) : b.radius === radius)); });
  chk(() => !wrong.length, () => `T2-${nm}. every visual type's border: show, width 1, the rim ${g && g.rim}, radius ${radius} (none on cardVisual): wrong on ${wrong.slice(0, 6).join(', ')}`);
  const sh = E.VISUAL_TYPES.concat('*').map((t) => ((vs(th, t, 'dropShadow') || [])[0] || {}));
  chk(() => sh.every((s) => s.show === true && s.color.solid.color === '#000000' && s.position === 'Outer' && s.preset === 'Bottom' && s.transparency === g.shadow.transparency && s.shadowBlur === g.shadow.blur && s.shadowDistance === g.shadow.distance && s.shadowSpread === 0),
    () => `T3-${nm}. every visual type's shadow (the design's shadow on): outer, bottom, black at ${g && cut(g.shadow)}: ${cut(sh[0])}`);
  // (GL2, the owner, 27 Oct: without back colours Power BI's default style filled the cells solid) the cells see-through:
  // every back colour the card's at alpha 00; in full: test-0.3.1-glass-tables.mjs
  chk(() => ['tableEx', 'pivotTable'].every((t) => { const v = (vs(th, t, 'values') || [])[0] || {}; return [v.backColorPrimary, v.backColorSecondary].every((f) => f && f.solid.color === d.ui.card + '00'); }), () => `T4-${nm}. tables keep their cells see-through (every back colour clear: the card at alpha 00)`);
}
chk(() => { const d = design('Corporate', 'glass', { shadow: false }), th = E.buildTheme(d, 'en'); return E.VISUAL_TYPES.every((t) => JSON.stringify(vs(th, t, 'dropShadow')) === '[{"show":false}]'); }, () => 'T5. the design\'s shadow off: no shadow on any visual');
chk(() => { const d = design('Corporate', 'glass', { transparent: true }), th = E.buildTheme(d, 'en'); return vs(th, '*', 'background')[0].show === true; }, () => 'T6. glass wins over transparent visuals: the cards keep their see-through colour');
chk(() => { const a = design('Corporate'), b = design('Corporate', 'auto'); delete a.chart; return JSON.stringify(E.buildTheme(a, 'en')) === JSON.stringify(E.buildTheme(b, 'en')) && !/"transparency":\s*[1-9]/.test(JSON.stringify(E.buildTheme(b, 'en'))); },
  () => 'T7. look "auto" writes nothing: the theme is byte for byte the one without a look');
chk(() => { const d = design('Corporate', 'glass', { page: '1280x720', radius: 16 }), th = E.buildTheme(d, 'en'); return vs(th, 'barChart', 'border')[0].radius === 16 && E.glassLook(d).shadow.blur < GL.shadow.blur; },
  () => 'T8. on 1280 x 720 the corners and the shadow are in that page\'s units');

// ---------- P: the picture ----------
const unpng = (b) => get(() => PNG.sync.read(Buffer.from(b)));
const p19 = get(() => E.glassPng(LIGHT, 1920, 1080)), p12 = get(() => E.glassPng(LIGHT, 1280, 720)), pd = get(() => E.glassPng(DARK, 1920, 1080));
chk(() => p19 instanceof Uint8Array && p19[0] === 0x89 && p19[1] === 0x50 && JSON.stringify(E.imageSize(p19)) === '{"w":1920,"h":1080}' && JSON.stringify(E.imageSize(p12)) === '{"w":1280,"h":720}',
  () => `P1. glassPng gives a PNG at the page's size (1920 x 1080 and 1280 x 720): ${cut(p19 && (p19.threw || E.imageSize(p19)))}`);
const back = unpng(p19), px = get(() => E.glassPixels(LIGHT, 1920, 1080));
chk(() => back.width === 1920 && back.height === 1080 && px.length === 1920 * 1080 * 3 && (() => { for (let i = 0, j = 0; i < px.length; i += 3, j += 4) if (back.data[j] !== px[i] || back.data[j + 1] !== px[i + 1] || back.data[j + 2] !== px[i + 2] || back.data[j + 3] !== 255) return false; return true; })(),
  () => `P2. the PNG reads back (pngjs) to exactly the engine's pixels, opaque: ${cut(back.threw || [back.width, back.height])}`);
chk(() => Buffer.from(E.glassPng(LIGHT, 1920, 1080)).equals(Buffer.from(p19)) && !Buffer.from(pd).equals(Buffer.from(p19)) && !Buffer.from(E.glassPng(design('Desert Gulf', 'glass'), 1920, 1080)).equals(Buffer.from(p19)),
  () => 'P3. the same theme gives the same bytes; another theme (dark, another palette) other bytes');
chk(() => p19.length < 300 * 1024 && p12.length < 200 * 1024 && pd.length < 300 * 1024, () => `P4. small: 1920 x 1080 under 300 KB, 1280 x 720 under 200 KB: ${p19.length}, ${p12.length}, ${pd.length} bytes`);
const meanLum = (b) => { const r = PNG.sync.read(Buffer.from(b)); let s = 0, n = 0; for (let i = 0; i < r.data.length; i += 4 * 97) { s += E.lum(E.rgbToHex([r.data[i], r.data[i + 1], r.data[i + 2]])); n++; } return s / n; };
chk(() => meanLum(p19) > 0.6 && meanLum(pd) < 0.15, () => `P5. a light design gives a light picture, a dark one a dark picture: ${cut([meanLum(p19), meanLum(pd)])}`);
chk(() => { const r = PNG.sync.read(Buffer.from(p19)); const c = (x, y) => E.rgbToHex([0, 1, 2].map((k) => r.data[(y * 1920 + x) * 4 + k])); const set = new Set(); for (let y = 0; y < 1080; y += 60) for (let x = 0; x < 1920; x += 60) set.add(c(x, y)); return set.size > 40; },
  () => 'P6. soft colour fields, not a flat page: many colours across the picture');
// the picture is soft: neighbouring pixels never differ by more than 2 levels (no edges, no text)
chk(() => { let worst = 0; for (let y = 0; y < 1080; y += 7) for (let x = 1; x < 1920; x++) { const i = (y * 1920 + x) * 3; for (let k = 0; k < 3; k++) worst = Math.max(worst, Math.abs(px[i + k] - px[i - 3 + k])); } return worst <= 2; },
  () => 'P7. soft: no edge anywhere (neighbouring pixels within 2 levels)');

// ---------- C: the contrast, worst case ----------
const blend = (card, p, t) => E.mix(p, card, 1 - t / 100);
const extremes = (pixels) => { let lo = null, hi = null, l0 = 2, l1 = -1; for (let i = 0; i < pixels.length; i += 3) { const h = E.rgbToHex([pixels[i], pixels[i + 1], pixels[i + 2]]), l = E.lum(h); if (l < l0) { l0 = l; lo = h; } if (l > l1) { l1 = l; hi = h; } } return [lo, hi]; };
const passAt = (d, t, ends) => { const u = d.ui, lb = E.glassLook(d).labels; return ends.every((p) => E.contrast(u.text, blend(u.card, p, t)) >= 4.5 && E.contrast(lb, blend(u.card, p, t)) >= 4.5 && E.contrast(d.data[0], blend(u.card, p, t)) >= 3 && E.contrast(u.text, p) >= 4.5); };
for (const preset of Object.keys(E.PRESETS)) {
  const d = design(preset, 'glass'), g = get(() => E.glassLook(d)), full = get(() => extremes(E.glassPixels(d, 1280, 720)));
  const solidOk = E.contrastChecks(design(preset)).checks.every((c) => c.pass);
  chk(() => g && Array.isArray(g.checks) && g.checks.length >= 4 && (solidOk ? g.checks.every((c) => c.pass) : true) && (!solidOk || passAt(d, g.t, full)),
    () => `C1-${preset}. the worst case over the full picture passes at the transparency used (${g && g.t}%): ${cut(g && (g.threw || g.checks))}`);
  chk(() => g.t === g.asked || !passAt(d, g.t + 1, [g.image.darkest, g.image.lightest]), () => `C2-${preset}. the transparency is lowered only as far as the contrast needs: ${cut([g.asked, g.t])}`);
}
chk(() => { const g = E.glassLook(LIGHT, { t: 50 }), g2 = E.glassLook(LIGHT, { t: 20 }); return g.asked === 50 && g.t <= 50 && g2.t === 20; }, () => 'C3. a lab variant asks for its own transparency (20/50), kept when it passes');
// a pale card (a design that only just passes) gets less transparency than the default
// a grey text that only just passes on the white card (4.6:1) makes the cards less see-through, and the picture plain
// where even the page colour leaves the page's text under 4.5:1 (the design's own check fails: said, never hidden)
const C4 = (() => { const d = design('Corporate', 'glass'); d.ui.text = '#757575'; return get(() => E.glassLook(d)); })();
chk(() => C4.t < C4.asked && C4.strength === 0 && C4.checks.filter((c) => c.id !== 'textOnPicture').every((c) => c.pass) && !C4.checks.find((c) => c.id === 'textOnPicture').pass,
  () => `C4. a grey text that only just passes: the cards less see-through, the picture plain, the page's own failing check said: ${cut(C4)}`);
chk(() => { const c = E.contrastChecks(LIGHT); return ['textOnGlass', 'labelsOnGlass', 'color1OnGlass', 'textOnPicture'].every((id) => c.checks.some((x) => x.id === id)) && !E.contrastChecks(design('Corporate')).checks.some((x) => /Glass|Picture/.test(x.id)); },
  () => 'C5. the readability check lists the worst cases with the look, and nothing new without it');

// ---------- W and G: through the tools ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-gl1-')));
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
try {
  const gt = await s.call('generate_theme', { chart: { look: 'glass' }, lang: 'en' });
  const gj = gt.j || {};
  chk(() => !gt.err && gj.design && gj.design.chart.look === 'glass' && gj.glass && gj.glass.transparency >= 0 && gj.glass.checks && /no blur/i.test(gj.glass.sayInPlan) && !/\b(first|only|official|free)\b/i.test(gj.glass.sayInPlan),
    () => `G1. generate_theme takes chart.look "glass" and says the truth (no blur; the numbers), never "first", "only", "official" or "free": ${cut(gt.err ? gt.t : gj.glass)}`);
  const darkT = await s.call('generate_theme', { chart: { look: 'glass' }, mode: 'dark', lang: 'ar' });
  for (const [nm, lang, d] of [['EN light', 'en', gj.design], ['AR dark', 'ar', (darkT.j || {}).design]]) {
    const args = { path: 'shop/Shop.SemanticModel', lang, layout: 'exec', filters: 'top', secondPage: true, name: 'Glass ' + nm };
    const pl = await s.call('plan_layout', Object.assign({ design: d, planFields: FIELDS }, args)), id = pl.j && pl.j.plan && pl.j.plan.planId;
    chk(() => !!id, () => `W0-${nm}. plan_layout makes a plan for the glass design: ${pl.t.slice(0, 300)}`);
    if (!id) continue;
    const n = links().length; await s.call('approve_plan', { planId: id });
    for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
    await req(links()[n], 'decision=approve'); await s.call('approve_plan', { planId: id });
    const r = await s.call('create_report', Object.assign({ planId: id, design: pl.j.design, fields: FIELDS }, args));
    chk(() => !r.err, () => `W1-${nm}. create_report writes the glass report: ${r.t.slice(0, 300)}`);
    if (r.err) continue;
    const RD = path.join(ROOT, 'shop', 'Glass ' + nm + '.Report'), P = path.join(RD, 'definition/pages'), RES = path.join(RD, 'StaticResources/RegisteredResources');
    const pages = rd(path.join(P, 'pages.json')).pageOrder.map((pid) => rd(path.join(P, pid, 'page.json'))).filter((p) => p.type !== 'Tooltip');
    const imgOf = (p) => { const im = p.objects && p.objects.background && p.objects.background[0].properties.image; return im && im.image && JSON.parse(JSON.stringify(im.image.name.expr.Literal.Value)).replace(/^'|'$/g, ''); };
    chk(() => pages.length === 2 && pages.every((p) => { const f = path.join(RES, imgOf(p)); return fs.existsSync(f) && Buffer.from(fs.readFileSync(f)).equals(Buffer.from(E.glassPng(pl.j.design, p.width, p.height))); }),
      () => `W2-${nm}. every report page's background in StaticResources is the engine's picture for its size: ${cut(pages.map((p) => [p.width, p.height, imgOf(p)]))}`);
    const theme = fs.readdirSync(RES).filter((f) => /\.json$/.test(f)).map((f) => rd(path.join(RES, f)))[0];
    chk(() => theme && vs(theme, '*', 'background')[0].transparency === E.glassLook(pl.j.design).t && vs(theme, 'barChart', 'border')[0].width === 1, () => `W3-${nm}. the report's theme is the glass one: ${cut(theme && vs(theme, '*', 'background'))}`);
    const c = await s.call('check_report', { path: r.j.open }), cj = c.j || {};
    chk(() => !c.err && cj.validator && cj.validator.ran && cj.validator.errors === 0 && cj.impact.kinds.canBreak.count === 0,
      () => `W4-${nm}. Microsoft's validator 0 errors and check_report 0 "can break": ${cut(c.err ? c.t : { v: cj.validator, k: cj.impact && cj.impact.kinds, f: (cj.findings || []).filter((f) => f.impact === 'canBreak' || f.severity === 'error').slice(0, 4) })}`);
  }
  // a report without the look keeps the blank pixel (the page colour shows)
  const plain = await s.call('generate_theme', { lang: 'en' });
  chk(() => !plain.err && !(plain.j || {}).glass, () => 'G2. without the look generate_theme says nothing of glass');
} finally {
  await s.close();
  try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* the OS cleans its temp folder */ }
}
if (problems.length) { console.log(`FAIL script=test-0.3.1-glass.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  glass  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  glass  ${checks} checks`);
process.exit(0);
