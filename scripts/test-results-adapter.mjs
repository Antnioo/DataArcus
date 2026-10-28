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
import * as adapter from '../mcp/test-results.mjs';
const { results, count, oneLine, parseOneLine, scrub, budget, judge, identityProblems, affected, LIMITS, CAUSES } = adapter;

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
  // (SPD, Codex #10) the run's manifest: one entry per suite, its seconds, status, checks and cause; finished
  t('the runner writes manifest.json: each suite with its seconds, status, checks and cause; the run finished', () => {
    const m = JSON.parse(fs.readFileSync(path.join(logs, 'manifest.json'), 'utf8'));
    assert.equal(m.finished, true); assert.equal(m.shard, '-'); assert.ok(m.os);
    assert.deepEqual(m.planned, Object.keys(suite).map((k) => `test-${k}.mjs`));
    const by = Object.fromEntries(m.suites.map((e) => [e.file, e]));
    assert.deepEqual(m.suites.map((e) => e.file), m.planned);
    assert.deepEqual([by['test-pass.mjs'].status, by['test-pass.mjs'].checks, by['test-pass.mjs'].cause], ['PASS', 3, null]);
    assert.deepEqual([by['test-hang.mjs'].status, by['test-hang.mjs'].cause], ['FAIL', 'timeout']);
    assert.ok(by['test-hang.mjs'].seconds >= 3 && by['test-pass.mjs'].seconds < 3, JSON.stringify(by['test-hang.mjs']));
    assert.deepEqual([by['test-crash.mjs'].cause, by['test-zero.mjs'].cause, by['test-fail.mjs'].checks], ['crash', 'zero-checks', 310]);
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
  // (SPD) each shard's log comes with its manifest (mcp-shard-<k>-full/manifest.json, as the runner writes it); manifests
  // made from the log's own result lines unless the test gives one (or false: none)
  const manifestOf = (k, n, text, os = 'windows') => ({ os, shard: `${k}/${n}`, finished: true, suites: results(text).map((r) => ({ file: `test-${r.name}.mjs`, name: r.name, seconds: 1, status: r.status, checks: count(r.rest), cause: r.status === 'FAIL' ? 'checks-failed' : null })) });
  const ci = (files, more = [], manifests = {}) => {
    const d = fs.mkdtempSync(path.join(D, 'ci-'));
    for (const [f, txt] of Object.entries(files)) {
      fs.writeFileSync(path.join(d, f), txt);
      const k = +(/^mcp-shard-(\d+)\.log$/.exec(f) || [])[1], m = Object.hasOwn(manifests, k) ? manifests[k] : manifestOf(k, Math.max(2, ...Object.keys(files).map((x) => +(/(\d+)\.log$/.exec(x) || [0, 0])[1])), txt);
      if (Number.isInteger(k) && m) { fs.mkdirSync(path.join(d, `mcp-shard-${k}-full`)); fs.writeFileSync(path.join(d, `mcp-shard-${k}-full`, 'manifest.json'), JSON.stringify(m)); }
    }
    return node([path.join(REPO, 'scripts/ci-sum.mjs'), 'mcp', d, '--registry', reg, '--os', 'windows', ...more], { GITHUB_ACTIONS: 'true', GITHUB_STEP_SUMMARY: '' });
  };
  const causesOf = (r) => [...new Set(r.stdout.split('\n').map((l) => parseOneLine(l.replace(/^ +- /, ''))).filter(Boolean).map((o) => `${o.cause} ${o.script}`))];
  const parts = { 'mcp-shard-1.log': 'PASS  mcp  700 checks  (shard 1/2: 9 parts)\nG13  40 reports, 0 with errors\n', 'mcp-shard-2.log': 'PASS  mcp  800 checks  (shard 2/2: 9 parts)\nG13  30 reports, 0 with errors\n' };
  t('ci-sum: the listed suites pass and add up', () => {
    const r = ci({ 'mcp-shard-0.log': 'SKIP  mcp  (DA_SHARD=0/2: shards 1-2 run its parts)\nPASS  a  5 checks\nPASS  b  6 checks\n', ...parts });
    assert.equal(r.status, 0, r.stdout); assert.match(r.stdout, /PASS {2}mcp {2}1512 checks in all shards/);
  });
  // (SPD, Codex #10) the result contract: a run is rejected when a shard's manifest is missing, a suite ran twice (in two
  // shards), crashed or timed out (said by the manifest, with no result line), printed 0 checks, or the log and the
  // manifest disagree; the total is printed per OS
  const ok0 = 'SKIP  mcp  (DA_SHARD=0/2: shards 1-2 run its parts)\nPASS  a  5 checks\nPASS  b  6 checks\n';
  t('ci-sum: the total checks printed with the OS, the suites and each shard\'s seconds', () => {
    const r = ci({ 'mcp-shard-0.log': ok0, ...parts });
    assert.equal(r.status, 0, r.stdout); assert.match(r.stdout, /PASS {2}mcp {2}1512 checks in all shards \(windows: 3 suites, 3 shards\)/);
    assert.match(r.stdout, /^shard 0\/2 +\d+(\.\d)? s +2 suites/m);
  });
  t('ci-sum: a shard without its manifest fails (missing-manifest)', () => {
    const r = ci({ 'mcp-shard-0.log': ok0, ...parts }, [], { 1: false });
    assert.equal(r.status, 1, r.stdout); assert.deepEqual(causesOf(r), ['missing-manifest mcp-shard-1-full/manifest.json']);
  });
  t('ci-sum: a manifest of an unfinished run, or of another shard or OS, fails', () => {
    const r = ci({ 'mcp-shard-0.log': ok0, ...parts }, [], { 0: { ...manifestOf(0, 2, ok0), finished: false }, 2: manifestOf(1, 2, parts['mcp-shard-2.log'], 'linux') });
    assert.equal(r.status, 1, r.stdout);
    assert.deepEqual(causesOf(r).sort(), ['crash mcp-shard-0-full/manifest.json', 'missing-shard mcp-shard-2-full/manifest.json']);
  });
  t('ci-sum: a suite that timed out or crashed (no result line; the manifest says so) fails by that cause', () => {
    const log = 'SKIP  mcp  (DA_SHARD=0/2: x)\nFAIL script=mcp/test-a.mjs check="stopped after 780s" cause=timeout os=windows shard=0/2\nFAIL script=mcp/test-b.mjs check="Error: x" cause=crash os=windows shard=0/2\n';
    const m = { ...manifestOf(0, 2, log), suites: [{ file: 'test.mjs', name: 'mcp', seconds: 0, status: 'SKIP', checks: null, cause: null }, { file: 'test-a.mjs', name: 'a', seconds: 780, status: 'FAIL', checks: null, cause: 'timeout' }, { file: 'test-b.mjs', name: 'b', seconds: 2, status: 'FAIL', checks: null, cause: 'crash' }] };
    const r = ci({ 'mcp-shard-0.log': log, ...parts }, [], { 0: m });
    assert.equal(r.status, 1, r.stdout);
    for (const c of ['timeout mcp/test-a.mjs', 'crash mcp/test-b.mjs']) assert.ok(causesOf(r).includes(c), `${c} in ${causesOf(r)}`);
  });
  t('ci-sum: a suite that printed 0 checks fails (zero-checks)', () => {
    const log = 'SKIP  mcp  (DA_SHARD=0/2: x)\nPASS  a  5 checks\nPASS  b  0 checks\n';
    const r = ci({ 'mcp-shard-0.log': log, ...parts });
    assert.equal(r.status, 1, r.stdout); assert.deepEqual(causesOf(r), ['zero-checks mcp/test-b.mjs']);
  });
  t('ci-sum: a suite in two shards fails as duplicate-suite', () => {
    const r = ci({ 'mcp-shard-0.log': ok0, 'mcp-shard-1.log': parts['mcp-shard-1.log'] + 'PASS  a  5 checks\n', 'mcp-shard-2.log': parts['mcp-shard-2.log'] });
    assert.equal(r.status, 1, r.stdout); assert.ok(causesOf(r).includes('duplicate-suite mcp/test-a.mjs'), causesOf(r).join('; '));
  });
  t('ci-sum: the log and the manifest disagree (another count, a suite only in one) fails (manifest-mismatch)', () => {
    const m = manifestOf(0, 2, ok0); m.suites[1].checks = 4; m.suites.pop();
    const r = ci({ 'mcp-shard-0.log': ok0, ...parts }, [], { 0: m });
    assert.equal(r.status, 1, r.stdout); assert.deepEqual(causesOf(r), ['manifest-mismatch mcp/test-a.mjs', 'manifest-mismatch mcp/test-b.mjs']);
  });
  t('ci-sum: a failed shard (a FAIL line) and a missing shard log still fail', () => {
    const f = ci({ 'mcp-shard-0.log': ok0, 'mcp-shard-1.log': 'FAIL  mcp  3 of 700 checks  (shard 1/2: 9 parts)\nG13  40 reports, 0 with errors\n', 'mcp-shard-2.log': parts['mcp-shard-2.log'] });
    assert.equal(f.status, 1, f.stdout); assert.ok(causesOf(f).includes('checks-failed mcp/test.mjs'), causesOf(f).join('; '));
    const m = ci({ 'mcp-shard-0.log': ok0, 'mcp-shard-2.log': parts['mcp-shard-2.log'] });
    assert.equal(m.status, 1, m.stdout); assert.ok(causesOf(m).includes('missing-shard ci-logs/mcp-shard-1.log'), causesOf(m).join('; '));
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

  // ---- (SPD, Codex #1) the plan: tests.json's suites dealt over the shards by their measured seconds, per OS
  const planShards = adapter.planShards || (() => { throw new Error('no planShards in mcp/test-results.mjs'); });
  const PR = { suites: [{ file: 'test.mjs', name: 'mcp', sharded: true }, ...['a', 'b', 'c', 'd', 'e', 'f'].map((x) => ({ file: `test-${x}.mjs`, name: x }))] };
  const PT = { source: { run: '1', commit: 'abc' }, os: { linux: { 'test.mjs@1': 50, 'test.mjs@2': 10, 'test-a.mjs': 60, 'test-b.mjs': 40, 'test-c.mjs': 30, 'test-d.mjs': 20, 'test-e.mjs': 5 }, windows: { 'test-f.mjs': 500 } } };
  const namesOf = (p) => p.shards.map((x) => x.map((y) => y.name));
  t('plan: longest first onto the lightest shard; test.mjs in every shard (its part k in shard k); tests.json order kept', () => {
    const p = planShards(PR, PT, 'linux', 2);
    // loads 0 / 50 / 10 (test.mjs's parts); f has no time: the median, 30. a 60 -> 0; b 40 -> 2; c 30 -> 1 (50 = 50,
    // the lower shard); f 30 -> 2; d 20 -> 0; e 5 -> 0 (80 = 80 = 80)
    assert.deepEqual(namesOf(p), [['mcp', 'a', 'd', 'e'], ['mcp', 'c'], ['mcp', 'b', 'f']]);
    assert.deepEqual(p.loads, [85, 80, 80]);
  });
  t('plan: each suite exactly once over the shards, for every OS and any n; the same answer every time', () => {
    for (const os of ['linux', 'windows', 'macos']) for (const n of [1, 2, 4]) {
      const p = planShards(PR, PT, os, n), flat = p.shards.flat().filter((x) => !x.sharded).map((x) => x.name).sort();
      assert.deepEqual(flat, ['a', 'b', 'c', 'd', 'e', 'f'], `${os} ${n}`);
      assert.ok(p.shards.every((x) => x.filter((y) => y.sharded).length === 1), `${os} ${n}: test.mjs once in each shard`);
      assert.deepEqual(planShards(PR, PT, os, n), p);
    }
  });
  t('plan: a suite without a time weighs the median; an OS without times uses linux\'s; no times at all still deals every suite', () => {
    assert.equal(planShards(PR, PT, 'linux', 2).weights['test-f.mjs'], 30);
    assert.deepEqual(namesOf(planShards(PR, PT, 'macos', 2)), namesOf(planShards(PR, PT, 'linux', 2)));
    assert.deepEqual([planShards(PR, PT, 'windows', 2).weights['test-f.mjs'], planShards(PR, PT, 'windows', 2).weights['test-a.mjs']], [500, 500], 'windows: its own times, its own median');
    assert.deepEqual(planShards(PR, {}, 'linux', 2).shards.flat().filter((x) => !x.sharded).length, 6);
  });
  // the runner and ci-sum read the same plan: DA_SHARD=k/N runs exactly shard k's suites; the other suites see DA_SHARD=0/N
  const P = path.join(D, 'plan'); fs.mkdirSync(P);
  fs.writeFileSync(path.join(P, 'test.mjs'), "const k = process.env.DA_SHARD.split('/')[0]; console.log(k === '0' ? 'SKIP  mcp  (DA_SHARD=0/2: x)' : `PASS  mcp  ${k}00 checks  (shard ${process.env.DA_SHARD}: 1 parts)\nG13  60 reports, 0 with errors`);\n");
  for (const x of ['a', 'b', 'c', 'd', 'e', 'f']) fs.writeFileSync(path.join(P, `test-${x}.mjs`), `console.log('PASS  ${x}  ' + (process.env.DA_SHARD === '0/2' ? 3 : 0) + ' checks');\n`);
  fs.writeFileSync(path.join(P, 'tests.json'), JSON.stringify({ areas: { a: 'A' }, suites: PR.suites.map((x) => ({ ...x, area: 'a', purpose: 'p' })), ignored: [], pending: [] }));
  fs.writeFileSync(path.join(P, 'test-times.json'), JSON.stringify(PT));
  const shardRun = (k) => { const l = path.join(D, `plan-logs-${k}`); const r = node([path.join(REPO, 'mcp/run-tests.mjs'), '--keep-going', '--log-dir', l], { DA_TESTS_DIR: P, DA_SHARD: `${k}/2` }); return { ...r, log: r.stdout, man: fs.readFileSync(path.join(l, 'manifest.json'), 'utf8') }; };
  const runs = [0, 1, 2].map(shardRun);
  t('the runner: DA_SHARD=k/N runs the plan\'s shard k (linux), each other suite with DA_SHARD=0/N', () => {
    const want = planShards(PR, PT, 'linux', 2);
    runs.forEach((r, k) => {
      assert.equal(r.status, 0, r.stdout + r.stderr);
      assert.deepEqual(results(r.stdout).map((x) => x.name), namesOf(want)[k], `shard ${k}`);
      assert.ok(results(r.stdout).filter((x) => x.name !== 'mcp').every((x) => count(x.rest) === 3), `shard ${k}: DA_SHARD=0/2 for the other suites`);
    });
  });
  t('ci-sum: the plan\'s shards pass and add up; a suite in a shard not its own fails', () => {
    const d = fs.mkdtempSync(path.join(D, 'cip-'));
    runs.forEach((r, k) => { fs.writeFileSync(path.join(d, `mcp-shard-${k}.log`), r.log); fs.mkdirSync(path.join(d, `mcp-shard-${k}-full`)); fs.writeFileSync(path.join(d, `mcp-shard-${k}-full`, 'manifest.json'), r.man); });
    const sum = () => node([path.join(REPO, 'scripts/ci-sum.mjs'), 'mcp', d, '--registry', path.join(P, 'tests.json'), '--times', path.join(P, 'test-times.json'), '--os', 'linux']);
    const good = sum();
    assert.equal(good.status, 0, good.stdout); assert.match(good.stdout, /PASS {2}mcp {2}319 checks in all shards \(linux: 7 suites, 3 shards\)/);
    const swap = (k, j, name) => { for (const [x, y] of [[k, false], [j, true]]) { const f = path.join(d, `mcp-shard-${x}.log`), m = path.join(d, `mcp-shard-${x}-full`, 'manifest.json'), M = JSON.parse(fs.readFileSync(m, 'utf8')); let txt = fs.readFileSync(f, 'utf8'); txt = y ? txt + `PASS  ${name}  3 checks\n` : txt.replace(`PASS  ${name}  3 checks\n`, ''); M.suites = y ? [...M.suites, { file: `test-${name}.mjs`, name, seconds: 1, status: 'PASS', checks: 3, cause: null }] : M.suites.filter((e) => e.name !== name); fs.writeFileSync(f, txt); fs.writeFileSync(m, JSON.stringify(M)); } };
    swap(0, 1, 'a');
    const bad = sum();
    assert.equal(bad.status, 1, bad.stdout);
    assert.match(bad.stdout, /script=mcp\/test-a\.mjs check="a: no result line" cause=missing-suite os=linux shard=0\/2/);
    assert.match(bad.stdout, /cause=unknown-suite os=linux shard=1\/2/);
  });
  // the measured seconds: scripts/test-times.mjs writes mcp/test-times.json from a CI run's manifests, never typed
  t('test-times: the seconds per OS from a run\'s manifests (test.mjs per part), its run and commit recorded', () => {
    const d = fs.mkdtempSync(path.join(D, 'tt-')), out = path.join(d, 'times.json');
    const man = (os, k, suites, more = {}) => { const f = path.join(d, `${os}-${k}`, 'ci-logs', `mcp-shard-${k}-full`); fs.mkdirSync(f, { recursive: true }); fs.writeFileSync(path.join(f, 'manifest.json'), JSON.stringify({ os, shard: `${k}/1`, commit: 'c0ffee', run: '42', finished: true, suites, ...more })); };
    man('linux', 0, [{ file: 'test.mjs', name: 'mcp', seconds: 0.1, status: 'SKIP' }, { file: 'test-a.mjs', name: 'a', seconds: 61.24, status: 'PASS', checks: 5 }]);
    man('linux', 1, [{ file: 'test.mjs', name: 'mcp', seconds: 180, status: 'PASS', checks: 700 }]);
    man('windows', 0, [{ file: 'test-a.mjs', name: 'a', seconds: 99, status: 'PASS', checks: 5 }]);
    const r = node([path.join(REPO, 'scripts/test-times.mjs'), d, '--out', out]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const T = JSON.parse(fs.readFileSync(out, 'utf8'));
    assert.deepEqual([T.source.run, T.source.commit, T.os], ['42', 'c0ffee', { linux: { 'test-a.mjs': 61.2, 'test.mjs@1': 180 }, windows: { 'test-a.mjs': 99 } }]);
    man('macos', 0, [{ file: 'test-a.mjs', name: 'a', seconds: 9, status: 'FAIL', cause: 'timeout' }]);
    const f = node([path.join(REPO, 'scripts/test-times.mjs'), d, '--out', out]);
    assert.equal(f.status, 1); assert.match(f.stderr, /macos.*test-a\.mjs.*FAIL/);
    man('macos', 0, [{ file: 'test-a.mjs', name: 'a', seconds: 9, status: 'PASS', checks: 5 }], { commit: 'other' });
    const c = node([path.join(REPO, 'scripts/test-times.mjs'), d, '--out', out]);
    assert.equal(c.status, 1); assert.match(c.stderr, /one run/);
  });
  t('mcp/test-times.json: from a CI run (its run and commit named), seconds only, for tests.json\'s suites; every OS deals every suite once', () => {
    const T = JSON.parse(fs.readFileSync(path.join(REPO, 'mcp/test-times.json'), 'utf8'));
    assert.match(String(T.source.run), /^\d+$/); assert.match(T.source.commit, /^[0-9a-f]{40}$/); assert.match(T.about, /scripts\/test-times\.mjs/);
    const R = JSON.parse(fs.readFileSync(path.join(REPO, 'mcp/tests.json'), 'utf8'));
    const files = new Set(R.suites.flatMap((x) => (x.sharded ? [1, 2, 3, 4].map((k) => `${x.file}@${k}`) : [x.file])));
    for (const os of ['linux', 'windows', 'macos']) {
      assert.ok(T.os[os], os);
      for (const [k, v] of Object.entries(T.os[os])) { assert.ok(files.has(k), `${os}: ${k} is not a tests.json suite`); assert.ok(v > 0, `${os}: ${k} ${v}`); }
      const p = planShards(R, T, os, 4);
      assert.deepEqual(p.shards.flat().filter((x) => !x.sharded).map((x) => x.file).sort(), R.suites.filter((x) => !x.sharded).map((x) => x.file).sort(), os);
    }
  });
  t('SPD changed no product code: no SPD commit touches mcp/lib, mcp/tools, mcp/server.mjs, assets/ or a site page', () => {
    const r = spawnSync('git', ['log', '--no-merges', '--grep=^SPD', '--format=%h %s', '--name-only', '--', 'mcp/lib', 'mcp/tools', 'mcp/server.mjs', 'assets', '*.html'], { cwd: REPO, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr); assert.equal(r.stdout.trim(), '');
    const all = spawnSync('git', ['log', '--no-merges', '--grep=^SPD', '--format=%h'], { cwd: REPO, encoding: 'utf8' });
    assert.ok(all.stdout.trim().split('\n').length >= 3 || !all.stdout.trim(), 'the SPD commits are found');
  });

  // (SPD, Codex #7) the push workflow keeps the merge gate's five job names and runs mutation; coverage is nightly and by hand
  t('workflows: tests.yml keeps website-checks, website, mcp, mcp-windows, mcp-macos and no coverage job; coverage.yml is nightly and manual', () => {
    const jobsOf = (f) => { const y = fs.readFileSync(path.join(REPO, '.github/workflows', f), 'utf8'); return { y, jobs: [...y.slice(y.indexOf('\njobs:')).matchAll(/^ {2}([\w-]+):\s*$/gm)].map((m) => m[1]) }; };
    const T = jobsOf('tests.yml'), C = jobsOf('coverage.yml');
    for (const j of ['website-checks', 'website', 'mcp', 'mcp-windows', 'mcp-macos']) assert.ok(T.jobs.includes(j), `tests.yml: ${j}`);
    assert.deepEqual(T.jobs.filter((j) => /coverage/.test(j)), []);
    assert.deepEqual(C.jobs, ['coverage', 'coverage-web']);
    assert.match(C.y, /^on:\n {2}schedule:\n {4}- cron: '[\d*, /-]+'.*\n {2}workflow_dispatch:\n/m);
    assert.doesNotMatch(C.y, /^ {2}(push|pull_request):/m);
    assert.match(T.y, /^ {2}push:\n {4}branches: \[main\]\n {2}pull_request:\n {2}workflow_dispatch:/m);
    assert.ok(JSON.parse(fs.readFileSync(path.join(REPO, 'mcp/tests.json'), 'utf8')).suites.some((x) => x.file === 'test-0.3.1-mutation.mjs'), 'mutation is a tests.json suite: every push');
    assert.equal((T.y.match(/npm test -- --keep-going/g) || []).length, 3, 'the three MCP shard jobs run every planned suite');
  });

  // (SPD; Codex: a guard's baseline that timed out was counted as a pass) mutation rejects a baseline that timed out
  t('mutation: a guard whose baseline timed out fails the run, never counted as a pass', () => {
    const r = node([path.join(REPO, 'mcp/test-0.3.1-mutation.mjs')], { DA_MUTATION_ONLY: 'G-used', DA_MUTATION_GUARD_TIMEOUT: '0.01' }, path.join(REPO, 'mcp'));
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /baseline: test-partial-writes\.mjs timed out/);
    assert.match(r.stdout, /^FAIL {2}mutation {2}/m);
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
