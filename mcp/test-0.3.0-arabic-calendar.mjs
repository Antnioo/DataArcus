// 0.3.0 C1 (the owner, 21 Oct: "we can't control English values in data in the AR report, but we can introduce some
// columns in the calendar that we work with Arabic columns"; his decisions: C1 ships in 0.3.0, and until the person
// applies the script the Arabic report uses the English calendar columns, after it the Arabic ones). Written red first.
//   AC-1  the shared builder (assets/js/arabic-calendar.js) on large-synthetic's Calendar: the Arabic twins of what it
//         has (names, DAX from the date, sorted by the English column's own sort, the year isolated, flags' labels),
//         nothing twice, the same script twice (lineage tags from the plan's seed); the Calendar Generator's table has them
//   AC-2  the offer in every Arabic route: plan_layout / create_report lang "ar" (calendarArabic, written after the go,
//         on the approval page), create_arabic_twin and its EN-AR copy (arabicMonth: the full set; false: none);
//         an English plan offers nothing
//   AC-3  before the script: the Arabic report binds the English calendar columns, works, and says which and how to switch
//   AC-4  after the script (applied to a copy of the model's files, as TMDL view would): nothing offered, the Arabic twins
//         bound (the month on the axis, the flag on the pills slicer); no English calendar text column on an Arabic page
// Fixtures: mcp/test-models/large-synthetic (made up), focus "Web Orders".   node test-0.3.0-arabic-calendar.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { keepingEnglish } from './test-plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), req0 = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const get = (url) => new Promise((resolve) => { http.get(url, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); }).on('error', () => resolve('')); });
let AC = null, Cal = null;
try { AC = req0('../assets/js/arabic-calendar.js'); } catch (e) { /* not there yet */ }
try { Cal = req0('../assets/js/calendar-generator.js'); } catch (e) { /* */ }

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-c1-')));
const SRC = path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel');
fs.cpSync(SRC, path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
fs.cpSync(SRC, path.join(ROOT, 'after/Large Synthetic.SemanticModel'), { recursive: true });
const MP = 'large/Large Synthetic.SemanticModel', AP = 'after/Large Synthetic.SemanticModel';
const DES = { focus: 'Web Orders', layout: 'exec', filters: 'top', secondPage: false, planFields: { slicers: ['Calendar[Is Weekend]', 'Coupon[Coupon Region]'] }, slicerStyle: 'pills' };
const WANT = { 'Month Name (Arabic)': 'Month Number', 'Month Short (Arabic)': 'Month Number', 'Day Name (Arabic)': 'Weekday Number', 'Quarter (Arabic)': null, 'Year Quarter (Arabic)': null,
  'Fiscal Year (Arabic)': null, 'Fiscal Quarter (Arabic)': null, 'Is Weekend (Arabic)': null, 'Is Ramadan (Arabic)': null };
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const s = await serverClient(ROOT, {}), w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
s.call = keepingEnglish(s.call);   // (0.3.1 CX1, F01: the fields of English titles kept English on purpose, as these checks were written)
w.call = keepingEnglish(w.call);   // (0.3.1 CX1, F01: the fields of English titles kept English on purpose, as these checks were written)
// a column block of the script, by its name
const block = (script, name) => { const m = String(script).split(/\n(?=\t\tcolumn )/).find((b) => b.startsWith(`\t\tcolumn '${name.replace(/'/g, "''")}'`) || b.startsWith(`\t\tcolumn ${name}`)); return m || ''; };
// the bound fields of a written report: "Table[Column]" of every projection on its pages
const boundOf = (dir) => { const out = new Set(); const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else if (e.name === 'visual.json') {
  const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== 'object') return; if (o.Column && o.Column.Expression && o.Column.Expression.SourceRef) out.add(`${o.Column.Expression.SourceRef.Entity}[${o.Column.Property}]`); Object.values(o).forEach(walk); };
  walk((JSON.parse(fs.readFileSync(f, 'utf8')).visual || {}).query); } }); rec(dir); return out; };
