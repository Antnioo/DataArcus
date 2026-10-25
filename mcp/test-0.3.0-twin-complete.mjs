// 0.3.0 D3 (the owner's must-fix 1, "no English titles in Arabic reports"; the laptop's proof of 0.3.0-rc.2, Desktop
// 2.159; written red first): a report written in Arabic passes, but the ARABIC TWIN of an English report listed 38 texts,
// translated all of them, and still showed 59 English texts it never listed: the phone layout (the header text box and
// the KPI titles), the cards' "No data" and the empty state's measure, 15 alt texts. Its glossary drafted 1 of 38. On the
// phone the KPI cards were not mirrored and the tab «التفاصيل» wrapped.
//   TC-1  the plan lists every text a viewer sees in the original (pages, visuals, mobile.json, bookmarks, the texts of
//         the report measures its visuals show)
//   TC-2  every fixed report word is drafted from the fixed list, with the Arabic the writer itself writes
//   TC-3  the twin written with an Arabic label for every text but two fields the person keeps in English: a scan of
//         every written file finds 0 English texts but those two, which the plan's notTranslated lists, with why
//   TC-4  the approval page says what stays English; notShown names the original's unused title measures, left as they are
//   TC-5  the phone layout mirrored like the pages; each phone page tab as wide as its Arabic name (the writer's rule)
//   TC-6  Microsoft's validator 0 errors and check_report 0 "can break" on the original and the twin
// (the Reset button's text starts with the writer's gap before its icon, two no-break spaces: pbip-sizing.js RESET_GAP)
// Fixture: the golden model (mcp/test-models/large-synthetic, made up), "Orders EN" (exec, phone layout and the empty
// state on, as by default).   node test-0.3.0-twin-complete.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), req0 = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const Z = req0('../assets/js/pbip-sizing.js'), E = req0('../assets/js/design-engine.js');
const WORDS = rd(path.join(REPO, 'assets/data/arabic-report-words.json'));

// ---- every text a viewer sees in a report's files (rel path -> JSON) ----
const TEXT_KEYS = new Set(['text', 'altText', 'showBlankAs', 'titleText', 'subTitleText', 'tooltipText', 'placeholderText', 'labelText', 'headerText', 'enabledTooltip', 'disabledTooltip', 'tooltip']);
const lit = (p) => (p && p.expr && p.expr.Literal && typeof p.expr.Literal.Value === 'string' && /^'.*'$/s.test(p.expr.Literal.Value) ? p.expr.Literal.Value.slice(1, -1).replace(/''/g, "'") : null);
// the report measures a visual uses (by "Entity\0Name"): only those of reportExtensions.json are shown
const usedMeasures = (files) => { const used = new Set(); const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== 'object') return;
  if (o.Measure && o.Measure.Expression && o.Measure.Expression.SourceRef && o.Measure.Expression.SourceRef.Schema === 'extension') used.add(o.Measure.Expression.SourceRef.Entity + '\u0000' + o.Measure.Property);
  Object.values(o).forEach(walk); }; Object.entries(files).filter(([f]) => /visual\.json$/.test(f)).forEach(([, j]) => walk(j)); return used; };
