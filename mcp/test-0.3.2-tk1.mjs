import './test-env.mjs';
// 0.3.2 TK1 (the reviewer's MCP review with the mcp-builder guide, findings 3 and 4; the Codex design audit F1, F3;
// backlog B-272, B-273, B-281, B-283; the owner, D-1101-01; mcp/work/TK1.md; written red first on b40cb78).
// Made-up models only (the twin-project fixture and the made-up sample): no employer or client data.
//   K  B-272: create_report takes path and planId; the approved plan holds the rest. A plan option passed to it is
//      refused with what to do (the plan holds it; plan_layout again), the write is still exactly the approved one
//   F  B-273: an answer under the cap is flat JSON (no indentation), in one place
//   E  B-281: an error answer is capped as a success answer is; a schema error's key list is bounded
//   L  B-283 (the answer limit only): one constant, every user importing it; no new literal 40000
//   node test-0.3.2-tk1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => String(x && x.t).slice(0, 400);
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tk1-')));
process.env.DATAARCUS_ROOT = ROOT;
fs.cpSync(path.join(HERE, 'fixtures', 'twin-project'), path.join(ROOT, 'twin-project'), { recursive: true });
const MODEL = 'twin-project', REPORT = 'twin-project/Twin Sales.pbip';
const s = await serverClient(ROOT, {});
const reports = () => fs.readdirSync(path.join(ROOT, MODEL)).filter((f) => f.endsWith('.Report')).sort();
// the tools/list sizes a doc states: "tool list ... N characters" (CHANGELOG.md's [Unreleased] only; TOOLS.md whole)
const SIZE_SAID = /tools?[ /]list\b[^.]{0,160}?\b(\d{1,3}(?:,\d{3})+) characters/gi;
function statedListSizes() {
  const log = fs.readFileSync(path.join(HERE, 'CHANGELOG.md'), 'utf8'), at = log.indexOf('## [Unreleased]'), end = log.indexOf('\n## [', at + 5);
  const docs = { 'CHANGELOG.md': at < 0 ? '' : log.slice(at, end < 0 ? undefined : end), 'TOOLS.md': fs.readFileSync(path.join(HERE, 'TOOLS.md'), 'utf8') };
  return Object.entries(docs).flatMap(([file, text]) => [...text.replace(/\s+/g, ' ').matchAll(SIZE_SAID)].map((m) => ({ file, n: Number(m[1].replace(/,/g, '')) })));
}
let headroom = '';
const planOf = async (args) => { const pl = await s.call('plan_layout', args), id = pl.j && pl.j.plan && pl.j.plan.planId; if (id) await s.call('approve_plan', { planId: id }); return { pl, id }; };