const slicerOf = (dir, field) => { let hit = null; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else if (e.name === 'visual.json') { const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (/slicer/i.test((j.visual || {}).visualType || '') && JSON.stringify(j.visual.query || {}).includes(`"Property":"${field}"`)) hit = j; } }); rec(dir); return hit; };
const write = async (args) => {
  const pl = await s.call('plan_layout', args), id = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!id) return { pl, err: 'no plan id: ' + JSON.stringify((pl.j || {}).planProblems || pl.t).slice(0, 400) };
  await s.call('approve_plan', { planId: id });
  const send = Object.assign({}, args, { planId: id, design: pl.j.design, fields: args.planFields }); delete send.planFields;
  const r = await s.call('create_report', send);
  return r.err ? { pl, err: String(r.t).slice(0, 500) } : { pl, r };
};

try {
  // ---------- AC-1: the builder ----------
  chk(() => AC && typeof AC.columnsFor === 'function', () => 'AC-1a. the shared builder assets/js/arabic-calendar.js exists (columnsFor)');
  const pa = await s.call('plan_layout', Object.assign({ path: MP, lang: 'ar', name: 'تقويم' }, DES));
  const CA = (pa.j && pa.j.calendarArabic) || {};
  chk(() => CA.offered === true && CA.table === 'Calendar' && /Arabic calendar\.tmdl$/.test(CA.scriptAfterGo || ''), () => `AC-2a. plan_layout lang "ar" offers the Arabic calendar columns as a script after the go: ${JSON.stringify(CA).slice(0, 400)} ${pa.err ? pa.t.slice(0, 300) : ''}`);
  {
    const names = (CA.columns || []).map((c) => c.name).sort(), want = Object.keys(WANT).sort();
    chk(() => JSON.stringify(names) === JSON.stringify(want), () => `AC-1b. the twins of what large-synthetic's Calendar has: ${JSON.stringify(names)} (want ${JSON.stringify(want)})`);
    chk(() => !('script' in CA), () => 'AC-2a2. the plan answer carries no DAX (the script is written after the go)');
    const w0 = await write(Object.assign({ path: MP, lang: 'ar', name: 'تقويم ج' }, DES)), f0 = path.join(ROOT, 'large/تقويم ج - Arabic calendar.tmdl');
    const sc = fs.existsSync(f0) ? fs.readFileSync(f0, 'utf8') : ''; CA.script = sc;
    chk(() => !w0.err && sc, () => `set-up: the script written with a report: ${w0.err || 'no file'}`);
    const bad = Object.entries(WANT).filter(([n, by]) => { const b = block(sc, n); return !b || !/dataType: string/.test(b) || !/lineageTag: [0-9a-f-]{36}/.test(b) || (by ? !b.includes(`sortByColumn: ${/ /.test(by) ? `'${by}'` : by}`) : /sortByColumn/.test(b)); });
    chk(() => /^createOrReplace/.test(sc) && /ref table Calendar/.test(sc) && !bad.length, () => `AC-1c. each column a string, its lineage tag, sorted by the English column's own sort column: ${JSON.stringify(bad)} ${sc.slice(0, 400)}`);
    chk(() => /'Calendar'\[Date\]/.test(block(sc, 'Month Name (Arabic)')) && /"يناير"/.test(sc) && /"الأحد"/.test(sc) && /WEEKDAY \( 'Calendar'\[Date\], 1 \)/.test(block(sc, 'Day Name (Arabic)')),
      () => `AC-1d. the names come from the date (SWITCH on MONTH and WEEKDAY of Calendar[Date]): ${block(sc, 'Month Name (Arabic)').slice(0, 200)}`);
    // (P7, changed on purpose: J18's rule for the digit runs, a first-strong isolate U+2068 and a right-to-left mark at an end)
    chk(() => /"الربع "/.test(block(sc, 'Quarter (Arabic)')) && /UNICHAR \( 8296 \) & YEAR/.test(block(sc, 'Year Quarter (Arabic)')) && /UNICHAR \( 8297 \)/.test(block(sc, 'Year Quarter (Arabic)')) && /UNICHAR \( 8207 \)/.test(block(sc, 'Year Quarter (Arabic)')),
      () => `AC-1e. «الربع 1»; the year of «2025 الربع 1» isolated (U+2068 ... U+2069, U+200F at the ends): ${block(sc, 'Year Quarter (Arabic)').slice(0, 260)}`);
    // (F7, changed on purpose: the E1 Arabic review's F-4: a weekday holiday is not a weekend, nor a working day)
    chk(() => /IF \( 'Calendar'\[Is Weekend\], "عطلة نهاية الأسبوع", "خارج عطلة نهاية الأسبوع" \)/.test(block(sc, 'Is Weekend (Arabic)')) && /IF \( 'Calendar'\[Is Ramadan\], "رمضان", "خارج رمضان" \)/.test(block(sc, 'Is Ramadan (Arabic)')),
      () => `AC-1f. the flags' labels: ${block(sc, 'Is Weekend (Arabic)').slice(0, 200)} | ${block(sc, 'Is Ramadan (Arabic)').slice(0, 200)}`);
    chk(() => /'Calendar'\[Fiscal Month Number\]/.test(block(sc, 'Fiscal Quarter (Arabic)')) && /"السنة المالية "/.test(block(sc, 'Fiscal Year (Arabic)')) && !/[A-Za-z]{2,}"\s*[,)]/.test(block(sc, 'Fiscal Year (Arabic)').replace(/"FY"|"fy"/g, '')),
      () => `AC-1g. the fiscal year and quarter in Arabic (the quarter from the fiscal month number): ${block(sc, 'Fiscal Year (Arabic)').slice(0, 260)}`);
    const w1 = await write(Object.assign({ path: MP, lang: 'ar', name: 'تقويم د' }, DES)), f1 = path.join(ROOT, 'large/تقويم د - Arabic calendar.tmdl');
    chk(() => !w1.err && fs.existsSync(f1) && fs.readFileSync(f1, 'utf8') === sc, () => 'AC-1h. the same model gives the same script (lineage tags by a seed, not random)');
    chk(() => (CA.englishData || []).some((x) => /Is Weekend|Month/.test(x)) && /English data/.test(CA.englishDataWhy || '') && /apply the script/i.test(CA.howToSwitch || '') && /plan/i.test(CA.howToSwitch || ''),
      () => `AC-3a. the plan says which calendar fields show English data until the script is applied, and how to switch: ${JSON.stringify({ e: CA.englishData, h: CA.howToSwitch }).slice(0, 500)}`);
  }
  // (0.3.0 F7, the E1 Arabic review's F-4) each flag's two labels say exactly the flag's true and false: Is Working Day's
  // false is a day off (a weekend or a holiday), never "weekend"; Is Weekend's false is "not the weekend", never "a
  // working day" (a holiday on a weekday is neither)
  { const F = (AC && AC.FLAGS) || {};
    chk(() => JSON.stringify(F['is working day']) === JSON.stringify(['يوم عمل', 'يوم عطلة']) && JSON.stringify(F['is weekend']) === JSON.stringify(['عطلة نهاية الأسبوع', 'خارج عطلة نهاية الأسبوع'])
        && JSON.stringify(F['is ramadan']) === JSON.stringify(['رمضان', 'خارج رمضان']) && F['is eid al-fitr'][0] === 'عيد الفطر' && F['is eid al-adha'][0] === 'عيد الأضحى',
      () => `AC-1k. each flag's labels mean exactly its true and false: ${JSON.stringify(F)}`); }
  // the generator writes the same twins (one builder)
  {
    const b = Cal ? Cal.build(Object.assign({}, Cal.DEFAULTS)) : null, want = ['Quarter (Arabic)', 'Year Quarter (Arabic)', 'Month Short (Arabic)', 'Day Short (Arabic)', 'Is Weekend (Arabic)', 'Is Working Day (Arabic)', 'Fiscal Year (Arabic)', 'Fiscal Quarter (Arabic)', 'Is Ramadan (Arabic)', 'Is Eid al-Fitr (Arabic)', 'Is Eid al-Adha (Arabic)'];
    chk(() => b && want.every((n) => b.columns.includes(n)) && (b.sorts || []).some(([n, by]) => n === 'Month Short (Arabic)' && by === 'Month Number'), () => `AC-1i. the Calendar Generator's table has the twins: ${b ? want.filter((n) => !b.columns.includes(n)).join(', ') : 'no build'}`);
    const e = Cal ? Cal.build(Object.assign({}, Cal.DEFAULTS, { arabicNames: false })) : null;
    chk(() => e && !e.columns.some((n) => /\(Arabic\)$/.test(n)), () => 'AC-1j. arabicNames off: no Arabic twin');
  }
  // an English plan offers nothing
  { const pe = await s.call('plan_layout', Object.assign({ path: MP, lang: 'en', name: 'Cal EN' }, DES)); chk(() => pe.j && !pe.j.calendarArabic, () => `AC-2b. an English plan offers no Arabic calendar: ${JSON.stringify(pe.j && pe.j.calendarArabic)}`); }

  // ---------- AC-2/AC-3: written after the go; the Arabic report before the script ----------
  const before = await write(Object.assign({ path: MP, lang: 'ar', name: 'تقويم' }, DES));
  const RD = path.join(ROOT, 'large/تقويم.Report'), scriptFile = path.join(ROOT, 'large/تقويم - Arabic calendar.tmdl');
  chk(() => !before.err && fs.existsSync(RD) && fs.existsSync(scriptFile) && before.r.j.calendarArabic && /TMDL view/.test(before.r.j.calendarArabic.howToApply || ''), () => `AC-2c. create_report writes the script next to the project after the go: ${before.err || JSON.stringify(before.r.j.calendarArabic).slice(0, 300)}`);
  chk(() => !fs.readFileSync(path.join(ROOT, MP, 'definition/tables/Calendar.tmdl'), 'utf8').includes('(Arabic)'), () => 'AC-2d. the model is never changed');
  const B0 = fs.existsSync(RD) ? boundOf(RD) : new Set();
  chk(() => B0.has('Calendar[Is Weekend]') && ![...B0].some((f) => /\(Arabic\)\]$/.test(f)), () => `AC-3b. before the script the Arabic report binds the English calendar columns: ${JSON.stringify([...B0].filter((f) => /^Calendar/.test(f)))}`);
  { const c = await s.call('check_report', { path: 'large/تقويم.pbip' }), j = c.j || {};
    chk(() => j.validator && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0, () => `AC-3c. the report before the script works: ${short(c)}`); }
  // the approval page lists the script
  {
    const pl = await w.call('plan_layout', Object.assign({ path: MP, lang: 'ar', name: 'تقويم ب' }, DES)), id = pl.j && pl.j.plan && pl.j.plan.planId, n = links().length;
    await w.call('approve_plan', { planId: id }); let url = ''; for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50); url = links()[n] || '';
    const html = url ? unesc(await get(url)) : '';
    chk(() => /Arabic calendar\.tmdl/.test(html), () => `AC-2e. the approval page lists the Arabic calendar script: ${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200)}`);
  }

  // ---------- the twin and the EN-AR copy ----------
  const en = await write(Object.assign({ path: MP, lang: 'en', name: 'Cal EN' }, DES));
  chk(() => !en.err, () => `set-up: the English report: ${en.err}`);
  for (const into of [null, 'same']) {
    const t = await s.call('create_arabic_twin', Object.assign({ path: 'large/Cal EN.pbip' }, into ? { into } : {})), am = (t.j && t.j.arabicMonth) || {};
    chk(() => am.offered === true && am.column === 'Month Name (Arabic)' && (am.columns || []).length === Object.keys(WANT).length && /Arabic calendar\.tmdl$/.test(am.scriptAfterGo || ''),
      () => `AC-2f. create_arabic_twin${into ? ' into "same"' : ''} offers the full set (arabicMonth): ${JSON.stringify(am).slice(0, 400)}`);
    const off = await s.call('create_arabic_twin', Object.assign({ path: 'large/Cal EN.pbip', arabicMonth: false }, into ? { into } : {}));
    chk(() => off.j && off.j.arabicMonth && off.j.arabicMonth.offered === false, () => `AC-2g. arabicMonth false: nothing offered: ${short(off)}`);
  }

  // ---------- AC-4: after the script ----------
  {
    // the script applied to the copy's files as TMDL view would: its columns into the table's own file
    const sc = String(CA.script || ''), cf = path.join(ROOT, AP, 'definition/tables/Calendar.tmdl');
    const cols = sc.split('\n').slice(sc.split('\n').findIndex((l) => /^\tref table /.test(l)) + 1).map((l) => l.replace(/^\t/, '')).join('\n').replace(/^\n+|\s+$/g, '');
    const t0 = fs.readFileSync(cf, 'utf8'); fs.writeFileSync(cf, t0.replace(/\n\tpartition /, '\n' + cols + '\n\n\tpartition '));
    const pa2 = await s.call('plan_layout', Object.assign({ path: AP, lang: 'ar', name: 'تقويم' }, DES));
    chk(() => pa2.j && (!pa2.j.calendarArabic || pa2.j.calendarArabic.offered === false), () => `AC-4a. after the script nothing is offered: ${JSON.stringify(pa2.j && pa2.j.calendarArabic).slice(0, 300)} ${pa2.err ? pa2.t.slice(0, 300) : ''}`);
    const after = await write(Object.assign({ path: AP, lang: 'ar', name: 'تقويم' }, DES)), AD = path.join(ROOT, 'after/تقويم.Report');
    const B1 = fs.existsSync(AD) ? boundOf(AD) : new Set(), englishCal = [...B1].filter((f) => /^Calendar\[/.test(f) && Object.keys(WANT).some((n) => f === `Calendar[${n.replace(' (Arabic)', '')}]`));
    chk(() => !after.err && B1.has('Calendar[Is Weekend (Arabic)]') && !englishCal.length, () => `AC-4b. after the script the Arabic twins are bound, the flag too: ${after.err || JSON.stringify([...B1].filter((f) => /^Calendar/.test(f)))}`);
    const sl = fs.existsSync(AD) ? slicerOf(AD, 'Is Weekend (Arabic)') : null;
    chk(() => sl && sl.visual.visualType === 'advancedSlicerVisual', () => `AC-4c. the flag's Arabic labels on the pills slicer: ${sl ? sl.visual.visualType : 'no slicer on Is Weekend (Arabic)'}`);
    const c = await s.call('check_report', { path: 'after/تقويم.pbip' }), j = c.j || {};
    chk(() => j.validator && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0, () => `AC-4d. the report after the script: validator 0 errors, check_report 0 "can break": ${short(c)}`);
  }
  // pairTwins: a true/false column and its "(Arabic)" label are a pair (byLang swaps it outside a date table too)
  { const B = req0('../assets/js/pbip-bind.js'), tw = B.twinsOf([{ name: 'Days', measures: [], columns: [{ name: 'Day', dataType: 'dateTime' }, { name: 'Is Holiday', dataType: 'boolean' }, { name: 'Is Holiday (Arabic)', dataType: 'string' }, { name: 'Other Flag', dataType: 'boolean' }] }]);
    chk(() => tw['Days[Is Holiday]'] === 'Days[Is Holiday (Arabic)]' && !tw['Days[Other Flag]'], () => `AC-4e. a boolean is paired with its "(Arabic)" label, and only then: ${JSON.stringify(tw)}`); }
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }
await s.close(); await w.close();
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL  arabic-calendar  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  arabic-calendar  ${checks} checks`);
