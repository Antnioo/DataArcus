// Runs vscode/test/*.test.mjs and ends with one result line, `PASS  vscode  <N> checks` (or FAIL), as the repo's
// scripts/ci-sum.mjs counts them.
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'test');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => path.join(dir, f));
let pass = 0, fail = 0;
const stream = run({ files, concurrency: 1 });
stream.on('test:pass', (e) => { if (e.details.type !== 'suite') pass++; });
stream.on('test:fail', (e) => { if (e.details.type !== 'suite') fail++; });
const out = stream.compose(spec);
out.pipe(process.stdout, { end: false });
out.on('end', () => {
  console.log(fail ? `FAIL  vscode  ${fail} of ${pass + fail} checks failed` : `PASS  vscode  ${pass} checks`);
  process.exitCode = fail ? 1 : 0;
});
