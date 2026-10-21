// Theme from a logo (0.3.0 step 6, owner's go 18 Oct): the visitor drops a logo on the Theme Generator; the brand
// colours are read from its pixels in the browser (never uploaded or saved), then a palette is built from them with the
// generator's own engine (generate(), as "Generate" from one brand colour), each colour checked for contrast on the
// visuals' background and ordered for colour-blind readers.
//   in Node: the colour science (CIEDE2000 against Sharma's published pairs, the colour-blind simulation), the brand
//   colours of tiny synthetic logos (pixels written here, edges blended as a canvas draws them), the palette's checks;
//   in the browser: real files (a 2-colour SVG, a PNG with a transparent background, a logo on a near-white page, a JPG)
//   dropped on both generator pages, English and Arabic: the swatches, the palette, the contrast table, the colour-blind
//   line, the honest line when a logo colour was adjusted, RTL, and no network request and nothing saved.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, visitor, WAIT } from './lib.mjs';
const { PNG } = createRequire(import.meta.url)('pngjs');

const load = (file) => { const m = { exports: {} }; new Function('module', 'exports', 'self', fs.readFileSync(path.join(ROOT, 'assets/js', file), 'utf8'))(m, m.exports, undefined); return m.exports; };

// ---- tiny synthetic logos, as RGBA pixels ----
// a w x h canvas; shapes painted with a 1-pixel blended edge (what a canvas gives when it scales a logo down)
function canvas(w, h, bg) { const px = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < w * h; i++) px.set(bg, i * 4); return { w, h, px }; }
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
function paint(c, inside, hex) {
  const col = rgb(hex);
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    // coverage from 4 x 4 samples in the pixel: the blended edge
    let n = 0; for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) n += inside(x + (sx + 0.5) / 4, y + (sy + 0.5) / 4) ? 1 : 0;
    if (!n) continue;
    const a = n / 16, i = (y * c.w + x) * 4, dst = c.px.slice(i, i + 4), da = dst[3] / 255, oa = a + da * (1 - a);
    // "source over", unpremultiplied as getImageData returns it
    for (let k = 0; k < 3; k++) c.px[i + k] = Math.round((col[k] * a + dst[k] * da * (1 - a)) / oa);
    c.px[i + 3] = Math.round(oa * 255);
  }
  return c;
}
const circle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const ring = (cx, cy, r0, r1) => (x, y) => { const d = (x - cx) ** 2 + (y - cy) ** 2; return d <= r1 * r1 && d >= r0 * r0; };

