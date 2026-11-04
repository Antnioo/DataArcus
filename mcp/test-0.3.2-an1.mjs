// AN1 (0.3.2; the owner, D-1104-01, 4 Nov: "Agree on all r&ds"; RD10's brief g; written red first): Arabic names in
// the model itself, as a twin option. create_arabic_twin with modelNames writes one more file of its one write, the
// TMDL view script "<twin> - Arabic names.tmdl": one cultureInfo per Gulf culture, its translations the captions of
// the fields whose Arabic the person approved as terms (pinned in the plan). A draft, a declined term, a field without
// one, a table, a description, a hidden field: never written; the visible ones listed English with why (EN and AR).
// A culture the model has (or its own culture) is skipped and said. No machine translation, no linguisticMetadata (Q&A
// is English only), never applied by DataArcus.
//   M1-M10  lib/model-culture.mjs on hand-made models: quoting of names and values, a control character, a hidden
//           field, a draft, a declined term, an earlier term, the model's cultures skipped, no Q&A, one culture asked
//   T1-T15  the tool on a made-up project (the sample project's model, a page with its 23 fields, RD10's sheet): off
//           changes nothing; on, 12 captions per culture, 6 cultures, 15 rows English; read back whole with
//           tmdl-model.js; the digest pins the terms; the write writes exactly the kept script and never the model;
//           another modelNames at the write is refused; a model's culture skipped; a published model; the answer's size
// Made-up data only (mcp/lib/sample-project.mjs). Temporary folders under os.tmpdir().   node test-0.3.2-an1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const Tmdl = createRequire(import.meta.url)('../assets/js/tmdl-model.js');

// the working folder first: the library modules read DATAARCUS_ROOT when they are loaded
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-an1-')));
process.env.DATAARCUS_ROOT = ROOT;
const { sampleFiles } = await import('./lib/sample-project.mjs');
const Plans = await import('./lib/plans.mjs');
let MC = null; try { MC = await import('./lib/model-culture.mjs'); } catch (e) { MC = null; }
const { register } = await import('./tools/create_arabic_twin.mjs');
let handler = null, def = null;
register({ registerTool: (name, d, h) => { if (name === 'create_arabic_twin') { handler = h; def = d; } } }, {});
const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal's words */ } return { err: !!r.isError, t, j }; };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));

// ---- the made-up project: the sample model, its empty page replaced by one table of its 23 fields ----
const FIELDS = { Sales: [['Date', 'Branch', 'Product', 'Channel', 'Amount', 'Units', 'Orders'], ['Total Sales', 'Order Count', 'Units Sold', 'Average Basket']], Branches: [['Branch', 'City', 'Country'], []],
  Products: [['Product', 'Category'], []], Calendar: [['Date', 'Year', 'Quarter', 'Month Number', 'Month Name', 'Year Month', 'Year Month Key'], []] };
const proj = (t, f, measure) => ({ field: { [measure ? 'Measure' : 'Column']: { Expression: { SourceRef: { Entity: t } }, Property: f } }, queryRef: `${t}.${f}`, nativeQueryRef: f });
const table = { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json', name: 'tblAll', position: { x: 40, y: 40, z: 1000, height: 640, width: 1200, tabOrder: 1000 },
  visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: Object.entries(FIELDS).flatMap(([t, [cols, ms]]) => cols.map((c) => proj(t, c)).concat(ms.map((m) => proj(t, m, true)))) } } } } };
function project(name, edit) {
  const dir = path.join(ROOT, name); fs.rmSync(dir, { recursive: true, force: true });
  const files = sampleFiles(dir);
  for (const f of files) {
    let data = f.data;
    if (edit) data = edit(f.path.slice(dir.length + 1).split(path.sep).join('/'), data);
    if (data == null) continue;
    fs.mkdirSync(path.dirname(f.path), { recursive: true }); fs.writeFileSync(f.path, data);
  }
  const page = fs.readdirSync(path.join(dir, 'Gulf Retail.Report/definition/pages')).find((x) => !/\.json$/.test(x));
  fs.mkdirSync(path.join(dir, 'Gulf Retail.Report/definition/pages', page, 'visuals/tblAll'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Gulf Retail.Report/definition/pages', page, 'visuals/tblAll/visual.json'), JSON.stringify(table, null, 2));
  return { dir, pbip: `${name}/Gulf Retail.pbip` };
}
// RD10's made-up sheet: its 12 field names (its 4 table names have no input: the twin's terms are per field), 2 kept
const TERMS = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Order Count]': 'عدد الطلبات', 'Sales[Average Basket]': 'متوسط السلة', 'Sales[Amount]': 'المبلغ', 'Sales[Units]': 'الوحدات',
  'Branches[Branch]': 'الفرع', 'Branches[City]': 'المدينة', 'Branches[Country]': 'الدولة', 'Products[Product]': 'المنتج', 'Products[Category]': 'الفئة', 'Calendar[Year]': 'السنة', 'Calendar[Month Name]': 'الشهر',
  'Calendar[Month Number]': 'Month Number', 'Calendar[Year Month Key]': 'Year Month Key' };
