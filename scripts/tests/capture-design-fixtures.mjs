// Captures what the Theme & Layout Generator makes today, as fixtures for the design engine (assets/js/design-engine.js):
// for each case, the design as the page saved it, the theme JSON (#json), the slot table (#slotTable), the layout
// preview (#layCanvas) and the SVG the background PNG is drawn from. The engine and the page must give these byte for byte.
//
//   node scripts/tests/capture-design-fixtures.mjs          writes scripts/tests/fixtures/design-engine/cases.json
//   node scripts/tests/capture-design-fixtures.mjs --check  compares the page with the saved fixtures, writes nothing
//
// Fixtures are only remade with the owner's approval: they freeze today's behaviour, quirks included.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ROOT, serve, launch, visitor } from './lib.mjs';

export const FILE = path.join(ROOT, 'scripts/tests/fixtures/design-engine/cases.json');
const PAGE = '/tools/power-bi-theme-generator.html', STORE = 'dataarcus-theme-generator';

// ---------- the cases ----------
// Each case: lang, then optional steps on the page (preset button, generated harmony), then changes to the saved design
// (top-level keys, and layout keys merged into the saved layout, or a whole raw layout for old saved designs).
const PRESETS = ['DataArcus', 'Corporate', 'Colorblind safe', 'Desert Gulf', 'Midnight', 'Earthy'];
const LAYOUTS = ['exec', 'analysis', 'ops', 'focus'];
const PAGES = [['1920x1080'], ['1280x720'], ['960x720'], ['custom', 3840, 2160], ['custom', 640, 360], ['custom', 1366, 768]];
const pick = (list, i) => list[i % list.length];
function cases() {
  const out = [];
  const add = (id, c) => out.push(Object.assign({ id, lang: 'en' }, c));
  // colours: every preset, every harmony from two brand colours
  PRESETS.forEach((p, i) => add(`preset-${i + 1}`, { preset: p }));
  ['#0f4c5c', '#e36414'].forEach((b, j) => ['analogous', 'complementary', 'triadic', 'mono'].forEach((h) => add(`harmony-${h}-${j + 1}`, { harmony: [b, h] })));
  // fonts other than the default
  ['DIN', 'Tahoma', 'Georgia'].forEach((f) => add(`font-${f.toLowerCase()}`, { set: { font: f } }));
  // chart styles: every value of every setting at least once
  const CS = { labels: ['on', 'off'], grid: ['dotted', 'off'], legend: ['Top', 'TopCenter', 'Bottom', 'Right', 'off'], axis: ['off'], table: ['minimal', 'banded'] };
  for (let i = 0; i < 5; i++) add(`chart-${i + 1}`, { preset: pick(PRESETS, i + 1), set: { chart: Object.fromEntries(Object.entries(CS).map(([k, v]) => [k, pick(v, i)])) } });
  // names: Arabic letters and symbols (the theme name and the file names)
  add('name-arabic', { set: { name: 'سمة المبيعات' } });
  add('name-symbols', { set: { name: 'Café "Q3" / Board' } });
  // a hand-edited or damaged save: every bad value falls back to its default
  add('repair-values', { raw: { preset: 'Nope', name: 42, font: 'Comic Sans MS', data: ['#abc', 'red', '#123456', '', '#FFFFFF', 'x', '#00d4ff', '#6C5CE7'], ui: { background: '#000', card: 'blue' }, chart: { labels: 'maybe', legend: 'Right' },
    layout: { v: 3, page: '1920x1080', preset: 'ghost', kpis: 9, dir: 'up', radius: 99, kpiBar: 'left', headLine: 'thick', filters: 'yes', shadow: 1, hh: 'x', kpiH: 1e9 } } });
  // layouts on every page size, with the other layout choices turned in turn
  const vary = (i) => ({
    dir: pick(['ltr', 'rtl'], i), transparent: pick([false, true], Math.floor(i / 2)), radius: pick([0, 8, 16, 5], i), shadow: pick([true, false, true], i),
    kpiBar: pick(['start', 'top', 'bottom', 'none'], i + 1), headLine: pick(['short', 'full', 'none'], i), header: pick([true, true, false], i + 2),
    filters: pick([false, true, true, true], i), fpos: pick(['start', 'start', 'end', 'top'], i), kpis: pick([3, 4, 5, 6], i + 2), samples: pick([true, true, false], i + 1),
    kpiBarC: pick([undefined, 'good', 'data', 'neutral'], i), headLineC: pick([undefined, 'data', 'accent'], i + 1), kpiBarW: pick([undefined, 2, 8], i), headLineW: pick([undefined, 6, 2], i)
  });
  const EXT = [{}, { hh: 96, logoW: 360, fw: 320, fh: 120, kpiH: 160, mainW: 75, split: 70 }, { hh: 44, logoW: 100, fw: 160, fh: 56, kpiH: 64, mainW: 40, split: 30 }];
  let n = 0;
  LAYOUTS.forEach((l) => PAGES.forEach(([pg, w, h]) => {
    const i = n++;
    add(`layout-${l}-${pg === 'custom' ? w + 'x' + h : pg}`, { preset: pick(PRESETS, i), layout: Object.assign({ preset: l, page: pg }, pg === 'custom' ? { pageW: w, pageH: h } : {}, vary(i), pick(EXT, i)) });
  }));
  // custom sizes outside the allowed shape and range
  add('page-too-wide', { layout: { page: 'custom', pageW: 3840, pageH: 1000 } });
  add('page-too-tall', { layout: { page: 'custom', pageW: 700, pageH: 2000, preset: 'ops' } });
  add('page-out-of-range', { layout: { page: 'custom', pageW: 9999, pageH: 100, preset: 'analysis', filters: true } });
  // designs saved by older versions of the page
  add('old-v1-soft', { rawLayout: { preset: 'exec', kpis: 4, radius: 12, accentBar: false } });
  add('old-v1-round', { rawLayout: { preset: 'ops', kpis: 6, radius: 14, filters: true } });
  add('old-v2', { rawLayout: { v: 2, preset: 'focus', kpis: 3, radius: 16, kpiBar: 'top' } });
  // Arabic page: slot names, preview text, and the direction that follows the page when none is chosen
  add('arabic-exec', { lang: 'ar', layout: { preset: 'exec', dir: '' } });
  add('arabic-analysis-filters', { lang: 'ar', preset: 'Desert Gulf', layout: { preset: 'analysis', dir: '', filters: true, fpos: 'end', page: '1280x720' } });
  add('arabic-ops-ltr', { lang: 'ar', preset: 'Midnight', layout: { preset: 'ops', dir: 'ltr', kpis: 5, page: 'custom', pageW: 2560, pageH: 1440 } });
  add('arabic-focus-font', { lang: 'ar', set: { font: 'Verdana' }, layout: { preset: 'focus', dir: '', transparent: true, page: '960x720' } });
  // the example design the page offers ("See an example"), in both languages
  const example = { preset: 'exec', kpis: 4, filters: true, fpos: 'top', v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', kpiBarC: 'data', headLine: 'full', samples: true, transparent: true, page: '1920x1080', hh: 64, logoW: 200 };
  add('example-en', { preset: 'Desert Gulf', set: { name: 'Executive Sales' }, rawLayout: Object.assign({ dir: 'ltr' }, example) });
  add('example-ar', { lang: 'ar', preset: 'Desert Gulf', set: { name: 'Executive Sales' }, rawLayout: Object.assign({ dir: 'rtl' }, example) });
  // left out to keep the fixtures small: each repeats a path other cases already cover (their layout choices above
  // still come from their place in the full list, so the cases kept are the same with or without this line)
  const REPEATS = ['harmony-complementary-2', 'harmony-triadic-2', 'font-tahoma', 'layout-analysis-1280x720', 'layout-focus-1280x720',
    'layout-exec-1366x768', 'layout-ops-1366x768', 'layout-focus-960x720', 'harmony-mono-2', 'layout-exec-1920x1080', 'layout-focus-1920x1080',
    'layout-analysis-3840x2160', 'name-symbols', 'layout-ops-1280x720', 'font-georgia'];
  return out.filter((c) => !REPEATS.includes(c.id));
}

// ---------- capturing one case on the page ----------
const read = (pg) => pg.evaluate((STORE) => new Promise((resolve) => {
  window.__bg = [];
  document.getElementById('pngBtn').click();   // draws the background from bgSvg through an <img>; the init script keeps the SVG
  const until = Date.now() + 5000;
  (function wait() {
    if (window.__bg.length || Date.now() > until) {
      resolve({
        state: JSON.parse(localStorage.getItem(STORE)),
        theme: document.getElementById('json').textContent,
        slots: [...document.querySelectorAll('#slotTable tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent)),
        preview: document.getElementById('layCanvas').innerHTML,
        bg: window.__bg[0] || null
      });
    } else setTimeout(wait, 20);
  })();
}), STORE);

async function captureCase(browser, url, c) {
  const v = await visitor(browser, { viewport: [1440, 1000], downloads: true });
  // keep the SVG that pngBlob hands to an <img> (data:image/svg+xml,...), without touching the page's code
  await v.ctx.addInitScript(() => {
    const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, get() { return d.get.call(this); },
      set(val) { if (typeof val === 'string' && val.startsWith('data:image/svg+xml')) (window.__bg = window.__bg || []).push(decodeURIComponent(val.slice(val.indexOf(',') + 1))); d.set.call(this, val); } });
  });
  const pg = v.pg, go = async () => { await pg.goto(`${url}${PAGE}?lang=${c.lang}`, { waitUntil: 'networkidle' }); await pg.waitForFunction(() => document.getElementById('json').textContent.length > 100); };
  await go();
  // steps on the page: a preset button, or a generated harmony
  if (c.preset) await pg.click(`#presets [data-p="${c.preset}"]`);
  if (c.harmony) { await pg.fill('#brand', c.harmony[0]); await pg.selectOption('#harmony', c.harmony[1]); await pg.click('#genBtn'); }
  // changes to the saved design, then a fresh load reads them like a returning visitor
  if (c.set || c.layout || c.rawLayout || c.raw) {
    await pg.evaluate(([STORE, c]) => {
      let s = JSON.parse(localStorage.getItem(STORE));
      if (c.raw) s = c.raw;
      Object.assign(s, c.set || {});
      if (c.rawLayout) s.layout = c.rawLayout;
      if (c.layout) s.layout = Object.assign({}, s.layout, c.layout);
      localStorage.setItem(STORE, JSON.stringify(s));
    }, [STORE, c]);
    await go();
  }
  const r = await read(pg);
  const errs = v.errs.slice();
  await v.ctx.close();
  return Object.assign(r, { errs });
}

export async function captureAll(browser, url) {
  const out = [];
  for (const c of cases()) out.push(Object.assign({ case: c }, await captureCase(browser, url, c)));
  return out;
}

// Stored once per distinct text: many cases share a theme or a background. A theme is the page's
// JSON.stringify(theme, null, 2), so it is kept compact and turned back into exactly that text; if a text did not come
// back byte for byte it is kept as it is (prefix "=").
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);
const pretty = (t) => JSON.stringify(JSON.parse(t), null, 2);
export function pack(results, meta) {
  const blobs = {}, keep = (t, json) => {
    if (t == null) return null;
    const k = sha(t);
    blobs[k] = json && (() => { try { return pretty(JSON.stringify(JSON.parse(t))) === t; } catch (e) { return false; } })() ? JSON.stringify(JSON.parse(t)) : '=' + t;
    return k;
  };
  const list = results.map((r) => ({ id: r.case.id, lang: r.case.lang, setup: Object.fromEntries(Object.entries(r.case).filter(([k]) => k !== 'id' && k !== 'lang')),
    state: r.state, theme: keep(r.theme, true), slots: r.slots, preview: keep(r.preview), bg: keep(r.bg) }));
  return { meta, cases: list, blobs };
}
const text = (b) => (b == null ? null : b[0] === '=' ? b.slice(1) : pretty(b));
export const unpack = (f) => f.cases.map((c) => Object.assign({}, c, { theme: text(f.blobs[c.theme]), preview: text(f.blobs[c.preview]), bg: c.bg ? text(f.blobs[c.bg]) : null }));

