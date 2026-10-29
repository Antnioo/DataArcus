// 0.3.1 MP1: a page drawn on a picture is mirrored in the Arabic twin (D-1029-03): its picture flipped left to right and
// its visuals mirrored onto it, each on the same panel. Each check written red first. Made-up reports on the sample
// project's model, their pictures drawn by the test (fixtures/mp1/draw.mjs; the JPEGs are those drawings saved by
// another encoder): never a real report, never data values.
//   D1-D8  the picture reader (lib/page-picture.mjs): PNG as pngjs writes it (RGBA, RGB, grey, grey and alpha, palette,
//          16 bits, interlaced), a baseline JPEG of the website (within a few levels of Pillow's reading), a
//          progressive one and one with restart markers (within a few levels of the drawing)
//   P      18 made-up pages (a left rail and 2 panels; 3 card columns; a header band) x (Normal narrower than the page,
//          Fit, Fill) x (PNG, JPEG): each Arabic page on a new PNG, the English picture flipped (Normal: drawn on the
//          page first), and every visual mirrored onto the same panel (the JPEG report asked with mirrorPicturePages,
//          which before wrote the original picture under mirrored visuals)
//   O1-O2  the original reports' files byte-identical
//   A1-A4  the plan says per page flipped (fit, padded) in English and Arabic, the approval page (wholly Arabic, FX1) a
//          row per page, the plan's exact files (its digest) hold the new pictures
//   T1-T2  a picture with words in it: asked, its page kept left to right until flipPictures names it; then flipped
//   W1     a wallpaper picture (outspace) kept as it is, and said
//   X1-X2  the copy holding both languages: the Arabic pages on the new pictures, registered; the English untouched
//   V1-V3  a badge on a text box mirrored within it (no new overlap with its text); a new overlap named; a text box the
//          fitting widens off its panel named by page and visual
//   node test-0.3.1-mp1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { LAYOUTS, PAGE, SIZES, draw } from './fixtures/mp1/draw.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), FIX = path.join(HERE, 'fixtures', 'mp1');
const { PNG } = createRequire(import.meta.url)('pngjs');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const httpReq = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (d) => { t += d; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
// the picture reader, when it is there (the old code has none: its checks fail, the rest still run)
let PP = null; try { PP = await import('./lib/page-picture.mjs'); } catch (e) { PP = null; }

// ---------- D: the picture reader ----------
{
  const w = 37, h = 23, px = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; px[i] = (x * 7) & 255; px[i + 1] = (y * 11) & 255; px[i + 2] = (x * y) & 255; px[i + 3] = x < 5 ? 0 : 255; }
  const same = (img, want, tol) => img && img.w === w && img.h === h && img.rgba.every((v, i) => Math.abs(v - want[i]) <= tol);
  const asWritten = (o) => { const p = new PNG(Object.assign({ width: w, height: h }, o)); p.data = Buffer.from(px); return PNG.sync.write(p, o); };
  const rd = (b) => (PP ? PP.readPicture(new Uint8Array(b)) : null);
  chk(() => same(rd(asWritten({ colorType: 6 })), px, 0), () => 'D1: a PNG with alpha (RGBA, 8 bits) read pixel for pixel');
  // (pngjs's own reading of a file it wrote is the reference where it changes the pixels: RGB lays the transparent ones
  // on white, grey takes its own average, 16 bits come back divided by 257)
  const back = (b) => PNG.sync.read(b).data;
  chk(() => { const b = asWritten({ colorType: 2 }), r = rd(b); return same(r, back(b), 0) && r.rgba.every((v, i) => i % 4 !== 3 || v === 255); }, () => 'D2: an RGB PNG read pixel for pixel (opaque)');
  chk(() => { const b = asWritten({ colorType: 0, inputColorType: 6 }), r = rd(b); return r && r.rgba[0] === r.rgba[1] && r.rgba[3] === 255 && same(r, back(b), 0); }, () => 'D3: a grey PNG read (grey into R, G and B, opaque)');
  chk(() => { const b = asWritten({ colorType: 4, inputColorType: 6 }); return same(rd(b), back(b), 0); }, () => 'D4: a grey PNG with alpha read');
  chk(() => { const b = asWritten({ colorType: 6, bitDepth: 16 }); return same(rd(b), back(b), 1); }, () => 'D5: a 16-bit PNG read (each channel\'s high byte)');
  // a palette PNG and an interlaced one, written here by hand (pngjs writes neither): the same small picture
  const few = px.map((v, i) => (i % 4 === 3 ? v : v & 0xc0));   // (at most 256 colours, for the palette)
  chk(() => { const b = PP && PP.testPng ? PP.testPng(w, h, few, { palette: true }) : null; return b && same(rd(b), few, 0); }, () => 'D6: a palette PNG (with its tRNS alpha) read');
  chk(() => { const b = PP && PP.testPng ? PP.testPng(w, h, px, { interlaced: true }) : null; return b && same(rd(b), px, 0); }, () => 'D7: an interlaced (Adam7) PNG read');
  // the JPEGs: the website's own picture (baseline, 4:2:0) against Pillow's reading of it (measured once: the mean of
  // each channel and 12 pixels), the progressive and restart-marker drawings against the drawing
  const og = rd(fs.readFileSync(path.join(HERE, '../assets/img/og/cfpb.jpg')));
  const ogPts = [[37, 53, 10, 39, 57], [37, 301, 10, 33, 49], [37, 555, 10, 18, 31], [401, 53, 11, 30, 45], [401, 301, 9, 27, 41], [401, 555, 9, 15, 27], [777, 53, 9, 15, 27], [777, 301, 147, 182, 212], [777, 555, 17, 20, 27], [1111, 53, 13, 17, 29], [1111, 301, 20, 79, 123], [1111, 555, 28, 28, 30]];
  const mean = (img, c) => { let s = 0; for (let i = c; i < img.rgba.length; i += 4) s += img.rgba[i]; return s / (img.w * img.h); };
  const inside = (img, layout) => { const want = draw(layout, img.w, img.h), L = LAYOUTS[layout], edge = (x, y) => [{ at: [0, 0, 1, 1] }].concat(L.panels).some((p) => [p.at[0] * img.w, p.at[2] * img.w].some((e) => Math.abs(x - e) < 5) || [p.at[1] * img.h, p.at[3] * img.h].some((e) => Math.abs(y - e) < 5));
    let worst = 0; for (let y = 0; y < img.h; y += 3) for (let x = 0; x < img.w; x += 3) { if (edge(x, y)) continue; const i = (y * img.w + x) * 4; for (let c = 0; c < 3; c++) worst = Math.max(worst, Math.abs(img.rgba[i + c] - want[i + c])); } return worst; };
  const prog = rd(fs.readFileSync(path.join(FIX, 'rail-wide-progressive.jpg'))), rst = rd(fs.readFileSync(path.join(FIX, 'cols-wide-restart.jpg')));
  chk(() => og && og.w === 1200 && og.h === 630 && [71.66, 84.37, 95.99].every((m, c) => Math.abs(mean(og, c) - m) < 0.6) && ogPts.every(([x, y, r, g2, b]) => { const i = (y * 1200 + x) * 4; return Math.abs(og.rgba[i] - r) <= 8 && Math.abs(og.rgba[i + 1] - g2) <= 8 && Math.abs(og.rgba[i + 2] - b) <= 8; }),
    () => `D8: the website's baseline JPEG (4:2:0) read as Pillow reads it: ${og ? JSON.stringify([0, 1, 2].map((c) => mean(og, c).toFixed(2))) : 'not read'}`);
  chk(() => prog && rst && inside(prog, 'rail') <= 12 && inside(rst, 'cols') <= 16, () => `D9: a progressive JPEG and one with restart markers read: worst ${prog ? inside(prog, 'rail') : 'not read'}, ${rst ? inside(rst, 'cols') : 'not read'}`);
}

