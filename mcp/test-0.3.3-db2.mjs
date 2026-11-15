import './test-env.mjs';
// 0.3.3 DB2 (mcp/work/DB2.md, A-DB1-2, the owner's D-1110-05): a plan with the model and no report name is not given a plan
// id: planProblems asks for the name (create_report refuses a report without one, so the person could approve a plan that
// cannot be written). A plan with a name keeps its id and writes as before. Through the MCP tools (the server's registered
// schema), on fn1j's made-up tiny model. Made-up names only.
//   node test-0.3.3-db2.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'message threw'; } problems.push(m + err); } };

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-db2-')));
process.env.DATAARCUS_ROOT = ROOT;
const { writeModels } = await import('./fixtures/fn1j-cases.mjs');
await writeModels(ROOT, HERE);
const { serverClient } = await import('./test-0.2.9.mjs');
const s = await serverClient(ROOT, { DATAARCUS_APPROVAL_WAIT_MS: '20000' });
const files = (d) => { const out = []; const walk = (x) => { if (!fs.existsSync(x)) return; fs.readdirSync(x, { withFileTypes: true }).forEach((e) => { const f = path.join(x, e.name); if (e.isDirectory()) walk(f); else out.push(path.relative(ROOT, f)); }); }; walk(d); return out; };
try {
  // no name: no plan id, one planProblem asking for the name, in English and in an Arabic plan
  for (const lang of ['en', 'ar']) {
    const p = await s.call('plan_layout', { path: 'tiny', layout: 'exec', lang });
    const pp = p.j && p.j.planProblems;
    chk(() => !p.err && p.j && !(p.j.plan && p.j.plan.planId), () => `${lang}: a plan with no report name has no plan id: ${p.t.slice(0, 200)}`);
    chk(() => Array.isArray(pp) && pp.length === 1 && /report a name|name for the report|report's name/i.test(pp[0]) && /\bname\b/.test(pp[0]) && pp[0].length < 250, () => `${lang}: planProblems asks for the report name in one sentence: ${JSON.stringify(pp)}`);
    chk(() => p.j && p.j.exactCheck && p.j.exactCheck.status === 'notBuilt', () => `${lang}: nothing is built: ${JSON.stringify(p.j && p.j.exactCheck).slice(0, 200)}`);
  }
  // a name given: the plan keeps its id, is approved and writes as before
  const before = files(ROOT);
  const q = await s.call('plan_layout', { path: 'tiny', layout: 'exec', name: 'DB2 Named' });
  const id = q.j && q.j.plan && q.j.plan.planId;
  chk(() => !q.err && /^plan-/.test(id || '') && !(q.j.planProblems || []).length && q.j.exactCheck.status === 'pass', () => `with a name: plan id, no planProblems, exact check pass: ${q.t.slice(0, 250)}`);
  const ap = await s.call('approve_plan', { planId: id });
  chk(() => !ap.err && ap.j.status === 'approved', () => `with a name: approved: ${ap.t.slice(0, 200)}`);
  const c = await s.call('create_report', { path: 'tiny', planId: id });
  const added = files(ROOT).filter((f) => !before.includes(f));
  chk(() => !c.err && added.some((f) => /DB2 Named\.Report[\\/]definition[\\/]report\.json$/.test(f)) && added.some((f) => /DB2 Named\.pbip$/.test(f)), () => `with a name: create_report writes the report: ${c.t.slice(0, 200)} ${JSON.stringify(added.slice(0, 5))}`);
  // the sample project (no model path) is not a plan that needs a name here
  const sm = await s.call('plan_layout', { sample: true, lang: 'en' });
  chk(() => !sm.err && !JSON.stringify(sm.j.planProblems || []).includes('report a name'), () => `the sample plan does not ask for a name: ${sm.t.slice(0, 200)}`);
} finally { await s.close(); }
fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.3-db2.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  db2  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  db2  ${checks} checks`);
