// (0.3.2 SP44, the split: B-280, B-286) the HTTP side of DataArcus's own approval window, moved here from
// approval-window.mjs as it was. It alone owns the server on 127.0.0.1, the one-time secret (made, looked up and
// forgotten), the Host, Origin and Sec-Fetch-Site checks, the methods, the headers, and the call of the decision
// callback; approval-window.mjs keeps each window's life (open, wait, state, close) and the browser launch;
// approval-view.mjs draws the pages (it never sees the secret).
// The interface (D-1103-11):
//   listen({ find, seen, decide }) -> a promise, resolved once the server listens (the first call's hooks are kept).
//     find(id) -> the window of a plan id ({ plan, show, expires, decided }) or nothing; seen(w): the page was loaded;
//     decide(w, d): one click, d 'approve' or 'decline', called only for a window not decided yet and only from the
//     page itself (the right Host, the right secret, a POST from its Origin or Sec-Fetch-Site same-origin).
//   issue(id): makes the plan's one-time secret (24 random bytes, base64url); linkOf(id) -> the link that holds it,
//     given only to the browser (never in a tool's answer); revoke(id): the link answers "no longer valid" from then on.
import http from 'node:http';
import crypto from 'node:crypto';
import { askPage, donePage, gonePage } from './approval-view.mjs';

const bySecret = new Map();         // secret -> planId
const secretOf = new Map();         // planId -> secret
let server = null, port = 0, starting = null;

function headers(res, code, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin',
    // (0.3.1 GD2: the preview draws a glass page on its soft picture, inline in the page as a PNG data URL) img-src data:
    // only: no image is ever fetched, from anywhere
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" });
}

function onRequest(req, res, hooks) {
  const here = `127.0.0.1:${port}`;
  // (DNS rebinding: a page of another name that resolves to 127.0.0.1 sends its own Host)
  if (req.headers.host !== here) { headers(res, 421, 'text/plain; charset=utf-8'); res.end('Wrong host'); return; }
  const m = /^\/approve\/([A-Za-z0-9_-]{20,64})$/.exec((req.url || '').split('?')[0]);
  const id = m && bySecret.get(m[1]), w = id && hooks.find(id);
  if (!w || (w.expires && Date.now() > w.expires)) { headers(res, 404); res.end(gonePage()); return; }
  if (req.method === 'GET') { hooks.seen(w); headers(res, 200); res.end(w.decided ? donePage({ plan: w.plan, show: w.show, decided: w.decided }) : askPage({ plan: w.plan, show: w.show })); return; }
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
    if (!w.decided && (d === 'approve' || d === 'decline')) hooks.decide(w, d);
    headers(res, w.decided ? 200 : 400); res.end(w.decided ? donePage({ plan: w.plan, show: w.show, decided: w.decided }) : gonePage());
  });
}

export async function listen(hooks) {
  if (server) return;
  if (!starting) starting = new Promise((resolve, reject) => {
    const s = http.createServer((req, res) => { try { onRequest(req, res, hooks); } catch (e) { try { headers(res, 500, 'text/plain; charset=utf-8'); res.end('Error'); } catch (x) { /* closed */ } } });
    s.once('error', (e) => { starting = null; reject(e); });
    s.listen(0, '127.0.0.1', () => { server = s; port = s.address().port; s.unref(); resolve(); });
  });
  await starting;
}

/** Makes the one-time secret of a plan's window (a new one each time: an old one is forgotten first). */
export function issue(id) { revoke(id); const secret = crypto.randomBytes(24).toString('base64url'); secretOf.set(id, secret); bySecret.set(secret, id); }

/** The link of a plan's window (null when it has none): the browser's only, never a tool's answer. */
export function linkOf(id) { const secret = secretOf.get(id); return secret ? `http://127.0.0.1:${port}/approve/${secret}` : null; }

/** Forgets a plan's secret: its link answers "no longer valid" from then on. */
export function revoke(id) { const secret = secretOf.get(id); if (secret) { bySecret.delete(secret); secretOf.delete(id); } }
