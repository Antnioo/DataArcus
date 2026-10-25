// K2 (0.3.1, wave 6; an outside architecture review of 25 Oct, verified by the reviewer in the code; written red
// first): create_arabic_twin wrote a rebuild of its plan (planTwin called again at the write, a new .platform logical id,
// no digest compared), so "the write writes exactly the approved files" held for create_report only. Now the plan keeps
// the exact files (the twin's or the EN-AR copy's, the month script, the .pbip) with their digest, the approval records
// their binding, and the write writes those bytes, after a rebuild for comparison whose digest must be the same.
//   K2-1  the separate twin: the written tree's sha (digestOf over the files on disk) is the plan's digest; the answer
//         says it; .platform's logical id is the one chosen at plan time
//   K2-2  the same for the copy into "same"
//   K2-3  a change no print sees (the month script's file in the project folder, removed after the go): nothing written
//   K2-4  the other way (a file of that name appears with other text): nothing written, said as the digest's refusal
//   K2-5  the approval page's pictures are drawn from the kept files (every kept page, its boxes the kept visual.json's)
//   K2-6  "Not fully Arabic": one line (EN and AR) in the plan, the write's answer and the approval page, naming only what
//         this report has; none for a report with nothing of it
// In process: the tool's own handler (tools/create_arabic_twin.mjs) and the gate (lib/plans.mjs), the approval given
// as the window's click gives it. Fixture: mcp/fixtures/twin-project (made up).   node test-0.3.1-twin-artifact.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);

// the working folder first: the library modules read DATAARCUS_ROOT when they are loaded
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-k2-')));
process.env.DATAARCUS_ROOT = ROOT;
const fresh = (name) => { fs.rmSync(path.join(ROOT, name), { recursive: true, force: true }); fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(ROOT, name), { recursive: true }); };

const Plans = await import('./lib/plans.mjs');
const { digestOf } = await import('./lib/artifact.mjs');
const { planTwin } = await import('./lib/arabic-twin.mjs');
const { summary } = await import('./lib/approval-window.mjs');
const { register } = await import('./tools/create_arabic_twin.mjs');
let handler = null;
register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal's words */ } return { err: !!r.isError, t, j }; };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
// the files written into the project folder, as digestOf reads a tree: paths from the project folder, '/' between parts
const onDisk = (dir, names) => names.flatMap((n) => { const f = path.join(dir, n); return fs.existsSync(f) && fs.statSync(f).isDirectory() ? tree(f) : fs.existsSync(f) ? [f] : []; })
  .map((f) => ({ path: path.relative(dir, f).split(path.sep).join('/'), data: fs.readFileSync(f) }));
const planned = async (a) => { const p = await call(a), id = p.j && p.j.plan && p.j.plan.planId; return { p, id, art: id ? Plans.artifactOf(id) : null }; };
const approve = (id) => Plans.approve(id, 'user-in-browser');
const logicalId = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')).config.logicalId; } catch (e) { return null; } };

