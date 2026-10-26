// 0.3.1 BD1 item 3 (written red first): the bidi lab for the laptop (mcp/lab/bidi-lab.mjs). It writes one made-up project
// into an empty folder (and refuses any other), Microsoft's validator finds no error, and every kind x position x variant
// is in the files exactly as its rule says, read back from the written files (never from the lab's own list):
//   V0 raw; V1 isolateLatin; V2 V1 with U+200F first; V3 U+2067 V1 U+2069; V4 U+202B V1 U+202C.
// Each label is plain ASCII, in a text box of its own, never inside a tested text. The model's rows are typed.
//   node test-0.3.1-bidi-lab.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url), TM = require('../assets/js/text-measure.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-bidi-lab-')));

let Lab = null; try { Lab = await import('./lab/bidi-lab.mjs'); } catch (e) { Lab = null; }
chk(() => Lab && typeof Lab.writeLab === 'function', () => 'B0. mcp/lab/bidi-lab.mjs exports writeLab');

// the rule, written here on its own (the lab's must agree)
const TEXTS = { start: 'Department: عدد الأوامر في كل شهر', middle: 'عدد الأوامر حسب Department في كل شهر', end: 'عدد الأوامر في كل شهر حسب Department' };
const RULE = { V0: (t) => t, V1: (t) => TM.isolateLatin(t), V2: (t) => (TM.isolateLatin(t)[0] === '‏' ? '' : '‏') + TM.isolateLatin(t), V3: (t) => '⁧' + TM.isolateLatin(t) + '⁩', V4: (t) => '‫' + TM.isolateLatin(t) + '‬' };
const KINDS = ['textbox', 'title', 'cardlabel', 'cardcallout', 'button', 'tableheader', 'slicerheader', 'tooltippage', 'pagename'];
const POS = ['start', 'middle', 'end'], VAR = ['V0', 'V1', 'V2', 'V3', 'V4'];

