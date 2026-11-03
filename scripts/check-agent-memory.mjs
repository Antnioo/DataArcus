// The agent's startup pack stays small (A1, 0.3.1; the owner 25 Oct, after an outside review: a fresh session read about
// 38 KB before its first step, and history regrew in the files read first). What a new session reads before working:
// CLAUDE.md, mcp/CLAUDE.md, ARCHITECTURE.md, mcp/WORK.md and its job note's "## Summary". This checks
//   - each startup file's lines and characters (code points) against its cap, and the four together;
//   - every job note mcp/work/<ID>.md written from A1 on (not in BEFORE_A1) starts with "## Summary" (its first "##"
//     heading), at most 40 lines, naming Approval, Scope, Base, Expected checks and Resume; an older note given a
//     summary is held to the same; mcp/work/archive/ is history and never read;
//   - every relative link in the startup files, in mcp/docs/*.md, in mcp/TOOLS.md (its per-tool sections) and in the
//     summaries resolves: the file, and the section when the link names one (GitHub's heading anchors);
//   - the task routes: every path in ARCHITECTURE.md's routes table exists, and each symbol named after it in the same
//     code span (`file: symbolA, symbolB`) is in that file.
// What is cut from a startup file moves, unchanged, into mcp/docs/ (by subject) and is linked: never deleted.
//   node scripts/check-agent-memory.mjs          one result line: PASS  agent-memory  <N> checks (or FAIL with the list)
//   node scripts/check-agent-memory.mjs --sizes  also prints each file's size
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const CAPS = {
  'CLAUDE.md': { lines: 60, chars: 3200 },
  'mcp/CLAUDE.md': { lines: 60, chars: 3200 },
  'ARCHITECTURE.md': { lines: 90, chars: 5200 },
  'mcp/WORK.md': { lines: 60, chars: 3200 },
};
export const TOTAL_CAP = Object.values(CAPS).reduce((n, c) => n + c.chars, 0);
export const SUMMARY = { heading: '## Summary', lines: 40, chars: 4400, names: ['Approval', 'Scope', 'Base', 'Expected checks', 'Resume'] };

// The job notes written before the summary rule (A1, 25 Oct), and the three jobs running beside A1 (GC, Q1, RB): their
// history is not rewritten. A note not listed here (a new job) must start with its summary.
export const BEFORE_A1 = ['0.2.9-checks', '0.2.9-crossreview', '0.2.9-custom-visuals', '0.2.9-design', '0.2.9-fuzz', '0.2.9-reader',
  '0.2.9-writer', '0.3.0-arabic-twin', 'A1', 'A2', 'A3', 'C', 'C1', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'E', 'E2', 'F1', 'F2', 'F4',
  'F6', 'F7', 'G1', 'I', 'J17', 'J18', 'J19', 'K1', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'M1', 'P1', 'P7', 'Q1', 'R1-see-the-result', 'R1',
  'R7-claims', 'S1', 'S9', 'T1', 'U1', 'V1', 'W', 'W1', 'W2', 'X1', 'X2', 'audit-1-model-reading', 'audit-2-design-engine',
  'audit-3-picker-writer', 'audit-4-checks', 'audit-5-reading', 'audit-6-mcp-tools', 'audit-7-instructions', 'audit-8-packaging',
  'audit-summary', 'GC', 'RB'].map((n) => n + '.md');

