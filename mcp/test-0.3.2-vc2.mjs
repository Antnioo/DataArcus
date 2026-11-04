import './test-env.mjs';
// 0.3.2 VC2 (the owner's brief of 3 Nov; mcp/work/VC2.md; written red first on 82c11e1). B-306: the twin's approval
// page shows the plan's orderCalculations (VC1), each turned visual by its safe name with VC1's sentence, in Arabic
// (the twin's page is wholly Arabic) and English (its cells); and OFFSET, INDEX, WINDOW, RANGE and ROWNUMBER join
// VC1's list (mcp/lib/twin-calcs.mjs ORDER_FUNCTIONS, the one list), found by structure only.
// The shapes, made up, from mcp/fixtures/twin-project in os.tmpdir():
//   plain  the fixture as it is (no visual calculation)
//   vc1    VC1's shape: lineMonth RUNNINGSUM, cardOrders (a new card) RANK, colRegion RUNNINGSUM( only in a string
//   vc2    lineMonth OFFSET and INDEX, colRegion WINDOW and RANGE (and OFFSET( only in a string), cardOrders ROWNUMBER
// Each page is the one approve_plan opens (Approval.summary of the plan's own data, approvalHtml); the prompt is
// promptText (the app's own prompt).
//   R1-R3  vc1's page: the section's Arabic heading with its count 2, lineMonth with RUNNINGSUM and cardOrders with RANK,
//          each with VC1's Arabic sentence; the English cells hold VC1's English sentence
//   R4     colRegion not on vc1's page;  R6 the plain twin's page and prompt have no such section
//   N1-N5  vc2: each new function counted in the plan on its visual and named on the page
//   L1     the list in one place: twin-calcs.mjs holds the 12 names, approval-disclosure.mjs names none of them itself
//   G1     no expression text (the canary, any expression) in any answer, page or prompt
//   G2     a hostile visual name escaped, an unknown function name dropped (the page names only the list's functions)
//   G3     the answers under the cap (sizes printed: L-1102-06)
// Metadata only: no model rows.   node test-0.3.2-vc2.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-vc2-')));
process.env.DATAARCUS_ROOT = ROOT;

const Plans = await import('./lib/plans.mjs');
const Approval = await import('./lib/approval-window.mjs');
const Calcs = await import('./lib/twin-calcs.mjs');
const { register } = await import('./tools/create_arabic_twin.mjs');
const { ANSWER_MAX } = await import('./lib/answer.mjs');
let handler = null;
register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text || '').join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal's words */ } return { err: !!r.isError, t, j }; };

