// 0.3.0 X1 (the owner, 19 Oct: "add the toggle, I think this one will be a niche"; written red first): the Arabic twin
// is a separate report; Gulf teams that serve English and Arabic readers want ONE report holding both languages, with a
// button on every page that switches to the same page in the other language. create_arabic_twin with into: "same"
// writes a copy "<name> (EN-AR)" next to the original (the original only read): its English pages as they are, their
// Arabic pages mirrored exactly as the twin builds them, a language button on each page (desktop and phone), the
// counterpart language's pages hidden from the tabs, each slicer pair synced.
//   L1  the plan: the copy's name, every page pair, the buttons, the sync groups, which tabs are shown; the separate
//       twin's plan has none of it
//   L2  the copy holds both page sets: the English pages as the original's (but for the button and the sync group), the
//       Arabic pages under new page ids and visual names, pages.json English then Arabic
//   L3  each language button goes to its counterpart, on one line by the measured rule, in the header at its free end
//       (right on English pages, left on Arabic pages), over no visual but the panel under it; on the phone too
//   L4  every link of an Arabic page stays in Arabic: page tabs, tooltip pages, the Reset bookmark (its own Arabic copy);
//       the empty state's Arabic text is a new measure only the Arabic visuals use
//   L5  each slicer pair shares one sync group (syncGroup, the PBIR way)
//   L6  the Arabic pages hidden from the tabs, the English shown (tabsShown "ar": the reverse); tooltip pages hidden
//   L7  the original untouched (every file's hash); the separate twin as before
//   L8  Microsoft's validator 0 errors and check_report 0 "can break" on the copy
//   L9  check_report: a page button to a page the report does not have is an error (PAGE_LINK_MISSING); the approval
//       page shows the pairs, the buttons, the sync groups, the copy's name and every file, grouped and counted
// Fixture: the golden model (mcp/test-models/large-synthetic, made up), "Orders EN" (exec, second page, phone layout and
// the empty state on, as by default).   node test-0.3.0-language-toggle.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), req0 = createRequire(import.meta.url);
const Rules = req0('../assets/js/report-rules.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const short = (x) => (x && x.err ? String(x.t).slice(0, 300) : JSON.stringify(x && x.j).slice(0, 300));
const filesOf = (dir) => { const out = []; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else out.push(path.relative(dir, f).split(path.sep).join('/')); }); if (fs.existsSync(dir)) rec(dir); return out.sort(); };
const hashes = (dir) => Object.fromEntries(filesOf(dir).map((f) => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex')]));
const link = (v) => { const l = ((((v || {}).visual || {}).visualContainerObjects || {}).visualLink || []).find((e) => e && e.properties) || { properties: {} }; return { type: lit(l.properties.type), page: lit(l.properties.navigationSection), bookmark: lit(l.properties.bookmark) }; };
const textOf = (v) => { const es = ((((v || {}).visual || {}).objects || {}).text || []); return es.map((e) => lit((e.properties || {}).text)).find((x) => x != null); };
const over = (a, b) => a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
const holds = (a, b) => a.x <= b.x + 0.5 && a.x + a.width >= b.x + b.width - 0.5 && a.y <= b.y + 0.5 && a.y + a.height >= b.y + b.height - 0.5;

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-x1-')));
fs.cpSync(path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
const MP = 'large/Large Synthetic.SemanticModel', ORIG = path.join(ROOT, 'large/Orders EN.Report'), COPY = path.join(ROOT, 'large/Orders EN (EN-AR).Report');
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, {});
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });

