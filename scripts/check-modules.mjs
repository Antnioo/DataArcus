// mcp/docs/MODULES.md "## Every module" is the whole map of the modules (0.3.2 MD1; the owner D-1104-08: "our biggest
// asset"), and this keeps it true. The module files are every assets/js/*.js but the .min.js copies, every
// mcp/lib/*.mjs and every mcp/tools/*.mjs (scripts/modules-facts.mjs moduleFiles). Each table of the section sits under
// a "### " heading whose first line "In `<folder>/`." names its folder; a row is `file` | job | in -> out | used by |
// pure (a row whose first cell is bold is a group label inside a table). This checks:
//   - every module file has exactly one row (none: add one; two: keep one);
//   - every row's file exists in its table's folder (a file moved or removed: move or drop its row);
//   - every row has its five cells, and its pure cell says yes or no;
//   - every name in a "used by" cell (in backticks) is a module (its file name, unique, or its path), `server.mjs`, or
//     a page (its path from the repo's root).
//   --strict  also: every "used by" name really loads the file (modules-facts.mjs's evidence), and "pure" says what the
//             facts say. Not in CI (a split moves callers every day: D-1104-06); run it after a split, as the map's
//             own review.
//   node scripts/check-modules.mjs [--strict] [--root <dir>]   one result line: PASS  modules  <N> checks (or one FAIL line a miss)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, moduleFiles, facts } from './modules-facts.mjs';

export const SECTION = '## Every module';
export const FIX = 'add a row to MODULES.md ## Every module: file | job | in -> out | used by | pure';
const DOC = 'mcp/docs/MODULES.md';

const cells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

// the section's rows: [{ folder, file, cells, line }] and the problems of its shape
export function rowsOf(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => l.trim() === SECTION);
  if (start < 0) return { rows: [], problems: [`FAIL ${DOC} has no "${SECTION}" section: ${FIX}`] };
  const rows = [], problems = [];
  let folder = null, heading = null;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^## /.test(l)) break;
    if (/^### /.test(l)) { heading = l.replace(/^###\s+/, ''); folder = null; continue; }
    const f = /^In `([^`]+\/)`/.exec(l);
    if (f && heading && !folder) { folder = f[1].replace(/\/$/, ''); continue; }
    if (!/^\s*\|/.test(l) || /^\s*\|\s*-/.test(l) || /^\s*\|\s*file\s*\|/.test(l)) continue;
    const c = cells(l);
    if (/^\*\*/.test(c[0])) continue;   // a group label
    const name = /^`([^`]+)`$/.exec(c[0]);
    if (!name) { problems.push(`FAIL ${DOC}:${i + 1}: a row with no file (its first cell is not a \`file\`): ${FIX}`); continue; }
    if (!folder) { problems.push(`FAIL ${DOC}:${i + 1}: ${name[1]}: its table has no "In \`<folder>/\`." line under its heading`); continue; }
    rows.push({ folder, file: folder + '/' + name[1], name: name[1], cells: c, line: i + 1 });
  }
  return { rows, problems };
}

// a "used by" name to what it names: a module file, the server, or a page; null when nothing
export function resolveName(name, root, mods, byBase) {
  if (name === 'server.mjs' || name === 'mcp/server.mjs') return 'mcp/server.mjs';
  if (mods.has(name)) return name;
  for (const pre of ['mcp/', 'assets/js/']) if (mods.has(pre + name)) return pre + name;
  const same = byBase.get(name);
  if (same && same.length === 1) return same[0];
  if (same && same.length > 1) return { ambiguous: same };
  if (/\.html$/.test(name) && !name.includes('..') && fs.existsSync(path.join(root, name))) return name;
  return null;
}

export function checkModules(root = ROOT, { strict = false } = {}) {
  const docPath = path.join(root, DOC);
  if (!fs.existsSync(docPath)) return { checks: 0, problems: [`FAIL ${DOC} is not there`] };
  const { rows, problems } = rowsOf(fs.readFileSync(docPath, 'utf8'));
  const files = moduleFiles(root), mods = new Set(files);
  const byBase = new Map();
  for (const f of files) { const b = path.posix.basename(f); byBase.set(b, (byBase.get(b) || []).concat(f)); }
  const fact = strict ? new Map(facts(root).map((r) => [r.file, r])) : null;
  let checks = 0;
  const seen = new Map();
  for (const r of rows) seen.set(r.file, (seen.get(r.file) || []).concat(r.line));
  for (const f of files) {
    checks++;
    const at = seen.get(f) || [];
    if (!at.length) problems.push(`FAIL ${f}: no row in ${DOC} "${SECTION}": ${FIX}`);
    else if (at.length > 1) problems.push(`FAIL ${f}: ${at.length} rows (${DOC} lines ${at.join(', ')}): keep one`);
  }
  for (const r of rows) {
    checks++;
    if (!mods.has(r.file)) { problems.push(`FAIL ${DOC}:${r.line}: the row for ${r.file} names a file that is not there: move the row to its file's table, or drop it`); continue; }
    checks++;
    if (r.cells.length !== 5) { problems.push(`FAIL ${DOC}:${r.line}: ${r.name} has ${r.cells.length} cells, not 5: file | job | in -> out | used by | pure`); continue; }
    if (!/^(yes|no)\b/.test(r.cells[4])) problems.push(`FAIL ${DOC}:${r.line}: ${r.name}'s pure cell is "${r.cells[4]}": it says yes, or no and what it touches`);
    const f = fact && fact.get(r.file);
    if (f && /^yes/.test(r.cells[4]) !== f.pure) problems.push(`FAIL ${DOC}:${r.line}: ${r.name} is pure "${r.cells[4].split(':')[0]}", the code says ${f.pure ? 'yes' : 'no (' + f.touches.join(', ') + ')'} (node scripts/modules-facts.mjs)`);
    for (const m of r.cells[3].matchAll(/`([^`]+)`/g)) {
      checks++;
      const to = resolveName(m[1], root, mods, byBase);
      if (!to) { problems.push(`FAIL ${DOC}:${r.line}: ${r.name}'s "used by" names ${m[1]}, which is not a module, server.mjs or a page: name the caller's file`); continue; }
      if (to.ambiguous) { problems.push(`FAIL ${DOC}:${r.line}: ${r.name}'s "used by" name ${m[1]} is ${to.ambiguous.length} modules (${to.ambiguous.join(', ')}): name it by its path`); continue; }
      if (f && !f.usedBy.includes(to) && !f.pages.includes(to)) problems.push(`FAIL ${DOC}:${r.line}: ${r.name}'s "used by" names ${m[1]}, which does not load it (node scripts/modules-facts.mjs)`);
    }
  }
  return { checks, problems, files: files.length, rows: rows.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const strict = process.argv.includes('--strict');
  const at = process.argv.indexOf('--root');   // another repo's root (scripts/test-modules.mjs's made-up ones)
  const root = at > 0 ? path.resolve(process.argv[at + 1]) : ROOT;
  const { checks, problems, files, rows } = checkModules(root, { strict });
  if (problems.length) {
    for (const p of problems) console.log(p.startsWith('FAIL') ? p : 'FAIL ' + p);
    console.log(`FAIL  modules  ${problems.length} of ${checks} checks failed${strict ? ' (strict)' : ''}`);
    process.exit(1);
  }
  console.log(`PASS  modules  ${checks} checks (${files} module files, ${rows} rows${strict ? ', strict: callers and purity from the code' : ''})`);
}
