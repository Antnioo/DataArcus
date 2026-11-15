// 0.3.3 LK1 (the night audit's AUD-057, B-415; written red first on f3c1b7e1). Made-up names and markers only (no
// employer or client data), on copies of mcp/fixtures/twin-project. In process: read_report's and check_report's own
// registered handlers. DataArcus never follows a link; this pins only what the answers SAY about one.
//   A  the audit's case: p1overview's visuals folder is a link to a folder outside. read_report's PAGE line says
//      "visuals not read: its folder is a link" (never "0 visuals"); every other PAGE line is byte for byte the unlinked
//      copy's; both answers name the link once ("definition/pages/p1overview/visuals") and count 1; a marker visual in
//      the linked folder never appears in either answer (nothing read through the link)
//   P  a page.json that is a link (the audit's P1): still left out, now named, counted once in both answers
//   S  a linked folder on the way to a file (StaticResources: the theme behind it): the folder is named, counted once
//   C  12 links (the cap): 10 named, sorted (made out of order), then "and 2 more"; the count is 12 in both answers
//   D  the one helper: both answers' named lists come from read-report.mjs's linksSaid (no second copy)
// Where it proves what: a directory link is a symbolic link on Linux and macOS and a junction on Windows (as
// test-0.3.1-audit-readers.mjs makes them); a file link (P) needs symlink rights on Windows: without them P is skipped,
// and this suite says so in its output. The rest runs everywhere.
//   node test-0.3.3-lk1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0; const skipped = [];
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

// the working folder first: the library modules read DATAARCUS_ROOT when they are loaded
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-lk1-')));
const OUT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-lk1-outside-')));
process.env.DATAARCUS_ROOT = ROOT;
const BASE = 'Twin Sales', FIX = path.join(HERE, 'fixtures/twin-project');
const fresh = (dir) => { fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true }); fs.cpSync(FIX, path.join(ROOT, dir), { recursive: true }); return path.join(ROOT, dir); };
const PAGES = (dir) => path.join(ROOT, dir, BASE + '.Report/definition/pages');
const linkDir = (target, at) => fs.symlinkSync(target, at, process.platform === 'win32' ? 'junction' : 'dir');
const MARK = 'lk1MarkerZq7';

const { LIMITS } = await import('./lib/tool-limits.mjs');
const handlers = {};
for (const t of ['read_report', 'check_report']) {
  const { register } = await import(`./tools/${t}.mjs`);
  register({ registerTool: (name, def, h) => { handlers[name] = h; } }, { LIMITS });
}
const call = async (name, a) => { try { const r = await handlers[name](a), t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* words */ } return { err: !!r.isError, t, j }; } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
const short = (s) => String(s || '').slice(0, 300);
const pageLines = (t) => t.split('\n').filter((l) => l.startsWith('PAGE '));
const notReadLine = (t) => t.split('\n').find((l) => l.startsWith('NOT READ ')) || '';
const linksEntry = (j) => ((j && j.notChecked) || []).find((n) => n.rule === 'links');
const validatorWhy = (j) => String(((j && j.validator) || {}).why || '');

