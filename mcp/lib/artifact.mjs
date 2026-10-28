// J14 (0.3, B-168): the exact artifact. plan_layout builds the report with create_report's own build (server.mjs,
// reportRun) and checks those bytes here, every page; the approval is bound to their digest, the plan's pinned inputs and
// the model's print; create_report writes exactly those bytes or nothing (plans.mjs keeps them in this process only).
// What is checked, in memory, on the files create_report will write: Microsoft's validator offline (as check_report
// runs it, on a private copy in the OS temp folder, never the user's folder, removed at once), the references of every
// visual, sort and filter to the model or the report's own measures, our measured rules (report-rules.js) and the design
// lint, for every page (the tooltip pages too). A critical check that could not run makes the result `incomplete`,
// never `pass` (the owner, 19 Oct: plan_layout gives no plan id when the validator or the reference check did not run,
// unless only a size cap skipped it: `capped`, listed on the approval page); a validator error (its known gaps aside), an unresolved reference or a rule error makes it `blocked`.
// The answer holds counts, rule ids and paths inside the report only: never a name, a title or any other source text.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { inventory, memorySource, REPORT_LIMITS } from './read-report.mjs';
import { lint } from './design-lint.mjs';
import { rulesInput, knownGap, impactOf } from './check-report.mjs';

const require = createRequire(import.meta.url);
const Rules = require('../../assets/js/report-rules.js');

export const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
// one JSON form (object keys sorted, undefined left out), so the same values always hash the same
const canon = (v) => JSON.stringify(v === undefined ? null : v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().filter((key) => x[key] !== undefined).map((key) => [key, x[key]])) : x));

/** The digest of a project's files: sha256 over the sorted lines "path NUL sha256(bytes) LF" (paths as written). */
export const digestOf = (files) => sha(files.map((f) => String(f.path) + '\0' + sha(typeof f.data === 'string' ? Buffer.from(f.data) : f.data) + '\n').sort().join(''));
/** The model's print: B-154's (loadModel's hash of the definition files) when the reader gives one, else a hash of the
 *  model as it was read (its definition in one JSON form). */
export const modelPrintOf = (m) => (m && m.print) || sha(canon(m ? m.tmsl : null));
/** The binding an approval holds: the built files' digest, the plan's pinned inputs and the model's print, together. */
export const bindingOf = (digest, pin, modelPrint) => sha(canon({ digest, pin, modelPrint }));

const CRITICAL = ['validator', 'references', 'rules', 'lint'];
const inReport = (files) => files.filter((f) => /^[^/]+\.Report\//.test(f.path)).map((f) => ({ path: f.path.replace(/^[^/]+\.Report\//, ''), data: f.data }));
const skipped = (o) => new Set([].concat(o.skip || [], String(process.env.DATAARCUS_TEST_CHECK_SKIP || '').split(',')).map((x) => String(x).trim()).filter(Boolean));
const isPage = (s) => /^definition\/pages\/[^/]+\//.test(s);

// Microsoft's validator, offline, on a private copy of the exact bytes (it reads a folder): { ran, errors, warnings,
// known, byRule, files }, or { ran: false, why }
async function validate(files, mem) {
  const big = files.filter((f) => (typeof f.data === 'string' ? Buffer.byteLength(f.data) : f.data.length) > REPORT_LIMITS.file).length;
  if (big) return { ran: false, capped: true, why: `${big} file${big === 1 ? ' is' : 's are'} over the ${Math.round(REPORT_LIMITS.file / 1048576)} MB DataArcus reads (a picture of the report); the validator reads every file whole` };
  if (files.length > REPORT_LIMITS.files) return { ran: false, capped: true, why: 'more files than DataArcus reads' };
  const report = files.find((f) => /^[^/]+\.Report\/definition\.pbir$/.test(f.path));
  if (!report) return { ran: false, why: 'the project has no report folder' };
  const base = report.path.split('/')[0];
  let dir = null;
  try {
    const { runReportValidation, getMetadataProvider } = await import('@microsoft/powerbi-report-authoring-cli');
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-check-'));
    for (const f of files) { const to = path.join(dir, ...String(f.path).split('/')); if (!to.startsWith(dir + path.sep)) throw new Error('a path outside the project'); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.writeFileSync(to, f.data, { flag: 'wx', mode: 0o600 }); }
    const reportDir = path.join(dir, base), pbip = files.some((f) => f.path === base.replace(/\.Report$/, '') + '.pbip') ? path.join(dir, base.replace(/\.Report$/, '') + '.pbip') : undefined;
    const s = await runReportValidation({ reportDir, defDir: path.join(reportDir, 'definition'), provider: await getMetadataProvider(), skipSchema: true, pbipPath: pbip });
    // (0.3.1 P3A) each finding's kind as check_report gives it (impactOf, one copy): create_report says the same verdict
    const out = { ran: true, errors: 0, warnings: 0, known: 0, byRule: {}, files: [], kinds: { canBreak: 0, mayLook: 0, desktopOpens: 0 }, said: {} };
    for (const [code, d] of Object.entries(s.diagnostics || {})) for (const it of (d.items || [])) {
      const file = it.file && path.isAbsolute(String(it.file)) ? path.relative(reportDir, String(it.file)).split(path.sep).join('/') : null, inside = file && !file.startsWith('..') ? file : null;
      let known = null; if (inside && /visual\.json$/.test(inside)) { try { known = knownGap(code, it.path, JSON.parse(mem.get(inside))); } catch (e) { known = null; } }
      const rule = /^[A-Z0-9_]{3,60}$/.test(code) ? code : 'VALIDATOR';
      if (known) { out.known++; continue; }
      const kind = impactOf({ origin: 'validator', rule, severity: d.severity === 'error' ? 'error' : d.severity === 'warning' ? 'warning' : 'note', file: inside, _base: it.file ? path.basename(String(it.file)) : '' });
      out.kinds[kind] = (out.kinds[kind] || 0) + 1; out.said[rule] = (out.said[rule] || 0) + 1;
      if (d.severity === 'error') { out.errors++; out.byRule[rule] = (out.byRule[rule] || 0) + 1; if (inside) out.files.push({ rule, file: inside }); }
      else if (d.severity === 'warning') out.warnings++;
    }
    return out;
  } catch (e) { return { ran: false, why: 'the validator could not run here' }; }
  finally { if (dir) { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* the OS temp folder clears it */ } } }
}

