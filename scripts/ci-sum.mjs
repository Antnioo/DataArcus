// CI's last step for the sharded test jobs (B-145): reads every shard's log, checks that each part ran exactly once and
// passed, and prints the checks per script and in total, so a sharded run can be compared with an unsharded one.
//   node scripts/ci-sum.mjs mcp <folder of logs> [--os <os>]      mcp-shard-<k>.log, k = 0 (npm test's other scripts) .. N
//   node scripts/ci-sum.mjs website <folder of logs> [--os <os>]  suites-<k>.log, k = 1 .. N (scripts/tests/run-all.mjs --shard k/N)
//   (--registry <tests.json>, --times <test-times.json>, --all <run-all.mjs>: another list, for the adapter's tests)
// Exit code 1 when a shard is missing or twice, a suite or script is missing, twice or not listed, or anything failed.
// (A2, 0.3.1) The logs are read through the result adapter (mcp/test-results.mjs). Identity, not a count: shard 0's result
// lines must be exactly mcp/tests.json's suites by name, once each (test.mjs's SKIP the one allowed), shards 1-N exactly
// its sharded suite; the website's exactly run-all.mjs's ALL. Each problem, and its ::error annotation, is the one-line
// form "FAIL script=<file> check=... cause=<cause> os=<os> shard=<k/N>" (--os: the sum job runs on Linux for every OS).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { results, count, oneLine, parseOneLine, firstCheck, identityProblems, osName, planShards, MANIFEST } from '../mcp/test-results.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const [area, dir] = args;
const OS = opt('--os', osName());
if (!['mcp', 'website'].includes(area) || !dir) { console.error('usage: node scripts/ci-sum.mjs mcp|website <folder of logs> [--os <os>]'); process.exit(2); }
const problems = [], rows = [];
let mcpSuites = 0, mcpShards = 0, mcpTimes = [];
// a problem: { script, check, cause, shard }, printed (and annotated) in the one-line form
const problem = (p) => problems.push(oneLine({ ...p, os: p.os || OS }));
const logs = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.log')).map((f) => ({ f, text: fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n') })) : [];
// a FAIL result line: the one-line form printed right under it (npm test's runner, run-all) when the log has it, else
// built here from the detail around it
const failOf = (l, r, shard, script) => {
  const L = l.text.split('\n'), own = L.slice(r.i + 1, r.i + 3).map(parseOneLine).find(Boolean);
  if (own) problems.push(oneLine({ ...own, os: own.os }));
  else problem({ script, check: firstCheck(L.slice(Math.max(0, r.i - 4), r.i + 4).join('\n')), cause: 'checks-failed', shard });
};

