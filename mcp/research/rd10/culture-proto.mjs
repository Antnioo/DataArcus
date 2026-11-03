// RD10 scratch prototype (research only, not a product file): the sample project's model (made-up) and a made-up
// confirmed terminology sheet -> one TMDL culture file per Gulf culture name. Measures coverage, lists what stays
// English, parses the file back with the shared reader. Writes only under os.tmpdir(). Run: node mcp/research/rd10/culture-proto.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { createRequire } from 'node:module';
import { sampleFiles } from '../../lib/sample-project.mjs';
import { proposeArabic } from '../../lib/arabic-names.mjs';
const Tmdl = createRequire(import.meta.url)('../../../assets/js/tmdl-model.js');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rd10-')), folder = path.join(dir, 'Gulf Retail Sample');
const files = sampleFiles(folder).filter((f) => /\.tmdl$/.test(f.path)).map((f) => ({ path: f.path, text: f.data }));
const { model, skipped } = Tmdl.read(files); const tables = model.model.tables;
// every object a culture can translate (caption; description where the model has one), hidden ones apart
const objs = [];
for (const t of tables) {
  objs.push({ kind: 'table', table: t.name, name: t.name, hidden: !!t.isHidden, desc: t.description || null });
  for (const c of t.columns || []) objs.push({ kind: 'column', table: t.name, name: c.name, hidden: !!c.isHidden, desc: c.description || null, folder: c.displayFolder || null });
  for (const m of t.measures || []) objs.push({ kind: 'measure', table: t.name, name: m.name, hidden: !!m.isHidden, desc: m.description || null, folder: m.displayFolder || null });
}
const key = (o) => o.kind === 'table' ? o.table : `${o.table}[${o.name}]`;
// the glossary's drafts (never written: a draft is shown, not confirmed)
const drafts = new Map(objs.map((o) => [key(o), proposeArabic(o.name)]).filter(([, v]) => v));
// a MADE-UP confirmed sheet: what a person might approve one term at a time (terminology.mjs remember's 'approved'),
// plus two kept in English (declined). Nothing here comes from a real model or a machine translation.
const CONFIRMED = new Map(Object.entries({
  Sales: 'المبيعات', Branches: 'الفروع', Products: 'المنتجات', Calendar: 'التقويم',
  'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Order Count]': 'عدد الطلبات', 'Sales[Average Basket]': 'متوسط السلة',
  'Sales[Amount]': 'المبلغ', 'Sales[Units]': 'الوحدات', 'Branches[Branch]': 'الفرع', 'Branches[City]': 'المدينة', 'Branches[Country]': 'الدولة',
  'Products[Product]': 'المنتج', 'Products[Category]': 'الفئة', 'Calendar[Year]': 'السنة', 'Calendar[Month Name]': 'الشهر',
}));
const KEPT = new Set(['Calendar[Year Month Key]', 'Calendar[Month Number]']);
// a confirmed description (made-up) for one measure; every other description stays English and is listed
const DESC = new Map([['Sales[Average Basket]', 'متوسط قيمة الطلب بالدرهم الإماراتي']]);

