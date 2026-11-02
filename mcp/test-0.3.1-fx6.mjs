import './test-env.mjs';
// 0.3.1 FX6 (Codex's delta review of 28 Oct, D04 and D05, and FX4's Seen 1; mcp/work/FX6.md; written red first).
// Made-up models and the made-up twin project only: no employer or client data.
//   W1-W3  D04 (the owner, D-1027-12 "twin identical"): a shadow preset the cards take from the theme (a wildcard), not
//          their own, is cast to the other side on the Arabic pages of the written twin and of the English and Arabic
//          copy; the English pages and the original are unchanged
//   C1-C3  D05: the 40,000-character cut of a text answer never splits a control character's escape (‮,
//          1): a complete escape or none, never over 40,000, well-formed Unicode
//   N1-N2  FX4's Seen 1: suggest_fields reads its "not a category" words without regard to case ("Notes")
// (D01, the phone title: test-0.3.1-tw1.mjs P4-P6; D04 in the mirror: test-0.3.1-cx2.mjs S7-S10; D06, the watch's
// pages: scripts/test-microsoft-watch.mjs W13.)
//   node test-0.3.1-fx6.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.stack || e).slice(0, 400) }; } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx6-')));
process.env.DATAARCUS_ROOT = ROOT;
const DEF = 'Twin Sales.Report/definition', CARD = 'pages/p1overview/visuals/cardSales/visual.json';
const presetOf = (j) => { const e = (((j || {}).visual || {}).visualContainerObjects || {}).dropShadow, p = Array.isArray(e) && e[0] && e[0].properties ? e[0].properties.preset : null; return p && p.expr && p.expr.Literal ? p.expr.Literal.Value : null; };

