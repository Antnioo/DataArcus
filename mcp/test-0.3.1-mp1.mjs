// 0.3.1 MP1: a page drawn on a picture is mirrored in the Arabic twin (D-1029-03): its picture flipped left to right and
// its visuals mirrored onto it, each on the same panel. Each check written red first. Made-up reports on the sample
// project's model, their pictures drawn by the test (fixtures/mp1/draw.mjs; the JPEGs are those drawings saved by
// another encoder): never a real report, never data values.
//   D1-D8  the picture reader (lib/page-picture.mjs): PNG as pngjs writes it (RGBA, RGB, grey, grey and alpha, palette,
//          16 bits, interlaced), a baseline JPEG of the website (within a few levels of Pillow's reading), a
//          progressive one and one with restart markers (within a few levels of the drawing); D10 a PNG that
//          inflates far past its size refused
//   P      18 made-up pages (a left rail and 2 panels; 3 card columns; a header band) x (Normal narrower than the page,
//          Fit, Fill) x (PNG, JPEG): each Arabic page on a new PNG, the English picture flipped (Normal: drawn on the
//          page first), and every visual mirrored onto the same panel (the JPEG report asked with mirrorPicturePages,
//          which before wrote the original picture under mirrored visuals)
//   O1-O2  the original reports' files byte-identical
//   A1-A4  the plan says per page flipped (its fit; MP1b: never padded) in English and Arabic, the approval page (wholly Arabic, FX1) a
//          row per page, the plan's exact files (its digest) hold the new pictures
//   T1-T2  a picture with words in it: asked, its page kept left to right until flipPictures names it; then flipped
//   W1     a wallpaper picture (outspace) kept as it is, and said
//   X1-X2  the copy holding both languages: the Arabic pages on the new pictures, registered; the English untouched
//   N, F1-F2 (MP1b) the laptop's two Normal shapes (centred by Desktop) flipped as they are, each visual on its panel;
//          the placement as Desktop 2.159 measured it; the box check on a stretched Fit picture
//   R1-R7  (MP1b) laptop part 6's real shapes: a picture with a label and a file name, an emptied picture, a bar chart
//          beside a table of other fields, nested groups, KPI icons beside and on titles, a help box's button
//   MC     (MP1c) laptop part 7's shapes: a tab-indented KPI title, a bar chart on a matrix's margin, a small bar chart
//          over a table, help lines with neutral ends (V3 wrap), and the overlap check naming such pairs
//   V1-V3  a badge on a text box mirrored within it (no new overlap with its text); a new overlap named; a text box the
//          fitting widens off its panel named by page and visual
//   node test-0.3.1-mp1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
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
  // a crafted PNG (100 x 100) whose data inflates to 50 MB: refused, the memory never filled
  const be = (v) => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255], ck = (t, d) => { const c = Buffer.alloc(12 + d.length); c.set(be(d.length)); c.write(t, 4, 'latin1'); c.set(d, 8); return c; };
  const bomb = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]), ck('IHDR', Buffer.from(be(100).concat(be(100), [8, 2, 0, 0, 0]))), ck('IDAT', zlib.deflateSync(Buffer.alloc(50e6))), ck('IEND', Buffer.alloc(0))]);
  chk(() => { const r = rd(bomb); return r && r.why && !r.rgba; }, () => 'D10: a PNG whose data inflates far past its size is refused');
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
// (MP1b: as Desktop 2.159 places a page picture, measured by laptop part 6 block B, scripts/tests/DESKTOP-TESTS.md:
// Normal centred at scale 1, Fit stretched to the page, Fill centred at the larger scale)
const place = (iw, ih, fit) => { if (fit === 'Fit') return { sx: W / iw, sy: H / ih, ox: 0, oy: 0 }; const s = fit === 'Fill' ? Math.max(W / iw, H / ih) : 1; return { sx: s, sy: s, ox: (W - s * iw) / 2, oy: (H - s * ih) / 2 }; };
// a visual on each panel: the panel's box on the page, inside the page, 8 in from its edges
const onPanels = (layout, iw, ih, fit) => { const q = place(iw, ih, fit);
  return LAYOUTS[layout].panels.map((p) => { const x0 = Math.max(0, q.ox + q.sx * p.at[0] * iw), y0 = Math.max(0, q.oy + q.sy * p.at[1] * ih), x1 = Math.min(W, q.ox + q.sx * p.at[2] * iw), y1 = Math.min(H, q.oy + q.sy * p.at[3] * ih);
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
// (MP1b) the laptop's two Normal shapes on the 640 x 360 page: 520 x 360 and 400 x 250, each centred by Desktop
const NORMALS = (() => { const pages = [], pictures = {};
  [['rail', 520, 360], ['cols', 400, 250]].forEach(([layout, iw, ih]) => { const file = `n-${layout}-${iw}.png`, id = `n${layout}${iw}`, boxes = onPanels(layout, iw, ih, 'Normal');
    pictures[file] = pngOf(iw, ih, draw(layout, iw, ih));
    pages.push({ id, name: `${layout} ${iw} Normal`, layout, fit: 'Normal', iw, ih, boxes, objects: { background: [{ properties: { image: imageOf(file, 'Normal'), transparency: L('0D') } }] }, visuals: boxes.map((b, i) => vis(`${id}v${i}`, 'shape', b)) }); });
  return { pages, pictures }; })();
const RN = report('Pictures Normal', NORMALS.pages, NORMALS.pictures), RP = report('Pictures PNG', PNGS.pages, PNGS.pictures), RJ = report('Pictures JPG', JPGS.pages, JPGS.pictures);
// a third report: a picture with words painted in it, a wallpaper picture, a badge on a text box
const WORDS = { 'words.png': pngOf(400, 250, draw('cols', 400, 250, { words: true })), 'wall.png': pngOf(64, 36, draw('rail', 64, 36)), 'band.png': pngOf(520, 360, draw('band', 520, 360)), 'band-wide.png': pngOf(400, 250, draw('band', 400, 250)) };
const RW = report('Pictures Words', [
  { id: 'wordsPage', name: 'Words', visuals: onPanels('cols', 400, 250, 'Fit').map((b, i) => vis('wv' + i, 'shape', b)), objects: { background: [{ properties: { image: imageOf('words.png', 'Fit'), transparency: L('0D') } }] } },
  { id: 'wallPage', name: 'Wallpaper', visuals: [vis('wallv', 'shape', { x: 20, y: 20, w: 200, h: 100 })], objects: { outspace: [{ properties: { image: imageOf('wall.png', 'Fit') } }] } },
  // (a text box on the band's small square, narrower than its text: the twin's text fitting widens it off the square)
  { id: 'tightPage', name: 'Tight', visuals: onPanels('band', 520, 360, 'Normal').map((b, i) => vis('tv' + i, i === 1 ? 'textbox' : 'shape', b, i === 1 ? { objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: 'Calls answered' }] }] } }] } } : null)), objects: { background: [{ properties: { image: imageOf('band.png', 'Normal'), transparency: L('0D') } }] } },
  // (MP1b) the same on a Fit picture that is not page-shaped (400 x 250 stretched to 640 x 360)
  { id: 'tightFit', name: 'Tight Fit', visuals: onPanels('band', 400, 250, 'Fit').map((b, i) => vis('tf' + i, i === 1 ? 'textbox' : 'shape', b, i === 1 ? { objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: 'Calls answered' }] }] } }] } } : null)), objects: { background: [{ properties: { image: imageOf('band-wide.png', 'Fit'), transparency: L('0D') } }] } },
  { id: 'badgePage', name: 'Badge', visuals: [vis('host', 'textbox', { x: 20, y: 280, w: 300, h: 60, z: 1000 }, { objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: 'Calls answered' }] }] } }] } }), vis('badge', 'textbox', { x: 280, y: 295, w: 30, h: 30, z: 2000 }, { objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: '%' }] }] } }] } })] }], WORDS);
