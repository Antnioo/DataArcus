// The input schemas more than one tool takes (zod), and the annotations that say what a tool does to the user's files.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { z } from 'zod';
import { VISUAL_KINDS, LIMITS } from './tool-limits.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Gallery = require('../../assets/js/visual-gallery.js');

// (D7, the owner of 20 Oct) a right-to-left report's waterfall: Power BI's own ("native", the default) or the mirrored look-alike
export const WATERFALL_RTL_INPUT = () => z.enum(Gallery.WATERFALL_RTL).optional().describe(`(Default "${Gallery.WATERFALL_RTL_DEFAULT}".) Only for a right-to-left (Arabic) report\'s waterfall. "native": Power BI\'s own: ${Gallery.WF_WHAT.native}. "mirror": a stacked column chart drawn as a waterfall that reads from the right: no Total column, no total label, no legend. The user\'s choice; say it in the plan`);
// What a tool does to the user's files, for the AI app: four tools only read; the two that write only add new files
// (never change or delete one) and stay inside the working folder. check_model_health adds files too: its fix scripts
// The plan id every writing tool takes (0.2.9, the gate inside the tools: see lib/plans.mjs)
export const planIdInput = z.string().max(40).optional().describe('The approved plan id (this tool\'s own proposal, approved in approve_plan after the user\'s go). Without it nothing is written and the answer proposes one');
export const READS = { readOnlyHint: true, openWorldHint: false }, ADDS = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
// (SQ9, 0.2.9-design-S8) a tool whose repeat writes nothing new: a second plan on the same model names the same files, already
// there with the same content, and writes none of them again (check_model_health's scripts, add_gulf_calendar's); the same
// planId again is refused. The other writing tools stay ADDS: a repeat writes another file ("brand-2.json", "- New design")
export const ADDS_SAME = Object.assign({}, ADDS, { idempotentHint: true });
// the part of a large model a request is about (see lib/scope.mjs)
export const focusInput = z.string().min(1).max(80).optional().describe('On a large model (it needs a focus or tables): the part the user asked about, in their words ("logistics", "sales"); the picks come from the tables it names, their related tables and the date table');
export const tablesInput = z.array(z.string()).min(1).max(LIMITS.tables).optional().describe('Instead of a focus: the tables to pick from, by name (their related tables and the date table are added)');
export const modelPath = z.string().describe('A Power BI project folder, its .SemanticModel folder, a model.bim or a .pbit, relative to the DataArcus folder');

export const pageInput = z.union([z.enum(['1920x1080', '1280x720', '960x720']), z.object({ w: z.number(), h: z.number() })])
  .describe('Page size: 1920x1080 (default), 1280x720, 960x720 or { w, h } (640-3840 x 360-2160, shaped 4:3 to 2.4:1; other sizes are fitted)');
// (0.3.2 LG1, D-1105-16) the person's language for a reading tool's answer words (the "several models" error): optional,
// no default, so without it read-words.mjs keeps AR4's rule (Arabic letters in the path or a tied folder)
export const readLangInput = z.enum(['en', 'ar']).optional().describe('The user\'s language: "ar" when the user writes in Arabic (even when the folder names are English), else "en"; an answer about which model is meant is said in it');
export const langInput = z.enum(['en', 'ar']).default('en').describe('Language of the report: names in it, and right to left when dir is not given');
export const slot = z.object({
  kind: z.enum(VISUAL_KINDS),
  title: z.string().optional(), x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive(),
  text: z.string().min(1).max(400).optional().describe('A text slot\'s sentence (from the approved plan); a text slot without one is left out')
});
// (0.3.1 FX5b) the model's own counts as suggest_fields takes them (FX4's columnStats, the same shape), for create_report
// and plan_layout: whole numbers only, so no data value can be passed
export const columnStatsShape = () => z.object({ rows: z.record(z.string(), z.number().int().min(0)).optional(), distinct: z.record(z.string(), z.number().int().min(0)).optional() }).strict();
// (0.3.1 MR1, B-270: the MCP review) a tool's inputs as a strict object: an input the tool does not have (a misspelled
// option) is refused and named, never stripped silently (the agent would believe its option applied). zod's own words
// ("Unrecognized key") do not say what to do; these do. Every tools/*.mjs registers its inputSchema through it.
// (0.3.2 TK1, B-281) at most KEYS_SHOWN keys named, and how many more
const KEYS_SHOWN = 20;
export const keysSaid = (keys) => keys.slice(0, KEYS_SHOWN).map((k) => `'${String(k).slice(0, 60)}'`).join(', ') + (keys.length > KEYS_SHOWN ? ` and ${keys.length - KEYS_SHOWN} more` : '');
export const unknownKeysSaid = (what, keys, known) => `Unrecognized key${keys.length === 1 ? '' : 's'} ${keysSaid(keys)}; ${what} are: ${known.join(', ')}. Call again without ${keys.length === 1 ? 'it' : 'them'} (or with the input you meant).`;
const strictAs = (what, shape, said) => z.strictObject(shape, { error: (iss) => (iss.code === 'unrecognized_keys' ? (said || ((keys) => unknownKeysSaid(what, keys, Object.keys(shape))))(iss.keys) : undefined) });
// a tool's whole inputs; and an option object inside them that a person types by hand (MR1.md "Decisions")
// (0.3.2 TK1) said(keys): a tool's own words for its unknown keys (create_report: the ones the approved plan holds)
export const strictInputs = (tool, shape, said) => strictAs(`the inputs of ${tool}`, shape, said);
export const strictObject = (option, shape) => strictAs(`the keys of ${option}`, shape);
