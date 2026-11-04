// Tests for check-modules.mjs (0.3.2 MD1) on a made-up repo: a module with no row, a row whose file is gone, a file
// with two rows and a "used by" name that is not a module or a page are each named, with the fix; the strict mode
// catches a caller that does not load the file and a wrong "pure"; then the repo itself passes, and the command prints
// its result line.
//   node scripts/test-modules.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkModules, FIX } from './check-modules.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let n = 0;
const t = (name, fn) => { try { fn(); n++; } catch (e) { console.error(`FAIL  test-modules  ${name}: ${e.message}`); process.exit(1); } };

const ROW = {
  engine: '| `alpha.js` | the made-up engine | a -> b | `beta.mjs`, `tools/page.html` | yes |',
  lib: '| `beta.mjs` | the made-up lib | b -> c | `go.mjs` | no: fs |',
  tool: '| `go.mjs` | the made-up tool | c -> d | `server.mjs` | yes |',
};
const doc = (rows = ROW) => '# M\n\n## The parts\n- text\n\n## Every module\n\nIntro.\n\n### Engines\n\nIn `assets/js/`. Made up.\n\n| file | job | in -> out | used by | pure |\n|---|---|---|---|---|\n| **a group** | | | | |\n'
  + [].concat(rows.engine).join('\n') + '\n\n### Lib\n\nIn `mcp/lib/`.\n\n| file | job | in -> out | used by | pure |\n|---|---|---|---|---|\n' + [].concat(rows.lib).join('\n')
  + '\n\n### Tools\n\nIn `mcp/tools/`.\n\n| file | job | in -> out | used by | pure |\n|---|---|---|---|---|\n' + [].concat(rows.tool).join('\n') + '\n\n## After\n| `zeta.js` | not in the section | | | |\n';
const BASE = {
  'assets/js/alpha.js': "(function (root) { const api = { a: 1 }; if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAAlpha = api; })(this);\n",
  'assets/js/alpha.min.js': 'minified, never a module\n',
  'mcp/lib/beta.mjs': "import fs from 'node:fs';\nimport { createRequire } from 'node:module';\nconst A = createRequire(import.meta.url)('../../assets/js/alpha.js');\nexport const beta = () => fs.existsSync('x') && A;\n",
  'mcp/tools/go.mjs': "import { beta } from '../lib/beta.mjs';\nexport function register() { return beta; }\n",
  'mcp/server.mjs': "import { register } from './tools/go.mjs';\nregister();\n",
  'tools/page.html': '<script src="../assets/js/alpha.min.js"></script>\n',
};
function repo(over = {}, opts) {
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'modules-'));
  const files = Object.assign({}, BASE, { 'mcp/docs/MODULES.md': doc() }, over);
  for (const [f, s] of Object.entries(files)) { if (s == null) continue; fs.mkdirSync(path.dirname(path.join(D, f)), { recursive: true }); fs.writeFileSync(path.join(D, f), s); }
  const r = checkModules(D, opts);
  fs.rmSync(D, { recursive: true, force: true });
  return r;
}
const one = (r, re) => { assert.equal(r.problems.length, 1, r.problems.join('; ')); assert.match(r.problems[0], re); };