// the logos and the brand colours each must give (written before the code)
const LOGOS = {
  // two colours on a transparent background: a navy bar and an orange disc
  twoColour: () => paint(paint(canvas(96, 48, [0, 0, 0, 0]), rect(4, 8, 54, 40), '#1b3a6b'), circle(74, 24, 16), '#f28c28'),
  // one colour on a transparent background, a thin ring (many blended edge pixels)
  transparentPng: () => paint(canvas(64, 64, [0, 0, 0, 0]), ring(32, 32, 18, 26), '#00897b'),
  // a logo on a near-white page with a light grey frame: the page and the frame are background, purple is the brand
  nearWhite: () => paint(paint(paint(canvas(80, 40, [250, 250, 247, 255]), rect(0, 0, 80, 3), '#f2f2f2'), rect(10, 10, 30, 30), '#6a1b9a'), circle(56, 20, 11), '#6a1b9a'),
  // a pale yellow brand (light, but a colour): kept, and too light on a white visual: adjusted in the palette
  paleYellow: () => paint(paint(canvas(64, 32, [255, 255, 255, 255]), rect(4, 4, 40, 28), '#ffd84a'), circle(52, 16, 8), '#1b3a6b'),
  // black only, on a transparent background: no hue; the logo's dark colour is the brand (mono)
  blackOnly: () => paint(canvas(48, 48, [0, 0, 0, 0]), rect(8, 8, 40, 40), '#111111'),
};
const WANT = {
  twoColour: ['#1b3a6b', '#f28c28'],
  transparentPng: ['#00897b'],
  nearWhite: ['#6a1b9a'],
  paleYellow: ['#ffd84a', '#1b3a6b'],
  blackOnly: ['#111111'],
};
const TOL = 3;   // CIEDE2000: under 3 is the same colour to most eyes

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  let E;
  try { E = load('design-engine.min.js'); } catch (e) { return { checks: 1, problems: ['assets/js/design-engine.min.js: ' + e.message] }; }
  for (const f of ['rgbToLab', 'deltaE', 'simulateCvd', 'logoColours', 'logoTheme']) check(typeof E[f] === 'function', `the engine has no ${f}()`);
  check(Array.isArray(E.CALM), 'the engine must export its CALM colours');
  if (problems.length) return { checks, problems };
  const dE = (a, b) => E.deltaE(E.rgbToLab(rgb(a)), E.rgbToLab(rgb(b)));

  // ---- 1. colour science ----
  // CIEDE2000: Sharma, Wu, Dalal (2005), test data pairs 1, 7, 13, 17, 25, 34
  const SHARMA = [[[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425], [[50, 0, 0], [50, -1, 2], 2.3669], [[50, 2.49, -0.001], [50, -2.49, 0.0011], 7.2195],
    [[50, 2.5, 0], [73, 25, -18], 27.1492], [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644], [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082]];
  SHARMA.forEach(([a, b, want], i) => check(Math.abs(E.deltaE(a, b) - want) < 1e-3 && Math.abs(E.deltaE(b, a) - want) < 1e-3, `CIEDE2000 pair ${i + 1}: ${E.deltaE(a, b).toFixed(4)}, Sharma's table says ${want}`));
  // Lab of white and black (D65)
  const w = E.rgbToLab([255, 255, 255]), k = E.rgbToLab([0, 0, 0]);
  check(Math.abs(w[0] - 100) < 0.01 && Math.abs(w[1]) < 0.01 && Math.abs(w[2]) < 0.01 && Math.abs(k[0]) < 0.01, `Lab of white ${w}, of black ${k}`);
  // colour-blind simulation (Machado, Oliveira, Fernandes 2009, severity 1, in linear RGB): greys stay grey, a red and a
  // green that differ a lot for normal vision come close for deuteranopia and protanopia; blue/orange stays apart
  check(['#000000', '#808080', '#ffffff'].every((g) => ['deutan', 'protan'].every((t) => dE(E.simulateCvd(g, t), g) < 1.5)), 'colour-blind simulation: a grey does not stay grey');
  check(E.simulateCvd('#d62728', 'normal') === '#d62728', 'colour-blind simulation: normal vision changes the colour');
  const sim = (a, b, t) => dE(E.simulateCvd(a, t), E.simulateCvd(b, t));
  check(dE('#d62728', '#2ca02c') > 60 && sim('#d62728', '#2ca02c', 'deutan') < 25 && sim('#d62728', '#2ca02c', 'protan') < 30,
    `red/green: normal ${dE('#d62728', '#2ca02c').toFixed(1)}, deuteranopia ${sim('#d62728', '#2ca02c', 'deutan').toFixed(1)}, protanopia ${sim('#d62728', '#2ca02c', 'protan').toFixed(1)}: they must come close`);
  check(sim('#1f77b4', '#ff7f0e', 'deutan') > 40 && sim('#1f77b4', '#ff7f0e', 'protan') > 40, 'blue/orange must stay apart for deuteranopia and protanopia');

  // ---- 2. brand colours from the synthetic logos ----
  for (const [name, make] of Object.entries(LOGOS)) {
    const c = make(), res = E.logoColours(c.px), got = (res && res.colours || []).map((x) => x.hex);
    const want = WANT[name];
    check(got.length === want.length, `${name}: ${got.length} brand colours (${got.join(' ')}), expected ${want.length} (${want.join(' ')})`);
    want.forEach((h, i) => check(got[i] && dE(got[i], h) < TOL, `${name}: colour ${i + 1} is ${got[i]}, expected ${h} (CIEDE2000 ${got[i] ? dE(got[i], h).toFixed(1) : '-'} >= ${TOL})`));
    check(res && Math.abs(res.colours.reduce((a, x) => a + x.share, 0) - 1) < 0.02, `${name}: the shares must add up to 1`);
    if (name === 'transparentPng') check(res.skipped.transparent > 0.5 * c.w * c.h, `${name}: the transparent background must be skipped (${res.skipped.transparent})`);
    if (name === 'nearWhite') check(res.skipped.light > 0.5 * c.w * c.h, `${name}: the near-white page and frame must be skipped (${res.skipped.light})`);
    if (name === 'blackOnly') check(res.mono === true, `${name}: a logo with no hue must say mono`);
    else check(!res.mono, `${name}: a logo with colours is not mono`);
  }
  // an empty or fully transparent image: no colours, no crash
  check(E.logoColours(new Uint8ClampedArray(0)).colours.length === 0 && E.logoColours(canvas(8, 8, [0, 0, 0, 0]).px).colours.length === 0, 'an empty logo must give no colours');
  // a photo-like JPG: noise of +-6 on each channel around two colours keeps the two
  {
    const c = paint(paint(canvas(80, 40, [255, 255, 255, 255]), rect(4, 4, 38, 36), '#c8102e'), rect(42, 4, 76, 36), '#00205b');
    let s = 7; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let i = 0; i < c.px.length; i += 4) for (let j = 0; j < 3; j++) c.px[i + j] = Math.max(0, Math.min(255, c.px[i + j] + Math.round((rnd() - 0.5) * 12)));
    const got = E.logoColours(c.px).colours.map((x) => x.hex);
    check(got.length === 2 && dE(got[0], '#c8102e') < 4 && dE(got[1], '#00205b') < 4, `noisy 2-colour logo: ${got.join(' ')}, expected #c8102e #00205b`);
  }

  // ---- 3. the palette: the generator's engine, contrast, colour-blind order ----
  const LIGHT = E.PRESETS.Corporate.ui, DARK = E.PRESETS.DataArcus.ui;
  for (const [name, ui] of [['light', LIGHT], ['dark', DARK]]) for (const logo of Object.keys(WANT)) for (const harmony of ['analogous', 'complementary', 'triadic', 'mono']) {
    const t = E.logoTheme(WANT[logo], { ui, harmony }), id = `${logo} on ${name}, ${harmony}`;
    check(t && t.data.length === 8 && new Set(t.data).size === 8 && t.data.every((c) => /^#[0-9a-f]{6}$/.test(c)), `${id}: 8 different hex colours expected, got ${t && t.data}`);
    if (!t) continue;
    // every data colour stands 3:1 on the visuals' background (WCAG 1.4.11: bars, lines, large shapes)
    const low = t.data.filter((c) => E.contrast(c, ui.card) < 3);
    check(!low.length, `${id}: ${low.join(', ')} under 3:1 on the visual background ${ui.card}`);
    // the table: one row per data colour, the ratios the engine's contrast gives
    check(t.table.length === 8 && t.table.every((r, i) => r.hex === t.data[i] && Math.abs(r.onCard - E.contrast(r.hex, ui.card)) < 0.01 && r.shapes === (r.onCard >= 3) && r.text === (r.onCard >= 4.5)
      && Math.abs(r.onPage - E.contrast(r.hex, ui.background)) < 0.01), `${id}: the contrast table does not match the palette`);
    // the logo's colours: the lead is colour 1, each logo colour is in the palette, as it is or adjusted (and then said)
    const own = WANT[logo].map((h) => h.toLowerCase());
    own.forEach((h, i) => {
      const adj = t.adjusted.find((a) => a.from === h);
      const ok = E.contrast(h, ui.card) >= 3 ? t.data.includes(h) && !adj : !!adj && adj.logo && t.data.includes(adj.to) && adj.after >= 3 && adj.before < 3;
      check(ok, `${id}: logo colour ${h} (${E.contrast(h, ui.card).toFixed(2)}:1) is not in the palette as it is, or adjusted and said (${JSON.stringify(adj)})`);
      if (i === 0) check(t.data[0] === (adj ? adj.to : h) && t.accent === t.data[0], `${id}: colour 1 must be the logo's lead colour ${h}, got ${t.data[0]}`);
    });
    // the rest comes from generate() (the generator's "Generate"), or from CALM when the harmony gives too few distinct
    // colours; any of them may be adjusted to 3:1 (then its "from" is the engine's colour)
    const gen = own.concat(E.generate(own[0], harmony), E.CALM);
    const stray = t.data.filter((c) => !gen.includes(c) && !t.adjusted.some((a) => a.to === c && gen.includes(a.from)));
    check(!stray.length, `${id}: colours not from the logo, generate() or CALM: ${stray.join(', ')}`);
    // colour-blind: the minimum CIEDE2000 between neighbours, for each vision, is what the palette gives; the order is
    // never worse than the palette's order before it (the logo first, then generate()'s order)
    const minOf = (list, v) => Math.min(...list.slice(1).map((c, i) => E.deltaE(E.rgbToLab(rgb(E.simulateCvd(list[i], v))), E.rgbToLab(rgb(E.simulateCvd(c, v))))));
    for (const v of ['normal', 'deutan', 'protan']) check(Math.abs(t.cvd[v] - minOf(t.data, v)) < 0.05, `${id}: cvd.${v} ${t.cvd[v]} but the palette's neighbours give ${minOf(t.data, v).toFixed(2)}`);
    check(Math.abs(t.cvd.min - Math.min(t.cvd.normal, t.cvd.deutan, t.cvd.protan)) < 1e-9, `${id}: cvd.min is not the smallest`);
    const before = Math.min(...['normal', 'deutan', 'protan'].map((v) => minOf(t.before, v)));
    check(t.before && t.before.length === 8 && t.cvd.min >= before - 1e-9, `${id}: the colour-blind order made the neighbours closer (${t.cvd.min} < ${before.toFixed(2)})`);
    check(t.data[0] === t.before[0], `${id}: the order must keep the lead colour first`);
  }
  // the pale yellow logo on a white visual is the honest-line case: adjusted, said
  {
    const t = E.logoTheme(WANT.paleYellow, { ui: LIGHT, harmony: 'analogous' }), a = t.adjusted.find((x) => x.from === '#ffd84a');
    check(a && a.logo && a.before < 3 && a.after >= 3 && t.data[0] === a.to, `pale yellow on white: must be adjusted to 3:1 and stay colour 1 (${JSON.stringify(a)})`);
  }
  check(E.logoTheme([], { ui: LIGHT }) === null && E.logoTheme(['nonsense'], { ui: LIGHT }) === null, 'no logo colour: no palette (null)');

  // ---- 4. the page: real files, both generator pages, English and Arabic ----
  // the files: an SVG written as text, a PNG written with pngjs, a JPG drawn by the browser
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120" width="240" height="120"><rect x="10" y="20" width="130" height="80" fill="#1b3a6b"/><circle cx="185" cy="60" r="40" fill="#f28c28"/></svg>';
  const pngOf = (c) => { const p = new PNG({ width: c.w, height: c.h }); p.data = Buffer.from(c.px); return PNG.sync.write(p); };
  const pngT = pngOf(LOGOS.transparentPng()), pngW = pngOf(LOGOS.nearWhite()), pngY = pngOf(LOGOS.paleYellow());
  const FILES = [
    { id: 'svg', file: { name: 'brand.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) }, want: WANT.twoColour, adjusted: '#f28c28' },
    { id: 'png-transparent', file: { name: 'mark.png', mimeType: 'image/png', buffer: pngT }, want: WANT.transparentPng },
    { id: 'png-near-white', file: { name: 'logo-white.png', mimeType: 'image/png', buffer: pngW }, want: WANT.nearWhite },
    { id: 'png-pale-yellow', file: { name: 'sun.png', mimeType: 'image/png', buffer: pngY }, want: WANT.paleYellow, adjusted: '#ffd84a' },
  ];
  for (const page of ['/tools/power-bi-theme-generator.html', '/tools/power-bi-theme-generator-lab.html']) for (const lang of ['en', 'ar']) {
    const v = await visitor(browser, { downloads: true });
    await v.pg.goto(`${url}${page}?lang=${lang}`, { waitUntil: 'networkidle' });
    await v.pg.waitForFunction(() => !document.documentElement.classList.contains('i18n-pending'), null, { timeout: WAIT });
    const at = `${page.split('/').pop()} ${lang}`;
    // the light Corporate preset, so the pale yellow fails on the white visual
    await v.pg.click('#presets [data-p="Corporate"]');
    const card = await v.pg.evaluate(() => JSON.parse(localStorage.getItem('dataarcus-theme-generator')).ui.card);
    // a JPG made by the browser from the same 2-colour drawing (lossy: colours move a little)
    const jpg = Buffer.from(await v.pg.evaluate(async () => {
      const c = new OffscreenCanvas(240, 120), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 240, 120);
      g.fillStyle = '#c8102e'; g.fillRect(10, 20, 130, 80); g.fillStyle = '#00205b'; g.beginPath(); g.arc(185, 60, 40, 0, 7); g.fill();
      return [...new Uint8Array(await (await c.convertToBlob({ type: 'image/jpeg', quality: 0.85 })).arrayBuffer())];
    }));
    const files = FILES.concat([{ id: 'jpg', file: { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: jpg }, want: ['#c8102e', '#00205b'], tol: 6 }]);
    // from here on, no request leaves the page (the image is read in the tab only)
    const requests = [];
    v.pg.on('request', (r) => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
    for (const f of files) {
      const before = await v.pg.evaluate(() => (document.getElementById('logoOut') || {}).dataset ? document.getElementById('logoOut').dataset.n || '0' : 'none');
      await v.pg.setInputFiles('#logoFile', f.file);
      await v.pg.waitForFunction((b) => { const o = document.getElementById('logoOut'); return o && !o.hidden && o.dataset.n && o.dataset.n !== b; }, before, { timeout: WAIT });
      const r = await v.pg.evaluate(() => {
        const o = document.getElementById('logoOut'), hexes = (sel) => [...o.querySelectorAll(sel)].map((e) => e.dataset.hex);
        const st = JSON.parse(localStorage.getItem('dataarcus-theme-generator'));
        return { logo: hexes('.tg-logo-swatches [data-hex]'), palette: hexes('.tg-logo-palette [data-hex]'), rows: [...o.querySelectorAll('.tg-logo-table tbody tr')].map((tr) => [...tr.cells].map((c) => c.textContent.trim())),
          cvd: (o.querySelector('.tg-logo-cvd') || {}).textContent || '', adjusted: [...o.querySelectorAll('.tg-logo-adjusted')].map((e) => e.textContent), text: o.textContent,
          data: st.data, accent: st.ui.accent, brand: document.getElementById('brand').value, saved: localStorage.getItem('dataarcus-theme-generator'),
          dir: getComputedStyle(o).direction, overflow: o.scrollWidth > o.clientWidth + 1, err: (o.querySelector('.tg-logo-error') || {}).textContent || '' };
      });
      const id = `${at}, ${f.id}`;
      check(!r.err, `${id}: an error was shown: ${r.err}`);
      check(r.logo.length === f.want.length && f.want.every((h, i) => r.logo[i] && dE(r.logo[i], h) < (f.tol || TOL)), `${id}: logo colours ${r.logo.join(' ')}, expected ${f.want.join(' ')}`);
      check(r.palette.length === 8 && JSON.stringify(r.palette) === JSON.stringify(r.data) && r.accent === r.data[0] && r.brand === r.logo[0], `${id}: the palette shown (${r.palette}) is not the theme's data colours (${r.data}), accent ${r.accent}, brand box ${r.brand}`);
      check(r.data.every((c) => E.contrast(c, card) >= 3), `${id}: a data colour under 3:1 on the visual background: ${r.data.filter((c) => E.contrast(c, card) < 3)}`);
      check(r.rows.length === 8 && r.rows.every((cells) => cells.length === 5), `${id}: the contrast table must have 8 rows of 5 cells (${r.rows.length})`);
      check(/\d+(\.\d)?/.test(r.cvd) && (lang === 'ar' ? /عمى الألوان/.test(r.cvd) : /colou?r-blind/i.test(r.cvd)), `${id}: the colour-blind line is missing or not in ${lang}: "${r.cvd}"`);
      check(f.adjusted ? r.adjusted.length === 1 && r.adjusted[0].toLowerCase().includes(f.adjusted) : !r.adjusted.length, `${id}: the adjusted line: ${JSON.stringify(r.adjusted)}`);
      check(lang === 'ar' ? r.dir === 'rtl' && /[؀-ۿ]/.test(r.text) : r.dir === 'ltr' && !/[؀-ۿ]/.test(r.text), `${id}: the panel is ${r.dir}, or not in ${lang}`);
      check(!r.overflow, `${id}: the panel overflows sideways`);
      check(!/data:image|base64|<svg/i.test(r.saved) && !/"logo/i.test(r.saved), `${id}: the logo (or its name) was saved in the browser's storage`);
    }
    check(!requests.length, `${at}: dropping logos made network requests: ${requests.slice(0, 3).join(', ')}`);
    // a file that is not an image: one plain message, nothing changed
    const data0 = await v.pg.evaluate(() => JSON.parse(localStorage.getItem('dataarcus-theme-generator')).data.join());
    await v.pg.setInputFiles('#logoFile', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    await v.pg.waitForFunction(() => !!document.querySelector('#logoOut .tg-logo-error'), null, { timeout: WAIT });
    check(await v.pg.evaluate((d) => JSON.parse(localStorage.getItem('dataarcus-theme-generator')).data.join() === d, data0), `${at}: a text file changed the palette`);
    check(!v.errs.length, `${at}: page errors: ${v.errs.slice(0, 3).join(' | ')}`);
    await v.ctx.close();
  }
  return { checks, problems };
}