// ---------- the fixtures: made-up reports on the sample's model ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mp1-root-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mp1-log-'))), log = path.join(LOGS, 'links.txt');
process.env.DATAARCUS_ROOT = ROOT;
const { sampleFiles } = await import('./lib/sample-project.mjs');
sampleFiles('S').forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
const MODEL = fs.readdirSync(path.join(ROOT, 'S')).find((x) => /\.SemanticModel$/.test(x));
const L = (v) => ({ expr: { Literal: { Value: v } } }), S = (t) => L("'" + String(t).replace(/'/g, "''") + "'");
const SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/';
const W = PAGE.w, H = PAGE.h, FITS = ['Normal', 'Fit', 'Fill'];
const pngOf = (w, h, rgba) => { const p = new PNG({ width: w, height: h }); p.data = Buffer.from(rgba); return PNG.sync.write(p); };
const imageOf = (name, fit) => ({ image: { name: S(name), url: { expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: name } } }, scaling: S(fit) } });
// where a picture of iw x ih lands on the page (the rule the brief gives: Normal at 0,0 scale 1; Fit and Fill centred)
const place = (iw, ih, fit) => { const s = fit === 'Fit' ? Math.min(W / iw, H / ih) : fit === 'Fill' ? Math.max(W / iw, H / ih) : 1; return fit === 'Normal' ? { s, ox: 0, oy: 0 } : { s, ox: (W - s * iw) / 2, oy: (H - s * ih) / 2 }; };
// a visual on each panel: the panel's box on the page, inside the page, 8 in from its edges
const onPanels = (layout, iw, ih, fit) => { const q = place(iw, ih, fit);
  return LAYOUTS[layout].panels.map((p) => { const x0 = Math.max(0, q.ox + q.s * p.at[0] * iw), y0 = Math.max(0, q.oy + q.s * p.at[1] * ih), x1 = Math.min(W, q.ox + q.s * p.at[2] * iw), y1 = Math.min(H, q.oy + q.s * p.at[3] * ih);
    return { panel: p.id, x: Math.round(x0 + 8), y: Math.round(y0 + 8), w: Math.round(x1 - x0 - 16), h: Math.round(y1 - y0 - 16) }; }).filter((b) => b.w > 10 && b.h > 10); };
