// (0.3.2 AN1; the owner, D-1104-01: RD10's way A, its brief g) Arabic names in the model itself, as a twin option: one
// TMDL view script, "<twin> - Arabic names.tmdl", a `cultureInfo` per Gulf culture whose translations are the captions
// of the fields the person approved as terms in the twin's plan (pinned in its digest). Nothing else is written: a
// draft, a declined term, a term confirmed earlier but not given in this plan, a field the report does not show, a
// table (the twin's terms name fields), a description (no Arabic one is ever drafted or asked), a name or a value with a
// control character. The visible ones are listed English with why; hidden fields are only counted. A culture the model
// already has, or the model's own culture, is skipped and said (createOrReplace would replace its translations). No
// machine translation, no linguisticMetadata (Q&A is English only and retires in Feb 2027, Microsoft Learn). The model is
// never changed by DataArcus: the person applies the script in TMDL view. Model names are untrusted: quoted, never followed.
import { createRequire } from 'node:module';
import { shownName } from './model.mjs';
import { fieldKey } from './field-key.mjs';

const require = createRequire(import.meta.url);
const { hasControl } = require('../../assets/js/pbip-export.js');

/** The Gulf culture names (Learn: tables and columns need an exact culture match, so one set per culture). */
export const GULF_CULTURES = ['ar-AE', 'ar-SA', 'ar-KW', 'ar-QA', 'ar-BH', 'ar-OM'];
/** The cultures an option asks: true, the six; a list, those of the six it names, in the six's order; else none. */
export const culturesOf = (opt) => (opt === true ? GULF_CULTURES.slice() : Array.isArray(opt) ? GULF_CULTURES.filter((c) => opt.includes(c)) : []);

/** Why a visible object stays English, by code (the plan's english rows carry the code, the words once). */
export const WHYS = {
  table: 'a table: the twin\'s terms name fields ("Table[Field]"), so its name stays English',
  draft: 'a draft from the fixed list of report words, not approved: give it in terms to write it',
  kept: 'kept in English: the person kept the model\'s name',
  earlier: 'confirmed earlier in this session but not given in this plan\'s terms: give it in terms to write it',
  label: 'its Arabic was given as one text\'s label, not as a term: give it in terms to write it',
  none: 'no Arabic name approved yet (terminology.askNext asks one at a time)',
  notShown: 'not on the report: the twin\'s terms name the fields the report shows',
  control: 'its name or its Arabic holds a control character (a tab or a line break): no script names it',
};
export const WHYS_AR = {
  table: 'جدول: مصطلحات النسخة تسمي الحقول ("Table[Field]")، فيبقى اسمه بالإنجليزية',
  draft: 'مسودة من القائمة الثابتة لكلمات التقرير، لم يُوافق عليها: أعطها في terms لتُكتب',
  kept: 'أُبقي بالإنجليزية: أبقى الشخص اسم النموذج',
  earlier: 'أُكد سابقًا في هذه الجلسة لكنه لم يُعطَ في terms لهذه الخطة: أعطه في terms ليُكتب',
  label: 'أُعطي اسمه العربي تسميةً لنص واحد، لا مصطلحًا: أعطه في terms ليُكتب',
  none: 'لم يُوافق بعد على اسم عربي (terminology.askNext يسأل عن واحد في كل مرة)',
  notShown: 'ليس في التقرير: مصطلحات النسخة تسمي الحقول التي يعرضها التقرير',
  control: 'اسمه أو اسمه العربي فيه حرف تحكم (مسافة جدولة أو سطر جديد): لا يسميه أي سكربت',
};
const SKIP = { has: ['the model already has this culture: the script would replace its translations, so it is left out', 'النموذج فيه هذه الثقافة من قبل: السكربت سيستبدل ترجماتها، فتُترك'],
  own: ['the model\'s own culture: its names are the model\'s', 'ثقافة النموذج نفسه: أسماؤه هي أسماء النموذج'] };