// (MP1b, laptop part 6 on the owner's dashboards, made up here in their shapes) a picture Desktop writes with two names
// (image.name the author's label, url's ItemName the file), an emptied picture, a bar chart beside a table of other
// fields (in a group, and a nested group), KPI icons beside and on titles, a help box's button over its text
const C = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
const Me = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
const hidden = { categoryAxis: [{ properties: { show: L('false') } }] }, text = (t) => ({ objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: t }] }] } }] } });
const inG = (v, g) => Object.assign(v, { parentGroupName: g }), group = (name, b) => ({ $schema: SCHEMA + 'visualContainer/2.1.0/schema.json', name, position: { x: b.x, y: b.y, z: 1, width: b.w, height: b.h, tabOrder: 1 }, visualGroup: { displayName: name, groupMode: 'ScaleMode' } });
const twoNames = (label, file, fit) => ({ image: { name: S(label), url: { expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: file } } }, scaling: S(fit) } });
const REAL = { 'gradient-background4528801825573012.png': pngOf(400, 250, draw('rail', 400, 250)) };
const RR = report('Real Shapes', [
  { id: 'named', name: 'Named', visuals: onPanels('rail', 400, 250, 'Fit').map((b, i) => vis('nm' + i, 'shape', b)), objects: { background: [{ properties: { image: twoNames('gradient-background.png', 'gradient-background4528801825573012.png', 'Fit'), transparency: L('0D') } }] } },
  { id: 'emptied', name: 'Emptied', visuals: [vis('ev', 'shape', { x: 20, y: 20, w: 200, h: 100 })], objects: { background: [{ properties: { image: { image: { name: S(''), url: S(''), scaling: S('Fit') } }, transparency: L('0D') } }] } },
  { id: 'row', name: 'Row', visuals: [group('g1', { x: 20, y: 20, w: 600, h: 150 }),
    inG(vis('dept', 'clusteredBarChart', { x: 0, y: 0, w: 300, h: 150 }, { query: { queryState: { Category: { projections: [C('Branches', 'Country')] }, Y: { projections: [Me('All Measures', 'Visits')] } } }, objects: hidden }), 'g1'),
    inG(vis('ratings', 'tableEx', { x: 310, y: 0, w: 290, h: 150 }, { query: { queryState: { Values: { projections: [Me('All Measures', 'Repeat Rate')] } } } }), 'g1'),
    group('g2', { x: 20, y: 200, w: 400, h: 120 }), inG(group('g3', { x: 100, y: 10, w: 250, h: 100 }), 'g2'), inG(vis('deep', 'shape', { x: 10, y: 10, w: 60, h: 60 }), 'g3')] },
  { id: 'kpi', name: 'KPI', visuals: [vis('card', 'shape', { x: 20, y: 20, w: 280, h: 100, z: 1000 }), vis('ktitle', 'textbox', { x: 40, y: 30, w: 160, h: 30, z: 2000 }, text('Calls')), vis('kicon', 'image', { x: 250, y: 30, w: 30, h: 30, z: 3000 }),
    vis('ncard', 'cardVisual', { x: 20, y: 140, w: 280, h: 100, z: 1000 }, { query: { queryState: { Data: { projections: [Me('All Measures', 'Visits')] } } }, visualContainerObjects: { title: [{ properties: { show: L('true'), text: S('Resolution') } }] } }),
    vis('nicon', 'image', { x: 260, y: 150, w: 30, h: 30, z: 3000 })] },
  { id: 'help', name: 'Help', visuals: [vis('box', 'shape', { x: 140, y: 100, w: 360, h: 200, z: 1000 }), vis('gotit', 'actionButton', { x: 400, y: 250, w: 70, h: 30, z: 2000 }), vis('helptext', 'textbox', { x: 160, y: 110, w: 320, h: 180, z: 3000 }, text('Pick a branch to see its calls'))] }], REAL);
