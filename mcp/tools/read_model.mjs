// The read_model tool: its registration (description, inputs, handler); server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { z } from 'zod';
import { loadModel, unreadableOf, kpisOf } from '../lib/model.mjs';
import { namedTables, isLarge, largeSummary, fullAnswer } from '../lib/scope.mjs';
import { UNTRUSTED } from '../lib/agent-text.mjs';
import { text, compact, safe } from '../lib/tool-answer.mjs';
import { READS, modelPath, readLangInput, strictInputs } from '../lib/tool-inputs.mjs';
import { LIMITS } from '../lib/tool-limits.mjs';
import { hiddenOf } from '../lib/hidden-names.mjs';
import { reach as reachOf } from '../lib/impact.mjs';

export function register(server, ctx) {
  server.registerTool('read_model', {
    title: 'Read a Power BI model',
    description: 'Lists the tables, visible columns (with types), measures (with formats) and date tables of a model, without changing it.' + UNTRUSTED + ' A large model (a full list over 40,000 characters) gets a summary first: counts, the date tables, the areas (measure display folders), the tables with measures and the other tables\' names; ask for the tables you need with tables. Pass lang "ar" when the user writes in Arabic. Impact check, before an edit: reach answers which pages and visuals of the reports beside the model a measure, a column or a table reaches, by tier.',
    inputSchema: strictInputs('read_model', { path: modelPath, tables: z.array(z.string()).min(1).max(LIMITS.tables).optional().describe('Only these tables, in full (names as read_model lists them). For a large model, after its summary'),
      reach: z.string().min(1).max(300).optional().describe('Impact check, before an edit: "[Measure]", "Table[Column]" or "Table" (quote a name with spaces as DAX does: \'Sales Data\'[Amount]). Instead of the model list, the pages and visuals of every report saved beside the model that it reaches, by tier (question: the numbers can change when it changes; display; order), through the measures that call it and the relationships a filter can travel; at most 60 visuals listed, every one counted. Names only, from the files; not with tables'),
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
