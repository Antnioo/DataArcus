// 0.3.2 PH1 (mcp/work/PH1.md): the last two path compares call path-rules.mjs, and tooLongSaid's example folder follows
// the platform (B-412, B-416). Made-up folders in a temp folder.
//   T1-T3 tooLongSaid on win32 (C:\PBI, kept), darwin and linux (~/PBI): string logic with path.win32 / path.posix, so it
//         proves the words on any system; the rest of the sentence is the same on all three.
//   S1-S2 redesign.mjs and report-build.mjs import sameOnDisk from path-rules.mjs and no local realpath/resolve compare is left.
//   D1    sameOnDisk answers what the old compares answered for folders on disk (same folder, a link to it, another folder).
//   node test-0.3.2-ph1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const PR = await import('./lib/path-rules.mjs');
const W = path.win32, X = path.posix;

const files = [{ path: 'a/' + 'x'.repeat(300) + '.json' }];
const longer = (n) => [{ path: 'a/' + 'x'.repeat(n) + '.json' }];
const win = PR.tooLongSaid('C:\\P', files, 'win32', W), mac = PR.tooLongSaid('/P', longer(1100), 'darwin', X), lin = PR.tooLongSaid('/P', longer(4100), 'linux', X);
chk(() => win && win.endsWith('(for example C:\\PBI), then plan again'), () => 'T1. win32 keeps "for example C:\\PBI": ' + win);
chk(() => mac && mac.endsWith('(for example ~/PBI), then plan again'), () => 'T2. darwin says "for example ~/PBI": ' + mac);
chk(() => lin && lin.endsWith('(for example ~/PBI), then plan again'), () => 'T3. linux says "for example ~/PBI": ' + lin);
const tail = (s) => s.replace(/\(for example [^)]*\)/, '(E)').replace(/\d+ characters, and .*? allows? \d+/, 'N characters, and S allow N');
chk(() => tail(win) === tail(mac) && tail(mac) === tail(lin), () => 'T4. no other word of the sentence changes between platforms');

const red = fs.readFileSync(path.join(HERE, 'lib', 'redesign.mjs'), 'utf8'), rb = fs.readFileSync(path.join(HERE, 'lib', 'report-build.mjs'), 'utf8');
const imp = (s) => /import\s*\{[^}]*\bsameOnDisk\b[^}]*\}\s*from\s*'\.\/path-rules\.mjs'/.test(s);
chk(() => imp(red) && /sameOnDisk\(want, model\.folder\)/.test(red) && !/realpathSync\.native\(a\) === /.test(red) && !/const same = /.test(red),
  () => 'S1. redesign.mjs calls sameOnDisk and the local compare is gone');
chk(() => imp(rb) && /sameOnDisk\(FS\.scriptDir, m\.projectDir\)/.test(rb) && !/path\.resolve\(FS\.scriptDir\)/.test(rb),
  () => 'S2. report-build.mjs fsInTree calls sameOnDisk and the path.resolve compare is gone');
chk(() => red.includes('the original is on another model than the one given (path): give the model its definition.pbir names'), () => 'S3. the redesign message is word for word');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-ph1-')));
try {
  const a = path.join(ROOT, 'a'), b = path.join(ROOT, 'b'), ln = path.join(ROOT, 'link');
  fs.mkdirSync(a); fs.mkdirSync(b);
  let linked = true; try { fs.symlinkSync(a, ln, 'junction'); } catch (e) { linked = false; }
  chk(() => PR.sameOnDisk(a, a) && !PR.sameOnDisk(a, b) && (!linked || PR.sameOnDisk(a, ln)), () => 'D1. sameOnDisk: the same folder, a link to it, another folder');
  chk(() => !PR.sameOnDisk(path.join(ROOT, 'none1'), path.join(ROOT, 'none2')) && PR.sameOnDisk(path.join(ROOT, 'none1'), path.join(ROOT, 'none1')), () => 'D2. folders not on disk: the path compare');
} finally { fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL  ph1  ${problems.length} of ${checks} checks`); for (const p of problems) console.log('  ' + p); process.exit(1); }
console.log(`PASS  ph1  ${checks} checks`);
