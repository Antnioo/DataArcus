// RD9 scratch: what the installed SDK does with an outputSchema (in memory, no file, no model). Checks nothing.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';
const s = new McpServer({ name: 'probe', version: '1' });
const shape = { report: z.object({ pages: z.number() }), findings: z.array(z.object({ code: z.string() })) };
const answers = {
  exact: { report: { pages: 2 }, findings: [{ code: 'A' }] },
  extraTop: { report: { pages: 2 }, findings: [], truncated: { cut: {} } },
  extraDeep: { report: { pages: 2, visuals: 3 }, findings: [{ code: 'A', why: 'x' }] },
  missing: { findings: [] },
  textOnly: null
};
s.registerTool('t', { description: 'probe', inputSchema: { which: z.string() }, outputSchema: shape }, async ({ which }) => {
  const a = answers[which];
  return a ? { content: [{ type: 'text', text: JSON.stringify(a) }], structuredContent: a } : { content: [{ type: 'text', text: '{}' }] };
});
s.registerTool('loose', { description: 'probe', inputSchema: {}, outputSchema: z.looseObject({ report: z.object({ pages: z.number() }).loose() }) }, async () => ({ content: [{ type: 'text', text: '{}' }], structuredContent: { report: { pages: 1, more: 1 }, other: 1 } }));
const [a, b] = InMemoryTransport.createLinkedPair();
await s.connect(a); const c = new Client({ name: 'p', version: '1' }); await c.connect(b);
const list = (await c.listTools()).tools;
console.log('outputSchema t:', JSON.stringify(list[0].outputSchema));
console.log('outputSchema loose:', JSON.stringify(list[1].outputSchema));
for (const w of Object.keys(answers)) {
  try { const r = await c.callTool({ name: 't', arguments: { which: w } }); console.log(w, '->', r.isError ? 'isError: ' + r.content[0].text.slice(0, 140) : 'ok, keys ' + Object.keys(r).join(',')); }
  catch (e) { console.log(w, '-> client threw:', e.message.slice(0, 160)); }
}
try { const r = await c.callTool({ name: 'loose', arguments: {} }); console.log('loose ->', r.isError ? 'isError ' + r.content[0].text : 'ok ' + JSON.stringify(r.structuredContent)); } catch (e) { console.log('loose -> client threw:', e.message.slice(0, 160)); }
await c.close();
