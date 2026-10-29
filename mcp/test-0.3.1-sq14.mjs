// 0.3.1 SQ14 (the owner, 26 Oct: "Yes, fix now" to every open "Seen, not in scope" item; written red first): one Arabic
// month list, and two of check_report's internals.
//   M  arabic-calendar.js's MONTHS is the one Arabic month list (WORK-2026-10-11-14-S1, Q1-S3): the same 12 strings as
//      before (pinned by hash), and pbip-query.js, calendar-generator.js, label-limits.js, theme-generator.js and
//      mcp/lib/shadow-model.mjs read it (no list of their own); a page loading one of them loads arabic-calendar first
//   P  a SCHEMA finding's path keeps only the words the schema itself names (S1-S8): a page's or a visual's id used as
//      a key (a bookmark's sections) is never shown
//   D  DAX_MEASURE_PENDING is said only for a measure that a DAX functions script next to the project declares (L6-S11):
//      a user's own missing "<name> (KPI card)" measure is not taken for DataArcus's
// Fixture: mcp/fixtures/twin-project (made up), copied to a temporary working folder.
//   node test-0.3.1-sq14.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const SRC = (f) => fs.readFileSync(path.join(REPO, f), 'utf8');

// ---------- M: one Arabic month list ----------
{
  const AC = req('../assets/js/arabic-calendar.js');
  // the 12 names as every written report has them today (e1f895d), byte for byte
  chk(() => AC.MONTHS.length === 12 && crypto.createHash('sha256').update(AC.MONTHS.join('|'), 'utf8').digest('hex') === 'ee6b111af6b2979ef8cdde01e01fcc6a58f866aee45a9f17d3a71fb8169ae1be',
    () => `M1. arabic-calendar's MONTHS are the same 12 strings as before: ${JSON.stringify(AC.MONTHS)}`);
  const Q = req('../assets/js/pbip-query.js'), Cal = req('../assets/js/calendar-generator.js'), LL = req('../assets/js/label-limits.js');
  chk(() => Q.NAMES && Q.NAMES.month.ar === AC.MONTHS, () => 'M2. pbip-query\'s Arabic month names are arabic-calendar\'s MONTHS (one array)');
  chk(() => Cal.MONTHS.ar === AC.MONTHS, () => 'M3. the Calendar Generator\'s Arabic months are arabic-calendar\'s MONTHS');
  chk(() => LL.NAMES && LL.NAMES.month.ar === AC.MONTHS, () => 'M4. label-limits\' Arabic month names are arabic-calendar\'s MONTHS');
  const { MONTHS_AR } = await import('./lib/shadow-model.mjs');
  chk(() => MONTHS_AR === AC.MONTHS, () => 'M5. the shadow model\'s Arabic months are arabic-calendar\'s MONTHS');
  // no other list left in the sources (a month name that is a word of a sentence is not a list: two or more in a row)
  const LIST = new RegExp(AC.MONTHS.slice(0, 2).map((m) => `['"]${m}['"]`).join('\\s*,\\s*'));
  const own = ['assets/js/pbip-query.js', 'assets/js/calendar-generator.js', 'assets/js/label-limits.js', 'assets/js/theme-generator.js', 'mcp/lib/shadow-model.mjs'].filter((f) => LIST.test(SRC(f)));
  chk(() => !own.length, () => `M6. no Arabic month list of their own: ${own.join(', ')}`);
  // the website: a page that loads a reader loads arabic-calendar.min.js before it (both copies)
  const READERS = ['theme-generator.min.js', 'calendar-generator.min.js'];
  const pages = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory() && !/^(node_modules|\.git|mcp|assets|scripts)$/.test(e.name)) walk(f); else if (e.isFile() && f.endsWith('.html')) pages.push(f); });
  walk(REPO);
  const bad = [], seen = [];
  for (const f of pages) {
    const h = fs.readFileSync(f, 'utf8');
    for (const r of READERS) {
      const at = h.indexOf('assets/js/' + r); if (at < 0) continue;
      seen.push(path.relative(REPO, f));
      const ac = h.indexOf('assets/js/arabic-calendar.min.js');
      if (ac < 0 || ac > at) bad.push(`${path.relative(REPO, f)} (${r})`);
    }
  }
  chk(() => seen.length >= 5 && !bad.length, () => `M7. every page loading a reader loads arabic-calendar.min.js first: ${bad.join('; ') || 'pages found: ' + seen.join(', ')}`);
  // theme-generator.js loads the report builder (pbip-query, label-limits) on demand: after the page's arabic-calendar
  chk(() => !/arabic-calendar\.min\.js/.test(SRC('assets/js/theme-generator.js')) || SRC('assets/js/theme-generator.js').indexOf('arabic-calendar.min.js') < SRC('assets/js/theme-generator.js').indexOf('pbip-query.min.js'),
    () => 'M8. the builder list does not load arabic-calendar after pbip-query');
}

