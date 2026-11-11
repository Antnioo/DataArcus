// The suggest_fields tool: its registration (description, inputs, handler); server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { z } from 'zod';
import { loadModel, unreadableOf } from '../lib/model.mjs';
import { scopeOf } from '../lib/scope.mjs';
import { UNTRUSTED, LANG_AR, NO_VALUES } from '../lib/agent-text.mjs';
import { text, safe } from '../lib/tool-answer.mjs';
import { READS, focusInput, tablesInput, modelPath, strictInputs } from '../lib/tool-inputs.mjs';
import { hiddenOf } from '../lib/hidden-names.mjs';
import { relsOf } from '../lib/report-fields.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Bind = require('../../assets/js/pbip-bind.js');

export function register(server, ctx) {
  const { LIMITS } = ctx;
  server.registerTool('suggest_fields', {
    title: 'Suggest fields for a report design',
    description: 'Picks which of the model\'s measures and columns go in each KPI card, chart, table and slicer, the way the DataArcus theme generator does (base measures first, month from the date table; no keys, hidden or mostly unique columns as categories); why says each rule that acted. Read-only.' + LANG_AR + NO_VALUES + UNTRUSTED,
    inputSchema: strictInputs('suggest_fields', { path: modelPath, kpis: z.number().int().min(1).max(LIMITS.kpiCards).default(4).describe(`Number of KPI cards (1-${LIMITS.kpiCards})`), focus: focusInput, tables: tablesInput,
      lang: z.enum(['en', 'ar']).optional().describe('The report\'s language: on a model with columns in both languages (City and المدينة) only that language\'s columns are picked (language says what was skipped). Also the language of an answer about which model is meant: "ar" when the user writes in Arabic'),
      // (0.3.1 FX4, D-1028-04) the model's own counts: whole numbers only, so no data value can be passed
      columnStats: z.object({ rows: z.record(z.string(), z.number().int().min(0)).optional(), distinct: z.record(z.string(), z.number().int().min(0)).optional() }).strict().optional()
        .describe('Counts only, never values, when Desktop has the model open: distinct: { "Table[Column]": its distinct count (Cardinality from COLUMNSTATISTICS(); never pass its Min or Max) }, rows: { "Table": its row count }. They rule out categories of one value or of mostly unique values; without them only the name rules apply (countsNote)') }), annotations: READS
  }, safe(async ({ path: p, kpis, focus, tables, lang, columnStats }) => {
    const m = loadModel(p), sc = scopeOf(m, { focus, tables });
    // a large model without a focus, or a focus that matches nothing: no picks, and what to ask the user
    // (ST1, AU47-S2) a definition file that could not be read fully is said first, as read_model says it (never silently)
    if (sc.needsFocus) return text(Object.assign(unreadableOf(m), sc));
    const b = Bind.suggest(sc.tables, kpis, Object.assign(relsOf(m, lang), columnStats ? { stats: columnStats } : {})); delete b.choices; delete b.catPool;
    // (FX4) without the model's counts only the name and type rules pick the categories: said
    if (!columnStats) b.countsNote = 'Distinct counts were not available (none given; a model file holds none), so only the name and type rules were used: a column with one value or mostly unique values may still be picked. With the model open in Desktop, pass columnStats.';
    // measures left behind (old, test, unused, backup, temp in the name) are picked only when nothing else is left: said here
    if (b.skipped) b.skipped = { measures: b.skipped.map((x) => `${x.t}[${x.m}]`), why: 'Not picked: the name has the word old, test, unused, backup or temp, and other measures were there. Ask the user before using one; to use it anyway, name it in create_report\'s fields.' };
    // no measures at all: said, with what to propose (a card or a chart shows a measure, never a bare column)
    const none = sc.tables.every((t) => !(t.measures || []).some((x) => !x.isHidden)) ? { noMeasures: 'This model has no measures, so no KPI card or chart can be bound (the picks are empty). Propose measures to the user, each with its DAX and its format string, for the user to add in Power BI Desktop: #,0 for whole numbers and counts, #,0.00 for amounts with decimals, 0.0% for ratios and rates. Nothing is written until the measures exist.' } : {};
    return text(Object.assign(unreadableOf(m), sc.scope ? { scope: sc.scope } : {}, none, b, hiddenOf(m)));
  }, { lang: true }));
}
