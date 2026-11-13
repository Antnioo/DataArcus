import './test-env.mjs';
// 0.3.3 FT2 (B-432; FT1's Seen 1; mcp/work/FT2.md). create_report's "font" was ignored without a word when the report
// was designed (layout / design): the design's own font (design.font) won, and the plan still showed the given font in its
// reportLook. The rule now: the font the person gave is applied over the design's own, unless E.FONTS refuses it (then the
// plan's "repaired" says so); "Segoe UI" is create_report's default and counts as none; the plan says which font it uses
// and, when it replaced the design's, which one (fontSaid, English only). Through the real server, a made-up model.
//   A  hand-placed pages + font: the theme carries it (FT1), no fontSaid
//   B  layout only: Segoe UI, no fontSaid           C  layout + font Tahoma: Tahoma in the theme, fontSaid, the plan's design
//   D  design font Verdana + font Tahoma: Tahoma wins, fontSaid.replaced Verdana, Verdana nowhere in the written files
//   E  design font Verdana alone: Verdana, no fontSaid   F  explicit "Segoe UI" over Verdana: Verdana kept (the default is none)
//   G  a font outside E.FONTS over Verdana: Verdana kept and the plan's repaired names the font
//   T  the Arabic twin of C and D: the theme file is the English report's, byte for byte
// Made-up model only; temporary folders under os.tmpdir().   node test-0.3.3-ft2.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-ft2-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const HAND = [{ name: 'Hand', width: 1280, height: 720, slots: [{ kind: 'kpi', x: 24, y: 20, w: 300, h: 120 }, { kind: 'text', x: 340, y: 20, w: 600, h: 120, text: 'Sales overview' }, { kind: 'table', x: 640, y: 160, w: 616, h: 300 }] }];
const CASES = { A: { pages: HAND, font: 'Tahoma' }, B: { layout: 'exec' }, C: { layout: 'exec', font: 'Tahoma' }, D: { layout: 'exec', design: { font: 'Verdana' }, font: 'Tahoma' },
  E: { layout: 'exec', design: { font: 'Verdana' } }, F: { layout: 'exec', design: { font: 'Verdana' }, font: 'Segoe UI' }, G: { layout: 'exec', design: { font: 'Verdana' }, font: 'Comic Sans MS' } };
