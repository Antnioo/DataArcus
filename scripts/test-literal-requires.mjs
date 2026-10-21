// Tests for check-literal-requires.mjs (B-196): made-up files, and the real case it is for (page-preview.js before
// 043844e: require(file) through a helper).
//   node scripts/test-literal-requires.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeOnly, nonLiteral } from './check-literal-requires.mjs';

let n = 0;
const t = (name, fn) => { fn(); n++; };
const lines = (src) => nonLiteral(src).map((h) => h.line);

t('a literal path passes: require, import(), createRequire()()', () => {
  assert.deepEqual(lines("const A = require('./a.js');\nconst B = require(\"./b.js\");\nconst C = import(`./c.mjs`);\nconst D = createRequire(import.meta.url)('../d.js');"), []);
});
t('a variable path fails, with its line (the 043844e case: a helper that requires what it is given)', () => {
  assert.deepEqual(lines("const x = 1;\nconst shared = (file, name) => { try { return node ? require(file) : root[name]; } catch (e) { return null; } };"), [2]);
});
t('createRequire(...)(variable), import(variable), a template with ${} and a sum fail', () => {
  assert.deepEqual(lines("const R = createRequire(import.meta.url)(p);\nimport(name);\nrequire(`./${f}.js`);\nrequire('./' + f);"), [1, 2, 3, 4]);
});
t('comments, strings and regular expressions are not code', () => {
  assert.deepEqual(lines("// require(file)\n/* import(x) */\nconst s = 'require(file)';\nconst r = /[&<>\"']/g; const q = require('./ok.js');\nconst u = `a ${b ? `require(x)` : ''} c`;"), []);
});
t('codeOnly keeps every line and length (a line number stays true)', () => {
  const src = "const a = `x\n${'y'}\nz`; // c\n/* d\ne */ require(v);";
  const c = codeOnly(src);
  assert.equal(c.length, src.length); assert.equal(c.split('\n').length, src.split('\n').length);
  assert.deepEqual(lines(src), [5]);
});
t('the command line: a folder with a bad file fails and names it; the repo passes', () => {
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'lit-req-'));
  try {
    fs.writeFileSync(path.join(D, 'ok.js'), "module.exports = require('./x.js');\n");
    fs.writeFileSync(path.join(D, 'bad.mjs'), "const f = './x.js';\nexport default await import(f);\n");
    fs.writeFileSync(path.join(D, 'skip.min.js'), 'require(f)');
    const script = fileURLToPath(new URL('./check-literal-requires.mjs', import.meta.url));
    let code = 0, err = '';
    try { execFileSync(process.execPath, [script, D], { stdio: 'pipe' }); } catch (e) { code = e.status; err = String(e.stderr); }
    assert.equal(code, 1); assert.match(err, /bad\.mjs:2: import/); assert.doesNotMatch(err, /ok\.js|skip\.min\.js/);
    execFileSync(process.execPath, [script], { stdio: 'pipe' });
  } finally { fs.rmSync(D, { recursive: true, force: true }); }
});
console.log(`PASS  literal-requires  ${n} checks`);
