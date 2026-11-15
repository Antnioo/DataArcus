// 0.3.3 HX1 (the owner, 11 Nov, D-1111-12; mcp/work/HX1.md). The number's lineage (lib/lineage.mjs): for each visual
// of a report, everything in the model its numbers depend on, and three prints of it (question, display, order). Two
// versions of a model and a report compared say which visuals can show other numbers, and through which names.
// A library only: no tool reads it yet, nothing a tool writes or answers changes.
//   B  the base: Souq's 11 visuals, 10 with a query, three prints each; the same twice; the inputs not changed
//   C  ten planted changes (the note's table, worked out by hand before the code), each found on exactly its visuals
//   W  the words: the chain of names that says why; relationships said by their columns
//   R  reach: the visuals a measure, a column or a table reaches
//   P  parity: each measure's direct references are the health check's own dependsOn (the two cannot drift)
//   S  safety: no hash and no planted literal in a compared answer; names through safeName
//   X  the edges: a report measure, a field the model lacks, USERELATIONSHIP, row-level security, a visual gone, a
//      hierarchy level, a both-directions relationship, a calculation group, a format by a measure
// Made-up models only (fixtures/hx1-souq.mjs, in memory: no file is read or written).   node test-0.3.3-hx1.mjs
import { createRequire } from 'node:module';
import { souqModel, souqReport, measureOf, tableOf, columnOf, visualOf, colRef, msrRef } from './fixtures/hx1-souq.mjs';

const require = createRequire(import.meta.url);
const Engine = require('../assets/js/model-health-engine.js');
let L = {}; try { L = await import('./lib/lineage.mjs'); } catch (e) { L = {}; }
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected'; } problems.push(m + err); } };
const J = (x) => JSON.stringify(x);

// a change made on fresh copies: (model, report) => void; the comparison of the base with it
const base = () => L.lineageOf(souqModel(), souqReport());
const after = (change) => { const m = souqModel(), r = souqReport(); change(m, r); return L.lineageOf(m, r); };
const cmp = (change) => L.compareLineage(base(), after(change));
const names = (c, tier) => c.differ.filter((d) => !tier || d.tier === tier).map((d) => d.visual).sort();
const eq = (a, b) => J(a) === J(b.slice().sort());
const said = (c) => { try { return J({ said: c.said, differ: c.differ.map((d) => [d.visual, d.tier]) }); } catch (e) { return 'no answer'; } };
// one planted change: the visuals of each tier, exactly
const planted = (id, change, want) => {
  let c = null; try { c = cmp(change); } catch (e) { c = null; }
  chk(() => eq(names(c, 'question'), want.question || []) && eq(names(c, 'display'), want.display || []) && eq(names(c, 'order'), want.order || []), () => `${id}. expected ${J(want)}, got ${said(c)}`);
  const n = (want.question || []).length + (want.display || []).length + (want.order || []).length;
  chk(() => c.same === 10 - n && c.question === (want.question || []).length && c.display === (want.display || []).length && c.order === (want.order || []).length && c.withQuery === 10, () => `${id}. the counts: expected ${10 - n} same of 10, got ${c && J([c.same, c.question, c.display, c.order, c.withQuery])}`);
  return c;
};

