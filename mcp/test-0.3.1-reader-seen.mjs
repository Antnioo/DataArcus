// 0.3.1 SQ6 (the night run's Seen batch 6: the reader; written red first). Made-up names only (no employer or client
// data), in temp working folders, on copies of mcp/fixtures/twin-project. In process: the reading block's own modules.
//   S4   (pins only: the refusal of two models at one depth waits for the owner, SQ6.md) the nearest model still reads
//   S15  a model part that is not JSON, or nested too deep: a coded ReadError (BAD_JSON, TOO_DEEP), its text never quoted
//   S12  a .pbit is read by its parts: no read of the whole file at once; the same print (SHA-256 of the whole file);
//        a .pbit that is a link is refused; one that changes while it is read is refused
//   CV4  a field on Power BI's auto date hierarchy reads the date column itself (Table[Column].Level)
//   A5S3 a report with no custom theme (or one without data colours) has the base theme's colours
//   S24  a large model's summary counts the area and related tables of a table whose name is cut
//   node test-0.3.1-reader-seen.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

// the working folder first: the library modules read DATAARCUS_ROOT when they are loaded
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sq6-')));
process.env.DATAARCUS_ROOT = ROOT;
const BASE = 'Twin Sales', FIX = path.join(HERE, 'fixtures/twin-project');
const fresh = (dir) => { fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true }); fs.cpSync(FIX, path.join(ROOT, dir), { recursive: true }); return path.join(ROOT, dir); };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8')), wr = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); };
const M = await import('./lib/model.mjs');
const RR = await import('./lib/read-report.mjs');
const S = await import('./lib/scope.mjs');
const attempt = (f) => { try { return { v: f() }; } catch (e) { return { e }; } };
const said = (r) => (r.e ? `threw ${r.e.code || ''}: ${String(r.e.message).slice(0, 200)}` : `read ${JSON.stringify(r.v && (r.v.source || r.v)).slice(0, 200)}`);

// a zip as Power BI writes a .pbit: stored or deflated parts, the directory, its end record
const zipOf = (entries) => {
  const parts = [], dir = []; let off = 0;
  for (const e of entries) {
    const raw = e.deflate ? zlib.deflateRawSync(e.data) : e.data, nb = Buffer.from(e.name), m = e.deflate ? 8 : 0;
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(m, 8); h.writeUInt32LE(raw.length, 18); h.writeUInt32LE(e.data.length, 22); h.writeUInt16LE(nb.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(m, 10); c.writeUInt32LE(raw.length, 20); c.writeUInt32LE(e.data.length, 24); c.writeUInt16LE(nb.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, nb, raw); dir.push(c, nb); off += 30 + nb.length + raw.length;
  }
  const cd = Buffer.concat(dir), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, end]);
};
const u16 = (o) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(typeof o === 'string' ? o : JSON.stringify(o), 'utf16le')]);
const SCHEMA = { name: 'x', compatibilityLevel: 1567, model: { tables: [{ name: 'Orders', columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }], measures: [{ name: 'Total', expression: 'SUM ( Orders[Amount] )' }] }] } };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
// every fs.readSync of the process watched: the largest single read (a whole-file read is one call of the file's size)
const realRead = fs.readSync; let biggest = 0, onRead = null;
fs.readSync = function (fd, buf, off, len, pos) { const n = typeof len === 'number' ? len : (buf && buf.length) || 0; if (n > biggest) biggest = n; if (onRead) onRead(fd); return realRead.apply(fs, arguments); };
const watched = (f) => { biggest = 0; try { return f(); } finally { onRead = null; } };

