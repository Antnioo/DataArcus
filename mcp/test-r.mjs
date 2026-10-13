// The outside review of the 0.2.9 release candidate rc.12 (fix/0.2.9-gate 80767b5), the holes R-01, R-02 and R-04,
// written red first. test.mjs runs it with its own client (import { rgate }); alone:
//   node test-r.mjs
//   R-01: a plan that pinned a tool's inputs refuses a write that passes none (the gate fails closed)
//   R-02: the native copy and the twin refuse an original whose .platform or .pbip can't be read (never copied as it
//         is, nor replaced by a default)
//   R-04: every name the tools write (create_report's and plan_layout's displayNames, the twin's labels) is refused
//         with an invisible format sign (a direction override or isolate, a zero-width space); Arabic and its joiners pass
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let fresh = 0;
const freshImport = (rel) => import(pathToFileURL(path.join(HERE, rel)).href + '?r=' + (++fresh));

export async function rgate({ call, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));

  // ---------- R-01: pinned inputs, none passed: refused ----------
  {
    const P = await freshImport('lib/plans.mjs');
    const id = P.propose('theme', null, ['a theme file'], { pins: { generate_theme: { brand: '#0F766E' } } }); P.approve(id, 'go');
    let err = ''; try { P.gate('generate_theme', id, null); } catch (e) { err = e.message; }
    chk(() => /Nothing was written/.test(err) && /no inputs/.test(err), () => `R-01. a write that passes no inputs to a pinned plan is refused: ${err}`);
    let ok = ''; try { P.gate('generate_theme', id, null, { brand: '#0F766E' }); } catch (e) { ok = e.message; }
    chk(() => ok === '', () => `R-01. the same inputs still pass: ${ok}`);
  }

  // ---------- R-04: the one name rule ----------
  {
    const { writtenName } = await freshImport('lib/display-names.mjs');
    const refused = (s) => { try { writtenName(s, 'x'); return false; } catch (e) { return /invisible sign/.test(e.message) && /Nothing was written|nothing was written/.test(e.message); } };
    const bad = ['Sales‮txt.exe', '⁦Sales⁩', 'Sa​les', '﻿Sales', 'المبيعات‭', 'Sales‎'];
    chk(() => bad.every(refused), () => `R-04. every format sign refused: ${bad.filter((s) => !refused(s)).map((s) => JSON.stringify(s)).join(', ')}`);
    chk(() => writtenName('إجمالي المبيعات', 'x') === 'إجمالي المبيعات' && writtenName('می‌خواهم', 'x') === 'می‌خواهم' && writtenName('Net\tSales\u0085', 'x') === 'Net Sales',
      () => 'R-04. Arabic, the joiners and plain names pass; controls become a space');
  }
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
  fs.mkdirSync(path.join(ROOT, 'rg', 'M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'rg', 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'Region', dataType: 'string', sourceColumn: 'Region' }],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }] } }));
  {
    const pl = await ask('plan_layout', { path: 'rg', layout: 'exec', lang: 'ar', displayNames: { 'Sales[Region]': 'المنطقة‮' } });
    chk(() => pl.err && /invisible sign/.test(pl.t) && /U\+202E/.test(pl.t), () => `R-04. plan_layout refuses a display name with a direction override: ${short(pl)}`);
    const ok = await ask('plan_layout', { path: 'rg', layout: 'exec', lang: 'ar', displayNames: { 'Sales[Region]': 'المنطقة' } });
    chk(() => !ok.err && ok.j.plan && /^plan-/.test(ok.j.plan.planId), () => `R-04. the same plan with a plain Arabic name is made: ${short(ok)}`);
  }

  // ---------- R-04 (the twin's labels) and R-02 (an unreadable .platform or .pbip) ----------
  const T = path.join(ROOT, 'rtwin');
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), T, { recursive: true });
  {
    const bad = await ask('create_arabic_twin', { path: 'rtwin/Twin Sales.pbip', labels: { 'page:p1overview': 'نظرة⁧ عامة' } });
    chk(() => bad.err && /invisible sign/.test(bad.t), () => `R-04. a twin label with an isolate sign is refused: ${short(bad)}`);
  }
  for (const [what, file] of [['.platform', path.join(T, 'Twin Sales.Report', '.platform')], ['the .pbip', path.join(T, 'Twin Sales.pbip')]]) {
    const keep = fs.readFileSync(file);
    const pl = await ask('create_arabic_twin', { path: 'rtwin/Twin Sales.pbip', labels: { 'page:p1overview': 'نظرة عامة' } }), pid = pl.j && pl.j.plan && pl.j.plan.planId;
    await ask('approve_plan', { planId: pid, userReply: 'go' });
    fs.writeFileSync(file, '{ not json');
    const w = await ask('create_arabic_twin', { path: 'rtwin/Twin Sales.pbip', planId: pid });
    chk(() => w.err && /could not be read/.test(w.t) && !fs.existsSync(path.join(T, 'Twin Sales AR.Report')) && !fs.existsSync(path.join(T, 'Twin Sales AR.pbip')),
      () => `R-02. the twin refuses an original whose ${what} can't be read, nothing written: ${short(w)}`);
    fs.writeFileSync(file, keep);
  }
  {
    const { mustJson } = await freshImport('lib/read-report.mjs');
    const f = path.join(T, 'broken.json'); fs.writeFileSync(f, '{');
    let err = ''; try { mustJson(f, 'report.json'); } catch (e) { err = e.message; }
    chk(() => /Nothing was written/.test(err) && /report\.json/.test(err), () => `R-02. the native copy's reader refuses an unreadable file: ${err}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-r-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await rgate({ call: s.call, check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  rgate  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  rgate  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
