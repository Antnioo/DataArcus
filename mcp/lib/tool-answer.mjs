// How every tool answers: the answer's text (scrubbed of local paths, capped), its errors and the working folder's notice,
// and safe(), the wrapper around each tool's handler.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ROOT, rootProblem, Notice } from './model.mjs';
import { wordOf } from './read-words.mjs';
import { writtenSince } from './files.mjs';
import { nameOut as textOut, out, capAnswer, failText, ANSWER_MAX } from './answer.mjs';

// Round 17 (the outside review's G-02, privacy): no answer or error sends an absolute local path to the AI. Paths in the
// working folder become relative to it, the working folder itself is named by its last folder name, and the user's home
// folder becomes "~" (a Windows path holds the user name). The local log (stderr) keeps full paths.
const scrub = (str) => {
  let s = String(str);
  const forms = (p) => (p ? [...new Set([p, p.replace(/\\/g, '/'), p.replace(/\\/g, '\\\\')])].sort((a, b) => b.length - a.length) : []);
  const roots = ROOT ? [...new Set([ROOT, (() => { try { return fs.realpathSync.native(ROOT); } catch (e) { return ROOT; } })()])] : [];
  for (const r of roots) for (const f of forms(r)) { s = s.split(f + '/').join('').split(f + '\\\\').join('').split(f + '\\').join('').split(f).join(path.basename(r)); }
  const home = os.homedir();
  if (home && home.length > 3) for (const f of forms(home)) s = s.split(f).join('~');
  return s;
};
// (audit 6, A6-6: every answer leaves through out(): a model name's hidden characters as code points, lib/answer.mjs)
// (A6-8: and no answer passes 40,000 characters: capAnswer cuts the longest lists and says so)
export const pretty = (o) => JSON.stringify(o, null, 2), flat = (o) => JSON.stringify(o);
// (CX1, Codex's F11: a text answer passed whole) a text over 40,000 characters is cut as the lists are, and the cut said
const CUT_SAID = `\n\n(This answer was cut to stay under ${ANSWER_MAX.toLocaleString('en-US')} characters: the rest is not shown. Ask for one part at a time. Tell the user the answer was cut.)`;
// (FX6, Codex's D05) never inside a control character's escape (model.mjs visible(): \u and 4 or 5 hex digits): the cut
// goes back to the escape's start, then never after a lone high surrogate
const capText = (s) => { if (s.length <= ANSWER_MAX) return s; let n = ANSWER_MAX - CUT_SAID.length;
  const i = s.lastIndexOf('\\', n - 1), tok = i > n - 7 ? /^\\u[0-9a-f]{4,5}/.exec(s.slice(i, i + 7)) : null; if (tok && i + tok[0].length > n) n = i;
  if (/[\uD800-\uDBFF]/.test(s[n - 1])) n--; return s.slice(0, n) + CUT_SAID; };
// (0.3.2 TK1, B-273: an answer under the cap was pretty-printed, 20-36% of it spaces sent to the AI) every answer is flat
// JSON, here only. The tools' own list cuts still measure as before (pretty, against AIM), so an answer keeps the same items
export const text = (o, opts) => (typeof o === 'string' ? { content: [{ type: 'text', text: capText(scrub(textOut(o))) }] } : compact(o, opts));
export const compact = (o, opts) => ({ content: [{ type: 'text', text: scrub(flat(capAnswer(out(o), (x) => flat(x).length, opts))) }] });
// (A1-9: the reading block's coded errors are worded here, in the tool layer; A6: a name's invisible characters shown, nameOut)
// (0.3.2 TK1, B-281: an error skipped the cap) an error answer is capped as a text answer is, the cut said
const fail = (e, lang) => ({ isError: true, content: [{ type: 'text', text: capText(scrub(textOut(wordOf(e, lang)))) }] });
// A working folder that is chosen but can't be used yet (it doesn't exist, or it is empty): a normal answer with what
// to do, not an error (an AI app shows an error as "Failed" in red, though nothing went wrong). Nothing is read or written.
const notice = (state, whatToDo) => text({ workingFolder: ROOT ? path.basename(ROOT) : ROOT, state, done: 'Nothing was read or written.', whatToDo });
// no working folder set: every tool refuses with the reason and touches no file
// (audit 6, A6-17: an internal error is told as one, with what this call wrote, from the files module's log)
// (0.3.3 WE1, D-1109-02) a write tool's schema fills lang "en" before its handler runs, so "given" is told from "absent"
// here, once: guardInputErrors marks the parsed arguments when the call's raw arguments held their own lang (a Symbol,
// never enumerable, never in an answer); langGiven(args) is that lang ("en" | "ar"), else undefined (AR4's letter rule)
const LANG_GIVEN = Symbol('lang given');
export const langGiven = (args) => (args && args[LANG_GIVEN] && (args.lang === 'ar' || args.lang === 'en') ? args.lang : undefined);
// (0.3.2 LG1) opts.lang: the tool's own lang input also says its coded errors. true: the reading tools (lang optional,
// no default); 'given' (WE1): the write tools, only a lang the call gave (a default "en" would turn AR4's letter rule off)
export const safe = (fn, opts) => async (args) => { const mark = writtenSince(), lang = !opts || !opts.lang || !args ? undefined : opts.lang === 'given' ? langGiven(args) : args.lang; try { const problem = rootProblem(); if (problem) return ROOT ? notice('missing', problem) : fail(problem); return await fn(args); } catch (e) { return e instanceof Notice ? notice(e.state, e.message) : fail(e && e.code && !/^E[A-Z]+$/.test(e.code) ? e : failText(e, writtenSince(mark)), lang); } };   // (a reading block's coded error is worded by wordOf, A1-9; any other by failText, A6)