try {
  // ---------- K: create_report's inputs ----------
  const tools = (await s.c.listTools()).tools, cr = tools.find((t) => t.name === 'create_report');
  const props = Object.keys(((cr || {}).inputSchema || {}).properties || {}).sort();
  chk(() => JSON.stringify(props) === '["path","planId"]', () => `K3. create_report's inputs are path and planId only: ${props.join(', ')}`);
  const listSize = JSON.stringify({ tools }).length;
  // (B-272's cause: create_report's own entry was 30,749 of 98,360 on b40cb78) its entry under 3,000, the list under 75,000
  // (0.3.3 TL1, D-1111-14: the list was 74,925 of that 75,000; shortened to 58,837, the cap follows it down to 61,000 so
  // the gain is kept: room for about four one-line options, an option costing 400 to 560 characters with its schema)
  const crSize = JSON.stringify(cr || {}).length;
  chk(() => crSize < 3000 && listSize < 61000, () => `K4. create_report's entry under 3,000 characters and tools/list under 61,000: ${crSize}, ${listSize}`);
  // (0.3.3 TB3, hub I-1112-1706: the size a public text states had drifted from the measured one, 60,532 said, 60,930
  // measured; nothing compared them) every tools/list size the CHANGELOG's [Unreleased] or TOOLS.md states is the
  // measured one; the CHANGELOG states one
  const said = statedListSizes();
  chk(() => said.some((x) => x.file === 'CHANGELOG.md') && said.every((x) => x.n === listSize), () => `K7. the tools/list size the docs state is the measured ${listSize.toLocaleString('en-US')}: ${said.map((x) => `${x.file} says ${x.n.toLocaleString('en-US')}`).join('; ') || 'CHANGELOG.md [Unreleased] states none'}`);
  headroom = `tools/list ${listSize.toLocaleString('en-US')} of 61,000 (${(61000 - listSize).toLocaleString('en-US')} left)`;

  const base = { path: MODEL, layout: 'exec', name: 'TK One', lang: 'en', noDataMessage: false };
  const one = await planOf(base);
  const old = await s.call('create_report', Object.assign({}, base, { planId: one.id, design: { theme: {} } }));
  chk(() => old.err && /'design'/.test(old.t) && /'layout'/.test(old.t) && /approved plan holds/.test(old.t) && /plan_layout again/.test(old.t) && !/'path'|'planId'/.test(old.t.replace(/takes only path and planId/, '')),
    () => `K1. an old-shape call (plan options with the planId): refused, the plan holds them, plan_layout again: ${short(old)}`);
  const typo = await s.call('create_report', { path: MODEL, planID: one.id });
  chk(() => typo.err && /'planID'/.test(typo.t) && /Call again without it/.test(typo.t) && !/approved plan holds/.test(typo.t), () => `K2. a real typo keeps the plain unknown-key words: ${short(typo)}`);

  const before = reports();
  const w = await s.call('create_report', { path: MODEL, planId: one.id });
  const added = reports().filter((f) => !before.includes(f));
  chk(() => !w.err && w.j.exact && w.j.exact.digest && one.pl.j.exactCheck && w.j.exact.digest === one.pl.j.exactCheck.digest && added.length === 1 && /^TK One/.test(added[0]),
    () => `K5. plan_layout -> approve -> create_report {path, planId}: the approved bytes written (digest = the plan's): ${added.join(', ')} ${short(w)} plan digest ${((one.pl.j || {}).exactCheck || {}).digest}`);

  fs.writeFileSync(path.join(ROOT, 'tk-theme.json'), JSON.stringify({ name: 'TK', dataColors: ['#1f6feb', '#2da44e', '#bf8700'], background: '#ffffff', foreground: '#1f2328', tableAccent: '#1f6feb' }));
  const th = await planOf(Object.assign({}, base, { name: 'TK Theme', theme: 'tk-theme.json' }));
  fs.writeFileSync(path.join(ROOT, 'tk-theme.json'), JSON.stringify({ name: 'TK', dataColors: ['#cf222e', '#2da44e', '#bf8700'], background: '#ffffff', foreground: '#1f2328', tableAccent: '#1f6feb' }));
  const b2 = reports(), tw = await s.call('create_report', { path: MODEL, planId: th.id });
  chk(() => th.id && tw.err && /Nothing was written/.test(tw.t) && /changed/.test(tw.t) && JSON.stringify(reports()) === JSON.stringify(b2),
    () => `K6. the theme file changed after the go: refused, nothing written: plan ${th.id} ${short(th.pl)} ${short(tw)}`);

  const sp = await planOf({ sample: true }), folder = sp.pl.j && sp.pl.j.sample && sp.pl.j.sample.folder;
  const sw = await s.call('create_report', { path: folder, planId: sp.id });
  chk(() => sp.id && !sw.err && sw.j.written === true && fs.existsSync(path.join(ROOT, folder, 'Gulf Retail.pbip')), () => `K7. the sample written with path and planId only: ${short(sw)}`);

  const rd = await planOf({ path: MODEL, redesignFrom: REPORT, keepPositions: true, restyle: { mode: 'dark' } });
  const b3 = reports(), rw = await s.call('create_report', { path: MODEL, planId: rd.id });
  chk(() => rd.id && !rw.err && reports().length === b3.length + 1 && reports().some((f) => /redesigned/.test(f)), () => `K8. a redesign written with path and planId only: ${short(rd.pl)} ${short(rw)}`);

  // ---------- F: flat answers ----------
  const pls = await s.call('plan_layout', { sample: true }), rm = await s.call('read_model', { path: MODEL });
  chk(() => !pls.err && !/\n\s/.test(pls.t) && JSON.parse(pls.t), () => `F1. plan_layout's sample answer is flat (no indentation): ${pls.t.slice(0, 200)}`);
  chk(() => !rm.err && !/\n\s/.test(rm.t) && JSON.parse(rm.t), () => `F2. read_model's answer is flat: ${rm.t.slice(0, 200)}`);
  const TA = await import('./lib/tool-answer.mjs'), A = await import('./lib/answer.mjs');
  const o = { a: [1, 2, { b: 'c' }], d: 'e' };
  chk(() => TA.text(o).content[0].text === JSON.stringify(A.out(o)), () => `F3. text() of a small answer is JSON.stringify of it: ${TA.text(o).content[0].text}`);

  // ---------- E: errors capped ----------
  const big = await TA.safe(async () => { throw new Error('Nothing was written: ' + 'a field reference, '.repeat(6000)); })({});
  const bt = big.content[0].text;
  chk(() => big.isError && bt.length <= A.ANSWER_MAX && /This answer was cut/.test(bt), () => `E1. an error over the cap is capped and the cut said: ${bt.length}`);
  const many = Object.fromEntries(Array.from({ length: 500 }, (x, i) => ['unknownOption' + i, 1]));
  const me = await s.call('read_model', Object.assign({ path: MODEL }, many));
  chk(() => me.err && me.t.length < 3000 && /and 4\d\d more/.test(me.t), () => `E2. 500 unknown keys: the list bounded, how many more said: ${me.t.length} ${me.t.slice(-300)}`);

  // ---------- L: one answer limit ----------
  const S = await import('./lib/scope.mjs'), R = await import('./lib/read-report.mjs');
  const src = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');
  // (0.3.2 SP21) READ_CAP moved with read_report's answer to lib/report-answer.mjs; the check reads it there
  chk(() => S.LIMIT === A.ANSWER_MAX && R.READ_CAP === A.ANSWER_MAX && S.AIM < A.ANSWER_MAX && /ANSWER_MAX/.test(src('lib/scope.mjs')) && /ANSWER_MAX/.test(src('lib/report-answer.mjs')),
    () => `L2. LIMIT, READ_CAP and AIM read from the one constant: ${S.LIMIT} ${R.READ_CAP} ${S.AIM}`);
  // where 40000 may stand as a number: the one constant, and an SVG design's own input size (report-fields.mjs:
  // what a person may pass, not an answer's size)
  const ALLOWED = { 'lib/answer.mjs': 1, 'lib/report-fields.mjs': 1 };
  const hits = [];
  for (const dir of ['lib', 'tools']) for (const f of fs.readdirSync(path.join(HERE, dir)).filter((x) => x.endsWith('.mjs'))) {
    const rel = dir + '/' + f, n = (src(rel).match(/(?<![\w.,])40_?000(?![\w.,])/g) || []).length;
    if (n !== (ALLOWED[rel] || 0)) hits.push(`${rel} ${n}`);
  }
  chk(() => !hits.length, () => `L1. a literal 40000 outside the one constant (use ANSWER_MAX from lib/answer.mjs): ${hits.join('; ')}`);
} finally { await s.close(); }

fs.rmSync(ROOT, { recursive: true, force: true });
if (headroom) console.log(headroom);
if (problems.length) { console.log(`FAIL script=test-0.3.2-tk1.mjs cause=${problems[0].slice(0, 300).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p.slice(0, 900))); console.log(`FAIL  tk1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  tk1  ${checks} checks`);
