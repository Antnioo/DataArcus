// The check_report tool: its registration (description, inputs, handler); server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { z } from 'zod';
import { CHECKS, checkReport } from '../lib/check-report.mjs';
import { arabicLens } from '../lib/arabic-lens.mjs';
import { ARABIC_LENS, REPORT_UNTRUSTED } from '../lib/agent-text.mjs';
import { compact, safe } from '../lib/tool-answer.mjs';
import { READS } from '../lib/tool-inputs.mjs';

export function register(server, ctx) {
  server.registerTool('check_report', {
    title: 'Check a Power BI report',
    description: 'Checks a PBIR report that already exists, whoever built it, and never changes it: Microsoft\'s report validator (offline: the JSON schemas it would download are checked against Microsoft\'s own copies bundled with DataArcus; no network connection is opened) and the rules DataArcus measured in Power BI Desktop (will a text fit its box, will a button cut its label, will Desktop ignore a formatting entry, do phone boxes overlap). Each finding names the file, the rule, its severity, where the rule comes from (the validator\'s code, or the measurement with its date and Desktop version) and a fix in words, never a patch. Findings never quote the report\'s own text, and filter values, slicer selections and bookmark states are never returned. notChecked lists what could not be judged, custom visuals among them (counted: their sizes and formats are not judged). ' + ARABIC_LENS + REPORT_UNTRUSTED,
    inputSchema: {
      path: z.string().describe('The report: a .pbip file, a .Report folder, or a folder holding definition/, inside the working folder'),
      checks: z.array(z.enum(CHECKS)).min(1).optional().describe('Only these checks (default all): validator (Microsoft\'s, offline, with the bundled schemas), schemas (the bundled schemas alone), sizes, selectors, phone, tooltips, theme, navigation (page buttons), sort (a chart\'s sort field), rtl (right-to-left reports only), a11y (Power BI\'s accessibility basics from Microsoft\'s guidance: alt text, tab order in reading order, titles, data colours at 3:1, colour never the only means), lint (the design lint, in its own section: a time axis sorted A to Z, cut bar labels, tables that grow past their width, missing titles, placeholder text, overlaps, visuals off the page; read with the model the report names; findings marked guess come from names and types, not data: show them as worth a look)'),
      lang: z.enum(['auto', 'en', 'ar']).default('auto').describe('The report\'s language: auto counts the letters of its titles and text boxes (never returned)'),
      maxFindings: z.number().int().min(1).max(200).default(60).describe('At most this many findings (errors first); counts.byRule always has every count'),
      lens: z.enum(['arabic']).optional().describe('"arabic": instead of the checks, answer "Is this report ready for Arabic?" page by page (the reading direction, texts, charts, tables, calendar names, slicers and navigation), each finding with its fix: a DataArcus call through approval, a setting in Power BI Desktop, or a line Power BI has no setting for. Read-only; the validator is not run')
    }, annotations: READS
  }, safe(async (a) => compact(a.lens === 'arabic' ? arabicLens(a.path) : await checkReport(a.path, { checks: a.checks, lang: a.lang, maxFindings: a.maxFindings }))));
}
