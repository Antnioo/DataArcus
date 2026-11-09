// Tests for check-contracts.mjs (0.3.2 CL1) on a made-up repo: a place whose file is gone, whose function is gone or no
// longer inside the function named, a wrong MODULES.md link, a family with too few inputs, a place the probe runs and
// the ledger misses (and the other way), a family on one side only, a top table that counts wrong and a "Not one
// question" name that is gone are each named, with the fix; then the repo itself passes, and the command prints its
// result line.
//   node scripts/test-contracts.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkContracts, slug } from './check-contracts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let n = 0;
const t = (name, fn) => { try { fn(); n++; } catch (e) { console.error(`FAIL  test-contracts  ${name}: ${e.message}`); process.exit(1); } };

const inputs = (k) => Array.from({ length: k }, (_, i) => ({ label: 'in' + i }));
const FAMS = [{ id: 'x1', title: 'Is it made up?', inputs: inputs(8), places: [
  { file: 'assets/js/alpha.js', fn: 'isUp' },
  { file: 'mcp/lib/beta.mjs', fn: 'inner', within: 'outer' },
] }];
const ROWS = {
  alpha: '| `assets/js/alpha.js` `isUp` | [engines](MODULES.md#the-engines) | the made-up page |',
  beta: '| `mcp/lib/beta.mjs` `inner` (in `outer`) | [lib](MODULES.md#the-mcp-lib) | the made-up tool |',
};
const EQUAL = '| twin | `assets/js/alpha.js` `twin`; `mcp/lib/beta.mjs` `twin` | yes | equal |';
const ledger = ({ rows = [ROWS.alpha, ROWS.beta], top = '| [x1 Is it made up?](#x1) | 2 | 1 of 8 | a page | (to come) |', not = '- `mcp/lib/beta.mjs` `outer`: a shape, not a question.', equal = EQUAL } = {}) =>
  '# Ledger\n\n## The families\n\n| family | places | disagree on N of M inputs | who sees it | newest copy |\n|---|---|---|---|---|\n' + top
  + '\n\n## x1 Is it made up?\n\n| place | MODULES.md | who sees it |\n|---|---|---|\n' + rows.join('\n') + '\n\n## Equal copies, not probed\n\n| copy | places | same text | newest copy |\n|---|---|---|---|\n' + equal + '\n\n## Not one question\n\n' + not + '\n';
const BASE = {
  'assets/js/alpha.js': "(function (root) { const isUp = (x) => !!x; const twin = (s) => String(s).trim(); const api = { isUp }; if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.A = api; })(this);\n",
  'mcp/lib/beta.mjs': 'export function outer(a) {\n  const inner = (b) => a + b;\n  return inner(1);\n}\nconst twin = (s) =>  String(s).trim();\n',
  'mcp/docs/MODULES.md': '# M\n\n## Every module\n\n### The engines\n\nIn `assets/js/`.\n\n| file | job | in -> out | used by | pure |\n|---|---|---|---|---|\n| `alpha.js` | up | x -> y | `beta.mjs` | yes |\n\n### The MCP: lib\n\nIn `mcp/lib/`.\n\n| file | job | in -> out | used by | pure |\n|---|---|---|---|---|\n| `beta.mjs` | b | a -> b | `server.mjs` | yes |\n',
};
function repo(over = {}, fams = FAMS) {
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'contracts-'));
  const files = Object.assign({}, BASE, { 'mcp/docs/CONTRACTS.md': ledger() }, over);
  for (const [f, s] of Object.entries(files)) { if (s == null) continue; fs.mkdirSync(path.dirname(path.join(D, f)), { recursive: true }); fs.writeFileSync(path.join(D, f), s); }
  const r = checkContracts(D, fams);
  fs.rmSync(D, { recursive: true, force: true });
  return r;
}
const one = (r, re) => { assert.equal(r.problems.length, 1, r.problems.join('; ')); assert.match(r.problems[0], re); };
const some = (r, re) => assert.ok(r.problems.some((p) => re.test(p)), r.problems.join('; '));

