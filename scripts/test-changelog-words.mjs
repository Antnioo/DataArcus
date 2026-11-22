// The plain-words check of mcp/CHANGELOG.md's [Unreleased] section (scripts/changelog-words.mjs), on fixed texts:
// every internal code is caught, plain sentences that only look like one are not, and the section is found.
//   node scripts/test-changelog-words.mjs
import { internalCodes, unreleased, newest, section } from './changelog-words.mjs';

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

// (3 Nov, the 0.3.1 release) newest(): [Unreleased] while there is one, else the newest version (a released heading is
// still read by users: its codes are found)
chk(newest(md).lines.length === 2, 'newest: the [Unreleased] section first');
const rel = newest('# Changelog\n\n## [0.3.1]: 2026-11-03\n- One plain line.\n- B-1 coded.\n\n## [0.3.0]: 2026-10-21\n- #48 B-143.\n');
chk(rel && rel.lines.length === 2 && internalCodes(rel.text).length === 1, `newest: the newest version, not the older ones: ${JSON.stringify(rel)}`);
chk(newest('# Changelog\n\nnothing\n') === null, 'newest: no section at all: null');
chk(newest('# Changelog\n\n## [0.3.1]: 2026-11-03\n- Plain.\n\n## [Unreleased]: 0.2.9.1\n- B-1 old.\n').lines.length === 1, 'newest: an old [Unreleased] lower in the file is not the newest');

// (OV034) section(): one version by its own heading, released or "[Unreleased]: <version>"; the empty section of the next
// version on top never hides it
const open = '# Changelog\n\n## [Unreleased]: 0.3.4\n\n## [0.3.3]: 2026-11-17 (x)\n- Plain 3.\n- More 3.\n\n## [0.3.2]: 2026-11-09\n- Old.\n';
chk(newest(open).lines.length === 0, 'section: newest() of an opened version is its empty section (the fault the helper avoids)');
chk(section(open, '0.3.3') && section(open, '0.3.3').lines.length === 2, `section: 0.3.3 under an empty 0.3.4: ${JSON.stringify(section(open, '0.3.3'))}`);
chk(section(open, '0.3.4') && section(open, '0.3.4').lines.length === 0, 'section: "[Unreleased]: 0.3.4" is found, empty');
chk(section(open, '0.3.2').lines[0] === '- Old.', 'section: the last section of the file ends at the end of it');
chk(section(open, '0.3.5') === null && section(open, '0.3') === null, 'section: a version nothing names (or a prefix of one): null');
chk(section('## [Unreleased]: 0.3.10\n- ten\n\n## [0.3.1]\n- one\n', '0.3.1').lines[0] === '- one', 'section: 0.3.1 is not "[Unreleased]: 0.3.10"');
chk(section('## [0.3.3]\r\n- crlf\r\n', '0.3.3').lines.length === 1, 'section: CRLF files are read');

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  test-changelog-words  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  test-changelog-words  ${checks} checks`);
