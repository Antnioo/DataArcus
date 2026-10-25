// The coverage report's summary (Q1, 0.3.1): c8's coverage/coverage-summary.json (from `npm run coverage:mcp`) as one
// Markdown table, per file: lines and branches %, the total first and the 10 files with the lowest branch coverage.
// Not a gate (no threshold in 0.3.1): it always exits 0 once the file is read.
//   node scripts/coverage-summary.mjs [coverage/coverage-summary.json]   prints the table (CI adds it to the job summary)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2] || path.join(ROOT, 'coverage', 'coverage-summary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const pct = (x) => (x && x.total ? x.pct.toFixed(1) : '-');
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
const files = Object.entries(data).filter(([f]) => f !== 'total').map(([f, s]) => ({ f: rel(f), s })).sort((a, b) => a.f.localeCompare(b.f));
const row = (name, s) => `| ${name} | ${pct(s.lines)} | ${pct(s.branches)} | ${s.lines.covered}/${s.lines.total} | ${s.branches.covered}/${s.branches.total} |`;
const head = '| File | Lines % | Branches % | Lines | Branches |\n|---|---:|---:|---:|---:|';
const weakest = files.filter((x) => x.s.branches.total >= 20).sort((a, b) => a.s.branches.pct - b.s.branches.pct).slice(0, 10);
console.log([
  `## Coverage of \`cd mcp && npm test\` (not a gate)`, '',
  head, row('**total**', data.total), '',
  '### The 10 lowest branch coverage (files with 20 branches or more)', '',
  head, ...weakest.map((x) => row(x.f, x.s)), '',
  '### Every file', '',
  head, ...files.map((x) => row(x.f, x.s)),
].join('\n'));
