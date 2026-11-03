// node test-check-release.mjs
// PR1 (0.3.1): scripts/check-release.mjs, the release consistency check run on release day, on its fixtures
// (scripts/tests/fixtures/release/: a made-up release 1.2.3, named the same in every file, and the Registry's answer
// for it). The matching set gives no mismatch; a copy with one thing changed gives exactly that one; the live mode is
// checked with the fixtures as its answers (no network); the command prints its result line and exits 1 on a mismatch.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkRelease, dayOf, registryDays, LIVE } from '../scripts/check-release.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const FIX = path.join(ROOT, 'scripts/tests/fixtures/release'), FIXED = path.join(FIX, 'match'), SCRIPT = path.join(ROOT, 'scripts/check-release.mjs');
const SHA = '1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e', WRONG = 'f'.repeat(64);
let checks = 0; const problems = [];
const chk = (ok, msg) => { checks++; if (!ok) problems.push(typeof msg === 'function' ? msg() : msg); };
const show = (r) => JSON.stringify(r.mismatches);

// a copy of the matching set (its pages kept as .html.fixture, so the site's suites never open them) with one file
// changed
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-release-'));
const copy = (name) => {
  const dir = path.join(tmp, name);
  fs.cpSync(FIXED, dir, { recursive: true });
  for (const f of fs.readdirSync(dir, { recursive: true })) if (f.endsWith('.html.fixture')) fs.renameSync(path.join(dir, f), path.join(dir, f.replace(/\.fixture$/, '')));
  return dir;
};
const variant = (name, file, from, to) => {
  const dir = copy(name);
  const p = path.join(dir, file), t = fs.readFileSync(p, 'utf8');
  if (!t.includes(from)) throw new Error(`fixture ${file} has no "${from}"`);
  fs.writeFileSync(p, t.replace(from, to));
  return dir;
};

