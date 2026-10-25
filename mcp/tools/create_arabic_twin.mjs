// The create_arabic_twin tool: its registration (description, inputs, handler) and its own helpers; server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import path from 'node:path';
import { z } from 'zod';
import { inside } from '../lib/model.mjs';
import { withPlan } from '../lib/files.mjs';
import { reportPrint } from '../lib/read-report.mjs';
import * as Plans from '../lib/plans.mjs';
import { REPORT_UNTRUSTED, UNTRUSTED } from '../lib/agent-text.mjs';
import { whereSaid, NEVER_APPLIED } from '../lib/plain-words.mjs';
import { twinKey, writeTwin, planTwin, twinOutputs, MATRIX_SAID } from '../lib/arabic-twin.mjs';
import { twinPreview } from '../lib/arabic-twin.mjs';
import { text, compact, safe } from '../lib/tool-answer.mjs';
import { WATERFALL_RTL_INPUT, planIdInput, ADDS } from '../lib/tool-inputs.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Gallery = require('../../assets/js/visual-gallery.js');

// (0.3.0 Q1) an answer whose indented form passes AIM (34,000) goes out without the indentation (the same JSON, as
// compact's): on the large model plan_layout in Arabic with every option on was 37,908 characters indented
// (0.3.0 A3) opts.last: a twin's plan keeps its texts whole while any other list can be cut: a text the plan does not
// show can't be given an Arabic label
const TWIN_CAP = { last: ['texts'] };