const vis = (name, type, b, extra) => ({ $schema: SCHEMA + 'visualContainer/2.1.0/schema.json', name, position: { x: b.x, y: b.y, z: b.z || 1000, width: b.w, height: b.h, tabOrder: b.z || 1000 }, visual: Object.assign({ visualType: type }, extra || {}) });
function report(name, pages, pictures) {
  const dir = path.join(ROOT, 'S', name + '.Report'), w = (rel, o) => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof o === 'string' || o instanceof Uint8Array ? o : JSON.stringify(o, null, 2)); };
  fs.writeFileSync(path.join(ROOT, 'S', name + '.pbip'), JSON.stringify({ version: '1.0', artifacts: [{ report: { path: name + '.Report' } }], settings: { enableAutoRecovery: true } }));
  w('definition.pbir', { version: '4.0', datasetReference: { byPath: { path: '../' + MODEL } } });
  w('definition/version.json', { $schema: SCHEMA + 'versionMetadata/1.0.0/schema.json', version: '2.0.0' });
  w('definition/report.json', { $schema: SCHEMA + 'report/2.1.0/schema.json', themeCollection: {}, resourcePackages: [{ name: 'RegisteredResources', type: 'RegisteredResources', items: Object.keys(pictures).map((n) => ({ name: n, path: n, type: 'Image' })) }] });
  Object.entries(pictures).forEach(([n, b]) => w('StaticResources/RegisteredResources/' + n, b));
  w('definition/pages/pages.json', { $schema: SCHEMA + 'pagesMetadata/1.0.0/schema.json', pageOrder: pages.map((p) => p.id), activePageName: pages[0].id });
  pages.forEach((pg) => { w(`definition/pages/${pg.id}/page.json`, Object.assign({ $schema: SCHEMA + 'page/2.0.0/schema.json', name: pg.id, displayName: pg.name, displayOption: 'FitToPage', width: W, height: H }, pg.objects ? { objects: pg.objects } : {}));
    pg.visuals.forEach((v) => w(`definition/pages/${pg.id}/visuals/${v.name}/visual.json`, v)); });
  return { pbip: path.join('S', name + '.pbip'), dir };
}
const filesOf = (dir) => { const out = {}; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else out[path.relative(dir, p).split(path.sep).join('/')] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }); walk(dir); return out; };

