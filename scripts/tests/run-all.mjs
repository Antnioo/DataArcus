// Runs the site's tests and prints PASS or FAIL for each.
//   npm test                    all tests, 3 at a time (one browser, a separate window per test)
//   npm test -- anchors consent only these
//   npm test -- --jobs 1        one at a time (slower; use it to rule out a machine that is too busy)
//   npm test -- --full          also the long layout stress test on every page size
// Exit code 1 when anything fails, so it can gate a deploy.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, serve, launch } from './lib.mjs';

const ALL = ['site', 'anchors', 'tools', 'spacing', 'consent', 'lang-switcher', 'theme-generator', 'layout', 'svg-kpi'];
const args = process.argv.slice(2), full = args.includes('--full');
const ji = args.indexOf('--jobs'), jobs = Math.max(1, ji >= 0 ? +args[ji + 1] || 1 : 3);
const pick = args.filter((a, i) => !a.startsWith('--') && !(ji >= 0 && i === ji + 1));
// the slowest tests start first, so the whole run ends as early as possible
const SLOW = ['anchors', 'site', 'theme-generator', 'spacing', 'tools', 'lang-switcher', 'layout', 'consent', 'svg-kpi'];
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
      res = await (await import(`./${name}.mjs`)).default({ browser, url: server.url, full });
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
console.log(failed ? `\n${failed} of ${run.length} failed (${total}s, ${jobs} at a time)` : `\nAll ${run.length} passed (${total}s, ${jobs} at a time)`);
process.exit(failed ? 1 : 0);
