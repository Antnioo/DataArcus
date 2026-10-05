/*
 * DataArcus Power BI Model Health Check: background worker.
 * Reads the file the user picked (all in memory, nothing is uploaded), unzips it,
 * finds the model and report definitions, and runs the analysis engine.
 * (c) DataArcus. All rights reserved.
 */
/* global MHEngine, TmdlModel */
// the engine, and the TMDL reader the MCP uses for projects saved as TMDL (Power BI Desktop's default)
importScripts('model-health-engine.min.js?v=20261004c', 'tmdl-model.min.js?v=20261004a');

const post = (type, data) => self.postMessage(Object.assign({ type }, data || {}));

// ---------- minimal ZIP reader (stored + deflate) ----------
// A zip can be built to unpack to far more than it weighs (a "zip bomb"), so only the parts the check uses are read,
// each and all together within these limits, refused before unpacking when the zip's directory says more, and stopped
// while unpacking when the directory lies (the declared size is the most a part may give). The same numbers as the
// MCP's reader (mcp/lib/model.mjs, PBIT_LIMITS; the evidence is in mcp/WORK.md, "The .pbit limits").
const MB = 1024 * 1024;
const LIMITS = { model: 64 * MB, entry: 32 * MB, total: 128 * MB, file: 300 * MB, entries: 20000 };
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

// Power BI writes some files as UTF-16LE, others as UTF-8 (with or without BOM)
function decodeText(u8) {
  if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8.subarray(2));
  if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) return new TextDecoder('utf-8').decode(u8.subarray(3));
  if (u8.length >= 2 && u8[1] === 0x00) return new TextDecoder('utf-16le').decode(u8);
  return new TextDecoder('utf-8').decode(u8);
}
const parseJson = (u8) => JSON.parse(decodeText(u8).replace(/^﻿/, ''));

async function fromZip(buf, fileName) {
  const zip = readZip(buf);
  const byName = (re) => zip.entries.filter((e) => re.test(e.name));
  let modelEntry = byName(/(^|\/)DataModelSchema$/)[0] || byName(/(^|\/)model\.bim$/i)[0];
  // a project saved as TMDL: the .tmdl files of its (first) semantic model's definition folder
  const tmdl = byName(/(^|\/)definition\/.*\.tmdl$/i).filter((e) => !/TMDLScripts\//i.test(e.name));
  const root = tmdl.length ? tmdl[0].name.slice(0, tmdl[0].name.search(/(^|\/)definition\//) + 1) : '';
  if (!modelEntry && !tmdl.length) {
    if (byName(/(^|\/)DataModel$/).length) throw new Error('PBIX');
    throw new Error('NO_MODEL');
  }
  // the parts this check reads, all together within the limit, before any is unpacked
  const layout = byName(/(^|\/)Report\/Layout$/)[0];
  const legacyPbip = byName(/\.Report\/report\.json$/i)[0];
  const pbir = byName(/(^|\/)definition\/(report\.json|reportExtensions\.json|pages\/.*\.json|bookmarks\/.*\.json)$/i).filter((e) => !/StaticResources|CustomVisuals/i.test(e.name));
  const needed = (modelEntry ? [modelEntry] : tmdl.filter((x) => x.name.startsWith(root))).concat(layout ? [layout] : pbir.length ? pbir : legacyPbip ? [legacyPbip] : []);
  if (needed.reduce((a, e) => a + e.usize, 0) > LIMITS.total) throw new Error('ZIP_LIMIT');
  post('progress', { step: 'model' });
  let model;
  if (modelEntry) model = parseJson(await zip.read(modelEntry, LIMITS.model));
  else {
    const files = [];
    for (const e of tmdl.filter((x) => x.name.startsWith(root))) files.push({ path: e.name, text: decodeText(await zip.read(e)) });
    model = TmdlModel.fromFiles(files, { lineageTags: true });
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
  return { model, report, source: /\.pbit$/i.test(fileName) ? 'pbit' : 'zip' };
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
    if (!result.stats.tables) throw new Error('NO_MODEL');
    result.meta = { fileName, source: input.source, ms: Date.now() - t0, hasReport: !!input.report, analyzedAt: new Date().toISOString() };
    post('done', { result });
  } catch (e) {
    post('error', { code: /^[A-Z_]+$/.test(e.message) ? e.message : 'PARSE', message: String(e && e.message || e) });
  }
};
