// The website suites' coverage (SQ15c, Q1-S5; a report like Q1's c8 job, never a gate): runs
// scripts/tests/run-all.mjs with DA_WEB_COVERAGE (scripts/tests/lib.mjs: every page records Chromium's JS coverage, the
// engines in assets/js/*.js as their source), then c8 (pinned in the root package.json) reports it: coverage/web/
// (coverage-summary.json, coverage.txt, summary.md, run-all.log). Prints one line; exits 0 whatever the suites say (the
// website-suites jobs report a failure), 1 only when no coverage was recorded (the report itself is broken).
//   node scripts/coverage-web.mjs [run-all's options, e.g. --jobs 2]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'coverage', 'web'), RAW = path.join(OUT, 'tmp');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(RAW, { recursive: true });
const t0 = Date.now();
const run = spawnSync(process.execPath, [path.join(ROOT, 'scripts/tests/run-all.mjs'), ...process.argv.slice(2)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, DA_WEB_COVERAGE: RAW } });
fs.writeFileSync(path.join(OUT, 'run-all.log'), (run.stdout || '') + (run.stderr || ''));
const suites = ((run.stdout || '').trim().split('\n').pop() || '').trim() || `run-all exit ${run.status}`;
const raw = fs.readdirSync(RAW).length;
if (!raw) { console.log(`FAIL  coverage-web  no coverage recorded (${suites})`); process.exit(1); }
const c8 = spawnSync(process.execPath, [path.join(ROOT, 'node_modules/c8/bin/c8.js'), 'report', '--temp-directory', RAW, '--reports-dir', OUT,
  '--include', 'assets/js/*.js', '--exclude', 'assets/js/*.min.js', '--reporter', 'text', '--reporter', 'json-summary'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
fs.writeFileSync(path.join(OUT, 'coverage.txt'), (c8.stdout || '') + (c8.stderr || ''));
const file = path.join(OUT, 'coverage-summary.json');
if (c8.status || !fs.existsSync(file)) { console.log(`FAIL  coverage-web  c8 report exit ${c8.status} (${suites})`); process.exit(1); }
const md = spawnSync(process.execPath, [path.join(ROOT, 'scripts/coverage-summary.mjs'), file, 'the website suites (`node scripts/tests/run-all.mjs`, Chromium)'], { cwd: ROOT, encoding: 'utf8' });
fs.writeFileSync(path.join(OUT, 'summary.md'), md.stdout || '');
fs.rmSync(RAW, { recursive: true, force: true });   // the raw V8 files: the report above is what is kept
const data = JSON.parse(fs.readFileSync(file, 'utf8')), t = data.total, n = Object.keys(data).length - 1;
const cal = Object.entries(data).find(([f]) => /calendar-generator\.js$/.test(f));
console.log(`coverage-web: lines ${t.lines.pct.toFixed(1)} % (${t.lines.covered}/${t.lines.total}), branches ${t.branches.pct.toFixed(1)} % (${t.branches.covered}/${t.branches.total}) in ${n} engine files${cal ? `; calendar-generator.js lines ${cal[1].lines.pct.toFixed(1)} %` : ''}; ${raw} pages; suites: ${suites.replace(/^\s+/, '')} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
