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
    // (polish round P2) every written slicer carries the dropdown slicer's rounded box, which Microsoft's validator 0.4.0
    // does not know: one known note per slicer, counted exactly in every expectation below
    const SL = tree(path.join(D, 'Clean.Report/definition/pages')).filter((f) => f.endsWith('visual.json') && J(f).visual && J(f).visual.visualType === 'slicer').length;
    chk(() => SL >= 1, () => 'the made-up report must have a slicer');

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
    chk(() => strict.j.validator.reported.errors === 6 + SL && strict.j.validator.errors === 6 && strict.j.validator.known === SL && strict.j.counts.errors >= 6, () => `C3. the validator's own counts kept in reported (6 + ${SL} errors), errors the 6 that stay errors (rc.22, B-142), and ${SL} known, one per slicer: ${JSON.stringify([strict.j.validator, strict.j.counts])}`);
    const im = strict.j && strict.j.impact;
    chk(() => im && KINDS.every((k) => im.kinds[k] && typeof im.kinds[k].count === 'number' && /\S/.test(im.kinds[k].means)) && im.kinds.desktopOpens.count === 6 + SL && im.kinds.canBreak.count === 0,
      () => `C4. impact.kinds: each kind with its count and one sentence; 6 + ${SL} known desktopOpens, 0 canBreak: ${JSON.stringify(im)}`);
    chk(() => /Desktop opens/i.test(im.kinds.desktopOpens.means) && /Fabric/.test(im.kinds.desktopOpens.means) && /strict/i.test(im.kinds.desktopOpens.means), () => `C5. the desktopOpens sentence names Desktop, Fabric and strict validation: ${im.kinds.desktopOpens.means}`);
    chk(() => /not broken|opens in (Power BI )?Desktop/i.test(im.summary) && !/broken\b(?! in)/i.test(im.summary.replace(/not broken/ig, '')), () => `C6. with only desktopOpens errors the summary says the report is not broken in Desktop: ${im && im.summary}`);
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
    chk(() => clean.j.counts.errors === 0 && clean.j.impact.kinds.canBreak.count === 0 && clean.j.impact.kinds.desktopOpens.count === SL && clean.j.validator.known === SL && clean.j.findings.filter((f) => f.impact === 'desktopOpens').every((f) => f.known && f.severity === 'note') && /\S/.test(clean.j.impact.summary), () => `C14. the clean report: no error of either kind; desktopOpens only the ${SL} known notes, one per slicer: ${JSON.stringify(clean.j && [clean.j.impact, clean.j.validator])}`);
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
    //    2026-10-12); Microsoft's validator 0.4.0 does not know the "dropdown" object (PBIR_FORMATTING_OBJECT_UNKNOWN, one
    //    per slicer). Exactly that is a known note with its evidence; anything else unknown stays an error.
    const lit = (v) => ({ expr: { Literal: { Value: v } } });
    const ROUND = { borderRadius: lit('8D'), borderIndividualCorners: lit('false'), borderColor: { solid: { color: lit("'#9ca3af'") } } };
    const slicersOf = (R) => tree(path.join(R, 'definition/pages')).filter((f) => f.endsWith('visual.json') && J(f).visual && J(f).visual.visualType === 'slicer');
    const withDropdown = (R, props, edit) => slicersOf(R).forEach((f, i) => { const v = J(f); v.visual.objects = Object.assign({}, v.visual.objects, { dropdown: [{ properties: Object.assign({}, props) }] }); if (edit) edit(v, i); W(f, v); });
    const Rd = copy('Round'); withDropdown(Rd, ROUND);
    const nSl = slicersOf(Rd).length;
    const round = await ask('check_report', { path: `${dir}/Round.pbip` }), rdf = (round.j && round.j.findings) || [];
    const unk = (fs2) => fs2.filter((f) => f.rule === 'PBIR_FORMATTING_OBJECT_UNKNOWN');
    chk(() => nSl >= 1 && !round.err && unk(rdf).length === nSl && round.j.validator.reported.errors === nSl && round.j.validator.errors === 0, () => `P2a. the fixture reproduces the validator's error once per slicer (${nSl}), its own count kept: ${round.err ? round.t.slice(0, 200) : JSON.stringify([round.j.validator, unk(rdf)])}`);
    chk(() => unk(rdf).every((f) => f.severity === 'note' && f.impact === 'desktopOpens' && f.known && /Power BI Desktop 2\.158 draws it/.test(f.known.what) && f.known.what.includes(`validator ${VALIDATOR_PIN} does not list it yet`) && round.j.validator.version === VALIDATOR_PIN
      && [...`${f.known.what} ${round.j.impact.summary}`.matchAll(/validator (\d+\.\d+\.\d+)/g)].every((m) => m[1] === VALIDATOR_PIN)
      && /DESKTOP-TESTS\.md/.test(f.known.evidence) && /2026-10-12/.test(f.known.evidence) && /^Microsoft validator [^:]+: PBIR_FORMATTING_OBJECT_UNKNOWN$/.test(f.source)),
      () => `P2b. each is a known note (Desktop 2.158 draws it, the installed validator ${VALIDATOR_PIN} does not list it yet; no other version named) with its evidence, the code and source verbatim: ${JSON.stringify(unk(rdf))}`);
    chk(() => round.j.counts.errors === 0 && round.j.validator.known === nSl && round.j.impact.kinds.canBreak.count === 0 && !/can break/i.test(round.j.impact.summary),
      () => `P2c. the report has no error: counts.errors 0, validator.known ${nSl}, nothing can break it: ${JSON.stringify([round.j.counts, round.j.validator, round.j.impact.summary])}`);
    chk(() => /not broken/.test(round.j.impact.summary) && /known/i.test(round.j.impact.summary) && /2\.158/.test(round.j.impact.summary) && !/\b0 errors?\b/.test(round.j.impact.summary),
      () => `P2c. the summary says the report is not broken and names the known notes (no "0 errors"): ${round.j.impact.summary}`);
    // never hide a real error: another property in the object, another slicer mode, another visual, another object, a
    // selector, a value of another shape
    const variants = {
      otherProperty: (R) => withDropdown(R, Object.assign({}, ROUND, { accentBarShow: lit('true') })),
      listSlicer: (R) => withDropdown(R, ROUND, (v) => { v.visual.objects.data = [{ properties: { mode: lit("'Basic'") } }]; }),
      otherObject: (R) => slicersOf(R).forEach((f) => { const v = J(f); v.visual.objects = Object.assign({}, v.visual.objects, { notAnObject: [{ properties: { show: lit('true') } }] }); W(f, v); }),
      selector: (R) => withDropdown(R, ROUND, (v) => { v.visual.objects.dropdown[0].selector = { id: 'default' }; }),
      radiusText: (R) => withDropdown(R, Object.assign({}, ROUND, { borderRadius: lit("'eight'") })),
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
