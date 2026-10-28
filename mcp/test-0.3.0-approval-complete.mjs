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
} finally {
  await w.close();
  try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* a temp folder */ }
}

if (problems.length) { console.log(`FAIL  approval-complete  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  approval-complete  ${checks} checks`);