// ---------- B: the base ----------
const B0 = (() => { try { return base(); } catch (e) { return null; } })();
chk(() => typeof L.lineageOf === 'function' && typeof L.compareLineage === 'function' && typeof L.reachOf === 'function', () => 'B1. lib/lineage.mjs does not export lineageOf, compareLineage and reachOf');
chk(() => B0.visuals.length === 11 && B0.visuals.filter((v) => v.prints).length === 10, () => `B2. Souq: 11 visuals, 10 with a query; got ${B0 && J([B0.visuals.length, B0.visuals.filter((v) => v.prints).length])}`);
chk(() => B0.visuals.filter((v) => v.prints).every((v) => ['question', 'display', 'order'].every((t) => /^[0-9a-f]{64}$/.test(v.prints[t]))), () => 'B3. a visual with a query lacks one of its three prints');
chk(() => J(base().visuals.map((v) => v.prints)) === J(B0.visuals.map((v) => v.prints)), () => 'B4. the same model and report gave other prints the second time');
chk(() => { const c = L.compareLineage(base(), base()); return c.same === 10 && c.withQuery === 10 && c.visuals === 11 && c.noQuery === 1 && !c.differ.length && /^10 of 10 visuals/.test(c.said); }, () => `B5. the base against itself: ${said(L.compareLineage(base(), base()))}`);
chk(() => { const m = souqModel(), r = souqReport(), a = J([m, r]); L.lineageOf(m, r); return J([m, r]) === a; }, () => 'B6. lineageOf changed its inputs');
chk(() => new Set(B0.visuals.filter((v) => v.prints).map((v) => v.prints.question)).size === 10, () => 'B7. two visuals that ask different questions share a question print');
chk(() => { const v = B0.visuals.find((x) => x.visual === 'card-margin-pct'); return ['m:margin %', 'm:margin', 'm:net revenue', 'm:revenue', 'm:returns value', 'm:cost', 'c:sales|amount', 'c:returns|amount', 'c:sales|cost', 't:sales', 't:returns', 'c:calendar|year', 't:calendar'].every((k) => v.nodes[k] && v.nodes[k].tier === 'question') && !v.nodes['t:store'] && !v.nodes['m:units']; },
  () => `B8. the Margin % card's nodes: ${J(Object.keys((B0.visuals.find((x) => x.visual === 'card-margin-pct') || {}).nodes || {}))}`);
chk(() => { const v = B0.visuals.find((x) => x.visual === 'card-margin-pct'), r = Object.keys(v.nodes).filter((k) => k.startsWith('r:')).sort(); return J(r) === J(['r:returns|date>calendar|date', 'r:sales|date>calendar|date']); },
  () => `B9. the Margin % card's relationships (the year's slicer filters Sales and Returns; Store is not in its question): ${J(Object.keys(B0.visuals.find((x) => x.visual === 'card-margin-pct').nodes).filter((k) => k.startsWith('r:')))}`);

// ---------- C: the ten planted changes ----------
const C1 = planted('C1', (m) => { measureOf(m, 'Returns Value').expression = 'SUMX ( Returns, Returns[Amount] )'; }, { question: ['card-margin-pct', 'bar-net-revenue-by-region'] });
planted('C2', (m) => { measureOf(m, 'Margin %').formatString = '0.00%'; }, { display: ['card-margin-pct'] });
planted('C3', (m) => { columnOf(m, 'Calendar', 'Month').sortByColumn = 'Month Order'; }, { order: ['column-revenue-by-month', 'line-growth-by-month'] });
const C4 = planted('C4', (m) => { m.model.relationships = m.model.relationships.filter((r) => r.name !== 'Returns-Store'); }, { question: ['bar-net-revenue-by-region', 'table-city-margin'] });
planted('C5', (m) => { tableOf(m, '_Measures').measures.push({ name: 'Bonus', expression: '[Revenue] * 0.01' }); measureOf(m, 'Headcount').expression = 'DISTINCTCOUNT ( Staff[StaffKey] )'; }, {});
planted('C6', (m) => { columnOf(m, 'Sales', 'Line Margin').expression = 'Sales[Amount] - Sales[Cost] * 1.05'; }, { question: ['table-city-margin'] });
planted('C7', (m) => { tableOf(m, 'Sales').partitions[0].source.expression = 'let Source = #table(type table [Date = date, Amount = number], {}) in Source'; },
  { question: ['card-revenue', 'card-margin-pct', 'card-units', 'column-revenue-by-month', 'bar-net-revenue-by-region', 'table-category', 'line-growth-by-month', 'table-city-margin'] });
planted('C8', (m, r) => { visualOf(r, 'table-category').visual.query.queryState.Values.projections[0] = colRef('Product', 'Brand'); }, { question: ['table-category'] });
planted('C9', (m) => { columnOf(m, 'Calendar', 'Year').sourceColumn = 'Fiscal Year'; }, { question: ['card-revenue', 'card-margin-pct', 'card-units', 'column-revenue-by-month', 'bar-net-revenue-by-region', 'slicer-year'] });
planted('C10', (m) => { measureOf(m, 'Revenue').expression = 'SUMX ( Sales, Sales[Amount] )'; }, { question: ['card-revenue', 'card-margin-pct', 'column-revenue-by-month', 'bar-net-revenue-by-region', 'table-category', 'line-growth-by-month'] });

