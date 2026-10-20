// 0.3.0 A3 (the owner's must-fix 1 for 0.3.0, "no English in Arabic reports"): the Arabic sweep of the whole wave.
// R2, D3 and J18 made Arabic reports Arabic; the wave since added texts that could bring English back (gallery kinds,
// the metric switcher page, flip cards' faces, status icons, the EN-AR toggle's buttons, the terminology sheet's
// isolates, the Gulf date questions, separate axes' unit titles, Power BI's native waterfall in Arabic).
// Every report DataArcus writes in Arabic, on every fixture of the repo (made-up models only), in three modes:
//   ar    plan_layout lang "ar" + create_report (twice: waterfallRtl "native" and "mirror")
//   twin  create_arabic_twin of the English report DataArcus writes with the same options
//   enar  create_arabic_twin into "same" (the EN-AR copy: its Arabic pages only)
// with every option on where the fixture allows it (gallery, smoothLines, slicerStyle pills, grid dotted,
// metricSwitcher, flipCards, statusIcons, terms approved and one declined, a Ramadan page filter, the phone layout, a
// second page). Every visible text is read from the written files (page and bookmark names, titles, text boxes,
// buttons, slicer and field headers, axis and legend titles, alt texts, "No data", mobile.json, the texts of the report
// measures a visual shows, and the TMDL scripts whose measures draw text on a page: the metric switcher's labels and
// title, the flip cards' faces) and each Latin-letter run is classed:
//   listed     the plan lists it as kept in English, with why (notTranslated, the terminology sheet's kept rows, a
//              `cannot` line naming the kind of text)
//   powerbi    Power BI's own word (not a defect; listed apart)
//   unlisted   a defect: the count must be 0 per fixture and mode
// Also: right to left (the first page button at the right, the KPI row mirrored, the pills reversed), one Arabic word
// per field, Latin runs inside Arabic texts isolated (U+2068 ... U+2069) where J18 isolates them; Microsoft's validator
// 0 errors and check_report 0 "can break" on every report written.
//   node test-0.3.0-arabic-sweep.mjs        (A3_DUMP=1 prints every text read)
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DUMP = !!process.env.A3_DUMP;
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const uniq = (a) => [...new Set(a)];
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const AR_DIGITS = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const ISO = /[⁦-⁩‎‏]/g;

// ---------------------------------------------------------------- the reader: every text a viewer sees ----------------
// the formatting properties whose quoted literal is a text a person reads
export const TEXT_PROPS = new Set(['text', 'altText', 'showBlankAs', 'titleText', 'subTitleText', 'tooltipText', 'placeholderText', 'labelText', 'headerText',
  'enabledTooltip', 'disabledTooltip', 'tooltip', 'customLabel', 'legendText', 'calloutText', 'displayName']);
const lit = (p) => (p && p.expr && p.expr.Literal && typeof p.expr.Literal.Value === 'string' && /^'.*'$/s.test(p.expr.Literal.Value) ? p.expr.Literal.Value.slice(1, -1).replace(/''/g, "'") : null);
// the report measures a visual uses ("Entity\0Name"): only those of reportExtensions.json are shown
const usedMeasures = (files) => { const used = new Set(); const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== 'object') return;
  if (o.Measure && o.Measure.Expression && o.Measure.Expression.SourceRef && o.Measure.Expression.SourceRef.Schema === 'extension') used.add(o.Measure.Expression.SourceRef.Entity + '\u0000' + o.Measure.Property);
  Object.values(o).forEach(walk); }; Object.entries(files).filter(([f]) => /visual\.json$/.test(f)).forEach(([, j]) => walk(j)); return used; };
