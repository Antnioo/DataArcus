import './test-env.mjs';
// 0.3.0 D6 (the laptop proof of 0.3.0-rc.2, Desktop 2.159): every approval page says exactly what its click writes, the
// Arabic twin's and the theme's too. Written red first. Made-up fixtures only (mcp/fixtures/twin-project and
// health-project, copied and changed here): no employer or client data.
//   A1 the twin's approval HTML lists every file the twin writes, grouped and counted, as the write puts them on disk
//   A2 the theme's approval HTML lists its file, shows its colours (swatches and hex) and the report they come from
//   A3 create_report's page with a low-contrast accent: the Data colours swatch is the written colour; the line names
//      the approved colour and states both contrasts (in process: #e6e6e6 -> #949494 on white, 1.25:1 and 3.03:1)
//   A4 a theme whose report's theme changed after the go: "the model or its report changed after you approved"
//   A5 an Arabic plan whose approved displayNames hold a fixed-list name: the sentence counts them, never "no field"
//   A6 approve_plan's "waiting" says a later click still counts and to call approve_plan again
//   A1-5 the written twin: Microsoft's validator 0 errors, check_report 0 "can break"
//   A7 hostile names on the new pages are escaped and shown as text
//   A9 (0.3.2 AP1, E1 round 5: the page named 3 slicers and one page; the click wrote 9 slicers, 3 reset buttons, a
//      second bar chart and tooltip pages) a first own report of a made-up service model, English and Arabic: the page
//      names every page the click writes (the tooltip pages too) and, page by page, every visual by its kind, counted,
//      the slicers by field, the buttons by where they go, the charts by their field (read back from the written
//      files here); no "Other visuals: chosen by DataArcus" with nothing listed; the changed kind names its page
//   A10 (0.3.2 PL1, E1 round 5 finding 6: option labels read as jargon) the options in plain words, English and Arabic:
//      no input key, no chart.look, no visual type key or theme key on the report or redesign page (in process)
//   A11 (TP1, D-1105-17: the preview also draws the tooltip pages) the Service model's two tooltip pages drawn after its
//      report pages, each at its own size and captioned as a tooltip page (English and Arabic); within the cap of 12 the
//      report's pages come first and the tooltip pages left out are counted (in process)
//   node test-0.3.0-approval-complete.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? x.t.slice(0, 500) : JSON.stringify(x && x.j).slice(0, 500));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => fs.writeFileSync(f, JSON.stringify(j, null, 2));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rels = (d) => tree(d).map((f) => path.relative(d, f).split(path.sep).join('/')).sort();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const said = (H, label, n) => new RegExp(`${label} \\(${n}\\)`).test(H);
const count = (list, re) => list.filter((r) => re.test(r)).length;

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-d6-')));
const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
['tw', 'th', 'th2'].forEach((d) => cp('fixtures/twin-project', d));
['hp', 'ar'].forEach((d) => cp('fixtures/health-project', d));
const TWIN = (d) => `${d}/Twin Sales.SemanticModel`, THEME = (d) => path.join(ROOT, d, 'Twin Sales.Report/StaticResources/RegisteredResources/twin-theme.json');
// hostile names (HTML, quotes, instruction-like text), shown on the approval pages as text only
const HOSTILE = '<script>alert(1)</script> "q" \'s <b>bold</b>';
{ const f = path.join(ROOT, 'tw/Twin Sales.Report/definition/pages/p2details/page.json'), j = rd(f); j.displayName = HOSTILE; wr(f, j); }
// (a report folder name that must be escaped, and is legal on Windows: & and ')
const ODD = "Orders & 'EN'";
{
  const from = path.join(ROOT, 'th2'), rn = (a, b) => fs.renameSync(path.join(from, a), path.join(from, b));
  rn('Twin Sales.Report', `${ODD}.Report`);
  const pb = path.join(from, 'Twin Sales.pbip'), j = rd(pb); j.artifacts = [{ report: { path: `${ODD}.Report` } }]; wr(path.join(from, `${ODD}.pbip`), j); fs.rmSync(pb);
}

const Approval = await import('./lib/approval-window.mjs');
const { E } = await import('./lib/design.mjs');
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
// the approval page of a plan, as the person's browser gets it; then (approve) the click on Approve
const pageOf = async (planId, approve) => {
  const n = links().length, first = await w.call('approve_plan', { planId }), url = await linkAt(n), html = url ? await req(url, 'GET') : '';
  if (approve && url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId }); }
  return { html, first };
};
const section = (H, from, n) => { const i = H.indexOf(from); return i < 0 ? '' : H.slice(i, i + (n || 1200)); };