// ---------- W: the words ----------
chk(() => { const d = C1.differ.find((x) => x.visual === 'card-margin-pct'), w = d.why[0]; return d.why.length === 1 && w.name === '[Returns Value]' && /DAX changed/.test(w.what) && J(w.through) === J(['[Margin %]', '[Net Revenue]']); },
  () => `W1. the Margin % card's why: ${J((C1.differ.find((x) => x.visual === 'card-margin-pct') || {}).why)}`);
chk(() => { const d = C1.differ.find((x) => x.visual === 'bar-net-revenue-by-region'); return d.page === 'overview' && d.type === 'clusteredBarChart' && J(d.why[0].through) === J(['[Net Revenue]']); }, () => `W2. the bar chart's entry: ${J(C1.differ.find((x) => x.visual === 'bar-net-revenue-by-region'))}`);
chk(() => /^8 of 10 visuals can only show other numbers if the data changed; 2 can show other numbers \(listed\); 0 only in display; 0 only in order\.$/.test(C1.said), () => `W3. the sentence: ${C1 && C1.said}`);
chk(() => C4.differ.every((d) => d.why.length === 1 && /relationship removed/.test(d.why[0].what) && d.why[0].name === 'Returns[StoreKey] to Store[StoreKey]'), () => `W4. the removed relationship's words: ${J(C4.differ.map((d) => d.why))}`);
chk(() => typeof L.PROVES === 'string' && typeof L.NOT_PROVED === 'string' && C1.proves === L.PROVES && C1.notProved === L.NOT_PROVED && /data/.test(L.NOT_PROVED) && /row-level security/.test(L.NOT_PROVED) && /custom visual/.test(L.NOT_PROVED) && /not measured in Power BI Desktop/.test(L.NOT_PROVED),
  () => 'W5. the answer does not say what it proves and what it does not (the data, row-level security, a custom visual, the relationship rule not measured in Desktop)');
chk(() => { const c = cmp((m) => { measureOf(m, 'Margin %').formatString = '0.00%'; columnOf(m, 'Calendar', 'Month').sortByColumn = 'Month Order'; measureOf(m, 'Units').expression = 'SUMX ( Sales, Sales[Quantity] )'; });
  return J(c.differ.map((d) => d.tier)) === J(c.differ.map((d) => d.tier).slice().sort((a, b) => ['question', 'display', 'order'].indexOf(a) - ['question', 'display', 'order'].indexOf(b))) && c.question === 2 && c.display === 1 && c.order === 2; },
  () => 'W6. three kinds of change at once: question first, then display, then order (2, 1, 2)');

// ---------- R: reach ----------
chk(() => { const r = L.reachOf(B0, { measure: 'Returns Value' }); return r.found && eq(r.visuals.map((v) => v.visual).sort(), ['card-margin-pct', 'bar-net-revenue-by-region']) && r.pages === 1; }, () => `R1. [Returns Value] reaches: ${J(L.reachOf(B0, { measure: 'Returns Value' }))}`);
chk(() => { const r = L.reachOf(B0, { table: 'Sales', column: 'Cost' }); return r.found && eq(r.visuals.map((v) => v.visual).sort(), ['card-margin-pct', 'table-city-margin']) && r.pages === 2; }, () => `R2. Sales[Cost] reaches: ${J(L.reachOf(B0, { table: 'Sales', column: 'Cost' }))}`);
chk(() => { const r = L.reachOf(B0, { measure: 'Headcount' }); return r.found && r.visuals.length === 0 && r.pages === 0; }, () => `R3. [Headcount] reaches no visual: ${J(L.reachOf(B0, { measure: 'Headcount' }))}`);
chk(() => { const r = L.reachOf(B0, { measure: 'No Such Measure' }); return r.found === false && r.visuals.length === 0; }, () => 'R4. a name the model lacks is said not found');
chk(() => { const r = L.reachOf(B0, { table: 'Calendar', column: 'Month Number' }); return eq(r.visuals.map((v) => v.visual + ' ' + v.tier).sort(), ['column-revenue-by-month order', 'line-growth-by-month order']); }, () => `R5. Calendar[Month Number] reaches the two charts by month, in their order only: ${J(L.reachOf(B0, { table: 'Calendar', column: 'Month Number' }))}`);
chk(() => L.reachOf(B0, { table: 'Staff' }).visuals.length === 0 && L.reachOf(B0, { table: 'Targets' }).visuals.length === 1, () => 'R6. the Staff table reaches no visual, Targets one');

