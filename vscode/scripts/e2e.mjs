// A headless VS Code with this extension (not part of `npm test`: it downloads VS Code). Linux: run under xvfb-run.
// Writes what it saw to the file DA_E2E_OUT names (default: e2e-result.json in the system's temp folder).
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { runTests } from '@vscode/test-electron';

const EXT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// DA_E2E_EXT: run another copy of the extension (the .vsix unpacked: its extension/ folder) instead of this folder
const RUN = process.env.DA_E2E_EXT ? path.resolve(process.env.DA_E2E_EXT) : EXT;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'da-vscode-'));
const ws = path.join(tmp, 'work'), user = path.join(tmp, 'user');
fs.mkdirSync(ws, { recursive: true });
fs.cpSync(path.join(EXT, '..', 'mcp', 'fixtures', 'twin-project'), path.join(ws, 'twin-project'), { recursive: true });   // (a made-up model, the repo's fixture)
fs.mkdirSync(path.join(user, 'User'), { recursive: true });
fs.writeFileSync(path.join(user, 'User', 'settings.json'), JSON.stringify({ 'chat.mcp.autostart': 'newAndOutdated', 'security.workspace.trust.enabled': false, ...JSON.parse(process.env.DA_E2E_SETTINGS || '{}') }));
process.env.DA_E2E_OUT = process.env.DA_E2E_OUT || path.join(tmp, 'e2e-result.json');
await runTests({ version: process.env.DA_VSCODE_VERSION || 'stable', extensionDevelopmentPath: RUN, extensionTestsPath: path.join(EXT, 'e2e', 'suite.js'),
  launchArgs: [ws, '--disable-extensions', '--disable-workspace-trust', `--user-data-dir=${user}`] });
console.log(fs.readFileSync(process.env.DA_E2E_OUT, 'utf8'));
