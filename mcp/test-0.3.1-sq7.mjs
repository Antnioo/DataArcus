// SQ7 (0.3.1, the night run of the "Seen, not in scope" queue; mcp/work/SQ7.md): the calendar and the health check.
// Written red first, one block per item of mcp/work/SEEN-QUEUE.md:
//   C1-S1   a Calendar Generator table in Arabic (lang "ar") gets the Arabic labels of its quarters, fiscal year and
//           quarter and flags (the shared builder), not "Q1", "FY2025", true/false alone; no name twin (names are Arabic)
//   GC-S5   a Sharjah table gets "Is After Sharjah Weekend Change" from its rule's own sourced date (2022-01-01)
//   GC-S4   the Gulf check takes Sharjah's weekend: add_gulf_calendar's selfCheck of a shj table has no GC_WEEKEND, and
//           check_model_health takes weekend "shj" and passes it on to add_gulf_calendar's inputs
//   R-S14   gulf-calendar.mjs reads the model through model.mjs's one unwrap helper (modelOf)
//   A6-S3   add_gulf_calendar's env key says what it is on both paths (a planned name, or the approved write)
//   E-S2    the Health Check card's Arabic counts agree with the number (1, 2, 3-10, 11-99, 100)
//   W-S8    check_model_health says the DAX is not parsed (description and TOOLS.md)
// Fixtures: mcp/fixtures/twin-project (made up), copied into a temp folder.
//   node test-0.3.1-sq7.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const src = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');
const Cal = require('../assets/js/calendar-generator.js');
const Gulf = require('../assets/js/gulf-health.js');
const Fix = require('../assets/js/model-health-tmdl.js');
const G = await import('./lib/gulf-calendar.mjs');
const st = (o) => Object.assign({}, Cal.DEFAULTS, { start: '2021-01-01', end: '2023-12-31', fy: 4 }, o);
const tableOf = (b, name = 'Cal') => ({ model: { tables: [{ name, columns: b.columns.map((n) => ({ name: n })), partitions: [{ source: { type: 'calculated', expression: b.dax.split('\n').slice(1).join('\n') } }] }] } });
const ids = (r) => ((r && r.findings) || []).map((f) => f.id);

// ---------- C1-S1: an Arabic table's labels ----------
{
  const ar = Cal.build(st({ lang: 'ar' })), cols = ar.columns;
  const TWINS = ['Quarter (Arabic)', 'Year Quarter (Arabic)', 'Fiscal Year (Arabic)', 'Fiscal Quarter (Arabic)', 'Is Weekend (Arabic)', 'Is Working Day (Arabic)', 'Is Ramadan (Arabic)', 'Is Eid al-Fitr (Arabic)', 'Is Eid al-Adha (Arabic)'];
  chk(() => TWINS.every((c) => cols.includes(c)), () => `C1-S1a. an Arabic table has its labels' Arabic twins: missing ${TWINS.filter((c) => !cols.includes(c)).join(', ')}`);
  chk(() => !cols.some((c) => /^(Month Name|Month Short|Day Name|Hijri Month Name) \(Arabic\)$/.test(c)), () => `C1-S1b. no name twin in an Arabic table (its names are Arabic already): ${cols.filter((c) => /\(Arabic\)$/.test(c)).join(', ')}`);
  chk(() => /"الربع "/.test(ar.dax) && /"السنة المالية "/.test(ar.dax) && /"الربع المالي "/.test(ar.dax) && /"عطلة نهاية الأسبوع"/.test(ar.dax) && /"خارج رمضان"/.test(ar.dax),
    () => 'C1-S1c. the labels are the shared builder\'s (arabic-calendar.js): «الربع», «السنة المالية», «الربع المالي», the flags\' pairs');
  chk(() => cols.includes('Quarter') && /"Q" & ROUNDUP/.test(ar.dax) && cols.includes('Is Weekend'), () => 'C1-S1d. the English columns stay as they are (Quarter "Q1", Is Weekend true/false: measures read them)');
  const off = Cal.build(st({ lang: 'ar', arabicNames: false })).columns;
  chk(() => !off.some((c) => /\(Arabic\)$/.test(c)), () => `C1-S1e. arabicNames false: no Arabic twin, as before: ${off.filter((c) => /\(Arabic\)$/.test(c)).join(', ')}`);
  const en = Cal.build(st({ lang: 'en' })).columns;
  chk(() => ['Month Name (Arabic)', 'Day Name (Arabic)', 'Hijri Month Name (Arabic)', ...TWINS].every((c) => en.includes(c)), () => 'C1-S1f. the English table keeps every Arabic twin (pin)');
  // the sort of each twin that needs one is still written (the Arabic table's name twins are not there to sort)
  chk(() => Cal.build(st({ lang: 'ar' })).sorts.every(([n, by]) => cols.includes(n) && cols.includes(by)), () => 'C1-S1g. every sort the Arabic table lists names its own columns');
}

