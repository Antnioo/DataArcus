// WE1 (0.3.3; the owner, D-1109-02, answering A-LG1-2; written red first): the write tools with a `lang` input say the
// coded errors in Arabic when the call gives `lang: "ar"` explicitly. Their schema fills `lang: "en"` by default, so
// "given" is told from "absent" once, in lib/tool-answer.mjs (langGiven). No new Arabic: each Arabic answer is compared
// with read_model's own answer for the same folder (one source, never retyped here). Without lang AR4's letter rule
// stays, byte for byte. Through the real server (stdio). Made-up models only, in a temp folder.
//   node test-0.3.3-we1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-we1-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const model = (dir, name) => { const f = path.join(ROOT, dir, name + '.SemanticModel', 'model.bim'); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )' }] }] } }));
  fs.writeFileSync(path.join(ROOT, dir, name + '.SemanticModel', 'definition.pbism'), '{ "version": "4.0", "settings": {} }'); };
model('Models', 'Sales'); model('Models', 'Stock');
model('نماذج', 'Sales'); model('نماذج', 'Stock');

const ENGLISH = (p) => new RegExp(`^"${p}" holds 2 models at the same level: .+\\. Give read_model the path of the one you mean\\.$`);
const cut = (t) => String(t).slice(0, 300);

const s = await serverClient(ROOT);
try {
  // the reading tool's own answers: the one source of the Arabic and English words
  const refAr = await s.call('read_model', { path: 'Models', lang: 'ar' }), refEn = await s.call('read_model', { path: 'Models' });
  const refKeep = await s.call('read_model', { path: 'نماذج' });
  chk(() => refAr.err && /[؀-ۿ]/.test(refAr.t) && refEn.err && ENGLISH('Models').test(refEn.t) && refKeep.err && /^يحتوي "نماذج"/.test(refKeep.t),
    () => 'R. read_model\'s answers (the source): ' + cut(refAr.t) + ' | ' + cut(refEn.t) + ' | ' + cut(refKeep.t));
  for (const tool of ['plan_layout', 'add_gulf_calendar', 'generate_theme']) {
    const ar = await s.call(tool, { path: 'Models', lang: 'ar' });
    chk(() => ar.err && ar.t === refAr.t, () => `A ${tool}. lang "ar" given, 2 English-named models: read_model's approved Arabic: ${cut(ar.t)}`);
    const en = await s.call(tool, { path: 'Models', lang: 'en' });
    chk(() => en.err && en.t === refEn.t, () => `E ${tool}. lang "en" given: English: ${cut(en.t)}`);
    const none = await s.call(tool, { path: 'Models' });
    chk(() => none.err && none.t === refEn.t, () => `N ${tool}. no lang: English as today: ${cut(none.t)}`);
    const enAr = await s.call(tool, { path: 'نماذج', lang: 'en' });
    chk(() => enAr.err && ENGLISH('نماذج').test(enAr.t), () => `EA ${tool}. lang "en" given on an Arabic-named folder: English: ${cut(enAr.t)}`);
    const keep = await s.call(tool, { path: 'نماذج' });
    chk(() => keep.err && keep.t === refKeep.t, () => `K ${tool}. no lang on an Arabic-named folder: AR4's letter rule, byte for byte: ${cut(keep.t)}`);
  }
  // check_report catches its loadModel errors: no coded error reaches its words; its answer is the same whatever lang
  const cr = await Promise.all([{ path: 'Models', lang: 'ar' }, { path: 'Models', lang: 'en' }, { path: 'Models' }].map((a) => s.call('check_report', a)));
  chk(() => cr[0].t === cr[2].t && cr[1].t === cr[2].t && !/يحتوي/.test(cr[0].t), () => 'C. check_report: the same answer with lang ar, en and none: ' + cr.map((r) => cut(r.t)).join(' | '));
  // the schemas are unchanged: the defaults stay (an absent lang is still "en" / "auto" for the tool's own work)
  const { tools } = await s.c.listTools(), by = Object.fromEntries(tools.map((t) => [t.name, t.inputSchema]));
  chk(() => ['plan_layout', 'add_gulf_calendar', 'generate_theme'].every((n) => by[n].properties.lang.default === 'en') && by.check_report.properties.lang.default === 'auto',
    () => 'S1. the write tools\' lang keeps its default');
  chk(() => by.create_report && !by.create_report.properties.lang, () => 'S2. create_report takes no lang (nothing added)');
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL script=test-0.3.3-we1.mjs cause=${JSON.stringify(problems[0].slice(0, 200))}`); console.log(`FAIL  we1  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n')); process.exit(1); }
console.log(`PASS  we1  ${checks} checks`);