// every field a visual shows, sorts or filters by, every page's filter: in the model, or a measure of the report's own
// (definition/reportExtensions.json); a date hierarchy's level is checked by its table
// (0.3.0 L4) pending: measures the plan writes as a script with the report (the flip cards'), counted as the model's
function references(inv, tables, mem, pending) {
  const model = new Map((tables || []).map((t) => [t.name, { columns: new Set((t.columns || []).map((c) => c.name)), measures: new Set((t.measures || []).map((x) => x.name)) }]));
  (pending || []).forEach((x) => { const t = model.get(x.t); if (t) t.measures.add(x.name); });
  const ext = new Map();
  try { (JSON.parse(mem.get('definition/reportExtensions.json') || '{}').entities || []).forEach((e) => ext.set(String(e.name), new Set((e.measures || []).map((x) => String(x.name))))); } catch (e) { /* none */ }
  const found = (f) => {
    if (!f || !f.table) return true;   // (an expression: nothing to resolve)
    if (/^(LocalDateTable_|DateTableTemplate_)/.test(f.table)) return true;
    if (f.kind === 'measure' && f.report) return !!(ext.get(f.table) && ext.get(f.table).has(f.name));
    const t = model.get(f.table);
    if (!t) return false;
    if (f.level) return true;
    if (f.kind === 'measure') return t.measures.has(f.name) || !!(ext.get(f.table) && ext.get(f.table).has(f.name));
    return t.columns.has(f.name) || t.measures.has(f.name);
  };
  const out = { checked: 0, unresolved: 0, files: [], pages: 0 };
  const see = (f, file) => { out.checked++; if (!found(f)) { out.unresolved++; out.files.push({ rule: 'REF_UNRESOLVED', file }); } };
  (inv.reportFilters || []).forEach((g) => see(g.field, 'definition/report.json'));
  for (const p of inv.pages) {
    (p.filters || []).forEach((g) => see(g.field, p.file));
    for (const x of p.visuals) {
      Object.values(x.fields || {}).flat().forEach((f) => { if (f && f.kind !== 'other') see(f, x.file); });
      (x.sort || []).forEach((s) => see(s.field, x.file));
      (x.filters || []).forEach((g) => see(g.field, x.file));
    }
    out.pages++;
  }
  return out;
}

/** The checks of a project's files in memory (create_report's files: "<name>.Report/...", "<name>.pbip"). tables: the
 *  model reader's tables; lang: 'en' | 'ar'; opts.skip: checks left out (tests); opts.blockOverlap: an OVERLAP blocks (FX2); opts.pending: [{ t, name }] measures written with the report as a script (L4). Never writes into the user's folder. */
