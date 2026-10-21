// The DataArcus MCP server as VS Code starts it: the server bundled in this extension (server/mcp/server.mjs), run by
// VS Code's own Node (its program with ELECTRON_RUN_AS_NODE=1, so nothing else has to be installed) or by the Node
// program the person names (dataarcus.nodePath), with the working folder as DATAARCUS_ROOT. Pure: no VS Code API here,
// so the tests can call it.
'use strict';
const path = require('path');

const SERVER = ['server', 'mcp', 'server.mjs'];
const LABEL = 'DataArcus for Power BI';

/** The working folder: the dataarcus.workingFolder setting (an absolute path, or one inside the first workspace
 *  folder), else the first workspace folder, else none (DATAARCUS_ROOT empty: the server then refuses every tool and
 *  says why; it never falls back to the folder it starts in). */
function workingFolder(workspaceFolders, setting) {
  const first = (workspaceFolders || [])[0];
  const s = String(setting || '').trim();
  if (s && path.isAbsolute(s)) return { root: path.normalize(s), rootFrom: 'setting' };
  if (s && first) return { root: path.join(first, s), rootFrom: 'setting' };
  if (!s && first) return { root: first, rootFrom: 'workspace' };
  return { root: '', rootFrom: 'none' };
}

function serverDefinition({ extensionPath, workspaceFolders, settings = {}, execPath, version }) {
  const { root, rootFrom } = workingFolder(workspaceFolders, settings.workingFolder);
  const node = String(settings.nodePath || '').trim();
  const env = { DATAARCUS_ROOT: root };
  if (!node) env.ELECTRON_RUN_AS_NODE = '1';
  return {
    label: LABEL,
    command: node || execPath,
    args: [path.join(extensionPath, ...SERVER)],
    env,
    cwd: path.join(extensionPath, 'server', 'mcp'),
    version,
    root,
    rootFrom,
  };
}

module.exports = { serverDefinition, workingFolder, SERVER, LABEL };
