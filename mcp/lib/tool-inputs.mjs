// The input schemas more than one tool takes (zod), and the annotations that say what a tool does to the user's files.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { z } from 'zod';
import { VISUAL_KINDS } from './tool-limits.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Gallery = require('../../assets/js/visual-gallery.js');

// (D7, the owner of 20 Oct) a right-to-left report's waterfall: Power BI's own ("native", the default) or the mirrored look-alike
export const WATERFALL_RTL_INPUT = () => z.enum(Gallery.WATERFALL_RTL).optional().describe(`(Default "${Gallery.WATERFALL_RTL_DEFAULT}".) Only for a right-to-left (Arabic) report\'s waterfall. "native": Power BI\'s own waterfall, exactly as in English: ${Gallery.WF_WHAT.native}; the rest of the report stays mirrored. "mirror": a stacked column chart drawn as a waterfall that reads from the right (the first period at the right), but not Power BI\'s waterfall design: no Total column and no total label (Power BI 2.159 does not draw it), no legend, the empty space under a step shows its base in the tooltip. Power BI cannot draw its own waterfall right to left. The user\'s choice; say it in the plan`);
// What a tool does to the user's files, for the AI app: four tools only read; the two that write only add new files
// (never change or delete one) and stay inside the working folder. check_model_health adds files too: its fix scripts
// The plan id every writing tool takes (0.2.9, the gate inside the tools: see lib/plans.mjs)
export const planIdInput = z.string().max(40).optional().describe('The approved plan id (from plan_layout, or from this tool\'s own answer without one, then approve_plan after the user\'s go). Without an approved planId this tool writes nothing and answers with what it would write and a proposed planId');
export const READS = { readOnlyHint: true, openWorldHint: false }, ADDS = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
// the part of a large model a request is about (see lib/scope.mjs)
export const focusInput = z.string().min(1).max(80).optional().describe('On a large model: the part of the model the user asked about, in their words ("logistics", "sales"). The picks then come from the tables whose name or whose measures\' display folder contains it, the tables related to them and the date table. A large model needs a focus or tables');
export const tablesInput = z.array(z.string()).min(1).max(60).optional().describe('Instead of a focus: the tables to pick from, by name (the tables related to them and the date table are added)');
export const modelPath = z.string().describe('A Power BI project folder, its .SemanticModel folder, a model.bim or a .pbit, relative to the DataArcus folder');

export const pageInput = z.union([z.enum(['1920x1080', '1280x720', '960x720']), z.object({ w: z.number(), h: z.number() })])
  .describe('Power BI page size: 1920x1080 (default), 1280x720, 960x720, or { w, h } (640-3840 x 360-2160, shaped 4:3 to 2.4:1; other sizes are fitted as the website does)');
export const langInput = z.enum(['en', 'ar']).default('en').describe('Language of the report: names in it, and right to left when dir is not given');
export const slot = z.object({
  kind: z.enum(VISUAL_KINDS),
  title: z.string().optional(), x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive(),
  text: z.string().min(1).max(400).optional().describe('A text slot\'s sentence (from the approved plan); a text slot without one is left out')
});