export async function checkArtifact(files, tables, lang, opts) {
  const o = opts || {}, skip = skipped(o), rep = inReport(files), mem = new Map(rep.map((f) => [f.path, typeof f.data === 'string' ? f.data : Buffer.from(f.data).toString('utf8')]));
  const notRun = [], blocking = [], byRule = {};
  const count = (rule, n) => { if (n) byRule[rule] = (byRule[rule] || 0) + n; };
  const checks = { validator: { ran: false }, references: { ran: false }, rules: { ran: 0, failed: 0 }, lint: { ran: false } };
  let inv = null;
  try { inv = inventory(memorySource(rep), 'the planned report'); } catch (e) { inv = null; }
  if (!inv) { CRITICAL.forEach((c) => notRun.push({ check: c, why: 'the built report could not be read back' })); }
  const W = inv ? inv.pages : [];
  // 1. Microsoft's validator, offline
  if (skip.has('validator')) notRun.push({ check: 'validator', why: 'skipped' });
  else {
    const v = await validate(files, mem);
    checks.validator = v.ran ? Object.assign({ ran: true, errors: v.errors, warnings: v.warnings, known: v.known, kinds: v.kinds }, Object.keys(v.said).length ? { byRule: v.said } : {}) : { ran: false };
    if (!v.ran) notRun.push(Object.assign({ check: 'validator', why: v.why }, v.capped ? { capped: true } : {}));
    else { Object.entries(v.byRule).forEach(([k, n]) => count(k, n)); blocking.push(...v.files); if (v.errors > v.files.length) blocking.push({ rule: 'VALIDATOR', file: null }); }
  }
  if (inv) {
    // 2. the references
    if (skip.has('references')) notRun.push({ check: 'references', why: 'skipped' });
    else { try { const r = references(inv, tables, mem, o.pending); checks.references = { ran: true, checked: r.checked, unresolved: r.unresolved }; count('REF_UNRESOLVED', r.unresolved); blocking.push(...r.files); checks.references.pages = r.pages; }
      catch (e) { notRun.push({ check: 'references', why: 'could not read a visual\'s fields' }); } }
    // 3. our measured rules (the same input check_report gives them)
    if (skip.has('rules')) notRun.push({ check: 'rules', why: 'skipped' });
    else {
      try {
        const { R } = rulesInput(inv); Rules.normalize(R); R.lang = lang === 'ar' ? 'ar' : 'en'; R.dir = lang === 'ar' ? 'rtl' : 'ltr';
        const ruled = Rules.check(R, { groups: Rules.GROUPS });
        checks.rules = { ran: ruled.ran.length, failed: (ruled.failed || []).length };
        if ((ruled.failed || []).length) notRun.push({ check: 'rules', why: `${ruled.failed.length} rule${ruled.failed.length === 1 ? '' : 's'} could not run on this report` });
        ruled.findings.forEach((f) => { count(f.rule, 1); if (f.severity === 'error') blocking.push({ rule: f.rule, file: f.file || null }); });
      } catch (e) { notRun.push({ check: 'rules', why: 'the measured rules could not read this report' }); }
    }
    // 4. the design lint, every page
    if (skip.has('lint')) notRun.push({ check: 'lint', why: 'skipped' });
    // (0.3.1 FX2, the laptop's C23: a bar chart drawn over the table's first rows passed as "pass") with opts.blockOverlap
    // (a report DataArcus lays out itself), two data visuals overlapping (the lint's OVERLAP: never a panel or a card laid
    // over its own chart) block the plan; pages placed by hand keep the finding as a finding
    else { try { const L = lint(inv, tables, null, { titles: false }); checks.lint = { ran: true, findings: L.findings.length }; L.findings.forEach((f) => { count(f.rule, 1); if (f.rule === 'OVERLAP' && o.blockOverlap) blocking.push({ rule: f.rule, file: null }); }); }
      catch (e) { notRun.push({ check: 'lint', why: 'the design lint could not read this report' }); } }
  }
  const checkedPages = checks.references.ran && checks.lint.ran ? checks.references.pages : 0;
  if (checks.references.ran) delete checks.references.pages;
  const status = blocking.length ? 'blocked' : notRun.some((n) => CRITICAL.includes(n.check)) ? 'incomplete' : 'pass';
  const firsts = blocking.slice(0, 20).map((b) => ({ rule: b.rule, file: b.file && isPage(b.file) || b.file === 'definition/report.json' ? b.file : null }));
  return Object.assign({ status, files: files.length, pages: W.length, tooltipPages: W.filter((p) => p.kind === 'Tooltip').length, checkedPages, visuals: W.reduce((n, p) => n + p.visuals.length, 0), checks, byRule },
    blocking.length ? { blocking: firsts } : {}, blocking.length > firsts.length ? { moreBlocking: blocking.length - firsts.length } : {}, notRun.length ? { notRun } : {});
}
