// DataArcus's own approval window (A-01 of the outside review of rc.14; the owner's rc.16 test in Claude Desktop: the
// app has no MCP elicitation, so approve_plan answered approvedBy "assistant-reported", the assistant's word for the
// person's go). The owner's decision of 14 Oct: the person approves a plan by a click in a page of their own browser,
// which DataArcus opens on their machine; the assistant's reply approves nothing.
// How it holds: the page is served on 127.0.0.1 only, at a link with a one-time secret that is given to the browser
// and never to the assistant (no tool answer holds it); a click is taken only from that page itself (the Host and Origin
// are checked, so another site or a rebound name can't send it); the page shows what the plan writes, every model name
// as plain text. What it can't do: another program on the person's computer (one that controls their browser or mouse,
// or another tool of the AI app that runs commands or reads the browser's history) could click it too.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// (0.3.2 SP23) what each page says: approval-disclosure.mjs (pure); (SP44) its HTML: approval-view.mjs (pure); the
// server, the secret, the Host and Origin checks and the call of the click's callback: approval-http.mjs. This file
// keeps each window's life (open, wait, state, close) and the browser launch.
import * as Http from './approval-http.mjs';
export { approvalHtml, PREVIEW_PAGES_MAX } from './approval-view.mjs';
export { summary, groupFiles, kindsLine, plainLine, promptSummary, promptText, promptBox, PROMPT_SUMMARY_CAP } from './approval-disclosure.mjs';

const windows = new Map();          // planId -> { plan, show, expires, decided: null | 'approve' | 'decline', waiters, opened, seen, lost, shortcut }

// a test program: a path, or a JSON array of a program and its first arguments; the link or folder is the last argument.
// Shared by DATAARCUS_BROWSER and DATAARCUS_FOLDER_OPENER (D-1104-12). -> [cmd, args]
function ownProgram(name, value, last) {
  let cmd = value, args = [];
  if (/^\s*\[/.test(value)) { const v = JSON.parse(value); if (!Array.isArray(v) || !v.length || v.some((x) => typeof x !== 'string')) throw new Error(`${name} must be a program's path or a JSON array of strings`); [cmd, ...args] = v; }
  return [cmd, args.concat(last)];
}
/** The programs that open the page, in order: the system's default browser, then (Windows, 0.3.2 WN1 F03) explorer.exe
 *  with the link, a second way to the default browser when the first starts and then fails; or DATAARCUS_BROWSER alone
 *  (a program's path, or a JSON array of a program and its first arguments; TEST-ONLY: the tests use it for a browser of
 *  their own, never read unless set; the folder window has its own DATAARCUS_FOLDER_OPENER, below).
 *  Pure: platform and env given. -> [[cmd, args], ...] */
export function launchers(url, platform = process.platform, env = process.env) {
  if (env.DATAARCUS_BROWSER) return [ownProgram('DATAARCUS_BROWSER', env.DATAARCUS_BROWSER, url)];
  // (no shell: the link goes to the program as one argument, never through cmd's parsing of & and ^)
  if (platform === 'win32') return [['rundll32.exe', ['url.dll,FileProtocolHandler', url]], ['explorer.exe', [url]]];
  if (platform === 'darwin') return [['open', [url]]];
  return [['xdg-open', [url]]];
}
// one program started: null when it started (onExit(code) once it ends), or why it could not start
function launch([cmd, args], onExit) {
  return new Promise((resolve) => {
    let child;
    try { child = spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }); }
    catch (e) { resolve(String(e && e.message || e)); return; }
    let done = false; const end = (v) => { if (!done) { done = true; resolve(v); } };
    child.once('error', (e) => end(String(e && e.message || e)));
    child.once('spawn', () => { child.unref(); end(null); });
    if (onExit) child.once('exit', (code) => onExit(code));
  });
}