const CANARY = 'VC2-CANARY-4419';
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, x) => fs.writeFileSync(f, JSON.stringify(x, null, 2) + '\n');
const calc = (name, expr) => ({ field: { NativeVisualCalculation: { Language: 'dax', Expression: expr, Name: name } }, queryRef: name, nativeQueryRef: name });
const V = (dir, page, v) => path.join(dir, 'Twin Sales.Report/definition/pages', page, 'visuals', v, 'visual.json');
const tail = ` + 0 * LEN("${CANARY}")`;
const EXPRS = {
  vc1: [`RUNNINGSUM([Total Sales])${tail}`, `RANK(DENSE, ROWS, ORDERBY([Orders], DESC))${tail}`, `[Total Sales] * 2 + 0 * LEN("RUNNINGSUM( ${CANARY}") // PREVIOUS(`],
  vc2: [`[Total Sales] - CALCULATE([Total Sales], OFFSET(-1, ROWS))${tail}`, `CALCULATE([Total Sales], INDEX(1, ROWS))${tail}`,
    `CALCULATE(SUM([Total Sales]), WINDOW(1, ABS, 0, REL, ROWS))${tail}`, `CALCULATE(SUM([Total Sales]), RANGE(-2, ROWS)) + 0 * LEN("OFFSET( ${CANARY}")`, `ROWNUMBER(ROWS)${tail}`]
};
// (lineMonth and colRegion take calculations on Y; cardOrders becomes a new card of two values, as VC1's shape)
const card = (dir, extra) => { const f = V(dir, 'p1overview', 'cardOrders'), j = rd(f); j.visual.visualType = 'cardVisual'; const qs = j.visual.query.queryState; qs.Data = { projections: qs.Values.projections.concat(extra) }; delete qs.Values; wr(f, j); };
const onY = (dir, v, list) => { const f = V(dir, 'p1overview', v), j = rd(f); j.visual.query.queryState.Y.projections.push(...list); wr(f, j); };
function make(name) {
  const dir = path.join(ROOT, name); fs.cpSync(path.join(HERE, 'fixtures/twin-project'), dir, { recursive: true });
  const E = EXPRS[name];
  if (name === 'vc1') { onY(dir, 'lineMonth', [calc('Running total', E[0])]); card(dir, [calc('Order rank', E[1])]); onY(dir, 'colRegion', [calc('Doubled', E[2])]); }
  if (name === 'vc2') { onY(dir, 'lineMonth', [calc('Versus last', E[0]), calc('First month', E[1])]); onY(dir, 'colRegion', [calc('Window sum', E[2]), calc('Last three', E[3])]); card(dir, [calc('Row number', E[4])]); }
  return dir;
}
const dirs = { plain: make('plain'), vc1: make('vc1'), vc2: make('vc2') };
const pbip = (d) => path.relative(ROOT, path.join(d, 'Twin Sales.pbip'));
// the page approve_plan opens and the app's own prompt, for a plan's id
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const textOf = (html) => decode(String(html).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ''));
const got = {};
for (const k of Object.keys(dirs)) {
  const p = await call({ path: pbip(dirs[k]), arabicMonth: false }), id = p.j && p.j.plan && p.j.plan.planId, plan = id ? Plans.planOf(id) : null;
  const show = plan ? Approval.summary(plan.kind, plan.data) : null, html = plan ? Approval.approvalHtml(plan, show) : '';
  got[k] = { p, plan, show, html, text: textOf(html), prompt: plan ? Approval.promptText(plan, plan.data) : '' };
}
const HEAD_EN = 'Turned visuals with an order calculation', HEAD_AR = 'مرئيات معكوسة فيها حساب يعتمد على الترتيب';
const sec = (k) => (got[k].show ? got[k].show.sections.find((s) => String(s.heading).startsWith(HEAD_EN)) : null);
const rowOf = (k, v) => { const s = sec(k); return s ? s.rows.find((r) => r[0] && typeof r[0] === 'object' && String(r[0].en).includes(`"${v}"`)) : null; };
// on the page: the visual's row, its functions, VC1's Arabic sentence, in one table row
const pageRow = (k, v) => (got[k].html.match(/<tr>[\s\S]*?<\/tr>/g) || []).map(textOf).find((t) => t.includes(`«${v}»`)) || '';
const said = (k, v, fns) => { const t = pageRow(k, v), r = rowOf(k, v); return fns.every((f) => t.includes(f)) && t.includes(Calcs.ORDER_CALC_SAID.ar) && !!r && r[1].en === Calcs.ORDER_CALC_SAID.en; };
chk(() => got.vc1.plan && got.vc1.text.includes(`${HEAD_AR} (2)`), () => `R1 vc1's approval page holds the section "${HEAD_AR} (2)": ${got.vc1.plan ? got.vc1.text.slice(0, 300) : got.vc1.p.t.slice(0, 300)}`);
chk(() => said('vc1', 'p1overview/lineMonth', ['RUNNINGSUM']), () => `R2 lineMonth with RUNNINGSUM and VC1's sentence (AR on the page, EN in its cell): "${pageRow('vc1', 'p1overview/lineMonth')}" ${JSON.stringify(rowOf('vc1', 'p1overview/lineMonth'))}`);
chk(() => said('vc1', 'p1overview/cardOrders', ['RANK']), () => `R3 cardOrders with RANK and VC1's sentence: "${pageRow('vc1', 'p1overview/cardOrders')}"`);
chk(() => got.vc1.plan && !got.vc1.text.includes('colRegion»') && !rowOf('vc1', 'p1overview/colRegion'), () => 'R4 colRegion (RUNNINGSUM( only in a string) is not on the page');
chk(() => got.plain.plan && !got.plain.text.includes(HEAD_AR) && !sec('plain') && !got.plain.prompt.includes(HEAD_EN) && !got.plain.prompt.includes(HEAD_AR),
  () => `R6 the plain twin's page and prompt have no such section: ${got.plain.p.t.slice(0, 200)}`);