// (MP1c, laptop part 7 on the owner's dashboards, made up here in their shapes) a KPI title indented by a tab run under
// its icon; a bar chart overlapping a matrix's right margin; a small bar chart over a one-column table; help lines
// with a digit and a full stop at their ends
const runs = (...vs) => ({ objects: { general: [{ properties: { paragraphs: [{ textRuns: vs.map((value) => ({ value })) }] } }] } });
const RC = report('Part Seven', [
  { id: 'kpiTab', name: 'KPI tab', visuals: [vis('ktab', 'textbox', { x: 20, y: 20, w: 200, h: 40, z: 1000 }, runs('\t\t\t\t\t', 'Calls')), vis('ticon', 'image', { x: 22, y: 25, w: 30, h: 30, z: 2000 })] },
  { id: 'erRow', name: 'ER row', visuals: [vis('heat', 'pivotTable', { x: 20, y: 20, w: 300, h: 200, z: 1000 }, { query: { queryState: { Rows: { projections: [C('Branches', 'Country')] }, Values: { projections: [Me('All Measures', 'Visits')] } } } }),
    vis('wk', 'clusteredBarChart', { x: 296, y: 20, w: 200, h: 200, z: 2000 }, { query: { queryState: { Category: { projections: [C('Branches', 'Country')] }, Y: { projections: [Me('All Measures', 'Visits')] } } }, objects: hidden })] },
  { id: 'ratings', name: 'Ratings', visuals: [vis('rt', 'tableEx', { x: 20, y: 260, w: 300, h: 80, z: 1000 }, { query: { queryState: { Values: { projections: [Me('All Measures', 'Repeat Rate')] } } } }),
    vis('rb', 'clusteredBarChart', { x: 170, y: 265, w: 140, h: 70, z: 2000 }, { query: { queryState: { Category: { projections: [C('Branches', 'Country')] }, Y: { projections: [Me('All Measures', 'Visits')] } } }, objects: hidden })] },
  { id: 'helpLines', name: 'Help lines', visuals: [vis('h1', 'textbox', { x: 20, y: 20, w: 400, h: 40 }, runs('1 Pick an order to see its status.')), vis('h2', 'textbox', { x: 20, y: 80, w: 400, h: 40 }, runs('Pick an order'))] }], {});
