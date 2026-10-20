// The server definition VS Code starts: the bundled server, the person's folder as DATAARCUS_ROOT.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';

const { serverDefinition, SERVER } = createRequire(import.meta.url)('../lib/definition.js');
const EXT = path.resolve('/x/ext');
const WS = path.resolve('/work/sales');
const base = { extensionPath: EXT, workspaceFolders: [WS], settings: {}, execPath: '/vscode/code', version: '0.0.1' };

test('points at the bundled server inside the extension', () => {
  const d = serverDefinition(base);
  assert.deepEqual(d.args, [path.join(EXT, ...SERVER)]);
  assert.deepEqual(SERVER, ['server', 'mcp', 'server.mjs']);
  assert.equal(d.cwd, path.join(EXT, 'server', 'mcp'));
  assert.equal(d.label, 'DataArcus for Power BI');
  assert.equal(d.version, '0.0.1');
});

test('DATAARCUS_ROOT is the first workspace folder', () => {
  const d = serverDefinition({ ...base, workspaceFolders: [WS, path.resolve('/work/other')] });
  assert.equal(d.env.DATAARCUS_ROOT, WS);
  assert.equal(d.rootFrom, 'workspace');
});

test('the setting wins; a relative setting is inside the first workspace folder', () => {
  assert.equal(serverDefinition({ ...base, settings: { workingFolder: path.resolve('/pbi') } }).env.DATAARCUS_ROOT, path.resolve('/pbi'));
  const d = serverDefinition({ ...base, settings: { workingFolder: 'projects' } });
  assert.equal(d.env.DATAARCUS_ROOT, path.join(WS, 'projects'));
  assert.equal(d.rootFrom, 'setting');
});

test('no folder open: DATAARCUS_ROOT is empty, so the server refuses every tool and says why', () => {
  const d = serverDefinition({ ...base, workspaceFolders: [] });
  assert.equal(d.env.DATAARCUS_ROOT, '');
  assert.equal(d.rootFrom, 'none');
  assert.equal(serverDefinition({ ...base, workspaceFolders: [], settings: { workingFolder: 'rel' } }).env.DATAARCUS_ROOT, '', 'a relative setting with no folder is not guessed');
});

test('runs on VS Code\'s own Node by default (no Node install needed)', () => {
  const d = serverDefinition(base);
  assert.equal(d.command, '/vscode/code');
  assert.equal(d.env.ELECTRON_RUN_AS_NODE, '1');
});

test('dataarcus.nodePath runs another Node, without the Electron switch', () => {
  const d = serverDefinition({ ...base, settings: { nodePath: '/usr/bin/node' } });
  assert.equal(d.command, '/usr/bin/node');
  assert.ok(!('ELECTRON_RUN_AS_NODE' in d.env));
});

test('only the two variables are set; nothing else is passed to the server', () => {
  assert.deepEqual(Object.keys(serverDefinition(base).env).sort(), ['DATAARCUS_ROOT', 'ELECTRON_RUN_AS_NODE']);
});
