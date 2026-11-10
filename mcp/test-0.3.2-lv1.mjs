// 0.3.2 LV1 (B-276, first half; written red first): the owner's ER twin shot (1 Nov) read a card as
// «الأكثر ازدحامًا: اليوم:Thursday الساعة:11:00 PM»: the approved Arabic label and the model's value glued and out of
// reading order. lib/twin-texts.mjs arabicDax() pushed each value (a branch variable) bare between the label's string
// pieces. Now each value is written as UNICHAR ( 8296 ) & value & UNICHAR ( 8297 ) (a first-strong isolate, as
// assets/js/text-measure.js runs() and pbip-query.js isoNum), with UNICHAR ( 8207 ) (a right-to-left mark) at an end
// of the text that is a value (text-measure.js ends()), in every Arabic label; the label's own texts stay as approved.
//   V1  the ER shape (made up): VAR _d = [..] VAR _h = [..] RETURN "Busiest: Day: " & _d & " Hour: " & _h is read as
//       one text with {1} and {2}; written with its Arabic label, each value isolated, the label's pieces byte for byte
//   V2  the text DAX evaluates to reads label, value, label, value, each value inside its isolate, an RLM at an end value
//   V3  a text that begins with a value starts with RLM; the Top N title's two branches, its condition kept
//   V4  a label with no Arabic letter, a branch with no value, the empty text: the DAX exactly as before (the base's
//       algorithm, kept here as the oracle); a value of the model used directly ([Day]) stays not translated
//   V5  end to end (create_arabic_twin on the golden fixture with the ER card): the twin's written measure isolated;
//       the EN-AR copy's English measure and every English page's files byte for byte the original's; the plan's
//       answer measured (L-1102-06) and at most 95% of the answer limit
// Fixture: the golden model (mcp/test-models/large-synthetic, made up).   node test-0.3.2-lv1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { arabicDax, textMeasuresOf, titleMeasuresOf } from './lib/twin-texts.mjs';
import { ANSWER_MAX } from './lib/answer.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const FSI = '⁨', PDI = '⁩', RLM = '‏';
// the base's arabicDax (4418828), the oracle for what must not change
const oldDax = (pd, labels) => { const daxText = (t) => '"' + String(t).replace(/"/g, '""') + '"';
  const one = (b, label) => { if (label == null) label = b.template; const out = []; String(label).split(/(\{\d+\})/).forEach((x) => { const v = /^\{(\d+)\}$/.exec(x); if (v) out.push(b.vars[+v[1] - 1]); else if (x) out.push(daxText(x)); }); return out.length ? out.join(' & ') : '""'; };
  const bs = pd.branches.map((b, i) => one(b, labels[i]));
  return (pd.ret ? pd.prefix + 'RETURN ' : '') + (pd.cond != null ? `IF ( ${pd.cond}, ${bs[0]}, ${bs[1]} )` : bs[0]); };
// what a DAX text of literals, variables and UNICHAR joined by & evaluates to (the variables given)
const evalDax = (expr, vals) => { const body = expr.replace(/^[\s\S]*\bRETURN\s+/, '');
  return body.split(/\s&\s/).map((t) => { t = t.trim(); const u = /^UNICHAR \( (\d+) \)$/.exec(t); if (u) return String.fromCodePoint(+u[1]); if (/^".*"$/s.test(t)) return t.slice(1, -1).replace(/""/g, '"'); if (t in vals) return vals[t]; throw new Error('not evaluated: ' + t); }).join(''); };
const lits = (expr) => [...expr.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replace(/""/g, '"'));
const card = (expr) => ({ ext: { entities: [{ name: 'Visits', measures: [{ name: 'Busiest', dataType: 'Text', expression: expr }] }] }, pages: [{ id: 'p1', page: {}, visuals: [{ json: { name: 'v1', visual: { visualType: 'card', query: { queryState: { Values: { projections: [{ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: 'Visits' } }, Property: 'Busiest' } }, queryRef: 'Visits.Busiest' }] } } } } } }] }] });
const ER = 'VAR _d = [Busiest Day] VAR _h = [Busiest Hour] RETURN "Busiest: Day: " & _d & " Hour: " & _h';
const ER_AR = 'الأكثر ازدحامًا: اليوم:{1} الساعة:{2}';
const VALS = { _d: 'Thursday', _h: '11:00 PM' };
const short = (x) => (x && x.err ? String(x.t).slice(0, 300) : JSON.stringify(x && x.j).slice(0, 300));

