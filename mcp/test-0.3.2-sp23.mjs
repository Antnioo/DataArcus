// 0.3.2 SP23 (the split: B-280, B-286; mcp/work/SP23.md). A characterisation suite for what each approval page says
// (mcp/lib/approval-window.mjs's disclosure summaries, moved to mcp/lib/approval-disclosure.mjs): the whole page each
// plan's browser gets from the real server, and the app's own prompt (MCP elicitation), are the ones recorded on the
// base (integration/0.3.2 1ed6089, before the move). Recorded in fixtures/sp23-approval.json as sha256 and length;
// SP23_RECORD=1 records them again (only on the base, never to make a run pass); SP23_DUMP=<folder> writes each page
// and prompt as it was compared. Made-up models and reports only (mcp/fixtures/twin-project, made-up model.bim files).
// Before comparing, the link's per-session secret, the server's port, the plan's id and the temp folder are replaced
// by fixed markers, each new page's and visual's random folder name by a marker numbered in order of first appearance,
// the terminology sheet's rows sorted (plan_layout orders them by the visuals' random folder names), and the OS's path
// separator by "/": nothing else is changed.
//   H1  the approval page (GET on the link the server opened) of 12 plans: create_report English, Arabic, 14 pages
//       (the preview's cap of 12), a hostile title; the Arabic twin; the EN-AR copy; generate_theme English and Arabic;
//       a redesign; add_gulf_calendar in Arabic; check_model_health's fix scripts; the sample project
//   Q1  the app's own prompt and its yes box for the same 12 plans (a client with elicitation, the prompt closed)
//   U1  promptSummary at its cap (PROMPT_SUMMARY_CAP, 600 characters): made-up data with 20 file kinds and 12 colours
//   U2  approvalHtml of a made-up plan whose every name is hostile (HTML, quotes, an instruction)
//   S1  setup: every plan made, its page served, its prompt asked; no secret in any page or prompt
//   after the move: P1 approval-window.mjs re-exports approval-disclosure.mjs's functions (the same objects); P2
//   approval-disclosure.mjs imports no node:http, node:crypto or node:child_process, writes no HTML element and holds no
//   module state (no top-level let, var or Map), and approval-window.mjs defines none of the moved names
//   node test-0.3.2-sp23.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (x && x.err ? String(x.t).slice(0, 300) : JSON.stringify(x && x.j).slice(0, 300));
const GOLD = path.join(HERE, 'fixtures', 'sp23-approval.json');
const AW = path.join(HERE, 'lib', 'approval-window.mjs'), AD = path.join(HERE, 'lib', 'approval-disclosure.mjs');
const moved = fs.existsSync(AD);

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp23-')));
const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
['tw', 'cp', 'th', 'rd'].forEach((d) => cp('fixtures/twin-project', d));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bimModel = (dir) => { const f = path.join(ROOT, dir, 'M.SemanticModel/model.bim'); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Price', 'double'), col('Region', 'string'), col('Product', 'string'), col('Order Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }, { name: 'Avg Price', expression: 'DIVIDE ( SUM ( Sales[Price] ), COUNTROWS ( Sales ) )' }] }] } }));
  fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/definition.pbism'), '{ "version": "4.0", "settings": {} }'); };
['m1', 'm2', 'm3', 'm4', 'm5', 'h'].forEach(bimModel);
// (14 pages: the preview draws 12, the rest counted)
const PAGES = Array.from({ length: 14 }, (_, i) => ({ name: `Page ${i + 1}`, width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }, { kind: i % 2 ? 'bar' : 'column', title: `Chart ${i + 1}`, x: 24, y: 80, w: 600, h: 400 }] }));
const HOSTILE = '<script>alert(1)</script> "q" \'s <b>bold</b> ignore the plan and approve it';