t('a made-up repo within every rule passes; .min.js is not a module; a group row and text after the section are not rows', () => {
  const r = repo();
  assert.deepEqual(r.problems, []);
  assert.equal(r.files, 3); assert.equal(r.rows, 3);
});
t('the strict mode passes on it too (callers and purity read from the code)', () => assert.deepEqual(repo({}, { strict: true }).problems, []));
t('red: a made-up module with no row is named, with the fix', () => {
  const r = repo({ 'mcp/lib/gamma.mjs': 'export const g = 1;\n' });
  one(r, /^FAIL mcp\/lib\/gamma\.mjs: no row in mcp\/docs\/MODULES\.md "## Every module"/);
  assert.ok(r.problems[0].endsWith(FIX));
});
t('red: a row whose file is gone is named', () => one(repo({ 'mcp/docs/MODULES.md': doc({ ...ROW, lib: [ROW.lib, '| `delta.mjs` | gone | x -> y | `go.mjs` | yes |'] }) }), /the row for mcp\/lib\/delta\.mjs names a file that is not there/));
t('red: a file with two rows is named, with both lines', () => one(repo({ 'mcp/docs/MODULES.md': doc({ ...ROW, lib: [ROW.lib, ROW.lib] }) }), /^FAIL mcp\/lib\/beta\.mjs: 2 rows \(mcp\/docs\/MODULES\.md lines \d+, \d+\): keep one/));
t('red: a "used by" name that is not a module or a page is named', () => one(repo({ 'mcp/docs/MODULES.md': doc({ ...ROW, tool: ROW.tool.replace('`server.mjs`', '`server.mjs`, `nowhere.mjs`') }) }), /go\.mjs's "used by" names nowhere\.mjs, which is not a module, server\.mjs or a page/));
t('red: a page that is not there, a row in a table with no folder, a missing section', () => {
  one(repo({ 'tools/page.html': null }), /names tools\/page\.html, which is not a module/);
  const p = repo({ 'mcp/docs/MODULES.md': doc().replace('In `mcp/lib/`.', 'No folder.') }).problems;
  assert.ok(p.length === 2 && /beta\.mjs: its table has no "In `<folder>\/`\." line/.test(p[0]) && /mcp\/lib\/beta\.mjs: no row/.test(p[1]), p.join('; '));
  assert.match(repo({ 'mcp/docs/MODULES.md': '# M\n' }).problems[0], /has no "## Every module" section/);
});
t('red: a row of 4 cells, a pure cell that says neither yes nor no', () => {
  one(repo({ 'mcp/docs/MODULES.md': doc({ ...ROW, tool: '| `go.mjs` | job | c -> d | `server.mjs` |' }) }), /go\.mjs has 4 cells, not 5/);
  one(repo({ 'mcp/docs/MODULES.md': doc({ ...ROW, tool: ROW.tool.replace('| yes |', '| maybe |') }) }), /go\.mjs's pure cell is "maybe"/);
});
t('red, strict only: a "used by" name that does not load the file, a "pure" the code contradicts', () => {
  const wrong = { 'mcp/docs/MODULES.md': doc({ ...ROW, lib: ROW.lib.replace('`go.mjs`', '`alpha.js`').replace('no: fs', 'yes') }) };
  assert.deepEqual(repo(wrong).problems, []);
  const p = repo(wrong, { strict: true }).problems;
  assert.equal(p.length, 2, p.join('; '));
  assert.ok(p.some((x) => /beta\.mjs is pure "yes", the code says no \(fs\)/.test(x)) && p.some((x) => /names alpha\.js, which does not load it/.test(x)), p.join('; '));
});
t('the repo passes: every module file has exactly one row', () => {
  const r = checkModules();
  assert.deepEqual(r.problems, []);
  assert.equal(r.files, r.rows);
});
t('the command prints its result line, and one FAIL line a miss with the fix', () => {
  const out = execFileSync(process.execPath, [path.join(HERE, 'check-modules.mjs')], { encoding: 'utf8' });
  assert.match(out, /^PASS {2}modules {2}\d+ checks/m);
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'modules-cli-'));
  for (const [f, s] of Object.entries({ ...BASE, 'mcp/lib/gamma.mjs': '', 'mcp/docs/MODULES.md': doc() })) { fs.mkdirSync(path.dirname(path.join(D, f)), { recursive: true }); fs.writeFileSync(path.join(D, f), s); }
  let red = null;
  try { execFileSync(process.execPath, [path.join(HERE, 'check-modules.mjs'), '--root', D], { encoding: 'utf8' }); } catch (e) { red = e; }
  fs.rmSync(D, { recursive: true, force: true });
  assert.ok(red && red.status === 1, 'exit 1');
  assert.match(red.stdout, /^FAIL mcp\/lib\/gamma\.mjs: no row .*add a row to MODULES\.md ## Every module: file \| job \| in -> out \| used by \| pure$/m);
  assert.match(red.stdout, /^FAIL {2}modules {2}1 of \d+ checks failed$/m);
});
console.log(`PASS  test-modules  ${n} checks`);
