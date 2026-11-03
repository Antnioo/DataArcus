// L1 (the owner, 19 Oct: "implement the ideas from the labs, like the smooth line chart"; the laptop lab of 13 Oct,
// Desktop 2.158: monotone smooth lines score as straight ones, but "the points are no longer findable without
// markers"). Written red first. Line charts, and the line of a combo, are smooth by default with a small dot on each
// point; smoothLines: false keeps straight lines without dots. On made-up fields and the repo's made-up models only.
//   W  the writer (shared with the website): lineStyles as written, both ways; every property in Microsoft's
//      capabilities; the combo's line; the Arabic (mirrored) line chart the same
//   P  the preview (assets/js/page-preview.js): a smooth monotone path with a dot per point when the file says so
//   S  through the server: the plan pins it (a different smoothLines is refused), the written report, the approval page
//      (preview and look summary), the Arabic twin keeps the line style
//   V  Microsoft's validator 0 errors and check_report 0 "can break" on every report written here
//   X  the texts: create_report's description and SKILL.md say the default and when to turn it off
//   node test-0.3.0-smooth-lines.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { serverSource } from './test-source.mjs';   // (0.3.1 S9: the server's code is server.mjs, tools/ and the lib/ modules it shared)

const HERE = path.dirname(fileURLToPath(import.meta.url)), req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e) }; } };

const Px = req('../assets/js/pbip-export.js'), E = req('../assets/js/design-engine.js'), G = req('../assets/js/visual-gallery.js'), P = req('../assets/js/page-preview.js');
const CAPS = JSON.parse(fs.readFileSync(path.join(HERE, 'node_modules/@microsoft/powerbi-core-visual-schema/data/capabilities.json'), 'utf8'));

// ---------- made-up fields (a retail model; no employer or client data) ----------
const T = 'Sales', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x) => Object.assign({ t: T, c }, x || {});
const AED = M('Total Sales', { cardFormat: '"AED" #,0' }), AED2 = M('Total Cost', { cardFormat: '"AED" #,0' });
const MONTH = C('Month Name', { kind: 'month', sortBy: { t: T, c: 'Month Number' } }), CITY = C('City');
const BIND = { kpis: [AED, AED2], measure: AED, date: MONTH, cats: { bar: CITY, column: C('Channel', { kind: 'channel', rows: 4 }), donut: C('Channel') }, y: {},
  table: [CITY, AED], slicers: [CITY, null, null], tip: { card: AED, cat: CITY, y: AED },
  // (0.3.0 J19, changed on purpose: one currency shares a combo's axis only when the person confirmed the pair compares)
  axes: { confirmed: [req('../assets/js/axis-units.js').record(AED, AED2, 'comparable', [])] } };
const SLOTS = [{ kind: 'line', x: 20, y: 20, w: 610, h: 330 }, { kind: 'combo', x: 650, y: 20, w: 610, h: 330 }];
const build = (lang, extra) => {
  const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma';
  E.repairState(d);
  return Px.build(Object.assign({ name: 'SL ' + lang, title: 'SL', pageName: 'P', lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false,
    model: { byPath: 'M.SemanticModel' }, bind: BIND, texts: E.REPORT_TEXTS[lang], chartAxes: 'mirrored', quietGrid: true, gallery: true,
    pages: [{ name: 'P', page: { w: 1280, h: 720 }, slots: SLOTS, panel: null, hand: true, png: new Uint8Array([1]) }] }, extra || {}));
};
const visuals = (r) => (r.files || []).filter((f) => /visual\.json$/.test(f.path)).map((f) => JSON.parse(String(f.data))).filter((v) => v.visual);
const typed = (r, type) => visuals(r).find((v) => v.visual.visualType === type);
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : undefined);
const ls = (v) => (v && v.visual.objects && v.visual.objects.lineStyles) || [];
const L = (v) => { const e = ls(v); return e.length === 1 && !e[0].selector ? Object.fromEntries(Object.entries(e[0].properties).map(([k, p]) => [k, lit(p) !== undefined ? lit(p) : p])) : null; };
const show = (v) => JSON.stringify(v ? ls(v) : null).slice(0, 500);
const SMOOTH = { strokeWidth: '3D', lineChartType: "'smooth'", interpolationSmooth: "'monotoneX'", showMarker: 'true', markerShape: "'circle'", markerSize: '5D' };
const STRAIGHT = { strokeWidth: '3D' };
const same = (a, b) => a && JSON.stringify(Object.keys(a).sort().map((k) => [k, a[k]])) === JSON.stringify(Object.keys(b).sort().map((k) => [k, b[k]]));

