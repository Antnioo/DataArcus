// Every analytics event the site sends, checked against GA4's rules on every push. No network: it reads the page
// scripts and every page's inline scripts. Found 2026-10-06 (R-003): `mh_analyze` sent `source: 'pbit'`, and GA4 reads
// an event parameter called `source` as the visit's traffic source, so each Health Check run re-labelled that visit
// as coming from "pbit" and hid where the visitor really came from.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

// Parameter names GA4 takes as the visit's campaign/traffic source (they overwrite attribution), and its reserved prefixes
const ATTRIBUTION = ['source', 'medium', 'campaign', 'term', 'content', 'campaign_id', 'gclid', 'dclid', 'srsltid'];
const RESERVED_PREFIX = /^(google_|ga_|firebase_|utm_|_)/;
const NAME = /^[A-Za-z][A-Za-z0-9_]*$/;   // GA4: letters, digits, underscores; starts with a letter
const MAX_NAME = 40, MAX_PARAMS = 25;

const files = execSync('git ls-files "*.js" "*.html"', { cwd: ROOT, encoding: 'utf8' }).trim().split('\n')
  .filter((f) => f && !f.endsWith('.min.js') && !/^(node_modules|mcp|scripts|content|\.claude)\//.test(f) && !f.startsWith('assets/js/vendor/'));

// The text between the call's "(" and its matching ")", strings skipped
const argsAt = (src, open) => {
  let depth = 0, q = null;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (q) { if (ch === '\\') i++; else if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') q = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch) && --depth === 0) return src.slice(open + 1, i);
  }
  return null;
};
// Split on commas at depth 0
const split = (s) => {
  const out = []; let depth = 0, q = null, start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === '\\') i++; else if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') q = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (ch === ',' && depth === 0) { out.push(s.slice(start, i).trim()); start = i + 1; }
  }
  out.push(s.slice(start).trim());
  return out.filter(Boolean);
};
const keyOf = (prop) => {
  if (prop.startsWith('...')) return null;
  if (prop.startsWith('[')) return null;                       // computed key: checked by hand (theme_chart_style)
  const m = prop.match(/^(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*(:|$)/);
  return m ? (m[1] || m[2] || m[3]) : null;
};

let calls = 0;
for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const re = /\b(trackOnce|dataArcusTrack|track)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    const before = src.slice(Math.max(0, m.index - 30), m.index);
    if (/(const|let|var|function|window\.)\s*$/.test(before) && !/window\.$/.test(before)) continue;   // a definition
    if (/typeof\s+window\.$/.test(before)) continue;
    const args = argsAt(src, m.index + m[0].length - 1);
    if (args === null || /^\s*(name|key)\s*,/.test(args)) continue;                                  // the helpers themselves
    let parts = split(args);
    if (m[1] === 'trackOnce') parts = parts.slice(1);             // trackOnce(key, name, params)
    const line = src.slice(0, m.index).split('\n').length;
    const where = `${f}:${line}`;
    const name = parts[0] || '';
    calls++;
    // Literal parts of the event name (names built as EX.ev + '_x' are checked on their literal suffix)
    const literal = name.match(/^'([^']*)'$/) || name.match(/^"([^"]*)"$/);
    if (literal) {
      ok(NAME.test(literal[1]), `${where}: event name "${literal[1]}" must be letters, digits and _ and start with a letter`);
      ok(literal[1].length <= MAX_NAME, `${where}: event name "${literal[1]}" is longer than ${MAX_NAME}`);
      ok(!RESERVED_PREFIX.test(literal[1]), `${where}: event name "${literal[1]}" uses a GA4 reserved prefix`);
    }
    const obj = parts[1];
    if (!obj || !obj.startsWith('{')) continue;
    const props = split(obj.slice(1, -1));
    ok(props.length <= MAX_PARAMS, `${where}: ${props.length} parameters (GA4 keeps ${MAX_PARAMS})`);
    for (const p of props) {
      const k = keyOf(p);
      if (!k) continue;
      ok(!ATTRIBUTION.includes(k), `${where}: parameter "${k}" is read by GA4 as the visit's traffic source; rename it (e.g. file_type)`);
      ok(!RESERVED_PREFIX.test(k), `${where}: parameter "${k}" uses a GA4 reserved prefix`);
      ok(NAME.test(k) && k.length <= MAX_NAME, `${where}: parameter "${k}" must be letters, digits and _ (max ${MAX_NAME})`);
    }
  }
}
ok(calls > 50, `only ${calls} tracking calls found: the scan is broken`);

if (fails.length) { console.error(`Analytics events: ${fails.length} problem(s)\n  ` + fails.join('\n  ')); process.exit(1); }
console.log(`Analytics events: ${calls} tracking calls follow GA4's naming rules.`);