// two reports of 9 picture pages each (3 layouts x 3 fits), one on PNGs drawn here, one on the JPEG copies
const pagesFor = (ext) => { const pages = [], pictures = {};
  Object.keys(LAYOUTS).forEach((layout) => FITS.forEach((fit) => {
    const size = fit === 'Normal' ? 'narrow' : 'wide', [iw, ih] = SIZES[size], file = `${layout}-${size}.${ext}`;
    pictures[file] = ext === 'png' ? pngOf(iw, ih, draw(layout, iw, ih)) : fs.readFileSync(path.join(FIX, `${layout}-${size}.jpg`));
    const boxes = onPanels(layout, iw, ih, fit), id = `${layout}${fit}`;
    pages.push({ id, name: `${layout} ${fit}`, layout, fit, iw, ih, boxes, objects: { background: [{ properties: { image: imageOf(file, fit), transparency: L('0D') } }] },
      visuals: boxes.map((b, i) => vis(`${id}v${i}`, i === boxes.length - 1 ? 'textbox' : 'shape', b, i === boxes.length - 1 ? { objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: 'Calls' }] }] } }] } } : null)) });
  }));
  return { pages, pictures };
};
const PNGS = pagesFor('png'), JPGS = pagesFor('jpg');
const RP = report('Pictures PNG', PNGS.pages, PNGS.pictures), RJ = report('Pictures JPG', JPGS.pages, JPGS.pictures);
// a third report: a picture with words painted in it, a wallpaper picture, a badge on a text box
const WORDS = { 'words.png': pngOf(400, 250, draw('cols', 400, 250, { words: true })), 'wall.png': pngOf(64, 36, draw('rail', 64, 36)), 'band.png': pngOf(520, 360, draw('band', 520, 360)) };
const RW = report('Pictures Words', [
  { id: 'wordsPage', name: 'Words', visuals: onPanels('cols', 400, 250, 'Fit').map((b, i) => vis('wv' + i, 'shape', b)), objects: { background: [{ properties: { image: imageOf('words.png', 'Fit'), transparency: L('0D') } }] } },
  { id: 'wallPage', name: 'Wallpaper', visuals: [vis('wallv', 'shape', { x: 20, y: 20, w: 200, h: 100 })], objects: { outspace: [{ properties: { image: imageOf('wall.png', 'Fit') } }] } },
  // (a text box on the band's small square, narrower than its text: the twin's text fitting widens it off the square)
  { id: 'tightPage', name: 'Tight', visuals: onPanels('band', 520, 360, 'Normal').map((b, i) => vis('tv' + i, i === 1 ? 'textbox' : 'shape', b, i === 1 ? { objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: 'Calls answered' }] }] } }] } } : null)), objects: { background: [{ properties: { image: imageOf('band.png', 'Normal'), transparency: L('0D') } }] } },
  { id: 'badgePage', name: 'Badge', visuals: [vis('host', 'textbox', { x: 20, y: 280, w: 300, h: 60, z: 1000 }, { objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: 'Calls answered' }] }] } }] } }), vis('badge', 'textbox', { x: 280, y: 295, w: 30, h: 30, z: 2000 }, { objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: '%' }] }] } }] } })] }], WORDS);
const before = [RP, RJ, RW].map((r) => filesOf(r.dir));

const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' }), call = s.call;
let lastPage = '';
async function approve(pid) {
  const n = links().length; await call('approve_plan', { planId: pid });
  for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
  const url = links()[n] || ''; if (url) { lastPage = await httpReq(url, 'GET'); await httpReq(url, 'POST', 'decision=approve'); await call('approve_plan', { planId: pid }); }
}
async function write(a) {
  const p = await call('create_arabic_twin', a), id = p.j && p.j.plan && p.j.plan.planId; if (!id) return { err: true, t: 'no plan: ' + short(p), plan: p };
  await approve(id); const w = await call('create_arabic_twin', Object.assign({}, a, { planId: id }));
  return Object.assign(w, { plan: p, page: lastPage, dir: w.j && w.j.report ? path.join(ROOT, String(w.j.pbip || '').replace(/\\/g, '/').replace(/\.pbip$/, '.Report')) : null });
}
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const bgOf = (pj, k) => { const e = (((pj || {}).objects || {})[k || 'background'] || [])[0], im = e && e.properties && e.properties.image && e.properties.image.image; return im ? { name: lit(im.name), item: im.url && im.url.expr && im.url.expr.ResourcePackageItem ? im.url.expr.ResourcePackageItem.ItemName : null, fit: lit(im.scaling) } : null; };
const near = (rgb, list) => { let best = null, d = 1e9; list.forEach((c) => { const e = Math.hypot(rgb[0] - c.rgb[0], rgb[1] - c.rgb[1], rgb[2] - c.rgb[2]); if (e < d) { d = e; best = c.id; } }); return d < 40 ? best : null; };

