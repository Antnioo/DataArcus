// The one result adapter (A2, 0.3.1; the owner 25 Oct, after an outside review: a failure was expensive to diagnose,
// every collected problem printed, and CI checked shard 0 by its number of result lines, not by which suites ran).
// Used by mcp/run-tests.mjs, scripts/ci-sum.mjs, scripts/check-result-lines.mjs and scripts/tests/run-all.mjs, so the
// result line, its count, a failure's one-line form, the caps and the suite identities are read one way everywhere.
//   - A result line, as every test script prints at its end: "PASS  <name>  <N> checks" (or "N tasks"), "FAIL  <name>
//     ...", "SKIP  <name>  ...": status, two spaces, the name. Unchanged since B-198; this file only reads it.
//   - A failure is one line first:
//       FAIL script=<file> check="<the first failing check>" cause=<cause> os=<os> shard=<k/N>
//     (one space after FAIL, so it is never counted as a result line), then at most 4 KB of that script's own detail and
//     16 KB a run, with "N more lines not shown"; the full output stays in the log file (CI: the artifact).
//   - Nothing printed carries an absolute path: the repo's own become repo-relative, the temp folder <tmp>, a home ~.
//     The suites run on the repo's synthetic fixtures only (never a user's data); a long line is cut at 300 characters.
// A helper, not a suite: mcp/tests.json lists it under "ignored".
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LIMITS = { script: 4096, run: 16384, line: 300 };

// what made a suite fail, by name (a run never fails as a quiet "0 checks")
export const CAUSES = {
  'checks-failed': 'the suite printed FAIL: some of its checks failed',
  timeout: 'the suite ran past its time limit and was stopped',
  crash: 'the suite exited non-zero without a result line',
  'no-result-line': 'the suite exited 0 without a result line',
  'duplicate-suite': 'a suite name printed more than once',
  'unexpected-skip': 'a SKIP where none is allowed',
  'zero-checks': 'a PASS with 0 checks (or no count)',
  'exit-nonzero': 'a PASS line, but the suite exited non-zero',
  'wrong-name': 'the result line names another suite than the registered one',
  'missing-suite': 'a listed suite has no result line in the logs',
  'unknown-suite': 'a result line names a suite that is not listed',
  'missing-shard': 'a shard log is missing or there twice',
  'g13': 'a report created by the parts does not validate',
  'missing-manifest': 'a shard has no manifest.json (the runner\'s record of each suite it ran)',
  'manifest-mismatch': 'a shard\'s log and its manifest disagree on a suite (its status or its checks)',
};
// (SPD, Codex #10) the runner's record of a run, in its log folder: { os, shard, commit, run, planned: [files], suites:
// [{ file, name, seconds, status, checks, cause }], finished }. ci-sum reads it beside each shard's log;
// scripts/test-times.mjs reads CI's to write mcp/test-times.json
export const MANIFEST = 'manifest.json';

export const RESULT = /^(PASS|FAIL|SKIP)\s{2}(\S+)\s+(.*)$/;
export const results = (text) => String(text).replace(/\r\n/g, '\n').split('\n').map((l, i) => { const m = RESULT.exec(l); return m && { status: m[1], name: m[2], rest: m[3], i }; }).filter(Boolean);
export const count = (rest) => { const m = /(\d+) checks/.exec(rest) || /(\d+) tasks/.exec(rest); return m ? +m[1] : null; };
// the lines a run keeps on the console: the result lines and test.mjs's G-13 line (ci-sum reads both)
export const isSummaryLine = (l) => RESULT.test(l) || /^G13 {2}\d+ reports/.test(l);

