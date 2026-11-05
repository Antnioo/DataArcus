// 0.3.2 SP8 (the split: B-280, B-286; mcp/work/SP8.md). A characterisation suite: the field picker (assets/js/pbip-bind.js
// renderPicker, moved to assets/js/field-picker-ui.js) draws the same picker and gives the generator the same binding as
// on the base (integration/0.3.2 7797bf6, before the move). In process, no browser: each model is read the way the
// website reads a folder (pbip-bind's fromFolder, on file-like objects), its suggestions made with 4 KPI slots and the
// model's relationships (as theme-generator.js does), the picker drawn twice on one fake element (the page draws it again
// when the layout changes), and recorded in fixtures/sp8-picker.json: the picker's HTML, the binding with the suggested
// choices, and the binding after two changed choices made through the picker's own change listener (the main measure,
// the first slicer). SP8_RECORD=1 records again (only on the base, never to make a run pass). Made-up models only.
//   C1-C16  8 models x EN and AR: the HTML, the default binding, the binding after two changes, and the listener count
//   after the move: M1 renderPicker draws through field-picker-ui.js, pbip-bind.js holds no picker HTML;  M2 field-picker-ui.js
//   reads no model, no file and no network;  M3 theme-generator.js loads field-picker-ui before pbip-bind, once each
//   node test-0.3.2-sp8.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(Buffer.from(t, 'utf8')).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp8-picker.json');
const RECORD = process.env.SP8_RECORD === '1';
const Bind = require('../assets/js/pbip-bind.js');

// the made-up models: [name, folder or model.bim, the folder name the page would see]
const MODELS = [
  ['births', 'mcp/fixtures/fx4/fx4-births/model.bim', 'Births.SemanticModel'],
  ['retail', 'mcp/fixtures/fx4/fx4-retail/model.bim', 'Retail.SemanticModel'],
  ['financial', 'mcp/fixtures/fx4/fx4-financial/model.bim', 'Financial.SemanticModel'],
  ['twin', 'mcp/fixtures/twin-project/Twin Sales.SemanticModel', 'Twin Sales.SemanticModel'],
  ['health', 'mcp/fixtures/health-project/Health Test.SemanticModel', 'Health Test.SemanticModel'],
  ['no-measures', 'mcp/test-models/no-measures/Plain Orders.SemanticModel', 'Plain Orders.SemanticModel'],
  ['service', 'mcp/test-models/service-orders/Service Orders.SemanticModel', 'Service Orders.SemanticModel'],
  ['arabic-long', 'mcp/test-models/arabic-long-names/Arabic Long Names.SemanticModel', 'Arabic Long Names.SemanticModel']
];
// file-like objects, as the page's folder input gives them (webkitRelativePath, size, arrayBuffer), in a fixed order
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)).map((p) => d.name + '/' + p) : [d.name]));
const fileOf = (abs, rel) => { const b = fs.readFileSync(abs); return { name: path.basename(abs), webkitRelativePath: rel, size: b.length, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.length) }; };
const filesOf = (src, folder) => { const abs = path.join(REPO, src);
  return /\.bim$/.test(src) ? [fileOf(abs, folder + '/model.bim')] : walk(abs).map((p) => fileOf(path.join(abs, p), folder + '/' + p)); };

