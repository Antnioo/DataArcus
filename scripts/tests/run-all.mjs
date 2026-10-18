// Runs the site's tests and prints PASS or FAIL for each.
//   npm test                    all tests, 3 at a time (one browser, a separate window per test)
//   npm test -- anchors consent only these
//   npm test -- --jobs 1        one at a time (slower; use it to rule out a machine that is too busy)
//   npm test -- --full          also the long layout stress test on every page size
//   npm test -- --slow 6        pages run 6 times slower, like a busy machine (to check the tests don't depend on speed)
//   npm test -- --shard 2/3     only the suites of SHARDS[1] (CI runs the shards as parallel jobs; B-145)
// Exit code 1 when anything fails, so it can gate a deploy.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, serve, launch } from './lib.mjs';

const ALL = ['site', 'anchors', 'tools', 'model-health', 'spacing', 'components', 'consent', 'lang-switcher', 'theme-generator', 'theme-generator-lab', 'pbip', 'dax', 'layout', 'layout-lab', 'svg-kpi', 'tmdl-model', 'design-engine', 'gulf-calendar', 'text-align'];
// the same test on the lab page, where the generator runs on the design engine (the live page keeps the old script for now)
const LAB = { 'theme-generator-lab': 'theme-generator', 'layout-lab': 'layout' };
// CI's parallel jobs (B-145, owner's go 18 Oct): every suite in exactly one shard, balanced by the seconds CI measured
// (18 Oct, 3 at a time): site 358 alone with the short ones; design-engine 253 and anchors 249 each with the middle ones
const SHARDS = [
  ['site', 'consent', 'lang-switcher', 'model-health', 'dax', 'layout', 'layout-lab', 'svg-kpi', 'tmdl-model'],
  ['design-engine', 'tools', 'components', 'spacing', 'gulf-calendar'],
  ['anchors', 'theme-generator', 'theme-generator-lab', 'pbip', 'text-align'],
];
{
  const listed = SHARDS.flat(), twice = listed.filter((n, i) => listed.indexOf(n) !== i), none = ALL.filter((n) => !listed.includes(n)), extra = listed.filter((n) => !ALL.includes(n));
  if (twice.length || none.length || extra.length) { console.error(`SHARDS must hold every test exactly once: in two shards ${twice.join(', ') || '-'}; in none ${none.join(', ') || '-'}; unknown ${extra.join(', ') || '-'}`); process.exit(2); }
}
const args = process.argv.slice(2), full = args.includes('--full');
const ji = args.indexOf('--jobs'), jobs = Math.max(1, ji >= 0 ? +args[ji + 1] || 1 : 3);
const si = args.indexOf('--slow');
if (si >= 0) process.env.DATAARCUS_TEST_SLOW = String(Math.max(1, +args[si + 1] || 4));
const hi = args.indexOf('--shard'), shard = hi >= 0 ? /^(\d+)\/(\d+)$/.exec(args[hi + 1] || '') : null;
if (hi >= 0 && (!shard || +shard[2] !== SHARDS.length || +shard[1] < 1 || +shard[1] > SHARDS.length)) { console.error(`--shard must be k/${SHARDS.length}, k from 1 to ${SHARDS.length}`); process.exit(2); }
const pick = args.filter((a, i) => !a.startsWith('--') && !(ji >= 0 && i === ji + 1) && !(si >= 0 && i === si + 1) && !(hi >= 0 && i === hi + 1));
if (shard && pick.length) { console.error('--shard runs its own suites: name no test with it'); process.exit(2); }
if (shard) pick.push(...SHARDS[+shard[1] - 1]);
// the slowest tests start first, so the whole run ends as early as possible
const SLOW = ['design-engine', 'anchors', 'site', 'theme-generator', 'theme-generator-lab', 'spacing', 'tools', 'model-health', 'lang-switcher', 'pbip', 'dax', 'layout', 'layout-lab', 'consent', 'svg-kpi', 'tmdl-model', 'gulf-calendar', 'text-align'];
const run = (pick.length ? pick : ALL).slice().sort((a, b) => SLOW.indexOf(a) - SLOW.indexOf(b));
const unknown = run.filter((n) => !ALL.includes(n));
if (unknown.length) { console.error(`Unknown test: ${unknown.join(', ')}. Tests: ${ALL.join(', ')}`); process.exit(2); }

const server = await serve();
const browser = await launch();
const t00 = Date.now();

async function one(name) {
  const t0 = Date.now();
  let res;
  try {
    if (name === 'svg-kpi') {
      // the KPI compiler test runs in Node, no browser
      const p = spawnSync(process.execPath, [path.join(ROOT, 'scripts/test-svg-kpi.mjs')], { encoding: 'utf8' });
      const line = (p.stdout.trim().split('\n').pop() || '');
      res = { checks: +(line.match(/\/(\d+)/) || [])[1] || 0, problems: p.status ? [line, ...p.stdout.split('\n').filter((l) => /FAIL/i.test(l)).slice(0, 10)] : [] };
    } else {
      res = await (await import(`./${LAB[name] || name}.mjs`)).default({ browser, url: server.url, full, ...(LAB[name] ? { page: '/tools/power-bi-theme-generator-lab.html' } : {}) });
    }
  } catch (e) {
    res = { checks: 0, problems: ['crashed: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' ')] };
  }
  res.secs = ((Date.now() - t0) / 1000).toFixed(0);
  return res;
}

// a small pool: `jobs` tests at a time, results printed in the usual order when all are done
const results = {}, queue = run.slice();
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) { const n = queue.shift(); results[n] = await one(n); } }));
let failed = 0;
for (const name of ALL.filter((n) => results[n])) {
  const res = results[name], ok = !res.problems.length;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(16)} ${String(res.checks).padStart(5)} checks  ${res.secs}s`);
  res.problems.slice(0, 12).forEach((p) => console.log('      - ' + p));
  if (res.problems.length > 12) console.log(`      ... and ${res.problems.length - 12} more`);
}
await browser.close(); server.close();
const total = ((Date.now() - t00) / 1000).toFixed(0);
const of = shard ? `, shard ${shard[1]}/${shard[2]}` : '';
console.log(failed ? `\n${failed} of ${run.length} failed (${total}s, ${jobs} at a time${of})` : `\nAll ${run.length} passed (${total}s, ${jobs} at a time${of})`);
process.exit(failed ? 1 : 0);
