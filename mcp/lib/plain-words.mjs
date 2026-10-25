// (0.3.0 T1, the simulated beta testers of 21 Oct, T-4 and T-9) the words a person reads where they decide, in one
// place: what a script file is and the 3 steps to apply it (the testers asked "what is a TMDL script?" and met the
// steps only after Approve), and where a file goes, by the folder's name ("next to the project" left the IT reviewer
// guessing "Sales/"). Every plan answer (plans.mjs proposal), the approval page and the calendar's answers use these.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, shownPath } from './model.mjs';

/** What a script is, in one sentence. what: what it adds ("the Arabic calendar columns"); none: the general words. */
export const scriptIs = (what) => `A script is a small text file that adds ${what || 'the listed changes'} to your model; DataArcus never changes your model itself: the model changes only when you apply the script in Power BI Desktop.`;
/** The 3 steps to apply a script, in the person's words. */
export const APPLY_STEPS = [
  'Save a copy of your Power BI file first, then open the script file in Notepad, select all and copy.',
  'In Power BI Desktop, open TMDL view (the TMDL icon in the bar at the side of the window), open a new tab and paste the text.',
  'Choose Preview to see what the script changes, then Apply.'
];
export const SCRIPT_IS_AR = 'السكربت ملف نصي صغير يضيف التغييرات المذكورة إلى نموذجك؛ لا يغيّر DataArcus نموذجك بنفسه أبدًا: لا يتغيّر النموذج إلا عندما تطبّق السكربت في Power BI Desktop.';
export const APPLY_STEPS_AR = [
  'احفظ نسخة من ملف Power BI أولًا، ثم افتح ملف السكربت في المفكرة (Notepad)، وحدّد الكل وانسخه.',
  'في Power BI Desktop افتح عرض TMDL (TMDL view، أيقونة TMDL في الشريط الجانبي للنافذة)، وافتح علامة تبويب جديدة والصق النص.',
  'اختر Preview لترى ما سيغيّره السكربت، ثم Apply.'
];
/** What the plan answer says about a script it writes (none when it writes no .tmdl): { scriptIs, howToApplyScript }. */
export function scriptWords(writes, what) {
  return (writes || []).some((x) => /\.tmdl\b/i.test(String(x))) ? { scriptIs: scriptIs(what), howToApplyScript: APPLY_STEPS.slice() } : {};
}
// what the writes say about a script they name: DataArcus never applies it, the person does, with the steps given
export const NEVER_APPLIED = 'never applied by DataArcus: you apply it yourself in Power BI Desktop, with the 3 steps shown with this plan';
// (SQ3, T1-S6) the same on an Arabic plan's approval page
export const NEVER_APPLIED_AR = 'لا يطبّقه DataArcus أبدًا: تطبّقه أنت في Power BI Desktop، بالخطوات الثلاث المعروضة مع هذه الخطة';

/** Where a file goes, by the folder's name: 'in the folder "Sales", next to "Sales.pbip"' (the project file of that
 *  folder, base preferred), or 'in the working folder itself' when the folder is the working folder. dir: absolute.
 *  ar: the same in Arabic (SQ3: «في المجلد «Sales»، بجانب «Sales.pbip»»), for an Arabic plan's approval page. */
export function whereSaid(dir, base, ar) {
  if (!dir) return ar ? 'بجانب المشروع' : 'next to the project';
  const rel = ROOT ? path.relative(ROOT, dir).split(path.sep).join('/') : path.basename(dir);
  let pbips = [];
  try { pbips = fs.readdirSync(dir).filter((n) => /\.pbip$/i.test(n)).sort(); } catch (e) { pbips = []; }
  const pb = (base && pbips.find((n) => n.toLowerCase() === (String(base) + '.pbip').toLowerCase())) || pbips[0];
  if (ar) return (!rel || rel === '.' ? 'في مجلد العمل نفسه' : rel.startsWith('..') ? 'بجانب المشروع' : `في المجلد «${shownPath(rel)}»`) + (pb ? `، بجانب «${shownPath(pb)}»` : '');
  const at = !rel || rel === '.' ? 'in the working folder itself' : rel.startsWith('..') ? 'next to the project' : `in the folder "${shownPath(rel)}"`;
  return at + (pb ? `, next to "${shownPath(pb)}"` : '');
}