t('a made-up repo within every rule passes; the anchors are GitHub\'s', () => {
  assert.deepEqual(repo().problems, []);
  assert.equal(slug("The MCP: create_report and its options"), 'the-mcp-create_report-and-its-options');
  assert.equal(slug("The browser pages' own scripts"), 'the-browser-pages-own-scripts');
});
t('red: a place whose file is gone', () => some(repo({ 'assets/js/alpha.js': null }), /assets\/js\/alpha\.js is not there: the file moved or went/));
t('red: a place whose function is gone (renamed)', () => one(repo({ 'assets/js/alpha.js': BASE['assets/js/alpha.js'].replace(/isUp/g, 'isUpNow') }), /assets\/js\/alpha\.js has no isUp: the function was renamed or moved/));
t('red: a nested place whose outer function is gone, or that is no longer inside it', () => {
  one(repo({ 'mcp/lib/beta.mjs': BASE['mcp/lib/beta.mjs'].replace(/outer/g, 'other') + 'export const outer2 = 1;\n', 'mcp/docs/CONTRACTS.md': ledger({ not: '' }) }), /has no outer \(the function inner sits in\)/);
  one(repo({ 'mcp/lib/beta.mjs': 'const inner = (b) => b;\nexport function outer(a) { return inner(a); }\nconst twin = (s) => String(s).trim();\n' }), /beta\.mjs's inner is not inside outer/);
});
t('red: a MODULES.md link to a part that does not hold the row', () => one(repo({ 'mcp/docs/CONTRACTS.md': ledger({ rows: [ROWS.alpha.replace('#the-engines', '#the-mcp-lib'), ROWS.beta] }) }), /MODULES\.md link is #the-mcp-lib, its row is under #the-engines/));
t('red: a family with fewer than 8 inputs (and the top table that still says 8)', () => {
  const r = repo({}, [Object.assign({}, FAMS[0], { inputs: inputs(7) })]);
  assert.equal(r.problems.length, 2, r.problems.join('; '));
  some(r, /family x1: 7 inputs, at least 8: add made-up inputs/); some(r, /x1 says "of 8 inputs", the probe has 7/);
});
t('red: a place the probe runs and the ledger misses, and one the ledger names and the probe does not run', () => {
  one(repo({ 'mcp/docs/CONTRACTS.md': ledger({ rows: [ROWS.alpha], top: '| [x1 Is it made up?](#x1) | 2 | 1 of 8 | a page | |' }) }), /the probe runs mcp\/lib\/beta\.mjs inner in outer, the ledger does not name it/);
  const r = repo({ 'mcp/docs/CONTRACTS.md': ledger({ top: '| [x1 Is it made up?](#x1) | 1 | 1 of 8 | a page | |' }) }, [Object.assign({}, FAMS[0], { places: [FAMS[0].places[0]] })]);
  one(r, /mcp\/lib\/beta\.mjs inner in outer is not in the probe: add it to the family's places/);
});
t('red: a family in the probe and not in the ledger, and one in the ledger with no probe family', () => {
  some(repo({}, FAMS.concat({ id: 'x2', title: 'Another?', inputs: inputs(8), places: [] })), /family x2 is in the probe and not in mcp\/docs\/CONTRACTS\.md/);
  some(repo({}, [Object.assign({}, FAMS[0], { id: 'x9' })]), /family x1 has no inputs in scripts\/contracts-probe\.mjs/);
});
t('red: a top table that counts the places or the inputs wrong, a family with no row there', () => {
  one(repo({ 'mcp/docs/CONTRACTS.md': ledger({ top: '| [x1 Is it made up?](#x1) | 3 | 1 of 8 | a page | |' }) }), /x1 says 3 places, the probe runs 2/);
  one(repo({ 'mcp/docs/CONTRACTS.md': ledger({ top: '| [x1 Is it made up?](#x1) | 2 | 1 of 9 | a page | |' }) }), /x1 says "of 9 inputs", the probe has 8/);
  one(repo({ 'mcp/docs/CONTRACTS.md': ledger({ top: '' }) }), /family x1 has no row in the top table/);
});
t('red: a "Not one question" name that is gone', () => one(repo({ 'mcp/docs/CONTRACTS.md': ledger({ not: '- `mcp/lib/beta.mjs` `gone`: a shape.' }) }), /"Not one question": mcp\/lib\/beta\.mjs has no gone/));
t('red: an equal copy that drifts from its twin, and a copy of one place; a row that says "no" is not compared', () => {
  one(repo({ 'mcp/lib/beta.mjs': BASE['mcp/lib/beta.mjs'].replace('String(s).trim()', 'String(s)') }), /"twin" says the same text, and mcp\/lib\/beta\.mjs twin now differ from assets\/js\/alpha\.js/);
  one(repo({ 'mcp/docs/CONTRACTS.md': ledger({ equal: '| twin | `assets/js/alpha.js` `twin` | yes | equal |' }) }), /the copy "twin" names 1 place/);
  assert.deepEqual(repo({ 'mcp/lib/beta.mjs': BASE['mcp/lib/beta.mjs'].replace('String(s).trim()', 'String(s)'), 'mcp/docs/CONTRACTS.md': ledger({ equal: EQUAL.replace('| yes |', '| no: one trims |') }) }).problems, []);
  some(repo({ 'mcp/lib/beta.mjs': BASE['mcp/lib/beta.mjs'].replace(/const twin[^\n]*\n/, '') }), /"twin": mcp\/lib\/beta\.mjs has no twin/);
});
t('red: no ledger at all', () => one(repo({ 'mcp/docs/CONTRACTS.md': null }), /mcp\/docs\/CONTRACTS\.md is not there/));
t('the repo passes: every place of every family is there, the ledger and the probe agree', () => {
  const r = checkContracts();
  assert.deepEqual(r.problems, []);
  assert.ok(r.families >= 12 && r.places >= r.families * 2, `${r.families} families, ${r.places} places`);
});
t('the command prints its result line, and one FAIL line a miss with the fix', () => {
  assert.match(execFileSync(process.execPath, [path.join(HERE, 'check-contracts.mjs')], { encoding: 'utf8' }), /^PASS {2}contracts {2}\d+ checks/m);
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'contracts-'));
  let out = '';
  try { execFileSync(process.execPath, [path.join(HERE, 'check-contracts.mjs'), '--root', D], { encoding: 'utf8' }); } catch (e) { out = e.stdout; }
  fs.rmSync(D, { recursive: true, force: true });
  assert.match(out, /^FAIL mcp\/docs\/CONTRACTS\.md is not there: write the ledger/m);
  assert.match(out, /^FAIL {2}contracts {2}1 of 0 checks failed$/m);
});
console.log(`PASS  test-contracts  ${n} checks`);
