// 0.3.2 WN1 (mcp/work/WN1.md): Codex's Windows review of integration/0.3.2 (windows-readiness-032, B-407), each finding
// pinned with Codex's own breaking input. Made-up projects only, in a temp folder.
//   F01 the containment rule: a folder inside whose name begins with two dots (`..draft`) is inside; every escape is
//       still outside. P1-P3 the rule on path.win32 and path.posix (string logic: proves the Windows answer on any
//       system; it can't prove what Windows' own path.relative returns for a real junction, the CI's Windows run does);
//       P4 read_model, P5 generate_theme's plan, approval and write, P6 the plain words, all on a real `..draft` folder;
//       P7 no copy of the old test (`startsWith('..')` on a relative path) is left in the MCP's code.
//   F02 the report a .pbip opens, named in another case: Q1 samePath and sameName on win32, darwin and linux (string
//       logic); Q2 existingTheme on disk: `demo.Report` named beside the folder `Demo.Report` is the one opened where the
//       file system ignores case (Windows, macOS: the CI's runs), and on a case-sensitive system the name names nothing.
//   F03 a browser that starts and exits without opening the page: R1 the launchers (Windows: explorer.exe second; a
//       test browser alone); R2 approve_plan answers "not seen" with a shortcut file in the OS temp folder, never the
//       link; R3 the shortcut's link is the page and its Approve approves; R4 a browser that opens the page gets no shortcut.
//       R5-R6 (the owner D-1109-01) on Windows the answer names neither the shortcut's folder nor its name and DataArcus
//       opens the folder window; on macOS and Linux it names both (R6 through the tool with DATAARCUS_TEST_PLATFORM)
//   F05 a path over the platform's limit: L1 longestPath on win32 (259 fits, 260 does not); L2 plan_layout gives no
//       plan id; L3 create_arabic_twin gives no plan id; L4 writeTree writes nothing.
//   node test-0.3.2-wn1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-wn1-')));
process.env.DATAARCUS_ROOT = ROOT;
const { serverClient } = await import('./test-0.2.9.mjs');
// MH1: these servers wait for an approval (20 s, 3 s) before they answer; the slowest call measured on Linux was 3.0 s (the 3 s wait), so 40 s keeps 2x over any slower CI system (L-1104-02)
const WAITING = 40000;
const tryImport = async (f) => { try { return await import(f); } catch (e) { return {}; } };
const PR = await tryImport('./lib/path-rules.mjs');
const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const req = (url, { method = 'GET', origin, body } = {}) => new Promise((resolve) => {
  const u = new URL(url), h = { Host: u.host };
  if (origin) h.Origin = origin;
  if (body) h['Content-Type'] = 'application/x-www-form-urlencoded';
  const r = http.request(u, { method, headers: h }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve({ code: res.statusCode, t })); });
  r.on('error', (e) => resolve({ code: 0, t: String(e.message) })); if (body) r.write(body); r.end();
});
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const model = (dir) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'Region', dataType: 'string', sourceColumn: 'Region' }],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }] } })); };
const W = path.win32, X = path.posix;

