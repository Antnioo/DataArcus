// 0.3.2 PB1 (mcp/work/PB1.md): property tests for "never damages a file" (fast-check, MIT, pinned in devDependencies).
// An example test proves its examples; a property is checked on thousands of made-up inputs, and a failure is shrunk
// to the smallest input that still fails. Made-up names and texts only. The generators (arbitraries) live here once.
//   D1  fast-check is an exact devDependency pin: package.json, the lock (dev: true, and its one dependency pure-rand
//       too) and what is installed agree, so the shipped graph (the lock's packages without dev) never holds it
//   D2  no shipped file (server.mjs, lib/, tools/, assets/js/) imports fast-check
//   T1  tmdl-name.js: any table, column or measure name written by tmdlName reads back the same (tmdl-model.js parse)
//   T2  a made-up model (tables, columns, measures: Arabic and Latin names, quotes, hyphens) written by our writer
//       (shadow-model.mjs shadowModel) and read by our reader (tmdl-model.js fromFiles) is the same model
//   V1  pbir-values.js: a made-up visual's literals (text, number, true or false) read and written back are byte-equal
//   X1  html-escape.js htmlEsc: no raw < > " ' and every & opens one of its five escapes
//   X2  svg-escape.js xmlEsc: the same for XML (&apos;)
//   R1  text-runs.js paragraphTexts: every character of an Arabic and English text box, split into random runs, in order
//   C1  canon.mjs canon: the canonical text of a plan does not change when its keys are reordered
// The seed rule: each property has its FIXED seed below (CI and local runs replay the same inputs); DA_PB1_SEED=<n>
// runs every property on that seed instead, to explore. A failure prints its seed, path and shrunk input.
//   node test-0.3.2-pb1.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { shadowModel } from './lib/shadow-model.mjs';
import { canon } from './lib/canon.mjs';
import { Lv, Ls } from './lib/twin-visuals.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const { tmdlName } = require('../assets/js/tmdl-name.js');
const Tmdl = require('../assets/js/tmdl-model.js');
const { litText, litNumber, litBool } = require('../assets/js/pbir-values.js');
const { htmlEsc } = require('../assets/js/html-escape.js');
const { xmlEsc } = require('../assets/js/svg-escape.js');
const { paragraphTexts } = require('../assets/js/text-runs.js');

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

// ---------- the seed rule and the run counts (mcp/work/PB1.md) ----------
const SEED_ALL = process.env.DA_PB1_SEED != null && process.env.DA_PB1_SEED !== '' ? Number(process.env.DA_PB1_SEED) : null;
const PROPS = {
  T1: { seed: 3201101, runs: 10000 }, T2: { seed: 3201102, runs: 2000 }, V1: { seed: 3201103, runs: 5000 },
  X1: { seed: 3201104, runs: 10000 }, X2: { seed: 3201105, runs: 10000 }, R1: { seed: 3201106, runs: 5000 },
  C1: { seed: 3201107, runs: 5000 },
};
const timings = [];
// one property, one check: fc.check with the fixed seed; a failure names the seed, the path and the shrunk input
const property = (id, label, prop) => {
  const { seed, runs } = PROPS[id], s = SEED_ALL != null ? SEED_ALL : seed, t0 = Date.now();
  let r;
  try { r = fc.check(prop, { seed: s, numRuns: runs }); } catch (e) { r = { failed: true, error: e, seed: s, counterexample: null }; }
  timings.push(`${id} ${runs} runs ${Date.now() - t0} ms`);
  chk(() => !r.failed && r.numRuns === runs, () => `${id}. ${label}: failed on seed ${r.seed}, path ${JSON.stringify(r.counterexamplePath)}, shrunk input ${fc.stringify(r.counterexample)}${r.errorInstance ? ' (' + String(r.errorInstance.message || r.errorInstance).slice(0, 200) + ')' : ''}`);
};

