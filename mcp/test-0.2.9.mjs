import './test-env.mjs';
// 0.2.9 part 1 (the owner's go on the 0.2.9 plan, 11 Oct 2026), written red first:
//  1. the gate inside the tools (P-1: the owner's Claude Desktop showed no approval prompt, and files were written
//     before any plan): no tool writes a file without a plan id that was approved with approve_plan;
//  2. the plan checked against the tools' limits before it is shown (O-12: a plan with 4 slicers was approved, then
//     create_report refused it);
//  3. the user's choices kept: the second page's filter side (O-1), the page size (O-8), a light theme with the brand
//     colour exact (O-11).
// test.mjs runs it with its own client (import { v029 }); run alone it starts the server itself:
//   node test-0.2.9.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { E } from './lib/design.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// a client of a server of its own (the expiry check runs one with a short plan life)
export async function serverClient(ROOT, env) {
  const c = new Client({ name: 'test-029', version: '1' });
  await c.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(HERE, 'server.mjs')], env: { ...process.env, DATAARCUS_ROOT: ROOT, ...(env || {}) }, stderr: 'ignore' }));
  const call = async (name, args) => { try { const r = await c.callTool({ name, arguments: args }); const t = r.content[0].text; let j = null; if (!r.isError) { try { j = JSON.parse(t); } catch (e) { j = null; } } return { err: !!r.isError, t, j }; } catch (e) { return { err: true, t: 'call failed: ' + String(e && e.message || e), j: null }; } };
  return { c, call, close: () => c.close() };
}

