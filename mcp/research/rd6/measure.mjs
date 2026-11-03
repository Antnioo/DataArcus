// RD6 scratch: the prototype measured. Made-up reports only, all in os.tmpdir():
//   W  the writer's own reports (the SP7 suite's eight runs: node test-0.3.2-sp7.mjs leaves them in
//      <tmp>/dataarcus-sp7-*), their mobile.json removed, the prototype's layout compared with the writer's
//   F  the two fixture reports (twin-project, health-project): partial phone layouts, never touched
//   S  the twin-fuzz lab's 25 seeds (20261102..20261126), English as generated, and their Arabic twins
//      (create_arabic_twin's real plan / approve / write flow, as the fuzz suite runs it)
// For each: pages laid out or skipped (why), visuals placed or left off (why), PHONE_OVERLAP (report-rules.js) on the
// copy, each phone page's height, the time; and the copy check (redesign.mjs buildCopy + verifyCopy) as it is today and
// with a registry entry for the added mobile.json. node research/rd6/measure.mjs <sp7 folder> [--hidden own]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-rd6-')));
process.env.DATAARCUS_ROOT = ROOT;
const LC = require('../../../assets/js/layout-check.js');
const { phoneLayout, PW } = await import('./phone.mjs');
const { buildCopy, verifyCopy } = await import('../../lib/redesign.mjs');
const Gen = await import('./fuzz-gen.mjs');
const HIDDEN = process.argv.includes('--hidden') ? process.argv[process.argv.indexOf('--hidden') + 1] : 'stack';
const SP7 = process.argv[2];

const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const reportsIn = (d) => tree(d).filter((f) => /\.Report[\\/]definition\.pbir$/.test(f)).map((f) => path.dirname(f));
const read = (rep) => Object.fromEntries(tree(rep).map((f) => [path.relative(rep, f).split(path.sep).join('/'), fs.readFileSync(f)]));
const asFiles = (src) => Object.entries(src).map(([p, data]) => ({ path: 'R.Report/' + p, data }));
const overlaps = (src) => { const r = LC.checkProject(asFiles(src), {}); return r.problems.concat(r.worthALook).filter((f) => f.rule === 'PHONE_OVERLAP'); };
const json2 = (j) => Buffer.from(JSON.stringify(j, null, 2), 'utf8');

function run(label, src) {
  const t0 = process.hrtime.bigint();
  const inv = LC.inventoryOf(asFiles(src), {});
  const P = phoneLayout(inv, { hidden: HIDDEN });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const out = Object.assign({}, src); Object.entries(P.add).forEach(([r, j]) => { out[r] = json2(j); });
  const ov = overlaps(out), before = overlaps(src).length;
  // the copy check today: every mobile.json an added file (op add)
  const patches = Object.entries(P.add).map(([file, to]) => ({ op: 'add', file, to }));
  let today = 'passes';
  try { verifyCopy(src, buildCopy(src, patches), patches, null); } catch (e) { today = 'refused: ' + e.message.replace(/^Nothing was written: the copy check found /, '').replace(/\. The copy is not written\.$/, ''); }
  // with a registry entry "phone": each added file is a mobile.json beside an existing visual.json, on a page with
  // no mobile.json, holding $schema and position only; then today's check on everything else
  let registry = 'passes';
  try {
    const pagesWith = new Set(Object.keys(src).filter((r) => /\/mobile\.json$/.test(r)).map((r) => r.split('/visuals/')[0]));
    patches.forEach((x) => {
      if (!/^definition\/pages\/[^/]+\/visuals\/[^/]+\/mobile\.json$/.test(x.file)) throw new Error('not a mobile.json: ' + x.file);
      if (!(x.file.replace(/mobile\.json$/, 'visual.json') in src)) throw new Error('no visual beside ' + x.file);
      if (pagesWith.has(x.file.split('/visuals/')[0])) throw new Error('the page has a phone layout: ' + x.file);
      const keys = Object.keys(x.to).sort().join(','), pk = Object.keys(x.to.position).sort().join(',');
      if (keys !== '$schema,position' || !/^(height,)?(tabOrder,)?(width,)?/.test(pk) || !['x', 'y', 'z', 'width', 'height'].every((k) => Number.isFinite(x.to.position[k]))) throw new Error('more than a position: ' + x.file);
      if (x.to.position.x < -0.5 || x.to.position.x + x.to.position.width > PW + 0.5) throw new Error('outside the canvas: ' + x.file);
    });
    const copy = buildCopy(src, patches), srcPlus = Object.assign({}, src); patches.forEach((x) => { srcPlus[x.file] = copy[x.file]; });
    const c = verifyCopy(srcPlus, copy, [], null);
    registry = `passes (${c.filesByteIdentical} of the original's ${Object.keys(src).length} files byte-identical, ${patches.length} added)`;
  } catch (e) { registry = 'refused: ' + e.message; }
  const placed = P.pages.reduce((n, p) => n + p.placed, 0), left = P.pages.flatMap((p) => p.left);
  return { label, ms: +ms.toFixed(1), pages: P.pages, placed, left, overlaps: ov.length, overlapsBefore: before, overlapWhat: ov.slice(0, 2).map((f) => f.what), today, registry, add: P.add, inv };
}

