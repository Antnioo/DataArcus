// The read_model tool: its registration (description, inputs, handler); server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { z } from 'zod';
import { loadModel, unreadableOf } from '../lib/model.mjs';
import { namedTables, isLarge, largeSummary, fullAnswer } from '../lib/scope.mjs';
import { UNTRUSTED } from '../lib/agent-text.mjs';
import { text, compact, safe } from '../lib/tool-answer.mjs';
import { READS, modelPath } from '../lib/tool-inputs.mjs';
import { hiddenOf } from '../lib/hidden-names.mjs';

export function register(server, ctx) {
  server.registerTool('read_model', {
    title: 'Read a Power BI model',
    description: 'Lists the tables, visible columns (with types), measures (with formats) and date tables of a model, without changing it.' + UNTRUSTED + ' A large model (a full list over 40,000 characters) gets a summary first: counts, the date tables, the areas (measure display folders), the tables with measures and the other tables\' names; ask for the tables you need with tables.',
    inputSchema: { path: modelPath, tables: z.array(z.string()).min(1).max(100).optional().describe('Only these tables, in full (names as read_model lists them). For a large model, after its summary') }, annotations: READS
  }, safe(async ({ path: p, tables }) => {
    // (AU47) a definition file that could not be read fully is named first, before the part that was read
    const m = loadModel(p), first = unreadableOf(m);
    if (tables) return text(Object.assign({}, first, namedTables(m, tables, hiddenOf(m)), hiddenOf(m)));
    return isLarge(m) ? compact(Object.assign({}, first, largeSummary(m), hiddenOf(m))) : text(Object.assign({}, first, fullAnswer(m), hiddenOf(m)));
  }));
}