// ---------- P: parity with the health check's graph ----------
chk(() => { const A = Engine.analyze(souqModel(), null), G = L.modelGraph(souqModel()); const key = (x) => (x.type === 'measure' ? 'm:' + x.name : x.type === 'column' ? 'c:' + x.table + '|' + x.name : x.type === 'table' ? 't:' + x.name : 'f:' + x.name).toLowerCase();
  return A.measures.length === 12 && A.measures.every((ms) => J(ms.dependsOn.map(key).sort()) === J(G.nodes.get('m:' + ms.name.toLowerCase()).deps.filter((k) => k !== 't:' + ms.table.toLowerCase()).slice().sort())); },
  () => 'P1. a measure\'s direct references differ from the health check\'s dependsOn');
chk(() => { const G = L.modelGraph(souqModel()); return J(G.nodes.get('c:sales|line margin').deps.slice().sort()) === J(['c:sales|amount', 'c:sales|cost', 't:sales']) && G.relationships.length === 6; }, () => 'P2. the calculated column\'s references, the 6 relationships');

// ---------- S: safety ----------
const CANARY = 'CANARY-7781';
const withFilter = (r, v) => { const pg = r.files.find((f) => f.path.endsWith('details/page.json')).json; pg.filterConfig.filters[0].filter = { Where: [{ Condition: { In: { Values: [[{ Literal: { Value: `'${v}'` } }]] } } }] }; };
chk(() => { const a = (() => { const m = souqModel(), r = souqReport(); withFilter(r, 'Brand A'); return L.lineageOf(m, r); })(), b = after((m, r) => withFilter(r, CANARY)), c = L.compareLineage(a, b);
  return eq(names(c, 'question'), ['table-category', 'line-growth-by-month', 'card-target', 'table-city-margin']) && !J(c).includes(CANARY) && !J(c).includes('Brand A') && c.differ.every((d) => /page's filters/.test(d.why[0].what)); },
  () => 'S1. a page filter\'s value changed: its page\'s 4 visuals named, the value in no answer');
chk(() => { const c = cmp((m) => { measureOf(m, 'Returns Value').expression = `CALCULATE ( SUM ( Returns[Amount] ), Store[City] = "${CANARY}" )`; }); return c.question >= 2 && !J(c).includes(CANARY); }, () => 'S2. a literal in a measure\'s DAX is in a compared answer');
chk(() => [C1, C4, cmp((m, r) => withFilter(r, CANARY))].every((c) => !/[0-9a-f]{32,}/.test(J(c))), () => 'S3. a compared answer holds a hash');
chk(() => { const odd = (expr) => (m) => { measureOf(m, 'Returns Value').name = 'Returns\u202EValue'; measureOf(m, 'Returns\u202EValue').expression = expr; measureOf(m, 'Net Revenue').expression = '[Revenue] - [Returns\u202EValue]'; };
  const c = L.compareLineage(after(odd('SUM ( Returns[Amount] )')), after(odd('SUMX ( Returns, Returns[Amount] )'))); return c.question === 2 && /Returns.*Value/.test(c.differ[0].why[0].name) && !J(c).includes('\u202E'); },
  () => 'S4. a name with a direction override is written as it is in a compared answer (not through safeName)');

// ---------- X: the edges ----------
const withExt = (r, expr) => { r.files.push({ path: 'definition/reportExtensions.json', json: { name: 'extension', entities: [{ name: '_Measures', measures: [{ name: 'Report Share', dataType: 'Double', expression: expr }] }] } });
  visualOf(r, 'card-target').visual.query.queryState.Values.projections[0] = { field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: '_Measures' } }, Property: 'Report Share' } }, queryRef: '_Measures.Report Share' }; };
