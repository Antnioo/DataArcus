// rc.23: three fixes from an outside audit of 0.2.9, so mcp/PRIVACY.md says exactly what the code does. Each written red
// first.
//   F1: a .pbix (it holds Power BI's data cache) and data files (.csv, .tsv, .xlsx, .xlsm, .xls, .parquet) are refused
//       by name before they are opened; a zip accepted by name (.pbit, no extension) whose directory lists a DataModel
//       and no DataModelSchema is refused after reading its directory only, never the DataModel's bytes
//   F3: PRIVACY.md, README.md and read_report's description say what is read and what is returned, exactly
//   F7b: "No" in the app's own approval prompt (MCP elicitation) refuses the plan, as "Not now" in the window does
//   node test-rc23.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { elicitClient } from './test-audit6.mjs';
import { loadModel } from './lib/model.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-rc23-'));

// ---------- a tiny zip writer (stored or deflated entries), for made-up files ----------
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
// entries: [{ name, data (Buffer), deflate }]. Returns { buf, ranges: { name: [start, end) of the entry's stored bytes }, dirStart }
function zip(entries) {
  const locals = [], central = [], ranges = {}; let off = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8'), body = e.deflate ? zlib.deflateRawSync(e.data) : e.data, crc = crc32(e.data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(e.deflate ? 8 : 0, 8); h.writeUInt32LE(crc, 14); h.writeUInt32LE(body.length, 18); h.writeUInt32LE(e.data.length, 22); h.writeUInt16LE(name.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(e.deflate ? 8 : 0, 10); c.writeUInt32LE(crc, 16); c.writeUInt32LE(body.length, 20); c.writeUInt32LE(e.data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(off, 42);
    ranges[e.name] = [off + 30 + name.length, off + 30 + name.length + body.length];
    locals.push(h, name, body); central.push(c, name); off += 30 + name.length + body.length;
  }
  const dir = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(off, 16);
  return { buf: Buffer.concat([...locals, dir, end]), ranges, dirStart: off };
}

// ---------- made-up files (no employer data): a .pbix-shaped zip, a .csv and a .xlsx, each with a sentinel ----------
const SENT = 'RC23_SENTINEL_DATA_CACHE_7f3a', SENT_CSV = 'RC23_SENTINEL_CSV_91bd', SENT_XLSX = 'RC23_SENTINEL_XLSX_c04e';
const pbix = zip([
  { name: '[Content_Types].xml', data: Buffer.from('<?xml version="1.0"?><Types/>') },
  { name: 'Version', data: Buffer.from('1.28') },
  { name: 'DataModel', data: Buffer.from((SENT + ' ').repeat(400)) },   // stored: the sentinel is in the file's bytes as they are
  { name: 'Report/Layout', data: Buffer.from(JSON.stringify({ sections: [] }), 'utf16le') }
]);
const xlsx = zip([
  { name: '[Content_Types].xml', data: Buffer.from('<?xml version="1.0"?><Types/>') },
  { name: 'xl/worksheets/sheet1.xml', data: Buffer.from(`<worksheet><sheetData><row><c t="inlineStr"><is><t>${SENT_XLSX}</t></is></c></row></sheetData></worksheet>`) }
]);
fs.writeFileSync(path.join(ROOT, 'Sales.pbix'), pbix.buf);
fs.writeFileSync(path.join(ROOT, 'Sales copy.pbit'), pbix.buf);   // the same bytes named as a template
fs.writeFileSync(path.join(ROOT, 'Sales copy'), pbix.buf);        // and with no extension
fs.writeFileSync(path.join(ROOT, 'orders.csv'), `Customer,Amount\n${SENT_CSV},100\n`);
fs.writeFileSync(path.join(ROOT, 'orders.xlsx'), xlsx.buf);
for (const ext of ['tsv', 'xlsm', 'xls', 'parquet']) fs.writeFileSync(path.join(ROOT, 'orders.' + ext), SENT_CSV);
// a real template and a model's JSON still read
fs.copyFileSync(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-ramadan/Ramadan Test.pbit'), path.join(ROOT, 'Ramadan Test.pbit'));
const pbitBytes = fs.readFileSync(path.join(ROOT, 'Ramadan Test.pbit'));
fs.writeFileSync(path.join(ROOT, 'model.json'), JSON.stringify({ name: 'm', model: { tables: [{ name: 'Sales', columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }], measures: [{ name: 'Total', expression: 'SUM(Sales[Amount])' }] }] } }));

