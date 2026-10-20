// Stages the DataArcus MCP server into vscode/server/ for the .vsix, in the repo's own layout (server/mcp/server.mjs
// loads ../assets/js/..., so server/assets/ sits beside server/mcp/): the server, its lib/ and schemas/, its
// package.json and lock, and only the files of assets/ its import graph reaches; then `npm ci --omit=dev` there. Run
// from vscode/: `npm run stage`. The staged folder is not committed (vscode/.gitignore).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The relative paths a source file loads: import/export ... from, import(), require(), createRequire(...)(), and
 *  new URL(..., import.meta.url). Packages and node: modules are not relative and are left to npm. */
export function relativeImports(src) {
  const out = new Set();
  const forms = [/\bfrom\s*(['"])(\.{1,2}\/[^'"]+)\1/g, /\bimport\s*\(\s*(['"])(\.{1,2}\/[^'"]+)\1\s*\)/g, /\brequire\s*\(\s*(['"])(\.{1,2}\/[^'"]+)\1\s*\)/g,
    /\)\s*\(\s*(['"])(\.{1,2}\/[^'"]+)\1\s*\)/g, /\bnew\s+URL\s*\(\s*(['"])(\.{1,2}\/[^'"]+)\1\s*,\s*import\.meta\.url/g];
  for (const re of forms) for (const m of src.matchAll(re)) out.add(m[2]);
  return [...out];
}

/** Every file the server loads, as paths relative to the repo: server.mjs and all of mcp/lib/ (taken whole, as the
 *  .mcpb build does), then what they load, transitively. */
export function importGraph(repo) {
  const start = ['mcp/server.mjs', ...fs.readdirSync(path.join(repo, 'mcp', 'lib')).filter((f) => /\.m?js$/.test(f)).map((f) => `mcp/lib/${f}`)];
  const seen = new Set(), todo = start.map((f) => path.join(repo, f));
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f)) continue;
    if (!fs.existsSync(f)) throw new Error(`the server loads ${path.relative(repo, f)}, which does not exist`);
    seen.add(f);
    if (!/\.(mjs|js)$/.test(f)) continue;
    for (const r of relativeImports(fs.readFileSync(f, 'utf8'))) {
      const t = path.resolve(path.dirname(f), r);
      if (!t.startsWith(repo + path.sep)) throw new Error(`${path.relative(repo, f)} loads ${r}, outside the repo`);
      todo.push(t);
    }
  }
  return [...seen].map((f) => path.relative(repo, f)).sort();
}

function copy(from, to) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); }

export function stage({ repo = path.resolve(HERE, '..', '..'), out = path.resolve(HERE, '..', 'server'), install = true } = {}) {
  fs.rmSync(out, { recursive: true, force: true });
  const files = new Set(importGraph(repo));
  for (const f of ['mcp/package.json', 'mcp/package-lock.json']) files.add(f);
  const walk = (d) => fs.readdirSync(path.join(repo, d), { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : files.add(`${d}/${e.name}`)));
  walk('mcp/schemas');
  for (const f of files) copy(path.join(repo, f), path.join(out, f));
  if (install) {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execFileSync(npm, ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: path.join(out, 'mcp'), stdio: 'inherit', shell: process.platform === 'win32' });
  }
  return [...files].sort();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = stage();
  console.log(`staged ${files.length} files (plus the server's production packages) into vscode/server/`);
}