// a fake element: innerHTML, one 'change' listener at a time (as the page's), a property the picker keeps on it
const fakeEl = () => { const ls = []; return { innerHTML: '', ls,
  addEventListener: (t, f) => { if (t === 'change') ls.push(f); }, removeEventListener: (t, f) => { const i = ls.indexOf(f); if (t === 'change' && i >= 0) ls.splice(i, 1); } }; };
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
// a select's option values, from the picker's HTML, by its data-path
const optionsOf = (html, p) => { const m = html.match(new RegExp('data-path="' + p.replace('.', '\\.') + '"[^>]*>([\\s\\S]*?)</select>')); return m ? [...m[1].matchAll(/<option value="([^"]*)"/g)].map((x) => unesc(x[1])) : []; };
// the visitor picks: the change listener gets an event whose target is the select (closest gives the select itself)
const pick = (el, p, kind, value) => { const s = { value, dataset: { path: p, kind }, closest: () => s }; el.ls.forEach((f) => f({ target: s })); };

const gold = RECORD ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8'));
const got = {};

try {
  let n = 0;
  for (const [name, src, folder] of MODELS) {
    const res = await Bind.fromFolder(filesOf(src, folder));
    for (const lang of ['en', 'ar']) {
      const id = 'C' + (++n), L = (en, ar) => (lang === 'ar' ? ar : en);
      const bind = Bind.suggest(res.tables, 4, Object.assign({ lang }, (res.relationships || []).length ? { relationships: res.relationships, modelTables: res.tables } : {}));
      const el = fakeEl();
      Bind.renderPicker(el, res.tables, bind, L);
      const get = Bind.renderPicker(el, res.tables, bind, L);   // drawn again on the same element: one listener left
      const html = el.innerHTML, dflt = JSON.stringify(get());
      // two changed choices: the main measure to its last option (else left empty), the first slicer to its last option
      const mains = optionsOf(html, 'main'), slicers = optionsOf(html, 'slicers.0');
      pick(el, 'main', 'm', mains[mains.length - 1] || '');
      pick(el, 'slicers.0', 'c', slicers[slicers.length - 1] || '');
      const changed = JSON.stringify(get());
      const now = { html: sha(html), selects: (html.match(/<select /g) || []).length, options: (html.match(/<option /g) || []).length, groups: (html.match(/<optgroup /g) || []).length,
        dflt: sha(dflt), changed: sha(changed), differs: dflt !== changed, listeners: el.ls.length };
      got[id] = Object.assign({ model: name, lang }, now);
      const g = gold[id] || {};
      chk(() => RECORD || JSON.stringify(Object.assign({ model: name, lang }, now)) === JSON.stringify(g),
        () => `${id} ${name} ${lang}: the picker or its binding differs: ${Object.keys(now).filter((k) => now[k] !== g[k]).map((k) => k + ' ' + JSON.stringify(now[k]).slice(0, 20) + ' (recorded ' + JSON.stringify(g[k]).slice(0, 20) + ')').join(', ')}`);
    }
  }

  // ---------- after the move (SP8): the picker is field-picker-ui.js's; the website loads it before pbip-bind ----------
  const Picker = require('../assets/js/field-picker-ui.js'), read = (f) => fs.readFileSync(path.join(REPO, 'assets', 'js', f), 'utf8');
  // (DD2H) the one pure file it may require: the HTML escape's one home
  const bindSrc = read('pbip-bind.js'), ui = read('field-picker-ui.js').replace("require('./html-escape.js')", '');
  let drawn = 0; const real = Picker.render;
  try { Picker.render = (...a) => { drawn++; return real(...a); }; Bind.renderPicker(fakeEl(), [{ name: 'T', columns: [{ name: 'C', dataType: 'string' }], measures: [{ name: 'M', expression: '1' }] }], Bind.suggest([{ name: 'T', columns: [{ name: 'C', dataType: 'string' }], measures: [{ name: 'M', expression: '1' }] }], 1, { lang: 'en' }), (en) => en); } finally { Picker.render = real; }
  chk(() => drawn === 1 && !/<optgroup|<select|tg-bind-row|daPick|addEventListener/.test(bindSrc) && Object.keys(Picker).join() === 'render',
    () => `M1 pbip-bind.js's renderPicker must draw through field-picker-ui.js's render (called ${drawn} times) and hold no picker HTML or listener of its own`);
  chk(() => !/require\(|fetch\(|XMLHttpRequest|FileReader|arrayBuffer|fromTmsl|fromFolder|suggest\(|catalog\(|import\(|localStorage|postMessage/.test(ui),
    () => 'M2 field-picker-ui.js reads no model, no file and nothing from the network: it gets the catalog\'s fields and gives back the binding');
  const tg = read('theme-generator.js'), at = (f) => tg.indexOf('/assets/js/' + f + '.min.js?v='), once = (f) => tg.split('/assets/js/' + f + '.min.js?v=').length === 2;
  chk(() => once('field-picker-ui') && once('pbip-bind') && at('field-picker-ui') < at('pbip-bind') && at('field-picker-ui') > tg.indexOf('const loadBind'),
    () => 'M3 theme-generator.js\'s loadBind must load field-picker-ui.min.js once, before pbip-bind.min.js');

  if (RECORD) fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n');
} catch (e) { problems.push('crashed: ' + String(e && e.stack || e).slice(0, 400)); }

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp8.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp8  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp8  ${checks} checks${RECORD ? ' (recorded)' : ''}`);
