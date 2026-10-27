// The read_report tool: its registration (description, inputs, handler); server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { z } from 'zod';
import { readReport } from '../lib/read-report.mjs';
import { REPORT_UNTRUSTED } from '../lib/agent-text.mjs';
import { text, compact, safe } from '../lib/tool-answer.mjs';
import { READS } from '../lib/tool-inputs.mjs';

export function register(server, ctx) {
  server.registerTool('read_report', {
    title: 'Read a Power BI report',
    description: 'Reads a PBIR report that already exists, whoever built it, and never changes it: a compact inventory, one line per visual (its type, place and size on the page, its title when a measure gives it (a typed, static title is never returned, as it can hold a figure or a name: the line says "static title"), the fields in each role with their display names, sort, visual filters by field and kind, the group it sits in, hidden or not, its action or tooltip page), the pages in order (size, hidden, tooltip or drillthrough, page filters), slicers, buttons and their targets, bookmarks (name, page, what they keep), the theme\'s colours and label size, and custom visuals. Read it before a redesign, so the plan keeps the report\'s pages, questions and wiring (bookmarks, tooltip and drillthrough pages). Read it with the model (read_model): the report names fields, the model says their types and sort-by columns. A 4-page report of 160 visuals is about 10,000 to 18,000 characters (2,500 to 4,500 tokens); past 40,000 characters, pages are listed without their visuals and the answer says how to read them (pages). No table data: filter values, slicer selections and bookmark states are read with the report\'s files but never returned. Text-box texts are screened for instructions and length only: long or instruction-like ones are withheld, a short one is returned as typed (a figure or a name a person typed in it included). Custom visuals are listed by type: DataArcus can\'t check their sizes or formats and create_report can\'t write one into a new report; a redesign copies them unchanged (never moved, resized or restyled: the plan lists each as not changed), and a licensed one may ask the viewer to sign in: tell the user, and never replace one unasked.' + REPORT_UNTRUSTED,
    inputSchema: {
      path: z.string().describe('The report: a .pbip file, a .Report folder, or a folder holding definition/, inside the working folder'),
      pages: z.array(z.number().int().min(1).max(500)).min(1).max(50).optional().describe('Only these pages (1 is the first in the report\'s order), for a report too large for one answer'),
      format: z.enum(['text', 'json']).default('text').describe('text (default): one line per visual, the smallest; json: the same as data'),
      from: z.number().int().min(0).max(100000).optional().describe('With pages: start the first page asked at this visual (the answer\'s MORE line, or next.from, gives it when a page is too large for one answer)')
    }, annotations: READS
  }, safe(async (a) => { const r = readReport(a.path, { pages: a.pages, format: a.format, from: a.from }); return typeof r === 'string' ? text(r) : compact(r); }));
}