// ---------- F01: the containment rule ----------
{
  const inside = (root, p, P) => PR.within(root, p, P);
  // P1 Codex's input (F01): a folder whose name begins with two dots, inside the working folder
  chk(() => inside('C:\\Smoke', 'C:\\Smoke\\..draft\\Smoke.SemanticModel', W) === true, () => 'P1. F01: C:\\Smoke\\..draft\\Smoke.SemanticModel is inside C:\\Smoke (path.win32)');
  chk(() => inside('C:\\Smoke', 'C:\\Smoke\\...\\x', W) && inside('C:\\Smoke', 'C:\\Smoke\\..', W) === false && inside('C:\\Smoke', 'C:\\Smoke', W), () => 'P1. "..." is a name inside; the working folder itself is inside; its parent is not');
  // P2 every escape still outside, on Windows: the parent, a parent's child, another drive, a share, a sibling with the same start
  const out = [['C:\\Smoke', 'C:\\'], ['C:\\Smoke', 'C:\\Other\\x'], ['C:\\Smoke', 'C:\\Smoke\\..\\Smoke2'], ['C:\\Smoke', 'D:\\Smoke\\x'], ['C:\\Smoke', '\\\\server\\share\\x'], ['C:\\Smoke', 'C:\\Smoke2'], ['\\\\server\\share\\Smoke', '\\\\server\\other\\x'], ['C:\\Smoke', 'C:\\Smoke\\..\\..']];
  chk(() => out.every(([r, p]) => inside(r, p, W) === false), () => `P2. every escape is outside (path.win32): ${out.filter(([r, p]) => inside(r, p, W) !== false).map((x) => x[1]).join(', ')}`);
  chk(() => ['..', '..\\x', '../x', 'D:\\x', '\\\\s\\h'].every((r) => PR.outsideRel(r, W)) && ['..draft', '..draft\\x', '...', 'a\\..b', '.x'].every((r) => !PR.outsideRel(r, W)), () => 'P2. outsideRel on win32: "..", "..\\", "../", a drive, a share outside; "..draft", "...", ".x" inside');
  // P3 on posix: the same, and a backslash is a letter of a name there
  chk(() => inside('/r', '/r/..draft/M', X) && inside('/r', '/r/..\\x', X) && !inside('/r', '/r/../x', X) && !inside('/r', '/', X) && !inside('/r', '/r2', X), () => 'P3. path.posix: /r/..draft inside, /r/../x and /r2 outside, "..\\x" a name inside');
  // P4 read_model on a real folder "..draft" inside the working folder (base: "outside the allowed folder")
  model('..draft');
  const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'approve' });
  try {
    const r = await s.call('read_model', { path: '..draft' });
    chk(() => !r.err && r.j, () => `P4. F01: read_model reads the model in "..draft" (a folder inside): ${short(r)}`);
    const esc = await s.call('read_model', { path: '../outside' });
    chk(() => esc.err && /outside the allowed folder/.test(esc.t), () => `P4. "../outside" is still refused: ${short(esc)}`);
    // P5 a theme planned, approved and written into "..draft"
    const t = await s.call('generate_theme', { brand: '#0F766E', name: 'Dots', folder: '..draft' }), id = t.j && t.j.plan && t.j.plan.planId;
    chk(() => !t.err && /^plan-/.test(id), () => `P5. generate_theme plans a theme in "..draft": ${short(t)}`);
    chk(() => /in the folder "\.\.draft"/.test(t.j.plan.writesAfterGo.join(' ')), () => `P5. its plan says "in the folder \\"..draft\\"", never "next to the project": ${short(t)}`);
    const ap = id ? await s.call('approve_plan', { planId: id }) : { err: true, t: 'no plan' };
    const w = id ? await s.call('generate_theme', { brand: '#0F766E', name: 'Dots', folder: '..draft', planId: id }) : { err: true, t: 'no plan' };
    chk(() => !ap.err && !w.err && fs.readdirSync(path.join(ROOT, '..draft')).some((n) => /\.json$/.test(n)), () => `P5. approved and written inside "..draft": ${short(ap)} / ${short(w)}`);
  } finally { await s.close(); }
  // P6 the plain words: a folder "..draft" is a folder of the working folder
  const PW = await import('./lib/plain-words.mjs');
  chk(() => PW.relOf(path.join(ROOT, '..draft')) === '..draft' && PW.relOf(path.dirname(ROOT)) === null, () => `P6. relOf: "..draft" inside, the parent outside: ${PW.relOf(path.join(ROOT, '..draft'))}`);
  chk(() => /in the folder "\.\.draft"/.test(PW.whereSaid(path.join(ROOT, '..draft'))) && /المجلد «\.\.draft»/.test(PW.whereSaid(path.join(ROOT, '..draft'), null, true)), () => `P6. whereSaid names the folder "..draft" (English and Arabic): ${PW.whereSaid(path.join(ROOT, '..draft'))}`);
  // P7 one rule: no place tests a relative path with startsWith('..') any more (each calls path-rules.mjs)
  const left = [];
  for (const d of ['lib', 'tools']) for (const f of fs.readdirSync(path.join(HERE, d)).filter((n) => /\.mjs$/.test(n))) {
    fs.readFileSync(path.join(HERE, d, f), 'utf8').split('\n').forEach((line, i) => { if (/\.startsWith\(\s*'\.\.'\s*\)/.test(line)) left.push(`${d}/${f}:${i + 1}`); });
  }
  chk(() => !left.length, () => `P7. a copy of the old containment test is left: ${left.join(', ')}`);
}