const q = (n) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n) ? n : "'" + n.replace(/'/g, "''") + "'";
const v = (s) => /^\s|\s$|"/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
function cultureLines(name, depth) {
  const T = (n) => '\t'.repeat(depth + n), out = [T(0) + 'cultureInfo ' + name, '', T(1) + 'translations', T(2) + 'model Model'];
  let written = 0;
  for (const t of tables) {
    const tk = t.name, inner = [];
    for (const o of objs.filter((x) => x.table === t.name && x.kind !== 'table')) {
      const k = key(o), cap = CONFIRMED.get(k), d = DESC.get(k); if (!cap && !d) continue;
      inner.push(T(4) + o.kind + ' ' + q(o.name)); if (cap) { inner.push(T(5) + 'caption: ' + v(cap)); written++; } if (d) { inner.push(T(5) + 'description: ' + v(d)); written++; }
    }
    const tc = CONFIRMED.get(tk); if (!tc && !inner.length) continue;
    out.push(T(3) + 'table ' + q(t.name)); if (tc) { out.push(T(4) + 'caption: ' + v(tc)); written++; } out.push(...inner);
  }
  return { lines: out.concat(['']), written };
}
const GULF = ['ar-AE', 'ar-SA', 'ar-KW', 'ar-QA', 'ar-BH', 'ar-OM'];
const r = {}, defDir = path.join(folder, 'Gulf Retail.SemanticModel', 'definition');
for (const c of GULF) { const { lines, written } = cultureLines(c, 0); r[c] = { text: lines.join('\n'), written }; }
// coverage
const visible = objs.filter((o) => !o.hidden), capsDone = visible.filter((o) => CONFIRMED.has(key(o)));
const english = visible.filter((o) => !CONFIRMED.has(key(o))).map((o) => ({ field: key(o), why: KEPT.has(key(o)) ? 'kept (declined)' : drafts.has(key(o)) ? `draft only («${drafts.get(key(o))}»), not confirmed` : 'no confirmed name' }));
const descs = objs.filter((o) => o.desc), descsDone = descs.filter((o) => DESC.has(key(o)));
// parse back: the model's files plus the culture file, and the model.tmdl's ref
const back = (c, kw) => Tmdl.read(files.map((f) => /model\.tmdl$/.test(f.path) ? { path: f.path, text: f.text + `ref cultureInfo ${c}\n` } : f)
  .concat([{ path: path.join(defDir, 'cultures', c + '.tmdl'), text: kw ? r[c].text.replace(/^cultureInfo /, kw + ' ') : r[c].text }]));
const b = back('ar-AE'), cu = (b.model.model.cultures || [])[0];
const countCaps = (o) => (o && typeof o === 'object') ? Object.entries(o).reduce((n, [k, x]) => n + (k === 'caption' || k === 'description' ? 1 : countCaps(x)), 0) : 0;
const learnForm = back('ar-AE', 'culture');   // Learn's example writes "culture pt-PT"; Desktop's files write "cultureInfo"
// the TMDL view script form (createOrReplace, one level deeper), and all six in one script
const script = ['createOrReplace', ''].concat(...GULF.map((c) => cultureLines(c, 1).lines)).join('\n');
fs.mkdirSync(path.join(defDir, 'cultures'), { recursive: true });
for (const c of GULF) fs.writeFileSync(path.join(defDir, 'cultures', c + '.tmdl'), r[c].text);
fs.writeFileSync(path.join(dir, 'Gulf Retail - Arabic names.tmdl'), script);
const bytes = (s) => Buffer.byteLength(s, 'utf8');
console.log(JSON.stringify({
  tmp: dir, readSkipped: skipped.length,
  objects: { all: objs.length, tables: objs.filter((o) => o.kind === 'table').length, columns: objs.filter((o) => o.kind === 'column').length, measures: objs.filter((o) => o.kind === 'measure').length, hidden: objs.filter((o) => o.hidden).length },
  glossaryDrafts: drafts.size, confirmedCaptions: capsDone.length, visible: visible.length, coverage: (capsDone.length / visible.length).toFixed(3),
  leftEnglish: english, descriptions: { inModel: descs.length, confirmed: descsDone.length, leftEnglish: descs.filter((o) => !DESC.has(key(o))).map(key) },
  displayFolders: objs.filter((o) => o.folder).length,
  file: { lines: r['ar-AE'].text.split('\n').length, bytes: bytes(r['ar-AE'].text), written: r['ar-AE'].written },
  sixFiles: { bytes: GULF.reduce((n, c) => n + bytes(r[c].text), 0), identicalButName: GULF.every((c) => r[c].text.replace(c, 'X') === r['ar-AE'].text.replace('ar-AE', 'X')) },
  script: { lines: script.split('\n').length, bytes: bytes(script) },
  parseBack: { skipped: b.skipped, cultures: (b.model.model.cultures || []).map((x) => x.name), translatedRead: countCaps(cu), translatedWritten: r['ar-AE'].written },
  learnKeyword: { skipped: learnForm.skipped.length, cultures: (learnForm.model.model.cultures || []).length },
}, null, 1));
console.log('\n--- ar-AE.tmdl ---\n' + r['ar-AE'].text);