Object.keys(CASES).forEach((k) => { fs.mkdirSync(path.join(ROOT, k, 'Shop.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, k, 'Shop.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Product', 'string')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' }] }] } })); });
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const themeFile = (d) => tree(d).find((f) => /StaticResources\/RegisteredResources\/[^/]+\.json$/.test(f.split(path.sep).join('/')));
const facesOf = (d) => { const t = JSON.parse(fs.readFileSync(themeFile(d), 'utf8')); return ['callout', 'title', 'header', 'label'].map((c) => ((t.textClasses || {})[c] || {}).fontFace); };
const allText = (d) => tree(d).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const s = await serverClient(ROOT, {});
const out = {};
async function run(k) {
  const pl = await s.call('plan_layout', Object.assign({ path: k, name: 'R' }, CASES[k]));
  const plan = pl.j && pl.j.plan; if (!plan || !plan.planId) return { err: 'plan: ' + (pl.t || '').slice(0, 300) };
  await s.call('approve_plan', { planId: plan.planId });
  const w = await s.call('create_report', { path: k, planId: plan.planId });
  return { ans: pl.j, err: w.err ? 'write: ' + w.t.slice(0, 300) : null, dir: path.join(ROOT, k, 'R.Report') };
}
async function twin(k) {
  const dir = path.join(ROOT, k, 'R.Report'), t0 = await s.call('create_arabic_twin', { path: dir });
  if (t0.err || !t0.j) return 'texts: ' + (t0.t || '').slice(0, 200);
  const labels = {}; (t0.j.texts || []).filter((t) => t.text != null).forEach((t, i) => { labels[t.id] = t.draftArabic || 'نص ' + (i + 1); });
  const p = await s.call('create_arabic_twin', { path: dir, labels }); if (!p.j || !p.j.plan) return 'plan: ' + (p.t || '').slice(0, 200);
  await s.call('approve_plan', { planId: p.j.plan.planId });
  const w = await s.call('create_arabic_twin', { path: dir, labels, planId: p.j.plan.planId }); return w.err ? 'write: ' + w.t.slice(0, 200) : null;
}
try {
  for (const k of Object.keys(CASES)) out[k] = await run(k);
  const tw = { C: await twin('C'), D: await twin('D') };
  chk(() => Object.values(out).every((o) => !o.err), () => 'setup. every report is written: ' + Object.entries(out).map(([k, o]) => o.err && k + ' ' + o.err).filter(Boolean).join(' | '));
  const f = (k) => facesOf(out[k].dir), say = (k) => (out[k].ans || {}).fontSaid, same = (a, v) => a.every((x) => x === v);
  chk(() => same(f('A'), 'Tahoma') && !say('A'), () => `A. hand-placed + Tahoma: the theme carries it, no fontSaid: ${f('A')} ${JSON.stringify(say('A'))}`);
  chk(() => same(f('B'), 'Segoe UI') && !say('B'), () => `B. layout only: Segoe UI, no fontSaid: ${f('B')} ${JSON.stringify(say('B'))}`);
  chk(() => same(f('C'), 'Tahoma'), () => `C1. layout + Tahoma: the written theme carries Tahoma: ${f('C')}`);
  chk(() => say('C') && say('C').font === 'Tahoma' && !('replaced' in say('C')) && /Tahoma/.test(say('C').say) && out.C.ans.design.font === 'Tahoma', () => `C2. the plan names Tahoma and its design uses it: ${JSON.stringify(say('C'))} ${out.C.ans && out.C.ans.design && out.C.ans.design.font}`);
  chk(() => same(f('D'), 'Tahoma') && !/Verdana/.test(allText(out.D.dir)), () => `D1. design Verdana + Tahoma: Tahoma in the theme and Verdana nowhere in the files: ${f('D')}`);
  chk(() => say('D') && say('D').font === 'Tahoma' && say('D').replaced === 'Verdana' && /Tahoma/.test(say('D').say) && /Verdana/.test(say('D').say) && /replaced/.test(say('D').say) && out.D.ans.design.font === 'Tahoma', () => `D2. the plan says Tahoma replaced Verdana: ${JSON.stringify(say('D'))}`);
  chk(() => same(f('E'), 'Verdana') && !say('E'), () => `E. design Verdana alone: Verdana, no fontSaid: ${f('E')} ${JSON.stringify(say('E'))}`);
  chk(() => same(f('F'), 'Verdana') && !say('F'), () => `F. explicit Segoe UI is the default, counts as none: Verdana kept: ${f('F')} ${JSON.stringify(say('F'))}`);
  chk(() => same(f('G'), 'Verdana') && !say('G') && (out.G.ans.repaired || []).some((r) => r.field === 'font'), () => `G. a font outside E.FONTS: Verdana kept, repaired names the font: ${f('G')} ${JSON.stringify(out.G.ans.repaired)}`);
  ['C', 'D'].forEach((k) => { const ar = path.join(ROOT, k, 'R AR.Report');
    chk(() => !tw[k] && fs.existsSync(ar) && fs.readFileSync(themeFile(ar), 'utf8') === fs.readFileSync(themeFile(out[k].dir), 'utf8') && same(facesOf(ar), 'Tahoma'), () => `T${k}. the twin's theme is the English report's, Tahoma: ${tw[k] || facesOf(ar)}`); });
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }
if (problems.length) { console.log(`FAIL script=mcp/test-0.3.3-ft2.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 1000))); console.log(`FAIL  ft2  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  ft2  ${checks} checks`);