try {
  // ---------- S4 (pins): the nearest model reads; one of two named by path reads ----------
  {
    const two = path.join(ROOT, 'two'); fs.mkdirSync(two);
    fs.cpSync(FIX, path.join(two, 'Alpha'), { recursive: true }); fs.cpSync(FIX, path.join(two, 'Beta'), { recursive: true });
    const one = fresh('one'); fs.cpSync(path.join(one, BASE + '.SemanticModel'), path.join(one, 'old', 'backup', BASE + '.SemanticModel'), { recursive: true });
    const r1 = attempt(() => M.loadModel('one')), r2 = attempt(() => M.loadModel('two/Alpha'));
    chk(() => r1.v && r1.v.folder && !/backup/.test(r1.v.folder) && r2.v && /Alpha/.test(r2.v.folder), () => `S4-3. one model (and a backup deeper down) still reads the nearest; one of two named by path reads: ${said(r1)} | ${said(r2)}`);
  }

  // ---------- S15: coded JSON-part errors ----------
  {
    fs.mkdirSync(path.join(ROOT, 'json'));
    const MARK = 'Qx7MARK-not-json';
    fs.writeFileSync(path.join(ROOT, 'json', 'bad.pbit'), zipOf([{ name: 'DataModelSchema', data: u16('{"name": "' + MARK), deflate: true }]));
    let deep = { v: 1 }; for (let i = 0; i < 300; i++) deep = { a: deep };
    fs.writeFileSync(path.join(ROOT, 'json', 'deep.pbit'), zipOf([{ name: 'DataModelSchema', data: u16(deep), deflate: true }]));
    const b = attempt(() => M.loadModel('json/bad.pbit')), d = attempt(() => M.loadModel('json/deep.pbit'));
    chk(() => b.e && b.e instanceof M.ReadError && b.e.code === 'BAD_JSON' && /not valid JSON/.test(b.e.message) && !b.e.message.includes(MARK), () => `S15-1. a model part that is not JSON: ReadError BAD_JSON, its text never quoted: ${said(b)}`);
    chk(() => d.e && d.e instanceof M.ReadError && d.e.code === 'TOO_DEEP' && /nested more than 256/.test(d.e.message), () => `S15-2. a model part nested 300 deep: ReadError TOO_DEEP: ${said(d)}`);
    // pin: a PBIR report file that is not JSON is still skipped, named, "not valid JSON"
    const p = fresh('skip'); fs.writeFileSync(path.join(p, BASE + '.Report/definition/pages/p1overview/visuals/title/visual.json'), '{ not json ' + MARK);
    const s = attempt(() => M.loadModel('skip'));
    const sk = s.v && s.v.reportsSeen && s.v.reportsSeen.skipped;
    chk(() => sk && sk.some((x) => /title\/visual\.json$/.test(x.file) && x.why === 'not valid JSON') && !JSON.stringify(s.v.reportsSeen).includes(MARK), () => `S15-3. a report file that is not JSON is skipped as "not valid JSON": ${JSON.stringify(sk || said(s)).slice(0, 300)}`);
  }

  // ---------- S12: a .pbit read by its parts ----------
  {
    fs.mkdirSync(path.join(ROOT, 'pbit'));
    const img = crypto.randomBytes(24 * 1024 * 1024), schema = u16(SCHEMA);
    const file = zipOf([{ name: 'Version', data: Buffer.from('1.28') }, { name: 'Report/StaticResources/RegisteredResources/big.png', data: img }, { name: 'DataModelSchema', data: schema, deflate: true }]);
    const f = path.join(ROOT, 'pbit', 'Big Image.pbit'); fs.writeFileSync(f, file);
    const r = watched(() => attempt(() => M.loadModel('pbit/Big Image.pbit'))), most = biggest;
    chk(() => r.v && r.v.tables.some((t) => t.name === 'Orders') && r.v.print === sha(file), () => `S12-1. the .pbit is read as before and its print is the SHA-256 of the whole file: ${said(r)} print ${r.v && r.v.print} vs ${sha(file)}`);
    chk(() => r.v && most <= 2 * 1024 * 1024, () => `S12-2. no read of the 24 MB .pbit at once (the largest single read ${most} bytes, at most 2 MB)`);
    // the limits still hold on this route: a .pbix by another name, a part above its cap (a test cap through unzipNeeded)
    fs.writeFileSync(path.join(ROOT, 'pbit', 'cache.pbit'), zipOf([{ name: 'DataModel', data: Buffer.from('cache') }, { name: 'Version', data: Buffer.from('1') }]));
    const x = attempt(() => M.loadModel('pbit/cache.pbit'));
    chk(() => x.e && x.e.code === 'PBIX_FILE', () => `S12-3. a .pbix by another name is still refused: ${said(x)}`);
    const capped = attempt(() => M.unzipNeeded(file, { entry: 1000, model: 100, total: 1e6, file: 1e9, entries: 100 }));
    chk(() => capped.e && capped.e.code === 'TOO_BIG' && /model part/.test(capped.e.message), () => `S12-4. unzipNeeded on a buffer keeps its limits (a model part above its cap): ${said(capped)}`);
    // a .pbit that is a link (to a .pbit inside the working folder) is refused, never followed
    let linked = true; try { fs.symlinkSync(f, path.join(ROOT, 'pbit', 'Linked.pbit')); } catch (e) { linked = false; }
    if (linked) {
      const l = attempt(() => M.loadModel('pbit/Linked.pbit'));
      chk(() => l.e && /link/i.test(l.e.message) && !(l.v && l.v.tables), () => `S12-5. a .pbit that is a link is refused, never followed: ${said(l)}`);
    }
    // a .pbit that grows while it is read (here: right after its first read) is refused, nothing used
    const g = path.join(ROOT, 'pbit', 'Grows.pbit'); fs.writeFileSync(g, file);
    let grown = false; onRead = () => { if (!grown) { grown = true; fs.appendFileSync(g, Buffer.alloc(4096)); } };
    const c = watched(() => attempt(() => M.loadModel('pbit/Grows.pbit')));
    chk(() => grown && c.e && /changed while/.test(c.e.message), () => `S12-6. a .pbit that changes while it is read is refused: ${said(c)} (grown ${grown})`);
  }

  // ---------- CV4: the auto date hierarchy ----------
  {
    const p = fresh('autodate'), vf = path.join(p, BASE + '.Report/definition/pages/p1overview/visuals/lineMonth/visual.json'), j = rd(vf);
    j.visual.query.queryState.Category.projections = [{ field: { HierarchyLevel: { Expression: { Hierarchy: { Expression: { PropertyVariationSource: { Expression: { SourceRef: { Entity: 'Calendar' } }, Name: 'Variation', Property: 'Order Date' } }, Hierarchy: 'Date Hierarchy' } }, Level: 'Year' } }, queryRef: 'Calendar.Order Date.Variation.Date Hierarchy.Year' }];
    wr(vf, j);
    const t = attempt(() => RR.readReport(`autodate/${BASE}.pbip`)), line = t.v ? t.v.split('\n').find((l) => /lineMonth|line chart/i.test(l)) || '' : '';
    chk(() => t.v && /Calendar\[Order Date\]\.Year/.test(t.v) && !/\[Date Hierarchy\]/.test(t.v), () => `CV4-1. a level of the auto date hierarchy reads the date column itself, Calendar[Order Date].Year: ${line.slice(0, 300) || said(t)}`);
    // pin: a user hierarchy (its SourceRef on the hierarchy) reads as before
    j.visual.query.queryState.Category.projections = [{ field: { HierarchyLevel: { Expression: { Hierarchy: { Expression: { SourceRef: { Entity: 'Calendar' } }, Hierarchy: 'Fiscal' } }, Level: 'Month' } }, queryRef: 'Calendar.Fiscal.Month' }];
    wr(vf, j);
    const u = attempt(() => RR.readReport(`autodate/${BASE}.pbip`));
    chk(() => u.v && /Calendar\[Fiscal\]\.Month/.test(u.v), () => `CV4-2. a user hierarchy reads as before, Calendar[Fiscal].Month: ${said(u)}`);
  }

  // ---------- A5S3: the base theme's colours ----------
  {
    const BASE_COLOURS = ['#1A2B3C', '#4D5E6F', '#7A8B9C'];
    const withBase = (dir, custom) => {
      const p = fresh(dir), rep = path.join(p, BASE + '.Report'), rj = path.join(rep, 'definition/report.json'), j = rd(rj);
      j.themeCollection = Object.assign(custom ? { customTheme: j.themeCollection.customTheme } : {}, { baseTheme: { name: 'CY99SU01', reportVersionAtImport: '5.61', type: 'SharedResources' } });
      wr(rj, j);
      wr(path.join(rep, 'StaticResources/SharedResources/BaseThemes/CY99SU01.json'), { name: 'CY99SU01', dataColors: BASE_COLOURS, foreground: '#252423', background: '#FFFFFF', tableAccent: '#1A2B3C' });
      return { p, rep };
    };
    withBase('base-only', false);
    const inv = (dir) => RR.inventory(RR.diskSource(RR.locate(`${dir}/${BASE}.pbip`), { big: [], deep: 0 }), BASE);
    const a = attempt(() => inv('base-only'));
    chk(() => a.v && JSON.stringify(a.v.theme.dataColors) === JSON.stringify(BASE_COLOURS.map((c) => c.toLowerCase())) || (a.v && JSON.stringify(a.v.theme.dataColors) === JSON.stringify(BASE_COLOURS)), () => `A5S3-1. no custom theme: the base theme's colours: ${JSON.stringify(a.v && a.v.theme)}`);
    const t = attempt(() => RR.readReport(`base-only/${BASE}.pbip`));
    chk(() => t.v && /THEME [^\n]*colours #?1a2b3c/i.test(t.v), () => `A5S3-2. read_report's THEME line names the base theme's colours: ${t.v ? t.v.split('\n')[1] : said(t)}`);
    // pin: a custom theme with its own colours wins over the base; the identity never takes the base's colours as its own
    withBase('both', true);
    const c = attempt(() => inv('both')), own = rd(path.join(FIX, BASE + '.Report/StaticResources/RegisteredResources/twin-theme.json')).dataColors;
    chk(() => c.v && c.v.theme.dataColors && c.v.theme.dataColors[0].toLowerCase() === String(own[0]).toLowerCase() && !c.v.theme.dataColors.some((h) => /1a2b3c/i.test(h)), () => `A5S3-3. a custom theme's own colours win: ${JSON.stringify(c.v && c.v.theme)}`);
    const id = attempt(() => RR.reportIdentity(RR.diskSource(RR.locate(`base-only/${BASE}.pbip`), { big: [], deep: 0 }), BASE));
    chk(() => id.v && !JSON.stringify(id.v.identity && id.v.identity.themeColours || []).match(/1a2b3c/i), () => `A5S3-4. reportIdentity never counts the base theme's colours as the report's own: ${JSON.stringify(id.v || said(id)).slice(0, 300)}`);
    // a custom theme without data colours: the base's apply (as Power BI draws it)
    const nc = withBase('custom-no-colours', true), tf = path.join(nc.rep, 'StaticResources/RegisteredResources/twin-theme.json'), tj = rd(tf); delete tj.dataColors; wr(tf, tj);
    const n = attempt(() => inv('custom-no-colours'));
    chk(() => n.v && n.v.theme.dataColors && /1a2b3c/i.test(n.v.theme.dataColors[0]), () => `A5S3-5. a custom theme without data colours: the base theme's: ${JSON.stringify(n.v && n.v.theme)}`);
  }

  // ---------- S24: a large model's summary, a table whose name is cut ----------
  {
    const long = (c) => 'Fact ' + c.repeat(230), LONG_A = long('a'), LONG_B = long('b');
    const meas = (t, n, folder) => Array.from({ length: n }, (_, i) => ({ name: `${t.slice(0, 12)} Measure ${i} with a fairly long name to fill the answer`, expression: '1', formatString: '#,0', displayFolder: folder }));
    const tables = [{ name: 'Dim', columns: [{ name: 'Key', dataType: 'int64', sourceColumn: 'Key' }] },
      { name: LONG_A, columns: [{ name: 'Key', dataType: 'int64', sourceColumn: 'Key' }], measures: meas('A', 9, 'Alpha') },
      { name: LONG_B, columns: [{ name: 'Key', dataType: 'int64', sourceColumn: 'Key' }], measures: meas('B', 1, 'Zeta') }];
    for (let i = 0; i < 110; i++) tables.push({ name: `Table ${String(i).padStart(3, '0')}`, columns: [{ name: 'Key', dataType: 'int64', sourceColumn: 'Key' }, { name: 'Description of the row', dataType: 'string', sourceColumn: 'D' }], measures: meas(`T${i}`, 4, 'Common') });
    const bim = { name: 'Large', compatibilityLevel: 1567, model: { tables, relationships: [{ name: 'r1', fromTable: LONG_A, fromColumn: 'Key', toTable: 'Dim', toColumn: 'Key' }] } };
    fs.mkdirSync(path.join(ROOT, 'large', 'Large.SemanticModel'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'large', 'Large.SemanticModel', 'model.bim'), JSON.stringify(bim));
    const m = attempt(() => M.loadModel('large/Large.SemanticModel'));
    const sum = m.v && S.isLarge(m.v) ? S.largeSummary(m.v) : null;
    const rowA = sum && sum.tablesWithMeasures.find((t) => String(t.table).startsWith('Fact aaa'));
    chk(() => rowA && rowA.relatedTables === 1, () => `S24-1. the cut-named table's related tables are counted (1): ${JSON.stringify(rowA || (sum ? Object.keys(sum) : said(m))).slice(0, 300)}`);
    const by = sum && sum.notListed && sum.notListed.byArea;
    chk(() => by && by.some((a) => a.area === 'Zeta' && a.tables === 1) && !by.some((a) => a.area === '(no display folder)'), () => `S24-2. the cut-named table left out of the list is counted in its area (Zeta): ${JSON.stringify(by || (sum && sum.notListed) || said(m)).slice(0, 300)}`);
  }
} finally {
  fs.readSync = realRead;
  try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* the OS cleans its temp folder */ }
}
if (problems.length) { console.log(`FAIL script=test-0.3.1-reader-seen.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  reader-seen  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  reader-seen  ${checks} checks`);
process.exit(0);