try {
  // K2-1: the separate twin
  {
    fresh('a');
    const P = 'a/Twin Sales.pbip', D = path.join(ROOT, 'a');
    const { p, id, art } = await planned({ path: P });
    chk(() => id && art && /^[0-9a-f]{64}$/.test(art.digest) && p.j.exact && p.j.exact.digest === art.digest, () => `K2-1a. the twin's plan keeps its exact files and says their digest: ${short(p)}`);
    chk(() => art.logicalId && art.files.some((f) => f.path === 'Twin Sales AR.Report/.platform' && JSON.parse(String(f.data)).config.logicalId === art.logicalId), () => 'K2-1b. the kept .platform holds the logical id chosen at plan time');
    approve(id);
    const w = await call({ path: P, planId: id });
    const names = ['Twin Sales AR.Report', 'Twin Sales AR.pbip', 'Twin Sales AR - Arabic calendar.tmdl'], disk = onDisk(D, names);
    chk(() => !w.err && w.j.written, () => `K2-1c. the approved twin is written: ${short(w)}`);
    chk(() => disk.length === art.files.length && digestOf(disk) === art.digest, () => `K2-1d. the written tree's sha is the plan's digest: ${disk.length} files on disk, ${art && art.files.length} kept; ${digestOf(disk)} vs ${art && art.digest}`);
    chk(() => w.j.exact && w.j.exact.digest === art.digest, () => `K2-1e. the write's answer says the digest it wrote: ${short(w)}`);
    chk(() => logicalId(path.join(D, 'Twin Sales AR.Report/.platform')) === art.logicalId, () => 'K2-1f. the written .platform\'s logical id is the plan\'s');
  }
  // K2-2: the copy into "same"
  {
    fresh('b');
    const P = 'b/Twin Sales.pbip', D = path.join(ROOT, 'b');
    const { p, id, art } = await planned({ path: P, into: 'same' });
    chk(() => id && art && p.j.exact && p.j.exact.digest === art.digest, () => `K2-2a. the copy's plan keeps its exact files: ${short(p)}`);
    approve(id);
    const w = await call({ path: P, planId: id, into: 'same' });
    const disk = onDisk(D, ['Twin Sales (EN-AR).Report', 'Twin Sales (EN-AR).pbip', 'Twin Sales (EN-AR) - Arabic calendar.tmdl']);
    chk(() => !w.err && w.j.written && disk.length === art.files.length && digestOf(disk) === art.digest, () => `K2-2b. the written copy's sha is the plan's digest: ${short(w)}; ${disk.length} on disk, ${art && art.files.length} kept`);
    chk(() => logicalId(path.join(D, 'Twin Sales (EN-AR).Report/.platform')) === art.logicalId, () => 'K2-2c. the copy\'s .platform logical id is the plan\'s');
  }
  // K2-3: at plan time the month script is already there with the same text (so the plan does not write it); removed
  // after the go: neither print sees it, the rebuild would write the script: refused, nothing written
  {
    fresh('c');
    const P = 'c/Twin Sales.pbip', D = path.join(ROOT, 'c'), script = path.join(D, 'Twin Sales AR - Arabic calendar.tmdl');
    fs.writeFileSync(script, planTwin({ path: P }).month.script);
    const { id, art } = await planned({ path: P });
    chk(() => art && !art.files.some((f) => /\.tmdl$/.test(f.path)), () => 'K2-3a. a script already there with the same text is not in the kept files');
    approve(id);
    fs.rmSync(script);
    const w = await call({ path: P, planId: id });
    chk(() => w.err && /^Nothing was written/.test(w.t) && /approved/.test(w.t), () => `K2-3b. a change the prints don't see is refused: ${short(w)}`);
    chk(() => !fs.existsSync(path.join(D, 'Twin Sales AR.Report')) && !fs.existsSync(path.join(D, 'Twin Sales AR.pbip')) && !fs.existsSync(script), () => 'K2-3c. nothing was written');
  }
  // K2-4: a file of the script's name appears after the go, with other text: the digest's refusal (not the writer's)
  {
    fresh('d');
    const P = 'd/Twin Sales.pbip', D = path.join(ROOT, 'd'), script = path.join(D, 'Twin Sales AR - Arabic calendar.tmdl');
    const { id } = await planned({ path: P });
    approve(id);
    fs.writeFileSync(script, '// someone else\'s file\n');
    const w = await call({ path: P, planId: id });
    chk(() => w.err && /^Nothing was written: the twin built again now is not the one that was approved/.test(w.t), () => `K2-4a. refused by the digest comparison: ${short(w)}`);
    chk(() => !fs.existsSync(path.join(D, 'Twin Sales AR.Report')) && !fs.existsSync(path.join(D, 'Twin Sales AR 2 - Arabic calendar.tmdl')) && fs.readFileSync(script, 'utf8') === '// someone else\'s file\n', () => 'K2-4b. nothing was written, the other file untouched');
  }
  // K2-5: the approval page's pictures, from the kept files
  {
    fresh('e');
    const { id, art } = await planned({ path: 'e/Twin Sales.pbip' });
    const pv = (Plans.planOf(id).data || {}).preview, pre = 'Twin Sales AR.Report/definition/pages/';
    const keptPage = (pid) => art.files.filter((f) => f.path.startsWith(pre + pid + '/visuals/') && /visual\.json$/.test(f.path)).map((f) => JSON.parse(String(f.data))).filter((v) => v.visual && !v.visualGroup && !v.parentGroupName && !v.isHidden);
    chk(() => pv && pv.pages.length >= 2 && pv.pages.every((pg) => art.files.some((f) => f.path === pre + pg.id + '/page.json')), () => `K2-5a. every drawn page is a kept page: ${JSON.stringify(pv && pv.pages.map((x) => x.id))}`);
    chk(() => pv.pages.every((pg) => { const k = keptPage(pg.id).map((v) => [v.position.x, v.position.y].join()).sort(); return k.every((xy) => pg.visuals.some((b) => [b.x, b.y].join() === xy)); }), () => 'K2-5b. each drawn page\'s top-level boxes are the kept visual.json\'s');
  }
  // K2-6: "Not fully Arabic", for this report only
  {
    fresh('f');
    const { p, id } = await planned({ path: 'f/Twin Sales.pbip' });
    const N = p.j && p.j.notFullyArabic;
    chk(() => N && /^Not fully Arabic: /.test(N.en) && /from the model/.test(N.en) && /custom visual/.test(N.en) && !/matri/.test(N.en) && !/DAX/.test(N.en) && !/switcher|field parameter/.test(N.en), () => `K2-6a. the plan's line names what this report has (model texts, a custom visual), nothing else: ${JSON.stringify(N)}`);
    chk(() => /^ليست عربية بالكامل: /.test(N.ar), () => `K2-6b. and in Arabic: ${JSON.stringify(N)}`);
    const S = summary('twin', Plans.planOf(id).data), sec = (S.sections || []).find((x) => /Not fully Arabic/.test(x.heading));
    chk(() => sec && sec.rows.some((r) => r[1] === N.ar) && sec.rows.some((r) => r[1] === N.en), () => `K2-6c. the approval page says it: ${JSON.stringify(sec)}`);
    approve(id);
    const w = await call({ path: 'f/Twin Sales.pbip', planId: id });
    chk(() => w.j && w.j.notFullyArabic && w.j.notFullyArabic.en === N.en, () => `K2-6d. the write's answer says it too: ${short(w)}`);
    // a report with no visual: nothing applies, no line
    fresh('g');
    for (const pg of fs.readdirSync(path.join(ROOT, 'g/Twin Sales.Report/definition/pages')).filter((n) => !/\.json$/.test(n))) fs.rmSync(path.join(ROOT, 'g/Twin Sales.Report/definition/pages', pg, 'visuals'), { recursive: true, force: true });
    fs.rmSync(path.join(ROOT, 'g/Twin Sales.Report/definition/bookmarks'), { recursive: true, force: true });
    const q = await call({ path: 'g/Twin Sales.pbip' });
    chk(() => q.j && q.j.plan && !('notFullyArabic' in q.j), () => `K2-6e. no line when nothing applies: ${short(q)}`);
  }
} finally {
  fs.rmSync(ROOT, { recursive: true, force: true });
}
if (problems.length) { problems.forEach((p) => console.log('  x ' + p)); console.log(`FAIL  twin-artifact  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  twin-artifact  ${checks} checks`);
