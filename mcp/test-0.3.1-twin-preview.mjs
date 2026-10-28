// 0.3.1 V1 (the owner, 25 Oct, after using 0.3.0 on a real report: "in the approval page I couldn't find the preview
// sketch"; written red first): only the report's plan drew its pages on the approval page. The twin's approval page (the
// separate twin, and the English-and-Arabic copy into "same") now draws each Arabic page as the twin will write it, with
// the shared renderer (assets/js/page-preview.js), from the twin's own build (planTwin's buildTwin / languageCopy, the
// objects writeTwin writes): no second layout.
//   V1-1  the separate twin's page: one figure per Arabic report page
//   V1-2  the copy's page: each English page beside its Arabic page, labelled
//   V1-3  every svg direction="ltr" inside the rtl page; the placeholders note
//   V1-4  each drawn box is the written visual.json's box (after approve + write); the Arabic pages mirrored
//   V1-5  a planted Arabic chart title far too long for its box is flagged (Preview.check, the caption's "to check")
//   V1-6  the answer says the approval page shows each Arabic page; under 40,000 characters
//   V1-7  the gate as before: approve then write succeeds, other labels are refused (guards)
//   V1-8  sizes: a 16-page report draws at most PREVIEW_PAGES_MAX (12) and says how many are left out; pages under 2 MB
// Fixture: the golden model (mcp/test-models/large-synthetic, made up), "Orders EN" (exec, second page), as the
// language-toggle suite makes it.   node test-0.3.1-twin-preview.mjs
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
const Preview = req0('../assets/js/page-preview.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const short = (x) => (x && x.err ? String(x.t).slice(0, 300) : JSON.stringify(x && x.j).slice(0, 300));
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-v1-')));
fs.cpSync(path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
const MP = 'large/Large Synthetic.SemanticModel', ORIG = path.join(ROOT, 'large/Orders EN.Report');
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, {});
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });

// the approval page of a plan (html, unescaped for reading), and its figures: { caption, svg, boxes: [{ x, y, w, h, kind }] }
const pageOf = async (pid) => { const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n); return { url, raw: url ? await req(url, 'GET') : '' }; };
const approve = async (url, pid) => { if (url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId: pid }); } };
const figures = (raw) => [...String(raw).matchAll(/<figure[^>]*>([\s\S]*?)<\/figure>/g)].map((m) => {
  const svg = (m[1].match(/<svg[\s\S]*?<\/svg>/) || [''])[0], cap = unesc(((m[1].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/) || ['', ''])[1]).replace(/<[^>]+>/g, ''));
  const boxes = [...svg.matchAll(/<g class="v" data-i="(\d+)" data-kind="([a-z]+)"[^>]*><rect class="box" x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map((b) => ({ i: +b[1], kind: b[2], x: +b[3], y: +b[4], w: +b[5], h: +b[6] }));
  const vb = (svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/) || []).slice(1).map(Number);
  return { caption: cap, svg, boxes, W: vb[0], H: vb[1] };
});
// a written page's drawn visuals (as the renderer takes them: not a group, not hidden, page positions), by box
const written = (dir, pid) => { const d = path.join(dir, 'definition/pages', pid, 'visuals'); const vs = fs.existsSync(d) ? fs.readdirSync(d).map((n) => rd(path.join(d, n, 'visual.json'))) : [];
  const by = new Map(vs.map((v) => [v.name, v]));
  return vs.filter((v) => !v.visualGroup && v.visual).map((v) => { let x = v.position.x, y = v.position.y, g = v.parentGroupName, hid = !!v.isHidden; while (g && by.has(g)) { const q = by.get(g); x += q.position.x; y += q.position.y; hid = hid || !!q.isHidden; g = q.parentGroupName; } return hid ? null : { x, y, w: v.position.width, h: v.position.height, type: v.visual.visualType }; }).filter(Boolean); };
const key = (b) => [b.x, b.y, b.w, b.h].map((v) => Math.round(v * 10) / 10).join(',');
const sameBoxes = (drawn, wr) => { const a = drawn.map(key).sort(), b = wr.map(key).sort(); return a.length === b.length && a.every((x, i) => x === b[i]); };
const diffBoxes = (drawn, wr) => { const a = drawn.map(key), b = wr.map(key); return { drawnOnly: a.filter((x) => !b.includes(x)).slice(0, 4), writtenOnly: b.filter((x) => !a.includes(x)).slice(0, 4), n: [a.length, b.length] }; };