// ---------- W: the writer ----------
const EN = get(() => build('en')), EN0 = get(() => build('en', { smoothLines: false })), AR = get(() => build('ar')), AR0 = get(() => build('ar', { smoothLines: false }));
const line = EN.files && typed(EN, 'lineChart'), line0 = EN0.files && typed(EN0, 'lineChart');
chk(() => same(L(line), SMOOTH), () => `W1: by default a line chart is smooth (monotoneX), 3 wide, a filled circle of size 5 on each point, in one entry with no selector (the form Desktop drew in the lab of 7 Oct), no markerColor (each series keeps its colour): ${EN.threw || show(line)}`);
chk(() => same(L(line0), STRAIGHT), () => `W2: smoothLines: false keeps the straight line, 3 wide, no markers (as before): ${EN0.threw || show(line0)}`);
{
  const written = [[line, 'lineChart'], [EN.files && typed(EN, 'lineClusteredColumnComboChart'), 'lineClusteredColumnComboChart']];
  const bad = written.flatMap(([v, t]) => (v ? ls(v).flatMap((e) => Object.keys(e.properties).filter((k) => !(((CAPS[t] || {}).objects || {}).lineStyles || { properties: {} }).properties[k]).map((k) => t + '.' + k)) : ['no ' + t]));
  const enums = written.every(([v, t]) => !v || ls(v).every((e) => Object.entries(e.properties).every(([k, p]) => { const d = CAPS[t].objects.lineStyles.properties[k], en = d && d.type && d.type.enumeration; return !en || en.allMembers.some((m) => "'" + m.value + "'" === lit(p)); })));
  chk(() => !bad.length && enums, () => `W3: every lineStyles property written, and its value, is in Microsoft's capabilities for its visual type: ${JSON.stringify(bad)} ${enums}`);
}
const combo = EN.files && typed(EN, 'lineClusteredColumnComboChart'), combo0 = EN0.files && typed(EN0, 'lineClusteredColumnComboChart');
chk(() => same(L(combo), SMOOTH), () => `W4: the combo's line is smooth with markers by default: ${show(combo)}`);
chk(() => same(L(combo0), STRAIGHT), () => `W4b: and straight without markers with smoothLines: false: ${show(combo0)}`);
chk(() => same(L(AR.files && typed(AR, 'lineChart')), SMOOTH) && same(L(AR.files && typed(AR, 'lineClusteredColumnComboChart')), SMOOTH) && same(L(AR0.files && typed(AR0, 'lineChart')), STRAIGHT),
  () => `W5: the Arabic (mirrored) report draws the same line style both ways: ${AR.threw || show(typed(AR, 'lineChart'))} / ${show(typed(AR, 'lineClusteredColumnComboChart'))}`);
chk(() => ['strokeWidth', 'lineChartType', 'interpolationSmooth', 'showMarker', 'markerShape', 'markerSize'].every((k) => G.WRITES.lineClusteredColumnComboChart.objects.lineStyles.includes(k)),
  () => `W6: visual-gallery's WRITES lists the combo's line properties: ${JSON.stringify(G.WRITES.lineClusteredColumnComboChart.objects.lineStyles)}`);

