// 0.3.1 RD1 (the owner, 26 Oct: "replaces all custom visuals with native ones and clean up the clutter"): the two defects
// NC1's lab found in the redesign (mcp/work/NC1.md "Seen, not in scope" 6 and 7), on the lab's own report
// (mcp/lab/custom-visuals-lab.mjs, its native copy written by the laptop's driver) and small fixtures made from it.
// Written red first (df14c65): the native copy's redesign named as the original's; page 1's rows touching at 248.
//   N1  nameFor keeps DataArcus's suffixes and cuts the stem: "Gulf Retail Review native" -> "Gulf Retail native
//       redesigned", never the original's "Gulf Retail Review redesigned"
//   N2  the plan says the final name; the original's redesign there does not stop the native copy's
//   N3  a whole name taken is refused, as before; a cut name taken gets a number
//   G1  the lab's native copy redesigned: every vertical gap 16 (rows never touch), the page's margins 16 (sides,
//       bottom), what stays (text boxes, shapes, the networks) untouched and 16 or more from what moves
//   G2  a shape beside a row: the row keeps 16 from it, and the plan says the margin was not kept because of it
//   G3  keepPositions: nothing moves
//   node test-0.3.1-rd1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const TMP = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-rd1-')));
const W = path.join(TMP, 'work'), LAB = path.join(W, 'lab');
// the modules read DATAARCUS_ROOT when they load: set before they are imported
process.env.DATAARCUS_ROOT = W;
const HERE = path.dirname(fileURLToPath(import.meta.url));   // (not URL.pathname: "/D:/..." on Windows)
const rdj = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const copyDir = (a, b) => fs.cpSync(a, b, { recursive: true });