const GULF = ['ar-AE', 'ar-SA', 'ar-KW', 'ar-QA', 'ar-BH', 'ar-OM'];
// the script as Desktop would save it: one file a culture, one level up (createOrReplace's children)
const asFiles = (text) => { const out = []; String(text).split('\n').slice(2).forEach((l) => { if (/^\tcultureInfo /.test(l)) out.push([]); if (out.length) out[out.length - 1].push(l.replace(/^\t/, '')); });
  return out.map((ls) => ({ path: `definition/cultures/${ls[0].slice('cultureInfo '.length)}.tmdl`, text: ls.join('\n') })); };
const captionsOf = (o) => (o && typeof o === 'object' ? Object.entries(o).reduce((n, [k, x]) => n + (k === 'caption' ? 1 : captionsOf(x)), 0) : 0);
const readBack = (text, modelText) => Tmdl.read([{ path: 'definition/model.tmdl', text: modelText || 'model Model\n\tculture: en-US\n' }].concat(asFiles(text)));
const hashDir = (d) => { const out = {}; const rec = (x) => fs.readdirSync(x, { withFileTypes: true }).forEach((e) => { const f = path.join(x, e.name); if (e.isDirectory()) rec(f); else out[path.relative(d, f)] = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); }); rec(d); return out; };

