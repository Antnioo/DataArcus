// node test-skill-packaging.mjs
// (K1, 0.3.1; first written 20 Oct for the prototype of draft #85) mcp/skills-packaging/ is a folder the owner copies
// as-is into a public marketplace repo: DataArcus as a Claude Code and Copilot CLI plugin next to Microsoft's
// powerbi-authoring plugin (github.com/microsoft/skills-for-fabric, marketplace fabric-collection). It carries no
// DataArcus code: Claude Code starts the released .mcpb from its URL; Copilot CLI gets the skills, the server added by
// hand (README). This test checks the folder holds only what that repo needs, the manifests agree, the routing skill
// names only what the server registers, and the folder claims nothing DataArcus may not claim. No network.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverSource } from './test-source.mjs';   // (0.3.1 S9: the server's code is server.mjs, tools/ and the lib/ modules it shared)

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'skills-packaging');
const problems = [];
let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };
const readText = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; } };
const PLUGIN = 'dataarcus', MARKET = 'dataarcus';
const PDIR = path.join(SRC, 'plugins', PLUGIN);
const SERVER = serverSource();
const TOOLS = [...SERVER.matchAll(/server\.registerTool\('([a-z_]+)'/g)].map((m) => m[1]).sort();

// 1: exactly the files the public repo needs (no code, no stage script, no image, nothing else)
const FILES = ['.claude-plugin/marketplace.json', '.github/plugin/marketplace.json', 'LICENSE', 'README.md',
  'plugins/dataarcus/.claude-plugin/plugin.json', 'plugins/dataarcus/.github/plugin/plugin.json',
  'plugins/dataarcus/skills/dataarcus/SKILL.md', 'plugins/dataarcus/skills/report-design/SKILL.md'].sort();
const walk = (dir, base = '') => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name), base + e.name + '/') : [base + e.name]);
const have = walk(SRC).sort();
check(JSON.stringify(have) === JSON.stringify(FILES), `mcp/skills-packaging/ must hold exactly ${FILES.join(', ')}; it holds ${have.join(', ') || 'nothing'}`);

// 2-5: the four manifests parse
const files = {
  claudeMarket: path.join(SRC, '.claude-plugin', 'marketplace.json'), githubMarket: path.join(SRC, '.github', 'plugin', 'marketplace.json'),
  claudePlugin: path.join(PDIR, '.claude-plugin', 'plugin.json'), githubPlugin: path.join(PDIR, '.github', 'plugin', 'plugin.json'),
};
const m = {};
for (const [k, f] of Object.entries(files)) { m[k] = readJson(f); check(!!m[k], `${path.relative(SRC, f)} is missing or not JSON`); }
const cm = m.claudeMarket || {}, gm = m.githubMarket || {}, cp = m.claudePlugin || {}, gp = m.githubPlugin || {};
const entryOf = (mk) => (mk.plugins || []).find((p) => p && p.name === PLUGIN) || {};

// 6: the names agree
check(cm.name === MARKET && gm.name === MARKET && cp.name === PLUGIN && gp.name === PLUGIN && entryOf(cm).name === PLUGIN && entryOf(gm).name === PLUGIN,
  `marketplace "${MARKET}" and plugin "${PLUGIN}" are not named the same in all four manifests`);