try {
  // ---------- A1 + A6 + A7: the Arabic twin's page ----------
  {
    const p = await w.call('create_arabic_twin', { path: 'tw/Twin Sales.pbip' }), id = p.j && p.j.plan && p.j.plan.planId;
    chk(() => id, () => `A1 setup. the twin gets a plan id: ${short(p)}`);
    const { html, first } = id ? await pageOf(id, true) : { html: '', first: null }, H = unesc(html);
    // A6: the first approve_plan had no click within its wait: "waiting", and a later click still counts
    chk(() => first && first.j && first.j.status === 'waiting' && /still waiting for the click/i.test(first.j.sayFirst) && /a click later still counts/i.test(first.j.sayFirst) && /call approve_plan again/.test(first.j.sayFirst),
      () => `A6. the waiting answer says a later click still counts and to call approve_plan again: ${short(first)}`);
    const out = id ? await w.call('create_arabic_twin', { path: 'tw/Twin Sales.pbip', planId: id }) : { err: true, t: 'no plan' };
    chk(() => !out.err && out.j.written === true, () => `A1 setup. the twin is written after the click: ${short(out)}`);
    const before = rels(path.join(HERE, 'fixtures/twin-project')), now = rels(path.join(ROOT, 'tw')), written = now.filter((r) => !before.includes(r));
    const missing = written.filter((r) => !H.includes(r));
    chk(() => written.length > 20 && !missing.length, () => `A1-1. the twin's page names every file the twin writes (${written.length}): missing ${JSON.stringify(missing.slice(0, 8))}`);
    // (FX1, the laptop's part 3: the twin's page is wholly Arabic; changed on purpose from the English counts beside)
    chk(() => new RegExp(`جميع الملفات \\(${written.length}\\)`).test(H), () => `A1-2. the twin's page counts the files (${written.length}): ${section(H, 'الملفات التي ستُكتب', 500)}`);
    chk(() => said(H, 'المرئيات', count(written, /\/visual\.json$/)) && said(H, 'الصفحات', count(written, /\/page\.json$/)) && said(H, 'ملف المشروع', 1),
      () => `A1-3. grouped and counted (visuals ${count(written, /\/visual\.json$/)}, pages ${count(written, /\/page\.json$/)}, project file 1): ${section(H, 'الملفات التي ستُكتب', 800)}`);
    // (0.3.0 C1, changed on purpose: the twin's script is the full Arabic calendar set now, " - Arabic calendar.tmdl")
    const month = written.find((r) => /Arabic calendar.*\.tmdl$/.test(r));
    chk(() => month && said(H, 'سكربت أعمدة التقويم العربية', 1), () => `A1-4. the month script is its own group, named as what it is: ${month} ${section(H, 'الملفات التي ستُكتب', 800)}`);
    chk(() => html.length > 0 && !html.includes(HOSTILE) && !/<script>alert|<b>bold<\/b>/.test(html), () => 'A7-1. a hostile page name is escaped on the twin\'s page');
    // the twin this test writes: Microsoft's validator 0 errors and check_report 0 "can break"
    const c = await w.call('check_report', { path: 'tw/Twin Sales AR.pbip' }), j = c.j || {};
    chk(() => !c.err && j.validator && j.validator.ran && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0,
      () => `A1-5. the written twin: validator 0 errors, check_report 0 "can break": ${c.err ? c.t.slice(0, 300) : JSON.stringify({ v: j.validator, canBreak: j.impact && j.impact.kinds.canBreak.count })}`);
  }

  // ---------- A2 + A7: the theme's page, from a model's report ----------
  let themeId = null;
  {
    const p = await w.call('generate_theme', { path: TWIN('th'), name: 'Pinned Theme' }); themeId = p.j && p.j.plan && p.j.plan.planId;
    chk(() => themeId && p.j.fromReport && p.j.fromReport.report === 'Twin Sales', () => `A2 setup. a theme planned from the model's report: ${short(p)}`);
    const { html } = themeId ? await pageOf(themeId, true) : { html: '' }, H = unesc(html);
    const C = (p.j && p.j.colours) || {};
    const sw = (hex) => new RegExp(`background:${hex}"[^>]*></span>[^<]*${hex}`, 'i').test(html);
    chk(() => (C.data || []).length === 8 && C.data.every(sw), () => `A2-1. the theme's page shows its 8 data colours as swatches with their hex: ${section(H, 'Colours', 600)}`);
    chk(() => [C.page, C.visuals, C.text, C.accent].every((x) => x && sw(x)), () => `A2-2. the page, visuals, text and accent colours as swatches with their hex: ${JSON.stringify(C)}`);
    chk(() => /from the theme of report "Twin Sales"/.test(H), () => `A2-3. the report the colours come from is named: ${section(H, 'Colours', 600)}`);
    chk(() => said(H, 'Theme file', 1) && /1 files?:/.test(H), () => `A2-4. the theme file is listed, grouped and counted: ${section(H, 'Files that will be written', 500)}`);
    const out = themeId ? await w.call('generate_theme', { path: TWIN('th'), name: 'Pinned Theme', planId: themeId }) : { err: true, t: 'no plan' };
    chk(() => !out.err && out.j.file && H.includes(out.j.file), () => `A2-5. the file the page names is the file written: ${short(out)}`);
    // A7: a report whose name must be escaped (& and ')
    const p2 = await w.call('generate_theme', { path: TWIN('th2'), name: 'Odd Theme' }), id2 = p2.j && p2.j.plan && p2.j.plan.planId;
    const { html: h2 } = id2 ? await pageOf(id2, false) : { html: '' };
    chk(() => id2 && h2.includes(`from the theme of report &quot;${esc(ODD)}&quot;`) && !h2.includes(ODD), () => `A7-2. the source report's name is escaped on the theme's page: ${section(h2, 'from the theme', 200)}`);
  }

  // ---------- A4: the report's theme changed after the go: the refusal names both ----------
  {
    cp('fixtures/twin-project', 'th3');
    const p = await w.call('generate_theme', { path: TWIN('th3'), name: 'Changed Theme' }), id = p.j && p.j.plan && p.j.plan.planId;
    if (id) await pageOf(id, true);
    const t = rd(THEME('th3')); t.dataColors[0] = '#123456'; wr(THEME('th3'), t);
    const x = await w.call('generate_theme', { path: TWIN('th3'), name: 'Changed Theme', planId: id });
    chk(() => x.err && /^Nothing was written: the model or its report changed after you approved/.test(x.t), () => `A4. the refusal says the model or its report changed: ${short(x)}`);
  }

  // ---------- A3: create_report's page with a low-contrast accent ----------
  {
    const args = { path: 'hp', name: 'Light Accent', layout: 'exec', colors: { accent: '#F4B183' } };
    const pl = await w.call('plan_layout', args), id = pl.j && pl.j.plan && pl.j.plan.planId;
    const { html } = id ? await pageOf(id, false) : { html: '' }, H = unesc(html);
    const row = section(html, 'Data colours', 600), first = (/background:(#[0-9a-f]{6})/i.exec(row) || [])[1];
    const m = /approved colour (#[0-9a-f]{6}) -> written colour (#[0-9a-f]{6}): contrast ([\d.]+):1[^<]*the written colour's own contrast: ([\d.]+):1/i.exec(H);
    chk(() => m && first && first.toLowerCase() === m[2].toLowerCase() && first.toLowerCase() !== '#f4b183', () => `A3-1. the Data colours swatch shows the written colour first: ${first} (written ${m && m[2]}): ${row.slice(0, 300)}`);
    chk(() => m && m[1].toLowerCase() === '#f4b183' && Math.abs(+m[3] - 1.9) < 0.2 && +m[4] >= 3, () => `A3-2. the line names the approved colour and both contrasts (about 1.9:1, then >= 3:1): ${(H.match(/[^>]*written colour[^<]*/) || ['none'])[0]}`);
    // in process: the brief's numbers (#e6e6e6 -> #949494 on white)
    const S = Approval.summary('report', { pins: { create_report: { name: 'R', design: { data: ['#e6e6e6', '#2563eb'], layout: {} } } }, colours: { changed: [{ from: '#e6e6e6', to: '#949494', contrast: 1.25 }], card: '#ffffff' } });
    const look = (S.sections.find((x) => x.heading === 'Look and options') || { rows: [] }).rows, dc = look.find((r) => r[0] === 'Data colours'), line = look.find((r) => /made readable/.test(r[0]));
    chk(() => dc && dc[1].swatches[0][1] === '#949494' && dc[1].swatches[1][1] === '#2563eb', () => `A3-3. the swatches are the written colours: ${JSON.stringify(dc)}`);
    chk(() => line && /#e6e6e6/.test(line[1]) && /contrast 1\.25:1/.test(line[1]) && /the written colour's own contrast: 3\.03:1/.test(line[1]) && Math.abs(E.contrast('#949494', '#ffffff') - 3.03) < 0.01, () => `A3-4. the line states 1.25:1 for the approved and 3.03:1 for the written: ${line && line[1]}`);
  }

  // ---------- A5: an Arabic plan whose approved names hold a fixed-list name ----------
  {
    const a = { path: 'ar', name: 'AR', layout: 'ops', lang: 'ar' };
    const p1 = await w.call('plan_layout', a), dn = (p1.j && p1.j.arabicNames && p1.j.arabicNames.inThePlan) || {};
    chk(() => dn['Calendar[Year]'] === 'السنة', () => `A5 setup. the fixed list proposes «السنة» for Calendar[Year]: ${JSON.stringify(dn)}`);
    const p2 = await w.call('plan_layout', Object.assign({ displayNames: dn }, a)), say = (p2.j && p2.j.arabicNames && p2.j.arabicNames.sayInPlan) || '';
    chk(() => say && !/no field has/.test(say) && new RegExp(`${Object.keys(dn).length} fields will show under the Arabic names approved`).test(say), () => `A5. the sentence counts the approved Arabic names (${Object.keys(dn).length}): ${say.slice(0, 400)}`);
  }
  // ---------- A8: the Gulf calendar's page names the file its click writes (0.3.0 A1: a second, different calendar
  // was planned as "... - add Gulf calendar.tmdl" and written as "... - add Gulf calendar 2.tmdl") ----------
  {
    const cal = async (lang) => {
      const a = { path: 'hp', firstYear: 2024, lastYear: 2026, country: 'uae', lang, name: 'Gulf Calendar ' + lang.toUpperCase(), asOf: '2026-10-20' };
      const p = await w.call('add_gulf_calendar', a), id = p.j && p.j.plan && p.j.plan.planId;
      const H = id ? unesc((await pageOf(id, true)).html) : '', out = id ? await w.call('add_gulf_calendar', Object.assign({ planId: id }, a)) : { err: true, t: 'no plan: ' + short(p) };
      return { p, H, out, file: out.j && out.j.scriptFile ? path.basename(String(out.j.scriptFile)) : null };
    };
    for (const lang of ['en', 'ar']) {
      const c = await cal(lang);
      chk(() => !c.out.err && c.file && c.p.j.scriptAfterGo === c.file && c.H.includes(c.file) && fs.existsSync(path.join(ROOT, 'hp', c.file)),
        () => `A8 ${lang}. the plan and its approval page name the file the click writes: planned ${c.p.j && c.p.j.scriptAfterGo}, written ${c.file}: ${short(c.out)}`);
    }
  }
  // ---------- A9: every page, visual, slicer and button the click writes is named on the page (AP1) ----------
  {
    const col = (name, dataType, extra) => Object.assign({ name, dataType, sourceColumn: name, summarizeBy: 'none' }, extra || {});
    const part = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
    const SM = path.join(ROOT, 'svc', 'Service.SemanticModel'); fs.mkdirSync(SM, { recursive: true });
    wr(path.join(SM, 'model.bim'), { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
      { name: 'Work Orders', columns: [col('Order ID', 'int64'), col('Date Key', 'dateTime', { formatString: 'yyyy-mm-dd' }), col('Department', 'string'), col('Status', 'string'), col('Hours', 'double', { summarizeBy: 'sum' })],
        measures: [{ name: 'Work Order Count', expression: "COUNTROWS ( 'Work Orders' )", formatString: '#,0' }, { name: 'Total Hours', expression: "SUM ( 'Work Orders'[Hours] )", formatString: '#,0.0' }], partitions: part('wo') },
      { name: 'Dim Date', columns: [col('Date', 'dateTime', { formatString: 'yyyy-mm-dd' }), col('Year', 'int64'), col('Month', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64')], partitions: part('dd') }],
      relationships: [{ name: 'r1', fromTable: 'Work Orders', fromColumn: 'Date Key', toTable: 'Dim Date', toColumn: 'Date' }] } });
    wr(path.join(SM, 'definition.pbism'), { version: '4.0', settings: {} });
    const AR = { 'Work Orders[Total Hours]': 'إجمالي الساعات', 'Work Orders[Work Order Count]': 'عدد أوامر العمل', 'Work Orders[Department]': 'القسم', 'Work Orders[Status]': 'الحالة', 'Work Orders[Hours]': 'الساعات', 'Work Orders[Order ID]': 'رقم الأمر',
      'Work Orders[Date Key]': 'التاريخ', 'Dim Date[Date]': 'التاريخ', 'Dim Date[Year]': 'السنة', 'Dim Date[Month]': 'الشهر', 'Dim Date[Month Number]': 'رقم الشهر' };
    // the written report, read here from its files: each page's name, kind, visuals by type, slicers' fields, buttons
    const measuresOf = (v) => Object.values((v.visual.query || {}).queryState || {}).flatMap((r) => r.projections || []).map((p) => p.field && p.field.Measure).filter(Boolean);
    const readBack = (dir) => { const pd = path.join(dir, 'definition/pages'), order = rd(path.join(pd, 'pages.json')).pageOrder;
      return order.map((id, i) => { const pj = rd(path.join(pd, id, 'page.json')), vs = tree(path.join(pd, id, 'visuals')).filter((f) => /visual\.json$/.test(f)).map(rd), types = {}, slicers = [];
        const cards = []; let buttons = 0, messages = 0; vs.forEach((v) => { const t = v.visualGroup ? 'group' : v.visual.visualType;
          if (t === 'slicer') { const pr = ((((v.visual.query || {}).queryState || {}).Values || {}).projections || [])[0], c = pr && pr.field && pr.field.Column; slicers.push(c ? `${c.Expression.SourceRef.Entity}[${c.Property}]` : '?'); }
          else if (t === 'actionButton') buttons++;
          // (0.3.2 AP2, A-PF2-2, changed on purpose: each card by the model measures it shows; a card of report measures
          // only is a "no data" message box, counted on its own line, never as a card)
          else if (t === 'cardVisual' && measuresOf(v).length) { const own = measuresOf(v).filter((m) => !m.Expression.SourceRef.Schema).map((m) => m.Property); if (own.length) cards.push([...new Set(own)]); else messages++; }
          else types[t] = (types[t] || 0) + 1; });
        return { n: i + 1, name: pj.displayName, tooltip: pj.type === 'Tooltip', w: pj.width, h: pj.height, visuals: vs.length, types, slicers, buttons, cards, messages }; }); };
    const EN = { clusteredBarChart: ['bar chart', 'bar charts'], clusteredColumnChart: ['column chart', 'column charts'], lineChart: ['line chart', 'line charts'], cardVisual: ['card', 'cards'], tableEx: ['table', 'tables'], textbox: ['text box', 'text boxes'], shape: ['shape', 'shapes'], group: ['group', 'groups'] };
    const ARW = { clusteredBarChart: 'مخططات شريطية', clusteredColumnChart: 'مخططات عمودية', lineChart: 'مخططات خطية', cardVisual: 'بطاقات', tableEx: 'جداول', textbox: 'مربعات نص', shape: 'أشكال', group: 'مجموعات مرئيات' };
    const n1 = (n, w) => `${n} ${n === 1 ? w[0] : w[1]}`;
    for (const lang of ['en', 'ar']) {
      const a = Object.assign({ path: 'svc/Service.SemanticModel', name: `Service ${lang}`, lang, filters: 'top', planFields: { slicers: ['Dim Date[Year]', 'Work Orders[Department]', 'Work Orders[Status]'], category: 'Work Orders[Department]', category2: 'Work Orders[Status]' } }, lang === 'ar' ? { displayNames: AR } : {});
      const p = await w.call('plan_layout', a), id = p.j && p.j.plan && p.j.plan.planId;
      chk(() => id, () => `A9 ${lang} setup. the service model's plan gets a plan id: ${short(p)}`);
      if (!id) continue;
      const raw = unesc((await pageOf(id, true)).html), H = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const out = await w.call('create_report', { path: a.path, planId: id });
      chk(() => !out.err, () => `A9 ${lang} setup. the report is written after the click: ${short(out)}`);
      const pages = out.err ? [] : readBack(path.join(ROOT, 'svc', `Service ${lang}.Report`));
      chk(() => pages.length === 4 && pages.filter((x) => x.tooltip).length === 2 && pages.reduce((s0, x) => s0 + x.slicers.length, 0) === 6, () => `A9 ${lang} setup. written: 4 pages (2 tooltip pages), 6 slicers: ${JSON.stringify(pages)}`);
      const head = lang === 'ar' ? 'ما تحويه كل صفحة' : 'What each page holds', at = H.indexOf(head), S = at < 0 ? '' : H.slice(at);
      chk(() => at >= 0 && new RegExp(`${head} \\(${pages.length}\\)`).test(H), () => `A9-1 ${lang}. the page has "${head} (${pages.length})": ${H.slice(H.indexOf(lang === 'ar' ? 'الحقول' : 'Fields'), H.indexOf(lang === 'ar' ? 'الحقول' : 'Fields') + 400)}`);
      // each page's part: from its label to the next page's
      const partOf = (x) => { const lab = lang === 'ar' ? `الصفحة ${x.n}: «${x.name}»` : `Page ${x.n}: ${x.name}`, i = S.indexOf(lab), nx = pages[x.n] ? S.indexOf(lang === 'ar' ? `الصفحة ${x.n + 1}: «` : `Page ${x.n + 1}: `, i + 1) : -1; return i < 0 ? '' : S.slice(i, nx > i ? nx : i + 1500); };
      for (const x of pages) {
        const P = partOf(x), want = (lang === 'ar'
          ? [`المرئيات: ${x.visuals}`].concat(x.tooltip ? ['صفحة تلميح'] : [], x.slicers.length ? [`المقسمات: ${x.slicers.length} (`].concat(x.slicers.map((f) => `«${f}»`)) : [], x.buttons ? [`الأزرار: ${x.buttons}`] : [], Object.entries(x.types).map(([t, n]) => `${ARW[t] || t}: ${n}`), x.cards.length ? [`البطاقات: ${x.cards.length} (`].concat(x.cards.flat().map((m) => `«${m}»`)) : [], x.messages ? [`مربعات رسالة «لا توجد بيانات» : ${x.messages}`] : [])
          : [`${x.visuals} visuals`].concat(x.tooltip ? ['a tooltip page'] : [], x.slicers.length ? [`${n1(x.slicers.length, ['slicer', 'slicers'])}: `].concat(x.slicers) : [], x.buttons ? [n1(x.buttons, ['button', 'buttons'])] : [], Object.entries(x.types).map(([t, n]) => n1(n, EN[t] || [t, t])), x.cards.length ? [`${n1(x.cards.length, ['card', 'cards'])}: `].concat(x.cards.flat()) : [], x.messages ? [n1(x.messages, ['"no data" message box', '"no data" message boxes'])] : []));
        const missing = want.filter((t) => !P.includes(t));
        chk(() => P && !missing.length, () => `A9-2 ${lang}. page ${x.n} "${x.name}" is named with everything on it: missing ${JSON.stringify(missing)} in ${JSON.stringify(P.slice(0, 600))}`);
      }
      // (b) no heading or row that names nothing; (c) the kind written in place of another names its page
      chk(() => !/Other visuals chosen by DataArcus from the model(?!: every one is named below)/.test(H) && !/المرئيات الأخرى يختارها DataArcus من النموذج(?!: كلها مذكورة أدناه)/.test(H), () => `A9-3 ${lang}. "Other visuals: chosen by DataArcus" points to the list: ${H.slice(H.indexOf(lang === 'ar' ? 'المرئيات الأخرى' : 'Other visuals'), H.indexOf(lang === 'ar' ? 'المرئيات الأخرى' : 'Other visuals') + 200)}`);
      chk(() => (lang === 'ar' ? /في الصفحة 1 «ملخص تنفيذي»/.test(H.slice(H.indexOf('مكتوب بنوع آخر'))) : /on page 1 "Executive summary"/.test(H.slice(H.indexOf('Written as another kind')))), () => `A9-4 ${lang}. the chart written as another kind names its page: ${H.slice(H.indexOf(lang === 'ar' ? 'مكتوب بنوع آخر' : 'Written as another kind'), H.indexOf(lang === 'ar' ? 'مكتوب بنوع آخر' : 'Written as another kind') + 300)}`);
      // A11 (TP1, D-1105-17): the preview draws each tooltip page the click writes, after the report pages, at its own size
      const PV = raw.slice(raw.indexOf('class="card preview"')), figs = [...PV.matchAll(/<figure([^>]*)>(<svg[^>]*>)[\s\S]*?<figcaption[^>]*>([\s\S]*?)<\/figcaption><\/figure>/g)].map((m) => ({ attrs: m[1], svg: m[2], cap: m[3].replace(/<[^>]+>/g, '').trim() }));
      const tips = pages.filter((x) => x.tooltip), reps = pages.filter((x) => !x.tooltip), tf = figs.slice(reps.length);
      chk(() => tips.length === 2 && figs.length === reps.length + tips.length, () => `A11-1 ${lang}. one picture per page written, the ${tips.length} tooltip pages too: ${figs.length} pictures (${JSON.stringify(figs.map((f) => f.cap))})`);
      chk(() => figs.slice(0, reps.length).every((f, i) => f.cap.startsWith(lang === 'ar' ? `الصفحة ${i + 1}: «${reps[i].name}»` : `Page ${i + 1}: ${reps[i].name}`)), () => `A11-2 ${lang}. the report pages first, as before: ${JSON.stringify(figs.map((f) => f.cap))}`);
      chk(() => tips.every((x, i) => tf[i] && tf[i].cap.startsWith(lang === 'ar' ? `صفحة تلميح ${i + 1}: «${x.name}»` : `Tooltip page ${i + 1}: ${x.name}`)), () => `A11-3 ${lang}. then each tooltip page, captioned as one: ${JSON.stringify(tf.map((f) => f.cap))}`);
      chk(() => tips.every((x, i) => tf[i] && new RegExp(`viewBox="0 0 ${x.w} ${x.h}" width="${x.w}" height="${x.h}"`).test(tf[i].svg) && /class="tip"/.test(tf[i].attrs)), () => `A11-4 ${lang}. each tooltip page at its own size (${tips.map((x) => `${x.w} x ${x.h}`).join(', ')}), not stretched to the report page's width: ${JSON.stringify(tf.map((f) => f.attrs + f.svg))}`);
      chk(() => figs.slice(0, reps.length).every((f) => / width="800"/.test(f.svg) && !/class="tip"/.test(f.attrs)), () => `A11-5 ${lang}. the report pages drawn as before (800 wide): ${JSON.stringify(figs.slice(0, reps.length).map((f) => f.attrs + f.svg))}`);
    }
  }
} finally {
  await w.close();
  try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* a temp folder */ }
}

// ---------- A10: the options in plain words, no code word (0.3.2 PL1, E1 round 5 finding 6), in process ----------
{
  const Approval = await import('./lib/approval-window.mjs');
  const labels = (h) => [...h.matchAll(/<td class="k"[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]).filter((x) => !/<code/.test(x)).map((x) => unesc(x.replace(/<[^>]+>/g, '')).trim());
  const plan = { id: 'plan-pl1000000001', kind: 'report', writes: ['the report "Service Pages.Report"'] };
  const KEYS = ['pageFilters', 'text', 'subtitles', 'svgColumns', 'svgCards'];
  for (const lang of ['en', 'ar']) {
    const cr = { name: 'Service Pages', lang, design: { layout: {} }, pageFilters: [{ field: 'Work Orders[Status]', values: ['Open'] }], text: 'Open orders fell this month.',
      subtitles: { trend: 'Work orders by month' }, svgColumns: [{ label: 'Progress', design: { w: 80, h: 16, values: [], layers: [] } }], svgCards: [{ card: 1, design: { w: 40, h: 40, values: [], layers: [] } }] };
    const H = Approval.approvalHtml(plan, Approval.summary('report', { pins: { create_report: cr }, look: { look: 'glass', chosenBy: 'default' } })), L = labels(H);
    chk(() => !/chart\.look/.test(unesc(H)) && (lang === 'ar' ? /اطلب الشكل العادي/ : /ask for the plain look/).test(unesc(H)), () => `A10-1 ${lang}. the card look says how to get plain cards in words, never chart.look: ${unesc(H).slice(unesc(H).indexOf(lang === 'ar' ? 'شكل البطاقات' : 'Card look'), unesc(H).indexOf(lang === 'ar' ? 'شكل البطاقات' : 'Card look') + 400)}`);
    chk(() => KEYS.every((k) => !L.includes(k)), () => `A10-2 ${lang}. no option is named by its input key: ${JSON.stringify(L.filter((x) => KEYS.includes(x)))}`);
    const want = lang === 'ar' ? ['فلاتر الصفحات', 'الجملة في مربع النص', 'العناوين الفرعية للمخططات', 'صور صغيرة في صفوف الجدول', 'صور صغيرة بجانب بطاقات المؤشرات']
      : ['Page filters', 'Sentence in the text box', 'Chart subtitles', 'Small pictures in table rows', 'Small pictures beside KPI cards'];
    chk(() => want.every((w) => L.includes(w)), () => `A10-3 ${lang}. each such option in plain words: missing ${JSON.stringify(want.filter((w) => !L.includes(w)))} in ${JSON.stringify(L)}`);
  }
  const v = (visual, type, extra) => Object.assign({ visual, type, fields: ['Work Orders[Department]'], place: '40,90 300x140' }, extra || {});
  const shown = { original: 'Service', newReport: 'Service redesigned.Report', keptAsIs: { pages: 1 },
    text: { mode: 'common', set: [], boldItalic: 'kept', theme: 'not changed', removed: 0, untouched: [v('btnGo', 'actionButton', { page: 'Overview', why: 'a button: its text kept as it is' })] },
    theme: { file: 'service-theme.json', tokens: { dataColors: ['#0f766e', '#2563eb'], foreground: '#1f2937', background: '#ffffff', tableAccent: '#0f766e', good: '#059669', neutral: '#d97706', bad: '#dc2626' } },
    pages: [{ page: 'Overview', changes: [v('colDept', 'clusteredColumnChart', { from: { x: 40, y: 250, w: 600, h: 430 }, to: { x: 40, y: 246, w: 602, h: 430 } })],
      notChanged: [v('btnGo', 'actionButton', { why: 'a button: kept where it is' }), v('tblOrders', 'tableEx', { why: 'kept' }), v('nav', 'pageNavigator', { why: 'kept' }), v('slDept', 'slicer', { why: 'kept' }), v('note', 'textbox', { why: 'kept' }), v('gauge', 'custom acmeGauge0123456789ABCDEF', { why: 'a custom visual: copied as it is' })] }] };
  const R = labels(Approval.approvalHtml({ id: 'plan-pl1000000002', kind: 'redesign', writes: [] }, Approval.summary('redesign', { shown })));
  const TYPES = /\((actionButton|clusteredColumnChart|tableEx|pageNavigator|textbox|custom acmeGauge)\b/;
  chk(() => R.length && !R.some((x) => TYPES.test(x)), () => `A10-4. no redesign row names a visual by its type key: ${JSON.stringify(R.filter((x) => TYPES.test(x)))}`);
  const RW = ['Overview: btnGo (button', 'Overview: colDept (column chart of', 'Overview: tblOrders (table of', 'Overview: nav (page navigator of', 'Overview: slDept (slicer of', 'Overview: note (text box of', 'Overview: gauge (custom visual acmeGauge0123456789ABCDEF of'];
  chk(() => RW.every((w) => R.some((x) => x.startsWith(w))), () => `A10-5. each visual's kind in words: missing ${JSON.stringify(RW.filter((w) => !R.some((x) => x.startsWith(w))))} in ${JSON.stringify(R)}`);
  const TK = /: (dataColors|foreground|background|tableAccent|good|neutral|bad)$/;
  const TW = ['data colours', 'text colour', 'background colour', 'table accent colour', 'colour for good results', 'colour for neutral results', 'colour for bad results'].map((w) => `Theme service-theme.json: ${w}`);
  chk(() => !R.some((x) => TK.test(x)) && TW.every((w) => R.includes(w)), () => `A10-6. the theme's changes in words, never its keys: ${JSON.stringify(R.filter((x) => /^Theme /.test(x)))}`);
}

// ---------- A11 (TP1): the tooltip pages inside the preview's cap; the report's pages come first (in process) ----------
{
  const V = await import('./lib/approval-view.mjs'), MAX = V.PREVIEW_PAGES_MAX;
  const pg = (name, tooltip) => Object.assign({ name, w: tooltip ? 320 : 1280, h: tooltip ? 284 : 720, visuals: [{ type: 'cardVisual', x: 10, y: 10, w: 200, h: 100, title: 'Total' }] }, tooltip ? { tooltip: true } : {});
  const page = (nr, nt, lang) => V.approvalHtml({ id: 'plan-tp1000000001', kind: 'report', writes: ['the report "Cap.Report"'] }, { title: 'Report', kind: 'report', lang: lang || 'en', sections: [], files: null,
    previews: { lang: lang || 'en', pages: Array.from({ length: nr }, (_, i) => pg(`R${i + 1}`)).concat(Array.from({ length: nt }, (_, i) => pg(`T${i + 1}`, true))) } });
  const caps = (h) => [...h.matchAll(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/g)].map((m) => unesc(m[1].replace(/<[^>]+>/g, '')).trim());
  const a = page(MAX - 1, 3), ca = caps(a);
  chk(() => MAX === 12 && ca.length === MAX && ca.filter((c) => /^Tooltip page /.test(c)).length === 1 && /^Tooltip page 1: T1/.test(ca[MAX - 1]) && /2 more tooltip pages not drawn here/.test(unesc(a)), () => `A11-6. 11 report pages and 3 tooltip pages: the 11 and 1 tooltip page drawn, 2 counted: ${JSON.stringify(ca)} ${unesc(a).match(/<p class="note">[^<]*/g)}`);
  const b = page(MAX + 1, 2), cb = caps(b);
  chk(() => cb.length === MAX && cb.every((c) => /^Page /.test(c)) && /1 more pages not drawn here|1 more page not drawn here/.test(unesc(b)) && /2 more tooltip pages not drawn here/.test(unesc(b)), () => `A11-7. 13 report pages and 2 tooltip pages: 12 report pages drawn (they win the cap), 1 page and 2 tooltip pages counted: ${JSON.stringify(cb)} ${unesc(b).match(/<p class="note">[^<]*/g)}`);
  const c = page(2, 1, 'ar'), cc = caps(c);
  chk(() => cc.length === 3 && /^صفحة تلميح 1: «T1»/.test(cc[2]), () => `A11-8. the Arabic caption (approved, D-1108-07): ${JSON.stringify(cc)}`);
  const d = page(3, 0);
  chk(() => !/class="tip"|Tooltip page|tooltip pages? not drawn/.test(d), () => 'A11-9. a plan with no tooltip page: no tooltip picture and no tooltip line');
}

if (problems.length) { console.log(`FAIL  approval-complete  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  approval-complete  ${checks} checks`);