if (Lab) {
  fs.mkdirSync(path.join(ROOT, 'full')); fs.writeFileSync(path.join(ROOT, 'full', 'x.txt'), 'x');
  let refused = false; try { Lab.writeLab(path.join(ROOT, 'full')); } catch (e) { refused = /empty folder/.test(String(e.message)); }
  chk(() => refused && fs.readdirSync(path.join(ROOT, 'full')).join() === 'x.txt', () => 'B1. a folder that is not empty is refused, nothing written');

  const r = Lab.writeLab(path.join(ROOT, 'lab'));
  chk(() => r.validator.exit === 0 && /"errorCount":0/.test(r.validator.text), () => `B2. Microsoft's validator: 0 errors: ${r.validator.text.slice(0, 400)}`);
  const DEF = path.join(r.report, 'definition'), J = (...p) => JSON.parse(fs.readFileSync(path.join(DEF, ...p), 'utf8'));
  const order = J('pages', 'pages.json').pageOrder;
  chk(() => order.length === 38 && order.every((id) => fs.existsSync(path.join(DEF, 'pages', id, 'page.json'))), () => `B3. 38 pages (7 grids, the tooltips page, 15 tooltip pages, 15 named pages), each written: ${order.length}`);

  // read every tested text back from the files, by where its kind puts it
  const visuals = (pg) => { const d = path.join(DEF, 'pages', pg, 'visuals'); return fs.existsSync(d) ? fs.readdirSync(d).map((n) => J('pages', pg, 'visuals', n, 'visual.json')) : []; };
  const lit = (e) => { const v = e && e.expr && e.expr.Literal && e.expr.Literal.Value; return typeof v === 'string' ? v.replace(/^'|'$/g, '').replace(/''/g, "'") : null; };
  const props = (v, card) => (((v.visual.objects || {})[card] || [])[0] || {}).properties || {};
  const bim = JSON.parse(fs.readFileSync(path.join(path.dirname(r.report), 'Lab.SemanticModel', 'model.bim'), 'utf8')), T0 = bim.model.tables[0];
  const callout = (m) => { const x = T0.measures.find((y) => y.name === m); return x ? JSON.parse(x.expression.replace(/""/g, '\\"')) : null; };
  const PAGE = { textbox: 'p1textbox', title: 'p2title', cardlabel: 'p3cardlabel', cardcallout: 'p3cardcallout', button: 'p4button', tableheader: 'p5tableheader', slicerheader: 'p6slicerheader' };
  const read = (kind, id, pos) => {
    if (kind === 'tooltippage') return J('pages', 'p7tip' + id + pos, 'page.json').displayName;
    if (kind === 'pagename') return J('pages', 'p8name' + id + pos, 'page.json').displayName;
    const v = visuals(PAGE[kind]).find((x) => x.name === 'test' + id + pos); if (!v) return null;
    if (kind === 'textbox') return props(v, 'general').paragraphs[0].textRuns[0].value;
    if (kind === 'title') return lit(v.visual.visualContainerObjects.title[0].properties.text);
    if (kind === 'button') return lit(props(v, 'text').text);
    if (kind === 'cardcallout') return callout(v.visual.query.queryState.Values.projections[0].field.Measure.Property);
    return v.visual.query.queryState.Values.projections[0].displayName;
  };
  const got = KINDS.flatMap((k) => POS.flatMap((pos) => VAR.map((id) => ({ k, pos, id, t: (() => { try { return read(k, id, pos); } catch (e) { return null; } })() }))));
  const wrong = got.filter((g) => g.t !== RULE[g.id](TEXTS[g.pos]));
  chk(() => got.length === 135 && wrong.length === 0, () => `B4. all 135 tested texts (9 kinds x 3 positions x 5 variants) in the files, each exactly its variant's rule: ${wrong.length} wrong, e.g. ${JSON.stringify(wrong.slice(0, 3))}`);
  chk(() => RULE.V2(TEXTS.start) === RULE.V1(TEXTS.start) && RULE.V2(TEXTS.middle) !== RULE.V1(TEXTS.middle) && RULE.V2(TEXTS.end) !== RULE.V1(TEXTS.end) && TM.isolateLatin(TEXTS.middle)[0] !== '‏',
    () => 'B5. V2 adds U+200F where V1 has none at the start (the middle and end runs); for a run at the start V1 already opens with it');
  // the labels: plain ASCII text boxes of their own beside each tested box; no tested text holds a label
  const grid = Object.values(PAGE).concat(['p7tooltips']);
  const labels = grid.flatMap((pg) => visuals(pg).filter((v) => /^lbl/.test(v.name)));
  chk(() => labels.length === 8 * 15 && labels.every((v) => /^[\x20-\x7e]+$/.test(props(v, 'general').paragraphs[0].textRuns[0].value) && /^V[0-4] (start|middle|end)$/.test(props(v, 'general').paragraphs[0].textRuns[0].value)),
    () => `B6. every grid cell has its ASCII label ("V2 middle") in a text box of its own: ${labels.length}`);
  chk(() => got.every((g) => g.t && !/V[0-4] (start|middle|end)/.test(g.t)) && order.filter((id) => /^p[78](tip|name)/.test(id)).every((id) => visuals(id).some((v) => v.name === 'lbl' && /^[\x20-\x7e]+$/.test(props(v, 'general').paragraphs[0].textRuns[0].value))),
    () => 'B7. no tested text holds its label; each named page and tooltip page carries its own ASCII label box');
  const tips = order.filter((id) => /^p7tip/.test(id)).map((id) => J('pages', id, 'page.json'));
  const bound = visuals('p7tooltips').filter((v) => v.visual.visualContainerObjects && v.visual.visualContainerObjects.visualTooltip).map((v) => lit(v.visual.visualContainerObjects.visualTooltip[0].properties.section));
  chk(() => tips.length === 15 && tips.every((p) => p.type === 'Tooltip' && p.pageBinding && p.pageBinding.type === 'Tooltip') && tips.every((p) => bound.includes(p.name)), () => `B8. 15 tooltip pages, each bound to a card on p7tooltips: ${tips.length}, ${bound.length}`);
  const m = T0.partitions[0].source.expression;
  chk(() => /#table\(type table \[#"Department" = text, #"Month Start" = datetime, #"Orders" = Int64\.Type\]/.test(m) && T0.columns.every((c) => c.dataType), () => `B9. typed Power Query rows and typed columns: ${m.slice(0, 160)}`);
  chk(() => Lab.keyTable().split('\n').length === 2 + 135 && Lab.keyRows().every((x) => order.includes(x.page)) && JSON.stringify(Lab.PAGE_IDS) === JSON.stringify(order), () => 'B10. the key names all 135 tested texts, each on a page the report has; --pages lists the report\'s pages in order');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-bidi-lab.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  bidi-lab  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  bidi-lab  ${checks} checks`);
process.exit(0);