try {
  // (0.3.1 TS1: filters at the start, so the charts are narrower: at the theme's 15pt titles, x 1.25 (was 18pt), V1-5's
  // 200-character title fitted two lines of the 1242-wide chart; beside the rail it does not)
  const pl = await s.call('plan_layout', { path: MP, focus: 'Web Orders', lang: 'en', layout: 'exec', filters: 'start', name: 'Orders EN', secondPage: true });
  const id0 = pl.j && pl.j.plan && pl.j.plan.planId;
  if (id0) await s.call('approve_plan', { planId: id0 });
  const en = id0 ? await s.call('create_report', { path: MP, focus: 'Web Orders', lang: 'en', name: 'Orders EN', planId: id0, design: pl.j.design }) : { err: true, t: 'no plan' };
  const ORDER = fs.existsSync(ORIG) ? rd(path.join(ORIG, 'definition/pages/pages.json')).pageOrder : [];
  const pageJ = (dir, pid) => rd(path.join(dir, 'definition/pages', pid, 'page.json'));
  const REPORT = ORDER.filter((pid) => pageJ(ORIG, pid).type !== 'Tooltip');
  chk(() => !en.err && ORDER.length === 4 && REPORT.length === 2, () => `set-up: "Orders EN" with 4 pages (2 report pages): ${short(en)} ${ORDER.length}`);
  const W0 = REPORT.length ? pageJ(ORIG, REPORT[0]).width : 1920;

  // labels: every listed text in Arabic; one chart title planted far too long for its box (V1-5)
  const p0 = await s.call('create_arabic_twin', { path: 'large/Orders EN.pbip' }), T0 = (p0.j && p0.j.texts) || [];
  let k = 0; const L = {}; T0.filter((t) => t.text != null).forEach((t) => { L[t.id] = t.draftArabic || (/\{1\}/.test(t.text) ? `أعلى {1} من {2}: نص ${++k}` : `نص ${++k}`); });
  // (a title of 200 characters, the most a label holds, on the narrowest chart of the report: two lines of its title can't
  // hold it, by the writer's own titleFit)
  const LONG = 'إجمالي المبيعات الشهرية لكل فرع من فروع الشركة في جميع المناطق والمدن خلال السنوات الماضية مقارنة بالأهداف المعتمدة لكل قسم وكل فريق ومقارنة بالعام السابق لكل منطقة ومدينة وفرع في الربع الأول'.slice(0, 200);
  const charts = REPORT.flatMap((p) => { const d = path.join(ORIG, 'definition/pages', p, 'visuals'); return fs.readdirSync(d).map((n) => rd(path.join(d, n, 'visual.json'))).filter((v) => v.visual && /Chart$/.test(v.visual.visualType)).map((v) => ({ id: `title:${p}/${v.name}`, w: v.position.width })); }).sort((a, b) => a.w - b.w);
  const planted = charts.map((c) => T0.find((t) => t.id === c.id && t.text != null && !/\{\d\}/.test(t.text))).find(Boolean);
  const LP = Object.assign({}, L, planted ? { [planted.id]: LONG } : {});

  // ---------- V1-5: the planted title ----------
  {
    const pp = planted ? await w.call('create_arabic_twin', { path: 'large/Orders EN.pbip', labels: LP }) : { err: true, t: 'no title text to plant' };
    const pidp = pp.j && pp.j.plan && pp.j.plan.planId, A = pidp ? await pageOf(pidp) : { raw: '' }, F = figures(A.raw);
    const flagged = F.filter((f) => /مقطوع|cut off/.test(f.caption) && /للفحص|to check/.test(f.caption));
    chk(() => F.length && flagged.length >= 1, () => `V1-5a. the figure with the planted Arabic title says it is to check (cut): ${F.map((f) => f.caption).join(' | ') || short(pp)}`);
    const pw = planted ? (charts.find((c) => c.id === planted.id) || {}).w : -1, cutAt = F.flatMap((f) => [...f.svg.matchAll(/<g class="flag" data-i="(\d+)" data-flag="cut">/g)].map((m) => (f.boxes.find((b) => b.i === +m[1]) || {}).w));
    chk(() => cutAt.some((x) => Math.abs(x - pw) < 0.06), () => `V1-5b. Preview.check's cut flag is drawn on the planted title's chart (${pw} wide): cut flags on boxes ${JSON.stringify(cutAt)}`);
  }

  // ---------- the separate twin ----------
  const p1 = await w.call('create_arabic_twin', { path: 'large/Orders EN.pbip', labels: L }), pid1 = p1.j && p1.j.plan && p1.j.plan.planId;
  const A1 = pid1 ? await pageOf(pid1) : { raw: '' }, F1 = figures(A1.raw);
  chk(() => F1.length === REPORT.length, () => `V1-1. the twin's approval page holds one preview figure per Arabic report page (${REPORT.length}): ${F1.length}`);
  chk(() => F1.length && F1.every((f) => /direction="ltr"/.test(f.svg)) && /<html lang="ar" dir="rtl"/.test(A1.raw) && /placeholders|عناصر نائبة/.test(unesc(A1.raw)), () => `V1-3a. each svg direction="ltr" in the rtl page, with the placeholders note: ${F1.map((f) => f.svg.slice(0, 160)).join(' | ')}`);
  chk(() => /The approval page shows each Arabic page as it will be written/.test(p1.t || ''), () => `V1-6a. the answer says the approval page shows each Arabic page: ${String(p1.t || '').slice(0, 200)}`);
  chk(() => !p1.err && p1.t.length < 40000, () => `V1-6b. the twin's answer under 40,000 characters: ${String(p1.t || '').length}`);
  // V1-7a: another set of labels than the approved one is refused, nothing written
  await approve(A1.url, pid1);
  const TWIN = path.join(ROOT, 'large/Orders EN AR.Report');
  const other = await w.call('create_arabic_twin', { path: 'large/Orders EN.pbip', planId: pid1, labels: Object.assign({}, L, { [Object.keys(L)[0]]: 'نص آخر' }) });
  chk(() => other.err && /these labels differ/.test(other.t) && !fs.existsSync(TWIN), () => `V1-7a. other labels than the approved ones are refused, nothing written: ${short(other)}`);
  const wr1 = pid1 ? await w.call('create_arabic_twin', { path: 'large/Orders EN.pbip', planId: pid1 }) : { err: true, t: 'no plan' };
  chk(() => !wr1.err && wr1.j.written === true && fs.existsSync(TWIN), () => `V1-7b. approve then write succeeds (the twin): ${short(wr1)}`);
  {
    const bad = REPORT.map((p, i) => (F1[i] && sameBoxes(F1[i].boxes, written(TWIN, p)) ? null : `${p}: ${JSON.stringify(F1[i] ? diffBoxes(F1[i].boxes, written(TWIN, p)) : 'no figure')}`)).filter(Boolean);
    chk(() => F1.length === REPORT.length && !bad.length, () => `V1-4a. each drawn box of the twin is the written visual.json's box: ${bad.join(' ; ')}`);
    // mirrored: most drawn Arabic boxes are an English box mirrored (x -> W - x - w)
    const mir = REPORT.map((p, i) => { const E = written(ORIG, p).map((b) => key({ x: W0 - b.x - b.w, y: b.y, w: b.w, h: b.h })), D = (F1[i] || { boxes: [] }).boxes; return D.length ? D.filter((b) => E.includes(key(b))).length / D.length : 0; });
    chk(() => mir.length && mir.every((r) => r >= 0.5), () => `V1-4b. the Arabic pages are drawn mirrored (share of boxes that are an English box mirrored): ${mir.map((r) => r.toFixed(2))}`);
  }

  // ---------- the copy, English and Arabic ----------
  const COPY = path.join(ROOT, 'large/Orders EN (EN-AR).Report');
  const p2 = await w.call('create_arabic_twin', { path: 'large/Orders EN.pbip', into: 'same', labels: L }), pid2 = p2.j && p2.j.plan && p2.j.plan.planId;
  const A2 = pid2 ? await pageOf(pid2) : { raw: '' }, F2 = figures(A2.raw), pairs = [...String(A2.raw).matchAll(/<div class="pair">/g)].length;
  chk(() => F2.length === 2 * REPORT.length && pairs === REPORT.length, () => `V1-2a. the copy's page holds ${REPORT.length} pairs, ${2 * REPORT.length} figures: ${pairs} pairs, ${F2.length} figures`);
  chk(() => F2.length === 4 && F2.every((f, i) => (i % 2 === 0 ? /English|الإنجليزية/ : /Arabic|العربية/).test(f.caption)), () => `V1-2b. each pair: the English page, then its Arabic page, labelled: ${F2.map((f) => f.caption).join(' | ')}`);
  chk(() => F2.length && F2.every((f) => /direction="ltr"/.test(f.svg)), () => 'V1-3b. the copy\'s svgs keep direction="ltr"');
  chk(() => /beside its English page/.test(p2.t || '') && /The approval page shows each Arabic page as it will be written/.test(p2.t || '') && p2.t.length < 40000, () => `V1-6c. the copy's answer says it, under 40,000 characters: ${String(p2.t || '').length}`);
  await approve(A2.url, pid2);
  const wr2 = pid2 ? await w.call('create_arabic_twin', { path: 'large/Orders EN.pbip', into: 'same', planId: pid2 }) : { err: true, t: 'no plan' };
  chk(() => !wr2.err && wr2.j.written === true && fs.existsSync(COPY), () => `V1-7c. approve then write succeeds (the copy): ${short(wr2)}`);
  {
    const ord = fs.existsSync(COPY) ? rd(path.join(COPY, 'definition/pages/pages.json')).pageOrder : [], arOf = Object.fromEntries(ORDER.map((p, i) => [p, ord[4 + i]]));
    const seq = REPORT.flatMap((p) => [p, arOf[p]]);
    const bad = seq.map((p, i) => (F2[i] && sameBoxes(F2[i].boxes, written(COPY, p)) ? null : `${p}: ${JSON.stringify(F2[i] ? diffBoxes(F2[i].boxes, written(COPY, p)) : 'no figure')}`)).filter(Boolean);
    chk(() => F2.length === seq.length && !bad.length, () => `V1-4c. each drawn box of the copy (English and Arabic pages, the language buttons too) is the written box: ${bad.join(' ; ')}`);
    const btn = F2.map((f) => f.boxes.filter((b) => b.kind === 'button').length), wbtn = seq.map((p) => written(COPY, p).filter((b) => b.type === 'actionButton').length);
    chk(() => F2.length && btn.every((n, i) => n === wbtn[i]) && seq.every((p, i) => written(ORIG, REPORT[Math.floor(i / 2)]).filter((b) => b.type === 'actionButton').length + 1 === written(COPY, p).filter((b) => b.type === 'actionButton').length),
      () => `V1-4d. each page draws its buttons, its language button with them: drawn ${btn}, written ${wbtn}`);
  }

  // ---------- V1-8: a 16-page report ----------
  {
    const MANY = path.join(ROOT, 'large/Many.Report'); fs.cpSync(ORIG, MANY, { recursive: true });
    const PJ = path.join(MANY, 'definition/pages/pages.json'), pj = rd(PJ), src = REPORT[0];
    for (let i = 0; i < 14; i++) { const id = crypto.createHash('sha256').update('v1-page-' + i).digest('hex').slice(0, 20); fs.cpSync(path.join(MANY, 'definition/pages', src), path.join(MANY, 'definition/pages', id), { recursive: true });
      const f = path.join(MANY, 'definition/pages', id, 'page.json'), j = rd(f); j.name = id; j.displayName = 'Copy ' + (i + 1); fs.writeFileSync(f, JSON.stringify(j, null, 2)); pj.pageOrder.push(id); }
    fs.writeFileSync(PJ, JSON.stringify(pj, null, 2));
    const shown = REPORT.length + 14;
    for (const into of ['separate', 'same']) {
      const p = await w.call('create_arabic_twin', Object.assign({ path: 'large/Many.Report' }, into === 'same' ? { into } : {})), pid = p.j && p.j.plan && p.j.plan.planId;
      const A = pid ? await pageOf(pid) : { raw: '' }, F = figures(A.raw), txt = unesc(A.raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const want = into === 'same' ? 24 : 12, left = shown - 12;
      // (FX1, the laptop's part 3: the twin's page wholly Arabic: the pages not drawn said in Arabic; changed on purpose)
      chk(() => F.length === want && new RegExp(`لم تُرسم هنا ${left} (من الصفحات|من أزواج الصفحات) أخرى`).test(txt), () => `V1-8 ${into}: at most 12 ${into === 'same' ? 'pairs' : 'pages'} drawn (${want} figures) and the ${left} left out said: ${F.length} figures; ${(txt.match(/.{0,80}not drawn.{0,80}/) || ['(no line)'])[0]}`);
      chk(() => A.raw.length > 1000 && Buffer.byteLength(A.raw, 'utf8') < 2 * 1024 * 1024 && !p.err && p.t.length < 40000, () => `V1-8 ${into}: the approval page under 2 MB and the answer under 40,000 characters: ${Buffer.byteLength(A.raw, 'utf8')} bytes, ${String(p.t || '').length} characters ${p.err ? p.t.slice(0, 200) : ''}`);
      console.log(`  V1-8 ${into}: approval page ${Buffer.byteLength(A.raw, 'utf8')} bytes, answer ${String(p.t || '').length} characters, ${F.length} figures`);
    }
  }
  // the renderer's own check on a page as the twin's preview gives it (the planted title): guard that Preview.check is the one used
  chk(() => typeof Preview.check === 'function', () => 'Preview.check is there');
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }
await s.close(); await w.close();
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL  twin-preview  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  twin-preview  ${checks} checks`);
