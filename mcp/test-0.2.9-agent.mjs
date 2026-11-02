import './test-env.mjs';
// 0.2.9, the agent instructions and public claims (the audit mcp/work/audit-7-instructions.md on fix/0.2.9-checks, A7-1,
// A7-2 and A7-4 to A7-13; A7-3 is the gate's). Written red first. Every claim the agent or the user reads is checked
// against the code or the tools' own answers, never against a number copied here.
// test.mjs runs it with its own client (import { v029agent }); run alone it starts the server itself:
//   node test-0.2.9-agent.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';
import { serverSource } from './test-source.mjs';   // (0.3.1 S9: the server's code is server.mjs, tools/ and the lib/ modules it shared)

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const src = (f) => fs0.readFileSync(path.join(REPO, f), 'utf8').replace(/\r\n/g, '\n');
const section = (text, head) => { const i = text.indexOf(head); if (i < 0) return ''; const j = text.indexOf('\n## ', i + head.length); return text.slice(i, j < 0 ? undefined : j); };

// call: the raw call; meta: { instructions, tools } as the server lists them
export async function v029agent({ call, check, meta }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  let A = {}; try { A = await import('./lib/agent-text.mjs'); } catch (e) { A = {}; }
  const ins = meta.instructions, tools = meta.tools, tl = Object.fromEntries(tools.map((t) => [t.name, t])), names = tools.map((t) => t.name).sort();
  const skill = src('mcp/skills/report-design/SKILL.md'), readme = src('mcp/README.md'), toolsDoc = src('mcp/TOOLS.md'), privacy = src('mcp/PRIVACY.md'), claude = src('mcp/CLAUDE.md');
  const pl = await ask('plan_layout', { layout: 'exec' }), LIMITS = pl.j && pl.j.limits;

  // ---------- A7-1: the containment claim matches the code (the .pbip route, A1-1 of the reading block) ----------
  {
    const model = src('mcp/lib/model.mjs'), a11 = /beside[^\n]*real(In)?\(|real(In)?\([^\n]*beside/.test(   // (the reader's A1-1 calls realIn, real's name since its later fixes)
      model.split('\n').find((l) => /\.pbip\$\/i\.test\(full\)/.test(l)) || '');
    const claims = /\.pbip/.test(section(privacy, '## 4.')) && /model folder a `?\.pbip`? (points at|names)/i.test(privacy);
    if (a11) chk(() => claims && !/TODO\(A1-1\)/.test(privacy + src('mcp/README.md')), () => 'A7-1: with A1-1 in model.mjs, PRIVACY section 4 says the .pbip route is checked, and the TODO(A1-1) lines are gone (PRIVACY, README)');
    else { chk(() => /TODO[^\n]*A1-1/.test(privacy) || !claims, () => 'A7-1: without A1-1 in model.mjs, PRIVACY must not claim the .pbip route is contained (or must carry the TODO naming A1-1)');
      console.warn('PENDING  A7-1: model.mjs here has no A1-1 (the reading block\'s 63066cf); the containment claim is checked once it is merged'); }
  }

  // ---------- A7-2: PRIVACY names the version it was checked against and lists the open gaps ----------
  {
    const version = JSON.parse(src('mcp/package.json')).version, head = privacy.split('\n').slice(0, 6).join('\n'), gaps = section(privacy, '## Known gaps');
    chk(() => head.includes(version) && !/0\.2\.8 \(DataArcus `843c8dc`/.test(head), () => `A7-2: PRIVACY's header must name the package version checked (${version}): ${head.slice(0, 200)}`);
    chk(() => gaps && !/None open/.test(gaps) && /A7-3/.test(gaps) && /A6-1/.test(gaps), () => `A7-2: "Known gaps" must list each open item by id: ${gaps.slice(0, 200)}`);
  }

  // ---------- A7-4: each agent rule in one source ----------
  {
    const srv = serverSource().replace(/\r\n/g, '\n');
    chk(() => typeof A.instructions === 'function' && !/const INSTRUCTIONS = \[/.test(srv), () => 'A7-4: the instructions are built in lib/agent-text.mjs, not written in server.mjs');
    chk(() => A.INSTRUCTIONS_MAX <= 2200 && ins.length <= A.INSTRUCTIONS_MAX, () => `A7-4: the instructions are ${ins.length} characters, ${A.INSTRUCTIONS_MAX} at most (one cap)`);
    const tests = ['mcp/test.mjs', 'mcp/test-0.2.9c.mjs'].map(src).join('\n');
    chk(() => !/ins\.length\s*<=?\s*2[58]00/.test(tests), () => 'A7-4: no test keeps its own instructions cap (INSTRUCTIONS_MAX is the one)');
    const words = LIMITS && A.visualWords ? A.visualWords(LIMITS) : null;
    chk(() => words && ins.includes(`supported: ${words}`) && skill.includes(`supported: ${words}`), () => `A7-4: rule 6 and the skill list the supported visuals as LIMITS.visuals: ${words}`);
    const nums = LIMITS && [`${LIMITS.slicers} slicers`, `${LIMITS.kpiCards} KPI cards`, `${LIMITS.tableFields} table fields`];
    chk(() => nums.every((n) => skill.includes(n)) && [`slicers ${LIMITS.slicers}`, `KPI cards ${LIMITS.kpiCards}`, `table fields ${LIMITS.tableFields}`, `page filters ${LIMITS.pageFilters}`].every((n) => toolsDoc.includes(n)),
      () => 'A7-4: the skill\'s and TOOLS.md\'s limits are LIMITS\'s (G1, 0.3.1: plan_layout\'s row moved there from the README)');
    chk(() => ins.includes(LIMITS.defaultPage.replace('x', ' x ')), () => 'A7-4: rule 1b\'s page is LIMITS.defaultPage');
  }

  // ---------- A7-5: the descriptions name keys and limits that exist ----------
  {
    const s = await ask('suggest_fields', { path: 'nowhere', kpis: LIMITS.kpiCards + 1 });
    chk(() => s.err && /kpis/.test(s.t) && !/No model named/.test(s.t), () => `A7-5: suggest_fields refuses more KPI cards than plan_layout takes (${LIMITS.kpiCards}): ${s.t.slice(0, 160)}`);
    const all = tools.map((t) => JSON.stringify(t)).join('\n') + readme + toolsDoc + skill;
    chk(() => !/`page\.chosenBy`|page\.chosenBy/.test(all.replace(/pageSize\.chosenBy/g, '')), () => 'A7-5: the answer key is pageSize.chosenBy, never page.chosenBy');
  }

  // ---------- A7-6: the skill says what the report adds ----------
  chk(() => !/adds no filter and\s+no measure/.test(skill) && /nothing to the model/i.test(skill) && /report-level measures/i.test(skill), () => 'A7-6: the skill must not say DataArcus adds no filter and no measure; it adds nothing to the model, and the report may add report-level measures and filters (in the plan)');

  // ---------- A7-7: what the answers hold ----------
  chk(() => !tl.read_report || (/titles/.test(ins.split('\n').pop()) && /titles/.test(section(skill, '## Rules'))), () => 'A7-7: the instructions\' and the skill\'s last word on answers name a report\'s screened titles and texts');

  // ---------- A7-8: every writing tool is named in the gate's texts and in PRIVACY section 4 ----------
  {
    const ap = (tl.approve_plan || {}).description || '', s4 = section(privacy, '## 4.'), W = A.writingTools ? A.writingTools() : ['create_arabic_twin'];
    chk(() => W.every((t) => ap.includes(t)) && W.every((t) => s4.includes(t)), () => `A7-8: approve_plan's description and PRIVACY section 4 name every writing tool: missing ${W.filter((t) => !ap.includes(t) || !s4.includes(t))}`);
  }

  // ---------- A7-9: custom visuals, what is true today ----------
  {
    const ex = section(skill, '## Existing report');
    chk(() => /custom visual/i.test(ex) && /customVisuals|custom visuals/.test(ex) && /never replace/i.test(ex) && /notChecked/.test(ex), () => 'A7-9: the skill\'s Existing report section says what to do with custom visuals (read_report lists them, check_report counts them under notChecked, never replaced unasked)');
    chk(() => /custom visual/i.test(tl.check_report.description) && /custom visual/i.test(tl.read_report.description), () => 'A7-9: check_report\'s and read_report\'s descriptions say what they do with custom visuals');
  }

  // ---------- A7-11: where create_report's plan id comes from ----------
  chk(() => /create_report's comes from plan_layout|create_report[^.\n]{0,40}from plan_layout/.test(ins), () => 'A7-11: the instructions say create_report\'s plan id comes from plan_layout (it proposes none itself)');

  // ---------- A7-12: one untrusted-text sentence for every tool that returns report text; every flag named ----------
  {
    const R = A.REPORT_UNTRUSTED || '\u0000';
    chk(() => ['read_report', 'check_report', 'create_arabic_twin', 'approve_plan'].every((n) => tl[n].description.includes(R.trim())), () => 'A7-12: read_report, check_report, create_arabic_twin and approve_plan carry REPORT_UNTRUSTED');
    chk(() => (A.FLAG_KEYS || ['withheld']).every((k) => ins.includes(k)), () => `A7-12: rule 5 names every flag key: ${A.FLAG_KEYS}`);
  }

  // ---------- A7-13: the tool lists are the server's ----------
  {
    const rows = [...readme.matchAll(/^\| `([a-z_]+)` \|/gm)].map((m) => m[1]).sort(), sk = (skill.match(/^Tools: the DataArcus MCP \(([^)]*)\)/m) || [])[1] || '';
    const docRows = [...toolsDoc.matchAll(/^\| `([a-z_]+)` \|/gm)].map((m) => m[1]).sort();   // (G1, 0.3.1) the reference's rows too
    chk(() => JSON.stringify(rows) === JSON.stringify(names) && JSON.stringify(docRows) === JSON.stringify(names), () => `A7-13: the README's and TOOLS.md's tool rows are the server's tools: ${rows.join(',')} | ${docRows.join(',')}`);
    chk(() => names.every((n) => sk.includes('`' + n + '`')), () => `A7-13: the skill's tool list names every tool: missing ${names.filter((n) => !sk.includes('`' + n + '`'))}`);
    const rm = (toolsDoc.match(/^\| `read_model` \|[^\n]*/m) || [''])[0];   // (G1, 0.3.1) the detailed row is in TOOLS.md
    chk(() => !/reports\.counted/.test(rm) && /existingReports/.test(rm), () => 'A7-13: the read_model row says what read_model returns (existingReports), not check_model_health\'s reports');
    chk(() => names.every((n) => claude.includes('`' + n + '`')) && !/Still browser-only: the Measure Builder, the calendar generator/.test(claude), () => 'A7-13: mcp/CLAUDE.md lists every tool and does not call the calendar generator browser-only');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029a-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  const meta = { instructions: s.c.getInstructions() || '', tools: (await s.c.listTools()).tools };
  await v029agent({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, meta });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029agent  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029agent  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