// ---------- command line ----------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes('--check');
  const server = await serve(), browser = await launch();
  const t0 = Date.now(), results = await captureAll(browser, server.url);
  const problems = [];
  results.forEach((r) => {
    if (r.errs.length) problems.push(`${r.case.id}: page errors: ${r.errs.join(' | ')}`);
    if (!r.bg) problems.push(`${r.case.id}: no background SVG captured`);
    if (r.slots.length < 5) problems.push(`${r.case.id}: only ${r.slots.length} slots`);
  });
  if (check) {
    const saved = unpack(JSON.parse(fs.readFileSync(FILE, 'utf8')));
    results.forEach((r) => {
      const f = saved.find((x) => x.id === r.case.id);
      if (!f) return problems.push(`${r.case.id}: not in the fixtures`);
      for (const k of ['theme', 'preview', 'bg']) if (r[k] !== f[k]) problems.push(`${r.case.id}: ${k} differs from the fixture`);
      if (JSON.stringify(r.slots) !== JSON.stringify(f.slots)) problems.push(`${r.case.id}: slot table differs from the fixture`);
      if (JSON.stringify(r.state) !== JSON.stringify(f.state)) problems.push(`${r.case.id}: saved design differs from the fixture`);
    });
  } else if (!problems.length) {
    const head = (() => { try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).toString().trim(); } catch (e) { return ''; } })();
    const meta = { page: PAGE, commit: head, browser: browser.version(), captured: new Date().toISOString().slice(0, 10) };
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(pack(results, meta)) + '\n');
  }
  await browser.close(); server.close();
  const size = fs.existsSync(FILE) ? fs.statSync(FILE).size : 0;
  console.log(problems.length ? `FAIL  ${problems.length} problems\n` + problems.map((p) => '      - ' + p).join('\n')
    : `${check ? 'MATCH' : 'WROTE'}  ${results.length} cases  ${(size / 1024).toFixed(0)} KB  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  process.exit(problems.length ? 1 : 0);
}
