// What the .vsix would hold (`vsce ls`): the extension, its README, LICENSE, CHANGELOG and the staged server with its
// production packages; never tests, scripts, the research notes or the extension's own dev packages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VSCE = path.join(EXT, 'node_modules', '@vscode', 'vsce', 'vsce');

test('vsce ls lists only the intended files', () => {
  assert.ok(fs.existsSync(VSCE), 'run `npm ci` in vscode/ first: @vscode/vsce is missing');
  assert.ok(fs.existsSync(path.join(EXT, 'server', 'mcp', 'server.mjs')), 'run `npm run stage` first: server/ is missing');
  const files = execFileSync(process.execPath, [VSCE, 'ls'], { cwd: EXT, encoding: 'utf8', maxBuffer: 64 << 20 }).split(/\r?\n/).filter(Boolean).map((f) => f.split(path.sep).join('/'));
  for (const f of ['package.json', 'extension.js', 'lib/definition.js', 'README.md', 'LICENSE', 'CHANGELOG.md', 'server/mcp/server.mjs', 'server/mcp/package.json', 'server/mcp/lib/plans.mjs', 'server/assets/js/pbip-export.js', 'server/mcp/schemas/LICENSE'])
    assert.ok(files.includes(f), `${f} is packaged`);
  assert.ok(files.some((f) => f.startsWith('server/mcp/node_modules/@modelcontextprotocol/sdk/')), 'the server\'s SDK is packaged');
  const bad = files.filter((f) => /^(test|scripts)\/|^RESEARCH\.md$|^node_modules\/|\.vsix$|^\.vscode|(^|\/)\.git(\/|$)|^server\/mcp\/(test|fixtures|skills|work)/.test(f) || /^server\/mcp\/node_modules\/pngjs\//.test(f));
  assert.deepEqual(bad, []);
});
