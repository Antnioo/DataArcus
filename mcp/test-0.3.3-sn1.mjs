import './test-env.mjs';
// 0.3.3 SN1 item 4 (TL1 "Seen, not in scope"; mcp/work/SN1.md): the text of report-inputs.mjs and plan_layout's planFields
// is true. create_report takes path and planId only (TK1); the inputs of a plan are plan_layout's.
//   T  report-inputs.mjs defines no input a tool does not list; the "ignored keys" answer sends fields to planFields;
//      planFields does not say "create_report's fields shape"; create_report still says "the approved plan holds it"
//      for each key plan_layout takes; tools/list did not grow (58,837 at 2960587c)
//   node test-0.3.3-sn1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { CREATE_REPORT_INPUTS, REPORT_LOOK, unknownKeys, heldSaid } from './lib/report-inputs.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sn1-')));
process.env.DATAARCUS_ROOT = ROOT;
const s = await serverClient(ROOT, {});
try {
  const tools = (await s.c.listTools()).tools, pl = tools.find((t) => t.name === 'plan_layout'), cr = tools.find((t) => t.name === 'create_report');
  const planKeys = Object.keys(pl.inputSchema.properties), size = JSON.stringify({ tools }).length;
  // T1: every input report-inputs.mjs defines is one a tool lists (create_report: path, planId; plan_layout: the rest)
  const listed = new Set([...planKeys, ...Object.keys(cr.inputSchema.properties)]);
  const src = fs.readFileSync(path.join(HERE, 'tools/plan_layout.mjs'), 'utf8');
  const used = new Set(REPORT_LOOK); for (const m of src.matchAll(/CREATE_REPORT_INPUTS\.(\w+)/g)) used.add(m[1]);
  const dead = Object.keys(CREATE_REPORT_INPUTS).filter((k) => !used.has(k));
  chk(() => dead.length === 0, () => `T1. inputs defined in report-inputs.mjs that no tool takes from there: ${dead.join(', ')}`);
  chk(() => Object.keys(CREATE_REPORT_INPUTS).every((k) => listed.has(k)), () => 'T2. an input defined there is listed by no tool');
  // T4: planFields' own text
  const pf = pl.inputSchema.properties.planFields.description || '';
  chk(() => !/create_report's fields/.test(pf) && /Table\[Field\]/.test(pf), () => `T4. planFields: ${pf}`);
  // T5: create_report names every plan_layout key as held by the plan (never a bare "Unrecognized key")
  const gone = ['design', 'layout', 'kpis', 'focus', 'tables', 'filters', 'header', 'page', 'dir', 'lang', 'fields', 'displayNames', 'pages', 'text', 'name'];
  for (const k of gone) chk(() => /the approved plan holds/.test(heldSaid([k])) && heldSaid([k]).includes(k), () => `T5. ${k}: ${heldSaid([k])}`);
  // T6: the list did not grow
  chk(() => size <= 58837, () => `T6. tools/list is ${size} characters, 58,837 at 2960587c`);
  chk(() => size < 61000, () => `T7. tools/list under tk1's cap of 61,000: ${size}`);
  console.log(`tools/list ${size} characters`);
} finally { await s.c.close().catch(() => {}); fs.rmSync(ROOT, { recursive: true, force: true }); }
if (problems.length) { console.log(`FAIL  sn1  ${checks} checks, ${problems.length} failed`); for (const p of problems) console.log('  - ' + p); process.exit(1); }
console.log(`PASS  sn1  ${checks} checks`);
process.exit(0);