const before = [RP, RJ, RW, RN, RR, RC].map((r) => filesOf(r.dir));

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
    // the Arabic page's picture: a new PNG, registered, the English picture flipped as it is (MP1b: its own size, every fit)
    const want = [pg.iw, pg.ih], src = draw(pg.layout, pg.iw, pg.ih);
    const flipped = () => { if (!pic || pic.jpeg || pic.width !== want[0] || pic.height !== want[1]) return false; const jpg = /\.jpg$/.test(orig.name);
      let worst = 0; for (let y = 2; y < want[1] - 2; y += 2) for (let x = 2; x < want[0] - 2; x += 2) { const sx = want[0] - 1 - x, i = (y * want[0] + x) * 4;
        if (sx >= pg.iw || y >= pg.ih) { if (pic.data[i + 3] !== 0) return false; continue; }
        const j = (y * pg.iw + sx) * 4; if (jpg && LAYOUTS[pg.layout].panels.concat([{ at: [0, 0, 1, 1] }]).some((p) => [p.at[0] * pg.iw, p.at[2] * pg.iw].some((e) => Math.abs(sx - e) < 4) || [p.at[1] * pg.ih, p.at[3] * pg.ih].some((e) => Math.abs(y - e) < 4))) continue;
        for (let c = 0; c < 3; c++) worst = Math.max(worst, Math.abs(pic.data[i + c] - src[j + c])); }
      return worst <= (jpg ? 14 : 0); };
    chk(() => bg && bg.name !== orig.name && bg.item === bg.name && /\.png$/.test(bg.name) && reg.has(bg.name) && bg.fit === pg.fit && flipped(), () => `${label} P ${pg.id}: the Arabic page on a new picture, the English one flipped: ${JSON.stringify(bg)} ${pic ? pic.width + 'x' + pic.height : 'no PNG'}`);
    // every visual mirrored, and on the same panel of the picture under it
    const cols = [{ id: 'frame', rgb: LAYOUTS[pg.layout].frame }].concat(LAYOUTS[pg.layout].panels);
    // (the panel under 5 points of a box: its centre and near its corners; the English box's points taken mirrored, so
    // each Arabic point is compared with the English point it mirrors)
    const PTS = [[0.5, 0.5], [0.05, 0.05], [0.95, 0.05], [0.05, 0.95], [0.95, 0.95]];
    const sample = (img, b, fit, mirrored) => { if (!img) return []; const q = place(img.width, img.height, fit); return PTS.map(([fx, fy]) => {
      const px = Math.floor((b.x + (mirrored ? 1 - fx : fx) * b.w - q.ox) / q.sx), py = Math.floor((b.y + fy * b.h - q.oy) / q.sy); if (px < 0 || py < 0 || px >= img.width || py >= img.height) return null; const i = (py * img.width + px) * 4; return near([img.data[i], img.data[i + 1], img.data[i + 2]], cols); }); };
    const under = (b) => sample(pic, b, pg.fit, false), enUnder = (b) => sample({ width: pg.iw, height: pg.ih, data: src }, b, pg.fit, true);
    const off = pg.boxes.map((b, i) => { const v = rd(path.join(w.dir, 'definition/pages', pg.id, 'visuals', `${pg.id}v${i}`, 'visual.json')).position, ab = { x: v.x, y: v.y, w: v.width, h: v.height };
      const u = under(ab), e = enUnder(b); return v.x === W - b.x - b.w && u.length === 5 && u[0] === b.panel && JSON.stringify(u) === JSON.stringify(e) ? null : `${pg.id}v${i} at ${v.x} (mirrored ${W - b.x - b.w}) on ${JSON.stringify(u)}, was on ${JSON.stringify(e)}`; }).filter(Boolean);
    chk(() => !off.length, () => `${label} P ${pg.id}: every visual mirrored onto its panel: ${off.join('; ')}`);
  });
  return w;
}
const wp = await picturesOf(RP, PNGS, 'PNG');
await picturesOf(RJ, JPGS, 'JPEG (mirrorPicturePages true)', { mirrorPicturePages: true });
// N (MP1b, red on d9d3ae98): Normal is centred by Desktop, so its picture is flipped as it is (its own size, no padding)
// and each visual mirrored onto it sits on the same panel
await picturesOf(RN, NORMALS, 'N (Normal centred)');
chk(() => JSON.stringify(filesOf(RP.dir)) === JSON.stringify(before[0]), () => 'O1: the PNG report\'s files byte-identical after its twin');
chk(() => JSON.stringify(filesOf(RJ.dir)) === JSON.stringify(before[1]), () => 'O2: the JPEG report\'s files byte-identical after its twin');
const said = ((wp.plan && wp.plan.j && wp.plan.j.picturePages) || []);
chk(() => said.length === 9 && said.every((x) => x.picture === 'flipped') && said.every((x) => x.padded === undefined && !/drawn on the page|padded/.test(x.what)) && said.every((x) => /flipped/.test(x.what)),
  () => `A1: the plan says each picture page flipped, its fit, never padded (MP1b): ${JSON.stringify(said).slice(0, 500)}`);
