// Tests for the result adapter (A2, 0.3.1; mcp/test-results.mjs) and the three that read results through it: npm test's
// runner (mcp/run-tests.mjs) on made-up suites, scripts/ci-sum.mjs on made-up CI logs, and --affected's picks. Red on
// c3d7fd4 (the adapter is not there; ci-sum checked shard 0 by its number of result lines, not by which suites ran).
//   node scripts/test-results-adapter.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { results, count, oneLine, parseOneLine, scrub, budget, judge, identityProblems, affected, LIMITS, CAUSES } from '../mcp/test-results.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = fs.mkdtempSync(path.join(os.tmpdir(), 'results-adapter-'));
let n = 0;
const t = (name, fn) => { try { fn(); n++; } catch (e) { e.message = `${name}: ${e.message}`; throw e; } };
const node = (args, env = {}, cwd = REPO) => spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env: { ...process.env, CI: '', GITHUB_ACTIONS: '', DA_SHARD: '', DA_KEEP_GOING: '', DA_VERBOSE: '', ...env } });
const bytes = (s) => Buffer.byteLength(s);
try {
  // ---- the result line, read one way (unchanged since B-198)
  t('result lines and their counts are read as ci-sum read them', () => {
    const r = results('x\nPASS  a  12 checks\nFAIL  b  3 of 9 checks\nSKIP  mcp  (DA_SHARD=0/4: ...)\nPASS  golden  11 tasks match\nPASS one space\n');
    assert.deepEqual(r.map((x) => [x.status, x.name, count(x.rest)]), [['PASS', 'a', 12], ['FAIL', 'b', 9], ['SKIP', 'mcp', null], ['PASS', 'golden', 11]]);
  });
  // ---- the one-line form
  t('a failure is one line, never counted as a result line, and parses back', () => {
    const l = oneLine({ script: 'mcp/test-x.mjs', check: 'K3. the "plan" must\n be refused', cause: 'checks-failed', os: 'windows', shard: '0/4' });
    assert.equal(l, `FAIL script=mcp/test-x.mjs check="K3. the 'plan' must be refused" cause=checks-failed os=windows shard=0/4`);
    assert.deepEqual(results(l), []);
    assert.deepEqual(parseOneLine(l), { script: 'mcp/test-x.mjs', check: "K3. the 'plan' must be refused", cause: 'checks-failed', os: 'windows', shard: '0/4' });
  });
  t('no absolute path: the repo\'s become repo-relative, temp <tmp>, homes ~ (Linux, macOS, Windows, file URLs)', () => {
    const root = '/home/runner/work/DataArcus/DataArcus', wroot = 'D:\\a\\DataArcus\\DataArcus';
    const s = scrub(`at ${root}/mcp/lib/x.mjs:3 and file://${root}/mcp/y.mjs; /tmp/abc/r.json; /home/alice/p, /Users/bob/q, C:\\Users\\carol\\r, ${root}`, { root, home: '/home/runner', tmp: '/tmp' });
    assert.equal(s, 'at mcp/lib/x.mjs:3 and mcp/y.mjs; <tmp>/abc/r.json; ~/p, ~/q, ~\\r, .');
    assert.equal(scrub(`${wroot}\\mcp\\z.mjs, d:\\A\\DataArcus\\DataArcus\\mcp\\w.mjs, C:\\T\\x`, { root: wroot, home: 'C:\\Users\\x', tmp: 'C:\\T' }), 'mcp\\z.mjs, mcp\\w.mjs, <tmp>\\x');
    assert.equal(scrub(`file:///${wroot.replace(/\\/g, '/')}/mcp/a.mjs`, { root: wroot, home: 'C:\\Users\\x', tmp: 'C:\\T' }), 'mcp/a.mjs');
  });
  t('detail: 4 KB a script, 16 KB a run, a long line cut, "N more lines not shown" said', () => {
    const b = budget(), lines = Array.from({ length: 400 }, (_, i) => `      - problem ${i} ${'x'.repeat(60)}`);
    const first = b.take(lines, { log: path.join(REPO, 'mcp/.test-logs/a.log') });
    assert.ok(bytes(first.slice(0, -1).join('\n')) <= LIMITS.script);
    assert.match(first[first.length - 1], /^ {6}\.\.\. \d+ more lines not shown \(full log: mcp\/\.test-logs\/a\.log\)$/);
    for (let i = 0; i < 6; i++) b.take(lines);
    assert.ok(b.left >= 0 && b.left < LIMITS.script, `the run's budget is spent: ${b.left}`);
    const last = b.take(lines);
    assert.equal(last.length, 1); assert.match(last[0], /400 more lines not shown; this run's 16 KB of detail is spent/);
    assert.ok([...budget().take(['y'.repeat(5000)])[0]].length <= LIMITS.line + 3);
  });
  // ---- each cause by its name
  t('each cause is named: checks-failed, timeout, crash, no-result-line, duplicate, unexpected SKIP, 0 checks, exit, name', () => {
    const j = (o) => judge({ name: 'a', ...o });
    assert.deepEqual(j({ out: 'PASS  a  3 checks\n' }).ok, true);
    assert.deepEqual([j({ out: '  - K1 broke\nFAIL  a  1 of 3 checks\n', code: 1 }).cause, j({ out: '  - K1 broke\nFAIL  a  1 of 3 checks\n', code: 1 }).check], ['checks-failed', 'K1 broke']);
    assert.equal(j({ out: 'working\n', timedOut: true, signal: 'SIGKILL' }).cause, 'timeout');
    assert.deepEqual([j({ out: 'x\nTypeError: y is undefined\n    at f (file.mjs:1)\n', code: 1 }).cause, j({ out: 'TypeError: y\n', code: 1 }).check], ['crash', 'TypeError: y']);
    assert.equal(j({ out: 'done\n', code: 0 }).cause, 'no-result-line');
    assert.equal(j({ out: 'PASS  a  3 checks\nPASS  a  3 checks\n' }).cause, 'duplicate-suite');
    assert.equal(j({ out: 'SKIP  a  (no browser)\n' }).cause, 'unexpected-skip');
    assert.equal(j({ out: 'SKIP  a  (DA_SHARD=0/4)\n', skipOk: true }).ok, true);
    assert.equal(j({ out: 'PASS  a  0 checks\n' }).cause, 'zero-checks');
    assert.equal(j({ out: 'PASS  a  3 checks\n', code: 1 }).cause, 'exit-nonzero');
    assert.equal(j({ out: 'PASS  b  3 checks\n' }).cause, 'wrong-name');
    for (const c of ['checks-failed', 'timeout', 'crash', 'no-result-line', 'duplicate-suite', 'unexpected-skip', 'zero-checks', 'exit-nonzero', 'wrong-name', 'missing-suite', 'unknown-suite']) assert.ok(CAUSES[c], c);
  });
  // ---- identities, not counts
  t('the same number of result lines with another suite in place of a listed one fails by name', () => {
    const exp = [{ name: 'a', skip: false }, { name: 'b', skip: false }, { name: 'mcp', skip: true }];
    const found = (txt) => results(txt).map((r) => ({ ...r, where: 'l' }));
    assert.deepEqual(identityProblems(found('PASS  a  1 checks\nPASS  b  1 checks\nSKIP  mcp  x\n'), exp), []);
    assert.deepEqual(identityProblems(found('PASS  a  1 checks\nPASS  z  1 checks\nSKIP  mcp  x\n'), exp).map((p) => `${p.cause} ${p.name}`), ['missing-suite b', 'unknown-suite z']);
    assert.deepEqual(identityProblems(found('PASS  a  1 checks\nPASS  a  1 checks\nSKIP  mcp  x\n'), exp).map((p) => `${p.cause} ${p.name}`), ['missing-suite b', 'duplicate-suite a']);
    assert.deepEqual(identityProblems(found('PASS  a  1 checks\nSKIP  b  x\nSKIP  mcp  x\n'), exp).map((p) => `${p.cause} ${p.name}`), ['unexpected-skip b']);
  });

  // ---- npm test's runner on made-up suites (DA_TESTS_DIR: their own tests.json)
  const S = path.join(D, 'suites'); fs.mkdirSync(S);
  const suite = { pass: "console.log('PASS  pass  3 checks');",
    fail: `for (let i = 0; i < 300; i++) console.log('      - K' + i + ' broke at ' + ${JSON.stringify(REPO)} + '/mcp/lib/x.mjs and ' + ${JSON.stringify(os.homedir())} + '/y');\nconsole.log('FAIL  fail  300 of 310 checks'); process.exit(1);`,
    crash: "console.log('reading'); throw new Error('boom in ' + import.meta.url);",
    hang: "console.log('waiting'); setInterval(() => {}, 1000);",
    noline: "console.log('all good');",
    dup: "console.log('PASS  dup  1 checks'); console.log('PASS  dup  1 checks');",
    skip: "console.log('SKIP  skip  (no browser here)');",
    zero: "console.log('PASS  zero  0 checks');",
    exitbad: "console.log('PASS  exitbad  2 checks'); process.exit(3);",
    named: "console.log('PASS  other  2 checks');" };
  for (const [k, src] of Object.entries(suite)) fs.writeFileSync(path.join(S, `test-${k}.mjs`), src + '\n');
  const names = { named: 'named' };
  fs.writeFileSync(path.join(S, 'tests.json'), JSON.stringify({ areas: { a: 'A', b: 'B' }, suites: Object.keys(suite).map((k) => ({ file: `test-${k}.mjs`, name: names[k] || k, area: k === 'pass' ? 'b' : 'a', purpose: 'p' })), ignored: [], pending: [] }));
  const logs = path.join(D, 'logs');
  const run = node([path.join(REPO, 'mcp/run-tests.mjs'), '--keep-going', '--timeout', '3', '--log-dir', logs], { DA_TESTS_DIR: S });
  const out = run.stdout + run.stderr, lines = out.split('\n');
  t('the runner: exit 1, each failing suite one line with its own cause, the passing one only its result line', () => {
    assert.equal(run.status, 1, out.slice(0, 2000));
    const ones = lines.map(parseOneLine).filter(Boolean);
    assert.deepEqual(ones.map((o) => `${o.script} ${o.cause}`), ['mcp/test-fail.mjs checks-failed', 'mcp/test-crash.mjs crash', 'mcp/test-hang.mjs timeout', 'mcp/test-noline.mjs no-result-line',
      'mcp/test-dup.mjs duplicate-suite', 'mcp/test-skip.mjs unexpected-skip', 'mcp/test-zero.mjs zero-checks', 'mcp/test-exitbad.mjs exit-nonzero', 'mcp/test-named.mjs wrong-name']);
    assert.ok(ones.every((o) => o.os && o.shard === '-'));
    assert.equal(ones[0].check, `K0 broke at mcp/lib/x.mjs and ~/y`);
    assert.match(ones[1].check, /^Error: boom in <tmp>\/results-adapter-\w+\/suites\/test-crash\.mjs/);
    assert.match(ones[2].check, /^stopped after 3s; last: waiting/);
    assert.ok(lines.includes('PASS  pass  3 checks'));
    assert.match(out, /run-tests: 9 of 10 suites failed/);
  });
  t('the runner: 4 KB of a script\'s detail, 16 KB in all, "N more lines not shown", no absolute path on the console', () => {
    const block = out.slice(out.indexOf('FAIL script=mcp/test-fail.mjs'), out.indexOf('FAIL script=mcp/test-crash.mjs')).split('\n').slice(1, -1);
    assert.ok(bytes(block.slice(0, -1).join('\n')) <= LIMITS.script, `${bytes(block.join('\n'))} bytes`);
    assert.match(block[block.length - 1], /\d+ more lines not shown \(full log: .*test-fail\.mjs\.log\)/);
    const detail = lines.filter((l) => /^ {6}/.test(l)).join('\n');
    assert.ok(bytes(detail) <= LIMITS.run + 1024, `${bytes(detail)} bytes of detail`);
    for (const p of [REPO, os.homedir(), os.tmpdir(), D]) assert.ok(!out.includes(p), `the console names ${p}`);
  });
  t('the runner: each suite\'s whole output kept in its log file', () => {
    const full = fs.readFileSync(path.join(logs, 'test-fail.mjs.log'), 'utf8');
    assert.equal(full.split('\n').filter((l) => /^ {6}- K\d+/.test(l)).length, 300);
    assert.ok(fs.existsSync(path.join(logs, 'test-pass.mjs.log')));
  });
  t('the runner stops at the first failure without --keep-going; one area runs alone', () => {
    const r = node([path.join(REPO, 'mcp/run-tests.mjs'), '--log-dir', logs], { DA_TESTS_DIR: S });
    assert.equal(r.status, 1); assert.match(r.stderr, /stopped at test-fail\.mjs; 8 suites after it did not run/);
    const b = node([path.join(REPO, 'mcp/run-tests.mjs'), 'b', '--log-dir', logs], { DA_TESTS_DIR: S });
    assert.equal(b.status, 0, b.stdout + b.stderr); assert.equal(b.stdout, 'PASS  pass  3 checks\nrun-tests: 1 suite passed (b)\n');
  });

  // ---- ci-sum on made-up CI logs: shard 0 by identity
  const reg = path.join(D, 'reg.json');
  fs.writeFileSync(reg, JSON.stringify({ suites: [{ file: 'test.mjs', name: 'mcp', sharded: true }, { file: 'test-a.mjs', name: 'a' }, { file: 'test-b.mjs', name: 'b' }] }));
  const ci = (files, more = []) => { const d = fs.mkdtempSync(path.join(D, 'ci-')); for (const [f, txt] of Object.entries(files)) fs.writeFileSync(path.join(d, f), txt); return node([path.join(REPO, 'scripts/ci-sum.mjs'), 'mcp', d, '--registry', reg, '--os', 'windows', ...more], { GITHUB_ACTIONS: 'true', GITHUB_STEP_SUMMARY: '' }); };
  const parts = { 'mcp-shard-1.log': 'PASS  mcp  700 checks  (shard 1/2: 9 parts)\nG13  40 reports, 0 with errors\n', 'mcp-shard-2.log': 'PASS  mcp  800 checks  (shard 2/2: 9 parts)\nG13  30 reports, 0 with errors\n' };
  t('ci-sum: the listed suites pass and add up', () => {
    const r = ci({ 'mcp-shard-0.log': 'SKIP  mcp  (DA_SHARD=0/2: shards 1-2 run its parts)\nPASS  a  5 checks\nPASS  b  6 checks\n', ...parts });
    assert.equal(r.status, 0, r.stdout); assert.match(r.stdout, /PASS {2}mcp {2}1512 checks in all shards/);
  });
  t('ci-sum: the same count of result lines with another suite in place of b fails, by name, with an annotation in the one-line form', () => {
    const r = ci({ 'mcp-shard-0.log': 'SKIP  mcp  (DA_SHARD=0/2: shards 1-2 run its parts)\nPASS  a  5 checks\nPASS  z  6 checks\n', ...parts });
    assert.equal(r.status, 1);
    const ann = r.stdout.split('\n').filter((l) => l.startsWith('::error'));
    assert.deepEqual(ann, ['::error title=mcp windows::FAIL script=mcp/test-b.mjs check="b: no result line" cause=missing-suite os=windows shard=0/2',
      '::error title=mcp windows::FAIL script=mcp-shard-0.log check="z (mcp-shard-0.log) is not listed" cause=unknown-suite os=windows shard=0/2']);
  });
  t('ci-sum: a suite twice, an unexpected SKIP, test.mjs not skipping in shard 0, a missing shard', () => {
    const r = ci({ 'mcp-shard-0.log': 'PASS  mcp  1 checks  (DA_SHARD=0/2)\nPASS  a  5 checks\nPASS  a  5 checks\nSKIP  b  (why)\n', 'mcp-shard-1.log': parts['mcp-shard-1.log'] });
    const causes = r.stdout.split('\n').map((l) => /cause=(\S+).*shard=(\S+)/.exec(l)).filter(Boolean).filter((m, i, a) => a.findIndex((x) => x[0] === m[0]) === i).map((m) => m[1]);
    for (const c of ['duplicate-suite', 'unexpected-skip', 'missing-shard']) assert.ok(causes.includes(c), `${c} in ${causes}`);
    assert.match(r.stdout, /test\.mjs did not say SKIP/);
  });
  t('ci-sum: a FAIL takes the runner\'s own one-line form from the log', () => {
    const r = ci({ 'mcp-shard-0.log': 'SKIP  mcp  (DA_SHARD=0/2: x)\nPASS  a  5 checks\nFAIL  b  1 of 6 checks\nFAIL script=mcp/test-b.mjs check="K2 broke" cause=checks-failed os=windows shard=0/2\n      - K2 broke\n', ...parts });
    assert.equal(r.status, 1); assert.match(r.stdout, /::error title=mcp windows::FAIL script=mcp\/test-b\.mjs check="K2 broke" cause=checks-failed os=windows shard=0\/2/);
  });
  t('ci-sum website: run-all\'s ALL by name, through the same identity check', () => {
    const all = path.join(D, 'run-all.mjs'); fs.writeFileSync(all, "const ALL = ['site', 'dax'];\n");
    const d = fs.mkdtempSync(path.join(D, 'web-'));
    fs.writeFileSync(path.join(d, 'suites-1.log'), 'PASS  site               9 checks  3s\n\nAll 1 passed (3s)\n'); fs.writeFileSync(path.join(d, 'suites-2.log'), 'PASS  pbip               9 checks  3s\n\nAll 1 passed (3s)\n');
    const r = node([path.join(REPO, 'scripts/ci-sum.mjs'), 'website', d, '--all', all, '--os', 'linux']);
    assert.equal(r.status, 1); assert.match(r.stdout, /check="dax: no result line" cause=missing-suite/); assert.match(r.stdout, /cause=unknown-suite/);
  });

  // (SQ11, A2-S1) a website suite that ran nothing passes nothing: ci-sum and run-all both say zero-checks
  t('ci-sum website: a PASS with 0 checks (or no count) is zero-checks', () => {
    const all = path.join(D, 'run-all-z.mjs'); fs.writeFileSync(all, "const ALL = ['site', 'dax', 'pbip'];\n");
    const d = fs.mkdtempSync(path.join(D, 'webz-'));
    fs.writeFileSync(path.join(d, 'suites-1.log'), 'PASS  site               0 checks  3s\nPASS  dax                5 checks  3s\nPASS  pbip  3s\n\nAll 3 passed (3s)\n');
    const r = node([path.join(REPO, 'scripts/ci-sum.mjs'), 'website', d, '--all', all, '--os', 'linux']);
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stdout, /FAIL script=scripts\/tests\/run-all\.mjs:site check="PASS site 0 checks 3s" cause=zero-checks os=linux shard=1\/1/);
    assert.match(r.stdout, /script=scripts\/tests\/run-all\.mjs:pbip check="PASS pbip 3s" cause=zero-checks/);
    assert.doesNotMatch(r.stdout, /run-all\.mjs:dax/);
  });
  t('run-all: a suite that ran 0 checks fails as zero-checks (its source)', () => {
    const src = fs.readFileSync(path.join(REPO, 'scripts/tests/run-all.mjs'), 'utf8');
    assert.match(src, /zero-checks/); assert.match(src, /res\.checks/);
  });

  // ---- --affected (local only)
  const R = JSON.parse(fs.readFileSync(path.join(REPO, 'mcp/tests.json'), 'utf8'));
  t('--affected: a twin module picks area twin with its reason; a suite file itself; a note picks nothing', () => {
    const a = affected(['mcp/lib/twin-write.mjs', 'mcp/test-0.3.1-checker.mjs', 'mcp/work/A2.md'], R);
    assert.equal(a.all, false);
    assert.match(a.reasons[0], /^mcp\/lib\/twin-write\.mjs -> area twin: test-0\.3\.0-twin-complete\.mjs, /);
    assert.deepEqual(a.reasons.slice(1), ['mcp/test-0.3.1-checker.mjs -> its own suite: test-0.3.1-checker.mjs', 'mcp/work/A2.md -> no suite reads it']);
    assert.deepEqual(a.suites.map((s) => s.file), R.suites.filter((s) => s.area === 'twin' || s.file === 'test-0.3.1-checker.mjs').map((s) => s.file));
  });
  t('--affected: safety infrastructure, an unmapped engine and an unknown path pick everything', () => {
    for (const p of ['mcp/lib/write-io.mjs', 'mcp/lib/plans.mjs', 'mcp/lib/files.mjs', 'mcp/lib/model.mjs', 'mcp/lib/approval-window.mjs', 'mcp/lib/answer.mjs', 'mcp/lib/agent-text.mjs', 'assets/js/main.js', 'somewhere/new.txt', 'mcp/test-env.mjs']) {
      const a = affected([p], R); assert.equal(a.all, true, p); assert.equal(a.suites.length, R.suites.length, p);
    }
    assert.ok(R.affected.areas.twin.some((q) => q.includes('report-mirror')), 'the mirror engine is mapped to its areas');
  });
  t('--affected refuses in CI and is said to be local only', () => {
    const r = node([path.join(REPO, 'mcp/run-tests.mjs'), '--affected', '--list'], { CI: 'true' });
    assert.equal(r.status, 2); assert.match(r.stderr, /local runs only/);
    const h = node([path.join(REPO, 'mcp/run-tests.mjs'), '--help']);
    assert.match(h.stdout, /CI and the final gate NEVER use it/);
    assert.match(fs.readFileSync(path.join(REPO, 'mcp/docs/TESTS.md'), 'utf8'), /--affected[\s\S]{0,700}never use it/i);
  });
  t('--affected=HEAD lists the reasons and the picks, runs nothing with --list', () => {
    const r = node([path.join(REPO, 'mcp/run-tests.mjs'), '--affected=HEAD', '--list']);
    assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /^run-tests --affected \(since HEAD; local only/);
  });
} finally { fs.rmSync(D, { recursive: true, force: true }); }
console.log(`PASS  results-adapter  ${n} checks`);
