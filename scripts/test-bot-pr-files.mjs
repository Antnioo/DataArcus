// Tests for scripts/bot-pr-files.mjs and for the two bot workflows that call it (BA1 and BA2, 0.3.3, D-1109-10, D-1116-06).
//   node scripts/test-bot-pr-files.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const script = path.join(here, 'bot-pr-files.mjs');
const { classify, decide, ALLOWED, GENERATED, PRICE_FILE, SITEMAP, sitemapOnlyLastmod, guardPrices, generate } = await import(new URL('./bot-pr-files.mjs', import.meta.url));

let checks = 0, fails = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL ' + msg); } };
const eq = (got, want, msg) => ok(JSON.stringify(got) === JSON.stringify(want), `${msg}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const P = 'assets/data/powerbi-prices.json', PL = 'assets/data/pl300-outline.json', DP = 'assets/data/dp600-outline.json';
const PAGE = 'tools/power-bi-licensing-cost-calculator.html';
const SEVEN = [
  'tools/power-bi-licensing-cost-calculator.html', 'ar/tools/power-bi-licensing-cost-calculator.html',
  'assets/js/licensing-calculator.js', 'assets/js/licensing-calculator.min.js',
  'assets/js/translations/licensing-calculator.js', 'assets/js/translations/licensing-calculator.min.js', 'sitemap.xml'];
eq(ALLOWED.outlines, [PL, DP], 'the exam bot: exactly its 2 outline files');
eq(ALLOWED.prices, [P, ...SEVEN], 'the price bot: the price file and exactly the 7 generated files');
eq(Object.keys(ALLOWED), ['prices', 'outlines'], 'two bots, no other list');

// per bot, no guard (the list only)
eq(classify([P], 'prices'), { verdict: 'auto' }, 'prices only');
eq(classify([P, ...SEVEN], 'prices'), { verdict: 'auto' }, 'the price file and the 7');
eq(classify([PL, DP], 'outlines'), { verdict: 'auto' }, 'both outlines');
eq(classify([DP], 'outlines'), { verdict: 'auto' }, 'one outline');
for (const f of SEVEN) eq(classify([P, f], 'outlines'), { verdict: 'owner', path: P }, `the exam bot refuses the price bot's ${f}`);
eq(classify([PL], 'prices'), { verdict: 'owner', path: PL }, 'the price bot refuses an outline file');
eq(classify([P, DP], 'prices'), { verdict: 'owner', path: DP }, 'the price bot refuses an outline file next to its own');
eq(classify([PL, P], 'outlines'), { verdict: 'owner', path: P }, 'the exam bot refuses the price file');
eq(classify([P, 'scripts/update-powerbi-prices.mjs'], 'prices'), { verdict: 'owner', path: 'scripts/update-powerbi-prices.mjs' }, 'a script');
eq(classify([P, 'tools/index.html'], 'prices'), { verdict: 'owner', path: 'tools/index.html' }, 'another page');
eq(classify([P, 'assets/js/theme-generator.js'], 'prices'), { verdict: 'owner', path: 'assets/js/theme-generator.js' }, 'another script');
eq(classify([P, 'assets/js/licensing-calculator.min.js.map'], 'prices'), { verdict: 'owner', path: 'assets/js/licensing-calculator.min.js.map' }, 'a map next to the min');
eq(classify([], 'prices'), { verdict: 'owner', path: '' }, 'empty');
eq(classify(undefined, 'outlines'), { verdict: 'owner', path: '' }, 'no list');
eq(classify([P], undefined), { verdict: 'owner', path: '' }, 'no bot name');
eq(classify([P], 'other'), { verdict: 'owner', path: '' }, 'an unknown bot');
eq(classify([P], '__proto__'), { verdict: 'owner', path: '' }, 'a bot name that is an object key');
eq(classify([P], 'constructor'), { verdict: 'owner', path: '' }, 'constructor as a bot name');
const lookalikes = (f) => [f + '.bak', '../' + f, './' + f, f.replace(/\//g, '\\'), f.replace(/[a-z]/, (c) => c.toUpperCase()), f.toUpperCase(), ' ' + f, f + ' ', f + '\r', f.replace('/', '/../' + f.split('/')[0] + '/'), '/' + f, '', f + '/', 'x/' + f].filter((x) => x !== f);   // a name with no slash has no slash variant
for (const f of ALLOWED.prices) for (const bad of lookalikes(f)) eq(classify([P, bad], 'prices'), { verdict: 'owner', path: bad }, `price bot lookalike ${JSON.stringify(bad)}`);
for (const f of ALLOWED.outlines) for (const bad of lookalikes(f)) eq(classify([PL, bad], 'outlines'), { verdict: 'owner', path: bad }, `exam bot lookalike ${JSON.stringify(bad)}`);
eq(classify([P, 5], 'prices'), { verdict: 'owner', path: '5' }, 'a non-string entry');

// the sitemap rule: only <lastmod> lines
const SM = (a, b, extra = '') => `<urlset>\n  <url>\n    <loc>https://dataarcus.com/x.html</loc>\n    <lastmod>${a}</lastmod>\n    <priority>0.9</priority>${extra}\n  </url>\n  <url>\n    <loc>https://dataarcus.com/y.html</loc>\n    <lastmod>${b}</lastmod>\n  </url>\n</urlset>\n`;
ok(sitemapOnlyLastmod(SM('2026-11-15', '2026-11-15'), SM('2026-11-16', '2026-11-16')), 'sitemap: two new dates pass');
ok(sitemapOnlyLastmod(SM('2026-11-15', '2026-11-15'), SM('2026-11-15', '2026-11-15')), 'sitemap: no change passes');
ok(!sitemapOnlyLastmod(SM('2026-11-15', '2026-11-15'), SM('2026-11-16', '2026-11-16', '\n    <changefreq>weekly</changefreq>')), 'sitemap: an added line fails');
ok(!sitemapOnlyLastmod(SM('2026-11-15', '2026-11-15'), SM('2026-11-15', '2026-11-15').replace('x.html', 'z.html')), 'sitemap: a changed address fails');
ok(!sitemapOnlyLastmod(SM('2026-11-15', '2026-11-15'), SM('2026-11-15', '2026-11-15').replace('0.9', '1.0')), 'sitemap: a changed priority fails');
ok(!sitemapOnlyLastmod(SM('2026-11-15', '2026-11-15'), SM('soon', '2026-11-16')), 'sitemap: a lastmod that is not a date fails');
ok(!sitemapOnlyLastmod(SM('2026-11-15', '2026-11-15'), SM('2026-11-16', '2026-11-16') + '<!-- x -->'), 'sitemap: an added comment fails');
ok(!sitemapOnlyLastmod(SM('2026-11-15', '2026-11-15'), SM('2026-11-16', '2026-11-16').replace('<lastmod>2026-11-16</lastmod>', '<lastmod>2026-11-16</lastmod><lastmod>2026-11-16</lastmod>')), 'sitemap: a second lastmod line fails');
ok(!sitemapOnlyLastmod(null, SM('2026-11-15', '2026-11-15')), 'sitemap: a missing base fails');

// the content guard, on the real tree: a made-up price PR (a new "checked" date) in a temp clone of this checkout
const sh = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bot-pr-test-'));
const clone = path.join(tmp, 'repo');
try {
  const head0 = sh(root, ['rev-parse', 'HEAD']).stdout.trim();
  ok(sh(root, ['clone', '-q', '--no-hardlinks', root, clone]).status === 0, 'guard setup: a clone of this checkout');
  sh(clone, ['checkout', '-q', '--detach', head0]);
  // the tree under test is the working tree (uncommitted edits to the scripts count): copy the two scripts over
  for (const f of ['scripts/bot-pr-files.mjs']) fs.copyFileSync(path.join(root, f), path.join(clone, f));
  if (fs.existsSync(path.join(root, 'node_modules'))) fs.symlinkSync(path.join(root, 'node_modules'), path.join(clone, 'node_modules'), 'junction');
  const id = ['-c', 'user.name=t', '-c', 'user.email=t@example.com'];
  sh(clone, [...id, 'commit', '-q', '--allow-empty', '-m', 'base']);
  sh(clone, ['branch', 'base']);
  const wr = (f, t) => fs.writeFileSync(path.join(clone, f), t);
  const rd = (f) => fs.readFileSync(path.join(clone, f), 'utf8');
  const names = () => sh(clone, ['diff', '--name-only', 'base...HEAD']).stdout.split('\n').filter(Boolean);
  const guard = () => { const p = names(); return decide(p, 'prices', { guard: { root: clone, base: 'base', head: 'HEAD' } }); };
  // the bot's PR: the price file with a new date, the generated files, the sitemap's dates
  const price = JSON.parse(rd(P));
  const newDay = price.checked === '2026-12-01' ? '2026-12-02' : '2026-12-01';
  wr(P, JSON.stringify({ ...price, checked: newDay }, null, 2) + '\n');
  generate(clone, newDay);
  const sm = rd(SITEMAP);
  wr(SITEMAP, sm.replace(/(power-bi-licensing-cost-calculator\.html<\/loc>\s*<lastmod>)[^<]*/g, `$1${newDay}`));
  sh(clone, ['add', P, ...GENERATED, SITEMAP]);
  sh(clone, [...id, 'commit', '-q', '-m', 'bot']);
  const got = names();
  ok(got.includes(P) && GENERATED.every((f) => got.includes(f)) && got.includes(SITEMAP), `guard setup: the made-up PR touches the price file, the generated files and the sitemap (${got.length} files)`);
  eq(guard(), { verdict: 'auto' }, 'guard: a PR that is exactly what the generator writes answers auto');
  // the same PR as the old rule saw it
  eq(classify(names(), 'prices'), { verdict: 'auto' }, 'guard: the list alone accepts the same PR');
  // one extra word in a generated page
  const base = rd(PAGE);
  const withWord = (f, edit) => { const keep = rd(f); wr(f, edit(keep)); sh(clone, ['add', f]); sh(clone, [...id, 'commit', '-q', '-m', 'hand edit']); const r = guard(); sh(clone, ['reset', '-q', '--hard', 'HEAD~1']); return r; };
  eq(withWord(PAGE, (t) => t.replace('</body>', 'extra </body>')), { verdict: 'owner', path: PAGE }, 'guard: a generated page with one extra word answers owner');
  eq(withWord('ar/' + PAGE, (t) => t.replace('</body>', 'x </body>')), { verdict: 'owner', path: 'ar/' + PAGE }, 'guard: the Arabic copy with one extra word answers owner');
  eq(withWord('assets/js/licensing-calculator.js', (t) => t + '\n// one more line\n'), { verdict: 'owner', path: 'assets/js/licensing-calculator.js' }, 'guard: the loader with one extra line answers owner');
  eq(withWord('assets/js/licensing-calculator.min.js', (t) => t + ';'), { verdict: 'owner', path: 'assets/js/licensing-calculator.min.js' }, 'guard: a hand-edited .min.js answers owner');
  eq(withWord('assets/js/translations/licensing-calculator.js', (t) => t + '\n//x\n'), { verdict: 'owner', path: 'assets/js/translations/licensing-calculator.js' }, 'guard: the translations with one extra line answers owner');
  eq(withWord(SITEMAP, (t) => t.replace('<priority>', '<priority> ')), { verdict: 'owner', path: SITEMAP }, 'guard: a sitemap change outside lastmod answers owner');
  // a date in the page that does not follow the price file
  eq(withWord(PAGE, (t) => t.replace(/(data-p="checked">)[^<]*/, '$1 1 January 2020')), { verdict: 'owner', path: PAGE }, 'guard: a date in the page that does not follow the price file answers owner');
  // a PR that changes only the price file: nothing to regenerate, the old behaviour
  sh(clone, ['reset', '-q', '--hard', 'base']);
  wr(P, JSON.stringify({ ...price, checked: newDay }, null, 2) + '\n');
  sh(clone, ['add', P]); sh(clone, [...id, 'commit', '-q', '-m', 'bot prices only']);
  // the generated files were NOT rewritten, so the regenerated ones differ from base only when the date changed: that is a file the PR did not touch
  // nothing rode along (no generated file is in the PR), so the list answers; the stale pages fail the required checks, which --auto waits for
  eq(decide(names(), 'prices', { guard: { root: clone, base: 'base', head: 'HEAD' } }), { verdict: 'auto' }, 'guard: the price file alone with a new date (no generated file in the PR) answers auto, as before');
  // one generated file regenerated, another left stale in the same PR: the untouched one differs from what the generator writes
  generate(clone, newDay);
  sh(clone, ['add', PAGE]); sh(clone, [...id, 'commit', '-q', '-m', 'bot, only the page']);
  eq(guard(), { verdict: 'owner', path: GENERATED[1] }, 'guard: one generated file in the PR and its sibling left stale answers owner');
  // the price file with only a number changed: the pages already match
  sh(clone, ['reset', '-q', '--hard', 'base']);
  sh(clone, ['checkout', '-q', 'base', '--', '.']);
  wr(P, JSON.stringify({ ...price, cuPayg: (price.cuPayg || 0) + 0.01 }, null, 2) + '\n');
  sh(clone, ['add', P]); sh(clone, [...id, 'commit', '-q', '-m', 'bot number only']);
  eq(guard(), { verdict: 'auto' }, 'guard: a price number alone (no generated file touched) answers auto');
  // a PR that tries a script change with the generated files: refused by the list before any regeneration
  eq(decide([P, 'scripts/check-min.mjs'], 'prices', { guard: { root: clone, base: 'base', head: 'HEAD' } }), { verdict: 'owner', path: 'scripts/check-min.mjs' }, 'guard: a script next to the price file answers owner');
  // a regeneration that cannot run never answers auto
  const broken = guardPrices({ root: clone, base: 'no-such-ref', head: 'HEAD', paths: [P, PAGE] });
  ok(broken.ok === false, 'guard: an unreadable base answers owner, never auto');
  const noHead = guardPrices({ root: clone, base: 'base', head: 'no-such-ref', paths: [P, PAGE] });
  ok(noHead.ok === false, 'guard: an unreadable head answers owner, never auto');
  ok(!sh(clone, ['worktree', 'list']).stdout.includes('bot-guard-'), 'guard: the temporary tree is removed');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

// the command line: paths from stdin, one per line; the bot's name first
const cli = (input, ...args) => spawnSync(process.execPath, [script, ...args], { input, encoding: 'utf8' });
let r = cli(`${PL}\n${DP}\n`, 'outlines');
eq([r.status, r.stdout.trim()], [0, 'auto'], 'cli: two outline files');
r = cli(`${P}\n${DP}\n`, 'outlines');
eq([r.status, r.stdout.trim()], [0, `owner ${P}`], 'cli: the exam bot with the price file');
r = cli(`${P}\n${DP}\n`, 'prices');
eq([r.status, r.stdout.trim()], [0, `owner ${DP}`], 'cli: the price bot with an outline file');
r = cli(`${P}\nscripts/x.mjs\n`, 'prices');
eq([r.status, r.stdout.trim()], [0, 'owner scripts/x.mjs'], 'cli: a script');
r = cli('', 'prices');
eq([r.status, r.stdout.trim()], [0, 'owner'], 'cli: empty input');
r = cli(`${P}\n`);
eq([r.status, r.stdout.trim()], [2, ''], 'cli: no bot name is a usage error, not an answer');
r = cli(`${P}\n`, 'everything');
eq([r.status, r.stdout.trim()], [2, ''], 'cli: an unknown bot name is a usage error');
r = cli(`${P}\n`, 'prices');
eq([r.status, r.stdout.trim()], [0, 'auto'], 'cli: the price file alone, guard on, nothing to regenerate');

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
  ok(/D-1116-06/.test(y) && !/Merges itself[^"]*D-1109-10/.test(y), `${f}: the PR body names the decision (D-1116-06)`);
  const bot = f.startsWith('update-powerbi') ? 'prices' : 'outlines';
  ok(y.includes(`node scripts/bot-pr-files.mjs ${bot}`), `${f}: the check is called with its bot name (${bot})`);
  ok(!y.includes(`node scripts/bot-pr-files.mjs ${bot === 'prices' ? 'outlines' : 'prices'}`), `${f}: the check is not called with the other bot's name`);
  ok(f.startsWith('update-powerbi') ? /bot-pr-files\.mjs prices --base origin\/main --head HEAD\)/.test(y) : true, `${f}: the price check names its base and head`);
  ok(!/bot-pr-files\.mjs\s*\)/.test(y) && !/bot-pr-files\.mjs\s*$/m.test(y.replace(/#.*$/gm, '')), `${f}: no call without a bot name`);
  ok(y.includes('gh workflow run tests.yml') && y.includes('gh workflow run privacy.yml'), `${f}: the tests.yml and privacy.yml dispatch is kept`);
  ok(/permissions:\n  contents: write\n/.test(y), `${f}: permissions untouched`);
}
const tests = fs.readFileSync(path.join(root, '.github/workflows/tests.yml'), 'utf8');
ok(tests.includes('scripts/test-bot-pr-files.mjs'), 'tests.yml runs this suite');

console.log(`${fails ? 'FAIL' : 'PASS'}  bot-pr-files  ${checks} checks`);
process.exit(fails ? 1 : 0);