// ---------- P and D: check_report on a copy of the twin fixture ----------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sq14-'));
process.env.DATAARCUS_ROOT = ROOT;
try {
  const { checkReport } = await import('./lib/check-report.mjs');
  const fresh = (name) => { const d = path.join(ROOT, name); fs.rmSync(d, { recursive: true, force: true }); fs.cpSync(path.join(HERE, 'fixtures/twin-project'), d, { recursive: true }); return d; };
  const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8')), wr = (f, j) => fs.writeFileSync(f, JSON.stringify(j, null, 2));
  const findings = (r) => (r && (r.findings || (r.j && r.j.findings))) || [];

  // P: a wrong value under a bookmark's page and visual ids
  {
    const d = fresh('p'), bm = path.join(d, 'Twin Sales.Report/definition/bookmarks/bmDetails.bookmark.json'), j = rd(bm);
    j.explorationState.sections.p2details.visualContainers.barProduct = 5;
    wr(bm, j);
    const r = await checkReport('p/Twin Sales.pbip', { checks: ['schemas'] });
    const s = findings(r).find((f) => f.rule === 'SCHEMA' && /bmDetails/.test(f.file));
    chk(() => s && /explorationState\.sections\.…\.visualContainers\.…/.test(s.what), () => `P1. the path keeps the schema's words and hides the ids: ${s && s.what}`);
    chk(() => s && !/p2details|barProduct/.test(s.what), () => `P2. no page or visual id in the finding: ${s && s.what}`);
    chk(() => !findings(r).some((f) => f.rule === 'SCHEMA' && /\.json$/.test(f.file) && !/bmDetails/.test(f.file)), () => 'P3. the other files still check clean');
  }

  // D: a card showing a missing "Total Sales (KPI card)"
  {
    const NAME = 'Total Sales (KPI card)';
    const setup = (name, script) => {
      const d = fresh(name), v = path.join(d, 'Twin Sales.Report/definition/pages/p1overview/visuals/cardSales/visual.json'), j = rd(v);
      const p = j.visual.query.queryState.Values.projections[0]; p.field.Measure.Property = NAME; p.queryRef = 'Sales.' + NAME; p.nativeQueryRef = NAME;
      wr(v, j);
      if (script) fs.writeFileSync(path.join(d, 'Twin Sales - DAX functions.tmdl'), script);
      return `${name}/Twin Sales.pbip`;
    };
    const tmdl = (m) => `createOrReplace\n\n\tref table Sales\n\n\t\tmeasure '${m}' = "data:image/svg+xml;utf8,<svg/>"\n\t\t\tdisplayFolder: DataArcus DAX functions\n\t\t\tdataCategory: ImageUrl\n\n`;
    const pending = async (p) => findings(await checkReport(p, { checks: ['navigation'] })).filter((f) => f.rule === 'DAX_MEASURE_PENDING');
    const none = await pending(setup('d-none', null));
    chk(() => !none.length, () => `D1. no DAX functions script next to the project: no DAX_MEASURE_PENDING for the user's own measure: ${JSON.stringify(none).slice(0, 300)}`);
    const yes = await pending(setup('d-yes', tmdl(NAME)));
    chk(() => yes.length === 1 && yes[0].severity === 'note' && !JSON.stringify(yes[0]).includes('Total Sales'), () => `D2. the script declares it: one note, the name not quoted: ${JSON.stringify(yes).slice(0, 300)}`);
    const other = await pending(setup('d-other', tmdl('Profit (KPI card)')));
    chk(() => !other.length, () => `D3. the script declares another measure: no note: ${JSON.stringify(other).slice(0, 300)}`);
    const tw = await pending((() => { setup('d-twin', tmdl(NAME)); fs.renameSync(path.join(ROOT, 'd-twin/Twin Sales.pbip'), path.join(ROOT, 'd-twin/Twin Sales (Arabic).pbip')); return 'd-twin/Twin Sales (Arabic).pbip'; })());
    chk(() => tw.length === 1, () => `D4. a copy next to the original (the twin) reads the original's script: ${JSON.stringify(tw).slice(0, 300)}`);
  }
} finally { fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL script=test-0.3.1-sq14.mjs cause=${problems[0].slice(0, 160)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sq14  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sq14  ${checks} checks`);
