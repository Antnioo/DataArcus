// The Stop hook (LR3, 0.3.3, LR1's P-01): a builder's turn does not end before CI is green.
// .claude/settings.json runs this when Claude is about to stop. On a branch fix/* or feat/* it reads the job's note
// (mcp/work/<CODE>.md, the code is the last word of the branch name: feat/0.3.3-lr3 -> LR3). The stop is allowed when
// the note has
//   - a `CI green: <url> on <sha>` line whose sha is the branch head (or an older commit after which only the note
//     and mcp/WORK.md changed: the note is written after the green run), or
//   - a `STOP:` line (the builder stopped on purpose), or
//   - a question (a line with "?") under "## For the owner".
// (WF3) When the stop would be allowed on a `CI green:` line, the note's "## For the owner" and "## Seen, not in scope" must
// be readable by a machine (one record per item; the format is in mcp/docs/OWNER-RULES.md, "The job note"). A miss: exit 2,
// one message naming the line. The 3-refusals rule is the same. A `STOP:` line still allows at once.
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

export const FORMAT_HELP = 'Format: under "## For the owner" a line is `- <question>? | class: <x> | rec: <...> | yes: <...> | no: <...> | default: <...>`; under "## Seen, not in scope" a line is `- <what> | route: <fix|job|backlog|drop> | why: <...>` (route fix also `| size: S|M|L`); "none" is fine. Not a question for the owner? Move it under "## For the reviewer".';

// the engine's constants (ops/gate/items.py, 12 Nov): these must match exactly
export const CLASSES = ['arabic', 'public', 'money', 'main', 'rules', 'github', 'laptop', 'direction'];
export const BUILDER_ROUTES = ['fix', 'job', 'backlog', 'drop'];
export const PIPE_KEYS = ['route', 'size', 'why', 'class', 'risk', 'rec', 'yes', 'no', 'default', 'proof', 'where'];

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

// the items under a heading that is exactly `## <name>` (a heading that only contains the words is not it; fenced code is
// skipped), up to the next "## " heading. An item starts with "- ", "* " or "1. "; a line that starts (after spaces) with
// "| <key>:", or any other indented line, belongs to the item before it; a bare unindented line is an item of its own.
// Each item: its lines joined with one space.
export function sectionItems(note, name) {
  const lines = note.replace(/\r\n/g, '\n').split('\n');
  const head = new RegExp('^##\\s+' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i');
  const items = [];
  let inside = false, fence = false;
  for (const raw of lines) {
    if (/^\s*(```|~~~)/.test(raw)) { fence = !fence; continue; }
    if (fence) continue;
    if (/^##\s/.test(raw)) { inside = head.test(raw.trim()); continue; }
    if (!inside || !raw.trim()) continue;
    const bullet = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(raw);
    const cont = new RegExp('^\\s*\\|\\s*(' + PIPE_KEYS.join('|') + '):').test(raw) || (/^\s/.test(raw) && !bullet);
    if (cont && items.length) items[items.length - 1] += ' ' + raw.trim();
    else items.push((bullet ? bullet[1] : raw).trim());
  }
  return items.map((t) => t.replace(/\s+/g, ' '));
}

// "text | key: value | key: value" -> { text, fields }
function splitItem(item) {
  const [text, ...parts] = item.split(/\s\|\s?/);
  const fields = {};
  for (const p of parts) {
    const m = /^([a-z]+):\s*(.*)$/.exec(p.trim());
    if (m && PIPE_KEYS.includes(m[1]) && !(m[1] in fields)) fields[m[1]] = m[2].trim();
  }
  return { text: text.trim(), fields };
}
const isNone = (t) => /^none\.?$/i.test(t.trim());

// the first line of the note's two sections that a machine cannot read, or null: { line, section, why }
export function sectionProblem(note) {
  for (const item of sectionItems(note, 'For the owner')) {
    if (isNone(item)) continue;
    const { text, fields } = splitItem(item);
    const miss = !text.endsWith('?') ? 'the text before the first " | " does not end with "?"'
      : !CLASSES.includes(fields.class) ? 'class must be one of ' + CLASSES.join(', ')
      : ['rec', 'yes', 'no', 'default'].find((k) => !fields[k]) ? 'missing | ' + ['rec', 'yes', 'no', 'default'].find((k) => !fields[k]) + ': ...'
      : null;
    if (miss) return { line: item, section: '## For the owner', why: miss };
  }
  for (const item of sectionItems(note, 'Seen, not in scope')) {
    if (isNone(item)) continue;
    const { fields } = splitItem(item);
    const miss = !BUILDER_ROUTES.includes(fields.route) ? 'route must be one of ' + BUILDER_ROUTES.join(', ')
      : !fields.why ? 'missing | why: ...'
      : fields.route === 'fix' && !/^[SML]$/.test(fields.size || '') ? 'route fix needs | size: S, M or L'
      : null;
    if (miss) return { line: item, section: '## Seen, not in scope', why: miss };
  }
  return null;
}

// does the note let the stop through? `changedSince(sha)` gives the files changed from sha to the head (or null)
export function noteState(note, head, code, changedSince) {
  const text = note.replace(/\r\n/g, '\n');
  if (/^[\s>*_-]*STOP:/m.test(text)) return { done: true, why: 'STOP: line' };
  const re = /CI green:\s*\S+\s+on\s+([0-9a-f]{7,40})\b/gi;
  let m;
  while ((m = re.exec(text))) {
    const sha = m[1].toLowerCase();
    let why = null;
    if (head.startsWith(sha)) why = 'CI green on the head';
    else {
      const files = changedSince(sha);
      const own = [`mcp/work/${code}.md`, 'mcp/WORK.md'];
      if (files && files.every((f) => own.includes(f))) why = 'CI green; only the note changed since';
    }
    if (!why) continue;
    const bad = sectionProblem(text);
    if (bad) return { done: false, format: `The note's "${bad.section}" has a line a machine cannot read (${bad.why}): "${bad.line.slice(0, 200)}". ${FORMAT_HELP}` };
    return { done: true, why };
  }
  if (ownerSection(text).includes('?')) return { done: true, why: 'a question for the owner' };
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
  const state = noteState(note, head, code, changedSince);
  if (state.done) { save(0); return { exit: 0 }; }
  const n = count(file);
  if (n >= MAX_REFUSALS) { save(0); return { exit: 0, out: `agent-stop-check: allowed after ${MAX_REFUSALS} refusals in a row (the note still has no CI green line)` }; }
  save(n + 1);
  return { exit: 2, err: state.format || MESSAGE };
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