// (0.3.2 RV1, B-392: Codex's release review; check_report with 300 invalid items answered 46,772 characters, 1,000 answered
// 155,972) The SDK checks a call's input against the tool's schema BEFORE any handler runs and answers with zod's whole
// message, so safe()'s cap never saw it. Fixed here, once, for every tool: a validation error is short (what was wrong at
// the first few places, how many more, how to retry), and every error the SDK itself makes is capped as safe()'s are.
// English, and Arabic when the call's own lang is "ar" (the Arabic wording approved by the owner, D-1108-16).
const PASS_MAX = 1500, SHOWN = 5, ISSUE_MAX = 400, KEYS_MAX = 1500, VALUE_MAX = 40;   // (an unknown-key issue lists the tool's inputs: its own words are kept whole)
const at = (obj, keys) => keys.reduce((o, k) => (o != null && typeof o === 'object' ? o[k] : undefined), obj);
const pathOf = (keys) => keys.map((k, i) => (typeof k === 'number' ? `[${k}]` : (i ? '.' : '') + String(k).slice(0, 60))).join('') || '(the input)';
const gotOf = (v) => (typeof v === 'string' ? `'${v.slice(0, VALUE_MAX)}${v.length > VALUE_MAX ? '...' : ''}'` : Array.isArray(v) ? `a list of ${v.length}` : v && typeof v === 'object' ? 'an object' : String(v));
export const inputErrorSaid = (tool, issues, args, lang) => {
  const list = issues || [], shown = list.slice(0, SHOWN);
  const one = (i) => { const keys = (i.path || []), v = at(args, keys), msg = String(i.message || 'invalid').slice(0, i.code === 'unrecognized_keys' ? KEYS_MAX : ISSUE_MAX);
    return `${pathOf(keys)}: ${msg}${i.code === 'unrecognized_keys' || v === undefined ? '' : ` (got ${gotOf(v)})`}`; };
  const more = list.length - shown.length;
  // (D-1108-16: the owner approved this Arabic wording) lang "ar" as the tool's own lang input says it
  if (lang === 'ar') return `خطأ في المدخلات: الأداة ${String(tool).slice(0, 60)} رفضت ${list.length} مشكلة${more > 0 ? `. أول ${shown.length} مشكلات` : ''}: ${shown.map(one).join('; ')}${more > 0 ? `؛ و ${more} أخرى` : ''}. صحّح المدخلات وأعد الاستدعاء.`;
  return `Input validation error: Invalid arguments for tool ${String(tool).slice(0, 60)}: ${list.length} problem${list.length === 1 ? '' : 's'}. ${shown.map(one).join('; ')}${more > 0 ? `; and ${more} more` : ''}. Fix the input and call again.`;
};
// installs both on a server (server.mjs, after the tools are registered): validateToolInput and createToolError are the
// SDK's own steps; wrapping them on the instance leaves node_modules as it is
export const guardInputErrors = (server) => {
  const check = server.validateToolInput.bind(server);
  server.validateToolInput = async (tool, args, name) => {
    let parsed;
    try { parsed = await check(tool, args, name); }
    catch (e) {
      // a message already short is the SDK's own, unchanged (pinned by older suites); only a long one is rebuilt
      if (e instanceof McpError && e.code === ErrorCode.InvalidParams && (String(e.message).length > PASS_MAX || (args && args.lang === 'ar')) && tool && tool.inputSchema && typeof tool.inputSchema.safeParseAsync === 'function') {
        const r = await tool.inputSchema.safeParseAsync(args ?? {});
        if (!r.success) throw new McpError(ErrorCode.InvalidParams, inputErrorSaid(name, r.error.issues, args, args && args.lang === 'ar' ? 'ar' : 'en'));
      }
      throw e;
    }
    if (parsed && typeof parsed === 'object' && args && typeof args === 'object' && Object.hasOwn(args, 'lang')) Object.defineProperty(parsed, LANG_GIVEN, { value: true });
    return parsed;
  };
  server.createToolError = (message) => ({ isError: true, content: [{ type: 'text', text: capText(scrub(String(message))) }] });
};