// ---------- F1: what is read from disk, byte by byte (every way model.mjs reads a file) ----------
const reads = new Map(), fds = new Map(), cursor = new Map();
const keyOf = (p) => { try { return fs.realpathSync(String(p)); } catch (e) { return path.resolve(String(p)); } };
const note = (file, start, n) => { if (!reads.has(file)) reads.set(file, []); reads.get(file).push([start, start + n]); };
const orig = { openSync: fs.openSync, readSync: fs.readSync, readFileSync: fs.readFileSync, closeSync: fs.closeSync };
fs.openSync = function (p, ...rest) { const fd = orig.openSync.call(fs, p, ...rest); if (typeof p === 'string' || p instanceof URL) { fds.set(fd, keyOf(p)); cursor.set(fd, 0); note(keyOf(p), 0, 0); } return fd; };
fs.readSync = function (fd, buf, a, b, c) {
  // readSync(fd, buffer, offset, length, position) or readSync(fd, buffer, { position, ... })
  const pos = typeof a === 'object' && a ? a.position : c, n = orig.readSync.apply(fs, arguments), f = fds.get(fd);
  if (f) { const at = pos == null ? cursor.get(fd) : Number(pos); note(f, at, n); if (pos == null) cursor.set(fd, at + n); }
  return n;
};
fs.readFileSync = function (p, ...rest) { const r = orig.readFileSync.call(fs, p, ...rest); if (typeof p === 'string' || p instanceof URL) note(keyOf(p), 0, Buffer.byteLength(r)); return r; };
fs.closeSync = function (fd) { fds.delete(fd); cursor.delete(fd); return orig.closeSync.call(fs, fd); };
const readOf = (name) => reads.get(keyOf(path.join(ROOT, name))) || null;
const bytesOf = (name) => (readOf(name) || []).reduce((s, [a, b]) => s + (b - a), 0);
const overlaps = (name, [s, e]) => (readOf(name) || []).some(([a, b]) => a < e && b > s);
const tryLoad = (p) => { try { return { ok: loadModel(p, { root: ROOT }) }; } catch (e) { return { err: e }; } };
const said = (r) => (r.err ? String(r.err.message) + ' ' + String(r.err.code || '') : JSON.stringify(r.ok).slice(0, 2000));

