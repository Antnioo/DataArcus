// 0.3.1 S1 (the owner, 25 Oct: the user's agent fixed a report with its own script, outside DataArcus's plan): a gate
// on every place the server can write a file. It finds each file-writing call in mcp/server.mjs, mcp/lib/*.mjs and
// mcp/tools/*.mjs (0.3.1 S9), counted per file, and fails when the counts differ from the list below: a new write (or a
// new way to reach one) must be added here, with why it is safe, before CI passes.
//   What counts: an fs call that writes (through any name node:fs or node:fs/promises is imported or required as, and
//   write-io.mjs's io and REAL), an fs function imported by name, a destructuring or a computed access of an fs name
//   (a way round this list), node:child_process (a process can write), and the helpers that wrap the writes.
//   W1  every call found is listed (file, call, count)
//   W2  every listed call is still there (a stale entry would let a new one in at its place)
//   W3  the scanner finds a planted write, a renamed import, a wrapper and a destructuring
//   W5  Microsoft's validator, which runs in process: its modules (followed from its entry) write nothing unlisted
//   W6  DataArcus loads only the validator's entry (its cli and preview write files); W7 the follow finds a planted write
//   node test-0.3.1-write-gate.mjs        (DA_WRITES=1 prints what it finds)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

// the fs calls that create, change or remove a file or a folder
const WRITES = ['writeFileSync', 'writeFile', 'appendFileSync', 'appendFile', 'mkdirSync', 'mkdir', 'mkdtempSync', 'mkdtemp', 'cpSync', 'cp', 'renameSync', 'rename',
  'copyFileSync', 'copyFile', 'rmSync', 'rm', 'rmdirSync', 'rmdir', 'unlinkSync', 'unlink', 'createWriteStream', 'linkSync', 'link', 'symlinkSync', 'symlink',
  'truncateSync', 'truncate', 'ftruncateSync', 'writeSync', 'write', 'writev', 'writevSync', 'openSync', 'open', 'chmodSync', 'chmod', 'utimesSync', 'utimes', 'lutimesSync', 'futimesSync'];
// the helpers that wrap them (write-io.mjs, files.mjs, answers.mjs, model.mjs; fix-scripts.mjs's writePlannedScript (AF2: the
// file the plan named, or nothing) and formatsAnswer; files.mjs's folderFor (AF2: freeFile's folders);
// the tools' writers in lib/: the twin's, the native copy's, the redesign's, the Gulf calendar's; 0.3.1 C: the sample project's)
const WRAPPERS = ['writeFileNew', 'writeNew', 'writeTree', 'createFile', 'makeDir', 'writeAnswers', 'freeFile', 'folderFor', 'removeOurs', 'rollBack',
  'writeScript', 'writePlannedScript', 'formatsAnswer', 'addGulfCalendar', 'writeTwin', 'writeNative', 'writeRedesign', 'writeSample'];
const FS = /^(node:)?fs(\/promises)?$/;