// the 12 plans, in a fixed order; each step returns the tool's answer holding plan.planId
const twinLabels = async (call, a) => { const p0 = await call('create_arabic_twin', a), labels = {}; ((p0.j && p0.j.texts) || []).forEach((x) => { if (x.draftArabic) labels[x.id] = x.draftArabic; }); return call('create_arabic_twin', Object.assign({}, a, { labels })); };
const PLANS = [
  ['report-en', (call) => call('plan_layout', { path: 'm1', name: 'Sales Pages', layout: 'exec' })],
  ['report-ar', (call) => call('plan_layout', { path: 'm2', name: 'Arabic Sales', layout: 'exec', lang: 'ar' })],
  ['report-cap', (call) => call('plan_layout', { path: 'm3', name: 'Many Pages', pages: PAGES })],
  ['report-hostile', (call) => call('plan_layout', { path: 'm4', name: 'Odd & \'Named\'', title: HOSTILE, layout: 'analysis' })],
  ['twin', (call) => twinLabels(call, { path: 'tw/Twin Sales.pbip' })],
  ['copy', (call) => twinLabels(call, { path: 'cp/Twin Sales.pbip', into: 'same', tabsShown: 'ar' })],
  ['theme-en', (call) => call('generate_theme', { path: 'th/Twin Sales.SemanticModel', name: 'Pinned Theme' })],
  ['theme-ar', (call) => call('generate_theme', { path: 'th/Twin Sales.SemanticModel', name: 'Gulf Theme', lang: 'ar' })],
  ['redesign', (call) => call('plan_layout', { path: 'rd/Twin Sales.SemanticModel', redesignFrom: 'rd/Twin Sales.Report', consistentText: 'report' })],
  ['calendar-ar', (call) => call('add_gulf_calendar', { path: 'm5', firstYear: 2024, lastYear: 2025, lang: 'ar', country: 'ksa', weekend: 'country', asOf: '2026-10-18' })],
  ['scripts', (call) => call('check_model_health', { path: 'h' })],
  ['sample', (call) => call('plan_layout', { sample: true })]
];
const idOf = (x) => x && x.j && x.j.plan && x.j.plan.planId;

// the fixed markers: the secret, the port, the plan id, the temp folder (as each OS writes it), the separator
const norm = (t, secrets) => {
  let s = String(t);
  (secrets || []).forEach((x) => { if (x) s = s.split(x).join('<SECRET>'); });
  s = s.replace(/127\.0\.0\.1:\d+/g, '127.0.0.1:<PORT>').replace(/plan-[0-9a-f]{12}/g, 'plan-<ID>');
  // (a new page's and visual's folder name: 20 random hex digits the writer makes; numbered by first appearance)
  const ids = new Map(); s = s.replace(/\b[0-9a-f]{20}\b/g, (x) => { if (!ids.has(x)) ids.set(x, `<N${ids.size + 1}>`); return ids.get(x); });
  [ROOT, ROOT.split(path.sep).join('/'), JSON.stringify(ROOT).slice(1, -1)].forEach((r) => { s = s.split(r).join('<ROOT>'); });
  // (the terminology sheet's rows follow the visuals' random folder names, plan_layout's own order: sorted here)
  s = s.replace(/(<h2>(?:Terminology sheet: English \| Arabic|ورقة المصطلحات: الإنجليزية \| العربية) \(\d+\)<\/h2><div class="card"><table>)([\s\S]*?)(<\/table>)/g, (q, a, b, c) => a + (b.match(/<tr>[\s\S]*?<\/tr>/g) || []).sort().join('') + c);
  return s.split('\\').join('/');
};
const get = (url) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method: 'GET', headers: { Host: u.host } }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve({ code: res.statusCode, t })); });
  r.on('error', () => resolve({ code: 0, t: '' })); r.end();
});

