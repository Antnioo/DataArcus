// Audit 6 (the MCP tools block; the owner's go on fixing every 0.2.9 finding, 11 Oct 2026), written red first, one
// part per finding. test.mjs runs it with its own client (import { audit6 }); run alone it starts the server itself:
//   node test-audit6.mjs
// A6-3: approve_plan asks the person through MCP elicitation when the app supports it; otherwise the assistant's
// report of the reply is used and marked so.
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// a client that declares elicitation and answers every prompt with answer(request) (the person in the app)
export async function elicitClient(ROOT, answer, env) {
  const c = new Client({ name: 'test-a6', version: '1' }, { capabilities: { elicitation: {} } });
  const seen = [];
  c.setRequestHandler(ElicitRequestSchema, async (req) => { seen.push(req.params); return answer(req.params); });
  await c.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(HERE, 'server.mjs')], env: { ...process.env, DATAARCUS_ROOT: ROOT, ...(env || {}) }, stderr: 'ignore' }));
  const call = async (name, args) => { try { const r = await c.callTool({ name, arguments: args }); const t = r.content[0].text; let j = null; if (!r.isError) { try { j = JSON.parse(t); } catch (e) { j = null; } } return { err: !!r.isError, t, j }; } catch (e) { return { err: true, t: 'call failed: ' + String(e && e.message || e), j: null }; } };
  return { c, call, seen, close: () => c.close() };
}

// a small made-up model of its own (no employer data)
function model(fs, ROOT, dir) {
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Product', 'string'), col('Order Date', 'dateTime')],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] }] } }));
}