try {
  // ---------- W: D04, the theme's shadow ----------
  {
    const D = path.join(ROOT, 'w');
    fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
    const tf = path.join(D, 'Twin Sales.Report/StaticResources/RegisteredResources/twin-theme.json'), th = rd(tf);
    th.visualStyles = { '*': { '*': { dropShadow: [{ show: true, preset: 'BottomRight' }] } } }; wr(tf, th);
    const before = fs.readFileSync(path.join(D, DEF, CARD), 'utf8');
    const Plans = await import('./lib/plans.mjs'), { register } = await import('./tools/create_arabic_twin.mjs'), { planTwin } = await import('./lib/arabic-twin.mjs');
    let handler = null; register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
    const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal's words */ } return { err: !!r.isError, t, j }; };
    const a = { path: 'w/Twin Sales.pbip', arabicMonth: false, labels: { 'title:p1overview/cardSales': 'المبيعات' } };
    const p = await call(a), id = p.j && p.j.plan && p.j.plan.planId; if (id) Plans.approve(id, 'user-in-browser');
    const w = id ? await call(Object.assign({}, a, { planId: id })) : p;
    const tw = get(() => rd(path.join(D, 'Twin Sales AR.Report/definition', CARD)));
    chk(() => !w.err && presetOf(tw) === "'BottomLeft'", () => `W1. the written twin's card, shadowed BottomRight by the theme's wildcard only, casts it BottomLeft (its own preset): ${w.err ? w.t.slice(0, 300) : JSON.stringify(tw && tw.visual && tw.visual.visualContainerObjects)}`);
    chk(() => fs.readFileSync(path.join(D, DEF, CARD), 'utf8') === before, () => 'W2. the original card is unchanged');
    // the English and Arabic copy: built as its plan builds it (the files it would write)
    const P = get(() => planTwin({ path: 'w/Twin Sales.pbip', arabicMonth: false, into: 'same', labels: a.labels }));
    const cards = get(() => P.copy.files.filter((f) => /\/visuals\/[^/]+\/visual\.json$/.test(f.rel)).map((f) => ({ rel: f.rel, j: f.data != null ? JSON.parse(String(f.data)) : rd(path.join(D, 'Twin Sales.Report', f.from)) }))
      .filter((x) => x.j && x.j.visual && x.j.visual.visualType === rd(path.join(D, DEF, CARD)).visual.visualType));
    const en = Array.isArray(cards) ? cards.filter((x) => x.rel.startsWith('definition/pages/p1overview/')) : [], ar = Array.isArray(cards) ? cards.filter((x) => !/^definition\/pages\/p\d/.test(x.rel)) : [];
    chk(() => en.length > 0 && ar.length > 0 && en.every((x) => presetOf(x.j) === null) && ar.every((x) => presetOf(x.j) === "'BottomLeft'"),
      () => `W3. the English and Arabic copy: the Arabic page's cards cast the theme's shadow BottomLeft, the English page's keep the theme's (no preset of their own): ${JSON.stringify(Array.isArray(cards) ? cards.map((x) => [x.rel, presetOf(x.j)]) : cards).slice(0, 600)}`);
  }

  // ---------- C: D05, the cut of a text answer ----------
  {
    const { text } = await import('./lib/tool-answer.mjs'), { ANSWER_MAX } = await import('./lib/answer.mjs');
    const SAID = '\n\n(This answer was cut', headOf = (t) => t.slice(0, t.indexOf(SAID));
    const n = headOf(text('x'.repeat(ANSWER_MAX + 1)).content[0].text).length;
    const wellFormed = (s) => !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(s);
    // Codex's input: 39,857 ASCII characters, U+202E, 300 more
    const t0 = text('a'.repeat(39857) + '‮' + 'b'.repeat(300)).content[0].text, h0 = headOf(t0);
    chk(() => t0.length <= ANSWER_MAX && !/\\u?[0-9a-f]{0,3}$/.test(h0) && wellFormed(t0), () => `C1. Codex's input: the cut answer ends with no part of an escape before its notice: ...${JSON.stringify(h0.slice(-12))} (${t0.length})`);
    const bad = [];
    [['‮', '\\u202e'], ['\u{e0001}', '\\ue0001'], ['\u0007', '\\u0007']].forEach(([ch, tok]) => { for (let k = 0; k <= tok.length + 1; k++) {
      const pre = 'a'.repeat(n - k), t = text(pre + ch + 'z'.repeat(300)).content[0].text, h = headOf(t);
      if (!(t.length <= ANSWER_MAX && wellFormed(t) && (h === pre || h.startsWith(pre + tok)) && !/\\(u[0-9a-f]{0,3})?$/.test(h))) bad.push({ tok, k, end: h.slice(-10), len: t.length }); } });
    chk(() => bad.length === 0, () => `C2. for each place of an escape at the cut: a complete escape or none, at most 40,000, well-formed: ${JSON.stringify(bad).slice(0, 500)}`);
    const pair = text('a'.repeat(n - 1) + '\u{1F600}' + 'z'.repeat(300)).content[0].text;
    chk(() => wellFormed(pair) && pair.length <= ANSWER_MAX, () => 'C3. guard: a surrogate pair at the cut is still never split');
  }

  // ---------- N: FX4's Seen 1, "Notes" with a capital ----------
  {
    const M = path.join(ROOT, 'n');
    wr(path.join(M, 'model.bim'), { name: 'Visits', compatibilityLevel: 1550, model: { tables: [{ name: 'Visits', columns: [
      { name: 'Notes', dataType: 'string', sourceColumn: 'Notes' }, { name: 'Region', dataType: 'string', sourceColumn: 'Region' },
      { name: 'Visit Date', dataType: 'dateTime', sourceColumn: 'Visit Date' }, { name: 'Amount', dataType: 'decimal', sourceColumn: 'Amount' }],
      measures: [{ name: 'Total Amount', expression: 'SUM ( Visits[Amount] )' }] }] } });
    const s = await serverClient(ROOT), call = async (nm, a) => { try { return await s.call(nm, a); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
    const key = (x) => (x && x.c != null ? `${x.t}[${x.c}]` : null);
    const catFields = (j) => [].concat(Object.values((j && j.cats) || {}), (j && j.slicers) || [], ((j && j.table) || []).filter((x) => x && x.c != null), (j && j.slicerPool) || []).map(key).filter(Boolean);
    const r = await call('suggest_fields', { path: 'n/model.bim', columnStats: { rows: { Visits: 400 }, distinct: { 'Visits[Notes]': 6, 'Visits[Region]': 5 } } });
    chk(() => !r.err && !catFields(r.j).includes('Visits[Notes]'), () => `N1. a text column named "Notes" (6 values) is never a category, as "notes" is not: ${r.err ? String(r.t).slice(0, 300) : JSON.stringify(catFields(r.j))}`);
    chk(() => !r.err && catFields(r.j).includes('Visits[Region]'), () => `N2. guard: Visits[Region] is still a category: ${r.err ? String(r.t).slice(0, 300) : JSON.stringify(catFields(r.j))}`);
    await s.close();
  }
} catch (e) {
  problems.push('the suite stopped: ' + String(e && e.stack || e).slice(0, 600));
} finally {
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL script=test-0.3.1-fx6.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  fx6  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  fx6  ${checks} checks`);
