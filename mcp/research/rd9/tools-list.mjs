// RD9 scratch: the tools as the server lists them (names, input keys, description length). Checks nothing.
import '../../test-env.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { serverClient } from '../../test-0.2.9.mjs';
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'rd9-')));
const s = await serverClient(ROOT, {});
const tools = (await s.c.listTools()).tools;
for (const t of tools) console.log(t.name, JSON.stringify(t).length, 'desc', t.description.length, 'in:', Object.keys(t.inputSchema.properties || {}).join(','), 'out:', !!t.outputSchema);
await s.close(); fs.rmSync(ROOT, { recursive: true, force: true });