chk(() => { const a = (() => { const m = souqModel(), r = souqReport(); withExt(r, 'DIVIDE ( [Units], [Target] )'); return L.lineageOf(m, r); })(), b = after((m, r) => withExt(r, 'DIVIDE ( [Units], [Revenue] )')), c = L.compareLineage(a, b);
  const v = a.visuals.find((x) => x.visual === 'card-target'); return v.nodes['m:units'] && v.nodes['m:target'] && eq(names(c, 'question'), ['card-target']) && /report measure/.test(c.differ[0].why[0].what) && c.differ[0].why[0].name === '[Report Share]'; },
  () => 'X1. a report measure: its references followed into the model, its change named on its card');
chk(() => { const b = after((m) => { measureOf(m, 'Net Revenue').expression = '[Revenue] - [Returns Value] - [Units]'; }), c = L.compareLineage(base(), b); return eq(names(c, 'question'), ['card-margin-pct', 'bar-net-revenue-by-region']) && c.differ.every((d) => d.why.length === 1 && d.why[0].name === '[Net Revenue]'); },
  () => 'X2. a measure that now calls one more measure is named once, by itself (not each new thing under it)');
chk(() => { const c = cmp((m) => { tableOf(m, '_Measures').measures = tableOf(m, '_Measures').measures.filter((x) => x.name !== 'Target'); }); const d = c.differ.find((x) => x.visual === 'card-target'); return c.question === 1 && d && /not in the model/.test(d.why[0].what) && d.why[0].name === '[Target]'; },
  () => 'X3. a measure removed from the model: its card named, "not in the model"');
chk(() => { const ly = (fn) => (m) => { measureOf(m, 'Revenue LY').expression = `CALCULATE ( [Revenue], ${fn} ( Returns[Date], 'Calendar'[Date] ) )`; };
  const plain = after(ly('TREATAS')).visuals.find((x) => x.visual === 'line-growth-by-month'), use = after(ly('USERELATIONSHIP')).visuals.find((x) => x.visual === 'line-growth-by-month'), via = ['r:sales|storekey>store|storekey', 'r:returns|storekey>store|storekey'];
  const c = L.compareLineage(after(ly('USERELATIONSHIP')), after((m) => { ly('USERELATIONSHIP')(m); m.model.relationships.find((r) => r.name === 'Sales-Store').isActive = false; }));
  return via.every((k) => !plain.nodes[k]) && via.every((k) => use.nodes[k]) && names(c, 'question').includes('line-growth-by-month') && !names(c, 'question').includes('card-units'); },
  () => 'X4. a measure with USERELATIONSHIP: a relationship on any path between its tables counts for its visuals, whatever its direction (in doubt, more), and not for the others');
chk(() => { const c = cmp((m) => { m.model.roles = [{ name: 'Gulf', tablePermissions: [{ name: 'Store', filterExpression: 'Store[Region] = "Gulf"' }] }]; }); return c.same === 10 && c.modelWide.length === 1 && /row-level security/.test(c.modelWide[0]) && !J(c).includes('Gulf'); },
  () => 'X5. a role added: said once for the whole model, never its filter');
chk(() => { const c = cmp((m, r) => { r.files = r.files.filter((f) => !f.path.includes('/card-units/')); r.files.push({ path: 'definition/pages/details/visuals/card-new/visual.json', json: { name: 'card-new', visual: { visualType: 'card', query: { queryState: { Values: { projections: [msrRef('Cost')] } } } } } }); }); return c.notMatched === 1 && c.newInAfter === 1 && c.same === 9 && /1 not found/.test(c.said) && /1 new/.test(c.said); },
  () => 'X6. a visual gone and a new one: counted, said');