// ---------- F02: the report a .pbip opens, named in another case ----------
{
  chk(() => PR.samePath('C:\\P\\demo.Report', 'C:\\P\\Demo.Report', 'win32', W) && PR.samePath('/P/demo.Report', '/P/Demo.Report', 'darwin', X) && !PR.samePath('/P/demo.Report', '/P/Demo.Report', 'linux', X), () => 'Q1. F02: samePath ignores case on win32 and darwin, not on linux');
  chk(() => PR.sameName('Demo', 'demo', 'win32') && !PR.sameName('Demo', 'demo', 'linux') && !PR.samePath('C:\\P\\Demo.Report', 'C:\\P\\Demo2.Report', 'win32', W), () => 'Q1. sameName by platform; another folder is never the same');
  // Q2 on disk: two reports of the model M; the .pbip "Demo.pbip" opens "demo.Report" (Codex's input); the folder is "Demo.Report"
  const dir = path.join(ROOT, 'f2'); model('f2');
  const rep = (n) => { const d = path.join(dir, n + '.Report'); fs.mkdirSync(path.join(d, 'definition', 'pages'), { recursive: true }); fs.writeFileSync(path.join(d, 'definition.pbir'), JSON.stringify({ version: '4.0', datasetReference: { byPath: { path: '../M.SemanticModel' } } })); fs.writeFileSync(path.join(d, 'definition', 'report.json'), JSON.stringify({ themeCollection: {} })); fs.writeFileSync(path.join(d, 'definition', 'version.json'), JSON.stringify({ version: '2.0.0' })); fs.writeFileSync(path.join(d, 'definition', 'pages', 'pages.json'), JSON.stringify({ pageOrder: [] })); };
  rep('Alpha'); rep('Demo');
  fs.writeFileSync(path.join(dir, 'Demo.pbip'), JSON.stringify({ version: '1.0', artifacts: [{ report: { path: 'demo.Report' } }] }));
  const caseless = fs.existsSync(path.join(dir, 'demo.Report'));   // (the file system: Windows and macOS ignore case)
  const RR = await import('./lib/read-report.mjs');
  const files = ['Alpha', 'Demo'].map((n) => ({ path: path.join(dir, n + '.Report', 'definition.pbir') }));
  const got = RR.existingTheme({ projectDir: dir, folder: path.join(dir, 'M.SemanticModel'), report: { files } });
  chk(() => got && got.report === (caseless ? 'Demo' : 'Alpha'), () => `Q2. F02: the report the .pbip opens (${caseless ? 'a case-insensitive file system: Demo' : 'a case-sensitive one: demo.Report names nothing, Alpha by name'}): ${JSON.stringify(got)}`);
}