// ---------- the generators (made-up text only) ----------
const LATIN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
const ARABIC = 'ابتثجحخدذرزسشصضطظعغفقكلمنهويةىءأإآؤئ٠١٢٣٤٥٦٧٨٩';
const NAME_MARKS = " '\"-.=";
const pick = (chars) => fc.constantFrom(...[...chars]);
// a model object's name: Latin and Arabic letters, digits, _, quotes, a hyphen, a dot, =, spaces (at either end too);
// never empty, never a line break (PB1.md "Decisions I made")
const nameArb = fc.string({ unit: fc.oneof({ weight: 3, arbitrary: pick(LATIN) }, { weight: 3, arbitrary: pick(ARABIC) }, { weight: 2, arbitrary: pick(NAME_MARKS) }), minLength: 1, maxLength: 14 });
// a DAX expression: one to three lines, no backtick (the fence), no space at a line's end (TMDL keeps none)
const exprLine = fc.string({ unit: fc.oneof(pick(LATIN), pick(ARABIC), pick(" '\"[]()+-*/,.=<>&")), minLength: 1, maxLength: 24 })
  .map((s) => s.replace(/\s+$/, '')).filter((s) => s.trim().length > 0);
const exprArb = fc.array(fc.tuple(fc.nat(2), exprLine), { minLength: 1, maxLength: 3 }).map((ls) => ls.map(([d, l], i) => (i ? '    '.repeat(d) : '') + l).join('\n'));
const TYPES = ['string', 'int64', 'double', 'decimal', 'dateTime', 'boolean'];
// a table: unique names across its columns and measures (Power BI's rule), 1-3 columns, 0-2 measures
const tableArb = fc.record({
  name: nameArb,
  fields: fc.uniqueArray(nameArb, { minLength: 1, maxLength: 5, comparator: (a, b) => a.toLowerCase() === b.toLowerCase() }),
  types: fc.array(fc.constantFrom(...TYPES), { minLength: 5, maxLength: 5 }),
  exprs: fc.array(exprArb, { minLength: 2, maxLength: 2 }),
  nMeasures: fc.nat(2),
}).map(({ name, fields, types, exprs, nMeasures }) => {
  const m = Math.min(nMeasures, fields.length - 1);
  return { name, columns: fields.slice(m).map((c, i) => ({ name: c, dataType: types[i] })), measures: fields.slice(0, m).map((n, i) => ({ name: n, expression: exprs[i] })) };
});
const modelArb = fc.uniqueArray(tableArb, { minLength: 1, maxLength: 3, selector: (t) => t.name.toLowerCase() }).map((tables) => ({ model: { tables } }));
// a text: every character of the pools above plus the five HTML marks, a line break, a tab and any UTF-16 unit
const textArb = fc.oneof(
  fc.string({ unit: fc.oneof(pick(LATIN), pick(ARABIC), pick(" <>&\"';#%\n\t")), maxLength: 40 }),
  fc.string({ unit: 'binary', maxLength: 20 }),
  fc.string({ unit: 'grapheme', maxLength: 20 }));

