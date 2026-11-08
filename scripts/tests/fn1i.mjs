// 0.3.2 FN1I (theme-layout-ui.js mount into named steps; mcp/work/FN1I.md): parts of the Theme Generator's layout
// panel that no website suite turned red when broken on the base (5cf96356), pinned as they behave today. Made-up
// designs only.
//   N1 the font's note (fontStep fontNote): on the English page, a right-to-left layout and a font with no Arabic letters
//      say so under the font picker; a font with Arabic letters clears it
//   P1 the presets (fontStep): drawn by mount itself, before the page draws anything (six, the chosen one active)
//   A1 Advanced options (advStep advControls): with the KPI accent bar "None" it has no bar thickness or colour; with
//      "Top" it has both
//   R1 the exact corner slider (listenersStep): with Solid visual backgrounds chosen, moving it writes the theme again
//      (its JSON changes as it moves)
//   T1 a hex box left (controlsStep): a colour that is not one says "Use a hex color like #1a2b3c"; a real one says nothing
//   U1 the files' stale marks (previewStep renderLayoutPreview): the layout table downloaded, then a size slider moved,
//      marks the table changed since its download
//   M1 the theme's name (controlsStep): kept to 60 characters in the saved design
//   S2 a layout button (listenersStep): the chart area's split set by its slider is dropped when another layout is chosen;
//      S3 the layout buttons' thumbnails never take that split (pageStep thumb)
//   C1 the glass refusal's note (controlsStep): a chart style changed afterwards clears it (glass, the default design)
//   W1 a custom page's message (layoutStep): an empty width says "Enter a whole number." in the warning's colour; W2 a
//      page size button clears it (listenersStep); W3 a custom 1000 x 700 page draws the layout buttons' thumbnails on
//      a grid 1029 wide (1000 / (700 / 720) = 1028.57, rounded: pageStep applyPage); W4 the example loaded and undone
//      clears the message (mount's clearPageMsg)
import { visitor, ready } from './lib.mjs';

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
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

    // R1: the exact corner radius slider moved
    await v.pg.click('#dlVis button[data-l="transparent"][data-v="0"]');
    const json0 = await v.pg.evaluate(() => document.getElementById('json').textContent);
    await v.pg.evaluate(() => { const r = document.querySelector('#layControls .tg-adv input[type="range"][data-l="radius"]'); r.value = r.max; r.dispatchEvent(new Event('input', { bubbles: true })); });
    const json1 = await v.pg.evaluate(() => document.getElementById('json').textContent);
    check(json0 !== json1, `R1 the corner slider must write the theme again: the JSON ${json0 === json1 ? 'did not change' : 'changed'}`);

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

    // T1: a real colour, then one that is not, left in the card colour's hex box
    const leave = (val) => v.pg.evaluate((x) => { const t = document.getElementById('toast'); t.textContent = '';
      const el = document.querySelector('#uiColors input[type="text"][data-key="u_card"]'); el.value = x; el.dispatchEvent(new Event('change', { bubbles: true })); return t.textContent; }, val);
    const good = await leave('#123456'), bad = await leave('nope');
    check(good === '' && bad === 'Use a hex color like #1a2b3c', `T1 leaving a hex box must say nothing for #123456 and "Use a hex color like #1a2b3c" for "nope": got "${good}", "${bad}"`);

    // U1: the layout table downloaded, then the KPI row's slider moved
    await Promise.all([v.pg.waitForEvent('download'), v.pg.click('#slotCsv')]);
    const before = await v.pg.evaluate(() => document.querySelector('.tg-file[data-file="csv"]').classList.contains('stale'));
    await v.pg.evaluate(() => { const r = document.querySelector('#layControls input[type="range"][data-l="kpiH"]'); r.value = String(+r.value + 4 * +r.dataset.f * 3); r.dispatchEvent(new Event('input', { bubbles: true })); });
    const after = await v.pg.evaluate(() => ({ stale: document.querySelector('.tg-file[data-file="csv"]').classList.contains('stale'), note: (document.getElementById('dlStatus') || {}).textContent || '' }));
    check(!before && after.stale && /Changed since you downloaded: Layout table/.test(after.note), `U1 the layout table must be marked changed after a slider moves: before ${before}, after ${JSON.stringify(after)}`);

    // M1: a 70-character name
    const saved = () => v.pg.evaluate(() => JSON.parse(localStorage.getItem('dataarcus-theme-generator') || '{}'));
    await v.pg.fill('#themeName', 'N'.repeat(70));
    const name = (await saved()).name || '';
    check(name === 'N'.repeat(60), `M1 the theme's name must be kept to 60 characters: got ${name.length}`);

    // S2: a layout with a split chart area, its slider moved, then another layout chosen
    const keys = await v.pg.evaluate(() => { const E = window.DAEngine, ks = Object.keys(E.LAYOUTS); return { split: ks.find((k) => E.hasSplit(E.LAYOUTS[k])), other: ks.find((k) => !E.hasSplit(E.LAYOUTS[k])) }; });
    await v.pg.click(`#layControls button[data-l="preset"][data-v="${keys.split}"]`);
    const thumbOf = () => v.pg.evaluate((k) => document.querySelector(`#layControls button[data-l="preset"][data-v="${k}"] svg`).outerHTML, keys.split);
    const t0 = await thumbOf();
    await v.pg.evaluate(() => { const r = document.querySelector('#layControls input[type="range"][data-l="split"]'); r.value = String(+r.min + 1); r.dispatchEvent(new Event('input', { bubbles: true })); });
    const withSplit = 'split' in ((await saved()).layout || {});
    const kpis = await v.pg.evaluate(() => (document.querySelector('#layControls button[data-l="kpis"]:not(.active)') || {}).dataset.v);
    await v.pg.click(`#layControls button[data-l="kpis"][data-v="${kpis}"]`);
    const t1 = await thumbOf();
    check(t0 === t1, `S3 the ${keys.split} layout button's thumbnail must not take the split its slider set: ${t0 === t1 ? 'same' : 'changed'}`);
    await v.pg.click(`#layControls button[data-l="preset"][data-v="${keys.other}"]`);
    const dropped = !('split' in ((await saved()).layout || {}));
    check(!!keys.split && withSplit && dropped, `S2 choosing layout ${keys.other} must drop the split set on ${keys.split}: set ${withSplit}, dropped ${dropped}`);

    // W1: a custom page, its width emptied
    await v.pg.click('#pageSize button[data-l="page"][data-v="custom"]');
    await v.pg.evaluate(() => { const el = document.querySelector('#pageSize input[data-l="pageW"]'); el.value = ''; el.dispatchEvent(new Event('change', { bubbles: true })); });
    const msg = await v.pg.evaluate(() => { const m = document.querySelector('#pageSize small[role="status"]'); return m ? { cls: m.className, text: m.textContent } : null; });
    check(msg && /\btg-warn\b/.test(msg.cls) && msg.text === 'Enter a whole number.', `W1 an empty width must say "Enter a whole number." as a warning: got ${JSON.stringify(msg)}`);
    await v.pg.click('#pageSize button[data-l="page"][data-v="1280x720"]');
    await v.pg.click('#pageSize button[data-l="page"][data-v="custom"]');
    const msg2 = await v.pg.evaluate(() => { const m = document.querySelector('#pageSize small[role="status"]'); return m ? m.textContent : null; });
    check(msg2 === 'Match Format page › Canvas settings › Custom in Power BI.', `W2 a page size button must clear the message: got ${JSON.stringify(msg2)}`);
    const typed = (k, x) => v.pg.evaluate(([key, val]) => { const el = document.querySelector(`#pageSize input[data-l="${key}"]`); el.value = val; el.dispatchEvent(new Event('change', { bubbles: true })); }, [k, x]);
    await typed('pageW', '1000'); await typed('pageH', '700');
    const vb = await v.pg.evaluate(() => [...document.querySelectorAll('#layControls .tg-lay-b svg')].map((x) => x.getAttribute('viewBox')));
    check(vb.length > 0 && vb.every((x) => x === '0 0 1029 720'), `W3 a 1000 x 700 page's thumbnails must be drawn 1029 wide: got ${JSON.stringify([...new Set(vb)])}`);
    await typed('pageW', '');
    const shown = await v.pg.evaluate(() => document.querySelector('#pageSize small[role="status"]').textContent);
    await v.pg.click('#exampleBtn');
    await v.pg.click('#exampleUndo');
    const back = await v.pg.evaluate(() => { const m = document.querySelector('#pageSize small[role="status"]'); return m ? m.textContent : null; });
    check(shown === 'Enter a whole number.' && back === 'Match Format page › Canvas settings › Custom in Power BI.', `W4 the example and its undo must clear the page's message (the page's clearPageMsg): shown "${shown}", after "${back}"`);
  } finally { await v.ctx.close(); }

  // C1: glass (the default design), a text colour glass cannot keep readable, then a chart style changed
  const g = await visitor(browser, { viewport: [1440, 900], plainDesign: false });
  try {
    await g.pg.goto(`${url}/tools/power-bi-theme-generator.html?lang=en`, { waitUntil: 'networkidle' });
    await ready(g.pg);
    const noteOf = () => g.pg.evaluate(() => [...document.querySelectorAll('.tg-glassnote')].map((p) => p.textContent).join(' | '));
    await g.pg.evaluate(() => { const el = document.querySelector('#uiColors input[type="text"][data-key="u_text"]'); el.value = '#30364a'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    const refused = await noteOf();
    await g.pg.selectOption('#csLabels', 'on');
    const after = await noteOf();
    check(/^Plain look: with these colours the glass look can't keep every text readable/.test(refused) && !/Plain look/.test(after) && !g.errs.length,
      `C1 the glass refusal's note must show, then go when a chart style changes: got "${refused.slice(0, 80)}", then "${after.slice(0, 80)}" ${g.errs.join(' | ')}`.trim());
  } finally { await g.ctx.close(); }
  return { checks, problems };
}
