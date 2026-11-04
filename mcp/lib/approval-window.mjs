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
// (0.3.2 SP23) what each page says: approval-disclosure.mjs (pure); (SP44) its HTML: approval-view.mjs (pure); the
// server, the secret, the Host and Origin checks and the call of the click's callback: approval-http.mjs. This file
// keeps each window's life (open, wait, state, close) and the browser launch.
import * as Http from './approval-http.mjs';
export { approvalHtml, PREVIEW_PAGES_MAX } from './approval-view.mjs';
export { summary, groupFiles, kindsLine, plainLine, promptSummary, promptText, promptBox, PROMPT_SUMMARY_CAP } from './approval-disclosure.mjs';

const windows = new Map();          // planId -> { plan, show, expires, decided: null | 'approve' | 'decline', waiters, opened, seen }

/** The program that opens the page: the system's default browser, or DATAARCUS_BROWSER (a program's path, or a JSON
 *  array of a program and its first arguments; the tests use it for a browser of their own). */
function browserCommand(url) {
  const own = process.env.DATAARCUS_BROWSER;
  if (own) {
    let cmd = own, args = [];
    if (/^\s*\[/.test(own)) { const v = JSON.parse(own); if (!Array.isArray(v) || !v.length || v.some((x) => typeof x !== 'string')) throw new Error('DATAARCUS_BROWSER must be a program\'s path or a JSON array of strings'); [cmd, ...args] = v; }
    return [cmd, args.concat(url)];
  }
  // (no shell: the link goes to the program as one argument, never through cmd's parsing of & and ^)
  if (process.platform === 'win32') return ['rundll32.exe', ['url.dll,FileProtocolHandler', url]];
  if (process.platform === 'darwin') return ['open', [url]];
  return ['xdg-open', [url]];
}
function launch(url) {
  return new Promise((resolve) => {
    let child;
    try { const [cmd, args] = browserCommand(url); child = spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }); }
    catch (e) { resolve(String(e && e.message || e)); return; }
    let done = false; const end = (v) => { if (!done) { done = true; resolve(v); } };
    child.once('error', (e) => end(String(e && e.message || e)));
    child.once('spawn', () => { child.unref(); end(null); });
  });
}



/** Opens (or, with reopen, opens again) the approval window of a plan. plan: { id, kind, writes }; show: { title,
 *  sections: [{ heading, rows: [[label, value | [values]]] }] }; expires: when the plan expires (ms); onDecide(id,
 *  decision): called once, on the click. Returns { opened: true } or { opened: false, why }. */
export async function open(plan, show, expires, onDecide, reopen) {
  await Http.listen({ find: (id) => windows.get(id), seen: (w) => { w.seen = true; },
    decide: (w, d) => { w.decided = d; try { onDecide(w.plan.id, d); } catch (e) { w.decided = null; return; } w.waiters.splice(0).forEach((f) => f(d)); } });
  let w = windows.get(plan.id);
  if (w && w.decided) return { opened: false, why: 'decided' };
  if (!w) {
    w = { plan: { id: plan.id, kind: plan.kind, writes: plan.writes.slice() }, show, expires, decided: null, waiters: [], opened: false, seen: false };
    windows.set(plan.id, w); Http.issue(plan.id);
  } else if (w.opened && !reopen) return { opened: true, again: false };
  const why = await launch(Http.linkOf(plan.id));
  if (why) return { opened: false, why };
  w.opened = true;
  return { opened: true, again: !!reopen };
}

/** Waits up to ms for the click on a plan's window: 'approve', 'decline', or null (no click yet). */
export function wait(id, ms) {
  const w = windows.get(id);
  if (!w) return Promise.resolve(null);
  if (w.decided) return Promise.resolve(w.decided);
  return new Promise((resolve) => {
    const f = (d) => { clearTimeout(t); resolve(d); };
    const t = setTimeout(() => { const i = w.waiters.indexOf(f); if (i >= 0) w.waiters.splice(i, 1); resolve(null); }, Math.max(0, ms));
    w.waiters.push(f);
  });
}

/** What the window of a plan knows: null (none), or { opened, seen, decided }. */
export function state(id) { const w = windows.get(id); return w ? { opened: w.opened, seen: w.seen, decided: w.decided } : null; }

/** Forgets a plan's window (its link answers "no longer valid" from then on). */
export function close(id) { const w = windows.get(id); if (w) { Http.revoke(id); windows.delete(id); w.waiters.splice(0).forEach((f) => f(null)); } }
