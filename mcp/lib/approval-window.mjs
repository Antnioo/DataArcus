// DataArcus's own approval window (A-01 of the outside review of rc.14; the owner's rc.16 test in Claude Desktop: the
// app has no MCP elicitation, so approve_plan answered approvedBy "assistant-reported", the assistant's word for the
// person's go). The owner's decision of 14 Oct: the person approves a plan by a click in a page of their own browser,
// which DataArcus opens on their machine; the assistant's reply approves nothing.
// How it holds: the page is served on 127.0.0.1 only, at a link with a one-time secret that is given to the browser
// and never to the assistant (no tool answer holds it); a click is taken only from that page itself (the Host and Origin
// are checked, so another site or a rebound name can't send it); the page shows what the plan writes, every model name
// as plain text. What it can't do: another program on the person's computer (one that controls their browser or mouse,
// or another tool of the AI app that runs commands or reads the browser's history) could click it too.
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
// (0.3.2 SP23) what each page says: approval-disclosure.mjs (pure); (SP44) its HTML: approval-view.mjs (pure); this
// file alone holds the secret, the Host and Origin checks, the click and the window's life
import { askPage, donePage, gonePage } from './approval-view.mjs';
export { approvalHtml, PREVIEW_PAGES_MAX } from './approval-view.mjs';
export { summary, groupFiles, kindsLine, plainLine, promptSummary, promptText, promptBox, PROMPT_SUMMARY_CAP } from './approval-disclosure.mjs';

const windows = new Map();          // planId -> { secret, plan, show, decided: null | 'approve' | 'decline', waiters, opened, seen }
const bySecret = new Map();         // secret -> planId
let server = null, port = 0, starting = null;

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


function headers(res, code, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin',
    // (0.3.1 GD2: the preview draws a glass page on its soft picture, inline in the page as a PNG data URL) img-src data:
    // only: no image is ever fetched, from anywhere
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" });
}

function onRequest(req, res, decide) {
  const here = `127.0.0.1:${port}`;
  // (DNS rebinding: a page of another name that resolves to 127.0.0.1 sends its own Host)
  if (req.headers.host !== here) { headers(res, 421, 'text/plain; charset=utf-8'); res.end('Wrong host'); return; }
  const m = /^\/approve\/([A-Za-z0-9_-]{20,64})$/.exec((req.url || '').split('?')[0]);
  const id = m && bySecret.get(m[1]), w = id && windows.get(id);
  if (!w || (w.expires && Date.now() > w.expires)) { headers(res, 404); res.end(gonePage()); return; }
  if (req.method === 'GET') { w.seen = true; headers(res, 200); res.end(w.decided ? donePage({ plan: w.plan, show: w.show, decided: w.decided }) : askPage({ plan: w.plan, show: w.show })); return; }
  if (req.method !== 'POST') { headers(res, 405, 'text/plain; charset=utf-8'); res.end('Method not allowed'); return; }
  // (a click comes only from the page itself: its Origin, or, when a browser sends none or "null", Sec-Fetch-Site
  // same-origin, which a web page can't set. The referrer policy is same-origin, not no-referrer: with no-referrer
  // Chromium sends Origin "null" on the form's POST, found by a real click in Chromium, 14 Oct)
  const origin = req.headers.origin, site = req.headers['sec-fetch-site'];
  if (!(origin === 'http://' + here || ((!origin || origin === 'null') && site === 'same-origin'))) { headers(res, 403, 'text/plain; charset=utf-8'); res.end('Refused: the click must come from the DataArcus page itself.'); return; }
  let body = '';
  req.setEncoding('utf8');
  req.on('data', (c) => { body += c; if (body.length > 1000) req.destroy(); });
  req.on('end', () => {
    const d = new URLSearchParams(body).get('decision');
    if (!w.decided && (d === 'approve' || d === 'decline')) decide(w, d);
    headers(res, w.decided ? 200 : 400); res.end(w.decided ? donePage({ plan: w.plan, show: w.show, decided: w.decided }) : gonePage());
  });
}

async function listen(decide) {
  if (server) return;
  if (!starting) starting = new Promise((resolve, reject) => {
    const s = http.createServer((req, res) => { try { onRequest(req, res, decide); } catch (e) { try { headers(res, 500, 'text/plain; charset=utf-8'); res.end('Error'); } catch (x) { /* closed */ } } });
    s.once('error', (e) => { starting = null; reject(e); });
    s.listen(0, '127.0.0.1', () => { server = s; port = s.address().port; s.unref(); resolve(); });
  });
  await starting;
}

/** Opens (or, with reopen, opens again) the approval window of a plan. plan: { id, kind, writes }; show: { title,
 *  sections: [{ heading, rows: [[label, value | [values]]] }] }; expires: when the plan expires (ms); onDecide(id,
 *  decision): called once, on the click. Returns { opened: true } or { opened: false, why }. */
export async function open(plan, show, expires, onDecide, reopen) {
  await listen((w, d) => { w.decided = d; try { onDecide(w.plan.id, d); } catch (e) { w.decided = null; return; } w.waiters.splice(0).forEach((f) => f(d)); });
  let w = windows.get(plan.id);
  if (w && w.decided) return { opened: false, why: 'decided' };
  if (!w) {
    const secret = crypto.randomBytes(24).toString('base64url');
    w = { secret, plan: { id: plan.id, kind: plan.kind, writes: plan.writes.slice() }, show, expires, decided: null, waiters: [], opened: false, seen: false };
    windows.set(plan.id, w); bySecret.set(secret, plan.id);
  } else if (w.opened && !reopen) return { opened: true, again: false };
  const why = await launch(`http://127.0.0.1:${port}/approve/${w.secret}`);
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
export function close(id) { const w = windows.get(id); if (w) { bySecret.delete(w.secret); windows.delete(id); w.waiters.splice(0).forEach((f) => f(null)); } }
