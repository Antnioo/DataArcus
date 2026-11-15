// 0.3.2 DT1 (B-294): the bilingual plan's texts in one order on every run. bilingual.texts (the texts the person labels
// in Arabic) came out in a different order from run to run on the same model and options: textsOf (lib/twin-texts.mjs)
// walked each page's visuals in the order of their file paths, and a visual's folder is its name, a random id. The
// texts are now read in the order a person reads the report (lib/twin-texts.mjs readingOrder): pages in the report's
// order, on a page top to bottom then left to right, in a visual its texts in their place; bookmarks in the pane's order.
//   D1  bilingual-report's B5 plan (every 0.3.0 option, the large fixture) 5 times, each in a fresh temporary folder:
//       the same bilingual.texts (the whole list) at the step before the Arabic texts and at the plan with an id
//   D2  an English report with the same options written to disk, create_arabic_twin's plan (every page of texts); then
//       every page id, visual name and bookmark name renamed (other ids, in the reverse order of their names, every
//       reference replaced): the same texts in the same order, the ids aside
//   D3  the order is the reading order: on each page, the visuals first named by the texts run top to bottom, then
//       left to right
//   U1-U3  readingOrder on made-up visuals: by y, then x; a tie never decided by the name while anything shown differs;
//       its input is not changed
// Fixture: the golden model (mcp/test-models/large-synthetic, made up).   node test-0.3.2-dt1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import * as TwinTexts from './lib/twin-texts.mjs';

const readingOrder = TwinTexts.readingOrder || (() => { throw new Error('lib/twin-texts.mjs has no readingOrder'); });
const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const uniq = (a) => [...new Set(a)];
const WORDS = ['المبيعات', 'الطلبات', 'القيمة', 'المنطقة', 'الخطة', 'الشهر', 'المتوسط', 'العدد', 'الهدف', 'الربح', 'الدرجة', 'العميل'];
const base = { path: 'large/Large Synthetic.SemanticModel', focus: 'Web Orders', lang: 'en', layout: 'exec', secondPage: true };
const opt = { gallery: true, smoothLines: true, slicerStyle: 'pills', grid: 'dotted', flipCards: true, statusIcons: true, waterfallRtl: 'native', filters: 'top',
  metricSwitcher: ['Web Orders[Web Orders Total Score]', 'Web Orders[Web Orders Count]', 'Web Orders[Web Orders Total Value]'], pageFilters: [{ field: 'Calendar[Is Ramadan]', values: [true] }],
  planFields: { slicers: ['Calendar[Is Weekend]', 'Coupon[Coupon Region]'] } };
