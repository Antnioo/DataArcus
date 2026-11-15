import './test-env.mjs';
// 0.3.3 IX2 (the owner, 11 Nov, D-1111-17 and D-1111-16: "IX2 then OX2"; mcp/work/IX2.md). IX1's stage 2: like for
// like in the Gulf as a lens of check_report (option likeForLike: { year, country }, section likeForLike beside
// impactCheck), read through impact.mjs's one reading; one DAX call reader (health-confirm.js's CF, exported: IX1's
// callsOf gone); a calculation group's items read; the like-for-like names in `lacking` given whole (to 200
// characters, a longer one marked with its cut); every list capped.
//   T1-T5  through the real server, on Souq Gulf written as a .pbip project: 2026, the UAE in 2022, no year, the section
//          the library's own answer, a year outside the dates
//   O1     likeForLike beside againstModel: both sections, and the report and its model read no more often than for
//          againstModel alone (one reading)
//   G1-G4  a calculation group: its item that compares by Gregorian dates is read on the visuals that use the group's
//          column (a field, a page filter), never on the others; no base, no Ramadan partner
//   R1-R3  one reader: CF exported by health-confirm.js; like-for-like.mjs has no reader of its own; the comparisons the
//          same as IX1's on its DAX texts
//   N1-N2  a long base measure: its "<base> Last Ramadan" given whole; past 200 characters, the cut marked
//   C1-C4  the caps: measures, a visual's comparisons, lacking, the distances; 400 visuals under 40,000, never truncated
//   Q1-Q4  refusals through the registered schema; no model folder named; without the option no section
//   S1     a literal planted in a comparison's DAX and in a page filter is in no answer
//   D1-D3  TOOLS.md, PRIVACY.md and CHANGELOG
// Made up, in os.tmpdir(), from fixtures/ix1-souq-gulf.mjs: no model rows.   node test-0.3.3-ix2.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { gulfModel, gulfReport } from './fixtures/ix1-souq-gulf.mjs';
import { visual, colRef, msrRef, measureOf, tableOf } from './fixtures/hx1-souq.mjs';
import { project as writeProject } from './fixtures/souq-project.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-ix2-')));
process.env.DATAARCUS_ROOT = ROOT;
const { serverClient } = await import('./test-0.2.9.mjs');
let L = {}; try { L = await import('./lib/like-for-like.mjs'); } catch (e) { L = {}; }
let CR = {}; try { CR = await import('./lib/check-report.mjs'); } catch (e) { CR = {}; }
const J = (x) => JSON.stringify(x);
const SRC = (f) => fs.readFileSync(path.join(HERE, '..', f), 'utf8');
const CANARY = 'IX2_CANARY_4417';

// ---- Souq Gulf as a .pbip project on disk: <dir>/Souq.SemanticModel/model.bim, <dir>/Souq.Report/definition/... ----
const project = (name, model, report, opts) => writeProject(ROOT, name, model, report, opts);   // (0.3.3 OX2: the shared helper)
// a calculation group "Time Intel" on Souq Gulf: Current, PY (one year back) and PM (a month back)
const withGroup = (m) => { m.model.tables.push({ name: 'Time Intel', calculationGroup: { precedence: 1, calculationItems: [{ name: 'Current', expression: 'SELECTEDMEASURE ()' },
  { name: 'PY', expression: "CALCULATE ( SELECTEDMEASURE (), SAMEPERIODLASTYEAR ( 'Calendar'[Date] ) )" }, { name: 'PM', expression: "CALCULATE ( SELECTEDMEASURE (), DATEADD ( 'Calendar'[Date], -1, MONTH ) )" }] },
  columns: [{ name: 'Period', dataType: 'string', sourceColumn: 'Name' }] }); return m; };

const IX1_2026 = '4 of 16 visuals compare with the same Gregorian dates of another period (through [Revenue LY], [Revenue PM], [Units LY (report)], [Units PY]). One year back, 2026 against 2025: 5 of 12 months are not like for like in the Gulf (February: 11 Ramadan days against 0; March: 19 Ramadan days against 29, 3 Eid al-Fitr days against 2; April: 0 Eid al-Fitr days against 1; May: 4 Eid al-Adha days against 0; June: 0 Eid al-Adha days against 4).';
const SG = project('sg', gulfModel(), gulfReport());
const s = await serverClient(ROOT, {});
const answers = [];
const call = async (args) => { const r = await s.call('check_report', args); answers.push(r.t); return r; };
const lf = (r) => (r && r.j && r.j.likeForLike) || null;
const vis = (x) => (x ? x.list.map((v) => v.visual).sort() : null);
const cut = (r) => String(r && r.t).slice(0, 700);