// (the twin's approval page is wholly Arabic, FX1: one row per picture page, its English in the plan's answer, A1)
const rows = (wp.page || '').split('صفحة على صورة').length - 1, padded = (wp.page || '').split('بعد رسمها على حجم الصفحة').length - 1;
chk(() => rows === 9 && padded === 0, () => `A2: the approval page has a row for each of the 9 picture pages, none said drawn on the page first (MP1b): ${rows} rows, ${padded} padded`);
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
  chk(() => off.some((x) => /tightPage\/tv1/.test(x.where) && /panel/.test(x.what)) && !off.some((x) => /tv0|tv2|tf0|tf2|wordsPage|badgePage/.test(x.where)), () => `V3: a text box widened off its panel is named in the plan by page and visual, and only it: ${JSON.stringify(p0.j && p0.j.pictureChecks)} ${JSON.stringify(pp.find((x) => x.page === "tightPage"))} ${JSON.stringify((p0.j.fitted || {}).textboxes)}`);
  chk(() => off.some((x) => /tightFit\/tf1/.test(x.where)), () => `F2 (MP1b): on a Fit picture not page-shaped (stretched), the text box widened off its panel is named: ${JSON.stringify(off)}`);
  chk(() => JSON.stringify(filesOf(RW.dir)) === JSON.stringify(before[2]), () => 'O3: the third report\'s files byte-identical');
}
// F1 (MP1b): the placement as Desktop 2.159 measured it (laptop part 6 block B)
chk(() => { const eq = (a, b) => Object.keys(b).every((k) => Math.abs(a[k] - b[k]) < 1e-9); const P = PP.placement;
  return eq(P(520, 360, 'Normal', 640, 360), { sx: 1, sy: 1, ox: 60, oy: 0 }) && eq(P(400, 250, 'Normal', 640, 360), { sx: 1, sy: 1, ox: 120, oy: 55 })
    && eq(P(400, 250, 'Fit', 640, 360), { sx: 1.6, sy: 1.44, ox: 0, oy: 0 }) && eq(P(400, 250, 'Fill', 640, 360), { sx: 1.6, sy: 1.6, ox: 0, oy: -20 }); },
  () => `F1: Normal centred at scale 1, Fit stretched, Fill centred at the larger scale: ${PP && JSON.stringify(['Normal', 'Fit', 'Fill'].map((f) => PP.placement(400, 250, f, 640, 360)))}`);
