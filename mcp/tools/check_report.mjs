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
    description: 'Checks an existing PBIR report, whoever built it, and never changes it: Microsoft\'s report validator (offline, bundled schemas; no network connection) and the rules DataArcus measured in Power BI Desktop (text fits its box, a button keeps its label, a formatting entry Desktop ignores, phone boxes overlap). Each finding names the file, rule, severity, source and a fix in words, never a patch; findings never quote the report\'s text. against: sameQuestion says per visual whether a copy asks the model the same question as the original (from the files, never that the numbers are the same). againstModel: the Impact check after a model edit. likeForLike: visuals comparing the same Gregorian dates of another period, and the months Ramadan or an Eid makes uneven. briefCheck (on the report\'s model): chart columns that cannot move their number (one value on every row), and with brief which questions a visual answers; from the relationships, in doubt "cannot tell". notChecked: what could not be judged (custom visuals among them). ' + ARABIC_LENS + NO_VALUES + REPORT_UNTRUSTED,
    inputSchema: strictInputs('check_report', {
      path: z.string().describe('The report: a .pbip, a .Report folder or a folder holding definition/, in the working folder'),
      checks: z.array(z.enum(CHECKS)).min(1).max(50).optional().describe('Only these checks (default all). validator: Microsoft\'s, offline; schemas: bundled schemas alone; navigation: page buttons; sort: a chart\'s sort field; rtl: right-to-left reports; a11y: alt text, tab order, titles, data colours at 3:1, colour never the only means; lint: the design lint, own section, with the report\'s model; findings marked guess come from names and types, not data: say worth a look'),
      lang: z.enum(['auto', 'en', 'ar', 'he']).default('auto').describe('The report\'s language: en, ar or he (Hebrew; both run the right-to-left rules); auto counts its titles\' and text boxes\' letters (never returned)'),
      maxFindings: z.number().int().min(1).max(200).default(60).describe('At most this many findings (errors first); counts.byRule has every count'),
      against: z.string().optional().describe('The original report (same model, working folder): sameQuestion compares path (its twin or any copy) with it per visual, in three tiers: question (numbers can differ), display (units, decimals), order (sort). Filters, selections and bookmarks compared by hash, never returned'),
      againstModel: z.string().min(1).optional().describe('Impact check: an earlier copy of the model (a backup, a git checkout). impactCheck: visuals that can show another number, by tier, with chains of names; in doubt, it can. Read-only'),
      likeForLike: z.object({ year: z.number().int().min(1900).max(2100).optional().describe('The year to compare month by month; none: a summary by year'), country: z.enum(COUNTRIES).optional().describe('Adds its weekend and VAT rate') }).strict().optional().describe('Gulf like for like, on the report\'s model: each visual whose number passes through SAMEPERIODLASTYEAR, DATEADD, PARALLELPERIOD or a PREVIOUS function, with its chain of names; months whose Ramadan or Eid days differ; missing "Last Ramadan" measures. Names and dates only'),
      brief: z.array(z.object({ id: z.string().max(120).optional().describe('The question as the person asked it, or a label'), measure: z.string().min(1).max(300).describe('"[Revenue]"'), by: z.array(z.string().min(1).max(300)).max(8).describe('"Calendar[Month]"; [] for a total') }).strict()).min(1).max(60).optional().describe('Questions the report must answer, each a measure by columns (confirm with the user): answered (a visual groups it by them; "split further" by more), partly, not answered, or the model cannot answer'),
      lens: z.enum(['arabic']).optional().describe('"arabic": instead of the checks, "Is this report ready for Arabic?" per page, each finding with its fix (a DataArcus call through approval, a Desktop setting, or a line Power BI has no setting for). No validator')
    }), annotations: READS
  }, safe(async (a) => {
    if (a.lens === 'arabic' && a.brief) throw new Error('brief is a section of the checks, and the Arabic lens runs instead of the checks: call check_report once with lens "arabic" and once with brief. Nothing was checked.');
    if (a.lens === 'arabic' && a.likeForLike) throw new Error('likeForLike is a section of the checks, and the Arabic lens runs instead of the checks: call check_report once with lens "arabic" and once with likeForLike. Nothing was checked.');
    return compact(a.lens === 'arabic' ? arabicLens(a.path) : await checkReport(a.path, { checks: a.checks, lang: a.lang, maxFindings: a.maxFindings, against: a.against, againstModel: a.againstModel, likeForLike: a.likeForLike, brief: a.brief }));
  }, { lang: 'given' }));
}
