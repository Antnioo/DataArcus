import './test-env.mjs';
// 0.3.2 RV1 (B-392; Codex release-review-032 finding c; mcp/work/RV1.md; written red first): a tool call whose INPUT fails the
// schema is answered by the SDK before any handler runs, so safe()'s cap never ran. Every validation error is now short and
// capped, at the protocol boundary, for all 11 tools. Made-up input only; no model is read (the input is refused first).
//   O  oversized invalid input, per tool: an invalid enum array, a wrong type repeated, a huge wrong string, 5,000 unknown keys
//   S  the shape: what was wrong, the first few items, "N more", how to retry; an error; not cut
//   V  a valid call is not touched (the pinned suites prove every byte; here one cheap call)
//   node test-0.3.2-rv1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';
import { ANSWER_MAX } from './lib/answer.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-rv1-')));
let s = await serverClient(ROOT, {});
const raw = async (name, args) => { const r = await s.c.callTool({ name, arguments: args }, undefined, { timeout: 10000 }); const t = r.content.map((c) => c.text || '').join(''); return { err: !!r.isError, t, truncated: /"truncated"/.test(t) }; };
const N = 3000;
try {
  const { tools } = await s.c.listTools();
  chk(() => tools.length === 11, () => 'T0. 11 tools listed: ' + tools.length);
  for (const tool of tools) {
    const props = (tool.inputSchema && tool.inputSchema.properties) || {};
    const cases = [];
    cases.push(['a huge unknown string', { zzUnknown: 'x'.repeat(200000) }]);
    cases.push(['5,000 unknown keys', Object.fromEntries(Array.from({ length: 5000 }, (_, i) => ['k' + i, 1]))]);
    for (const [k, p] of Object.entries(props)) {
      const arr = p.type === 'array' || (p.anyOf || []).some((a) => a.type === 'array');
      if (arr) {
        cases.push([`${k}: ${N} invalid strings`, { [k]: Array.from({ length: N }, (_, i) => 'bad_' + i + '_' + 'y'.repeat(30)) }]);
        cases.push([`${k}: ${N} wrong-type items`, { [k]: Array.from({ length: N }, (_, i) => ({ a: i, b: [i] })) }]);
      } else if (p.type === 'string' || p.enum) {
        cases.push([`${k}: a huge wrong string`, { [k]: 'q'.repeat(150000) }]);
        cases.push([`${k}: a wrong type`, { [k]: { deep: Array.from({ length: 2000 }, (_, i) => i) } }]);
      } else if (p.type === 'object') {
        cases.push([`${k}: a wrong type`, { [k]: Array.from({ length: N }, (_, i) => 'v' + i) }]);
      }
    }
    for (const [what, args] of cases) {
      const t0 = Date.now(); let r;
      try { r = await raw(tool.name, args); } catch (e) { r = { err: false, t: 'THREW ' + String(e.message).slice(0, 80) + ' after ' + (Date.now() - t0) + ' ms', truncated: false }; await s.close().catch(() => {}); s = await serverClient(ROOT, {}); }
      // a call that passes the schema reaches the handler, whose own cap holds; a validation error is never cut and is short
      chk(() => !/^THREW/.test(r.t) && r.t.length <= ANSWER_MAX && (!/Input validation/.test(r.t) || !r.truncated), () => `O ${tool.name}, ${what}: ${r.t.length} characters (cap ${ANSWER_MAX}), ${r.t.slice(0, 60)}`);
      chk(() => !/Input validation/.test(r.t) || r.t.length <= 4000, () => `S1 ${tool.name}, ${what}: a validation error is short (<= 4,000), got ${r.t.length}`);
    }
  }
  // the shape, on check_report's invalid enum items (Codex's measured case: 300 items, 46,772 characters)
  const bad = await raw('check_report', { path: 'x', checks: Array.from({ length: 40 }, (_, i) => 'invalid_check_' + i) });
  const c300 = await raw('check_report', { path: 'x', checks: Array.from({ length: 300 }, (_, i) => 'invalid_check_' + i) });
  chk(() => c300.err && c300.t.length <= 1500, () => 'S2b. Codex\'s 300 invalid items (was 46,772 characters): ' + c300.t.length);
  chk(() => bad.err && /check_report/.test(bad.t) && /checks/.test(bad.t), () => 'S2. names the tool and the input: ' + bad.t.slice(0, 300));
  chk(() => /invalid_check_0/.test(bad.t) && !/invalid_check_39/.test(bad.t), () => 'S3. the first items shown, not the last: ' + bad.t.slice(0, 400));
  chk(() => /\d+ more/.test(bad.t), () => 'S4. says how many more: ' + bad.t.slice(0, 500));
  chk(() => /call again/i.test(bad.t), () => 'S5. says how to retry: ' + bad.t.slice(0, 500));
  const one = await raw('check_report', { path: 'x', checks: ['nope'] });
  chk(() => one.err && /nope/.test(one.t) && !/more/.test(one.t), () => 'S6. a small error keeps its detail and has no "more": ' + one.t);
  const unk = await raw('read_model', { path: 'x', foo: 1 });
  chk(() => unk.err && /Unrecognized key 'foo'/.test(unk.t) && /the inputs of read_model are: /.test(unk.t), () => 'S7. an unknown key keeps TK1/MR1 words: ' + unk.t.slice(0, 300));
  const miss = await raw('read_model', {});
  chk(() => miss.err && /path/.test(miss.t), () => 'S8. a missing input is named: ' + miss.t.slice(0, 300));
  const nf = await raw('no_such_tool_' + 'z'.repeat(100000), {});
  chk(() => nf.err && nf.t.length <= ANSWER_MAX, () => 'S9. an unknown tool with a huge name: capped: ' + nf.t.length);
  const ok = await raw('read_model', { path: 'nothing-here' });
  chk(() => ok.err && !/Input validation/.test(ok.t), () => 'V1. a valid call reaches the handler: ' + ok.t.slice(0, 200));
} finally { await s.close().catch(() => {}); fs.rmSync(ROOT, { recursive: true, force: true }); }
console.log(problems.length ? `FAIL  rv1  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  rv1  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