chk(() => { const lvl = { field: { HierarchyLevel: { Expression: { Hierarchy: { Expression: { SourceRef: { Entity: 'Store' } }, Hierarchy: 'Geography' } }, Level: 'City' } }, queryRef: 'Store.Geography.City' };
  const mk = (m, r) => { tableOf(m, 'Store').hierarchies = [{ name: 'Geography', levels: [{ name: 'Region', column: 'Region' }, { name: 'City', column: 'City' }] }]; visualOf(r, 'table-city-margin').visual.query.queryState.Values.projections[0] = lvl; };
  const a = after(mk), v = a.visuals.find((x) => x.visual === 'table-city-margin'); return v.nodes['c:store|city'] && v.nodes['c:store|city'].tier === 'question' && !v.nodes['c:store|region']; },
  () => 'X7. a hierarchy level is read as its column');
chk(() => { const both = (m) => { m.model.relationships.find((r) => r.name === 'Sales-Product').crossFilteringBehavior = 'bothDirections'; }; const v0 = B0.visuals.find((x) => x.visual === 'table-category'), v1 = after(both).visuals.find((x) => x.visual === 'table-category');
  return !v0.nodes['r:sales|storekey>store|storekey'] && v0.nodes['r:sales|productkey>product|productkey'] && eq(names(cmp(both), 'question'), ['table-category', 'line-growth-by-month', 'card-target', 'table-city-margin']) && v1.nodes['r:sales|productkey>product|productkey']; },
  () => `X8. Sales to Product made both directions: the Details page's 4 visuals (its filter is on Product), none of Overview's: ${said(cmp((m) => { m.model.relationships.find((r) => r.name === 'Sales-Product').crossFilteringBehavior = 'bothDirections'; }))}`);
chk(() => { const cg = (expr) => (m, r) => { m.model.tables.push({ name: 'Time Calc', calculationGroup: { calculationItems: [{ name: 'YTD', expression: expr }] }, columns: [col('Name')] }); visualOf(r, 'card-units').filterConfig = { filters: [{ name: 'f-cg', field: colRef('Time Calc', 'Name').field, type: 'Categorical' }] }; };
  const c = L.compareLineage(after(cg('CALCULATE ( SELECTEDMEASURE (), DATESYTD ( \'Calendar\'[Date] ) )')), after(cg('CALCULATE ( SELECTEDMEASURE (), DATESMTD ( \'Calendar\'[Date] ) )'))); return eq(names(c, 'question'), ['card-units']) && c.differ[0].why[0].name === 'Time Calc (table)'; },
  () => 'X9. a calculation item edited: the visual filtered by its group, by the table\'s name');
chk(() => { const cf = (m, r) => { visualOf(r, 'card-units').visual.objects = { labels: [{ properties: { color: { solid: { color: { expr: msrRef('Margin %').field } } } } }] }; }; const a = after(cf), b = after((m, r) => { cf(m, r); measureOf(m, 'Cost').expression = 'SUMX ( Sales, Sales[Cost] )'; }), c = L.compareLineage(a, b);
  return eq(names(c, 'display'), ['card-units']) && eq(names(c, 'question'), ['card-margin-pct']) && a.visuals.find((x) => x.visual === 'card-units').nodes['m:cost'].tier === 'display'; },
  () => 'X10. a colour set by a measure: that measure\'s change is the card\'s display, not its number');
chk(() => { const c = L.compareLineage(L.lineageOf(souqModel(), { files: [] }), base()); return c.visuals === 0 && c.newInAfter === 11; }, () => 'X11. an empty report against Souq: 11 new, nothing compared');
chk(() => { let threw = 0; [[null, souqReport()], [souqModel(), null], [{}, { files: [{ path: 'definition/pages/p/visuals/v/visual.json', json: null }] }]].forEach(([m, r]) => { try { L.lineageOf(m, r); } catch (e) { threw++; } }); return threw === 0; }, () => 'X12. a missing model, a missing report or an unreadable visual makes lineageOf throw');

function col(name) { return { name, dataType: 'string', sourceColumn: name }; }

if (problems.length) { console.log(`FAIL script=mcp/test-0.3.3-hx1.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 400))); console.log(`FAIL  hx1  ${problems.length} of ${checks} checks failed`); process.exit(1); }
console.log(`PASS  hx1  ${checks} checks`);
