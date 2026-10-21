// J12, the preview's fidelity (0.3 R&D under the owner's go of 18 Oct 2026), written red first. The laptop compared the
// preview of draft PR #37 (assets/js/page-preview.js: fromFiles + render) with Power BI Desktop's PDF export of the same
// written reports: every box was placed right, but the titles, two kinds of cut content and the words that carry meaning
// were not what Desktop draws.
//   F-01: a title is drawn at its visual's own size (the theme's 18pt = 24 on a 1920 page for charts and tables; a KPI
//         card's own 10pt) and wraps at the box's inner width by the writer's text measure: two lines in a ~508 slot
//   F-02: the placeholder plot starts below the title's lines (it shrinks by the lines the title takes)
//   F-03: "to check" (cut): a table column narrower than its header needs (0.3.0 D5, changed on purpose: check_report's
//         own measure, TABLE_HEADER_CUT, per column with a set width, no longer the sum of all headers); on the dense
//         page, not on the exec page
//   F-04: a column or line chart whose category labels will slant (months, quarters, weekdays: known lengths): a note
//         (0.3.0 D5, changed on purpose: slanted labels are not cut, Desktop 2.159 drew the laptop's T1b line chart
//         whole, check_report has no such finding); an unknown category is said unknown, never assumed to fit, never a flag
//   F-05: page buttons drawn with their names, the current page's underlined; the report title at its own size
//   F-06: a KPI card's value drawn where its file aligns it: right on an Arabic page as the writer (and the twin from
//         rc.24, PR #55) writes it, left where a file still says left
//   F-07: still deterministic, still escaped, still no number, still the old pages' boxes
//   node test-0.3-preview-fidelity.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; msg = ((m) => () => m() + ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')')(msg); } check(ok, ok ? '' : (() => { try { return msg(); } catch (e) { return 'unexpected shape'; } })()); };

