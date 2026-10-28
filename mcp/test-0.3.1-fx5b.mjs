import './test-env.mjs';
// 0.3.1 FX5b (the rest of the owner's D-1028-06: "why would i have a bar chart with three bars same length ... not make
// the bars that wide": his chart is on a plain text column, whose count FX5 did not know; mcp/work/FX5b.md; written red
// first on 396aaab):
//   S  create_report and plan_layout take columnStats, suggest_fields' shape (counts only): one schema, proved the same
//   C  a bar chart on a column of 3 values: padded at 36 on 1280 x 720 with columnStats; without them, unchanged; pinned
//   D  the sample project's own counts (its made-up rows): its Country and Channel charts padded; an edited sample: none
//   B  the bilingual report's Arabic pages carry the same padding (the twin identical, D-1027-12)
//   W  each padded chart said in plain words, English and Arabic, with no category's name or value
// Made-up data only: DataArcus's sample project (mcp/lib/sample-project.mjs). Metadata and counts only.
//   node test-0.3.1-fx5b.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const J = (x) => JSON.stringify(x).slice(0, 600);
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : undefined);

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx5b-')));
process.env.DATAARCUS_ROOT = ROOT;
const Plans = await import('./lib/plans.mjs');
const { LIMITS } = await import('./lib/tool-limits.mjs');
const H = {}, S = {};
for (const t of ['plan_layout', 'create_report', 'suggest_fields']) {
  const { register } = await import(`./tools/${t}.mjs`);
  register({ registerTool: (name, def, h) => { H[name] = h; S[name] = def.inputSchema; } }, { LIMITS });
}
const call = async (tool, a) => { try { const r = await H[tool](a), t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* words */ } return { err: !!r.isError, t, j }; } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
const short = (x) => (x.err ? x.t.slice(0, 400) : J(x.j));
// a plan, approved as the person's click does, then written
const writeOf = async (a, w) => { const p = await call('plan_layout', a), id = p.j && p.j.plan && p.j.plan.planId; if (!id) return { p, w: { err: true, t: 'no plan id: ' + short(p), j: null } }; Plans.approve(id, 'user-in-browser'); return { p, w: await call('create_report', Object.assign({}, w || a, { planId: id })) }; };
// every bar or column chart a written report holds: { page, type, title, pads: [inner, outer] }
const chartsIn = (dir) => { const out = []; const walk = (d) => { if (!fs.existsSync(d)) return; fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name === 'visual.json') {
  const j = JSON.parse(fs.readFileSync(f, 'utf8')), v = j.visual || {}; if (!/^clustered(Bar|Column)Chart$/.test(v.visualType || '')) return;
  const p = (((v.objects || {}).categoryAxis || [])[0] || { properties: {} }).properties, cat = ((((v.query || {}).queryState || {}).Category || {}).projections || [])[0];
  out.push({ page: path.basename(path.dirname(path.dirname(path.dirname(f)))), type: v.visualType, cat: cat && cat.queryRef, w: j.position.width, h: j.position.height, pads: [lit(p.innerPadding), lit(p.outerPadding)] }); } }); }; walk(dir); return out; };

