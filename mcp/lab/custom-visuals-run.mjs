// 0.3.1 NC1: the custom visuals lab's tool run, unattended, as the laptop runs it (mcp/lab/CUSTOM-VISUALS-LAB.md): the
// lab written into <work>/lab, then through a DataArcus server over stdio (the unzipped .mcpb's server.mjs, or mcp/'s):
//   plan_layout customVisualsFrom -> approve_plan -> create_report ("<name> native")
//   plan_layout redesignFrom on the native copy -> approve_plan -> create_report ("<name> native redesigned")
// and <work>/nc1-results.json and <work>/nc1-results.md (the result table, its Desktop columns left to fill).
// The approval: by default the tests' browser clicks Approve on the local page (mcp/test-browser.mjs, the lab's made-up
// report only); --click manual opens the system browser and waits for the person's click (approve_plan asked again
// while it says "waiting"). The sharedAxes answers (comparable) are the owner's, written in the run sheet before the run.
//   node lab/custom-visuals-run.mjs <server.mjs> <empty work folder> [--click manual]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { writeLab, validate, NAME, VISUALS_CUSTOM } from './custom-visuals-lab.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// the owner's answers to the plan's sharedAxes questions (CUSTOM-VISUALS-LAB.md, "Before the run")
export const SHARED_AXES = [{ measures: ['Sales[Total Sales]', 'Sales[Sales Target]'], answer: 'comparable' }, { measures: ['Sales[Total Sales]', 'Sales[Sales LY]'], answer: 'comparable' }];

export async function run(server, work, opts) {
  const o = opts || {}, W = path.resolve(work), LAB = path.join(W, 'lab');
  if (fs.existsSync(W) && fs.readdirSync(W).length) throw new Error('give an empty work folder: ' + W);
  fs.mkdirSync(W, { recursive: true });
  const lab = writeLab(LAB), log = [];
  const env = { ...process.env, DATAARCUS_ROOT: W };
  if (o.click !== 'manual') env.DATAARCUS_BROWSER = JSON.stringify([process.execPath, path.join(HERE, '..', 'test-browser.mjs')]);
  const client = new Client({ name: 'nc1-lab', version: '1' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.resolve(server)], env, stderr: 'ignore' }));
  const call = async (name, args) => { const r = await client.callTool({ name, arguments: args }); const t = r.content[0].text; const step = { name, args, err: !!r.isError, j: r.isError ? null : JSON.parse(t), t: r.isError ? t : undefined }; log.push(step); return step; };
  const approve = async (planId) => { for (let i = 0; i < 40; i++) { const a = await call('approve_plan', { planId }); if (a.err || a.j.status !== 'waiting') return a; } throw new Error('no click on the approval page'); };
  const must = (s, what) => { if (s.err) throw new Error(what + ': ' + s.t); return s.j; };
  const out = { lab: { pbip: path.relative(W, lab.pbip), pages: lab.pages, custom: lab.custom, native: lab.native }, validator: {} };
  try {
    out.validator.original = validate(lab.report).json;
    const from = 'lab/' + NAME + '.Report';
    const pl = must(await call('plan_layout', { path: 'lab', customVisualsFrom: from, sharedAxes: SHARED_AXES }), 'plan_layout customVisualsFrom');
    out.plan = pl.customVisuals;
    must(await approve(pl.plan.planId), 'approve_plan (native copy)');
    out.native = must(await call('create_report', { path: 'lab', planId: pl.plan.planId, customVisualsFrom: from, sharedAxes: SHARED_AXES }), 'create_report (native copy)');
    out.validator.native = validate(path.join(LAB, NAME + ' native.Report')).json;
    const rd = must(await call('plan_layout', { path: 'lab', redesignFrom: 'lab/' + NAME + ' native.Report' }), 'plan_layout redesignFrom');
    out.redesign = { counts: rd.redesign.counts, pages: rd.redesign.pages };
    must(await approve(rd.plan.planId), 'approve_plan (redesign)');
    out.redesigned = must(await call('create_report', { path: 'lab', planId: rd.plan.planId, redesignFrom: 'lab/' + NAME + ' native.Report' }), 'create_report (redesign)');
    out.validator.redesigned = validate(path.join(LAB, path.basename(String(out.redesigned.report)))).json;
  } finally { await client.close().catch(() => {}); }
  fs.writeFileSync(path.join(W, 'nc1-results.json'), JSON.stringify({ out, log }, null, 2));
  fs.writeFileSync(path.join(W, 'nc1-results.md'), table(out));
  return out;
}

// the result table: one row per custom visual, the plan's columns filled, Desktop's left to fill
function table(out) {
  const reps = (out.plan && out.plan.replacements) || [], not = (out.plan && out.plan.notReplaced) || [];
  const rows = VISUALS_CUSTOM.map((c) => {
    const r = reps.find((x) => x.from === c.type), n = not.find((x) => x.line.includes(c.type));
    const became = r ? r.native + (r.axes && r.axes.panels ? ` (${r.axes.panels} panels)` : '') : n ? 'not replaced' : '(missing)', lost = r ? r.lost.join('; ') : n ? n.why : '';
    return `| ${c.page} | ${c.name} (${c.type.replace(/\d+$/, '')}) | ${became} | ${r ? r.confidence + (r.guess ? ', a guess' : '') : '-'} | ${lost.replace(/\|/g, '/')} | | |`;
  });
  const v = (k) => { const d = out.validator[k] && out.validator[k].data; return d ? `${d.errorCount} errors, ${d.warningCount} warnings` : 'not run'; };
  return ['# NC1 lab run: the result table', '', `Validator: original ${v('original')}; native copy ${v('native')}; redesigned ${v('redesigned')}.`,
    `Redesign: ${out.redesign ? out.redesign.counts.changed + ' visuals moved or resized, ' + out.redesign.counts.notChanged + ' kept' : 'not run'}.`, '',
    '| Page | Custom visual | Became | Confidence | What the plan said is lost | Desktop: draws the same fields sensibly? | Notes |', '|---|---|---|---|---|---|---|'].concat(rows).join('\n') + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [server, work] = process.argv.slice(2), click = process.argv.includes('--click') ? process.argv[process.argv.indexOf('--click') + 1] : 'auto';
  if (!server || !work) { console.error('node lab/custom-visuals-run.mjs <server.mjs> <empty work folder> [--click manual]'); process.exit(2); }
  const o = await run(server, work, { click });
  console.log(`native copy: ${o.native.report} (${o.native.replaced} replaced); redesigned: ${o.redesigned.report}\nresults: ${path.join(path.resolve(work), 'nc1-results.md')}`);
}
