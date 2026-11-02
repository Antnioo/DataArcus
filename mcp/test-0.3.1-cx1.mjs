import './test-env.mjs';
// 0.3.1 CX1 (Codex's independent release review, 27 Oct: the five code findings real on integration; mcp/work/CX1.md;
// written red first). Made-up models and the made-up service-orders report only: no employer or client data.
//   A  F01 (the owner, D-1027-04: an Arabic report's titles drafted and approved, never silent): an Arabic plan whose
//      titles would stay English for fields with no Arabic name gets no plan id; the problem names the fields and the
//      two ways out; drafted names approved, or each field kept English on purpose, give the plan its id
//   W  F08 (D-1027-13, all or nothing): check_model_health's approved scripts are written all or none: a failed write
//      removes what this call created (never a file it did not create), the answer is an error, the plan not used when
//      nothing stayed, and the same plan writes them all once the cause is gone
//   B  F02 (never strand a reader): a dense page of the EN-AR copy with no free place for its language button: both
//      pages of that pair stay in the tabs, and the plan says why
//   T  F11 (answers capped): a text answer over 40,000 characters is cut to 40,000, the cut said
//   node test-0.3.1-cx1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? String(x.t).slice(0, 500) : JSON.stringify(x && x.j).slice(0, 500));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-cx1-')));
process.env.DATAARCUS_ROOT = ROOT;
const tree = (d) => { const out = []; const walk = (x) => { if (!fs.existsSync(x)) return; for (const e of fs.readdirSync(x, { withFileTypes: true })) { const f = path.join(x, e.name), r = path.relative(d, f).split(path.sep).join('/'); if (e.isDirectory()) { out.push(r + '/'); walk(f); } else out.push(r); } }; walk(d); return out.sort(); };
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const modelAt = (dir, tables) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables } })); };

// ---------- A: F01, an Arabic plan with English titles gets no plan id ----------
{
  // names the fixed list of report words has no Arabic for (Codex's arabic-probe: two such fields in the titles)
  modelAt('a', [{ name: 'Web Orders', partitions: mp('Web Orders'), columns: [col('Score', 'double'), col('Plan Group', 'string'), col('Sign Up Date', 'dateTime')], measures: [{ name: 'Web Orders Total Score', expression: 'SUM ( \'Web Orders\'[Score] )', formatString: '#,0' }] }]);
  const s = await serverClient(ROOT, {});
  const base = { path: 'a/M.SemanticModel', lang: 'ar', layout: 'exec', name: 'CX plan', secondPage: true };
  const p0 = await s.call('plan_layout', base), an = (p0.j && p0.j.arabicNames) || {}, te = an.titlesInEnglish || {}, fields = te.fields || [];
  const probs = ((p0.j && p0.j.planProblems) || []).join(' ');
  chk(() => !p0.err && fields.length >= 2, () => `A0. the probe: an Arabic plan whose titles name two or more fields with no Arabic name (titlesInEnglish.fields): ${short(p0)}`);
  chk(() => !p0.err && !(p0.j.plan && p0.j.plan.planId), () => `A1. that plan gets no plan id (an English title in an Arabic report is never silent): ${short(p0)}`);
  chk(() => fields.length && fields.every((f) => probs.includes(f)) && /displayNames/.test(probs) && /on purpose/.test(probs) && /Arabic/.test(probs), () => `A2. planProblems names each field and the two ways out (Arabic names approved in displayNames, or the field kept English on purpose): ${probs.slice(0, 600)}`);
  // the assistant drafts a name for each, the person approves: the plan gets its id, every title Arabic
  const drafts = {}; [...new Set([].concat(an.proposeYourself || [], fields, (an.notTranslated || []).map((x) => x.field)))].forEach((k, i) => { drafts[k] = 'حقل ' + ['أول', 'ثان', 'ثالث', 'رابع', 'خامس', 'سادس'][i % 6]; });
  const p1 = await s.call('plan_layout', Object.assign({}, base, { displayNames: drafts }));
  chk(() => !p1.err && p1.j.plan && p1.j.plan.planId && !((p1.j.arabicNames || {}).titlesInEnglish || {}).fields, () => `A3. drafted names approved: the plan gets its id: ${short(p1)}`);
  // each field kept English on purpose (its model name in displayNames): the plan gets its id, those titles wholly English
  const kept = Object.fromEntries(Object.keys(drafts).map((k) => [k, k.replace(/^.*?\[(.*)\]$/, '$1')]));
  const p2 = await s.call('plan_layout', Object.assign({}, base, { displayNames: kept }));
  chk(() => !p2.err && p2.j.plan && p2.j.plan.planId && !((p2.j.arabicNames || {}).titlesInEnglish || {}).fields, () => `A4. each field kept English on purpose: the plan gets its id: ${short(p2)}`);
  // an English plan on the same model: unchanged, its id given
  const p3 = await s.call('plan_layout', Object.assign({}, base, { lang: 'en' }));
  chk(() => !p3.err && p3.j.plan && p3.j.plan.planId, () => `A5. the English plan of the same model is unchanged: ${short(p3)}`);
  await s.close();
}

