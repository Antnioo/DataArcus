// check_report's one redaction boundary (0.3.2 SP41, the split of lib/check-report.mjs: B-280, B-286; mcp/work/SP41.md):
// pure functions, a report's text in, the text an answer may carry out. A report's text is untrusted input and private:
// a validator's or a schema's message never carries a name or a value of the report, a path is relative and cleaned,
// every name capped and its invisible characters written as code points (read-report.mjs's safeName, model.mjs's
// visible). check-report.mjs (the validator's findings, the answer) and check-schema.mjs (the schemas' findings) use
// these, and nothing else cleans a finding: every finding and every notChecked line leaves check_report through tidy.
//   scrub(message, reportDir) -> the message without quoted parts and file paths (240 characters at most)
//   maskValues(message)       -> the message with each quoted value written <value>
//   rel(reportDir, file)      -> the file's path inside the report, with /
//   relOut(file)              -> the file's path inside the working folder, each part cleaned
//   cleanPath(file)           -> a report path, each part cleaned (null stays null)
//   tidy(finding)             -> the finding as the answer gives it (file, what, page id, visual name and type cleaned)
import path from 'node:path';
import { ROOT, visible } from './model.mjs';
import { safeName } from './read-report.mjs';

// a validator message, without the report's own text: quoted parts and file paths are left out
// (0.3.0 S1, B-211: L4 saw a name in `what`) the validator quotes a name in "..."; a name that holds a quote itself
// ("Sales "North"", "O'Brien") broke the pairs, so a quoted part counts only where it stands alone (after the start, a
// space or a bracket; before the end, a space or punctuation), and when two or more quotes are still left, everything
// from the first to the last is masked (the words between them too): never a name
const QUOTES = /['"“”‘’]/g;
export const scrub = (m, reportDir) => {
  let s = String(m || '').split(reportDir).join('<report>').replace(/(^|[\s([])(['"“”‘’])[^'"“”‘’]{0,400}\2(?=$|[\s:,;.)\]])/g, '$1<text>');
  const left = [...s.matchAll(QUOTES)];
  if (left.length >= 2) s = s.slice(0, left[0].index) + '<text>' + s.slice(left[left.length - 1].index + 1);
  return s.replace(/(?:[A-Za-z]:)?[\\/][^\s:,;)]+/g, '<file>').slice(0, 240);
};
// a schema message: the values it quotes (a report's value, as an enum's or a pattern's) left out
export const maskValues = (m) => String(m || '').replace(/['"][^'"]*['"]/g, '<value>');
export const rel = (reportDir, f) => path.relative(reportDir, f).split(path.sep).join('/');
export const relOut = (f) => path.relative(ROOT, f).split(path.sep).map(safeName).join('/');
// everything from the report that reaches the answer is cleaned (B-03): invisible and direction characters as code
// points, names and folder names capped at 60; a visual's type kept only when it is a plain word
export const cleanPath = (f) => (f == null ? f : String(f).split('/').map(safeName).join('/'));
export const tidy = (f) => Object.assign({}, f, { file: cleanPath(f.file), what: visible(f.what), page: f.page ? { id: safeName(f.page.id), name: f.page.name } : f.page,
  visual: f.visual ? Object.assign({}, f.visual, { name: safeName(f.visual.name), type: /^[A-Za-z][A-Za-z0-9_]{0,59}$/.test(String(f.visual.type)) ? f.visual.type : 'other (' + safeName(f.visual.type) + ')' }) : f.visual });