const read = (root, f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
export const sizeOf = (text) => ({ lines: text.split('\n').length - (text.endsWith('\n') ? 1 : 0), chars: [...text].length });

// GitHub's anchor for a heading: lower case, punctuation dropped (letters, digits, spaces, hyphens and underscores kept),
// spaces to hyphens; a repeated heading gets -1, -2 ...
export function anchors(md) {
  const seen = new Map(), out = new Set();
  let fence = false;
  for (const line of md.split('\n')) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    const m = !fence && /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const base = m[1].replace(/<[^>]+>/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
    const n = seen.get(base) || 0; seen.set(base, n + 1);
    out.add(n ? `${base}-${n}` : base);
  }
  return out;
}

// [text](target) outside code spans and fences; external links (a scheme or //) and mailto are not checked
export function links(md) {
  const out = [];
  let fence = false;
  md.split('\n').forEach((line, i) => {
    if (/^(```|~~~)/.test(line)) { fence = !fence; return; }
    if (fence) return;
    const bare = line.replace(/`[^`]*`/g, (s) => ' '.repeat(s.length));
    for (const m of bare.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(m[1])) continue;
      out.push({ target: m[1], line: i + 1 });
    }
  });
  return out;
}

export function linkProblems(root, file, md) {
  const problems = [];
  for (const { target, line } of links(md)) {
    const [p, hash] = target.split('#');
    const to = p ? path.join(path.dirname(path.join(root, file)), decodeURI(p)) : path.join(root, file);
    if (!fs.existsSync(to)) { problems.push(`${file}:${line}: the link ${target} names a file that is not there`); continue; }
    if (hash && /\.md$/i.test(to) && fs.statSync(to).isFile() && !anchors(fs.readFileSync(to, 'utf8').replace(/\r\n/g, '\n')).has(decodeURIComponent(hash).toLowerCase())) {
      problems.push(`${file}:${line}: the link ${target} names a section that is not there`);
    }
  }
  return problems;
}

// the note's summary: from "## Summary" (its first "##" heading) to the next "##" heading
export function summaryOf(md) {
  const lines = md.split('\n'), first = lines.findIndex((l) => /^## /.test(l));
  if (first < 0 || lines[first].trim() !== SUMMARY.heading) return null;
  let end = lines.findIndex((l, i) => i > first && /^## /.test(l));
  if (end < 0) end = lines.length;
  return lines.slice(first, end).join('\n').replace(/\n+$/, '\n');
}

export function summaryProblems(file, md, required) {
  const s = summaryOf(md);
  if (!s) return required ? [`${file}: a job note written from A1 on starts with "${SUMMARY.heading}" (its first "##" heading)`] : [];
  const z = sizeOf(s), problems = [];
  if (z.lines > SUMMARY.lines) problems.push(`${file}: its summary is ${z.lines} lines, ${SUMMARY.lines} at most`);
  if (z.chars > SUMMARY.chars) problems.push(`${file}: its summary is ${z.chars} characters, ${SUMMARY.chars} at most`);
  const missing = SUMMARY.names.filter((n) => !new RegExp(`^- \\*\\*${n}:\\*\\*`, 'm').test(s));
  if (missing.length) problems.push(`${file}: its summary has no line "- **${missing[0]}:** ..."${missing.length > 1 ? ` (nor ${missing.slice(1).join(', ')})` : ''}`);
  return problems;
}

// ARCHITECTURE.md's "## Task routes" table: each code span that starts with a path; "path: a, b" names symbols in it
export function routeProblems(root, md) {
  const sec = (md.split(/\n## Task routes\n/)[1] || '').split(/\n## /)[0];
  const rows = sec.split('\n').filter((l) => /^\| /.test(l) && !/^\|\s*-/.test(l)).slice(1);
  if (rows.length < 5) return { checks: 1, problems: [`ARCHITECTURE.md: "## Task routes" has ${rows.length} routes, 5 at least`] };
  let checks = 1; const problems = [];
  for (const row of rows) {
    for (const [, span] of row.matchAll(/`([^`]+)`/g)) {
      const m = /^((?:\.\.?\/)?[\w.-]+(?:\/[\w.-]+)+\.\w+)(?::\s*(.+))?$/.exec(span.trim());
      if (!m) continue;
      checks++;
      const file = path.join(root, m[1]);
      if (!fs.existsSync(file)) { problems.push(`ARCHITECTURE.md routes: ${m[1]} is not there`); continue; }
      const src = fs.readFileSync(file, 'utf8');
      for (const sym of (m[2] || '').split(',').map((x) => x.trim()).filter(Boolean)) {
        checks++;
        if (!new RegExp(`(^|[^\\w$])${sym.replace(/[$.]/g, '\\$&')}([^\\w$]|$)`).test(src)) problems.push(`ARCHITECTURE.md routes: ${m[1]} has no ${sym}`);
      }
    }
  }
  return { checks, problems };
}

export function check(root = ROOT) {
  const problems = [], sizes = {};
  let checks = 0, total = 0;
  for (const [f, cap] of Object.entries(CAPS)) {
    const md = read(root, f), z = sizeOf(md);
    sizes[f] = z; total += z.chars; checks += 2;
    if (z.lines > cap.lines) problems.push(`${f}: ${z.lines} lines, ${cap.lines} at most`);
    if (z.chars > cap.chars) problems.push(`${f}: ${z.chars} characters, ${cap.chars} at most`);
    const l = linkProblems(root, f, md); checks += links(md).length; problems.push(...l);
  }
  checks++;
  if (total > TOTAL_CAP) problems.push(`the startup pack is ${total} characters, ${TOTAL_CAP} at most`);
  const docs = path.join(root, 'mcp/docs');
  const linked = (fs.existsSync(docs) ? fs.readdirSync(docs).filter((x) => x.endsWith('.md')).sort().map((x) => 'mcp/docs/' + x) : []).concat(fs.existsSync(path.join(root, 'mcp/TOOLS.md')) ? ['mcp/TOOLS.md'] : []);
  for (const f of linked) { const md = read(root, f); checks += links(md).length; problems.push(...linkProblems(root, f, md)); }
  // (ST1, SQ12-S4) a cite "rule N in `mcp/CLAUDE.md`" names the rule its sentence is about: the rule's quoted words, or
  // one of its longer words, in the 200 characters before the cite
  const rules = Object.fromEntries([...read(root, 'mcp/CLAUDE.md').matchAll(/(\d+)\. \*\*([^*]+)\*\*/g)].map((m) => [m[1], m[2]]));
  for (const f of ['CLAUDE.md', ...linked]) {
    const md = read(root, f).replace(/\s+/g, ' ');
    for (const m of md.matchAll(/rule (\d+) in `mcp\/CLAUDE\.md`/g)) {
      checks++;
      const ctx = md.slice(Math.max(0, m.index - 200), m.index).toLowerCase(), r = rules[m[1]] || '', quoted = (r.match(/"([^"]+)"/) || [])[1];
      if (!r || !(quoted ? ctx.includes(quoted.toLowerCase()) : r.toLowerCase().split(/[^a-z']+/).some((w) => w.length >= 6 && ctx.includes(w)))) problems.push(`${f}: "rule ${m[1]} in mcp/CLAUDE.md" does not name the rule its sentence is about (rule ${m[1]}: ${r || 'none'})`);
    }
  }
  const work = path.join(root, 'mcp/work'), summaries = {};
  for (const f of fs.readdirSync(work).filter((x) => x.endsWith('.md')).sort()) {
    const md = read(root, 'mcp/work/' + f), s = summaryOf(md), required = !BEFORE_A1.includes(f);
    if (!required && !s) continue;
    checks++;
    problems.push(...summaryProblems('mcp/work/' + f, md, required));
    if (s) { summaries[f] = sizeOf(s); checks += links(s).length; problems.push(...linkProblems(root, 'mcp/work/' + f, s)); }
  }
  const r = routeProblems(root, read(root, 'ARCHITECTURE.md')); checks += r.checks; problems.push(...r.problems);
  return { checks, problems, sizes, total, summaries };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { checks, problems, sizes, total, summaries } = check();
  if (process.argv.includes('--sizes')) {
    for (const [f, z] of Object.entries(sizes)) console.log(`  ${f}: ${z.lines} lines, ${z.chars} characters (cap ${CAPS[f].lines} / ${CAPS[f].chars})`);
    console.log(`  the four together: ${total} characters (cap ${TOTAL_CAP})`);
    for (const [f, z] of Object.entries(summaries)) console.log(`  mcp/work/${f} summary: ${z.lines} lines, ${z.chars} characters`);
  }
  if (problems.length) { console.error(`FAIL  agent-memory  ${problems.length} of ${checks} checks:\n` + problems.map((p) => `      - ${p}`).join('\n')); process.exit(1); }
  console.log(`PASS  agent-memory  ${checks} checks (the startup pack ${total} of ${TOTAL_CAP} characters; every link and task route resolves)`);
}
