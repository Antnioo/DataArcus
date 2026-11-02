// Measures what every conversation pays for (0.3.2 TK1, B-272 and B-273): tools/list in characters (whole and per
// tool), and three typical answers (plan_layout on the sample, check_report on the sample, create_arabic_twin's plan
// on the twin fixture) with their share of spaces. Prints the numbers; checks nothing.
//   node scripts-measure-tokens.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export async function measure() {
  const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tk-')));
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(ROOT, 'twin-project'), { recursive: true });
  const s = await serverClient(ROOT, {});
  try {
    const tools = (await s.c.listTools()).tools;
    const perTool = Object.fromEntries(tools.map((t) => [t.name, JSON.stringify(t).length]));
    const total = JSON.stringify({ tools }).length;
    const spaces = (t) => Math.round(100 * (String(t).match(/ /g) || []).length / Math.max(1, String(t).length));
    const sample = await s.call('plan_layout', { sample: true });
    const check = await s.call('check_report', { path: 'twin-project/Twin Sales.pbip' });
    const twin = await s.call('create_arabic_twin', { path: 'twin-project/Twin Sales.pbip' });
    const answers = { 'plan_layout sample': sample, 'check_report twin fixture': check, 'create_arabic_twin plan': twin };
    return { total, perTool, answers: Object.fromEntries(Object.entries(answers).map(([k, r]) => [k, { chars: String(r.t).length, spacesPct: spaces(r.t), err: r.err }])) };
  } finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await measure(), null, 1));
