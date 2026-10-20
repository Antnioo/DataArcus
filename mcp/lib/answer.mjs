// What leaves the server in an answer (audit 6): every answer goes through out() in server.mjs's text() and compact().
// A6-6: a model's names are untrusted (a measure named with a right-to-left override, U+202E, can reverse the text the
// person sees around it). nameOut writes every format character (\p{Cf}: direction marks and overrides, zero-width
// characters, the byte order mark) as a code point (‮), with model.mjs's visible(), the one rule the reading block
// uses too; the name stays usable (its other letters unchanged). Instruction-like names are not withheld here (a tool's
// answer must name the field it used): read_model's suspiciousNames and check_report flag them. Our own answers carry
// no format character, so the walk over every string changes only names that came from a model or a report.
import { visible } from './model.mjs';

// (Z-06, the outside review: control characters too, C0 and C1 such as U+0085 and U+009B, not only format characters;
// tab, line feed and carriage return stay as they are)
const FORMAT = /\p{Cf}|[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u;
export const nameOut = (s) => (FORMAT.test(String(s)) ? visible(String(s)).replace(/\\u000[9a]|\\u000d/g, (m) => ({ '\\u0009': '\t', '\\u000a': '\n', '\\u000d': '\r' }[m])) : String(s));
// every string of an answer, keys included
export function out(o) {
  if (typeof o === 'string') return nameOut(o);
  if (Array.isArray(o)) return o.map(out);
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [nameOut(k), out(v)]));
  return o;
}

// A6-8: no answer passes 40,000 characters (scope.mjs's large-model line; check_model_health at maxItems 200 on the
// 300-table model answered 166,053). Over it, the longest list is halved until the answer fits, each cut list named in
// truncated.cut with what was kept, and truncated.how says how to get the rest.
export const ANSWER_MAX = 40000;
export function capAnswer(o, size) {
  if (!o || typeof o !== 'object' || size(o) <= ANSWER_MAX) return o;
  const c = JSON.parse(JSON.stringify(o)), cut = {};
  const longest = () => {
    let best = null;
    const walk = (x, p) => {
      if (Array.isArray(x)) {
        const len = JSON.stringify(x).length;
        if (x.length > 1 && (!best || len > best.len)) best = { x, p, len };
        x.forEach((y, i) => walk(y, p + '[' + i + ']'));
      } else if (x && typeof x === 'object') Object.entries(x).forEach(([k, v]) => { if (k !== 'truncated') walk(v, p ? p + '.' + k : k); });
    };
    walk(c, '');
    return best;
  };
  // the backstop when no list is left to cut: the longest string, shortened (a single string of 200,000 characters;
  // the fuzz test's F-TP), named in cut with what was kept
  const longestString = () => {
    let best = null;
    const walk = (x, holder, key, p) => {
      if (typeof x === 'string') { if (x.length > 400 && (!best || x.length > best.x.length)) best = { x, holder, key, p }; }
      else if (Array.isArray(x)) x.forEach((y, i) => walk(y, x, i, p + '[' + i + ']'));
      else if (x && typeof x === 'object') Object.entries(x).forEach(([k, v]) => { if (k !== 'truncated') walk(v, x, k, p ? p + '.' + k : k); });
    };
    walk(c, null, null, '');
    return best;
  };
  for (let n = 0; n < 400; n++) {
    const b = longest();
    if (!b) {
      const t = longestString();
      if (!t) break;
      cut[t.p] = { keptCharacters: 400, of: t.x.length };
      t.holder[t.key] = t.x.slice(0, 400) + '…';
      c.truncated = { cut, how: `This answer was cut to stay under ${ANSWER_MAX.toLocaleString('en-US')} characters: a text over 400 characters was shortened. Tell the user the answer was cut.` };
      if (size(c) <= ANSWER_MAX) return c;
      continue;
    }
    const keep = Math.max(1, Math.floor(b.x.length / 2));
    cut[b.p] = { kept: keep, of: cut[b.p] ? cut[b.p].of : b.x.length };
    b.x.splice(keep);
    c.truncated = { cut, how: `This answer was cut to stay under ${ANSWER_MAX.toLocaleString('en-US')} characters: each list under cut kept its first items (kept of). For the rest, ask again with a smaller maxItems, a focus or tables, or for one part at a time. Tell the user the answer was cut.` };
    if (size(c) <= ANSWER_MAX) return c;
  }
  // (Z-07: an object of thousands of short keys has no list or long string to cut) the largest object, by its
  // serialized size, keeps its first keys, until the answer fits
  const largestObject = () => {
    let best = null;
    const walk = (x, p) => {
      if (Array.isArray(x)) x.forEach((y, i) => walk(y, p + '[' + i + ']'));
      else if (x && typeof x === 'object') {
        const n = Object.keys(x).length, len = JSON.stringify(x).length;
        if (p && n > 1 && (!best || len > best.len)) best = { x, p, len, n };
        Object.entries(x).forEach(([k, v]) => { if (k !== 'truncated') walk(v, p ? p + '.' + k : k); });
      }
    };
    walk(c, '');
    if (!best) { const n = Object.keys(c).filter((k) => k !== 'truncated').length; if (n > 1) best = { x: c, p: '(the answer)', n, top: true }; }
    return best;
  };
  for (let n = 0; n < 400 && size(c) > ANSWER_MAX; n++) {
    const b = largestObject();
    if (!b) break;
    const keys = Object.keys(b.x).filter((k) => k !== 'truncated'), keep = Math.max(1, Math.floor(keys.length / 2));
    keys.slice(keep).forEach((k) => { delete b.x[k]; });
    cut[b.p] = { keptKeys: keep, of: cut[b.p] && cut[b.p].of ? cut[b.p].of : keys.length };
    c.truncated = { cut, how: `This answer was cut to stay under ${ANSWER_MAX.toLocaleString('en-US')} characters: the parts under cut kept their first items or keys. For the rest, ask again with a smaller maxItems, a focus or tables, or for one part at a time. Tell the user the answer was cut.` };
  }
  // the last backstop: whatever is left, a small answer that says so
  if (size(c) > ANSWER_MAX) return { truncated: { cut: { '(the answer)': 'too large to cut into shape' }, how: `This answer was over ${ANSWER_MAX.toLocaleString('en-US')} characters and could not be cut into shape: nothing of it is shown. Ask for less: a smaller maxItems, a focus or tables, or one part at a time. Tell the user.` } };
  return c;
}

