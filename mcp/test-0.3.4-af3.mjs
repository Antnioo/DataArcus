// AF3 (0.3.4; the night audit of 18-19 Nov, D-1112-03): three website findings, each red first on the base.
//   G1-G8  AUD-081 (I-1119-04): a brand colour with no hue (black, white, a grey) gives no red-led palette. Its HSL hue
//          is 0 (red) and generate() lifted the saturation to 0.45: now a colour with no hue (the logo path's own grey
//          rule, Lab chroma under 8: design-colours.js noHue) keeps its grey as the lead and takes the calm colours;
//          mono gives the grey's own shades; a colour with a hue is unchanged (the base's answers, written below);
//          G9 generate_theme's note names the calm set for a grey brand
// Made-up colours only.   node test-0.3.4-af3.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const read = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const problems = []; let checks = 0;
const chk = (id, cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) problems.push(`${id}: ${msg}${err}`); };

// ---------- AUD-081: a brand colour with no hue ----------
const C = require('../assets/js/design-colours.js'), E = require('../assets/js/design-engine.js');
const HARMONIES = ['analogous', 'complementary', 'triadic', 'mono'], GREYS = ['#000000', '#ffffff', '#808080', '#1e1e1e', '#0a0a0c'];
const chroma = (c) => Math.hypot(...C.hexToLab(c).slice(1));
const reddish = (c) => { const [h, s] = C.hexToHsl(c); return s >= 0.15 && (h < 15 || h >= 345); };
chk('G1', () => typeof C.noHue === 'function' && E.noHue === C.noHue, 'design-colours.js exports noHue and design-engine.js re-exports the same function');
chk('G2', () => GREYS.every((g) => C.noHue(g)) && ['#0084ff', '#6b7280', '#2b2d42', '#b5452f'].every((c) => !C.noHue(c)), 'noHue: a grey (Lab chroma under 8) has no hue; #6b7280 (chroma 8.6) and the brand colours do');
for (const g of GREYS) for (const h of HARMONIES) {
  const p = C.generate(g, h);
  chk('G3', () => p.length === 8 && C.noHue(p[0]) && !reddish(p[0]) && !reddish(p[1]), `${g} ${h}: the lead has no hue and neither the lead nor the second is a red (got ${p.join(' ')})`);
}
for (const g of GREYS) for (const h of ['analogous', 'complementary', 'triadic']) {
  const p = C.generate(g, h);
  chk('G4', () => JSON.stringify(p.slice(1)) === JSON.stringify(C.CALM.slice(0, 7)), `${g} ${h}: after the grey lead, the first 7 calm colours (got ${p.join(' ')})`);
}
for (const g of GREYS) { const p = C.generate(g, 'mono'); chk('G5', () => p.every((c) => chroma(c) < 8), `${g} mono: 8 greys (got ${p.join(' ')})`); }
// a colour with a hue: the base's answers (ed5f69de), unchanged
const BASE = {
  '#0084ff': { analogous: '#0084ff #1a1eff #1afffb #9b3dff #33ff95 #66b5ff #0003c2 #00c2be', complementary: '#0084ff #ff7b00 #5cb0ff #ffab5c #005fb8 #b85900 #3337ff #fffb33', triadic: '#0084ff #ff0084 #84ff00 #5cb0ff #ff5cb0 #b0ff5c #881aff #ff881a', mono: '#004f99 #006acc #0084ff #339dff #5cb0ff #85c4ff #a3d3ff #b3daff' },
  '#6b7280': { analogous: '#4164aa #5d4aba #4aa8ba #a464c4 #5dc1a0 #829ccf #3d307e #30717e', complementary: '#4164aa #aa8741 #7a96cd #cdb17a #2d4677 #775e2d #6d5dc1 #b1c15d', triadic: '#4164aa #aa4164 #64aa41 #7a96cd #cd7a96 #96cd7a #954aba #ba954a', mono: '#253960 #334e85 #4164aa #5d7ec1 #7a96cd #98add8 #aebfe0 #c4d0e9' } };
for (const [c, by] of Object.entries(BASE)) for (const h of HARMONIES) chk('G6', () => C.generate(c, h).join(' ') === by[h], `${c} ${h}: unchanged from the base (got ${C.generate(c, h).join(' ')})`);
// the logo path builds on generate(): a black logo took #b54545 and #c76b6b from it on the base
chk('G7', () => { const t = E.logoTheme(['#1e1e1e'], {}); return t.data.slice(1).every((c) => !reddish(c) || C.CALM.includes(c)); }, `a black logo: no red from the harmony (got ${E.logoTheme(['#1e1e1e'], {}).data.join(' ')})`);
// the page says so after Generate, as the logo path does (theme-layout-ui.js: the Generate button)
chk('G8', () => /E\.noHue\(b\)/.test(read('assets/js/theme-layout-ui.js')) && /n\.id = 'genNote'/.test(read('assets/js/theme-layout-ui.js')), 'the Generate button says when the brand has no hue (theme-layout-ui.js reads the engine\'s noHue into #genNote; the page check: scripts/tests/theme-generator.mjs)');

// the MCP's generate_theme says where the 7 colours come from: a grey brand with a harmony takes the calm set, said so
const D = await import('./lib/design.mjs');
const said = (b, h) => D.themeDesign({ brand: b, harmony: h }).notes.join(' ');
chk('G9', () => /the calm set/.test(said('#000000', 'analogous')) && !/the analogous harmony/.test(said('#000000', 'analogous')) && /the mono harmony/.test(said('#808080', 'mono')) && /the triadic harmony/.test(said('#0084ff', 'triadic')), `generate_theme's note for a grey brand: "${said('#000000', 'analogous')}"`);

if (problems.length) { console.log(`FAIL script=test-0.3.4-af3.mjs cause=${problems[0].slice(0, 300)}`); for (const p of problems) console.log('  - ' + p); console.log(`FAIL  af3  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  af3  ${checks} checks`);