// ---------- D1, D2: the pin and the shipped graph ----------
const FC = 'fast-check';
try {
  const pkg = J(path.join(HERE, 'package.json')), lock = J(path.join(HERE, 'package-lock.json'));
  const pin = (pkg.devDependencies || {})[FC], at = (n) => (lock.packages || {})['node_modules/' + n] || {};
  let installed = null; try { installed = J(path.join(HERE, 'node_modules', FC, 'package.json')).version; } catch { /* not installed */ }
  chk(() => /^\d+\.\d+\.\d+$/.test(pin) && !(pkg.dependencies || {})[FC] && ((lock.packages[''] || {}).devDependencies || {})[FC] === pin
    && at(FC).version === pin && at(FC).dev === true && at('pure-rand').dev === true && installed === pin,
  () => `D1. fast-check an exact devDependency pin, the lock's dev: true (and pure-rand's), installed: package.json ${pin}, lock ${at(FC).version} dev ${at(FC).dev}, pure-rand dev ${at('pure-rand').dev}, installed ${installed}`);
  const shipped = [path.join(HERE, 'server.mjs')], walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(m?js|cjs)$/.test(e.name)) shipped.push(p);
  });
  [path.join(HERE, 'lib'), path.join(HERE, 'tools'), path.join(ROOT, 'assets', 'js')].forEach(walk);
  const users = shipped.filter((f) => /['"]fast-check['"]/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(ROOT, f));
  chk(() => shipped.length > 100 && !users.length, () => `D2. no shipped file imports fast-check (${shipped.length} read): ${users.join(', ')}`);
} catch (e) { chk(() => false, () => `D1-D2 could not read the package files: ${e.message}`); }

// ---------- T1: a name written by tmdlName reads back the same ----------
property('T1', 'a table, column or measure name written by tmdlName reads back the same', fc.property(nameArb, (n) => {
  const tree = Tmdl.parse(['table ' + tmdlName(n), '\tcolumn ' + tmdlName(n), '\tmeasure ' + tmdlName(n) + ' = 1'].join('\n'));
  const t = tree.children[0];
  return !tree.problems.length && t.name === n && t.children.length === 2 && t.children.every((c) => c.name === n);
}));

// ---------- T2: a made-up model written by our writer and read by our reader is the same model ----------
const SMALL = { dim: 2, fact: 2, date: 2, alone: 2, max: 2 };
const shape = (tables) => tables.map((t) => ({
  name: t.name,
  columns: (t.columns || []).map((c) => [c.name, c.dataType]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)),
  measures: (t.measures || []).map((m) => [m.name, m.expression]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)),
})).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
property('T2', 'a made-up model written by shadowModel and read by tmdl-model.js is the same model', fc.property(modelArb, (m) => {
  const files = shadowModel(m, { rows: SMALL }).files.map((f) => ({ path: 'PB1.SemanticModel/' + f.path, text: f.text }));
  const back = Tmdl.fromFiles(files);
  return JSON.stringify(shape(back.model.tables)) === JSON.stringify(shape(m.model.tables));
}));

// ---------- V1: a made-up visual's literals read and written back are byte-equal ----------
// the writers: a text as Ls (twin-visuals.mjs, its quote doubled), a number as its String and D, true or false as text
const litArb = fc.oneof(
  textArb.map((t) => ({ kind: 'text', p: Ls(t) })),
  fc.double({ noNaN: true, noDefaultInfinity: true }).map((n) => ({ kind: 'number', p: Lv(String(n) + 'D') })),
  fc.integer().map((n) => ({ kind: 'number', p: Lv(String(n) + 'D') })),
  fc.boolean().map((b) => ({ kind: 'bool', p: Lv(String(b)) })));
const visualArb = fc.record({
  name: fc.string({ unit: pick('0123456789abcdef'), minLength: 20, maxLength: 20 }),
  objects: fc.dictionary(fc.constantFrom('title', 'labels', 'categoryAxis', 'valueAxis', 'general', 'text'),
    fc.array(fc.dictionary(fc.constantFrom('show', 'text', 'fontSize', 'fontFamily', 'color', 'displayUnits'), litArb, { minKeys: 1, maxKeys: 4 }), { minLength: 1, maxLength: 2 }), { minKeys: 1, maxKeys: 4 }),
}).map(({ name, objects }) => ({ name, position: { x: 0, y: 0, z: 0, width: 300, height: 200 },
  visual: { visualType: 'clusteredColumnChart', objects: Object.fromEntries(Object.entries(objects).map(([k, es]) => [k, es.map((e) => ({ properties: Object.fromEntries(Object.entries(e).map(([q, l]) => [q, l.p])) }))])) } }));
