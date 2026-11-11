// Tests for scripts/agent-stop-check.mjs, the Stop hook (LR3, 0.3.3): a builder's turn does not end before CI is green.
//   node scripts/test-agent-stop-check.mjs
// Runs the hook on made-up git repos and notes (os.tmpdir(), no network).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, 'agent-stop-check.mjs');

let checks = 0; const problems = [];
const ok = (cond, msg) => { checks++; if (!cond) problems.push(msg); };

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-stop-'));
const state = path.join(tmp, 'state');
fs.mkdirSync(state);
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });
let n = 0;

// a made-up repo on `branch` with the job's note, and (optionally) a later commit; returns { dir, head, first }
function repo(branch, note, { code = 'ZZ9' } = {}) {
  const dir = path.join(tmp, 'r' + (++n));
  fs.mkdirSync(path.join(dir, 'mcp', 'work'), { recursive: true });
  git(dir, 'init', '-q', '-b', branch);
  git(dir, 'config', 'user.email', 'a@example.test'); git(dir, 'config', 'user.name', 'a');
  git(dir, 'config', 'commit.gpgsign', 'false');
  fs.writeFileSync(path.join(dir, 'code.txt'), 'one\n');
  if (note !== null) fs.writeFileSync(path.join(dir, 'mcp', 'work', code + '.md'), note);
  git(dir, 'add', '-A'); git(dir, 'commit', '-q', '-m', 'first');
  const first = git(dir, 'rev-parse', 'HEAD').stdout.trim();
  return { dir, first, head: first };
}
function commit(r, file, text) {
  fs.writeFileSync(path.join(r.dir, file), text);
  git(r.dir, 'add', '-A'); git(r.dir, 'commit', '-q', '-m', 'more');
  r.head = git(r.dir, 'rev-parse', 'HEAD').stdout.trim();
}
// the hook, run in `dir`; the counter lives in this test's own folder
const run = (dir) => spawnSync(process.execPath, [script, '--root', dir], {
  encoding: 'utf8', input: '{}', env: { ...process.env, AGENT_STOP_STATE_DIR: state },
});
const refuses = (res, msg) => {
  ok(res.status === 2 && /Your job is not DONE: wait for the CI run in this turn/.test(res.stderr), `${msg}: want exit 2 and the message, got ${res.status} / ${res.stderr.trim()}`);
};
const allows = (res, msg) => ok(res.status === 0, `${msg}: want exit 0, got ${res.status} / ${res.stderr.trim()}`);

const URL_ = 'https://github.com/example/example/actions/runs/1';

// 1. no CI line: refuse
let r = repo('feat/0.3.3-zz9', '## Summary\n- **Resume:** x\n');
refuses(run(r.dir), 'no CI line');

// 2. a CI line on an older sha (a code commit came after it): refuse
r = repo('feat/0.3.3-zz9', 'x\n');
const old = r.first;
commit(r, 'code.txt', 'two\n');
fs.writeFileSync(path.join(r.dir, 'mcp/work/ZZ9.md'), `CI green: ${URL_} on ${old}\n`);
refuses(run(r.dir), 'CI line on an older sha (the working tree note names it; code changed since)');
git(r.dir, 'add', '-A'); git(r.dir, 'commit', '-q', '-m', 'note'); r.head = git(r.dir, 'rev-parse', 'HEAD').stdout.trim();
refuses(run(r.dir), 'CI line on an older sha, committed');

// 3. a CI line on the head: allow (full sha and 7-character sha)
r = repo('fix/some-bug-zz9', 'x\n');
fs.writeFileSync(path.join(r.dir, 'mcp/work/ZZ9.md'), `CI green: ${URL_} on ${r.head}\n`);
allows(run(r.dir), 'CI line on the head (full sha)');
fs.writeFileSync(path.join(r.dir, 'mcp/work/ZZ9.md'), `- **CI green: ${URL_} on ${r.head.slice(0, 7)}**\n`);
allows(run(r.dir), 'CI line on the head (short sha)');

// 3b. after the green run only the note changed: the line names an older sha, allow
r = repo('feat/0.3.3-zz9', 'x\n');
const green = r.head;
commit(r, 'mcp/work/ZZ9.md', `CI green: ${URL_} on ${green}\n`);
allows(run(r.dir), 'only the note changed after the green sha');

// 4. a STOP: line: allow
r = repo('feat/0.3.3-zz9', '## Summary\nSTOP: the owner must decide the rule first.\n');
allows(run(r.dir), 'STOP: line');