// in a test script's source: a result literal (a quote or backtick, the status, two spaces, the name, two spaces), or
// both in one ternary; scripts/check-result-lines.mjs reads the sources with these
export const SOURCE = {
  PASS: /[`'"]PASS {2}[^\s`'"]+ {2}[^`'"\n]*?\b(checks|tasks)\b/,
  FAIL: /[`'"](FAIL|SKIP) {2}[^\s`'"]+/,
  EITHER: /'(FAIL|PASS)'\s*:\s*'(PASS|FAIL)'\s*\} {2}[^\s`'"]+ {2}[^`\n]*?\b(checks|tasks)\b/,
};
export function sourceProblem(src) {
  if (SOURCE.EITHER.test(src)) return null;
  return !SOURCE.PASS.test(src) ? 'no "PASS  <name>  <N> checks" line' : !SOURCE.FAIL.test(src) ? 'no "FAIL  <name>  ..." (or SKIP) line' : null;
}

export const osName = (p = process.platform) => ({ win32: 'windows', darwin: 'macos', linux: 'linux' })[p] || p;
export const shardOf = (v = process.env.DA_SHARD) => (/^\d+\/\d+$/.test(v || '') ? v : '-');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// absolute paths out: the repo's own (with / or \, as a file URL too) become repo-relative, the temp folder <tmp>, a
// home folder ~ (the runner's own and any /home/<x>, /Users/<x>, C:\Users\<x>)
export function scrub(text, { root = REPO, home = os.homedir(), tmp = os.tmpdir() } = {}) {
  let t = String(text);
  const forms = (p) => { if (!p) return []; const f = p.replace(/[\\/]+$/, ''), s = f.replace(/\\/g, '/'); return [...new Set([f, s, f.replace(/\//g, '\\'), 'file://' + (s.startsWith('/') ? '' : '/') + s])].sort((a, b) => b.length - a.length); };
  for (const [p, to] of [[root, ''], [tmp, '<tmp>'], [home, '~']]) {
    for (const f of forms(p)) {
      const ci = /^[A-Za-z]:|\\/.test(f) || /^file:\/\/\/[A-Za-z]:/.test(f) ? 'gi' : 'g';
      t = to ? t.replace(new RegExp(esc(f) + '(?![\\w.~-])', ci), to) : t.replace(new RegExp(esc(f) + '[\\\\/]', ci), '').replace(new RegExp(esc(f) + '(?![\\w.-])', ci), '.');
    }
  }
  return t.replace(/(?:file:\/\/)?\/(?:home|Users)\/[^/\s'"`)]+/g, '~').replace(/(?:file:\/\/\/)?\b[A-Za-z]:[\\/]Users[\\/][^\\/\s'"`)]+/gi, '~').replace(/(?:file:\/\/)?\/root(?=\/)/g, '~');
}

const cut = (l, n = LIMITS.line) => ([...l].length > n ? [...l].slice(0, n).join('') + '...' : l);
// FAIL script=<file> check="<check>" cause=<cause> os=<os> shard=<k/N>
export function oneLine({ script, check, cause, os: o = osName(), shard = shardOf() }) {
  const c = cut(scrub(String(check || '-')).replace(/\s+/g, ' ').trim(), 160).replace(/"/g, "'");
  return `FAIL script=${scrub(script)} check="${c || '-'}" cause=${cause} os=${o} shard=${shard}`;
}
export function parseOneLine(line) {
  const m = /^FAIL script=(\S+) check="([^"]*)" cause=(\S+) os=(\S+) shard=(\S+)$/.exec(line);
  return m && { script: m[1], check: m[2], cause: m[3], os: m[4], shard: m[5] };
}

// the detail a failing script printed: its problem lines ("  - ...", "  ... and N more") when it has them, else every
// line but its result lines; a crash or a timeout reads from the end (the stack, where it stopped)
export function detailOf(text) {
  const L = scrub(text).replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim() && !RESULT.test(l));
  const problems = L.filter((l) => /^\s+(- |\.\.\. )/.test(l));
  return problems.length ? problems : L;
}
export const firstCheck = (text, cause) => {
  const d = detailOf(text);
  if (!d.length) return '-';
  if (cause === 'crash') return (d.find((l) => /^\s*(Uncaught )?\w*(Error|Exception)( \[\w+\])?:/.test(l)) || d.find((l) => /\b\w*Error\b/.test(l)) || d[d.length - 1]).trim();
  if (cause === 'timeout' || cause === 'no-result-line') return d[d.length - 1].trim();
  return d[0].replace(/^\s+- /, '').trim();
};

// a run's budget: each script's detail at most LIMITS.script bytes, all of them at most LIMITS.run
export function budget(run = LIMITS.run, script = LIMITS.script) {
  let left = run;
  return {
    get left() { return left; },
    // lines -> the lines shown (cut to LIMITS.line), and a last line saying how many are not
    take(lines, { fromEnd = false, log = '' } = {}) {
      const src = lines.map((l) => cut(l)), out = [];
      let used = 0;
      const cap = Math.min(script, left), order = fromEnd ? [...src].reverse() : src;
      for (const l of order) { const b = Buffer.byteLength(l) + 1; if (used + b > cap) break; out.push(l); used += b; }
      if (fromEnd) out.reverse();
      left -= used;
      const hidden = src.length - out.length;
      if (hidden) out.push(`      ... ${hidden} more line${hidden === 1 ? '' : 's'} not shown${log ? ` (full log: ${scrub(log)})` : ''}${cap < script ? '; this run\'s 16 KB of detail is spent' : ''}`);
      return out;
    },
  };
}

// one suite's output and exit, judged: { ok, cause, check, results, shown }
//   name: the registered result name; skipOk: a SKIP is allowed (test.mjs in shard 0)
export function judge({ out = '', code = 0, signal = null, timedOut = false, name, skipOk = false }) {
  const res = results(out), mine = res.filter((r) => r.name === name), other = res.filter((r) => r.name !== name);
  const fail = (cause, check) => ({ ok: false, cause, check: check ?? firstCheck(out, cause), results: res });
  if (timedOut) return fail('timeout');
  if (!res.length) return fail(code === 0 && !signal ? 'no-result-line' : 'crash');
  if (other.length) return fail('wrong-name', `printed "${other[0].name}", registered "${name}"`);
  if (mine.length > 1) return fail('duplicate-suite', `"${name}" printed ${mine.length} times`);
  const r = mine[0];
  if (r.status === 'FAIL') return fail('checks-failed');
  if (r.status === 'SKIP') return skipOk ? { ok: true, skipped: true, results: res } : fail('unexpected-skip', `SKIP  ${name}  ${r.rest}`);
  if (code !== 0 || signal) return fail('exit-nonzero', `PASS line, exit ${signal || code}`);
  if (!count(r.rest)) return fail('zero-checks', `PASS  ${name}  ${r.rest}`);
  return { ok: true, results: res };
}

// the suites that ran (result lines, with where each was found) against the suites expected (names, a SKIP allowed or
// not): each expected name exactly once, no other name, no SKIP where none is allowed
export function identityProblems(found, expected) {
  const want = new Map(expected.map((e) => [e.name, e])), seen = new Map(), out = [];
  for (const r of found) (seen.get(r.name) || seen.set(r.name, []).get(r.name)).push(r);
  for (const e of expected) if (!seen.has(e.name)) out.push({ cause: 'missing-suite', name: e.name, check: `${e.name}: no result line` });
  for (const [n, rs] of seen) {
    if (!want.has(n)) { out.push({ cause: 'unknown-suite', name: n, check: `${n} (${rs.map((r) => r.where).join(', ')}) is not listed` }); continue; }
    if (rs.length > 1) out.push({ cause: 'duplicate-suite', name: n, check: `${n} ran ${rs.length} times (${rs.map((r) => r.where).join(', ')})` });
    for (const r of rs.filter((r) => r.status === 'SKIP' && !want.get(n).skip)) out.push({ cause: 'unexpected-skip', name: n, check: `SKIP  ${n}  ${r.rest}` });
  }
  return out;
}

// --affected (local runs only; CI and the final gate always run everything): changed paths -> suites, with a reason each.
// map (tests.json "affected"): none (paths no suite reads), everything (safety infrastructure, shared engines not
// mapped, public text), areas { area: [paths] }. A pattern ending in / is a folder; * matches within a name.
const matches = (p, pat) => (pat.endsWith('/') ? p.startsWith(pat) : new RegExp('^' + esc(pat).replace(/\\\*/g, '[^/]*') + '$').test(p));
export function affected(paths, reg) {
  const map = reg.affected || {}, suites = reg.suites || [], picks = new Map(), reasons = [];
  const pick = (s, why) => { if (!picks.has(s.file)) picks.set(s.file, why); };
  let all = null;
  for (const p of paths.map((x) => x.replace(/\\/g, '/'))) {
    const rel = p.startsWith('mcp/') ? p.slice(4) : null, own = rel && suites.find((s) => s.file === rel);
    if (own) { reasons.push(`${p} -> its own suite: ${own.file}`); pick(own, p); continue; }
    if ((map.none || []).some((q) => matches(p, q))) { reasons.push(`${p} -> no suite reads it`); continue; }
    const every = (map.everything || []).find((q) => matches(p, q));
    if (every) { reasons.push(`${p} -> everything (tests.json affected.everything: ${every})`); all = all || p; continue; }
    const areas = Object.entries(map.areas || {}).filter(([, qs]) => qs.some((q) => matches(p, q))).map(([a]) => a);
    if (!areas.length) { reasons.push(`${p} -> everything (not in tests.json's "affected" map)`); all = all || p; continue; }
    for (const a of areas) {
      const in_ = suites.filter((s) => s.area === a);
      in_.forEach((s) => pick(s, p));
      reasons.push(`${p} -> area ${a}: ${in_.map((s) => s.file).join(', ')}`);
    }
  }
  const chosen = all ? suites : suites.filter((s) => picks.has(s.file));
  return { all: !!all, suites: chosen, reasons };
}

// (SPD, Codex #1) CI's plan: mcp/tests.json's suites dealt over the shards 0..n of one OS by their measured seconds
// (mcp/test-times.json, written by scripts/test-times.mjs from a CI run's manifests, never typed). The sharded suite
// (test.mjs) is in every shard: its part k in shard k (SHARDS and TOGETHER in test.mjs decide the parts), a SKIP in shard
// 0. Every other suite goes to exactly one shard: the longest first, each onto the shard with the least seconds so far
// (a tie: the lower shard); a suite without a time weighs the median of the OS's suites; an OS without times uses
// linux's. Each shard keeps tests.json's order. mcp/run-tests.mjs (DA_SHARD=k/N) and scripts/ci-sum.mjs both call this,
// so they agree on which suite runs where: the times change how even the shards are, never which suites run.
export function planShards(reg, times, os, n) {
  const all = (times && times.os) || {}, t = all[os] || all.linux || {};
  const suites = reg.suites || [], plain = suites.filter((s) => !s.sharded);
  const known = plain.map((s) => t[s.file]).filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  const median = known.length ? known[Math.floor((known.length - 1) / 2)] : 1;
  const weight = (key) => (Number.isFinite(t[key]) && t[key] > 0 ? t[key] : median);
  const loads = Array.from({ length: n + 1 }, (_, k) => (k ? suites.filter((s) => s.sharded).reduce((a, s) => a + weight(`${s.file}@${k}`), 0) : 0));
  const where = new Map(), weights = {};
  for (const s of plain) weights[s.file] = weight(s.file);
  for (const s of [...plain].sort((a, b) => weights[b.file] - weights[a.file] || (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))) {
    const k = loads.indexOf(Math.min(...loads));
    where.set(s.file, k); loads[k] += weights[s.file];
  }
  const round = (v) => Math.round(v * 10) / 10;
  return { shards: loads.map((_, k) => suites.filter((s) => s.sharded || where.get(s.file) === k)), loads: loads.map(round), weights };
}
