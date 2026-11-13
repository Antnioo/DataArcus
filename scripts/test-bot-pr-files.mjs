// Tests for scripts/bot-pr-files.mjs and for the two bot workflows that call it (BA1, 0.3.3, D-1109-10).
//   node scripts/test-bot-pr-files.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const script = path.join(here, 'bot-pr-files.mjs');
const { classify, ALLOWED } = await import(new URL('./bot-pr-files.mjs', import.meta.url));

let checks = 0, fails = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL ' + msg); } };
const eq = (got, want, msg) => ok(JSON.stringify(got) === JSON.stringify(want), `${msg}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const P = 'assets/data/powerbi-prices.json', PL = 'assets/data/pl300-outline.json', DP = 'assets/data/dp600-outline.json';
eq(ALLOWED, [P, PL, DP], 'the allowed list is exactly the 3 data files');
eq(classify([P]), { verdict: 'auto' }, 'prices only');
eq(classify([PL, DP]), { verdict: 'auto' }, 'both outlines');
eq(classify([P, PL, DP]), { verdict: 'auto' }, 'all three');
eq(classify([P, 'tools/power-bi-licensing-cost-calculator.html']), { verdict: 'owner', path: 'tools/power-bi-licensing-cost-calculator.html' }, 'a page too');
eq(classify([P, 'sitemap.xml']), { verdict: 'owner', path: 'sitemap.xml' }, 'sitemap too');
eq(classify([P, 'assets/js/licensing-calculator.min.js']), { verdict: 'owner', path: 'assets/js/licensing-calculator.min.js' }, 'a script too');
eq(classify([]), { verdict: 'owner', path: '' }, 'empty');
eq(classify(undefined), { verdict: 'owner', path: '' }, 'no list');
for (const bad of [P + '.bak', '../' + P, './' + P, 'assets\\data\\powerbi-prices.json', 'assets/data/Powerbi-prices.json', P.toUpperCase(), ' ' + P, P + ' ', P + '\r', 'assets/data/../data/powerbi-prices.json', '/' + P, '']) {
  eq(classify([PL, bad]), { verdict: 'owner', path: bad }, `lookalike ${JSON.stringify(bad)}`);
}
eq(classify([PL, 5]), { verdict: 'owner', path: '5' }, 'a non-string entry');

// the command line: paths from stdin, one per line
const cli = (input) => spawnSync(process.execPath, [script], { input, encoding: 'utf8' });
let r = cli(`${P}\n${DP}\n`);
eq([r.status, r.stdout.trim()], [0, 'auto'], 'cli: two data files');
r = cli(`${P}\nsitemap.xml\n`);
eq([r.status, r.stdout.trim()], [0, 'owner sitemap.xml'], 'cli: sitemap');
r = cli('');
eq([r.status, r.stdout.trim()], [0, 'owner'], 'cli: empty input');

// the workflows
for (const f of ['update-powerbi-prices.yml', 'check-exam-outlines.yml']) {
  const y = fs.readFileSync(path.join(root, '.github/workflows', f), 'utf8').replace(/\r\n/g, '\n');
  const create = y.indexOf('gh pr create'), check = y.indexOf('scripts/bot-pr-files.mjs'), merge = y.indexOf('gh pr merge');
  ok(create > 0 && check > create, `${f}: the check runs after gh pr create`);
  ok(merge > check, `${f}: the merge line comes after the check`);
  ok(y.split('gh pr merge').length === 2, `${f}: exactly one merge line`);
  const line = y.split('\n').find((l) => l.includes('gh pr merge')) || '';
  ok(/gh pr merge --auto --squash "\$BRANCH"/.test(line), `${f}: the merge is --auto --squash`);
  ok(!/--admin|--rebase|--merge\b/.test(y), `${f}: no direct or admin merge`);
  // the merge line sits inside the branch that the check answered "auto"
  const before = y.slice(check, merge);
  ok(/"\$VERDICT" = "auto"|\[ "\$VERDICT" = auto \]/.test(before), `${f}: the merge is guarded by the verdict being auto`);
  ok(/then\s*\n\s*gh pr merge|\]; then\n\s+gh pr merge/.test(y), `${f}: the merge is the first line of the guarded branch`);
  // one list: no data file path is a second copy of the allowed list in the YAML's check step
  const stepText = y.slice(create);
  ok(!/pl300-outline\.json.*dp600-outline\.json.*powerbi-prices\.json|powerbi-prices\.json.*pl300-outline\.json/s.test(stepText.slice(stepText.indexOf('bot-pr-files'))), `${f}: no second copy of the allowed list after the check`);
  ok(/D-1109-10/.test(y), `${f}: the PR body names the decision`);
  ok(y.includes('gh workflow run tests.yml') && y.includes('gh workflow run privacy.yml'), `${f}: the tests.yml and privacy.yml dispatch is kept`);
  ok(/permissions:\n  contents: write\n/.test(y), `${f}: permissions untouched`);
}
const tests = fs.readFileSync(path.join(root, '.github/workflows/tests.yml'), 'utf8');
ok(tests.includes('scripts/test-bot-pr-files.mjs'), 'tests.yml runs this suite');

console.log(`${fails ? 'FAIL' : 'PASS'}  bot-pr-files  ${checks} checks`);
process.exit(fails ? 1 : 0);
