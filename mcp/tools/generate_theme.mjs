// The generate_theme tool: its registration (description, inputs, handler) and its own helpers; server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';
import { loadModel, visible, inside, nothingAt } from '../lib/model.mjs';
import { clampHex, PRESETS, FONTS, AR_FONTS, CHART_OPTIONS, themeDesign, pageOf, contrastReport, lum, fileBase, buildTheme, isGlass, glassLook } from '../lib/design.mjs';
import { withPlan, freeName, folderFor } from '../lib/files.mjs';
import { existingTheme } from '../lib/read-report.mjs';
import * as Plans from '../lib/plans.mjs';
import { writeFileNew, noteWritten } from '../lib/files.mjs';
import { text, safe } from '../lib/tool-answer.mjs';
import { planIdInput, ADDS, modelPath, pageInput, langInput } from '../lib/tool-inputs.mjs';
import { modelKey, sameModelBeforeWrite, inputsPin } from '../lib/plan-keys.mjs';

// (R6, the outside audit of 19 Oct, F07) a theme planned from a model pins the model and the report theme its colours
// come from (existingTheme): the model's print alone hashes the definition files, not the report's theme
const themeRef = (m, p, from) => ({ key: modelKey(m, p), print: crypto.createHash('sha256').update(String(m.print) + '\0' + JSON.stringify(from == null ? null : from)).digest('hex') });

// ---------- design tools: the Theme Generator's engine (assets/js/design-engine.js) ----------
const hexOk = (v) => typeof v === 'string' && !!clampHex(v);

