// The tests' environment (A-01): every server a test starts opens its approval window with the tests' own browser
// (test-browser.mjs), which clicks Approve unless a test says otherwise. Imported first by each test that starts a server.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
if (!process.env.DATAARCUS_BROWSER) process.env.DATAARCUS_BROWSER = JSON.stringify([process.execPath, path.join(path.dirname(fileURLToPath(import.meta.url)), 'test-browser.mjs')]);
