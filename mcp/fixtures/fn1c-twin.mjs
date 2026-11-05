// FN1C: a made-up twin project with the shapes the twin's plan says one line for each (lib/twin-plan.mjs planTwin):
// fixtures/twin-project with a page "p4more" added: matrices (grouped, with columns, flat), the kinds Power BI cannot
// mirror (scatter, treemap, map, decomposition tree), a card grid, a flip card's face, a DAX library measure, a field
// parameter's slicer, bar lists with their names beside them or hidden, a badge on a card, a legend at a place
// Microsoft's catalog does not list, a running visual calculation, wide tables, long legends and a title given by a
// column; pages drawn on a picture (PNGs made here): p5pic flipped, p6words asked (it may hold words), p7bad unreadable. makeProject(dir) writes it; noModel(dir) drops its model.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
const L = (v) => ({ expr: { Literal: { Value: String(v) } } }), Q = (s) => L("'" + s + "'"), obj = (p) => [{ properties: p }];
const col = (t, c, d) => Object.assign({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c }, d ? { displayName: d } : {});
const mea = (t, m, d) => Object.assign({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m }, d ? { displayName: d } : {});
const box = (name, x, y, width, height, z, visual, more) => Object.assign({ $schema: VS, name, position: { x, y, z, height, width, tabOrder: z }, visual }, more || {});
const qs = (roles) => ({ queryState: Object.fromEntries(Object.entries(roles).map(([r, p]) => [r, { projections: p }])) });
const title = (t) => ({ title: obj({ show: L('true'), text: Q(t) }) });
const S = 'Sales';