// ---- A: the audit's exact case ----
fresh('plain');
const plainRR = await call('read_report', { path: path.join(ROOT, 'plain', BASE + '.pbip') });
fresh('a');
const vis = path.join(PAGES('a'), 'p1overview/visuals');
fs.renameSync(vis, path.join(OUT, 'visuals-a'));
// a marker visual inside the linked folder: if anything were read through the link, its name would show
fs.mkdirSync(path.join(OUT, 'visuals-a', MARK));
fs.writeFileSync(path.join(OUT, 'visuals-a', MARK, 'visual.json'), JSON.stringify({ name: MARK, position: { x: 1, y: 1, width: 10, height: 10, z: 0 }, visual: { visualType: 'card' } }));
linkDir(path.join(OUT, 'visuals-a'), vis);
const aP = path.join(ROOT, 'a', BASE + '.pbip');
const aRR = await call('read_report', { path: aP }), aCR = await call('check_report', { path: aP }), aJS = await call('read_report', { path: aP, format: 'json' });
const VIS_REL = 'definition/pages/p1overview/visuals';
chk(() => !plainRR.err && !aRR.err && !aCR.err && !aJS.err, () => `A0 the answers came back: ${short(aRR.t)} | ${short(aCR.t)}`);
const aPages = pageLines(aRR.t), plainPages = pageLines(plainRR.t);
chk(() => aPages[0].endsWith(' | visuals not read: its folder is a link'), () => `A1 page 1's line names the linked folder: ${aPages[0]}`);
chk(() => !/\| 0 visuals/.test(aRR.t), () => `A2 no page reads "| 0 visuals": ${aPages.join(' // ')}`);
chk(() => aPages.length === plainPages.length && aPages.length > 1 && aPages.slice(1).every((l, i) => l === plainPages[i + 1]), () => `A3 every other PAGE line byte for byte the unlinked copy's: ${aPages.slice(1).join(' // ')} vs ${plainPages.slice(1).join(' // ')}`);
chk(() => aPages[0].startsWith(plainPages[0].replace(/ \| \d+ visuals$/, '')), () => `A4 page 1's head is unchanged: ${aPages[0]} vs ${plainPages[0]}`);
chk(() => notReadLine(aRR.t) === `NOT READ 1 link(s) never followed: "${VIS_REL}"`, () => `A5 read_report's NOT READ names the one link: ${notReadLine(aRR.t)}`);
chk(() => !/file\(s\) that are links/.test(aRR.t), () => 'A6 a folder is never called "file(s)"');
const aL = linksEntry(aCR.j);
chk(() => aL && /^1 file or folder is a link\b/.test(aL.why) && aL.why.includes(`"${VIS_REL}"`), () => `A7 check_report's notChecked counts 1 and names it: ${aL && aL.why}`);
chk(() => /the report holds 1 link\b/.test(validatorWhy(aCR.j)) && validatorWhy(aCR.j).includes(`"${VIS_REL}"`), () => `A8 the validator's reason counts 1 and names it: ${validatorWhy(aCR.j)}`);
chk(() => !aRR.t.includes(MARK) && !aCR.t.includes(MARK) && !aJS.t.includes(MARK), () => 'A9 nothing read through the link: the marker visual never appears');
chk(() => aJS.j && aJS.j.pages[0].visualsNotRead === 'its folder is a link' && aJS.j.pages.slice(1).every((p) => !('visualsNotRead' in p)), () => `A10 the JSON form says it on page 1 only: ${JSON.stringify(aJS.j && aJS.j.pages.map((p) => p.visualsNotRead))}`);
chk(() => aJS.j && aJS.j.notRead && aJS.j.notRead.links && aJS.j.notRead.links.count === 1 && aJS.j.notRead.links.named[0] === VIS_REL, () => `A11 the JSON form names the link too: ${JSON.stringify(aJS.j && aJS.j.notRead)}`);

// ---- P: a page.json that is a link (a file link: symlink rights on Windows) ----
fresh('p');
const pj = path.join(PAGES('p'), 'p2details/page.json');
fs.copyFileSync(pj, path.join(OUT, 'page-p.json')); fs.rmSync(pj);
let fileLink = true;
try { fs.symlinkSync(path.join(OUT, 'page-p.json'), pj, 'file'); } catch (e) { fileLink = false; fs.copyFileSync(path.join(OUT, 'page-p.json'), pj); }
if (!fileLink) skipped.push('P (a file link needs symlink rights on this system: Windows without Developer Mode)');
else {
  const pP = path.join(ROOT, 'p', BASE + '.pbip'), PJ_REL = 'definition/pages/p2details/page.json';
  const pRR = await call('read_report', { path: pP }), pCR = await call('check_report', { path: pP });
  chk(() => notReadLine(pRR.t) === `NOT READ 1 link(s) never followed: "${PJ_REL}"`, () => `P1 read_report names the linked page.json once: ${notReadLine(pRR.t)}`);
  const pL = linksEntry(pCR.j);
  chk(() => pL && /^1 file or folder is a link\b/.test(pL.why) && pL.why.includes(`"${PJ_REL}"`), () => `P2 check_report counts it once and names it: ${pL && pL.why}`);
  chk(() => /the report holds 1 link\b/.test(validatorWhy(pCR.j)), () => `P3 the validator's reason counts 1: ${validatorWhy(pCR.j)}`);
}

