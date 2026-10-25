// 0.3.1 RB (T1's "Seen, not in scope" 5): check_report's known-validator-gap path, reached end to end. Today's catalog
// (@microsoft/powerbi-core-visual-schema, the version mcp/package.json pins) lists the slicer's dropdown, so no report
// gives a known gap and only unit checks reached the path. It is kept on purpose: it is where the next proven catalog lag
// goes (VALIDATOR_GAPS; scripts/microsoft-watch.mjs names it). So this suite runs a COPY of mcp/ whose two Microsoft
// packages are copied (the rest of node_modules linked) and whose catalog has slicer.dropdown removed (the shape catalog
// 0.1.1 had), and calls the copy's check_report on a fixture with a Dropdown slicer in the Desktop-proven rounded box.
// No product code knows about it. The repo's own files are never edited.
//   VG-1  the copy's catalog lacks slicer.dropdown; the installed one lists it
//   VG-2  the real tree: no validator finding for the box, no known note (today's answer, unchanged)
//   VG-3  the copy: the validator's PBIR_FORMATTING_OBJECT_UNKNOWN becomes a known note: "Desktop opens it", its evidence
//   VG-4  the copy: the counts and the summary say one known note, and nothing more can break than in the real tree
//   VG-5  the copy: one more property in the box: the validator's finding stands ("can break"), no known note
//   node test-0.3.1-validator-gap.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const TMP = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-vgap-')));
const ROOT = path.join(TMP, 'work'), COPY = path.join(TMP, 'copy');
const CAPS_FILE = (mcp) => path.join(mcp, 'node_modules', '@microsoft', 'powerbi-core-visual-schema', 'data', 'capabilities.json');

// the copy: mcp/ without node_modules, Microsoft's packages copied, every other package linked; assets/js and assets/data
fs.cpSync(HERE, path.join(COPY, 'mcp'), { recursive: true, filter: (s) => !['node_modules', '.git'].includes(path.basename(s)) });
const NM = path.join(HERE, 'node_modules'), cnm = path.join(COPY, 'mcp', 'node_modules');
fs.mkdirSync(cnm);
for (const n of fs.readdirSync(NM)) {
  if (n === '@microsoft') fs.cpSync(path.join(NM, n), path.join(cnm, n), { recursive: true, dereference: true });
  else fs.symlinkSync(path.join(NM, n), path.join(cnm, n), process.platform === 'win32' ? 'junction' : 'dir');
}
for (const a of ['js', 'data']) fs.cpSync(path.join(REPO, 'assets', a), path.join(COPY, 'assets', a), { recursive: true });
{ const c = J(CAPS_FILE(path.join(COPY, 'mcp'))); delete c.slicer.objects.dropdown; fs.writeFileSync(CAPS_FILE(path.join(COPY, 'mcp')), JSON.stringify(c)); }

// the fixture: the twin project, its slicer a Dropdown slicer with exactly the proven rounded box (and a second copy with
// one more property in the box)
const lit = (v) => ({ expr: { Literal: { Value: v } } });
const SL = 'Twin Sales.Report/definition/pages/p1overview/visuals/slRegion/visual.json';
const fixture = (name, extra) => {
  const d = path.join(ROOT, name); fs.cpSync(path.join(HERE, 'fixtures', 'twin-project'), d, { recursive: true });
  const f = path.join(d, SL), v = J(f);
  v.visual.objects.data = [{ properties: { mode: lit("'Dropdown'") } }];
  v.visual.objects.dropdown = [{ properties: Object.assign({ borderRadius: lit('8D'), borderIndividualCorners: lit('false'), borderColor: { solid: { color: lit("'#9ca3af'") } } }, extra || {}) }];
  fs.writeFileSync(f, JSON.stringify(v, null, 2));
};
fixture('box'); fixture('more', { accentBarShow: lit('true') });

const serverOf = async (mcp) => {
  const c = new Client({ name: 'test-vgap', version: '1' });
  await c.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(mcp, 'server.mjs')], env: { ...process.env, DATAARCUS_ROOT: ROOT }, stderr: 'ignore' }));
  const call = async (name, args) => { try { const r = await c.callTool({ name, arguments: args }); const t = r.content[0].text; return { err: !!r.isError, t, j: r.isError ? null : JSON.parse(t) }; } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  return { call, close: () => c.close() };
};
const box = (x) => ((x.j && x.j.findings) || []).filter((f) => f.rule === 'PBIR_FORMATTING_OBJECT_UNKNOWN' && f.file === SL.replace(/^Twin Sales\.Report\//, ''));
const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify([x.j.validator, x.j.impact && x.j.impact.summary, box(x)]).slice(0, 600));

try {
  chk(() => !J(CAPS_FILE(path.join(COPY, 'mcp'))).slicer.objects.dropdown && !!J(CAPS_FILE(HERE)).slicer.objects.dropdown, () => 'VG-1. the copy\'s catalog lacks slicer.dropdown and the installed one lists it');
  const real = await serverOf(HERE), copy = await serverOf(path.join(COPY, 'mcp'));
  let r, c, m;
  try {
    r = await real.call('check_report', { path: 'box/Twin Sales.pbip' });
    c = await copy.call('check_report', { path: 'box/Twin Sales.pbip' });
    m = await copy.call('check_report', { path: 'more/Twin Sales.pbip' });
  } finally { await real.close(); await copy.close(); }
  chk(() => !r.err && r.j.validator.ran && box(r).length === 0 && (r.j.validator.known || 0) === 0 && !/known/i.test(r.j.impact.summary), () => `VG-2. the real tree: no finding for the box, no known note: ${short(r)}`);
  chk(() => !c.err && c.j.validator.ran && box(c).length === 1 && box(c)[0].severity === 'note' && box(c)[0].impact === 'desktopOpens' && box(c)[0].origin === 'validator'
    && /2\.158/.test(box(c)[0].known.what) && /DESKTOP-TESTS\.md/.test(box(c)[0].known.evidence) && /^Nothing to fix/.test(box(c)[0].fix),
    () => `VG-3. a catalog without slicer.dropdown: the validator's finding for the proven box is a known note, "Desktop opens it", with its evidence: ${short(c)}`);
  chk(() => c.j.validator.known === 1 && c.j.validator.reported.errors + c.j.validator.reported.warnings - c.j.validator.errors - c.j.validator.warnings === 1
    && c.j.impact.kinds.canBreak.count === r.j.impact.kinds.canBreak.count && /1 known note\b/.test(c.j.impact.summary),
    () => `VG-4. one known note in the counts and the summary, and nothing more can break than in the real tree (${r.j && r.j.impact.kinds.canBreak.count}): ${short(c)}`);
  chk(() => !m.err && box(m).length === 1 && !box(m)[0].known && box(m)[0].impact === 'canBreak' && box(m)[0].severity !== 'note' && (m.j.validator.known || 0) === 0,
    () => `VG-5. one more property in the box: the validator's finding stands ("can break"), no known note: ${short(m)}`);
} catch (e) { problems.push('the suite threw: ' + (e && e.stack || e)); }
for (const n of fs.readdirSync(cnm)) if (fs.lstatSync(path.join(cnm, n)).isSymbolicLink()) fs.unlinkSync(path.join(cnm, n));   // (the links first: never a package behind one)
fs.rmSync(TMP, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL  validator-gap  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  validator-gap  ${checks} checks`);