// ---------- P: the preview, drawn from the written files ----------
const groups = (svg) => [...svg.matchAll(/<g class="v" data-i="\d+" data-kind="([a-z]+)"[^>]*>([\s\S]*?)<!--\/v-->/g)].map((m) => ({ kind: m[1], body: m[2] }));
const lineGroups = (r) => { const pg = P.fromFiles(r.files || [])[0]; return pg ? groups(P.render(pg, { width: 800 })).filter((g) => g.kind === 'line') : []; };
// the cubic path's segments: [[x0, y0], [c1x, c1y], [c2x, c2y], [x1, y1]]
const segments = (d) => { const n = String(d).match(/-?[\d.]+/g).map(Number), out = []; for (let i = 2; i + 5 < n.length; i += 6) out.push([[n[i - 2], n[i - 1]], [n[i], n[i + 1]], [n[i + 2], n[i + 3]], [n[i + 4], n[i + 5]]]); return out; };
{
  const pg = EN.files && P.fromFiles(EN.files)[0], lv = pg && pg.visuals.filter((v) => P.kindOf(v) === 'line');
  chk(() => lv.length === 2 && lv.every((v) => v.smooth === true && v.markers === true), () => `P1: fromFiles reads smooth and markers from the line charts' lineStyles: ${JSON.stringify(lv && lv.map((v) => ({ type: v.type, smooth: v.smooth, markers: v.markers })))}`);
  const g = lineGroups(EN), d = g.map((x) => (/<path class="ln" d="([^"]+)"/.exec(x.body) || [])[1]);
  chk(() => g.length === 2 && d.every((x) => x && /C/.test(x)) && g.every((x) => !/<polyline/.test(x.body) && (x.body.match(/<circle class="mk"/g) || []).length === 7),
    () => `P1b: the preview draws each smooth line as a cubic path with a dot on each of its 7 points: ${JSON.stringify(g.map((x) => x.body.slice(0, 300)))}`);
  const seg = d.filter(Boolean).flatMap(segments);
  chk(() => seg.length === 12 && seg.every(([a, c1, c2, b]) => [c1[1], c2[1]].every((y) => y >= Math.min(a[1], b[1]) - 0.01 && y <= Math.max(a[1], b[1]) + 0.01) && c1[0] >= a[0] - 0.01 && c2[0] <= b[0] + 0.01),
    () => `P3: monotone: every control point lies between its two points (the curve never swings past the data): ${JSON.stringify(seg.slice(0, 4))}`);
  const g0 = lineGroups(EN0);
  chk(() => g0.length === 2 && g0.every((x) => /<polyline/.test(x.body) && !/<path class="ln"/.test(x.body) && !/<circle class="mk"/.test(x.body)), () => `P2: a straight line stays a polyline without dots: ${JSON.stringify(g0.map((x) => x.body.slice(0, 200)))}`);
  const ar = lineGroups(AR);
  chk(() => ar.length === 2 && ar.every((x) => /<path class="ln" d="[^"]*C/.test(x.body)), () => 'P1c: the Arabic report\'s preview draws the lines smooth too');
  chk(() => pg && P.render(pg, { width: 800 }) === P.render(P.fromFiles(EN.files)[0], { width: 800 }), () => 'P4: the picture is deterministic');
}

// ---------- X: the texts ----------
{
  // (S1: PR #81's mcp-windows-parts (0) failed X1: Git on Windows checks the files out with CRLF, and the pattern below
  // ends at "\n"; the source is read line-ending blind)
  const lf = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  const sv = serverSource().replace(/\r\n/g, '\n'), sk = lf(path.join(HERE, 'skills/report-design/SKILL.md'));
  const desc = (/smoothLines: z\.boolean\(\)\.optional\(\)\.describe\(([^\n]+)\),\n/.exec(sv) || [])[1] || '';
  chk(() => /Default true/.test(desc) && /dot|marker/i.test(desc) && /jagged/.test(desc) && /false/.test(desc), () => `X1: create_report's smoothLines says the default, the dots, and when to turn it off (a jagged series): ${desc}`);
  chk(() => /smoothLines/.test(sk) && /jagged/.test(sk), () => 'X2: SKILL.md says when to turn smoothLines off');
}