// ---- S: a linked folder met on the way to a file (StaticResources, sp42's R5 shape): the link itself is named, once ----
fresh('s');
const sres = path.join(ROOT, 's', BASE + '.Report/StaticResources');
fs.renameSync(sres, path.join(OUT, 'res-s')); linkDir(path.join(OUT, 'res-s'), sres);
const sP = path.join(ROOT, 's', BASE + '.pbip');
const sRR = await call('read_report', { path: sP }), sCR = await call('check_report', { path: sP });
chk(() => notReadLine(sRR.t) === 'NOT READ 1 link(s) never followed: "StaticResources"', () => `S1 read_report names the linked folder, not a file behind it: ${notReadLine(sRR.t)}`);
const sL = linksEntry(sCR.j);
chk(() => sL && /^1 file or folder is a link\b/.test(sL.why) && sL.why.includes('"StaticResources"') && /the report holds 1 link\b/.test(validatorWhy(sCR.j)), () => `S2 check_report counts the one link once: ${sL && sL.why} | ${validatorWhy(sCR.j)}`);

// ---- C: 12 links, made out of order: 10 named (sorted), "and 2 more" ----
fresh('c');
const cv = path.join(PAGES('c'), 'p1overview/visuals');
const keep = fs.readdirSync(cv)[0];
fs.mkdirSync(path.join(OUT, 'c-target'));
fs.cpSync(path.join(cv, keep), path.join(OUT, 'c-target', 'v'), { recursive: true });
const names = Array.from({ length: 12 }, (_, i) => `lk${String(i + 1).padStart(2, '0')}`);
for (const n of [7, 2, 11, 0, 9, 4, 1, 10, 5, 3, 8, 6].map((i) => names[i])) linkDir(path.join(OUT, 'c-target', 'v'), path.join(cv, n));
const cP = path.join(ROOT, 'c', BASE + '.pbip');
const cRR = await call('read_report', { path: cP }), cCR = await call('check_report', { path: cP });
const want10 = names.slice(0, 10).map((n) => `"definition/pages/p1overview/visuals/${n}"`).join(', ') + ' and 2 more';
chk(() => notReadLine(cRR.t) === `NOT READ 12 link(s) never followed: ${want10}`, () => `C1 read_report: 10 named in order, then 2 more: ${notReadLine(cRR.t)}`);
const cL = linksEntry(cCR.j);
chk(() => cL && /^12 files or folders are links\b/.test(cL.why) && cL.why.includes(want10), () => `C2 check_report's notChecked: 12, the same 10 and 2 more: ${cL && cL.why}`);
chk(() => /the report holds 12 links\b/.test(validatorWhy(cCR.j)) && validatorWhy(cCR.j).includes(want10), () => `C3 the validator's reason: 12, the same names: ${validatorWhy(cCR.j)}`);

// ---- D: one helper, both answers call it (D-1104-12) ----
const src = (f) => fs.readFileSync(path.join(HERE, 'lib', f), 'utf8');
chk(() => /export (const|function) linksSaid\b/.test(src('read-report.mjs')), () => 'D1 read-report.mjs exports linksSaid');
chk(() => /linksSaid\(/.test(src('report-answer.mjs')) && /linksSaid\(/.test(src('check-report.mjs')), () => 'D2 both answers call linksSaid');
chk(() => !/\.slice\(0, 10\)/.test(src('check-report.mjs').split('\n').filter((l) => /links/.test(l)).join('\n')), () => 'D3 check-report.mjs builds no list of links of its own');

fs.rmSync(ROOT, { recursive: true, force: true }); fs.rmSync(OUT, { recursive: true, force: true });
if (skipped.length) console.log('SKIPPED PART ' + skipped.join('; '));
if (problems.length) { console.log(`FAIL script=test-0.3.3-lk1.mjs cause=${problems.length} of ${checks} checks`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  lk1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  lk1  ${checks} checks`);
