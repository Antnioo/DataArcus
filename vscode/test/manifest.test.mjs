// The manifest: DataArcus is an MCP server definition provider, activated only by VS Code's MCP support (never on "*"
// or at start-up), with no telemetry, off in untrusted and virtual workspaces.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('declares the DataArcus MCP server definition provider', () => {
  const list = pkg.contributes && pkg.contributes.mcpServerDefinitionProviders;
  assert.ok(Array.isArray(list) && list.length === 1, 'one mcpServerDefinitionProviders entry');
  assert.equal(list[0].id, 'dataarcus');
  assert.match(list[0].label, /DataArcus/);
});

test('needs the first VS Code with the stable MCP provider API (1.101)', () => {
  const m = /^\^(\d+)\.(\d+)\.\d+$/.exec(pkg.engines && pkg.engines.vscode || '');
  assert.ok(m, 'engines.vscode is ^x.y.z');
  assert.ok(+m[1] > 1 || +m[2] >= 101, `engines.vscode ${pkg.engines.vscode} is 1.101 or later`);
});

test('no activation event of its own: VS Code derives onMcpCollection:dataarcus from the contribution', () => {
  // (never "*" or onStartupFinished; vsce needs the property when there is a "main", so it is an empty list)
  assert.deepEqual(pkg.activationEvents, []);
});

test('no telemetry: no telemetry package, no telemetry setting, no network package', () => {
  const deps = Object.keys(Object.assign({}, pkg.dependencies, pkg.devDependencies, pkg.optionalDependencies));
  assert.ok(!deps.some((d) => /telemetry|applicationinsights|analytics|sentry|posthog|mixpanel|segment/i.test(d)), `a telemetry package: ${deps.join(', ')}`);
  assert.deepEqual(Object.keys(pkg.dependencies || {}), [], 'no runtime dependencies of the extension itself');
  const props = Object.keys(((pkg.contributes || {}).configuration || {}).properties || {});
  assert.ok(!props.some((p) => /telemetry/i.test(p)), 'no telemetry setting');
  assert.ok(!/telemetry/i.test(JSON.stringify(pkg.contributes || {})), 'no telemetry anywhere in contributes');
});

test('the extension code opens no network connection and sends no telemetry', () => {
  for (const f of ['../extension.js', '../lib/definition.js']) {
    // (the code only: a comment that says "no telemetry" is not telemetry)
    const src = fs.readFileSync(new URL(f, import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/require\(['"](node:)?(https?|net|tls|dgram|dns|http2)['"]\)|\bfetch\(|XMLHttpRequest|WebSocket|telemetry|createTelemetryLogger/i.test(src), `${f} opens a connection or names telemetry`);
  }
});

test('off in untrusted and virtual workspaces; runs where the files are', () => {
  const c = pkg.capabilities || {};
  assert.equal(c.untrustedWorkspaces && c.untrustedWorkspaces.supported, false);
  assert.equal(c.virtualWorkspaces, false);
  assert.deepEqual(pkg.extensionKind, ['workspace']);
});

test('settings: the working folder and the Node program, both optional', () => {
  const props = pkg.contributes.configuration.properties;
  assert.equal(props['dataarcus.workingFolder'].type, 'string');
  assert.equal(props['dataarcus.workingFolder'].default, '');
  assert.equal(props['dataarcus.nodePath'].type, 'string');
  assert.equal(props['dataarcus.nodePath'].default, '');
  assert.equal(props['dataarcus.workingFolder'].scope, 'resource');
  assert.equal(props['dataarcus.nodePath'].scope, 'machine', 'a workspace cannot choose the program that runs');
});

test('Marketplace fields: publisher, licence file, repository, privacy link, never published from here', () => {
  assert.ok(pkg.publisher, 'publisher');
  assert.equal(pkg.license, 'SEE LICENSE IN LICENSE');
  assert.ok(fs.existsSync(new URL('../LICENSE', import.meta.url)), 'LICENSE beside package.json');
  assert.match(pkg.repository && pkg.repository.url || '', /github\.com\/Antnioo\/DataArcus/i);
  assert.ok(!pkg.scripts || !Object.values(pkg.scripts).some((s) => /vsce\s+publish|\bpublish\b/.test(s)), 'no publish script');
  const readme = fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /PRIVACY\.md/);
  assert.match(readme, /no telemetry/i);
});
