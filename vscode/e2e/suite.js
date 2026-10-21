// Runs inside a headless VS Code (scripts/e2e.mjs): the extension activates, registers its provider, and VS Code
// starts the server from the .vsix's layout and lists DataArcus's tools. Probe mode prints what VS Code offers.
'use strict';
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const out = [];
const log = (s) => { out.push(s); console.log('[e2e] ' + s); };

async function run() {
  const ext = vscode.extensions.getExtension('dataarcus.dataarcus-powerbi');
  if (!ext) throw new Error('the extension is not loaded');
  await ext.activate();
  log('activated: ' + ext.isActive);
  log('workspace: ' + (vscode.workspace.workspaceFolders || []).map((f) => f.uri.fsPath).join(', '));
  const cmds = (await vscode.commands.getCommands(true)).filter((c) => /mcp/i.test(c));
  log('mcp commands: ' + cmds.join(', '));
  let tools = [];
  for (let i = 0; i < 60; i++) {
    tools = vscode.lm.tools.filter((t) => /^mcp_dataarcus_/.test(t.name));
    if (tools.length >= 11) break;
    // (VS Code's own Start Server command, as MCP: List Servers > Start calls it: in a chat, VS Code starts the server
    // itself when the first message is sent; an extension's server is trusted by default, so no prompt comes first)
    if (i === 2) { try { await vscode.commands.executeCommand('workbench.mcp.startServer', '*', { autoTrustChanges: true, waitForLiveTools: true }); log('startServer called'); } catch (e) { log('startServer: ' + e.message); } }
    await new Promise((r) => setTimeout(r, 1000));
  }
  log('all lm tools: ' + vscode.lm.tools.map((t) => t.name).join(', '));
  log('dataarcus tools: ' + tools.map((t) => t.name).join(', '));
  let readModel = null;
  const rm = tools.find((t) => /read_model$/.test(t.name));
  if (rm) {
    try {
      const r = await Promise.race([vscode.lm.invokeTool(rm.name, { input: { path: 'twin-project/Twin Sales.SemanticModel' }, toolInvocationToken: undefined }),
        new Promise((_, no) => setTimeout(() => no(new Error('no answer in 60 s')), 60000))]);
      readModel = r.content.map((p) => p.value || '').join('').slice(0, 1500);
    } catch (e) { readModel = 'error: ' + e.message; }
    log('read_model: ' + readModel);
  }
  fs.writeFileSync(process.env.DA_E2E_OUT, JSON.stringify({ out, tools: tools.map((t) => t.name), readModel, all: vscode.lm.tools.map((t) => t.name) }, null, 1));
}
module.exports = { run };