{
  const r = tryLoad('Sales.pbix');
  chk(() => r.err && /\.pbix/.test(r.err.message) && /Export > Power BI template/.test(r.err.message) && /project/i.test(r.err.message), () => `F1. a .pbix is refused, saying how to get a .pbit or a project: ${said(r)}`);
  chk(() => readOf('Sales.pbix') === null, () => `F1. a .pbix is refused by its name before it is opened: read ${JSON.stringify(readOf('Sales.pbix'))}`);
  chk(() => !said(r).includes(SENT), () => 'F1. the .pbix refusal holds nothing of the file');
}
for (const name of ['Sales copy.pbit', 'Sales copy']) {
  const r = tryLoad(name), dir = [pbix.dirStart, pbix.buf.length];
  chk(() => r.err && /DataModel|data cache/.test(r.err.message) && /Export > Power BI template/.test(r.err.message), () => `F1. "${name}", a zip with a DataModel and no DataModelSchema, is refused: ${said(r)}`);
  chk(() => !overlaps(name, pbix.ranges.DataModel), () => `F1. "${name}": the DataModel's bytes are never read: reads ${JSON.stringify(readOf(name))}, DataModel at ${pbix.ranges.DataModel}`);
  chk(() => (readOf(name) || []).every(([a, b]) => a === b || (a >= dir[0] && b <= dir[1]) || (a === 0 && b <= 4)), () => `F1. "${name}": only the zip's signature and its directory are read: reads ${JSON.stringify(readOf(name))}, directory ${dir}`);
  chk(() => !said(r).includes(SENT), () => `F1. "${name}": the refusal holds nothing of the file`);
}
for (const ext of ['csv', 'xlsx', 'tsv', 'xlsm', 'xls', 'parquet']) {
  const r = tryLoad('orders.' + ext);
  chk(() => r.err && new RegExp('\\.' + ext + '\\b').test(r.err.message) && /data file/i.test(r.err.message), () => `F1. a .${ext} is refused as a data file: ${said(r)}`);
  chk(() => readOf('orders.' + ext) === null, () => `F1. a .${ext} is refused by its name before it is opened: read ${JSON.stringify(readOf('orders.' + ext))}`);
  chk(() => !said(r).includes(SENT_CSV) && !said(r).includes(SENT_XLSX), () => `F1. the .${ext} refusal holds nothing of the file`);
}
{
  const t = tryLoad('Ramadan Test.pbit');
  chk(() => t.ok && t.ok.tables.length > 0 && bytesOf('Ramadan Test.pbit') >= pbitBytes.length, () => `F1. a real .pbit still reads (its directory, then the file): ${said(t)}`);
  const j = tryLoad('model.json');
  chk(() => j.ok && j.ok.tables.some((x) => x.name === 'Sales'), () => `F1. a model's JSON (.json) still reads: ${said(j)}`);
}
Object.assign(fs, orig);

// the same through the server: no tool's answer holds a sentinel
{
  const s = await serverClient(ROOT);
  for (const [tool, p] of [['read_model', 'Sales.pbix'], ['check_model_health', 'Sales.pbix'], ['read_model', 'Sales copy.pbit'], ['suggest_fields', 'Sales copy'], ['read_model', 'orders.csv'], ['check_model_health', 'orders.xlsx']]) {
    const r = await s.call(tool, { path: p });
    chk(() => r.err && ![SENT, SENT_CSV, SENT_XLSX].some((x) => r.t.includes(x)), () => `F1. ${tool} on "${p}" refuses and its answer holds no sentinel: ${short(r)}`);
  }
  const ok = await s.call('read_model', { path: 'Ramadan Test.pbit' });
  chk(() => !ok.err, () => `F1. read_model still reads a real .pbit: ${short(ok)}`);
  await s.close();
}

// ---------- F7b: "No" in the app's own prompt refuses the plan; approve_plan on that id can't approve it later ----------
{
  let answer = { action: 'decline' };
  const app = await elicitClient(ROOT, () => answer);
  const p = await app.call('generate_theme', { brand: '#0F766E' }), id = p.j && p.j.plan && p.j.plan.planId;
  const r1 = await app.call('approve_plan', { planId: id });
  chk(() => r1.err && /Not approved/.test(r1.t) && /declined/.test(r1.t) && /refused/.test(r1.t), () => `F7b. declined in the app: refused, and the answer says so: ${short(r1)}`);
  const w = await app.call('generate_theme', { brand: '#0F766E', planId: id });
  chk(() => w.err && /refused/.test(w.t) && /app/.test(w.t) && !/not approved yet/.test(w.t), () => `F7b. after a decline in the app the plan is refused (as after "Not now"), not "not approved yet": ${short(w)}`);
  answer = { action: 'accept', content: { approve: true } };
  const r2 = await app.call('approve_plan', { planId: id });
  chk(() => r2.err && /refused/.test(r2.t) && !(r2.j && r2.j.status === 'approved'), () => `F7b. approve_plan on the declined plan's id cannot approve it, even when the app now says yes: ${short(r2)}`);
  const w2 = await app.call('generate_theme', { brand: '#0F766E', planId: id });
  chk(() => w2.err && /refused/.test(w2.t), () => `F7b. and the declined plan still writes nothing: ${short(w2)}`);
  // the box left unticked ("accept" with approve false) is a no too: refused
  answer = { action: 'accept', content: { approve: false } };
  const q = await app.call('generate_theme', { brand: '#0F766E' }), id2 = q.j && q.j.plan && q.j.plan.planId;
  await app.call('approve_plan', { planId: id2 });
  answer = { action: 'accept', content: { approve: true } };
  const r3 = await app.call('approve_plan', { planId: id2 });
  chk(() => r3.err && /refused/.test(r3.t), () => `F7b. "accept" with approve false refuses the plan too: ${short(r3)}`);
  // the prompt closed without an answer ("cancel") is not a no: the plan can still be approved
  answer = { action: 'cancel' };
  const c = await app.call('generate_theme', { brand: '#0F766E' }), id3 = c.j && c.j.plan && c.j.plan.planId;
  const r4 = await app.call('approve_plan', { planId: id3 });
  answer = { action: 'accept', content: { approve: true } };
  const r5 = await app.call('approve_plan', { planId: id3 });
  chk(() => r4.err && /closed/.test(r4.t) && !r5.err && r5.j.status === 'approved', () => `F7b. a prompt closed without an answer leaves the plan to be approved later: ${short(r4)} / ${short(r5)}`);
  await app.close();
}

