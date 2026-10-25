// node test-release-text.mjs
// The two texts the package build reads for its version (16 Oct 2026: a CHANGELOG heading without "[Unreleased]" passed
// CI here and then stopped the build). The rule is the build's own (dataarcus-engine packaging/build.mjs,
// versionSources): mcp/CHANGELOG.md has a "## [<version>]" section, or "## [Unreleased]" for a release candidate (a
// version it names is the release it leads to), and mcp/PRIVACY.md's header says "Checked against <version>". Change
// both places together.
import fs from 'node:fs';
import { serverSource } from './test-source.mjs';   // (0.3.1 S9: the server's code is server.mjs, tools/ and the lib/ modules it shared)
const read = (f) => fs.readFileSync(new URL(f, import.meta.url), 'utf8');
const problems = [];
let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

const privacy = (read('./PRIVACY.md').split('\n').slice(0, 8).join(' ').match(/Checked against (\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)/) || [])[1];
check(!!privacy, 'mcp/PRIVACY.md names no version in its header ("Checked against <version>")');
const heads = [...read('./CHANGELOG.md').matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);
const top = heads[0] || '';
check(/^\[(Unreleased|\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)\]/i.test(top), `mcp/CHANGELOG.md's newest section must start "## [Unreleased]" (a release candidate) or "## [<version>]", the package build needs it: "## ${top}"`);
const named = /^\[Unreleased\]/i.test(top) ? (top.match(/\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?/) || [])[0] : (top.match(/^\[([^\]]+)\]/) || [])[1];
check(!named || !privacy || named.replace(/-.*$/, '') === privacy.replace(/-.*$/, ''), `mcp/CHANGELOG.md's newest section names ${named}, mcp/PRIVACY.md is checked against ${privacy}`);
// the rule itself: the heading that stopped the build fails here, the fixed one passes
const rule = (h) => /^\[(Unreleased|\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)\]/i.test(h);
check(!rule("0.2.9: in main since 2026-10-16 (rc.21)") && rule('[Unreleased]: 0.2.9 (rc.21)') && rule('[0.2.9] - 2026-10-20'), 'the heading rule no longer tells a build-breaking heading from a good one');

// (0.3.0 R7, the full privacy re-read of 19 Oct) the claims a reader takes at their word, checked against what the code
// does: DataArcus reads model and report files (it never claims to read no data), every "never overwritten" names the
// one exception (DataArcus's own answers file), the answers file is not said to hold only hashes, and read_report's
// titles are said to be screened for instructions and length only (a short one is returned as typed)
const CLAIM_FILES = ['./PRIVACY.md', './README.md', '../README.md', './PRODUCT_SPEC.md', './skills/report-design/SKILL.md', './lib/agent-text.mjs',
  './lib/approval-window.mjs', '../power-bi-mcp/index.html', '../ar/power-bi-mcp/index.html', '../assets/js/translations/beta-page.js'];
const flatText = (f) => read(f).replace(/\s+/g, ' ');
for (const f of CLAIM_FILES) {
  const t = flatText(f);
  const reads = t.match(/[^.]{0,60}\b(?:never reads?|reads no) data\b[^.]{0,40}/i);
  check(!reads, `R7: ${f} says DataArcus reads no data ("${reads && reads[0].trim()}"): it reads the model's and report's files; say what it returns`);
  for (const m of t.matchAll(/never overwrites|never overwritten|nothing is overwritten|never writes over(?! an existing report)|never overwrite or delete|لا يكتب فوق/gi)) {
    const near = t.slice(m.index, m.index + 320);
    check(/answers file|ملف إجاباته/i.test(near), `R7: ${f}: "${t.slice(m.index, m.index + 80)}..." names no exception: DataArcus replaces its own answers file`);
  }
  check(!/only hashes|holds hashes and your answers/i.test(t), `R7: ${f} says the answers file holds only hashes: its answer, date and "user" are plain text`);
}
const priv = flatText('./PRIVACY.md'), srv = serverSource().replace(/\s+/g, ' ');
check(/in plain text your answer/.test(priv) && /not salted/.test(priv), 'R7: PRIVACY.md says which fields of the answers file are plain text, and that its hashes are not salted');
check(/screened for instructions and length only/.test(priv) && /returned as it is/.test(priv), 'R7: PRIVACY.md says read_report\'s titles are screened for instructions and length only, and a short one is returned as it is');
const rrDesc = (srv.match(/registerTool\('read_report', \{.*?description: '(.*?)' \+ REPORT_UNTRUSTED/) || [])[1] || '';
check(/screened for instructions and length only/.test(rrDesc) && /returned as typed/.test(rrDesc), 'R7: read_report\'s description says its titles are screened for instructions and length only and returned as typed');
check(!/##[^\n]*never overwritten/i.test(read('./PRIVACY.md')), 'R7: no PRIVACY.md heading says "never overwritten"');

if (problems.length) { console.log(`FAIL  release-text  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  release-text  ${checks} checks`);
