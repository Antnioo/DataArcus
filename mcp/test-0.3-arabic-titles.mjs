// 0.3.0 release, R2 (the owner's must-fix, 19 Oct 2026; written red first): an Arabic report written from a model whose
// tables, columns and measures have English names showed English titles ("Web Orders Total Score by Plan Group").
// The rule: every text an Arabic report shows is Arabic, or the plan lists it as not translated, with why, before the
// person approves. Field names the plan lists as kept in English are the only Latin words allowed.
//   AT-1  the engine: a title's language is the report's (its word, «حسب» or "by"), never the measure's script: two
//         English names in an Arabic report are not joined with "by"; no "and", "per", "last year", "ranked by"
//   AT-2  the gallery (combo, waterfall, small multiples) on an English-named model written in Arabic, gallery: true
//   AT-3  the golden model (English names) through plan_layout + create_report in Arabic, exec and ops layouts with the
//         tooltip page: the plan pins the glossary's Arabic names and lists every other field as kept in English (why);
//         no Latin word in any written title, label, header, button, page name, alt text or text measure except the
//         words of those fields' names
//   AT-4  the English report is unchanged (its titles as before the fix)
//   node test-0.3-arabic-titles.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e) }; } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

const ST = req('../assets/js/story-titles.js'), Q = req('../assets/js/pbip-query.js'), G = req('../assets/js/visual-gallery.js');
const Px = req('../assets/js/pbip-export.js'), E = req('../assets/js/design-engine.js');

// ---- the texts a viewer sees, from written files (path -> JSON) ----
const TEXT_KEYS = new Set(['text', 'altText', 'showBlankAs', 'titleText', 'subTitleText', 'tooltipText', 'placeholderText', 'labelText', 'headerText']);
const lit = (p) => (p && p.expr && p.expr.Literal && typeof p.expr.Literal.Value === 'string' ? p.expr.Literal.Value.replace(/^'|'$/g, '').replace(/''/g, "'") : null);
function shownTexts(files) {
  const out = [];
  const walk = (o, where) => {
    if (Array.isArray(o)) { o.forEach((x) => walk(x, where)); return; }
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'properties' && v && typeof v === 'object') Object.entries(v).forEach(([pk, pv]) => { const s = TEXT_KEYS.has(pk) ? lit(pv) : null; if (s) out.push({ where, what: pk, s }); });
      if (k === 'textRuns' && Array.isArray(v)) v.forEach((t) => t && typeof t.value === 'string' && out.push({ where, what: 'text box', s: t.value }));
      if (k === 'projections' && Array.isArray(v)) v.forEach((p) => p && typeof p.displayName === 'string' && p.displayName.trim() && out.push({ where, what: 'field header', s: p.displayName }));
      if (k === 'expression' && typeof v === 'string') (v.match(/"(?:[^"]|"")*"/g) || []).forEach((s) => out.push({ where, what: 'text measure', s: s.slice(1, -1) }));
      walk(v, where);
    }
  };
  for (const [f, j] of Object.entries(files)) {
    if (/page\.json$/.test(f) && j.displayName) out.push({ where: f, what: 'page name', s: j.displayName });
    if (/\.bookmark\.json$/.test(f) && j.displayName) out.push({ where: f, what: 'bookmark name', s: j.displayName });
    if (/(visual|mobile|page|reportExtensions)\.json$/.test(f)) walk(j, f);
  }
  return out;
}
// Latin words of a text that are not words of the allowed names
const words = (s) => String(s).match(/[A-Za-z]+/g) || [];
const stray = (texts, allowed) => { const ok = new Set([].concat(...[...allowed].map(words)).map((w) => w.toLowerCase()));
  return texts.filter((t) => words(t.s).some((w) => !ok.has(w.toLowerCase()))).map((t) => `${t.what} "${t.s.slice(0, 90)}" (${t.where.replace(/^.*definition\//, '').slice(0, 60)})`); };
const uniq = (a) => [...new Set(a)];

