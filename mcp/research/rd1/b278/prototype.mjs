// B-278 prototype (research only, never shipped): measures MCP elicitation with the pinned SDK, in-process.
// A Server and a Client joined by the SDK's InMemoryTransport; the client declares (or not) the elicitation capability;
// the server asks for a made-up approval ("Write the report 'Sales Twin'?") and the client's handler answers.
// Made-up data only. Run: node mcp/research/rd1/b278/prototype.mjs
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ElicitRequestSchema, ElicitResultSchema, LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';

// (the package's exports map has no ./package.json: read it by path, mcp/node_modules)
const SDK_VERSION = JSON.parse(fs.readFileSync(new URL('../../../node_modules/@modelcontextprotocol/sdk/package.json', import.meta.url), 'utf8')).version;

const FORM = {
  mode: 'form',
  message: 'DataArcus asks before it writes anything. Write the report \'Sales Twin\' (3 pages, 41 files) in the folder you chose?',
  requestedSchema: { type: 'object', properties: { approve: { type: 'boolean', title: 'Write these files', description: 'Tick to approve plan P-demo', default: false } }, required: ['approve'] }
};
const URLASK = { mode: 'url', message: 'Open DataArcus\'s approval page for plan P-demo', elicitationId: 'demo-elicitation-1', url: 'http://127.0.0.1:50999/approve/demo-not-a-real-secret-000000' };

// DataArcus's own choice today (mcp/tools/approve_plan.mjs:29): the app's prompt when it declares form mode (or bare)
const route = (caps) => (caps && caps.elicitation && (caps.elicitation.form || !caps.elicitation.url) ? 'app prompt (form)' : 'browser page');

async function pair(capabilities, handler) {
  const server = new Server({ name: 'b278-demo', version: '0' }, { capabilities: {} });
  const client = new Client({ name: 'b278-client', version: '0' }, { capabilities });
  if (handler) client.setRequestHandler(ElicitRequestSchema, handler);
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(st), client.connect(ct)]);
  return { server, client };
}

const rows = [];
async function run(label, capabilities, handler, ask, opts) {
  let p;
  try { p = await pair(capabilities, handler); } catch (e) { rows.push({ label, declared: JSON.stringify(capabilities.elicitation ?? null), seen: '-', route: '-', result: 'connect error: ' + e.message, ms: '-' }); return; }
  const seen = p.server.getClientCapabilities()?.elicitation;
  const t0 = performance.now();
  let result;
  try {
    const r = opts && opts.raw ? await p.server.request({ method: 'elicitation/create', params: ask }, ElicitResultSchema, opts.req)
      : await p.server.elicitInput(ask, opts && opts.req);
    result = r.action + (r.content ? ' ' + JSON.stringify(r.content) : '');
  } catch (e) { result = 'ERROR' + (e.code !== undefined ? ' code ' + e.code : ' (no code)') + ': ' + e.message; }
  const ms = (performance.now() - t0).toFixed(2);
  rows.push({ label, declared: JSON.stringify(capabilities.elicitation ?? null), seen: JSON.stringify(seen ?? null), route: route(p.server.getClientCapabilities()), result, ms });
  await p.client.close(); await p.server.close();
}

// the person's answers in the app's prompt
const yes = () => ({ action: 'accept', content: { approve: true } });
const unticked = () => ({ action: 'accept', content: { approve: false } });
const no = () => ({ action: 'decline' });
const closed = () => ({ action: 'cancel' });
const wrongType = () => ({ action: 'accept', content: { approve: 'yes' } });
const never = () => new Promise(() => {});      // a client that declares elicitation and never shows it (see NOTES.md, b)

await run('1 bare {} : accept, ticked', { elicitation: {} }, yes, FORM);
await run('2 form : accept, ticked', { elicitation: { form: {} } }, yes, FORM);
await run('3 form : accept, unticked', { elicitation: { form: {} } }, unticked, FORM);
await run('4 form : decline', { elicitation: { form: {} } }, no, FORM);
await run('5 form : cancel', { elicitation: { form: {} } }, closed, FORM);
await run('6 form : answer of the wrong type', { elicitation: { form: {} } }, wrongType, FORM);
await run('7 form+url : accept, ticked', { elicitation: { form: {}, url: {} } }, yes, FORM);
await run('8 url only : form asked', { elicitation: { url: {} } }, yes, FORM);
await run('9 url only : url asked, accept', { elicitation: { url: {} } }, () => ({ action: 'accept' }), URLASK);
await run('10 none : form asked (SDK check)', {}, null, FORM);
await run('11 none : raw request, no check', {}, null, FORM, { raw: true });
await run('12 declared, never shown (200 ms timeout)', { elicitation: {} }, never, FORM, { req: { timeout: 200 } });

// round trip of the accept path, 200 times (median and p95)
const times = [];
{
  const p = await pair({ elicitation: { form: {} } }, yes);
  for (let i = 0; i < 200; i++) { const t0 = performance.now(); await p.server.elicitInput(FORM); times.push(performance.now() - t0); }
  await p.client.close(); await p.server.close();
}
times.sort((a, b) => a - b);

console.log(`SDK ${SDK_VERSION}, latest protocol ${LATEST_PROTOCOL_VERSION}, node ${process.version}`);
console.log('| case | client declares | server sees | DataArcus route | result | ms |');
console.log('|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.label} | ${r.declared} | ${r.seen} | ${r.route} | ${r.result.replace(/\|/g, '/').slice(0, 170)} | ${r.ms} |`);
console.log(`accept round trip in-process, 200 runs: median ${times[100].toFixed(3)} ms, p95 ${times[190].toFixed(3)} ms, max ${times[199].toFixed(3)} ms`);
