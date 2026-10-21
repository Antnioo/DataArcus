// Every npm test script of the MCP prints its result line (B-198): scripts/ci-sum.mjs counts the lines
// "PASS  <name>  <N> checks" (or FAIL ... / SKIP ...) of shard 0, one a script; D5, D6 and U1 printed their own wording
// and broke PR #81's summary (fixed in 29f2846). This reads each script's source and names the one that has no such
// line: a PASS literal with its count ("N checks", or "N tasks" as the golden baseline says), and a FAIL or SKIP one.
//   node scripts/check-result-lines.mjs                 mcp/package.json's "test"
//   node scripts/check-result-lines.mjs <package.json>  another package's (the test's fixture)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// a result literal: a quote or backtick, the status, two spaces, the name, two spaces (ci-sum.mjs's own pattern)
const PASS = /[`'"]PASS {2}[^\s`'"]+ {2}[^`'"\n]*?\b(checks|tasks)\b/, FAIL = /[`'"](FAIL|SKIP) {2}[^\s`'"]+/;
// or both in one: `${bad ? 'FAIL' : 'PASS'}  <name>  <N> checks`
const EITHER = /'(FAIL|PASS)'\s*:\s*'(PASS|FAIL)'\s*\} {2}[^\s`'"]+ {2}[^`\n]*?\b(checks|tasks)\b/;

export function missingLines(pkgFile) {
  const dir = path.dirname(pkgFile), test = (JSON.parse(fs.readFileSync(pkgFile, 'utf8')).scripts || {}).test || '';
  const scripts = [...test.matchAll(/\bnode (\S+\.mjs)\b/g)].map((m) => m[1]);
  return { scripts, missing: scripts.map((f) => {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) return { file: f, why: 'the file is not there' };
    const src = fs.readFileSync(p, 'utf8');
    if (EITHER.test(src)) return null;
    return !PASS.test(src) ? { file: f, why: 'no "PASS  <name>  <N> checks" line' } : !FAIL.test(src) ? { file: f, why: 'no "FAIL  <name>  ..." (or SKIP) line' } : null;
  }).filter(Boolean) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pkg = process.argv[2] || path.join(ROOT, 'mcp/package.json');
  const { scripts, missing } = missingLines(pkg);
  if (!scripts.length) { console.error(`FAIL  result-lines  no "node <script>.mjs" in ${pkg}'s test`); process.exit(1); }
  if (missing.length) { console.error(`FAIL  result-lines  ${missing.length} of ${scripts.length} test scripts print no result line scripts/ci-sum.mjs can count:\n` + missing.map((m) => `      - ${m.file}: ${m.why}`).join('\n')); process.exit(1); }
  console.log(`PASS  result-lines  ${scripts.length} checks (every test script prints "PASS  <name>  <N> checks" or FAIL / SKIP)`);
}