// ---------- GC-S5: Sharjah's change column ----------
{
  const shj = Cal.build(st({ weekend: 'shj' })), uae = Cal.build(st({ weekend: 'uae' })), ksa = Cal.build(st({ weekend: 'ksa' }));
  const from = (Cal.COUNTRY.shj || []).filter((r) => r.from).pop();
  chk(() => from && from.from === '2022-01-01' && shj.columns.includes('Is After Sharjah Weekend Change') && /"Is After Sharjah Weekend Change", \[Date\] >= DATE \( 2022, 1, 1 \)/.test(shj.dax),
    () => `GC-S5a. a Sharjah table has "Is After Sharjah Weekend Change" from the rule's sourced date: ${shj.columns.filter((c) => /After/.test(c)).join(', ') || 'none'}`);
  chk(() => !shj.columns.includes('Is After UAE Weekend Change'), () => 'GC-S5b. a Sharjah table does not say the UAE\'s (federal) change');
  chk(() => uae.columns.includes('Is After UAE Weekend Change') && !uae.columns.includes('Is After Sharjah Weekend Change'), () => 'GC-S5c. the UAE table keeps its column (pin)');
  chk(() => !ksa.columns.some((c) => /^Is After .* Weekend Change$/.test(c)), () => 'GC-S5d. another country gets no change column (pin)');
  chk(() => /Sharjah Executive Council/.test(fs.readFileSync(path.join(HERE, '../scripts/gulf-calendar/DATES-SOURCES.md'), 'utf8')), () => 'GC-S5e. the Sharjah date is sourced in DATES-SOURCES.md');
}

// ---------- GC-S4: Sharjah's weekend in the Gulf check ----------
{
  const shj = tableOf(Cal.build(st({ weekend: 'shj', start: '2022-01-01', end: '2022-03-31' })));
  const before = Gulf.analyze(shj, { country: 'uae', asOf: '2022-01-15' });
  chk(() => ids(before).includes('GC_WEEKEND'), () => `GC-S4a. (the item) a Sharjah table checked against the federal weekend: GC_WEEKEND (${ids(before).join(', ')})`);
  const r = Gulf.analyze(shj, { country: 'uae', weekend: 'shj', asOf: '2022-01-15' });
  chk(() => !ids(r).includes('GC_WEEKEND') && r.weekend && r.weekend.code === 'shj', () => `GC-S4b. checked with weekend "shj": no GC_WEEKEND, the section says the rule: ${ids(r).join(', ')} ${JSON.stringify(r.weekend)}`);
  const uae = tableOf(Cal.build(st({ weekend: 'uae', start: '2022-01-01', end: '2022-03-31' })));
  const u = Gulf.analyze(uae, { country: 'uae', weekend: 'shj', asOf: '2022-01-15' }), f = (u.findings || []).find((x) => x.id === 'GC_WEEKEND');
  chk(() => f && /Sharjah/.test(f.title) && /الشارقة/.test(f.ar.title) && f.count === 13, () => `GC-S4c. a federal table checked with "shj": GC_WEEKEND names Sharjah's government, 13 Sundays: ${JSON.stringify(f && { t: f.title, a: f.ar.title, n: f.count })}`);
  chk(() => u.fixes && u.fixes.calendarGenerator && u.fixes.calendarGenerator.settings.weekend === Gulf.WEEKEND_RULES.shj.weekendOption, () => `GC-S4d. its fix names the generator's Sharjah option: ${JSON.stringify(u.fixes && u.fixes.calendarGenerator && u.fixes.calendarGenerator.settings.weekend)}`);
  const k = Gulf.analyze(uae, { country: 'ksa', weekend: 'nope', asOf: '2022-01-15' });
  chk(() => k.country.code === 'ksa' && !k.weekend, () => 'GC-S4e. an unknown weekend is the country\'s (pin)');
  // add_gulf_calendar's selfCheck (in process, the script never written)
  const env = { Gulf, Fix, writeScript: (d, b) => path.join(d, b + '.tmdl'), scriptFile: (d, b) => path.join(d, b + '.tmdl'), scriptDir: os.tmpdir(), scriptBase: 'X' };
  const a = G.addGulfCalendar({ tmsl: { model: { tables: [] } } }, { firstYear: 2021, lastYear: 2023, country: 'uae', weekend: 'shj', asOf: '2022-06-01' }, env);
  chk(() => !a.selfCheck.findings.some((x) => x.id === 'GC_WEEKEND'), () => `GC-S4f. add_gulf_calendar's selfCheck of a Sharjah table: no GC_WEEKEND: ${JSON.stringify(a.selfCheck.findings)}`);
  chk(() => G.gulfFixInputs(r).inputs.weekend === 'shj' && G.gulfFixInputs(Gulf.analyze(shj, { country: 'uae', asOf: '2022-01-15' })).inputs.weekend === 'country',
    () => 'GC-S4g. fixes.addGulfCalendar passes the weekend the check used ("shj"; else "country")');
}

