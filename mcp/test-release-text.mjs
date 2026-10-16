// node test-release-text.mjs
// The two texts the package build reads for its version (16 Oct 2026: a CHANGELOG heading without "[Unreleased]" passed
// CI here and then stopped the build). The rule is the build's own (dataarcus-engine packaging/build.mjs,
// versionSources): mcp/CHANGELOG.md has a "## [<version>]" section, or "## [Unreleased]" for a release candidate (a
// version it names is the release it leads to), and mcp/PRIVACY.md's header says "Checked against <version>". Change
// both places together.
import fs from 'node:fs';
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

if (problems.length) { console.log(`FAIL  release-text  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  release-text  ${checks} checks`);