// 5. a question under "## For the owner": allow; "none" there: refuse
r = repo('feat/0.3.3-zz9', '## For the owner\n- Should the cap be 3 or 5?\n\n## Risky changes\nnone\n');
allows(run(r.dir), 'a question for the owner');
r = repo('feat/0.3.3-zz9', '## For the owner\nnone\n\n## Risky changes\nWhy? none\n');
refuses(run(r.dir), 'For the owner says none (a question elsewhere does not count)');

// 6. the 4th call after 3 refusals: allow; then the count starts again
r = repo('feat/0.3.3-lp1', 'x\n', { code: 'LP1' });
refuses(run(r.dir), 'refusal 1'); refuses(run(r.dir), 'refusal 2'); refuses(run(r.dir), 'refusal 3');
allows(run(r.dir), 'the 4th call after 3 refusals');
refuses(run(r.dir), 'after the allowed stop the count starts again');

// 7. other branches: allow at once, even with no note
for (const b of ['integration/0.3.3', 'main', 'check/x-zz9', 'docs/x-zz9', 'review/x-zz9']) {
  r = repo(b, null);
  allows(run(r.dir), `branch ${b}`);
}

// 8. unreadable git (a folder that is no repository), and an unreadable note: allow with a reason
const bare = path.join(tmp, 'nogit'); fs.mkdirSync(bare);
let res = run(bare);
allows(res, 'unreadable git'); ok(/git/i.test(res.stdout) && res.stdout.trim().length > 10, `unreadable git: a reason is printed, got "${res.stdout.trim()}"`);
r = repo('feat/0.3.3-zz9', null);
res = run(r.dir);
allows(res, 'no note'); ok(/mcp\/work\/ZZ9\.md/.test(res.stdout), `no note: the reason names the note, got "${res.stdout.trim()}"`);
r = repo('feat/nocode', 'x\n');
res = run(r.dir);
allows(res, 'a branch name with no job code'); ok(res.stdout.trim().length > 10, 'no job code: a reason is printed');

// (SN1 item 6) the cause of the hook that did not hold two builders on 11 Nov: Claude Code runs a hook with the session's
// working directory, and a builder's shell had done `cd mcp`. `node scripts/agent-stop-check.mjs` was then not found (node
// exits 1, which never blocks), and a found script looked for mcp/work/<CODE>.md under mcp/. So: the command in
// .claude/settings.json names the script by CLAUDE_PROJECT_DIR, and the script's own root is the repo it lives in.
{
  const cmd = JSON.parse(fs.readFileSync(path.join(here, '..', '.claude', 'settings.json'), 'utf8')).hooks.Stop[0].hooks[0].command;
  const rr = repo('feat/0.3.3-zz9', '## Summary\n- **Resume:** x\n');
  fs.mkdirSync(path.join(rr.dir, 'scripts'), { recursive: true });
  fs.copyFileSync(script, path.join(rr.dir, 'scripts', 'agent-stop-check.mjs'));
  const fresh = () => fs.mkdtempSync(path.join(tmp, 'st-'));   // each call its own refusal count
  const from = (cwd) => spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', input: '{}', env: { ...process.env, CLAUDE_PROJECT_DIR: rr.dir, AGENT_STOP_STATE_DIR: fresh() } });
  refuses(from(rr.dir), 'the settings.json command, run in the repo root');
  refuses(from(path.join(rr.dir, 'mcp')), 'the settings.json command, run after a `cd mcp`');
  refuses(from(path.join(rr.dir, 'mcp', 'work')), 'the settings.json command, run in mcp/work');
  const bare = spawnSync(process.execPath, [path.join(rr.dir, 'scripts', 'agent-stop-check.mjs')], { cwd: path.join(rr.dir, 'mcp'), encoding: 'utf8', input: '{}', env: { ...process.env, AGENT_STOP_STATE_DIR: fresh() } });
  refuses(bare, 'the script without --root, run from mcp/');
}

fs.rmSync(tmp, { recursive: true, force: true });
if (problems.length) {
  console.log(`FAIL script=scripts/test-agent-stop-check.mjs check="${problems[0].slice(0, 200).replace(/"/g, "'")}" cause=checks-failed`);
  for (const p of problems.slice(1)) console.log('  ' + p);
  console.log(`FAIL  agent-stop-check  ${problems.length} of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS  agent-stop-check  ${checks} checks`);