// ---------- P, O, A: the two reports ----------
async function picturesOf(R, set, label, extra) {
  const w = await write(Object.assign({ path: R.pbip, arabicMonth: false }, extra || {}));
  chk(() => !w.err && w.dir, () => `${label}: the twin written: ${short(w)}`);
  if (w.err || !w.dir) return w;
  const rj = rd(path.join(w.dir, 'definition/report.json')), reg = new Set(((rj.resourcePackages || []).find((x) => x.name === 'RegisteredResources') || { items: [] }).items.map((x) => x.name));
  set.pages.forEach((pg) => {
    const pj = rd(path.join(w.dir, 'definition/pages', pg.id, 'page.json')), bg = bgOf(pj), orig = bgOf(rd(path.join(R.dir, 'definition/pages', pg.id, 'page.json')));
    // (a page still on the original JPEG: that JPEG is the drawing, so the drawing's pixels stand for it)
    let pic = null; try { pic = /\.jpg$/.test(bg.name) ? { width: pg.iw, height: pg.ih, data: draw(pg.layout, pg.iw, pg.ih), jpeg: true } : PNG.sync.read(fs.readFileSync(path.join(w.dir, 'StaticResources/RegisteredResources', bg.name))); } catch (e) { pic = null; }
    // the Arabic page's picture: a new PNG, registered, the English picture flipped (Normal: drawn on the page first)
    const want = pg.fit === 'Normal' ? [W, H] : [pg.iw, pg.ih], src = draw(pg.layout, pg.iw, pg.ih);
    const flipped = () => { if (!pic || pic.jpeg || pic.width !== want[0] || pic.height !== want[1]) return false; const jpg = /\.jpg$/.test(orig.name);
      let worst = 0; for (let y = 2; y < want[1] - 2; y += 2) for (let x = 2; x < want[0] - 2; x += 2) { const sx = want[0] - 1 - x, i = (y * want[0] + x) * 4;
        if (sx >= pg.iw || y >= pg.ih) { if (pic.data[i + 3] !== 0) return false; continue; }
        const j = (y * pg.iw + sx) * 4; if (jpg && LAYOUTS[pg.layout].panels.concat([{ at: [0, 0, 1, 1] }]).some((p) => [p.at[0] * pg.iw, p.at[2] * pg.iw].some((e) => Math.abs(sx - e) < 4) || [p.at[1] * pg.ih, p.at[3] * pg.ih].some((e) => Math.abs(y - e) < 4))) continue;
        for (let c = 0; c < 3; c++) worst = Math.max(worst, Math.abs(pic.data[i + c] - src[j + c])); }
      return worst <= (jpg ? 14 : 0); };
    chk(() => bg && bg.name !== orig.name && bg.item === bg.name && /\.png$/.test(bg.name) && reg.has(bg.name) && bg.fit === pg.fit && flipped(), () => `${label} P ${pg.id}: the Arabic page on a new picture, the English one flipped${pg.fit === 'Normal' ? ' (drawn on the 640 x 360 page first)' : ''}: ${JSON.stringify(bg)} ${pic ? pic.width + 'x' + pic.height : 'no PNG'}`);
    // every visual mirrored, and on the same panel of the picture under it
    const cols = [{ id: 'frame', rgb: LAYOUTS[pg.layout].frame }].concat(LAYOUTS[pg.layout].panels);
    // (the panel under 5 points of a box: its centre and near its corners; the English box's points taken mirrored, so
    // each Arabic point is compared with the English point it mirrors)
    const PTS = [[0.5, 0.5], [0.05, 0.05], [0.95, 0.05], [0.05, 0.95], [0.95, 0.95]];
    const sample = (img, b, fit, mirrored) => { if (!img) return []; const q = place(img.width, img.height, fit); return PTS.map(([fx, fy]) => {
      const px = Math.floor((b.x + (mirrored ? 1 - fx : fx) * b.w - q.ox) / q.s), py = Math.floor((b.y + fy * b.h - q.oy) / q.s); if (px < 0 || py < 0 || px >= img.width || py >= img.height) return null; const i = (py * img.width + px) * 4; return near([img.data[i], img.data[i + 1], img.data[i + 2]], cols); }); };
    const under = (b) => sample(pic, b, pg.fit, false), enUnder = (b) => sample({ width: pg.iw, height: pg.ih, data: src }, b, pg.fit, true);
    const off = pg.boxes.map((b, i) => { const v = rd(path.join(w.dir, 'definition/pages', pg.id, 'visuals', `${pg.id}v${i}`, 'visual.json')).position, ab = { x: v.x, y: v.y, w: v.width, h: v.height };
      const u = under(ab), e = enUnder(b); return v.x === W - b.x - b.w && u.length === 5 && u[0] === b.panel && JSON.stringify(u) === JSON.stringify(e) ? null : `${pg.id}v${i} at ${v.x} (mirrored ${W - b.x - b.w}) on ${JSON.stringify(u)}, was on ${JSON.stringify(e)}`; }).filter(Boolean);
    chk(() => !off.length, () => `${label} P ${pg.id}: every visual mirrored onto its panel: ${off.join('; ')}`);
  });
  return w;
}
const wp = await picturesOf(RP, PNGS, 'PNG');
await picturesOf(RJ, JPGS, 'JPEG (mirrorPicturePages true)', { mirrorPicturePages: true });
chk(() => JSON.stringify(filesOf(RP.dir)) === JSON.stringify(before[0]), () => 'O1: the PNG report\'s files byte-identical after its twin');
chk(() => JSON.stringify(filesOf(RJ.dir)) === JSON.stringify(before[1]), () => 'O2: the JPEG report\'s files byte-identical after its twin');
const said = ((wp.plan && wp.plan.j && wp.plan.j.picturePages) || []);
chk(() => said.length === 9 && said.every((x) => x.picture === 'flipped') && said.filter((x) => x.fit === 'Normal').every((x) => x.padded === true) && said.filter((x) => x.fit !== 'Normal').every((x) => x.padded === false) && said.every((x) => /flipped/.test(x.what)),
  () => `A1: the plan says each picture page flipped, its fit and whether it was padded: ${JSON.stringify(said).slice(0, 500)}`);
