// What leaves the server in an answer (audit 6): every answer goes through out() in server.mjs's text() and compact().
// A6-6: a model's names are untrusted (a measure named with a right-to-left override, U+202E, can reverse the text the
// person sees around it). nameOut writes every format character (\p{Cf}: direction marks and overrides, zero-width
// characters, the byte order mark) as a code point (‮), with model.mjs's visible(), the one rule the reading block
// uses too; the name stays usable (its other letters unchanged). Instruction-like names are not withheld here (a tool's
// answer must name the field it used): read_model's suspiciousNames and check_report flag them. Our own answers carry
// no format character, so the walk over every string changes only names that came from a model or a report.
import { visible } from './model.mjs';

const FORMAT = /\p{Cf}/u;
export const nameOut = (s) => (FORMAT.test(String(s)) ? visible(String(s)).replace(/\\u000[9a]|\\u000d/g, (m) => ({ '\\u0009': '\t', '\\u000a': '\n', '\\u000d': '\r' }[m])) : String(s));
// every string of an answer, keys included
export function out(o) {
  if (typeof o === 'string') return nameOut(o);
  if (Array.isArray(o)) return o.map(out);
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [nameOut(k), out(v)]));
  return o;
}
