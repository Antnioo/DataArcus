// The outside review of the 0.2.9 release candidate rc.12 (fix/0.2.9-gate 80767b5), the holes R-01, R-02 and R-04,
// written red first. test.mjs runs it with its own client (import { rgate }); alone:
//   node test-r.mjs
//   R-01: a plan that pinned a tool's inputs refuses a write that passes none (the gate fails closed)
//   R-02: the native copy and the twin refuse an original whose .platform or .pbip can't be read (never copied as it
//         is, nor replaced by a default)
//   R-04: every name the tools write (create_report's and plan_layout's displayNames, the twin's labels) is refused
//         with an invisible format sign (a direction override or isolate, a zero-width space); Arabic and its joiners pass
// The outside review of rc.14 (14 Oct, same file):
//   A-02: the report's look and options (name, title, theme, logo, colours, options) are pinned with the plan and shown
//         in it: a write with another value is refused, a write that leaves one out gets the plan's
// And the night audit of 13 Oct (same file):
//   AUD-034: a preset named like an object's own property (__proto__, constructor, toString) is repaired, not a crash
//   AUD-035: a Windows device name (CON, NUL, COM1, LPT1 ...) never becomes a theme file or a report's .pbip / .Report
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
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

  // ---------- A-02: what the plan shows of the report's look is what is written ----------
  {
    const pl = await ask('plan_layout', { path: 'rg', layout: 'exec', name: 'Look Test', title: 'Approved title', secondPage: false, smoothLines: true });
    const pid = pl.j && pl.j.plan && pl.j.plan.planId, look = pl.j && pl.j.plan && pl.j.plan.reportLook;
    chk(() => pid && look && look.title === 'Approved title' && look.name === 'Look Test' && look.secondPage === false && /approved/.test(look.sayInPlan), () => `A-02. the plan shows the report's look: ${short(pl)}`);
    await ask('approve_plan', { planId: pid, userReply: 'go' });
    const design = pl.j && pl.j.design;
    const other = await ask('create_report', { path: 'rg', planId: pid, design, name: 'Look Test', title: 'Another title', secondPage: false, smoothLines: true });
    chk(() => other.err && /Nothing was written/.test(other.t) && /title/.test(other.t) && !fs.existsSync(path.join(ROOT, 'rg', 'Look Test.Report')), () => `A-02. a title other than the approved one is refused: ${short(other)}`);
    const opt = await ask('create_report', { path: 'rg', planId: pid, design, secondPage: true });
    chk(() => opt.err && /secondPage/.test(opt.t), () => `A-02. an option other than the approved one is refused: ${short(opt)}`);
    const ok = await ask('create_report', { path: 'rg', planId: pid, design, secondPage: false, smoothLines: true });
    chk(() => !ok.err && fs.existsSync(path.join(ROOT, 'rg', 'Look Test.Report')), () => `A-02. left out, the plan's name and title are written: ${short(ok)}`);
    const pl2 = await ask('plan_layout', { path: 'rg', layout: 'exec' }), pid2 = pl2.j && pl2.j.plan && pl2.j.plan.planId;
    await ask('approve_plan', { planId: pid2, userReply: 'go' });
    const th = await ask('create_report', { path: 'rg', planId: pid2, design: pl2.j && pl2.j.design, name: 'Theme Test', theme: 'some-theme.json' });
    chk(() => th.err && /Nothing was written/.test(th.t) && /(name|theme)/.test(th.t), () => `A-02. a theme or name the plan did not show is refused: ${short(th)}`);
  }

  // ---------- AUD-034: inherited property names are not presets ----------
  for (const preset of ['__proto__', 'constructor', 'toString']) {
    const t = await ask('generate_theme', { preset, name: 'Audit Theme' });
    chk(() => !t.err && /not a preset/.test(JSON.stringify(t.j)), () => `AUD-034. preset ${preset} is repaired with the list of presets: ${short(t)}`);
  }

  // ---------- AUD-035: Windows device names ----------
  {
    const req = createRequire(import.meta.url), E = req('../assets/js/design-engine.js'), Pb = req('../assets/js/pbip-export.js');
    const themes = ['CON', 'nul', 'Com1', 'LPT9', 'aux'].map((n) => E.fileBase(n));
    chk(() => themes.join() === 'con_,nul_,com1_,lpt9_,aux_' && E.fileBase('Console') === 'console' && E.fileBase('CON sales') === 'con-sales',
      () => `AUD-035. theme files never take a device name: ${themes.join()} / ${E.fileBase('Console')} / ${E.fileBase('CON sales')}`);
    const d = E.fresh(); E.repairState(d);
    const specs = E.projectPages(d.layout, 'en', { second: false, panel: false });
    const baseOf = (name) => { const r = Pb.build({ name, title: 'T', pageName: specs[0].name, lang: 'en', rtl: false, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), sample: true, logo: null, texts: E.REPORT_TEXTS.en,
      pages: specs.map((sp) => ({ name: sp.name, page: sp.page, slots: sp.slots, panel: sp.panel, kpiInset: E.kpiInset(sp.layout), png: new Uint8Array([1]) })) });
      return String((r.files.find((f) => /\.pbip$/.test(f.path)) || {}).path).replace(/^.*\//, ""); };
    const got = ['NUL', 'con', 'COM1', 'nul.tar', 'Contoso'].map(baseOf);
    chk(() => got.join() === 'NUL_.pbip,con_.pbip,COM1_.pbip,nul_.tar.pbip,Contoso.pbip', () => `AUD-035. report names never take a device name: ${got.join()}`);
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
