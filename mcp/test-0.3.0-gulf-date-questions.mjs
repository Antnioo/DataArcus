// 0.3.0 J17 (B-170, the owner, 20 Oct: "continue the held jobs"; written red first): Gulf business dates and seasonal
// scope are asked, never guessed. A Gulf analyst can mix order and shipping dates, compare incompatible grains, or
// filter every Ramadan when they mean one: a guessed "Ramadan performance" page becomes a neutral question.
//   GD-1  the structural date candidates, their relationships and active flags; ambiguity marked; active is not intent
//   GD-2  the person picks the inactive role and no plan measure serves it: blocked with why; a USERELATIONSHIP measure
//         of the model serves it
//   GD-3  a Ramadan filter without a scope: asks it; a year comes only from the person; the filter wiring
//   GD-4  no Hijri columns: asks, offers add_gulf_calendar with the person's country and years (weekends differ)
//   GD-5  calendar fields by declared (the generator's own calendar) or confirmed role; names alone stay candidates
//   GD-6  estimated versus announced dates keep a visible status (plan and approval page)
//   GD-7  one question at a time, English and Arabic
//   GD-8  answers remembered per model; dropped when a relationship or column changes (server and engine)
//   GD-9  nothing edits a relationship, nothing written holds USERELATIONSHIP, no seasonal uplift claim
//   GD-10 Microsoft's validator 0 errors and check_report 0 "can break" on the reports written (EN, AR)
// Fixtures: small hand-made models (made up).
//   node test-0.3.0-gulf-date-questions.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const req0 = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const short = (x) => (x && x.err ? String(x.t).slice(0, 500) : JSON.stringify(x && x.j).slice(0, 500));
const Memory = req0('../assets/js/confirm-memory.js'), Cal = req0('../assets/js/calendar-generator.js'), Gulf = req0('../assets/js/gulf-health.js');
const ARABIC = /[؀-ۿ]/;

// ---- the fixtures (made up) ----
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-j17-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, extra) => Object.assign({ name, dataType, sourceColumn: name }, extra || {});
const bim = (dir) => path.join(ROOT, dir, 'M.SemanticModel/model.bim');
const model = (dir, tables, rels) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(bim(dir), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: rels || [] } }, null, 1)); };
const SHIP_M = 'Sales by Ship Date';
const sales = (cal) => ({ name: 'Sales', partitions: mp('Sales'), columns: [col('Order Date', 'dateTime'), col('Ship Date', 'dateTime'), col('Amount', 'double'), col('Region', 'string')],
  measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' },
    { name: SHIP_M, expression: `CALCULATE ( [Total Sales], USERELATIONSHIP ( Sales[Ship Date], '${cal}'[Date] ) )`, formatString: '#,0' }] });
const calendar = (hijri) => ({ name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Year', 'int64'), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64')]
  .concat(hijri ? [col('Hijri Year', 'int64'), col('Hijri Month Name', 'string', { sortByColumn: 'Hijri Month Number' }), col('Hijri Month Number', 'int64'), col('Is Ramadan', 'boolean'), col('Ramadan Day', 'int64')] : []) });
const rels = (cal, shipActive) => [{ name: 'r-order', fromTable: 'Sales', fromColumn: 'Order Date', toTable: cal, toColumn: 'Date', ...(shipActive ? { isActive: false } : {}) },
  { name: 'r-ship', fromTable: 'Sales', fromColumn: 'Ship Date', toTable: cal, toColumn: 'Date', ...(shipActive ? {} : { isActive: false }) }];
