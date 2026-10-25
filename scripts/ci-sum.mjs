// CI's last step for the sharded test jobs (B-145): reads every shard's log, checks that each part ran exactly once and
// passed, and prints the checks per script and in total, so a sharded run can be compared with an unsharded one.
//   node scripts/ci-sum.mjs mcp <folder of logs>       mcp-shard-<k>.log, k = 0 (npm test's other scripts) .. N
//   node scripts/ci-sum.mjs website <folder of logs>   suites-<k>.log, k = 1 .. N (scripts/tests/run-all.mjs --shard k/N)
// Exit code 1 when a shard is missing or twice, a suite or script is missing or twice, or anything failed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [area, dir] = process.argv.slice(2);
if (!['mcp', 'website'].includes(area) || !dir) { console.error('usage: node scripts/ci-sum.mjs mcp|website <folder of logs>'); process.exit(2); }
const problems = [], rows = [];
const logs = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.log')).map((f) => ({ f, text: fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n') })) : [];
// a result line: "PASS  name  ...", as every test script prints at its end
const results = (text) => text.split('\n').map((l) => /^(PASS|FAIL|SKIP)\s{2}(\S+)\s+(.*)$/.exec(l)).filter(Boolean).map(([, status, name, rest]) => ({ status, name, rest }));
// the detail a failing script prints under (or, for some scripts, just above) its FAIL line ("  - ..."), 3 lines, for the annotation
const detail = (text, name) => { const L = text.split('\n'), i = L.findIndex((l) => new RegExp('^FAIL\\s{2}' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s').test(l)); if (i < 0) return ''; const after = L.slice(i + 1, i + 4).filter((l) => /^\s+- /.test(l)), before = []; for (let k = i - 1; k >= 0 && /^\s+- /.test(L[k]) && before.length < 3; k--) before.unshift(L[k]); return (after.length ? after : before).map((l) => l.trim().slice(0, 280)).join(' | '); };
const count = (rest) => { const m = /(\d+) checks/.exec(rest) || /(\d+) tasks/.exec(rest); return m ? +m[1] : null; };

if (area === 'mcp') {
  const shards = logs.map((l) => ({ ...l, k: +((/shard-(\d+)\.log$/.exec(l.f) || [])[1] ?? -1) })).filter((l) => l.k >= 0);
  const n = Math.max(-1, ...shards.map((s) => { const m = /DA_SHARD=0\/(\d+)|\(shard \d+\/(\d+):/.exec(s.text); return m ? +(m[1] || m[2]) : -1; }));
  for (let k = 0; k <= n; k++) { const c = shards.filter((s) => s.k === k).length; if (c !== 1) problems.push(`shard ${k}/${n}: ${c} logs`); }
  if (n < 1) problems.push(`no shard logs in ${dir}`);
  let mcpChecks = 0, reports = 0, bad = 0;
  for (const s of shards.sort((a, b) => a.k - b.k)) {
    const res = results(s.text);
    res.filter((r) => r.status === 'FAIL').forEach((r) => { const d = detail(s.text, r.name); problems.push(`${s.f}: FAIL ${r.name} ${r.rest}${d ? ': ' + d : ''}`); });
    if (s.k === 0) {
      // npm test's other scripts: one result line each, test.mjs's own line says SKIP; the suites are mcp/tests.json's (G1)
      const scripts = (JSON.parse(fs.readFileSync(path.join(REPO, 'mcp/tests.json'), 'utf8')).suites || []).length;
      if (res.length !== scripts) problems.push(`${s.f}: ${res.length} result lines, npm test runs ${scripts} scripts`);
      if (!res.some((r) => r.status === 'SKIP' && r.name === 'mcp')) problems.push(`${s.f}: test.mjs did not say SKIP (DA_SHARD=0/N)`);
      res.filter((r) => r.status !== 'SKIP').forEach((r) => rows.push([r.name, count(r.rest), 'shard 0']));
    } else {
      const own = res.filter((r) => r.name === 'mcp'), g = /^G13 {2}(\d+) reports, (\d+) with errors$/m.exec(s.text);
      if (own.length !== 1 || count(own[0].rest) == null) problems.push(`${s.f}: no "mcp N checks" line`);
      else { mcpChecks += count(own[0].rest); rows.push([`mcp (shard ${s.k}/${n})`, count(own[0].rest), own[0].rest.replace(/^.*\(|\)$/g, '')]); }
      if (!g) problems.push(`${s.f}: no G13 line`); else { reports += +g[1]; bad += +g[2]; }
    }
  }
  // G-13, counted once as in an unsharded run: every report the parts before it created validates with 0 errors
  const g13 = reports > 50 && bad === 0;
  if (!g13) problems.push(`G-13: every created report must validate with 0 errors (${reports} reports, ${bad} with errors)`);
  rows.push(['mcp G-13 (from the shards)', 1, `${reports} reports, ${bad} with errors`]);
  rows.push(['mcp (test.mjs, all shards)', mcpChecks + 1, '']);
} else {
  const src = fs.readFileSync(path.join(REPO, 'scripts/tests/run-all.mjs'), 'utf8');
  const all = JSON.parse(((/^const ALL = (\[.*\]);$/m.exec(src) || [])[1] || '[]').replace(/'/g, '"'));
  const seen = {};
  for (const l of logs.filter((x) => /^suites-\d+\.log$/.test(x.f))) {
    if (!/^All \d+ passed/m.test(l.text)) problems.push(`${l.f}: no "All N passed" line`);
    for (const r of results(l.text)) {
      (seen[r.name] = seen[r.name] || []).push(l.f);
      if (r.status !== 'PASS') { const d = r.status === 'FAIL' ? detail(l.text, r.name) : ''; problems.push(`${l.f}: ${r.status} ${r.name} ${r.rest}${d ? ': ' + d : ''}`); }
      rows.push([r.name, count(r.rest), l.f]);
    }
  }
  all.filter((s) => !seen[s]).forEach((s) => problems.push(`suite ${s} ran in no shard`));
  Object.entries(seen).filter(([, f]) => f.length > 1).forEach(([s, f]) => problems.push(`suite ${s} ran ${f.length} times (${f.join(', ')})`));
  Object.keys(seen).filter((s) => !all.includes(s)).forEach((s) => problems.push(`suite ${s} is not in run-all.mjs's ALL`));
  if (!all.length) problems.push('could not read ALL from scripts/tests/run-all.mjs');
}

const total = rows.filter(([name]) => !/^mcp \(shard|G-13/.test(name)).reduce((a, [, c]) => a + (c || 0), 0);
const out = rows.map(([name, c, note]) => `${String(name).padEnd(30)} ${String(c ?? '?').padStart(6)}  ${note}`);
out.push(`${'total'.padEnd(30)} ${String(total).padStart(6)}`);
console.log(out.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${area}: checks per script\n\n\`\`\`\n${out.join('\n')}\n\`\`\`\n`);
console.log(problems.length ? `\nFAIL  ${area}\n` + problems.map((p) => '      - ' + p).join('\n') : `\nPASS  ${area}  ${total} checks in all shards`);
// (0.3.1) on GitHub, each problem is also an annotation: readable through the API when the logs are not
if (process.env.GITHUB_ACTIONS) problems.slice(0, 10).forEach((p) => console.log(`::error title=${area}::${p.replace(/%/g, '%25').replace(/\r?\n/g, '%0A').slice(0, 900)}`));
process.exit(problems.length ? 1 : 0);
