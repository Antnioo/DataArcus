/*
 * DataArcus Power BI Model Health Check: background worker.
 * Reads the file the user picked (all in memory, nothing is uploaded), unzips it,
 * finds the model and report definitions, and runs the analysis engine.
 * (c) DataArcus. All rights reserved.
 */
/* global MHEngine, TmdlModel */
// a model file's bytes to text and the size limits (0.3.2 DD2D: model-file.js, the MCP's too) first; the DAX tokens and report references (0.3.2 SP9), the model index (SP15), the rule texts, the rules and the questions (SP27), all before the engine; the engine, and the TMDL reader the MCP uses for projects saved as TMDL (Power BI Desktop's default)
importScripts('model-file.min.js?v=47bc00d4a4cb', 'dax-reference-parser.min.js?v=a343dfa2bb0e', 'model-index.min.js?v=0302b5d27b99', 'health-texts.min.js?v=dc21adf6917d', 'health-rules.min.js?v=e604a64d4feb', 'health-confirm.min.js?v=eb4cc43fe6ee', 'model-health-engine.min.js?v=eae0f55d972c', 'tmdl-model.min.js?v=295f66a0c64d', 'model-nearest.min.js?v=c6ffd3114120');

const post = (type, data) => self.postMessage(Object.assign({ type }, data || {}));

// ---------- minimal ZIP reader (stored + deflate) ----------
// A zip can be built to unpack to far more than it weighs (a "zip bomb"), so only the parts the check uses are read,
// each and all together within these limits, refused before unpacking when the zip's directory says more, and stopped
// while unpacking when the directory lies (the declared size is the most a part may give). The numbers: model-file.js
// LIMITS (0.3.2 DD2D), the one place the MCP's reader (mcp/lib/model.mjs, PBIT_LIMITS) reads too.
const LIMITS = self.DAModelFile.LIMITS;
async function inflateCapped(data, max) {
  const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks = []; let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > max) { try { await reader.cancel(); } catch (e) { /* already stopped */ } throw new Error('ZIP_LIMIT'); }
    chunks.push(value);
  }
  const out = new Uint8Array(n); let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}
function readZip(buf) {
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('NOT_ZIP');
  if (u8.length > LIMITS.file) throw new Error('TOO_BIG');
  let count = dv.getUint16(eocd + 10, true);
  let cdOff = dv.getUint32(eocd + 16, true);
  // ZIP64 end of central directory
  if (cdOff === 0xffffffff || count === 0xffff) {
    const loc = eocd - 20;
    if (loc >= 0 && dv.getUint32(loc, true) === 0x07064b50) {
      const z64 = Number(dv.getBigUint64(loc + 8, true));
      count = Number(dv.getBigUint64(z64 + 32, true));
      cdOff = Number(dv.getBigUint64(z64 + 48, true));
    }
  }
  if (count > LIMITS.entries) throw new Error('ZIP_LIMIT');
  const entries = [];
  let p = cdOff;
  const dec = new TextDecoder('utf-8');
  for (let k = 0; k < count && dv.getUint32(p, true) === 0x02014b50; k++) {
    const method = dv.getUint16(p + 10, true);
    let csize = dv.getUint32(p + 20, true);
    let usize = dv.getUint32(p + 24, true);
    const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
    let lho = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
    // ZIP64 extra field
    let x = p + 46 + nlen;
    const xend = x + xlen;
    while (x + 4 <= xend) {
      const id = dv.getUint16(x, true), sz = dv.getUint16(x + 2, true);
      if (id === 0x0001) {
        let q = x + 4;
        if (usize === 0xffffffff) { usize = Number(dv.getBigUint64(q, true)); q += 8; }
        if (csize === 0xffffffff) { csize = Number(dv.getBigUint64(q, true)); q += 8; }
        if (lho === 0xffffffff) { lho = Number(dv.getBigUint64(q, true)); }
      }
      x += 4 + sz;
    }
    entries.push({ name, method, csize, usize, lho });
    p += 46 + nlen + xlen + clen;
  }
  return {
    entries,
    // cap: the most this part may unpack to (LIMITS.model or LIMITS.entry)
    async read(entry, cap) {
      const max = cap || LIMITS.entry;
      if (entry.usize > max) throw new Error('ZIP_LIMIT');
      const l = entry.lho;
      if (l + 30 > u8.length || dv.getUint32(l, true) !== 0x04034b50) throw new Error('BAD_ENTRY');
      const start = l + 30 + dv.getUint16(l + 26, true) + dv.getUint16(l + 28, true);
      const data = u8.subarray(start, start + entry.csize);
      if (entry.method === 0) return data.subarray(0, entry.usize);
      if (entry.method !== 8) throw new Error('UNSUPPORTED_COMPRESSION');
      return inflateCapped(data, Math.max(1, entry.usize));
    }
  };
}