function shownTexts(files) {
  const out = [], used = usedMeasures(files);
  const walk = (o, where) => {
    if (Array.isArray(o)) { o.forEach((x) => walk(x, where)); return; }
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'properties' && v && typeof v === 'object') Object.entries(v).forEach(([pk, pv]) => { const s = TEXT_KEYS.has(pk) ? lit(pv) : null; if (s && /\p{L}/u.test(s)) out.push({ where, what: pk, s }); });
      if (k === 'textRuns' && Array.isArray(v)) v.forEach((t) => t && typeof t.value === 'string' && t.value.trim() && out.push({ where, what: 'text box', s: t.value }));
      if (k === 'projections' && Array.isArray(v)) v.forEach((p) => p && typeof p.displayName === 'string' && p.displayName.trim() && out.push({ where, what: 'field header', s: p.displayName }));
      walk(v, where);
    }
  };
  for (const [f, j] of Object.entries(files)) {
    if (/page\.json$/.test(f) && j.displayName) out.push({ where: f, what: 'page name', s: j.displayName });
    if (/\.bookmark\.json$/.test(f) && j.displayName) out.push({ where: f, what: 'bookmark name', s: j.displayName });
    if (/(visual|mobile|page)\.json$/.test(f)) walk(j, f);
    if (/reportExtensions\.json$/.test(f)) (j.entities || []).forEach((e) => (e.measures || []).forEach((m) => { if (used.has(e.name + '\u0000' + m.name) && typeof m.expression === 'string') (m.expression.match(/"(?:[^"]|"")*"/g) || []).forEach((s) => { const t = s.slice(1, -1).replace(/""/g, '"'); if (/\p{L}/u.test(t)) out.push({ where: f + ' ' + m.name, what: 'measure text', s: t }); }); }));
  }
  return out;
}
const readReport = (dir) => { const out = {}; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else if (f.endsWith('.json')) { try { out[path.relative(dir, f).split(path.sep).join('/')] = rd(f); } catch (x) { /* not JSON */ } } }); rec(dir); return out; };
const words = (s) => String(s).match(/[A-Za-z]+/g) || [];
const uniq = (a) => [...new Set(a)];
const short = (x) => (x && x.err ? String(x.t).slice(0, 300) : JSON.stringify(x && x.j).slice(0, 300));

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-d3-')));
fs.cpSync(path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
const MP = 'large/Large Synthetic.SemanticModel', ORIG = path.join(ROOT, 'large/Orders EN.Report'), TWIN = path.join(ROOT, 'large/Orders EN AR.Report');
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, {});
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });

try {
  const write = async (lang, name) => {
    const pl = await s.call('plan_layout', { path: MP, focus: 'Web Orders', lang, layout: 'exec', name, secondPage: true });
    const id = pl.j && pl.j.plan && pl.j.plan.planId; if (!id) return { err: 'no plan: ' + String(pl.t).slice(0, 300) };
    await s.call('approve_plan', { planId: id });
    const r = await s.call('create_report', { path: MP, focus: 'Web Orders', lang, name, planId: id, design: pl.j.design });
    return r.err ? { err: String(r.t).slice(0, 300) } : { r };
  };
  const en = await write('en', 'Orders EN');
  const O = fs.existsSync(ORIG) ? readReport(ORIG) : {};
  chk(() => !en.err && Object.keys(O).some((f) => /mobile\.json$/.test(f)) && JSON.stringify(O['definition/reportExtensions.json'] || {}).includes('No data for this selection'),
    () => `set-up: "Orders EN" written with its phone layout and its empty state: ${en.err || Object.keys(O).length + ' files'}`);

  // ---------- TC-1: the plan lists every text ----------
  const p0 = await s.call('create_arabic_twin', { path: 'large/Orders EN.pbip' });
  const T0 = (p0.j && p0.j.texts) || [];
  chk(() => !p0.err && T0.length && !(p0.j && p0.j.truncated), () => `TC-1a. the plan is answered whole (no cut): ${short(p0)} ${JSON.stringify(p0.j && p0.j.truncated)}`);
  {
    const listed = T0.map((t) => t.text).filter((x) => x != null);
    const missing = shownTexts(O).filter((t) => /[A-Za-z]/.test(t.s) && !(t.what === 'measure text' ? listed.some((x) => x.includes(t.s.trim())) : listed.includes(t.s)));
    chk(() => !missing.length, () => `TC-1b. ${missing.length} texts the original shows are not in the plan: ${JSON.stringify(uniq(missing.map((t) => `${t.what} "${t.s.slice(0, 60)}" (${t.where.replace(/^.*definition\//, '').slice(0, 50)})`)).slice(0, 14))}`);
    const kinds = new Set(T0.map((t) => t.kind));
    chk(() => ['altText', 'blankText', 'buttonTooltip', 'measureText'].every((k) => kinds.has(k)) && T0.some((t) => t.phone && t.kind === 'textbox') && T0.some((t) => t.phone && t.kind === 'title'),
      () => `TC-1c. the plan names the new kinds (alt text, a card's text for no data, a button tooltip, a measure's text, the phone layout's texts): ${JSON.stringify([...kinds])}`);
  }

  // ---------- TC-2: drafts from the fixed list, the writer's own Arabic ----------
  {
    const ph = WORDS.phrases || {}, by = (k, text) => T0.find((t) => t.kind === k && t.text === text);
    const want = [['page', 'Executive summary', 'ملخص تنفيذي'], ['page', 'Details', 'التفاصيل'], ['page', 'Tooltip', 'تلميح الأدوات'], ['button', '\u00a0\u00a0Reset filters', '\u00a0\u00a0إعادة ضبط الفلاتر'],
      ['blankText', 'No data', 'لا توجد بيانات'], ['measureText', 'No data for this selection', 'لا توجد بيانات لهذا الاختيار'], ['buttonTooltip', 'Clear the filters on this page', 'إعادة ضبط الفلاتر'],
      ['bookmark', 'Reset filters · Details', 'إعادة ضبط الفلاتر · التفاصيل'], ['field', 'Year', 'السنة']];
    const bad = want.filter(([k, t, a]) => !by(k, t) || by(k, t).draftArabic !== a).map(([k, t, a]) => `${k} "${t}": ${by(k, t) ? JSON.stringify(by(k, t).draftArabic) : 'not listed'} (want ${a})`);
    chk(() => !bad.length, () => `TC-2a. the fixed report words are drafted: ${JSON.stringify(bad)}`);
    const drafted = T0.filter((t) => t.draftArabic).length;
    chk(() => drafted >= 20, () => `TC-2b. drafts: ${drafted} of ${T0.length} (was 1 of 38)`);
    // the list's Arabic is the writer's own: its fixed texts, and an Arabic report's own page names and empty state
    const RT = E.REPORT_TEXTS, rt = Object.keys(RT.en).filter((k) => k !== 'by').filter((k) => ph[RT.en[k]] !== RT.ar[k]);
    chk(() => !rt.length, () => `TC-2c. every fixed text of the writer (REPORT_TEXTS) is in the list with its Arabic: ${JSON.stringify(rt.map((k) => [RT.en[k], ph[RT.en[k]], RT.ar[k]]))}`);
    const ar = await write('ar', 'تقرير الطلبات'), A = ar.err ? {} : readReport(path.join(ROOT, 'large/تقرير الطلبات.Report'));
    const pageNames = (F) => { const ord = (F['definition/pages/pages.json'] || {}).pageOrder || []; return ord.map((id) => (F[`definition/pages/${id}/page.json`] || {}).displayName); };
    const en2 = pageNames(O), ar2 = pageNames(A);
    const lits = (F, key) => uniq(Object.values(F).flatMap((j) => { const o = []; const walk = (x) => { if (Array.isArray(x)) return x.forEach(walk); if (!x || typeof x !== 'object') return; if (x.properties && x.properties[key]) { const v = lit(x.properties[key]); if (v) o.push(v); } Object.values(x).forEach(walk); }; walk(j); return o; }));
    const pairs = [[en2[0], ar2[0]], [en2[1], ar2[1]], [lits(O, 'showBlankAs')[0], lits(A, 'showBlankAs')[0]], [lits(O, 'enabledTooltip')[0], lits(A, 'enabledTooltip')[0]],
      ['No data for this selection', JSON.stringify(A['definition/reportExtensions.json'] || {}).includes('لا توجد بيانات لهذا الاختيار') ? 'لا توجد بيانات لهذا الاختيار' : null]];
    const off = pairs.filter(([e, a]) => !e || !a || ph[e] !== a);
    chk(() => !ar.err && !off.length, () => `TC-2d. the list's Arabic is what the writer writes in an Arabic report: ${ar.err || JSON.stringify(off)}`);
  }

  // ---------- TC-3: the twin, every text Arabic but the two fields kept in English ----------
  const KEEP = ['Coupon Region', 'Plan Group'], OLD = new Set(['page', 'title', 'textbox', 'button', 'field', 'bookmark', 'titleMeasure', 'measureText']);
  let k = 0; const arabic = (t) => t.draftArabic || (/\{1\}/.test(t.text) ? `أعلى {1} من {2}: نص ${++k}` : `نص ${++k}`);
  const L1 = {}; T0.filter((t) => t.text != null && OLD.has(t.kind) && !t.phone && !KEEP.includes(t.text)).forEach((t) => { L1[t.id] = arabic(t); });
  const p1 = await s.call('create_arabic_twin', { path: 'large/Orders EN.pbip', labels: L1 }), T1 = (p1.j && p1.j.texts) || [];
  {
    // a new kind's text takes the approved Arabic of the same text: an alt text its visual's title, a phone copy the page's
    const T = (id) => T1.find((t) => t.id === id);
    const alts = T1.filter((t) => t.kind === 'altText' && !KEEP.includes(t.text) && T1.some((x) => OLD.has(x.kind) && !x.phone && x.text === t.text));
    chk(() => alts.length >= 10 && alts.every((t) => t.label != null && t.labelFrom), () => `TC-3a. an alt text with the same words as a translated text takes its Arabic (labelFrom): ${JSON.stringify(alts.filter((t) => !t.labelFrom).slice(0, 4))}`);
    const ph = T1.filter((t) => t.phone);
    chk(() => ph.length >= 5 && ph.every((t) => t.label != null && t.labelFrom && (!T(t.id.replace(/^phone:/, '')) || T(t.id.replace(/^phone:/, '')).text !== t.text || T(t.id.replace(/^phone:/, '')).label === t.label)),
      () => `TC-3b. every phone text takes the page's Arabic for the same text: ${JSON.stringify(ph.filter((t) => t.label == null).slice(0, 4))}`);
  }
  const L2 = Object.assign({}, L1); T1.filter((t) => t.text != null && t.label == null && !KEEP.includes(t.text)).forEach((t) => { L2[t.id] = arabic(t); });
  const p2 = await w.call('create_arabic_twin', { path: 'large/Orders EN.pbip', labels: L2 }), J2 = p2.j || {};
  const NT = Array.isArray(J2.notTranslated) ? J2.notTranslated : [];
  chk(() => !p2.err && !J2.truncated && NT.length === 2 && NT.every((r) => KEEP.includes(r.text) && /field name/.test(r.where) && /model/.test(r.why)),
    () => `TC-3c. the plan lists exactly what stays English, with why (notTranslated): ${JSON.stringify(NT).slice(0, 600)} ${short(p2)}`);
  chk(() => /notTranslated/.test(String(J2.sayInPlan || '')) && /before the go/i.test(String(J2.sayInPlan || '')), () => `TC-3d. the plan says to show it before the go: ${J2.sayInPlan}`);
  // TC-4: the approval page lists it
  const pid = J2.plan && J2.plan.planId;
  let html = ''; { const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n); html = url ? unesc(await req(url, 'GET')) : '';
    chk(() => /Shown in English \(2/.test(html) && KEEP.every((x) => html.includes(`"${x}"`)), () => `TC-4a. the approval page says what stays English: ${html.length ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300) : 'no page'}`);
    if (url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId: pid }); } }
  const wr = await w.call('create_arabic_twin', { path: 'large/Orders EN.pbip', planId: pid });
  chk(() => !wr.err && wr.j.written === true && fs.existsSync(TWIN), () => `TC-3e. the twin is written: ${short(wr)}`);
  const TW = fs.existsSync(TWIN) ? readReport(TWIN) : {};
  {
    const ok = new Set(words(KEEP.join(' ')).map((x) => x.toLowerCase()));
    const stray = shownTexts(TW).filter((t) => words(t.s).some((x) => !ok.has(x.toLowerCase())));
    chk(() => Object.keys(TW).length && !stray.length, () => `TC-3f. ${stray.length} English texts in the twin that its plan did not list as kept: ${JSON.stringify(uniq(stray.map((t) => `${t.what} "${t.s.slice(0, 60)}" (${t.where.replace(/^.*definition\//, '').slice(0, 50)})`)).slice(0, 16))}`);
    const kept = shownTexts(TW).filter((t) => /[A-Za-z]/.test(t.s));
    chk(() => kept.length && kept.every((t) => KEEP.includes(t.s.trim())), () => `TC-3g. only the two kept fields' names are English in the twin: ${JSON.stringify(uniq(kept.map((t) => t.s)))}`);
  }
  // TC-4: the original's title measures the twin's charts no longer use: listed, left byte for byte
  {
    const ex = (F) => Object.fromEntries(((F['definition/reportExtensions.json'] || {}).entities || []).flatMap((e) => (e.measures || []).map((m) => [e.name + '[' + m.name + ']', m])));
    const o = ex(O), t = ex(TW), used = usedMeasures(TW), unused = Object.keys(t).filter((n) => /^[^[]+\[Title: /.test(n) && !used.has(n.replace('[', '\u0000').slice(0, -1)));
    const NS = (J2.notShown || []).map((x) => x.measure);
    chk(() => unused.length >= 2 && unused.every((n) => NS.includes(n) && JSON.stringify(t[n]) === JSON.stringify(o[n])), () => `TC-4b. notShown names each unused original title measure, left as it is: ${JSON.stringify(unused)} vs ${JSON.stringify(NS)}`);
    const nd = Object.keys(t).find((n) => /\[No data: /.test(n));
    chk(() => nd && /لا توجد بيانات لهذا الاختيار/.test(t[nd].expression) && /ISBLANK/.test(t[nd].expression) && /No data for this selection/.test(o[nd].expression), () => `TC-4c. the empty state's measure says it in Arabic in the twin; the original's is unchanged: ${nd && t[nd].expression}`);
  }

  // ---------- TC-5: the phone layout mirrored; the tabs sized by the writer's rule ----------
  {
    const pagesOf = (F) => ((F['definition/pages/pages.json'] || {}).pageOrder || []).filter((id) => Object.keys(F).some((f) => f.startsWith(`definition/pages/${id}/visuals/`) && f.endsWith('mobile.json')));
    const mob = (F, pg) => Object.fromEntries(Object.keys(F).filter((f) => f.startsWith(`definition/pages/${pg}/visuals/`) && f.endsWith('/mobile.json')).map((f) => [f.split('/')[4], { m: F[f], v: F[f.replace('mobile.json', 'visual.json')] }]));
    const isTab = (v) => v && v.visual && v.visual.visualType === 'actionButton' && /PageNavigation/.test(JSON.stringify(v.visual.visualContainerObjects.visualLink || []));
    const tabText = (v) => v.visual.objects.text.map((e) => lit((e.properties || {}).text)).find((x) => x != null);
    const pgs = pagesOf(O); let mirrored = 0, wrong = [], tabs = [], tabBad = [];
    chk(() => pgs.length === 2, () => `TC-5 set-up: two pages with a phone layout: ${JSON.stringify(pgs)}`);
    pgs.forEach((pg) => {
      const a = mob(O, pg), b = mob(TW, pg), lines = new Set();
      const tabNames = Object.keys(a).filter((n) => isTab(a[n].v));
      // the line under a tab
      Object.keys(a).forEach((n) => { const q = a[n].m.position; if (/shape/.test((a[n].v.visual || {}).visualType || '') && q.height <= 3) lines.add(n); });
      Object.keys(a).filter((n) => !tabNames.includes(n) && !lines.has(n) && a[n].v.visual).forEach((n) => { const p = a[n].m.position, q = b[n] && b[n].m.position;
        if (q && Math.abs(q.x - Math.max(0, Math.round((323 - p.x - p.width) * 100) / 100)) < 0.01 && q.width === p.width && q.y === p.y) mirrored++; else wrong.push(`${pg}/${n}: ${JSON.stringify(p)} -> ${JSON.stringify(q)}`); });
      // the tabs: from the right, in the original's order, each its Arabic name's width, the writer's gap
      const row = tabNames.slice().sort((x, y) => a[x].m.position.x - a[y].m.position.x);
      let at = 323;
      row.forEach((n) => { const q = b[n].m.position, want = Z.phoneTabWidth(tabText(b[n].v), 'Segoe UI'); tabs.push(`${tabText(b[n].v)} ${q.x},${q.width}`);
        if (q.width !== want || Math.abs(q.x + q.width - at) > 0.01) tabBad.push(`${pg}/${n} "${tabText(b[n].v)}": x ${q.x} width ${q.width} (want width ${want}, right end ${at})`); at = q.x - Z.PHONE_TAB.gap; });
      [...lines].forEach((n) => { const q = b[n].m.position, t = row.find((x) => Math.abs(a[x].m.position.y + a[x].m.position.height - a[n].m.position.y) <= 1 && a[n].m.position.x >= a[x].m.position.x - 1 && a[n].m.position.x + a[n].m.position.width <= a[x].m.position.x + a[x].m.position.width + 1);
        const tq = t && b[t].m.position; if (!tq || q.x < tq.x || q.x + q.width > tq.x + tq.width || q.y !== tq.y + tq.height) tabBad.push(`${pg}/${n}: the line under its tab: ${JSON.stringify(q)} under ${JSON.stringify(tq)}`); });
      // the KPI row reversed: the first card of each row of two at the right
      const cards = Object.keys(a).filter((n) => (a[n].v.visual || {}).visualType === 'cardVisual' && a[n].m.position.width < 200);
      cards.forEach((n) => { if (a[n].m.position.x === 0 && b[n].m.position.x !== 165.5) wrong.push(`${pg}/${n}: the first KPI card of its row is not at the right on the phone`); });
      Object.keys(a).filter((n) => (a[n].v.visual || {}).visualType === 'textbox').forEach((n) => { const al = JSON.stringify(b[n].m).match(/"horizontalTextAlignment":"(\w+)"/); if (!al || al[1] !== 'right') wrong.push(`${pg}/${n}: the phone text box is not right-aligned: ${al && al[1]}`); });
    });
    chk(() => mirrored >= 20 && !wrong.length, () => `TC-5a. every phone box mirrored (x' = 323 - x - w), the KPI row reversed, text boxes right (${mirrored} mirrored): ${JSON.stringify(wrong.slice(0, 8))}`);
    chk(() => tabs.length >= 4 && !tabBad.length, () => `TC-5b. each phone page tab as wide as its Arabic name (the writer's phoneTabWidth), from the right, its line under it: ${JSON.stringify(tabBad.slice(0, 6))} ${JSON.stringify(tabs)}`);
    chk(() => J2.phone && J2.phone.mirrored === true && Array.isArray(J2.phone.tabs) && !(J2.cannot || []).some((c) => /phone/i.test(c.what)), () => `TC-5c. the plan says the phone layout is mirrored (phone), no longer under cannot: ${JSON.stringify(J2.phone).slice(0, 300)}`);
  }

  // ---------- TC-6: Microsoft's validator and check_report on both ----------
  for (const [what, p] of [['the original', 'large/Orders EN.pbip'], ['the twin', 'large/Orders EN AR.pbip']]) {
    const c = await s.call('check_report', { path: p }), j = c.j || {};
    const phone = (j.findings || []).filter((f) => f.rule === 'PHONE_OVERLAP');
    chk(() => !c.err && j.validator && j.validator.ran && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0 && !phone.length,
      () => `TC-6 ${what}: validator 0 errors, check_report 0 "can break", no phone overlap: ${c.err ? c.t.slice(0, 300) : JSON.stringify({ v: j.validator, canBreak: j.impact && j.impact.kinds.canBreak.count, phone: phone.map((f) => f.what) })}`);
  }
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }
await s.close(); await w.close();
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL  twin-complete  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  twin-complete  ${checks} checks`);
