// The Stop hook (LR3, 0.3.3, LR1's P-01): a builder's turn does not end before CI is green.
// .claude/settings.json runs this when Claude is about to stop. On a branch fix/* or feat/* it reads the job's note
// (mcp/work/<CODE>.md, the code is the last word of the branch name: feat/0.3.3-lr3 -> LR3). The stop is allowed when
// the note has
//   - a `CI green: <url> on <sha>` line whose sha is the branch head (or an older commit after which only the note
//     and mcp/WORK.md changed: the note is written after the green run), or
//   - a `STOP:` line (the builder stopped on purpose), or
//   - a question (a line with "?") under "## For the owner".
// Otherwise: exit 2 and "Your job is not DONE: wait for the CI run in this turn" on stderr, and the turn goes on.
// After 3 refusals in a row it allows the stop (a broken builder must not loop); the count is a file in
// os.tmpdir() (or AGENT_STOP_STATE_DIR), keyed by branch. Any other branch: allowed at once. If git or the note cannot
// be read: allowed, and it prints why (never a trap).
//   node scripts/agent-stop-check.mjs [--root <dir>]     exit 0 allow, exit 2 refuse (default root: the repo this script is in)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const MAX_REFUSALS = 3;
export const MESSAGE = 'Your job is not DONE: wait for the CI run in this turn (gh workflow run tests.yml --ref <branch>, then gh run watch <id>); then write "CI green: <run url> on <sha>" in the job note, or write STOP: or a question under "## For the owner".';

// the job code of a branch: feat/0.3.3-lr3 -> LR3; null when the branch is not fix/* or feat/*, '' when it has no code
export function jobCode(branch) {
  if (!/^(fix|feat)\//.test(branch)) return null;
  const m = /-([a-z]+\d+)$/i.exec(branch);
  return m ? m[1].toUpperCase() : '';
}

// the text under "## For the owner", up to the next "## " heading
function ownerSection(note) {
  const lines = note.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => /^##\s+For the owner\s*$/i.test(l.trim()));
  if (start < 0) return '';
  const out = [];
  for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) out.push(lines[i]);
  return out.join('\n');
}

// does the note let the stop through? `changedSince(sha)` gives the files changed from sha to the head (or null)
export function noteState(note, head, code, changedSince) {
  const text = note.replace(/\r\n/g, '\n');
  if (/^[\s>*_-]*STOP:/m.test(text)) return { done: true, why: 'STOP: line' };
  if (ownerSection(text).includes('?')) return { done: true, why: 'a question for the owner' };
  const re = /CI green:\s*\S+\s+on\s+([0-9a-f]{7,40})\b/gi;
  let m;
  while ((m = re.exec(text))) {
    const sha = m[1].toLowerCase();
    if (head.startsWith(sha)) return { done: true, why: 'CI green on the head' };
    const files = changedSince(sha);
    const own = [`mcp/work/${code}.md`, 'mcp/WORK.md'];
    if (files && files.every((f) => own.includes(f))) return { done: true, why: 'CI green; only the note changed since' };
  }
  return { done: false };
}

const count = (file) => { try { return parseInt(fs.readFileSync(file, 'utf8'), 10) || 0; } catch { return 0; } };

// the whole decision: { exit, out, err }
export function check(root, stateDir = process.env.AGENT_STOP_STATE_DIR || os.tmpdir()) {
  const git = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8' });
  const b = git('rev-parse', '--abbrev-ref', 'HEAD');
  const h = git('rev-parse', 'HEAD');
  if (b.error || b.status !== 0 || h.status !== 0) return { exit: 0, out: 'agent-stop-check: allowed, git could not be read here (' + String((b.stderr || (b.error && b.error.message) || '').trim()).slice(0, 120) + ')' };
  const branch = b.stdout.trim(), head = h.stdout.trim();
  const code = jobCode(branch);
  if (code === null) return { exit: 0 };
  if (!code) return { exit: 0, out: `agent-stop-check: allowed, no job code in the branch name "${branch}"` };
  const rel = `mcp/work/${code}.md`;
  let note;
  try { note = fs.readFileSync(path.join(root, rel), 'utf8'); }
  catch { return { exit: 0, out: `agent-stop-check: allowed, the job's note ${rel} could not be read` }; }
  const changedSince = (sha) => {
    const d = git('diff', '--name-only', sha, 'HEAD');
    const dirty = git('status', '--porcelain');
    if (d.status !== 0) return null;
    const files = d.stdout.split('\n').filter(Boolean);
    if (dirty.status === 0) for (const l of dirty.stdout.split('\n').filter(Boolean)) files.push(l.slice(3).replace(/^"|"$/g, ''));
    return files;
  };
  const file = path.join(stateDir, 'agent-stop-check-' + branch.replace(/[^A-Za-z0-9._-]/g, '_') + '.count');
  const save = (n) => { try { fs.writeFileSync(file, String(n)); } catch { /* the count is a convenience */ } };
  if (noteState(note, head, code, changedSince).done) { save(0); return { exit: 0 }; }
  const n = count(file);
  if (n >= MAX_REFUSALS) { save(0); return { exit: 0, out: `agent-stop-check: allowed after ${MAX_REFUSALS} refusals in a row (the note still has no CI green line)` }; }
  save(n + 1);
  return { exit: 2, err: MESSAGE };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--root');
  // (SN1) the repo this script lives in, never the session's folder: a builder's shell may be in mcp/ (Claude Code runs a hook there)
  const root = i > 0 ? path.resolve(process.argv[i + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  let r;
  try { r = check(root); } catch (e) { r = { exit: 0, out: 'agent-stop-check: allowed, it failed itself (' + String(e.message).slice(0, 120) + ')' }; }
  if (r.out) console.log(r.out);
  if (r.err) console.error(r.err);
  process.exit(r.exit);
}