['gd', 'gds', 'gd2', 'gdm', 'ar'].forEach((d) => model(d, [sales('Calendar'), calendar(true)], rels('Calendar')));
model('nohijri', [sales('Calendar'), calendar(false)], rels('Calendar'));
// the Calendar Generator's own table (declared columns), as add_gulf_calendar writes it
const built = Cal.build(Object.assign({}, Cal.DEFAULTS, { name: 'Gulf Calendar', start: '2024-01-01', end: '2028-12-31', weekend: 'uae', hijri: true, fiscal: true, relative: true, observed: true, arabicNames: true }));
const TYPES = { Date: 'dateTime', Year: 'int64', 'Hijri Year': 'int64', 'Is Ramadan': 'boolean', 'Ramadan Day': 'int64', 'Is Estimated Date': 'boolean' };
model('gen', [sales('Gulf Calendar'), { name: 'Gulf Calendar', partitions: [{ name: 'Gulf Calendar', mode: 'import', source: { type: 'calculated', expression: built.dax.split('\n').slice(1).join('\n') } }],
  columns: built.columns.map((n) => Object.assign({ name: n, sourceColumn: n }, TYPES[n] ? { dataType: TYPES[n] } : {})) }], rels('Gulf Calendar'));

const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, {});
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });

const MP = (d) => `${d}/M.SemanticModel`;
const PF = (cal = 'Calendar') => ({ kpis: ['Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Total Sales]', timeAxis: `${cal}[Month Name]`, category: 'Sales[Region]' });
const RAMADAN = (cal = 'Calendar') => [{ field: `${cal}[Is Ramadan]`, values: [true] }];
const YEAR_F = (y, cal = 'Calendar') => ({ field: `${cal}[Hijri Year]`, values: [y] });
const plan = (dir, args, srv = s) => srv.call('plan_layout', Object.assign({ path: MP(dir), lang: 'en', layout: 'exec', name: 'Dates' }, args));
const G = (p) => (p && p.j && p.j.gulfDates) || {};
const idOf = (p) => p && p.j && p.j.plan && p.j.plan.planId;
const probs = (p) => (p && p.j && p.j.planProblems) || [];
const cand = (p, f) => (G(p).candidates || []).find((c) => c.field === f);
const YEARISH = /\b1[34]\d\d\b|\b20\d\d\b/;

try {
  // ---------- GD-1: the candidates, the ambiguity, active is not intent ----------
  {
    const p = await plan('gd', { planFields: PF() }), g = G(p);
    chk(() => cand(p, 'Sales[Order Date]') && cand(p, 'Sales[Order Date]').active === true && /Calendar\[Date\]/.test(cand(p, 'Sales[Order Date]').relationship)
      && cand(p, 'Sales[Ship Date]') && cand(p, 'Sales[Ship Date]').active === false, () => `GD-1a. both date columns listed with their relationship and its active flag: ${short(p)}`);
    chk(() => g.ambiguous === true && g.using && g.using.field === 'Sales[Order Date]' && g.using.confirmed === false && /active relationship/i.test(g.using.why) && /not.*(intent|what the person means|business)/i.test(g.using.why),
      () => `GD-1b. ambiguity marked; the active relationship is what the model follows, not called the business date: ${JSON.stringify(g.using)}`);
    chk(() => g.askNext && g.askNext.id === 'dateRole' && g.askNext.en && ARABIC.test(g.askNext.ar) && g.askNext.options.includes('Sales[Order Date]') && g.askNext.options.includes('Sales[Ship Date]'),
      () => `GD-1c. it asks which date (EN and AR, both candidates as options): ${JSON.stringify(g.askNext)}`);
    chk(() => idOf(p), () => `GD-1d. a plan that is not seasonal keeps its plan id while the date is asked (it says which date it follows): ${short(p)}`);
    const one = await plan('gd', { planFields: { kpis: ['Calendar[Year]'] }, fields: ['Calendar[Year]'] });
    chk(() => !one.err, () => `GD-1e. set-up: a plan with no fact table answers: ${short(one)}`);
  }

  // ---------- GD-2: the inactive role, served or blocked ----------
  {
    const p = await plan('gd', { planFields: PF(), gulfDates: { dateRole: 'Sales[Ship Date]' } }), pr = probs(p).join(' | ');
    chk(() => !idOf(p) && /Sales\[Ship Date\]/.test(pr) && /inactive/i.test(pr) && /no measure|not served|serves? it/i.test(pr) && new RegExp(SHIP_M).test(pr),
      () => `GD-2a. the inactive role with no plan measure that uses it: no plan id, why, and the model's measure that serves it named: ${short(p)}`);
    chk(() => /never (activate|change|edit)s? (a|the) relationship/i.test(pr) && /USERELATIONSHIP/.test(pr), () => `GD-2b. it says no relationship is changed and no USERELATIONSHIP is written: ${pr.slice(0, 600)}`);
    chk(() => (G(p).blocked || []).length === 1 && G(p).using && G(p).using.field === 'Sales[Ship Date]' && G(p).using.confirmed === true, () => `GD-2c. the blocked recipe in gulfDates too: ${JSON.stringify(G(p)).slice(0, 500)}`);
    const q = await plan('gd', { planFields: Object.assign(PF(), { kpis: [`Sales[${SHIP_M}]`], measure: `Sales[${SHIP_M}]` }), gulfDates: { dateRole: 'Sales[Ship Date]' } });
    chk(() => idOf(q) && G(q).using && G(q).using.servedBy && G(q).using.servedBy.includes(`Sales[${SHIP_M}]`), () => `GD-2d. a plan measure that uses USERELATIONSHIP on it serves the role: plan id: ${short(q)}`);
    const n = await plan('gd', { planFields: PF(), gulfDates: { dateRole: 'Sales[Region]' } });
    chk(() => !idOf(n) && /Sales\[Region\]/.test(probs(n).join(' ')) && /not (a|one of the) date/i.test(probs(n).join(' ')), () => `GD-2e. a role that is not a date candidate is refused: ${short(n)}`);
    const o = await plan('gd', { planFields: PF(), gulfDates: { dateRole: 'Sales[Order Date]' } });
    chk(() => idOf(o) && G(o).using.confirmed === true && G(o).askNext == null, () => `GD-2f. the active role confirmed: plan id, nothing left to ask: ${short(o)}`);
    const ax = await plan('gd', { planFields: Object.assign(PF(), { timeAxis: 'Sales[Ship Date]' }), gulfDates: { dateRole: 'Sales[Ship Date]' } });
    chk(() => idOf(ax), () => `GD-2g. the role's own column on the axis needs no relationship: plan id: ${short(ax)}`);
  }

  // ---------- GD-3 and GD-7: a Ramadan page, one question at a time; the year only from the person ----------
  {
    const p0 = await plan('gds', { planFields: PF(), pageFilters: RAMADAN() }), g0 = G(p0);
    chk(() => idOf(p0) && /before showing this plan/.test(g0.sayFirst || '') && g0.seasonal && g0.askNext && g0.askNext.id === 'dateRole' && g0.remaining >= 3 && (g0.pleaseConfirm || []).every((q) => q.en && ARABIC.test(q.ar)),
      () => `GD-7a. a seasonal plan with open questions: asked first (sayFirst; the plan id kept, Decision needed); one question asked first (the date), the rest listed in EN and AR: ${JSON.stringify(g0).slice(0, 600)}`);
    const p1 = await plan('gds', { planFields: PF(), pageFilters: RAMADAN(), gulfDates: { dateRole: 'Sales[Order Date]' } }), g1 = G(p1);
    chk(() => g1.askNext && g1.askNext.id === 'grain' && g1.remaining === g0.remaining - 1 && ['gregorian', 'hijri', 'seasonDay'].every((o) => g1.askNext.options.includes(o)),
      () => `GD-7b. once answered it moves on: the grain next, one fewer left: ${JSON.stringify(g1.askNext)} ${g1.remaining} vs ${g0.remaining}`);
    const p2 = await plan('gds', { planFields: PF(), pageFilters: RAMADAN(), gulfDates: { dateRole: 'Sales[Order Date]', grain: 'gregorian' } }), g2 = G(p2);
    chk(() => g2.askNext && g2.askNext.id === 'scope' && /one Ramadan/i.test(g2.askNext.en) && /every Ramadan/i.test(g2.askNext.en) && ARABIC.test(g2.askNext.ar) && /scope/.test(g2.sayFirst || ''),
      () => `GD-3a. a Ramadan flag without a year: asks the scope first: ${short(p2)}`);
    chk(() => g2.askNext && !YEARISH.test(JSON.stringify(g2.askNext)), () => `GD-3b. the scope question proposes no year: ${JSON.stringify(g2.askNext)}`);
    const p3 = await plan('gds', { planFields: PF(), pageFilters: RAMADAN(), gulfDates: { dateRole: 'Sales[Order Date]', grain: 'gregorian', scope: 'year' } }), g3 = G(p3);
    chk(() => g3.askNext && g3.askNext.id === 'year' && !YEARISH.test(JSON.stringify(g3)), () => `GD-3c. "this year only" without the year: asks it, no year guessed anywhere: ${JSON.stringify(g3).slice(0, 600)}`);
    const p4 = await plan('gds', { planFields: PF(), pageFilters: RAMADAN().concat([YEAR_F(1446)]), gulfDates: { dateRole: 'Sales[Order Date]', grain: 'gregorian', scope: 'all' } });
    chk(() => !idOf(p4) && probs(p4).some((x) => /every Ramadan|all/i.test(x) && /Hijri Year/.test(x)), () => `GD-3d. "all Ramadans" with a Hijri-year filter is a conflict: no plan id: ${short(p4)}`);
    const p5 = await plan('gds', { planFields: PF(), pageFilters: RAMADAN(), gulfDates: { dateRole: 'Sales[Order Date]', grain: 'gregorian', scope: 'year', year: 1446 } }), g5 = G(p5);
    chk(() => g5.askNext && g5.askNext.id === 'hijriYearColumn' && g5.askNext.options.includes('Calendar[Hijri Year]'), () => `GD-5a. a Hijri-year column found by its name only is a candidate: asked: ${JSON.stringify(g5.askNext)}`);
    chk(() => g5.calendar && g5.calendar.declared === false && g5.calendar.columns && g5.calendar.columns.hijriYear && g5.calendar.columns.hijriYear.by === 'name', () => `GD-5b. names alone stay candidates: ${JSON.stringify(g5.calendar)}`);
    const A6 = { dateRole: 'Sales[Order Date]', grain: 'gregorian', scope: 'year', year: 1446, hijriYearColumn: 'Calendar[Hijri Year]' };
    const p6 = await plan('gds', { planFields: PF(), pageFilters: RAMADAN(), gulfDates: A6 });
    chk(() => !idOf(p6) && probs(p6).some((x) => x.includes('"Calendar[Hijri Year]"') && x.includes('1446')), () => `GD-3e. the year confirmed but not on the page: the exact filter to add, no plan id: ${short(p6)}`);
    const p7 = await plan('gds', { planFields: PF(), pageFilters: RAMADAN().concat([YEAR_F(1446)]), gulfDates: A6 }), g7 = G(p7);
    chk(() => idOf(p7) && g7.askNext == null && g7.remaining === 0 && g7.answers && g7.answers.scope === 'year' && g7.answers.year === 1446, () => `GD-3f. every question answered and the filter wired: plan id: ${short(p7)}`);
    const p8 = await plan('gds', { planFields: PF(), pageFilters: RAMADAN().concat([YEAR_F(1445)]), gulfDates: A6 });
    chk(() => !idOf(p8) && probs(p8).some((x) => /1445/.test(x) && /1446/.test(x)), () => `GD-3g. a Hijri-year filter that is not the person's year: refused: ${short(p8)}`);
    const h = await plan('gds', { planFields: PF(), pageFilters: RAMADAN(), gulfDates: { dateRole: 'Sales[Order Date]', grain: 'hijri', scope: 'all' } });
    chk(() => !idOf(h) && probs(h).some((x) => /Hijri Month Name/.test(x) && /timeAxis/.test(x)), () => `GD-3h. a Hijri grain with a Gregorian axis is incompatible: the Hijri month column to use: ${short(h)}`);
    const h2 = await plan('gds', { planFields: Object.assign(PF(), { timeAxis: 'Calendar[Hijri Month Name]' }), pageFilters: RAMADAN(), gulfDates: { dateRole: 'Sales[Order Date]', grain: 'hijri', scope: 'all' } }), gh = G(h2);
    chk(() => idOf(h2) && gh.grain && gh.grain.axis === 'Calendar[Hijri Month Name]' && gh.grain.sortedBy === 'Calendar[Hijri Month Number]', () => `GD-3i. the Hijri axis sorted by its number (sort-by metadata): ${JSON.stringify(gh.grain)} ${short(h2)}`);
    chk(() => /not (checked|known).*(complete|comparable)|(complete|comparable).*not (checked|known)/i.test(JSON.stringify(gh)), () => `GD-3j. every Ramadan together: the plan says the seasons are not checked to be complete or comparable: ${JSON.stringify(gh).slice(0, 500)}`);
    const d = await plan('gds', { planFields: Object.assign(PF(), { timeAxis: 'Calendar[Month Name]' }), pageFilters: RAMADAN(), gulfDates: { dateRole: 'Sales[Order Date]', grain: 'seasonDay', scope: 'all' } });
    chk(() => !idOf(d) && probs(d).some((x) => /Ramadan Day/.test(x)), () => `GD-3k. a season-day grain needs the Ramadan Day axis: ${short(d)}`);
  }

  // ---------- GD-4: no Hijri columns: the calendar script, with the person's country and years ----------
  {
    const p = await plan('nohijri', { planFields: PF(), gulfDates: { dateRole: 'Sales[Order Date]', grain: 'hijri' } }), o = G(p).offer;
    chk(() => !idOf(p) && o && o.tool === 'add_gulf_calendar' && ['country', 'firstYear', 'lastYear'].every((k) => (o.askTheUser || []).includes(k)) && !(o.inputs || {}).country && !(o.inputs || {}).firstYear,
      () => `GD-4a. no Hijri columns: the calendar script offered, the country and years asked, none guessed: ${short(p)}`);
    const k = await plan('nohijri', { planFields: PF(), gulfDates: { dateRole: 'Sales[Order Date]', grain: 'hijri', country: 'ksa', firstYear: 2024, lastYear: 2026 } }), ok = G(k).offer || {};
    const u = await plan('nohijri', { planFields: PF(), gulfDates: { dateRole: 'Sales[Order Date]', grain: 'hijri', country: 'uae', firstYear: 2024, lastYear: 2026 } }), ou = G(u).offer || {};
    chk(() => ok.inputs && ok.inputs.country === 'ksa' && ok.inputs.firstYear === 2024 && ok.inputs.lastYear === 2026 && !(ok.askTheUser || []).length, () => `GD-4b. the person's country and years carried into the offer: ${JSON.stringify(ok)}`);
    chk(() => ok.weekend === Gulf.COUNTRIES.ksa.weekendOption && ou.weekend === Gulf.COUNTRIES.uae.weekendOption && ok.weekend !== ou.weekend, () => `GD-4c. weekends are not treated as equal: ${ok.weekend} vs ${ou.weekend}`);
    chk(() => /Sharjah/.test(ou.notModelled || '') && /Friday half/i.test(ou.notModelled || ''), () => `GD-4d. what the generator has no option for is said (Sharjah, the Friday half day): ${ou.notModelled}`);
  }

  // ---------- GD-5 and GD-6: the generator's declared calendar; announced versus estimated ----------
  {
    const A = (y, extra) => Object.assign({ dateRole: 'Sales[Order Date]', grain: 'gregorian', scope: 'year', year: y }, extra || {});
    const p = await plan('gen', { planFields: PF('Gulf Calendar'), pageFilters: RAMADAN('Gulf Calendar').concat([YEAR_F(1446, 'Gulf Calendar')]), gulfDates: A(1446) }), g = G(p);
    chk(() => idOf(p) && g.calendar && g.calendar.declared === true && g.calendar.columns.hijriYear && g.calendar.columns.hijriYear.by === 'declared' && !(g.pleaseConfirm || []).some((q) => q.id === 'hijriYearColumn'),
      () => `GD-5c. the generator's own calendar is declared: no column question, plan id: ${short(p)}`);
    chk(() => g.status && g.status.dates === 'announced' && /announced/i.test(g.status.en) && ARABIC.test(g.status.ar), () => `GD-6a. 1446: announced dates (the UAE's): ${JSON.stringify(g.status)}`);
    const e = await plan('gen', { planFields: PF('Gulf Calendar'), pageFilters: RAMADAN('Gulf Calendar').concat([YEAR_F(1448, 'Gulf Calendar')]), gulfDates: A(1448) }), ge = G(e);
    chk(() => idOf(e) && ge.status && ge.status.dates === 'estimated' && /estimat/i.test(ge.status.en) && /Is Estimated Date/.test(ge.status.en), () => `GD-6b. 1448: estimated, said with the calendar's own column: ${JSON.stringify(ge.status)}`);
    const om = await plan('gen', { planFields: PF('Gulf Calendar'), pageFilters: RAMADAN('Gulf Calendar').concat([YEAR_F(1446, 'Gulf Calendar')]), gulfDates: A(1446, { country: 'omn' }) });
    chk(() => G(om).status && /Oman/.test(G(om).status.en) && /Umm al-Qura/.test(G(om).status.en), () => `GD-6c. another country than the UAE or Saudi Arabia: its dates may differ (Umm al-Qura): ${JSON.stringify(G(om).status)}`);
    const nd = await plan('gd', { planFields: PF(), pageFilters: RAMADAN().concat([YEAR_F(1446)]), gulfDates: A(1446, { hijriYearColumn: 'Calendar[Hijri Year]' }) });
    chk(() => G(nd).status && G(nd).status.dates === 'cantTell', () => `GD-6d. another calendar's Ramadan dates are in its data: can't tell: ${JSON.stringify(G(nd).status)}`);
    // the approval page shows the dates and the status
    const ap = await plan('gen', { planFields: PF('Gulf Calendar'), pageFilters: RAMADAN('Gulf Calendar').concat([YEAR_F(1448, 'Gulf Calendar')]), gulfDates: A(1448) }, w), pid = idOf(ap); let html = '';
    if (pid) { const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n); html = url ? await req(url, 'GET') : ''; if (url) await req(url, 'POST', 'decision=decline'); }
    const text = unesc(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
    chk(() => /Dates and seasonal scope/.test(text) && /Sales\[Order Date\]/.test(text) && /1448/.test(text) && /estimat/i.test(text), () => `GD-6e. the approval page shows the date, the scope and the estimated status: ${pid ? text.slice(0, 400) : short(ap)}`);
  }

  // ---------- GD-8: remembered per model, dropped when a relationship or column changes ----------
  {
    const A = { dateRole: 'Sales[Order Date]', grain: 'gregorian', scope: 'year', year: 1446, hijriYearColumn: 'Calendar[Hijri Year]' };
    await plan('gdm', { planFields: PF(), pageFilters: RAMADAN().concat([YEAR_F(1446)]), gulfDates: A });
    const r = await plan('gdm', { planFields: PF(), pageFilters: RAMADAN().concat([YEAR_F(1446)]) }), g = G(r);
    chk(() => idOf(r) && g.answers && g.answers.dateRole === 'Sales[Order Date]' && g.answers.year === 1446 && (g.earlier || []).includes('dateRole') && (g.earlier || []).includes('year') && g.askNext == null,
      () => `GD-8a. the same model in the session: the answers reused (earlier), nothing asked: ${short(r)}`);
    const o = await plan('gd2', { planFields: PF(), pageFilters: RAMADAN().concat([YEAR_F(1446)]) });
    chk(() => !(G(o).earlier || []).length && G(o).askNext && G(o).askNext.id === 'dateRole', () => `GD-8b. another model folder reuses nothing: ${short(o)}`);
    // the relationship changes: the ship date becomes the active one
    const j = JSON.parse(fs.readFileSync(bim('gdm'), 'utf8')); j.model.relationships = rels('Calendar', true); fs.writeFileSync(bim('gdm'), JSON.stringify(j, null, 1));
    const f = await plan('gdm', { planFields: PF(), pageFilters: RAMADAN().concat([YEAR_F(1446)]) }), gf = G(f);
    chk(() => !(gf.earlier || []).includes('dateRole') && gf.askNext && gf.askNext.id === 'dateRole' && (gf.earlier || []).includes('year'), () => `GD-8c. a changed relationship drops the date answer only: ${JSON.stringify(gf).slice(0, 500)}`);
    // the column changes: the Hijri year becomes text
    const j2 = JSON.parse(fs.readFileSync(bim('gdm'), 'utf8')); j2.model.tables.find((t) => t.name === 'Calendar').columns.find((c) => c.name === 'Hijri Year').dataType = 'string'; fs.writeFileSync(bim('gdm'), JSON.stringify(j2, null, 1));
    const c = await plan('gdm', { planFields: PF(), pageFilters: RAMADAN(), gulfDates: { dateRole: 'Sales[Order Date]' } }), gc = G(c);
    chk(() => !(gc.earlier || []).includes('year') && !(gc.earlier || []).includes('scope') && gc.askNext && gc.askNext.id !== 'dateRole', () => `GD-8d. a changed calendar column drops the seasonal answers: ${JSON.stringify(gc).slice(0, 500)}`);
    // the engine (confirm-memory.js, shared with the website)
    const raw = JSON.parse(fs.readFileSync(bim('gd'), 'utf8')).model, MK = 'a'.repeat(64);
    const ev = Memory.dateEvidence && Memory.dateEvidence(raw, 'dateRole', ['Sales[Order Date]', 'Sales[Ship Date]']);
    const rec = ev && Memory.dateRecord({ modelKey: MK, question: 'dateRole', evidence: ev, answer: Memory.dateField('Sales[Ship Date]'), at: '2026-10-20T00:00:00Z' });
    chk(() => rec && Memory.validDate(rec) && !JSON.stringify(rec).includes('Ship Date') && !JSON.stringify(rec).includes('Sales'), () => `GD-8e. a date record holds hashes and the answer (a field hashed), never a name: ${JSON.stringify(rec)}`);
    chk(() => Memory.applyDates([{ question: 'dateRole', evidence: ev }], [rec], MK).get('dateRole') === rec.answer, () => `GD-8f. the same model and evidence: reused`);
    chk(() => !Memory.applyDates([{ question: 'dateRole', evidence: ev }], [rec], 'b'.repeat(64)).size, () => `GD-8g. another model key: not reused`);
    const raw2 = JSON.parse(JSON.stringify(raw)); delete raw2.relationships[1].isActive; raw2.relationships[0].isActive = false;
    chk(() => Memory.dateEvidence(raw2, 'dateRole', ['Sales[Order Date]', 'Sales[Ship Date]']) !== ev && !Memory.applyDates([{ question: 'dateRole', evidence: Memory.dateEvidence(raw2, 'dateRole', ['Sales[Order Date]', 'Sales[Ship Date]']) }], [rec], MK).size,
      () => `GD-8h. a flipped active flag changes the evidence: not reused`);
    const raw3 = JSON.parse(JSON.stringify(raw)); raw3.tables[0].columns[1].dataType = 'string';
    chk(() => !Memory.applyDates([{ question: 'dateRole', evidence: Memory.dateEvidence(raw3, 'dateRole', ['Sales[Order Date]', 'Sales[Ship Date]']) }], [rec], MK).size, () => `GD-8i. a changed column type: not reused`);
  }

  // ---------- GD-9 and GD-10: the reports written (EN, AR); nothing edits a relationship; no uplift claim ----------
  {
    const walk = (d) => { const out = []; if (!fs.existsSync(d)) return out; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) out.push(...walk(f)); else out.push(f); } return out; };
    const write = async (dir, lang, name) => {
      const A = { dateRole: 'Sales[Order Date]', grain: 'gregorian', scope: 'year', year: 1446, hijriYearColumn: 'Calendar[Hijri Year]' };
      const args = { path: MP(dir), lang, layout: 'exec', name, planFields: PF(), pageFilters: RAMADAN().concat([YEAR_F(1446)]) };
      const before = fs.readFileSync(bim(dir));
      const p = await s.call('plan_layout', Object.assign({}, args, { gulfDates: A })), id = idOf(p);
      if (id) await s.call('approve_plan', { planId: id });
      const { planFields, ...rest } = args;
      const r = id ? await s.call('create_report', Object.assign({}, rest, { fields: planFields, planId: id, design: p.j.design })) : { err: true, t: 'no plan id: ' + short(p) };
      return { p, r, before, after: fs.readFileSync(bim(dir)), files: walk(path.join(ROOT, dir, name + '.Report')), pbip: `${dir}/${name}.pbip` };
    };
    const EN = await write('gd', 'en', 'Ramadan EN'), AR = await write('ar', 'ar', 'رمضان');
    for (const [tag, X] of [['EN', EN], ['AR', AR]]) {
      chk(() => X.r && !X.r.err && X.files.length > 5, () => `GD-9a ${tag}. the Ramadan report "this year only" is written: ${short(X.r)}`);
      chk(() => Buffer.compare(X.before, X.after) === 0, () => `GD-9b ${tag}. the model's file is byte-identical (no relationship edited or activated)`);
      chk(() => X.files.length && !X.files.some((f) => /USERELATIONSHIP/i.test(fs.readFileSync(f, 'utf8'))), () => `GD-9c ${tag}. no USERELATIONSHIP in anything written`);
      const pages = X.files.filter((f) => /page\.json$/.test(f) && !/tooltip/i.test(fs.readFileSync(f, 'utf8'))).map((f) => fs.readFileSync(f, 'utf8'));
      chk(() => pages.length && pages.every((t) => /Is Ramadan/.test(t) && /Hijri Year/.test(t) && /1446/.test(t)), () => `GD-9d ${tag}. every report page holds the Ramadan and the Hijri-year filters (the year the person gave)`);
      const c = X.r && !X.r.err ? await s.call('check_report', { path: X.pbip }) : null;
      chk(() => c && !c.err && c.j.validator && c.j.validator.ran && c.j.validator.errors === 0, () => `GD-10a ${tag}. Microsoft's validator: 0 errors: ${short(c)}`);
      chk(() => c && !c.err && c.j.impact && c.j.impact.kinds && (c.j.impact.kinds.canBreak || { count: 0 }).count === 0, () => `GD-10b ${tag}. check_report: 0 "can break": ${short(c)}`);
    }
    const g = JSON.stringify(G(EN.p)) + JSON.stringify(G(AR.p));
    const hit = g.match(/uplift|outperform|grew|growth|better than|boost|(^|[\s،(])(ال)?(ارتفاع|نمو|زيادة)([\s،.)]|$)/i);
    chk(() => g.length > 50 && !/uplift|outperform|grew|growth|better than|boost|(^|[\s،(])(ال)?(ارتفاع|نمو|زيادة)([\s،.)]|$)/i.test(g), () => `GD-9e. the seasonal block makes no uplift claim: ${hit && g.slice(Math.max(0, hit.index - 120), hit.index + 40)}`);
    chk(() => /never (claim|say)/i.test(G(EN.p).sayInPlan || ''), () => `GD-9f. the plan is told never to claim a seasonal result from metadata: ${G(EN.p).sayInPlan}`);
  }
} finally {
  await s.close(); await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  gulf-date-questions  ${problems.length} of ${checks} checks failed`); process.exit(1); }
console.log(`PASS  gulf-date-questions  ${checks} checks`);
