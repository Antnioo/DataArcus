// The suggest_fields tool: its registration (description, inputs, handler); server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { z } from 'zod';
import { loadModel, unreadableOf } from '../lib/model.mjs';
import { scopeOf } from '../lib/scope.mjs';
import { UNTRUSTED } from '../lib/agent-text.mjs';
import { text, safe } from '../lib/tool-answer.mjs';
import { READS, focusInput, tablesInput, modelPath } from '../lib/tool-inputs.mjs';
import { hiddenOf } from '../lib/hidden-names.mjs';
import { relsOf } from '../lib/report-fields.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Bind = require('../../assets/js/pbip-bind.js');

export function register(server, ctx) {
  const { LIMITS } = ctx;
  server.registerTool('suggest_fields', {
    title: 'Suggest fields for a report design',
    description: 'Picks which of the model\'s measures and columns go in each KPI card, chart, table and slicer, the way the DataArcus theme generator does (base measures first, month from the date table, no keys or hidden fields).' + UNTRUSTED,
    inputSchema: { path: modelPath, kpis: z.number().int().min(1).max(LIMITS.kpiCards).default(4).describe(`Number of KPI cards (1-${LIMITS.kpiCards}, as plan_layout and create_report take)`), focus: focusInput, tables: tablesInput,
      lang: z.enum(['en', 'ar']).optional().describe('The report\'s language: pass it. On a model with columns in both languages (City and المدينة) only the columns in that language are picked (language: what was skipped); an English report uses an Arabic column only when it has no other') }, annotations: READS
  }, safe(async ({ path: p, kpis, focus, tables, lang }) => {
    const m = loadModel(p), sc = scopeOf(m, { focus, tables });
    // a large model without a focus, or a focus that matches nothing: no picks, and what to ask the user
    // (ST1, AU47-S2) a definition file that could not be read fully is said first, as read_model says it (never silently)
    if (sc.needsFocus) return text(Object.assign(unreadableOf(m), sc));
    const b = Bind.suggest(sc.tables, kpis, relsOf(m, lang)); delete b.choices; delete b.catPool;
    // measures left behind (old, test, unused, backup, temp in the name) are picked only when nothing else is left: said here
    if (b.skipped) b.skipped = { measures: b.skipped.map((x) => `${x.t}[${x.m}]`), why: 'Not picked: the name has the word old, test, unused, backup or temp, and other measures were there. Ask the user before using one; to use it anyway, name it in create_report\'s fields.' };
    // no measures at all: said, with what to propose (a card or a chart shows a measure, never a bare column)
    const none = sc.tables.every((t) => !(t.measures || []).some((x) => !x.isHidden)) ? { noMeasures: 'This model has no measures, so no KPI card or chart can be bound (the picks are empty). Propose measures to the user, each with its DAX and its format string, for the user to add in Power BI Desktop: #,0 for whole numbers and counts, #,0.00 for amounts with decimals, 0.0% for ratios and rates. Nothing is written until the measures exist.' } : {};
    return text(Object.assign(unreadableOf(m), sc.scope ? { scope: sc.scope } : {}, none, b, hiddenOf(m)));
  }));
}