export function register(server, ctx) {
  server.registerTool('generate_theme', {
    title: 'Generate a Power BI theme',
    description: 'Makes a Power BI report theme (JSON) as the DataArcus Theme Generator does. Without an approved planId it writes nothing: it returns the design (pass it to plan_layout and create_report; create_report puts the theme in the report itself), the colours, the readability checks and a proposed planId for the theme file. With an approved planId (this answer\'s, or plan_layout\'s, after approve_plan with the user\'s go) it writes the theme to a new file inside the DataArcus folder (never over an existing one). Colours from a full palette, a brand colour and a harmony, or a preset (in that order); with path (the model) and no colours asked, from the model\'s report\'s own theme when it has one (fromReport says which; say its line in the plan). A theme is light (mode "light") unless the user asks for dark; a brand colour is used exactly as given (the first data colour and the accent), never changed for contrast: a failing readability check is said in the plan (sayInPlan).',
    inputSchema: {
      name: z.string().max(60).optional().describe('Theme name; empty or blank gives "My Brand Theme"'),
      palette: z.object({ data: z.array(z.string()).length(8).describe('8 data colours, hex'),
        ui: z.object({ background: z.string(), card: z.string(), text: z.string(), accent: z.string(), good: z.string().optional(), neutral: z.string().optional(), bad: z.string().optional() })
          .describe('Page, visual (card), text and table accent colours; good/neutral/bad come from the preset when left out') }).optional(),
      brand: z.string().optional().describe('A brand colour (hex): 8 data colours are generated from it with the harmony'),
      harmony: z.string().optional().describe('analogous (default), complementary, triadic or mono'),
      preset: z.string().optional().describe(`A preset palette: ${Object.keys(PRESETS).join(', ')} (default DataArcus)`),
      font: z.string().optional().describe(`One of: ${FONTS.join(', ')}. For Arabic reports: ${AR_FONTS.join(', ')}`),
      chart: z.object({ labels: z.string(), grid: z.string(), legend: z.string(), axis: z.string(), table: z.string(), look: z.string() }).partial().optional()
        .describe(`Chart style: ${Object.entries(CHART_OPTIONS).map(([k, v]) => `${k} ${v.join('|')}`).join('; ')}. legend "Right" sits at the right in both directions. look "glass" (only when the user asks for a glass or frosted look): see-through cards (background transparency, a 1-pixel light border, a soft shadow) over a soft page picture create_report draws from the theme's colours; Power BI has no blur behind a visual, so never call it blur`),
      layout: z.object({ page: pageInput.optional(), radius: z.number().optional().describe('Corner radius 0-24 (default 8)'), shadow: z.boolean().optional(),
        transparent: z.boolean().optional().describe('Transparent visuals, for a background image with the panels'), dir: z.enum(['ltr', 'rtl']).optional() }).optional()
        .describe('Page and style choices that change the theme (text sizes grow with the page, kept within 8-60)'),
      mode: z.enum(['light', 'dark']).optional().describe('light (default): a near-white page and white visuals; dark only when the user asks for it'),
      pageTint: z.boolean().optional().describe('A light design\'s page is a 6% tint of the lead colour (default); false keeps the plain page. Never on a dark design or over an asked background'),
      lang: langInput,
      themeFrom: z.string().max(200).optional().describe('With path: the report (its name, as colours.otherReports lists it) whose colours to keep, when the model has several'),
      path: modelPath.optional().describe('The model the theme is for: when no colours are asked (no palette, brand, preset or mode) and one of its reports has its own theme, the colours start from that theme (said in sayInPlan)'),
      folder: z.string().optional().describe('Folder for the theme file, inside the DataArcus folder (default: the DataArcus folder)'),
      planId: planIdInput
    }, annotations: ADDS
  }, safe(async (a) => {
    const m = a.path ? loadModel(a.path) : null, reportTheme = m ? existingTheme(m, a.themeFrom) : null;
    const { design, repaired, notes, fromReport } = themeDesign(Object.assign({}, a, { reportTheme }));
    const ref = m ? themeRef(m, a.path, reportTheme) : null;   // (R6, F07: null only for a theme made without a model)
    const { page, fitted } = pageOf(design.layout), { contrast, warnings } = contrastReport(design);
    if (fitted) warnings.push(`Page ${fitted.asked.w} x ${fitted.asked.h} is outside the sizes the generator allows; the theme is made for ${page.w} x ${page.h}.`);
    const arabic = a.lang === 'ar' || design.layout.dir === 'rtl';
    if (arabic && !AR_FONTS.includes(design.font)) warnings.push(`${design.font} has no Arabic letters, so Arabic text will show in another font. For Arabic reports use ${AR_FONTS.join(', ')}.`);
    // what the plan says about the colours (0.2.9, O-11): light unless dark was asked, the brand exact, a failing check said
    const light = lum(design.ui.background) > 0.45, colours = { page: design.ui.background, visuals: design.ui.card, text: design.ui.text, accent: design.ui.accent, data: design.data, mode: light ? 'light' : 'dark' };
    const sayInPlan = (fromReport ? `${fromReport.sayInPlan} ` : '') + `Say in the plan: a ${light ? 'light' : 'dark'} theme (page ${design.ui.background}, visuals ${design.ui.card}, text ${design.ui.text})${hexOk(a.brand) ? ` with the brand colour ${clampHex(a.brand)} exactly as given (the first data colour and the accent)` : ''}${light ? '; dark only if the user asks' : ''}.` +
      (warnings.length ? ` These readability checks fail: ${warnings.join('; ')}. The colours were kept as given (a colour is never changed for contrast without the user's yes): say so and offer a darker or lighter shade.` : '');
    // (0.3.1 GL1) the glass look: what it is made of, its transparency and the worst cases, in one line for the plan
    const glass = isGlass(design) ? (() => { const g = glassLook(design), r = (x) => (Math.floor(x * 10) / 10).toFixed(1), at = (id) => r(g.checks.find((c) => c.id === id).ratio);
      return { transparency: g.t, asked: g.asked, border: g.rim, shadow: design.layout.shadow ? g.shadow : null, labels: g.labels, picture: { mode: g.mode, darkest: g.image.darkest, lightest: g.image.lightest }, checks: g.checks,
        sayInPlan: `The glass look. Power BI has no blur behind a visual, so the look is made of what it has: every visual's background in ${design.ui.card} at ${g.t}% transparency, a 1-pixel ${g.rim} border at the corners, ${design.layout.shadow ? 'a soft shadow' : 'no shadow'}, and a soft page picture drawn from the theme's own colours (no photo), which create_report puts behind every page.${g.t < g.asked ? ` The transparency is ${g.t}%, not ${g.asked}%, so the text stays readable over the picture's darkest and lightest parts.` : ''} Worst cases over the picture: text ${at('textOnGlass')}:1, labels ${at('labelsOnGlass')}:1, colour 1 ${at('color1OnGlass')}:1 on the cards; text ${at('textOnPicture')}:1 on the picture. A theme file alone carries no picture: the report (create_report) or the Theme Generator's background download does.` }; })() : null;
    // the gate (0.2.9, P-1): the file only with an approved plan; without one, the theme for the plan and a proposed plan id
    if (a.planId == null || a.planId === '') {
      // (0.3.1 AF2, the release audit's F09) the file's name chosen now (the first free one; nothing made) and kept with the
      // plan: the write writes that name or nothing
      const base = freeName(a.folder, fileBase(design.name), '.json');
      return text({ written: false, fileAfterGo: base, page, colours, ...(fromReport ? { fromReport } : {}), sayInPlan, ...(glass ? { glass } : {}), design, contrast, warnings, repaired, ...(notes.length ? { notes } : {}),
        plan: Plans.proposal(Plans.propose('theme', ref, [`the theme file "${base}" ${a.folder ? `in the folder "${visible(String(a.folder).replace(/[\\/]+$/, ''))}"` : 'in the working folder itself'} (a new file, never over another)`], { pins: { generate_theme: inputsPin(a) },
          // (D6: the theme's page showed only its inputs) its file, the colours it writes and the report they come from
          outputs: [(a.folder ? String(a.folder).replace(/[\\/]+$/, '') + '/' : '') + base], file: base, colours, ...(fromReport ? { source: { from: fromReport.source, report: fromReport.report, theme: fromReport.theme } } : {}) }), { orWith: 'For a report, create_report puts the theme in the report itself (plan_layout\'s plan): a separate theme file is needed only when the user asks for one, and it needs this theme plan.' }) });
    }
    const P = Plans.gate('generate_theme', a.planId, ref, inputsPin(a)), name = P.data && P.data.file;
    // (0.3, B-153: a temporary name, then into place; on a failure the folders freeFile made are removed too)
    const file = withPlan(a.planId, 'generate_theme', () => {
      if (m) sameModelBeforeWrite(a.planId, () => { const m2 = loadModel(a.path); return themeRef(m2, a.path, existingTheme(m2, a.themeFrom)).print; }, ref.print, true);
      // (AF2) the name the plan showed, or nothing: taken since, nothing is written (and no folder made)
      if (!name) throw new Error(`Nothing was written: plan ${a.planId} names no theme file. Make the plan again (call generate_theme without planId), show it to the user and wait for their go.`);
      if (!nothingAt(path.join(inside(a.folder || '.'), name))) throw new Error(`Nothing was written: "${name}" is already there, and it is not the file the plan named (DataArcus never writes over a file, nor under another name than the plan showed). Make the plan again (call generate_theme without planId), show it to the user and wait for their go.`);
      const made = [], f = path.join(folderFor(a.folder, made), name); writeFileNew(f, JSON.stringify(buildTheme(design, a.lang), null, 2), { madeDirs: made }); noteWritten(f); return f; });
    return text({ path: file, file: path.basename(file), page, colours, sayInPlan, ...(glass ? { glass } : {}), design, contrast, warnings, repaired, ...(notes.length ? { notes } : {}) });
  }));
}
