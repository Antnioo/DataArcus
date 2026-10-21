// The staged server (npm run stage): everything the server loads is inside server/, nothing it doesn't need, and it
// starts and lists its tools from there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { importGraph, relativeImports } from '../scripts/stage.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '..'), REPO = path.resolve(EXT, '..'), STAGED = path.join(EXT, 'server');
const staged = () => assert.ok(fs.existsSync(path.join(STAGED, 'mcp', 'server.mjs')), 'run `npm run stage` first: server/ is missing');

test('relativeImports finds every form the server and engines use', () => {
  const src = `import a from './a.mjs'; import { b } from "../b.mjs"; const c = require('./c.js'); const d = require("./d.js");
    const e = createRequire(import.meta.url)('../../assets/js/e.js'); fs.readFileSync(new URL('../../assets/data/f.json', import.meta.url));
    await import('./g.mjs'); require('node:fs'); import x from 'zod';`;
  assert.deepEqual(relativeImports(src).sort(), ['../../assets/data/f.json', '../../assets/js/e.js', '../b.mjs', './a.mjs', './c.js', './d.js', './g.mjs']);
});

test('the import graph reaches the engines the server loads, and no website-only file', () => {
  const g = importGraph(REPO).map((f) => f.split(path.sep).join('/'));
  for (const f of ['mcp/server.mjs', 'mcp/lib/plans.mjs', 'mcp/lib/approval-window.mjs', 'assets/js/model-health-engine.js', 'assets/js/pbip-export.js', 'assets/js/field-meaning.js', 'assets/data/arabic-report-words.json'])
    assert.ok(g.includes(f), `${f} in the graph`);
  assert.ok(!g.some((f) => /\.min\.js$|^assets\/(css|img|images)\//.test(f)), 'no minified or website-only file');
  assert.ok(!g.some((f) => /^mcp\/(test|skills|fixtures|work|research|plans)/.test(f)), 'no test or doc file');
});

test('every relative import in the staged server resolves inside server/', () => {
  staged();
  const missing = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); continue; }
    if (!/\.(mjs|js)$/.test(e.name)) continue;
    for (const r of relativeImports(fs.readFileSync(p, 'utf8'))) {
      const t = path.resolve(path.dirname(p), r);
      if (!t.startsWith(STAGED + path.sep) || !fs.existsSync(t)) missing.push(`${path.relative(STAGED, p)} -> ${r}`);
    }
  } };
  walk(STAGED);
  assert.deepEqual(missing, []);
});

test('the staged server has its production packages only', () => {
  staged();
  const nm = path.join(STAGED, 'mcp', 'node_modules');
  for (const p of ['@modelcontextprotocol/sdk', 'zod', 'ajv', '@microsoft/powerbi-report-authoring-cli']) assert.ok(fs.existsSync(path.join(nm, p)), `${p} staged`);
  assert.ok(!fs.existsSync(path.join(nm, 'pngjs')), 'no dev package (pngjs)');
  assert.ok(!fs.existsSync(path.join(STAGED, 'mcp', 'test.mjs')) && !fs.existsSync(path.join(STAGED, 'mcp', 'fixtures')), 'no tests or fixtures');
});

test('the staged server starts on its own and lists its 11 tools; no folder: every tool refuses and says why', async () => {
  staged();
  const child = spawn(process.execPath, [path.join(STAGED, 'mcp', 'server.mjs')], { cwd: path.join(STAGED, 'mcp'), env: { ...process.env, DATAARCUS_ROOT: '' }, stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = '', err = '';
  const replies = new Map();
  child.stderr.on('data', (d) => { err += d; });
  child.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(line); if (m.id != null) replies.set(m.id, m); } catch (e) { /* not JSON */ } } });
  const send = (m) => child.stdin.write(JSON.stringify(m) + '\n');
  const reply = async (id) => { for (let t = 0; t < 300 && !replies.has(id); t++) await new Promise((r) => setTimeout(r, 100)); return replies.get(id); };
  try {
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'vscode-test', version: '0' } } });
    assert.ok(await reply(1), 'initialize answered: ' + err.slice(0, 300));
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    const tools = (await reply(2)).result.tools.map((t) => t.name).sort();
    assert.equal(tools.length, 11, tools.join(', '));
    send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'read_model', arguments: { path: 'x' } } });
    const r = await reply(3);
    assert.match(JSON.stringify(r), /No working folder is set/);
  } finally { child.kill(); }
});
