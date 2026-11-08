// 0.3.2 DD2W (mcp/work/DD2W.md): one toast and one copy helper for the tool pages, assets/js/page-toast.js (their one
// home; CONTRACTS.md "Equal copies, not probed"). Every message, time, element and class as before the move.
//   T1-T6  toast on a fake document: the text, opacity 1 then 0 after ms (1800 unless given), a second call clears
//          the first one's timer, the element given, a class instead of the opacity (the boxes)
//   B1-B3  boxToast: made once (id, class, role status, the body's last child), found the second time
//   C1-C4  copyText: the clipboard path (done), a refused clipboard (the node's text selected, selected), no clipboard
//          (the same), the page's own toast used for both
//   S1     the source and the .min.js give the same answers (the pages load the .min.js)
//   L1     every page that runs a place loads page-toast.min.js before that place's script (English and Arabic)
//   X1-X3  the exam and health check boxes (exam-view 2200 ms dpToast, health-view 1800 ms mhToast) in a real page: the
//          base's own toast and boxToast + toast give the same markup byte for byte after one message, after a second
//          one and after the time; the same timer times
//   P1-P3  each #toast page (calendar, measure builder, theme generator, SVG KPI), English and Arabic: the copy button
//          with the clipboard (its own message), a refused clipboard and no clipboard (the box's text selected, "Selected.
//          Press Ctrl+C to copy" in the page's language); the toast shown (opacity 1) with the page's own time
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { ROOT, visitor } from './lib.mjs';

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

// the pages: which script runs a place, the copy button, the box it selects, the page's time and its two messages
const SELECTED = ['Selected. Press Ctrl+C to copy', 'تم التحديد. اضغط Ctrl+C للنسخ'];
export const PAGES = [
  { page: 'tools/dax-calendar-table-generator.html', script: 'calendar-generator', btn: '#copyBtn', box: 'dax', ms: 1800, done: ['DAX copied. Paste it in New table', 'تم نسخ DAX. الصقه في New table'] },
  { page: 'tools/dax-measure-builder.html', script: 'measure-builder', btn: '#copyAll', box: 'script', ms: 1800, done: ['Copied', 'تم النسخ'] },
  { page: 'tools/power-bi-theme-generator.html', script: 'theme-download-ui', btn: '#copyBtn', box: 'json', ms: 1800, done: ['Theme JSON copied', 'تم نسخ ملف السمة'] },
  { page: 'tools/svg-kpi-designer.html', script: 'svg-kpi-designer', btn: '#copyBtn', box: 'dax', ms: 2200, done: ['DAX copied. Set Data category to Image URL.', 'تم نسخ DAX. اجعل Data category = Image URL.'] },
];
// every page that loads a place, and the place's script it must come before
export const LOADS = [
  ...PAGES.map((x) => [x.page, x.script]),
  ['tools/power-bi-theme-generator.html', 'theme-generator'], ['tools/pl-300-practice-exam.html', 'exam-view'], ['tools/dp-600-practice-exam.html', 'exam-view'], ['tools/power-bi-model-health-check.html', 'health-view'], ['tools/power-bi-theme-generator-lab.html', 'theme-download-ui'], ['tools/power-bi-theme-generator-lab.html', 'theme-generator'],
];
const loadOrder = () => {
  const problems = []; let checks = 0;
  for (const [page, script] of LOADS) for (const p of [page, 'ar/' + page]) {
    if (!fs.existsSync(path.join(ROOT, p))) continue;
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8'), pt = html.search(/assets\/js\/page-toast\.min\.js\?v=/), at = html.search(new RegExp('assets/js/' + script + '\\.min\\.js\\?v='));
    checks++;
    if (at < 0 || pt < 0 || pt > at) problems.push(`L1 ${p}: page-toast.min.js ${pt < 0 ? 'is not loaded' : 'comes after ' + script + '.min.js'}`);
  }
  return { checks, problems };
};
// the clipboard as a test wants it: 'ok' writes, 'refused' rejects, 'none' is no clipboard; every timer's time kept
const CLIP = (mode) => `(() => {
  const mode = ${JSON.stringify(mode)};
  window.__wrote = []; window.__delays = [];
  const st = window.setTimeout; window.setTimeout = function (f, ms, ...a) { window.__delays.push(ms); return st.call(this, f, ms, ...a); };
  const cb = mode === 'none' ? undefined : { writeText: (t) => { window.__wrote.push(t); return mode === 'ok' ? Promise.resolve() : Promise.reject(new Error('NotAllowedError')); } };
  Object.defineProperty(Navigator.prototype, 'clipboard', { get: () => cb, configurable: true });
})();`;
async function onPage(browser, url, x, lang, mode) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(`${x.page} ${lang} ${mode}: ${msg}`); };
  const v = await visitor(browser, { viewport: [1440, 900] });
  try {
    await v.ctx.addInitScript(CLIP(mode));
    await v.pg.goto(lang === 'en' ? `${url}/${x.page}?lang=en` : `${url}/ar/${x.page}`, { waitUntil: 'networkidle' });
    await v.pg.waitForFunction((id) => window.DAPageToast && document.getElementById(id) && document.getElementById(id).textContent.length > 0, x.box, { timeout: 30000 });
    await v.pg.evaluate(() => { window.__delays = []; window.__wrote = []; getSelection().removeAllRanges(); });
    await v.pg.$eval(x.btn, (b) => b.click());
    await v.pg.waitForFunction(() => (document.getElementById('toast').textContent || '').length > 0, null, { timeout: 10000 });
    const got = await v.pg.evaluate((id) => {
      const t = document.getElementById('toast'), s = getSelection(), box = document.getElementById(id);
      return { text: t.textContent, opacity: t.style.opacity, delays: window.__delays, wrote: window.__wrote.length, selected: s.rangeCount ? s.getRangeAt(0).toString() : '', boxText: box.textContent, inBox: s.rangeCount > 0 && box.contains(s.anchorNode) };
    }, x.box);
    const k = lang === 'en' ? 0 : 1;
    if (mode === 'ok') check(got.text === x.done[k] && got.wrote === 1 && !got.selected, `P1 the clipboard: toast ${JSON.stringify(got.text)}, wanted ${JSON.stringify(x.done[k])}; wrote ${got.wrote}; selected ${got.selected.length} characters`);
    else check(got.text === SELECTED[k] && got.inBox && got.selected.trim() === got.boxText.trim(), `P${mode === 'refused' ? 2 : 3} ${mode === 'refused' ? 'a refused clipboard' : 'no clipboard'}: toast ${JSON.stringify(got.text)}, wanted ${JSON.stringify(SELECTED[k])}; #${x.box} selected: ${got.inBox} (${got.selected.length} of ${got.boxText.length} characters)`);
    check(String(got.opacity) === '1' && got.delays.includes(x.ms), `the toast shown (opacity ${got.opacity}) with the page's time ${x.ms} ms (timers set: ${got.delays.join(', ')})`);
    check(!v.errs.length, `page errors: ${v.errs.join('; ')}`);
  } finally { await v.ctx.close(); }
  return { checks, problems };
}

