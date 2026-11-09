import './test-env.mjs';
// 0.3.1 MR1 (the MCP review with the mcp-builder skill, findings 1 and 2; the owner, D-1101-01; mcp/work/MR1.md;
// written red first on 7c54e918). Made-up models only (the twin-project fixture): no employer or client data.
//   S  B-270: an input a tool does not have (a misspelled option) is refused and named, never stripped silently: each
//      of the 11 tools, the tools' listing (additionalProperties false), and the option objects a person types by hand
//   P  B-271: a model path with a folder that does not exist lists the models in the working folder ("call again"),
//      as a bare wrong name does, never "an internal error"
//   node test-0.3.1-mr1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => String(x && x.t).slice(0, 400);
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mr1-')));
process.env.DATAARCUS_ROOT = ROOT;
fs.cpSync(path.join(HERE, 'fixtures', 'twin-project'), path.join(ROOT, 'twin-project'), { recursive: true });
const MODEL = 'twin-project', REPORT = 'twin-project/Twin Sales.pbip', TYPO = 'twin-project/Twin Sale.SemanticModel';
const s = await serverClient(ROOT, {});

// ---------- S: an unknown key is refused and named ----------
const unknown = [
  ['read_model', { path: MODEL, tabels: ['Sales'] }, 'tabels'],
  ['suggest_fields', { path: MODEL, kpi: 3 }, 'kpi'],
  ['check_model_health', { path: MODEL, maxitems: 5 }, 'maxitems'],
  ['generate_theme', { colour: '#ffffff' }, 'colour'],
  ['plan_layout', { path: MODEL, pagez: 2 }, 'pagez'],
  ['approve_plan', { planId: 'p-none', userReply: 'go' }, 'userReply'],   // a typed go: refused, approves nothing (userReply is no input since 14 Oct)
  ['create_report', { path: MODEL, planID: 'p-none' }, 'planID'],
  ['add_gulf_calendar', { path: MODEL, firstyear: 2024 }, 'firstyear'],
  ['read_report', { path: REPORT, page: ['1'] }, 'page'],
  ['create_arabic_twin', { path: REPORT, label: {} }, 'label'],
  ['check_report', { path: REPORT, check: ['a11y'] }, 'check']
];
const refused = (r, key) => r.err && r.t.includes(`'${key}'`) && /call again without it/i.test(r.t) && /the (inputs|keys) of /.test(r.t);
let n = 0;
for (const [tool, args, key] of unknown) {
  const r = await s.call(tool, args);
  chk(() => refused(r, key), () => `S${++n}. ${tool} with the unknown key "${key}": refused, the key named, its inputs listed, "call again without it": ${short(r)}`);
}
{
  const listed = (await s.c.listTools()).tools;
  const open = listed.filter((t) => t.inputSchema.additionalProperties !== false).map((t) => t.name);
  chk(() => listed.length === 11 && !open.length, () => `S12. tools/list: additionalProperties false on all 11 tools; open: ${open.join(', ')}`);
  const ok = await s.call('read_model', { path: MODEL, tables: ['Sales'] });
  chk(() => !ok.err && ok.j && ok.j.tables && ok.j.tables.length === 1, () => `S13. a call with declared keys only still answers (guard): ${short(ok)}`);
}
// the option objects a person types by hand (MR1.md "Decisions"): a misspelled key there is refused too
const nested = [
  ['generate_theme', { chart: { lables: 'On' } }, 'lables'],
  ['generate_theme', { layout: { radious: 4 } }, 'radious'],
  ['generate_theme', { palette: { data: ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777', '#888888'], ui: { backgroud: '#ffffff', card: '#ffffff', text: '#111111', accent: '#1f4e79' } } }, 'backgroud'],
  ['plan_layout', { path: MODEL, colors: { accnt: '#1f4e79' } }, 'accnt']
];
n = 0;
for (const [tool, args, key] of nested) {
  const r = await s.call(tool, args);
  chk(() => refused(r, key), () => `N${++n}. ${tool} with "${key}" inside an option object: refused and named: ${short(r)}`);
}

// ---------- P: a mistyped model path lists the models ----------
const listsModels = (r) => r.err && /Twin Sales\.SemanticModel/.test(r.t) && /call (the tool )?again/i.test(r.t) && !/internal error|ENOENT/.test(r.t) && !r.t.includes(ROOT) && !r.t.includes(os.tmpdir());
{
  const plan = await s.call('plan_layout', { path: MODEL, name: 'MR1 report' });
  const id = plan.j && plan.j.plan && plan.j.plan.planId, design = plan.j && plan.j.design;
  const calls = [
    ['read_model', { path: TYPO }], ['suggest_fields', { path: TYPO }], ['plan_layout', { path: TYPO }],
    ['check_model_health', { path: TYPO }], ['add_gulf_calendar', { path: TYPO }],
    ['create_report', { path: TYPO, planId: id }]
  ];
  chk(() => id && design, () => `P0. the probe: plan_layout on the real model gives a plan id and its design: ${short(plan)}`);
  n = 0;
  for (const [tool, args] of calls) { const r = await s.call(tool, args); n++; chk(() => listsModels(r), () => `P${n}. ${tool} with "${TYPO}": the models in the working folder listed, "call again", no internal error, no local path: ${short(r)}`); }
  const bare = await s.call('read_model', { path: 'Twin Sale' });
  chk(() => bare.err && /No model named "Twin Sale"/.test(bare.t) && /Twin Sales\.SemanticModel/.test(bare.t), () => `P7. a bare wrong name answers as before (guard): ${short(bare)}`);
  const out = await s.call('read_model', { path: '../elsewhere/M.SemanticModel' });
  chk(() => out.err && /outside the allowed folder/.test(out.t) && !/Models there/.test(out.t), () => `P8. a path outside the working folder is still refused, nothing listed (guard): ${short(out)}`);
}
await s.close();
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log('FAIL script=test-0.3.1-mr1.mjs cause=' + problems.length + ' of ' + checks + ' checks failed'); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  mr1  ${checks} checks`); process.exit(1); }
console.log(`PASS  mr1  ${checks} checks`);
