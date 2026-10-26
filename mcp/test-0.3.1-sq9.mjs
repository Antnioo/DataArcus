// SQ9 (0.3.1, the Seen batch "tool texts and public claims"; written red first): the tools' schemas and hints say what
// the code does.
//   H   check_report's lang takes Hebrew, as its checker does (0.2.9-checks-S9)
//   I   idempotentHint: true only where a repeat writes nothing new: check_model_health and add_gulf_calendar (a second
//       plan on the same model names the same files and leaves the disk as it is); false for the tools whose repeat
//       writes another file (0.2.9-design-S8)
//   T   one table limit for every tool that takes tables, measured under the answer cap on the large model (Q1-S9)
// In process: the tools' own handlers and the gate (lib/plans.mjs), the approval given as the window's click gives it.
// Fixtures: mcp/fixtures/twin-project, mcp/fixtures/health-project, mcp/test-models/large-synthetic (made up).
//   node test-0.3.1-sq9.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);

// the working folder first: the library modules read DATAARCUS_ROOT when they are loaded
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sq9-')));
process.env.DATAARCUS_ROOT = ROOT;
const fresh = (name, from) => { fs.cpSync(path.join(HERE, from), path.join(ROOT, name), { recursive: true }); return path.join(ROOT, name); };

const Plans = await import('./lib/plans.mjs');
const { LIMITS } = await import('./lib/tool-limits.mjs');
const { LIMIT } = await import('./lib/scope.mjs');
const { checkReport } = await import('./lib/check-report.mjs');
const TOOLS = ['read_model', 'suggest_fields', 'plan_layout', 'create_report', 'check_model_health', 'add_gulf_calendar', 'generate_theme', 'create_arabic_twin', 'check_report'];
const H = {}, D = {};
for (const t of TOOLS) {
  const { register } = await import(`./tools/${t}.mjs`);
  register({ registerTool: (name, def, h) => { H[name] = h; D[name] = def; } }, { LIMITS });
}
const call = async (tool, a) => { const r = await H[tool](a), t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal's words */ } return { err: !!r.isError, t, j }; };
const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
const idOf = (p) => p.j && p.j.plan && p.j.plan.planId;
const approve = (id) => Plans.approve(id, 'user-in-browser');
const ok = (schema, v) => !!(schema && schema.safeParse(v).success);

try {
  // ---------- H: check_report's lang ----------
  {
    const lang = D.check_report.inputSchema.lang;
    chk(() => ok(lang, 'he') && ['auto', 'en', 'ar'].every((v) => ok(lang, v)), () => 'H1. check_report\'s lang takes "he" (the checker reads it as right to left), besides auto, en and ar');
    chk(() => /Hebrew/.test(lang.description || ''), () => `H2. check_report's lang says what "he" is: ${lang.description}`);
    fresh('h', 'fixtures/twin-project');
    const r = await checkReport('h/Twin Sales.Report', { lang: 'he', checks: ['rtl'] });
    chk(() => r.lang === 'he' && (r.notChecked || []).some((n) => n.rule === 'RTL_MIRROR (tables)'), () => `H3. with lang "he" the right-to-left rules run: lang ${r.lang}, notChecked ${JSON.stringify((r.notChecked || []).map((n) => n.rule))}`);
  }

  // ---------- I: idempotentHint, from what a repeat does ----------
  {
    const ann = (t) => D[t].annotations || {};
    for (const t of ['check_model_health', 'add_gulf_calendar']) {
      chk(() => ann(t).idempotentHint === true && ann(t).readOnlyHint === false && ann(t).destructiveHint === false, () => `I1. ${t}: idempotentHint true (a repeat names the same file and writes nothing new), readOnlyHint and destructiveHint false: ${JSON.stringify(ann(t))}`);
    }
    for (const t of ['generate_theme', 'create_report', 'create_arabic_twin']) {
      chk(() => ann(t).idempotentHint === false && ann(t).destructiveHint === false, () => `I2. ${t}: idempotentHint false (a repeat writes another file): ${JSON.stringify(ann(t))}`);
    }
    // the behaviour the hint rests on: a second plan on the same model, approved and written, changes nothing on disk
    for (const [t, dir, a] of [['check_model_health', 'ih', { path: 'ih/Health Test.SemanticModel' }], ['add_gulf_calendar', 'ig', { path: 'ig/Health Test.SemanticModel', firstYear: 2024, lastYear: 2025 }]]) {
      const P = fresh(dir, 'fixtures/health-project');
      const flow = async () => { const p = await call(t, a), id = idOf(p); approve(id); return { p, w: await call(t, Object.assign({ planId: id }, a)), id }; };
      const one = await flow();
      const snap = () => tree(P).map((f) => `${path.relative(P, f)} ${fs.statSync(f).size} ${fs.statSync(f).mtimeMs}`).sort().join('\n');
      const after1 = snap(), again = await call(t, Object.assign({ planId: one.id }, a)), two = await flow();
      chk(() => !one.w.err && !two.w.err, () => `I3. ${t}: both flows answer: ${short(one.w)} / ${short(two.w)}`);
      chk(() => again.err && /already used/.test(again.t), () => `I4. ${t}: the same planId again writes nothing: ${short(again)}`);
      chk(() => snap() === after1, () => `I5. ${t}: a second plan on the same model, approved and written, leaves the disk as it was:\n${after1}\n---\n${snap()}`);
    }
    // and the reason generate_theme stays false: its repeat is a new file
    {
      fs.mkdirSync(path.join(ROOT, 'th'));
      const a = { name: 'Brand', folder: 'th' };
      for (let k = 0; k < 2; k++) { const p = await call('generate_theme', a), id = idOf(p); approve(id); await call('generate_theme', Object.assign({ planId: id }, a)); }
      chk(() => fs.readdirSync(path.join(ROOT, 'th')).sort().join(',') === 'brand-2.json,brand.json', () => `I6. generate_theme repeated writes a second file: ${fs.readdirSync(path.join(ROOT, 'th'))}`);
    }
  }

  // ---------- T: one table limit ----------
  {
    const n = LIMITS.tables, names = Array.from({ length: (n || 0) + 1 }, (_, i) => 'T' + i);
    chk(() => Number.isInteger(n) && n > 0, () => `T1. LIMITS.tables is the tools' one table limit: ${n}`);
    for (const t of ['read_model', 'suggest_fields', 'plan_layout', 'create_report']) {
      const s = D[t].inputSchema.tables;
      chk(() => ok(s, names.slice(0, n)) && !ok(s, names), () => `T2. ${t}: tables takes ${n} names and refuses ${n + 1}`);
    }
    // measured: the most tables, on the 300-table model, each answer under the cap with a 10% margin
    fresh('large/Large Synthetic.SemanticModel', 'test-models/large-synthetic/Large Synthetic.SemanticModel');
    const rm = await call('read_model', { path: 'large' });
    const all = [].concat((rm.j && rm.j.tablesWithMeasures || []).map((x) => x.table), (rm.j && rm.j.otherTables || []).map((x) => (typeof x === 'string' ? x : x.name))).filter(Boolean);
    for (const t of ['suggest_fields', 'plan_layout']) {
      const x = await call(t, { path: 'large', kpis: 6, tables: all.slice(0, n) });
      chk(() => all.length >= n && !x.err && x.t.length < Math.floor(LIMIT * 0.9), () => `T3. ${t} with ${n} tables on the large model: an answer under ${Math.floor(LIMIT * 0.9)} characters: ${x.t.length} ${x.err ? x.t.slice(0, 200) : ''}`);
    }
  }
} finally {
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL script=test-0.3.1-sq9.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sq9  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sq9  ${checks} checks`);
