/*
 * DataArcus Power BI Model Health Check: the DAX tokens and the report references (0.3.2 SP9, the split of
 * model-health-engine.js: the Codex split map, B-280). Pure functions, no model state: DAX text in, tokens out; report
 * JSON (PBIR files or a legacy Layout) in, the fields it references out. The engine resolves them against the model.
 * Loaded before model-health-engine.js (the worker's importScripts, the tool pages); in Node the engine requires it.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';

  // an expression given as one text or as its lines (a model's JSON writes both) -> one text: the one place (0.3.3 SG1)
  const exprText = (v) => (Array.isArray(v) ? v.join('\n') : v == null ? '' : String(v));
  const text = exprText;
  // ---------- 1. DAX tokenizer ----------
  // Returns tokens without comments; strings are kept as a single token so their contents are ignored.
  function tokenizeDax(src) {
    const s = src || '';
    const out = [];
    let i = 0;
    const n = s.length;
    while (i < n) {
      const c = s[i];
      const d = s[i + 1];
      if (c === '/' && d === '/') { while (i < n && s[i] !== '\n') i++; continue; }
      if (c === '-' && d === '-') { while (i < n && s[i] !== '\n') i++; continue; }
      if (c === '/' && d === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
      if (c === '"') { let j = i + 1; while (j < n) { if (s[j] === '"') { if (s[j + 1] === '"') { j += 2; continue; } break; } j++; } out.push({ t: 'str', v: s.slice(i + 1, j), p: i }); i = j + 1; continue; }
      if (c === "'") { let j = i + 1; while (j < n) { if (s[j] === "'") { if (s[j + 1] === "'") { j += 2; continue; } break; } j++; } out.push({ t: 'tbl', v: s.slice(i + 1, j).replace(/''/g, "'"), p: i }); i = j + 1; continue; }
      if (c === '[') { let j = i + 1; while (j < n) { if (s[j] === ']') { if (s[j + 1] === ']') { j += 2; continue; } break; } j++; } out.push({ t: 'br', v: s.slice(i + 1, j).replace(/]]/g, ']'), p: i }); i = j + 1; continue; }
      if (/[A-Za-z_À-￿]/.test(c)) { let j = i + 1; while (j < n && /[\w.À-￿]/.test(s[j])) j++; out.push({ t: 'id', v: s.slice(i, j), p: i }); i = j; continue; }
      if (/[0-9]/.test(c)) { let j = i + 1; while (j < n && /[0-9.eE]/.test(s[j])) j++; out.push({ t: 'num', v: s.slice(i, j), p: i }); i = j; continue; }
      if (/\s/.test(c)) { i++; continue; }
      out.push({ t: 'op', v: c, p: i }); i++;
    }
    return out;
  }

  // Strip comments, string contents and object names, for regex based checks that must not match inside
  // strings or names (a column called Sales[Qty/Box] is not a division).
  function daxCode(src) {
    return tokenizeDax(src).map((t) => (t.t === 'str' ? '""' : t.t === 'tbl' ? "'_'" : t.t === 'br' ? '[_]' : t.v)).join(' ');
  }

  // ---------- 2. report field usage ----------
  // Walks any report JSON (PBIR files or parsed legacy Layout) and collects entity/property references.
  function collectReportRefs(node, acc, aliases) {
    if (node == null) return;
    if (typeof node === 'string') {
      const s = node.trim();
      if ((s[0] === '{' && s[s.length - 1] === '}') || (s[0] === '[' && s[s.length - 1] === ']')) {
        try { collectReportRefs(JSON.parse(s), acc, aliases); } catch (e) { /* not JSON */ }
      }
      return;
    }
    if (Array.isArray(node)) { node.forEach((x) => collectReportRefs(x, acc, aliases)); return; }
    if (typeof node !== 'object') return;
    let al = aliases;
    if (Array.isArray(node.From)) {
      al = Object.assign({}, aliases);
      node.From.forEach((f) => { if (f && f.Name && f.Entity) al[f.Name] = f.Entity; });
    }
    const entityOf = (expr) => {
      const sr = expr && expr.SourceRef;
      if (!sr) return null;
      return sr.Entity || (sr.Source && al[sr.Source]) || null;
    };
    ['Column', 'Measure'].forEach((kind) => {
      const f = node[kind];
      if (f && typeof f === 'object' && f.Property && f.Expression) {
        const ent = entityOf(f.Expression);
        // (0.3.3 LX1, HX1 "Seen") a report's own measure is written with SourceRef.Schema "extension": kept, so a report
        // measure and a model measure of one name are told apart by the reference itself (the key only when written)
        const schema = f.Expression.SourceRef && f.Expression.SourceRef.Schema;
        if (ent) acc.push(Object.assign({ kind, entity: ent, prop: f.Property }, schema === 'extension' ? { schema } : {}));
      }
    });
    if (node.PropertyVariationSource && node.PropertyVariationSource.Property) {
      const ent = entityOf(node.PropertyVariationSource.Expression);
      if (ent) acc.push({ kind: 'Column', entity: ent, prop: node.PropertyVariationSource.Property });
    }
    if (node.HierarchyLevel && node.HierarchyLevel.Expression && node.HierarchyLevel.Expression.Hierarchy) {
      const h = node.HierarchyLevel.Expression.Hierarchy;
      const ent = entityOf(h.Expression);
      if (ent) acc.push({ kind: 'HierarchyLevel', entity: ent, hierarchy: h.Hierarchy, level: node.HierarchyLevel.Level });
    }
    for (const k in node) if (Object.prototype.hasOwnProperty.call(node, k)) collectReportRefs(node[k], acc, al);
  }

  // Friendly label for a visual: its title when it has a fixed one, else its type ("Table", "Card").
  const VISUAL_TYPES = {
    card: 'Card', cardVisual: 'Card', multiRowCard: 'Multi-row card', kpi: 'KPI', gauge: 'Gauge',
    tableEx: 'Table', pivotTable: 'Matrix', slicer: 'Slicer', advancedSlicerVisual: 'Button slicer', listSlicer: 'List slicer', textSlicer: 'Text slicer',
    barChart: 'Bar chart', clusteredBarChart: 'Bar chart', hundredPercentStackedBarChart: '100% bar chart',
    columnChart: 'Column chart', clusteredColumnChart: 'Column chart', hundredPercentStackedColumnChart: '100% column chart',
    lineChart: 'Line chart', areaChart: 'Area chart', stackedAreaChart: 'Stacked area chart', ribbonChart: 'Ribbon chart',
    lineClusteredColumnComboChart: 'Line and column chart', lineStackedColumnComboChart: 'Line and column chart',
    pieChart: 'Pie chart', donutChart: 'Donut chart', treemap: 'Treemap', funnel: 'Funnel', waterfallChart: 'Waterfall chart',
    scatterChart: 'Scatter chart', map: 'Map', filledMap: 'Filled map', azureMap: 'Azure map', textbox: 'Text box',
    actionButton: 'Button', shape: 'Shape', image: 'Image', decompositionTreeVisual: 'Decomposition tree', keyDriversVisual: 'Key influencers'
  };
  function visualLabel(v) {
    if (!v) return '';
    const type = v.visualType || '';
    let title = '';
    try {
      const t = ((v.vcObjects || v.visualContainerObjects || {}).title || [])[0];
      const lit = t && t.properties && t.properties.text && t.properties.text.expr && t.properties.text.expr.Literal;
      if (lit && typeof lit.Value === 'string') title = lit.Value.replace(/^'|'$/g, '').replace(/''/g, "'").trim();
    } catch (e) { /* no title */ }
    const kind = VISUAL_TYPES[type] || type;
    return title ? (kind ? kind + ' "' + title + '"' : '"' + title + '"') : (kind || 'Visual');
  }

  // report = { format: 'pbir'|'legacy', files: [{path, json}] } ; returns stats + refs
  function analyzeReport(report) {
    if (!report || !report.files || !report.files.length) return null;
    const refs = [];
    const ext = [];
    let pages = 0, visuals = 0;
    const pageNames = [];
    const perVisual = [];
    if (report.format === 'legacy') {
      const layout = report.files[0].json || {};
      (layout.sections || []).forEach((sec) => {
        pages++; pageNames.push(sec.displayName || sec.name);
        const pf = [];
        collectReportRefs(sec.filters, pf, {});
        pf.forEach((x) => { x.page = sec.displayName || sec.name; x.visual = 'page filter'; });
        refs.push.apply(refs, pf);
        (sec.visualContainers || []).forEach((vc) => {
          visuals++;
          const r = [];
          collectReportRefs(vc.config, r, {});
          collectReportRefs(vc.filters, r, {});
          collectReportRefs(vc.query, r, {});
          collectReportRefs(vc.dataTransforms, r, {});
          let label = '';
          try {
            const cfg = typeof vc.config === 'string' ? JSON.parse(vc.config) : (vc.config || {});
            label = cfg.singleVisual ? visualLabel(cfg.singleVisual) : cfg.singleVisualGroup ? 'Group "' + (cfg.singleVisualGroup.displayName || '') + '"' : '';
          } catch (e) { /* unreadable config */ }
          r.forEach((x) => { x.page = sec.displayName || sec.name; x.visual = label || 'Visual'; });
          refs.push.apply(refs, r);
          perVisual.push({ page: sec.displayName || sec.name, refs: r });
        });
      });
      collectReportRefs(layout.filters, refs, {});
      // the report's config holds its bookmarks (in groups, too): a field used there is told by its bookmark's name
      let cfg0 = null;
      try { cfg0 = typeof layout.config === 'string' ? JSON.parse(layout.config) : layout.config; } catch (e) { /* unreadable config */ }
      if (cfg0 && typeof cfg0 === 'object' && Array.isArray(cfg0.bookmarks)) {
        const marks = (list) => (list || []).forEach((b) => {
          if (!b || typeof b !== 'object') return;
          if (Array.isArray(b.children)) { marks(b.children); return; }
          const r = []; collectReportRefs(b, r, {});
          r.forEach((x) => { x.bookmark = b.displayName || b.name || ''; });
          refs.push.apply(refs, r);
        });
        marks(cfg0.bookmarks);
        collectReportRefs(Object.assign({}, cfg0, { bookmarks: undefined }), refs, {});
      } else collectReportRefs(layout.config, refs, {});
      collectReportRefs(layout.pods, refs, {});
      try {
        const cfg = typeof layout.config === 'string' ? JSON.parse(layout.config) : (layout.config || {});
        (cfg.modelExtensions || []).forEach((me) => (me.entities || []).forEach((en) => (en.measures || []).forEach((ms) => ext.push({ entity: en.name, name: ms.name, expr: text(ms.expression) }))));
      } catch (e) { /* no extensions */ }
    } else {
      const pageTitle = {};
      report.files.forEach((f) => {
        const m = f.path.match(/pages\/([^/]+)\/page\.json$/);
        if (m) { const dn = (f.json && f.json.displayName) || m[1]; pages++; pageTitle[m[1]] = dn; pageNames.push(dn); }
      });
      report.files.forEach((f) => {
        if (/reportExtensions\.json$/i.test(f.path)) {
          ((f.json && f.json.entities) || []).forEach((en) => (en.measures || []).forEach((ms) => ext.push({ entity: en.name, name: ms.name, expr: text(ms.expression) })));
          return;
        }
        const r = [];
        collectReportRefs(f.json, r, {});
        const pm = f.path.match(/pages\/([^/]+)\//);
        const isVisual = /\/visuals\/[^/]+\/visual\.json$/.test(f.path);
        const label = isVisual ? visualLabel(f.json && f.json.visual) : /\/page\.json$/.test(f.path) ? 'page filter' : '';
        if (pm) r.forEach((x) => { x.page = pageTitle[pm[1]] || pm[1]; if (label) x.visual = label; });
        else if (/(^|\/)bookmarks\/[^/]+\.bookmark\.json$/i.test(f.path)) r.forEach((x) => { x.bookmark = (f.json && (f.json.displayName || f.json.name)) || ''; });
        refs.push.apply(refs, r);
        const vm = f.path.match(/pages\/([^/]+)\/visuals\/[^/]+\/visual\.json$/);
        if (vm) { visuals++; perVisual.push({ page: pageTitle[vm[1]] || vm[1], refs: r }); }
      });
    }
    if (!pages && !visuals) return null; // no report pages: treat as model only
    return { format: report.format, pages, visuals, pageNames, refs, perVisual, ext };
  }

  const api = { tokenizeDax, daxCode, collectReportRefs, visualLabel, analyzeReport, exprText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DADaxParser = api;
})(typeof self !== 'undefined' ? self : this);
