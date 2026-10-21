// 0.3.0 J18 (B-171, the owner, 20 Oct: "continue the held jobs"; written red first): the Arabic terminology sheet. A
// bilingual team approves a term on one page and finds another word (or a broken mixed-script label) elsewhere: one
// approved English/Arabic alias per field, on every title, table header, slicer header, tooltip and alt text of the
// Arabic report, the twin and the EN-AR copy.
//   TS-1  one field on two pages + a tooltip + a slicer (an Arabic report): the plan's sheet lists every place; every
//         written place of an approved field uses its one alias; no visible text keeps its English name
//   TS-2  the same in the twin and in the EN-AR copy (terms { "Table[Field]": alias }); the copy's English pages untouched
//   TS-3  two fields with the same English name keep separate keys (the sheet, the headers, the memory)
//   TS-4  a Latin acronym and digits inside Arabic text keep their order, isolated (U+2068 ... U+2069, U+200F at an end)
//   TS-5  a confirmed term is reused for the same field of the same model; a changed description or DAX drops it; an
//         unrelated model reuses nothing (engine and server)
//   TS-6  a declined term stays English and is listed (kept, with why); one missing term is asked at a time
//   TS-7  the plan pins the map: another map at the write is refused, nothing written (report and twin)
//   TS-8  the approval page shows the sheet, EN | AR, hostile names escaped
//   TS-9  Microsoft's validator 0 errors and check_report 0 "can break" on the Arabic report, the twin and the EN-AR copy
// Fixtures: the golden model (mcp/test-models/large-synthetic, made up) and small hand-made models (made up).
//   node test-0.3.0-terminology-sheet.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), req0 = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const uniq = (a) => [...new Set(a)];
const Memory = req0('../assets/js/confirm-memory.js'), TM = req0('../assets/js/text-measure.js');
let TL = null; try { TL = await import('./lib/terminology.mjs'); } catch (e) { TL = null; }
const FSI = '⁨', PDI = '⁩', RLM = '‏';

// ---- a report's files and what a viewer reads in them ----
const readReport = (dir) => { const out = {}; if (!fs.existsSync(dir)) return out; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else if (f.endsWith('.json')) { try { out[path.relative(dir, f).split(path.sep).join('/')] = rd(f); } catch (x) { /* not JSON */ } } }); rec(dir); return out; };
const TEXT_KEYS = new Set(['text', 'altText', 'showBlankAs', 'titleText', 'subTitleText', 'tooltipText', 'placeholderText', 'labelText', 'headerText', 'enabledTooltip', 'disabledTooltip', 'tooltip']);
const lit = (p) => (p && p.expr && p.expr.Literal && typeof p.expr.Literal.Value === 'string' && /^'.*'$/s.test(p.expr.Literal.Value) ? p.expr.Literal.Value.slice(1, -1).replace(/''/g, "'") : null);
const fieldKey = (f) => { if (!f || typeof f !== 'object') return null; const c = f.Column || f.Measure || (f.Aggregation && f.Aggregation.Expression && f.Aggregation.Expression.Column); const sr = c && c.Expression && c.Expression.SourceRef;
  return sr && sr.Schema !== 'extension' && sr.Entity ? `${sr.Entity}[${c.Property}]` : null; };
// every projection: { file, key, displayName }
const projections = (files) => { const out = []; for (const [f, j] of Object.entries(files)) { if (!/visual\.json$/.test(f)) continue; const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== 'object') return;
  if (Array.isArray(o.projections)) o.projections.forEach((p) => { const k = p && fieldKey(p.field); if (k) out.push({ file: f, key: k, displayName: p.displayName }); }); Object.values(o).forEach(walk); }; walk(j.visual && j.visual.query); } return out; };
// every visible text: formatting literals, text runs, projection display names, page and bookmark names, report measures' DAX texts
// the report measures a visual uses (by "Entity\0Name"): only those are shown (the twin keeps the original's title measures, unused)
const usedMeasures = (files) => { const used = new Set(); const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== 'object') return;
  if (o.Measure && o.Measure.Expression && o.Measure.Expression.SourceRef && o.Measure.Expression.SourceRef.Schema === 'extension') used.add(o.Measure.Expression.SourceRef.Entity + '\u0000' + o.Measure.Property);
  Object.values(o).forEach(walk); }; Object.entries(files).filter(([f]) => /visual\.json$/.test(f)).forEach(([, j]) => walk(j)); return used; };
