// 0.3.2 AP2 (B-390; the owner's "yes to all", D-1108-07, 8 Nov): the approval page says exactly what is written.
//   R1  (A-PF2-1) pagesWritten (lib/plan-lint.mjs) lists each page's slicers, buttons and cards in reading order: rows
//       top to bottom, each row left to right, right to left on an Arabic page (report-a11y.js readingOrder, each page's
//       language from check-language.mjs), never the files' order. Made-up files written out of order, in memory.
//   R2  (A-PF2-2) the approval window names the measure each card shows and counts the "no data" message boxes on their
//       own line, never as cards; English and Arabic (in process: summary, then the page's HTML)
//   R3  (A-E1R5B-1; E1 round 5b, B-370 N1: "the approval page promises the glass look's soft page picture and the
//       written report has none", 2 episodes) the two inputs that reach the writer with a plain picture, rebuilt from the
//       code (mcp/work/AP2.md): the model's own report theme with a mid-grey page, and a design with its own colours
//       (the same page), plan_layout, the approval page as the browser gets it, create_report: the page and the plan say
//       what is written (no soft picture); the default input keeps its picture and its line; one Arabic page
//   R4  (A-TP1-1, approved) no DRAFT mark next to the tooltip caption and the count line
// Made-up models and names only (fixtures/time-lab.mjs; no employer data), in a temporary folder.   node test-0.3.2-ap2.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { timeLab } from './fixtures/time-lab.mjs';
import { pagesWritten } from './lib/plan-lint.mjs';
import { isGlassPng } from './lib/design.mjs';
import { glassPixels } from './lib/glass-picture.mjs';
import * as A from './lib/approval-window.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (x) => JSON.stringify(x);
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const textOf = (h) => unesc(String(h).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');

// ---------- R1: reading order (in memory) ----------
{
  const R = 'Lab.Report/definition/';
  const col = (t, c) => ({ Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }), mea = (t, c) => ({ Measure: { Expression: { SourceRef: { Entity: t } }, Property: c } });
  const lit = (v) => ({ expr: { Literal: { Value: v } } });
  const vis = (name, x, y, w, h, visual) => ({ name, position: { x, y, z: 0, width: w, height: h }, visual });
  const slicer = (c) => ({ visualType: 'slicer', query: { queryState: { Values: { projections: [{ field: col('Sales', c), queryRef: `Sales.${c}` }] } } } });
  const card = (m) => ({ visualType: 'cardVisual', query: { queryState: { Data: { projections: [{ field: mea('Sales', m), queryRef: `Sales.${m}` }] } } } });
  const button = (to) => ({ visualType: 'actionButton', visualContainerObjects: { visualLink: [{ properties: { show: lit('true'), type: lit("'PageNavigation'"), navigationSection: lit(`'${to}'`) } }] } });
  const files = [[R + 'version.json', { version: '2.0.0' }], [R + 'report.json', {}], ['Lab.Report/definition.pbir', { version: '4.0', datasetReference: { byPath: { path: '../Lab.SemanticModel' } } }],
    [R + 'pages/pages.json', { pageOrder: ['en1', 'ar1', 'det'] }], [R + 'pages/en1/page.json', { name: 'en1', displayName: 'Overview', width: 1280, height: 720 }],
    [R + 'pages/ar1/page.json', { name: 'ar1', displayName: 'نظرة عامة', width: 1280, height: 720 }], [R + 'pages/det/page.json', { name: 'det', displayName: 'Details', width: 1280, height: 720 }]];
  const add = (p, v) => files.push([`${R}pages/${p}/visuals/${v.name}/visual.json`, v]);
  // each page's visuals written in the reverse of the order a person reads them; the first row's two cards 8 units
  // apart in height (one row: the lower one's top is above the higher one's bottom)
  add('en1', vis('a', 700, 300, 200, 100, slicer('City'))); add('en1', vis('b', 20, 300, 200, 100, slicer('Region')));
  add('en1', vis('c', 700, 20, 200, 100, card('Orders'))); add('en1', vis('d', 20, 28, 200, 100, card('Total Sales')));
  add('en1', vis('e', 600, 600, 100, 40, button('ar1'))); add('en1', vis('f', 100, 600, 100, 40, button('det')));
  add('ar1', vis('g', 20, 300, 200, 100, slicer('City'))); add('ar1', vis('h', 700, 300, 200, 100, slicer('Region')));
  add('ar1', vis('i', 20, 20, 200, 100, card('Orders'))); add('ar1', vis('j', 700, 28, 200, 100, card('Total Sales')));
  add('ar1', vis('k', 100, 600, 100, 40, button('det'))); add('ar1', vis('l', 600, 600, 100, 40, button('en1')));
  const PW = pagesWritten(files.map(([p, j]) => ({ path: p, data: JSON.stringify(j) })));
  const en = PW.find((p) => p.name === 'Overview') || {}, ar = PW.find((p) => p.name === 'نظرة عامة') || {};
  const cards = (p) => (p.cards || []).map((c) => c.shows.join()), btns = (p) => (p.buttons || []).map((b) => b.name);
  chk(() => J(en.slicers) === J(['Sales[Region]', 'Sales[City]']), () => `R1-1 English page: the slicers left to right (Region, then City), not the files' order: ${J(en.slicers)}`);
  chk(() => J(btns(en)) === J(['Details', 'نظرة عامة']), () => `R1-2 English page: the buttons left to right: ${J(en.buttons)}`);
  chk(() => J(cards(en)) === J(['Sales[Total Sales]', 'Sales[Orders]']), () => `R1-3 English page: the first row's cards as one row, left to right (the left card sits 8 units lower): ${J(en.cards)}`);
  chk(() => J(ar.slicers) === J(['Sales[Region]', 'Sales[City]']), () => `R1-4 Arabic page: the slicers right to left (Region at the right first): ${J(ar.slicers)}`);
  chk(() => J(btns(ar)) === J(['Overview', 'Details']), () => `R1-5 Arabic page: the buttons right to left: ${J(ar.buttons)}`);
  chk(() => J(cards(ar)) === J(['Sales[Total Sales]', 'Sales[Orders]']), () => `R1-6 Arabic page: the first row's cards right to left: ${J(ar.cards)}`);
}

// ---------- R2: the cards by measure, the "no data" message boxes on their own line (in process) ----------
{
  const PW = [{ n: 1, name: 'Overview', tooltip: false, hidden: false, visuals: 6, slicers: ['Sales[Region]'], buttons: [], messageCards: 1,
    kinds: [{ type: 'cardVisual', count: 3, by: [] }, { type: 'clusteredBarChart', count: 1, by: ['Sales[Region]'] }], cards: [{ shows: ['Sales[Total Sales]'] }, { shows: ['المبيعات[إجمالي المبيعات]'] }] },
  { n: 2, name: 'Details', tooltip: false, hidden: false, visuals: 4, slicers: [], buttons: [], messageCards: 2,
    kinds: [{ type: 'cardVisual', count: 2, by: [] }, { type: 'lineChart', count: 2, by: [] }], cards: [] }];
  const part = (lang) => { const s = A.summary('report', { pins: { create_report: { name: 'R', lang, design: { layout: {} } } }, pagesWritten: PW });
    const t = textOf(A.approvalHtml({ id: 'plan-ap2000000001', kind: 'report', writes: ['the report "R.Report"'] }, Object.assign({ lang }, s)));
    const at = t.indexOf(lang === 'ar' ? 'ما تحويه كل صفحة (' : 'What each page holds ('), p2 = t.indexOf(lang === 'ar' ? 'الصفحة 2:' : 'Page 2:', at);
    return [t.slice(at, p2), t.slice(p2, p2 + 300)]; };
  const [e1, e2] = part('en'), [a1, a2] = part('ar');
  chk(() => /2 cards: Total Sales, إجمالي المبيعات/.test(e1) && !/3 cards/.test(e1), () => `R2-1 English: the cards by the measure each shows, the message box not counted as a card: ${e1}`);
  chk(() => /1 "no data" message box: /.test(e1), () => `R2-2 English: the "no data" message box on its own line: ${e1}`);
  chk(() => /2 "no data" message boxes: /.test(e2) && !/\bcards?\b/.test(e2.replace(/message box(es)?/g, '')), () => `R2-3 English: a page of message boxes only names no card: ${e2}`);
  chk(() => a1.includes('البطاقات: 2 («Total Sales»، «إجمالي المبيعات»)') && !/بطاقات: 3/.test(a1), () => `R2-4 Arabic: the cards by measure: ${a1}`);
  chk(() => /مربعات رسالة «لا توجد بيانات»: 1/.test(a1), () => `R2-5 Arabic: the message box on its own line: ${a1}`);
  chk(() => /مربعات رسالة «لا توجد بيانات»: 2/.test(a2) && !/البطاقات|بطاقات:/.test(a2), () => `R2-6 Arabic: a page of message boxes only names no card: ${a2}`);
}

// ---------- R3: the glass look's picture as the page says it (the real server) ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-ap2-')));
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const W = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end(); });
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
// the model's own report beside it ("Old"), its theme a mid-grey page under #333333 text (made-up colours)
const GREY = { name: 'Slate', dataColors: ['#0B5394', '#e69138', '#6aa84f', '#cc0000'], foreground: '#333333', background: '#ffffff', tableAccent: '#0b5394', visualStyles: { page: { '*': { background: [{ color: { solid: { color: '#8a8a8a' } } }] } } } };
const oldReport = (dir) => { const R = path.join(ROOT, dir, 'Old.Report'), D = path.join(R, 'definition');
  W(path.join(R, 'definition.pbir'), { version: '4.0', datasetReference: { byPath: { path: '../Time Lab.SemanticModel' } } });
  W(path.join(D, 'report.json'), { themeCollection: { baseTheme: { name: 'CY24SU10', type: 'SharedResources' }, customTheme: { name: 'Slate.json', type: 'RegisteredResources' } } });
  W(path.join(D, 'pages/pages.json'), { pageOrder: ['p1'] }); W(path.join(D, 'pages/p1/page.json'), { name: 'p1', displayName: 'Overview', width: 1920, height: 1080 });
  W(path.join(R, 'StaticResources/RegisteredResources/Slate.json'), GREY); W(path.join(ROOT, dir, 'Old.pbip'), { version: '1.0', artifacts: [{ report: { path: 'Old.Report' } }] }); };