// a DAX string literal that is a format string (FORMAT's second argument), never shown as such
const isFormat = (t) => /^[#0.,%;+\-\s()$€£¥:/\\EeHhMmSsDdYyAPap"]*$/.test(t) && /[#0]|^(d{1,4}|m{1,4}|y{2,4}|[dmy ]+|hh?:nn?(:ss)?)$/i.test(t.replace(/[\s/:.-]/g, ''));
// the visible words of a DAX text: an SVG picture's text nodes, else the literal as it is
const svgText = (s) => { let t = s; try { t = decodeURIComponent(s.replace(/%(?![0-9A-Fa-f]{2})/g, '%25')); } catch (e) { /* as it is */ }
  if (!/^data:image\/svg|<svg|<\/div>|<div/.test(t)) return [t];
  return t.replace(/^data:image\/svg\+xml;utf8,/, '').replace(/<style>[\s\S]*?<\/style>/g, ' ').split(/<[^>]*>/).map((x) => x.trim()).filter(Boolean); };
const daxStrings = (expr) => (String(expr).match(/"(?:[^"]|"")*"/g) || []).map((s) => s.slice(1, -1).replace(/""/g, '"'));
const daxTexts = (expr) => daxStrings(expr).filter((t) => !isFormat(t) && !/^&[a-z]+;$/.test(t)).flatMap(svgText).filter((t) => /\p{L}/u.test(t));

// texts: [{ where, what, s }]; pages: the page ids whose visuals count (null: all); keys: every other literal property
// that holds Latin letters (to prove no text property is missed: printed with A3_DUMP)
export function shownTexts(files, pages) {
  const out = [], other = [], used = usedMeasures(files);
  const onPage = (f) => { if (!pages) return true; const m = f.match(/^definition\/pages\/([^/]+)\//); return !!m && pages.has(m[1]); };
  const walk = (o, where, obj) => {
    if (Array.isArray(o)) { o.forEach((x) => walk(x, where, obj)); return; }
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'properties' && v && typeof v === 'object') Object.entries(v).forEach(([pk, pv]) => { const s = lit(pv); if (s == null) return; if (TEXT_PROPS.has(pk)) { if (/\p{L}/u.test(s)) out.push({ where, what: `${obj}.${pk}`, s }); } else if (/[A-Za-z]/.test(s)) other.push({ where, what: `${obj}.${pk}`, s }); });
      if (k === 'textRuns' && Array.isArray(v)) v.forEach((t) => t && typeof t.value === 'string' && t.value.trim() && out.push({ where, what: 'text box', s: t.value }));
      if (k === 'projections' && Array.isArray(v)) v.forEach((p) => p && typeof p.displayName === 'string' && p.displayName.trim() && out.push({ where, what: 'field header', s: p.displayName }));
      walk(v, where, k === 'properties' ? obj : k);
    }
  };
  for (const [f, j] of Object.entries(files)) {
    if (/page\.json$/.test(f) && onPage(f) && j.displayName) out.push({ where: f, what: 'page name', s: j.displayName });
    if (/\.bookmark\.json$/.test(f) && j.displayName && (!pages || pages.has(((j.explorationState || {}).activeSection) || ''))) out.push({ where: f, what: 'bookmark name', s: j.displayName });
    if (/(visual|mobile|page)\.json$/.test(f) && onPage(f)) walk(j, f, '');
  }
  // the report measures the counted pages' visuals show
  const usedHere = usedMeasures(Object.fromEntries(Object.entries(files).filter(([f]) => onPage(f))));
  const ext = files['definition/reportExtensions.json'];
  if (ext) (ext.entities || []).forEach((e) => (e.measures || []).forEach((m) => { if (usedHere.has(e.name + '\u0000' + m.name) && typeof m.expression === 'string') daxTexts(m.expression).forEach((t) => out.push({ where: 'reportExtensions ' + m.name, what: 'measure text', s: t })); }));
  void used;
  return { texts: out, other };
}
// the TMDL scripts written next to the project whose measures put text on a page: the switcher's labels (its
// partition's rows) and its title measure, the flip cards' faces (picture measures)
export function scriptTexts(file) {
  const t = fs.readFileSync(file, 'utf8'), out = [], base = path.basename(file);
  if (/metric switcher\.tmdl$/.test(base)) {
    const part = t.match(/partition [\s\S]*?source =([\s\S]*?)\n\s*\}/); if (part) (part[1].match(/\(\s*"(?:[^"]|"")*"/g) || []).forEach((x) => out.push({ where: base, what: 'switcher label', s: x.replace(/^\(\s*"/, '').slice(0, -1).replace(/""/g, '"') }));
    (t.match(/measure '[^']*Title[^']*' = .*/g) || []).forEach((m) => daxTexts(m).forEach((s) => out.push({ where: base, what: 'switcher title', s })));
  }
  if (/flip cards\.tmdl$/.test(base)) {
    const ms = t.split(/\n\t\tmeasure /).slice(1);
    ms.forEach((m) => { const name = (m.match(/^'([^']*)'/) || [])[1] || '?'; const body = (m.match(/```([\s\S]*?)```/) || [])[1] || m.split('\n')[0];
      daxTexts(body).forEach((s) => out.push({ where: `${base} ${name}`, what: 'flip face', s })); });
  }
  return out;
}
const readReport = (dir) => { const out = {}; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else if (f.endsWith('.json')) { try { out[path.relative(dir, f).split(path.sep).join('/')] = rd(f); } catch (x) { /* not JSON */ } } }); rec(dir); return out; };
// Latin-letter runs of a text: words of Latin letters (digits and marks inside a run kept with it)
export const latinRuns = (s) => (String(s).replace(ISO, '').match(/[A-Za-z][A-Za-z0-9'’&._%-]*(?:[  ]+[A-Za-z0-9][A-Za-z0-9'’&._%-]*)*/g) || []);
// Power BI's own words (not ours: they follow the viewer's Power BI language)
const POWERBI_WORDS = new Set(['All', 'Select all', '(Blank)']);

