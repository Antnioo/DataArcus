import './test-env.mjs';
// 0.3.2 SP6 (the split: B-280, B-286; mcp/work/SP6.md). A characterisation suite: the design engine's colours and glass
// look give, for 10 made-up designs, exactly what they gave on the base (integration/0.3.2 at 04a9922, before the colour
// math moved to assets/js/design-colours.js and the glass look to assets/js/design-glass.js). Recorded on the base in
// fixtures/sp6-design.json (sha256 and length of each result); SP6_RECORD=1 records them again (only on the base, never
// to make a run pass). The Node zlib PNG is not recorded (zlib's bytes are per Node version): B1 compares it, and the
// theme with its glass picture, with the base engine itself (its files saved in mcp/fixtures/hk1/sp6, 04a9922's bytes) in the same process.
//   D1-D10  a design's theme JSON, glass look and fit, glass PNG (JavaScript deflate) and pixels, slots, background SVG
//   C1      the colour functions on made-up inputs;  B1  the base engine, live;  F1  the facade (after the move)
//   node test-0.3.2-sp6.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 24) + ':' + b.length;
const js = (x) => sha(Buffer.from(JSON.stringify(x), 'utf8'));
const bytes = (u8) => sha(Buffer.from(u8));
const GOLD = path.join(HERE, 'fixtures', 'sp6-design.json');
const E = require('../assets/js/design-engine.js');