try {
  // ---------- AT-1: the engine ----------
  {
    chk(() => ST.join('Web Orders Total Score', 'Plan Group', 'حسب') === 'Web Orders Total Score' && Q.byTitle('Web Orders Total Score', 'حسب', 'Plan Group') === 'Web Orders Total Score',
      () => `AT-1a. two English names in an Arabic report are not joined with "by" (the measure's name alone): ${ST.join('Web Orders Total Score', 'Plan Group', 'حسب')} | ${Q.byTitle('Web Orders Total Score', 'حسب', 'Plan Group')}`);
    chk(() => ST.join('Total Sales', 'Region', 'by') === 'Total Sales by Region' && Q.byTitle('Total Sales', 'by', 'Region') === 'Total Sales by Region' && ST.join('إجمالي المبيعات', 'المنطقة', 'حسب') === 'إجمالي المبيعات حسب المنطقة'
      && Q.byTitle('إجمالي المبيعات', 'حسب', 'Region') === 'إجمالي المبيعات' && ST.join('Total Sales', 'المنطقة', 'حسب') === 'Total Sales',
      () => 'AT-1b. unchanged: "M by C" in English, «M حسب C» in Arabic, one script per title');
    const v = ST.variants({ t: 'Sales', m: 'Sales PY' }, { t: 'Sales', c: 'Region' }, 'حسب');
    chk(() => v.every((x) => words(x.text).every((w) => ['Sales', 'PY'].includes(w))), () => `AT-1c. an English measure's time intelligence is not said in English words in an Arabic report: ${JSON.stringify(v.map((x) => x.text))}`);
    chk(() => ST.variants({ t: 'Sales', m: 'Sales PY' }, { t: 'Sales', c: 'Region' }, 'by')[0].text === 'Sales last year by Region' && ST.variants({ t: 'S', m: 'المبيعات PY' }, { t: 'S', c: 'المنطقة' }, 'حسب')[0].text === 'المبيعات في العام الماضي حسب المنطقة',
      () => 'AT-1d. unchanged: "Sales last year by Region" in English; an Arabic name\'s abbreviation in Arabic words');
    const alts = [2, 3, 4].map((n) => ST.alternate('Web Orders Total Score', 'Plan Group', n, true, 'حسب'));
    chk(() => alts.every((a) => a == null || words(a).every((w) => words('Web Orders Total Score Plan Group').includes(w))), () => `AT-1e. a second chart's other title adds no English words in an Arabic report: ${JSON.stringify(alts)}`);
    chk(() => ST.alternate('Total', 'Note', 2, true, 'by') === 'Note ranked by Total' && ST.alternate('إجمالي المبيعات', 'المنطقة', 2, true, 'حسب') === 'ترتيب المنطقة حسب إجمالي المبيعات', () => 'AT-1f. unchanged: the alternates of English and Arabic reports');
  }

  // ---------- AT-2: the gallery, English names, Arabic report ----------
  {
    const T = 'Sales', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x) => Object.assign({ t: T, c }, x || {});
    const AED = M('Sales PY', { cardFormat: '"AED" #,0' }), PCT = M('Margin %', { pct: true, pctFormat: '0.0%' });
    const QUARTER = C('Quarter', { kind: 'quarter' }), CITY = C('City'), REGION = C('Region', { kind: 'region', rows: 5 }), CH = C('Channel', { kind: 'channel', rows: 4 });
    const B = { kpis: [AED, PCT], measure: AED, date: QUARTER, cats: { bar: CITY, column: CH, donut: C('Channel'), split: REGION }, y: {}, table: [CITY, AED], slicers: [CITY, null, null], tip: { card: AED, cat: CITY, y: AED } };
    const names = ['Sales PY', 'Margin %', 'Quarter', 'City', 'Region', 'Channel', 'Sales'];
    const t = ['combo', 'waterfall', 'multiples'].map((k) => G.title(k, B, 'حسب'));
    chk(() => t.every((x) => x && words(x).every((w) => words(names.join(' ')).includes(w))), () => `AT-2a. gallery titles in an Arabic report add no English word ("and", "per", "by", "last year"): ${JSON.stringify(t)}`);
    chk(() => G.title('combo', Object.assign({}, B, { kpis: [M('Total Sales'), PCT], measure: M('Total Sales') }), 'by') === 'Total Sales and Margin % by Quarter', () => `AT-2b. unchanged in English: ${G.title('combo', Object.assign({}, B, { kpis: [M('Total Sales'), PCT], measure: M('Total Sales') }), 'by')}`);
    const d = E.fresh(); d.font = 'Tahoma'; E.repairState(d);
    const r = get(() => Px.build({ name: 'GA', title: 'تقرير', pageName: 'الصفحة', lang: 'ar', rtl: true, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'ar'), sample: false, gallery: true,
      model: { byPath: 'M.SemanticModel' }, bind: B, texts: E.REPORT_TEXTS.ar, chartAxes: 'mirrored', quietGrid: true,
      pages: [{ name: 'الصفحة', page: { w: 1280, h: 720 }, slots: [{ kind: 'combo', x: 20, y: 20, w: 610, h: 330 }, { kind: 'waterfall', x: 650, y: 20, w: 610, h: 330 }, { kind: 'multiples', x: 20, y: 370, w: 1240, h: 330 }], panel: null, hand: true, png: new Uint8Array([1]) }] }));
    const files = {}; (r.files || []).filter((f) => /\.json$/.test(f.path)).forEach((f) => { try { files[f.path] = JSON.parse(String(f.data)); } catch (e) { /* not JSON */ } });
    const types = Object.values(files).map((j) => j.visual && j.visual.visualType).filter(Boolean);
    // (D1, changed on purpose: a mirrored right-to-left waterfall is written as the stacked column chart, columnChart, read from the right)
    chk(() => types.includes('lineClusteredColumnComboChart') && types.includes('columnChart') && !types.includes('waterfallChart'), () => `AT-2c. the gallery kinds were written: ${r.threw || JSON.stringify(types)}`);
    const bad = stray(shownTexts(files), names);
    chk(() => r.files && !bad.length, () => `AT-2d. the Arabic gallery page shows no English word but the fields' names: ${JSON.stringify(uniq(bad).slice(0, 12))}`);
  }

  // ---------- AT-3, AT-4: the golden model through the tools ----------
  const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-at-'));
  process.env.DATAARCUS_ROOT = ROOT;
  fs.cpSync(path.join(REPO, 'mcp/test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
  const MP = 'large/Large Synthetic.SemanticModel';
  const s = await serverClient(ROOT, {});
  const readReport = (dir) => { const out = {}; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else if (f.endsWith('.json')) { try { out[path.relative(dir, f)] = rd(f); } catch (x) { /* not JSON */ } } }); rec(dir); return out; };
  const write = async (lang, layout, name) => {
    const pl = await s.call('plan_layout', { path: MP, focus: 'Web Orders', lang, layout, name, secondPage: true });
    const id = pl.j && pl.j.plan && pl.j.plan.planId; if (!id) return { pl, err: 'no plan: ' + String(pl.t).slice(0, 300) };
    const ap = await s.call('approve_plan', { planId: id });
    const r = await s.call('create_report', { path: MP, focus: 'Web Orders', lang, name, planId: id, design: pl.j.design });
    const dir = path.join(ROOT, 'large', name + '.Report');
    return { pl, ap, r, files: fs.existsSync(dir) ? readReport(dir) : {} };
  };
  for (const layout of ['exec', 'ops']) {
    const name = layout === 'exec' ? 'تقرير الطلبات' : 'مراقبة الطلبات';
    const w = await write('ar', layout, name);
    const an = (w.pl.j && w.pl.j.arabicNames) || {}, keep = Array.isArray(an.notTranslated) ? an.notTranslated : [];
    chk(() => !w.err && w.r && !w.r.err, () => `AT-3 ${layout}: the report was written: ${w.err || (w.r && String(w.r.t).slice(0, 300))}`);
    // the plan pins the glossary's names (Calendar[Year] -> «السنة») and says which were proposed
    const pins = (w.pl.j && w.pl.j.arabicNames && w.pl.j.arabicNames.inThePlan) || {};
    chk(() => pins['Calendar[Year]'] === 'السنة', () => `AT-3a ${layout}: the plan pins the proposed Arabic names (inThePlan): ${JSON.stringify(an).slice(0, 400)}`);
    const shownNames = new Set(); Object.values(w.files).forEach((j) => Object.values(((j.visual || {}).query || {}).queryState || {}).forEach((rl) => (rl.projections || []).forEach((p) => p.displayName && shownNames.add(p.displayName))));
    chk(() => shownNames.has('السنة'), () => `AT-3b ${layout}: the pinned name is written as the field's display name: ${JSON.stringify([...shownNames])}`);
    // every field shown under its English name is listed in the plan, with why, before the approval
    const missing = ((w.r && w.r.j && w.r.j.arabicNames) || {}).missing || [];
    chk(() => keep.length && keep.every((k) => k && k.field && /\S/.test(k.why || '')) && missing.every((m) => keep.some((k) => k.field === m)),
      () => `AT-3c ${layout}: the plan lists every field kept in English, with why (notTranslated), as create_report shows them: plan ${JSON.stringify(keep).slice(0, 300)}; written ${JSON.stringify(missing)}`);
    chk(() => /English/.test(String(an.sayInPlan || '')) && /before/i.test(String(an.sayInPlan || '')), () => `AT-3d ${layout}: the plan says it before the go (sayInPlan): ${String(an.sayInPlan).slice(0, 200)}`);
    const win = w.ap && w.ap.j ? JSON.stringify(w.ap.j) : '';
    const sum = (await import('./lib/approval-window.mjs')).summary;
    const pinsAll = { pins: { create_report: { lang: 'ar', name, displayNames: pins } }, notTranslated: keep };
    const sec = (sum('report', pinsAll).sections || []).find((x) => /English/.test(x.heading));
    chk(() => sec && keep.every((k) => sec.rows.some((row) => row[0] === k.field)), () => `AT-3e ${layout}: the approval window lists the fields kept in English: ${JSON.stringify(sum('report', pinsAll).sections.map((x) => x.heading))} ${win.slice(0, 0)}`);
    // no Latin word anywhere a viewer looks, except the words of the listed fields' names
    const allowed = keep.map((k) => String(k.field).replace(/^.*?\[(.*)\]$/, '$1'));
    const texts = shownTexts(w.files), bad = stray(texts, allowed);
    chk(() => texts.length > 20 && !bad.length, () => `AT-3f ${layout}: ${uniq(bad).length} texts with English words that are not a listed field's name: ${JSON.stringify(uniq(bad).slice(0, 14))}`);
    chk(() => Object.values(w.files).some((j) => j.pageBinding && j.pageBinding.type === 'Tooltip') || Object.keys(w.files).filter((f) => /page\.json$/.test(f)).length >= 2, () => `AT-3g ${layout}: a tooltip page was written (secondPage)`);
  }
  // AT-4: the English report's titles as before the fix (recorded on integration/0.3-preview ce8335b)
  {
    const w = await write('en', 'exec', 'Orders EN');
    const titles = uniq(shownTexts(w.files).filter((t) => t.what === 'text' && /visual\.json$/.test(t.where)).map((t) => t.s)).sort();
    if (process.env.AT_RECORD) fs.writeFileSync(path.join(HERE, 'test-models/arabic-titles-en.json'), JSON.stringify({ recorded: 'integration/0.3-preview ce8335b, before the R2 fix', titles }, null, 2) + '\n');
    const WAS = JSON.parse(fs.readFileSync(path.join(HERE, 'test-models/arabic-titles-en.json'), 'utf8')).titles;
    chk(() => JSON.stringify(titles) === JSON.stringify(WAS), () => `AT-4: the English report's titles are unchanged: ${JSON.stringify(titles)}`);
  }
  await s.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

if (problems.length) { console.log(`FAIL  arabic-titles  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  arabic-titles  ${checks} checks`);