// ---------- F3: the privacy texts say what is read and what is returned, exactly ----------
{
  const privacy = fs.readFileSync(path.join(HERE, 'PRIVACY.md'), 'utf8'), readme = fs.readFileSync(path.join(HERE, 'README.md'), 'utf8'), server = fs.readFileSync(path.join(HERE, 'server.mjs'), 'utf8');
  const flat = (s) => s.replace(/\s+/g, ' ');
  // (G1, 0.3.1) read_report's row moved with the tool table to mcp/TOOLS.md; its check reads it there
  const p = flat(privacy), rm = flat(fs.readFileSync(path.join(HERE, 'TOOLS.md'), 'utf8'));
  chk(() => !/which holds no data/.test(p), () => 'F3. PRIVACY.md no longer says a .pbit\'s schema "holds no data"');
  chk(() => p.includes('A model\'s definition can hold small tables typed into Power BI ("Enter data", their rows compressed inside the Power Query text) and DATATABLE values in DAX: DataArcus reads those definition files on your machine, but never decodes such values and never returns them.'), () => 'F3. PRIVACY.md section 3 names "Enter data" tables and DATATABLE values: read on your machine, never decoded, never returned');
  chk(() => p.includes('It refuses a `.pbix` (it holds Power BI\'s data cache) and data files (`.csv`, `.tsv`, `.xlsx`, `.xlsm`, `.xls`, `.parquet`) by their name, before opening them, and a template whose list of parts shows a data cache before reading the rest of it.'), () => 'F3. PRIVACY.md section 3 says a .pbix and data files are refused by name before opening');
  chk(() => !/Slicer selections, bookmark states and data are never read/.test(p) && p.includes('Slicer selections and bookmark states are read with the report\'s files but never returned; it reads none of your tables\' data.'), () => 'F3. PRIVACY.md\'s read_report row: slicer selections and bookmark states are read with the files, never returned');
  chk(() => !/Never reads filter values, slicer selections, bookmark states or data/.test(rm) && rm.includes('Filter values, slicer selections and bookmark states are read with the report\'s files but never returned; it reads none of your tables\' data.'), () => 'F3. TOOLS.md\'s read_report row says the same');
  const rr = fs.readFileSync(path.join(HERE, 'lib/read-report.mjs'), 'utf8');
  chk(() => !/bookmark states and data are never read/.test(rr) && rr.includes('filter values, slicer selections and bookmark states are read with the report\\\'s files but never returned'), () => 'F3. read_report\'s note in every answer says the same');
  chk(() => !/are never read; titles/.test(server) && server.includes('filter values, slicer selections and bookmark states are read with the report\\\'s files but never returned'), () => 'F3. read_report\'s description says the same');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  rc23  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  rc23  ${checks} checks`);