// a PNG of w x h, RGBA, made of bands of colour (a picture that may hold words: not DataArcus's own)
export function png(w, h, words) {
  const crcT = Array.from({ length: 256 }, (z, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 4 + 1) + 1 + x * 4, band = Math.floor(x / 8) % 3;
    // words: a white picture with a line of eight dark letters 6 x 10, 3 apart (what the twin's check reads as words)
    if (words) { const ink = y >= 20 && y < 30 && x >= 20 && x < 20 + 8 * 9 && (x - 20) % 9 < 6; raw[o] = raw[o + 1] = raw[o + 2] = ink ? 30 : 250; raw[o + 3] = 255; continue; }
    raw[o] = band === 0 ? 20 : 230; raw[o + 1] = band === 1 ? 20 : 200; raw[o + 2] = y % 16 < 8 ? 40 : 220; raw[o + 3] = 255; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const MORE = [
  box('mGrouped', 40, 40, 600, 300, 1000, Object.assign({ visualType: 'pivotTable', query: qs({ Rows: [col(S, 'Region'), col(S, 'Product')], Values: [mea(S, 'Total Sales')] }) }, { visualContainerObjects: title('Sales by region and product') })),
  box('mCols', 680, 40, 600, 300, 2000, { visualType: 'pivotTable', query: qs({ Rows: [col(S, 'Region')], Columns: [col(S, 'Product')], Values: [mea(S, 'Total Sales')] }) }),
  box('mFlat', 1320, 40, 560, 300, 3000, { visualType: 'pivotTable', query: qs({ Rows: [col(S, 'Product')], Values: [mea(S, 'Total Sales'), mea(S, 'Orders')] }) }),
  box('scatter1', 40, 360, 300, 200, 4000, { visualType: 'scatterChart', query: qs({ Category: [col(S, 'Product')], X: [mea(S, 'Orders')], Y: [mea(S, 'Total Sales')] }) }),
  box('tree1', 360, 360, 300, 200, 5000, { visualType: 'treemap', query: qs({ Group: [col(S, 'Region')], Values: [mea(S, 'Total Sales')] }), objects: { legend: obj({ show: L('true'), position: Q('Top') }) } }),
  box('map1', 680, 360, 300, 200, 6000, { visualType: 'map', query: qs({ Category: [col(S, 'Region')], Size: [mea(S, 'Total Sales')] }) }),
  box('decomp1', 1000, 360, 300, 200, 7000, { visualType: 'decompositionTreeVisual', query: qs({ Analyze: [mea(S, 'Total Sales')], ExplainBy: [col(S, 'Region')] }) }),
  box('cardGrid', 1320, 360, 560, 200, 8000, { visualType: 'cardVisual', query: qs({ Data: [mea(S, 'Total Sales')], Rows: [col(S, 'Region')] }), objects: { smallMultiplesLayout: obj({ rowCount: L('2L') }) } }),
  box('flipFace', 40, 580, 200, 120, 9000, { visualType: 'image', objects: { general: obj({ imageUrl: Q('face.svg') }) }, visualContainerObjects: { visualLink: obj({ show: L('true'), type: Q('Bookmark'), bookmark: Q('bmDetails') }) } }),
  box('daxCard', 260, 580, 200, 120, 10000, { visualType: 'card', query: qs({ Values: [mea(S, 'Total Sales (KPI card)')] }) }),
  box('fpSlicer', 480, 580, 220, 120, 11000, { visualType: 'slicer', query: { queryState: { Values: { projections: [col('Pick a measure', 'Pick a measure')], fieldParameters: [{ parameterExpr: { Column: { Expression: { SourceRef: { Entity: 'Pick a measure' } }, Property: 'Pick a measure' } }, index: 0, length: 2 }] } } } }),
  box('barNames', 720, 580, 160, 300, 12000, { visualType: 'tableEx', query: qs({ Values: [col(S, 'Product')] }) }),
  box('barBeside', 880, 580, 300, 300, 13000, { visualType: 'clusteredBarChart', query: qs({ Category: [col(S, 'Product')], Y: [mea(S, 'Total Sales')] }), objects: { categoryAxis: obj({ show: L('false') }) } }),
  box('barAlone', 1500, 580, 300, 300, 14000, { visualType: 'clusteredBarChart', query: qs({ Category: [col(S, 'Region')], Y: [mea(S, 'Orders')] }), objects: { categoryAxis: obj({ show: L('false') }) } }),
  box('cardHost', 40, 720, 300, 200, 15000, { visualType: 'card', query: qs({ Values: [mea(S, 'Orders')] }) }),
  box('badge', 300, 730, 30, 30, 16000, { visualType: 'shape', objects: { shape: obj({ tileShape: Q('ellipse') }) } }),
  box('oddLegend', 360, 720, 320, 200, 17000, { visualType: 'clusteredColumnChart', query: qs({ Category: [col(S, 'Region')], Series: [col(S, 'Product')], Y: [mea(S, 'Total Sales')] }), objects: { legend: obj({ show: L('true'), position: Q('Sideways') }) } }),
  box('running', 1200, 900, 300, 160, 18000, { visualType: 'lineChart', query: qs({ Category: [col(S, 'Region')], Y: [mea(S, 'Total Sales'), { field: { NativeVisualCalculation: { Language: 'dax', Expression: 'RUNNINGSUM([Total Sales])', Name: 'Running' } }, queryRef: 'Running', nativeQueryRef: 'Running' }] }) }),
  box('wideTbl', 40, 940, 200, 120, 19000, { visualType: 'tableEx', query: qs({ Values: [col(S, 'Region', 'The region of the sale as named'), col(S, 'Product', 'The product sold in that region'), mea(S, 'Total Sales', 'Total sales in the period chosen')] }), objects: { columnWidth: [{ properties: { value: L('150D') }, selector: { metadata: 'Sales.Region' } }, { properties: { value: L('150D') }, selector: { metadata: 'Sales.Product' } }, { properties: { value: L('150D') }, selector: { metadata: 'Sales.Total Sales' } }] } }),
  box('mayWideTbl', 260, 940, 400, 120, 20000, { visualType: 'tableEx', query: qs({ Values: [col(S, 'Region'), col(S, 'Product'), mea(S, 'Total Sales')] }), objects: { columnWidth: [{ properties: { value: L('150D') }, selector: { metadata: 'Sales.Region' } }] } }),
  box('longLegend', 700, 940, 220, 140, 21000, { visualType: 'donutChart', query: qs({ Y: [mea(S, 'Total Sales', 'Total sales of the whole region'), mea(S, 'Orders', 'Total sales of the whole period')] }), objects: { legend: obj({ show: L('true'), position: Q('Top'), fontSize: L('12D') }) } }),
  box('legendTitle', 940, 940, 200, 140, 22000, { visualType: 'pieChart', query: qs({ Category: [col(S, 'Region', 'The region where each of the orders was sold')], Y: [mea(S, 'Total Sales')] }), objects: { legend: obj({ show: L('true'), position: Q('Right') }) } }),
  box('colTitle', 1200, 720, 300, 160, 24000, { visualType: 'clusteredColumnChart', query: qs({ Category: [col(S, 'Region')], Y: [mea(S, 'Total Sales')] }), visualContainerObjects: { title: obj({ show: L('true'), text: { expr: { Column: { Expression: { SourceRef: { Entity: S } }, Property: 'Region' } } } }) } }),
  box('padBtn', 1700, 900, 200, 40, 23000, { visualType: 'actionButton', objects: { text: [{ properties: { show: L('true') } }, { properties: { text: Q('  Back to start  ') }, selector: { id: 'default' } }] }, visualContainerObjects: { visualLink: obj({ show: L('true'), type: Q('PageNavigation'), navigationSection: Q('p1overview') }) } }),
];

const put = (f, x) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof x === 'string' || Buffer.isBuffer(x) ? x : JSON.stringify(x, null, 2) + '\n'); };
const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
  const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });
export function makeProject(dir) {
  fs.cpSync(path.join(HERE, 'twin-project'), dir, { recursive: true }); lf(dir);
  const R = path.join(dir, 'Twin Sales.Report'), P = path.join(R, 'definition/pages');
  put(path.join(P, 'p4more/page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: 'p4more', displayName: 'More', displayOption: 'FitToPage', width: 1920, height: 1080 });
  MORE.forEach((v) => put(path.join(P, 'p4more/visuals', v.name, 'visual.json'), v));
  put(path.join(R, 'StaticResources/RegisteredResources/bands.png'), png(64, 36));
  put(path.join(P, 'p5pic/page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: 'p5pic', displayName: 'Picture', displayOption: 'FitToPage', width: 1280, height: 720,
    objects: { background: obj({ image: { image: { name: Q('bands.png'), url: { expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: 'bands.png' } } }, scaling: Q('Fit') } }, transparency: L('0D') }) } });
  put(path.join(P, 'p5pic/visuals/picCard/visual.json'), box('picCard', 40, 40, 300, 160, 1000, { visualType: 'card', query: qs({ Values: [mea(S, 'Orders')] }) }));
  // p6words: a picture that may hold words (asked before it is flipped); p7bad: a picture that can't be read (kept)
  put(path.join(R, 'StaticResources/RegisteredResources/words.png'), png(120, 60, true));
  put(path.join(R, 'StaticResources/RegisteredResources/bad.png'), 'not a picture');
  [['p6words', 'Words', 'words.png'], ['p7bad', 'Unreadable', 'bad.png']].forEach(([id, name, file]) => {
    put(path.join(P, id, 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: id, displayName: name, displayOption: 'FitToPage', width: 1280, height: 720,
      objects: { background: obj({ image: { image: { name: Q(file), url: { expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: file } } }, scaling: Q('Normal') } }, transparency: L('0D') }) } });
    put(path.join(P, id, 'visuals/c' + id + '/visual.json'), box('c' + id, 600, 300, 300, 160, 1000, { visualType: 'card', query: qs({ Values: [mea(S, 'Orders')] }) })); });
  const pages = JSON.parse(fs.readFileSync(path.join(P, 'pages.json'), 'utf8')); pages.pageOrder.push('p4more', 'p5pic', 'p6words', 'p7bad'); put(path.join(P, 'pages.json'), pages);
  const rp = path.join(R, 'definition/report.json'), rj = JSON.parse(fs.readFileSync(rp, 'utf8'));
  const items = ((rj.resourcePackages || []).find((p) => p.name === 'RegisteredResources') || {}).items;
  if (items) ['bands.png', 'words.png', 'bad.png'].forEach((n) => items.push({ name: n, path: n, type: 'Image' })); put(rp, rj);
  return dir;
}
export function noModel(dir) { fs.rmSync(path.join(dir, 'Twin Sales.SemanticModel'), { recursive: true, force: true }); return dir; }
