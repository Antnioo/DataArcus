// AR3 (0.3.2) R&D proof: a made-up Gulf calendar page, its labels' visual order as today's page preview draws them
// (assets/js/page-preview.js, the writer's isolates from text-measure.js / pbip-bidi.js) vs the browser (Chromium) vs
// bidi-js (UAX 9); and Arabic shaping by harfbuzzjs vs the browser, in the same font (Noto Sans Arabic, SIL OFL).
// Made-up labels only; nothing here is shipped. Run in lab/rd/ar3/: npm ci --ignore-scripts, then npm test (node proof.mjs).
// Writes result.json beside this file. Prints PASS  ar3-proof  <N> checks (or FAIL with the failed checks).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import zlib from 'node:zlib';
import * as hb from 'harfbuzzjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const require = createRequire(import.meta.url);
const bidiFactory = require('bidi-js');
const bidi = bidiFactory();
const Preview = require(path.join(ROOT, 'assets', 'js', 'page-preview.js'));
const Measure = require(path.join(ROOT, 'assets', 'js', 'text-measure.js'));
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/node-tools/node_modules/playwright'); }
const FONT = path.join(HERE, 'node_modules', '@expo-google-fonts', 'noto-sans-arabic', '400Regular', 'NotoSansArabic_400Regular.ttf');

// ---- the made-up Gulf calendar page: 14 labels ----
const LABELS = [
  'الربع الأول 2026',
  'رمضان',
  'Q1 / الربع 1',
  '05/11/2026',
  '٪12',
  'المبيعات حسب الشهر - Q1 2026',
  'رمضان 1447 (Feb 2026)',
  'Sales YTD الإجمالي',
  'الهدف 12% مقابل الفعلي 9.5%',
  'عيد الفطر 20/03/2026',
  'Revenue (AED) الإيرادات',
  'الربع 2 - Q2',
  'الأسبوع 45 من 52',
  'KPI: نسبة الإنجاز ٪87',
];
const MARKS = /[‎‏‪-‮⁦-⁩]/;

const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail) }); };

