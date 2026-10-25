// 0.2.9 items 12 and 13 (the owner's 0.2.9 plan, approved 11 Oct 2026), written red first:
// - LAYER checks (check_report), O-16: a working hand-built report showed 10 validator "errors" that Power BI Desktop
//   accepts (dataarcus-engine business/research/VALIDATOR-LAB.md). Every finding now says which of three kinds it is:
//   Desktop opens it and only Fabric or strict validation would refuse it, it can break the report in Desktop, or it is
//   a DataArcus rule; one plain sentence per kind. The codes stay verbatim.
// - LAYER model reading (check_model_health): the folder bug of the 0.2.8 beta (business/beta/RESULTS-0.2.8.md, task 3):
//   the reports of another project in the same folder were counted as the checked model's broken reports and the chat
//   suggested deleting good reports. Only reports whose definition.pbir points at the checked model are read.
// Every fixture is made up here (no real file). test.mjs runs it with its own client (import { v029checks }); run alone
// it starts the server itself:   node test-0.2.9-checks.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';
import { getCapabilities } from '@microsoft/powerbi-core-visual-schema';
import { knownGap } from './lib/check-report.mjs';
// the validator version is set once, in mcp/package.json; the texts name the installed one (16 Oct 2026)
const VALIDATOR_PIN = JSON.parse(fs0.readFileSync(new URL('./package.json', import.meta.url), 'utf8')).dependencies['@microsoft/powerbi-report-authoring-cli'];