// ---------- S and V: through the server ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const httpReq = (url, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method: body ? 'POST' : 'GET', headers: body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {} }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', (e) => resolve('error: ' + e.message)); if (body) r.write(body); r.end();
});
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sl-'));
fs.cpSync(path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
const MP = 'large/Large Synthetic.SemanticModel', log = path.join(ROOT, 'links.txt');
const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '300' });
const ask = async (name, args) => { try { return await s.call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
const short = (x) => (x.err ? String(x.t).slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writtenLines = (dir) => { const out = [], D = path.join(dir, 'definition/pages'); if (!fs.existsSync(D)) return out;
  fs.readdirSync(D).filter((p) => fs.existsSync(path.join(D, p, 'visuals'))).forEach((p) => fs.readdirSync(path.join(D, p, 'visuals')).forEach((n) => { const v = rd(path.join(D, p, 'visuals', n, 'visual.json')); if (v.visual && /^line(Chart|ClusteredColumnComboChart|StackedColumnComboChart)$/.test(v.visual.visualType)) out.push(Object.assign(v, { page: p })); })); return out; };
const cli = path.join(HERE, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');
const validate = async (what, reportDir, pbip, lang) => {
  const pv = spawnSync(process.execPath, [cli, 'validate', reportDir], { encoding: 'utf8' }); let vd = null; try { vd = JSON.parse(pv.stdout).data; } catch (e) { vd = null; }
  chk(() => vd && vd.errorCount === 0, () => `V ${what}: Microsoft's validator: 0 errors: ${vd ? JSON.stringify(Object.entries(vd.diagnostics || {}).filter(([, d]) => d.severity === 'error').map(([k, d]) => k + ': ' + String(d.items[0].message).slice(0, 200))) : String(pv.stdout || pv.stderr).slice(0, 300)}`);
  const cr = await ask('check_report', { path: pbip, lang });
  chk(() => !cr.err && cr.j.impact.kinds.canBreak.count === 0, () => `V ${what}: check_report: 0 "can break": ${short(cr)} ${cr.j ? JSON.stringify((cr.j.findings || []).filter((f) => f.impact === 'canBreak')).slice(0, 400) : ''}`);
};
// plan, approve through the approval page (its HTML kept), write
const planAndWrite = async (base) => {
  const pl = await ask('plan_layout', base), id = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!id) return { pl, html: '', id: null };
  const n0 = links().length, ap = ask('approve_plan', { planId: id });
  for (let k = 0; k < 100 && links().length <= n0; k++) await sleep(50);
  const link = links()[n0], html = link ? await httpReq(link) : '';
  if (link) await httpReq(link, 'decision=approve');
  await ap;
  return { pl, html, id };
};
try {
  const base = { path: MP, focus: 'Web Orders', layout: 'exec', name: 'L1 Smooth', secondPage: false };
  const A = await planAndWrite(base);
  chk(() => A.id && A.pl.j.plan.reportLook && A.pl.j.plan.reportLook.smoothLines === true, () => `S1: plan_layout's reportLook pins smoothLines true by default: ${short(A.pl)}`);
  // S5: the approval page: the preview's smooth path and dots, the look summary's row
  const svgs = [...A.html.matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map((m) => m[0]), lg = svgs.flatMap((x) => groups(x)).filter((g) => g.kind === 'line');
  chk(() => lg.length >= 1 && lg.every((g) => /<path class="ln" d="[^"]*C/.test(g.body) && /<circle class="mk"/.test(g.body)), () => `S5: the approval page's preview draws the line charts smooth with dots: ${svgs.length} pictures, ${lg.length} lines: ${JSON.stringify(lg.map((g) => g.body.slice(0, 200)))}`);
  chk(() => /Smooth lines[\s\S]{0,200}smooth[^<]*dot on each point/.test(A.html), () => `S5b: the look summary names the smooth lines and their dots: ${(/Smooth lines[\s\S]{0,300}/.exec(A.html) || [''])[0]}`);
  // S2: a different smoothLines than the plan is refused, nothing written
  const no = await ask('create_report', Object.assign({}, base, { planId: A.id, design: A.pl.j && A.pl.j.design, smoothLines: false }));
  chk(() => no.err && /Nothing was written/.test(no.t) && /smoothLines/.test(no.t) && !fs.existsSync(path.join(ROOT, 'large', base.name + '.Report')), () => `S2: create_report with smoothLines false on a plan that pinned true is refused, nothing written: ${short(no)}`);
  // S3: the default write
  const ok = await ask('create_report', Object.assign({}, base, { planId: A.id, design: A.pl.j && A.pl.j.design }));
  const dir = path.join(ROOT, 'large', base.name + '.Report'), lines = writtenLines(dir);
  chk(() => !ok.err && lines.length >= 1 && lines.every((v) => same(L(v), SMOOTH)), () => `S3: the written report's line charts are smooth with markers: ${short(ok)} ${JSON.stringify(lines.map((v) => ls(v)))}`.slice(0, 900));
  if (!ok.err) await validate('default', dir, path.join('large', base.name + '.pbip'), 'en');
  // S6: the Arabic twin keeps the line style as written
  const tp = await ask('create_arabic_twin', { path: path.join('large', base.name + '.pbip') }), tid = tp.j && tp.j.plan && tp.j.plan.planId;
  if (tid) { const n0 = links().length, ap = ask('approve_plan', { planId: tid }); for (let k = 0; k < 100 && links().length <= n0; k++) await sleep(50); const lk = links()[n0]; if (lk) await httpReq(lk, 'decision=approve'); await ap; }
  const tw = tid ? await ask('create_arabic_twin', { path: path.join('large', base.name + '.pbip'), planId: tid }) : tp;
  const twDir = path.join(ROOT, 'large', base.name + ' AR.Report'), tl = writtenLines(twDir);
  chk(() => !tw.err && tl.length === lines.length && tl.every((v) => same(L(v), SMOOTH)), () => `S6: the Arabic twin keeps every line chart smooth with markers: ${short(tw)} ${JSON.stringify(tl.map((v) => ls(v)))}`.slice(0, 900));
  if (!tw.err && fs.existsSync(twDir)) await validate('twin', twDir, path.join('large', base.name + ' AR.pbip'), 'ar');
  // S4: a plan with smoothLines false writes straight lines without markers
  const b0 = Object.assign({}, base, { name: 'L1 Straight', smoothLines: false });
  const B = await planAndWrite(b0);
  chk(() => B.id && B.pl.j.plan.reportLook.smoothLines === false && /Smooth lines[\s\S]{0,200}straight[^<]*no dots/.test(B.html), () => `S4: the plan pins smoothLines false and the page says so: ${short(B.pl)}`);
  const ok0 = await ask('create_report', Object.assign({}, b0, { planId: B.id, design: B.pl.j && B.pl.j.design }));
  const dir0 = path.join(ROOT, 'large', b0.name + '.Report'), l0 = writtenLines(dir0);
  chk(() => !ok0.err && l0.length >= 1 && l0.every((v) => same(L(v), STRAIGHT)), () => `S4b: straight lines without markers are written: ${short(ok0)} ${JSON.stringify(l0.map((v) => ls(v)))}`.slice(0, 900));
  if (!ok0.err) await validate('straight', dir0, path.join('large', b0.name + '.pbip'), 'en');
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL  smooth-lines  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  smooth-lines  ${checks} checks`);