try {
  const { run } = await import('./lab/custom-visuals-run.mjs');
  const Lab = await import('./lab/custom-visuals-lab.mjs');
  const R = await import('./lib/redesign.mjs'), M = await import('./lib/model.mjs');
  await run(path.join(HERE, 'server.mjs'), W);
  const model = M.refuseUnreadable(M.loadModel('lab'));
  const plan = (rel, opts) => R.planRedesign('lab/' + rel, model, opts || {});
  const NAT = Lab.NAME + ' native.Report';
  // (the driver wrote the native copy's redesign: taken out, so the plans here are the first)
  fs.rmSync(path.join(LAB, Lab.NAME + ' native redesigned.Report'), { recursive: true }); fs.rmSync(path.join(LAB, Lab.NAME + ' native redesigned.pbip'));

  // ---------- N1: the name ----------
  const n = ['Gulf Retail Review native', 'Gulf Retail Review', 'Twin Sales', 'Quarterly Sales Performance Overview', 'Sales Performance Overview (EN-AR)'].map((x) => R.nameFor(x));
  chk(() => n[0] === 'Gulf Retail native redesigned' && n[1] === 'Gulf Retail Review redesigned' && n[2] === 'Twin Sales redesigned' && n[3] === 'Quarterly Sales redesigned' && n[4] === 'Sales (EN-AR) redesigned' && n.every((x) => Array.from(x).length <= R.NAME_MAX),
    () => `N1. the stem is cut, the suffixes stay (" native", " (EN-AR)", " redesigned"), within 30: ${JSON.stringify(n)}`);
  chk(() => new Set(n.slice(0, 2)).size === 2, () => 'N1b. the native copy\'s redesign and the original\'s get two names');

  // ---------- N2: the lab under a longer name, the original's redesign already there ----------
  copyDir(path.join(LAB, Lab.NAME + '.Report'), path.join(LAB, 'Gulf Retail Review.Report'));
  copyDir(path.join(LAB, NAT), path.join(LAB, 'Gulf Retail Review native.Report'));
  fs.mkdirSync(path.join(LAB, 'Gulf Retail Review redesigned.Report'));
  const p2 = plan('Gulf Retail Review native.Report');
  chk(() => p2.name === 'Gulf Retail native redesigned' && p2.answer.newReport === 'Gulf Retail native redesigned.Report' && !p2.problems.length && /cut/.test(p2.answer.nameCut || '') && p2.answer.nameCut.includes('Gulf Retail native redesigned'),
    () => `N2. the native copy's redesign: its own name, said in the plan, the original's redesign beside it no obstacle: ${JSON.stringify([p2.name, p2.answer.nameCut, p2.problems])}`);

  // ---------- N3: taken ----------
  const p3 = plan('Gulf Retail Review.Report');
  chk(() => p3.name === 'Gulf Retail Review redesigned' && p3.problems.some((x) => /already there/.test(x)) && !p3.answer.nameCut,
    () => `N3. a whole name taken (this report's own redesign): refused, as before: ${JSON.stringify([p3.name, p3.problems])}`);
  copyDir(path.join(LAB, Lab.NAME + '.Report'), path.join(LAB, 'Gulf Retail Quarterly Review.Report'));
  fs.mkdirSync(path.join(LAB, 'Gulf Retail redesigned.Report'));
  const p3b = plan('Gulf Retail Quarterly Review.Report');
  chk(() => p3b.name === 'Gulf Retail redesigned 2' && !p3b.problems.some((x) => /already there/.test(x)) && /"Gulf Retail redesigned 2"/.test(p3b.answer.nameCut || ''),
    () => `N3b. a cut name that is another report's: a number, said: ${JSON.stringify([p3b.name, p3b.answer.nameCut, p3b.problems])}`);

  // ---------- G1: the lab's native copy on the grid ----------
  const boxesOf = (P) => P.answer.pages.map((pg) => {
    const all = pg.changes.concat(pg.notChanged).flatMap((x) => [x].concat(x.overlays || []));
    return { page: pg.id, list: all.map((x) => { const [xy, wh] = (x.place || '').split(' '), [px, py] = xy.split(',').map(Number), [pw, ph] = wh.split('x').map(Number); const was = { x: px, y: py, w: pw, h: ph }; return { name: x.visual, type: x.type, moved: !!x.to, was, ...(x.to || was) }; }) };
  });
  const g = plan(NAT), pages = boxesOf(g);
  const xo = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.5;
  // each moved box's gap to the nearest box above it (overlapping in x): 16 when it was within 32 of it (a gap of 0
  // to 31 in the original), 16 or more when it was farther
  const gaps = pages.map(({ page, list }) => ({ page, gaps: list.filter((v) => v.moved).map((v) => { const up = list.filter((o) => o !== v && xo(o, v) && o.y + o.h <= v.y + 0.5); if (!up.length) return null; const o = up.sort((a, b) => (b.y + b.h) - (a.y + a.h))[0]; return [v.y - (o.y + o.h), v.was.y - (o.was.y + o.was.h)]; }).filter((x) => x != null) }));
  chk(() => !g.problems.length && gaps.every((x) => x.gaps.length && x.gaps.every(([now, was]) => (was < 32 ? now === 16 : now >= 16))), () => `G1a. every vertical gap on the grid is 16 (was 0 on page 1, 8 to 31 elsewhere) [now, was]: ${JSON.stringify(gaps)}`);
  const p1 = pages[0].list, by = (nm) => p1.find((v) => v.name === nm);
  chk(() => by('lineMonth').y - (by('cardSales').y + by('cardSales').h) === 16 && by('cardOrders').y === by('cvKpiTile').y, () => `G1b. page 1: row 2 starts 16 below row 1 (they touched at 248): ${JSON.stringify([by('cardSales'), by('lineMonth')])}`);
  const touching = pages.flatMap(({ page, list }) => list.flatMap((a, i) => list.slice(i + 1).filter((b) => (a.moved || b.moved) && xo(a, b) && (Math.abs(a.y + a.h - b.y) < 16 || Math.abs(b.y + b.h - a.y) < 16) && !(a.y < b.y + b.h && b.y < a.y + a.h)).map((b) => `${page}: ${a.name}/${b.name}`)));
  chk(() => !touching.length, () => `G1c. nothing that moves sits closer than 16 above or below anything: ${JSON.stringify(touching)}`);
  const edges = pages.map(({ page, list }) => { const m = list.filter((v) => v.moved); return { page, left: Math.min(...m.map((v) => v.x)), right: Math.max(...m.map((v) => v.x + v.w)), bottom: Math.max(...m.map((v) => v.y + v.h)) }; });
  chk(() => edges.every((e) => e.left === 16 && e.right === 1264 && e.bottom === 704), () => `G1d. the page's margins 16 (left, right, bottom): ${JSON.stringify(edges)}`);
  const stay = pages.flatMap(({ list }) => list.filter((v) => ['textbox', 'shape'].includes(v.type) || /^custom /.test(v.type)));
  chk(() => stay.length === 12 && stay.every((v) => !v.moved), () => `G1e. the 5 text boxes, 5 shapes and 2 networks stay where they are: ${JSON.stringify(stay.filter((v) => v.moved))}`);
  chk(() => g.answer.pages.every((pg) => !pg.margins), () => `G1f. no margin lost on the lab: ${JSON.stringify(g.answer.pages.map((pg) => pg.margins || null))}`);

  // ---------- G2: a shape beside a row (the lab's page 4, its band made a bar at the left) ----------
  copyDir(path.join(LAB, NAT), path.join(LAB, 'Margin Lab.Report'));
  const bf = path.join(LAB, 'Margin Lab.Report', 'definition/pages/p4calendar/visuals/band/visual.json'), bj = rdj(bf);
  Object.assign(bj.position, { x: 0, y: 150, width: 10, height: 330 }); fs.writeFileSync(bf, JSON.stringify(bj, null, 2));
  const m = plan('Margin Lab.Report'), p4 = m.answer.pages.find((pg) => pg.id === 'p4calendar'), heat = (p4.changes.find((c) => c.visual === 'cvCalendarHeat') || {}).to;
  chk(() => !m.problems.length && heat && heat.x === 26 && (p4.margins || []).length === 1 && /left of cvCalendarHeat, colWeekday: band \(shape\)/.test(p4.margins[0]) && /16 from it, 26 from the page's edge/.test(p4.margins[0]),
    () => `G2. the row keeps 16 from the bar beside it and the plan says the margin was not kept because of it: ${JSON.stringify([heat, p4.margins])}`);
  chk(() => m.answer.pages.filter((pg) => pg.id !== 'p4calendar').every((pg) => !pg.margins), () => 'G2b. only page 4 says a margin was not kept');

  // ---------- G3: keepPositions ----------
  const k = plan(NAT, { keepPositions: true });
  chk(() => !k.problems.length && !k.patches.some((x) => /^\/position\//.test(x.pointer || '')) && k.answer.counts.changed === 0, () => `G3. keepPositions: no position changes: ${JSON.stringify(k.answer.counts)}`);
} catch (e) { checks++; problems.push('stopped: ' + String(e && e.stack || e).slice(0, 600)); }
finally { fs.rmSync(TMP, { recursive: true, force: true }); }
if (problems.length) { console.log(`FAIL script=test-0.3.1-rd1.mjs cause=${problems[0].slice(0, 160)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  rd1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  rd1  ${checks} checks`);
