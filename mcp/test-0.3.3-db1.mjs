import './fixtures/sp1/seeded-random.mjs';
import './test-env.mjs';
// 0.3.3 DB1 (mcp/work/DB1.md, B-421): the branches of plan_layout's handler FN1J found no input for, that are reachable.
// Each check is red on the base (integration/0.3.3) with its branch's mutant applied (DB1.md, "Red first"):
//   V2   previewOf's displayNames: the preview shows the names given (DB2: a plan with no report name now gets no plan id,
//        so this plan has a name; the no-exact-build route this branch took is gone)
//   TT2  the keptOnPurpose filters: a field kept English on purpose under a key typed with the table quoted
//        ('Sales'[Qzx Flux]) reaches notTranslated through the lint, and is kept out of titlesInEnglish.fields (a)
//        and switcherLabels (b): the plan keeps its id
//   B6   the status icons' line in the Arabic writes: a rate measure and its "<name> Target" in a table; the tiny model
//        (no "Margin % Target") gives no icon column, the measured cause said in notShown
// Called in this process through the registered tool (its inputs parsed by the tool's own schema), on fn1j's made-up
// models (fixtures/fn1j-cases.mjs) and one more: the tiny model with a "Margin % Target" measure. Made-up names only.
//   node test-0.3.3-db1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

