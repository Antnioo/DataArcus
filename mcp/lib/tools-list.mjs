// The tools/list answer as it is sent (0.3.3 TL1, D-1111-14: every chat starts with it, so every character of it is
// paid in every chat). The SDK builds each tool's listed schema from its zod schema; four keys in it say nothing a
// caller can use, and are left out here, once, for every tool:
//   "$schema"                                  the dialect line, the same on every tool
//   "execution": { "taskSupport": "forbidden" } what a tool without the key already means
//   "propertyNames": { "type": "string" }      a JSON object's keys are always strings
//   "minimum": -9007199254740991, "maximum": 9007199254740991   JavaScript's own safe-integer range (zod's int)
// What a call accepts does not change: the SDK checks every call against the zod schema itself (validateToolInput),
// never against this listing. Every other key (types, enums, required, limits, additionalProperties) is sent as it is.
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const SAFE = Number.MAX_SAFE_INTEGER;
const onlyStringKeys = (v) => v && typeof v === 'object' && Object.keys(v).length === 1 && v.type === 'string';
// a listed schema (or a part of it) without the keys above; the input is not changed
export function leanSchema(node, top = true) {
  if (Array.isArray(node)) return node.map((x) => leanSchema(x, false));
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (top && k === '$schema') continue;
    if (k === 'propertyNames' && onlyStringKeys(v)) continue;
    if ((k === 'minimum' && v === -SAFE) || (k === 'maximum' && v === SAFE)) continue;
    // "properties" maps option names to schemas: an option may be named like a keyword, so its name is never dropped
    out[k] = k === 'properties' && v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([name, s]) => [name, leanSchema(s, false)])) : leanSchema(v, false);
  }
  return out;
}
export function leanTool(tool) {
  const out = Object.assign({}, tool, { inputSchema: leanSchema(tool.inputSchema) });
  if (out.execution && Object.keys(out.execution).length === 1 && out.execution.taskSupport === 'forbidden') delete out.execution;
  return out;
}
// installs it on a server (server.mjs, after the tools are registered): the SDK's own tools/list handler still builds
// the list; its answer is passed through leanTool. A server without that handler (an SDK that moved it) fails at start.
export function leanToolsList(server) {
  const inner = server.server._requestHandlers.get('tools/list');
  if (typeof inner !== 'function') throw new Error('DataArcus: the SDK\'s tools/list handler was not found (lib/tools-list.mjs)');
  server.server.setRequestHandler(ListToolsRequestSchema, async (request, extra) => {
    const answer = await inner(request, extra);
    return Object.assign({}, answer, { tools: (answer.tools || []).map(leanTool) });
  });
}
