// 0.3.1 X2 (the owner, 20 Oct: "I wanna integrate that AR/EN toggle, it's beautiful"; he chose: in create_report;
// written red first): X1's EN-AR copy needs a report first and a second step. plan_layout and create_report take
// languages "en+ar": ONE report holding the English pages and their Arabic pages, built in the same plan by X1's engine
// (the EN-AR copy, on the English pages the plan builds), the Arabic texts approved in the plan, one click, one write.
//   B1  the option: plan_layout's bilingual answer (pairs, buttons, sync groups, tabs, the texts with drafts, the
//       terminology sheet); with lang "ar": a plan problem; without it: nothing changes
//   B2  the write: one report, both page sets, the language buttons both ways (and on the phone), the slicer pairs in
//       sync, the Arabic pages hidden in the tabs, the Arabic bookmark; nothing else written, the model untouched;
//       tabsShown "ar": the English pages hidden, the first Arabic one opened
//   B3  the approval page shows both halves, every file grouped and counted; one click writes once
//   B4  A3's sweep on the Arabic half: no Latin run the plan does not list as kept in English
//   B5  every 0.3.0 option on: written, the pills synced, validator 0 errors, check_report 0 "can break", the sweep
//       0 unlisted, every answer under 40,000 characters
//   B6  X1's EN-AR copy syncs a pill slicer pair too (every slicer kind Microsoft's catalog says can sync)
// (0.3.1, ported onto today's code: the Arabic half is the EN-AR copy's own build, so R1's language buttons and V1's
// approval-page pairs come with it; the parity suite, test-0.3.1-mirror-parity.mjs, compares it with the copy)
//   B2k R1's language buttons: the text colour set (a page tab's look, or the plain button's own colour with its
//       container off); B2l the button in its page's Tab order (it adds no pair against the reading order)
//   B3e V1's pictures: the approval page draws each English page beside its Arabic page (2 report pages: 2 pairs)
// Fixture: the golden model (mcp/test-models/large-synthetic, made up).   node test-0.3.1-bilingual-report.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { shownTexts, scriptTexts, readReport, latinRuns, POWERBI_WORDS, ISO } from './test-arabic-reader.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), A11y = createRequire(import.meta.url)('../assets/js/report-a11y.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uniq = (a) => [...new Set(a)];
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const filesOf = (dir) => { const out = []; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else out.push(path.relative(dir, f).split(path.sep).join('/')); }); if (fs.existsSync(dir)) rec(dir); return out.sort(); };
const hashes = (dir) => Object.fromEntries(filesOf(dir).map((f) => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex')]));
const linkOf = (v) => { const l = ((((v || {}).visual || {}).visualContainerObjects || {}).visualLink || []).find((e) => e && e.properties) || { properties: {} }; return { type: lit(l.properties.type), page: lit(l.properties.navigationSection), bookmark: lit(l.properties.bookmark) }; };
const textOf = (v) => (((((v || {}).visual || {}).objects || {}).text || []).map((e) => lit((e.properties || {}).text)).find((x) => x != null));
const AR = /[؀-ۿ]/;
const WORDS = ['المبيعات', 'الطلبات', 'القيمة', 'المنطقة', 'الخطة', 'الشهر', 'المتوسط', 'العدد', 'الهدف', 'الربح', 'الدرجة', 'العميل'];
let made = 0; const arName = () => { const w = WORDS[made % WORDS.length], n = Math.floor(made / WORDS.length); made++; return n ? `${w} ${n + 1}` : w; };

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-x2-')));
fs.cpSync(path.join(HERE, 'test-models/large-synthetic'), path.join(ROOT, 'large'), { recursive: true });
const MP = 'large/Large Synthetic.SemanticModel', MODEL = path.join(ROOT, MP);
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, {});
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
let biggest = { n: 0, tool: '' };
const call = async (c, tool, args) => { const r = await c.call(tool, args); if (String(r.t).length > biggest.n) biggest = { n: String(r.t).length, tool }; return r; };

// the person: answers the Gulf date and shared-axes questions, approves an Arabic name for every field but one (declined:
// kept in English), then an Arabic text for every text the terms do not give
async function planBilingual(c, a0) {
  let args = Object.assign({}, a0), pl = await call(c, 'plan_layout', args), declined = null;
  for (let i = 0; i < 6 && !pl.err; i++) {
    const j = pl.j || {}, more = {};
    const gd = j.gulfDates && j.gulfDates.askNext;
    if (gd && !args.gulfDates && ((j.gulfDates.candidates || [])[0] || {}).field) more.gulfDates = { dateRole: j.gulfDates.candidates[0].field, grain: 'gregorian', scope: 'all' };
    const sa = j.sharedAxes && j.sharedAxes.ask;
    if (sa && sa.length && !args.sharedAxes) more.sharedAxes = sa.map((q, k) => ({ measures: q.measures, answer: k % 2 ? 'separate' : 'comparable' }));
    const B = j.bilingual;
    if (B && !args.arabicTerms && B.terminology && (B.terminology.sheet || []).length) {
      const fields = uniq(B.terminology.sheet.map((x) => x.field).filter(Boolean)), t = {};
      fields.forEach((f, k) => { t[f] = k === fields.length - 1 ? (B.terminology.sheet.find((x) => x.field === f) || {}).en : arName(); });
      declined = t[fields[fields.length - 1]]; more.arabicTerms = t;
    } else if (B && args.arabicTerms && !args.arabicTexts) {
      const at = {}; (B.texts || []).filter((x) => x.text != null && x.arabic == null && !x.field && x.text !== declined).forEach((x) => { at[x.text] = x.draftArabic || (/\{1\}/.test(x.text) ? `أعلى {1} من {2}: ${arName()}` : arName()); });
      more.arabicTexts = at;
    }
    if (!Object.keys(more).length) break;
    args = Object.assign(args, more); pl = await call(c, 'plan_layout', args);
  }
  return { pl, args, declined };
}
const withoutDesign = (a) => { const x = Object.assign({}, a); delete x.planFields; return x; };

try {
  const before = hashes(MODEL);
  const base = { path: MP, focus: 'Web Orders', lang: 'en', layout: 'exec', secondPage: true };
  // ---------- B1: the option ----------
  const p0 = await call(s, 'plan_layout', Object.assign({ name: 'Orders' }, base));
  chk(() => !p0.err && p0.j.plan && !('bilingual' in p0.j), () => `B1a. without languages the plan is as before (no bilingual): ${short(p0)}`);
  const pAr = await call(s, 'plan_layout', Object.assign({ name: 'Orders' }, base, { lang: 'ar', languages: 'en+ar' }));
  chk(() => !pAr.err && !pAr.j.plan && (pAr.j.planProblems || []).some((x) => /languages/.test(x) && /English/.test(x)), () => `B1b. languages "en+ar" with lang "ar": a plan problem, no plan id: ${short(pAr)}`);
  const p1 = await call(s, 'plan_layout', Object.assign({ name: 'Orders', languages: 'en+ar' }, base)), B0 = (p1.j || {}).bilingual || {};
  chk(() => !p1.err && (B0.pairs || []).length === 4 && (B0.buttons || []).filter((b) => b.placed).length === 4 && (B0.syncGroups || []).length === 3 && B0.tabs && /English/.test(B0.tabs.shown),
    () => `B1c. the bilingual plan: 4 page pairs, 4 language buttons, 3 slicer pairs in sync, English tabs shown: ${JSON.stringify({ pairs: (B0.pairs || []).length, buttons: (B0.buttons || []).length, sync: (B0.syncGroups || []).length, tabs: B0.tabs }).slice(0, 300)} ${short(p1)}`);
  chk(() => (B0.texts || []).length >= 10 && B0.texts.some((t) => t.draftArabic) && B0.terminology && (B0.terminology.sheet || []).length >= 3 && /arabicTexts/.test(B0.sayFirst || '') && /arabicTerms/.test(B0.sayFirst || ''),
    () => `B1d. the plan lists the texts (drafts from the fixed list) and the terminology sheet, and says how to approve them (arabicTexts, arabicTerms): ${JSON.stringify(B0).slice(0, 400)}`);

  // ---------- B2: the write ----------
  const { pl, args, declined } = await planBilingual(w, Object.assign({ name: 'Orders', languages: 'en+ar' }, base));
  const B = (pl.j || {}).bilingual || {}, pid = pl.j && pl.j.plan && pl.j.plan.planId;
  chk(() => pid && B.texts && B.texts.filter((t) => t.arabic != null).length >= 10, () => `B2a. the approved Arabic texts and terms give a plan id: ${short(pl)}`);
  const pa = await call(s, 'plan_layout', Object.assign({}, args, { tabsShown: 'ar' })), BA = (pa.j || {}).bilingual || {};
  chk(() => !pa.err && /Arabic/.test((BA.tabs || {}).shown || '') && (BA.pairs || []).filter((p) => !p.tooltip).every((p) => p.english.hidden === true && p.arabic.hidden === false),
    () => `B2b. tabsShown "ar": the Arabic pages shown, the English hidden: ${JSON.stringify(BA.tabs)} ${JSON.stringify(BA.pairs).slice(0, 300)}`);
  const all0 = new Set(filesOf(ROOT));
  // B3: the approval page
  let html = '';
  { const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n); html = url ? unesc(await req(url, 'GET')) : '';
    const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    chk(() => /English and Arabic in one report/.test(txt) && /Page pairs \(4\)/.test(txt) && /Language buttons \(4\)/.test(txt) && /Slicers kept in sync \(3\)/.test(txt) && /Terminology sheet: English \| Arabic/.test(txt),
      () => `B3a. the approval page shows both halves (pairs, buttons, sync, the terminology sheet): ${txt.slice(0, 500)}`);
    B.__files = +((txt.match(/(\d+) files:/) || [])[1] || 0);
    chk(() => B.__files >= 180 && /Pages \(8\)/.test(txt) && /Phone layouts/.test(txt) && /Project file \(1\)/.test(txt), () => `B3b. every file grouped and counted (8 pages): ${(txt.match(/\d+ files:.{0,300}/) || [''])[0]}`);
    // (V1) each English report page drawn beside its Arabic page (tooltip pages are not drawn)
    const figs = (html.match(/<figure>/g) || []).length, caps = [...html.matchAll(/<figcaption[^>]*>([^:<]*):/g)].map((x) => x[1].trim());
    chk(() => (html.match(/class="pair"/g) || []).length === 2 && figs === 4 && caps.join('|') === 'English page 1|Arabic page 1|English page 2|Arabic page 2',
      () => `B3e. the approval page draws 2 page pairs (4 pictures, English beside Arabic): ${figs} figures, captions ${JSON.stringify(caps)}`);
    if (url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId: pid }); } }
  const wr = await call(w, 'create_report', Object.assign(withoutDesign(args), { planId: pid, design: pl.j.design }));
  const REP = path.join(ROOT, 'large/Orders.Report');
  chk(() => !wr.err && fs.existsSync(REP) && wr.j.bilingual && wr.j.bilingual.pairs === 4, () => `B2c. one report written, the answer says its pairs: ${short(wr)}`);
  const added = filesOf(ROOT).filter((f) => !all0.has(f) && f !== 'links.txt');
  chk(() => added.length === B.__files && added.every((f) => /^large\/Orders(\.Report\/|\.pbip$| - [^/]+\.tmdl$)/.test(f)) && !fs.existsSync(path.join(ROOT, 'large/Orders (EN-AR).Report')),
    () => `B3c. exactly the files the approval page counted, all of this report (${added.length} vs ${B.__files}): ${JSON.stringify(added.filter((f) => !/^large\/Orders\.Report\//.test(f)))}`);
  const again = await call(w, 'create_report', Object.assign(withoutDesign(args), { planId: pid, design: pl.j.design }));
  chk(() => again.err && filesOf(ROOT).length === all0.size + added.length + (fs.existsSync(log) && !all0.has('links.txt') ? 1 : 0), () => `B3d. one click writes once: the same planId again is refused, nothing written: ${short(again)}`);
  chk(() => JSON.stringify(hashes(MODEL)) === JSON.stringify(before), () => 'B2d. the model folder is untouched');
  const F = fs.existsSync(REP) ? readReport(REP) : {}, PJ = F['definition/pages/pages.json'] || {}, ord = PJ.pageOrder || [];
  const EN = ord.slice(0, 4), ARP = ord.slice(4), arOf = Object.fromEntries(EN.map((p, i) => [p, ARP[i]]));
  const pageJ = (p) => F[`definition/pages/${p}/page.json`] || {};
  const vis = (p) => Object.entries(F).filter(([f]) => f.startsWith(`definition/pages/${p}/visuals/`) && f.endsWith('/visual.json')).map(([f, j]) => ({ f, j, m: F[f.replace(/visual\.json$/, 'mobile.json')] || null }));
  const REPORT = EN.filter((p) => pageJ(p).type !== 'Tooltip');
  chk(() => ord.length === 8 && REPORT.length === 2 && PJ.activePageName === EN[0] && REPORT.every((p) => pageJ(p).visibility === undefined && pageJ(arOf[p]).visibility === 'HiddenInViewMode') && AR.test(pageJ(arOf[REPORT[0]]).displayName || ''),
    () => `B2e. 8 pages (4 English, then their 4 Arabic, hidden in the tabs), the English first page opened: ${ord.map((p) => (pageJ(p).displayName || '') + ':' + (pageJ(p).visibility || 'shown')).join(', ')}`);
  {
    const bad = [];
    REPORT.forEach((en) => [[en, arOf[en], 'العربية'], [arOf[en], en, 'English']].forEach(([pg, to, want]) => {
      const b = vis(pg).find((x) => linkOf(x.j).type === 'PageNavigation' && linkOf(x.j).page === to && textOf(x.j) === want);
      if (!b) bad.push(`${pageJ(pg).displayName}: no «${want}» button to its counterpart`); else if (!b.m) bad.push(`${pageJ(pg).displayName}: its button is not on the phone layout`);
    }));
    // (R1) the button's look: a page tab's (it has the tabs' font colour) or the plain one's colour, container off; and its
    // Tab stop inside the page's order, not last after every stop
    const lb = REPORT.flatMap((en) => [[en, arOf[en]], [arOf[en], en]]).map(([pg, to]) => ({ pg, b: vis(pg).find((x) => linkOf(x.j).type === 'PageNavigation' && linkOf(x.j).page === to && /^(English|العربية)$/.test(textOf(x.j) || '')) })).filter((x) => x.b);
    const fc = (j) => ((((j.visual || {}).objects || {}).text || []).find((e) => e.selector && e.selector.id === 'default') || { properties: {} }).properties.fontColor;
    const off = (j, k) => lit(((((j.visual || {}).visualContainerObjects || {})[k] || []).find((e) => !e.selector) || { properties: {} }).properties.show) === 'false';
    chk(() => lb.length === 4 && lb.every((x) => fc(x.b.j) && ['background', 'border', 'dropShadow'].every((k) => off(x.b.j, k))), () => `B2k. each language button has its text colour and its container off (R1): ${JSON.stringify(lb.map((x) => [pageJ(x.pg).displayName, !!fc(x.b.j), ['background', 'border', 'dropShadow'].map((k) => off(x.b.j, k))]))}`);
    // (report-a11y.js inversions, check_report's own count: the stops of the button's group, or of the page, in its direction)
    const inv = (pg, without) => { const b = lb.find((x) => x.pg === pg).b, par = b.j.parentGroupName || '';
      const sib = vis(pg).filter((y) => (y.j.parentGroupName || '') === par && y.j.position && y.j.position.tabOrder != null && !(without && y === b)).sort((m, n) => m.j.position.tabOrder - n.j.position.tabOrder);
      return A11y.inversions(sib.map((y) => ({ x: y.j.position.x, y: y.j.position.y, w: y.j.position.width, h: y.j.position.height })), ARP.includes(pg) ? 'rtl' : 'ltr'); };
    chk(() => lb.length === 4 && lb.every((x) => inv(x.pg, false) === inv(x.pg, true)), () => `B2l. each language button takes its place in its page's Tab order, adding no pair against the reading order (R1): ${JSON.stringify(lb.map((x) => [pageJ(x.pg).displayName, inv(x.pg, false), inv(x.pg, true)]))}`);
    chk(() => !bad.length, () => `B2f. a language button on every report page to its counterpart, both ways, on the phone too: ${JSON.stringify(bad)}`);
    const sl = (p) => vis(p).filter((x) => x.j.visual && /slicer/i.test(x.j.visual.visualType || '')), g = (x) => ((x.j.visual || {}).syncGroup || {}).groupName;
    const enS = REPORT.flatMap(sl), arS = REPORT.flatMap((p) => sl(arOf[p]));
    chk(() => enS.length === 3 && enS.every((x) => g(x) && arS.filter((y) => g(y) === g(x)).length === 1) && new Set(enS.map(g)).size === 3, () => `B2g. each slicer pair in its own sync group: ${JSON.stringify(enS.map(g))} / ${JSON.stringify(arS.map(g))}`);
    const bms = Object.entries(F).filter(([f]) => /\.bookmark\.json$/.test(f)).map(([, j]) => j);
    chk(() => bms.length === 2 && bms.some((b) => AR.test(b.displayName || '') && ARP.includes((b.explorationState || {}).activeSection)), () => `B2h. the Reset bookmark and its Arabic copy on the Arabic page: ${JSON.stringify(bms.map((b) => [b.displayName, (b.explorationState || {}).activeSection]))}`);
    // the English pages: no Arabic text but the language button
    const enAr = shownTexts(F, new Set(EN)).texts.filter((t) => AR.test(t.s) && t.s !== 'العربية');
    chk(() => !enAr.length, () => `B2i. the English pages show no Arabic but «العربية»: ${JSON.stringify(enAr.slice(0, 5).map((t) => t.what + ' ' + t.s))}`);
  }
  // ---------- B4: A3's sweep on the Arabic half ----------
  const sweep = (FF, pages, J, scripts) => {
    const { texts } = shownTexts(FF, pages); scripts.forEach((f) => texts.push(...scriptTexts(f)));
    const kept = (J.notTranslated || []).map((x) => x.text).concat(((J.terminology || {}).sheet || []).filter((x) => x.status === 'kept').map((x) => x.en)).filter(Boolean).map((x) => String(x).replace(ISO, ''));
    const cannot = (J.cannot || []).map((c) => c.what), cats = [];
    if (cannot.some((c) => /flip cards' faces/.test(c))) cats.push((t) => t.what === 'flip face');
    if (cannot.some((c) => /metric switcher's choices/.test(c))) cats.push((t) => t.what === 'switcher label' || t.what === 'switcher title');
    const unlisted = [];
    texts.forEach((t) => latinRuns(t.s).forEach((run) => { if (POWERBI_WORDS.has(run) || kept.some((k) => k.includes(run)) || cats.some((c) => c(t))) return; unlisted.push(`${t.what} "${run}" in "${String(t.s).replace(ISO, '').slice(0, 60)}" (${t.where.replace(/^definition\//, '').slice(0, 60)})`); }));
    return { texts: texts.length, unlisted: uniq(unlisted) };
  };
  { const r = sweep(F, new Set(ARP), B, []);
    chk(() => r.texts >= 40 && !r.unlisted.length, () => `B4. A3's sweep on the Arabic half (${r.texts} texts): ${r.unlisted.length} English runs not listed as kept: ${JSON.stringify(r.unlisted.slice(0, 10))}`);
    chk(() => declined && (B.notTranslated || []).some((x) => x.text === declined), () => `B4b. the declined field "${declined}" is listed as kept in English: ${JSON.stringify(B.notTranslated).slice(0, 300)}`); }
  { const c = await call(s, 'check_report', { path: 'large/Orders.pbip' }), j = c.j || {};
    chk(() => !c.err && j.validator && j.validator.ran && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0 && !(j.findings || []).some((f) => ['PAGE_LINK_MISSING', 'PHONE_OVERLAP'].includes(f.rule)),
      () => `B2j. the bilingual report: validator 0 errors, check_report 0 "can break", no missing page, no phone overlap: ${c.err ? c.t.slice(0, 300) : JSON.stringify({ v: j.validator, canBreak: j.impact && j.impact.kinds.canBreak.count })}`); }

  // ---------- B5: every 0.3.0 option on ----------
  {
    const opt = { gallery: true, smoothLines: true, slicerStyle: 'pills', grid: 'dotted', flipCards: true, statusIcons: true, waterfallRtl: 'native', filters: 'top',
      metricSwitcher: ['Web Orders[Web Orders Total Score]', 'Web Orders[Web Orders Count]', 'Web Orders[Web Orders Total Value]'], pageFilters: [{ field: 'Calendar[Is Ramadan]', values: [true] }],
      planFields: { slicers: ['Calendar[Is Weekend]', 'Coupon[Coupon Region]'] } };
    const tm0 = new Set(fs.readdirSync(path.join(ROOT, 'large')).filter((f) => f.endsWith('.tmdl')));
    const q = await planBilingual(s, Object.assign({ name: 'Orders All', languages: 'en+ar' }, base, opt)), J = (q.pl.j || {}).bilingual || {}, id = q.pl.j && q.pl.j.plan && q.pl.j.plan.planId;
    chk(() => id, () => `B5a. every option on: a plan id: ${JSON.stringify((q.pl.j || {}).planProblems || (q.pl.j || {}).gulfDates || q.pl.t).slice(0, 500)}`);
    // (0.3.1 CX2, TW1 Seen 1) B5i: an answer past its size keeps the `cannot` list whole (the person's limits, cut last);
    // long approved Arabic texts push it past 40,000 characters (written red first on 2e912e2: cut 7 -> 3, the flip faces gone)
    { const at = q.args.arabicTexts || {}, longer = Object.fromEntries(Object.entries(at).map(([k, v]) => [k, (String(v) + ' ' + 'تقرير المبيعات الشهري للفروع '.repeat(6)).slice(0, 200)]));
      const big = await s.call('plan_layout', Object.assign({}, q.args, { arabicTexts: longer })), BJ = (big.j || {}).bilingual || {}, tr = (big.j || {}).truncated;
      chk(() => tr && (J.cannot || []).length > 1 && JSON.stringify(BJ.cannot) === JSON.stringify(J.cannot) && !(tr.cut || {})['bilingual.cannot'],
        () => `B5i. cut to fit (${String(big.t).length} characters, cut: ${JSON.stringify(tr && tr.cut)}), the cannot list stays whole: ${(BJ.cannot || []).length} of ${(J.cannot || []).length}`); }
    if (id) {
      await s.call('approve_plan', { planId: id });
      const send = withoutDesign(q.args); send.fields = q.args.planFields;
      const r = await call(s, 'create_report', Object.assign(send, { planId: id, design: q.pl.j.design }));
      const RA = path.join(ROOT, 'large/Orders All.Report'), FA = fs.existsSync(RA) ? readReport(RA) : {}, oa = (FA['definition/pages/pages.json'] || {}).pageOrder || [];
      const half = oa.length / 2, ENA = oa.slice(0, half), ARA = oa.slice(half), pj = (p) => FA[`definition/pages/${p}/page.json`] || {};
      const vA = (p) => Object.entries(FA).filter(([f]) => f.startsWith(`definition/pages/${p}/visuals/`) && f.endsWith('/visual.json')).map(([, j]) => j);
      const reportPages = ENA.filter((p) => pj(p).type !== 'Tooltip');
      chk(() => !r.err && oa.length >= 8 && oa.length % 2 === 0 && (J.pairs || []).length === half, () => `B5b. written with every option: ${oa.length} pages, ${(J.pairs || []).length} pairs: ${short(r)}`);
      chk(() => (J.buttons || []).filter((b) => b.placed).length === 2 * reportPages.length, () => `B5c. a language button on every report page both ways (${reportPages.length} report pages): ${JSON.stringify(J.buttons).slice(0, 400)}`);
      const pills = (p) => vA(p).filter((v) => v.visual && v.visual.visualType === 'advancedSlicerVisual'), g = (v) => (v.visual.syncGroup || {}).groupName;
      const pe = ENA.flatMap(pills), pa2 = ARA.flatMap(pills);
      chk(() => pe.length >= 1 && pe.every((v) => g(v) && pa2.some((y) => g(y) === g(v))), () => `B5d. the pills pairs synced (the button slicer can sync, Microsoft's catalog): ${JSON.stringify(pe.map(g))} / ${JSON.stringify(pa2.map(g))}`);
      const c = await call(s, 'check_report', { path: 'large/Orders All.pbip' }), cj = c.j || {};
      chk(() => !c.err && cj.validator && cj.validator.errors === 0 && cj.impact.kinds.canBreak.count === 0, () => `B5e. validator 0 errors and check_report 0 "can break" with every option: ${c.err ? c.t.slice(0, 300) : JSON.stringify({ v: cj.validator, canBreak: cj.impact && cj.impact.kinds.canBreak })}`.slice(0, 700));
      const scripts = fs.readdirSync(path.join(ROOT, 'large')).filter((f) => f.endsWith('.tmdl') && !tm0.has(f) && /^Orders All - /.test(f)).map((f) => path.join(ROOT, 'large', f));
      const sw = sweep(FA, new Set(ARA), J, scripts);
      chk(() => sw.texts >= 60 && !sw.unlisted.length, () => `B5f. A3's sweep on the Arabic half with every option (${sw.texts} texts): ${sw.unlisted.length} not listed: ${JSON.stringify(sw.unlisted.slice(0, 10))}`);
      chk(() => ENA.every((p) => pj(p).visibility === undefined || pj(p).type === 'Tooltip') && ARA.every((p) => pj(p).visibility === 'HiddenInViewMode'), () => `B5g. the Arabic half hidden in the tabs, the English shown: ${oa.map((p) => pj(p).visibility || 'shown')}`);
    }
  }
  chk(() => biggest.n > 0 && biggest.n < 40000, () => `B5h. every answer under 40,000 characters: the largest ${biggest.n} (${biggest.tool})`);

  // ---------- B6: X1's copy syncs the pills too ----------
  {
    const q = await call(s, 'plan_layout', Object.assign({ name: 'Pills EN', slicerStyle: 'pills', planFields: { slicers: ['Calendar[Is Weekend]', 'Coupon[Coupon Region]'] } }, base, { filters: 'top' })), id = q.j && q.j.plan && q.j.plan.planId;
    if (id) { await s.call('approve_plan', { planId: id }); await s.call('create_report', Object.assign({ name: 'Pills EN', slicerStyle: 'pills', fields: { slicers: ['Calendar[Is Weekend]', 'Coupon[Coupon Region]'] }, planId: id, design: q.j.design }, base, { filters: 'top' })); }
    const t = await call(s, 'create_arabic_twin', { path: 'large/Pills EN.pbip', into: 'same' }), tid = t.j && t.j.plan && t.j.plan.planId;
    if (tid) { await s.call('approve_plan', { planId: tid }); await s.call('create_arabic_twin', { path: 'large/Pills EN.pbip', into: 'same', planId: tid }); }
    const FP = fs.existsSync(path.join(ROOT, 'large/Pills EN (EN-AR).Report')) ? readReport(path.join(ROOT, 'large/Pills EN (EN-AR).Report')) : {};
    const pv = Object.entries(FP).filter(([f, j]) => f.endsWith('/visual.json') && j.visual && j.visual.visualType === 'advancedSlicerVisual').map(([, j]) => (j.visual.syncGroup || {}).groupName);
    chk(() => pv.length >= 2 && pv.every(Boolean) && pv.every((x) => pv.filter((y) => y === x).length === 2), () => `B6. X1's EN-AR copy keeps each pill slicer pair in one sync group: ${JSON.stringify(pv)} ${short(t)}`);
  }
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 800)); }
await s.close(); await w.close();
if (!process.env.X2_KEEP) fs.rmSync(ROOT, { recursive: true, force: true }); else console.log('kept: ' + ROOT);

if (problems.length) { console.log(`FAIL  bilingual-report  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  bilingual-report  ${checks} checks`);