// the modules read DATAARCUS_ROOT when they load: set before they are imported
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-db1-')));
process.env.DATAARCUS_ROOT = ROOT;
const { writeModels } = await import('./fixtures/fn1j-cases.mjs');
await writeModels(ROOT, HERE);
// (B6) the tiny model (fn1j's, as written there) with one measure more: "Margin % Target", a percent, the target the
// status icons' automatic mode looks for beside "Margin %" (status-icons.mjs targetOf)
const tiny = JSON.parse(fs.readFileSync(path.join(ROOT, 'tiny', 'Tiny.SemanticModel', 'model.bim'), 'utf8'));
tiny.model.tables.find((t) => t.name === 'Sales').measures.push({ name: 'Margin % Target', expression: 'DIVIDE ( [Sales Target], [Total Sales] )', formatString: '0.0%' });
fs.mkdirSync(path.join(ROOT, 'icons', 'Icons.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'icons', 'Icons.SemanticModel', 'model.bim'), JSON.stringify(tiny));

const { z } = await import('zod');
const Plans = await import('./lib/plans.mjs');
const { LIMITS } = await import('./lib/tool-limits.mjs');
const { register } = await import('./tools/plan_layout.mjs');
let def = null, handler = null;
register({ registerTool: (name, d, h) => { if (name === 'plan_layout') { def = d; handler = h; } } }, { LIMITS });
const schema = def.inputSchema && typeof def.inputSchema.safeParse === 'function' ? def.inputSchema : z.object(def.inputSchema);
const call = async (args) => { const p = schema.safeParse(args); if (!p.success) throw new Error('schema: ' + p.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join('; '));
  const r = await handler(p.data); const t = (r.content || []).map((c) => c.text || '').join(''); if (r.isError) throw new Error('error: ' + t.slice(0, 300)); return JSON.parse(t); };
const dataOf = (j) => { const id = j && j.plan && j.plan.planId; const p = id && Plans.planOf(id); return p ? p.data : null; };
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Orders]': 'الطلبات', 'Sales[Margin]': 'الهامش', 'Sales[Product]': 'المنتج', 'Sales[Region]': 'المنطقة' };

// ---------- V2: the preview with the names given ----------
{
  const j = await call({ path: 'tiny', name: 'DB1 V2', layout: 'exec', displayNames: { 'Sales[Total Sales]': 'Revenue Now' } });
  const d = dataOf(j), pv = d && d.preview ? JSON.stringify(d.preview) : '';
  chk(() => j.exactCheck.status === 'pass' && j.plan.planId, () => `V2: a plan with a report name (DB2: one without gets no plan id): exactCheck ${JSON.stringify(j.exactCheck).slice(0, 200)}, plan id ${j.plan && j.plan.planId} (expected pass and an id)`);
  chk(() => (pv.match(/Revenue Now/g) || []).length > 0, () => `V2: the preview built without exact files shows the name given ("Revenue Now") ${(pv.match(/Revenue Now/g) || []).length} times; the model's "Total Sales" ${(pv.match(/Total Sales/g) || []).length} (previewOf's displayNames not read)`);
}

// ---------- TT2: a field kept English on purpose, its key typed with the table quoted ----------
const PF = { kpis: ['Sales[Qzx Flux]', 'Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Qzx Flux]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]' };
const KEPT = Object.assign({}, AR_NAMES, { "'Sales'[Qzx Flux]": 'Qzx Flux' });
{
  const j = await call({ path: 'odd', name: 'DB1 kept', lang: 'ar', layout: 'exec', kpis: 3, displayNames: KEPT, planFields: PF });
  const an = j.arabicNames || {};
  chk(() => (an.notTranslated || []).some((x) => x.field === 'Sales[Qzx Flux]'), () => `TT2: the lint's fields put Sales[Qzx Flux] in notTranslated (the input reaches the filter): ${JSON.stringify((an.notTranslated || []).map((x) => x.field))}`);
  chk(() => an.titlesInEnglish && an.titlesInEnglish.titles.some((t) => t.includes('Qzx Flux')) && !an.titlesInEnglish.fields, () => `TT2a: titlesInEnglish lists the English titles and no field (kept English on purpose): ${JSON.stringify(an.titlesInEnglish || null).slice(0, 300)}`);
  chk(() => j.plan && j.plan.planId && !j.planProblems, () => `TT2a: the plan keeps its id: planProblems ${JSON.stringify(j.planProblems || null).slice(0, 300)}`);
}
{
  const j = await call({ path: 'odd', name: 'DB1 kept switch', lang: 'ar', layout: 'exec', kpis: 3, displayNames: KEPT, planFields: PF, metricSwitcher: ['Sales[Qzx Flux]', 'Sales[Total Sales]'] });
  const an = j.arabicNames || {};
  chk(() => (an.notTranslated || []).some((x) => x.field === 'Sales[Qzx Flux]') && !an.switcherLabels, () => `TT2b: the switcher's measure kept English on purpose is not in switcherLabels: ${JSON.stringify(an.switcherLabels || null).slice(0, 300)}`);
  chk(() => j.plan && j.plan.planId && !j.planProblems, () => `TT2b: the plan keeps its id: planProblems ${JSON.stringify(j.planProblems || null).slice(0, 300)}`);
}

// ---------- B6: the status icons in an Arabic plan ----------
const ICON_NAMES = Object.assign({ 'Sales[Margin %]': 'نسبة الهامش' }, AR_NAMES);
const ICON_FIELDS = { kpis: ['Sales[Total Sales]'], category: 'Sales[Region]', timeAxis: 'Calendar[Month Name]', table: ['Sales[Region]', 'Sales[Margin %]'] };
{
  // the cause measured: on the tiny model Margin % has no "<name> Target" (its "Sales Target" names a measure "Sales")
  const j = await call({ path: 'tiny', name: 'DB1 no target', lang: 'ar', layout: 'exec', displayNames: ICON_NAMES, planFields: ICON_FIELDS, statusIcons: true });
  const s = j.statusIcons || {};
  chk(() => s.columns.length === 0 && (s.notShown || []).some((x) => x.measure === 'Sales[Margin %]' && /no target measure/.test(x.why)) && s.scriptAfterGo == null, () => `B6: on the tiny model, no icon column and Margin % said without a target: ${JSON.stringify(s).slice(0, 300)}`);
}
{
  const j = await call({ path: 'icons', name: 'DB1 icons', lang: 'ar', layout: 'exec', displayNames: ICON_NAMES, planFields: ICON_FIELDS, statusIcons: true });
  const s = j.statusIcons || {}, d = dataOf(j), wa = d && d.writesAr ? d.writesAr.join('\n') : '';
  chk(() => s.columns.length >= 1 && s.columns.every((c) => c.measure === 'Sales[Margin %]' && c.way === 'measure' && c.target === 'Sales[Margin % Target]'), () => `B6: Margin % and its target give icon columns: ${JSON.stringify(s.columns || null).slice(0, 300)}`);
  chk(() => s.scriptAfterGo === 'DB1 icons - status icons.tmdl' && s.newMeasures === 1, () => `B6: the status measures' script: ${s.scriptAfterGo}, ${s.newMeasures} new measures`);
  chk(() => wa.includes(`«${s.scriptAfterGo}»`) && wa.includes(`: ${s.newMeasures}،`), () => `B6: the Arabic writes name the status icons' script and its measures: ${wa.slice(0, 400)}`);
  chk(() => Plans.planOf(j.plan.planId).writes.join('\n').includes(`"${s.scriptAfterGo}" (${s.newMeasures} new measures`), () => `B6: the English writes name the script too: ${JSON.stringify(Plans.planOf(j.plan.planId).writes).slice(0, 400)}`);
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.3-db1.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  db1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  db1  ${checks} checks`);