// ---------- W: F08, the approved scripts all or nothing ----------
{
  // two fix scripts (thousand separators, formats): the amount column has no format
  const model = (dir) => modelAt(dir, [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Order Date', 'dateTime')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
  const plan = async (s, dir) => { const p = await s.call('check_model_health', { path: dir }), id = p.j && p.j.plan && p.j.plan.planId; await s.call('approve_plan', { planId: id }); return { id, names: ((p.j && p.j.plan && p.j.plan.writesAfterGo) || []).length }; };
  const scripts = (dir) => tree(path.join(ROOT, dir)).filter((f) => /\.tmdl$|dataarcus-tmp/.test(f));
  for (const [k, at] of [['w1', 1], ['w2', 2]]) {
    model(k);
    const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: `ENOSPC:open:${at}` });
    const p = await plan(s, k), before = tree(path.join(ROOT, k));
    const x = await s.call('check_model_health', { path: k, planId: p.id });
    const added = tree(path.join(ROOT, k)).filter((f) => !before.includes(f));
    chk(() => p.names === 2, () => `W0. the plan names two scripts: ${p.names}`);
    chk(() => x.err && /Nothing was written/.test(x.t), () => `W1 (${k}, write ${at} fails). the answer is an error that says nothing was written: ${short(x)}`);
    chk(() => added.length === 0, () => `W2 (${k}). nothing of this call is left on disk (the script written before the failure removed too): ${JSON.stringify(added)}`);
    chk(() => /was not used/.test(x.t) && x.t.includes(p.id), () => `W3 (${k}). the plan is not used, and said: ${short(x)}`);
    const y = await s.call('check_model_health', { path: k, planId: p.id });
    chk(() => !y.err && y.j.fixes.THOUSANDS.fixScriptFile && y.j.fixes.FORMATS.fixScriptFile && scripts(k).length === 2, () => `W4 (${k}). the same plan writes both scripts once the cause is gone: ${short(y)} ${JSON.stringify(scripts(k))}`);
    await s.close();
  }
  // a script already there with the same content is not this call's: a later failure never removes it
  model('w3');
  let s = await serverClient(ROOT, {});
  let p = await plan(s, 'w3'); await s.call('check_model_health', { path: 'w3', planId: p.id }); await s.close();
  const both = scripts('w3'), sep = both.find((f) => /thousand separators/.test(f)), fmt = both.find((f) => /formats/.test(f));
  fs.unlinkSync(path.join(ROOT, 'w3', fmt));
  const keep = fs.readFileSync(path.join(ROOT, 'w3', sep), 'utf8');
  s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:open:1' });
  p = await plan(s, 'w3');
  const x = await s.call('check_model_health', { path: 'w3', planId: p.id });
  chk(() => both.length === 2 && x.err && JSON.stringify(scripts('w3')) === JSON.stringify([sep]) && fs.readFileSync(path.join(ROOT, 'w3', sep), 'utf8') === keep, () => `W5. a script that was already there (not created by this call) stays after the failure: ${JSON.stringify(scripts('w3'))} ${short(x)}`);
  await s.close();
}