try {
  const MATCH = copy('match');
  // 1. the matching set: no mismatch, and every kind of fact was compared
  const m = await checkRelease({ root: MATCH, version: '1.2.3' });
  chk(m.mismatches.length === 0 && m.checks >= 40, () => `R1. the matching set gives no mismatch in 40 checks or more: ${m.checks} checks, ${show(m)}`);
  const other = await checkRelease({ root: MATCH, version: '1.2.4' });
  chk(other.mismatches.some((x) => /README\.md: release tag names 1\.2\.3, want 1\.2\.4/.test(x)) && other.mismatches.some((x) => /mcp\/CHANGELOG\.md: no "## \[1\.2\.4\]/.test(x)),
    () => `R2. the same set checked for another version names each old line: ${show(other)}`);

  // 2. one wrong hash: exactly one mismatch, naming the file and the hash
  const wh = await checkRelease({ root: variant('wrong-hash', 'ar/power-bi-mcp/index.html', SHA, WRONG), version: '1.2.3' });
  chk(wh.mismatches.length === 1 && wh.mismatches[0].startsWith('ar/power-bi-mcp/index.html: SHA-256 ' + WRONG), () => `R3. one wrong hash gives one mismatch, that file and that hash: ${show(wh)}`);

  // 3. the release-day lines not flipped yet: one mismatch each
  const un = await checkRelease({ root: variant('unreleased', 'mcp/CHANGELOG.md', '## [1.2.3]: 2026-11-02 (made up)', '## [Unreleased]: 1.2.3'), version: '1.2.3' });
  chk(un.mismatches.length === 1 && /still "## \[Unreleased\]: 1\.2\.3"/.test(un.mismatches[0]), () => `R4. a CHANGELOG still "[Unreleased]" gives one mismatch: ${show(un)}`);
  const hid = await checkRelease({ root: variant('hidden', 'power-bi-mcp/index.html', '<section id="new-123">', '<section id="new-123" hidden>'), version: '1.2.3' });
  chk(hid.mismatches.length === 1 && /power-bi-mcp\/index\.html: the "What's new in 1\.2\.3" section is hidden/.test(hid.mismatches[0]), () => `R5. a hidden "What's new" gives one mismatch: ${show(hid)}`);
  const ph = await checkRelease({ root: variant('placeholder', 'assets/js/translations/beta-page.js', '"صدر في 2 نوفمبر 2026."', '"صدر في [يوم الإصدار]."'), version: '1.2.3' });
  chk(ph.mismatches.length === 1 && /^ar\/power-bi-mcp\/index\.html: the "What's new in 1\.2\.3" date is "صدر في \[يوم الإصدار\]\."/.test(ph.mismatches[0]), () => `R6. the Arabic date left as the placeholder gives one mismatch: ${show(ph)}`);
  const day = await checkRelease({ root: variant('day', 'mcp/CHANGELOG.md', '2026-11-02', '2026-11-03'), version: '1.2.3' });
  chk(day.mismatches.length === 2 && day.mismatches.every((x) => /the release day 2026-11-02, the CHANGELOG says 2026-11-03/.test(x)), () => `R7. a CHANGELOG day the pages don't say gives one mismatch a page: ${show(day)}`);
  const file = await checkRelease({ root: variant('file', 'mcp/README.md', '`dataarcus-1.2.3.mcpb`) from', '`dataarcus-1.2.2.mcpb`) from'), version: '1.2.3' });
  chk(file.mismatches.length === 1 && /mcp\/README\.md: file name dataarcus-1\.2\.2\.mcpb, want dataarcus-1\.2\.3\.mcpb/.test(file.mismatches[0]), () => `R8. one old file name gives one mismatch (the RELEASE comment is not a download line): ${show(file)}`);

  // 4. --live, the fixtures as the live answers
  const registry = fs.readFileSync(path.join(FIX, 'registry.json'), 'utf8');
  const answers = (reg) => async (url) => {
    const local = { [LIVE.page]: 'power-bi-mcp/index.html', [LIVE.pageAr]: 'ar/power-bi-mcp/index.html', [LIVE.translations]: 'assets/js/translations/beta-page.js' }[url];
    if (local) return fs.readFileSync(path.join(MATCH, local), 'utf8');
    if (url === LIVE.registry) return reg;
    throw new Error(`no fixture for ${url}`);
  };
  const lv = await checkRelease({ root: MATCH, version: '1.2.3', live: true, fetchText: answers(registry) });
  chk(lv.mismatches.length === 0 && lv.checks > m.checks, () => `R9. live, the fixtures as the answers: no mismatch, more checks than offline (${lv.checks} vs ${m.checks}): ${show(lv)}`);
  const lvSha = await checkRelease({ root: MATCH, version: '1.2.3', live: true, fetchText: answers(registry.replace(SHA, WRONG)) });
  chk(lvSha.mismatches.length === 1 && lvSha.mismatches[0].startsWith('the Registry: fileSha256 ' + WRONG), () => `R10. a Registry hash that differs gives one mismatch: ${show(lvSha)}`);
  const lvDay = await checkRelease({ root: MATCH, version: '1.2.3', live: true, fetchText: answers(registry.replace('2026-11-02T20:25', '2026-11-05T20:25')) });
  chk(lvDay.mismatches.length === 1 && /the Registry: published 2026-11-05/.test(lvDay.mismatches[0]), () => `R11. a Registry day that is not the release day gives one mismatch: ${show(lvDay)}`);
  const down = await checkRelease({ root: MATCH, version: '1.2.3', live: true, fetchText: async () => { throw new Error('offline'); } });
  chk(down.mismatches.length >= 3 && down.mismatches.every((x) => /could not (?:fetch|read).*offline/.test(x)), () => `R12. pages and Registry out of reach are named, never passed: ${show(down)}`);

  // 5. the days: Arabic-Indic digits, the UAE day of a late UTC time
  chk(dayOf('صدر في ٢ نوفمبر ٢٠٢٦.') === '2026-11-02' && dayOf('Released on 21 October 2026.') === '2026-10-21' && dayOf('Released on [release day].') === null,
    'R13. dayOf reads an English and an Arabic day, and no day in the placeholder');
  chk(registryDays('2026-10-21T20:25:31Z').join() === '2026-10-21,2026-10-22', 'R14. a Registry time counts as its UTC day and its UAE day');

  // 6. the command: its result line, and exit 1 on a mismatch
  const ok = spawnSync(process.execPath, [SCRIPT, '--version', '1.2.3', '--root', MATCH], { encoding: 'utf8' });
  chk(ok.status === 0 && /^PASS {2}check-release {2}\d+ checks/m.test(ok.stdout), () => `R15. the command on the matching set: exit 0 and its PASS line: ${ok.status} ${ok.stdout}${ok.stderr}`);
  const bad = spawnSync(process.execPath, [SCRIPT, '--version', '1.2.3', '--root', path.join(tmp, 'wrong-hash')], { encoding: 'utf8' });
  chk(bad.status === 1 && /^ {2}- ar\/power-bi-mcp\/index\.html: SHA-256/m.test(bad.stdout) && /^FAIL {2}check-release {2}1 of \d+ checks/m.test(bad.stdout), () => `R16. the command prints the mismatch and its FAIL line, exit 1: ${bad.status} ${bad.stdout}`);
  const none = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' });
  chk(none.status === 2 && /--version/.test(none.stderr), 'R17. without --version the command says how to call it');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL  release-check  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  release-check  ${checks} checks`);