// the base's two box toasts (5cf96356, exam-view.js mount and health-view.js create), as they were, beside the one place
export const OLD_BOX = {
  exam: `let toastT;
    function toast(msg) {
      let t = document.getElementById('dpToast');
      if (!t) { t = document.createElement('div'); t.id = 'dpToast'; t.className = 'dp-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
    }`,
  health: `const $ = (id) => document.getElementById(id);
    let tt;
    function toast(msg) {
      let t = $('mhToast');
      if (!t) { t = document.createElement('div'); t.id = 'mhToast'; t.className = 'mh-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1800);
    }`,
};
const NEW_BOX = {
  exam: "function toast(msg) { PT.toast(msg, { el: PT.boxToast('dpToast', 'dp-toast'), cls: 'show', ms: 2200 }); }",
  health: "function toast(msg) { PT.toast(msg, { el: PT.boxToast('mhToast', 'mh-toast'), cls: 'show', ms: 1800 }); }",
};
async function boxes(browser) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const min = fs.readFileSync(path.join(ROOT, 'assets/js/page-toast.min.js'), 'utf8');
  // the same text in the place's source (exam-view.js, health-view.js) as NEW_BOX: the test runs what the page runs
  for (const [k, f] of [['exam', 'exam-view'], ['health', 'health-view']]) { checks++; if (!fs.readFileSync(path.join(ROOT, 'assets/js/' + f + '.js'), 'utf8').includes(NEW_BOX[k])) problems.push(`X0 assets/js/${f}.js no longer holds ${NEW_BOX[k]}`); }
  for (const k of ['exam', 'health']) {
    const run = async (code, withPT) => {
      const ctx = await browser.newContext(), pg = await ctx.newPage();
      try {
        await pg.setContent('<!doctype html><html><body><main>page</main></body></html>');
        if (withPT) await pg.addScriptTag({ content: min });
        return await pg.evaluate(async (code) => {
          const delays = [], st = window.setTimeout; window.setTimeout = function (f, ms, ...a) { delays.push(ms); return st.call(this, f, ms, ...a); };
          const PT = window.DAPageToast;
          const toast = new Function('PT', code + '\nreturn toast;')(PT);
          const out = [];
          toast('First message'); out.push(document.body.innerHTML);
          toast('رسالة ثانية'); out.push(document.body.innerHTML);
          await new Promise((r) => st(r, Math.max(...delays) + 300)); out.push(document.body.innerHTML);
          return { out, delays };
        }, code);
      } finally { await ctx.close(); }
    };
    const a = await run(OLD_BOX[k], false), b = await run(NEW_BOX[k], true);
    ['X1 after one message', 'X2 after a second message', 'X3 after the time'].forEach((what, i) => check(a.out[i] === b.out[i], `${k} ${what}: the markup differs: base ${a.out[i]} / now ${b.out[i]}`));
    check(JSON.stringify(a.delays) === JSON.stringify(b.delays), `${k}: the timers' times differ: base ${a.delays} / now ${b.delays}`);
  }
  return { checks, problems };
}

export default async function ({ browser, url } = {}) {
  const problems = []; let checks = 0;
  const add = (r) => { checks += r.checks; problems.push(...r.problems); };
  add(await unit(require(path.join(ROOT, 'assets/js/page-toast.js')), 'source'));
  add(await unit(loadMin(), 'min'));
  add(loadOrder());
  if (browser) add(await boxes(browser));
  if (browser) for (const x of PAGES) for (const lang of ['en', 'ar']) for (const mode of ['ok', 'refused', 'none']) add(await onPage(browser, url, x, lang, mode));
  return { checks, problems };
}