const DESIGN = { ui: { background: '#8a8a8a', card: '#ffffff', text: '#333333', accent: '#0b5394' }, data: ['#0B5394', '#e69138', '#6aa84f', '#cc0000', '#674ea7', '#45818e', '#bf9000', '#3d85c6'] };
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
// plan, the page as the browser gets it, the click, the write; each written glass picture by its number of colours
const run = async (dir, args, pre) => { timeLab(ROOT, dir); if (pre) pre(dir);
  const pl = await s.call('plan_layout', Object.assign({ path: dir, name: 'TL' }, args)), id = !pl.err && pl.j.plan && pl.j.plan.planId;
  if (!id) return { pl, page: '', colours: [] };
  const n = links().length; await s.call('approve_plan', { planId: id }); const url = await linkAt(n), html = url ? await req(url, 'GET') : '';
  if (url) { await req(url, 'POST', 'decision=approve'); await s.call('approve_plan', { planId: id }); }
  const made = await s.call('create_report', { path: dir, planId: id });
  const colours = walk(path.join(ROOT, dir, 'TL.Report')).filter((f) => /\.png$/i.test(f) && isGlassPng(fs.readFileSync(f))).map((f) => { const g = glassPixels(fs.readFileSync(f)), set = new Set();
    for (let i = 0; g && i < g.rgb.length; i += 3) set.add((g.rgb[i] << 16) | (g.rgb[i + 1] << 8) | g.rgb[i + 2]); return set.size; });
  return { pl, made, page: textOf(html), colours }; };
