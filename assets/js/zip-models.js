/* DataArcus zip-models (0.3.3 TF1): which model and which report a zip's Model Health Check reads, in one place for the
 * website's worker (model-health-worker.js) and the MCP's reader (mcp/lib/model.mjs; check_model_health, read_model).
 * Until TF1 the worker chose by folder (AU1) and the MCP took the first model.bim in the zip's order with every report
 * in the zip, so a zip of two models was scored with one model's tables and both models' reports (test033 D10).
 * Every model in the zip, by its folder: one model.bim or DataModelSchema each, one definition root with .tmdl files
 * each. With more than one, which folder is read is model-nearest.js's rule (the nearest the top; on a tie the first of
 * the tied in its sorted order, said); zip order never decides; only the reports that can be told to be its own are read
 * (their definition.pbir points at it, else it is the one model in their parent folder), and the note says which model
 * was read and which not. One model in the zip: every report in it is read, no note (as before).
 * Pure: entry names in, the entries to read and the note out; the caller reads the bytes (the worker in the browser, the
 * MCP from disk) and passes each definition.pbir's byPath when asked.
 *   pbirsToRead(names)     the definition.pbir entries whose byPath the choice needs ([] with one model)
 *   choose(names, byPath)  { error: 'PBIX' | 'NO_MODEL' } or { modelEntry, tmdl, report: { layout, pbir, legacyPbip }, models }
 *   said(models)           the note: { en, ar } (the Arabic side carries the English until the owner approves one)
 * Browser and Node (module.exports / self.DAZipModels). */
(function (root) {
  'use strict';
  const Nearest = typeof module !== 'undefined' && module.exports ? require('./model-nearest.js') : root.DAModelNearest;
  const PBIR = /(^|\/)definition\/(report\.json|reportExtensions\.json|pages\/.*\.json|bookmarks\/.*\.json)$/i;
  const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const rootOf = (n) => n.slice(0, n.search(/(^|\/)definition\//) + 1);
  // a report's folder (where its definition.pbir is)
  const reportFolder = (n) => { const k = n.search(/(^|\/)definition\//); return k >= 0 ? n.slice(0, k + (n[k] === '/' ? 1 : 0)) : n.slice(0, n.lastIndexOf('/') + 1); };
  function parts(names) {
    const list = Array.from(names || []).map(String), has = (re) => list.filter((n) => re.test(n));
    const bims = has(/(^|\/)DataModelSchema$/).concat(has(/(^|\/)model\.bim$/i));
    // a project saved as TMDL: the .tmdl files of its semantic model's definition folder
    const tmdl = has(/(^|\/)definition\/.*\.tmdl$/i).filter((n) => !/TMDLScripts\//i.test(n));
    const folders = new Map();
    bims.forEach((n) => { const f = n.slice(0, n.lastIndexOf('/') + 1); if (!folders.has(f)) folders.set(f, { bim: n }); });
    tmdl.forEach((n) => { const f = rootOf(n); if (!folders.has(f)) folders.set(f, { tmdl: true }); });
    return { list, bims, tmdl, folders, layout: has(/(^|\/)Report\/Layout$/)[0] || null, legacyPbip: has(/\.Report\/report\.json$/i)[0] || null,
      pbir: has(PBIR).filter((n) => !/StaticResources|CustomVisuals/i.test(n)) };
  }
  const reportFolders = (P) => Array.from(new Set(P.pbir.map(reportFolder).concat(P.legacyPbip ? [reportFolder(P.legacyPbip)] : [])));
  function pbirsToRead(names) {
    const P = parts(names); if (P.folders.size < 2) return [];
    const have = new Set(P.list);
    return reportFolders(P).map((f) => f + 'definition.pbir').filter((n) => have.has(n));
  }
  // byPath(name): the datasetReference.byPath.path of that definition.pbir entry, or null (not there, not readable)
  function choose(names, byPath) {
    const P = parts(names);
    let modelEntry = P.bims[0] || null, at = P.tmdl.length ? rootOf(P.tmdl[0]) : '', layout = P.layout, legacyPbip = P.legacyPbip, pbir = P.pbir, models = null;
    if (!modelEntry && !P.tmdl.length) return { error: P.list.some((n) => /(^|\/)DataModel$/.test(n)) ? 'PBIX' : 'NO_MODEL' };
    if (P.folders.size > 1) {
      const near = Nearest.nearest(Array.from(P.folders.keys()).map((f) => f.replace(/\/$/, '')), '/'), pick = (near.path != null ? near.path : near.tied[0]) + '/';
      const read = pick === '/' ? '' : pick, order = [read].concat(Array.from(P.folders.keys()).filter((f) => f !== read).sort(byCode));
      modelEntry = P.folders.get(read).bim || null; at = read;
      // the model folder a report folder belongs to: the path its definition.pbir gives (byPath), else the one model in
      // the same parent folder; null when it can't be told
      const parent = (f) => f.replace(/[^/]*\/$/, ''), owner = new Map();
      for (const f of reportFolders(P)) {
        let to = null;
        const rel = typeof byPath === 'function' ? byPath(f + 'definition.pbir') : null;
        if (typeof rel === 'string') {
          const out = [];
          (f + rel.replace(/\\/g, '/')).split('/').forEach((x) => { if (x === '..') out.pop(); else if (x && x !== '.') out.push(x); });
          const there = out.join('/') + '/';
          if (P.folders.has(there)) to = there;
        }
        if (!to) { const same = order.filter((m) => parent(m) === parent(f)); if (same.length === 1) to = same[0]; }
        owner.set(f, to);
      }
      const own = Array.from(owner.keys()).filter((f) => owner.get(f) === read).sort(byCode);
      pbir = pbir.filter((n) => owner.get(reportFolder(n)) === read);
      if (legacyPbip && owner.get(reportFolder(legacyPbip)) !== read) legacyPbip = null;
      if (layout && layout.slice(0, layout.lastIndexOf('Report/')) !== read) layout = null;
      const name = (f) => f.replace(/\/$/, '') || '(the zip\'s top folder)';
      models = { read: name(read), notRead: order.slice(1).map(name), report: pbir.length || legacyPbip || layout ? 'read' : 'notRead', reports: own.map(name) };
    }
    // the report read: the legacy Layout file, else the PBIR files, else an older report.json
    const report = layout ? { layout, pbir: [], legacyPbip: null } : pbir.length ? { layout: null, pbir, legacyPbip: null } : { layout: null, pbir: [], legacyPbip };
    return { modelEntry, tmdl: modelEntry ? [] : P.tmdl.filter((n) => rootOf(n) === at), report, models };
  }
  // the sentence for a zip with more than one model: folder names only. Not yet approved in Arabic (D-1109-07): the
  // Arabic side carries the English sentence; the draft for the owner is in mcp/work/AU1.md
  function said(m) {
    const n = 1 + m.notRead.length;
    const en = `This zip holds ${n} semantic models: the check below read ${m.read}; not read: ${m.notRead.join(', ')}. ` +
      (m.report === 'read' ? `The report read is the one of ${m.read}${m.reports.length ? ' (' + m.reports.join(', ') + ')' : ''}; the other models' reports were not read.` : `No report was read: none in the zip can be told to belong to ${m.read}.`) +
      ' To check another model, zip its project folder alone.';
    return { en, ar: en };
  }
  const api = { pbirsToRead, choose, said };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAZipModels = api;
})(typeof self !== 'undefined' ? self : this);