// ---------- R-S14 and A6-S3: the source ----------
{
  const s = src('lib/gulf-calendar.mjs');
  chk(() => /import \{[^}]*\bmodelOf\b[^}]*\} from '\.\/model\.mjs'/.test(s) && !/m\.tmsl\.model \|\|/.test(s) && !/tmsl && \(m\.tmsl\.model/.test(s), () => 'R-S14. gulf-calendar.mjs reads the model through model.mjs\'s modelOf, never unwraps m.tmsl itself');
  chk(() => !/\bwriteScript\b/.test(s) && /scriptFile\(dir, base, script\)/.test(s) && /names the file only/.test(s), () => 'A6-S3a. the env key is scriptFile, documented on both paths (the plan names the file only; the approved plan writes it)');
  chk(() => !/writeScript:/.test(src('tools/add_gulf_calendar.mjs')), () => 'A6-S3b. add_gulf_calendar passes scriptFile on both paths');
}

// ---------- E-S2: the card's Arabic counts ----------
{
  const s = fs.readFileSync(path.join(HERE, '../assets/js/model-health.js'), 'utf8'), m = /const arCount = (\(n, w, fmt\) => \{[^\n]*\});/.exec(s);
  const arCount = m ? (0, eval)(m[1]) : null, W = { one: 'جدول واحد', two: 'جدولان', few: 'جداول', many: 'جدولًا', hundred: 'جدول' };
  const got = arCount ? [0, 1, 2, 3, 10, 11, 99, 100, 101, 102, 103, 111].map((n) => arCount(n, W, String)) : [];
  chk(() => JSON.stringify(got) === JSON.stringify(['0 جداول', 'جدول واحد', 'جدولان', '3 جداول', '10 جداول', '11 جدولًا', '99 جدولًا', '100 جدول', '101 جدول', '102 جدول', '103 جداول', '111 جدولًا']),
    () => `E-S2a. the Arabic count agrees with the number: ${JSON.stringify(got)}`);
  chk(() => /many\(s\.visuals[^)]*'مرئي واحد'[^)]*'مرئيان'[^)]*'مرئيات'[^)]*'مرئيًا'[^)]*'مرئي'/.test(s), () => 'E-S2b. visuals counted with E2\'s singular «مرئي»');
}

// ---------- W-S8: the DAX is not parsed ----------
{
  const LINE = 'DAX is not parsed: a measure whose DAX is broken is not found';
  chk(() => src('tools/check_model_health.mjs').includes(LINE), () => 'W-S8a. check_model_health\'s description says the DAX is not parsed');
  const t = src('TOOLS.md'), sec = t.slice(t.indexOf('## `check_model_health`'), t.indexOf('## `add_gulf_calendar`'));
  chk(() => sec.includes(LINE), () => 'W-S8b. TOOLS.md\'s check_model_health section says it');
}

// ---------- through the tool: check_model_health takes weekend "shj" ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sq7-')));
fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(ROOT, 'p'), { recursive: true });
try {
  const w = await serverClient(ROOT, {});
  const h = await w.call('check_model_health', { path: 'p', country: 'uae', weekend: 'shj', asOf: '2026-01-01' });
  const gc = h.j && h.j.gulfCalendar, add = h.j && h.j.fixes && h.j.fixes.addGulfCalendar;
  chk(() => !h.err && gc && gc.weekend && gc.weekend.code === 'shj' && add && add.inputs.weekend === 'shj', () => `GC-S4h. check_model_health with weekend "shj": the section and fixes.addGulfCalendar say it: ${String(h.err ? h.t : JSON.stringify({ w: gc && gc.weekend, add })).slice(0, 300)}`);
  const s = await w.call('check_model_health', { path: 'p', weekend: 'shj', asOf: '2026-01-01' });
  chk(() => !s.err && s.j.gulfCalendar && s.j.gulfCalendar.country.code === 'uae', () => `GC-S4i. weekend "shj" alone shows the section for the UAE: ${String(s.err ? s.t : JSON.stringify(s.j.gulfCalendar && s.j.gulfCalendar.country)).slice(0, 200)}`);
} finally {
  try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* the OS cleans its temp folder */ }
}

if (problems.length) {
  console.log(`FAIL script=test-0.3.1-sq7.mjs cause=${JSON.stringify(problems[0].slice(0, 200))}`);
  problems.forEach((p) => console.log('  - ' + p));
  console.log(`FAIL  sq7  ${problems.length} of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS  sq7  ${checks} checks`);
process.exit(0);
