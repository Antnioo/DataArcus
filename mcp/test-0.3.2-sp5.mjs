// 0.3.2 SP5 (the split: B-280, B-286; mcp/work/SP5.md). A characterisation suite: the report writer's ZIP and its sample
// model are byte for byte what the base wrote (integration/0.3.2 550cea1, before pbip-export.js's ZIP encoder and sample
// model moved to assets/js/pbip-zip.js and assets/js/pbip-sample.js). In process; the clock is fixed (the ZIP writes the
// time of the call into every entry) and Math.random is seeded before each build (pbip-query.js's ids: in Node the
// engines have no root.crypto). Each result is compared by its sha256, recorded in fixtures/sp5-zips.json;
// SP5_RECORD=1 records them again (only on the base, never to make a run pass). Made-up data only: the sample model.
//   Z1  a ZIP of named entries (text, bytes, an Arabic name, an empty file);  Z2  crc32 of four inputs;
//   Z3  the same entries give the same bytes twice, stored (no compression)
//   S1-S4  build with the sample model, EN and AR (right to left) x two themes: the ZIP and every file
//   F1  fitOptions for the sample, EN and AR;  A1  AR_MONTHS
//   node test-0.3.2-sp5.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (b) => crypto.createHash('sha256').update(typeof b === 'string' ? Buffer.from(b, 'utf8') : Buffer.from(b)).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp5-zips.json');
const RECORD = process.env.SP5_RECORD === '1';

// the fixed clock: new Date() with no argument is 2026-11-02 10:20:30 local time (the ZIP's entries carry local time)
const RealDate = Date, FIXED = new RealDate(2026, 10, 2, 10, 20, 30).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(FIXED); } static now() { return FIXED; } };
// the seeded random source, restarted before each build
let s = 0;
const seed = (n) => { s = n >>> 0 || 1; };
Math.random = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };

const Pbip = require('../assets/js/pbip-export.js'), D = require('../assets/js/design-engine.js');
const gold = RECORD ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8'));
const got = {};
const same = (key, value) => { got[key] = value; return RECORD || JSON.stringify(gold[key]) === JSON.stringify(value); };
const diff = (key) => { const a = gold[key], b = got[key]; if (!a || typeof a !== 'object' || !b || typeof b !== 'object') return JSON.stringify(b).slice(0, 200) + ' (recorded ' + JSON.stringify(a).slice(0, 200) + ')';
  const keys = [...new Set(Object.keys(a).concat(Object.keys(b)))].filter((k) => a[k] !== b[k]); return keys.length + ' differ: ' + keys.slice(0, 4).join(', '); };

try {
  // ---------- the ZIP ----------
  const entries = [{ path: 'a.txt', data: 'hello\n' }, { path: 'dir/b.bin', data: new Uint8Array([0, 1, 2, 250, 255]) },
    { path: 'تقرير/الصفحة.json', data: '{"اسم": "قيمة"}' }, { path: 'empty.txt', data: '' }];
  const z = Pbip.zip(entries);
  chk(() => same('Z1', sha(z)), () => 'Z1 the ZIP of four named entries differs: ' + diff('Z1'));
  chk(() => same('Z2', ['', 'a', 'hello\n', 'الشهر'].map((t) => Pbip.crc32(new TextEncoder().encode(t)))), () => 'Z2 crc32 differs: ' + diff('Z2'));
  const z2 = Pbip.zip(entries), dv = new DataView(z.buffer, z.byteOffset, z.byteLength);
  chk(() => sha(z2) === sha(z) && dv.getUint32(0, true) === 0x04034b50 && dv.getUint16(8, true) === 0, () => 'Z3 the same entries must give the same stored ZIP twice');

  // ---------- the sample model, EN and AR x two themes ----------
  const design = (preset) => { const d = D.fresh(); d.preset = preset; d.data = D.PRESETS[preset].data.slice(); d.ui = Object.assign({}, D.PRESETS[preset].ui); D.repairState(d); return d; };
  const png = (i) => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, i]);
  const input = (lang, preset, logo) => { const d = design(preset), pages = D.projectPages(d.layout, lang, { second: true });
    return { name: 'SP5 ' + preset + ' ' + lang, title: 'SP5 ' + lang, pageName: pages[0].name, lang, rtl: lang === 'ar', font: d.font, sample: true,
      logo: logo ? { bytes: png(99), ext: 'png' } : null, theme: D.buildTheme(d, lang), ui: d.ui, texts: D.REPORT_TEXTS[lang],
      pages: pages.map((p, i) => ({ name: p.name, page: p.page, slots: p.slots, png: png(i), panel: p.panel, kpiInset: p.kpiInset })) }; };
  const CASES = [['S1', 'en', 'DataArcus', false], ['S2', 'en', 'Desert Gulf', true], ['S3', 'ar', 'DataArcus', true], ['S4', 'ar', 'Desert Gulf', false]];
  for (const [id, lang, preset, logo] of CASES) {
    seed(0x5e5 + id.charCodeAt(1));
    const r = Pbip.build(input(lang, preset, logo)), bytes = r.zip();
    const files = Object.fromEntries(r.files.map((f) => [f.path, sha(f.data)]));
    chk(() => [same(id + '.zip', sha(bytes)), same(id + '.files', files)].every(Boolean), () => id + ' ' + lang + ' ' + preset + ': the sample build differs: ZIP ' + diff(id + '.zip') + '; files ' + diff(id + '.files'));
  }
  chk(() => same('F1', ['en', 'ar'].map((lang) => sha(JSON.stringify(Pbip.fitOptions(input(lang, 'DataArcus', false)))))), () => 'F1 fitOptions for the sample differ: ' + diff('F1'));
  chk(() => same('A1', Pbip.AR_MONTHS), () => 'A1 AR_MONTHS differ: ' + diff('A1'));

  if (RECORD) fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n');
} catch (e) { problems.push('crashed: ' + String(e && e.stack || e).slice(0, 400)); }

globalThis.Date = RealDate;
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp5.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp5  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp5  ${checks} checks${RECORD ? ' (recorded)' : ''}`);