chk(() => { const o = PP.newOverlaps([{ name: 'a', position: { x: 0, y: 0, width: 100, height: 50 } }, { name: 'b', position: { x: 120, y: 0, width: 100, height: 50 } }], [{ name: 'a', position: { x: 540, y: 0, width: 100, height: 50 } }, { name: 'b', position: { x: 500, y: 0, width: 100, height: 50 } }]); return o.length === 1 && o[0].visuals.join() === 'a,b'; },
  () => 'V2: a new overlap between two visuals is named');

// ---------- R: the real shapes of laptop part 6 (MP1b, each red on d9d3ae98 first) ----------
{
  const p0 = await call('create_arabic_twin', { path: RR.pbip, arabicMonth: false }), pp = (p0.j && p0.j.picturePages) || [];
  const w = await write({ path: RR.pbip, arabicMonth: false }), at = (pg, n) => (w.dir ? rd(path.join(w.dir, 'definition/pages', pg, 'visuals', n, 'visual.json')).position : {});
  const nb = w.dir ? bgOf(rd(path.join(w.dir, 'definition/pages/named/page.json'))) : null;
  chk(() => (pp.find((x) => x.page === 'named') || {}).picture === 'flipped' && nb && nb.item !== 'gradient-background4528801825573012.png' && fs.existsSync(path.join(w.dir, 'StaticResources/RegisteredResources', nb.item)) && at('named', 'nm0').x === W - onPanels('rail', 400, 250, 'Fit')[0].x - onPanels('rail', 400, 250, 'Fit')[0].w,
    () => `R1: a picture named as Desktop writes it (label 'gradient-background.png', file 'gradient-background4528801825573012.png') is found, flipped and its page mirrored: ${JSON.stringify(pp.find((x) => x.page === 'named'))} ${JSON.stringify(nb)}`);
  chk(() => !pp.some((x) => x.page === 'emptied') && at('emptied', 'ev').x === W - 220, () => `R2: an emptied picture (name and url '') is no picture: the page mirrored as any page: ${JSON.stringify(pp)} ${at('emptied', 'ev').x}`);
  // every visual's page box W - x - w of its English page box: the group's (20 + child) and the nested group's
  chk(() => at('row', 'g1').x === 20 && at('row', 'dept').x === 300 && at('row', 'ratings').x === 0, () => `R3: a bar chart beside a table of other fields (in a group) each mirrored, not kept as one block (group 20, chart at 300, table at 0 in it; page boxes ${W - 20 - 300} and 20): ${JSON.stringify(['g1', 'dept', 'ratings'].map((n) => at('row', n).x))}`);
  chk(() => at('row', 'g2').x === 220 && at('row', 'g3').x === 50 && at('row', 'deep').x === 180, () => `R4 (guard): a nested group mirrored to the page box W - x - w (deep at 20 + 100 + 10 = 130 -> 450 = 220 + 50 + 180): ${JSON.stringify(['g2', 'g3', 'deep'].map((n) => at('row', n).x))}`);
  chk(() => at('kpi', 'kicon').x === W - 250 - 30, () => `R5: a KPI icon beside its title on a card goes where its mirror is (${W - 280}), not onto the title mirrored next to it: ${at('kpi', 'kicon').x} (title ${at('kpi', 'ktitle').x})`);
  chk(() => at('kpi', 'nicon').x === W - 260 - 30, () => `R6: an icon on a card whose own title turns right goes to the card's other end (${W - 290}): ${at('kpi', 'nicon').x}`);
  chk(() => at('help', 'gotit').x === W - 400 - 70, () => `R7: a help box's button under its text box goes to the text box's other end with the text (${W - 470}), not its English x 400: ${at('help', 'gotit').x}`);
  chk(() => JSON.stringify(filesOf(RR.dir)) === JSON.stringify(before[4]), () => 'O4: the real-shapes report\'s files byte-identical');
}