// (0.3.2 WN1, F03: Codex's Windows review) a launcher that starts and then fails left the person waiting for a page that
// never came. The page is watched: not loaded within SEEN_WAIT (or its launcher ended with an error), the next launcher
// is tried; after the last one, a shortcut to the page is written for the person to open themselves. The shortcut is a
// small HTML file (any browser opens it, on any system) in a new folder of the OS temp folder, readable by this user
// only; its link is never in a tool's answer (the AI must never be able to approve), only the file's name and folder.
// It is removed once the plan is decided or its window closed. DATAARCUS_SEEN_WAIT_MS can only shorten the wait (tests).
const SEEN_WAIT = (() => { const v = Number(process.env.DATAARCUS_SEEN_WAIT_MS); return Number.isFinite(v) && v >= 0 ? Math.min(10000, v) : 10000; })();
export const SHORTCUT_NAME = 'DataArcus approval.html';
const shortcutHtml = (url) => `<!doctype html><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0;url=${url}"><title>DataArcus approval</title><p><a href="${url}">Open DataArcus's approval page</a></p>\n`;
function writeShortcut(w, url) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-approval-')), file = path.join(dir, SHORTCUT_NAME);
  try { fs.chmodSync(dir, 0o700); } catch (e) { /* Windows: the user's own temp folder */ }
  fs.writeFileSync(file, shortcutHtml(url), { flag: 'wx', mode: 0o600 });
  w.shortcut = { dir, file };
}
function dropShortcut(w) {
  if (!w || !w.shortcut) return;
  try { fs.rmSync(w.shortcut.dir, { recursive: true, force: true }); } catch (e) { /* best effort: the temp folder */ }
  w.shortcut = null;
}
// (a server that ends leaves no shortcut behind)
process.once('exit', () => { windows.forEach((w) => dropShortcut(w)); });
// (the owner D-1109-01, A-WN1-1 (b): "on Windows, leave the location out and open the folder window for you; give it
// only on Mac and Linux") the platform the answer and the folder window follow; DATAARCUS_TEST_PLATFORM: tests only
export const platform = () => process.env.DATAARCUS_TEST_PLATFORM || process.platform;
/** The program that shows the shortcut's folder in a window: Windows explorer.exe, or the tests' own DATAARCUS_FOLDER_OPENER
 *  (TEST-ONLY, same format as DATAARCUS_BROWSER, never read unless set; DATAARCUS_BROWSER does not open the folder);
 *  null elsewhere (macOS and Linux: the answer names the folder). Pure: platform and env given. -> [cmd, args] | null */
export function folderOpener(dir, pl = platform(), env = process.env) {
  if (pl !== 'win32') return null;
  if (env.DATAARCUS_FOLDER_OPENER) return ownProgram('DATAARCUS_FOLDER_OPENER', env.DATAARCUS_FOLDER_OPENER, dir);
  return ['explorer.exe', [dir]];
}
// (FW1, B-431 b) how sure we are: the program started proves no window is on screen, so the answer says DataArcus asked
// (FOLDER_ASKED), never that it opened; one place for the word, read by notSeenAnswer
export const FOLDER_ASKED = 'asked';
// asks for the shortcut's folder window: true when its program started (Windows; the window itself is not proven), false otherwise
async function showFolder(dir) { const o = folderOpener(dir); if (!o) return false; return !(await launch(o)); }
// watches a window opened by launcher i: the next one, then the shortcut, while the page is not seen
function watch(w, url, list, i, failed) {
  const t0 = Date.now();
  const tick = () => {
    if (w.seen || w.decided || !windows.has(w.plan.id) || windows.get(w.plan.id) !== w) return;
    if (!failed.v && Date.now() - t0 < SEEN_WAIT) { w.timer = setTimeout(tick, 100); if (w.timer.unref) w.timer.unref(); return; }
    if (i + 1 < list.length) { const f = { v: false }; launch(list[i + 1], (code) => { if (code && list[i + 1][0] !== 'explorer.exe') f.v = true; }).then((why) => { if (why) f.v = true; watch(w, url, list, i + 1, f); }); return; }
    const lost = (shown) => { w.folderShown = shown; w.lost = true; w.waiters.splice(0).forEach((fn) => fn(null)); };
    try { writeShortcut(w, url); } catch (e) { w.shortcut = null; lost(false); return; }
    showFolder(w.shortcut.dir).then(lost, () => lost(false));
  };
  tick();
}

/** Opens (or, with reopen, opens again) the approval window of a plan. plan: { id, kind, writes }; show: { title,
 *  sections: [{ heading, rows: [[label, value | [values]]] }] }; expires: when the plan expires (ms); onDecide(id,
 *  decision): called once, on the click. Returns { opened: true } or { opened: false, why }. */
