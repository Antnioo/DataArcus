// 0.3.1 GD2 (the owner, 27 Oct: "i want the twin to be identical that is why it's called a twin why on earth would i have
// one english glassy and one arabic not glassy also in the approval page it should not be solid cards"; mcp/work/GD2.md):
// the twin, the copy in both languages and the bilingual report keep the English report's glass look, its page picture
// mirrored; the approval page draws glass as the report is written; a theme used alone carries its picture.
// Made-up models only, in a temp working folder: no employer or client data.
//   T   the twin (create_arabic_twin): the theme deep-equal, each visual's container styles equal, each Arabic page's
//       picture the English page's flipped (pixel by pixel), light and dark; a plain report's twin as before
//   C   the copy in both languages (into "same"): the English pages keep their picture, the Arabic pages a flipped one
//       of their own, registered; Microsoft's validator 0 errors
//   B   the bilingual report (create_report languages "en+ar"): the Arabic pages' picture flipped
//   P   the approval page's preview: the picture behind a glass page, the cards at the written transparency, an Arabic
//       page's picture flipped; a plain page as before; no picture in any answer to Claude
//   U   page-preview.js itself: a page with glass, a page without
//   H   generate_theme's glass theme carries its page picture (Microsoft's report theme schema 2.159: page background image)
//   node test-0.3.1-glass-twin.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const require = createRequire(import.meta.url);
const E = require('../assets/js/design-engine.js'), Preview = require('../assets/js/page-preview.js'), { PNG } = require('pngjs');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const cut = (o) => (typeof o === 'string' ? o : JSON.stringify(o) || '').slice(0, 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const lit = (v) => String((((v || {}).expr || {}).Literal || {}).Value || '').replace(/^'|'$/g, '');
const glassTheme = (th) => { const b = ((((th || {}).visualStyles || {})['*'] || {})['*'] || {}).background; return !!(b && b[0] && b[0].transparency > 0); };
// a PNG's pixels flipped left to right equal another's
const flippedOf = (a, b) => { const A = PNG.sync.read(Buffer.from(a)), B = PNG.sync.read(Buffer.from(b)); if (A.width !== B.width || A.height !== B.height) return false;
  for (let y = 0; y < A.height; y++) for (let x = 0; x < A.width; x++) for (let c = 0; c < 4; c++) if (A.data[(y * A.width + x) * 4 + c] !== B.data[(y * B.width + (B.width - 1 - x)) * 4 + c]) return false;
  return true; };
const sameBytes = (a, b) => Buffer.from(a).equals(Buffer.from(b));

// a report folder: its pages (id, json, the background picture's bytes and name), visuals by name, theme, report.json
const reportOf = (RD) => { const P = path.join(RD, 'definition/pages'), RES = path.join(RD, 'StaticResources/RegisteredResources'), rj = rd(path.join(RD, 'definition/report.json'));
  const img = (pj) => { const e = ((pj.objects || {}).background || []).find((x) => x && x.properties && x.properties.image); return e ? lit(e.properties.image.image.name) : null; };
  const pages = rd(path.join(P, 'pages.json')).pageOrder.map((id) => { const pj = rd(path.join(P, id, 'page.json')), n = img(pj), V = path.join(P, id, 'visuals');
    return { id, pj, name: n, bytes: n && fs.existsSync(path.join(RES, n)) ? fs.readFileSync(path.join(RES, n)) : null,
      visuals: fs.existsSync(V) ? Object.fromEntries(fs.readdirSync(V).map((x) => rd(path.join(V, x, 'visual.json'))).map((v) => [v.name, v])) : {} }; });
  const theme = fs.readdirSync(RES).filter((f) => /\.json$/.test(f)).map((f) => rd(path.join(RES, f))).find((t) => t.visualStyles) || null;
  return { pages, theme, rj, res: fs.readdirSync(RES) }; };
const vco = (v) => { const o = (v.visual || {}).visualContainerObjects || {}; return JSON.stringify(['background', 'border', 'dropShadow'].map((k) => o[k] || null)); };

// ---------- U: the renderer alone ----------
{
  const pg = { name: 'P', w: 1280, h: 720, colors: { background: '#f4f6fa', card: '#ffffff', ink: '#1f2329', accent: '#0f7c90' }, visuals: [{ type: 'clusteredBarChart', x: 20, y: 20, w: 400, h: 300, title: 'Sales' }, { type: 'tableEx', x: 440, y: 20, w: 400, h: 300, title: 'Rows' }] };
  const plain = Preview.render(pg, { width: 400 }), glass = Preview.render(Object.assign({}, pg, { glass: { url: 'data:image/png;base64,AAAA', t: 35, rim: '#ffffff' } }), { width: 400 });
  chk(() => !/<image/.test(plain) && /<image[^>]+href="data:image\/png;base64,AAAA"/.test(glass) && (glass.match(/class="box"[^>]*fill-opacity="0\.65"/g) || []).length === 2 && /stroke="#ffffff"/.test(glass),
    () => `U1. page-preview draws a glass page: its picture behind, every card (a table too) at 65% (35% transparency) with the rim; a plain page as before: ${cut(glass.slice(0, 600))}`);
}

// ---------- the tools ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-gd2-')));
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
const approve = async (id) => { const n = links().length; await s.call('approve_plan', { planId: id }); for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
  const html = await req(links()[n]); await req(links()[n], 'decision=approve'); await s.call('approve_plan', { planId: id }); return html; };
// the approval page's preview figures: each picture behind a page (its bytes) and the cards' fill opacity
const figures = (html) => [...html.matchAll(/<svg[^>]*role="img"[\s\S]*?<\/svg>/g)].map((m) => ({ img: (/<image[^>]+href="data:image\/png;base64,([^"]+)"/.exec(m[0]) || [])[1] || null,
  ops: [...m[0].matchAll(/class="box"[^>]*fill-opacity="([0-9.]+)"/g)].map((x) => +x[1]) }));
