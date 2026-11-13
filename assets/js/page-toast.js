/* DataArcus page toast and copy: the short message a tool page shows, and a copy with its select-the-text fallback, in
 * one place (0.3.2 DD2W; the owner D-1104-12 "we create a library of functions where a place calls them so if we need
 * to fix something we fix it at the source").
 *   toast(msg, { ms, el, cls })  msg as the element's text, shown, hidden again after ms (1800 unless given); a second
 *               call clears the first one's timer. el: the page's #toast unless given. cls: shown by that class (the
 *               boxes, 'show'); without it by the element's opacity (1, then 0), as the #toast pages do.
 *   boxToast(id, className)  the element #id, made once (a div with that id and class, role "status", the body's last
 *               child) when the page has none: the exam and health check pages' own boxes.
 *   copyText(text, node, { done, selected, toast })  the clipboard first (then toast(done)); refused or missing: the
 *               text of node selected and toast(selected). toast is the page's own (its time); the texts are the page's.
 *   el(doc, tag, cls, text)  a new element of doc: its class when cls is given, its text when text is not null (0.3.3 SG1:
 *               the build page's cards and Fuel panel, the theme page's names box).
 *   saveState(key, state)  the page's state as JSON in this browser's localStorage under key; refused (private mode,
 *               full) or missing: nothing, never an error (0.3.3 SG1: the calendar, measure builder and licensing pages).
 * The ledger: mcp/docs/CONTRACTS.md "Equal copies, not probed"; the tests: scripts/tests/dd2w.mjs, mcp/test-0.3.3-sg1.mjs.
 * Browser and Node (module.exports / window.DAPageToast). Reads document, navigator and getSelection when called. */
(function (root) {
  'use strict';
  const timers = new WeakMap();
  function toast(msg, opts) {
    const o = opts || {}, t = o.el || document.getElementById('toast');
    t.textContent = msg;
    if (o.cls) t.classList.add(o.cls); else t.style.opacity = 1;
    clearTimeout(timers.get(t));
    timers.set(t, setTimeout(() => { if (o.cls) t.classList.remove(o.cls); else t.style.opacity = 0; }, o.ms == null ? 1800 : o.ms));
  }
  function boxToast(id, className) {
    let t = document.getElementById(id);
    if (!t) { t = document.createElement('div'); t.id = id; t.className = className; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    return t;
  }
  function copyText(text, node, opts) {
    const o = opts || {}, say = o.toast || toast;
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(node); const s = getSelection(); s.removeAllRanges(); s.addRange(r); say(o.selected); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => say(o.done), fallback); else fallback();
  }
  const el = (doc, tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const saveState = (key, state) => { try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) { /* private mode */ } };
  const api = Object.freeze({ toast, boxToast, copyText, el, saveState });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPageToast = api;
})(typeof self !== 'undefined' ? self : this);