// (F1, the owner's decision of 20 Oct: isolate EVERY mixed Arabic/Latin text) a shown text with Arabic letters and a
// Latin run not inside an isolate
const notIsolated = (texts) => texts.filter((t) => /[\u0600-\u06FF]/.test(t.s) && /[A-Za-z]/.test(t.s.replace(/\u2068[^\u2069]*\u2069/g, '')));
function shownTexts(files, only) {
  const out = [], used = usedMeasures(files);
  const walk = (o, where) => { if (Array.isArray(o)) { o.forEach((x) => walk(x, where)); return; } if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'properties' && v && typeof v === 'object') Object.entries(v).forEach(([pk, pv]) => { const s = TEXT_KEYS.has(pk) ? lit(pv) : null; if (s && /\p{L}/u.test(s)) out.push({ where, what: pk, s }); });
      if (k === 'textRuns' && Array.isArray(v)) v.forEach((t) => t && typeof t.value === 'string' && t.value.trim() && out.push({ where, what: 'text box', s: t.value }));
      if (k === 'projections' && Array.isArray(v)) v.forEach((p) => p && typeof p.displayName === 'string' && p.displayName.trim() && out.push({ where, what: 'header', s: p.displayName }));
      walk(v, where);
    } };
  for (const [f, j] of Object.entries(files)) {
    if (only && !only(f)) continue;
    if (/page\.json$/.test(f) && j.displayName) out.push({ where: f, what: 'page name', s: j.displayName });
    if (/(visual|mobile|page)\.json$/.test(f)) walk(j, f);
    if (/reportExtensions\.json$/.test(f)) (j.entities || []).forEach((e) => (e.measures || []).forEach((m) => { if (m.dataType === 'Text' && used.has(e.name + '\u0000' + m.name) && typeof m.expression === 'string') (m.expression.match(/"(?:[^"]|"")*"/g) || []).forEach((s) => { const t = s.slice(1, -1).replace(/""/g, '"'); if (/\p{L}/u.test(t)) out.push({ where: f + ' ' + m.name, what: 'measure text', s: t }); }); }));
  }
  return out;
}
const pageIdOf = (f) => (f.match(/pages\/([^/]+)\//) || [])[1];
const isolated = (s) => (TL ? TL.isolateLatin(s) : s);

// ---- the fixtures ----
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-j18-')));
const LARGE = path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel');
fs.cpSync(LARGE, path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
fs.cpSync(LARGE, path.join(ROOT, 'other/Large Synthetic.SemanticModel'), { recursive: true });
const MP = 'large/Large Synthetic.SemanticModel', OTHER = 'other/Large Synthetic.SemanticModel', TMDL = path.join(ROOT, MP, 'definition/tables/Web Orders.tmdl');
// (CI's Windows job: Git checks the fixtures out with CRLF; the copy edited in TS-5 is written so here too, on every system)
fs.writeFileSync(TMDL, fs.readFileSync(TMDL, 'utf8').replace(/\r?\n/g, '\r\n'));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const model = (dir, tables, rels) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: rels || [] } })); };
// two fields named "Amount" (Sales and Budget), one region dimension
model('two', [
  { name: 'Region', partitions: mp('Region'), columns: [col('Region', 'string')] },
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Order Date', 'dateTime')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] },
  { name: 'Budget', partitions: mp('Budget'), columns: [col('Amount', 'double'), col('Region', 'string')], measures: [{ name: 'Total Budget', expression: 'SUM ( Budget[Amount] )', formatString: '#,0' }] }],
  [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Region', toTable: 'Region', toColumn: 'Region' }, { name: 'r2', fromTable: 'Budget', fromColumn: 'Region', toTable: 'Region', toColumn: 'Region' }]);
// hostile names (made up): a column and a measure named like HTML
const BAD_COL = 'Zone <img src=x onerror=alert(1)>', BAD_M = 'Total </td><script>alert(2)</script>';
model('bad', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col(BAD_COL, 'string'), col('Order Date', 'dateTime')], measures: [{ name: BAD_M, expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);

const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, {});
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });

// the terms of the golden model's Web Orders report (made up); one with a Latin acronym and digits
const KPI = 'مؤشر KPI 2024';
const DN = { 'Coupon[Coupon Region]': 'منطقة القسيمة', 'Plan[Plan Group]': 'مجموعة الخطة', 'Web Orders[Web Orders Total Score]': KPI, 'Web Orders[Web Orders Count]': 'عدد الطلبات',
  'Web Orders[Web Orders Total Value]': 'إجمالي القيمة', 'Web Orders[Web Orders Average Score]': 'متوسط الدرجة', 'Calendar[Month Short]': 'الشهر' };
const EN_OF = (k) => k.replace(/^.*?\[(.*)\]$/, '$1');
const rowOf = (sheet, k) => (Array.isArray(sheet) ? sheet.find((r) => r && r.field === k) : null);

