// Microsoft's validator as the tests count it (polish round P2, the owner's rounded slicer boxes, 12 Oct 2026).
// Every report DataArcus writes gives each dropdown slicer a rounded box (objects.dropdown: borderRadius 8D,
// borderIndividualCorners false, borderColor). Power BI Desktop 2.158 opens and draws it (the lab's LAB-POLISH, section
// 2a; scripts/tests/DESKTOP-TESTS.md, 2026-10-12); Microsoft's validator 0.4.0 does not know the "dropdown" object yet and
// reports PBIR_FORMATTING_OBJECT_UNKNOWN once per slicer. The one known-false entry is check_report's own
// (lib/check-report.mjs VALIDATOR_GAPS, knownGap): that rule, that object, a Dropdown slicer, exactly those three
// properties. A test that said "the validator gives 0 errors" now says: 0 errors outside that entry, AND its hits are
// exactly the boxes the report holds (counted from the files). A report without a dropdown slicer still has 0 of
// everything. Never a pattern, never a whole rule or file skipped.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { VALIDATOR_GAPS, knownGap } from './lib/check-report.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const VALIDATOR_CLI = path.join(HERE, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };
const visualFiles = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? visualFiles(path.join(d, e.name)) : e.name === 'visual.json' ? [path.join(d, e.name)] : [])) : []);

// the known-false hits a report should give: one per visual whose object is exactly a known gap's shape
export function expectedKnown(reportDir) {
  return visualFiles(reportDir).reduce((n, f) => { const j = readJson(f); return n + VALIDATOR_GAPS.filter((g) => knownGap(g.code, g.object, j)).length; }, 0);
}

// { ran, errorCount (errors outside the known-false entry, plus one when its hits are not exactly the expected ones),
//   codes, errors [{ code, message }], known, expected, warnings } | { ran: false, why }
export function validatorCounts(reportDir) {
  const p = spawnSync(process.execPath, [VALIDATOR_CLI, 'validate', reportDir], { encoding: 'utf8' });
  let d; try { d = JSON.parse(p.stdout).data; } catch (e) { return { ran: false, why: String(p.stderr || p.error || p.stdout).slice(0, 200) }; }
  const diag = d.diagnostics || d.diagnosticsByCode || {}, errors = []; let known = 0;
  for (const [code, x] of Object.entries(diag)) {
    if (!x || x.severity !== 'error') continue;
    for (const it of (Array.isArray(x.items) && x.items.length ? x.items : [{}])) {
      const gap = it.file && VALIDATOR_GAPS.some((g) => g.code === code && g.object === it.path) && /visual\.json$/i.test(String(it.file)) ? knownGap(code, it.path, readJson(String(it.file))) : null;
      if (gap) known++; else errors.push({ code, message: String(it.message || '').split(String(it.file || '\u0000')).join('').replace(/[:\s]+$/, '').slice(0, 120) });
    }
  }
  const expected = expectedKnown(reportDir);
  if (known !== expected) errors.push({ code: 'KNOWN_FALSE_MISMATCH', message: `${known} known-false hit(s) for ${expected} expected` });
  return { ran: true, errorCount: errors.length, codes: [...new Set(errors.map((e) => e.code))], errors, known, expected, warnings: d.warningCount };
}

// the old one-line form the tests compared with '0' / 0: the count, and the codes when there are errors
export const validatorErrors = (reportDir) => { const r = validatorCounts(reportDir); return r.ran ? r.errorCount + (r.errorCount ? ' (' + r.codes.join(', ') + ')' : '') : 'the validator did not run: ' + r.why; };
// a check_report answer: 0 validator errors outside the known-false entry, and its hits exactly the expected ones
// (rc.22, B-142: validator.errors no longer counts the known entries, which are notes)
export const checkReportClean = (ans, reportDir) => !!(ans && ans.validator && ans.validator.errors === 0 && (ans.validator.known || 0) === expectedKnown(reportDir));