// (0.3.0 Q1) an answer that lists objects cuts its own lists, at their cause, before the backstop above has to: every
// list named by lists(answer) (each [holder, key], an array at holder[key]) keeps its first k items, the same k for all,
// the largest k that brings the answer under aim; each cut list gets "<key>NotListed": how many were left out, beside it.
// Nothing else changes (no finding, statement or refusal is dropped). Returns { k, cut } (cut: the lists cut), or null
// when nothing had to be cut.
export function fitLists(answer, lists, size, aim) {
  if (size(answer) <= aim) return null;
  const all = lists(answer).filter(([h, k]) => h && Array.isArray(h[k]));
  const full = all.map(([h, k]) => h[k].slice()), top = Math.max(0, ...full.map((x) => x.length));
  const apply = (n) => all.forEach(([h, k], i) => { h[k] = full[i].slice(0, n); if (full[i].length > n) h[k + 'NotListed'] = full[i].length - n; else delete h[k + 'NotListed']; });
  let lo = 0, hi = top;
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); apply(mid); if (size(answer) <= aim) lo = mid; else hi = mid - 1; }
  apply(lo);
  return { k: lo, cut: all.filter((x, i) => full[i].length > lo).length };
}

// A6-17: an error DataArcus did not make itself (a TypeError, a RangeError...) is told as an internal error, with what
// this call wrote before it stopped (the files module's log); never "nothing was written" when something was. Our own
// errors (plain Error, written for the user) pass unchanged.
const FOREIGN = new Set(['TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'EvalError', 'URIError', 'AggregateError']);
export function failText(e, wrote) {
  const msg = String(e && e.message || e);
  if (!(e && FOREIGN.has(e.name)) && !(e && e.code && !/^Nothing was written/.test(msg) && /^E[A-Z]+$/.test(e.code))) return msg;
  const files = (wrote || []).map(String);
  return `DataArcus could not finish: an internal error (${msg.slice(0, 200)}). ` + (files.length
    ? `It had written ${files.length} file${files.length === 1 ? '' : 's'} before it stopped: ${files.slice(0, 5).join(', ')}${files.length > 5 ? ', ...' : ''}. Check them before using them, and tell the user.`
    : 'Nothing was written.') + ' Please report this to DataArcus with what was asked.';
}
