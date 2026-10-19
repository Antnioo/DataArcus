// 0.3.0 D5 (the laptop's proof of 0.3.0-rc.2, Desktop 2.159, 19 Oct 2026; written red first): the approval window's
// preview must draw what Power BI Desktop draws. On two Arabic reports of the made-up large-synthetic model (focus
// "Web Orders") Desktop drew whole the titles the preview marked «مقطوع», had no "(2)" on page 2's Plan Group bar, and
// showed the three slicers' headers the preview left blank.
//   PM-1  every title the preview draws is the title of the report create_report writes, visual by visual (a literal
//         title, or the text a Top N title measure shows when every category shows); never a measure's name
//   PM-2  cut marks equal the writer's cut list (chart, KPI and slicer titles it shortened) plus check_report's
//         TABLE_HEADER_CUT cuts, page by page (0 on these reports)
//   PM-3  each slicer is drawn with its header (header.text, else the field's display name)
//   PM-4  controls on the engine: a title the writer shortened, or one the writer's titleFit can't fit, is cut; a table
//         column narrower than check_report's measure is cut, one wide enough is not, one with no set width is not
//         judged; labels that may slant are a note, not a flag; a slicer whose header is off draws no header
//   PM-5  the approval window draws the written report's pages: every box at a written visual's place
//   node test-0.3.0-preview-match.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const P = req('../assets/js/page-preview.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const httpReq = (url, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method: body ? 'POST' : 'GET', headers: body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {} }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', (e) => resolve('error: ' + e.message)); if (body) r.write(body); r.end();
});
const unq = (s) => String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
// the drawing: each visual's box, kind and texts; the flags and notes
const groups = (svg) => [...svg.matchAll(/<g class="v" data-i="(\d+)" data-kind="([a-z]+)"[^>]*>\s*<rect class="box" x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"[\s\S]*?<!--\/v-->/g)]
  .map((m) => ({ i: +m[1], kind: m[2], x: +m[3], y: +m[4], w: +m[5], h: +m[6], texts: [...m[0].matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((t) => unq(t[1])) }));
const flagsOf = (svg) => [...svg.matchAll(/<g class="flag" data-i="(\d+)" data-flag="([a-z]+)"/g)].map((m) => ({ i: +m[1], kind: m[2] }));
const lit = (p) => { const v = p && p.expr && p.expr.Literal && p.expr.Literal.Value; return typeof v === 'string' && /^'.*'$/s.test(v) ? v.slice(1, -1).replace(/''/g, "'") : null; };

// ---- what Desktop shows, read from the written files on its own (not through the preview) ----
function written(dir) {
  const files = []; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else files.push({ path: path.relative(dir, f).split(path.sep).join('/'), data: fs.readFileSync(f, 'utf8') }); }); rec(dir);
  const J = (p) => { const f = files.find((x) => x.path === p); return f ? JSON.parse(f.data) : null; };
  const ext = J('definition/reportExtensions.json') || { entities: [] }, measures = new Map();
  (ext.entities || []).forEach((e) => (e.measures || []).forEach((m) => measures.set(m.name, m.expression)));
  // a Top N title measure shows its plain title when every category shows: IF ( _s = _n, "<title>", ...)
  const shownOf = (name) => { const x = /IF \( _s = _n, "((?:[^"]|"")*)"/.exec(measures.get(name) || ''); return x ? x[1].replace(/""/g, '"') : null; };
  const order = (J('definition/pages/pages.json') || {}).pageOrder || [];
  return order.map((id) => ({ id, pj: J(`definition/pages/${id}/page.json`) })).filter((p) => p.pj && p.pj.type !== 'Tooltip' && p.pj.visibility !== 'HiddenInViewMode').map(({ id, pj }) => {
    const vs = files.filter((f) => f.path.startsWith(`definition/pages/${id}/visuals/`) && f.path.endsWith('/visual.json')).map((f) => JSON.parse(f.data));
    const byName = new Map(vs.map((j) => [j.name, j]));
    const at = (j) => { let x = j.position.x, y = j.position.y, g = j.parentGroupName, hid = !!j.isHidden; while (g && byName.has(g)) { const q = byName.get(g); x += q.position.x; y += q.position.y; hid = hid || !!q.isHidden; g = q.parentGroupName; } return { x, y, hid }; };
    const visuals = vs.filter((j) => j.visual && !j.visualGroup).map((j) => {
      const p = at(j), v = j.visual, type = v.visualType, tp = ((((v.visualContainerObjects || {}).title) || [])[0] || {}).properties || {};
      let title = null;
      const shown = tp.show && tp.show.expr && tp.show.expr.Literal && String(tp.show.expr.Literal.Value) === 'true';
      if (shown) title = lit(tp.text) != null ? lit(tp.text) : tp.text && tp.text.expr && tp.text.expr.Measure ? shownOf(tp.text.expr.Measure.Property) : null;
      let header = null;
      if (type === 'slicer') { const hp = ((((v.objects || {}).header) || [])[0] || {}).properties || {}, pr = ((((v.query || {}).queryState || {}).Values || {}).projections || [])[0] || {};
        header = hp.show && hp.show.expr && String(hp.show.expr.Literal.Value) === 'false' ? '' : lit(hp.text) != null ? lit(hp.text) : String(pr.displayName || pr.nativeQueryRef || ''); }
      return p.hid ? null : { type, x: p.x, y: p.y, w: j.position.width, h: j.position.height, title, header };
    }).filter(Boolean);
    return { id, name: pj.displayName, visuals };
  });
}

