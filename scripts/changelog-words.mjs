// mcp/CHANGELOG.md's [Unreleased] section is read by users: plain words only (the owner, 22 Oct). The internal codes
// (job and finding codes, release-candidate numbers, who did what, session and trigger ids) stay in mcp/work/*.md and
// mcp/WORK.md. This names every line of the section that holds one; the versions below it are history and keep theirs.
// The engine's packaging test checks the published release notes with the same codes.
//   node scripts/changelog-words.mjs                 mcp/CHANGELOG.md
//   node scripts/changelog-words.mjs <file>          another changelog (the test's)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// [what, pattern]: a code is a whole word (R1C1, "F-key", "Windows 11", "laptop-friendly" are plain words)
export const CODES = [
  ['a job or finding code', /\b(B|AUD|T|F)-\d+\b(?!-)/g],
  ['a job code', /\b[JR]\d+\b(?![-\d])/g],
  ['a release-candidate number', /\brc\.\d+\b/gi],
  ['who did it', /\bthe (owner|laptop|reviewer)\b(?![-'’])/gi],
  ['a session id', /\bsession_[A-Za-z0-9]{6,}\b/g],
  ['a trigger id', /\btrig_[A-Za-z0-9]{6,}\b/g],
];
// every line that holds a code: [{ line, codes }]
export function internalCodes(text) {
  return String(text).split(/\r?\n/).map((line) => ({ line, codes: CODES.flatMap(([, re]) => line.match(re) || []) })).filter((x) => x.codes.length);
}
// the [Unreleased] section: its text and its non-empty lines, or null when there is none
export function unreleased(md) {
  const m = /^## \[Unreleased\][^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(String(md).replace(/\r\n/g, '\n'));
  return m ? { text: m[1], lines: m[1].split('\n').filter((l) => l.trim()) } : null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] || path.join(ROOT, 'mcp/CHANGELOG.md');
  const sec = unreleased(fs.readFileSync(file, 'utf8'));
  if (!sec) { console.log(`FAIL  changelog-words  no "## [Unreleased]" section in ${path.relative(ROOT, file)}`); process.exit(1); }
  const bad = internalCodes(sec.text);
  if (bad.length) { console.log(`FAIL  changelog-words  ${bad.length} of ${sec.lines.length} [Unreleased] lines hold an internal code (keep codes in mcp/work/*.md):\n` + bad.map((b) => `      - ${b.codes.join(', ')}: ${b.line.trim().slice(0, 120)}`).join('\n')); process.exit(1); }
  console.log(`PASS  changelog-words  ${sec.lines.length} checks (every [Unreleased] line in plain words)`);
}