// call: the helper that gets approved plans (test-plan.mjs)
export async function v029checks({ call, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8')), W = (f, j) => fs.writeFileSync(f, JSON.stringify(j, null, 2));
  const tree = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)]));
  const model = (dir, name, table, cols, measures) => { fs.mkdirSync(path.join(ROOT, dir, name + '.SemanticModel'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, dir, name + '.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: table, partitions: mp(table), columns: cols, measures }] } })); };

  // ---------- 1. LAYER checks: check_report's three kinds (O-16) ----------
  {
    const dir = 'ck';
    model(dir, 'M', 'Sales', [col('Amount', 'double'), col('Region', 'string'), col('Order Date', 'dateTime')], [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }]);
    const pl = await ask('plan_layout', { path: dir, layout: 'exec', lang: 'en' });
    const made = await ask('create_report', { path: dir, name: 'Clean', design: pl.j && pl.j.design, noDataMessage: false });
    chk(() => !made.err, () => `the made-up report must be written: ${short(made)}`);
    const D = path.join(ROOT, dir), copy = (name) => { const R = path.join(D, name + '.Report'); fs.cpSync(path.join(D, 'Clean.Report'), R, { recursive: true });
      const pbip = J(path.join(D, 'Clean.pbip')); pbip.artifacts[0].report.path = name + '.Report'; W(path.join(D, name + '.pbip'), pbip); return R; };
    const visualOf = (R, type) => tree(path.join(R, 'definition/pages')).find((f) => f.endsWith('visual.json') && J(f).visual && J(f).visual.visualType === type);
    const themeOf = (R) => { const d = path.join(R, 'StaticResources/RegisteredResources'); return path.join(d, fs.readdirSync(d).find((n) => n.endsWith('.json'))); };
    const KINDS = ['desktopOpens', 'canBreak', 'dataarcusRule'];
    // (polish round P2) every written slicer carries the dropdown slicer's rounded box. Microsoft's visual catalog 0.1.1
    // did not list it (one known note per slicer); 0.1.3, the version mcp/package.json pins since U1 (19 Oct 2026), lists
    // slicer.dropdown and the validator judges the box itself: no note (KN 0). Changed on purpose in U1: was SL notes.
    const SL = tree(path.join(D, 'Clean.Report/definition/pages')).filter((f) => f.endsWith('visual.json') && J(f).visual && J(f).visual.visualType === 'slicer').length;
    chk(() => SL >= 1, () => 'the made-up report must have a slicer');
    const LISTED = !!((getCapabilities('slicer') || {}).objects || {}).dropdown, KN = LISTED ? 0 : SL;
    chk(() => LISTED, () => 'U1: the pinned catalog lists slicer.dropdown (0.1.3)');

    // a. the five things a working hand-built report showed (VALIDATOR-LAB, 10 Oct): no $schema in the .pbip and in
    //    definition.pbir, the theme's own name not its file name, an unknown theme card and property, a gradient stop
    //    colour that is not #RRGGBB
    const S = copy('Strict');
    { const pbip = J(path.join(D, 'Strict.pbip')); delete pbip.$schema; W(path.join(D, 'Strict.pbip'), pbip);
      const pbir = J(path.join(S, 'definition.pbir')); delete pbir.$schema; W(path.join(S, 'definition.pbir'), pbir);
      const tf = themeOf(S), th = J(tf); th.name = 'Another name'; th.visualStyles = th.visualStyles || {};
      th.visualStyles['*'] = th.visualStyles['*'] || {}; th.visualStyles['*']['*'] = Object.assign({}, th.visualStyles['*']['*'], { notACard: [{ show: true }] });
      th.visualStyles.lineChart = { '*': { title: [{ notAProperty: true }] } }; W(tf, th);
      const cf = visualOf(S, 'clusteredColumnChart') || visualOf(S, 'clusteredBarChart'), v = J(cf);   /* (changed in writer round 9, D15: a column chart by a text category whose columns can't hold a 12-letter name is written as a bar chart; any chart carries the gradient's stop) */ v.visual.objects = Object.assign({}, v.visual.objects, { dataPoint: [{ properties: { fillRule: { linearGradient2: { min: { color: { Literal: { Value: "'red'" } } }, max: { color: { Literal: { Value: "'#00FF00'" } } } } } } }] }); W(cf, v); }
    const strict = await ask('check_report', { path: `${dir}/Strict.pbip` }), sf = (strict.j && strict.j.findings) || [];
    const CODES = ['PBIR_JSON_FILE_NO_SCHEMA', 'PBIR_THEME_FILE_NAME_MISMATCH', 'PBIR_FORMATTING_OBJECT_UNKNOWN', 'PBIR_THEME_VISUAL_PROP_UNKNOWN', 'PBIR_FILLRULE_STOP_COLOR_INVALID'];
    chk(() => !strict.err && CODES.every((c) => sf.some((f) => f.rule === c)), () => `C1. the fixture must reproduce the five codes, verbatim: ${JSON.stringify(strict.j && strict.j.counts.byRule)} ${strict.err ? strict.t.slice(0, 200) : ''}`);
    chk(() => CODES.every((c) => sf.filter((f) => f.rule === c && !f.known).every((f) => f.impact === 'desktopOpens' && f.severity === 'error' && new RegExp(`Microsoft validator [^:]+: ${c}$`).test(f.source))),
      () => `C2. each of the five is "desktopOpens", its severity and source kept: ${JSON.stringify(sf.filter((f) => CODES.includes(f.rule)).map((f) => [f.rule, f.impact, f.severity, f.source]))}`);
    chk(() => strict.j.validator.reported.errors === 6 + KN && strict.j.validator.errors === 6 && strict.j.validator.known === KN && strict.j.counts.errors >= 6, () => `C3. the validator's own counts kept in reported (6 + ${KN} errors), errors the 6 that stay errors (rc.22, B-142), and ${KN} known: ${JSON.stringify([strict.j.validator, strict.j.counts])}`);
    const im = strict.j && strict.j.impact;
    chk(() => im && KINDS.every((k) => im.kinds[k] && typeof im.kinds[k].count === 'number' && /\S/.test(im.kinds[k].means)) && im.kinds.desktopOpens.count === 6 + KN && im.kinds.canBreak.count === 0,
      () => `C4. impact.kinds: each kind with its count and one sentence; 6 + ${KN} known desktopOpens, 0 canBreak: ${JSON.stringify(im)}`);
    chk(() => /Desktop opens/i.test(im.kinds.desktopOpens.means) && /Fabric/.test(im.kinds.desktopOpens.means) && /strict/i.test(im.kinds.desktopOpens.means), () => `C5. the desktopOpens sentence names Desktop, Fabric and strict validation: ${im.kinds.desktopOpens.means}`);
    // (0.3.1 RB, item 5: moved on purpose: Desktop is never opened by check_report, so the summary says nothing known to
    // break it was found, what ran, and that Desktop itself was not opened; never "opens in Desktop" or "not broken")
    chk(() => /^Nothing found that Power BI Desktop is known to refuse \(.*Power BI Desktop itself was not opened\)/.test(im.summary) && /strict validation or Fabric would refuse/.test(im.summary) && !/not broken|opens in (Power BI )?Desktop/i.test(im.summary), () => `C6. with only desktopOpens errors the summary says nothing known to break it was found, what ran, and that Desktop was not opened: ${im && im.summary}`);
    chk(() => KINDS.every((k) => (strict.j.counts.byImpact || {})[k] === sf.filter((f) => f.impact === k).length || strict.j.truncated), () => `C7. counts.byImpact matches the findings: ${JSON.stringify(strict.j.counts.byImpact)}`);

    // b. what can break the report in Desktop: a visual that lost its fields (PBIR_QUERY_STATE_MISSING) and a page that
    //    fails its schema (a text width)
    const B = copy('Broken');
    { const cf = visualOf(B, 'clusteredBarChart'), v = J(cf); delete v.visual.query; W(cf, v);
      const pf = tree(path.join(B, 'definition/pages')).find((f) => f.endsWith('page.json') && J(f).type !== 'Tooltip'), pg = J(pf); pg.width = 'wide'; W(pf, pg); }
    const broken = await ask('check_report', { path: `${dir}/Broken.pbip` }), bf = (broken.j && broken.j.findings) || [];
    chk(() => !broken.err && bf.some((f) => f.rule === 'PBIR_QUERY_STATE_MISSING' && f.impact === 'canBreak'), () => `C8. a visual with no fields is "canBreak": ${JSON.stringify(bf.map((f) => [f.rule, f.impact]))} ${broken.err ? broken.t.slice(0, 200) : ''}`);
    chk(() => bf.some((f) => f.rule === 'SCHEMA' && f.impact === 'canBreak'), () => `C9. a file that fails its schema is "canBreak": ${JSON.stringify(bf.map((f) => [f.rule, f.impact]))}`);
    chk(() => broken.j.impact.kinds.canBreak.count >= 2 && /Desktop/.test(broken.j.impact.kinds.canBreak.means) && /can break|fix (these|them) first/i.test(broken.j.impact.summary),
      () => `C10. the summary says what can break comes first: ${JSON.stringify(broken.j && broken.j.impact)}`);

    // c. a DataArcus rule: a button whose "show" sits inside a state selector (SELECTOR_SHOW, measured in Desktop)
    const Rr = copy('Rule');
    { const bt = visualOf(Rr, 'actionButton'), v = J(bt); v.visual.objects = Object.assign({}, v.visual.objects, { outline: [{ properties: { show: { expr: { Literal: { Value: 'true' } } } }, selector: { id: 'default' } }] }); W(bt, v); }
    const rule = await ask('check_report', { path: `${dir}/Rule.pbip` }), rf = (rule.j && rule.j.findings) || [];
    chk(() => !rule.err && rf.some((f) => f.rule === 'SELECTOR_SHOW' && f.impact === 'dataarcusRule'), () => `C11. SELECTOR_SHOW is a "dataarcusRule": ${JSON.stringify(rf.map((f) => [f.rule, f.impact]))} ${rule.err ? rule.t.slice(0, 200) : ''}`);
    chk(() => /DataArcus/.test(rule.j.impact.kinds.dataarcusRule.means), () => `C12. the dataarcusRule sentence says it is DataArcus's rule: ${rule.j.impact.kinds.dataarcusRule.means}`);
    // d. every finding of every answer has one of the three kinds; the clean report has no error and says so
    const clean = await ask('check_report', { path: `${dir}/Clean.pbip` });
    chk(() => [strict, broken, rule, clean].every((x) => x.j && x.j.findings.every((f) => KINDS.includes(f.impact))), () => `C13. every finding has one of the three kinds: ${JSON.stringify([strict, broken, rule, clean].map((x) => x.j && x.j.findings.filter((f) => !KINDS.includes(f.impact)).map((f) => f.rule)))}`);
    chk(() => clean.j.counts.errors === 0 && clean.j.impact.kinds.canBreak.count === 0 && clean.j.impact.kinds.desktopOpens.count === KN && clean.j.validator.known === KN && clean.j.findings.filter((f) => f.impact === 'desktopOpens').every((f) => f.known && f.severity === 'note') && /\S/.test(clean.j.impact.summary), () => `C14. the clean report: no error of either kind; desktopOpens only the ${KN} known notes: ${JSON.stringify(clean.j && [clean.j.impact, clean.j.validator])}`);
    // W1. (polish round P2, the writer) every slicer is a Dropdown slicer with exactly the Desktop-proven rounded box:
    //     borderRadius 8D, borderIndividualCorners false, borderColor (the design's edge colour), no other property, no selector
    { const sls = tree(path.join(D, 'Clean.Report/definition/pages')).filter((f) => f.endsWith('visual.json') && J(f).visual && J(f).visual.visualType === 'slicer').map((f) => J(f).visual.objects);
      const lv = (p) => p && p.expr && p.expr.Literal && p.expr.Literal.Value;
      chk(() => sls.length === SL && sls.every((o) => Array.isArray(o.dropdown) && o.dropdown.length === 1 && !('selector' in o.dropdown[0]) && Object.keys(o.dropdown[0]).join() === 'properties'
        && Object.keys(o.dropdown[0].properties).sort().join() === 'borderColor,borderIndividualCorners,borderRadius' && lv(o.dropdown[0].properties.borderRadius) === '8D'
        && lv(o.dropdown[0].properties.borderIndividualCorners) === 'false' && /^'#[0-9a-f]{6}'$/i.test(lv(o.dropdown[0].properties.borderColor.solid.color)) && lv(o.data[0].properties.mode) === "'Dropdown'"),
        () => `W1. every written slicer has exactly the rounded box (8D, false, a #hex border) and nothing else in it: ${JSON.stringify(sls.map((o) => o.dropdown))}`); }

    // e. (polish round P2, the owner's rounded slicer boxes, 12 Oct) a dropdown slicer's dropdown.borderRadius,
    //    borderIndividualCorners and borderColor: Power BI Desktop 2.158 draws them (scripts/tests/DESKTOP-TESTS.md,
    //    2026-10-12). Microsoft's catalog 0.1.1 did not list the "dropdown" object (PBIR_FORMATTING_OBJECT_UNKNOWN, one per
    //    slicer, a known note). Changed on purpose in U1 (19 Oct 2026): the pinned catalog 0.1.3 lists it, so the
    //    validator judges the box itself: no finding, no known note, and knownGap says none for the proven shape.
    const lit = (v) => ({ expr: { Literal: { Value: v } } });
    const ROUND = { borderRadius: lit('8D'), borderIndividualCorners: lit('false'), borderColor: { solid: { color: lit("'#9ca3af'") } } };
    const slicersOf = (R) => tree(path.join(R, 'definition/pages')).filter((f) => f.endsWith('visual.json') && J(f).visual && J(f).visual.visualType === 'slicer');
    const withDropdown = (R, props, edit) => slicersOf(R).forEach((f, i) => { const v = J(f); v.visual.objects = Object.assign({}, v.visual.objects, { dropdown: [{ properties: Object.assign({}, props) }] }); if (edit) edit(v, i); W(f, v); });
    const Rd = copy('Round'); withDropdown(Rd, ROUND);
    const nSl = slicersOf(Rd).length;
    const round = await ask('check_report', { path: `${dir}/Round.pbip` }), rdf = (round.j && round.j.findings) || [];
    const unk = (fs2) => fs2.filter((f) => f.rule === 'PBIR_FORMATTING_OBJECT_UNKNOWN');
    chk(() => nSl >= 1 && !round.err && unk(rdf).length === 0 && round.j.validator.reported.errors === 0 && round.j.validator.errors === 0 && (round.j.validator.known || 0) === 0 && round.j.validator.version === VALIDATOR_PIN,
      () => `P2a. (U1) the catalog lists the rounded box: the validator ${VALIDATOR_PIN} reports nothing for it on ${nSl} slicers, no known note: ${round.err ? round.t.slice(0, 200) : JSON.stringify([round.j.validator, unk(rdf)])}`);
    chk(() => slicersOf(Rd).every((f) => knownGap('PBIR_FORMATTING_OBJECT_UNKNOWN', 'dropdown', J(f)) === null),
      () => 'P2b. (U1) knownGap gives no note for the proven shape while the installed catalog lists the object');
    chk(() => round.j.counts.errors === 0 && round.j.impact.kinds.canBreak.count === 0 && round.j.impact.kinds.desktopOpens.count === 0 && !/can break/i.test(round.j.impact.summary) && !/known note/i.test(round.j.impact.summary),   /* (RB item 5: "known note", since the summary now says "known to refuse") */
      () => `P2c. the report has no error and no known note: ${JSON.stringify([round.j.counts, round.j.validator, round.j.impact.summary])}`);
    // never hide a real error: another object, a made-up object on a chart, the box on another visual stay the
    // validator's errors. (U1, changed on purpose: one more property of the box, another slicer mode, a selector and a
    // text radius were errors only because 0.1.1 did not know the object; with 0.1.3 they are the validator's to judge,
    // and DataArcus adds no note to whatever it says.)
    const variants = {
      otherObject: (R) => slicersOf(R).forEach((f) => { const v = J(f); v.visual.objects = Object.assign({}, v.visual.objects, { notAnObject: [{ properties: { show: lit('true') } }] }); W(f, v); }),
      madeUpOnChart: (R) => { const f = visualOf(R, 'clusteredColumnChart') || visualOf(R, 'clusteredBarChart') || visualOf(R, 'lineChart'), v = J(f); v.visual.objects = Object.assign({}, v.visual.objects, { madeUpObject: [{ properties: { madeUpProperty: lit('true') } }] }); W(f, v); },
      otherVisual: (R) => { const f = visualOf(R, 'actionButton'), v = J(f); v.visual.objects = Object.assign({}, v.visual.objects, { dropdown: [{ properties: Object.assign({}, ROUND) }] }); W(f, v); }
    };
    for (const [k, make] of Object.entries(variants)) {
      const Rv = copy('V' + k); make(Rv);
      const x = await ask('check_report', { path: `${dir}/V${k}.pbip` }), xf = unk((x.j && x.j.findings) || []);
      const xe = xf.filter((f) => f.severity === 'error');
      chk(() => !x.err && xe.length >= 1 && xe.every((f) => !f.known && f.impact === 'canBreak') && x.j.counts.errors === xe.length,
        () => `P2d. ${k}: not the Desktop-proven shape, so the validator's error stays an error: ${x.err ? x.t.slice(0, 200) : JSON.stringify(xf)}`);
    }
    const judged = {
      otherProperty: (R) => withDropdown(R, Object.assign({}, ROUND, { accentBarShow: lit('true') })),
      listSlicer: (R) => withDropdown(R, ROUND, (v) => { v.visual.objects.data = [{ properties: { mode: lit("'Basic'") } }]; }),
      selector: (R) => withDropdown(R, ROUND, (v) => { v.visual.objects.dropdown[0].selector = { id: 'default' }; }),
      radiusText: (R) => withDropdown(R, Object.assign({}, ROUND, { borderRadius: lit("'eight'") }))
    };
    for (const [k, make] of Object.entries(judged)) {
      const Rv = copy('J' + k); make(Rv);
      const x = await ask('check_report', { path: `${dir}/J${k}.pbip` }), xf = (x.j && x.j.findings) || [];
      chk(() => !x.err && !unk(xf).length && !xf.some((f) => f.known) && (x.j.validator.known || 0) === 0,
        () => `P2e. (U1) ${k}: the catalog knows the object: no unknown-object error and no DataArcus note: ${x.err ? x.t.slice(0, 200) : JSON.stringify(xf.filter((f) => f.origin === 'validator'))}`);
    }
  }

  // ---------- 2. LAYER model reading: one project's reports only (the 0.2.8 beta's folder bug) ----------
  {
    // a working folder with two made-up projects side by side, as the beta tester's: A's report uses A's fields, B's report
    // uses B's fields (none of them in A), and a third report points at A but uses a field A no longer has
    const dir = 'two';
    model(dir, 'Alpha', 'Orders', [col('Amount', 'double'), col('City', 'string')], [{ name: 'Revenue', expression: 'SUM ( Orders[Amount] )', formatString: '#,0' }]);
    model(dir, 'Beta', 'Shipments', [col('Weight', 'double'), col('Port', 'string')], [{ name: 'Tonnage', expression: 'SUM ( Shipments[Weight] )', formatString: '#,0' }]);
    const report = (name, target, entity, fields) => {
      const R = path.join(ROOT, dir, name + '.Report'), V = path.join(R, 'definition/pages/p1/visuals');
      fs.mkdirSync(V, { recursive: true });
      W(path.join(ROOT, dir, name + '.pbip'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: name + '.Report' } }], settings: { enableAutoRecovery: true } });
      W(path.join(R, 'definition.pbir'), Object.assign({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json', version: '4.0' }, target));
      W(path.join(R, 'definition/report.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/2.1.0/schema.json', themeCollection: {} });
      W(path.join(R, 'definition/pages/pages.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.0.0/schema.json', pageOrder: ['p1'], activePageName: 'p1' });
      W(path.join(R, 'definition/pages/p1/page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: 'p1', displayName: 'Page 1', displayOption: 'FitToPage', width: 1280, height: 720 });
      fields.forEach(([kind, prop], i) => { fs.mkdirSync(path.join(V, 'v' + i), { recursive: true });
        const field = kind === 'Measure' ? { Measure: { Expression: { SourceRef: { Entity: entity } }, Property: prop } } : { Column: { Expression: { SourceRef: { Entity: entity } }, Property: prop } };
        W(path.join(V, 'v' + i, 'visual.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json', name: 'v' + i, position: { x: 10, y: 10 + 60 * i, z: i, width: 200, height: 50 },
          visual: { visualType: 'card', query: { queryState: { Values: { projections: [{ field, queryRef: entity + '.' + prop }] } } } } }); });
    };
    report('Alpha Sales', { datasetReference: { byPath: { path: '../Alpha.SemanticModel' } } }, 'Orders', [['Measure', 'Revenue'], ['Column', 'City']]);
    report('Beta Ops', { datasetReference: { byPath: { path: '../Beta.SemanticModel' } } }, 'Shipments', [['Measure', 'Tonnage'], ['Column', 'Port'], ['Column', 'Weight']]);
    report('Alpha Old', { datasetReference: { byPath: { path: '../Alpha.SemanticModel' } } }, 'Orders', [['Column', 'Discount']]);
    report('Live One', { datasetReference: { byConnection: { connectionString: 'Data Source="powerbi://made-up/workspace";initial catalog=Other' } } }, 'Shipments', [['Column', 'Port']]);

    const brokenOf = (x) => ((((x.j && x.j.findings) || []).find((f) => f.id === 'BROKEN_REF') || {}).items || []).map((i) => i.obj);
    const all = (x) => JSON.stringify(x.j || x.t);
    const a = await ask('check_model_health', { path: `${dir}/Alpha.SemanticModel` }), b = await ask('check_model_health', { path: `${dir}/Beta.SemanticModel` });
    chk(() => !a.err && !b.err, () => `the two health checks must run: ${short(a)} ${short(b)}`);
    chk(() => !brokenOf(a).some((o) => /Shipments/.test(o)), () => `H1. Alpha's check must not count Beta's report (Shipments[...] as broken): ${JSON.stringify(brokenOf(a))}`);
    chk(() => !brokenOf(b).some((o) => /Orders/.test(o)) && !brokenOf(b).length, () => `H2. Beta's check must not count Alpha's reports: ${JSON.stringify(brokenOf(b))}`);
    chk(() => JSON.stringify(brokenOf(a)) === JSON.stringify(['Orders[Discount]']), () => `H3. a field really missing in a report of Alpha is still found: ${JSON.stringify(brokenOf(a))}`);
    const ra = a.j && a.j.reports, rb = b.j && b.j.reports;
    chk(() => ra && JSON.stringify([...ra.counted].sort()) === JSON.stringify(['Alpha Old', 'Alpha Sales']) && JSON.stringify(rb.counted) === JSON.stringify(['Beta Ops']),
      () => `H4. reports.counted names the model's own reports only: ${JSON.stringify([ra, rb])}`);
    const nc = (r, n) => ((r && r.notCounted) || []).find((x) => x.report === n);
    chk(() => /Beta\.SemanticModel|another model/.test((nc(ra, 'Beta Ops') || {}).why) && /published|connect/i.test((nc(ra, 'Live One') || {}).why),
      () => `H5. reports.notCounted names each other report with why: ${JSON.stringify(ra && ra.notCounted)}`);
    chk(() => /never/i.test(ra.note) && /delet/i.test(ra.note), () => `H6. the reports note tells never to suggest deleting a report: ${ra && ra.note}`);
    chk(() => [a, b].every((x) => !/\b(delete|remove)\b[^.]{0,60}\breports?\b(?![^.]{0,40}never)/i.test(all(x).replace(/never[^.]{0,80}delet[^.]*\./ig, ''))), () => `H7. no answer advises deleting a report: ${[a, b].map((x) => (all(x).match(/[^.]{0,80}\b(delete|remove)\b[^.]{0,60}\breports?\b[^.]{0,40}/ig) || []).join(' | ')).join(' || ')}`);
    chk(() => a.j.stats && a.j.stats.pages === 2, () => `H8. Alpha's stats count its own two reports' pages only: ${JSON.stringify(a.j && a.j.stats)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029c-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await v029checks({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029checks  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029checks  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
