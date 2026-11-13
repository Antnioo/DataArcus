// 0.3.3 FW1 (mcp/work/FW1.md, B-431 b and c): the folder window is said to be "opened" only when that is certain (starting
// explorer.exe proves no window: it is worded as what happened), and DATAARCUS_FOLDER_OPENER (tests only) opens the
// folder window on its own, apart from DATAARCUS_BROWSER. Made-up plans only, in a temp folder.
//   node test-0.3.3-fw1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'message threw'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fw1-')));
process.env.DATAARCUS_ROOT = ROOT;
const { serverClient } = await import('./test-0.2.9.mjs');
const AW = await import('./lib/approval-window.mjs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prog = (file) => JSON.stringify([process.execPath, '-e', `require('fs').appendFileSync(${JSON.stringify(file)}, process.argv[process.argv.length - 1] + '\\n'); process.exit(1)`]);
const lines = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean) : []);

// U1 which program shows the folder (pure: platform and env given)
{
  const own = prog(path.join(ROOT, 'x.txt'));
  const f = (pl, env) => AW.folderOpener('D', pl, env);
  chk(() => f('win32', { DATAARCUS_FOLDER_OPENER: own })[0] === process.execPath && f('win32', { DATAARCUS_FOLDER_OPENER: own })[1].pop() === 'D', () => 'U1. DATAARCUS_FOLDER_OPENER is the folder program, given the folder');
  chk(() => f('win32', { DATAARCUS_BROWSER: own })[0] === 'explorer.exe', () => 'U1. DATAARCUS_BROWSER no longer opens the folder: ' + JSON.stringify(f('win32', { DATAARCUS_BROWSER: own })));
  chk(() => JSON.stringify(f('win32', {})) === JSON.stringify(['explorer.exe', ['D']]), () => 'U1. neither set: explorer.exe on the folder (the default path, unchanged)');
  chk(() => f('linux', { DATAARCUS_FOLDER_OPENER: own }) === null && f('darwin', {}) === null, () => 'U1. macOS and Linux: no folder window');
  chk(() => AW.launchers('u', 'win32', { DATAARCUS_FOLDER_OPENER: own }).length === 2, () => 'U1. DATAARCUS_FOLDER_OPENER does not change the browser launchers');
  chk(() => { try { f('win32', { DATAARCUS_FOLDER_OPENER: '[1]' }); return false; } catch (e) { return /DATAARCUS_FOLDER_OPENER/.test(e.message); } }, () => 'U1. a bad value names its own variable');
}
// U2 the words: the program started is "asked", never "opened"; the failure wording is unchanged
{
  const sc = { dir: 'C:\\T\\dataarcus-approval-x', file: 'C:\\T\\dataarcus-approval-x\\DataArcus approval.html' };
  const a = AW.notSeenAnswer('plan-0123456789ab', sc, 'win32', true), b = AW.notSeenAnswer('plan-0123456789ab', sc, 'win32', false);
  chk(() => a.folderWindow === 'asked' && /asked Windows to open/.test(a.sayFirst), () => 'U2. started, nothing certain: ' + JSON.stringify(a).slice(0, 300));
  chk(() => !/DataArcus opened|\bopened a folder|folder window opened/i.test(a.sayFirst) && /may not|not sure|check/i.test(a.sayFirst) && /reopen: true/.test(a.sayFirst), () => 'U2. it does not claim the window opened, says it may not show, offers reopen: ' + a.sayFirst);
  chk(() => b.folderWindow === 'not opened' && b.sayFirst.includes('could not open the folder window that holds its shortcut either. Ask the user to check that Windows Explorer works'), () => 'U2. the failure wording is unchanged: ' + JSON.stringify(b).slice(0, 300));
}
// T1 through approve_plan as on Windows: the browser fails, the folder opener (apart) is used and the browser is not
{
  const lb = path.join(ROOT, 'b.txt'), lf = path.join(ROOT, 'f.txt');
  const s = await serverClient(ROOT, { DATAARCUS_BROWSER: prog(lb), DATAARCUS_FOLDER_OPENER: prog(lf), DATAARCUS_TEST_PLATFORM: 'win32', DATAARCUS_APPROVAL_WAIT_MS: '20000', DATAARCUS_SEEN_WAIT_MS: '1500' });
  try {
    const t = await s.call('generate_theme', { brand: '#0F766E', name: 'Folder Apart' }), id = t.j && t.j.plan && t.j.plan.planId;
    const ap = await s.call('approve_plan', { planId: id });
    for (let k = 0; k < 60 && !lines(lf).length; k++) await sleep(50);
    chk(() => lines(lf).length === 1 && !/^https?:/.test(lines(lf)[0]) && fs.existsSync(path.join(lines(lf)[0], 'DataArcus approval.html')), () => 'T1. the folder opener got the shortcut folder: ' + JSON.stringify(lines(lf)));
    chk(() => lines(lb).length >= 1 && lines(lb).every((x) => /^https?:/.test(x)), () => 'T1. the browser program only got the page link, never the folder: ' + JSON.stringify(lines(lb)));
    chk(() => ap.j && ap.j.window === 'not seen' && ap.j.folderWindow === 'asked' && !/dataarcus-approval-|approval\.html/i.test(ap.t), () => 'T1. the answer: asked, no path: ' + ap.t.slice(0, 300));
  } finally { await s.close(); }
  // T2 the folder opener cannot start: the existing failure answer
  const s2 = await serverClient(ROOT, { DATAARCUS_BROWSER: prog(path.join(ROOT, 'b2.txt')), DATAARCUS_FOLDER_OPENER: path.join(ROOT, 'no-such-opener'), DATAARCUS_TEST_PLATFORM: 'win32', DATAARCUS_APPROVAL_WAIT_MS: '20000', DATAARCUS_SEEN_WAIT_MS: '1500' });
  try {
    const t = await s2.call('generate_theme', { brand: '#0F766E', name: 'Folder Fails' }), id = t.j && t.j.plan && t.j.plan.planId;
    const ap = await s2.call('approve_plan', { planId: id });
    chk(() => ap.j && ap.j.folderWindow === 'not opened' && /could not open the folder window/.test(ap.j.sayFirst), () => 'T2. the opener fails: ' + ap.t.slice(0, 300));
  } finally { await s2.close(); }
}
try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* the temp folder */ }
if (problems.length) { console.log(`FAIL script=test-0.3.3-fw1.mjs cause=${JSON.stringify(problems[0]).slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  fw1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  fw1  ${checks} checks`);
process.exit(0);
