// A test tool (SN3 item 4): runs a suite under a shifted clock, to find a test that moves with the calendar.
//   SHIFT_CLOCK=tomorrow node --require ./scripts/clock-shift.cjs <suite>
//   SHIFT_CLOCK=newyear  ...  31 December 23:59:00 UTC of the coming year end (the clock keeps running, so the suite crosses midnight)
//   SHIFT_CLOCK=leap     ...  29 February 12:00:00 UTC of the next leap year
//   SHIFT_CLOCK=<an ISO time>  that moment
// Only the clock moves: new Date() and Date.now() answer real time plus a fixed offset; new Date(x), Date.UTC and
// Date.parse are untouched, performance.now and timers keep real time. Set through NODE_OPTIONS="--require <this>" it
// reaches the child processes a suite starts (the MCP server, a test runner's workers). Nothing is printed. The page's
// own clock (a browser) is not touched: a page suite reads node's clock only where node writes or checks a date.
'use strict';
const spec = process.env.SHIFT_CLOCK;
if (spec) {
  const RealDate = Date, real = RealDate.now(), y = new RealDate(real).getUTCFullYear();
  const target = spec === 'tomorrow' ? real + 86400000
    : spec === 'newyear' ? RealDate.UTC(y, 11, 31, 23, 59, 0)
    : spec === 'leap' ? (() => { let k = y; while (!(k % 4 === 0 && (k % 100 !== 0 || k % 400 === 0)) || RealDate.UTC(k, 1, 29, 12) < real) k++; return RealDate.UTC(k, 1, 29, 12); })()
    : RealDate.parse(spec);
  if (Number.isNaN(target)) throw new Error('SHIFT_CLOCK: "' + spec + '" is not tomorrow, newyear, leap or an ISO time');
  const offset = target - real;
  class ShiftedDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(RealDate.now() + offset); else super(...a); }
    static now() { return RealDate.now() + offset; }
  }
  globalThis.Date = ShiftedDate;
}