/** The write calls in one file's source: { '<call>': count }. */
export function writesIn(src) {
  const found = {}, add = (k) => { found[k] = (found[k] || 0) + 1; };
  const aliases = new Set(), named = new Set();
  for (const m of src.matchAll(/import\s+([^'";]+?)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (!FS.test(m[2])) continue;
    const spec = m[1];
    const def = /^([A-Za-z_$][\w$]*)/.exec(spec); if (def && !spec.startsWith('{') && !spec.startsWith('*')) aliases.add(def[1]);
    const ns = /\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(spec); if (ns) aliases.add(ns[1]);
    const br = /\{([^}]*)\}/.exec(spec); if (br) br[1].split(',').map((x) => x.trim()).filter(Boolean).forEach((x) => { const [a, b] = x.split(/\s+as\s+/); if (WRITES.includes(a.trim())) named.add((b || a).trim()); else if (!b && a.trim() === 'promises') aliases.add('promises'); else if (b && a.trim() === 'promises') aliases.add(b.trim()); });
  }
  for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) if (FS.test(m[2])) aliases.add(m[1]);
  for (const m of src.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) if (FS.test(m[1])) add('import(fs)');
  for (const m of src.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) if (FS.test(m[1]) && !new RegExp(`=\\s*require\\s*\\(\\s*['"]${m[1].replace(/[/]/g, '\\/')}`).test(src)) add('require(fs)');
  if (/\bimport\b[^;]*['"](node:)?child_process['"]|require\s*\(\s*['"](node:)?child_process['"]\s*\)/.test(src)) add('child_process');
  // write-io.mjs's own: io (imported by the writers) and REAL (the real fs calls it keeps)
  if (/\bimport\s*\{[^}]*\bio\b[^}]*\}\s*from\s*['"]\.\/write-io\.mjs['"]/.test(src) || /export const io\b/.test(src)) aliases.add('io');
  if (/\bconst REAL\s*=/.test(src)) aliases.add('REAL');
  for (const a of aliases) {
    const e = a.replace(/\$/g, '\\$');
    for (const m of src.matchAll(new RegExp(`(?<![\\w$.])${e}\\s*\\.\\s*(?:promises\\s*\\.\\s*)?([A-Za-z]+)\\b`, 'g'))) if (WRITES.includes(m[1])) add(`${a === 'io' || a === 'REAL' ? a : 'fs'}.${m[1]}`);
    if (new RegExp(`(?<![\\w$.])${e}\\s*\\[`).test(src)) add(`${a}[...]`);
    // eslint-disable-next-line no-unused-vars -- one entry a match; the match itself is not needed
    for (const m of src.matchAll(new RegExp(`\\{[^{}]*\\}\\s*=\\s*${e}\\b(?!\\s*\\.)`, 'g'))) add(`{...} = ${a}`);
  }
  // eslint-disable-next-line no-unused-vars -- one entry a match; the match itself is not needed
  for (const n of named) for (const m of src.matchAll(new RegExp(`(?<![\\w$.])${n}\\s*\\(`, 'g'))) add(`${n} (imported)`);
  for (const w of WRAPPERS) for (const m of src.matchAll(new RegExp(`(?<![\\w$.])${w}\\s*\\(`, 'g'))) {
    const before = src.slice(Math.max(0, m.index - 12), m.index);
    if (/function\s*$/.test(before)) continue;   // its own definition
    add(w + '()');
  }
  return found;
}

// ---- the list: every write the server and its library make, and why each is safe ----
const PLAN = 'behind approve_plan\'s gate: runs only inside a tool\'s write after Plans.gate (or files.mjs withPlan / planWrites) took an approved plan id';
const TMP = 'the temporary check copy: a folder of its own in the OS temp folder (fs.mkdtempSync), removed when the check ends; never the working folder';
const TESTS = 'tests only: set by a DATAARCUS_TEST_* variable the server reads at start (a test server), never by a tool\'s input';
const LIST = {
  'lib/write-io.mjs': {
    'fs.writeFileSync': { n: 1, why: 'kept as REAL.writeFileSync (the real call behind io), not a call' },
    'fs.mkdirSync': { n: 1, why: 'kept as REAL.mkdirSync, not a call' },
    'fs.linkSync': { n: 1, why: 'kept as REAL.linkSync, not a call' },
    'fs.renameSync': { n: 1, why: 'kept as REAL.renameSync, not a call' },
    'fs.unlinkSync': { n: 1, why: 'kept as REAL.unlinkSync, not a call' },
    'fs.rmdirSync': { n: 1, why: 'kept as REAL.rmdirSync, not a call' },
    'fs.openSync': { n: 2, why: 'kept as REAL.openSync, not a call; and sameBytes (0.3.1 RB): read only, O_RDONLY | O_NOFOLLOW, to hash a file before the clean-up removes it' },
    'io.openSync': { n: 1, why: `createFile: a new file with 'wx' (never over anything), for writeTree and writeFileNew: ${PLAN}` },
    'io.writeFileSync': { n: 1, why: `createFile: the data through the handle it just created: ${PLAN}` },
    'io.mkdirSync': { n: 1, why: `makeDir: one new folder (never recursive), for writeTree and freeFile: ${PLAN}` },
    'io.linkSync': { n: 1, why: `writeFileNew: the temporary file linked into place (fails when the name is taken): ${PLAN}` },
    'io.unlinkSync': { n: 2, why: `writeFileNew's temporary name, and removeOurs: only a file this write created and still finds as it made it: ${PLAN}` },
    'io.rmdirSync': { n: 1, why: `removeOurs: only an empty folder this write created: ${PLAN}` },
    'REAL.openSync': { n: 1, why: `failingIo: ${TESTS}` },
    'REAL.writeFileSync': { n: 3, why: `failingIo (two) and testEditBeforeWrite (inside the working folder): ${TESTS}` },
    'REAL.unlinkSync': { n: 1, why: `failingIo: ${TESTS}` },
    'createFile()': { n: 1, why: `writeFileNew's own create: ${PLAN}` },
    'removeOurs()': { n: 2, why: `the clean-up of this write's own files after a failure: ${PLAN}` },
    'rollBack()': { n: 1, why: `the clean-up of a failed writeFileNew: ${PLAN}` },
    'writeTree()': { n: 1, why: 'a comment naming files.mjs\'s writeTree, not a call' }
  },
  'lib/files.mjs': {
    'createFile()': { n: 1, why: `writeTree's files: ${PLAN}` },
    'makeDir()': { n: 2, why: `writeTree's and folderFor's folders (freeFile's, AF2), one level at a time: ${PLAN}` },
    'rollBack()': { n: 2, why: `the clean-up of a failed writeTree or folderFor: ${PLAN}` },
    'folderFor()': { n: 1, why: `freeFile's folders (the same code, split out by AF2): ${PLAN}` }
  },
  'lib/answers.mjs': {
    'writeFileNew()': { n: 1, why: `writeAnswers: a new answers file: ${PLAN}` },
    'createFile()': { n: 1, why: `writeAnswers: a temporary file ('wx', its identity and hash kept: AF2, F07) that replaces DataArcus's own answers file only while it is still that file: ${PLAN}` },
    'io.renameSync': { n: 1, why: `writeAnswers: that temporary file onto DataArcus's own answers file, checked right before: ${PLAN}` },
    'rollBack()': { n: 1, why: `writeAnswers: its own temporary file after a failure, only while it is still the file it made (AF2, F07): ${PLAN}` }
  },
  'lib/model.mjs': {
    'fs.mkdirSync': { n: 1, why: 'prepareRoot: the working folder itself at the server\'s start, only when it is missing and the folder above it exists (one level, empty): no file of the user\'s' },
    'fs.openSync': { n: 4, why: 'read only: O_RDONLY (readCapped, the .pbit read by its parts (SQ6) and the folder walk) and \'r\' (the zip test)' },
    'writeFileNew()': { n: 1, why: `writeNew, the same writer under its old name: ${PLAN}` }
  },
  'lib/artifact.mjs': {
    'fs.mkdtempSync': { n: 1, why: TMP },
    'fs.mkdirSync': { n: 1, why: TMP },
    'fs.writeFileSync': { n: 1, why: TMP },
    'fs.rmSync': { n: 1, why: TMP }
  },
  'lib/fix-scripts.mjs': {
    'writeNew()': { n: 1, why: `writePlannedScript's write of a fix script: a new file under the name the approved plan showed, never over anything (AF2): ${PLAN}` }
  },
  'lib/report-run.mjs': {
    'writeTree()': { n: 1, why: `create_report's report, inside withPlan after Plans.gate: ${PLAN}` },
    'formatsAnswer()': { n: 1, why: `create_report's format script: written by the writeTree above as one of the plan's exact files; with write = true its put only names that file (AF2): ${PLAN}` }
  },
  'lib/twin-write.mjs': { 'writeTree()': { n: 1, why: `writeTwin: the twin or the EN-AR copy, new files next to the original: ${PLAN}` } },
  'lib/native-copy.mjs': { 'writeTree()': { n: 1, why: `writeNative: the native copy, new files next to the original: ${PLAN}` } },
  'lib/redesign.mjs': { 'writeTree()': { n: 1, why: `writeRedesign: the copy "<name> redesigned", new files next to the original: ${PLAN}` } },
  'lib/sample-project.mjs': { 'writeTree()': { n: 1, why: `writeSample: the sample project, new files in a new folder of the working folder (writeTree refuses a name that is taken): ${PLAN}` } },
  'lib/gulf-calendar.mjs': { 'writeScript()': { n: 1, why: `the writer add_gulf_calendar passes in: its plannedWriter (the model checked again, then fix-scripts.mjs's writePlannedScript: the name the plan showed, or nothing; AF2), or scriptNameNow, which writes nothing: ${PLAN}` } },
  'lib/approval-window.mjs': { child_process: { n: 1, why: 'spawn opens the approval page in the person\'s browser (or the tests\' browser): it starts the browser with a local URL, never a command built from a tool\'s input or a report\'s text' } },
  'tools/add_gulf_calendar.mjs': {
    'writePlannedScript()': { n: 1, why: `plannedWriter: the full calendar's and the Arabic calendar columns' script, inside withPlan, after the model is read again, under the name the approved plan showed or nothing (AF2): ${PLAN}` },
    'addGulfCalendar()': { n: 2, why: `the write is inside add_gulf_calendar's withPlan; the call without a plan gets scriptNameNow, which writes nothing: ${PLAN}` }
  },
  'tools/check_model_health.mjs': {
    'writePlannedScript()': { n: 1, why: `check_model_health's scripts, inside its approved planWrites (pw.step), after the model is read again and every name the plan showed is checked (AF2): ${PLAN}` },
    'formatsAnswer()': { n: 1, why: `with write = true its put only queues the script for the write above (AF2): ${PLAN}` },
    'writeAnswers()': { n: 1, why: `check_model_health's answers file, inside planWrites after Plans.gate: ${PLAN}` }
  },
  'tools/create_arabic_twin.mjs': {
    'writeTwin()': { n: 1, why: `create_arabic_twin's write, inside withPlan after Plans.gate: ${PLAN}` }
  },
  'tools/create_report.mjs': {
    'writeNative()': { n: 1, why: `create_report with customVisualsFrom, inside withPlan after Plans.gate: ${PLAN}` },
    'writeRedesign()': { n: 1, why: `create_report with redesignFrom, inside withPlan after Plans.gate: ${PLAN}` },
    'writeSample()': { n: 1, why: `create_report with sample (0.3.1 C), inside withPlan after Plans.gate with the sample plan's folder and inputs: ${PLAN}` }
  },
  'tools/generate_theme.mjs': {
    'folderFor()': { n: 1, why: `generate_theme's theme file's folders, one level at a time, inside withPlan after Plans.gate and the check that the name the plan showed is free (AF2): ${PLAN}` },
    'writeFileNew()': { n: 1, why: `generate_theme's theme file, inside withPlan after Plans.gate: ${PLAN}` }
  },
  'tools/plan_layout.mjs': {
    'formatsAnswer()': { n: 2, why: `plan_layout's two calls pass write = false: they name the file, write nothing: ${PLAN}` }
  }
};

// (0.3.1 S9) and each tool's module in tools/, which server.mjs imports
const files = ['server.mjs'].concat(fs.readdirSync(path.join(HERE, 'lib')).filter((f) => f.endsWith('.mjs')).sort().map((f) => 'lib/' + f),
  fs.existsSync(path.join(HERE, 'tools')) ? fs.readdirSync(path.join(HERE, 'tools')).filter((f) => f.endsWith('.mjs')).sort().map((f) => 'tools/' + f) : []);
const found = Object.fromEntries(files.map((f) => [f, writesIn(fs.readFileSync(path.join(HERE, f), 'utf8'))]).filter(([, w]) => Object.keys(w).length));
if (process.env.DA_WRITES) console.log(JSON.stringify(found, null, 1));

const extra = [], gone = [];
for (const [f, calls] of Object.entries(found)) for (const [c, n] of Object.entries(calls)) { const l = (LIST[f] || {})[c]; if (!l || l.n !== n) extra.push(`${f}: ${c} x${n}${l ? ` (listed x${l.n})` : ' (not listed)'}`); }
for (const [f, calls] of Object.entries(LIST)) for (const [c, l] of Object.entries(calls)) { const n = (found[f] || {})[c] || 0; if (n !== l.n && n === 0) gone.push(`${f}: ${c} (listed x${l.n}, found none)`); }
chk(() => !extra.length, () => `W1. a file-writing call is not in the list (add it with why it is safe: behind approve_plan's gate, or the temporary check copy in the OS temp folder): ${extra.join('; ')}`);
chk(() => !gone.length, () => `W2. a listed write is gone (take it off the list): ${gone.join('; ')}`);
const planted = writesIn("import f from 'node:fs';\nimport * as q from 'fs';\nimport { rmSync as gone } from 'node:fs';\nf.writeFileSync('x', 1); q.cpSync('a', 'b'); gone('c');\nwriteTree(dir, files);\nconst { unlinkSync } = f;\nconst cp = require('node:child_process');\n");
chk(() => planted['fs.writeFileSync'] === 1 && planted['fs.cpSync'] === 1 && planted['gone (imported)'] === 1 && planted['writeTree()'] === 1 && planted['{...} = f'] === 1 && planted.child_process === 1,
  () => `W3. the scanner finds a planted write, a renamed import, an imported name, a wrapper, a destructuring and a child process: ${JSON.stringify(planted)}`);
// every listed entry says why it is safe
chk(() => Object.values(LIST).every((calls) => Object.values(calls).every((l) => typeof l.why === 'string' && l.why.length > 20)), () => 'W4. every listed write says why it is safe');

// ---- (0.3.1 SQ14, S1-S3) Microsoft's validator runs in the server's process: its modules are read too ----
// DataArcus loads only the package's own entry (check-report.mjs and artifact.mjs: runReportValidation and
// getMetadataProvider; visual-meaning.mjs: getMetadataProvider). Read on 26 Oct with the version mcp/package.json pins:
// the entry and the chunk it imports take from fs only existsSync, readFileSync, readdirSync, statSync and realpathSync;
// they write no file, temporary or not. The temporary copy the validator checks is artifact.mjs's own (TMP, above).
// The package's cli.js and preview/ do write files (its command line's output), and DataArcus never loads them (W6).
const VALIDATOR = '@microsoft/powerbi-report-authoring-cli';
const VALIDATOR_WRITES = {};   // every write found in the modules it loads: none (a new one must be listed here, with why)
/** The write calls in an ES module and every module it imports by a relative path, followed: { '<file>': { call: n } }. */
export function writesFollowed(entry) {
  const out = {}, todo = [entry], base = path.dirname(entry);
  while (todo.length) {
    const f = todo.shift(); if (Object.prototype.hasOwnProperty.call(out, path.relative(base, f))) continue;
    const src = fs.readFileSync(f, 'utf8');
    out[path.relative(base, f)] = writesIn(src);
    for (const m of src.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) todo.push(path.resolve(path.dirname(f), m[1]));
  }
  return out;
}
let vEntry = null; try { vEntry = fileURLToPath(import.meta.resolve(VALIDATOR)); } catch (e) { vEntry = null; }
const vFound = vEntry ? writesFollowed(vEntry) : {};
const vExtra = Object.entries(vFound).flatMap(([f, calls]) => Object.entries(calls).filter(([c, n]) => !VALIDATOR_WRITES[c] || VALIDATOR_WRITES[c].n !== n).map(([c, n]) => `${f}: ${c} x${n}`));
chk(() => vEntry && Object.keys(vFound).length >= 2 && !vExtra.length,
  () => `W5. the validator's modules (followed from its entry: ${Object.keys(vFound).join(', ') || 'none found'}) write nothing unlisted: ${vExtra.join('; ')}`);
// DataArcus imports only the entry, never a subpath (cli, preview) that writes
const subpaths = files.filter((f) => new RegExp(`['"]${VALIDATOR.replace(/[/]/g, '\\/')}/`).test(fs.readFileSync(path.join(HERE, f), 'utf8')));
chk(() => !subpaths.length, () => `W6. the validator is loaded only by its entry (its cli and preview write files): ${subpaths.join(', ')}`);
// the follow finds a write two imports away
{
  const d = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'dataarcus-gate-'));
  try {
    fs.writeFileSync(path.join(d, 'index.js'), "import { a } from './a.js';\nexport const x = a;\n");
    fs.writeFileSync(path.join(d, 'a.js'), "export { b as a } from './b.js';\n");
    fs.writeFileSync(path.join(d, 'b.js'), "import { writeFileSync as w } from \"fs\";\nexport const b = () => w('x', 1);\n");
    const p = writesFollowed(path.join(d, 'index.js'));
    chk(() => Object.keys(p).length === 3 && p['b.js'] && p['b.js']['w (imported)'] === 1, () => `W7. the follow finds a planted write two imports away: ${JSON.stringify(p)}`);
  } finally { fs.rmSync(d, { recursive: true, force: true }); }
}

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  test-0.3.1-write-gate  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  test-0.3.1-write-gate  ${checks} checks`);
