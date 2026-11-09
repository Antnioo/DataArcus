// mcp/docs/CONTRACTS.md, the contract ledger (0.3.2 CL1; the owner D-1104-11, D-1104-12), kept true. Static: it reads
// the ledger, the probe's family list (scripts/contracts-probe.mjs FAMILIES, imported without running a place) and
// the sources, and loads no engine, so it runs without the MCP's packages. It checks:
//   - every place the ledger names (a table row `file` `function`, or `function` (in `outer`)) exists: the file, the
//     function defined in it (function f(, const f =, or one of several names in one const), inside `outer` when named;
//   - its MODULES.md link is the part whose table holds the file's row;
//   - the ledger's families are the probe's, each with the same places, and each family has at least 8 inputs there;
//   - the top table's "places" and "of M inputs" match the probe;
//   - every `file` `function` in the "Not one question" list exists;
//   - every copy in "Equal copies, not probed" exists, and a row that says "same text: yes" has the same definition text
//     in every place (spaces aside): a copy that drifts from its twin fails here.
//   node scripts/check-contracts.mjs [--root <dir>]   one result line: PASS  contracts  <N> checks (or one FAIL line a miss)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAMILIES, definitions } from './contracts-probe.mjs';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DOC = 'mcp/docs/CONTRACTS.md';
export const MIN_INPUTS = 8;
const MODULES = 'mcp/docs/MODULES.md';
const read = (root, f) => fs.readFileSync(path.join(root, ...f.split('/')), 'utf8').replace(/\r\n/g, '\n');
const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const PLACE = /^`([^`]+\/[^`]+)` `([^`]+)`(?: \(in `([^`]+)`\))?$/;

// where a name is defined in a source: the index of each definition
export function definedAt(src, name) {
  const esc = name.replace(/[$]/g, '\\$');
  const re = new RegExp(`\\bfunction\\s+${esc}\\s*\\(|(?:\\b(?:const|let|var)\\s+|,\\s*)${esc}\\s*=(?![=>])`, 'g');
  return [...src.matchAll(re)].map((m) => m.index);
}
// GitHub's anchor of a heading
export const slug = (h) => h.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');

