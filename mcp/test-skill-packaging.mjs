// node test-skill-packaging.mjs
// (K1, 20 Oct 2026) The prototype plugin in mcp/skills-packaging/: DataArcus in the layout of Microsoft's Skills for
// Fabric marketplace (github.com/microsoft/skills-for-fabric), installed next to its powerbi-authoring plugin. The
// manifests parse and agree, name only files that exist in the staged copy (stage.mjs writes it), start a server that
// lists the 11 tools, and claim nothing DataArcus may not claim. No network: the staged server is started from here.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'skills-packaging');
const problems = [];
let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
const finish = () => {
  if (problems.length) { console.log(`FAIL  skill-packaging  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
  console.log(`PASS  skill-packaging  ${checks} checks`);
  process.exit(0);
};
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };
const PLUGIN = 'dataarcus', MARKET = 'dataarcus';
const TOOLS = [...fs.readFileSync(path.join(HERE, 'server.mjs'), 'utf8').matchAll(/server\.registerTool\('([a-z_]+)'/g)].map((m) => m[1]).sort();

let stage;
try { ({ stage } = await import(new URL('./skills-packaging/stage.mjs', import.meta.url))); } catch (e) { stage = null; }
check(!!stage, 'mcp/skills-packaging/stage.mjs is missing or does not export stage()');
if (!stage) finish();

const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'da-skill-pkg-'));
let staged = null;
try { staged = stage(OUT); } catch (e) { problems.push('stage() failed: ' + e.message); }
if (!staged) { checks++; finish(); }
const ROOT = staged.root, PDIR = path.join(ROOT, 'plugins', PLUGIN);

// 1-4: the four manifests parse (Claude Code's and Copilot CLI's marketplace and plugin)
const files = {
  claudeMarket: path.join(ROOT, '.claude-plugin', 'marketplace.json'), githubMarket: path.join(ROOT, '.github', 'plugin', 'marketplace.json'),
  claudePlugin: path.join(PDIR, '.claude-plugin', 'plugin.json'), githubPlugin: path.join(PDIR, '.github', 'plugin', 'plugin.json'),
};
const m = {};
for (const [k, f] of Object.entries(files)) { m[k] = readJson(f); check(!!m[k], `${path.relative(ROOT, f)} is missing or not JSON`); }
const cm = m.claudeMarket || {}, gm = m.githubMarket || {}, cp = m.claudePlugin || {}, gp = m.githubPlugin || {};
const entryOf = (mk) => (mk.plugins || []).find((p) => p && p.name === PLUGIN) || {};

// 5: the names agree
check(cm.name === MARKET && gm.name === MARKET && cp.name === PLUGIN && gp.name === PLUGIN && entryOf(cm).name === PLUGIN && entryOf(gm).name === PLUGIN,
  `marketplace "${MARKET}" and plugin "${PLUGIN}" are not named the same in all four manifests`);

// 6: one version, mcp/package.json's, stamped into every staged manifest (the source manifests carry none)
const VERSION = readJson(path.join(HERE, 'package.json')).version;
const src = (rel) => readJson(path.join(SRC, rel)) || {};
const srcVersions = [src('.claude-plugin/marketplace.json').metadata?.version, src('plugins/dataarcus/.claude-plugin/plugin.json').version, src('plugins/dataarcus/.github/plugin/plugin.json').version];
check([cp.version, gp.version, entryOf(cm).version, entryOf(gm).version, cm.metadata?.version, gm.metadata?.version].every((v) => v === VERSION) && srcVersions.every((v) => v === undefined),
  `the staged manifests must all carry mcp/package.json's version ${VERSION}, and the source manifests none (one place for every version)`);

// 7-10: every path a manifest names exists (and stays inside its root)
const pathsOf = (o) => [].concat(o.skills || [], o.agents || [], typeof o.commands === 'string' || Array.isArray(o.commands) ? o.commands : []);
const allNamed = [];
for (const [k, man] of [['claudePlugin', cp], ['githubPlugin', gp]]) {
  const named = pathsOf(man); allNamed.push(...named);
  const missing = named.filter((p) => !fs.existsSync(path.join(PDIR, p)));
  check(named.length > 0 && !missing.length, `${k}: names ${named.length} paths; missing in the staged plugin: ${missing.join(', ') || '(none named)'}`);
}
for (const [k, mk] of [['claudeMarket', cm], ['githubMarket', gm]]) {
  const e = entryOf(mk), named = [e.source, ...pathsOf(e).map((p) => path.posix.join(e.source || '.', p))].filter(Boolean); allNamed.push(...named);
  const missing = named.filter((p) => !fs.existsSync(path.join(ROOT, p)));
  check(typeof e.source === 'string' && !missing.length, `${k}: the entry's paths missing in the staged marketplace: ${missing.join(', ') || '(no source)'}`);
}

// 11-12: the server each plugin manifest starts is in the staged plugin
const serverOf = (man, rootVar) => {
  const s = (man.mcpServers || {})[PLUGIN] || {};
  const file = (s.args || []).find((a) => /server\.mjs$/.test(a)) || '';
  return { s, file, rel: file.startsWith(rootVar + '/') ? file.slice(rootVar.length + 1) : null };
};
const cs = serverOf(cp, '${CLAUDE_PLUGIN_ROOT}'), gs = serverOf(gp, '${PLUGIN_ROOT}');
check(cs.s.command === 'node' && cs.rel && fs.existsSync(path.join(PDIR, cs.rel)), `Claude Code's manifest must start node \${CLAUDE_PLUGIN_ROOT}/<server.mjs in the plugin>: ${JSON.stringify(cs.s)}`);
check(gs.s.command === 'node' && gs.rel && fs.existsSync(path.join(PDIR, gs.rel)), `Copilot CLI's manifest must start node \${PLUGIN_ROOT}/<server.mjs in the plugin>: ${JSON.stringify(gs.s)}`);

// 13: no path climbs out of its root
check(![...allNamed, cs.rel || '', gs.rel || ''].some((p) => p.split(/[\\/]/).includes('..') || path.isAbsolute(p)), 'a manifest path contains ".." or is absolute');

// 14-15: each skill's frontmatter (Agent Skills: name = folder, lowercase-hyphen, <= 64; description 1-1024)
const skillDirs = pathsOf(cp).map((p) => path.join(PDIR, p));
const skillsSeen = [];
for (const dir of skillDirs) {
  const t = fs.existsSync(path.join(dir, 'SKILL.md')) ? fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8') : '';
  const fm = (t.match(/^---\n([\s\S]*?)\n---\n/) || [])[1] || '';
  const name = (fm.match(/^name:\s*(.+)$/m) || [])[1]?.trim(), desc = (fm.match(/^description:\s*(.+)$/m) || [])[1]?.trim().replace(/^"|"$/g, '');
  skillsSeen.push({ dir, t, name });
  check(name === path.basename(dir) && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) && name.length <= 64 && desc && desc.length <= 1024,
    `${path.relative(PDIR, dir)}/SKILL.md: name "${name}" must be its folder's, lowercase-hyphen, <= 64; description 1-1024 characters (${desc ? desc.length : 0})`);
}

// 16: the routing skill names exactly the server's tools
const routing = skillsSeen.find((s) => s.name === PLUGIN) || { t: '' };
const named = [...new Set([...routing.t.matchAll(/`([a-z]+(?:_[a-z]+)+)`/g)].map((x) => x[1]))].filter((x) => TOOLS.includes(x) || /^(read|check|create|add|plan|approve|suggest|generate)_/.test(x)).sort();
check(TOOLS.length === 11 && JSON.stringify(named) === JSON.stringify(TOOLS), `the routing skill names ${named.join(', ')}; the server registers ${TOOLS.join(', ')}`);

// 17: the staged server carries every shared file mcp/ requires (the engines live in assets/, shared with the website)
const SERVER = path.join(PDIR, 'server');
const needs = new Set();
for (const f of ['server.mjs', ...fs.readdirSync(path.join(HERE, 'lib')).map((x) => 'lib/' + x)]) {
  for (const x of fs.readFileSync(path.join(HERE, f), 'utf8').matchAll(/['"](\.\.\/(?:\.\.\/)?assets\/[A-Za-z0-9_./-]+)['"]/g)) needs.add(path.posix.normalize(path.posix.join('mcp', path.posix.dirname(f), x[1])));
}
const lacking = [...needs].filter((p) => !fs.existsSync(path.join(SERVER, p)));
check(needs.size > 0 && !lacking.length && fs.existsSync(path.join(SERVER, 'mcp', 'schemas')), `the staged server lacks ${lacking.join(', ') || 'mcp/schemas'}`);

// 18: started exactly as Claude Code's manifest says, with the packages where Claude Code installs them (the plugin's
// root: its package.json and lockfile; here the repo's installed ones), it lists the same 11 tools
let listed = [];
if (cs.rel) {
  const nm = path.join(PDIR, 'node_modules');
  if (!fs.existsSync(nm)) fs.symlinkSync(path.join(HERE, 'node_modules'), nm, 'junction');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'da-skill-root-'));
  const sub = (v) => String(v).replaceAll('${CLAUDE_PLUGIN_ROOT}', PDIR).replace(/\$\{user_config\.[a-z_]+\}/g, root);
  const env = Object.fromEntries(Object.entries(cs.s.env || {}).map(([k, v]) => [k, sub(v)]));
  const c = new Client({ name: 'skill-packaging-test', version: '1' });
  try {
    await c.connect(new StdioClientTransport({ command: process.execPath, args: (cs.s.args || []).map(sub), env: { PATH: process.env.PATH, ...env }, stderr: 'ignore' }));
    listed = (await c.listTools()).tools.map((t) => t.name).sort();
  } catch (e) { problems.push('the staged server did not start: ' + e.message); } finally { try { await c.close(); } catch (e) { /* closed */ } }
  check(env.DATAARCUS_ROOT === root, 'Claude Code\'s manifest must pass the working folder the user chooses as DATAARCUS_ROOT');
} else checks++;
check(JSON.stringify(listed) === JSON.stringify(TOOLS), `the staged server lists ${listed.join(', ') || 'nothing'}`);

// 19: never "official", "first" or "only"; no Microsoft or Anthropic name in what we name
const claimText = [cm, gm, cp, gp].map((x) => JSON.stringify(x)).join(' ') + ' ' + skillsSeen.map((s) => s.t).join(' ');
const claims = claimText.match(/[^.]{0,40}\b(official(?:ly)?|the first|first ever|the only|only tool)\b[^.]{0,40}/gi) || [];
const ourNames = [cm.name, gm.name, cp.name, gp.name, ...skillsSeen.map((s) => s.name), cp.displayName || ''].join(' ');
check(!claims.length && !/microsoft|anthropic|claude|fabric/i.test(ourNames), `claims or names DataArcus may not use: ${claims.map((x) => '"' + x.trim() + '"').join('; ') || ourNames}`);

// 20: Claude Code installs Microsoft's powerbi-authoring with it: the dependency, and the marketplace's allowlist for it
const dep = (entryOf(cm).dependencies || []).find((d) => d && d.name === 'powerbi-authoring' && d.marketplace === 'fabric-collection');
check(!!dep && (cm.allowCrossMarketplaceDependenciesOn || []).includes('fabric-collection'), 'the Claude Code marketplace entry must depend on powerbi-authoring@fabric-collection, and allow that marketplace');

// 21: the stage never writes inside the repository
let refused = false;
try { stage(path.join(HERE, 'skills-packaging', 'dist')); } catch (e) { refused = /outside the repository/.test(e.message); }
check(refused && !fs.existsSync(path.join(HERE, 'skills-packaging', 'dist')), 'stage() must refuse a folder inside the repository');

fs.rmSync(OUT, { recursive: true, force: true });
finish();
