// The create_arabic_twin tool: its registration (description, inputs, handler) and its own helpers; server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import path from 'node:path';
import { z } from 'zod';
import { inside } from '../lib/model.mjs';
import { withPlan } from '../lib/files.mjs';
import { reportPrint } from '../lib/read-report.mjs';
import * as Plans from '../lib/plans.mjs';
import { REPORT_UNTRUSTED, UNTRUSTED, APPROVAL, NO_VALUES } from '../lib/agent-text.mjs';
import { whereSaid, relOf, NEVER_APPLIED, NEVER_APPLIED_AR } from '../lib/plain-words.mjs';
import { twinKey, writeTwin, planTwin, twinOutputs, twinTree, MATRIX_SAID } from '../lib/arabic-twin.mjs';
import { bindingOf } from '../lib/artifact.mjs';
import { twinPreview } from '../lib/arabic-twin.mjs';
import { text, compact, safe } from '../lib/tool-answer.mjs';
import { WATERFALL_RTL_INPUT, planIdInput, ADDS, strictInputs } from '../lib/tool-inputs.mjs';
import { pageNamesOf } from '../lib/terminology.mjs';
import { tooLongSaid } from '../lib/path-rules.mjs';   // (0.3.2 WN1, F05)
import { GULF_CULTURES, culturesOf } from '../lib/model-culture.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Gallery = require('../../assets/js/visual-gallery.js');
// (0.3.2 VC2) what the approval page shows of the plan's orderCalculations: the visuals and their functions, counted (the
// page says VC1's sentence itself, from twin-calcs.mjs)
const orderCalcsShown = (o) => ({ count: o.count, visuals: o.visuals, ...(o.notListed ? { notListed: o.notListed } : {}) });

// (0.3.0 Q1) an answer whose indented form passes AIM (34,000) goes out without the indentation (the same JSON, as
// compact's): on the large model plan_layout in Arabic with every option on was 37,908 characters indented
// (0.3.0 A3) opts.last: a twin's plan keeps its texts whole while any other list can be cut: a text the plan does not
// show can't be given an Arabic label
const TWIN_CAP = { last: ['texts'] };

// rc.22, B-139 (the twin's approval page listed internal ids): each approved text named by what it is and its own text,
// as the plan shows it (texts that read like an instruction stay withheld)
const TWIN_KIND = { visualField: 'Field name on one visual', dynamicTitle: 'Title that changed with the selection (now fixed)', page: 'Page name', button: 'Button', title: 'Title', textbox: 'Text box', field: 'Field name', bookmark: 'Bookmark', bookmarkGroup: 'Bookmark group', titleMeasure: 'Chart title (from a title measure)', measureText: 'Text of a report measure', altText: 'Alt text', blankText: 'Text when there is no data', buttonTooltip: 'Button tooltip', text: 'Text' };
const twinNames = (P) => Object.fromEntries(P.texts.filter((t) => P.labels[t.id] != null).map((t) => [t.id, `${t.phone ? 'Phone layout: ' : ''}${t.kind === 'button' && t.goesTo ? 'Page button' : TWIN_KIND[t.kind] || 'Text'}${t.text != null ? ` "${t.text}"` : ' (withheld: reads like an instruction)'}${t.labelFrom ? ` (${t.labelFrom})` : ''}`]));
// (0.3.1 FX1: an Arabic page wholly Arabic) the same names in Arabic, for the twin's approval page; the text inside «»
const TWIN_KIND_AR = { visualField: 'اسم حقل في مرئي واحد', dynamicTitle: 'عنوان كان يتغير مع التحديد (ثابت الآن)', page: 'اسم صفحة', button: 'زر', title: 'عنوان', textbox: 'مربع نص', field: 'اسم حقل', bookmark: 'إشارة مرجعية', bookmarkGroup: 'مجموعة إشارات مرجعية', titleMeasure: 'عنوان مخطط (من مقياس عنوان)', measureText: 'نص من مقياس في التقرير', altText: 'نص بديل', blankText: 'النص عند عدم وجود بيانات', buttonTooltip: 'تلميح زر', text: 'نص' };
const FROM_AR = (f) => { const m = /^the approved Arabic of the same text \((.+)\)$/.exec(String(f)); const W = { 'page name': 'اسم صفحة', title: 'عنوان', 'text box': 'مربع نص', button: 'زر', 'field name': 'اسم حقل', bookmark: 'إشارة مرجعية', 'bookmark group': 'مجموعة إشارات مرجعية', 'chart title': 'عنوان مخطط', 'measure text': 'نص من مقياس', 'alt text': 'نص بديل', 'text for no data': 'النص عند عدم وجود بيانات', 'button tooltip': 'تلميح زر', text: 'نص' };
  return f === 'the approved Arabic name of the page it goes to' ? 'الاسم العربي المعتمد للصفحة التي ينتقل إليها' : f === 'the approved Arabic of the same text on the page' ? 'النص العربي المعتمد للنص نفسه في الصفحة' : m ? `النص العربي المعتمد للنص نفسه (${W[m[1]] || m[1]})` : f === 'the terminology sheet' ? 'ورقة المصطلحات' : String(f); };