try {
  const pl = await s.call('plan_layout', { path: MP, focus: 'Web Orders', lang: 'en', layout: 'exec', name: 'Orders EN', secondPage: true });
  const id0 = pl.j && pl.j.plan && pl.j.plan.planId;
  if (id0) await s.call('approve_plan', { planId: id0 });
  const en = id0 ? await s.call('create_report', { path: MP, focus: 'Web Orders', lang: 'en', name: 'Orders EN', planId: id0, design: pl.j.design }) : { err: true, t: 'no plan' };
  const ORDER = fs.existsSync(ORIG) ? rd(path.join(ORIG, 'definition/pages/pages.json')).pageOrder : [];
  const pageJ = (dir, pid) => rd(path.join(dir, 'definition/pages', pid, 'page.json'));
  const visualsOf = (dir, pid) => { const d = path.join(dir, 'definition/pages', pid, 'visuals'); return fs.existsSync(d) ? fs.readdirSync(d).map((n) => ({ n, v: rd(path.join(d, n, 'visual.json')), m: fs.existsSync(path.join(d, n, 'mobile.json')) ? rd(path.join(d, n, 'mobile.json')) : null })) : []; };
  const REPORT = ORDER.filter((pid) => pageJ(ORIG, pid).type !== 'Tooltip');
  chk(() => !en.err && ORDER.length === 4 && REPORT.length === 2 && filesOf(ORIG).length === 91, () => `set-up: "Orders EN" with 4 pages (2 report pages) and 91 files: ${short(en)} ${ORDER.length} ${filesOf(ORIG).length}`);
  const before = hashes(ORIG);

  // labels: every listed text in Arabic (the fixed list's draft, else a made-up Arabic text), as D3's suite
  const p0 = await s.call('create_arabic_twin', { path: 'large/Orders EN.pbip' }), T0 = (p0.j && p0.j.texts) || [];
  let k = 0; const L = {}; T0.filter((t) => t.text != null).forEach((t) => { L[t.id] = t.draftArabic || (/\{1\}/.test(t.text) ? `أعلى {1} من {2}: نص ${++k}` : `نص ${++k}`); });
  // ---------- L7 (guard): the separate twin's plan has none of it ----------
  chk(() => !p0.err && p0.j.twin && p0.j.twin.report === 'Orders EN AR.Report' && !('languages' in p0.j), () => `L7a. the separate twin's plan is as before (no languages): ${short(p0)}`);

  // ---------- L1: the plan ----------
  const p1 = await w.call('create_arabic_twin', { path: 'large/Orders EN.pbip', into: 'same', labels: L }), J = p1.j || {}, LG = J.languages || {};
  chk(() => !p1.err && LG.copy && LG.copy.report === 'Orders EN (EN-AR).Report' && LG.copy.pbip === 'Orders EN (EN-AR).pbip', () => `L1a. the plan names the copy "Orders EN (EN-AR)": ${short(p1)}`);
  const pairs = Array.isArray(LG.pairs) ? LG.pairs : [];
  chk(() => pairs.length === 4 && pairs.every((p, i) => p.english && p.english.id === ORDER[i] && p.arabic && p.arabic.id && !ORDER.includes(p.arabic.id)) && pairs.filter((p) => p.tooltip).length === 2,
    () => `L1b. every page pair (4: English id, a new Arabic id; 2 tooltip pages): ${JSON.stringify(pairs).slice(0, 500)}`);
  const B = Array.isArray(LG.buttons) ? LG.buttons : [];
  chk(() => B.length === 4 && B.every((b) => b.placed === true && b.phone === true) && B.filter((b) => b.on === 'English').length === 2 && B.filter((b) => b.on === 'Arabic').length === 2,
    () => `L1c. four language buttons (2 pages x 2 languages), each placed on the page and on the phone: ${JSON.stringify(B).slice(0, 500)}`);
  const SG = Array.isArray(LG.syncGroups) ? LG.syncGroups : [];
  chk(() => SG.length === 3 && new Set(SG.map((x) => x.group)).size === 3, () => `L1d. three slicer sync groups, one per slicer pair: ${JSON.stringify(SG).slice(0, 400)}`);
  chk(() => LG.tabs && /English/.test(LG.tabs.shown) && /Arabic/.test(LG.tabs.hidden) && /service/i.test(LG.tabs.service || ''), () => `L1e. the plan says which tabs are shown and what a reader in the Power BI service sees: ${JSON.stringify(LG.tabs)}`);
  const pa = await s.call('create_arabic_twin', { path: 'large/Orders EN.pbip', into: 'same', tabsShown: 'ar', labels: L }), LA = (pa.j && pa.j.languages) || {};
  chk(() => !pa.err && (LA.pairs || []).filter((p) => !p.tooltip).every((p) => p.english.hidden === true && p.arabic.hidden === false) && LA.activePage === LA.pairs[0].arabic.id && /Arabic/.test(LA.tabs.shown),
    () => `L6c. tabsShown "ar": the English pages hidden, the Arabic shown and opened first: ${short(pa)}`);

  // ---------- L9: the approval page ----------
  const pid = J.plan && J.plan.planId;
  let html = ''; { const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n); html = url ? unesc(await req(url, 'GET')) : '';
    const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    chk(() => /Orders EN \(EN-AR\)\.Report/.test(txt) && /Page pairs \(4\)/.test(txt) && /Language buttons \(4\)/.test(txt) && /Slicers kept in sync \(3\)/.test(txt), () => `L9a. the approval page shows the copy, the pairs, the buttons and the sync groups: ${txt.slice(0, 400)}`);
    chk(() => /182 files:/.test(txt) && /Pages \(8\)/.test(txt) && /Project file \(1\)/.test(txt), () => `L9b. every file, grouped and counted (182: 180 report files, the .pbip and the month script, as the twin): ${(txt.match(/\d+ files:.{0,200}/) || [''])[0]}`);
    if (url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId: pid }); } }
  const wr = await w.call('create_arabic_twin', { path: 'large/Orders EN.pbip', into: 'same', planId: pid });
  chk(() => !wr.err && wr.j.written === true && fs.existsSync(COPY) && fs.existsSync(path.join(ROOT, 'large/Orders EN (EN-AR).pbip')), () => `L2a. the copy is written: ${short(wr)}`);
  // ---------- L7: the original untouched ----------
  chk(() => JSON.stringify(hashes(ORIG)) === JSON.stringify(before) && !fs.existsSync(path.join(ROOT, 'large/Orders EN AR.Report')), () => 'L7b. the original report is byte for byte as it was, and no separate twin was written');

  // ---------- L2: both page sets ----------
  const PJ = fs.existsSync(COPY) ? rd(path.join(COPY, 'definition/pages/pages.json')) : {}, ord = PJ.pageOrder || [];
  const AR = ord.slice(4), arOf = Object.fromEntries(ORDER.map((p, i) => [p, AR[i]])), enOf = Object.fromEntries(ORDER.map((p, i) => [AR[i], p]));
  chk(() => ord.length === 8 && ORDER.every((p, i) => ord[i] === p) && AR.every((p) => !ORDER.includes(p) && fs.existsSync(path.join(COPY, 'definition/pages', p, 'page.json'))) && PJ.activePageName === ORDER[0],
    () => `L2b. pages.json: the English pages first, then the 4 Arabic pages under new ids, the English first page opened: ${JSON.stringify(PJ)}`);
  chk(() => filesOf(COPY).length === 180, () => `L2c. the copy holds 180 files (91 + 80 Arabic page files + 8 button files + 1 bookmark): ${filesOf(COPY).length}`);
  {
    // an English page: the original's files, byte for byte but the slicers' syncGroup; plus its language button
    const diff = [];
    filesOf(ORIG).forEach((f) => { const a = path.join(ORIG, f), b = path.join(COPY, f); if (!fs.existsSync(b)) { diff.push('missing ' + f); return; }
      if (/^definition\/pages\/pages\.json$|^definition\/bookmarks\/bookmarks\.json$|^\.platform$|^definition\/reportExtensions\.json$/.test(f)) return;
      if (fs.readFileSync(a).equals(fs.readFileSync(b))) return;
      const x = rd(a), y = rd(b); if (y.visual && y.visual.syncGroup) delete y.visual.syncGroup; if (JSON.stringify(x) !== JSON.stringify(y)) diff.push(f); });
    chk(() => !diff.length, () => `L2d. the English pages are the original's (but the slicers' sync group): ${JSON.stringify(diff.slice(0, 6))}`);
    const names = []; ord.forEach((p) => visualsOf(COPY, p).forEach((x) => names.push(x.v.name)));
    chk(() => new Set(names).size === names.length && AR.every((p) => visualsOf(COPY, p).every((x) => x.v.name === x.n)), () => `L2e. every visual name is unique in the copy (the Arabic pages' are new): ${names.length} names, ${new Set(names).size} different`);
    chk(() => ORDER.every((p) => visualsOf(COPY, arOf[p]).length === visualsOf(ORIG, p).length + (REPORT.includes(p) ? 1 : 0)), () => `L2f. each Arabic page has its English page's visuals (+ its language button): ${ORDER.map((p) => visualsOf(ORIG, p).length + '->' + visualsOf(COPY, arOf[p]).length)}`);
  }

  // ---------- L3: the language buttons ----------
  const abs = (vs, x) => { const p = x.v.position, g = x.v.parentGroupName != null ? vs.find((y) => y.v.name === x.v.parentGroupName) : null; return g ? { x: g.v.position.x + p.x, y: g.v.position.y + p.y, width: p.width, height: p.height } : { x: p.x, y: p.y, width: p.width, height: p.height }; };
  const isPage = (x) => x.v.visual && x.v.visual.visualType === 'actionButton' && link(x.v).type === 'PageNavigation';
  const langBtn = (pid, target) => visualsOf(COPY, pid).find((x) => isPage(x) && link(x.v).page === target);
  const bad = [], phoneBad = [];
  REPORT.forEach((en) => [[en, arOf[en], 'العربية', 'right'], [arOf[en], en, 'English', 'left']].forEach(([pid, target, want, end]) => {
    const vs = visualsOf(COPY, pid), b = langBtn(pid, target);
    if (!b) { bad.push(`${pid}: no button to ${target}`); return; }
    if (textOf(b.v) !== want) bad.push(`${pid}: its text ${textOf(b.v)} (want ${want})`);
    const o = b.v.visual.objects, need = Rules.buttonNeed({ json: b.v, type: 'actionButton', h: b.v.position.height, w: b.v.position.width }, { labelSize: 10, font: 'Segoe UI' });
    const t = parseFloat(lit((o.text.find((e) => e.selector && e.selector.id === 'default') || { properties: {} }).properties.fontSize));
    if (!need || b.v.position.width + 0.5 < Math.max(need.one, Math.ceil(0.45 * 4 / 3 * t * want.length)) || b.v.position.height + 0.5 < need.needH) bad.push(`${pid}: ${b.v.position.width} x ${b.v.position.height} for one line (needs ${need && need.one} x ${need && need.needH})`);
    if (!o.text.some((e) => !e.selector && e.properties && lit(e.properties.show) === 'true') || o.text.some((e) => e.selector && e.properties && 'show' in e.properties)) bad.push(`${pid}: the text's show is not in its own entry without a selector`);
    if (!o.text.some((e) => e.selector && e.selector.id === 'default' && e.properties && e.properties.text)) bad.push(`${pid}: the look is not in the default selector`);
    // in the header group, beside the page tabs, at its free end
    const tabs = vs.filter((x) => isPage(x) && x !== b && x.v.parentGroupName === b.v.parentGroupName), g = vs.find((x) => x.v.name === b.v.parentGroupName);
    if (!g || !tabs.length) bad.push(`${pid}: not in the header group with the page tabs`);
    else {
      const gp = g.v.position, p = b.v.position;
      if (p.x < -0.5 || p.x + p.width > gp.width + 0.5 || p.y < -0.5 || p.y + p.height > gp.height + 0.5) bad.push(`${pid}: outside its group`);
      if (end === 'right' ? !tabs.every((x) => x.v.position.x + x.v.position.width <= p.x + 0.5) : !tabs.every((x) => x.v.position.x >= p.x + p.width - 0.5)) bad.push(`${pid}: not at the ${end} of the page tabs`);
    }
    const A = abs(vs, b), hit = vs.filter((x) => x !== b && !x.v.visualGroup && over(abs(vs, x), A) && !holds(abs(vs, x), A));
    if (hit.length) bad.push(`${pid}: covers ${hit.map((x) => x.v.visual.visualType).join(', ')}`);
    // the phone
    if (!b.m) { phoneBad.push(`${pid}: no phone box`); return; }
    const m = b.m.position, others = vs.filter((x) => x !== b && x.m && !x.v.visualGroup);
    if (m.x < -0.5 || m.x + m.width > 323.5 || (end === 'right' ? Math.abs(m.x + m.width - 323) > 0.5 : Math.abs(m.x) > 0.5)) phoneBad.push(`${pid}: phone ${JSON.stringify(m)} not at the ${end} end`);
    const ph = others.filter((x) => over(x.m.position, m)); if (ph.length) phoneBad.push(`${pid}: the phone box overlaps ${ph.length}`);
  }));
  chk(() => !bad.length, () => `L3a. each language button goes to its counterpart, one line, measured selectors, in the header at its free end, over no visual: ${JSON.stringify(bad.slice(0, 8))}`);
  chk(() => !phoneBad.length, () => `L3b. each language button on the phone, at its end of the tabs' row, overlapping nothing: ${JSON.stringify(phoneBad.slice(0, 8))}`);

  // ---------- L4: the Arabic pages' links stay Arabic ----------
  {
    const wrong = [];
    AR.forEach((pid) => visualsOf(COPY, pid).forEach((x) => {
      const l = link(x.v), tip = ((((x.v.visual || {}).visualContainerObjects || {}).visualTooltip) || []).map((e) => lit((e.properties || {}).section)).filter(Boolean);
      if (l.page && !AR.includes(l.page) && !(l.page === enOf[pid] && textOf(x.v) === 'English')) wrong.push(`${pid}/${x.n}: a page link to ${l.page}`);
      tip.forEach((t) => { if (!AR.includes(t)) wrong.push(`${pid}/${x.n}: a tooltip page ${t}`); });
      if (x.v.parentGroupName != null && !visualsOf(COPY, pid).some((y) => y.v.name === x.v.parentGroupName)) wrong.push(`${pid}/${x.n}: its group is not on its page`);
    }));
    const tipCount = AR.reduce((n, pid) => n + visualsOf(COPY, pid).filter((x) => ((((x.v.visual || {}).visualContainerObjects || {}).visualTooltip) || []).length).length, 0);
    chk(() => !wrong.length && tipCount >= 5, () => `L4a. every page and tooltip link of an Arabic page goes to an Arabic page (${tipCount} tooltip links): ${JSON.stringify(wrong.slice(0, 8))}`);
    const det = arOf[REPORT[1]], reset = visualsOf(COPY, det).find((x) => link(x.v).type === 'Bookmark'), bm = reset && link(reset.v).bookmark;
    const bf = bm && path.join(COPY, 'definition/bookmarks', bm + '.bookmark.json'), bj = bf && fs.existsSync(bf) ? rd(bf) : null, names = visualsOf(COPY, det).map((x) => x.v.name);
    const orig = visualsOf(ORIG, REPORT[1]).find((x) => link(x.v).type === 'Bookmark');
    chk(() => bj && bm !== link(orig.v).bookmark && bj.explorationState.activeSection === det && Object.keys(bj.explorationState.sections).every((p) => AR.includes(p)) && bj.options.targetVisualNames.every((n) => names.includes(n))
      && /[؀-ۿ]/.test(bj.displayName) && rd(path.join(COPY, 'definition/bookmarks/bookmarks.json')).items.some((i) => i.name === bm),
      () => `L4b. the Arabic Reset button uses an Arabic copy of the bookmark (its page and visuals the Arabic ones, listed in bookmarks.json): ${JSON.stringify(bj).slice(0, 400)}`);
    const ex = rd(path.join(COPY, 'definition/reportExtensions.json')), ms = ex.entities.flatMap((e) => (e.measures || []).map((m) => Object.assign({ entity: e.name }, m)));
    const nd = ms.find((m) => /^No data: /.test(m.name)), ndAr = ms.find((m) => /^No data AR: /.test(m.name));
    const uses = (pids, name) => pids.some((p) => visualsOf(COPY, p).some((x) => JSON.stringify(x.v).includes(`"Property":"${name}"`) || JSON.stringify(x.v).includes(`"Property": "${name}"`)));
    chk(() => nd && ndAr && /No data for this selection/.test(nd.expression) && /لا توجد بيانات لهذا الاختيار/.test(ndAr.expression) && uses(AR, ndAr.name) && !uses(AR, nd.name) && uses(ORDER, nd.name) && !uses(ORDER, ndAr.name),
      () => `L4c. the empty state: the English measure unchanged for the English pages, a new Arabic one for the Arabic pages: ${JSON.stringify([nd && nd.name, ndAr && ndAr.name])}`);
  }

  // ---------- L5: the slicers in sync ----------
  {
    const sl = (pid) => visualsOf(COPY, pid).filter((x) => x.v.visual && x.v.visual.visualType === 'slicer');
    const en1 = sl(REPORT[1]), ar1 = sl(arOf[REPORT[1]]), byG = (x) => (x.v.visual.syncGroup || {}).groupName;
    chk(() => en1.length === 3 && ar1.length === 3 && en1.every((x) => byG(x) && x.v.visual.syncGroup.fieldChanges === true && x.v.visual.syncGroup.filterChanges === true) && new Set(en1.map(byG)).size === 3
      && ar1.every((x) => en1.filter((y) => byG(y) === byG(x)).length === 1 && JSON.stringify(x.v.visual.query) === JSON.stringify(en1.find((y) => byG(y) === byG(x)).v.visual.query)),
      () => `L5. each slicer pair shares its own sync group (both flags on), the same field: ${JSON.stringify(en1.map(byG))} ${JSON.stringify(ar1.map(byG))}`);
  }

  // ---------- L6: the tabs ----------
  chk(() => REPORT.every((p) => pageJ(COPY, p).visibility === undefined && pageJ(COPY, arOf[p]).visibility === 'HiddenInViewMode') && ORDER.filter((p) => !REPORT.includes(p)).every((p) => pageJ(COPY, p).visibility === 'HiddenInViewMode' && pageJ(COPY, arOf[p]).visibility === 'HiddenInViewMode'),
    () => `L6a. the Arabic pages hidden, the English shown, the tooltip pages hidden: ${ord.map((p) => pageJ(COPY, p).visibility || 'shown')}`);
  chk(() => ORDER.filter((p) => !REPORT.includes(p)).every((p) => pageJ(COPY, arOf[p]).pageBinding && pageJ(COPY, arOf[p]).pageBinding.name !== pageJ(COPY, p).pageBinding.name), () => 'L6b. each Arabic tooltip page has its own page binding');

  // ---------- L8: Microsoft's validator and check_report ----------
  {
    const c = await s.call('check_report', { path: 'large/Orders EN (EN-AR).pbip' }), j = c.j || {}, f = j.findings || [];
    const mine = f.filter((x) => ['PAGE_LINK_MISSING', 'PHONE_OVERLAP', 'BUTTON_ONE_LINE', 'PAGE_BUTTON_WRAP'].includes(x.rule));
    chk(() => !c.err && j.validator && j.validator.ran && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0 && !mine.length,
      () => `L8. the copy: validator 0 errors, check_report 0 "can break", no missing page link, no phone overlap, no cut button: ${c.err ? c.t.slice(0, 300) : JSON.stringify({ v: j.validator, canBreak: j.impact && j.impact.kinds.canBreak.count, mine: mine.map((x) => x.rule + ': ' + x.what) })}`);
  }
  // ---------- L9: PAGE_LINK_MISSING ----------
  {
    const BR = path.join(ROOT, 'large/Broken.Report'); fs.cpSync(ORIG, BR, { recursive: true });
    const tab = visualsOf(BR, REPORT[0]).find((x) => isPage(x)), f = path.join(BR, 'definition/pages', REPORT[0], 'visuals', tab.n, 'visual.json'), j = rd(f);
    j.visual.visualContainerObjects.visualLink[0].properties.navigationSection.expr.Literal.Value = "'nosuchpage0000000000'"; fs.writeFileSync(f, JSON.stringify(j, null, 2));
    const c = await s.call('check_report', { path: 'large/Broken.Report' }), F = ((c.j || {}).findings || []).filter((x) => x.rule === 'PAGE_LINK_MISSING');
    const o = await s.call('check_report', { path: 'large/Orders EN.pbip' }), O = ((o.j || {}).findings || []).filter((x) => x.rule === 'PAGE_LINK_MISSING');
    chk(() => F.length === 1 && F[0].severity === 'error' && !/nosuchpage/.test(JSON.stringify(F[0])) && !O.length, () => `L9c. a page button to a page the report does not have is an error (its id not quoted); none on the original: ${JSON.stringify(F).slice(0, 300)} ${O.length}`);
  }
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }
await s.close(); await w.close();
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL  language-toggle  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  language-toggle  ${checks} checks`);