// ---------------------------------------------------------------- the fixtures (made up) -----------------------------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-a3-')));
const FX = [
  { id: 'F1 large-synthetic (Web Orders)', src: 'test-models/large-synthetic', dir: 'large', model: 'large/Large Synthetic.SemanticModel', focus: 'Web Orders',
    switcher: ['Web Orders[Web Orders Total Score]', 'Web Orders[Web Orders Count]', 'Web Orders[Web Orders Total Value]'], ramadan: [{ field: 'Calendar[Is Ramadan]', values: [true] }], planFields: { slicers: ['Calendar[Is Weekend]', 'Coupon[Coupon Region]'] }, filters: 'top' },
  { id: 'F2 arabic-long-names', src: 'test-models/arabic-long-names', dir: 'along', model: 'along/Arabic Long Names.SemanticModel',
    switcher: ['المبيعات اليومية[إجمالي صافي المبيعات بعد الخصومات والمرتجعات]', 'المبيعات اليومية[عدد الفواتير الصادرة خلال الفترة المحددة]'], ramadan: [{ field: 'التقويم[هل هو شهر رمضان]', values: [true] }] },
  { id: 'F3 health-project', src: 'fixtures/health-project', dir: 'health', model: 'health/Health Test.SemanticModel', switcher: ['_Measures[Total]', '_Measures[Unused One]'] },
  { id: 'F4 twin-project', src: 'fixtures/twin-project', dir: 'twin', model: 'twin/Twin Sales.SemanticModel', switcher: ['Sales[Total Sales]', 'Sales[Orders]'], own: 'twin/Twin Sales.pbip' },
  { id: 'F5 no-measures', src: 'test-models/no-measures', dir: 'nom', model: 'nom/Plain Orders.SemanticModel' }   // (no measure: the visuals that need one are left out)
];
FX.forEach((x) => fs.cpSync(path.join(HERE, x.src), path.join(ROOT, x.dir), { recursive: true }));
const OPT = { gallery: true, smoothLines: true, slicerStyle: 'pills', grid: 'dotted', flipCards: true, statusIcons: true, secondPage: true, layout: 'exec' };
const WORDS = ['المبيعات', 'الطلبات', 'القيمة', 'المنطقة', 'الخطة', 'الشهر', 'المتوسط', 'العدد', 'الهدف', 'الربح', 'الدرجة', 'العميل'];
let made = 0, latinNamed = 0; const arName = () => { const w = WORDS[made % WORDS.length], n = Math.floor(made / WORDS.length); made++; return n ? `${w} ${AR_DIGITS(n + 1)}` : w; };

const results = [];   // per fixture x mode: { fx, mode, texts, runs, listed, powerbi, unlisted: [...] }
const tmdlIn = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.tmdl')).map((f) => path.join(dir, f)) : []);

// classify every Latin run of the texts read against what the plan lists as kept in English
function classify(fx, mode, texts, kept, cats) {
  const r = { fx: fx.id, mode, texts: texts.length, runs: 0, listed: 0, powerbi: [], unlisted: [], listedRuns: [] };
  const keptS = kept.filter(Boolean).map((x) => String(x).replace(ISO, ''));
  texts.forEach((t) => latinRuns(t.s).forEach((run) => {
    r.runs++;
    const why = POWERBI_WORDS.has(run) ? 'powerbi' : keptS.some((k) => k.includes(run)) ? 'listed' : (cats.find((c) => c.test(t)) || {}).name;
    if (why === 'powerbi') r.powerbi.push(run);
    else if (why) { r.listed++; r.listedRuns.push(`${run} (${why === 'listed' ? 'notTranslated/kept' : why})`); }
    else r.unlisted.push(`${t.what} "${run}" in "${String(t.s).replace(ISO, '').slice(0, 70)}" (${t.where.replace(/^definition\//, '').slice(0, 70)})`);
  }));
  if (DUMP) { console.log(`---- ${fx.id} / ${mode}: ${texts.length} texts`); texts.forEach((t) => console.log(`   ${t.what.padEnd(28)} ${JSON.stringify(t.s).slice(0, 110)}   [${t.where.replace(/^definition\/pages\//, '').slice(0, 50)}]`)); }
  results.push(r);
  return r;
}