// the ledger: { families: [{ id, line, places: [{ file, fn, within, link, line }] }], top: [{ id, places, of, line }], not: [...] }
export function ledgerOf(md) {
  const lines = md.split('\n'), out = { families: [], top: [], not: [], equal: [] };
  let fam = null, inNot = false, inTop = false, inEqual = false;
  lines.forEach((l, i) => {
    const h = /^## (\S+) (.+)$/.exec(l);
    if (/^## /.test(l)) { inNot = /^## Not one question/.test(l); inTop = /^## The families/.test(l); inEqual = /^## Equal copies/.test(l); fam = null; }
    if (h && !inNot && !inTop && !inEqual) { fam = { id: h[1], line: i + 1, places: [] }; out.families.push(fam); return; }
    if (inEqual && /^\|/.test(l) && !/^\|\s*(copy|-)/.test(l)) {
      const c = cells(l), places = [...(c[1] || '').matchAll(/`([^`]+\/[^`]+)` `([^`]+)`/g)].map((m) => ({ file: m[1], fn: m[2], line: i + 1 }));
      out.equal.push({ copy: c[0], places, same: /^yes\b/.test(c[2] || ''), line: i + 1 });
      return;
    }
    if (inTop && /^\|\s*\[/.test(l)) { const c = cells(l), id = /^\[(\S+)/.exec(c[0]), of = /(\d+) of (\d+)/.exec(c[2] || ''); out.top.push({ id: id && id[1], places: +c[1], of: of ? +of[2] : NaN, line: i + 1 }); return; }
    if (inNot && /^- /.test(l)) { for (const m of l.matchAll(/`([^`]+\/[^`]+)` `([^`]+)`/g)) out.not.push({ file: m[1], fn: m[2], line: i + 1 }); return; }
    if (fam && /^\|/.test(l)) {
      const c = cells(l), p = PLACE.exec(c[0]);
      if (!p) return;
      const link = /\]\(MODULES\.md#([^)]+)\)/.exec(c[1] || '');
      fam.places.push({ file: p[1], fn: p[2], within: p[3] || null, link: link ? link[1] : null, line: i + 1 });
    }
  });
  return out;
}
// MODULES.md: file -> the anchor of the part whose table holds its row
export function modulesParts(md) {
  const at = new Map();
  let anchor = null, folder = null;
  for (const l of md.replace(/\r\n/g, '\n').split('\n')) {
    if (/^#{2,3} /.test(l)) { anchor = slug(l.replace(/^#+\s+/, '')); folder = null; continue; }
    const f = /^In `([^`]+)\/`/.exec(l);
    if (f) { folder = f[1]; continue; }
    const r = /^\|\s*`([^`]+)`\s*\|/.exec(l);
    if (r && folder) at.set(folder + '/' + r[1], anchor);
  }
  return at;
}
const key = (p) => `${p.file} ${p.fn}${p.within ? ' in ' + p.within : ''}`;

export function checkContracts(root = ROOT, families = FAMILIES) {
  const problems = [];
  let checks = 0;
  const has = (f) => fs.existsSync(path.join(root, ...f.split('/')));
  if (!has(DOC)) return { checks: 0, problems: [`FAIL ${DOC} is not there: write the ledger (node scripts/contracts-probe.mjs --md gives its tables)`] };
  const L = ledgerOf(read(root, DOC)), parts = has(MODULES) ? modulesParts(read(root, MODULES)) : new Map();
  const where = (x) => `${DOC}:${x.line}`;
  const exists = (x, what) => {
    checks++;
    if (!has(x.file)) { problems.push(`FAIL ${where(x)}: ${what} ${x.file} is not there: the file moved or went; name its new file, or drop the place`); return; }
    const src = read(root, x.file), at = definedAt(src, x.fn);
    checks++;
    if (!at.length) { problems.push(`FAIL ${where(x)}: ${what} ${x.file} has no ${x.fn}: the function was renamed or moved; name it as it is now`); return; }
    if (x.within) {
      checks++;
      const w = definedAt(src, x.within);
      if (!w.length) problems.push(`FAIL ${where(x)}: ${x.file} has no ${x.within} (the function ${x.fn} sits in): name the function it is in now`);
      else if (!at.some((a) => a > w[0])) problems.push(`FAIL ${where(x)}: ${x.file}'s ${x.fn} is not inside ${x.within}: name the function it is in now`);
    }
  };
  for (const f of L.families) for (const p of f.places) {
    exists(p, `family ${f.id}:`);
    checks++;
    const part = parts.get(p.file);
    if (!p.link) problems.push(`FAIL ${where(p)}: ${p.file}'s place has no MODULES.md link: [part](MODULES.md#<the part whose table holds its row>)`);
    else if (part !== p.link) problems.push(`FAIL ${where(p)}: ${p.file}'s MODULES.md link is #${p.link}, its row is ${part ? 'under #' + part : 'in no table'}: link #${part || '<its part>'}`);
  }
  for (const x of L.not) exists(x, '"Not one question":');
  for (const e of L.equal) {
    checks++;
    if (e.places.length < 2) { problems.push(`FAIL ${DOC}:${e.line}: the copy "${e.copy}" names ${e.places.length} place: a copy has two or more`); continue; }
    e.places.forEach((x) => exists(x, `"${e.copy}":`));
    if (!e.same) continue;
    const texts = e.places.map((x) => { if (!has(x.file)) return null; const d = definitions(read(root, x.file), x.fn).sort((a, b) => a.indent - b.indent)[0]; return d ? d.text.replace(/\s+/g, ' ').trim() : null; });
    checks++;
    if (texts.some((t) => t == null)) problems.push(`FAIL ${DOC}:${e.line}: "${e.copy}": a definition could not be read (named above)`);
    else if (new Set(texts).size > 1) problems.push(`FAIL ${DOC}:${e.line}: "${e.copy}" says the same text, and ${e.places.filter((x, k) => texts[k] !== texts[0]).map((x) => x.file + ' ' + x.fn).join(', ')} now differ from ${e.places[0].file}: make them the same again, or say "no: <how>" and probe it`);
  }
  // the ledger and the probe: the same families, the same places, the inputs
  const byId = new Map(families.map((f) => [f.id, f])), ledgerIds = new Set(L.families.map((f) => f.id));
  for (const f of families) {
    checks++;
    if (f.inputs.length < MIN_INPUTS) problems.push(`FAIL scripts/contracts-probe.mjs family ${f.id}: ${f.inputs.length} inputs, at least ${MIN_INPUTS}: add made-up inputs that hit its edges`);
    checks++;
    if (!ledgerIds.has(f.id)) problems.push(`FAIL family ${f.id} is in the probe and not in ${DOC}: add its section "## ${f.id} ${f.title}" (node scripts/contracts-probe.mjs --md)`);
  }
  for (const f of L.families) {
    checks++;
    const pf = byId.get(f.id);
    if (!pf) { problems.push(`FAIL ${DOC}:${f.line}: family ${f.id} has no inputs in scripts/contracts-probe.mjs: add it to FAMILIES, with at least ${MIN_INPUTS} made-up inputs`); continue; }
    const mine = new Set(f.places.map(key)), theirs = new Set(pf.places.map((p) => key({ file: p.file, fn: p.fn, within: p.within })));
    for (const k of theirs) { checks++; if (!mine.has(k)) problems.push(`FAIL ${DOC}:${f.line}: family ${f.id}: the probe runs ${k}, the ledger does not name it: add its row`); }
    for (const p of f.places) { checks++; if (!theirs.has(key(p))) problems.push(`FAIL ${where(p)}: family ${f.id}: ${key(p)} is not in the probe: add it to the family's places in scripts/contracts-probe.mjs`); }
  }
  for (const t of L.top) {
    checks++;
    const pf = byId.get(t.id), sec = L.families.find((f) => f.id === t.id);
    if (!pf || !sec) { problems.push(`FAIL ${DOC}:${t.line}: the top table's ${t.id} has no family section or no probe family`); continue; }
    if (t.places !== pf.places.length) problems.push(`FAIL ${DOC}:${t.line}: ${t.id} says ${t.places} places, the probe runs ${pf.places.length}`);
    if (t.of !== pf.inputs.length) problems.push(`FAIL ${DOC}:${t.line}: ${t.id} says "of ${t.of} inputs", the probe has ${pf.inputs.length}`);
  }
  for (const f of L.families) { checks++; if (!L.top.some((t) => t.id === f.id)) problems.push(`FAIL ${DOC}:${f.line}: family ${f.id} has no row in the top table "## The families"`); }
  return { checks, problems, families: L.families.length, places: L.families.reduce((n, f) => n + f.places.length, 0) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf('--root');
  const { checks, problems, families, places } = checkContracts(at > 0 ? path.resolve(process.argv[at + 1]) : ROOT);
  if (problems.length) {
    for (const p of problems) console.log(p);
    console.log(`FAIL  contracts  ${problems.length} of ${checks} checks failed`);
    process.exit(1);
  }
  console.log(`PASS  contracts  ${checks} checks (${families} families, ${places} places)`);
}
