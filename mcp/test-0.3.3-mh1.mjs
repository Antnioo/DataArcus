import './test-env.mjs';
// 0.3.3 MH1 (L-1108-25; mcp/work/MH1.md; written red first): the shared client the suites import (serverClient) gives every
// call a timeout and starts a fresh server after a call threw, so one hostile input no longer makes every later call of a
// suite time out. Made-up input only; no model is read (the plan id asked for never existed).
//   K  the server is killed between two calls: the next call answers (a fresh server), `c` is the live client
//   H  the server hangs (stopped; not on Windows, which has no SIGSTOP): the call ends within its timeout, the next answers
//   T  the timeout is an option (a longer one is kept), and the returned object keeps its shape
//   node test-0.3.3-mh1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mh1-')));
const ASK = { planId: 'plan-000000000000' };   // never existed: the server answers with an error at once
const answered = (x) => x && x.err && /no plan "plan-000000000000"/.test(x.t);
const timed = async (p) => { const t0 = Date.now(); const x = await p; return { x, ms: Date.now() - t0 }; };
const pidOf = (c) => c.transport && c.transport.pid;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const live = [];
try {
  // K. the server is killed
  {
    const s = await serverClient(ROOT, {}); live.push(s);
    chk(() => ['c', 'call', 'close'].every((k) => k in s) && typeof s.call === 'function' && typeof s.close === 'function', () => 'T1. the returned object keeps { c, call, close }: ' + Object.keys(s));
    const first = await s.call('approve_plan', ASK);
    chk(() => answered(first), () => 'K0. a normal call answers: ' + first.t.slice(0, 200));
    const c0 = s.c, pid0 = pidOf(c0);
    chk(() => Number.isInteger(pid0), () => 'K1. the server child has a pid: ' + pid0);
    process.kill(pid0, 'SIGKILL');
    await sleep(300);
    const { x: dead, ms } = await timed(s.call('approve_plan', ASK));   // may be the call that finds the transport closed
    const { x: next, ms: ms2 } = await timed(s.call('approve_plan', ASK));
    chk(() => answered(next) && ms2 < 10000, () => `K2. the call after a killed server must answer (a fresh server): ${next.t.slice(0, 200)} (${ms2} ms; the call before said ${dead.t.slice(0, 100)}, ${ms} ms)`);
    chk(() => answered(dead) || dead.err, () => 'K3. the call that meets the dead server answers or says it failed, never hangs: ' + dead.t.slice(0, 100));
    chk(() => s.c !== c0 && pidOf(s.c) !== pid0, () => 'K4. c points to the live client after the restart');
    const r = await s.c.listTools();
    chk(() => r.tools.length === 11, () => 'K5. the live client lists the 11 tools: ' + r.tools.length);
  }
  // H. the server hangs
  if (process.platform !== 'win32') {
    const s = await serverClient(ROOT, {}, { timeoutMs: 2000 }); live.push(s);
    const ok = await s.call('approve_plan', ASK);
    chk(() => answered(ok), () => 'H0. a normal call answers: ' + ok.t.slice(0, 200));
    const pid0 = pidOf(s.c);
    process.kill(pid0, 'SIGSTOP');
    const { x: hung, ms } = await timed(s.call('approve_plan', ASK));
    chk(() => hung.err && ms < 8000, () => `H1. a call to a hung server ends within its timeout: ${ms} ms ${hung.t.slice(0, 120)}`);
    const { x: next, ms: ms2 } = await timed(s.call('approve_plan', ASK));
    chk(() => answered(next) && ms2 < 8000, () => `H2. the next call answers within the timeout: ${next.t.slice(0, 200)} (${ms2} ms)`);
    try { process.kill(pid0, 'SIGKILL'); } catch (e) { /* already gone */ }
  }
  // T. options
  {
    const s = await serverClient(ROOT, {}, { timeoutMs: 45000 }); live.push(s);
    const x = await s.call('approve_plan', ASK);
    chk(() => answered(x), () => 'T2. a client with a longer timeout answers: ' + x.t.slice(0, 200));
  }
} catch (e) { problems.push('the suite threw: ' + String(e && e.stack || e).slice(0, 400)); }
for (const s of live) { try { await Promise.race([s.close(), sleep(3000)]); } catch (e) { /* closed */ } }
console.log(problems.length ? `FAIL  mh1  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  mh1  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