// ---- right to left, one word per field, isolates: on the counted pages of a written Arabic report ----
const structureRows = [];
function structure(fx, mode, F, pages) {
  const order = ((F['definition/pages/pages.json'] || {}).pageOrder || []).filter((p) => !pages || pages.has(p));
  const shownPages = order.filter((p) => ((F[`definition/pages/${p}/page.json`] || {}).visibility) !== 'HiddenInViewMode' || pages);
  const vis = (pg) => Object.entries(F).filter(([f]) => f.startsWith(`definition/pages/${pg}/visuals/`) && f.endsWith('/visual.json')).map(([, j]) => j);
  const L = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '') : null);
  const row = { fx: fx.id, mode, navPages: 0, navBad: [], kpiPages: 0, kpiBad: [], pills: 0, pillsBad: [], fields: 0, fieldsBad: [], isolated: 0, isoBad: [], rawMixed: [] };
  order.forEach((pg) => {
    const vs = vis(pg), byName = new Map(vs.map((v) => [v.name, v]));
    const absX = (v) => { let x = (v.position || {}).x || 0, g = v.parentGroupName, n = 0; while (g && byName.has(g) && n++ < 9) { x += (byName.get(g).position || {}).x || 0; g = byName.get(g).parentGroupName; } return x; };
    // 1. the page buttons: the first page at the right
    const nav = vs.filter((v) => v.visual && v.visual.visualType === 'actionButton').map((v) => { const l = ((v.visual.visualContainerObjects || {}).visualLink || []).find((e) => e.properties && L(e.properties.type) === 'PageNavigation'); return l ? { v, to: L(l.properties.navigationSection) } : null; })
      .filter((x) => x && order.includes(x.to));
    if (nav.length > 1) { row.navPages++; const byX = nav.slice().sort((a, b) => absX(b.v) - absX(a.v)).map((x) => order.indexOf(x.to)); if (byX.some((k, i) => i && k < byX[i - 1])) row.navBad.push(`${pg}: page buttons from the right go to pages ${JSON.stringify(byX)}`); }
    // 2. the KPI row: reading order (tabOrder) from the right
    const kpis = vs.filter((v) => v.visual && (v.visual.visualType === 'cardVisual' || (v.visual.visualType === 'image' && /flip front/.test(JSON.stringify(v.visual.objects || {})))) && !v.parentGroupName !== undefined);
    const top = Math.min(...kpis.map((v) => (v.position || {}).y + (v.parentGroupName && byName.has(v.parentGroupName) ? (byName.get(v.parentGroupName).position || {}).y || 0 : 0)));
    const row1 = kpis.filter((v) => Math.abs(((v.position || {}).y + (v.parentGroupName && byName.has(v.parentGroupName) ? (byName.get(v.parentGroupName).position || {}).y || 0 : 0)) - top) < 2);
    if (row1.length > 1) { row.kpiPages++; const xs = row1.slice().sort((a, b) => (a.position.tabOrder || 0) - (b.position.tabOrder || 0)).map(absX); if (xs.some((x, i) => i && x > xs[i - 1])) row.kpiBad.push(`${pg}: the KPI row in reading order (tabOrder) sits at x ${JSON.stringify(xs.map(Math.round))} (want from the right)`); }
    // 3. the pills: one row, read from the right (sorted descending)
    vs.filter((v) => v.visual && v.visual.visualType === 'advancedSlicerVisual').forEach((v) => { const lay = ((v.visual.objects || {}).layout || []).find((e) => !e.selector && e.properties); if (!lay || L(lay.properties.rowCount) !== '1L') return;
      row.pills++; const sd = (((v.visual.query || {}).sortDefinition || {}).sort || [])[0]; if (!sd || sd.direction !== 'Descending') row.pillsBad.push(`${pg}/${v.name}: one-row pills sorted ${sd ? sd.direction : 'by Power BI (ascending)'}`); });
  });
  // 4. one word per field: every header of a field on the counted pages the same
  const names = new Map();
  // (a role switched by a field parameter, the metric switcher's charts: its projections are the parameter's measures,
  // shown under the parameter's own labels: not counted here; For the laptop)
  const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== 'object') return; if (Array.isArray(o.projections) && !Array.isArray(o.fieldParameters)) o.projections.forEach((p) => { const f = p && p.field, c = f && (f.Column || f.Measure || f.Aggregation && f.Aggregation.Expression && f.Aggregation.Expression.Column); if (!c || !c.Expression || !c.Expression.SourceRef) return;
    const k = `${c.Expression.SourceRef.Entity || c.Expression.SourceRef.Schema}[${c.Property}]`; if (!names.has(k)) names.set(k, new Set()); names.get(k).add(p.displayName != null ? String(p.displayName).replace(ISO, '') : '(the model\'s name)'); }); Object.values(o).forEach(walk); };
  order.forEach((pg) => vis(pg).forEach((v) => walk(v.visual && v.visual.query)));
  row.fields = names.size; names.forEach((set, k) => { if (set.size > 1) row.fieldsBad.push(`${k}: ${JSON.stringify([...set])}`); });
  // 5. isolates: a Latin run of an approved name inside Arabic text wrapped in U+2068 ... U+2069 (J18); a kept English
  // name written raw inside Arabic text is counted apart (J18 left isolating those to the owner)
  shownTexts(F, pages).texts.forEach((t) => { const raw = String(t.s); if (!/[؀-ۿ]/.test(raw) || !/[A-Za-z]/.test(raw)) return;
    [...raw.matchAll(/KPI/g)].forEach((m) => { row.isolated++; if (raw[m.index - 1] !== '⁨') row.isoBad.push(`${t.what} ${JSON.stringify(raw)}`); });
    latinRuns(raw).filter((r) => !/^KPI/.test(r)).forEach((r) => { const i = raw.indexOf(r); if (raw[i - 1] !== '⁨') row.rawMixed.push(r); }); });
  structureRows.push(row);
  chk(() => !row.navBad.length, () => `${fx.id} ${mode}: page buttons not from the right: ${JSON.stringify(row.navBad.slice(0, 4))}`);
  chk(() => !row.kpiBad.length, () => `${fx.id} ${mode}: KPI row not read from the right: ${JSON.stringify(row.kpiBad.slice(0, 4))}`);
  chk(() => !row.pillsBad.length, () => `${fx.id} ${mode}: pills not from the right: ${JSON.stringify(row.pillsBad.slice(0, 4))}`);
  chk(() => !row.fieldsBad.length, () => `${fx.id} ${mode}: a field under two names: ${JSON.stringify(row.fieldsBad.slice(0, 6))}`);
  chk(() => !row.isoBad.length, () => `${fx.id} ${mode}: an approved name's Latin run not isolated: ${JSON.stringify(row.isoBad.slice(0, 4))}`);
}