export async function audit6({ call, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
  model(fs, ROOT, 'a6');

  // ---------- A6-3: the person approves in the app (elicitation); without it the reply is the assistant's report ----------
  {
    // the app supports elicitation, the person declines: refused, and the prompt showed what would be written
    const no = await elicitClient(ROOT, () => ({ action: 'decline' }));
    const p1 = await no.call('generate_theme', { brand: '#0F766E' }), id1 = p1.j && p1.j.plan && p1.j.plan.planId;
    const r1 = await no.call('approve_plan', { planId: id1, userReply: 'go' });
    const shown = no.seen[0] || {};
    chk(() => r1.err && /declined|did not approve/i.test(r1.t) && /Not approved/.test(r1.t), () => `A6-3. the person declines in the app: refused, whatever the reply says: ${short(r1)}`);
    chk(() => /theme file/i.test(shown.message || '') && shown.requestedSchema && shown.requestedSchema.properties && shown.requestedSchema.properties.approve, () => `A6-3. the prompt shows what will be written (writesAfterGo) and asks yes or no: ${JSON.stringify(shown).slice(0, 300)}`);
    const w1 = await no.call('generate_theme', { brand: '#0F766E', planId: id1 });
    chk(() => w1.err && /not approved yet/.test(w1.t), () => `A6-3. after a decline the plan writes nothing: ${short(w1)}`);
    await no.close();
    // the person accepts: approved by the person, without any reply from the assistant
    const yes = await elicitClient(ROOT, () => ({ action: 'accept', content: { approve: true } }));
    const p2 = await yes.call('generate_theme', { brand: '#0F766E' }), id2 = p2.j && p2.j.plan && p2.j.plan.planId;
    const r2 = await yes.call('approve_plan', { planId: id2 });
    chk(() => !r2.err && r2.j.status === 'approved' && r2.j.approvedBy === 'user-in-app', () => `A6-3. the person accepts in the app: approved, approvedBy user-in-app: ${short(r2)}`);
    // accepted with approve false (the box left unticked) is not a yes
    const p3 = await yes.call('generate_theme', { brand: '#0F766E' }), id3 = p3.j && p3.j.plan && p3.j.plan.planId;
    await yes.close();
    const unt = await elicitClient(ROOT, () => ({ action: 'accept', content: { approve: false } }));
    const p4 = await unt.call('generate_theme', { brand: '#0F766E' }), id4 = p4.j && p4.j.plan && p4.j.plan.planId;
    const r4 = await unt.call('approve_plan', { planId: id4, userReply: 'go' });
    chk(() => r4.err && /Not approved/.test(r4.t), () => `A6-3. "accept" with approve false is not an approval: ${short(r4)}`);
    await unt.close();
    void id3;
    // no elicitation in the app: the reply path, marked as the assistant's report
    const p5 = await call('generate_theme', { brand: '#0F766E' }), id5 = p5.j && p5.j.plan && p5.j.plan.planId;
    const r5 = await call('approve_plan', { planId: id5, userReply: 'go' });
    chk(() => !r5.err && r5.j.status === 'approved' && r5.j.approvedBy === 'assistant-reported' && /can't|cannot/.test(r5.j.note), () => `A6-3. no elicitation: approved from the reply, approvedBy assistant-reported, said honestly: ${short(r5)}`);
    const r6 = await call('approve_plan', { planId: (await call('generate_theme', { brand: '#0F766E' })).j.plan.planId });
    chk(() => r6.err && /userReply/.test(r6.t), () => `A6-3. no elicitation and no reply: refused: ${short(r6)}`);
    // the docs say no more than the code does
    const readme = fs.readFileSync(path.join(HERE, 'README.md'), 'utf8'), privacy = fs.readFileSync(path.join(HERE, 'PRIVACY.md'), 'utf8');
    chk(() => /elicitation/i.test(readme) && /assistant-reported/.test(readme) && /elicitation/i.test(privacy) && /assistant-reported/.test(privacy), () => 'A6-3. README and PRIVACY say how approval works (elicitation, or assistant-reported)');
  }

  // ---------- A6-1 + A6-5: the plan pins what the write may use; any other input is refused, named, nothing written ----------
  const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
  const files = () => tree(path.join(ROOT, 'a6')).sort().join('|');
  {
    const base = { path: 'a6', layout: 'exec', lang: 'en', planFields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]' }, pageFilters: [{ field: 'Sales[Region]', values: ['North'] }],
      displayNames: { 'Sales[Region]': 'Area' }, text: 'Sales rose in the north.' };
    const pl = await call('plan_layout', base), pid = pl.j && pl.j.plan && pl.j.plan.planId;
    await call('approve_plan', { planId: pid, userReply: 'go' });
    const cr = { path: 'a6', name: 'A6 pinned', planId: pid, design: pl.j && pl.j.design, lang: 'en', fields: base.planFields, pageFilters: base.pageFilters, displayNames: base.displayNames, text: base.text, noDataMessage: false, secondPage: false };
    const svg = { w: 100, h: 20, values: [{ id: 'v', label: 'S', kind: 'measure', measure: 'Sales[Total Sales]' }], layers: [{ type: 'rect', x: 0, y: 0, w: 100, h: 20, fill: '#0f766e' }] };
    const variants = {
      design: { layout: 'focus' }, page: { page: '1280x720' }, lang: { lang: 'ar' }, dir: { dir: 'rtl' },
      fields: { fields: { kpis: ['Sales[Orders]'], measure: 'Sales[Total Sales]' } }, pageFilters: { pageFilters: [{ field: 'Sales[Region]', values: ['South'] }] },
      displayNames: { displayNames: { 'Sales[Region]': 'Zone' } }, text: { text: 'Something else.' }, subtitles: { subtitles: { Breakdown: 'Largest first' } },
      svgColumns: { svgColumns: [{ label: 'Bar', design: svg }] }
    };
    for (const [key, change] of Object.entries(variants)) {
      const before = files(), x = await call('create_report', Object.assign({}, cr, { name: 'A6 ' + key }, change));
      chk(() => x.err && /Nothing was written/.test(x.t) && new RegExp('\\b' + key + '\\b').test(x.t) && files() === before, () => `A6-1. create_report with another ${key} than the approved plan's: refused, the key named, nothing written: ${short(x)}`);
    }
    const ok = await call('create_report', cr);
    chk(() => !ok.err && ok.j.report, () => `A6-1. the approved inputs are written: ${short(ok)}`);
  }
  {
    // A6-5: the calendar, the scripts and the theme plans pin their inputs too
    const c0 = { path: 'a6', firstYear: 2020, lastYear: 2021, asOf: '2026-10-11' };
    const cp = await call('add_gulf_calendar', c0), cid = cp.j && cp.j.plan && cp.j.plan.planId;
    await call('approve_plan', { planId: cid, userReply: 'go' });
    const before = files(), wide = await call('add_gulf_calendar', Object.assign({}, c0, { firstYear: 1990, lastYear: 2049, name: 'Other Calendar', planId: cid }));
    chk(() => wide.err && /Nothing was written/.test(wide.t) && /firstYear/.test(wide.t) && /lastYear/.test(wide.t) && /name/.test(wide.t) && files() === before, () => `A6-5. add_gulf_calendar with other years and name than approved: refused, named: ${short(wide)}`);
    const tp = await call('generate_theme', { brand: '#0F766E', name: 'A6 Theme' }), tid = tp.j && tp.j.plan && tp.j.plan.planId;
    await call('approve_plan', { planId: tid, userReply: 'go' });
    const t2 = await call('generate_theme', { brand: '#B91C1C', name: 'A6 Theme', folder: 'a6', planId: tid });
    chk(() => t2.err && /Nothing was written/.test(t2.t) && /brand/.test(t2.t) && /folder/.test(t2.t), () => `A6-5. generate_theme with another brand and folder than approved: refused, named: ${short(t2)}`);
    const hp = await call('check_model_health', { path: 'a6' }), hid = hp.j && hp.j.plan && hp.j.plan.planId;
    if (hid) {
      await call('approve_plan', { planId: hid, userReply: 'go' });
      const h2 = await call('check_model_health', { path: 'a6', weekStart: 'monday', planId: hid });
      chk(() => h2.err && /Nothing was written/.test(h2.t) && /weekStart/.test(h2.t), () => `A6-5. check_model_health's scripts with other inputs than approved: refused, named: ${short(h2)}`);
    } else chk(() => true, () => '');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-a6-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await audit6({ call: s.call, check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  audit6  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  audit6  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