// ---------- B: F02, a dense page of the EN-AR copy ----------
{
  fs.cpSync(path.join(HERE, 'test-models/service-orders'), path.join(ROOT, 'so'), { recursive: true, filter: (f) => !/make-report\.mjs$/.test(f) });
  // the overview's header and top quarter full: 32 narrow shapes side by side, 40 wide and 200 high (no box holds a button)
  const vdir = path.join(ROOT, 'so/Service Orders.Report/definition/pages/overview0001/visuals');
  for (let i = 0; i < 32; i++) {
    const name = 'dense' + String(i).padStart(2, '0'); fs.mkdirSync(path.join(vdir, name));
    fs.writeFileSync(path.join(vdir, name, 'visual.json'), JSON.stringify({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json', name, position: { x: i * 40, y: 0, z: 100 + i, height: 200, width: 40, tabOrder: 100 + i }, visual: { visualType: 'shape', objects: {} } }, null, 2));
  }
  const s = await serverClient(ROOT, {});
  const pbip = 'so/Service Orders.pbip';
  const p0 = await s.call('create_arabic_twin', { path: pbip, into: 'same' }), T0 = (p0.j && p0.j.texts) || [];
  let k = 0; const L = {}; T0.filter((t) => t.text != null).forEach((t) => { L[t.id] = t.draftArabic || `نص ${++k}`; });
  const p1 = await s.call('create_arabic_twin', { path: pbip, into: 'same', labels: L }), LG = (p1.j && p1.j.languages) || {};
  const pair = (LG.pairs || []).find((x) => x.english && x.english.id === 'overview0001') || {}, other = (LG.pairs || []).find((x) => x.english && x.english.id === 'detail000002') || {};
  const ov = (LG.buttons || []).filter((b) => b.goesTo === 'overview0001' || b.goesTo === (pair.arabic || {}).id);
  chk(() => !p1.err && ov.length === 2 && ov.some((b) => !b.placed), () => `B0. the dense overview: a language button with no free place: ${short(p1)}`);
  chk(() => pair.english && !pair.english.hidden && !pair.arabic.hidden, () => `B1. both pages of that pair stay in the tabs (a reader reaches each): ${JSON.stringify(pair)}`);
  chk(() => other.english && other.arabic && other.arabic.hidden !== other.english.hidden, () => `B2. a pair whose buttons are placed: one page hidden as before: ${JSON.stringify(other)}`);
  chk(() => ov.filter((b) => !b.placed).every((b) => /tabs/.test(String(b.why))), () => `B3. the button's why says both pages stay in the tabs (the approval page lists it): ${JSON.stringify(ov)}`);
  const id = p1.j && p1.j.plan && p1.j.plan.planId; await s.call('approve_plan', { planId: id });
  const wr = await s.call('create_arabic_twin', { path: pbip, into: 'same', planId: id });
  const COPY = path.join(ROOT, 'so/Service Orders (EN-AR).Report/definition/pages');
  const vis = (pid) => { try { return rd(path.join(COPY, pid, 'page.json')).visibility || 'shown'; } catch (e) { return 'missing'; } };
  chk(() => !wr.err && vis('overview0001') === 'shown' && vis(pair.arabic && pair.arabic.id) === 'shown', () => `B4. the written copy: both overview pages shown in the tabs: ${vis('overview0001')} ${vis(pair.arabic && pair.arabic.id)} ${short(wr)}`);
  await s.close();
}

// ---------- T: F11, a text answer capped ----------
{
  const { text } = await import('./lib/tool-answer.mjs'), { ANSWER_MAX } = await import('./lib/answer.mjs');
  const t = text('x'.repeat(ANSWER_MAX + 1)).content[0].text, u = text('y'.repeat(500)).content[0].text;
  chk(() => ANSWER_MAX === 40000 && t.length <= ANSWER_MAX && /cut/.test(t.slice(-300)), () => `T1. a string answer of 40,001 characters is cut to 40,000, the cut said: ${t.length} ${t.slice(-120)}`);
  chk(() => u === 'y'.repeat(500), () => 'T2. a short string answer is unchanged');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-cx1.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  cx1  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  cx1  ${checks} checks`);
