// 0.3.2 DD1G (mcp/work/DD1G.md): one answer to "which model folder does this folder mean?". The MCP's nearestModel
// (lib/model-discovery.mjs) and the website's fromFolder (assets/js/model-import-browser.js) both read the one rule,
// assets/js/model-nearest.js. In process, no browser, no disk: each made-up list of model folders is given to the MCP as
// paths and to the browser as File-like objects (as the sp14 test makes them); no file's bytes may be read before the
// answer. One answer for both: "uses <folder>" or "refuses MANY_MODELS <the tied folders, sorted>" or "none".
//   P1-P12  twelve made-up folder lists: the two callers agree, and agree with the rule's own answer
//   R1-R3   the rule itself (a Windows separator, no folders, the others count)
//   S1-S4   one place: neither caller sorts by depth itself; both load model-nearest.js; the site loads it first
//   U1      the page says two models in English and Arabic, both named
//   node test-0.3.2-dd1g.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { nearestModel } from './lib/model-discovery.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const Nearest = require('../assets/js/model-nearest.js');
const Import = require('../assets/js/model-import-browser.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

// each case: model folders, relative to the folder the visitor chose or the working folder, '/' separated
const CASES = [
  ['P1 one model', ['Sales.SemanticModel'], 'uses Sales.SemanticModel'],
  ['P2 two side by side', ['B.SemanticModel', 'A.SemanticModel'], 'refuses MANY_MODELS A.SemanticModel; B.SemanticModel'],
  ['P3 one plus a deeper backup', ['Sales.SemanticModel', 'backup/Sales.SemanticModel'], 'uses Sales.SemanticModel'],
  ['P4 one at depth 1, two at depth 2', ['p/B.SemanticModel', 'A.SemanticModel', 'p/C.SemanticModel'], 'uses A.SemanticModel'],
  ['P5 two at depth 2, none above', ['p/B.SemanticModel', 'p/A.SemanticModel', 'p/sub/C.SemanticModel'], 'refuses MANY_MODELS p/A.SemanticModel; p/B.SemanticModel'],
  ['P6 .Dataset and .SemanticModel side by side', ['p/New.SemanticModel', 'p/Old.Dataset'], 'refuses MANY_MODELS p/New.SemanticModel; p/Old.Dataset'],
  ['P7 the older .Dataset alone', ['Old.Dataset'], 'uses Old.Dataset'],
  ['P8 names that differ by letter case', ['b.SemanticModel', 'A.SemanticModel'], 'refuses MANY_MODELS A.SemanticModel; b.SemanticModel'],
  ['P9 nested projects: one inside another', ['outer/Main.SemanticModel', 'outer/inner/Main.SemanticModel'], 'uses outer/Main.SemanticModel'],
  ['P10 three at the top', ['C.SemanticModel', 'A.SemanticModel', 'B.SemanticModel'], 'refuses MANY_MODELS A.SemanticModel; B.SemanticModel; C.SemanticModel'],
  ['P11 none', [], 'none'],
  ['P12 a deep one alone', ['a/b/c/Deep.SemanticModel'], 'uses a/b/c/Deep.SemanticModel']
];
const ROOT = path.join(path.sep, 'w');
const onDisk = (m) => {
  try { const d = nearestModel(m.map((x) => path.join(ROOT, ...x.split('/'))), ROOT, 'w'); return d === undefined ? 'none' : 'uses ' + path.relative(ROOT, d).split(path.sep).join('/'); }
  catch (e) { return 'refuses ' + e.code + ' ' + (e.data.models || []).map((x) => x.split(path.sep).join('/')).join('; '); }
};
let reads = 0;
const inBrowser = async (m) => {
  const files = m.map((x) => ({ name: 'T.tmdl', webkitRelativePath: x + '/definition/tables/T.tmdl', size: 10, arrayBuffer: () => { reads++; throw Object.assign(new Error('READ'), { at: x }); } }));
  try { await Import.fromFolder(files, { fromTmsl: () => [], relsOfTmsl: () => [], clean: (t) => t, tmdl: () => ({ fromFiles: () => ({}) }) }); return 'read nothing'; }
  catch (e) { return e.at ? 'uses ' + e.at : e.message === 'NO_SEMANTIC_MODEL' ? 'none' : 'refuses ' + e.message + ' ' + (e.models || []).join('; '); }
};
for (const [id, m, want] of CASES) {
  const mcp = onDisk(m), site = await inBrowser(m), rule = Nearest.nearest(m, '/');
  const ruled = !m.length ? 'none' : rule.path ? 'uses ' + rule.path : 'refuses MANY_MODELS ' + rule.tied.join('; ');
  chk(() => mcp === site, () => `${id}: the MCP says "${mcp}", the website "${site}"`);
  chk(() => site === want && ruled === want, () => `${id}: expected "${want}"; website "${site}", rule "${ruled}"`);
}
chk(() => reads > 0, () => 'the website read no file for the lists with one model (the probe is not reaching the read)');
// a refusal reads no bytes: count the reads of the refusing cases alone
reads = 0; for (const [, m, want] of CASES) if (/^refuses/.test(want)) await inBrowser(m);
chk(() => reads === 0, () => `a refusal read ${reads} file(s): the website must refuse before any file's bytes are read`);

// R1-R3 the rule itself
chk(() => { const r = Nearest.nearest(['C:\\w\\p\\B.SemanticModel', 'C:\\w\\p\\A.SemanticModel', 'C:\\w\\p\\x\\C.SemanticModel'], '\\'); return r.path === null && r.tied.join('|') === 'C:\\w\\p\\A.SemanticModel|C:\\w\\p\\B.SemanticModel' && r.others === 2; }, () => 'R1: the rule on a Windows separator');
chk(() => { const r = Nearest.nearest([], '/'); return r.path === null && r.tied.length === 0 && r.others === 0; }, () => 'R2: no folders');
{ const r = Nearest.nearest(['A.SemanticModel', 'b/A.SemanticModel', 'c/A.SemanticModel'], '/'); chk(() => r.path === 'A.SemanticModel' && r.others === 2 && r.tied.length === 1, () => `R3: a deeper backup counts in others (${r.others}) and never wins (${r.path})`); }
// the browser's "others" is the same count
{ let other = -1; const f = [['A.SemanticModel', 'sub/A.SemanticModel']].map((m) => m.map((x) => ({ name: 'model.bim', webkitRelativePath: x + '/model.bim', size: 2, arrayBuffer: async () => new TextEncoder().encode('{}').buffer })))[0];
  try { const r = await Import.fromFolder(f, { fromTmsl: () => [], relsOfTmsl: () => [], clean: (t) => t, tmdl: () => ({}) }); other = r.others; } catch (e) { other = 'threw ' + e.message; }
  chk(() => other === 1, () => `R3b: the website's "others" for a backup is ${other}, not 1`); }

// S1-S4 one place
const src = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const sort = /\.sort\([^)]*(depth|split\()/;
chk(() => !sort.test(src('assets/js/model-import-browser.js')) && /Nearest\(\)\.nearest\(/.test(src('assets/js/model-import-browser.js')), () => 'S1: model-import-browser.js sorts or counts depth itself, or does not call model-nearest.js');
chk(() => !sort.test(src('mcp/lib/model-discovery.mjs')) && /nearest\(dirs/.test(src('mcp/lib/model-discovery.mjs')) && /model-nearest\.js/.test(src('mcp/lib/model-discovery.mjs')), () => 'S2: model-discovery.mjs sorts or counts depth itself, or does not read model-nearest.js');
{ const g = src('assets/js/theme-generator.js'), a = g.indexOf('model-nearest.min.js'), b = g.indexOf('model-import-browser.min.js');
  chk(() => a > 0 && b > 0 && a < b && g.split('model-nearest.min.js').length === 2, () => 'S3: theme-generator.js loads model-nearest.js once, before model-import-browser.js'); }
chk(() => fs.existsSync(path.join(REPO, 'assets/js/model-nearest.min.js')), () => 'S4: model-nearest.min.js is not there (npm run build:min)');

// U1 the page's message: both models named, the MCP's words
{ const u = src('assets/js/theme-download-ui.js');
  chk(() => /MANY_MODELS/.test(u) && /models at the same level: \$\{many\}\. Choose the model's own folder\./.test(u) && /في المستوى نفسه: \$\{many\}\. اختر مجلد النموذج نفسه\./.test(u), () => 'U1: theme-download-ui.js does not say two models in English and Arabic'); }

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd1g  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd1g  ${checks} checks`);