try {
  // ---------- PM-4: the engine's controls ----------
  {
    const one = (v) => ({ name: 'p', w: 1920, h: 1080, visuals: [v] });
    // a title the writer's titleFit can't fit on two lines is cut; one it wraps is not
    const long = 'Web Orders Total Score by a very long category name that never fits two lines of this narrow chart at all';
    chk(() => P.check(one({ type: 'lineChart', x: 10, y: 10, w: 300, h: 300, title: long, titleSize: 18, font: 'Segoe UI' })).some((f) => f.kind === 'cut'), () => 'PM-4a. a title titleFit cannot fit (two lines of a 300-wide chart) is cut');
    chk(() => !P.check(one({ type: 'lineChart', x: 10, y: 10, w: 500, h: 300, title: 'Web Orders Total Score (Month Short)', titleSize: 18, font: 'Segoe UI', titleWrap: true })).length, () => `PM-4b. a title titleFit wraps on two lines is not cut: ${JSON.stringify(P.check(one({ type: 'lineChart', x: 10, y: 10, w: 500, h: 300, title: 'Web Orders Total Score (Month Short)', titleSize: 18, font: 'Segoe UI', titleWrap: true })))}`);
    // a title the writer shortened (its text ends with "…", the alt text holds more), read from the files
    const vj = (title, alt, extra) => JSON.stringify(Object.assign({ name: 'v1', position: { x: 10, y: 10, z: 0, width: 400, height: 300 }, visual: { visualType: 'clusteredBarChart',
      visualContainerObjects: { title: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: `'${title}'` } } } } }], general: [{ properties: { altText: { expr: { Literal: { Value: `'${alt}'` } } } } }] } } }, extra || {}));
    const proj = (vis) => [{ path: 'definition/pages/pages.json', data: JSON.stringify({ pageOrder: ['p1'] }) }, { path: 'definition/pages/p1/page.json', data: JSON.stringify({ name: 'p1', displayName: 'P', width: 1920, height: 1080 }) }].concat(vis.map((d, k) => ({ path: `definition/pages/p1/visuals/v${k}/visual.json`, data: d })));
    const cutPage = P.fromFiles(proj([vj('إجمالي المبيعات حسب…‏', 'إجمالي المبيعات حسب المنطقة التجارية الرئيسية')]))[0];
    chk(() => cutPage && P.check(cutPage).some((f) => f.i === 0 && f.kind === 'cut'), () => `PM-4c. a title the writer shortened ("…") is cut: ${JSON.stringify(cutPage && P.check(cutPage))}`);
    const wholePage = P.fromFiles(proj([vj('إجمالي المبيعات حسب المنطقة', 'إجمالي المبيعات حسب المنطقة')]))[0];
    chk(() => wholePage && !P.check(wholePage).length, () => `PM-4d. a whole Arabic title is not cut: ${JSON.stringify(wholePage && P.check(wholePage))}`);
    // the table: check_report's own measure (report-rules.js headerNeed), per column with a set width
    const Rules = req('../assets/js/report-rules.js'), need = Rules.headerNeed('Web Orders Total Value', 15, 'Segoe UI', 1).needW;
    const tab = (cols) => one({ type: 'tableEx', x: 10, y: 10, w: 900, h: 300, title: 'T', titleSize: 18, columns: cols, headerSize: 15, headerFont: 'Segoe UI' });
    chk(() => P.check(tab([{ name: 'Web Orders Total Value', width: need - 20 }])).some((f) => f.kind === 'cut'), () => `PM-4e. a column narrower than check_report's measure (${need}) is cut`);
    chk(() => !P.check(tab([{ name: 'Web Orders Total Value', width: need }, { name: 'Web Orders Count', width: 300 }, { name: 'Web Orders Total Score', width: 300 }, { name: 'Plan Group', width: 300 }])).length, () => 'PM-4f. columns as wide as the measure are not cut, whatever their sum');
    chk(() => !P.check(tab([{ name: 'Web Orders Total Value' }, { name: 'Web Orders Count' }, { name: 'Web Orders Total Score' }, { name: 'Plan Group' }, { name: 'Coupon Region' }])).length, () => 'PM-4g. columns with no set width are not judged (as check_report)');
    // slanting labels: a note, never a cut
    const slant = one({ type: 'lineChart', x: 10, y: 10, w: 612, h: 395, title: 'x', category: 'Month Short', labelSize: 15 });
    chk(() => !P.check(slant).length && (P.notes(slant) || []).some((f) => f.kind === 'slant'), () => `PM-4h. labels that may slant are a note, not a flag: ${JSON.stringify(P.check(slant))} ${JSON.stringify(P.notes(slant))}`);
    chk(() => P.WORDS.ar.slant && P.WORDS.en.slant && texts0(P.render(slant, { lang: 'ar' })).includes(P.WORDS.ar.slant), () => 'PM-4h. the note is said in the preview\'s language');
    // a slicer: its header from the files, none when it is off
    const sj = (header, show) => JSON.stringify({ name: 's', position: { x: 10, y: 10, z: 0, width: 274, height: 76 }, visual: { visualType: 'slicer', query: { queryState: { Values: { projections: [{ field: { Column: { Expression: { SourceRef: { Entity: 'Plan' } }, Property: 'Plan Group' } }, queryRef: 'Plan.Plan Group', nativeQueryRef: 'Plan Group', displayName: 'مجموعة الخطة' }] } } },
      objects: { data: [{ properties: { mode: { expr: { Literal: { Value: "'Dropdown'" } } } } }], header: [{ properties: Object.assign({ show: { expr: { Literal: { Value: show ? 'true' : 'false' } } } }, header ? { text: { expr: { Literal: { Value: `'${header}'` } } } } : {}) }] },
      visualContainerObjects: { title: [{ properties: { show: { expr: { Literal: { Value: 'false' } } } } }] } } });
    const sp = P.fromFiles(proj([sj(null, true), sj('Short…', true), sj(null, false)]))[0], sv = sp ? groups(P.render(sp, { lang: 'ar' })) : [];
    chk(() => sv.length === 3 && sv[0].texts.includes('مجموعة الخطة') && sv[1].texts.includes('Short…') && !sv[2].texts.length, () => `PM-4i. a slicer draws its header (the field's display name, else header.text), none when off: ${JSON.stringify(sv.map((x) => x.texts))}`);
  }

  // ---------- the two reports through the MCP, as the laptop made them ----------
  const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-pm-'));
  fs.cpSync(path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
  const MP = 'large/Large Synthetic.SemanticModel', log = path.join(ROOT, 'links.txt');
  const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
  const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '300' });
  try {
    const cases = [{ id: 'T1a', layout: 'exec', names: false }, { id: 'T1b', layout: 'ops', names: true }];
    for (const c of cases) {
      const base = { path: MP, focus: 'Web Orders', lang: 'ar', layout: c.layout, name: 'D5 ' + c.id, secondPage: true };
      let pl = await s.call('plan_layout', base);
      if (c.names) { const an = (pl.j && pl.j.arabicNames) || {}; base.displayNames = Object.assign({}, an.inThePlan || {}, an.suggestedDisplayNames || {}); pl = await s.call('plan_layout', base); }
      const id = pl.j && pl.j.plan && pl.j.plan.planId;
      chk(() => /^plan-/.test(id), () => `${c.id} setup: plan_layout gives a plan id: ${String(pl.t).slice(0, 300)}`);
      if (!id) continue;
      const n0 = links().length, ap = s.call('approve_plan', { planId: id });
      for (let k = 0; k < 100 && links().length <= n0; k++) await sleep(50);
      const link = links()[n0], page = await httpReq(link), svgs = [...page.matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map((m) => m[0]);
      await httpReq(link, 'decision=approve'); await ap;
      const cr = await s.call('create_report', Object.assign({}, base, { planId: id, design: pl.j.design }));
      chk(() => !cr.err, () => `${c.id} setup: create_report writes the approved report: ${String(cr.t).slice(0, 300)}`);
      const dir = path.join(ROOT, 'large', base.name + '.Report');
      if (cr.err || !fs.existsSync(dir)) continue;
      const W = written(dir);
      if (c.names) chk(() => base.displayNames['Calendar[Year]'] === 'السنة', () => `${c.id} setup: the plan's Arabic names are approved: ${JSON.stringify(base.displayNames)}`);
      chk(() => svgs.length === W.length && W.length === 2, () => `${c.id}: the approval window draws the report's 2 pages: ${svgs.length} pictures, ${W.length} written pages`);
      // the writer's cut list and check_report's cut headers
      const ct = (cr.j && cr.j.chartTitles) || {}, kt = (cr.j && cr.j.kpiTitles) || {};
      const writerCut = (ct.shortened || []).length + (ct.slicerHeaders || []).length + (kt.shortened || []).length;
      const ck = await s.call('check_report', { path: path.relative(ROOT, dir) });
      const headerCut = ((ck.j && ck.j.findings) || []).filter((f) => f.rule === 'TABLE_HEADER_CUT' && f.severity === 'warning').length;
      let marks = 0;
      W.forEach((wp, k) => {
        const svg = svgs[k] || '', G = groups(svg), at = (g) => wp.visuals.find((v) => (P.kindOf(v) === g.kind || (g.kind === 'panel' && /^(cardVisual|card|textbox)$/.test(v.type)) || (P.kindOf(v) === 'other' && g.kind === 'other')) && Math.abs(v.x - g.x) <= 0.051 && Math.abs(v.y - g.y) <= 0.051 && Math.abs(v.w - g.w) <= 0.051 && Math.abs(v.h - g.h) <= 0.051);
        // PM-5: every box drawn is a written visual's, and every written visual is drawn
        const lost = G.filter((g) => !at(g)), drawn = wp.visuals.filter((v) => !G.some((g) => at(g) === v));
        chk(() => G.length && !lost.length && !drawn.length, () => `PM-5 ${c.id} page ${k + 1}: the picture's boxes are the written visuals': ${lost.length} drawn boxes not written, ${drawn.length} written visuals not drawn (${drawn.map((v) => v.type).join(', ')})`);
        // PM-1: titles, exactly
        const titled = G.map((g) => ({ g, v: at(g) })).filter(({ g, v }) => v && v.title && /^(line|bar|column|donut|table|card|map|chart)$/.test(g.kind));
        const wrong = titled.filter(({ g, v }) => g.texts.join(' ') !== v.title).map(({ g, v }) => `${g.kind}: drawn "${g.texts.join(' | ')}", written "${v.title}"`);
        chk(() => titled.length >= 4 && !wrong.length, () => `PM-1 ${c.id} page ${k + 1}: ${wrong.length} of ${titled.length} titles differ from the written report: ${JSON.stringify(wrong)}`);
        chk(() => !G.some((g) => g.texts.some((t) => /\(\d\)$/.test(t))), () => `PM-1 ${c.id} page ${k + 1}: no title ends with a measure name's "(2)": ${JSON.stringify(G.filter((g) => g.texts.some((t) => /\(\d\)$/.test(t))).map((g) => g.texts))}`);
        // PM-3: slicer headers
        const sl = G.map((g) => ({ g, v: at(g) })).filter(({ v }) => v && v.type === 'slicer');
        const blank = sl.filter(({ g, v }) => !v.header || !g.texts.includes(v.header));
        chk(() => (k === 1 ? sl.length === 3 : true) && !blank.length, () => `PM-3 ${c.id} page ${k + 1}: ${blank.length} of ${sl.length} slicers drawn without their header: ${JSON.stringify(sl.map(({ g, v }) => ({ drawn: g.texts, header: v.header })))}`);
        if (k === 1) chk(() => ['Coupon Region', 'Plan Group', 'السنة'].every((h) => sl.some(({ g }) => g.texts.includes(h))), () => `PM-3 ${c.id}: page 2's slicers say «السنة» (the glossary's name, pinned by the plan), Coupon Region, Plan Group: ${JSON.stringify(sl.map(({ g }) => g.texts))}`);
        marks += flagsOf(svg).filter((f) => f.kind === 'cut').length;
        chk(() => !flagsOf(svg).filter((f) => f.kind === 'cut').length || writerCut + headerCut > 0, () => `PM-2 ${c.id} page ${k + 1}: «مقطوع» on ${JSON.stringify(flagsOf(svg).filter((f) => f.kind === 'cut').map((f) => (G.find((g) => g.i === f.i) || {}).kind))} where the writer shortened nothing and check_report cuts no header`);
      });
      // PM-2: the marks are the shared measure's list
      chk(() => marks === writerCut + headerCut && marks === 0, () => `PM-2 ${c.id}: cut marks ${marks}; the writer's cut list ${writerCut} + check_report's cut headers ${headerCut} (0 expected on this report)`);
    }
  } finally { await s.close(); try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* temp */ } }
} catch (e) { problems.push('the test threw: ' + String(e && e.stack || e).slice(0, 600)); }

function texts0(svg) { return [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => unq(m[1])); }
console.log(`D5 preview match: ${checks - problems.length} of ${checks} checks pass`);
problems.forEach((p) => console.log('  FAIL ' + p));
process.exit(problems.length ? 1 : 0);