// ---------- V1-V4: the DAX ----------
const er = textMeasuresOf(card(ER))[0], pd = er && er.pd;
chk(() => pd && pd.branches && pd.branches.length === 1 && pd.branches[0].template === 'Busiest: Day: {1} Hour: {2}' && pd.branches[0].vars.join() === '_d,_h', () => `V1 setup. the ER card is read as one text with {1} and {2}: ${JSON.stringify(pd)}`);
const dax = arabicDax(pd, [ER_AR]);
chk(() => dax.includes('UNICHAR ( 8296 ) & _d & UNICHAR ( 8297 )') && dax.includes('UNICHAR ( 8296 ) & _h & UNICHAR ( 8297 )'), () => `V1. each value is written between FSI and PDI: ${dax}`);
chk(() => JSON.stringify(lits(dax)) === JSON.stringify(['الأكثر ازدحامًا: اليوم:', ' الساعة:']), () => `V1. the label's own texts are the approved pieces, byte for byte (no space added, no mark inside): ${JSON.stringify(lits(dax))}`);
chk(() => dax.startsWith('VAR _d = [Busiest Day] VAR _h = [Busiest Hour] RETURN '), () => `V1. the variables kept as they are: ${dax}`);
const shown = evalDax(dax, VALS);
chk(() => shown === 'الأكثر ازدحامًا: اليوم:' + FSI + 'Thursday' + PDI + ' الساعة:' + FSI + '11:00 PM' + PDI + RLM, () => `V2. the text reads label, value, label, value, each value isolated, an RLM after the end value: ${JSON.stringify(shown)}`);
chk(() => !/[A-Za-z0-9]/.test(shown.replace(/⁨[^⁩]*⁩/g, '')), () => `V2. no Latin letter or digit of a value outside its isolate: ${JSON.stringify(shown)}`);
chk(() => { const at = (s) => shown.indexOf(s); return at('اليوم:') < at('Thursday') && at('Thursday') < at('الساعة:') && at('الساعة:') < at('11:00 PM'); }, () => `V2. the logical order is the label's: ${JSON.stringify(shown)}`);
// a text that begins with a value
const first = arabicDax(pd, ['{1} هو اليوم و{2} هي الساعة']);
chk(() => evalDax(first, VALS) === RLM + FSI + 'Thursday' + PDI + ' هو اليوم و' + FSI + '11:00 PM' + PDI + ' هي الساعة', () => `V3. a text that begins with a value starts with RLM: ${first}`);
// the Top N title: two branches, its condition kept
const topExpr = 'VAR _n = [Count] VAR _s = MIN ( 10, _n ) RETURN IF ( _s = _n, "Score by Region", "Top " & _s & " of " & _n & ": Score by Region" )';
const tm = titleMeasuresOf({ ext: { entities: [{ name: 'Coupon', measures: [{ name: 'Title: Score', dataType: 'Text', expression: topExpr }] }] }, pages: [{ id: 'p1', page: {}, visuals: [{ json: { name: 'v1', visual: { visualType: 'barChart', visualContainerObjects: { title: [{ properties: { text: { expr: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: 'Coupon' } }, Property: 'Title: Score' } } } } }] } } } }] }] })[0];
const top = tm && tm.pd.branches ? arabicDax(tm.pd, ['النقاط حسب المنطقة', 'أعلى {1} من أصل {2}: النقاط حسب المنطقة']) : '';
chk(() => top.includes('IF ( _s = _n, "النقاط حسب المنطقة", "أعلى " & UNICHAR ( 8296 ) & _s & UNICHAR ( 8297 ) & " من " & UNICHAR ( 8296 ) & _n & UNICHAR ( 8297 ) & ": النقاط حسب المنطقة" )'), () => `V3. the Top N title: the plain branch as approved, the other's values isolated, the condition kept: ${top}`);
// V4: what must not change
const sameAsBase = [[pd, ['Busiest: Day: {1} Hour: {2}']], [pd, [null]], [tm.pd, ['Score by Region', null]], [tm.pd, [null, null]]];
const noVal = textMeasuresOf(card('IF ( ISEMPTY ( Visits ), "No data for this selection", "" )'))[0];
if (noVal && noVal.pd.branches) sameAsBase.push([noVal.pd, ['لا توجد بيانات لهذا الاختيار', '']]);
chk(() => sameAsBase.length === 5 && sameAsBase.every(([p, l]) => arabicDax(p, l) === oldDax(p, l)), () => `V4. a label with no Arabic letter, a branch with no value, the empty text: the DAX as the base wrote it: ${JSON.stringify(sameAsBase.filter(([p, l]) => arabicDax(p, l) !== oldDax(p, l)).map(([p, l]) => [arabicDax(p, l), oldDax(p, l)]))}`);
const direct = textMeasuresOf(card('"Busiest: Day: " & [Day] & " Hour: " & [Hour]'))[0];
chk(() => direct && !direct.pd.branches && /does not read/.test(direct.pd.why), () => `V4. a value of the model used directly stays not translated, as on the base: ${JSON.stringify(direct)}`);