try {
  // ---------- TS-4 (engine): isolation and its width ----------
  chk(() => TL && TL.isolateLatin(KPI) === 'مؤشر ' + FSI + 'KPI 2024' + PDI + RLM, () => `TS-4a. "${KPI}" written with its Latin run isolated (and a right-to-left mark after the run that ends it): ${TL ? JSON.stringify(TL.isolateLatin(KPI)) : 'lib/terminology.mjs missing'}`);
  chk(() => TL && TL.isolateLatin('مؤشر KPI 2024 حسب الشهر') === 'مؤشر ' + FSI + 'KPI 2024' + PDI + ' حسب الشهر' && TL.isolateLatin('KPI المبيعات') === RLM + FSI + 'KPI' + PDI + ' المبيعات'
    && TL.isolateLatin('Q1/2024 الربع') === RLM + FSI + 'Q1/2024' + PDI + ' الربع', () => `TS-4b. a run inside, at the start, with a slash: ${TL ? JSON.stringify(['مؤشر KPI 2024 حسب الشهر', 'KPI المبيعات', 'Q1/2024 الربع'].map(TL.isolateLatin)) : 'missing'}`);
  chk(() => TL && ['المبيعات', 'Total Sales', 'أعلى 6 من 10', 'أعلى {1} من {2}: المبيعات', ''].every((x) => TL.isolateLatin(x) === x) && TL.isolateLatin(TL.isolateLatin(KPI)) === TL.isolateLatin(KPI),
    () => `TS-4c. Arabic only, English only, numbers alone and placeholders unchanged; isolating twice changes nothing`);
  chk(() => TM.textWidth(FSI + PDI + RLM, 10) === 0 && Math.abs(TM.textWidth('مؤشر ' + FSI + 'KPI' + PDI, 10) - TM.textWidth('مؤشر KPI', 10)) < 1e-9, () => `TS-4d. the isolates have no width (text-measure): ${TM.textWidth(FSI + PDI, 10)}`);

  // ---------- TS-5 (engine): a confirmed term, its keys and hashes ----------
  {
    const raw = [{ name: 'Web Orders', columns: [{ name: 'Score', dataType: 'double' }], measures: [{ name: 'Web Orders Total Score', expression: 'SUM ( \'Web Orders\'[Score] )', description: 'Made-up' }] },
      { name: 'Sales', columns: [{ name: 'Amount', dataType: 'double' }] }, { name: 'Budget', columns: [{ name: 'Amount', dataType: 'double' }] }];
    const has = typeof Memory.termRecord === 'function' && typeof Memory.applyTerms === 'function' && typeof Memory.termEvidence === 'function';
    chk(() => has, () => 'TS-5a. confirm-memory.js keeps scoped term answers (termEvidence, termRecord, applyTerms)');
    if (has) {
      const MK = Memory.sha256('model-a'), MK2 = Memory.sha256('model-b'), key = 'Web Orders[Web Orders Total Score]';
      const ev = Memory.termEvidence(raw, key), rec = Memory.termRecord({ modelKey: MK, key, scope: 'ar', evidence: ev, alias: KPI, decision: 'approved', at: '2026-10-20T00:00:00Z' });
      chk(() => Memory.validTerm(rec) && rec.objectKey !== key && !JSON.stringify(rec).includes('Web Orders') && /^[0-9a-f]{64}$/.test(rec.evidenceHash) && Array.isArray(rec.dependencyHashes) && rec.dependencyHashes.length,
        () => `TS-5b. a term record holds the alias the person approved and hashes, never the field's name: ${JSON.stringify(rec)}`);
      const use = (rw, mk, sc, k) => Memory.applyTerms([{ key: k || key, evidence: Memory.termEvidence(rw, k || key) }], [rec], mk, sc || 'ar').get(k || key);
      const desc = JSON.parse(JSON.stringify(raw)); desc[0].measures[0].description = 'Changed';
      const dax = JSON.parse(JSON.stringify(raw)); dax[0].measures[0].expression = 'SUM ( \'Web Orders\'[Score] ) * 2';
      const ren = JSON.parse(JSON.stringify(raw)); ren[0].measures[0].name = 'Web Orders Score Total';
      chk(() => use(raw, MK) && use(raw, MK).alias === KPI && !use(desc, MK) && !use(dax, MK) && !use(raw, MK2) && !use(raw, MK, 'en') && !use(ren, MK, 'ar', 'Web Orders[Web Orders Score Total]'),
        () => `TS-5c. reused only for the same model, field, scope, description and DAX: ${JSON.stringify({ same: !!use(raw, MK), desc: !!use(desc, MK), dax: !!use(dax, MK), otherModel: !!use(raw, MK2), scope: !!use(raw, MK, 'en') })}`);
      const a = Memory.termRecord({ modelKey: MK, key: 'Sales[Amount]', scope: 'ar', evidence: Memory.termEvidence(raw, 'Sales[Amount]'), alias: 'المبيعات', decision: 'approved', at: '2026-10-20T00:00:00Z' });
      const got = Memory.applyTerms(['Sales[Amount]', 'Budget[Amount]'].map((k) => ({ key: k, evidence: Memory.termEvidence(raw, k) })), [a], MK, 'ar');
      chk(() => got.get('Sales[Amount]') && !got.get('Budget[Amount]'), () => `TS-3a. Sales[Amount]'s term is not Budget[Amount]'s (one English name, two keys): ${JSON.stringify([...got.keys()])}`);
    }
  }

  // ---------- TS-6: one term at a time; a declined term stays English, listed ----------
  const plan = (args) => s.call('plan_layout', Object.assign({ path: MP, focus: 'Web Orders', lang: 'ar', layout: 'exec', name: 'تقرير', secondPage: true }, args));
  {
    const p0 = await plan({}), T0 = p0.j && p0.j.terminology;
    const sheet = (T0 && T0.sheet) || [];
    chk(() => !p0.err && T0 && sheet.length >= 8 && T0.askNext && typeof T0.askNext.field === 'string' && T0.remaining === sheet.filter((r) => r.status === 'draft' || (r.status === 'kept' && !r.declined)).length - 1,
      () => `TS-6a. the plan asks ONE missing term (askNext), the rest counted (remaining): ${p0.err ? short(p0) : JSON.stringify(T0 && { askNext: T0.askNext, remaining: T0.remaining, rows: sheet.length })}`);
    const first = T0 && T0.askNext && T0.askNext.field;
    const p1 = await plan({ displayNames: first ? { [first]: 'اسم معتمد' } : {} }), T1 = p1.j && p1.j.terminology;
    chk(() => T1 && T1.askNext && T1.askNext.field !== first && T1.remaining === T0.remaining - 1 && rowOf(T1.sheet, first) && rowOf(T1.sheet, first).status === 'approved' && rowOf(T1.sheet, first).ar === 'اسم معتمد',
      () => `TS-6b. once answered, the next term is asked: ${JSON.stringify(T1 && { askNext: T1.askNext, remaining: T1.remaining, first: rowOf(T1.sheet, first) })}`);
    const p2 = await plan({ displayNames: { 'Plan[Plan Group]': 'Plan Group' } }), r2 = rowOf(p2.j && p2.j.terminology && p2.j.terminology.sheet, 'Plan[Plan Group]');
    chk(() => r2 && r2.status === 'kept' && r2.declined === true && r2.en === 'Plan Group' && /kept|English/i.test(String(r2.why || '')) && (!p2.j.terminology.askNext || p2.j.terminology.askNext.field !== 'Plan[Plan Group]'),
      () => `TS-6c. a term the person declined (the model's own name) is listed as kept in English, with why, and not asked again: ${JSON.stringify(r2)}`);
    chk(() => T0 && sheet.every((r) => ['approved', 'draft', 'kept'].includes(r.status) && typeof r.en === 'string' && 'ar' in r) && rowOf(sheet, 'Calendar[Year]') && rowOf(sheet, 'Calendar[Year]').status === 'draft' && rowOf(sheet, 'Calendar[Year]').ar === 'السنة',
      () => `TS-6d. every row: approved, draft (the fixed list's, approved only with the plan) or kept in English: ${JSON.stringify(sheet.slice(0, 3))}`);
  }

  // ---------- TS-7: the plan pins the map (report) ----------
  {
    const pa = await plan({ displayNames: DN }), id = pa.j && pa.j.plan && pa.j.plan.planId;
    if (id) await s.call('approve_plan', { planId: id });
    const before = fs.readdirSync(path.join(ROOT, 'large')).sort().join('|');
    const other = Object.assign({}, DN, { 'Coupon[Coupon Region]': 'المنطقة' });
    const wr = await s.call('create_report', { path: MP, focus: 'Web Orders', lang: 'ar', name: 'تقرير', planId: id, design: pa.j && pa.j.design, displayNames: other });
    chk(() => id && wr.err && /Nothing was written|differ|plan/i.test(wr.t) && fs.readdirSync(path.join(ROOT, 'large')).sort().join('|') === before,
      () => `TS-7a. another map at create_report is refused, nothing written: ${short(wr)}`);
  }

  // ---------- TS-1: an Arabic report, one alias everywhere ----------
  const AR = path.join(ROOT, 'large/تقرير.Report');
  let A = {}, sheet1 = [];
  {
    const p = await plan({ displayNames: DN }), id = p.j && p.j.plan && p.j.plan.planId; sheet1 = (p.j && p.j.terminology && p.j.terminology.sheet) || [];
    const cr = rowOf(sheet1, 'Coupon[Coupon Region]'), where = (cr && cr.where) || [];
    chk(() => cr && cr.status === 'approved' && cr.ar === DN['Coupon[Coupon Region]'] && cr.en === 'Coupon Region' && uniq(where.map((x) => String(x).replace(/: .*$/, ''))).length >= 3
      && ['slicer header', 'tooltip', 'title', 'alt text'].every((r) => where.some((x) => String(x).includes(r))),
      () => `TS-1a. the sheet lists the field's places (3 pages, slicer header, tooltip, title, alt text): ${JSON.stringify(cr)}`);
    chk(() => Object.keys(DN).every((k) => rowOf(sheet1, k) && rowOf(sheet1, k).ar === DN[k] && rowOf(sheet1, k).where.length) && sheet1.every((r) => r.status !== 'approved' || r.consistent === true),
      () => `TS-1b. every approved term is in the sheet with its places, consistent: ${JSON.stringify(sheet1.map((r) => [r.field, r.status, r.consistent]))}`);
    if (id) await s.call('approve_plan', { planId: id });
    const r = await s.call('create_report', { path: MP, focus: 'Web Orders', lang: 'ar', name: 'تقرير', planId: id, design: p.j && p.j.design });
    A = readReport(AR);
    chk(() => !r.err && Object.keys(A).length > 20, () => `TS-1 set-up: the Arabic report is written: ${short(r)}`);
    const pr = projections(A), wrong = pr.filter((x) => DN[x.key] && x.displayName !== isolated(DN[x.key]));
    const cpages = uniq(pr.filter((x) => x.key === 'Coupon[Coupon Region]').map((x) => pageIdOf(x.file)));
    const slicer = pr.some((x) => x.key === 'Coupon[Coupon Region]' && (A[x.file].visual || {}).visualType === 'slicer');
    const tip = pr.some((x) => x.key === 'Coupon[Coupon Region]' && (A[`definition/pages/${pageIdOf(x.file)}/page.json`] || {}).type === 'Tooltip');
    chk(() => pr.length && !wrong.length && cpages.length >= 3 && slicer && tip, () => `TS-1c. every header of an approved field is its one alias (Coupon Region on ${cpages.length} pages, slicer ${slicer}, tooltip ${tip}): ${JSON.stringify(wrong.slice(0, 5))}`);
    const en = Object.keys(DN).map(EN_OF), stray = shownTexts(A).filter((t) => en.some((n) => t.s.includes(n)));
    chk(() => !stray.length, () => `TS-1d. no visible text keeps the English name of a field with an alias: ${JSON.stringify(uniq(stray.map((t) => `${t.what} "${t.s.slice(0, 70)}"`)).slice(0, 8))}`);
    const used = shownTexts(A).filter((t) => t.s.includes('KPI'));
    chk(() => used.length >= 5 && used.every((t) => t.s.includes(FSI + 'KPI 2024' + PDI)) && used.some((t) => t.what === 'measure text') && used.some((t) => t.what === 'altText'),
      () => `TS-4e. the alias's Latin run is isolated wherever the report shows it (headers, titles, alt texts, the title measures' texts): ${JSON.stringify(uniq(used.filter((t) => !t.s.includes(FSI)).map((t) => `${t.what} "${t.s}"`)).slice(0, 6))}`);
    const mixA = notIsolated(shownTexts(A));
    chk(() => !mixA.length, () => `TS-10a. every mixed Arabic/Latin text of the Arabic report is isolated: ${JSON.stringify(uniq(mixA.map((t) => `${t.what} "${t.s.slice(0, 60)}"`)).slice(0, 8))}`);
  }

  // ---------- TS-2: the twin and the EN-AR copy, terms everywhere ----------
  const ORIG = path.join(ROOT, 'large/Orders EN.Report'), TWIN = path.join(ROOT, 'large/Orders EN AR.Report'), COPY = path.join(ROOT, 'large/Orders EN (EN-AR).Report');
  {
    const pe = await s.call('plan_layout', { path: MP, focus: 'Web Orders', lang: 'en', layout: 'exec', name: 'Orders EN', secondPage: true }), id = pe.j && pe.j.plan && pe.j.plan.planId;
    if (id) await s.call('approve_plan', { planId: id });
    const re = await s.call('create_report', { path: MP, focus: 'Web Orders', lang: 'en', name: 'Orders EN', planId: id, design: pe.j && pe.j.design });
    chk(() => !re.err && fs.existsSync(ORIG), () => `TS-2 set-up: "Orders EN" written: ${short(re)}`);
  }
  const O = readReport(ORIG);
  // the other texts take their drafts (pages, buttons, the empty state); the fields take the terms
  const twinPlan = async (args) => { const p0 = await s.call('create_arabic_twin', Object.assign({ path: 'large/Orders EN.pbip' }, args)); return p0; };
  const p0 = await twinPlan({}), T0 = (p0.j && p0.j.texts) || [];
  const L = {}; T0.filter((t) => t.draftArabic && t.kind !== 'field').forEach((t) => { L[t.id] = t.draftArabic; });
  T0.filter((t) => t.text === 'Orders EN').forEach((t) => { L[t.id] = 'تقرير الطلبات'; });
  // (Month Short is left out: the twin takes the term the person confirmed on the Arabic report, unchanged since)
  const TERMS = Object.assign({}, DN); delete TERMS['Calendar[Month Short]'];
  {
    const p1 = await twinPlan({ labels: L, terms: TERMS }), J = p1.j || {}, T1 = J.texts || [];
    const fieldsOf = (k) => T1.filter((t) => t.kind === 'field' && (t.field === k));
    chk(() => !p1.err && Object.keys(DN).every((k) => fieldsOf(k).length && fieldsOf(k).every((t) => t.label === DN[k] && /term/i.test(String(t.labelFrom || '')))),
      () => `TS-2a. each field header of the twin takes its term (field, labelFrom): ${p1.err ? short(p1) : JSON.stringify(T1.filter((t) => t.kind === 'field').map((t) => [t.id, t.field, t.label, t.labelFrom]).slice(0, 8))}`);
    chk(() => !J.truncated, () => `TS-2 the twin's plan is answered whole (no cut), the sheet in it: ${JSON.stringify(J.truncated)}`);
    const tm = T1.find((t) => t.kind === 'titleMeasure' && t.text === 'Top {1} of {2}: Web Orders Total Score by Coupon Region'), al = T1.find((t) => t.kind === 'altText' && t.text === 'Web Orders Total Score by Plan Group: detail');
    chk(() => tm && tm.label === `أعلى {1} من {2}: ${KPI} حسب منطقة القسيمة` && al && al.label === `${KPI} حسب مجموعة الخطة: التفاصيل` && /term/i.test(String(tm.labelFrom || '')),
      () => `TS-2b. a title and an alt text made of the fields' names take the terms (derived): ${JSON.stringify([tm, al].map((t) => t && [t.text, t.label, t.labelFrom]))}`);
    const sh = (J.terminology && J.terminology.sheet) || [], cr = rowOf(sh, 'Coupon[Coupon Region]');
    const ms = rowOf(sh, 'Calendar[Month Short]'), yr = rowOf(sh, 'Calendar[Year]');
    chk(() => cr && cr.status === 'approved' && cr.ar === DN['Coupon[Coupon Region]'] && uniq((cr.where || []).map((x) => String(x).replace(/: .*$/, ''))).length >= 3 && ms && ms.status === 'approved' && ms.earlier === true && ms.ar === DN['Calendar[Month Short]']
      && yr && yr.status === 'draft' && !yr.earlier,
      () => `TS-2c. the twin's sheet: the given terms, the term the person confirmed on the Arabic report (Month Short, earlier), and a draft approved only with that plan still a draft (Year): ${JSON.stringify(sh.map((r) => [r.field, r.status, r.ar, r.earlier]))}`);
    // TS-7b: the twin's plan pins its terms
    const id = J.plan && J.plan.planId;
    if (id) await s.call('approve_plan', { planId: id });
    const bad = await s.call('create_arabic_twin', { path: 'large/Orders EN.pbip', planId: id, terms: Object.assign({}, TERMS, { 'Plan[Plan Group]': 'الخطة' }) });
    chk(() => id && bad.err && /Nothing was written/.test(bad.t) && !fs.existsSync(TWIN), () => `TS-7b. the twin with other terms than its plan's is refused, nothing written: ${short(bad)}`);
    const wr = await s.call('create_arabic_twin', { path: 'large/Orders EN.pbip', planId: id });
    chk(() => !wr.err && fs.existsSync(TWIN), () => `TS-2 set-up: the twin is written: ${short(wr)}`);
    const TW = readReport(TWIN), pr = projections(TW), wrong = pr.filter((x) => DN[x.key] && x.displayName !== isolated(DN[x.key]));
    chk(() => pr.length && !wrong.length, () => `TS-2d. every header of a termed field in the twin is its alias: ${JSON.stringify(wrong.slice(0, 5))}`);
    const en = Object.keys(DN).map(EN_OF), stray = shownTexts(TW).filter((t) => en.some((n) => t.s.includes(n)) && !/^No data: /.test(t.s));
    chk(() => !stray.length, () => `TS-2e. no text of the twin keeps the English name of a termed field: ${JSON.stringify(uniq(stray.map((t) => `${t.what} "${t.s.slice(0, 70)}"`)).slice(0, 8))}`);
    const kpi = shownTexts(TW).filter((t) => t.s.includes('KPI'));
    chk(() => kpi.length >= 5 && kpi.every((t) => t.s.includes(FSI + 'KPI 2024' + PDI)), () => `TS-4f. the twin's alias isolated wherever it shows: ${JSON.stringify(uniq(kpi.filter((t) => !t.s.includes(FSI)).map((t) => t.s)).slice(0, 5))}`);
    const mixT = notIsolated(shownTexts(TW));
    chk(() => !mixT.length, () => `TS-10c. every mixed Arabic/Latin text of the twin is isolated: ${JSON.stringify(uniq(mixT.map((t) => `${t.what} "${t.s.slice(0, 60)}"`)).slice(0, 8))}`);
    // the EN-AR copy
    const pc = await twinPlan({ labels: L, terms: TERMS, into: 'same' }), cid = pc.j && pc.j.plan && pc.j.plan.planId;
    if (cid) await s.call('approve_plan', { planId: cid });
    const wc = await s.call('create_arabic_twin', { path: 'large/Orders EN.pbip', planId: cid, into: 'same' });
    const C = readReport(COPY), arPages = new Set(((C['definition/pages/pages.json'] || {}).pageOrder || []).filter((id2) => !(O['definition/pages/pages.json'] || { pageOrder: [] }).pageOrder.includes(id2)));
    const cpr = projections(C), arP = cpr.filter((x) => arPages.has(pageIdOf(x.file))), enP = cpr.filter((x) => !arPages.has(pageIdOf(x.file)));
    chk(() => !wc.err && arPages.size >= 2 && arP.length && arP.every((x) => !DN[x.key] || x.displayName === isolated(DN[x.key])) && enP.length && enP.every((x) => !DN[x.key] || x.displayName == null || !/[؀-ۿ]/.test(x.displayName)),
      () => `TS-2f. the EN-AR copy: its Arabic pages carry the terms, its English pages are untouched: ${wc.err ? short(wc) : JSON.stringify({ ar: arP.filter((x) => DN[x.key] && x.displayName !== isolated(DN[x.key])).slice(0, 3), en: enP.filter((x) => DN[x.key] && /[؀-ۿ]/.test(String(x.displayName))).slice(0, 3) })}`);
    const cstray = shownTexts(C, (f) => arPages.has(pageIdOf(f) || '')).filter((t) => en.some((n) => t.s.includes(n)) && !/^No data: /.test(t.s));
    chk(() => !cstray.length, () => `TS-2g. no Arabic page of the copy keeps an English name of a termed field: ${JSON.stringify(uniq(cstray.map((t) => `${t.what} "${t.s.slice(0, 70)}"`)).slice(0, 8))}`);
    const mixC = notIsolated(shownTexts(C, (f) => arPages.has(pageIdOf(f) || '')));
    chk(() => !mixC.length, () => `TS-10d. every mixed Arabic/Latin text on the copy's Arabic pages is isolated: ${JSON.stringify(uniq(mixC.map((t) => `${t.what} "${t.s.slice(0, 60)}"`)).slice(0, 8))}`);
  }

  // ---------- TS-9: Microsoft's validator and check_report ----------
  for (const [what, p] of [['the Arabic report', 'large/تقرير.pbip'], ['the twin', 'large/Orders EN AR.pbip'], ['the EN-AR copy', 'large/Orders EN (EN-AR).pbip']]) {
    const c = await s.call('check_report', { path: p }), j = c.j || {};
    chk(() => !c.err && j.validator && j.validator.ran && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0,
      () => `TS-9 ${what}: validator 0 errors, check_report 0 "can break": ${c.err ? c.t.slice(0, 300) : JSON.stringify({ v: j.validator, canBreak: j.impact && j.impact.kinds.canBreak, f: (j.findings || []).slice(0, 3) }).slice(0, 600)}`);
  }

  // ---------- TS-3: two fields with the same English name ----------
  {
    const DN2 = { 'Sales[Amount]': 'مبلغ المبيعات', 'Budget[Amount]': 'مبلغ الميزانية', 'Region[Region]': 'المنطقة', 'Sales[Total Sales]': 'إجمالي المبيعات', 'Budget[Total Budget]': 'إجمالي الميزانية' };
    const pf = { kpis: ['Sales[Total Sales]', 'Budget[Total Budget]'], category: 'Region[Region]', table: ['Region[Region]', 'Sales[Amount]', 'Budget[Amount]'] };
    const p = await s.call('plan_layout', { path: 'two/M.SemanticModel', lang: 'ar', layout: 'analysis', name: 'مبالغ', planFields: pf, displayNames: DN2 }), sh = (p.j && p.j.terminology && p.j.terminology.sheet) || [];
    chk(() => rowOf(sh, 'Sales[Amount]') && rowOf(sh, 'Budget[Amount]') && rowOf(sh, 'Sales[Amount]').ar !== rowOf(sh, 'Budget[Amount]').ar && rowOf(sh, 'Sales[Amount]').en === rowOf(sh, 'Budget[Amount]').en,
      () => `TS-3b. two rows, one per key, one English name: ${p.err ? short(p) : JSON.stringify(sh.map((r) => [r.field, r.en, r.ar]))}`);
    const id = p.j && p.j.plan && p.j.plan.planId; if (id) await s.call('approve_plan', { planId: id });
    const r = await s.call('create_report', { path: 'two/M.SemanticModel', lang: 'ar', layout: 'analysis', name: 'مبالغ', planId: id, design: p.j && p.j.design, fields: pf });
    const pr = projections(readReport(path.join(ROOT, 'two/مبالغ.Report')));
    chk(() => !r.err && pr.some((x) => x.key === 'Sales[Amount]' && x.displayName === DN2['Sales[Amount]']) && pr.some((x) => x.key === 'Budget[Amount]' && x.displayName === DN2['Budget[Amount]']),
      () => `TS-3c. the table shows each Amount under its own alias: ${r.err ? short(r) : JSON.stringify(pr.filter((x) => /Amount/.test(x.key)).map((x) => [x.key, x.displayName]))}`);
  }

  // ---------- TS-8: the approval page shows the sheet, escaped ----------
  {
    const k1 = `Sales[${BAD_COL}]`, k2 = `Sales[${BAD_M}]`, alias = 'منطقة <b>عريضة</b> & "ج"';
    const p = await w.call('plan_layout', { path: 'bad/M.SemanticModel', lang: 'ar', layout: 'analysis', name: 'سيئ', planFields: { kpis: [k2], category: k1 }, displayNames: { [k1]: alias } });
    const pid = p.j && p.j.plan && p.j.plan.planId; let html = '';
    if (pid) { const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n); html = url ? await req(url, 'GET') : ''; if (url) await req(url, 'POST', 'decision=decline'); }
    const text = unesc(html.replace(/<[^>]+>/g, ' '));
    chk(() => /Terminology/.test(html) && text.includes(BAD_COL) && text.includes(alias) && text.includes(BAD_M),
      () => `TS-8a. the approval page shows the sheet (EN | AR): ${pid ? text.replace(/\s+/g, ' ').slice(0, 300) : short(p)}`);
    chk(() => html && !html.includes('<img src=x') && !html.includes('<script>alert(2)') && !html.includes('<b>عريضة'), () => `TS-8b. hostile names and aliases escaped on the page`);
    chk(() => /approved/.test(text) && /kept in English|draft/.test(text), () => `TS-8c. each term's status on the page: ${text.replace(/\s+/g, ' ').slice(0, 200)}`);
  }

  // ---------- TS-5 (server): reuse, and a changed description or DAX drops it ----------
  {
    const p = await plan({}), sh = (p.j && p.j.terminology && p.j.terminology.sheet) || [];
    const re = Object.keys(DN).filter((k) => rowOf(sh, k) && rowOf(sh, k).status === 'approved' && rowOf(sh, k).earlier === true && rowOf(sh, k).ar === DN[k]);
    chk(() => re.length === Object.keys(DN).length && p.j.plan && p.j.plan.planId, () => `TS-5d. after the write, a new plan of the same model reuses each confirmed term (earlier): ${JSON.stringify(sh.map((r) => [r.field, r.status, r.earlier]))}`);
    const o = await s.call('plan_layout', { path: OTHER, focus: 'Web Orders', lang: 'ar', layout: 'exec', name: 'تقرير', secondPage: true }), osh = (o.j && o.j.terminology && o.j.terminology.sheet) || [];
    chk(() => osh.length && !osh.some((r) => r.earlier), () => `TS-5e. another model with the same tables reuses nothing: ${JSON.stringify(osh.filter((r) => r.earlier).map((r) => r.field))}`);
    let t = fs.readFileSync(TMDL, 'utf8');
    // (the file's own line ends kept: a CRLF line's DAX ends before its \r)
    const eol = /\r\n/.test(t) ? '\r\n' : '\n';
    t = t.replace("\tmeasure 'Web Orders Total Score' =", `\t/// Made-up description, changed for the test.${eol}\tmeasure 'Web Orders Total Score' =`);
    t = t.replace(/(\tmeasure 'Web Orders Count' = )([^\r\n]+)/, '$1$2 + 0');
    fs.writeFileSync(TMDL, t);
    const q = await plan({}), qs = (q.j && q.j.terminology && q.j.terminology.sheet) || [];
    const dropped = ['Web Orders[Web Orders Total Score]', 'Web Orders[Web Orders Count]'], kept = Object.keys(DN).filter((k) => !dropped.includes(k));
    chk(() => t.includes('+ 0') && dropped.every((k) => rowOf(qs, k) && !rowOf(qs, k).earlier && rowOf(qs, k).status !== 'approved') && kept.every((k) => rowOf(qs, k) && rowOf(qs, k).earlier === true),
      () => `TS-5f. a changed description or DAX drops that term only (asked again): ${JSON.stringify(qs.map((r) => [r.field, r.status, r.earlier]))}`);
    chk(() => q.j.terminology.askNext && dropped.includes(q.j.terminology.askNext.field), () => `TS-5g. the dropped term is asked again first: ${JSON.stringify(q.j && q.j.terminology && q.j.terminology.askNext)}`);
  }
  // ---------- TS-10b (last: the term kept in English stays in the session's memory) ----------
  {
    // the proof's tab (20 Oct): a field kept in English on a tooltip page, «تلميح · Month Short»
    const DNm = Object.assign({}, DN, { 'Calendar[Month Short]': 'Month Short' });   // (the person keeps it in English)
    const pm = await plan({ displayNames: DNm, name: 'تقرير مختلط' }), mid = pm.j && pm.j.plan && pm.j.plan.planId;
    if (mid) await s.call('approve_plan', { planId: mid });
    const rm = mid ? await s.call('create_report', { path: MP, focus: 'Web Orders', lang: 'ar', name: 'تقرير مختلط', planId: mid, design: pm.j.design }) : pm;
    const M = readReport(path.join(ROOT, 'large/تقرير مختلط.Report')), tips = shownTexts(M).filter((t) => t.what === 'page name' && (M[t.where] || {}).type === 'Tooltip'), mixM = notIsolated(shownTexts(M));
    chk(() => !rm.err && tips.some((t) => /Month Short/.test(t.s)) && !mixM.length, () => `TS-10b. a field kept in English: the tooltip tab «تلميح · Month Short» and every other mixed text isolated (tabs ${tips.map((t) => JSON.stringify(t.s)).join(', ')}): ${rm.err ? short(rm) : JSON.stringify(uniq(mixM.map((t) => `${t.what} "${t.s.slice(0, 60)}"`)).slice(0, 8))}`);
    if (!rm.err) { const c = await s.call('check_report', { path: 'large/تقرير مختلط.pbip' }); chk(() => !c.err && c.j.validator.errors === 0 && c.j.impact.kinds.canBreak.count === 0, () => `TS-10b: validator 0, check_report 0 "can break": ${short(c)}`); }
  }
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }
await s.close(); await w.close();
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL  terminology-sheet  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  terminology-sheet  ${checks} checks`);
