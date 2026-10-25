// npm test's runner (G1, 0.3.1): runs the suites of tests.json one after another, in its order, each as `node <file>`
// with this folder as its working folder; every suite prints its own result line unchanged ("PASS  <name>  <N> checks",
// as scripts/ci-sum.mjs counts them). Before 0.3.1 the suites were one long `&&` line in package.json.
//   npm test                         every suite; stops at the first that fails (as the && line did)
//   npm test -- <area> [<area> ...]  only those areas (tests.json "areas"), in the same order
//   npm test -- --keep-going         runs every suite and fails at the end, naming each that failed (DA_KEEP_GOING=1 too;
//                                    CI's shard 0 uses it, so one failure no longer hides the suites after it)
//   npm test -- --list               prints the suites with their area and purpose, runs nothing
// It refuses to run when a test-*.mjs file in this folder is in neither "suites" nor "ignored" (nor "pending" before
// its file lands): a new suite must be registered once, here, and nowhere else.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function readRegistry(dir = HERE) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'tests.json'), 'utf8'));
}

// what is wrong with the registry: a test-*.mjs file listed nowhere, a listed file that is not there, a file twice,
// an unknown area, a pending suite whose file has landed
export function registryProblems(dir = HERE, reg = readRegistry(dir)) {
  const problems = [], seen = new Map();
  const add = (f, where) => { if (seen.has(f)) problems.push(`${f}: listed twice (${seen.get(f)} and ${where})`); else seen.set(f, where); };
  for (const s of reg.suites || []) {
    add(s.file, 'suites');
    if (!reg.areas || !Object.hasOwn(reg.areas, s.area)) problems.push(`${s.file}: unknown area "${s.area}"`);
    if (!s.purpose) problems.push(`${s.file}: no purpose`);
    if (!fs.existsSync(path.join(dir, s.file))) problems.push(`${s.file}: in suites but the file is not there`);
  }
  for (const s of reg.ignored || []) {
    add(s.file, 'ignored');
    if (!s.why) problems.push(`${s.file}: ignored without a why`);
    if (!fs.existsSync(path.join(dir, s.file))) problems.push(`${s.file}: in ignored but the file is not there`);
  }
  for (const s of reg.pending || []) {
    add(s.file, 'pending');
    if (fs.existsSync(path.join(dir, s.file))) problems.push(`${s.file}: its file has landed: move it from pending into suites`);
  }
  for (const f of fs.readdirSync(dir).filter((f) => /^test.*\.mjs$/.test(f)).sort()) {
    if (!seen.has(f)) problems.push(`${f}: in neither suites nor ignored (tests.json): register it once`);
  }
  if (!(reg.suites || []).length) problems.push('tests.json lists no suites');
  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), reg = readRegistry();
  const keepGoing = args.includes('--keep-going') || process.env.DA_KEEP_GOING === '1';
  const areas = args.filter((a) => !a.startsWith('--'));
  const unknown = areas.filter((a) => !Object.hasOwn(reg.areas, a));
  if (unknown.length) {
    console.error(`run-tests: unknown area ${unknown.join(', ')}; the areas are:\n` + Object.entries(reg.areas).map(([k, v]) => `  ${k.padEnd(9)} ${v}`).join('\n'));
    process.exit(2);
  }
  const suites = reg.suites.filter((s) => !areas.length || areas.includes(s.area));
  if (args.includes('--list')) {
    console.log(suites.map((s) => `${s.area.padEnd(9)} ${s.file.padEnd(40)} ${s.purpose}`).join('\n'));
    process.exit(0);
  }
  const problems = registryProblems();
  if (problems.length) {
    console.error('run-tests: tests.json does not match the test files; nothing ran:\n' + problems.map((p) => '  - ' + p).join('\n'));
    process.exit(1);
  }
  const failed = [];
  for (const [i, s] of suites.entries()) {
    const r = spawnSync(process.execPath, [s.file], { cwd: HERE, stdio: 'inherit' });
    const code = r.status ?? 1;
    if (code === 0 && !r.error) continue;
    failed.push(`${s.file} (exit ${r.error ? r.error.message : r.signal || code})`);
    if (!keepGoing) {
      const left = suites.length - i - 1;
      console.error(`run-tests: stopped at ${s.file}; ${left} suite${left === 1 ? '' : 's'} after it did not run (npm test -- --keep-going runs them all)`);
      process.exit(code || 1);
    }
  }
  if (failed.length) {
    console.error(`run-tests: ${failed.length} of ${suites.length} suites failed:\n` + failed.map((f) => '  - ' + f).join('\n'));
    process.exit(1);
  }
  console.log(`run-tests: ${suites.length} suite${suites.length === 1 ? '' : 's'} passed${areas.length ? ` (${areas.join(', ')})` : ''}`);
}
