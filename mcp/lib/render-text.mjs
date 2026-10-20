// S2-3 (20 Oct 2026): what render_report says (experimental, off unless DATAARCUS_EXPERIMENTAL_RENDER=1): its
// description, what its images can't tell, the look-and-propose steps (mcp/research/SEE-THE-RESULT.md, "The loop"),
// and the question about the model's DAX constants. One place, so the tests and the tool read the same words.

export const MADE_UP = 'Every number, date and label inside the visuals is made up (a throwaway copy of the model with made-up rows); none is the user\'s data. Names (pages, titles, fields, measures) are the report\'s and the model\'s.';

export const BY = 'Power BI Desktop on this computer, on a copy of the model with made-up rows and a copy of the report (closed and deleted after)';

export const CANT_TELL = [
  'The size of a number: made-up values have made-up magnitudes (a card "4.2K" where the real one is "12.4M"); amounts follow the format string\'s unit (K, M, bn) or the magnitude given, nothing more. Never judge from these images whether a real value fits its card or axis.',
  'Real label lengths: category labels are made-up words of 4 to 14 letters, not the model\'s; a label cut or slanted here is likely, not certain, on the real data, and a label that fits here may not fit there.',
  'Sparsity and blanks: the made-up rows fill every category and every day of one year (2025); a real filter that leaves few rows, real blanks and other years are not shown.',
  'What the copy leaves out: row-level security roles, translations and the model\'s data sources.',
  'The window, not only the page: Desktop\'s ribbon, panes and page tabs are in each image and the page is fitted to the window, so the image\'s pixels are not the page\'s units: use the boxes for positions.'
];

export const HOW_TO_LOOK = [
  'Look at each image at full size, page by page, with its boxes (the written visuals: their type and place in page units; i is the visual\'s number on that page).',
  'List every visible problem in this shape: page; visual (its type and box, e.g. "clusteredBarChart at 852,184"); what is seen (a cut or wrapped title, slanted or dropped labels, a scrollbar, an overlap, an empty visual or "(Blank)", an error icon or "Can\'t display the visual", colour, right to left: the order of pages, buttons, axes and values); and a confidence (high: clearly in the image; medium; low: it may come from the made-up data). Then "Seen, not in scope": everything else visibly wrong.',
  'Never judge what cantTell lists: say it can\'t be told from a render.',
  'Propose each fix as a change to the design or the fields (a wider slot, a shorter title, a page more, fewer table columns), written as a NEW plan through plan_layout, which the person approves on the approval page with its new preview. Never rewrite the written report and never write without an approved plan: this tool wrote nothing.',
  'Once the new report is written, render it again and say what changed between the two renders.'
];

export const LITERALS_ASK = 'Not rendered yet: these measures, calculated columns or calculation items hold constants in their DAX (numbers other than 0 and 1, or texts). The render computes them as they are, so a constant (a target, a customer\'s name in a SWITCH) can show in an image that goes to the AI app. Show the user this list (names and counts only: the values are not in this answer) and ask: replace them with made-up constants for the render (call again with literals "stub"; the model is not changed), or keep them (literals "keep"). Never choose for the user.';

export const NOT_WINDOWS = 'render_report needs Windows with Power BI Desktop installed, and this computer is not Windows.';
export const INSTEAD = 'Show the approval page\'s preview instead (plan_layout, then approve_plan): it is drawn by DataArcus, not by Power BI Desktop; say so.';

export const DESCRIPTION = 'Experimental (on only with DATAARCUS_EXPERIMENTAL_RENDER=1). Shows you what Power BI Desktop actually draws for a report that is already written (create_report\'s, or any PBIR report with its model): DataArcus writes a throwaway copy of the report\'s model with the same tables, columns, types, relationships and measures but made-up rows, opens it with a copy of the report in Power BI Desktop on the user\'s Windows computer (its own window, closed by its process id when done; the copies are in the computer\'s temporary folder, deleted after, never in the working folder), captures each page, and answers one image a page with the page\'s boxes and what the images can\'t tell. The images hold none of the user\'s data: every number, date and label in them is made up; names and titles show, and the DAX constants the person chose to keep. Windows with Power BI Desktop only (elsewhere it answers rendered false). It takes about 30 to 120 seconds and Desktop shows on the screen: ask the user before the first render, and not while they work in their own Desktop (it refuses then). When the model\'s DAX holds constants (a target, a name in a SWITCH), the first call lists those measures and columns by name, never their values, and renders nothing: ask the user, then call again with literals "stub" (replaced by made-up ones) or "keep". Look at the images as howToLook says, list the visible problems page by page, and propose every fix as a new plan (plan_layout, then the person\'s approval on the approval page), never as a rewrite: this tool writes nothing in the working folder.';