export async function open(plan, show, expires, onDecide, reopen) {
  await Http.listen({ find: (id) => windows.get(id), seen: (w) => { w.seen = true; },
    decide: (w, d) => { w.decided = d; try { onDecide(w.plan.id, d); } catch (e) { w.decided = null; return; } dropShortcut(w); w.waiters.splice(0).forEach((f) => f(d)); } });
  let w = windows.get(plan.id);
  if (w && w.decided) return { opened: false, why: 'decided' };
  if (!w) {
    w = { plan: { id: plan.id, kind: plan.kind, writes: plan.writes.slice() }, show, expires, decided: null, waiters: [], opened: false, seen: false };
    windows.set(plan.id, w); Http.issue(plan.id);
  } else if (w.opened && !reopen) return { opened: true, again: false };
  const url = Http.linkOf(plan.id), list = launchers(url), failed = { v: false };
  clearTimeout(w.timer); dropShortcut(w); w.lost = false;
  const why = await launch(list[0], (code) => { if (code) failed.v = true; });
  if (why) return { opened: false, why };
  w.opened = true;
  if (!w.seen) watch(w, url, list, 0, failed);
  return { opened: true, again: !!reopen };
}

/** Waits up to ms for the click on a plan's window: 'approve', 'decline', or null (no click yet). */
export function wait(id, ms) {
  const w = windows.get(id);
  if (!w) return Promise.resolve(null);
  if (w.decided) return Promise.resolve(w.decided);
  if (w.lost && !w.seen) return Promise.resolve(null);
  return new Promise((resolve) => {
    const f = (d) => { clearTimeout(t); resolve(d); };
    const t = setTimeout(() => { const i = w.waiters.indexOf(f); if (i >= 0) w.waiters.splice(i, 1); resolve(null); }, Math.max(0, ms));
    w.waiters.push(f);
  });
}

/** What the window of a plan knows: null (none), or { opened, seen, decided, shortcut? } (shortcut: { dir, file } once
 *  the page was not seen and a shortcut was written, WN1 F03; the file holds the link, the answer never does). */
export function state(id) { const w = windows.get(id); return w ? Object.assign({ opened: w.opened, seen: w.seen, decided: w.decided }, w.shortcut && !w.seen ? { shortcut: Object.assign({}, w.shortcut), folderShown: !!w.folderShown } : {}) : null; }

/** approve_plan's answer when the page was not seen and a shortcut was written (WN1 F03). The link is never in it. On
 *  Windows (D-1109-01) neither the shortcut's folder nor its name either: DataArcus asked Windows to open the folder window (shown: the program started, a window is not proven) and
 *  the answer says only that; on macOS and Linux it names the file and its folder. Pure: platform given. */
export function notSeenAnswer(planId, sc, pl, shown) {
  const tail = 'The link is in that file only, never in this answer: only the person approves. When they say they clicked, call approve_plan again with this planId. Nothing is approved by what is typed in the chat, and nothing was written.';
  const head = 'Not approved yet: DataArcus asked the browser to open its approval window, but the page was not opened.';
  if (pl === 'win32') return { planId, status: 'waiting', approvedBy: null, window: 'not seen', folderWindow: shown ? FOLDER_ASKED : 'not opened',
    sayFirst: shown ? `${head} DataArcus asked Windows to open a folder window on the user's computer that holds one file, a shortcut to the approval page (Windows may not have shown it: ask the user whether they see it). Tell the user to double-click that file (or drag it into any web browser): it opens DataArcus's approval page, which shows the plan and every file it writes; then click Approve there (or "Not now"). If they can't find the folder window, call approve_plan again with this planId and reopen: true. Where the file is stays out of this answer on purpose. ${tail}`
      : `${head} DataArcus could not open the folder window that holds its shortcut either. Ask the user to check that Windows Explorer works, then call approve_plan again with this planId and reopen: true. ${tail}` };
  return { planId, status: 'waiting', approvedBy: null, window: 'not seen', shortcut: { file: sc.file, folder: sc.dir },
    sayFirst: `${head} Tell the user to open the file "${SHORTCUT_NAME}" in the folder ${sc.dir} (double-click it, or drag it into any web browser): it opens DataArcus's approval page, which shows the plan and every file it writes; then click Approve there (or "Not now"). ${tail}` };
}

/** Forgets a plan's window (its link answers "no longer valid" from then on). */
export function close(id) { const w = windows.get(id); if (w) { clearTimeout(w.timer); dropShortcut(w); Http.revoke(id); windows.delete(id); w.waiters.splice(0).forEach((f) => f(null)); } }
