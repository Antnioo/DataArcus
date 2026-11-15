// AT1 (0.3.3; the owner, 10 Nov, D-1110-07 "Yes to B-429 wording and LG2's 3 Arabic drafts"; written red first): the
// approved Arabic lines ship word for word, each typed here from the owner's approval (not read from the code):
//   B-429  the title template «أعلى {1} من أصل {2}: X» (one source: lib/arabic-names.mjs, which twin-texts.mjs calls),
//          and the approval page's Arabic folder words with no repeated bracket
//   B-449  the three model-path input errors (NO_MODEL_NAMED, NO_MODEL_AT, MANY_MODELS_NAMED) with lang "ar", in every
//          reading and write tool (one source: lib/read-words.mjs); English unchanged; the folder case with no model to
//          list ends as the English does (0.3.3 AR7, D-1112-05: pinned in ar7)
// Through the real server (stdio). Made-up models only, in a temp folder.
//   node test-0.3.3-at1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const cut = (t) => String(t).slice(0, 400);
const here = path.dirname(fileURLToPath(import.meta.url));

// ---- B-429 the title template, and the header
delete process.env.DATAARCUS_ROOT;
const { draftText } = await import('./lib/arabic-names.mjs');
const { plainLine } = await import('./lib/approval-disclosure.mjs');
const t1 = draftText('Top {1} of {2}: Sales by Region'), t2 = draftText('Top 5 of 20: Sales by Region');
chk(() => t1 === 'أعلى {1} من أصل {2}: المبيعات حسب المنطقة' && t2 === 'أعلى 5 من أصل 20: المبيعات حسب المنطقة', () => `T1. the title template: ${t1} | ${t2}`);
chk(() => !/من \{2\}|من 20/.test(String(t1) + String(t2)), () => 'T2. the old words are gone');
const noRoot = plainLine(['a.pbip'], 'report', true, '.'), noRootSub = plainLine(['Sales/a.pbip'], 'report', true, '.');
chk(() => noRoot === 'تقرير جديد واحد، بجانب نموذجك، في مجلد العمل' && noRootSub === 'تقرير جديد واحد، بجانب نموذجك، في المجلد «Sales»', () => `H1. no working folder set: no empty or repeated bracket: ${noRoot} | ${noRootSub}`);
const rootDir = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-at1h-')));
try {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', "import { plainLine } from './lib/approval-disclosure.mjs'; console.log(JSON.stringify([plainLine(['a.pbip'], 'report', true, '.'), plainLine(['Sales/a.pbip'], 'report', true, '.'), plainLine(['a.pbip'], 'report', false, '.')]));"], { cwd: here, env: Object.assign({}, process.env, { DATAARCUS_ROOT: rootDir }), encoding: 'utf8' });
  const [a, b, e] = JSON.parse(r.stdout || '[]');
  chk(() => a === `تقرير جديد واحد، بجانب نموذجك، في مجلد العمل (${rootDir})` && b === `تقرير جديد واحد، بجانب نموذجك، في المجلد «Sales» (${path.join(rootDir, 'Sales')})` && e === `1 new report, next to your model, in the working folder (${rootDir})`,
    () => `H2. a working folder set: its own path in the bracket, English unchanged: ${a} | ${b} | ${e}`);
} finally { fs.rmSync(rootDir, { recursive: true, force: true }); }

// ---- B-449 the three errors
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-at1-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const model = (dir, name) => { const f = path.join(ROOT, dir, name + '.SemanticModel', 'model.bim'); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }], measures: [] }] } }));
  fs.writeFileSync(path.join(ROOT, dir, name + '.SemanticModel', 'definition.pbism'), '{ "version": "4.0", "settings": {} }'); };
model('One', 'Dup'); model('Two', 'Dup'); model('Two', 'Solo');
const LIST = 'One/Dup.SemanticModel; Two/Dup.SemanticModel; Two/Solo.SemanticModel';
const rootS = path.basename(ROOT);   // tool answers say the working folder by its own name (tool-answer.mjs scrub)
const LIST_AT = 'Two/Dup.SemanticModel; Two/Solo.SemanticModel; One/Dup.SemanticModel';   // the nearest folder's models first, as the English lists them
const WANT = {
  named: `لا يوجد نموذج باسم "Nope" في مجلد العمل ${rootS}. ${LIST}. أعطِ read_model أحد هذه المسارات، أو "." لمجلد العمل نفسه.`,
  at: `لا يوجد شيء في "Two/Nope.SemanticModel" داخل مجلد العمل ${rootS}. ${LIST_AT}. أعد استدعاء الأداة بأحد هذه المسارات (نسبةً إلى مجلد العمل)، أو "." لمجلد العمل نفسه.`,
  many: 'يوجد أكثر من نموذج في مجلد العمل باسم "Dup": One/Dup.SemanticModel; Two/Dup.SemanticModel. أعطِ read_model مسار النموذج الذي تقصده.'
};
const s = await serverClient(ROOT);
try {
  const calls = { named: { path: 'Nope' }, at: { path: 'Two/Nope.SemanticModel' }, many: { path: 'Dup' } };
  const ref = {};
  for (const [k, a] of Object.entries(calls)) {
    const ar = await s.call('read_model', Object.assign({ lang: 'ar' }, a)), en = await s.call('read_model', a);
    ref[k] = { ar, en };
    chk(() => ar.err && ar.t === WANT[k], () => `A-${k}. read_model, lang "ar": the approved line, byte for byte: ${cut(ar.t)}`);
    chk(() => en.err && !/[؀-ۿ]/.test(en.t), () => `E-${k}. read_model, no lang: English: ${cut(en.t)}`);
    const en2 = await s.call('read_model', Object.assign({ lang: 'en' }, a));
    chk(() => en2.err && en2.t === en.t, () => `E2-${k}. lang "en": the same English: ${cut(en2.t)}`);
  }
  for (const tool of ['plan_layout', 'add_gulf_calendar', 'generate_theme']) {
    for (const [k, a] of Object.entries(calls)) {
      const ar = await s.call(tool, Object.assign({ lang: 'ar' }, a));
      chk(() => ar.err && ar.t === WANT[k], () => `W-${tool}-${k}. lang "ar": the same approved line: ${cut(ar.t)}`);
    }
  }
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL script=test-0.3.3-at1.mjs cause=${JSON.stringify(problems[0].slice(0, 200))}`); console.log(`FAIL  at1  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n')); process.exit(1); }
console.log(`PASS  at1  ${checks} checks`);