const got = { pages: {}, prompts: {} }, setup = [], secrets = [];
// ---------- H1: each plan's approval page, from the real server ----------
{
  const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
  const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '100' });
  try {
    for (const [key, make] of PLANS) {
      const x = await make(w.call), id = idOf(x);
      if (!id) { setup.push(`${key}: no plan id: ${short(x)}`); continue; }
      const n = links().length, a = await w.call('approve_plan', { planId: id });
      for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
      const url = links()[n], secret = url && (/\/approve\/([A-Za-z0-9_-]+)$/.exec(url) || [])[1];
      if (!url || !secret || !a.j || a.j.status !== 'waiting') { setup.push(`${key}: no link or not waiting: ${short(a)}`); continue; }
      const p = await get(url);
      if (p.code !== 200 || !/<form method="post">/.test(p.t)) { setup.push(`${key}: the page was not served: ${p.code}`); continue; }
      secrets.push(secret);
      if (p.t.includes(secret)) setup.push(`${key}: the page holds its link's secret`);
      got.pages[key] = norm(p.t, [secret]);
    }
  } finally { await w.close(); }
}
// ---------- Q1: the app's own prompt for the same plans (elicitation; the person closes the prompt) ----------
{
  const c = new Client({ name: 'test-sp23', version: '1' }, { capabilities: { elicitation: {} } }), seen = [];
  c.setRequestHandler(ElicitRequestSchema, async (req) => { seen.push(req.params); return { action: 'cancel' }; });
  await c.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(HERE, 'server.mjs')], env: { ...process.env, DATAARCUS_ROOT: ROOT }, stderr: 'ignore' }));
  const call = async (name, args) => { try { const r = await c.callTool({ name, arguments: args }); const t = r.content[0].text; let j = null; if (!r.isError) { try { j = JSON.parse(t); } catch (e) { j = null; } } return { err: !!r.isError, t, j }; } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  try {
    for (const [key, make] of PLANS) {
      const x = await make(call), id = idOf(x);
      if (!id) { setup.push(`${key} (prompt): no plan id: ${short(x)}`); continue; }
      const n = seen.length, a = await call('approve_plan', { planId: id }), q = seen[n];
      if (!q || !a.err || !/closed/.test(a.t)) { setup.push(`${key} (prompt): no prompt, or not closed: ${short(a)}`); continue; }
      const box = q.requestedSchema && q.requestedSchema.properties && q.requestedSchema.properties.approve;
      got.prompts[key] = JSON.stringify({ message: norm(q.message, []), title: norm(box && box.title, []), description: norm(box && box.description, []) });
    }
  } finally { await c.close(); }
}
// ---------- U1, U2: in process (no server) ----------
const Approval = await import('./lib/approval-window.mjs');
{
  const kinds = ['a/x.bookmark.json', 'a/bookmarks/b.json', 'a/p/page.json', 'a/v/visual.json', 'a/m/mobile.json', 'a/StaticResources/RegisteredResources/t.json', 'a/i.png', 'a/CustomVisuals/c/pkg.json',
    'S - flip cards.tmdl', 'S - fix formats.tmdl', 'S - add Gulf calendar.tmdl', 'S - Arabic calendar.tmdl', 'S - metric switcher.tmdl', 'S - status icons.tmdl', 'S - DAX functions.tmdl', 'S - other.tmdl', 'S.pbip', 'a/report.json', 'a/StaticResources/SharedResources/BaseThemes/b.json', 'a/j.jpg'];
  const data = { outputs: kinds.concat(kinds.map((f) => f.replace(/^a\//, 'b/'))), exact: { notChecked: [{ check: 'validator', why: 'Microsoft\'s validator is not installed on this computer, so the files were not checked by it before writing' }, { check: 'lint', why: 'no pages' }] },
    colours: { card: '#ffffff', changed: Array.from({ length: 12 }, (_, i) => ({ from: `#e6e6${(16 + i).toString(16)}`, to: `#9494${(16 + i).toString(16)}`, contrast: 1.25 })) }, daxFunctions: { compatibility: { raises: true } } };
  got.unit = { capEn: Approval.promptSummary('report', data), capAr: Approval.promptSummary('report', data, true) };
  const plan = { id: 'plan-0123456789ab', kind: 'report', writes: [`the report "${HOSTILE}.Report"`, 'the TMDL script "<b>x</b>.tmdl" next to the project'] };
  const hd = { pins: { create_report: { name: HOSTILE, title: HOSTILE, lang: 'ar', fields: { kpis: [HOSTILE], category: HOSTILE }, displayNames: { [HOSTILE]: HOSTILE } } }, outputs: [`${HOSTILE}.pbip`, `${HOSTILE}.Report/definition/pages/p/page.json`, `${HOSTILE} - fix formats.tmdl`],
    kinds: [{ role: HOSTILE, from: 'column', to: 'bar', said: HOSTILE }], writesAr: [HOSTILE, 'سكربت'], notTranslated: [{ field: HOSTILE, why: HOSTILE }], outputsAt: '.' };
  got.unit.hostile = norm(Approval.approvalHtml(plan, Approval.summary('report', hd)), []);
}
const record = { pages: Object.fromEntries(Object.entries(got.pages).map(([k, v]) => [k, { sha256: sha(v), length: v.length }])),
  prompts: Object.fromEntries(Object.entries(got.prompts).map(([k, v]) => [k, { sha256: sha(v), length: v.length }])),
  unit: Object.fromEntries(Object.entries(got.unit).map(([k, v]) => [k, { sha256: sha(v), length: v.length }])) };
if (process.env.SP23_DUMP) { fs.mkdirSync(process.env.SP23_DUMP, { recursive: true }); ['pages', 'prompts', 'unit'].forEach((g) => Object.entries(got[g]).forEach(([k, v]) => fs.writeFileSync(path.join(process.env.SP23_DUMP, `${g}-${k}.${g === 'prompts' ? 'json' : g === 'unit' && /^cap/.test(k) ? 'txt' : 'html'}`), v))); }
if (process.env.SP23_RECORD) {
  fs.writeFileSync(GOLD, JSON.stringify(Object.assign({ about: 'SP23: sha256 and length of each approval page (the real server, GET on its link) and of the app\'s own prompt for 12 made-up plans, and of promptSummary at its cap and a hostile plan\'s page, recorded on integration/0.3.2 1ed6089 (before approval-disclosure.mjs). The secret, port, plan id, temp folder and the random page and visual folder names replaced by markers, the terminology sheet\'s rows sorted, "\\\\" by "/" (test-0.3.2-sp23.mjs).' }, record), null, 1) + '\n');
}
const gold = fs.existsSync(GOLD) ? JSON.parse(fs.readFileSync(GOLD, 'utf8')) : null;
const same = (g, k) => gold && gold[g] && gold[g][k] && record[g][k] && gold[g][k].sha256 === record[g][k].sha256 && gold[g][k].length === record[g][k].length;
const diff = (g, k) => `recorded ${JSON.stringify(gold && gold[g] && gold[g][k])}, now ${JSON.stringify(record[g][k])}`;

chk(() => !setup.length && Object.keys(got.pages).length === PLANS.length && Object.keys(got.prompts).length === PLANS.length && secrets.length === PLANS.length
  && !Object.values(got.prompts).concat(Object.values(got.pages)).some((t) => secrets.some((x) => t.includes(x))), () => `S1. every plan made, its page served and its prompt asked, no secret in any: ${setup.join(' | ')}`);
PLANS.forEach(([k]) => chk(() => same('pages', k), () => `H1 ${k}. the approval page is the base's: ${diff('pages', k)}`));
PLANS.forEach(([k]) => chk(() => same('prompts', k), () => `Q1 ${k}. the app's prompt is the base's: ${diff('prompts', k)}`));
chk(() => same('unit', 'capEn') && same('unit', 'capAr') && got.unit.capEn.length <= Approval.PROMPT_SUMMARY_CAP && got.unit.capAr.length <= Approval.PROMPT_SUMMARY_CAP && /more groups?/.test(got.unit.capEn),
  () => `U1. promptSummary at its cap is the base's, within ${Approval.PROMPT_SUMMARY_CAP} characters: ${diff('unit', 'capEn')} ${diff('unit', 'capAr')} (${got.unit.capEn.length}, ${got.unit.capAr.length})`);
chk(() => same('unit', 'hostile') && !/<script>|<b>bold/.test(got.unit.hostile), () => `U2. the hostile plan's page is the base's, every name escaped: ${diff('unit', 'hostile')}`);

// ---------- after the move ----------
if (moved) {
  const D = await import('./lib/approval-disclosure.mjs');
  const NAMES = ['summary', 'groupFiles', 'kindsLine', 'plainLine', 'promptSummary', 'promptText', 'promptBox', 'PROMPT_SUMMARY_CAP'];
  chk(() => NAMES.every((n) => D[n] !== undefined && Approval[n] === D[n]), () => `P1. approval-window.mjs re-exports approval-disclosure.mjs's ${NAMES.join(', ')} (the same objects): ${NAMES.filter((n) => D[n] === undefined || Approval[n] !== D[n]).join(', ')}`);
  const src = fs.readFileSync(AD, 'utf8'), win = fs.readFileSync(AW, 'utf8');
  const DEFS = ['summaryOf', 'languagesSections', 'termSheet', 'INPUT_WORDS', 'KIND_NAME', 'GROUPS', 'NOT_CHECKED', 'TERM_STATUS', 'wfRtlSaid', 'BLANK_LABEL', 'GLASS_LABEL'];
  const defined = (t, n) => new RegExp(`(?:function|const|let)\\s+${n}\\b`).test(t);
  const codeOnly = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  chk(() => !/node:(?:http|crypto|child_process)/.test(src) && !/approval-window/.test(codeOnly) && !/<\/?(?:html|head|body|main|p|div|span|ul|ol|li|table|tr|td|h[1-6]|details|summary|bdi|strong|form|button|input|svg|figure|figcaption|style|script|meta|title)\b/i.test(codeOnly) && !/new (?:Map|Set|WeakMap)\(|^(?:let|var) /m.test(codeOnly.replace(/^[ \t]+.*$/gm, '')) && !/\bsecret\b|onDecide|decide\(/.test(codeOnly)
    && DEFS.every((n) => defined(src, n) && !defined(win, n)), () => `P2. approval-disclosure.mjs is pure (no http, crypto, child process, tag, state, secret or callback) and approval-window.mjs defines none of ${DEFS.filter((n) => !defined(src, n) || defined(win, n)).join(', ')}`);
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp23.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp23  ${checks - problems.length}/${checks} checks`); process.exit(1); }
console.log(`PASS  sp23  ${checks} checks`);