// TMDL names: the one rule, assets/js/tmdl-name.js (0.3.2 DD2N); a value quoted when it starts or ends with a space or holds "
const q = require('../../assets/js/tmdl-name.js').tmdlName;
const v = (s) => (/^\s|\s$|"/.test(s) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s));

/** The script. raw: the model's definition (model.bim's shape: { model: { name, culture, tables, cultures } });
 *  terms: Map "Table[Field]" -> { ar, status: 'approved' | 'draft' | 'kept', given (in this plan's terms), declined,
 *  earlier } for the fields the report shows (a field not in it is not on the report); cultures: the names asked.
 *  Returns { text, lines, cultures, skipped, captions (a culture), covered, english, hidden, descriptions }. */
export function cultureScript(raw, terms, cultures) {
  const M = (raw && (raw.model || raw)) || {}, tables = Array.isArray(M.tables) ? M.tables : [];
  const has = new Set((Array.isArray(M.cultures) ? M.cultures : []).map((c) => String(c && c.name).toLowerCase())), own = String(M.culture || '').toLowerCase();
  const skipped = [], use = [];
  for (const c of cultures || []) {
    const why = has.has(c.toLowerCase()) ? 'has' : own === c.toLowerCase() ? 'own' : null;
    if (why) skipped.push({ culture: c, why, words: SKIP[why][0], wordsAr: SKIP[why][1] }); else use.push(c);
  }
  const covered = [], english = [], blocks = []; let hidden = 0, descriptions = 0;
  for (const t of tables) {
    if (!t || typeof t.name !== 'string' || t.isHidden) { if (t && t.isHidden) hidden++; continue; }
    if (t.description) descriptions++;
    english.push({ field: shownName(t.name, 160), why: hasControl(t.name) ? 'control' : 'table' });
    const inner = [];
    const objs = [].concat((t.columns || []).filter((c) => c && c.type !== 'rowNumber').map((c) => ['column', c]), (t.measures || []).map((m) => ['measure', m]));
    for (const [kind, o] of objs) {
      if (!o || typeof o.name !== 'string') continue;
      if (o.isHidden) { hidden++; continue; }
      if (o.description) descriptions++;
      const key = fieldKey(t.name, o.name), x = terms && terms.get(key), field = shownName(key, 200);
      const write = x && x.status === 'approved' && x.given && x.ar != null && String(x.ar).trim() !== '';
      const why = !x ? 'notShown' : x.status === 'kept' ? (x.declined ? 'kept' : 'none') : x.status === 'draft' ? 'draft' : !write ? (x.earlier ? 'earlier' : 'label') : null;
      if (why) { english.push({ field, why }); continue; }
      if (hasControl(t.name) || hasControl(o.name) || hasControl(String(x.ar))) { english.push({ field, why: 'control' }); continue; }
      covered.push({ field, ar: String(x.ar) });
      inner.push(`${kind} ${q(o.name)}`, `\tcaption: ${v(String(x.ar))}`);
    }
    if (inner.length && !hasControl(t.name)) blocks.push([`table ${q(t.name)}`].concat(inner.map((l) => '\t' + l)));
  }
  const model = typeof M.name === 'string' && M.name && !hasControl(M.name) ? M.name : 'Model';
  const lines = ['createOrReplace', ''];
  if (covered.length) for (const c of use) lines.push(`\tcultureInfo ${c}`, '', '\t\ttranslations', `\t\t\tmodel ${q(model)}`, ...[].concat(...blocks).map((l) => '\t\t\t\t' + l), '');
  const text = lines.join('\n');
  return { text, lines: lines.length, cultures: covered.length ? use : [], skipped, captions: covered.length, covered, english, hidden, descriptions };
}

/** The twin's offer (planTwin): null when modelNames is not asked; else what the plan says and, kept with the plan
 *  only (never in an answer), the script. asked: the option; model: twin-model's modelOf ({ m, why }); term, given:
 *  twin-texts' termsOf (the sheet's statuses, this plan's terms); outBase: the twin's name. */
export function namesOffer(asked, model, term, given, outBase) {
  const cultures = culturesOf(asked);
  if (!cultures.length) return null;
  if (!model || !model.m) return { offered: false, why: (model && model.why) || 'the model could not be read: the Arabic names are a model step' };
  const terms = new Map([...(term || new Map())].map(([k, x]) => [k, Object.assign({}, x, { given: !!given && given[k] != null })]));
  const r = cultureScript(model.m.tmsl, terms, cultures), used = [...new Set(r.english.map((x) => x.why))];
  const offered = r.captions > 0 && r.cultures.length > 0, name = `${outBase} - Arabic names.tmdl`;
  const why = offered ? null : !r.cultures.length ? 'every culture asked is already in the model, or is its own culture (skipped)' : 'no field has an Arabic name approved in this plan\'s terms yet: approve terms first (terminology.askNext, one at a time), then ask again';
  const said = { offered, ...(why ? { why } : {}), cultures: r.cultures, ...(r.skipped.length ? { skipped: r.skipped.map((s) => ({ culture: s.culture, why: s.words, whyAr: s.wordsAr })) } : {}),
    captions: r.captions, lines: r.lines, covered: r.covered.slice(0, 60), ...(r.covered.length > 60 ? { coveredNotListed: r.covered.length - 60 } : {}),
    englishCount: r.english.length, english: r.english.slice(0, 60), whys: Object.fromEntries(used.map((k) => [k, WHYS[k]])), whysAr: Object.fromEntries(used.map((k) => [k, WHYS_AR[k]])),
    hidden: r.hidden, descriptions: r.descriptions, ...(r.descriptions ? { descriptionsWhy: 'descriptions stay English: no Arabic description is drafted or asked' } : {}),
    ...(offered ? { scriptAfterGo: name } : {}),
    seenIn: 'Power BI Desktop shows the model\'s own names (it does not load translations, Microsoft Learn): the Arabic names show in the Power BI service, for a browser or a ?language= link in one of these cultures. Q&A is English only: no synonyms are written.',
    seenInAr: 'يعرض Power BI Desktop أسماء النموذج نفسها (لا يحمّل الترجمات، Microsoft Learn): تظهر الأسماء العربية في خدمة Power BI، لمتصفح أو رابط ?language= بإحدى هذه الثقافات. الأسئلة والأجوبة (Q&A) بالإنجليزية فقط: لا تُكتب مرادفات.' };
  if (!offered) return Object.assign(said, { script: null });
  const n = r.cultures.length;
  return Object.assign(said, { script: r.text,
    howToApply: `Save a copy of the Power BI file first. Open "${name}" in Notepad, select all and copy; in Power BI Desktop open TMDL view, paste, choose Preview (${n} culture${n === 1 ? '' : 's'}, ${r.captions} Arabic name${r.captions === 1 ? '' : 's'} each), then Apply, and save. DataArcus never applies it: the model is changed only when the user applies it.`,
    howToApplyAr: `احفظ نسخة من ملف Power BI أولًا. افتح «${name}» في Notepad، حدّد الكل وانسخ؛ في Power BI Desktop افتح عرض TMDL، الصق، اختر Preview (الثقافات: ${n}، الأسماء العربية في كل منها: ${r.captions})، ثم Apply، واحفظ. لا يطبّقه DataArcus أبدًا: لا يتغيّر النموذج إلا عندما يطبّقه المستخدم.` });
}