// the designs (made up): glass on and off, three palettes, EN and AR, three page sizes, tables banded or not
const design = (preset, chart, layout) => { const d = E.fresh(); d.preset = preset; d.data = E.PRESETS[preset].data.slice(); d.ui = Object.assign({}, E.PRESETS[preset].ui); d.chart = chart; d.name = 'SP6 ' + preset; E.repairState(d); Object.assign(d.layout, layout); return d; };
const DESIGNS = [
  ['D1 DataArcus glass EN 1920', () => design('DataArcus', { look: 'glass' }, { page: '1920x1080' }), 'en'],
  ['D2 DataArcus plain AR 1280', () => design('DataArcus', { look: 'auto' }, { page: '1280x720', preset: 'analysis', filters: true }), 'ar'],
  ['D3 Corporate glass AR 1920 banded', () => design('Corporate', { look: 'glass', table: 'banded' }, { page: '1920x1080', preset: 'ops', kpis: 6 }), 'ar'],
  ['D4 Corporate plain EN 960', () => design('Corporate', { table: 'minimal', grid: 'dotted' }, { page: '960x720', preset: 'focus', shadow: false }), 'en'],
  ['D5 Midnight glass EN 1280', () => design('Midnight', { look: 'glass', legend: 'Bottom' }, { page: '1280x720', radius: 16 }), 'en'],
  ['D6 Midnight glass AR 1920 rtl', () => design('Midnight', { look: 'glass', labels: 'on' }, { page: '1920x1080', dir: 'rtl', preset: 'analysis', filters: true, fpos: 'top' }), 'ar'],
  ['D7 Desert Gulf plain AR 1920', () => design('Desert Gulf', { look: 'auto', table: 'banded' }, { page: '1920x1080', kpiBar: 'top', headLine: 'full' }), 'ar'],
  ['D8 Desert Gulf glass EN custom', () => design('Desert Gulf', { look: 'glass' }, { page: 'custom', pageW: 1600, pageH: 900, transparent: true }), 'en'],
  ['D9 Colorblind glass EN 960 no shadow', () => design('Colorblind safe', { look: 'glass', table: 'banded' }, { page: '960x720', shadow: false, kpis: 2 }), 'en'],
  ['D10 a broken saved design, glass AR', () => { const d = E.repairState({ data: ['#zz', '#123', 'red', '#00ff00', '#abc', '#ffffff', '#000000', '#808080'], ui: { background: 'nope', card: '#fafafa', text: '#111' }, chart: { look: 'glass' }, layout: { page: '1280x720' } }); return d; }, 'ar']
];
const designFacts = (d, lang) => {
  const th = E.buildTheme(d, lang), slots = E.computeSlots(d.layout, lang), p = E.page(d.layout), g = E.glassLook(d);
  const small = [Math.max(1, Math.round(p.w / 8)), Math.max(1, Math.round(p.h / 8))];
  return {
    theme: js(th), look: js(g), lookT20: js(E.glassLook(d, { t: 20 })), fit: js(E.glassFit(d)), isGlass: E.isGlass(d),
    pixels: bytes(E.glassPixels(d, small[0], small[1])),
    // the JavaScript deflate (the browser's), byte for byte; the mark the twin reads
    pngJs: bytes(E.encodePng(small[0], small[1], E.glassPixels(d, small[0], small[1]), E.GLASS_MARK, { deflate: 'js' })),
    pngPixelsPage: bytes(E.glassPixels(d, p.w, p.h)), isGlassPng: E.isGlassPng(E.glassPng(d, small[0], small[1])),
    tables: js(E.glassTables(g.table)), slots: js(slots), project: js(E.projectSlots(d.layout, lang)), page: js(p), pngSize: js(E.pngSize(d.layout)),
    svg: js(E.bgSvg(d, slots, { glass: E.isGlass(d) ? { url: 'data:image/png;base64,AAAA', t: g.t, rim: g.rim } : null }, lang)),
    checks: js(E.contrastChecks(d)), icons: js(E.statusIcons(d.ui)), colours: js(E.colours(d)), roles: js(E.roles(d.ui))
  };
};
// the colour functions on made-up inputs: a logo of three colours on white with a soft edge, a grey logo, palettes
const logoPixels = (cols) => { const px = []; cols.forEach(([hex, n]) => { const [r, g, b] = E.hexToRgb(hex); for (let i = 0; i < n; i++) px.push(r, g, b, 255); }); for (let i = 0; i < 40; i++) px.push(0, 0, 0, 0); return px; };
const colourFacts = () => {
  const hexes = ['#00d4ff', '#1f4e79', '#c8963e', '#e63946', '#777777', '#ffd166', '#0b0d17', '#fafafa'];
  const logo = logoPixels([['#e63946', 900], ['#1d3557', 600], ['#a8dadc', 300], ['#ffffff', 2000], ['#f19aa2', 40]]), grey = logoPixels([['#333333', 500], ['#ffffff', 500]]);
  return {
    clamp: js(['#ABC', ' 1a2b3c ', 'nope', '', null, '#1234567'].map((v) => E.clampHex(v))),
    math: js(hexes.map((h) => [E.hexToRgb(h), E.lum(h), E.hexToHsl(h), E.hslToHex(...E.hexToHsl(h)), E.contrast(h, '#ffffff'), E.mix(h, '#000000', 0.3), E.rgbToLab(E.hexToRgb(h)), E.hexToLab(h), E.statusHue(h)])),
    contrastTo: js(hexes.map((h) => [E.toContrast(h, '#ffffff', 3), E.toContrast(h, '#0a0f1c', 4.5), E.fadeEnds(h, '#ffffff'), E.fadeEnds(h, '#1a1f2e')])),
    second: js(Object.values(E.PRESETS).map((p) => E.secondColour(p.data, p.ui.card, p.ui))),
    generate: js(hexes.flatMap((h) => ['analogous', 'complementary', 'triadic', 'mono'].map((m) => E.generate(h, m)))),
    calm: js(hexes.map((h) => E.calmPalette(h, '#ffffff', '#1f2933')).concat(hexes.map((h) => E.calmPalette(h, '#15182a', '#e8eaf6')))),
    deltaE: js(hexes.map((a, i) => E.deltaE(E.hexToLab(a), E.hexToLab(hexes[(i + 3) % hexes.length])))),
    cvd: js(hexes.flatMap((h) => ['protan', 'deutan', 'normal'].map((k) => E.simulateCvd(h, k)))),
    logo: js(E.logoColours(logo)), logoGrey: js(E.logoColours(grey)), logoNone: js(E.logoColours([])),
    logoTheme: js([E.logoTheme(['#e63946', '#1d3557', '#a8dadc'], { harmony: 'triadic' }), E.logoTheme([{ hex: '#c8963e' }], { ui: E.PRESETS.Midnight.ui }), E.logoTheme([], {}), E.logoTheme(['#333333'], { harmony: 'mono', ui: { card: 'bad' } })]),
    calmList: js(E.CALM)
  };
};

