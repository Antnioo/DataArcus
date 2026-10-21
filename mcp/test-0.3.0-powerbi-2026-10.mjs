// 0.3.0 U1 (written red first, 19 Oct 2026): Microsoft's October 2026 Power BI update (Desktop 2.159.883.0) and what
// Microsoft published around it: the visual catalog @microsoft/powerbi-core-visual-schema 0.1.3 (19 Oct), which the
// validator reads and which now lists the dropdown slicer's rounded box, and the SU09 report schemas on
// github.com/microsoft/json-schemas (af7b264, 15 Oct). Research: mcp/research/POWERBI-2026-10.md; plan: mcp/work/U1.md.
//   U1-1  the catalog pin: 0.1.3 exactly, installed, and the copy the validator reads
//   U1-2  the catalog lists slicer.dropdown's three properties the writer writes (borderRadius an integer, bool, fill)
//   U1-3  every object and property the writer emits is in the catalog for its visual type (nothing it writes is gone)
//   U1-4  the written reports: validator 0 errors, no PBIR_FORMATTING_OBJECT_UNKNOWN; check_report 0 can-break, known 0
//   U1-5  check_report's known gap is active only while the installed catalog does not list the object
//   U1-6  the bundled schemas hold SU09 (visualContainer 2.13.0 and what it references); a 2.13.0 file is checked
//   U1-7  visual-types.js is the installed catalog's list; a list slicer in dropdown mode is read as a slicer
//   U1-8  the writer's default is unchanged: Dropdown `slicer` visuals, no listSlicer
//   node test-0.3.0-powerbi-2026-10.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { validatorCounts } from './test-validator.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const httpReq = (url, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method: body ? 'POST' : 'GET', headers: body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {} }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', (e) => resolve('error: ' + e.message)); if (body) r.write(body); r.end();
});
const visualFiles = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? visualFiles(path.join(d, e.name)) : e.name === 'visual.json' ? [path.join(d, e.name)] : [])) : []);
const PIN = '0.1.3', SU09 = 'af7b264';
const CVS = path.join(HERE, 'node_modules/@microsoft/powerbi-core-visual-schema');
const CAPS = JSON.parse(fs.readFileSync(path.join(CVS, 'data/capabilities.json'), 'utf8'));

