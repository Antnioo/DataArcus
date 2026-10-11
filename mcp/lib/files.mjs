// The MCP tools' file helper: where a tool may write a new file. (0.2.9, the audit's A2-8: freeFile moved here from the
// design adapter, which reads and writes no file.)
import fs from 'node:fs';
import path from 'node:path';
import { inside, nothingAt } from './model.mjs';

// A file inside the DataArcus folder that doesn't exist yet: name.ext, name-2.ext, name-3.ext... (a name held by
// anything, a link included, is skipped)
export function freeFile(folder, base, ext) {
  const dir = inside(folder || '.');
  fs.mkdirSync(dir, { recursive: true });
  for (let n = 1; ; n++) {
    const f = path.join(dir, base + (n > 1 ? '-' + n : '') + ext);
    if (nothingAt(f)) return f;
  }
}
