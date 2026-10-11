#!/usr/bin/env node
// Refuses words that must never be in this repository (the owner's rule: no employer data anywhere).
// The words are NOT in the repository: they come from the DENY_TERMS secret (one per line or comma-separated),
// and a match is reported by its number only, never by the word, so the public CI log never shows it.
// Checks every tracked file's path and text, and the commit messages in DENY_RANGE (e.g. before..after of a push).
// Usage: DENY_TERMS="…" [DENY_RANGE=a..b] node scripts/deny-scan.mjs [repoDir]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MAX_BYTES = 5 * 1024 * 1024;
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

export function scanRepo(dir, terms, range) {
  const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const hits = [];
  for (const f of git('ls-files', '-z').split('\0').filter(Boolean)) {
    hits.push(...scanText(f, terms, f + ' (its path)').map((h) => ({ ...h, line: 0 })));
    const p = path.join(dir, f);
    let st; try { st = fs.lstatSync(p); } catch { continue; }
    if (!st.isFile() || st.size > MAX_BYTES) continue;
    const buf = fs.readFileSync(p);
    if (buf.subarray(0, 8000).includes(0)) continue; // binary
    hits.push(...scanText(buf.toString('utf8'), terms, f));
  }
  if (range && !/^0+\.\./.test(range)) {
    let log = '';
    try { log = git('log', '--format=%H%n%B%n--end--', range); } catch { log = ''; }
    for (const block of log.split('--end--\n')) {
      const [sha, ...msg] = block.trim().split('\n');
      if (sha) hits.push(...scanText(msg.join('\n'), terms, 'commit message ' + sha.slice(0, 7)));
    }
  }
  return hits;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const terms = termsOf(process.env.DENY_TERMS);
  if (!terms.length) {
    console.log('::warning::DENY_TERMS is not set (forks and pull requests from outside get no secrets): the scan was skipped.');
    process.exit(0);
  }
  const dir = path.resolve(process.argv[2] || '.');
  const hits = scanRepo(dir, terms, process.env.DENY_RANGE || '');
  for (const h of hits) {
    const loc = h.line ? `,line=${h.line}` : '';
    const file = h.where.startsWith('commit message') || h.where.endsWith('(its path)') ? '' : `file=${h.where}${loc}`;
    console.log(`::error ${file}::A word from the private deny list (number ${h.term}) is in ${h.where}${h.line ? ' line ' + h.line : ''}.`);
  }
  console.log(`${terms.length} words checked; ${hits.length} found.`);
  process.exit(hits.length ? 1 : 0);
}