const oc2 = got.vc2.p.j && got.vc2.p.j.orderCalculations, at2 = (v) => (oc2 && oc2.visuals || []).find((x) => x.visual === v);
[['OFFSET', 'p1overview/lineMonth'], ['INDEX', 'p1overview/lineMonth'], ['WINDOW', 'p1overview/colRegion'], ['RANGE', 'p1overview/colRegion'], ['ROWNUMBER', 'p1overview/cardOrders']].forEach(([f, v], i) =>
  chk(() => at2(v) && at2(v).functions[f] === 1 && pageRow('vc2', v).includes(f) && said('vc2', v, [f]), () => `N${i + 1} ${f} counted once on ${v} in the plan and named on the page: ${JSON.stringify(oc2)} "${pageRow('vc2', v)}"`));
const adSrc = fs.readFileSync(path.join(HERE, 'lib/approval-disclosure.mjs'), 'utf8').replace(/\/\/[^\n]*/g, '');
const TWELVE = ['RUNNINGSUM', 'MOVINGAVERAGE', 'PREVIOUS', 'NEXT', 'FIRST', 'LAST', 'RANK', 'OFFSET', 'INDEX', 'WINDOW', 'RANGE', 'ROWNUMBER'];
chk(() => JSON.stringify(Calcs.ORDER_FUNCTIONS) === JSON.stringify(TWELVE) && !/\b(?:RUNNINGSUM|MOVINGAVERAGE|ROWNUMBER|OFFSET|WINDOW)\b/.test(adSrc) && /ORDER_FUNCTIONS/.test(adSrc),
  () => `L1 one list: twin-calcs.mjs ORDER_FUNCTIONS holds the 12 names (${JSON.stringify(Calcs.ORDER_FUNCTIONS)}), approval-disclosure.mjs imports it and names none itself`);
const all = Object.values(got).flatMap((g) => [g.p.t, g.html, g.prompt]).join('\n'), EX = Object.values(EXPRS).flat();
chk(() => !all.includes(CANARY) && !EX.some((e) => all.includes(e)) && !/ORDERBY\(|LEN\(|CALCULATE\(/.test(all), () => 'G1 no expression text in any answer, page or prompt');
// a made-up plan's data whose visual name is hostile and whose function names are not the list's
const HOSTILE = '<script>alert(1)</script>"x';
const hs = Approval.summary('twin', { orderCalculations: { count: 1, visuals: [{ visual: HOSTILE, functions: { '<b>EVIL</b>': 1, RANK: 1 } }] } });
const hh = Approval.approvalHtml({ id: 'plan-0123456789ab', kind: 'twin', writes: ['the twin'] }, hs);
chk(() => !/<script>alert|<b>EVIL/.test(hh) && !textOf(hh).includes('EVIL') && textOf(hh).includes('RANK') && textOf(hh).includes(`${HEAD_AR} (1)`), () => 'G2 a hostile visual name escaped, a function name off the list dropped');
const sizes = Object.fromEntries(Object.entries(got).map(([k, g]) => [k, g.p.t.length]));
chk(() => Object.values(sizes).every((n) => n > 1000 && n < ANSWER_MAX), () => `G3 the plan answers under ${ANSWER_MAX}: ${JSON.stringify(sizes)}`);
console.log(`sizes: ${JSON.stringify(sizes)}; pages: ${JSON.stringify(Object.fromEntries(Object.entries(got).map(([k, g]) => [k, g.html.length])))}`);

fs.rmSync(ROOT, { recursive: true, force: true });
problems.forEach((p) => console.log('problem: ' + String(p).slice(0, 600)));
if (problems.length) console.log(`FAIL script=vc2 cause=${problems.length} problem(s)`);
console.log(`${problems.length ? 'FAIL' : 'PASS'}  vc2  ${checks} checks`);
process.exitCode = problems.length ? 1 : 0;
