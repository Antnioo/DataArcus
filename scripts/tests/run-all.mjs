// Runs the site's tests and prints PASS or FAIL for each.
//   npm test                    all tests
//   npm test -- anchors consent only these
//   npm test -- --full          also the long layout stress test on every page size
// Exit code 1 when anything fails, so it can gate a deploy.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, serve, launch } from './lib.mjs';

const ALL = ['site', 'anchors', 'tools', 'consent', 'theme-generator', 'layout', 'svg-kpi'];
const args = process.argv.slice(2), full = args.includes('--full');
const pick = args.filter((a) => !a.startsWith('--'));
const run = pick.length ? pick : ALL;
const unknown = run.filter((n) => !ALL.includes(n));
if (unknown.length) { console.error(`Unknown test: ${unknown.join(', ')}. Tests: ${ALL.join(', ')}`); process.exit(2); }

const server = await serve();
const browser = await launch();
let failed = 0;
for (const name of run) {
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
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  const ok = !res.problems.length;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(16)} ${String(res.checks).padStart(5)} checks  ${secs}s`);
  res.problems.slice(0, 12).forEach((p) => console.log('      - ' + p));
  if (res.problems.length > 12) console.log(`      ... and ${res.problems.length - 12} more`);
}
await browser.close(); server.close();
console.log(failed ? `\n${failed} of ${run.length} failed` : `\nAll ${run.length} passed`);
process.exit(failed ? 1 : 0);