// rc.22, B-139 (the twin's approval page listed internal ids): each approved text named by what it is and its own text,
// as the plan shows it (texts that read like an instruction stay withheld)
const TWIN_KIND = { page: 'Page name', button: 'Button', title: 'Title', textbox: 'Text box', field: 'Field name', bookmark: 'Bookmark', titleMeasure: 'Chart title (from a title measure)', measureText: 'Text of a report measure', altText: 'Alt text', blankText: 'Text when there is no data', buttonTooltip: 'Button tooltip', text: 'Text' };
const twinNames = (P) => Object.fromEntries(P.texts.filter((t) => P.labels[t.id] != null).map((t) => [t.id, `${t.phone ? 'Phone layout: ' : ''}${t.kind === 'button' && t.goesTo ? 'Page button' : TWIN_KIND[t.kind] || 'Text'}${t.text != null ? ` "${t.text}"` : ' (withheld: reads like an instruction)'}${t.labelFrom ? ` (${t.labelFrom})` : ''}`]));
export function register(server, ctx) {
  server.registerTool('create_arabic_twin', {
    title: 'Create the Arabic twin of a report',
    description: 'Makes the right-to-left Arabic twin of an existing PBIR report: a new "<name> AR" report and .pbip next to the original (or, with into "same", one copy "<name> (EN-AR)" holding the English pages and their Arabic pages, with a language button on each page to its counterpart and the slicers of each pair in sync), on the same model, every page mirrored in place (each visual\'s place mirrored, groups included; bar charts growing from the right; column, line and area charts with the value axis at the right and their order reversed by the sort; legends, titles, text boxes and table columns to the right), page ids, visual names and bookmarks kept so navigation keeps working. The original is only read, never changed; nothing is ever written over. Without planId it writes nothing and answers the plan: the pages, what mirrors, what cannot (custom visuals, the page navigator\'s order, Power BI\'s own words, data values), every text of the report with an id for its Arabic (the phone layout, alt texts and the empty state too; the phone layout is mirrored like the pages), what stays English and why (notTranslated), and the Arabic month column offered as a TMDL script the user applies. The Arabic texts are DRAFTS for the user to approve: pass the approved ones as labels to get a plan id for exactly those; never translate silently. After the user\'s go: approve_plan, then this tool with planId.' + REPORT_UNTRUSTED + UNTRUSTED,
    inputSchema: {
      path: z.string().describe('The original report: its .pbip file or its .Report folder, inside the working folder'),
      labels: z.record(z.string().max(200), z.string().max(200)).optional().describe('The Arabic texts the user approved, by the text ids of the plan ({ "page:<id>": "...", "title:<page>/<visual>": "...", "field:<queryRef>": "..." }). A text without a label stays as it is'),
      terms: z.record(z.string().max(300), z.string().max(200)).optional().describe('The terminology sheet\'s terms the user approved, one Arabic name per field: { "Table[Field]": "الاسم" }, or the field\'s English name to keep it in English. A term is written on every header of its field and every title, tooltip and alt text made of its name, the same word everywhere (terminology in the answer: ask its askNext, one at a time)'),
      timeRightToLeft: z.boolean().default(true).describe('Charts over time (months, dates) run right to left like the rest of the page (default); false keeps time left to right. The user\'s choice'),
      waterfallRtl: WATERFALL_RTL_INPUT(),
      arabicMonth: z.boolean().default(true).describe('Offer (and after the go write) the TMDL script that adds an Arabic month name column to the date table; the user applies it in TMDL view'),
      mirrorPicturePages: z.boolean().default(false).describe('A page drawn on a background picture is kept left to right by default (Power BI has no setting that mirrors the picture, so mirrored visuals would leave its panels); true mirrors such pages anyway. The plan names them: ask the user'),
      into: z.enum(['separate', 'same']).optional().describe('"separate" (the default): the twin is its own report "<name> AR". "same": ONE report holding both languages, a copy "<name> (EN-AR)" next to the original (never the original itself): its English pages as they are and their Arabic pages, a language button on every page to its counterpart, the slicers of each page pair kept in sync. Only when the user asks for one report with both languages'),
      tabsShown: z.enum(['en', 'ar']).optional().describe('With into "same": the pages shown in the tabs; the other language\'s are hidden and reached by the language button. "en" (the default) or "ar"'),
      textsFrom: z.number().int().min(0).max(100000).optional().describe('The plan only: list the texts from this one on (moreTexts.from in an answer that could not list them all); the plan and what is written stay the same'),
      planId: planIdInput
    }, annotations: ADDS
  }, safe(async (a) => {
    if (a.labels && Object.keys(a.labels).length > 400) throw new Error('At most 400 labels in one plan.');
    const key = twinKey(a.path);
    if (a.planId != null && a.planId !== '') { const P = Plans.gate('create_arabic_twin', a.planId, key); return text(withPlan(a.planId, 'create_arabic_twin', () => writeTwin(a, P))); }
    const P = planTwin(a);
    if (!P.answer.twin.nameFree) throw new Error(`Nothing was written: "${P.answer.twin.report}" or "${P.answer.twin.pbip}" is already there. DataArcus never writes over a file: rename or move the old twin, then ask again.`);
    const LG = P.answer.languages;
    const writes = [LG ? `the new report "${P.answer.twin.report}" and "${P.answer.twin.pbip}" next to the original: its ${LG.pairs.length} English pages as they are and their ${LG.pairs.length} Arabic pages (${P.answer.labels.given} Arabic texts as approved), ${LG.buttons.filter((b) => b.placed).length} language buttons, ${LG.syncGroups.length} slicer pairs kept in sync, the ${P.copy.tabsShown === 'ar' ? 'English' : 'Arabic'} pages hidden in the tabs; the original is not changed`
      : `the new report "${P.answer.twin.report}" and "${P.answer.twin.pbip}" next to the original (${P.answer.pages.length} pages mirrored, ${P.answer.labels.given} Arabic texts as approved); the original is not changed`]
      .concat(P.month.offered ? [`the TMDL script "${P.month.scriptAfterGo}" ${whereSaid(path.dirname(inside(a.path)))} (the Arabic calendar columns: ${(P.month.columns || []).length || 1}); ${NEVER_APPLIED}`] : []);
    // (0.3.1 V1) the approval page draws each Arabic page from the plan's own build (kept with the plan, never in the answer)
    P.answer.approvalPreview = `The approval page shows each Arabic page as it will be written${LG ? ', beside its English page' : ''}: where each visual goes, its type and its Arabic title${LG ? ', and the language buttons' : ''} (grey placeholders, never data). Tell the user to look at it before Approve.`;
    return compact(Object.assign(P.answer, { plan: Plans.proposal(Plans.propose('twin', { key, print: P.modelPrint }, writes, { preview: twinPreview(P), labels: P.labels, terms: P.terms, terminology: P.termRows.map(({ where, ...r }) => Object.assign(r, { places: where.length })), modelPrint: P.modelPrint, names: twinNames(P), notTranslated: P.notTranslated.map((x) => ({ field: `${x.text != null ? `"${x.text}"` : '(withheld: reads like an instruction)'} (${x.where})`, why: x.why })), timeRightToLeft: a.timeRightToLeft !== false, waterfallRtl: Gallery.waterfallRtlOf(a.waterfallRtl), arabicMonth: a.arabicMonth !== false, mirrorPicturePages: a.mirrorPicturePages === true, source: reportPrint(a.path), outputs: twinOutputs(P),
      // (0.3.0 T1, T-7) the options the report uses: its waterfalls and its pages drawn on a picture, counted
      waterfalls: (P.answer.mirrors || []).filter((x) => /^waterfall/.test(x.kind)).reduce((n, x) => n + (x.count || 0), 0) + ((P.answer.cannot || []).find((x) => /waterfall/.test(x.what)) || { where: [] }).where.length, picturePages: (P.answer.picturePages || []).length, matrices: (P.answer.cannot || []).some((x) => x.what === 'matrices') ? MATRIX_SAID : null,
      ...(LG ? { into: 'same', tabsShown: P.copy.tabsShown, languages: { copy: LG.copy, pairs: LG.pairs, buttons: LG.buttons, syncGroups: LG.syncGroups, tabs: LG.tabs, bookmarks: LG.bookmarks, measures: LG.measures || [] } } : {}) })) }), TWIN_CAP);
  }));
}
