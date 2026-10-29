// The plain-words check of mcp/CHANGELOG.md's [Unreleased] section (scripts/changelog-words.mjs), on fixed texts:
// every internal code is caught, plain sentences that only look like one are not, and the section is found.
//   node scripts/test-changelog-words.mjs
import { internalCodes, unreleased } from './changelog-words.mjs';

const problems = []; let checks = 0;
const chk = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

// each one must be caught (the line, and which code)
const CODED = [
  ['- B-146: the aggregation guard.', 'B-146'], ['- Fixed AUD-039 (the screen).', 'AUD-039'], ['- T-7: no "fingerprint".', 'T-7'],
  ['- The red team\'s F-1 is closed.', 'F-1'], ['- J14 builds the exact report.', 'J14'], ['- R5 stores hashes only.', 'R5'],
  ['- Since rc.23 the window waits.', 'rc.23'], ['- Asked by the owner.', 'the owner'], ['- Proved on the laptop.', 'the laptop'],
  ['- As the reviewer asked.', 'the reviewer'], ['- See session_012VMDtY1uWpH2dHuskZcR2p.', 'session_012VMDtY1uWpH2dHuskZcR2p'],
  ['- Fired by trig_01ABCdef.', 'trig_01ABCdef'], ['- (R12, round 3) a fix.', 'R12'],
];
for (const [line, code] of CODED) {
  const got = internalCodes(line);
  chk(got.length === 1 && got[0].codes.includes(code), `caught: ${JSON.stringify(line)} -> ${JSON.stringify(got)} (expected ${code})`);
}
// plain words that only look like a code: never caught
const PLAIN = [
  '- Excel-style R1C1 references in a measure name are read as they are.', '- Works on Windows 11 and macOS 15.',
  '- A page named "Q4 2026" keeps its name.', '- The theme\'s font sizes stay within 8-60.', '- An owner\'s name in a model is screened.',
  '- Reports open in Power BI Desktop 2.159.883.0 or later.', '- The F-key shortcuts are left alone.', '- The table T has a date column.',
  '- The laptop-friendly page size (1280 x 720).', '- RTL pages mirror; R² of a trend line is not shown.',
];
for (const line of PLAIN) chk(!internalCodes(line).length, `not caught: ${JSON.stringify(line)} -> ${JSON.stringify(internalCodes(line))}`);
// the section: only [Unreleased], up to the next version, never the versions below it
const md = '# Changelog\n\n## [Unreleased]\n- One plain line.\n- B-1 coded.\n\n## [0.3.0]: 2026-10-21\n- #48 B-143 history.\n';
const sec = unreleased(md);
chk(sec && sec.lines.length === 2 && internalCodes(sec.text).length === 1, `the [Unreleased] section only: ${JSON.stringify(sec)}`);
chk(unreleased('# Changelog\n\n## [0.3.0]\n- x\n') === null, 'no [Unreleased] section: null (the check then fails)');

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  test-changelog-words  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  test-changelog-words  ${checks} checks`);
