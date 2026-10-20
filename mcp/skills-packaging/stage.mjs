// node mcp/skills-packaging/stage.mjs <empty folder outside the repo> [--install]
// (K1, prototype) Writes an installable copy of the DataArcus marketplace in the layout of Microsoft's Skills for
// Fabric (github.com/microsoft/skills-for-fabric): this folder's manifests and routing skill, plus what the plugin
// carries from its one source each: the version (mcp/package.json), the report-design skill (mcp/skills), the server
// (mcp/'s code and schemas, and the shared engines in assets/ that it requires, found from its own require lines) and
// the licence. --install runs `npm ci --omit=dev` at the plugin's root (as Claude Code does on install), so it starts
// without the repo. Writes only
// into the folder given, which must be empty (or new) and outside the repository. The release build (private repo)
// is where this belongs once the owner decides to publish; nothing here is published.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MCP = path.dirname(HERE), REPO = path.dirname(MCP);
const PLUGIN = 'dataarcus';
const inside = (parent, p) => { const r = path.relative(parent, p); return r === '' || (!r.startsWith('..') && !path.isAbsolute(r)); };
const real = (p) => { try { return fs.realpathSync.native(p); } catch (e) { return path.resolve(p); } };

// the shared files mcp/ requires (server.mjs and lib/), and theirs in turn, as repo-relative paths
export function engineFiles() {
  const found = new Set(), queue = [];
  const scan = (file) => {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/(?:require\(|new URL\()\s*['"](\.{1,2}\/[A-Za-z0-9_./-]+)['"]/g)) {
      const to = path.resolve(path.dirname(file), m[1]);
      if (inside(path.join(REPO, 'assets'), to) && !found.has(to)) { found.add(to); if (/\.js$/.test(to)) queue.push(to); }
    }
  };
  for (const f of ['server.mjs', ...fs.readdirSync(path.join(MCP, 'lib')).map((x) => path.join('lib', x))]) scan(path.join(MCP, f));
  while (queue.length) scan(queue.shift());
  return [...found].map((f) => path.relative(REPO, f)).sort();
}

const copy = (from, to) => fs.cpSync(from, to, { recursive: true, errorOnExist: true, force: false });

export function stage(outDir, { install = false } = {}) {
  const out = path.resolve(String(outDir || ''));
  if (!outDir || inside(real(REPO), real(out)) || inside(REPO, out)) throw new Error(`stage writes only outside the repository: ${out}`);
  if (fs.existsSync(out) && fs.readdirSync(out).length) throw new Error(`stage writes only into an empty folder: ${out}`);
  fs.mkdirSync(out, { recursive: true });
  const version = JSON.parse(fs.readFileSync(path.join(MCP, 'package.json'), 'utf8')).version;

  for (const e of fs.readdirSync(HERE)) if (e !== 'stage.mjs') copy(path.join(HERE, e), path.join(out, e));
  const pdir = path.join(out, 'plugins', PLUGIN);
  copy(path.join(MCP, 'skills', 'report-design'), path.join(pdir, 'skills', 'report-design'));
  copy(path.join(REPO, 'LICENSE'), path.join(pdir, 'LICENSE'));
  // Claude Code installs a copied plugin's npm packages only from a package.json and lockfile at the plugin's root
  // (registry packages, no install scripts); the server finds that node_modules by walking up from server/mcp/
  for (const f of ['package.json', 'package-lock.json']) copy(path.join(MCP, f), path.join(pdir, f));

  const server = path.join(pdir, 'server');
  for (const f of ['server.mjs', 'package.json', 'lib', 'schemas']) copy(path.join(MCP, f), path.join(server, 'mcp', f));
  for (const f of engineFiles()) copy(path.join(REPO, f), path.join(server, f));
  // the engines are CommonJS: in the repo the root package.json (no "type") governs them; here the plugin root's
  // (mcp's, "type": "module") would, so the server folder gets its own boundary, as the repo root
  fs.writeFileSync(path.join(server, 'package.json'), JSON.stringify({ private: true, type: 'commonjs' }, null, 2) + '\n', { flag: 'wx' });

  // the one version, stamped into every manifest (the source manifests carry none)
  const stamp = (rel, fn) => { const f = path.join(out, rel); const j = JSON.parse(fs.readFileSync(f, 'utf8')); fn(j); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
  for (const rel of ['.claude-plugin/marketplace.json', '.github/plugin/marketplace.json']) {
    stamp(rel, (j) => { j.metadata = { ...(j.metadata || {}), version }; for (const p of j.plugins || []) if (p.name === PLUGIN) p.version = version; });
  }
  for (const rel of ['.claude-plugin/plugin.json', '.github/plugin/plugin.json']) stamp(path.join('plugins', PLUGIN, rel), (j) => { j.version = version; });

  if (install) execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--omit=dev', '--no-audit', '--no-fund'], { cwd: pdir, stdio: 'inherit', shell: process.platform === 'win32' });
  return { root: out, plugin: pdir, version };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), dir = args.find((a) => !a.startsWith('--'));
  if (!dir) { console.error('usage: node mcp/skills-packaging/stage.mjs <empty folder outside the repo> [--install]'); process.exit(2); }
  const r = stage(dir, { install: args.includes('--install') });
  console.log(`staged DataArcus ${r.version} at ${r.root} (plugin: ${r.plugin})`);
}
