// The tests' view of code that was split (0.3.1 S9): the tests that read the server's or the twin's source as text
// (a registerTool, a write call, an instruction, a claim, a copy that must not come back) read all of its files, so a
// check keeps finding what moved and still refuses what must not be anywhere in it.
//   serverSource()  mcp/server.mjs, then each tool's module in the order server.mjs registers them (tools/list's order),
//                   then the lib/ modules made of what server.mjs shared between its tools
//   twinSource()    mcp/lib/arabic-twin.mjs (what others import), then its steps in the order they run
// A file that is not there yet is left out (the lists hold the files the split makes).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');
const there = (f) => fs.existsSync(path.join(HERE, f));

// what server.mjs shared between its tools, moved to lib/ (in the order it stood in server.mjs)
export const SERVER_LIBS = ['lib/tool-limits.mjs', 'lib/tool-answer.mjs', 'lib/tool-inputs.mjs', 'lib/plan-keys.mjs', 'lib/fix-scripts.mjs', 'lib/hidden-names.mjs',
  'lib/report-fields.mjs', 'lib/report-inputs.mjs', 'lib/report-said.mjs', 'lib/report-run.mjs'];
// the tools' modules, in the order server.mjs imports (and registers) them
export const toolFiles = () => [...read('server.mjs').matchAll(/^import \{ register as \w+ \} from '\.\/(tools\/[a-z_]+\.mjs)';/gm)].map((m) => m[1]);
export const serverFiles = () => ['server.mjs'].concat(toolFiles(), SERVER_LIBS.filter(there));
export const serverSource = () => serverFiles().map(read).join('\n');

// the twin's steps (lib/arabic-twin.mjs re-exports what they export)
export const TWIN_STEPS = ['lib/twin-read.mjs', 'lib/twin-visuals.mjs', 'lib/twin-texts.mjs', 'lib/twin-model.mjs', 'lib/twin-copy.mjs', 'lib/twin-pages.mjs',
  'lib/twin-plan.mjs', 'lib/twin-preview.mjs', 'lib/twin-write.mjs'];
export const twinFiles = () => ['lib/arabic-twin.mjs'].concat(TWIN_STEPS.filter(there));
export const twinSource = () => twinFiles().map(read).join('\n');