const s0 = await serverClient(ROOT, {});
try {
  for (const fx of FX.filter((x) => !process.env.A3_ONLY || x.id.startsWith(process.env.A3_ONLY))) {
    const s = await serverClient(ROOT, {});
    const ask = (n, a) => s.call(n, a);
    const base = Object.assign({ path: fx.model }, fx.focus ? { focus: fx.focus } : {});
    const projectDir = path.join(ROOT, fx.dir);
    if (fx.none) {
      // no measure: no report can be written (no card or chart can be bound); nothing written in any mode
      const pl = await ask('plan_layout', Object.assign({}, base, OPT, { lang: 'ar', name: 'تقرير' }));
      const id = pl.j && pl.j.plan && pl.j.plan.planId;
      const before = fs.readdirSync(projectDir).length;
      let wrote = false; if (id) { await ask('approve_plan', { planId: id }); const r = await ask('create_report', Object.assign({}, base, OPT, { lang: 'ar', name: 'تقرير', planId: id, design: pl.j.design })); wrote = !r.err; }
      chk(() => !wrote && fs.readdirSync(projectDir).length === before, () => `${fx.id}: a model with no measure gets no Arabic report (nothing written): ${short(pl)}`);
      results.push({ fx: fx.id, mode: 'ar / twin / enar', na: 'no measure: no report can be written (refused, nothing written)' });
      await s.close(); continue;
    }
    // ---- a plan the person approves: the Gulf date questions answered, the shared-axes questions answered, every
    // proposed Arabic name approved but one, which the person declines (kept in English) ----
    const plan = async (a) => {
      let args = Object.assign({}, a), pl = await ask('plan_layout', args);
      for (let i = 0; i < 4 && !pl.err; i++) {
        const j = pl.j || {}, more = {};
        const gd = j.gulfDates && j.gulfDates.askNext;
        if (gd && !args.gulfDates) more.gulfDates = { dateRole: (((j.gulfDates.candidates || [])[0]) || {}).field, grain: 'gregorian', scope: 'all' };
        const sa = j.sharedAxes && j.sharedAxes.ask;
        if (sa && sa.length && !args.sharedAxes) more.sharedAxes = sa.map((q, k) => ({ measures: q.measures, answer: k % 2 ? 'separate' : 'comparable' }));
        const an = j.arabicNames;
        if (a.lang === 'ar' && an && !args.displayNames && (an.proposeYourself || []).length) {
          const dn = {}, all = an.proposeYourself.slice(), declined = all.pop();
          all.forEach((f, k) => { dn[f] = k === 0 ? `مؤشر KPI ${AR_DIGITS(++latinNamed)}` : arName(); }); dn[declined] = declined.replace(/^.*\[(.*)\]$/, '$1');
          Object.assign(dn, an.suggestedDisplayNames || {}); more.displayNames = dn; more.declined = declined;
        }
        if (more.gulfDates && !more.gulfDates.dateRole) delete more.gulfDates;
        if (!Object.keys(more).length) break;
        const declined = more.declined; delete more.declined; args = Object.assign(args, more); if (declined) args.__declined = declined;
        const send = Object.assign({}, args); delete send.__declined; pl = await ask('plan_layout', send);
      }
      return { pl, args };
    };
    const write = async (a, tool = 'create_report') => {
      const { pl, args } = await plan(a); const id = pl.j && pl.j.plan && pl.j.plan.planId;
      if (!id) return { err: `no plan id: ${JSON.stringify((pl.j || {}).planProblems || (pl.j || {}).gulfDates || pl.t).slice(0, 600)}`, pl };
      await ask('approve_plan', { planId: id });
      const send = Object.assign({}, args, { planId: id, design: pl.j.design }); delete send.__declined; delete send.displayNames;   // the plan pins the approved names (with the fixed list's)
      if (send.planFields) { send.fields = send.planFields; delete send.planFields; }
      const r = await ask(tool, send);
      return r.err ? { err: String(r.t).slice(0, 500), pl } : { r, pl, args };
    };
    const opt = Object.assign({}, OPT, fx.switcher ? { metricSwitcher: fx.switcher } : {}, fx.ramadan ? { pageFilters: fx.ramadan } : {}, fx.planFields ? { planFields: fx.planFields } : {}, fx.filters ? { filters: fx.filters } : {});
    // Microsoft's validator 0 errors and check_report 0 "can break" on every report written
    const checked = async (what, pbip) => { const c = await ask('check_report', { path: pbip }), j = c.j || {};
      chk(() => !c.err && j.validator && j.validator.ran && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0, () => `${fx.id} ${what}: validator 0 errors and check_report 0 "can break": ${c.err ? String(c.t).slice(0, 300) : JSON.stringify({ v: j.validator, canBreak: j.impact && j.impact.kinds.canBreak })}`.slice(0, 700)); };

    // ---------------------------------------------------------------- mode ar (direct), native and mirror -------------
    for (const wf of ['native', 'mirror']) {
      const name = `تقرير ${wf === 'native' ? 'أ' : 'ب'}`, before = new Set(tmdlIn(projectDir));
      const w = await write(Object.assign({}, base, opt, { lang: 'ar', name, waterfallRtl: wf }));
      const dir = path.join(projectDir, name + '.Report');
      chk(() => !w.err && fs.existsSync(dir), () => `${fx.id} ar/${wf}: written: ${w.err}`);
      if (w.err || !fs.existsSync(dir)) continue;
      const F = readReport(dir), { texts, other } = shownTexts(F, null);
      const scripts = tmdlIn(projectDir).filter((f) => !before.has(f));
      // (the reviewer's decision, 20 Oct: an Arabic flip card's front says its units in Arabic words, 3.43 ألف, 1.20 مليون,
      // 2.05 مليار, Western digits, the word after the number; English keeps K, M, B): nothing kept in English for them
      const flipScript = scripts.find((f) => /flip cards\.tmdl$/.test(f));
      if (flipScript) { const t = fs.readFileSync(flipScript, 'utf8'), enc = (x) => x.replace(/[^\x20-\x7E]/gu, (c) => encodeURIComponent(c));   // (the picture's rule: flip-cards.mjs enc)
        chk(() => !/& "[KMB]"/.test(t) && [' ألف', ' مليون', ' مليار'].every((u) => t.includes(enc(u))) && /FORMAT \( _v \/ 1E3, "#,0\.00" \)/.test(t),
          () => `${fx.id} ar/${wf}: the flip cards' front writes Arabic unit words (ألف، مليون، مليار) after a Western-digit number, never K, M, B: ${(t.match(/VAR _[tu] = [^\n]*1E3[^\n]*/g) || []).join(' | ').slice(0, 500)}`);
        chk(() => !((w.pl.j || {}).flipCards || {}).keptInEnglish, () => `${fx.id} ar/${wf}: no flip card unit is kept in English: ${JSON.stringify(((w.pl.j || {}).flipCards || {}).keptInEnglish)}`); }
      scripts.forEach((f) => texts.push(...scriptTexts(f)));
      const j = w.pl.j || {}, an = j.arabicNames || {};
      const kept = (an.notTranslated || []).map((x) => x.shownAs).concat(((j.terminology || {}).sheet || []).filter((x) => x.status === 'kept').map((x) => x.en))
        .concat(((j.terminology || {}).sheet || []).filter((x) => x.status === 'approved' && x.ar).map((x) => x.ar));   // a name the person approved, as written
      structure(fx, `ar (${wf})`, F, null, j);
      const r = classify(fx, `ar (${wf})`, texts, kept, []);
      if (DUMP) { console.log(`   other literals: ${JSON.stringify(uniq(other.map((o) => `${o.what}=${o.s}`))).slice(0, 3000)}`); console.log(`   kept: ${JSON.stringify(kept)}`); }
      chk(() => !r.unlisted.length, () => `${fx.id} ar/${wf}: ${r.unlisted.length} English runs the plan does not list as kept: ${JSON.stringify(uniq(r.unlisted).slice(0, 12))}`);
      fx.ar = fx.ar || { name, dir, F, plan: j };
      await checked(`ar/${wf}`, `${fx.dir}/${name}.pbip`);
    }
    // ---------------------------------------------------------------- the English original, then twin and enar -------
    const en = await write(Object.assign({}, base, opt, { lang: 'en', name: 'Report EN', waterfallRtl: undefined }));
    chk(() => !en.err && fs.existsSync(path.join(projectDir, 'Report EN.Report')), () => `${fx.id} en: the English original written: ${en.err}`);
    { const ef = tmdlIn(projectDir).find((f) => /Report EN - flip cards\.tmdl$/.test(f));
      if (ef) chk(() => /& "K"/.test(fs.readFileSync(ef, 'utf8')) && !fs.readFileSync(ef, 'utf8').includes(encodeURIComponent('ألف')), () => `${fx.id} en: the English flip cards keep K, M, B`); }
    const sources = en.err ? [] : [['Report EN', `${fx.dir}/Report EN.pbip`]];
    if (fx.own) sources.push(['own report', fx.own]);
    for (const [label, pbip] of sources) {
      const scriptsEn = tmdlIn(projectDir).filter((f) => /Report EN - /.test(path.basename(f)));
      for (const into of ['twin', 'same']) {
        const mode = `${into === 'same' ? 'enar' : 'twin'} (${label})`;
        const p0 = await ask('create_arabic_twin', Object.assign({ path: pbip }, into === 'same' ? { into } : {}));
        const T0 = (p0.j && p0.j.texts) || [];
        chk(() => !p0.err && T0.length, () => `${fx.id} ${mode}: the twin's plan: ${short(p0)}`);
        // the plan shows every text whole: a text cut from it can't be given an Arabic label, so it would stay English
        chk(() => !(p0.j && p0.j.truncated && p0.j.truncated.cut && p0.j.truncated.cut.texts), () => `${fx.id} ${mode}: the twin's plan cuts its texts (${JSON.stringify(p0.j && p0.j.truncated && p0.j.truncated.cut)}): the person can't approve an Arabic for the texts not shown`);
        if (p0.err) continue;
        // the person: every field approved under an Arabic term but one, declined (kept in English)
        const rows = (p0.j.terminology && p0.j.terminology.sheet) || [];
        const fields = uniq(rows.map((x) => x.field).filter(Boolean));
        const terms = {}; fields.forEach((f, k) => { terms[f] = k === fields.length - 1 ? (rows.find((x) => x.field === f) || {}).en : arName(); });
        const declinedEn = fields.length ? terms[fields[fields.length - 1]] : null;
        const label1 = (t) => t.draftArabic || (/\{1\}/.test(t.text) ? `أعلى {1} من {2}: ${arName()}` : arName());
        const L = {}; T0.filter((t) => t.text != null && t.text !== declinedEn).forEach((t) => { L[t.id] = label1(t); });
        let p1 = await ask('create_arabic_twin', Object.assign({ path: pbip, labels: L, terms }, into === 'same' ? { into } : {}));
        (p1.j && p1.j.texts || []).filter((t) => t.text != null && t.label == null && t.text !== declinedEn && L[t.id] == null).forEach((t) => { L[t.id] = label1(t); });
        p1 = await ask('create_arabic_twin', Object.assign({ path: pbip, labels: L, terms }, into === 'same' ? { into } : {}));
        const pid = p1.j && p1.j.plan && p1.j.plan.planId;
        if (!pid) { chk(() => false, () => `${fx.id} ${mode}: no plan id: ${short(p1)}`); continue; }
        await ask('approve_plan', { planId: pid });
        const wr = await ask('create_arabic_twin', Object.assign({ path: pbip, planId: pid }, into === 'same' ? { into } : {}));
        const outBase = path.basename(pbip, '.pbip') + (into === 'same' ? ' (EN-AR)' : ' AR'), dir = path.join(path.dirname(path.join(ROOT, pbip)), outBase + '.Report');
        chk(() => !wr.err && fs.existsSync(dir), () => `${fx.id} ${mode}: written: ${short(wr)}`);
        if (wr.err || !fs.existsSync(dir)) continue;
        await checked(mode, path.relative(ROOT, dir.replace(/\.Report$/, '.pbip')).split(path.sep).join('/'));
        const F = readReport(dir);
        let pages = null;
        if (into === 'same') { const O = readReport(path.join(path.dirname(path.join(ROOT, pbip)), path.basename(pbip, '.pbip') + '.Report')); const old = new Set((O['definition/pages/pages.json'] || {}).pageOrder || []); pages = new Set(((F['definition/pages/pages.json'] || {}).pageOrder || []).filter((p) => !old.has(p))); }
        const { texts } = shownTexts(F, pages);
        // the Arabic pages show the English report's scripts' measures (the switcher's labels, the flip faces)
        if (label === 'Report EN') scriptsEn.forEach((f) => texts.push(...scriptTexts(f)));
        const J = p1.j;
        const kept = (J.notTranslated || []).map((x) => x.text);
        const cannot = (J.cannot || []).map((c) => c.what);
        const cats = [];
        if (cannot.some((c) => /flip cards' faces/.test(c))) cats.push({ name: "cannot: flip cards' faces", test: (t) => t.what === 'flip face' });
        if (cannot.some((c) => /metric switcher's choices/.test(c))) cats.push({ name: "cannot: the metric switcher's choices", test: (t) => t.what === 'switcher label' });
        const titled = (J.cannot || []).find((c) => /title measures/.test(c.what));
        if (titled && (titled.where || []).some((w) => /Title\]$/.test(w))) cats.push({ name: 'cannot: chart titles from title measures', test: (t) => t.what === 'switcher title' });
        const r = classify(fx, mode, texts, kept, cats);
        structure(fx, mode, F, pages, null);
        chk(() => !r.unlisted.length, () => `${fx.id} ${mode}: ${r.unlisted.length} English runs the plan does not list as kept: ${JSON.stringify(uniq(r.unlisted).slice(0, 12))}`);
        if (DUMP) console.log(`   kept: ${JSON.stringify(kept)} cannot: ${JSON.stringify(cannot)}`);
      }
    }
    await s.close();
  }
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 800)); }
await s0.close();
// the table: per fixture x mode
console.log('fixture x mode: texts read, Latin runs, listed, Power BI\'s own, unlisted');
results.forEach((r) => console.log(r.na ? `  ${r.fx} / ${r.mode}: ${r.na}` : `  ${r.fx} / ${r.mode}: ${r.texts} texts, ${r.runs} runs, ${r.listed} listed, ${r.powerbi.length} Power BI, ${r.unlisted.length} unlisted`));
console.log('fixture x mode: page buttons, KPI rows, pills, fields (one name each), isolated runs; kept names raw inside Arabic text');
structureRows.forEach((r) => console.log(`  ${r.fx} / ${r.mode}: ${r.navPages} pages with page buttons, ${r.kpiPages} KPI rows, ${r.pills} pills, ${r.fields} fields, ${r.isolated} isolated; raw: ${JSON.stringify(uniq(r.rawMixed)).slice(0, 200)}`));
if (!process.env.A3_KEEP) fs.rmSync(ROOT, { recursive: true, force: true }); else console.log('kept: ' + ROOT);

if (problems.length) { console.log(`FAIL  arabic-sweep  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  arabic-sweep  ${checks} checks`);