// (the twin's approval page is wholly Arabic, FX1: one row per picture page, its English in the plan's answer, A1)
const rows = (wp.page || '').split('صفحة على صورة').length - 1, padded = (wp.page || '').split('بعد رسمها على حجم الصفحة').length - 1;
chk(() => rows === 9 && padded === 3, () => `A2: the approval page has a row for each of the 9 picture pages, the 3 Normal ones said drawn on the page first: ${rows} rows, ${padded} padded`);
chk(() => (wp.page || '').split('الصورة معكوسة أفقيًا').length - 1 === 9, () => 'A3: the approval page says each picture flipped, in Arabic');
// the plan's exact files (their digest, which the approval records) hold the 9 new pictures, as written
chk(() => wp.j && wp.plan.j.exact && wp.plan.j.exact.files === Object.keys(before[0]).length + 9 + 2 && wp.j.exact.digest === wp.plan.j.exact.digest, () => `A4: the plan's exact files hold the new pictures (${Object.keys(before[0]).length} + 9 + .platform + the .pbip): ${JSON.stringify(wp.plan && wp.plan.j && wp.plan.j.exact)}`);

// ---------- T, W, V: words in a picture, a wallpaper, a badge on a text box ----------
{
  const p0 = await call('create_arabic_twin', { path: RW.pbip, arabicMonth: false }), pp = (p0.j && p0.j.picturePages) || [], wd = pp.find((x) => x.page === 'wordsPage');
  chk(() => wd && wd.picture === 'asked' && /may contain words or a logo that will read backwards/.test(wd.what) && p0.j.pages.find((x) => x.id === 'wordsPage').leftToRight, () => `T1: a picture with words is asked, its page kept left to right until approved: ${JSON.stringify(pp)}`);
  const w = await write({ path: RW.pbip, arabicMonth: false, flipPictures: ['wordsPage'] });
  const pj = w.dir ? rd(path.join(w.dir, 'definition/pages/wordsPage/page.json')) : null;
  chk(() => !w.err && bgOf(pj).name !== 'words.png' && rd(path.join(w.dir, 'definition/pages/wordsPage/visuals/wv0/visual.json')).position.x !== onPanels('cols', 400, 250, 'Fit')[0].x, () => `T2: approved (flipPictures), the picture is flipped and the page mirrored: ${short(w)}`);
  const wall = pp.find((x) => x.page === 'wallPage'), wpj = w.dir ? rd(path.join(w.dir, 'definition/pages/wallPage/page.json')) : null;
  chk(() => wall && wall.picture === 'kept' && /wallpaper/.test(wall.what) && bgOf(wpj, 'outspace').name === 'wall.png' && rd(path.join(w.dir, 'definition/pages/wallPage/visuals/wallv/visual.json')).position.x === W - 220, () => `W1: a wallpaper picture kept as it is (the page mirrored), and said: ${JSON.stringify(wall)}`);
  const hx = w.dir ? rd(path.join(w.dir, 'definition/pages/badgePage/visuals/host/visual.json')).position : null, bx = w.dir ? rd(path.join(w.dir, 'definition/pages/badgePage/visuals/badge/visual.json')).position : null;
  chk(() => hx.x === W - 320 && bx.x === hx.x + 10, () => `V1: a badge at the end of a left-aligned text box goes to its other end with the text (host ${hx && hx.x}, badge ${bx && bx.x}, want ${W - 320 + 10})`);
  // (item 2) a visual that leaves its panel once mirrored (here: widened by the text fitting) is named by page and visual
  const off = ((p0.j && p0.j.pictureChecks && p0.j.pictureChecks.offPanel) || []);
  chk(() => off.some((x) => /tightPage\/tv1/.test(x.where) && /panel/.test(x.what)) && !off.some((x) => /tv0|tv2|wordsPage|badgePage/.test(x.where)), () => `V3: a text box widened off its panel is named in the plan by page and visual, and only it: ${JSON.stringify(p0.j && p0.j.pictureChecks)} ${JSON.stringify(pp.find((x) => x.page === "tightPage"))} ${JSON.stringify((p0.j.fitted || {}).textboxes)}`);
  chk(() => JSON.stringify(filesOf(RW.dir)) === JSON.stringify(before[2]), () => 'O3: the third report\'s files byte-identical');
}
chk(() => { const o = PP.newOverlaps([{ name: 'a', position: { x: 0, y: 0, width: 100, height: 50 } }, { name: 'b', position: { x: 120, y: 0, width: 100, height: 50 } }], [{ name: 'a', position: { x: 540, y: 0, width: 100, height: 50 } }, { name: 'b', position: { x: 500, y: 0, width: 100, height: 50 } }]); return o.length === 1 && o[0].visuals.join() === 'a,b'; },
  () => 'V2: a new overlap between two visuals is named');