try {
  // ---------- T: through the server ----------
  { const r = await call({ path: SG.report, checks: ['schemas'], likeForLike: { year: 2026 } }), x = lf(r);
    chk(() => x && x.compared === 4 && x.withQuery === 16 && x.visuals === 17 && J(vis(x)) === J(['card-growth', 'card-units-ly-report', 'line-growth-by-month', 'table-month-compare']) && x.said === IX1_2026,
      () => `T1 2026: 4 of 16 visuals, IX1's sentence word for word: ${cut(r)}`);
    chk(() => x.calendar[0].year === 2026 && x.calendar[0].differ === 5 && x.calendar[0].months.length === 5 && x.calendar[1].back === 1 && J(x.lacking) === J(['[Cost Last Ramadan]', '[Units Last Ramadan]']) && x.measures.length === 6 && typeof x.notProved === 'string',
      () => `T1b the months (5 a year back, then a month back), the 2 lacking measures, 6 comparison measures, what it does not prove: ${cut(r)}`);
    chk(() => r.j.report && r.j.schemas && Array.isArray(r.j.findings) && Object.keys(r.j).indexOf('likeForLike') > Object.keys(r.j).indexOf('impact'), () => `T1c the checks still run; the section sits after impact, beside impactCheck: ${Object.keys(r.j || {}).join(',')}`); }
  { const r = await call({ path: SG.report, checks: ['schemas'], likeForLike: { year: 2022, country: 'uae' } }), x = lf(r);
    chk(() => x && x.calendar[0].differ === 12 && /the weekend changed \(Saturday \+ Sunday against Friday \+ Saturday\)/.test(x.said), () => `T2 the UAE, 2022: 12 months, the weekend said: ${cut(r)}`); }
  { const r = await call({ path: SG.report, checks: ['schemas'], likeForLike: {} }), x = lf(r);
    chk(() => x && x.calendar[0].differ === 41 && x.calendar[0].monthsCompared === 144 && /2019 to 2030: 41 of 144 months/.test(x.said) && !x.calendar[0].months, () => `T3 no year: the summary, 41 of 144, no month listed: ${cut(r)}`); }
  { const r = await call({ path: SG.report, checks: ['schemas'], likeForLike: { year: 2026, country: 'omn' } }), x = lf(r), lib = L.likeForLike(gulfModel(), gulfReport(), { year: 2026, country: 'omn' });
    const strip = (a) => { const c = JSON.parse(J(a)); delete c.unread; return c; };
    chk(() => x && J(strip(x)) === J(strip(lib)), () => `T4 the section is the library's own answer on the same model and report: ${J(x).slice(0, 300)} / ${J(lib).slice(0, 300)}`); }
  { const r = await call({ path: SG.report, checks: ['schemas'], likeForLike: { year: 2017 } }), x = lf(r);
    chk(() => x && x.calendar[0].known === false && /2018/.test(x.calendar[0].why) && !/months are not like for like/.test(x.said), () => `T5 a year outside the dates: said, no count: ${cut(r)}`); }

  // ---------- O: one reading beside againstModel ----------
  { const reads = new Map(), real = fs.openSync;
    const count = async (opts) => { reads.clear(); fs.openSync = function (f, ...a) { const k = String(f); reads.set(k, (reads.get(k) || 0) + 1); return real.call(fs, f, ...a); }; try { return await CR.checkReport(SG.report, Object.assign({ checks: ['schemas'] }, opts)); } finally { fs.openSync = real; } };
    const sum = () => [...reads.entries()].filter(([k]) => /model\.bim$|visual\.json$|page\.json$|reportExtensions\.json$/.test(k)).reduce((n, [, v]) => n + v, 0);
    let a = null, b = null, na = 0, nb = 0;
    try { a = await count({ againstModel: SG.model }); na = sum(); b = await count({ againstModel: SG.model, likeForLike: { year: 2026 } }); nb = sum(); } catch (e) { a = { error: String(e.message).slice(0, 200) }; }
    chk(() => b && b.impactCheck && b.likeForLike && b.likeForLike.compared === 4 && a.impactCheck && !a.likeForLike, () => `O1 likeForLike beside againstModel: both sections: ${J(b).slice(0, 300)}`);
    chk(() => na > 0 && nb === na, () => `O1b the model and the report's files read no more often with likeForLike than with againstModel alone (one reading): ${na} then ${nb}`); }

  // ---------- G: a calculation group ----------
  { const m = withGroup(gulfModel()), r = gulfReport(); r.files.push(visual('details', 'matrix-ti', 'pivotTable', { Rows: [colRef('Time Intel', 'Period')], Values: [msrRef('Revenue')] }));
    const a = L.likeForLike(m, r, { year: 2026 }), v = a.list && a.list.find((x) => x.visual === 'matrix-ti');
    chk(() => a.compared === 5 && v && J(v.comparisons.map((c) => c.measure).sort()) === J(['Time Intel[PM]', 'Time Intel[PY]']) && v.comparisons.every((c) => c.kind === 'calculation item' && c.base === null && c.likeForLike === null),
      () => `G1 a matrix by the group's column: its PY and PM items listed, as calculation items, no base, no Ramadan partner; 5 visuals: ${J(v)} ${a.compared}`);
    chk(() => J(a.measures.filter((x) => x.kind === 'calculation item').map((x) => [x.measure, x.visuals])) === J([['Time Intel[PY]', 1], ['Time Intel[PM]', 1]]) && !a.measures.some((x) => /Current/.test(x.measure)) && J(a.lacking) === J(['[Cost Last Ramadan]', '[Units Last Ramadan]']),
      () => `G2 the measures list holds the two items (Current is not a comparison); lacking unchanged: ${J(a.measures.map((x) => [x.measure, x.visuals]))}`);
    chk(() => !/a calculation group's items/.test(a.notProved) && /calculation group/.test(a.notProved), () => `G2b notProved no longer says the items are not seen: ${a.notProved}`); }
  { const m = withGroup(gulfModel()), r = gulfReport(); r.files.find((f) => /details\/page\.json$/.test(f.path)).json.filterConfig.filters.push({ name: 'ti', field: colRef('Time Intel', 'Period').field, type: 'Categorical' });
    const a = L.likeForLike(m, r, { year: 2026 }), det = (a.list || []).filter((x) => x.page === 'details').map((x) => x.visual).sort();
    chk(() => a.compared === 10 && det.length === 8 && (a.list || []).filter((x) => x.page === 'overview').length === 2, () => `G3 a page filter on the group's column: the 8 visuals of that page listed, the overview's 2 as before (10): ${a.compared} ${J(det)}`); }
  { const m = withGroup(gulfModel()), a = L.likeForLike(m, gulfReport(), { year: 2026 });
    chk(() => a.compared === 4 && a.measures.filter((x) => x.kind === 'calculation item').every((x) => x.visuals === 0), () => `G4 a group no visual uses: no visual added, its items counted on 0: ${a.compared}`); }
  { const P2 = project('cg', withGroup(gulfModel()), (() => { const r = gulfReport(); r.files.push(visual('details', 'matrix-ti', 'pivotTable', { Rows: [colRef('Time Intel', 'Period')], Values: [msrRef('Revenue')] })); return r; })());
    const r = await call({ path: P2.report, checks: ['schemas'], likeForLike: { year: 2026 } }), x = lf(r);
    chk(() => x && x.compared === 5 && x.list.some((v) => v.visual === 'matrix-ti'), () => `G5 the same through the server, the group read from model.bim: ${cut(r)}`); }

  // ---------- R: one DAX call reader ----------
  { const C = require('../assets/js/health-confirm.js'), lsrc = SRC('mcp/lib/like-for-like.mjs');
    chk(() => C.CF && typeof C.CF.lex === 'function' && typeof C.CF.calls === 'function' && typeof C.pleaseConfirm === 'function', () => 'R1 health-confirm.js exports CF (lex, calls) beside pleaseConfirm');
    chk(() => !/function callsOf|tokenizeDax/.test(lsrc) && /health-confirm\.js/.test(lsrc) && /CF\.calls/.test(lsrc), () => 'R2 like-for-like.mjs reads calls through CF (no callsOf, no second lexer)');
    const D = { "CALCULATE ( [Revenue], SAMEPERIODLASTYEAR ( 'Calendar'[Date] ) )": [['SAMEPERIODLASTYEAR', 12, 'Calendar[Date]', 'Revenue']], "dateadd('Calendar'[Date],-2,quarter)": [['DATEADD', 6, 'Calendar[Date]', null]],
      'CALCULATE ( [Units], PARALLELPERIOD ( Calendar[Date], -12, MONTH ) )': [['PARALLELPERIOD', 12, 'Calendar[Date]', 'Units']], "VAR _n = [Units] RETURN CALCULATE ( [Revenue], DATEADD ( 'Calendar'[Date], - _n, YEAR ) )": [['DATEADD', null, 'Calendar[Date]', 'Revenue']],
      'IF ( [Revenue] > 0, "SAMEPERIODLASTYEAR ( x )", "" ) // DATEADD ( Calendar[Date], -1, YEAR )': [], "CALCULATE ( [Revenue], DATEADD ( 'Calendar'[Date], +1, YEAR ) )": [['DATEADD', -12, 'Calendar[Date]', 'Revenue']] };
    const got = Object.fromEntries(Object.keys(D).map((d) => [d, (L.comparisonsIn ? L.comparisonsIn(d) : []).map((c) => [c.fn, c.back, c.dates, c.base])]));
    chk(() => J(got) === J(D), () => `R3 the comparisons on CF: the same as IX1's on its DAX texts: ${J(got)}`); }

  // ---------- N: a long name in lacking ----------
  { const long = 'Net Revenue After Returns And Discounts For All Gulf Stores Combined X', m = gulfModel(); measureOf(m, 'Units').name = long;
    m.model.tables.forEach((t) => (t.measures || []).forEach((x) => { x.expression = String(Array.isArray(x.expression) ? x.expression.join('\n') : x.expression).split('[Units]').join(`[${long}]`); }));
    const a = L.likeForLike(m, gulfReport());
    chk(() => long.length === 70 && a.lacking.includes(`[${long} Last Ramadan]`) && !a.lacking.some((x) => /…/.test(x)), () => `N1 a 70-character base: "<base> Last Ramadan" given whole in lacking: ${J(a.lacking)}`);
    const huge = 'R' + 'x'.repeat(249); measureOf(m, long).name = huge; m.model.tables.forEach((t) => (t.measures || []).forEach((x) => { x.expression = String(x.expression).split(`[${long}]`).join(`[${huge}]`); }));
    const b = L.likeForLike(m, gulfReport()), hit = b.lacking.find((x) => x.startsWith('[Rxxx'));
    chk(() => hit && hit.length <= 204 && /…\]$/.test(hit), () => `N2 past 200 characters: cut, and the cut marked: ${String(hit).slice(-40)} (${hit && hit.length})`); }

  // ---------- C: the caps ----------
  { const m = gulfModel(), r = gulfReport();
    for (let i = 0; i < 80; i++) { tableOf(m, '_Measures').measures.push({ name: `Base ${i}`, expression: 'SUM ( Sales[Amount] )' }, { name: `Cmp ${i}`, expression: `CALCULATE ( [Base ${i}], DATEADD ( 'Calendar'[Date], -${i + 1}, MONTH ) )` }); }
    r.files.push(visual('details', 'wide', 'tableEx', { Values: Array.from({ length: 80 }, (_, i) => msrRef(`Cmp ${i}`)) }));
    const a = L.likeForLike(m, r, { year: 2026 }), w = a.list.find((x) => x.visual === 'wide');
    chk(() => a.measures.length === L.LISTED_MAX && a.measuresNotListed === 86 - L.LISTED_MAX, () => `C1 86 comparison measures: 60 listed, the rest counted: ${a.measures.length} ${a.measuresNotListed}`);
    chk(() => w && w.comparisons.length === L.WHY_MAX && w.more === 80 - L.WHY_MAX, () => `C2 a visual with 80 comparisons: ${L.WHY_MAX} listed, the rest counted: ${w && w.comparisons.length} ${w && w.more}`);
    chk(() => a.calendar.length === L.CALENDAR_MAX && a.calendarNotListed > 0 && a.lacking.length <= L.LISTED_MAX, () => `C3 80 distances: ${L.CALENDAR_MAX} compared, the rest counted: ${a.calendar.length} ${a.calendarNotListed}`); }
  { const m = gulfModel(), r = gulfReport();
    for (let i = 0; i < 80; i++) { const b = `Base measure with a long name number ${i} for the cap test`; tableOf(m, '_Measures').measures.push({ name: b, expression: 'SUM ( Sales[Amount] )' }, { name: `LY ${i}`, expression: `CALCULATE ( [${b}], SAMEPERIODLASTYEAR ( 'Calendar'[Date] ) )` }); }
    const a = L.likeForLike(m, r);
    chk(() => a.lacking.length === L.LISTED_MAX && a.lackingNotListed === 82 - L.LISTED_MAX, () => `C3b 82 lacking: 60 listed, the rest counted: ${a.lacking.length} ${a.lackingNotListed}`); }
  { const r = gulfReport(); for (let i = 0; i < 400; i++) r.files.push(visual(i % 2 ? 'details' : 'overview', `many-${i}-with-a-longer-visual-name-for-the-size-test`, 'card', { Values: [msrRef('Growth %')] }));
    const P3 = project('big', gulfModel(), r), res = await call({ path: P3.report, checks: ['navigation'], likeForLike: { year: 2026, country: 'ksa' } }), x = lf(res);
    chk(() => x && x.compared === 404 && x.list.length <= L.LISTED_MAX && x.notListed === 404 - x.list.length && res.t.length < 40000 && !/"truncated":(true|\{)/.test(res.t) && !/This answer was cut/.test(res.t),
      () => `C4 404 visuals on a comparison: at most 60 listed, the rest counted, the answer under 40,000 and never truncated: ${x && x.compared} ${x && x.list.length} ${res.t.length} ${res.j && res.j.truncated}`); }

  // ---------- Q: refusals and the option's absence ----------
  { const bad = [{ year: 'x' }, { year: 2026, country: 'mars' }, { year: 2026, extra: 1 }, { year: 2026.5 }];
    const rs = []; for (const b of bad) rs.push(await call({ path: SG.report, likeForLike: b }));
    chk(() => rs.every((r) => r.err && !lf(r) && !/Unrecognized key 'likeForLike'/.test(r.t)), () => `Q1 a wrong year, an unknown country, an extra key, a fraction: refused by the registered schema: ${rs.map((r) => String(r.t).slice(0, 120)).join(' | ')}`); }
  { const r = await call({ path: SG.report, checks: ['schemas'] }); chk(() => r.j && !('likeForLike' in r.j), () => 'Q2 without likeForLike: no section'); }
  { const P4 = project('nomodel', gulfModel(), gulfReport(), { noModel: true }), r = await call({ path: P4.report, checks: ['schemas'], likeForLike: { year: 2026 } });
    chk(() => r.err && /likeForLike/.test(r.t) && /model folder/.test(r.t), () => `Q3 a report that names no model folder: refused, the option named: ${cut(r)}`); }
  { const r = await call({ path: SG.report, lens: 'arabic', likeForLike: { year: 2026 } }); chk(() => r.err && /likeForLike/.test(r.t) && /Arabic lens/.test(r.t), () => `Q4 likeForLike with the Arabic lens: refused, said why: ${cut(r)}`); }

  // ---------- S: no value ----------
  { const m = gulfModel(), r = gulfReport(); measureOf(m, 'Revenue LY').expression = `CALCULATE ( [Revenue], SAMEPERIODLASTYEAR ( 'Calendar'[Date] ), Store[City] = "${CANARY}" )`;
    r.files.find((f) => /details\/page\.json$/.test(f.path)).json.filterConfig.filters[0].filter = { Version: 2, From: [{ Name: 'p', Entity: 'Product', Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 'p' } }, Property: 'Brand' } }], Values: [[{ Literal: { Value: `'${CANARY}'` } }]] } } }] };
    const P5 = project('canary', m, r), res = await call({ path: P5.report, checks: ['schemas'], likeForLike: { year: 2026, country: 'uae' } });
    chk(() => lf(res) && lf(res).compared === 4 && answers.every((t) => !String(t).includes(CANARY)), () => `S1 a literal planted in a comparison's DAX and in a page filter is in no answer: ${cut(res)}`); }

  // ---------- D: the words ----------
  { const tools = SRC('mcp/TOOLS.md'), priv = SRC('mcp/PRIVACY.md'), log = SRC('mcp/CHANGELOG.md'), un = log.slice(log.indexOf('## [Unreleased]'), log.indexOf('\n## [', log.indexOf('## [Unreleased]') + 5));
    chk(() => /likeForLike/.test(tools) && /like for like/i.test(tools) && /Ramadan/.test(tools), () => 'D1 TOOLS.md says likeForLike, like for like and Ramadan');
    chk(() => priv.split('\n').some((l) => /likeForLike/.test(l) && /name/i.test(l) && /value/i.test(l)), () => 'D2 PRIVACY.md has a row for likeForLike: names, never values');
    chk(() => /like for like/i.test(un) && /Ramadan/.test(un) && !/\b(first|only|official)\b/i.test(un.split('\n').filter((l) => /like for like/i.test(l)).join(' ')), () => 'D3 CHANGELOG [Unreleased]: one plain line, never "first", "only" or "official"'); }
} finally {
  await s.close();
}

if (problems.length) { console.log(`FAIL script=mcp/test-0.3.3-ix2.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 600))); console.log(`FAIL  ix2  ${problems.length} of ${checks} checks failed`); process.exit(1); }
console.log(`PASS  ix2  ${checks} checks`);