try {
  // ---------- U1-1 the pin ----------
  {
    const pkg = J(path.join(HERE, 'package.json')), lock = J(path.join(HERE, 'package-lock.json'));
    const installed = J(path.join(CVS, 'package.json')).version;
    const nested = Object.keys(lock.packages || {}).filter((k) => /node_modules\/.+\/node_modules\/@microsoft\/powerbi-core-visual-schema$/.test(k));
    chk(() => pkg.dependencies['@microsoft/powerbi-core-visual-schema'] === PIN && installed === PIN && lock.packages['node_modules/@microsoft/powerbi-core-visual-schema'].version === PIN && !nested.length,
      () => `U1-1. the catalog is pinned at ${PIN} (package.json ${pkg.dependencies['@microsoft/powerbi-core-visual-schema']}, installed ${installed}, lock ${lock.packages['node_modules/@microsoft/powerbi-core-visual-schema'].version}), one copy (nested: ${nested})`);
    // the validator resolves the same copy
    const cli = path.join(HERE, 'node_modules/@microsoft/powerbi-report-authoring-cli');
    const fromCli = createRequire(path.join(cli, 'package.json'));
    let seen = null; try { seen = J(path.join(path.dirname(fromCli.resolve('@microsoft/powerbi-core-visual-schema/package.json')), 'package.json')).version; } catch (e) { seen = String(e.message).slice(0, 80); }
    chk(() => seen === PIN, () => `U1-1. the validator reads the catalog ${PIN}: it resolves ${seen}`);
  }

  // ---------- U1-2 slicer.dropdown in the catalog ----------
  {
    const d = (((CAPS.slicer || {}).objects || {}).dropdown || {}).properties || {};
    chk(() => d.borderRadius && d.borderRadius.type.integer && d.borderIndividualCorners && d.borderIndividualCorners.type.bool && d.borderColor && d.borderColor.type.fill && d.borderColor.type.fill.solid,
      () => `U1-2. Microsoft's catalog lists slicer.dropdown.borderRadius (integer; the writer's 8D is judged by the validator in U1-4), borderIndividualCorners (bool), borderColor (fill): ${JSON.stringify(Object.keys(d))}`);
    const ls = (CAPS.listSlicer || {}).objects || {};
    chk(() => ls.data && ls.data.properties.dropdownMode && ls.data.properties.dropdownMode.type.bool, () => 'U1-2. the list slicer\'s dropdown mode is data.dropdownMode (bool) in Microsoft\'s catalog (research, not written)');
  }

  // ---------- U1-5 the known gap follows the catalog ----------
  {
    const CR = await import('./lib/check-report.mjs');
    const lit = (v) => ({ expr: { Literal: { Value: v } } });
    const box = { visual: { visualType: 'slicer', objects: { data: [{ properties: { mode: lit("'Dropdown'") } }], dropdown: [{ properties: { borderRadius: lit('8D'), borderIndividualCorners: lit('false'), borderColor: { solid: { color: lit("'#9ca3af'") } } } }] } } };
    const without = (type) => { const c = JSON.parse(JSON.stringify(CAPS[type] || null)); if (c && c.objects) delete c.objects.dropdown; return c; };
    let a = 'threw', b = 'threw', c2 = 'threw';
    try { a = CR.knownGap('PBIR_FORMATTING_OBJECT_UNKNOWN', 'dropdown', box); } catch (e) { a = 'threw ' + e.message; }
    try { b = CR.knownGap('PBIR_FORMATTING_OBJECT_UNKNOWN', 'dropdown', box, without); } catch (e) { b = 'threw ' + e.message; }
    const more = JSON.parse(JSON.stringify(box)); more.visual.objects.dropdown[0].properties.accentBarShow = lit('true');
    try { c2 = CR.knownGap('PBIR_FORMATTING_OBJECT_UNKNOWN', 'dropdown', more, without); } catch (e) { c2 = 'threw ' + e.message; }
    chk(() => a === null, () => `U1-5. catalog ${PIN} lists slicer.dropdown: the gap is inactive (null): ${JSON.stringify(a)}`);
    chk(() => b && typeof b === 'object' && /2\.158/.test(b.what) && /DESKTOP-TESTS/.test(b.evidence), () => `U1-5. a catalog without slicer.dropdown brings the gap back for the proven shape: ${JSON.stringify(b)}`);
    chk(() => c2 === null, () => `U1-5. ...and only for that shape (one more property: none): ${JSON.stringify(c2)}`);
  }

  // ---------- U1-6 the bundled schemas ----------
  {
    const S = path.join(HERE, 'schemas/fabric/item/report/definition');
    const want = ['visualContainer/2.13.0/schema.json', 'visualConfiguration/2.8.0/schema.json', 'visualConfiguration/2.8.0/schema-embedded.json', 'visualContainerMobileState/2.8.0/schema.json'];
    const missing = want.filter((f) => !fs.existsSync(path.join(S, f)));
    chk(() => !missing.length, () => `U1-6. SU09 schemas bundled: missing ${missing}`);
    // the same structure as the versions before them, identity aside (Microsoft's CHANGELOG: "retaining the schema structure")
    chk(() => JSON.stringify(J(path.join(S, 'visualContainer/2.13.0/schema.json'))).split('visualContainer/2.13.0').join('visualContainer/2.12.0').split('visualConfiguration/2.8.0').join('visualConfiguration/2.7.0') === JSON.stringify(J(path.join(S, 'visualContainer/2.12.0/schema.json'))),
      () => 'U1-6. visualContainer 2.13.0 is 2.12.0 with its identity and visualConfiguration 2.8.0 (Microsoft\'s copy, unchanged)');
    const src = fs.readFileSync(path.join(HERE, 'schemas/SOURCE.md'), 'utf8'), cr = fs.readFileSync(path.join(HERE, 'lib/check-report.mjs'), 'utf8');
    chk(() => src.includes(SU09) && new RegExp(`SCHEMA_COMMIT = '${SU09}'`).test(cr), () => `U1-6. SOURCE.md and check_report name the copied commit ${SU09}`);
  }

  // ---------- U1-7 the shared type list ----------
  {
    const VT = req('../assets/js/visual-types.js');
    const { listVisualTypes } = await import('@microsoft/powerbi-core-visual-schema');
    const cat = listVisualTypes().slice().sort();
    chk(() => JSON.stringify(VT.NATIVE_TYPES.slice().sort()) === JSON.stringify(cat) && VT.CATALOG === `@microsoft/powerbi-core-visual-schema ${PIN}` && !VT.NATIVE_TYPES.includes('debugVisual'),
      () => `U1-7. visual-types.js is the installed catalog's list (${VT.CATALOG}): missing ${cat.filter((t) => !VT.NATIVE_TYPES.includes(t))}, extra ${VT.NATIVE_TYPES.filter((t) => !cat.includes(t))}`);
  }

  // ---------- U1-3, U1-4, U1-6 (a 2.13.0 file), U1-7 (reading), U1-8: reports through the MCP ----------
  const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-u1-'));
  fs.cpSync(path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
  const MP = 'large/Large Synthetic.SemanticModel', log = path.join(ROOT, 'links.txt');
  const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
  const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '300' });
  try {
    const cases = [{ id: 'en', lang: 'en', layout: 'exec' }, { id: 'ar', lang: 'ar', layout: 'ops' }];
    const dirs = [];
    for (const c of cases) {
      const base = { path: MP, focus: 'Web Orders', lang: c.lang, layout: c.layout, name: 'U1 ' + c.id, secondPage: true };
      const pl = await s.call('plan_layout', base), id = pl.j && pl.j.plan && pl.j.plan.planId;
      chk(() => /^plan-/.test(id), () => `${c.id} setup: plan_layout gives a plan id: ${String(pl.t).slice(0, 300)}`);
      if (!id) continue;
      const n0 = links().length, ap = s.call('approve_plan', { planId: id });
      for (let k = 0; k < 100 && links().length <= n0; k++) await sleep(50);
      await httpReq(links()[n0], 'decision=approve'); await ap;
      const cr = await s.call('create_report', Object.assign({}, base, { planId: id, design: pl.j.design }));
      const dir = path.join(ROOT, 'large', base.name + '.Report');
      chk(() => !cr.err && fs.existsSync(dir), () => `${c.id} setup: create_report writes the approved report: ${String(cr.t).slice(0, 300)}`);
      if (cr.err || !fs.existsSync(dir)) continue;
      dirs.push(dir);
      const vs = visualFiles(dir).map(J).filter((j) => j.visual);
      // U1-3: every object and property written is in the catalog for its type
      const off = [];
      vs.forEach((j) => { const caps = CAPS[j.visual.visualType]; if (!caps) { off.push(j.visual.visualType + ' (type)'); return; }
        Object.entries(j.visual.objects || {}).forEach(([o, es]) => { const po = (caps.objects || {})[o]; if (!po) { off.push(`${j.visual.visualType}.${o}`); return; }
          (es || []).forEach((e) => Object.keys(e.properties || {}).forEach((p) => { if (!(po.properties || {})[p]) off.push(`${j.visual.visualType}.${o}.${p}`); })); }); });
      chk(() => !off.length, () => `U1-3 ${c.id}: written objects/properties not in Microsoft's catalog ${PIN}: ${[...new Set(off)].join(', ')}`);
      // U1-8: the default is unchanged
      const sl = vs.filter((j) => /slicer/i.test(j.visual.visualType));
      chk(() => sl.length >= 1 && sl.every((j) => j.visual.visualType === 'slicer' && j.visual.objects.data[0].properties.mode.expr.Literal.Value === "'Dropdown'" && j.visual.objects.dropdown),
        () => `U1-8 ${c.id}: every slicer is a Dropdown slicer with its rounded box, none a listSlicer: ${sl.map((j) => j.visual.visualType)}`);
      // U1-4: the validator and check_report
      const v = validatorCounts(dir);
      chk(() => v.ran && v.errorCount === 0 && v.known === 0 && v.expected === 0 && !(v.codes || []).length, () => `U1-4 ${c.id}: Microsoft's validator 0 errors, no known note: ${JSON.stringify(v).slice(0, 400)}`);
      const ck = await s.call('check_report', { path: path.relative(ROOT, dir), lang: c.lang });
      const unk = ((ck.j && ck.j.findings) || []).filter((f) => f.rule === 'PBIR_FORMATTING_OBJECT_UNKNOWN');
      chk(() => !ck.err && !unk.length && ck.j.validator.errors === 0 && (ck.j.validator.known || 0) === 0 && ck.j.counts.errors === 0 && ck.j.impact.kinds.canBreak.count === 0,
        () => `U1-4 ${c.id}: check_report: no PBIR_FORMATTING_OBJECT_UNKNOWN (${unk.length}), validator errors 0, known 0, can-break 0: ${ck.err ? ck.t.slice(0, 200) : JSON.stringify([ck.j.validator, ck.j.counts, ck.j.impact.kinds.canBreak])}`);
    }
    // U1-6: a visual.json at 2.13.0 (the version Desktop saves) is schema-checked; a broken one is an error
    if (dirs[0]) {
      const at = (name, edit) => { const d = path.join(ROOT, 'large', name + '.Report'); fs.cpSync(dirs[0], d, { recursive: true }); fs.cpSync(path.join(ROOT, 'large', 'U1 en.pbip'), path.join(ROOT, 'large', name + '.pbip'));
        const p = J(path.join(ROOT, 'large', name + '.pbip')); p.artifacts[0].report.path = name + '.Report'; fs.writeFileSync(path.join(ROOT, 'large', name + '.pbip'), JSON.stringify(p, null, 2));
        const f = visualFiles(d).find((x) => J(x).visual && J(x).visual.visualType === 'slicer'), j = J(f);
        j.$schema = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.13.0/schema.json'; if (edit) edit(j); fs.writeFileSync(f, JSON.stringify(j, null, 2)); return name; };
      const good = await s.call('check_report', { path: `large/${at('U1 su09')}.pbip`, checks: ['schemas'] });
      chk(() => !good.err && !good.j.notChecked.some((n) => n.rule === 'SCHEMA') && good.j.schemas.errors === 0,
        () => `U1-6. a 2.13.0 visual.json is checked against the bundled schema (no SCHEMA notChecked, 0 errors): ${good.err ? good.t.slice(0, 200) : JSON.stringify([good.j.schemas, good.j.notChecked.filter((n) => n.rule === 'SCHEMA')])}`);
      const bad = await s.call('check_report', { path: `large/${at('U1 su09 bad', (j) => { delete j.position; })}.pbip`, checks: ['schemas'] });
      chk(() => !bad.err && bad.j.schemas.errors >= 1, () => `U1-6. a 2.13.0 visual.json without its position is a schema error: ${bad.err ? bad.t.slice(0, 200) : JSON.stringify(bad.j.schemas)}`);
      // U1-7: a list slicer in dropdown mode (a user's report) is read as a slicer
      const lsName = at('U1 list', (j) => { j.visual.visualType = 'listSlicer'; j.visual.objects = { data: [{ properties: { dropdownMode: { expr: { Literal: { Value: 'true' } } } } }] }; });
      const rr = await s.call('read_report', { path: `large/${lsName}.pbip`, format: 'json' });
      const lsv = rr.j && JSON.stringify(rr.j).match(/\{"id":"[^"]*","type":"listSlicer"[^{}]*\{/);
      chk(() => !rr.err && lsv && /"slicer":true/.test(lsv[0]), () => `U1-7. read_report reads a dropdown-mode listSlicer as a slicer: ${rr.err ? rr.t.slice(0, 300) : lsv && lsv[0]}`);
    }
  } finally { await s.close(); }
} catch (e) { problems.push('the suite threw: ' + (e && e.stack || e)); }

if (problems.length) { console.log(`FAIL  powerbi-2026-10  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  powerbi-2026-10  ${checks} checks`);
