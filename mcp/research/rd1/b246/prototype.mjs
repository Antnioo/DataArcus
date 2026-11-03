// B-246 research prototype (rd1, 3 Nov 2026): a versioned Power BI compatibility gate.
// 1. MEASURES: scans mcp/ (read-only; skips node_modules, the bundled Microsoft schemas and this research folder) and
//    counts every line where each version fact is written today, by kind of file (code, tests, docs, data). The same
//    scan of assets/js (the writer) and scripts/ is printed beside it.
// 2. DEMONSTRATES the gate on a made-up PBIR report written to a temporary folder: reads the $schema versions of its
//    files and definition/version.json, compares them with a made-up compat object, prints "tested" or
//    "untested: <the warning>", then removes the folder. Made-up data only; nothing in the repo is written.
//   node mcp/research/rd1/b246/prototype.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');
const SKIP = new Set(['node_modules', '.git']);
const SKIP_PATHS = [path.join(REPO, 'mcp', 'schemas'), HERE];

// ---- 1. the version facts and where they are written ----
const FACTS = [
  { fact: 'a Desktop build named (2.1xx)', re: /\b2\.1[3-6]\d(\.\d+){0,2}\b/ },
  { fact: 'schema bundle commit (af7b264 / 8db0a644)', re: /\baf7b264|\b8db0a644/ },
  { fact: 'validator version literal (0.5.0)', re: /0\.5\.0/ },
  { fact: 'visual catalog version literal (0.1.3)', re: /\b0\.1\.3\b/ },
  { fact: 'a PBIR/PBIP $schema URL with a version', re: /json-schemas\/fabric\/[A-Za-z/]+\/\d+\.\d+\.\d+/ },
  { fact: 'schema family/version named in text (visualContainer 2.13.0)', re: /\b(visualContainer|visualContainerMobileState|visualConfiguration|report|page|bookmark|versionMetadata|pagesMetadata)[ /]\d+\.\d+\.\d+/ },
  { fact: 'schema major-version map (SCHEMAS = {)', re: /\bSCHEMAS\s*=\s*\{/ },
  { fact: 'compatibilityLevel number', re: /compatibilityLevel["']?\s*[:=]\s*\d{4}|COMPAT_UDF\s*=\s*\d{4}/ },
  { fact: 'reportVersionAtImport literal (5.61)', re: /reportVersionAtImport['"]?\s*[:=]\s*['"]\d/ },
];
const kindOf = (rel) => {
  const b = path.basename(rel);
  if (/\.md$/i.test(b)) return 'docs';
  if (/^test[-.]|\/tests?\//.test(rel) || /^test/.test(b)) return 'tests';
  if (/\.(json|tsv|tmdl|bim|pbir|pbip|pbism)$/i.test(b) || b === '.platform') return 'data';
  if (/\.(mjs|js|cjs)$/i.test(b)) return /\.min\.js$/.test(b) ? null : 'code';
  return null;
};
function walk(dir, out) {
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) { if (!SKIP.has(e.name) && !SKIP_PATHS.includes(p)) walk(p, out); }
    else if (e.isFile()) out.push(p);
  }
  return out;
}
function scan(roots) {
  const rows = FACTS.map((f) => ({ fact: f.fact, re: f.re, code: 0, tests: 0, docs: 0, data: 0, files: new Set(), codeAt: [] }));
  for (const root of roots) for (const file of walk(path.join(REPO, root), [])) {
    const rel = path.relative(REPO, file).split(path.sep).join('/');
    const kind = kindOf(rel); if (!kind) continue;
    let text; try { const st = fs.statSync(file); if (st.size > 4 * 1024 * 1024) continue; text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    text.split(/\r?\n/).forEach((line, i) => rows.forEach((r) => {
      if (!r.re.test(line)) return;
      r[kind]++; r.files.add(rel);
      if (kind === 'code') r.codeAt.push(`${rel}:${i + 1}`);
    }));
  }
  return rows;
}
const pad = (s, n) => String(s).padEnd(n);
function printTable(title, rows) {
  console.log(`\n${title}`);
  console.log(`${pad('fact', 62)} ${pad('code', 5)} ${pad('tests', 6)} ${pad('docs', 5)} ${pad('data', 5)} ${pad('lines', 6)} files`);
  for (const r of rows) {
    const total = r.code + r.tests + r.docs + r.data;
    console.log(`${pad(r.fact, 62)} ${pad(r.code, 5)} ${pad(r.tests, 6)} ${pad(r.docs, 5)} ${pad(r.data, 5)} ${pad(total, 6)} ${r.files.size}`);
  }
}
const mcpRows = scan(['mcp']);
printTable('Version facts written in mcp/ (lines; skips node_modules, mcp/schemas, this folder)', mcpRows);
const engRows = scan(['assets/js', 'scripts']);
printTable('The same facts in assets/js (the writer) and scripts/', engRows);
console.log('\nWhere code (not tests, not docs) writes them, mcp/ + assets/js + scripts/:');
FACTS.forEach((f, i) => {
  const at = mcpRows[i].codeAt.concat(engRows[i].codeAt);
  if (at.length) console.log(`  ${f.fact}: ${at.length} line(s): ${at.slice(0, 8).join(', ')}${at.length > 8 ? `, and ${at.length - 8} more` : ''}`);
});

// the newest version per family Microsoft's bundle holds (read from mcp/schemas, read-only)
const cmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
const bundleDir = path.join(REPO, 'mcp', 'schemas', 'fabric', 'item', 'report', 'definition');
const bundled = {};
try { for (const fam of fs.readdirSync(bundleDir)) { const vs = fs.readdirSync(path.join(bundleDir, fam)).filter((v) => /^\d+\.\d+\.\d+$/.test(v)).sort(cmp); if (vs.length) bundled[fam] = vs[vs.length - 1]; } } catch { /* the bundle is optional here */ }
console.log(`\nNewest per family in mcp/schemas (the bundle check_report reads): ${Object.entries(bundled).map(([k, v]) => `${k} ${v}`).join(', ')}`);

// ---- 2. the gate, on a made-up report ----
// A MADE-UP compat object: what one mcp/compat.json would hold (the values are invented for the demo).
const COMPAT = {
  desktop: { tested: '2.159', testedOn: '2026-10-28' },
  schemaCommit: 'af7b264',
  validator: 'read from mcp/package.json',
  // the newest version of each family a Desktop-saved golden fixture showed on the tested Desktop (made up)
  saves: { report: '3.2.0', page: '2.1.0', pagesMetadata: '1.0.0', versionMetadata: '1.0.0', visualContainer: '2.13.0', visualContainerMobileState: '2.8.0', bookmark: '2.1.0', bookmarksMetadata: '1.0.0', reportExtension: '1.0.0' },
  formatVersions: ['1.0.0', '2.0.0'],
  fixtures: ['visual-groups', 'mobile-positions', 'formatting-selectors', 'bookmarks', 'sync-groups', 'field-parameters', 'calculated-tables'],
};
const SCHEMA_RE = /\/item\/report\/definition\/([A-Za-z]+)\/(\d+\.\d+\.\d+)\/schema(?:[.-]embedded)?\.json$/;
const URL0 = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/';
function readVersions(reportDir) {
  const found = [];
  const def = path.join(reportDir, 'definition');
  for (const f of walk(def, [])) {
    if (!/\.json$/i.test(f)) continue;
    let j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
    const rel = path.relative(reportDir, f).split(path.sep).join('/');
    const m = SCHEMA_RE.exec(String((j && j.$schema) || ''));
    if (m) found.push({ file: rel, family: m[1], version: m[2] });
    if (rel === 'definition/version.json') found.push({ file: rel, family: 'format', version: String(j.version || '') });
  }
  return found;
}
/** The gate: every version the report names is one the tested Desktop saved; anything newer or unknown is untested. */
function gate(found, compat) {
  const newer = [];
  for (const f of found) {
    if (f.family === 'format') { if (!compat.formatVersions.includes(f.version)) newer.push(`format ${f.version}`); continue; }
    const top = compat.saves[f.family];
    if (!top || cmp(f.version, top) > 0) newer.push(`${f.family} ${f.version}`);
  }
  const uniq = [...new Set(newer)];
  if (!uniq.length) return { verdict: 'tested', words: '' };
  return { verdict: 'untested', words: `This report uses a file format newer than the Power BI Desktop DataArcus has tested (${uniq.join(', ')}; tested: Desktop ${compat.desktop.tested}). DataArcus can still read it, but some parts may not be checked. Open the result in Power BI Desktop before you rely on it.` };
}
/** The laptop's side: the Desktop build it runs (Help > About) against the tested one; major.minor is the monthly release. */
const desktopGate = (running, compat) => (cmp(running.split('.').slice(0, 2).join('.'), compat.desktop.tested) > 0
  ? { verdict: 'untested', words: `Power BI Desktop ${running} is newer than the version DataArcus has tested (${compat.desktop.tested}). Run the monthly Desktop pass before you rely on it.` }
  : { verdict: 'tested', words: '' });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b246-'));
try {
  const write = (rel, data) => { const p = path.join(tmp, ...rel.split('/')); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(data, null, 2)); };
  const report = (name, vc) => {
    const R = `${name}.Report`;
    write(`${R}/definition/version.json`, { $schema: URL0 + 'versionMetadata/1.0.0/schema.json', version: '2.0.0' });
    write(`${R}/definition/report.json`, { $schema: URL0 + 'report/3.2.0/schema.json', themeCollection: {} });
    write(`${R}/definition/pages/p1/page.json`, { $schema: URL0 + 'page/2.1.0/schema.json', name: 'p1', displayName: 'Made-up page', width: 1280, height: 720 });
    write(`${R}/definition/pages/p1/visuals/v1/visual.json`, { $schema: URL0 + `visualContainer/${vc}/schema.json`, name: 'v1', position: { x: 0, y: 0, width: 100, height: 100 } });
    return path.join(tmp, R);
  };
  const known = report('Made Up Known', '2.13.0'), unknown = report('Made Up Newer', '2.14.0');
  console.log('\nThe gate on made-up reports (compat: made up, desktop.tested 2.159):');
  for (const [label, dir] of [['known (visualContainer 2.13.0)', known], ['unknown (visualContainer 2.14.0)', unknown]]) {
    const found = readVersions(dir), g = gate(found, COMPAT);
    console.log(`  ${label}: read ${found.length} versions (${found.map((f) => `${f.family} ${f.version}`).join(', ')})`);
    console.log(`    ${g.verdict}${g.words ? `: ${g.words}` : ''}`);
  }
  for (const running of ['2.159.1084.0', '2.160.512.0']) { const g = desktopGate(running, COMPAT); console.log(`  Desktop ${running}: ${g.verdict}${g.words ? `: ${g.words}` : ''}`); }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\nTemporary folder removed: ${!fs.existsSync(tmp)}`);
}
