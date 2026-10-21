// Tests for check-result-lines.mjs (B-198) on made-up test scripts: the line ci-sum.mjs counts, its forms, and the
// scripts that print their own wording (D5, D6 and U1 before 29f2846).
//   node scripts/test-result-lines.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { missingLines } from './check-result-lines.mjs';

let n = 0;
const D = fs.mkdtempSync(path.join(os.tmpdir(), 'result-lines-'));
const t = (name, fn) => { fn(); n++; };
const pkg = (files) => { for (const [f, src] of Object.entries(files)) fs.writeFileSync(path.join(D, f), src); fs.writeFileSync(path.join(D, 'package.json'), JSON.stringify({ scripts: { test: Object.keys(files).map((f) => 'node ' + f).join(' && ') } })); return path.join(D, 'package.json'); };
const missing = (files) => missingLines(pkg(files)).missing.map((m) => m.file);
try {
  t('the standard pair passes', () => assert.deepEqual(missing({ 'a.mjs': "if (p.length) { console.log(`FAIL  a  ${c} checks, ${p.length} failed`); process.exit(1); }\nconsole.log(`PASS  a  ${c} checks`);\n" }), []));
  t('one line for both (a ternary) passes, "N tasks" too', () => assert.deepEqual(missing({ 'b.mjs': "console.log(`${bad ? 'FAIL' : 'PASS'}  b  seed ${s}, ${n} checks`);\n", 'g.mjs': "console.log('FAIL  g  ' + d);\nconsole.log(`PASS  g  ${n} tasks match`);\n" }), []));
  t('a script with its own wording is named', () => assert.deepEqual(missing({ 'c.mjs': "console.log(`OK c: ${n} checks passed`);\n", 'd.mjs': "console.log(`PASS  d  ${n} checks`);\n" }), ['c.mjs', 'd.mjs']));
  t('a PASS line without its count is named', () => assert.deepEqual(missing({ 'e.mjs': "console.log('FAIL  e');\nconsole.log('PASS  e  all good');\n" }), ['e.mjs']));
  t('the command line names the file and fails; the repo passes', () => {
    const script = fileURLToPath(new URL('./check-result-lines.mjs', import.meta.url));
    const p = pkg({ 'f.mjs': "console.log('done');\n" });
    let code = 0, out = '';
    try { execFileSync(process.execPath, [script, p], { stdio: 'pipe' }); } catch (e) { code = e.status; out = String(e.stderr); }
    assert.equal(code, 1); assert.match(out, /f\.mjs/);
    execFileSync(process.execPath, [script], { stdio: 'pipe' });
  });
} finally { fs.rmSync(D, { recursive: true, force: true }); }
console.log(`PASS  result-lines-test  ${n} checks`);
