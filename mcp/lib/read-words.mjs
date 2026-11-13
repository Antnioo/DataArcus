// The tool layer's words for the reading block's coded errors (A1-9, the audit of the reading block: the reader returns
// a code and its data; the tools say it to the user). An error without a code keeps its own message.
import { createRequire } from 'node:module';
const { hasArabic } = createRequire(import.meta.url)('../../assets/js/arabic-script.js');
// (0.3.2 AR4) several models at one level, said in Arabic when the person's own words are Arabic (the path they gave,
// or a tied folder): the dual for 2, "N نماذج" for 3 and up, as the website says it (AR2, D-1105-02, D-1105-05)
const manyAr = (d) => `يحتوي "${d.path}" على ${d.models.length === 2 ? 'نموذجين' : d.models.length + ' نماذج'} في المستوى نفسه: ${d.models.join('; ')}. أعطِ read_model مسار النموذج الذي تقصده.`;
// (0.3.3 AT1, B-449, D-1110-07) the three "which model" input errors in Arabic, the owner's approved lines word for word:
// "X" is the name or path the person gave, "Y" the working folder, the list the paths there (as the English lists them).
// The list sits after the first sentence with no word of its own (none is approved).
// (0.3.3 AR7, D-1112-05) with no model there to list, the same approved sentences end as the English does, "the path
// of a project folder": «مسار مجلد مشروع» (مسار, مجلد العمل: the owner's lines above; مجلد, مشروع: the words Microsoft
// and Google both use, content/ARABIC-GLOSSARY.md). No working folder known (NO_MODEL_AT's root): the English, as before.
const listAr = (d) => (d.models || []).join('; ') + (d.more > 0 ? '; …' : '');
const noNamedAr = (d) => (!(d.models || []).length ? `لا يوجد نموذج باسم "${d.name}" في مجلد العمل ${d.root}. أعطِ read_model مسار مجلد مشروع، أو "." لمجلد العمل نفسه.`
  : `لا يوجد نموذج باسم "${d.name}" في مجلد العمل ${d.root}. ${listAr(d)}. أعطِ read_model أحد هذه المسارات، أو "." لمجلد العمل نفسه.`);
const noAtAr = (d, root) => (root == null ? null : !(d.models || []).length ? `لا يوجد شيء في "${d.path}" داخل مجلد العمل ${root}. أعد استدعاء الأداة بمسار مجلد مشروع (نسبةً إلى مجلد العمل)، أو "." لمجلد العمل نفسه.`
  : `لا يوجد شيء في "${d.path}" داخل مجلد العمل ${root}. ${listAr(d)}. أعد استدعاء الأداة بأحد هذه المسارات (نسبةً إلى مجلد العمل)، أو "." لمجلد العمل نفسه.`);
const manyNamedAr = (d) => `يوجد أكثر من نموذج في مجلد العمل باسم "${d.name}": ${(d.hits || []).join('; ')}. أعطِ read_model مسار النموذج الذي تقصده.`;
// (0.3.2 LG1, D-1105-16) lang: the person's language when the tool was given it ('ar' | 'en'); absent: AR4's letter rule
export function wordOf(e, lang) {
  const d = (e && e.data) || {};
  switch (e && e.code) {
    case 'MANY_MODELS_NAMED': if (lang === 'ar' && Array.isArray(d.hits) && d.hits.length > 1) return manyNamedAr(d); return `${e.message} Give read_model the path of the one you mean.`;
    case 'MANY_MODELS': if (Array.isArray(d.models) && d.models.length > 1 && (lang === 'ar' || (lang !== 'en' && hasArabic([d.path].concat(d.models).join(' '))))) return manyAr(d); return `${e.message} Give read_model the path of the one you mean.`;
    case 'NO_MODEL_NAMED': { const a = lang === 'ar' ? noNamedAr(d) : null; if (a) return a; } return `${e.message} ${(d.models || []).length ? 'Give read_model one of these paths, or "." for the working folder itself.' : 'Give read_model the path of a project folder, or "." for the working folder itself.'}`;
    // (0.3.1 MR1, B-271) a model path that does not exist: as a bare wrong name, the tool called again with one listed
    case 'NO_MODEL_AT': { const a = lang === 'ar' ? noAtAr(d, e.root) : null; if (a) return a; } return `${e.message} ${(d.models || []).length ? 'Call the tool again with one of these paths (relative to the working folder), or "." for the working folder itself.' : 'Call the tool again with the path of a project folder, or "." for the working folder itself.'}`;
    default: return String((e && e.message) || e);
  }
}