// the writer's text for an Arabic report (pbip-bidi.js isolateFiles with o.all applies isolateLatin to every text)
const written = (s) => Measure.isolateLatin(s);
// indices of a string with its marks removed: maps an index in s to an index in the label (marks get -1)
function stripMap(s) { const map = []; let k = 0; for (const ch of s) { map.push(MARKS.test(ch) ? -1 : k++); } return map; }
// bidi-js visual order of s (base 'ltr' | 'rtl'), as label indices (marks dropped)
function bidiOrder(s, base) {
  const lv = bidi.getEmbeddingLevels(s, base);
  const idx = bidi.getReorderedIndices(s, lv);
  const map = stripMap(s);
  return idx.map((i) => map[i]).filter((i) => i >= 0);
}
// runs of a visual order: consecutive label indices (+1 or -1) grouped, each with its text, left to right
function runsOf(label, order) {
  const out = []; let cur = null;
  for (const i of order) {
    if (cur && (i === cur.last + cur.step || (cur.n === 1 && Math.abs(i - cur.last) === 1))) { if (cur.n === 1) cur.step = i - cur.last; cur.idx.push(i); cur.last = i; cur.n++; continue; }
    cur = { idx: [i], last: i, step: 0, n: 1 }; out.push(cur);
  }
  return out.map((r) => { const lo = Math.min(...r.idx), hi = Math.max(...r.idx); return label.slice(lo, hi + 1); });
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// ---- 1. today's preview: page-preview.js's own SVG for an Arabic page with one text box per label ----
const visuals = LABELS.map((t, i) => ({ type: 'textbox', x: 40, y: 20 + i * 48, w: 1200, h: 40, z: i, title: written(t), textSize: 14, textAlign: 'right' }));
const page = { name: 'تقويم', w: 1280, h: 720, rtl: true, visuals };
const svg = Preview.render(page, { width: 1280, lang: 'ar' });
check('the preview renders an svg', /^<svg/.test(svg));
// the candidate fix, measured here only (page-preview.js is not changed): on a right-to-left page each shown text is
// the writer's own (isolateLatin's marks kept, not removed by clean()), and a text the writer leaves unwrapped (no Latin
// letter) wrapped in U+2067 ... U+2069; the SVG kept direction="ltr" so every anchor stays as it is
const fixText = (t) => { const w = Measure.isolateLatin(t); return w.startsWith('\u2067') && w.endsWith('\u2069') ? w : '\u2067' + w + '\u2069'; };
let fixK = 0;
const svgFix = svg.replace(/(<text class="t"[^>]*>)([^<]*)(<\/text>)/g, (m, a, t, b) => a + fixText(LABELS[fixK++]) + b);
check('the candidate fix wraps every label', (svgFix.match(/\u2067/g) || []).length === LABELS.length);
check('the preview svg is direction="ltr"', /<svg[^>]*direction="ltr"/.test(svg));

// ---- sizes ----
const dirBytes = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? dirBytes(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
const nm = path.join(HERE, 'node_modules');
const sizes = {
  harfbuzzjs: { package: dirBytes(path.join(nm, 'harfbuzzjs')), wasm: fs.statSync(path.join(nm, 'harfbuzzjs', 'dist', 'harfbuzz.wasm')).size, wasmGzip: zlib.gzipSync(fs.readFileSync(path.join(nm, 'harfbuzzjs', 'dist', 'harfbuzz.wasm'))).length, js: fs.statSync(path.join(nm, 'harfbuzzjs', 'dist', 'index.mjs')).size },
  bidiJs: { package: dirBytes(path.join(nm, 'bidi-js')), minJs: fs.statSync(path.join(nm, 'bidi-js', 'dist', 'bidi.min.mjs')).size, minJsGzip: zlib.gzipSync(fs.readFileSync(path.join(nm, 'bidi-js', 'dist', 'bidi.min.mjs'))).length },
  font: { ttf: fs.statSync(FONT).size },
};

// ---- 2. bidi-js: orders and time ----
const t0 = performance.now();
const bjs = LABELS.map((l, i) => ({ previewText: bidiOrder(Measure.isolateLatin(l).replace(new RegExp(MARKS.source, 'g'), ''), 'ltr'), writtenRtl: bidiOrder(written(l), 'rtl'), writtenLtr: bidiOrder(written(l), 'ltr'), i }));
const bidiMs = performance.now() - t0;
// a steadier time: 200 pages
const t1 = performance.now();
for (let r = 0; r < 200; r++) for (const l of LABELS) { bidiOrder(written(l), 'rtl'); }
const bidiMsPerPage = (performance.now() - t1) / 200;

// ---- 3. harfbuzzjs: shaping the Arabic runs ----
const tInit = performance.now();
const fontData = fs.readFileSync(FONT);
const hbFace = new hb.Face(new hb.Blob(fontData));
const hbFont = new hb.Font(hbFace);
const hbInitMs = performance.now() - tInit;
const UPEM = hbFace.upem;
const ARRUN = /[؀-ۿ]+(?:[  ]+[؀-ۿ]+)*/g;
const arabicRuns = [...new Set(LABELS.flatMap((l) => l.match(ARRUN) || []))];
function shape(text, features) {
  const b = new hb.Buffer(); b.addText(text); b.guessSegmentProperties(); hb.shape(hbFont, b, features ? features.split(',').map((f) => hb.Feature.fromString(f)) : undefined);
  const out = b.getGlyphInfosAndPositions().map((g) => ({ gid: g.codepoint, name: hbFont.glyphName(g.codepoint), cluster: g.cluster, xAdvance: g.xAdvance, xOffset: g.xOffset, yOffset: g.yOffset }));
  return out;
}
const UNSHAPED = '-init,-medi,-fina,-isol,-rlig,-liga,-calt,-mark,-mkmk,-kern,-ccmp,-locl';
const shaped = arabicRuns.map((text) => {
  const g = shape(text), u = shape(text, UNSHAPED);
  // a contextual form: an initial, medial or final form, or the lam-alef ligature's parts (rlig); unshaped: none of them
  const contextual = g.filter((x) => /\.(init|medi|fina|rlig)\b/.test(x.name)).length;
  const letters = [...text].filter((c) => /[\u0620-\u064A\u066E-\u06D3]/.test(c)).length;
  return { text, letters, glyphs: g.map((x) => x.name), advance: g.reduce((s, x) => s + x.xAdvance, 0), notdef: g.filter((x) => x.gid === 0).length, contextual, unshapedContextual: u.filter((x) => /\.(init|medi|fina|rlig)\b/.test(x.name)).length, unshapedGlyphs: u.map((x) => x.name) };
});
const tS = performance.now();
for (let r = 0; r < 50; r++) for (const s of arabicRuns) shape(s);
const hbMsPerPage = (performance.now() - tS) / 50;

// ---- 4. Chromium: the preview's character order, the browser's order of the written text, shaping pixels ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ar3-'));
const browser = await playwright.chromium.launch();
const bpage = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
const html = `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:NotoAR;src:url(data:font/ttf;base64,${fontData.toString('base64')})}body{margin:0;font:16px sans-serif}</style><div id="pv">${svg}</div><div id="fix">${svgFix}</div><div id="ref"></div>`;
fs.writeFileSync(path.join(tmp, 'page.html'), html);
await bpage.goto('file://' + path.join(tmp, 'page.html').split(path.sep).join('/'));
await bpage.evaluate(() => document.fonts.load('48px NotoAR', 'ب'));

// visual order from per-character boxes: x centres left to right; ties (a ligature's parts) by direction
const ORDER_FN = `(boxes, rtlTie) => boxes.map((b, i) => ({ i, c: b ? b.x + b.w / 2 : null, w: b ? b.w : 0 })).filter((b) => b.c != null && b.w > 0.01).sort((a, b) => (Math.abs(a.c - b.c) > 0.01 ? a.c - b.c : (rtlTie(a.i) ? b.i - a.i : a.i - b.i))).map((b) => b.i)`;
const previewRaw = await bpage.evaluate(({ ORDER_FN }) => {
  const order = eval(ORDER_FN);
  return [...document.querySelectorAll('#pv text.t')].map((t) => {
    const s = t.textContent, n = t.getNumberOfChars(), boxes = [];
    for (let i = 0; i < n; i++) { try { const e = t.getExtentOfChar(i); boxes.push({ x: e.x, w: e.width }); } catch (err) { boxes.push(null); } }
    return { text: s, order: order(boxes, (i) => /[؀-ۿ]/.test(s[i])) };
  });
}, { ORDER_FN });
const fixRaw = await bpage.evaluate(({ ORDER_FN }) => {
  const order = eval(ORDER_FN);
  return [...document.querySelectorAll('#fix text.t')].map((t) => {
    const s = t.textContent, n = t.getNumberOfChars(), boxes = [];
    for (let i = 0; i < n; i++) { const e = t.getExtentOfChar(i); boxes.push({ x: e.x, w: e.width }); }
    return { text: s, order: order(boxes, (i) => /[\u0600-\u06FF]/.test(s[i])) };
  });
}, { ORDER_FN });
const browserRef = await bpage.evaluate(({ texts, ORDER_FN }) => {
  const order = eval(ORDER_FN);
  const one = (s, dir) => {
    const d = document.createElement('div'); d.dir = dir; d.style.cssText = 'font:28px sans-serif;white-space:pre;display:inline-block'; d.textContent = s; document.getElementById('ref').appendChild(d);
    const node = d.firstChild, boxes = [];
    for (let i = 0; i < s.length; i++) { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1); const b = r.getBoundingClientRect(); boxes.push({ x: b.x, w: b.width }); }
    d.remove();
    return order(boxes, (i) => /[؀-ۿ]/.test(s[i]));
  };
  return texts.map((s) => ({ rtl: one(s, 'rtl'), ltr: one(s, 'ltr'), plainLtr: one(s.replace(/[‎‏‪-‮⁦-⁩]/g, ''), 'ltr') }));
}, { texts: LABELS.map(written), ORDER_FN });
// shaping in the browser: canvas width and pixels vs harfbuzzjs's glyph outlines at the same size
const PX = 48;
const drawOf = (features) => shaped.map((s) => {
  let x = 0; const parts = [];
  const b = new hb.Buffer(); b.addText(s.text); b.guessSegmentProperties(); hb.shape(hbFont, b, features ? features.split(',').map((f) => hb.Feature.fromString(f)) : undefined);
  for (const g of b.getGlyphInfosAndPositions()) { parts.push({ d: hbFont.glyphToPath(g.codepoint), x: x + g.xOffset, y: g.yOffset }); x += g.xAdvance; }
  return parts;
});
// the control: the same runs drawn unshaped (no contextual forms), to show the pixel compare sees a wrong form
const hbDraw = drawOf(null), hbDrawUnshaped = drawOf(UNSHAPED);
const fnSrc = ({ runs, draws, PX, UPEM }) => {
  const W = 1100, H = 120, s = PX / UPEM;
  const pix = (paint) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.fillStyle = '#000'; paint(g); return g.getImageData(0, 0, W, H).data; };
  return runs.map((text, k) => {
    const cv = document.createElement('canvas').getContext('2d'); cv.font = `${PX}px NotoAR`; cv.direction = 'rtl';
    const width = cv.measureText(text).width;
    const a = pix((g) => { g.font = `${PX}px NotoAR`; g.direction = 'rtl'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(text, 10, 80); });
    const b = pix((g) => { for (const p of draws[k]) { g.save(); g.translate(10 + p.x * s, 80 - p.y * s); g.scale(s, -s); g.fill(new Path2D(p.d)); g.restore(); } });
    let diff = 0, ink = 0, bin = 0, binInk = 0;
    for (let i = 3; i < a.length; i += 4) { diff += Math.abs(a[i] - b[i]); ink += Math.max(a[i], b[i]); const p = a[i] > 127, q = b[i] > 127; if (p || q) binInk++; if (p !== q) bin++; }
    return { text, browserWidth: width, diffShare: ink ? diff / ink : 0, binShare: binInk ? bin / binInk : 0 };
  });
};
const shapeCmp = await bpage.evaluate(fnSrc, { runs: shaped.map((s) => s.text), draws: hbDraw, PX, UPEM });
const shapeCtl = await bpage.evaluate(fnSrc, { runs: shaped.map((s) => s.text), draws: hbDrawUnshaped, PX, UPEM });
await bpage.screenshot({ path: path.join(tmp, 'preview.png') });
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });

// ---- 5. compare ----
const fixOrder = (i) => { const m = stripMap(fixRaw[i].text); return fixRaw[i].order.map((j) => m[j]).filter((j) => j >= 0); };
const rows = LABELS.map((label, i) => {
  const pv = previewRaw[i];
  const pvOrder = pv.order; // indices into the shown text: clean() removed the marks, so it is the label itself
  const ref = browserRef[i];
  const map = stripMap(written(label));
  const refRtl = ref.rtl.map((j) => map[j]).filter((j) => j >= 0), refLtr = ref.ltr.map((j) => map[j]).filter((j) => j >= 0);
  return {
    label, written: written(label) !== label, shownIsLabel: pv.text === label,
    preview: runsOf(label, pvOrder), browser: runsOf(label, refRtl),
    previewVsBrowser: same(pvOrder, refRtl), fixVsBrowser: same(fixOrder(i), refRtl), fixVsBidiJsRtl: same(fixOrder(i), bidiOrder(fixText(label), 'ltr')), browserRtlVsLtr: same(refRtl, refLtr),
    bidiJsVsPreview: same(bjs[i].previewText, pvOrder), bidiJsVsBrowser: same(bjs[i].writtenRtl, refRtl), bidiJsVsPlainLtr: same(bjs[i].previewText, ref.plainLtr),
    bidiJs: runsOf(label, bjs[i].writtenRtl), bidiJsPreviewText: runsOf(label, bjs[i].previewText),
  };
});
rows.forEach((r, i) => {
  check(`label ${i + 1} shown in the preview as given (marks removed)`, r.shownIsLabel, r.label);
  check(`label ${i + 1} bidi-js = Chromium on the preview's text (ltr)`, r.bidiJsVsPreview && r.bidiJsVsPlainLtr, r.label);
  check(`label ${i + 1} bidi-js = Chromium on the written text (rtl)`, r.bidiJsVsBrowser, r.label);
  check(`label ${i + 1} bidi-js = Chromium on the candidate fix's text`, r.fixVsBidiJsRtl, r.label);
  check(`label ${i + 1} the candidate fix draws the written order`, r.fixVsBrowser, r.label);
});
shaped.forEach((s, k) => {
  const c = shapeCmp[k], hbW = s.advance * PX / UPEM;
  s.browserWidth = Math.round(c.browserWidth * 100) / 100; s.harfbuzzWidth = Math.round(hbW * 100) / 100; s.widthDiffPct = Math.round(Math.abs(hbW - c.browserWidth) / c.browserWidth * 10000) / 100; s.pixelDiffPct = Math.round(c.diffShare * 10000) / 100; s.halfInkDiffPct = Math.round(c.binShare * 10000) / 100;
  check(`run «${s.text}» no missing glyph`, s.notdef === 0);
  check(`run «${s.text}» harfbuzzjs width within 1% of Chromium`, s.widthDiffPct <= 1, `${s.widthDiffPct}%`);
  s.unshapedPixelDiffPct = Math.round(shapeCtl[k].diffShare * 10000) / 100;
  if (s.contextual) check(`run «${s.text}» the control (unshaped) differs at least 5 times more`, s.unshapedPixelDiffPct >= 5 * s.pixelDiffPct, `${s.unshapedPixelDiffPct}% vs ${s.pixelDiffPct}%`);
});