// ---------- X: the copy holding both languages ----------
{
  const w = await write({ path: RP.pbip, arabicMonth: false, into: 'same' });
  const pairs = (w.plan && w.plan.j && w.plan.j.languages && w.plan.j.languages.pairs) || [];
  const rj = w.dir ? rd(path.join(w.dir, 'definition/report.json')) : null, reg = new Set(rj ? ((rj.resourcePackages || []).find((x) => x.name === 'RegisteredResources') || { items: [] }).items.map((x) => x.name) : []);
  const ar = pairs.map((x) => (w.dir ? bgOf(rd(path.join(w.dir, 'definition/pages', x.arabic.id, 'page.json'))) : null)), en = pairs.map((x) => (w.dir ? bgOf(rd(path.join(w.dir, 'definition/pages', x.english.id, 'page.json'))) : null));
  chk(() => !w.err && pairs.length === 9 && ar.every((b) => b && /\.png$/.test(b.name) && !/^[a-z]+-(wide|narrow)\.png$/.test(b.name) && reg.has(b.name) && fs.existsSync(path.join(w.dir, 'StaticResources/RegisteredResources', b.name))), () => `X1: the copy's Arabic pages on their own new pictures, registered: ${JSON.stringify(ar).slice(0, 300)} ${short(w)}`);
  chk(() => en.every((b) => b && /^[a-z]+-(wide|narrow)\.png$/.test(b.name)), () => `X2: the copy's English pages keep the original pictures: ${JSON.stringify(en).slice(0, 300)}`);
}

await s.close();
[ROOT, LOGS].forEach((d) => { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { /* left for the OS */ } });
if (problems.length) { console.log(`FAIL script=test-0.3.1-mp1.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  mp1  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  mp1  ${checks} checks`);
