// npm test's runner (G1, 0.3.1): runs the suites of tests.json one after another, in its order, each as `node <file>`
// with this folder as its working folder. Before 0.3.1 the suites were one long `&&` line in package.json.
// (A2, 0.3.1) Each suite's output is read through the result adapter (test-results.mjs): the console shows each suite's
// result line ("PASS  <name>  <N> checks", as scripts/ci-sum.mjs counts them; test.mjs's G13 line too) and, for a
// failure, one line first, then at most 4 KB of its detail (16 KB a run); the full output is in the log folder.
export const HELP = `npm test [-- <options>]  (mcp/run-tests.mjs; the suites: mcp/tests.json)
  npm test                         every suite; stops at the first that fails
  npm test -- <area> [<area> ...]  only those areas (tests.json "areas"), in the same order
  npm test -- --keep-going         every suite, fails at the end naming each that failed (DA_KEEP_GOING=1 too; CI uses it)
  npm test -- --list               the suites with their area and purpose; runs nothing
  npm test -- --verbose            every suite's whole output on the console as it runs (DA_VERBOSE=1 too)
  npm test -- --log-dir <folder>   where each suite's full output is kept (default mcp/.test-logs/, git-ignored)
  npm test -- --timeout <seconds>  a suite running longer is stopped and fails as "timeout" (DA_SUITE_TIMEOUT; 2700)
  npm test -- --affected[=<ref>]   LOCAL RUNS ONLY: the suites the files changed since <ref> touch (git diff --name-only
                                   <ref>, and new files; default tests.json affected.base), the reason printed for each
                                   pick. CI and the final gate NEVER use it: they run every suite (it refuses in CI).
  DA_SHARD=k/N                     CI's shard k of this OS: test.mjs's part k (SKIP when k is 0) and the suites
                                   the plan deals to shard k by mcp/test-times.json (each suite in one shard)
  npm test -- --plan [--os <os>]   CI's plan for an OS (default this one): each shard's seconds and suites
A failure prints: FAIL script=<file> check="<first failing check>" cause=<cause> os=<os> shard=<k/N>
  causes: ${'checks-failed timeout crash no-result-line duplicate-suite unexpected-skip zero-checks exit-nonzero wrong-name'}
It refuses to run when a test-*.mjs file in this folder is in neither "suites" nor "ignored" (nor "pending").`;
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { judge, oneLine, detailOf, budget, isSummaryLine, osName, shardOf, affected, scrub, count, planShards, MANIFEST, REPO } from './test-results.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function readRegistry(dir = HERE) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'tests.json'), 'utf8'));
}
// (SPD) the measured seconds CI's plan deals the suites by (none: every suite weighs the same; the plan still deals each once)
export function readTimes(dir = HERE) {
  try { return JSON.parse(fs.readFileSync(path.join(dir, 'test-times.json'), 'utf8')); } catch { return {}; }
}

// what is wrong with the registry: a test-*.mjs file listed nowhere, a listed file that is not there, a file twice,
// an unknown area, a pending suite whose file has landed, a suite without its result name or with another's
// (names: true, as the runner and check-result-lines ask: every suite has its result name)
export function registryProblems(dir = HERE, reg = readRegistry(dir), { names: needNames = false } = {}) {
  const problems = [], seen = new Map(), names = new Map();
  const add = (f, where) => { if (seen.has(f)) problems.push(`${f}: listed twice (${seen.get(f)} and ${where})`); else seen.set(f, where); };
  for (const s of reg.suites || []) {
    add(s.file, 'suites');
    if (!reg.areas || !Object.hasOwn(reg.areas, s.area)) problems.push(`${s.file}: unknown area "${s.area}"`);
    if (!s.purpose) problems.push(`${s.file}: no purpose`);
    if (!s.name) { if (needNames) problems.push(`${s.file}: no name (the name its result line prints)`); }
    else if (names.has(s.name)) problems.push(`${s.file}: its name "${s.name}" is ${names.get(s.name)}'s too`);
    else names.set(s.name, s.file);
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
  for (const a of Object.keys((reg.affected || {}).areas || {})) if (!Object.hasOwn(reg.areas || {}, a)) problems.push(`affected: unknown area "${a}"`);
  if (!(reg.suites || []).length) problems.push('tests.json lists no suites');
  return problems;
}

// one suite: its output (stdout and stderr as they came), exit code, signal, and whether its time ran out
function runOne(file, { cwd, timeout, verbose, env = process.env }) {
  return new Promise((resolve) => {
    const win = process.platform === 'win32';
    const child = spawn(process.execPath, [file], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], detached: !win, windowsHide: true });
    const chunks = [];
    let timedOut = false, done = false;
    const kill = () => { try { if (win) execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); else process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch { /* gone */ } } };
    runOne.current = kill;
    for (const [s, to] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) s.on('data', (c) => { chunks.push(c); if (verbose) to.write(c); });
    const timer = setTimeout(() => { timedOut = true; kill(); }, timeout * 1000);
    const finish = (code, signal, error) => {
      if (done) return; done = true; clearTimeout(timer); runOne.current = null;
      // a grandchild still holding the pipes (a server the suite started) must not keep the run waiting
      setTimeout(() => resolve({ out: Buffer.concat(chunks).toString('utf8'), code, signal, timedOut, error }), child.stdout.readableEnded ? 0 : 500);
    };
    child.on('error', (e) => finish(1, null, e));
    child.on('exit', (code, signal) => finish(code, signal));
  });
}

