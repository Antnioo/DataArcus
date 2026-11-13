/*
 * DataArcus Power BI Model Health Check: the text downloads (0.3.2 SP24, the split of model-health.js: the Codex split
 * map, B-280). One input, one output, no state:
 *   MHDownloads.build(kind, { result, rules, score, date }) -> { name, type, text }
 *   kind:   'findings-csv' (the Issues tab's CSV), 'measures-csv', 'doc-html', 'doc-md' (the Docs tab)
 *   result: the analysis (metadata only: names, DAX, descriptions; never data values); rules: the engine's RULES;
 *   score:  { overall, perf, maint, bp } as the page shows it; date: 'YYYY-MM-DD', written into the documentation.
 * Every file is in English, like the model, whatever the page's language. It reads nothing else (no page, no clock, no
 * storage, no worker) and never changes its input. Loaded before model-health.js on the tool pages; in Node, require it. (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // the area of a finding (the page's CAT, in English)
  const AREA = { perf: 'Performance', maint: 'Maintainability', bp: 'Best practice' };
  // where a "please confirm" question points
  const confirmWhere = (c) => (c.relationship ? c.obj + ' (' + c.relationship.fromTable + '[' + c.relationship.candidateColumn + '])' : c.evidence);
  // rows to CSV: every cell quoted, a byte order mark first (Excel reads it as UTF-8), lines ended with CRLF
  const csv = (rows) => '﻿' + rows.map((r) => r.map((x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const fileBase = (R) => (R.meta.fileName || 'model').replace(/\.[^.]+$/, '');

  function build(kind, input) {
    const R = input.result, RULES = input.rules || {};
    // where a rule comes from (RULES[id].source), in English: [label, url]
    const srcOf = (id) => (RULES[id] || {}).source || null;
    const srcEn = (id) => { const s = srcOf(id); return !s ? ['', ''] : s.kind === 'microsoft' ? ['Microsoft guidance', s.url] : s.kind === 'bpa' ? ['BPA ' + s.title, s.url] : ['DataArcus rule', '']; };
    const ctx = { R, RULES, srcOf, srcEn, sc: input.score, d: input.date };
    if (kind === 'findings-csv') return { name: 'model-health-findings.csv', type: 'text/csv', text: findingsCsv(ctx) };
    if (kind === 'measures-csv') return { name: fileBase(R) + ' - measures.csv', type: 'text/csv', text: measuresCsv(ctx) };
    if (kind === 'doc-html') return { name: fileBase(R) + ' - documentation.html', type: 'text/html', text: docHtml(ctx) };
    if (kind === 'doc-md') return { name: fileBase(R) + ' - documentation.md', type: 'text/markdown', text: docMd(ctx) };
    throw new Error('Unknown download: ' + kind);
  }

  function findingsCsv({ R, RULES, srcEn }) {
    const rows = [['Severity', 'Category', 'Rule', 'Object', 'Detail', 'Source']];
    R.findings.forEach((f) => { const [sl, su] = srcEn(f.id); f.items.forEach((i) => rows.push([f.sev, AREA[f.cat], RULES[f.id].en[0], i.obj, i.detail || '', su && sl === 'Microsoft guidance' ? su : sl])); });
    (R.confirm || []).forEach((c) => rows.push(['question', 'Please confirm', c.message.en, c.obj, confirmWhere(c), 'DataArcus question (not a finding, not in the score)']));
    return csv(rows.map((r) => r.map(String)));   // every cell as written (a missing one reads "undefined", as before)
  }

  function measuresCsv({ R }) {
    const rows = [['Measure', 'Table', 'Folder', 'Format', 'Used', 'Visuals', 'Pages', 'Depth', 'Description', 'DAX']].concat(R.measures.map((m) => [m.name, m.table, m.folder, m.formatString, m.used == null ? '' : m.used ? 'yes' : 'no', m.visuals, m.pages.join('; '), m.depth, m.description, m.expr.trim()]));
    return csv(rows);
  }

  function docHtml({ R, RULES, srcOf, srcEn, sc, d }) {
    const s = R.stats;
    const h = (x) => esc(x);
    const folders = {};
    R.measures.forEach((m) => { const k = m.folder || '(no folder)'; (folders[k] = folders[k] || []).push(m); });
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + h(R.meta.fileName) + ' - model documentation</title><style>' +
      'body{font:14px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111827;max-width:1100px;margin:0 auto;padding:32px 20px;background:#fff}h1{font-size:26px;margin:0}h2{font-size:19px;margin:34px 0 10px;padding-bottom:6px;border-bottom:2px solid #e5e7eb}h3{font-size:15px;margin:20px 0 6px}' +
      '.sub{color:#6b7280}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:14px 0}.card{border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px}.card b{display:block;font-size:22px}.card span{color:#6b7280;font-size:12px}' +
      'table{width:100%;border-collapse:collapse;margin:6px 0 14px;font-size:13px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #eef0f3;vertical-align:top}th{background:#f8fafc;font-weight:600}code,pre{font-family:ui-monospace,Consolas,monospace;font-size:12px}pre{background:#f8fafc;border:1px solid #eef0f3;border-radius:8px;padding:10px;white-space:pre-wrap;margin:6px 0}' +
      '.sev{display:inline-block;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700;text-transform:uppercase}.high{background:#fee2e2;color:#b91c1c}.medium{background:#fef3c7;color:#b45309}.low{background:#e0f2fe;color:#0369a1}.info{background:#f1f5f9;color:#475569}.no{color:#9ca3af}' +
      '.m{border:1px solid #eef0f3;border-radius:10px;padding:10px 14px;margin:10px 0;page-break-inside:avoid}.m .meta{color:#6b7280;font-size:12px}footer{margin-top:40px;color:#9ca3af;font-size:12px}@media print{h2{page-break-after:avoid}}</style></head><body>' +
      '<h1>' + h(R.meta.fileName) + '</h1><div class="sub">Model documentation and health check · ' + d + '</div>' +
      '<div class="grid"><div class="card"><b>' + sc.overall + '/100</b><span>Health score</span></div><div class="card"><b>' + sc.perf + '</b><span>Performance</span></div><div class="card"><b>' + sc.maint + '</b><span>Maintainability</span></div><div class="card"><b>' + sc.bp + '</b><span>Best practice</span></div>' +
      '<div class="card"><b>' + s.tables + '</b><span>Tables</span></div><div class="card"><b>' + s.columns + '</b><span>Columns</span></div><div class="card"><b>' + s.measures + '</b><span>Measures</span></div><div class="card"><b>' + s.relationships + '</b><span>Relationships</span></div>' + (s.pages != null ? '<div class="card"><b>' + s.pages + '</b><span>Report pages</span></div><div class="card"><b>' + s.visuals + '</b><span>Visuals</span></div>' : '') + '</div>' +
      (s.sources.length ? '<p><b>Data sources:</b> ' + s.sources.map((x) => h(x.name) + ' (' + x.count + ')').join(', ') + '</p>' : '') +
      '<h2>Health check findings</h2><table><tr><th>Severity</th><th>Area</th><th>Finding</th><th>Count</th><th>How to fix</th><th>Source</th></tr>' + R.findings.map((f) => { const [sl, su] = srcEn(f.id);
        return '<tr><td><span class="sev ' + f.sev + '">' + f.sev + '</span></td><td>' + AREA[f.cat] + '</td><td>' + h(RULES[f.id].en[0]) + '</td><td>' + f.items.length + '</td><td>' + h(RULES[f.id].en[2]) + '</td><td>' + (su ? '<a href="' + h(su) + '">' + h(sl) + '</a>' : h(sl) + ': ' + h(srcOf(f.id).says.en)) + '</td></tr>'; }).join('') + '</table>' +
      R.findings.map((f) => '<h3>' + h(RULES[f.id].en[0]) + ' (' + f.items.length + ')</h3><div>' + f.items.map((i) => '<code>' + h(i.obj) + '</code>' + (i.detail ? ' <span class="no">' + h(i.detail) + '</span>' : '')).join(', ') + '</div>').join('') +
      ((R.confirm || []).length ? '<h2>Please confirm (questions, not findings)</h2><p class="sub">Questions about possible calculation mistakes. They are not findings and don\'t affect the score: the check reads structure and DAX, not the numbers.</p><table><tr><th>Type</th><th>Object</th><th>Question</th><th>Evidence</th></tr>' +
        R.confirm.map((c) => '<tr><td>question</td><td><code>' + h(c.obj) + '</code></td><td>' + h(c.message.en) + '</td><td><code>' + h(confirmWhere(c)) + '</code></td></tr>').join('') + '</table>' : '') +
      '<h2>Tables</h2><table><tr><th>Table</th><th>Type</th><th>Columns</th><th>Measures</th><th>Description</th></tr>' + R.tables.filter((t) => !t.auto).map((t) => '<tr><td><b>' + h(t.name) + '</b>' + (t.hidden ? ' <span class="no">(hidden)</span>' : '') + '</td><td>' + (t.isCalcTable ? 'DAX' : h(t.mode)) + '</td><td>' + t.columns.length + '</td><td>' + t.measures + '</td><td>' + h(t.description) + '</td></tr>').join('') + '</table>' +
      R.tables.filter((t) => !t.auto).map((t) => '<h3>' + h(t.name) + '</h3><table><tr><th>Column</th><th>Type</th><th>Kind</th><th>Used</th><th>Notes</th></tr>' + t.columns.map((c) => '<tr><td>' + h(c.name) + '</td><td>' + h(c.dataType) + '</td><td>' + (c.kind === 'calculated' ? 'Calculated' : 'Data') + (c.hidden ? ', hidden' : '') + '</td><td>' + (c.used == null ? '' : c.used ? 'Yes' : '<span class="no">No</span>') + '</td><td>' + (c.sortBy ? 'Sorted by ' + h(c.sortBy) + '. ' : '') + h(c.description) + (c.expr ? '<pre>' + h(c.expr.trim()) + '</pre>' : '') + '</td></tr>').join('') + '</table>' + (t.calcExpr ? '<pre>' + h(t.calcExpr.trim()) + '</pre>' : '')).join('') +
      '<h2>Measures</h2>' + Object.keys(folders).sort().map((k) => '<h3>' + h(k) + ' (' + folders[k].length + ')</h3>' + folders[k].map((m) => '<div class="m"><b>[' + h(m.name) + ']</b> <span class="meta">' + (m.formatString ? 'Format ' + h(m.formatString) + ' · ' : '') + (m.used == null ? '' : m.used ? (m.visuals ? 'in ' + m.visuals + ' visuals on ' + m.pages.length + ' pages' : 'used by other measures or filters') : '<span class="no">unused</span>') + '</span>' + (m.description ? '<div>' + h(m.description) + '</div>' : '') + '<pre>' + h(m.expr.trim()) + '</pre>' + (m.dependsOn.length ? '<div class="meta">Depends on: ' + m.dependsOn.map((x) => x.type === 'measure' ? '[' + h(x.name) + ']' : x.type === 'column' ? h(x.table) + '[' + h(x.name) + ']' : h(x.name)).join(', ') + '</div>' : '') + '</div>').join('')).join('') +
      '<h2>Relationships</h2><table><tr><th>From</th><th>To</th><th>Cardinality</th><th>Filter direction</th><th>Active</th></tr>' + R.relationships.map((r) => '<tr><td>' + h(r.fromTable) + '[' + h(r.fromColumn) + ']</td><td>' + h(r.toTable) + '[' + h(r.toColumn) + ']</td><td>' + (r.fromCard === 'many' ? 'Many' : 'One') + ' to ' + (r.toCard === 'many' ? 'many' : 'one') + '</td><td>' + (r.cross === 'bothDirections' ? 'Both' : 'Single') + '</td><td>' + (r.active ? 'Yes' : 'No') + '</td></tr>').join('') + '</table>' +
      '<footer>Generated in the browser by the free Power BI Model Health Check at dataarcus.com/tools. The file was not uploaded anywhere.</footer></body></html>';
  }

  function docMd({ R, RULES, srcEn, sc, d }) {
    const s = R.stats, lines = [];
    const cell = (x) => String(x == null ? '' : x).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    // a code fence longer than any run of backticks in the code, so DAX containing ``` cannot close it early
    const fence = (code) => { const f = '`'.repeat(Math.max(3, ...(code.match(/`+/g) || []).map((x) => x.length + 1))); return [f + 'dax', code, f, '']; };
    const dep = (x) => (x.type === 'measure' ? '[' + x.name + ']' : x.type === 'column' ? x.table + '[' + x.name + ']' : x.type === 'function' ? x.name + '()' : x.name);
    lines.push('# ' + R.meta.fileName, '', 'Model documentation and health check, ' + d, '');
    lines.push('**Health score: ' + sc.overall + '/100** (Performance ' + sc.perf + ', Maintainability ' + sc.maint + ', Best practice ' + sc.bp + ')', '');
    if (s.sources.length) lines.push('**Data sources:** ' + s.sources.map((x) => x.name + ' (' + x.count + ')').join(', '), '');
    lines.push('| Tables | Columns | Measures | Relationships |' + (s.pages != null ? ' Pages | Visuals |' : ''), '|---|---|---|---|' + (s.pages != null ? '---|---|' : ''), '| ' + [s.tables, s.columns, s.measures, s.relationships].join(' | ') + ' |' + (s.pages != null ? ' ' + s.pages + ' | ' + s.visuals + ' |' : ''), '');
    lines.push('## Findings', '', '| Severity | Finding | Count | How to fix | Source |', '|---|---|---|---|---|');
    R.findings.forEach((f) => { const [sl, su] = srcEn(f.id); lines.push('| ' + f.sev + ' | ' + cell(RULES[f.id].en[0]) + ' | ' + f.items.length + ' | ' + cell(RULES[f.id].en[2]) + ' | ' + (su ? '[' + sl + '](' + su + ')' : sl) + ' |'); });
    lines.push('');
    R.findings.forEach((f) => {
      lines.push('### ' + RULES[f.id].en[0] + ' (' + f.items.length + ')', '');
      f.items.forEach((i) => lines.push('- `' + String(i.obj).replace(/`/g, "'") + '`' + (i.detail ? ': ' + String(i.detail).replace(/\n/g, ' ') : '')));
      lines.push('');
    });
    if ((R.confirm || []).length) {
      lines.push('## Please confirm (questions, not findings)', '', 'Questions about possible calculation mistakes. They are not findings and don\'t affect the score: the check reads structure and DAX, not the numbers.', '',
        '| Type | Object | Question | Evidence |', '|---|---|---|---|');
      R.confirm.forEach((c) => lines.push('| question | ' + cell(c.obj) + ' | ' + cell(c.message.en) + ' | ' + cell(confirmWhere(c)) + ' |'));
      lines.push('');
    }
    lines.push('## Tables', '');
    R.tables.filter((t) => !t.auto).forEach((t) => {
      lines.push('### ' + t.name + (t.hidden ? ' (hidden)' : ''), '');
      if (t.description) lines.push(t.description, '');
      lines.push('| Column | Type | Kind | Used | Notes |', '|---|---|---|---|---|');
      t.columns.forEach((c) => lines.push('| ' + cell(c.name) + ' | ' + c.dataType + ' | ' + (c.kind === 'calculated' ? 'Calculated' : 'Data') + (c.hidden ? ', hidden' : '') + ' | ' + (c.used == null ? '' : c.used ? 'Yes' : 'No') + ' | ' + cell((c.sortBy ? 'Sorted by ' + c.sortBy + '. ' : '') + (c.description || '')) + ' |'));
      lines.push('');
      t.columns.filter((c) => c.expr).forEach((c) => lines.push('**' + t.name + '[' + c.name + ']**', '', ...fence(c.expr.trim())));
      if (t.calcExpr) lines.push('**Table DAX**', '', ...fence(t.calcExpr.trim()));
    });
    lines.push('## Measures', '');
    R.measures.slice().sort((a, b) => (a.folder || '').localeCompare(b.folder || '') || a.name.localeCompare(b.name)).forEach((m) => {
      lines.push('### ' + m.name, '', (m.folder ? 'Folder: ' + m.folder + '  ' : '') + (m.formatString ? 'Format: `' + m.formatString + '`  ' : '') + (m.used == null ? '' : m.used ? (m.visuals ? 'In ' + m.visuals + ' visuals on ' + m.pages.length + ' pages' : 'Used by other measures or filters') : 'Unused'), '');
      if (m.description) lines.push(m.description, '');
      lines.push(...fence(m.expr.trim()));
      if (m.dependsOn.length) lines.push('Depends on: ' + m.dependsOn.map(dep).join(', '), '');
    });
    lines.push('## Relationships', '', '| From | To | Cardinality | Filter | Active |', '|---|---|---|---|---|');
    R.relationships.forEach((r) => lines.push('| ' + cell(r.fromTable + '[' + r.fromColumn + ']') + ' | ' + cell(r.toTable + '[' + r.toColumn + ']') + ' | ' + (r.fromCard === 'many' ? 'Many' : 'One') + ':' + (r.toCard === 'many' ? 'Many' : 'One') + ' | ' + (r.cross === 'bothDirections' ? 'Both' : 'Single') + ' | ' + (r.active ? 'Yes' : 'No') + ' |'));
    lines.push('', '_Generated in the browser by the free Power BI Model Health Check at dataarcus.com/tools._');
    return lines.join('\n');
  }

  const api = { build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MHDownloads = api;
})(typeof self !== 'undefined' ? self : this);
