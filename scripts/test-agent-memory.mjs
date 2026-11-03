// Tests for check-agent-memory.mjs (A1, 0.3.1) on a made-up repo: the caps, the job summaries, the links and their
// sections, the task routes; then the repo itself passes.
//   node scripts/test-agent-memory.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { anchors, check, links, summaryOf, CAPS } from './check-agent-memory.mjs';

let n = 0;
const t = (name, fn) => { try { fn(); n++; } catch (e) { console.error(`FAIL  agent-memory-test  ${name}: ${e.message}`); process.exit(1); } };
const ROUTES = '## Task routes\n| Change | Open | Tests |\n|---|---|---|\n' + 'abcde'.split('').map((x) => `| (${x}) | \`lib/a.mjs: alpha\` | \`lib/t.mjs\` |`).join('\n') + '\n';
const SUM = '# X1\n\n## Summary\n- **Approval:** go\n- **Scope:** docs\n- **Base:** abc\n- **Expected checks:** 1\n- **Resume:** here\n\n## Plan\n';
function repo(over = {}) {
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-'));
  const files = Object.assign({ 'CLAUDE.md': '# R\n[a](mcp/docs/A.md#two-words)\n', 'mcp/CLAUDE.md': '# M\n', 'ARCHITECTURE.md': '# A\n\n' + ROUTES, 'mcp/WORK.md': '# W\n',
    'mcp/docs/A.md': '# A\n## Two words\n', 'lib/a.mjs': 'export const alpha = 1;\n', 'lib/t.mjs': '', 'mcp/work/X1.md': SUM, 'mcp/work/archive/old.md': 'no summary\n' }, over);
  for (const [f, s] of Object.entries(files)) { if (s == null) continue; fs.mkdirSync(path.dirname(path.join(D, f)), { recursive: true }); fs.writeFileSync(path.join(D, f), s); }
  return check(D).problems;
}

t('a repo within every rule passes; the archive is not read', () => assert.deepEqual(repo(), []));
t('a file over its line or character cap is named, and the total', () => {
  const p = repo({ 'mcp/WORK.md': 'x\n'.repeat(CAPS['mcp/WORK.md'].lines + 1), 'CLAUDE.md': 'y'.repeat(14801) });
  assert.ok(p.some((x) => /^mcp\/WORK\.md: 61 lines/.test(x)) && p.some((x) => /^CLAUDE\.md: 14801 characters/.test(x)) && p.some((x) => /startup pack is/.test(x)), p.join('; '));
});
t('characters are code points: Arabic counts one a letter', () => assert.deepEqual(repo({ 'mcp/WORK.md': 'ب'.repeat(3200) }), []));
t('a broken link and a missing section are named; external links and code spans are not checked', () => {
  const p = repo({ 'mcp/CLAUDE.md': '[x](nope.md) [y](docs/A.md#three) [z](https://e.com/q) `[w](gone.md)`\n' });
  assert.deepEqual(p, ['mcp/CLAUDE.md:1: the link nope.md names a file that is not there', 'mcp/CLAUDE.md:1: the link docs/A.md#three names a section that is not there']);
});
t('GitHub anchors: punctuation dropped, a repeat numbered', () => assert.deepEqual([...anchors("# The owner's rules (always)\n## Tests\n## Tests\n## `mcp/WORK.md`\n")], ['the-owners-rules-always', 'tests', 'tests-1', 'mcpworkmd']));
t('a new job note without its summary is named; a listed older note is not', () => {
  const p = repo({ 'mcp/work/Z9.md': '# Z9\n\n## Plan\n', 'mcp/work/S9.md': '# S9\n\n## Plan\n' });
  assert.deepEqual(p, ['mcp/work/Z9.md: a job note written from A1 on starts with "## Summary" (its first "##" heading)']);
});
t('a summary over 40 lines or without a named line is named', () => {
  const p = repo({ 'mcp/work/X1.md': SUM.replace('- **Resume:** here\n', '- r\n'.repeat(40)) });
  assert.ok(p.some((x) => /summary is 4\d lines/.test(x)) && p.some((x) => /no line "- \*\*Resume:\*\*/.test(x)), p.join('; '));
  assert.equal(summaryOf('# a\n\n## Plan\n## Summary\n'), null);
});
t('a route naming a missing file or symbol is named; fewer than 5 routes fail', () => {
  assert.deepEqual(repo({ 'lib/a.mjs': 'export const beta = 1;\n' }).length, 5);
  assert.ok(repo({ 'lib/t.mjs': null })[0].includes('lib/t.mjs is not there'));
  assert.ok(repo({ 'ARCHITECTURE.md': '# A\n\n## Task routes\n| C | O |\n|---|---|\n| (a) | `lib/a.mjs` |\n' })[0].includes('1 routes, 5 at least'));
});
t('links() skips fences', () => assert.deepEqual(links('```\n[a](b.md)\n```\n[c](d.md)\n').map((l) => l.target), ['d.md']));
t('the repo passes', () => assert.deepEqual(check().problems, []));
console.log(`PASS  agent-memory-test  ${n} checks`);
