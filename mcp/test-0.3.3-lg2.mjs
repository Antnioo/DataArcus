// LG2 (0.3.3; the owner, D-1109-02 "3 yes" on A-LG1-2): every tool that writes (or plans a write) answers its input errors
// in the approved Arabic when the call gives lang "ar", English with lang "en" or none. Measured: the schema refusal's Arabic
// frame (D-1108-16, inputErrorSaid) and the several-models line (AR4, manyAr; WE1) are the only approved Arabic lines, one
// source each; the other coded errors have none and stay English (listed in work/LG2.md "For the owner"). No new Arabic
// here: each Arabic answer is compared with read_model's own, or with the shared frame's opening. Through the real server.
//   node test-0.3.3-lg2.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected'; } problems.push(m + err); } };
const cut = (t) => String(t).slice(0, 260);

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-lg2-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const model = (dir, name) => { const f = path.join(ROOT, dir, name + '.SemanticModel', 'model.bim'); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }], measures: [] }] } }));
  fs.writeFileSync(path.join(ROOT, dir, name + '.SemanticModel', 'definition.pbism'), '{ "version": "4.0", "settings": {} }'); };
model('Models', 'Sales'); model('Models', 'Stock');

const WRITERS = ['plan_layout', 'approve_plan', 'create_report', 'create_arabic_twin', 'generate_theme', 'add_gulf_calendar', 'check_model_health'];
const HAS_LANG = ['plan_layout', 'generate_theme', 'add_gulf_calendar', 'check_model_health'];
const MANY = ['plan_layout', 'generate_theme', 'add_gulf_calendar'];
const FRAME_AR = (t) => new RegExp(`^MCP error -32602: خطأ في المدخلات: الأداة ${t} رفضت \\d+ مش`), FRAME_EN = (t) => new RegExp(`^MCP error -32602: Input validation error: Invalid arguments for tool ${t}: `);
const AR_TAIL = /صحّح المدخلات وأعد الاستدعاء\.$/, NO_AR = (t) => !/[؀-ۿ]/.test(t);   // (a short English message is the SDK's own, unchanged; only an Arabic call is rebuilt)

const s = await serverClient(ROOT);
try {
  const { tools } = await s.c.listTools(), by = Object.fromEntries(tools.map((t) => [t.name, t.inputSchema]));
  chk(() => WRITERS.every((n) => by[n]) && HAS_LANG.every((n) => by[n].properties.lang) && ['approve_plan', 'create_report', 'create_arabic_twin'].every((n) => !by[n].properties.lang),
    () => 'S. the tools\' lang inputs are as measured (4 take lang; approve_plan, create_report, create_arabic_twin take none)');
  // 1. the schema refusal: an unknown key, through each tool's registered schema
  for (const tool of WRITERS) {
    const ar = await s.call(tool, { lang: 'ar', zzz: 1 }), none = await s.call(tool, { zzz: 1 });
    chk(() => ar.err && FRAME_AR(tool).test(ar.t) && AR_TAIL.test(ar.t), () => `F1 ${tool}. lang "ar" + a bad input: the approved Arabic frame: ${cut(ar.t)}`);
    chk(() => none.err && FRAME_EN(tool).test(none.t) && NO_AR(none.t), () => `F2 ${tool}. no lang + a bad input: English as today: ${cut(none.t)}`);
  }
  for (const tool of HAS_LANG) {
    const en = await s.call(tool, { lang: 'en', zzz: 1 });
    chk(() => en.err && FRAME_EN(tool).test(en.t) && NO_AR(en.t), () => `F3 ${tool}. lang "en" + a bad input: English: ${cut(en.t)}`);
  }
  // 2. the several-models line: the reading tool's own words are the one source
  const refAr = await s.call('read_model', { path: 'Models', lang: 'ar' }), refEn = await s.call('read_model', { path: 'Models' });
  chk(() => refAr.err && /^يحتوي "Models" على نموذجين/.test(refAr.t) && refEn.err && /^"Models" holds 2 models/.test(refEn.t), () => 'R. read_model\'s own answers: ' + cut(refAr.t) + ' | ' + cut(refEn.t));
  for (const tool of MANY) {
    const ar = await s.call(tool, { path: 'Models', lang: 'ar' }), en = await s.call(tool, { path: 'Models', lang: 'en' }), none = await s.call(tool, { path: 'Models' });
    chk(() => ar.err && ar.t === refAr.t, () => `M1 ${tool}. lang "ar", 2 models: read_model's Arabic: ${cut(ar.t)}`);
    chk(() => en.err && en.t === refEn.t && none.err && none.t === refEn.t, () => `M2 ${tool}. lang "en" and none: English: ${cut(en.t)} | ${cut(none.t)}`);
  }
  // 3. a coded error with no approved Arabic stays English, whatever lang says (the drafts wait in work/LG2.md)
  for (const tool of MANY) {
    const ar = await s.call(tool, { path: 'nope', lang: 'ar' });
    chk(() => ar.err && /^No model named "nope" in the working folder /.test(ar.t) && !/[؀-ۿ]/.test(ar.t), () => `N ${tool}. NO_MODEL_NAMED with lang "ar": English until the owner approves a line: ${cut(ar.t)}`);
  }
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL script=test-0.3.3-lg2.mjs cause=${JSON.stringify(problems[0].slice(0, 200))}`); console.log(`FAIL  lg2  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n')); process.exit(1); }
console.log(`PASS  lg2  ${checks} checks`);
