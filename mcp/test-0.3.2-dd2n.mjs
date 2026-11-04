// 0.3.2 DD2N (mcp/work/DD2N.md): one way to write a name in TMDL. assets/js/tmdl-name.js tmdlName (bare when a plain
// identifier, else in single quotes with ' doubled; a hyphen is quoted) is the one home of CONTRACTS.md's family
// tmdl-name. Made-up names only. Each answer is pinned.
//   N1-N13  tmdlName on the contracts probe's 9 names and 4 more (a number, a name with two quotes, a leading hyphen,
//           an underscore inside); the .min.js gives the same; F1 the module is frozen, its two names exactly
//   node test-0.3.2-dd2n.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const JS = path.join(HERE, '..', 'assets', 'js');
const require = createRequire(import.meta.url);
const TmdlName = require('../assets/js/tmdl-name.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const src = (f) => fs.readFileSync(path.join(JS, f), 'utf8');
const show = (s) => JSON.stringify(s);

// [id, the name, its TMDL text]: the probe's 9 (scripts/contracts-probe.mjs TNAMES), then 4 more
export const NAMES = [
  ['N1', 'Sales', 'Sales'],
  ['N2', 'Sales Amount', "'Sales Amount'"],
  ['N3', 'Sales-2024', "'Sales-2024'"],
  ['N4', "O'Brien", "'O''Brien'"],
  ['N5', 'المبيعات', "'المبيعات'"],
  ['N6', '_x', '_x'],
  ['N7', '1st', "'1st'"],
  ['N8', '', "''"],
  ['N9', 'Date', 'Date'],
  ['N10', 12, "'12'"],
  ['N11', "it''s", "'it''''s'"],
  ['N12', '-x', "'-x'"],
  ['N13', 'Sales_2024', 'Sales_2024'],
];

const Min = { self: {} }; vm.createContext(Min); vm.runInContext(src('tmdl-name.min.js'), Min);
for (const [id, n, want] of NAMES) {
  const got = TmdlName.tmdlName(n), min = Min.self.DATmdlName.tmdlName(n);
  chk(() => got === want && min === want, () => `${id} ${show(n)}: tmdlName gave ${show(got)} (.min.js ${show(min)}), pinned ${show(want)}`);
}
chk(() => Object.isFrozen(TmdlName) && Object.keys(TmdlName).join() === 'PLAIN,tmdlName',
  () => `F1 the module must be frozen, its names PLAIN and tmdlName: ${Object.keys(TmdlName)}`);

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2n  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2n  ${checks} checks`);
