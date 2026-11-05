// LG1 (0.3.2; the owner, D-1105-16; written red first): an optional `lang` on the reading tools that can say "several
// models" (read_model, suggest_fields, check_model_health), so the person's language decides, not the folder names.
// E1 round 5's input (L-1105-09): a folder "Models" holding 2, then 3 English-named models, the person writing Arabic.
// Without lang AR4's letter rule stays. Through the real server (stdio). Made-up models only, in a temp folder.
//   node test-0.3.2-lg1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-lg1-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const model = (dir, name) => { const f = path.join(ROOT, dir, name + '.SemanticModel', 'model.bim'); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }] } }));
  fs.writeFileSync(path.join(ROOT, dir, name + '.SemanticModel', 'definition.pbism'), '{ "version": "4.0", "settings": {} }'); };
model('Models', 'Sales'); model('Models', 'Stock');
model('نماذج', 'Sales'); model('نماذج', 'Stock');

const EN = (p, n) => new RegExp(`^"${p}" holds ${n} models at the same level: (.+)\\. Give read_model the path of the one you mean\\.$`);
const AR = (p, c, list) => `يحتوي "${p}" على ${c} في المستوى نفسه: ${list}. أعطِ read_model مسار النموذج الذي تقصده.`;
const listOf = (t, p, n) => { const m = EN(p, n).exec(t); return m ? m[1] : null; };

const s = await serverClient(ROOT);
try {
  // without lang: English as today (2), and the models' list for the Arabic sentence
  const en2 = await s.call('read_model', { path: 'Models' }), l2 = listOf(en2.t, 'Models', 2);
  chk(() => en2.err && l2, () => 'N2. read_model, no lang, 2 English-named models: English as today: ' + en2.t.slice(0, 300));
  for (const [tool, extra] of [['read_model', {}], ['suggest_fields', {}], ['check_model_health', {}]]) {
    const r = await s.call(tool, Object.assign({ path: 'Models', lang: 'ar' }, extra));
    chk(() => r.err && r.t === AR('Models', 'نموذجين', l2), () => `A2 ${tool}. lang "ar", 2 English-named models: AR4's Arabic: ${r.t.slice(0, 300)}`);
  }
  // the third model: 3
  model('Models', 'Staff');
  const en3 = await s.call('read_model', { path: 'Models' }), l3 = listOf(en3.t, 'Models', 3);
  chk(() => en3.err && l3, () => 'N3. read_model, no lang, 3 English-named models: English as today: ' + en3.t.slice(0, 300));
  const ar3 = await s.call('read_model', { path: 'Models', lang: 'ar' });
  chk(() => ar3.err && ar3.t === AR('Models', '3 نماذج', l3), () => 'A3. read_model, lang "ar", 3 models: «3 نماذج»: ' + ar3.t.slice(0, 300));
  // an Arabic-named folder: lang "en" says English; without lang AR4's letter rule says Arabic
  for (const tool of ['read_model', 'check_model_health']) {
    const r = await s.call(tool, { path: 'نماذج', lang: 'en' });
    chk(() => r.err && listOf(r.t, 'نماذج', 2), () => `E2 ${tool}. lang "en" on an Arabic-named folder: English: ${r.t.slice(0, 300)}`);
  }
  const keep = await s.call('read_model', { path: 'نماذج' });
  chk(() => keep.err && /^يحتوي "نماذج" على نموذجين في المستوى نفسه: /.test(keep.t), () => 'K. no lang on an Arabic-named folder: AR4\'s letter rule kept: ' + keep.t.slice(0, 300));
  // the schemas: lang en|ar, optional, on the three; read_report never says these codes and has none
  const { tools } = await s.c.listTools(), by = Object.fromEntries(tools.map((t) => [t.name, t.inputSchema]));
  const hasLang = (n) => { const p = by[n] && by[n].properties && by[n].properties.lang; return p && JSON.stringify(p.enum) === '["en","ar"]' && !(by[n].required || []).includes('lang') && p.default === undefined && /Arabic/.test(p.description || ''); };
  chk(() => hasLang('read_model') && hasLang('check_model_health'), () => 'S1. read_model and check_model_health take lang (en|ar, optional, said when to pass it)');
  chk(() => by.suggest_fields.properties.lang && /writes in Arabic/.test(by.suggest_fields.properties.lang.description), () => 'S2. suggest_fields\' lang says it is also the language of its error answers');
  chk(() => by.read_report && !by.read_report.properties.lang, () => 'S3. read_report takes no lang (it never says these errors)');
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL script=test-0.3.2-lg1.mjs cause=${JSON.stringify(problems[0].slice(0, 200))}`); console.log(`FAIL  lg1  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n')); process.exit(1); }
console.log(`PASS  lg1  ${checks} checks`);
