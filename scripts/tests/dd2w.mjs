// 0.3.2 DD2W (mcp/work/DD2W.md): one toast and one copy helper for the tool pages, assets/js/page-toast.js (their one
// home; CONTRACTS.md "Equal copies, not probed"). Every message, time, element and class as before the move.
//   T1-T6  toast on a fake document: the text, opacity 1 then 0 after ms (1800 unless given), a second call clears
//          the first one's timer, the element given, a class instead of the opacity (the boxes)
//   B1-B3  boxToast: made once (id, class, role status, the body's last child), found the second time
//   C1-C4  copyText: the clipboard path (done), a refused clipboard (the node's text selected, selected), no clipboard
//          (the same), the page's own toast used for both
//   S1     the source and the .min.js give the same answers (the pages load the .min.js)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { ROOT } from './lib.mjs';

const require = createRequire(import.meta.url);

// a fake page: elements with text, style, classes and attributes; a clock that runs only when told
function fakePage() {
  const els = new Map(), body = { children: [], appendChild(e) { this.children.push(e); els.set(e.id, e); return e; } };
  const el = (id) => {
    const cls = new Set();
    const e = { id, textContent: '', style: {}, attrs: {}, tag: 'div',
      classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), contains: (c) => cls.has(c) },
      setAttribute(k, v) { this.attrs[k] = String(v); },
      get className() { return [...cls].join(' '); }, set className(v) { cls.clear(); String(v).split(/\s+/).filter(Boolean).forEach((c) => cls.add(c)); } };
    if (id) els.set(id, e);
    return e;
  };
  const timers = new Map(); let next = 1;
  const clock = { set: [], cleared: [], run() { const all = [...timers.values()]; timers.clear(); all.forEach((f) => f()); } };
  const selection = { ranges: [], removeAllRanges() { this.ranges = []; }, addRange(r) { this.ranges.push(r); } };
  const document = {
    body,
    getElementById: (id) => els.get(id) || null,
    createElement: (tag) => { const e = el(''); e.tag = tag; Object.defineProperty(e, 'id', { get() { return this._id || ''; }, set(v) { this._id = v; }, configurable: true }); return e; },
    createRange: () => ({ node: null, selectNodeContents(n) { this.node = n; } }),
  };
  return {
    el, els, body, clock, selection,
    globals: {
      document,
      getSelection: () => selection,
      setTimeout: (f, ms) => { const h = next++; timers.set(h, f); clock.set.push({ h, ms }); return h; },
      clearTimeout: (h) => { clock.cleared.push(h); timers.delete(h); },
      navigator: {},
    },
  };
}
// runs fn with the fake page's globals in place, then puts the real ones back
async function within(page, fn) {
  const keep = {};
  for (const [k, v] of Object.entries(page.globals)) { keep[k] = Object.getOwnPropertyDescriptor(globalThis, k); Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); }
  try { return await fn(); } finally { for (const [k, d] of Object.entries(keep)) { if (d) Object.defineProperty(globalThis, k, d); else delete globalThis[k]; } }
}
const tick = () => new Promise((r) => setImmediate(r));

// the module, from its source (require) and from the .min.js the pages load (a vm with module.exports)
export function loadMin() {
  const src = fs.readFileSync(path.join(ROOT, 'assets/js/page-toast.min.js'), 'utf8');
  const module = { exports: {} };
  vm.runInThisContext('(function (module, exports) {' + src + '\n})')(module, module.exports);
  return module.exports;
}

