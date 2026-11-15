// TR2 ask 7 (D-1111-06): writes mcp/test-checks.json, the check count each mcp/tests.json suite may not fall below, from one
// CI run's manifests (the same folder as scripts/test-times.mjs): never typed by hand.
//   gh run download <run id> --dir <folder>
//   node scripts/test-checks.mjs <folder> [--out mcp/test-checks.json]
// A suite's floor is the LEAST checks it printed on any OS in that run (mutation, fuzz and mh1 count differently per OS).
// The sharded parts of test.mjs (name "mcp") have no floor of their own. ci-sum.mjs fails a suite under its floor
// (cause fewer-checks); the engine's risk.py (ops/gate/risk.py) wants a line in the builder's note when this file's
// numbers fall or an entry goes. Refuses an unfinished run, a failed suite or manifests of more than one run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const dir = args[0], out = path.resolve(opt('--out', path.join(REPO, 'mcp/test-checks.json')));
if (!dir || dir.startsWith('--')) { console.error('usage: node scripts/test-checks.mjs <folder of a CI run\'s artifacts> [--out <file>]'); process.exit(2); }
const reg = JSON.parse(fs.readFileSync(path.join(REPO, 'mcp/tests.json'), 'utf8')), sharded = new Set((reg.suites || []).filter((s) => s.sharded).map((s) => s.name));
const found = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === 'manifest.json') found.push(p); } };
walk(path.resolve(dir));
const problems = [], floor = {}, runs = new Set();
for (const f of found.sort()) {
  const m = JSON.parse(fs.readFileSync(f, 'utf8')), where = path.relative(path.resolve(dir), f);
  runs.add(`${m.run} ${m.commit}`);
  if (m.finished !== true) problems.push(`${where}: the run did not finish`);
  for (const e of m.suites || []) {
    if (e.status === 'FAIL') { problems.push(`${m.os} ${where}: ${e.file} FAIL (${e.cause})`); continue; }
    if (e.status !== 'PASS' || sharded.has(e.name) || !(e.checks > 0)) continue;
    floor[e.name] = Math.min(floor[e.name] ?? Infinity, e.checks);
  }
}
if (!found.length) problems.push(`no manifest.json under ${dir}`);
if (runs.size > 1) problems.push(`the manifests must be of one run and one commit: ${[...runs].join('; ')}`);
if (problems.length) { console.error('test-checks: nothing written:\n' + problems.map((p) => '  - ' + p).join('\n')); process.exit(1); }
const [run, commit] = [...runs][0].split(' ');
const suites = Object.fromEntries(Object.keys(floor).sort().map((k) => [k, floor[k]]));
fs.writeFileSync(out, JSON.stringify({ about: 'The checks each mcp/tests.json suite (by its registered name) may not fall below: the least it printed on any OS in one CI run. Written by scripts/test-checks.mjs, never by hand. ci-sum.mjs fails a suite under its number (fewer-checks); lowering a number or removing an entry needs a line in the builder\'s note (the engine\'s risk.py). A new suite has none until the next refresh.', run, commit, suites }, null, 1) + '\n');
console.log(`test-checks: ${path.relative(REPO, out) || out} from run ${run} (${commit}): ${Object.keys(suites).length} suites, ${Object.values(suites).reduce((a, b) => a + b, 0)} checks`);