// ---------- P7: laptop part 7's last collisions (MP1c, each red on 4d1aaff8 first) ----------
{
  const labels = { 'textbox:kpiTab/ktab/0.1': 'المكالمات', 'textbox:helpLines/h1/0.0': '1 صفّ الطلب لترى حالته.', 'textbox:helpLines/h2/0.0': 'صفّ الطلب' };
  const w = await write({ path: RC.pbip, arabicMonth: false, labels }), V = (pg, n) => (w.dir ? rd(path.join(w.dir, 'definition/pages', pg, 'visuals', n, 'visual.json')) : null);
  const runsOf = (v) => (v ? v.visual.objects.general[0].properties.paragraphs[0].textRuns.map((r) => r.value) : []);
  chk(() => !w.err && JSON.stringify(runsOf(V('kpiTab', 'ktab'))) === JSON.stringify(['المكالمات', '\t\t\t\t\t']), () => `MC-a: a title indented by a tab run, turned right: the tabs move to its end, the word clear of the mirrored icon: ${JSON.stringify(runsOf(V('kpiTab', 'ktab')))} ${w.err ? short(w) : ''}`);
  const hp = V('erRow', 'heat') && V('erRow', 'heat').position, wp = V('erRow', 'wk') && V('erRow', 'wk').position;
  chk(() => hp.x === 320 && wp.x === 144 && wp.x + wp.width <= hp.x, () => `MC-b: a bar chart that overlapped a matrix's right margin no longer lies on its row headers in the twin (matrix at 320, chart from 144 ending by 320): ${JSON.stringify([hp, wp])}`);
  const rb = V('ratings', 'rb'), rt = V('ratings', 'rt');
  chk(() => rt.position.x === 320 && rb.position.x === 320 + 150, () => `MC-c1: a small bar chart over a one-column table keeps its place on it (table at 320, chart at 470): ${rt && rt.position.x}, ${rb && rb.position.x}`);
  chk(() => !((rb.visual.objects.valueAxis || []).some((e) => e.properties && e.properties.invertAxis)) && !((rb.visual.objects.categoryAxis || []).some((e) => e.properties && e.properties.switchAxisPosition)), () => `MC-c2: its bars keep their direction (no invertAxis, no switchAxisPosition), as the table stays left to right inside: ${JSON.stringify(rb && rb.visual.objects)}`);
  const h1 = runsOf(V('helpLines', 'h1'))[0] || '', h2 = runsOf(V('helpLines', 'h2'))[0] || '';
  chk(() => h1 === '\u2067' + '1 صفّ الطلب لترى حالته.' + '\u2069', () => `MC-e1: a text box's Arabic line with a digit and a full stop at its ends wrapped whole RLI ... PDI (V3): ${JSON.stringify(h1)}`);
  chk(() => h2 === 'صفّ الطلب', () => `MC-e2 (guard): Arabic letters at both ends: unchanged: ${JSON.stringify(h2)}`);
  chk(() => JSON.stringify(filesOf(RC.dir)) === JSON.stringify(before[5]), () => 'O5: the part-7 report\'s files byte-identical');
}
// MC-d: the overlap check names a pair that overlapped in English too when, in the twin, the overlap moved onto a
// matrix's row headers, or a bar chart over a table had its bars turned (the shapes as the old twin wrote them)
{
  const box = (name, type, x, y, w, h, z, extra) => ({ name, position: { x, y, z, width: w, height: h }, visual: Object.assign({ visualType: type }, extra || {}) });
  const en = [box('heat', 'pivotTable', 20, 20, 300, 200, 1), box('wk', 'clusteredBarChart', 296, 20, 200, 200, 2), box('rt', 'tableEx', 20, 260, 300, 80, 1), box('rb', 'clusteredBarChart', 170, 265, 140, 70, 2)];
  const ar = [box('heat', 'pivotTable', 320, 20, 300, 200, 1), box('wk', 'clusteredBarChart', 144, 20, 200, 200, 2), box('rt', 'tableEx', 320, 260, 300, 80, 1), box('rb', 'clusteredBarChart', 330, 265, 140, 70, 2, { objects: { valueAxis: [{ properties: { invertAxis: L('true') } }] } })];
  const o = PP ? PP.newOverlaps(en, ar) : [], names = o.map((x) => x.visuals.join());
  chk(() => names.includes('heat,wk') && o.find((x) => x.visuals.join() === 'heat,wk').why === 'rowHeaders', () => `MC-d1: an overlap moved onto a matrix's row headers is named: ${JSON.stringify(o)}`);
  chk(() => names.includes('rb,rt') && o.find((x) => x.visuals.join() === 'rb,rt').why === 'barsTurned', () => `MC-d2: a bar chart over a table whose bars turned is named: ${JSON.stringify(o)}`);
}

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