// the files changed since ref (tracked: git diff against the working tree; and new files), repo-relative
export function changedSince(ref) {
  const git = (a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).split('\n').filter(Boolean);
  return [...new Set([...git(['diff', '--name-only', ref]), ...git(['ls-files', '--others', '--exclude-standard'])])].sort();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // DA_TESTS_DIR: another folder with its own tests.json (the adapter's tests run the runner on made-up suites)
  const DIR = process.env.DA_TESTS_DIR ? path.resolve(process.env.DA_TESTS_DIR) : HERE;
  const args = process.argv.slice(2), reg = readRegistry(DIR);
  if (args.includes('--help') || args.includes('-h')) { console.log(HELP); process.exit(0); }
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const keepGoing = args.includes('--keep-going') || process.env.DA_KEEP_GOING === '1';
  const verbose = args.includes('--verbose') || process.env.DA_VERBOSE === '1';
  const timeout = +(opt('--timeout') || process.env.DA_SUITE_TIMEOUT || 2700);
  const logDir = path.resolve(opt('--log-dir') || path.join(DIR, '.test-logs'));
  const aff = args.find((a) => a === '--affected' || a.startsWith('--affected='));
  const valued = new Set(['--timeout', '--log-dir', '--os'].map((o) => args.indexOf(o) + 1).filter((i) => i > 0));
  const areas = args.filter((a, i) => !a.startsWith('--') && a !== '-h' && !valued.has(i));
  const unknown = areas.filter((a) => !Object.hasOwn(reg.areas, a));
  if (unknown.length) {
    console.error(`run-tests: unknown area ${unknown.join(', ')}; the areas are:\n` + Object.entries(reg.areas).map(([k, v]) => `  ${k.padEnd(9)} ${v}`).join('\n'));
    process.exit(2);
  }
  if (!(timeout > 0)) { console.error('run-tests: --timeout takes seconds, more than 0'); process.exit(2); }
  // (SPD, Codex #1) DA_SHARD=k/N runs CI's shard k: test.mjs (its part k; a SKIP in shard 0) and the suites the plan
  // deals to shard k on this OS (planShards, by mcp/test-times.json), each other suite with DA_SHARD=0/N as before
  const shard = shardOf(), k = shard === '-' ? null : +shard.split('/')[0], N = shard === '-' ? null : +shard.split('/')[1];
  const inShard = k === null ? null : new Set(planShards(reg, readTimes(DIR), osName(), N).shards[k].map((s) => s.file));
  let suites = reg.suites.filter((s) => (!areas.length || areas.includes(s.area)) && (!inShard || inShard.has(s.file)));
  const envOf = (s) => (N === null || s.sharded ? process.env : { ...process.env, DA_SHARD: `0/${N}` });
  if (aff) {
    if (process.env.CI || process.env.GITHUB_ACTIONS) { console.error('run-tests: --affected is for local runs only; CI and the final gate run every suite'); process.exit(2); }
    const ref = aff.includes('=') ? aff.slice(aff.indexOf('=') + 1) : (reg.affected || {}).base;
    let paths;
    try { paths = changedSince(ref); } catch (e) { console.error(`run-tests: git diff --name-only ${ref} failed: ${scrub(String(e.stderr || e.message)).trim()}`); process.exit(2); }
    const a = affected(paths, reg);
    console.log(`run-tests --affected (since ${ref}; local only, CI and the final gate run every suite):`);
    console.log((a.reasons.length ? a.reasons : ['no file changed']).map((r) => '  ' + r).join('\n'));
    suites = suites.filter((s) => a.suites.includes(s));
    console.log(`  -> ${a.all ? 'every suite' : `${suites.length} suite${suites.length === 1 ? '' : 's'}`}`);
    if (!suites.length) process.exit(0);
  }
  if (args.includes('--plan')) {
    const os = opt('--os') || osName(), n = N || 4, p = planShards(reg, readTimes(DIR), os, n);
    console.log(p.shards.map((x, j) => `shard ${j}/${n} (${os}) ${String(p.loads[j]).padStart(7)} s: ${x.filter((s) => !s.sharded || j).map((s) => s.sharded ? `${s.file} (part ${j})` : s.file).join(', ')}`).join('\n'));
    process.exit(0);
  }
  if (args.includes('--list')) {
    console.log(suites.map((s) => `${s.area.padEnd(9)} ${s.file.padEnd(40)} ${s.purpose}`).join('\n'));
    process.exit(0);
  }
  const problems = registryProblems(DIR, reg, { names: true });
  if (problems.length) {
    console.error('run-tests: tests.json does not match the test files; nothing ran:\n' + problems.map((p) => '  - ' + p).join('\n'));
    process.exit(1);
  }
  fs.mkdirSync(logDir, { recursive: true });
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { if (runOne.current) runOne.current(); process.exit(130); });
  const failed = [], spend = budget(), seen = new Map(), o = osName();
  // (SPD, Codex #10) the manifest: each suite's seconds, status, checks and cause, written after each suite; finished
  // only when the run got to its end (ci-sum rejects a shard whose manifest is missing or unfinished)
  const manifest = { os: o, shard, commit: process.env.GITHUB_SHA || null, run: process.env.GITHUB_RUN_ID || null, node: process.version, planned: suites.map((s) => s.file), suites: [], finished: false };
  const writeManifest = (finished = false) => { manifest.finished = finished; fs.writeFileSync(path.join(logDir, MANIFEST), JSON.stringify(manifest, null, 1) + '\n'); };
  writeManifest();
  for (const [i, s] of suites.entries()) {
    const t0 = Date.now(), r = await runOne(s.file, { cwd: DIR, timeout, verbose, env: envOf(s) });
    const seconds = Math.round((Date.now() - t0) / 100) / 10;
    const log = path.join(logDir, s.file.replace(/[\\/]/g, '__') + '.log');
    fs.writeFileSync(log, r.out);
    if (!verbose) r.out.replace(/\r\n/g, '\n').split('\n').filter(isSummaryLine).forEach((l) => console.log(l));
    let j = judge({ ...r, code: r.error ? 1 : r.code, name: s.name, skipOk: !!s.sharded && k === 0 });
    // a name printed by an earlier suite of this run too
    if (j.ok && seen.has(s.name)) j = { ok: false, cause: 'duplicate-suite', check: `"${s.name}" printed by ${seen.get(s.name)} too` };
    seen.set(s.name, s.file);
    const own = (j.results || []).filter((x) => x.name === s.name).pop();
    manifest.suites.push({ file: s.file, name: s.name, seconds, status: j.ok ? (j.skipped ? 'SKIP' : 'PASS') : 'FAIL', checks: own ? count(own.rest) : null, cause: j.ok ? null : j.cause });
    writeManifest();
    if (j.ok) continue;
    const fromEnd = ['crash', 'timeout', 'no-result-line'].includes(j.cause);
    const check = j.cause === 'timeout' ? `stopped after ${timeout}s; last: ${j.check}` : j.cause === 'crash' && r.error ? r.error.message : j.check;
    console.log(oneLine({ script: 'mcp/' + s.file, check, cause: j.cause, os: o, shard }));
    if (!verbose) spend.take(detailOf(r.out).map((l) => '      ' + l.trim()), { fromEnd, log }).forEach((l) => console.log(l));
    failed.push(`${s.file} (${j.cause})`);
    if (!keepGoing) {
      writeManifest(true);
      const left = suites.length - i - 1;
      console.error(`run-tests: stopped at ${s.file}; ${left} suite${left === 1 ? '' : 's'} after it did not run (npm test -- --keep-going runs them all)`);
      process.exit(r.code || 1);
    }
  }
  writeManifest(true);
  if (failed.length) {
    console.error(`run-tests: ${failed.length} of ${suites.length} suites failed:\n` + failed.map((f) => '  - ' + f).join('\n'));
    process.exit(1);
  }
  console.log(`run-tests: ${suites.length} suite${suites.length === 1 ? '' : 's'} passed${areas.length ? ` (${areas.join(', ')})` : ''}`);
}
