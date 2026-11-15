import './test-env.mjs';
// 0.3.3 SN4 (D-1112-01; mcp/work/SN4.md). Made-up names only, on copies of mcp/fixtures/twin-project, through the real
// server (stdio). Written red first on 0dc0ea05.
//   A  read_report's JSON says what it did not read: one file over 8 MB, one folder too deep, one file not JSON; the text
//      form names them and the JSON carries the same facts (counts), built by the same function (notReadOf), under
//      notRead (where links go); a report read whole has no notRead key (R-89)
//   F  create_report's font text is true for both routes (no "Hand-placed pages:" only); tools/list under 61,000
//   L  check_report's lint section says notListed with its count when its list is cut, never truncated
//   node test-0.3.3-sn4.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sn4-')));
const BASE = 'Twin Sales', FIX = path.join(HERE, 'fixtures/twin-project');
const fresh = (dir) => { fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true }); fs.cpSync(FIX, path.join(ROOT, dir), { recursive: true }); return path.join(ROOT, dir, BASE + '.pbip'); };
const PAGES = (dir) => path.join(ROOT, dir, BASE + '.Report/definition/pages');
const short = (s) => String(s || '').slice(0, 300);
const s = await serverClient(ROOT);
try {
  // ---- A: the report read whole, then with three things not read ----
  const whole = fresh('whole');
  const wJ = await s.call('read_report', { path: whole, format: 'json' }), wT = await s.call('read_report', { path: whole });
  chk(() => wJ.j && !('notRead' in wJ.j) && !/NOT READ/.test(wT.t), () => `A0. a report read whole has no notRead and no NOT READ line: ${short(wJ.t)}`);
  const bad = fresh('bad'), V = path.join(PAGES('bad'), 'p1overview/visuals');
  fs.mkdirSync(path.join(V, 'hugeVisual'), { recursive: true });
  fs.writeFileSync(path.join(V, 'hugeVisual/visual.json'), Buffer.alloc(8 * 1024 * 1024 + 10, 32));
  fs.mkdirSync(path.join(V, 'brokenVisual'), { recursive: true });
  fs.writeFileSync(path.join(V, 'brokenVisual/visual.json'), '{ not json');
  let deep = path.join(V, 'deepA'); for (let i = 0; i < 14; i++) deep = path.join(deep, 'd' + i);
  fs.mkdirSync(deep, { recursive: true }); fs.writeFileSync(path.join(deep, 'x.json'), '{}');
  const bT = await s.call('read_report', { path: bad }), bJ = await s.call('read_report', { path: bad, format: 'json' });
  const line = (bT.t.split('\n').find((l) => l.startsWith('NOT READ ')) || '');
  chk(() => /1 file\(s\) over 8 MB/.test(line) && /1 file\(s\) not readable as JSON/.test(line), () => `A1. the text form names the large and the unreadable file: ${line}`);
  const nr = bJ.j && bJ.j.notRead;
  chk(() => nr && nr.tooLarge && nr.tooLarge.count === 1, () => `A2. the JSON names the file over the limit: ${short(JSON.stringify(nr))}`);
  // measured: read_report reads fixed places and never walks folders, so only check_report's walk fills sk.deep and sk.capped; the function covers them for both forms
  const { notReadOf: nrf } = await import('./lib/report-answer.mjs'), none = { count: 0, named: [], more: 0, text: '' };
  const fake = nrf({ sk: { big: [], deep: 2, capped: true, links: [] }, unreadable: 0 }, none);
  chk(() => fake.json.tooDeep.count === 2 && fake.json.pastTheCap.files === 20000 && /2 folder\(s\) deeper than 12; files past the first 20,000/.test(fake.text), () => `A3. deep and capped, text and JSON from one function: ${JSON.stringify(fake)}`);
  chk(() => nrf({ sk: { big: [], deep: 0, links: [] }, unreadable: 0 }, none).json === null, () => 'A3b. nothing to say: no JSON, no line');
  chk(() => nr && nr.unreadable && nr.unreadable.count === 1, () => `A4. the JSON names the unreadable file: ${short(JSON.stringify(nr))}`);
  chk(() => nr && !('links' in nr), () => `A5. no links key when there is no link: ${short(JSON.stringify(nr))}`);
  const { notReadOf } = await import('./lib/report-answer.mjs');
  chk(() => typeof notReadOf === 'function', () => 'A6. one function builds the facts for both forms (notReadOf)');
  // ---- F: the font text ----
  const tools = (await s.c.listTools()).tools, withFont = tools.map((t) => (t.inputSchema.properties || {}).font).filter(Boolean);
  chk(() => withFont.length && withFont.every((f) => !/^Hand-placed pages: the font/.test(f.description || '')), () => `F1. the font text is not about hand-placed pages only: ${withFont.map((f) => f.description).join(' | ').slice(0, 200)}`);
  chk(() => JSON.stringify({ tools }).length < 61000, () => `F2. tools/list under 61,000: ${JSON.stringify({ tools }).length}`);
  // ---- L: the lint's list cut at 3 ----
  const lint = fresh('lint');
  for (let i = 0; i < 6; i++) { const d = path.join(PAGES('lint'), 'p1overview/visuals', 'ov' + i); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'visual.json'), JSON.stringify({ name: 'ov' + i, position: { x: 10, y: 10, width: 200, height: 100, z: 50 + i }, visual: { visualType: 'card' } })); }
  const lJ = await s.call('check_report', { path: lint, checks: ['lint'], maxFindings: 3 });
  const lt = lJ.j && lJ.j.lint;
  chk(() => lt && lt.findings.length === 3 && lt.notListed >= 1 && !('truncated' in lt), () => `L1. the lint says notListed with its count: ${short(JSON.stringify(lt && { n: lt.findings.length, notListed: lt.notListed, truncated: lt.truncated }))}`);
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }
if (problems.length) { problems.forEach((p) => console.log('FAIL ' + p)); console.log(`FAIL  sn4  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sn4  ${checks} checks`);
