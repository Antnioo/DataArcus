// (TR1, B-439) scripts/tests/lib.mjs settle(): the wait the website suites use before reading a position after a click.
// On 10 Nov theme-generator-lab failed 3 times in CI with "steps bar did not open and land on Layout {top:715,bars:551}":
// the numbers of the page still at 0. The smooth scroll had not begun within settle's 4 readings on a busy runner, so the
// test read the position too early. settle(pg, { from }) does not count readings at `from` until the page has left it.
// A made-up page (no browser): its scrollY follows a script of readings, 80 ms apart as settle reads them.
//   node scripts/test-settle.mjs
import { settle } from './tests/lib.mjs';

let checks = 0; const problems = [];
const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
// readings: the scrollY of each successive read (the last one repeats); busy: reads during which a scroll is under way
const page = (readings, busy = () => false) => { let i = 0; return { reads: () => i,
  evaluate: async () => { const k = Math.min(i, readings.length - 1); i++; return [readings[k], busy(k)]; }, waitForTimeout: async () => {} }; };

// 1. the 10 Nov shape: the page sits at 0 for 8 readings (640 ms on a busy runner), then scrolls to 590 and stays
const late = [0, 0, 0, 0, 0, 0, 0, 0, 65, 380, 505, 559, 578, 590];
check(await settle(page(late), { from: 0 }) === 590, 'a scroll that starts late: settle returned before the page left its start (B-439)');
// 2. without `from` the old reading stands (callers that expect no scroll are unchanged): still for 4 readings is settled
check(await settle(page(late)) === 0, 'without `from`, 4 equal readings no longer settle');
// 3. a scroll that starts at once settles at its end, with or without `from`
const prompt = [0, 65, 380, 505, 590];
check(await settle(page(prompt), { from: 0 }) === 590 && await settle(page(prompt)) === 590, 'a prompt scroll did not settle at its end');
// 4. a stall mid-way while the browser says a scroll is under way does not count (unchanged behaviour)
const stall = [0, 200, 200, 200, 200, 200, 200, 590];
check(await settle(page(stall, (k) => k < 7), { from: 0 }) === 590, 'a mid-scroll stall was read as settled');
// 5. a page that never leaves `from` ends at the limit and returns the position: the caller's own check then fails
const t0 = Date.now(), never = page([0]);
check(await settle(never, { from: 0, wait: 150 }) === 0 && Date.now() - t0 >= 150 && Date.now() - t0 < 3000, 'a page that never scrolls did not end at the limit');
// 6. a scroll back to where it began (leaves, returns) settles there
check(await settle(page([0, 120, 60, 0, 0, 0, 0, 0]), { from: 0 }) === 0, 'a scroll that returns to its start did not settle');

if (problems.length) { console.log(`FAIL  settle  ${problems.length} of ${checks} checks`); problems.forEach((p) => console.log('  - ' + p)); process.exit(1); }
console.log(`PASS  settle  ${checks} checks`);