const fresh = () => { const d = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dt1-'))); fs.cpSync(path.join(HERE, 'test-models/large-synthetic'), path.join(d, 'large'), { recursive: true }); return d; };
// the questions every plan asks first (the Gulf date, the shared axes), answered the same way each time
const answer = (j, args, more) => {
  if (j.gulfDates && j.gulfDates.askNext && !args.gulfDates && ((j.gulfDates.candidates || [])[0] || {}).field) more.gulfDates = { dateRole: j.gulfDates.candidates[0].field, grain: 'gregorian', scope: 'all' };
  if (j.sharedAxes && (j.sharedAxes.ask || []).length && !args.sharedAxes) more.sharedAxes = j.sharedAxes.ask.map((q, k) => ({ measures: q.measures, answer: k % 2 ? 'separate' : 'comparable' }));
};

// hr1's person (bilingual-report's planBilingual): an Arabic name for every field but one, an Arabic text for every
// text the terms do not give. Returns bilingual.texts at the step before the Arabic texts and at the plan with an id
async function planBilingual(c) {
  let made = 0; const arName = () => { const w = WORDS[made % WORDS.length], n = Math.floor(made / WORDS.length); made++; return n ? `${w} ${n + 1}` : w; };
  let args = Object.assign({ name: 'Orders All', languages: 'en+ar' }, base, opt), pl = await c.call('plan_layout', args), declined = null; const out = { len: [] };
  for (let i = 0; i < 6 && !pl.err; i++) {
    const j = pl.j || {}, more = {}, B = j.bilingual; answer(j, args, more);
    if (B && args.arabicTerms && !args.arabicTexts) { out.before = B.texts; out.len.push(String(pl.t).length); }
    if (B && !args.arabicTerms && B.terminology && (B.terminology.sheet || []).length) {
      const fields = uniq(B.terminology.sheet.map((x) => x.field).filter(Boolean)), t = {};
      fields.forEach((f, k) => { t[f] = k === fields.length - 1 ? (B.terminology.sheet.find((x) => x.field === f) || {}).en : arName(); });
      declined = t[fields[fields.length - 1]]; more.arabicTerms = t;
    } else if (B && args.arabicTerms && !args.arabicTexts) {
      const at = {}; (B.texts || []).filter((x) => x.text != null && x.arabic == null && !x.field && x.text !== declined).forEach((x) => { at[x.text] = x.draftArabic || (/\{1\}/.test(x.text) ? `أعلى {1} من أصل {2}: ${arName()}` : arName()); });
      more.arabicTexts = at;
    }
    if (!Object.keys(more).length) break;
    args = Object.assign(args, more); pl = await c.call('plan_layout', args);
  }
  out.plan = pl.j && pl.j.plan && pl.j.plan.planId && pl.j.bilingual ? pl.j.bilingual.texts : null; out.len.push(String(pl.t).length);
  return out;
}

// create_arabic_twin's plan, every page of its texts (textsFrom)
async function twinTexts(c, pbip) {
  const all = [];
  for (let from = 0, i = 0; i < 20; i++) {
    const t = await c.call('create_arabic_twin', Object.assign({ path: pbip, into: 'same' }, from ? { textsFrom: from } : {}));
    if (t.err || !t.j) throw new Error('create_arabic_twin: ' + String(t.t).slice(0, 300));
    all.push(...(t.j.texts || [])); if (!t.j.textsNotListed) break; from = all.length;
  }
  return all;
}
// every id a report names (pages, visuals, bookmarks) renamed: hex ids of the same length, in the reverse order of the
// old names (a reader that orders by name meets them backwards), every file's mention replaced
function renameIds(reportDir) {
  const D = path.join(reportDir, 'definition'), pages = path.join(D, 'pages'), bms = path.join(D, 'bookmarks');
  const isDir = (p) => fs.statSync(p).isDirectory();
  const pageIds = fs.readdirSync(pages).filter((n) => isDir(path.join(pages, n)));
  const visuals = pageIds.flatMap((p) => { const v = path.join(pages, p, 'visuals'); return fs.existsSync(v) ? fs.readdirSync(v).filter((n) => isDir(path.join(v, n))).map((n) => [p, n]) : []; });
  const bmIds = fs.existsSync(bms) ? fs.readdirSync(bms).filter((n) => /\.bookmark\.json$/.test(n)).map((n) => n.replace(/\.bookmark\.json$/, '')) : [];
  const old = [...pageIds, ...visuals.map((x) => x[1]), ...bmIds], sorted = old.slice().sort(), map = new Map();
  sorted.forEach((o, i) => map.set(o, (0xffffff - i).toString(16).padStart(6, '0') + 'd71'.repeat(10).slice(0, o.length - 6)));
  visuals.forEach(([p, v]) => fs.renameSync(path.join(pages, p, 'visuals', v), path.join(pages, p, 'visuals', map.get(v))));
  pageIds.forEach((p) => fs.renameSync(path.join(pages, p), path.join(pages, map.get(p))));
  bmIds.forEach((b) => fs.renameSync(path.join(bms, b + '.bookmark.json'), path.join(bms, map.get(b) + '.bookmark.json')));
  const re = new RegExp(old.slice().sort((a, b) => b.length - a.length).join('|'), 'g');
  const walk = (d) => fs.readdirSync(d).forEach((n) => { const f = path.join(d, n); if (isDir(f)) return walk(f); if (!/\.json$/.test(n)) return;
    const s = fs.readFileSync(f, 'utf8'), r = s.replace(re, (m) => map.get(m)); if (r !== s) fs.writeFileSync(f, r); });
  walk(reportDir);
  return map;
}
// a text with its ids aside (every page id, visual name and bookmark name, old and new)
let idsRe = /(?!)/; const noIds = (t) => JSON.stringify(t).replace(idsRe, '#');

const dirs = [];
try {
  // ---------- D1: the B5 plan, 5 fresh folders ----------
  const runs = [];
  for (let r = 0; r < 5; r++) { const d = fresh(); dirs.push(d); const s = await serverClient(d, {}); try { runs.push(await planBilingual(s)); } finally { await s.close(); } }
  const sig = (x) => JSON.stringify(x || null), diff = (k) => runs.map((x, i) => [i, sig(x[k]) === sig(runs[0][k])]).filter(([, same]) => !same).map(([i]) => i);
  const firstDiff = (k, i) => { const a = runs[0][k] || [], b = runs[i][k] || []; const n = a.findIndex((x, j) => sig(x) !== sig(b[j])); return `run ${i}, text ${n}: ${sig(a[n]).slice(0, 160)} / ${sig(b[n]).slice(0, 160)}`; };
  ['before', 'plan'].forEach((k) => chk(() => runs.every((x) => (x[k] || []).length > 20) && !diff(k).length,
    () => `D1. the B5 plan's bilingual.texts (${k === 'before' ? 'the step before the Arabic texts' : 'the plan with an id'}) in one order over 5 runs: ${runs.map((x) => (x[k] || []).length).join(', ')} texts; differ: ${diff(k).map((i) => firstDiff(k, i)).join('; ')}`));
  if (process.env.DT1_SHOW) console.log('answer sizes (before, plan) per run:', runs.map((x) => x.len.join('/')).join(' '));

  // ---------- D2, D3: create_arabic_twin's plan, the ids renamed ----------
  const d = fresh(); dirs.push(d); const s = await serverClient(d, {});
  let a1 = [], a2 = [], pos = new Map();
  try {
    let args = Object.assign({ name: 'Small EN' }, base, opt), q = await s.call('plan_layout', args);
    for (let i = 0; i < 4 && !(q.j && q.j.plan && q.j.plan.planId); i++) { const more = {}; answer(q.j || {}, args, more); if (!Object.keys(more).length) break; Object.assign(args, more); q = await s.call('plan_layout', args); }
    const id = q.j && q.j.plan && q.j.plan.planId; if (!id) throw new Error('no English plan: ' + String(q.t).slice(0, 300));
    await s.call('approve_plan', { planId: id }); const w = await s.call('create_report', { path: base.path, planId: id }); if (w.err) throw new Error('create_report: ' + String(w.t).slice(0, 300));
    const pbip = 'large/Small EN.pbip', rep = path.join(d, 'large', 'Small EN.Report');
    a1 = await twinTexts(s, pbip);
    const map = renameIds(rep); idsRe = new RegExp([...map.keys(), ...map.values()].sort((x, y) => y.length - x.length).join('|'), 'g');
    a2 = await twinTexts(s, pbip);
    // each visual's place, by its (new) name
    const pages = path.join(rep, 'definition', 'pages');
    fs.readdirSync(pages).filter((p) => fs.existsSync(path.join(pages, p, 'visuals'))).forEach((p) => fs.readdirSync(path.join(pages, p, 'visuals')).forEach((v) => {
      const j = JSON.parse(fs.readFileSync(path.join(pages, p, 'visuals', v, 'visual.json'), 'utf8')); pos.set(p + '/' + v, j.position || {}); }));
  } finally { await s.close(); }
  const n = a1.findIndex((t, i) => noIds(t) !== noIds(a2[i]));
  chk(() => a1.length > 40 && a1.length === a2.length && n === -1,
    () => `D2. create_arabic_twin's texts in the same order with every id renamed: ${a1.length} -> ${a2.length} texts; the first that differs (${n}): ${a1[n] ? noIds(a1[n]).slice(0, 200) : ''} / ${a2[n] ? noIds(a2[n]).slice(0, 200) : ''}`);
  // D3: per page, the visuals in the order the texts first name them: top to bottom, then left to right
  const seen = new Map();
  a2.forEach((t) => { const m = /^(?:phone:)?[a-zA-Z]+:([^/]+)\/([^/]+)(?:\/|$)/.exec(String(t.id)); if (!m) return; const k = m[1] + '/' + m[2]; if (!seen.has(m[1])) seen.set(m[1], []); if (!seen.get(m[1]).includes(k)) seen.get(m[1]).push(k); });
  const outOfOrder = [...seen.values()].flatMap((ks) => ks.slice(1).map((k, i) => [ks[i], k]).filter(([x, y]) => { const p = pos.get(x) || {}, q = pos.get(y) || {}; return (+p.y || 0) > (+q.y || 0) || ((+p.y || 0) === (+q.y || 0) && (+p.x || 0) > (+q.x || 0)); }));
  chk(() => seen.size >= 2 && [...seen.values()].some((ks) => ks.length > 3) && !outOfOrder.length,
    () => `D3. the texts in reading order (y, then x), each page: ${seen.size} pages; out of order: ${JSON.stringify(outOfOrder.slice(0, 3).map(([x, y]) => [pos.get(x), pos.get(y)]))}`);
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 800)); }
dirs.forEach((d) => fs.rmSync(d, { recursive: true, force: true }));

