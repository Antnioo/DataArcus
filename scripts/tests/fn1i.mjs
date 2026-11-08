// 0.3.2 FN1I (theme-layout-ui.js mount into named steps; mcp/work/FN1I.md): parts of the Theme Generator's layout
// panel that no website suite turned red when broken on the base (5cf96356), pinned as they behave today. Made-up
// designs only.
//   N1 the font's note (fontStep fontNote): on the English page, a right-to-left layout and a font with no Arabic letters
//      say so under the font picker; a font with Arabic letters clears it
//   P1 the presets (fontStep): drawn by mount itself, before the page draws anything (six, the chosen one active)
//   A1 Advanced options (advStep advControls): with the KPI accent bar "None" it has no bar thickness or colour; with
//      "Top" it has both
import { visitor, ready } from './lib.mjs';

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const v = await visitor(browser, { viewport: [1440, 900] });
  try {
    // P1: the presets as mount leaves them, read the moment it returns
    await v.ctx.addInitScript(() => {
      let api; window.__fn1i = null;
      Object.defineProperty(window, 'DAThemeLayoutUI', { configurable: true, get: () => api,
        set: (x) => { api = x; if (x && typeof x.mount === 'function') { const m = x.mount; x.mount = function () { const r = m.apply(this, arguments);
          const p = document.getElementById('presets'); window.__fn1i = p ? [...p.querySelectorAll('.tg-preset')].map((b) => b.dataset.p + (b.classList.contains('active') ? '*' : '')) : null; return r; }; } } });
    });
    await v.pg.goto(`${url}/tools/power-bi-theme-generator.html?lang=en`, { waitUntil: 'networkidle' });
    await ready(v.pg);
    const presets = await v.pg.evaluate(() => window.__fn1i);
    const want = ['DataArcus*', 'Corporate', 'Colorblind safe', 'Desert Gulf', 'Midnight', 'Earthy'];
    check(JSON.stringify(presets) === JSON.stringify(want), `P1 mount must draw the six presets, DataArcus active, before the page draws: got ${JSON.stringify(presets)}`);

    // N1: right to left, then a font with no Arabic letters, then one with them
    await v.pg.click('#layControls button[data-l="dir"][data-v="rtl"]');
    const fonts = await v.pg.evaluate(() => { const ar = window.DAEngine.AR_FONTS, opts = [...document.querySelectorAll('#font option')].map((o) => o.value);
      return { no: opts.find((f) => !ar.includes(f)), yes: opts.find((f) => ar.includes(f)) }; });
    await v.pg.selectOption('#font', fonts.no);
    const note = await v.pg.evaluate(() => { const n = document.getElementById('fontNote'); return n ? { hidden: n.hidden, text: n.textContent } : null; });
    const wantNote = `${fonts.no} has no Arabic letters, so Arabic text will show in another font. For Arabic reports use Segoe UI, Tahoma or Arial.`;
    await v.pg.selectOption('#font', fonts.yes);
    const cleared = await v.pg.evaluate(() => { const n = document.getElementById('fontNote'); return n ? { hidden: n.hidden, text: n.textContent } : null; });
    check(!!fonts.no && note && !note.hidden && note.text === wantNote && cleared && cleared.hidden && cleared.text === '',
      `N1 a right-to-left layout in ${fonts.no} must say "${wantNote}", and ${fonts.yes} clear it: got ${JSON.stringify(note)}, then ${JSON.stringify(cleared)}`);

    // A1: Advanced options open, the KPI bar None, then Top
    const adv = () => v.pg.evaluate(() => ({ w: !!document.querySelector('#layControls .tg-adv input[data-l="kpiBarW"]'), c: !!document.querySelector('#layControls .tg-adv button[data-l="kpiBarC"]') }));
    await v.pg.click('#layControls button[data-l="kpiBar"][data-v="none"]');
    await v.pg.evaluate(() => { const d = document.querySelector('#layControls details.tg-adv'); d.open = true; });
    const none = await adv();
    await v.pg.click('#layControls button[data-l="kpiBar"][data-v="top"]');
    const top = await adv();
    check(!none.w && !none.c && top.w && top.c && !v.errs.length, `A1 Advanced options must hold the KPI bar's thickness and colour with "Top" only: None ${JSON.stringify(none)}, Top ${JSON.stringify(top)} ${v.errs.join(' | ')}`.trim());
  } finally { await v.ctx.close(); }
  return { checks, problems };
}