try {
  // ---- M: the module on hand-made models ----
  const raw = (extra) => ({ model: Object.assign({ name: 'Model', culture: 'en-US', tables: [
    { name: 'Sales Data', columns: [{ name: "Customer's Name" }, { name: 'Region' }, { name: 'Code\tX' }, { name: 'Secret', isHidden: true }, { name: 'Channel' }, { name: 'Key' }], measures: [{ name: 'Total', description: 'The sum' }, { name: 'Margin' }] }] }, extra || {}) });
  const terms = new Map([['Sales Data[Customer\'s Name]', { ar: ' اسم "العميل"', status: 'approved', given: true }], ['Sales Data[Region]', { ar: 'المنطقة', status: 'approved', given: true }],
    ['Sales Data[Code\tX]', { ar: 'الرمز', status: 'approved', given: true }], ['Sales Data[Secret]', { ar: 'سري', status: 'approved', given: true }], ['Sales Data[Channel]', { ar: 'القناة', status: 'draft' }],
    ['Sales Data[Key]', { ar: null, status: 'kept', declined: true }], ['Sales Data[Total]', { ar: 'الإجمالي', status: 'approved', earlier: true }]]);
  const cs = (extra, cultures) => MC.cultureScript(raw(extra), terms, cultures || GULF);
  const r = MC ? cs() : null, lines = r ? r.text.split('\n') : [];
  const eng = (k) => r && r.english.find((x) => x.field === k);
  chk(() => lines.includes("\t\t\t\ttable 'Sales Data'") && lines.includes("\t\t\t\t\tcolumn 'Customer''s Name'"), () => `M1. a table and a column name with a space or ' are quoted as every script writes them: ${r ? r.text.slice(0, 300) : 'no lib/model-culture.mjs'}`);
  chk(() => lines.includes('\t\t\t\t\t\tcaption: " اسم ""العميل"""') && readBack(r.text).model.model.cultures[0].translations.model.tables[0].columns[0].caption === ' اسم "العميل"', () => `M2. a value with a leading space and " is quoted and reads back the same: ${r && lines.filter((l) => /caption/.test(l)).join(' | ')}`);
  chk(() => !/Code/.test(r.text) && eng('Sales Data[Code\\u0009X]') && eng('Sales Data[Code\\u0009X]').why === 'control', () => `M3. a name with a control character is never written, listed (control, shown as its code point): ${JSON.stringify(r && r.english)}`);
  chk(() => !/Secret|سري/.test(r.text) && !eng('Sales Data[Secret]') && r.hidden === 1, () => `M4. a hidden field is neither written nor listed, counted: ${r && r.hidden}`);
  chk(() => !/القناة|Channel/.test(r.text) && eng('Sales Data[Channel]').why === 'draft', () => `M5. a draft is never written, listed (draft): ${JSON.stringify(eng('Sales Data[Channel]'))}`);
  chk(() => !/'?Key'?$/m.test(r.text) && eng('Sales Data[Key]').why === 'kept' && eng('Sales Data[Total]').why === 'earlier' && !/الإجمالي/.test(r.text) && eng('Sales Data[Margin]').why === 'notShown' && eng('Sales Data').why === 'table',
    () => `M6. a declined term, an earlier one (not in this plan's terms), a field not on the report and the table: listed, not written: ${JSON.stringify(r && r.english)}`);
  chk(() => r.captions === 2 && r.cultures.length === 6 && r.covered.map((x) => x.field).join('|') === "Sales Data[Customer's Name]|Sales Data[Region]" && r.descriptions === 1, () => `M7. two captions a culture, six cultures, the description counted English: ${JSON.stringify(r && { c: r.captions, cu: r.cultures, cov: r.covered, d: r.descriptions })}`);
  const r2 = MC ? cs({ culture: 'ar-SA', cultures: [{ name: 'ar-AE' }] }) : null;
  chk(() => r2.cultures.join() === 'ar-KW,ar-QA,ar-BH,ar-OM' && r2.skipped.map((x) => x.culture + ':' + x.why).join() === 'ar-AE:has,ar-SA:own' && !/cultureInfo ar-(AE|SA)/.test(r2.text), () => `M8. a culture the model has and its own culture are skipped and said: ${JSON.stringify(r2 && { c: r2.cultures, s: r2.skipped })}`);
  chk(() => !/linguisticMetadata|synonym/i.test(r.text) && lines.filter((l) => /:/.test(l)).every((l) => /^\t+caption: /.test(l)), () => 'M9. captions only: no linguisticMetadata, no synonyms (Q&A is English only)');
  const r3 = MC ? cs(null, ['ar-AE']) : null;
  chk(() => r3.cultures.join() === 'ar-AE' && r3.text.split('\n')[0] === 'createOrReplace' && (r3.text.match(/cultureInfo/g) || []).length === 1 && MC.culturesOf(true).join() === GULF.join() && MC.culturesOf(['ar-OM', 'ar-AE', 'ar-OM']).join() === 'ar-AE,ar-OM' && MC.culturesOf(false).length === 0,
    () => `M10. one culture asked gives one; true gives the six Gulf cultures, in one order: ${r3 && r3.text.slice(0, 200)}`);

  // ---- T: the tool ----
  const A = project('a');
  const off = await call({ path: A.pbip, terms: TERMS }), offArt = off.j && off.j.plan && Plans.artifactOf(off.j.plan.planId);
  chk(() => !off.err && !('arabicModelNames' in off.j) && offArt && !offArt.files.some((f) => /Arabic names/.test(f.path)), () => `T1. off (the default): no script and no word of it: ${short(off)}`);
  chk(() => def && def.inputSchema.safeParse({ path: 'x', modelNames: ['fr-FR'] }).success === false && def.inputSchema.safeParse({ path: 'x', modelNames: ['ar-AE'] }).success && def.inputSchema.safeParse({ path: 'x', modelNames: true }).success, () => 'T2. modelNames takes true or Gulf culture names only');
  const on = await call({ path: A.pbip, terms: TERMS, modelNames: true }), N = on.j && on.j.arabicModelNames, id = on.j && on.j.plan && on.j.plan.planId, art = id ? Plans.artifactOf(id) : null;
  const sf = art && art.files.find((f) => f.path === 'Gulf Retail AR - Arabic names.tmdl'), script = sf ? String(sf.data) : '';
  chk(() => !on.err && N && N.offered === true && N.cultures.join() === GULF.join() && N.captions === 12 && N.scriptAfterGo === 'Gulf Retail AR - Arabic names.tmdl', () => `T3. on: the six cultures, 12 captions a culture, the script named: ${short(on)}`);
  chk(() => N.englishCount === 15 && N.english.length === 15 && ['Sales', 'Branches', 'Products', 'Calendar'].every((t) => N.english.some((x) => x.field === t && x.why === 'table')) && N.english.every((x) => N.whys[x.why] && N.whysAr[x.why]),
    () => `T4. 15 rows stay English (4 tables, 11 fields), each with why in English and Arabic: ${JSON.stringify(N && N.english)}`);
  chk(() => sf && (script.match(/^\t+caption: /gm) || []).length === 72 && (script.match(/^\tcultureInfo /gm) || []).length === 6, () => `T5. the kept script: 72 captions in 6 cultures: ${script.slice(0, 300)}`);
  const back = sf ? readBack(script) : null;
  chk(() => back.skipped.length === 0 && back.model.model.cultures.map((c) => c.name).join() === GULF.join() && captionsOf(back.model.model.cultures) === 72, () => `T6. the script reads back with tmdl-model.js, every caption (72): ${back && captionsOf(back.model.model.cultures)}, skipped ${back && JSON.stringify(back.skipped)}`);
  chk(() => !/القناة|'Units Sold'|Channel/.test(script) && N.english.some((x) => x.field === 'Sales[Channel]' && x.why === 'draft') && !/Month Number|Year Month Key/.test(script), () => `T7. a draft of the fixed list and a declined term are never written: ${JSON.stringify(N && N.english)}`);
  chk(() => script.split('\n').length === N.lines && N.lines === 200, () => `T8. the script's lines (expected 200): ${script.split('\n').length}, said ${N && N.lines}`);
  chk(() => (on.j.plan.writesAfterGo || []).some((w) => /Arabic names\.tmdl/.test(w)) && JSON.stringify(Plans.pending(id)).includes('Arabic names.tmdl') && Plans.planOf(id).data.writesAr.length === on.j.plan.writesAfterGo.length && Plans.planOf(id).data.writesAr.some((w) => /Arabic names\.tmdl/.test(w) && /الأسماء العربية للنموذج/.test(w)), () => `T9. the plan's writes name the script, in English and on the Arabic approval page, one line each: ${JSON.stringify(on.j && on.j.plan && on.j.plan.writesAfterGo)}`);
  const on2 = await call({ path: A.pbip, terms: Object.assign({}, TERMS, { 'Calendar[Year]': 'العام' }), modelNames: true });
  chk(() => on2.j.exact.digest !== on.j.exact.digest && String(Plans.artifactOf(on2.j.plan.planId).files.find((f) => /Arabic names/.test(f.path)).data).includes('العام'), () => 'T10. a changed term changes the script and the plan\'s digest');
  // the write: the kept script byte for byte; the model never touched
  const before = hashDir(path.join(A.dir, 'Gulf Retail.SemanticModel'));
  const bad = await call({ path: A.pbip, planId: id, modelNames: ['ar-AE'] });
  Plans.approve(id, 'user-in-browser');
  const bad2 = await call({ path: A.pbip, planId: id, modelNames: ['ar-AE'] });
  chk(() => bad2.err && /modelNames/.test(bad2.t) && !fs.existsSync(path.join(A.dir, 'Gulf Retail AR - Arabic names.tmdl')) && !fs.existsSync(path.join(A.dir, 'Gulf Retail AR.pbip')), () => `T11. another modelNames at the write is refused, nothing written: ${short(bad2)} (${bad.err})`);
  const w = await call({ path: A.pbip, planId: id, terms: TERMS, modelNames: true });
  const disk = path.join(A.dir, 'Gulf Retail AR - Arabic names.tmdl');
  chk(() => !w.err && w.j.written && fs.existsSync(disk) && fs.readFileSync(disk, 'utf8') === script && w.j.arabicModelNames && /Arabic names\.tmdl$/.test(w.j.arabicModelNames.scriptFile) && /TMDL view/.test(w.j.arabicModelNames.howToApply), () => `T12. the write writes exactly the kept script and says how to apply it: ${short(w)}`);
  chk(() => JSON.stringify(hashDir(path.join(A.dir, 'Gulf Retail.SemanticModel'))) === JSON.stringify(before), () => 'T13. the model\'s files are not changed by the write');
  // a model that has ar-AE already: skipped and said
  const B = project('b', (rel, data) => (rel === 'Gulf Retail.SemanticModel/definition/model.tmdl' ? data + 'ref cultureInfo ar-AE\n' : data));
  fs.mkdirSync(path.join(B.dir, 'Gulf Retail.SemanticModel/definition/cultures'), { recursive: true });
  fs.writeFileSync(path.join(B.dir, 'Gulf Retail.SemanticModel/definition/cultures/ar-AE.tmdl'), 'cultureInfo ar-AE\n');
  const b = await call({ path: B.pbip, terms: TERMS, modelNames: true }), NB = b.j && b.j.arabicModelNames;
  chk(() => NB && NB.cultures.join() === 'ar-SA,ar-KW,ar-QA,ar-BH,ar-OM' && NB.skipped.length === 1 && NB.skipped[0].culture === 'ar-AE' && /already/.test(NB.skipped[0].why) && NB.skipped[0].whyAr, () => `T14. a culture the model already has is skipped and said: ${short(b)}`);
  // the answer's size (L-1103-03): under the cap, never cut
  chk(() => on.t.length < 40000 && !/truncated/.test(on.t) && off.t.length < 40000 && !/truncated/.test(off.t), () => `T15. the plan's answer under the cap and not cut: off ${off.t.length}, on ${on.t.length}`);
  console.log(`(sizes: plan answer off ${off.t.length}, on ${on.t.length}; script ${script.split('\n').length} lines, ${Buffer.byteLength(script)} bytes)`);
} catch (e) {
  problems.push('threw: ' + String(e && e.stack || e).slice(0, 600));
} finally {
  fs.rmSync(ROOT, { recursive: true, force: true });
}
if (problems.length) { console.log(`FAIL script=test-0.3.2-an1.mjs cause=${JSON.stringify(problems[0].slice(0, 200))}`); console.log(`FAIL  an1  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n')); process.exit(1); }
console.log(`PASS  an1  ${checks} checks`);
