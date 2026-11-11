// The check_report tool: its registration (description, inputs, handler); server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { z } from 'zod';
import { CHECKS, checkReport } from '../lib/check-report.mjs';
import { arabicLens } from '../lib/arabic-lens.mjs';
import { ARABIC_LENS, REPORT_UNTRUSTED, NO_VALUES } from '../lib/agent-text.mjs';
import { compact, safe } from '../lib/tool-answer.mjs';
import { READS, strictInputs } from '../lib/tool-inputs.mjs';
import { createRequire } from 'node:module';

// (0.3.3 IX2) the Gulf countries likeForLike takes: gulf-dates.js's own list (one place)
const COUNTRIES = Object.keys(createRequire(import.meta.url)('../../assets/js/gulf-dates.js').weekends);

export function register(server, ctx) {
  server.registerTool('check_report', {
    title: 'Check a Power BI report',
    description: 'Checks a PBIR report that already exists, whoever built it, and never changes it: Microsoft\'s report validator (offline, with the schemas bundled with DataArcus; no network connection is opened) and the rules DataArcus measured in Power BI Desktop (will a text fit its box, will a button cut its label, will Desktop ignore a formatting entry, do phone boxes overlap). Each finding names the file, the rule, its severity, its source and a fix in words, never a patch; findings never quote the report\'s own text. against: sameQuestion says visual by visual whether a copy asks the model the same question as the original (from the files only, never that the numbers are the same). againstModel: the Impact check after a model edit. likeForLike: which visuals compare with the same Gregorian dates of another period, and in which months Ramadan or an Eid makes that uneven. briefCheck (on the report\'s own model): each chart column that cannot move its number (one value on every row), and with brief which questions a visual answers; a rule from the relationships, in doubt "cannot tell". notChecked lists what could not be judged, custom visuals among them. ' + ARABIC_LENS + NO_VALUES + REPORT_UNTRUSTED,
    inputSchema: strictInputs('check_report', {
      path: z.string().describe('The report: a .pbip file, a .Report folder, or a folder holding definition/, inside the working folder'),
      checks: z.array(z.enum(CHECKS)).min(1).max(50).optional().describe('Only these checks (default all). validator: Microsoft\'s, offline; schemas: the bundled schemas alone; navigation: page buttons; sort: a chart\'s sort field; rtl: right-to-left reports only; a11y: alt text, tab order, titles, data colours at 3:1, colour never the only means; lint: the design lint, in its own section, read with the model the report names; its findings marked guess come from names and types, not data: show them as worth a look'),
      lang: z.enum(['auto', 'en', 'ar', 'he']).default('auto').describe('The report\'s language: en, ar (Arabic) or he (Hebrew; both run the right-to-left rules); auto counts the letters of its titles and text boxes (never returned)'),
      maxFindings: z.number().int().min(1).max(200).default(60).describe('At most this many findings (errors first); counts.byRule always has every count'),
      against: z.string().optional().describe('The original report (on the same model, inside the working folder): sameQuestion compares path (its twin, native copy, redesign or hand-made copy) with it visual by visual, in three tiers: question (the numbers can differ), display (units, decimals), order (sort). Filters, selections and bookmarks are compared by hash, never returned'),
      againstModel: z.string().min(1).optional().describe('Impact check: an earlier copy of the model (a backup, a git checkout). impactCheck: which visuals can show another number, by tier, each with its chain of names; in doubt, it can. Read-only'),
      likeForLike: z.object({ year: z.number().int().min(1900).max(2100).optional().describe('The year to compare month by month; none: a summary by year'), country: z.enum(COUNTRIES).optional().describe('Adds its weekend and VAT rate') }).strict().optional().describe('Like for like in the Gulf, read on the report\'s own model: each visual whose number passes through SAMEPERIODLASTYEAR, DATEADD, PARALLELPERIOD or a PREVIOUS function, with its chain of names; the months whose Ramadan or Eid days differ; the "Last Ramadan" measures missing. Names and dates only'),
      brief: z.array(z.object({ id: z.string().max(120).optional().describe('The question as the person asked it, or a label'), measure: z.string().min(1).max(300).describe('"[Revenue]"'), by: z.array(z.string().min(1).max(300)).max(8).describe('"Calendar[Month]"; [] for a total') }).strict()).min(1).max(60).optional().describe('The questions the report must answer, each a measure by columns (confirm them with the user): answered (a visual groups it by them; "answers it, split further" by more), partly, not answered, or this model cannot answer'),
      lens: z.enum(['arabic']).optional().describe('"arabic": instead of the checks, "Is this report ready for Arabic?" page by page, each finding with its fix (a DataArcus call through approval, a setting in Power BI Desktop, or a line Power BI has no setting for). The validator is not run')
    }), annotations: READS
  }, safe(async (a) => {
    if (a.lens === 'arabic' && a.brief) throw new Error('brief is a section of the checks, and the Arabic lens runs instead of the checks: call check_report once with lens "arabic" and once with brief. Nothing was checked.');
    if (a.lens === 'arabic' && a.likeForLike) throw new Error('likeForLike is a section of the checks, and the Arabic lens runs instead of the checks: call check_report once with lens "arabic" and once with likeForLike. Nothing was checked.');
    return compact(a.lens === 'arabic' ? arabicLens(a.path) : await checkReport(a.path, { checks: a.checks, lang: a.lang, maxFindings: a.maxFindings, against: a.against, againstModel: a.againstModel, likeForLike: a.likeForLike, brief: a.brief }));
  }, { lang: 'given' }));
}