const rewrite = (p) => {
  const t = litText(p); if (t != null) return Ls(t);
  const b = litBool(p); if (b != null) return Lv(String(b));
  const n = litNumber(p); if (n != null) return Lv(String(n) + 'D');
  return p;
};
property('V1', 'a made-up visual\'s literals read (pbir-values.js) and written back are byte-equal', fc.property(visualArb, (v) => {
  const before = JSON.stringify(v);
  const back = { ...v, visual: { ...v.visual, objects: Object.fromEntries(Object.entries(v.visual.objects).map(([k, es]) => [k, es.map((e) => ({ properties: Object.fromEntries(Object.entries(e.properties).map(([q, p]) => [q, rewrite(p)])) }))])) } };
  return JSON.stringify(back) === before && JSON.stringify(v) === before;
}));

// ---------- X1, X2: the escapes ----------
const safeOut = (out, entities) => !/[<>"']/.test(out) && out.split('&').slice(1).every((rest) => entities.some((e) => rest.startsWith(e)));
property('X1', 'htmlEsc output holds no raw < > & " \'', fc.property(textArb, (s) => safeOut(htmlEsc(s), ['amp;', 'lt;', 'gt;', 'quot;', '#39;'])));
property('X2', 'xmlEsc output holds no raw < > & " \'', fc.property(textArb, (s) => safeOut(xmlEsc(s), ['amp;', 'lt;', 'gt;', 'quot;', 'apos;'])));

// ---------- R1: every character of a text box, in order ----------
const wordArb = fc.oneof(
  fc.constantFrom('المبيعات', 'الربح', 'حسب', 'المنطقة', 'الشهر', 'Sales', 'Profit', 'by', 'Region', 'Q1', '2026', '٪', '%', '«', '»', '،'),
  fc.string({ unit: fc.oneof(pick(LATIN), pick(ARABIC)), minLength: 1, maxLength: 8 }));
const paragraphArb = fc.tuple(fc.array(wordArb, { maxLength: 8 }).map((ws) => ws.join(' ')), fc.array(fc.nat(60), { maxLength: 4 }))
  .map(([text, cuts]) => {
    const at = [...new Set(cuts.map((c) => c % (text.length + 1)))].sort((a, b) => a - b), runs = [];
    let from = 0; at.forEach((c) => { runs.push(text.slice(from, c)); from = c; }); runs.push(text.slice(from));
    return { text, p: { textRuns: runs.map((value) => ({ value, textStyle: { fontFamily: 'Segoe UI' } })) } };
  });
property('R1', 'paragraphTexts keeps every character of an Arabic and English text box, in order', fc.property(fc.array(paragraphArb, { maxLength: 5 }), (ps) => {
  const got = paragraphTexts(ps.map((x) => x.p));
  return got.length === ps.length && got.every((t, i) => t === ps[i].text);
}));

// ---------- C1: canon does not change when keys are reordered ----------
// a plan-like value (fc.jsonValue: objects, arrays, texts, numbers, true, false, null) and a seed for the reorder
const reorder = (v, r) => {
  if (Array.isArray(v)) return v.map((x) => reorder(x, r));
  if (!v || typeof v !== 'object') return v;
  const keys = Object.keys(v);
  for (let i = keys.length - 1; i > 0; i--) { r.s = (r.s * 1103515245 + 12345) >>> 0; const j = r.s % (i + 1); [keys[i], keys[j]] = [keys[j], keys[i]]; }
  return Object.fromEntries(keys.map((k) => [k, reorder(v[k], r)]));
};
property('C1', 'the canonical text of a plan does not change when its keys are reordered', fc.property(fc.jsonValue({ maxDepth: 4 }), fc.nat(), (v, s) => canon(reorder(v, { s })) === canon(v)));

if (process.env.DA_PB1_TIMES) timings.forEach((t) => console.log('  ' + t));
if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  pb1  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  pb1  ${checks} checks`);
