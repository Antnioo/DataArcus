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
 * The ledger: mcp/docs/CONTRACTS.md "Equal copies, not probed"; the test: scripts/tests/dd2w.mjs.
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
  const api = Object.freeze({ toast, boxToast, copyText });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPageToast = api;
})(typeof self !== 'undefined' ? self : this);
