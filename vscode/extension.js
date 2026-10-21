// DataArcus for Power BI in VS Code: registers the bundled DataArcus MCP server with VS Code's MCP support, so the
// chat's agent mode can use its tools. No telemetry and no network connection of its own: it only tells VS Code how to
// start the server, which talks to VS Code over stdio. VS Code asks the person before it first starts the server.
'use strict';
const vscode = require('vscode');
const { serverDefinition } = require('./lib/definition.js');

const PROVIDER = 'dataarcus';

function activate(context) {
  const changed = new vscode.EventEmitter();
  context.subscriptions.push(changed,
    vscode.workspace.onDidChangeWorkspaceFolders(() => changed.fire()),
    vscode.workspace.onDidChangeConfiguration((e) => { if (e.affectsConfiguration('dataarcus')) changed.fire(); }),
    vscode.lm.registerMcpServerDefinitionProvider(PROVIDER, {
      onDidChangeMcpServerDefinitions: changed.event,
      provideMcpServerDefinitions() {
        const folders = (vscode.workspace.workspaceFolders || []).filter((f) => f.uri.scheme === 'file').map((f) => f.uri.fsPath);
        const scope = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
        const cfg = vscode.workspace.getConfiguration('dataarcus', scope);
        const d = serverDefinition({
          extensionPath: context.extensionPath,
          workspaceFolders: folders,
          settings: { workingFolder: cfg.get('workingFolder'), nodePath: cfg.get('nodePath') },
          execPath: process.execPath,
          version: context.extension.packageJSON.version,
        });
        const def = new vscode.McpStdioServerDefinition(d.label, d.command, d.args, d.env, d.version);
        def.cwd = vscode.Uri.file(d.cwd);
        return [def];
      },
    }));
}

function deactivate() {}

module.exports = { activate, deactivate };