if (area === 'mcp') {
  const reg = JSON.parse(fs.readFileSync(opt('--registry', path.join(REPO, 'mcp/tests.json')), 'utf8'));
  const fileOf = (name) => 'mcp/' + ((reg.suites || []).find((s) => s.name === name) || { file: name }).file;
  const sharded = (reg.suites || []).filter((s) => s.sharded);
  const shards = logs.map((l) => ({ ...l, k: +((/shard-(\d+)\.log$/.exec(l.f) || [])[1] ?? -1) })).filter((l) => l.k >= 0);
  const n = Math.max(-1, ...shards.map((s) => { const m = /DA_SHARD=0\/(\d+)|\(shard \d+\/(\d+):/.exec(s.text); return m ? +(m[1] || m[2]) : -1; }));
  for (let k = 0; k <= n; k++) { const c = shards.filter((s) => s.k === k).length; if (c !== 1) problem({ script: `ci-logs/mcp-shard-${k}.log`, check: `shard ${k}/${n}: ${c} logs`, cause: 'missing-shard', shard: `${k}/${n}` }); }
  if (n < 1) problem({ script: dir, check: `no shard logs in ${dir}`, cause: 'missing-shard', shard: '-' });
  // (SPD) the seconds the runner dealt the suites by: the registry's test-times.json (none: the runner's {} too)
  let times = {};
  try { times = JSON.parse(fs.readFileSync(opt('--times', path.join(path.dirname(opt('--registry', path.join(REPO, 'mcp/tests.json'))), 'test-times.json')), 'utf8')); } catch { /* every suite weighs the same */ }
  const plan = planShards(reg, times, OS, Math.max(n, 1));
  let mcpChecks = 0, reports = 0, bad = 0;
  const all = [], secs = [];
  for (const s of shards.sort((a, b) => a.k - b.k)) {
    const res = results(s.text), shard = `${s.k}/${n}`;
    all.push(...res.filter((r) => !sharded.some((x) => x.name === r.name)).map((r) => ({ ...r, where: s.f })));
    // (SPD, Codex #10) the shard's manifest (the runner's record, mcp-shard-<k>-full/manifest.json): there, finished,
    // this shard's and this OS's; a suite it says timed out or crashed fails by that cause; it and the log agree
    const mf = `mcp-shard-${s.k}-full/${MANIFEST}`, mp = path.join(dir, mf);
    let man = null;
    try { man = JSON.parse(fs.readFileSync(mp, 'utf8')); } catch { problem({ script: mf, check: fs.existsSync(mp) ? `${mf} is not JSON` : `no ${mf}: the runner's record of shard ${shard}`, cause: 'missing-manifest', shard }); }
    if (man) {
      if (man.finished !== true) problem({ script: mf, check: `${mf}: the run did not finish (the runner stopped before its end)`, cause: 'crash', shard });
      if (man.shard !== shard || man.os !== OS) problem({ script: mf, check: `${mf} is shard ${man.shard} on ${man.os}, not ${shard} on ${OS}`, cause: 'missing-shard', shard });
      const ms = man.suites || [];
      secs.push([`shard ${shard}`, ms.reduce((a, e) => a + (+e.seconds || 0), 0), ms.filter((e) => e.status !== 'SKIP').length]);
      for (const e of ms.filter((e) => e.status === 'FAIL' && e.cause !== 'checks-failed')) problem({ script: 'mcp/' + e.file, check: `${e.file}: ${e.cause} (the manifest; ${e.seconds}s)`, cause: e.cause, shard });
      for (const name of new Set([...ms.map((e) => e.name), ...res.map((r) => r.name)])) {
        const e = ms.filter((x) => x.name === name), r = res.filter((x) => x.name === name);
        if (e.length === 1 && e[0].status === 'FAIL' && e[0].cause !== 'checks-failed' && !r.length) continue;   // said above, by its cause
        const same = e.length === r.length && e.every((x, i) => x.status === r[i].status && (x.checks ?? null) === count(r[i].rest));
        if (!same) problem({ script: fileOf(name), check: `${name}: the log says ${r.map((x) => `${x.status} ${count(x.rest) ?? '-'}`).join(', ') || 'nothing'}, the manifest ${e.map((x) => `${x.status} ${x.checks ?? '-'}`).join(', ') || 'nothing'}`, cause: 'manifest-mismatch', shard });
      }
    }
    // (SPD) a suite that ran nothing passed nothing, as for the website's suites
    res.filter((r) => r.status === 'PASS' && !count(r.rest)).forEach((r) => problem({ script: fileOf(r.name), check: `PASS  ${r.name}  ${r.rest}`.trim(), cause: 'zero-checks', shard }));
    res.filter((r) => r.status === 'FAIL').forEach((r) => failOf(s, r, shard, fileOf(r.name)));
    // (SPD) which suites this shard must print: the plan's shard k for this OS (planShards, as the runner dealt them by
    // mcp/test-times.json): the sharded suite in each (its SKIP in shard 0), every other suite in exactly one shard
    const expected = (plan.shards[s.k] || []).map((x) => ({ name: x.name, skip: !!x.sharded && s.k === 0 }));
    identityProblems(res.map((r) => ({ ...r, where: s.f })), expected).forEach((p) => problem({ script: p.cause === 'unknown-suite' ? s.f : fileOf(p.name), check: p.check, cause: p.cause, shard }));
    if (s.k === 0) {
      sharded.filter((x) => res.some((r) => r.name === x.name && r.status !== 'SKIP')).forEach((x) => problem({ script: 'mcp/' + x.file, check: `${x.file} did not say SKIP (DA_SHARD=0/N): its parts would count twice`, cause: 'duplicate-suite', shard }));
      res.filter((r) => r.status !== 'SKIP').forEach((r) => rows.push([r.name, count(r.rest), 'shard 0']));
    } else {
      res.filter((r) => !sharded.some((x) => x.name === r.name)).forEach((r) => rows.push([r.name, count(r.rest), `shard ${shard}`]));
      const own = res.filter((r) => sharded.some((x) => x.name === r.name)), g = /^G13 {2}(\d+) reports, (\d+) with errors$/m.exec(s.text);
      if (own.length === 1 && count(own[0].rest) != null) { mcpChecks += count(own[0].rest); rows.push([`mcp (shard ${s.k}/${n})`, count(own[0].rest), own[0].rest.replace(/^.*\(|\)$/g, '')]); }
      else if (!own.length) { /* named above: missing-suite */ } else problem({ script: fileOf(own[0].name), check: `no "${own[0].name} N checks" line`, cause: 'zero-checks', shard });
      if (!g) problem({ script: 'mcp/test.mjs', check: 'no G13 line', cause: 'g13', shard }); else { reports += +g[1]; bad += +g[2]; }
    }
  }
  // (SPD) every suite exactly once over all the shards: two shards running one suite is a duplicate
  identityProblems(all, reg.suites.filter((x) => !x.sharded).map((x) => ({ name: x.name, skip: false }))).filter((p) => p.cause === 'duplicate-suite')
    .forEach((p) => problem({ script: fileOf(p.name), check: p.check, cause: p.cause, shard: `0-${n}/${n}` }));
  mcpSuites = reg.suites.length; mcpShards = n + 1; mcpTimes = secs;
  // G-13, counted once as in an unsharded run: every report the parts before it created validates with 0 errors
  const g13 = reports > 50 && bad === 0;
  if (!g13) problem({ script: 'mcp/test.mjs', check: `G-13: every created report must validate with 0 errors (${reports} reports, ${bad} with errors)`, cause: 'g13', shard: `1-${n}/${n}` });
  rows.push(['mcp G-13 (from the shards)', 1, `${reports} reports, ${bad} with errors`]);
  rows.push(['mcp (test.mjs, all shards)', mcpChecks + 1, '']);
} else {
  const src = fs.readFileSync(opt('--all', path.join(REPO, 'scripts/tests/run-all.mjs')), 'utf8');
  const all = JSON.parse(((/^const ALL = (\[.*\]);$/m.exec(src) || [])[1] || '[]').replace(/'/g, '"'));
  const suiteLogs = logs.filter((x) => /^suites-\d+\.log$/.test(x.f)), N = suiteLogs.length, found = [];
  for (const l of suiteLogs) {
    const shard = `${/^suites-(\d+)/.exec(l.f)[1]}/${N}`;
    if (!/^All \d+ passed/m.test(l.text)) problem({ script: l.f, check: 'no "All N passed" line', cause: 'checks-failed', shard });
    for (const r of results(l.text)) {
      found.push({ ...r, where: l.f });
      if (r.status === 'FAIL') failOf(l, r, shard, `scripts/tests/run-all.mjs:${r.name}`);
      // (SQ11, A2-S1) a suite that ran nothing passed nothing, as for the MCP's suites
      if (r.status === 'PASS' && !count(r.rest)) problem({ script: `scripts/tests/run-all.mjs:${r.name}`, check: `PASS  ${r.name}  ${r.rest}`.trim(), cause: 'zero-checks', shard });
      rows.push([r.name, count(r.rest), l.f]);
    }
  }
  // the same identity check as the MCP's: every suite of ALL exactly once, nothing else, no SKIP
  identityProblems(found, all.map((name) => ({ name, skip: false }))).forEach((p) => problem({ script: `scripts/tests/run-all.mjs:${p.name}`, check: p.check, cause: p.cause, shard: '-' }));
  if (!all.length) problem({ script: 'scripts/tests/run-all.mjs', check: 'could not read ALL from scripts/tests/run-all.mjs', cause: 'missing-suite', shard: '-' });
}

const total = rows.filter(([name]) => !/^mcp \(shard|G-13/.test(name)).reduce((a, [, c]) => a + (c || 0), 0);
const out = rows.map(([name, c, note]) => `${String(name).padEnd(30)} ${String(c ?? '?').padStart(6)}  ${note}`);
out.push(`${'total'.padEnd(30)} ${String(total).padStart(6)}`);
// (SPD) each shard's seconds (the suites' own, from its manifest): how even the split is
if (mcpTimes.length) out.push('', ...mcpTimes.map(([name, sec, k]) => `${name.padEnd(12)} ${sec.toFixed(1).padStart(7)} s  ${k} suite${k === 1 ? '' : 's'}`));
console.log(out.join('\n'));
const uniq = [...new Set(problems)];
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${area} (${OS}): checks per script\n\n\`\`\`\n${out.join('\n')}\n\`\`\`\n` + (uniq.length ? `\n\`\`\`\n${uniq.join('\n')}\n\`\`\`\n` : ''));
console.log(uniq.length ? `\nFAIL  ${area}\n` + uniq.map((p) => '      - ' + p).join('\n') : `\nPASS  ${area}  ${total} checks in all shards${area === 'mcp' ? ` (${OS}: ${mcpSuites} suites, ${mcpShards} shards)` : ''}`);
// (0.3.1) on GitHub, each problem is also an annotation, in the one-line form: readable through the API when the logs are not
if (process.env.GITHUB_ACTIONS) uniq.slice(0, 10).forEach((p) => console.log(`::error title=${area} ${OS}::${p.replace(/%/g, '%25').replace(/\r?\n/g, '%0A').slice(0, 900)}`));
process.exit(uniq.length ? 1 : 0);
