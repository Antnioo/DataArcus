// 0.3.1 FX5b (the owner's D-1028-06: bars drawn wide on a column of few values): the sample project's own counts. The
// sample is DataArcus's made-up data (lib/sample-project.mjs writes it), so the distinct count of each of its columns is
// known from its own definition, never by reading a person's model: the counts are given only where every table file of
// the model on disk is byte for byte the one sampleFiles writes for that folder (the rows are in them); a sample whose
// tables were edited gets none. (Files Desktop adds when it opens the project change no table: they are not compared.)
import fs from 'node:fs';
import path from 'node:path';
import { sampleFiles } from './sample-project.mjs';
import { ROOT } from './model.mjs';

// a row of the sample's #table: its values as written ("Dubai", 306, #date(2025, 1, 1)), split at the commas outside
// quotes and brackets
const valuesOf = (row) => { const out = []; let cur = '', q = false, d = 0;
  for (const ch of row) { if (ch === '"') q = !q; if (!q && ch === '(') d++; if (!q && ch === ')') d--; if (ch === ',' && !q && !d) { out.push(cur.trim()); cur = ''; } else cur += ch; }
  out.push(cur.trim()); return out; };
const nameOf = (h) => { const x = h.split('=')[0].trim(); return x.startsWith('#"') ? x.slice(2, -1).replace(/""/g, '"') : x; };
// { "Table[Column]": n } for every column a table's #table defines (the sample's own text, not a file read from disk)
export function countsOfSample(files) {
  const out = {};
  files.filter((f) => /\/definition\/tables\/[^/]+\.tmdl$/.test(f.path)).forEach((f) => {
    const s = String(f.data), t = (s.match(/^table (.+)$/m) || [])[1], h = s.match(/#table\(type table \[([^\]]*)\]/);
    if (!t || !h) return;
    const cols = h[1].split(',').map(nameOf), rows = [...s.matchAll(/^\s*\{(.*)\},?\s*$/gm)].map((m) => valuesOf(m[1]));
    cols.forEach((c, i) => { out[`${t.replace(/^'|'$/g, '')}[${c}]`] = new Set(rows.map((r) => r[i])).size; });
  });
  return out;
}
// the counts for a loaded model (lib/model.mjs loadModel's m) when it is DataArcus's own sample, else null
export function sampleCounts(m) {
  if (!m || !m.projectDir || !ROOT) return null;
  const folder = path.relative(ROOT, m.projectDir).split(path.sep).join('/');
  if (!folder || folder.startsWith('..')) return null;
  let files; try { files = sampleFiles(folder); } catch (e) { return null; }
  const model = files.filter((f) => /\.SemanticModel\/definition\/tables\/[^/]+\.tmdl$/.test(f.path));
  const same = model.length && model.every((f) => { try { return fs.readFileSync(path.join(ROOT, ...f.path.split('/')), 'utf8') === String(f.data); } catch (e) { return false; } });
  return same ? countsOfSample(model) : null;
}