const got = {};
for (const [name, make, lang] of DESIGNS) got[name] = designFacts(make(), lang);
got.C1 = colourFacts();

if (process.env.SP6_RECORD === '1') { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); console.log('recorded ' + path.relative(REPO, GOLD)); }
const gold = fs.existsSync(GOLD) ? JSON.parse(fs.readFileSync(GOLD, 'utf8')) : {};
const diff = (a, b) => Object.keys(Object.assign({}, a, b)).filter((k) => JSON.stringify((a || {})[k]) !== JSON.stringify((b || {})[k]));

// ---------- D1-D10, C1: byte for byte the base's ----------
for (const [name] of DESIGNS) chk(() => gold[name] && !diff(got[name], gold[name]).length, () => `${name}: differs from the base in ${gold[name] ? diff(got[name], gold[name]).join(', ') : '(not recorded)'}`);
chk(() => gold.C1 && !diff(got.C1, gold.C1).length, () => `C1 the colour functions: differ from the base in ${gold.C1 ? diff(got.C1, gold.C1).join(', ') : '(not recorded)'}`);

// ---------- B1: the base engine itself, live (the zlib PNG, the theme with its glass picture) ----------
{
  const BASE = '04a9922'; // (HK1, 0.3.3) the saved copies in mcp/fixtures/hk1/sp6, not git reads
  let B = null, why = '';
  try {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp6-base-'));
    for (const f of ['design-engine.js', 'text-measure.js']) fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(HERE, 'fixtures', 'hk1', 'sp6', 'assets', 'js', f)));
    B = require(path.join(dir, 'design-engine.js'));
  } catch (e) { why = String(e && e.message || e).slice(0, 200); }
  const differ = [];
  if (B) for (const [name, make, lang] of DESIGNS) {
    const d = make(), p = E.page(d.layout), th = E.buildTheme(d, lang);
    if (bytes(E.glassPng(d, p.w, p.h)) !== bytes(B.glassPng(make(), p.w, p.h))) differ.push(name + ' glassPng');
    if (js(E.withGlassPicture(th, d)) !== js(B.withGlassPicture(B.buildTheme(make(), lang), make()))) differ.push(name + ' withGlassPicture');
    // (0.3.3 FB1) pageFill was added on purpose after the base (how well a page is filled, mcp/work/FB1.md; sp29 K2 pins it)
    if (js(Object.keys(E).filter((k) => k !== 'pageFill').sort()) !== js(Object.keys(B).sort())) differ.push('the facade\'s names');
  }
  chk(() => B && !differ.length, () => `B1 the base engine (${BASE}), live: ${B ? 'differs: ' + [...new Set(differ)].slice(0, 6).join('; ') : 'not loaded: ' + why}`);
}

// ---------- F1 (after the move): the facade keeps every name; the moved ones are the modules' own ----------
if (fs.existsSync(path.join(REPO, 'assets/js/design-colours.js'))) {
  const C = require('../assets/js/design-colours.js'), G = require('../assets/js/design-glass.js');
  const COLOUR = ['clampHex', 'hexToRgb', 'rgbToHex', 'mix', 'lum', 'contrast', 'hexToHsl', 'hslToHex', 'toContrast', 'secondColour', 'statusHue', 'fadeEnds', 'generate', 'calmPalette', 'CALM', 'rgbToLab', 'hexToLab', 'deltaE', 'simulateCvd', 'logoColours'];
  const GLASSY = ['GLASS', 'GLASS_MARK', 'isGlassPng', 'isGlass', 'glassTables'];
  const de = fs.readFileSync(path.join(REPO, 'assets/js/design-engine.js'), 'utf8');
  const wrong = COLOUR.filter((k) => E[k] !== C[k]).concat(GLASSY.filter((k) => E[k] !== G[k]));
  chk(() => !wrong.length && typeof G.make === 'function' && !/const glassRgb = |const deltaE = |const logoColours = /.test(de),
    () => `F1 the facade: ${wrong.length ? 'not the modules\' own: ' + wrong.join(', ') : 'a moved function is still written in design-engine.js'}`);
}

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp6.mjs cause=${problems.length} of ${checks} checks`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp6  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp6  ${checks} checks`);
