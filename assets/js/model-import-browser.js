/*
 * DataArcus - the website's model input: a project folder or a model file the visitor chose, read in the browser
 * (nothing is uploaded). Gives the model's structure as pbip-bind.js's parsers make it, never its data.
 * Inputs: a project's .SemanticModel (or older .Dataset) folder (TMDL or model.bim), a model.bim, or a .pbit (unzipped
 * by the Model Health Check's worker). A .pbix is refused, and so is a file over the limits, before it is read.
 * (0.3.2 SP14: moved from pbip-bind.js, which keeps fromFolder and fromFile by forwarding to this file.)
 * which model folder a chosen folder means: model-nearest.js's (the MCP's rule; two at the nearest depth are refused).
 * readers: pbip-bind.js's own { fromTmsl, relsOfTmsl, clean, tmdl } (tmdl: tmdl-model.js), handed over, never copied.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  const decodeText = (u8) => {
    if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8.subarray(2));
    if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) return new TextDecoder('utf-8').decode(u8.subarray(3));
    if (u8.length >= 2 && u8[1] === 0x00) return new TextDecoder('utf-16le').decode(u8);
    return new TextDecoder('utf-8').decode(u8);
  };

  // The MCP reader's limits (mcp/lib/model.mjs PBIT_LIMITS, the Health Check worker's too): a file over them is refused
  // before it is read (the audit of the reading block, "seen": the website read a model.bim of any size)
  const MB = 1024 * 1024, LIMITS = { model: 64 * MB, entry: 32 * MB, total: 128 * MB, file: 300 * MB };
  const Nearest = () => (typeof module !== 'undefined' && module.exports ? require('./model-nearest.js') : root.DAModelNearest);
  const tooBig = () => new Error('TOO_BIG');
  // A folder from <input webkitdirectory>: the .SemanticModel folder itself, or a project folder holding one.
  // A model is known by its whole path, not its name: a copy with the same name in a subfolder (a backup) is another
  // model, and the one nearest the top of the chosen folder is used.
  async function fromFolder(fileList, readers) {
    const { fromTmsl, relsOfTmsl, clean, tmdl } = readers;
    const files = Array.from(fileList || []), rel = (f) => f.webkitRelativePath || f.name;
    // .Dataset is the older name of the model folder, still in Microsoft's own definition.pbir example
    const modelOf = (f) => { const m = rel(f).match(/^((?:[^/]+\/)*?[^/]+\.(?:SemanticModel|Dataset))\//i); return m ? m[1] : null; };
    const models = [...new Set(files.map(modelOf).filter(Boolean))];
    if (!models.length) throw new Error('NO_SEMANTIC_MODEL');
    // (0.3.2 DD1G) which model is model-nearest.js's, the MCP's rule too: two at the nearest depth (two projects side by
    // side) are refused with both named, before any file is read; a deeper copy (a backup) never wins
    const near = Nearest().nearest(models, '/');
    if (near.tied.length > 1) throw Object.assign(new Error('MANY_MODELS'), { models: near.tied });
    const path = near.path, folder = path.replace(/^.*\//, ''), inside = files.filter((f) => modelOf(f) === path);
    const bim = inside.find((f) => /\/model\.bim$/i.test(f.webkitRelativePath || f.name));
    let tables, relationships = [];
    if (bim && (bim.size || 0) > LIMITS.model) throw tooBig();
    if (bim) { const j = JSON.parse(decodeText(new Uint8Array(await bim.arrayBuffer()))); tables = fromTmsl(j); relationships = relsOfTmsl(j); }
    else {
      const tmdlFiles = inside.filter((f) => /\/definition\/.+\.tmdl$/i.test(f.webkitRelativePath || f.name));
      if (!tmdlFiles.some((f) => /\/definition\/tables\/[^/]+\.tmdl$/i.test(f.webkitRelativePath || f.name))) throw new Error('NO_MODEL');
      if (tmdlFiles.some((f) => (f.size || 0) > LIMITS.entry) || tmdlFiles.reduce((n, f) => n + (f.size || 0), 0) > LIMITS.total) throw tooBig();
      const parts = [];
      for (const f of tmdlFiles) parts.push({ path: rel(f).slice(path.length + 1), text: decodeText(new Uint8Array(await f.arrayBuffer())) });
      const j = tmdl().fromFiles(parts);
      tables = fromTmsl(j); relationships = relsOfTmsl(j);
    }
    // the reports already next to the model (X.Report folders, X.pbip files), so the new one never takes their name
    const dir = path.includes('/') ? path.replace(/\/[^/]*$/, '') + '/' : '', reports = new Set();
    files.forEach((f) => {
      const p = rel(f); if (!p.startsWith(dir)) return;
      const m = p.slice(dir.length).match(/^([^/]+)\.pbip$|^([^/]+)\.Report\//i); if (m) reports.add(m[1] || m[2]);
    });
    return { folder, path, others: models.length - 1, reports: [...reports], tables: clean(tables), relationships };
  }
  // A model.bim, or a .pbit (unzipped by the Model Health Check's worker, which already reads them)
  function fromFile(file, workerUrl, readers) {
    const { fromTmsl, relsOfTmsl, clean } = readers;
    if (/\.pbix$/i.test(file.name)) return Promise.reject(new Error('PBIX'));
    if ((file.size || 0) > (/\.pbit$/i.test(file.name) ? LIMITS.file : LIMITS.model)) return Promise.reject(tooBig());
    return file.arrayBuffer().then((buf) => {
      const u8 = new Uint8Array(buf);
      if (!(u8[0] === 0x50 && u8[1] === 0x4b)) { const j = JSON.parse(decodeText(u8)); return { tables: clean(fromTmsl(j)), relationships: relsOfTmsl(j) }; }
      return new Promise((resolve, reject) => {
        const w = new Worker(workerUrl);
        w.onmessage = (ev) => {
          const d = ev.data;
          if (d.type === 'done') { w.terminate(); resolve({ tables: clean(fromTmsl({ tables: d.result.rawTables })), relationships: relsOfTmsl({ relationships: d.result.relationships }) }); }
          else if (d.type === 'error') { w.terminate(); reject(new Error(d.code)); }
        };
        w.onerror = () => { w.terminate(); reject(new Error('PARSE')); };
        w.postMessage({ buffer: buf, fileName: file.name }, [buf]);
      });
    });
  }

  const api = { fromFolder, fromFile, LIMITS, decodeText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAModelImport = api;
})(typeof self !== 'undefined' ? self : this);
