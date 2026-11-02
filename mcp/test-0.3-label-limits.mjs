import './test-env.mjs';
// 0.3, J11 (B-140 option B): a planned column chart stays a column chart where the label limits measured in Power BI
// Desktop 2.159 (108 charts, assets/js/label-limits.js) say its names stay uncut, and is a bar chart, with the reason in
// the plan, where they would slant or be cut. Written red first. Made-up models only; metadata only (no values read).
//   node test-0.3-label-limits.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e) }; } };
const LL = get(() => req('../assets/js/label-limits.js')), Px = req('../assets/js/pbip-export.js'), E = req('../assets/js/design-engine.js');
const decide = (o) => get(() => LL.decide(o)), limitAt = (...a) => get(() => LL.limitAt(...a));
const J = (x) => JSON.stringify(x).slice(0, 400);

// ---------- the module: the measured table, read never optimistically ----------
{
  chk(() => LL && typeof LL.decide === 'function' && typeof LL.limitAt === 'function', () => `J11. assets/js/label-limits.js exports decide and limitAt: ${J(LL)}`);
  // the table as measured (lang, width, count -> level, wrap); "<4" is 0
  chk(() => LL.MEASURED.en.length === 9 && LL.MEASURED.ar.length === 9 && J(LL.MEASURED.en.find((r) => r[0] === 900 && r[1] === 5)) === '[900,5,16,32]' && J(LL.MEASURED.ar.find((r) => r[0] === 600 && r[1] === 5)) === '[600,5,8,24]' && J(LL.MEASURED.en.find((r) => r[0] === 400 && r[1] === 12)) === '[400,12,0,0]',
    () => `J11. the measured table, 9 rows a language: ${J(LL && LL.MEASURED)}`);
  // between the measured points: the measured room a category (px per category) at or below the chart's
  const a = limitAt('en', 899, 6), b = limitAt('en', 880, 8);
  chk(() => a.wrap === 16 && a.width === 600 && a.count === 5 && b.wrap === 4 && b.width === 400 && b.count === 5, () => `J11. 899 px with 6 (150 a category) reads 600 with 5 (120); 880 with 8 (110) reads 400 with 5 (80), not 900 with 8 (113): ${J([a, b])}`);
  chk(() => limitAt('en', 400, 12).wrap === 0 && limitAt('en', 420, 12).wrap === 0, () => `J11. less room than measured (35 a category): nothing fits: ${J(limitAt('en', 420, 12))}`);
  chk(() => limitAt('en', 399, 5) === null && limitAt('en', 900, 13) === null && limitAt('en', 1500, 12).width === 600, () => `J11. narrower than 400 or more than 12 categories is outside the table; 1500 px with 12 (125 a category) reads 600 with 5: ${J([limitAt('en', 399, 5), limitAt('en', 900, 13), limitAt('en', 1500, 12)])}`);
  // between two measured rows: the laptop's rule (40 + 8.5 a letter), only where the row above holds the name level too
  const arm100 = decide({ axis: 'month', lang: 'ar', width: 1200, count: 12 }), arm90 = decide({ axis: 'month', lang: 'ar', width: 1080, count: 12 }), en100 = decide({ nameLength: 9, lang: 'en', width: 1200, count: 12 });
  chk(() => arm100.kind === 'column' && /laptop's rule/.test(arm100.why) && arm90.kind === 'bar' && en100.kind === 'bar', () => `J11. Arabic months at 100 px a category: 6 letters need 91 and 113's row holds 8: column; at 90: bar; 9 letters at 100 (needs 117): bar: ${J([arm100, arm90, en100])}`);
  // a 12-month axis (short names, "Jan") at 900 px stays a column chart
  const m900 = decide({ axis: 'monthShort', lang: 'en', width: 900, count: 12 });
  chk(() => m900.kind === 'column' && /^column: 12 months at 900 px/.test(m900.why), () => `J11. 12 short months at 900 px: a column chart: ${J(m900)}`);
  // 12 at 509 px: a bar chart, and why
  const m509 = decide({ axis: 'monthShort', lang: 'en', width: 509, count: 12 });
  chk(() => m509.kind === 'bar' && /^bar: 12 months at 509 px would slant/.test(m509.why) && /42 px a category/.test(m509.why), () => `J11. 12 months at 509 px: a bar chart, why says it would slant (42 px a category): ${J(m509)}`);
  // a page of another size: the width scaled to the 1920 page of the measurements
  const m1280 = decide({ axis: 'monthShort', lang: 'en', width: 600, pageWidth: 1280, count: 12 });
  chk(() => m1280.kind === 'column' && m1280.width === 900, () => `J11. 600 on a 1280 page is 900 on the 1920 page: ${J(m1280)}`);
  // Arabic months use the ar rows (the names known: «سبتمبر» is 6 letters)
  const ar = decide({ axis: 'month', lang: 'ar', width: 900, count: 12 });
  chk(() => ar.kind === 'bar' && ar.nameLength === 6 && /Arabic/.test(ar.why), () => `J11. Arabic months at 900 px: the Arabic names (6 letters), the ar rows: ${J(ar)}`);
  const ar8 = decide({ names: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس'], width: 900, count: 8 }), en8 = decide({ names: Array(8).fill('n'.repeat(20)), width: 900, count: 8 });
  chk(() => ar8.kind === 'column' && /Arabic/.test(ar8.why) && en8.kind === 'bar', () => `J11. the names' script picks the rows (Arabic 24 letters at 900 with 8, English 16): ${J([ar8, en8])}`);
  chk(() => decide({ lang: 'ar', nameLength: 20, width: 600, count: 5 }).kind === 'column' && decide({ lang: 'en', nameLength: 20, width: 600, count: 5 }).kind === 'bar',
    () => 'J11. 20 letters at 600 px with 5: Arabic stays uncut (24), English does not (16)');
  // names not known (a text category): the 12-letter stand-in; script not known: the lower of the two languages
  const t = decide({ width: 900, count: 5 });
  chk(() => t.kind === 'column' && t.limit === 12 && /names unknown, taken as 12 letters/.test(t.why) && /English and Arabic/.test(t.why), () => `J11. a text category, 5 at 900 px: the 12-letter stand-in on one line, both languages' lower level limit (12): ${J(t)}`);
  // (D15: a real name can be longer than the stand-in) at 900 with 8 the names may wrap to 16 letters, but unknown names
  // are held to the level limit, 8: a bar chart
  const t8 = decide({ width: 900, count: 8 }), k8 = decide({ width: 900, count: 8, nameLength: 12 });
  chk(() => t8.kind === 'bar' && t8.limit === 8 && k8.kind === 'column' && k8.limit === 16, () => `J11. unknown names at 900 with 8: the level limit (8), bar; 12 known letters: the wrap limit (16), column: ${J([t8, k8])}`);
  // count unknown: the table's worst row (12), said so
  const u = decide({ width: 900, count: null });
  chk(() => u.kind === 'bar' && u.count === 12 && u.assumedCount === true && /count unknown/.test(u.why), () => `J11. count unknown: the worst row (12) assumed and said: ${J(u)}`);
  const um = decide({ axis: 'monthShort', lang: 'en', width: 900 });
  chk(() => um.kind === 'column' && um.count === 12 && !um.assumedCount, () => `J11. a month axis's count is known (12) without a Top N: ${J(um)}`);
  // outside the table: no decision (the caller keeps its rule)
  const o = [decide({ axis: 'monthShort', lang: 'en', width: 300, count: 12 }), decide({ width: 900, count: 20 }), decide({ axis: 'monthShort', lang: 'en', width: 900, count: 12, labelPt: 20 })];
  chk(() => o.every((x) => x.kind === null && /outside the measured limits/.test(x.why)), () => `J11. 300 px, 20 categories, or 20pt labels: outside, no decision: ${J(o)}`);
}

// ---------- the writer: a planned column chart, by the measured limits ----------
{
  const T = 'Sales', M = (m) => ({ t: T, m }), C = (c, x) => Object.assign({ t: T, c }, x || {});
  const build = (lang, W, H, w, cat) => {
    const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma'; E.repairState(d);
    const pages = [{ name: 'P', page: { w: W, h: H }, slots: [{ kind: 'column', x: 20, y: 20, w, h: Math.round(H * 0.6) }], panel: null, hand: true, png: new Uint8Array([1]) }];
    const bind = { kpis: [M('Total Sales')], measure: M('Total Sales'), date: null, cats: { bar: C('City'), column: cat, donut: C('Channel') }, y: {}, table: [C('City'), M('Total Sales')], slicers: [null, null, null], tip: { card: M('Total Sales'), cat: C('City'), y: M('Total Sales') } };
    const r = Px.build({ name: 'W', title: 'W', pageName: 'P', lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false, model: { byPath: 'M.SemanticModel' }, bind, texts: E.REPORT_TEXTS[lang], pages });
    const main = r.files.filter((f) => /pages\/[^/]+\/visuals\/[^/]+\/visual\.json$/.test(f.path)).map((f) => JSON.parse(String(f.data))).filter((v) => v.visual && /Chart$/.test(v.visual.visualType) && v.position.tabOrder != null);
    return { types: main.map((v) => v.visual.visualType), kc: r.kindChanges || [] };
  };
  const short = build('en', 1920, 1080, 900, C('Month Short', { kind: 'month' }));
  chk(() => short.types.includes('clusteredColumnChart') && !short.kc.length, () => `J11 writer. a 12-month axis (Month Short) at 900 px stays a column chart: ${J(short)}`);
  const at509 = build('en', 1920, 1080, 509, C('Month Short', { kind: 'month' }));
  chk(() => at509.kc.length === 1 && at509.kc[0].to === 'bar' && /^bar: 12 months at 509 px would slant/.test(at509.kc[0].why || ''), () => `J11 writer. 12 months at 509 px: a bar chart, the kind change says why: ${J(at509)}`);
  const arm = build('ar', 1920, 1080, 900, C('اسم الشهر', { kind: 'month' }));
  chk(() => arm.kc.length === 1 && /Arabic/.test(arm.kc[0].why || '') && /6 letters/.test(arm.kc[0].why || ''), () => `J11 writer. Arabic month names: the ar rows, 6 letters: ${J(arm)}`);
  const text = build('en', 1920, 1080, 900, C('Channel'));
  chk(() => text.types.includes('clusteredColumnChart'), () => `J11 writer. a text category with the columns its slot holds stays a column chart at 900 px: ${J(text)}`);
  // outside the table (300 px): the writer's own rule, and why says so
  const out = build('en', 1920, 1080, 300, C('Month Name', { kind: 'month' }));
  chk(() => out.kc.length === 1 && out.kc[0].to === 'bar' && /outside the measured limits/.test(out.kc[0].why || ''), () => `J11 writer. 300 px: the writer's own rule, said: ${J(out)}`);
}

// ---------- the plan: each written kind says why (plan_layout, through the server) ----------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-j11-'));
fs.cpSync(path.join(REPO, 'mcp/fixtures/health-project'), path.join(ROOT, 'health'), { recursive: true });
fs.cpSync(path.join(REPO, 'mcp/test-models/arabic-long-names'), path.join(ROOT, 'arabic'), { recursive: true });
const s = await serverClient(ROOT, {});
try {
  for (const c of [{ path: 'health' }, { path: 'arabic', lang: 'ar' }]) {
    const pl = await s.call('plan_layout', Object.assign({ name: 'J11', layout: 'exec', secondPage: false }, c));
    chk(() => !pl.err, () => `J11 plan ${c.path}. plan_layout answers: ${pl.t && pl.t.slice(0, 300)}`);
    const ks = (pl.j && pl.j.kindChanges && pl.j.kindChanges.slots) || [];
    chk(() => ks.every((x) => typeof x.why === 'string' && /^(bar|donut|column): /.test(x.why)), () => `J11 plan ${c.path}. every kind change in the plan says why: ${J(ks)}`);
    chk(() => pl.j.slots.filter((x) => x.plannedAs).every((x) => typeof x.kindWhy === 'string'), () => `J11 plan ${c.path}. each changed slot carries its why: ${J(pl.j.slots.filter((x) => x.plannedAs))}`);
    // (B-140) the golden models' Comparison column chart, a text category, 927 px with the design's Top 8 (116 a category):
    // unknown names on one line hold 8 letters there, so it stays a bar chart, now with the measured reason
    chk(() => ks.some((x) => x.layout === 'column' && x.written === 'bar' && /^bar: 8 categories at 927 px would slant or be cut/.test(x.why) && /8 letters stay uncut on one line/.test(x.why)), () => `J11 plan ${c.path}. the Comparison chart: a bar chart, the measured reason: ${J(ks)}`);
    console.log(`J11 plan ${c.path}: ${ks.length ? ks.map((x) => `${x.layout} -> ${x.written}: ${x.why}`).join(' | ') : 'no kind changed'}`);
  }
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL  label-limits  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  label-limits  ${checks} checks`);