const SOFT = /soft page picture|soft picture/, SOFT_AR = /صورة ناعمة/;
try {
  // the default input: the soft picture written, and said
  {
    const r = await run('d1', {});
    chk(() => r.made && !r.made.err && r.colours.length === 2 && r.colours.every((n) => n > 100), () => `R3-1 default: 2 report pages, each glass picture soft (many colours): ${J(r.colours)} ${(r.made || r.pl).t.slice(0, 300)}`);
    chk(() => /Glass look \(default\): see-through cards over a soft page picture made from the theme's colours/.test(r.page), () => `R3-2 default: the page says the soft picture (as before): ${r.page.slice(r.page.indexOf('Card look'), r.page.indexOf('Card look') + 300)}`);
  }
  // the two episodes: the model's own report theme, a design with its own colours; each picture one flat colour
  for (const [label, dir, args, pre] of [['the own report theme (grey page)', 'e1', {}, oldReport], ['a design with its own colours (grey page)', 'e2', { design: DESIGN }, null]]) {
    const r = await run(dir, args, pre), look = r.pl.j && r.pl.j.look, at = r.page.indexOf('Card look');
    chk(() => r.made && !r.made.err && r.colours.length === 2 && r.colours.every((n) => n === 1), () => `R3-3 ${label}: written, each glass picture one colour (no soft picture can be drawn: mcp/work/AP2.md): ${J(r.colours)} ${(r.made || r.pl).t.slice(0, 300)}`);
    chk(() => at >= 0 && !SOFT.test(r.page), () => `R3-4 ${label}: the page promises no soft picture anywhere: ${r.page.slice(at, at + 400)}`);
    chk(() => /Glass look \(default\): see-through cards over the page's own colour, with no page picture: the page's text stands \d\.\d:1 on that colour, under 4\.5:1, and a picture would lower it/.test(r.page),
      () => `R3-5 ${label}: the card look says no page picture and why: ${r.page.slice(at, at + 400)}`);
    chk(() => /Page backgrounds \(the glass look's page colour, plain: no picture with these colours\)/.test(r.page), () => `R3-6 ${label}: the page background files said as what they are: ${r.page.slice(r.page.indexOf('Page backgrounds'), r.page.indexOf('Page backgrounds') + 200)}`);
    chk(() => look && look.look === 'glass' && look.noPicture && !SOFT.test(look.sayInPlan) && /no page picture/.test(look.sayInPlan), () => `R3-7 ${label}: plan_layout's look says it for the plan: ${J(look)}`);
  }
  // one Arabic page (the design's case): the Arabic line, no soft picture promised
  {
    const r = await run('e3', { design: DESIGN, lang: 'ar' }), at = r.page.indexOf('شكل البطاقات');
    chk(() => r.made && !r.made.err && r.colours.every((n) => n === 1), () => `R3-8 Arabic: written, each glass picture one colour: ${J(r.colours)}`);
    chk(() => at >= 0 && !SOFT_AR.test(r.page) && /بطاقات شفافة فوق لون الصفحة نفسه، دون صورة للصفحة/.test(r.page), () => `R3-9 Arabic: the card look in Arabic says no page picture: ${r.page.slice(at, at + 400)}`);
  }
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

// ---------- R4: A-TP1-1 approved (D-1108-07): no DRAFT mark beside the tooltip caption and the count line ----------
{
  const view = fs.readFileSync(path.join(HERE, 'lib/approval-view.mjs'), 'utf8').split('\n'), note = fs.readFileSync(path.join(HERE, 'work/TP1.md'), 'utf8').split('\n');
  const marked = (lines) => lines.filter((l) => /صفحة تلميح|tipPage|tipsNotDrawn|count line/.test(l) && /\bdraft/i.test(l));
  chk(() => !marked(view).length, () => `R4-1 approval-view.mjs: a DRAFT mark beside the approved lines: ${J(marked(view))}`);
  chk(() => !marked(note).length, () => `R4-2 mcp/work/TP1.md: a DRAFT mark beside the approved lines: ${J(marked(note))}`);
}

if (problems.length) { console.log(`FAIL script=mcp/test-0.3.2-ap2.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 1500))); console.log(`FAIL  ap2  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  ap2  ${checks} checks`);