// Power BI writes some files as UTF-16LE, others as UTF-8 (with or without BOM): model-file.js decodeText (DD2D)
const decodeText = self.DAModelFile.decodeText;
const parseJson = (u8) => JSON.parse(decodeText(u8).replace(/^﻿/, ''));

async function fromZip(buf, fileName) {
  const zip = readZip(buf);
  const byName = (re) => zip.entries.filter((e) => re.test(e.name));
  const bims = byName(/(^|\/)DataModelSchema$/).concat(byName(/(^|\/)model\.bim$/i));
  let modelEntry = bims[0];
  // a project saved as TMDL: the .tmdl files of its semantic model's definition folder
  const tmdl = byName(/(^|\/)definition\/.*\.tmdl$/i).filter((e) => !/TMDLScripts\//i.test(e.name));
  const rootOf = (e) => e.name.slice(0, e.name.search(/(^|\/)definition\//) + 1);
  let root = tmdl.length ? rootOf(tmdl[0]) : '';
  if (!modelEntry && !tmdl.length) {
    if (byName(/(^|\/)DataModel$/).length) throw new Error('PBIX');
    throw new Error('NO_MODEL');
  }
  // the parts this check reads, all together within the limit, before any is unpacked
  let layout = byName(/(^|\/)Report\/Layout$/)[0];
  let legacyPbip = byName(/\.Report\/report\.json$/i)[0];
  let pbir = byName(/(^|\/)definition\/(report\.json|reportExtensions\.json|pages\/.*\.json|bookmarks\/.*\.json)$/i).filter((e) => !/StaticResources|CustomVisuals/i.test(e.name));
  // (AU1, the night audit's AUD-068: a zip with two semantic models was read as its first .tmdl's model, in zip order,
  // silently, with every report in the zip) every model in the zip, by its folder: one model.bim or DataModelSchema
  // each, one definition root with .tmdl files each. With more than one, the first by folder path is read (zip order
  // never decides), the others are named, and only the reports that can be told to be its own are read. Which folder:
  // model-nearest.js, the one rule (CONTRACTS.md 1g): the nearest the top; where it ties (two projects side by side,
  // where the MCP and the folder import refuse and ask), the first of the tied in its sorted order, said (no picker yet)
  const folders = new Map();
  bims.forEach((e) => { const f = e.name.slice(0, e.name.lastIndexOf('/') + 1); if (!folders.has(f)) folders.set(f, { bim: e }); });
  tmdl.forEach((e) => { const f = rootOf(e); if (!folders.has(f)) folders.set(f, { tmdl: true }); });
  let models = null;
  if (folders.size > 1) {
    const near = self.DAModelNearest.nearest(Array.from(folders.keys()).map((f) => f.replace(/\/$/, '')), '/'), pick = (near.path != null ? near.path : near.tied[0]) + '/';
    const read = pick === '/' ? '' : pick, order = [read].concat(Array.from(folders.keys()).filter((f) => f !== read).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    modelEntry = folders.get(read).bim || null; root = read;
    // a report's folder (where its definition.pbir is) and the model folder it belongs to: the path its definition.pbir
    // gives (byPath), else the one model in the same parent folder; null when it can't be told
    const parent = (f) => f.replace(/[^/]*\/$/, '');
    const reportFolder = (n) => { const k = n.search(/(^|\/)definition\//); return k >= 0 ? n.slice(0, k + (n[k] === '/' ? 1 : 0)) : n.slice(0, n.lastIndexOf('/') + 1); };
    const owner = new Map();
    for (const f of new Set(pbir.map((e) => reportFolder(e.name)).concat(legacyPbip ? [reportFolder(legacyPbip.name)] : []))) {
      let to = null;
      const def = zip.entries.find((e) => e.name === f + 'definition.pbir');
      if (def && def.usize <= LIMITS.entry) {
        try {
          const p = parseJson(await zip.read(def)), rel = p && p.datasetReference && p.datasetReference.byPath && p.datasetReference.byPath.path;
          if (typeof rel === 'string') {
            const parts = (f + rel.replace(/\\/g, '/')).split('/'), out = [];
            parts.forEach((x) => { if (x === '..') out.pop(); else if (x && x !== '.') out.push(x); });
            const at = out.join('/') + '/';
            if (folders.has(at)) to = at;
          }
        } catch (err) { if (err.message === 'ZIP_LIMIT') throw err; /* not readable: the folder decides */ }
      }
      if (!to) { const same = order.filter((m) => parent(m) === parent(f)); if (same.length === 1) to = same[0]; }
      owner.set(f, to);
    }
    const own = Array.from(owner.keys()).filter((f) => owner.get(f) === read).sort();
    pbir = pbir.filter((e) => owner.get(reportFolder(e.name)) === read);
    if (legacyPbip && owner.get(reportFolder(legacyPbip.name)) !== read) legacyPbip = null;
    if (layout && layout.name.slice(0, layout.name.lastIndexOf('Report/')) !== read) layout = null;
    const name = (f) => f.replace(/\/$/, '') || '(the zip\'s top folder)';
    models = { read: name(read), notRead: order.slice(1).map(name), report: pbir.length || legacyPbip || layout ? 'read' : 'notRead', reports: own.map(name) };
  }
  const needed = (modelEntry ? [modelEntry] : tmdl.filter((x) => rootOf(x) === root)).concat(layout ? [layout] : pbir.length ? pbir : legacyPbip ? [legacyPbip] : []);
  if (needed.reduce((a, e) => a + e.usize, 0) > LIMITS.total) throw new Error('ZIP_LIMIT');
  post('progress', { step: 'model' });
  let model, unreadable = [];
  if (modelEntry) model = parseJson(await zip.read(modelEntry, LIMITS.model));
  else {
    const files = [];
    for (const e of tmdl.filter((x) => rootOf(x) === root)) files.push({ path: e.name, text: decodeText(await zip.read(e)) });
    // (AU47, AUD-047) a TMDL file that could not be read fully is named, never skipped silently: the page gives no score
    const got = TmdlModel.read(files, { lineageTags: true });
    model = got.model; unreadable = got.skipped;
  }

  // report: legacy single Layout file, or PBIR folder of JSON files
  post('progress', { step: 'report' });
  let report = null;
  if (layout) report = { format: 'legacy', files: [{ path: 'Report/Layout', json: parseJson(await zip.read(layout)) }] };
  else if (pbir.length) {
    const files = [];
    for (const e of pbir) { try { files.push({ path: e.name, json: parseJson(await zip.read(e)) }); } catch (err) { if (err.message === 'ZIP_LIMIT') throw err; /* skip unreadable file */ } }
    report = { format: 'pbir', files };
  } else if (legacyPbip) {
    const j = parseJson(await zip.read(legacyPbip));
    if (j.sections) report = { format: 'legacy', files: [{ path: legacyPbip.name, json: j }] };
  }
  return { model, report, source: /\.pbit$/i.test(fileName) ? 'pbit' : 'zip', unreadable, models };
}

// (AU1) the sentence for a zip with more than one model: folder names only. Not yet approved in Arabic (D-1109-07):
// the Arabic side carries the English sentence; the draft for the owner is in mcp/work/AU1.md
function modelsSaid(m) {
  const n = 1 + m.notRead.length;
  const en = `This zip holds ${n} semantic models: the check below read ${m.read}; not read: ${m.notRead.join(', ')}. ` +
    (m.report === 'read' ? `The report read is the one of ${m.read}${m.reports.length ? ' (' + m.reports.join(', ') + ')' : ''}; the other models' reports were not read.` : `No report was read: none in the zip can be told to belong to ${m.read}.`) +
    ' To check another model, zip its project folder alone.';
  return { en, ar: en };
}

self.onmessage = async (ev) => {
  const { buffer, fileName } = ev.data;
  const t0 = Date.now();
  try {
    let input;
    const head = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
    if (head[0] === 0x50 && head[1] === 0x4b) input = await fromZip(buffer, fileName);
    else {
      post('progress', { step: 'model' });
      const json = parseJson(new Uint8Array(buffer));
      if (!json.model && !json.tables) throw new Error('NO_MODEL');
      input = { model: json, report: null, source: 'bim' };
    }
    post('progress', { step: 'analyze' });
    const result = MHEngine.analyze(input.model, input.report);
    // (AU1) no table read and nothing named is no model; tables the model names and no file defines are named instead
    if (!result.stats.tables && !(input.unreadable && input.unreadable.length)) throw new Error('NO_MODEL');
    result.meta = { fileName, source: input.source, ms: Date.now() - t0, hasReport: !!input.report, analyzedAt: new Date().toISOString() };
    // (AU47) the files' names and why, and the one message in English and Arabic (the MCP's words, tmdl-model.js)
    if (input.unreadable && input.unreadable.length) result.unreadable = { files: input.unreadable, en: TmdlModel.unreadableSaid(input.unreadable, 'en', 'check'), ar: TmdlModel.unreadableSaid(input.unreadable, 'ar', 'check') };
    // (AU1, AUD-068) more than one model in the zip: which was read and which not, before the score (the page draws it)
    if (input.models) result.models = Object.assign(input.models, modelsSaid(input.models));
    post('done', { result });
  } catch (e) {
    post('error', { code: /^[A-Z_]+$/.test(e.message) ? e.message : 'PARSE', message: String(e && e.message || e) });
  }
};
