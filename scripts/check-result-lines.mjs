// Every npm test script of the MCP prints its result line (B-198): scripts/ci-sum.mjs counts the lines
// "PASS  <name>  <N> checks" (or FAIL ... / SKIP ...) of shard 0, one a script; D5, D6 and U1 printed their own wording
// and broke PR #81's summary (fixed in 29f2846). This reads each script's source and names the one that has no such
// line: a PASS literal with its count ("N checks", or "N tasks" as the golden baseline says), and a FAIL or SKIP one.
//   node scripts/check-result-lines.mjs                 the suites of mcp/tests.json (npm test's registry, G1 0.3.1),
//                                                       and every test-*.mjs of mcp/ registered there once
//   node scripts/check-result-lines.mjs <tests.json>    another registry (a test's fixture)
//   node scripts/check-result-lines.mjs <package.json>  a package's "test" line of `node <script>.mjs` (a test's fixture)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceProblem } from '../mcp/test-results.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// the scripts a registry (tests.json: { suites: [{ file, name }] }) or a package.json's "test" line runs
export function scriptsOf(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (Array.isArray(j.suites)) return j.suites.map((s) => s.file);
  return [...((j.scripts || {}).test || '').matchAll(/\bnode (\S+\.mjs)\b/g)].map((m) => m[1]);
}

// (A2, 0.3.1) the source patterns are the result adapter's (mcp/test-results.mjs), as ci-sum reads the lines; a
// registered suite's result line must also print its registered name (tests.json "name"), as ci-sum checks names
export function missingLines(pkgFile) {
  const dir = path.dirname(pkgFile), scripts = scriptsOf(pkgFile), j = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  const nameOf = new Map((Array.isArray(j.suites) ? j.suites : []).map((s) => [s.file, s.name]));
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { scripts, missing: scripts.map((f) => {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) return { file: f, why: 'the file is not there' };
    const src = fs.readFileSync(p, 'utf8'), why = sourceProblem(src), name = nameOf.get(f);
    if (why) return { file: f, why };
    if (name && !new RegExp(`(PASS|\\}) {2}${esc(name)} {2}`).test(src)) return { file: f, why: `its result line does not print its registered name "${name}" (tests.json)` };
    return null;
  }).filter(Boolean) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pkg = process.argv[2] || path.join(ROOT, 'mcp/tests.json');
  const { scripts, missing } = missingLines(pkg);
  if (!scripts.length) { console.error(`FAIL  result-lines  no test script in ${pkg}`); process.exit(1); }
  if (!process.argv[2]) {
    const { registryProblems } = await import('../mcp/run-tests.mjs');
    const problems = registryProblems(path.join(ROOT, 'mcp'), undefined, { names: true });
    if (problems.length) { console.error(`FAIL  result-lines  mcp/tests.json does not match mcp/'s test files:\n` + problems.map((p) => `      - ${p}`).join('\n')); process.exit(1); }
  }
  if (missing.length) { console.error(`FAIL  result-lines  ${missing.length} of ${scripts.length} test scripts print no result line scripts/ci-sum.mjs can count:\n` + missing.map((m) => `      - ${m.file}: ${m.why}`).join('\n')); process.exit(1); }
  console.log(`PASS  result-lines  ${scripts.length} checks (every test script prints "PASS  <name>  <N> checks" or FAIL / SKIP${process.argv[2] ? '' : '; every test-*.mjs registered'})`);
}