// 7: one version, Claude Code's plugin.json's: the bundle URL, both marketplace entries and Copilot's manifest say the
// same (so does every release file name in the README), and it is the newest released version (mcp/CHANGELOG.md's newest "## [x.y.z]") or the next one being built
const V = cp.version || '';
const URL_OF = (v) => `https://github.com/Antnioo/dataarcus-releases/releases/download/v${v}/dataarcus-${v}.mcpb`;
const released = ((readText(path.join(HERE, 'CHANGELOG.md')).match(/^## \[(\d+\.\d+\.\d+)\]/m) || [])[1]) || '';
const readmeVersions = [...readText(path.join(SRC, 'README.md')).matchAll(/dataarcus-(\d+\.\d+\.\d+)/g)].map((x) => x[1]);
const nextOf = (v) => { const [a, b, c] = v.split('.').map(Number); return [`${a}.${b}.${c + 1}`, `${a}.${b + 1}.0`, `${a + 1}.0.0`]; };
check(/^\d+\.\d+\.\d+$/.test(V) && [gp.version, entryOf(cm).version, entryOf(gm).version].every((v) => v === V) && readmeVersions.length > 0 && readmeVersions.every((v) => v === V) && released && [released, ...nextOf(released)].includes(V),
  `one version in the folder: plugin.json ${V}, Copilot ${gp.version}, marketplaces ${entryOf(cm).version}/${entryOf(gm).version}, README ${[...new Set(readmeVersions)].join('/')}; the newest release is ${released}`);

// 8: Claude Code starts the released .mcpb of that version, from its URL (the plugin carries no DataArcus code)
check(cp.mcpServers === URL_OF(V), `Claude Code's plugin.json mcpServers must be the release's bundle ${URL_OF(V)}: ${JSON.stringify(cp.mcpServers)}`);

// 9: Copilot CLI can't run a bundle and DataArcus has no npm package: its manifest starts no server and names the skills
check(gp.mcpServers === undefined && Array.isArray(gp.skills) && gp.skills.length === 2, 'Copilot CLI\'s plugin.json must name the two skills and start no server (the README adds it by hand)');

// 10-11: every path a plugin manifest names exists in the folder, none climbing out
const pathsOf = (o) => [].concat(o.skills || [], o.agents || []);
for (const [k, man] of [['claudePlugin', cp], ['githubPlugin', gp]]) {
  const named = pathsOf(man);
  const bad = named.filter((p) => !p.startsWith('./') || p.split(/[\\/]/).includes('..') || path.isAbsolute(p) || !fs.existsSync(path.join(PDIR, p)));
  check(named.length > 0 && !bad.length, `${k}: names ${named.length} paths; missing or outside the plugin: ${bad.join(', ') || '(none named)'}`);
}

// 12-13: each skill's frontmatter (Agent Skills: name = folder, lowercase-hyphen, <= 64; description 1-1024)
const skills = ['dataarcus', 'report-design'].map((n) => {
  const t = readText(path.join(PDIR, 'skills', n, 'SKILL.md'));
  const fm = (t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/) || [])[1] || '';
  const name = (fm.match(/^name:\s*(.+)$/m) || [])[1]?.trim(), desc = (fm.match(/^description:\s*(.+)$/m) || [])[1]?.trim().replace(/^"|"$/g, '');
  check(name === n && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) && name.length <= 64 && desc && desc.length <= 1024,
    `skills/${n}/SKILL.md: name "${name}" must be its folder's, lowercase-hyphen, <= 64; description 1-1024 characters (${desc ? desc.length : 0})`);
  return { n, t, name };
});

// 14: report-design is the copy of the one source, mcp/skills/report-design/SKILL.md
check(skills[1].t !== '' && skills[1].t === readText(path.join(HERE, 'skills', 'report-design', 'SKILL.md')),
  'plugins/dataarcus/skills/report-design/SKILL.md must be byte-identical to mcp/skills/report-design/SKILL.md (copy it again)');

// 15: the routing skill names every tool the server registers, and no other DataArcus-looking tool
const routing = skills[0].t;
const named = [...new Set([...routing.matchAll(/`([a-z]+(?:_[a-z]+)+)`/g)].map((x) => x[1]))].filter((x) => TOOLS.includes(x) || /^(read|check|create|add|plan|approve|suggest|generate)_/.test(x)).sort();
check(TOOLS.length >= 11 && JSON.stringify(named) === JSON.stringify(TOOLS), `the routing skill names ${named.join(', ')}; the server registers ${TOOLS.join(', ')}`);

// 16: every option it names is in the server's schemas, and each value it gives is one the schema takes
const OPTS = { lens: 'arabic', languages: 'en+ar', into: 'same', lang: 'ar', country: 'uae', tabsShown: 'ar' };
const missingOpt = Object.entries(OPTS).filter(([k, v]) => !new RegExp('`' + k + ': "' + v.replace('+', '\\+') + '"`').test(routing)
  || !new RegExp('\\b' + k + ': z\\.enum\\(\\[[^\\]]*\'' + v.replace('+', '\\+') + '\'').test(SERVER));
check(!missingOpt.length, `the routing skill and server.mjs must both have: ${missingOpt.map(([k, v]) => `${k}: "${v}"`).join(', ')}`);

// 17: Claude Code installs Microsoft's powerbi-authoring with it: the dependency, and the marketplace's allowlist for it
const dep = (entryOf(cm).dependencies || []).find((d) => d && d.name === 'powerbi-authoring' && d.marketplace === 'fabric-collection');
check(!!dep && (cm.allowCrossMarketplaceDependenciesOn || []).includes('fabric-collection') && !gm.allowCrossMarketplaceDependenciesOn,
  'the Claude Code marketplace entry must depend on powerbi-authoring@fabric-collection and allow that marketplace (Copilot has no dependencies)');

// 18: Microsoft's names exactly as their marketplace and Learn give them (read 25 Oct 2026, skills-for-fabric bc42aaf)
const readme = readText(path.join(SRC, 'README.md'));
const MS = ['powerbi-authoring@fabric-collection', 'microsoft/skills-for-fabric', 'powerbi-report-cli', 'Power BI Report skill', 'semantic-model-authoring', 'powerbi-modeling-mcp'];
const lackMs = MS.filter((n) => !readme.includes(n)).concat(['powerbi-report-cli', 'Power BI Report skill', 'powerbi-modeling-mcp'].filter((n) => !routing.includes(n)).map((n) => n + ' (skill)'));
check(!lackMs.length, `Microsoft's names missing: ${lackMs.join(', ')}`);

// 19: the claims rule, in everything we wrote (the report-design copy is checked where its source is: 0.3.0-claims)
const ours = [readme, routing, JSON.stringify([cm, gm, cp, gp])].join('\n').replace(/\s+/g, ' ');
const BANNED = /\bofficial(?:ly)?\b(?! (?:weekend|announcement|Ramadan|dates?))|\b(?:the|our|world'?s) first\b|\bfirst ever\b|\bthe only\b|\bonly (?:tool|plugin|MCP)\b|\bfree\b|\bpartner(?:ed|ship)?\b|\bcertified\b|\bendorsed\b|\bsponsored\b|\bAI[- ]powered\b|\bpart of (?:Skills for Fabric|fabric-collection)\b|الأول من نوعه|الوحيد|مجاني|شريك|معتمد من|مدعوم بالذكاء/i;
const claim = BANNED.exec(ours);
check(!claim, `a claim DataArcus may not make: "${claim ? ours.slice(Math.max(0, claim.index - 40), claim.index + 50) : ''}"`);

// 20: no Microsoft, Anthropic, Claude or Fabric word in our own names
const ourNames = [cm.name, gm.name, cp.name, gp.name, cp.displayName || '', entryOf(cm).displayName || '', ...skills.map((s) => s.name)].join(' ');
check(!/microsoft|anthropic|claude|fabric/i.test(ourNames), `our names must not use Microsoft's or Anthropic's: ${ourNames}`);

// 21: Microsoft's modeling MCP has its own EULA: DataArcus never accepts it for the user, and says so
const all = FILES.map((f) => readText(path.join(SRC, f))).join('\n');
check(!/accept-?eula|PBI_MODELING_MCP_ACCEPT_EULA/i.test(all) && /never accepts? (?:it|the EULA|that EULA|Microsoft's EULA) for you/i.test(readme)
  && /go\.microsoft\.com\/fwlink\/\?LinkId=2381247/.test(readme) && /never call `accept_eula`/.test(routing),
  'the EULA: no accept flag or variable; the README says DataArcus never accepts it for you (with its link); the routing skill says never to call accept_eula for the user');

// 22: the README: install in each app, what it hands to Microsoft and why, the privacy line, the licence line
const R = readme.replace(/\s+/g, ' ');
const need = [
  ['Claude Code install', /claude plugin marketplace add microsoft\/skills-for-fabric/.test(R) && /claude plugin install dataarcus@dataarcus/.test(R)],
  ['Copilot CLI install', /copilot plugin install powerbi-authoring@fabric-collection/.test(R) && /copilot plugin install dataarcus@dataarcus/.test(R) && /copilot mcp add dataarcus/.test(R)],
  ['the hand-off', /## What DataArcus hands to Microsoft/.test(R) && /\bwhy\b/i.test(R)],
  ['the privacy line', /metadata/i.test(R) && /never (?:the )?data values/i.test(R) && /AI app/.test(R)],
  ['the licence line', /MIT/.test(R) && /LICENSE/.test(R) && /All rights reserved/.test(R)],
];
check(need.every(([, ok]) => ok), `the README lacks: ${need.filter(([, ok]) => !ok).map(([w]) => w).join(', ')}`);

// 23: no secret
const SECRET = /gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|xox[abp]-[A-Za-z0-9-]{10,}|npm_[A-Za-z0-9]{30,}/;
check(!SECRET.test(all), 'a token or key shape in the folder');

// 24: no employer data: no e-mail but DataArcus's, no SharePoint, OneDrive or Google Sheets link, no personal path
const mails = [...all.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)].map((x) => x[0]).filter((x) => !/@dataarcus\.com$/i.test(x));
const links = all.match(/sharepoint\.com|onedrive\.live|1drv\.ms|docs\.google\.com\/spreadsheets|[A-Z]:\\Users\\(?!me\b)[A-Za-z]|\/(?:home|Users)\/(?!me\b)[a-z]/i);
check(!mails.length && !links, `employer or personal data shapes: ${mails.join(', ')} ${links ? links[0] : ''}`);

if (problems.length) { console.log(`FAIL  skill-packaging  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  skill-packaging  ${checks} checks`);
