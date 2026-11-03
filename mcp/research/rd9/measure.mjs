// RD9 scratch: each tool's answer on the fixtures (made-up data, copied to os.tmpdir()). Per call: the text's
// characters, the result as sent (JSON-RPC result) today, the same result with structuredContent beside the text
// (what MCP structured output sends), the answer's keys that no word of the tool's listing names, and the time.
// Checks nothing; prints JSON.   node research/rd9/measure.mjs
import '../../test-env.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from '../../test-0.2.9.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), MCP = path.resolve(HERE, '../..');
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'rd9-')));
for (const f of ['twin-project', 'health-project']) fs.cpSync(path.join(MCP, 'fixtures', f), path.join(ROOT, f), { recursive: true });
const s = await serverClient(ROOT, {});
const tools = Object.fromEntries((await s.c.listTools()).tools.map((t) => [t.name, t]));
const T = 'twin-project/Twin Sales.pbip', H = 'health-project/Health Test Report.pbip';
const calls = [
  ['read_model', { path: T }], ['suggest_fields', { path: T }], ['check_model_health', { path: H }],
  ['generate_theme', { name: 'RD9 Theme' }], ['plan_layout', { sample: true }], ['plan_layout', { path: T, lang: 'ar' }],
  ['create_report', { path: T }], ['add_gulf_calendar', { path: T, firstYear: 2024, lastYear: 2026 }], ['read_report', { path: T }], ['read_report', { path: T, format: 'json' }],
  ['check_report', { path: T }], ['check_report', { path: H }], ['create_arabic_twin', { path: T }], ['approve_plan', { planId: 'plan-000000000000' }]
];
// every key at every depth (array items walked), with its path pattern
const keysOf = (o, p = '', acc = new Map()) => {
  if (Array.isArray(o)) o.forEach((x) => keysOf(x, p + '[]', acc));
  else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => { const q = p ? p + '.' + k : k; if (!acc.has(k)) acc.set(k, q); keysOf(v, q, acc); });
  return acc;
};
// a JSON Schema inferred from one answer (types and keys only, no descriptions): a floor for a hand-written outputSchema
const infer = (o) => { if (Array.isArray(o)) { const it = o.map(infer).reduce((m, x) => (JSON.stringify(x).length > JSON.stringify(m).length ? x : m), {}); return { type: 'array', items: it }; }
  if (o && typeof o === 'object') return { type: 'object', properties: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, infer(v)])) };
  return { type: o === null ? 'null' : typeof o }; };
const tok = (n) => Math.round(n / 3.5);   // a stated estimate for JSON text: 3.5 characters per token
const rows = [], kept = {};
for (const [name, args] of calls) {
  const t0 = performance.now();
  let r; try { r = await s.c.callTool({ name, arguments: args }); } catch (e) { r = { isError: true, content: [{ type: 'text', text: 'call failed: ' + e.message }] }; }
  const ms = Math.round(performance.now() - t0), text = r.content[0].text;
  let j = null; try { j = JSON.parse(text); } catch (e) {}
  const wire = JSON.stringify(r).length, both = j && typeof j === 'object' && !Array.isArray(j) ? JSON.stringify(Object.assign({}, r, { structuredContent: j })).length : null;
  const listing = JSON.stringify(tools[name]).toLowerCase(), keys = j ? keysOf(j) : new Map();
  const unnamed = [...keys.keys()].filter((k) => !listing.includes(k.toLowerCase()));
  const top = j && typeof j === 'object' ? Object.keys(j) : [];
  if (j) kept[name + ' ' + JSON.stringify(args)] = j;
  rows.push({ call: name + ' ' + JSON.stringify(args), err: !!r.isError, ms, text: text.length, tokens: tok(text.length), wire, wireWithStructured: both,
    topKeys: top.length, topUnnamed: top.filter((k) => !listing.includes(k.toLowerCase())), keys: keys.size, unnamed: unnamed.length,
    schemaFloor: j && typeof j === 'object' ? JSON.stringify(infer(j)).length : null, truncated: j && j.truncated ? Object.keys(j.truncated.cut || {}) : null, head: r.isError ? text.slice(0, 160) : undefined });
}
await s.close(); fs.rmSync(ROOT, { recursive: true, force: true });
fs.writeFileSync(path.join(os.tmpdir(), 'rd9-answers.json'), JSON.stringify(kept));   // the answers, for cut-prototype.mjs
console.log(JSON.stringify(rows, null, 1));