try {
  // ---------- S: one schema, suggest_fields' ----------
  {
    const tries = [{ distinct: { 'Branches[Country]': 3 } }, { rows: { Sales: 648 } }, {}, { distinct: { 'A[B]': -1 } }, { distinct: { 'A[B]': 1.5 } }, { distinct: { 'A[B]': 'Dubai' } }, { values: { 'A[B]': ['Dubai'] } }, { distinct: { 'A[B]': 3 }, min: 1 }];
    const ok = (sch) => tries.map((x) => sch.safeParse(x).success);
    chk(() => S.create_report.columnStats && S.plan_layout.columnStats, () => `S1. create_report and plan_layout take columnStats: ${J([!!S.create_report.columnStats, !!S.plan_layout.columnStats])}`);
    chk(() => J(ok(S.create_report.columnStats)) === J(ok(S.suggest_fields.columnStats)) && J(ok(S.plan_layout.columnStats)) === J(ok(S.suggest_fields.columnStats)) && J(ok(S.suggest_fields.columnStats)) === '[true,true,true,false,false,false,false,false]',
      () => `S2. the same schema as suggest_fields': counts as whole numbers only, no value, nothing else (strict): ${J(get(() => [ok(S.create_report.columnStats), ok(S.suggest_fields.columnStats)]))}`);
    const d = String((S.create_report.columnStats || {}).description || '');
    chk(() => /Counts only, never values/.test(d) && /Cardinality from COLUMNSTATISTICS\(\); never pass its Min or Max/.test(d) && /"Table\[Column\]"/.test(d), () => `S3. its words are suggest_fields' (counts only, Cardinality, never Min or Max, "Table[Column]"): ${d.slice(0, 300)}`);
  }

  // ---------- the sample project, as a new user gets it ----------
  const sp = await call('plan_layout', { sample: true }), folder = sp.j && sp.j.sample && sp.j.sample.folder;
  Plans.approve(sp.j.plan.planId, 'user-in-browser');
  const sw = await call('create_report', { sample: true, path: folder, planId: sp.j.plan.planId });
  chk(() => !sw.err && fs.existsSync(path.join(ROOT, folder)), () => `the sample project is written: ${short(sw)}`);
  const { countsOfSample, sampleCounts } = await import('./lib/sample-counts.mjs');
  const { sampleFiles } = await import('./lib/sample-project.mjs');
  const { loadModel } = await import('./lib/model.mjs');

  // ---------- D: the sample's own counts ----------
  {
    const c = get(() => countsOfSample(sampleFiles(folder)));
    chk(() => c['Branches[Country]'] === 4 && c['Sales[Channel]'] === 2 && c['Products[Category]'] === 5 && c['Branches[City]'] === 6, () => `D1. the sample's own counts from its definition: Country 4, Channel 2, Category 5, City 6: ${J(c)}`);
    chk(() => J(get(() => sampleCounts(loadModel(folder)))) === J(c), () => 'D2. the sample on disk, as DataArcus wrote it: its own counts');
    // the reviewer's measured report: exec layout, filters on top, the second page, 1920 x 1080
    const args = { path: folder, name: 'FX5b', layout: 'exec', filters: 'top', secondPage: true };
    const { p, w } = await writeOf(args, null);
    const w2 = w.err && /pages or a design/.test(w.t) ? await call('create_report', Object.assign({ planId: p.j.plan.planId, design: p.j.design }, args)) : w;
    const cs = chartsIn(path.join(ROOT, folder, 'FX5b.Report'));
    const of = (cat, type, minW) => cs.filter((x) => x.cat === cat && x.type === type && x.w >= (minW || 0));
    chk(() => !w2.err && of('Branches.Country', 'clusteredColumnChart', 1800).length === 1 && J(of('Branches.Country', 'clusteredColumnChart', 1800)[0].pads) === '["88L","88L"]',
      () => `D3. the Details page's 1,872-wide column chart by Country (4): padding 88, columns 44.3 (was none, 480 each): ${w2.err ? short(w2) : J(cs)}`);
    chk(() => of('Sales.Channel', 'clusteredBarChart', 400).length >= 2 && of('Sales.Channel', 'clusteredBarChart', 400).every((x) => x.pads[0] === '52L' && x.pads[1] === '52L'),
      () => `D4. the Channel bar charts (2): padding 52 each (bars 44.1 and 44.9; was 85 and up): ${J(cs)}`);
    chk(() => of('Branches.Country', 'clusteredBarChart', 400).every((x) => x.pads[0] === undefined), () => `D5. guard: Country's 277-high bar chart (4, 28.1 each by default) keeps Desktop's look: ${J(cs)}`);
    const bt = w2.j && w2.j.barThickness;
    chk(() => bt && bt.charts.length === 3 && J(bt.charts.map((x) => [x.kind, x.categories, x.padding])) === '[["bar",2,52],["column",4,88],["bar",2,52]]' && bt.charts.every((x) => x.thickness <= 45 && x.max === 45),
      () => `D6. create_report's answer lists each padded chart (page, kind, count, padding, thickness, maximum): ${J(bt)}`);
    // never a category's name or value: none of the sample's countries, channels or cities in the words
    const vals = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Oman', 'Online', 'Store', 'Dubai', 'Riyadh'];
    chk(() => bt && bt.said && /^3 charts get thinner bars/.test(bt.said.en) && /^3 مخططات تصبح أشرطتها أرفع/.test(bt.said.ar) && /فئتان/.test(bt.said.ar) && !vals.some((v) => JSON.stringify(bt).includes(v)),
      () => `D7. said in English and Arabic (the dual for 2), with no category's name or value: ${J(bt && bt.said)}`);
    // an edited sample (a table file changed by its owner) is no longer DataArcus's: no counts
    const tf = path.join(ROOT, folder, 'Gulf Retail.SemanticModel/definition/tables/Branches.tmdl'), keep = fs.readFileSync(tf, 'utf8');
    fs.writeFileSync(tf, keep.replace('"Coral Walk", "Muscat", "Oman"', '"Coral Walk", "Muscat", "Bahrain"'));
    chk(() => get(() => sampleCounts(loadModel(folder))) === null, () => 'D8. guard: an edited sample gets no counts (its rows are its owner\'s now)');
    fs.writeFileSync(tf, keep);
  }

  // ---------- C: the count given (columnStats), on a model that is not the sample ----------
  {
    const dir = 'edited';
    fs.cpSync(path.join(ROOT, folder), path.join(ROOT, dir), { recursive: true });
    fs.rmSync(path.join(ROOT, dir, 'FX5b.Report'), { recursive: true, force: true }); fs.rmSync(path.join(ROOT, dir, 'FX5b.pbip'), { force: true });
    const pages = [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'bar', title: 'Sales by product category', x: 20, y: 20, w: 600, h: 277 }] }];
    const fields = { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Year Month]', category: 'Products[Category]', category2: 'Branches[Country]', table: ['Products[Category]', 'Sales[Total Sales]'], slicers: [] };
    const base = { path: dir, pages }, stats = { distinct: { 'Products[Category]': 3 } };
    const run = async (name, cs) => { const a = Object.assign({ name }, base, cs ? { columnStats: cs } : {}); return writeOf(Object.assign({ planFields: fields }, a), Object.assign({ fields }, a)); };
    const r1 = await run('With', stats), c1 = chartsIn(path.join(ROOT, dir, 'With.Report')).filter((x) => x.type === 'clusteredBarChart' && x.h === 277);
    chk(() => !r1.w.err && c1.length === 1 && J(c1[0].pads) === '["36L","36L"]', () => `C1. a bar chart on a column of 3 values (columnStats), 277 high at 1280 x 720: padding 36, bars 35.4: ${r1.w.err ? short(r1.w) : J(c1)}`);
    const r0 = await run('Without', null), c0 = chartsIn(path.join(ROOT, dir, 'Without.Report')).filter((x) => x.type === 'clusteredBarChart' && x.h === 277);
    chk(() => !r0.w.err && c0.length === 1 && J(c0[0].pads) === '[null,null]' && !(r0.w.j || {}).barThickness, () => `C2. guard: without columnStats (and not the sample): unchanged, nothing said: ${r0.w.err ? short(r0.w) : J([c0, r0.w.j.barThickness])}`);
    // pinned with the plan: another count at the write is refused, nothing written
    const p3 = await call('plan_layout', Object.assign({ name: 'Pinned', planFields: fields, columnStats: stats }, base)); Plans.approve(p3.j.plan.planId, 'user-in-browser');
    const w3 = await call('create_report', Object.assign({ name: 'Pinned', fields, columnStats: { distinct: { 'Products[Category]': 12 } }, planId: p3.j.plan.planId }, base));
    chk(() => w3.err && /Nothing was written/.test(w3.t) && /columnStats/.test(w3.t) && !fs.existsSync(path.join(ROOT, dir, 'Pinned.Report')), () => `C3. columnStats is pinned with the plan: another count at the write is refused: ${short(w3)}`);
    // the plan shows the counts it was given with its look (plan_layout's own list of the options it pins)
    const rl = get(() => p3.j.plan.reportLook);
    chk(() => J(rl.columnStats) === J(stats), () => `C4. the plan shows the counts it pins with the report's options (plan.reportLook): ${J(rl || null)}`);
    const v = r1.w.j && r1.w.j.check && r1.w.j.check.validator;
    chk(() => v && v.ran && v.canBreak === 0, () => `C5. Microsoft's validator on the written files: nothing that can break: ${J(v)}`);
  }

  // ---------- B: the bilingual report (English and Arabic pages, one write) ----------
  {
    // (changed 28 Oct 2026, FX3's rule, the owner's D-1027-04: a bilingual plan gives its id only once the Arabic pages'
    // texts are approved or kept English on purpose; here every drafted text is approved, the others kept English, as
    // sq10 K2-S1 does. The check of the padding is unchanged)
    const args0 = { path: folder, name: 'FX5bBi', layout: 'exec', filters: 'top', secondPage: true, languages: 'en+ar' }, biTexts = {};
    const bi0 = await call('plan_layout', args0);
    ((bi0.j && bi0.j.bilingual && bi0.j.bilingual.texts) || []).forEach((x) => { biTexts[x.text] = x.draftArabic || x.text; });
    const args = Object.assign({}, args0, { arabicTexts: biTexts });
    const { p, w } = await writeOf(args, null);
    const w2 = w.err && /pages or a design/.test(w.t) ? await call('create_report', Object.assign({ planId: p.j && p.j.plan && p.j.plan.planId, design: p.j && p.j.design }, args)) : w;
    const cs = chartsIn(path.join(ROOT, folder, 'FX5bBi.Report')), col = cs.filter((x) => x.type === 'clusteredColumnChart' && x.w >= 1800);
    chk(() => !w2.err && col.length === 2 && col.every((x) => J(x.pads) === '["88L","88L"]'), () => `B1. the bilingual report: the column chart by Country padded 88 on its English and its Arabic page: ${w2.err ? short(w2) : J(col)}`);
  }

  // ---------- W: the words, and where they are said ----------
  {
    const { barSaid } = await import('./lib/report-said.mjs');
    const one = get(() => barSaid([{ page: 'Overview', kind: 'column', categories: 1, padding: 96, thickness: 36.7, max: 45 }])), many = get(() => barSaid(Array.from({ length: 11 }, () => ({ page: 'P', kind: 'bar', categories: 12, padding: 30, thickness: 30, max: 36 }))));
    chk(() => /^One chart gets thinner bars/.test(one.said.en) && /\(1 category: 96% space between them, bars 36\.7 thick\)/.test(one.said.en) && /^مخطط واحد تصبح أشرطته أرفع/.test(one.said.ar) && /فئة واحدة/.test(one.said.ar) && /^11 مخططًا/.test(many.said.ar) && /12 فئة/.test(many.said.ar) && get(() => barSaid([])) === null,
      () => `W1. the words for one chart, eleven, one and twelve categories (Arabic number forms); nothing for none: ${J([one, many && many.said.ar])}`);
    const tools = fs.readFileSync(path.join(HERE, 'TOOLS.md'), 'utf8'), cl = fs.readFileSync(path.join(HERE, 'CHANGELOG.md'), 'utf8');
    const sec = tools.slice(tools.indexOf('## `create_report`'), tools.indexOf('## `check_report`'));
    chk(() => /^`columnStats` \(0\.3\.1, FX5b\): counts only/m.test(sec) && /never its Min or Max/.test(sec) && /`barThickness`/.test(sec), () => 'W2. TOOLS.md: create_report\'s columnStats paragraph (counts only, never Min or Max, barThickness)');
    chk(() => /columnStats/.test(cl.slice(0, cl.indexOf('## [Unreleased]: 0.2.9.1'))) && /sample project/.test(cl.slice(cl.indexOf('Bars and columns are never too thick'), cl.indexOf('Bars and columns are never too thick') + 1200)), () => 'W3. the CHANGELOG line says the counts given and the sample\'s own');
  }
} catch (e) {
  problems.push('the suite stopped: ' + String(e && e.stack || e).slice(0, 600));
} finally {
  fs.rmSync(ROOT, { recursive: true, force: true });
}
if (problems.length) { console.log(`FAIL script=test-0.3.1-fx5b.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  fx5b  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  fx5b  ${checks} checks`);
process.exit(0);
