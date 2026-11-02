// (SPD, Codex #1) writes mcp/test-times.json, the seconds CI's plan deals mcp/tests.json's suites by
// (planShards in mcp/test-results.mjs), from one CI run's manifests: never typed by hand.
//   gh run download <run id> --dir <folder>       (every artifact of a green tests.yml run)
//   node scripts/test-times.mjs <folder> [--out mcp/test-times.json]
// It reads every manifest.json under the folder (mcp-shard-<k>-full/, as run-tests writes them), and refuses when one is
// unfinished, a suite in it failed, the manifests are of more than one run or commit, or a suite is there twice for an
// OS. Seconds per OS: each suite's own, test.mjs per part ("test.mjs@k", from shard k); a SKIP counts nothing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const dir = args[0], out = path.resolve(opt('--out', path.join(REPO, 'mcp/test-times.json')));
if (!dir || dir.startsWith('--')) { console.error('usage: node scripts/test-times.mjs <folder of a CI run\'s artifacts> [--out <file>]'); process.exit(2); }
const found = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === 'manifest.json') found.push(p); } };
walk(path.resolve(dir));
const problems = [], os = {}, runs = new Set();
for (const f of found.sort()) {
  const m = JSON.parse(fs.readFileSync(f, 'utf8')), where = path.relative(path.resolve(dir), f);
  runs.add(`${m.run} ${m.commit}`);
  if (m.finished !== true) problems.push(`${where}: the run did not finish`);
  const k = +String(m.shard).split('/')[0], t = (os[m.os] = os[m.os] || {});
  for (const e of m.suites || []) {
    if (e.status === 'FAIL') { problems.push(`${m.os} ${where}: ${e.file} FAIL (${e.cause})`); continue; }
    if (e.status !== 'PASS') continue;
    const key = e.file === 'test.mjs' ? `test.mjs@${k}` : e.file;
    if (Object.hasOwn(t, key)) problems.push(`${m.os}: ${key} twice`);
    t[key] = Math.max(0.1, Math.round(e.seconds * 10) / 10);   // (0.1 at least: 0 would weigh as a suite without a time)
  }
}
if (!found.length) problems.push(`no manifest.json under ${dir}`);
if (runs.size > 1) problems.push(`the manifests must be of one run and one commit: ${[...runs].join('; ')}`);
if (problems.length) { console.error('test-times: nothing written:\n' + problems.map((p) => '  - ' + p).join('\n')); process.exit(1); }
const [run, commit] = [...runs][0].split(' ');
const sorted = Object.fromEntries(Object.keys(os).sort().map((o) => [o, Object.fromEntries(Object.keys(os[o]).sort().map((k) => [k, os[o][k]]))]));
fs.writeFileSync(out, JSON.stringify({ about: 'The seconds each mcp/tests.json suite took per OS in one CI run (test.mjs per part), from its manifests: written by scripts/test-times.mjs, never by hand. CI\'s plan (planShards, mcp/test-results.mjs) deals the suites over the shards by them: they change how even the shards are, never which suites run.', source: { run, commit }, os: sorted }, null, 1) + '\n');
console.log(`test-times: ${path.relative(REPO, out) || out} from run ${run} (${commit}): ${Object.entries(sorted).map(([o, t]) => `${o} ${Object.keys(t).length}`).join(', ')}`);
