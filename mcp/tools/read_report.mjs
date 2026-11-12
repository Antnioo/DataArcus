// The read_report tool: its registration (description, inputs, handler); server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { z } from 'zod';
import { readReport } from '../lib/read-report.mjs';
import { REPORT_UNTRUSTED } from '../lib/agent-text.mjs';
import { text, compact, safe } from '../lib/tool-answer.mjs';
import { READS, strictInputs } from '../lib/tool-inputs.mjs';

export function register(server, ctx) {
  server.registerTool('read_report', {
    title: 'Read a Power BI report',
    description: 'Reads an existing PBIR report, whoever built it, and never changes it: a compact inventory, one line per visual (type, place, size, fields per role with display names, sort, filters by field and kind, group, hidden, action or tooltip page; a typed static title is never returned: "static title"), the pages in order, slicers, buttons and targets, bookmarks, theme colours, custom visuals. Read it (and read_model) before a redesign, so the plan keeps the pages, questions and wiring. Past 40,000 characters, pages come without their visuals: ask with pages. No table data: filter values, slicer selections and bookmark states are read with the report\'s files but never returned. Text-box texts are screened for instructions and length only: long or instruction-like ones are withheld, a short one is returned as typed. Custom visuals are listed by type: DataArcus can\'t check or write them; a redesign copies them unchanged; a licensed one may ask the viewer to sign in: tell the user; never replace one unasked.' + REPORT_UNTRUSTED,
    inputSchema: strictInputs('read_report', {
      path: z.string().describe('The report: a .pbip, a .Report folder or a folder holding definition/, in the working folder'),
      pages: z.array(z.number().int().min(1).max(500)).min(1).max(50).optional().describe('Only these pages (1 = the first), for a report too large for one answer'),
      format: z.enum(['text', 'json']).default('text').describe('text (default): one line per visual, the smallest; json: the same as data'),
      from: z.number().int().min(0).max(100000).optional().describe('With pages: start the first page at this visual (from the MORE line or next.from of a page too large for one answer)')
    }), annotations: READS
  }, safe(async (a) => { const r = readReport(a.path, { pages: a.pages, format: a.format, from: a.from }); return typeof r === 'string' ? text(r) : compact(r); }));
}