// ---------- V5: end to end ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-lv1-')));
fs.cpSync(path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const hash = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const s = await serverClient(ROOT, {});
try {
  const pl = await s.call('plan_layout', { path: 'large', focus: 'Web Orders', name: 'Busy', layout: 'exec' });
  await s.call('approve_plan', { planId: pl.j.plan.planId });
  const made = await s.call('create_report', { path: 'large', planId: pl.j.plan.planId });
  const ORIG = path.join(ROOT, 'large/Busy.Report'), XF = path.join(ORIG, 'definition/reportExtensions.json');
  // the ER card (made up): an empty-state card's measure replaced by the ER shape, on the visual that shows it
  const ext = rd(XF), ent = ext.entities.find((e) => (e.measures || []).some((m) => /^No data: /.test(m.name))), nd = ent && ent.measures.find((m) => /^No data: /.test(m.name));
  const vf = nd && tree(path.join(ORIG, 'definition/pages')).find((f) => /visual\.json$/.test(f) && fs.readFileSync(f, 'utf8').includes(`"Property": "${nd.name}"`));
  chk(() => !made.err && nd && vf, () => `V5 setup. the golden report is written with an empty-state card: ${short(made)}`);
  ent.measures.push({ name: 'Busiest', dataType: 'Text', expression: 'VAR _d = [Web Orders Count] VAR _h = [Web Orders Total Score] RETURN "Busiest: Day: " & _d & " Hour: " & _h' });
  fs.writeFileSync(XF, JSON.stringify(ext, null, 2) + '\n');
  fs.writeFileSync(vf, fs.readFileSync(vf, 'utf8').split(`"Property": "${nd.name}"`).join('"Property": "Busiest"'));
  const t0 = await s.call('create_arabic_twin', { path: 'large/Busy.Report' });
  const T = (!t0.err && t0.j.texts) || [], busy = T.find((t) => t.kind === 'measureText' && t.text === 'Busiest: Day: {1} Hour: {2}');
  chk(() => busy, () => `V5 setup. the twin lists the ER card's text: ${short(t0)}`);
  let k = 0; const labels = {}; T.filter((t) => t.text != null).forEach((t) => { labels[t.id] = t === busy ? ER_AR : t.draftArabic || (/\{1\}/.test(t.text) ? `أعلى {1} من أصل {2}: نص ${++k}` : `نص ${++k}`); });
  const before = Object.fromEntries(tree(ORIG).map((f) => [path.relative(ORIG, f), hash(f)]));
  // the separate twin
  const p1 = await s.call('create_arabic_twin', { path: 'large/Busy.Report', labels });
  const size = p1.err ? -1 : JSON.stringify(p1.j).length;
  console.log(`  the twin's plan answer: ${size} characters (limit ${ANSWER_MAX})`);
  chk(() => !p1.err && size > 0 && size <= 0.95 * ANSWER_MAX, () => `V5. the plan's answer within 95% of the limit (L-1102-06): ${size}`);
  await s.call('approve_plan', { planId: p1.j.plan.planId });
  const w1 = await s.call('create_arabic_twin', { path: 'large/Busy.Report', labels, planId: p1.j.plan.planId });
  const twx = !w1.err && rd(path.join(ROOT, 'large/Busy AR.Report/definition/reportExtensions.json')), twm = twx && twx.entities.flatMap((e) => e.measures || []).find((m) => m.name === 'Busiest');
  chk(() => twm && twm.expression === 'VAR _d = [Web Orders Count] VAR _h = [Web Orders Total Score] RETURN "الأكثر ازدحامًا: اليوم:" & UNICHAR ( 8296 ) & _d & UNICHAR ( 8297 ) & " الساعة:" & UNICHAR ( 8296 ) & _h & UNICHAR ( 8297 ) & UNICHAR ( 8207 )', () => `V5. the twin writes the ER card's measure with each value isolated: ${w1.err ? w1.t : JSON.stringify(twm)}`);
  // the EN-AR copy: the English measure and every English page as the original's
  const p2 = await s.call('create_arabic_twin', { path: 'large/Busy.Report', labels, into: 'same' });
  await s.call('approve_plan', { planId: p2.j.plan.planId });
  const w2 = await s.call('create_arabic_twin', { path: 'large/Busy.Report', labels, into: 'same', planId: p2.j.plan.planId });
  const COPY = path.join(ROOT, 'large/Busy (EN-AR).Report'), cx = !w2.err && rd(path.join(COPY, 'definition/reportExtensions.json')), cms = cx ? cx.entities.flatMap((e) => e.measures || []) : [];
  const en = cms.find((m) => m.name === 'Busiest'), ar = cms.find((m) => /^Busiest AR/.test(m.name));
  chk(() => en && en.expression === ext.entities.flatMap((e) => e.measures).find((m) => m.name === 'Busiest').expression && ar && /UNICHAR \( 8296 \) & _d & UNICHAR \( 8297 \)/.test(ar.expression), () => `V5. the copy's English measure is the original's, its Arabic one isolated: ${w2.err ? w2.t : JSON.stringify([en, ar])}`);
  // every English page of the copy: the original page's visuals byte for byte, but the language button and the slicers' sync group the copy adds
  const enPages = rd(path.join(ORIG, 'definition/pages/pages.json')).pageOrder;
  const strip = (j) => { if (j && j.visual && j.visual.objects) delete j.visual.objects.general; delete (j || {}).syncGroup; if (j && j.visual) delete j.visual.syncGroup; return JSON.stringify(j); };
  const diff = [];
  enPages.forEach((id) => { const dir = path.join(ORIG, 'definition/pages', id, 'visuals'); (fs.existsSync(dir) ? fs.readdirSync(dir) : []).forEach((v) => { const a = path.join(dir, v, 'visual.json'), b = path.join(COPY, 'definition/pages', id, 'visuals', v, 'visual.json');
    if (!fs.existsSync(b)) { diff.push(id + '/' + v + ' missing'); return; } if (hash(a) !== hash(b) && strip(rd(a)) !== strip(rd(b))) diff.push(id + '/' + v); }); });
  chk(() => !w2.err && enPages.length >= 1 && !diff.length, () => `V5. every English page's visuals are the original's: ${JSON.stringify(diff.slice(0, 6))}`);
  const after = Object.fromEntries(tree(ORIG).map((f) => [path.relative(ORIG, f), hash(f)]));
  chk(() => JSON.stringify(after) === JSON.stringify(before), () => 'V5. the original report is not changed');
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL script=mcp/test-0.3.2-lv1.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 1200))); console.log(`FAIL  lv1  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  lv1  ${checks} checks`);