const result = {
  labels: LABELS.length,
  order: {
    previewDiffersFromBrowser: rows.filter((r) => !r.previewVsBrowser).length,
    candidateFixDiffersFromBrowser: rows.filter((r) => !r.fixVsBrowser).length,
    candidateFixDiffersFromBidiJs: rows.filter((r) => !r.fixVsBidiJsRtl).length,
    browserRtlBaseDiffersFromLtrBase: rows.filter((r) => !r.browserRtlVsLtr).length,
    bidiJsDiffersFromChromiumPreviewText: rows.filter((r) => !(r.bidiJsVsPreview && r.bidiJsVsPlainLtr)).length,
    bidiJsDiffersFromChromiumWritten: rows.filter((r) => !r.bidiJsVsBrowser).length,
    rows,
  },
  shaping: { runs: shaped.length, maxWidthDiffPct: Math.max(...shaped.map((s) => s.widthDiffPct)), maxPixelDiffPct: Math.max(...shaped.map((s) => s.pixelDiffPct)), minUnshapedPixelDiffPct: Math.min(...shaped.filter((s) => s.contextual).map((s) => s.unshapedPixelDiffPct)), maxHalfInkDiffPct: Math.max(...shaped.map((s) => s.halfInkDiffPct)), unshapedContextualGlyphs: shaped.reduce((a, s) => a + s.unshapedContextual, 0), arabicLetters: shaped.reduce((a, s) => a + s.letters, 0), contextualGlyphs: shaped.reduce((a, s) => a + s.contextual, 0), glyphs: shaped.reduce((a, s) => a + s.glyphs.length, 0), list: shaped },
  cost: { sizes, bidiFirstPageMs: Math.round(bidiMs * 100) / 100, bidiMsPerPage: Math.round(bidiMsPerPage * 1000) / 1000, harfbuzzInitMs: Math.round(hbInitMs * 100) / 100, harfbuzzMsPerPage: Math.round(hbMsPerPage * 1000) / 1000 },
};
fs.writeFileSync(path.join(HERE, 'result.json'), JSON.stringify(result, null, 2) + '\n');
const bad = checks.filter((c) => !c.ok);
if (process.argv.includes('--verbose') || bad.length) for (const c of checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'}  ${c.name}${c.detail ? '  ' + c.detail : ''}`);
console.log(bad.length ? `FAIL  ar3-proof  ${bad.length} of ${checks.length} checks` : `PASS  ar3-proof  ${checks.length} checks`);
process.exit(bad.length ? 1 : 0);
