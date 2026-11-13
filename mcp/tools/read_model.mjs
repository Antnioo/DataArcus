// The read_model tool: its registration (description, inputs, handler); server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { z } from 'zod';
import { loadModel, unreadableOf, kpisOf } from '../lib/model.mjs';
import { namedTables, isLarge, largeSummary, fullAnswer } from '../lib/scope.mjs';
import { UNTRUSTED, LANG_AR, NO_VALUES } from '../lib/agent-text.mjs';
import { text, compact, safe } from '../lib/tool-answer.mjs';
import { READS, modelPath, readLangInput, strictInputs } from '../lib/tool-inputs.mjs';
import { LIMITS } from '../lib/tool-limits.mjs';
import { hiddenOf } from '../lib/hidden-names.mjs';
import { reach as reachOf } from '../lib/impact.mjs';

export function register(server, ctx) {
  server.registerTool('read_model', {
    title: 'Read a Power BI model',
    description: 'Lists a model\'s tables, visible columns (with types), measures (with formats) and date tables, without changing it. A large model (over 40,000 characters) gets a summary first (counts, date tables, areas, table names): ask for the tables you need with tables. reach: the Impact check before an edit.' + LANG_AR + NO_VALUES + UNTRUSTED,
    inputSchema: strictInputs('read_model', { path: modelPath, tables: z.array(z.string()).min(1).max(LIMITS.tables).optional().describe('Only these tables, in full (as listed). For a large model, after its summary'),
      reach: z.string().min(1).max(300).optional().describe('Impact check before an edit: "[Measure]", "Table[Column]" or "Table". Instead of the list: the visuals it reaches in the reports beside the model, by tier. Not with tables'),
      lang: readLangInput }), annotations: READS
  }, safe(async ({ path: p, tables, reach }) => {
    // (0.3.3 HX2) reach: the Impact check before an edit, in place of the model list
    if (reach != null) {
      if (tables) throw new Error('read_model takes reach or tables, not both: reach answers the visuals a measure, a column or a table reaches; tables lists tables in full. Call once for each.');
      const m = loadModel(p);
      return compact(Object.assign({}, unreadableOf(m), { reach: reachOf(p, reach) }));
    }
    // (AU47) a definition file that could not be read fully is named first, before the part that was read
    const m = loadModel(p), first = unreadableOf(m);
    // (SQ15a) each KPI and its target: a measure, or "an expression" (its text never)
    if (tables) return text(Object.assign({}, first, namedTables(m, tables, hiddenOf(m)), kpisOf(m), hiddenOf(m)));
    return isLarge(m) ? compact(Object.assign({}, first, largeSummary(m), kpisOf(m), hiddenOf(m))) : text(Object.assign({}, first, fullAnswer(m), kpisOf(m), hiddenOf(m)));
  }, { lang: true }));
}