// ---------- U: readingOrder on made-up visuals ----------
{
  const v = (name, x, y, extra) => ({ rel: `definition/pages/p/visuals/${name}/visual.json`, json: Object.assign({ name, position: Object.assign({ x, y, z: 0 }, extra && extra.pos), visual: { visualType: (extra && extra.type) || 'card' } }, extra && extra.json) });
  const list = [v('zz', 0, 300), v('aa', 600, 0), v('mm', 0, 0), v('bb', 0, 300, { pos: { z: -1 } })], copy = JSON.stringify(list);
  chk(() => readingOrder(list).map((x) => x.json.name).join() === 'mm,aa,bb,zz', () => `U1. top to bottom, then left to right, then z: ${readingOrder(list).map((x) => x.json.name)}`);
  const tie = [v('aa', 10, 10, { type: 'shape' }), v('ff', 10, 10, { type: 'card' })], tie2 = [v('ff', 10, 10, { type: 'shape' }), v('aa', 10, 10, { type: 'card' })];
  chk(() => readingOrder(tie).map((x) => x.json.visual.visualType).join() === readingOrder(tie2).map((x) => x.json.visual.visualType).join(),
    () => 'U2. a tie in place is decided by what is shown (the type, the texts), never by the name');
  chk(() => JSON.stringify(list) === copy && readingOrder(list) !== list, () => 'U3. readingOrder never changes its input');
}

if (problems.length) { console.log(`FAIL  dt1  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  dt1  ${checks} checks`);
