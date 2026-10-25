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
import { registryProblems } from '../mcp/run-tests.mjs';

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
  // G1 (0.3.1): npm test's suites are mcp/tests.json's; a test file is registered once or the check fails
  const reg = (suites, more = {}) => { fs.writeFileSync(path.join(D, 'tests.json'), JSON.stringify({ areas: { a: 'A' }, suites, ignored: [], pending: [], ...more })); return path.join(D, 'tests.json'); };
  t('a registry names its suites like a package.json line', () => {
    fs.writeFileSync(path.join(D, 'test-h.mjs'), "console.log('done');\n");
    assert.deepEqual(missingLines(reg([{ file: 'a.mjs', area: 'a', purpose: 'p' }, { file: 'test-h.mjs', area: 'a', purpose: 'p' }])).missing.map((m) => m.file), ['test-h.mjs']);
  });
  t('a test-*.mjs in neither suites nor ignored is named; ignored with a why passes', () => {
    for (const f of fs.readdirSync(D).filter((f) => f.startsWith('test'))) fs.rmSync(path.join(D, f));
    fs.writeFileSync(path.join(D, 'test-x.mjs'), ''); fs.writeFileSync(path.join(D, 'test-y.mjs'), '');
    reg([{ file: 'test-x.mjs', area: 'a', purpose: 'p' }]);
    assert.deepEqual(registryProblems(D), ['test-y.mjs: in neither suites nor ignored (tests.json): register it once']);
    reg([{ file: 'test-x.mjs', area: 'a', purpose: 'p' }], { ignored: [{ file: 'test-y.mjs', why: 'a helper' }] });
    assert.deepEqual(registryProblems(D), []);
  });
  t('a pending suite whose file landed, an unknown area and a file listed twice are named', () => {
    reg([{ file: 'test-x.mjs', area: 'b', purpose: 'p' }, { file: 'test-x.mjs', area: 'a', purpose: 'p' }], { pending: [{ file: 'test-y.mjs', area: 'a', purpose: 'p' }] });
    const p = registryProblems(D).join('\n');
    assert.match(p, /test-y\.mjs: its file has landed/); assert.match(p, /unknown area "b"/); assert.match(p, /test-x\.mjs: listed twice/);
  });
} finally { fs.rmSync(D, { recursive: true, force: true }); }
console.log(`PASS  result-lines-test  ${n} checks`);
