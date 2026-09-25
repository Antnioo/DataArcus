/*
 * DataArcus Power BI Model Health Check: background worker.
 * Reads the file the user picked (all in memory, nothing is uploaded), unzips it,
 * finds the model and report definitions, and runs the analysis engine.
 * (c) DataArcus. All rights reserved.
 */
/* global MHEngine */
importScripts('model-health-engine.min.js');

const post = (type, data) => self.postMessage(Object.assign({ type }, data || {}));

// ---------- minimal ZIP reader (stored + deflate) ----------
function readZip(buf) {
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('NOT_ZIP');
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
    async read(entry) {
      const l = entry.lho;
      if (dv.getUint32(l, true) !== 0x04034b50) throw new Error('BAD_ENTRY');
      const start = l + 30 + dv.getUint16(l + 26, true) + dv.getUint16(l + 28, true);
      const data = u8.subarray(start, start + entry.csize);
      if (entry.method === 0) return data;
      if (entry.method !== 8) throw new Error('UNSUPPORTED_COMPRESSION');
      const ds = new DecompressionStream('deflate-raw');
      const out = new Response(new Blob([data]).stream().pipeThrough(ds));
      return new Uint8Array(await out.arrayBuffer());
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
  const tmdl = byName(/\.tmdl$/i).filter((e) => !/TMDLScripts\//i.test(e.name));
  if (!modelEntry) {
    if (byName(/(^|\/)DataModel$/).length) throw new Error('PBIX');
    if (tmdl.length) throw new Error('TMDL_ONLY');
    throw new Error('NO_MODEL');
  }
  post('progress', { step: 'model' });
  const model = parseJson(await zip.read(modelEntry));

  // report: legacy single Layout file, or PBIR folder of JSON files
  post('progress', { step: 'report' });
  let report = null;
  const layout = byName(/(^|\/)Report\/Layout$/)[0];
  const legacyPbip = byName(/\.Report\/report\.json$/i)[0];
  const pbir = byName(/(^|\/)definition\/(report\.json|pages\/.*\.json|bookmarks\/.*\.json)$/i).filter((e) => !/StaticResources|CustomVisuals/i.test(e.name));
  if (layout) report = { format: 'legacy', files: [{ path: 'Report/Layout', json: parseJson(await zip.read(layout)) }] };
  else if (pbir.length) {
    const files = [];
    for (const e of pbir) { try { files.push({ path: e.name, json: parseJson(await zip.read(e)) }); } catch (err) { /* skip unreadable file */ } }
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
    result.meta = { fileName, source: input.source, ms: Date.now() - t0, hasReport: !!input.report, analyzedAt: new Date().toISOString() };
    post('done', { result });
  } catch (e) {
    post('error', { code: /^[A-Z_]+$/.test(e.message) ? e.message : 'PARSE', message: String(e && e.message || e) });
  }
};