const P = require('../assets/js/page-preview.js'), Bind = require('../assets/js/pbip-bind.js');
// one visual's group in the picture, its title lines, its placeholder's top, its flags and notes
const groupOf = (svg, i) => { const m = new RegExp(`<g class="v" data-i="${i}"[^>]*>([\\s\\S]*?)</g><!--/v-->`).exec(svg); return m ? m[0] : ''; };
const titleLines = (g) => [...g.matchAll(/<text class="t"[^>]*\sy="([\d.]+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({ y: +m[1], size: +m[2], text: m[3] }));
const phTop = (g) => { const ph = /<g class="ph">([\s\S]*?)<\/g>/.exec(g); if (!ph) return null; const ys = [...ph[1].matchAll(/\s(?:y|y1|cy)="([\d.]+)"/g)].map((m) => +m[1]).concat([...ph[1].matchAll(/points="([^"]+)"/g)].flatMap((m) => m[1].split(' ').map((p) => +p.split(',')[1]))); return ys.length ? Math.min(...ys) : null; };
const flagsOf = (svg) => [...svg.matchAll(/<g class="flag" data-i="(\d+)" data-flag="([a-z]+)"/g)].map((m) => ({ i: +m[1], kind: m[2] }));
const notesOf = (svg) => [...svg.matchAll(/<g class="note" data-i="(\d+)" data-note="([a-z]+)"/g)].map((m) => ({ i: +m[1], kind: m[2] }));
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const near = (a, b, d) => Math.abs(a - b) <= (d == null ? 0.051 : d);

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fidelity-'));
try {
  fs.cpSync(path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
  fs.cpSync(path.join(HERE, 'test-models/arabic-long-names'), path.join(ROOT, 'arabic'), { recursive: true });
  process.env.DATAARCUS_ROOT = ROOT;
  const { loadModel } = await import('./lib/model.mjs');
  const { planLayout } = await import('./lib/design.mjs');
  const { scopeOf } = await import('./lib/scope.mjs');
  const { planPreview } = await import('./lib/plan-lint.mjs');
  const large = loadModel('large', { root: ROOT }), lsc = scopeOf(large, { focus: 'logistics' });
  const T = (t) => large.tables.find((x) => x.name === t);
  const meas = (t, n) => { const k = Bind.measureOf(T(t), n, large.tables); return { t: k.t, m: k.m, variant: false }; };
  // the laptop's dense page: the ops layout with 6 KPI cards and the filter rail (three ~508 slots a row), its table of 4 columns
  const F = { table: [Bind.fieldOf(T('Lane'), 'Lane Region'), Bind.fieldOf(T('Lane'), 'Lane Code'), meas('Shipments', 'Shipments Total Net Amount'), meas('Shipments', 'Shipments Total Discount')] };
  const plan = (layout, extra) => planPreview({ m: large, tables: lsc.tables, design: planLayout(Object.assign({ layout, lang: 'en' }, extra)).design, lang: 'en', F });
  const dense = plan('ops', { kpis: 6, filters: 'left' }).pages[0], exec = plan('exec').pages[0];
  const dsvg = P.render(dense), esvg = P.render(exec);
  const idx = (page, type, w) => page.visuals.findIndex((v) => v.type === type && !v.panel && (w == null || Math.abs(v.w - w) <= 3));
  chk(() => dense.w === 1920 && idx(dense, 'lineChart', 509) >= 0 && idx(dense, 'tableEx', 507) >= 0 && dense.visuals.filter((v) => v.type === 'cardVisual' && v.title).length === 6, () => `the dense page as the laptop's: ${dense.visuals.map((v) => `${v.type} ${v.w}`).join(', ')}`);

  // ---------- F-01: titles at their own size, wrapped ----------
  const li = idx(dense, 'lineChart', 509), lg = groupOf(dsvg, li), ll = titleLines(lg);
  chk(() => ll.length === 2 && ll.every((l) => near(l.size, 24)), () => `F-01. the 509-wide line chart's title on 2 lines at 24 (18pt): ${JSON.stringify(ll)}`);
  const slots = dense.visuals.map((v, i) => ({ v, i })).filter(({ v }) => /^(lineChart|clusteredBarChart|clusteredColumnChart|donutChart|tableEx)$/.test(v.type) && !v.panel && v.w >= 505 && v.w <= 510);
  chk(() => slots.length >= 4 && slots.every(({ i }) => titleLines(groupOf(dsvg, i)).length === 2), () => `F-01. every chart and table title in a ~508 slot takes 2 lines on the dense page: ${slots.map(({ i, v }) => `${v.type} ${titleLines(groupOf(dsvg, i)).length}`).join(', ')}`);
  chk(() => titleLines(lg).map((l) => l.text).join(' ') === dense.visuals[li].title, () => `F-01. the lines are the whole title, split at words: ${JSON.stringify(titleLines(lg).map((l) => l.text))}`);
  const { textWidth } = require('../assets/js/text-measure.js');
  chk(() => ll.every((l) => textWidth(l.text, 18, true, 'Segoe UI') <= 509 - 2 * 16), () => `F-01. each line fits the box's inner width by the writer's measure (509 less 16 a side)`);
  const ci = dense.visuals.findIndex((v) => v.type === 'cardVisual' && v.title), cl = titleLines(groupOf(dsvg, ci));
  chk(() => cl.length >= 1 && near(cl[0].size, 13.3, 0.1), () => `F-01. a KPI card's title at its own 10pt (13.3): ${JSON.stringify(cl)}`);
  const wide = exec.visuals.findIndex((v) => v.type === 'lineChart' && !v.panel);
  chk(() => wide >= 0 && titleLines(groupOf(esvg, wide)).length === 1 && near(titleLines(groupOf(esvg, wide))[0].size, 24), () => `F-01. a title that fits stays on one line: ${JSON.stringify(titleLines(groupOf(esvg, wide)))}`);

  // ---------- F-02: the plot shrinks by the title's lines ----------
  const one = Object.assign({}, dense, { visuals: dense.visuals.map((v, i) => (i === li ? Object.assign({}, v, { title: 'Net by Month' }) : v)) });
  const lg1 = groupOf(P.render(one), li), top2 = phTop(lg), top1 = phTop(lg1);
  chk(() => top2 != null && top2 > ll[1].y, () => `F-02. the plot starts below the title's 2nd line: plot ${top2}, 2nd line ${ll[1] && ll[1].y}`);
  // (measured on the 508 bar chart: its first bar sits at a fixed share of the plot, a line's highest point moves with it)
  const bi = idx(dense, 'clusteredBarChart', 508), bg = groupOf(dsvg, bi), bone = Object.assign({}, dense, { visuals: dense.visuals.map((v, i) => (i === bi ? Object.assign({}, v, { title: 'Net by Hub' }) : v)) });
  const btop2 = phTop(bg), btop1 = phTop(groupOf(P.render(bone), bi));
  chk(() => titleLines(bg).length === 2 && btop1 != null && btop2 - btop1 >= 30 && btop2 - btop1 <= 40, () => `F-02. a 2-line title takes about one line (36 at 24) more from the plot than a 1-line one: ${btop1} -> ${btop2}`);

  // ---------- F-03: the table's columns cut ----------
  const ti = idx(dense, 'tableEx', 507), eti = idx(exec, 'tableEx');
  const dfl = flagsOf(dsvg), efl = flagsOf(esvg);
  // (today's writer writes 3 of the 4 asked columns in this slot, its text at 10pt: 106 + 94 + 217 = 417 of 471, not cut;
  // the laptop's written table had all 4: 610 of 471. The rule is tested on both)
  const dt = dense.visuals[ti];
  chk(() => dt && dt.columns.length === 3 && near(dt.headerSize, 10) && !P.check(dense).some((f) => f.i === ti), () => `F-03. the planned dense table (3 columns at 10pt, as the writer writes it) fits: ${JSON.stringify(dt && { columns: dt.columns, size: dt.headerSize })} ${JSON.stringify(P.check(dense).filter((f) => f.i === ti))}`);
  // (D5: the laptop's 4 columns in the writer's equal shares of the table's room, 471 / 4: a set width each, as check_report judges)
  const laptop = Object.assign({}, dense, { visuals: dense.visuals.map((v, i) => (i === ti ? Object.assign({}, v, { columns: F.table.map((f) => ({ name: f.c != null ? f.c : f.m, width: Math.floor((v.w - 36) / 4) })) }) : v)) }), ls = P.render(laptop);
  chk(() => P.check(laptop).some((f) => f.i === ti && f.kind === 'cut' && /column/.test(f.why || '')) && flagsOf(ls).some((f) => f.i === ti && f.kind === 'cut'), () => `F-03. the dense page's 507-wide table with the laptop's 4 columns is flagged cut (its headers need more than its width): ${JSON.stringify(P.check(laptop).filter((f) => f.i === ti))}`);
  chk(() => eti >= 0 && !efl.some((f) => f.i === eti), () => `F-03. the exec page's table is not flagged: ${JSON.stringify(efl)} ${JSON.stringify(exec.visuals[eti] && { w: exec.visuals[eti].w, columns: exec.visuals[eti].columns })}`);

  // ---------- F-04: slanted category labels ----------
  chk(() => P.notes(dense).some((f) => f.i === li && f.kind === 'slant' && /slant/.test(f.why || '')) && notesOf(dsvg).some((f) => f.i === li && f.kind === 'slant') && !dfl.some((f) => f.i === li), () => `F-04. the dense page's 509-wide line chart by 12 months (42 a month, a 3-letter month needs 65.5 at 15pt) has the note, no flag: ${JSON.stringify(P.notes(dense).filter((f) => f.i === li))}`);
  chk(() => !efl.length && !P.check(exec).length, () => `F-04. nothing on the exec page is flagged: ${JSON.stringify(P.check(exec))}`);
  const lab = (category, w, extra) => P.notes({ w: 1920, h: 1080, visuals: [Object.assign({ type: 'clusteredColumnChart', x: 10, y: 10, w, h: 400, title: 'x', category, labelSize: 15 }, extra || {})] }).filter((f) => f.kind === 'slant');
  chk(() => lab('Month Short', 509).some((f) => /slant/.test(f.why)) && !lab('Month Short', 1242).length, () => 'F-04. 12 short months slant in 509, stand in 1242');
  chk(() => lab('Month Name', 1000).some((f) => /slant/.test(f.why)) && !lab('Month Name', 1400).length, () => `F-04. full month names (up to 9 letters: 116.5 a month) slant in 1000, stand in 1400: ${JSON.stringify(lab('Month Name', 1000))}`);
  chk(() => !lab('Quarter', 509).length && lab('Weekday Short', 400).some((f) => /slant/.test(f.why)), () => 'F-04. 4 quarters stand in 509; 7 short weekdays slant in 400');
  chk(() => lab('Month Short', 509, { labelSize: 10 }).length === 0 || lab('Month Short', 300, { labelSize: 10 }).some((f) => /slant/.test(f.why)), () => 'F-04. the rule follows the label size');
  const unk = { w: 1920, h: 1080, visuals: [{ type: 'clusteredColumnChart', x: 10, y: 10, w: 509, h: 400, title: 'Net by Lane Region', category: 'Lane Region', labelSize: 15 }] };
  chk(() => !P.check(unk).length && P.notes(unk).some((f) => f.i === 0 && f.kind === 'labels'), () => `F-04. an unknown category: no flag (no guess), a note that its labels' length is unknown: ${JSON.stringify(P.check(unk))} ${JSON.stringify(P.notes ? P.notes(unk) : null)}`);
  const us = P.render(unk), usa = P.render(Object.assign({}, unk, { rtl: true }), { lang: 'ar' });
  chk(() => notesOf(us).some((f) => f.i === 0) && texts(us).includes(P.WORDS.en.labels) && texts(usa).includes(P.WORDS.ar.labels) && !/stroke-dasharray/.test(/<g class="note"[\s\S]*?<\/g>/.exec(us)[0]), () => 'F-04. the note is said in a quiet grey tag, in the preview\'s language, not a dashed "to check" outline');
  chk(() => !/data-flag="labels"/.test(us) && /aria-label="[^"]*, 0 to check|aria-label="(?![^"]*to check)/.test(us), () => 'F-04. a note is not counted as a flag');

  // ---------- F-05: page buttons and the report title ----------
  const btn = (page, svg) => page.visuals.map((v, i) => ({ v, i })).filter(({ v }) => v.type === 'actionButton' && v.nav).map(({ i }) => ({ i, g: groupOf(svg, i) }));
  const db = btn(dense, dsvg);
  chk(() => db.length === 2 && texts(db.map((b) => b.g).join('')).join('|') === 'Operations monitor|Details', () => `F-05. the page buttons drawn with their names: ${db.map((b) => texts(b.g).join('/')).join(' | ')}`);
  chk(() => /data-current="1"/.test(db[0].g) && !/data-current="1"/.test(db[1].g), () => 'F-05. on page 1 the first button is the current page');
  const under = (page, svg, b) => { const v = page.visuals[b.i]; return /<line class="u"/.test(b.g) || page.visuals.some((s, k) => s.type === 'shape' && s.h <= 6 && s.y >= v.y + v.h - 4 && s.y <= v.y + v.h + 12 && s.x < v.x + v.w && s.x + s.w > v.x && new RegExp(`<g class="v" data-i="${k}"[^>]*data-kind="shape"`).test(svg)); };
  chk(() => under(dense, dsvg, db[0]) && !/<line class="u"/.test(db[1].g), () => 'F-05. the current page\'s button is underlined (the writer\'s bar under it, or the preview\'s own line); the other is not');
  const second = plan('ops', { kpis: 6, filters: 'left' }).pages[1], s2 = P.render(second), sb = btn(second, s2);
  chk(() => sb.length === 2 && !/data-current="1"/.test(sb[0].g) && /data-current="1"/.test(sb[1].g) && under(second, s2, sb[1]), () => 'F-05. on page 2 the second button is the current page, underlined');
  const bare = { w: 1280, h: 720, id: 'p1', visuals: [{ type: 'actionButton', x: 10, y: 10, w: 120, h: 30, text: 'Overview', textSize: 12, nav: 'p1' }, { type: 'actionButton', x: 140, y: 10, w: 120, h: 30, text: 'Details', textSize: 12, nav: 'p2' }] };
  const bs = P.render(bare);
  chk(() => /<line class="u"/.test(groupOf(bs, 0)) && !/<line class="u"/.test(groupOf(bs, 1)), () => 'F-05. without the writer\'s bar the preview underlines the current page\'s button itself');
  const hi = dense.visuals.findIndex((v) => v.type === 'textbox' && v.title === 'Plan'), hl = /<text class="t"[^>]*font-size="([\d.]+)"[^>]*font-weight="(\w+)"[^>]*>Plan</.exec(groupOf(dsvg, hi));
  chk(() => hl && near(+hl[1], 26.7, 0.1) && hl[2] === 'bold', () => `F-05. the report title at its own 20pt bold (26.7): ${hl && hl.slice(1).join()}`);

  // ---------- F-06: the KPI value where its file aligns it ----------
  const arabic = loadModel('arabic', { root: ROOT }), asc = scopeOf(arabic, {});
  const ap = planPreview({ m: arabic, tables: asc.tables, design: planLayout({ layout: 'exec', lang: 'ar' }).design, lang: 'ar' }).pages[0], asvg = P.render(ap, { lang: 'ar' });
  const valueBox = (svg, i) => { const g = groupOf(svg, i), m = /<rect class="kv" x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/.exec(g); return m ? { x: +m[1], w: +m[2] } : null; };
  const kp = ap.visuals.map((v, i) => ({ v, i })).filter(({ v }) => v.type === 'cardVisual' && v.title && !v.panel);
  chk(() => kp.length === 4 && kp.every(({ v }) => v.valueAlign === 'right'), () => `F-06. the Arabic plan's KPI values are written right-aligned, and read so: ${kp.map(({ v }) => v.valueAlign).join()}`);
  chk(() => kp.every(({ v, i }) => { const b = valueBox(asvg, i); return b && b.x + b.w > v.x + v.w * 0.8 && b.x > v.x + v.w / 3; }), () => `F-06. drawn at the card's right: ${kp.map(({ v, i }) => JSON.stringify([v.x, v.w, valueBox(asvg, i)])).join(' ')}`);
  const dk = dense.visuals.map((v, i) => ({ v, i })).filter(({ v }) => v.type === 'cardVisual' && v.title);
  chk(() => dk.every(({ v, i }) => v.valueAlign === 'left' && valueBox(dsvg, i) && valueBox(dsvg, i).x < v.x + v.w * 0.2), () => 'F-06. the English plan\'s KPI values at the card\'s left, as written');
  // a twin page (right to left) as the file says: rc.24 (#55) writes 'right'; a twin from before it still says 'left'
  const files = (align) => [
    { path: 'definition/pages/pages.json', data: JSON.stringify({ pageOrder: ['p1'] }) },
    { path: 'definition/pages/p1/page.json', data: JSON.stringify({ name: 'p1', displayName: 'الصفحة', width: 1280, height: 720 }) },
    { path: 'definition/pages/p1/visuals/k1/visual.json', data: JSON.stringify({ name: 'k1', position: { x: 900, y: 20, z: 1, width: 360, height: 120 }, visual: { visualType: 'cardVisual', query: { queryState: { Data: { projections: [{ field: { Measure: { Expression: { SourceRef: { Entity: 'S' } }, Property: 'M' } }, queryRef: 'S.M' }] } } },
      objects: { value: [{ properties: Object.assign({ fontSize: { expr: { Literal: { Value: '28D' } } } }, align ? { horizontalAlignment: { expr: { Literal: { Value: `'${align}'` } } } } : {}), selector: { id: 'default' } }] },
      visualContainerObjects: { title: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: "'المبيعات'" } } }, fontSize: { expr: { Literal: { Value: '10D' } } } } }] } } }) }];
  const twin = (align) => { const pg = P.fromFiles(files(align), { rtl: true })[0]; return { pg, b: valueBox(P.render(pg, { lang: 'ar' }), 0) }; };
  chk(() => { const t = twin('right'); return t.pg.visuals[0].valueAlign === 'right' && t.b.x + t.b.w > 900 + 360 * 0.8; }, () => `F-06. a twin's card written 'right' (rc.24) is drawn at the right: ${JSON.stringify(twin('right').b)}`);
  chk(() => { const t = twin('left'); return t.pg.visuals[0].valueAlign === 'left' && t.b.x < 900 + 360 * 0.2; }, () => `F-06. a card still written 'left' on a right-to-left page is drawn at the left, as Desktop shows it: ${JSON.stringify(twin('left').b)}`);
  chk(() => { const t = twin(null); return t.b && Math.abs(t.b.x + t.b.w / 2 - (900 + 180)) < 40; }, () => `F-06. no alignment written: Power BI's default, centred: ${JSON.stringify(twin(null).b)}`);
  chk(() => { const t = twin('right'); return titleLines(groupOf(P.render(t.pg, { lang: 'ar' }), 0)).some((l) => near(l.size, 13.3, 0.1)); }, () => 'F-06. the twin card\'s title at its own 10pt');

  // ---------- F-07: still deterministic, escaped, value free ----------
  chk(() => P.render(dense) === dsvg && P.render(ap, { lang: 'ar' }) === asvg, () => 'F-07. the same page gives the same picture');
  const evil = Object.assign({}, bare, { visuals: bare.visuals.map((v) => Object.assign({}, v, { text: '<script>x</script>" onload="y' })) });
  chk(() => !/<script|\son[a-z]+="/i.test(P.render(evil)), () => 'F-07. a button\'s name is escaped');
  const ph = [...dsvg.matchAll(/<g class="ph">([\s\S]*?)<\/g>/g)].map((m) => m[1]);
  chk(() => ph.length >= 10 && ph.every((x) => !/<text/.test(x)), () => 'F-07. the placeholders still hold no text');
  // (the writer's own "(2)" and "(3)" titles have digits: a text with a digit must be a piece of a name the page has)
  const names = dense.visuals.map((v) => String(v.title || '') + ' ' + String(v.text || '')).join(' | ');
  chk(() => texts(dsvg).every((t) => !/\d/.test(t) || names.includes(t)), () => `F-07. no number in the dense page's picture but the names': ${texts(dsvg).filter((t) => /\d/.test(t) && !names.includes(t)).join(' | ')}`);
} finally { fs.rmSync(ROOT, { recursive: true, force: true }); }

console.log(problems.length ? `FAIL  fidelity  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  fidelity  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