// ---------- F03: a browser that starts and exits without opening the page ----------
{
  const AW = await import('./lib/approval-window.mjs');
  const L = AW.launchers ? AW.launchers('http://127.0.0.1:1/x', 'win32', {}) : null;
  chk(() => L && L.length === 2 && L[0][0] === 'rundll32.exe' && L[1][0] === 'explorer.exe' && L[1][1].join(' ') === 'http://127.0.0.1:1/x', () => `R1. F03: on Windows a second launcher, explorer.exe with the link: ${JSON.stringify(L)}`);
  chk(() => AW.launchers('u', 'darwin', {}).length === 1 && AW.launchers('u', 'win32', { DATAARCUS_BROWSER: '/x/b' }).length === 1, () => 'R1. one launcher on macOS and for DATAARCUS_BROWSER (the tests\' own)');
  // R2 the browser exits with 1 and never loads the page
  const quit = JSON.stringify([process.execPath, '-e', 'process.exit(1)']);
  // (D-1109-01: on Windows the answer names no place, R6; R2-R3 are the macOS and Linux answer on every system)
  const s = await serverClient(ROOT, { DATAARCUS_BROWSER: quit, DATAARCUS_TEST_PLATFORM: 'linux', DATAARCUS_APPROVAL_WAIT_MS: '20000', DATAARCUS_SEEN_WAIT_MS: '1500' }, { timeoutMs: WAITING });
  try {
    const t = await s.call('generate_theme', { brand: '#0F766E', name: 'Lost Window' }), id = t.j && t.j.plan && t.j.plan.planId;
    const t0 = Date.now(), ap = await s.call('approve_plan', { planId: id }), took = Date.now() - t0;
    const j = ap.j || {};
    chk(() => !ap.err && j.status === 'waiting' && j.window === 'not seen' && j.shortcut && typeof j.shortcut.file === 'string', () => `R2. F03: the page never seen: approve_plan says so with a shortcut: ${short(ap)}`);
    chk(() => took < 15000, () => `R2. it answers once the page is not seen, not after the whole wait: ${took} ms`);
    chk(() => !/127\.0\.0\.1|https?:\/\//.test(ap.t), () => `R2. the answer holds no link (the AI must never be able to approve): ${ap.t.slice(0, 300)}`);
    chk(() => /double-click|open/i.test(j.sayFirst || '') && j.shortcut && j.sayFirst.includes(path.basename(j.shortcut.file)), () => `R2. sayFirst tells the person how to open it: ${j.sayFirst}`);
    // R3 the person opens the shortcut: its link is the page, and Approve approves
    const f = j.shortcut && j.shortcut.file, inTemp = f && path.resolve(f).startsWith(path.resolve(fs.realpathSync.native(os.tmpdir())) + path.sep) || (f && path.resolve(f).startsWith(path.resolve(os.tmpdir()) + path.sep));
    chk(() => inTemp && fs.existsSync(f), () => `R3. the shortcut is in the OS temp folder: ${f}`);
    const link = f && fs.existsSync(f) ? ((fs.readFileSync(f, 'utf8').match(/https?:\/\/127\.0\.0\.1:\d+\/[^"'<>\s]+/) || [])[0] || '') : '';
    const page = link ? await req(link) : { code: 0, t: '' };
    chk(() => page.code === 200 && /Approve/.test(page.t), () => `R3. the shortcut's link is the approval page: ${page.code}`);
    const click = link ? await req(link, { method: 'POST', origin: new URL(link).origin, body: 'decision=approve' }) : { code: 0 };
    const ap2 = await s.call('approve_plan', { planId: id });
    chk(() => click.code === 200 && ap2.j && ap2.j.status === 'approved' && ap2.j.approvedBy === 'user-in-browser', () => `R3. its Approve approves: ${click.code} ${short(ap2)}`);
    await sleep(100);
    chk(() => !fs.existsSync(f), () => `R3. the shortcut is removed once the plan is decided: ${f}`);
  } finally { await s.close(); }
  // R4 a browser that opens the page: no shortcut, the answer as before
  const s2 = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'none', DATAARCUS_APPROVAL_WAIT_MS: '3000', DATAARCUS_SEEN_WAIT_MS: '1500' }, { timeoutMs: WAITING });
  try {
    const t = await s2.call('generate_theme', { brand: '#0F766E', name: 'Seen Window' }), id = t.j && t.j.plan && t.j.plan.planId;
    const ap = await s2.call('approve_plan', { planId: id });
    chk(() => ap.j && ap.j.status === 'waiting' && ap.j.window === 'opened' && !('shortcut' in ap.j), () => `R4. a page that was opened: no shortcut: ${short(ap)}`);
  } finally { await s2.close(); }
  // R5 (the owner D-1109-01, A-WN1-1 (b): "on Windows, leave the location out and open the folder window for you; give it
  // only on Mac and Linux") the answer by platform, on a made-up Windows shortcut (string logic: proves the words on any system)
  const sc = { dir: 'C:\\Users\\Ana\\AppData\\Local\\Temp\\dataarcus-approval-x1Y2z3', file: 'C:\\Users\\Ana\\AppData\\Local\\Temp\\dataarcus-approval-x1Y2z3\\DataArcus approval.html' };
  const said = (pl, shown) => (AW.notSeenAnswer ? JSON.stringify(AW.notSeenAnswer('plan-0123456789ab', sc, pl, shown)) : '');
  const noPlace = (t) => !!t && !/dataarcus-approval-|DataArcus approval\.html|approval\.html|AppData|Temp/i.test(t) && !t.includes(sc.dir.replace(/\\/g, '\\\\'));
  chk(() => noPlace(said('win32', true)) && JSON.parse(said('win32', true)).folderWindow === 'asked' && /folder window/.test(JSON.parse(said('win32', true)).sayFirst), () => `R5. D-1109-01: on Windows the answer names neither the shortcut's folder nor its name, and says the folder window was opened: ${said('win32', true)}`);
  chk(() => noPlace(said('win32', false)) && JSON.parse(said('win32', false)).folderWindow === 'not opened' && /reopen/.test(JSON.parse(said('win32', false)).sayFirst), () => `R5. on Windows, a folder window that could not open: still no place, and reopen offered: ${said('win32', false)}`);
  chk(() => ['darwin', 'linux'].every((pl) => { const j = JSON.parse(said(pl, false) || '{}'); return j.shortcut && j.shortcut.folder === sc.dir && j.sayFirst.includes('DataArcus approval.html') && !('folderWindow' in j); }), () => `R5. on macOS and Linux the answer names the file and its folder, as built: ${said('linux', false)}`);
  // R6 through the tool, as on Windows (DATAARCUS_TEST_PLATFORM, tests only): the browser exits 1; the folder window is
  // opened (the tests' program logs what it is given) and the answer has no path and no file name
  const log6 = path.join(ROOT, 'opened6.txt');
  const logger = JSON.stringify([process.execPath, '-e', `require('fs').appendFileSync(${JSON.stringify(log6)}, process.argv[process.argv.length - 1] + '\\n'); process.exit(1)`]);
  const s6 = await serverClient(ROOT, { DATAARCUS_BROWSER: logger, DATAARCUS_FOLDER_OPENER: logger, DATAARCUS_TEST_PLATFORM: 'win32', DATAARCUS_APPROVAL_WAIT_MS: '20000', DATAARCUS_SEEN_WAIT_MS: '1500' }, { timeoutMs: WAITING });
  try {
    const t = await s6.call('generate_theme', { brand: '#0F766E', name: 'Windows Window' }), id = t.j && t.j.plan && t.j.plan.planId;
    const ap = await s6.call('approve_plan', { planId: id });
    for (let k = 0; k < 60 && !(fs.existsSync(log6) && fs.readFileSync(log6, 'utf8').split('\n').filter(Boolean).length >= 2); k++) await sleep(50);   // (the program writes a moment after it starts)
    const opened = fs.existsSync(log6) ? fs.readFileSync(log6, 'utf8').split('\n').filter(Boolean) : [];
    const folder = opened.find((x) => !/^https?:/.test(x));
    chk(() => ap.j && ap.j.window === 'not seen' && ap.j.folderWindow === 'asked' && !('shortcut' in ap.j) && noPlace(ap.t) && (!folder || !ap.t.includes(path.basename(folder))), () => `R6. D-1109-01 through approve_plan as on Windows: no path, no file name, the folder window said: ${ap.t.slice(0, 400)}`);
    chk(() => folder && fs.existsSync(path.join(folder, 'DataArcus approval.html')), () => `R6. the folder window is opened on the shortcut's folder: ${JSON.stringify(opened)}`);
  } finally { await s6.close(); }
}

// ---------- F05: a path over the platform's limit ----------
{
  const files = [{ path: 'Sales.Report/definition/pages/0123456789abcdef0123/visuals/0123456789abcdef0123/visual.json' }];
  const rel = files[0].path.length, dir = (n) => 'C:\\' + 'a'.repeat(n - 3 - 1 - rel);   // (a full path of n characters)
  chk(() => PR.longestPath(dir(259), files, 'win32', W) === null && PR.longestPath(dir(260), files, 'win32', W).length === 260, () => 'L1. F05: on Windows 259 characters fit and 260 do not (MAX_PATH)');
  chk(() => PR.longestPath(dir(300), files, 'linux', X) === null && /260|259/.test(PR.tooLongSaid(dir(260), files, 'win32', W)), () => 'L1. another system\'s limit is its own; the words name the limit');
  // L2 plan_layout: the deepest file over the limit (lowered for the test) gives no plan id
  model('f5');
  const s = await serverClient(ROOT, { DATAARCUS_TEST_PATH_MAX: String(ROOT.length + 60) });
  try {
    const pl = await s.call('plan_layout', { path: 'f5', layout: 'exec', name: 'Long Path Report', planFields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Region]' }, secondPage: false });
    chk(() => !(pl.j && pl.j.plan && pl.j.plan.planId) && /characters/.test(pl.t), () => `L2. F05: plan_layout refuses a plan whose files' paths are too long, before the approval: ${short(pl)}`);
    // L3 create_arabic_twin: the same
    fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(ROOT, 'tw'), { recursive: true });
    const tw = await s.call('create_arabic_twin', { path: 'tw/Twin Sales.pbip' });
    chk(() => !(tw.j && tw.j.plan && tw.j.plan.planId) && /characters/.test(tw.t), () => `L3. F05: create_arabic_twin refuses it too: ${short(tw)}`);
  } finally { await s.close(); }
  const s2 = await serverClient(ROOT, {});
  try {
    const pl = await s2.call('plan_layout', { path: 'f5', layout: 'exec', name: 'Long Path Report', planFields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Region]' }, secondPage: false });
    chk(() => pl.j && pl.j.plan && /^plan-/.test(pl.j.plan.planId), () => `L2. the same plan within the limit gets its id: ${short(pl)}`);
  } finally { await s2.close(); }
  // L4 writeTree: nothing written (the write's own check, after the approval)
  process.env.DATAARCUS_TEST_PATH_MAX = String(ROOT.length + 20);
  const F = await import('./lib/files.mjs');
  let e = null; try { F.writeTree(path.join(ROOT, 'f5'), [{ path: 'Deep.Report/definition/pages/aaaaaaaaaaaa/visual.json', data: '{}' }]); } catch (x) { e = x; }
  delete process.env.DATAARCUS_TEST_PATH_MAX;
  chk(() => e && /^Nothing was written/.test(e.message) && /characters/.test(e.message) && !fs.existsSync(path.join(ROOT, 'f5', 'Deep.Report')), () => `L4. F05: writeTree writes nothing when a path is too long: ${e && e.message}`);
}

try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* the temp folder */ }
if (problems.length) { console.log(`FAIL script=test-0.3.2-wn1.mjs cause=${JSON.stringify(problems[0]).slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  wn1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  wn1  ${checks} checks`);
process.exit(0);