const twinNamesAr = (P) => Object.fromEntries(P.texts.filter((t) => P.labels[t.id] != null).map((t) => [t.id, `${t.phone ? 'تخطيط الهاتف: ' : ''}${t.kind === 'button' && t.goesTo ? 'زر صفحة' : TWIN_KIND_AR[t.kind] || 'نص'}${t.text != null ? ` «${t.text}»` : ' (محجوب: يبدو كتعليمات)'}${t.labelFrom ? ` (${FROM_AR(t.labelFrom)})` : ''}`]));
// (0.3.1 K2) a proposed plan keeps its exact files (lib/plans.mjs, this process only); the plan id, for the proposal
const attached = (id, art) => { Plans.attach(id, art); return id; };
export function register(server, ctx) {
  server.registerTool('create_arabic_twin', {
    title: 'Create the Arabic twin of a report',
    description: 'Makes the right-to-left Arabic twin of an existing PBIR report: a new "<name> AR" report beside it (or, with into "same", one copy "<name> (EN-AR)" with the English pages and their Arabic pages), same model, every page mirrored in place (visuals, groups, axes, legends, titles, table columns), page ids, visual names and bookmarks kept so navigation works. The original is only read; nothing is written over. ' + APPROVAL + ' The plan lists the pages, what mirrors, what cannot (custom visuals, the page navigator\'s order, Power BI\'s own words, data values), every text with an id for its Arabic, and what stays English and why (notTranslated). The Arabic texts are DRAFTS for the user to approve: pass the approved ones as labels (and terms) for a plan id of exactly those; never translate silently.' + NO_VALUES + REPORT_UNTRUSTED + UNTRUSTED,
    inputSchema: strictInputs('create_arabic_twin', {
      path: z.string().describe('The original report: its .pbip or .Report folder, in the working folder'),
      labels: z.record(z.string().max(200), z.string().max(200)).optional().describe('Approved Arabic texts by the plan\'s text ids ("page:<id>", "title:<page>/<visual>", "field:<queryRef>"). A text without one stays as it is'),
      terms: z.record(z.string().max(300), z.string().max(200)).optional().describe('Approved terms, one Arabic name per field: { "Table[Field]": "الاسم" }, or its English name to keep it English; the same word wherever the field shows (terminology: ask its askNext, one at a time)'),
      timeRightToLeft: z.boolean().default(true).describe('Time charts run right to left like the page (default); false keeps time left to right. The user\'s choice'),
      waterfallRtl: WATERFALL_RTL_INPUT(),
      // (0.3.2 AN1, RD10) the Arabic names in the model itself, as a TMDL script the user applies
      modelNames: z.union([z.boolean(), z.array(z.enum(GULF_CULTURES)).min(1).max(6)]).optional().describe('Only when the user asks: also a TMDL script of the model\'s Arabic names (translations), from approved terms only: true for the six Gulf cultures, or those listed. The user applies it in TMDL view'),
      arabicMonth: z.boolean().default(true).describe('Offer (after the go, write) a TMDL script adding an Arabic month name column to the date table; the user applies it in TMDL view'),
      mirrorPicturePages: z.boolean().default(false).describe('true: also mirror a page whose background picture cannot be flipped (unreadable, or may hold words and not in flipPictures): the picture stays, the visuals leave its panels. Default false: it stays left to right; other pictures flip with their page. picturePages says each: ask the user'),
      flipPictures: z.array(z.string().max(200)).max(200).optional().describe('Pages (picturePages[].page) whose picture may hold words or a logo ("asked") the user looked at and approved to flip: their words read backwards. Never without the user\'s yes'),
      // (0.3.1 MX3, laptop part 9: the option was unreachable) the matrices the user chose to write flat (the plan's matrixChoices)
      matrixAsTable: z.array(z.string().max(200)).max(200).optional().describe('Matrices written as flat tables, by visual name (matrixChoices lists them and their loss). Only with the user\'s go'),
      into: z.enum(['separate', 'same']).optional().describe('"separate" (default): its own report "<name> AR". "same", only when the user asks for one report in both languages: a copy "<name> (EN-AR)", English pages and their Arabic pages, a language button on every page, each pair\'s slicers in sync'),
      tabsShown: z.enum(['en', 'ar']).optional().describe('With into "same": whose pages show in the tabs (default "en"); the other\'s are reached by the language button'),
      textsFrom: z.number().int().min(0).max(100000).optional().describe('The plan only: list texts from this one on (moreTexts.from)'),
      termsFrom: z.number().int().min(0).max(100000).optional().describe('The plan only: list terms from this row on (terminology.moreTerms.from)'),
      planId: planIdInput
    }), annotations: ADDS
  }, safe(async (a) => {
    if (a.labels && Object.keys(a.labels).length > 400) throw new Error('At most 400 labels in one plan.');
    const key = twinKey(a.path);
    if (a.planId != null && a.planId !== '') {
      const P = Plans.gate('create_arabic_twin', a.planId, key), art = Plans.artifactOf(a.planId);
      // (0.3.1 K2, as create_report's writeApproved) the kept files are the ones the approval recorded
      if (art && bindingOf(art.digest, art.pin, art.modelPrint) !== Plans.approvedBinding(a.planId)) throw new Error(`Nothing was written: the files kept for plan ${a.planId} are not the ones that were approved. Make the plan again (call this tool without planId), show it to the user and wait for their go.`);
      return text(withPlan(a.planId, 'create_arabic_twin', () => writeTwin(a, P, art)));
    }
    const P = planTwin(a);
    if (!P.answer.twin.nameFree) throw new Error(`Nothing was written: "${P.answer.twin.report}" or "${P.answer.twin.pbip}" is already there. DataArcus never writes over a file: rename or move the old twin, then ask again.`);
    // (0.3.1 TB1b, D-1027-03) a kept title Power BI would compose mixed: no plan id, said in English and Arabic
    if (P.mixedTitles.length) return compact(Object.assign(P.answer, { planProblems: [`${P.mixedTitles.length === 1 ? 'A title' : `${P.mixedTitles.length} titles`} on a field parameter would be mixed, Arabic and English (mixedTitles): ${P.mixedTitles.slice(0, 5).map((x) => `"${x.text}"`).join(', ')}. ${P.mixedTitles[0].how}`],
      planProblemsAr: [`${P.mixedTitles.length === 1 ? 'عنوان' : `عناوين (${P.mixedTitles.length})`} على معلمة حقول ${P.mixedTitles.length === 1 ? 'سيكون مختلطًا' : 'ستكون مختلطة'} بين العربية والإنجليزية (mixedTitles). ${P.mixedTitles[0].howAr}`],
      sayFirst: 'No plan id: Power BI would compose a title here from Arabic and English names (mixedTitles says each and why). Show the user mixedTitles; draft a fixed Arabic title for each (approved as a label) or keep the names it names English, then call this tool again. Nothing was written.' }), TWIN_CAP);
    const LG = P.answer.languages;
    // (SQ3, T1-S8: "0 Arabic texts as approved" before any text was approved) the count, or that none is approved yet
    const given = P.answer.labels.arabic, texts = given ? `${given} Arabic texts as approved` : 'no Arabic text approved yet: every text stays as it is';
    const textsAr = given ? `النصوص العربية كما وُوفق عليها: ${given}` : 'لم يُوافق بعد على أي نص عربي: يبقى كل نص كما هو';
    const where = path.dirname(inside(a.path)), cols = (P.month.columns || []).length || 1;
    const NM = P.names && P.names.offered ? P.answer.arabicModelNames : null;   // (0.3.2 AN1)
    // (0.3.1 CX1, F02) the page pairs with a button not placed: both their pages shown in the tabs
    const both = (lg) => (lg.pairs || []).filter((x) => x.bothShown).length;
    const writes = [LG ? `the new report "${P.answer.twin.report}" and "${P.answer.twin.pbip}" next to the original: its ${LG.pairs.length} English pages as they are and their ${LG.pairs.length} Arabic pages (${texts}), ${LG.buttons.filter((b) => b.placed).length} language buttons, ${LG.syncGroups.length} slicer pairs kept in sync, the ${P.copy.tabsShown === 'ar' ? 'English' : 'Arabic'} pages hidden in the tabs${both(LG) ? ` (except ${both(LG)} page pair${both(LG) === 1 ? '' : 's'} with no free place for a language button: both pages shown)` : ''}; the original is not changed`
      : `the new report "${P.answer.twin.report}" and "${P.answer.twin.pbip}" next to the original (${P.answer.pages.length} pages mirrored, ${texts}); the original is not changed`]
      .concat(P.month.offered ? [`the TMDL script "${P.answer.arabicMonth.scriptAfterGo}" ${whereSaid(where)} (the Arabic calendar columns: ${cols}); ${NEVER_APPLIED}`] : [])
      .concat(NM ? [`the TMDL script "${NM.scriptAfterGo}" ${whereSaid(where)} (the model's Arabic names: ${NM.captions} in each of ${NM.cultures.length} culture${NM.cultures.length === 1 ? '' : 's'}, ${NM.cultures.join(', ')}); ${NEVER_APPLIED}`] : []);
    // (SQ3, T1-S6) the same lines in Arabic, for the approval page (which is Arabic), one for each line above
    const writesAr = [LG ? `التقرير الجديد «${P.answer.twin.report}» و«${P.answer.twin.pbip}» بجانب الأصل: صفحاته الإنجليزية كما هي (${LG.pairs.length}) وصفحاتها العربية (${LG.pairs.length}) (${textsAr})، أزرار اللغة: ${LG.buttons.filter((b) => b.placed).length}، أزواج المقسمات المتزامنة: ${LG.syncGroups.length}، والصفحات ${P.copy.tabsShown === 'ar' ? 'الإنجليزية' : 'العربية'} مخفية في علامات التبويب${both(LG) ? ` (عدا أزواج الصفحات التي لا مكان فيها لزر اللغة: ${both(LG)}، تظهر صفحتا كل منها)` : ''}؛ لا يتغيّر الأصل`
      : `التقرير الجديد «${P.answer.twin.report}» و«${P.answer.twin.pbip}» بجانب الأصل (الصفحات المعكوسة: ${P.answer.pages.length}، ${textsAr})؛ لا يتغيّر الأصل`]
      .concat(P.month.offered ? [`سكربت TMDL «${P.answer.arabicMonth.scriptAfterGo}» ${whereSaid(where, undefined, true)} (أعمدة التقويم العربية: ${cols})؛ ${NEVER_APPLIED_AR}`] : [])
      .concat(NM ? [`سكربت TMDL «${NM.scriptAfterGo}» ${whereSaid(where, undefined, true)} (الأسماء العربية للنموذج: ${NM.captions} في كل ثقافة، الثقافات: ${NM.cultures.length}، ${NM.cultures.join('، ')})؛ ${NEVER_APPLIED_AR}`] : []);
    // (0.3.1 V1) the approval page draws each Arabic page from the plan's own build (kept with the plan, never in the answer)
    P.answer.approvalPreview = `The approval page shows each Arabic page as it will be written${LG ? ', beside its English page' : ''}: where each visual goes, its type and its Arabic title${LG ? ', and the language buttons' : ''} (grey placeholders, never data). Tell the user to look at it before Approve.`;
    // (0.3.1 K2) the exact files the write will write, built now and kept with the plan (this session only), with their
    // digest; the approval records their binding (lib/plans.mjs: approve), as for create_report's plan
    const T = twinTree(P), source = reportPrint(a.path);
    // (0.3.2 WN1, F05) the deepest file the twin writes within the system's path limit (Windows: 259 characters), or no plan id
    const long = tooLongSaid(P.loc.project, T.files);
    if (long) throw new Error(`No plan: the twin can't be written there: ${long}. Nothing was written.`);
    const pin = { labels: P.labels, terms: P.terms, timeRightToLeft: a.timeRightToLeft !== false, waterfallRtl: Gallery.waterfallRtlOf(a.waterfallRtl), arabicMonth: a.arabicMonth !== false, mirrorPicturePages: a.mirrorPicturePages === true, flipPictures: [...new Set((a.flipPictures || []).map(String))].sort(), matrixAsTable: [...new Set((a.matrixAsTable || []).map(String))].sort(), into: LG ? 'same' : 'separate', tabsShown: LG ? P.copy.tabsShown : null, source, ...(culturesOf(a.modelNames).length ? { modelNames: culturesOf(a.modelNames) } : {}) };
    P.answer.exact = { digest: T.digest, files: T.files.length, note: 'The exact files the write will write, built now: after the go they are written byte for byte, or nothing is.' };
    // (0.3.1 BD2, measured in Desktop 2.159, 27 Oct) the Arabic page and tooltip page names that keep a Latin run: no mark
    // helps the tab strip (tabs lay out left to right), so the plan names them
    P.answer.pageNames = pageNamesOf(T.files);
    return compact(Object.assign(P.answer, { plan: Plans.proposal(attached(Plans.propose('twin', { key, print: P.modelPrint }, writes, { writesAr, preview: twinPreview(P, T.files), labels: P.labels, terms: P.terms, terminology: P.termRows.map(({ where, ...r }) => Object.assign(r, { places: where.length })), modelPrint: P.modelPrint, names: twinNames(P), namesAr: twinNamesAr(P), notTranslated: P.notTranslated.map((x) => Object.assign({ field: `${x.text != null ? `"${x.text}"` : '(withheld: reads like an instruction)'} (${x.where})`, why: x.why }, x.whyAr ? { whyAr: x.whyAr } : {})), timeRightToLeft: a.timeRightToLeft !== false, waterfallRtl: Gallery.waterfallRtlOf(a.waterfallRtl), arabicMonth: a.arabicMonth !== false, mirrorPicturePages: a.mirrorPicturePages === true, flipPictures: pin.flipPictures, matrixAsTable: pin.matrixAsTable, source, ...(pin.modelNames ? { modelNames: pin.modelNames } : {}), outputs: twinOutputs(P, T), outputsAt: relOf(where), ...(P.addedVisuals && P.addedVisuals.length ? { added: P.addedVisuals.slice(0, 30) } : {}), ...(P.answer.notFullyArabic ? { notFullyArabic: P.answer.notFullyArabic } : {}), ...(P.answer.orderCalculations ? { orderCalculations: orderCalcsShown(P.answer.orderCalculations) } : {}),
      // (0.3.0 T1, T-7) the options the report uses: its waterfalls and its pages drawn on a picture, counted
      waterfalls: (P.answer.mirrors || []).filter((x) => /^waterfall/.test(x.kind)).reduce((n, x) => n + (x.count || 0), 0) + ((P.answer.cannot || []).find((x) => /waterfall/.test(x.what)) || { where: [] }).where.length, picturePages: (P.answer.picturePages || []).length, pictures: (P.answer.picturePages || []).map((x) => ({ page: x.name || x.page, en: x.what, ar: x.whatAr })), matrices: (P.answer.cannot || []).some((x) => x.what === 'matrices') ? MATRIX_SAID : null,
      ...(LG ? { into: 'same', tabsShown: P.copy.tabsShown, languages: { copy: LG.copy, pairs: LG.pairs, buttons: LG.buttons, syncGroups: LG.syncGroups, tabs: LG.tabs, bookmarks: LG.bookmarks, measures: LG.measures || [] } } : {}) }), Object.assign({}, T, { modelPrint: P.modelPrint, pin, binding: bindingOf(T.digest, pin, P.modelPrint) }))) }), TWIN_CAP);
  }));
}