// call: the raw call (no plan id added); meta: { instructions, tools } as the server lists them
export async function v029({ call, check, ROOT, fs = fs0, meta }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  const model = (dir, extra) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Price', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Product', 'string'), col('City', 'string'), col('Segment', 'string'), col('Order Date', 'dateTime')],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' },
        { name: 'Avg Price', expression: 'DIVIDE ( SUM ( Sales[Price] ), COUNTROWS ( Sales ) )' }].concat(extra || []) }] } })); };
  // every file under a folder (relative names), to prove what a call wrote
  const files = (dir) => { const out = []; const walk = (d) => { if (!fs.existsSync(d)) return; fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else out.push(path.relative(ROOT, f).split(path.sep).join('/')); }); }; walk(dir); return out.sort(); };
  const added = (before, after) => after.filter((f) => !before.includes(f));
  const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  model('g'); model('g2'); model('g3');
  const all = () => files(ROOT);

  // ---------- 1. the gate ----------
  // G1. approve_plan exists and refuses an id it never gave
  {
    const x = await ask('approve_plan', { planId: 'plan-000000000000' });
    chk(() => x.err && /no plan "plan-000000000000"/.test(x.t), () => `G1. approve_plan must refuse an unknown plan id: ${short(x)}`);
  }
  // G2. generate_theme without a plan id returns the theme's design and writes nothing
  let themePlan = null;
  {
    const before = all(), x = await ask('generate_theme', { brand: '#0F766E', name: 'Gate Theme' }), after = all();
    themePlan = x.j && x.j.plan && x.j.plan.planId;
    chk(() => !x.err && x.j.design && x.j.design.data && !x.j.path && !added(before, after).length, () => `G2. generate_theme without planId must return the design and write nothing: added ${JSON.stringify(added(before, after))} ${short(x)}`);
    chk(() => x.j.plan.status === 'proposed' && /^plan-/.test(themePlan) && /approve_plan/.test(x.j.plan.sayFirst), () => `G2. generate_theme without planId must propose a plan id: ${short(x)}`);
  }
  // G3. (A-01) the person approves with a click on Approve in DataArcus's approval window (the tests' browser clicks it):
  //     approvedBy user-in-browser, and then the theme file is written. A typed reply approves nothing: test-approval.mjs
  {
    const ok = await ask('approve_plan', { planId: themePlan });
    chk(() => !ok.err && ok.j.status === 'approved' && ok.j.approvedBy === 'user-in-browser' && ok.j.allows.includes('generate_theme'), () => `G3. the click on Approve in the window must approve: ${short(ok)}`);
    const before = all(), x = await ask('generate_theme', { brand: '#0F766E', name: 'Gate Theme', planId: themePlan }), after = all();
    chk(() => !x.err && x.j.path && added(before, after).length === 1 && /\.json$/.test(added(before, after)[0]), () => `G3. generate_theme with the approved plan must write the theme file: added ${JSON.stringify(added(before, after))} ${short(x)}`);
  }
  // G4. create_report refuses without a plan id, with an unknown one, with one not approved, with a theme plan and with
  //     a plan for another model; nothing is written each time
  const design = (await ask('plan_layout', { layout: 'exec', lang: 'en' })).j;
  {
    const run = async (label, planId, dir, re) => { const before = all(), x = await ask('create_report', Object.assign({ path: dir || 'g', name: 'Gate ' + label, design: design && design.design, noDataMessage: false }, planId === undefined ? {} : { planId })), after = all();
      chk(() => x.err && re.test(x.t) && !added(before, after).length, () => `G4 ${label}. create_report must refuse and write nothing: added ${JSON.stringify(added(before, after).slice(0, 3))} ${short(x)}`); return x; };
    const none = await run('no id', undefined, 'g', /approved plan id[\s\S]*plan_layout[\s\S]*approve_plan/);
    chk(() => /Nothing was written/.test(none.t), () => `G4. the refusal must say nothing was written: ${short(none)}`);
    await run('unknown', 'plan-0123456789ab', 'g', /unknown[\s\S]*Show the user the plan/);
    // (A-02: the plan holds the report's name and options as the write gives them)
    const pl = await ask('plan_layout', { path: 'g', layout: 'exec', lang: 'en', name: 'Gate ok', noDataMessage: false, secondPage: false }), pid = pl.j && pl.j.plan && pl.j.plan.planId;
    chk(() => pl.j.plan.status === 'proposed' && /^plan-/.test(pid), () => `G4. plan_layout with the model must give a proposed plan id: ${short(pl)}`);
    await run('not approved', pid, 'g', /not approved yet/);
    await run('theme plan', themePlan, 'g', /theme plan/);
    await ask('approve_plan', { planId: pid, });
    await run('other model', pid, 'g2', /another model/);
    const before = all(), x = await ask('create_report', { path: 'g', name: 'Gate ok', design: pl.j.design, planId: pid, noDataMessage: false, secondPage: false }), after = all();
    chk(() => !x.err && x.j.report && added(before, after).some((f) => /Gate ok\.Report\/definition\/report\.json$/.test(f)), () => `G4. create_report with the approved plan must write the report: ${short(x)}`);
    // (Z-01, the outside review of 11 Oct: a report plan pins only create_report's inputs, so it no longer allows a
    // separate theme file, which takes its own theme plan; before, any theme inputs were written with it)
    const th = await ask('generate_theme', { brand: '#0F766E', name: 'Gate Report Theme', planId: pid });
    chk(() => th.err && /report plan, which allows create_report, not generate_theme/.test(th.t), () => `G4. a report plan allows no separate theme file (Z-01): ${short(th)}`);
  }
  // G5. plan_layout writes nothing (its format script is named; create_report writes it after go)
  {
    const before = all(), x = await ask('plan_layout', { path: 'g3', layout: 'exec', lang: 'en' }), after = all();
    chk(() => !x.err && !added(before, after).length && x.j.formats && !x.j.formats.fixScriptFile && /create_report/.test(JSON.stringify(x.j.formats)), () => `G5. plan_layout must write nothing and name the format script for after go: added ${JSON.stringify(added(before, after))} ${short(x)}`);
  }
  // G6. check_model_health: its findings without a plan, its fix scripts only with an approved one
  {
    const before = all(), x = await ask('check_model_health', { path: 'g3' }), after = all();
    const pid = x.j && x.j.plan && x.j.plan.planId;
    chk(() => !x.err && x.j.findings && !added(before, after).length && !/fixScriptFile/.test(JSON.stringify(x.j.fixes || {})) && /^plan-/.test(pid), () => `G6. check_model_health without planId must write no script and propose a plan: added ${JSON.stringify(added(before, after))} ${short(x)}`);
    await ask('approve_plan', { planId: pid });
    const b2 = all(), y = await ask('check_model_health', { path: 'g3', planId: pid }), a2 = all();
    chk(() => !y.err && added(b2, a2).some((f) => /\.tmdl$/.test(f)) && /fixScriptFile/.test(JSON.stringify(y.j.fixes || {})), () => `G6. check_model_health with the approved plan must write its scripts: ${JSON.stringify(added(b2, a2))} ${short(y)}`);
  }
  // G7. add_gulf_calendar: everything checked and told, the script only with an approved plan
  {
    const before = all(), x = await ask('add_gulf_calendar', { path: 'g2', firstYear: 2024, lastYear: 2025, asOf: '2026-10-11' }), after = all();
    const pid = x.j && x.j.plan && x.j.plan.planId;
    chk(() => !x.err && !added(before, after).length && !x.j.scriptFile && x.j.table && /^plan-/.test(pid), () => `G7. add_gulf_calendar without planId must write nothing and propose a plan: added ${JSON.stringify(added(before, after))} ${short(x)}`);
    await ask('approve_plan', { planId: pid });
    const b2 = all(), y = await ask('add_gulf_calendar', { path: 'g2', firstYear: 2024, lastYear: 2025, asOf: '2026-10-11', planId: pid }), a2 = all();
    chk(() => !y.err && y.j.scriptFile && added(b2, a2).length === 1, () => `G7. add_gulf_calendar with the approved plan must write its script: ${JSON.stringify(added(b2, a2))} ${short(y)}`);
  }
  // G8. the instructions and the writers' descriptions say it
  if (meta) {
    chk(() => /approve_plan/.test(meta.instructions) && /planId/.test(meta.instructions), () => 'G8. the server instructions must name planId and approve_plan');
    const writers = ['generate_theme', 'create_report', 'check_model_health', 'add_gulf_calendar'];
    chk(() => writers.every((n) => /planId/.test((meta.tools.find((t) => t.name === n) || {}).description || '')), () => `G8. every writing tool's description must name planId: ${writers.filter((n) => !/planId/.test((meta.tools.find((t) => t.name === n) || {}).description || ''))}`);
    chk(() => ((meta.tools.find((t) => t.name === 'plan_layout') || {}).annotations || {}).readOnlyHint === true, () => 'G8. plan_layout must be read-only now');
  }

  // ---------- 2. the plan checked against the tools' limits ----------
  {
    const x = await ask('plan_layout', { path: 'g', layout: 'analysis', lang: 'en' });
    const L = x.j && x.j.limits;
    chk(() => L.slicers === 3 && L.kpiCards === 6 && L.tableFields === 8 && L.pageFilters === 8 && L.svgColumns === 4 && Array.isArray(L.pageSizes) && L.pageSizes.includes('1920x1080'), () => `L1. plan_layout must give the tools' limits: ${JSON.stringify(L)}`);
    const four = await ask('plan_layout', { path: 'g', layout: 'analysis', lang: 'en', planFields: { slicers: ['Sales[Region]', 'Sales[Channel]', 'Sales[Product]', 'Sales[City]'] } });
    chk(() => !four.err && !four.j.plan && four.j.planProblems.some((p) => /slicers/.test(p) && /\b3\b/.test(p)), () => `L2. a plan with 4 slicers must get no plan id and say the limit is 3: ${short(four)}`);
    const big = await ask('plan_layout', { path: 'g', layout: 'exec', lang: 'en', planFields: { kpis: Array(7).fill('Sales[Total Sales]'), table: Array(9).fill('Sales[Region]') } });
    chk(() => !big.err && !big.j.plan && big.j.planProblems.some((p) => /KPI/.test(p) && /\b6\b/.test(p)) && big.j.planProblems.some((p) => /table/.test(p) && /\b8\b/.test(p)), () => `L3. 7 KPI cards and 9 table fields must be refused with the limits: ${short(big)}`);
    const bad = await ask('plan_layout', { path: 'g', layout: 'exec', lang: 'en', planFields: { kpis: ['Sales[Nope]'], category: 'Sales[Total Sales]' } });
    chk(() => !bad.err && !bad.j.plan && bad.j.planProblems.some((p) => /Sales\[Nope\]/.test(p)) && bad.j.planProblems.some((p) => /a column is needed/.test(p)), () => `L4. a field not in the model, or a measure where a column goes, must be refused before the plan is shown: ${short(bad)}`);
    const ok = await ask('plan_layout', { path: 'g', layout: 'analysis', lang: 'en', planFields: { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], slicers: ['Sales[Region]', 'Sales[Channel]', 'Sales[Product]'] } });
    chk(() => !ok.err && /^plan-/.test(ok.j.plan.planId) && !ok.j.planProblems, () => `L5. a plan within the limits must get a plan id: ${short(ok)}`);
    chk(() => !meta || /planFields/.test(meta.instructions), () => 'L6. the instructions must say to check the plan\'s fields with plan_layout (planFields) before showing it');
  }

  // ---------- 3. the user's choices ----------
  {
    const base = E.repairState(E.fresh()).layout;
    for (const side of ['end', 'top']) {
      const c = Object.assign({}, base, { preset: 'exec', filters: true, fpos: side });
      chk(() => E.secondLayout(c).fpos === side, () => `C1. the second page must keep the filter side "${side}": ${E.secondLayout(c).fpos}`);
    }
    chk(() => E.secondLayout(Object.assign({}, base, { preset: 'exec', filters: true, fpos: 'start' })).fpos === 'start', () => 'C1. "start" stays "start"');
    // the report: filters at the end (right in English) on both pages
    const pl = await ask('plan_layout', { path: 'g', layout: 'exec', filters: 'end', lang: 'en', name: 'Rail end', noDataMessage: false }), pid = pl.j && pl.j.plan && pl.j.plan.planId;
    await ask('approve_plan', { planId: pid });
    const x = await ask('create_report', { path: 'g', name: 'Rail end', design: pl.j && pl.j.design, planId: pid, noDataMessage: false });
    const dir = x.err ? null : path.join(ROOT, 'g', x.j.report, 'definition', 'pages');
    const order = dir ? JSON.parse(fs.readFileSync(path.join(dir, 'pages.json'), 'utf8')).pageOrder : [];
    const rail = (pg) => { const vd = path.join(dir, pg, 'visuals'), W = JSON.parse(fs.readFileSync(path.join(dir, pg, 'page.json'), 'utf8')).width;
      // (a visual inside a group has its position relative to the group: PBIR)
      const vs = fs.readdirSync(vd).map((v) => JSON.parse(fs.readFileSync(path.join(vd, v, 'visual.json'), 'utf8'))), gx = (v) => { const g = v.parentGroupName && vs.find((q) => q.name === v.parentGroupName); return g ? g.position.x + gx(g) : 0; };
      const xs = vs.filter((v) => v.visual && /slicer/i.test(v.visual.visualType)).map((v) => v.position.x + gx(v));
      return { W, xs }; };
    const p2 = dir && order[1] ? rail(order[1]) : { W: 0, xs: [] };
    chk(() => p2.xs.length && p2.xs.every((v) => v > p2.W / 2), () => `C2. page 2's filter rail must be at the right as asked (O-1): slicers at x ${JSON.stringify(p2.xs)} of ${p2.W} ${x.err ? short(x) : ''}`);
  }
  {
    const ar = await ask('plan_layout', { layout: 'exec', lang: 'ar' });
    chk(() => ar.j.page.w === 1920 && ar.j.page.h === 1080 && ar.j.pageSize.chosenBy === 'default', () => `C3. an Arabic plan without a size must be 1920 x 1080, said as the default (O-8): ${JSON.stringify(ar.j && [ar.j.page, ar.j.pageSize])}`);
    const asked = await ask('plan_layout', { layout: 'exec', lang: 'ar', page: '1280x720' });
    chk(() => asked.j.page.w === 1280 && asked.j.pageSize.chosenBy === 'asked', () => `C3. a size the user asked for is kept and said: ${JSON.stringify(asked.j && [asked.j.page, asked.j.pageSize])}`);
    chk(() => !meta || (/1920 x 1080/.test(meta.instructions) && /Arabic/.test(meta.instructions.match(/1920 x 1080[^\n]*/)[0])), () => 'C3. the instructions must keep 1920 x 1080 unless the user asks, also for Arabic');
  }
  {
    const t = await ask('generate_theme', { brand: '#0F766E' }), d = t.j && t.j.design;
    chk(() => d.data[0] === '#0f766e' && d.ui.accent === '#0f766e', () => `C4. the brand colour must be exact (O-11): data[0] ${d && d.data[0]}, accent ${d && d.ui.accent}`);
    chk(() => lum(d.ui.background) > 0.45 && lum(d.ui.card) > 0.45 && lum(d.ui.text) < 0.2, () => `C4. the theme must be light by default (O-11): ${JSON.stringify(d && d.ui)}`);
    const dark = (await ask('generate_theme', { brand: '#0F766E', mode: 'dark' })).j;
    chk(() => lum(dark.design.ui.background) < 0.1 && dark.design.data[0] === '#0f766e', () => `C5. "dark" when asked, the colour still exact: ${JSON.stringify(dark && dark.design.ui)} ${dark && dark.design.data[0]}`);
    const plain = (await ask('generate_theme', {})).j;
    chk(() => lum(plain.design.ui.background) > 0.45, () => `C6. a theme with nothing asked must be light: ${JSON.stringify(plain && plain.design.ui)}`);
    const pale = (await ask('generate_theme', { brand: '#E8F0F8' })).j;
    chk(() => pale.design.data[0] === '#e8f0f8' && pale.warnings.length && /never changed|kept/.test(pale.sayInPlan || ''), () => `C7. a brand colour that fails a contrast check is kept and the plan says so: ${JSON.stringify(pale && { d0: pale.design.data[0], w: pale.warnings, s: pale.sayInPlan })}`);
  }

  // ---------- an expired plan (a server whose plans live 1.5 seconds) ----------
  {
    const s = await serverClient(ROOT, { DATAARCUS_PLAN_TTL_MS: '1500' });
    const pl = await s.call('plan_layout', { path: 'g', layout: 'exec', lang: 'en' }), pid = pl.j && pl.j.plan && pl.j.plan.planId;
    await s.call('approve_plan', { planId: pid });
    await new Promise((r) => setTimeout(r, 2000));
    const before = all(), x = await s.call('create_report', { path: 'g', name: 'Too late', design: pl.j && pl.j.design, planId: pid, noDataMessage: false }), after = all();
    chk(() => x.err && /expired/.test(x.t) && !added(before, after).length, () => `G9. an expired plan must be refused and nothing written: ${short(x)}`);
    const longer = await serverClient(ROOT, { DATAARCUS_PLAN_TTL_MS: String(10 * 60 * 60 * 1000) });
    const p2 = await longer.call('generate_theme', {});
    chk(() => p2.j.plan.expiresInMinutes === 120, () => `G9. DATAARCUS_PLAN_TTL_MS can only shorten a plan's life: ${short(p2)}`);
    await s.close(); await longer.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  const meta = { instructions: s.c.getInstructions() || '', tools: (await s.c.listTools()).tools };
  await v029({ call: s.call, check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT, meta });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