const rows = [];
// ---- W: the writer's reports, mobile.json removed, compared with the writer's own ----
const cmp = [];
if (SP7) for (const rep of reportsIn(SP7).filter((r) => !/Twin Sales|Health Test/.test(r))) {
  const src = read(rep), stripped = Object.fromEntries(Object.entries(src).filter(([r]) => !/\/mobile\.json$/.test(r)));
  const r = run('W ' + path.basename(rep), stripped); rows.push(r);
  // the writer's boxes vs the prototype's, visual by visual (non-group)
  let same = 0, sameY = 0, total = 0, missing = 0, extra = 0;
  Object.keys(src).filter((k) => /\/mobile\.json$/.test(k)).forEach((k) => {
    const vj = JSON.parse(src[k.replace(/mobile\.json$/, 'visual.json')]); if (vj.visualGroup) return;
    total++; const w = JSON.parse(src[k]).position, p = r.add[k] && r.add[k].position;
    if (!p) { missing++; return; }
    if (['x', 'y', 'width', 'height'].every((q) => Math.abs(w[q] - p[q]) <= 0.5)) same++;
    if (Math.abs(w.width - p.width) <= 0.5 && Math.abs(w.height - p.height) <= 0.5 && Math.abs(w.x - p.x) <= 0.5) sameY++;
  });
  extra = Object.keys(r.add).filter((k) => !(k in src) && !JSON.parse(src[k.replace(/mobile\.json$/, 'visual.json')]).visualGroup).length;
  cmp.push({ report: path.basename(rep), writerBoxes: total, sameBox: same, sameSizeAndX: sameY, notPlaced: missing, placedWriterLeftOff: extra, writerOverlaps: overlaps(src).length });
}
// ---- F: the fixtures ----
for (const f of ['twin-project', 'health-project']) for (const rep of reportsIn(path.join(import.meta.dirname, '..', '..', 'fixtures', f))) rows.push(run('F ' + path.basename(rep), read(rep)));
// ---- S: the 25 seeds, English and their Arabic twins ----
const twinErr = [];
for (let i = 0; i < 25; i++) {
  const seed = 20261102 + i, spec = Gen.generate(seed);
  let tw; try { tw = await Gen.writeTwin(spec, 'seed' + seed); } catch (e) { twinErr.push(seed + ': ' + String(e.message).slice(0, 120)); const d = path.join(ROOT, 'seed' + seed); if (!fs.existsSync(path.join(d, 'Synthetic.Report'))) { fs.mkdirSync(d, { recursive: true }); Gen.materialize(spec, d); } }
  const d = path.join(ROOT, 'seed' + seed);
  reportsIn(d).forEach((rep) => rows.push(run((/Synthetic\.Report$/.test(rep) ? 'S-EN ' : 'S-AR ') + seed, read(rep))));
}