const twinOf = async (pbip, into) => {
  const src = String(pbip).split('\\').join('/'), o = into ? { into } : {};
  const p0 = await s.call('create_arabic_twin', Object.assign({ path: src }, o)), L = {}; let k = 0;
  ((p0.j && p0.j.texts) || []).filter((t) => t.text != null).forEach((t) => { L[t.id] = t.draftArabic || `نص ${++k}`; });
  const p1 = await s.call('create_arabic_twin', Object.assign({ path: src, labels: L }, o)), pid = p1.j && p1.j.plan && p1.j.plan.planId;
  const html = pid ? await approve(pid) : '';
  const w = pid ? await s.call('create_arabic_twin', Object.assign({ path: src, planId: pid }, o)) : { err: true, t: 'no plan: ' + cut(p1.t) };
  return { w, html, plan: p1 };
};
try {
  const made = {};
  const gt = await s.call('generate_theme', { mode: 'dark', lang: 'en' });
  for (const [nm, design] of [['light', undefined], ['dark', (gt.j || {}).design], ['plain', { chart: { look: 'auto' } }]]) {
    const args = { path: 'shop/Shop.SemanticModel', lang: 'en', layout: 'exec', filters: 'top', secondPage: true, name: 'Twin ' + nm };
    const pl = await s.call('plan_layout', Object.assign({ planFields: FIELDS }, design ? { design } : {}, args)), pj = pl.j || {}, id = pj.plan && pj.plan.planId;
    chk(() => !!id && !/data:image/.test(pl.t), () => `P0-${nm}. the plan has an id, and no picture in the answer to Claude: ${cut(pl.err ? pl.t : (pl.t.match(/.{60}data:image.{20}/) || [''])[0])}`);
    if (!id) continue;
    const html = await approve(id), r = await s.call('create_report', Object.assign({ planId: id, design: pj.design, fields: FIELDS }, args));
    if (r.err) { chk(() => false, () => `setup-${nm}. create_report: ${cut(r.t)}`); continue; }
    const R = reportOf(path.join(ROOT, 'shop', 'Twin ' + nm + '.Report')), t = nm === 'plain' ? null : R.theme.visualStyles['*']['*'].background[0].transparency, F = figures(html);
    chk(() => F.length >= 2 && (nm === 'plain' ? F.every((f) => !f.img && !f.ops.length) : F.every((f) => f.img && f.ops.length && f.ops.every((o) => Math.abs(o - (1 - t / 100)) < 0.006))),
      () => `P1-${nm}. the approval page draws ${nm === 'plain' ? 'solid cards, no picture, as before' : `the picture behind each page and the cards at ${100 - t}% (the written ${t}% transparency)`}: ${cut(F.map((f) => [!!f.img, f.ops.slice(0, 3)]))}`);
    made[nm] = { pbip: r.j.open, R };
  }

  // ---------- T: the twin ----------
  for (const nm of ['light', 'dark', 'plain']) {
    if (!made[nm]) continue;
    const { w, html } = await twinOf(made[nm].pbip), O = made[nm].R;
    const dir = fs.readdirSync(path.join(ROOT, 'shop')).find((f) => f === 'Twin ' + nm + ' AR.Report');
    if (w.err || !dir) { chk(() => false, () => `T0-${nm}. the twin is written: ${cut(w.t)}`); continue; }
    const A = reportOf(path.join(ROOT, 'shop', dir)), byId = new Map(A.pages.map((p) => [p.id, p]));
    chk(() => JSON.stringify(A.theme) === JSON.stringify(O.theme) && glassTheme(A.theme) === (nm !== 'plain'), () => `T1-${nm}. the twin's theme deep-equals the English report's (${nm === 'plain' ? 'plain' : 'glass'})`);
    const bad = []; O.pages.forEach((p) => { const q = byId.get(p.id); if (!q) { bad.push(p.id + ' missing'); return; } Object.values(p.visuals).forEach((v) => { const u = q.visuals[v.name]; if (!u || vco(u) !== vco(v)) bad.push(`${p.id}/${v.name} ${v.visual && v.visual.visualType}`); }); });
    chk(() => !bad.length, () => `T2-${nm}. every visual's container styles (background, border, shadow) equal the English visual's: ${cut(bad.slice(0, 6))}`);
    const shown = O.pages.filter((p) => p.pj.type !== 'Tooltip' && p.bytes);
    chk(() => shown.length >= 2 && shown.every((p) => { const q = byId.get(p.id); return q && q.bytes && (nm === 'plain' ? sameBytes(q.bytes, p.bytes) : E.isGlassPng(q.bytes) && flippedOf(q.bytes, p.bytes) && !sameBytes(q.bytes, p.bytes)); }),
      () => `T3-${nm}. ${nm === 'plain' ? 'the plain twin keeps the blank background byte for byte' : 'each Arabic page\'s picture is the English page\'s flipped left to right (pixel by pixel), still marked as glass'}: ${cut(shown.map((p) => [p.id, p.name, byId.get(p.id) && byId.get(p.id).name]))}`);
    if (nm !== 'plain') {
      const F = figures(html);
      chk(() => F.length >= 2 && F.every((f) => f.img && f.ops.length), () => `P2-${nm}. the twin's approval page draws its Arabic pages on their (flipped) picture, the cards see-through: ${cut(F.map((f) => [!!f.img, f.ops.slice(0, 2)]))}`);
    }
  }

  // ---------- C: the copy in both languages ----------
  if (made.light) {
    const { w, html } = await twinOf(made.light.pbip, 'same');
    const dir = fs.readdirSync(path.join(ROOT, 'shop')).find((f) => /^Twin light \(EN-AR\)\.Report$/.test(f) || (/^Twin light .*\.Report$/.test(f) && / EN-AR|EN-AR/.test(f)));
    if (w.err || !dir) chk(() => false, () => `C0. the copy is written: ${cut(w.t)} ${cut(fs.readdirSync(path.join(ROOT, 'shop')))}`);
    else {
      const A = reportOf(path.join(ROOT, 'shop', dir)), O = made.light.R, byId = new Map(A.pages.map((p) => [p.id, p])), pairs = (w.j && w.j.pairs) || (w.j && w.j.languages && w.j.languages.pairs) || [];
      const en = O.pages.filter((p) => p.pj.type !== 'Tooltip' && p.bytes), arPages = A.pages.filter((p) => !O.pages.some((q) => q.id === p.id) && p.pj.type !== 'Tooltip');
      chk(() => en.every((p) => byId.get(p.id) && sameBytes(byId.get(p.id).bytes, p.bytes)), () => 'C1. the copy\'s English pages keep their picture as it is');
      chk(() => arPages.length === en.length && arPages.every((q) => q.bytes && E.isGlassPng(q.bytes) && q.name !== en[0].name && en.some((p) => flippedOf(q.bytes, p.bytes))),
        () => `C2. each Arabic page of the copy has a picture of its own, the English page's flipped: ${cut(arPages.map((q) => [q.id, q.name]))} ${cut(pairs).slice(0, 200)}`);
      const items = ((A.rj.resourcePackages || []).find((x) => x.name === 'RegisteredResources') || {}).items || [];
      chk(() => arPages.every((q) => items.some((it) => it.name === q.name && it.path === q.name) && A.res.includes(q.name)), () => `C3. every Arabic picture is registered in report.json and written: ${cut(items.map((x) => x.name))}`);
      const c = await s.call('check_report', { path: String(w.j.pbip || w.j.open || '').split('\\').join('/') }), cj = c.j || {};
      chk(() => !c.err && cj.validator && cj.validator.ran && cj.validator.errors === 0, () => `C4. Microsoft's validator: 0 errors on the copy: ${cut(c.err ? c.t : cj.validator)}`);
      chk(() => figures(html).some((f) => f.img), () => 'C5. the copy\'s approval page draws its pages on their pictures');
    }
  }

  // ---------- B: the bilingual report (create_report languages "en+ar") ----------
  {
    let args = { path: 'shop/Shop.SemanticModel', lang: 'en', layout: 'exec', filters: 'top', secondPage: true, name: 'Twin both', languages: 'en+ar', planFields: FIELDS }, pl = await s.call('plan_layout', args);
    for (let i = 0; i < 6 && !pl.err; i++) {
      const j = pl.j || {}, B = j.bilingual, more = {};
      if (B && !args.arabicTerms && B.terminology && (B.terminology.sheet || []).length) { const t = {}; [...new Set(B.terminology.sheet.map((x) => x.field).filter(Boolean))].forEach((f, k) => { t[f] = `حقل ${k + 1}`; }); more.arabicTerms = t; }
      else if (B && !args.arabicTexts && (B.texts || []).some((x) => x.text != null && x.arabic == null && !x.field)) { const at = {}; let k = 0; (B.texts || []).filter((x) => x.text != null && x.arabic == null && !x.field).forEach((x) => { at[x.text] = x.draftArabic || (/\{1\}/.test(x.text) ? 'أعلى {1} من {2}: نص' : `نص ${++k}`); }); more.arabicTexts = at; }
      if (!Object.keys(more).length) break;
      args = Object.assign(args, more); pl = await s.call('plan_layout', args);
    }
    const id = pl.j && pl.j.plan && pl.j.plan.planId;
    if (!id) chk(() => false, () => `B0. the bilingual plan: ${cut(pl.t)}`);
    else {
      const html = await approve(id), { planFields, ...rest } = args, r = await s.call('create_report', Object.assign({ planId: id, design: pl.j.design, fields: planFields }, rest));
      const dir = r.err ? null : fs.readdirSync(path.join(ROOT, 'shop')).find((f) => /^Twin both.*\.Report$/.test(f));
      if (!dir) chk(() => false, () => `B0. the bilingual report is written: ${cut(r.t)}`);
      else {
        const A = reportOf(path.join(ROOT, 'shop', dir)), half = A.pages.length / 2, en = A.pages.slice(0, half), ar = A.pages.slice(half);
        const pairs = en.map((p, i) => [p, ar[i]]).filter(([p]) => p.pj.type !== 'Tooltip' && p.bytes);
        chk(() => Number.isInteger(half) && pairs.length >= 1 && pairs.every(([p, q]) => q && q.bytes && E.isGlassPng(q.bytes) && flippedOf(q.bytes, p.bytes) && q.name !== p.name),
          () => `B1. each Arabic page of the bilingual report has the English page's picture flipped: ${cut(pairs.map(([p, q]) => [p.name, q && q.name]))}`);
        chk(() => figures(html).filter((f) => f.img).length >= 2, () => 'B2. its approval page draws the pages on their pictures');
      }
    }
  }

  // ---------- H: a theme used alone carries its page picture ----------
  const th = await s.call('generate_theme', { lang: 'en', layout: { page: '1280x720' } }), thj = th.j || {}, pid = thj.plan && thj.plan.planId;
  if (pid) { await approve(pid); const w = await s.call('generate_theme', { lang: 'en', layout: { page: '1280x720' }, planId: pid });
    const T = w.err ? null : rd(path.join(ROOT, w.j.path)), im = T && (((((T.visualStyles || {}).page || {})['*'] || {}).background || [])[0] || {}).image;
    const b = im && /^data:image\/png;base64,/.test(im.url) ? Buffer.from(im.url.split(',')[1], 'base64') : null;
    chk(() => b && E.isGlassPng(b) && PNG.sync.read(b).width === 1280 && PNG.sync.read(b).height === 720 && im.scaling === 'Fit' && sameBytes(b, E.glassPng(thj.design, 1280, 720)) && !/data:image/.test(th.t + w.t),
      () => `H1. generate_theme's glass theme carries its page picture (page background image, the engine's picture at the page's size, Fit), never in the answer: ${cut(w.err ? w.t : im && { name: im.name, scaling: im.scaling, url: String(im.url).slice(0, 40) })}`);
    chk(() => /page background|canvas background/i.test(w.t) || /page background|canvas background/i.test(th.t), () => `H2. the answer says where the picture is (the theme's page background): ${cut(thj.sayInPlan)}`);
  } else chk(() => false, () => `H0. the theme plan: ${cut(th.t)}`);
  const tp = await s.call('generate_theme', { lang: 'en', chart: { look: 'auto' } }), pp = tp.j && tp.j.plan && tp.j.plan.planId;
  if (pp) { await approve(pp); const w = await s.call('generate_theme', { lang: 'en', chart: { look: 'auto' }, planId: pp }); const T = w.err ? null : rd(path.join(ROOT, w.j.path));
    chk(() => T && !(((((T.visualStyles || {}).page || {})['*'] || {}).background || [])[0] || {}).image, () => 'H3. a plain theme carries no picture, as before'); }
} finally {
  await s.close();
  try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* the OS cleans its temp folder */ }
}
if (problems.length) { console.log(`FAIL script=test-0.3.1-glass-twin.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  glass-twin  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  glass-twin  ${checks} checks`);
process.exit(0);
