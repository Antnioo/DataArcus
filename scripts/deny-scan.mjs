#!/usr/bin/env node
// Refuses words that must never be in this repository (the owner's rule: no employer data anywhere).
// The words are NOT in the repository: they come from the DENY_TERMS secret (one per line or comma-separated),
// and a match is reported by its number only, never by the word, so the public CI log never shows it.
// Checks every tracked file's path and text, and for the commits in DENY_RANGE (before..after of a push, base..head of
// a pull request) every commit message, every line a commit added and every path it touched, so a word added and
// removed again before CI runs is still found.
// Fails closed: no DENY_TERMS (a fork's pull request gets no secrets) fails the check, binary files are read for their
// text runs (UTF-8/ASCII and UTF-16), and a file too large to read fails the check instead of being skipped.
// Usage: DENY_TERMS="…" [DENY_RANGE=a..b] node scripts/deny-scan.mjs [repoDir]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MAX_BYTES = 64 * 1024 * 1024; // the largest tracked file is about 1 MB; above this the check fails
// lower case; keep letters (any script) and digits; everything else counts as nothing, so "Zeta Widgets",
// "zeta_widgets" and "ZetaWidgets" are the same word
export const squash = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

export function termsOf(raw) {
  return String(raw || '').split(/[\n,]/).map((t) => squash(t)).filter((t) => t.length >= 4);
}

// [{ where, line, term }]: term is the 1-based number of the matching word, never the word
export function scanText(text, terms, where) {
  const hits = [];
  String(text).split(/\r?\n/).forEach((l, i) => {
    const s = squash(l);
    if (!s) return;
    terms.forEach((t, k) => { if (s.includes(t)) hits.push({ where, line: i + 1, term: k + 1 }); });
  });
  return hits;
}

// the text of a file: as UTF-8, or, for a binary file (a NUL in its first 8,000 bytes), its runs of 6 or more
// printable characters, one per line (ASCII/UTF-8 runs and UTF-16LE runs, as Windows stores names), so a word inside
// an image, a .pbix or a font is still found
const RUN = /[\x20-\x7e\u00a0-\uffff]{6,}/g;
const isBinary = (buf) => buf.subarray(0, 8000).includes(0);
export function textOf(buf) {
  if (!isBinary(buf)) return buf.toString('utf8');
  const runs = (s) => (s.match(RUN) || []).join('\n');
  return [runs(buf.toString('latin1')), runs(buf.toString('utf16le')), runs(buf.subarray(1).toString('utf16le'))].join('\n');
}

// the git log arguments for a range: "a..b" as given; a first push (before = all zeros) reads what the branch adds to
// the default branch, or all of b's history when the default branch is not fetched
export function rangeArgs(git, range) {
  if (!range) return null;
  const m = /^0+\.\.(.+)$/.exec(range);
  if (!m) return [range];
  for (const base of ['origin/HEAD', 'origin/main']) {
    try { git('rev-parse', '--verify', '-q', base); return [m[1], '--not', base]; } catch { /* try the next */ }
  }
  return [m[1]];
}

export function scanRepo(dir, terms, range) {
  const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });
  const hits = [];
  const atZero = (h) => ({ ...h, line: 0 });
  for (const f of git('ls-files', '-z').split('\0').filter(Boolean)) {
    hits.push(...scanText(f, terms, f + ' (its path)').map(atZero));
    const p = path.join(dir, f);
    let st; try { st = fs.lstatSync(p); } catch { continue; }
    if (st.isSymbolicLink()) { hits.push(...scanText(fs.readlinkSync(p), terms, f + ' (the link\'s target)').map(atZero)); continue; }
    if (!st.isFile()) continue;
    if (st.size > MAX_BYTES) { hits.push({ where: f + ' (too large to scan: the check fails rather than skip it)', line: 0, term: 0 }); continue; }
    const buf = fs.readFileSync(p), found = scanText(textOf(buf), terms, f);
    hits.push(...(isBinary(buf) ? found.map((h) => ({ ...h, where: f + ' (its binary text)', line: 0 })) : found));
  }
  const args = rangeArgs(git, range);
  if (args) {
    let log = '';
    try { log = git('log', '--format=%H%n%B%n--end--', ...args); } catch { log = ''; }
    for (const block of log.split('--end--\n')) {
      const [sha, ...msg] = block.trim().split('\n');
      if (sha) hits.push(...scanText(msg.join('\n'), terms, 'commit message ' + sha.slice(0, 7)));
    }
    let patch = '';
    try { patch = git('log', '-p', '-U0', '--no-color', '--no-renames', '--format=--commit %H', ...args); } catch { patch = ''; }
    let sha = '', file = '';
    for (const l of patch.split('\n')) {
      if (l.startsWith('--commit ')) { sha = l.slice(9, 16); continue; }
      if (l.startsWith('+++ ')) {
        file = l.replace(/^\+\+\+ (b\/)?/, '');
        hits.push(...scanText(file, terms, `${file} (its path, commit ${sha})`).map(atZero));
        continue;
      }
      if (l.startsWith('+')) hits.push(...scanText(l.slice(1), terms, `${file} (a line added in commit ${sha})`).map(atZero));
    }
  }
  return hits;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const terms = termsOf(process.env.DENY_TERMS);
  if (!terms.length) {
    console.log('::error::DENY_TERMS is not set (a fork\'s pull request gets no secrets), so the deny-list scan could not run. It fails rather than pass unchecked: the owner reviews such a change by hand or reruns it from a branch of this repository.');
    process.exit(1);
  }
  const dir = path.resolve(process.argv[2] || '.');
  const hits = scanRepo(dir, terms, process.env.DENY_RANGE || '');
  for (const h of hits) {
    if (!h.term) { console.log(`::error::${h.where}.`); continue; }
    const plainFile = !h.where.includes(' (') && !h.where.startsWith('commit message');
    const file = plainFile ? `file=${h.where}${h.line ? `,line=${h.line}` : ''}` : '';
    console.log(`::error ${file}::A word from the private deny list (number ${h.term}) is in ${h.where}${h.line ? ' line ' + h.line : ''}.`);
  }
  console.log(`${terms.length} words checked; ${hits.length} found.`);
  process.exit(hits.length ? 1 : 0);
}