// ---- B: bookmark pairs: three seeds with a hidden table on the box of each of their first two charts (a bookmark
// swaps chart and table, as Microsoft's docs describe: the auto-create places hidden visuals so bookmarks still work)
for (const seed of [20261104, 20261110, 20261117]) {
  const spec = Gen.generate(seed); let n = 0;
  spec.pages.filter((p) => !p.tooltip).forEach((p) => { p.visuals.filter((v) => v.visual && /Chart$/.test(v.visual.visualType) && !v.parentGroupName).slice(0, 2).forEach((v) => {
    const h = JSON.parse(JSON.stringify(v)); h.name = 'hid' + (n++); h.isHidden = true; h.visual.visualType = 'tableEx'; h.position.z = v.position.z + 1; p.visuals.push(h); }); });
  const d = path.join(ROOT, 'bm' + seed); fs.mkdirSync(d, { recursive: true }); Gen.materialize(spec, d);
  reportsIn(d).forEach((rep) => rows.push(run('B ' + seed + ' (' + n + ' hidden)', read(rep))));
}
// ---- the summary ----
const sum = (rs) => {
  const pages = rs.flatMap((r) => r.pages), laid = pages.filter((p) => !p.skipped), hs = laid.map((p) => p.height).sort((a, b) => a - b);
  const leftWhy = {}; rs.flatMap((r) => r.left).forEach((l) => { const k = l.why.split(':')[0]; leftWhy[k] = (leftWhy[k] || 0) + 1; });
  const skipWhy = {}; pages.filter((p) => p.skipped).forEach((p) => { skipWhy[p.skipped] = (skipWhy[p.skipped] || 0) + 1; });
  const ms = rs.map((r) => r.ms).sort((a, b) => a - b);
  return { reports: rs.length, pages: pages.length, laidOut: laid.length, rtlPages: laid.filter((p) => p.rtl).length, skipped: skipWhy,
    visualsPlaced: rs.reduce((n, r) => n + r.placed, 0), leftOff: leftWhy, stackedHidden: laid.reduce((n, p) => n + p.stacked, 0),
    phoneOverlapFindings: rs.reduce((n, r) => n + r.overlaps, 0), reportsWithOverlap: rs.filter((r) => r.overlaps).map((r) => r.label + ' ' + r.overlaps + ': ' + r.overlapWhat[0]),
    height: hs.length ? { min: hs[0], median: hs[Math.floor(hs.length / 2)], max: hs[hs.length - 1] } : null,
    ms: { median: ms[Math.floor(ms.length / 2)], max: ms[ms.length - 1] },
    copyTodayRefused: rs.filter((r) => /^refused/.test(r.today)).length + ' of ' + rs.length, copyToday: [...new Set(rs.map((r) => r.today.replace(/\(e\.g\. .*\)/, '(e.g. a mobile.json)')))], copyWithRegistry: rs.filter((r) => /^passes/.test(r.registry)).length + ' of ' + rs.length + ' pass' + (rs.some((r) => !/^passes/.test(r.registry)) ? '; ' + rs.filter((r) => !/^passes/.test(r.registry)).map((r) => r.label + ': ' + r.registry).slice(0, 2).join('; ') : '') };
};
const by = (p) => rows.filter((r) => r.label.startsWith(p));
const result = { hidden: HIDDEN, W: sum(by('W ')), writerCompare: cmp, F: sum(by('F ')), F_pages: by('F ').map((r) => ({ report: r.label, pages: r.pages.map((p) => ({ name: p.name, skipped: p.skipped || null, placed: p.placed, height: p.height })) })), SEN: sum(by('S-EN')), SAR: sum(by('S-AR')), B: sum(by('B ')), twinErrors: twinErr };
console.log(JSON.stringify(result, null, 1));
fs.rmSync(ROOT, { recursive: true, force: true });