export async function unit(PT, tag) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(`${tag} ${msg}`); };
  // T1-T3: the page's #toast by opacity, 1800 unless given
  {
    const p = fakePage(), t = p.el('toast');
    await within(p, () => PT.toast('Copied'));
    check(t.textContent === 'Copied' && t.style.opacity === 1, `T1: the text and opacity after toast: ${JSON.stringify(t.textContent)} ${t.style.opacity}`);
    check(p.clock.set.length === 1 && p.clock.set[0].ms === 1800, `T2: one timer of 1800 ms by default, got ${JSON.stringify(p.clock.set)}`);
    await within(p, () => PT.toast('تم النسخ', { ms: 2200 }));
    check(p.clock.cleared.includes(p.clock.set[0].h), `T3: a second call clears the first one's timer (set ${JSON.stringify(p.clock.set)}, cleared ${JSON.stringify(p.clock.cleared)})`);
    check(t.textContent === 'تم النسخ' && p.clock.set[1].ms === 2200, `T4: the second text and its own time (2200): ${t.textContent} ${p.clock.set[1] && p.clock.set[1].ms}`);
    p.clock.run();
    check(t.style.opacity === 0 && t.textContent === 'تم النسخ', `T5: hidden (opacity 0) after its time, the text kept: ${t.style.opacity}`);
  }
  // T6: an element given and a class instead of the opacity
  {
    const p = fakePage(), box = p.el('dpToast');
    await within(p, () => PT.toast('Progress cleared', { el: box, cls: 'show', ms: 2200 }));
    check(box.classList.contains('show') && box.style.opacity === undefined && p.clock.set[0].ms === 2200, `T6: the box shown by its class, no opacity, 2200 ms: ${box.className} ${box.style.opacity} ${JSON.stringify(p.clock.set)}`);
    await within(p, () => PT.toast('again', { el: box, cls: 'show', ms: 2200 }));
    p.clock.run();
    check(!box.classList.contains('show') && p.clock.cleared.includes(p.clock.set[0].h), `T6: the class taken off after its time, the first timer cleared: ${box.className}`);
  }
  // B1-B3: boxToast
  {
    const p = fakePage();
    const a = await within(p, () => PT.boxToast('mhToast', 'mh-toast'));
    check(a && a.id === 'mhToast' && a.className === 'mh-toast' && a.attrs.role === 'status' && a.tag === 'div', `B1: a div, id mhToast, class mh-toast, role status: ${a && JSON.stringify({ id: a.id, c: a.className, attrs: a.attrs, tag: a.tag })}`);
    check(p.body.children.length === 1 && p.body.children[0] === a, `B2: appended to the body once: ${p.body.children.length}`);
    const b = await within(p, () => PT.boxToast('mhToast', 'mh-toast'));
    check(b === a && p.body.children.length === 1, `B3: the second call finds it, makes none: ${p.body.children.length}`);
  }
  // C1-C4: copyText
  const copyCase = async (clipboard) => {
    const p = fakePage(), node = p.el('dax'), said = [];
    p.globals.navigator = clipboard;
    await within(p, async () => { PT.copyText('EVALUATE 1', node, { done: 'DAX copied', selected: 'Selected. Press Ctrl+C to copy', toast: (m) => said.push(m) }); await tick(); await tick(); });
    return { said, ranges: p.selection.ranges };
  };
  {
    const wrote = [];
    const r = await copyCase({ clipboard: { writeText: (t) => { wrote.push(t); return Promise.resolve(); } } });
    check(wrote.length === 1 && wrote[0] === 'EVALUATE 1' && r.said.join('|') === 'DAX copied' && !r.ranges.length, `C1 clipboard: wrote ${JSON.stringify(wrote)}, said ${JSON.stringify(r.said)}, selected ${r.ranges.length}`);
  }
  {
    const r = await copyCase({ clipboard: { writeText: () => Promise.reject(new Error('NotAllowedError')) } });
    check(r.said.join('|') === 'Selected. Press Ctrl+C to copy' && r.ranges.length === 1 && r.ranges[0].node.id === 'dax', `C2 refused clipboard: said ${JSON.stringify(r.said)}, selected ${r.ranges.map((x) => x.node.id)}`);
  }
  {
    const r = await copyCase({});
    check(r.said.join('|') === 'Selected. Press Ctrl+C to copy' && r.ranges.length === 1 && r.ranges[0].node.id === 'dax', `C3 no clipboard: said ${JSON.stringify(r.said)}, selected ${r.ranges.length}`);
    const r2 = await copyCase({ clipboard: {} });
    check(r2.said.join('|') === 'Selected. Press Ctrl+C to copy' && r2.ranges.length === 1, `C3 a clipboard without writeText: said ${JSON.stringify(r2.said)}`);
  }
  {
    // no toast given: the module's own, on the page's #toast (1800 ms)
    const p = fakePage(), t = p.el('toast'), node = p.el('json');
    p.globals.navigator = {};
    await within(p, () => PT.copyText('{}', node, { done: 'Theme JSON copied', selected: 'Selected' }));
    check(t.textContent === 'Selected' && p.clock.set.length === 1 && p.clock.set[0].ms === 1800, `C4: without a toast given, the page's #toast says it (1800 ms): ${t.textContent} ${JSON.stringify(p.clock.set)}`);
  }
  return { checks, problems };
}

export default async function () {
  const problems = []; let checks = 0;
  const add = (r) => { checks += r.checks; problems.push(...r.problems); };
  add(await unit(require(path.join(ROOT, 'assets/js/page-toast.js')), 'source'));
  add(await unit(loadMin(), 'min'));
  return { checks, problems };
}
