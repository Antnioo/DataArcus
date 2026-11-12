import './fixtures/sp1/seeded-random.mjs';
import './test-env.mjs';
// 0.3.2 FN1J (mcp/work/FN1J.md): plan_layout's register split into named steps, behaviour identical. A characterisation
// suite recorded on the base (integration/0.3.2 207784c6, before the split): plan_layout's whole answer for 90 made-up
// plans (fixtures/fn1j-cases.mjs: one per condition of the handler's parts) and, for each plan with an id, what the plan
// holds for the approval page and the write (Plans.planOf: writes and data; Plans.artifactOf: the exact files' digest,
// the native copy's pin and binding). Called in this process through the registered tool (its inputs parsed by the
// tool's own schema, as the server does), the ids from SP1's one fixed seed; normalised: the plan id, the working
// folder, the path separator and the path limit's numbers (they follow the folder's length). Recorded in
// fixtures/fn1j-pins.json as sha256 and length; FN1J_RECORD=1 records them again (only on the base, never to make a run
// pass); FN1J_DUMP=<file> writes the texts compared.
//   A1  every answer;  A2  every plan's data;  C1  the plans reach the parts (a plan id, planProblems, each part's key)
//   node test-0.3.2-fn1j.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const pin = (t) => ({ length: t.length, sha256: sha(t) });
const GOLD = path.join(HERE, 'fixtures', 'fn1j-pins.json');

// the modules read DATAARCUS_ROOT when they load: set before they are imported
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fn1j-')));
process.env.DATAARCUS_ROOT = ROOT;
const { writeModels, CASES } = await import('./fixtures/fn1j-cases.mjs');
await writeModels(ROOT, HERE);
const { z } = await import('zod');
const Plans = await import('./lib/plans.mjs');
const { LIMITS } = await import('./lib/tool-limits.mjs');
const { register } = await import('./tools/plan_layout.mjs');
const { loadModel } = await import('./lib/model.mjs');
const Terms = await import('./lib/terminology.mjs');
let def = null, handler = null;
register({ registerTool: (name, d, h) => { if (name === 'plan_layout') { def = d; handler = h; } } }, { LIMITS });
const schema = def.inputSchema && typeof def.inputSchema.safeParse === 'function' ? def.inputSchema : z.object(def.inputSchema);

const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t))
  .replace(/plan-[0-9a-f]{12}/g, 'plan-<id>').split('\\\\').join('/')
  .replace(/\(for example (?:C:\/PBI|~\/PBI)\)/g, '(for example <a short folder>)')   // (PH1) the example follows the platform; ph1 pins each
  .replace(/its deepest file's path would be (\d+) characters, and (?:Windows and Power BI Desktop allow|this system allows) (\d+)/g, (m, n, max) => `its deepest file's path would be <ROOT>+${n - ROOT.length} characters, and <the system> allows <ROOT>+${max - ROOT.length}`);
const now = {}, texts = {}, got = {};
for (const [name, args, env] of CASES) {
  if (env && env.PATH_MAX) process.env.DATAARCUS_TEST_PATH_MAX = String(ROOT.length + env.PATH_MAX);
  if (env && env.REMEMBER) Terms.remember(loadModel(env.REMEMBER.path), env.REMEMBER.rows);
  let t, err = false, id = null;
  try {
    const parsed = schema.safeParse(args);
    if (!parsed.success) { err = true; t = 'schema: ' + parsed.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join('; '); }
    else { const r = await handler(parsed.data); err = !!r.isError; t = (r.content || []).map((c) => c.text || '').join(''); }
  } catch (e) { err = true; t = 'threw: ' + String(e && e.message || e); }
  finally { delete process.env.DATAARCUS_TEST_PATH_MAX; }
  try { const j = JSON.parse(t); id = j && j.plan && j.plan.planId; } catch (e) { /* (an error's text is pinned as it is) */ }
  const answer = norm(t);
  now['A1 ' + name] = Object.assign({ err }, pin(answer)); texts['A1 ' + name] = answer; got[name] = { err, t: answer, raw: t.length };
  if (id) {
    const p = Plans.planOf(id), art = Plans.artifactOf(id);
    const held = norm(JSON.stringify({ kind: p.kind, writes: p.writes, data: p.data, artifact: art ? { digest: art.digest, files: (art.files || []).map((f) => f.path), pin: art.pin, modelPrint: art.modelPrint, binding: art.binding } : null }));
    now['A2 ' + name] = pin(held); texts['A2 ' + name] = held;
  }
}
if (process.env.FN1J_DUMP) fs.writeFileSync(process.env.FN1J_DUMP, JSON.stringify(texts, null, 1));
if (process.env.FN1J_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-fn1j.mjs: plan_layout\'s answers and the plans\' data recorded on the base (integration/0.3.2 207784c6, before the split; normalised: the plan id, the working folder, the separator, the path limit\'s numbers and example folder; recorded again on purpose by 0.3.3 LX1, 12 Nov: unknownKeys\' sentence in C05 and H15, nothing else, mcp/work/LX1.md)', pins: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).pins;
const diff = Object.keys(gold).filter((k) => !now[k] || now[k].sha256 !== gold[k].sha256 || now[k].length !== gold[k].length || now[k].err !== gold[k].err).concat(Object.keys(now).filter((k) => !gold[k]));
const of = (pre) => Object.keys(gold).filter((k) => k.startsWith(pre)).length;
chk(() => !diff.filter((k) => k.startsWith('A1 ')).length, () => `A1. plan_layout's answers are the base's, byte for byte: ${of('A1 ') - diff.filter((k) => k.startsWith('A1 ')).length} of ${of('A1 ')} the same; differ: ${diff.filter((k) => k.startsWith('A1 ')).slice(0, 12).join('; ')} (FN1J_DUMP=<file> writes them)`);
chk(() => !diff.filter((k) => k.startsWith('A2 ')).length, () => `A2. the plans' data are the base's, byte for byte: ${of('A2 ') - diff.filter((k) => k.startsWith('A2 ')).length} of ${of('A2 ')} the same; differ: ${diff.filter((k) => k.startsWith('A2 ')).slice(0, 12).join('; ')}`);

// the plans reach the parts: ids and refusals, and each part's key in some answer
const all = Object.values(got).map((v) => v.t).join('\n');
const KEYS = ['"planProblems"', '"planId"', '"gulfDates"', '"timeAxis"', '"customVisuals"', '"metricSwitcher"', '"statusIcons"', '"daxFunctions"', '"sharedAxes"', '"designLint"', '"aggregation"', '"exactCheck"', '"titlesInEnglish"',
  '"switcherLabels"', '"countedTitles"', '"bilingual"', '"gallery"', '"waterfallRtl"', '"calendarArabic"', '"slicers"', '"terminology"', '"flipCards"', '"cardsWritten"', '"kindChanges"', '"pageNames"', '"formats"', '"displayNames"', '"arabicNames"', 'name an area first', "the report can't be written there"];
chk(() => KEYS.every((k) => all.includes(k)), () => `C1. the plans reach every part: missing ${JSON.stringify(KEYS.filter((k) => !all.includes(k)))}`);

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-fn1j.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  fn1j  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  fn1j  ${checks} checks`);
